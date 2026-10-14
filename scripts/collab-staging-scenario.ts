// Shared notes on staging, end to end, as two people and their AI (docs/Technical/collaboration-design.md).
// Devices are scripted the way the app talks to the server: Automerge documents, sealed with the note
// key, through PostgREST as the signed-in accounts, so row-level security is live. The AI is the
// deployed mcp function. Steps: share by link and join; both type at once and converge; offline edits
// arrive; the AI edits while both type; a member leaves and the key is renewed; the owner deletes it;
// normal notes stay untouched. Each step prints PASS or FAIL.
//
//   deno run -A scripts/collab-staging-scenario.ts
//
// Staging only: the ref comes from .secrets/staging.env and production's is refused. It makes three
// throwaway accounts (collab-live-<run>-*@example.com, through the admin API, confirmed and opted out
// of emails, so nothing is sent) and deletes them at the end, also when a step fails.
import { aesKey, fromBase64, hex, keyIdOf, newDataKey, recoveryKEK, seal, open, toBase64, tokenKey, Vault, verifierOf, wrap } from "../supabase/functions/_shared/e2ee.ts";
import { bytes, identityContext, linkKeys, newIdentity, noteKeyContext, open3, openNoteKey, seal3, sealNoteKey, text } from "../supabase/functions/_shared/collab.ts";
import { loadAutomerge } from "../supabase/functions/mcp/shared_notes.ts";
import { previewOf, titleOf } from "../supabase/functions/mcp/notes.ts";
const PROD = "rodegaeruhyybqilrnpn";
const root = new URL("..", import.meta.url).pathname;
const common = new TextDecoder().decode((await new Deno.Command("git", { args: ["-C", root, "rev-parse", "--git-common-dir"] }).output()).stdout).trim();
// .secrets lives in the main checkout, next to the shared .git (worktrees share it).
const envText = await Deno.readTextFile(`${common.startsWith("/") ? common : root + common}/../.secrets/staging.env`);
const ref = /^STAGING_REF=["']?([a-z0-9]+)/m.exec(envText)?.[1];
if (!ref || ref === PROD) throw new Error("No staging ref, or it's production's. Refusing.");
const keysOut = await new Deno.Command("npx", { args: ["-y", "supabase@2.120.0", "projects", "api-keys", "--project-ref", ref, "-o", "json"], stderr: "null" }).output();
const keys = JSON.parse(new TextDecoder().decode(keysOut.stdout)) as { name: string; api_key: string }[];
const service = keys.find((k) => k.name === "service_role")!.api_key, anon = keys.find((k) => k.name === "anon")!.api_key;
const url = `https://${ref}.supabase.co`;
const admin = { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json" };
const run = crypto.randomUUID().slice(0, 8);
const made: string[] = [];
const cfg = { users: [] as { email: string; password: string; data_key: string }[] };
for (const name of ["emil", "sara", "eve"]) {
  const email = `collab-live-${run}-${name}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
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
    "x-amber-client": "lock-aware/1 e2ee/1", "x-pane-device": p.device, ...(init.prefer ? { prefer: init.prefer } : {}) }, ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}) });
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
const sealedNote = async (p: any, id: string, body: string) => ({ id, body_ct: await p.vault.sealBody(id, body), head_ct: await p.vault.sealHead(id, { title: titleOf(body), preview: previewOf(body) }) });

let ok = false;
try {
const emil = await person(0, "Emil", "Mac"), sara = await person(1, "Sara", "iPhone"), eve = await person(2, "Eve", "Mac");
const S = crypto.randomUUID();
let nk = newDataKey(), mac!: Device, phone!: Device, link = "", answer = "";
const own: Record<string, { id: string; body: string }> = {};

await step("0. normal notes made on both accounts", async () => {
  for (const p of [emil, sara]) {
    const id = crypto.randomUUID(), body = p.name + "'s groceries\n\n- [ ] Milk\n- [ ] Bread\n";
    await rest(p, "notes", { method: "POST", body: await sealedNote(p, id, body) });
    own[p.name] = { id, body };
  }
});

await step("1. owner shares by link, member joins, both type at once and converge", async () => {
  await rest(emil, "notes", { method: "POST", body: await sealedNote(emil, S, "Offsite plan\n\n(shared)\n") });
  await rpc(emil, "collab_share", { p_note: S, p_key_wrap: await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: S, epoch: 1, from: emil.id, to: emil.id }),
    p_self_wrap: await seal(toBase64(nk), await aesKey(emil.dk), emil.keyId, noteKeyContext(S, 1)), p_head_ct: await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, S, 1) });
  await rest(emil, "notes?id=eq." + S, { method: "PATCH", body: { shared_note_id: S } });
  mac = new Device(emil, S, nk);
  mac.edit((d) => { d.body = "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n"; });
  await mac.push();
  link = toBase64(crypto.getRandomValues(new Uint8Array(16))).replace(/[+/=]/g, "x").slice(0, 22);
  const secret = crypto.getRandomValues(new Uint8Array(16));
  const k = await linkKeys(secret, link); answer = k.answer;
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(answer.match(/../g)!, (h) => parseInt(h, 16)))));
  await rpc(emil, "collab_create_link", { p_link: link, p_note: S, p_role: "editor", p_epoch: 1, p_answer_hash: answerHash, p_key_wrap: await seal(toBase64(nk), k.key, await keyIdOf(nk), "invite:" + link) });
  // Sara opens the link: proves the answer, opens NK with the link's key, seals it to herself, joins.
  const [o] = await rpc(sara, "collab_open_link", { p_link: link, p_answer: answer });
  const nkS = fromBase64(await open(o.key_wrap, (await linkKeys(secret, link)).key, "invite:" + link));
  check(hex(nkS) === hex(nk), "link key mismatch");
  await rpc(sara, "collab_join_link", { p_link: link, p_answer: answer, p_key_wrap: await sealNoteKey(nkS, sara.identity, sara.identity.publicRaw, { note: S, epoch: 1, from: sara.id, to: sara.id }),
    p_self_wrap: await seal(toBase64(nkS), await aesKey(sara.dk), sara.keyId, noteKeyContext(S, 1)) });
  await rest(sara, "notes", { method: "POST", body: { ...(await sealedNote(sara, crypto.randomUUID(), "Offsite plan\n\nThis note is shared.\n")), shared_note_id: S } });
  phone = new Device(sara, S, nkS);
  check((await phone.pull()).includes("Book the venue"), "member can't read");
  // At once: both edit from the same text before seeing each other's change.
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Order lunch\n"));
  phone.edit((d) => A.splice(d, ["body"], 0 + "Offsite plan\n\n".length, 0, "Goal: a plan by Friday\n\n"));
  await Promise.all([mac.push(), phone.push()]);
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b && a.includes("Order lunch") && a.includes("by Friday"), "diverged: " + JSON.stringify([a, b]));
  return "both: " + JSON.stringify(a);
});

await step("2. member offline edits, comes back, edits arrive", async () => {
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Book the train\n"));
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Hotel for 6\n"));
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Ask about a projector\n"));
  await mac.push();
  check(!(await mac.pull()).includes("Book the train"), "offline edit leaked early");
  await phone.push();
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b && a.includes("Book the train") && a.includes("Hotel for 6") && a.includes("projector"), "offline edits lost: " + JSON.stringify([a, b]));
});

await step("3. the AI edits while both type", async () => {
  const ai = await mcpSession(sara);
  const read = await ai("fetch", { id: "Offsite plan.md" }).catch(() => ai("fetch", { id: "Shared with me/Offsite plan.md" }));
  const path = read.id as string;
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Name tags\n"));
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Dietary list\n"));
  await Promise.all([mac.push(), phone.push()]);
  const e = await ai("edit", { path, old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates: 3-4 November" });
  check(e.checks === "ok", JSON.stringify(e));
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Slides\n"));
  phone.edit((d) => A.splice(d, ["body"], at(phone), 0, "- [ ] Taxi\n"));
  await Promise.all([mac.push(), phone.push()]);
  const [a, b] = [await mac.pull(), await phone.pull()];
  check(a === b, "diverged");
  for (const s of ["3-4 November", "Name tags", "Dietary list", "Slides", "Taxi"]) check(a.includes(s), "missing " + s);
  const rows = await rest(emil, "note_updates?note_id=eq." + S + "&client=not.is.null&select=author_id,client");
  check(rows.length === 1 && rows[0].client === "Claude" && rows[0].author_id === sara.id, "attribution " + JSON.stringify(rows));
  return "AI at " + path;
});

let leftText = "";
await step("4. member leaves, key renews, old key can't read new text", async () => {
  const ai = await mcpSession(sara);
  const list = await ai("list", { pattern: "**/*.md" });
  const path = list.matches.find((m: any) => m.shared).path;
  const d = await ai("delete", { path });
  check(d.left === path, JSON.stringify(d));
  check((await rest(sara, "note_updates?note_id=eq." + S + "&select=id")).length === 0, "member still reads changes");
  const [s] = await rest(emil, "shared_notes?id=eq." + S + "&select=epoch,rekey_after");
  check(s.rekey_after, "no rekey_after");
  // Emil's Mac notices and renews the key without her, then seals a snapshot and new text with it.
  const nk2 = newDataKey();
  await rpc(emil, "collab_remove", { p_note: S, p_user: null, p_epoch: 2, p_wraps: [{ user_id: emil.id, key_wrap: await sealNoteKey(nk2, emil.identity, emil.identity.publicRaw, { note: S, epoch: 2, from: emil.id, to: emil.id }) }] });
  await rpc(emil, "collab_accept", { p_note: S, p_self_wrap: await seal(toBase64(nk2), await aesKey(emil.dk), emil.keyId, noteKeyContext(S, 2)) });
  const [s2] = await rest(emil, "shared_notes?id=eq." + S + "&select=epoch,rekey_after");
  check(s2.epoch === 2 && !s2.rekey_after, "not renewed " + JSON.stringify(s2));
  const [{ id: upto }] = await rest(emil, "note_updates?note_id=eq." + S + "&order=id.desc&limit=1&select=id");
  mac.nk = nk2; mac.epoch = 2;
  await rest(emil, "note_snapshots", { method: "POST", body: { note_id: S, upto, epoch: 2, ct: await seal3("s", A.save(mac.doc) as any, nk2, S, 2, String(upto)) } });
  await rest(emil, "shared_notes?id=eq." + S, { method: "PATCH", body: { head_ct: await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk2, S, 2) } });
  mac.edit((d) => A.splice(d, ["body"], at(mac), 0, "- [ ] Secret after Sara left\n"));
  await mac.push();
  const [last] = await rest(emil, "note_updates?note_id=eq." + S + "&order=id.desc&limit=1");
  let opened = true;
  try { await open3("u", last.ct, nk, S, emil.id); } catch { opened = false; }
  check(!opened, "old key opens new text");
  // Her old key can't write either.
  const w = await rest(sara, "note_updates", { method: "POST", body: { note_id: S, epoch: 1, ct: await seal3("u", bytes("x"), nk, S, 1, sara.id) } }).then(() => null, (e) => e);
  check(w, "member could still write");
  const [ptr] = await rest(sara, "notes?shared_note_id=eq." + S + "&select=deleted_at");
  check(!ptr || ptr.deleted_at, "pointer not gone");
  leftText = mac.doc.body!;
});

await step("5. owner deletes: gone for the member, in owner's Recently Deleted", async () => {
  // Eve joins with a new link first, so there is a member when it's deleted.
  const nk2 = mac.nk, link2 = toBase64(crypto.getRandomValues(new Uint8Array(16))).replace(/[+/=]/g, "y").slice(0, 22), secret = crypto.getRandomValues(new Uint8Array(16));
  const k = await linkKeys(secret, link2);
  const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(k.answer.match(/../g)!, (h) => parseInt(h, 16)))));
  await rpc(emil, "collab_create_link", { p_link: link2, p_note: S, p_role: "editor", p_epoch: 2, p_answer_hash: answerHash, p_key_wrap: await seal(toBase64(nk2), k.key, await keyIdOf(nk2), "invite:" + link2) });
  await rpc(eve, "collab_join_link", { p_link: link2, p_answer: k.answer, p_key_wrap: await sealNoteKey(nk2, eve.identity, eve.identity.publicRaw, { note: S, epoch: 2, from: eve.id, to: eve.id }),
    p_self_wrap: await seal(toBase64(nk2), await aesKey(eve.dk), eve.keyId, noteKeyContext(S, 2)) });
  const evePtr = crypto.randomUUID();
  await rest(eve, "notes", { method: "POST", body: { ...(await sealedNote(eve, evePtr, "Offsite plan\n\nThis note is shared.\n")), shared_note_id: S } });
  const tab = new Device(eve, S, nk2, 2);
  check((await tab.pull()).includes("Secret after Sara left"), "Eve can't read");
  const ai = await mcpSession(emil);
  await ai("fetch", { id: "Offsite plan.md" });
  const d = await ai("delete", { path: "Offsite plan.md" });
  check(d.now_at === "Recently Deleted/Offsite plan.md", JSON.stringify(d));
  check((await rest(eve, "note_updates?note_id=eq." + S + "&select=id")).length === 0, "Eve still reads");
  check((await rest(eve, "shared_notes?id=eq." + S)).length === 0, "shared note still there");
  const [ep] = await rest(eve, "notes?id=eq." + evePtr + "&select=deleted_at");
  check(ep.deleted_at, "Eve's pointer not deleted");
  const back = await ai("fetch", { id: "Recently Deleted/Offsite plan.md" });
  check(back.text.includes("Secret after Sara left") && back.text.includes("3-4 November"), "text not kept: " + back.text);
});

await step("6. normal notes untouched on both accounts", async () => {
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
