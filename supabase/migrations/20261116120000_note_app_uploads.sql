-- Note apps: a binary file bigger than one request can carry arrives in pieces (write with offset
-- and size, docs/Technical/note-app-limits.md). Each piece is stored at once, as the parts the
-- whole file is stored in (note_app_blobs, 20261115090000_note_app_blobs.sql); this row remembers
-- which parts have come for which file until the last piece does, and the file is saved into the
-- app. Then the row goes.
--
--   path_tag: a keyed tag of the file's path in the app (the account's tag key), never the path.
--   size: the whole file's bytes, as the first piece said.
--   pieces: [{"at": <offset>, "parts": [{"hash", "size"}, ...]}, ...], the pieces received, by offset.
--   blobs: every hash in pieces, in plain text, so the clean-up can see them without opening anything.
--
-- The parts count toward the account's storage the moment they're stored (the blobs table's
-- trigger). An upload nobody finishes is dropped after a day, and its parts with it.

create table public.note_app_uploads (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  path_tag text not null check (path_tag ~ '^[0-9a-f]{24}$'),
  size bigint not null check (size > 0),
  pieces jsonb not null default '[]'::jsonb check (jsonb_typeof(pieces) = 'array' and octet_length(pieces::text) <= 1000000),
  blobs text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, note_id, path_tag)
);
alter table public.note_app_uploads enable row level security;
create policy "own app uploads" on public.note_app_uploads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.note_app_uploads from anon;

-- The clean-up (20261115090000_note_app_blobs.sql) also leaves the parts of an upload that is still
-- coming in, and drops uploads left for a day first.
create or replace function public.pane_app_blobs_gc(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  delete from public.note_app_uploads where user_id = p_user and updated_at < now() - interval '1 day';
  if not exists (select 1 from public.note_app_blobs where user_id = p_user) then return; end if;
  if exists (select 1 from public.note_pages where user_id = p_user and (page_blobs is null or draft_blobs is null))
     or exists (select 1 from public.note_page_versions where user_id = p_user and page_blobs is null) then
    return;
  end if;
  delete from public.note_app_blobs b
  where b.user_id = p_user and b.used_at < now() - interval '10 minutes'
    and not exists (select 1 from public.note_pages p where p.user_id = p_user and (b.hash = any(p.page_blobs) or b.hash = any(p.draft_blobs)))
    and not exists (select 1 from public.note_page_versions v where v.user_id = p_user and b.hash = any(v.page_blobs))
    and not exists (select 1 from public.note_app_uploads u where u.user_id = p_user and b.hash = any(u.blobs));
end $$;
revoke all on function public.pane_app_blobs_gc(uuid) from public, anon, authenticated;
