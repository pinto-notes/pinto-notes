import CoreGraphics
import CoreText
import Foundation
import simd

private typealias C = FilmRenderer.RGB
private typealias P3 = SIMD3<Double>

private func smooth(_ x: Double) -> Double { let c = min(1, max(0, x)); return c * c * (3 - 2 * c) }
private func backOut(_ x: Double) -> Double { let c = min(1, max(0, x)) - 1; return 1 + c * c * (2.7 * c + 1.7) }
private func hash(_ a: Int, _ b: Int = 0) -> Double {
    var r = FilmKit.Rand(UInt64(truncatingIfNeeded: a &* 7919 &+ b &* 104_729 &+ 13))
    _ = r.next(); _ = r.next()
    return r.next()
}

/// The constellation as a hologram: the same lights (a note each, amber for yours, blue where an
/// AI helped), in depth. Each folder is a small system of its own, turning on a ring; the whole
/// thing stands over a projector's floor and the camera goes slowly round it. Every frame is
/// drawn from the film time alone.
final class HoloScene: FilmScene {
    let script: FilmScript
    let folderNames: Bool
    private let look: FilmLook
    private let W = Double(FilmScript.width)
    private var growth: Double { script.growth }

    private struct Cluster {
        var folder: Int
        var c: P3
        /// Its plane (u, v) and the way it faces (n).
        var u, v, n: P3
        var notes: [Int]
        var radius: Double
        var turn: Double
        var birth: Double
    }
    private var clusters: [Cluster] = []
    /// Per note: its cluster, the note it hangs from (an arm of its system), and where it sits in its plane.
    private var clusterOf: [Int]
    private var parent: [Int]
    private var place: [(rad: Double, ang: Double, lift: Double)]
    private let worked: [Double]
    private let busyEdits: Double
    private let aiFrom: [Double]
    private let youGlow: CGImage, aiGlow: CGImage, whiteGlow: CGImage
    private var floorY = -260.0
    /// The camera, a tenth of a second apart: what it looks at and how much it takes in.
    private var shots: [(f: P3, rad: Double)] = []
    private static let shotStep = 0.1
    /// The systems the film stops on, and when: the day written most, the folder written in most.
    private var locks: [(cluster: Int, from: Double, until: Double)] = []
    /// Its lines and its ground: cool on black, or Pinto's own (cream lines on leaf brown).
    private var wire: C { look == .holoLeaf ? C(0xF3DDBF) : C(0xBCD3F5) }
    private var ground: C { look.background.0 }
    /// How far apart a system's notes sit.
    private static let spread = 19.0

    var replacesNotebook: Bool { true }
    var lift: Double { 0 }
    var captions: [String]? { nil }
    var wordsDelay: Double { 0 }
    var rewinds: Bool { false }
    var appStart: Double { 0 }
    func subtitle(_ stats: FilmStats) -> String? { nil }
    func drawInFront(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {}
    func drawRewinding(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) { drawBehind(t, canvas: canvas, in: ctx) }
    func topInk(_ t: Double) -> FilmRenderer.RGB { look.ink }
    func drawKey(ai: Bool, at p: CGPoint, alpha: Double, t: Double, in ctx: CGContext) -> Bool { false }

    init(script: FilmScript, folderNames: Bool, look: FilmLook) {
        self.script = script
        self.folderNames = folderNames
        self.look = look
        let counts = script.nodes.map(\.edits.count).sorted()
        busyEdits = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        worked = script.nodes.map { [busyEdits] in min(1, (Double($0.edits.count) / busyEdits).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        youGlow = FilmKit.glow(look.you)
        aiGlow = FilmKit.glow(look.ai)
        whiteGlow = FilmKit.glow(C(0xFFFFFF))
        clusterOf = Array(repeating: 0, count: script.nodes.count)
        parent = Array(repeating: -1, count: script.nodes.count)
        place = Array(repeating: (0, 0, 0), count: script.nodes.count)
        layout()
        plan()
    }

    // MARK: Layout

    private func layout() {
        var by = [[Int]](repeating: [], count: script.folders.count)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        // The largest in the middle, the others round it at their own heights.
        let order = by.indices.filter { !by[$0].isEmpty }.sorted { (by[$0].count, -$0) > (by[$1].count, -$1) }
        for (j, f) in order.enumerated() {
            let notes = by[f]
            let r = 150 * Double(j).squareRoot(), a = Double(j) * 2.399963 + 0.4
            let c = P3(r * cos(a), j == 0 ? 0 : (hash(f, 3) - 0.5) * 150, r * sin(a))
            // Each on a plane of its own, tilted a little: seen from the side as it goes round.
            let n = simd_normalize(P3((hash(f, 5) - 0.5) * 1.1, 1, (hash(f, 6) - 0.5) * 1.1))
            let u = simd_normalize(simd_cross(n, P3(0.31, 0, 0.95)))
            let v = simd_cross(n, u)
            let radius = Self.spread * Double(notes.count).squareRoot() + 18
            clusters.append(Cluster(folder: f, c: c, u: u, v: v, n: n, notes: notes, radius: radius,
                                    turn: (j % 2 == 0 ? 1 : -1) * (0.05 + 0.07 * hash(f, 7)), birth: script.nodes[notes[0]].birth))
            for (k, i) in notes.enumerated() {
                clusterOf[i] = clusters.count - 1
                // A sunflower's arrangement: the first note in the middle, later ones further out,
                // each hanging from the one five before it, which makes the arms.
                place[i] = (k == 0 ? 0 : Self.spread * (Double(k) + 0.35).squareRoot(), Double(k) * 2.399963 + hash(f, 8) * 6, (hash(i, 9) - 0.5) * 12)
                parent[i] = k == 0 ? -1 : notes[max(0, k - 5)]
            }
        }
        // Keep them apart by their sizes, and together.
        for _ in 0..<120 {
            for a in clusters.indices {
                for b in clusters.indices where b > a {
                    var d = clusters[a].c - clusters[b].c
                    // (Mostly side by side: height alone doesn't keep two apart.)
                    d.y *= 0.45
                    var len = simd_length(d)
                    if len < 0.01 { d = P3(1, 0, 0); len = 1 }
                    let want = clusters[a].radius + clusters[b].radius + 52
                    guard len < want else { continue }
                    var push = d / len * ((want - len) / 2)
                    push.y *= 0.45
                    if a != 0 { clusters[a].c += push } else { clusters[b].c -= push }
                    clusters[b].c -= push
                }
            }
            for a in clusters.indices.dropFirst() {
                clusters[a].c.x *= 0.992; clusters[a].c.z *= 0.992
                clusters[a].c.y = min(85, max(-85, clusters[a].c.y))
            }
        }
        floorY = (clusters.map { $0.c.y - $0.radius * 0.4 }.min() ?? 0) - 78
    }

    /// Where a note is at a film time (its system turns).
    private func position(_ i: Int, _ t: Double) -> P3 {
        let cl = clusters[clusterOf[i]], p = place[i]
        let a = p.ang + cl.turn * t
        return cl.c + cl.u * (p.rad * cos(a)) + cl.v * (p.rad * sin(a)) + cl.n * p.lift
    }

    // MARK: Camera

    private func plan() {
        if let day = script.stats.busiestDay, let span = script.span(ofDay: day), span.start >= 0.55 {
            var edits = [Int](repeating: 0, count: clusters.count)
            for (i, n) in script.nodes.enumerated() { edits[clusterOf[i]] += n.edits.filter { $0 >= span.start && $0 < span.start + span.length }.count }
            if let h = edits.indices.max(by: { edits[$0] < edits[$1] }), edits[h] > 0 {
                locks.append((h, span.start - 0.1, span.start + min(2.4, max(1.2, span.length))))
            }
        }
        if folderNames, growth > 5, clusters.count >= 3, let m = script.topFolderMoment,
           let top = script.stats.topFolder, let h = clusters.firstIndex(where: { script.folders[$0.folder] == top }) {
            locks.append((h, m.from + 0.05, m.until - 0.1))
        }
        let n = Int(((growth + FilmScript.outro + 1) / Self.shotStep).rounded(.up)) + 1
        var raw: [(f: P3, rad: Double)] = []
        for k in 0..<n {
            let at = Double(k) * Self.shotStep
            // A little ahead of the film, so it has drawn back by the time a note arrives.
            let tau = at + 0.6
            var f = P3(0, 0, 0), sum = 0.0
            for cl in clusters {
                let alive = Double(cl.notes.filter { script.nodes[$0].birth <= tau }.count)
                f += cl.c * alive; sum += alive
            }
            f = sum > 0 ? f / sum : clusters.first?.c ?? f
            var rad = 0.0
            for i in script.nodes.indices where script.nodes[i].birth <= tau || i == 0 {
                rad = max(rad, simd_length(clusters[clusterOf[i]].c - f) + place[i].rad + 34)
            }
            var s = (f: f, rad: max(70, rad))
            for l in locks where at >= l.from && at <= l.until {
                let cl = clusters[l.cluster]
                let alive = Double(cl.notes.filter { script.nodes[$0].birth <= tau }.count)
                let close = max(130, (Self.spread * alive.squareRoot() + 18) * 1.75 + 40)
                if close < s.rad * 0.85 { s = (cl.c, close) }
            }
            raw.append(s)
        }
        shots = raw.indices.map { k in
            var f = P3(0, 0, 0), rad = 0.0, sum = 0.0
            for d in -12...12 {
                let j = min(raw.count - 1, max(0, k + d)), w = exp(-Double(d * d) / 40)
                f += raw[j].f * w; rad += raw[j].rad * w; sum += w
            }
            return (f / sum, rad / sum)
        }
    }

    private func shot(_ t: Double) -> (f: P3, rad: Double) {
        guard !shots.isEmpty else { return (P3(0, 0, 0), 300) }
        let x = min(Double(shots.count - 1), max(0, t / Self.shotStep))
        let k = Int(x), k1 = min(shots.count - 1, k + 1), u = x - Double(k)
        return (shots[k].f + (shots[k1].f - shots[k].f) * u, shots[k].rad + (shots[k1].rad - shots[k].rad) * u)
    }

    private struct Camera {
        var f: P3
        var cosY, sinY, cosP, sinP: Double
        var zoom: Double
        var cx, cy: Double
        static let distance = 1150.0
        /// Screen point, scale there, and depth (behind the middle is positive).
        func project(_ p: P3) -> (p: CGPoint, s: Double, z: Double) {
            let d = p - f
            let x = d.x * cosY + d.z * sinY, z0 = -d.x * sinY + d.z * cosY
            let y = d.y * cosP - z0 * sinP, z = d.y * sinP + z0 * cosP
            let s = zoom * Self.distance / max(200, Self.distance + z)
            return (CGPoint(x: cx + x * s, y: cy + y * s), s, z)
        }
    }

    private func camera(_ t: Double, canvas: FilmCanvas) -> Camera {
        let s = shot(t)
        let bottom = canvas.bottom + 340, top = canvas.height - canvas.top - 130
        let fit = min((W - 150) / 2, (top - bottom) / 2 * 1.08)
        let yaw = -0.5 + 0.16 * t, pitch = 0.6 + 0.05 * sin(0.3 * t)
        return Camera(f: s.f, cosY: cos(yaw), sinY: sin(yaw), cosP: cos(pitch), sinP: sin(pitch),
                      zoom: min(2.3, fit / s.rad), cx: W / 2, cy: (bottom + top) / 2 + 6)
    }

    /// How close it is on the busiest day's system (for tests and tuning).
    func zoom(at t: Double, canvas: FilmCanvas = .shared) -> Double { camera(t, canvas: canvas).zoom }
    var systemCount: Int { clusters.count }
    func lights(at t: Double, canvas: FilmCanvas = .shared) -> [CGPoint] {
        let cam = camera(t, canvas: canvas)
        return script.nodes.indices.filter { script.nodes[$0].birth <= t }.map { cam.project(position($0, t)).p }
    }

    // MARK: Drawing

    func drawBehind(_ t: Double, canvas: FilmCanvas, in ctx: CGContext) {
        let H = canvas.height
        let gt = min(t, growth)
        let ending = smooth((t - growth) / 1.0)
        let cam = camera(t, canvas: canvas)
        let s0 = shot(t)
        let lineC = wire

        ctx.setFillColor(ground.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        // The projector's light, faintly, where the thing stands.
        ctx.saveGState()
        ctx.setBlendMode(.plusLighter)
        ctx.setAlpha(0.10 + 0.05 * ending)
        ctx.draw(look == .holoLeaf ? youGlow : aiGlow, in: CGRect(x: cam.cx - 620, y: cam.cy - 560, width: 1240, height: 1120))
        ctx.restoreGState()

        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        func line(_ a: CGPoint, _ b: CGPoint) { ctx.move(to: a); ctx.addLine(to: b) }
        /// A circle lying in a plane, as the camera sees it.
        func circle(_ c: P3, _ u: P3, _ v: P3, _ r: Double, from a0: Double = 0, sweep: Double = 2 * .pi, steps: Int = 56) -> (path: CGPath, top: Double) {
            let path = CGMutablePath()
            var top = -Double.infinity
            for k in 0...steps {
                let a = a0 + sweep * Double(k) / Double(steps)
                let p = cam.project(c + u * (r * cos(a)) + v * (r * sin(a))).p
                top = max(top, p.y)
                if k == 0 { path.move(to: p) } else { path.addLine(to: p) }
            }
            return (path, top)
        }

        // The floor it's projected from: rings with a bezel of ticks, under whatever the camera is on.
        let X = P3(1, 0, 0), Z = P3(0, 0, 1)
        let fc = P3(s0.f.x, floorY, s0.f.z)
        let fr = s0.rad * 0.92
        ctx.setBlendMode(.plusLighter)
        for (k, part) in [1.0, 0.66, 0.33].enumerated() {
            ctx.addPath(circle(fc, X, Z, fr * part, steps: 72).path)
            ctx.setStrokeColor(lineC.cg(k == 0 ? 0.30 : 0.13))
            ctx.setLineWidth(k == 0 ? 1.6 : 1.1)
            ctx.strokePath()
        }
        // (The bezel is fixed in the world, so the ticks go by as the camera goes round.)
        for k in 0..<72 {
            let a = Double(k) / 72 * 2 * .pi
            let d = X * cos(a) + Z * sin(a)
            let long = k % 6 == 0
            line(cam.project(fc + d * fr).p, cam.project(fc + d * (fr * (long ? 1.07 : 1.035))).p)
        }
        ctx.setStrokeColor(lineC.cg(0.26))
        ctx.setLineWidth(1.2)
        ctx.strokePath()
        // A sweep round the bezel, like something reading it.
        let sweepAt = 0.9 * t
        for k in 0..<14 {
            ctx.addPath(circle(fc, X, Z, fr, from: sweepAt - Double(k) * 0.05, sweep: -0.05, steps: 3).path)
            ctx.setStrokeColor(lineC.cg(0.55 * (1 - Double(k) / 14)))
            ctx.setLineWidth(2.6)
            ctx.strokePath()
        }

        // What each system has so far.
        var aliveIn = [Double](repeating: 0, count: clusters.count)
        var count = [Int](repeating: 0, count: clusters.count)
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            aliveIn[clusterOf[i]] += smooth((gt - n.birth) / 0.4)
            count[clusterOf[i]] += 1
        }
        // Which one the film is on, if any.
        var lock = [Double](repeating: 0, count: clusters.count)
        for l in locks { lock[l.cluster] = max(lock[l.cluster], smooth((gt - l.from) / 0.25) * (1 - smooth((gt - l.until) / 0.3)) * (1 - ending)) }

        // Under each system, where it stands on the floor.
        for (h, cl) in clusters.enumerated() where aliveIn[h] > 0 {
            let a = min(1, aliveIn[h])
            let foot = P3(cl.c.x, floorY, cl.c.z)
            let top = cam.project(cl.c).p, bottom = cam.project(foot).p
            ctx.saveGState()
            ctx.setLineDash(phase: 0, lengths: [3, 9])
            line(top, bottom)
            ctx.setStrokeColor(lineC.cg(0.11 * a))
            ctx.setLineWidth(1.1)
            ctx.strokePath()
            ctx.restoreGState()
            ctx.addPath(circle(foot, X, Z, 9 + 0.32 * cl.radius, steps: 28).path)
            ctx.setStrokeColor(lineC.cg(0.22 * a))
            ctx.setLineWidth(1.1)
            ctx.strokePath()
        }

        // Every note where it is now.
        struct Light { var i: Int; var p: CGPoint; var s: Double; var z: Double; var pop: Double }
        var lights: [Light] = []
        var where_ = [CGPoint](repeating: .zero, count: script.nodes.count)
        var fog = [Double](repeating: 1, count: script.nodes.count)
        var pops = [Double](repeating: 0, count: script.nodes.count)
        for (i, n) in script.nodes.enumerated() where n.birth <= gt {
            let w = position(i, t)
            let pr = cam.project(w)
            let pop = backOut((t - n.birth) / 0.32)
            where_[i] = pr.p
            pops[i] = min(1, (gt - n.birth) / 0.25)
            fog[i] = min(1.15, max(0.38, 0.82 - pr.z / (s0.rad * 2.2)))
            lights.append(Light(i: i, p: pr.p, s: pr.s, z: pr.z, pop: pop))
            // It comes up from the floor on a thread of light.
            let beam = 1 - smooth((t - n.birth) / 0.38)
            if beam > 0.01 {
                line(cam.project(P3(w.x, floorY, w.z)).p, pr.p)
                ctx.setStrokeColor((gt >= aiFrom[i] ? look.ai : look.you).cg(0.4 * beam))
                ctx.setLineWidth(1.6)
                ctx.strokePath()
            }
        }

        // The arms of each system.
        let arms = CGMutablePath()
        for l in lights where parent[l.i] >= 0 {
            arms.move(to: where_[parent[l.i]])
            arms.addLine(to: where_[l.i])
        }
        ctx.addPath(arms)
        ctx.setStrokeColor(lineC.cg(0.20 + 0.08 * ending))
        ctx.setLineWidth(1.1)
        ctx.strokePath()
        // Links between notes: brighter, drawn out from one to the other when they're made.
        for l in script.links where l.birth <= gt {
            let a = where_[l.a], b = where_[l.b]
            let e = 1 - pow(1 - min(1, (gt - l.birth) / 0.45), 3)
            ctx.setStrokeColor(C(0xFFFFFF).cg(0.34 + 0.5 * (1 - e)))
            ctx.setLineWidth(1.5)
            line(a, CGPoint(x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e))
            ctx.strokePath()
        }

        // Each system's ring, as wide as what's in it, with a brighter arc going round.
        var tops = [Double](repeating: 0, count: clusters.count)
        var mids = [(p: CGPoint, s: Double, z: Double)](repeating: (.zero, 1, 0), count: clusters.count)
        for (h, cl) in clusters.enumerated() where aliveIn[h] > 0 {
            let r = Self.spread * aliveIn[h].squareRoot() + 18
            let a = min(1, aliveIn[h])
            let ring = circle(cl.c, cl.u, cl.v, r)
            tops[h] = ring.top
            mids[h] = cam.project(cl.c)
            let hot = lock[h]
            ctx.addPath(ring.path)
            ctx.setStrokeColor(lineC.mix(look.you, hot).cg((0.26 + 0.5 * hot) * a))
            ctx.setLineWidth(1.2 + 0.8 * hot)
            ctx.strokePath()
            ctx.addPath(circle(cl.c, cl.u, cl.v, r + 7, from: -cl.turn * 9 * t + hash(cl.folder, 12) * 6, sweep: 1.3, steps: 14).path)
            ctx.setStrokeColor(lineC.mix(look.you, hot).cg((0.5 + 0.4 * hot) * a))
            ctx.setLineWidth(2)
            ctx.strokePath()
        }

        // The lights, far ones first.
        lights.sort { $0.z > $1.z }
        // At the end a wave goes out through it from the middle, and it stays lit.
        let wave = (t - growth - 0.15) * 620
        for l in lights {
            let n = script.nodes[l.i]
            var done = 0, last = -Double.infinity
            for e in n.edits where e <= gt { done += 1; last = e }
            let w = min(1, (Double(done) / busyEdits).squareRoot())
            let pulse = exp(-max(0, gt - max(last, n.birth)) / 0.45) * (1 - ending)
            var lit = 0.5 + 0.5 * w
            if t > growth {
                let d = simd_length(position(l.i, t) - s0.f)
                lit = max(lit * (1 - 0.25 * ending), ending * (0.55 + 0.45 * worked[l.i])) + 0.7 * exp(-pow((d - wave) / 90, 2))
            }
            let ai = smooth((gt - aiFrom[l.i]) / 0.35)
            let f = fog[l.i]
            let core = (2.6 + 3.6 * w + 1.8 * pulse) * l.s * l.pop
            let halo = (12 + 16 * w + 22 * pulse + 7 * ending * worked[l.i]) * l.s * l.pop
            let glow = min(1, (0.36 + 0.4 * lit + 0.4 * pulse + 0.16 * ending) * f)
            let box = CGRect(x: l.p.x - halo, y: l.p.y - halo, width: halo * 2, height: halo * 2)
            ctx.setBlendMode(.plusLighter)
            if ai < 1 { ctx.setAlpha(glow * (1 - ai)); ctx.draw(youGlow, in: box) }
            if ai > 0 { ctx.setAlpha(glow * ai); ctx.draw(aiGlow, in: box) }
            ctx.setAlpha(1)
            // (Its middle keeps its colour however many lights are behind it.)
            ctx.setBlendMode(.normal)
            let colour = look.you.mix(look.ai, ai).mix(C(0xFFFFFF), 0.12 + 0.3 * pulse).mix(C(0x000000), max(0, 0.55 - 0.55 * f / 0.8))
            ctx.setFillColor(colour.cg())
            ctx.fillEllipse(in: CGRect(x: l.p.x - core, y: l.p.y - core, width: core * 2, height: core * 2))
            ctx.setBlendMode(.plusLighter)
            // A ring goes out from it each time it's written in.
            let since = gt - last
            if since >= 0, since < 0.6, t <= growth {
                let x = since / 0.6
                let r = (8 + 30 * x) * l.s
                ctx.setStrokeColor(look.you.mix(look.ai, ai).cg(0.6 * (1 - x) * f))
                ctx.setLineWidth(1.4)
                ctx.strokeEllipse(in: CGRect(x: l.p.x - r, y: l.p.y - r, width: r * 2, height: r * 2))
            }
        }
        ctx.setBlendMode(.normal)

        // The system the film is on: brackets close round it.
        for (h, cl) in clusters.enumerated() where lock[h] > 0.01 {
            let a = lock[h]
            let m = mids[h]
            let half = ((Self.spread * aliveIn[h].squareRoot() + 18) * m.s + 34) * (1.25 - 0.25 * a)
            let arm = 24.0
            ctx.setStrokeColor(look.you.cg(0.95 * a))
            ctx.setLineWidth(2.5)
            ctx.setLineCap(.butt)
            for (sx, sy) in [(-1.0, -1.0), (1, -1), (1, 1), (-1, 1)] {
                let corner = CGPoint(x: m.p.x + sx * half, y: m.p.y + sy * half * 0.86)
                ctx.move(to: CGPoint(x: corner.x - sx * arm, y: corner.y))
                ctx.addLine(to: corner)
                ctx.addLine(to: CGPoint(x: corner.x, y: corner.y - sy * arm))
            }
            ctx.strokePath()
            ctx.setLineCap(.round)
            _ = cl
        }

        // Their names, each over its ring, with how many notes it has so far. Where two would
        // meet, the one further back gives way.
        if folderNames {
            var taken: [CGRect] = []
            let ceiling = H - canvas.top - 190
            for h in clusters.indices.sorted(by: { mids[$0].z < mids[$1].z }) where aliveIn[h] > 0 {
                let cl = clusters[h]
                let name = script.folders[cl.folder]
                guard !name.isEmpty else { continue }
                let m = mids[h]
                let near = min(1, max(0.55, 0.85 - m.z / (s0.rad * 2.4)))
                var a = smooth((gt - cl.birth - 0.15) / 0.4) * near
                let size = 32.0
                let digits = "\(count[h])"
                let nameW = FilmKit.width(name, size, 0.23), gap = 12.0, digitsW = FilmKit.width(digits, size - 4, 0)
                let total = nameW + gap + digitsW
                let x = min(W - 40 - total, max(40, m.p.x - total / 2))
                let y = min(ceiling, tops[h] + 20 + 22 * lock[h])
                // (One whose system has gone up out of the picture goes with it.)
                a *= 1 - smooth((tops[h] - ceiling) / 50)
                let box = CGRect(x: x - 10, y: y - 10, width: total + 20, height: size + 14)
                var covered = 0.0
                for r in taken { let i = box.intersection(r); if !i.isNull { covered = max(covered, i.width * i.height / (box.width * box.height)) } }
                a *= 1 - smooth(covered * 3)
                guard a > 0.01 else { continue }
                taken.append(box)
                ctx.setStrokeColor(wire.cg(0.4 * a))
                ctx.setLineWidth(1.1)
                ctx.move(to: CGPoint(x: m.p.x, y: tops[h] + 3))
                ctx.addLine(to: CGPoint(x: m.p.x, y: y - 6))
                ctx.strokePath()
                // (On a dark plate, so it reads over whatever lights are behind it.)
                ctx.setFillColor(ground.mix(C(0x000000), 0.4).cg(0.55 * a))
                ctx.addPath(CGPath(roundedRect: CGRect(x: x - 9, y: y - 9, width: total + 18, height: size + 12), cornerWidth: 8, cornerHeight: 8, transform: nil))
                ctx.fillPath()
                FilmKit.text(name, size, 0.23, look.ink.cg(0.94 * a), at: CGPoint(x: x, y: y), in: ctx)
                FilmKit.text(digits, size - 4, 0, wire.cg(0.7 * a), at: CGPoint(x: x + nameW + gap, y: y), in: ctx)
            }
        }

        // It never runs under the words.
        let fade = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [ground.cg(1), ground.cg(0)] as CFArray, locations: [0, 1])!
        ctx.setFillColor(ground.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: canvas.bottom + 250))
        ctx.saveGState()
        ctx.clip(to: CGRect(x: 0, y: canvas.bottom + 250, width: W, height: 90))
        ctx.drawLinearGradient(fade, start: CGPoint(x: 0, y: canvas.bottom + 250), end: CGPoint(x: 0, y: canvas.bottom + 340), options: [])
        ctx.restoreGState()
        // Nor behind the mark and the key along the top.
        let roof = canvas.height - canvas.top - 60
        ctx.fill(CGRect(x: 0, y: roof, width: W, height: canvas.height - roof))
        ctx.saveGState()
        ctx.clip(to: CGRect(x: 0, y: roof - 80, width: W, height: 80))
        ctx.drawLinearGradient(fade, start: CGPoint(x: 0, y: roof), end: CGPoint(x: 0, y: roof - 80), options: [])
        ctx.restoreGState()
    }
}
