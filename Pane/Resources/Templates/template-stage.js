// A template app on the Mac template library's stage (TemplateAppPreview.staged, and the pictures
// scripts/template-stage-pictures.ts draws): only whole blocks show above the stage's foot (council
// round 5: half a "Groceries" row, "STREAK" and "TO DO" alone in the fade). A card that the foot
// would cut ends after its last row that fits, with its own padding under it; anything else the
// foot would cut goes, with all that comes after it in its column; a section heading left last
// without its card goes too. The foot is the top of the app's own tabs. Once the person scrolls
// the live app (a wheel or a key), everything shows again. Nothing here reaches a made note: Make adds the app as it is.
// The app shows today, as it would in your notes (9 November 2026: the stage used to set the
// app's clock to the latest Thursday, and said "Thursday 5 November, Today" on a Monday).
(() => {
  // In CSS pixels: the view is exactly what the stage shows of the app, and the fade at its foot
  // is 12 pt, 16 px at the stage's 75%. TemplateAppPreview in the app checks these agree
  // (SetupCardsTests).
  const FADE = 16
  const HIDDEN = "data-stage-hidden"
  let open = false
  const clipped = new Set()

  // The foot: the top of the app's own tabs, which sit along the stage's foot as they do in your
  // notes, with a little air over them; with no tabs, the fade. A pixel spare, so a block ending
  // on the line is never under either once rounded.
  const GAP = 8
  const tabs = () => {
    const nav = document.querySelector('nav[aria-label="Screens"]')
    if (!nav || getComputedStyle(nav).display === "none") return null
    const r = nav.getBoundingClientRect()
    return r.height ? r : null
  }
  const limit = () => { const t = tabs(); return (t ? t.top - GAP : innerHeight - FADE) - 1 }

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

  // The row a heading sits in: the largest box around it that is no taller than a row (twice
  // the heading, or 48 px), so a title and the button beside it are one row and the card under
  // them isn't part of it.
  function rowOf(el) {
    const own = el.getBoundingClientRect()
    const tall = Math.max(own.height * 2, 48)
    let r = own
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const pr = p.getBoundingClientRect()
      if (pr.height > tall) break
      r = pr
    }
    return r
  }

  function reset() {
    for (const el of document.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN)
    for (const el of clipped) { el.style.removeProperty("max-height"); el.style.removeProperty("overflow") }
    clipped.clear()
  }

  // The app can lay its blocks out side by side (two columns on the template page's wide stage),
  // so the foot is worked out per column. A cut is a span of the page's width and the height at
  // which that span ends: the first is the stage's own foot, all the way across. A card the foot
  // runs through ends after its last whole row, and what comes under it in its own column goes
  // (it would move up into the gap), while the column beside it keeps its blocks down to the foot.
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
        if (box(style) && r.top > 0) blocks.push({ el, top: r.top, bottom: r.bottom, left: r.left, right: r.right, heading: false, card: true, tall: true })
        continue
      }
      if (solid(el, style)) blocks.push({ el, top: r.top, bottom: r.bottom, left: r.left, right: r.right, heading: heading(el, style), card: box(style) })
    }
    const cuts = [{ left: -Infinity, right: Infinity, y: limit() }]
    const lineFor = (b) => Math.min(...cuts.filter((c) => b.left < c.right - 0.5 && b.right > c.left + 0.5).map((c) => c.y))
    const clips = new Map()
    // A card's clip: `edge`, the foot of its last row that shows, and `at`, where the card ends,
    // its padding under that row. What's in it below the edge doesn't show.
    const gone = (b) => [...clips].some(([el, c]) => el !== b.el && el.contains(b.el) && b.top >= c.edge - 0.5)
    const bottom = (b) => clips.get(b.el)?.at ?? b.bottom
    const settled = new Set()
    for (let moved = true; moved;) {
      moved = false
      for (const b of blocks) {
        if (settled.has(b) || gone(b)) continue
        const line = lineFor(b)
        if (!(b.top < line && bottom(b) > line)) continue
        // A card the line runs through ends after its last whole row that fits.
        const kids = b.card ? rows(b.el) : null
        if (kids) {
          const pad = b.bottom - kids[kids.length - 1].r.bottom
          const fit = kids.filter((x) => x.r.bottom + pad <= line)
          // Nothing after it in its column shows: once it's shorter, what comes after it moves up.
          if (fit.length) {
            const edge = fit[fit.length - 1].r.bottom
            clips.set(b.el, { edge, at: edge + pad })
            cuts.push({ left: b.left, right: b.right, y: edge + pad })
            moved = true
            continue
          }
        }
        settled.add(b)
        // A frame around the whole page never takes the page with it.
        if (b.tall && b.top <= 0) continue
        cuts.push({ left: b.left, right: b.right, y: b.top })
        moved = true
      }
      // A section heading left last in its column, with nothing under it above the line, goes
      // too, with whatever shares its row ("FIRST UP" and its Share button).
      if (!moved) {
        const shown = blocks.filter((b) => !gone(b) && bottom(b) <= lineFor(b))
        for (const h of shown.filter((b) => b.heading)) {
          // What shares its row: the blocks beside it inside the row it sits in (the widest
          // thing around it that is still one row tall), never a block in the column beside its
          // own. Counted by distance (480 px either side), the other column's card was its mate,
          // and a last heading on one side cut both columns (Study, 10 November 2026).
          const span = rowOf(h.el)
          const mates = shown.filter((b) => b.bottom > h.top && b.top < h.bottom && b.left >= span.left - 0.5 && b.right <= span.right + 0.5)
          const left = Math.min(...mates.map((b) => b.left)), right = Math.max(...mates.map((b) => b.right))
          if (shown.some((b) => !mates.includes(b) && b.top >= h.bottom - 0.5 && b.left < right - 0.5 && b.right > left + 0.5)) continue
          const top = Math.min(...mates.map((b) => b.top))
          if (top > 0) { cuts.push({ left, right, y: top }); moved = true; break }
        }
      }
    }
    for (const [el, c] of clips) {
      const top = el.getBoundingClientRect().top
      for (const k of el.querySelectorAll("*")) {
        const r = k.getBoundingClientRect()
        if (r.height && r.top >= c.edge - 0.5) k.setAttribute(HIDDEN, "")
      }
      el.style.setProperty("max-height", `${c.at - top}px`, "important")
      el.style.setProperty("overflow", "hidden", "important")
      clipped.add(el)
    }
    for (const b of blocks) {
      if (clips.has(b.el)) continue
      if (b.top >= lineFor(b) - 0.5) b.el.setAttribute(HIDDEN, "")
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
