// Reading an app's public pages for "make my own version" (own_version.ts): what a page says, which
// pages are worth reading, what's never read, and the App Store listing with its screenshots. The
// internet is a local https server (test_https.ts); nothing leaves the machine.
//   cd supabase/functions/mcp && deno test -A own_version.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes } from "jsr:@std/assert@1";
import { appStoreId, checkLink, LIMITS, pickPages, readPage, robotsAllow, siteOf, study, studyText, useLookup } from "./own_version.ts";
import { testWeb } from "./test_https.ts";

Deno.test("a page reads as its words: headings, lists, its description and structured data, with menus once and no scripts", () => {
  const html = `<!doctype html><html><head><title>Tally &amp; Co: habits</title>
    <meta name="description" content="Track up to 24 habits a day.">
    <meta property="og:description" content="Track up to 24 habits a day.">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Tally","offers":{"@type":"Offer","price":"5.99","priceCurrency":"USD"},"featureList":["Streaks","Timers"]}</script>
    <style>body{color:red}</style></head>
    <body><nav><a href="/features">Features</a><a href="/help/">Help</a></nav>
    <h1>Form good habits</h1><p>Tap a habit to complete it.&nbsp;Hold to undo.</p>
    <script>window.secret = "never shown"</script>
    <h2>What you get</h2><ul><li>Up to 24 tasks</li><li>Negative tasks, like <b>don&#8217;t smoke</b></li></ul>
    <img src="a.png" alt="A ring around each habit"><table><tr><td>Free</td><td>$5.99</td></tr></table>
    <footer><a href="/features">Features</a></footer></body></html>`;
  const p = readPage(html, "https://tally.example.com/");
  assertEquals(p.title, "Tally & Co: habits");
  assert(p.text.startsWith("Track up to 24 habits a day.\nPrice: 5.99 USD\nFeatures:\n- Streaks\n- Timers"), p.text);
  for (const s of ["## Form good habits", "Tap a habit to complete it. Hold to undo.", "### What you get", "- Up to 24 tasks", "- Negative tasks, like don’t smoke", "[picture: A ring around each habit]", "| Free | $5.99"]) assertStringIncludes(p.text, s);
  assert(!p.text.includes("never shown") && !p.text.includes("color:red"));
  assertEquals(p.text.split("\n").filter((l) => l === "Features").length, 1, "a menu repeated in the footer reads once");
  assertEquals(p.links.map((l) => l.href), ["https://tally.example.com/features", "https://tally.example.com/help/", "https://tally.example.com/features"]);
});

Deno.test("the pages worth reading: features, help and pricing on the app's own site, best first; never sign-in, account, legal or files", () => {
  const links = [
    "https://www.tally.example.com/features", "https://help.tally.example.com/", "https://tally.example.com/faq", "https://tally.example.com/pricing",
    "https://tally.example.com/login", "https://tally.example.com/account/settings", "https://tally.example.com/signup?plan=pro", "https://tally.example.com/privacy",
    "https://tally.example.com/help/manual.pdf", "https://other.example.org/features", "http://tally.example.com/tour", "https://tally.example.com/blog/2024/new-features-in-3-2",
    "https://tally.example.com/features#top", "https://tally.example.com/features?utm_source=nav", "https://tally.example.com/", "https://tally.example.com/careers",
  ].map((href) => ({ href, text: "" }));
  const picked = pickPages(links, "https://tally.example.com/");
  assertEquals(picked, ["https://www.tally.example.com/features", "https://tally.example.com/faq", "https://help.tally.example.com", "https://tally.example.com/pricing"]);
  assertEquals(pickPages(links, "https://tally.example.com/", 2).length, 2);
  // A link's words count as much as its address.
  assertEquals(pickPages([{ href: "https://tally.example.com/p/91", text: "How it works" }, { href: "https://tally.example.com/p/92", text: "Sign in" }], "https://tally.example.com/"), ["https://tally.example.com/p/91"]);
  assertEquals([siteOf("help.tally.example.com"), siteOf("www.example.co.uk"), siteOf("app.ynab.com")], ["example.com", "example.co.uk", "ynab.com"]);
});

Deno.test("robots.txt: what it keeps every robot out of isn't read; the longest rule wins", () => {
  const robots = "User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /help/\nAllow: /help/start\nDisallow: /search*\n# a comment\n";
  assertEquals(["/features", "/help/", "/help/billing", "/help/start", "/search?q=x"].map((p) => robotsAllow(robots, p)), [true, false, false, true, false]);
  assertEquals(robotsAllow("", "/anything"), true);
  assertEquals(robotsAllow("User-agent: *\nDisallow:\n", "/x"), true, "an empty Disallow allows everything");
});

Deno.test("a link: App Store listings are recognised with their country; anything but a public web link is refused", () => {
  assertEquals(appStoreId("https://apps.apple.com/gb/app/streaks/id963034692"), { id: "963034692", country: "gb" });
  assertEquals(appStoreId("https://apps.apple.com/app/id904280696?mt=8"), { id: "904280696", country: "us" });
  assertEquals(appStoreId("https://example.com/id12345"), null);
  assertEquals(checkLink("tally.example.com"), "https://tally.example.com/");
  assertEquals(checkLink(" http://tally.example.com/x "), "https://tally.example.com/x");
  for (const bad of ["ftp://tally.example.com", "https://me:pw@tally.example.com/", "not a link at all", ""]) {
    let threw = false;
    try { checkLink(bad); } catch { threw = true; }
    assert(threw, bad);
  }
});

const PAGE = (body: string, title = "Tally") => new Response(`<html><head><title>${title}</title></head><body>${body}</body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

/** The stand-in internet: the app's site, its help site, its App Store data and its screenshots. */
async function internet() {
  const listing = {
    resultCount: 1,
    results: [{
      trackName: "Tally: Habit Tracker", formattedPrice: "$5.99", genres: ["Health & Fitness", "Productivity"], averageUserRating: 4.81, userRatingCount: 12000,
      supportedDevices: ["iPhone15-iPhone15", "iPadPro11-iPadPro11", "Watch8-Watch8"],
      description: "Track up to 24 habits.\n• Timed habits\n• Negative habits\n• Health app sync",
      releaseNotes: "Habits can repeat every few days.",
      screenshotUrls: ["https://img.example.com/shots/1/392x696bb.png", "https://img.example.com/shots/2/392x696bb.png", "https://img.example.com/shots/3/392x696bb.png"],
      ipadScreenshotUrls: ["https://img.example.com/shots/ipad/576x768bb.png"],
      sellerUrl: "https://tally.example.com/",
    }],
  };
  const web = await testWeb({
    "tally.example.com": ["93.184.216.34"], "tallyhelp.example.com": ["93.184.216.35"], "lookup.example.com": ["93.184.216.36"], "img.example.com": ["93.184.216.37"], "js.example.com": ["93.184.216.38"],
  }, (req) => {
    const u = new URL(req.url);
    const host = req.headers.get("host")?.split(":")[0];
    if (host === "lookup.example.com") return Response.json(u.searchParams.get("id") === "963034692" ? listing : { resultCount: 0, results: [] });
    if (host === "img.example.com") return u.pathname.endsWith("/300x0w.jpg") ? new Response(PNG, { headers: { "content-type": "image/jpeg" } }) : new Response("no", { status: 404 });
    if (host === "js.example.com") return PAGE("<div id=root></div>");
    if (host === "tallyhelp.example.com") return PAGE("<h1>Help</h1><p>Archive a habit to hide it without losing its history.</p>", "Tally help");
    if (u.pathname === "/robots.txt") return new Response("User-agent: *\nDisallow: /faq\n");
    if (u.pathname === "/") {
      return PAGE(`<h1>Form good habits</h1><p>Every day you complete a task, your streak grows.</p>
        <a href="/features">Features</a> <a href="/faq">FAQ</a> <a href="https://tallyhelp.example.com/">Help</a> <a href="/login">Log in</a>
        <a href="/account">Your account</a> <a href="/privacy">Privacy</a> <a href="https://apps.apple.com/us/app/tally/id963034692">Download on the App Store</a>`);
    }
    if (u.pathname === "/features") return PAGE("<h1>Features</h1><ul><li>Timed habits with a countdown</li><li>Habits to break</li><li>Stats for every habit</li></ul>", "Tally features");
    return new Response("never asked for", { status: 500 });
  });
  const restore = useLookup("https://lookup.example.com/lookup");
  return { web, close: async () => { restore(); await web.close(); } };
}

Deno.test("from the app's website: its features and help pages and its App Store listing with screenshots; sign-in and robots-blocked pages unread", async () => {
  const net = await internet();
  try {
    const s = await study("tally.example.com");
    assertEquals(s.link, "https://tally.example.com/");
    assertEquals(s.sources.map((x) => [x.kind, x.url]), [
      ["link", "https://tally.example.com/"],
      ["app-store", "https://apps.apple.com/us/app/id963034692"],
      ["page", "https://tally.example.com/features"],
      ["page", "https://tallyhelp.example.com"],
    ]);
    const store = s.sources[1].text;
    for (const t of ["Name: Tally: Habit Tracker", "Price: $5.99", "Category: Health & Fitness, Productivity", "Rating: 4.8 from 12000 ratings", "Runs on: iPhone, iPad, Watch", "• Negative habits", "### What's new in the latest version", "repeat every few days"]) assertStringIncludes(store, t);
    assertStringIncludes(s.sources[2].text, "- Habits to break");
    assertEquals(s.missed, [{ url: "https://tally.example.com/faq", why: "its robots.txt asks robots not to read it" }]);
    // Small screenshots (Apple's image server sizes them by address), at most four, as pictures.
    assertEquals(s.screenshots.length, 4);
    assertEquals(s.screenshots[0], { url: "https://img.example.com/shots/1/392x696bb.png", data: "iVBORw0KGgoBAgME", mimeType: "image/jpeg" });
    const asked = net.web.asked.map((x) => new URL(x.url).pathname);
    for (const never of ["/login", "/account", "/privacy"]) assert(!asked.includes(never), `never asked for ${never}`);
    assert(!asked.includes("/faq"), "robots.txt is kept");
    for (const { headers } of net.web.asked) assertEquals([headers.get("cookie"), headers.get("authorization")], [null, null], "nothing of anyone's goes along");
    // What the AI reads: the method, then each page with where it came from.
    const text = studyText(s);
    assert(text.startsWith("## Making the person's own version of an app"));
    for (const t of ["### The page you were given: Tally", "### App Store listing: Tally: Habit Tracker", "### Page: Tally features", "### Couldn't be read", "Screenshots from the App Store listing (4, below)"]) assertStringIncludes(text, t);
  } finally { await net.close(); }
});

Deno.test("from an App Store link: the listing first, then the developer's site from it and that site's pages", async () => {
  const net = await internet();
  try {
    const s = await study("https://apps.apple.com/us/app/tally/id963034692");
    assertEquals(s.sources.map((x) => x.kind), ["app-store", "page", "page", "page"]);
    assertEquals(s.sources.map((x) => x.url).slice(1), ["https://tally.example.com/", "https://tally.example.com/features", "https://tallyhelp.example.com"]);
    assertEquals(s.screenshots.length, 4);
  } finally { await net.close(); }
});

Deno.test("nothing readable: a page that is only JavaScript, an unknown listing or a private address makes nothing and says what to give", async () => {
  const net = await internet();
  try {
    await assertRejects(() => study("https://js.example.com/"), Error, "Nothing could be read from js.example.com");
    await assertRejects(() => study("https://js.example.com/"), Error, "it shows nothing without JavaScript");
    await assertRejects(() => study("https://apps.apple.com/us/app/x/id111111"), Error, "the App Store has no app with that id");
    await assertRejects(() => study("https://127.0.0.1/"), Error, "not a public address");
  } finally { await net.close(); }
});

Deno.test("long pages are cut so all of it fits one answer", async () => {
  const long = Array.from({ length: 4000 }, (_, i) => `<p>Feature number ${i} does something useful.</p>`).join("");
  const web = await testWeb({ "big.example.com": ["93.184.216.40"] }, (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/") return PAGE(`${long}<a href="/features">Features</a><a href="/guide">Guide</a><a href="/help">Help</a><a href="/pricing">Pricing</a><a href="/tour">Tour</a>`);
    if (p === "/robots.txt") return new Response("", { status: 404 });
    return PAGE(long, p);
  });
  try {
    const s = await study("https://big.example.com/");
    assertEquals(s.sources.length, 1 + LIMITS.extraPages);
    for (const x of s.sources) assert(x.text.length <= LIMITS.pageChars + 40, `${x.url}: ${x.text.length}`);
    const total = s.sources.reduce((n, x) => n + x.text.length, 0);
    assert(total <= LIMITS.totalChars + 200, `${total}`);
    assertStringIncludes(s.sources[0].text, "(cut here: the page goes on)");
    assertStringIncludes(s.sources.at(-1)!.text, "left out");
  } finally { await web.close(); }
});
