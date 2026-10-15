import { describe, expect, it } from "vitest";
import { appLink } from "./NoteLink";

describe("a note's link in a browser", () => {
  const id = "sEbHaDgYXLDfpSMmrziRgA";
  const secret = "gIfSqgKHVsQcWBm2RTA0aw"; // gitleaks:allow (a made-up link secret for the test)

  it("hands the whole link to the app by its own scheme", () => {
    expect(appLink(id, `#${secret}`)).toBe(`ambernotes://s/${id}#${secret}`);
  });

  it("never builds a link from anything else in the address", () => {
    expect(appLink(id, "")).toBeNull();
    expect(appLink(id, "#short")).toBeNull();
    expect(appLink(id, `#${secret}"><script>`)).toBeNull();
    expect(appLink("../../etc", `#${secret}`)).toBeNull();
  });
});
