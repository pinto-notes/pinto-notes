-- Stopping sharing (the owner deletes a shared note, as in Apple Notes): the note becomes the
-- owner's own again and nobody else has it. The caller (a device, or the MCP server during the
-- owner's AI request) sends the merged text sealed under the owner's data key; it goes back into
-- the owner's row, which stops being a pointer. Then the shared document goes (its members, changes,
-- snapshots and link, by cascade), and everyone else's pointer row is deleted, so the note leaves
-- their libraries on their next sync. Deleting it for the owner (Recently Deleted) is the normal
-- delete after this; restoring it brings it back unshared.
create or replace function public.collab_unshare(p_note uuid, p_body_ct text, p_head_ct text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can stop sharing this note.' using errcode = '42501', hint = 'not_owner';
  end if;
  update public.notes set body_ct = p_body_ct, head_ct = p_head_ct, shared_note_id = null, updated_at = now()
  where user_id = auth.uid() and (id = p_note or shared_note_id = p_note) and deleted_at is null;
  update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null
  where shared_note_id = p_note and user_id <> auth.uid() and deleted_at is null;
  delete from public.shared_notes where id = p_note;
end $$;

revoke all on function public.collab_unshare(uuid, text, text) from public, anon;
grant execute on function public.collab_unshare(uuid, text, text) to authenticated;
