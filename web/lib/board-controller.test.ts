// A whiteboard's link opened in a browser (board-controller.ts) against a stand-in for the server:
// a broken or stopped link, a board opening live and read only with its title, what "Sign in to
// edit" asks, and that neither the link's secret nor the board's key ever goes to the server.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadAutomerge } from "./automerge";
import { BoardController } from "./board-controller";
import type { Automerge } from "./board-doc";
import { linkKeys, seal3 } from "./collab";
import { type Bytes, seal, toBase64 } from "./e2ee";

// No live channel here: the board is read and written through the tables alone.
vi.mock("./board-transport", async (actual) => ({ ...(await actual<typeof import("./board-transport")>()), realtimeFor: () => null }));

const wasm = readFileSync(createRequire(import.meta.url).resolve("@automerge/automerge/automerge.wasm"));
let A: Automerge;
beforeAll(async () => { A = await loadAutomerge(wasm); });

const NOTE = "6f1c1b0e-2a7d-4c55-9a43-1d2e3f405162", EMIL = "11111111-1111-4111-8111-111111111111";
const LINK = "Ab3dEf6hIj9kLm2nOp5qRs";
const SECRET_BYTES = crypto.getRandomValues(new Uint8Array(16)) as Bytes;
const SECRET = btoa(String.fromCharCode(...SECRET_BYTES)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const nk = crypto.getRandomValues(new Uint8Array(32)) as Bytes;
const API = "http://127.0.0.1:56421";

class Memory {
  map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

type Call = { url: string; body: string };
type Reply = { status?: number; json: unknown };

/** The server: the link's RPCs and the sign-in endpoints, each answering as the real one does. */
async function server(o: { role?: string; known?: boolean; board?: boolean; otp?: Reply; verify?: Reply; name?: string | null; member?: string } = {}) {
  const lk = await linkKeys(SECRET_BYTES, LINK);
  const doc = A.change(A.init<Record<string, unknown>>(), { message: `u:${EMIL.toUpperCase()}` }, (d) => {
    d.body = "Launch plan";
    if (o.board !== false) { d.board = { "mac-1": JSON.stringify({ id: "mac-1", type: "rectangle", x: 40, y: 80, width: 100, height: 60, version: 1, versionNonce: 1 }) }; d.boardState = {}; }
  });
  const update = { id: 1, author_id: EMIL, epoch: 1, ct: await seal3("u", A.getLastLocalChange(doc)! as Bytes, nk, NOTE, 1, EMIL), client: null };
  const row = {
    note_id: NOTE.toUpperCase(), role: o.role ?? "editor", epoch: 1, owner_name: "Emil Wagman",
    key_wrap: await seal(toBase64(nk), lk.key, "0123456789abcdef", `invite:${LINK.toLowerCase()}`),
    head_ct: await seal3("h", new TextEncoder().encode(JSON.stringify({ title: "Launch plan" })) as Bytes, nk, NOTE, 1),
  };
  const calls: Call[] = [];
  const reply = (r: Reply) => new Response(JSON.stringify(r.json), { status: r.status ?? 200, headers: { "content-type": "application/json" } });
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input), body = typeof init?.body === "string" ? init.body : "";
    calls.push({ url, body });
    const path = url.slice(API.length);
    if (path === "/rest/v1/rpc/collab_open_link") return reply({ json: o.known === false ? [] : JSON.parse(body).p_answer === lk.answer ? [row] : [] });
    if (path === "/rest/v1/rpc/collab_link_pull") return reply({ json: { snapshot: null, updates: JSON.parse(body).p_after < 1 ? [update] : [], more: false } });
    if (path === "/auth/v1/otp") return reply(o.otp ?? { json: {} });
    if (path.startsWith("/auth/v1/verify")) return reply(o.verify ?? { status: 403, json: { error_code: "otp_expired", msg: "Token has expired or is invalid" } });
    if (path.startsWith("/rest/v1/profiles")) return reply({ json: o.name ? [{ display_name: o.name }] : [] });
    if (path.startsWith("/rest/v1/note_members")) return reply({ json: o.member ? [{ role: o.member }] : [] });
    if (path.startsWith("/rest/v1/note_snapshots")) return reply({ json: [] });
    if (path.startsWith("/rest/v1/note_updates")) return reply({ json: Number(/id=gt\.(\d+)/.exec(path)?.[1] ?? 0) < 1 ? [update] : [] });
    if (path === "/rest/v1/rpc/collab_members") return reply({ json: [] });
    return reply({ status: 404, json: { message: "not here" } });
  }) as typeof fetch;
  return { f, calls, lk };
}

let open: BoardController[] = [];
afterEach(() => { for (const c of open) c.close(); open = []; });

function controller(f: typeof fetch, over: Partial<{ id: string; secret: string; storage: Memory }> = {}) {
  const c = new BoardController({ supabaseURL: API, anonKey: "anon", id: over.id ?? LINK, secret: over.secret ?? SECRET, storage: (over.storage ?? new Memory()) as unknown as Storage, fetch: f, wasm });
  open.push(c);
  return c;
}

describe("a whiteboard's link in the browser", () => {
  it("a link with no secret, or a malformed one, says so and asks the server nothing", async () => {
    const { f, calls } = await server();
    for (const [id, secret] of [[LINK, ""], [LINK, "short"], ["not a link", SECRET]]) {
      const c = controller(f, { id, secret });
      await c.open();
      expect(c.phase).toBe("broken");
    }
    expect(calls).toEqual([]);
  });

  it("a link that was stopped, or a wrong secret, is gone", async () => {
    const stopped = await server({ known: false });
    const c = controller(stopped.f);
    await c.open();
    expect(c.phase).toBe("gone");
    const wrong = controller((await server()).f, { secret: "A".repeat(22) });
    await wrong.open();
    expect(wrong.phase).toBe("gone");
  });

  it("an Edit link opens the board live and read only, with its title and its owner, and offers Sign in to edit", async () => {
    const { f } = await server();
    const c = controller(f);
    const sent: Record<string, unknown>[] = [];
    c.attach((m) => sent.push(m));
    c.fromCanvas({ load: "1", tool: "selection" });
    await c.open();
    expect(c.phase).toBe("board");
    expect(c.title).toBe("Launch plan");
    expect(c.owner).toBe("Emil");
    expect(c.linkRole).toBe("editor");
    expect(c.canEdit).toBe(false);
    expect(c.offersSignIn).toBe(true);
    // The page loaded before the board opened: it still gets everything, read only.
    expect(sent.find((m) => m.op === "shared")).toEqual({ op: "shared", on: true, viewOnly: true });
    const scene = sent.find((m) => m.op === "remoteScene")!.scene as { elements: { id: string }[] };
    expect(scene.elements.map((e) => e.id)).toEqual(["mac-1"]);
  });

  it("a View link opens read only and offers no sign-in", async () => {
    const c = controller((await server({ role: "viewer" })).f);
    await c.open();
    expect(c.phase).toBe("board");
    expect(c.offersSignIn).toBe(false);
  });

  it("a shared note that isn't a whiteboard opens in the app instead", async () => {
    const c = controller((await server({ board: false })).f);
    await c.open();
    expect(c.phase).toBe("note");
  });

  it("the link's secret and the board's key never reach the server; only the answer the secret makes does", async () => {
    const { f, calls, lk } = await server();
    const c = controller(f);
    await c.open();
    c.startSignIn();
    await c.sendCode("sara@example.com");
    const all = calls.map((x) => x.url + " " + x.body).join("\n");
    expect(all).not.toContain(SECRET);
    expect(all).not.toContain(toBase64(nk));
    expect(all).not.toContain(toBase64(SECRET_BYTES));
    expect(all).toContain(lk.answer);
  });

  it("Sign in to edit: an email code that makes an account for a new email", async () => {
    const { f, calls } = await server();
    const c = controller(f);
    await c.open();
    c.startSignIn();
    expect(c.signIn).toMatchObject({ step: "email" });
    await c.sendCode(" sara@example.com ");
    expect(c.signIn).toMatchObject({ step: "code", email: "sara@example.com", error: null });
    expect(JSON.parse(calls.find((x) => x.url.endsWith("/auth/v1/otp"))!.body)).toEqual({ email: "sara@example.com", create_user: true });
  });

  it("an email the stack won't make an account for says so plainly", async () => {
    const c = controller((await server({ otp: { status: 403, json: { error_code: "hook_failed", msg: "New accounts are made with Sign in with Apple or Google." } } })).f);
    await c.open();
    c.startSignIn();
    await c.sendCode("sara@example.com");
    expect(c.signIn).toMatchObject({ step: "email", error: "Pinto Notes can’t make an account for this email yet. Sign up in the app first." });
  });

  it("a wrong code stays on the code step and says so; a right one for someone new asks their name", async () => {
    const wrong = controller((await server()).f);
    await wrong.open();
    wrong.startSignIn();
    await wrong.sendCode("sara@example.com");
    await wrong.verify("000000");
    expect(wrong.signIn?.step).toBe("code");
    expect(wrong.signIn?.error).toBeTruthy();
    expect(wrong.account).toBeNull();

    const session = { access_token: "at", refresh_token: "rt", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "22222222-2222-4222-8222-222222222222", email: "sara@example.com" } };
    const right = controller((await server({ verify: { json: session } })).f);
    await right.open();
    right.startSignIn();
    await right.sendCode("sara@example.com");
    await right.verify("123456");
    expect(right.account).toMatchObject({ id: "22222222-2222-4222-8222-222222222222", email: "sara@example.com", name: null });
    expect(right.signIn?.step).toBe("name");
  });

  it("someone already in the board opens it as a member, and its tools show only once the canvas can draw", async () => {
    const storage = new Memory();
    storage.setItem("pinto.connect.session", JSON.stringify({ access_token: "at", refresh_token: "rt", user_id: "22222222-2222-4222-8222-222222222222", email: "sara@example.com" }));
    const { f } = await server({ member: "editor", name: "Sara Berg" });
    const c = controller(f, { storage });
    const sent: Record<string, unknown>[] = [];
    c.attach((m) => sent.push(m));
    c.fromCanvas({ load: "1" });
    // Each time the page draws again: are the tools there, and was the canvas told it can draw?
    const seen: [boolean, boolean][] = [];
    c.onChange = () => seen.push([c.canEdit, sent.some((m) => m.op === "shared" && m.viewOnly === false)]);
    await c.open();
    expect(c.role).toBe("editor");
    expect(c.canEdit).toBe(true);
    expect(c.offersSignIn).toBe(false);
    expect(c.comments.canComment).toBe(true);
    expect(c.comments.author).toEqual({ id: "22222222-2222-4222-8222-222222222222", name: "Sara" });
    expect(seen.some(([tools]) => tools)).toBe(true);
    expect(seen.filter(([tools, told]) => tools && !told)).toEqual([]);
  });

  it("cancelling the sign-in leaves the board as it was", async () => {
    const c = controller((await server()).f);
    await c.open();
    c.startSignIn();
    c.cancelSignIn();
    expect(c.signIn).toBeNull();
    expect(c.phase).toBe("board");
  });
});
