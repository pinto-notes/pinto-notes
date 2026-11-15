// The keys a browser needs to edit a shared whiteboard (app/s/[id], BoardPage.tsx), and nothing more.
//
// A board's changes are sealed under its note key (NK). Opening an Edit link gives NK from the link
// itself (the secret in the address's fragment, which never leaves the browser). Joining, as the
// app joins (ShareModel.join), seals NK to the account's identity key, so the account opens the
// board on its other devices and after the link changes:
//
// 1. The account's data key (DK), once, at sign-in: the copy the server keeps for a standard
//    account (the `key` function, op "fetch", platform "web"), sealed to a key pair this page makes
//    for the request (`amb2t`, "down"; supabase/functions/_shared/keycopy.ts). An account with no
//    key yet (made on this page) gets one made here, as the connect page makes it (account-key.ts).
//    An account that keeps its key on its devices only (Advanced protection) can't open it here.
// 2. With DK, the identity key: the account's own (the private half is sealed under DK, context
//    identity:<user>), or a new one made and published, as the app does at its first share or join.
// 3. Join: NK sealed to the identity (`amb3k`) and under DK (the self wrap, which the account's AI
//    connection opens), and collab_join_link with the link's answer.
// 4. DK is wiped. The identity's private key stays in this browser as a non-extractable WebCrypto
//    key in IndexedDB, for this account only: it opens the keys of boards this account is in (to
//    follow a new key after someone is removed), never the account's notes. Sign out removes it.
//
// Nothing here sends a key or the link's secret to the server in the clear.
import {
  type Identity, importIdentity, identityContext, newIdentity, noteKeyContext, openNoteKey, sealNoteKey,
} from "./collab";
import { aesKey, type Bytes, fromBase64, keyIdOf, newDataKey, OpenError, open, seal, toBase64 } from "./e2ee";
import { accountKeyRow, keyFunctionURL, sealKeyCopy } from "./account-key";

const enc = new TextEncoder();
const SALT = enc.encode("amber-notes/e2ee");
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;

// MARK: The account's key, from the server's copy

export type KeyMaterial = { dataKey: Bytes; recovery: Bytes };

/** Opens the key the `key` function sealed to `priv` (openTransport, direction "down"), for this account and key id. */
export async function openKeyCopy(sealed: string, priv: CryptoKey, userId: string, keyId: string): Promise<KeyMaterial> {
  const m = /^amb2t\.([A-Za-z0-9+/]+={0,2})$/.exec(sealed);
  if (!m) throw new OpenError("not a sealed key");
  const b = fromBase64(m[1]);
  if (b.length !== 65 + 12 + 48 + 16) throw new OpenError("not a sealed key");
  const user = userId.toLowerCase();
  const pub = await crypto.subtle.importKey("raw", b.subarray(0, 65), P256, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: pub }, priv, 256));
  const base = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  shared.fill(0);
  const kek = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: SALT, info: enc.encode(`key-copy down ${user}`) },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  let plain: Uint8Array;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.subarray(65, 77), additionalData: enc.encode(`amb2t|down|${user}|${keyId}`) }, kek, b.subarray(77)));
  } catch {
    throw new OpenError("wrong key or context");
  }
  if (plain.length !== 48) throw new OpenError("not a key");
  const k = { dataKey: plain.slice(0, 32) as Bytes, recovery: plain.slice(32) as Bytes };
  plain.fill(0);
  if ((await keyIdOf(k.dataKey)) !== keyId) { wipe(k); throw new OpenError("not that key"); }
  return k;
}

export const wipe = (k: KeyMaterial | null | undefined) => { k?.dataKey.fill(0); k?.recovery.fill(0); };

/** Why the account's key isn't open here: the `key` function's hint ("strict", "no_copy", "reauth", "rate", ...), or "offline". */
export type KeyRefusal = { why: string };

/**
 * Runs `use` with the account's data key, which is wiped after: the server's copy for a standard
 * account, or a new key for an account that has none (made on this page, as the connect page does).
 */
export async function withDataKey<T>(supabaseURL: string, accessToken: string, userId: string, use: (dk: Bytes) => Promise<T>, f: typeof fetch = fetch, again = true): Promise<{ value: T } | KeyRefusal> {
  const url = keyFunctionURL(supabaseURL);
  const pair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const pub = toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
  let body: { sealed?: unknown; key_id?: unknown; hint?: unknown } | null;
  try {
    const res = await f(url, {
      method: "POST", cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ op: "fetch", pub, platform: "web" }),
    });
    body = await res.json().catch(() => null);
    if (!res.ok || typeof body?.sealed !== "string" || typeof body.key_id !== "string") {
      const why = typeof body?.hint === "string" ? body.hint : res.ok ? "error" : "off";
      if (why !== "no_key") return { why };
      // No key yet: an account made on this page. Made here, out of sight, and used before it's wiped.
      const made = await makeKeyAndUse(url, accessToken, userId, use, f);
      // Someone made one meanwhile (the app, another tab): fetch it as any device would.
      if ("why" in made && made.why === "key_exists" && again) return await withDataKey(supabaseURL, accessToken, userId, use, f, false);
      return made;
    }
  } catch {
    return { why: "offline" };
  }
  let k: KeyMaterial | null = null;
  try {
    k = await openKeyCopy(body.sealed as string, pair.privateKey, userId, body.key_id as string);
  } catch {
    return { why: "unreadable" };
  }
  try {
    return { value: await use(k.dataKey) };
  } finally {
    wipe(k);
  }
}

/**
 * A new account's key, made as the connect page makes it (account-key.ts makeAccountKey: GET /key
 * for a ticket, then POST {op: "create"}), and given to `use` once the server has it, before it's wiped.
 */
async function makeKeyAndUse<T>(url: string, accessToken: string, userId: string, use: (dk: Bytes) => Promise<T>, f: typeof fetch): Promise<{ value: T } | KeyRefusal> {
  const auth = { authorization: `Bearer ${accessToken}` };
  let hello: { on?: unknown; pub?: unknown; ticket?: unknown; hint?: unknown } | null;
  try {
    const res = await f(url, { headers: auth, cache: "no-store" });
    hello = await res.json().catch(() => null);
    if (!res.ok || hello?.on !== true || typeof hello.pub !== "string" || typeof hello.ticket !== "string") {
      return { why: typeof hello?.hint === "string" ? hello.hint : "off" };
    }
  } catch {
    return { why: "offline" };
  }
  const dataKey = newDataKey();
  const recovery = crypto.getRandomValues(new Uint8Array(16)) as Bytes;
  try {
    const row = await accountKeyRow(dataKey, recovery, userId);
    const box = await sealKeyCopy(dataKey, recovery, fromBase64(hello.pub as string), userId);
    let body: { created?: unknown; hint?: unknown } | null;
    try {
      const res = await f(url, {
        method: "POST",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ op: "create", ticket: hello.ticket, box, ...row, platform: "web" }),
      });
      body = await res.json().catch(() => null);
      if (!res.ok || body?.created !== true) return { why: typeof body?.hint === "string" ? body.hint : "error" };
    } catch {
      return { why: "offline" };
    }
    return { value: await use(dataKey) };
  } finally {
    dataKey.fill(0);
    recovery.fill(0);
  }
}

/** What a refusal means for the person, in a line, and whether the app is the way on. */
export function keyRefusalText(why: string): { text: string; app?: boolean; signIn?: boolean } {
  switch (why) {
    case "strict": case "not_chosen": case "no_copy":
      return { text: "Your account keeps its key on your iPhone and Mac only, so this board opens for editing in Pinto Notes.", app: true };
    case "reauth": case "sign_in":
      return { text: "To keep your notes safe, sign in again to edit here.", signIn: true };
    case "paused_after_reset":
      return { text: "Your notes open on a new device a while after a password reset. Try again later, or use Pinto Notes.", app: true };
    case "rate":
      return { text: "Too many tries. Wait a little, then try again." };
    case "offline":
      return { text: "Couldn’t reach Pinto Notes. Check your connection and try again." };
    default:
      return { text: "Editing in the browser isn’t available right now. You can still edit this board in Pinto Notes.", app: true };
  }
}

// MARK: The account's identity key

/** The REST calls this file makes, as the signed-in account (BoardRest in board-rest.ts). */
export type Rest = {
  get<T>(path: string): Promise<T>;
  rpc<T>(name: string, args: Record<string, unknown>): Promise<T>;
};

type IdentityRow = { public_key: string; private_wrap: string };

/** The account's identity from its row, opened with DK; a row that doesn't open (or isn't its own key) throws. */
export async function openIdentity(row: IdentityRow, dk: Bytes, userId: string): Promise<Identity> {
  const d = fromBase64(await open(row.private_wrap, await aesKey(dk), identityContext(userId)));
  try {
    if (d.length !== 32) throw new OpenError("not an identity");
    const id = await importIdentity(d, fromBase64(row.public_key));
    // The private half must be the public half's: proven by sealing a key to itself and opening it.
    const probe = crypto.getRandomValues(new Uint8Array(32)) as Bytes;
    const party = { note: "00000000-0000-4000-8000-000000000000", epoch: 1, from: userId, to: userId };
    const back = await openNoteKey(await sealNoteKey(probe, id, id.publicRaw, party), id, id.publicRaw, party);
    if (toBase64(back) !== toBase64(probe)) throw new OpenError("not this account's identity");
    return id;
  } finally {
    d.fill(0);
  }
}

/**
 * The account's identity key: its own, opened with DK, or (none yet) a new one made and published
 * as the app's first share or join makes it (CollabKeys.load). A publish that raced another device
 * keeps the first key, so the key is always read back from the server.
 */
export async function identityWith(rest: Rest, dk: Bytes, userId: string): Promise<Identity> {
  const own = async () => (await rest.get<IdentityRow[]>(`identity_keys?select=public_key,private_wrap&user_id=eq.${userId.toLowerCase()}`))[0] ?? null;
  const had = await own();
  if (had) return await openIdentity(had, dk, userId);
  const made = await newIdentity();
  try {
    const wrap = await seal(toBase64(made.d), await aesKey(dk), await keyIdOf(dk), identityContext(userId));
    try {
      await rest.rpc("collab_publish_identity", { p_public_key: toBase64(made.publicRaw), p_private_wrap: wrap });
    } catch (e) {
      if (!String((e as Error).message).includes("identity_exists")) throw e;
    }
  } finally {
    made.d.fill(0);
  }
  const row = await own();
  if (!row) throw new Error("The sharing key didn't save. Try again.");
  return await openIdentity(row, dk, userId);
}

// MARK: Joining with a link

/** Joins the board with the link's role, as the app does: NK sealed to the identity and (with DK) under DK. */
export async function joinWithLink(rest: Rest, link: { id: string; answer: string }, nk: Bytes, note: string, epoch: number,
  identity: Identity, userId: string, dk: Bytes | null): Promise<void> {
  const party = { note, epoch, from: userId, to: userId };
  const toSelf = await sealNoteKey(nk, identity, identity.publicRaw, party);
  const selfWrap = dk ? await seal(toBase64(nk), await aesKey(dk), await keyIdOf(dk), noteKeyContext(note, epoch)) : null;
  await rest.rpc("collab_join_link", { p_link: link.id, p_answer: link.answer, p_key_wrap: toSelf, p_self_wrap: selfWrap });
}

export type Member = { user_id: string; role: string; display_name: string | null; public_key: string | null; accepted: boolean };
type MembershipRow = { role: string; epoch: number; key_wrap: string; wrapped_by: string };

/**
 * The board's current key for a member, from their membership (CollabStore.openKey): the wrap the
 * owner made for them after a key change, checked to come from the key this browser first saw for
 * that person (`book`). Null when this account isn't in the board.
 */
export async function memberKey(rest: Rest, note: string, userId: string, identity: Identity, book: KeyBook)
  : Promise<{ nk: Bytes; epoch: number; role: string } | null> {
  const [row] = await rest.get<MembershipRow[]>(`note_members?select=role,epoch,key_wrap,wrapped_by&note_id=eq.${note}&user_id=eq.${userId.toLowerCase()}`);
  if (!row) return null;
  let from: Bytes;
  if (row.wrapped_by.toLowerCase() === userId.toLowerCase()) from = identity.publicRaw;
  else {
    const members = await rest.rpc<Member[]>("collab_members", { p_note: note });
    const sealer = members.find((m) => m.user_id.toLowerCase() === row.wrapped_by.toLowerCase());
    if (!sealer?.public_key || !book.trusts(sealer.user_id, sealer.public_key)) throw new KeyChanged(sealer?.display_name ?? "Someone");
    from = fromBase64(sealer.public_key);
  }
  const nk = await openNoteKey(row.key_wrap, identity, from, { note, epoch: row.epoch, from: row.wrapped_by, to: userId });
  return { nk, epoch: row.epoch, role: row.role };
}

/** Someone's key isn't the one this browser first saw for them: what a server slipping in its own key would look like. */
export class KeyChanged extends Error {
  constructor(readonly who: string) { super(`${who}'s sharing key changed. Open the board in Pinto Notes to check it.`); }
}

/** The people's keys this browser has seen, first sighting trusted (CollabKeyBook), per account. */
export class KeyBook {
  constructor(private readonly store: Pick<Storage, "getItem" | "setItem"> | null, private readonly owner: string) {}
  private get key() { return `pinto.board.keys.${this.owner.toLowerCase()}`; }
  private read(): Record<string, string> {
    try { return JSON.parse(this.store?.getItem(this.key) ?? "{}") ?? {}; } catch { return {}; }
  }
  /** Whether `key` is the one first seen for `user` (seen now if never before). */
  trusts(user: string, key: string): boolean {
    const all = this.read(), id = user.toLowerCase();
    if (all[id] === undefined) {
      all[id] = key;
      try { this.store?.setItem(this.key, JSON.stringify(all)); } catch {}
      return true;
    }
    return all[id] === key;
  }
}

// MARK: Kept in this browser

const DB = "pinto-board", STORE = "identity";

export type KeptIdentity = { user: string; privateKey: CryptoKey; publicRaw: Bytes };

function idb(): Promise<IDBDatabase | null> {
  return new Promise((done) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => done(req.result);
      req.onerror = () => done(null);
    } catch { done(null); }
  });
}

/** The account's identity, kept for this browser (the private key can't be read out of it). */
export async function keepIdentity(user: string, id: Identity): Promise<void> {
  const db = await idb();
  if (!db) return;
  await new Promise<void>((done) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ user: user.toLowerCase(), privateKey: id.privateKey, publicRaw: id.publicRaw }, user.toLowerCase());
      tx.oncomplete = () => done();
      tx.onerror = () => done();
    } catch { done(); }
  });
  db.close();
}

export async function keptIdentity(user: string): Promise<Identity | null> {
  const db = await idb();
  if (!db) return null;
  const row = await new Promise<KeptIdentity | null>((done) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(user.toLowerCase());
      req.onsuccess = () => done(req.result ?? null);
      req.onerror = () => done(null);
    } catch { done(null); }
  });
  db.close();
  return row && row.privateKey instanceof CryptoKey ? { privateKey: row.privateKey, publicRaw: new Uint8Array(row.publicRaw) as Bytes } : null;
}

/** Sign out: the identity goes from this browser. */
export async function forgetIdentities(): Promise<void> {
  const db = await idb();
  if (!db) return;
  await new Promise<void>((done) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => done();
      tx.onerror = () => done();
    } catch { done(); }
  });
  db.close();
}
