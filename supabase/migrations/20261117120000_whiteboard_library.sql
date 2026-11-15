-- The whiteboard library on every device of the account (17 November 2026).
--
-- The library (shapes saved from a board, and the Excalidraw libraries imported) was kept on each
-- device alone. Each item is now a row here, sealed with the account's key like a note, so the
-- server can't read it:
--
--   head_ct, context `library-head:<id>`: {"name", "source", "place", "edited"}: its name, the
--     library file it came from (the popover's group, none for "Saved"), where it sits (newest
--     first) and when its name last changed. What a rename writes; a few hundred bytes.
--   body_ct, context `library:<id>`: {"elements", "files", "created"}: its shapes and the pictures
--     they show. Written once, when the item goes up: an item's shapes never change after.
--
-- A device sends what changed there and takes what changed elsewhere (server_updated_at, as notes).
-- Two renames at once: the later one wins (the device compares `edited` and writes only over the
-- version it read). Removed and renamed at once: removed wins. A removed item keeps its row, with
-- both boxes gone and deleted_at set, so every device hears that it went; nothing brings it back.
--
-- Its own limit (200 MB of library an account), not the account's storage count:
-- pane_storage_parts is redefined on dev (note_app_blobs), and redefining it here too would undo
-- one or the other when they merge.

create table public.whiteboard_library (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  head_ct text check (head_ct is null or (head_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(head_ct) <= 4000)),
  -- As a note's text: about 5 MB of shapes and pictures, once sealed.
  body_ct text check (body_ct is null or (body_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(body_ct) <= 7000000)),
  deleted_at timestamptz,
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  server_updated_at timestamptz not null default clock_timestamp(),
  -- Kept, with both halves; or removed, with neither.
  constraint whiteboard_library_whole check (
    (deleted_at is null and head_ct is not null and body_ct is not null)
    or (deleted_at is not null and head_ct is null and body_ct is null))
);
create index whiteboard_library_user_sync on public.whiteboard_library (user_id, server_updated_at);

alter table public.whiteboard_library enable row level security;
create policy "own library" on public.whiteboard_library for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Removing is an update (the row stays, empty), so the other devices hear of it.
revoke all on public.whiteboard_library from anon, authenticated;
grant select, insert, update on public.whiteboard_library to authenticated;

-- Triggers of one event run in name order: the row is settled first (a), then its boxes are
-- checked against the account's key (b), then the room it takes (c).

-- Stamped for pulls, a new version each write. Removed stays removed, and an item's shapes stay
-- the ones it went up with.
create or replace function public.pane_library_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.deleted_at is not null then
      new.deleted_at := old.deleted_at;
      new.head_ct := null;
      new.body_ct := null;
    elsif new.deleted_at is not null then
      new.head_ct := null;
      new.body_ct := null;
    else
      new.body_ct := old.body_ct;
    end if;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    new.version := old.version + 1;
  else
    if new.deleted_at is not null then
      new.head_ct := null;
      new.body_ct := null;
    end if;
    new.version := 1;
    new.created_at := now();
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end $$;
revoke all on function public.pane_library_touch() from public, anon, authenticated;
create trigger whiteboard_library_a_touch before insert or update on public.whiteboard_library
  for each row execute function public.pane_library_touch();

-- Sealed with the account's current key, as notes are (pane_sealed_guard reads head_ct and body_ct).
create trigger whiteboard_library_b_sealed before insert or update of head_ct, body_ct on public.whiteboard_library
  for each row execute function public.pane_sealed_guard();

-- At most 200 MB of library an account; what's removed takes nothing.
create or replace function public.pane_library_cap() returns bigint
language sql immutable set search_path = '' as $$ select 200000000::bigint $$;
revoke all on function public.pane_library_cap() from public, anon, authenticated;

create or replace function public.pane_library_room() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grow bigint := coalesce(octet_length(new.head_ct), 0) + coalesce(octet_length(new.body_ct), 0)
    - case when tg_op = 'UPDATE' then coalesce(octet_length(old.head_ct), 0) + coalesce(octet_length(old.body_ct), 0) else 0 end;
  used bigint;
begin
  if grow <= 0 then return new; end if;
  select coalesce(sum(coalesce(octet_length(l.head_ct), 0) + coalesce(octet_length(l.body_ct), 0)), 0) into used
    from public.whiteboard_library l where l.user_id = new.user_id and l.id <> new.id;
  if used + coalesce(octet_length(new.head_ct), 0) + coalesce(octet_length(new.body_ct), 0) > public.pane_library_cap() then
    raise exception 'Your whiteboard library is full. Remove items you don''t use, then try again.'
      using errcode = 'PT413', hint = 'library_full';
  end if;
  return new;
end $$;
revoke all on function public.pane_library_room() from public, anon, authenticated;
create trigger whiteboard_library_c_room before insert or update of head_ct, body_ct on public.whiteboard_library
  for each row execute function public.pane_library_room();

-- Start fresh deletes the account's key row and makes a new key: the library was sealed with the
-- old one, so it goes then, as the notes do. The devices send what they hold again, sealed anew.
create or replace function public.pane_library_forget_on_start_fresh() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.whiteboard_library where user_id = old.user_id;
  return old;
end $$;
revoke all on function public.pane_library_forget_on_start_fresh() from public, anon, authenticated;
create trigger whiteboard_library_forget_on_start_fresh after delete on public.account_keys
  for each row execute function public.pane_library_forget_on_start_fresh();
