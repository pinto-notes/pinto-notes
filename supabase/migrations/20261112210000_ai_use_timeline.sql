-- When each account used its AI connections, for every kind of AI, not only how often per day
-- (docs/Technical/app-telemetry.md, "AI use on the server"). Three gaps in ai_use_daily:
--   * no time of day, so an AI's work can't be put next to what the person did in the app;
--   * "create" didn't say what was made (a note, a folder or an app);
--   * mcp_tokens.last_used_at moves on every request, a tools/list included, so it can't say when
--     an AI last did something, or when it first did after connecting.
-- And ai_use_kind knew only Claude and ChatGPT: Grok, Gemini and apps on the person's own computer
-- were all "other".
--
-- Still nothing but kinds, counts and times: no tool arguments, no paths, no note ids, no names.

-- The kind of AI behind a connection, from what the connection itself proves (as before), now with
-- every AI whose sign-in only it can receive (oauth.ts KNOWN_CALLBACKS and Gemini's callback), and
-- `local` for a sign-in that returned to the person's own computer (a desktop app or editor).
create or replace function public.ai_use_kind(kind text, name text, redirect_host text) returns text
language sql immutable set search_path = '' as $$
  select case
    when kind = 'oauth' then case lower(coalesce(redirect_host, ''))
      when 'claude.ai' then 'claude' when 'claude.com' then 'claude'
      when 'chatgpt.com' then 'chatgpt' when 'chat.openai.com' then 'chatgpt' when 'platform.openai.com' then 'chatgpt'
      when 'grok.com' then 'grok'
      when 'oauth-redirect.googleusercontent.com' then 'gemini' when 'oauth-redirect-sandbox.googleusercontent.com' then 'gemini'
      when '127.0.0.1' then 'local' when 'localhost' then 'local' when '::1' then 'local' when '[::1]' then 'local'
      else 'other' end
    when name = 'Claude Code' then 'claude'
    when name = 'Codex' then 'chatgpt'
    else 'other'
  end
$$;
revoke all on function public.ai_use_kind(text, text, text) from public, anon, authenticated;

alter table public.ai_use_daily drop constraint if exists ai_use_daily_ai_check;
alter table public.ai_use_daily add constraint ai_use_daily_ai_check
  check (ai in ('claude', 'chatgpt', 'grok', 'gemini', 'local', 'other'));

-- One row per account, minute (UTC), kind of AI, kind of tool, kind of item and outcome.
create table if not exists public.ai_use_minutes (
  user_id  uuid not null references auth.users (id) on delete cascade,
  minute   timestamptz not null,
  ai       text not null check (ai in ('claude', 'chatgpt', 'grok', 'gemini', 'local', 'other')),
  category text not null check (category in ('read', 'search', 'edit', 'create', 'delete_move', 'other')),
  item     text not null check (item in ('note', 'folder', 'app', 'file', 'none')),
  outcome  text not null check (outcome in ('ok', 'failed')),
  count    integer not null default 0 check (count >= 0),
  primary key (user_id, minute, ai, category, item, outcome)
);
create index if not exists ai_use_minutes_minute on public.ai_use_minutes (minute);
alter table public.ai_use_minutes enable row level security;
revoke all on public.ai_use_minutes from public, anon, authenticated;

-- When a connection first and last made a tool call (not initialize or tools/list).
alter table public.mcp_tokens add column if not exists first_tool_at timestamptz;
alter table public.mcp_tokens add column if not exists last_tool_at timestamptz;

-- Adds `n` calls to today's count and this minute's, and stamps the connection. The account and the
-- kind of AI come from the connection's row, never from the caller; a revoked or unknown
-- connection counts nothing. The four-argument count_ai_use stays for a server not yet updated.
create or replace function public.count_ai_use(grant_id uuid, category text, item text, failed boolean, n integer default 1) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  g record;
  k text;
  c integer := greatest(1, least(n, 1000));
  o text := case when failed then 'failed' else 'ok' end;
begin
  select t.user_id, t.kind, t.name, t.redirect_host into g
  from public.mcp_tokens t where t.id = grant_id and t.revoked_at is null;
  if not found then return; end if;
  k := public.ai_use_kind(g.kind, g.name, g.redirect_host);
  insert into public.ai_use_daily as u (user_id, day, ai, category, outcome, count)
  values (g.user_id, (now() at time zone 'utc')::date, k, count_ai_use.category, o, c)
  on conflict (user_id, day, ai, category, outcome) do update set count = u.count + excluded.count;
  insert into public.ai_use_minutes as m (user_id, minute, ai, category, item, outcome, count)
  values (g.user_id, date_trunc('minute', now()), k, count_ai_use.category, count_ai_use.item, o, c)
  on conflict (user_id, minute, ai, category, item, outcome) do update set count = m.count + excluded.count;
  update public.mcp_tokens set first_tool_at = coalesce(first_tool_at, now()), last_tool_at = now()
  where id = grant_id;
end
$$;
revoke all on function public.count_ai_use(uuid, text, text, boolean, integer) from public, anon, authenticated;

-- Kept 365 days, as the privacy policy says (12 months), the minutes as the days.
create or replace function public.ai_use_forget() returns void
language sql security definer set search_path = '' as $$
  delete from public.ai_use_daily where day < (now() at time zone 'utc')::date - 365;
  delete from public.ai_use_minutes where minute < now() - interval '365 days';
$$;
revoke all on function public.ai_use_forget() from public, anon, authenticated;

-- Each connection: its kind of AI, when it was made, and how long until its first tool call
-- (null: none yet). Connected and never used is the gap this is for.
create or replace view public.ai_first_use with (security_invoker = true) as
  select t.user_id, public.ai_use_kind(t.kind, t.name, t.redirect_host) as ai, t.created_at as connected_at,
         t.first_tool_at, t.first_tool_at - t.created_at as until_first_use, t.last_tool_at, t.revoked_at
  from public.mcp_tokens t;
revoke all on public.ai_first_use from public, anon, authenticated;
