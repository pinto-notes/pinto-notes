import CoreGraphics
import Foundation

// Lab: three more ways to draw the month, in Pinto's cut-paper style (the site's cream page or
// its leaf brown, paper shapes with a little shade under them). They plug into the app's own
// renderer as scenes, so the words, the opening and the end card are the film's.

private typealias PR = FilmRenderer.RGB
private func ease(_ x: Double) -> Double { let c = min(1, max(0, x)); return 1 - pow(1 - c, 3) }

class PaperScene: FilmScene {
    let script: FilmScript
    let names: Bool
    let dark: Bool
    let W = 1080.0
    fileprivate let ground: PR, ink: PR, you: PR, ai: PR, card: PR, soft: PR
    fileprivate let papers: [PR]
    /// Where each day begins in film time, and one more for the end.
    var dayStart: [Double] = []
    var days: Int { dayStart.count - 1 }
    var growth: Double { script.growth }
    let aiFrom: [Double]
    let busy: Double

    init(script: FilmScript, names: Bool, calendar: Calendar, dark: Bool) {
        self.script = script
        self.names = names
        self.dark = dark
        ground = dark ? PR(0x2E180A) : PR(0xFFF4E6)
        ink = dark ? PR(0xFBEEDD) : PR(0x2A1D10)
        you = dark ? PR(0xF5A53A) : PR(0xE8850F)
        ai = dark ? PR(0x86B8F7) : PR(0x2F6FCB)
        card = dark ? PR(0x4A2C16) : PR(0xFFFAF3)
        soft = dark ? PR(0x40240F) : PR(0xF7E5CC)
        papers = dark ? [PR(0x5A3A1C), PR(0x5C3326), PR(0x4B3340), PR(0x3D4032), PR(0x4F3A20), PR(0x46303A)]
            : [PR(0xF2DCA6), PR(0xF7CDAA), PR(0xF0C3B8), PR(0xD9CBEA), PR(0xC3D6B1), PR(0xCFE0D8)]
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        let counts = script.nodes.map(\.edits.count).sorted()
        busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        for k in 0..<max(1, script.stats.days) {
            let d = calendar.date(byAdding: .day, value: k, to: script.start)!
            dayStart.append(max(0, script.span(ofDay: d)?.start ?? script.growth))
        }
        dayStart.append(script.growth)
    }

    func day(at t: Double) -> Int { max(0, (dayStart.lastIndex { $0 <= t } ?? 0)).clamped(0, days - 1) }

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    var captions: [String]? { nil }
    var wordsDelay: Double { 0 }
    var rewinds: Bool { false }
    var appStart: Double { 0 }
    func subtitle(_ stats: FilmStats) -> String? { nil }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}
    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) { drawBehind(t, canvas: canvas, in: ctx) }
    func topInk(_ t: Double) -> FilmRenderer.RGB { ink }
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool { false }

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        ctx.setFillColor(ground.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: canvas.height))
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        let bottom = canvas.bottom + 340, top = canvas.height - canvas.top - 130
        draw(t, mid: CGPoint(x: W / 2, y: (bottom + top) / 2), half: CGSize(width: (W - 140) / 2, height: (top - bottom) / 2), in: ctx)
    }

    func draw(_ t: Double, mid: CGPoint, half: CGSize, in ctx: CGContext) {}

    /// Paper lying on paper: `body` is drawn with a soft shade under it.
    fileprivate func shaded(_ ctx: CGContext, lift: Double = 1, _ body: () -> Void) {
        let k = abs(ctx.ctm.a)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -4 * lift * k), blur: 11 * lift * k, color: PR(0x2A1D10).cg(dark ? 0.55 : 0.2))
        body()
        ctx.restoreGState()
    }

    /// A paper dot with the shade it casts.
    fileprivate func dot(_ p: CGPoint, _ r: Double, _ c: PR, in ctx: CGContext) {
        ctx.setFillColor(PR(0x2A1D10).cg(dark ? 0.45 : 0.2))
        ctx.fillEllipse(in: CGRect(x: p.x - r - 0.4, y: p.y - r - 2, width: r * 2 + 0.8, height: r * 2 + 0.8))
        ctx.setFillColor(c.cg())
        ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2))
    }

    fileprivate func fill(_ pts: [CGPoint], _ c: CGColor, in ctx: CGContext) {
        guard let f = pts.first else { return }
        ctx.move(to: f)
        for p in pts.dropFirst() { ctx.addLine(to: p) }
        ctx.closePath()
        ctx.setFillColor(c)
        ctx.fillPath()
    }
}

private extension Int {
    func clamped(_ lo: Int, _ hi: Int) -> Int { Swift.min(Swift.max(self, lo), Swift.max(lo, hi)) }
}

// MARK: - Pages: a pile of paper for each day

/// The month as a calendar of paper piles. Every time a note is written in, a page lands on
/// that day's pile: its edge amber when it was you, blue when your AI wrote. Busy days stand tall.
final class PagesScene: PaperScene {
    private var events: [[(at: Double, ai: Bool)]] = []
    private var thick = 5.0
    private var run: ClosedRange<Int>?
    override var captions: [String]? { ["Each pile is a day", "A page lands each time I write"] }

    override init(script: FilmScript, names: Bool, calendar: Calendar, dark: Bool = false) {
        super.init(script: script, names: names, calendar: calendar, dark: dark)
        events = Array(repeating: [], count: days)
        for n in script.nodes {
            if n.edits.isEmpty { events[day(at: n.birth)].append((n.birth, n.bornByAI)) }
            for (k, e) in n.edits.enumerated() { events[day(at: e)].append((e, n.aiEdits[k])) }
        }
        for k in events.indices { events[k].sort { $0.at < $1.at } }
        thick = min(5.5, 185 / Double(max(1, events.map(\.count).max() ?? 1)))
        // The longest run of days you wrote on, to underline at the end.
        var best = 0, from = 0
        var k = 0
        while k < days {
            guard events[k].contains(where: { !$0.ai }) else { k += 1; continue }
            var j = k
            while j + 1 < days, events[j + 1].contains(where: { !$0.ai }) { j += 1 }
            if j - k + 1 > best { best = j - k + 1; from = k }
            k = j + 1
        }
        if best >= 3 { run = from...(from + best - 1) }
    }

    override func draw(_ t: Double, mid: CGPoint, half: CGSize, in ctx: CGContext) {
        let gt = min(t, growth)
        let rows = (days + 6) / 7
        let stepX = 114.0, stepZ = 128.0, hx = 37.0, hz = 47.0
        // The camera starts on the week the film is in and draws back to the whole month.
        let back = lsmooth((gt - 0.45 * growth) / (0.45 * growth))
        let today = day(at: gt)
        let within = (gt - dayStart[today]) / max(0.001, dayStart[today + 1] - dayStart[today])
        let rowNow = (Double(today) + within) / 7 - 0.5
        func rowZ(_ r: Double) -> Double { (Double(rows - 1) / 2 - r) * stepZ }
        let focusZ = rowZ(min(Double(rows - 1), max(0, rowNow))) * (1 - back)
        // (Never closer than the week is wide.)
        let zoom = min(1.5, min(half.width / 455, half.height / 400)) * (1.12 - 0.12 * back)
        let yaw = 0.5 + 0.03 * sin(0.3 * t), pitch = 0.74
        func project(_ x: Double, _ y: Double, _ z: Double) -> (p: CGPoint, depth: Double) {
            let zz = z - focusZ
            let x1 = x * cos(yaw) + zz * sin(yaw), z1 = -x * sin(yaw) + zz * cos(yaw)
            return (CGPoint(x: mid.x + x1 * zoom, y: mid.y - 40 * zoom + (y * cos(pitch) + z1 * sin(pitch)) * zoom), z1)
        }
        func centre(_ k: Int) -> (x: Double, z: Double) { ((Double(k % 7) - 3) * stepX, rowZ(Double(k / 7))) }
        /// A page's footprint: turned and nudged a little, like paper dropped on a pile.
        func corners(_ c: (x: Double, z: Double), turn: Double, dx: Double, dz: Double, grow: Double = 0) -> [(Double, Double)] {
            [(-1.0, -1.0), (1, -1), (1, 1), (-1, 1)].map { sx, sz in
                let x = sx * (hx + grow), z = sz * (hz + grow)
                return (c.x + dx + x * cos(turn) - z * sin(turn), c.z + dz + x * sin(turn) + z * cos(turn))
            }
        }

        // The places for the days, on the page.
        for k in 0..<days {
            let c = centre(k)
            let q = corners(c, turn: 0, dx: 0, dz: 0, grow: 7).map { project($0.0, 0, $0.1).p }
            let passed = k <= today
            // (Days still to come are barely there.)
            fill(q, soft.mix(ground, passed ? 0 : 0.78).cg(), in: ctx)
            if k == today, t <= growth {
                ctx.addLines(between: q + [q[0]])
                ctx.setStrokeColor(you.cg(0.9))
                ctx.setLineWidth(2.5)
                ctx.strokePath()
            }
        }
        // The longest run, underlined when the month is over.
        if let run, t > growth {
            let a = lsmooth((t - growth - 0.5) / 0.7)
            for k in run {
                let c = centre(k)
                let q = corners(c, turn: 0, dx: 0, dz: 0, grow: 7).map { project($0.0, 0, $0.1).p }
                ctx.addLines(between: q + [q[0]])
                ctx.setStrokeColor(you.cg(a * lsmooth((t - growth - 0.5 - 0.06 * Double(k - run.lowerBound)) / 0.3)))
                ctx.setLineWidth(3)
                ctx.strokePath()
            }
        }

        // The piles, the far ones first.
        let toCamera = (x: sin(yaw), z: -cos(yaw))
        for k in (0..<days).sorted(by: { project(centre($0).x, 0, centre($0).z).depth > project(centre($1).x, 0, centre($1).z).depth }) {
            let c = centre(k)
            let landed = events[k].filter { $0.at <= gt }
            guard !landed.isEmpty else { continue }
            // Its shade on the page.
            shaded(ctx, lift: 1 + Double(landed.count) * 0.06) {
                fill(corners(c, turn: 0, dx: 0, dz: 0, grow: -2).map { project($0.0, 0, $0.1).p }, card.cg(), in: ctx)
            }
            for (j, e) in landed.enumerated() {
                let fall = 1 - ease((gt - e.at) / 0.3)
                let y0 = Double(j) * thick + fall * 90, y1 = y0 + thick
                let turn = (lhash(k * 97 + j, 3) - 0.5) * 0.16 + fall * 0.5, dx = (lhash(k * 97 + j, 4) - 0.5) * 7, dz = (lhash(k * 97 + j, 5) - 0.5) * 7
                let foot = corners(c, turn: turn, dx: dx, dz: dz)
                let alpha = min(1, (gt - e.at) / 0.1)
                let edge = e.ai ? ai : you
                // The two edges that face the camera, in who wrote it.
                for s in 0..<4 {
                    let a = foot[s], b = foot[(s + 1) % 4]
                    let nx = b.1 - a.1, nz = -(b.0 - a.0)
                    guard nx * toCamera.x + nz * toCamera.z > 0 else { continue }
                    let shade = 0.78 + 0.22 * max(0, (nx * 0.5 + nz * -0.85) / max(0.001, hypot(nx, nz)))
                    fill([project(a.0, y0, a.1).p, project(b.0, y0, b.1).p, project(b.0, y1, b.1).p, project(a.0, y1, a.1).p],
                         edge.mix(PR(0x2A1D10), 1 - shade).cg(alpha), in: ctx)
                }
                let top = foot.map { project($0.0, y1, $0.1).p }
                fill(top, card.mix(edge, 0.06).cg(alpha), in: ctx)
                ctx.addLines(between: top + [top[0]])
                ctx.setStrokeColor(ink.cg(0.1 * alpha))
                ctx.setLineWidth(0.8)
                ctx.strokePath()
                // The top page has a note's lines on it.
                if j == landed.count - 1 {
                    for line in 0..<3 {
                        let v = 0.28 + 0.2 * Double(line), w = line == 2 ? 0.5 : 0.78
                        let a = CGPoint(x: top[0].x + (top[3].x - top[0].x) * v + (top[1].x - top[0].x) * 0.16, y: top[0].y + (top[3].y - top[0].y) * v + (top[1].y - top[0].y) * 0.16)
                        let b = CGPoint(x: top[0].x + (top[3].x - top[0].x) * v + (top[1].x - top[0].x) * w, y: top[0].y + (top[3].y - top[0].y) * v + (top[1].y - top[0].y) * w)
                        ctx.move(to: a); ctx.addLine(to: b)
                    }
                    ctx.setStrokeColor(ink.cg(0.2 * alpha))
                    ctx.setLineWidth(1.6)
                    ctx.strokePath()
                }
            }
        }
    }
}

// MARK: - Rings: the month as layers of paper

/// The month as growth rings cut from paper. Time runs outward from the first day; every week
/// is a sheet under the last, a little wider. Each note starts where it was made and reaches out
/// as far as it was last written in, a bead for every time: amber for you, blue for your AI.
/// Folders each have their own part of the round.
final class RingsScene: PaperScene {
    private var angle: [Double] = []
    private var sectors: [(folder: Int, from: Double, to: Double, birth: Double)] = []
    override var captions: [String]? { ["Each ring is a day", "A bead each time a note\u{2019}s written in"] }

    override init(script: FilmScript, names: Bool, calendar: Calendar, dark: Bool = false) {
        super.init(script: script, names: names, calendar: calendar, dark: dark)
        var by = [[Int]](repeating: [], count: script.folders.count)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        angle = Array(repeating: 0, count: script.nodes.count)
        let used = by.indices.filter { !by[$0].isEmpty }
        let gap = used.count > 1 ? 0.07 : 0
        let room = 2 * Double.pi - gap * Double(used.count)
        var at = 0.6
        for f in used {
            let width = room * Double(by[f].count) / Double(script.nodes.count)
            for (k, i) in by[f].enumerated() { angle[i] = at + width * (Double(k) + 0.5) / Double(by[f].count) }
            sectors.append((f, at, at + width, script.nodes[by[f][0]].birth))
            at += width + gap
        }
    }

    override func draw(_ t: Double, mid: CGPoint, half: CGSize, in ctx: CGContext) {
        let gt = min(t, growth)
        let full = 380.0
        func radius(_ time: Double) -> Double { full * (0.13 + 0.87 * time / growth) }
        let fit = min(half.width, half.height) - 34
        let s = min(2.3, fit / (radius(gt) + 44))
        let rot = 0.035 * t
        func at(_ a: Double, _ r: Double) -> CGPoint { CGPoint(x: mid.x + cos(a + rot) * r * s, y: mid.y + sin(a + rot) * r * s) }
        /// A round sheet cut by hand: not quite a circle.
        func sheet(_ r: Double, seed: Int) -> [CGPoint] {
            (0..<140).map { k in
                let a = Double(k) / 140 * 2 * .pi
                let wob = 1 + 0.011 * sin(3 * a + lhash(seed, 1) * 6) + 0.007 * sin(7 * a + lhash(seed, 2) * 6)
                return at(a, r * wob)
            }
        }

        // A sheet for each week, the latest (widest) at the bottom.
        let weeks = (days + 6) / 7
        for w in (0..<weeks).reversed() where dayStart[w * 7] <= gt {
            let outer = min(gt, dayStart[min(days, (w + 1) * 7)])
            shaded(ctx) { fill(sheet(radius(outer), seed: w), papers[w % papers.count].cg(), in: ctx) }
        }
        // The days, cut fine.
        for k in 1..<max(2, days) where dayStart[k] <= gt && k % 7 != 0 {
            let r = radius(dayStart[k]) * s
            ctx.setStrokeColor(ink.cg(dark ? 0.16 : 0.1))
            ctx.setLineWidth(1)
            ctx.strokeEllipse(in: CGRect(x: mid.x - r, y: mid.y - r, width: r * 2, height: r * 2))
        }

        // Each note: stitched from where it began to where it was last written in.
        ctx.setLineCap(.round)
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            let last = n.edits.last { $0 <= gt } ?? n.birth
            guard last > n.birth + 0.01 else { continue }
            ctx.move(to: at(angle[i], radius(n.birth)))
            ctx.addLine(to: at(angle[i], radius(last)))
        }
        ctx.setStrokeColor(ink.cg(dark ? 0.5 : 0.38))
        ctx.setLineWidth(1.3)
        ctx.setLineDash(phase: 0, lengths: [5, 5])
        ctx.strokePath()
        ctx.setLineDash(phase: 0, lengths: [])
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            var done = 0.0
            for (k, e) in n.edits.enumerated() where e <= gt {
                done += 1
                guard e > n.birth + 0.01 else { continue }
                let pop = lbackOut((gt - e) / 0.25)
                dot(at(angle[i], radius(e)), 3.1 * min(1.5, s.squareRoot()) * pop, n.aiEdits[k] ? ai : you, in: ctx)
            }
            let pop = lbackOut((gt - n.birth) / 0.3)
            let helped = lsmooth((gt - aiFrom[i]) / 0.35)
            let r = (4.6 + 3.4 * min(1, (done / busy).squareRoot())) * min(1.5, s.squareRoot()) * pop
            let p = at(angle[i], radius(n.birth))
            dot(p, r, you.mix(ai, helped), in: ctx)
            // A ring goes out as it's written in.
            let since = gt - (n.edits.last { $0 <= gt } ?? n.birth)
            if since < 0.5, t <= growth {
                let out = r + 3 + since / 0.5 * 12
                ctx.setStrokeColor(you.mix(ai, helped).cg(0.7 * (1 - since / 0.5)))
                ctx.setLineWidth(1.8)
                ctx.strokeEllipse(in: CGRect(x: p.x - out, y: p.y - out, width: out * 2, height: out * 2))
            }
        }

        // Each folder's name by its part of the round.
        guard names else { return }
        for sector in sectors where sector.birth <= gt {
            let name = script.folders[sector.folder]
            guard !name.isEmpty else { continue }
            let a = (sector.from + sector.to) / 2 + rot
            let p = CGPoint(x: mid.x + cos(a) * (radius(gt) * s + 22), y: mid.y + sin(a) * (radius(gt) * s + 22))
            let w = FilmKit.width(name, 32, 0.23)
            let x = min(W - 36 - w, max(36, p.x - w * (0.5 - 0.5 * cos(a))))
            FilmKit.text(name, 32, 0.23, ink.cg(0.85 * lsmooth((gt - sector.birth - 0.1) / 0.4)), at: CGPoint(x: x, y: p.y - 11 + 14 * sin(a)), in: ctx)
        }
    }
}

// MARK: - Leaf: Pinto's leaf, grown from your notes

/// The month as one paper leaf, like the one in Pinto's mark. It starts small and grows with the
/// notebook. Every folder is a vein, every note a dot on it: amber for yours, blue where your AI
/// helped, larger the more it was written in.
final class LeafScene: PaperScene {
    private struct Vein { var folder: Int; var u0: Double; var side: Double; var reach: Double; var notes: [Int] }
    private var veins: [Vein] = []
    private var loose: [Int] = []
    /// Per note: how far out its vein it sits, and its little side stalk.
    private var spot: [(vein: Int, q: Double, side: Double, stalk: Double)] = []
    override var captions: [String]? { ["Each dot is a note", "A vein for every folder"] }

    override init(script: FilmScript, names: Bool, calendar: Calendar, dark: Bool = false) {
        super.init(script: script, names: names, calendar: calendar, dark: dark)
        var by = [[Int]](repeating: [], count: script.folders.count)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        spot = Array(repeating: (-1, 0, 1, 0), count: script.nodes.count)
        let named = by.indices.filter { !by[$0].isEmpty && !script.folders[$0].isEmpty }.sorted { by[$0].count > by[$1].count }
        loose = by.indices.filter { script.folders[$0].isEmpty }.flatMap { by[$0] }
        // Places along the midrib, the largest folders where the leaf is widest.
        let n = max(1, named.count)
        let slots = (0..<n).map { 0.15 + 0.6 * (n == 1 ? 0.5 : Double($0) / Double(n - 1)) }
        let order = slots.indices.sorted { abs(slots[$0] - 0.42) < abs(slots[$1] - 0.42) }
        let most = Double(named.first.map { by[$0].count } ?? 1)
        for (j, f) in named.enumerated() {
            let slot = order[j]
            let reach = 0.5 + 0.5 * (Double(by[f].count) / most).squareRoot()
            veins.append(Vein(folder: f, u0: slots[slot], side: slot % 2 == 0 ? 1 : -1, reach: reach, notes: by[f]))
            for (k, i) in by[f].enumerated() {
                spot[i] = (veins.count - 1, reach * (Double(k) + 1) / (Double(by[f].count) + 0.4), k % 2 == 0 ? 1 : -1, 15 + 16 * lhash(i, 21))
            }
        }
        for (k, i) in loose.enumerated() { spot[i] = (-1, 0.12 + 0.76 * (Double(k) + 0.5) / Double(loose.count), k % 2 == 0 ? 1 : -1, 16 + 14 * lhash(i, 21)) }
    }

    override func draw(_ t: Double, mid: CGPoint, half: CGSize, in ctx: CGContext) {
        let gt = min(t, growth)
        // It grows from a small leaf to the whole frame.
        let size = 0.4 + 0.6 * lsmooth(gt / (growth * 0.94))
        let sway = 0.022 * sin(0.7 * t)
        let length = min(900, hypot(half.width * 1.02, half.height * 1.86)) * size
        let lean = atan2(half.height * 1.74, half.width * 0.98) + sway
        let dir = CGPoint(x: cos(lean), y: sin(lean)), across = CGPoint(x: sin(lean), y: -cos(lean))
        let base = CGPoint(x: mid.x - half.width * 0.5, y: mid.y - half.height * 0.9)
        let widest = 252 * size
        func rib(_ u: Double) -> CGPoint {
            let bow = 34 * size * sin(.pi * u)
            return CGPoint(x: base.x + dir.x * length * u - across.x * bow, y: base.y + dir.y * length * u - across.y * bow)
        }
        func halfWidth(_ u: Double) -> Double { widest * pow(max(0, sin(.pi * pow(min(1, max(0, u)), 0.8))), 0.85) }
        func edge(_ u: Double, _ side: Double) -> CGPoint { let r = rib(u), w = halfWidth(u) * side; return CGPoint(x: r.x + across.x * w, y: r.y + across.y * w) }
        func onVein(_ v: Vein, _ q: Double) -> CGPoint {
            let u = v.u0 + 0.17 * q
            let r = rib(u), w = halfWidth(u) * 0.84 * q * v.side
            return CGPoint(x: r.x + across.x * w, y: r.y + across.y * w)
        }
        let us = (0...60).map { Double($0) / 60 }
        let greens: (PR, PR, PR) = dark ? (PR(0x3F5A3C), PR(0x4B6946), PR(0x86B07E)) : (PR(0xB3CDA2), PR(0xC5DAB4), PR(0x5F8B5E))

        // The stalk, then the blade: two sheets, folded along the middle.
        ctx.setLineCap(.round)
        ctx.move(to: CGPoint(x: base.x - dir.x * 84 * size, y: base.y - dir.y * 84 * size))
        ctx.addLine(to: rib(0.04))
        ctx.setStrokeColor((dark ? PR(0x8A5A2B) : PR(0x9A6B3A)).cg())
        ctx.setLineWidth(10 * size)
        ctx.strokePath()
        shaded(ctx, lift: 1.3) { fill(us.map { edge($0, 1) } + us.reversed().map { edge($0, -1) }, greens.0.cg(), in: ctx) }
        fill(us.map { rib($0) } + us.reversed().map { edge($0, 1) }, greens.1.cg(), in: ctx)

        // The midrib and a vein for each folder, cut a little darker; drawn out as far as its notes go.
        ctx.addLines(between: us.filter { $0 <= 0.97 }.map { rib($0) })
        ctx.setStrokeColor(greens.2.cg(0.9))
        ctx.setLineWidth(4.5 * size)
        ctx.strokePath()
        for v in veins {
            let reached = v.notes.reduce(0.0) { max($0, script.nodes[$1].birth <= gt ? spot[$1].q * lsmooth((gt - script.nodes[$1].birth) / 0.4) : 0) }
            ctx.addLines(between: (0...16).map { onVein(v, v.reach * Double($0) / 16) })
            ctx.setStrokeColor(greens.2.cg(0.28))
            ctx.setLineWidth(2.4 * size)
            ctx.strokePath()
            guard reached > 0 else { continue }
            ctx.addLines(between: (0...16).map { onVein(v, min(v.reach, reached + 0.04) * Double($0) / 16) })
            ctx.setStrokeColor(greens.2.cg(0.95))
            ctx.setLineWidth(3.2 * size)
            ctx.strokePath()
        }

        // The notes, each on a little stalk off its vein.
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            let sp = spot[i]
            let from: CGPoint, away: CGPoint
            if sp.vein >= 0 {
                let v = veins[sp.vein]
                from = onVein(v, sp.q)
                let ahead = onVein(v, sp.q + 0.02)
                let d = hypot(ahead.x - from.x, ahead.y - from.y)
                away = CGPoint(x: -(ahead.y - from.y) / max(0.001, d) * sp.side, y: (ahead.x - from.x) / max(0.001, d) * sp.side)
            } else {
                from = rib(sp.q)
                away = CGPoint(x: across.x * sp.side, y: across.y * sp.side)
            }
            let pop = lbackOut((gt - n.birth) / 0.32)
            let p = CGPoint(x: from.x + away.x * sp.stalk * size * pop, y: from.y + away.y * sp.stalk * size * pop)
            ctx.move(to: from); ctx.addLine(to: p)
            ctx.setStrokeColor(greens.2.cg(0.85))
            ctx.setLineWidth(1.8 * size)
            ctx.strokePath()
            var done = 0.0, last = n.birth
            for e in n.edits where e <= gt { done += 1; last = e }
            let helped = lsmooth((gt - aiFrom[i]) / 0.35)
            let r = (4.4 + 5 * min(1, (done / busy).squareRoot())) * (0.55 + 0.45 * size) * pop
            dot(p, r, you.mix(ai, helped), in: ctx)
            let since = gt - last
            if since < 0.5, t <= growth {
                let out = r + 3 + since / 0.5 * 13
                ctx.setStrokeColor((dark ? PR(0xFFF4E6) : you.mix(ai, helped)).cg(0.75 * (1 - since / 0.5)))
                ctx.setLineWidth(1.8)
                ctx.strokeEllipse(in: CGRect(x: p.x - out, y: p.y - out, width: out * 2, height: out * 2))
            }
        }

        // Each folder's name off the end of its vein, outside the leaf.
        guard names else { return }
        for v in veins {
            let first = script.nodes[v.notes[0]].birth
            guard first <= gt else { continue }
            let u = v.u0 + 0.17 * v.reach
            let e = edge(u, v.side)
            let name = script.folders[v.folder]
            let w = FilmKit.width(name, 30, 0.23)
            let out = CGPoint(x: e.x + across.x * v.side * 20, y: e.y + across.y * v.side * 20)
            let x = min(W - 34 - w, max(34, v.side > 0 ? out.x : out.x - w))
            let a = lsmooth((gt - first - 0.1) / 0.4)
            ctx.move(to: onVein(v, v.reach)); ctx.addLine(to: out)
            ctx.setStrokeColor(ink.cg(0.25 * a))
            ctx.setLineWidth(1.2)
            ctx.strokePath()
            FilmKit.text(name, 30, 0.23, ink.cg(0.86 * a), at: CGPoint(x: x, y: out.y - 10 + (v.side > 0 ? -12 : 8)), in: ctx)
        }
    }
}
