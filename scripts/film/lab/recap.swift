import CoreGraphics
import Foundation
import ImageIO

// Lab: the month as cards, each one a picture you could send to a friend: one true thing about
// your month, in Pinto's cut paper, small enough to read in a chat bubble. Titles here are made
// up (the film's notes carry none); in the app they'd be read on the device.

private typealias RR = FilmRenderer.RGB

struct RecapCards {
    let input: FilmInput
    let script: FilmScript
    let seed: Int
    let mark: CGImage?
    let W = 1080.0, H = 1350.0
    private let cream = RR(0xFFF4E6), ink = RR(0x2A1D10), you = RR(0xFFC45A), ai = RR(0x8FC4FF)
    private var skies: (UInt32, [UInt32]) { GalaxyScene.skies[(seed / 3 + seed) % GalaxyScene.skies.count] }
    private var sky: RR { RR(skies.0) }
    private var tones: [RR] { skies.1.map { RR($0) } }
    private let cal = Calendar(identifier: .gregorian)

    private func blob(_ c: CGPoint, _ rx: Double, _ ry: Double, key: Int) -> [CGPoint] {
        (0..<72).map { k in
            let a = Double(k) / 72 * 2 * .pi
            let wob = 1 + 0.09 * sin(3 * a + lhash(key, 1) * 6) + 0.06 * sin(5 * a + lhash(key, 2) * 6) + 0.035 * sin(9 * a + lhash(key, 3) * 6)
            return CGPoint(x: c.x + cos(a) * rx * wob, y: c.y + sin(a) * ry * wob)
        }
    }
    private func paper(_ pts: [CGPoint], _ c: RR, lift: Double = 1, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -5 * lift), blur: 12 * lift, color: CGColor(gray: 0, alpha: 0.42))
        ctx.addLines(between: pts)
        ctx.closePath()
        ctx.setFillColor(c.cg())
        ctx.fillPath()
        ctx.restoreGState()
    }
    private func star(_ p: CGPoint, _ r: Double, points: Int = 4, inner: Double = 0.4, turn: Double = 0, _ c: RR, in ctx: CGContext) {
        func shape(_ dy: Double) {
            for k in 0..<(points * 2) {
                let a = turn + Double(k) * .pi / Double(points), d = k % 2 == 0 ? r : r * inner
                let q = CGPoint(x: p.x + cos(a) * d, y: p.y + sin(a) * d + dy)
                if k == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
            }
            ctx.closePath()
        }
        shape(-max(2, r * 0.07)); ctx.setFillColor(CGColor(gray: 0, alpha: 0.4)); ctx.fillPath()
        shape(0); ctx.setFillColor(c.cg()); ctx.fillPath()
    }
    private func tile(_ r: CGRect, _ c: RR, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -3), blur: 7, color: CGColor(gray: 0, alpha: 0.4))
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: min(8, r.width / 2, r.height / 2), cornerHeight: min(8, r.width / 2, r.height / 2), transform: nil))
        ctx.setFillColor(c.cg())
        ctx.fillPath()
        ctx.restoreGState()
    }
    /// A note's name on a slip of cream paper; returns the slip's height.
    private func slip(_ s: String, at p: CGPoint, in ctx: CGContext) {
        let w = Kit.width(s, 50, 0.4) + 52
        tile(CGRect(x: p.x, y: p.y, width: w, height: 84), cream, in: ctx)
        _ = Kit.text(s, 50, 0.4, ink.cg(), at: CGPoint(x: p.x + 26, y: p.y + 27), in: ctx)
    }

    private func ground(_ k: Int, in ctx: CGContext) {
        ctx.setFillColor(sky.cg())
        ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        paper(blob(CGPoint(x: 330, y: 900), 620, 420, key: seed * 7 + k), sky.mix(tones[0], 0.55), lift: 1.6, in: ctx)
        paper(blob(CGPoint(x: 780, y: 620), 500, 350, key: seed * 9 + k), sky.mix(tones[0], 0.9), lift: 1.4, in: ctx)
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        for j in 0..<90 {
            let p = CGPoint(x: lhash(j, seed + k) * W, y: lhash(j, seed + k + 1) * H), r = 1.3 + 2.4 * pow(lhash(j, seed + 3), 3)
            ctx.setFillColor(cream.cg(0.25 + 0.4 * lhash(j, seed + 4)))
            ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2))
        }
        if let mark { ctx.draw(mark, in: CGRect(x: 64, y: H - 108, width: 48, height: 48)) }
        _ = Kit.text("Pinto Notes", 32, 0.4, cream.cg(0.92), at: CGPoint(x: 126, y: H - 96), in: ctx)
    }
    /// The words: what's small above, the line itself, and what follows it.
    private func words(_ over: String, _ lines: [String], slipText: String? = nil, _ under: String? = nil, in ctx: CGContext) {
        var y = 96.0
        if let under { _ = Kit.text(under, 44, 0.1, cream.cg(0.8), at: CGPoint(x: 72, y: y), in: ctx); y += 76 }
        if let slipText { slip(slipText, at: CGPoint(x: 72, y: y), in: ctx); y += 116 }
        for l in lines.reversed() { _ = Kit.text(l, 68, 0.5, cream.cg(), at: CGPoint(x: 72, y: y), in: ctx); y += 84 }
        _ = Kit.text(over, 36, 0.2, cream.cg(0.72), at: CGPoint(x: 72, y: y + 6), in: ctx)
    }
    private func date(_ d: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMMM d"
        return f.string(from: d)
    }
    private static let titles = ["Habits": "Habit tracker", "Work": "Launch plan", "Ideas": "App ideas", "Home": "Flat renovation", "Reading": "Reading list", "Daily": "Daily note"]

    /// Every card this month has something true to say for, in order.
    func cards() -> [(name: String, draw: (CGContext) -> Void)] {
        let s = script.stats, period = s.period
        var out: [(String, (CGContext) -> Void)] = []
        let mid = CGPoint(x: W / 2, y: 830)
        // How it began.
        let brought = input.notes.filter { $0.imported == true }.count
        out.append(("began", { ctx in
            ground(1, in: ctx)
            paper(blob(mid, 300, 270, key: seed + 21), tones[1], in: ctx)
            paper(blob(mid, 200, 180, key: seed + 22), tones[2], lift: 0.6, in: ctx)
            let n = max(1, min(40, brought > 0 ? brought : 2))
            for k in 0..<n {
                let rr = 30 * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963
                star(CGPoint(x: mid.x + cos(a) * rr, y: mid.y + sin(a) * rr), 13, turn: lhash(k, seed) * 1.5, you, in: ctx)
            }
            words("My \(period) in Pinto Notes", ["It began on \(date(script.start))"], brought > 0 ? "with \(brought) notes I brought along" : "with a couple of notes", in: ctx)
        }))
        // The note you kept coming back to.
        if let top = input.notes.max(by: { $0.edits.count < $1.edits.count }), top.edits.count >= 6 {
            out.append(("came-back", { ctx in
                ground(2, in: ctx)
                paper(blob(mid, 290, 270, key: seed + 31), tones[1], in: ctx)
                for (k, e) in top.edits.dropFirst().enumerated() {
                    let a = Double(k) * 2.399963, rr = 150 + 100 * (Double(k) / Double(top.edits.count)).squareRoot(), sz = 9 + 5 * lhash(k, 7)
                    let q = CGPoint(x: mid.x + cos(a) * rr, y: mid.y + sin(a) * rr)
                    ctx.move(to: CGPoint(x: q.x, y: q.y + sz)); ctx.addLine(to: CGPoint(x: q.x + sz * 0.8, y: q.y)); ctx.addLine(to: CGPoint(x: q.x, y: q.y - sz)); ctx.addLine(to: CGPoint(x: q.x - sz * 0.8, y: q.y)); ctx.closePath()
                    ctx.setFillColor((e.ai == nil ? you : ai).cg()); ctx.fillPath()
                }
                let c = top.edits.contains { $0.ai != nil } ? ai : you
                star(mid, 150, points: 12, inner: 0.64, turn: 0.2, c.mix(sky, 0.5), in: ctx)
                star(mid, 128, points: 8, inner: 0.56, turn: 0.5, c.mix(sky, 0.3), in: ctx)
                star(mid, 104, turn: 0.1, c, in: ctx)
                words("The note I kept coming back to", [], slipText: Self.titles[top.folder] ?? "Untitled", "\(top.edits.count) times this month", in: ctx)
            }))
        }
        // The big day: the month as a row of paper, a strip for each day.
        var perDay = [Int](repeating: 0, count: max(1, s.days)), dayFolder: [String: Int] = [:]
        let day0 = cal.startOfDay(for: script.start)
        func index(_ d: Date) -> Int { min(perDay.count - 1, max(0, cal.dateComponents([.day], from: day0, to: cal.startOfDay(for: d)).day ?? 0)) }
        for n in input.notes { for e in n.edits.dropFirst(n.imported == true ? 1 : 0) {
            perDay[index(e.at)] += 1
            if let b = s.busiestDay, cal.isDate(e.at, inSameDayAs: b) { dayFolder[n.folder, default: 0] += 1 }
        } }
        if let big = s.busiestDay, let most = perDay.max(), most >= 4 {
            let into = dayFolder.max { $0.value < $1.value }?.key ?? ""
            out.append(("big-day", { ctx in
                ground(3, in: ctx)
                let left = 90.0, bw = (W - 180) / Double(perDay.count)
                for (k, v) in perDay.enumerated() {
                    let h = 14 + 420 * Double(v) / Double(most)
                    tile(CGRect(x: left + Double(k) * bw + 3, y: 560, width: bw - 6, height: h), k == index(big) ? you : tones[2].mix(cream, 0.15), in: ctx)
                }
                let count = perDay[index(big)]
                words("My big day", [date(big)], "\(count) \(count == 1 ? "edit" : "edits")\(into.isEmpty ? "" : ", most of them in \(into)")", in: ctx)
            }))
        }
        // With the AI.
        if let name = s.ai, s.aiNotes > 0 {
            out.append(("together", { ctx in
                ground(4, in: ctx)
                paper(blob(mid, 330, 280, key: seed + 41), tones[1], in: ctx)
                let n = min(70, s.notes), blue = Int((Double(s.aiNotes) / Double(max(1, s.notes)) * Double(n)).rounded())
                for k in 0..<n {
                    let rr = (n > 40 ? 30 : 42) * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963
                    star(CGPoint(x: mid.x + cos(a) * rr, y: mid.y + sin(a) * rr * 0.85), n > 40 ? 12 : 17, turn: lhash(k, seed) * 1.5, (k * 7 % n) < blue ? ai : you, in: ctx)
                }
                words("\(name) and I", ["wrote in \(s.aiNotes) notes", "together"], "of the \(s.notes) in my notebook", in: ctx)
            }))
        }
        // The days you were there: a square for each day of the month.
        if s.writingDays * 5 >= s.days * 3 {
            out.append(("showed-up", { ctx in
                ground(5, in: ctx)
                let written = Set(input.notes.flatMap { n in n.edits.filter { $0.ai == nil }.map { index($0.at) } })
                let size = 104.0, gap = 18.0, cols = 7, left = (W - Double(cols) * size - Double(cols - 1) * gap) / 2
                for k in 0..<perDay.count {
                    let r = CGRect(x: left + Double(k % cols) * (size + gap), y: 1090 - Double(k / cols) * (size + gap), width: size, height: size)
                    tile(r, written.contains(k) ? you : sky.mix(tones[1], 0.8), in: ctx)
                }
                words("My \(period)", ["I showed up \(s.writingDays) days", "out of \(s.days)"], in: ctx)
            }))
        }
        // It grows and it shrinks.
        let made = input.notes.filter { $0.imported != true }.count
        if s.removed >= 3 {
            out.append(("threw-away", { ctx in
                ground(6, in: ctx)
                paper(blob(CGPoint(x: 400, y: 820), 280, 250, key: seed + 61), tones[1], in: ctx)
                var gone = 0
                for k in 0..<min(made, 40) {
                    let rr = 40 * (Double(k) + 0.5).squareRoot(), a = Double(k) * 2.399963
                    let p = CGPoint(x: 400 + cos(a) * rr, y: 820 + sin(a) * rr)
                    if gone < s.removed, k % 3 != 0 || made - k <= s.removed - gone {
                        // (One that left: a streak up and away.)
                        gone += 1
                        let q = CGPoint(x: 760 + lhash(k, 5) * 240, y: 900 + lhash(k, 6) * 330)
                        ctx.setStrokeColor(cream.cg(0.45)); ctx.setLineWidth(5); ctx.setLineCap(.round)
                        ctx.move(to: CGPoint(x: q.x - 110, y: q.y - 60)); ctx.addLine(to: q); ctx.strokePath()
                        star(q, 13, turn: lhash(k, seed), cream.mix(you, 0.4), in: ctx)
                    } else {
                        star(p, 19, turn: lhash(k, seed) * 1.5, you, in: ctx)
                    }
                }
                words("My \(period)", ["I made \(made) notes", "and threw \(s.removed) away"], in: ctx)
            }))
        }
        return out
    }

    func write(to folder: URL) throws {
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        for (k, card) in cards().enumerated() {
            guard let ctx = Kit.context(Int(W), Int(H)) else { continue }
            card.draw(ctx)
            guard let image = ctx.makeImage(), let dest = CGImageDestinationCreateWithURL(folder.appendingPathComponent("\(k + 1)-\(card.name).png") as CFURL, "public.png" as CFString, 1, nil) else { continue }
            CGImageDestinationAddImage(dest, image, nil)
            CGImageDestinationFinalize(dest)
            print("card \(k + 1): \(card.name)")
        }
    }
}
