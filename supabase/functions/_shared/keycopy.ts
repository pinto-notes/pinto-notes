// The server's copy of an account's key: its formats (docs/Technical/recoverable-key.md).
// keycopy-vectors.json pins the two boxes a client makes or opens; PaneTests/KeyCopyTests.swift and
// keycopy.test.ts both check against it. Everything here is WebCrypto: P-256 ECDH, HKDF-SHA256 and
// AES-256-GCM, which every platform a client could run on has.
//
// What is copied is 48 bytes: the data key (32) and the recovery key (16), so a device that gets
// the copy holds what any other device of the account holds.
//
// At rest (account_key_copies.sealed), opened only inside the `key` function:
//
//   amb2k.<secret version>.<base64 nonce (12) ‖ ciphertext ‖ tag (16)>
//   key = HKDF-SHA256(KEY_COPY_SECRET_<version>, salt "amber-notes/e2ee", info "key-copy <user id>")
//   AAD = "amb2k|<version>|<user id>|<key id>"
//
// The secret is in the function's environment and nowhere in the database, so the table alone
// opens nothing, and a row moved to another account or another key doesn't open at all.
//
// On the way (a device storing its key, or getting it), sealed to the other side's P-256 key so
// that nothing between the two ends (a relay, a proxy, a log) ever holds the key:
//
//   amb2t.<base64 sender's ephemeral public key (65, uncompressed) ‖ nonce (12) ‖ ciphertext ‖ tag>
//   key = HKDF-SHA256(ECDH shared secret, salt "amber-notes/e2ee", info "key-copy <up|down> <user id>")
//   AAD = "amb2t|<up|down>|<user id>|<key id>"
//
// "up" is a device to the server, "down" the server to a device. For "down" the device makes a
// key pair per request and sends the public half. For "up" the function hands out a public key
// with a ticket: the matching private key sealed under the function's secret, good for 5 minutes
// and for one account, so no isolate has to remember anything between the two requests:
//
//   <secret version>.<expiry, seconds since 1970>.<base64 nonce (12) ‖ ciphertext ‖ tag>
//   key = HKDF-SHA256(secret, same salt, info "key-copy ticket"), AAD = "ticket|<version>|<user id>|<expiry>"
import { fromBase64, keyIdOf, OpenError, toBase64, type Bytes } from "./e2ee.ts";

const enc = new TextEncoder();
const SALT = enc.encode("amber-notes/e2ee");

export type Direction = "up" | "down";
export type Env = { get(name: string): string | undefined };

/** The data key and the recovery key, as they are copied: 32 ‖ 16 bytes. */
export type KeyMaterial = { dataKey: Bytes; recovery: Bytes };

export function joined(k: KeyMaterial): Bytes {
  if (k.dataKey.length !== 32 || k.recovery.length !== 16) throw new OpenError("not a key");
  const out = new Uint8Array(48);
  out.set(k.dataKey);
  out.set(k.recovery, 32);
  return out;
}

export function split(raw: Bytes): KeyMaterial {
  if (raw.length !== 48) throw new OpenError("not a key");
  return { dataKey: new Uint8Array(raw.subarray(0, 32)), recovery: new Uint8Array(raw.subarray(32)) };
}

// MARK: The function's secrets

export type Secrets = { current: number; byVersion: Map<number, Bytes> };

/** KEY_COPY_SECRET_<n>: base64 of at least 32 random bytes each. The highest number seals; any
 *  that's present opens. Null when there is none (the feature is then off). */
export function secrets(env: Env, upTo = 64): Secrets | null {
  const byVersion = new Map<number, Bytes>();
  for (let n = 1; n <= upTo; n++) {
    const text = (env.get(`KEY_COPY_SECRET_${n}`) ?? "").trim();
    if (!text) continue;
    let raw: Bytes;
    try { raw = fromBase64(text); } catch { continue; }
    if (raw.length >= 32) byVersion.set(n, raw);
  }
  if (byVersion.size === 0) return null;
  return { current: Math.max(...byVersion.keys()), byVersion };
}

async function hkdf(ikm: Bytes, info: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  return await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: SALT, info: enc.encode(info) },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function gcmSeal(key: CryptoKey, plain: Bytes, aad: string, nonce?: Bytes): Promise<Bytes> {
  const iv = nonce ?? crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(aad) }, key, plain));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return out;
}

async function gcmOpen(key: CryptoKey, combined: Bytes, aad: string): Promise<Bytes> {
  if (combined.length < 28) throw new OpenError("too short");
  try {
    return new Uint8Array(await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: combined.subarray(0, 12), additionalData: enc.encode(aad) }, key, combined.subarray(12)));
  } catch {
    throw new OpenError("wrong key or context");
  }
}

// MARK: At rest

export const AT_REST = /^amb2k\.([0-9]{1,6})\.([A-Za-z0-9+/]+={0,2})$/;

const restAAD = (version: number, userId: string, keyId: string) => `amb2k|${version}|${userId.toLowerCase()}|${keyId}`;
const restKey = (secret: Bytes, userId: string) => hkdf(secret, `key-copy ${userId.toLowerCase()}`);

/** The key sealed for the table, under the newest secret. */
export async function sealAtRest(k: KeyMaterial, s: Secrets, userId: string): Promise<{ sealed: string; version: number; keyId: string }> {
  const keyId = await keyIdOf(k.dataKey);
  const box = await gcmSeal(await restKey(s.byVersion.get(s.current)!, userId), joined(k), restAAD(s.current, userId, keyId));
  return { sealed: `amb2k.${s.current}.${toBase64(box)}`, version: s.current, keyId };
}

/** The secret a row was sealed with isn't in this function's environment. */
export class SecretMissing extends Error {}

/** Opens a row for the account and key it says it's for; anything else throws. */
export async function openAtRest(sealed: string, s: Secrets, userId: string, keyId: string): Promise<{ key: KeyMaterial; version: number }> {
  const m = AT_REST.exec(sealed);
  if (!m) throw new OpenError("not a key copy");
  const version = Number(m[1]);
  const secret = s.byVersion.get(version);
  if (!secret) throw new SecretMissing(`secret ${version}`);
  const key = split(await gcmOpen(await restKey(secret, userId), fromBase64(m[2]), restAAD(version, userId, keyId)));
  if ((await keyIdOf(key.dataKey)) !== keyId) throw new OpenError("not that key");
  return { key, version };
}

// MARK: On the way

export const TRANSPORT = /^amb2t\.([A-Za-z0-9+/]+={0,2})$/;
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;

const transportAAD = (dir: Direction, userId: string, keyId: string) => `amb2t|${dir}|${userId.toLowerCase()}|${keyId}`;

async function transportKey(priv: CryptoKey, pub: CryptoKey, dir: Direction, userId: string): Promise<CryptoKey> {
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: pub }, priv, 256));
  return await hkdf(shared, `key-copy ${dir} ${userId.toLowerCase()}`);
}

/** A raw uncompressed P-256 public key (65 bytes, starting with 4), or throws. */
export async function publicKey(raw: Bytes): Promise<CryptoKey> {
  if (raw.length !== 65 || raw[0] !== 4) throw new OpenError("not a public key");
  try {
    return await crypto.subtle.importKey("raw", new Uint8Array(raw), P256, false, []);
  } catch {
    throw new OpenError("not a public key");
  }
}

/** Seals the key to the other side's public key. `ephemeral` and `nonce` are for test vectors only. */
export async function sealTransport(k: KeyMaterial, to: Bytes, dir: Direction, userId: string,
  ephemeral?: CryptoKeyPair, nonce?: Bytes): Promise<string> {
  const pub = await publicKey(to);
  const eph = ephemeral ?? await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const key = await transportKey(eph.privateKey, pub, dir, userId);
  const box = await gcmSeal(key, joined(k), transportAAD(dir, userId, await keyIdOf(k.dataKey)), nonce);
  const ephRaw = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const out = new Uint8Array(65 + box.length);
  out.set(ephRaw);
  out.set(box, 65);
  return `amb2t.${toBase64(out)}`;
}

/** Opens what was sealed to `priv`, for this account and this key id; anything else throws. */
export async function openTransport(sealed: string, priv: CryptoKey, dir: Direction, userId: string, keyId: string): Promise<KeyMaterial> {
  const m = TRANSPORT.exec(sealed);
  if (!m) throw new OpenError("not a sealed key");
  let b: Bytes;
  try { b = fromBase64(m[1]); } catch { throw new OpenError("not a sealed key"); }
  if (b.length !== 65 + 12 + 48 + 16) throw new OpenError("not a sealed key");
  const key = await transportKey(priv, await publicKey(b.subarray(0, 65)), dir, userId);
  const k = split(await gcmOpen(key, b.subarray(65), transportAAD(dir, userId, keyId)));
  if ((await keyIdOf(k.dataKey)) !== keyId) throw new OpenError("not that key");
  return k;
}

// MARK: The ticket a device stores with

export const TICKET_SECONDS = 300;
const TICKET = /^([0-9]{1,6})\.([0-9]{9,12})\.([A-Za-z0-9+/]+={0,2})$/;
const ticketAAD = (version: number, userId: string, expires: number) => `ticket|${version}|${userId.toLowerCase()}|${expires}`;

/** A public key for one device to seal its key to, and the ticket that brings the private key back. */
export async function newTicket(s: Secrets, userId: string, now = Date.now()): Promise<{ pub: string; ticket: string }> {
  const pair = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const priv = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const expires = Math.floor(now / 1000) + TICKET_SECONDS;
  const box = await gcmSeal(await hkdf(s.byVersion.get(s.current)!, "key-copy ticket"), priv, ticketAAD(s.current, userId, expires));
  priv.fill(0);
  return {
    pub: toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))),
    ticket: `${s.current}.${expires}.${toBase64(box)}`,
  };
}

/** The private key a ticket carries, if it's this account's and hasn't run out. */
export async function openTicket(ticket: string, s: Secrets, userId: string, now = Date.now()): Promise<CryptoKey> {
  const m = TICKET.exec(ticket);
  if (!m) throw new OpenError("not a ticket");
  const version = Number(m[1]), expires = Number(m[2]);
  const secret = s.byVersion.get(version);
  if (!secret) throw new OpenError("not a ticket");
  if (expires * 1000 < now) throw new OpenError("ticket expired");
  let box: Bytes;
  try { box = fromBase64(m[3]); } catch { throw new OpenError("not a ticket"); }
  const priv = await gcmOpen(await hkdf(secret, "key-copy ticket"), box, ticketAAD(version, userId, expires));
  try {
    return await crypto.subtle.importKey("pkcs8", priv, P256, false, ["deriveBits"]);
  } finally {
    priv.fill(0);
  }
}

/** Whether two hex strings are the same, without saying where they differ. */
export function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
