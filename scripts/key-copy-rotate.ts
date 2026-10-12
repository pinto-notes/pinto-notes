// Seals every stored copy of an account key under the newest KEY_COPY_SECRET_<n>, so the older
// secret can be deleted (docs/Technical/recoverable-key.md, "Rotating the secret").
//
//   SUPABASE_DB_URL=… KEY_COPY_SECRET_1=… KEY_COPY_SECRET_2=… deno run -A scripts/key-copy-rotate.ts
//
// Prints how many rows it sealed again and how many it couldn't open, never anything else.
import postgres from "npm:postgres@3.4.5";
import { resealAll } from "../supabase/functions/key/logic.ts";

const url = Deno.env.get("SUPABASE_DB_URL");
if (!url) { console.error("SUPABASE_DB_URL is not set"); Deno.exit(2); }
const sql = postgres(url, { max: 1, prepare: false });
try {
  const r = await resealAll(sql, Deno.env);
  console.log(`sealed again: ${r.resealed}, unreadable: ${r.unreadable}`);
  if (r.unreadable > 0) Deno.exit(1);
} finally {
  await sql.end();
}
