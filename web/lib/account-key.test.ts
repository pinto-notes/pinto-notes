// A new account's key as the connect page makes it (account-key.ts), against the vectors the
// server's Deno tests and the app's Swift tests check (supabase/functions/_shared/keycopy-vectors.json,
// "web_account" and "up"), and against the app's own derivation strings, read from its source.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { accountKeyRow, makeAccountKey, sealKeyCopy } from "./account-key";
import { fromBase64, keyIdOf, recoveryKEK, unwrap, verifierOf } from "./e2ee";

const repo = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const v = JSON.parse(repo("supabase/functions/_shared/keycopy-vectors.json"));
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;

/// A raw P-256 private scalar and its public point, as a key pair WebCrypto can use.
async function pairFrom(privateRaw: string, publicRaw?: Uint8Array): Promise<CryptoKeyPair> {
  const d = Buffer.from(fromBase64(privateRaw)).toString("base64url");
  // The public point: from the vector, or derived by importing the scalar alone isn't possible in
  // WebCrypto, so the sender's comes from the vector's "up" box (its first 65 bytes).
  const pub = publicRaw!;
  const x = Buffer.from(pub.subarray(1, 33)).toString("base64url"), y = Buffer.from(pub.subarray(33, 65)).toString("base64url");
  return {
    privateKey: await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d, x, y, ext: true }, P256, true, ["deriveBits"]),
    publicKey: await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x, y, ext: true }, P256, true, []),
  };
}

describe("a new account's key, made on the connect page", () => {
  it("is exactly the vector's row and copy: what the server's tests and the app's tests check", async () => {
    const dataKey = fromBase64(v.data), recovery = fromBase64(v.recovery);
    const row = await accountKeyRow(dataKey, recovery, v.user_id, fromBase64(v.web_account.wrap_nonce));
    expect(row).toEqual({ key_id: v.web_account.key_id, verifier: v.web_account.verifier, recovery_wrap: v.web_account.recovery_wrap });
    expect(row.key_id).toBe(v.id);
    // The copy for the server: the app's KeyCopyBox.seal(direction: .up), byte for byte.
    const ephemeral = await pairFrom(v.sender_ephemeral_private, fromBase64(v.up.slice("amb2t.".length)).subarray(0, 65));
    expect(await sealKeyCopy(dataKey, recovery, fromBase64(v.receiver_public), v.user_id, ephemeral, fromBase64(v.nonce))).toBe(v.up);
    // An upper-case user id makes the same thing (the app lowercases it).
    expect(await sealKeyCopy(dataKey, recovery, fromBase64(v.receiver_public), v.user_id.toUpperCase(), ephemeral, fromBase64(v.nonce))).toBe(v.up);
  });

  it("makes a fresh key each time whose row checks out: verifier, and a recovery wrap its recovery key opens", async () => {
    const user = crypto.randomUUID();
    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const calls: { url: string; body: Record<string, string> }[] = [];
      const receiver = await crypto.subtle.generateKey(P256, true, ["deriveBits"]);
      const pub = Buffer.from(await crypto.subtle.exportKey("raw", receiver.publicKey)).toString("base64");
      const f = vi.fn(async (url: RequestInfo | URL, init: RequestInit = {}) => {
        calls.push({ url: String(url), body: init.body ? JSON.parse(String(init.body)) : {} });
        return new Response(JSON.stringify(init.method === "POST" ? { created: true } : { on: true, pub, ticket: "t" }), { status: 200 });
      });
      expect(await makeAccountKey("https://ref.supabase.co/", "at", user, f as typeof fetch)).toEqual({ made: true });
      expect(calls.map((c) => c.url)).toEqual(["https://ref.supabase.co/functions/v1/key", "https://ref.supabase.co/functions/v1/key"]);
      const b = calls[1].body;
      expect(Object.keys(b).sort()).toEqual(["box", "key_id", "op", "platform", "recovery_wrap", "ticket", "verifier"]);
      expect([b.op, b.ticket, b.platform]).toEqual(["create", "t", "web"]);
      // Open the copy as the server does (ECDH, HKDF "key-copy up <user>", AAD amb2t|up|<user>|<key id>).
      const raw = fromBase64(b.box.slice("amb2t.".length));
      const eph = await crypto.subtle.importKey("raw", raw.subarray(0, 65), P256, false, []);
      const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: eph }, receiver.privateKey, 256);
      const hk = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
      const kek = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode("amber-notes/e2ee"), info: new TextEncoder().encode(`key-copy up ${user}`) },
        hk, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.subarray(65, 77), additionalData: new TextEncoder().encode(`amb2t|up|${user}|${b.key_id}`) }, kek, raw.subarray(77)));
      const dataKey = plain.slice(0, 32), recovery = plain.slice(32);
      expect(await keyIdOf(dataKey)).toBe(b.key_id);
      expect(await verifierOf(dataKey, user)).toBe(b.verifier);
      expect(Buffer.from(await unwrap(b.recovery_wrap, await recoveryKEK(recovery, user), "recovery", user)).equals(Buffer.from(dataKey))).toBe(true);
      seen.add(b.key_id);
    }
    expect(seen.size).toBe(3);
  });

  it("says why when the server makes no copies, or can't be reached, and sends nothing then", async () => {
    const off = vi.fn(async () => new Response(JSON.stringify({ error: "Not available.", hint: "off" }), { status: 503 }));
    expect(await makeAccountKey("https://ref.supabase.co", "at", "u", off as unknown as typeof fetch)).toEqual({ made: false, why: "off" });
    expect(off).toHaveBeenCalledTimes(1);
    const down = vi.fn(async () => { throw new TypeError("network"); });
    expect(await makeAccountKey("https://ref.supabase.co", "at", "u", down as unknown as typeof fetch)).toEqual({ made: false, why: "offline" });
  });

  // NEVER change a derivation string: every key already made depends on it. These are the app's.
  it("uses the app's derivation strings, unchanged", () => {
    const swift = repo("Pane/Model/E2EE.swift") + repo("Pane/Model/KeyCopy.swift");
    const web = repo("web/lib/e2ee.ts") + repo("web/lib/account-key.ts");
    const strings: [swiftForm: string, webForm: string][] = [
      ['Data("amber-notes/e2ee".utf8)', 'encode("amber-notes/e2ee")'],
      ['info: Data("verifier".utf8)', 'enc.encode("verifier")'],
      ['"amber-notes verifier|\\(user.uuidString.lowercased())"', "`amber-notes verifier|${userId.toLowerCase()}`"],
      ['"recovery \\(user.uuidString.lowercased())"', "`recovery ${userId.toLowerCase()}`"],
      ['"wrap:\\(purpose):" + user.uuidString.lowercased()', "`wrap:${purpose}:${userId.toLowerCase()}`"],
      ['"key-copy \\(direction.rawValue) \\(user.uuidString.lowercased())"', "`key-copy up ${user}`"],
      ['"amb2t|\\(direction.rawValue)|\\(user.uuidString.lowercased())|\\(keyID)"', "`amb2t|up|${user}|${await keyIdOf(dataKey)}`"],
      ['static let prefix = "amb2t."', "`amb2t.${"],
    ];
    for (const [s, w] of strings) {
      expect(swift, s).toContain(s);
      expect(web, w).toContain(w);
    }
  });
});
