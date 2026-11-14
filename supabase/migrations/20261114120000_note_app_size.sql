-- Note apps can be games (2026-11-14: Doom, its 4 MB shareware WAD as base64): a project may be
-- 16 MB before sealing (NotePageProject.maxBytes, MAX_PROJECT_BYTES in app_project.ts), about
-- 22.4 MB as a sealed box. The 4.5 MB cap on a page's sealed text becomes 23.5 MB, for the page,
-- its draft and its versions.
alter table public.note_pages drop constraint if exists note_pages_page_ct_check;
alter table public.note_pages add constraint note_pages_page_ct_check
  check (page_ct is null or (page_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(page_ct) <= 23500000));

alter table public.note_pages drop constraint if exists note_pages_draft_ct_check;
alter table public.note_pages add constraint note_pages_draft_ct_check
  check (draft_ct is null or (draft_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(draft_ct) <= 23500000));

alter table public.note_page_versions drop constraint if exists note_page_versions_page_ct_check;
alter table public.note_page_versions add constraint note_page_versions_page_ct_check
  check (page_ct ~ '^amb2\.[0-9a-f]{16}\.[A-Za-z0-9+/]+={0,2}$' and octet_length(page_ct) <= 23500000);
