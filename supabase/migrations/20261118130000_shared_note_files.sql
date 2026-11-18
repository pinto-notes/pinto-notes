-- Files and photos in shared notes (docs/Technical/collaboration-design.md, section 8, "Files in
-- shared notes"). Until now a shared note couldn't hold files: a file's bytes are sealed under its
-- owner's data key, which nobody else in the note has.
--
-- Each file in a shared note gets its own random file key. Its bytes are sealed under that key and
-- stored once, in the `files` bucket under the note's owner: `<owner id>/shared/<note id>/<blob id>`
-- (a fresh blob id per upload, so two devices adding the same file never overwrite each other's
-- bytes; the first row wins). The file key, with the file's name, type and size, is sealed under
-- the note key in `shared_note_files.key_ct` (`amb3x.<epoch>.…`, AAD `amb3x|<note>|<epoch>|<file>`).
-- Whoever holds the note key opens it. Who may read and add is the note's membership (collab_role):
-- every member reads, an owner or editor adds. A new note key (someone removed, or left) is followed
-- by the owner's device sealing every file key again under it (an update of epoch and key_ct; only
-- to the current epoch).
--
-- The bytes sit under the owner's folder, so they count toward the owner's storage, go with Start
-- fresh and Delete Account like the owner's other files, and the owner can always delete them
-- (the "own files" policies). Stopping sharing deletes the rows (cascade from shared_notes); the
-- owner's device then deletes the folder `<owner id>/shared/<note id>/`.

create table public.shared_note_files (
  note_id uuid not null references public.shared_notes (id) on delete cascade,
  -- The file's id: the one in the note's text, `[name](pane-file:<id>)`.
  id uuid not null,
  -- Which upload holds the bytes: `<owner id>/shared/<note id>/<blob>`.
  blob uuid not null,
  added_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- The note key's generation key_ct is sealed under.
  epoch int not null check (epoch >= 1),
  key_ct text not null check (key_ct ~ '^amb3x\.[0-9]+\.[A-Za-z0-9+/]+={0,2}$' and octet_length(key_ct) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (note_id, id)
);

-- Added only by an owner or editor, only under the note's current key; resealed only to the current
-- key. The id, note, blob, adder and time never change after.
create or replace function public.shared_note_files_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare current int;
begin
  perform public.pane_take('write');
  if public.collab_role(new.note_id) is null or public.collab_role(new.note_id) not in ('owner', 'editor') then
    raise exception 'You can view this note but not change it.' using errcode = '42501', hint = 'read_only';
  end if;
  select epoch into current from public.shared_notes where id = new.note_id;
  if split_part(new.key_ct, '.', 2)::int <> new.epoch then
    raise exception 'The file''s key doesn''t say its epoch.' using errcode = '22023', hint = 'bad_epoch';
  end if;
  if new.epoch <> current then
    raise exception 'The note''s key changed. Open it again.' using errcode = '40001', hint = 'stale_epoch';
  end if;
  if tg_op = 'INSERT' then
    new.added_by := coalesce(auth.uid(), new.added_by);
    new.created_at := now();
    if (select count(*) from public.shared_note_files f where f.note_id = new.note_id) >= 5000 then
      raise exception 'This shared note has too many files.' using errcode = '54000', hint = 'too_many_files';
    end if;
  else
    new.note_id := old.note_id;
    new.id := old.id;
    new.blob := old.blob;
    new.added_by := old.added_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger shared_note_files_guard before insert or update on public.shared_note_files
  for each row execute function public.shared_note_files_guard();

alter table public.shared_note_files enable row level security;
create policy "members read" on public.shared_note_files for select to authenticated
  using (public.collab_role(note_id) is not null);
create policy "editors add" on public.shared_note_files for insert to authenticated
  with check (public.collab_role(note_id) in ('owner', 'editor'));
create policy "editors reseal" on public.shared_note_files for update to authenticated
  using (public.collab_role(note_id) in ('owner', 'editor'))
  with check (public.collab_role(note_id) in ('owner', 'editor'));
revoke all on public.shared_note_files from anon, authenticated;
grant select on public.shared_note_files to authenticated;
grant insert (note_id, id, blob, epoch, key_ct) on public.shared_note_files to authenticated;
grant update (epoch, key_ct) on public.shared_note_files to authenticated;

-- MARK: The bytes

-- The caller's role in the shared note whose folder `p_name` is in (`<owner id>/shared/<note id>/<blob>`),
-- or null: not that shape, not a shared note, the owner in the path isn't the note's, or not a member.
-- Split here, not with storage.foldername, so the shape is checked exactly.
create or replace function public.collab_file_role(p_name text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  parts text[] := string_to_array(p_name, '/');
  uuid_shape constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_owner uuid;
begin
  if auth.uid() is null or coalesce(array_length(parts, 1), 0) <> 4 or parts[2] <> 'shared'
     or parts[1] !~ uuid_shape or parts[3] !~ uuid_shape or parts[4] !~ uuid_shape then
    return null;
  end if;
  select n.owner_id into v_owner from public.shared_notes n where n.id = parts[3]::uuid;
  if v_owner is null or v_owner <> parts[1]::uuid then return null; end if;
  return public.collab_role(parts[3]::uuid);
end $$;
revoke all on function public.collab_file_role(text) from public, anon;
grant execute on function public.collab_file_role(text) to authenticated;

-- An owner or editor may add bytes to the note's folder while the owner's storage has room (the
-- same limits as the owner's own files, counted over everything under the owner's folder).
create or replace function public.collab_file_upload_ok(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_owner text := split_part(p_name, '/', 1);
begin
  if coalesce(public.collab_file_role(p_name), '') not in ('owner', 'editor') then return false; end if;
  return (select count(*) < public.pane_limit('files')
            and coalesce(sum((o.metadata->>'size')::bigint), 0) < public.pane_limit('files_bytes')
          from storage.objects o where o.bucket_id = 'files' and o.name like v_owner || '/%');
end $$;
revoke all on function public.collab_file_upload_ok(text) from public, anon;
grant execute on function public.collab_file_upload_ok(text) to authenticated;

-- Every member reads; an owner or editor adds. Nobody else replaces or deletes them: each upload
-- has its own name, and the owner's own policies cover the owner.
create policy "shared note files read" on storage.objects for select to authenticated
  using (bucket_id = 'files' and name ~ '^[^/]+/shared/' and public.collab_file_role(name) is not null);
create policy "shared note files add" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and name ~ '^[^/]+/shared/' and public.collab_file_upload_ok(name));
