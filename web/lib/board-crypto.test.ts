// The whiteboard page's crypto (lib/collab.ts, board-keys.ts, board-doc.ts), checked against the
// vectors the app's and the server's tests check too (supabase/functions/_shared/collab-vectors.json,
// keycopy-vectors.json): what the app and the server seal opens here, and what this page seals
// ("web", from scripts/board-web-vectors.ts) is what the app opens (PaneTests/CollabCryptoTests.swift).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import {
  bytes, identityContext, importIdentity, linkKeys, newIdentity, noteKeyContext, open3, openNoteKey, pictureBytes, pictureOf,
  safetyCode, seal3, sealNoteKey, text,
} from "./collab";
import { aesKey, fromBase64, hex, keyIdOf, open, seal, toBase64 } from "./e2ee";
import { openIdentity, openKeyCopy } from "./board-keys";
import { entries, readComments, settingsOf } from "./board-doc";
import { loadAutomerge } from "./automerge";

const shared = (name: string) => readFileSync(new URL(`../../supabase/functions/_shared/${name}`, import.meta.url), "utf8");
const v = JSON.parse(shared("collab-vectors.json"));
const k = JSON.parse(shared("keycopy-vectors.json"));
const b64url = (s: string) => fromBase64(s.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - s.length % 4) % 4));
const party = { note: v.note, epoch: v.epoch, from: v.from, to: v.to };
const wasm = () => readFileSync(createRequire(import.meta.url).resolve("@automerge/automerge/automerge.wasm"));

describe("the page's collab code", () => {
  it("is the shared file, but for where it imports e2ee from", () => {
    const copy = readFileSync(new URL("./collab.ts", import.meta.url), "utf8");
    expect(copy === shared("collab.ts").replace(`from "./e2ee.ts"`, `from "./e2ee"`),
      "web/lib/collab.ts differs from supabase/functions/_shared/collab.ts: run pnpm -C web collab:copy").toBe(true);
  });

  it("opens a note key the app sealed, from its sender only, and a change under its author only", async () => {
    const me = await importIdentity(fromBase64(v.recipient_d), fromBase64(v.recipient_public));
    const nk = await openNoteKey(v.wrap, me, fromBase64(v.sender_public), party);
    expect(toBase64(nk)).toBe(v.note_key);
    expect(text(await open3("u", v.update, nk, v.note, v.from))).toBe(v.update_plain);
    await expect(open3("u", v.update, nk, v.note, v.to)).rejects.toThrow();
    // A key a server made up, sealed by someone else, doesn't open as the sender's.
    const impostor = await newIdentity();
    const fake = await sealNoteKey(crypto.getRandomValues(new Uint8Array(32)), impostor, fromBase64(v.recipient_public), party);
    await expect(openNoteKey(fake, me, fromBase64(v.sender_public), party)).rejects.toThrow();
    await expect(openNoteKey(v.wrap, me, fromBase64(v.sender_public), { ...party, epoch: v.epoch + 1 })).rejects.toThrow();
    expect(await safetyCode(fromBase64(v.sender_public), fromBase64(v.recipient_public))).toBe(v.safety_code);
  });

  it("opens a picture under its own file id, and seals one the same way", async () => {
    const nk = fromBase64(v.note_key);
    const pic = pictureOf(await open3("f", v.picture, nk, v.note, v.picture_id));
    expect([pic.mimeType, toBase64(pic.data)]).toEqual(["image/png", v.picture_png]);
    await expect(open3("f", v.picture, nk, v.note, v.picture_id.toLowerCase())).rejects.toThrow();
    const again = await seal3("f", pictureBytes("image/png", fromBase64(v.picture_png)), nk, v.note, v.epoch, v.picture_id);
    expect(toBase64(pictureOf(await open3("f", again, nk, v.note, v.picture_id)).data)).toBe(v.picture_png);
  });

  it("derives a link's answer and key as the app does, and opens the note key the link holds", async () => {
    const lk = await linkKeys(b64url(v.link_secret), v.link_id);
    expect(lk.answer).toBe(v.web.link_answer);
    const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(lk.answer.match(/../g)!.map((h: string) => parseInt(h, 16))))));
    expect(answerHash).toBe(v.web.link_answer_hash);
    expect(await open(v.web.link_key_wrap, lk.key, `invite:${v.link_id.toLowerCase()}`)).toBe(v.note_key);
    // Another link's key, or the same box claimed for another link, opens nothing.
    const other = await linkKeys(crypto.getRandomValues(new Uint8Array(16)), v.link_id);
    await expect(open(v.web.link_key_wrap, other.key, `invite:${v.link_id.toLowerCase()}`)).rejects.toThrow();
    await expect(open(v.web.link_key_wrap, lk.key, "invite:somethingelse")).rejects.toThrow();
  });

  it("opens the account's identity with its data key and proves it's the account's, and the self wrap", async () => {
    const dk = fromBase64(v.web.data_key);
    const id = await openIdentity({ public_key: v.recipient_public, private_wrap: v.web.identity_wrap }, dk, v.web.user);
    expect(toBase64(id.publicRaw)).toBe(v.recipient_public);
    // It opens what the app sealed to that person.
    expect(toBase64(await openNoteKey(v.wrap, id, fromBase64(v.sender_public), party))).toBe(v.note_key);
    // The private key stays inside WebCrypto.
    expect(id.privateKey.extractable).toBe(false);
    // The wrong account, or a public key that isn't its own: refused.
    await expect(openIdentity({ public_key: v.recipient_public, private_wrap: v.web.identity_wrap }, dk, v.from)).rejects.toThrow();
    await expect(openIdentity({ public_key: v.sender_public, private_wrap: v.web.identity_wrap }, dk, v.web.user)).rejects.toThrow();
    expect(await open(v.web.self_wrap, await aesKey(dk), noteKeyContext(v.note, v.epoch))).toBe(v.note_key);
    expect(v.web.identity_wrap.startsWith(`amb2.${await keyIdOf(dk)}.`)).toBe(true);
    // The context names the account, as the app's (identity:<user>).
    const mine = await seal(toBase64(fromBase64(v.recipient_d)), await aesKey(dk), await keyIdOf(dk), identityContext(v.web.user));
    expect(toBase64(fromBase64(await open(mine, await aesKey(dk), identityContext(v.web.user.toUpperCase()))))).toBe(v.recipient_d);
  });

  it("opens the key the server sent down for this request, for this account and key id only", async () => {
    const priv = await crypto.subtle.importKey("jwk", {
      kty: "EC", crv: "P-256", d: Buffer.from(fromBase64(k.receiver_private)).toString("base64url"),
      x: Buffer.from(fromBase64(k.receiver_public).subarray(1, 33)).toString("base64url"), y: Buffer.from(fromBase64(k.receiver_public).subarray(33, 65)).toString("base64url"),
    }, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    const got = await openKeyCopy(k.down, priv, k.user_id, k.id);
    expect([toBase64(got.dataKey), toBase64(got.recovery)]).toEqual([k.data, k.recovery]);
    await expect(openKeyCopy(k.down, priv, crypto.randomUUID(), k.id)).rejects.toThrow();
    await expect(openKeyCopy(k.down, priv, k.user_id, "0000000000000000")).rejects.toThrow();
    // What went up isn't something to open coming down.
    await expect(openKeyCopy(k.up, priv, k.user_id, k.id)).rejects.toThrow();
  });

  it("seals presence the app opens, under its sender only", async () => {
    const nk = fromBase64(v.note_key);
    expect(text(await open3("p", v.web.presence, nk, v.note, v.web.user))).toBe(v.web.presence_plain);
    await expect(open3("p", v.web.presence, nk, v.note, v.from)).rejects.toThrow();
    const mine = await seal3("p", bytes(v.web.presence_plain), nk, v.note, v.epoch, v.web.user.toUpperCase());
    expect(text(await open3("p", mine, nk, v.note, v.web.user))).toBe(v.web.presence_plain);
  });

  describe("a board the page wrote", () => {
    beforeAll(async () => { await loadAutomerge(wasm()); });

    it("opens to its drawing, settings and comments, and its next change moves the shape", async () => {
      const A = await loadAutomerge();
      const nk = fromBase64(v.note_key);
      let doc = A.loadIncremental(A.init(), await open3("s", v.web.board_snapshot, nk, v.note, String(v.web.board_upto)));
      const before = entries(A, doc);
      expect([...before.keys()].sort()).toEqual(["box-1", "note-2"]);
      expect(before.get("note-2")!.element.text).toBe("Hej från webben");
      expect(settingsOf(doc)).toEqual({ viewBackgroundColor: "#fffce8", gridModeEnabled: true });
      expect(readComments(A, doc).map((c) => [c.id, c.on, c.name, c.text])).toEqual([["c-0123456789abcdef", "box-1", "Sara", "Kan vi flytta den här?"]]);
      doc = A.loadIncremental(doc, await open3("u", v.web.board_change, nk, v.note, v.web.user));
      expect(entries(A, doc).get("box-1")!.element.x).toBe(240);
      // Each change says whose it is, as the app's do (CollabHistory.stamp).
      const history = A.getHistory(doc);
      expect(history.at(-1)!.change.message).toBe(v.web.board_message);
      // Scalar strings, as the app writes them, not collaborative text.
      const board = (doc as unknown as { board: Record<string, { val?: string }> }).board;
      expect(typeof board["box-1"]).toBe("object");
      expect(board["box-1"].val).toContain(`"id":"box-1"`);
    });
  });
});
