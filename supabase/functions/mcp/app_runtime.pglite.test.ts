// What a note's app meets at run time, in a real browser (the render service, scripts/page-render, in
// WebKit, offscreen), from the traps an AI hit building five apps on 2026-11-17:
//   - tests start with no data, whatever data.json holds (the README says so, and the starter's
//     test assumes it);
//   - quick writes all land: function updates build on the newest value, before the host confirms;
//   - the test runner has the common Vitest and Testing Library features, and says which one is
//     missing when a test reaches for something it doesn't have;
//   - several files go in one write, checked once; a held-back single file says so;
//   - the template apps' tests pass every time, many runs at once on a busy machine (a failing
//     version isn't shown, so a flaky template test would hold a person's app back at random).
// Needs Playwright's WebKit, like app_files.pglite.test.ts.
//   cd supabase/functions/mcp && deno test -A app_runtime.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import "./tools.ts";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { runFileTool } from "./files_tools.ts";
import { withFiles } from "./app_files.ts";
import { linkProject } from "./app_project.ts";
import { scaffold } from "./app_scaffold.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;

const hasWebKit = [Deno.env.get("PLAYWRIGHT_BROWSERS_PATH"), `${Deno.env.get("HOME")}/.cache/ms-playwright`, `${Deno.env.get("HOME")}/Library/Caches/ms-playwright`].some((dir) => {
  if (!dir) return false;
  try { for (const e of Deno.readDirSync(dir)) if (e.name.startsWith("webkit-")) return true; } catch { /* none */ }
  return false;
});

/** A render service on this Mac, counting the renders it answers. */
async function renderService() {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const seen = { renders: 0, tests: 0, smoke: 0 };
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, async (req) => {
    if (new URL(req.url).pathname === "/render") {
      const body = await req.clone().json();
      seen.renders++;
      if (body.tests) seen.tests++;
      if (body.smoke) seen.smoke++;
    }
    return await handle(req);
  });
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${server.addr.port}`);
  return { seen, stop: async () => { await closeBrowser(); await server.shutdown(); Deno.env.delete("RENDER_URL"); } };
}

/** The starter with these files on top, compiled and linked as a save would, run as its tests. */
async function runTests(extra: Record<string, string>) {
  const { renderPage, testRunnerProject } = await import("../../../scripts/page-render/render.ts");
  const p = await withFiles({ amberApp: 1, files: {}, compiled: {} }, { ...await scaffold("Lab"), ...extra });
  const runner = testRunnerProject(JSON.stringify((await linkProject(p)).project))!;
  const r = await renderPage(runner, "Lab\n", { values: {}, collections: {} }, { today: "2026-11-17", tests: true });
  return { results: r.tests ?? [], errors: r.testErrors ?? [] };
}
const failuresOf = (r: { results: { ok: boolean; name: string; error?: string }[]; errors: string[] }) => [...r.errors, ...r.results.filter((t) => !t.ok).map((t) => `${t.name}: ${t.error}`)];

// A counter, a list and two settings, changed by taps that come faster than the host confirms.
const QUICK_SCREEN = `import { useStore, useSettings, batch } from "@/lib/pinto"

export default function Quick() {
  const [count, setCount] = useStore("count", 0)
  const [list, setList] = useStore("list", [] as string[])
  const [settings, update] = useSettings({ a: "", b: "" })
  return (
    <div>
      <h1>Quick</h1>
      <button onClick={() => setCount((n: number) => n + 1)}>Add one</button>
      <button onClick={() => batch(async () => { setCount((n: number) => n + 1); setCount((n: number) => n + 1) })}>Add two</button>
      <button onClick={() => setList((l: string[]) => [...l, "item " + l.length])}>Append</button>
      <button onClick={() => { update({ a: "A" }); update({ b: "B" }) }}>Set both</button>
      <p>Count {count}, {list.length} items, {settings.a}{settings.b}</p>
    </div>
  )
}
`;
const QUICK_TEST = `import { describe, it, expect } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { pinto } from "pinto"
import Quick from "@/screens/quick"

describe("quick taps", () => {
  it("keeps every one of ten quick taps", async () => {
    render(<Quick />)
    const add = screen.getByRole("button", { name: "Add one" })
    for (let i = 0; i < 10; i++) fireEvent.click(add)
    await waitFor(() => expect(pinto.data.values.count).toBe(10))
    expect(await screen.findByText(/Count 10,/)).toBeInTheDocument()
  })
  it("keeps every quick append to a list", async () => {
    render(<Quick />)
    const append = screen.getByRole("button", { name: "Append" })
    for (let i = 0; i < 5; i++) fireEvent.click(append)
    await waitFor(() => expect(pinto.data.values.list).toEqual(["item 0", "item 1", "item 2", "item 3", "item 4"]))
  })
  it("keeps writes in quick batches, and two quick settings changes", async () => {
    render(<Quick />)
    const two = screen.getByRole("button", { name: "Add two" })
    fireEvent.click(two); fireEvent.click(two); fireEvent.click(two)
    fireEvent.click(screen.getByRole("button", { name: "Add one" }))
    fireEvent.click(screen.getByRole("button", { name: "Set both" }))
    await waitFor(() => expect(pinto.data.values.count).toBe(7))
    await waitFor(() => expect(pinto.data.values.settings).toEqual({ a: "A", b: "B" }))
  })
})
`;

Deno.test({ name: "quick writes all land: ten fast taps, quick appends, overlapping batches and two settings changes", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const r = await runTests({ "/src/screens/quick.tsx": QUICK_SCREEN, "/tests/quick.test.tsx": QUICK_TEST });
    assertEquals(failuresOf(r), []);
    // The starter's 2 and these 3, each once (a second test file used to run the first one's again).
    assertEquals(r.results.length, 5);
  } finally { await stop(); }
});

const FEATURES = `import { describe, it, test, expect, vi, beforeAll, beforeEach, afterAll } from "vitest"
import { render, screen, within, waitFor, renderHook, fireEvent, act, waitForElementToBeRemoved } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useState } from "react"

let setups = 0
beforeAll(() => { setups++ })

function NoteForm() {
  const [text, setText] = useState("")
  const [pasted, setPasted] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const [shown, setShown] = useState(true)
  return (
    <form aria-label="Note" onSubmit={(e) => { e.preventDefault(); setSent(text) }}>
      <textarea aria-label="Text" value={text} onChange={(e) => setText(e.currentTarget.value)} />
      <input aria-label="Paste here" value={pasted} onChange={(e) => setPasted(e.currentTarget.value)} />
      <div aria-label="Score card">7 points</div>
      <label><input type="checkbox" defaultChecked /> Done</label>
      <section aria-label="Totals"><h2>Totals</h2><span>Send</span></section>
      <button type="submit">Send</button>
      {shown && <button type="button" onClick={() => setTimeout(() => setShown(false), 30)}>Dismiss</button>}
      {sent !== null && <p>Sent {sent.split("\\n").length} lines</p>}
    </form>
  )
}

function Ticker() {
  const [n, setN] = useState(0)
  useEffect(() => { const id = setInterval(() => setN((x) => x + 1), 1000); return () => clearInterval(id) }, [])
  return <p>Ticks {n}</p>
}

describe("what apps' tests reached for", () => {
  it("vi.spyOn, mock values and restore", () => {
    const math = { add: (a: number, b: number) => a + b }
    const spy = vi.spyOn(math, "add")
    expect(math.add(1, 2)).toBe(3)
    expect(spy).toHaveBeenCalledWith(1, 2)
    spy.mockReturnValueOnce(10)
    expect(math.add(1, 1)).toBe(10)
    expect(math.add(1, 1)).toBe(2)
    spy.mockRestore()
    expect(vi.isMockFunction(math.add)).toBe(false)
    const f = vi.fn().mockResolvedValue("ok")
    return expect(f()).resolves.toBe("ok")
  })
  it("toMatchObject, toHaveProperty and asymmetric matchers", () => {
    expect({ id: "a", day: { done: 2, notes: "x" }, tags: [1] }).toMatchObject({ day: { done: 2 } })
    expect([{ id: 1, x: 2 }]).toMatchObject([{ id: 1 }])
    expect({ a: { b: [5] } }).toHaveProperty("a.b[0]", 5)
    expect([{ id: 1, at: "2026-11-17" }]).toEqual([expect.objectContaining({ id: 1, at: expect.stringMatching(/^2026/) })])
    expect([1, 2, 3]).toEqual(expect.arrayContaining([3, 1]))
    expect({ n: 1 }).not.toMatchObject({ n: 2 })
  })
  it("getByLabelText finds aria-label on any element; the form and region roles; the selector option", () => {
    render(<NoteForm />)
    expect(screen.getByLabelText("Score card")).toHaveTextContent("7 points")
    expect(screen.getByRole("form", { name: "Note" })).toBeInTheDocument()
    expect(within(screen.getByRole("region", { name: "Totals" })).getByRole("heading")).toHaveTextContent("Totals")
    expect(screen.getByText("Send", { selector: "button" }).tagName).toBe("BUTTON")
    expect(screen.getByRole("checkbox", { name: "Done", checked: true })).toBeChecked()
    expect(screen.getByLabelText("Done")).toBeChecked()
  })
  it("Enter adds a line in a textarea, and paste types into the field", async () => {
    render(<NoteForm />)
    await userEvent.type(screen.getByLabelText("Text"), "one{Enter}two{Enter}three")
    expect(screen.getByLabelText("Text")).toHaveValue("one\\ntwo\\nthree")
    await userEvent.click(screen.getByLabelText("Paste here"))
    await userEvent.paste("pasted words")
    expect(screen.getByLabelText("Paste here")).toHaveValue("pasted words")
    await userEvent.type(screen.getByLabelText("Paste here"), "{Backspace}{Backspace}")
    expect(screen.getByLabelText("Paste here")).toHaveValue("pasted wor")
    await userEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(await screen.findByText("Sent 3 lines")).toBeInTheDocument()
  })
  it("waitForElementToBeRemoved and fireEvent for any event", async () => {
    render(<NoteForm />)
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    await waitForElementToBeRemoved(() => screen.queryByRole("button", { name: "Dismiss" }))
    const seen = vi.fn()
    render(<div onDoubleClick={seen} onKeyDown={seen}>Twice</div>)
    fireEvent.doubleClick(screen.getByText("Twice"))
    fireEvent.keyDown(screen.getByText("Twice"), { key: "a" })
    expect(seen).toHaveBeenCalledTimes(2)
  })
  it("fake timers and the system time", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-02T10:00:00Z"))
    expect(new Date().toISOString()).toBe("2026-01-02T10:00:00.000Z")
    render(<Ticker />)
    await act(() => { vi.advanceTimersByTime(3000) })
    expect(await screen.findByText("Ticks 3")).toBeInTheDocument()
    expect(Date.now()).toBe(Date.parse("2026-01-02T10:00:03Z"))
    vi.useRealTimers()
    expect(new Date().getFullYear()).toBeGreaterThanOrEqual(2026)
  })
  it("renderHook", () => {
    const { result } = renderHook(() => useState(5))
    expect(result.current[0]).toBe(5)
  })
  it.each([[1, 2, 3], [2, 3, 5]])("each: %i + %i is %i", (a, b, sum) => { expect(a + b).toBe(sum) })
  test("beforeAll ran once", () => { expect(setups).toBe(1) })
  it.skip("a skipped test doesn't run", () => { throw new Error("ran") })
})
`;
const MISSING = `import { it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

it("vi.mock", () => { vi.mock("@/lib/pinto") })
it("a matcher", () => { (expect(1) as any).toBeWonderful() })
it("a userEvent call", async () => { await (userEvent as any).pointer([{ keys: "[MouseLeft]" }]) })
it("a query", () => { (screen as any).getByShape("round") })
it("a query option", () => { screen.getByText("x", { shape: "round" } as any) })
`;
const MISSING_IMPORT = `import { it, expect } from "vitest"
import { magic } from "@testing-library/react"
it("never runs", () => { expect(magic).toBeDefined() })
`;

Deno.test({ name: "the test runner has what apps' tests reached for, and names what it doesn't have", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const r = await runTests({ "/tests/features.test.tsx": FEATURES, "/tests/missing.test.tsx": MISSING, "/tests/missing-import.test.tsx": MISSING_IMPORT });
    const mine = (f: string) => r.results.filter((t) => t.file === f);
    assertEquals(mine("/tests/features.test.tsx").filter((t) => !t.ok).map((t) => `${t.name}: ${t.error}`), []);
    assertEquals(mine("/tests/features.test.tsx").length, 10);
    const missing = Object.fromEntries(mine("/tests/missing.test.tsx").map((t) => [t.name, t]));
    for (const t of Object.values(missing)) assert(!t.ok, t.name);
    assertStringIncludes(missing["vi.mock"].error!, "vi.mock isn't in Pinto's test runner");
    assertStringIncludes(missing["a matcher"].error!, "expect(…).toBeWonderful isn't in Pinto's test runner");
    assertStringIncludes(missing["a userEvent call"].error!, "userEvent.pointer isn't in Pinto's test runner");
    assertStringIncludes(missing["a query"].error!, "screen.getByShape isn't in Pinto's test runner");
    assertStringIncludes(missing["a query option"].error!, `The "shape" option of getByText isn't in Pinto's test runner`);
    for (const t of Object.values(missing)) assertStringIncludes(t.error!, "README");
    assertEquals(r.errors.length, 1);
    assertStringIncludes(r.errors[0], "/tests/missing-import.test.tsx: magic isn't in Pinto's test runner");
  } finally { await stop(); }
});

// ISSUES.md 2026-11-17, from the Linux note: each test file ran the earlier files' tests again.
const counted = (file: string) => `import { it, expect } from "vitest"
const runs = ((window as any).__runs ??= {})
it("${file} one", () => { runs["${file} one"] = (runs["${file} one"] ?? 0) + 1; expect(runs["${file} one"]).toBe(1) })
it("${file} two", () => { runs["${file} two"] = (runs["${file} two"] ?? 0) + 1; expect(runs["${file} two"]).toBe(1) })
`;
// ISSUES.md 2026-11-17, from the Linux note: v86 revokes its worker's blob: URL right after new Worker.
const WORKER_TEST = `import { it, expect } from "vitest"
it("a worker from a blob URL revoked at once still runs", async () => {
  const url = URL.createObjectURL(new Blob(["postMessage('ticked')"], { type: "text/javascript" }))
  const worker = new Worker(url)
  URL.revokeObjectURL(url)
  const got = await new Promise((ok, no) => { worker.onmessage = (e) => ok(e.data); worker.onerror = () => no(new Error("the worker didn't load")); setTimeout(() => no(new Error("no message in 3 s")), 3000) })
  expect(got).toBe("ticked")
})
`;

Deno.test({ name: "each test file's tests run once, and a worker from a blob URL revoked at once loads", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const r = await runTests({ "/tests/a.test.tsx": counted("a"), "/tests/b.test.tsx": counted("b"), "/tests/c.test.tsx": counted("c"), "/tests/worker.test.tsx": WORKER_TEST });
    assertEquals(failuresOf(r), []);
    const mine = r.results.filter((t) => t.file !== "/tests/app.test.tsx").map((t) => `${t.file}: ${t.name}`);
    assertEquals(mine, [
      "/tests/a.test.tsx: a one", "/tests/a.test.tsx: a two", "/tests/b.test.tsx: b one", "/tests/b.test.tsx: b two",
      "/tests/c.test.tsx: c one", "/tests/c.test.tsx: c two", "/tests/worker.test.tsx: a worker from a blob URL revoked at once still runs",
    ]);
  } finally { await stop(); }
});

// 2026-11-17, an own-version run: the app's Markdown came out blank and its tests couldn't load,
// because `import { marked } from "marked"` found no such name (the bundled library came as a
// default export only). Its package's named exports work now, in the app and in its tests.
const MARKDOWN = `import { marked, Marked, parseInline } from "marked"
import markedDefault from "marked"
export const toHTML = (text: string) => marked.parse(text) as string
export const inline = (text: string) => parseInline(text) as string
export const fresh = () => new Marked().parse("# Hi") as string
export const sameAsDefault = () => markedDefault.marked === marked
`;
const MARKDOWN_TEST = `import { it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { toHTML, inline, fresh, sameAsDefault } from "@/lib/markdown"

it("turns Markdown into HTML with the package's named exports", () => {
  render(<div dangerouslySetInnerHTML={{ __html: toHTML("# Plan\\n\\n- **milk**") }} />)
  expect(screen.getByRole("heading", { name: "Plan" })).toBeTruthy()
  expect(screen.getByText("milk").tagName).toBe("STRONG")
  expect(inline("*a*")).toBe("<em>a</em>")
  expect(fresh()).toContain("<h1>Hi</h1>")
  expect(sameAsDefault()).toBe(true)
})
`;

Deno.test({ name: "an app and its tests import marked by name, as its package exports it", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const r = await runTests({ "/src/lib/markdown.ts": MARKDOWN, "/tests/markdown.test.tsx": MARKDOWN_TEST });
    assertEquals(failuresOf(r), []);
    assertEquals(r.results.filter((t) => t.file === "/tests/markdown.test.tsx").map((t) => t.ok), [true]);
  } finally { await stop(); }
});

Deno.test({ name: "an app's tests start with no data, whatever data.json holds; several files are one write and one check", ignore: !hasWebKit }, async () => {
  const { seen, stop } = await renderService();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const made = await tool(pg, a, "create", { type: "app", path: "Notes/Groceries.md" });
    assertStringIncludes(made.next, `path "Notes/Groceries.app", files`);
    const readme = (await tool(pg, a, "fetch", { id: "Notes/Groceries.app/README.md" }));
    const text = JSON.stringify(readme);
    for (const want of ["Each test starts with no data, whatever data.json holds", "What the test runner has", "vi.spyOn", "toMatchObject", "paste", "Several files at once", "builds on the newest value"]) assertStringIncludes(text, want);

    // The person's real list. The starter's test adds "Milk" and expects ["Milk"] to be saved:
    // over a sample of this data it failed and held every later save back.
    await tool(pg, a, "fetch", { id: "Notes/Groceries.app/data.json" });
    await tool(pg, a, "write", { path: "Notes/Groceries.app/data.json", content: JSON.stringify({ values: {}, collections: { items: [{ id: "a", text: "Eggs" }, { id: "b", text: "Coffee" }, { id: "c", text: "Rice" }] } }) });
    const after = await tool(pg, a, "edit", { path: "Notes/Groceries.app/src/screens/home.tsx", old_string: "Nothing here yet.", new_string: "Nothing on the list yet." });
    assertEquals([after.tests, after.live.startsWith("Live")], ["2 passed, 0 failed", true]);

    // One file that needs another not yet written: held back, and the answer says to send them together.
    await tool(pg, a, "fetch", { id: "Notes/Groceries.app/src/App.tsx" });
    const half = await tool(pg, a, "edit", { path: "Notes/Groceries.app/src/App.tsx", old_string: `import Settings from "@/screens/settings"`, new_string: `import Settings from "@/screens/settings"\nimport Quick from "@/screens/quick"\nvoid Quick` });
    assert(half.live.startsWith("Held back"), half.live);
    assertStringIncludes(half.together, `one write (path "Notes/Groceries.app", files`);

    // The screen and its test together: one save, one check (one render each for the views, the
    // tests and the smoke check), and live.
    const before = { ...seen };
    const both = await tool(pg, a, "write", { path: "Notes/Groceries.app", files: [{ path: "src/screens/quick.tsx", content: QUICK_SCREEN }, { path: "tests/quick.test.tsx", content: QUICK_TEST }] });
    assertEquals([both.tests, both.live.startsWith("Live")], ["5 passed, 0 failed", true]);
    assertEquals([seen.renders - before.renders, seen.tests - before.tests, seen.smoke - before.smoke], [3, 1, 1]);
  } finally { await stop(); }
});

/** A template app's folder (web/content/templates), as the files a save gets. */
async function templateFiles(slug: string) {
  const root = new URL(`../../../web/content/templates/${slug}.app/`, import.meta.url).pathname;
  const files: Record<string, string> = {};
  const walk = async (dir: string, rel: string) => {
    for await (const e of Deno.readDir(dir)) {
      const path = `${rel}/${e.name}`;
      if (e.isDirectory) await walk(`${dir}/${e.name}`, path);
      else if (path !== "/data.json" && !/\.(png|jpe?g|webp)$/.test(path)) files[path] = await Deno.readTextFile(`${dir}/${e.name}`);
    }
  };
  await walk(root, "");
  return files;
}

// The templates' suites failed now and then under load: the Undo bar kept its offer in a module
// variable from one test to the next, Undo was offered only once a delete was confirmed (after
// the test, or the person, had moved on), the first screen swapped in the AI's suggestions while
// the person was typing, and a sheet closed when its save was confirmed, shutting the next one
// opened by then. Each has its own test in the template; this catches the next one. Here every template's
// suite runs three times at once (12 pages), with the machine kept busy, and every run has to pass
// (more pages than that only measures the 30 s budget on a loaded Mac).
Deno.test({ name: "the template apps' tests pass every time, many runs at once on a busy machine", ignore: !hasWebKit }, async () => {
  const { renderPage, testRunnerProject, closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const busy = Array.from({ length: 4 }, () => new Worker(URL.createObjectURL(new Blob(["for (;;) {}"], { type: "text/javascript" })), { type: "module" }));
  try {
    const runners = await Promise.all(["habit-tracker", "budget-log", "study-flashcards", "trip-plan"].map(async (slug) => {
      const p = await withFiles({ amberApp: 1, files: {}, compiled: {} }, await templateFiles(slug));
      return { slug, runner: testRunnerProject(JSON.stringify((await linkProject(p)).project))! };
    }));
    // Each run gets 120 s here, so a slow run shows as slow, not failed: a failed check is a flake,
    // while a run over the save's 30 s, or a test over its own 5 s, is a capacity note (printed).
    const runs = await Promise.all(runners.flatMap(({ slug, runner }) => Array.from({ length: 3 }, async (_, i) => {
      const t0 = performance.now();
      const r = await renderPage(runner, "Template\n", { values: {}, collections: {} }, { today: "2026-11-17", tests: true, testsTimeout: 120_000 });
      const results = r.tests ?? [];
      const all = failuresOf({ results, errors: r.testErrors ?? [] });
      const late = all.filter((f) => /timed out after \d+ s|didn't finish in \d+ s/.test(f));
      return { run: `${slug} #${i + 1}`, seconds: Math.round((performance.now() - t0) / 1000), passed: results.filter((t) => t.ok).length, late, failures: all.filter((f) => !late.includes(f)) };
    })));
    const slow = runs.filter((r) => r.seconds > 30 || r.late.length).map((r) => `${r.run} ${r.seconds} s${r.late.length ? ` (${r.late.join("; ")})` : ""}`);
    if (slow.length) console.log(`Over the save's 30 s on this machine (load ${Deno.loadavg()[0].toFixed(0)}): ${slow.join(", ")}`);
    assertEquals(runs.filter((r) => r.failures.length), [], JSON.stringify(runs.filter((r) => r.failures.length), null, 1));
    for (const r of runs) assert(r.passed + r.late.length > 20, `${r.run} ran only ${r.passed} tests`);
  } finally {
    for (const w of busy) w.terminate();
    await closeBrowser();
  }
});

const failsWith = async (p: Promise<unknown>) => { try { await p; } catch (e) { return (e as Error).message; } throw new Error("expected the tool to refuse"); };

// 2026-11-17 (loosen test): 6 of 10 agents put data.json in a multi-file write whose version was
// held back. The answer said "created" and the data never reached the app; 3 never noticed.
Deno.test({ name: "data.json in a write with other files is the app's data: kept, and said so, even when the version is held back", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await tool(pg, a, "create", { type: "app", path: "Notes/Reading.app".replace(".app", ".md") });
    const books = { values: {}, collections: { books: [{ id: "b1", title: "Middlemarch" }, { id: "b2", title: "Stoner" }] } };
    const failing = `import { it, expect } from "vitest"\nit("is not done yet", () => { expect(1).toBe(2) })\n`;

    // Not read first: refused, and nothing is saved (as a write to data.json alone).
    const refused = await failsWith(tool(pg, a, "write", { path: "Notes/Reading.app", files: [{ path: "tests/later.test.tsx", content: failing }, { path: "data.json", content: JSON.stringify(books) }] }));
    assertStringIncludes(refused, "Read Notes/Reading.app/data.json with fetch before changing it.");

    await tool(pg, a, "fetch", { id: "Notes/Reading.app/data.json" });
    const out = await tool(pg, a, "write", { path: "Notes/Reading.app", files: [{ path: "tests/later.test.tsx", content: failing }, { path: "data.json", content: JSON.stringify(books) }] });
    assert(String(out.live).startsWith("Held back"), out.live);
    assertStringIncludes(out.data, "data.json was saved even though this version is held back");
    assertEquals(out.files.find((f: { path: string }) => f.path.endsWith("data.json")), { path: "Notes/Reading.app/data.json", did: "saved (the app's data)" });
    const kept = JSON.parse((await tool(pg, a, "fetch", { id: "Notes/Reading.app/data.json" })).text.replace(/^\s*\d+\t/gm, ""));
    assertEquals(kept.collections.books.map((b: { title: string }) => b.title), ["Middlemarch", "Stoner"]);
    // It isn't a file of the version either.
    const listed: string = (await tool(pg, a, "fetch", { id: "Notes/Reading.app/" })).text;
    assert(!/data\.json\s+\(/.test(listed), listed);
    assertStringIncludes(listed, "Notes/Reading.app/data.json");
  } finally { await stop(); }
});

// 2026-11-17 (loosen test): a sonner toast's Undo broke the test page ("pageerror: The object can
// not be found here", no test name; 8 of 10 agents dropped sonner), and "{Enter}" saw the state
// from before the last keystrokes (Preact ran effects and renders late in the test page).
const REACTS_SCREEN = `import { useEffect, useState } from "react"
import { toast } from "sonner"
export function Groceries() {
  const [items, setItems] = useState<string[]>(["Eggs"])
  const [text, setText] = useState("")
  const [count, setCount] = useState(0)
  useEffect(() => { setCount(items.length) }, [items])
  const drop = (x: string) => { const before = items; setItems(items.filter((i) => i !== x)); toast(\`Deleted \${x}\`, { action: { label: "Undo", onClick: () => setItems(before) } }) }
  return <div>
    <input aria-label="New item" value={text} onInput={(e) => setText(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === "Enter") { setItems([...items, text]); setText("") } }} />
    <p>{count} on the list</p>
    {items.map((x) => <button key={x} onClick={() => drop(x)}>Delete {x}</button>)}
  </div>
}
export function Broken() { return <button onClick={() => { throw new Error("the button broke") }}>Break</button> }
`;
const REACTS_TEST = `import { it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Toaster } from "@/components/ui/sonner"
import { Groceries, Broken } from "@/screens/reacts"
it("adds with Enter what was typed, and shows the effect's count at once", async () => {
  render(<Groceries />)
  await userEvent.type(screen.getByLabelText("New item"), "Milk{Enter}")
  expect(screen.getByRole("button", { name: "Delete Milk" })).toBeInTheDocument()
  expect(screen.getByText("2 on the list")).toBeInTheDocument()
  expect(screen.getByLabelText("New item")).toHaveValue("")
})
it("deletes with a toast and brings it back with its Undo", async () => {
  render(<><Groceries /><Toaster position="top-center" /></>)
  await userEvent.click(screen.getByRole("button", { name: "Delete Eggs" }))
  expect(await screen.findByText("Deleted Eggs")).toBeInTheDocument()
  await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
  expect(await screen.findByRole("button", { name: "Delete Eggs" })).toBeInTheDocument()
})
it("fails by name when the app throws in a handler", async () => {
  render(<Broken />)
  await userEvent.click(screen.getByRole("button", { name: "Break" }))
})
it("runs on after that", () => { expect(1).toBe(1) })
`;
Deno.test({ name: "tests run as with React: state is current after each key, effects have run, a toast's Undo works, and a handler's error names its test", ignore: !hasWebKit }, async () => {
  try {
    const r = await runTests({ "/src/screens/reacts.tsx": REACTS_SCREEN, "/tests/reacts.test.tsx": REACTS_TEST });
    const byName = Object.fromEntries(r.results.map((t: { name: string; ok: boolean; error?: string }) => [t.name, t]));
    assertEquals(r.errors, []);
    for (const n of ["adds with Enter what was typed, and shows the effect's count at once", "deletes with a toast and brings it back with its Undo", "runs on after that"]) assert(byName[n]?.ok, `${n}: ${byName[n]?.error}`);
    const broke = byName["fails by name when the app throws in a handler"];
    assert(!broke.ok);
    assertStringIncludes(String(broke.error), `An error in the app during this test, in a "click" handler: the button broke`);
  } finally {
    const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
    await closeBrowser();
  }
});

// 2026-11-17 (loosen test): useSettings ignored a function update, and useStore's function setter
// could get undefined instead of the initial value when nothing was stored.
const HOOKS_SCREEN = `import { useStore, useSettings } from "@/lib/pinto"
export default function Hooks() {
  const [n, setN] = useStore("n", 5)
  const [s, update] = useSettings({ size: 1, theme: "light" })
  return <div>
    <button onClick={() => setN((old: number) => old + 1)}>Add one</button>
    <button onClick={() => { setN(undefined as unknown as number); setN((old: number) => old + 10) }}>Clear and add ten</button>
    <p>n is {String(n)}</p>
    <button onClick={() => update((old: { size: number; theme: string }) => ({ size: old.size + 1 }))}>Bigger</button>
    <p>size is {String(s.size)} {s.theme}</p>
  </div>
}
`;
const HOOKS_TEST = `import { it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { pinto } from "pinto"
import Hooks from "@/screens/hooks"
it("a function update starts from the initial value when nothing is stored", async () => {
  render(<Hooks />)
  await userEvent.click(screen.getByRole("button", { name: "Add one" }))
  await waitFor(() => expect(pinto.data.values.n).toBe(6))
  await userEvent.click(screen.getByRole("button", { name: "Clear and add ten" }))
  await waitFor(() => expect(pinto.data.values.n).toBe(15))
  expect(screen.getByText("n is 15")).toBeInTheDocument()
})
it("useSettings takes a function update, given the settings with their defaults", async () => {
  render(<Hooks />)
  await userEvent.click(screen.getByRole("button", { name: "Bigger" }))
  await userEvent.click(screen.getByRole("button", { name: "Bigger" }))
  await waitFor(() => expect(pinto.data.values.settings).toEqual({ size: 3 }))
  expect(screen.getByText("size is 3 light")).toBeInTheDocument()
})
`;
Deno.test({ name: "the store hooks do what the README says: function updates in useSettings, and the initial value when nothing is stored", ignore: !hasWebKit }, async () => {
  try {
    const r = await runTests({ "/src/screens/hooks.tsx": HOOKS_SCREEN, "/tests/hooks.test.tsx": HOOKS_TEST });
    assertEquals(failuresOf(r), []);
    assertEquals(r.results.length, 4);
  } finally {
    const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
    await closeBrowser();
  }
});

// 2026-11-17 (loosen test): see_app with steps ignored widths and themes and gave only the last
// screenshot.
Deno.test({ name: "see_app with steps uses each width and theme asked for, with a picture after each step", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await tool(pg, a, "create", { type: "app", path: "Notes/Groceries.md" });
    const seen = await tool(pg, a, "see_app", { path: "Notes/Groceries.app", widths: [390, 1280], themes: ["light", "dark"], steps: [{ type: "Milk", into: "New item" }, { press: "Enter" }] });
    const blocks = seen.content as { type: string; text?: string }[];
    const head = JSON.parse(blocks[0].text!);
    assertEquals(head.view, "390 px light");
    assertEquals(head.steps.length, 2);
    assertEquals(head.other_views.map((v: { view: string }) => v.view), ["390 px dark", "1280 px light", "1280 px dark"]);
    const captions = blocks.filter((b) => b.type === "text").slice(1).map((b) => b.text);
    assertEquals(captions, ["After step 1 (390 px light):", "After step 2 (390 px light):", "After the last step, at 390 px dark:", "After the last step, at 1280 px light:", "After the last step, at 1280 px dark:"]);
    assertEquals(blocks.filter((b) => b.type === "image").length, 5);
  } finally { await stop(); }
});

// 2026-11-17: a new app starts from shadcn's neutral starter, whose colours are oklch(). The body
// contrast check read oklch(0.145 0 0) as numbers and called the fresh starter unreadable (1.0:1),
// and the field check asked every field for a fill of its own. Colours are now read by the browser.
Deno.test({ name: "a fresh app with oklch colours passes the contrast check in light and dark", ignore: !hasWebKit }, async () => {
  const { stop } = await renderService();
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const made = await tool(pg, a, "create", { type: "app", path: "Notes/Neutral.md" });
    const said = JSON.stringify([made.errors ?? [], made.notes ?? []]);
    assert(!/hard to see|contrast/.test(said), said);
    assert(!/neither a border nor a fill|without a visible border/.test(said), said);
    const { renderedFindings } = await import("./app_check.ts");
    const { renderPage } = await import("../../../scripts/page-render/render.ts");
    const html = JSON.stringify((await linkProject(await withFiles({ amberApp: 1, files: {}, compiled: {} }, await scaffold("Neutral")))).project);
    const r = await renderPage(html, "Neutral\n", { values: {}, collections: {} }, { today: "2026-11-17", views: [{ width: 390, scheme: "light" }, { width: 390, scheme: "dark" }] });
    for (const v of r.views) assert(v.contrast >= 12, `${v.name}: ${v.bg} / ${v.fg} = ${v.contrast}`);
    assertEquals(renderedFindings(r as never).errors.filter((e) => /hard to see/.test(e)), []);
  } finally {
    await stop();
  }
});

// 2026-11-17: the neutral starter dropped amber-base.css, and with it the line that makes rem follow
// the reader's text size (iPhone Dynamic Type, which Pinto Notes passes in as --pinto-root-font).
// Its fields also asked for a bg-field colour the neutral CSS didn't define, so they were see-through.
Deno.test({ name: "a new app's text follows the reader's text size, and its fields have a fill", ignore: !hasWebKit }, async () => {
  try {
    const { renderPage } = await import("../../../scripts/page-render/render.ts");
    const probe = `import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

export default function App() {
  const [seen, setSeen] = useState("")
  useEffect(() => {
    // Measured once the page's styles have loaded.
    const measure = () => {
      const root = document.documentElement
      const before = getComputedStyle(root).fontSize
      const field = getComputedStyle(document.getElementById("probe-field")!).backgroundColor
      root.style.setProperty("--pinto-root-font", "23px/1.3 -apple-system, system-ui, sans-serif")
      const larger = getComputedStyle(root).fontSize
      root.style.removeProperty("--pinto-root-font")
      setSeen(\`root \${before} larger \${larger} field \${field}\`)
    }
    if (document.readyState === "complete") measure(); else addEventListener("load", measure, { once: true })
  }, [])
  return <main><h1>Probe</h1><Input id="probe-field" aria-label="Probe field" /><p>{seen}</p></main>
}
`;
    const html = JSON.stringify((await linkProject(await withFiles({ amberApp: 1, files: {}, compiled: {} }, { ...await scaffold("Probe"), "/src/App.tsx": probe }))).project);
    const r = await renderPage(html, "Probe\n", { values: {}, collections: {} }, { today: "2026-11-17", views: [{ width: 390, scheme: "light" }, { width: 390, scheme: "dark" }], probes: false, interact: false });
    for (const v of r.views) {
      const seen = v.excerpt ?? "";
      // The renderer passes the iPhone's default reading size (17 px), as the app does.
      assertStringIncludes(seen, "root 17px", `${v.name}: ${seen}`);
      assertStringIncludes(seen, "larger 23px", `${v.name}: ${seen}`);
      assert(/field \S/.test(seen) && !/field (rgba\(0, 0, 0, 0\)|transparent)/.test(seen), `${v.name}: ${seen}`);
    }
  } finally {
    const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
    await closeBrowser();
  }
});

// 2026-11-18 (arm D): faint secondary text in B and C apps was counted, not fixed. The check now
// names each colour pair and the nearest colour that reads, lays translucent text (Tailwind's
// text-black/40) over its background first, and holds large text to 3:1 as WCAG does.
Deno.test({ name: "faint text is named by its colour, with the nearest colour that reads, translucent text included", ignore: !hasWebKit }, async () => {
  try {
    const { renderPage } = await import("../../../scripts/page-render/render.ts");
    const { renderedFindings } = await import("./app_check.ts");
    const probe = `export default function App() {
  return <main style={{ background: "#ffffff", color: "#111111", minHeight: "100vh" }}>
    <h1>Probe</h1>
    <p className="text-muted-foreground" style={{ color: "#a3a3a3", fontSize: "15px" }}>3 left today</p>
    <p style={{ color: "rgb(0 0 0 / 0.3)", fontSize: "15px" }}>Last saved a minute ago</p>
    <p style={{ color: "#8f8f8f", fontSize: "40px" }}>25:00</p>
    <p style={{ fontSize: "15px" }}>Body text that reads well enough on white.</p>
  </main>
}
`;
    const html = JSON.stringify((await linkProject(await withFiles({ amberApp: 1, files: {}, compiled: {} }, { ...await scaffold("Probe"), "/src/App.tsx": probe }))).project);
    const r = await renderPage(html, "Probe\n", { values: {}, collections: {} }, { today: "2026-11-18", views: [{ width: 390, scheme: "light" }], probes: false, interact: false });
    const pairs = (r.views[0] as unknown as { faintColors: { color: string; background: string; ratio: number; use: string; useRatio: number; texts: string[]; className: string }[] }).faintColors;
    const lum = (hex: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const grey = pairs.find((p) => p.texts.includes("3 left today"));
    assert(grey, JSON.stringify(pairs));
    assertEquals([grey.color, grey.background, grey.className], ["#a3a3a3", "#ffffff", "text-muted-foreground"]);
    assert(ratio(grey.use, "#ffffff") >= 4.5 && ratio(grey.use, "#ffffff") < 5.2, `${grey.use} is ${ratio(grey.use, "#ffffff")}:1: readable, and no darker than it needs to be`);
    // 30% black on white is #b2b2b2 to the eye (alpha is kept in 255ths), 2.1:1.
    const see = pairs.find((p) => p.texts.includes("Last saved a minute ago"));
    assert(see && /^#b[23]b[23]b[23]$/.test(see.color) && ratio(see.use, "#ffffff") >= 4.5, JSON.stringify(pairs));
    // 40 px text at 3.3:1 is large text, which reads from 3:1.
    assert(!pairs.some((p) => p.texts.includes("25:00")), JSON.stringify(pairs));
    const f = renderedFindings(r as never);
    assertEquals(f.errors, []);
    assert(f.notes.some((n) => n.startsWith("Text in #a3a3a3 on #ffffff") && n.includes(grey.use)), f.notes.join("\n"));
  } finally {
    const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
    await closeBrowser();
  }
});

// 2026-11-18 (arm D): the starter's own tabs (muted text on the muted grey) read at 4.3:1, so a
// fresh app drew a contrast note. And see_app's taps took "ul li button" for words to look for.
Deno.test({ name: "the starter's muted text reads at 4.5:1 on its own greys, and a tap takes any CSS selector", ignore: !hasWebKit }, async () => {
  try {
    const { renderPage } = await import("../../../scripts/page-render/render.ts");
    const probe = `import { useState } from "react"
export default function App() {
  const [n, setN] = useState(0)
  return <main className="bg-background p-4">
    <h1>Probe</h1>
    <p className="text-muted-foreground">Muted on the page</p>
    <p className="bg-muted text-muted-foreground">Muted on muted</p>
    <p className="bg-card text-muted-foreground">Muted on a card</p>
    <p className="bg-accent text-muted-foreground">Muted on accent</p>
    <ul><li><span>Row</span> <button type="button" onClick={() => setN(n + 1)}>Go</button></li></ul>
    <p>Tapped {n}</p>
  </main>
}
`;
    const html = JSON.stringify((await linkProject(await withFiles({ amberApp: 1, files: {}, compiled: {} }, { ...await scaffold("Probe"), "/src/App.tsx": probe }))).project);
    const r = await renderPage(html, "Probe\n", { values: {}, collections: {} }, { today: "2026-11-18", views: [{ width: 390, scheme: "light" }, { width: 390, scheme: "dark" }], probes: false, interact: false });
    for (const v of r.views) assertEquals((v as unknown as { faintColors: unknown[] }).faintColors, [], v.name);
    const tapped = await renderPage(html, "Probe\n", { values: {}, collections: {} }, { today: "2026-11-18", steps: [{ tap: "ul li button" }] } as never);
    const step = tapped.trial![0] as { ok: boolean; error?: string; screen: string[] };
    assert(step.ok, step.error);
    assert(step.screen.join(" ").includes("Tapped 1"), step.screen.join(" "));
  } finally {
    const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
    await closeBrowser();
  }
});
