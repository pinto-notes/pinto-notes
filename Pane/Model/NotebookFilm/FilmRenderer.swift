import CoreGraphics
import simd
import CoreText
import Foundation

/// Draws the notebook film one frame at a time, in order. The notes find their places as the film
/// runs (a small force layout that carries on from frame to frame), so frames must be drawn first
/// to last; the same script always gives the same film.
/// How the film looks: what it's drawn on and in which colours. You pick one before sharing.
enum FilmLook: String, CaseIterable, Sendable, Codable {
    /// Town first: it's the one in Pinto's own cut-paper world, and what a new film opens in.
    case town, night, paper

    var name: String {
        switch self {
        case .town: "Town"
        case .night: "Night"
        case .paper: "Paper"
        }
    }

    typealias RGB = FilmRenderer.RGB
    /// The background: top and bottom (the same for a flat one).
    var background: (RGB, RGB) {
        switch self {
        case .town: (RGB(0.04, 0.07, 0.07), RGB(0.04, 0.07, 0.07))
        case .night: (RGB(0, 0, 0), RGB(0, 0, 0))
        case .paper: (RGB(0.985, 0.98, 0.968), RGB(0.985, 0.98, 0.968))
        }
    }
    var dark: Bool { self != .paper }
    /// Draws a whole paper scene each frame: played in the app a little smaller, to keep its pace.
    var scenic: Bool { self == .town }
    /// You: the app's accent, deeper on paper.
    var you: RGB { dark ? RGB(0.957, 0.678, 0.200) : RGB(0.85, 0.42, 0.02) }
    var ai: RGB {
        switch self {
        case .town: RGB(0.56, 0.78, 1.0)
        case .night: RGB(0.50, 0.68, 1.0)
        case .paper: RGB(0.18, 0.42, 0.85)
        }
    }
    /// Words and lines.
    var ink: RGB { dark ? RGB(1, 1, 1) : RGB(0.11, 0.09, 0.07) }
    var line: RGB { dark ? RGB(0.92, 0.90, 0.86) : RGB(0.25, 0.22, 0.18) }
    /// A note no one has touched in a while fades toward this.
    /// It keeps its own colour, dimmer: never a grey that means nothing.
    var cool: RGB {
        switch self {
        case .town, .night: RGB(0, 0, 0)
        case .paper: RGB(0.985, 0.98, 0.968)
        }
    }
    /// How far a note no one has touched in a while fades toward `cool`.
    var cooling: Double { 0.28 }
    /// How strong lines are drawn: paper needs more to read.
    var lineAlpha: Double { dark ? 0.34 : 0.5 }
    /// And how wide, against the dark looks.
    var lineWidth: Double { dark ? 1 : 1.7 }
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
        /// The key. Amber: notes only the person sharing it wrote in. The AI's colour: notes it helped with.
        var you = "Just me"
        var withAI: @Sendable (String) -> String = { "With \($0)" }
        /// Over the first second, so a still of the start says what it is, and on the end card.
        var title: @Sendable (FilmStats) -> String = { _ in "My first month" }
        /// Under the title as it opens: what's in it, and where.
        var subtitle: @Sendable (FilmStats) -> String = { "\($0.notes == 1 ? "1 note" : "\($0.notes) notes") in Pinto Notes" }
        /// The end card's one line that's only yours: the folder you wrote in most (when folder
        /// names are on), or your busiest day.
        var topFolder: @Sendable (String, Int) -> String = { "Most written in \($0) \u{00B7} \($1 == 1 ? "1 note" : "\($1) notes")" }
        var busiestDay: @Sendable (String, Int) -> String = { "Busiest day: \($0) \u{00B7} \($1 == 1 ? "1 edit" : "\($1) edits")" }
        /// Said under the date as it grows, so someone who has never seen the app can read it.
        var captions = ["Each light is a note", "It grows each time it\u{2019}s edited"]
        /// A third, when the notebook has links.
        var linksCaption = "A line is a link between two notes"
        /// As the film passes the day you wrote most (the date is beside it). First person, like
        /// the title: it's the person sharing it who speaks.
        var busiestCaption: @Sendable (Int) -> String = { "My busiest day \u{00B7} \($0 == 1 ? "1 edit" : "\($0) edits")" }
        /// Near the end, as the folder written in most has its moment (its count is on the end card).
        var topFolderCaption: @Sendable (String) -> String = { "I wrote most in \($0)" }
        /// The AI's line, after the one that says what a house (or a light) is: "ChatGPT helped with 36 of them".
        var aiCaption: @Sendable (String, Int) -> String = { "\($0) helped with \($1) of them" }
        /// On the end card, when the film has already named the folder written in most.
        var streakCard: @Sendable (Int) -> String = { "My longest run: \($0) days in a row" }
        /// The same moment in a month of one or two folders: how many days you wrote on.
        var daysCaption: @Sendable (Int) -> String = { $0 == 1 ? "I wrote on 1 day" : "I wrote on \($0) days" }
        /// ...or, better, the most days running (the end card has the count of days).
        var streakCaption: @Sendable (Int) -> String = { "\($0) days in a row, my longest run" }
        /// The end card's third number when no AI wrote: "214 edits".
        var statEdits = "edits"
        /// Under the end card's numbers.
        var statNotes = "notes"
        var statDays = "writing days"
        var statAI: @Sendable (String) -> String = { "notes with \($0)" }
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
    var height: Int { Int(canvas.height.rounded()) }
    private(set) var canvas: FilmCanvas
    private(set) var frame = 0
    /// What the look draws besides the constellation (or in its place), if anything.
    private let scene: FilmScene?
    /// The ink of the mark and key along the top in the frame being drawn.
    private lazy var topInk: RGB = look.ink
    /// The film time of the frame being drawn, for a scene's own key.
    private var keyTime = 0.0

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
    /// The top of each folder's notes on screen in the frame being drawn, their size included:
    /// its name sits clear above that.
    private var ftop: [Double] = []
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
    private let opening: Opening
    /// False draws the notebook without the date, count and end card (for the opening's glimpse).
    private let words: Bool
    /// The film's last frame, for its opening; drawn when first needed.
    private var ending: CGImage?
    private var cameraSet = false
    /// When you, and the AI, first light a note: each colour is named in the corner from then.
    private let firstYou: Double, firstAI: Double
    /// The note written in most: it keeps the brightest light at the end.
    private let editCounts: [Int]
    /// 0...1 per note: how much it was written in, 1 for the busiest tenth.
    private let worked: [Double]
    /// When an AI first wrote in each note (infinity if none did): it turns the AI's colour then.
    private let aiFrom: [Double]

    /// How it begins. `full`, as shared: on the finished notebook under its title, held, before it
    /// draws back to the first day. `brief`, in the app, where the intro has just shown that
    /// notebook: a shorter hold. `none`: straight at the first day.
    enum Opening { case full, brief, none }

    init(script: FilmScript, labels: Labels = Labels(), canvas: FilmCanvas = .shared, opening: Opening = .full, words: Bool = true) {
        self.opening = opening
        self.words = words
        self.canvas = canvas
        switch labels.look {
        case .town: scene = TownScene(script: script, folderNames: labels.folderNames)
        case .night, .paper: scene = nil
        }
        switch opening {
        case .full: frame = 0
        // In the app a scene starts where the intro's picture is: its first houses.
        case .brief:
            if let scene, scene.rewinds {
                frame = FilmScript.preludeFrames
            } else {
                frame = FilmScript.preludeFrames - Int(0.7 * Double(FilmScript.fps))
            }
        case .none: frame = FilmScript.preludeFrames
        }
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
        var fy = Double.infinity, fa = Double.infinity
        for n in script.nodes {
            if n.bornByAI { fa = min(fa, n.birth) } else { fy = min(fy, n.birth) }
            for (k, e) in n.edits.enumerated() { if n.aiEdits[k] { fa = min(fa, e) } else { fy = min(fy, e) } }
        }
        firstYou = fy
        firstAI = fa
        editCounts = script.nodes.map(\.edits.count)
        let sorted = editCounts.sorted()
        let busy = Double(max(1, sorted.isEmpty ? 1 : sorted[Int(0.9 * Double(sorted.count - 1))]))
        worked = editCounts.map { min(1, (Double($0) / busy).squareRoot()) }
        aiFrom = script.nodes.map { n in n.bornByAI ? n.birth : zip(n.edits, n.aiEdits).first { $0.1 }?.0 ?? .infinity }
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
        let t = time
        let k = Double(ctx.width) / Double(width)
        if t < 0 {
            // The opening: where the month ended up, under its title; then it draws back and is
            // gone before the first day begins, so the two never show at once.
            if let scene, scene.rewinds {
                // The scene as the month left it (before its own ending, which is kept for the
                // end), held; then the month runs backwards to its first morning.
                let x = min(1, max(0, (t + 1.0) / 1.0))
                let back = x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2
                // ...back to its first houses, where the film (and the app's intro) takes it up.
                // (The town a moment before its sunset starts: the picture a feed shows is its brightest dusk.)
                let at = scene.appStart + (script.growth - 0.6 - scene.appStart) * (1 - back)
                ctx.saveGState()
                ctx.scaleBy(x: k, y: k)
                scene.drawRewinding(at, canvas: canvas, in: ctx)
                topInk = scene.topInk(at)
                keyTime = at
                if words {
                    drawMark(in: ctx)
                    drawKey(you: 1, ai: 1, in: ctx)
                    // As it runs back, the date and the count run back with it: it's time rewinding.
                    // (The line under the title goes before the date comes: never both.)
                    let rolling = smooth((x - 0.08) / 0.08)
                    drawOpeningTitle(1, subtitle: 1 - smooth(x / 0.08), in: ctx)
                    if rolling > 0 {
                        let born = script.nodes.filter { $0.birth <= at }.count
                        text(dateFormatter.string(from: script.date(at: at)), size: 40, weight: .medium, color: look.ink.cg(0.7 * rolling), at: CGPoint(x: 72, y: canvas.bottom + 156), in: ctx)
                        text(labels.notesCount(born), size: 40, weight: .medium, color: look.ink.cg(0.7 * rolling), at: CGPoint(x: Double(width) - 72, y: canvas.bottom + 156), align: 1, in: ctx)
                    }
                }
                ctx.restoreGState()
                frame += 1
                return
            }
            let back = smooth((t + 0.4) / 0.4)
            ctx.saveGState()
            ctx.scaleBy(x: k, y: k)
            drawBackground(0, in: ctx)
            ctx.restoreGState()
            // A scene stays where it is (the same hills, another hour); the constellation draws back.
            drawEnding(in: ctx, alpha: 1 - back, zoom: scene?.replacesNotebook == true ? 1 : 1 - 0.12 * back)
            if let scene { topInk = scene.topInk(script.growth + FilmScript.outro).mix(scene.topInk(0), back) }
            ctx.saveGState()
            ctx.scaleBy(x: k, y: k)
            drawMark(in: ctx)
            // Who's who from the first frame: it's the picture a feed shows before it plays.
            drawKey(you: 1, ai: 1, in: ctx)
            drawOpeningTitle(1, in: ctx)
            ctx.restoreGState()
            frame += 1
            return
        }
        step(to: t)
        ctx.saveGState()
        // One scale both ways: a context of another shape than the canvas would stretch it.
        ctx.scaleBy(x: k, y: k)
        draw(t, in: ctx)
        ctx.restoreGState()
        frame += 1
    }

    /// Draws the film's last moment again in another shape, without moving on: the full-screen
    /// film settling into the shape it's shared in.
    func drawHeld(in ctx: CGContext, canvas: FilmCanvas) {
        self.canvas = canvas
        // The last frame's own time, so it settles into exactly the picture that's shared.
        let t = Double(script.frameCount - 1 - FilmScript.preludeFrames) / Double(FilmScript.fps) + startOffset
        updateCamera(t, snap: true)
        ctx.saveGState()
        let k = Double(ctx.width) / Double(width)
        ctx.scaleBy(x: k, y: k)
        draw(t, in: ctx)
        ctx.restoreGState()
    }

    /// The picture the film opens on, without its words (behind the intro, and Watch picks up from it).
    func drawOpeningPicture(in ctx: CGContext) {
        let k = Double(ctx.width) / Double(width)
        if let scene, scene.rewinds {
            ctx.saveGState()
            ctx.scaleBy(x: k, y: k)
            // Where the app starts a scene: its first houses, on the first morning.
            scene.drawBehind(scene.appStart, canvas: canvas, in: ctx)
            ctx.restoreGState()
        } else {
            let r = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .none, words: false)
            while r.frame < script.frameCount - 1 { r.skip() }
            r.drawNext(in: ctx)
        }
    }

    /// Moves on a frame without drawing it (the layout still settles), to start part way in.
    func skip() {
        if time >= 0 { step(to: time) }
        frame += 1
    }

    /// Seconds into the notebook's growth for the next frame; below zero during the opening.
    private var time: Double {
        let raw = Double(frame - FilmScript.preludeFrames) / Double(FilmScript.fps)
        return raw < 0 ? raw : raw + startOffset
    }

    /// A scene's month is taken up at its first houses, in the shared film and in the app alike.
    private var startOffset: Double { opening != .none && scene?.rewinds == true ? scene?.appStart ?? 0 : 0 }

    private func drawEnding(in ctx: CGContext, alpha: Double, zoom: Double) {
        guard opening != .none, alpha > 0.004 else { return }
        if ending == nil {
            let r = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .none, words: false)
            guard let c = Self.context(width: ctx.width, height: ctx.height) else { return }
            while r.frame < script.frameCount - 1 { r.skip() }
            r.drawNext(in: c)
            ending = c.makeImage()
        }
        guard let ending else { return }
        let w = Double(ctx.width) * zoom, h = Double(ctx.height) * zoom
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.draw(ending, in: CGRect(x: (Double(ctx.width) - w) / 2, y: (Double(ctx.height) - h) / 2, width: w, height: h))
        ctx.restoreGState()
    }

    var isDone: Bool { frame >= script.frameCount }

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
        let growT = min(t, script.growth)
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
            if fcount[f] == 1 { fnamed[f] = growT + 0.15 }
            vel[i] = .zero
            alive += 1
        }
        while linksAlive < script.links.count && script.links[linksAlive].birth <= growT { linksAlive += 1 }
        // A scene in the notebook's place needs only how many notes there are so far.
        if scene?.replacesNotebook == true { return }
        // Settle a little more each frame while growing, and gently after.
        let iterations = t <= script.growth ? 3 : 1
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
        let bottom = 340 + canvas.bottom + (scene?.lift ?? 0), top = 215 + canvas.top
        return CGRect(x: 70, y: bottom, width: Double(width) - 140, height: max(200, Double(height) - bottom - top))
    }

    private func updateCamera(_ t: Double, snap: Bool = false) {
        guard alive > 0 else { return }
        var lo = pos[0], hi = pos[0]
        for i in 0..<alive { lo = simd_min(lo, pos[i]); hi = simd_max(hi, pos[i]) }
        let pad = 18.0
        let w = hi.x - lo.x + pad * 2, h = hi.y - lo.y + pad * 2
        let box = graphBox
        let target = min(box.width / w, box.height / h, script.folders.count <= 3 ? 9.0 : 6.0)
        let c = (lo + hi) / 2
        // Zooming out keeps up quickly so nothing leaves the frame; zooming in is slow.
        let k = target < camScale ? 0.25 : 0.06
        if !cameraSet || snap { camScale = target; camCenter = c; cameraSet = true }
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
        drawBackground(t, in: ctx)
        topInk = scene?.topInk(t) ?? look.ink
        keyTime = t
        if scene?.replacesNotebook == true {
            // The scene is the whole picture: only the words go over it.
            if words { drawMark(in: ctx); drawWords(t, in: ctx) }
            return
        }

        let gt = min(t, script.growth)
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
        ctx.setStrokeColor(look.line.cg(look.lineAlpha))
        ctx.setLineWidth(1.3 * lineScale * look.lineWidth)
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
        ctx.setStrokeColor(look.line.cg(look.dark ? 0.09 : 0.16))
        ctx.setLineWidth(1.0 * lineScale * look.lineWidth)
        ctx.addPath(spokes)
        ctx.strokePath()

        // Glow: added light on light in the dark looks; none on paper.
        struct Core { var p: CGPoint; var r: Double; var color: RGB; var flash: Double }
        ftop = Array(repeating: -.infinity, count: fpos.count)
        var cores: [Core] = []
        ctx.setBlendMode(look.dark ? .plusLighter : .normal)
        let breathe = t > script.growth ? 0.5 + 0.5 * sin((t - script.growth) * 2.2) : 0
        let outro = smooth((t - script.growth) / 0.9)
        for i in 0..<alive {
            let n = script.nodes[i]
            var count = 0, you = 0.0, ai = 0.0, last = n.birth
            for (k, et) in n.edits.enumerated() {
                if et > gt { break }
                count += 1
                last = et
                let age = gt - et
                if age < 1.4 && t <= script.growth + 0.6 {
                    let a = exp(-age / 0.32)
                    if n.aiEdits[k] { ai += a } else { you += a }
                }
            }
            let born = gt - n.birth
            let pop = born < 0.4 ? 1 - pow(1 - born / 0.4, 3) : 1
            if born < 1 { if n.bornByAI { ai += exp(-born / 0.4) * 1.5 } else { you += exp(-born / 0.4) * 1.5 } }
            // Amber while only you have written in it; the AI's colour from the moment it helps.
            let tint = aiFrom[i] <= script.growth ? max(smooth((gt - aiFrom[i]) / 0.35), outro) : 0
            let color = look.you.mix(look.ai, tint)
            // Notes you keep working on grow, and glow while you're on them; the rest dim.
            let heat = exp(-(gt - last) / 1.3)
            let r = min(24, max(2.8, (1.1 + 1.45 * Double(count).squareRoot()) * camScale * 0.5)) * pop
            let worked = worked[i]
            // At the end every note lights at once, then settles.
            let bloomT = (t - script.growth - 0.15) / 1.1
            if bloomT > 0 && bloomT < 1 {
                let a = sin(bloomT * .pi) * (0.45 + 0.55 * worked)
                ai += a * tint
                you += a * (1 - tint)
            }
            let p = screen(pos[i])
            // Its dot and the close part of its light stay under its folder's name.
            let centre = screen(fpos[n.folder])
            let reach = (10 * Double(fcount[n.folder]).squareRoot() + 26) * camScale
            if hypot(p.x - centre.x, p.y - centre.y) <= reach { ftop[n.folder] = max(ftop[n.folder], p.y + r * (look.dark ? 1.6 : 2.4)) }
            // Its resting light; at the end the notes written in most keep a wide one, so the last
            // frame has the month's shape: where the work was.
            let rest = 0.24 + 0.36 * max(heat, outro * (0.4 + 0.6 * worked)) + 0.06 * breathe
            let glowR = r * (4 + 5 * outro * worked)
            let glowA = min(1, rest + 0.5 * outro * worked)
            if !look.dark {
                // On paper wide light is a stain: a tight halo in the note's colour, wider as
                // it's written in and round the notes written in most at the end.
                let lit = min(1, max(you + ai, outro * worked))
                let a = 0.3 + 0.5 * lit, hr = r * (2.3 + 1.5 * lit) + 2
                sprite(youGlow, at: p, radius: hr, alpha: a * (1 - tint), in: ctx)
                sprite(aiGlow, at: p, radius: hr, alpha: a * tint, in: ctx)
            } else {
                sprite(youGlow, at: p, radius: glowR, alpha: glowA * (1 - tint), in: ctx)
                sprite(aiGlow, at: p, radius: glowR, alpha: glowA * tint, in: ctx)
                // A flash where someone just wrote.
                if you > 0.01 { sprite(youGlow, at: p, radius: r * (3.4 + 6 * min(1.4, you)), alpha: min(1, 0.75 * you), in: ctx) }
                if ai > 0.01 { sprite(aiGlow, at: p, radius: r * (3.4 + 6 * min(1.4, ai)), alpha: min(1, 0.75 * ai), in: ctx) }
            }
            cores.append(Core(p: p, r: r, color: color.mix(look.cool, look.cooling * (1 - heat) * (1 - outro)), flash: min(1, you + ai)))
        }
        ctx.setBlendMode(.normal)
        for c in cores {
            let r = c.r * (1 + 0.15 * outro)
            ctx.setFillColor((look.dark ? c.color.mix(RGB(1, 1, 1), 0.12 + 0.25 * c.flash) : c.color).cg())
            ctx.fillEllipse(in: CGRect(x: c.p.x - r, y: c.p.y - r, width: r * 2, height: r * 2))
        }

        if labels.folderNames { drawFolderNames(t, in: ctx) }
        ctx.setBlendMode(.normal)
        scene?.drawInFront(t, canvas: canvas, in: ctx)
        // The glimpse leaves out what the frame it's drawn over already has, so nothing doubles as it fades.
        if words { drawMark(in: ctx); drawWords(t, in: ctx) }
    }

    private func drawBackground(_ t: Double, in ctx: CGContext) {
        ctx.setBlendMode(.normal)
        if let scene { scene.drawBehind(t, canvas: canvas, in: ctx); return }
        let (top, bottom) = look.background
        if let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [bottom.cg(), top.cg()] as CFArray, locations: [0, 1]) {
            ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: height), options: [])
        } else {
            ctx.setFillColor(top.cg())
            ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
    }

    /// Each folder's name just over its notes, once it has a few.
    private func drawFolderNames(_ t: Double, in ctx: CGContext) {
        for f in fpos.indices where falive[f] && fcount[f] >= 1 {
            guard var name = script.folders[f].isEmpty ? labels.noFolder : script.folders[f] else { continue }
            // A long name is cut short rather than laid over its neighbours.
            if name.count > 22 { name = name.prefix(21).trimmingCharacters(in: .whitespaces) + "\u{2026}" }
            let c = screen(fpos[f])
            let top = max(c.y, f < ftop.count ? ftop[f] : c.y)
            let appear = smooth((min(t, script.growth) - fnamed[f]) / 0.5)
            text(name, size: 38, weight: .semibold, color: look.ink.cg((look.dark ? 0.86 : 0.8) * appear), at: CGPoint(x: c.x, y: top + 14), align: 0.5, in: ctx)
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
            let size = 48.0
            let rect = CGRect(x: x, y: y - 12, width: size, height: size)
            ctx.saveGState()
            ctx.addPath(CGPath(roundedRect: rect, cornerWidth: size * 0.2237, cornerHeight: size * 0.2237, transform: nil))
            ctx.clip()
            ctx.draw(m, in: rect)
            ctx.restoreGState()
            x += size + 14
        }
        text(labels.mark, size: 34, weight: .semibold, color: topInk.cg(look.dark ? 0.88 : 0.84), at: CGPoint(x: x, y: y), in: ctx)
    }

    private func drawWords(_ t: Double, in ctx: CGContext) {
        let side = 72.0
        let base = canvas.bottom
        let s = script.stats
        let ink = look.ink

        // Each colour is named from the moment it first lights a note (from the start when the
        // opening has already named them), and stays named.
        let named = opening == .none ? 0.0 : 1.0
        drawKey(you: max(named, smooth((t - firstYou) / 0.35)), ai: max(named, smooth((t - firstAI) / 0.35)), in: ctx)

        // The title over the first seconds, where the end card's title will be.
        let titleUntil = self.opening == .none ? 1.1 : 0.25
        // (Counted from where the film takes the month up.)
        let since = t - startOffset
        let opening = 1 - smooth((since - titleUntil) / 0.5)
        // After a rewind the date and the count are already there, where the title's second line was.
        let rewound = self.opening != .none && scene?.rewinds == true
        // (In the app a scene has no title of its own: the intro has just said it.)
        if opening > 0, !(rewound && self.opening == .brief) { drawOpeningTitle(opening, subtitle: rewound ? 0 : 1, in: ctx) }
        // The date and the count while it grows.
        // (Once the title has gone: the two never share the space.)
        let running = (rewound ? 1 : smooth((since - titleUntil - 0.5) / 0.4)) * (1 - smooth((t - script.growth - (scene == nil ? 0 : 0.15)) / 0.4))
        if running > 0 {
            let date = script.date(at: min(t, script.growth))
            text(dateFormatter.string(from: date), size: 40, weight: .medium, color: ink.cg(0.7 * running), at: CGPoint(x: side, y: base + 156), in: ctx)
            text(labels.notesCount(alive), size: 40, weight: .medium, color: ink.cg(0.7 * running), at: CGPoint(x: Double(width) - side, y: base + 156), align: 1, in: ctx)
        }
        // Under them, one line at a time (a line is gone before the next comes): what a light is,
        // then what's yours: the day you wrote most as it passes, and the folder you wrote in most.
        if running > 0 {
            func ramp(_ a: Double, _ b: Double) -> Double { smooth((t - a) / (b - a)) }
            func shown(_ from: Double, _ until: Double) -> Double { ramp(from, from + 0.22) * (1 - ramp(until - 0.22, until)) }
            /// 1 while a line of your own holds the baseline, with room either side of it.
            func held(_ from: Double, _ until: Double) -> Double { ramp(from - 0.34, from - 0.1) * (1 - ramp(until + 0.1, until + 0.34)) }
            var mine: [(from: Double, until: Double, line: String, color: RGB)] = []
            // Only while that day is on screen: a day that passed under the title goes unsaid here.
            if let day = s.busiestDay, let span = script.span(ofDay: day), span.start >= titleUntil + 0.3 + startOffset {
                mine.append((span.start, span.start + min(2.4, max(0.9, span.length - 0.15)), labels.busiestCaption(s.busiestDayEdits), look.you))
            }
            if labels.folderNames, let f = s.topFolder, script.growth > 5, s.folders >= 3 {
                mine.append((script.growth - FilmScript.topFolderMoment, script.growth - 0.25, labels.topFolderCaption(f), look.you))
            } else if s.writingDays > 1 {
                mine.append((script.growth - 1.9, script.growth - 0.25, s.streak >= 3 ? labels.streakCaption(s.streak) : labels.daysCaption(s.writingDays), look.you))
            }
            mine.sort { $0.from < $1.from }
            var cover = 0.0
            for (k, m) in mine.enumerated() {
                // One that meets an earlier one waits for it.
                var a = shown(m.from, m.until)
                for earlier in mine[..<k] { a *= 1 - held(earlier.from, earlier.until) }
                cover = max(cover, held(m.from, m.until))
                if a > 0 { text(m.line, size: 48, weight: .semibold, color: m.color.cg(a * running), at: CGPoint(x: side, y: base + 86), in: ctx) }
            }
            // As many as fit while it grows: a thin month's shorter film says less.
            var lines: [(String, RGB?)] = (scene?.captions ?? labels.captions).map { ($0, nil) }
            // The AI has a line of its own, in its colour, right after what a house is.
            if let ai = s.ai, s.aiNotes > 0 { lines.insert((labels.aiCaption(ai, s.aiNotes), look.dark ? look.ai : FilmLook.paper.ai), at: min(1, lines.count)) }
            var from = titleUntil + 0.6 + startOffset
            let slot = min(2.4, max(1.4, (script.growth - from - FilmScript.topFolderMoment - 0.2) / Double(lines.count)))
            for (line, color) in lines where from + slot <= script.growth + 0.01 {
                let a = shown(from, from + slot - 0.1) * (1 - cover) * running
                if a > 0 { text(line, size: 48, weight: color == nil ? .regular : .medium, color: (color ?? ink).cg((color == nil ? 0.76 : 1) * a), at: CGPoint(x: side, y: base + 86), in: ctx) }
                from += slot
            }
        }
        // The end card: the title, the one line that's only yours, and what the month came to.
        // A scene's own ending comes first (night falls on the town).
        let t = t - (scene?.wordsDelay ?? 0)
        let outroIn = smooth((t - script.growth - 0.25) / 0.7)
        guard outroIn > 0 else { return }
        let rise = (1 - outroIn) * 14
        text(labels.title(s), size: 60, weight: .semibold, color: ink.cg(outroIn), at: CGPoint(x: side, y: base + 256 - rise), in: ctx)
        if let line = highlight(s) {
            let a = smooth((t - script.growth - 0.55) / 0.6)
            text(line, size: 40, weight: .regular, color: ink.cg(0.84 * a), at: CGPoint(x: side, y: base + 200 - rise), in: ctx)
        }
        var stats: [(String, String, RGB?)] = [("\(s.notes)", labels.statNotes, nil), ("\(s.writingDays)", labels.statDays, nil)]
        // The AI's number in its colour; the totals in ink, so nobody adds them up as yours plus its.
        if let ai = s.ai, s.aiNotes > 0 { stats.append(("\(s.aiNotes)", labels.statAI(ai), look.ai)) } else { stats.append(("\(s.edits)", labels.statEdits, nil)) }
        // The third column is the widest: its label names the AI.
        let across = Double(width) - side * 2
        let starts = [0, 0.3, 0.6, 1.0]
        for (k, (number, label, color)) in stats.enumerated() {
            let a = smooth((t - script.growth - 0.75 - 0.12 * Double(k)) / 0.5)
            let x = side + across * starts[k], column = across * (starts[k + 1] - starts[k])
            let y = base + 62 - (1 - a) * 10
            text(number, size: 66, weight: .semibold, color: (color ?? ink).cg(a), at: CGPoint(x: x, y: y + 50), in: ctx)
            // Its label, as large as fits its column: read at the width of a feed.
            let fit = min(1, (column - 14) / max(1, textWidth(label, size: 38, weight: .regular)))
            text(label, size: (38 * fit).rounded(.down), weight: .regular, color: ink.cg(0.82 * a), at: CGPoint(x: x, y: y), in: ctx)
        }
    }

    /// The key, top right: who each colour is.
    private func drawKey(you: Double, ai: Double, in ctx: CGContext) {
        let keyY = Double(height) - 96 - canvas.top
        // With no AI there's one colour and nothing to tell apart.
        guard let name = script.stats.ai else { return }
        // Deeper dots while the top is in dark ink on a pale sky.
        let pale = topInk.r + topInk.g + topInk.b < 1.5
        let keys: [(String, RGB, Double, Bool)] = [(labels.withAI(name), pale ? FilmLook.paper.ai : look.ai, ai, true), (labels.you, pale ? FilmLook.paper.you : look.you, you, false)]
        var right = Double(width) - 64
        for (name, color, a, isAI) in keys where a > 0 {
            let w = textWidth(name, size: 34, weight: .medium)
            text(name, size: 34, weight: .medium, color: topInk.cg(0.86 * a), at: CGPoint(x: right - w, y: keyY), in: ctx)
            // The scene's own sign for it (a little house), or a dot.
            if scene?.drawKey(ai: isAI, at: CGPoint(x: right - w - 34, y: keyY + 1), alpha: a, t: keyTime, in: ctx) != true {
                ctx.setFillColor(color.cg(a))
                ctx.fillEllipse(in: CGRect(x: right - w - 32, y: keyY + 3, width: 20, height: 20))
            }
            right -= w + 34 + 26
        }
    }

    private func drawOpeningTitle(_ a: Double, subtitle: Double = 1, in ctx: CGContext) {
        text(labels.title(script.stats), size: 60, weight: .semibold, color: look.ink.cg(a), at: CGPoint(x: 72, y: canvas.bottom + 256), in: ctx)
        if subtitle > 0 { text(scene?.subtitle(script.stats) ?? labels.subtitle(script.stats), size: 40, weight: .regular, color: look.ink.cg(0.78 * a * subtitle), at: CGPoint(x: 72, y: canvas.bottom + 196), in: ctx) }
    }

    private func highlight(_ s: FilmStats) -> String? {
        // Something the film hasn't just said: where it named the folder written in most, the
        // card has the longest run of days instead.
        let namedTopFolder = labels.folderNames && s.topFolder != nil && script.growth > 5 && s.folders >= 3
        if namedTopFolder, s.streak >= 3 { return labels.streakCard(s.streak) }
        if labels.folderNames, let f = s.topFolder { return labels.topFolder(f, s.topFolderNotes) }
        guard let d = s.busiestDay else { return nil }
        let f = DateFormatter()
        f.locale = labels.locale
        f.setLocalizedDateFormatFromTemplate("MMMM d")
        return labels.busiestDay(f.string(from: d), s.busiestDayEdits)
    }

    private func textWidth(_ s: String, size: Double, weight: FontWeight) -> Double {
        let attr = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight)])
        return CTLineGetTypographicBounds(CTLineCreateWithAttributedString(attr), nil, nil, nil)
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
        // In the dark a light with a bright middle; on paper an even tint that fades at its edge.
        let colors = (light ? [core.cg(1), c.cg(0.45), c.cg(0.14), c.cg(0.04), c.cg(0)] : [c.cg(0.6), c.cg(0.55), c.cg(0.3), c.cg(0.1), c.cg(0)]) as CFArray
        let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: colors, locations: light ? [0, 0.18, 0.42, 0.7, 1] : [0, 0.4, 0.62, 0.82, 1])!
        let m = CGPoint(x: Double(n) / 2, y: Double(n) / 2)
        ctx.drawRadialGradient(g, startCenter: m, startRadius: 0, endCenter: m, endRadius: Double(n) / 2, options: [])
        return ctx.makeImage()!
    }
}
