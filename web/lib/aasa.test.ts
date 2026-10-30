import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aasa, aasaRewrites } from "./aasa";

describe("a build of your own's apple-app-site-association", () => {
  it("has the shape of the site's own file, for your app", () => {
    const own = JSON.parse(readFileSync(new URL("../public/.well-known/apple-app-site-association", import.meta.url), "utf8"));
    const made = aasa("4UM3XVUN9Y.dev.emilwagman.pane");
    const shape = (f: typeof made) => ({ ...f, applinks: { ...f.applinks, details: f.applinks.details.map((d) => ({ ...d, components: d.components.map((c) => c["/"]) })) } });
    expect(shape(made)).toEqual(shape(own));
    expect(aasa("ABCDE12345.com.kim.notes").applinks.details[0].appIDs).toEqual(["ABCDE12345.com.kim.notes"]);
  });

  it("is served only when APPLE_APP_ID is set and well formed", () => {
    expect(aasaRewrites(undefined)).toEqual([]);
    expect(aasaRewrites("com.kim.notes")).toEqual([]);
    expect(aasaRewrites("ABCDE12345.com.kim.notes")).toEqual([{ source: "/.well-known/apple-app-site-association", destination: "/api/aasa" }]);
  });
});
