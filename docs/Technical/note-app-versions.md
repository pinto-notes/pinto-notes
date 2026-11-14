# Note app versions without copies of big files

Status: built on `feature/note-app-versions` (15 November 2026), not deployed. It ships with 1.4. Because it changes sync and storage, it gets a release gate report first.

## The problem

Every version of a note's app was the whole app.

- **Server.** `note_pages.page_ct` holds the sealed project (`{"amberApp":1,"files":…,"compiled":…,"binary":…}`). The trigger `pane_note_page_keep` copies the old `page_ct` into `note_page_versions` on every change of the app, and on data changes at most once a minute. It keeps the last 10 rows per note.
- **Device.** `NotePageStore` keeps the live page and the last 10 pages per note in `note-pages.json`, and rewrites that file on every change.

Doom packed as binary files is about 2.6 MB a version (3.5 MB sealed). Ten versions cost about 35 MB on the server and the same in `note-pages.json`.

## What is built: files by keyed hash

Each binary file is stored once per account under a keyed hash of its bytes. A version names its files.

- **Format.** A `binary` entry is either a packed string (base64 of raw DEFLATE: the old format, still valid everywhere) or `{"hash": "<64 hex>", "size": <unpacked bytes>}`. Text files (`files`, `compiled`) stay inline: they are small and change often.
- **Name.** HMAC-SHA256 of the unpacked bytes under HKDF(notes key, salt `amber-notes/e2ee`, info `app-blob`). Equal files in two accounts get different names. Vector `app_blob` in `supabase/functions/_shared/e2ee-vectors.json` pins the server and the apps to each other.
- **Box.** The packed bytes, sealed like `page_ct` with the context `app-blob:<hash>`.
- **Server** (`20261115090000_note_app_blobs.sql`):
  - `note_app_blobs (user_id, hash, blob_ct, created_at, used_at)`, primary key `(user_id, hash)`. Owners can read and insert. Nobody can update, so a name always holds the same bytes. Inserts go through the key check and the storage limit, like other sealed rows.
  - `note_pages.page_blobs`, `note_pages.draft_blobs` and `note_page_versions.page_blobs` (`text[]`) list the names a row uses, in plain text, so the database can clean up without opening anything. Versions copy the names with the page.
  - A trigger on `note_pages` refuses a page that names a file the server doesn't have (`PT409`, hint `app_blobs_missing`), and marks the files it names as just used. That mark also row-locks them against a clean-up running at the same moment.
  - Clean-up (`pane_app_blobs_gc`) runs after a page changes or a page or version is deleted. It removes files that no page, draft or version names and that haven't been used for 10 minutes.
  - `pane_storage_parts` counts each file once.
- **MCP.** Projects stay whole in memory. `app_blobs.ts` opens a page by fetching the files it names (`openProject`). On save it stores only the files the server doesn't have yet and writes the names (`storeProject`). `history` and `restore` copy names, so no bytes move. The render service gets whole projects (`inlineStored`), so it needs no change.
- **Mac and iPhone** (one target):
  - `AppBlobs` keeps each file once in `Application Support/<data folder>/app-files`.
  - `NotePageStore.setHere` moves an app's binary files there when the device has the account's key. Signed out, apps keep their bytes inside, as before.
  - Previous App and the 10-version history hold names only, so `note-pages.json` stays small.
  - Files no page or version names are removed when the store saves.
  - The sync push sends missing files first, then the page with `page_blobs`.
  - The pull parks an app until its files are here, fetches only the files the device lacks, then shows it. A file the server doesn't have either doesn't block forever: the app arrives, fails to open, and the version before it runs.
  - The apps add `app-blobs/1` to `x-amber-client`.

Old apps and versions are never rewritten. They open as they did, and their next save from 1.4 or the AI stores their files apart.

## Files from an address (`content_url`)

Built on `feature/write-from-url`. An AI that can't send 4 MB as base64 (ChatGPT and Claude on the web) passes an address instead: `write { path, content_url: "https://…" }`. It works wherever `content_base64` does, for an app's files and a folder's or note's files. The server downloads the file before the transaction opens and then stores it through the same code as `content_base64`, so it is sealed, hashed, stored once and versioned the same way. The answer adds `bytes`, `sha256` (plain SHA-256 of the bytes, so the AI can compare it with the source), `downloaded_from` and `content_type`.

The download (`public_fetch.ts`, shared with ChatGPT's file links):

- https only, on port 443, with no user name or password in the address.
- The name is resolved and every address must be public. Refused: loopback, private ranges, link-local and the metadata address 169.254.169.254, CGNAT (100.64/10), multicast and reserved ranges, and the IPv6 equivalents (`::1`, `fc00::/7` including `fd00:ec2::254`, `fe80::/10`, `ff00::/8`, IPv4-mapped and NAT64 forms of the above).
- The connection goes to the address that was checked (TCP to that IP, then TLS with the name for the certificate), so DNS can't answer differently the second time.
- Redirects are followed by hand, at most 3, and each hop is checked the same way.
- No cookies, credentials or caller headers go along. It asks for the bytes unpacked (`Accept-Encoding: identity`).
- 30 s for the whole download. It stops reading past 10 MB (the `content_base64` limit) and says so.
- Exactly one of `content`, `content_base64`, `content_url` (or ChatGPT's `file`).

## Numbers

Doom, 7 files, 3 saves kept (the live app and 2 versions), measured by `app_blobs.pglite.test.ts` with `DOOM_DIR` set:

| | Bytes stored |
|---|---|
| Before (each version holds every file) | 10,664,622 (3,554,874 a save) |
| After | 2,888,214 |
| of which: the files, once | 2,592,520 |
| of which: the live app's text | 98,570 |
| of which: 2 versions' text | 197,124 |

Each further save that changes only text costs about 99 KB instead of 3.5 MB.

## 1.3 clients on the same account

1.3 doesn't know the hash form. It ignores the `binary` key, and it can't run binary apps anyway. Three cases:

1. **1.3 pulls an app that names its files.** It shows the app's text files only, as it does today for any binary app. Nothing breaks.
2. **1.3 pushes a page** (its own edit, or Previous App). It sends `page_ct` without `page_blobs`. The trigger sees no `app-blobs/` in `x-amber-client` and sets the names to unknown (null). While any row of that account has unknown names, clean-up does nothing. It resumes once that row is replaced by a 1.4 or AI save and has left the last 10 versions. Nothing a 1.3 page might name is deleted.
3. **Remaining risk.** 1.3's Previous App can push back a page from its local history that names files that were already cleaned up. That happens if, between 1.3 pulling the page and pushing it back, the files left every server version for more than 10 minutes. 1.4 devices and the AI then can't open that version, and they run the version before it. No data is lost: the version is still listed, and 1.3 still has its own copy. This needs a binary app edited on a 1.4 device or by the AI, then more than 10 newer versions, then a restore from 1.3. Binary apps are new on this branch, so no 1.3 user has one today.

## Deploy order

1. The migration `20261115090000_note_app_blobs.sql`. It must go first: 1.4 apps and the new MCP always send `page_blobs`, which an older database would refuse.
2. The `mcp` edge function.
3. The 1.4 apps.

The render service needs no change.

## Tests

- `supabase/functions/mcp/app_blobs.pglite.test.ts`:
  - saving twice stores no file again, and a changed file is stored once
  - restore gives back the exact files
  - an old-format app opens, saves and restores
  - a device must send files first, and the table's row-level rules hold
  - clean-up timing
  - the 1.3 freeze
  - storage counting
  - the Doom numbers
- `supabase/functions/_shared/e2ee.test.ts`: the `app_blob` vector.
- `supabase/functions/mcp/public_fetch.test.ts` and `write_from_url.pglite.test.ts`: `content_url` against a local https server (`test_https.ts`, a certificate made by openssl for the run): exact bytes and hash, stored once like `content_base64`, restored from a version, each refused address class, redirects inside, http, too big, too slow.
- `PaneTests/AppBlobsTests.swift`:
  - one changed file stores one new file
  - restore gives back exact files, and they are kept across a launch
  - an old-format version opens
  - unused files go
  - an app from the server waits for its files
  - the format reads back the same
- `PaneTests/Network/AppBlobsSyncTests.swift`: files go up once and before the page, and a pulled app opens once its files are here.
- `PaneTests/E2EETests.swift`: the same `app_blob` vector on the device.
