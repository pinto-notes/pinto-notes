-- Leaving someone else's shared note (Share › Leave Note). Your membership goes at once: your
-- devices and your AI can't fetch the note's changes or write any more, and you're off its
-- channel. The owner's next device gives the note a new key without you (collab_remove with no
-- one removed), as after a removal. The owner can't leave their own note.
create or replace function public.collab_leave(p_note uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r text;
begin
  perform public.pane_take('write');
  r := public.collab_role(p_note);
  if r is null then
    raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
  if r = 'owner' then
    raise exception 'The owner can''t leave their own note.' using errcode = '22023';
  end if;
  delete from public.note_members where note_id = p_note and user_id = auth.uid();
end $$;

revoke all on function public.collab_leave(uuid) from public, anon;
grant execute on function public.collab_leave(uuid) to authenticated;
