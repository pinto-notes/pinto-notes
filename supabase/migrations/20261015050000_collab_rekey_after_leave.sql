-- After someone leaves a shared note, the owner's devices give it a new key without them
-- (docs/Technical/collaboration-design.md, "Removing someone, and leaving"). Whoever left still
-- holds the old key, and the server keeps refusing them only because their membership is gone; the
-- new key makes sure nothing written from now on is readable with what they have.
--
-- The owner may be offline when it happens, and may have several devices, so the server keeps the
-- fact on the note: `rekey_after` is when the first person left since the last key. The owner's
-- devices read it with their memberships, and the first to see it renews the key (collab_remove
-- with no one removed). Any new key clears it, however it came.
alter table public.shared_notes add column if not exists rekey_after timestamptz;

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
  update public.shared_notes set rekey_after = coalesce(rekey_after, now()) where id = p_note;
end $$;
revoke all on function public.collab_leave(uuid) from public, anon;
grant execute on function public.collab_leave(uuid) to authenticated;

create or replace function public.collab_rekey_done() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.epoch <> old.epoch then new.rekey_after := null; end if;
  return new;
end $$;
revoke all on function public.collab_rekey_done() from public, anon, authenticated;

drop trigger if exists collab_rekey_done on public.shared_notes;
create trigger collab_rekey_done before update on public.shared_notes
  for each row execute function public.collab_rekey_done();
