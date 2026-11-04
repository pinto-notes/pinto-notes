-- A change, invite or removal for an old note key answered 40001 (serialization_failure), and
-- PostgREST retries a transaction that fails with 40001 by itself, at once and without end: one
-- insert from a device still holding the old key ran about 800 times a second until the gateway
-- gave up after 60 seconds, and the device never heard "the key changed". Measured on the local
-- stack (PostgREST 14.3): 4,054 attempts in 5 seconds. These answer PT409 (HTTP 409) with the
-- same hint, which nothing retries.
--
-- Also: someone who isn't in the note at all (removed, or never in it) got past the guard, because
-- collab_role is null for them and `null not in (…)` isn't true; only the insert policy stopped them,
-- after the epoch check. Now the guard refuses them first, with hint not_member.

create or replace function public.collab_invite(p_note uuid, p_user uuid, p_role text, p_key_wrap text, p_epoch int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  current_epoch int;
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can invite people to this note.' using errcode = '42501', hint = 'not_owner';
  end if;
  if p_role not in ('editor', 'viewer') then raise exception 'Unknown role.' using errcode = '22023'; end if;
  select epoch into current_epoch from public.shared_notes where id = p_note;
  if p_epoch <> current_epoch then
    raise exception 'The note''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  insert into public.note_members (note_id, user_id, role, epoch, key_wrap, wrapped_by, invited_by)
  values (p_note, p_user, p_role, p_epoch, p_key_wrap, auth.uid(), auth.uid())
  on conflict (note_id, user_id) do update set role = excluded.role;
end $$;

create or replace function public.collab_remove(p_note uuid, p_user uuid, p_epoch int, p_wraps jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare
  current_epoch int;
  stay int;
begin
  perform public.pane_take('write');
  if public.collab_role(p_note) is distinct from 'owner' then
    raise exception 'Only the owner can remove people.' using errcode = '42501', hint = 'not_owner';
  end if;
  if p_user is not null and p_user = auth.uid() then raise exception 'The owner can''t remove themselves.' using errcode = '22023'; end if;
  select epoch into current_epoch from public.shared_notes where id = p_note for update;
  if p_epoch <> current_epoch + 1 then
    raise exception 'The note''s key changed. Try again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  -- p_user null: only a new key (Reset Link). Every live link was made for the old key and stops.
  delete from public.note_members where note_id = p_note and user_id = p_user;
  delete from public.note_invite_links where note_id = p_note;
  select count(*) into stay from public.note_members where note_id = p_note;
  if (select count(*) from jsonb_array_elements(p_wraps) w
      join public.note_members m on m.note_id = p_note and m.user_id = (w->>'user_id')::uuid) <> stay then
    raise exception 'Every remaining member needs the new key.' using errcode = '22023', hint = 'wraps_incomplete';
  end if;
  update public.note_members m set key_wrap = w->>'key_wrap', wrapped_by = auth.uid(), self_wrap = null, epoch = p_epoch
  from jsonb_array_elements(p_wraps) w
  where m.note_id = p_note and m.user_id = (w->>'user_id')::uuid;
  update public.shared_notes set epoch = p_epoch, updated_at = now() where id = p_note;
  return p_epoch;
end $$;

create or replace function public.collab_update_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  -- Not a member at all (removed, or never in it) is refused here too, not left to the policy.
  if public.collab_role(new.note_id) is null then
    raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
  if public.collab_role(new.note_id) not in ('owner', 'editor') then
    raise exception 'You can view this note but not change it.' using errcode = '42501', hint = 'read_only';
  end if;
  if new.epoch <> (select epoch from public.shared_notes where id = new.note_id) then
    raise exception 'The note''s key changed. Open it again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  new.author_id := auth.uid();
  new.created_at := now();
  if tg_table_name = 'note_updates' then
    -- An AI's change says which AI (pane.client, set by the MCP server); the author is still the
    -- person whose connection it is, so the note can say "Sara's Claude".
    new.client := left(coalesce(public.pane_writer(), new.client), 100);
  end if;
  return new;
end $$;
