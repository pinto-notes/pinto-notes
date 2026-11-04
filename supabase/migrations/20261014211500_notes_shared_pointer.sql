-- Shared notes in the library (docs/Technical/collaboration-design.md, "How it fits the app").
--
-- One note, one sync path. A shared note's text lives only in its shared document (note_updates,
-- note_snapshots, sealed under the note key). Each member still has a row in `notes` for it, so
-- where it sits in their folders, pinning and deletion sync between their devices like any note;
-- that row is a pointer: `shared_note_id` names the shared document, and its body is a sealed
-- placeholder ("This note is shared…"), never the note's text.
--
-- For the owner the pointer is the note they shared (same id as the shared document). Everyone
-- else's pointer has an id of their own (notes.id is unique across accounts).

alter table public.notes add column if not exists shared_note_id uuid;

-- One pointer per person per shared note. Deleted pointers (tombstones) don't count, so leaving
-- and joining again works.
create unique index if not exists notes_shared_pointer on public.notes (user_id, shared_note_id)
  where shared_note_id is not null and deleted_at is null;
