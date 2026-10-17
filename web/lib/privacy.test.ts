import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_ACCESS, CAVEAT, COUNTS, ENCRYPTION, FACTS, HOME_PRIVACY, LIMITS, LOGS, PRIVACY_PATH, READABLE, WHO_CAN_SEE } from "./privacy";
import { themeFor } from "./theme";

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
    expect(FACTS[0].text).toMatch(/only your devices, and AI connections you approve, can unlock/);
  });

  it("says the AI exception on the home page, next to \"We can't read your notes\"", () => {
    expect(HOME_PRIVACY.text).toMatch(/When an AI you approve asks for notes, our server reads them in memory/);
  });

  it("has no Coming note: end to end is what's built", () => {
    expect(all).not.toMatch(/Coming:|not end-to-end encrypted yet/);
    expect(FACTS[0].title).toBe("End-to-end encrypted");
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
    expect(policy).toContain(`up to ${limit} per note`);
    expect(policy).toContain(`every version from the last 24 hours, then the last one of each hour for 7 days, the last one of each day for 90 days, and every AI change for 90 days. Older versions are deleted. A note keeps at most ${limit} versions and 10 MB of them`);
    expect(policy).not.toMatch(/up to 100 per note/);
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
    expect(policy).toMatch(/where on a page people click and how far pages are scrolled with PostHog, in the EU\. These are counted across all visitors\. Neither keeps a profile of you, and neither runs on shared notes or the connect pages\. Vercel never uses cookies\. PostHog uses none either, unless you choose Accept on the website's cookie banner/);
    expect(page).toMatch(/where on a page people click and how far pages are scrolled with PostHog, in the EU\. These are counted across all\s+visitors\. Neither keeps a profile of you, and neither runs on shared notes or the connect pages\.\s+PostHog uses a cookie only if you choose Accept on the cookie banner/);
    // Heatmaps are named, and limited to the marketing pages, in the long form too.
    expect(policy).toMatch(/where on the page each click landed/);
    // Session replays (web/lib/posthog.ts replayAllowed): only after Accept, inputs masked, never on private pages,
    // kept 30 days; and said in the summary, the long form, the page, the retention list and the banner.
    expect(policy).toMatch(/records your visits to the website's public pages as session replays/);
    expect(policy).toMatch(/If you choose Accept, PostHog also records your visit as a session replay.*Everything typed into a field is masked.*Without Accept, no visit is recorded or replayed\./);
    expect(policy).toMatch(/\*\*Session replays,\*\* only if you accept: kept at PostHog for 30 days/);
    expect(page).toMatch(/records your visits to the public pages as session replays,\s+with everything you type masked/);
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

  it("is a cream page that ends in the dark band, like Help and the changelog (site audit, 13 October 2026)", () => {
    expect(themeFor(PRIVACY_PATH)).toBe("cream");
  });
});
