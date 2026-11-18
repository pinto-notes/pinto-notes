// The shared-folder formats (collab.ts) against the pinned vectors in collab-vectors.json, which the
// app's CollabCryptoTests open too: names, note keys under FK, FK to a member and under the data
// key, and the ids a member's library gives shared notes and folders.
//   deno test -A supabase/functions/_shared/collab.test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { aesKey, fromBase64, open, seal, toBase64, Vault } from "./e2ee.ts";
import {
  derivedId, folderBoxEpoch, folderKeyContext, importIdentity, openFolderName, openFolderWrap, openNoteKey, sealFolderName, sealFolderWrap,
  sharedFolderText, sharedNoteText,
} from "./collab.ts";

const v = JSON.parse(await Deno.readTextFile(new URL("./collab-vectors.json", import.meta.url)));
const f = v.folder;
const fk = fromBase64(f.folder_key);

Deno.test("a folder name seals to the pinned box and opens only for its folder", async () => {
  assertEquals(await sealFolderName(f.name, fk, f.root, f.epoch, f.subfolder, fromBase64(f.name_nonce)), f.name_box);
  assertEquals(await openFolderName(f.name_box, fk, f.root, f.subfolder), f.name);
  assertEquals(folderBoxEpoch(f.name_box), f.epoch);
  // Moved to another folder, or another root, it doesn't open.
  await assertRejects(() => openFolderName(f.name_box, fk, f.root, f.root));
  await assertRejects(() => openFolderName(f.name_box, fk, f.subfolder, f.subfolder));
  // An epoch changed in the prefix changes the context.
  await assertRejects(() => openFolderName(f.name_box.replace(`amb3f.${f.epoch}.`, `amb3f.${f.epoch + 1}.`), fk, f.root, f.subfolder));
});

Deno.test("a note's key under FK seals to the pinned wrap and names both epochs", async () => {
  const nk = fromBase64(v.note_key);
  assertEquals(await sealFolderWrap(nk, fk, f.root, f.epoch, f.note, f.note_epoch, fromBase64(f.wrap_nonce)), f.folder_wrap);
  const got = await openFolderWrap(f.folder_wrap, fk, f.root, f.note);
  assertEquals([toBase64(got.nk), got.epoch, got.noteEpoch], [v.note_key, f.epoch, f.note_epoch]);
  await assertRejects(() => openFolderWrap(f.folder_wrap, fk, f.root, f.subfolder));
  await assertRejects(() => openFolderWrap(f.folder_wrap.replace(`.${f.note_epoch}.`, `.${f.note_epoch + 1}.`), fk, f.root, f.note));
});

Deno.test("FK reaches a member as a note key does, with the root in the note's place", async () => {
  const me = await importIdentity(fromBase64(v.recipient_d), fromBase64(v.recipient_public));
  const opened = await openNoteKey(f.member_wrap, me, fromBase64(v.sender_public), { note: f.root, epoch: f.epoch, from: v.from, to: v.to });
  assertEquals(toBase64(opened), f.folder_key);
  await assertRejects(() => openNoteKey(f.member_wrap, me, fromBase64(v.sender_public), { note: f.note, epoch: f.epoch, from: v.from, to: v.to }));
});

Deno.test("FK under the data key: amb2 with context folderkey:<root>:<epoch>", async () => {
  const dk = fromBase64(f.data_key);
  const key = await aesKey(dk);
  assertEquals(await seal(toBase64(fk), key, f.data_key_id, folderKeyContext(f.root, f.epoch), fromBase64(f.self_wrap_nonce)), f.self_wrap);
  assertEquals(await open(f.self_wrap, key, `folderkey:${f.root}:${f.epoch}`), f.folder_key);
  const vault = await Vault.from(dk.slice(), crypto.randomUUID());
  assertEquals(toBase64(await vault.openFolderKey(f.root.toUpperCase(), f.epoch, f.self_wrap)), f.folder_key);
});

Deno.test("a member's ids for shared notes and folders are keyed with their data key", async () => {
  const dk = fromBase64(f.data_key);
  assertEquals(await derivedId(dk, sharedNoteText(f.note)), f.shared_note_id);
  assertEquals(await derivedId(dk, sharedFolderText(f.root.toUpperCase())), f.shared_folder_id);
  const vault = await Vault.from(dk.slice(), crypto.randomUUID());
  assertEquals(await vault.derivedId(sharedFolderText(f.root)), f.shared_folder_id);
  // Version 5, RFC 4122 variant.
  assertEquals([f.shared_folder_id[14], "89ab".includes(f.shared_folder_id[19])], ["5", true]);
});
