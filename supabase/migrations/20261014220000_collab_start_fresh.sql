-- Start fresh deletes the account's sharing keys and shared notes too (docs/Technical/collaboration-design.md,
-- "Identity keys"). Start fresh makes a new data key, and the identity key's private half is sealed under
-- the old one, so it can't be opened again; collab_publish_identity refuses a second key for an account
-- that has one, so without this the account could never share or join again. The design says Start fresh
-- is the one way an identity key changes; the people it shares with then see a key change warning.
--
-- start_fresh deletes the account's key row (account_keys); this runs then, so it holds whatever later
-- migrations do to start_fresh itself. With the identity go: the shared notes the account owns (their
-- members, changes, snapshots and links with them, as its own notes go), its memberships in other people's
-- notes (the wraps were sealed to the old identity and data key: it must be invited again), and its sealed
-- links and templates (copies of notes that are gone).
create or replace function public.collab_forget_on_start_fresh() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.shared_notes where owner_id = old.user_id;
  delete from public.note_members where user_id = old.user_id;
  delete from public.identity_keys where user_id = old.user_id;
  delete from public.sealed_links where user_id = old.user_id;
  delete from public.shared_templates where user_id = old.user_id;
  return old;
end $$;
revoke all on function public.collab_forget_on_start_fresh() from public, anon, authenticated;

drop trigger if exists collab_forget_on_start_fresh on public.account_keys;
create trigger collab_forget_on_start_fresh after delete on public.account_keys
  for each row execute function public.collab_forget_on_start_fresh();
