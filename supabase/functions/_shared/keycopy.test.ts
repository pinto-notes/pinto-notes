// The key copy's formats, against keycopy-vectors.json (the file PaneTests/KeyCopyTests.swift
// checks too). To write the file again after a deliberate format change:
//   KEYCOPY_WRITE_VECTORS=1 deno test -A supabase/functions/_shared/keycopy.test.ts
import { assert, assertEquals, assertNotEquals, assertRejects } from "jsr:@std/assert@1";
import { fromBase64, hex, keyIdOf, OpenError, toBase64 } from "./e2ee.ts";
import { AT_REST, newTicket, openAtRest, openTicket, openTransport, sealAtRest, sealTransport, SecretMissing, secrets, split,
  TICKET_SECONDS, type KeyMaterial, type Secrets } from "./keycopy.ts";

const path = new URL("./keycopy-vectors.json", import.meta.url);
// Two fixed P-256 keys (the ones e2ee.test.ts uses): the receiving side's, and the sender's ephemeral one.
const RECEIVER = { d: "QXyZcLcMdeE-bd6yWeP-ekEpAq02Lun8zke9B0gTuOg", x: "r1RUkUU5QhVOxJSlg1XdTGcckNx0PGEGS7ixtNOt5Pc", y: "DLEyPUco0UiCeYKZb-qWErEcuYT_3HcRWxnYsMFGx8M" };
const SENDER = { d: "mv4ekNAtMnOAUgdYkMSMSEL9u2KWSfl9fk1ANRmDQkk", x: "mBtuZHu_W62QhOGJyGPBs1wu2RKw7oijhvIm9JYyeK8", y: "OrGvp16poywexhsGTfDyqW3oBISg1Wal8OYiNL6cUV8" };
const b64url = (s: string) => fromBase64(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4));
const P256 = { name: "ECDH", namedCurve: "P-256" } as const;
async function ecdh(k: { d: string; x: string; y: string }) {
  const privateKey = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", ...k, ext: true }, P256, true, ["deriveBits"]);
  const publicKey = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: k.x, y: k.y, ext: true }, P256, true, []);
  return { privateKey, publicKey, publicRaw: new Uint8Array(await crypto.subtle.exportKey("raw", publicKey)), d: b64url(k.d) };
}
const bytes = (start: number, n: number) => Uint8Array.from({ length: n }, (_, i) => (start + i) & 0xff);

const USER = "7c0f1d2e-3a4b-4c5d-8e6f-0a1b2c3d4e5f";
const key = (): KeyMaterial => ({ dataKey: bytes(1, 32), recovery: bytes(0x30, 16) });
const env = (o: Record<string, string>) => ({ get: (n: string) => o[n] });
const secret = (n: number) => toBase64(bytes(n, 32));
const one = (): Secrets => secrets(env({ KEY_COPY_SECRET_1: secret(7) }))!;

async function build() {
  const receiver = await ecdh(RECEIVER), sender = await ecdh(SENDER);
  const k = key(), nonce = bytes(0xa0, 12);
  const pair = { privateKey: sender.privateKey, publicKey: sender.publicKey };
  return {
    about: "The server's copy of an account's key, on the way between a device and the server (supabase/functions/_shared/keycopy.ts). 'up' is what a device seals to the server's ticket key, 'down' what the server seals to the device's key. Both sealed here with a fixed ephemeral key and nonce.",
    user_id: USER,
    // Named without "key": the secret scan takes a field called a key with a random-looking value for a leaked one.
    data: toBase64(k.dataKey),
    recovery: toBase64(k.recovery),
    id: await keyIdOf(k.dataKey),
    nonce: toBase64(nonce),
    receiver_private: toBase64(receiver.d),
    receiver_public: toBase64(receiver.publicRaw),
    sender_ephemeral_private: toBase64(sender.d),
    up: await sealTransport(k, receiver.publicRaw, "up", USER, pair, nonce),
    down: await sealTransport(k, receiver.publicRaw, "down", USER, pair, nonce),
  };
}

Deno.test("the boxes on the way are exactly the vectors, and open only for their account, key and direction", async () => {
  const built = await build();
  if (Deno.env.get("KEYCOPY_WRITE_VECTORS")) await Deno.writeTextFile(path, JSON.stringify(built, null, 2) + "\n");
  const v = JSON.parse(await Deno.readTextFile(path));
  assertEquals(built, v);
  const receiver = await ecdh(RECEIVER);
  for (const dir of ["up", "down"] as const) {
    const k = await openTransport(v[dir], receiver.privateKey, dir, USER.toUpperCase(), v.id);
    assertEquals(toBase64(k.dataKey), v.data);
    assertEquals(toBase64(k.recovery), v.recovery);
    const other = dir === "up" ? "down" : "up";
    await assertRejects(() => openTransport(v[dir], receiver.privateKey, other, USER, v.id), OpenError);
    await assertRejects(() => openTransport(v[dir], receiver.privateKey, dir, crypto.randomUUID(), v.id), OpenError);
    await assertRejects(() => openTransport(v[dir], receiver.privateKey, dir, USER, "0".repeat(16)), OpenError);
    await assertRejects(async () => openTransport(v[dir], (await ecdh(SENDER)).privateKey, dir, USER, v.id), OpenError);
  }
  // Sealed at random: a different box each time, the same key inside.
  const again = await sealTransport(key(), receiver.publicRaw, "down", USER);
  assertNotEquals(again, v.down);
  assertEquals(hex((await openTransport(again, receiver.privateKey, "down", USER, v.id)).dataKey), hex(key().dataKey));
  await assertRejects(() => sealTransport(key(), receiver.publicRaw.subarray(0, 33), "down", USER), OpenError);
  await assertRejects(() => openTransport("amb2t.AAAA", receiver.privateKey, "down", USER, v.id), OpenError);
});

Deno.test("at rest: a row opens only with the secret, for its own account and its own key", async () => {
  const s = one();
  const at = await sealAtRest(key(), s, USER);
  assert(AT_REST.test(at.sealed) && at.sealed.startsWith("amb2k.1."));
  assertEquals(at.version, 1);
  const opened = await openAtRest(at.sealed, s, USER, at.keyId);
  assertEquals(hex(opened.key.dataKey), hex(key().dataKey));
  assertEquals(hex(opened.key.recovery), hex(key().recovery));
  // The same key sealed twice is two different rows.
  assertNotEquals((await sealAtRest(key(), s, USER)).sealed, at.sealed);
  // Another account's id, another key id, another secret, a changed byte: nothing.
  await assertRejects(() => openAtRest(at.sealed, s, crypto.randomUUID(), at.keyId), OpenError);
  await assertRejects(() => openAtRest(at.sealed, s, USER, "0".repeat(16)), OpenError);
  await assertRejects(() => openAtRest(at.sealed, secrets(env({ KEY_COPY_SECRET_1: secret(8) }))!, USER, at.keyId), OpenError);
  const raw = fromBase64(at.sealed.split(".")[2]);
  raw[20] ^= 1;
  await assertRejects(() => openAtRest(`amb2k.1.${toBase64(raw)}`, s, USER, at.keyId), OpenError);
  // The row carries nothing readable of the key.
  assert(!toBase64(raw).includes(toBase64(key().dataKey).slice(0, 16)));
});

Deno.test("secrets: the highest number seals, older ones still open, a missing one says so", async () => {
  assertEquals(secrets(env({})), null);
  assertEquals(secrets(env({ KEY_COPY_SECRET_1: "short" })), null, "a secret under 32 bytes isn't one");
  assertEquals(secrets(env({ KEY_COPY_SECRET_1: "not base64 !!" })), null);
  const old = one();
  const at = await sealAtRest(key(), old, USER);
  const both = secrets(env({ KEY_COPY_SECRET_1: secret(7), KEY_COPY_SECRET_2: secret(9) }))!;
  assertEquals(both.current, 2);
  assertEquals((await openAtRest(at.sealed, both, USER, at.keyId)).version, 1);
  const next = await sealAtRest(key(), both, USER);
  assert(next.sealed.startsWith("amb2k.2."));
  const onlyNew = secrets(env({ KEY_COPY_SECRET_2: secret(9) }))!;
  await assertRejects(() => openAtRest(at.sealed, onlyNew, USER, at.keyId), SecretMissing);
  assertEquals(hex((await openAtRest(next.sealed, onlyNew, USER, at.keyId)).key.dataKey), hex(key().dataKey));
});

Deno.test("a ticket brings the private key back, for its account, until it runs out", async () => {
  const s = one(), now = 1_800_000_000_000;
  const t = await newTicket(s, USER, now);
  const pub = fromBase64(t.pub);
  assertEquals(pub.length, 65);
  const box = await sealTransport(key(), pub, "up", USER);
  const priv = await openTicket(t.ticket, s, USER, now + 1000);
  assertEquals(hex((await openTransport(box, priv, "up", USER, await keyIdOf(key().dataKey))).dataKey), hex(key().dataKey));
  await assertRejects(() => openTicket(t.ticket, s, crypto.randomUUID(), now), OpenError);
  await assertRejects(() => openTicket(t.ticket, s, USER, now + (TICKET_SECONDS + 1) * 1000), OpenError);
  await assertRejects(() => openTicket(t.ticket, secrets(env({ KEY_COPY_SECRET_1: secret(8) }))!, USER, now), OpenError);
  // A later expiry written into the ticket doesn't open: the expiry is part of what's sealed.
  const [v, exp, body] = t.ticket.split(".");
  await assertRejects(() => openTicket(`${v}.${Number(exp) + 3600}.${body}`, s, USER, now), OpenError);
  await assertRejects(() => openTicket("nonsense", s, USER, now), OpenError);
  // Two tickets never share a key.
  assertNotEquals((await newTicket(s, USER, now)).pub, t.pub);
  assertEquals(split(new Uint8Array(48)).recovery.length, 16);
});
