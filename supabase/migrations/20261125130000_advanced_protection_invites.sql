-- Advanced protection, by invitation (docs/Technical/recoverable-key.md, "Who is offered it").
--
-- Advanced protection (20261011120000_key_copy.sql: strict, the key on the person's devices only)
-- was hidden in the app on 2026-11-01 and kept on the server. It comes back for invited accounts
-- only: the server says which, and refuses to turn it on for anyone else. Nobody is invited by
-- default. An account that already has it on keeps it, and can turn it off, as before.
--
-- To invite someone (SQL editor or a script with the service role):
--   insert into public.advanced_protection_invites (user_id)
--   select id from auth.users where email = 'person@example.com' on conflict do nothing;
-- To take an invitation back: delete the row. An account that turned it on stays strict until it
-- turns it off; after that it isn't offered again.
--
-- Additive: builds from before this ignore `protection_invited`. Builds from 2026-11-01 to now
-- never offer the switch, and older builds that do are refused for an account that isn't invited
-- (hint 'not_offered'), which they show as "Can't change this right now".

create table public.advanced_protection_invites (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  invited_at timestamptz not null default now()
);
alter table public.advanced_protection_invites enable row level security;
-- No client reads or writes it: the account sees only `protection_invited` in its key state.
revoke all on public.advanced_protection_invites from public, anon, authenticated;
grant select, insert, delete on public.advanced_protection_invites to service_role;

create or replace function public.pane_protection_invited(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.advanced_protection_invites i where i.user_id = p_user)
$$;
revoke all on function public.pane_protection_invited(uuid) from public, anon, authenticated;

-- What a device reads at startup, as 20261011120000_key_copy.sql made it, plus
-- `protection_invited`: whether this account is offered Advanced protection. The app shows the
-- switch to an invited account, and to one that has it on (so it can turn it off).
create or replace function public.account_key_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'key', (select jsonb_build_object('key_id', k.key_id, 'verifier', k.verifier, 'recovery_wrap', k.recovery_wrap,
                                      'recovery_saved_at', k.recovery_saved_at)
            from public.account_keys k where k.user_id = auth.uid()),
    'generation', coalesce((select r.generation from public.account_key_resets r where r.user_id = auth.uid()), 0),
    'protection', (select p.mode from public.account_key_protection p where p.user_id = auth.uid()),
    'copy', exists (select 1 from public.account_key_copies c join public.account_keys k on k.user_id = c.user_id and k.key_id = c.key_id
                    where c.user_id = auth.uid()),
    'protection_paused_until', (select to_char(public.pane_reset_pause_until(auth.uid()) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                                where exists (select 1 from public.account_key_copies c where c.user_id = auth.uid())),
    'protection_invited', public.pane_protection_invited(auth.uid()))
$$;
revoke all on function public.account_key_state() from public, anon;
grant execute on function public.account_key_state() to authenticated;

-- As 20261011120000_key_copy.sql made it, with one more rule first: only an invited account, or
-- one that already has it on, can turn it on. The rest is unchanged.
create or replace function public.keep_key_on_devices(p_device uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  k public.account_keys%rowtype;
  paused_until timestamptz;
  has_copy boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not public.pane_protection_invited(uid)
     and not exists (select 1 from public.account_key_protection p where p.user_id = uid and p.mode = 'strict') then
    raise exception 'Advanced protection isn''t offered to this account.' using errcode = '42501', hint = 'not_offered';
  end if;
  select * into k from public.account_keys where user_id = uid for update;
  if not found then raise exception 'This account has no key yet.' using errcode = '22023', hint = 'no_key'; end if;
  has_copy := exists (select 1 from public.account_key_copies c where c.user_id = uid);
  if has_copy then
    paused_until := public.pane_reset_pause_until(uid);
    if paused_until is not null then
      raise exception 'Advanced protection can be turned on 72 hours after a password reset, to protect your notes.'
        using errcode = '42501', hint = 'paused_after_reset',
              detail = to_char(paused_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
    end if;
    if coalesce(public.pane_signed_in_at(), '-infinity') < now() - interval '10 minutes' then
      raise exception 'Sign in again to turn on Advanced protection.' using errcode = '42501', hint = 'reauth';
    end if;
  end if;
  if has_copy and k.recovery_saved_at is null and not exists (
    select 1 from public.key_devices d
    where d.user_id = uid and d.key_id = k.key_id and d.device_id is distinct from p_device
      and d.removed_at is null and d.seen_at > now() - interval '30 days') then
    raise exception 'Save your recovery key first, or your notes could not be opened again.'
      using errcode = '42501', hint = 'needs_recovery_key';
  end if;
  insert into public.account_key_protection as p (user_id, mode) values (uid, 'strict')
    on conflict (user_id) do update set mode = 'strict', chosen_at = now() where p.mode <> 'strict';
  delete from public.account_key_copies where user_id = uid;
  if found then insert into public.key_copy_events (user_id, what) values (uid, 'removed'); end if;
end $$;
revoke all on function public.keep_key_on_devices(uuid) from public, anon;
grant execute on function public.keep_key_on_devices(uuid) to authenticated;
