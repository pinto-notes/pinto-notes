-- Connect in Pinto counts as the Allow (supabase/functions/mcp/oauth.ts, /connect/preapprove).
--
-- Pressing Connect in the app, signed in, leaves a pre-approval for one AI: a one-time ticket the
-- app hands to pintonotes.com/connect/start, which swaps it for a key kept in that browser. When
-- the AI's sign-in reaches /connect a few seconds later, the page sends the key and the function
-- answers the request as Allow would, with no second sign-in or consent screen.
--
-- A pre-approval is used once, by the browser that redeemed the ticket, only for the AI named
-- (its pinned callback), only for the account that made it, only for a request that started
-- after it, and within 10 minutes. Only hashes of the ticket and the key are kept.
--
-- Additive: builds from before this never read or write it.

create table public.connect_preapprovals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  ai           text not null check (ai in ('ChatGPT', 'Claude')),
  ticket_hash  text not null unique check (ticket_hash ~ '^[0-9a-f]{64}$'),
  browser_hash text unique check (browser_hash ~ '^[0-9a-f]{64}$'),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '10 minutes',
  redeemed_at  timestamptz,
  used_at      timestamptz,
  request_id   uuid references public.oauth_requests (id) on delete set null
);
create index connect_preapprovals_user on public.connect_preapprovals (user_id, created_at);
-- Only the MCP function reads and writes it, as the service role.
alter table public.connect_preapprovals enable row level security;
revoke all on public.connect_preapprovals from anon, authenticated;
