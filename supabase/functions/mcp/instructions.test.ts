// deno test --allow-all instructions.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { appsServed, instructions, servedPrompts, servedResources } from "./server.ts";
import { serverCard } from "./card.ts";
import { CLASSIC_TOOL_NAMES } from "./tools.ts";
import { servedTools } from "./tool_set.ts";
import { FILE_INSTRUCTIONS } from "./files_tools.ts";
import { appGuide, IN_CONTROL, scaffold } from "./app_scaffold.ts";
import { appsGuide, PAGE_INSTRUCTIONS, pageGuide } from "./page_guide.ts";

/** Tool names a text mentions: words with an underscore, as every classic tool is named. */
const named = (text: string) => [...new Set(text.match(/\b[a-z]+(?:_[a-z]+)+\b/g) ?? [])];
/** Every tool name any set has. */
const everyName = () => [...new Set([...servedTools("pages"), ...servedTools("files")].map((t) => t.name))];

async function withToolSet(set: string | undefined, run: () => void | Promise<void>) {
  const before = Deno.env.get("AMBER_MCP_TOOLS");
  if (set === undefined) Deno.env.delete("AMBER_MCP_TOOLS");
  else Deno.env.set("AMBER_MCP_TOOLS", set);
  try {
    await run();
  } finally {
    if (before === undefined) Deno.env.delete("AMBER_MCP_TOOLS");
    else Deno.env.set("AMBER_MCP_TOOLS", before);
  }
}

Deno.test("with AMBER_MCP_TOOLS unset, the server serves the file tools and teaches them", async () => {
  await withToolSet(undefined, () => {
    assertEquals(servedTools().map((t) => t.name), ["search", "list", "fetch", "create", "edit", "write", "move", "delete", "history", "restore", "pin", "see_app"]);
    assertEquals(instructions(), FILE_INSTRUCTIONS);
    assert(appsServed(), "the file tools build apps");
  });
});

Deno.test("the file tools' instructions keep what the classic ones taught", () => {
  const text = instructions("files");
  for (const s of ["- [ ] item", "- [x] item", "markdown table", "pane-table", "[[Title]]", "[[Title|shown text]]", "[[Title#Heading]]", "locked: true", "Recently Deleted/", "history, restore", "sub-notes", "To read/Paper.pdf", ".app", "data.json", "README.md", "index.html", "tests/", "Tests run on every save", "Read before you edit"]) {
    assertStringIncludes(text, s);
  }
  // No classic tool name, nothing about how to talk.
  assertEquals(named(text), []);
});

Deno.test("with AMBER_MCP_TOOLS=classic, the instructions name no app tool", async () => {
  await withToolSet("classic", () => {
    const served = servedTools().map((t) => t.name);
    assertEquals(served, [...CLASSIC_TOOL_NAMES]);
    const prototypes = servedTools("pages").map((t) => t.name).filter((n) => !served.includes(n));
    assert(prototypes.includes("create_app") && prototypes.includes("get_page_guide"));
    const text = instructions();
    assertEquals(prototypes.filter((n) => new RegExp(`\\b${n}\\b`).test(text)), []);
    assert(!text.includes(PAGE_INSTRUCTIONS) && !text.includes("Apps:"));
    // The rest is whole: the line before the app lines is followed by the line after them.
    assert(text.includes("(note_history / restore_revision).\nA note marked locked: true"));
  });
});

Deno.test("with AMBER_MCP_TOOLS=pages, the instructions teach the app tools", async () => {
  await withToolSet("pages", () => {
    const text = instructions();
    assert(text.includes(PAGE_INSTRUCTIONS));
    for (const n of ["create_app", "get_page_guide", "preview_app", "check_app"]) assert(text.includes(n), n);
  });
});

Deno.test("the instructions, prompts and tool descriptions name a tool only if the server serves it", () => {
  for (const set of [undefined, "", "files", "classic", "pages"]) {
    const served = servedTools(set).map((t) => t.name);
    const notServed = everyName().filter((n) => !served.includes(n) && n.includes("_"));
    const texts = [instructions(set), ...servedPrompts(set).map((p) => p.text({ note: "N", idea: "I", data: "D", change: "C" })), ...servedTools(set).map((t) => t.description)];
    for (const text of texts) assertEquals(notServed.filter((n) => new RegExp(`\\b${n}\\b`).test(text)), [], `AMBER_MCP_TOOLS=${set}: ${text.slice(0, 60)}`);
    if (set !== undefined && set !== "" && set !== "files") assertEquals(named(instructions(set)).filter((n) => !served.includes(n)), [], `AMBER_MCP_TOOLS=${set}`);
  }
});

Deno.test("with the file tools, the prompts and resources are about apps made with them, and the card lists them", async () => {
  await withToolSet(undefined, async () => {
    assertEquals(servedPrompts().map((p) => p.name), ["make_app", "add_data", "change_app"]);
    for (const p of servedPrompts()) assert(!/get_page_guide|create_app|update_page_data|preview_app/.test(p.text({ note: "N", idea: "I", data: "D", change: "C" })), p.name);
    const resources = await servedResources();
    const guide = resources.find((r) => r.name === "apps-guide");
    assert(guide, "the apps guide");
    assertStringIncludes(guide.text, "data.json");
    assert(!resources.some((r) => r.name === "note-pages-guide"), "not the classic tools' guide");
    assert(resources.some((r) => r.name === "amber-base-css"));
    assertEquals(serverCard().tools.map((t) => t.name), servedTools().map((t) => t.name));
    assertStringIncludes(serverCard().description, "build apps");
  });
});

Deno.test("with AMBER_MCP_TOOLS=classic, nothing about note apps is offered: no prompts, no resources, and the card lists the classic tools", async () => {
  await withToolSet("classic", async () => {
    assert(!appsServed());
    assertEquals(servedPrompts(), []);
    assertEquals(await servedResources(), []);
    const card = serverCard();
    assertEquals(card.tools.map((t) => t.name).sort(), [...CLASSIC_TOOL_NAMES].sort());
    assert(!card.description.includes("apps"));
  });
});

Deno.test("with AMBER_MCP_TOOLS=pages, the prompts, resources and card come with the app tools", async () => {
  await withToolSet("pages", async () => {
    assert(appsServed());
    assert(servedPrompts().length > 0);
    assert((await servedResources()).some((r) => r.name === "note-pages-guide"));
    const names = serverCard().tools.map((t) => t.name);
    assert(names.includes("create_app") && names.includes("get_page_guide"));
  });
});

Deno.test("nothing an AI reads offers the device features that were removed from apps", async () => {
  const { PAGE_CONTRACT } = await import("./page.ts");
  const { pageGuide, PAGE_API } = await import("./page_guide.ts");
  const { appGuide } = await import("./app_scaffold.ts");
  const offered = /reminders\.create|calendar\.today|location\.once|camera\.take|contacts\.pick|maps\.(open|snapshot)|ai\.respond|device\.reminders|notify\(/;
  for (const [name, text] of [["the contract", PAGE_CONTRACT], ["get_note_page's rules", PAGE_API], ["the guide", await pageGuide()], ["a new app's README", appGuide()]] as const) {
    assertEquals(offered.test(text), false, `${name} offers a device feature`);
    assert(/not available yet/i.test(text), `${name} should say what is not available yet`);
    assertStringIncludes(text, "openURL");
  }
});

Deno.test("every guide an AI gets for apps says the person stays in control inside the app", async () => {
  for (const s of ["add, edit, rename, reorder and remove", "settings are changed in the app", "deletes can be undone", "saved in data.json"]) assertStringIncludes(IN_CONTROL, s);
  assertStringIncludes(appGuide(), IN_CONTROL);
  assertStringIncludes(appsGuide(), IN_CONTROL);
  assertStringIncludes(await pageGuide(), IN_CONTROL);
  assertStringIncludes((await scaffold("Habits"))["/README.md"], IN_CONTROL);
  assertStringIncludes(FILE_INSTRUCTIONS, IN_CONTROL);
});
