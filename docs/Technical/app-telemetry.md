# App telemetry

What the iPhone and Mac apps report about themselves: errors and crashes, a few product events,
and performance numbers. This page lists every event and everything an event can carry.
`PaneTests/TelemetryTests.swift` checks it against the code, so an event or a value that isn't
written here fails the tests.

Why it exists: the 1.1.2 Mac download never saved the account's key. A Keychain write failed with
-34018 on every save, the result was ignored, and every relaunch asked for the recovery key. Nothing
in the app reported it, and it went unnoticed for more than a week.

## Where it goes, and when

- **Destination:** the PostHog project the website uses, in the EU (`https://eu.i.posthog.com`,
  the `batch/` endpoint). The app has its own small client (`Pane/Telemetry/Telemetry.swift`): no
  PostHog SDK, no autocapture, no session replay, no screen recording.
- **Which builds send:** the released app and Pinto Notes Beta, and only when the build was given
  a project key (`PANE_POSTHOG_KEY` in `Config/Backend.local.xcconfig`; empty in the checked-in
  `Config/Backend.xcconfig`). Releases built by `.github/workflows/release.yml` take it from the
  repository variable `POSTHOG_KEY`; while that variable is not set, they send nothing. Debug and QA builds, unit and UI tests, capture runs, `-local`
  launches and the Simulator never send (`TelemetryGate`).
- **The switch:** Settings › General › Share diagnostics and usage, on by default. Off, nothing is
  kept or sent, and what was waiting is dropped, with the speeds not yet sent.
- **Who an event is from:** the account's id once signed in, so "this account is stuck on the key
  screen" can be answered. Before sign-in, a random id made when the app starts and kept in
  memory only: no identifier is stored on the device, so two launches before sign-in can't be
  linked. Signing out starts a new random id. Delete Account does too, and drops what was
  waiting unsent; only `account_deleted` goes out under the account's id.
- **No profile:** every event says `$process_person_profile: false`, so PostHog keeps no person
  profile, and `$geoip_disable: true`, so it works out no location from the request.
- **The queue:** events wait in `Application Support/Pane/telemetry-queue.jsonl`, at most 200;
  more are dropped. The file is written as each event is recorded, so a quit, a crash or the
  system ending the app doesn't lose what was waiting. They go out in batches of up to 50: two
  seconds after an error, within a minute otherwise, when the app leaves the front, and at the
  next launch for whatever a crash or a missing connection left behind.

## What is never sent

Note text, titles, folder names, file names, search terms, anything an AI wrote, share link ids,
email addresses, recovery keys or any key material, access tokens, device names, and the name or
address of an AI app.

This is enforced by the types, not by care at each call:

- `Telemetry.record` takes a `TelemetryEvent` and nothing else.
- A value (`TelemetryValue`) is a number, a yes or no, a case of a closed enum (`TelemetryWord`),
  a UUID, or a version number that is only digits and dots (`VersionNumber`). There is no way to
  make one from other text.
- Errors are mapped to a kind and codes (`Pane/Telemetry/TelemetryFailure.swift`). An error's
  description or message is never read: it can hold a file name or a title.
- Tests: every string in a batch must be on the list of words below, a UUID, a version number or
  a timestamp (`everyStringInABatchIsOnTheList`), and sample note text pushed through every
  place that takes a string from outside never shows up in a batch (`noteTextNeverReachesABatch`).

## On every event

| Property | Values |
|---|---|
| `app_version`, `app_build`, `os_version` | Version numbers |
| `platform` | `ios`, `macos` |
| `device_class` | `iphone`, `ipad`, `mac` (never the model) |
| `channel` | `release`, `beta` (`debug` builds never send) |
| `distribution` | `app_store` (App Store and TestFlight), `direct` (the Mac download) |
| `internal` | `true` on a Pinto Notes team member's own device, so their tests are left out of the numbers. Everyone else's events don't carry it. Set by `scripts/install-mac.sh` and `scripts/install-phone.sh` (the `PintoInternal` default) |

## Product events

| Event | When | Properties |
|---|---|---|
| `app_opened` | At launch, and once for each new day (UTC) the app is still running | `launch`, `signed_in` (yes or no) |
| `signed_in` | A sign-in worked | `method`: `apple`, `apple_web` (Sign in with Apple through the web, in the Mac download), `google`, `email` |
| `signed_up` | A sign-in worked for an account made in the last five minutes, or an email sign-up was confirmed | `method` |
| `key_ready` | The account's key arrived on this device while the app was running | `how`: `created`, `recovery_key`, `linked` (Add a device), `icloud_keychain`, `start_fresh`, `sign_in` (from the copy the server keeps); `store`: `keychain` (the data protection keychain, synced through iCloud Keychain), `file` (this device only: the Mac download, which has no keychain access group), `memory` (tests) |
| `gate_shown` | A screen between signing in and the notes was shown (once a launch for each) | `screen`: `welcome`, `add_device`, `no_device`, `waiting`, `recovery`, `start_fresh`, `unreachable`, `accountGone` (the account was deleted on the server), `checking`, `held` (waiting out the hold after a password reset), `before_fetch` (before the key comes from the copy the server keeps: sign in again, or say yes first) |
| `first_note_created` | The first note made with New Note on this install | |
| `first_sync` | The first sync that finished on this install | `duration_ms` |
| `ai_connected` | An AI connection was approved, or a token was made for one | `kind`: `claude`, `chatgpt`, `grok`, `other` |
| `first_ai_edit_seen` | The first time a note an AI changed was opened on this install | |
| `ai_change_undone` | The person took back what an AI did, within a week of it | `how`: `undo` (Undo on the note, where the AI's change is marked), `changes_list` (Undo This Change in AI Changes), `deleted` (the person deleted a note an AI had changed, or a folder an AI made: the server marks those, and the app keeps the ids of the past week's, at most 200, only while Share diagnostics and usage is on); `change`, what the AI did (not with `deleted`): `created`, `edited`, `version_restored`, `moved`, `deleted`, `recovered` (brought back from Recently Deleted); `after`, how soon: `under_5m`, `under_1h`, `under_1d`, `under_7d` |
| `app_returned` | The app came back to the front after at least 30 minutes away, the same UTC day (a new day is an `app_opened`) | `away`: `under_2h`, `under_8h`, `over_8h` |
| `ai_disconnected` | The person disconnected an AI connection here (not the app tidying away tokens that were never used) | `kind`: `claude`, `chatgpt`, `grok`, `other`, by the mark the list shows (where its approval went, or the guide that made its token) |
| `signed_out` | Signed out on this device, or the session ended. Sent under the account's id, before it goes | |
| `account_deleted` | Delete Account worked. Sent under the account's id, after the waiting events are dropped and before the id goes; best effort (unsent, it goes at the next launch) | |

`ai_disconnected`, `signed_out` and `account_deleted` go out within seconds, as errors do.

## Funnels

Where people get stuck, one event per funnel with a closed set of steps. A step can be sent more
than once (a person goes back, or tries again); each is sent when it happens.

| Event | When | Properties |
|---|---|---|
| `onboarding_step` | A first-run screen is shown or left | `step`: `welcome`, `name`, `bring`, `connect`, `try_it`, `done`; `action`: `shown`, `continued`, `skipped`, `back` |
| `import_step` | An import moves on a step | `source`: `apple_notes`, `evernote`, `keep`, `obsidian`, `bear`, `markdown`, `notion`; `step`: `opened`, `guide_page` (with `page`, 1 to 5), `already_have_file`, `file_found_automatically`, `wrong_file`, `permission_denied`, `nothing_found`, `second_account`, `importing`, `done` (with `count`: `1-9`, `10-99`, `100-999`, `1000+`), `failed` (with `kind`), `cancelled` |
| `connect_step` | Connecting an AI moves on a step | `ai`: `chatgpt`, `claude`, `claude_code`, `codex`, `grok`, `other`, `incredible`; `step`: `opened`, `started`, `waiting`, `connected`, `failed` (with `kind`), `gave_up` (the sheet closed while waiting) |
| `sign_in_step` | Signing in moves on a step | `step`: `shown`, `method_chosen`, `browser_opened`, `code_sent`, `code_entered`, `password_shown`, `succeeded`, `failed` (with `kind`, as `sign_in_failed`), `cancelled`; `method` once one is chosen |
| `link_device_step` | Adding a device moves on a step | `role`: `new_device`, `existing_device`; `step`: `shown`, `code_shown`, `scanned`, `typed`, `approved`, `done`, `failed` (with `kind`), `gave_up` |
| `notebook_film_step` | The notebook film moves on a step | `step`: `ready` (the account qualified and the film was got ready for the next launch), `offered` (its card is in the sidebar as the app opens; again at each launch until it's opened or closed), `opened` (from the card), `card_closed`, `rewatched` (from Help), `slide` (the first time each comes up, with `page`, 1 to 8), `played`, `watched_again`, `finished` (the film reached its end screen), `share_tapped`, `saved` (Mac: Save video), `closed` (with `place`: `slides`, `film` or `end`, and `page`: the furthest slide seen). With `ready` and `offered`, why it was offered: `form` (`comet`, `nebula`, `spiral`; not on `ready`), `count` (notes, as on `import_step`), `days` (since the first note) and `active_days` (days written on in the last 30). |

| `share_step` | Sharing a note with people moves on a step | `step`: `invite_sent` (the note's link went out from the share sheet), `invite_opened` (a note's link was opened on this device), `invite_accepted` (Join, and it opened), `left` (Leave, on a note shared with you), `removed` (the owner removed someone) |

There is no `share_conflict_shown`: shared notes merge everyone's edits as they type, and there
is no question about which version to keep.

`kind` on `import_step`, `connect_step` and `link_device_step` is one of `offline`, `timeout`,
`network`, `cancelled`, `http`, `database`, `storage`, `auth`, `decoding`, `crypto`, `file`, `other`.

## Settings

Which settings people use, so the ones nobody changes can go. A setting's value is a yes or no,
a number or one of the closed words below: never a folder's or a note's name, never the keys of a
shortcut.

| Event | When | Properties |
|---|---|---|
| `settings_state` | Where things start: when the app first comes to the front on this install, again when it comes to the front after an update (a new app version), and as soon as Share diagnostics is turned back on. With `setting_changed` after it, each device's settings are known at any time | Every setting below, as it is on this device |
| `setting_changed` | The person changed a setting (in Settings, or with View › Make Text Bigger) | `setting`: one of the setting names below; `value`: its new value |
| `settings_page_opened` | A page of Settings was opened | `settings_page`: `account`, `ai`, `general`, `appearance`, `security`, `storage`, `help`, `app_keys`, `personal` (Account › Personal information), `sign_in` (Account › Sign-in and security), `encryption` (Privacy › Encryption), `todays_note` (Today’s note), `shortcuts` (Keyboard shortcuts, Mac), `ai_connection` (AI Connections › one connected AI; never which), `add_ai` (AI Connections › Add an AI) |

| Setting | Values | Where |
|---|---|---|
| `appearance` | `system`, `light`, `dark` | Mac, iPhone |
| `theme` | `default`, `paper`, `sepia`, `slate`, `forest`, `contrast` | Mac, iPhone |
| `font` | `default`, `serif`, `rounded`, `mono` (note text only; the Accent setting was removed in 1.3, each theme carries its own) | Mac, iPhone |
| `text_size` | The note text's size in points: 13, 15, 17, 20 or 24 (iPhone follows the system's text size) | Mac |
| `today_folder` | `default` (Daily), `custom` (another folder; never its name) | Mac, iPhone |
| `today_title` | `long` (7 November 2026), `iso` (2026-11-07), `weekday` (Saturday 7 November) | Mac, iPhone |
| `today_template` | Yes or no: today's note starts from a template | Mac, iPhone |
| `today_on_launch` | Yes or no: Pinto opens on today's note | Mac, iPhone |
| `ticked_to_bottom` | Yes or no | Mac, iPhone |
| `menu_bar` | Yes or no | Mac |
| `quick_note_shortcut` | Yes or no: a shortcut is set (never which keys) | Mac |
| `open_at_login` | Yes or no | Mac |

## Feature usage

Which features are used, so the ones nobody uses can go and the ones people rely on get the work.
One event each time a feature is used, through the queue like every other event (so it fits
PostHog's funnels and retention as it is): never what was typed, searched, linked or ticked.

| Event | When | Properties |
|---|---|---|
| `feature_used` | A feature below was used | `feature`: one of the features below |

| Feature | Sent when |
|---|---|
| `notes_created` | A note is made: New Note, a folder's New Note, today's note, a quick note, a duplicate, Keep a Copy, a shared template, the Welcome note |
| `notes_edited` | A note is typed in: once for each note a launch, on its first keystroke, not for every key |
| `checklist_ticked` | An item is ticked in the editor (not unticked) |
| `tables_inserted` | A table is put in (Format › Table, the Table button, `/table`) |
| `links_inserted` | A `[[link]]` is finished from the titles `[[` offers, or put in with Link to a Note |
| `slash_menu` | A command is run from the `/` menu |
| `format_used` | iPhone: the Format panel is opened. Mac: an item of the Format menu is used, or its shortcut |
| `search_used` | A search is typed in the list's search field (once per search) |
| `go_to_note` | Something is chosen in Go to Note (Mac) |
| `todays_note` | Today's note is opened |
| `from_template` | A note is made from a template (a template link, the template gallery, a shared template) |
| `note_app_opened` | A note with an app is opened |
| `note_pinned` | A note is pinned (not unpinned) |
| `note_locked` | A note is locked, or its lock removed |
| `share_picture` | Share as Picture is opened |
| `menu_bar_note` | A note is saved from the menu bar (Mac) |
| `shortcut_note` | The quick note shortcut is pressed (Mac) |
| `imports_started` | An import starts bringing notes in |
| `notes_trashed` | Notes are deleted by the person (Delete Note, ⌫, dragged to Recently Deleted, a shared note's delete): once for each delete, however many notes |
| `folder_created` | A folder is made with New Folder (not by an import or sync) |
| `folder_deleted` | A folder is deleted in the sidebar |

Nothing about feature use is kept on the device. The first 1.3 builds counted it there and sent
a daily `usage_day`; the app removes those counts (`telemetry.usage`, `telemetry.usageDay`,
`telemetry.settingsDay`) at launch.

## Error reports

| Event | When | Properties |
|---|---|---|
| `keychain_failed` | A Keychain read or write failed | `item`: `key_synced`, `key_pending`, `key_previous`, `key_local`, `device_identity`, `session`, `notes_lock`; `operation`: `save`, `read`, `probe_read`, `probe_write`; `status` (the OSStatus). The Mac download's `probe_write` answer -34018 (no keychain access group) is expected and not sent: that build keeps the key in a file, said by `store` on `key_startup` and `key_ready` |
| `key_startup` | Startup decided what to do about the account's key | `outcome`: `ready`, `ready_unverified`, `create`, `reregister`, `replace`, `wait`, `mismatch`, `unreachable`, `fetch` (the key comes from the copy the server keeps); `had_key` (the key was open on this device before); `store`: `keychain`, `file`, `memory` |
| `sync_failed` | Syncs have failed for a minute, over at least three tries | `kind`, `status`, `code`, `hint`, `runs` |
| `upload_refused` | The server refused a row or a file for good | `what`: `note`, `folder`, `file`; `kind`, `status`, `code`, `hint` |
| `row_unreadable` | A row that came down didn't open with this device's key | `what` |
| `file_download_failed` | A file couldn't be fetched | `kind`, `status`, `code`, `hint` |
| `sign_in_failed` | A sign-in or sign-up didn't work (not one the person closed) | `method`; `kind`: `network`, `server`, `wrong_credentials`, `email_not_confirmed`, `rate_limited`, `not_allowed`, `already_exists`, `weak_password`, `bad_code`, `other`; `status` |
| `store_open_failed` | The library couldn't be opened at launch (the app then stops, as before) | `domain`: `cocoa`, `swift_data`, `sqlite`, `posix`, `other`; `code` |
| `store_save_failed` | A save of the library failed | `domain`, `code` |
| `crash` | MetricKit delivered a crash report from an earlier run | `exception_type`, `exception_code`, `signal`, `crashed_version`, `crashed_build`, `binary` (the app binary's build UUID), `frames`, `frame_0` to `frame_7` (offsets into the app's own binary) |
| `hang` | MetricKit delivered a hang report | `duration_ms`, `crashed_version`, `crashed_build`, `binary`, `frames`, `frame_0` to `frame_7` |

A failure's `kind` is one of `offline`, `timeout`, `network`, `cancelled`, `http`, `database`,
`storage`, `auth`, `decoding`, `crypto`, `file`, `other`. `status` is an HTTP status or the
system's own error number. `code` is one of the database's refusal codes the app knows (`PT413`,
`PT429`, `PT403`, `42501`, `23514`, `23503`, `23505`, `22001`, `22P02`, `22P05`, `22021`,
`54000`), or `none` or `other`. `hint` is `wrong_key`, `no_key`, `not_yours`, `none` or `other`.

Each of these, except `crash`, `hang`, `sign_in_failed` and `store_open_failed`, is sent once for
each launch however often it happens.

Crashes and hangs come from Apple's MetricKit, which hands them over at the next launch. No crash
SDK is linked. The system's report also holds a termination reason in words and the names of
other binaries; neither is sent. At most five crashes and five hangs are sent from one delivery.

## Performance

| Event | When | Properties |
|---|---|---|
| `cold_launch` | The notes were drawn after a launch that went straight to them | `duration_ms`, from the start of the app's own code |
| `sync_durations` | When the app quits, or once 20 syncs are counted | How many syncs took `under_250ms`, `under_1s`, `under_4s`, `under_15s`, `over_15s`, and how many `failed` |
| `library_size` | After the first sync of a launch | `notes`: `0`, `1_10`, `11_100`, `101_1000`, `over_1000` |
| `hangs` | With a MetricKit delivery that holds hangs | `count` |
| `note_opened_speed` | When the app quits (iPhone: when it leaves the screen), or once 50 are counted | From tapping a note to its text on screen: how many took `under_100ms`, `under_250ms`, `under_1s`, `over_1s`. On the Mac from the click's own time. A note that shows no text (locked, an app, a file) isn't counted |
| `search_speed` | The same | From the first key typed in the list's search field to its results on screen, in the same ranges |
| `storage_level` | The account's storage level changed, as the list's warning says it (the level last said is kept on the device, so a launch doesn't repeat it) | `level`: `almost_full` (90% or more), `full`, `fine` (back under) |

Durations are rounded to 10 ms.

## What has to be true in public before a build sends

The privacy policy names the kinds of data, not each event (Emil, 12 November 2026). A new event that
fits a kind there (errors, crashes and hangs, usage, speed) changes only this file. A new kind of data,
a new place it goes, or a weaker promise changes the policy too, and Emil reads it before it goes live.

The privacy policy (`web/content/privacy-policy.md`, "Diagnostics and usage from the apps"), the
Privacy & Security page and the README describe this for versions after 1.2. The App Store
privacy label for the first build that sends is in `pinto-internal/appstore/app-privacy-answers.md`, and
`Pane/Resources/PrivacyInfo.xcprivacy` matches it. The label is changed by hand in App Store
Connect before that build is submitted.

## Deleting what PostHog holds

The app never calls PostHog's API except to send events. Deleting an account's events there is
done by hand: in PostHog, delete the events whose `distinct_id` is the account's id (Data
management, or the persons and events deletion API with a personal API key). With no person
profiles there is no person to delete, only events. If this should happen on every Delete Account,
the `account` server function would need to ask PostHog for it with a private key; that isn't built.

## AI use on the server

The apps can't see what a connected AI does, so the MCP server counts it
(`supabase/functions/mcp/ai_use.ts`, migrations `20261107170000_ai_use_daily.sql` and
`20261112210000_ai_use_timeline.sql`). It sends
nothing to PostHog: the edge functions have no PostHog key, and the counts stay in the database.

`public.ai_use_daily` holds one row per account, UTC day, kind of AI, kind of tool and outcome,
with a count. Nothing else: no tool arguments, no note or file, no connection name, no host.

| Column | Values |
|---|---|
| `user_id` | The account (rows go when it is deleted) |
| `day` | The UTC day |
| `ai` | `claude`, `chatgpt`, `grok`, `gemini`, `local`, `other`: for a sign-in, the host its approval went to (only that AI receives it there: `claude.ai`, `claude.com`; `chatgpt.com`, `chat.openai.com`, `platform.openai.com`; `grok.com`; Gemini's `oauth-redirect.googleusercontent.com`); `local` when it went back to the person's own computer (`127.0.0.1`, `localhost`: a desktop app or editor); for an access token, the guide that made it (`Claude Code` is `claude`, `Codex` is `chatgpt`). Never the name a client gives itself |
| `category` | `read`, `search`, `edit`, `create`, `delete_move`, `other` (every tool is sorted by hand in `TOOL_CATEGORY`; a tool without one fails `ai_use.pglite.test.ts`) |
| `outcome` | `ok`, or `failed` (the tool answered with an error) |
| `count` | How many calls |

- **When:** after each tool call, once per HTTP request (`count_ai_use`, run after the answer
  where the edge runtime allows it). Only tool calls count: not `initialize`, `tools/list`, or
  a tool the server doesn't serve. A request without a valid connection counts nothing.
- **Whose:** the account and kind come from the connection the request was authenticated with
  (the `mcp_tokens` row), never from the request, so one account can't add to another's counts.
  A disconnected connection counts nothing.
- **Who can read it:** the service role only. The table has row-level security and no policy;
  `anon` and `authenticated` have no grants on it, on `count_ai_use` or on the view.
- **Kept:** 365 days (`ai_use_forget`, daily from pg_cron as `amber-forget-ai-use`).
- **Daily active AI accounts:** the view `public.ai_use_active_daily` (`day`, `ai`, `accounts`,
  `calls`; successful calls only).

`public.ai_use_minutes` holds the same calls by the UTC minute, so an AI's work can be put next to
what the person did in the app (PostHog's events carry the same account id). Its columns are those
of `ai_use_daily` with `minute` for `day`, and one more:

| Column | Values |
|---|---|
| `item` | What the call worked on, from the tool and the shape of its path only (`itemOf`): `note`, `folder`, `app`, `file`, `none` (search, list). The path is never kept |

Each connection (`mcp_tokens`) also keeps `first_tool_at` and `last_tool_at`: its first and last
tool call. `last_used_at` moves on every request, `tools/list` included, so it says when an AI
loaded the tools, not when it did something. The view `public.ai_first_use` gives each
connection's kind, when it was made, and `until_first_use` (null: never used).

Connected and never used, by kind of AI:

```sql
select ai, count(*) as connected, count(first_tool_at) as used,
  percentile_cont(0.5) within group (order by extract(epoch from until_first_use) / 3600) as median_hours
from public.ai_first_use where connected_at > '2026-11-13' group by ai;
```

A folder an AI makes is marked on its row (`folders.ai_made`), as a note an AI makes is
(`ai_editor`), so the apps can say when the person deletes it (`ai_change_undone`).

The minutes, the stamps and the view are kept, read and deleted as the day counts are.

AI retention, accounts using an AI on day 7 and day 30 after their first connection:

```sql
with first as (
  select user_id, min(created_at at time zone 'utc')::date as connected
  from public.mcp_tokens group by user_id
), used as (select distinct user_id, day from public.ai_use_daily where outcome = 'ok')
select date_trunc('week', f.connected)::date as cohort, count(*) as connected,
  count(*) filter (where exists (select 1 from used u where u.user_id = f.user_id and u.day = f.connected + 7)) as on_day_7,
  count(*) filter (where exists (select 1 from used u where u.user_id = f.user_id and u.day between f.connected + 28 and f.connected + 32)) as around_day_30
from first f group by 1 order by 1;
```
