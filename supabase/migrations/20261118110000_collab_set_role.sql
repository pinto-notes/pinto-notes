-- The owner changes what someone in their note can do, after they joined: Can edit or Can view,
-- as in Google Docs (Emil, 16 November 2026). Until now only the link's role could change, and a
-- person kept the role they joined with until they were removed.
--
-- Only the owner, only for someone else who is in the note, and only to editor or viewer: the
-- owner's own row never changes, and nobody becomes an owner. The role is all that changes: no new
-- key (a viewer already reads the note), and the guards and policies that ask collab_role decide
-- from the next write on, so a change sent after this commits from someone made a viewer is
-- refused as read_only. The owner's device then tells everyone on the note's channel that who's in
-- it changed ("members"), and their devices read their memberships again at once.
-- Safe to run again: every statement is `create or replace`, a revoke or a grant.
create or replace function public.collab_set_role(p_note uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can change what people can do.' using errcode = '42501', hint = 'not_owner';
  end if;
  if p_role is null or p_role not in ('editor', 'viewer') then raise exception 'Unknown role.' using errcode = '22023'; end if;
  if p_user is null or p_user = auth.uid() then
    raise exception 'The owner''s own role can''t change.' using errcode = '22023', hint = 'owner_row';
  end if;
  update public.note_members set role = p_role
  where note_id = p_note and user_id = p_user and role <> 'owner';
  if not found then
    raise exception 'They''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
end $$;
revoke all on function public.collab_set_role(uuid, uuid, text) from public, anon;
grant execute on function public.collab_set_role(uuid, uuid, text) to authenticated;
