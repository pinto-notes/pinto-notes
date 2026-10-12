-- "Enjoying Pinto Notes?": Not now is no longer final. It waits at least 30 days, then the ask may
-- come once more; after a second answer it never comes again. Any other answer stays final.
--
-- pane_share_ask keeps how many times the account answered (asked) next to the latest choice and
-- when. pane_share_ask_state() says all three; 'decided' keeps its old meaning (an answer exists),
-- so apps from before this never ask again after Not now, as they always did.

alter table public.pane_share_ask add column if not exists asked integer not null default 1;

create or replace function public.pane_share_ask_decide(choice text) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.pane_share_ask as a (user_id, choice) values (uid, pane_share_ask_decide.choice)
  on conflict (user_id) do update set choice = excluded.choice, decided_at = now(), asked = a.asked + 1
    where a.choice = 'dismissed' and a.asked < 2 and a.decided_at <= now() - interval '30 days';
end $$;
revoke all on function public.pane_share_ask_decide(text) from public, anon;
grant execute on function public.pane_share_ask_decide(text) to authenticated;

create or replace function public.pane_share_ask_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'decided',    a.user_id is not null,
    'choice',     a.choice,
    'decided_at', a.decided_at,
    'asked',      coalesce(a.asked, 0),
    'days',       (select count(*) from public.pane_active_days d where d.user_id = (select auth.uid())),
    'developer',  public.pane_is_developer((select auth.uid())))
  from (select 1) one
  left join public.pane_share_ask a on a.user_id = (select auth.uid())
$$;
revoke all on function public.pane_share_ask_state() from public, anon;
grant execute on function public.pane_share_ask_state() to authenticated;
