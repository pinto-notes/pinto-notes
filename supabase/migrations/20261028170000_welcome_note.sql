-- The Welcome note: one per account, made by the first device that signs in to it.
--
-- Notes are end-to-end encrypted, so the server can't write it: a device writes it, in the words
-- for that device (iPhone or Mac). This table says which accounts have had theirs, and
-- claim_welcome_note() hands the right to write it to exactly one device: it answers true once
-- per account, the first time, and false ever after, to every device, at once or later.
--
-- Accounts that exist when this runs are marked as done, so they never get one.

create table public.account_welcome (
  user_id uuid primary key references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);

alter table public.account_welcome enable row level security;
-- Only claim_welcome_note() writes or reads it.
revoke all on public.account_welcome from public, anon, authenticated;

insert into public.account_welcome (user_id, claimed_at)
select id, now() from auth.users
on conflict (user_id) do nothing;

-- True for the caller's account the first time it's asked, false every time after. The insert
-- is the claim: two devices asking at once can't both win.
create or replace function public.claim_welcome_note() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  won boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  insert into public.account_welcome (user_id) values (uid)
  on conflict (user_id) do nothing
  returning true into won;
  return coalesce(won, false);
end;
$$;

revoke all on function public.claim_welcome_note() from public, anon;
grant execute on function public.claim_welcome_note() to authenticated;
