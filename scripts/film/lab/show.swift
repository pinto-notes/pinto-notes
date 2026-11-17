import CoreGraphics
import Foundation

// Lab: three ways to make the month a spectacle, still in Pinto's world (cut paper, the footer's
// dusk, amber for you and blue for your AI). Each has a build and a finale. They plug into the
// app's own renderer as scenes.

private typealias SR = FilmRenderer.RGB
private func inOut(_ x: Double) -> Double { let c = min(1, max(0, x)); return c < 0.5 ? 4 * c * c * c : 1 - pow(-2 * c + 2, 3) / 2 }

class ShowScene: FilmScene {
    let script: FilmScript
    let names: Bool
    let W = 1080.0
    var growth: Double { script.growth }
    let aiFrom: [Double]
    let busy: Double
    fileprivate let amberGlow = FilmKit.glow(SR(0xFFC85A)), blueGlow = FilmKit.glow(SR(0x8FC2FF)), whiteGlow = FilmKit.glow(SR(0xFFF1D6))

    init(script: FilmScript, names: Bool) {
        self.script = script
        self.names = names
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        let counts = script.nodes.map(\.edits.count).sorted()
        busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
    }

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    var captions: [String]? { nil }
    var wordsDelay: Double { 0.2 }
    var rewinds: Bool { false }
    var appStart: Double { 0 }
    func subtitle(_ stats: FilmStats) -> String? { nil }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}
    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) { drawBehind(t, canvas: canvas, in: ctx) }
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool { false }
    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}

    /// Night comes through the last third of the month and is whole as it ends.
    func night(_ t: Double) -> Double { lsmooth((t - growth * 0.58) / (growth * 0.44)) }
    func topInk(_ t: Double) -> FilmRenderer.RGB { SR(0x3A2B2E).mix(SR(0xFFF4E6), lsmooth((night(t) - 0.38) / 0.1)) }

    /// A colour through the day: morning, dusk, the red of sunset, night.
    fileprivate func through(_ t: Double, _ day: UInt32, _ dusk: UInt32, _ ember: UInt32, _ dark: UInt32) -> SR {
        let d = lsmooth(min(t, growth) / (growth * 0.6)), n = night(t)
        let c = SR(day).mix(SR(dusk), d)
        return n < 0.5 ? c.mix(SR(ember), n * 2) : SR(ember).mix(SR(dark), (n - 0.5) * 2)
    }

    /// The footer's sky and its paper hills, with dark ground under them for the words.
    fileprivate func world(_ t: Double, canvas: FilmCanvas, horizon: Double, water: Bool = false, in ctx: CGContext) {
        let H = canvas.height, n = night(t)
        let top = through(t, 0xFFF7EA, 0xFCE6CC, 0x5B2A47, 0x170E20), mid = through(t, 0xFFEFD9, 0xF7BC97, 0xB54A4A, 0x3A1B36), low = through(t, 0xFFE4C6, 0xE88F8C, 0xF27D4F, 0x8A4250)
        let sky = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [low.cg(), mid.cg(), top.cg()] as CFArray, locations: [0, 0.4, 1])!
        ctx.drawLinearGradient(sky, start: CGPoint(x: 0, y: horizon), end: CGPoint(x: 0, y: H), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        // Stars, once it's dark.
        if n > 0.5 {
            for k in 0..<90 {
                let a = (n - 0.5) * 2 * (0.35 + 0.65 * lhash(k, 3)) * (0.7 + 0.3 * sin(t * 2.4 + Double(k)))
                ctx.setFillColor(SR(0xFFF1D6).cg(a * 0.8))
                let r = 1.1 + 1.4 * lhash(k, 4)
                ctx.fillEllipse(in: CGRect(x: lhash(k, 1) * W - r, y: horizon + 90 + lhash(k, 2) * (H - horizon - 90) - r, width: r * 2, height: r * 2))
            }
        }
        // Hills, three sheets of paper.
        let sheets: [(Double, Double, SR)] = [(118, 0.0042, through(t, 0xD9CBEA, 0xC2ABD6, 0x7A3F6A, 0x2C1E3E)), (78, 0.0061, through(t, 0xA9C59A, 0x8FB58A, 0x55584E, 0x183029)), (44, 0.0083, through(t, 0x6E9A6C, 0x4E7556, 0x33443A, 0x0F211C))]
        for (k, (rise, wave, colour)) in sheets.enumerated() {
            ctx.move(to: CGPoint(x: 0, y: horizon - 2))
            for x in stride(from: 0.0, through: W, by: 12) {
                let y = horizon + rise * (0.55 + 0.3 * sin(x * wave + Double(k) * 1.9) + 0.15 * sin(x * wave * 2.7 + Double(k) * 4.1))
                ctx.addLine(to: CGPoint(x: x, y: y))
            }
            ctx.addLine(to: CGPoint(x: W, y: horizon - 2))
            ctx.closePath()
            ctx.setFillColor(colour.cg())
            ctx.fillPath()
        }
        // The ground (or still water) the words sit on.
        ctx.setFillColor((water ? through(t, 0x3E5A66, 0x35495A, 0x2B2238, 0x0B0D16) : through(t, 0x26352E, 0x1F2B26, 0x1A1F1E, 0x0A1210)).cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: horizon))
    }
}

// MARK: - Flock: every page in the air, landing as Pinto's leaf

/// Every time a note is written in, a page takes to the air over the hills: cream on one side,
/// amber (yours) or blue (your AI's) on the other, turning as it flies. They gather into one
/// great swirling flock as the month goes by. When night falls they come down together and lie
/// side by side as a single leaf: Pinto's, made of everything that was written.
final class FlockScene: ShowScene {
    private var events: [(at: Double, ai: Bool)] = []
    private var targets: [CGPoint] = []
    private var along: [Double] = []
    private var cell = 20.0
    private var placedFor: FilmCanvas?
    private var horizon = 0.0
    private var middle = CGPoint.zero
    private var lean = 1.0
    override var captions: [String]? { ["A page for every time I wrote"] }

    override init(script: FilmScript, names: Bool) {
        super.init(script: script, names: names)
        for n in script.nodes {
            if n.edits.isEmpty { events.append((n.birth, n.bornByAI)) }
            for (k, e) in n.edits.enumerated() { events.append((e, n.aiEdits[k])) }
        }
        events.sort { $0.at < $1.at }
    }

    /// Where each page lies in the leaf: rows of them along its length, either side of the midrib.
    private func place(_ canvas: FilmCanvas) {
        guard canvas != placedFor else { return }
        placedFor = canvas
        horizon = canvas.bottom + 318
        let top = canvas.height - canvas.top - 150
        middle = CGPoint(x: W / 2, y: (horizon + 110 + top) / 2)
        let length = min(820, (top - horizon - 110) * 1.02)
        lean = 1.02
        func inside(_ c: Double) -> [(a: Double, b: Double)] {
            var out: [(Double, Double)] = []
            var a = -length / 2 + c / 2
            while a < length / 2 {
                let u = (a + length / 2) / length
                // (Widest a third of the way up, then a long point, like the leaf in the mark.)
                let hw = 0.33 * length * pow(max(0, sin(.pi * pow(u, 0.6))), 1.2)
                var b = c * 0.62
                while b + c * 0.3 <= hw {
                    // Veins: slanting gaps, cut from the midrib up and out.
                    let vein = (a - b * 0.75) / (c * 5.2)
                    if vein - vein.rounded(.down) > 0.17 { out.append((a, b)); out.append((a, -b)) }
                    b += c
                }
                a += c
            }
            return out
        }
        var c = 60.0
        while inside(c).count < events.count, c > 6 { c *= 0.97 }
        cell = c
        let spots = inside(c).sorted { $0.a < $1.a }.prefix(max(1, events.count))
        targets = spots.map { CGPoint(x: middle.x + $0.a * cos(lean) - $0.b * sin(lean), y: middle.y + $0.a * sin(lean) + $0.b * cos(lean)) }
        along = spots.map { ($0.a + length / 2) / length }
    }

    override func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        place(canvas)
        world(t, canvas: canvas, horizon: horizon, in: ctx)
        let gt = min(t, growth), n = night(t)
        let aloft = events.firstIndex { $0.at > gt } ?? events.count
        guard aloft > 0, !targets.isEmpty else { return }
        let fullness = Double(aloft) / Double(max(1, events.count))
        let reach = 150 + 190 * fullness.squareRoot()
        let centre = CGPoint(x: middle.x + 60 * sin(0.5 * t), y: middle.y + 34 * sin(0.37 * t + 1))
        let skyTone = through(t, 0xFFEFD9, 0xF7BC97, 0xB54A4A, 0x3A1B36)
        struct Page { var p: CGPoint; var w, h, turn, depth: Double; var colour: SR; var glow: Double; var ai: Bool }
        var pages: [Page] = []
        pages.reserveCapacity(aloft)
        for j in 0..<aloft {
            let e = events[j]
            // Round and round, the whole flock breathing in and out.
            let angle = lhash(j, 1) * 6.283 + (0.55 + 0.75 * lhash(j, 2)) * t
            let ring = reach * (0.22 + 0.78 * lhash(j, 3).squareRoot()) * (1 + 0.2 * sin(1.3 * t + 3 * angle))
            let x = ring * cos(angle), z = ring * sin(angle), y = 70 * sin(2 * angle + 0.9 * t + lhash(j, 4) * 6) * ring / reach
            let far = z * 0.86 + y * 0.2
            let scale = 900 / (900 + far)
            var p = CGPoint(x: centre.x + x * scale * 1.12, y: centre.y + (y * 0.9 - z * 0.42) * scale)
            // It comes in from the side as it's written.
            let since = gt - e.at
            if since < 0.8 {
                let side: Double = lhash(j, 5) < 0.5 ? -80 : W + 80
                let k = inOut(since / 0.8)
                p = CGPoint(x: side + (p.x - side) * k, y: horizon + 160 + lhash(j, 6) * 500 + (p.y - horizon - 160 - lhash(j, 6) * 500) * k)
            }
            // At the end each goes to its place in the leaf, the stalk's end first.
            let slot = min(j, targets.count - 1)
            let home = inOut((t - growth + 0.15 - 0.7 * along[slot]) / 1.15)
            p = CGPoint(x: p.x + (targets[slot].x - p.x) * home, y: p.y + (targets[slot].y - p.y) * home)
            let flip = cos((3.5 + 4 * lhash(j, 7)) * t + lhash(j, 8) * 6)
            let shown = flip + (1 - flip) * home
            let size = (20 + 6 * lhash(j, 9)) * scale
            let w = (size * 0.8 + (cell * 0.84 - size * 0.8) * home) * max(0.12, abs(shown))
            let h = size + (cell * 0.84 - size) * home
            let turn = (angle + 1.2 + 0.6 * sin(t * 2 + Double(j))) * (1 - home) + lean * home
            let face = shown > 0 || home > 0.5
            let paper = through(t, 0xFFFDF8, 0xFFF3E2, 0xF4C9B4, 0xB9A7B4)
            let own = e.ai ? SR(0x4F8FE8).mix(SR(0x9CD2FF), n) : SR(0xF09A1E).mix(SR(0xFFCB6B), n)
            let colour = (face ? own : paper).mix(skyTone, max(0, min(0.45, far / 700)) * (1 - home))
            pages.append(Page(p: p, w: w, h: h, turn: turn, depth: far * (1 - home), colour: colour, glow: n * (0.25 + 0.75 * home), ai: e.ai))
        }
        pages.sort { $0.depth > $1.depth }
        // Its stalk, once they're down.
        let landed = lsmooth((t - growth - 1.1) / 0.6)
        if landed > 0, let foot = targets.first {
            ctx.move(to: CGPoint(x: foot.x - cos(lean) * cell * 0.4, y: foot.y - sin(lean) * cell * 0.4))
            ctx.addLine(to: CGPoint(x: foot.x - cos(lean) * (cell * 0.4 + 96 * landed), y: foot.y - sin(lean) * (cell * 0.4 + 96 * landed)))
            ctx.setStrokeColor(SR(0xFFCB6B).cg(0.9))
            ctx.setLineWidth(cell * 0.34)
            ctx.setLineCap(.round)
            ctx.strokePath()
        }
        // Their light, once it's dark.
        if n > 0.05 {
            ctx.setBlendMode(.plusLighter)
            let shimmer = t > growth ? 0.75 + 0.25 * sin((t - growth) * 3) : 1
            for page in pages {
                let r = max(page.w, page.h) * 1.9
                ctx.setAlpha(0.3 * page.glow * shimmer)
                ctx.draw(page.ai ? blueGlow : amberGlow, in: CGRect(x: page.p.x - r, y: page.p.y - r, width: r * 2, height: r * 2))
            }
            ctx.setAlpha(1)
            ctx.setBlendMode(.normal)
        }
        for page in pages {
            let c = cos(page.turn), s = sin(page.turn)
            let ax = CGPoint(x: c * page.w / 2, y: s * page.w / 2), ay = CGPoint(x: -s * page.h / 2, y: c * page.h / 2)
            ctx.move(to: CGPoint(x: page.p.x - ax.x - ay.x, y: page.p.y - ax.y - ay.y))
            ctx.addLine(to: CGPoint(x: page.p.x + ax.x - ay.x, y: page.p.y + ax.y - ay.y))
            ctx.addLine(to: CGPoint(x: page.p.x + ax.x + ay.x, y: page.p.y + ax.y + ay.y))
            ctx.addLine(to: CGPoint(x: page.p.x - ax.x + ay.x, y: page.p.y - ax.y + ay.y))
            ctx.closePath()
            ctx.setFillColor(page.colour.cg())
            ctx.fillPath()
        }
    }
}

// MARK: - Lanterns: every note a light let go over the water

/// Every note is a paper lantern let go from behind the hills, rising to join its folder's in
/// the sky: amber for yours, blue where your AI helped, brighter each time it's written in. The
/// evening comes on as the month goes by, the water below holds their light, and by the end the
/// sky is full.
final class LanternScene: ShowScene {
    private var home: [CGPoint] = []
    private var centres: [(folder: Int, c: CGPoint, r: Double, birth: Double)] = []
    override var captions: [String]? { ["Each lantern is a note", "It burns brighter each time it\u{2019}s written in"] }

    override init(script: FilmScript, names: Bool) {
        super.init(script: script, names: names)
        var by = [[Int]](repeating: [], count: script.folders.count)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        let order = by.indices.filter { !by[$0].isEmpty }.sorted { (by[$0].count, -$0) > (by[$1].count, -$1) }
        var cs: [(f: Int, c: CGPoint, r: Double)] = order.enumerated().map { j, f in
            let r = 118 * Double(j).squareRoot(), a = Double(j) * 2.399963 + 0.5
            return (f, CGPoint(x: r * cos(a) * 1.2, y: r * sin(a) * 0.8), 15 * Double(by[f].count).squareRoot() + 20)
        }
        for _ in 0..<120 {
            for a in cs.indices { for b in cs.indices where b > a {
                let d = CGPoint(x: cs[a].c.x - cs[b].c.x, y: (cs[a].c.y - cs[b].c.y) * 1.3)
                let len = max(0.5, hypot(d.x, d.y)), want = cs[a].r + cs[b].r + 34
                guard len < want else { continue }
                let push = (want - len) / 2 / len
                if a != 0 { cs[a].c.x += d.x * push; cs[a].c.y += d.y * push / 1.3 }
                cs[b].c.x -= d.x * push * (a == 0 ? 2 : 1); cs[b].c.y -= d.y * push / 1.3 * (a == 0 ? 2 : 1)
            } }
            for a in cs.indices.dropFirst() { cs[a].c.x *= 0.99; cs[a].c.y *= 0.99 }
        }
        home = Array(repeating: .zero, count: script.nodes.count)
        for c in cs {
            centres.append((c.f, c.c, c.r, script.nodes[by[c.f][0]].birth))
            for (k, i) in by[c.f].enumerated() {
                let r = 15 * (Double(k) + 0.4).squareRoot(), a = Double(k) * 2.399963 + lhash(c.f, 8) * 6
                home[i] = CGPoint(x: c.c.x + r * cos(a), y: c.c.y + r * sin(a))
            }
        }
    }

    override func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let horizon = canvas.bottom + 396
        world(t, canvas: canvas, horizon: horizon, water: true, in: ctx)
        let gt = min(t, growth), n = night(t)
        let top = canvas.height - canvas.top - 170
        // Everything that's up fits the sky; it draws back as more go up.
        var lo = CGPoint(x: Double.infinity, y: Double.infinity), hi = CGPoint(x: -Double.infinity, y: -Double.infinity)
        for c in centres {
            let a = lsmooth((gt + 0.9 - c.birth) / 1.2)
            guard a > 0 else { continue }
            lo.x = min(lo.x, c.c.x - c.r * a); hi.x = max(hi.x, c.c.x + c.r * a)
            lo.y = min(lo.y, c.c.y - c.r * a); hi.y = max(hi.y, c.c.y + c.r * a)
        }
        guard lo.x.isFinite else { return }
        let room = CGSize(width: W - 150, height: top - horizon - 150)
        let scale = min(2.3, room.width / max(120, hi.x - lo.x), room.height / max(120, hi.y - lo.y))
        let mid = CGPoint(x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2)
        let centre = CGPoint(x: W / 2, y: horizon + 150 + room.height / 2)
        func sky(_ p: CGPoint) -> CGPoint { CGPoint(x: centre.x + (p.x - mid.x) * scale, y: centre.y + (p.y - mid.y) * scale) }
        let flare = t > growth ? 1 + 0.5 * exp(-pow((t - growth - 0.45) / 0.3, 2)) : 1

        struct Lantern { var p: CGPoint; var s: Double; var lit: Double; var ai: Double; var pulse: Double }
        var up: [Lantern] = []
        for (i, node) in script.nodes.enumerated() where node.birth <= gt {
            let goal = sky(home[i])
            let rise = 1 - pow(1 - min(1, (gt - node.birth) / 1.7), 3)
            let from = CGPoint(x: goal.x + (lhash(i, 31) - 0.5) * 180, y: horizon + 30)
            let sway = 12 * sin(1.3 * t + lhash(i, 32) * 6) * (1 - 0.7 * rise)
            let p = CGPoint(x: from.x + (goal.x - from.x) * rise + sway, y: from.y + (goal.y - from.y) * pow(rise, 0.8) + 3 * sin(0.9 * t + Double(i)))
            var done = 0.0, last = node.birth
            for e in node.edits where e <= gt { done += 1; last = e }
            let w = min(1, (done / busy).squareRoot())
            let pulse = exp(-(gt - last) / 0.4) * (t <= growth ? 1 : 0)
            up.append(Lantern(p: p, s: (0.72 + 0.55 * w) * min(1.5, scale.squareRoot()), lit: 0.5 + 0.5 * w, ai: lsmooth((gt - aiFrom[i]) / 0.35), pulse: pulse))
        }
        // Their light on the water, under the far shore.
        ctx.setBlendMode(.plusLighter)
        for l in up {
            let depth = l.p.y - horizon
            let y = horizon - 14 - depth * 0.17
            guard y > canvas.bottom + 268 else { continue }
            let a = (0.05 + 0.6 * n) * l.lit * flare * lsmooth((y - canvas.bottom - 268) / 50)
            let x = l.p.x + 3 * sin(t * 2.6 + y * 0.09)
            ctx.setAlpha(a * (1 - l.ai))
            ctx.draw(amberGlow, in: CGRect(x: x - 11 * l.s, y: y - 26 * l.s, width: 22 * l.s, height: 52 * l.s))
            ctx.setAlpha(a * l.ai)
            ctx.draw(blueGlow, in: CGRect(x: x - 11 * l.s, y: y - 26 * l.s, width: 22 * l.s, height: 52 * l.s))
        }
        // Their light in the air.
        for l in up {
            let r = (26 + 24 * l.lit + 44 * l.pulse) * l.s
            let a = min(1, (0.04 + 0.74 * n) * l.lit * flare + (0.12 + 0.4 * n) * l.pulse)
            ctx.setAlpha(a * (1 - l.ai))
            ctx.draw(amberGlow, in: CGRect(x: l.p.x - r, y: l.p.y - r, width: r * 2, height: r * 2))
            ctx.setAlpha(a * l.ai)
            ctx.draw(blueGlow, in: CGRect(x: l.p.x - r, y: l.p.y - r, width: r * 2, height: r * 2))
        }
        ctx.setAlpha(1)
        ctx.setBlendMode(.normal)
        // The lanterns themselves: paper, a little wider at the top, a dark ring at the mouth.
        for l in up {
            let w = 13 * l.s, h = 17 * l.s
            let paper = SR(0xFFE2B0).mix(SR(0xCFE2FA), l.ai).mix(SR(0xFFCB6B).mix(SR(0xA9D6FF), l.ai), 0.35 + 0.65 * n).mix(SR(0xFFFFFF), 0.4 * l.pulse)
            ctx.move(to: CGPoint(x: l.p.x - w * 0.36, y: l.p.y - h / 2))
            ctx.addLine(to: CGPoint(x: l.p.x + w * 0.36, y: l.p.y - h / 2))
            ctx.addQuadCurve(to: CGPoint(x: l.p.x + w * 0.3, y: l.p.y + h / 2), control: CGPoint(x: l.p.x + w * 0.72, y: l.p.y + h * 0.12))
            ctx.addQuadCurve(to: CGPoint(x: l.p.x - w * 0.3, y: l.p.y + h / 2), control: CGPoint(x: l.p.x, y: l.p.y + h * 0.66))
            ctx.addQuadCurve(to: CGPoint(x: l.p.x - w * 0.36, y: l.p.y - h / 2), control: CGPoint(x: l.p.x - w * 0.72, y: l.p.y + h * 0.12))
            ctx.closePath()
            ctx.setFillColor(paper.cg())
            ctx.fillPath()
            ctx.setFillColor(SR(0x3A2B2E).cg(0.55))
            ctx.fill(CGRect(x: l.p.x - w * 0.36, y: l.p.y - h / 2 - 1.5 * l.s, width: w * 0.72, height: 2.4 * l.s))
        }
        // Each folder's name over its lanterns.
        guard names else { return }
        for c in centres where c.birth + 1.2 <= gt {
            let name = script.folders[c.folder]
            guard !name.isEmpty else { continue }
            let p = sky(CGPoint(x: c.c.x, y: c.c.y + c.r))
            let w = FilmKit.width(name, 32, 0.23)
            FilmKit.text(name, 32, 0.23, topInk(t).cg(0.9 * lsmooth((gt - c.birth - 1.2) / 0.5)), at: CGPoint(x: min(W - 36 - w, max(36, p.x - w / 2)), y: p.y + 16), in: ctx)
        }
    }
}

// MARK: - Bloom: the month opens like a flower

/// The month as one paper flower. Each note is a petal that starts at the heart and is carried
/// outward as newer ones come, the way a sunflower grows: amber for yours, blue where your AI
/// helped, longer the more it was written in. It keeps turning, and it fills the page.
final class BloomScene: ShowScene {
    override var captions: [String]? { ["Each petal is a note", "It grows each time it\u{2019}s written in"] }
    override var wordsDelay: Double { 0 }
    override func topInk(_ t: Double) -> FilmRenderer.RGB { SR(0x2A1D10) }

    override func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let H = canvas.height
        ctx.setFillColor(SR(0xFFF4E6).cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        let gt = min(t, growth)
        let bottom = canvas.bottom + 340, top = H - canvas.top - 130
        let mid = CGPoint(x: W / 2, y: (bottom + top) / 2)
        let fit = min((W - 110) / 2, (top - bottom) / 2)
        // How many petals there are, counted smoothly so the flower never jumps.
        var count = 0.0
        for n in script.nodes where n.birth <= gt { count += lsmooth((gt - n.birth) / 0.55) }
        guard count > 0.01 else { return }
        let gap = 27.0
        let spread = gap * count.squareRoot()
        let zoom = min(4.2, fit / (spread * 1.3 + 46))
        let turn = -0.07 * t
        let ripple = (t - growth - 0.1) * 640

        // A warm light behind it, and Pinto's leaves under the flower.
        ctx.setAlpha(0.5)
        ctx.draw(amberGlow, in: CGRect(x: mid.x - fit * 1.5, y: mid.y - fit * 1.5, width: fit * 3, height: fit * 3))
        ctx.setAlpha(1)
        let reachOut = (spread * 1.3 + 46) * zoom
        for k in 0..<5 {
            let a = turn * 0.6 + Double(k) * 1.2566 + 0.4
            let len = reachOut * (0.98 + 0.07 * lhash(k, 71)) * lsmooth(count / 5 - Double(k) * 0.3)
            guard len > 4 else { continue }
            petal(from: mid, angle: a, inner: 0, length: len, width: len * 0.3, colours: (SR(0xB3CDA2), SR(0xC5DAB4)), in: ctx)
        }

        // The petals, the oldest (outermost) first.
        for (k, n) in script.nodes.enumerated() where n.birth <= gt {
            let age = max(0, count - Double(k) - 0.5)
            let r = gap * age.squareRoot()
            let a = Double(k) * 2.399963 + turn
            var done = 0.0, last = n.birth
            for e in n.edits where e <= gt { done += 1; last = e }
            let w = min(1, (done / busy).squareRoot())
            let pulse = t <= growth ? exp(-(gt - last) / 0.3) : 0
            let wave = t > growth ? 0.16 * exp(-pow((r * zoom - ripple) / 70, 2)) : 0
            let born = lbackOut((gt - n.birth) / 0.5)
            let length = (30 + 0.36 * r) * (0.82 + 0.5 * w) * (1 + 0.22 * pulse + wave) * born
            let helped = lsmooth((gt - aiFrom[k]) / 0.35)
            let dark = SR(0xE8850F).mix(SR(0x2F6FCB), helped), light = SR(0xF6AC3C).mix(SR(0x5B93E0), helped)
            // (A bud is pale, and takes its colour as it opens.)
            let bud = 1 - lsmooth((gt - n.birth) / 0.7)
            petal(from: mid, angle: a, inner: (r - length * 0.18) * zoom, length: length * zoom, width: length * 0.5 * zoom,
                  colours: (dark.mix(SR(0xFFF1D6), bud * 0.7).mix(SR(0xFFFFFF), 0.25 * pulse), light.mix(SR(0xFFF8EA), bud * 0.7).mix(SR(0xFFFFFF), 0.25 * pulse)), in: ctx)
        }
        // Its heart.
        let heart = gap * 0.72 * zoom
        ctx.setFillColor(SR(0x2A1D10).cg(0.2))
        ctx.fillEllipse(in: CGRect(x: mid.x - heart, y: mid.y - heart - 3, width: heart * 2, height: heart * 2))
        ctx.setFillColor(SR(0x7A4A1E).cg())
        ctx.fillEllipse(in: CGRect(x: mid.x - heart, y: mid.y - heart, width: heart * 2, height: heart * 2))
        for k in 0..<14 {
            let r = heart * 0.2 * Double(k).squareRoot(), a = Double(k) * 2.399963 + turn
            ctx.setFillColor(SR(0xF6AC3C).cg(0.9))
            ctx.fillEllipse(in: CGRect(x: mid.x + r * cos(a) - heart * 0.07, y: mid.y + r * sin(a) - heart * 0.07, width: heart * 0.14, height: heart * 0.14))
        }
    }

    /// A paper petal pointing out from the middle: its shade on what's under it, then two halves, folded.
    private func petal(from mid: CGPoint, angle: Double, inner: Double, length: Double, width: Double, colours: (SR, SR), in ctx: CGContext) {
        let d = CGPoint(x: cos(angle), y: sin(angle)), n = CGPoint(x: -sin(angle), y: cos(angle))
        let base = CGPoint(x: mid.x + d.x * inner, y: mid.y + d.y * inner)
        let tip = CGPoint(x: base.x + d.x * length, y: base.y + d.y * length)
        func side(_ s: Double) -> CGPoint { CGPoint(x: base.x + d.x * length * 0.42 + n.x * width * 0.62 * s, y: base.y + d.y * length * 0.42 + n.y * width * 0.62 * s) }
        func half(_ s: Double, _ dy: Double) {
            ctx.move(to: CGPoint(x: base.x, y: base.y + dy))
            ctx.addQuadCurve(to: CGPoint(x: tip.x, y: tip.y + dy), control: CGPoint(x: side(s).x, y: side(s).y + dy))
            ctx.closePath()
        }
        half(1, -3); half(-1, -3)
        ctx.setFillColor(SR(0x2A1D10).cg(0.16))
        ctx.fillPath()
        half(1, 0)
        ctx.setFillColor(colours.0.cg())
        ctx.fillPath()
        half(-1, 0)
        ctx.setFillColor(colours.1.cg())
        ctx.fillPath()
    }
}
