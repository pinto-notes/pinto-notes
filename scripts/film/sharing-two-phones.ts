// Raw footage for the sharing post (1.4): two iPhone simulators, side by side, editing one shared
// note against the LOCAL stack. Sara owns "Cabin weekend" and shares it, Leo joins by the link, then
// three beats are recorded on both phones at once:
//   1. Sara types "Leo: firewood and the speaker"; her caret and flag and the words land on Leo's.
//   2. Leo ticks "Board games" and types "I'll bring Catan" under her line; it lands on Sara's
//      with his flag. (Not in the ticked item: a ticked item is struck through.)
//   3. Sara's AI adds two lines through the stack's MCP function; both phones mark it (Leo's says
//      "Sara's Claude", Sara's own says "Claude").
// Then stills of Share on both phones, and Sara's again with Join by Link set to Can view.
//
//   FILM_OUT=<dir> deno run -A scripts/film/sharing-two-phones.ts "<Amber Notes Beta.app for the simulator>"
//
// A sibling of scripts/collab-two-simulators.ts (same approach, its default run untouched): the app
// plays its steps through its own code (Pane/Collab/CollabScript.swift), no input events are posted,
// the simulators are headless (no Simulator window). Everything it makes (two simulators, two
// accounts film-sharing-<run>-*@example.com, their allowlist rows) is deleted at the end, also when
// a step fails. Needs the stack's functions served with KEY_COPY=on and a KEY_COPY_SECRET_1, as the
// collab script does, so Sara's AI can be connected without her device.
//
// Options:
//   FILM_PACE=0.12          seconds a typed character, give or take a third
//   FILM_APPEARANCE=light   both phones
//   FILM_MAX_LOAD=20        before recording, wait (up to 10 min) for the 1-minute load average to drop under it
//   FILM_RECORD=0           no screen recording (a dry run of the steps and stills)
// Writes into FILM_OUT: sara.raw.mp4, leo.raw.mp4 (simctl recordVideo), <who>.started (epoch s of
// "Recording started"), moments.tsv (epoch s and name), <who>-steps.tsv (each logged step, timed
// when seen), the stills (sara-share.png, leo-share.png, sara-share-can-view.png), each phone's
// dumps, results.json.
import { tokenKey, wrap } from "../../supabase/functions/_shared/e2ee.ts";
import { openTransport } from "../../supabase/functions/_shared/keycopy.ts";

const app = Deno.args[0];
if (!app || !app.endsWith(".app")) throw new Error("Give the path to the simulator build of Amber Notes Beta.");
const out = Deno.env.get("FILM_OUT");
if (!out?.startsWith("/")) throw new Error("Set FILM_OUT to an absolute directory.");
await Deno.mkdir(out, { recursive: true });
const root = new URL("../..", import.meta.url).pathname;
const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env", "--workdir", root], stderr: "null" }).output()).stdout);
const env = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const api = env.API_URL, anon = env.ANON_KEY, service = env.SERVICE_ROLE_KEY;
if (!api || !/^http:\/\/127\.0\.0\.1:/.test(api)) throw new Error(`Not a local stack: ${api}. Run supabase start.`);
const bundle = "dev.emilwagman.pane.beta";
const run = crypto.randomUUID().slice(0, 6);
const admin = { apikey: service, authorization: `Bearer ${service}`, "content-type": "application/json" };
const PACE = Number(Deno.env.get("FILM_PACE") ?? 0.12);
const LOOK = Deno.env.get("FILM_APPEARANCE") ?? "light";
const MAX_LOAD = Number(Deno.env.get("FILM_MAX_LOAD") ?? 0);
const RECORD = Deno.env.get("FILM_RECORD") !== "0";

async function sh(cmd: string[], quiet = false): Promise<string> {
  const o = await new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: "piped", stderr: "piped" }).output();
  const text = new TextDecoder().decode(o.stdout).trim();
  if (!o.success && !quiet) throw new Error(`${cmd.slice(0, 3).join(" ")}: ${new TextDecoder().decode(o.stderr).trim().slice(0, 300)}`);
  return text;
}
const simctl = (...a: string[]) => sh(["xcrun", "simctl", ...a]);
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
const now = () => Date.now() / 1000;

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { results.push([name, ok, detail]); console.log(ok ? "PASS" : "FAIL", name, detail); };
const moments: string[] = [];
function moment(name: string, at = now()) {
  moments.push(`${at.toFixed(3)}\t${name}`);
  Deno.writeTextFileSync(`${out}/moments.tsv`, moments.join("\n") + "\n");
  console.log(`moment ${name}`);
}

// MARK: Accounts

type Person = { name: string; email: string; password: string; id: string };
const people: Person[] = [];
async function signIn(p: Person) {
  return await (await fetch(`${api}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email: p.email, password: p.password }) })).json();
}
/** Each person's colour (caret, flag, avatar) comes from their account id (CollabSession.color(for:)):
 *  its index in the palette A85A3C, 5E7A5A, 4F6B87, 7E5878, 3F7774, 7A6F3A. */
function colourIndex(id: string): number {
  let h = 7;
  for (const ch of id.toUpperCase()) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h % 6;
}
// Two different colours on screen: Sara blue and Leo plum by default (FILM_COLOURS=2,3).
const COLOURS = (Deno.env.get("FILM_COLOURS") ?? "2,3").split(",").map(Number);
for (const [n, name] of ["Sara", "Leo"].entries()) {
  const email = `film-sharing-${run}-${name.toLowerCase()}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
  await fetch(`${api}/rest/v1/signup_allowlist`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
  let id = "";
  for (let attempt = 1; attempt <= 60; attempt++) {
    const res = await fetch(`${api}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) });
    if (!res.ok) throw new Error(`Making ${name} failed: ${res.status}`);
    id = (await res.json()).id;
    if (colourIndex(id) === COLOURS[n]) break;
    // Not the colour wanted: the account goes and another is made (a new id).
    await fetch(`${api}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
    id = "";
  }
  if (!id) throw new Error(`No account for ${name} in colour ${COLOURS[n]}`);
  people.push({ name, email, password, id });
  await fetch(`${api}/rest/v1/email_unsubscribes`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: id, source: "link" }) }).then((r) => r.body?.cancel());
  const s = await signIn(people.at(-1)!);
  // The name on the cursor flag and in Share: just the first name.
  await fetch(`${api}/rest/v1/profiles`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ display_name: name }) }).then((r) => r.body?.cancel());
}
const [SARA, LEO] = people;

// MARK: The note and the steps

const NOTE = "Cabin weekend\n\n## Who brings what\n\n- [ ] Food\n- [ ] Firewood\n- [ ] Board games\n- [ ] Speaker\n";
const SARA_LINE = "Leo: firewood and the speaker";
const LEO_LINE = "I'll bring Catan";
const AI_LINES = ["Drive at 9 on Saturday, back Sunday by 5", "Keys are under the blue pot"];
type Step = Record<string, unknown>;
const start = (p: Person): Step[] => [{ signIn: { email: p.email, password: p.password } }, { skipIntro: 8 }, { waitReady: 180 }];
const saraSteps: Step[] = [
  ...start(SARA), { keyFetchHere: true },
  { create: NOTE }, { wait: 1 }, { access: "edit" }, { copyLink: "link.txt" },
  { waitPresence: { name: "Leo", timeout: 300, soft: true } }, { dump: "here.json" },
  // Beat 1: she types a line under the list (Return twice ends the list, as in Notes).
  // Then the keyboard away, as its button does, so the whole note shows.
  { waitFile: "go-b1.txt" }, { type: { text: "\n\n" + SARA_LINE, after: "Speaker", pace: PACE } }, { wait: 0.8 }, { endEditing: true }, { dump: "b1.json" },
  { waitFile: "go-b2.txt" }, { waitText: { text: LEO_LINE, timeout: 60 } }, { dump: "b2.json" },
  { waitFile: "go-b3.txt" }, { waitText: { text: AI_LINES[1], timeout: 120 } }, { wait: 1 }, { dump: "b3.json" },
  { waitFile: "go-share.txt" }, { showShare: true }, { wait: 2 }, { dump: "share.json" },
  { waitFile: "go-view.txt" }, { access: "view" }, { wait: 2 }, { dump: "view.json" },
  { waitFile: "go-quit.txt" }, { quit: true },
];
const leoSteps: Step[] = [
  ...start(LEO),
  { waitFile: "link.txt" }, { join: "link.txt" }, { waitPresence: { name: "Sara", timeout: 60, soft: true } }, { dump: "joined.json" },
  { waitFile: "go-b1.txt" }, { waitText: { text: SARA_LINE, timeout: 60 } }, { dump: "b1.json" },
  // Beat 2: he ticks Board games and says what he brings.
  { waitFile: "go-b2.txt" }, { tick: "Board games" }, { wait: 0.6 }, { type: { text: "\n" + LEO_LINE, after: SARA_LINE, pace: PACE } }, { wait: 0.8 }, { endEditing: true }, { dump: "b2.json" },
  { waitFile: "go-b3.txt" }, { waitText: { text: AI_LINES[1], timeout: 120 } }, { wait: 1 }, { dump: "b3.json" },
  { waitFile: "go-share.txt" }, { showShare: true }, { wait: 2 }, { dump: "share.json" },
  { waitFile: "go-quit.txt" }, { quit: true },
];

// MARK: Simulators

const runtime = JSON.parse(await simctl("list", "runtimes", "-j")).runtimes.filter((r: any) => r.isAvailable && r.platform === "iOS" && r.supportedDeviceTypes?.some((d: any) => d.name === "iPhone 17")).at(-1).identifier;
type Device = { udid: string; dir: string; person: Person; steps: Step[] };
const devices: Device[] = [];
const who = (d: Device) => d.person.name.toLowerCase();
const file = (d: Device, name: string) => `${d.dir}/tmp/${name}`;
const put = (d: Device, name: string, text = "go") => Deno.writeTextFile(file(d, name), text);
const read = async (d: Device, name: string) => { try { return await Deno.readTextFile(file(d, name)); } catch { return null; } };
async function waitFor(d: Device, name: string, seconds: number): Promise<any> {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const t = await read(d, name);
    if (t !== null) { try { return name.endsWith(".json") ? JSON.parse(t) : t; } catch { /* still being written */ } }
    const log = await read(d, "collab-script.log");
    if (log?.includes("FAILED")) throw new Error(`${d.person.name}: ${log.split("\n").find((l) => l.includes("FAILED"))}`);
    await sleep(0.2);
  }
  throw new Error(`${d.person.name}: no ${name} after ${seconds} s`);
}
/** The status bar at 9:41 on both, the appearance, no keyboard clicks or tips, US English. */
async function prepare(d: Device) {
  for (const args of [["com.apple.preferences.sounds", "keyboard", "-bool", "false"], ["com.apple.preferences.sounds", "lock-sound", "-bool", "false"],
    ["com.apple.keyboard.preferences", "DidShowContinuousPathIntroduction", "-bool", "true"], ["-g", "AppleLocale", "en_US"], ["-g", "AppleLanguages", "-array", "en-US"]]) {
    await sh(["xcrun", "simctl", "spawn", d.udid, "defaults", "write", ...args], true);
  }
  // A new simulator takes this Mac's region (24-hour: "09:41"); the status bar reads US English
  // ("9:41") only after a restart.
  await simctl("shutdown", d.udid);
  await simctl("boot", d.udid);
  await simctl("bootstatus", d.udid, "-b");
  await sh(["xcrun", "simctl", "ui", d.udid, "appearance", LOOK], true);
  await sh(["xcrun", "simctl", "status_bar", d.udid, "override", "--time", "9:41", "--batteryState", "discharging", "--batteryLevel", "100",
    "--cellularMode", "active", "--cellularBars", "4", "--wifiBars", "3", "--operatorName", ""], true);
}
/** Each step the app logs, timed when it shows up (every 0.1 s). */
const tails: ReturnType<typeof setInterval>[] = [];
function tail(d: Device) {
  let seen = 0;
  tails.push(setInterval(() => {
    let text: string;
    try { text = Deno.readTextFileSync(file(d, "collab-script.log")); } catch { return; }
    const lines = text.split("\n").filter(Boolean), t = now();
    for (const line of lines.slice(seen)) Deno.writeTextFileSync(`${out}/${who(d)}-steps.tsv`, `${t.toFixed(3)}\t${line}\n`, { append: true });
    seen = lines.length;
  }, 100));
}

// MARK: Recording

const recordings: { who: string; child: Deno.ChildProcess; done: Promise<unknown> }[] = [];
async function record(d: Device) {
  const bin = await sh(["xcrun", "-f", "simctl"]);
  for (let attempt = 1; attempt <= 5; attempt++) {
    const child = new Deno.Command(bin, { args: ["io", d.udid, "recordVideo", "--codec=h264", "--force", `${out}/${who(d)}.raw.mp4`], stdout: "piped", stderr: "piped" }).spawn();
    let started = 0, said = "";
    const watch = async (stream: ReadableStream<Uint8Array>) => {
      for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
        said += chunk;
        if (!started && said.includes("Recording started")) {
          started = now();
          Deno.writeTextFileSync(`${out}/${who(d)}.started`, started.toFixed(3));
        }
      }
    };
    const done = Promise.all([watch(child.stdout), watch(child.stderr)]).then(() => Deno.writeTextFileSync(`${out}/${who(d)}.recorder.log`, said, { append: true }));
    for (let i = 0; i < 150 && !started; i++) await sleep(0.1);
    if (started) { Deno.writeTextFileSync(`${out}/${who(d)}.pid`, String(child.pid)); recordings.push({ who: who(d), child, done }); return; }
    try { child.kill("SIGINT"); } catch { /* stopped by itself */ }
    await child.status; await done; await sleep(2);
  }
  throw new Error(`${d.person.name}'s screen recording didn't start`);
}
async function stopRecordings() {
  for (const r of recordings) { try { r.child.kill("SIGINT"); } catch { /* already stopped */ } }
  for (const r of recordings) { await r.child.status; await r.done; }
  recordings.length = 0;
}
async function screenshot(d: Device, name: string) {
  await sh(["xcrun", "simctl", "io", d.udid, "screenshot", "--type=png", `${out}/${name}`], true);
}
async function load1(): Promise<number> {
  return Number((await sh(["sysctl", "-n", "vm.loadavg"])).replace(/[{}]/g, "").trim().split(/\s+/)[0]);
}

async function cleanup() {
  for (const d of devices) {
    await sh(["xcrun", "simctl", "terminate", d.udid, bundle], true);
    await sh(["xcrun", "simctl", "shutdown", d.udid], true);
    await sh(["xcrun", "simctl", "delete", d.udid], true);
  }
  for (const p of people) {
    await fetch(`${api}/auth/v1/admin/users/${p.id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
    await fetch(`${api}/rest/v1/signup_allowlist?email=eq.${encodeURIComponent(p.email)}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
  }
  console.log(`Deleted ${devices.length} simulators and ${people.length} accounts (film-sharing-${run}).`);
}

let ok = false;
try {
  for (const p of people) {
    const udid = await simctl("create", `pinto-film-${run}-${p.name.toLowerCase()}`, "iPhone 17", runtime);
    devices.push({ udid, dir: "", person: p, steps: p === SARA ? saraSteps : leoSteps });
    await simctl("boot", udid);
  }
  for (const d of devices) {
    await simctl("bootstatus", d.udid, "-b");
    await prepare(d);
    for (let i = 1; ; i++) {
      try { await simctl("install", d.udid, app); break; } catch (e) { if (i === 4) throw e; await sleep(5); }
    }
    d.dir = await simctl("get_app_container", d.udid, bundle, "data");
    await Deno.mkdir(`${d.dir}/tmp`, { recursive: true });
    await Deno.writeTextFile(file(d, "steps.json"), JSON.stringify(d.steps));
    tail(d);
    await simctl("launch", d.udid, bundle, "-collabScript", file(d, "steps.json"));
  }
  const [sara, leo] = devices;

  // Share and join (not filmed).
  const link = await waitFor(sara, "link.txt", 300);
  await put(leo, "link.txt", link);
  const joined = await waitFor(leo, "joined.json", 180);
  check("Leo joins by the link and has the note", joined.title === "Cabin weekend" && joined.documentOpen === true, JSON.stringify({ title: joined.title, here: joined.here }));
  const here = await waitFor(sara, "here.json", 120);
  check("each phone names the other", (here.here ?? []).some((p: any) => p.name === "Leo") && (joined.here ?? []).some((p: any) => p.name === "Sara"),
    JSON.stringify({ saraSees: here.here, leoSees: joined.here }));

  // Sara's AI, connected before filming: her key copy, a token, and the shared note's path.
  const s = await signIn(SARA);
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pub = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))));
  const got = await (await fetch(`${api}/functions/v1/key`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ op: "fetch", pub, platform: "web" }) })).json();
  if (typeof got.sealed !== "string") throw new Error(`No key copy for Sara: ${got.hint ?? got.error ?? "?"}. Are the functions served with KEY_COPY=on?`);
  const dk = (await openTransport(got.sealed, pair.privateKey, "down", SARA.id, got.key_id)).dataKey;
  const t = "pane_" + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await fetch(`${api}/rest/v1/rpc/create_mcp_token`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ token_name: "Claude", write_access: true, token_hash: hash, dk_wrap: await wrap(dk, await tokenKey(t, "pane"), "pane", SARA.id) }) }).then((r) => r.body?.cancel());
  let sid: string | null = null, n = 1;
  const ai = async (name: string, args: unknown) => {
    const res = await fetch(`${api}/functions/v1/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${t}`, ...(sid ? { "mcp-session-id": sid } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: n++, method: name === "initialize" ? "initialize" : "tools/call", params: name === "initialize" ? args : { name, arguments: args } }) });
    sid ??= res.headers.get("mcp-session-id");
    const raw = await res.text();
    let b: any;
    try { b = JSON.parse(raw); } catch { throw new Error(`${name}: ${res.status} ${raw.slice(0, 200)}`); }
    if (!b.result) throw new Error(`${name}: ${res.status} ${raw.slice(0, 200)}`);
    if (b.error || b.result?.isError) throw new Error(`${name}: ${JSON.stringify(b.error ?? b.result.content[0].text)}`);
    return b.result.structuredContent ?? b.result;
  };
  await ai("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude", version: "1" } });
  const path = (await ai("list", { pattern: "**/*.md" }).catch(async () => { await sleep(3); return await ai("list", { pattern: "**/*.md" }); })).matches.find((m: any) => m.shared)?.path;
  if (!path) throw new Error("Sara's AI doesn't see the shared note");

  // A quiet moment before filming: let the note settle, and the Mac if asked.
  await sleep(4);
  if (MAX_LOAD > 0) {
    for (let i = 0; i < 120 && (await load1()) >= MAX_LOAD; i++) await sleep(5);
  }
  moment(`load ${await load1()}`);
  if (RECORD) await Promise.all(devices.map(record));
  await sleep(2.5);

  // Beat 1: Sara types; Leo sees her flag and words as she types.
  moment("b1-go");
  await Promise.all([put(sara, "go-b1.txt"), put(leo, "go-b1.txt")]);
  const [s1, l1] = await Promise.all([waitFor(sara, "b1.json", 120), waitFor(leo, "b1.json", 120)]);
  moment("b1-done");
  check("beat 1: Sara's line on both phones", s1.text.includes(SARA_LINE) && l1.text.includes(SARA_LINE), JSON.stringify(l1.text));
  await sleep(1.5);

  // Beat 2: Leo ticks Board games and types; Sara sees it with his flag.
  moment("b2-go");
  await Promise.all([put(sara, "go-b2.txt"), put(leo, "go-b2.txt")]);
  const [s2, l2] = await Promise.all([waitFor(sara, "b2.json", 120), waitFor(leo, "b2.json", 120)]);
  moment("b2-done");
  check("beat 2: Leo's tick and words on both phones", [s2.text, l2.text].every((t) => t.includes("- [x] Board games\n") && t.includes(SARA_LINE + "\n" + LEO_LINE)), JSON.stringify(s2.text));
  await sleep(1.5);

  // Beat 3: Sara's AI adds two lines.
  // Reads can time out on a busy Mac: try again.
  const again = async (name: string, args: unknown) => { for (let i = 1; ; i++) { try { return await ai(name, args); } catch (e) { if (i === 4) throw e; console.log(String(e)); await sleep(3); } } };
  const body = ((await again("fetch", { id: path })).text as string).replace(/^\s*\d+\t/gm, "");
  if (!body.includes(LEO_LINE)) throw new Error(`Sara's AI doesn't see Leo's line yet: ${JSON.stringify(body)}`);
  moment("b3-go");
  // An edit that failed on a busy Mac may still have landed: look before trying again.
  let e: any;
  for (let i = 1; ; i++) {
    try { e = await ai("edit", { path, old_string: LEO_LINE, new_string: [LEO_LINE, ...AI_LINES].join("\n") }); break; } catch (err) {
      if (i === 6) throw err;
      console.log(String(err));
      await sleep(3);
      const now = ((await again("fetch", { id: path })).text as string);
      if (now.includes(AI_LINES[0])) { e = { checks: "ok" }; break; }
    }
  }
  moment("b3-edited");
  await Promise.all([put(sara, "go-b3.txt"), put(leo, "go-b3.txt")]);
  const [s3, l3] = await Promise.all([waitFor(sara, "b3.json", 180), waitFor(leo, "b3.json", 180)]);
  moment("b3-done");
  check("beat 3: the AI's lines on both phones", e.checks === "ok" && AI_LINES.every((l) => s3.text.includes(l) && l3.text.includes(l)), JSON.stringify(l3.text));
  check("beat 3: marked as Sara's Claude on Leo's phone, Claude on Sara's", l3.ai?.says === "Sara's Claude" && s3.ai?.says === "Claude", JSON.stringify({ leo: l3.ai, sara: s3.ai }));
  await sleep(4);
  moment("film-end");
  if (RECORD) await stopRecordings();

  // Stills: Share on both phones, then Sara's with Join by Link at Can view.
  await Promise.all([put(sara, "go-share.txt"), put(leo, "go-share.txt")]);
  const [sh1, sh2] = await Promise.all([waitFor(sara, "share.json", 60), waitFor(leo, "share.json", 60)]);
  await sleep(1);
  await Promise.all([screenshot(sara, "sara-share.png"), screenshot(leo, "leo-share.png")]);
  check("Share lists Sara and Leo", JSON.stringify(sh1.people) .includes("Leo") && JSON.stringify(sh2.people).includes("Sara"), JSON.stringify({ sara: sh1.people, leo: sh2.people, access: sh1.access }));
  await put(sara, "go-view.txt");
  const v = await waitFor(sara, "view.json", 60);
  await sleep(1);
  await screenshot(sara, "sara-share-can-view.png");
  check("Join by Link at Can view, Leo still Can edit", v.access === "Can view" && v.people.some((p: any) => p.name === "Leo" && p.role === "editor"), JSON.stringify({ access: v.access, people: v.people }));
  ok = results.every((r) => r[1]);
} catch (err) {
  check("the run", false, String((err as Error).message));
  for (const d of devices) await screenshot(d, `failed-${who(d)}.png`);
} finally {
  if (RECORD) await stopRecordings();
  tails.forEach(clearInterval);
  for (const d of devices.filter((d) => d.dir)) {
    const log = await read(d, "collab-script.log");
    if (log) console.log(`--- ${d.person.name}'s steps\n${log.trim()}`);
    for await (const f of Deno.readDir(`${d.dir}/tmp`)) {
      // Not link.txt: it carries the note's secret.
      if (f.isFile && /\.(json|log)$/.test(f.name) && f.name !== "steps.json") await Deno.copyFile(file(d, f.name), `${out}/${who(d)}-${f.name}`);
    }
  }
  await Deno.writeTextFile(`${out}/results.json`, JSON.stringify(results, null, 1));
  for (const d of devices) await put(d, "go-quit.txt").catch(() => {});
  await sleep(1);
  await cleanup();
}
console.log(JSON.stringify(results.map(([name, passed]) => [name, passed])));
Deno.exit(ok ? 0 : 1);
