-- Share diagnostics and usage, per account (docs/Technical/telemetry-inventory.md).
--
-- The apps' switch (Settings › Share diagnostics and usage) used to live on each device only, so
-- the server kept counting an account's use whatever the switch said. The choice now follows the
-- account: telemetry_choice holds it, the apps read and write it (telemetry_choice_get/_set), and
-- every write to a usage or analytics table passes one gate, public.telemetry_allowed(user).
-- Off: nothing more is written about that account. No row: on (the apps' default).
--
-- The gate is the only way in. supabase/functions/_shared/telemetry_guard.test.ts reads every
-- migration and fails when a function that writes to a usage table (USAGE_TABLES in
-- _shared/telemetry.ts) doesn't call public.telemetry_allowed, and when a new table isn't sorted
-- into usage or not-usage there.
--
-- Additive: the writers below are the latest definitions with the gate added, nothing else changed.

create table if not exists public.telemetry_choice (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  share      boolean not null,
  -- When the person made the choice (the device's clock, never later than the server's).
  updated_at timestamptz not null default now()
);
alter table public.telemetry_choice enable row level security;
create policy "own telemetry choice read" on public.telemetry_choice for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.telemetry_choice from anon, authenticated;
grant select on public.telemetry_choice to authenticated;

-- THE GATE. Whether anything about `uid` may be recorded: on unless the account turned it off.
-- No account (null), nothing to record.
create or replace function public.telemetry_allowed(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select uid is not null and coalesce((select c.share from public.telemetry_choice c where c.user_id = uid), true)
$$;
revoke all on function public.telemetry_allowed(uuid) from public, anon, authenticated;
grant execute on function public.telemetry_allowed(uuid) to service_role;

-- The signed-in account's choice: { share, updated_at (seconds since 1970) }, or { share: null }
-- when it never made one.
create or replace function public.telemetry_choice_get() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object('share', c.share, 'updated_at', extract(epoch from c.updated_at)::float8)
     from public.telemetry_choice c where c.user_id = (select auth.uid())),
    jsonb_build_object('share', null, 'updated_at', null))
$$;
revoke all on function public.telemetry_choice_get() from public, anon;
grant execute on function public.telemetry_choice_get() to authenticated;

-- The signed-in account's choice, made at `made_at` on a device. The latest choice wins, so a
-- device that was offline can't undo a newer one made elsewhere. Answers with the choice that stands.
create or replace function public.telemetry_choice_set(share boolean, made_at timestamptz default now()) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  at timestamptz := least(coalesce(telemetry_choice_set.made_at, now()), now());
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into public.telemetry_choice as c (user_id, share, updated_at)
  values (uid, telemetry_choice_set.share, at)
  on conflict (user_id) do update set share = excluded.share, updated_at = excluded.updated_at
  where c.updated_at <= excluded.updated_at;
  return public.telemetry_choice_get();
end $$;
revoke all on function public.telemetry_choice_set(boolean, timestamptz) from public, anon;
grant execute on function public.telemetry_choice_set(boolean, timestamptz) to authenticated;

-- ── The usage writers, each through the gate ────────────────────────────────────────────────────

-- AI use per account (20261107170000_ai_use_daily.sql).
create or replace function public.count_ai_use(grant_id uuid, category text, failed boolean, n integer default 1) returns void
language sql security definer set search_path = '' as $$
  insert into public.ai_use_daily as u (user_id, day, ai, category, outcome, count)
  select g.user_id, (now() at time zone 'utc')::date, public.ai_use_kind(g.kind, g.name, g.redirect_host), count_ai_use.category,
         case when count_ai_use.failed then 'failed' else 'ok' end, greatest(1, least(count_ai_use.n, 1000))
  from public.mcp_tokens g
  where g.id = count_ai_use.grant_id and g.revoked_at is null and public.telemetry_allowed(g.user_id)
  on conflict (user_id, day, ai, category, outcome) do update set count = u.count + excluded.count
$$;
revoke all on function public.count_ai_use(uuid, text, boolean, integer) from public, anon, authenticated;

-- Tips shown and used (20260929230000_tip_events.sql).
create or replace function public.pane_tip_event(tip text, event text) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
begin
  if not public.telemetry_allowed(uid) then return; end if;
  perform public.pane_take('write');
  insert into public.pane_tip_activity as a (user_id, day, tip, event, n)
  values (uid, (now() at time zone 'utc')::date, pane_tip_event.tip, pane_tip_event.event, 1)
  on conflict (user_id, day, tip, event) do update set n = a.n + 1;
end $$;
revoke all on function public.pane_tip_event(text, text) from public, anon;
grant execute on function public.pane_tip_event(text, text) to authenticated;

-- Features first used, shared between devices for the tips and read by the lifecycle emails.
create or replace function public.pane_feature_used(feature text) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
begin
  if not public.telemetry_allowed(uid) then return; end if;
  insert into public.pane_feature_use (user_id, feature) values (uid, pane_feature_used.feature)
  on conflict (user_id, feature) do nothing;
end $$;
revoke all on function public.pane_feature_used(text) from public, anon;
grant execute on function public.pane_feature_used(text) to authenticated;

-- Days of use (20260930120000_share_ask.sql).
create or replace function public.pane_active_days_add(days date[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
begin
  if not public.telemetry_allowed(uid) then return; end if;
  perform public.pane_take('write');
  insert into public.pane_active_days (user_id, day)
  select distinct uid, d from unnest(days) d
  where d between today - 60 and today + 1
  on conflict (user_id, day) do nothing;
end $$;
revoke all on function public.pane_active_days_add(date[]) from public, anon;
grant execute on function public.pane_active_days_add(date[]) to authenticated;

-- An app install's hello (20260929170000_setup_and_adoption.sql). Off, it says nothing, and what
-- an earlier launch said stays as it was.
create or replace function public.pane_seen_device(device uuid, platform text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if platform not in ('ios', 'macos') then raise exception 'unknown platform' using errcode = '22023'; end if;
  if not public.telemetry_allowed(uid) then return; end if;
  insert into public.pane_devices as d (user_id, device_id, platform) values (uid, device, platform)
  on conflict (user_id, device_id) do update set last_seen = now(), platform = excluded.platform;
  delete from public.pane_devices d where d.user_id = uid and d.device_id in (
    select device_id from public.pane_devices where user_id = uid order by last_seen desc offset 20);
end $$;
revoke all on function public.pane_seen_device(uuid, text) from public, anon;
grant execute on function public.pane_seen_device(uuid, text) to authenticated;

-- AI edits per day (20261001090000_e2ee.sql).
create or replace function public.pane_count_ai_edit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('pane.source', true), '') <> 'mcp' then return null; end if;
  if tg_op = 'UPDATE' and new.body_ct is not distinct from old.body_ct
     and new.deleted_at is not distinct from old.deleted_at
     and new.trashed_at is not distinct from old.trashed_at
     and new.folder_id is not distinct from old.folder_id then
    return null;
  end if;
  if not exists (select 1 from auth.users where id = new.user_id) then return null; end if;
  if not public.telemetry_allowed(new.user_id) then return null; end if;
  insert into public.pane_activity as a (user_id, day, kind, n)
  values (new.user_id, (now() at time zone 'utc')::date, 'ai_edit', 1)
  on conflict (user_id, day, kind) do update set n = a.n + 1;
  return null;
end $$;

-- The setup card's "an AI changed a note" step no longer depends on the count above: with the
-- switch off it is read from the notes themselves (an AI's name on a note, or an AI change kept
-- for the AI changes list), which the app shows anyway.
create or replace function public.pane_setup_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'imported',   s.imported_at is not null,
    'dismissed',  s.dismissed_at is not null,
    'celebrated', s.celebrated_at is not null,
    'templates_closed', s.templates_closed_at is not null,
    'connect_card_closed', s.connect_card_closed_at is not null,
    'connected',  exists (select 1 from public.mcp_tokens t where t.user_id = (select auth.uid())),
    'ai_edits',   greatest(
                    coalesce((select sum(a.n) from public.pane_activity a
                              where a.user_id = (select auth.uid()) and a.kind = 'ai_edit'), 0),
                    case when exists (select 1 from public.notes n where n.user_id = (select auth.uid()) and n.ai_editor is not null)
                           or exists (select 1 from public.note_ai_events e where e.user_id = (select auth.uid()))
                         then 1 else 0 end))
  from (select 1) one
  left join public.pane_setup s on s.user_id = (select auth.uid())
$$;
revoke all on function public.pane_setup_state() from public, anon;
grant execute on function public.pane_setup_state() to authenticated;

-- "How did you hear about Pinto Notes?" (20261007152000_heard_from.sql): not asked, and not kept,
-- with the switch off.
create or replace function public.pane_heard_from_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'ask', public.telemetry_allowed((select auth.uid()))
           and not exists (select 1 from public.pane_heard_from h where h.user_id = (select auth.uid()))
           and exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.created_at > now() - interval '7 days'))
$$;
revoke all on function public.pane_heard_from_state() from public, anon;
grant execute on function public.pane_heard_from_state() to authenticated;

create or replace function public.pane_heard_from_answer(source text, detail text default null) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  words text := nullif(left(btrim(pane_heard_from_answer.detail), 120), '');
begin
  if not public.telemetry_allowed(uid) then return; end if;
  insert into public.pane_heard_from (user_id, source, detail)
  values (uid, pane_heard_from_answer.source, case when pane_heard_from_answer.source = 'other' then words end)
  on conflict (user_id) do nothing;
end $$;
revoke all on function public.pane_heard_from_answer(text, text) from public, anon;
grant execute on function public.pane_heard_from_answer(text, text) to authenticated;

-- A click on a link in a lifecycle email (supabase/functions/lifecycle/run.ts recordClick). Kept
-- only for an account that shares; the redirect works either way.
create or replace function public.record_email_click(send_id bigint, link text) returns boolean
language sql security definer set search_path = '' as $$
  with s as (select id, user_id from public.email_sends where id = record_email_click.send_id),
  kept as (
    insert into public.email_clicks (send_id, link)
    select s.id, left(record_email_click.link, 100) from s where public.telemetry_allowed(s.user_id)
    returning id)
  select exists (select 1 from s)
$$;
revoke all on function public.record_email_click(bigint, text) from public, anon, authenticated;
grant execute on function public.record_email_click(bigint, text) to service_role;
