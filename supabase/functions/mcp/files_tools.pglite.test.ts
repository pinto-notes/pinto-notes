// The file-like tool set (files_tools.ts) on a seeded account: notes first, then an app and its data.
//   cd supabase/functions/mcp && deno test -A files_tools.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { schemaDB } from "./pglite.ts";
import { type Account, account, app, edit, file, folder, note, notesPassword, opened, stubStorage, toolContext } from "./sealed.ts";
import { ToolError } from "./tools.ts";
import { FILE_TOOLS, runFileTool } from "./files_tools.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { assert(e instanceof ToolError, String(e)); return (e as Error).message; } throw new Error("expected a ToolError"); };
const GROCERIES = "Groceries\n\n## Dairy\n- [ ] Milk\n- [ ] Butter\n\n## Fruit\n- [x] Apples\n\nSee [[Recipes]] for ideas.\n";
const MOOD = "Mood\n\n<!-- pane-table: Date=date; Mood=scale 1-5; Walk=choice Yes|No -->\n| Date | Mood | Walk |\n| --- | --- | --- |\n| 2026-10-01 | 3 | Yes |\n";

Deno.test("twelve tools, named as ChatGPT and the directories expect", () => {
  assertEquals(FILE_TOOLS.map((t) => t.name), ["search", "list", "fetch", "create", "edit", "write", "move", "delete", "history", "restore", "pin", "see_app"]);
  // OpenAI's tool scan refuses a file parameter that doesn't mark download_url and file_id required.
  const write = FILE_TOOLS.find((t) => t.name === "write")!;
  const file = (write.inputSchema as { properties: Record<string, { required?: string[] }> }).properties.file;
  assertEquals(file.required, ["download_url", "file_id"]);
  // Every tool that changes existing data says so (Claude's and OpenAI's directory rules: being able
  // to undo it doesn't make it additive). Only create adds without changing anything.
  for (const t of FILE_TOOLS.filter((t) => !t.annotations.readOnlyHint)) {
    assertEquals(t.annotations.destructiveHint, t.name !== "create", t.name);
  }
  for (const t of FILE_TOOLS) assertEquals(t.annotations.title, t.title);
});

Deno.test("notes as files: paths only, list, fetch with lines, edit like Edit, write, move, rename, pin, delete, restore, history", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const g = await note(pg, a, GROCERIES);
  const m = await note(pg, a, MOOD);

  const top = await tool(pg, a, "list");
  assert(top.entries.some((n: { path: string }) => n.path === "Groceries.md"));
  const read = await tool(pg, a, "fetch", { id: "Groceries.md" });
  assertEquals([read.id, read.title], ["Groceries.md", "Groceries"]);
  // cat -n: numbered lines; [[links]] listed.
  assertStringIncludes(read.text, "     4\t- [ ] Milk");
  assertEquals(read.metadata.links, ["Recipes"]);

  // Edit: one change, old_string must match once; errors say what to do.
  const ticked = await tool(pg, a, "edit", { path: "Groceries.md", old_string: "- [ ] Milk", new_string: "- [x] Milk" });
  assertEquals(ticked.checks, "ok");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Groceries.md", old_string: "- [", new_string: "* [" })), "3 times");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Groceries.md", old_string: "     5\t- [ ] Butter", new_string: "x" })), "line number");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Groceries.md", old_string: "- [ ] butter", new_string: "x" })), "different capitals");
  const mangled = await tool(pg, a, "edit", { path: "Groceries.md", old_string: "- [ ] Butter", new_string: "-[ ] Butter" });
  assertStringIncludes(mangled.checks.join(), "won't show as a checklist item");
  assertStringIncludes((await opened(pg, a, g)).body!, "- [x] Milk\n-[ ] Butter");

  // Read before edit: never read here, or changed since (a device edited it).
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Mood.md", old_string: "| 2026-10-01 | 3 | Yes |", new_string: "x" })), "Read Mood.md with fetch");
  await tool(pg, a, "fetch", { id: "Mood.md" });
  await edit(pg, a, m, MOOD + "| 2026-10-02 | 4 | No |\n");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Mood.md", old_string: "| 2026-10-01 | 3 | Yes |", new_string: "x" })), "changed since you read it");
  await tool(pg, a, "fetch", { id: "Mood.md" });
  const logged = await tool(pg, a, "edit", { path: "Mood.md", old_string: "| 2026-10-02 | 4 | No |", new_string: "| 2026-10-02 | 4 | No |\n| 2026-10-03 | 7 | Maybe |" });
  assertStringIncludes(logged.checks.join("\n"), "from 1 to 5");
  // Its own edit keeps it read: a second edit needs no fetch.
  await tool(pg, a, "edit", { path: "Mood.md", old_string: "| 7 | Maybe |", new_string: "| 5 | Yes |" });

  // Long text is read in parts.
  const long = await note(pg, a, "Log\n" + Array.from({ length: 3000 }, (_, i) => `line ${i + 2}`).join("\n"));
  const first = await tool(pg, a, "fetch", { id: "Log.md" });
  assertStringIncludes(first.metadata.truncated, "Continue with offset 2001");
  const part = await tool(pg, a, "fetch", { id: "Log.md", offset: 2990, limit: 3 });
  assertEquals(part.text, "  2990\tline 2990\n  2991\tline 2991\n  2992\tline 2992");
  assert(long);

  // Create by path: folders as needed; in a note's folder, a sub-note (linked, by path, from its parent).
  assertEquals((await tool(pg, a, "create", { path: "Travel/Trip.md", content: "Lisbon in May." })).created, "Travel/Trip.md");
  assertEquals((await opened(pg, a, (await tool(pg, a, "fetch", { id: "Travel/Trip.md" })).url.split("/").pop())).body!.split("\n")[0], "Trip");
  assertEquals((await tool(pg, a, "create", { path: "Travel/Trip/Packing.md", content: "Packing\n- [ ] Passport" })).created, "Travel/Trip/Packing.md");
  const trip = await tool(pg, a, "fetch", { id: "Travel/Trip.md" });
  assertStringIncludes(trip.text, "[Packing](<Travel/Trip/Packing.md>)");
  assertEquals(trip.metadata.sub_notes, ["Travel/Trip/Packing.md"]);
  assertEquals((await tool(pg, a, "list", { path: "Travel/Trip/" })).entries.map((e: { path: string }) => e.path), ["Travel/Trip/Packing.md"]);
  // write makes a note that isn't there; same title twice gets " (2)", oldest keeps the name.
  assertEquals((await tool(pg, a, "write", { path: "Travel/Ideas.md", content: "Ideas\n\nSintra" })).created, "Travel/Ideas.md");
  assertEquals((await tool(pg, a, "create", { type: "folder", path: "Work/Clients/" })).created, "Work/Clients/");

  // Move and rename; into a note's folder makes a sub-note; folders move.
  assertEquals((await tool(pg, a, "move", { path: "Travel/Trip.md", to: "Work/" })).moved, "Work/Trip.md");
  assertEquals((await tool(pg, a, "list", { path: "Work/Trip/" })).entries[0].path, "Work/Trip/Packing.md");
  assertEquals((await tool(pg, a, "move", { path: "Work/Trip.md", to: "Work/Lisbon trip.md" })).moved, "Work/Lisbon trip.md");
  assertEquals((await tool(pg, a, "move", { path: "Travel/Ideas.md", to: "Work/Lisbon trip/" })).moved, "Work/Lisbon trip/Ideas.md");
  assertEquals((await tool(pg, a, "move", { path: "Work/Clients/", to: "Archive/Clients/" })).moved, "Archive/Clients/");
  assertEquals((await tool(pg, a, "pin", { path: "Groceries.md", pinned: true })).pinned, true);

  // Write a whole note (read first); history and restore; delete and restore.
  await tool(pg, a, "fetch", { id: "Work/Lisbon trip.md" });
  const w = await tool(pg, a, "write", { path: "Work/Lisbon trip.md", content: "Lisbon trip\n\nPorto too.\n\n[Packing](<Work/Lisbon trip/Packing.md>)" });
  assertEquals(w.written, "Work/Lisbon trip.md");
  const trip2 = (await pg.query(`select id from public.notes where parent_id is null and id in (select parent_id from public.notes where parent_id is not null) limit 1`)).rows[0] as { id: string };
  assertStringIncludes((await opened(pg, a, trip2.id)).body!, "(pane-note:");
  const h = await tool(pg, a, "history", { path: "Work/Lisbon trip.md" });
  assert(h.versions.length >= 1);
  // The first version had the first title: restoring it renames the note back.
  assertEquals((await tool(pg, a, "restore", { path: "Work/Lisbon trip.md", version: h.versions[h.versions.length - 1].version })).restored, "Work/Trip.md");
  assertStringIncludes((await opened(pg, a, trip2.id)).body!, "Lisbon in May.");
  const gone = await tool(pg, a, "delete", { path: "Work/Trip.md" });
  assertEquals(gone.now_at, "Recently Deleted/Trip.md");
  assertEquals((await tool(pg, a, "list", { path: "Recently Deleted/Trip/" })).entries.length, 2);
  assertEquals((await tool(pg, a, "restore", { path: "Recently Deleted/Trip.md" })).restored, "Work/Trip.md");

  // A unique name in the wrong place still finds the note; an unknown one says so.
  assertEquals((await tool(pg, a, "fetch", { id: "Nowhere/Groceries.md" })).id, "Groceries.md");
  assertStringIncludes(await fails(tool(pg, a, "fetch", { id: "Shopping.md" })), "Nothing at");

  // No answer above or below carries an id.
  const everything = JSON.stringify([await tool(pg, a, "list"), await tool(pg, a, "list", { pattern: "**" }), await tool(pg, a, "fetch", { id: "Work/Trip.md" }), await tool(pg, a, "search", { query: "packing" })]);
  for (const row of (await pg.query(`select id from public.notes`)).rows as { id: string }[]) assert(!everything.replace(/pintonotes:\/\/note\/[0-9a-f-]{36}/g, "").includes(row.id), "an id leaked");
});

Deno.test("search like grep and ranked, list like glob, at scale-ish", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const work = await folder(pg, a, "Work");
  const clients = await folder(pg, a, "Clients", work);
  await note(pg, a, "Acme\n\nDeposit for the Lisbon apartment: pending.\nCall Ana.", { folder: clients });
  await note(pg, a, "Acme\n\nThe other Acme.", { folder: clients });
  await note(pg, a, "Budget 2026\n\nRent 1200\nDeposit 2400", { folder: work, pinned: true });
  for (let i = 0; i < 30; i++) await note(pg, a, `Daily ${i}\n\nNothing much.`, { folder: work });
  // Same name, one folder: the older keeps the name.
  const paths = (await tool(pg, a, "list", { path: "Work/Clients/" })).entries.map((e: { path: string }) => e.path).sort();
  assertEquals(paths, ["Work/Clients/Acme (2).md", "Work/Clients/Acme.md"]);
  // Ranked.
  const ranked = await tool(pg, a, "search", { query: "lisbon deposit" });
  assertEquals(ranked.results[0].id, "Work/Clients/Acme.md");
  // grep: files, content with context, count; scope, pinned, title_only, case.
  assertEquals((await tool(pg, a, "search", { pattern: "deposit" })).files.sort(), ["Work/Budget 2026.md", "Work/Clients/Acme.md"]);
  assertEquals((await tool(pg, a, "search", { pattern: "deposit", case_sensitive: true })).files, []);
  assertEquals((await tool(pg, a, "search", { pattern: "(?i)DEPOSIT|nothing at all", case_sensitive: true })).files.length, 2);
  assertEquals((await tool(pg, a, "search", { pattern: "deposit", path: "Work/Clients/" })).files, ["Work/Clients/Acme.md"]);
  assertEquals((await tool(pg, a, "search", { pattern: "deposit", pinned: true })).files, ["Work/Budget 2026.md"]);
  const lines = await tool(pg, a, "search", { pattern: "^Deposit \\d+", output: "content", context: 1 });
  assertEquals(lines.lines, ["Work/Budget 2026.md:3- Rent 1200", "Work/Budget 2026.md:4: Deposit 2400"]);
  assertEquals((await tool(pg, a, "search", { pattern: "nothing much", output: "count" })).matches, 30);
  assertEquals((await tool(pg, a, "search", { pattern: "acme", title_only: true })).files.length, 2);
  const paged = await tool(pg, a, "search", { pattern: "Daily", limit: 10, offset: 10 });
  assertEquals(paged.files.length, 10);
  assertStringIncludes(paged.more, "10 more: offset 20");
  // The word index narrows, never hides: substrings inside words, notes changed since it was built.
  assertEquals((await tool(pg, a, "search", { pattern: "posit" })).files.length, 2);
  await note(pg, a, "Late\n\nAnother deposit, added after the index.", { folder: work });
  assertEquals((await tool(pg, a, "search", { pattern: "deposit" })).files.length, 3);
  assertEquals((await tool(pg, a, "search", { query: "another deposit" })).results[0].id, "Work/Late.md");
  // list: glob, newest first, paging.
  assertEquals((await tool(pg, a, "list", { pattern: "**/Acme*.md" })).matches.length, 2);
  assertEquals((await tool(pg, a, "list", { path: "Work/", pattern: "Daily 1*" })).matches.length, 11);
  const page1 = await tool(pg, a, "list", { path: "Work/", limit: 5 });
  assertEquals(page1.entries[0].path, "Work/Clients/");
  assertStringIncludes(page1.more, "offset 5");
});

Deno.test("a note's files live in its folder, and links show paths", async () => {
  const base = "https://proj.supabase.co";
  Deno.env.set("SUPABASE_URL", base);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  const pg = await schemaDB();
  const a = await account(pg);
  const f = await file(pg, a, "contract.txt", "public.plain-text", new TextEncoder().encode("Signed 2026-09-30."));
  const id = await note(pg, a, `Acme\n\n![contract.txt](pane-file:${f.id})\n`);
  const unstub = stubStorage(base, new Map([[f.path, f.sealed]]));
  try {
    assertEquals((await tool(pg, a, "list", { path: "Acme/" })).entries, [{ path: "Acme/contract.txt", type: "file", kind: "text/plain", bytes: 18 }]);
    const n = await tool(pg, a, "fetch", { id: "Acme.md" });
    assertStringIncludes(n.text, "![contract.txt](<Acme/contract.txt>)");
    assertEquals(n.metadata.files, ["Acme/contract.txt"]);
    assertStringIncludes(JSON.stringify(await tool(pg, a, "fetch", { id: "Acme/contract.txt" })), "Signed 2026-09-30.");
    // A glob and a search by name find it too (from the word index).
    assertEquals((await tool(pg, a, "list", { pattern: "**/*.txt" })).matches, [{ path: "Acme/contract.txt", type: "file" }]);
    assertEquals((await tool(pg, a, "search", { pattern: "contract", type: "file" })).files, ["Acme/contract.txt"]);
    // Editing around the link keeps it a file link.
    await tool(pg, a, "edit", { path: "Acme.md", old_string: "Acme\n", new_string: "Acme\n\nThe contract:" });
    assertStringIncludes((await opened(pg, a, id)).body!, `![contract.txt](pane-file:${f.id})`);
  } finally {
    unstub();
  }
});

Deno.test("an app: create, its files, and data.json edited like a file, one change", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const made = await tool(pg, a, "create", { type: "app", path: "Health/Habits.md" });
  assertEquals(made.app, "Health/Habits.app/");
  const files = await tool(pg, a, "list", { path: "Health/Habits.app" });
  assert(files.files.some((f: { path: string }) => f.path === "Health/Habits.app/src/App.tsx"));
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Health/Habits.app/README.md" })).text, "How this app runs in Pinto Notes");
  // docs/ is the app's memory: the README sends the AI there, and data.json's notes come from it.
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Health/Habits.app/README.md" })).text, "Read docs/ first");
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Health/Habits.app/docs/README.md" })).text, "## Known gaps");
  // Reading the note sends the AI to the app's docs first, so what it adds lands where the app shows
  // it (the real-AI run, 8 Nov: Codex filled the note's tables; the app keeps its data in data.json).
  const theNote = await tool(pg, a, "fetch", { id: "Health/Habits.md" });
  assertEquals(theNote.metadata.app, "Health/Habits.app/");
  assertStringIncludes(theNote.metadata.app_first, "read what the app says about its data (Health/Habits.app/docs/README.md");
  // The starter counts as read.
  const edited = await tool(pg, a, "edit", { path: "Health/Habits.app/src/screens/home.tsx", old_string: "Nothing here yet", new_string: "No habits yet" });
  assertStringIncludes(JSON.stringify(edited), "saved");
  // The app keeps its log in localStorage; the AI sees records and removes three dates.
  const log = ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"].map((date) => ({ date, walk: true }));
  await tool(pg, a, "fetch", { id: "Health/Habits.app/data.json" });
  await tool(pg, a, "write", { path: "Health/Habits.app/data.json", content: JSON.stringify({ values: { localStorage: { habits: log } }, collections: {} }) });
  const d = await tool(pg, a, "fetch", { id: "Health/Habits.app/data.json" });
  assertStringIncludes(d.metadata.readme_data, "useCollection(\"items\")");
  assertEquals(JSON.parse(d.text.replace(/^ *\d+\t/gm, "")).values.localStorage.habits.length, 5);
  const kept = log.filter((x) => x.date < "2026-10-03" || x.date > "2026-10-05");
  const r = await tool(pg, a, "write", { path: "Health/Habits.app/data.json", content: JSON.stringify({ values: { localStorage: { habits: kept } }, collections: {} }) });
  assertEquals(r.saved, "Health/Habits.app/data.json");
  const [row] = (await pg.query(`select data_ct from public.note_pages p join public.notes n on n.id = p.note_id`)).rows as { data_ct: string }[];
  assert(row.data_ct);
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Health/Habits.app/data.json", old_string: "\"values\": {", new_string: "\"values\": {{" })), "isn't valid JSON");
  assertEquals((await tool(pg, a, "see_app", { path: "Health/Habits.app" })).previews, "unavailable");
  // What a session read is kept as ids and keyed tags: no file name or text is readable there.
  const reads = JSON.stringify((await pg.query(`select item, stamp from public.mcp_reads`)).rows);
  assert(reads.includes("note:") && reads.includes("file:"), reads.slice(0, 200));
  for (const plain of ["home.tsx", "screens", "README", "habits", "2026-10"]) assert(!reads.toLowerCase().includes(plain.toLowerCase()), plain);
  // A device that couldn't open the live app says so; the AI sees it when it looks.
  await app(pg, a.id, `insert into public.app_load_failures (note_id, message, device) select note_id, 'TypeError: x is undefined', 'iPhone' from public.note_pages limit 1`);
  assertEquals((await tool(pg, a, "fetch", { id: "Health/Habits.app" })).metadata.load_failure.message, "TypeError: x is undefined");
  assertEquals((await tool(pg, a, "see_app", { path: "Health/Habits.app" })).load_failure.device, "iPhone");
});

// Binary files in an app (2026-11-14): a .wasm or a game's data goes in as bytes, is stored
// compressed (not base64 inside a text file), and stays the same bytes through edits, moves and fetch.
Deno.test("an app takes binary files: written as bytes, kept through edits, moved, fetched raw, deleted", async () => {
  const { toBase64 } = await import("../_shared/e2ee.ts");
  const pg = await schemaDB();
  const a = await account(pg);
  await tool(pg, a, "create", { type: "app", path: "Games/Doom.md" });
  const wasm = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  // A game's data: 1 MB with zeros in it, like a WAD.
  const wad = new Uint8Array(1 << 20).map((_, i) => (i % 7 === 0 ? 0 : i % 251));
  const size = async () => ((await pg.query(`select length(page_ct) as n from public.note_pages`)).rows[0] as { n: number }).n;
  const before = await size();
  assertStringIncludes(JSON.stringify(await tool(pg, a, "write", { path: "Games/Doom.app/doom.wasm", content_base64: toBase64(wasm) })), "saved");
  await tool(pg, a, "write", { path: "Games/Doom.app/doom1.wad", content_base64: toBase64(wad) });
  // Stored compressed: well under the 1.4 MB the same bytes take as base64.
  assert((await size()) - before < toBase64(wad).length / 2, `stored ${(await size()) - before}`);
  const listed = (await tool(pg, a, "list", { path: "Games/Doom.app" })).files as { path: string; binary?: boolean }[];
  assert(listed.some((f) => f.path === "Games/Doom.app/doom1.wad" && f.binary), JSON.stringify(listed.slice(0, 3)));
  const seen = await tool(pg, a, "fetch", { id: "Games/Doom.app/doom1.wad" });
  assertEquals(seen.metadata.bytes, wad.length);
  assertStringIncludes(seen.text, "A binary file");
  // A text edit elsewhere keeps the binary files as they were.
  await tool(pg, a, "edit", { path: "Games/Doom.app/src/screens/home.tsx", old_string: "Nothing here yet", new_string: "Press start" });
  await tool(pg, a, "move", { path: "Games/Doom.app/doom.wasm", to: "Games/Doom.app/engine/doom.wasm" });
  const raw = await tool(pg, a, "fetch", { id: "Games/Doom.app/engine/doom.wasm", raw: true });
  assertEquals(raw.content[1].resource.blob, toBase64(wasm));
  assertEquals(raw.content[1].resource.mimeType, "application/wasm");
  // Text sent as bytes stays text, so it can be edited.
  await tool(pg, a, "write", { path: "Games/Doom.app/notes.txt", content_base64: toBase64(new TextEncoder().encode("level 1\n")) });
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Games/Doom.app/notes.txt" })).text, "level 1");
  await tool(pg, a, "delete", { path: "Games/Doom.app/doom1.wad" });
  assert(!((await tool(pg, a, "list", { path: "Games/Doom.app" })).files as { path: string }[]).some((f) => f.path.endsWith("doom1.wad")));
  // The engine survived the delete next to it.
  assertEquals((await tool(pg, a, "fetch", { id: "Games/Doom.app/engine/doom.wasm" })).metadata.bytes, wasm.length);
});

Deno.test("every call takes one from the MCP bucket, failed ones too (one statement, its own transaction)", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  const left = async () => ((await pg.query(`select tokens from public.pane_rate where user_id = $1 and bucket = 'mcp'`, [a.id])).rows[0] as { tokens: number } | undefined)?.tokens;
  await tool(pg, a, "list");
  const after1 = await left();
  assert(after1 !== undefined && after1 <= 599.5, String(after1));
  await fails(tool(pg, a, "fetch", { id: "Nothing here.md" }));
  assert((await left())! < after1!, "a failed call is counted");
});

Deno.test("history says what each change did and shows a version's text, so an AI restores the right one (real-AI run, 8 Nov)", async () => {
  // Both AIs restored the wrong version of a note first: every version's preview was the same first line.
  const pg = await schemaDB();
  const a = await account(pg);
  await note(pg, a, "Acme\n\nClient since March.\n\n## Status\n- Renewal due 1 December\n\n## Next steps\n- [ ] Send the quote\n");
  await tool(pg, a, "fetch", { id: "Acme.md" });
  await tool(pg, a, "edit", { path: "Acme.md", old_string: "## Status\n- Renewal due 1 December", new_string: "## Status\nasdf pasted by mistake" });
  await tool(pg, a, "edit", { path: "Acme.md", old_string: "- [ ] Send the quote", new_string: "- [ ] Send the quote\n- [ ] Book a call" });
  const h = await tool(pg, a, "history", { path: "Acme.md" });
  assertStringIncludes(h.about, "as it was until replaced_at");
  // Newest first: the call was added, and before that the status was pasted over.
  assertEquals(h.versions[0].change, { added: ["- [ ] Book a call"] });
  assertEquals(h.versions[1].change, { removed: ["- Renewal due 1 December"], added: ["asdf pasted by mistake"] });
  const before = await tool(pg, a, "history", { path: "Acme.md", version: h.versions[1].version });
  assertStringIncludes(before.text, "- Renewal due 1 December");
  assertEquals(before.restore_with, `restore { path, version: ${h.versions[1].version} }`);
  assertStringIncludes(await fails(tool(pg, a, "history", { path: "Acme.md", version: 999999 })), "No such version");
  // Restoring an older text whose [[link]] names a note renamed since says so.
  await note(pg, a, "Pricing plan\n\n## Annual\nTwo months free.\n");
  await tool(pg, a, "fetch", { id: "Acme.md" });
  await tool(pg, a, "edit", { path: "Acme.md", old_string: "- [ ] Book a call", new_string: "- [ ] Book a call, see [[Pricing plan#Annual]] and ![[logo.png]]" });
  await tool(pg, a, "move", { path: "Pricing plan.md", to: "Pricing 2027.md" });
  // The version that still had the old title: the rename's own change to Acme replaced it.
  const linked = (await tool(pg, a, "history", { path: "Acme.md" })).versions
    .find((v: { change?: { removed?: string[] } }) => v.change?.removed?.some((l) => l.includes("[[Pricing plan#Annual]]"))).version;
  const restored = await tool(pg, a, "restore", { path: "Acme.md", version: linked });
  assertStringIncludes(restored.links_to_nothing, "[[Pricing plan]]");
  assert(!restored.links_to_nothing.includes("logo.png"), restored.links_to_nothing);
  assertEquals((await tool(pg, a, "restore", { path: "Acme.md", version: h.versions[1].version })).links_to_nothing, undefined);
  // A locked note's earlier versions stay closed, though they were saved before it was locked.
  const id = (await pg.query<{ note_id: string }>(`select note_id from public.note_revisions where id = $1`, [h.versions[1].version])).rows[0].note_id;
  const lockKey = await notesPassword(pg, a);
  await app(pg, a.id, `update public.notes set body_ct = null, head_ct = $2, locked_body = $3 where id = $1`,
    [id, await a.vault.sealHead(id, { title: "Acme" }), `amb2.${lockKey}.${btoa("x".repeat(48))}`]);
  assertStringIncludes(await fails(tool(pg, a, "history", { path: "Locked note.md", version: h.versions[1].version })), "locked");
  assertStringIncludes(await fails(tool(pg, a, "history", { path: "Locked note.md" })), "locked");
});

Deno.test("a new sub-note says it was linked from its parent, and a parent read before stays read (real-AI run, 8 Nov)", async () => {
  // Claude saved a recipe as a sub-note, then edited the parent to file the link under a heading:
  // the edit was refused as a stale read, because the create had added the link line unannounced.
  const pg = await schemaDB();
  const a = await account(pg);
  await note(pg, a, "Recipe box\n\n## Weeknight\n\n## Baking\n");
  await tool(pg, a, "fetch", { id: "Recipe box.md" });
  const made = await tool(pg, a, "create", { path: "Recipe box/Weeknight dal.md", content: "Weeknight dal\n\n- [ ] 1 cup red lentils" });
  assertEquals(made.created, "Recipe box/Weeknight dal.md");
  assertStringIncludes(made.linked_from, "last line of Recipe box.md: [Weeknight dal](<Recipe box/Weeknight dal.md>)");
  const moved = await tool(pg, a, "edit", { path: "Recipe box.md", old_string: "## Weeknight\n\n## Baking\n\n[Weeknight dal](<Recipe box/Weeknight dal.md>)", new_string: "## Weeknight\n- [Weeknight dal](<Recipe box/Weeknight dal.md>)\n\n## Baking" });
  assertEquals(moved.edited, "Recipe box.md");
  assertStringIncludes((await tool(pg, a, "fetch", { id: "Recipe box.md" })).text, "## Weeknight\n     4\t- [Weeknight dal](<Recipe box/Weeknight dal.md>)");
  // A parent the AI never read is still read-first.
  await note(pg, a, "Trips\n");
  const sub = await tool(pg, a, "write", { path: "Trips/Lisbon.md", content: "Lisbon" });
  assertStringIncludes(sub.linked_from, "Trips.md");
  assertStringIncludes(await fails(tool(pg, a, "edit", { path: "Trips.md", old_string: "Trips", new_string: "Trips 2027" })), "Read Trips.md with fetch");
});

Deno.test("a new note written at the top goes in the first folder, as in the app", async () => {
  const pg = await schemaDB();
  const a = await account(pg);
  // No folders yet: one named Notes is made for it.
  const first = await tool(pg, a, "write", { path: "Packing.md", content: "Packing\n\n- [ ] Passport" });
  assertEquals(first.written ?? first.created, "Notes/Packing.md");
  // The person's first folder, whatever its name.
  const pg2 = await schemaDB();
  const b = await account(pg2);
  await folder(pg2, b, "Home");
  const second = await tool(pg2, b, "create", { path: "Ideas.md", content: "Ideas\n\nOne." });
  assertEquals(second.created ?? second.written, "Home/Ideas.md");
  // A path with a folder keeps it.
  assertEquals((await tool(pg2, b, "write", { path: "Work/Plan.md", content: "Plan" })).created, "Work/Plan.md");
});
