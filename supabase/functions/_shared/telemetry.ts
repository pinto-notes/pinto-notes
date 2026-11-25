// The server's telemetry chokepoint (docs/Technical/telemetry-inventory.md).
//
// One gate: the SQL function public.telemetry_allowed(user) (migration
// 20261125120000_telemetry_choice.sql), which reads the account's Share diagnostics and usage choice.
// Every write to a table that records how someone uses Pinto Notes goes through a SQL function that
// calls it; edge functions never write those tables directly, they call that function.
//
// This file is the register. Every table the migrations create is in exactly one of the lists
// below, and telemetry_guard.test.ts fails when:
//   - a migration creates a table that isn't listed here (decide: usage, or not, and why);
//   - a function that inserts into or updates a USAGE table doesn't call public.telemetry_allowed;
//   - an edge function writes a USAGE table with its own SQL;
//   - an ANONYMOUS table gets a writer other than the one named (its gate is the visitor's choice
//     on the website, web/lib/telemetry-gate.ts).

/** The gate, as the SQL calls it. */
export const TELEMETRY_GATE = "public.telemetry_allowed(";

/** Tables that record an account's use of the apps, its AI or its emails. Written only through the
 *  gate. The value says what each holds. */
export const USAGE_TABLES: Readonly<Record<string, string>> = {
  ai_use_daily: "AI tool calls per account, day, kind of AI, kind of tool and outcome (count_ai_use)",
  pane_activity: "AI edits per account and day (trigger pane_count_ai_edit)",
  pane_tip_activity: "tips shown and used, and the share ask's answers, per account and day (pane_tip_event)",
  pane_feature_use: "features an account has used, first use only (pane_feature_used)",
  pane_active_days: "days an account used its notes (pane_active_days_add)",
  pane_devices: "a random id per app install, its platform and when it was last seen (pane_seen_device)",
  pane_heard_from: "how the person heard about Pinto Notes, the one-time question (pane_heard_from_answer)",
  email_clicks: "which link in a lifecycle email was clicked (record_email_click)",
};

/** Usage tables with no account: the website's visitors. Gated by the visitor's choice on the
 *  website before the call is made; the value is the only SQL function allowed to write it. */
export const ANONYMOUS_USAGE_TABLES: Readonly<Record<string, string>> = {
  site_downloads: "count_download",
};

/** The choice itself. */
export const CHOICE_TABLES: Readonly<Record<string, string>> = {
  telemetry_choice: "the account's Share diagnostics and usage choice",
};

/** Tables that are not telemetry: the product's own data and state, security and abuse records,
 *  and what the service needs to run. The ones marked GREY are in the inventory's grey-area list:
 *  needed to run or secure the service, left as they are until the maintainer decides. */
export const NOT_USAGE_TABLES: Readonly<Record<string, string>> = {
  account_key_copies: "the account's key, sealed",
  account_key_protection: "key copy settings",
  account_key_resets: "password reset holds (security)",
  account_keys: "the account's key record",
  account_notices: "notices every device of the account shows",
  account_recoveries: "start-fresh records (security)",
  account_welcome: "the welcome note, made once",
  api_key_names: "names the person gave their API keys",
  app_load_failures: "a note app's load error, for the person's AI to fix it (shown to their AI, not to us)",
  attachment_versions: "file versions",
  attachments: "files",
  connect_asks: "an AI connection waiting for approval",
  connect_blocks: "GREY: connection attempts blocked after a wrong number (abuse)",
  connect_preapprovals: "a connection approved in advance",
  device_adds: "Add a device in progress",
  device_tokens: "push notification tokens",
  email_replies: "GREY: a reply to a lifecycle email, noted by hand",
  email_sends: "GREY: which lifecycle email went to whom, so none goes twice (and its subject-line variant)",
  email_unsubscribes: "unsubscribes from lifecycle emails (needed to honour them)",
  folders: "the person's folders",
  identity_keys: "sharing identity keys",
  key_copy_events: "GREY: security log of the server's key copy (kept 12 months, the person can read it)",
  key_copy_tickets: "key copy hand-over",
  key_devices: "devices that hold the key",
  mcp_reads: "what an AI session has read, so it can edit safely",
  mcp_title_index: "search index",
  mcp_tokens: "AI connections (last_used_at is GREY: shown in the app's list and used to tidy unused ones)",
  mcp_word_index: "search index",
  note_ai_events: "AI changes, shown to the person in AI changes and undoable",
  note_invite_links: "sharing",
  note_locks: "locked notes",
  note_members: "sharing",
  note_page_versions: "note app versions",
  note_pages: "note apps",
  note_revisions: "version history",
  note_share_files: "sharing",
  note_share_pages: "sharing",
  note_shares: "sharing",
  note_snapshots: "sharing",
  note_updates: "sharing",
  notes: "the person's notes",
  oauth_clients: "AI apps registered for sign-in (last_used_at is GREY: used to forget unused ones)",
  oauth_rate: "GREY: sign-in attempts per hashed address (abuse)",
  oauth_requests: "sign-ins in progress",
  oauth_tokens: "AI access tokens",
  pane_rate: "GREY: write and read rate limits per account (abuse)",
  pane_setup: "the first-run card's state, the same on every device",
  pane_share_ask: "the answer to Enjoying Pinto Notes?, so it is never asked again",
  pane_usage: "notes and bytes per account, for the storage limit",
  profiles: "name and photo",
  sealed_links: "share links",
  share_reports: "GREY: reports of abusive shared notes (moderation)",
  shared_notes: "sharing",
  shared_templates: "shared templates",
  signup_allowlist: "who may sign up",
  template_takedowns: "GREY: templates taken down (moderation)",
};

/** Every table in the register. */
export const REGISTERED_TABLES = new Set([
  ...Object.keys(USAGE_TABLES), ...Object.keys(ANONYMOUS_USAGE_TABLES), ...Object.keys(CHOICE_TABLES), ...Object.keys(NOT_USAGE_TABLES),
]);

export type SqlFunction = { name: string; body: string; file: string };

/** Every SQL function as its latest migration left it (a later `create or replace` wins; a
 *  `drop function` removes it). `files`: [name, text] in the order they run. */
export function latestFunctions(files: [string, string][]): Map<string, SqlFunction> {
  const out = new Map<string, SqlFunction>();
  const head = /create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(|drop\s+function\s+(?:if\s+exists\s+)?public\.(\w+)/gi;
  for (const [file, text] of files) {
    head.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = head.exec(text))) {
      if (m[2]) { out.delete(m[2].toLowerCase()); continue; }
      const tag = /\bas\s+(\$\w*\$)/i.exec(text.slice(m.index));
      if (!tag) continue;
      const start = m.index + tag.index + tag[0].length;
      const end = text.indexOf(tag[1], start);
      if (end < 0) continue;
      out.set(m[1].toLowerCase(), { name: m[1].toLowerCase(), body: text.slice(start, end), file });
      head.lastIndex = end + tag[1].length;
    }
  }
  return out;
}

/** Tables the migrations create (public schema). */
export function createdTables(files: [string, string][]): Set<string> {
  const out = new Set<string>();
  for (const [, text] of files) {
    for (const m of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/gi)) out.add(m[1].toLowerCase());
  }
  return out;
}

/** Whether `sql` inserts into or updates `table`. */
export function writes(sql: string, table: string): boolean {
  return new RegExp(`\\b(insert\\s+into|update)\\s+public\\.${table}\\b`, "i").test(sql);
}
