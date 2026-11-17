-- Four fixes to shared notes from the 1.4 review council (build/council/1.4-review/collab-sol.md
-- #1, #2, #4, #7). Safe to run again: every statement is `create or replace` or a guarded drop first.

-- 1. Stopping sharing (collab_unshare) refuses when a change came after the caller's text. A change
-- already in a snapshot has no note_updates row any more (collab_compact drops it), so the check
-- missed it, and the other person's edit went with the shared document. A snapshot past `p_upto`
-- counts as a newer change too.
create or replace function public.collab_unshare(p_note uuid, p_body_ct text, p_head_ct text, p_upto bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can stop sharing this note.' using errcode = '42501', hint = 'not_owner';
  end if;
  perform 1 from public.shared_notes where id = p_note for update;
  if p_upto is null
     or exists (select 1 from public.note_updates where note_id = p_note and id > p_upto)
     or exists (select 1 from public.note_snapshots where note_id = p_note and upto > p_upto) then
    raise exception 'The note changed meanwhile. Try again.' using errcode = 'PT409', hint = 'newer_changes';
  end if;
  update public.notes set body_ct = p_body_ct, head_ct = p_head_ct, shared_note_id = null, updated_at = now()
  where user_id = auth.uid() and (id = p_note or shared_note_id = p_note) and deleted_at is null;
  update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null
  where shared_note_id = p_note and user_id <> auth.uid() and deleted_at is null;
  delete from public.shared_notes where id = p_note;
end $$;
revoke all on function public.collab_unshare(uuid, text, text, bigint) from public, anon;
grant execute on function public.collab_unshare(uuid, text, text, bigint) to authenticated;

-- 2. A snapshot's `upto` may be at most the newest change the note has had. After compaction no
-- change rows are left, so that read as 0, and re-sealing the snapshot under a new key (after
-- removing someone) was refused: new devices had only the new key and couldn't open the note.
-- The newest change is now the greatest of the change rows left and the snapshots already taken.
-- (The primary key is note, upto and epoch, so the same point under a new key is a new row.)
create or replace function public.collab_snapshot_upto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.upto > greatest(
       coalesce((select max(id) from public.note_updates where note_id = new.note_id), 0),
       coalesce((select max(upto) from public.note_snapshots where note_id = new.note_id), 0)) then
    raise exception 'That snapshot covers changes the note doesn''t have.' using errcode = '22023', hint = 'bad_upto';
  end if;
  return new;
end $$;
revoke all on function public.collab_snapshot_upto() from public, anon, authenticated;

-- 3. Invite links last 7 days, and making the link again kept the old expiry, so a link handed out
-- again after a week let nobody in. Making it again (sharing it, or changing its access) gives it
-- another 7 days.
create or replace function public.collab_create_link(p_link text, p_note uuid, p_role text, p_epoch int, p_answer_hash text, p_key_wrap text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can make an invite link.' using errcode = '42501', hint = 'not_owner';
  end if;
  delete from public.note_invite_links where note_id = p_note and id <> p_link;
  insert into public.note_invite_links (id, note_id, role, epoch, answer_hash, key_wrap)
  values (p_link, p_note, p_role, p_epoch, p_answer_hash, p_key_wrap)
  on conflict (id) do update set role = excluded.role, epoch = excluded.epoch, answer_hash = excluded.answer_hash,
    key_wrap = excluded.key_wrap, expires_at = now() + interval '7 days';
end $$;
revoke all on function public.collab_create_link(text, uuid, text, int, text, text) from public, anon;
grant execute on function public.collab_create_link(text, uuid, text, int, text, text) to authenticated;

-- 4. The owner deleting their shared note for good ends the sharing, whichever app did it. Pinto
-- Notes 1.3 has sharing off and never calls collab_unshare: it only sets the row's deleted_at (and
-- empties it), and 1.4's own collab_unshare after a permanent delete is a best try that fails
-- offline. Either way the others could keep reading and editing a note the owner had deleted.
-- Now the owner's pointer row going for good (deleted_at set, the server's 30-day purge of
-- Recently Deleted, or the row deleted) deletes the shared note, as collab_unshare does: everyone
-- else's pointer is deleted and their memberships cascade, which records "unshared"
-- (20261112120000_collab_access_ended). Recently Deleted (trashed_at) isn't the end: nothing
-- happens there. No text is kept: the owner's row is deleted, as they asked.
create or replace function public.collab_owner_deleted_note() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  gone uuid;
begin
  if tg_op = 'UPDATE' then
    select s.id into gone from public.shared_notes s
    where s.id in (old.shared_note_id, new.shared_note_id) and s.owner_id = old.user_id;
  else
    select s.id into gone from public.shared_notes s
    where s.id = old.shared_note_id and s.owner_id = old.user_id;
  end if;
  if gone is not null then
    update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null
    where shared_note_id = gone and user_id <> old.user_id and deleted_at is null;
    delete from public.shared_notes where id = gone;
  end if;
  return null;
end $$;
revoke all on function public.collab_owner_deleted_note() from public, anon, authenticated;

drop trigger if exists notes_owner_deleted_shared on public.notes;
create trigger notes_owner_deleted_shared after update on public.notes
  for each row when (old.deleted_at is null and new.deleted_at is not null
                     and (old.shared_note_id is not null or new.shared_note_id is not null))
  execute function public.collab_owner_deleted_note();
drop trigger if exists notes_owner_removed_shared on public.notes;
create trigger notes_owner_removed_shared after delete on public.notes
  for each row when (old.shared_note_id is not null)
  execute function public.collab_owner_deleted_note();
