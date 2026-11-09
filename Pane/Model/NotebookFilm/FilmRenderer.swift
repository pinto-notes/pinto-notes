import CoreGraphics
import simd
import CoreText
import Foundation

/// Draws the notebook film one frame at a time, in order. The notes find their places as the film
/// runs (a small force layout that carries on from frame to frame), so frames must be drawn first
/// to last; the same script always gives the same film.
/// How the film looks: what it's drawn on and in which colours. You pick one before sharing.
enum FilmLook: String, CaseIterable, Sendable, Codable {
    case night, paper, dusk

    var name: String {
        switch self {
        case .night: "Night"
        case .paper: "Paper"
        case .dusk: "Dusk"
        }
    }

    typealias RGB = FilmRenderer.RGB
    /// The background: top and bottom (the same for a flat one).
    var background: (RGB, RGB) {
        switch self {
        case .night: (RGB(0, 0, 0), RGB(0, 0, 0))
        case .paper: (RGB(1, 1, 1), RGB(1, 1, 1))
        case .dusk: (RGB(0.10, 0.09, 0.24), RGB(0.02, 0.03, 0.09))
        }
    }
    var dark: Bool { self != .paper }
    /// You: the app's accent, deeper on paper.
    var you: RGB { dark ? RGB(0.957, 0.678, 0.200) : RGB(0.85, 0.42, 0.02) }
    var ai: RGB {
        switch self {
        case .night: RGB(0.50, 0.68, 1.0)
        case .paper: RGB(0.18, 0.42, 0.85)
        case .dusk: RGB(0.62, 0.80, 1.0)
        }
    }
    /// Words and lines.
    var ink: RGB { dark ? RGB(1, 1, 1) : RGB(0.11, 0.09, 0.07) }
    var line: RGB { dark ? RGB(0.92, 0.90, 0.86) : RGB(0.25, 0.22, 0.18) }
    /// A note no one has touched in a while fades toward this.
    var cool: RGB { dark ? RGB(0.6, 0.6, 0.6) : RGB(0.72, 0.70, 0.68) }
}

/// The shape the film is drawn in: its height for a width of 1080 (1350 for the shared 4:5
/// film, a phone's own shape to watch it full screen), and room kept clear at the top and bottom
/// for what sits over it (the status bar, buttons), in the same units.
struct FilmCanvas: Sendable, Equatable {
    var height: Double = Double(FilmScript.height)
    var top: Double = 0
    var bottom: Double = 0
    static let shared = FilmCanvas()
    /// A view's own shape, `size` in points with its safe area insets.
    static func fitting(width: Double, height: Double, top: Double, bottom: Double) -> FilmCanvas {
        let u = Double(FilmScript.width) / max(1, width)
        return FilmCanvas(height: height * u, top: top * u, bottom: bottom * u)
    }
}

final class FilmRenderer {
    struct Labels: @unchecked Sendable {
        var look: FilmLook = .night
        /// The app's mark, drawn with its name in the corner the whole way through.
        var markImage: CGImage?
        /// "Me": the person sharing it.
        var you = "Me"
        /// "35 days of notes"
        var title: @Sendable (FilmStats) -> String = { "\($0.days) days of notes" }
        /// "212 notes · written on 28 days"
        var detail: @Sendable (FilmStats) -> String = { "\($0.notes) notes · written on \($0.writingDays) days" }
        /// Folder names over their clusters. Note titles are never shown.
        var folderNames = true
        /// The name for notes in no folder; nil leaves them unnamed.
        var noFolder: String? = nil
        var mark = "Pinto Notes"
        var dateFormat = "MMM d"
        var locale = Locale.current
        var notesCount: @Sendable (Int) -> String = { $0 == 1 ? "1 note" : "\($0) notes" }
    }

    private var look: FilmLook { labels.look }

    struct RGB: Sendable {
        var r, g, b: Double
        init(_ r: Double, _ g: Double, _ b: Double) { self.r = r; self.g = g; self.b = b }
        func mix(_ o: RGB, _ t: Double) -> RGB { RGB(r + (o.r - r) * t, g + (o.g - g) * t, b + (o.b - b) * t) }
        func cg(_ a: Double = 1) -> CGColor { CGColor(srgbRed: r, green: g, blue: b, alpha: a) }
    }

    let script: FilmScript
    let labels: Labels
    /// In film units: 1080 wide, and the canvas's height.
    let width = FilmScript.width
    let height: Int
    let canvas: FilmCanvas
    private(set) var frame = 0

    // Layout, in world units; the camera maps them to pixels.
    private var pos: [SIMD2<Double>]
    private var vel: [SIMD2<Double>]
    private var alive = 0
    /// Each folder's middle: notes gather round it, and folders keep apart.
    private var fpos: [SIMD2<Double>]
    private var fvel: [SIMD2<Double>]
    private var fcount: [Int]
    private var falive: [Bool]
    /// When each folder got its third note: its name fades in from then.
    private var fnamed: [Double]
    private var linksAlive = 0
    private var adjacency: [[Int]]
    private var camScale = 3.0
    private var camCenter = SIMD2<Double>(0, 0)
    /// The whole graph turns slowly, so it's never still: cos and sin of the angle.
    private var spin = SIMD2<Double>(1, 0)
    private var rng: UInt64 = 0x9E37_79B9_7F4A_7C15
    private let youGlow: CGImage
    private let aiGlow: CGImage
    private let dateFormatter: DateFormatter

    init(script: FilmScript, labels: Labels = Labels(), canvas: FilmCanvas = .shared) {
        self.canvas = canvas
        height = Int(canvas.height.rounded())
        self.script = script
        self.labels = labels
        pos = Array(repeating: .zero, count: script.nodes.count)
        vel = Array(repeating: .zero, count: script.nodes.count)
        adjacency = Array(repeating: [], count: script.nodes.count)
        fpos = Array(repeating: .zero, count: script.folders.count)
        fvel = Array(repeating: .zero, count: script.folders.count)
        fcount = Array(repeating: 0, count: script.folders.count)
        falive = Array(repeating: false, count: script.folders.count)
        fnamed = Array(repeating: .infinity, count: script.folders.count)
        for l in script.links { adjacency[l.a].append(l.b); adjacency[l.b].append(l.a) }
        youGlow = Self.glowSprite(labels.look.you, light: labels.look.dark)
        aiGlow = Self.glowSprite(labels.look.ai, light: labels.look.dark)
        dateFormatter = DateFormatter()
        dateFormatter.locale = labels.locale
        dateFormatter.setLocalizedDateFormatFromTemplate(labels.dateFormat)
    }

    static func context(width: Int = FilmScript.width, height: Int = FilmScript.height, data: UnsafeMutableRawPointer? = nil, bytesPerRow: Int = 0) -> CGContext? {
        CGContext(data: data, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
                  space: CGColorSpace(name: CGColorSpace.sRGB)!,
                  bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
    }

    /// Draws the next frame into `ctx`, origin bottom left, scaled to fit its size (the film is
    /// width × height; a smaller context shows it smaller, for playing it in the app).
    func drawNext(in ctx: CGContext) {
        let t = Double(frame) / Double(FilmScript.fps)
        step(to: t)
        ctx.saveGState()
        // One scale both ways: a context of another shape than the canvas would stretch it.
        let k = Double(ctx.width) / Double(width)
        ctx.scaleBy(x: k, y: k)
        draw(t, in: ctx)
        ctx.restoreGState()
        frame += 1
    }

    /// Moves on a frame without drawing it (the layout still settles), to start part way in.
    func skip() {
        step(to: Double(frame) / Double(FilmScript.fps))
        frame += 1
    }

    var isDone: Bool { frame >= FilmScript.frameCount }

    // MARK: Layout

    private func random() -> Double {
        rng &+= 0x9E37_79B9_7F4A_7C15
        var z = rng
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return Double((z ^ (z >> 31)) >> 11) / Double(1 << 53)
    }

    private func jitter(_ r: Double) -> SIMD2<Double> {
        let a = random() * 2 * .pi, d = r * (0.5 + random() * 0.5)
        return SIMD2(cos(a) * d, sin(a) * d)
    }

    private func step(to t: Double) {
        let nodes = script.nodes
        let growT = min(t, FilmScript.growth)
        while alive < nodes.count && nodes[alive].birth <= growT {
            let i = alive
            let f = nodes[i].folder
            if !falive[f] {
                // A new folder starts a little outside what's there.
                var c = SIMD2<Double>(0, 0), r = 0.0, k = 0.0
                for g in fpos.indices where falive[g] { c += fpos[g]; k += 1 }
                if k > 0 {
                    c /= k
                    for j in 0..<i { r = max(r, simd_length(pos[j] - c)) }
                    let a = Double(f) * 2.399963 + random() * 0.5
                    fpos[f] = c + SIMD2(cos(a), sin(a)) * (r + 40)
                }
                falive[f] = true
            }
            pos[i] = fpos[f] + jitter(16)
            fcount[f] += 1
            if fcount[f] == 3 { fnamed[f] = growT }
            vel[i] = .zero
            alive += 1
        }
        while linksAlive < script.links.count && script.links[linksAlive].birth <= growT { linksAlive += 1 }
        // Settle a little more each frame while growing, and gently after.
        let iterations = t <= FilmScript.growth ? 3 : 1
        for _ in 0..<iterations { relax() }
        updateCamera(t)
        let angle = 0.045 * t
        spin = SIMD2(cos(angle), sin(angle))
    }

    private func relax() {
        let n = alive
        guard n > 1 else { return }
        var force = [SIMD2<Double>](repeating: .zero, count: n)
        // Notes push each other apart.
        for i in 0..<n {
            let pi = pos[i]
            for j in (i + 1)..<n {
                var d = pi - pos[j]
                var d2 = d.x * d.x + d.y * d.y
                if d2 > 22_000 { continue }
                if d2 < 0.01 { d = SIMD2(random() - 0.5, random() - 0.5); d2 = 0.25 }
                let f = d * (520 / (d2 * d2.squareRoot()))
                force[i] += f
                force[j] -= f
            }
        }
        // Links pull together.
        for k in 0..<linksAlive {
            let l = script.links[k]
            guard l.a < n, l.b < n else { continue }
            let d = pos[l.b] - pos[l.a]
            let len = max(0.01, simd_length(d))
            let f = d / len * ((len - 30) * 0.02)
            force[l.a] += f
            force[l.b] -= f
        }
        // Notes gather round their folder's middle, which they pull along with them.
        var fforce = [SIMD2<Double>](repeating: .zero, count: fpos.count)
        for i in 0..<n {
            let f = script.nodes[i].folder
            let d = (fpos[f] - pos[i]) * 0.035
            force[i] += d
            fforce[f] -= d * 0.5
        }
        // Folders keep apart by their size, and drift to the middle.
        for a in fpos.indices where falive[a] {
            for b in fpos.indices where b > a && falive[b] {
                var d = fpos[a] - fpos[b]
                let len = max(0.5, simd_length(d))
                if len < 0.6 { d = SIMD2(1, 0) }
                let want = 11 * (Double(fcount[a]).squareRoot() + Double(fcount[b]).squareRoot()) + 34
                if len < want {
                    let push = d / len * ((want - len) * 0.06)
                    fforce[a] += push
                    fforce[b] -= push
                }
            }
            fforce[a] -= fpos[a] * 0.006
        }
        for f in fpos.indices where falive[f] {
            var v = (fvel[f] + fforce[f]) * 0.6
            let s = simd_length(v)
            if s > 4 { v *= 4 / s }
            fvel[f] = v
            fpos[f] += v
        }
        for i in 0..<n {
            var v = (vel[i] + force[i]) * 0.55
            let s = simd_length(v)
            if s > 6 { v *= 6 / s }
            vel[i] = v
            pos[i] += v
        }
    }

    /// The graph fills the upper part of the frame, leaving room for the words below.
    private var graphBox: CGRect {
        let bottom = 300 + canvas.bottom, top = 130 + canvas.top
        return CGRect(x: 70, y: bottom, width: Double(width) - 140, height: max(200, Double(height) - bottom - top))
    }

    private func updateCamera(_ t: Double) {
        guard alive > 0 else { return }
        var lo = pos[0], hi = pos[0]
        for i in 0..<alive { lo = simd_min(lo, pos[i]); hi = simd_max(hi, pos[i]) }
        let pad = 18.0
        let w = hi.x - lo.x + pad * 2, h = hi.y - lo.y + pad * 2
        let box = graphBox
        var target = min(box.width / w, box.height / h, 5.0)
        if t > FilmScript.growth { target *= 1 - 0.05 * min(1, (t - FilmScript.growth) / FilmScript.outro) }
        let c = (lo + hi) / 2
        // Zooming out keeps up quickly so nothing leaves the frame; zooming in is slow.
        let k = target < camScale ? 0.25 : 0.06
        if frame == 0 { camScale = target; camCenter = c }
        camScale += (target - camScale) * k
        camCenter += (c - camCenter) * 0.15
    }

    private func screen(_ p: SIMD2<Double>) -> CGPoint {
        let box = graphBox
        let d = (p - camCenter) * camScale
        return CGPoint(x: box.midX + d.x * spin.x - d.y * spin.y, y: box.midY + d.x * spin.y + d.y * spin.x)
    }

    // MARK: Drawing

    private func draw(_ t: Double, in ctx: CGContext) {
        let full = CGRect(x: 0, y: 0, width: width, height: height)
        ctx.setBlendMode(.normal)
        let (top, bottom) = look.background
        if let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [bottom.cg(), top.cg()] as CFArray, locations: [0, 1]) {
            ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: height), options: [])
        } else {
            ctx.setFillColor(top.cg())
            ctx.fill(full)
        }

        let gt = min(t, FilmScript.growth)
        let lineScale = min(1.6, max(0.9, camScale / 2.2))

        // Links: settled ones in one path, new ones drawn growing out with a brighter line.
        ctx.setLineCap(.round)
        let settled = CGMutablePath()
        for k in 0..<linksAlive {
            let l = script.links[k]
            let p = (gt - l.birth) / 0.45
            let a = screen(pos[l.a]), b = screen(pos[l.b])
            if p >= 1 { settled.move(to: a); settled.addLine(to: b); continue }
            let e = 1 - pow(1 - max(0, p), 3)
            ctx.setStrokeColor(look.line.cg(0.24 + 0.55 * (1 - e)))
            ctx.setLineWidth(1.5 * lineScale)
            ctx.move(to: a)
            ctx.addLine(to: CGPoint(x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e))
            ctx.strokePath()
        }
        ctx.setStrokeColor(look.line.cg(0.34))
        ctx.setLineWidth(1.3 * lineScale)
        ctx.addPath(settled)
        ctx.strokePath()
        // Each note to its folder's middle, faintly: the shape a folder makes even when nothing links.
        let spokes = CGMutablePath()
        for i in 0..<alive {
            let f = script.nodes[i].folder
            guard script.folders[f] != "" || labels.noFolder != nil else { continue }
            spokes.move(to: screen(fpos[f]))
            spokes.addLine(to: screen(pos[i]))
        }
        ctx.setStrokeColor(look.line.cg(look.dark ? 0.09 : 0.12))
        ctx.setLineWidth(1.0 * lineScale)
        ctx.addPath(spokes)
        ctx.strokePath()

        // Glow: added light on light in the dark looks, a soft wash on paper.
        var cores: [(CGPoint, Double, RGB, Double)] = []
        ctx.setBlendMode(look.dark ? .plusLighter : .normal)
        let wash = look.dark ? 1.0 : 0.5
        let breathe = t > FilmScript.growth ? 0.5 + 0.5 * sin((t - FilmScript.growth) * 2.2) : 0
        for i in 0..<alive {
            let n = script.nodes[i]
            var count = 0, aiCount = 0, you = 0.0, ai = 0.0, last = n.birth
            for (k, et) in n.edits.enumerated() {
                if et > gt { break }
                count += 1
                last = et
                if n.aiEdits[k] { aiCount += 1 }
                let age = gt - et
                if age < 1.4 && t <= FilmScript.growth + 0.6 {
                    let a = exp(-age / 0.32)
                    if n.aiEdits[k] { ai += a } else { you += a }
                }
            }
            let born = gt - n.birth
            let pop = born < 0.4 ? 1 - pow(1 - born / 0.4, 3) : 1
            if born < 1 { if n.bornByAI { ai += exp(-born / 0.4) * 1.5 } else { you += exp(-born / 0.4) * 1.5 } }
            let share = count == 0 ? (n.bornByAI ? 1 : 0) : Double(aiCount) / Double(count)
            let color = look.you.mix(look.ai, share)
            // Notes you keep working on grow, and glow while you're on them; the rest cool down.
            let heat = exp(-(gt - last) / 1.3)
            let r = min(20, max(2.8, (1.5 + 0.95 * Double(count).squareRoot()) * camScale * 0.6)) * pop
            // At the end a wave of light runs through the notes in the order they were made.
            if t > FilmScript.growth + 0.1 {
                let w = (t - FilmScript.growth - 0.1) / 1.6 - Double(i) / Double(max(1, alive))
                if w > 0 && w < 0.5 { let a = sin(w / 0.5 * .pi) * 0.55; if n.bornByAI { ai += a } else { you += a } }
            }
            let p = screen(pos[i])
            // Resting glow in the note's own colour, split between the two sprites.
            let rest = 0.2 + 0.36 * heat + 0.06 * breathe
            sprite(youGlow, at: p, radius: r * 4, alpha: wash * rest * (1 - share), in: ctx)
            sprite(aiGlow, at: p, radius: r * 4, alpha: wash * rest * share, in: ctx)
            // A flash where someone just wrote.
            if you > 0.01 { sprite(youGlow, at: p, radius: r * (3.4 + 6 * min(1.4, you)), alpha: wash * min(1, 0.75 * you), in: ctx) }
            if ai > 0.01 { sprite(aiGlow, at: p, radius: r * (3.4 + 6 * min(1.4, ai)), alpha: wash * min(1, 0.75 * ai), in: ctx) }
            cores.append((p, r, color.mix(look.cool, (look.dark ? 0.3 : 0.45) * (1 - heat)), min(1, you + ai)))
        }
        ctx.setBlendMode(.normal)
        for (p, r, color, flash) in cores {
            ctx.setFillColor((look.dark ? color.mix(RGB(1, 1, 1), 0.35 + 0.45 * flash) : color.mix(look.ink, 0.08)).cg())
            ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2))
        }

        if labels.folderNames { drawFolderNames(t, in: ctx) }
        drawMark(in: ctx)
        drawWords(t, in: ctx)
    }

    /// Each folder's name just over its notes, once it has a few.
    private func drawFolderNames(_ t: Double, in ctx: CGContext) {
        for f in fpos.indices where falive[f] && fcount[f] >= 3 {
            guard let name = script.folders[f].isEmpty ? labels.noFolder : script.folders[f] else { continue }
            let c = screen(fpos[f])
            var top = c.y
            for i in 0..<alive where script.nodes[i].folder == f { top = max(top, screen(pos[i]).y) }
            let appear = smooth((min(t, FilmScript.growth) - fnamed[f]) / 0.5)
            text(name, size: 25, weight: .medium, color: look.ink.cg((look.dark ? 0.66 : 0.6) * appear), at: CGPoint(x: c.x, y: top + 16), align: 0.5, in: ctx)
        }
    }

    private func sprite(_ image: CGImage, at p: CGPoint, radius: Double, alpha: Double, in ctx: CGContext) {
        guard alpha > 0.004 else { return }
        ctx.setAlpha(alpha)
        ctx.draw(image, in: CGRect(x: p.x - radius, y: p.y - radius, width: radius * 2, height: radius * 2))
        ctx.setAlpha(1)
    }

    /// The app's mark and name, top left, the whole way through: a picture taken from the middle
    /// still says where it's from.
    private func drawMark(in ctx: CGContext) {
        var x = 64.0
        let y = Double(height) - 96 - canvas.top
        if let m = labels.markImage {
            let size = 44.0
            let rect = CGRect(x: x, y: y - 12, width: size, height: size)
            ctx.saveGState()
            ctx.addPath(CGPath(roundedRect: rect, cornerWidth: size * 0.2237, cornerHeight: size * 0.2237, transform: nil))
            ctx.clip()
            ctx.draw(m, in: rect)
            ctx.restoreGState()
            x += size + 14
        }
        text(labels.mark, size: 30, weight: .semibold, color: look.ink.cg(look.dark ? 0.85 : 0.8), at: CGPoint(x: x, y: y), in: ctx)
    }

    private func drawWords(_ t: Double, in ctx: CGContext) {
        let outroIn = smooth((t - FilmScript.growth - 0.25) / 0.7)
        let running = 1 - smooth((t - FilmScript.growth) / 0.4)
        let side = 72.0
        let base = canvas.bottom

        if running > 0 {
            let date = script.date(at: min(t, FilmScript.growth))
            text(dateFormatter.string(from: date), size: 34, weight: .medium, color: look.ink.cg(0.62 * running), at: CGPoint(x: side, y: base + 150), in: ctx)
            text(labels.notesCount(alive), size: 34, weight: .medium, color: look.ink.cg(0.62 * running), at: CGPoint(x: Double(width) - side, y: base + 150), align: 1, in: ctx)
        }
        guard outroIn > 0 else { return }
        let rise = (1 - outroIn) * 14
        let s = script.stats
        text(labels.title(s), size: 60, weight: .semibold, color: look.ink.cg(outroIn), at: CGPoint(x: side, y: base + 196 - rise), in: ctx)
        text(labels.detail(s), size: 34, weight: .regular, color: look.ink.cg(0.62 * outroIn), at: CGPoint(x: side, y: base + 140 - rise), in: ctx)
        // Who wrote: you, and your AI if one did.
        var x = side
        let y = base + 76 - rise
        for (name, color) in [(labels.you, look.you)] + (s.ai.map { [($0, look.ai)] } ?? []) {
            ctx.setFillColor(color.cg(outroIn))
            ctx.fillEllipse(in: CGRect(x: x, y: y + 2, width: 18, height: 18))
            x += 30
            x += text(name, size: 30, weight: .regular, color: look.ink.cg(0.62 * outroIn), at: CGPoint(x: x, y: y), in: ctx) + 36
        }
    }

    private func smooth(_ x: Double) -> Double { let c = min(1, max(0, x)); return c * c * (3 - 2 * c) }

    /// Draws one line of text with its baseline at `p`; align 0 left, 1 right. Returns its width.
    @discardableResult
    private func text(_ s: String, size: Double, weight: FontWeight, color: CGColor, at p: CGPoint, align: Double = 0, in ctx: CGContext) -> Double {
        let font = font(size, weight)
        let attr = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font,
                                                             NSAttributedString.Key(kCTForegroundColorAttributeName as String): color])
        let line = CTLineCreateWithAttributedString(attr)
        let w = CTLineGetTypographicBounds(line, nil, nil, nil)
        ctx.textPosition = CGPoint(x: p.x - w * align, y: p.y)
        CTLineDraw(line, ctx)
        return w
    }

    enum FontWeight { case regular, medium, semibold }

    private var fonts: [String: CTFont] = [:]
    private func font(_ size: Double, _ weight: FontWeight) -> CTFont {
        let key = "\(size)-\(weight)"
        if let f = fonts[key] { return f }
        let base = CTFontCreateUIFontForLanguage(.system, size, nil)!
        let w: CGFloat = switch weight { case .regular: 0; case .medium: 0.23; case .semibold: 0.3 }
        let desc = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base),
            [kCTFontTraitsAttribute: [kCTFontWeightTrait: w]] as CFDictionary)
        let f = CTFontCreateWithFontDescriptor(desc, size, nil)
        fonts[key] = f
        return f
    }

    /// A soft round light, brightest in the middle.
    private static func glowSprite(_ c: RGB, light: Bool) -> CGImage {
        let n = 96
        let ctx = context(width: n, height: n)!
        let core = light ? c.mix(RGB(1, 1, 1), 0.25) : c
        let colors = [core.cg(1), c.cg(0.45), c.cg(0.14), c.cg(0.04), c.cg(0)] as CFArray
        let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: colors, locations: [0, 0.18, 0.42, 0.7, 1])!
        let m = CGPoint(x: Double(n) / 2, y: Double(n) / 2)
        ctx.drawRadialGradient(g, startCenter: m, startRadius: 0, endCenter: m, endRadius: Double(n) / 2, options: [])
        return ctx.makeImage()!
    }
}
