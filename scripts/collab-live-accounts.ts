// Three test accounts for the live shared-notes test (PaneTests/Collab/CollabLiveTests.swift), on the
// local stack or staging. Never production: it refuses production's project.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… SUPABASE_ANON_KEY=… deno run -A scripts/collab-live-accounts.ts <out.json>
//
// The accounts are made confirmed through the admin API, so no email is sent, and are opted out of the
// onboarding emails straight away. Their addresses are at example.com, which never receives mail. The file holds their passwords: keep it out of the repo.
// Then: TEST_RUNNER_COLLAB_LIVE=<out.json> xcodebuild test-without-building … -only-testing:PaneTests/CollabLiveTests
const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), anon = Deno.env.get("SUPABASE_ANON_KEY");
const out = Deno.args[0];
if (!url || !service || !anon || !out) throw new Error("Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY and an output path.");
if (url.includes("rodegaeruhyybqilrnpn")) throw new Error("That's production. Refusing.");

const run = crypto.randomUUID().slice(0, 8);
const users = [];
for (const name of ["emil", "sara", "eve"]) {
  const email = `collab-live-${run}-${name}@example.com`;
  const password = crypto.randomUUID() + crypto.randomUUID();
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { collab_live_test: true } }),
  });
  if (!res.ok) throw new Error(`Making ${name} failed: ${res.status} ${await res.text()}`);
  const { id } = await res.json();
  // Opted out of the onboarding emails at once (staging sends them two minutes after a sign-up, and
  // these addresses read nothing), as if the person had pressed Stop these emails.
  const stop = await fetch(`${url}/rest/v1/email_unsubscribes`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "content-type": "application/json", Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ user_id: id, source: "link" }),
  });
  if (!stop.ok) throw new Error(`Opting ${name} out of emails failed: ${stop.status} ${await stop.text()}`);
  // Each account's data key, as AccountCrypto would hold it: the identity key is sealed under it, so
  // runs after the first open the same identity.
  const dataKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  users.push({ email, password, data_key: dataKey });
}
await Deno.writeTextFile(out, JSON.stringify({ url, anon_key: anon, users }), { mode: 0o600 });
console.log(`Three accounts (collab-live-${run}-*) written to ${out}`);
