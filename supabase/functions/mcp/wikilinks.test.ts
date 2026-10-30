// Wiki links by the app's rules (Pane/Model/WikiLinks.swift, PaneTests/WikiLinksTests.swift).
//   cd supabase/functions/mcp && deno test -A wikilinks.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { followRename, key, linkLines, links, nameOf, retarget, WikiIndex } from "./wikilinks.ts";

Deno.test("links: target, folders, heading, alias and embeds; code is skipped", () => {
  const text = "See [[Projects/Kitchen remodel#Budget|the budget]] and ![[Photo]].\n`[[Not a link]]`\n```\n[[Fenced]]\n```\n[[ Spaced ]] [[#Here]] [[]]";
  const got = links(text);
  assertEquals(got.map((l) => [l.target, l.heading, l.alias, l.embed]), [
    ["Projects/Kitchen remodel", "Budget", "the budget", false],
    ["Photo", undefined, undefined, true],
    ["Spaced", undefined, undefined, false],
  ]);
  assertEquals(text.slice(got[0].start, got[0].end), "[[Projects/Kitchen remodel#Budget|the budget]]");
  assertEquals(text.slice(got[0].targetStart, got[0].targetEnd), "Projects/Kitchen remodel");
  assertEquals(text.slice(got[2].targetStart, got[2].targetEnd), " Spaced ");
  assertEquals(nameOf("Projects/Kitchen remodel.md"), "Kitchen remodel");
});

Deno.test("key: case, spacing and markdown escapes don't matter", () => {
  assertEquals(key("  Kitchen   Remodel "), "kitchen remodel");
  assertEquals(key("a\\_b"), "a_b");
});

Deno.test("retarget keeps folders, heading, alias and the space before the name", () => {
  const text = "[[Work/Old#Agenda|shown]] [[ Old]] [[Other]] `[[Old]]`";
  assertEquals(retarget(text, "New", (l) => key(nameOf(l.target)) === "old"), "[[Work/New#Agenda|shown]] [[ New]] [[Other]] `[[Old]]`");
});

Deno.test("resolve: by name, folders narrow, nearest folder then newest wins", () => {
  const index = new WikiIndex([
    { id: "work", title: "Index", folders: ["Work"], updated: 1 },
    { id: "home", title: "Index", folders: ["Home"], updated: 2 },
    { id: "deep", title: "Index", folders: ["Work", "Clients"], updated: 3 },
    { id: "slash", title: "Q1/Q2 plan", folders: [], updated: 1 },
  ]);
  assertEquals(index.resolve("Index", ["Work"]), "work");
  assertEquals(index.resolve("Index", ["Home"]), "home");
  assertEquals(index.resolve("Index", ["Work", "Clients", "Acme"]), "deep");
  assertEquals(index.resolve("Index", []), "deep", "no folder in common: the one edited last");
  assertEquals(index.resolve("Home/Index", ["Work"]), "home");
  assertEquals(index.resolve("Moved/Index", ["Home"]), "home", "folders that don't match don't lose the link");
  assertEquals(index.resolve("Q1/Q2 plan"), "slash");
  assertEquals(index.resolve("index.md", ["Work"]), "work");
  assertEquals(index.resolve("Nothing"), undefined);
});

Deno.test("followRename: only the links that led to the renamed note change", () => {
  const index = new WikiIndex([
    { id: "a", title: "Plan B", folders: ["Work"], updated: 1 },
    { id: "b", title: "Plan", folders: ["Home"], updated: 2 },
  ]);
  // "a" was "Plan" until it was renamed to "Plan B"; "b" in Home is also called "Plan".
  const before = index.withTitle("Plan", "a");
  const fromWork = "[[Plan]] and [[Home/Plan]] and [[plan#Goals]]";
  assertEquals(followRename(fromWork, ["Work"], before, "a", "Plan", "Plan B"), "[[Plan B]] and [[Home/Plan]] and [[Plan B#Goals]]");
  assertEquals(followRename("[[Plan]]", ["Home"], before, "a", "Plan", "Plan B"), "[[Plan]]", "seen from Home, [[Plan]] is the Home note");
});

Deno.test("linkLines: the lines with a link here, each once, cut around the link", () => {
  const index = new WikiIndex([{ id: "r", title: "Recipes", folders: [], updated: 1 }, { id: "o", title: "Other", folders: [], updated: 1 }]);
  const body = "Groceries\n- [ ] Milk, see [[Recipes]]\n[[Other]] only\n" + "x".repeat(300) + " [[recipes|ideas]] " + "y".repeat(300);
  const lines = linkLines(body, [], index, "r", 60);
  assertEquals(lines[0], "- [ ] Milk, see [[Recipes]]");
  assertEquals(lines.length, 2);
  assertEquals(lines[1].includes("[[recipes|ideas]]") && lines[1].startsWith("…") && lines[1].endsWith("…"), true);
});
