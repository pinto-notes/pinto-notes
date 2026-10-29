-- Allowing an AI on the web page, with no device (supabase/functions/mcp/oauth.ts, /connect/allow).
--
-- For an account whose key the server keeps a copy of (20261011120000_key_copy.sql), the MCP
-- function opens that copy once to make the authorization code's wrap, the same wrap a device
-- makes today. Each time it does, the account's log of what happened to the copy says so:
-- 'connected', next to 'fetched' for a device that got the key. It also counts toward the
-- function's per-account limit on such approvals. Never key material.
--
-- Additive: builds from before this never write or read 'connected'.

alter table public.key_copy_events drop constraint key_copy_events_what_check;
alter table public.key_copy_events add constraint key_copy_events_what_check
  check (what in ('stored', 'fetched', 'removed', 'refused', 'mailed', 'connected'));
