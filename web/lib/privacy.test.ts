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
  ...FACTS.flatMap((f) => [f.title, f.text]), CAVEAT.text, CAVEAT.link, ...LOGS.flatMap((l) => [l.name, l.what, l.kept]), ...COUNTS, ...READABLE,
  ...items.flatMap((i) => [i.label, i.text]), ENCRYPTION.note, page, policy,
  ...Object.values(HOME_PRIVACY),
];
const all = copy.join("\n");

const DEFAULT = "Your notes are encrypted on your devices before they sync. We keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account.";
const STRICT = "With Advanced protection on, your notes are end-to-end encrypted: we can't open them and can't help you back in.";

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
    // The honest parts of the model, on the page and in the policy.
    for (const text of [READABLE.join(" "), policy]) {
      for (const phrase of ["email", "sign-in records", "profile name and photo", "notes-password hint", "size and dates", "sub-notes", "pinned", "locked", "ai apps", "devices", "ai connections", "usage counts", "share"]) {
        expect(text.toLowerCase(), phrase).toContain(phrase);
      }
    }
    const limits = [...AI_ACCESS, ...LIMITS].map((i) => i.label + " " + i.text).join(" ");
    for (const text of [limits, policy]) {
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
    expect(FACTS[0].text).toBe(`${DEFAULT} ${STRICT}`);
    expect(HELP.find((q) => q.id === "storage")!.a.join(" ")).toContain(`${DEFAULT} ${STRICT}`);
    for (const text of [ENCRYPTION.items.map((i) => i.text).join(" "), policy]) {
      expect(text).toContain("We keep a locked copy of your key so that signing in opens your notes on a new device");
      expect(text).toContain("we could open your notes if we had to, for example under a court order, and so could someone who gets into your account");
      expect(text).toContain(STRICT);
      expect(text).toContain("We hold both the secret and the database");
      expect(text).toMatch(/a saved recovery key or another device/);
      expect(text).toMatch(/If you lose every device and the recovery key, your notes are lost/);
      expect(text).toMatch(/"Signing in now opens your notes"/);
      expect(text).toMatch(/Until you answer, nothing is copied/);
    }
    for (const text of [HOME_PRIVACY.text, SITE_FACTS.join(" ")]) {
      expect(text).toMatch(/keeps? a locked copy of your key/);
      expect(text).toMatch(/could open (them|your notes) if (we|it) had to/);
      expect(text).toMatch(/Advanced protection/);
    }
    expect(LIMITS.map((i) => i.text).join(" ")).toMatch(/The sealed copy can't be opened with a copy of the database alone\. A recent copy of the database also holds sign-in sessions/);
    expect(WHO_CAN_SEE.map((i) => i.label + " " + i.text).join(" ")).toMatch(/Anyone who can sign in as you, unless Advanced protection is on/);
  });

  it("states in the policy what is stored for the copy, why, who can reach it and how to turn it off", () => {
    for (const phrase of [
      "a copy of your notes' key and your recovery key, sealed with a secret that is kept outside our database",
      "Whether your account is standard or has Advanced protection on.",
      "A log of each time our copy was stored, fetched by a device or removed, and each time a request for it was refused: when, and the kind of device. We keep it for 12 months.",
      "We store the copy for one purpose: so that signing in opens your notes on a new device, with no other device and no recovery key.",
      "The secret is a setting that every part of our server can read, so a fault in any part of our server could expose the copies.",
      "The sealed copy can't be opened with a copy or a backup of the database alone, because the secret isn't in it.",
      "a session from a sign-in in the last hour can get your key as a device of yours would.",
      "Turning it on deletes our copy at once.",
      "The app asks such an account once",
      "every device of yours shows the notice \"A new device opened your notes\", and we send an email to your account's address",
      "The notice and the email tell you it happened. They don't stop it.",
      "our own copy until you turn on Advanced protection, start fresh or delete your account",
      "| Performance of a contract. Advanced protection turns it off |",
    ]) expect(policy, phrase).toContain(phrase);
    expect(LOGS.find((l) => /copy of your key/.test(l.name))!.kept).toBe("12 months");
  });

  it("has no wait for the key after a password reset, only for turning Advanced protection on", () => {
    expect(policy).toContain("There is no waiting period, and that includes after a password reset.");
    expect(ENCRYPTION.note).toMatch(/there is no waiting period, also after a password reset/);
    const waits = sentences([...siteText, policy]).filter((t) => /72 hours/.test(t));
    expect(waits).toEqual(["To turn it on you need a saved recovery key or another device that has your notes, and for 72 hours after a password reset it can't be turned on."]);
    for (const [name, source] of posts) expect(source, name).not.toMatch(/72 hours/);
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
    expect(claims.length).toBeGreaterThan(8);
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

  it("lists the same log retention as the privacy policy", () => {
    for (const l of LOGS) expect(policy.toLowerCase()).toContain(l.kept);
    expect(policy).toContain("no backups");
    expect(policy).toContain("Export Your Notes");
    expect(page).toContain("Export Your Notes");
  });

  it("says what the website counts, and never that it counts nothing", () => {
    for (const text of [policy, page, FACTS.map((f) => f.text).join(" ")]) {
      expect(text).toMatch(/counts page views and where visitors came from/);
      expect(text).toMatch(/Mac downloads as daily totals/);
      expect(text).not.toMatch(/(on|or) (the|this) website, and we never/);
      expect(text).not.toMatch(/(apps and this website|website) (have|has|uses) no (analytics|tracking)/);
    }
    expect(policy).toMatch(/where on a page people click and how far pages are scrolled with PostHog, in the EU\. These are counted across all visitors; no visit is recorded\. Neither keeps a profile of you, and neither runs on shared notes or the connect pages\. Vercel never uses cookies\. PostHog uses none either, unless you choose Accept on the website's cookie banner/);
    expect(page).toMatch(/where on a page people click and how far pages are scrolled with PostHog, in the EU\. These are counted across all\s+visitors; no visit is recorded\. Neither keeps a profile of you, and neither runs on shared notes or the connect pages\.\s+PostHog uses a cookie only if you choose Accept on the cookie banner/);
    // Heatmaps are named, and limited to the marketing pages, in the long form too.
    expect(policy).toMatch(/where on the page each click landed.*no visit is recorded or replayed/);
    expect(policy).toMatch(/\| PostHog, Inc\. \| Website usage: /);
    expect(policy).toContain("None of this touches your notes or your computer");
  });

  // docs/Technical/app-telemetry.md: versions after 1.2 report errors and a few usage counts.
  it("says what the apps report about themselves, where it goes and how to turn it off", () => {
    for (const text of [policy, page, FACTS.map((f) => f.text).join(" ")]) {
      expect(text).not.toMatch(/no third-party analytics/i);
      expect(text).not.toMatch(/no crash-reporting tools/i);
      expect(text).toMatch(/[Vv]ersions (of the (iPhone and Mac )?apps )?after 1\.2/);
      expect(text).toMatch(/PostHog in the EU|PostHog, hosted in Frankfurt/);
      expect(text).toMatch(/never your notes/);
    }
    expect(policy).toContain("**Diagnostics and usage from the apps**");
    expect(policy).toContain("Version 1.2 and earlier send none of this.");
    expect(policy).toContain("**Settings → General → Share diagnostics and usage** turns all of it off");
    expect(policy).toContain("| Diagnostics and usage from the apps | To find and fix errors, and to learn where people get stuck | Legitimate interests.");
    // Delete Account doesn't reach PostHog, and the policy says so.
    expect(policy).toMatch(/it doesn't remove the ones PostHog already holds/);
    expect(page).toContain("Share diagnostics and usage");
  });

  it("says the website asks before its one cookie, and names everything it stores", () => {
    expect(policy).not.toMatch(/website sets no cookies/i);
    expect(policy).toContain("The website asks before it sets a cookie.");
    expect(policy).toContain("`amber_consent`");
    expect(policy).toContain("`ph_<project key>_posthog`, only if you accept");
    expect(policy).toMatch(/expires a year after your last visit/);
    expect(policy).toMatch(/Do Not Track or Global Privacy Control, we treat it as Reject/);
    expect(policy).toMatch(/\| Consent, which you can withdraw at any time with Cookie settings \|/);
  });

  it("is a dark leaf page like the other fine print (Terms, Privacy & Security, Help)", () => {
    expect(themeFor(PRIVACY_PATH)).toBe("leaf");
  });
});
