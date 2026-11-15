-- Pictures on a whiteboard shared with people (16 November 2026).
--
-- A shared whiteboard's drawing is its Automerge document (note_updates, note_snapshots), and a
-- picture on it is an image element there like any other. The picture's bytes aren't: a change
-- holds 256 KB and a snapshot 4 MB, a screenshot is often 1 to 2 MB, and the document keeps every
-- change for good, so one deleted picture would take room in it for ever, and every snapshot (one
-- per 200 changes, and one after each new key) would carry every picture again. Each picture is
-- one row here instead, sealed under the note key like everything else of a shared note:
--
--   `amb3f.<epoch>.<base64 nonce ‖ ct ‖ tag>`, AAD `amb3f|<note id>|<epoch>|<file id>`
--
-- written once by whoever put it on the board, and read by its id when a device first draws it.
-- The server sees how many pictures a board has and their sizes, never what they show.
--
-- Members read. Owners and editors write, only under the note's current key. After a new key
-- (someone was removed, or left), the owner's device seals each picture again under it: whoever
-- joins later opens them with the key they get, and nothing stored opens with the removed
-- person's key. A picture's row is written once per key: one already there under the current key
-- is kept as it is. The rows go with the shared note.

create table public.note_files (
  note_id    uuid not null references public.shared_notes (id) on delete cascade,
  -- The board's own id for the picture (Excalidraw's fileId).
  file_id    text not null check (file_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  epoch      int not null,
  ct         text not null check (octet_length(ct) <= 4194304 and ct ~ '^amb3f\.[0-9]+\.[A-Za-z0-9+/]+={0,2}$'),
  -- Who put it there. Kept when they delete their account, as their changes are.
  author_id  uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (note_id, file_id)
);
alter table public.note_files enable row level security;
create policy "members read" on public.note_files for select to authenticated using (public.collab_role(note_id) is not null);
revoke all on public.note_files from anon, authenticated;
grant select on public.note_files to authenticated;

-- A picture onto the board, or sealed again under a newer key. Refused for someone outside the
-- note, a viewer, an old key, a box not sealed for this key, and past 32 MB of pictures on one
-- board (a board keeps 4 MB of pictures in use, as any whiteboard does; the rest is room for
-- pictures deleted since, whose bytes stay while the board is shared, so Undo can bring them back).
create or replace function public.collab_put_file(p_note uuid, p_file text, p_epoch int, p_ct text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  current_epoch int;
  stored int;
  total bigint;
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is null then
    raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
  if public.collab_role(p_note) not in ('owner', 'editor') then
    raise exception 'You can view this note but not change it.' using errcode = '42501', hint = 'read_only';
  end if;
  -- Held until the end, so a new key can't land between the check and the write.
  select epoch into current_epoch from public.shared_notes where id = p_note for share;
  if p_epoch <> current_epoch then
    raise exception 'The note''s key changed. Open it again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  if p_ct is null or split_part(p_ct, '.', 1) <> 'amb3f' or split_part(p_ct, '.', 2) <> p_epoch::text then
    raise exception 'That picture isn''t sealed for this note''s key.' using errcode = '22023';
  end if;
  if octet_length(p_ct) > 4194304 then
    raise exception 'This picture is too big for a shared whiteboard.' using errcode = '54000', hint = 'files_full';
  end if;
  select epoch into stored from public.note_files where note_id = p_note and file_id = p_file;
  if found and stored >= p_epoch then return; end if;
  select coalesce(sum(octet_length(ct)), 0) into total from public.note_files where note_id = p_note and file_id <> p_file;
  if total + octet_length(p_ct) > 33554432 then
    raise exception 'This whiteboard has no room for more pictures.' using errcode = '54000', hint = 'files_full';
  end if;
  insert into public.note_files (note_id, file_id, epoch, ct, author_id)
  values (p_note, p_file, p_epoch, p_ct, auth.uid())
  on conflict (note_id, file_id) do update set epoch = excluded.epoch, ct = excluded.ct, updated_at = now();
end $$;
revoke all on function public.collab_put_file(uuid, text, int, text) from public, anon;
grant execute on function public.collab_put_file(uuid, text, int, text) to authenticated;
