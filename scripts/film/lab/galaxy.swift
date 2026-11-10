import CoreGraphics
import Foundation

// Lab: your notebook as something in space, cut from paper. What it is comes from how you wrote
// (FilmForm: a comet for bursts with days away, a nebula for a few deep folders, a spiral for many),
// and the sky's colour from a seed. What it's made of is yours: an arm, a cloud or a strand of the
// tail for each folder, a paper star for each note, and a speck of paper for every time a note was
// written in. So the more work is in a notebook, the more there is to see: stars in more layers,
// dust in drifts, a brighter heart.

private typealias GR = FilmRenderer.RGB

final class GalaxyScene: FilmScene {
    typealias Form = FilmForm
    let script: FilmScript
    let names: Bool
    let form: Form
    let W = 1080.0
    private var growth: Double { script.growth }
    private let sky: GR, clouds: [GR]
    private let you = GR(0xFFC45A), ai = GR(0x8FC4FF), cream = GR(0xFFF4E6), inkDark = GR(0x2A1D10), peach = GR(0xFFE2B0)
    private let aiFrom: [Double]
    private let seed: Int
    /// How large the whole thing is drawn before it's fitted to the frame: by how many notes.
    private let size: Double
    /// Folders with a name, largest first, and the notes in each; and the notes in none.
    private var groups: [(folder: Int, notes: [Int])] = []
    private var loose: [Int] = []
    private var slot: [(group: Int, k: Int)]
    private var centres: [CGPoint] = []
    /// Every time anything was written in, in order: for how much work there is at a moment.
    private let allEdits: [Double]
    private var groupEdits: [[Double]] = []
    /// While it's only being laid out (to know where the camera should look), nothing is drawn.
    private var quiet = false

    static let skies: [(UInt32, [UInt32])] = [
        (0x15133A, [0x241F5C, 0x3A2F7C, 0x5B4196, 0x8257A8]),
        (0x0B242E, [0x103B45, 0x1A595C, 0x2F7D74, 0x66AA8E]),
        (0x26112B, [0x45183E, 0x6B2450, 0x963A5E, 0xC65F6E]),
        (0x0D1A35, [0x182F55, 0x25467A, 0x3C649C, 0x7396C6]),
        (0x1D0E33, [0x381A5C, 0x5A2A86, 0x8846A8, 0xC47BCB]),
    ]

    init(script: FilmScript, names: Bool, seed: Int, form: Form? = nil) {
        self.script = script
        self.names = names
        self.seed = seed
        self.form = form ?? script.form
        let s = Self.skies[(seed / 3 + seed) % Self.skies.count]
        sky = GR(s.0)
        clouds = s.1.map { GR($0) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        size = min(2.4, max(0.8, (Double(script.nodes.count) / 60).squareRoot()))
        allEdits = script.nodes.flatMap(\.edits).sorted()
        var by = [[Int]](repeating: [], count: script.folders.count)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        slot = Array(repeating: (-1, 0), count: script.nodes.count)
        for f in by.indices.filter({ !by[$0].isEmpty }).sorted(by: { (by[$0].count, -$0) > (by[$1].count, -$1) }) {
            if script.folders[f].isEmpty { loose = by[f]; for (k, i) in by[f].enumerated() { slot[i] = (-1, k) }; continue }
            groups.append((f, by[f]))
            for (k, i) in by[f].enumerated() { slot[i] = (groups.count - 1, k) }
        }
        groupEdits = groups.map { g in g.notes.flatMap { script.nodes[$0].edits }.sorted() }
        // (For the nebula: where each folder's cloud sits, kept apart by their sizes.)
        var cs = groups.indices.map { j -> (c: CGPoint, r: Double) in
            let r = 120 * Double(j).squareRoot(), a = Double(j) * 2.399963 + Double(seed)
            return (CGPoint(x: r * cos(a) * 1.15, y: r * sin(a) * 0.85), 15 * Double(groups[j].notes.count).squareRoot() + 30)
        }
        for _ in 0..<120 {
            for a in cs.indices { for b in cs.indices where b > a {
                let d = CGPoint(x: cs[a].c.x - cs[b].c.x, y: cs[a].c.y - cs[b].c.y)
                let len = max(0.5, hypot(d.x, d.y)), want = cs[a].r + cs[b].r + 26
                guard len < want else { continue }
                let push = (want - len) / 2 / len
                cs[a].c.x += d.x * push; cs[a].c.y += d.y * push
                cs[b].c.x -= d.x * push; cs[b].c.y -= d.y * push
            } }
            for a in cs.indices { cs[a].c.x *= 0.99; cs[a].c.y *= 0.99 }
        }
        centres = cs.map(\.c)
    }

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    var captions: [String]? { ["Each star is a note", "Each speck is a time it was written in"] }
    var wordsDelay: Double { 0 }
    var rewinds: Bool { false }
    var appStart: Double { 0 }
    func subtitle(_ stats: FilmStats) -> String? { nil }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}
    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) { drawBehind(t, canvas: canvas, in: ctx) }
    func topInk(_ t: Double) -> FilmRenderer.RGB { cream }
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool { false }

    // MARK: Paper

    /// Paper on paper: a shape with the shade it casts.
    private func paper(_ pts: [CGPoint], _ c: GR, lift: Double = 1, in ctx: CGContext) {
        guard pts.count > 2, !quiet else { return }
        let k = abs(ctx.ctm.a)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -5 * lift * k), blur: 12 * lift * k, color: CGColor(gray: 0, alpha: 0.42))
        ctx.addLines(between: pts)
        ctx.closePath()
        ctx.setFillColor(c.cg())
        ctx.fillPath()
        ctx.restoreGState()
    }

    /// A cloud cut by hand: a round shape whose edge wanders.
    private func cloud(_ c: CGPoint, _ rx: Double, _ ry: Double, turn: Double = 0, key: Int) -> [CGPoint] {
        (0..<72).map { k in
            let a = Double(k) / 72 * 2 * .pi
            let wob = 1 + 0.09 * sin(3 * a + lhash(key, 1) * 6) + 0.06 * sin(5 * a + lhash(key, 2) * 6) + 0.035 * sin(9 * a + lhash(key, 3) * 6)
            let x = cos(a) * rx * wob, y = sin(a) * ry * wob
            return CGPoint(x: c.x + x * cos(turn) - y * sin(turn), y: c.y + x * sin(turn) + y * cos(turn))
        }
    }

    /// A four-pointed star of paper, with its shade.
    private func star(_ p: CGPoint, _ r: Double, turn: Double, _ c: GR, in ctx: CGContext) {
        func shape(_ dy: Double) {
            for k in 0..<8 {
                let a = turn + Double(k) * .pi / 4, d = k % 2 == 0 ? r : r * 0.4
                let q = CGPoint(x: p.x + cos(a) * d, y: p.y + sin(a) * d + dy)
                if k == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
            }
            ctx.closePath()
        }
        shape(-2.2)
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.4))
        ctx.fillPath()
        shape(0)
        ctx.setFillColor(c.cg())
        ctx.fillPath()
        // (A fold down its middle: one half a little lighter.)
        ctx.move(to: CGPoint(x: p.x + cos(turn) * r, y: p.y + sin(turn) * r))
        ctx.addLine(to: CGPoint(x: p.x + cos(turn + .pi / 4) * r * 0.4, y: p.y + sin(turn + .pi / 4) * r * 0.4))
        ctx.addLine(to: CGPoint(x: p.x + cos(turn + .pi) * r, y: p.y + sin(turn + .pi) * r))
        ctx.closePath()
        ctx.setFillColor(GR(0xFFFFFF).cg(0.22))
        ctx.fillPath()
    }

    /// A folder's name on a slip of cream paper.
    private func tag(_ name: String, at p: CGPoint, alpha: Double, hot: Double = 0, in ctx: CGContext) {
        guard alpha > 0.02 else { return }
        ctx.saveGState()
        defer { ctx.restoreGState() }
        // (The folder being worked in: its slip in amber, a little larger.)
        if hot > 0.01 {
            let k = 1 + 0.16 * hot
            ctx.translateBy(x: p.x, y: p.y + 20)
            ctx.scaleBy(x: k, y: k)
            ctx.translateBy(x: -p.x, y: -(p.y + 20))
        }
        let w = FilmKit.width(name, 27, 0.3) + 26
        let x = min(W - 30 - w, max(30, p.x - w / 2))
        let box = CGRect(x: x, y: p.y, width: w, height: 40)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: -3 * abs(ctx.ctm.a)), blur: 8 * abs(ctx.ctm.a), color: CGColor(gray: 0, alpha: 0.45))
        ctx.addPath(CGPath(roundedRect: box, cornerWidth: 7, cornerHeight: 7, transform: nil))
        ctx.setFillColor(cream.mix(you, 0.85 * hot).cg())
        ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(name, 27, 0.3, inkDark.cg(alpha), at: CGPoint(x: x + 13, y: p.y + 11), in: ctx)
    }

    // MARK: Work

    /// How many of these times have come by `t` (the list is in order).
    private func upTo(_ list: [Double], _ t: Double) -> Int {
        var lo = 0, hi = list.count
        while lo < hi { let m = (lo + hi) / 2; if list[m] <= t { lo = m + 1 } else { hi = m } }
        return lo
    }
    /// Work as a level: one more each time it doubles.
    private func level(_ edits: Int, per: Double) -> Double { log2(1 + Double(edits) / per) }

    /// A star of paper with any number of points, with its shade.
    private func burst(_ p: CGPoint, _ r: Double, points: Int, inner: Double, turn: Double, _ c: GR, shade: Double = 2.2, in ctx: CGContext) {
        guard r > 0.5, !quiet else { return }
        func shape(_ dy: Double) {
            for k in 0..<(points * 2) {
                let a = turn + Double(k) * .pi / Double(points), d = k % 2 == 0 ? r : r * inner
                let q = CGPoint(x: p.x + cos(a) * d, y: p.y + sin(a) * d + dy)
                if k == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
            }
            ctx.closePath()
        }
        shape(-shade)
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.4))
        ctx.fillPath()
        shape(0)
        ctx.setFillColor(c.cg())
        ctx.fillPath()
    }

    /// A note: a paper star, in more layers the more it's been written in.
    private func note(_ p: CGPoint, _ r: Double, turn: Double, _ c: GR, edits: Double, in ctx: CGContext) {
        if edits >= 30 { burst(p, r * 1.14, points: 12, inner: 0.64, turn: turn * 0.5, c.mix(sky, 0.5), in: ctx) }
        if edits >= 12 {
            burst(p, r, points: 8, inner: 0.56, turn: turn + .pi / 8, c.mix(sky, 0.3), in: ctx)
        } else if edits >= 4 {
            burst(p, r * 0.92, points: 4, inner: 0.4, turn: turn + .pi / 4, c.mix(sky, 0.32), in: ctx)
        }
        star(p, edits >= 12 ? r * 0.8 : r, turn: turn, c, in: ctx)
        if edits >= 30 {
            ctx.setFillColor(cream.cg())
            ctx.fillEllipse(in: CGRect(x: p.x - r * 0.15, y: p.y - r * 0.15, width: r * 0.3, height: r * 0.3))
        }
    }

    /// Rays of paper behind a heart, lying in the same plane as it.
    private func rays(_ c: CGPoint, _ r: Double, lean: Double, axis: Double, turn: Double, points: Int, _ col: GR, in ctx: CGContext) {
        guard r > 1 else { return }
        ctx.saveGState()
        ctx.translateBy(x: c.x, y: c.y)
        ctx.rotate(by: axis)
        ctx.scaleBy(x: 1, y: lean)
        burst(.zero, r, points: points, inner: 0.66, turn: turn, col, shade: 4, in: ctx)
        ctx.restoreGState()
    }

    // MARK: Camera

    /// One slow move and no others: a little closer at the start, drawing back all through the
    /// month, so the far paper slides behind the near. It never goes in on anything.
    private func camera(_ t: Double, mid: CGPoint) -> (k: Double, on: CGPoint) {
        (1.14 - 0.14 * lsmooth(min(t, growth) / growth), mid)
    }

    // MARK: Drawing

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let H = canvas.height, gt = min(t, growth)
        ctx.setFillColor(sky.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        let bottom = canvas.bottom + 330, top = H - canvas.top - 120
        let mid = CGPoint(x: W / 2, y: (bottom + top) / 2)
        let half = CGSize(width: (W - 120) / 2, height: (top - bottom) / 2)
        // Where the work is right now: each folder's share of what's been written in these last
        // moments. The folder being worked in lights up and the others stand back, so the month
        // is seen going back and forth: one thing one day, a lot of something else another.
        let window = 0.55
        var heat = groupEdits.map { list -> Double in
            var sum = 0.0, k = upTo(list, gt) - 1
            while k >= 0, gt - list[k] < window { sum += 1 - (gt - list[k]) / window; k -= 1 }
            return sum
        }
        let most_ = heat.max() ?? 0
        let going = min(1, most_ / 2.5) * (1 - lsmooth((t - growth + 0.5) / 0.5))
        heat = heat.map { most_ > 0 ? pow($0 / most_, 1.6) * going : 0 }
        func tint(_ c: GR, _ j: Int) -> GR { c.mix(cream, 0.42 * heat[j]).mix(sky, 0.2 * going * (1 - heat[j])) }
        // (And the month's own moments are pointed out where they are, never by going in on them.)
        var named = [Double](repeating: 0, count: groups.count)
        var spot: [Int: Double] = [:]
        for b in script.story {
            let a = lsmooth((t - b.from) / 0.3) * (1 - lsmooth((t - b.until + 0.3) / 0.3))
            guard a > 0 else { continue }
            if let n = b.node { spot[n] = a } else if let f = b.folder, let j = groups.firstIndex(where: { $0.folder == f }) { named[j] = a }
        }

        // Where every note is, by the kind of thing this is.
        func build() -> (at: [CGPoint], labels: [(name: String, at: CGPoint, a: Double, group: Int)], zoom: Double, heart: CGPoint) {
        var where_ = [CGPoint](repeating: .zero, count: script.nodes.count)
        var labels: [(name: String, at: CGPoint, a: Double, group: Int)] = []
        var zoom = 1.0
        var heart = mid
        func alive(_ notes: [Int]) -> Double { notes.reduce(0) { $0 + (script.nodes[$1].birth <= gt ? lsmooth((gt - script.nodes[$1].birth) / 0.45) : 0) } }
        func born(_ notes: [Int]) -> Double { notes.first.map { script.nodes[$0].birth } ?? .infinity }
        let most = Double(max(1, groups.first?.notes.count ?? 1))
        // How much work is in it so far, all of it and folder by folder.
        let work = level(upTo(allEdits, gt), per: 60)
        func worked(_ j: Int) -> Double { level(upTo(groupEdits[j], gt), per: 30) }
        func show(_ l: Double, from: Double) -> Double { lsmooth((l - from) / 0.6) }

        switch form {
        case .spiral:
            // An arm of paper for each folder, as long as what's in it, winding out from the middle.
            // The more notes, the further the arms wind; the more work, the more there is at its heart.
            let lean = 0.62 + 0.3 * lhash(seed, 11), axis = lhash(seed, 12) * 3.14, way: Double = lhash(seed, 13) < 0.5 ? 1 : -1
            let wind = min(5.2, 1.3 + 0.7 * lhash(seed, 14) + 1.3 * log2(max(1, Double(script.nodes.count) / 45))), spin = way * 0.05 * t
            let arms = Double(max(1, groups.count))
            // (Many arms begin further out, so they aren't a knot at the middle.)
            let core = 46 * size.squareRoot() * max(1, arms / 7), full = 330 * size
            let wide = min(42, 0.42 * 2 * .pi / arms * (full - core) / wind)
            func at(_ arm: Int, _ s: Double, _ off: Double) -> CGPoint {
                let a = Double(arm) / arms * 2 * .pi + Double(seed) + way * wind * s + spin
                let r = core + (full - core) * s
                let x = cos(a) * r - sin(a) * off, y = (sin(a) * r + cos(a) * off) * lean
                return CGPoint(x: x * cos(axis) - y * sin(axis), y: x * sin(axis) + y * cos(axis))
            }
            func reach(_ j: Int) -> Double { 0.42 + 0.58 * (Double(groups[j].notes.count) / most).squareRoot() }
            var far = core * 1.5 + 60
            for (j, g) in groups.enumerated() {
                for (k, i) in g.notes.enumerated() where script.nodes[i].birth <= gt {
                    let s = reach(j) * (Double(k) + 0.8) / (Double(g.notes.count) + 0.4)
                    where_[i] = at(j, s, (lhash(i, 15) - 0.5) * 2 * wide * (0.72 - 0.3 * s))
                    far = max(far, hypot(where_[i].x, where_[i].y) + 50)
                }
            }
            for (k, i) in loose.enumerated() where script.nodes[i].birth <= gt {
                let r = 12 * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963 + spin
                where_[i] = CGPoint(x: cos(a) * r, y: sin(a) * r * lean)
            }
            zoom = min(2.5 / size, min(half.width, half.height) / far)
            func scr(_ p: CGPoint) -> CGPoint { CGPoint(x: mid.x + p.x * zoom, y: mid.y + p.y * zoom) }
            // The disc it lies in: sheets of paper, more of them and lighter as the work adds up.
            let halo = show(work, from: 4)
            if halo > 0 { paper(cloud(mid, far * zoom * 1.16 * halo, far * zoom * 1.16 * lean * halo, turn: axis, key: seed * 7 + 9), sky.mix(clouds[0], 0.6), lift: 1.3, in: ctx) }
            paper(cloud(mid, far * zoom * 0.98, far * zoom * 0.98 * lean, turn: axis, key: seed * 7 + 3), clouds[0], in: ctx)
            paper(cloud(mid, far * zoom * 0.66, far * zoom * 0.66 * lean, turn: axis, key: seed * 7 + 4), clouds[1], in: ctx)
            let inner = show(work, from: 2.5)
            if inner > 0 { paper(cloud(mid, far * zoom * 0.42 * inner, far * zoom * 0.42 * lean * inner, turn: axis, key: seed * 7 + 10), clouds[1].mix(clouds[2], 0.55), lift: 0.8, in: ctx) }
            for (j, g) in groups.enumerated() {
                let got = alive(g.notes)
                guard got > 0 else { continue }
                let upTo = reach(j) * min(1, (got + 0.6) / (Double(g.notes.count) + 0.4)) + 0.03
                let w0 = wide * (0.7 + 0.3 * min(1, worked(j) / 4)), col = tint(clouds[2 + j % 2], j)
                func band(_ part: Double, _ c: GR, lift: Double) {
                    var one: [CGPoint] = [], other: [CGPoint] = []
                    for k in 0...40 {
                        let s = upTo * Double(k) / 40
                        let w = w0 * part * (1 - 0.35 * s) * sin(.pi * min(1, 0.12 + 0.88 * (1 - Double(k) / 40))) * min(1, got)
                        one.append(scr(at(j, s, w))); other.append(scr(at(j, s, -w)))
                    }
                    paper(one + other.reversed(), c, lift: lift, in: ctx)
                }
                band(1, col, lift: 1)
                // (A lighter strip down an arm that's been worked in a lot.)
                let lit = show(worked(j), from: 2.2)
                if lit > 0 { band(0.42 * lit, col.mix(cream, 0.26), lift: 0.4) }
                // (Its name a short step past the arm's tip, however far the arm winds.)
                let step = 44 / zoom / hypot(full - core, wind * (core + (full - core) * upTo))
                if names { labels.append((script.folders[g.folder], scr(at(j, upTo + step, 0)), lsmooth((gt - born(g.notes) - 0.2) / 0.5), j)) }
            }
            // Its heart: rays behind it once there's work enough, a second ring of them for a lot.
            // (It starts small and grows with the work, like everything else here.)
            let r0 = 40 * size.squareRoot() * max(1, arms / 7).squareRoot() * zoom * (0.5 + 0.5 * min(1, work / 3))
            let far2 = show(work, from: 4.5), near = show(work, from: 1.6)
            if far2 > 0 { rays(mid, r0 * (2.3 + 0.2 * min(2, work - 4.5)) * far2, lean: lean, axis: axis, turn: -0.07 * t, points: 20, clouds[3], in: ctx) }
            if near > 0 { rays(mid, r0 * (1.5 + 0.12 * min(4, work - 1.6)) * near, lean: lean, axis: axis, turn: 0.1 * t, points: 14, clouds[3].mix(peach, 0.55), in: ctx) }
            paper(cloud(mid, r0, r0 * lean, turn: axis, key: seed * 7 + 5), peach, lift: 0.7, in: ctx)
            if inner > 0 { paper(cloud(mid, r0 * 0.55 * inner, r0 * 0.55 * lean * inner, turn: axis, key: seed * 7 + 11), cream, lift: 0.4, in: ctx) }
            for i in where_.indices { where_[i] = scr(where_[i]) }

        case .nebula:
            // A cloud of paper for each folder, as wide as what's in it, with its stars inside,
            // and lighter sheets at its middle as it's worked in.
            var lo = CGPoint(x: -120, y: -120), hi = CGPoint(x: 120, y: 120)
            var radius = [Double](repeating: 0, count: groups.count)
            for (j, g) in groups.enumerated() {
                let got = alive(g.notes)
                radius[j] = got > 0 ? (15 * got.squareRoot() + 30) * min(1, got * 1.5) : 0
                guard born(g.notes) <= gt + 0.8 else { continue }
                lo.x = min(lo.x, centres[j].x - radius[j] - 20); hi.x = max(hi.x, centres[j].x + radius[j] + 20)
                lo.y = min(lo.y, centres[j].y - radius[j] - 20); hi.y = max(hi.y, centres[j].y + radius[j] + 60)
            }
            zoom = min(2.4, half.width * 2 / (hi.x - lo.x), half.height * 2 / (hi.y - lo.y))
            let c0 = CGPoint(x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2)
            func scr(_ p: CGPoint) -> CGPoint { CGPoint(x: mid.x + (p.x - c0.x) * zoom, y: mid.y + (p.y - c0.y) * zoom) }
            // (With a lot of work in it the clouds lie on one great sheet: it's become one thing.)
            let one = show(work, from: 3.2)
            if one > 0 { paper(cloud(mid, (hi.x - lo.x) / 2 * zoom * 1.02 * one, (hi.y - lo.y) / 2 * zoom * 1.0 * one, turn: 0.2, key: seed * 7 + 12), sky.mix(clouds[0], 1.1), lift: 1.3, in: ctx) }
            for (j, g) in groups.enumerated() where radius[j] > 0 {
                let c = scr(centres[j]), r = radius[j] * zoom, base = tint(clouds[1 + j % 3], j), lf = worked(j)
                paper(cloud(c, r * 1.12, r * 1.02, turn: lhash(j, seed) * 3, key: seed * 13 + j), base.mix(sky, 0.25), in: ctx)
                paper(cloud(c, r * 0.72, r * 0.66, turn: lhash(j, seed + 5) * 3, key: seed * 17 + j), base, lift: 0.6, in: ctx)
                let a = show(lf, from: 2), b = show(lf, from: 3.6)
                if a > 0 { paper(cloud(c, r * 0.46 * a, r * 0.42 * a, turn: lhash(j, seed + 6) * 3, key: seed * 19 + j), base.mix(cream, 0.2), lift: 0.5, in: ctx) }
                if b > 0 { paper(cloud(c, r * 0.25 * b, r * 0.23 * b, turn: lhash(j, seed + 7) * 3, key: seed * 23 + j), base.mix(cream, 0.42), lift: 0.4, in: ctx) }
                if names { labels.append((script.folders[g.folder], CGPoint(x: c.x, y: c.y + r * 1.05 + 8), lsmooth((gt - born(g.notes) - 0.2) / 0.5), j)) }
                for (k, i) in g.notes.enumerated() where script.nodes[i].birth <= gt {
                    let rr = 15 * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963 + lhash(j, seed + 9) * 6 + 0.03 * t
                    where_[i] = scr(CGPoint(x: centres[j].x + cos(a) * rr, y: centres[j].y + sin(a) * rr))
                }
            }
            for (k, i) in loose.enumerated() where script.nodes[i].birth <= gt {
                where_[i] = scr(CGPoint(x: c0.x + (lhash(i, 3) - 0.5) * (hi.x - lo.x) * 0.9, y: c0.y + (lhash(k, 4) - 0.5) * (hi.y - lo.y) * 0.9))
            }

        case .comet:
            // A comet crossing the sky through the month. Each note is left behind where the comet
            // was when it was made, on its folder's strand of the tail: the tail is the month.
            // (More folders fan the tail wider, so it starts further in from the corner.)
            let fan = min(2, max(1, (Double(groups.count) / 5).squareRoot()))
            let from = CGPoint(x: mid.x - half.width * (0.74 - 0.2 * (fan - 1)), y: mid.y - half.height * (0.42 - 0.34 * (fan - 1))), to = CGPoint(x: mid.x + half.width * 0.6, y: mid.y + half.height * 0.66)
            func path(_ time: Double) -> CGPoint {
                let u = min(1, max(0, time / growth)), bow = sin(.pi * u) * 90
                return CGPoint(x: from.x + (to.x - from.x) * u + bow * 0.5, y: from.y + (to.y - from.y) * u - bow)
            }
            let head = path(gt)
            let dir = CGPoint(x: (to.x - from.x) / hypot(to.x - from.x, to.y - from.y), y: (to.y - from.y) / hypot(to.x - from.x, to.y - from.y))
            let across = CGPoint(x: -dir.y, y: dir.x)
            func strand(_ j: Int, _ time: Double) -> CGPoint {
                // Further back along the tail the strands fan apart.
                let p = path(time), age = (gt - time) / growth
                let off = (Double(j) - Double(groups.count - 1) / 2) * (16 + 150 * age) / Double(max(1, groups.count - 1)) * 2.2 * fan
                return CGPoint(x: p.x + across.x * off, y: p.y + across.y * off - 46 * age * age)
            }
            for (j, g) in groups.enumerated() {
                let first = born(g.notes)
                guard first <= gt else { continue }
                let thick = (0.7 + 0.3 * min(1, worked(j) / 4)) / fan.squareRoot()
                var one: [CGPoint] = [], other: [CGPoint] = []
                for k in 0...20 {
                    let time = first + (gt - first) * Double(k) / 20
                    let p = strand(j, time), w = (5 + 15 * sin(.pi * min(1, 0.1 + 0.9 * Double(k) / 20) / 2) * min(1, alive(g.notes) / 2)) * thick
                    one.append(CGPoint(x: p.x + across.x * w, y: p.y + across.y * w)); other.append(CGPoint(x: p.x - across.x * w, y: p.y - across.y * w))
                }
                paper(one + other.reversed(), tint(clouds[1 + j % 3], j), in: ctx)
                // (Its name where the strand begins, on the side away from the others.)
                if names {
                    let end = strand(j, first), side: Double = Double(j) < Double(groups.count - 1) / 2 ? -1 : 1
                    labels.append((script.folders[g.folder], CGPoint(x: end.x + across.x * side * 46 - dir.x * 20, y: end.y + across.y * side * 46 - dir.y * 20 - 20), lsmooth((gt - first - 0.6) / 0.5), j))
                }
                for i in g.notes where script.nodes[i].birth <= gt {
                    let p = strand(j, script.nodes[i].birth)
                    where_[i] = CGPoint(x: p.x + across.x * (lhash(i, 5) - 0.5) * 26, y: p.y + across.y * (lhash(i, 5) - 0.5) * 26)
                }
            }
            for i in loose where script.nodes[i].birth <= gt { where_[i] = path(script.nodes[i].birth) }
            // Its head: sheets of paper, the lightest on top, larger and with rays as the work adds up.
            let big = 0.85 + 0.12 * min(6, work)
            let far2 = show(work, from: 4.5), near = show(work, from: 1.6)
            if far2 > 0 { rays(head, 62 * big * 1.75 * far2, lean: 1, axis: 0, turn: -0.07 * t, points: 20, clouds[2], in: ctx) }
            if near > 0 { rays(head, 62 * big * 1.32 * near, lean: 1, axis: 0, turn: 0.1 * t, points: 14, clouds[3].mix(peach, 0.3), in: ctx) }
            heart = head
            paper(cloud(head, 62 * big, 62 * big, key: seed * 7 + 6), clouds[3], in: ctx)
            paper(cloud(head, 44 * big, 44 * big, key: seed * 7 + 7), peach, lift: 0.7, in: ctx)
            paper(cloud(head, 24 * big, 24 * big, key: seed * 7 + 8), cream, lift: 0.5, in: ctx)
        }
        return (where_, labels, zoom, heart)
        }

        let cam = camera(t, mid: mid)
        /// Draws through the camera. Things further away move less: that's what gives it depth.
        func through(_ depth: Double, _ draw: () -> Void) {
            let k = 1 + (cam.k - 1) * depth
            ctx.saveGState()
            ctx.translateBy(x: mid.x, y: mid.y)
            ctx.scaleBy(x: k, y: k)
            ctx.translateBy(x: -(mid.x + (cam.on.x - mid.x) * depth), y: -(mid.y + (cam.on.y - mid.y) * depth))
            draw()
            ctx.restoreGState()
        }
        func seen(_ p: CGPoint) -> CGPoint { CGPoint(x: mid.x + (p.x - cam.on.x) * cam.k, y: mid.y + (p.y - cam.on.y) * cam.k) }
        // Far clouds, two big sheets, and the small stars of the sky itself.
        through(0.25) {
            paper(cloud(CGPoint(x: mid.x - 190 + 14 * sin(0.2 * t), y: mid.y + 150), 620, 420, turn: 0.4, key: seed * 7 + 1), sky.mix(clouds[0], 0.55), lift: 1.6, in: ctx)
        }
        through(0.45) {
            paper(cloud(CGPoint(x: mid.x + 230 - 12 * sin(0.17 * t), y: mid.y - 170), 500, 350, turn: -0.5, key: seed * 7 + 2), sky.mix(clouds[0], 0.9), lift: 1.4, in: ctx)
        }
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        through(0.15) {
            for k in 0..<140 {
                let p = CGPoint(x: -120 + lhash(k, seed + 1) * (W + 240), y: canvas.bottom + 200 + lhash(k, seed + 2) * (H - canvas.bottom - 100))
                let r = 1.3 + 2.4 * pow(lhash(k, seed + 3), 3)
                ctx.setFillColor(cream.cg(0.25 + 0.4 * lhash(k, seed + 4) * (0.7 + 0.3 * sin(1.7 * t + Double(k)))))
                ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2))
            }
        }
        ctx.saveGState()
        ctx.translateBy(x: mid.x, y: mid.y)
        ctx.scaleBy(x: cam.k, y: cam.k)
        ctx.translateBy(x: -cam.on.x, y: -cam.on.y)
        let made = build()
        let where_ = made.at, labels = made.labels, zoom = made.zoom, heart = made.heart

        // The work: a speck of paper for every time a note was written in, amber when it was you
        // and blue when it was your AI. It flies out from its note as it happens, and stays.
        let u = min(1.35, max(0.62, zoom.squareRoot())) / pow(size, 0.3)
        let white = GR(0xFFFFFF)
        // When the month is over, one wave goes out from the heart and everything it passes
        // lights for a moment: all of the work at once.
        let since = t - growth, reach = hypot(W, H) * 0.62
        let wave = (since - 0.1) / 1.1 * reach
        func lit(_ p: CGPoint) -> Double {
            guard since > 0.1, wave < reach * 1.25 else { return 0 }
            let d = (hypot(p.x - heart.x, p.y - heart.y) - wave) / 80
            return exp(-d * d)
        }
        for (i, n) in script.nodes.enumerated() where n.birth <= gt && n.edits.count > 1 {
            let p = where_[i], a0 = lhash(i, 31) * 6.283
            for k in 1..<n.edits.count {
                let age = gt - n.edits[k]
                if age < 0 { break }
                let fresh = max(0, 1 - age / 0.5)
                let a = a0 + Double(k) * 2.399963, rad = (8 + 4.6 * Double(k).squareRoot()) * u * lbackOut(age / 0.4)
                let q = CGPoint(x: p.x + cos(a) * rad, y: p.y + sin(a) * rad)
                let flash = lit(q)
                let h = lhash(i * 131 + k, 7), sz = (2.0 + 1.8 * h) * u * (1 + 1.2 * fresh + 1.5 * flash)
                let alpha = t <= growth ? 0.92 : 0.66 + 0.3 * sin(2.6 * t + Double(k) * 1.7 + Double(i))
                ctx.move(to: CGPoint(x: q.x, y: q.y + sz))
                ctx.addLine(to: CGPoint(x: q.x + sz * 0.8, y: q.y))
                ctx.addLine(to: CGPoint(x: q.x, y: q.y - sz))
                ctx.addLine(to: CGPoint(x: q.x - sz * 0.8, y: q.y))
                ctx.closePath()
                ctx.setFillColor((n.aiEdits[k] ? ai : you).mix(white, min(1, 0.3 * h + 0.6 * fresh + 0.7 * flash)).cg(min(1, alpha + flash)))
                ctx.fillPath()
            }
        }

        // The notes: paper stars, amber for yours, blue where your AI helped, in more layers the
        // more they were written in, and each one flares as it's written in.
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            var done = 0.0, last = n.birth
            for e in n.edits where e <= gt { done += 1; last = e }
            let pulse = t <= growth ? exp(-(gt - last) / 0.35) : 0.25 + 0.25 * sin(2.2 * t + Double(i)) + 0.9 * lit(where_[i])
            let r = min(30, 7 + 1.9 * done.squareRoot()) * u * lbackOut((gt - n.birth) / 0.35) * (1 + 0.4 * pulse) * (1 + 0.5 * (spot[i] ?? 0))
            let helped = lsmooth((gt - aiFrom[i]) / 0.35)
            if let a = spot[i] {
                // (The note this moment is about: a ring of paper round it, and it stands larger.)
                let rr = max(34, r * 2.1) * (0.8 + 0.2 * a)
                ctx.setStrokeColor(cream.cg(0.95 * a))
                ctx.setLineWidth(4.5)
                ctx.strokeEllipse(in: CGRect(x: where_[i].x - rr, y: where_[i].y - rr, width: rr * 2, height: rr * 2))
            }
            note(where_[i], r, turn: lhash(i, 21) * 1.5 + 0.25 * sin(0.8 * t + Double(i)), you.mix(ai, helped).mix(white, min(0.8, 0.35 * pulse)), edits: done, in: ctx)
        }
        ctx.restoreGState()
        // (When the camera is close, nothing bright lies under the mark and the key at the top.)
        let shade = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [sky.cg(0.9), sky.cg(0)] as CFArray, locations: [0, 1])!
        ctx.saveGState()
        ctx.clip(to: CGRect(x: 0, y: H - canvas.top - 190, width: W, height: canvas.top + 190))
        ctx.drawLinearGradient(shade, start: CGPoint(x: 0, y: H - canvas.top - 60), end: CGPoint(x: 0, y: H - canvas.top - 190), options: [.drawsBeforeStartLocation])
        ctx.restoreGState()
        // (Names never lie over one another: where two would, they move apart, up and down.)
        var boxes = labels.map { l -> CGRect in
            let w = FilmKit.width(l.name, 27, 0.3) + 26
            let p = seen(l.at)
            return CGRect(x: min(W - 30 - w, max(30, p.x - w / 2)), y: p.y, width: w, height: 40)
        }
        for _ in 0..<40 {
            var moved = false
            for a in boxes.indices where labels[a].a > 0.02 { for b in boxes.indices where b > a && labels[b].a > 0.02 {
                guard boxes[a].insetBy(dx: -8, dy: -5).intersects(boxes[b]) else { continue }
                let over = (boxes[a].height + 10 - abs(boxes[a].midY - boxes[b].midY)) / 2 + 0.5
                let up: Double = boxes[a].midY >= boxes[b].midY ? 1 : -1
                boxes[a].origin.y += up * over; boxes[b].origin.y -= up * over
                moved = true
            } }
            if !moved { break }
        }
        // (A name the camera has carried up under the mark and the key fades out there.)
        for (k, l) in labels.enumerated() { tag(l.name, at: CGPoint(x: boxes[k].midX, y: boxes[k].minY), alpha: l.a * (1 - lsmooth((boxes[k].maxY - (H - canvas.top - 160)) / 50)), hot: max(heat[l.group], named[l.group]), in: ctx) }

        // Nothing under the words but the sky.
        let fade = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [sky.cg(1), sky.cg(0)] as CFArray, locations: [0, 1])!
        ctx.setFillColor(sky.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: canvas.bottom + 250))
        ctx.saveGState()
        ctx.clip(to: CGRect(x: 0, y: canvas.bottom + 250, width: W, height: 80))
        ctx.drawLinearGradient(fade, start: CGPoint(x: 0, y: canvas.bottom + 250), end: CGPoint(x: 0, y: canvas.bottom + 330), options: [])
        ctx.restoreGState()
    }
}
