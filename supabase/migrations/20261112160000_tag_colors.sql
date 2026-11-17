-- The colours chosen for tags (#needs-review in a note), for every device of the account. One box,
-- sealed in the app with the account's key like the notes' text, so the tags' names never reach the
-- server readable. Only the person's own app reads or writes it (the profiles policies); the
-- functions that show a profile to others pick their columns and never this one.
alter table public.profiles add column tag_colors_ct text
  check (tag_colors_ct is null or char_length(tag_colors_ct) <= 65536);
