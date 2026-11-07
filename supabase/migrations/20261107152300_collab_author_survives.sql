-- A shared note's changes and snapshots stay when the person who wrote them deletes their account.
-- They belong to the note, which its owner keeps: the author foreign keys cascaded from auth.users,
-- so deleting a collaborator's account took their changes and, after compaction, the only snapshot
-- of the document. The author id stays (it is in each change's sealed context, needed to open it);
-- it just no longer points at a live account. The rows still go with the note (shared_notes cascade).
alter table public.note_updates drop constraint if exists note_updates_author_id_fkey;
alter table public.note_snapshots drop constraint if exists note_snapshots_author_id_fkey;
