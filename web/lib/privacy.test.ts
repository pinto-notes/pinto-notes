import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_ACCESS, CAVEAT, COUNTS, ENCRYPTION, FACTS, HOME_PRIVACY, LIMITS, LOGS, PRIVACY_PATH, READABLE, WHO_CAN_SEE } from "./privacy";
import { FACTS as SITE_FACTS } from "./facts";
import { themeFor } from "./theme";
import { FAQ as HELP } from "../app/help/questions";

const page = readFileSync(join(__dirname, "../app/privacy-security/page.tsx"), "utf8");
const policy = readFileSync(join(__dirname, "../content/privacy-policy.md"), "utf8");
const docsPolicy = readFileSync(join(__dirname, "../../docs/privacy-policy.md"), "utf8");
const items = [...ENCRYPTION.items, ...WHO_CAN_SEE, ...AI_ACCESS, ...LIMITS];
const copy = [
  ...FACTS.flatMap((f) => [f.title, f.text, f.short]), CAVEAT.text, CAVEAT.link, ...LOGS.flatMap((l) => [l.name, l.what, l.kept]), ...COUNTS, ...READABLE,
  ...items.flatMap((i) => [i.label, i.text]), ENCRYPTION.note, page, policy,
  ...Object.values(HOME_PRIVACY),
];
const all = copy.join("\n");

const DEFAULT = "Your notes are encrypted on your devices before they sync. We keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account.";
// Advanced protection is retired (1 November 2026): only accounts that already had it on keep it.
const STRICT = "your notes are end-to-end encrypted: we can't open them and can't help you back in.";
const RETIRED = /retiring Advanced protection|retiring it/;

/// Source text as a reader gets it: entities decoded, JSX line breaks joined.
const plain = (t: string) => t.replace(/&apos;|&rsquo;/g, "'").replace(/&ldquo;|&rdquo;|&quot;/g, "\"").replace(/[ \t]*\n[ \t]*(?=\S)/g, (m) => (m.includes("\n\n") ? "\n" : " "));
/// Every sentence of the texts. A blank line, a list item or a table cell ends one too.
const sentences = (texts: string[]) => texts.flatMap((t) => t.split(/\n\s*\n|\n- |\|/)).flatMap((t) => plain(t).split(/(?<=[.!?])\s+/)).map((t) => t.replace(/^[-*\s]+|\*\*/g, "").trim()).filter(Boolean);

const blog = join(__dirname, "../app/blog");
const posts: [string, string][] = readdirSync(blog, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(blog, d.name, "page.tsx")))
  .map((d) => [d.name, plain(readFileSync(join(blog, d.name, "page.tsx"), "utf8"))]);
/// Everything the site says about encryption outside the blog: the facts, the page, the home card,
/// the facts AI crawlers read and the help answers.
const siteText = [
  ...FACTS.map((f) => f.title + ". " + f.text), CAVEAT.text, ...items.map((i) => i.label + " " + i.text), ENCRYPTION.note,
  HOME_PRIVACY.title + " " + HOME_PRIVACY.text, page, ...SITE_FACTS, ...HELP.flatMap((q) => q.a),
];

describe("privacy copy", () => {
  it("has no em dashes and never mentions iPad", () => {
    for (const t of [...copy, docsPolicy]) {
      expect(t).not.toMatch(/—/);
      expect(t).not.toMatch(/iPad/);
    }
  });

  it("never claims more than is true today", () => {
    const lower = all.toLowerCase();
    expect(lower).not.toMatch(/only you can read/);
    expect(lower).not.toMatch(/nobody (else|but you) can read (it|your notes)/);
    expect(lower).not.toMatch(/no logs\b/);
    expect(lower).not.toMatch(/zeroed/);
    // The honest parts of the model: every detail on the Privacy & Security page, the kinds in the
    // policy (Emil, 17 November 2026: the policy names kinds of data, not every detail).
    for (const phrase of ["email", "sign-in records", "profile name and photo", "notes-password hint", "size and dates", "sub-notes", "pinned", "locked", "ai apps", "devices", "ai connections", "usage counts", "share"]) {
      expect(READABLE.join(" ").toLowerCase(), phrase).toContain(phrase);
    }
    for (const phrase of ["email", "sign-in records", "name and photo", "notes-password hint", "sizes and dates", "sub-notes", "pinned", "locked", "which device or ai", "devices signed in", "ai assistants you connect", "usage", "shared"]) {
      expect(policy.toLowerCase(), phrase).toContain(phrase);
    }
    expect(policy).toMatch(/our server decrypts the notes it asks for in memory/);
    const limits = [...AI_ACCESS, ...LIMITS].map((i) => i.label + " " + i.text).join(" ");
    for (const text of [limits]) {
      expect(text).toMatch(/unlocks your whole notes' key in memory/);
      expect(text).toMatch(/Vercel and Supabase/);
      expect(text).toMatch(/No key rotation yet/);
      expect(text).toMatch(/runs our code in your browser/);
      expect(text).toMatch(/a changed page could read/);
      expect(text).toMatch(/roll a note back/);
      expect(text).toMatch(/hide notes/);
    }
    expect(ENCRYPTION.items.map((i) => i.text).join(" ")).toMatch(/iCloud Keychain/);
  });

  it("never says only your devices can open your notes: approved AI connections can too", () => {
    const facts = [...FACTS.map((f) => f.text), ...ENCRYPTION.items.map((i) => i.text), page].join(" ").toLowerCase();
    expect(facts).not.toMatch(/only your devices (hold|have|can)/);
    expect(ENCRYPTION.items[2].text).toMatch(/only your devices, and AI connections you approve, can unlock/);
  });

  it("says the AI exception on the home page", () => {
    expect(HOME_PRIVACY.text).toMatch(/When an AI you approve asks for notes, our server reads them in memory/);
  });

  // A standard account: the server keeps a sealed copy of the key, so signing in opens the notes.
  // Advanced protection: no copy, and only then are the notes end-to-end encrypted.
  it("says what the default is and what Advanced protection changes, in the same words everywhere", () => {
    expect(FACTS[0].text).toBe(DEFAULT);
    expect(HELP.find((q) => q.id === "storage")!.a.join(" ")).toContain(DEFAULT);
    expect(HELP.map((q) => q.a.join(" ")).join(" ")).toMatch(RETIRED);
    expect(policy).toContain("We keep a locked copy of your notes' key, so that signing in opens your notes on a new device");
    expect(policy).toContain("we could open your notes if we had to, for example under a court order");
    expect(policy).toContain("and so could someone who gets into your account or our hosting account");
    expect(policy).toMatch(RETIRED);
    expect(policy).toMatch(/With Advanced protection on, your notes are end-to-end encrypted: we hold no copy of your key/);
    for (const text of [ENCRYPTION.items.map((i) => i.text).join(" ")]) {
      expect(text).toContain("We keep a locked copy of your key so that signing in opens your notes on a new device");
      expect(text).toContain("we could open your notes if we had to, for example under a court order, and so could someone who gets into your account");
      expect(text).toContain(STRICT);
      expect(text).toMatch(RETIRED);
      expect(text).toContain("We hold both the secret and the database");
      expect(text).toMatch(/If you lose every device and the recovery key, your notes are lost/);
      expect(text).toMatch(/"Signing in now opens your notes"/);
      expect(text).toMatch(/Until you answer, nothing is copied/);
    }
    for (const text of [HOME_PRIVACY.text, SITE_FACTS.join(" ")]) {
      expect(text).toMatch(/keeps? a locked copy of your key/);
      expect(text).toMatch(/could open (them|your notes) if (we|it) had to/);
      expect(text).not.toMatch(/Turn on Advanced protection/);
    }
    expect(LIMITS.map((i) => i.text).join(" ")).toMatch(/The sealed copy can't be opened with a copy of the database alone\. A recent copy of the database also holds sign-in sessions/);
    expect(WHO_CAN_SEE.map((i) => i.label + " " + i.text).join(" ")).toMatch(/Anyone who can sign in as you, unless Advanced protection is on/);
  });

  it("states in the policy what is stored for the copy, why, who can reach it and how to turn it off", () => {
    for (const phrase of [
      "our own copy (see Encryption)",
      "sealed with a secret kept outside our database. We use it for one thing: so that signing in opens your notes on a new device.",
      "Each time a new device gets your key, your devices show a notice and we email you.",
      "the record of when our copy of your key was used for 12 months",
    ]) expect(policy, phrase).toContain(phrase);
    expect(LOGS.find((l) => /copy of your key/.test(l.name))!.kept).toBe("12 months");
  });

  it("has no wait for the key after a password reset, only for turning Advanced protection on", () => {
    expect(ENCRYPTION.note).toMatch(/there is no waiting period, also after a password reset/);
    const waits = sentences([...siteText, policy]).filter((t) => /72 hours/.test(t));
    for (const t of waits) expect(t, t).toMatch(/can't be turned on/);
    // Only about the key: a post may say "72 hours" about something else (news reports merged within 72 hours).
    for (const [name, source] of posts) expect(source, name).not.toMatch(/(reset|key|protection)[^.]{0,200}72 hours|72 hours[^.]{0,200}(reset|key|protection)/i);
  });

  it("calls the switch Advanced protection, never by an older name", () => {
    for (const [name, source] of [...posts, ["site", siteText.join("\n")], ["policy", policy]] as [string, string][]) {
      expect(source, name).not.toMatch(/keep (my|your) key only on (my|your) devices/i);
    }
    expect(ENCRYPTION.items[2].label).toBe("Advanced protection:");
  });

  it("says end-to-end, or that we can't read or open notes, only in a sentence about Advanced protection", () => {
    expect(HOME_PRIVACY.title).not.toMatch(/can't read/i);
    expect(FACTS.map((f) => f.title).join(" ")).not.toMatch(/end-to-end/i);
    const claim = /end[- ]to[- ]end|\b(we|it|Pinto Notes) can't (read|open|see)\b|can't (read|open) (your notes|them)\b/i;
    // True in both kinds of account: someone holding only a copy of the database, and what an AI
    // can do with a locked note.
    const either = /only an old copy of the database|^It can't read, search or change them\.$/;
    const claims = sentences([...siteText, policy]).filter((t) => claim.test(t));
    expect(claims.length).toBeGreaterThan(3);
    for (const t of claims) if (!either.test(t)) expect(t, t).toMatch(/Advanced protection/);
    // The blog posts: the same, for what they say about Pinto Notes.
    const ours = /\b(we|Pinto Notes) can't (read|open)|(your|Your) notes are (then )?end-to-end encrypted|Pinto Notes end-to-end encrypted/;
    for (const [name, source] of posts) {
      for (const t of sentences([source]).filter((t) => ours.test(t))) expect(t, name).toMatch(/Advanced protection/);
    }
  });

  it("has no Coming note", () => {
    expect(all).not.toMatch(/Coming:|not end-to-end encrypted yet/);
    expect(FACTS[0].title).toBe("Encrypted on your devices");
  });

  it("keeps the two policy files the same", () => {
    expect(policy).toBe(docsPolicy);
  });

  it("states the server's version limit and thinning, not an old one", () => {
    // The newest migration that sets pane_limit('revisions') and the newest that defines the thinning.
    const dir = join(__dirname, "../../supabase/migrations");
    const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(dir, f), "utf8"));
    const limit = sql.flatMap((s) => [...s.matchAll(/when 'revisions'\s+then (\d+)/g)].map((m) => m[1])).at(-1);
    const thin = sql.filter((s) => s.includes("function public.pane_thin_revisions")).at(-1)!;
    for (const kept of ["interval '24 hours'", "interval '7 days' and in_hour = 1", "interval '90 days' and (in_day = 1 or ai)"]) expect(thin).toContain(kept);
    expect(limit).toBe("500");
    // The policy gives the longest any version is kept, which the thinning above sets.
    expect(policy).toContain("**Earlier versions of a note:** up to 90 days.");
    expect(policy).not.toMatch(/up to 100 per note/);
  });

  it("lists the same log retention as the privacy policy", () => {
    // The page lists each log; the policy gives the longest of the providers' (a day) and our own.
    const days = (k: string) => (/hour/.test(k) ? 0 : 1);
    expect(LOGS.filter((l) => !/copy of your key/.test(l.name)).every((l) => days(l.kept) <= 1 || /month|days/.test(l.kept))).toBe(true);
    expect(policy).toContain("request logs at our hosting providers for a day or less");
    expect(policy).toContain("Export Your Notes");
    expect(page).toContain("Export Your Notes");
  });

  it("says what the website counts, and never that it counts nothing", () => {
    expect(policy).toMatch(/Pages viewed, links clicked and where, how far pages are scrolled, the site or ad you came from/);
    expect(policy).toMatch(/Mac downloads as daily totals/);
    expect(policy).not.toMatch(/(apps and this website|website) (have|has|uses) no (analytics|tracking)/);
    for (const text of [page, FACTS.map((f) => f.text).join(" ")]) {
      expect(text).toMatch(/counts page views and where visitors came from/);
      expect(text).toMatch(/Mac downloads as daily totals/);
      expect(text).not.toMatch(/(on|or) (the|this) website, and we never/);
      expect(text).not.toMatch(/(apps and this website|website) (have|has|uses) no (analytics|tracking)/);
    }
    expect(page).toMatch(/where on a page people click and how far pages are scrolled with PostHog, in the EU\. These are counted across all\s+visitors\. Neither keeps a profile of you, and neither runs on shared notes or the connect pages\.\s+PostHog uses a cookie only if you choose Accept on the cookie banner/);
    // Session replays (web/lib/posthog.ts replayAllowed): only after Accept, inputs masked, never on private pages,
    // kept 30 days; and said in the summary, the long form, the page, the retention list and the banner.
    expect(policy).toMatch(/\*\*If you accept,\*\* PostHog keeps a random identifier in a cookie for up to a year, so return visits count as one visitor, and records session replays of the public pages\. Anything typed into a field is masked before it's sent\./);
    expect(policy).toMatch(/\*\*If you don't accept,\*\* nothing is stored in your browser for analytics\./);
    expect(policy).toContain("session replays for 30 days");
    expect(policy).toContain("Analytics never run on shared notes, the connect pages or report pages.");
    expect(page).toMatch(/records your visits to the public pages as session replays,\s+with everything you type masked/);
    expect(policy).toContain("**PostHog:** usage and diagnostics, and website analytics, in Frankfurt, Germany.");
  });

  // docs/Technical/app-telemetry.md: the App Store 1.2 and Mac download 1.2.3 and later report errors and a few usage counts.
  it("says what the apps report about themselves, where it goes and how to turn it off", () => {
    expect(policy).not.toMatch(/no third-party analytics/i);
    expect(policy).toMatch(/Never your notes or what you write/);
    expect(policy).toMatch(/They never contain your notes, titles, folder or file names, what you search for, anything an AI wrote, your email address or your keys\./);
    for (const text of [page, FACTS.map((f) => f.text).join(" ")]) {
      expect(text).not.toMatch(/no third-party analytics/i);
      expect(text).not.toMatch(/no crash-reporting tools/i);
      expect(text).toMatch(/App Store version 1\.2 and the Mac download 1\.2\.3/);
      expect(text).not.toMatch(/[Vv]ersions (of the (iPhone and Mac )?apps )?after 1\.2[^.]/);
      expect(text).toMatch(/PostHog in the EU|PostHog, hosted in Frankfurt/);
      expect(text).toMatch(/never your notes/);
    }
    expect(policy).toContain("**Usage and diagnostics.**");
    expect(policy).toContain("The app's reports can be turned off in **Settings → General → Share diagnostics and usage**.");
    expect(policy).toContain("| Find and fix problems, and learn how Pinto Notes is used so we can improve it | Legitimate interests. You can object, or turn the app's reports off |");
    // Delete Account doesn't reach PostHog, and the policy says so.
    expect(policy).toMatch(/To have the reports PostHog already holds deleted too, write to us\./);
    expect(page).toContain("Share diagnostics and usage");
  });

  it("says the website asks before its one cookie, and names everything it stores", () => {
    expect(policy).not.toMatch(/website sets no cookies/i);
    expect(policy).toContain("The website asks before it sets a cookie.");
    expect(policy).toContain("**Your choice** on the cookie banner is kept in your browser");
    expect(policy).toMatch(/in a cookie for up to a year/);
    expect(policy).toMatch(/Do Not Track or Global Privacy Control, we treat it as Reject/);
    expect(policy).toMatch(/\| Consent, which you can withdraw at any time \|/);
  });

  it("is a cream page that ends in the dark band, like Help and the changelog (site audit, 13 October 2026)", () => {
    expect(themeFor(PRIVACY_PATH)).toBe("cream");
  });
});
