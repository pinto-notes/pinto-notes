-- AI changes: every change an AI connection made, across all of a person's notes, newest first,
-- so the apps can show them in one place and undo any of them.
--
-- Edits are already kept: an AI's edit writes the text it replaced as a revision with
-- source 'mcp' (or 'restore', for its restore_revision tool) and its name in `client`
-- (20260929200000_version_history.sql), and thinning keeps both sides of an AI edit for 90 days.
-- What isn't kept anywhere is an AI making a note, moving one or deleting one: those change no
-- text, so they make no revision. note_ai_events records them, written by the database in the
-- same write, so nobody can forge or skip one. No text goes in it: only which note, which AI,
-- what kind of change, and folder ids (folder names are sealed; the apps name them).
--
-- One change here: typing right after an AI's edit kept no revision when you had also typed in
-- the minute before it (the one-a-minute throttle on app revisions), so the AI's text was lost and
-- its edit couldn't be shown. Replacing text someone else wrote now always keeps it.
--
-- ai_changes(before, limit, ai) lists both kinds, newest first, a page at a time. It runs as the
-- caller: row-level security keeps it to their own notes. Additive only.

create table public.note_ai_events (
  id         bigint generated always as identity primary key,
  note_id    uuid not null references public.notes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('created', 'moved', 'deleted', 'restored')),
  client     text check (client is null or char_length(client) <= 100),
  -- 'moved': the folder it left and the one it went to (null: no folder).
  from_folder uuid,
  to_folder   uuid,
  -- The note's version once the change was written.
  version    bigint not null,
  created_at timestamptz not null default clock_timestamp()
);
create index note_ai_events_user on public.note_ai_events (user_id, created_at desc);
create index note_ai_events_note on public.note_ai_events (note_id, id desc);

alter table public.note_ai_events enable row level security;
create policy "own ai events read" on public.note_ai_events for select to authenticated
  using (user_id = (select auth.uid()));
-- Only the trigger below writes it.
revoke all on public.note_ai_events from anon;
revoke insert, update, delete, truncate on public.note_ai_events from authenticated;
grant select on public.note_ai_events to authenticated;

-- The list reads every AI revision of one person, newest first.
create index note_revisions_ai on public.note_revisions (user_id, created_at desc)
  where source in ('mcp', 'restore');

create or replace function public.pane_note_ai_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  src text := coalesce(nullif(current_setting('pane.source', true), ''), 'app');
  who text := left(nullif(current_setting('pane.client', true), ''), 100);
  what text;
begin
  if tg_op = 'UPDATE' and new.deleted_at is not null then
    -- Deleted for good: it forgets what was done to it, as it forgets its versions.
    delete from public.note_ai_events where note_id = new.id;
    return null;
  end if;
  if src <> 'mcp' then return null; end if;
  if tg_op = 'INSERT' then
    what := 'created';
  elsif old.trashed_at is null and new.trashed_at is not null then
    what := 'deleted';
  elsif old.trashed_at is not null and new.trashed_at is null then
    what := 'restored';
  elsif new.folder_id is distinct from old.folder_id then
    what := 'moved';
  else
    return null;
  end if;
  insert into public.note_ai_events (note_id, user_id, kind, client, from_folder, to_folder, version)
  values (new.id, new.user_id, what, who,
          case when what = 'moved' then old.folder_id end,
          case when what = 'moved' then new.folder_id end,
          new.version);
  -- Kept like AI revisions: 90 days, and never more than 200 per note.
  delete from public.note_ai_events e
  where e.note_id = new.id
    and (e.created_at < clock_timestamp() - interval '90 days'
         or e.id not in (select id from public.note_ai_events where note_id = new.id order by id desc limit 200));
  return null;
end $$;
revoke all on function public.pane_note_ai_event() from public, anon, authenticated;

create trigger notes_ai_event after insert or update of folder_id, trashed_at, deleted_at on public.notes
  for each row execute function public.pane_note_ai_event();

-- As in 20261001090000_e2ee.sql, except that the one-a-minute throttle on your typing only skips
-- text you wrote yourself in the app: text an AI (or a restore, or an import) wrote is always kept.
create or replace function public.pane_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  src text := coalesce(nullif(current_setting('pane.source', true), ''), 'app');
  who text := public.pane_writer();
  changed boolean;
begin
  new.server_updated_at := clock_timestamp();
  if tg_table_name = 'notes' then
    if tg_op = 'INSERT' then
      new.body_source := left(src, 20);
      new.body_client := who;
      new.body_at := clock_timestamp();
    elsif tg_op = 'UPDATE' then
      new.version := old.version + 1;
      changed := new.body_ct is distinct from old.body_ct or new.head_ct is distinct from old.head_ct
        or new.locked_body is distinct from old.locked_body;
      if changed then
        new.body_source := left(src, 20);
        new.body_client := who;
        new.body_at := clock_timestamp();
      else
        new.body_source := old.body_source;
        new.body_client := old.body_client;
        new.body_at := old.body_at;
      end if;
      if new.deleted_at is not null then
        delete from public.note_revisions where note_id = old.id;
      elsif old.locked_body is null and new.locked_body is not null then
        -- Locking: no version the AI server could open may stay behind.
        delete from public.note_revisions where note_id = old.id;
      elsif changed and (src <> 'app' or coalesce(old.body_source, 'app') <> 'app'
                         or not exists (select 1 from public.note_revisions r
                        where r.note_id = old.id and r.source = 'app'
                          and r.created_at > clock_timestamp() - interval '1 minute')) then
        insert into public.note_revisions (note_id, user_id, body_ct, head_ct, locked_body, version, source, client, body_source, body_client, body_at)
        values (old.id, old.user_id, old.body_ct, old.head_ct, old.locked_body, old.version, src, who, old.body_source, old.body_client, old.body_at);
      end if;
    end if;
  end if;
  return new;
end $$;

-- Every change an AI made to the caller's notes, newest first: `p_limit` of them (at most 200)
-- from before `p_before` (null: from now), only those by `p_ai` when it's given.
--   kind            'edit' (it changed the text), 'restore' (it restored an earlier version),
--                   'created', 'moved', 'deleted' or 'restored' (out of Recently Deleted)
--   before_version  edit and restore: the version whose text it replaced (a revision)
--   after_version   the version holding the text it wrote, as a revision; null: the note still
--                   has that text, or has had no edit since (the note's own text is it)
--   current_version the note's version now
-- Notes deleted for good are left out; notes in Recently Deleted are in, marked trashed.
create or replace function public.ai_changes(p_before timestamptz default null, p_limit integer default 50, p_ai text default null)
returns table (
  id text, kind text, note_id uuid, ai text, at timestamptz,
  before_version bigint, after_version bigint, current_version bigint,
  from_folder uuid, to_folder uuid, trashed boolean
)
language sql stable security invoker set search_path = '' as $$
  with edits as (
    select 'r' || r.id as id, case r.source when 'mcp' then 'edit' else 'restore' end as kind,
           r.note_id, coalesce(r.client, 'An AI') as ai, r.created_at as at,
           r.version as before_version,
           (select min(n2.version) from public.note_revisions n2 where n2.note_id = r.note_id and n2.version > r.version) as after_version,
           null::uuid as from_folder, null::uuid as to_folder
    from public.note_revisions r
    where r.user_id = (select auth.uid())
      and (r.source = 'mcp' or (r.source = 'restore' and r.client is not null and r.client not in ('iPhone', 'iPad', 'Mac')))
      and r.created_at < coalesce(p_before, 'infinity')
      and (p_ai is null or r.client = p_ai)
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  ), events as (
    select 'e' || e.id as id, e.kind, e.note_id, coalesce(e.client, 'An AI') as ai, e.created_at as at,
           null::bigint as before_version,
           case when e.kind = 'created'
             then (select min(n2.version) from public.note_revisions n2 where n2.note_id = e.note_id and n2.version >= e.version)
           end as after_version,
           e.from_folder, e.to_folder
    from public.note_ai_events e
    where e.user_id = (select auth.uid())
      and e.created_at < coalesce(p_before, 'infinity')
      and (p_ai is null or e.client = p_ai)
    order by e.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  )
  select c.id, c.kind, c.note_id, c.ai, c.at, c.before_version, c.after_version, n.version, c.from_folder, c.to_folder,
         n.trashed_at is not null
  from (select * from edits union all select * from events) c
  join public.notes n on n.id = c.note_id and n.deleted_at is null
  order by c.at desc, c.id desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
$$;
revoke all on function public.ai_changes(timestamptz, integer, text) from public, anon;
grant execute on function public.ai_changes(timestamptz, integer, text) to authenticated;
