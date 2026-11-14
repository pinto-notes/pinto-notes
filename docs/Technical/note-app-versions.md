# Note app versions without copies of big files

Status: design, not built (14 November 2026). Written for the change that lets note apps carry binary files (a game's engine and data). Nothing here is live.

## What happens today

Every version of a note's app is the whole app.

- **Server.** `note_pages.page_ct` holds the sealed project (`{"amberApp":1,"files":…,"compiled":…,"binary":…}`). The trigger `pane_note_page_keep` (latest in `20261007160600_app_file_writes_coalesce.sql`) copies the old `page_ct` into `note_page_versions` on every change of the app, and on data changes at most once a minute (`reason = 'data'`, with the same `page_ct` as the live row). The last 10 rows per note are kept.
- **Device.** `NotePageStore` keeps the live page and the last 10 pages per note in `note-pages.json`, and writes that whole file on every change.
- **Restore.** Only the MCP reads server versions (`history` and `restore` in `files_tools.ts`, and `tools.ts`). The device's Previous App reads its own history.

With Doom packed as binary files (about 2.6 MB a version, 3.5 MB sealed), 10 versions are about 35 MB on the server. On the device, `note-pages.json` grows by the same amount and is rewritten on every save. A game that saves its data every minute adds a data version with another full copy of the app each minute.

## Why the small fixes aren't enough, or aren't safe

1. **Store no `page_ct` on data versions** (null means "the same app as the next version that has one, or the live one"). This saves the most for games that save often, and only the server changes: a migration that drops `not null`, the trigger, and the three readers. It isn't safe with coalescing, though. When the file tools replace an app without keeping it (`pane.coalesce`), a data version made in between would resolve to the wrong app. Fixing that means the trigger has to look at the versions around it on every write. That is possible but easy to get wrong, and it does nothing for the device.
2. **Dedupe identical ciphertext.** A sealed box has a random nonce, so the same app sealed twice never matches. Only the data-version copies are byte-identical, and Postgres stores each row's TOAST value separately.
3. **Keep fewer versions for big apps.** This keeps restore working but loses history. People notice that more than they notice storage.

## The design: files by hash

Store each file once, under the hash of its bytes, and make a version a list of hashes.

- **Format.** The project keeps `files` and `compiled` for text (small, and diffs well), and `binary` becomes `{"/doom1.wad": {"sha256": "…", "size": 4196020}}` when the file is stored apart. An inline string (today's format) stays valid, so old projects and old clients keep working. A file goes apart when it is over 256 KB packed.
- **Server table.** `note_app_blobs (user_id, sha256, blob_ct, size, created_at)`, with a primary key of `(user_id, sha256)`. `blob_ct` is the packed bytes sealed with the notes key, like `page_ct`. The hash is keyed per account (HMAC with a key derived from the notes key, as `c.v.tag` already does), so equal files in two accounts don't reveal each other. Writing a blob that already exists does nothing.
- **References.** Each `note_pages` and `note_page_versions` row gets `blob_refs text[]`, the keyed hashes in plain text so the database can collect garbage without opening anything. The blob trigger deletes blobs that no row references, after the version trim.
- **Sync.** The device pushes missing blobs first (`upsert … on conflict do nothing`), then the page. Pulling a page fetches only the blobs it doesn't have. The device keeps blobs in a folder, not in `note-pages.json`, so that file stays small. Its history holds hashes too, so 10 versions of Doom cost one WAD.
- **Readers.** The MCP's `fetch`, `write`, `history` and `restore`, the render service and template export resolve hashes through one helper. Restore copies the list of hashes, and no bytes move.
- **Storage limit.** `pane_storage_parts` counts each blob once per account.

Cost: one migration (table, column, trigger), sync changes on Mac and iPhone (push and pull blobs, a local blob folder, a one-time move out of `note-pages.json`), the MCP readers, the render service and an export step. Every part of it is ordinary, but together it is a change to sync and storage, so it gets a release gate report before it ships.

## Until then

Binary files are stored compressed. Doom is about 2.6 MB a version instead of 6.2 MB as base64 text, which more than halves the cost of every version without changing how versions work.
