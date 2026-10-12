-- The "Connect your AI" card at the foot of the sidebar (shown until an AI is connected) closes
-- for good, on every device of the account, like the Templates card:
-- pane_setup_mark('connect_card_closed') keeps when, and pane_setup_state() says so.
alter table public.pane_setup add column if not exists connect_card_closed_at timestamptz;

create or replace function public.pane_setup_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'imported',   s.imported_at is not null,
    'dismissed',  s.dismissed_at is not null,
    'celebrated', s.celebrated_at is not null,
    'templates_closed', s.templates_closed_at is not null,
    'connect_card_closed', s.connect_card_closed_at is not null,
    'connected',  exists (select 1 from public.mcp_tokens t where t.user_id = (select auth.uid())),
    'ai_edits',   coalesce((select sum(a.n) from public.pane_activity a
                            where a.user_id = (select auth.uid()) and a.kind = 'ai_edit'), 0))
  from (select 1) one
  left join public.pane_setup s on s.user_id = (select auth.uid())
$$;
revoke all on function public.pane_setup_state() from public, anon;
grant execute on function public.pane_setup_state() to authenticated;

create or replace function public.pane_setup_mark(step text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if step not in ('imported', 'dismissed', 'celebrated', 'templates_closed', 'connect_card_closed', 'reset') then
    raise exception 'unknown step' using errcode = '22023';
  end if;
  insert into public.pane_setup (user_id) values (uid) on conflict (user_id) do nothing;
  if step = 'reset' then
    update public.pane_setup set imported_at = null, dismissed_at = null, celebrated_at = null, updated_at = now()
    where user_id = uid;
    return;
  end if;
  update public.pane_setup set
    imported_at   = case when step = 'imported'   then coalesce(imported_at, now())   else imported_at end,
    dismissed_at  = case when step = 'dismissed'  then coalesce(dismissed_at, now())  else dismissed_at end,
    celebrated_at = case when step = 'celebrated' then coalesce(celebrated_at, now()) else celebrated_at end,
    templates_closed_at = case when step = 'templates_closed' then coalesce(templates_closed_at, now()) else templates_closed_at end,
    connect_card_closed_at = case when step = 'connect_card_closed' then coalesce(connect_card_closed_at, now()) else connect_card_closed_at end,
    updated_at = now()
  where user_id = uid;
end $$;
revoke all on function public.pane_setup_mark(text) from public, anon;
grant execute on function public.pane_setup_mark(text) to authenticated;
