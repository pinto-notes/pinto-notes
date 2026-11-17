-- A shared whiteboard's picture (14 November 2026).
--
-- A whiteboard's drawing is its page data, sealed like every note, so its shared page can't draw
-- it: the owner's device publishes a picture of the board (a PNG, light, at 2x) beside the page's
-- readable copy, and the page shows it. One per live link, written only by the link's owner. It
-- goes with the copy (the link stopped, reported or forgotten; the note locked, trashed or
-- deleted) and is served only while the page is (shared_note answers).

create table public.note_share_pictures (
  slug       text primary key references public.note_shares (slug) on delete cascade,
  width      integer not null check (width between 1 and 32768),
  height     integer not null check (height between 1 and 32768),
  content    bytea not null check (octet_length(content) <= 4194304),
  updated_at timestamptz not null default now()
);
alter table public.note_share_pictures enable row level security;
revoke all on public.note_share_pictures from anon, authenticated;

-- The owner's device publishes the board's picture (base64 PNG, at most 4 MB), or takes it away
-- (null: nothing is drawn). Checked as publish_share_file is: signed in, the live link is yours,
-- and the rate; and only while the note can be shown.
create or replace function public.publish_share_picture(p_slug text, p_content text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  bytes bytea;
  w bigint;
  h bigint;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.note_shares s join public.notes n on n.id = s.note_id
                 where s.slug = p_slug and s.user_id = auth.uid() and s.revoked_at is null
                   and n.locked_body is null and n.trashed_at is null and n.deleted_at is null) then
    raise exception 'That note isn''t shared.' using errcode = 'P0002';
  end if;
  perform public.pane_take('write', 10);
  if p_content is null then
    delete from public.note_share_pictures where slug = p_slug;
    return;
  end if;
  -- 4 MB as base64, before decoding any of it.
  if octet_length(p_content) > 5592408 then
    raise exception 'This whiteboard is too big to show on its page (the limit is 4 MB).' using errcode = 'PT413', hint = 'picture_bytes';
  end if;
  bytes := decode(p_content, 'base64');
  if octet_length(bytes) > 4194304 then
    raise exception 'This whiteboard is too big to show on its page (the limit is 4 MB).' using errcode = 'PT413', hint = 'picture_bytes';
  end if;
  -- A PNG: its signature, then the IHDR chunk, which starts with the size.
  if octet_length(bytes) < 33 or substring(bytes from 1 for 16) <> '\x89504e470d0a1a0a0000000d49484452'::bytea then
    raise exception 'A whiteboard''s picture is a PNG.' using errcode = '22023';
  end if;
  w := (get_byte(bytes, 16)::bigint << 24) | (get_byte(bytes, 17) << 16) | (get_byte(bytes, 18) << 8) | get_byte(bytes, 19);
  h := (get_byte(bytes, 20)::bigint << 24) | (get_byte(bytes, 21) << 16) | (get_byte(bytes, 22) << 8) | get_byte(bytes, 23);
  if w not between 1 and 32768 or h not between 1 and 32768 then
    raise exception 'A whiteboard''s picture is a PNG.' using errcode = '22023';
  end if;
  insert into public.note_share_pictures (slug, width, height, content, updated_at)
  values (p_slug, w, h, bytes, now())
  on conflict (slug) do update
    set width = excluded.width, height = excluded.height, content = excluded.content, updated_at = excluded.updated_at;
end $$;
revoke all on function public.publish_share_picture(text, text) from public, anon;
grant execute on function public.publish_share_picture(text, text) to authenticated;

-- As in 20261001090000_e2ee.sql, and the picture goes with the copy.
create or replace function public.pane_share_forget_copy() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.revoked_at is not null and old.revoked_at is null then
    new.title := null;
    new.body := null;
    new.published_at := null;
    -- A stopped link's tag goes too, so the link can't be replayed as a verified share.
    new.share_tag := null;
    delete from public.note_share_pages where slug = new.slug;
    delete from public.note_share_files where slug = new.slug;
    delete from public.note_share_pictures where slug = new.slug;
  end if;
  return new;
end $$;

-- A note locked, trashed or deleted takes its pictures down under every link, as it takes the
-- copies (pane_note_forget_copies). The device publishes it again if the note comes back.
create or replace function public.pane_note_forget_pictures() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (old.locked_body is null and new.locked_body is not null)
     or (old.trashed_at is null and new.trashed_at is not null)
     or (old.deleted_at is null and new.deleted_at is not null) then
    delete from public.note_share_pictures p using public.note_shares s where s.slug = p.slug and s.note_id = new.id;
  end if;
  return null;
end $$;
create trigger notes_forget_share_pictures after update of locked_body, trashed_at, deleted_at on public.notes
  for each row execute function public.pane_note_forget_pictures();

-- As in 20261001090000_e2ee.sql, with the board's picture on the page: its size in pixels (at 2x)
-- and a version for its address, or null.
create or replace function public.shared_note(p_slug text, p_sub uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.note_shares;
  pg public.note_share_pages;
begin
  if p_slug is null or p_slug !~ '^[A-Za-z0-9_-]{24,64}$' then return null; end if;
  select * into s from public.note_shares where slug = p_slug and revoked_at is null and published_at is not null;
  if not found then return null; end if;
  if not exists (select 1 from public.notes r where r.id = s.note_id and r.deleted_at is null
                 and r.trashed_at is null and r.locked_body is null) then
    return null;
  end if;
  if p_sub is null then
    return jsonb_build_object(
      'title', s.title, 'body', s.body, 'updated_at', s.published_at,
      'include_subnotes', s.include_subnotes, 'is_sub', false, 'root_title', s.title,
      'shared_by', public.pane_sharer(s.user_id),
      'subnotes', case when s.include_subnotes then coalesce((
          select jsonb_agg(jsonb_build_object('id', p.note_id, 'title', p.title) order by p.title)
          from public.note_share_pages p where p.slug = s.slug and p.parent_id = s.note_id), '[]'::jsonb) else '[]'::jsonb end,
      'picture', (select jsonb_build_object('width', p.width, 'height', p.height,
                                            'version', (extract(epoch from p.updated_at) * 1000)::bigint)
                  from public.note_share_pictures p where p.slug = s.slug));
  end if;
  if not s.include_subnotes then return null; end if;
  select * into pg from public.note_share_pages where slug = s.slug and note_id = p_sub;
  if not found then return null; end if;
  return jsonb_build_object(
    'title', pg.title, 'body', pg.body, 'updated_at', s.published_at,
    'include_subnotes', true, 'is_sub', true, 'root_title', s.title,
    'shared_by', public.pane_sharer(s.user_id),
    'subnotes', coalesce((
        select jsonb_agg(jsonb_build_object('id', p.note_id, 'title', p.title) order by p.title)
        from public.note_share_pages p where p.slug = s.slug and p.parent_id = pg.note_id), '[]'::jsonb));
end $$;
revoke all on function public.shared_note(text, uuid) from public;
grant execute on function public.shared_note(text, uuid) to anon, authenticated;

-- A shared board's picture, only while its page shows. For the share-files function alone.
create or replace function public.shared_picture(p_slug text)
returns table (width integer, height integer, updated_at timestamptz, content bytea)
language sql stable security definer set search_path = '' as $$
  select p.width, p.height, p.updated_at, p.content
  from public.note_share_pictures p
  where p.slug = p_slug and public.shared_note(p_slug) is not null
$$;
revoke all on function public.shared_picture(text) from public, anon, authenticated;
