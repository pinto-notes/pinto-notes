// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FILTER_GRID, IN_MS, MOVE_MS, OUT_MS, SETTLE, filterTransition, pickChip } from "./filter-transition";

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ""; });
const motion = (reduce: boolean) => vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce") && reduce }));

/// A grid whose animations are recorded and finish at once. Cards sit where `at` says.
function stage(html = `<li data-key="a">a</li><li data-key="b">b</li>`) {
  document.body.innerHTML = `<ul class="${FILTER_GRID}">${html}</ul><nav class="filter-after"></nav>`;
  const calls: { key: string; frames: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
  Element.prototype.animate = function (frames, options) {
    calls.push({ key: (this as HTMLElement).dataset.key ?? this.className, frames: frames as Keyframe[], options: options as KeyframeAnimationOptions });
    return { finished: Promise.resolve(), cancel() {} } as unknown as Animation;
  };
  Element.prototype.getAnimations = () => [];
  return calls;
}
/// Lays each card out at a place on the page, by key: [left, top].
function place(at: Record<string, [number, number]>) {
  for (const li of document.querySelectorAll<HTMLElement>(`.${FILTER_GRID} > li`)) {
    const [x, y] = at[li.dataset.key!] ?? [0, 0];
    li.getBoundingClientRect = () => ({ left: x, top: y, width: 100, height: 100, right: x + 100, bottom: y + 100, x, y, toJSON() {} }) as DOMRect;
  }
}

describe("the filter motion", () => {
  it("swaps at once with reduced motion", async () => {
    motion(true);
    const calls = stage();
    const update = vi.fn();
    await filterTransition(update);
    expect(update).toHaveBeenCalledOnce();
    expect(calls).toEqual([]);
  });

  it("never hides the grid: the old cards stay on show until the new ones are in", async () => {
    motion(false);
    stage();
    let shownAtSwap = "";
    await filterTransition(() => {
      const g = document.querySelector<HTMLElement>(`.${FILTER_GRID}`)!;
      shownAtSwap = `${g.style.opacity}|${document.documentElement.dataset.filter ?? ""}|${g.children.length}`;
    });
    expect(shownAtSwap).toBe("||2");
    const css = readFileSync(resolve(__dirname, "../app/site.css"), "utf8");
    expect(css).not.toMatch(/filter-grid \{ opacity: 0/);
  });

  it("glides a card that stays to its new place, blurs a new one in, and fades one that leaves", async () => {
    motion(false);
    const calls = stage();
    place({ a: [0, 0], b: [200, 0] });
    await filterTransition(() => {
      document.querySelector(`.${FILTER_GRID}`)!.innerHTML = `<li data-key="b">b</li><li data-key="c">c</li>`;
      place({ b: [0, 0], c: [200, 0] });
    });
    const move = calls.find((c) => c.key === "b")!;
    expect(move.frames).toEqual([{ transform: "translate(200px, 0px)" }, { transform: "none" }]);
    expect(move.options).toMatchObject({ duration: MOVE_MS, easing: SETTLE });
    const arrive = calls.find((c) => c.key === "c")!;
    expect(arrive.frames[0]).toMatchObject({ opacity: 0, filter: "blur(9px)" });
    expect(arrive.options).toMatchObject({ duration: IN_MS, fill: "backwards" });
    const leave = calls.find((c) => c.key === "a")!; // the copy laid over where it was
    expect(leave.frames.at(-1)).toMatchObject({ opacity: 0 });
    expect(leave.options.duration).toBe(OUT_MS);
    expect(OUT_MS).toBeLessThan(IN_MS); // things that leave go faster than things that arrive
  });

  it("lets the last of two quick changes settle the cards", async () => {
    motion(false);
    const calls = stage();
    let release!: () => void;
    const first = filterTransition(() => new Promise<void>((r) => { release = r; }));
    await Promise.resolve(); await Promise.resolve();
    const second = filterTransition(() => { document.querySelector(`.${FILTER_GRID}`)!.innerHTML = `<li data-key="z">z</li>`; });
    release();
    await Promise.all([first, second]);
    expect(calls.filter((c) => c.key === "z")).toHaveLength(1);
  });

  it("moves a chip row's pick in one step, before the change runs", async () => {
    motion(true);
    document.body.innerHTML = '<nav><a href="/blog" aria-current="page">All</a><a href="/blog/category/guides">Guides</a></nav><div role="group"><button aria-pressed="true">All</button><button aria-pressed="false">Work</button></div>';
    const [all, guides] = document.querySelectorAll("a");
    let seen = "";
    await filterTransition(() => { seen = `${all.getAttribute("aria-current")}/${guides.getAttribute("aria-current")}`; }, guides);
    expect(seen).toBe("null/page");
    const [pAll, work] = document.querySelectorAll("button");
    pickChip(work);
    expect([pAll.getAttribute("aria-pressed"), work.getAttribute("aria-pressed")]).toEqual(["false", "true"]);
  });

  it("never animates the chips", () => {
    for (const f of ["../app/blog/blog.module.css", "../app/templates/templates.module.css"]) {
      const c = readFileSync(resolve(__dirname, f), "utf8");
      expect(c, f).not.toMatch(/\.(filters a|chip) \{ transition:[^}]*(background|color)/);
    }
  });
});
