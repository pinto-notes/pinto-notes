-- A copy of the account's key that the server can open, so signing in is enough to open the
-- notes on a new device (docs/Technical/recoverable-key.md).
--
-- Until now the key lived only on the person's devices: a device without it had to be added from
-- one that had it, or opened with a recovery key nobody was asked to save, and with neither the
-- only way on was Start fresh, which deletes the notes. From here an account is one of two kinds:
--
--   standard  the server keeps a sealed copy of the key (account_key_copies). A signed-in device
--             asks the `key` function for it. The copy is sealed under a secret that lives only in
--             that function's environment, never in this database: these rows alone open nothing.
--   strict    as before: no copy, the key is on the person's devices only. The app calls it
--             Advanced protection.
--
-- An account with no row in account_key_protection is from before this and has not chosen: it has
-- no copy, and nothing makes one until the person says so on a device that holds the key.
--
-- Everything here is additive. Builds from before it never call any of it and work as they did.

-- MARK: Which kind the account is

create table public.account_key_protection (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  mode      text not null check (mode in ('standard', 'strict')),
  chosen_at timestamptz not null default now()
);
alter table public.account_key_protection enable row level security;
create policy "own key protection read" on public.account_key_protection for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.account_key_protection from anon;
revoke insert, update, delete, truncate on public.account_key_protection from authenticated;
grant select on public.account_key_protection to authenticated;

-- MARK: The copy

-- No client can read or write this table, the service role included: only the `key` function's own
-- database connection does. `sealed` is "amb2k.<secret version>.<base64 nonce ‖ ciphertext ‖ tag>"
-- (supabase/functions/_shared/keycopy.ts); what it seals is the data key and the recovery key.
create table public.account_key_copies (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  key_id         text not null check (key_id ~ '^[0-9a-f]{16}$'),
  sealed         text not null check (sealed ~ '^amb2k\.[0-9]{1,6}\.[A-Za-z0-9+/]+={0,2}$' and char_length(sealed) <= 300),
  -- Which of the function's secrets sealed it (KEY_COPY_SECRET_<n>).
  secret_version integer not null check (secret_version > 0),
  stored_at      timestamptz not null default now(),
  -- When a device last got the key from it.
  opened_at      timestamptz
);
alter table public.account_key_copies enable row level security;
revoke all on public.account_key_copies from public, anon, authenticated, service_role;

-- A ticket a device stores with is good once (supabase/functions/_shared/keycopy.ts): its hash is
-- kept here for as long as a ticket lives, so a recorded store sent again is refused. No client
-- reads or writes it.
create table public.key_copy_tickets (
  hash    text primary key check (hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
alter table public.key_copy_tickets enable row level security;
revoke all on public.key_copy_tickets from public, anon, authenticated, service_role;

-- The copy goes with the key, however the key goes (Start fresh deletes the account_keys row).
create or replace function public.pane_key_copy_follows_key() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.account_key_copies where user_id = old.user_id;
  return old;
end $$;
revoke all on function public.pane_key_copy_follows_key() from public, anon, authenticated;
create trigger account_keys_copy_follows after delete on public.account_keys
  for each row execute function public.pane_key_copy_follows_key();

-- MARK: What happened to the copy, for the person and for support

-- One row each time a copy is stored, handed to a device, removed or refused. Never key material.
create table public.key_copy_events (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  what     text not null check (what in ('stored', 'fetched', 'removed', 'refused', 'mailed')),
  -- For refused: why (strict, not_chosen, paused, rate, no_copy, no_key, wrong_key, unreadable, bad_request,
  -- reauth, ticket_used). For mailed, the email that says a device got the key: sent, logged (rendered
  -- and written to the log, not sent: KEY_NOTICE_SEND=log), failed or off.
  why      text check (char_length(why) <= 32),
  platform text check (char_length(platform) <= 16),
  at       timestamptz not null default now()
);
create index key_copy_events_user on public.key_copy_events (user_id, at desc);
alter table public.key_copy_events enable row level security;
create policy "own key copy events read" on public.key_copy_events for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.key_copy_events from anon;
revoke insert, update, delete, truncate on public.key_copy_events from authenticated;
grant select on public.key_copy_events to authenticated;

-- "A new device opened your notes" joins the things every device says. Builds from before this
-- don't show a kind they don't know.
alter table public.account_notices drop constraint account_notices_kind_check;
alter table public.account_notices add constraint account_notices_kind_check
  check (kind in ('ai_connected', 'started_fresh', 'wrong_number', 'device_added', 'key_fetched'));

-- A device that got the key by signing in lists itself as such, and a device needn't be Apple's.
alter table public.key_devices drop constraint key_devices_how_check;
alter table public.key_devices add constraint key_devices_how_check
  check (how in ('made', 'keychain', 'added', 'recovery', 'unknown', 'signin'));
alter table public.key_devices drop constraint key_devices_platform_check;
alter table public.key_devices add constraint key_devices_platform_check
  check (platform in ('ios', 'macos', 'android', 'windows', 'web'));

-- MARK: What a device reads at startup

-- As before, plus `protection` ('standard', 'strict' or null: not chosen) and `copy`: whether the
-- server holds a copy of the account's current key. Builds from before this ignore both.
-- `protection_paused_until`: until when Advanced protection can't be turned on because the
-- password was just reset (keep_key_on_devices, below), so the app can say so before anyone
-- tries. Null when nothing holds it: no reset lately, or no copy to take away.
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
                                where exists (select 1 from public.account_key_copies c where c.user_id = auth.uid())))
$$;
revoke all on function public.account_key_state() from public, anon;
grant execute on function public.account_key_state() to authenticated;

-- MARK: Advanced protection (keep my key only on my devices)

-- Turns strict on: the copy is deleted in the same transaction, so from the moment this returns
-- the server can't open the notes. It asks for another way back first, since after this nobody
-- can help: a recovery key that was saved, or another device that lists itself as holding the key
-- and was seen in the last 30 days (the app checks that device's tag; the server can't).
-- `p_device` is the device asking, which doesn't count as "another".
--
-- Where there is a copy to take away, this takes away a way back to the notes, so it is held to
-- what Start fresh is: a sign-in in the last 10 minutes (an old or stolen session can't do it), and
-- 72 hours after a password reset (someone who got into the mailbox can't do it to a person whose
-- only device is gone). "A recovery key was saved" and "another device" are what the app says and
-- the server can't check: they stop an honest app from locking its person out, never an attacker.
--
-- An account with no copy (one from before, answering "keep my key on my devices only") loses
-- nothing by this, so none of those three apply to it: it can always give that answer.
--
-- It needs no function and no secret, on purpose: removing the copy must work even when the `key`
-- function is down. Turning strict off again is a store through the function, which sets the
-- mode only once a copy is in.
create or replace function public.keep_key_on_devices(p_device uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  k public.account_keys%rowtype;
  paused_until timestamptz;
  has_copy boolean;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
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

-- MARK: Housekeeping

-- The log of what happened to the copy is kept for 12 months.
create or replace function public.pane_forget_key_copy_events() returns void
language sql security definer set search_path = '' as $$
  delete from public.key_copy_events where at < now() - interval '12 months'
$$;
revoke all on function public.pane_forget_key_copy_events() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('pinto-forget-key-copy-events', '41 3 * * *', 'select public.pane_forget_key_copy_events()');
  end if;
end $$;
