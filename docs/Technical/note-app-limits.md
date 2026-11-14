# Note app limits

What limits a note app's size, and why (2026-11-16). The code is `supabase/functions/mcp/app_project.ts` (the limits), `app_blobs.ts` (parts and pieces), `files_tools.ts` (the write tool) and `Pane/Views/NotePageProject.swift` (the same limits on the devices).

## The limits

| | Before | Now | Why this number |
|---|---|---|---|
| Binary file (a .wasm, a disk image, a dataset) | 8 MB stored (server), 64 MB unpacked (device) | 100 MB | The size of a file added to a note (`pane_limit 'file_bytes'`). A device serves the file to the app whole, so it is in memory once. |
| Text of the app (text files, what they compile to, the names of its binary files) | 16 MB, binary files counted in | 16 MB, text only | It is sealed as one page, kept in each of the last 10 versions and synced whole. 16 MB stays under the 23.5 MB sealed page limit (`20261114120000_note_app_size.sql`). |
| One text file | 8 MB | 16 MB | As much as the whole app's text. |
| Files in an app | 200 | 10,000 | The account's limit on files (`pane_limit 'files'`). |
| `content_url` download | 10 MB | 100 MB for an app's file, 10 MB for a note's or folder's file | The binary file limit. A folder's file is sealed as one box in one request, so it keeps 10 MB. |
| One write's base64 | 10 MB | 10 MB (kept) | The edge function has 256 MB of memory per request. A bigger file comes in pieces. |
| Account storage | 2 GB | 2 GB (kept) | Protects storage. Every part counts the moment it is stored, so pieces can't go past it. |

## How a big file is stored

A binary file up to 4 MiB is one row in `note_app_blobs`, named by a keyed hash of its bytes, as before (`20261115090000_note_app_blobs.sql`). A bigger file is stored in parts of 4 MiB, each a row named the same way, and the project names them in order:

```json
"/disk.img": { "size": 62914560, "parts": [{ "hash": "…", "size": 4194304 }, …] }
```

The device cuts a file it adds the same way (`NotePageProject.storingBlobs`), so the same bytes get the same names wherever they were added, and sync moves one part at a time (`SyncEngine.pushBlobs`, `pullBlobs`). Parts that don't compress are stored as DEFLATE stored blocks, which costs a copy instead of 29 ms of CPU a MB.

Note: a stored part counts as its sealed base64 (`octet_length(blob_ct)`), about 1.33 times its bytes, so a 60 MB disk image uses about 80 MB of the 2 GB.

## Pieces

A file bigger than one write carries arrives in pieces: `write { path, content_base64, offset, size }`, where `size` is the whole file. Each piece is cut at the file's 4 MiB grid and its parts stored at once; `note_app_uploads` (`20261116120000_note_app_uploads.sql`) remembers which pieces came. The answer to a piece says what is still missing. The last piece saves the file into the app, as one version with one check. A piece sent again replaces the one before; a different `size` starts over. An upload nobody finishes goes after a day, with its parts.

## Several files in one save

`write { path: "Games/Doom.app", files: [{ path, content | content_base64 | content_url | offset + size | delete: true }] }` saves every file together: one version, one check. If one of them can't be saved, nothing is. `pinto push` uses it.

## The save check

The render service (`scripts/page-render`) runs the app in WebKit for the check. A project sends the names of its parts, not their bytes; the service answers 409 with the parts it doesn't have, the MCP server sends them (`PUT /parts/<hash>`), and the render goes again. The service keeps parts in memory for 30 minutes, at most 1 GB, so the next save of the same app sends none.

## Deploy order

1. The migration `20261116120000_note_app_uploads.sql`.
2. The render service, before the MCP server: a new MCP server sends part names.
3. The `mcp` edge function.
4. The apps. A build without parts support can't open an app that has a file over 4 MiB, so the apps should ship with or soon after the server.
