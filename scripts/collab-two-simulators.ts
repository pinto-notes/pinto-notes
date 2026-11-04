// Shared notes in the real app on two iPhone simulators, against the LOCAL stack: Emil shares a
// checklist with Can edit, Sara joins by the link, both tick at once and each sees the other's
// tick, the server goes away while Sara edits and ticks, her edits merge when it's back, Sara's AI
// edits the note through the stack's MCP function and both see it, and Emil removes Sara.
//
//   deno run -A scripts/collab-two-simulators.ts "<path to Amber Notes Beta.app for the simulator>"
//
// The app is Amber Notes Beta built for the simulator from this checkout (its backend is the local
// stack), so CollabScript plays its steps (Pane/Collab/CollabScript.swift): sharing, joining,
// ticking and removing go through the app's own code; no input events are posted anywhere.
// The simulators are booted headless (no Simulator window) and the app plays no sound. Everything
// it makes (two simulators, two accounts collab-sim-<run>-*@example.com) is deleted at the end,
// also when a step fails. Needs the key copy on in the stack's functions (KEY_COPY=on and a
// KEY_COPY_SECRET_1 in supabase/functions/.env), as for standard accounts, so Sara's AI can be
// connected without her device.
//
// "The server goes away": COLLAB_OFFLINE / COLLAB_ONLINE are shell commands that cut and restore
// the stack's gateway; by default `docker pause supabase_kong_pane` and `docker unpause …`.
import { fromBase64, tokenKey, wrap } from "../supabase/functions/_shared/e2ee.ts";
import { openTransport } from "../supabase/functions/_shared/keycopy.ts";

const app = Deno.args[0];
if (!app || !app.endsWith(".app")) throw new Error("Give the path to the simulator build of Amber Notes Beta.");
const root = new URL("..", import.meta.url).pathname;
const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env", "--workdir", root], stderr: "null" }).output()).stdout);
const env = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const api = env.API_URL, anon = env.ANON_KEY, service = env.SERVICE_ROLE_KEY;
if (!api || !/^http:\/\/127\.0\.0\.1:/.test(api)) throw new Error(`Not a local stack: ${api}. Run supabase start.`);
const offline = Deno.env.get("COLLAB_OFFLINE") ?? "docker pause supabase_kong_pane";
const online = Deno.env.get("COLLAB_ONLINE") ?? "docker unpause supabase_kong_pane";
const bundle = "dev.emilwagman.pane.beta";
const run = crypto.randomUUID().slice(0, 6);
const admin = { apikey: service, authorization: `Bearer ${service}`, "content-type": "application/json" };

async function sh(cmd: string[], quiet = false): Promise<string> {
  const out = await new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: "piped", stderr: "piped" }).output();
  const text = new TextDecoder().decode(out.stdout).trim();
  if (!out.success && !quiet) throw new Error(`${cmd.slice(0, 3).join(" ")}: ${new TextDecoder().decode(out.stderr).trim().slice(0, 300)}`);
  return text;
}
const simctl = (...a: string[]) => sh(["xcrun", "simctl", ...a]);
const shell = (c: string) => sh(["/bin/zsh", "-c", c]);
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { results.push([name, ok, detail]); console.log(ok ? "PASS" : "FAIL", name, detail); };

// MARK: Accounts

type Person = { name: string; email: string; password: string; id: string };
const people: Person[] = [];
for (const name of ["Emil", "Sara"]) {
  const email = `collab-sim-${run}-${name.toLowerCase()}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
  await fetch(`${api}/rest/v1/signup_allowlist`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
  const res = await fetch(`${api}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) });
  if (!res.ok) throw new Error(`Making ${name} failed: ${res.status}`);
  const { id } = await res.json();
  people.push({ name, email, password, id });
  await fetch(`${api}/rest/v1/email_unsubscribes`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: id, source: "link" }) }).then((r) => r.body?.cancel());
  const s = await signIn(people.at(-1)!);
  await fetch(`${api}/rest/v1/profiles`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ display_name: `${name} Test` }) }).then((r) => r.body?.cancel());
}
async function signIn(p: Person) {
  return await (await fetch(`${api}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email: p.email, password: p.password }) })).json();
}

// MARK: Simulators

const runtime = JSON.parse(await simctl("list", "runtimes", "-j")).runtimes.filter((r: any) => r.isAvailable && r.platform === "iOS").at(-1).identifier;
const devices: { udid: string; dir: string; person: Person }[] = [];
const label = (d: { person: Person }) => d.person.name;

async function cleanup() {
  for (const d of devices) {
    await sh(["xcrun", "simctl", "terminate", d.udid, bundle], true);
    await sh(["xcrun", "simctl", "shutdown", d.udid], true);
    await sh(["xcrun", "simctl", "delete", d.udid], true);
  }
  await shell(online).catch(() => {});
  for (const p of people) await fetch(`${api}/auth/v1/admin/users/${p.id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
  console.log(`Deleted ${devices.length} simulators and ${people.length} accounts (collab-sim-${run}).`);
}

const list = "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n- [ ] Order lunch\n- [ ] Print agenda\n";
const steps = (p: Person, rest: unknown[]) => [{ signIn: { email: p.email, password: p.password } }, { skipIntro: 8 }, { waitReady: 180 }, ...rest];
const emilSteps = steps(people[0], [
  { create: list }, { access: "edit" }, { copyLink: "link.txt" },
  { waitFile: "go-tick.txt" }, { tick: "Book the venue" }, { waitText: { text: "- [x] Order lunch", timeout: 90 } }, { dump: "ticks.json" },
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 240 } }, { dump: "merged.json" },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, { dump: "ai.json" },
  { waitFile: "go-remove.txt" }, { remove: "Sara" }, { wait: 2 }, { dump: "removed.json" },
  { waitFile: "go-quit.txt" }, { quit: true },
]);
const saraSteps = steps(people[1], [
  { waitFile: "link.txt" }, { join: "link.txt" }, { dump: "joined.json" },
  { waitFile: "go-tick.txt" }, { tick: "Order lunch" }, { waitText: { text: "- [x] Book the venue", timeout: 90 } }, { dump: "ticks.json" },
  { waitFile: "go-offline.txt" }, { type: { text: "\nBook the train", after: "Print agenda" } }, { tick: "Book the train" }, { wait: 2 }, { dump: "offline.json" },
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 60 } },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, { dump: "ai.json" },
  { waitGone: 180 }, { dump: "removed.json" },
  { waitFile: "go-quit.txt" }, { quit: true },
]);

const file = (d: { dir: string }, name: string) => `${d.dir}/tmp/${name}`;
const put = (d: { dir: string }, name: string, text = "go") => Deno.writeTextFile(file(d, name), text);
const read = async (d: { dir: string }, name: string) => { try { return await Deno.readTextFile(file(d, name)); } catch { return null; } };
async function waitFor(d: (typeof devices)[number], name: string, seconds: number): Promise<any> {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const t = await read(d, name);
    if (t !== null) { try { return name.endsWith(".json") ? JSON.parse(t) : t; } catch { /* still being written */ } }
    const log = await read(d, "collab-script.log");
    if (log?.includes("FAILED")) throw new Error(`${label(d)}: ${log.split("\n").find((l) => l.includes("FAILED"))}`);
    await sleep(1);
  }
  throw new Error(`${label(d)}: no ${name} after ${seconds} s`);
}

let ok = false;
try {
  for (const p of people) {
    const udid = await simctl("create", `pinto-collab-${run}-${p.name.toLowerCase()}`, "iPhone 17", runtime);
    devices.push({ udid, dir: "", person: p });
    await simctl("boot", udid);
  }
  for (const d of devices) {
    await simctl("bootstatus", d.udid, "-b");
    // A fresh simulator sometimes refuses the first install ("Failed to set icon resources promise").
    for (let i = 1; ; i++) {
      try { await simctl("install", d.udid, app); break; } catch (e) { if (i === 4) throw e; await sleep(5); }
    }
    d.dir = await simctl("get_app_container", d.udid, bundle, "data");
    await Deno.mkdir(`${d.dir}/tmp`, { recursive: true });
    await Deno.writeTextFile(file(d, "steps.json"), JSON.stringify(d.person.name === "Emil" ? emilSteps : saraSteps));
    await simctl("launch", d.udid, bundle, "-collabScript", file(d, "steps.json"));
  }
  const [emil, sara] = devices;

  // Share and join.
  const link = await waitFor(emil, "link.txt", 300);
  check("Emil shares the checklist with Can edit and copies its link", /\/s\/[^#]+#.+/.test(link), "a /s/<id>#<secret> link");
  await put(sara, "link.txt", link);
  const joined = await waitFor(sara, "joined.json", 180);
  check("Sara opens the link, joins, and has the note", joined.title === "Offsite plan" && joined.documentOpen === true && joined.text.includes("- [ ] Book the venue"),
    JSON.stringify({ title: joined.title, documentOpen: joined.documentOpen, editable: joined.editable }));

  // Both tick at once.
  await Promise.all([put(emil, "go-tick.txt"), put(sara, "go-tick.txt")]);
  const [t1, t2] = await Promise.all([waitFor(emil, "ticks.json", 150), waitFor(sara, "ticks.json", 150)]);
  check("both tick at once and each sees the other's tick, nothing moved", t1.text === t2.text && t1.text.includes("- [x] Book the venue\n- [ ] Pick dates\n- [x] Order lunch"),
    JSON.stringify(t1.text));

  // The server goes away while Sara types and ticks; then it's back.
  await shell(offline);
  await put(sara, "go-offline.txt");
  const off = await waitFor(sara, "offline.json", 120);
  check("with the server unreachable, Sara types an item and ticks it", off.text.includes("- [x] Book the train"), JSON.stringify(off.text));
  await sleep(10);
  await shell(online);
  await Promise.all([put(emil, "go-online.txt"), put(sara, "go-online.txt")]);
  const merged = await waitFor(emil, "merged.json", 300);
  check("when it's back, Sara's offline edits reach Emil and merge", merged.text.includes("- [x] Book the train") && merged.text.includes("- [x] Order lunch") && merged.text.split("Book the train").length === 2,
    JSON.stringify(merged.text));

  // Sara's AI edits the note through the stack's MCP function.
  const s = await signIn(people[1]);
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pub = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))));
  const got = await (await fetch(`${api}/functions/v1/key`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ op: "fetch", pub, platform: "web" }) })).json();
  check("Sara's account is a standard one: the server has a copy of the key her phone made", typeof got.sealed === "string", got.hint ?? "");
  const dk = (await openTransport(got.sealed, pair.privateKey, "down", people[1].id, got.key_id)).dataKey;
  const t = "pane_" + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const made = await fetch(`${api}/rest/v1/rpc/create_mcp_token`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ token_name: "Claude", write_access: true, token_hash: hash, dk_wrap: await wrap(dk, await tokenKey(t, "pane"), "pane", people[1].id) }) });
  await made.body?.cancel();
  let sid: string | null = null, n = 1;
  const ai = async (name: string, args: unknown) => {
    const res = await fetch(`${api}/functions/v1/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${t}`, ...(sid ? { "mcp-session-id": sid } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: n++, method: name === "initialize" ? "initialize" : "tools/call", params: name === "initialize" ? args : { name, arguments: args } }) });
    sid ??= res.headers.get("mcp-session-id");
    const b = await res.json();
    if (b.error || b.result?.isError) throw new Error(`${name}: ${JSON.stringify(b.error ?? b.result.content[0].text)}`);
    return b.result.structuredContent ?? b.result;
  };
  await ai("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude", version: "1" } });
  const found = await ai("list", { pattern: "**/*.md" });
  const path = found.matches.find((m: any) => m.shared)?.path;
  const read1 = await ai("fetch", { id: path });
  check("Sara's AI reads the shared note with both people's ticks", read1.text.includes("- [x] Book the venue") && read1.text.includes("- [x] Book the train"), path);
  const e = await ai("edit", { path, old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates: 3-4 November" });
  await Promise.all([put(emil, "go-ai.txt"), put(sara, "go-ai.txt")]);
  const [a1, a2] = await Promise.all([waitFor(emil, "ai.json", 180), waitFor(sara, "ai.json", 180)]);
  check("the AI's edit shows on both phones", e.checks === "ok" && a1.text === a2.text && a1.text.includes("- [x] Pick dates: 3-4 November"), JSON.stringify(a1.text));

  // Emil removes Sara.
  await put(emil, "go-remove.txt");
  const [r1, r2] = await Promise.all([waitFor(emil, "removed.json", 120), waitFor(sara, "removed.json", 240)]);
  check("Emil removes Sara: she's gone from his note, and the note from her phone",
    r1.people.length === 1 && r1.people[0].me && !r2.sharedNotes.includes("Offsite plan"), JSON.stringify({ emilSees: r1.people.map((p: any) => p.name), saraHas: r2.sharedNotes }));
  await Promise.all([put(emil, "go-quit.txt"), put(sara, "go-quit.txt")]);
  await sleep(2);
  ok = results.every((r) => r[1]);
} catch (e) {
  check("the run", false, String((e as Error).message));
  // What each phone showed when it stopped (the simulators are deleted next).
  for (const d of devices) {
    const shot = `/tmp/collab-sim-${run}-${d.person.name.toLowerCase()}.png`;
    if (await sh(["xcrun", "simctl", "io", d.udid, "screenshot", shot], true) !== null) console.log(`Screen: ${shot}`);
  }
} finally {
  for (const d of devices) {
    const log = d.dir ? await read(d, "collab-script.log") : null;
    if (log) console.log(`--- ${label(d)}'s steps\n${log.trim()}`);
  }
  await cleanup();
}
console.log(JSON.stringify(results.map(([name, passed]) => [name, passed])));
Deno.exit(ok ? 0 : 1);
