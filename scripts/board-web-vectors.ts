// Writes the "web" part of supabase/functions/_shared/collab-vectors.json: what the whiteboard page
// in a browser seals and writes (web/lib/board-doc.ts, board-keys.ts, collab.ts), made with that
// code, so the app's tests (PaneTests/CollabCryptoTests.swift) open it and the page's tests
// (web/lib/board-crypto.test.ts) check it. Run again only when a format changes:
//   deno run -A scripts/board-web-vectors.ts
import * as A from "npm:@automerge/automerge@3.5.0";
import { aesKey, fromBase64, hex, keyIdOf, seal, toBase64 } from "../supabase/functions/_shared/e2ee.ts";
import { bytes, identityContext, linkKeys, noteKeyContext, seal3 } from "../supabase/functions/_shared/collab.ts";
import { put } from "../web/lib/board-doc.ts";

const path = new URL("../supabase/functions/_shared/collab-vectors.json", import.meta.url);
const v = JSON.parse(await Deno.readTextFile(path));
const nk = fromBase64(v.note_key), dk = fromBase64("QkFOQU5BUy1BUkUtR09PRC1GT1ItWU9VLTEyMzQ1Njc=");
const user = v.to as string, note = v.note as string, epoch = v.epoch as number;
const b64url = (s: string) => fromBase64(s.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - s.length % 4) % 4));

// The link: what the server checks, and the note key sealed under the link's key (ShareModel.publishInviteLink).
const lk = await linkKeys(b64url(v.link_secret), v.link_id);
const answerHash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(lk.answer.match(/../g)!.map((h) => parseInt(h, 16))))));

// A board as the page writes it: two shapes, the settings and a comment, then a change that moves one.
const box = { id: "box-1", type: "rectangle", x: 100, y: 80, width: 160, height: 90, angle: 0, strokeColor: "#1e1e1e",
  backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, roughness: 1, opacity: 100, seed: 1234, version: 3,
  versionNonce: 98765, isDeleted: false, index: "a0", boundElements: null, groupIds: [], updated: 1763200000000 };
const label = { ...box, id: "note-2", type: "text", text: "Hej från webben", x: 320, index: "a1", version: 2, versionNonce: 4321, seed: 55,
  fontSize: 20, fontFamily: 5, textAlign: "left", verticalAlign: "top", containerId: null, originalText: "Hej från webben", lineHeight: 1.25 };
const comment = { id: "c-0123456789abcdef", by: user.toUpperCase(), name: "Sara", text: "Kan vi flytta den här?", created: "2026-11-17T09:12:00Z",
  on: "box-1", x: 1, y: 0, resolved: false, version: 1 };
let doc = A.from({ body: "Whiteboard" }) as A.Doc<Record<string, unknown>>;
doc = A.change(doc, (d) => { d.board = {}; d.boardState = {}; });
doc = put(A as never, doc, { elements: [["box-1", box], ["note-2", label]], settings: { viewBackgroundColor: "#fffce8", gridModeEnabled: true }, comments: [comment] }, user, new Date("2026-11-17T09:12:00Z")).doc;
const upto = 42;
const snapshot = await seal3("s", A.save(doc) as Uint8Array<ArrayBuffer>, nk, note, epoch, String(upto));
const moved = { ...box, x: 240, version: 4, versionNonce: 111 };
const change = put(A as never, doc, { elements: [["box-1", moved]] }, user, new Date("2026-11-17T09:13:00Z")).bytes!;

v.web = {
  about: "What the whiteboard page in a browser seals and writes (web/lib/board-*.ts), made by scripts/board-web-vectors.ts with that code. The app opens it in CollabCryptoTests; the page's tests check it.",
  user, data_key: toBase64(dk),
  identity_wrap: await seal(toBase64(fromBase64(v.recipient_d)), await aesKey(dk), await keyIdOf(dk), identityContext(user)),
  self_wrap: await seal(toBase64(nk), await aesKey(dk), await keyIdOf(dk), noteKeyContext(note, epoch)),
  link_answer: lk.answer, link_answer_hash: answerHash,
  link_key_wrap: await seal(toBase64(nk), lk.key, await keyIdOf(nk), `invite:${v.link_id.toLowerCase()}`),
  presence_plain: JSON.stringify({ name: "Sara", pointer: [120.5, 80], sel: ["box-1"] }),
  board_upto: upto, board_snapshot: snapshot,
  board_change: await seal3("u", change as Uint8Array<ArrayBuffer>, nk, note, epoch, user),
  board_message: `u:${user.toUpperCase()}`,
};
v.web.presence = await seal3("p", bytes(v.web.presence_plain), nk, note, epoch, user);
await Deno.writeTextFile(path, JSON.stringify(v, null, 2) + "\n");
console.log("collab-vectors.json: web written");
