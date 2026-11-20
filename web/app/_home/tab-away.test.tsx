// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { AWAY_TITLES, TabAway, pickAwayTitle } from "./TabAway";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("the home tab when you leave", () => {
  afterEach(() => setHidden(false));

  it("says a random line while you're away and its real title when you're back", () => {
    document.title = "Pinto Notes";
    const root = createRoot(document.createElement("div"));
    act(() => root.render(<TabAway />));

    setHidden(true);
    expect(AWAY_TITLES).toContain(document.title);
    setHidden(false);
    expect(document.title).toBe("Pinto Notes");

    act(() => root.unmount());
    setHidden(true);
    expect(document.title).toBe("Pinto Notes");
  });

  it("never says the same line twice in a row", () => {
    for (const last of AWAY_TITLES) {
      for (const r of [0, 0.5, 0.999]) expect(pickAwayTitle(last, () => r)).not.toBe(last);
    }
  });
});
