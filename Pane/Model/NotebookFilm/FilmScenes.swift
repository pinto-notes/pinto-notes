import CoreGraphics
import os
import CoreText
import Foundation

/// What a look draws besides the notebook's constellation: a whole scene in its place (the town),
/// or a world behind and in front of it (the village under Dusk's stars). FilmRenderer keeps the
/// film's shape, its opening, its words and its end card for all of them.
protocol FilmScene: AnyObject {
    /// The scene is the film: no constellation is drawn.
    var replacesNotebook: Bool { get }
    /// How far the constellation is lifted to clear what's in front of it.
    var lift: Double { get }
    /// The lines said while it grows, in place of the constellation's.
    var captions: [String]? { get }
    /// How much later the end card comes up (a scene's own ending first).
    var wordsDelay: Double { get }
    /// `t`: seconds into the notebook's growth; past `script.growth`, the ending.
    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext)
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext)
    /// The ink of the mark and key along the top at `t`.
    func topInk(_ t: Double) -> FilmRenderer.RGB
    /// Draws the key's sign for "just me" or "with the AI" in the scene's own terms, its bottom
    /// left at `p`; false leaves the usual dot.
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool
    /// The film opens on the scene as the month left it, then runs the month backwards to its
    /// first day (the constellation's own opening draws back instead).
    var rewinds: Bool { get }
    /// The line under the title as the shared film opens, saying what the picture is made of.
    func subtitle(_ stats: FilmStats) -> String?
    /// Where the app starts it (the intro shows that same picture): its first houses, already there.
    var appStart: Double { get }
    /// The scene at `t` as that opening shows it: the whole of it, with none of the film's own moments.
    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext)
}

private typealias C = FilmRenderer.RGB

extension FilmRenderer.RGB {
    init(_ hex: UInt32) { self.init(Double((hex >> 16) & 255) / 255, Double((hex >> 8) & 255) / 255, Double(hex & 255) / 255) }
}

private func smooth(_ x: Double) -> Double { let c = min(1, max(0, x)); return c * c * (3 - 2 * c) }
/// A little overshoot on arrival.
private func backOut(_ x: Double) -> Double { let c = min(1, max(0, x)) - 1; return 1 + c * c * (2.7 * c + 1.7) }
private func hash(_ a: Int, _ b: Int = 0) -> Double {
    var r = FilmKit.Rand(UInt64(truncatingIfNeeded: a &* 7919 &+ b &* 104_729 &+ 13))
    _ = r.next(); _ = r.next()
    return r.next()
}

/// Shared by the scenes: seeded chance, soft lights, paper grain and text.
enum FilmKit {
    struct Rand {
        var s: UInt64
        init(_ seed: UInt64) { s = seed &* 0x9E37_79B9_7F4A_7C15 | 1 }
        mutating func next() -> Double {
            s ^= s << 13; s ^= s >> 7; s ^= s << 17
            return Double(s >> 11) / Double(1 << 53)
        }
    }

    static func glow(_ c: FilmRenderer.RGB) -> CGImage {
        let n = 96
        let ctx = FilmRenderer.context(width: n, height: n)!
        let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [c.cg(1), c.cg(0.5), c.cg(0.16), c.cg(0.04), c.cg(0)] as CFArray, locations: [0, 0.2, 0.45, 0.72, 1])!
        let m = CGPoint(x: n / 2, y: n / 2)
        ctx.drawRadialGradient(g, startCenter: m, startRadius: 0, endCenter: m, endRadius: Double(n) / 2, options: [])
        return ctx.makeImage()!
    }

    /// Paper grain as faint light and dark specks, laid over with plain blending.
    static let speckle: CGImage = {
        let n = 256
        let ctx = FilmRenderer.context(width: n, height: n)!
        var r = Rand(77)
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        for i in 0..<(n * n) {
            let v = r.next()
            // Premultiplied BGRA: light specks or dark ones, a few percent strong.
            let a = UInt8(abs(v - 0.5) * 2 * 9)
            let c: UInt8 = v > 0.5 ? a : 0
            p[i * 4] = c; p[i * 4 + 1] = c; p[i * 4 + 2] = c; p[i * 4 + 3] = a
        }
        return ctx.makeImage()!
    }()

    /// Fonts and how wide a name is, kept once made: every name on every frame made them afresh,
    /// and with a lot of folders that was much of a frame's time (the stress lab, 11-11).
    private struct Made: @unchecked Sendable { var fonts: [Double: CTFont] = [:], widths: [String: Double] = [:] }
    private static let made = OSAllocatedUnfairLock(initialState: Made())

    private static func font(_ size: Double, _ weight: Double) -> CTFont {
        let key = size * 1000 + weight
        if let f = made.withLockUnchecked({ $0.fonts[key] }) { return f }
        let base = CTFontCreateUIFontForLanguage(.system, size, nil)!
        let desc = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base), [kCTFontTraitsAttribute: [kCTFontWeightTrait: weight]] as CFDictionary)
        let f = CTFontCreateWithFontDescriptor(desc, size, nil)
        made.withLockUnchecked { $0.fonts[key] = f }
        return f
    }

    static func width(_ s: String, _ size: Double, _ weight: Double = 0) -> Double {
        let key = "\(size) \(weight) \(s)"
        if let w = made.withLock({ $0.widths[key] }) { return w }
        let a = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight)])
        let w = CTLineGetTypographicBounds(CTLineCreateWithAttributedString(a), nil, nil, nil)
        made.withLock { if $0.widths.count > 4000 { $0.widths = [:] }; $0.widths[key] = w }
        return w
    }

    @discardableResult
    static func text(_ s: String, _ size: Double, _ weight: Double = 0, _ color: CGColor, at p: CGPoint, align: Double = 0, in ctx: CGContext) -> Double {
        let a = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight),
                                                           NSAttributedString.Key(kCTForegroundColorAttributeName as String): color])
        let line = CTLineCreateWithAttributedString(a)
        let w = CTLineGetTypographicBounds(line, nil, nil, nil)
        ctx.textPosition = CGPoint(x: p.x - w * align, y: p.y)
        CTLineDraw(line, ctx)
        return w
    }
}

// MARK: - The town

/// The month as a cut-paper town at dusk (the site footer's world). Each note is a house on its
/// folder's hill; a window lights and the chimney smokes when it's written in; houses grow floors
/// as they're edited; the day runs from morning to dusk, and at the end night falls and the
/// windows come on where the work was. Every frame is drawn from the film time alone.
final class TownScene: FilmScene {
    let script: FilmScript
    let folderNames: Bool
    let W = Double(FilmScript.width)
    private var H = Double(FilmScript.height)
    /// The top of the dark ground the words sit on, and how much taller than the shared 4:5
    /// shape the hills stand (a phone's screen has more room above them).
    private var ground = 300.0
    private var stretch = 1.0
    private var placed: FilmCanvas?
    /// The folder written in most, if it has a name.
    private lazy var topFolder: Int = script.stats.topFolder.flatMap { script.folders.firstIndex(of: $0) } ?? -1
    /// The part of the frame the town is framed in, and where each hill's signboard sits.
    private var viewTop = 1100.0
    private var viewBottom: Double { ground + 20 }
    /// Each hill's name board: its bottom centre, placed clear of the houses and of each other.
    private var pills: [CGPoint] = []
    private var pillAnchors: [CGPoint] = []
    /// The camera through the month, a tenth of a second apart: how close, and what it's on.
    private var shots: [(z: Double, x: Double, y: Double)] = []
    /// The same path without the moments it goes in for: what the opening's rewind follows.
    private var wideShots: [(z: Double, x: Double, y: Double)] = []
    /// Per shot, 0...1: whether the camera has pushed houses up to the top line (the sky's sheet
    /// comes down then, and only then).
    private var cover: [Double] = []
    private var rewinding = false
    private static let shotStep = 0.1
    /// How far the tallest bushes of the hedge in front stand above the ground line: houses keep above them.
    private static let hedge = 96.0
    private var growth: Double { script.growth }

    struct Hill { var folder: Int; var cx, base, w, h, s: Double; var depth: Int; var birth: Double; var skew: Double }
    struct House { var hill: Int; var x, y, s, w: Double; var wall, roof: Int; var chimneyLeft: Bool; var style = 0 }
    private var hills: [Hill] = []
    private var houses: [House] = []
    private var order: [Int] = []
    private var trees: [(hill: Int, x: Double, y: Double, r: Double, tone: Double)] = []
    private let worked: [Double]
    private let aiFrom: [Double]
    private let amberGlow = FilmKit.glow(C(0xFFC85A)), blueGlow = FilmKit.glow(C(0x7FAEE8)), warmHaze = FilmKit.glow(C(0xFFB36B))
    private static let rowBase = [352.0, 196, 34]

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    /// Little teaching: one line for what a house is, one for what makes it grow. The rest of
    /// the film's lines are about the month itself.
    var captions: [String]? { ["Each house is a note", "It grows as it\u{2019}s written in"] }
    var rewinds: Bool { true }
    func subtitle(_ stats: FilmStats) -> String? { stats.notes == 1 ? "1 note, and a house for it" : "\(stats.notes) notes, a house for each" }
    /// (Just after the first note: one whole house on its hill, before the second arrives.)
    var appStart: Double { 0.26 }
    /// The folder you wrote most in has its moment when there are folders enough for that to say something.
    private var namesTopFolder: Bool { folderNames && topFolder >= 0 && growth > 5 && hills.count >= 3 && script.topFolderMoment != nil }
    /// The houses written in on the day you wrote most, and when the film is on that day.
    private var busy: Set<Int> = []
    private var busyFrom = Double.infinity, busyUntil = Double.infinity
    private var topFolderFrom: Double { script.topFolderMoment?.from ?? .infinity }
    var wordsDelay: Double { 0.1 }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}

    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        rewinding = true
        drawBehind(t, canvas: canvas, in: ctx)
        rewinding = false
    }

    /// The key: a little house with its roof in the colour.
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool {
        let night = smooth((t - growth) / 1.3)
        let roof = (ai ? C(0x5F84B5) : C(0xD9883A)).mix(ai ? C(0x9CD2FF) : C(0xFFCB6B), night)
        ctx.setFillColor(C(0xF0DFC2).mix(C(0x6A5560), night).cg(alpha))
        ctx.fill(CGRect(x: p.x + 2, y: p.y, width: 18, height: 12))
        let r = CGMutablePath()
        r.move(to: CGPoint(x: p.x - 1, y: p.y + 11))
        r.addLine(to: CGPoint(x: p.x + 11, y: p.y + 23))
        r.addLine(to: CGPoint(x: p.x + 23, y: p.y + 11))
        r.closeSubpath()
        ctx.addPath(r)
        ctx.setFillColor(roof.cg(alpha))
        ctx.fillPath()
        return true
    }

    /// Ink by day, cream once it's dark.
    /// (Early in the sunset: the sky is deep red long before it's dark.)
    /// (At once: a slow change would leave them grey on a red sky.)
    func topInk(_ t: Double) -> FilmRenderer.RGB { C(0x3A2B2E).mix(C(0xFFF4E6), smooth((t - growth - 0.02) / 0.07)) }

    init(script: FilmScript, folderNames: Bool) {
        self.script = script
        self.folderNames = folderNames
        let counts = script.nodes.map(\.edits.count).sorted()
        let busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        worked = script.nodes.map { min(1, (Double($0.edits.count) / busy).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        layout()
        if let day = script.stats.busiestDay, let span = script.span(ofDay: day), span.start >= 0.55 {
            busyFrom = span.start
            busyUntil = span.start + min(2.4, max(1.2, span.length))
            self.busy = Set(script.nodes.indices.filter { i in script.nodes[i].edits.contains { $0 >= span.start && $0 < span.start + span.length } })
        }
    }

    private func place(_ canvas: FilmCanvas) {
        guard canvas != placed else { return }
        placed = canvas
        defer { plan() }
        H = canvas.height
        viewTop = H - canvas.top - 150
        ground = 312 + canvas.bottom
        // Room between the ground and the top line, against what the shared shape has.
        stretch = min(1.6, max(0.96, (H - canvas.top - ground - 260) / 790))
    }

    /// A town has at most this many hills: the folders with most notes get one each, and the
    /// rest share the last (it has no name board).
    static let maxHills = 9
    /// The folder each hill is for; -1 for the hill the smaller folders share.
    private var shared: Set<Int> = []

    private func name(_ hill: Hill) -> String { hill.folder >= 0 ? script.folders[hill.folder] : "" }

    private func layout() {
        let F = script.folders.count
        var count = [Int](repeating: 0, count: F), first = [Double](repeating: .infinity, count: F)
        for n in script.nodes { count[n.folder] += 1; first[n.folder] = min(first[n.folder], n.birth) }
        var bySize = (0..<F).sorted { count[$0] == count[$1] ? $0 < $1 : count[$0] > count[$1] }
        // More folders than hills: the smallest share one.
        var lots: [(folder: Int, count: Int, first: Double)] = []
        if bySize.count > Self.maxHills {
            shared = Set(bySize[(Self.maxHills - 1)...])
            bySize = Array(bySize[..<(Self.maxHills - 1)])
            lots.append((-1, shared.map { count[$0] }.reduce(0, +), shared.map { first[$0] }.min() ?? 0))
        }
        lots = bySize.map { ($0, count[$0], first[$0]) } + lots
        lots.sort { $0.count == $1.count ? $0.folder < $1.folder : $0.count > $1.count }
        // Three sheets of hills, front to back. The biggest get the front, where all of a hill
        // shows; in a row each hill has room by its size.
        let H = lots.count
        var rows: [[Int]] = [[], [], []]            // depth 2 (front), 1, 0; indices into lots
        for j in lots.indices { rows[H <= 2 ? j : j % 3].append(j) }
        for (ri, row) in rows.enumerated() {
            let depth = 2 - ri
            // The row's biggest hill on the left in one row and on the right in the next, so the
            // town isn't all on one side.
            var ordered = row.sorted { lots[$0].count > lots[$1].count }
            if ri % 2 == 1 { ordered.reverse() }
            let weights = ordered.map { Double(lots[$0].count).squareRoot() + 2 }
            let total = weights.reduce(0, +)
            var before = 0.0
            for (k, j) in ordered.enumerated() {
                let lot = lots[j]
                let m = Double(ordered.count)
                let share = weights[k] / total
                var xs = before + share / 2
                before += share
                // Two folders: side by side, not one behind the other.
                if H == 2 { xs = ri == 0 ? 0.36 : 0.7 }
                if H >= 3, m == 1 { xs = ri == 1 ? 0.62 : 0.4 }
                let n = Double(lot.count)
                let s = [0.94, 1.08, 1.24][depth]
                let key = lot.folder + 1
                let room = m == 1 ? W * 0.9 : share * (W - 120) * 1.3
                let w = min(room, (300 + 46 * n.squareRoot()) * (0.94 + 0.12 * hash(key, 5)))
                let h = (150 + 24 * n.squareRoot()) * (0.92 + 0.16 * hash(key, 7))
                let base = Self.rowBase[depth]
                let cx = 60 + xs * (W - 120) + (hash(key, 3) - 0.5) * 24
                hills.append(Hill(folder: lot.folder, cx: cx, base: base, w: w, h: h, s: s, depth: depth, birth: max(0, lot.first - 0.3), skew: 0))
            }
        }
        hills.sort { $0.depth == $1.depth ? $0.cx < $1.cx : $0.depth < $1.depth }
        // Houses: terraces under each hill's top, the first notes nearest the top.
        houses = Array(repeating: House(hill: 0, x: 0, y: 0, s: 1, w: 40, wall: 0, roof: 0, chimneyLeft: false), count: script.nodes.count)
        for (hi, hill) in hills.enumerated() {
            let notes = script.nodes.indices.filter { let f = script.nodes[$0].folder; return hill.folder >= 0 ? f == hill.folder : shared.contains(f) }
            var s = hill.s
            var perRow = 1, rows = 1
            for _ in 0..<24 {
                perRow = max(1, Int(hill.w * 0.8 / (56 * s)))
                // Lower terraces hold one more each, up to the hill's width.
                rows = 1
                var held = perRow
                while held < notes.count { rows += 1; held += min(perRow + rows - 1, perRow + 3) }
                // Terraces down the hill's own face, no further; a very full hill has smaller houses.
                if Double(rows) * 54 * s <= max(250, hill.h * 0.95) || s <= hill.s * 0.4 { break }
                s *= 0.94
            }
            var spots: [(x: Double, drop: Double, key: Double)] = []
            for r in 0..<rows {
                let n = min(perRow + r, perRow + 3)
                for k in 0..<n {
                    let u = (Double(k) + 0.5 - Double(n) / 2) / Double(perRow + 3) * 2 * 0.94
                    let x = hill.cx + u * hill.w / 2 + (hash(hi * 100 + r, k) - 0.5) * 9 * s
                    spots.append((x, (2 + Double(r) * 54) * s + hash(hi * 37 + k, r) * 6 * s, Double(r) * 0.8 + abs(u) * 1.3 + hash(hi * 11 + k, r * 3 + 1) * 0.55))
                }
            }
            spots.sort { $0.key < $1.key }
            for (k, i) in notes.enumerated() {
                let spot = spots[k % spots.count]
                houses[i] = House(hill: hi, x: spot.x, y: spot.drop, s: s, w: (33 + 10 * hash(i, 1)) * s, wall: Int(hash(i, 2) * 4), roof: Int(hash(i, 3) * 3), chimneyLeft: hash(i, 4) < 0.5, style: Int(hash(i, 6) * 4))
            }
            // Round trees on the shoulders of the hill and low on its face.
            let treeCount = 4 + Int(hash(hi, 21) * 3)
            for k in 0..<treeCount {
                let side = k % 2 == 0 ? -1.0 : 1.0
                let u = side * (0.5 + 0.42 * hash(hi * 5 + k, 22))
                trees.append((hi, hill.cx + u * hill.w / 2, (hash(hi + k, 23) * 26) * hill.s, (20 + 15 * hash(hi * 3 + k, 24)) * hill.s, hash(hi * 7 + k, 25)))
            }
        }
        order = script.nodes.indices.sorted { a, b in
            let ha = houses[a], hb = houses[b]
            return ha.hill == hb.hill ? ha.y < hb.y : ha.hill < hb.hill
        }
    }

    /// How far a hill has risen at film time `gt`, 0...1.
    private func risen(_ h: Hill, _ gt: Double) -> Double { gt < h.birth ? 0 : backOut((gt - h.birth) / 0.8) }

    /// The top edge of a row's sheet at `x`: its level ground with each folder's hill on it.
    private func ridge(depth: Int, _ x: Double, _ gt: Double) -> Double {
        let base = ground + Self.rowBase[depth] * stretch
        var y = base + 9 * sin(x / 83 + Double(depth) * 2.1) + 6 * sin(x / 31 + Double(depth))
        for h in hills where h.depth == depth {
            let u = (x - h.cx) / (h.w * 0.46)
            y += h.h * stretch * exp(-u * u) * risen(h, gt)
        }
        return y
    }

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        place(canvas)
        let gt = min(t, growth)
        let p = gt / growth
        let dusk = smooth((p - 0.3) / 0.7)
        // Night comes down sheet by sheet, the sky and the far hills first: light leaving, not a veil.
        let fall = (t - growth + 0.5) / 2.5
        func nightAt(_ depth: Double) -> Double { smooth((fall - depth * 0.3) / 0.7) }
        let night = nightAt(0)
        var nightNow = night
        func col(_ day: UInt32, _ dk: UInt32, _ nt: UInt32) -> C { C(day).mix(C(dk), dusk).mix(C(nt), nightNow) }
        // The sky goes down through a deep orange, not a grey halfway between dusk and night.
        func sky(_ day: UInt32, _ dk: UInt32, _ ember: UInt32, _ nt: UInt32) -> C {
            let d = C(day).mix(C(dk), dusk)
            return night < 0.5 ? d.mix(C(ember), smooth(night * 2)) : C(ember).mix(C(nt), smooth(night * 2 - 1))
        }
        // The camera: close on the first houses, drawing back as the town grows.
        let cam = camera(at: max(0, t))
        let centre = CGPoint(x: W / 2, y: (viewBottom + viewTop) / 2)
        // The whole stage drifts a little, near sheets more than far ones: paper at different depths.
        let total = growth + FilmScript.outro
        let drift = -16 * cos(min(1, max(0, t / total)) * .pi)
        /// `follow`: how much of the camera's move this sheet takes (far ones less: they're far).
        func layer(_ depth: Double, follow: Double = 0, _ body: () -> Void) {
            ctx.saveGState()
            ctx.translateBy(x: drift * depth, y: 0)
            if follow > 0 {
                let z = 1 + (cam.z - 1) * follow
                ctx.translateBy(x: centre.x, y: centre.y)
                ctx.scaleBy(x: z, y: z)
                ctx.translateBy(x: -(centre.x + (cam.x - centre.x) * follow), y: -(centre.y + (cam.y - centre.y) * follow))
            }
            body()
            ctx.restoreGState()
        }

        // Sky.
        let top = sky(0xFFF7EA, 0xFCE6CC, 0x5B2A47, 0x1F1019), mid = sky(0xFFEFD9, 0xF7BC97, 0xB54A4A, 0x4A1D2A), hor = sky(0xFFE4C6, 0xE88F8C, 0xF27D4F, 0xA44E3E)
        // Painted small and stretched: a full-size gradient costs many times more.
        if let strip = FilmRenderer.context(width: 2, height: 96) {
            let sky = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [hor.cg(), mid.cg(), top.cg()] as CFArray, locations: [0, 0.38, 1])!
            strip.drawLinearGradient(sky, start: .zero, end: CGPoint(x: 0, y: 96), options: [])
            if let image = strip.makeImage() {
                ctx.interpolationQuality = .low
                ctx.draw(image, in: CGRect(x: -2, y: ground + 430 * stretch, width: W + 4, height: H - ground - 430 * stretch))
                ctx.setFillColor(hor.cg())
                ctx.fill(CGRect(x: 0, y: ground, width: W, height: 430 * stretch + 2))
            }
        }
        // The low sun's warmth on the horizon, going down.
        ctx.setBlendMode(.plusLighter)
        let sunY = ground + (640 - 190 * p) * stretch
        ctx.setAlpha(0.5 * (1 - night) * (0.4 + 0.6 * dusk))
        ctx.draw(warmHaze, in: CGRect(x: W * 0.62 - 420, y: sunY - 420, width: 840, height: 840))
        ctx.setAlpha(1)
        ctx.setBlendMode(.normal)
        // Stars.
        if night > 0 {
            var r = FilmKit.Rand(5)
            for _ in 0..<60 {
                let x = r.next() * W, y = ground + 620 * stretch + r.next() * (H - ground - 620 * stretch), s = 1 + r.next() * 1.6, a = r.next()
                ctx.setFillColor(C(0xFFF1D6).cg(night * (0.25 + 0.6 * a) * (0.75 + 0.25 * sin(t * 2.6 + a * 40))))
                ctx.fillEllipse(in: CGRect(x: x - s, y: y - s, width: s * 2, height: s * 2))
            }
        }
        clouds(t, night: night, in: ctx)
        nightNow = nightAt(0.22)
        // Far hills, three sheets of paper.
        let far: [(Double, Double, C)] = [(ground + 560 * stretch, 44, col(0xE4D3E2, 0xCFAFC9, 0x402845)), (ground + 505 * stretch, 52, col(0xD0BDD8, 0xB494BC, 0x33213D)), (ground + 452 * stretch, 44, col(0xB9B2CC, 0x9482AE, 0x281C35))]
        for (i, (y, amp, c)) in far.enumerated() { layer(0.12 + 0.08 * Double(i), follow: 0.16 + 0.07 * Double(i)) {
            let path = CGMutablePath()
            path.move(to: CGPoint(x: -60, y: 0))
            var x = -60.0
            while x <= W + 60 {
                let yy = y + amp * sin(x / (210 + Double(i) * 60) + Double(i) * 1.7) + amp * 0.45 * sin(x / 97 + Double(i) * 4.1)
                path.addLine(to: CGPoint(x: x, y: yy))
                x += 12
            }
            path.addLine(to: CGPoint(x: W + 60, y: 0))
            sheet(path, c, in: ctx)
        } }

        // Three sheets of hills, back to front; each folder's hill swells up when its first note
        // comes, and carries its houses.
        var drawn = 0
        for depth in 0..<3 { layer([0.45, 0.7, 1.0][depth], follow: [0.9, 0.95, 1.0][depth]) {
            nightNow = nightAt([0.45, 0.65, 0.85][depth])
            let night = nightNow
            let rowHills = hills.indices.filter { hills[$0].depth == depth }
            guard !rowHills.isEmpty else { return }
            let green = [col(0x9DB39A, 0x6C8878, 0x1D3833), col(0x86A380, 0x54755F, 0x17322B), col(0x6F9169, 0x426349, 0x112921)][depth]
            let path = CGMutablePath()
            path.move(to: CGPoint(x: -60, y: 0))
            var x = -60.0
            while x <= W + 60 { path.addLine(to: CGPoint(x: x, y: ridge(depth: depth, x, gt))); x += 8 }
            path.addLine(to: CGPoint(x: W + 60, y: 0))
            sheet(path, green, in: ctx)
            // At night each hill's village glows a little into the air round it.
            if night > 0 {
                ctx.setBlendMode(.plusLighter)
                for hi in rowHills {
                    let hill = hills[hi]
                    let r = hill.w * 0.62
                    ctx.setAlpha(0.16 * night)
                    ctx.draw(warmHaze, in: CGRect(x: hill.cx - r, y: ground + (hill.base + hill.h * 0.55) * stretch - r * 0.7, width: r * 2, height: r * 1.4))
                }
                ctx.setAlpha(1)
                ctx.setBlendMode(.normal)
            }
            for hi in rowHills {
                let hill = hills[hi]
                guard gt >= hill.birth else { continue }
                let up = risen(hill, gt)
                for tr in trees where tr.hill == hi {
                    tree(at: CGPoint(x: tr.x, y: ridge(depth: depth, tr.x, gt) - tr.y - 4), r: tr.r * min(1, up), cypress: tr.tone > 0.7, color: col(0x4E7556, 0x355644, 0x10241E).mix(C(0x2A4A3A), tr.tone * 0.4), in: ctx)
                }
            }
            for hi in rowHills {
                while drawn < order.count, houses[order[drawn]].hill == hi {
                    let i = order[drawn]
                    // (Never down in the hedge the words sit on.)
                    house(i, groundY: max(ground + Self.hedge, ridge(depth: depth, houses[i].x, gt) - houses[i].y), t: t, gt: gt, dusk: dusk, night: night, col: col, in: ctx)
                    drawn += 1
                }
            }
            // Street lamps along the front, lit as the light goes.
            if depth == 2 {
                for k in 0..<4 {
                    let x = 70 + (Double(k) + 0.2 + 0.6 * hash(k, 51)) / 4 * (W - 140)
                    let y = ridge(depth: 2, x, gt) - 6
                    let on = smooth((dusk - 0.35 - 0.1 * hash(k, 52)) / 0.15)
                    // A lamp goes up once there's a street to light: the first house stands alone.
                    let since = gt - script.nodes[min(script.nodes.count - 1, 4 + 3 * k)].birth
                    guard since > 0, script.nodes.count > 3 else { continue }
                    ctx.setAlpha(smooth(since / 0.4))
                    ctx.setFillColor(col(0x4A3A40, 0x33272E, 0x150F14).cg())
                    ctx.fill(CGRect(x: x - 2, y: y, width: 4, height: 46))
                    ctx.fill(CGRect(x: x - 7, y: y + 44, width: 14, height: 4))
                    ctx.setFillColor(col(0xE9DCC6, 0xD9C6A8, 0x6A5560).mix(C(0xFFDF9A), on).cg())
                    ctx.fill(CGRect(x: x - 5, y: y + 48, width: 10, height: 13))
                    ctx.setAlpha(1)
                    if on > 0.02 {
                        ctx.setBlendMode(.plusLighter)
                        ctx.setAlpha(0.6 * on * (0.5 + 0.5 * night + 0.2 * dusk))
                        ctx.draw(amberGlow, in: CGRect(x: x - 44, y: y + 54 - 44, width: 88, height: 88))
                        ctx.setAlpha(1)
                        ctx.setBlendMode(.normal)
                    }
                }
            }
        } }
        // Birds on their way home at dusk, and paper lanterns on the day you wrote most (both
        // behind the names: nothing crosses lettering).
        nightNow = nightAt(0.3)
        layer(0.3, follow: 0.2) { birds(t, night: nightNow, in: ctx) }
        if !rewinding { layer(0.85, follow: 0.95) { lanterns(t, in: ctx) } }
        // Each hill's name on a board on a stem, in front of every roof. Close in, a board that
        // would run off the frame or under the top line is left out, never cut.
        if folderNames {
            for (hi, hill) in hills.enumerated() {
                let name = self.name(hill)
                var a = smooth((gt - hill.birth - 0.45) / 0.4)
                guard !name.isEmpty, a > 0, hi < pills.count else { continue }
                let p = pills[hi], anchor = pillAnchors[hi], size = Self.pillSize(name)
                let f = [0.9, 0.95, 1.0][hill.depth], zf = 1 + (cam.z - 1) * f
                let sx = centre.x + (p.x - (centre.x + (cam.x - centre.x) * f)) * zf + drift * [0.45, 0.7, 1.0][hill.depth]
                let sy = centre.y + (p.y - (centre.y + (cam.y - centre.y) * f)) * zf
                let half = size.width / 2 * zf, ceiling = viewTop + 22
                // (Quickly: a half-faded board over houses reads as a ghost.)
                // (At once: shown or not, never left half there, at the sides or under the sky's sheet.)
                a *= min(smooth((sx - half - 8) / 5), smooth((W - 8 - sx - half) / 5), cam.z > 1.02 ? smooth((ceiling - sy - size.height * zf) / 5) : 1)
                guard a > 0.01 else { continue }
                nightNow = nightAt([0.45, 0.65, 0.85][hill.depth])
                layer([0.45, 0.7, 1.0][hill.depth], follow: f) {
                    ctx.setStrokeColor(col(0x5A4038, 0x45312E, 0x2A1D22).cg(a))
                    ctx.setLineWidth(2.5)
                    ctx.setLineCap(.round)
                    // On a short pole, straight down: a signpost, not a callout line.
                    ctx.move(to: CGPoint(x: p.x, y: p.y + 4))
                    ctx.addLine(to: CGPoint(x: p.x, y: p.y - 18))
                    ctx.strokePath()
                    _ = anchor
                    tag(name, at: p, alpha: a, night: nightNow, in: ctx)
                }
            }
        }
        nightNow = nightAt(1)
        // Close in, the town reaches the top of the frame: the sky comes back over it there, so
        // the mark and the key stay readable.
        if cam.z > 1.02, !rewinding, coverNeeded(at: max(0, t)) > 0.01 {
            // A sheet of the sky's own paper comes down over the top, with a cut edge: the mark
            // and the key sit on it, and whatever the camera pushes up there goes behind it.
            let a = smooth((cam.z - 1.02) / 0.2) * coverNeeded(at: max(0, t))
            let edge = viewTop + 34, lift = (1 - a) * (H - edge + 40)
            let band = CGMutablePath()
            band.move(to: CGPoint(x: -20, y: H + 60 + lift))
            var x = -20.0
            while x <= W + 20 { band.addLine(to: CGPoint(x: x, y: edge + lift + 7 * sin(x / 150 + 1) + 4 * sin(x / 53))); x += 12 }
            band.addLine(to: CGPoint(x: W + 20, y: H + 60 + lift))
            band.closeSubpath()
            sheet(band, top.mix(mid, 0.25), rim: false, in: ctx)
        }
        nightNow = nightAt(1)

        // The dark ground in front, with the canopy's edge: the words sit on it.
        let groundC = col(0x1F2D2A, 0x18231F, 0x0B1211)
        let front = CGMutablePath()
        front.move(to: CGPoint(x: -70, y: 0))
        var x = -70.0
        var k = 0
        while x <= W + 120 {
            // Bushes of every size, a few tall ones: a hedge, not a scalloped edge.
            let big = hash(k, 33) > 0.8
            let r = (big ? 62 : 26) + 30 * hash(k, 31)
            front.addArc(center: CGPoint(x: x, y: ground - (big ? 30 : 22) + 16 * hash(k, 32)), radius: r, startAngle: .pi, endAngle: 0, clockwise: true)
            x += r * (0.95 + 0.5 * hash(k, 34))
            k += 1
        }
        front.addLine(to: CGPoint(x: W + 120, y: 0))
        layer(1.35) { sheet(front, groundC, rim: false, in: ctx) }
        // Paper grain over everything.
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)

    }

    /// A sheet of paper: a filled shape with the soft shadow it casts on the sheet behind.
    private func sheet(_ path: CGPath, _ c: C, rim: Bool = true, in ctx: CGContext) {
        // Its shadow on the sheet behind: a few soft lines along its edge (the sheet itself
        // covers their lower half). Many times quicker than a blurred shadow or stepped copies.
        ctx.saveGState()
        ctx.translateBy(x: 0, y: 2)
        ctx.setLineJoin(.round)
        for (w, a) in [(30.0, 0.03), (20, 0.04), (12, 0.05), (5, 0.07)] {
            ctx.addPath(path)
            ctx.setStrokeColor(CGColor(gray: 0, alpha: a))
            ctx.setLineWidth(w)
            ctx.strokePath()
        }
        ctx.restoreGState()
        ctx.addPath(path)
        ctx.setFillColor(c.cg())
        ctx.fillPath()
        // The cut edge catches a little light: it's a sheet of paper, with a thickness.
        guard rim else { return }
        ctx.saveGState()
        ctx.translateBy(x: 0, y: -1.5)
        ctx.addPath(path)
        ctx.setStrokeColor(CGColor(gray: 1, alpha: 0.13))
        ctx.setLineWidth(2.5)
        ctx.strokePath()
        ctx.restoreGState()
    }

    /// How tall a house stands once it has been written in `count` times: walls, roof and chimney.
    private func height(_ i: Int, count: Int) -> Double {
        let hs = houses[i]
        let floors = 1 + min(1.7, 0.52 * Double(max(0, count - 1)).squareRoot())
        return 22 * hs.s * floors + (15 + 4 * Double(hs.roof)) * hs.s + 6 * hs.s
    }

    /// Where a house stands once the month is done: its footprint and full height.
    private func finalRect(_ i: Int) -> CGRect {
        let hs = houses[i]
        let foot = max(ground + Self.hedge, ridge(depth: hills[hs.hill].depth, hs.x, growth) - hs.y)
        return CGRect(x: hs.x - hs.w / 2, y: foot, width: hs.w, height: height(i, count: script.nodes[i].edits.count))
    }

    /// Works out, for the shape it's drawn in, where each hill's name goes and the camera's path
    /// through the month. The camera is close on the first houses and draws back just ahead of
    /// each new one; it goes in again on the day you wrote most and on the folder you wrote most
    /// in, and is back for the night. Laid out once, so any frame can be drawn from its time alone.
    private func plan() {
        let rects = script.nodes.indices.map(finalRect)
        // Names: above each hill's top roofs, moved aside or up until they cover no house and
        // no other name. The biggest hills choose first.
        pills = Array(repeating: .zero, count: hills.count)
        pillAnchors = pills
        var placed: [CGRect] = []
        let order = hills.indices.sorted { a, b in rects.indices.filter { houses[$0].hill == a }.count > rects.indices.filter { houses[$0].hill == b }.count }
        for hi in order {
            let hill = hills[hi]
            let size = Self.pillSize(name(hill))
            // Over the highest roof near the hill's top, so its pole comes straight down onto its own houses.
            var top = ridge(depth: hill.depth, hill.cx, growth) + 30 * hill.s, x = hill.cx
            for i in rects.indices where houses[i].hill == hi && abs(houses[i].x - hill.cx) < 95 * hill.s && rects[i].maxY > top { top = rects[i].maxY; x = rects[i].midX }
            let anchor = CGPoint(x: x, y: top + 16)
            pillAnchors[hi] = anchor
            var best = anchor, bestCost = Double.infinity
            // Never far from its own hill: it has to read as that hill's name.
            for dy in stride(from: 0.0, through: 80, by: 20) {
                for dx in stride(from: -90.0, through: 90, by: 30) {
                    let r = CGRect(x: min(W - 40 - size.width, max(40, anchor.x + dx - size.width / 2)), y: anchor.y + dy, width: size.width, height: size.height)
                    guard r.maxY < viewTop - 30 else { continue }
                    // Up before sideways: a straight pole says whose it is.
                    var cost = abs(dx) * 22 + dy * 16
                    for (i, h) in rects.enumerated() { let o = r.insetBy(dx: -5, dy: -5).intersection(h); if !o.isNull { cost += (houses[i].hill == hi ? 1.2 : 2.5) * o.width * o.height } }
                    for q in placed { let o = r.insetBy(dx: -8, dy: -8).intersection(q); if !o.isNull { cost += 60 * o.width * o.height } }
                    if cost < bestCost { bestCost = cost; best = CGPoint(x: r.midX, y: r.minY) }
                }
            }
            pills[hi] = best
            placed.append(CGRect(x: best.x - size.width / 2, y: best.y, width: size.width, height: size.height))
        }

        let viewW = W - 70, viewH = viewTop - viewBottom
        let mid = CGPoint(x: W / 2, y: (viewBottom + viewTop) / 2)
        func shot(_ box: CGRect, closest: Double) -> (z: Double, x: Double, y: Double) {
            let z = min(closest, max(1, min(viewW / (box.width + 200), viewH / (box.height + 70))))
            // At full width nothing moves; closer in, it centres on what's there, within the stage.
            let pull = smooth((z - 1) / 0.2)
            var x = mid.x + (box.midX - mid.x) * pull
            x = min(W + 30 - W / (2 * z), max(W / (2 * z) - 30, x))
            return (z, x, mid.y + (box.midY + 10 - mid.y) * pull)
        }
        func box(_ picked: [Int], hills shown: [Int]) -> CGRect {
            var r = CGRect.null
            for i in picked { r = r.union(rects[i]) }
            if folderNames {
                for h in shown where !name(hills[h]).isEmpty {
                    let size = Self.pillSize(name(hills[h]))
                    r = r.union(CGRect(x: pills[h].x - size.width / 2, y: pills[h].y, width: size.width, height: size.height))
                }
            }
            return r
        }
        // The two moments it goes in for.
        var moments: [(from: Double, until: Double, shot: (z: Double, x: Double, y: Double))] = []
        if let day = script.stats.busiestDay, let span = script.span(ofDay: day), span.start >= 0.55 {
            // The hill most written in that day.
            var edits = [Int](repeating: 0, count: hills.count)
            for (i, n) in script.nodes.enumerated() { edits[houses[i].hill] += n.edits.filter { $0 >= span.start && $0 < span.start + span.length }.count }
            if let h = edits.indices.max(by: { edits[$0] < edits[$1] }), edits[h] > 0 {
                let until = span.start + min(2.4, max(1.2, span.length))
                let there = script.nodes.indices.filter { houses[$0].hill == h && script.nodes[$0].birth <= until }
                moments.append((span.start - 0.15, until, shot(box(there, hills: [h]), closest: 1.7)))
            }
        }
        // (Its own shot even on the hill the busiest day was on: the line about it needs its picture.)
        if namesTopFolder, let m = script.topFolderMoment, let h = hills.firstIndex(where: { $0.folder == topFolder }) {
            let there = script.nodes.indices.filter { houses[$0].hill == h }
            moments.append((m.from + 0.1, m.until - 0.1, shot(box(there, hills: [h]), closest: 1.6)))
        }
        // A tenth of a second apart, on past the end so it's back, wide, for the night.
        let n = Int(((growth + 1.8) / Self.shotStep).rounded(.up)) + 1
        var raw: [(z: Double, x: Double, y: Double)] = [], plain = raw
        for k in 0..<n {
            let at = Double(k) * Self.shotStep
            // A little ahead of the film, so it has drawn back by the time a house arrives.
            let tau = at + 0.7
            let born = script.nodes.indices.filter { script.nodes[$0].birth <= tau || $0 == 0 }
            var s = shot(box(born, hills: hills.indices.filter { hills[$0].birth <= tau }), closest: 2.0)
            plain.append(s)
            for m in moments where at >= m.from && at <= m.until && m.shot.z > s.z + 0.08 { s = m.shot }
            raw.append(s)
        }
        // Smoothed over about a second, so it glides.
        func glide(_ raw: [(z: Double, x: Double, y: Double)]) -> [(z: Double, x: Double, y: Double)] {
            raw.indices.map { k in
                var z = 0.0, x = 0.0, y = 0.0, sum = 0.0
                for d in -12...12 {
                    let j = min(raw.count - 1, max(0, k + d)), w = exp(-Double(d * d) / 40)
                    z += raw[j].z * w; x += raw[j].x * w; y += raw[j].y * w; sum += w
                }
                return (z / sum, x / sum, y / sum)
            }
        }
        shots = glide(raw)
        let reaches: [Double] = shots.indices.map { k in
            let at = Double(k) * Self.shotStep, s = shots[k]
            var top = -Double.infinity
            for i in script.nodes.indices where script.nodes[i].birth <= at { top = max(top, mid.y + (rects[i].maxY - s.y) * s.z) }
            return top > viewTop - 40 ? 1 : 0
        }
        cover = reaches.indices.map { k in
            var sum = 0.0, n = 0.0
            for d in -4...4 { sum += reaches[min(reaches.count - 1, max(0, k + d))]; n += 1 }
            return sum / n
        }
        wideShots = glide(plain)
    }

    private func camera(at t: Double) -> (z: Double, x: Double, y: Double) {
        func at(_ shots: [(z: Double, x: Double, y: Double)]) -> (z: Double, x: Double, y: Double) {
            guard let last = shots.last else { return (1, W / 2, (viewBottom + viewTop) / 2) }
            let f = max(0, t) / Self.shotStep
            let k = Int(f)
            guard k + 1 < shots.count else { return last }
            let a = shots[k], b = shots[k + 1], u = f - Double(k)
            return (a.z + (b.z - a.z) * u, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u)
        }
        guard rewinding else { return at(shots) }
        // The rewind is wide, and comes in to where the film itself begins: no jump at the seam.
        let wide = at(wideShots), film = at(shots), w = 1 - smooth((t - appStart) / 1.6)
        return (wide.z + (film.z - wide.z) * w, wide.x + (film.x - wide.x) * w, wide.y + (film.y - wide.y) * w)
    }

    private func coverNeeded(at t: Double) -> Double {
        guard !cover.isEmpty else { return 0 }
        let f = t / Self.shotStep, k = min(cover.count - 1, Int(f))
        let next = min(cover.count - 1, k + 1)
        return cover[k] + (cover[next] - cover[k]) * (f - Double(k))
    }

    /// How many hills the town has, and where each note's house stands at the end (for tests).
    var hillCount: Int { hills.count }
    func houseFrames(canvas: FilmCanvas) -> [CGRect] {
        place(canvas)
        return script.nodes.indices.map(finalRect)
    }

    /// How close the camera is at film time `t` in a shape: 1 is the whole stage.
    func closeness(at t: Double, canvas: FilmCanvas) -> Double {
        place(canvas)
        return camera(at: t).z
    }

    /// On the day you wrote most, paper lanterns go up from the houses you wrote in.
    private func lanterns(_ t: Double, in ctx: CGContext) {
        guard let day = script.stats.busiestDay, let span = script.span(ofDay: day), t <= growth + 0.2 else { return }
        let lit = script.nodes.indices.filter { i in script.nodes[i].edits.contains { $0 >= span.start && $0 < span.start + span.length } }
        guard !lit.isEmpty else { return }
        let count = min(14, max(5, script.stats.busiestDayEdits / 3))
        ctx.setBlendMode(.normal)
        for k in 0..<count {
            let from = span.start + Double(k) / Double(count) * span.length * 0.8
            let age = t - from
            guard age > 0, age < 2.6 else { continue }
            let i = lit[Int(hash(k, 71) * Double(lit.count)) % lit.count]
            let hs = houses[i], depth = hills[hs.hill].depth
            let u = age / 2.6
            let x = hs.x + sin(age * 1.7 + Double(k)) * 9 + (hash(k, 72) - 0.5) * 50 * u
            let y = ridge(depth: depth, hs.x, growth) - hs.y + height(i, count: 3) + 150 * u * (0.8 + 0.4 * hash(k, 73))
            let a = smooth(age / 0.3) * (1 - smooth((u - 0.7) / 0.3))
            let s = hs.s
            ctx.setBlendMode(.plusLighter)
            ctx.setAlpha(0.5 * a)
            ctx.draw(amberGlow, in: CGRect(x: x - 26 * s, y: y - 26 * s, width: 52 * s, height: 52 * s))
            ctx.setBlendMode(.normal)
            ctx.setAlpha(a)
            ctx.addPath(CGPath(roundedRect: CGRect(x: x - 5 * s, y: y - 7 * s, width: 10 * s, height: 14 * s), cornerWidth: 3 * s, cornerHeight: 3 * s, transform: nil))
            ctx.setFillColor(C(0xFFCB6B).cg())
            ctx.fillPath()
            ctx.setFillColor(C(0xE8791A).cg())
            ctx.fill(CGRect(x: x - 3.5 * s, y: y - 8.5 * s, width: 7 * s, height: 2.2 * s))
            ctx.setAlpha(1)
        }
    }

    private func tree(at p: CGPoint, r: Double, cypress: Bool = false, color: C, in ctx: CGContext) {
        if cypress {
            // A tall dark cypress, as on the hills of the site's town.
            let h = r * 3.1, w = r * 0.62
            for (dx, dy, c) in [(2.0, -3.0, CGColor(gray: 0, alpha: 0.14)), (0, 0, color.mix(C(0x1B3A30), 0.45).cg())] {
                let path = CGMutablePath()
                path.move(to: CGPoint(x: p.x + dx, y: p.y + dy + h))
                path.addQuadCurve(to: CGPoint(x: p.x + dx, y: p.y + dy), control: CGPoint(x: p.x + dx + w * 1.5, y: p.y + dy + h * 0.3))
                path.addQuadCurve(to: CGPoint(x: p.x + dx, y: p.y + dy + h), control: CGPoint(x: p.x + dx - w * 1.5, y: p.y + dy + h * 0.3))
                ctx.addPath(path)
                ctx.setFillColor(c)
                ctx.fillPath()
            }
            return
        }
        ctx.setFillColor(C(0x5A4038).cg())
        ctx.fill(CGRect(x: p.x - r * 0.09, y: p.y - 2, width: r * 0.18, height: r * 0.9))
        let blobs = [(0.0, 1.25, 1.0), (-0.55, 0.9, 0.72), (0.55, 0.95, 0.7), (0.0, 0.75, 0.8)]
        // Its shade, then the crown.
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.14))
        for (dx, dy, k) in blobs {
            ctx.fillEllipse(in: CGRect(x: p.x + dx * r - r * k + 2, y: p.y + dy * r - r * k * 0.9 + r * 0.3 - 3, width: r * k * 2, height: r * k * 1.8))
        }
        ctx.setFillColor(color.cg())
        for (dx, dy, k) in blobs {
            ctx.fillEllipse(in: CGRect(x: p.x + dx * r - r * k, y: p.y + dy * r - r * k * 0.9 + r * 0.3, width: r * k * 2, height: r * k * 1.8))
        }
        // A lighter side, as paper catches the light.
        ctx.setFillColor(CGColor(gray: 1, alpha: 0.07))
        ctx.fillEllipse(in: CGRect(x: p.x - r * 0.55, y: p.y + r * 1.15, width: r * 1.1, height: r * 0.9))
    }

    private func house(_ i: Int, groundY: Double, t: Double, gt: Double, dusk: Double, night: Double, col: (UInt32, UInt32, UInt32) -> C, in ctx: CGContext) {
        let n = script.nodes[i], hs = houses[i]
        guard gt >= n.birth else { return }
        var count = 0, flash = 0.0, last = n.birth
        var recent: [Double] = []
        for et in n.edits {
            if et > gt { break }
            count += 1
            last = et
            let age = gt - et
            if age < 2.0 { recent.append(age) }
            flash = max(flash, exp(-age / 0.55))
        }
        if t > growth { flash = 0 }
        let born = gt - n.birth
        let pop = backOut(born / 0.5) * (1 + 0.07 * flash * flash)
        let s = hs.s
        // It grows floors as it's written in.
        let floorsF = 1 + min(1.7, 0.52 * Double(max(0, count - 1)).squareRoot())
        // It comes up as a small whole house (never a wide flat roof on the grass).
        let k = min(1, pop)
        let w = hs.w * k, bh = 22 * s * floorsF * pop, rh = (15 + 4 * Double(hs.roof)) * s * pop * (hs.style == 3 ? 1.3 : 1)
        let x0 = hs.x - w / 2, y0 = groundY - 3 * s
        let walls: [(UInt32, UInt32, UInt32)] = [(0xF0DFC2, 0xD3B596, 0x55424E), (0xE7D0AE, 0xC9A687, 0x4E3C49), (0xEFD3BD, 0xD2A796, 0x57404C), (0xDDCFB6, 0xBFA78F, 0x4A3D4A)]
        // The roof says who wrote in it, in any light: warm ochre for yours alone, slate blue once
        // your AI has helped.
        // (Still told apart at night: the last frame is the one that's kept.)
        let mine: [(UInt32, UInt32, UInt32)] = [(0xD9883A, 0xC06F33, 0x9A6230), (0xC97A2E, 0xB0622B, 0x8D582B), (0xE09A4A, 0xC77D3D, 0xA66D38)]
        let helped: [(UInt32, UInt32, UInt32)] = [(0x5F84B5, 0x4D6C9C, 0x3F5F97), (0x4F74A6, 0x41608E, 0x38568C), (0x6E93C2, 0x5878A6, 0x4A6BA3)]
        let aiRoof = smooth((gt - aiFrom[i]) / 0.35)
        let wall = col(walls[hs.wall].0, walls[hs.wall].1, walls[hs.wall].2)
        let roof = col(mine[hs.roof].0, mine[hs.roof].1, mine[hs.roof].2).mix(col(helped[hs.roof].0, helped[hs.roof].1, helped[hs.roof].2), aiRoof)
        // Chimney behind the roof.
        let cx = hs.chimneyLeft ? x0 + w * 0.22 : x0 + w * 0.78
        let chimTop = y0 + bh + rh * 0.55 + 9 * s
        ctx.setFillColor(col(0xB96549, 0x96503F, 0x3A2226).cg())
        ctx.fill(CGRect(x: cx - 3.2 * s * k, y: y0 + bh, width: 6.4 * s * k, height: rh * 0.55 + 9 * s * k))
        // Some have a low wing at one side, with its own lean-to roof.
        if hs.style == 2 {
            let side: Double = hs.chimneyLeft ? 1 : -1
            let ww = w * 0.42, wh = 15 * s * pop
            let wx = side > 0 ? x0 + w - 1 : x0 - ww + 1
            ctx.setFillColor(wall.mix(C(0x000000), 0.07).cg())
            ctx.fill(CGRect(x: wx, y: y0, width: ww, height: wh))
            let lean = CGMutablePath()
            lean.move(to: CGPoint(x: wx - 2 * s, y: y0 + wh - 1))
            lean.addLine(to: CGPoint(x: side > 0 ? wx : wx + ww, y: y0 + wh + 9 * s * pop))
            lean.addLine(to: CGPoint(x: wx + ww + 2 * s, y: y0 + wh - 1))
            lean.closeSubpath()
            ctx.addPath(lean)
            ctx.setFillColor(roof.mix(C(0x000000), 0.1).cg())
            ctx.fillPath()
        }
        // Body, with the shade it casts.
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.2))
        ctx.fill(CGRect(x: x0 + 3 * s, y: y0 - 2.5 * s, width: w, height: bh))
        ctx.setFillColor(wall.cg())
        ctx.fill(CGRect(x: x0, y: y0, width: w, height: bh))
        // Roof.
        let rp = CGMutablePath()
        rp.move(to: CGPoint(x: x0 - 3.5 * s * k, y: y0 + bh - 1))
        if hs.style == 1 {
            // Side on: a long ridge.
            rp.addLine(to: CGPoint(x: x0 + w * 0.2, y: y0 + bh + rh * 0.8))
            rp.addLine(to: CGPoint(x: x0 + w * 0.8, y: y0 + bh + rh * 0.8))
        } else {
            rp.addLine(to: CGPoint(x: hs.x, y: y0 + bh + rh))
        }
        rp.addLine(to: CGPoint(x: x0 + w + 3.5 * s * k, y: y0 + bh - 1))
        rp.closeSubpath()
        // The roof's shade on the wall, then the roof.
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.13))
        ctx.fill(CGRect(x: x0, y: y0 + bh - 3.5 * s, width: w, height: 3.5 * s))
        ctx.addPath(rp)
        ctx.setFillColor(roof.cg())
        ctx.fillPath()
        // Windows: lit for a while after it's written in, and at night where the work was.
        let ai = smooth((gt - aiFrom[i]) / 0.35)
        let xfrac = hs.x / W
        let evening = smooth((night * 1.5 - xfrac * 0.5))
        // As the film names the folder you wrote most in, its hill's lights come on first.
        let first = namesTopFolder && hills[hs.hill].folder == topFolder
            ? 0.85 * smooth((gt - topFolderFrom - 0.9 * hash(i, 61)) / 0.3) : 0
        // On the day you wrote most, the houses you wrote in are lit while the film is on it.
        let today = busy.contains(i) ? 0.9 * smooth((gt - busyFrom) / 0.25) * (1 - smooth((gt - busyUntil) / 0.4)) : 0
        let lit = min(1, max(flash, first, today, dusk * 0.55 * exp(-(gt - last) / 2.2), evening * (0.3 + 0.7 * worked[i])))
        let dark = col(0x6B5B68, 0x4B3B49, 0x1B131C)
        let lightC = C(0xFFCB6B).mix(C(0x8DBBF0), ai)
        let glass = dark.mix(lightC, min(1, lit * 1.15))
        let rows = max(1, Int(floorsF + 0.25))
        let ww = 8 * s * k, wh = 10.5 * s * k
        for r in 0..<rows {
            let wy = y0 + (6 + Double(r) * 22) * s * pop
            guard wy + wh < y0 + bh + 2 else { continue }
            for wx in [x0 + w * 0.27 - ww / 2, x0 + w * 0.73 - ww / 2] {
                ctx.setFillColor(glass.cg())
                ctx.fill(CGRect(x: wx, y: wy, width: ww, height: wh))
            }
        }
        // A door on the smaller ones.
        if hs.style < 2, floorsF < 1.7 {
            ctx.setFillColor(roof.mix(C(0x2A1D22), 0.45).cg())
            ctx.fill(CGRect(x: hs.x - 3 * s * k, y: y0, width: 6 * s * k, height: 9.5 * s * pop))
        }
        if lit > 0.05 {
            // Its light spills a little, more as it gets dark.
            let darkness = 0.12 + 0.3 * dusk + 0.5 * night
            let gr = (22 + 30 * worked[i] * night + 14 * flash) * s
            ctx.setBlendMode(.plusLighter)
            ctx.setAlpha(min(0.8, lit * darkness * (1 - ai)))
            ctx.draw(amberGlow, in: CGRect(x: hs.x - gr, y: y0 + bh * 0.45 - gr, width: gr * 2, height: gr * 2))
            ctx.setAlpha(min(0.5, lit * darkness * ai))
            ctx.draw(blueGlow, in: CGRect(x: hs.x - gr, y: y0 + bh * 0.45 - gr, width: gr * 2, height: gr * 2))
            ctx.setAlpha(1)
            ctx.setBlendMode(.normal)
        }
        // Smoke from the chimney each time it's written in.
        for age in recent.suffix(2) where t <= growth + 0.3 {
            for j in 0..<4 {
                let a = age - Double(j) * 0.16
                guard a > 0, a < 1.7 else { continue }
                let u = a / 1.7
                let px = cx + sin(a * 4.2 + Double(i)) * 5 * s * u + 7 * s * u, py = chimTop + 46 * s * u
                let r = (2.6 + 5.5 * u) * s
                ctx.setFillColor(col(0xFFFFFF, 0xFFF1E2, 0xC9B8C4).cg(0.55 * (1 - u)))
                ctx.fillEllipse(in: CGRect(x: px - r, y: py - r, width: r * 2, height: r * 2))
            }
        }
    }

    private static func pillSize(_ name: String) -> CGSize { CGSize(width: FilmKit.width(shortened(name), 32, 0.3) + 34, height: 48) }
    private static func shortened(_ name: String) -> String { name.count > 18 ? name.prefix(17) + "\u{2026}" : name }

    /// A folder's name on a paper board, its bottom centre at `p`.
    private func tag(_ name: String, at p: CGPoint, alpha: Double, night: Double, in ctx: CGContext) {
        let name = Self.shortened(name)
        let size = Self.pillSize(name)
        let rect = CGRect(x: p.x - size.width / 2, y: p.y - (1 - alpha) * 10, width: size.width, height: size.height)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: 3), blur: 8, color: CGColor(gray: 0, alpha: 0.3))
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 11, cornerHeight: 11, transform: nil))
        ctx.setFillColor(C(0xFFF6E8).mix(C(0xD8C7BE), night * 0.55).cg())
        ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(name, 32, 0.3, C(0x3A2B2E).cg(alpha), at: CGPoint(x: p.x, y: rect.minY + 14), align: 0.5, in: ctx)
    }

    /// A few paper clouds, where the sky has room for them.
    private func clouds(_ t: Double, night: Double, in ctx: CGContext) {
        let low = ground + 650 * stretch, high = H - (H - viewTop - 150) - 190
        guard high - low > 150 else { return }
        let c = C(0xFFFDF8).mix(C(0xFFE3CC), smooth(min(t, growth) / growth)).mix(C(0x3C2A44), night)
        for k in 0..<3 {
            let y = low + (high - low) * (0.2 + 0.3 * Double(k) + 0.1 * hash(k, 81))
            let x = (W * (0.15 + 0.36 * Double(k)) + hash(k, 82) * 90 + t * (5 + 2 * Double(k))).truncatingRemainder(dividingBy: W + 300) - 150
            let s = 0.8 + 0.5 * hash(k, 83)
            ctx.setFillColor(c.cg(0.85 - 0.35 * night))
            for (dx, dy, r) in [(0.0, 0.0, 34.0), (38, 6, 44), (82, -2, 32), (-34, -6, 24)] {
                ctx.fillEllipse(in: CGRect(x: x + dx * s - r * s, y: y + dy * s - r * s * 0.62, width: r * s * 2, height: r * s * 1.24))
            }
            ctx.fill(CGRect(x: x - 52 * s, y: y - 22 * s, width: 160 * s, height: 16 * s))
        }
    }

    private func birds(_ t: Double, night: Double, in ctx: CGContext) {
        let t0 = growth - 3.4
        let a = smooth((t - t0) / 0.5) * (1 - night)
        guard a > 0 else { return }
        ctx.setStrokeColor(C(0x4A3540).cg(0.8 * a))
        ctx.setLineWidth(2.6)
        ctx.setLineCap(.round)
        for (k, (dx, dy)) in [(0.0, 0.0), (44.0, 22.0), (62.0, -26.0), (104.0, 38.0), (128.0, -8.0)].enumerated() {
            let x = W + 60 - (t - t0) * 170 + dx, y = ground + 760 * stretch + dy + sin((t - t0) * 1.3 + Double(k)) * 8 + (t - t0) * 9
            let flap = sin((t - t0) * 9 + Double(k) * 1.3)
            let wing = 15.0, lift = 5 + 6 * flap
            ctx.move(to: CGPoint(x: x - wing, y: y + lift))
            ctx.addQuadCurve(to: CGPoint(x: x, y: y), control: CGPoint(x: x - wing * 0.5, y: y + lift + 3))
            ctx.addQuadCurve(to: CGPoint(x: x + wing, y: y + lift), control: CGPoint(x: x + wing * 0.5, y: y + lift + 3))
            ctx.strokePath()
        }
    }

}
