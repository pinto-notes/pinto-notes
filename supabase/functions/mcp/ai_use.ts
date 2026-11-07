// How much each account uses its AI connections: one count per account, UTC day, kind of AI, kind
// of tool and outcome (migration 20261107150000_ai_use_daily.sql). Only the tool's category and
// whether it worked are counted; never its arguments, the note, the connection's name or its host.
// docs/Technical/app-telemetry.md, "AI use on the server", says what is kept and how to read it.

import type { Sql } from "npm:postgres@3.4.5";
import { errorKind, log } from "../_shared/log.ts";

export type UseCategory = "read" | "search" | "edit" | "create" | "delete_move" | "other";

/** Every tool either tool set serves, by category. A tool missing here is a test failure
 *  (ai_use.pglite.test.ts), so a new tool is sorted on purpose, not by a default. */
export const TOOL_CATEGORY: Readonly<Record<string, UseCategory>> = {
  // The file tools (files_tools.ts), what production serves.
  search: "search", list: "read", fetch: "read", create: "create", edit: "edit", write: "edit",
  move: "delete_move", delete: "delete_move", history: "read", restore: "edit", pin: "edit", see_app: "read",
  // The classic note and app tools (tools.ts).
  get_overview: "read", search_notes: "search", list_notes: "read", read_note: "read", create_note: "create",
  edit_note: "edit", append_to_note: "edit", replace_note_body: "edit", set_checklist_item: "edit",
  move_note: "delete_move", pin_note: "edit", delete_note: "delete_move", restore_note: "edit",
  list_folders: "read", create_folder: "create", rename_folder: "edit", delete_folder: "delete_move",
  note_history: "read", restore_revision: "edit", create_sub_note: "create", list_files: "read", get_file: "read",
  read_table: "read", log_table_row: "edit", delete_table_row: "edit", add_table_rows: "edit", update_table_rows: "edit",
  delete_table_rows: "edit", edit_table_columns: "edit", add_checklist_items: "edit", update_checklist_items: "edit",
  set_note_page: "edit", edit_note_page: "edit", get_note_page: "read", get_page_data: "read", query_app_data: "read",
  update_page_data: "edit", create_app: "create", list_app_files: "read", read_app_file: "read", write_app_file: "edit",
  edit_app_file: "edit", delete_app_file: "delete_move", move_app_file: "delete_move",
  list_api_keys: "other", get_page_guide: "other", check_app: "other", preview_app: "other", try_app: "other",
  run_app_tests: "other", resolve_package: "other",
};

export const categoryOf = (tool: string): UseCategory => TOOL_CATEGORY[tool] ?? "other";

/** The tool calls of one HTTP request, counted as they finish and written once at its end. */
export class UseTally {
  private counts = new Map<string, number>();

  add(tool: string, ok: boolean) {
    const key = `${categoryOf(tool)}|${ok ? "ok" : "failed"}`;
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  get isEmpty() { return this.counts.size === 0; }

  /** Adds this request's calls to today's counts for the connection `grantId`. The account and the
   *  kind of AI come from that connection's row (count_ai_use). Never fails the request. */
  async write(sql: Sql, grantId: string | undefined): Promise<void> {
    if (!grantId || this.isEmpty) return;
    try {
      for (const [key, n] of this.counts) {
        const [category, outcome] = key.split("|");
        await sql`select public.count_ai_use(${grantId}::uuid, ${category}, ${outcome === "failed"}, ${n})`;
      }
    } catch (e) {
      log("ai_use_failed", errorKind(e));
    }
  }
}

/** Lets the count finish after the answer goes out where the edge runtime allows it; elsewhere
 *  (tests, a plain Deno server) it's awaited. */
export async function afterResponse(work: Promise<void>): Promise<void> {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (typeof runtime?.waitUntil === "function") runtime.waitUntil(work);
  else await work;
}
