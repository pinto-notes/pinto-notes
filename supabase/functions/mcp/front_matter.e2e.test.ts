// A note's front matter (20261030200000_note_front_matter.sql) against the LOCAL stack, inside a
// transaction that is always rolled back, so the local database is left as it was:
//   scripts/mcp-e2e.sh front_matter.e2e.test.ts
// If the migration isn't applied locally yet, the test applies it inside that transaction. The
// same checks run on PGlite in front_matter.pglite.test.ts; this one proves them on real Postgres.
import { assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import postgres from "npm:postgres@3.4.5";

const dbURL = Deno.env.get("PANE_DB_URL");
const enabled = Boolean(dbURL && /127\.0\.0\.1|localhost/.test(dbURL ?? ""));
const migration = new URL("../../migrations/20261030200000_note_front_matter.sql", import.meta.url);

class Rollback extends Error {}
type Tx = postgres.TransactionSql;

const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
/** A box as the app makes it. The server never opens one, so any bytes do. */
const box = (key: string) => `amb2.${key}.${btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))))}`;

async function scratch(body: (tx: Tx, as: (user: string, settings?: Record<string, string>) => Promise<void>) => Promise<void>) {
  const sql = postgres(dbURL!, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      const [{ applied }] = await tx`select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'props_ct') as applied`;
      if (!applied) await tx.unsafe(await Deno.readTextFile(migration));
      const as = async (user: string, settings: Record<string, string> = {}) => {
        await tx`reset role`;
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: user, role: "authenticated" })}, true),
                        set_config('pane.source', ${settings["pane.source"] ?? ""}, true),
                        set_config('pane.client', ${settings["pane.client"] ?? ""}, true),
                        set_config('request.headers', ${JSON.stringify({ "x-pane-device": "Mac", "x-amber-client": "lock-aware/1 e2ee/1" })}, true)`;
        await tx`delete from public.pane_rate where user_id = ${user}`;
        await tx.unsafe(`set local role authenticated`);
      };
      await body(tx, as);
      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  } finally {
    await sql.end();
  }
}

/** A fresh user with an account key, made inside the transaction. */
async function newAccount(tx: Tx, as: (user: string) => Promise<void>) {
  const id = crypto.randomUUID();
  await tx`reset role`;
  await tx`insert into auth.users (id, email, aud, role) values (${id}, ${`${id}@pane.local`}, 'authenticated', 'authenticated')`;
  const key = hex(8);
  await as(id);
  await tx`select * from public.create_account_key(${key}, ${hex(32)}, ${box(key)}, 0)`;
  return { id, key };
}

/** Inside a savepoint, so a refused write doesn't end the transaction. */
async function refused(tx: Tx, write: () => Promise<unknown>, text: string) {
  await tx`savepoint refused`;
  const e = await assertRejects(write);
  assertStringIncludes((e as Error).message, text);
  await tx`rollback to savepoint refused`;
}

Deno.test({ name: "front matter: sealed like the text, open and locked, and gone with the note", ignore: !enabled }, async () => {
  await scratch(async (tx, as) => {
    const me = await newAccount(tx, as);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const lockKey = [...new Uint8Array(await crypto.subtle.digest("SHA-256", salt)).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const id = crypto.randomUUID();
    await as(me.id);
    await tx`insert into public.notes (id, head_ct, body_ct, props_ct) values (${id}, ${box(me.key)}, ${box(me.key)}, ${box(me.key)})`;
    await refused(tx, () => tx`update public.notes set props_ct = ${box(hex(8))} where id = ${id}`, "old key");
    await refused(tx, () => tx`update public.notes set props_ct = 'aliases: [Oporto]' where id = ${id}`, "notes_props_sealed");

    await tx`insert into public.note_locks (salt, iterations, key_id, verifier, hint) values (${btoa(String.fromCharCode(...salt))}, 600000, ${lockKey}, 'v', null)`;
    await refused(tx, () => tx`update public.notes set body_ct = null, locked_body = ${box(lockKey)} where id = ${id}`, "notes_props_sealed");
    await tx`update public.notes set body_ct = null, locked_body = ${box(lockKey)}, props_ct = null, locked_props = ${box(lockKey)} where id = ${id}`;
    await refused(tx, () => tx`update public.notes set locked_props = ${box(hex(8))} where id = ${id}`, "different notes password");
    await as(me.id, { "pane.source": "mcp", "pane.client": "Claude" });
    await refused(tx, () => tx`update public.notes set locked_props = ${box(lockKey)} where id = ${id}`, "This note is locked");

    await as(me.id);
    await tx`update public.notes set deleted_at = now(), body_ct = null, head_ct = null, locked_body = null where id = ${id}`;
    const [row] = await tx`select props_ct, locked_props from public.notes where id = ${id}`;
    assertEquals([row.props_ct, row.locked_props], [null, null]);
  });
});
