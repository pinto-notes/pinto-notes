// A template app on the Mac template library's stage (TemplateAppPreview.staged, and the pictures
// scripts/template-stage-pictures.ts draws): only whole blocks show above the stage's foot (council
// round 5: half a "Groceries" row, "STREAK" and "TO DO" alone in the fade). A card that the foot
// would cut ends after its last row that fits, with its own padding under it; anything else the
// foot would cut goes, with all that comes after it; a section heading left last without its card
// goes too. Once the person scrolls the live app (a wheel or a key), everything shows again.
// Nothing here reaches a made note: Make adds the app as it is.
(() => {
  // The stage's day is the latest Thursday (today, from Thursday to Sunday's Thursday): the week
  // shows in use, never a Monday's "50%" with only M filled (council round 6). The sample's dates
  // move to the same day (TemplateSample.stageDay in the app, stageDay in the pictures' script).
  const STAGE_WEEKDAY = 4
  const RealDate = Date
  const back = (new RealDate().getDay() - STAGE_WEEKDAY + 7) % 7
  if (back) {
    const shift = -back * 86_400_000
    class StageDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + shift) }
      static now() { return RealDate.now() + shift }
    }
    window.Date = StageDate
  }

  // In CSS pixels: what the stage shows of the app, and the fade at its foot. The big stage's
  // window shows all of the view (400 x 320 pt at 75%: 426 px; the 12 pt fade: 16 px); the small
  // stage's app is laid out 480 px tall at 70% and shows 169 pt of it (242 px; the fade: 17 px).
  // TemplateAppPreview.stageScript(...) in the app checks these agree (SetupCardsTests).
  const SMALL_WIDTH = 480, SMALL_VISIBLE = 242, SMALL_FADE = 17, BIG_FADE = 16
  const HIDDEN = "data-stage-hidden"
  let open = false
  const clipped = new Set()

  // A pixel spare, so a block ending on the line is never in the fade once rounded.
  const limit = () => (innerWidth <= SMALL_WIDTH ? SMALL_VISIBLE - SMALL_FADE : innerHeight - BIG_FADE) - 1

  const box = (style) => style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent"
  // A block nothing may cut: a leaf (text, an icon, a control), or anything drawn as a box of its own.
  const solid = (el, style) =>
    !el.children.length || ["svg", "img", "button", "input", "select", "textarea", "canvas", "progress"].includes(el.tagName.toLowerCase()) || box(style)
  // A section's heading ("TO DO", "Streak"); never the screen's own title.
  const heading = (el, style) => /^h[2-6]$/i.test(el.tagName) || (style.textTransform === "uppercase" && !el.closest("h1"))

  // A card's rows: its children stacked top to bottom, through any wrapper with one child.
  function rows(el) {
    let c = el
    while (c.children.length === 1) c = c.children[0]
    const kids = [...c.children].map((k) => ({ k, r: k.getBoundingClientRect() })).filter((x) => x.r.height)
    if (kids.length < 2) return null
    for (let i = 1; i < kids.length; i++) if (kids[i].r.top < kids[i - 1].r.bottom - 1) return null
    return kids
  }

  function reset() {
    for (const el of document.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN)
    for (const el of clipped) { el.style.removeProperty("max-height"); el.style.removeProperty("overflow") }
    clipped.clear()
  }

  function cut() {
    if (open) return
    watch.disconnect()
    reset()
    const main = document.querySelector("main") || document.body
    const blocks = []
    for (const el of main.querySelectorAll("*")) {
      const style = getComputedStyle(el)
      if (style.display === "none" || style.position === "fixed") continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      // A box as tall as the view is a frame around the rest, not a block; a card that tall (a
      // long list) ends after its last row above the line, once the line is known.
      if (r.height >= innerHeight * 0.9) {
        if (box(style) && r.top > 0) blocks.push({ el, top: r.top, bottom: r.bottom, heading: false, card: true, tall: true })
        continue
      }
      if (solid(el, style)) blocks.push({ el, top: r.top, bottom: r.bottom, heading: heading(el, style), card: box(style) })
    }
    const clips = new Map()
    // A card's clip: `edge`, the foot of its last row that shows, and `at`, where the card ends,
    // its padding under that row. What's in it below the edge doesn't show.
    const gone = (b) => [...clips].some(([el, c]) => el !== b.el && el.contains(b.el) && b.top >= c.edge - 0.5)
    const bottom = (b) => clips.get(b.el)?.at ?? b.bottom
    let line = limit()
    for (let moved = true; moved;) {
      moved = false
      for (const b of blocks) {
        if (gone(b) || !(b.top < line && bottom(b) > line)) continue
        // A card the line runs through ends after its last whole row that fits.
        const kids = b.card ? rows(b.el) : null
        if (kids) {
          const pad = b.bottom - kids[kids.length - 1].r.bottom
          const fit = kids.filter((x) => x.r.bottom + pad <= line)
          // Nothing after it shows: once it's shorter, what comes after it moves up.
          if (fit.length) {
            const edge = fit[fit.length - 1].r.bottom
            clips.set(b.el, { edge, at: edge + pad })
            line = edge + pad
            moved = true
            continue
          }
        }
        // A frame around the whole page never takes the page with it.
        if (b.tall && b.top <= 0) continue
        line = b.top
        moved = true
      }
      // A section heading left last, with nothing under it above the line, goes too, with whatever
      // shares its row ("FIRST UP" and its Share button).
      if (!moved) {
        const shown = blocks.filter((b) => !gone(b) && bottom(b) <= line)
        const last = shown.filter((b) => b.heading).sort((a, b) => b.top - a.top)[0]
        if (last && !shown.some((b) => b.top >= last.bottom - 0.5)) {
          const row = Math.min(...shown.filter((b) => b.bottom > last.top && b.top < last.bottom).map((b) => b.top))
          if (row > 0 && row < line) { line = row; moved = true }
        }
      }
    }
    for (const [el, c] of clips) {
      const top = el.getBoundingClientRect().top
      if (top >= line) continue
      for (const k of el.querySelectorAll("*")) {
        const r = k.getBoundingClientRect()
        if (r.height && r.top >= c.edge - 0.5) k.setAttribute(HIDDEN, "")
      }
      el.style.setProperty("max-height", `${c.at - top}px`, "important")
      el.style.setProperty("overflow", "hidden", "important")
      clipped.add(el)
    }
    for (const el of main.querySelectorAll("*")) {
      const r = el.getBoundingClientRect()
      if (r.height && r.top >= line - 0.5) el.setAttribute(HIDDEN, "")
    }
    observe()
  }

  let queued = false
  const soon = () => { if (!queued && !open) { queued = true; requestAnimationFrame(() => { queued = false; cut() }) } }
  const watch = new MutationObserver(soon)
  const observe = () => watch.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] })
  const reveal = () => { open = true; watch.disconnect(); reset() }
  const style = document.createElement("style")
  style.textContent = `[${HIDDEN}] { visibility: hidden !important; }`
  document.head.appendChild(style)
  observe()
  addEventListener("resize", soon)
  addEventListener("load", soon)
  addEventListener("wheel", reveal, { passive: true, once: true })
  addEventListener("keydown", reveal, { once: true })
  if (document.fonts) document.fonts.ready.then(soon)
  soon()
})()
