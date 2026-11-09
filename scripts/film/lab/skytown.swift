import CoreGraphics
import Foundation

/// Lab: the notebook as stars coming out over Pinto's paper town. The constellation is the app's
/// own (FilmRenderer); this draws the dusk-to-night sky behind it and the cut-paper hills and
/// village in front, whose windows come on as the notebook fills.
enum SkyTown {
    static func attach(to r: FilmRenderer, script: FilmScript) {
        let W = 1080.0
        let growth = script.growth
        let amber = Kit.glow(C(0xFFC85A)), haze = Kit.glow(C(0xFF9E6B))
        r.graphLift = 150
        r.drawBehind = { ctx, t in
            let p = min(1, t / growth)
            let night = smooth((p - 0.15) / 0.85)
            func col(_ a: UInt32, _ b: UInt32) -> C { C(a).mix(C(b), night) }
            let H = Double(r.height)
            let sky = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
                                 colors: [col(0xF2A27C, 0x8E4335).cg(), col(0xA2506A, 0x3E1826).cg(), col(0x4A2A52, 0x1B0F1A).cg(), col(0x2A1838, 0x120A12).cg()] as CFArray, locations: [0, 0.3, 0.7, 1])!
            ctx.drawLinearGradient(sky, start: CGPoint(x: 0, y: 380), end: CGPoint(x: 0, y: H), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
            ctx.setBlendMode(.plusLighter)
            ctx.setAlpha(0.55 * (1 - night * 0.8))
            ctx.draw(haze, in: CGRect(x: W * 0.6 - 520, y: 380 - 420, width: 1040, height: 840))
            ctx.setAlpha(1)
            ctx.setBlendMode(.normal)
            // Faint far stars, more as it darkens.
            var rnd = Rand(5)
            for _ in 0..<70 {
                let x = rnd.next() * W, y = 620 + rnd.next() * (H - 620), s = 0.8 + rnd.next() * 1.3, a = rnd.next()
                ctx.setFillColor(C(0xFFF1D6).cg((0.1 + 0.5 * night) * (0.2 + 0.6 * a)))
                ctx.fillEllipse(in: CGRect(x: x - s, y: y - s, width: s * 2, height: s * 2))
            }
        }
        // A fixed little village: the houses and which window lights when.
        struct Home { var x, y, s: Double; var roof: Int; var at: Double }
        var homes: [Home] = []
        var rnd = Rand(21)
        let rows: [(Double, Double, Int)] = [(436, 1.0, 6), (376, 1.25, 5), (318, 1.5, 4)]
        func ridge(_ row: Int, _ x: Double) -> Double {
            let (base, _, _) = rows[row]
            return base + 26 * sin(x / (170 + Double(row) * 40) + Double(row) * 2.2) + 12 * sin(x / 61 + Double(row))
        }
        for (ri, (_, s, n)) in rows.enumerated() {
            for k in 0..<n {
                let x = 70 + (Double(k) + 0.25 + rnd.next() * 0.5) / Double(n) * (W - 140)
                homes.append(Home(x: x, y: ridge(ri, x) - 4, s: s, roof: Int(rnd.next() * 3), at: rnd.next()))
            }
        }
        homes.sort { $0.y > $1.y }
        r.drawInFront = { ctx, t in
            let p = min(1, t / growth)
            let night = smooth((p - 0.15) / 0.85)
            func col(_ a: UInt32, _ b: UInt32) -> C { C(a).mix(C(b), night) }
            func sheet(_ path: CGPath, _ c: C) {
                ctx.saveGState()
                ctx.setShadow(offset: CGSize(width: 0, height: 5), blur: 14, color: CGColor(gray: 0, alpha: 0.35))
                ctx.addPath(path)
                ctx.setFillColor(c.cg())
                ctx.fillPath()
                ctx.restoreGState()
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
                var tr = Rand(UInt64(40 + ri))
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
            ctx.saveGState()
            ctx.setBlendMode(.softLight)
            ctx.setAlpha(0.5)
            ctx.draw(Kit.grain, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
            ctx.restoreGState()
        }
    }
}
