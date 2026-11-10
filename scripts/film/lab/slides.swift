import CoreGraphics
import Foundation
import ImageIO

// Pilot: the intro and the slides that could carry the month before the film, each with one strong
// thing on it. Two palettes: night (the film's own paper sky) and day (a bold paper colour a slide).

private typealias C = FilmRenderer.RGB

struct Slides {
    let input: FilmInput
    let script: FilmScript
    let seed: Int
    let mark: CGImage?
    /// A phone's shape, 1080 wide, with what the screen keeps at its top and bottom.
    var H = 2348.0, top = 150.0, bottom = 190.0
    let W = 1080.0
    private let cal = Calendar(identifier: .gregorian)

    fileprivate struct Palette { var bg: C; var tones: [C]; var ink: C; var you: C; var ai: C; var night: Bool }

    private func palette(_ k: Int, night: Bool) -> Palette {
        if night {
            let sky = GalaxyScene.skies[(seed / 3 + seed) % GalaxyScene.skies.count]
            return Palette(bg: C(sky.0), tones: sky.1.map { C($0) }, ink: C(0xFFF4E6), you: C(0xFFC45A), ai: C(0x8FC4FF), night: true)
        }
        switch k {
        case 0: return Palette(bg: C(0xFFAE34), tones: [C(0xFFBD55), C(0xFFCD7C), C(0xFFDEA6), C(0xFFEFD2)], ink: C(0x1E1B4B), you: C(0xFFF6E8), ai: C(0x2F6FD6), night: false)
        case 1: return Palette(bg: C(0xFFF0DC), tones: [C(0xF8E0BE), C(0xF1CE9E), C(0xE9BC80), C(0xE0A964)], ink: C(0x1E1B4B), you: C(0xF0901A), ai: C(0x2F6FD6), night: false)
        case 2: return Palette(bg: C(0x2A4BCB), tones: [C(0x3659D6), C(0x4A6EE0), C(0x6787E8), C(0x98B0F1)], ink: C(0xFFF6E8), you: C(0xFFC45A), ai: C(0xBFE0FF), night: false)
        default: return Palette(bg: C(0xFFE15A), tones: [C(0xFFE878), C(0xFFEE98), C(0xFFF4BA), C(0xFFF9DC)], ink: C(0x1E1B4B), you: C(0xE07A00), ai: C(0x2F6FD6), night: false)
        }
    }

    // MARK: Paper

    private func blob(_ c: CGPoint, _ rx: Double, _ ry: Double, key: Int) -> [CGPoint] {
        (0..<90).map { k in
            let a = Double(k) / 90 * 2 * .pi
            let w1: Double = 0.08 * sin(3 * a + filmHash(key, 1) * 6)
            let w2: Double = 0.05 * sin(5 * a + filmHash(key, 2) * 6) + 0.03 * sin(9 * a + filmHash(key, 3) * 6)
            let wob = 1 + w1 + w2
            return CGPoint(x: c.x + cos(a) * rx * wob, y: c.y + sin(a) * ry * wob)
        }
    }
    private func paper(_ pts: [CGPoint], _ c: C, lift: Double = 1, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -6 * lift), blur: 14 * lift, color: CGColor(gray: 0, alpha: 0.38))
        ctx.addLines(between: pts); ctx.closePath()
        ctx.setFillColor(c.cg()); ctx.fillPath()
        ctx.restoreGState()
    }
    private func circle(_ p: CGPoint, _ r: Double, _ c: C, lift: Double = 1, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -6 * lift), blur: 14 * lift, color: CGColor(gray: 0, alpha: 0.38))
        ctx.setFillColor(c.cg()); ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r))
        ctx.restoreGState()
    }
    private func star(_ p: CGPoint, _ r: Double, points: Int = 4, inner: Double = 0.4, turn: Double = 0, _ c: C, shadow: Double = 0.4, in ctx: CGContext) {
        func shape(_ dy: Double) {
            for k in 0..<(points * 2) {
                let a = turn + Double(k) * .pi / Double(points), d = k % 2 == 0 ? r : r * inner
                let q = CGPoint(x: p.x + cos(a) * d, y: p.y + sin(a) * d + dy)
                if k == 0 { ctx.move(to: q) } else { ctx.addLine(to: q) }
            }
            ctx.closePath()
        }
        if shadow > 0 { shape(-max(2, r * 0.07)); ctx.setFillColor(CGColor(gray: 0, alpha: shadow)); ctx.fillPath() }
        shape(0); ctx.setFillColor(c.cg()); ctx.fillPath()
    }
    private func bigStar(_ p: CGPoint, _ r: Double, _ c: C, behind: C, in ctx: CGContext) {
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -10), blur: 24, color: CGColor(gray: 0, alpha: 0.4))
        star(p, r * 1.45, points: 12, inner: 0.64, turn: 0.2, c.mix(behind, 0.55), shadow: 0, in: ctx)
        ctx.restoreGState()
        star(p, r * 1.22, points: 8, inner: 0.56, turn: 0.5, c.mix(behind, 0.3), in: ctx)
        star(p, r, turn: 0.1, c, in: ctx)
    }
    private func slip(_ s: String, _ size: Double, center: CGPoint, _ fill: C, _ ink: C, in ctx: CGContext) {
        let w = FilmKit.width(s, size, 0.55) + size * 1.1, h = size * 1.7
        let r = CGRect(x: center.x - w / 2, y: center.y - h / 2, width: w, height: h)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: -5), blur: 12, color: CGColor(gray: 0, alpha: 0.4))
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: 12, cornerHeight: 12, transform: nil))
        ctx.setFillColor(fill.cg()); ctx.fillPath()
        ctx.restoreGState()
        FilmKit.text(s, size, 0.55, ink.cg(), at: CGPoint(x: center.x, y: center.y - size * 0.34), align: 0.5, in: ctx)
    }

    private func ground(_ k: Int, _ p: Palette, in ctx: CGContext) {
        ctx.setFillColor(p.bg.cg()); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
        paper(blob(CGPoint(x: 260, y: H * 0.36), 700, 620, key: seed * 7 + k), p.bg.mix(p.tones[0], 0.6), lift: 1.8, in: ctx)
        paper(blob(CGPoint(x: 860, y: H * 0.7), 560, 520, key: seed * 9 + k), p.bg.mix(p.tones[0], 0.95), lift: 1.5, in: ctx)
        ctx.draw(FilmKit.speckle, in: CGRect(x: 0, y: 0, width: 256, height: 256), byTiling: true)
        if p.night {
            for j in 0..<140 {
                let q = CGPoint(x: filmHash(j, seed + k) * W, y: filmHash(j, seed + k + 1) * H), r = 1.3 + 2.4 * pow(filmHash(j, seed + 3), 3)
                ctx.setFillColor(p.ink.cg(0.2 + 0.4 * filmHash(j, seed + 4)))
                ctx.fillEllipse(in: CGRect(x: q.x - r, y: q.y - r, width: r * 2, height: r * 2))
            }
        }
        if let mark { ctx.draw(mark, in: CGRect(x: 64, y: H - top - 70, width: 52, height: 52)) }
        FilmKit.text("Pinto Notes", 34, 0.45, p.ink.cg(0.92), at: CGPoint(x: 130, y: H - top - 56), in: ctx)
    }

    // MARK: The slides

    private var stats: FilmStats { script.stats }
    private func ownEdits() -> [FilmEdit] {
        input.notes.flatMap { n in n.edits.dropFirst(n.imported == true ? 1 : 0).filter { $0.ai == nil } }
    }
    private func short(_ d: Date) -> String {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_US"); f.calendar = cal; f.dateFormat = "MMM d"
        return f.string(from: d)
    }
    private func hourName(_ h: Int) -> String {
        let h = (h % 24 + 24) % 24
        return h == 0 ? "midnight" : h == 12 ? "noon" : h < 12 ? "\(h) am" : "\(h - 12) pm"
    }

    func slides(night: Bool) -> [(String, (CGContext) -> Void)] {
        var out: [(String, (CGContext) -> Void)] = []
        let s = stats
        // The intro: what this is, and the one bright star it starts from.
        out.append(("intro", { ctx in
            let p = palette(0, night: night)
            ground(0, p, in: ctx)
            let c = CGPoint(x: W / 2, y: H * 0.64)
            paper(blob(c, 380, 360, key: seed + 1), p.tones[1], lift: 1.4, in: ctx)
            paper(blob(c, 270, 255, key: seed + 2), p.tones[2], lift: 1.1, in: ctx)
            paper(blob(c, 160, 150, key: seed + 3), p.tones[3], lift: 0.8, in: ctx)
            for j in 0..<22 {
                let a = filmHash(j, 41) * 2 * .pi, d = 120 + filmHash(j, 42) * 230
                star(CGPoint(x: c.x + cos(a) * d, y: c.y + sin(a) * d * 0.95), 7 + 5 * filmHash(j, 43), turn: filmHash(j, 44), p.ink.mix(p.tones[1], 0.55), shadow: 0.2, in: ctx)
            }
            bigStar(c, 74, night ? p.you : C(0xFFF6E8), behind: p.tones[3], in: ctx)
            let months = s.months
            let y = bottom + 120
            FilmKit.text("\(short(script.start)) to \(short(input.now))", 40, 0.2, p.ink.cg(0.75), at: CGPoint(x: 72, y: y), in: ctx)
            FilmKit.text("in Pinto Notes", 66, 0.45, p.ink.cg(), at: CGPoint(x: 72, y: y + 92), in: ctx)
            FilmKit.text(months == 1 ? "month" : "\(months) months", 178, 0.8, p.ink.cg(), at: CGPoint(x: 66, y: y + 240), in: ctx)
            FilmKit.text("My first", 178, 0.8, p.ink.cg(), at: CGPoint(x: 66, y: y + 410), in: ctx)
        }))
        // Your top notes: the brightest stars, by name.
        let ranked = input.notes.filter { $0.removed == nil }.sorted { $0.edits.count > $1.edits.count }.prefix(5)
        if let first = ranked.first, first.edits.count >= 6 {
            out.append(("top-notes", { ctx in
                let p = palette(1, night: night)
                ground(1, p, in: ctx)
                FilmKit.text("My top notes", 112, 0.8, p.ink.cg(), at: CGPoint(x: 66, y: H - top - 230), in: ctx)
                FilmKit.text("the ones I kept coming back to", 40, 0.2, p.ink.cg(0.72), at: CGPoint(x: 72, y: H - top - 300), in: ctx)
                let c = CGPoint(x: W / 2, y: H * 0.52)
                let aiShare = Double(first.edits.filter { $0.ai != nil }.count) / Double(first.edits.count)
                bigStar(c, 190, aiShare > 0.5 ? p.ai : p.you, behind: p.bg, in: ctx)
                FilmKit.text("1", 150, 0.85, p.bg.cg(), at: CGPoint(x: c.x, y: c.y - 52), align: 0.5, in: ctx)
                slip(name(first), 64, center: CGPoint(x: W / 2, y: c.y - 340), night ? C(0xFFF4E6) : p.ink, night ? C(0x2A1D10) : p.bg, in: ctx)
                FilmKit.text("\(first.edits.count) times this month", 42, 0.3, p.ink.cg(0.8), at: CGPoint(x: W / 2, y: c.y - 460), align: 0.5, in: ctx)
                let most = Double(first.edits.count)
                for (i, n) in ranked.dropFirst().enumerated() {
                    let y = bottom + 360 - Double(i) * 96
                    FilmKit.text("\(i + 2)", 54, 0.8, p.ink.cg(0.6), at: CGPoint(x: 72, y: y), in: ctx)
                    star(CGPoint(x: 172, y: y + 19), 14 + 18 * Double(n.edits.count) / most, turn: filmHash(i, 9), p.you, in: ctx)
                    FilmKit.text(name(n), 54, 0.55, p.ink.cg(), at: CGPoint(x: 220, y: y), in: ctx)
                    FilmKit.text("\(n.edits.count)", 46, 0.3, p.ink.cg(0.65), at: CGPoint(x: W - 72, y: y), align: 1, in: ctx)
                }
            }))
        }
        // When you write: a day as a paper dial, and what that makes you.
        let own = ownEdits()
        var byHour = [Int](repeating: 0, count: 24)
        for e in own { byHour[cal.component(.hour, from: e.at)] += 1 }
        func window(_ h: Int) -> Int { byHour[h % 24] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24] }
        let start: Int = (0..<24).max { window($0) < window($1) } ?? 0
        let mid = (start + 1) % 24
        let kind = (5..<9).contains(mid) ? ["an early", "bird"] : (9..<12).contains(mid) ? ["a morning", "writer"] : (12..<17).contains(mid) ? ["an afternoon", "writer"] : (17..<21).contains(mid) ? ["an evening", "writer"] : ["a night", "owl"]
        let dark = !(5..<17).contains(mid)
        if own.count >= 20 {
            out.append(("when", { ctx in
                let p = palette(2, night: night)
                ground(2, p, in: ctx)
                let c = CGPoint(x: W / 2, y: H * 0.6), R = 400.0
                circle(c, R, p.tones[1], lift: 1.6, in: ctx)
                // The hours you write most in: a wedge of paper.
                func angle(_ h: Double) -> Double { .pi / 2 - h / 24 * 2 * .pi }
                ctx.saveGState()
                ctx.setShadow(offset: CGSize(width: 0, height: -5), blur: 12, color: CGColor(gray: 0, alpha: 0.35))
                ctx.move(to: c)
                ctx.addArc(center: c, radius: R - 24, startAngle: angle(Double(start)), endAngle: angle(Double(start) + 3), clockwise: true)
                ctx.closePath(); ctx.setFillColor(p.you.mix(p.tones[1], 0.25).cg()); ctx.fillPath()
                ctx.restoreGState()
                // Every time you wrote, a star at its hour.
                let step = max(1, own.count / 360)
                for (j, e) in own.enumerated() where j % step == 0 {
                    let comp = cal.dateComponents([.hour, .minute], from: e.at)
                    let h = Double(comp.hour ?? 0) + Double(comp.minute ?? 0) / 60
                    let d = 150 + filmHash(j, 51) * (R - 200)
                    let a = angle(h)
                    star(CGPoint(x: c.x + cos(a) * d, y: c.y + sin(a) * d), 9 + 4 * filmHash(j, 52), turn: filmHash(j, 53), p.ink, shadow: 0.3, in: ctx)
                }
                for (h, label) in [(0, "midnight"), (6, "6 am"), (12, "noon"), (18, "6 pm")] {
                    let a = angle(Double(h)), q = CGPoint(x: c.x + cos(a) * (R + 58), y: c.y + sin(a) * (R + 58) - 14)
                    FilmKit.text(label, 36, 0.4, p.ink.cg(0.75), at: q, align: h == 6 ? 0.25 : h == 18 ? 0.75 : 0.5, in: ctx)
                }
                // The sun or the moon in the middle.
                if dark {
                    circle(c, 110, C(0xFFF4E6), lift: 1, in: ctx)
                    ctx.setFillColor(p.tones[1].cg()); ctx.fillEllipse(in: CGRect(x: c.x - 110 + 52, y: c.y - 110 + 30, width: 220, height: 220))
                } else {
                    for k in 0..<12 {
                        let a = Double(k) * .pi / 6, w = 0.13
                        ctx.move(to: CGPoint(x: c.x + cos(a - w) * 120, y: c.y + sin(a - w) * 120))
                        ctx.addLine(to: CGPoint(x: c.x + cos(a) * 175, y: c.y + sin(a) * 175))
                        ctx.addLine(to: CGPoint(x: c.x + cos(a + w) * 120, y: c.y + sin(a + w) * 120))
                        ctx.closePath(); ctx.setFillColor(p.you.cg()); ctx.fillPath()
                    }
                    circle(c, 110, p.you, lift: 1, in: ctx)
                }
                let y = bottom + 120
                FilmKit.text("Most of it between \(hourName(start)) and \(hourName(start + 3))", 40, 0.25, p.ink.cg(0.8), at: CGPoint(x: 72, y: y), in: ctx)
                FilmKit.text(kind[1], 170, 0.8, p.ink.cg(), at: CGPoint(x: 66, y: y + 110), in: ctx)
                FilmKit.text("I'm \(kind[0])", 110, 0.75, p.ink.cg(), at: CGPoint(x: 66, y: y + 280), in: ctx)
            }))
        }
        // You and your AI: a ring of a hundred stars, one for each part in a hundred.
        if let ai = s.ai, s.aiShare > 0.03 {
            let pct = Int((s.aiShare * 100).rounded())
            out.append(("with-ai", { ctx in
                let p = palette(3, night: night)
                ground(3, p, in: ctx)
                let c = CGPoint(x: W / 2, y: H * 0.58), R = 380.0
                for k in 0..<100 {
                    let a = .pi / 2 - Double(k) / 100 * 2 * .pi
                    star(CGPoint(x: c.x + cos(a) * R, y: c.y + sin(a) * R), 17, turn: a, k < pct ? p.ai : p.you, in: ctx)
                }
                FilmKit.text("\(pct)%", 300, 0.85, p.ink.cg(), at: CGPoint(x: c.x, y: c.y - 100), align: 0.5, in: ctx)
                FilmKit.text("of the writing was \(ai)'s", 38, 0.5, p.ai.cg(), at: CGPoint(x: c.x, y: c.y - 180), align: 0.5, in: ctx)
                let y = bottom + 120
                FilmKit.text("in \(s.aiNotes) of my \(s.notes) notes", 42, 0.25, p.ink.cg(0.8), at: CGPoint(x: 72, y: y), in: ctx)
                FilmKit.text("writing together", 110, 0.75, p.ink.cg(), at: CGPoint(x: 66, y: y + 110), in: ctx)
                FilmKit.text("\(ai) and I,", 110, 0.75, p.ink.cg(), at: CGPoint(x: 66, y: y + 240), in: ctx)
            }))
        }
        return out
    }

    private func name(_ n: FilmNote) -> String { Slides.demoNames(input)[n.id] ?? n.folder }

    /// Made-up names for the demo's notes, in the order each folder's were made.
    static func demoNames(_ input: FilmInput) -> [UUID: String] {
        let lists: [String: [String]] = [
            "Work": ["Launch plan", "Standup notes", "Q4 goals", "Hiring plan", "Pricing", "Offsite", "Roadmap", "1:1 notes", "Customer calls", "Team wiki", "Sprint review", "Interview notes", "OKRs", "Board update", "Competitors"],
            "Ideas": ["App ideas", "Side project", "Gift ideas", "Blog drafts", "Startup ideas", "Talk ideas", "Names", "Shower thoughts", "Newsletter", "Game idea"],
            "Home": ["Flat renovation", "Groceries", "Meal plan", "Budget", "Holiday plans", "Wedding", "Garden", "Car", "Packing list", "Recipes"],
            "Reading": ["Reading list", "Notes on Deep Work", "Podcast notes", "Quotes", "Atomic Habits", "Articles to read", "Film list"],
            "Habits": ["Evening tracker"], "Daily": ["Daily note"],
        ]
        let pool = ["Prompt library", "Customer personas", "API notes", "Pricing research", "Onboarding ideas", "Writing style", "Brand voice", "Product principles", "Competitor teardown", "Interview questions", "Glossary", "Decision log", "Meeting template", "Investor list", "Feature requests", "Bug triage", "Release checklist", "User quotes", "Market sizing", "SEO keywords", "Content calendar", "Design system", "Research log", "Reading highlights", "Course notes", "Project brief", "Lessons learned", "Hiring rubric", "Sales script"]
        // (The most written in get names first, so the top of the list never repeats one.)
        var seen: [String: Int] = [:], out: [UUID: String] = [:], spare = 0
        for n in input.notes.sorted(by: { $0.edits.count > $1.edits.count }) {
            let k = seen[n.folder, default: 0]; seen[n.folder] = k + 1
            let l = lists[n.folder] ?? []
            if k < l.count { out[n.id] = l[k]; continue }
            out[n.id] = spare < pool.count ? pool[spare] : "Note \(spare + 1)"
            spare += 1
        }
        return out
    }

    func write(to folder: URL) throws {
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        for night in [true, false] {
            for (k, slide) in slides(night: night).enumerated() {
                guard let ctx = FilmRenderer.context(width: Int(W), height: Int(H)) else { continue }
                slide.1(ctx)
                guard let image = ctx.makeImage(),
                      let dest = CGImageDestinationCreateWithURL(folder.appendingPathComponent("\(night ? "night" : "day")-\(k + 1)-\(slide.0).png") as CFURL, "public.png" as CFString, 1, nil) else { continue }
                CGImageDestinationAddImage(dest, image, nil)
                CGImageDestinationFinalize(dest)
            }
        }
    }
}
