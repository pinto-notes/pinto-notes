// The fetcher for links from outside (public_fetch.ts): its address checks, and real requests to a
// local https server standing in for the internet (test_https.ts), so nothing leaves the machine:
//   cd supabase/functions/mcp && deno test -A public_fetch.test.ts
import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { FetchTimeout, isPublicAddress, NotPublic, publicFetch } from "./public_fetch.ts";
import { testWeb } from "./test_https.ts";

Deno.test("private, loopback, link-local, metadata, CGNAT, multicast and unique-local addresses aren't public", () => {
  for (const ip of [
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "100.127.255.254",
    "224.0.0.1", "239.255.255.250", "255.255.255.255", "::1", "::", "fe80::1", "fec0::1", "fc00::1", "fd12:3456::1", "fd00:ec2::254", "ff02::1", "::ffff:127.0.0.1",
    "::ffff:169.254.169.254", "::ffff:a9fe:a9fe", "::ffff:100.64.0.1", "64:ff9b::a00:1", "2001:db8::1", "2002:a00:1::1", "[::1]", "fe80::1%en0", "nonsense", "1.2.3",
  ]) assert(!isPublicAddress(ip), ip);
  for (const ip of ["8.8.8.8", "104.18.0.1", "172.32.0.1", "100.128.0.1", "2606:4700::1111", "::ffff:8.8.8.8", "[2606:4700::1111]"]) assert(isPublicAddress(ip), ip);
});

const redirect = (to: string, status = 302) => new Response(null, { status, headers: { location: to } });

Deno.test("a public link downloads the exact bytes, over TLS, from the address that was checked", async () => {
  const bytes = new Uint8Array(300_000).map((_, i) => (i * 7) % 256);
  const web = await testWeb({ "files.example.com": ["93.184.216.34", "2606:2800:220:1::1"] }, (req) => {
    const p = new URL(req.url).pathname;
    // Known length, and streamed (chunked), both read the same.
    if (p === "/fixed") return new Response(bytes, { headers: { "content-type": "application/wasm" } });
    if (p === "/streamed") return new Response(new Blob([bytes]).stream());
    return new Response("not here", { status: 404 });
  });
  try {
    for (const p of ["fixed", "streamed"]) {
      const res = await publicFetch(`https://files.example.com/${p}`);
      assertEquals(res.status, 200);
      assertEquals(new Uint8Array(await res.arrayBuffer()), bytes, p);
    }
    assertEquals((await publicFetch("https://files.example.com/fixed")).headers.get("content-type"), "application/wasm");
    const missing = await publicFetch("https://files.example.com/nothing");
    assertEquals([missing.status, await missing.text()], [404, "not here"]);
    assertEquals(new Set(web.dialled), new Set(["93.184.216.34"]), "dialled the checked address, not the name");
    // Nothing of the caller's goes along: no cookies, no credentials, nothing to unpack.
    for (const { headers } of web.asked) {
      assertEquals([headers.get("cookie"), headers.get("authorization"), headers.get("accept-encoding")], [null, null, "identity"]);
    }
  } finally { await web.close(); }
});

Deno.test("a public name that resolves to a private address is refused before any connection", async () => {
  for (const answers of [["10.0.0.5"], ["169.254.169.254"], ["93.184.216.34", "127.0.0.1"], ["fd00::1"], ["::ffff:10.0.0.1"], ["100.64.0.9"], ["224.0.0.1"], ["fd00:ec2::254"], []]) {
    const web = await testWeb({ "evil.example.com": answers }, () => new Response("secret"));
    try {
      await assertRejects(() => publicFetch("https://evil.example.com/x"), NotPublic, undefined, answers.join(","));
      assertEquals(web.dialled, [], answers.join(","));
    } finally { await web.close(); }
  }
});

Deno.test("no DNS rebinding: the connection goes to the address that was checked, once per hop", async () => {
  // A name that answers public the first time and private after: the fetcher asks once and dials that.
  let asks = 0;
  const web = await testWeb({}, () => new Response("public bytes"));
  const { useNetwork } = await import("./public_fetch.ts");
  const undo = useNetwork({ resolve: (_h, type) => Promise.resolve(type === "AAAA" ? [] : [asks++ === 0 ? "93.184.216.34" : "127.0.0.1"]) });
  try {
    assertEquals(await (await publicFetch("https://flip.example.com/a")).text(), "public bytes");
    assertEquals([asks, web.dialled], [1, ["93.184.216.34"]]);
  } finally { undo(); await web.close(); }
});

Deno.test("a redirect to a private place is refused, and every hop is checked", async () => {
  const web = await testWeb({ "files.example.com": ["93.184.216.34"], "inside.example.com": ["10.0.0.7"] }, (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/a") return redirect("https://inside.example.com/admin");
    if (p === "/b") return redirect("https://169.254.169.254/latest/meta-data/");
    if (p === "/c") return redirect("http://files.example.com/plain", 301);
    if (p === "/d") return redirect("/e", 307);
    if (p === "/e") return new Response("followed");
    return new Response("no", { status: 404 });
  });
  try {
    for (const p of ["a", "b", "c"]) await assertRejects(() => publicFetch(`https://files.example.com/${p}`), NotPublic, undefined, p);
    assertEquals(web.asked.map((x) => new URL(x.url).pathname), ["/a", "/b", "/c"], "the private hops were never asked");
    assertEquals(await (await publicFetch("https://files.example.com/d")).text(), "followed", "a public redirect is followed");
    assertEquals(new Set(web.dialled), new Set(["93.184.216.34"]));
  } finally { await web.close(); }
});

Deno.test("redirects are capped", async () => {
  const web = await testWeb({ "loop.example.com": ["93.184.216.34"] }, (req) => {
    const n = Number(new URL(req.url).pathname.slice(1));
    return n < 5 ? redirect(`/${n + 1}`) : new Response("too far");
  });
  try {
    await assertRejects(() => publicFetch("https://loop.example.com/1"), NotPublic, "redirects");
    assertEquals(web.asked.length, 4, "the first request and three redirects");
  } finally { await web.close(); }
});

Deno.test("only https on its usual port, with no user name, and no bare or local names", async () => {
  const web = await testWeb({ "files.example.com": ["93.184.216.34"], "localhost": ["93.184.216.34"], "intranet": ["93.184.216.34"] }, () => new Response("x"));
  try {
    for (const u of ["http://files.example.com/a", "https://files.example.com:8443/a", "https://user:pw@files.example.com/a", "https://localhost/a", "https://intranet/a",
      "https://127.0.0.1/a", "https://[::1]/a", "https://0x7f.1/a", "https://2130706433/a", "https://[fd00:ec2::254]/a", "ftp://files.example.com/a", "not a link"]) {
      await assertRejects(() => publicFetch(u), NotPublic, undefined, u);
    }
    assertEquals(web.dialled, []);
  } finally { await web.close(); }
});

Deno.test("a download that takes too long stops: before the answer, and in the middle of the body", async () => {
  let release = () => {};
  const held = new Promise<void>((r) => { release = r; });
  const web = await testWeb({ "slow.example.com": ["93.184.216.34"] }, async (req) => {
    if (new URL(req.url).pathname === "/head") { await held; return new Response("late"); }
    // Half the body, then nothing.
    return new Response(new ReadableStream({ async start(c) { c.enqueue(new Uint8Array(1000)); await held; c.close(); } }));
  });
  try {
    const t0 = performance.now();
    await assertRejects(() => publicFetch("https://slow.example.com/head", { timeoutMs: 300 }), FetchTimeout);
    const res = await publicFetch("https://slow.example.com/body", { timeoutMs: 300 });
    await assertRejects(() => res.arrayBuffer(), FetchTimeout);
    assert(performance.now() - t0 < 3000, `${performance.now() - t0} ms`);
  } finally { release(); await web.close(); }
});
