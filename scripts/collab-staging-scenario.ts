// Shared notes end to end, as people and their AI (docs/Technical/collaboration-design.md).
// Devices are scripted the way the app talks to the server: Automerge documents, sealed with the note
// key, through PostgREST as the signed-in accounts, so row-level security is live. The AI is the
// stack's mcp function. Steps: a checklist shared by link with Can edit and joined; both tick and
// type at once and see each other's ticks; offline edits merge; the AI edits and both see it; the
// owner removes the member and the key is renewed; a viewer joins, can't write, leaves; the owner
// deletes it; normal notes stay untouched. Each step prints PASS or FAIL.
//
//   deno run -A scripts/collab-staging-scenario.ts --local   # the local stack (supabase start)
//   deno run -A scripts/collab-staging-scenario.ts           # staging
//
// --local reads the stack from `supabase status` and refuses anything but 127.0.0.1. Otherwise the
// ref comes from .secrets/staging.env and production's is refused. It makes four throwaway accounts
// (collab-live-<run>-*@example.com, through the admin API, confirmed and opted out of emails, so
// nothing is sent) and deletes them at the end, also when a step fails.
import { aesKey, fromBase64, hex, keyIdOf, newDataKey, recoveryKEK, seal, open, toBase64, tokenKey, Vault, verifierOf, wrap } from "../supabase/functions/_shared/e2ee.ts";
import { bytes, identityContext, linkKeys, newIdentity, noteKeyContext, open3, openNoteKey, seal3, sealNoteKey, text } from "../supabase/functions/_shared/collab.ts";
import { loadAutomerge } from "../supabase/functions/mcp/shared_notes.ts";
import { previewOf, titleOf } from "../supabase/functions/mcp/notes.ts";
const PROD = "rodegaeruhyybqilrnpn";
const root = new URL("..", import.meta.url).pathname;
const local = Deno.args.includes("--local");
let url: string, service: string, anon: string;
if (local) {
  const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env", "--workdir", root], stderr: "null" }).output()).stdout);
  const env = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
  url = env.API_URL; service = env.SERVICE_ROLE_KEY; anon = env.ANON_KEY;
  if (!url || !/^http:\/\/127\.0\.0\.1:/.test(url)) throw new Error(`Not a local stack: ${url}. Run supabase start.`);
} else {
  const common = new TextDecoder().decode((await new Deno.Command("git", { args: ["-C", root, "rev-parse", "--git-common-dir"] }).output()).stdout).trim();
  // .secrets lives in the main checkout, next to the shared .git (worktrees share it).
  const envText = await Deno.readTextFile(`${common.startsWith("/") ? common : root + common}/../.secrets/staging.env`);
  const ref = /^STAGING_REF=["']?([a-z0-9]+)/m.exec(envText)?.[1];
  if (!ref || ref === PROD) throw new Error("No staging ref, or it's production's. Refusing.");
  const keysOut = await new Deno.Command("npx", { args: ["-y", "supabase@2.120.0", "projects", "api-keys", "--project-ref", ref, "-o", "json"], stderr: "null" }).output();
  const keys = JSON.parse(new TextDecoder().decode(keysOut.stdout)) as { name: string; api_key: string }[];
  service = keys.find((k) => k.name === "service_role")!.api_key; anon = keys.find((k) => k.name === "anon")!.api_key;
  url = `https://${ref}.supabase.co`;
}
console.log(`Against ${local ? "the local stack" : "staging"}.`);
const admin = { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json" };
const run = crypto.randomUUID().slice(0, 8);
const made: string[] = [];
const cfg = { users: [] as { email: string; password: string; data_key: string }[] };
for (const name of ["emil", "sara", "eve", "jonas"]) {
  const email = `collab-live-${run}-${name}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
  // The local stack lets in only listed addresses (hook_before_user_created).
  if (local) await fetch(`${url}/rest/v1/signup_allowlist`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
  const res = await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { collab_live_test: true } }) });
  if (!res.ok) throw new Error(`Making ${name} failed: ${res.status}`);
  const { id } = await res.json();
  made.push(id);
  const stop = await fetch(`${url}/rest/v1/email_unsubscribes`, { method: "POST", headers: { ...admin, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ user_id: id, source: "link" }) });
  await stop.body?.cancel();
  cfg.users.push({ email, password, data_key: toBase64(crypto.getRandomValues(new Uint8Array(32))) });
}
async function cleanup() {
  for (const id of made) { const d = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: admin }); await d.body?.cancel(); }
  console.log(`Deleted the ${made.length} accounts collab-live-${run}-*.`);
}
const A = await loadAutomerge();
type Doc = ReturnType<typeof A.init<{ body?: string }>>;
const results: [string, boolean, string][] = [];
const step = async (name: string, fn: () => Promise<string | void>) => {
  try { const d = await fn(); results.push([name, true, d ?? ""]); console.log("PASS", name, d ?? ""); }
  catch (e) { results.push([name, false, String((e as Error).message)]); console.log("FAIL", name, (e as Error).message); }
};
const check = (c: unknown, what: string) => { if (!c) throw new Error(what); };

async function rest(p: any, path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const res = await fetch(url + "/rest/v1/" + path, { method: init.method ?? "GET", headers: { authorization: "Bearer " + p.jwt, apikey: anon, "content-type": "application/json",
    "x-amber-client": "lock-aware/1 e2ee/1 shared/1", "x-pane-device": p.device, ...(init.prefer ? { prefer: init.prefer } : {}) }, ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}) });
  const t = await res.text();
  if (!res.ok) { const e = new Error(path + ": " + res.status + " " + t); (e as any).status = res.status; throw e; }
  return t ? JSON.parse(t) : null;
}
const rpc = (p: any, fn: string, args: Record<string, unknown>) => rest(p, "rpc/" + fn, { method: "POST", body: args });

async function person(i: number, name: string, device: string) {
  const u = cfg.users[i];
  const login = await fetch(url + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email: u.email, password: u.password }) }).then((r) => r.json());
  const jwt = login.access_token as string, id = login.user.id as string;
  const dk = fromBase64(u.data_key), keyId = await keyIdOf(dk);
  const p: any = { name, jwt, id, dk, keyId, device };
  await rpc(p, "create_account_key", { p_key_id: keyId, p_verifier: await verifierOf(dk, id), p_recovery_wrap: await wrap(dk, await recoveryKEK(crypto.getRandomValues(new Uint8Array(16)), id), "recovery", id), p_generation: 0 });
  await rest(p, "profiles", { method: "POST", body: { display_name: name + " Test" } });
  p.identity = await newIdentity();
  await rpc(p, "collab_publish_identity", { p_public_key: toBase64(p.identity.publicRaw), p_private_wrap: await seal(toBase64(p.identity.d), await aesKey(dk), keyId, identityContext(id)) });
  p.vault = await Vault.from(dk.slice(), id);
  return p;
}
async function mcpSession(p: any) {
  const t = "pane_" + [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await rpc(p, "create_mcp_token", { token_name: "Claude", write_access: true, token_hash: hash, dk_wrap: await wrap(p.dk, await tokenKey(t, "pane"), "pane", p.id) });
  let sid: string | null = null, n = 1;
  const call = async (name: string, args: unknown) => {
    const res = await fetch(url + "/functions/v1/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: "Bearer " + t, ...(sid ? { "mcp-session-id": sid } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: n++, method: name === "initialize" ? "initialize" : "tools/call", params: name === "initialize" ? args : { name, arguments: args } }) });
    sid ??= res.headers.get("mcp-session-id");
    const b = await res.json();
    if (b.error) throw new Error(name + ": " + JSON.stringify(b.error));
    if (name !== "initialize" && b.result.isError) throw new Error(name + ": " + b.result.content[0].text);
    return b.result.structuredContent ?? b.result;
  };
  await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude", version: "1" } });
  return call;
}

/** A device's copy of a shared note. */
class Device {
  doc: Doc = A.init(); seen = new Set<string>(); outbox: Uint8Array[] = [];
  constructor(public p: any, public note: string, public nk: Uint8Array<ArrayBuffer>, public epoch = 1) {}
  edit(fn: (d: { body?: string }) => void) { this.doc = A.change(this.doc, fn); this.outbox.push(A.getLastLocalChange(this.doc)!); }
  async push() {
    for (const ch of this.outbox.splice(0)) {
      const [r] = await rest(this.p, "note_updates", { method: "POST", prefer: "return=representation", body: { note_id: this.note, epoch: this.epoch, ct: await seal3("u", ch as any, this.nk, this.note, this.epoch, this.p.id) } });
      this.seen.add(String(r.id));
    }
  }
  async pull() {
    const snaps = await rest(this.p, "note_snapshots?note_id=eq." + this.note + "&epoch=eq." + this.epoch + "&order=upto.desc&limit=1");
    let after = 0;
    if (snaps.length && !this.doc.body) { this.doc = A.loadIncremental(this.doc, await open3("s", snaps[0].ct, this.nk, this.note, String(snaps[0].upto))); after = Number(snaps[0].upto); }
    const rows = await rest(this.p, "note_updates?note_id=eq." + this.note + "&id=gt." + after + "&order=id");
    for (const r of rows) {
      if (this.seen.has(String(r.id)) || r.epoch !== this.epoch) continue;
      this.doc = A.loadIncremental(this.doc, await open3("u", r.ct, this.nk, this.note, r.author_id));
      this.seen.add(String(r.id));
    }
    return this.doc.body ?? "";
  }
}
const at = (d: Device) => d.doc.body!.length;
/** Ticks a checklist item on a device, as tapping its box does: one character, " " to "x". */
const tick = (d: Device, item: string) => {
  const i = d.doc.body!.indexOf("- [ ] " + item);
  check(i >= 0, "no unticked " + item + " on " + d.p.name);
  d.edit((doc) => A.splice(doc, ["body"], i + 3, 1, "x"));
};
const ticked = (body: string, item: string) => body.includes("- [x] " + item);
/** A new link for the note at its key's epoch, the way Share Link makes one. */
async function newLink(owner: any, note: string, nk: Uint8Array<ArrayBuffer>, epoch: number, role: "editor" | "viewer") {
  const link = toBase64(crypto.getRandomValues(new Uint8Array(16))).replace(/[+/=]/g, "z").slice(0, 22), secret = crypto.getRandomValues(new Uint8Array(16));
  const k = await linkKeys(secret, link);
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(k.answer.match(/../g)!, (h) => parseInt(h, 16)))));
  await rpc(owner, "collab_create_link", { p_link: link, p_note: note, p_role: role, p_epoch: epoch, p_answer_hash: answerHash, p_key_wrap: await seal(toBase64(nk), k.key, await keyIdOf(nk), "invite:" + link) });
  return { link, secret, answer: k.answer };
}
/** Someone opens a link in the app: proves the answer, opens the key, joins, gets a pointer note. */
async function join(p: any, note: string, l: { link: string; secret: Uint8Array<ArrayBuffer>; answer: string }, epoch: number) {
  const [o] = await rpc(p, "collab_open_link", { p_link: l.link, p_answer: l.answer });
  const nkJ = fromBase64(await open(o.key_wrap, (await linkKeys(l.secret, l.link)).key, "invite:" + l.link)) as Uint8Array<ArrayBuffer>;
  await rpc(p, "collab_join_link", { p_link: l.link, p_answer: l.answer, p_key_wrap: await sealNoteKey(nkJ, p.identity, p.identity.publicRaw, { note, epoch, from: p.id, to: p.id }),
    p_self_wrap: await seal(toBase64(nkJ), await aesKey(p.dk), p.keyId, noteKeyContext(note, epoch)) });
  const ptr = crypto.randomUUID();
  await rest(p, "notes", { method: "POST", body: { ...(await sealedNote(p, ptr, "Offsite plan\n\nThis note is shared.\n")), shared_note_id: note } });
  return { nk: nkJ, ptr };
}
/** The owner's device renews the note's key (after a removal or a leave) and re-seals the document. */
async function renew(owner: any, d: Device, note: string, removing: string | null, stay: any[] = []) {
  const nkN = newDataKey(), epoch = d.epoch + 1;
  const wraps = [];
  for (const p of [owner, ...stay]) wraps.push({ user_id: p.id, key_wrap: await sealNoteKey(nkN, owner.identity, p.identity.publicRaw, { note, epoch, from: owner.id, to: p.id }) });
  await rpc(owner, "collab_remove", { p_note: note, p_user: removing, p_epoch: epoch, p_wraps: wraps });
  await rpc(owner, "collab_accept", { p_note: note, p_self_wrap: await seal(toBase64(nkN), await aesKey(owner.dk), owner.keyId, noteKeyContext(note, epoch)) });
  const [{ id: upto }] = await rest(owner, "note_updates?note_id=eq." + note + "&order=id.desc&limit=1&select=id");
  d.nk = nkN; d.epoch = epoch;
  await rest(owner, "note_snapshots", { method: "POST", body: { note_id: note, upto, epoch, ct: await seal3("s", A.save(d.doc) as any, nkN, note, epoch, String(upto)) } });
  await rest(owner, "shared_notes?id=eq." + note, { method: "PATCH", body: { head_ct: await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nkN, note, epoch) } });
  return nkN;
}
const canOpen = async (ct: string, key: Uint8Array<ArrayBuffer>, note: string, author: string) => { try { await open3("u", ct, key, note, author); return true; } catch { return false; } };
const sealedNote = async (p: any, id: string, body: string) => ({ id, body_ct: await p.vault.sealBody(id, body), head_ct: await p.vault.sealHead(id, { title: titleOf(body), preview: previewOf(body) }) });

let ok = false;
try {
const emil = await person(0, "Emil", "Mac"), sara = await person(1, "Sara", "iPhone"), eve = await person(2, "Eve", "Mac"), jonas = await person(3, "Jonas", "iPhone");
const S = crypto.randomUUID();
let nk = newDataKey(), mac!: Device, phone!: Device;
const own: Record<string, { id: string; body: string }> = {};

await step("0. normal notes made on both accounts", async () => {
  for (const p of [emil, sara]) {
    const id = crypto.randomUUID(), body = p.name + "'s groceries\n\n- [ ] Milk\n- [ ] Bread\n";
    await rest(p, "notes", { method: "POST", body: await sealedNote(p, id, body) });
    own[p.name] = { id, body };
  }
});

await step("1. owner shares a checklist by link with Can edit, member joins, both tick at once and see each other's ticks", async () => {
  await rest(emil, "notes", { method: "POST", body: await sealedNote(emil, S, "Offsite plan\n\n(shared)\n") });
  await rpc(emil, "collab_share", { p_note: S, p_key_wrap: await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: S, epoch: 1, from: emil.id, to: emil.id }),
    p_self_wrap: await seal(toBase64(nk), await aesKey(emil.dk), emil.keyId, noteKeyContext(S, 1)), p_head_ct: await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, S, 1) });
  await rest(emil, "notes?id=eq." + S, { method: "PATCH", body: { shared_note_id: S } });
  mac = new Device(emil, S, nk);
  mac.edit((d) => { d.body = "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n- [ ] Order lunch\n- [ ] Print agenda\n"; });
  await mac.push();
  const l = await newLink(emil, S, nk, 1, "editor");
  const j = await join(sara, S, l, 1);
  check(hex(j.nk) === hex(nk), "link key mismatch");
  const [m] = await rest(sara, "note_members?note_id=eq." + S + "&user_id=eq." + sara.id + "&select=role");
  check(m?.role === "editor", "joined as " + JSON.stringify(m));
  phone = new Device(sara, S, j.nk);
  check((await phone.pull()).includes("- [ ] Book the venue"), "member can't read");
  // At once, before seeing each other's change: each ticks a different item, and she types a line.
  tick(mac, "Book the venue");
  tick(phone, "Order lunch");
  phone.edit((d) => A.splice(d, ["body"], "Offsite plan\n\n".length, 0, "Goal: a plan by Friday\n\n"));
  await Promise.all([mac.push(), phone.push()]);
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b, "diverged: " + JSON.stringify([a, b]));
  check(ticked(a, "Book the venue") && ticked(a, "Order lunch") && a.includes("by Friday") && a.includes("- [ ] Pick dates"), "ticks lost: " + JSON.stringify(a));
  // Both tick the same item at once: still one tick, nothing doubled.
  tick(mac, "Print agenda"); tick(phone, "Print agenda");
  await Promise.all([mac.push(), phone.push()]);
  const [c, e] = [await mac.pull(), await phone.pull()];
  check(c === e && ticked(c, "Print agenda") && c.split("Print agenda").length === 2 && !c.includes("[xx]"), "same tick twice: " + JSON.stringify(c));
  return "both: " + JSON.stringify(c);
});

await step("2. member goes offline, edits and ticks, comes back, the edits merge", async () => {
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Book the train\n"));
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Hotel for 6\n"));
  tick(phone, "Book the train");
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Ask about a projector\n"));
  tick(mac, "Ask about a projector");
  await mac.push();
  check(!(await mac.pull()).includes("Book the train"), "offline edit leaked early");
  await phone.push();
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b, "diverged: " + JSON.stringify([a, b]));
  check(ticked(a, "Book the train") && a.includes("- [ ] Hotel for 6") && ticked(a, "Ask about a projector") && ticked(a, "Order lunch"), "offline edits lost: " + JSON.stringify(a));
});

await step("3. the AI edits the shared note while both type, and both see it", async () => {
  const ai = await mcpSession(sara);
  const read = await ai("fetch", { id: "Offsite plan.md" }).catch(() => ai("fetch", { id: "Shared with me/Offsite plan.md" }));
  const path = read.id as string;
  check(ticked(read.text, "Book the venue") && ticked(read.text, "Book the train"), "AI reads old text: " + read.text);
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Name tags\n"));
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Dietary list\n"));
  await Promise.all([mac.push(), phone.push()]);
  const e = await ai("edit", { path, old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates: 3-4 November" });
  check(e.checks === "ok", JSON.stringify(e));
  tick(mac, "Hotel for 6");
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Taxi\n"));
  await Promise.all([mac.push(), phone.push()]);
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b, "diverged");
  for (const t of ["- [x] Pick dates: 3-4 November", "Name tags", "Dietary list", "- [x] Hotel for 6", "Taxi"]) check(a.includes(t), "missing " + t);
  // The owner's AI sees the same text.
  const mine = await mcpSession(emil);
  const o = await mine("fetch", { id: "Offsite plan.md" });
  check(o.text.includes("3-4 November") && o.text.includes("Taxi"), "owner's AI reads old text");
  const rows = await rest(emil, "note_updates?note_id=eq." + S + "&client=not.is.null&select=author_id,client");
  check(rows.length === 1 && rows[0].client === "Claude" && rows[0].author_id === sara.id, "attribution " + JSON.stringify(rows));
  return "AI at " + path;
});

await step("4. owner removes the member: new key, she can't read or write, her AI can't read on", async () => {
  const old = mac.nk;
  await renew(emil, mac, S, sara.id);
  const [s2] = await rest(emil, "shared_notes?id=eq." + S + "&select=epoch");
  check(s2.epoch === 2, "not renewed " + JSON.stringify(s2));
  check((await rest(emil, "note_members?note_id=eq." + S + "&select=user_id")).every((m: any) => m.user_id !== sara.id), "still a member");
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Secret after Sara was removed\n"));
  await mac.push();
  check((await rest(sara, "note_updates?note_id=eq." + S + "&select=id")).length === 0, "removed member still reads changes");
  check((await rest(sara, "shared_notes?id=eq." + S)).length === 0, "removed member still sees the note");
  const [last] = await rest(emil, "note_updates?note_id=eq." + S + "&order=id.desc&limit=1");
  check(!(await canOpen(last.ct, old, S, emil.id)), "old key opens new text");
  const w = await rest(sara, "note_updates", { method: "POST", body: { note_id: S, epoch: 1, ct: await seal3("u", bytes("x"), old, S, 1, sara.id) } }).then(() => null, (e) => e);
  check(w, "removed member could still write");
  const ai = await mcpSession(sara);
  const f = await ai("fetch", { id: "Offsite plan.md" }).catch(() => ai("fetch", { id: "Shared with me/Offsite plan.md" })).catch(() => null);
  check(!f || !String(f.text).includes("Secret after Sara was removed"), "removed member's AI reads new text");
});

await step("5. a viewer joins by a Can view link, reads, can't write, leaves, and the key renews", async () => {
  const l = await newLink(emil, S, mac.nk, 2, "viewer");
  const j = await join(eve, S, l, 2);
  const [m] = await rest(eve, "note_members?note_id=eq." + S + "&user_id=eq." + eve.id + "&select=role");
  check(m?.role === "viewer", "joined as " + JSON.stringify(m));
  const tab = new Device(eve, S, j.nk, 2);
  check((await tab.pull()).includes("Secret after Sara was removed"), "viewer can't read");
  tab.edit((d) => A.splice(d, ["body"], 0, 0, "x"));
  const w = await tab.push().then(() => null, (e) => e);
  check(w && String(w.message).includes("read_only"), "viewer could write: " + w);
  const ai = await mcpSession(eve);
  const e = await ai("edit", { path: "Offsite plan.md", old_string: "- [ ] Taxi", new_string: "- [x] Taxi" }).then(() => null, (e) => e)
    ?? await ai("edit", { path: "Shared with me/Offsite plan.md", old_string: "- [ ] Taxi", new_string: "- [x] Taxi" }).then(() => null, (e) => e);
  check(e, "viewer's AI could write");
  await rpc(eve, "collab_leave", { p_note: S });
  check((await rest(eve, "note_updates?note_id=eq." + S + "&select=id")).length === 0, "still reads after leaving");
  const [s] = await rest(emil, "shared_notes?id=eq." + S + "&select=rekey_after");
  check(s.rekey_after, "no rekey_after after a leave");
  await renew(emil, mac, S, null);
  const [s3] = await rest(emil, "shared_notes?id=eq." + S + "&select=epoch,rekey_after");
  check(s3.epoch === 3 && !s3.rekey_after, "not renewed " + JSON.stringify(s3));
});

await step("6. owner deletes: gone for the member, in the owner's Recently Deleted with its text", async () => {
  const l = await newLink(emil, S, mac.nk, 3, "editor");
  const j = await join(jonas, S, l, 3);
  const tab = new Device(jonas, S, j.nk, 3);
  check(ticked(await tab.pull(), "Hotel for 6"), "Jonas can't read");
  const ai = await mcpSession(emil);
  await ai("fetch", { id: "Offsite plan.md" });
  const d = await ai("delete", { path: "Offsite plan.md" });
  check(d.now_at === "Recently Deleted/Offsite plan.md", JSON.stringify(d));
  check((await rest(jonas, "note_updates?note_id=eq." + S + "&select=id")).length === 0, "Jonas still reads");
  check((await rest(jonas, "shared_notes?id=eq." + S)).length === 0, "shared note still there");
  const [ep] = await rest(jonas, "notes?id=eq." + j.ptr + "&select=deleted_at");
  check(ep.deleted_at, "Jonas's pointer not deleted");
  const back = await ai("fetch", { id: "Recently Deleted/Offsite plan.md" });
  check(back.text.includes("Secret after Sara was removed") && back.text.includes("3-4 November") && ticked(back.text, "Book the venue"), "text not kept: " + back.text);
});

await step("7. normal notes untouched on both accounts", async () => {
  for (const p of [emil, sara]) {
    const [r] = await rest(p, "notes?id=eq." + own[p.name].id + "&select=body_ct,shared_note_id,deleted_at,trashed_at");
    check(!r.shared_note_id && !r.deleted_at && !r.trashed_at, "row changed " + JSON.stringify(r));
    check(await p.vault.openBody(own[p.name].id, r.body_ct) === own[p.name].body, "body changed");
    const ai = await mcpSession(p);
    const f = await ai("fetch", { id: p.name + "'s groceries.md" });
    check(f.text.includes("Milk"), "AI can't read it");
    await ai("edit", { path: p.name + "'s groceries.md", old_string: "- [ ] Milk", new_string: "- [x] Milk" });
    const [r2] = await rest(p, "notes?id=eq." + own[p.name].id + "&select=body_ct");
    check((await p.vault.openBody(own[p.name].id, r2.body_ct)).includes("- [x] Milk"), "normal edit didn't save");
  }
});
  ok = results.every((r) => r[1]);
} finally {
  await cleanup();
}
console.log(JSON.stringify(results.map(([n, ok]) => [n, ok])));
Deno.exit(ok ? 0 : 1);
