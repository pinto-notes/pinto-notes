import CoreGraphics
import Foundation

/// Lab: the month as a cut-paper town at dusk (the site footer's world). Each note is a house on
/// its folder's hill; a window lights and the chimney smokes when it's written in; houses grow
/// floors as they're edited; the day runs from morning to dusk, and at the end night falls and
/// the windows come on where the work was.
final class TownFilm {
    let script: FilmScript
    let W = 1080.0, H: Double
    var folderNames = true
    var mark: CGImage?
    /// Seconds: the finished town held at the start, then the film.
    static let prelude = 0.9
    var growth: Double { script.growth }
    var frameCount: Int { Int(((Self.prelude + growth + FilmScript.outro) * 30).rounded()) }

    struct Hill { var folder: Int; var cx, base, w, h, s: Double; var depth: Int; var birth: Double; var skew: Double; var tagY = 0.0 }
    struct House { var hill: Int; var x, y, s, w: Double; var wall, roof: Int; var chimneyLeft: Bool }
    private var hills: [Hill] = []
    private var houses: [House] = []
    private var order: [Int] = []          // note indices, back to front
    private var trees: [(hill: Int, x: Double, y: Double, r: Double, tone: Double)] = []
    private let worked: [Double]
    private let aiFrom: [Double]
    private let ground = 300.0
    private let amberGlow = Kit.glow(C(0xFFC85A)), blueGlow = Kit.glow(C(0x8FC8FF)), warmHaze = Kit.glow(C(0xFFB36B))
    private var ending: CGImage?

    init(script: FilmScript, height: Double = 1350) {
        self.script = script
        H = height
        let counts = script.nodes.map(\.edits.count).sorted()
        let busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        worked = script.nodes.map { min(1, (Double($0.edits.count) / busy).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        layout()
    }

    // MARK: Layout (fixed for the whole film, from how the month ends)

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
                let s = [0.98, 1.14, 1.3][depth]
                let w = min(W * 0.9 / max(1, m) * 1.25, (300 + 46 * n.squareRoot()) * (0.94 + 0.12 * hash(f, 5)))
                let h = (126 + 17 * n.squareRoot()) * (0.92 + 0.16 * hash(f, 7))
                let base = ground + [352.0, 196, 34][depth]
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
                    spots.append((x, (2 + Double(r) * 36) * s + hash(hi * 37 + k, r) * 6 * s, Double(r) * 0.8 + abs(u) * 1.3 + hash(hi * 11 + k, r * 3 + 1) * 0.55))
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
            hills[hi].tagY = hill.base + hill.h + 78 * s
        }
        // Tags keep clear of each other.
        for a in hills.indices { for b in hills.indices where b < a && abs(hills[a].cx - hills[b].cx) < 180 && abs(hills[a].tagY - hills[b].tagY) < 46 { hills[a].tagY = hills[b].tagY + 52 } }
        order = script.nodes.indices.sorted { a, b in
            let ha = houses[a], hb = houses[b]
            return ha.hill == hb.hill ? ha.y < hb.y : ha.hill < hb.hill
        }
    }

    /// How far a hill has risen at film time `gt`, 0...1.
    private func risen(_ h: Hill, _ gt: Double) -> Double { gt < h.birth ? 0 : backOut((gt - h.birth) / 0.8) }

    /// The top edge of a row's sheet at `x`: its level ground with each folder's hill on it.
    private func ridge(depth: Int, _ x: Double, _ gt: Double) -> Double {
        let base = ground + [352.0, 196, 34][depth]
        var y = base + 9 * sin(x / 83 + Double(depth) * 2.1) + 6 * sin(x / 31 + Double(depth))
        for h in hills where h.depth == depth {
            let u = (x - h.cx) / (h.w * 0.46)
            y += h.h * exp(-u * u) * risen(h, gt)
        }
        return y
    }

    // MARK: Time

    func draw(frame: Int, in ctx: CGContext) {
        let k = Double(ctx.width) / W
        ctx.saveGState()
        ctx.scaleBy(x: k, y: k)
        let t = Double(frame) / 30 - Self.prelude
        if t < 0 {
            // Opens on the town as the month left it, at night; then the night lifts to the first morning.
            if ending == nil, let c = Kit.context(ctx.width, ctx.height) {
                c.scaleBy(x: k, y: k)
                scene(growth + FilmScript.outro, words: false, in: c)
                ending = c.makeImage()
            }
            scene(0, words: false, in: ctx)
            let a = 1 - smooth((t + 0.42) / 0.42)
            if let ending, a > 0 {
                ctx.saveGState()
                ctx.scaleBy(x: 1 / k, y: 1 / k)
                ctx.setAlpha(a)
                ctx.draw(ending, in: CGRect(x: 0, y: 0, width: ctx.width, height: ctx.height))
                ctx.restoreGState()
            }
            chrome(dark: a, in: ctx)
            title(1, in: ctx)
        } else {
            scene(t, words: true, in: ctx)
        }
        ctx.restoreGState()
    }

    // MARK: Drawing

    private func scene(_ t: Double, words: Bool, in ctx: CGContext) {
        let gt = min(t, growth)
        let p = gt / growth
        let dusk = smooth((p - 0.3) / 0.7)
        let night = smooth((t - growth) / 1.3)
        func col(_ day: UInt32, _ dk: UInt32, _ nt: UInt32) -> C { C(day).mix(C(dk), dusk).mix(C(nt), night) }
        // The whole stage drifts a little, near sheets more than far ones: paper at different depths.
        let total = growth + FilmScript.outro
        let drift = -16 * cos(min(1, max(0, t / total)) * .pi)
        func layer(_ depth: Double, _ body: () -> Void) {
            ctx.saveGState()
            ctx.translateBy(x: drift * depth, y: 0)
            body()
            ctx.restoreGState()
        }

        // Sky.
        let top = col(0xFFF7EA, 0xFCE6CC, 0x1F1019), mid = col(0xFFEFD9, 0xF7BC97, 0x4A1D2A), hor = col(0xFFE4C6, 0xE88F8C, 0xA44E3E)
        // Painted small and stretched: a full-size gradient costs many times more.
        if let strip = Kit.context(2, 96) {
            let sky = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [hor.cg(), mid.cg(), top.cg()] as CFArray, locations: [0, 0.38, 1])!
            strip.drawLinearGradient(sky, start: .zero, end: CGPoint(x: 0, y: 96), options: [])
            if let image = strip.makeImage() {
                ctx.interpolationQuality = .low
                ctx.draw(image, in: CGRect(x: -2, y: ground + 430, width: W + 4, height: H - ground - 430))
                ctx.setFillColor(hor.cg())
                ctx.fill(CGRect(x: 0, y: ground, width: W, height: 432))
            }
        }
        // The low sun's warmth on the horizon, going down.
        ctx.setBlendMode(.plusLighter)
        let sunY = ground + 640 - 190 * p
        ctx.setAlpha(0.5 * (1 - night) * (0.4 + 0.6 * dusk))
        ctx.draw(warmHaze, in: CGRect(x: W * 0.62 - 420, y: sunY - 420, width: 840, height: 840))
        ctx.setAlpha(1)
        ctx.setBlendMode(.normal)
        // Stars.
        if night > 0 {
            var r = Rand(5)
            for _ in 0..<60 {
                let x = r.next() * W, y = ground + 620 + r.next() * (H - ground - 620), s = 1 + r.next() * 1.6, a = r.next()
                ctx.setFillColor(C(0xFFF1D6).cg(night * (0.25 + 0.6 * a) * (0.75 + 0.25 * sin(t * 2.6 + a * 40))))
                ctx.fillEllipse(in: CGRect(x: x - s, y: y - s, width: s * 2, height: s * 2))
            }
        }
        // Far hills, three sheets of paper.
        let far: [(Double, Double, C)] = [(ground + 560, 44, col(0xE4D3E2, 0xCFAFC9, 0x402845)), (ground + 505, 52, col(0xD0BDD8, 0xB494BC, 0x33213D)), (ground + 452, 44, col(0xB9B2CC, 0x9482AE, 0x281C35))]
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
        for depth in 0..<3 { layer([0.45, 0.7, 1.0][depth]) {
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
                    ctx.draw(warmHaze, in: CGRect(x: hill.cx - r, y: hill.base + hill.h * 0.55 - r * 0.7, width: r * 2, height: r * 1.4))
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
                    if !name.isEmpty, a > 0 { tag(name, at: CGPoint(x: hill.cx, y: hill.tagY), alpha: a, night: night, in: ctx) }
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
        // Birds on their way home at dusk.
        layer(0.3) { birds(t, night: night, in: ctx) }

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
        layer(1.35) { sheet(front, groundC, in: ctx) }
        // Paper grain over everything.
        ctx.draw(Kit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)

        guard words else { return }
        chrome(dark: night, in: ctx)
        self.words(t, in: ctx)
    }

    /// A sheet of paper: a filled shape with the soft shadow it casts on the sheet behind.
    private func sheet(_ path: CGPath, _ c: C, in ctx: CGContext) {
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
        let roofs: [(UInt32, UInt32, UInt32)] = [(0x7F5A70, 0x654559, 0x2B1E2E), (0x8E5B56, 0x714544, 0x301F27), (0x6C5A7C, 0x554563, 0x261F33)]
        let wall = col(walls[hs.wall].0, walls[hs.wall].1, walls[hs.wall].2), roof = col(roofs[hs.roof].0, roofs[hs.roof].1, roofs[hs.roof].2)
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
        let w = Kit.width(name, 26, 0.3) + 28, h = 40.0
        let rect = CGRect(x: p.x - w / 2, y: p.y - (1 - alpha) * 10, width: w, height: h)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: 3), blur: 8, color: CGColor(gray: 0, alpha: 0.3))
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 9, cornerHeight: 9, transform: nil))
        ctx.setFillColor(C(0xFFF6E8).mix(C(0xD8C7BE), night * 0.55).cg())
        ctx.fillPath()
        ctx.restoreGState()
        Kit.text(name, 26, 0.3, C(0x3A2B2E).cg(alpha), at: CGPoint(x: p.x, y: rect.minY + 12), align: 0.5, in: ctx)
    }

    private func birds(_ t: Double, night: Double, in ctx: CGContext) {
        let t0 = growth - 3.4
        let a = smooth((t - t0) / 0.5) * (1 - night)
        guard a > 0 else { return }
        ctx.setStrokeColor(C(0x4A3540).cg(0.8 * a))
        ctx.setLineWidth(2.6)
        ctx.setLineCap(.round)
        for (k, (dx, dy)) in [(0.0, 0.0), (44.0, 22.0), (62.0, -26.0), (104.0, 38.0), (128.0, -8.0)].enumerated() {
            let x = W + 60 - (t - t0) * 170 + dx, y = ground + 760 + dy + sin((t - t0) * 1.3 + Double(k)) * 8 + (t - t0) * 9
            let flap = sin((t - t0) * 9 + Double(k) * 1.3)
            let wing = 15.0, lift = 5 + 6 * flap
            ctx.move(to: CGPoint(x: x - wing, y: y + lift))
            ctx.addQuadCurve(to: CGPoint(x: x, y: y), control: CGPoint(x: x - wing * 0.5, y: y + lift + 3))
            ctx.addQuadCurve(to: CGPoint(x: x + wing, y: y + lift), control: CGPoint(x: x + wing * 0.5, y: y + lift + 3))
            ctx.strokePath()
        }
    }

    // MARK: Words

    /// The mark and the key along the top, in ink by day and cream by night.
    private func chrome(dark: Double, in ctx: CGContext) {
        let ink = C(0x3A2B2E).mix(C(0xFFF4E6), dark)
        var x = 64.0
        let y = H - 96
        if let mark {
            let rect = CGRect(x: x, y: y - 12, width: 44, height: 44)
            ctx.saveGState()
            ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 9.8, cornerHeight: 9.8, transform: nil))
            ctx.clip()
            ctx.draw(mark, in: rect)
            ctx.restoreGState()
            x += 58
        }
        Kit.text("Pinto Notes", 30, 0.3, ink.cg(0.9), at: CGPoint(x: x, y: y), in: ctx)
        guard let ai = script.stats.ai else { return }
        var right = W - 64
        for (name, c) in [("With \(ai)", C(0x8FC8FF).mix(C(0x4A8FD8), 1 - dark)), ("Just me", C(0xFFC85A).mix(C(0xE08A1E), 1 - dark))] {
            let w = Kit.width(name, 30, 0.23)
            Kit.text(name, 30, 0.23, ink.cg(0.85), at: CGPoint(x: right - w, y: y), in: ctx)
            // A little window, lit.
            ctx.setFillColor(c.cg())
            ctx.fill(CGRect(x: right - w - 28, y: y + 1, width: 16, height: 21))
            right -= w + 28 + 28
        }
    }

    private func title(_ a: Double, in ctx: CGContext) {
        let s = script.stats
        Kit.text("My first month", 60, 0.3, C(0xFFF4E6).cg(a), at: CGPoint(x: 72, y: 196), in: ctx)
        Kit.text("\(s.notes) notes in Pinto Notes", 36, 0, C(0xFFF4E6).cg(0.74 * a), at: CGPoint(x: 72, y: 138), in: ctx)
    }

    private func words(_ t: Double, in ctx: CGContext) {
        let s = script.stats
        let cream = C(0xFFF4E6)
        let side = 72.0
        let opening = 1 - smooth((t - 0.25) / 0.5)
        if opening > 0 { title(opening, in: ctx) }
        let running = smooth((t - 0.6) / 0.45) * (1 - smooth((t - growth) / 0.4))
        if running > 0 {
            let f = DateFormatter()
            f.locale = Locale(identifier: "en_US")
            f.setLocalizedDateFormatFromTemplate("MMM d")
            let alive = script.nodes.filter { $0.birth <= min(t, growth) }.count
            Kit.text(f.string(from: script.date(at: min(t, growth))), 36, 0.23, cream.cg(0.7 * running), at: CGPoint(x: side, y: 150), in: ctx)
            Kit.text(alive == 1 ? "1 note" : "\(alive) notes", 36, 0.23, cream.cg(0.7 * running), at: CGPoint(x: W - side, y: 150), align: 1, in: ctx)
            var busiest = 0.0
            if let day = s.busiestDay, let span = script.span(ofDay: day), span.start >= 0.55 {
                let length = min(2.4, max(0.9, span.length - 0.15))
                busiest = smooth((t - span.start) / 0.3) * (1 - smooth((t - span.start - length) / 0.3))
                if busiest > 0 { Kit.text("My busiest day \u{00B7} \(s.busiestDayEdits) edits", 40, 0.23, C(0xFFC85A).cg(busiest * running), at: CGPoint(x: side, y: 88), in: ctx) }
            }
            let lines = ["Each house is a note", "A window lights when it\u{2019}s written in", "Houses grow as they\u{2019}re edited"]
            var from = 0.75
            let slot = min(2.5, max(1.6, (growth - from - 0.3) / Double(lines.count)))
            for line in lines where from + slot <= growth + 0.01 {
                let a = smooth((t - from) / 0.3) * (1 - smooth((t - from - slot + 0.4) / 0.3)) * (1 - busiest) * running
                if a > 0 { Kit.text(line, 40, 0, cream.cg(0.7 * a), at: CGPoint(x: side, y: 88), in: ctx) }
                from += slot
            }
        }
        let outro = smooth((t - growth - 0.9) / 0.7)
        guard outro > 0 else { return }
        let rise = (1 - outro) * 14
        Kit.text("My first month", 60, 0.3, cream.cg(outro), at: CGPoint(x: side, y: 228 - rise), in: ctx)
        let line = folderNames && s.topFolder != nil ? "Most written in \(s.topFolder!) \u{00B7} \(s.topFolderNotes) notes" : "Busiest day \u{00B7} \(s.busiestDayEdits) edits"
        Kit.text(line, 36, 0, cream.cg(0.82 * smooth((t - growth - 1.2) / 0.6)), at: CGPoint(x: side, y: 172 - rise), in: ctx)
        var stats: [(String, String, C)] = [("\(s.notes)", "notes", cream), ("\(s.writingDays)", "days written on", cream)]
        if let ai = s.ai, s.aiNotes > 0 { stats.append(("\(s.aiNotes)", "notes with \(ai)", C(0x8FC8FF))) } else { stats.append(("\(s.edits)", "edits", cream)) }
        let column = (W - side * 2) / 3
        for (k, (number, label, c)) in stats.enumerated() {
            let a = smooth((t - growth - 1.4 - 0.12 * Double(k)) / 0.5)
            let x = side + column * Double(k), y = 44 - (1 - a) * 10
            Kit.text(number, 66, 0.3, c.cg(a), at: CGPoint(x: x, y: y + 46), in: ctx)
            Kit.text(label, 30, 0, cream.cg(0.76 * a), at: CGPoint(x: x, y: y), in: ctx)
        }
    }
}
