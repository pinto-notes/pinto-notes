import CoreGraphics
import Foundation
import ImageIO

// The month before its film, opened from a card (NotebookFilmStore.offered): where you started (the
// notes you brought in, or your first one), two slides, each with one strong thing on it in its own
// bold paper colour, then the film's own night sky with a play button. It talks to you, on screen
// and in what you send (Emil, 11-11: "you", not "my", in all the text).
// A slide is drawn from how long it's been on screen, so it unfolds as it comes in, and a picture of
// it is the same drawing at its end.

private typealias C = FilmRenderer.RGB

struct FilmSlides: @unchecked Sendable {
    let input: FilmInput
    let script: FilmScript
    let mark: CGImage?
    /// The shape it's drawn in, for a width of 1080, and what the screen keeps at its top and bottom.
    var H = 2348.0, top = 150.0, bottom = 190.0
    let W = 1080.0
    /// A note's name, when it may be shown; a note without one is left off the list.
    var title: @Sendable (FilmNote) -> String?
    /// Your first name, from your profile, to greet you by (none: it greets you without one).
    var you: String?
    /// Which first slide (being compared, 11-11): 0 the wall of what you brought, 1 hello in words,
    /// 2 your notebook as a sheet, 3 the Pinto leaf.
    var startLook = 1

    /// A slide: how long it takes to come in, and its drawing at a time since it appeared.
    struct Slide: @unchecked Sendable {
        let name: String
        let length: Double
        /// Its words are light (on a dark colour), so what's drawn over it is too.
        var light = false
        /// What it says, for VoiceOver.
        var spoken = ""
        /// What stays still under it (its paper, their shadows, the mark): drawn once at each size and
        /// kept, so every frame can be full size and still quick (about 3 ms where it was 18).
        var back: ((CGContext) -> Void)? = nil
        let draw: (CGContext, Double) -> Void
    }

    /// The still parts of the slides, as drawn, by slide and size (shared by every copy).
    final class Backs: @unchecked Sendable {
        private let lock = NSLock()
        private var images: [String: CGImage] = [:]
        func image(_ key: String, _ make: () -> CGImage?) -> CGImage? {
            lock.lock(); defer { lock.unlock() }
            if let i = images[key] { return i }
            let i = make(); images[key] = i
            return i
        }
    }
    let backs = Backs()

    init(input: FilmInput, script: FilmScript, mark: CGImage?, title: (@Sendable (FilmNote) -> String?)? = nil) {
        self.input = input
        self.script = script
        self.mark = mark
        let demo = FilmSlides.demoNames(input)
        self.title = title ?? { demo[$0.id] }
    }

    // MARK: What it says

    private var cal: Calendar { Calendar.current }

    /// The notes you kept coming back to, most first: up to five, named.
    var ranked: [(note: FilmNote, name: String)] {
        input.notes.filter { $0.removed == nil }
            .sorted { $0.edits.count == $1.edits.count ? $0.created < $1.created : $0.edits.count > $1.edits.count }
            .lazy.compactMap { n in title(n).map { (n, $0) } }
            .prefix(5).map { $0 }
    }

    /// What you wrote yourself (not what came in with an import, not the AI's), by hour of the day.
    var byHour: [Int] {
        var h = [Int](repeating: 0, count: 24)
        for n in input.notes { for e in n.edits.dropFirst(n.imported == true ? 1 : 0) where e.ai == nil { h[cal.component(.hour, from: e.at)] += 1 } }
        return h
    }

    /// The three hours you write most in, as the hour they start.
    var bestHours: Int {
        let h = byHour
        func window(_ k: Int) -> Int { h[k % 24] + h[(k + 1) % 24] + h[(k + 2) % 24] }
        return (0..<24).max { window($0) < window($1) } ?? 0
    }

    /// What your hours make you: "You're a night" over "owl".
    static func kind(startingAt start: Int) -> (String, String) {
        let mid = (start + 1) % 24, who = "You're"
        switch mid {
        case 5..<9: return ("\(who) an early", "bird")
        case 9..<12: return ("\(who) a morning", "writer")
        case 12..<17: return ("\(who) an afternoon", "writer")
        case 17..<21: return ("\(who) an evening", "writer")
        default: return ("\(who) a night", "owl")
        }
    }


    /// What it greets you by: the first word of your profile's name, if it has one.
    static func firstName(_ name: String?) -> String? {
        name?.split(whereSeparator: \.isWhitespace).first.map(String.init)
    }

    static func hourName(_ h: Int) -> String {
        let h = (h % 24 + 24) % 24
        return h == 0 ? "midnight" : h == 12 ? "noon" : h < 12 ? "\(h) am" : "\(h - 12) pm"
    }

    // MARK: Paper

    private struct Palette {
        var bg: C; var tones: [C]; var ink: C; var you: C; var ai: C
        /// What's written on the cream paper (its own ink is light on a strong colour).
        var paperInk: C { ink.r + ink.g + ink.b > 1.5 ? C(0x2B1406) : ink }
    }

    /// The film's own sky, the one its card and its first frame are.
    /// Slide `k`'s sky (0 the welcome, 1 your top notes, 2 when you write, 3 play). The welcome and
    /// play are the film's own sky (the card grows into the one, the film opens on the other); the two
    /// between are two other skies, picked so no slide's is like the one before it (the violet and
    /// the purple are too alike to tell apart).
    private func skyColours(_ k: Int) -> (C, [C]) {
        let sky = GalaxyScene.skies[Self.skyPath((seed / 3 + seed) % GalaxyScene.skies.count)[k]]
        return (C(sky.0), sky.1.map { C($0) })
    }

    /// Every slide is set in the film's own night sky, each a different one of its skies, and they
    /// shift from one to the next. (Emil, 11-11: the film is great, the slides' coloured paper
    /// wasn't; "A, but make the background shift between slides".)
    private func palette(_ k: Int) -> Palette {
        let (bg, tones) = skyColours(min(k, 3))
        return Palette(bg: bg, tones: tones, ink: C(0xFFF4E6), you: C(0xFFC45A), ai: C(0xBFE0FF))
    }

    private var seed: Int { script.seed }

    private func blob(_ c: CGPoint, _ rx: Double, _ ry: Double, key: Int) -> [CGPoint] {
        (0..<90).map { k in
            let a = Double(k) / 90 * 2 * .pi
            let w1: Double = 0.08 * sin(3 * a + filmHash(key, 1) * 6)
            let w2: Double = 0.05 * sin(5 * a + filmHash(key, 2) * 6) + 0.03 * sin(9 * a + filmHash(key, 3) * 6)
            return CGPoint(x: c.x + cos(a) * rx * (1 + w1 + w2), y: c.y + sin(a) * ry * (1 + w1 + w2))
        }
    }
    private func paper(_ pts: [CGPoint], _ c: C, lift: Double = 1, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -6 * lift), blur: 14 * lift, color: CGColor(gray: 0, alpha: 0.38))
        ctx.addLines(between: pts); ctx.closePath()
        ctx.setFillColor(c.cg()); ctx.fillPath()
        ctx.restoreGState()
    }
    private func circle(_ p: CGPoint, _ r: Double, _ c: C, lift: Double = 1, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -6 * lift), blur: 14 * lift, color: CGColor(gray: 0, alpha: 0.38))
        ctx.setFillColor(c.cg()); ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r))
        ctx.restoreGState()
    }
    private func slip(_ s: String, _ size: Double, center: CGPoint, _ fill: C, _ ink: C, in ctx: CGContext) {
        // (A long name gets smaller rather than run off the page.)
        let size = min(size, size * (W - 200) / max(1, FilmKit.width(s, size, 0.55) + size * 1.1))
        let w = FilmKit.width(s, size, 0.55) + size * 1.1, h = size * 1.7
        let r = CGRect(x: center.x - w / 2, y: center.y - h / 2, width: w, height: h)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -5), blur: 12, color: CGColor(gray: 0, alpha: 0.4))
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: 12, cornerHeight: 12, transform: nil))
        ctx.setFillColor(fill.cg()); ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(s, size, 0.55, ink.cg(), at: CGPoint(x: center.x, y: center.y - size * 0.34), align: 0.5, in: ctx)
    }
    /// A line of text that rises into place as it fades in, from `at` seconds; cut short when too wide.
    private func say(_ s: String, _ size: Double, _ weight: Double, _ c: CGColor, x: Double = 72, y: Double, align: Double = 0, t: Double, at: Double, in ctx: CGContext) {
        let e = filmSmooth((t - at) / 0.45)
        guard e > 0 else { return }
        let size = min(size, size * (W - 132) / max(1, FilmKit.width(s, size, weight)))
        ctx.saveGState(); ctx.setAlpha(e)
        FilmKit.text(s, size, weight, c, at: CGPoint(x: x, y: y - (1 - e) * 46), align: align, in: ctx)
        ctx.restoreGState()
    }
    /// A shape with its shadow, drawn once (at this frame's resolution) and kept, then placed, scaled
    /// and faded on each frame: a big soft shadow is the slowest thing to draw. `side` is the shape's
    /// size around `.zero`, where `draw` draws it.
    private func sprite(_ key: String, side: Double, at p: CGPoint, scale: Double, alpha: Double = 1, in ctx: CGContext, _ draw: (CGContext) -> Void) {
        guard scale > 0.001, alpha > 0.001 else { return }
        let res = ctx.ctm.a, box = side + 160
        guard let image = backs.image("sprite \(key) \(side) \(res)", {
            let n = Int((box * res).rounded(.up))
            guard let c = FilmRenderer.context(width: n, height: n) else { return nil }
            c.scaleBy(x: res, y: res); c.translateBy(x: box / 2, y: box / 2)
            draw(c)
            return c.makeImage()
        }) else { return }
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.translateBy(x: p.x, y: p.y); ctx.scaleBy(x: scale, y: scale)
        ctx.draw(image, in: CGRect(x: -box / 2, y: -box / 2, width: box, height: box))
        ctx.restoreGState()
    }

    /// Draws scaled (and turned) about a point, faded by `alpha`.
    private func around(_ p: CGPoint, scale: Double, alpha: Double = 1, in ctx: CGContext, _ draw: () -> Void) {
        guard scale > 0.001, alpha > 0.001 else { return }
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.translateBy(x: p.x, y: p.y); ctx.scaleBy(x: scale, y: scale); ctx.translateBy(x: -p.x, y: -p.y)
        draw()
        ctx.restoreGState()
    }

    private func stars(_ k: Int, _ p: Palette, in ctx: CGContext) {
        for j in 0..<150 {
            let q = CGPoint(x: filmHash(j, seed + 11 * k + 1) * W, y: filmHash(j, seed + 11 * k + 2) * H), r = 1.3 + 2.4 * pow(filmHash(j, seed + 3), 3)
            ctx.setFillColor(p.ink.cg(0.2 + 0.45 * filmHash(j, seed + 4)))
            ctx.fillEllipse(in: CGRect(x: q.x - r, y: q.y - r, width: r * 2, height: r * 2))
        }
    }

    /// A slide's sky: its colour, two paper clouds, stars. The clouds are the same on every slide, so
    /// going from one to the next only shifts their colour.
    private func ground(_ k: Int, _ p: Palette, in ctx: CGContext) {
        ctx.setFillColor(p.bg.cg()); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        paper(blob(CGPoint(x: 260, y: H * 0.36), 700, 620, key: seed * 7), p.bg.mix(p.tones[0], 0.6), lift: 1.8, in: ctx)
        paper(blob(CGPoint(x: 860, y: H * 0.7), 560, 520, key: seed * 9), p.bg.mix(p.tones[0], 0.95), lift: 1.5, in: ctx)
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        // (The play slide's stars twinkle in, so it draws its own.)
        if k != 3 { stars(k, p, in: ctx) }
        if let mark { ctx.draw(mark, in: CGRect(x: 64, y: H - top - 70, width: 52, height: 52)) }
        FilmKit.text("Pinto Notes", 34, 0.45, p.ink.cg(0.92), at: CGPoint(x: 130, y: H - top - 56), in: ctx)
    }

    // MARK: The slides

    func slides() -> [Slide] {
        var out: [Slide] = [start()]
        let months = script.stats.months
        // Your top notes: the brightest stars, by name.
        let top5 = ranked
        if let first = top5.first, first.note.edits.count >= 6 {
            let rows = top5.count
            let spoken = "Your top notes: " + top5.enumerated().map { "\($0.offset + 1), \($0.element.name), \($0.element.note.edits.count) times" }.joined(separator: "; ")
            out.append(Slide(name: "top-notes", length: 1.0 + 0.12 * Double(max(0, rows - 2)) + 0.45, light: true, spoken: spoken,
                             back: { ctx in ground(1, palette(1), in: ctx) }) { ctx, t in
                let p = palette(1)
                // The five as strips of paper, each as long as how often you came back to it, the first
                // in your colour; its name over it and the count at its end.
                let most = Double(first.note.edits.count), (lo, hi) = band
                let rowH = 144.0, gap = 30.0, x0 = 130.0, full = W - x0 - 66 - 110
                var y = (lo + hi) / 2 + (Double(rows) * rowH + Double(rows - 1) * gap) / 2
                for (i, row) in top5.enumerated() {
                    defer { y -= rowH + gap }
                    let at = 0.15 + 0.12 * Double(i), e = filmSmooth((t - at) / 0.4)
                    guard e > 0 else { continue }
                    let n = row.note.edits.count
                    ctx.saveGState(); ctx.setAlpha(e); ctx.translateBy(x: 0, y: -(1 - e) * 30)
                    FilmKit.text("\(i + 1)", 50, 0.8, p.ink.cg(0.45), at: CGPoint(x: 66, y: y - 46), in: ctx)
                    let fit = min(50, 50 * (W - x0 - 66) / max(1, FilmKit.width(row.name, 50, 0.6)))
                    FilmKit.text(row.name, fit, 0.6, p.ink.cg(), at: CGPoint(x: x0, y: y - 46), in: ctx)
                    let grow = filmSmooth((t - at - 0.08) / 0.55)
                    let len = max(44, full * Double(n) / most) * grow
                    let bar = CGRect(x: x0, y: y - rowH, width: len, height: 56)
                    ctx.saveGState()
                    ctx.setShadow(offset: CGSize(width: 0, height: -4), blur: 10, color: CGColor(gray: 0, alpha: 0.28))
                    ctx.addPath(CGPath(roundedRect: bar, cornerWidth: 12, cornerHeight: 12, transform: nil))
                    ctx.setFillColor((i == 0 ? p.you : C(0xFFF6E8)).cg()); ctx.fillPath()
                    ctx.restoreGState()
                    FilmKit.text("\(n)", 44, 0.55, p.ink.cg(0.75), at: CGPoint(x: bar.maxX + 22, y: bar.minY + 12), in: ctx)
                    ctx.restoreGState()
                }
                let y0 = bottom + 120
                say("Your top note", 110, 0.75, p.ink.cg(), x: 66, y: y0 + 280, t: t, at: 0, in: ctx)
                say(first.name, 170, 0.8, p.ink.cg(), x: 66, y: y0 + 110, t: t, at: 0.1, in: ctx)
                say("\(first.note.edits.count) times \(months == 1 ? "this month" : "in \(months) months"), more than any other", 44, 0.3, p.ink.cg(0.85), y: y0, t: t, at: 0.75, in: ctx)
            })
        }
        // When you write: the day as a paper dial, swept hour by hour, and what that makes you.
        let hours = byHour
        if hours.reduce(0, +) >= 20 {
            let start = bestHours, kind = Self.kind(startingAt: start)
            let dark = !(5..<17).contains((start + 1) % 24)
            out.append(Slide(name: "when", length: 2.25, light: true, spoken: "\(kind.0) \(kind.1). Most of it between \(Self.hourName(start)) and \(Self.hourName(start + 3))", back: { ctx in ground(2, palette(2), in: ctx) }) { ctx, t in
                let p = palette(2)
                let c = CGPoint(x: W / 2, y: H * 0.6), R = 400.0
                func angle(_ h: Double) -> Double { .pi / 2 - h / 24 * 2 * .pi }
                sprite("dial", side: 2 * R, at: c, scale: 0.7 + 0.3 * filmBackOut(t / 0.5), alpha: filmSmooth(t / 0.2), in: ctx) { circle(.zero, R, p.tones[1], lift: 1.6, in: $0) }
                let labelsIn = filmSmooth((t - 0.2) / 0.3)
                if labelsIn > 0 {
                    ctx.saveGState(); ctx.setAlpha(labelsIn)
                    for (h, label) in [(0, "midnight"), (6, "6 am"), (12, "noon"), (18, "6 pm")] {
                        let a = angle(Double(h)), q = CGPoint(x: c.x + cos(a) * (R + 58), y: c.y + sin(a) * (R + 58) - 14)
                        FilmKit.text(label, 36, 0.4, p.ink.cg(0.75), at: q, align: h == 6 ? 0.25 : h == 18 ? 0.75 : 0.5, in: ctx)
                    }
                    ctx.restoreGState()
                }
                // Each hour of the day as a petal, as long as how much you wrote in it, opening as the hand
                // passes; the three you write most in, in your colour.
                let sweep = 24 * min(1, max(0, (t - 0.3) / 1.1))
                let most = Double(max(1, hours.max() ?? 1)), r0 = 212.0, r1 = R - 36
                ctx.saveGState()
                ctx.setShadow(offset: CGSize(width: 0, height: -4), blur: 10, color: CGColor(gray: 0, alpha: 0.3))
                for h in 0..<24 where Double(h) < sweep {
                    let grow = filmBackOut((sweep - Double(h)) / 1.6), mine = (h - start + 24) % 24 < 3
                    guard hours[h] > 0 else {
                        let a = angle(Double(h) + 0.5), q = CGPoint(x: c.x + cos(a) * (r0 + 8), y: c.y + sin(a) * (r0 + 8))
                        ctx.setFillColor(p.ink.cg(0.35 * min(1, grow))); ctx.fillEllipse(in: CGRect(x: q.x - 6, y: q.y - 6, width: 12, height: 12))
                        continue
                    }
                    let r = r0 + max(20, (r1 - r0) * Double(hours[h]) / most) * grow
                    ctx.addArc(center: c, radius: r, startAngle: angle(Double(h) + 0.1), endAngle: angle(Double(h) + 0.9), clockwise: true)
                    ctx.addArc(center: c, radius: r0, startAngle: angle(Double(h) + 0.9), endAngle: angle(Double(h) + 0.1), clockwise: false)
                    ctx.closePath()
                    ctx.setFillColor(mine ? p.you.cg() : p.ink.cg(0.5)); ctx.fillPath()
                }
                ctx.restoreGState()
                if sweep > 0, sweep < 24 {
                    let a = angle(sweep)
                    ctx.setStrokeColor(p.ink.cg(0.7)); ctx.setLineWidth(6); ctx.setLineCap(.round)
                    ctx.move(to: c); ctx.addLine(to: CGPoint(x: c.x + cos(a) * (R - 30), y: c.y + sin(a) * (R - 30))); ctx.strokePath()
                }
                // The sun or the moon in the middle.
                sprite(dark ? "moon" : "sun", side: 360, at: c, scale: filmBackOut((t - 1.45) / 0.45), in: ctx) { ctx in
                    if dark {
                        circle(.zero, 110, C(0xFFF4E6), lift: 1, in: ctx)
                        ctx.setFillColor(p.tones[1].cg()); ctx.fillEllipse(in: CGRect(x: -58, y: -80, width: 220, height: 220))
                    } else {
                        for k in 0..<12 {
                            let a = Double(k) * .pi / 6, w = 0.13
                            ctx.move(to: CGPoint(x: cos(a - w) * 120, y: sin(a - w) * 120))
                            ctx.addLine(to: CGPoint(x: cos(a) * 175, y: sin(a) * 175))
                            ctx.addLine(to: CGPoint(x: cos(a + w) * 120, y: sin(a + w) * 120))
                            ctx.closePath(); ctx.setFillColor(p.you.cg()); ctx.fillPath()
                        }
                        circle(.zero, 110, p.you, lift: 1, in: ctx)
                    }
                }
                let y = bottom + 120
                say(kind.0, 110, 0.75, p.ink.cg(), x: 66, y: y + 280, t: t, at: 1.45, in: ctx)
                say(kind.1, 170, 0.8, p.ink.cg(), x: 66, y: y + 110, t: t, at: 1.58, in: ctx)
                say("Most of it between \(Self.hourName(start)) and \(Self.hourName(start + 3))", 40, 0.25, p.ink.cg(0.8), y: y, t: t, at: 1.75, in: ctx)
            })
        }
        // Last, the film's own sky, waiting for you to press play.
        // (The picture you send of it says what it is: "Your month".)
        let line = Self.story(input, script: script)
        let cream = C(0xFFF4E6)
        out.append(Slide(name: "play", length: 1.0, light: true, spoken: "\(line). See your month: press play.", back: { ctx in
            ground(3, palette(3), in: ctx)
        }) { ctx, t in
            for j in 0..<150 {
                let q = CGPoint(x: filmHash(j, seed + 1) * W, y: filmHash(j, seed + 2) * H), r = 1.3 + 2.4 * pow(filmHash(j, seed + 3), 3)
                ctx.setFillColor(cream.cg((0.2 + 0.45 * filmHash(j, seed + 4)) * filmSmooth((t - filmHash(j, 5) * 0.6) / 0.4)))
                ctx.fillEllipse(in: CGRect(x: q.x - r, y: q.y - r, width: r * 2, height: r * 2))
            }
            // (The play button itself is the app's, over the middle of this.)
            let y = bottom + 120
            say(line, 40, 0.25, cream.cg(0.8), y: y, t: t, at: 0.3, in: ctx)
            say("month", 170, 0.8, cream.cg(), x: 66, y: y + 110, t: t, at: 0.15, in: ctx)
            say("See your", 170, 0.8, cream.cg(), x: 66, y: y + 280, t: t, at: 0.05, in: ctx)
        })
        return out
    }

    /// The space over the words, under the Pinto Notes mark, where each slide draws its picture.
    var band: (Double, Double) { (bottom + 600, H - top - 110) }

    /// The names of what you brought in as a wall of slips: as large as lets them all in, no larger
    /// than reads well, centred in rows `width` wide and no more of them than fit `height`. Past the
    /// smallest size, the last slip counts the rest ("+ 189 more", of `count`).
    static func wall(_ names: [String], count: Int, width: Double, height: Double) -> (size: Double, rows: [[(String, Double)]]) {
        func flow(_ size: Double) -> (rows: [[(String, Double)]], placed: Int) {
            let hgt = size * 1.75, gap = size * 0.34
            let most = max(1, Int((height + gap) / (hgt + gap)))
            var rows: [[(String, Double)]] = [[]], used = 0.0, placed = 0
            for n in names {
                let w = min(width, FilmKit.width(n, size, 0.55) + size * 1.1)
                if used + w > width, !rows[rows.count - 1].isEmpty {
                    if rows.count == most { break }
                    rows.append([]); used = 0
                }
                rows[rows.count - 1].append((n, w)); used += w + gap; placed += 1
            }
            return (rows, placed)
        }
        var size = 72.0
        while size > 34, flow(size).placed < names.count { size -= 2 }
        var (rows, placed) = flow(size)
        if placed < count, var last = rows.popLast() {
            let gap = size * 0.34
            func more() -> (String, Double) {
                let m = "+ \(count - placed) more"
                return (m, FilmKit.width(m, size, 0.55) + size * 1.1)
            }
            while !last.isEmpty, last.map(\.1).reduce(0, +) + Double(last.count) * gap + more().1 > width {
                last.removeLast(); placed -= 1
            }
            last.append(more()); rows.append(last)
        }
        return (size, rows)
    }

    /// The first slide.
    private func start() -> Slide {
        switch startLook {
        case 1, 2, 3: return welcome(startLook)
        default: return wall()
        }
    }

    /// The first slide as a welcome: you, by name, and your month with Pinto Notes. One thing on it.
    private func welcome(_ look: Int) -> Slide {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMMM d"
        let day = f.string(from: script.start)
        let count = input.notes.filter { $0.imported == true }.count
        let began = count > 0 ? "It began on \(day) with \(count) notes." : "It began on \(day) with your first note."
        let period = script.stats.period
        // (With no name: "Hello", not "Hi,".)
        let hi1 = you.map { "Hi \($0)" } ?? "Hello"
        let (lo, hi) = band
        let spoken: String
        switch look {
        case 1: spoken = "\(hi1), welcome to your \(period) with Pinto Notes. \(began)"
        case 2: spoken = "\(hi1). Your \(period). \(began)"
        default: spoken = "Welcome\(you.map { ", \($0)" } ?? ""). Your \(period) with Pinto Notes. \(began)"
        }
        return Slide(name: "start", length: 1.6, light: true, spoken: spoken, back: { ctx in ground(0, palette(0), in: ctx) }) { ctx, t in
            let p = palette(0), ink = p.ink.cg(), y0 = bottom + 120, mid = (lo + hi) / 2
            switch look {
            case 1:
                // Words only, in the middle of the page.
                let c = (hi + y0 + 80) / 2
                say("\(hi1),", 200, 0.8, ink, x: 66, y: c + 300, t: t, at: 0, in: ctx)
                say("welcome to your", 110, 0.75, ink, x: 66, y: c + 60, t: t, at: 0.3, in: ctx)
                say("\(period) with", 110, 0.75, ink, x: 66, y: c - 80, t: t, at: 0.4, in: ctx)
                say("Pinto Notes.", 110, 0.75, ink, x: 66, y: c - 220, t: t, at: 0.5, in: ctx)
                say(began, 44, 0.3, p.ink.cg(0.85), y: c - 340, t: t, at: 0.9, in: ctx)
            case 2:
                // Your notebook: one sheet of paper with your name on it.
                let c = CGPoint(x: W / 2, y: mid - 40), e = filmBackOut((t - 0.05) / 0.5)
                ctx.saveGState(); ctx.translateBy(x: c.x, y: c.y + (1 - filmSmooth((t - 0.05) / 0.42)) * 900); ctx.rotate(by: -0.05 * e)
                card(you.map { "\($0)\u{2019}s notebook" } ?? "Your notebook", w: 640, h: 768, key: 0, p, in: ctx)
                ctx.restoreGState()
                say(hi1, 110, 0.75, ink, x: 66, y: y0 + 280, t: t, at: 0.35, in: ctx)
                say("Your " + period, 170, 0.8, ink, x: 66, y: y0 + 110, t: t, at: 0.45, in: ctx)
                say(began, 44, 0.3, p.ink.cg(0.85), y: y0, t: t, at: 0.9, in: ctx)
            default:
                // The Pinto leaf, in paper.
                let c = CGPoint(x: W / 2, y: mid - 20), e = filmBackOut(t / 0.55)
                sprite("leaf", side: 760, at: c, scale: 0.8 + 0.2 * e, alpha: filmSmooth(t / 0.3), in: ctx) { lc in
                    lc.rotate(by: -0.7)
                    let L = 680.0, R = 250.0
                    let leaf = CGMutablePath()
                    leaf.move(to: CGPoint(x: 0, y: L / 2))
                    leaf.addQuadCurve(to: CGPoint(x: 0, y: -L / 2), control: CGPoint(x: R * 1.9, y: 40))
                    leaf.addQuadCurve(to: CGPoint(x: 0, y: L / 2), control: CGPoint(x: -R * 1.9, y: -40))
                    lc.saveGState()
                    lc.setShadow(offset: CGSize(width: 0, height: -10), blur: 26, color: CGColor(gray: 0, alpha: 0.36))
                    lc.addPath(leaf); lc.setFillColor(p.you.cg()); lc.fillPath()
                    lc.restoreGState()
                    // Its vein and stem.
                    lc.setLineCap(.round); lc.setLineWidth(14); lc.setStrokeColor(p.bg.cg(0.55))
                    lc.move(to: CGPoint(x: 0, y: L / 2 - 90)); lc.addLine(to: CGPoint(x: 0, y: -L / 2 - 50)); lc.strokePath()
                    lc.setLineWidth(9)
                    for k in 0..<3 {
                        let y = L / 2 - 200 - Double(k) * 130
                        lc.move(to: CGPoint(x: 0, y: y - 60)); lc.addLine(to: CGPoint(x: 130 - Double(k) * 20, y: y + 20)); lc.strokePath()
                        lc.move(to: CGPoint(x: 0, y: y - 60)); lc.addLine(to: CGPoint(x: -130 + Double(k) * 20, y: y + 20)); lc.strokePath()
                    }
                }
                say("Welcome\(you.map { ", \($0)" } ?? "")", 110, 0.75, ink, x: 66, y: y0 + 280, t: t, at: 0.3, in: ctx)
                say("Your " + period, 170, 0.8, ink, x: 66, y: y0 + 110, t: t, at: 0.4, in: ctx)
                say(began, 44, 0.3, p.ink.cg(0.85), y: y0, t: t, at: 0.9, in: ctx)
            }
        }
    }

    /// Where you started: the notes you brought in, by name, landing as they're counted; or your
    /// first note on its own, a sheet of paper. What the rest of it is measured from.
    private func wall() -> Slide {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMMM d"
        let day = f.string(from: script.start)
        let brought = input.notes.filter { $0.imported == true }.sorted { $0.created < $1.created }
        let first = input.notes.min { $0.created < $1.created }
        let count = brought.count
        let lines = count > 0
            ? ("You brought in", "\(count) notes", "on \(day). Here\u{2019}s what you did with them.")
            : ("It started with", "one note", "on \(day). Here\u{2019}s what came of it.")
        let (lo, hi) = band
        let names = brought.compactMap { title($0) }
        let wall = count > 0 && !names.isEmpty ? Self.wall(names, count: count, width: W - 132, height: hi - lo - 60) : nil
        let spoken = "\(lines.0) \(lines.1) \(lines.2)"
        return Slide(name: "start", length: 2.0, light: true, spoken: spoken, back: { ctx in ground(0, palette(0), in: ctx) }) { ctx, t in
            let p = palette(0)
            let y0 = bottom + 120
            say(lines.0, 110, 0.75, p.ink.cg(), x: 66, y: y0 + 280, t: t, at: 0, in: ctx)
            say("O" + lines.2.dropFirst(), 44, 0.3, p.ink.cg(0.85), y: y0, t: t, at: 1.1, in: ctx)
            guard let wall else {
                // One note, or none that may be named: the note itself, a sheet of paper.
                let c = CGPoint(x: W / 2, y: (lo + hi) / 2), e = filmBackOut((t - 0.1) / 0.5)
                ctx.saveGState(); ctx.translateBy(x: c.x, y: c.y + (1 - filmSmooth((t - 0.1) / 0.42)) * 900); ctx.rotate(by: -0.05 * e)
                card(count > 0 ? nil : first.flatMap(title), w: 640, h: 768, key: 0, p, in: ctx)
                ctx.restoreGState()
                say(lines.1, 170, 0.8, p.ink.cg(), x: 66, y: y0 + 110, t: t, at: 0.1, in: ctx)
                return
            }
            // Each slip drops in on its own, one after another, as the count climbs.
            let size = wall.size, hgt = size * 1.75, gap = size * 0.34
            let all = Double(wall.rows.reduce(0) { $0 + $1.count })
            var y = (lo + hi) / 2 + (Double(wall.rows.count) * (hgt + gap) - gap) / 2 - hgt, k = 0
            for row in wall.rows {
                var x = W / 2 - (row.map(\.1).reduce(0, +) + Double(row.count - 1) * gap) / 2
                for (name, w) in row {
                    let e = filmSmooth((t - 0.1 - Double(k) / max(1, all)) / 0.3)
                    if e > 0 {
                        let dark = name.hasPrefix("+ ") || filmHash(k, seed + 31) < 0.18
                        ctx.saveGState(); ctx.setAlpha(e)
                        ctx.translateBy(x: x + w / 2, y: y + hgt / 2 + (1 - e) * 60)
                        ctx.rotate(by: (filmHash(k, seed + 32) - 0.5) * 0.09)
                        slip(name, size, center: .zero, dark ? p.ink : p.you, dark ? p.you : p.ink, in: ctx)
                        ctx.restoreGState()
                    }
                    x += w + gap; k += 1
                }
                y -= hgt + gap
            }
            let shown = Int((Double(count) * filmSmooth((t - 0.1) / 1.0)).rounded())
            say("\(shown) note\(shown == 1 ? "" : "s")", 170, 0.8, p.ink.cg(), x: 66, y: y0 + 110, t: t, at: 0.1, in: ctx)
        }
    }

    /// A note as a sheet of paper: its name, if it has one that may be shown, and lines of writing.
    private func card(_ name: String?, w: Double, h: Double, key: Int, _ p: Palette, in ctx: CGContext) {
        let r = CGRect(x: -w / 2, y: -h / 2, width: w, height: h)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -8), blur: 22, color: CGColor(gray: 0, alpha: 0.32))
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: 26, cornerHeight: 26, transform: nil))
        ctx.setFillColor(p.you.cg()); ctx.fillPath()
        ctx.restoreGState()
        var y = h / 2 - 96
        if let name {
            let size = min(54, 54 * (w - 110) / max(1, FilmKit.width(name, 54, 0.7)))
            FilmKit.text(name, size, 0.7, p.paperInk.cg(), at: CGPoint(x: -w / 2 + 54, y: y), in: ctx)
            y -= 90
        }
        for k in 0..<7 {
            let len = (w - 108) * (k == 6 ? 0.45 : 0.62 + 0.38 * filmHash(key * 13 + k, 71))
            ctx.addPath(CGPath(roundedRect: CGRect(x: -w / 2 + 54, y: y, width: len, height: 16), cornerWidth: 8, cornerHeight: 8, transform: nil))
            ctx.setFillColor(p.paperInk.cg(0.13)); ctx.fillPath()
            y -= 52
        }
    }

    /// Where your month began and where it is now, in your own terms: what you brought, or your first note.
    static func story(_ input: FilmInput, script: FilmScript) -> String {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.dateFormat = "MMM d"
        let brought = input.notes.filter { $0.imported == true }.count, now = script.stats.notes
        return brought > 0 ? "From \(brought) notes brought in on \(f.string(from: script.start)) to \(now) today"
            : "From your first note on \(f.string(from: script.start)) to \(now) today"
    }

    /// The card that offers it: what you set out with, and what it became.
    static func cardLine(_ input: FilmInput, script: FilmScript) -> String {
        // (The date on one line: "October" at a line's end and "8." on the next read badly.)
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.dateFormat = "MMMM\u{00A0}d"
        let brought = input.notes.filter { $0.imported == true }.count
        return brought > 0 ? "You brought \(brought) notes in on \(f.string(from: script.start)). Here\u{2019}s what you did with them."
            : "You wrote your first note on \(f.string(from: script.start)). Here\u{2019}s what came of it."
    }

    private func short(_ d: Date) -> String {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMM d"
        return f.string(from: d)
    }

    /// Slide `k`, `t` seconds after it appeared (its end when nil), `pixels` wide.
    /// The four slides' skies, by their place in `GalaxyScene.skies`, for a film set in sky `f`.
    static func skyPath(_ f: Int) -> [Int] {
        let between = [[1, 2], [4, 3], [1, 4], [2, 1], [1, 2]][f]
        return [f, between[0], between[1], f]
    }

    /// How long one slide's sky takes to become the next one's.
    static let shift = 0.6

    /// Slide `k` at `t` seconds since it appeared; `from` is the slide before it on screen, whose sky
    /// it eases out of.
    func image(_ k: Int, at t: Double? = nil, pixels: Int, slides all: [Slide]? = nil, from: Int? = nil) -> CGImage? {
        let all = all ?? slides()
        let height = Int((Double(pixels) * H / W).rounded()), scale = Double(pixels) / W
        guard all.indices.contains(k), let ctx = FilmRenderer.context(width: pixels, height: height) else { return nil }
        func still(_ k: Int) -> CGImage? {
            guard let back = all[k].back else { return nil }
            return backs.image("\(k) \(all[k].name) \(pixels) \(H) \(top) \(bottom)") {
                guard let b = FilmRenderer.context(width: pixels, height: height) else { return nil }
                b.scaleBy(x: scale, y: scale); back(b)
                return b.makeImage()
            }
        }
        let box = CGRect(x: 0, y: 0, width: pixels, height: height)
        if let s = still(k) { ctx.draw(s, in: box) }
        if let t, let from, from != k, all.indices.contains(from), t < Self.shift, let s = still(from) {
            ctx.saveGState(); ctx.setAlpha(1 - filmSmooth(t / Self.shift)); ctx.draw(s, in: box); ctx.restoreGState()
        }
        ctx.scaleBy(x: scale, y: scale)
        all[k].draw(ctx, t ?? all[k].length + 1)
        return FilmRenderer.plain(ctx.makeImage())
    }

    /// Made-up names for the demo's notes: the most written in get names first, so none repeats.
    static func demoNames(_ input: FilmInput) -> [UUID: String] {
        let lists: [String: [String]] = [
            "Work": ["Launch plan", "Standup notes", "Q4 goals", "Hiring plan", "Pricing", "Offsite", "Roadmap", "1:1 notes", "Customer calls", "Team wiki", "Sprint review", "Interview notes", "OKRs", "Board update", "Competitors"],
            "Ideas": ["App ideas", "Side project", "Gift ideas", "Blog drafts", "Startup ideas", "Talk ideas", "Names", "Shower thoughts", "Newsletter", "Game idea"],
            "Home": ["Flat renovation", "Groceries", "Meal plan", "Budget", "Holiday plans", "Wedding", "Garden", "Car", "Packing list", "Recipes"],
            "Reading": ["Reading list", "Notes on Deep Work", "Podcast notes", "Quotes", "Atomic Habits", "Articles to read", "Film list"],
            "Habits": ["Evening tracker"], "Daily": ["Daily note"],
        ]
        let pool = ["Prompt library", "Customer personas", "API notes", "Pricing research", "Onboarding ideas", "Writing style", "Brand voice", "Product principles", "Competitor teardown", "Interview questions", "Glossary", "Decision log", "Meeting template", "Investor list", "Feature requests", "Bug triage", "Release checklist", "User quotes", "Market sizing", "SEO keywords", "Content calendar", "Design system", "Research log", "Reading highlights", "Course notes", "Project brief", "Lessons learned", "Hiring rubric", "Sales script"]
        var seen: [String: Int] = [:], out: [UUID: String] = [:], spare = 0
        for n in input.notes.sorted(by: { $0.edits.count == $1.edits.count ? $0.created < $1.created : $0.edits.count > $1.edits.count }) {
            let k = seen[n.folder, default: 0]; seen[n.folder] = k + 1
            let l = lists[n.folder] ?? []
            if k < l.count { out[n.id] = l[k]; continue }
            out[n.id] = spare < pool.count ? pool[spare] : "Note \(spare + 1)"
            spare += 1
        }
        return out
    }

    /// The lab: each slide as it ends, and a strip of it coming in.
    func write(to folder: URL) throws {
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let all = slides()
        for (k, slide) in all.enumerated() {
            for (label, t) in [("end", slide.length + 1), ("a", 0.3), ("b", 0.7), ("c", 1.1), ("d", 1.5)] {
                guard let image = image(k, at: t, pixels: 540, slides: all),
                      let dest = CGImageDestinationCreateWithURL(folder.appendingPathComponent("\(k + 1)-\(slide.name)-\(label).png") as CFURL, "public.png" as CFString, 1, nil) else { continue }
                CGImageDestinationAddImage(dest, image, nil)
                CGImageDestinationFinalize(dest)
            }
        }
    }
}
