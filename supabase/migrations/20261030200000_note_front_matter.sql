-- A note's front matter: the keys a Markdown import kept that Pinto has no use for itself
-- (aliases, a source, a status…), so an export writes them back on any device. Sealed like the
-- text it belongs to: with the account's key while the note is open (props_ct, as body_ct), with
-- the notes password's key while it's locked (locked_props, as locked_body). The server never
-- opens either. Additive: a build from before them never sends them, and keeps them as they are.

alter table public.notes
  add column props_ct text,
  add column locked_props text,
  add constraint notes_props_sealed check (
    (props_ct is null or (props_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(props_ct) <= 200000))
    and (locked_props is null or (locked_props ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(locked_props) <= 200000))
    -- A locked note's front matter is only ever sealed with the password, never with the account's
    -- key: locking a note that has some takes a build that seals it too.
    and (locked_body is null or props_ct is null)
    and (locked_props is null or locked_body is not null));

-- Open front matter is sealed with the account's key, as the text is (a password box is the
-- password's, as locked_body is, and isn't checked against the account's key).
create or replace function public.pane_props_sealed_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text;
begin
  -- What isn't a box at all is refused by notes_props_sealed.
  if new.props_ct is null or new.props_ct !~ '^amb2\.' then return new; end if;
  select key_id into k from public.account_keys where user_id = new.user_id;
  if k is null or split_part(new.props_ct, '.', 2) <> k then
    raise exception 'This device has an old key for your notes. Open Pinto Notes again to get the current one.'
      using errcode = '42501', hint = 'wrong_key';
  end if;
  return new;
end $$;
create trigger notes_props_sealed before insert or update of props_ct on public.notes
  for each row execute function public.pane_props_sealed_guard();

-- A locked note's front matter is held to its text's rules (pane_note_lock): sealed with the
-- current notes password, and never changed by an AI.
create or replace function public.pane_props_lock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.locked_props is not distinct from old.locked_props then return new; end if;
  if new.locked_props is null then return new; end if;
  if current_setting('pane.agent', true) = 'mcp' or current_setting('pane.source', true) = 'mcp' then
    raise exception 'This note is locked. Open it in Pinto Notes to change it.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.note_locks l where l.user_id = new.user_id and l.key_id = split_part(new.locked_props, '.', 2)) then
    raise exception 'This note was locked with a different notes password. Enter your current notes password in Pinto Notes.'
      using errcode = '42501';
  end if;
  return new;
end $$;
create trigger notes_props_locked before insert or update of locked_props on public.notes
  for each row execute function public.pane_props_lock();

-- A note deleted for good keeps no front matter, whoever deletes it (a device, a purge, the AI).
-- Named to run before the guard above (triggers of a kind run by name).
create or replace function public.pane_props_cleared() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.deleted_at is not null then
    new.props_ct := null;
    new.locked_props := null;
  end if;
  return new;
end $$;
create trigger notes_props_cleared before insert or update on public.notes
  for each row execute function public.pane_props_cleared();

-- Front matter counts toward the 2 GB like the text does: growth is refused at the limit
-- (pane_storage_guard does this for the text columns), and the count includes it.
create or replace function public.pane_props_storage_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grow bigint := coalesce(octet_length(new.props_ct), 0) + coalesce(octet_length(new.locked_props), 0);
begin
  if tg_op = 'UPDATE' then
    grow := grow - coalesce(octet_length(old.props_ct), 0) - coalesce(octet_length(old.locked_props), 0);
  end if;
  if grow > 0 then perform public.pane_storage_check(new.user_id, grow); end if;
  return new;
end $$;
create trigger notes_props_storage before insert or update of props_ct, locked_props on public.notes
  for each row execute function public.pane_props_storage_guard();

create or replace function public.pane_storage_parts(p_user uuid)
returns table (notes bigint, files bigint, apps bigint, deleted bigint, versions bigint)
language sql stable security definer set search_path = '' as $$
  select
    (select coalesce(sum(coalesce(octet_length(body_ct), 0) + coalesce(octet_length(head_ct), 0) + coalesce(octet_length(locked_body), 0)
                         + coalesce(octet_length(props_ct), 0) + coalesce(octet_length(locked_props), 0)), 0)
       from public.notes where user_id = p_user and deleted_at is null and trashed_at is null)::bigint,
    (select coalesce(sum(size), 0) from public.attachments where user_id = p_user and deleted_at is null and trashed_at is null)::bigint,
    (select coalesce(sum(coalesce(octet_length(page_ct), 0) + coalesce(octet_length(data_ct), 0) + coalesce(octet_length(draft_ct), 0)), 0)
       from public.note_pages where user_id = p_user)::bigint,
    ((select coalesce(sum(coalesce(octet_length(body_ct), 0) + coalesce(octet_length(head_ct), 0) + coalesce(octet_length(locked_body), 0)
                          + coalesce(octet_length(props_ct), 0) + coalesce(octet_length(locked_props), 0)), 0)
        from public.notes where user_id = p_user and deleted_at is null and trashed_at is not null)
     + (select coalesce(sum(size), 0) from public.attachments where user_id = p_user and deleted_at is null and trashed_at is not null))::bigint,
    ((select coalesce(sum(coalesce(octet_length(body_ct), 0) + coalesce(octet_length(head_ct), 0) + coalesce(octet_length(locked_body), 0)), 0)
        from public.note_revisions where user_id = p_user)
     + (select coalesce(sum(size), 0) from public.attachment_versions where user_id = p_user)
     + (select coalesce(sum(coalesce(octet_length(page_ct), 0) + coalesce(octet_length(data_ct), 0)), 0)
        from public.note_page_versions where user_id = p_user))::bigint
$$;
revoke all on function public.pane_storage_parts(uuid) from public, anon, authenticated;
