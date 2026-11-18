// Raw footage for the sharing post (1.4): the Mac app shows Sara's AI editing a note shared with Leo.
// Same note as scripts/film/sharing-two-phones.ts, in its state after beats 1 and 2 ("Cabin weekend",
// Board games ticked, Sara's and Leo's lines). Sara owns it on a headless iPhone simulator here and
// shares it; Leo joins by the link in the Mac app on another Mac (a fleet machine with a real
// screen), and that Mac's screen is recorded while Sara's AI adds two lines through the stack's MCP
// function. The Mac names it "Sara's Claude" in the notice over the note.
//
//   FILM_OUT=<dir> FILM_MAC_APP=/Users/<them>/macfilm/Pane.app FILM_AIRRUN=<airrun for that Mac> \
//     deno run -A scripts/film/sharing-mac-ai.ts "<Amber Notes Beta.app for the simulator>"
//
// Run it inside `fleet run <mac> --need screen --here`, so the screen is yours.
//
// The Mac app is a Debug build with a Beta copy's id of its own (FILM_MAC_BUNDLE, default
// dev.emilwagman.pane.beta.macfilm), so CollabScript plays its steps, launched with PANE_DEV_RUN=1 so
// its library is "Pane-devrun" (AppIdentity.dataFolder): an id under dev.emilwagman.pane. would
// otherwise open "Pane", an installed Pinto Notes' library on that Mac. The run stops if a
// Pane-devrun folder is there already. It reaches the hub's stack through a reverse tunnel this run
// opens (127.0.0.1:56421 on the Mac) and closes. No input events are posted: the steps play in the
// app's own code; the pointer is moved off the window before recording.
//
// Recording: FILM_AIRRUN runs bash in the Mac's screen runner (Ghostty, with Screen Recording); the
// recorder is screcord3 (ScreenCaptureKit, a display region, so no "being shared" pill), at
// FILM_MAC_RECORDER, of the app window's frame, at 60 fps.
//
// Everything it makes (the simulator, two accounts film-macai-<run>-*@example.com and their rows, the
// tunnel, the Mac app's library, settings and Keychain items) is deleted or stopped at the end, also
// when a step fails. Needs the stack's functions served with KEY_COPY=on and a KEY_COPY_SECRET_1.
//
// Writes into FILM_OUT: mac.mov (the recording), mac-rec.log, moments.tsv (hub epoch s), mac-pre.png
// (the screen before recording), the dumps from both devices, results.json.
import { tokenKey, wrap } from "../../supabase/functions/_shared/e2ee.ts";
import { openTransport } from "../../supabase/functions/_shared/keycopy.ts";

const app = Deno.args[0];
if (!app || !app.endsWith(".app")) throw new Error("Give the path to the simulator build of Amber Notes Beta.");
const out = Deno.env.get("FILM_OUT");
if (!out?.startsWith("/")) throw new Error("Set FILM_OUT to an absolute directory.");
await Deno.mkdir(out, { recursive: true });
const HOST = Deno.env.get("FILM_MAC_HOST") ?? "fleet-air2";
const MAC_APP = Deno.env.get("FILM_MAC_APP") ?? "";
const MAC_BUNDLE = Deno.env.get("FILM_MAC_BUNDLE") ?? "dev.emilwagman.pane.beta.macfilm";
const AIRRUN = Deno.env.get("FILM_AIRRUN") ?? "";
const RECORDER = Deno.env.get("FILM_MAC_RECORDER") ?? "~/linuxrig/screcord3";
// The notes window's frame (AppKit, bottom-left origin) as a launch argument: argument domain, nothing
// saved. Quoted, or the argument domain reads {{…}} as a plist dictionary and drops it. 1400x900 centred on a 1710x1112 pt screen below its menu bar (1.4's own default is 1200x780).
const FRAME = Deno.env.get("FILM_MAC_FRAME") ?? "{{155, 87}, {1400, 900}}";
const LEAD = Number(Deno.env.get("FILM_LEAD") ?? 3);
const TAIL = Number(Deno.env.get("FILM_TAIL") ?? 10);
if (!MAC_APP.startsWith("/") || MAC_APP.includes(" ")) throw new Error("Set FILM_MAC_APP to the app's absolute path on the Mac, without spaces.");
if (!AIRRUN) throw new Error("Set FILM_AIRRUN to the command that runs bash in the Mac's screen runner.");
if (!MAC_BUNDLE.startsWith("dev.emilwagman.pane.beta.")) throw new Error("The Mac build needs a Beta copy's id (dev.emilwagman.pane.beta.<name>) for CollabScript.");
const root = new URL("../..", import.meta.url).pathname;
const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env", "--workdir", root], stderr: "null" }).output()).stdout);
const env = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const api = env.API_URL, anon = env.ANON_KEY, service = env.SERVICE_ROLE_KEY;
if (!api || !/^http:\/\/127\.0\.0\.1:/.test(api)) throw new Error(`Not a local stack: ${api}. Run supabase start.`);
const port = new URL(api).port;
const bundle = "dev.emilwagman.pane.beta";
const run = crypto.randomUUID().slice(0, 6);
const admin = { apikey: service, authorization: `Bearer ${service}`, "content-type": "application/json" };

async function sh(cmd: string[], quiet = false, input?: string): Promise<string> {
  const c = new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: "piped", stderr: "piped", stdin: input === undefined ? "null" : "piped" }).spawn();
  if (input !== undefined) { const w = c.stdin.getWriter(); await w.write(new TextEncoder().encode(input)); await w.close(); }
  const o = await c.output();
  const text = new TextDecoder().decode(o.stdout).trim();
  if (!o.success && !quiet) throw new Error(`${cmd.slice(0, 3).join(" ")}: ${new TextDecoder().decode(o.stderr).trim().slice(0, 300)} ${text.slice(0, 300)}`);
  return text;
}
const simctl = (...a: string[]) => sh(["xcrun", "simctl", ...a]);
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
const now = () => Date.now() / 1000;
/** A command on the Mac over ssh (no screen rights there). */
const mac = (cmd: string, quiet = false, input?: string) => sh(["ssh", HOST, cmd], quiet, input);
/** Bash in the Mac's screen runner (screen recording, the pointer, window frames). */
const runner = (cmd: string) => sh([AIRRUN, cmd]);

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { results.push([name, ok, detail]); console.log(ok ? "PASS" : "FAIL", name, detail); };
const moments: string[] = [];
function moment(name: string, at = now()) {
  moments.push(`${at.toFixed(3)}\t${name}`);
  Deno.writeTextFileSync(`${out}/moments.tsv`, moments.join("\n") + "\n");
  console.log(`moment ${name}`);
}

// MARK: Accounts (as sharing-two-phones.ts: Sara blue, Leo plum)

type Person = { name: string; email: string; password: string; id: string };
const people: Person[] = [];
async function signIn(p: Person) {
  return await (await fetch(`${api}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email: p.email, password: p.password }) })).json();
}
function colourIndex(id: string): number {
  let h = 7;
  for (const ch of id.toUpperCase()) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h % 6;
}
const COLOURS = [2, 3];

// MARK: The note and the steps

const NOTE = "Cabin weekend\n\n## Who brings what\n\n- [ ] Food\n- [ ] Firewood\n- [x] Board games\n- [ ] Speaker\n\nLeo: firewood and the speaker\nI'll bring Catan\n";
const LEO_LINE = "I'll bring Catan";
const AI_LINES = ["Drive at 9 on Saturday, back Sunday by 5", "Keys are under the blue pot"];
type Step = Record<string, unknown>;
const start = (p: Person): Step[] => [{ signIn: { email: p.email, password: p.password } }, { skipIntro: 8 }, { waitReady: 180 }];

// MARK: Sara's simulator

const runtime = JSON.parse(await simctl("list", "runtimes", "-j")).runtimes.filter((r: any) => r.isAvailable && r.platform === "iOS" && r.supportedDeviceTypes?.some((d: any) => d.name === "iPhone 17")).at(-1).identifier;
let udid = "", simDir = "";
const simFile = (name: string) => `${simDir}/tmp/${name}`;
const simPut = (name: string, text = "go") => Deno.writeTextFile(simFile(name), text);
const simRead = async (name: string) => { try { return await Deno.readTextFile(simFile(name)); } catch { return null; } };
async function simWait(name: string, seconds: number): Promise<any> {
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const t = await simRead(name);
    if (t !== null) { try { return name.endsWith(".json") ? JSON.parse(t) : t; } catch { /* still being written */ } }
    const log = await simRead("collab-script.log");
    if (log?.includes("FAILED")) throw new Error(`Sara: ${log.split("\n").find((l) => l.includes("FAILED"))}`);
    await sleep(0.2);
  }
  throw new Error(`Sara: no ${name} after ${seconds} s`);
}

// MARK: Leo's Mac

let macTmp = "", macPid = "", tunnel: Deno.ChildProcess | null = null, recPid = "", libraryMade = false;
const macFile = (name: string) => `${macTmp}${name}`;
const macPut = (name: string, text = "go") => mac(`cat > '${macFile(name)}'`, false, text);
/** Waits on the Mac itself (one ssh call), and stops early when a step failed. */
async function macWait(name: string, seconds: number): Promise<any> {
  const t = await mac(`f='${macFile(name)}'; l='${macFile("collab-script.log")}'; for i in $(seq ${Math.ceil(seconds * 5)}); do
    if [ -f "$f" ]; then sleep 0.2; cat "$f"; exit 0; fi
    if grep -q FAILED "$l" 2>/dev/null; then echo "FAILED: $(grep FAILED "$l" | head -1)"; exit 0; fi
    sleep 0.2; done; echo "TIMEOUT"`);
  if (t.startsWith("FAILED") || t === "TIMEOUT") throw new Error(`Leo's Mac: ${t === "TIMEOUT" ? `no ${name} after ${seconds} s` : t}`);
  return name.endsWith(".json") ? JSON.parse(t) : t;
}
const MAC_FILES = ["collab-script.log", "link.txt", "joined.json", "go-b3.txt", "b3.json", "go-quit.txt", "macfilm-steps.json"];

async function cleanup() {
  // Leo's Mac: the app quits by its own step, else by its PID; then its library, settings, Keychain items.
  if (macTmp) {
    await macPut("go-quit.txt").catch(() => {});
    if (macPid) {
      await mac(`for i in $(seq 25); do kill -0 ${macPid} 2>/dev/null || exit 0; sleep 0.2; done; ps -o args= -p ${macPid} | grep -q '${MAC_APP}/Contents/MacOS/' && kill ${macPid}; sleep 1`, true);
    }
    if (recPid) await runner(`kill -INT ${recPid} 2>/dev/null; true`).catch(() => {});
    const log = await mac(`cat '${macFile("collab-script.log")}' 2>/dev/null`, true);
    if (log) { console.log(`--- Leo's steps (Mac)\n${log}`); await Deno.writeTextFile(`${out}/leo-collab-script.log`, log); }
    await mac(`cd '${macTmp}' && rm -f ${MAC_FILES.join(" ")}`, true);
    if (libraryMade) {
      await mac(`cd "$HOME/Library/Application Support" && rm -rf Pane-devrun .Pane-devrun_SUPPORT Pane-devrun.store Pane-devrun.store-shm Pane-devrun.store-wal "${MAC_BUNDLE}"; rm -rf "$HOME/Library/Caches/${MAC_BUNDLE}" "$HOME/Library/HTTPStorages/${MAC_BUNDLE}" "$HOME/Library/HTTPStorages/${MAC_BUNDLE}.binarycookies" "$HOME/Library/WebKit/${MAC_BUNDLE}" "$HOME/Library/Saved Application State/${MAC_BUNDLE}.savedState"; defaults delete ${MAC_BUNDLE} >/dev/null 2>&1; rm -f "$HOME/Library/Preferences/${MAC_BUNDLE}.plist"; true`, true);
      // Keychain items under the dev run's prefix (AppIdentity.keychainPrefix).
      const gone = await mac(`n=0; for s in $(security dump-keychain 2>/dev/null | grep -o '"svce"<blob>="${MAC_BUNDLE}[^"]*"' | sed 's/.*="//;s/"$//' | sort -u); do while security delete-generic-password -s "$s" >/dev/null 2>&1; do n=$((n+1)); done; done; echo $n`, true);
      console.log(`Deleted the Mac app's library, settings and ${gone || 0} Keychain items.`);
    }
  }
  if (tunnel) { try { tunnel.kill("SIGTERM"); } catch { /* gone */ } await tunnel.status; tunnel = null; console.log("Closed the tunnel."); }
  if (udid) {
    await sh(["xcrun", "simctl", "terminate", udid, bundle], true);
    await sh(["xcrun", "simctl", "shutdown", udid], true);
    await sh(["xcrun", "simctl", "delete", udid], true);
  }
  for (const p of people) {
    await fetch(`${api}/auth/v1/admin/users/${p.id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
    await fetch(`${api}/rest/v1/signup_allowlist?email=eq.${encodeURIComponent(p.email)}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
  }
  console.log(`Deleted ${udid ? 1 : 0} simulator and ${people.length} accounts (film-macai-${run}).`);
}

let ok = false;
try {
  // The Mac first: nothing of ours there yet, and no other dev-run library to step on.
  macTmp = await mac("getconf DARWIN_USER_TEMP_DIR");
  if (!macTmp.endsWith("/")) macTmp += "/";
  const pre = await mac(`ls -a "$HOME/Library/Application Support" | grep -q -E '^(\\.)?Pane-devrun|^${MAC_BUNDLE}$' && echo there; [ -f "$HOME/Library/Preferences/${MAC_BUNDLE}.plist" ] && echo there; [ -d '${MAC_APP}' ] || echo noapp; lsof -nP -iTCP:${port} -sTCP:LISTEN >/dev/null && echo port; true`);
  if (pre.includes("there")) throw new Error("A Pane-devrun library (or this build's settings) is on the Mac already: not touching it.");
  if (pre.includes("noapp")) throw new Error(`No app at ${MAC_APP} on the Mac.`);
  if (pre.includes("port")) throw new Error(`Port ${port} is taken on the Mac.`);

  for (const [n, name] of ["Sara", "Leo"].entries()) {
    const email = `film-macai-${run}-${name.toLowerCase()}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
    await fetch(`${api}/rest/v1/signup_allowlist`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
    let id = "";
    for (let attempt = 1; attempt <= 60; attempt++) {
      const res = await fetch(`${api}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) });
      if (!res.ok) throw new Error(`Making ${name} failed: ${res.status}`);
      id = (await res.json()).id;
      if (colourIndex(id) === COLOURS[n]) break;
      await fetch(`${api}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
      id = "";
    }
    if (!id) throw new Error(`No account for ${name} in colour ${COLOURS[n]}`);
    people.push({ name, email, password, id });
    await fetch(`${api}/rest/v1/email_unsubscribes`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: id, source: "link" }) }).then((r) => r.body?.cancel());
    const s = await signIn(people.at(-1)!);
    await fetch(`${api}/rest/v1/profiles`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
      body: JSON.stringify({ display_name: name }) }).then((r) => r.body?.cancel());
  }
  const [SARA, LEO] = people;

  // Sara: a headless simulator; she makes the note in its state after beats 1 and 2, and shares it.
  const saraSteps: Step[] = [
    ...start(SARA), { keyFetchHere: true },
    { create: NOTE }, { wait: 1 }, { access: "edit" }, { copyLink: "link.txt" },
    { waitPresence: { name: "Leo", timeout: 300, soft: true } }, { dump: "here.json" },
    { waitFile: "go-b3.txt" }, { waitText: { text: AI_LINES[1], timeout: 120 } }, { wait: 1 }, { dump: "b3.json" },
    { waitFile: "go-quit.txt" }, { quit: true },
  ];
  udid = await simctl("create", `pinto-macai-${run}-sara`, "iPhone 17", runtime);
  await simctl("boot", udid);
  await simctl("bootstatus", udid, "-b");
  await sh(["xcrun", "simctl", "ui", udid, "appearance", "light"], true);
  for (let i = 1; ; i++) {
    try { await simctl("install", udid, app); break; } catch (e) { if (i === 4) throw e; await sleep(5); }
  }
  simDir = await simctl("get_app_container", udid, bundle, "data");
  await Deno.mkdir(`${simDir}/tmp`, { recursive: true });
  await Deno.writeTextFile(simFile("steps.json"), JSON.stringify(saraSteps));
  await simctl("launch", udid, bundle, "-collabScript", simFile("steps.json"));

  // Leo: the Mac app, through a tunnel to this stack.
  tunnel = new Deno.Command("ssh", { args: ["-N", "-o", "ExitOnForwardFailure=yes", "-o", "ServerAliveInterval=10", "-R", `${port}:127.0.0.1:${port}`, HOST], stdout: "null", stderr: "piped" }).spawn();
  for (let i = 0; i < 50; i++) {
    if ((await mac(`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${port}/auth/v1/health`, true)).startsWith("2")) break;
    if (i === 49) throw new Error("The tunnel to the Mac didn't come up.");
    await sleep(0.3);
  }
  const leoSteps: Step[] = [
    ...start(LEO),
    { waitFile: "link.txt" }, { join: "link.txt" }, { waitPresence: { name: "Sara", timeout: 60, soft: true } }, { endEditing: true }, { wait: 1 }, { dump: "joined.json" },
    { waitFile: "go-b3.txt" }, { waitText: { text: AI_LINES[1], timeout: 120 } }, { wait: 1 }, { dump: "b3.json" },
    { waitFile: "go-quit.txt" }, { quit: true },
  ];
  await mac(`cd '${macTmp}' && rm -f ${MAC_FILES.join(" ")}`);
  await macPut("macfilm-steps.json", JSON.stringify(leoSteps));
  libraryMade = true;
  // As a Dock launch: the first open starts it with no window, the second makes the window.
  await mac(`open -n --env PANE_DEV_RUN=1 '${MAC_APP}' --args -collabScript '${macFile("macfilm-steps.json")}' -PintoAppearance light -notesWindowFrame '"${FRAME}"' -sidebarSetup.notice.${LEO.id.toUpperCase()} YES`);
  for (let i = 0; i < 40 && !macPid; i++) { await sleep(0.5); macPid = await mac(`pgrep -f '^${MAC_APP}/Contents/MacOS/' | head -1`, true); }
  if (!macPid) throw new Error("The Mac app didn't start.");
  await sleep(3);
  await mac(`open '${MAC_APP}'`);

  // Share and join (not filmed).
  const link = await simWait("link.txt", 300);
  await macPut("link.txt", link);
  const joined = await macWait("joined.json", 240);
  check("Leo joins by the link on the Mac and has the note", joined.title === "Cabin weekend", JSON.stringify({ title: joined.title, here: joined.here }));
  check("the Mac shows the note as after beats 1 and 2", String(joined.text ?? "").includes("- [x] Board games") && String(joined.text ?? "").includes(LEO_LINE), JSON.stringify(joined.text));
  const here = await simWait("here.json", 120);
  check("Sara and Leo see each other", (here.here ?? []).some((p: any) => p.name === "Leo") && (joined.here ?? []).some((p: any) => p.name === "Sara"), JSON.stringify({ saraSees: here.here, leoSees: joined.here }));

  // Sara's AI, connected before filming (as in sharing-two-phones.ts).
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
  const again = async (name: string, args: unknown) => { for (let i = 1; ; i++) { try { return await ai(name, args); } catch (e) { if (i === 4) throw e; console.log(String(e)); await sleep(3); } } };
  await ai("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude", version: "1" } });
  // The note reaches the server a little after it was made: look again for up to 30 s.
  let path: string | undefined, seen: unknown;
  for (let i = 0; i < 15 && !path; i++) {
    if (i) await sleep(2);
    seen = await again("list", { pattern: "**/*.md" });
    path = (seen as any).matches?.find((m: any) => m.shared)?.path;
  }
  if (!path) throw new Error(`Sara's AI doesn't see the shared note: ${JSON.stringify(seen).slice(0, 400)}`);
  const body = ((await again("fetch", { id: path })).text as string).replace(/^\s*\d+\t/gm, "");
  if (!body.includes(LEO_LINE)) throw new Error(`Sara's AI doesn't see the note's lines: ${JSON.stringify(body)}`);

  // The window's frame, the pointer off it, the screen as it is; then record the frame.
  await sleep(3);
  const frame = (await runner(`~/council/pwid ${macPid}`)).split("\n")[0].trim().split(/\s+/).map(Number);
  if (frame.length < 5 || frame.some(isNaN)) throw new Error(`No window frame for the Mac app: ${frame}`);
  const [, x, y, w, h] = frame;
  check("the Mac window is 1400x900", w === 1400 && h === 900, `${x},${y} ${w}x${h}`);
  await runner(`~/council/mv 40 ${Math.min(y + h + 40, 700)}; sleep 0.3; screencapture -x /tmp/macfilm-pre.png`);
  await sh(["scp", "-q", `${HOST}:/tmp/macfilm-pre.png`, `${out}/mac-pre.png`], true);
  await mac("rm -f /tmp/macfilm-pre.png", true);
  const movOnMac = `/tmp/macfilm-${run}.mov`;
  recPid = await runner(`nohup ${RECORDER} ${movOnMac} ${x} ${y} ${w} ${h} 60 60 ${MAC_BUNDLE} > /tmp/macfilm-rec.log 2>&1 & echo $!`).then((o) => o.split("\n")[0].trim());
  moment("rec-start");
  await sleep(LEAD);

  // Sara's AI adds two lines.
  moment("ai-edit-sent");
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
  moment("ai-edit-answered");
  await Promise.all([simPut("go-b3.txt"), macPut("go-b3.txt")]);
  const [s3, l3] = await Promise.all([simWait("b3.json", 180), macWait("b3.json", 180)]);
  moment("both-have-it");
  check("the AI's lines on the Mac and Sara's phone", e.checks === "ok" && AI_LINES.every((l) => s3.text.includes(l) && l3.text.includes(l)), JSON.stringify(l3.text));
  check("the Mac marks it as Sara's Claude", l3.ai?.says === "Sara's Claude", JSON.stringify({ leo: l3.ai, sara: s3.ai }));
  await sleep(TAIL);
  moment("rec-stop");
  await runner(`kill -INT ${recPid}; for i in $(seq 50); do kill -0 ${recPid} 2>/dev/null || break; sleep 0.2; done`);
  recPid = "";
  await sh(["scp", "-q", `${HOST}:${movOnMac}`, `${out}/mac.mov`]);
  await sh(["scp", "-q", `${HOST}:/tmp/macfilm-rec.log`, `${out}/mac-rec.log`], true);
  await mac(`rm -f ${movOnMac} /tmp/macfilm-rec.log`, true);
  await Deno.writeTextFile(`${out}/leo-joined.json`, JSON.stringify(joined, null, 1));
  await Deno.writeTextFile(`${out}/leo-b3.json`, JSON.stringify(l3, null, 1));
  await Deno.writeTextFile(`${out}/sara-b3.json`, JSON.stringify(s3, null, 1));
  ok = results.every((r) => r[1]);
} catch (err) {
  check("the run", false, String((err as Error).message));
  if (udid) await sh(["xcrun", "simctl", "io", udid, "screenshot", "--type=png", `${out}/failed-sara.png`], true);
  await runner("screencapture -x /tmp/macfilm-failed.png").catch(() => {});
  await sh(["scp", "-q", `${HOST}:/tmp/macfilm-failed.png`, `${out}/failed-mac.png`], true);
  await mac("rm -f /tmp/macfilm-failed.png", true);
} finally {
  const log = await simRead("collab-script.log");
  if (log) { console.log(`--- Sara's steps\n${log.trim()}`); await Deno.writeTextFile(`${out}/sara-collab-script.log`, log); }
  await Deno.writeTextFile(`${out}/results.json`, JSON.stringify(results, null, 1));
  if (simDir) await simPut("go-quit.txt").catch(() => {});
  await sleep(1);
  await cleanup();
}
console.log(JSON.stringify(results.map(([name, passed]) => [name, passed])));
Deno.exit(ok ? 0 : 1);
