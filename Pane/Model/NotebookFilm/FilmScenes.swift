import CoreGraphics
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

    private static func font(_ size: Double, _ weight: Double) -> CTFont {
        let base = CTFontCreateUIFontForLanguage(.system, size, nil)!
        let desc = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base), [kCTFontTraitsAttribute: [kCTFontWeightTrait: weight]] as CFDictionary)
        return CTFontCreateWithFontDescriptor(desc, size, nil)
    }

    static func width(_ s: String, _ size: Double, _ weight: Double = 0) -> Double {
        let a = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight)])
        return CTLineGetTypographicBounds(CTLineCreateWithAttributedString(a), nil, nil, nil)
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
    private var growth: Double { script.growth }

    struct Hill { var folder: Int; var cx, base, w, h, s: Double; var depth: Int; var birth: Double; var skew: Double }
    struct House { var hill: Int; var x, y, s, w: Double; var wall, roof: Int; var chimneyLeft: Bool }
    private var hills: [Hill] = []
    private var houses: [House] = []
    private var order: [Int] = []
    private var trees: [(hill: Int, x: Double, y: Double, r: Double, tone: Double)] = []
    private let worked: [Double]
    private let aiFrom: [Double]
    private let amberGlow = FilmKit.glow(C(0xFFC85A)), blueGlow = FilmKit.glow(C(0x8FC8FF)), warmHaze = FilmKit.glow(C(0xFFB36B))
    private static let rowBase = [352.0, 196, 34]

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    var captions: [String]? { ["Each house is a note", "It grows a floor as it\u{2019}s written in"] }
    var rewinds: Bool { true }
    var wordsDelay: Double { 0.65 }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}

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
    func topInk(_ t: Double) -> FilmRenderer.RGB { C(0x3A2B2E).mix(C(0xFFF4E6), smooth((t - growth) / 1.3)) }

    init(script: FilmScript, folderNames: Bool) {
        self.script = script
        self.folderNames = folderNames
        let counts = script.nodes.map(\.edits.count).sorted()
        let busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        worked = script.nodes.map { min(1, (Double($0.edits.count) / busy).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        layout()
    }

    private func place(_ canvas: FilmCanvas) {
        H = canvas.height
        ground = 340 + canvas.bottom
        // Room between the ground and the top line, against what the shared shape has.
        stretch = min(1.5, max(0.94, (H - canvas.top - ground - 260) / 790))
    }

    private func layout() {
        let F = script.folders.count
        var count = [Int](repeating: 0, count: F), first = [Double](repeating: .infinity, count: F)
        for n in script.nodes { count[n.folder] += 1; first[n.folder] = min(first[n.folder], n.birth) }
        // Three sheets of hills, front to back. The biggest folders get the front, where all of
        // a hill shows; each row's hills sit between the row in front's.
        let bySize = (0..<F).sorted { count[$0] == count[$1] ? $0 < $1 : count[$0] > count[$1] }
        var rows: [[Int]] = [[], [], []]            // depth 2 (front), 1, 0
        for (j, f) in bySize.enumerated() { rows[F <= 2 ? j : j % 3].append(f) }
        for (ri, row) in rows.enumerated() {
            let depth = 2 - ri
            // The row's biggest hill on the left in one row and on the right in the next, so the
            // town isn't all on one side.
            var ordered = row.sorted { count[$0] > count[$1] }
            if ri % 2 == 1 { ordered.reverse() }
            for (k, f) in ordered.enumerated() {
                let m = Double(ordered.count)
                var xs = ri == 1 ? (Double(k) + 1) / (m + 1) : (Double(k) + 0.5) / m
                // Two folders: side by side, not one behind the other.
                if F == 2 { xs = ri == 0 ? 0.36 : 0.7 }
                if F >= 3, m == 1 { xs = ri == 1 ? 0.62 : 0.4 }
                let n = Double(count[f])
                let s = [0.94, 1.08, 1.24][depth]
                let w = min(W * 0.9 / max(1, m) * 1.25, (300 + 46 * n.squareRoot()) * (0.94 + 0.12 * hash(f, 5)))
                let h = (140 + 21 * n.squareRoot()) * (0.92 + 0.16 * hash(f, 7))
                let base = Self.rowBase[depth]
                let cx = 60 + xs * (W - 120) + (hash(f, 3) - 0.5) * 36
                hills.append(Hill(folder: f, cx: cx, base: base, w: w, h: h, s: s, depth: depth, birth: max(0, first[f] - 0.3), skew: 0))
            }
        }
        hills.sort { $0.depth == $1.depth ? $0.cx < $1.cx : $0.depth < $1.depth }
        // Houses: terraces under each hill's top, the first notes nearest the top.
        houses = Array(repeating: House(hill: 0, x: 0, y: 0, s: 1, w: 40, wall: 0, roof: 0, chimneyLeft: false), count: script.nodes.count)
        for (hi, hill) in hills.enumerated() {
            let notes = script.nodes.indices.filter { script.nodes[$0].folder == hill.folder }
            var s = hill.s
            var perRow = 1, rows = 1
            for _ in 0..<14 {
                perRow = max(1, Int(hill.w * 0.8 / (56 * s)))
                // Lower terraces hold one more each.
                rows = 1
                var held = perRow
                while held < notes.count { rows += 1; held += perRow + rows - 1 }
                if rows <= 4 { break }
                s *= 0.93
            }
            var spots: [(x: Double, drop: Double, key: Double)] = []
            for r in 0..<rows {
                let n = perRow + r
                for k in 0..<n {
                    let u = (Double(k) + 0.5 - Double(n) / 2) / Double(perRow + 3) * 2 * 0.94
                    let x = hill.cx + u * hill.w / 2 + (hash(hi * 100 + r, k) - 0.5) * 9 * s
                    spots.append((x, (2 + Double(r) * 45) * s + hash(hi * 37 + k, r) * 6 * s, Double(r) * 0.8 + abs(u) * 1.3 + hash(hi * 11 + k, r * 3 + 1) * 0.55))
                }
            }
            spots.sort { $0.key < $1.key }
            for (k, i) in notes.enumerated() {
                let spot = spots[k % spots.count]
                houses[i] = House(hill: hi, x: spot.x, y: spot.drop, s: s, w: (40 + 9 * hash(i, 1)) * s, wall: Int(hash(i, 2) * 4), roof: Int(hash(i, 3) * 3), chimneyLeft: hash(i, 4) < 0.5)
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
        let night = smooth((t - growth) / 1.3)
        func col(_ day: UInt32, _ dk: UInt32, _ nt: UInt32) -> C { C(day).mix(C(dk), dusk).mix(C(nt), night) }
        // The sky goes down through a deep orange, not a grey halfway between dusk and night.
        func sky(_ day: UInt32, _ dk: UInt32, _ ember: UInt32, _ nt: UInt32) -> C {
            let d = C(day).mix(C(dk), dusk)
            return night < 0.5 ? d.mix(C(ember), smooth(night * 2)) : C(ember).mix(C(nt), smooth(night * 2 - 1))
        }
        // A town of two or three hills is seen from nearer.
        let folders = hills.count
        let zoom = folders <= 2 ? 1.3 : folders == 3 ? 1.15 : 1
        // The whole stage drifts a little, near sheets more than far ones: paper at different depths.
        let total = growth + FilmScript.outro
        let drift = -16 * cos(min(1, max(0, t / total)) * .pi)
        func layer(_ depth: Double, near: Bool = false, _ body: () -> Void) {
            ctx.saveGState()
            ctx.translateBy(x: drift * depth, y: 0)
            if near, zoom != 1 {
                ctx.translateBy(x: W / 2, y: ground)
                ctx.scaleBy(x: zoom, y: zoom)
                ctx.translateBy(x: -W / 2, y: -ground)
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
        // Far hills, three sheets of paper.
        let far: [(Double, Double, C)] = [(ground + 560 * stretch, 44, col(0xE4D3E2, 0xCFAFC9, 0x402845)), (ground + 505 * stretch, 52, col(0xD0BDD8, 0xB494BC, 0x33213D)), (ground + 452 * stretch, 44, col(0xB9B2CC, 0x9482AE, 0x281C35))]
        for (i, (y, amp, c)) in far.enumerated() { layer(0.12 + 0.08 * Double(i)) {
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
        for depth in 0..<3 { layer([0.45, 0.7, 1.0][depth], near: true) {
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
                    tree(at: CGPoint(x: tr.x, y: ridge(depth: depth, tr.x, gt) - tr.y - 4), r: tr.r * min(1, up), color: col(0x4E7556, 0x355644, 0x10241E).mix(C(0x2A4A3A), tr.tone * 0.4), in: ctx)
                }
            }
            for hi in rowHills {
                while drawn < order.count, houses[order[drawn]].hill == hi {
                    let i = order[drawn]
                    house(i, groundY: ridge(depth: depth, houses[i].x, gt) - houses[i].y, t: t, gt: gt, dusk: dusk, night: night, col: col, in: ctx)
                    drawn += 1
                }
            }
            if folderNames {
                for hi in rowHills {
                    let hill = hills[hi]
                    let name = script.folders[hill.folder]
                    let a = smooth((gt - hill.birth - 0.45) / 0.4)
                    guard !name.isEmpty, a > 0 else { continue }
                    // Its name on a board above the highest roof the hill will have, on a short stick.
                    let board = signY(hi, depth: depth)
                    ctx.setFillColor(col(0x5A4038, 0x45312E, 0x1A1216).cg(a))
                    ctx.fill(CGRect(x: hill.cx - 1.5, y: board - 15, width: 3, height: 17))
                    tag(name, at: CGPoint(x: hill.cx, y: board), alpha: a, night: night, in: ctx)
                }
            }
            // Street lamps along the front, lit as the light goes.
            if depth == 2 {
                for k in 0..<4 {
                    let x = 70 + (Double(k) + 0.2 + 0.6 * hash(k, 51)) / 4 * (W - 140)
                    let y = ridge(depth: 2, x, gt) - 6
                    let on = smooth((dusk - 0.35 - 0.1 * hash(k, 52)) / 0.15)
                    ctx.setFillColor(col(0x4A3A40, 0x33272E, 0x150F14).cg())
                    ctx.fill(CGRect(x: x - 2, y: y, width: 4, height: 46))
                    ctx.fill(CGRect(x: x - 7, y: y + 44, width: 14, height: 4))
                    ctx.setFillColor(col(0xE9DCC6, 0xD9C6A8, 0x6A5560).mix(C(0xFFDF9A), on).cg())
                    ctx.fill(CGRect(x: x - 5, y: y + 48, width: 10, height: 13))
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
        // Birds on their way home at dusk, and paper lanterns on the day you wrote most.
        layer(0.3) { birds(t, night: night, in: ctx) }
        layer(0.85, near: true) { lanterns(t, in: ctx) }

        // The dark ground in front, with the canopy's edge: the words sit on it.
        let groundC = col(0x1F2D2A, 0x18231F, 0x0B1211)
        let front = CGMutablePath()
        front.move(to: CGPoint(x: -70, y: 0))
        var x = -70.0
        var k = 0
        while x <= W + 120 {
            let r = 38 + 26 * hash(k, 31)
            front.addArc(center: CGPoint(x: x, y: ground - 24 + 18 * hash(k, 32)), radius: r, startAngle: .pi, endAngle: 0, clockwise: true)
            x += r * 1.25
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
        let floors = 1 + min(2.1, 0.6 * Double(max(0, count - 1)).squareRoot())
        return 22 * hs.s * floors + (15 + 4 * Double(hs.roof)) * hs.s + 6 * hs.s
    }

    /// Where a hill's signboard sits: above the highest roof near its top once the month is
    /// done, and above any board it would otherwise cover.
    private func signY(_ hi: Int, depth: Int) -> Double {
        func top(_ h: Int) -> Double {
            let hill = hills[h]
            var y = ridge(depth: hill.depth, hill.cx, growth) + 30 * hill.s
            for i in script.nodes.indices where houses[i].hill == h && abs(houses[i].x - hill.cx) < 95 * hill.s {
                y = max(y, ridge(depth: hill.depth, houses[i].x, growth) - houses[i].y + height(i, count: script.nodes[i].edits.count))
            }
            return y + 14
        }
        var y = top(hi)
        // Boards drawn before this one keep their place; this one goes above them.
        for other in hills.indices where other < hi && abs(hills[other].cx - hills[hi].cx) < 190 {
            let o = signY(other, depth: hills[other].depth)
            if abs(o - y) < 48 { y = o + 50 }
        }
        return y
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

    private func tree(at p: CGPoint, r: Double, color: C, in ctx: CGContext) {
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
        let floorsF = 1 + min(2.1, 0.6 * Double(max(0, count - 1)).squareRoot())
        let w = hs.w, bh = 22 * s * floorsF * pop, rh = (15 + 4 * Double(hs.roof)) * s * pop
        let x0 = hs.x - w / 2, y0 = groundY - 3 * s
        let walls: [(UInt32, UInt32, UInt32)] = [(0xF0DFC2, 0xD3B596, 0x55424E), (0xE7D0AE, 0xC9A687, 0x4E3C49), (0xEFD3BD, 0xD2A796, 0x57404C), (0xDDCFB6, 0xBFA78F, 0x4A3D4A)]
        // The roof says who wrote in it, in any light: warm ochre for yours alone, slate blue once
        // your AI has helped.
        let mine: [(UInt32, UInt32, UInt32)] = [(0xD9883A, 0xC06F33, 0x4A2F26), (0xC97A2E, 0xB0622B, 0x432A23), (0xE09A4A, 0xC77D3D, 0x51352A)]
        let helped: [(UInt32, UInt32, UInt32)] = [(0x5F84B5, 0x4D6C9C, 0x232F4A), (0x4F74A6, 0x41608E, 0x1F2A43), (0x6E93C2, 0x5878A6, 0x283552)]
        let aiRoof = smooth((gt - aiFrom[i]) / 0.35)
        let wall = col(walls[hs.wall].0, walls[hs.wall].1, walls[hs.wall].2)
        let roof = col(mine[hs.roof].0, mine[hs.roof].1, mine[hs.roof].2).mix(col(helped[hs.roof].0, helped[hs.roof].1, helped[hs.roof].2), aiRoof)
        // Chimney behind the roof.
        let cx = hs.chimneyLeft ? x0 + w * 0.22 : x0 + w * 0.78
        let chimTop = y0 + bh + rh * 0.55 + 9 * s
        ctx.setFillColor(col(0xB96549, 0x96503F, 0x3A2226).cg())
        ctx.fill(CGRect(x: cx - 3.2 * s, y: y0 + bh, width: 6.4 * s, height: rh * 0.55 + 9 * s))
        // Body, with the shade it casts.
        ctx.setFillColor(CGColor(gray: 0, alpha: 0.2))
        ctx.fill(CGRect(x: x0 + 3 * s, y: y0 - 2.5 * s, width: w, height: bh))
        ctx.setFillColor(wall.cg())
        ctx.fill(CGRect(x: x0, y: y0, width: w, height: bh))
        // Roof.
        let rp = CGMutablePath()
        rp.move(to: CGPoint(x: x0 - 3.5 * s, y: y0 + bh - 1))
        rp.addLine(to: CGPoint(x: hs.x, y: y0 + bh + rh))
        rp.addLine(to: CGPoint(x: x0 + w + 3.5 * s, y: y0 + bh - 1))
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
        let lit = min(1, max(flash, dusk * 0.55 * exp(-(gt - last) / 2.2), evening * (0.3 + 0.7 * worked[i])))
        let dark = col(0x6B5B68, 0x4B3B49, 0x1B131C)
        let lightC = C(0xFFCB6B).mix(C(0x9CD2FF), ai)
        let glass = dark.mix(lightC, min(1, lit * 1.15))
        let rows = max(1, Int(floorsF + 0.25))
        let ww = 8 * s, wh = 10.5 * s
        for r in 0..<rows {
            let wy = y0 + (6 + Double(r) * 22) * s * pop
            guard wy + wh < y0 + bh + 2 else { continue }
            for wx in [x0 + w * 0.27 - ww / 2, x0 + w * 0.73 - ww / 2] {
                ctx.setFillColor(glass.cg())
                ctx.fill(CGRect(x: wx, y: wy, width: ww, height: wh))
            }
        }
        if lit > 0.05 {
            // Its light spills a little, more as it gets dark.
            let darkness = 0.12 + 0.3 * dusk + 0.5 * night
            let gr = (22 + 30 * worked[i] * night + 14 * flash) * s
            ctx.setBlendMode(.plusLighter)
            ctx.setAlpha(min(0.8, lit * darkness * (1 - ai)))
            ctx.draw(amberGlow, in: CGRect(x: hs.x - gr, y: y0 + bh * 0.45 - gr, width: gr * 2, height: gr * 2))
            ctx.setAlpha(min(0.8, lit * darkness * ai))
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

    private func tag(_ name: String, at p: CGPoint, alpha: Double, night: Double, in ctx: CGContext) {
        var name = name
        if name.count > 20 { name = name.prefix(19) + "\u{2026}" }
        let w = FilmKit.width(name, 26, 0.3) + 28, h = 40.0
        let rect = CGRect(x: p.x - w / 2, y: p.y - (1 - alpha) * 10, width: w, height: h)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: 3), blur: 8, color: CGColor(gray: 0, alpha: 0.3))
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 9, cornerHeight: 9, transform: nil))
        ctx.setFillColor(C(0xFFF6E8).mix(C(0xD8C7BE), night * 0.55).cg())
        ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(name, 26, 0.3, C(0x3A2B2E).cg(alpha), at: CGPoint(x: p.x, y: rect.minY + 12), align: 0.5, in: ctx)
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

// MARK: - Dusk: the stars over the village

/// The notebook's own constellation, in Pinto's world: the sky goes from dusk to night behind it,
/// and in front a cut-paper village's windows come on as the notebook fills.
final class VillageScene: FilmScene {
    let script: FilmScript
    private let W = Double(FilmScript.width)
    private var growth: Double { script.growth }
    private let amber = FilmKit.glow(C(0xFFC85A)), haze = FilmKit.glow(C(0xFF9E6B))
    private struct Home { var x, y, s: Double; var roof: Int; var at: Double }
    private var homes: [Home] = []
    private let rows: [(Double, Double, Int)] = [(436, 1.0, 6), (376, 1.25, 5), (318, 1.5, 4)]

    var replacesNotebook: Bool { false }
    var lift: Double { 150 }
    var captions: [String]? { nil }
    var wordsDelay: Double { 0 }
    var rewinds: Bool { false }
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool { false }
    func topInk(_ t: Double) -> FilmRenderer.RGB { C(0xFFFFFF) }

    init(script: FilmScript) {
        self.script = script
        var rnd = FilmKit.Rand(21)
        for (ri, (_, _, n)) in rows.enumerated() {
            for k in 0..<n {
                let x = 70 + (Double(k) + 0.25 + rnd.next() * 0.5) / Double(n) * (W - 140)
                homes.append(Home(x: x, y: ridge(ri, x) - 4, s: rows[ri].1, roof: Int(rnd.next() * 3), at: rnd.next()))
            }
        }
        homes.sort { $0.y > $1.y }
    }

    private func ridge(_ row: Int, _ x: Double) -> Double {
        rows[row].0 + 26 * sin(x / (170 + Double(row) * 40) + Double(row) * 2.2) + 12 * sin(x / 61 + Double(row))
    }

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let H = canvas.height, base = canvas.bottom
            let p = min(1, t / growth)
            let night = smooth((p - 0.15) / 0.85)
            func col(_ a: UInt32, _ b: UInt32) -> C { C(a).mix(C(b), night) }
            let sky = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
                                 colors: [col(0xF2A27C, 0x8E4335).cg(), col(0xA2506A, 0x3E1826).cg(), col(0x4A2A52, 0x1B0F1A).cg(), col(0x2A1838, 0x120A12).cg()] as CFArray, locations: [0, 0.3, 0.7, 1])!
            ctx.drawLinearGradient(sky, start: CGPoint(x: 0, y: 380 + base), end: CGPoint(x: 0, y: H), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
            ctx.setBlendMode(.plusLighter)
            ctx.setAlpha(0.55 * (1 - night * 0.8))
            ctx.draw(haze, in: CGRect(x: W * 0.6 - 520, y: 380 + base - 420, width: 1040, height: 840))
            ctx.setAlpha(1)
            ctx.setBlendMode(.normal)
            // Faint far stars, more as it darkens.
            var rnd = FilmKit.Rand(5)
            for _ in 0..<70 {
                let x = rnd.next() * W, y = 620 + base + rnd.next() * (H - 620 - base), s = 0.8 + rnd.next() * 1.3, a = rnd.next()
                ctx.setFillColor(C(0xFFF1D6).cg((0.1 + 0.5 * night) * (0.2 + 0.6 * a)))
                ctx.fillEllipse(in: CGRect(x: x - s, y: y - s, width: s * 2, height: s * 2))
            }
    }

    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        ctx.saveGState()
        ctx.translateBy(x: 0, y: canvas.bottom)
        defer { ctx.restoreGState() }
            let p = min(1, t / growth)
            let night = smooth((p - 0.15) / 0.85)
            func col(_ a: UInt32, _ b: UInt32) -> C { C(a).mix(C(b), night) }
            func sheet(_ path: CGPath, _ c: C) {
                // Its shadow as soft lines along its edge, as in the town.
                ctx.saveGState()
                ctx.translateBy(x: 0, y: 2)
                ctx.setLineJoin(.round)
                for (w, a) in [(30.0, 0.04), (20, 0.05), (12, 0.06), (5, 0.08)] {
                    ctx.addPath(path)
                    ctx.setStrokeColor(CGColor(gray: 0, alpha: a))
                    ctx.setLineWidth(w)
                    ctx.strokePath()
                }
                ctx.restoreGState()
                ctx.addPath(path)
                ctx.setFillColor(c.cg())
                ctx.fillPath()
            }
            // Far hills.
            for (i, (y, c)) in [(520.0, col(0x7B5A86, 0x3B2540)), (486, col(0x674B78, 0x2F1F3A))].enumerated() {
                let path = CGMutablePath()
                path.move(to: CGPoint(x: -20, y: 0))
                var x = -20.0
                while x <= W + 20 { path.addLine(to: CGPoint(x: x, y: y + 40 * sin(x / (230 + Double(i) * 70) + Double(i) * 1.9) + 16 * sin(x / 93 + Double(i) * 4))); x += 12 }
                path.addLine(to: CGPoint(x: W + 20, y: 0))
                sheet(path, c)
            }
            // The village's three sheets, each with its houses.
            let greens = [col(0x3E5A58, 0x1D3833), col(0x33504A, 0x17322B), col(0x29453C, 0x112921)]
            for ri in 0..<3 {
                let path = CGMutablePath()
                path.move(to: CGPoint(x: -20, y: 0))
                var x = -20.0
                while x <= W + 20 { path.addLine(to: CGPoint(x: x, y: ridge(ri, x))); x += 8 }
                path.addLine(to: CGPoint(x: W + 20, y: 0))
                sheet(path, greens[ri])
                for h in homes where abs(h.s - rows[ri].1) < 0.01 {
                    let s = h.s, w = 40 * s, bh = (26 + 14 * h.at) * s, rh = 16 * s
                    let x0 = h.x - w / 2, y0 = h.y
                    ctx.setFillColor(col(0x8A6F72, 0x4E3C49).cg())
                    ctx.fill(CGRect(x: x0, y: y0, width: w, height: bh))
                    let roof = CGMutablePath()
                    roof.move(to: CGPoint(x: x0 - 4 * s, y: y0 + bh - 1))
                    roof.addLine(to: CGPoint(x: h.x, y: y0 + bh + rh))
                    roof.addLine(to: CGPoint(x: x0 + w + 4 * s, y: y0 + bh - 1))
                    ctx.addPath(roof)
                    ctx.setFillColor([col(0x5A3F58, 0x2B1E2E), col(0x643D44, 0x301F27), col(0x4D4263, 0x261F33)][h.roof].cg())
                    ctx.fillPath()
                    // Its windows come on as the notebook fills.
                    let lit = smooth((p - h.at * 0.85) / 0.08)
                    let glass = col(0x4B3B49, 0x1B131C).mix(C(0xFFCB6B), lit)
                    for wx in [x0 + w * 0.27, x0 + w * 0.73] {
                        ctx.setFillColor(glass.cg())
                        ctx.fill(CGRect(x: wx - 4.5 * s, y: y0 + 9 * s, width: 9 * s, height: 12 * s))
                    }
                    if lit > 0.05 {
                        ctx.setBlendMode(.plusLighter)
                        ctx.setAlpha(0.45 * lit * (0.4 + 0.6 * night))
                        ctx.draw(amber, in: CGRect(x: h.x - 34 * s, y: y0 + 15 * s - 34 * s, width: 68 * s, height: 68 * s))
                        ctx.setAlpha(1)
                        ctx.setBlendMode(.normal)
                    }
                }
                // Round trees along the sheet.
                var tr = FilmKit.Rand(UInt64(40 + ri))
                for _ in 0..<(4 + ri) {
                    let x = tr.next() * W, rr = (18 + tr.next() * 14) * rows[ri].1
                    let y = ridge(ri, x) - 6
                    ctx.setFillColor(col(0x24413A, 0x10241E).cg())
                    for (dx, dy, k) in [(0.0, 1.2, 1.0), (-0.55, 0.9, 0.72), (0.55, 0.95, 0.7)] {
                        ctx.fillEllipse(in: CGRect(x: x + dx * rr - rr * k, y: y + dy * rr - rr * k * 0.9, width: rr * k * 2, height: rr * k * 1.8))
                    }
                }
            }
            // The ground in front, for the words.
            let front = CGMutablePath()
            front.move(to: CGPoint(x: -10, y: 0))
            var x = -10.0
            var k = 0
            while x <= W + 60 {
                let rr = 38 + 26 * hash(k, 31)
                front.addArc(center: CGPoint(x: x, y: 268 + 18 * hash(k, 32)), radius: rr, startAngle: .pi, endAngle: 0, clockwise: true)
                x += rr * 1.25
                k += 1
            }
            front.addLine(to: CGPoint(x: W + 60, y: 0))
            sheet(front, col(0x18231F, 0x0B1211))
            ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: -canvas.bottom, width: 256, height: 256), byTiling: true)
    }
}
