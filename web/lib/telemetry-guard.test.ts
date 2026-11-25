// Nothing on the website reaches PostHog, Vercel Analytics or a count except through the gate
// (lib/telemetry-gate.ts, docs/Technical/telemetry-inventory.md). Run by scripts/prepush.sh --tests.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { POSTHOG_DEFAULT_HOST, posthogOptions } from "./posthog";
import { OPT_OUT_COOKIE, requestTelemetryAllowed, telemetryAllowed } from "./telemetry-gate";

const web = join(__dirname, "..");

function sources(dir = web): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  for (const e of readdirSync(dir)) {
    if (["node_modules", ".next", "public", "content", ".vercel"].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { out.push(...sources(p)); continue; }
    if (!/\.(ts|tsx|js|mjs)$/.test(e) || /\.test\.|\.d\.ts$/.test(e)) continue;
    out.push({ name: relative(web, p), text: readFileSync(p, "utf8") });
  }
  return out;
}

const files = sources();
const where = (re: RegExp) => files.filter((f) => re.test(f.text)).map((f) => f.name).sort();

describe("the website's telemetry gate", () => {
  it("only app/posthog-client.ts loads PostHog or calls its capture", () => {
    // Types only, anywhere else: a value import would let a file reach PostHog itself.
    expect(where(/import\s+(?!type\b)[^;]*from\s+["']posthog-js/)).toEqual([]);
    expect(where(/import\(\s*["']posthog-js/)).toEqual(["app/posthog-client.ts"]);
    expect(where(/\.capture\(/)).toEqual(["app/posthog-client.ts"]);
    expect(where(/\.init\(\s*key/)).toEqual(["app/posthog-client.ts"]);
    const client = files.find((f) => f.name === "app/posthog-client.ts")!.text;
    expect(client).toContain("posthogOptions(host, browserTelemetryAllowed)");
    expect(client).toMatch(/if \(!posthog \|\| !browserTelemetryAllowed\(\)\) return;\s*posthog\.capture/);
    expect(client).not.toContain("cookies_rejected");
  });

  it("PostHog's address is only in its settings and the content security policy", () => {
    expect(where(/posthog\.com/).filter((n) => n !== "next.config.ts")).toEqual(["lib/posthog.ts"]);
  });

  it("Vercel Web Analytics sends through the gate only", () => {
    expect(where(/@vercel\/analytics/)).toEqual(["app/SiteAnalytics.tsx"]);
    expect(files.find((f) => f.name === "app/SiteAnalytics.tsx")!.text).toContain("<Analytics beforeSend={vercelEvent} />");
  });

  it("the download and email click counts ask the gate", () => {
    expect(where(/count_download/)).toEqual(["lib/downloads.ts"]);
    expect(files.find((f) => f.name === "lib/downloads.ts")!.text).toMatch(/if \(!requestTelemetryAllowed\(headers\)\) return false;/);
    expect(where(/lifecycle\/click/)).toEqual(["app/go/route.ts"]);
    expect(files.find((f) => f.name === "app/go/route.ts")!.text).toContain("requestTelemetryAllowed(req.headers)");
  });

  it("no other analytics, tracking or error reporting library", () => {
    const pkg = JSON.parse(readFileSync(join(web, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const known = ["posthog-js", "@vercel/analytics"];
    const tracking = deps.filter((d) => /analytics|posthog|sentry|mixpanel|amplitude|segment|hotjar|plausible|gtag|google-tag|datadog|bugsnag|logrocket|fullstory|speed-insights|clarity/i.test(d));
    expect(tracking.filter((d) => !known.includes(d))).toEqual([]);
    expect(where(/googletagmanager|google-analytics|plausible\.io|clarity\.ms|hotjar/i)).toEqual([]);
  });

  it("off, PostHog sends nothing at all, its own events included", () => {
    const off = posthogOptions(POSTHOG_DEFAULT_HOST, () => false);
    for (const event of ["$pageview", "$autocapture", "$pageleave", "$$heatmap", "$snapshot", "scroll_depth", "cookies_accepted"]) {
      expect(off.before_send && !Array.isArray(off.before_send) && off.before_send({ event, properties: {} } as never)).toBeNull();
    }
    const on = posthogOptions(POSTHOG_DEFAULT_HOST, () => true);
    expect(on.before_send && !Array.isArray(on.before_send) && on.before_send({ event: "$pageview", properties: { $current_url: "https://pintonotes.com/" } } as never)).not.toBeNull();
  });

  it("Reject, Do Not Track and Global Privacy Control each turn it off; no answer leaves it on", () => {
    expect(telemetryAllowed({ consent: null, optedOut: false })).toBe(true);
    expect(telemetryAllowed({ consent: "1", optedOut: false })).toBe(true);
    expect(telemetryAllowed({ consent: "0", optedOut: false })).toBe(false);
    expect(telemetryAllowed({ consent: "1", optedOut: true })).toBe(false);
    expect(requestTelemetryAllowed(new Headers())).toBe(true);
    expect(requestTelemetryAllowed(new Headers({ cookie: `a=b; ${OPT_OUT_COOKIE}=1` }))).toBe(false);
    expect(requestTelemetryAllowed(new Headers({ "sec-gpc": "1" }))).toBe(false);
    expect(requestTelemetryAllowed(new Headers({ dnt: "1" }))).toBe(false);
  });
});
