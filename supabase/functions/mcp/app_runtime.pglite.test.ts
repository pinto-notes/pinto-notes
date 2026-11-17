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
