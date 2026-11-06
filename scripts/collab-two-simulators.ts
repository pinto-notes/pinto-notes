// Shared notes in the real app on two iPhone simulators, against the LOCAL stack: Emil shares a
// checklist with Can edit, Sara joins by the link and each phone names the other, both tick at once
// and each sees the other's tick, the server goes away while Sara edits and ticks (her phone says
// "Not synced yet", each shows the other grey), her edits merge when it's back ("Synced"), Sara's AI
// edits the note through the stack's MCP function and both phones mark it ("Sara's Claude" on
// Emil's), and Emil removes Sara just after she typed: her phone says she no longer has access, and
// she keeps a copy.
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
//                                  before she joins and the lost-access alert before she answers it.
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

const runtime = JSON.parse(await simctl("list", "runtimes", "-j")).runtimes.filter((r: any) => r.isAvailable && r.platform === "iOS" && r.supportedDeviceTypes?.some((d: any) => d.name === "iPhone 17")).at(-1).identifier;
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
  const who = d.person.name.toLowerCase();
  let seen = 0;
  tails.push(setInterval(() => {
    let text: string;
    try { text = Deno.readTextFileSync(file(d, "collab-script.log")); } catch { return; }
    const lines = text.split("\n").filter(Boolean), now = Date.now() / 1000, names = labels.get(d.person.name)!;
    if (lines.length < seen) seen = 0; // A relaunch began a new log.
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

const EMIL_LINE = "Ask the hotel to cater for forty people.";
const SARA_LINE = "Everyone brings their own lunch this year.";
const LATER_LINE = "Lunch is cancelled, nobody told me why.";
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
// The waits for what the fixes of persona council round 7 show (a name, grey, "Not synced yet",
// "Synced", the lost-access alert) are soft: when one doesn't come, the app's log says "missed",
// no moment is marked for it, the steps go on, and the check below that reads its dump fails. The
// recording then shows what happened instead.
const emilSteps = steps(people[0], [
  { create: list }, mark("emil-note"), ...hold(),
  ...(show ? [{ showShare: true }, mark("emil-share-open"), { dump: "share-open.json" }, ...hold()] : []),
  { access: "edit" }, mark("emil-link-can-edit"), ...hold(), { copyLink: "link.txt" }, mark("emil-link-copied"), ...hold(),
  ...(show ? [{ closeShare: true }] : []),
  // Sara in the note: by name from the first moment she's here.
  { waitPresence: { timeout: 300, soft: true } }, mark("emil-sees-sara-here"), { dump: "here-first.json" }, ...hold(), { dump: "here.json" },
  { waitFile: "go-tick.txt" }, { tick: "Book the venue" }, mark("emil-ticked"), { waitText: { text: "- [x] Order lunch", timeout: 90 } }, mark("emil-sees-sara-tick"), ...hold(), { dump: "ticks.json" },
  // The server paused: Sara isn't heard from, and goes grey.
  { waitFile: "go-offline.txt" }, { waitPresence: { grey: true, timeout: 60, soft: true } }, mark("emil-sees-sara-grey"), ...hold(), { dump: "offline.json" },
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 240 } }, mark("emil-sees-sara-offline-edits"),
  { waitPresence: { grey: false, timeout: 60, soft: true } }, mark("emil-sees-sara-back"), ...hold(), { dump: "merged.json" },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, mark("emil-sees-ai-edit"), ...hold(), { dump: "ai.json" },
  // He opens the receipt for Sara's Claude's change and undoes it, as its buttons do: it goes back on both phones.
  { waitFile: "go-review.txt" }, { reviewAI: "open" }, { wait: 1 }, mark("emil-review-open"), ...hold(), { reviewAI: "undoAll" }, { wait: 1 }, mark("emil-review-undone"), ...hold(), { dump: "ai-undone.json" },
  // Sara decides on an AI edit in two parts: what she keeps and undoes reaches him.
  { waitFile: "go-ai2.txt" }, { waitText: { text: "5-6 November", timeout: 120 } }, mark("emil-sees-two-part-edit"), ...hold(),
  { waitFile: "go-review2.txt" }, { waitText: { text: "- [x] Book the train", timeout: 120 } }, mark("emil-sees-sara-decision"), ...hold(), { dump: "review2.json" },
  // The server paused again: both change the same line.
  { waitFile: "go-conflict.txt" }, { type: { text: " for 40 people", after: "Print agenda" } }, mark("emil-typed-same-line"), ...hold(), { dump: "conflict.json" },
  { waitFile: "go-online2.txt" }, { waitText: { text: "in colour", timeout: 240 } }, mark("emil-sees-same-line-merged"), ...hold(), { dump: "conflict-merged.json" },
  // Offline once more: both replace the same word, differently.
  { waitFile: "go-clash.txt" }, { replace: { from: "lunch", to: "sandwiches" } }, mark("emil-replaced-word"), ...hold(), { dump: "clash.json" },
  { waitFile: "go-online3.txt" }, { waitText: { text: "pizza", timeout: 240 } }, { waitClash: 30 }, mark("emil-sees-clash-merged"), ...hold(), { dump: "clash-merged.json" },
  // Sara chooses; the question goes from his phone too.
  { waitFile: "go-choose.txt" }, { waitText: { text: "Order pizza\n", timeout: 120 } }, mark("emil-sees-choice"), ...hold(), { dump: "clash-chosen.json" },
  // Offline once more: each rewrites that whole line.
  { waitFile: "go-sentence.txt" }, { replace: { from: "Order pizza", to: EMIL_LINE } }, mark("emil-rewrote-line"), ...hold(), { dump: "sentence.json" },
  { waitFile: "go-online4.txt" }, { waitText: { text: SARA_LINE, timeout: 240 } }, { waitClash: 30 }, mark("emil-sees-sentences-merged"), ...hold(), { dump: "sentence-merged.json" },
  { waitFile: "go-choose2.txt" }, { waitText: { text: "] " + SARA_LINE + "\n", timeout: 120 } }, { wait: 1 }, mark("emil-sees-sentence-choice"), ...hold(), { dump: "sentence-chosen.json" },
  // Version history: Sara changes the line; he opens the history, looks at the version before it and restores it.
  { waitFile: "go-history.txt" }, { waitText: { text: LATER_LINE, timeout: 120 } }, { wait: 1 }, mark("emil-sees-later-edit"), ...hold(),
  { history: "open" }, { wait: 2 }, mark("emil-history-list"), ...hold(), { history: "pick" }, { wait: 2 }, mark("emil-history-version"), ...hold(),
  { history: "restore" }, { wait: 2 }, mark("emil-restored"), ...hold(), { dump: "history-restored.json" },
  // Share open on Sara, then (once she has typed) Remove.
  { waitFile: "go-remove.txt" }, ...(show ? [{ showShare: true }, mark("emil-share-people"), ...hold()] : []), { dump: "share-people.json" },
  { waitFile: "go-remove-now.txt" }, { remove: "Sara" }, mark("emil-removed-sara"), { wait: 2 }, ...hold(), { dump: "removed.json" }, ...(show ? [{ closeShare: true }] : []),
  { waitFile: "go-quit.txt" }, { quit: true },
]);
const saraSteps = steps(people[1], [
  { waitFile: "link.txt" },
  ...(show
    ? [{ openLink: { file: "link.txt", question: "join-question.json" } }, mark("sara-join-question"), ...hold(), { answerJoin: "join" }]
    : [{ join: "link.txt" }]),
  mark("sara-joined"), { waitPresence: { timeout: 60, soft: true } }, mark("sara-sees-emil-here"), { dump: "here-first.json" }, ...hold(), { dump: "joined.json" },
  { waitFile: "go-tick.txt" }, { tick: "Order lunch" }, mark("sara-ticked"), { waitText: { text: "- [x] Book the venue", timeout: 90 } }, mark("sara-sees-emil-tick"), ...hold(), { dump: "ticks.json" },
  // The server paused while she types and ticks: "Not synced yet" by the people, Emil grey.
  { waitFile: "go-offline.txt" }, { type: { text: "\nBook the train", after: "Print agenda" } }, mark("sara-typed-offline"), { tick: "Book the train" }, mark("sara-ticked-offline"),
  { waitSync: { text: "Not synced yet", timeout: 30, soft: true } }, mark("sara-not-synced"),
  { waitPresence: { grey: true, timeout: 60, soft: true } }, mark("sara-sees-emil-grey"), ...hold(), { dump: "offline.json" },
  // Back: "Synced" for a moment (2 s), and Emil in colour again.
  { waitSync: { text: "Synced", timeout: 240, soft: true } }, mark("sara-synced"), { dump: "synced.json" },
  { waitPresence: { grey: false, timeout: 60, soft: true } }, mark("sara-sees-emil-back"),
  { waitFile: "go-online.txt" }, { waitText: { text: "- [x] Book the train", timeout: 60 } },
  // This script fetches her key to connect her AI. A real connect (/connect) doesn't, so no real
  // connect shows the new-device alert this fetch would.
  { keyFetchHere: true },
  { waitFile: "go-ai.txt" }, { waitText: { text: "3-4 November", timeout: 120 } }, mark("sara-sees-ai-edit"), ...hold(), { dump: "ai.json" },
  { waitFile: "go-review.txt" }, { waitText: { text: "- [ ] Pick dates", timeout: 120 } }, mark("sara-sees-undo"), ...hold(), { dump: "ai-undone.json" },
  // Claude's edit in two parts: she keeps one and undoes the other.
  { waitFile: "go-ai2.txt" }, { waitText: { text: "5-6 November", timeout: 120 } }, mark("sara-sees-two-part-edit"), ...hold(),
  { waitFile: "go-review2.txt" }, { reviewAI: "open" }, { wait: 1 }, mark("sara-review2-open"), ...hold(),
  { reviewAI: "keepNext" }, { wait: 1 }, mark("sara-kept-one"), ...hold(), { reviewAI: "undoNext" }, { wait: 1 }, mark("sara-undid-other"), ...hold(), { dump: "review2.json" },
  // The server paused again: both change the same line. Then this app is quit (the run does that).
  { waitFile: "go-conflict.txt" }, { type: { text: " in colour", after: "Print agenda" } }, mark("sara-typed-same-line"),
  { waitSync: { text: "Not synced yet", timeout: 30, soft: true } }, mark("sara-not-synced-again"), ...hold(), { dump: "conflict.json" },
  { wait: 900 },
]);
// Sara's phone from its relaunch, the server still away: her edit has to be there without it.
const saraAfterRelaunch = (() => {
  const out: Step[] = [], names = new Map<number, string>();
  for (const s of [
    { keyFetchHere: true }, { wait: 2 }, { open: "Offsite plan" }, { waitText: { text: "in colour", timeout: 60 } }, mark("sara-relaunched-offline"), ...hold(), { dump: "relaunched.json" },
    { waitFile: "go-online2.txt" }, { waitText: { text: "for 40 people", timeout: 240 } }, mark("sara-sees-same-line-merged"), ...hold(), { dump: "conflict-merged.json" },
    { waitFile: "go-clash.txt" }, { replace: { from: "lunch", to: "pizza" } }, mark("sara-replaced-word"), ...hold(), { dump: "clash.json" },
    { waitFile: "go-online3.txt" }, { waitText: { text: "sandwiches", timeout: 240 } }, { waitClash: 30 }, mark("sara-sees-clash-merged"), ...hold(), { dump: "clash-merged.json" },
    { waitFile: "go-choose.txt" }, { keepClash: "pizza" }, { wait: 1 }, mark("sara-chose"), ...hold(), { dump: "clash-chosen.json" },
    { waitFile: "go-sentence.txt" }, { replace: { from: "Order pizza", to: SARA_LINE } }, mark("sara-rewrote-line"), ...hold(), { dump: "sentence.json" },
    { waitFile: "go-online4.txt" }, { waitText: { text: EMIL_LINE, timeout: 240 } }, { waitClash: 30 }, mark("sara-sees-sentences-merged"), ...hold(), { dump: "sentence-merged.json" },
    { waitFile: "go-choose2.txt" }, { keepClash: SARA_LINE }, { wait: 1 }, mark("sara-chose-sentence"), ...hold(), { dump: "sentence-chosen.json" },
  // She changes the line; his restore of the version before it reaches her.
  { waitFile: "go-history.txt" }, { replace: { from: SARA_LINE, to: LATER_LINE } }, mark("sara-changed-line"),
  { waitText: { text: SARA_LINE, timeout: 180 } }, { wait: 1 }, mark("sara-sees-restore"), ...hold(), { dump: "history-restored.json" },
  // She types while Emil has Share open on her; he removes her a moment after.
  { waitFile: "go-type.txt" }, { type: { text: "\nBring name badges", after: "Book the train" } }, mark("sara-typed-before-removal"), { dump: "typed-before.json" },
  { waitGone: 180 }, mark("sara-note-gone"),
  { waitLostAccess: { file: "lost.json", timeout: 60, soft: true } }, mark("sara-lost-access"), ...hold(),
  { answerLostAccess: { answer: "keepCopy", soft: true } }, mark("sara-kept-copy"), ...hold(), { dump: "removed.json" },
  // The link she joined with, opened again: it was replaced when Emil removed her.
  { deadLink: { file: "link.txt", out: "old-link.json" } }, { wait: 1 }, mark("sara-old-link"), ...hold(), { dismissJoinProblem: true },
  ...(privateAI
    ? [{ create: trip }, mark("sara-own-note"), ...hold(), { type: { text: "\nBudget 400 euros", after: "Tram 28 tickets" } }, mark("sara-typed-budget"), { wait: 1 }, { dump: "typed.json" },
      { waitFile: "go-private.txt" }, { waitText: { text: "21 to 23 May", timeout: 120 } }, mark("sara-sees-own-ai-edit"), { wait: Math.max(5, HOLD + 2) }, { dump: "private.json" }]
    : []),
    { waitFile: "go-quit.txt" }, { quit: true },
  ] as Step[]) {
    if (typeof s._mark === "string") names.set(out.length, s._mark);
    else out.push(s);
  }
  return { out, names };
})();

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
  if (show) {
    const opened = await waitFor(emil, "share-open.json", 10);
    check("Emil's Share sheet names him the moment it opens", opened.people?.[0]?.me === true && opened.people[0].name === "Emil Test", JSON.stringify(opened.people?.map((p: any) => p.name)));
  }
  await put(sara, "link.txt", link);
  const joined = await waitFor(sara, "joined.json", 180);
  check("Sara opens the link, joins, and has the note", joined.title === "Offsite plan" && joined.documentOpen === true && joined.text.includes("- [ ] Book the venue"),
    JSON.stringify({ title: joined.title, documentOpen: joined.documentOpen, editable: joined.editable }));
  // Each phone names the other from the first moment both are in the note (round 7 saw "Someone").
  const names = (d: any) => (d?.here ?? []).map((p: any) => p.name);
  const [emilHere, saraHere] = [await waitFor(emil, "here-first.json", 120), await waitFor(sara, "here-first.json", 60)];
  check("each phone names the other as soon as both are in the note", names(emilHere).includes("Sara Test") && names(saraHere).includes("Emil Test"),
    JSON.stringify({ emilSees: names(emilHere), saraSees: names(saraHere) }));

  // Both tick at once.
  await Promise.all([put(emil, "go-tick.txt"), put(sara, "go-tick.txt")]);
  const [t1, t2] = await Promise.all([waitFor(emil, "ticks.json", 150), waitFor(sara, "ticks.json", 150)]);
  check("both tick at once and each sees the other's tick, nothing moved", t1.text === t2.text && t1.text.includes("- [x] Book the venue\n- [ ] Pick dates\n- [x] Order lunch"),
    JSON.stringify(t1.text));

  // The server goes away while Sara types and ticks; then it's back.
  await shell(offline);
  moment("offline");
  await Promise.all([put(emil, "go-offline.txt"), put(sara, "go-offline.txt")]);
  const [off, emilOff] = await Promise.all([waitFor(sara, "offline.json", 150), waitFor(emil, "offline.json", 150)]);
  check("with the server unreachable, Sara types an item and ticks it", off.text.includes("- [x] Book the train"), JSON.stringify(off.text));
  const grey = (d: any) => (d?.here ?? []).map((p: any) => `${p.name}${p.grey ? " (grey)" : ""}`);
  check("offline, Sara's phone says Not synced yet beside the people", off.sync === "Not synced yet", JSON.stringify(off.sync));
  check("offline, each phone shows the other grey", (off.here ?? []).some((p: any) => p.grey) && (emilOff.here ?? []).some((p: any) => p.grey),
    JSON.stringify({ emilSees: grey(emilOff), saraSees: grey(off) }));
  await sleep(2);
  await shell(online);
  moment("online");
  await Promise.all([put(emil, "go-online.txt"), put(sara, "go-online.txt")]);
  const merged = await waitFor(emil, "merged.json", 300);
  check("when it's back, Sara's offline edits reach Emil and merge", merged.text.includes("- [x] Book the train") && merged.text.includes("- [x] Order lunch") && merged.text.split("Book the train").length === 2,
    JSON.stringify(merged.text));
  const synced = await waitFor(sara, "synced.json", 120);
  check("when it's back, Sara's phone says Synced", synced.sync === "Synced", JSON.stringify(synced.sync));
  check("when it's back, Emil shows Sara in colour again", (merged.here ?? []).length > 0 && (merged.here ?? []).every((p: any) => !p.grey), JSON.stringify(grey(merged)));

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
  // Marked on both (its receipt and tint come when the open note shows it): Emil's names whose AI it is.
  check("both phones mark it as the AI's edit: Sara's Claude on Emil's, Claude on Sara's",
    a1.ai?.says === "Sara's Claude" && a1.ai?.seen === true && a2.ai?.says === "Claude" && a2.ai?.seen === true, JSON.stringify({ emil: a1.ai, sara: a2.ai }));

  // Emil opens the receipt and undoes the change: both phones go back to the line before it.
  await Promise.all([put(emil, "go-review.txt"), put(sara, "go-review.txt")]);
  const [u1, u2] = await Promise.all([waitFor(emil, "ai-undone.json", 180), waitFor(sara, "ai-undone.json", 180)]);
  check("Emil undoes Sara's Claude's change from its receipt, and it goes back on both phones",
    u1.text === u2.text && u1.text.includes("- [ ] Pick dates") && !u1.text.includes("3-4 November"), JSON.stringify(u2.text));

  // Sara's Claude changes two lines; she keeps one change and undoes the other, on her phone.
  // fetch numbers its lines; edit wants the text without them.
  const body = ((await ai("fetch", { id: path })).text as string).replace(/^\s*\d+\t/gm, "");
  const part = body.slice(body.indexOf("- [ ] Pick dates"), body.indexOf("Book the train") + "Book the train".length);
  const e3 = await ai("edit", { path, old_string: part, new_string: part.replace("Pick dates", "Pick dates: 5-6 November").replace("Book the train", "Book the 9:10 train") });
  moment("ai-edit-two-parts");
  await Promise.all([put(emil, "go-ai2.txt"), put(sara, "go-ai2.txt")]);
  await sleep(HOLD + 3);
  await Promise.all([put(emil, "go-review2.txt"), put(sara, "go-review2.txt")]);
  const [d1, d2] = await Promise.all([waitFor(emil, "review2.json", 180), waitFor(sara, "review2.json", 180)]);
  check("Sara keeps one of Claude's two changes and undoes the other, and both phones agree",
    e3.checks === "ok" && d1.text === d2.text && d1.text.includes("Pick dates: 5-6 November") && d1.text.includes("Book the train") && !d1.text.includes("9:10"), JSON.stringify(d1.text));

  // The server away again: both change the same line, and Sara's app is quit and opened again.
  await shell(offline);
  moment("offline-same-line");
  await Promise.all([put(emil, "go-conflict.txt"), put(sara, "go-conflict.txt")]);
  const [, typedOff] = await Promise.all([waitFor(emil, "conflict.json", 120), waitFor(sara, "conflict.json", 120)]);
  check("after typing, Sara's bar offers Undo", typedOff.canUndo === true, JSON.stringify(typedOff.canUndo));
  await simctl("terminate", sara.udid, bundle);
  moment("sara-app-quit");
  await sleep(2);
  labels.set("Sara", saraAfterRelaunch.names);
  await Deno.writeTextFile(file(sara, "steps2.json"), JSON.stringify(saraAfterRelaunch.out));
  await simctl("launch", sara.udid, bundle, "-collabScript", file(sara, "steps2.json"));
  const again = await waitFor(sara, "relaunched.json", 150);
  check("quit and opened again with the server away, Sara's offline edit is still there", again.text.includes("Print agenda in colour"), JSON.stringify(again.text));
  await shell(online);
  moment("online-same-line");
  await Promise.all([put(emil, "go-online2.txt"), put(sara, "go-online2.txt")]);
  const [c1, c2] = await Promise.all([waitFor(emil, "conflict-merged.json", 300), waitFor(sara, "conflict-merged.json", 300)]);
  check("both edits to the same line are kept, the same on both phones", c1.text === c2.text && c1.text.includes("for 40 people") && c1.text.includes("in colour"), JSON.stringify(c1.text));

  // Offline again: each replaces the same word with a different one. Nobody's words are dropped.
  await shell(offline);
  moment("offline-clash");
  await Promise.all([put(emil, "go-clash.txt"), put(sara, "go-clash.txt")]);
  await Promise.all([waitFor(emil, "clash.json", 120), waitFor(sara, "clash.json", 120)]);
  await shell(online);
  moment("online-clash");
  await Promise.all([put(emil, "go-online3.txt"), put(sara, "go-online3.txt")]);
  const [w1, w2] = await Promise.all([waitFor(emil, "clash-merged.json", 300), waitFor(sara, "clash-merged.json", 300)]);
  check("both replace the same word offline: both phones agree, neither word is lost, and both ask which to keep", w1.text === w2.text && w1.text.includes("sandwiches") && w1.text.includes("pizza") && w1.clash && w2.clash, JSON.stringify({ text: w1.text, emil: w1.clash, sara: w2.clash }));
  await Promise.all([put(emil, "go-choose.txt"), put(sara, "go-choose.txt")]);
  const [k1, k2] = await Promise.all([waitFor(emil, "clash-chosen.json", 180), waitFor(sara, "clash-chosen.json", 180)]);
  check("Sara chooses pizza: both phones say so, and the question goes from both", k1.text === k2.text && k1.text.includes("Order pizza\n") && !k1.text.includes("sandwiches") && k1.clash === null && k2.clash === null, JSON.stringify({ text: k1.text, emil: k1.clash, sara: k2.clash }));

  // Offline again: each rewrites the whole line, and it's the same question, with sentences.
  await shell(offline);
  moment("offline-sentence");
  await Promise.all([put(emil, "go-sentence.txt"), put(sara, "go-sentence.txt")]);
  await Promise.all([waitFor(emil, "sentence.json", 120), waitFor(sara, "sentence.json", 120)]);
  await shell(online);
  moment("online-sentence");
  await Promise.all([put(emil, "go-online4.txt"), put(sara, "go-online4.txt")]);
  const [s1, s2] = await Promise.all([waitFor(emil, "sentence-merged.json", 300), waitFor(sara, "sentence-merged.json", 300)]);
  check("both rewrite one line offline: both phones agree, neither sentence is lost, and both ask which to keep", s1.text === s2.text && s1.text.includes(EMIL_LINE) && s1.text.includes(SARA_LINE) && s1.clash && s2.clash, JSON.stringify({ emil: s1.text, sara: s2.text, c1: s1.clash, c2: s2.clash }));
  await Promise.all([put(emil, "go-choose2.txt"), put(sara, "go-choose2.txt")]);
  const [q1, q2] = await Promise.all([waitFor(emil, "sentence-chosen.json", 180), waitFor(sara, "sentence-chosen.json", 180)]);
  check("Sara keeps her sentence: the same on both phones, and the question goes from both", q1.text === q2.text && q1.text.includes(SARA_LINE) && !q1.text.includes(EMIL_LINE) && q1.clash === null && q2.clash === null, JSON.stringify({ emil: q1.text, sara: q2.text }));

  // More than CollabHistory.together after her last edit, so it stands as a version of its own.
  await sleep(12);
  await Promise.all([put(emil, "go-history.txt"), put(sara, "go-history.txt")]);
  const [h1, h2] = await Promise.all([waitFor(emil, "history-restored.json", 240), waitFor(sara, "history-restored.json", 240)]);
  check("Emil restores the version before Sara's edit from Version History: the same on both phones", h1.text === h2.text && h1.text.includes(SARA_LINE) && !h1.text.includes(LATER_LINE), JSON.stringify([h1.text, h2.text]));

  // Emil opens Share on Sara; she types a line; he removes her a moment after.
  await put(emil, "go-remove.txt");
  await waitFor(emil, "share-people.json", 120);
  await put(sara, "go-type.txt");
  const typed = await waitFor(sara, "typed-before.json", 120);
  await put(emil, "go-remove-now.txt");
  const [r1, r2] = await Promise.all([waitFor(emil, "removed.json", 120), waitFor(sara, "removed.json", 240)]);
  check("Emil removes Sara: she's gone from his note, and the note from her phone",
    r1.people.length === 1 && r1.people[0].me && !r2.sharedNotes.includes("Offsite plan"), JSON.stringify({ emilSees: r1.people.map((p: any) => p.name), saraHas: r2.sharedNotes }));
  const lost = await read(sara, "lost.json");
  const asked = lost ? JSON.parse(lost) : null;
  check("Sara's phone says she no longer has access, and offers Keep a Copy", asked?.title === "You no longer have access to “Offsite plan”" && asked?.buttons?.includes("Keep a Copy"),
    JSON.stringify(asked));
  check("Keep a Copy: her text, with the line she typed, as a note of her own (not shared, not in Shared with me)",
    typed.text.includes("Bring name badges") && r2.title === "Offsite plan" && r2.sharedNoteID === null && r2.text.includes("Bring name badges") && r2.folder !== "Shared with me",
    JSON.stringify({ title: r2.title, folder: r2.folder, shared: r2.sharedNoteID !== null }));

  const oldLink = await waitFor(sara, "old-link.json", 120);
  check("the link Sara joined with no longer opens for her", oldLink.opened === false && oldLink.says?.length > 0, JSON.stringify(oldLink));

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
  // The last hold on Sara's phone, with Emil's still on screen beside it.
  await sleep(HOLD + 3);
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
