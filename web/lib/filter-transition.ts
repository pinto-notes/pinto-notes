/// One motion for the site's two filter rows, the blog's category chips (separate pages, so a client
/// navigation) and the templates gallery's chips (the same page, filtered in place). The list never
/// goes blank: the chips' pick moves at the click, the old cards stay until the new list is in, and
/// then the cards settle. A card in both lists glides from its old place to its new one (320ms, the
/// settle curve); a new card blurs in where it lands (a small rise, 9px blur to none, 360ms, a little
/// later); a card that leaves fades where it was (140ms, faster than arriving). What follows the grid
/// glides to its new place. The header and title don't move. With reduced motion the change is instant.

/// The grid whose cards move, and whatever follows it. The page marks them with these classes; each
/// card is the grid's child, named by data-key (else by its first link).
export const FILTER_GRID = "filter-grid";
export const FILTER_AFTER = "filter-after";

export const MOVE_MS = 320;
export const IN_MS = 360;
export const OUT_MS = 140;
export const SETTLE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const LEAVE = "cubic-bezier(0.4, 0, 1, 1)";

/// Whether a filter change will animate (else callers just apply it).
export const filterAnimates = () => typeof document !== "undefined" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

/// Moves the pick in a chip row to `chip` right away, before anything else happens: the page's own
/// render then lands on the same state, so the pick changes once, at the click.
export function pickChip(chip: Element | null): void {
  const row = chip?.closest("[role=group], nav");
  if (!chip || !row) return;
  for (const el of row.querySelectorAll("[aria-current], [aria-pressed]")) {
    if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", String(el === chip));
    else if (el !== chip) el.removeAttribute("aria-current");
  }
  if (chip.tagName === "A") chip.setAttribute("aria-current", "page");
}

const grid = () => document.querySelector<HTMLElement>(`.${FILTER_GRID}`);
const after = () => document.querySelector<HTMLElement>(`.${FILTER_AFTER}`);

/// The cards on show, by name.
function cards(): Map<string, HTMLElement> {
  const out = new Map<string, HTMLElement>();
  [...(grid()?.children ?? [])].forEach((el, k) => {
    const li = el as HTMLElement;
    if (li.hidden) return;
    out.set(li.dataset.key ?? li.querySelector("a[href]")?.getAttribute("href") ?? String(k), li);
  });
  return out;
}

let current = 0;

/// Runs `update` (it must leave the new cards in the DOM by the time it returns or resolves) and then
/// settles the cards, or applies it straight away when it won't animate. `chip` is the one clicked.
/// A second change during the first takes over from wherever the cards are.
export async function filterTransition(update: () => Promise<void> | void, chip: Element | null = null): Promise<void> {
  pickChip(chip);
  if (!filterAnimates()) { await update(); return; }
  const me = ++current;
  // Where each card is on the page now (mid-move ones included), and a copy to fade if it leaves.
  const before = new Map([...cards()].map(([key, el]) => [key, { box: el.getBoundingClientRect(), copy: el.cloneNode(true) as HTMLElement }]));
  const below = after() ? after()!.getBoundingClientRect().top + scrollY : undefined; // on the page, not the screen: a page number scrolls
  await update();
  if (me !== current) return;
  const now = cards();
  let arriving = 0;
  for (const [key, el] of now) {
    el.getAnimations().forEach((a) => a.cancel());
    const was = before.get(key);
    if (was) {
      const box = el.getBoundingClientRect();
      const dx = was.box.left - box.left, dy = was.box.top - box.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: MOVE_MS, easing: SETTLE });
    } else {
      el.animate([{ opacity: 0, filter: "blur(9px)", transform: "translateY(10px) scale(0.98)" }, { opacity: 1, filter: "none", transform: "none" }],
        { duration: IN_MS, delay: 60 + Math.min(arriving++, 6) * 24, easing: SETTLE, fill: "backwards" });
    }
  }
  // A card that left fades where it was, from a copy laid over the page (it's hidden or gone by now).
  for (const [key, { box, copy }] of before) {
    if (now.has(key) || !box.width) continue;
    Object.assign(copy.style, { position: "absolute", left: `${box.left + scrollX}px`, top: `${box.top + scrollY}px`, width: `${box.width}px`, height: `${box.height}px`, margin: "0", display: "grid", pointerEvents: "none", zIndex: "0" });
    copy.setAttribute("aria-hidden", "true");
    copy.removeAttribute("hidden");
    copy.dataset.leaving = "";
    document.body.append(copy);
    copy.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.97)" }], { duration: OUT_MS, easing: LEAVE, fill: "forwards" }).finished.catch(() => {}).finally(() => copy.remove());
  }
  const tail = after();
  if (tail && below !== undefined) {
    const moved = below - (tail.getBoundingClientRect().top + scrollY);
    if (Math.abs(moved) > 0.5) tail.animate([{ transform: `translateY(${moved}px)` }, { transform: "none" }], { duration: MOVE_MS, easing: SETTLE });
  }
}
