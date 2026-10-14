// End-to-end: a shared note through the running MCP server, with row-level security live through
// PostgREST. Emil shares a note and types on his "Mac" (Automerge here, sealed as the app seals it);
// Sara joins; her AI lists, reads and edits it over MCP; Emil's Mac merges the AI's change. LOCAL
// stack only:
//   scripts/mcp-e2e.sh shared_notes.e2e.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { aesKey, keyIdOf, newDataKey, recoveryKEK, seal, toBase64, tokenKey, verifierOf, wrap } from "../_shared/e2ee.ts";
import { bytes, identityContext, newIdentity, noteKeyContext, open3, seal3, sealNoteKey } from "../_shared/collab.ts";
import { loadAutomerge } from "./shared_notes.ts";

const api = Deno.env.get("PANE_API"), anon = Deno.env.get("PANE_ANON"), url = Deno.env.get("PANE_MCP_URL");
const enabled = Boolean(api && anon && url && /^http:\/\/127\.0\.0\.1:/.test(api ?? ""));

async function rest(jwt: string, path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const res = await fetch(`${api}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${jwt}`, apikey: anon!, "content-type": "application/json", ...(init.prefer ? { prefer: init.prefer } : {}) },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
const rpc = (jwt: string, fn: string, args: Record<string, unknown>) => rest(jwt, `rpc/${fn}`, { method: "POST", body: args });

/** The local stack's service key, as scripts/dev-user.ts reads it. */
async function serviceKey(): Promise<string> {
  const out = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env"], stderr: "null" }).output()).stdout);
  return /^SERVICE_ROLE_KEY="?([^"\n]+)"?$/m.exec(out)![1];
}

/** A fresh account as the app makes it: signed in, a data key, a profile name, an identity key. */
async function person(name: string) {
  const email = `${name.toLowerCase()}-collab-e2e-${crypto.randomUUID().slice(0, 8)}@pane.local`, password = "pane-dev-password-1";
  const service = await serviceKey();
  await fetch(`${api}/rest/v1/signup_allowlist`, { method: "POST", headers: { authorization: `Bearer ${service}`, apikey: service, "content-type": "application/json" }, body: JSON.stringify({ email }) }).then((r) => r.body?.cancel());
  const made = await fetch(`${api}/auth/v1/admin/users`, { method: "POST", headers: { authorization: `Bearer ${service}`, apikey: service, "content-type": "application/json" }, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json());
  if (!made.id) throw new Error(`no account for ${email}: ${JSON.stringify(made)}`);
  const login = await fetch(`${api}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon!, "content-type": "application/json" }, body: JSON.stringify({ email, password }) }).then((r) => r.json());
  const jwt = login.access_token as string, id = made.id as string;
  const dk = newDataKey(), keyId = await keyIdOf(dk);
  await rpc(jwt, "create_account_key", { p_key_id: keyId, p_verifier: await verifierOf(dk, id), p_recovery_wrap: await wrap(dk, await recoveryKEK(crypto.getRandomValues(new Uint8Array(16)), id), "recovery", id), p_generation: 0 });
  await rest(jwt, "profiles", { method: "POST", body: { display_name: `${name} Lind` } });
  const identity = await newIdentity();
  await rpc(jwt, "collab_publish_identity", { p_public_key: toBase64(identity.publicRaw), p_private_wrap: await seal(toBase64(identity.d), await aesKey(dk), keyId, identityContext(id)) });
  return { name, jwt, id, dk, keyId, identity };
}
type Person = Awaited<ReturnType<typeof person>>;
const selfWrap = async (p: Person, nk: Uint8Array<ArrayBuffer>, note: string) => await seal(toBase64(nk), await aesKey(p.dk), p.keyId, noteKeyContext(note, 1));

async function mcpToken(p: Person) {
  const t = `pane_${[...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  await rpc(p.jwt, "create_mcp_token", { token_name: "Claude", write_access: true, token_hash: hash, dk_wrap: await wrap(p.dk, await tokenKey(t, "pane"), "pane", p.id) });
  return t;
}

let nextId = 1;
function session(auth: string) {
  let sid: string | null = null;
  // deno-lint-ignore no-explicit-any
  const rpcMcp = async (method: string, params?: unknown): Promise<any> => {
    const res = await fetch(url!, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${auth}`, ...(sid ? { "mcp-session-id": sid } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    });
    sid ??= res.headers.get("mcp-session-id");
    return await res.json();
  };
  // deno-lint-ignore no-explicit-any
  const call = async (name: string, args: Record<string, unknown> = {}): Promise<{ error: boolean; text: string; data: any; ms: number }> => {
    const t = performance.now();
    const { result, error } = await rpcMcp("tools/call", { name, arguments: args });
    const ms = Math.round(performance.now() - t);
    if (error) return { error: true, text: error.message, data: undefined, ms };
    return { error: result.isError === true, text: result.content[0].text, data: result.structuredContent, ms };
  };
  return { rpc: rpcMcp, call };
}

Deno.test({ name: "shared notes: a member's AI reads and edits a shared note on the running server, and it merges", ignore: !enabled }, async () => {
  const A = await loadAutomerge();
  const emil = await person("Emil"), sara = await person("Sara");
  // Emil shares a note: the shared document, his membership, and his Mac's first change.
  const id = crypto.randomUUID(), nk = newDataKey();
  await rpc(emil.jwt, "collab_share", {
    p_note: id, p_key_wrap: await sealNoteKey(nk, emil.identity, emil.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: emil.id }),
    p_self_wrap: await selfWrap(emil, nk, id), p_head_ct: await seal3("h", bytes(JSON.stringify({ title: "Offsite plan" })), nk, id, 1),
  });
  let mac = A.init<{ body?: string }>();
  const push = async (fn: (d: { body?: string }) => void) => {
    mac = A.change(mac, fn);
    await rest(emil.jwt, "note_updates", { method: "POST", body: { note_id: id, epoch: 1, ct: await seal3("u", A.getLastLocalChange(mac)! as Uint8Array<ArrayBuffer>, nk, id, 1, emil.id) } });
  };
  await push((d) => { d.body = "Offsite plan\n\n- [ ] Book the venue\n- [ ] Pick dates\n"; });
  // Sara is invited as an editor and accepts.
  await rpc(emil.jwt, "collab_invite", { p_note: id, p_user: sara.id, p_role: "editor", p_epoch: 1,
    p_key_wrap: await sealNoteKey(nk, emil.identity, sara.identity.publicRaw, { note: id, epoch: 1, from: emil.id, to: sara.id }) });
  await rpc(sara.jwt, "collab_accept", { p_note: id, p_self_wrap: await selfWrap(sara, nk, id) });

  const { rpc: init, call } = session(await mcpToken(sara));
  await init("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Claude", version: "1" } });
  const listed = await call("list", { path: "Shared with me/" });
  assert(!listed.error, listed.text);
  assertEquals(listed.data.entries.map((e: { path: string }) => e.path), ["Shared with me/Offsite plan.md"]);
  const read = await call("fetch", { id: "Shared with me/Offsite plan.md" });
  assert(!read.error, read.text);
  assertStringIncludes(read.data.text, "Book the venue");
  // Emil types after the AI read it; the AI's edit merges with that.
  await push((d) => A.splice(d, ["body"], d.body!.length, 0, "- [ ] Order lunch\n"));
  const edited = await call("edit", { path: "Shared with me/Offsite plan.md", old_string: "- [ ] Pick dates", new_string: "- [x] Pick dates: 3-4 November" });
  assert(!edited.error, edited.text);
  console.log(`list ${listed.ms} ms (first shared-note call: Automerge loads), fetch ${read.ms} ms, edit ${edited.ms} ms`);

  // Emil's Mac pulls everything through PostgREST as Emil and merges.
  const rows = await rest(emil.jwt, `note_updates?note_id=eq.${id}&order=id`);
  for (const r of rows) mac = A.loadIncremental(mac, await open3("u", r.ct, nk, id, r.author_id));
  assertEquals(mac.body, "Offsite plan\n\n- [ ] Book the venue\n- [x] Pick dates: 3-4 November\n- [ ] Order lunch\n");
  const last = rows[rows.length - 1];
  assertEquals([last.author_id, last.client], [sara.id, "Claude"]);
  assertEquals(rows.slice(0, -1).map((r: { client: string | null }) => r.client), [null, null]);
});
