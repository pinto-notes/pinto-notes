// A shared board's comment stream as the browser folds it (board-doc.ts foldComments): the same
// vectors the app's and the MCP server's tests check (supabase/functions/_shared/comment-vectors.json),
// so every reader ends with the same comments; and the entries a device writes.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Comment, commentEntries, entryJSON, entryOf, foldComments, MAX_VERSION, nextVersion, parseComment, toRestate } from "./board-doc";

const vectors = JSON.parse(readFileSync(new URL("../../supabase/functions/_shared/comment-vectors.json", import.meta.url), "utf8"));
type V = { name: string; legacy: unknown[]; entries: { author: string; role: string; moved?: boolean; comments: unknown[]; epoch: number }[] };
const shown = (list: Comment[]) => list.map((c) => ({ id: c.id, by: c.by, text: c.text, version: c.version, resolved: c.resolved, deleted: !!c.deleted, ...(c.thread ? { thread: c.thread } : {}) }));
const legacyOf = (v: V) => v.legacy.map((r) => parseComment(r)!);

describe("the comment stream", () => {
  it("folds as the vectors say", () => {
    expect(vectors.fold.length).toBeGreaterThan(5);
    for (const v of vectors.fold as (V & { expect: unknown[] })[]) expect(shown(foldComments(legacyOf(v), v.entries)), v.name).toEqual(v.expect);
  });

  it("restates what the vectors say: the old map once, and what's under an older key", () => {
    for (const v of vectors.restate as (V & { current: number; expect: string[] })[]) {
      const full = foldComments(legacyOf(v), v.entries), bare = foldComments([], v.entries.filter((e) => e.epoch === v.current));
      expect(toRestate(full, bare).map((c) => c.id), v.name).toEqual(v.expect);
    }
  });

  const me = "E0000000-0000-4000-8000-000000000003";
  const c = (id: string, over: Partial<Comment> = {}): Comment =>
    ({ id, by: me, name: "Cleo", text: `About ${id}`, created: "2026-11-18T09:00:00Z", x: 1, y: 0, resolved: false, version: 1, ...over });

  it("an entry, as it's sealed and read back; anything malformed holds nothing", () => {
    const e = entryOf(entryJSON([c("c-x", { changes: ["box", "arrow"] })]), me.toLowerCase(), "commenter");
    expect(foldComments([], [e]).map((x) => [x.id, x.text, x.changes])).toEqual([["c-x", "About c-x", ["box", "arrow"]]]);
    expect(entryOf(entryJSON([c("c-x")], true), me, "owner").moved).toBe(true);
    expect(entryOf("{not json", me, "commenter").comments).toEqual([]);
    expect(entryOf(`{"comments": "nope"}`, me, "commenter").comments).toEqual([]);
  });

  it("many comments go as several entries, each under the server's 64 KB once sealed", () => {
    const many = Array.from({ length: 30 }, (_, i) => c(`c-${i}`, { text: "x".repeat(4000) }));
    const parts = commentEntries(many, true);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThan(46_000);
    const back = foldComments([], parts.map((p) => entryOf(p, "e0000000-0000-4000-8000-000000000001", "owner")));
    expect(back.map((x) => x.id).sort()).toEqual(many.map((x) => x.id).sort());
  });

  it("a write never takes a version past the highest one, so nobody can freeze a comment", () => {
    expect(nextVersion(c("c-a", { version: 4 }))).toBe(5);
    expect(nextVersion(c("c-a", { version: MAX_VERSION }))).toBe(MAX_VERSION);
    // At the top, the later write wins the tie.
    const first = { author: me, role: "commenter", comments: [JSON.parse(entryJSON([c("c-a", { version: MAX_VERSION })])).comments[0]] };
    const later = { author: me, role: "commenter", comments: [JSON.parse(entryJSON([c("c-a", { version: MAX_VERSION, text: "Edited" })])).comments[0]] };
    expect(foldComments([], [first, later])[0].text).toBe("Edited");
  });
});
