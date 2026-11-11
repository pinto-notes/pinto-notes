import CoreGraphics
import Foundation

// Small helpers for the cut-paper scenes: a number in 0..<1 that's always the same for the same
// two integers, a smooth step, and a step that overshoots a little before it settles.
func filmHash(_ a: Int, _ b: Int = 0) -> Double {
    var x = UInt64(truncatingIfNeeded: a &* 7919 &+ b &* 104_729 &+ 13) &+ 0x9E37_79B9_7F4A_7C15
    x = (x ^ (x >> 30)) &* 0xBF58_476D_1CE4_E5B9
    x = (x ^ (x >> 27)) &* 0x94D0_49BB_1331_11EB
    x ^= x >> 31
    return Double(x >> 11) / Double(1 << 53)
}
func filmSmooth(_ x: Double) -> Double { let c = min(1, max(0, x)); return c * c * (3 - 2 * c) }
func filmBackOut(_ x: Double) -> Double { let c = min(1, max(0, x)) - 1; return 1 + c * c * (2.7 * c + 1.7) }

extension FilmScript {
    /// A number that's this notebook's own and never changes: its sky's colour comes from it.
    var seed: Int {
        guard let id = nodes.first?.id else { return 0 }
        return withUnsafeBytes(of: id.uuid) { $0.reduce(0) { ($0 &* 31 &+ Int($1)) & 0xFFFF } }
    }
}

// Your notebook as something in space, cut from paper. What it is comes from how you wrote
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
    /// A folder's parts: its own notes first, then each folder inside it (largest first), each
    /// with its notes. A folder without any has one part. `partOf` is each note's part.
    private var parts: [[(sub: Int, notes: [Int])]] = []
    private var partOf: [Int] = []
    /// In the nebula, where each part sits in its folder's cloud, and how far the whole cloud reaches.
    private var partAt: [[CGPoint]] = []
    private var outer: [Double] = []
    private func partSize(_ j: Int, _ notes: Double) -> Double { cells[j] * notes.squareRoot() + cells[j] * 0.7 + 6 }
    /// A name on its slip: a folder's, or a smaller one for a folder inside it.
    private typealias Label = (name: String, at: CGPoint, a: Double, group: Int, small: Bool)
    /// Every time anything was written in, in order: for how much work there is at a moment.
    private let allEdits: [Double]
    private var groupEdits: [[Double]] = []
    /// While it's only being laid out (to know where the camera should look), nothing is drawn.
    private var quiet = false
    /// What the picture has to hold, in its own units: how far the spiral reaches, or the box
    /// around the nebula's clouds. Fitted afresh each frame, it jumped every time a note landed
    /// further out, so the camera follows a path made from all of them ahead of time instead.
    private struct Fit { var far = 0.0, lo = CGPoint.zero, hi = CGPoint.zero }
    /// Set while that path is made: the fit as it is, not as the camera holds it.
    private var raw = false
    private var rawFit = Fit()
    private var path: (canvas: FilmCanvas, fits: [Fit])?
    /// A folder's spiral arm: how much of it is there (0 to 1) and how wide it is.
    /// Emil, 11-11: it came too early; it should mean so much is going on that it blends. So it
    /// forms only once a folder is crowded: its notes, and every eight times they were written in
    /// counted as one more. Until then they're loose stars on the spiral's path. It comes in at
    /// half its width (never a thin line) and widens as there's more.
    static func arm(notes: Double, edits: Int) -> (appear: Double, width: Double) {
        let crowd = notes + Double(edits) / 8, from = 10.0, full = 30.0
        return (filmSmooth((crowd - from) / 4), 0.5 + 0.5 * filmSmooth((crowd - from) / (full - from)))
    }
    /// Which burst each note brought in arrives in (-1 for the rest).
    private lazy var bangOf: [Int] = script.nodes.map { n in
        n.imported ? script.bangs.firstIndex { $0.folder == n.folder && $0.sub == n.sub } ?? -1 : -1
    }
    /// Where each burst is, in the frame (by burst): the middle of where what it brings
    /// will be once it's settled, found by laying that moment out ahead of time.
    private var bangCentres: (canvas: FilmCanvas, at: [Int: CGPoint])?
    private var finding = false
    private var found: [Int: CGPoint] = [:]
    private func centres(_ canvas: FilmCanvas) -> [Int: CGPoint] {
        if let bangCentres, bangCentres.canvas == canvas { return bangCentres.at }
        guard let last = script.bangs.last else { return [:] }
        let none = CGContext(data: nil, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        quiet = true; finding = true
        drawBehind(min(growth, last.at + 1.2), canvas: canvas, in: none)
        quiet = false; finding = false
        bangCentres = (canvas, found)
        return found
    }
    /// How the frame was last drawn: its scale, the point at its middle, and how far what's in it
    /// reached past the frame (in the picture's units; 0 when it all fitted).
    private(set) var shot = (zoom: 1.0, centre: CGPoint.zero, spill: 0.0)
    /// In the nebula every note has room of its own: how far apart a folder's notes sit, by how
    /// large its stars will be, so no star lies on another and each one's specks stay its own.
    private var cells: [Double] = []
    private var noteCell: [Double] = []
    /// A star's size there, by how often it's been written in (in the picture's own units).
    private func starSize(_ edits: Double) -> Double { min(24, 6 + 1.6 * edits.squareRoot()) }
    private func cloudSize(_ j: Int, _ notes: Double) -> Double { cells[j] * notes.squareRoot() + cells[j] * 1.3 + 14 }

    /// What each is called: "My notebook is a comet".
    static func name(of form: FilmForm) -> String {
        switch form { case .comet: "a comet"; case .nebula: "a nebula"; case .spiral: "a spiral galaxy" }
    }

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
        cells = groups.map { g in
            let sizes = g.notes.map { starSize(Double(script.nodes[$0].edits.count)) }
            return max(15, 1.3 * (0.5 * sizes.reduce(0, +) / Double(max(1, sizes.count)) + 0.5 * (sizes.max() ?? 6)))
        }
        noteCell = slot.map { $0.group >= 0 ? cells[$0.group] : 15 }
        partOf = Array(repeating: 0, count: script.nodes.count)
        parts = groups.map { g in
            let by = Dictionary(grouping: g.notes) { script.nodes[$0].sub }
            let inside = by.keys.filter { $0 >= 0 }.sorted { (by[$0]!.count, -$0) > (by[$1]!.count, -$1) }
            return [(-1, by[-1] ?? [])] + inside.map { ($0, by[$0]!) }
        }
        for list in parts { for (p, part) in list.enumerated() { for i in part.notes { partOf[i] = p } } }
        // (For the nebula: a folder's own notes at the middle of its cloud, and a smaller cloud
        // around them for each folder inside it, kept apart by their sizes.)
        for j in groups.indices {
            let list = parts[j], core = list[0].notes.count
            guard list.count > 1 else { partAt.append([.zero]); outer.append(cloudSize(j, Double(groups[j].notes.count))); continue }
            let rc = core > 0 ? partSize(j, Double(core)) : 0
            var ps = list.indices.map { p -> (c: CGPoint, r: Double) in
                guard p > 0 else { return (.zero, rc) }
                let r = partSize(j, Double(list[p].notes.count)), a = Double(p) * 2.399963 + filmHash(j, seed + 31) * 6
                return (CGPoint(x: cos(a) * (rc + r + 10), y: sin(a) * (rc + r + 10)), r)
            }
            if core == 0 && list.count == 2 { ps[1].c = .zero }
            for _ in 0..<100 {
                for a in ps.indices { for b in ps.indices where b > a && (a > 0 || core > 0) {
                    let d = CGPoint(x: ps[b].c.x - ps[a].c.x, y: ps[b].c.y - ps[a].c.y)
                    let len = max(0.5, hypot(d.x, d.y)), want = ps[a].r + ps[b].r + 10
                    guard len < want else { continue }
                    let push = (want - len) / len
                    if a == 0 { ps[b].c.x += d.x * push; ps[b].c.y += d.y * push; continue }
                    ps[a].c.x -= d.x * push / 2; ps[a].c.y -= d.y * push / 2
                    ps[b].c.x += d.x * push / 2; ps[b].c.y += d.y * push / 2
                } }
                for p in ps.indices.dropFirst() { ps[p].c.x *= 0.98; ps[p].c.y *= 0.98 }
            }
            // (The cloud is centred on what's in it, so none of it is empty on one side.)
            let held = ps.filter { $0.r > 0 }
            let lo = CGPoint(x: held.map { $0.c.x - $0.r }.min()!, y: held.map { $0.c.y - $0.r }.min()!)
            let hi = CGPoint(x: held.map { $0.c.x + $0.r }.max()!, y: held.map { $0.c.y + $0.r }.max()!)
            let mid = CGPoint(x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2)
            for p in ps.indices { ps[p].c.x -= mid.x; ps[p].c.y -= mid.y }
            partAt.append(ps.map(\.c))
            outer.append(held.map { hypot($0.c.x - mid.x, $0.c.y - mid.y) + $0.r }.max()! + 12)
        }
        // (For the nebula: where each folder's cloud sits, kept apart by their sizes.)
        var cs = groups.indices.map { j -> (c: CGPoint, r: Double) in
            let r = 120 * Double(j).squareRoot(), a = Double(j) * 2.399963 + Double(seed)
            return (CGPoint(x: r * cos(a) * 1.15, y: r * sin(a) * 0.85), outer[j])
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
            let wob = 1 + 0.09 * sin(3 * a + filmHash(key, 1) * 6) + 0.06 * sin(5 * a + filmHash(key, 2) * 6) + 0.035 * sin(9 * a + filmHash(key, 3) * 6)
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
    private func tag(_ name: String, at p: CGPoint, alpha: Double, hot: Double = 0, small: Bool = false, in ctx: CGContext) {
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
        let font = small ? 21.0 : 27, w = FilmKit.width(name, font, 0.3) + (small ? 20 : 26), h = small ? 31.0 : 40
        let x = min(W - 30 - w, max(30, p.x - w / 2))
        let box = CGRect(x: x, y: p.y, width: w, height: h)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: -3 * abs(ctx.ctm.a)), blur: 8 * abs(ctx.ctm.a), color: CGColor(gray: 0, alpha: 0.45))
        ctx.addPath(CGPath(roundedRect: box, cornerWidth: small ? 6 : 7, cornerHeight: small ? 6 : 7, transform: nil))
        // (A folder inside one: a paler slip.)
        ctx.setFillColor(cream.mix(sky, small ? 0.16 : 0).mix(you, 0.85 * hot).cg())
        ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(name, font, 0.3, inkDark.cg(alpha), at: CGPoint(x: x + (small ? 10 : 13), y: p.y + (small ? 8.5 : 11)), in: ctx)
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
        (1.14 - 0.14 * filmSmooth(min(t, growth) / growth), mid)
    }

    /// The camera's path: the fit fifteen times a second, then eased. It looks ahead, so
    /// it's already drawing back when a note lands further out, and it holds what was brought in
    /// from the start, so the burst flies out into a frame that's ready for it.
    private static let pathRate = 15.0
    private func fits(_ canvas: FilmCanvas) -> [Fit] {
        if let path, path.canvas == canvas { return path.fits }
        let none = CGContext(data: nil, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        let settled = script.bangs.last.map { min(growth, $0.at + 1.2) } ?? 0
        let n = Int((growth * Self.pathRate).rounded(.up)) + 1
        quiet = true; raw = true
        let measured = (0..<n).map { i -> Fit in
            drawBehind(max(settled, min(growth, Double(i) / Self.pathRate)), canvas: canvas, in: none)
            return rawFit
        }
        quiet = false; raw = false
        // Ahead: the most it will have to hold in the next moment. Then eased, in proportion (a
        // small sky doubling is as big a move as a large one doubling).
        let ahead = Int(1.0 * Self.pathRate)
        var wide = measured
        for i in 0..<n {
            let next = measured[i..<min(n, i + ahead + 1)]
            wide[i].far = next.map(\.far).max()!
            wide[i].lo = CGPoint(x: next.map(\.lo.x).min()!, y: next.map(\.lo.y).min()!)
            wide[i].hi = CGPoint(x: next.map(\.hi.x).max()!, y: next.map(\.hi.y).max()!)
        }
        // Never faster than a fifth wider a second: a long way out begins early instead of in a rush.
        let slowest = exp(-log(1.2) / Self.pathRate)
        for i in stride(from: n - 2, through: 0, by: -1) {
            wide[i].far = max(wide[i].far, wide[i + 1].far * slowest)
            let c = CGPoint(x: (wide[i].lo.x + wide[i].hi.x) / 2, y: (wide[i].lo.y + wide[i].hi.y) / 2)
            let hx = max((wide[i].hi.x - wide[i].lo.x) / 2, (wide[i + 1].hi.x - wide[i + 1].lo.x) / 2 * slowest)
            let hy = max((wide[i].hi.y - wide[i].lo.y) / 2, (wide[i + 1].hi.y - wide[i + 1].lo.y) / 2 * slowest)
            wide[i].lo = CGPoint(x: c.x - hx, y: c.y - hy); wide[i].hi = CGPoint(x: c.x + hx, y: c.y + hy)
        }
        let sigma = 0.6 * Self.pathRate, reach = Int(3 * sigma)
        let weights = (-reach...reach).map { exp(-Double($0 * $0) / (2 * sigma * sigma)) }
        let sum = weights.reduce(0, +)
        let eased = (0..<n).map { i -> Fit in
            var far = 0.0, mx = 0.0, my = 0.0, sx = 0.0, sy = 0.0
            for (k, w) in zip(-reach...reach, weights) {
                let g = wide[min(n - 1, max(0, i + k))], v = w / sum
                far += log(max(1, g.far)) * v
                mx += (g.lo.x + g.hi.x) / 2 * v; my += (g.lo.y + g.hi.y) / 2 * v
                sx += log(max(1, (g.hi.x - g.lo.x) / 2)) * v; sy += log(max(1, (g.hi.y - g.lo.y) / 2)) * v
            }
            return Fit(far: exp(far), lo: CGPoint(x: mx - exp(sx), y: my - exp(sy)), hi: CGPoint(x: mx + exp(sx), y: my + exp(sy)))
        }
        path = (canvas, eased)
        return eased
    }
    /// Where the camera's path is at `gt`, between its points on a smooth curve.
    private func fit(_ gt: Double, _ canvas: FilmCanvas) -> Fit {
        let list = fits(canvas)
        let s = min(Double(list.count - 1), max(0, gt * Self.pathRate)), i = Int(s), x = s - Double(i)
        func p(_ k: Int) -> Fit { list[min(list.count - 1, max(0, k))] }
        func cr(_ a: Double, _ b: Double, _ c: Double, _ d: Double) -> Double {
            0.5 * (2 * b + (c - a) * x + (2 * a - 5 * b + 4 * c - d) * x * x + (3 * b - a - 3 * c + d) * x * x * x)
        }
        let a = p(i - 1), b = p(i), c = p(i + 1), d = p(i + 2)
        return Fit(far: cr(a.far, b.far, c.far, d.far),
                   lo: CGPoint(x: cr(a.lo.x, b.lo.x, c.lo.x, d.lo.x), y: cr(a.lo.y, b.lo.y, c.lo.y, d.lo.y)),
                   hi: CGPoint(x: cr(a.hi.x, b.hi.x, c.hi.x, d.hi.x), y: cr(a.hi.y, b.hi.y, c.hi.y, d.hi.y)))
    }

    /// The smallest of them, rounded off where one takes over from another, so the camera eases
    /// into its closest instead of stopping there. (It only ever draws back a little further.)
    private static func least(_ k: [Double]) -> Double {
        let low = k.min()!
        return low / pow(k.map { pow(low / $0, 6) }.reduce(0, +), 1.0 / 6)
    }

    private var placedNow: [CGPoint] = []
    /// Where every note is at `t` (in the frame, before the camera's own move), without drawing it.
    func placed(at t: Double, canvas: FilmCanvas) -> [CGPoint] {
        _ = shot(at: t, canvas: canvas)
        return placedNow
    }

    /// The frame at `t` as the camera sees it (its scale and middle), without drawing it.
    func shot(at t: Double, canvas: FilmCanvas) -> (zoom: Double, centre: CGPoint, spill: Double) {
        let none = CGContext(data: nil, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        _ = fits(canvas)
        quiet = true
        drawBehind(t, canvas: canvas, in: none)
        quiet = false
        return shot
    }

    // MARK: Drawing

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let H = canvas.height, gt = min(t, growth)
        let held: Fit? = raw || form == .comet ? nil : fit(gt, canvas)
        if !quiet { ctx.setFillColor(sky.cg()); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H)) }
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
        let going = min(1, most_ / 2.5) * (1 - filmSmooth((t - growth + 0.5) / 0.5))
        heat = heat.map { most_ > 0 ? pow($0 / most_, 1.6) * going : 0 }
        // (Gentler on a big notebook, so a lit cloud never washes out the stars in it.)
        let glowBy = 0.42 / (1 + Double(script.nodes.count) / 120)
        func tint(_ c: GR, _ j: Int) -> GR { c.mix(cream, glowBy * heat[j]).mix(sky, 0.2 * going * (1 - heat[j])) }
        /// Set where stars are sized in the picture's own units (the nebula): how large a unit is drawn.
        var unit: Double?
        // Where every note is, by the kind of thing this is.
        func build() -> (at: [CGPoint], labels: [Label], zoom: Double, heart: CGPoint) {
        var where_ = [CGPoint](repeating: .zero, count: script.nodes.count)
        var labels: [Label] = []
        var zoom = 1.0
        var heart = mid
        /// How much of a note is there: 0 before it's made, 1 while it is, and 0 again once it's been removed.
        func there(_ i: Int) -> Double {
            let n = script.nodes[i]
            guard n.birth <= gt else { return 0 }
            return filmSmooth((gt - n.birth) / 0.45) * (1 - filmSmooth((t - (n.gone ?? .infinity)) / 0.5))
        }
        func alive(_ notes: [Int]) -> Double { notes.reduce(0) { $0 + there($1) } }
        func born(_ notes: [Int]) -> Double { notes.first.map { script.nodes[$0].birth } ?? .infinity }
        let most = Double(max(1, groups.first?.notes.count ?? 1))
        // How much work is in it so far, all of it and folder by folder.
        let work = level(upTo(allEdits, gt), per: 60)
        func worked(_ j: Int) -> Double { level(upTo(groupEdits[j], gt), per: 30) }
        func show(_ l: Double, from: Double) -> Double { filmSmooth((l - from) / 0.6) }

        switch form {
        case .spiral:
            // An arm of paper for each folder, as long as what's in it, winding out from the middle.
            // The more notes, the further the arms wind; the more work, the more there is at its heart.
            let lean = 0.62 + 0.3 * filmHash(seed, 11), axis = filmHash(seed, 12) * 3.14, way: Double = filmHash(seed, 13) < 0.5 ? 1 : -1
            let wind = min(5.2, 1.3 + 0.7 * filmHash(seed, 14) + 1.3 * log2(max(1, Double(script.nodes.count) / 45))), spin = way * 0.05 * t
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
            // (A folder inside one is a branch: its notes come off the arm to one side, further
            // out the further along it they are, with its name at the branch's tip.)
            func branch(_ p: Int, _ u: Double) -> Double { (p % 2 == 1 ? 1 : -1) * wide * (1.1 + 1.5 * u) }
            var tips: [(group: Int, part: Int, s: Double, born: Double)] = []
            for (j, g) in groups.enumerated() {
                var k = 0
                for (p, part) in parts[j].enumerated() {
                    for (kk, i) in part.notes.enumerated() {
                        let s = reach(j) * (Double(k) + 0.8) / (Double(g.notes.count) + 0.4)
                        k += 1
                        if p > 0, kk == part.notes.count - 1 { tips.append((j, p, s, born(part.notes))) }
                        guard script.nodes[i].birth <= gt else { continue }
                        let off = p == 0 ? (filmHash(i, 15) - 0.5) * 2 * wide * (0.72 - 0.3 * s)
                            : branch(p, (Double(kk) + 0.5) / Double(part.notes.count)) + (filmHash(i, 15) - 0.5) * wide * 0.6
                        where_[i] = at(j, s, off)
                        far = max(far, hypot(where_[i].x, where_[i].y) + 50)
                    }
                }
            }
            for (k, i) in loose.enumerated() where script.nodes[i].birth <= gt {
                let r = 12 * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963 + spin
                where_[i] = CGPoint(x: cos(a) * r, y: sin(a) * r * lean)
            }
            rawFit.far = far
            if let held { far = held.far }
            zoom = held == nil ? min(2.5 / size, min(half.width, half.height) / far) : Self.least([2.5 / size, min(half.width, half.height) / far])
            shot.spill = max(0, rawFit.far * zoom - min(half.width, half.height))
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
                let (appear, formed) = Self.arm(notes: got, edits: self.upTo(groupEdits[j], gt))
                let upTo = reach(j) * min(1, (got + 0.6) / (Double(g.notes.count) + 0.4)) + 0.03
                let w0 = wide * (0.7 + 0.3 * min(1, worked(j) / 4)), col = tint(clouds[2 + j % 2], j)
                func band(_ part: Double, _ c: GR, lift: Double) {
                    var one: [CGPoint] = [], other: [CGPoint] = []
                    for k in 0...40 {
                        let s = upTo * Double(k) / 40
                        let w = w0 * part * (1 - 0.35 * s) * sin(.pi * min(1, 0.12 + 0.88 * (1 - Double(k) / 40))) * min(1, got) * formed
                        one.append(scr(at(j, s, w))); other.append(scr(at(j, s, -w)))
                    }
                    paper(one + other.reversed(), c, lift: lift, in: ctx)
                }
                if appear > 0.01 {
                    ctx.saveGState()
                    ctx.setAlpha(appear)
                    ctx.beginTransparencyLayer(auxiliaryInfo: nil)
                    band(1, col, lift: 1)
                    // (A lighter strip down an arm that's been worked in a lot.)
                    let lit = show(worked(j), from: 2.2)
                    if lit > 0 { band(0.42 * lit, col.mix(cream, 0.26), lift: 0.4) }
                    ctx.endTransparencyLayer()
                    ctx.restoreGState()
                }
                // (Its name a short step past the arm's tip, however far the arm winds.)
                let step = 44 / zoom / hypot(full - core, wind * (core + (full - core) * upTo))
                if names { labels.append((script.folders[g.folder], scr(at(j, upTo + step, 0)), filmSmooth((gt - born(g.notes) - 0.2) / 0.5), j, false)) }
            }
            if names {
                for tip in tips where tip.born <= gt {
                    let sub = parts[tip.group][tip.part].sub
                    labels.append((script.subfolders[sub].name, scr(at(tip.group, tip.s, branch(tip.part, 1) + (tip.part % 2 == 1 ? 1 : -1) * 24)), filmSmooth((gt - tip.born - 0.2) / 0.5), tip.group, true))
                }
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
            var partNow = parts.map { [Double](repeating: 0, count: $0.count) }
            for (j, g) in groups.enumerated() {
                let got = alive(g.notes)
                // (As wide as the furthest note still in it: it grows, and it shrinks when notes are removed.)
                func reach(_ notes: [Int]) -> Double { notes.enumerated().reduce(0.0) { max($0, (Double($1.offset) + 1) * min(1, there($1.element) * 2)) } }
                if parts[j].count == 1 {
                    radius[j] = got > 0 ? cloudSize(j, max(got, reach(g.notes))) * min(1, got * 1.5) : 0
                } else {
                    // (With folders inside it, as far out as its parts reach, each as wide as what's in it.)
                    partNow[j] = parts[j].map { part in
                        let n = alive(part.notes)
                        return n > 0 ? partSize(j, max(n, reach(part.notes))) * min(1, n * 1.5) : 0
                    }
                    let edge = zip(partAt[j], partNow[j]).filter { $0.1 > 0 }.map { hypot($0.0.x, $0.0.y) + $0.1 }.max()
                    radius[j] = edge.map { $0 + 12 } ?? 0
                }
                guard born(g.notes) <= gt + 0.8 else { continue }
                lo.x = min(lo.x, centres[j].x - radius[j] - 20); hi.x = max(hi.x, centres[j].x + radius[j] + 20)
                lo.y = min(lo.y, centres[j].y - radius[j] - 20); hi.y = max(hi.y, centres[j].y + radius[j] + 60)
            }
            rawFit.lo = lo; rawFit.hi = hi
            if let held { lo = held.lo; hi = held.hi }
            let fits: [Double] = [3.4, half.width * 2 / (hi.x - lo.x), half.height * 2 / (hi.y - lo.y)]
            zoom = held == nil ? fits.min()! : Self.least(fits)
            unit = zoom
            let c0 = CGPoint(x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2)
            shot.centre = c0
            shot.spill = max(0, (c0.x - rawFit.lo.x) * zoom - half.width, (rawFit.hi.x - c0.x) * zoom - half.width,
                             (c0.y - rawFit.lo.y) * zoom - half.height, (rawFit.hi.y - c0.y) * zoom - half.height)
            func scr(_ p: CGPoint) -> CGPoint { CGPoint(x: mid.x + (p.x - c0.x) * zoom, y: mid.y + (p.y - c0.y) * zoom) }
            // (With a lot of work in it the clouds lie on one great sheet: it's become one thing.)
            let one = show(work, from: 3.2)
            if one > 0 { paper(cloud(mid, (hi.x - lo.x) / 2 * zoom * 1.02 * one, (hi.y - lo.y) / 2 * zoom * 1.0 * one, turn: 0.2, key: seed * 7 + 12), sky.mix(clouds[0], 1.1), lift: 1.3, in: ctx) }
            for (j, g) in groups.enumerated() where radius[j] > 0 {
                let c = scr(centres[j]), r = radius[j] * zoom, base = tint(clouds[1 + j % 3], j), lf = worked(j)
                paper(cloud(c, r * 1.12, r * 1.02, turn: filmHash(j, seed) * 3, key: seed * 13 + j), base.mix(sky, 0.25), in: ctx)
                paper(cloud(c, r * 0.72, r * 0.66, turn: filmHash(j, seed + 5) * 3, key: seed * 17 + j), base, lift: 0.6, in: ctx)
                let a = show(lf, from: 2), b = show(lf, from: 3.6)
                // (The lighter sheets of work lie under its own notes, at its middle.)
                let inner = parts[j].count == 1 ? r : partNow[j][0] * zoom * 1.5
                let ic = scr(CGPoint(x: centres[j].x + partAt[j][0].x, y: centres[j].y + partAt[j][0].y))
                if a > 0, inner > 0 { paper(cloud(ic, inner * 0.46 * a, inner * 0.42 * a, turn: filmHash(j, seed + 6) * 3, key: seed * 19 + j), base.mix(cream, 0.2), lift: 0.5, in: ctx) }
                if b > 0, inner > 0 { paper(cloud(ic, inner * 0.25 * b, inner * 0.23 * b, turn: filmHash(j, seed + 7) * 3, key: seed * 23 + j), base.mix(cream, 0.42), lift: 0.4, in: ctx) }
                if names { labels.append((script.folders[g.folder], CGPoint(x: c.x, y: c.y + r * 1.05 + 8), filmSmooth((gt - born(g.notes) - 0.2) / 0.5), j, false)) }
                // Each folder inside it: a smaller cloud of its own, lighter, with its name.
                for (p, part) in parts[j].enumerated() where p > 0 && partNow[j][p] > 0 {
                    let cp = scr(CGPoint(x: centres[j].x + partAt[j][p].x, y: centres[j].y + partAt[j][p].y)), rp = partNow[j][p] * zoom
                    paper(cloud(cp, rp * 1.06, rp * 0.98, turn: filmHash(j * 7 + p, seed + 8) * 3, key: seed * 29 + j * 7 + p), base.mix(cream, 0.13), lift: 0.6, in: ctx)
                    if names { labels.append((script.subfolders[part.sub].name, CGPoint(x: cp.x, y: cp.y + rp * 0.98 + 4), filmSmooth((gt - born(part.notes) - 0.2) / 0.5), j, true)) }
                }
                for (p, part) in parts[j].enumerated() {
                    for (k, i) in part.notes.enumerated() where script.nodes[i].birth <= gt {
                        let rr = cells[j] * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963 + filmHash(j * 7 + p, seed + 9) * 6 + 0.03 * t
                        where_[i] = scr(CGPoint(x: centres[j].x + partAt[j][p].x + cos(a) * rr, y: centres[j].y + partAt[j][p].y + sin(a) * rr))
                    }
                }
            }
            for (k, i) in loose.enumerated() where script.nodes[i].birth <= gt {
                where_[i] = scr(CGPoint(x: c0.x + (filmHash(i, 3) - 0.5) * (hi.x - lo.x) * 0.9, y: c0.y + (filmHash(k, 4) - 0.5) * (hi.y - lo.y) * 0.9))
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
                    labels.append((script.folders[g.folder], CGPoint(x: end.x + across.x * side * 46 - dir.x * 20, y: end.y + across.y * side * 46 - dir.y * 20 - 20), filmSmooth((gt - first - 0.6) / 0.5), j, false))
                }
                for i in g.notes where script.nodes[i].birth <= gt {
                    // (A folder inside it runs a little to one side of its strand.)
                    let p = strand(j, script.nodes[i].birth), q = partOf[i]
                    let side = (filmHash(i, 5) - 0.5) * 26 + (q == 0 ? 0 : (q % 2 == 1 ? 1 : -1) * (16 + 8 * Double((q - 1) / 2)))
                    where_[i] = CGPoint(x: p.x + across.x * side, y: p.y + across.y * side)
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
        if quiet {
            let made = build()
            shot.zoom = made.zoom * cam.k
            placedNow = made.at
            if finding {
                found = [:]
                for (k, b) in script.bangs.enumerated() {
                    let mine = script.nodes.indices.filter { bangOf[$0] == k }.map { made.at[$0] }
                    guard !mine.isEmpty else { continue }
                    found[k] = CGPoint(x: mine.map(\.x).reduce(0, +) / Double(mine.count), y: mine.map(\.y).reduce(0, +) / Double(mine.count))
                }
            }
            return
        }
        let bursts = centres(canvas)
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
                let p = CGPoint(x: -120 + filmHash(k, seed + 1) * (W + 240), y: canvas.bottom + 200 + filmHash(k, seed + 2) * (H - canvas.bottom - 100))
                let r = 1.3 + 2.4 * pow(filmHash(k, seed + 3), 3)
                ctx.setFillColor(cream.cg(0.25 + 0.4 * filmHash(k, seed + 4) * (0.7 + 0.3 * sin(1.7 * t + Double(k)))))
                ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2))
            }
        }
        ctx.saveGState()
        ctx.translateBy(x: mid.x, y: mid.y)
        ctx.scaleBy(x: cam.k, y: cam.k)
        ctx.translateBy(x: -cam.on.x, y: -cam.on.y)
        let made = build()
        shot.zoom = made.zoom * cam.k
        var where_ = made.at
        let labels = made.labels, zoom = made.zoom, heart = made.heart

        // Before the month: an empty sky, and a faint point gathering where each folder of what
        // you brought in will be (or one at its heart, when you brought nothing).
        let biggest = Double(script.bangs.map(\.count).max() ?? 1)
        func point(_ c: CGPoint, until: Double, size: Double, phase: Double) {
            let gather = filmSmooth(gt / until), left = 1 - filmSmooth((gt - until) / 0.3)
            guard left > 0.01 else { return }
            let r = (2 + 8 * gather) * size * (1 + 0.12 * sin(9 * gt + phase))
            let glow = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [cream.cg(0.5 * gather * left), cream.cg(0)] as CFArray, locations: [0, 1])!
            ctx.drawRadialGradient(glow, startCenter: c, startRadius: 0, endCenter: c, endRadius: r * 7, options: [])
            ctx.setFillColor(cream.mix(GR(0xFFFFFF), 0.5).cg((0.35 + 0.6 * gather) * left))
            ctx.fillEllipse(in: CGRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2))
        }
        if script.bangs.isEmpty {
            if script.opening > 0 { point(heart, until: script.opening, size: 1, phase: 0) }
        } else {
            for (k, b) in script.bangs.enumerated() {
                point(bursts[k] ?? heart, until: b.at, size: 0.6 + 0.4 * (Double(b.count) / biggest).squareRoot(), phase: Double(k) * 2.1)
            }
        }
        // Then each bursts in turn: what that folder brings flies out from its point and settles
        // there, under a ring of light going out and a glow that fades behind it.
        for (i, n) in script.nodes.enumerated() where n.imported && !script.bangs.isEmpty && n.birth <= gt && gt < n.birth + 0.9 {
            let from = bursts[bangOf[i]] ?? heart, x = (gt - n.birth) / 0.9, out = 1 - pow(1 - x, 3)
            where_[i] = CGPoint(x: from.x + (where_[i].x - from.x) * out, y: from.y + (where_[i].y - from.y) * out)
        }
        for (k, b) in script.bangs.enumerated() where gt >= b.at && gt < b.at + 1.1 {
            let c = bursts[k] ?? heart, x = (gt - b.at) / 1.1, reach = 70 + 16 * Double(b.count).squareRoot()
            let ring = 16 + reach * (1 - pow(1 - x, 2.4))
            let glow = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [cream.cg(0.5 * (1 - x) * (1 - x)), cream.cg(0)] as CFArray, locations: [0, 1])!
            ctx.drawRadialGradient(glow, startCenter: c, startRadius: 0, endCenter: c, endRadius: 40 + reach * 0.6 * x + 30, options: [])
            ctx.setStrokeColor(cream.cg(0.65 * (1 - x)))
            ctx.setLineWidth(1.5 + 6 * (1 - x))
            ctx.strokeEllipse(in: CGRect(x: c.x - ring, y: c.y - ring, width: ring * 2, height: ring * 2))
        }

        // (Links between notes aren't drawn: across hundreds of notes they were a tangle.)

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
        // (In a big notebook there are too many to see one by one: there the stars carry the work,
        // in more layers the more they're written in, and the specks are left out.)
        let specks = script.nodes.count <= FilmScript.speckLimit
        for (i, n) in script.nodes.enumerated() where specks && n.birth <= gt && n.edits.count > 1 {
            let p = where_[i], a0 = filmHash(i, 31) * 6.283
            let left = 1 - filmSmooth((t - (n.gone ?? .infinity)) / 0.3)
            guard left > 0.01 else { continue }
            for k in 1..<n.edits.count {
                let age = gt - n.edits[k]
                if age < 0 { break }
                let fresh = max(0, 1 - age / 0.5)
                let a = a0 + Double(k) * 2.399963
                var rad = (8 + 4.6 * Double(k).squareRoot()) * u
                // (In the nebula a note's specks keep to the room round it, just outside the star.)
                if let unit { rad = (1.2 * starSize(Double(n.edits.count)) + 0.42 * noteCell[i] * (Double(k) / Double(max(6, n.edits.count))).squareRoot()) * unit }
                rad *= filmBackOut(age / 0.4)
                let q = CGPoint(x: p.x + cos(a) * rad, y: p.y + sin(a) * rad)
                let flash = lit(q)
                let h = filmHash(i * 131 + k, 7), sz = (2.0 + 1.8 * h) * (unit.map { min(2.6, max(0.8, $0 * 0.8)) } ?? u) * (1 + 1.2 * fresh + 1.5 * flash)
                let alpha = (t <= growth ? 0.92 : 0.66 + 0.3 * sin(2.6 * t + Double(k) * 1.7 + Double(i))) * left
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
            let r = (unit.map { starSize(done) * $0 } ?? min(30, 7 + 1.9 * done.squareRoot()) * u) * filmBackOut((gt - n.birth) / 0.35) * (1 + (unit == nil ? 0.4 : 0.22) * pulse)
            let helped = filmSmooth((gt - aiFrom[i]) / 0.35)
            var at = where_[i], size = r
            if let gone = n.gone, t >= gone {
                // Removed: it leaves as a shooting star, away from the heart, and is gone.
                let x = (t - gone) / 0.7
                guard x < 1 else { continue }
                let away = atan2(at.y - heart.y, at.x - heart.x) + (filmHash(i, 41) - 0.5) * 1.2
                let far = 520 * x * x, from = at
                at = CGPoint(x: at.x + cos(away) * far, y: at.y + sin(away) * far)
                size = r * (1 - 0.6 * x)
                ctx.setStrokeColor(cream.cg(0.7 * (1 - x)))
                ctx.setLineWidth(max(1.5, size * 0.5))
                ctx.setLineCap(.round)
                ctx.move(to: CGPoint(x: from.x + (at.x - from.x) * max(0, 1 - 0.5 / max(0.05, x)), y: from.y + (at.y - from.y) * max(0, 1 - 0.5 / max(0.05, x))))
                ctx.addLine(to: at)
                ctx.strokePath()
            }
            note(at, size, turn: filmHash(i, 21) * 1.5 + 0.25 * sin(0.8 * t + Double(i)), you.mix(ai, helped).mix(white, min(0.8, 0.35 * pulse)), edits: done, in: ctx)
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
            let w = FilmKit.width(l.name, l.small ? 21 : 27, 0.3) + (l.small ? 20 : 26)
            let p = seen(l.at)
            return CGRect(x: min(W - 30 - w, max(30, p.x - w / 2)), y: p.y, width: w, height: l.small ? 31 : 40)
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
        for (k, l) in labels.enumerated() { tag(l.name, at: CGPoint(x: boxes[k].midX, y: boxes[k].minY), alpha: l.a * (1 - filmSmooth((boxes[k].maxY - (H - canvas.top - 160)) / 50)), hot: l.small ? 0 : heat[l.group], small: l.small, in: ctx) }

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
