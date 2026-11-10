import CoreGraphics
import Foundation
import ImageIO

// The month before its film, opened from a card (NotebookFilmStore.offered): two slides, each with one
// strong thing on it in its own bold paper colour, then the film's own night sky with a play button.
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

    /// A slide: how long it takes to come in, and its drawing at a time since it appeared.
    struct Slide: @unchecked Sendable {
        let name: String
        let length: Double
        /// Its words are light (on a dark colour), so what's drawn over it is too.
        var light = false
        /// What it says, for VoiceOver.
        var spoken = ""
        let draw: (CGContext, Double) -> Void
    }

    init(input: FilmInput, script: FilmScript, mark: CGImage?, title: (@Sendable (FilmNote) -> String?)? = nil) {
        self.input = input
        self.script = script
        self.mark = mark
        let demo = FilmSlides.demoNames(input)
        self.title = title ?? { demo[$0.id] }
    }

    /// Sent as a picture: tall like a story, which a chat shows well too.
    var sent: FilmSlides {
        var s = self
        s.H = 1920; s.top = 90; s.bottom = 90
        return s
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

    /// What your hours make you: "I'm a night" over "owl".
    static func kind(startingAt start: Int) -> (String, String) {
        let mid = (start + 1) % 24
        switch mid {
        case 5..<9: return ("I'm an early", "bird")
        case 9..<12: return ("I'm a morning", "writer")
        case 12..<17: return ("I'm an afternoon", "writer")
        case 17..<21: return ("I'm an evening", "writer")
        default: return ("I'm a night", "owl")
        }
    }

    static func hourName(_ h: Int) -> String {
        let h = (h % 24 + 24) % 24
        return h == 0 ? "midnight" : h == 12 ? "noon" : h < 12 ? "\(h) am" : "\(h - 12) pm"
    }

    // MARK: Paper

    private struct Palette { var bg: C; var tones: [C]; var ink: C; var you: C; var ai: C }

    private func palette(_ k: Int) -> Palette {
        switch k {
        case 0: return Palette(bg: C(0xFFAE34), tones: [C(0xFFBD55), C(0xFFCD7C), C(0xFFDEA6), C(0xFFEFD2)], ink: C(0x1E1B4B), you: C(0xFFF6E8), ai: C(0x2F6FD6))
        case 1: return Palette(bg: C(0xFFF0DC), tones: [C(0xF8E0BE), C(0xF1CE9E), C(0xE9BC80), C(0xE0A964)], ink: C(0x1E1B4B), you: C(0xF0901A), ai: C(0x2F6FD6))
        default: return Palette(bg: C(0x2A4BCB), tones: [C(0x3659D6), C(0x4A6EE0), C(0x6787E8), C(0x98B0F1)], ink: C(0xFFF6E8), you: C(0xFFC45A), ai: C(0xBFE0FF))
        }
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
    private func star(_ p: CGPoint, _ r: Double, points: Int = 4, inner: Double = 0.4, turn: Double = 0, _ c: C, shadow: Double = 0.4, in ctx: CGContext) {
        guard r > 0.5 else { return }
        func shape(_ dy: Double) {
            for k in 0..<(points * 2) {
                let a = turn + Double(k) * .pi / Double(points), d = k % 2 == 0 ? r : r * inner
                let q = CGPoint(x: p.x + cos(a) * d, y: p.y + sin(a) * d + dy)
                if k == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
            }
            ctx.closePath()
        }
        if shadow > 0 { shape(-max(2, r * 0.07)); ctx.setFillColor(CGColor(gray: 0, alpha: shadow)); ctx.fillPath() }
        shape(0); ctx.setFillColor(c.cg()); ctx.fillPath()
    }
    private func bigStar(_ p: CGPoint, _ r: Double, turn: Double = 0, _ c: C, behind: C, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -10), blur: 24, color: CGColor(gray: 0, alpha: 0.4))
        star(p, r * 1.45, points: 12, inner: 0.64, turn: 0.2 - turn * 0.5, c.mix(behind, 0.55), shadow: 0, in: ctx)
        ctx.restoreGState()
        star(p, r * 1.22, points: 8, inner: 0.56, turn: 0.5 + turn * 0.7, c.mix(behind, 0.3), in: ctx)
        star(p, r, turn: 0.1 + turn, c, in: ctx)
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
    /// Draws scaled (and turned) about a point, faded by `alpha`.
    private func around(_ p: CGPoint, scale: Double, alpha: Double = 1, in ctx: CGContext, _ draw: () -> Void) {
        guard scale > 0.001, alpha > 0.001 else { return }
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.translateBy(x: p.x, y: p.y); ctx.scaleBy(x: scale, y: scale); ctx.translateBy(x: -p.x, y: -p.y)
        draw()
        ctx.restoreGState()
    }

    private func ground(_ k: Int, _ p: Palette, in ctx: CGContext) {
        ctx.setFillColor(p.bg.cg()); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        paper(blob(CGPoint(x: 260, y: H * 0.36), 700, 620, key: seed * 7 + k), p.bg.mix(p.tones[0], 0.6), lift: 1.8, in: ctx)
        paper(blob(CGPoint(x: 860, y: H * 0.7), 560, 520, key: seed * 9 + k), p.bg.mix(p.tones[0], 0.95), lift: 1.5, in: ctx)
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        if let mark { ctx.draw(mark, in: CGRect(x: 64, y: H - top - 70, width: 52, height: 52)) }
        FilmKit.text("Pinto Notes", 34, 0.45, p.ink.cg(0.92), at: CGPoint(x: 130, y: H - top - 56), in: ctx)
    }

    // MARK: The slides

    func slides() -> [Slide] {
        var out: [Slide] = []
        let months = script.stats.months
        // Your top notes: the brightest stars, by name.
        let top5 = ranked
        if let first = top5.first, first.note.edits.count >= 6 {
            let rows = top5.count
            let spoken = "My top notes: " + top5.enumerated().map { "\($0.offset + 1), \($0.element.name), \($0.element.note.edits.count) times" }.joined(separator: "; ")
            out.append(Slide(name: "top-notes", length: 1.0 + 0.12 * Double(max(0, rows - 2)) + 0.45, spoken: spoken) { ctx, t in
                let p = palette(1)
                ground(1, p, in: ctx)
                say("My top notes", 112, 0.8, p.ink.cg(), x: 66, y: H - top - 230, t: t, at: 0, in: ctx)
                say("the ones I kept coming back to", 40, 0.2, p.ink.cg(0.72), y: H - top - 300, t: t, at: 0.12, in: ctx)
                let c = CGPoint(x: W / 2, y: H * 0.52)
                let n = first.note
                let byAI = Double(n.edits.filter { $0.ai != nil }.count) / Double(n.edits.count)
                let e = filmBackOut((t - 0.22) / 0.7)
                around(c, scale: e, in: ctx) { bigStar(c, 190, turn: (1 - e) * 1.2, byAI > 0.5 ? p.ai : p.you, behind: p.bg, in: ctx) }
                around(CGPoint(x: c.x, y: c.y + 2), scale: filmBackOut((t - 0.55) / 0.4), in: ctx) {
                    FilmKit.text("1", 150, 0.85, p.bg.cg(), at: CGPoint(x: c.x, y: c.y - 52), align: 0.5, in: ctx)
                }
                let se = filmSmooth((t - 0.62) / 0.35)
                if se > 0 {
                    ctx.saveGState(); ctx.setAlpha(se)
                    slip(first.name, 64, center: CGPoint(x: W / 2, y: c.y - 340 - (1 - se) * 40), p.ink, p.bg, in: ctx)
                    ctx.restoreGState()
                }
                say("\(n.edits.count) times \(months == 1 ? "this month" : "in \(months) months")", 42, 0.3, p.ink.cg(0.8), x: W / 2, y: c.y - 460, align: 0.5, t: t, at: 0.75, in: ctx)
                let most = Double(n.edits.count)
                for (i, row) in top5.dropFirst().enumerated() {
                    let y = bottom + 360 - Double(i) * 96, at = 0.95 + 0.12 * Double(i)
                    let re = filmSmooth((t - at) / 0.4)
                    guard re > 0 else { continue }
                    ctx.saveGState(); ctx.setAlpha(re); ctx.translateBy(x: -(1 - re) * 60, y: 0)
                    FilmKit.text("\(i + 2)", 54, 0.8, p.ink.cg(0.6), at: CGPoint(x: 72, y: y), in: ctx)
                    star(CGPoint(x: 172, y: y + 19), 14 + 18 * Double(row.note.edits.count) / most, turn: filmHash(i, 9), p.you, in: ctx)
                    let fit = min(54, 54 * (W - 220 - 170) / max(1, FilmKit.width(row.name, 54, 0.55)))
                    FilmKit.text(row.name, fit, 0.55, p.ink.cg(), at: CGPoint(x: 220, y: y), in: ctx)
                    FilmKit.text("\(row.note.edits.count)", 46, 0.3, p.ink.cg(0.65), at: CGPoint(x: W - 72, y: y), align: 1, in: ctx)
                    ctx.restoreGState()
                }
            })
        }
        // When you write: the day as a paper dial, swept hour by hour, and what that makes you.
        let hours = byHour
        if hours.reduce(0, +) >= 20 {
            let start = bestHours, kind = Self.kind(startingAt: start)
            let dark = !(5..<17).contains((start + 1) % 24)
            var times: [(Double, Bool)] = []
            for n in input.notes { for e in n.edits.dropFirst(n.imported == true ? 1 : 0) where e.ai == nil {
                let comp = cal.dateComponents([.hour, .minute], from: e.at)
                times.append((Double(comp.hour ?? 0) + Double(comp.minute ?? 0) / 60, false))
            } }
            let step = max(1, times.count / 360)
            let shown = stride(from: 0, to: times.count, by: step).map { times[$0].0 }
            out.append(Slide(name: "when", length: 2.25, light: true, spoken: "\(kind.0) \(kind.1). Most of it between \(Self.hourName(start)) and \(Self.hourName(start + 3))") { ctx, t in
                let p = palette(2)
                ground(2, p, in: ctx)
                let c = CGPoint(x: W / 2, y: H * 0.6), R = 400.0
                func angle(_ h: Double) -> Double { .pi / 2 - h / 24 * 2 * .pi }
                around(c, scale: 0.7 + 0.3 * filmBackOut(t / 0.5), alpha: filmSmooth(t / 0.2), in: ctx) { circle(c, R, p.tones[1], lift: 1.6, in: ctx) }
                let labelsIn = filmSmooth((t - 0.2) / 0.3)
                if labelsIn > 0 {
                    ctx.saveGState(); ctx.setAlpha(labelsIn)
                    for (h, label) in [(0, "midnight"), (6, "6 am"), (12, "noon"), (18, "6 pm")] {
                        let a = angle(Double(h)), q = CGPoint(x: c.x + cos(a) * (R + 58), y: c.y + sin(a) * (R + 58) - 14)
                        FilmKit.text(label, 36, 0.4, p.ink.cg(0.75), at: q, align: h == 6 ? 0.25 : h == 18 ? 0.75 : 0.5, in: ctx)
                    }
                    ctx.restoreGState()
                }
                // The hours you write most in: a wedge of paper, once the sweep is round.
                let we = filmSmooth((t - 1.4) / 0.3)
                if we > 0 {
                    ctx.saveGState(); ctx.setAlpha(we)
                    ctx.setShadow(offset: CGSize(width: 0, height: -5), blur: 12, color: CGColor(gray: 0, alpha: 0.35))
                    ctx.move(to: c)
                    ctx.addArc(center: c, radius: R - 24, startAngle: angle(Double(start)), endAngle: angle(Double(start) + 3), clockwise: true)
                    ctx.closePath(); ctx.setFillColor(p.you.mix(p.tones[1], 0.25).cg()); ctx.fillPath()
                    ctx.restoreGState()
                }
                // Every time you wrote, a star at its hour, appearing as the hand passes it.
                let sweep = 24 * min(1, max(0, (t - 0.3) / 1.1))
                for (j, h) in shown.enumerated() where h < sweep {
                    let d = 150 + filmHash(j, 51) * (R - 200), a = angle(h)
                    star(CGPoint(x: c.x + cos(a) * d, y: c.y + sin(a) * d), (9 + 4 * filmHash(j, 52)) * filmBackOut((sweep - h) / 1.6), turn: filmHash(j, 53), p.ink, shadow: 0.3, in: ctx)
                }
                if sweep > 0, sweep < 24 {
                    let a = angle(sweep)
                    ctx.setStrokeColor(p.ink.cg(0.7)); ctx.setLineWidth(6); ctx.setLineCap(.round)
                    ctx.move(to: c); ctx.addLine(to: CGPoint(x: c.x + cos(a) * (R - 30), y: c.y + sin(a) * (R - 30))); ctx.strokePath()
                }
                // The sun or the moon in the middle.
                around(c, scale: filmBackOut((t - 1.45) / 0.45), in: ctx) {
                    if dark {
                        circle(c, 110, C(0xFFF4E6), lift: 1, in: ctx)
                        ctx.setFillColor(p.tones[1].cg()); ctx.fillEllipse(in: CGRect(x: c.x - 58, y: c.y - 80, width: 220, height: 220))
                    } else {
                        for k in 0..<12 {
                            let a = Double(k) * .pi / 6, w = 0.13
                            ctx.move(to: CGPoint(x: c.x + cos(a - w) * 120, y: c.y + sin(a - w) * 120))
                            ctx.addLine(to: CGPoint(x: c.x + cos(a) * 175, y: c.y + sin(a) * 175))
                            ctx.addLine(to: CGPoint(x: c.x + cos(a + w) * 120, y: c.y + sin(a + w) * 120))
                            ctx.closePath(); ctx.setFillColor(p.you.cg()); ctx.fillPath()
                        }
                        circle(c, 110, p.you, lift: 1, in: ctx)
                    }
                }
                let y = bottom + 120
                say(kind.0, 110, 0.75, p.ink.cg(), x: 66, y: y + 280, t: t, at: 1.45, in: ctx)
                say(kind.1, 170, 0.8, p.ink.cg(), x: 66, y: y + 110, t: t, at: 1.58, in: ctx)
                say("Most of it between \(Self.hourName(start)) and \(Self.hourName(start + 3))", 40, 0.25, p.ink.cg(0.8), y: y, t: t, at: 1.75, in: ctx)
            })
        }
        // Last, the film's own sky, waiting for you to press play.
        let line = Self.story(input, script: script)
        out.append(Slide(name: "play", length: 1.0, light: true, spoken: "\(line). See your month: press play.") { ctx, t in
            let sky = GalaxyScene.skies[(seed / 3 + seed) % GalaxyScene.skies.count]
            let bg = C(sky.0), tones = sky.1.map { C($0) }, cream = C(0xFFF4E6)
            ctx.setFillColor(bg.cg()); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
            paper(blob(CGPoint(x: 330, y: H * 0.42), 660, 560, key: seed * 7 + 1), bg.mix(tones[0], 0.55), lift: 1.6, in: ctx)
            paper(blob(CGPoint(x: 800, y: H * 0.66), 520, 420, key: seed * 7 + 2), bg.mix(tones[0], 0.9), lift: 1.4, in: ctx)
            ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
            for j in 0..<150 {
                let q = CGPoint(x: filmHash(j, seed + 1) * W, y: filmHash(j, seed + 2) * H), r = 1.3 + 2.4 * pow(filmHash(j, seed + 3), 3)
                ctx.setFillColor(cream.cg((0.2 + 0.45 * filmHash(j, seed + 4)) * filmSmooth((t - filmHash(j, 5) * 0.6) / 0.4)))
                ctx.fillEllipse(in: CGRect(x: q.x - r, y: q.y - r, width: r * 2, height: r * 2))
            }
            // (The play button itself is the app's, over the middle of this.)
            if let mark { ctx.draw(mark, in: CGRect(x: 64, y: H - top - 70, width: 52, height: 52)) }
            FilmKit.text("Pinto Notes", 34, 0.45, cream.cg(0.92), at: CGPoint(x: 130, y: H - top - 56), in: ctx)
            let y = bottom + 120
            say(line, 40, 0.25, cream.cg(0.8), y: y, t: t, at: 0.3, in: ctx)
            say("month", 170, 0.8, cream.cg(), x: 66, y: y + 110, t: t, at: 0.15, in: ctx)
            say("See your", 170, 0.8, cream.cg(), x: 66, y: y + 280, t: t, at: 0.05, in: ctx)
        })
        return out
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
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.dateFormat = "MMMM d"
        let brought = input.notes.filter { $0.imported == true }.count
        return brought > 0 ? "You brought \(brought) notes in on \(f.string(from: script.start)). Here\u{2019}s what you did with them."
            : "You wrote your first note on \(f.string(from: script.start)). Here\u{2019}s what came of it."
    }

    private func short(_ d: Date) -> String {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMM d"
        return f.string(from: d)
    }

    /// Slide `k`, `t` seconds after it appeared (its end when nil), `pixels` wide.
    func image(_ k: Int, at t: Double? = nil, pixels: Int, slides all: [Slide]? = nil) -> CGImage? {
        let all = all ?? slides()
        guard all.indices.contains(k), let ctx = FilmRenderer.context(width: pixels, height: Int((Double(pixels) * H / W).rounded())) else { return nil }
        ctx.scaleBy(x: Double(pixels) / W, y: Double(pixels) / W)
        all[k].draw(ctx, t ?? all[k].length + 1)
        return ctx.makeImage()
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
