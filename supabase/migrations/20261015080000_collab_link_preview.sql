-- Opening a note's link asks first ("Join “Team offsite”? Emil shared it with you."), so a web
-- page that sends the app a link can't join anyone without their yes. To ask, the app needs the
-- note's title and the owner's name before joining: collab_open_link now also returns the note's
-- sealed head (title and preview, sealed under the note key, which the link already opens) and
-- the owner's profile name. Both go only to whoever proves they hold the link, as the key does.
drop function public.collab_open_link(text, text);

create function public.collab_open_link(p_link text, p_answer text)
returns table (note_id uuid, role text, epoch int, key_wrap text, owner_name text, head_ct text)
language plpgsql security definer set search_path = '' as $$
declare
  l public.note_invite_links;
begin
  perform public.pane_take('token');
  select * into l from public.note_invite_links where id = p_link and expires_at > now();
  if l.id is null or l.answer_hash <> encode(sha256(decode(p_answer, 'hex')), 'hex')
     or l.epoch <> (select s.epoch from public.shared_notes s where s.id = l.note_id) then
    raise exception 'That link has expired or was stopped.' using errcode = 'P0002';
  end if;
  return query
    select l.note_id, l.role, l.epoch, l.key_wrap,
           (select p.display_name from public.profiles p where p.user_id = s.owner_id), s.head_ct
    from public.shared_notes s where s.id = l.note_id;
end $$;

revoke all on function public.collab_open_link(text, text) from public, anon;
grant execute on function public.collab_open_link(text, text) to authenticated;
