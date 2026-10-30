// AI changes (20261030153000_ai_changes.sql) against the LOCAL stack, inside a transaction that is
// always rolled back, so the local database is left as it was:
//   scripts/mcp-e2e.sh ai_changes.e2e.test.ts
// If the migration isn't applied locally yet, the test applies it inside that transaction. The
// same checks run on PGlite in ai_changes.pglite.test.ts; this one proves them on real Postgres.
import { assert, assertEquals } from "jsr:@std/assert@1";
import postgres from "npm:postgres@3.4.5";

const dbURL = Deno.env.get("PANE_DB_URL");
const enabled = Boolean(dbURL && /127\.0\.0\.1|localhost/.test(dbURL ?? ""));
const migration = new URL("../../migrations/20261030153000_ai_changes.sql", import.meta.url);

class Rollback extends Error {}
type Tx = postgres.TransactionSql;

const hex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
/** A box as the app makes it. The server never opens one, so any bytes do. */
const box = (key: string) => `amb2.${key}.${btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))))}`;

async function scratch(body: (tx: Tx, as: (user: string, settings?: Record<string, string>) => Promise<void>) => Promise<void>) {
  const sql = postgres(dbURL!, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      const [{ applied }] = await tx`select to_regprocedure('public.ai_changes(timestamptz, integer, text)') is not null as applied`;
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

Deno.test({ name: "ai_changes: an AI's edits, notes and moves across notes, newest first, and only your own", ignore: !enabled }, async () => {
  await scratch(async (tx, as) => {
    const me = await newAccount(tx, as);
    const other = await newAccount(tx, as);
    const ai = { "pane.source": "mcp", "pane.client": "ChatGPT" };
    const a = crypto.randomUUID(), b = crypto.randomUUID();
    await as(me.id);
    await tx`insert into public.notes (id, head_ct, body_ct) values (${a}, ${box(me.key)}, ${box(me.key)})`;
    await as(me.id, ai);
    await tx`update public.notes set head_ct = ${box(me.key)}, body_ct = ${box(me.key)}, updated_at = now() where id = ${a}`;
    await tx`insert into public.notes (id, head_ct, body_ct) values (${b}, ${box(me.key)}, ${box(me.key)})`;
    await tx`update public.notes set trashed_at = now() where id = ${b}`;
    await as(me.id);
    await tx`update public.notes set head_ct = ${box(me.key)}, body_ct = ${box(me.key)}, updated_at = now() where id = ${a}`;
    const list = await tx`select * from public.ai_changes()`;
    assertEquals(list.map((c) => [c.kind, c.ai, c.note_id]), [["deleted", "ChatGPT", b], ["created", "ChatGPT", b], ["edit", "ChatGPT", a]]);
    assert(list[2].before_version !== null && list[2].after_version !== null);
    assertEquals(Number(list[2].after_version), Number(list[2].before_version) + 1);
    await as(other.id);
    assertEquals((await tx`select * from public.ai_changes()`).length, 0);
  });
});
