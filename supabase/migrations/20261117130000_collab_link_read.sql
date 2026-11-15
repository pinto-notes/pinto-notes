-- A shared whiteboard opened with its link in a browser, by someone who isn't signed in
-- (docs/Technical/collaboration-design.md, "Whiteboards in a browser").
--
-- A link is `<site>/s/<id>#<secret>`. The secret never leaves the browser: it derives the answer
-- the server checks (its hash is `answer_hash`) and the key the note key is sealed under for the
-- link (`key_wrap`). Whoever proves they hold the link may already join with its role
-- (collab_join_link). Here they may also read without an account: the note's sealed document and
-- its sealed pictures, under the same proof and the same checks as collab_open_link (the link is
-- live, the answer is right, and the link is for the note's current key). Nothing here can write.
--
-- What it gives is what a member reads (note_snapshots, note_updates, note_files), all sealed
-- under the note key, which only the link's secret opens. A link that is stopped, changed or
-- expired, or a note whose key changed since (someone was removed), reads nothing more.

grant execute on function public.collab_open_link(text, text) to anon;

-- The note and its current key generation for a link and its answer, or an error as collab_open_link
-- gives. For the two functions below only.
create or replace function public.collab_link_note(p_link text, p_answer text, out note_id uuid, out epoch int)
language plpgsql stable security definer set search_path = '' as $$
declare
  l public.note_invite_links;
  current_epoch int;
begin
  if p_link !~ '^[A-Za-z0-9_-]{22}$' or p_answer !~ '^[0-9a-f]{64}$' then
    raise exception 'That link has expired or was stopped.' using errcode = 'P0002';
  end if;
  select * into l from public.note_invite_links where id = p_link and expires_at > now();
  select s.epoch into current_epoch from public.shared_notes s where s.id = l.note_id;
  if l.id is null or l.answer_hash <> encode(sha256(decode(p_answer, 'hex')), 'hex') or l.epoch <> current_epoch then
    raise exception 'That link has expired or was stopped.' using errcode = 'P0002';
  end if;
  note_id := l.note_id;
  epoch := current_epoch;
end $$;
revoke all on function public.collab_link_note(text, text) from public, anon, authenticated;

-- The document after `p_after` (the last change the browser has; 0 for all of it): the newest
-- snapshot past it under the current key, then the changes after that, oldest first, 200 at a time
-- (`more` says there are others). The same as a member's pull (SupabaseCollabTransport.pull).
create or replace function public.collab_link_pull(p_link text, p_answer text, p_after bigint default 0)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  n record;
  snap public.note_snapshots;
  from_id bigint;
  rows jsonb;
  more boolean;
begin
  select * into n from public.collab_link_note(p_link, p_answer);
  select * into snap from public.note_snapshots s
    where s.note_id = n.note_id and s.epoch = n.epoch and (coalesce(p_after, 0) = 0 or s.upto > p_after)
    order by s.upto desc limit 1;
  from_id := greatest(coalesce(p_after, 0), coalesce(snap.upto, 0));
  select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'author_id', u.author_id, 'epoch', u.epoch, 'ct', u.ct, 'client', u.client) order by u.id), '[]'::jsonb)
    into rows
    from (select * from public.note_updates u where u.note_id = n.note_id and u.id > from_id order by u.id limit 200) u;
  more := jsonb_array_length(rows) = 200;
  return jsonb_build_object(
    'epoch', n.epoch,
    'snapshot', case when snap.note_id is null then null
                     else jsonb_build_object('upto', snap.upto, 'epoch', snap.epoch, 'ct', snap.ct) end,
    'updates', rows,
    'more', more);
end $$;
revoke all on function public.collab_link_pull(text, text, bigint) from public;
grant execute on function public.collab_link_pull(text, text, bigint) to anon, authenticated;

-- One picture on the board, sealed under the note key (`amb3f`), or nothing when it isn't there.
create or replace function public.collab_link_file(p_link text, p_answer text, p_file text)
returns table (file_id text, epoch int, ct text)
language plpgsql stable security definer set search_path = '' as $$
declare
  n record;
begin
  select * into n from public.collab_link_note(p_link, p_answer);
  return query select f.file_id, f.epoch, f.ct from public.note_files f where f.note_id = n.note_id and f.file_id = p_file;
end $$;
revoke all on function public.collab_link_file(text, text, text) from public;
grant execute on function public.collab_link_file(text, text, text) to anon, authenticated;
