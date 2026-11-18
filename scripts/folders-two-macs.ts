// Shared folders in the real Mac app on two Macs (the fleet's two Airs), against the LOCAL stack on
// this Mac: Maja shares her Recipes folder with Jonas by its link; both edit a note; Maja adds a
// photo; Jonas makes a note in the folder; Jonas moves a note out (he keeps a copy, it leaves the
// folder for Maja); Jonas leaves, joins again with a new link, and Maja stops sharing.
//
//   deno run -A scripts/folders-two-macs.ts <Maja's .app> [Jonas's .app] [photo.jpg]
//
// FOLDERS_HOSTS=fleet-air2,fleet-air2 runs both on one Mac, side by side: then give two builds with
// different bundle ids (dev.emilwagman.pintotest.maja and .jonas), so each has its own library.
//
// The build is the Mac app with a test bundle id (dev.emilwagman.pintotest.*: its own data folder,
// never the installed Pinto Notes' library) and this Mac's local stack as its backend, at
// 127.0.0.1:56421, which each Air reaches through `ssh -R`. CollabScript plays each side's steps
// through the app's own code: no input events are posted. Each Air films its screen
// (screencapture, in the rig's runner, which has the Screen Recording grant); the apps are told to
// leave notes showing while the screen is recorded (privacy mode would cover them). Take the fleet's
// screens first (fleet run airs --need screen ...). The two accounts (folders-<run>-*@example.com)
// are deleted at the end.
const apps = Deno.args.filter((a) => a.replace(/\/$/, "").endsWith(".app")), photo = Deno.args.find((a) => /\.(jpe?g|png|heic)$/i.test(a));
if (!apps.length) throw new Error("Give the path to the test build's .app.");
const hosts = (Deno.env.get("FOLDERS_HOSTS") ?? "fleet-air,fleet-air2").split(",");
const oneMac = hosts[0] === hosts[1];
if (oneMac && apps.length < 2) throw new Error("On one Mac, give two builds with different bundle ids.");
const root = new URL("..", import.meta.url).pathname;
const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env", "--workdir", root], stderr: "null" }).output()).stdout);
const env = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const api = env.API_URL, anon = env.ANON_KEY, service = env.SERVICE_ROLE_KEY;
if (!api || !/^http:\/\/127\.0\.0\.1:/.test(api)) throw new Error(`Not a local stack: ${api}. Run supabase start.`);
const admin = { apikey: service, authorization: `Bearer ${service}`, "content-type": "application/json" };
const run = crypto.randomUUID().slice(0, 6);
const out = Deno.env.get("FOLDERS_OUT") ?? `${root}build/folders-${run}`;
await Deno.mkdir(out, { recursive: true });

async function sh(cmd: string[], input?: string, quiet = false): Promise<string> {
  const p = new Deno.Command(cmd[0], { args: cmd.slice(1), stdin: input === undefined ? "null" : "piped", stdout: "piped", stderr: "piped" }).spawn();
  if (input !== undefined) { const w = p.stdin.getWriter(); await w.write(new TextEncoder().encode(input)); await w.close(); }
  const o = await p.output();
  const text = new TextDecoder().decode(o.stdout).trim();
  if (!o.success && !quiet) throw new Error(`${cmd.slice(0, 3).join(" ")}: ${new TextDecoder().decode(o.stderr).trim().slice(0, 300)}`);
  return text;
}
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
/** A command in the Air's rig runner (Ghostty, with Screen Recording): its output. */
const airrun = (host: string, cmd: string) =>
  sh(["ssh", host, "rm -f ~/rig/cmd.done; cat > ~/rig/cmd.tmp && mv ~/rig/cmd.tmp ~/rig/cmd.sh; until [ -f ~/rig/cmd.done ]; do sleep 0.25; done; cat ~/rig/cmd.out"], cmd);
const ssh = (host: string, cmd: string, quiet = false) => sh(["ssh", host, cmd], undefined, quiet);

// MARK: Accounts

type Person = { name: string; host: string; email: string; password: string; id: string; tmp: string; app: string; dir: string };
const people: Person[] = [];
for (const [i, name] of ["Maja", "Jonas"].entries()) {
  const host = hosts[i];
  const email = `folders-${run}-${name.toLowerCase()}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
  await fetch(`${api}/rest/v1/signup_allowlist`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
  const res = await fetch(`${api}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true }) });
  if (!res.ok) throw new Error(`Making ${name} failed: ${res.status}`);
  const { id } = await res.json();
  await fetch(`${api}/rest/v1/email_unsubscribes`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: id, source: "link" }) }).then((r) => r.body?.cancel());
  const s = await (await fetch(`${api}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email, password }) })).json();
  await fetch(`${api}/rest/v1/profiles`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ display_name: name }) }).then((r) => r.body?.cancel());
  // Each person's steps, flags and log in a folder of their own (CollabScript writes beside the steps).
  const tmp = `${(await ssh(host, "getconf DARWIN_USER_TEMP_DIR")).replace(/\/$/, "")}/folders-${name.toLowerCase()}`;
  people.push({ name, host, email, password, id, tmp, app: apps[Math.min(i, apps.length - 1)].replace(/\/$/, ""), dir: `folders/${name.toLowerCase()}` });
}
const [maja, jonas] = people;

// MARK: Steps

// One Mac: the two windows side by side on the Air's 1440 x 932 point screen.
const frame = (p: Person) => oneMac ? [{ windowFrame: [p.name === "Maja" ? 0 : 720, 0, 720, 900] }] : [];
const intro = (p: Person) => [{ signIn: { email: p.email, password: p.password } }, { waitReady: 120 }, { skipIntro: 10 }, ...frame(p)];
const steps: Record<string, unknown[]> = {
  Maja: [
    ...intro(maja),
    { createFolder: "Recipes" },
    { createIn: { folder: "Recipes", text: "Pancakes\nFlour, milk, eggs\n" } },
    { createIn: { folder: "Recipes", text: "Lentil soup\nRed lentils, cumin, lemon\n" } },
    { wait: 2 },
    { showFolderShare: "Recipes" }, { wait: 3 },
    { shareFolder: { folder: "Recipes", file: "link.txt" } }, { wait: 3 },
    { closeShare: true },
    { showFolder: "Recipes" },
    // Both edit Pancakes.
    { waitFile: "jonas-in.txt" },
    { open: "Pancakes" },
    { type: { text: "\nServe with berries" } },
    { waitText: { text: "A pinch of salt", timeout: 120 } },
    ...(photo ? [{ attach: `${maja.tmp}/photo.jpg` }] : []),
    { wait: 3 },
    { dump: "maja-pancakes.json" },
    // Jonas's note arrives; then his move out takes Lentil soup out of the folder.
    { waitNoteIn: { folder: "Recipes", title: "Shakshuka", timeout: 180 } },
    { showFolder: "Recipes" }, { wait: 3 },
    { waitNoteGone: { folder: "Recipes", title: "Lentil soup", timeout: 180 } },
    { wait: 3 },
    { dumpFolders: "maja-after-move.json" },
    // He leaves; a new link for him.
    { waitFile: "jonas-left.txt" },
    { wait: 40 }, { checkNow: true }, { wait: 5 }, { checkNow: true },
    { shareFolder: { folder: "Recipes", file: "link2.txt" } },
    { waitFile: "jonas-back.txt" },
    { showFolderShare: "Recipes" }, { wait: 4 },
    { stopFolder: "Recipes" }, { wait: 4 },
    { dumpFolders: "maja-end.json" },
    { wait: 20 },
  ],
  Jonas: [
    ...intro(jonas),
    { waitFile: "link.txt" },
    { joinFolder: { file: "link.txt", folder: "Recipes" } },
    { wait: 4 },
    { open: "Pancakes" },
    { type: { text: "\nA pinch of salt" } },
    { wait: 3 }, { dump: "jonas-typed.json" },
    { write: "jonas-in.txt" },
    { waitText: { text: "Serve with berries", timeout: 120 } },
    ...(photo ? [{ waitText: { text: "pane-file:", timeout: 120, soft: true } }] : []),
    { wait: 4 },
    { dump: "jonas-pancakes.json" },
    { createIn: { folder: "Recipes", text: "Shakshuka\nEggs, tomatoes, peppers\n" } },
    { wait: 15 }, { checkNow: true }, { wait: 5 },
    { moveTo: { title: "Lentil soup", folder: "My recipes" } },
    { wait: 3 }, { checkNow: true }, { wait: 10 },
    { dumpFolders: "jonas-after-move.json" },
    { showFolderShare: "Recipes" }, { wait: 4 },
    { leaveFolder: "Recipes" },
    { wait: 3 },
    { dumpFolders: "jonas-left.json" },
    { write: "jonas-left.txt" },
    { waitFile: "link2.txt" },
    { joinFolder: { file: "link2.txt", folder: "Recipes" } },
    { wait: 5 },
    { write: "jonas-back.txt" },
    { waitFolderGone: { folder: "Recipes", timeout: 180 } },
    { wait: 3 },
    { dumpFolders: "jonas-end.json" },
    { wait: 10 },
  ],
};

// Files one side writes and the other waits for, carried across by this Mac.
const relay: [string, Person, Person][] = [
  ["link.txt", maja, jonas], ["jonas-in.txt", jonas, maja], ["jonas-left.txt", jonas, maja], ["link2.txt", maja, jonas], ["jonas-back.txt", jonas, maja],
];

// MARK: Run

const tunnels: Deno.ChildProcess[] = [];
const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, detail = "") => { results.push([name, ok, detail]); console.log(ok ? "PASS" : "FAIL", name, detail); };
const pids: Record<string, string> = {}, recorders: Record<string, string> = {};
const filmSeconds = Number(Deno.env.get("FOLDERS_FILM") ?? 480);
const keep = Deno.env.get("FOLDERS_KEEP") === "1";
try {
  for (const host of new Set(hosts)) {
    // The local stack on the Air's 127.0.0.1:56421.
    tunnels.push(new Deno.Command("ssh", { args: ["-N", "-o", "ExitOnForwardFailure=yes", "-R", "56421:127.0.0.1:56421", host], stdout: "null", stderr: "null" }).spawn());
  }
  for (const p of people) {
    // A fresh folder for this run's steps and flags (a glob that matches nothing stops zsh's rm).
    await ssh(p.host, `rm -rf ${p.tmp} ~/${p.dir}/PintoTest.app && mkdir -p ~/${p.dir} ${p.tmp}`);
    await sh(["rsync", "-a", "--delete", `${p.app}/`, `${p.host}:${p.dir}/PintoTest.app/`]);
    await sh(["ssh", p.host, `cat > ${p.tmp}/folders-steps.json`], JSON.stringify(steps[p.name]));
    if (photo) await sh(["scp", "-q", photo, `${p.host}:${p.tmp}/photo.jpg`]);
  }
  await sleep(2);
  for (const host of new Set(hosts)) recorders[host] = (await airrun(host, `rm -f ~/folders/${host}.mov; nohup screencapture -V ${filmSeconds} -x ~/folders/${host}.mov >/dev/null 2>&1 & echo $!`)).split("\n")[0].trim();
  for (const p of people) {
    await airrun(p.host, `open -n ~/${p.dir}/PintoTest.app --args -collabScript ${p.tmp}/folders-steps.json -PintoAppearance light -privacyMode.whenShared nothing -privacyMode.whenInCall nothing; sleep 3; open ~/${p.dir}/PintoTest.app; echo ok`);
    pids[p.name] = await ssh(p.host, `pgrep -n -f ${p.dir}/PintoTest.app/Contents/MacOS`, true);
  }
  // Carry files across and wait for both sides to finish.
  const end = Date.now() + 15 * 60_000;
  const carried = new Set<string>();
  while (Date.now() < end) {
    for (const [file, from, to] of relay) {
      if (carried.has(file)) continue;
      const text = await ssh(from.host, `cat ${from.tmp}/${file} 2>/dev/null`, true);
      if (text) { await sh(["ssh", to.host, `cat > ${to.tmp}/${file}`], text); carried.add(file); console.log("carried", file, "to", to.name); }
    }
    const logs = await Promise.all(people.map((p) => ssh(p.host, `cat ${p.tmp}/collab-script.log 2>/dev/null | tail -1`, true)));
    if (logs.some((l) => l.includes("FAILED"))) { console.log("a side failed:", logs.join(" | ")); break; }
    if (logs.every((l) => l.includes("done"))) break;
    await sleep(2);
  }
  for (const p of people) {
    await ssh(p.host, `cd ${p.tmp} && tar cf - collab-script.log *.json 2>/dev/null`, true)
      .catch(() => "");
    await sh(["/bin/zsh", "-c", `ssh ${p.host} 'cd ${p.tmp} && tar cf - collab-script.log *.json 2>/dev/null' | tar xf - -C ${out} && mv ${out}/collab-script.log ${out}/${p.name.toLowerCase()}.log`], undefined, true);
  }
} finally {
  // Exact PIDs only: the test apps, then the recordings.
  for (const p of people) if (pids[p.name]) await ssh(p.host, `kill ${pids[p.name]}`, true);
  for (const host of new Set(hosts)) {
    // A background screencapture ignores Ctrl-C, so it films a set length and writes the file when done.
    const pid = recorders[host];
    if (/^\d+$/.test(pid ?? "")) await ssh(host, `while kill -0 ${pid} 2>/dev/null; do sleep 2; done; ls ~/folders/${host}.mov`, true);
    await sh(["scp", "-q", `${host}:folders/${host}.mov`, `${out}/`], undefined, true);
  }
  for (const t of tunnels) { try { t.kill(); } catch { /* gone */ } }
  if (keep) console.log("kept the accounts:", people.map((p) => `${p.name} ${p.id}`).join(", "));
  else for (const p of people) await fetch(`${api}/auth/v1/admin/users/${p.id}`, { method: "DELETE", headers: admin }).then((r) => r.body?.cancel());
}

// MARK: Checks

const read = (f: string) => { try { return JSON.parse(Deno.readTextFileSync(`${out}/${f}`)); } catch { return null; } };
const folderNotes = (d: any, name: string) => (d?.folders ?? []).filter((f: any) => f.name === name).flatMap((f: any) => f.notes.map((n: any) => n.title)).sort();
const mp = read("maja-pancakes.json"), jp = read("jonas-pancakes.json");
check("both edits are in the note on both Macs", [mp?.text, jp?.text].every((t) => t?.includes("A pinch of salt") && t?.includes("Serve with berries")));
if (photo) check("the photo is in the note on Jonas's Mac", jp?.text?.includes("pane-file:") === true);
const mm = read("maja-after-move.json"), jm = read("jonas-after-move.json");
check("Jonas's new note is in Maja's folder", folderNotes(mm, "Recipes").includes("Shakshuka"), folderNotes(mm, "Recipes").join(", "));
// A check that something is gone needs the file that says so.
check("the note Jonas moved out left the folder for Maja", mm !== null && !folderNotes(mm, "Recipes").includes("Lentil soup"));
check("Jonas keeps his copy in his own folder", folderNotes(jm, "My recipes").includes("Lentil soup"));
const jl = read("jonas-left.json");
check("after leaving, Maja's notes are gone from Jonas's Mac", jl !== null && !folderNotes(jl, "Recipes").includes("Pancakes"), folderNotes(jl, "Recipes").join(", "));
const je = read("jonas-end.json"), me = read("maja-end.json");
check("stop sharing: the folder is gone from Jonas's Mac", je !== null && !folderNotes(je, "Recipes").includes("Pancakes"));
check("stop sharing: Maja keeps her folder and notes", folderNotes(me, "Recipes").includes("Pancakes"));
for (const p of people) {
  const log = (() => { try { return Deno.readTextFileSync(`${out}/${p.name.toLowerCase()}.log`); } catch { return ""; } })();
  check(`${p.name}'s steps all ran`, log.includes("done") && !log.includes("FAILED"), log.split("\n").filter((l) => l.includes("FAILED")).join(" "));
}
console.log(`\n${results.filter((r) => r[1]).length}/${results.length} passed. Videos and logs: ${out}`);
Deno.exit(results.every((r) => r[1]) ? 0 : 1);
