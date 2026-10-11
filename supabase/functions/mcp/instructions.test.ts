// deno test --allow-all instructions.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { appsServed, instructions, servedPrompts, servedResources } from "./server.ts";
import { serverCard } from "./card.ts";
import { PAGE_INSTRUCTIONS } from "./page_guide.ts";
import { PRODUCTION_TOOL_NAMES, servedTools } from "./tools.ts";

/** Tool names a text mentions: words with an underscore, as every tool is named. */
const named = (text: string) => [...new Set(text.match(/\b[a-z]+(?:_[a-z]+)+\b/g) ?? [])];

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

Deno.test("with AMBER_MCP_TOOLS unset, the instructions name no app tool", async () => {
  await withToolSet(undefined, () => {
    const served = servedTools().map((t) => t.name);
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

Deno.test("the instructions name a tool only if the server serves it", () => {
  for (const set of [undefined, "", "pages"]) {
    const served = servedTools(set).map((t) => t.name);
    assertEquals(named(instructions(set)).filter((n) => !served.includes(n)), [], `AMBER_MCP_TOOLS=${set}`);
  }
});

Deno.test("with AMBER_MCP_TOOLS unset, nothing about note apps is offered: no prompts, no resources, and the card lists production's tools", async () => {
  await withToolSet(undefined, async () => {
    assert(!appsServed());
    assertEquals(servedPrompts(), []);
    assertEquals(await servedResources(), []);
    const card = serverCard();
    assertEquals(card.tools.map((t) => t.name).sort(), [...PRODUCTION_TOOL_NAMES].sort());
    // No served tool's own text sends an AI to a tool that isn't served.
    const served = servedTools().map((t) => t.name);
    const prototypes = servedTools("pages").map((t) => t.name).filter((n) => !served.includes(n));
    for (const t of card.tools) assertEquals(prototypes.filter((n) => new RegExp(`\\b${n}\\b`).test(t.description)), [], t.name);
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

Deno.test("with AMBER_APP_DEVICE unset, nothing an AI reads offers device features the released apps have off", async () => {
  const { pageContract, deviceServed } = await import("./page.ts");
  const { pageGuide, PAGE_API } = await import("./page_guide.ts");
  const { appGuide } = await import("./app_scaffold.ts");
  if (deviceServed()) return; // a server set up for apps with the device on
  const offered = /reminders\.create|calendar\.today|location\.once|camera\.take|contacts\.pick|maps\.(open|snapshot)|ai\.respond|device\.reminders|notify\(/;
  for (const [name, text] of [["the contract", pageContract()], ["get_note_page's rules", PAGE_API], ["the guide", await pageGuide()], ["a new app's README", appGuide()]] as const) {
    assertEquals(offered.test(text), false, `${name} offers a device feature`);
    assert(/not available yet/i.test(text), `${name} should say what is not available yet`);
    assertStringIncludes(text, "openURL");
  }
  // A server whose apps have the device on says so again.
  assertEquals(offered.test(pageContract("on")), true);
});
