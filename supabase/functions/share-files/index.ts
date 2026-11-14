// Files for a shared page: the readable copies the owner's device published with the page
// (note_share_files), and only those the page's copy embeds; and a shared whiteboard's picture
// and scene (note_share_pictures, note_share_scenes). Notes and the files bucket are sealed with
// the account's key, so this function never reads them.
//
//   GET /functions/v1/share-files?slug=<slug>[&sub=<sub-note id>]
//   → { files: { "<attachment id>": { path, name, type, size } } }
//   GET /functions/v1/share-files?slug=<slug>&file=<attachment id>[&sub=<sub-note id>]
//   → the file's bytes
//   GET /functions/v1/share-files?slug=<slug>&picture=<version>
//   → the board's picture (image/png); shared_note gives its version and size
//   GET /functions/v1/share-files?slug=<slug>&scene=<version>
//   → the board's scene, downloaded as "<board name>.excalidraw" (application/json)
//
// `path` is relative to the Supabase URL (/functions/v1/share-files?slug=…&file=…): the caller
// prefixes its own public Supabase URL, so this works behind any internal hostname.
//
// Public on purpose (the share page has no account); the slug is the secret. The bytes come from
// shared_file(), shared_picture() and shared_scene(), which answer only for a file the (sub)page's
// published copy embeds, or the page's own picture or scene, and only while the link is live.
// Logs carry an event name and a status, never a slug or a file name. handler.ts answers; this
// only serves it.

import { clientAddress } from "../_shared/client.ts";
import { connect, readiness } from "../_shared/db.ts";
import { atHome } from "../_shared/region.ts";
import { dailyHash, hashSecret } from "../_shared/hash.ts";
import { answer, reply } from "./handler.ts";
import { RateLimiter } from "./logic.ts";

// Through the transaction pooler when DB_POOLER_HOST is set (_shared/db.ts says why).
const sql = connect(Deno.env, 2);
const ready = readiness(sql);
const perIP = new RateLimiter(120, 60_000);

Deno.serve(atHome("share-files", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" } });
  }
  if (req.method !== "GET") return reply({ error: "method not allowed" }, 405);
  await ready();
  const ip = clientAddress(req);
  if (!perIP.allow(await dailyHash(hashSecret(), ip))) return reply({ error: "slow down" }, 429);
  return await answer(sql, new URL(req.url));
}));
