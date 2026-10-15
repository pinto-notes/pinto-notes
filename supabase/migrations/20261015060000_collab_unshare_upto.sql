-- Stopping sharing (the owner deletes a shared note) without losing a change in flight: the caller
-- sends the merged text, and `p_upto`, the newest change it merged. A change that committed after
-- that isn't in the text, and writing the text back and dropping the document would lose it, so the
-- call is refused (PT409, hint 'changed'): the caller loads the note again and retries. The note's
-- row is taken first, so no change commits while it decides (collab_update_order takes the same
-- row). Without `p_upto` (older apps) it does what 20261015040000 did.
drop function if exists public.collab_unshare(uuid, text, text);
create or replace function public.collab_unshare(p_note uuid, p_body_ct text, p_head_ct text, p_upto bigint default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can stop sharing this note.' using errcode = '42501', hint = 'not_owner';
  end if;
  perform 1 from public.shared_notes where id = p_note for update;
  if p_upto is not null and exists (select 1 from public.note_updates where note_id = p_note and id > p_upto) then
    raise exception 'The note changed while it was being deleted. Try again.' using errcode = 'PT409', hint = 'changed';
  end if;
  update public.notes set body_ct = p_body_ct, head_ct = p_head_ct, shared_note_id = null, updated_at = now()
  where user_id = auth.uid() and (id = p_note or shared_note_id = p_note) and deleted_at is null;
  update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null
  where shared_note_id = p_note and user_id <> auth.uid() and deleted_at is null;
  delete from public.shared_notes where id = p_note;
end $$;

revoke all on function public.collab_unshare(uuid, text, text, bigint) from public, anon;
grant execute on function public.collab_unshare(uuid, text, text, bigint) to authenticated;
