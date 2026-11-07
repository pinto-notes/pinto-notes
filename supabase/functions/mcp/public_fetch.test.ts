// The chat-file downloader's address checks (public_fetch.ts), with DNS and the network stubbed:
//   cd supabase/functions/mcp && deno test -A public_fetch.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { isPublicAddress, NotPublic, publicFetch } from "./public_fetch.ts";

Deno.test("private, loopback, link-local, metadata and unique-local addresses aren't public", () => {
  for (const ip of [
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1",
    "224.0.0.1", "255.255.255.255", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:127.0.0.1",
    "::ffff:169.254.169.254", "::ffff:a9fe:a9fe", "64:ff9b::a00:1", "2001:db8::1", "2002:a00:1::1", "[::1]", "fe80::1%en0", "nonsense", "1.2.3",
  ]) assert(!isPublicAddress(ip), ip);
  for (const ip of ["8.8.8.8", "104.18.0.1", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8", "[2606:4700::1111]"]) assert(isPublicAddress(ip), ip);
});

/** DNS answers by name, and a network that records what it was asked for. */
function world(dns: Record<string, string[]>, routes: Record<string, () => Response>) {
  const asked: string[] = [];
  const resolve = (host: string, type: "A" | "AAAA") => Promise.resolve((dns[host] ?? []).filter((ip) => (type === "A") === !ip.includes(":")));
  const fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    assertEquals(init?.redirect, "manual", "redirects are followed by hand");
    const url = String(input);
    asked.push(url);
    return Promise.resolve(routes[url]?.() ?? new Response("not found", { status: 404 }));
  }) as typeof globalThis.fetch;
  return { asked, o: { resolve, fetch } };
}
const redirect = (to: string) => () => new Response(null, { status: 302, headers: { location: to } });

Deno.test("a public link downloads", async () => {
  const w = world({ "files.example.com": ["93.184.216.34", "2606:2800:220:1::1"] }, { "https://files.example.com/a": () => new Response("bytes") });
  assertEquals(await (await publicFetch("https://files.example.com/a", w.o)).text(), "bytes");
});

Deno.test("a public name that resolves to a private address is refused before any request", async () => {
  for (const answers of [["10.0.0.5"], ["169.254.169.254"], ["93.184.216.34", "127.0.0.1"], ["fd00::1"], ["::ffff:10.0.0.1"], []]) {
    const w = world({ "evil.example.com": answers }, { "https://evil.example.com/x": () => new Response("secret") });
    await assertRejects(() => publicFetch("https://evil.example.com/x", w.o), NotPublic, undefined, answers.join(","));
    assertEquals(w.asked, []);
  }
});

Deno.test("a redirect to a private place is refused, and every hop is checked", async () => {
  const w = world({ "files.example.com": ["93.184.216.34"], "inside.example.com": ["10.0.0.7"] }, {
    "https://files.example.com/a": redirect("https://inside.example.com/admin"),
    "https://files.example.com/b": redirect("https://169.254.169.254/latest/meta-data/"),
    "https://files.example.com/c": redirect("http://files.example.com/plain"),
    "https://files.example.com/d": redirect("/e"),
    "https://files.example.com/e": () => new Response("followed"),
  });
  for (const p of ["a", "b", "c"]) await assertRejects(() => publicFetch(`https://files.example.com/${p}`, w.o), NotPublic, undefined, p);
  assert(!w.asked.some((u) => u.includes("inside") || u.includes("169.254") || u.startsWith("http:")), w.asked.join(" "));
  assertEquals(await (await publicFetch("https://files.example.com/d", w.o)).text(), "followed", "a public redirect is followed");
});

Deno.test("redirects are capped", async () => {
  const w = world({ "loop.example.com": ["93.184.216.34"] }, {
    "https://loop.example.com/1": redirect("/2"), "https://loop.example.com/2": redirect("/3"),
    "https://loop.example.com/3": redirect("/4"), "https://loop.example.com/4": redirect("/5"),
    "https://loop.example.com/5": () => new Response("too far"),
  });
  await assertRejects(() => publicFetch("https://loop.example.com/1", w.o), NotPublic);
  assertEquals(w.asked.length, 4, "the first request and three redirects");
});

Deno.test("only https on its usual port, with no user name, and no bare or local names", async () => {
  const w = world({ "files.example.com": ["93.184.216.34"], "localhost": ["93.184.216.34"], "intranet": ["93.184.216.34"] }, {});
  for (const u of ["http://files.example.com/a", "https://files.example.com:8443/a", "https://user:pw@files.example.com/a", "https://localhost/a", "https://intranet/a",
    "https://127.0.0.1/a", "https://[::1]/a", "https://0x7f.1/a", "https://2130706433/a", "ftp://files.example.com/a"]) {
    await assertRejects(() => publicFetch(u, w.o), NotPublic, undefined, u);
  }
  assertEquals(w.asked, []);
});
