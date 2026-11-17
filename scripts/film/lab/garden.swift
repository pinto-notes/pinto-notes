import CoreGraphics
import Foundation

/// Lab: the month as a paper garden. Each folder is a plant; each note is a leaf (Pinto's leaf,
/// with a note's ruled lines) that sprouts when the note is made and grows each time it's written
/// in. Amber leaves are yours alone; blue ones your AI helped with.
final class GardenFilm {
    let script: FilmScript
    let W = 1080.0, H: Double
    var folderNames = true
    var mark: CGImage?
    static let prelude = 0.9
    var growth: Double { script.growth }
    var frameCount: Int { Int(((Self.prelude + growth + FilmScript.outro) * 30).rounded()) }

    struct Plant { var folder: Int; var x: Double; var notes: [Int]; var length: Double; var sway: Double; var phase: Double; var birth: Double; var lean: Double; var leaf: Double }
    struct Leaf { var plant: Int; var u: Double; var side: Double; var tone: Double }
    private var plants: [Plant] = []
    private var leaves: [Leaf] = []
    private let worked: [Double]
    private let aiFrom: [Double]
    private let soil = 300.0
    /// The notes written in most, a handful: they flower at the end, one after another.
    private var blooms: [Int] = []
    private var ending: CGImage?
    /// The camera's zoom, eased from frame to frame (so frames are drawn in order).
    private var zoomNow = 1.0
    private var zoomSet = false

    init(script: FilmScript, height: Double = 1350) {
        self.script = script
        H = height
        let counts = script.nodes.map(\.edits.count).sorted()
        let busy = Double(max(1, counts.isEmpty ? 1 : counts[Int(0.9 * Double(counts.count - 1))]))
        worked = script.nodes.map { min(1, (Double($0.edits.count) / busy).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
        blooms = Array(script.nodes.indices.sorted { script.nodes[$0].edits.count > script.nodes[$1].edits.count }.prefix(max(3, min(9, script.nodes.count / 8))))
        let F = script.folders.count
        var by = [[Int]](repeating: [], count: F)
        for (i, n) in script.nodes.enumerated() { by[n.folder].append(i) }
        // Tallest in the middle, the others stepping down to the sides.
        let bySize = (0..<F).sorted { by[$0].count > by[$1].count }
        var slot = [Int](repeating: 0, count: F)
        // Places from the middle outwards, each used once.
        let places = (0..<F).sorted { abs(Double($0) - Double(F - 1) / 2) < abs(Double($1) - Double(F - 1) / 2) }
        for (j, f) in bySize.enumerated() { slot[f] = places[j] }
        let most = Double(by.map(\.count).max() ?? 1)
        leaves = Array(repeating: Leaf(plant: 0, u: 0, side: 1, tone: 0), count: script.nodes.count)
        for f in 0..<F where !by[f].isEmpty {
            let n = Double(by[f].count)
            // A bouquet: stems start close and fan out, the tallest upright in the middle.
            // Every plant has its own place on the ground, evenly spaced and never shared.
            let c = (Double(min(F - 1, max(0, slot[f]))) + 0.5) / Double(F) - 0.5
            let x = W / 2 + c * min(W - 260, max(380, 190 * Double(F)))
            let length = 190 + 600 * pow(n / most, 0.6)
            // Leaves a little smaller on a crowded stem.
            let leaf = min(1, max(0.72, 1.25 - n / 60))
            plants.append(Plant(folder: f, x: x, notes: by[f], length: length, sway: 14 + 16 * lhash(f, 2), phase: lhash(f, 3) * 6, birth: max(0, script.nodes[by[f][0]].birth - 0.25), lean: c * 150, leaf: leaf))
            for (k, i) in by[f].enumerated() {
                leaves[i] = Leaf(plant: plants.count - 1, u: (Double(k) + 1) / (n + 0.6), side: k % 2 == 0 ? 1 : -1, tone: lhash(i, 5))
            }
        }
    }

    private func point(_ p: Plant, _ u: Double) -> (CGPoint, Double) {
        let x = p.x + p.sway * sin(u * 2.4 + p.phase) * u + p.lean * u * u
        let dx = (p.sway * (sin(u * 2.4 + p.phase) + u * 2.4 * cos(u * 2.4 + p.phase)) + 2 * p.lean * u) / p.length
        return (CGPoint(x: x, y: soil + p.length * u), atan2(1, dx))
    }

    func draw(frame: Int, in ctx: CGContext) {
        let k = Double(ctx.width) / W
        ctx.saveGState()
        ctx.scaleBy(x: k, y: k)
        let t = Double(frame) / 30 - Self.prelude
        if t < 0 {
            if ending == nil, let c = Kit.context(ctx.width, ctx.height) {
                c.scaleBy(x: k, y: k)
                scene(growth + FilmScript.outro, words: false, in: c)
                ending = c.makeImage()
            }
            scene(0, words: false, in: ctx)
            let a = 1 - lsmooth((t + 0.42) / 0.42)
            if let ending, a > 0 {
                ctx.saveGState()
                ctx.scaleBy(x: 1 / k, y: 1 / k)
                ctx.setAlpha(a)
                ctx.draw(ending, in: CGRect(x: 0, y: 0, width: ctx.width, height: ctx.height))
                ctx.restoreGState()
            }
            chrome(in: ctx)
            title(1, in: ctx)
        } else {
            scene(t, words: true, in: ctx)
        }
        ctx.restoreGState()
    }

    private func scene(_ t: Double, words: Bool, in ctx: CGContext) {
        let gt = min(t, growth)
        let dusk = lsmooth((t - growth) / 1.4)
        // The page, warming to dusk at the end.
        ctx.setFillColor(LC(0xFFF4E6).mix(LC(0xF6C9A4), dusk).cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        let warm = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [LC(0xFBD9B4).mix(LC(0xE8908A), dusk).cg(0.55 + 0.35 * dusk), LC(0xFFF4E6).mix(LC(0xF6C9A4), dusk).cg(0)] as CFArray, locations: [0, 1])!
        ctx.drawLinearGradient(warm, start: CGPoint(x: 0, y: soil), end: CGPoint(x: 0, y: soil + 620), options: [])
        // It starts close on the first sprouts and draws back as they grow.
        var tallest = 120.0
        for p in plants where gt >= p.birth {
            var reach = 0.04
            for i in p.notes { let n = script.nodes[i]; if n.birth <= gt { reach = max(reach, leaves[i].u + 0.05) } else { break } }
            tallest = max(tallest, p.length * min(1, reach) + 110)
        }
        let room = H - soil - 190
        // ...never so close that a plant that's up, or its name, leaves the sides.
        var widest = 120.0
        for p in plants where gt >= p.birth { widest = max(widest, abs(p.x - W / 2) + abs(p.lean) + 110) }
        zoomNow += (min(2.1, (W / 2 - 20) / widest, max(1, room / tallest)) - zoomNow) * (zoomSet ? 0.07 : 1)
        zoomSet = true
        let zoom = t > growth ? zoomNow + (1 - zoomNow) * lsmooth((t - growth) / 0.8) : zoomNow
        ctx.saveGState()
        ctx.translateBy(x: W / 2, y: soil)
        ctx.scaleBy(x: zoom, y: zoom)
        ctx.translateBy(x: -W / 2, y: -soil)

        let rustle = t > growth ? sin(min(1, (t - growth) / 1.2) * .pi) : 0
        for (pi, p) in plants.enumerated() where gt >= p.birth {
            // The stem has grown as far as its newest leaf.
            var reach = 0.04
            for i in p.notes { let n = script.nodes[i]; if n.birth <= gt { reach = max(reach, leaves[i].u + 0.05 * lsmooth((gt - n.birth) / 0.5)) } else { break } }
            let grown = min(1, reach) * lsmooth((gt - p.birth) / 0.5)
            // Stem.
            let path = CGMutablePath()
            var u = 0.0
            path.move(to: point(p, 0).0)
            while u < grown { u = min(grown, u + 0.02); path.addLine(to: point(p, u).0) }
            ctx.saveGState()
            ctx.setShadow(offset: CGSize(width: 0, height: -3), blur: 6, color: CGColor(gray: 0, alpha: 0.22))
            ctx.addPath(path)
            ctx.setStrokeColor(LC(0x5A6E4E).cg())
            ctx.setLineWidth(7)
            ctx.setLineCap(.round)
            ctx.strokePath()
            ctx.restoreGState()
            // Leaves, lowest first.
            for i in p.notes {
                let n = script.nodes[i]
                guard n.birth <= gt else { break }
                var count = 0, flash = 0.0
                for et in n.edits { if et > gt { break }; count += 1; flash = max(flash, exp(-(gt - et) / 0.45)) }
                if t > growth { flash = rustle * (0.4 + 0.6 * worked[i]) }
                let lf = leaves[i]
                let (base, tangent) = point(p, lf.u)
                let pop = lbackOut((gt - n.birth) / 0.55)
                let size = (32 + 14 * Double(count).squareRoot()) * p.leaf * pop * (1 + 0.1 * flash)
                let angle = tangent - lf.side * (1.05 + 0.25 * (lf.tone - 0.5)) + lf.side * 0.12 * sin(t * 2.2 + Double(i)) * (0.3 + flash)
                let ai = aiFrom[i] <= growth ? max(lsmooth((gt - aiFrom[i]) / 0.35), t > growth ? 1 : 0) : 0
                let amber = [LC(0xE8791A), LC(0xF29A38), LC(0xD96A12), LC(0xF3A94E)][Int(lf.tone * 4) % 4]
                let blue = [LC(0x4E6FA0), LC(0x6283B2), LC(0x44628F), LC(0x7393BF)][Int(lf.tone * 4) % 4]
                leaf(at: base, angle: angle, size: size, color: amber.mix(blue, ai).mix(LC(0xFFFFFF), 0.25 * flash), lines: min(4, 1 + count / 3), in: ctx)
                // At the end the notes written in most come into flower.
                if t > growth, let k = blooms.firstIndex(of: i) {
                    let open = lbackOut((t - growth - 0.3 - Double(k) * 0.14) / 0.6)
                    if open > 0 { blossom(at: CGPoint(x: base.x + cos(angle) * size * 0.95, y: base.y + sin(angle) * size * 0.95), r: 22 * open, spin: Double(i), in: ctx) }
                }
            }
            // Its name on a paper label that rides the growing tip.
            if folderNames, !script.folders[p.folder].isEmpty {
                let a = lsmooth((gt - p.birth - 0.3) / 0.4)
                let tip = point(p, grown).0
                if a > 0 { label(script.folders[p.folder], at: CGPoint(x: tip.x, y: tip.y + 44 + Double(pi % 2) * 8), alpha: a, in: ctx) }
            }
        }
        ctx.restoreGState()
        // The ground: Pinto's leaf-brown, the words on it.
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: 5), blur: 12, color: CGColor(gray: 0, alpha: 0.3))
        let g = CGMutablePath()
        g.move(to: CGPoint(x: -10, y: 0))
        var x = -10.0
        while x <= W + 10 { g.addLine(to: CGPoint(x: x, y: soil - 16 + 7 * sin(x / 120) + 4 * sin(x / 37))); x += 10 }
        g.addLine(to: CGPoint(x: W + 10, y: 0))
        ctx.addPath(g)
        ctx.setFillColor(LC(0x3B2A22).cg())
        ctx.fillPath()
        ctx.restoreGState()
        ctx.saveGState()
        ctx.setBlendMode(.softLight)
        ctx.setAlpha(0.5)
        ctx.draw(Kit.grain, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        ctx.restoreGState()
        guard words else { return }
        chrome(in: ctx)
        self.words(t, in: ctx)
    }

    /// Pinto's leaf: a pointed oval of paper with a midrib and a note's ruled lines.
    private func leaf(at p: CGPoint, angle: Double, size: Double, color: LC, lines: Int, in ctx: CGContext) {
        guard size > 1 else { return }
        ctx.saveGState()
        ctx.translateBy(x: p.x, y: p.y)
        ctx.rotate(by: angle)
        let w = size * 0.44
        let path = CGMutablePath()
        path.move(to: .zero)
        path.addCurve(to: CGPoint(x: size, y: 0), control1: CGPoint(x: size * 0.25, y: w), control2: CGPoint(x: size * 0.8, y: w * 0.75))
        path.addCurve(to: .zero, control1: CGPoint(x: size * 0.8, y: -w * 0.75), control2: CGPoint(x: size * 0.25, y: -w))
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -3), blur: 7, color: CGColor(gray: 0, alpha: 0.28))
        ctx.addPath(path)
        ctx.setFillColor(color.cg())
        ctx.fillPath()
        ctx.restoreGState()
        // Midrib and ruled lines in cream.
        ctx.setStrokeColor(LC(0xFFF4E6).cg(0.9))
        ctx.setLineCap(.round)
        ctx.setLineWidth(max(1.2, size * 0.035))
        ctx.move(to: CGPoint(x: size * 0.1, y: 0))
        ctx.addLine(to: CGPoint(x: size * 0.86, y: 0))
        ctx.strokePath()
        ctx.setLineWidth(max(1, size * 0.028))
        for k in 0..<lines {
            let x = size * (0.3 + 0.14 * Double(k)), h = w * (0.52 - 0.07 * Double(k))
            ctx.move(to: CGPoint(x: x, y: 0))
            ctx.addLine(to: CGPoint(x: x + size * 0.1, y: h))
            ctx.move(to: CGPoint(x: x, y: 0))
            ctx.addLine(to: CGPoint(x: x + size * 0.1, y: -h))
        }
        ctx.strokePath()
        ctx.restoreGState()
    }

    private func blossom(at p: CGPoint, r: Double, spin: Double, in ctx: CGContext) {
        guard r > 0.5 else { return }
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -2), blur: 5, color: CGColor(gray: 0, alpha: 0.3))
        ctx.setFillColor(LC(0xFFFBF3).cg())
        for k in 0..<5 {
            let a = spin + Double(k) * 2 * .pi / 5
            ctx.fillEllipse(in: CGRect(x: p.x + cos(a) * r * 0.72 - r * 0.62, y: p.y + sin(a) * r * 0.72 - r * 0.62, width: r * 1.24, height: r * 1.24))
        }
        ctx.restoreGState()
        ctx.setFillColor(LC(0xFFC85A).cg())
        ctx.fillEllipse(in: CGRect(x: p.x - r * 0.42, y: p.y - r * 0.42, width: r * 0.84, height: r * 0.84))
    }

    private func label(_ name: String, at p: CGPoint, alpha: Double, in ctx: CGContext) {
        var name = name
        if name.count > 16 { name = name.prefix(15) + "\u{2026}" }
        let w = Kit.width(name, 25, 0.3) + 26, h = 38.0
        let rect = CGRect(x: p.x - w / 2, y: p.y, width: w, height: h)
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.setShadow(offset: CGSize(width: 0, height: -3), blur: 7, color: CGColor(gray: 0, alpha: 0.3))
        ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 8, cornerHeight: 8, transform: nil))
        ctx.setFillColor(LC(0xFFFBF3).cg())
        ctx.fillPath()
        ctx.restoreGState()
        Kit.text(name, 25, 0.3, LC(0x3A2B2E).cg(alpha), at: CGPoint(x: p.x, y: rect.minY + 11), align: 0.5, in: ctx)
    }

    private func chrome(in ctx: CGContext) {
        let ink = LC(0x3A2B2E)
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
        for (name, c) in [("With \(ai)", LC(0x4E6FA0)), ("Just me", LC(0xE8791A))] {
            let w = Kit.width(name, 30, 0.23)
            Kit.text(name, 30, 0.23, ink.cg(0.85), at: CGPoint(x: right - w, y: y), in: ctx)
            leaf(at: CGPoint(x: right - w - 34, y: y + 4), angle: 0.6, size: 26, color: c, lines: 0, in: ctx)
            right -= w + 34 + 28
        }
    }

    private func title(_ a: Double, in ctx: CGContext) {
        let s = script.stats
        Kit.text("My first month", 60, 0.3, LC(0xFFF4E6).cg(a), at: CGPoint(x: 72, y: 196), in: ctx)
        Kit.text("\(s.notes) notes in Pinto Notes", 36, 0, LC(0xFFF4E6).cg(0.74 * a), at: CGPoint(x: 72, y: 138), in: ctx)
    }

    private func words(_ t: Double, in ctx: CGContext) {
        let s = script.stats
        let cream = LC(0xFFF4E6)
        let side = 72.0
        let opening = 1 - lsmooth((t - 0.25) / 0.5)
        if opening > 0 { title(opening, in: ctx) }
        let running = lsmooth((t - 0.6) / 0.45) * (1 - lsmooth((t - growth) / 0.4))
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
                busiest = lsmooth((t - span.start) / 0.3) * (1 - lsmooth((t - span.start - length) / 0.3))
                if busiest > 0 { Kit.text("My busiest day \u{00B7} \(s.busiestDayEdits) edits", 40, 0.23, LC(0xFFC85A).cg(busiest * running), at: CGPoint(x: side, y: 88), in: ctx) }
            }
            let lines = ["Each leaf is a note", "It grows each time it\u{2019}s written in"]
            var from = 0.75
            let slot = min(2.5, max(1.6, (growth - from - 0.3) / Double(lines.count)))
            for line in lines where from + slot <= growth + 0.01 {
                let a = lsmooth((t - from) / 0.3) * (1 - lsmooth((t - from - slot + 0.4) / 0.3)) * (1 - busiest) * running
                if a > 0 { Kit.text(line, 40, 0, cream.cg(0.7 * a), at: CGPoint(x: side, y: 88), in: ctx) }
                from += slot
            }
        }
        let outro = lsmooth((t - growth - 0.5) / 0.7)
        guard outro > 0 else { return }
        let rise = (1 - outro) * 14
        Kit.text("My first month", 60, 0.3, cream.cg(outro), at: CGPoint(x: side, y: 216 - rise), in: ctx)
        let line = folderNames && s.topFolder != nil ? "Most written in \(s.topFolder!) \u{00B7} \(s.topFolderNotes) notes" : "Busiest day \u{00B7} \(s.busiestDayEdits) edits"
        Kit.text(line, 36, 0, cream.cg(0.82 * lsmooth((t - growth - 0.8) / 0.6)), at: CGPoint(x: side, y: 162 - rise), in: ctx)
        var stats: [(String, String, LC)] = [("\(s.notes)", "notes", cream), ("\(s.writingDays)", "days written on", cream)]
        if let ai = s.ai, s.aiNotes > 0 { stats.append(("\(s.aiNotes)", "notes with \(ai)", LC(0x8FC8FF))) } else { stats.append(("\(s.edits)", "edits", cream)) }
        let column = (W - side * 2) / 3
        for (k, (number, label, c)) in stats.enumerated() {
            let a = lsmooth((t - growth - 1.0 - 0.12 * Double(k)) / 0.5)
            let x = side + column * Double(k), y = 40 - (1 - a) * 10
            Kit.text(number, 66, 0.3, c.cg(a), at: CGPoint(x: x, y: y + 46), in: ctx)
            Kit.text(label, 30, 0, cream.cg(0.76 * a), at: CGPoint(x: x, y: y), in: ctx)
        }
    }
}
