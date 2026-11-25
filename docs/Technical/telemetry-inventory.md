# Telemetry inventory

Every place Pinto Notes records or sends usage, diagnostics or analytics: what it holds, where it
goes, and how the switch stops it. The maintainer's rule: all telemetry can be turned off, and a
new kind of telemetry can't be added without the switch turning it off too. The guard tests at the
end enforce that rule, so this page and the code can't drift apart.

Last full audit: 2026-11-25.

## The switch

The switch is **Settings › General › Share diagnostics and usage**, on by default. It is one choice
per account:

- **Signed in:** the choice belongs to the account. The server keeps it (`public.telemetry_choice`,
  migration `20261125120000_telemetry_choice.sql`). Each device keeps a copy, together with the time
  it was set (`shareDiagnostics`, `shareDiagnosticsAt`). When a device and the account disagree,
  the later choice wins (`TelemetryChoiceSync.decide`):
  - turning it off while signed out tells the account at the next sign-in;
  - a device signing in to an account that is off turns itself off before it sends anything. Sending
    is held until the account's choice is known (`Telemetry.identify`, `accountChoiceKnown`).
- **Signed out:** the device's own copy decides.
- **On the website:** visitors aren't signed in, so the website uses the browser's own choice. That
  is Reject on the cookie banner, Do Not Track or Global Privacy Control.

**Off means:** nothing is recorded, nothing is sent, and anything waiting on the device is dropped
(the queue, unsent speeds and sync timings). On the server, nothing more is written about the
account. Data recorded before the switch went off stays until it expires (see Grey areas, item 9).

## The chokepoints

Each runtime has one gate that every telemetry path must pass.

| Runtime | The gate | What goes through it |
|---|---|---|
| Apps (Mac, iPhone, iPad) | `Telemetry.allowed(_ route:)` in `Pane/Telemetry/Telemetry.swift` (`passes` while the lock is held). `.posthog` needs a build that sends and the switch on. `.server` needs the switch on | `record` (every `TelemetryEvent`: product events, funnels through `Funnel.record`, failures, crashes and hangs from `DiagnosticReports`, settings snapshots and changes from `SettingsUsage`, storage level), `used`/`edited` (feature use, through `Usage.count`), `speed`, `syncFinished`, `flush`. The server usage calls go through `ServerUsage.send` (`Pane/Telemetry/ServerUsage.swift`), which asks `allowed(.server)` |
| Server (Supabase) | `public.telemetry_allowed(user)` (SQL). Registered in `supabase/functions/_shared/telemetry.ts` | Every SQL function or trigger that inserts into or updates a usage table. Edge functions never write a usage table themselves; they call one of those functions (`count_ai_use`, `record_email_click`) |
| Website | `telemetryAllowed` in `web/lib/telemetry-gate.ts`: `browserTelemetryAllowed()` in the browser, `requestTelemetryAllowed(headers)` on the server | PostHog's `before_send` (so every event, including automatic ones and replay), `track()` in `web/app/posthog-client.ts` (the site's own events), `vercelEvent` (Vercel Web Analytics' `beforeSend`), `countDownload` (Mac downloads), `/go` (email link clicks) |

## Inventory

"Before" is how things stood before this change. "Now" is how they stand after it.

### Apps: to PostHog (EU)

Everything here is listed property by property in `app-telemetry.md`.

| What | Sent | Before | Now |
|---|---|---|---|
| Product events (`app_opened`, `signed_in`, `key_ready`, `gate_shown`, firsts, AI connect and disconnect, sign out, `account_deleted`) | `Telemetry.record` → queue → `batch/` | Device switch | Account switch, through the gate |
| Funnels (`onboarding_step`, `import_step`, `connect_step`, `sign_in_step`, `link_device_step`, `notebook_film_step`, `share_step`) | `Funnel.record` → `Telemetry.record` | Device switch | Account switch, through the gate |
| Feature use (`feature_used`) | `Usage.count`/`Usage.edited` → `Telemetry.used`/`edited` | Device switch | Account switch, through the gate |
| Settings (`settings_state`, `setting_changed`, `settings_page_opened`) | `SettingsUsage` → `Telemetry.record` | Device switch | Account switch, through the gate |
| Error reports (`keychain_failed`, `key_startup`, `sync_failed`, `upload_refused`, `row_unreadable`, `file_download_failed`, `sign_in_failed`, `store_open_failed`, `store_save_failed`) | `Telemetry.record` | Device switch | Account switch, through the gate |
| Crashes and hangs (`crash`, `hang`, `hangs`) | MetricKit → `DiagnosticReports` → `Telemetry.record` | Device switch. MetricKit subscribes only in builds that send | Account switch, through the gate |
| Performance (`cold_launch`, `sync_durations`, `library_size`, `note_opened_speed`, `search_speed`, `storage_level`) | `Telemetry.speed`/`syncFinished`/`record` | Device switch | Account switch, through the gate |
| The queue file `telemetry-queue.jsonl` | On the device | Dropped when the switch goes off | Also dropped when the account's choice turns the device off |
| Events recorded between signing in to an account and learning its choice | | Could be sent before an off on another device reached this one | Held until the account's choice is known |

### Apps: to Pinto's own server

| What | Server function → table | Before | Now |
|---|---|---|---|
| Tips shown and used, share-ask shown and answered | `pane_tip_event` → `pane_tip_activity` | **Not covered** | `ServerUsage` gate plus the server gate |
| Features first used (shared between devices for tips; read by lifecycle emails) | `pane_feature_used` → `pane_feature_use` | **Not covered** | Both gates. Off, tips fall back to what this device knows |
| Days of use (for the share ask) | `pane_active_days_add` → `pane_active_days` | **Not covered** | Both gates. Off, the share ask counts this device's days only |
| Install hello: a random install id, platform, last seen | `pane_seen_device` → `pane_devices` | **Not covered** | Both gates |
| "How did you hear about Pinto Notes?" | `pane_heard_from_answer` → `pane_heard_from` | **Not covered** | Both gates, and `pane_heard_from_state` doesn't ask when off |

### Server: written without the app asking

| What | Where | Before | Now |
|---|---|---|---|
| AI tool calls per account, day, kind and outcome | `count_ai_use` → `ai_use_daily` (MCP function, `ai_use.ts`) | **Not covered** | Server gate |
| AI edits per account and day (adoption numbers, lifecycle emails, setup card) | trigger `pane_count_ai_edit` → `pane_activity` | **Not covered** | Server gate. The setup card's "an AI changed a note" step now also reads the notes themselves, so it still works when off |
| Lifecycle email link clicks | `/go` → lifecycle `/click` → `record_email_click` → `email_clicks` | **Not covered** (recorded whenever `LIFECYCLE_TRACK_CLICKS` was on) | Website gate on `/go` and the server gate. The redirect works either way |
| PostHog from the server | none: the edge functions hold no PostHog key | — | Guard test fails if any edge function mentions PostHog |

### Website

| What | Where | Before | Now |
|---|---|---|---|
| PostHog page views, page leaves, autocapture clicks, rage and dead clicks, heatmaps | posthog-js, automatic | Sent cookieless after **Reject** (and with no answer) | Nothing after Reject, DNT or GPC: `before_send` drops every event, and PostHog isn't loaded. No answer: cookieless, as before |
| PostHog named events (`download_mac_clicked`, `use_template_*`, `outbound_*_clicked`, `blog_cta_clicked`, `help_*`, `blog_helper_used`, copy buttons, `scroll_depth`) | `PostHogAnalytics.tsx` | Sent cookieless after Reject | Through `track()`, which asks the gate |
| `cookies_rejected` event | `recordChoice` | **Sent at the moment of Reject** | Removed. Nothing is sent after Reject |
| `cookies_accepted` event | `recordChoice` (PostHog `opt_in_capturing`) | Sent on Accept | Unchanged: the visitor just said yes |
| Session replay | posthog-js recorder | Only after Accept | Unchanged, and also behind `before_send` |
| Vercel Web Analytics page views | `<Analytics>` | **Sent regardless of Reject, DNT or GPC** | `beforeSend={vercelEvent}` drops them after Reject, DNT or GPC |
| Mac download count (daily total) | `/download/mac` → `count_download` → `site_downloads` | **Counted regardless** | Not counted with the opt-out cookie, `Sec-GPC: 1` or `DNT: 1` |
| `pinto_internal` (marks our own browsers) | localStorage | Unchanged | Unchanged. It removes our own visits from the counts |

### Lifecycle emails (Resend)

| What | Where | Status |
|---|---|---|
| Open tracking | none: no pixel, and the send call asks for no tracking | Nothing to gate. Resend's domain settings can't be checked from the repo; see Grey areas |
| Click tracking | `email_clicks`, through `/go` | Gated (above) |
| Who was sent which email, and which subject line (`email_sends.variant`) | `email_sends` | Grey area: needed so no email goes twice |
| Targeting reads app usage (`pane_devices`, `pane_activity`, `pane_feature_use`) | `lifecycle_facts` | Reads only. Off, no new rows exist, so an account that is off is targeted from what's left (sign-up date, notes count, AI connections). See Grey areas |

### Checked and not telemetry

- The share extension (`PaneShare`) and the widgets (`PaneWidgets`) record nothing. The guard
  test covers them.
- No analytics or crash SDK is linked in the apps or the site. Sparkle doesn't send a system
  profile (`SUEnableSystemProfiling` isn't set).
- The following are the person's own data or app state, shown back to them: `note_ai_events` (AI
  changes), `app_load_failures` (shown to their AI so it can fix an app), `pane_setup`,
  `pane_share_ask`, `notebook_film_seen_at`, and the account export.
- The account export now also includes `ai_use_daily` and the switch's own state (`telemetry_choice`).

## Grey areas: not changed, the maintainer decides

These records are needed to run or secure the service, or they are platform logs we don't control.
None of them changed. Each has a recommendation.

| # | What | Where | Recommendation |
|---|---|---|---|
| 1 | Edge function logs: one JSON line per event (tool name, status, duration, error class). An allowlist of fields; no account id, no content | Supabase function logs (`_shared/log.ts`) | **Keep, not behind the switch.** They're how outages get found, and they hold nothing per person. Write their retention in the policy |
| 2 | Rate limits and abuse records: `pane_rate`, `oauth_rate` (hashed address), `connect_blocks` | Supabase tables | **Keep, not behind the switch.** A switch that turned off abuse limits would be an attack path |
| 3 | Security logs: `key_copy_events` (12 months, readable by the person), `auth.audit_log_entries` (trimmed to 30 days), `account_key_resets`, `account_recoveries` | Supabase | **Keep, not behind the switch.** They protect the account. They're already in the export |
| 4 | Moderation: `share_reports` (salted hash of the reporter's address), `template_takedowns` | Supabase | **Keep.** They're about abuse of shared content, not about how the app is used |
| 5 | `last_used_at` on `mcp_tokens` and `oauth_clients` | Supabase | **Keep.** The app shows "last used" in AI Connections, and unused clients are tidied away by it. Say so in the policy |
| 6 | `email_sends` (which email, when, subject-line variant) and `email_replies` | Supabase | **Keep `email_sends` for de-duplication, but stop the subject-line A/B for accounts that are off** (send variant 0 and leave them out of `stats`). Decide whether lifecycle emails should go at all to an account that is off; they have their own unsubscribe |
| 7 | Platform logs we don't control: Vercel request logs (1 hour) and performance charts, Supabase API and database logs, Sparkle's update requests (app version in the user agent) | Vercel, Supabase | **Keep. List them in the policy as service logs.** They can't be turned off per person |
| 8 | Apple's App Store Connect analytics and crash reports (only from people who share with app developers in iOS or macOS settings), TestFlight feedback | Apple | **Keep.** Apple's own switch governs them. Say so in the policy and the Settings footer |
| 9 | Data already recorded when someone turns the switch off: server usage rows (12 months, 365 days for AI use) and PostHog events | Supabase, PostHog | **Recommend: when an account turns it off, delete its rows from the usage tables** (one `delete` per `USAGE_TABLES` entry in `telemetry_choice_set`), and add PostHog deletion by `distinct_id` to that path. Not done here: it erases data rather than stopping collection, so the maintainer should decide |
| 10 | Resend's own open/click tracking setting for the sending domain | Resend dashboard | **Check it's off in the dashboard.** The repo never asks for tracking, but the domain setting overrides that |
| 11 | Lifecycle email targeting for an account that is off reads less data, so it may send an email about a step the person already did (for example "get the iPhone app") | `lifecycle_facts` | **Decide:** either skip lifecycle emails for accounts that are off, or accept the occasional wrong suggestion |

## Keeping it up to date

The guard tests fail when someone adds telemetry that goes around the gate. All three run on every
`scripts/prepush.sh --tests`, whatever the change touches.

- **Apps:** `PaneTests/TelemetryGuardTests.swift` (in `scripts/ci/always-tests.txt`):
  - outside `Pane/Telemetry`, nothing names the transport, the batch body, the queue file, PostHog,
    MetricKit, the account choice's server functions or any usage server function
    (`ServerUsage.functions`);
  - no analytics or crash SDK is imported or added to `project.yml`;
  - with the switch off, every event in `TelemetryEvent.samples` (which `TelemetryPrivacyTests`
    keeps complete), every `UsedFeature`, every speed, timing and launch path, and every
    `ServerUsage.Call` records and sends nothing;
  - the account sync rules work: the latest choice wins, sending is held until the account's choice
    is known, and an offline device stays held.
- **Server:** `supabase/functions/_shared/telemetry_guard.test.ts`, which reads the migrations and
  the code and needs no database:
  - every table a migration creates is registered in `_shared/telemetry.ts` as usage, anonymous
    usage, the choice, or not usage (with a reason);
  - every function or trigger that inserts into or updates a usage table calls
    `public.telemetry_allowed(`;
  - no edge function writes a usage table with its own SQL or mentions PostHog;
  - `supabase/functions/_shared/telemetry_gate.pglite.test.ts` runs every writer on a real Postgres:
    on, each records; off, none does.
- **Website:** `web/lib/telemetry-guard.test.ts`:
  - only `app/posthog-client.ts` loads PostHog or calls `capture`, and it does so through the gate;
  - only `SiteAnalytics.tsx` uses Vercel Analytics, with `beforeSend={vercelEvent}`;
  - the download and click counts ask the gate;
  - no other tracking library is installed;
  - with the gate off, `before_send` drops every kind of event.

**Adding telemetry:**

- **App:** add a `TelemetryEvent` case (and a sample), or a `ServerUsage.Call`.
- **Server:** add a table to `USAGE_TABLES` and write it from a SQL function that calls
  `public.telemetry_allowed`.
- **Website:** send through `track()` or the gate.

Then add a row to this page.

## Privacy policy sentences that would need to change

From `web/content/privacy-policy.md` (`docs/privacy-policy.md` is the same text). Not changed here.

- **Line 12:** "One switch in Settings turns it off." Make it say the switch belongs to the
  account, applies on every device, and also stops the usage counts on our server.
- **Line 13:** "These are counted across all visitors." Choosing Reject, or sending Do Not Track or
  Global Privacy Control, now stops all website counting: Vercel page views, PostHog's cookieless
  counts and the download total.
- **Line 98 (heard-from answer):** add that it isn't asked or kept while Share diagnostics and usage
  is off.
- **Line 114:** "**Settings → General → Share diagnostics and usage** turns all of it off". Add:
  it's kept with your account, so turning it off on one device turns it off on all of them, and our
  server stops counting AI use, days of use, tips, app installations and email clicks for your
  account.
- **Line 121 (lifecycle emails):** "if you click a link in one, which email it was in" now applies
  only while Share diagnostics and usage is on, and not from a browser that rejected or sends
  DNT/GPC.
- **Line 125 (Vercel page views):** add that a visitor who chose Reject, or whose browser sends
  Do Not Track or Global Privacy Control, isn't counted.
- **Line 126 (PostHog):** "Unless you accept cookies, it uses no cookies … tells visits apart for a
  day" now applies only to visitors who haven't answered. Reject stops it entirely. The closing
  "it doesn't run at all if your browser sends Do Not Track…" now also covers Reject.
- **Line 127 (Mac downloads):** add that a download isn't counted after Reject, DNT or GPC.
- **Lines 146–150 (legal bases table):** "Website page views, clicks and scroll depth, counted
  without cookies" should say a visitor can object with Reject.
- **Line 280 (retention, usage counts):** add that nothing more is counted while the switch is off.
  If Grey area 9 is done, also say turning it off deletes them.
- **Line 281:** unchanged, unless PostHog deletion is added (Grey area 9).
- **Lines 307–315 (browser storage):** add the new cookie **`pinto_no_analytics`**, set only when
  you choose Reject. It holds `1` and no identifier, lasts a year, and lets the site's server routes
  know not to count you. Line 315 ("we treat it as Reject … PostHog doesn't run at all") still holds.
  Reject now also means PostHog doesn't run at all.
- **"The website asks before it sets a cookie."** Still true: the new cookie is only set by
  answering Reject.
- **New:** a sentence for the grey areas you decide to keep (service logs, rate limits, security
  logs, Apple's own analytics).

Other public copy:

- The Privacy & Security page (`web/app/privacy-security/page.tsx`, lines 113–114, and
  `web/lib/privacy.ts` line 16) describes the switch as per device. It needs the same change as
  line 114.
- The app's Settings footer (`DiagnosticsCopy.footer`) now ends with "Off stops it on all your
  devices."
