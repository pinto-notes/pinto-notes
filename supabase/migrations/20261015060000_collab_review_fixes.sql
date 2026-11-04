-- Three fixes from the review of shared notes (docs/Technical/collaboration-design.md).

-- 1. A snapshot can't claim to cover changes that don't exist. collab_compact drops every change up
-- to a snapshot's `upto`, so one snapshot from any editor with a huge `upto` deleted the note's
-- changes for good, including every later one. Now `upto` may be at most the newest change stored
-- (0 for a note with none yet). Ids follow commit order per note (20261015020000), so a device's
-- pull never sees an id beyond that.
create or replace function public.collab_snapshot_upto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.upto > coalesce((select max(id) from public.note_updates where note_id = new.note_id), 0) then
    raise exception 'That snapshot covers changes the note doesn''t have.' using errcode = '22023', hint = 'bad_upto';
  end if;
  return new;
end $$;
revoke all on function public.collab_snapshot_upto() from public, anon, authenticated;
drop trigger if exists note_snapshots_upto on public.note_snapshots;
create trigger note_snapshots_upto before insert on public.note_snapshots
  for each row execute function public.collab_snapshot_upto();

-- 2. An app from before shared notes (Pinto Notes 1.2.31 on the Mac, 1.2 on the iPhone) shows a
-- shared note's pointer row as its placeholder text, and typing into it sent the text into that
-- row, where nobody else would ever see it. Such apps don't say `shared/1` in x-amber-client, and
-- their change to a pointer row's text is refused now (PT403, which they set aside and keep on the
-- device as an edit that couldn't sync, so the text isn't lost). Apps that know shared notes say
-- `shared/1` and write only the placeholder. Moving the pointer's place (folder, pin, trash) is
-- fine from any app, as are deleting it and collab_unshare, which turns the pointer back into the
-- note. Writes from the database itself carry no request headers and aren't checked.
create or replace function public.pane_knows_shared_notes() returns boolean
language plpgsql stable set search_path = '' as $$
declare
  headers text := nullif(current_setting('request.headers', true), '');
begin
  if headers is null then return true; end if;
  begin
    return coalesce(headers::json ->> 'x-amber-client', '') ~ '(^| )shared/';
  exception when others then
    return false;
  end;
end $$;
grant execute on function public.pane_knows_shared_notes() to authenticated, service_role;

create or replace function public.pane_note_shared_pointer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.shared_note_id is not null and new.shared_note_id is not null and new.deleted_at is null
     and (new.body_ct is distinct from old.body_ct or new.head_ct is distinct from old.head_ct or new.locked_body is distinct from old.locked_body)
     and not public.pane_knows_shared_notes() then
    raise exception 'Update Pinto Notes to edit this shared note. Your edit is kept on this device.'
      using errcode = 'PT403', hint = 'shared_note';
  end if;
  return new;
end $$;
revoke all on function public.pane_note_shared_pointer() from public, anon, authenticated;
drop trigger if exists notes_shared_pointer_guard on public.notes;
create trigger notes_shared_pointer_guard before update on public.notes
  for each row execute function public.pane_note_shared_pointer();

-- 3. Start fresh as a member of someone else's note is a leave: the owner's devices renew the key
-- (rekey_after, 20261015050000), since the old identity's devices may still hold it.
create or replace function public.collab_forget_on_start_fresh() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.shared_notes s set rekey_after = coalesce(s.rekey_after, now())
  from public.note_members m
  where m.note_id = s.id and m.user_id = old.user_id and m.role <> 'owner';
  delete from public.shared_notes where owner_id = old.user_id;
  delete from public.note_members where user_id = old.user_id;
  delete from public.identity_keys where user_id = old.user_id;
  delete from public.sealed_links where user_id = old.user_id;
  delete from public.shared_templates where user_id = old.user_id;
  return old;
end $$;
revoke all on function public.collab_forget_on_start_fresh() from public, anon, authenticated;
