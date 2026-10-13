// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import OpenInApp from "../OpenInApp";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { delete document.documentElement.dataset.platform; document.body.innerHTML = ""; });

const name = (platform: string) => {
  document.documentElement.dataset.platform = platform;
  const host = document.createElement("div"); document.body.append(host);
  act(() => createRoot(host).render(<OpenInApp href="/open/template/habit-tracker" app="pintonotes://template/habit-tracker" label="Start tracking: Habit tracker" labelIos="Use template: Habit tracker">x</OpenInApp>));
  return host.querySelector("a")!.getAttribute("aria-label");
};

it("names the button with the words it shows: the verb on a Mac, Use template on an iPhone", () => {
  expect(name("mac")).toBe("Start tracking: Habit tracker");
  expect(name("ios")).toBe("Use template: Habit tracker");
});
