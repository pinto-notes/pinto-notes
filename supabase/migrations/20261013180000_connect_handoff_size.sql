-- The code a device seals for a browser holds the client's return address with its state, and
-- ChatGPT's and the OpenAI platform's states are a few hundred characters: 600 turned them away.
-- 8000 fits the longest return address /authorize takes (4000, the redirect column's check) once
-- sealed (MAX_HANDOFF in supabase/functions/mcp/oauth.ts).
alter table public.connect_asks drop constraint if exists connect_asks_answer_check;
alter table public.connect_asks add constraint connect_asks_answer_check
  check (answer is null or (answer ~ '^amb2h\.[A-Za-z0-9+/]+={0,2}$' and char_length(answer) <= 8000));
