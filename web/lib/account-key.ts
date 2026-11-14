// A new account's notes' key, made on the connect page (BrowserConnect.tsx) for an account that
// has none: someone who signs up there to connect an AI, with no app yet. The person never sees
// any of it: no key, no recovery key, no extra step. It runs behind the page's progress line.
//
// The key is made exactly as the app makes it at an account's first sign-in (StoredKey.generate
// and serverRow in Pane/Model/E2EE.swift), with the shared formats of lib/e2ee.ts:
//   data key        32 random bytes; key id the first 16 hex digits of its SHA-256
//   recovery key    16 random bytes (never shown here; the app shows it in Settings, as for any account)
//   verifier        verifierOf (HKDF info "verifier", "amber-notes verifier|<user id>")
//   recovery wrap   the data key sealed under recoveryKEK (HKDF info "recovery <user id>"), context wrap:recovery:<user id>
// and its copy for the server goes up sealed to the `key` function's ticket, as a device's store does
// (supabase/functions/_shared/keycopy.ts, "amb2t", direction "up"):
//   key = HKDF-SHA256(ECDH secret, salt "amber-notes/e2ee", info "key-copy up <user id>")
//   AAD = "amb2t|up|<user id>|<key id>", plaintext data key ‖ recovery key (48 bytes)
// keycopy-vectors.json ("web_account") pins what this file makes; the Deno and Swift tests check it.
//
// The `key` function's `create` stores the row, the copy and standard mode in one step, so the
// account never has a key that nobody holds. Advanced protection (strict) is never set here.
import { fromBase64, keyIdOf, newDataKey, recoveryKEK, toBase64, verifierOf, wrap, type Bytes } from "./e2ee";

const enc = new TextEncoder();
const SALT = enc.encode("amber-notes/e2ee");
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;

export type AccountKeyRow = { key_id: string; verifier: string; recovery_wrap: string };

/** The account_keys row of a key, as serverRow makes it in the app. `nonce` is for test vectors only. */
export async function accountKeyRow(dataKey: Bytes, recovery: Bytes, userId: string, nonce?: Bytes): Promise<AccountKeyRow> {
  return {
    key_id: await keyIdOf(dataKey),
    verifier: await verifierOf(dataKey, userId),
    recovery_wrap: await wrap(dataKey, await recoveryKEK(recovery, userId), "recovery", userId, nonce),
  };
}

/** The key sealed to the `key` function's ticket key: KeyCopyBox.seal(direction: .up) in the app.
 *  `ephemeral` and `nonce` are for test vectors only. */
export async function sealKeyCopy(dataKey: Bytes, recovery: Bytes, to: Bytes, userId: string, ephemeral?: CryptoKeyPair, nonce?: Bytes): Promise<string> {
  if (dataKey.length !== 32 || recovery.length !== 16) throw new Error("not a key");
  if (to.length !== 65 || to[0] !== 4) throw new Error("not a public key");
  const user = userId.toLowerCase();
  const pub = await crypto.subtle.importKey("raw", to, P256, false, []);
  const eph = ephemeral ?? await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: pub }, eph.privateKey, 256));
  const base = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  shared.fill(0);
  const kek = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: SALT, info: enc.encode(`key-copy up ${user}`) },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const plain = new Uint8Array(48);
  plain.set(dataKey);
  plain.set(recovery, 32);
  const iv = nonce ?? crypto.getRandomValues(new Uint8Array(12));
  try {
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: enc.encode(`amb2t|up|${user}|${await keyIdOf(dataKey)}`) }, kek, plain));
    const ephRaw = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
    const out = new Uint8Array(65 + 12 + ct.length);
    out.set(ephRaw);
    out.set(iv, 65);
    out.set(ct, 77);
    return `amb2t.${toBase64(out)}`;
  } finally {
    plain.fill(0);
  }
}

/** What making the key came to: made, someone made one first (the app, or another tab), or a hint
 *  from the `key` function ("off", "strict", "rate", "sign_in", ...), or "offline". */
export type MadeKey = { made: true } | { made: false; why: string };

/** The `key` function's address. */
export const keyFunctionURL = (supabaseURL: string) => `${supabaseURL.replace(/\/+$/, "")}/functions/v1/key`;

/**
 * Makes the signed-in account's key and hands the server its copy, in one request after the ticket:
 * GET /key (a public key and a ticket), then POST {op: "create"}. The key's bytes are wiped after.
 */
export async function makeAccountKey(supabaseURL: string, accessToken: string, userId: string, f: typeof fetch = fetch): Promise<MadeKey> {
  const url = keyFunctionURL(supabaseURL);
  const auth = { authorization: `Bearer ${accessToken}` };
  let hello: { on?: unknown; pub?: unknown; ticket?: unknown; hint?: unknown } | null;
  try {
    const res = await f(url, { headers: auth, cache: "no-store" });
    hello = await res.json().catch(() => null);
    if (!res.ok || hello?.on !== true || typeof hello.pub !== "string" || typeof hello.ticket !== "string") {
      return { made: false, why: typeof hello?.hint === "string" ? hello.hint : "off" };
    }
  } catch {
    return { made: false, why: "offline" };
  }
  const dataKey = newDataKey();
  const recovery = crypto.getRandomValues(new Uint8Array(16));
  try {
    const row = await accountKeyRow(dataKey, recovery, userId);
    const box = await sealKeyCopy(dataKey, recovery, fromBase64(hello.pub as string), userId);
    const res = await f(url, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ op: "create", ticket: hello.ticket, box, ...row, platform: "web" }),
    });
    const body = await res.json().catch(() => null) as { created?: unknown; hint?: unknown } | null;
    if (res.ok && body?.created === true) return { made: true };
    return { made: false, why: typeof body?.hint === "string" ? body.hint : "error" };
  } catch {
    return { made: false, why: "offline" };
  } finally {
    dataKey.fill(0);
    recovery.fill(0);
  }
}
