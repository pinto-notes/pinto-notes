// A database failure while looking up a token isn't a revoked token: the AI is told to try again
// (503 with Retry-After), not to connect again (401 invalid_token).
//   cd supabase/functions/mcp && deno test -A token_lookup.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { Sql } from "npm:postgres@3.4.5";

Deno.env.set("SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
const { handleRequest } = await import("./server.ts");

const F = "https://abcdefghijklmnopqrst.supabase.co/functions/v1/mcp";
const call = (auth: string) => new Request(F, {
  method: "POST",
  headers: { authorization: auth, "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
});
const failing = (() => Promise.reject(Object.assign(new Error("connect ETIMEDOUT"), { code: "ETIMEDOUT" }))) as unknown as Sql;
const empty = (() => Promise.resolve([])) as unknown as Sql;

for (const auth of ["Bearer pane_" + "a".repeat(64), "Bearer amb_at_" + "b".repeat(64)]) {
  const kind = auth.includes("pane_") ? "pane_ token" : "OAuth token";

  Deno.test(`${kind}: a failed lookup is a 503 to retry, not a 401 to reconnect`, async () => {
    const quiet = console.log;
    console.log = () => {};
    let res: Response;
    try { res = await handleRequest(call(auth), failing); } finally { console.log = quiet; }
    assertEquals(res.status, 503);
    assert(Number(res.headers.get("retry-after")) > 0);
    assertEquals(res.headers.get("www-authenticate"), null);
    const body = await res.json();
    assertStringIncludes(body.error.message, "Try again");
  });

  Deno.test(`${kind}: an unknown, expired or revoked token is still a 401 invalid_token`, async () => {
    const res = await handleRequest(call(auth), empty);
    assertEquals(res.status, 401);
    assertStringIncludes(res.headers.get("www-authenticate")!, `error="invalid_token"`);
    await res.body?.cancel();
  });
}
