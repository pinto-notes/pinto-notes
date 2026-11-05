// Does the local stack's Realtime relay a shared note's changes? Ten seconds, before a two-phone take:
//
//   deno run -A scripts/realtime-relay-check.ts
//
// Two throwaway accounts (example.com, confirmed through the admin API, so no email is sent) share a
// note. Each listens on the private channel `note:<id>` as the app does (SupabaseCollabTransport.join)
// and stores one change through the REST API. It says how long each change took to reach each of
// them, or Realtime's own words when it refused, then deletes what it made. It prints no keys and
// refuses anything but 127.0.0.1.
//
// On 2026-11-05 every subscription to changes was refused, for every phone, while presence worked
// ("1st argument: out of range", and 42P10 "no unique or exclusion constraint matching the ON CONFLICT
// specification"). The database's realtime schema had been migrated by Realtime v2.140.10 on 14
// October, and the stack was running v2.73.2, the default of the installed CLI (2.75.0).
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const status = new TextDecoder().decode((await new Deno.Command("supabase", { args: ["status", "-o", "env"], stderr: "null" }).output()).stdout);
const env: Record<string, string> = Object.fromEntries(status.split("\n").filter((l) => l.includes("=")).map((l) => {
  const i = l.indexOf("=");
  return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
}));
const api = env.API_URL, anon = env.ANON_KEY, service = env.SERVICE_ROLE_KEY;
if (!api || !/^http:\/\/127\.0\.0\.1:/.test(api)) throw new Error(`Not a local stack: ${api}. Run supabase start.`);
const sql = postgres(env.DB_URL, { max: 1, prepare: false });

// Which Realtime serves the stack, and which one migrated its schema.
const project = (await Deno.readTextFile("supabase/config.toml")).match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
const image = project
  ? new TextDecoder().decode((await new Deno.Command("docker", { args: ["ps", "--filter", `name=supabase_realtime_${project}`, "--format", "{{.Image}}"], stderr: "null" }).output()).stdout).trim()
  : "";
const [schema] = await sql`select count(*)::int as n, max(version)::text as newest from realtime.schema_migrations`;
console.log(`Realtime ${image.split(":").pop() || "(not found)"}; its schema in the database: ${schema.n} migrations, newest ${schema.newest}`);

const run = crypto.randomUUID().slice(0, 8);
const t0 = Date.now();
type Person = { name: string; id: string; c: ReturnType<typeof createClient>; got: Map<number, number>; refused?: string };
const people: Person[] = [];
const note = crypto.randomUUID();
let ok = false;
try {
  for (const name of ["emil", "sara"]) {
    const email = `relay-check-${run}-${name}@example.com`, password = crypto.randomUUID() + crypto.randomUUID();
    // The local stack lets in only listed addresses (hook_before_user_created).
    await sql`insert into public.signup_allowlist (email) values (${email}) on conflict do nothing`.catch(() => {});
    const res = await fetch(`${api}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { collab_live_test: true } }),
    });
    if (!res.ok) throw new Error(`Making ${name} failed: ${res.status} ${await res.text()}`);
    const { id } = await res.json();
    await sql`insert into public.email_unsubscribes (user_id, source) values (${id}, 'link') on conflict do nothing`.catch(() => {});
    const c = createClient(api, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await c.realtime.setAuth(data.session!.access_token);
    people.push({ name, id, c, got: new Map() });
  }
  const [emil, sara] = people;
  // The note and both memberships as collab_share and collab_join_link leave them (the keys aren't read).
  await sql`insert into public.shared_notes (id, owner_id) values (${note}, ${emil.id})`;
  await sql`insert into public.note_members (note_id, user_id, role, epoch, key_wrap, wrapped_by, accepted_at) values
    (${note}, ${emil.id}, 'owner', 1, 'amb3k.AAAA', ${emil.id}, now()),
    (${note}, ${sara.id}, 'editor', 1, 'amb3k.AAAA', ${sara.id}, now())`;

  for (const p of people) {
    const ch = p.c.channel(`note:${note}`, { config: { private: true, presence: { key: crypto.randomUUID() } } });
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "note_updates", filter: `note_id=eq.${note}` }, (m: { new: { id: number } }) => {
      p.got.set(Number(m.new.id), Date.now());
    });
    ch.on("system", {}, (m: { extension?: string; status?: string; message?: string }) => {
      if (m.extension === "postgres_changes" && m.status !== "ok") p.refused ??= String(m.message ?? m.status);
    });
    await new Promise<void>((resolve, reject) => ch.subscribe((s: string, err?: Error) => {
      if (s === "SUBSCRIBED") resolve();
      if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") reject(new Error(`${p.name} couldn't join the channel: ${err?.message ?? s}`));
    }));
  }
  // Realtime subscribes to changes a moment after the channel is joined.
  await new Promise((r) => setTimeout(r, 2500));

  const sent: { by: Person; id: number; at: number }[] = [];
  for (const by of people) {
    const at = Date.now();
    const { data, error } = await by.c.from("note_updates").insert({ note_id: note, epoch: 1, ct: "amb3u.1.AAAA" }).select("id").single();
    if (error) throw new Error(`${by.name}'s change wasn't stored: ${error.message}`);
    sent.push({ by, id: Number((data as { id: number }).id), at });
    await new Promise((r) => setTimeout(r, 2000));
  }
  let missed = 0;
  for (const s of sent) {
    const line = people.map((p) => {
      const got = p.got.get(s.id);
      if (got === undefined) missed += 1;
      return `${p.name} ${got === undefined ? "never" : `in ${((got - s.at) / 1000).toFixed(2)} s`}`;
    });
    console.log(`${s.by.name}'s change reached ${line.join(", ")}`);
  }
  const refused = people.find((p) => p.refused)?.refused;
  if (refused) {
    console.log(`REFUSED: Realtime won't subscribe to changes: ${refused}`);
    if (/ON CONFLICT|out of range/.test(refused)) {
      console.log("The database's realtime schema is newer than this Realtime server. Run the stack with the Realtime that migrated it:");
      console.log("  echo v2.140.10 > supabase/.temp/realtime-version   (or a CLI that ships it), then supabase stop && supabase start");
    }
  } else if (missed > 0) {
    console.log(`MISSED: ${missed} of ${sent.length * people.length} arrivals never came, with no refusal from Realtime.`);
  } else {
    ok = true;
    console.log("OK: Realtime relays a shared note's changes to both members.");
  }
} finally {
  for (const p of people) await p.c.removeAllChannels();
  await sql`delete from public.shared_notes where id = ${note}`;
  for (const p of people) {
    await fetch(`${api}/auth/v1/admin/users/${p.id}`, { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } }).then((r) => r.body?.cancel());
  }
  await sql.end();
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
Deno.exit(ok ? 0 : 1);
