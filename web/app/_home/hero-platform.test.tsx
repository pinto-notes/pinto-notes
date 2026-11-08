// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }) }));
import { Hero } from "./Hero";

// Emil, 2026-11-08, on Windows: the hero offered iPhone and Mac with nothing saying that's all it runs on.
describe("the home hero off Apple", () => {
  it("tells a Windows, Android or Linux visitor it's for iPhone and Mac, with a link to send themselves", () => {
    const html = renderToStaticMarkup(<Hero />);
    const line = new DOMParser().parseFromString(html, "text/html").querySelector("[data-off-apple]")!;
    expect(line.textContent).toContain("Pinto Notes is for iPhone and Mac.");
    expect(line.querySelector("a")?.textContent).toBe("Send myself the link");
    const css = readFileSync(resolve(__dirname, "hero.module.css"), "utf8");
    expect(css).toContain(".offApple { display: none; }");
    expect(css).toMatch(/\[data-platform="windows"\], \[data-platform="android"\], \[data-platform="linux"\]\)\) \.offApple \{ display: block;/);
  });
});
