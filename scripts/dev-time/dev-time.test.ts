// What scripts/dev-time measures, on made-up logs shaped like real ones.
// Run: deno test -A scripts/dev-time/dev-time.test.ts
import { assertEquals } from "jsr:@std/assert@1";

const dir = new URL(".", import.meta.url).pathname;
const T = 1_794_400_000; // a fixed "now"; the window is the day before it

type Call = { at: number; secs: number; cmd: string; out: string };
function transcript(calls: Call[]): string {
  return calls.flatMap((c, i) => [
    JSON.stringify({ type: "assistant", timestamp: new Date(c.at * 1000).toISOString(), message: { content: [{ type: "tool_use", id: `t${i}`, name: "Bash", input: { command: c.cmd } }] } }),
    JSON.stringify({ type: "user", timestamp: new Date((c.at + c.secs) * 1000).toISOString(), message: { content: [{ type: "tool_result", tool_use_id: `t${i}`, content: c.out }] } }),
  ]).join("\n") + "\n";
}

async function report(files: { a: Call[]; b?: Call[]; runs?: object[]; load?: string }) {
  const root = await Deno.makeTempDir();
  const tr = `${root}/projects`, logs = `${root}/logs`;
  await Deno.mkdir(`${tr}/-Users-x-PintoNotes`, { recursive: true });
  await Deno.mkdir(logs);
  await Deno.writeTextFile(`${tr}/-Users-x-PintoNotes/a.jsonl`, transcript(files.a));
  if (files.b) await Deno.writeTextFile(`${tr}/-Users-x-PintoNotes/b.jsonl`, transcript(files.b));
  if (files.runs) await Deno.writeTextFile(`${logs}/runs.jsonl`, files.runs.map((r) => JSON.stringify(r)).join("\n") + "\n");
  if (files.load) await Deno.writeTextFile(`${logs}/load.csv`, files.load);
  const out = await new Deno.Command("python3", {
    args: ["-I", `${dir}dev-time.py`, "--json", "--days", "1", "--until", String(T), "--logs", logs, "--transcripts", tr],
  }).output();
  await Deno.remove(root, { recursive: true });
  if (!out.success) throw new Error(new TextDecoder().decode(out.stderr));
  return JSON.parse(new TextDecoder().decode(out.stdout));
}

Deno.test("a command is counted by what it runs, not by what it mentions", async () => {
  const r = await report({ a: [
    { at: T - 5000, secs: 1, cmd: "sed -n 1,60p scripts/qa-test.sh", out: "" },
    { at: T - 4000, secs: 300, cmd: "python3 - <<'EOF'\np='x.swift'\nEOF\ncaffeinate -i nice -n 10 scripts/qa-test.sh PaneTests/A", out: "** TEST SUCCEEDED **" },
    { at: T - 3000, secs: 30, cmd: "cd ~/w && git status", out: "" },
  ] });
  assertEquals(r.agents.by_category["qa-test"].calls, 1);
  assertEquals(r.agents.by_category["qa-test"].hours, 0.08);
  assertEquals(r.agents.by_category["other shell"].calls, 1);
  assertEquals(r.agents.by_category["git"].calls, 1);
});

Deno.test("the same test asked for again after an edit counts as a repeat, with its time", async () => {
  const run = (at: number, edit: string) => ({ at, secs: 120, cmd: `python3 - <<'EOF'\n${edit}\nEOF\nscripts/qa-test.sh PaneTests/A`, out: "TEST FAILED" });
  const r = await report({ a: [run(T - 9000, "a=1"), run(T - 8000, "a=2"), run(T - 7000, "a=3")] });
  assertEquals(r.agents.same_build_again, { runs: 2, hours: 0.07 });
  assertEquals(r.agents.by_category["qa-test"].failed, 3);
});

Deno.test("lock waits, disk refusals, timeouts and the 10-minute limit are counted", async () => {
  const r = await report({ a: [
    { at: T - 9000, secs: 600, cmd: "scripts/prepush.sh", out: "→ Waiting for the local check of pid 12 (/w), 0 s so far\n→ Waiting for the local check of pid 12 (/w), 540 s so far" },
    { at: T - 8000, secs: 2, cmd: "scripts/prepush.sh", out: "✗ Not started: 12 GB free on this disk, and the check wants 20" },
    { at: T - 7000, secs: 240, cmd: "scripts/qa-test.sh PaneTests/B", out: "TIMEOUT after 240s" },
  ] });
  assertEquals(r.agents.prepush_lock_waits, { calls: 1, hours: 0.15 });
  assertEquals(r.agents.disk_guard_refusals, 1);
  assertEquals(r.agents.qa_timeouts, 1);
  assertEquals(r.agents.hit_10_min_tool_cap.calls, 1);
});

Deno.test("a run is split by how many other sessions were building at the time", async () => {
  const qa = (at: number) => ({ at, secs: 300, cmd: "scripts/qa-test.sh PaneTests/A", out: "" });
  const r = await report({ a: [qa(T - 20000), qa(T - 10000)], b: [{ at: T - 9900, secs: 100, cmd: "xcodebuild -scheme Pane build", out: "" }] });
  assertEquals(r.agents.median_min_by_others_building["qa-test, others 0"].n, 1);
  assertEquals(r.agents.median_min_by_others_building["qa-test, others 1-2"].n, 1);
  assertEquals(r.agents.wall_hours_building, 0.17);
});

Deno.test("exact runs: lock wait, failures, repeats and busy-vs-quiet time", async () => {
  const run = (start: number, secs: number, exit: number, load1: number) => ({ start, end: start + secs, secs, exit, lock_wait: 30, cwd: "/w", branch: "b", tool: "prepush", args: "--tests", load1 });
  const runs = [run(T - 9000, 100, 0, 3), run(T - 5000, 400, 1, 20)];
  const load = "epoch,load1,cores,mem_free_pct,swap_mb,disk_free_gb,xcodebuild,swift_frontend,claude,simulators\n" +
    `${T - 9000},3,14,60,0,80,1,2,3,0\n${T - 5000},20,14,10,4000,30,5,9,12,1\n`;
  const r = await report({ a: [], runs: runs.map(({ load1: _, ...x }) => x), load });
  const p = r.runs.prepush;
  assertEquals([p.runs, p.failed, p.lock_wait_hours, p.same_run_again], [2, 1, 0.02, 1]);
  assertEquals(p.median_s_by_load["quiet (load < cores/2)"], { n: 1, median_s: 70 });
  assertEquals(p.median_s_by_load["busy (load ≥ cores)"], { n: 1, median_s: 370 });
  assertEquals([r.mac.overloaded_pct, r.mac.low_memory_pct], [50, 50]);
});

Deno.test("record.sh writes one line per run and never fails its caller", async () => {
  const logs = await Deno.makeTempDir();
  const start = Math.floor(Date.now() / 1000) - 5;
  const out = await new Deno.Command("zsh", { args: [`${dir}record.sh`, "qa-test", String(start), "1", "0", "PaneTests/A", "PaneTests/B"], env: { PINTO_DEV_LOG: logs } }).output();
  assertEquals(out.code, 0);
  const line = JSON.parse((await Deno.readTextFile(`${logs}/runs.jsonl`)).trim());
  assertEquals([line.tool, line.exit, line.args, line.secs >= 5], ["qa-test", 1, "PaneTests/A PaneTests/B", true]);
  const bad = await new Deno.Command("zsh", { args: [`${dir}record.sh`, "x", "notanumber", "0", "0"], env: { PINTO_DEV_LOG: logs } }).output();
  assertEquals(bad.code, 0);
  await Deno.remove(logs, { recursive: true });
});
