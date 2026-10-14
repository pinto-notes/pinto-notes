-- Three refusals answered 40001 (serialization_failure), and PostgREST retries a transaction that
-- fails with 40001 by itself, at once and without end (4,054 attempts in 5 s on the local stack,
-- PostgREST 14.3, until the gateway gave up at 60 s). So the app never heard them: changing the
-- notes password while a locked note changed elsewhere hung for a minute. These answer PT409
-- (HTTP 409) with the same hint, which nothing retries. The collaboration functions get the same
-- fix in 20261014221000_collab_stale_key_answers.
--
-- The app tells "notes changed" from "password changed elsewhere" (also PT409) by the hint, and
-- reads create_account_key's refusal and share_note's by hint or not at all.

-- As in 20261001090000; stale_generation answers PT409.
create or replace function public.create_account_key(p_key_id text, p_verifier text, p_recovery_wrap text, p_generation integer)
returns table (key_id text, verifier text, recovery_wrap text, recovery_saved_at timestamptz, created boolean)
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  made boolean;
  current_generation integer;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select coalesce((select r.generation from public.account_key_resets r where r.user_id = uid), 0) into current_generation;
  if coalesce(p_generation, -1) < current_generation then
    raise exception 'Your notes were reset on another device. Open Pinto Notes again.' using errcode = 'PT409', hint = 'stale_generation';
  end if;
  insert into public.account_keys as k (user_id, key_id, verifier, recovery_wrap)
  values (uid, p_key_id, p_verifier, p_recovery_wrap)
  on conflict (user_id) do nothing;
  made := found;
  return query select k.key_id, k.verifier, k.recovery_wrap, k.recovery_saved_at, made
    from public.account_keys k where k.user_id = uid;
end $$;

-- As in 20261001090000; notes_changed answers PT409.
create or replace function public.change_notes_password(p_settings jsonb, p_expected_key_id text, p_notes jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  new_key text := p_settings ->> 'key_id';
  n jsonb;
  v bigint;
  versions jsonb := '[]'::jsonb;
  gone integer;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  update public.note_locks set
      salt = p_settings ->> 'salt',
      iterations = (p_settings ->> 'iterations')::integer,
      key_id = new_key,
      verifier = p_settings ->> 'verifier',
      hint = nullif(p_settings ->> 'hint', ''),
      previous = coalesce(p_settings -> 'previous', '[]'::jsonb)
    where user_id = uid and key_id = p_expected_key_id;
  if not found then
    raise exception 'Your notes password was changed on another device.' using errcode = 'PT409', hint = 'changed_elsewhere';
  end if;
  for n in select * from jsonb_array_elements(coalesce(p_notes, '[]'::jsonb)) loop
    update public.notes set head_ct = coalesce(n ->> 'head_ct', head_ct), locked_body = n ->> 'locked_body', updated_at = now()
      where id = (n ->> 'id')::uuid and user_id = uid and version = (n ->> 'version')::bigint
        and locked_body is not null and deleted_at is null
      returning version into v;
    if not found then
      raise exception 'Your notes changed on another device. Try again in a moment.' using errcode = 'PT409', hint = 'notes_changed';
    end if;
    versions := versions || jsonb_build_array(jsonb_build_object('id', n ->> 'id', 'version', v));
  end loop;
  delete from public.note_revisions
    where user_id = uid and locked_body is not null and split_part(locked_body, '.', 2) <> new_key;
  get diagnostics gone = row_count;
  return jsonb_build_object(
    'notes', versions,
    'stale', coalesce((select jsonb_agg(id) from public.notes
                       where user_id = uid and deleted_at is null and locked_body is not null
                         and split_part(locked_body, '.', 2) <> new_key), '[]'::jsonb),
    'versions_removed', gone);
end $$;

-- As in 20261001090000; share_changed answers PT409.
create or replace function public.share_note(p_note uuid, p_slug text, p_include_subnotes boolean, p_tag text, p_copy jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
begin
  if v_user is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_tag is null or p_tag !~ '^[0-9a-f]{64}$' or p_slug is null or p_slug !~ '^[A-Za-z0-9_-]{24,64}$' then
    raise exception 'Update Pinto Notes to share this note.' using errcode = '22023', hint = 'update_app';
  end if;
  if not exists (select 1 from public.notes n
                 where n.id = p_note and n.user_id = v_user and n.deleted_at is null and n.trashed_at is null) then
    raise exception 'no such note' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.notes n where n.id = p_note and n.locked_body is not null) then
    raise exception 'A locked note can''t be shared. Remove its lock first.' using errcode = '42501', hint = 'note_locked';
  end if;
  update public.note_shares set include_subnotes = coalesce(p_include_subnotes, false), share_tag = p_tag
    where note_id = p_note and revoked_at is null and slug = p_slug
    returning slug into v_slug;
  if v_slug is null then
    if exists (select 1 from public.note_shares where note_id = p_note and revoked_at is null) then
      raise exception 'This note was shared again on another device. Try again.' using errcode = 'PT409', hint = 'share_changed';
    end if;
    insert into public.note_shares (slug, note_id, user_id, include_subnotes, share_tag)
      values (p_slug, p_note, v_user, coalesce(p_include_subnotes, false), p_tag);
    v_slug := p_slug;
  end if;
  return jsonb_build_object('slug', v_slug, 'missing_files', public.pane_write_share_copy(v_slug, p_copy));
end $$;
