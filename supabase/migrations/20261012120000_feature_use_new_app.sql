-- New App's one-off tip ("Hold for New App"): once it has been shown on one device, it isn't
-- shown on the account's other devices. Its mark is a feature name like the other tips'.
-- Additive: the list of names grows by one.
alter table public.pane_feature_use drop constraint if exists pane_feature_use_feature_check;
alter table public.pane_feature_use add constraint pane_feature_use_feature_check
  check (feature in ('versionHistory', 'shareLink', 'menuBar', 'shareExtension', 'template', 'appNote', 'newApp'));
