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
//
// For videos of the run (the persona council's captures), all optional; unset, the run is the check above:
//   COLLAB_RECORD=<dir>            records both screens into <dir> (simctl recordVideo, from boot until the
//                                  last step; each stopped with SIGINT on its own PID before its simulator
//                                  goes): emil.raw.mp4, sara.raw.mp4, when each recording started
//                                  (<who>.started, epoch s), every step as the app logged it, timed to a
//                                  tenth of a second (<who>-steps.tsv), and the moments (moments.tsv). The
//                                  status bar says 9:41, keyboard clicks are off, the keyboard's first-run tip
//                                  is skipped, and the phones speak US English.
//   COLLAB_HOLD=<s>                holds each moment on screen this long, opens Share while Emil shares and
//                                  removes Sara (as its button does), and shows Sara the link's question
//                                  before she joins.
//   COLLAB_APPEARANCE=light,dark   Emil's phone, then Sara's.
//   COLLAB_PRIVATE_AI=1            at the end, Sara types a line in a note of her own (not shared), then
//                                  her AI reads that note and edits it while it's open on her phone.
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
const recordDir = Deno.env.get("COLLAB_RECORD");
const HOLD = Number(Deno.env.get("COLLAB_HOLD") ?? 0);
const looks = (Deno.env.get("COLLAB_APPEARANCE") ?? "").split(",").map((s) => s.trim());
const privateAI = Deno.env.get("COLLAB_PRIVATE_AI") === "1";
if (recordDir) await Deno.mkdir(recordDir, { recursive: true });

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

// MARK: Recording (COLLAB_RECORD)

const moments: string[] = [];
/** A moment of the run, for the video's labels: its time (epoch s) and name. */
function moment(name: string, at = Date.now() / 1000) {
  if (!recordDir) return;
  moments.push(`${at.toFixed(3)}\t${name}`);
  Deno.writeTextFileSync(`${recordDir}/moments.tsv`, moments.join("\n") + "\n");
}
/** The status bar at 9:41, the appearance, no keyboard clicks and no keyboard tip, US English. */
async function prepare(d: (typeof devices)[number], look: string | undefined) {
  if (look === "light" || look === "dark") await sh(["xcrun", "simctl", "ui", d.udid, "appearance", look], true);
  if (!recordDir) return;
  await sh(["xcrun", "simctl", "status_bar", d.udid, "override", "--time", "9:41", "--batteryState", "discharging", "--batteryLevel", "100",
    "--cellularMode", "active", "--cellularBars", "4", "--wifiBars", "3", "--operatorName", ""], true);
  for (const args of [["com.apple.preferences.sounds", "keyboard", "-bool", "false"], ["com.apple.keyboard.preferences", "DidShowContinuousPathIntroduction", "-bool", "true"],
    ["-g", "AppleLocale", "en_US"], ["-g", "AppleLanguages", "-array", "en-US"]]) {
    await sh(["xcrun", "simctl", "spawn", d.udid, "defaults", "write", ...args], true);
  }
}
const recordings: { who: string; child: Deno.ChildProcess; done: Promise<unknown> }[] = [];
/** Records the phone's screen until stopRecordings. simctl's first frame is the moment it says
 *  "Recording started", and its frames' times run from there, so that line's time places the video. */
async function record(d: (typeof devices)[number]) {
  const who = d.person.name.toLowerCase();
  const bin = await sh(["xcrun", "-f", "simctl"]);
  for (let attempt = 1; attempt <= 5; attempt++) {
    // An absolute path: with a relative one, simctl can't start the recorder.
    const child = new Deno.Command(bin, { args: ["io", d.udid, "recordVideo", "--codec=h264", "--force", `${recordDir}/${who}.raw.mp4`], stdout: "piped", stderr: "piped" }).spawn();
    let started = 0, said = "";
    const watch = async (stream: ReadableStream<Uint8Array>) => {
      for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
        said += chunk;
        if (!started && said.includes("Recording started")) {
          started = Date.now() / 1000;
          Deno.writeTextFileSync(`${recordDir}/${who}.started`, started.toFixed(3));
        }
      }
    };
    const done = Promise.all([watch(child.stdout), watch(child.stderr)]).then(() => Deno.writeTextFileSync(`${recordDir}/${who}.recorder.log`, said, { append: true }));
    for (let i = 0; i < 150 && !started; i++) await sleep(0.1);
    if (started) {
      Deno.writeTextFileSync(`${recordDir}/${who}.pid`, String(child.pid));
      recordings.push({ who, child, done });
      return;
    }
    try { child.kill("SIGINT"); } catch { /* it stopped by itself */ }
    await child.status;
    await done;
    await sleep(2);
  }
  throw new Error(`${d.person.name}'s screen recording didn't start`);
}
/** SIGINT to each recorder's own PID: simctl writes the file and exits. */
async function stopRecordings() {
  for (const r of recordings) { try { r.child.kill("SIGINT"); } catch { /* already stopped */ } }
  for (const r of recordings) { await r.child.status; await r.done; }
  recordings.length = 0;
}
/** Each step the app logs, timed when it shows up (every 0.1 s): its moment, if it has one. */
const tails: ReturnType<typeof setInterval>[] = [];
function tail(d: (typeof devices)[number]) {
  if (!recordDir) return;
  const who = d.person.name.toLowerCase(), names = labels.get(d.person.name)!;
  let seen = 0;
  tails.push(setInterval(() => {
    let text: string;
    try { text = Deno.readTextFileSync(file(d, "collab-script.log")); } catch { return; }
    const lines = text.split("\n").filter(Boolean), now = Date.now() / 1000;
    for (const line of lines.slice(seen)) {
      Deno.writeTextFileSync(`${recordDir}/${who}-steps.tsv`, `${now.toFixed(3)}\t${line}\n`, { append: true });
      const n = line.match(/^\S+ (\d+) \S+ ok$/)?.[1];
      const name = n ? names.get(Number(n)) : undefined;
      if (name) moment(name, now);
    }
    seen = lines.length;
  }, 100));
}

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
// Sara's own note for COLLAB_PRIVATE_AI, and her AI's edit to it: new dates, a sentence out, three tasks in.
const trip = "Lisbon weekend\n\nFlights 14 to 16 May. We stay near Alfama.\n\nSara wants a slow first morning, no plans before eleven.\n\n- [ ] Book the hotel\n- [ ] Tram 28 tickets\n";
const tripOld = "Flights 14 to 16 May. We stay near Alfama.\n\nSara wants a slow first morning, no plans before eleven.\n\n- [ ] Book the hotel\n- [ ] Tram 28 tickets";
const tripNew = "Flights 21 to 23 May. We stay near Alfama.\n\n- [ ] Book the hotel\n- [ ] Tram 28 tickets\n- [ ] Tickets for Belém Tower on Saturday\n- [ ] Table at Cervejaria Ramiro\n- [ ] Airport bus times";
type Step = Record<string, unknown>;
// `mark(name)` names the moment the step before it ends, for the video (COLLAB_RECORD); it isn't a step.
const mark = (name: string): Step => ({ _mark: name });
const hold = (): Step[] => (HOLD > 0 ? [{ wait: HOLD }] : []);
const show = HOLD > 0;
const labels = new Map<string, Map<number, string>>();
const steps = (p: Person, rest: Step[]) => {
  const out: Step[] = [], names = new Map<number, string>();
  for (const s of [{ signIn: { email: p.email, password: p.password } }, { skipIntro: 8 }, { waitReady: 180 }, ...rest] as Step[]) {
    if (typeof s._mark === "string") names.set(out.length, s._mark);
    else out.push(s);
  }
  labels.set(p.name, names);
  return out;
};
const emilSteps = steps(people[0], [
  { create: list }, mark("emil-note"), ...hold(),
  ...(show ? [{ showShare: true }, mark("emil-share-open"), ...hold()] : []),
  { access: "edit" }, mark("emil-link-can-edit"), ...hold(), { copyLink: "link.txt" }, mark("emil-link-copied"), ...hold(),
  ...(show ? [{ closeShare: true }] : []),
  { waitFile: "go-tick.txt" }, { tick: "Book the venue" }, mark("emil-ticked"), { waitText: { text: "- [x] Order lunch", timeout: 90 } }, mark("emil-sees-sara-tick"), ...hold(), { dump: "ticks.json" },
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 240 } }, mark("emil-sees-sara-offline-edits"), ...hold(), { dump: "merged.json" },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, mark("emil-sees-ai-edit"), ...hold(), { dump: "ai.json" },
  { waitFile: "go-remove.txt" }, ...(show ? [{ showShare: true }, mark("emil-share-people"), ...hold()] : []),
  { remove: "Sara" }, mark("emil-removed-sara"), { wait: 2 }, ...hold(), { dump: "removed.json" }, ...(show ? [{ closeShare: true }] : []),
  { waitFile: "go-quit.txt" }, { quit: true },
]);
const saraSteps = steps(people[1], [
  { waitFile: "link.txt" },
  ...(show
    ? [{ openLink: { file: "link.txt", question: "join-question.json" } }, mark("sara-join-question"), ...hold(), { answerJoin: "join" }]
    : [{ join: "link.txt" }]),
  mark("sara-joined"), ...hold(), { dump: "joined.json" },
  { waitFile: "go-tick.txt" }, { tick: "Order lunch" }, mark("sara-ticked"), { waitText: { text: "- [x] Book the venue", timeout: 90 } }, mark("sara-sees-emil-tick"), ...hold(), { dump: "ticks.json" },
  { waitFile: "go-offline.txt" }, { type: { text: "\nBook the train", after: "Print agenda" } }, mark("sara-typed-offline"), { tick: "Book the train" }, mark("sara-ticked-offline"), { wait: 2 }, { dump: "offline.json" },
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 60 } },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, mark("sara-sees-ai-edit"), ...hold(), { dump: "ai.json" },
  { waitGone: 180 }, mark("sara-note-gone"), ...hold(), { dump: "removed.json" },
  ...(privateAI
    ? [{ create: trip }, mark("sara-own-note"), ...hold(), { type: { text: "\nBudget 400 euros", after: "Tram 28 tickets" } }, mark("sara-typed-budget"), { wait: 1 }, { dump: "typed.json" },
      { waitFile: "go-private.txt" }, { waitText: { text: "21 to 23 May", timeout: 120 } }, mark("sara-sees-own-ai-edit"), { wait: Math.max(5, HOLD + 2) }, { dump: "private.json" }]
    : []),
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
  for (const [i, d] of devices.entries()) {
    await simctl("bootstatus", d.udid, "-b");
    await prepare(d, looks[i]);
    if (recordDir) await record(d);
    // A fresh simulator sometimes refuses the first install ("Failed to set icon resources promise").
    for (let i = 1; ; i++) {
      try { await simctl("install", d.udid, app); break; } catch (e) { if (i === 4) throw e; await sleep(5); }
    }
    d.dir = await simctl("get_app_container", d.udid, bundle, "data");
    await Deno.mkdir(`${d.dir}/tmp`, { recursive: true });
    await Deno.writeTextFile(file(d, "steps.json"), JSON.stringify(d.person.name === "Emil" ? emilSteps : saraSteps));
    tail(d);
    await simctl("launch", d.udid, bundle, "-collabScript", file(d, "steps.json"));
    moment(`${d.person.name.toLowerCase()}-launched`);
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
  moment("offline");
  await put(sara, "go-offline.txt");
  const off = await waitFor(sara, "offline.json", 120);
  check("with the server unreachable, Sara types an item and ticks it", off.text.includes("- [x] Book the train"), JSON.stringify(off.text));
  await sleep(10);
  await shell(online);
  moment("online");
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
  moment("ai-edit");
  await Promise.all([put(emil, "go-ai.txt"), put(sara, "go-ai.txt")]);
  const [a1, a2] = await Promise.all([waitFor(emil, "ai.json", 180), waitFor(sara, "ai.json", 180)]);
  check("the AI's edit shows on both phones", e.checks === "ok" && a1.text === a2.text && a1.text.includes("- [x] Pick dates: 3-4 November"), JSON.stringify(a1.text));

  // Emil removes Sara.
  await put(emil, "go-remove.txt");
  const [r1, r2] = await Promise.all([waitFor(emil, "removed.json", 120), waitFor(sara, "removed.json", 240)]);
  check("Emil removes Sara: she's gone from his note, and the note from her phone",
    r1.people.length === 1 && r1.people[0].me && !r2.sharedNotes.includes("Offsite plan"), JSON.stringify({ emilSees: r1.people.map((p: any) => p.name), saraHas: r2.sharedNotes }));

  // COLLAB_PRIVATE_AI: Sara types a line in a note of her own, her AI reads it there and edits the note
  // while it's open on her phone: the edit arrives by sync, as an AI's edit from anywhere would.
  if (privateAI) {
    await waitFor(sara, "typed.json", 180);
    let own: string | undefined, before = "";
    for (let i = 0; i < 90 && !before.includes("Budget 400 euros"); i++) {
      own ??= (await ai("list", { pattern: "**/*.md" })).matches.find((m: any) => !m.shared && /Lisbon weekend/.test(m.path))?.path;
      if (own) before = (await ai("fetch", { id: own })).text ?? "";
      if (!before.includes("Budget 400 euros")) await sleep(1);
    }
    check("Sara's AI reads her own note, with the line she typed on her phone a moment before", before.includes("Budget 400 euros"), own ?? "no such note");
    const e2 = await ai("edit", { path: own, old_string: tripOld, new_string: tripNew });
    moment("private-ai-edit");
    await put(sara, "go-private.txt");
    const mine = await waitFor(sara, "private.json", 180);
    check("her AI's edit arrives on her phone, and the line she typed stays", e2.checks === "ok" && mine.text.includes("Flights 21 to 23 May") && mine.text.includes("Budget 400 euros") && !mine.text.includes("slow first morning"),
      JSON.stringify(mine.text));
  }
  await Promise.all([put(emil, "go-quit.txt"), put(sara, "go-quit.txt")]);
  await sleep(2);
  ok = results.every((r) => r[1]);
} catch (e) {
  check("the run", false, String((e as Error).message));
  // What each phone showed when it stopped (the simulators are deleted next).
  for (const d of devices) {
    const shot = `${recordDir ?? "/tmp"}/collab-sim-${run}-${d.person.name.toLowerCase()}.png`;
    if (await sh(["xcrun", "simctl", "io", d.udid, "screenshot", shot], true) !== null) console.log(`Screen: ${shot}`);
  }
} finally {
  for (const d of devices) {
    const log = d.dir ? await read(d, "collab-script.log") : null;
    if (log) console.log(`--- ${label(d)}'s steps\n${log.trim()}`);
  }
  if (recordDir) {
    moment("end");
    await sleep(1);
    tails.forEach(clearInterval);
    await stopRecordings();
    // What each phone wrote (not the link: it carries the note's secret), and the checks.
    for (const d of devices.filter((d) => d.dir)) {
      for await (const f of Deno.readDir(`${d.dir}/tmp`)) {
        if (f.isFile && /\.(json|log)$/.test(f.name) && f.name !== "steps.json") await Deno.copyFile(file(d, f.name), `${recordDir}/${d.person.name.toLowerCase()}-${f.name}`);
      }
      await Deno.writeTextFile(`${recordDir}/${d.person.name.toLowerCase()}-steps.json`, JSON.stringify(d.person.name === "Emil" ? emilSteps : saraSteps, null, 1));
    }
    await Deno.writeTextFile(`${recordDir}/results.json`, JSON.stringify(results, null, 1));
  }
  await cleanup();
}
console.log(JSON.stringify(results.map(([name, passed]) => [name, passed])));
Deno.exit(ok ? 0 : 1);
