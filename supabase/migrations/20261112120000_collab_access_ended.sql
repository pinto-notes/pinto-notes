-- Why someone's access to a shared note ended: the owner removed them, the owner stopped sharing
-- it (or deleted it), or they left it themselves. Their devices find out by losing the membership,
-- which says nothing about why, so the alert could only say "You no longer have access", and a
-- device that saw its own account's leave before sync told it said that by mistake. It asks here
-- now (collab_access_ended) and says "Emil removed you", "Emil stopped sharing", or nothing for a
-- note you left.
--
-- Additive: a new table, two triggers on note_members and one reader. No existing function changes.

create table if not exists public.note_access_ended (
  note_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('removed', 'unshared', 'left')),
  -- Who did it (the owner), for their name in the alert. Null for a leave, and when the owner's
  -- account went.
  by_user uuid references auth.users (id) on delete set null,
  at timestamptz not null default now(),
  primary key (note_id, user_id)
);
alter table public.note_access_ended enable row level security;
revoke all on public.note_access_ended from anon, authenticated;

-- A membership that ended. Leaving is the member's own delete (collab_leave, Start fresh). With the
-- shared note itself gone (collab_unshare, the owner's delete, the owner's Start fresh or account
-- deletion: the rows cascade from shared_notes) it's unshared. Any other delete is the owner's
-- collab_remove. A member whose own account is being deleted gets nothing: there's nobody to tell.
create or replace function public.collab_note_access_ended() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := auth.uid();
  why text;
begin
  if old.role = 'owner' then return old; end if;
  if not exists (select 1 from auth.users where id = old.user_id) then return old; end if;
  if who is not null and who = old.user_id then
    why := 'left';
  elsif not exists (select 1 from public.shared_notes where id = old.note_id) then
    why := 'unshared';
  else
    why := 'removed';
  end if;
  insert into public.note_access_ended (note_id, user_id, reason, by_user)
  values (old.note_id, old.user_id, why,
          case when why = 'left' or not exists (select 1 from auth.users where id = who) then null else who end)
  on conflict (note_id, user_id) do update set reason = excluded.reason, by_user = excluded.by_user, at = now();
  return old;
end $$;
revoke all on function public.collab_note_access_ended() from public, anon, authenticated;

drop trigger if exists collab_note_access_ended on public.note_members;
create trigger collab_note_access_ended after delete on public.note_members
  for each row execute function public.collab_note_access_ended();

-- In the note again (a link opened after a removal): the old reason no longer stands.
create or replace function public.collab_note_access_back() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.note_access_ended where note_id = new.note_id and user_id = new.user_id;
  return new;
end $$;
revoke all on function public.collab_note_access_back() from public, anon, authenticated;

drop trigger if exists collab_note_access_back on public.note_members;
create trigger collab_note_access_back after insert on public.note_members
  for each row execute function public.collab_note_access_back();

-- Why the caller's access to a note ended, and who ended it (their profile name, as it is now).
-- Nothing while the caller is still in the note, or when nothing was recorded (an access that
-- ended before this migration).
create or replace function public.collab_access_ended(p_note uuid)
returns table (reason text, by_name text, at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.reason, (select p.display_name from public.profiles p where p.user_id = e.by_user), e.at
  from public.note_access_ended e
  where e.note_id = p_note and e.user_id = auth.uid()
    and not exists (select 1 from public.note_members m where m.note_id = p_note and m.user_id = auth.uid())
$$;
revoke all on function public.collab_access_ended(uuid) from public, anon;
grant execute on function public.collab_access_ended(uuid) to authenticated;
