-- How much each account uses its AI connections after connecting (docs/Technical/app-telemetry.md,
-- "AI use on the server"). Until now the server kept only mcp_tokens.last_used_at, which says
-- nothing about day 7 or day 30 after connecting.
--
-- One row per account, UTC day, kind of AI, kind of tool and outcome, with a count. Nothing else:
-- no tool arguments, no note ids, no connection names, no hosts. The MCP function adds to it after
-- each tool call (count_ai_use), from the connection the request was authenticated with, so a
-- request can only ever count for the account that owns that connection.
--
-- Only the service role reads it (no policy for anon or authenticated). Rows go with the account
-- (on delete cascade) and are kept 400 days at most (ai_use_forget, daily from pg_cron).

create table if not exists public.ai_use_daily (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  ai       text not null check (ai in ('claude', 'chatgpt', 'other')),
  category text not null check (category in ('read', 'search', 'edit', 'create', 'delete_move', 'other')),
  outcome  text not null check (outcome in ('ok', 'failed')),
  count    integer not null default 0 check (count >= 0),
  primary key (user_id, day, ai, category, outcome)
);
create index if not exists ai_use_daily_day on public.ai_use_daily (day);
alter table public.ai_use_daily enable row level security;
revoke all on public.ai_use_daily from public, anon, authenticated;

-- The kind of AI behind a connection, from what the connection itself proves:
--   a sign-in (kind 'oauth'): the host its approval was sent to, where only that AI receives it
--     (the same hosts as the app's ConnectTrust.knownHosts and oauth.ts KNOWN_CALLBACKS);
--   an access token (kind 'token'): the guide in the app that made it, by the name it gives the
--     token ("Claude Code", "Codex"), as the app's list marks it.
-- Anything else is 'other'. The host or name itself is never stored.
create or replace function public.ai_use_kind(kind text, name text, redirect_host text) returns text
language sql immutable set search_path = '' as $$
  select case
    when kind = 'oauth' then case lower(coalesce(redirect_host, ''))
      when 'claude.ai' then 'claude' when 'claude.com' then 'claude'
      when 'chatgpt.com' then 'chatgpt' when 'chat.openai.com' then 'chatgpt' when 'platform.openai.com' then 'chatgpt'
      else 'other' end
    when name = 'Claude Code' then 'claude'
    when name = 'Codex' then 'chatgpt'
    else 'other'
  end
$$;
revoke all on function public.ai_use_kind(text, text, text) from public, anon, authenticated;

-- Adds `n` to today's count for the connection `grant_id` (an mcp_tokens id). The account and the
-- kind of AI come from that row, never from the caller; a revoked or unknown connection counts
-- nothing. Only the MCP function calls it.
create or replace function public.count_ai_use(grant_id uuid, category text, failed boolean, n integer default 1) returns void
language sql security definer set search_path = '' as $$
  insert into public.ai_use_daily as u (user_id, day, ai, category, outcome, count)
  select g.user_id, (now() at time zone 'utc')::date, public.ai_use_kind(g.kind, g.name, g.redirect_host), count_ai_use.category,
         case when count_ai_use.failed then 'failed' else 'ok' end, greatest(1, least(count_ai_use.n, 1000))
  from public.mcp_tokens g
  where g.id = count_ai_use.grant_id and g.revoked_at is null
  on conflict (user_id, day, ai, category, outcome) do update set count = u.count + excluded.count
$$;
revoke all on function public.count_ai_use(uuid, text, boolean, integer) from public, anon, authenticated;

-- Kept 400 days.
create or replace function public.ai_use_forget() returns void
language sql security definer set search_path = '' as $$
  delete from public.ai_use_daily where day < (now() at time zone 'utc')::date - 400
$$;
revoke all on function public.ai_use_forget() from public, anon, authenticated;

-- Accounts that used an AI on a day, by kind: the daily active AI accounts. One account using two
-- kinds counts once under each. Only what a failed call says is left out (`ok` calls only).
create or replace view public.ai_use_active_daily with (security_invoker = true) as
  select day, ai, count(distinct user_id)::int as accounts, sum(count)::int as calls
  from public.ai_use_daily
  where outcome = 'ok'
  group by day, ai;
revoke all on public.ai_use_active_daily from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('amber-forget-ai-use', '41 3 * * *', 'select public.ai_use_forget()');
  end if;
end $$;
