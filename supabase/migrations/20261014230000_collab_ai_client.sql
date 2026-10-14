-- Who wrote a shared note's change: note_updates.client names the AI ("Claude") when the MCP
-- server wrote it, and is null for a person on a device, so the note can say "Sara's Claude".
-- Until now it took pane_writer(), which falls back to the device header, and every change typed
-- on a Mac said "Mac" as if an AI named Mac had written it. The MCP server sets pane.source = 'mcp'
-- in every tool call's transaction (mcp/tools.ts, runIn). Otherwise as in
-- 20261014221000_collab_stale_key_answers.sql (not_member, PT409).
create or replace function public.collab_update_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.pane_take('write');
  -- Not a member at all (removed, or never in it) is refused here too, not left to the policy.
  if public.collab_role(new.note_id) is null then
    raise exception 'You''re not in this note.' using errcode = '42501', hint = 'not_member';
  end if;
  if public.collab_role(new.note_id) not in ('owner', 'editor') then
    raise exception 'You can view this note but not change it.' using errcode = '42501', hint = 'read_only';
  end if;
  if new.epoch <> (select epoch from public.shared_notes where id = new.note_id) then
    raise exception 'The note''s key changed. Open it again.' using errcode = 'PT409', hint = 'stale_epoch';
  end if;
  new.author_id := auth.uid();
  new.created_at := now();
  if tg_table_name = 'note_updates' then
    new.client := case when current_setting('pane.source', true) = 'mcp' then left(public.pane_writer(), 100) end;
  end if;
  return new;
end $$;
