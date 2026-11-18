-- Shared folders (docs/Technical/collaboration-design.md, section 8). A shared folder is a group of
-- shared notes: every note in it stays an ordinary shared note with its own key, document and
-- note_members rows. The folder adds:
--
--   1. a folder key (FK) per epoch, held by the folder's members as a note key is held by a note's
--      (folder_members.key_wrap to their identity, or the link's box after a link join; self_wrap
--      under their data key, context `folderkey:<root>:<epoch>`);
--   2. the folder's tree, names sealed under FK (shared_folders.name_ct, `amb3f`), and which folder
--      each note is in (shared_notes.folder_id, folder_root);
--   3. each note's key sealed under FK (shared_notes.folder_wrap, `amb3w`), so a folder member who
--      isn't in a note yet opens its key and joins it themselves (collab_folder_join_note); their
--      note_members row says so (via_folder = the root).
--
-- The server sees who is in which folder with which role, how many folders and notes it has and
-- how they nest, never a name or a key. Every function here is the API: no table is readable or
-- writable by a client directly.
--
-- Additive: new tables and functions; new nullable columns on shared_notes and note_members; the
-- reason check on note_access_ended gains 'moved'; the access-ended trigger honours a reason set
-- for the transaction (pane.access_ended); collab_forget_on_start_fresh also ends the account's
-- folders. Safe to run again: `if not exists`, `create or replace`, or a guarded drop first.

-- MARK: Tables

create table if not exists public.shared_folders (
  id uuid primary key,
  -- The shared folder this one is in: its own id for the root.
  root_id uuid not null references public.shared_folders (id) on delete cascade,
  parent_id uuid references public.shared_folders (id) on delete cascade,
  -- The shared folder's owner, on every row of its tree (subfolders go with the root).
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- FK's generation (meaningful on the root row).
  epoch int not null default 1 check (epoch >= 1),
  -- `amb3f.<epoch>.<b64 nonce ‖ ct ‖ tag>`, AES-256-GCM under FK, AAD `amb3f|<root>|<epoch>|<folder>`.
  name_ct text check (name_ct is null or (name_ct ~ '^amb3f\.[0-9]+\.[A-Za-z0-9+/]+={0,2}$' and octet_length(name_ct) < 4000)),
  sort_index float8 not null default 0,
  -- On the root: someone left (or was removed) since the last key; the owner's next device makes a
  -- new FK (collab_folder_rekey), which clears it.
  rekey_after timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_folders_root_shape check ((id = root_id and parent_id is null) or (id <> root_id and parent_id is not null))
);
create index if not exists shared_folders_root on public.shared_folders (root_id);

create table if not exists public.folder_members (
  -- The root of the shared folder.
  folder_id uuid not null references public.shared_folders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  epoch int not null,
  -- FK sealed to the member's identity key (`amb3k`, the root's id in place of a note's), or, after
  -- a link join and until the next key, the link's own box (`amb2`, context `invite:<link id>`).
  key_wrap text not null check ((key_wrap ~ '^amb3k\.[A-Za-z0-9+/]+={0,2}$' or key_wrap ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$') and octet_length(key_wrap) < 400),
  -- FK under the member's data key once they accepted: `amb2`, context `folderkey:<root>:<epoch>`.
  self_wrap text check (self_wrap is null or (self_wrap ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(self_wrap) < 400)),
  -- Whose identity sealed key_wrap; null for a link join (the link's box isn't from anyone).
  wrapped_by uuid references auth.users (id) on delete cascade,
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (folder_id, user_id)
);
create index if not exists folder_members_user on public.folder_members (user_id);

create table if not exists public.folder_invite_links (
  -- The link's id, `/s/<id>#<secret>` as a note's link (22 base64url characters); a UUID is taken too.
  id text primary key check (id ~ '^[A-Za-z0-9_-]{22}$' or id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'),
  folder_id uuid not null references public.shared_folders (id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  epoch int not null,
  answer_hash text not null check (answer_hash ~ '^[0-9a-f]{64}$'),
  -- FK sealed under the link's `invite key`: `amb2`, context `invite:<id>`.
  key_wrap text not null check (key_wrap ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(key_wrap) < 400),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create unique index if not exists folder_invite_links_one on public.folder_invite_links (folder_id);

-- Why someone's folder membership ended, so their devices can say so (collab_folder_access_ended).
create table if not exists public.folder_access_ended (
  folder_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('removed', 'unshared', 'left')),
  by_user uuid references auth.users (id) on delete set null,
  at timestamptz not null default now(),
  primary key (folder_id, user_id)
);

alter table public.shared_notes add column if not exists folder_id uuid;
alter table public.shared_notes add column if not exists folder_root uuid;
-- `amb3w.<FK epoch>.<note epoch>.<b64 nonce ‖ ct ‖ tag>`, NK under FK, AAD `amb3w|<root>|<epoch>|<note>|<note epoch>`.
alter table public.shared_notes add column if not exists folder_wrap text;
alter table public.shared_notes add column if not exists folder_moved_at timestamptz;
alter table public.shared_notes drop constraint if exists shared_notes_folder_wrap_check;
alter table public.shared_notes add constraint shared_notes_folder_wrap_check
  check (folder_wrap is null or (folder_wrap ~ '^amb3w\.[0-9]+\.[0-9]+\.[A-Za-z0-9+/]+={0,2}$' and octet_length(folder_wrap) < 400));
create index if not exists shared_notes_folder_root on public.shared_notes (folder_root) where folder_root is not null;

-- The root a member came into the note through; null for a direct member.
alter table public.note_members add column if not exists via_folder uuid;
create index if not exists note_members_via_folder on public.note_members (via_folder) where via_folder is not null;

-- A note taken out of its shared folder ends access with reason 'moved'.
alter table public.note_access_ended drop constraint if exists note_access_ended_reason_check;
alter table public.note_access_ended add constraint note_access_ended_reason_check check (reason in ('removed', 'unshared', 'left', 'moved'));

alter table public.shared_folders enable row level security;
alter table public.folder_members enable row level security;
alter table public.folder_invite_links enable row level security;
alter table public.folder_access_ended enable row level security;
revoke all on public.shared_folders, public.folder_members, public.folder_invite_links, public.folder_access_ended from anon, authenticated;

-- MARK: Access ended, with a reason the caller sets

-- As 20261112120000_collab_access_ended, and a function that ends access for a reason of its own
-- (moved out of a shared folder, the folder unshared) sets `pane.access_ended` for the transaction.
create or replace function public.collab_note_access_ended() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := auth.uid();
  why text := nullif(current_setting('pane.access_ended', true), '');
begin
  if old.role = 'owner' and why is null then return old; end if;
  if not exists (select 1 from auth.users where id = old.user_id) then return old; end if;
  if why is not null and why in ('removed', 'unshared', 'left', 'moved') then
    null;
  elsif who is not null and who = old.user_id then
    why := 'left';
  elsif not exists (select 1 from public.shared_notes where id = old.note_id) then
    why := 'unshared';
  else
    why := 'removed';
  end if;
  insert into public.note_access_ended (note_id, user_id, reason, by_user)
  values (old.note_id, old.user_id, why,
          case when why = 'left' or not exists (select 1 from auth.users where id = who) then null else who end)
  on conflict (note_id, user_id) do update set reason = excluded.reason, by_user = excluded.by_user, at = now();
  return old;
end $$;
revoke all on function public.collab_note_access_ended() from public, anon, authenticated;

create or replace function public.collab_folder_access_ended_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := auth.uid();
  why text := nullif(current_setting('pane.folder_access_ended', true), '');
begin
  if old.role = 'owner' then return old; end if;
  if not exists (select 1 from auth.users where id = old.user_id) then return old; end if;
  if why is not null and why in ('removed', 'unshared', 'left') then
    null;
  elsif who is not null and who = old.user_id then
    why := 'left';
  elsif not exists (select 1 from public.shared_folders where id = old.folder_id) then
    why := 'unshared';
  else
    why := 'removed';
  end if;
  insert into public.folder_access_ended (folder_id, user_id, reason, by_user)
  values (old.folder_id, old.user_id, why,
          case when why = 'left' or not exists (select 1 from auth.users where id = who) then null else who end)
  on conflict (folder_id, user_id) do update set reason = excluded.reason, by_user = excluded.by_user, at = now();
  return old;
end $$;
revoke all on function public.collab_folder_access_ended_row() from public, anon, authenticated;
drop trigger if exists collab_folder_access_ended on public.folder_members;
create trigger collab_folder_access_ended after delete on public.folder_members
  for each row execute function public.collab_folder_access_ended_row();

create or replace function public.collab_folder_access_back() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.folder_access_ended where folder_id = new.folder_id and user_id = new.user_id;
  return new;
end $$;
revoke all on function public.collab_folder_access_back() from public, anon, authenticated;
drop trigger if exists collab_folder_access_back on public.folder_members;
create trigger collab_folder_access_back after insert on public.folder_members
  for each row execute function public.collab_folder_access_back();

-- Why the caller's folder memberships ended. Nothing for a folder they're in again.
create or replace function public.collab_folder_access_ended()
returns table (root uuid, reason text, at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.folder_id, e.reason, e.at from public.folder_access_ended e
  where e.user_id = auth.uid()
    and not exists (select 1 from public.folder_members m where m.folder_id = e.folder_id and m.user_id = auth.uid())
  order by e.at desc
$$;

-- MARK: Roles

-- Someone's role in a shared folder, or null. Answers only about a folder the caller is in (about
-- themselves or a fellow member), as collab_role does for notes, and to the server's own roles.
create or replace function public.collab_folder_role(p_root uuid, p_user uuid default auth.uid()) returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.folder_members m
  where m.folder_id = p_root and m.user_id = p_user
    and (auth.uid() is null
         or p_user = auth.uid()
         or exists (select 1 from public.folder_members me where me.folder_id = p_root and me.user_id = auth.uid()))
$$;

-- Whether the caller is an accepted member (they hold FK): for the Realtime channel.
create or replace function public.collab_folder_joined(p_root uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.folder_members m where m.folder_id = p_root and m.user_id = auth.uid() and m.accepted_at is not null)
$$;

-- The caller's role, refused unless they're an accepted member with at least `p_need`
-- ('viewer', 'editor' or 'owner'). Internal: the functions below call it.
create or replace function public.collab_folder_need(p_root uuid, p_need text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  m public.folder_members;
begin
  select * into m from public.folder_members where folder_id = p_root and user_id = auth.uid();
  if m.user_id is null or m.accepted_at is null then
    raise exception 'You''re not in this shared folder.' using errcode = '42501', hint = 'not_member';
  end if;
  if p_need = 'owner' and m.role <> 'owner' then
    raise exception 'Only the owner can do that in this shared folder.' using errcode = '42501', hint = 'not_owner';
  end if;
  if p_need = 'editor' and m.role = 'viewer' then
    raise exception 'You can view this shared folder but not change it.' using errcode = '42501', hint = 'read_only';
  end if;
  return m.role;
end $$;
revoke all on function public.collab_folder_need(uuid, text) from public, anon, authenticated;

-- The root's epoch, held for this transaction; raises when p_root isn't a shared folder's root.
create or replace function public.collab_folder_epoch(p_root uuid, p_lock boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare
  e int;
begin
  if p_lock then
    select epoch into e from public.shared_folders where id = p_root and root_id = p_root for update;
  else
    select epoch into e from public.shared_folders where id = p_root and root_id = p_root;
  end if;
  if e is null then raise exception 'That shared folder is gone.' using errcode = 'P0002', hint = 'no_folder'; end if;
  return e;
end $$;
revoke all on function public.collab_folder_epoch(uuid, boolean) from public, anon, authenticated;

-- The FK epoch a box names (`amb3f.<e>.…`, `amb3w.<e>.<n>.…`), and a note wrap's note epoch.
create or replace function public.collab_box_epoch(p_box text) returns int
language sql immutable set search_path = '' as $$ select nullif(split_part(p_box, '.', 2), '')::int $$;
create or replace function public.collab_wrap_note_epoch(p_box text) returns int
language sql immutable set search_path = '' as $$ select nullif(split_part(p_box, '.', 3), '')::int $$;

-- MARK: Internal: a note's folder members leave it

-- Every via_folder membership of `p_note` through `p_root` ends (except `p_except`'s), with
-- `p_reason` recorded; the note then gets a new key from its owner's next device (rekey_after).
-- With p_detach the note also leaves the folder (its folder columns cleared).
create or replace function public.collab_folder_end_note(p_note uuid, p_root uuid, p_reason text, p_except uuid, p_detach boolean) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
  had text := coalesce(current_setting('pane.access_ended', true), '');
begin
  perform set_config('pane.access_ended', p_reason, true);
  delete from public.note_members m
  where m.note_id = p_note and m.via_folder = p_root and m.role <> 'owner' and m.user_id is distinct from p_except;
  get diagnostics n = row_count;
  perform set_config('pane.access_ended', had, true);
  if n > 0 then
    update public.shared_notes set rekey_after = coalesce(rekey_after, now()) where id = p_note;
  end if;
  if p_detach then
    update public.shared_notes set folder_id = null, folder_root = null, folder_wrap = null, folder_moved_at = now(), updated_at = now()
    where id = p_note and folder_root = p_root;
  end if;
  return n;
end $$;
revoke all on function public.collab_folder_end_note(uuid, uuid, text, uuid, boolean) from public, anon, authenticated;

-- A member goes from a folder (removed or left): their via_folder note memberships end, the notes
-- they made leave the folder with them (everyone else's via_folder rows to those end as 'moved'),
-- their folder row goes, and the folder wants a new key.
create or replace function public.collab_folder_drop_member(p_root uuid, p_user uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  n record;
  had text := coalesce(current_setting('pane.access_ended', true), '');
  hadf text := coalesce(current_setting('pane.folder_access_ended', true), '');
begin
  perform set_config('pane.access_ended', p_reason, true);
  update public.shared_notes s set rekey_after = coalesce(s.rekey_after, now())
  where s.folder_root = p_root and exists (select 1 from public.note_members m where m.note_id = s.id and m.user_id = p_user and m.via_folder = p_root);
  delete from public.note_members m using public.shared_notes s
  where s.id = m.note_id and s.folder_root = p_root and m.user_id = p_user and m.via_folder = p_root and m.role <> 'owner';
  perform set_config('pane.access_ended', had, true);
  for n in select id from public.shared_notes where folder_root = p_root and owner_id = p_user loop
    perform public.collab_folder_end_note(n.id, p_root, 'moved', null, true);
  end loop;
  perform set_config('pane.folder_access_ended', p_reason, true);
  delete from public.folder_members where folder_id = p_root and user_id = p_user and role <> 'owner';
  perform set_config('pane.folder_access_ended', hadf, true);
  update public.shared_folders set rekey_after = coalesce(rekey_after, now()), updated_at = now() where id = p_root;
end $$;
revoke all on function public.collab_folder_drop_member(uuid, uuid, text) from public, anon, authenticated;

-- A root gone however it went (collab_unshare_folder, the owner's Start fresh or account deletion):
-- every via_folder membership of its notes ends as 'unshared' and the notes leave it.
create or replace function public.collab_folder_root_gone() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n record;
begin
  for n in select id from public.shared_notes where folder_root = old.id loop
    perform public.collab_folder_end_note(n.id, old.id, 'unshared', null, true);
  end loop;
  return null;
end $$;
revoke all on function public.collab_folder_root_gone() from public, anon, authenticated;
drop trigger if exists shared_folders_root_gone on public.shared_folders;
create trigger shared_folders_root_gone after delete on public.shared_folders
  for each row when (old.id = old.root_id) execute function public.collab_folder_root_gone();

-- MARK: Sharing a folder, and its tree

-- The owner shares a folder: its root row (the folder's own id, its name sealed under FK at epoch
-- 1) and the owner's membership, accepted. Sent again with the same wraps it changes nothing;
-- another account's folder with this id is refused.
create or replace function public.collab_share_folder(p_root uuid, p_key_wrap text, p_self_wrap text, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  f public.shared_folders;
  m public.folder_members;
begin
  perform public.pane_take('write');
  if p_name is null or public.collab_box_epoch(p_name) is distinct from 1 then
    raise exception 'The folder''s name must be sealed for the first key.' using errcode = '22023', hint = 'bad_name';
  end if;
  if p_self_wrap is null then raise exception 'The owner''s own key is missing.' using errcode = '22023'; end if;
  select * into f from public.shared_folders where id = p_root;
  if f.id is not null then
    if f.owner_id <> auth.uid() or f.root_id <> f.id then
      raise exception 'That folder is someone else''s.' using errcode = '42501', hint = 'not_owner';
    end if;
    select * into m from public.folder_members where folder_id = p_root and user_id = auth.uid();
    if m.key_wrap = p_key_wrap and m.self_wrap = p_self_wrap then return; end if;
    raise exception 'This folder is shared already.' using errcode = '22023', hint = 'already_shared';
  end if;
  insert into public.shared_folders (id, root_id, parent_id, owner_id, epoch, name_ct)
  values (p_root, p_root, null, auth.uid(), 1, p_name);
  insert into public.folder_members (folder_id, user_id, role, epoch, key_wrap, self_wrap, wrapped_by, invited_by, accepted_at)
  values (p_root, auth.uid(), 'owner', 1, p_key_wrap, p_self_wrap, auth.uid(), auth.uid(), now());
end $$;

-- Makes, renames, moves or brings back a folder of the tree (editors and the owner). p_folder =
-- p_root renames the root (p_parent null). Otherwise the parent is a live folder of the same root,
-- never the folder itself or one inside it. The name is sealed for the root's current key.
create or replace function public.collab_folder_put(p_root uuid, p_folder uuid, p_parent uuid, p_name text, p_sort float8) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e int;
  f public.shared_folders;
  p public.shared_folders;
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'editor');
  e := public.collab_folder_epoch(p_root);
  if p_name is null or public.collab_box_epoch(p_name) is distinct from e then
    raise exception 'The folder''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  if p_folder = p_root then
    if p_parent is not null then raise exception 'The shared folder itself has no parent here.' using errcode = '22023', hint = 'root_parent'; end if;
    update public.shared_folders set name_ct = p_name, sort_index = coalesce(p_sort, sort_index), updated_at = now() where id = p_root;
    return;
  end if;
  select * into p from public.shared_folders where id = p_parent;
  if p.id is null or p.root_id <> p_root or p.deleted_at is not null then
    raise exception 'That folder isn''t in this shared folder.' using errcode = '22023', hint = 'bad_parent';
  end if;
  select * into f from public.shared_folders where id = p_folder;
  if f.id is not null and f.root_id <> p_root then
    raise exception 'That folder is in another shared folder.' using errcode = '22023', hint = 'other_folder';
  end if;
  if f.id is not null and exists (
      with recursive up(id, parent_id) as (
        select s.id, s.parent_id from public.shared_folders s where s.id = p_parent
        union all
        select s.id, s.parent_id from public.shared_folders s join up on s.id = up.parent_id)
      select 1 from up where up.id = p_folder) then
    raise exception 'A folder can''t go inside itself.' using errcode = '22023', hint = 'cycle';
  end if;
  if f.id is null then
    if (select count(*) from public.shared_folders where root_id = p_root) >= 2000 then
      raise exception 'This shared folder has as many folders as it can hold.' using errcode = '54000', hint = 'too_many';
    end if;
    insert into public.shared_folders (id, root_id, parent_id, owner_id, epoch, name_ct, sort_index)
    select p_folder, p_root, p_parent, r.owner_id, e, p_name, coalesce(p_sort, 0) from public.shared_folders r where r.id = p_root;
  else
    update public.shared_folders set parent_id = p_parent, name_ct = p_name, sort_index = coalesce(p_sort, sort_index),
      deleted_at = null, updated_at = now()
    where id = p_folder;
  end if;
end $$;

-- A subfolder and everything inside it deleted for everyone (kept 30 days in the listing, so
-- devices see it go). Never the root: that's collab_unshare_folder. Notes in it stay where they
-- are on the server; the device that deleted the folder moves or removes them.
create or replace function public.collab_folder_drop(p_root uuid, p_folder uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'editor');
  if p_folder = p_root then
    raise exception 'The shared folder itself is stopped with Stop Sharing.' using errcode = '22023', hint = 'root';
  end if;
  if not exists (select 1 from public.shared_folders where id = p_folder and root_id = p_root) then
    raise exception 'That folder isn''t in this shared folder.' using errcode = 'P0002', hint = 'no_folder';
  end if;
  with recursive down(id) as (
    select p_folder
    union all
    select s.id from public.shared_folders s join down on s.parent_id = down.id where s.root_id = p_root)
  update public.shared_folders s set deleted_at = now(), updated_at = now()
  from down where s.id = down.id and s.deleted_at is null;
end $$;

-- Every folder of the tree, the root included, and those deleted in the last 30 days. Members only.
create or replace function public.collab_folder_folders(p_root uuid)
returns table (id uuid, parent_id uuid, name text, sort_index float8, deleted boolean)
language sql stable security definer set search_path = '' as $$
  select f.id, f.parent_id, f.name_ct, f.sort_index, f.deleted_at is not null
  from public.shared_folders f
  where f.root_id = p_root and public.collab_folder_role(p_root) is not null
    and (f.deleted_at is null or f.deleted_at > now() - interval '30 days')
  order by f.parent_id nulls first, f.sort_index, f.created_at
$$;

-- Every note in the tree, with its key under FK; `joined` says whether the caller is in it.
create or replace function public.collab_folder_notes(p_root uuid)
returns table (note_id uuid, folder_id uuid, folder_wrap text, owner_id uuid, note_epoch int, joined boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.folder_id, s.folder_wrap, s.owner_id, s.epoch,
    exists (select 1 from public.note_members m where m.note_id = s.id and m.user_id = auth.uid())
  from public.shared_notes s
  where s.folder_root = p_root and public.collab_folder_role(p_root) is not null
  order by s.created_at
$$;

-- MARK: Members

-- The caller's shared folders, with their wraps.
create or replace function public.collab_folder_memberships()
returns table (root uuid, role text, epoch int, key_wrap text, wrapped_by uuid, self_wrap text, invited_by uuid,
  accepted_at timestamptz, owner_id uuid, rekey_after timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.folder_id, m.role, m.epoch, m.key_wrap, m.wrapped_by, m.self_wrap, m.invited_by, m.accepted_at, f.owner_id, f.rekey_after
  from public.folder_members m join public.shared_folders f on f.id = m.folder_id
  where m.user_id = auth.uid()
  order by m.invited_at
$$;

-- Who is in a shared folder, as collab_members says it for a note: never a wrap.
create or replace function public.collab_folder_members(p_root uuid)
returns table (user_id uuid, role text, display_name text, avatar_path text, public_key text, accepted boolean)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, p.display_name, p.avatar_path, k.public_key, m.accepted_at is not null
  from public.folder_members m
  left join public.profiles p on p.user_id = m.user_id
  left join public.identity_keys k on k.user_id = m.user_id
  where m.folder_id = p_root and public.collab_folder_role(p_root) is not null
  order by m.invited_at
$$;

-- The member opened FK and sealed it under their data key for this epoch.
create or replace function public.collab_folder_accept(p_root uuid, p_epoch int, p_self_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  have int;
begin
  perform public.pane_take('write');
  select epoch into have from public.folder_members where folder_id = p_root and user_id = auth.uid();
  if have is null then raise exception 'That invitation is gone.' using errcode = 'P0002', hint = 'not_member'; end if;
  if have <> p_epoch then
    raise exception 'The folder''s key changed. Open it again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  update public.folder_members set self_wrap = p_self_wrap, accepted_at = coalesce(accepted_at, now())
  where folder_id = p_root and user_id = auth.uid();
end $$;

-- The owner changes what a member can do; their notes through the folder follow.
create or replace function public.collab_folder_set_role(p_root uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'owner');
  if p_role is null or p_role not in ('editor', 'viewer') then raise exception 'Unknown role.' using errcode = '22023'; end if;
  if p_user is null or p_user = auth.uid() then
    raise exception 'The owner''s own role can''t change.' using errcode = '22023', hint = 'owner_row';
  end if;
  update public.folder_members set role = p_role where folder_id = p_root and user_id = p_user and role <> 'owner';
  if not found then raise exception 'They''re not in this shared folder.' using errcode = '42501', hint = 'not_member'; end if;
  update public.note_members set role = p_role where user_id = p_user and via_folder = p_root and role <> 'owner';
end $$;

-- The owner removes someone (p_user null: only asks for a new key, as Reset Link). Their folder
-- membership and every note membership through it end ('removed'), the notes they made leave the
-- folder with them, the link stops (it would let them back), and the folder and those notes are
-- marked for a new key: the owner's device runs collab_folder_rekey, each note's owner collab_remove.
create or replace function public.collab_folder_remove(p_root uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'owner');
  perform public.collab_folder_epoch(p_root, true);
  if p_user is not null then
    if p_user = auth.uid() then raise exception 'The owner can''t remove themselves.' using errcode = '22023'; end if;
    if not exists (select 1 from public.folder_members where folder_id = p_root and user_id = p_user) then
      raise exception 'They''re not in this shared folder.' using errcode = '42501', hint = 'not_member';
    end if;
    perform public.collab_folder_drop_member(p_root, p_user, 'removed');
  else
    update public.shared_folders set rekey_after = coalesce(rekey_after, now()) where id = p_root;
  end if;
  delete from public.folder_invite_links where folder_id = p_root;
end $$;

-- A member leaves (Leave Folder). As a removal, reason 'left'. The owner can't leave.
create or replace function public.collab_folder_leave(p_root uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r text;
begin
  perform public.pane_take('write');
  select role into r from public.folder_members where folder_id = p_root and user_id = auth.uid();
  if r is null then raise exception 'You''re not in this shared folder.' using errcode = '42501', hint = 'not_member'; end if;
  if r = 'owner' then raise exception 'The owner can''t leave their own shared folder.' using errcode = '22023'; end if;
  perform public.collab_folder_epoch(p_root, true);
  perform public.collab_folder_drop_member(p_root, auth.uid(), 'left');
end $$;

-- A new folder key. The owner's device made FK' for epoch + 1 and sends, in one call:
--   p_wraps       [{user_id, key_wrap}]: FK' sealed to every other member (refused if one is missing);
--                 the owner's own row may be in it too;
--   p_self_wrap   FK' under the owner's data key;
--   p_note_wraps  [{note_id, folder_wrap}]: each note's key under FK'. A note left out keeps its old
--                 wrap until a member of it rewraps it (collab_folder_note_rewrap);
--   p_names       [{id, name}]: the folders' names sealed under FK' (optional; a folder left out
--                 keeps its old box, readable only by those who had the old key).
-- Every member's self_wrap is cleared (they accept again for the new epoch; accepted_at stays),
-- the link stops, and rekey_after clears.
create or replace function public.collab_folder_rekey(p_root uuid, p_epoch int, p_wraps jsonb, p_self_wrap text, p_note_wraps jsonb, p_names jsonb default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e int;
  others int;
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'owner');
  e := public.collab_folder_epoch(p_root, true);
  if p_epoch is distinct from e + 1 then
    raise exception 'The folder''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  if p_self_wrap is null then raise exception 'The owner''s own key is missing.' using errcode = '22023', hint = 'wraps_incomplete'; end if;
  select count(*) into others from public.folder_members where folder_id = p_root and user_id <> auth.uid();
  if (select count(distinct m.user_id) from jsonb_array_elements(coalesce(p_wraps, '[]'::jsonb)) w
      join public.folder_members m on m.folder_id = p_root and m.user_id = (w->>'user_id')::uuid and m.user_id <> auth.uid()) <> others then
    raise exception 'Every remaining member needs the new key.' using errcode = '22023', hint = 'wraps_incomplete';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_note_wraps, '[]'::jsonb)) w
             left join public.shared_notes s on s.id = (w->>'note_id')::uuid and s.folder_root = p_root
             where s.id is null or public.collab_box_epoch(w->>'folder_wrap') is distinct from p_epoch
               or public.collab_wrap_note_epoch(w->>'folder_wrap') is distinct from s.epoch) then
    raise exception 'A note''s key isn''t sealed for the new folder key.' using errcode = '22023', hint = 'bad_wrap';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_names, '[]'::jsonb)) w
             left join public.shared_folders f on f.id = (w->>'id')::uuid and f.root_id = p_root
             where f.id is null or public.collab_box_epoch(w->>'name') is distinct from p_epoch) then
    raise exception 'A folder''s name isn''t sealed for the new folder key.' using errcode = '22023', hint = 'bad_name';
  end if;
  update public.folder_members m set key_wrap = w->>'key_wrap', wrapped_by = auth.uid(), self_wrap = null, epoch = p_epoch
  from jsonb_array_elements(coalesce(p_wraps, '[]'::jsonb)) w
  where m.folder_id = p_root and m.user_id = (w->>'user_id')::uuid and m.user_id <> auth.uid();
  update public.folder_members m set epoch = p_epoch, self_wrap = p_self_wrap, wrapped_by = auth.uid(),
    key_wrap = coalesce((select w->>'key_wrap' from jsonb_array_elements(coalesce(p_wraps, '[]'::jsonb)) w where (w->>'user_id')::uuid = auth.uid() limit 1), m.key_wrap)
  where m.folder_id = p_root and m.user_id = auth.uid();
  update public.shared_notes s set folder_wrap = w->>'folder_wrap', updated_at = now()
  from jsonb_array_elements(coalesce(p_note_wraps, '[]'::jsonb)) w
  where s.id = (w->>'note_id')::uuid and s.folder_root = p_root;
  update public.shared_folders f set name_ct = w->>'name', updated_at = now()
  from jsonb_array_elements(coalesce(p_names, '[]'::jsonb)) w
  where f.id = (w->>'id')::uuid and f.root_id = p_root;
  update public.shared_folders set epoch = p_epoch, rekey_after = null, updated_at = now() where id = p_root;
  delete from public.folder_invite_links where folder_id = p_root;
end $$;

-- The owner stops sharing the folder. Everyone's note memberships through it end ('unshared': the
-- owner's own ones to notes others made too, which leave with their makers), every note leaves the
-- folder, the tree and every membership go (their folder access ends 'unshared'). The owner's own
-- notes stay shared notes with whoever is in them directly; the owner's device unshares them.
create or replace function public.collab_unshare_folder(p_root uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  hadf text := coalesce(current_setting('pane.folder_access_ended', true), '');
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'owner');
  perform public.collab_folder_epoch(p_root, true);
  perform set_config('pane.folder_access_ended', 'unshared', true);
  -- The root's delete trigger (collab_folder_root_gone) ends the notes' memberships.
  delete from public.shared_folders where id = p_root;
  perform set_config('pane.folder_access_ended', hadf, true);
end $$;

-- MARK: Notes in a shared folder

-- A note goes into a folder of the tree, its key sealed under FK. The caller is an accepted editor
-- (or owner) of both the note and the folder. A note is in one shared folder at a time.
create or replace function public.collab_folder_note_add(p_root uuid, p_note uuid, p_folder uuid, p_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e int;
  s public.shared_notes;
  r text;
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'editor');
  e := public.collab_folder_epoch(p_root);
  select role into r from public.note_members where note_id = p_note and user_id = auth.uid() and accepted_at is not null;
  if r is null then raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member'; end if;
  if r = 'viewer' then raise exception 'You can view this note but not change it.' using errcode = '42501', hint = 'read_only'; end if;
  select * into s from public.shared_notes where id = p_note for update;
  if s.folder_root is not null and s.folder_root <> p_root then
    raise exception 'That note is in another shared folder.' using errcode = '22023', hint = 'other_folder';
  end if;
  if not exists (select 1 from public.shared_folders where id = p_folder and root_id = p_root and deleted_at is null) then
    raise exception 'That folder isn''t in this shared folder.' using errcode = '22023', hint = 'bad_folder';
  end if;
  if p_wrap is null or public.collab_box_epoch(p_wrap) is distinct from e or public.collab_wrap_note_epoch(p_wrap) is distinct from s.epoch then
    raise exception 'The key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  update public.shared_notes set folder_id = p_folder, folder_root = p_root, folder_wrap = p_wrap, folder_moved_at = now(), updated_at = now()
  where id = p_note;
end $$;

-- A note moves between folders of the same shared folder, for everyone.
create or replace function public.collab_folder_note_move(p_root uuid, p_note uuid, p_folder uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'editor');
  if not exists (select 1 from public.shared_folders where id = p_folder and root_id = p_root and deleted_at is null) then
    raise exception 'That folder isn''t in this shared folder.' using errcode = '22023', hint = 'bad_folder';
  end if;
  update public.shared_notes set folder_id = p_folder, folder_moved_at = now(), updated_at = now()
  where id = p_note and folder_root = p_root;
  if not found then raise exception 'That note isn''t in this shared folder.' using errcode = 'P0002', hint = 'no_note'; end if;
end $$;

-- A note's key sealed under FK again (after the note's key or the folder's changed). The caller is
-- an accepted member of both.
create or replace function public.collab_folder_note_rewrap(p_root uuid, p_note uuid, p_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e int;
  s public.shared_notes;
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'viewer');
  e := public.collab_folder_epoch(p_root);
  if not exists (select 1 from public.note_members where note_id = p_note and user_id = auth.uid() and accepted_at is not null) then
    raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
  select * into s from public.shared_notes where id = p_note and folder_root = p_root for update;
  if s.id is null then raise exception 'That note isn''t in this shared folder.' using errcode = 'P0002', hint = 'no_note'; end if;
  if p_wrap is null or public.collab_box_epoch(p_wrap) is distinct from e or public.collab_wrap_note_epoch(p_wrap) is distinct from s.epoch then
    raise exception 'The key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  update public.shared_notes set folder_wrap = p_wrap, updated_at = now() where id = p_note;
end $$;

-- A note taken out of the shared folder (moved out, or deleted there). Editors and the owner.
--   * The caller made it (the note's owner): it stays theirs, a shared note with whoever is in it
--     directly. Everyone in it through the folder leaves it ('moved'), it gets a new key from the
--     owner's next device (rekey_after), and it leaves the folder.
--   * Someone else made it: the caller's device has already kept a copy. The shared note goes for
--     everyone, as collab_unshare does: every membership ends 'moved', the owner's too (recorded
--     for them by hand, since an owner's row records nothing), and every pointer to it is deleted.
create or replace function public.collab_folder_note_remove(p_root uuid, p_note uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.shared_notes;
  had text := coalesce(current_setting('pane.access_ended', true), '');
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'editor');
  select * into s from public.shared_notes where id = p_note and folder_root = p_root for update;
  if s.id is null then raise exception 'That note isn''t in this shared folder.' using errcode = 'P0002', hint = 'no_note'; end if;
  if s.owner_id = auth.uid() then
    perform public.collab_folder_end_note(p_note, p_root, 'moved', auth.uid(), true);
    return;
  end if;
  insert into public.note_access_ended (note_id, user_id, reason, by_user)
  values (p_note, s.owner_id, 'moved', auth.uid())
  on conflict (note_id, user_id) do update set reason = excluded.reason, by_user = excluded.by_user, at = now();
  perform set_config('pane.access_ended', 'moved', true);
  delete from public.shared_notes where id = p_note;
  perform set_config('pane.access_ended', had, true);
  update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null
  where shared_note_id = p_note and deleted_at is null;
end $$;

-- A folder member joins a note of the folder with its key, opened from folder_wrap: key_wrap sealed
-- from their own identity to itself, self_wrap under their data key, at the note's epoch. Their role
-- follows the folder's (a viewer views, everyone else edits). Again later it refreshes their wraps;
-- someone already in the note directly (or its owner) is left as they are.
create or replace function public.collab_folder_join_note(p_root uuid, p_note uuid, p_epoch int, p_key_wrap text, p_self_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  fr text;
  s public.shared_notes;
  m public.note_members;
begin
  perform public.pane_take('write');
  fr := public.collab_folder_need(p_root, 'viewer');
  select * into s from public.shared_notes where id = p_note and folder_root = p_root;
  if s.id is null then raise exception 'That note isn''t in this shared folder.' using errcode = 'P0002', hint = 'no_note'; end if;
  if p_epoch is distinct from s.epoch then
    raise exception 'The note''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  select * into m from public.note_members where note_id = p_note and user_id = auth.uid();
  if m.user_id is not null then
    if m.via_folder is distinct from p_root or m.role = 'owner' then return; end if;
    update public.note_members set key_wrap = p_key_wrap, self_wrap = p_self_wrap, wrapped_by = auth.uid(), epoch = p_epoch,
      role = case when fr = 'viewer' then 'viewer' else 'editor' end, accepted_at = coalesce(accepted_at, now())
    where note_id = p_note and user_id = auth.uid();
    return;
  end if;
  insert into public.note_members (note_id, user_id, role, epoch, key_wrap, self_wrap, wrapped_by, invited_by, accepted_at, via_folder)
  select p_note, auth.uid(), case when fr = 'viewer' then 'viewer' else 'editor' end, p_epoch, p_key_wrap, p_self_wrap, auth.uid(), f.owner_id, now(), p_root
  from public.shared_folders f where f.id = p_root;
end $$;

-- MARK: Links

-- The owner makes the folder's link (one per folder): FK sealed under the link's invite key.
create or replace function public.collab_folder_create_link(p_id text, p_root uuid, p_role text, p_epoch int, p_answer_hash text, p_key_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  perform public.collab_folder_need(p_root, 'owner');
  if p_role is null or p_role not in ('editor', 'viewer') then raise exception 'Unknown role.' using errcode = '22023'; end if;
  if p_epoch is distinct from public.collab_folder_epoch(p_root) then
    raise exception 'The folder''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  if exists (select 1 from public.note_invite_links where id = p_id)
     or exists (select 1 from public.folder_invite_links where id = p_id and folder_id <> p_root) then
    raise exception 'That link id is taken.' using errcode = '22023', hint = 'link_taken';
  end if;
  delete from public.folder_invite_links where folder_id = p_root and id <> p_id;
  insert into public.folder_invite_links (id, folder_id, role, epoch, answer_hash, key_wrap)
  values (p_id, p_root, p_role, p_epoch, p_answer_hash, p_key_wrap)
  on conflict (id) do update set role = excluded.role, epoch = excluded.epoch, answer_hash = excluded.answer_hash,
    key_wrap = excluded.key_wrap, expires_at = now() + interval '7 days';
end $$;

create or replace function public.collab_folder_stop_link(p_root uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.collab_folder_need(p_root, 'owner');
  delete from public.folder_invite_links where folder_id = p_root;
end $$;

-- A folder link opened: the caller proves they hold its secret and gets FK sealed under the link's
-- key, with the folder's sealed name and the owner's name to ask before joining. Rate limited as
-- collab_open_link.
create or replace function public.collab_folder_open_link(p_id text, p_answer text)
returns table (root uuid, role text, epoch int, key_wrap text, owner_name text, folder_name text)
language plpgsql security definer set search_path = '' as $$
declare
  l public.folder_invite_links;
begin
  perform public.pane_take('token');
  select * into l from public.folder_invite_links where id = p_id and expires_at > now();
  if l.id is null or p_answer is null or p_answer !~ '^[0-9a-fA-F]*$' or length(p_answer) % 2 <> 0
     or l.answer_hash <> encode(sha256(decode(p_answer, 'hex')), 'hex')
     or l.epoch <> (select f.epoch from public.shared_folders f where f.id = l.folder_id) then
    raise exception 'That link has expired or was stopped.' using errcode = 'P0002';
  end if;
  return query
    select l.folder_id, l.role, l.epoch, l.key_wrap,
           (select p.display_name from public.profiles p where p.user_id = f.owner_id), f.name_ct
    from public.shared_folders f where f.id = l.folder_id;
end $$;

-- Joins the folder by its link, with the link's role. The membership holds the link's box until
-- the next key; the caller then accepts (collab_folder_accept) with FK under their data key.
-- Joining again changes nothing.
create or replace function public.collab_folder_join_link(p_id text, p_answer text)
returns table (root uuid, role text, epoch int, key_wrap text, owner_name text, folder_name text)
language plpgsql security definer set search_path = '' as $$
declare
  l record;
begin
  select * into l from public.collab_folder_open_link(p_id, p_answer);
  insert into public.folder_members (folder_id, user_id, role, epoch, key_wrap, wrapped_by, self_wrap, invited_by, accepted_at)
  select l.root, auth.uid(), l.role, l.epoch, l.key_wrap, null, null, k.created_by, null
  from public.folder_invite_links k where k.id = p_id
  on conflict (folder_id, user_id) do nothing;
  return query select l.root, l.role, l.epoch, l.key_wrap, l.owner_name, l.folder_name;
end $$;

-- Which kind of link an id is, so the app knows which to open: 'note', 'folder' or null. Says
-- nothing else; rate limited as opening one.
create or replace function public.collab_link_kind(p_id text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('token');
  if exists (select 1 from public.note_invite_links where id = p_id) then return 'note'; end if;
  if exists (select 1 from public.folder_invite_links where id = p_id) then return 'folder'; end if;
  return null;
end $$;

-- MARK: Start fresh

-- As 20261104100800 (fix 3), and the account's folders go too: the ones it owns end for everyone
-- (their roots' delete trigger), and leaving the others' marks them for a new key.
create or replace function public.collab_forget_on_start_fresh() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.shared_notes s set rekey_after = coalesce(s.rekey_after, now())
  from public.note_members m
  where m.note_id = s.id and m.user_id = old.user_id and m.role <> 'owner';
  update public.shared_folders f set rekey_after = coalesce(f.rekey_after, now())
  from public.folder_members m
  where m.folder_id = f.id and m.user_id = old.user_id and m.role <> 'owner';
  delete from public.shared_folders where owner_id = old.user_id and id = root_id;
  delete from public.folder_members where user_id = old.user_id;
  delete from public.shared_notes where owner_id = old.user_id;
  delete from public.note_members where user_id = old.user_id;
  delete from public.identity_keys where user_id = old.user_id;
  delete from public.sealed_links where user_id = old.user_id;
  delete from public.shared_templates where user_id = old.user_id;
  return old;
end $$;
revoke all on function public.collab_forget_on_start_fresh() from public, anon, authenticated;

-- MARK: Grants

revoke all on function public.collab_folder_access_ended(), public.collab_folder_role(uuid, uuid), public.collab_folder_joined(uuid),
  public.collab_share_folder(uuid, text, text, text), public.collab_folder_put(uuid, uuid, uuid, text, float8),
  public.collab_folder_drop(uuid, uuid), public.collab_folder_folders(uuid), public.collab_folder_notes(uuid),
  public.collab_folder_memberships(), public.collab_folder_members(uuid), public.collab_folder_accept(uuid, int, text),
  public.collab_folder_set_role(uuid, uuid, text), public.collab_folder_remove(uuid, uuid), public.collab_folder_leave(uuid),
  public.collab_folder_rekey(uuid, int, jsonb, text, jsonb, jsonb), public.collab_unshare_folder(uuid),
  public.collab_folder_note_add(uuid, uuid, uuid, text), public.collab_folder_note_move(uuid, uuid, uuid),
  public.collab_folder_note_rewrap(uuid, uuid, text), public.collab_folder_note_remove(uuid, uuid),
  public.collab_folder_join_note(uuid, uuid, int, text, text), public.collab_folder_create_link(text, uuid, text, int, text, text),
  public.collab_folder_stop_link(uuid), public.collab_folder_open_link(text, text), public.collab_folder_join_link(text, text),
  public.collab_link_kind(text), public.collab_box_epoch(text), public.collab_wrap_note_epoch(text) from public, anon;
grant execute on function public.collab_folder_access_ended(), public.collab_folder_role(uuid, uuid), public.collab_folder_joined(uuid),
  public.collab_share_folder(uuid, text, text, text), public.collab_folder_put(uuid, uuid, uuid, text, float8),
  public.collab_folder_drop(uuid, uuid), public.collab_folder_folders(uuid), public.collab_folder_notes(uuid),
  public.collab_folder_memberships(), public.collab_folder_members(uuid), public.collab_folder_accept(uuid, int, text),
  public.collab_folder_set_role(uuid, uuid, text), public.collab_folder_remove(uuid, uuid), public.collab_folder_leave(uuid),
  public.collab_folder_rekey(uuid, int, jsonb, text, jsonb, jsonb), public.collab_unshare_folder(uuid),
  public.collab_folder_note_add(uuid, uuid, uuid, text), public.collab_folder_note_move(uuid, uuid, uuid),
  public.collab_folder_note_rewrap(uuid, uuid, text), public.collab_folder_note_remove(uuid, uuid),
  public.collab_folder_join_note(uuid, uuid, int, text, text), public.collab_folder_create_link(text, uuid, text, int, text, text),
  public.collab_folder_stop_link(uuid), public.collab_folder_open_link(text, text), public.collab_folder_join_link(text, text),
  public.collab_link_kind(text), public.collab_box_epoch(text), public.collab_wrap_note_epoch(text) to authenticated;

-- MARK: Realtime

-- `folder:<root>`: accepted members nudge each other's devices when the tree or its notes change.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'realtime') then
    execute $p$ drop policy if exists "folder members join" on realtime.messages $p$;
    execute $p$
      create policy "folder members join" on realtime.messages for select to authenticated
        using (realtime.topic() like 'folder:%' and public.collab_folder_joined(split_part(realtime.topic(), ':', 2)::uuid))
    $p$;
    execute $p$ drop policy if exists "folder members send" on realtime.messages $p$;
    execute $p$
      create policy "folder members send" on realtime.messages for insert to authenticated
        with check (realtime.topic() like 'folder:%' and public.collab_folder_joined(split_part(realtime.topic(), ':', 2)::uuid))
    $p$;
  end if;
end $$;
