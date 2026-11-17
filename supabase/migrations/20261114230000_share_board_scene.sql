-- A shared whiteboard's scene, for its page's "Download .excalidraw" (14 November 2026).
--
-- Beside the board's picture (20261114210000_share_board_picture.sql), the owner's device
-- publishes the board's scene: the .excalidraw file, a standard Excalidraw JSON document, with a
-- template's how-to line left out. The page offers it as a download, since the format is the
-- promise (whiteboard council, round 3). One per live link, written only by the link's owner. It
-- goes with the copy and the picture (the link stopped, reported or forgotten; the note locked,
-- trashed or deleted) and is served only while the page is (shared_note answers).

create table public.note_share_scenes (
  slug       text primary key references public.note_shares (slug) on delete cascade,
  content    text not null check (octet_length(content) <= 4194304),
  updated_at timestamptz not null default now()
);
alter table public.note_share_scenes enable row level security;
revoke all on public.note_share_scenes from anon, authenticated;

-- The owner's device publishes the board's scene (the .excalidraw file's JSON, at most 4 MB), or
-- takes it away (null: nothing is drawn, or it's too big to offer). Checked as
-- publish_share_picture is: signed in, the live link is yours, the rate, and only while the note
-- can be shown.
create or replace function public.publish_share_scene(p_slug text, p_content text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  j jsonb;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.note_shares s join public.notes n on n.id = s.note_id
                 where s.slug = p_slug and s.user_id = auth.uid() and s.revoked_at is null
                   and n.locked_body is null and n.trashed_at is null and n.deleted_at is null) then
    raise exception 'That note isn''t shared.' using errcode = 'P0002';
  end if;
  perform public.pane_take('write', 10);
  if p_content is null then
    delete from public.note_share_scenes where slug = p_slug;
    return;
  end if;
  if octet_length(p_content) > 4194304 then
    raise exception 'This whiteboard is too big to offer on its page (the limit is 4 MB).' using errcode = 'PT413', hint = 'scene_bytes';
  end if;
  -- An Excalidraw file: a JSON object of type "excalidraw" with a list of elements.
  begin
    j := p_content::jsonb;
  exception when others then
    raise exception 'A whiteboard''s scene is an Excalidraw file.' using errcode = '22023';
  end;
  if jsonb_typeof(j) <> 'object' or j->>'type' is distinct from 'excalidraw' or jsonb_typeof(j->'elements') is distinct from 'array' then
    raise exception 'A whiteboard''s scene is an Excalidraw file.' using errcode = '22023';
  end if;
  insert into public.note_share_scenes (slug, content, updated_at)
  values (p_slug, p_content, now())
  on conflict (slug) do update set content = excluded.content, updated_at = excluded.updated_at;
end $$;
revoke all on function public.publish_share_scene(text, text) from public, anon;
grant execute on function public.publish_share_scene(text, text) to authenticated;

-- As in 20261114210000_share_board_picture.sql, and the scene goes with the copy.
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
    delete from public.note_share_scenes where slug = new.slug;
  end if;
  return new;
end $$;

-- As in 20261114210000_share_board_picture.sql: a note locked, trashed or deleted takes its
-- pictures and scenes down under every link. The device publishes them again if it comes back.
create or replace function public.pane_note_forget_pictures() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (old.locked_body is null and new.locked_body is not null)
     or (old.trashed_at is null and new.trashed_at is not null)
     or (old.deleted_at is null and new.deleted_at is not null) then
    delete from public.note_share_pictures p using public.note_shares s where s.slug = p.slug and s.note_id = new.id;
    delete from public.note_share_scenes c using public.note_shares s where s.slug = c.slug and s.note_id = new.id;
  end if;
  return null;
end $$;

-- As in 20261114210000_share_board_picture.sql, with the board's scene: its size in bytes and a
-- version for its address, or null.
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
                  from public.note_share_pictures p where p.slug = s.slug),
      'scene', (select jsonb_build_object('size', octet_length(c.content),
                                          'version', (extract(epoch from c.updated_at) * 1000)::bigint)
                from public.note_share_scenes c where c.slug = s.slug));
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

-- A shared board's scene and the page's title (its file's name), only while its page shows. For
-- the share-files function alone.
create or replace function public.shared_scene(p_slug text)
returns table (title text, updated_at timestamptz, content text)
language sql stable security definer set search_path = '' as $$
  select s.title, c.updated_at, c.content
  from public.note_share_scenes c join public.note_shares s on s.slug = c.slug
  where c.slug = p_slug and public.shared_note(p_slug) is not null
$$;
revoke all on function public.shared_scene(text) from public, anon, authenticated;
