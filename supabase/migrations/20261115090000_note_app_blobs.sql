-- Note apps: a binary file (a .wasm, a game's data, a picture) is stored once, by a hash of its
-- bytes, and every version of the app names it by that hash (docs/Technical/note-app-versions.md).
-- Before this, each version held a copy of every file: Doom's 2.7 MB of engine and data again for
-- every save, and again in every version kept.
--
-- The project's sealed text (page_ct, draft_ct, a version's page_ct) keeps its text files; a binary
-- file there is either its packed bytes, as before, or {"hash": "<64 hex>", "size": <bytes>}.
--   note_app_blobs.hash: HMAC-SHA256 of the file's bytes under a subkey of the account key (HKDF
--     info "app-blob"), so the same file has the same name in one account and no name another
--     account could guess. blob_ct: the file's bytes, raw DEFLATE, sealed with the account key
--     (context "app-blob:<hash>"), base64 in an amb2 box like page_ct.
--   page_blobs, draft_blobs (note_pages) and page_blobs (note_page_versions): the hashes that row's
--     project names, in plain text, so the database can tell which files nothing uses any more
--     without opening anything. '{}' when it names none (every row from before this, and every
--     one-file app). NULL when it isn't known: the page was written by an app from before blobs
--     (Pinto Notes 1.3 and earlier; they don't say app-blobs/ in x-amber-client), which can put
--     back an older version it kept on the device. While any row of an account is unknown, none of
--     that account's files are deleted.
--
-- A page can only name files the server has: a write that names a missing one is refused (PT409,
-- hint app_blobs_missing), and the device sends the file and tries again. Writing a page marks the
-- files it names as just used; a file nothing names, unused for 10 minutes (so one sent just before
-- its page is never taken), goes when a row that named it changes or goes.

create table public.note_app_blobs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  hash text not null check (hash ~ '^[0-9a-f]{64}$'),
  -- As big as a page's sealed text can be (20261114120000_note_app_size.sql).
  blob_ct text not null check (blob_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(blob_ct) <= 23500000),
  created_at timestamptz not null default now(),
  used_at timestamptz not null default now(),
  primary key (user_id, hash)
);

alter table public.note_app_blobs enable row level security;
create policy "own app blobs read" on public.note_app_blobs for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own app blobs add" on public.note_app_blobs for insert to authenticated
  with check (user_id = (select auth.uid()));
revoke all on public.note_app_blobs from anon;
-- A file never changes under its name; only the database removes one.
revoke update, delete on public.note_app_blobs from authenticated;

-- Sealed with the account's current key, and counted toward the account's storage.
create or replace function public.pane_app_blob_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text;
begin
  select key_id into k from public.account_keys where user_id = new.user_id;
  if k is null or split_part(new.blob_ct, '.', 2) <> k then
    raise exception 'This device has an old key for your notes. Open Pinto Notes again to get the current one.'
      using errcode = '42501', hint = 'wrong_key';
  end if;
  perform public.pane_storage_check(new.user_id, octet_length(new.blob_ct));
  new.created_at := now();
  new.used_at := now();
  return new;
end $$;
revoke all on function public.pane_app_blob_guard() from public, anon, authenticated;
create trigger note_app_blobs_guard before insert on public.note_app_blobs
  for each row execute function public.pane_app_blob_guard();

alter table public.note_pages
  add column page_blobs text[] default '{}',
  add column draft_blobs text[] default '{}';
alter table public.note_page_versions
  add column page_blobs text[] default '{}';

-- Whether the request comes from something that writes page_blobs: the MCP server and the
-- database itself (no request headers), or an app that says app-blobs/ in x-amber-client.
create or replace function public.pane_knows_app_blobs() returns boolean
language plpgsql stable set search_path = '' as $$
declare
  headers text := nullif(current_setting('request.headers', true), '');
begin
  if headers is null then return true; end if;
  begin
    return coalesce(headers::json ->> 'x-amber-client', '') ~ '(^| )app-blobs/';
  exception when others then
    return false;
  end;
end $$;
grant execute on function public.pane_knows_app_blobs() to authenticated, service_role;

-- What a page row names: none without a page; unknown when an older app changed the page; and
-- every file it names must be here (each marked as just used, which also holds it against a
-- clean-up running at the same moment).
create or replace function public.pane_note_page_blobs() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  knows boolean := public.pane_knows_app_blobs();
  page_changed boolean := true;
  draft_changed boolean := true;
  names_changed boolean := true;
  want text[];
  have int;
begin
  if tg_op = 'UPDATE' then
    page_changed := new.page_ct is distinct from old.page_ct;
    draft_changed := new.draft_ct is distinct from old.draft_ct;
  end if;
  if new.page_ct is null then new.page_blobs := '{}';
  elsif page_changed and not knows then new.page_blobs := null;
  end if;
  if new.draft_ct is null then new.draft_blobs := '{}';
  elsif draft_changed and not knows then new.draft_blobs := null;
  end if;
  if tg_op = 'UPDATE' then
    names_changed := page_changed or draft_changed or new.page_blobs is distinct from old.page_blobs or new.draft_blobs is distinct from old.draft_blobs;
  end if;
  if names_changed then
    want := array(select distinct x from unnest(coalesce(new.page_blobs, '{}') || coalesce(new.draft_blobs, '{}')) x);
    if cardinality(want) > 0 then
      with used as (update public.note_app_blobs set used_at = now() where user_id = new.user_id and hash = any(want) returning 1)
      select count(*) into have from used;
      if have < cardinality(want) then
        raise exception 'Some of this app''s files aren''t on the server yet. Send them, then the app.'
          using errcode = 'PT409', hint = 'app_blobs_missing';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.pane_note_page_blobs() from public, anon, authenticated;
create trigger note_pages_blobs before insert or update on public.note_pages
  for each row execute function public.pane_note_page_blobs();

-- A kept version names what its page named (20261007160600_app_file_writes_coalesce.sql, plus page_blobs).
create or replace function public.pane_note_page_keep() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  page_changed boolean := old.page_ct is not null and old.page_ct is distinct from new.page_ct;
begin
  if not page_changed then
    if exists (select 1 from public.note_page_versions v where v.note_id = old.note_id and v.reason = 'data'
               and v.replaced_at > now() - interval '1 minute') then
      return new;
    end if;
  elsif current_setting('pane.coalesce', true) = 'on'
        and old.client is not distinct from new.client
        and old.updated_at > now() - interval '10 minutes' then
    return new;
  end if;
  insert into public.note_page_versions (note_id, user_id, page_ct, data_ct, client, made_at, reason, page_blobs)
  values (old.note_id, old.user_id, old.page_ct, old.data_ct, old.client, old.updated_at, case when page_changed then 'page' else 'data' end, old.page_blobs);
  delete from public.note_page_versions v
  where v.note_id = old.note_id
    and v.id not in (select id from public.note_page_versions where note_id = old.note_id order by id desc limit 10);
  return new;
end $$;

-- The account's files that no page, draft or kept version names any more, and that weren't used
-- in the last 10 minutes. Nothing goes while a row's names are unknown.
create or replace function public.pane_app_blobs_gc(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null or not exists (select 1 from public.note_app_blobs where user_id = p_user) then return; end if;
  if exists (select 1 from public.note_pages where user_id = p_user and (page_blobs is null or draft_blobs is null))
     or exists (select 1 from public.note_page_versions where user_id = p_user and page_blobs is null) then
    return;
  end if;
  delete from public.note_app_blobs b
  where b.user_id = p_user and b.used_at < now() - interval '10 minutes'
    and not exists (select 1 from public.note_pages p where p.user_id = p_user and (b.hash = any(p.page_blobs) or b.hash = any(p.draft_blobs)))
    and not exists (select 1 from public.note_page_versions v where v.user_id = p_user and b.hash = any(v.page_blobs));
end $$;
revoke all on function public.pane_app_blobs_gc(uuid) from public, anon, authenticated;

create or replace function public.pane_app_blobs_released() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_app_blobs_gc(old.user_id);
  return null;
end $$;
revoke all on function public.pane_app_blobs_released() from public, anon, authenticated;
-- After note_pages_keep (triggers fire by name), so the version it keeps already names the files.
create trigger note_pages_release_blobs after update on public.note_pages
  for each row when (cardinality(coalesce(old.page_blobs, '{}')) + cardinality(coalesce(old.draft_blobs, '{}')) > 0
                     and (old.page_blobs is distinct from new.page_blobs or old.draft_blobs is distinct from new.draft_blobs))
  execute function public.pane_app_blobs_released();
create trigger note_pages_drop_blobs after delete on public.note_pages
  for each row when (cardinality(coalesce(old.page_blobs, '{}')) + cardinality(coalesce(old.draft_blobs, '{}')) > 0)
  execute function public.pane_app_blobs_released();
-- A version trimmed past the last 10, or dropped with its note.
create trigger note_page_versions_drop_blobs after delete on public.note_page_versions
  for each row when (cardinality(coalesce(old.page_blobs, '{}')) > 0)
  execute function public.pane_app_blobs_released();

-- Storage: an app's files count once each, with the apps (20261030200000_note_front_matter.sql, plus the blobs).
create or replace function public.pane_storage_parts(p_user uuid)
returns table (notes bigint, files bigint, apps bigint, deleted bigint, versions bigint)
language sql stable security definer set search_path = '' as $$
  select
    (select coalesce(sum(coalesce(octet_length(body_ct), 0) + coalesce(octet_length(head_ct), 0) + coalesce(octet_length(locked_body), 0)
                         + coalesce(octet_length(props_ct), 0) + coalesce(octet_length(locked_props), 0)), 0)
       from public.notes where user_id = p_user and deleted_at is null and trashed_at is null)::bigint,
    (select coalesce(sum(size), 0) from public.attachments where user_id = p_user and deleted_at is null and trashed_at is null)::bigint,
    ((select coalesce(sum(coalesce(octet_length(page_ct), 0) + coalesce(octet_length(data_ct), 0) + coalesce(octet_length(draft_ct), 0)), 0)
        from public.note_pages where user_id = p_user)
     + (select coalesce(sum(octet_length(blob_ct)), 0) from public.note_app_blobs where user_id = p_user))::bigint,
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
