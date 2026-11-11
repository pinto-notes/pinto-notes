import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

// The film's stress lab: plays each notebook's film as the app does and checks what can be
// measured on every frame and in the sound. It writes a line per notebook, its faults, and stills
// of its last frame and of each fault to look at.
//   scripts/film/stress/run.sh OUT [shard] [shards] [random-count]

let args = CommandLine.arguments
let out = URL(fileURLWithPath: args.count > 1 ? args[1] : "stress-out")
let shard = args.count > 2 ? Int(args[2])! : 0, shards = args.count > 3 ? Int(args[3])! : 1
let randomCount = args.count > 4 ? Int(args[4])! : 200
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

let all = Scenarios.extremes + Scenarios.random(randomCount, seed: 2026)
let mine = all.enumerated().filter { $0.offset % shards == shard }

final class Holder { var scene: GalaxyScene? }

func labels(_ script: FilmScript, holder: Holder) -> FilmRenderer.Labels {
    // (As the app's store makes them for the galaxy.)
    var l = FilmRenderer.Labels()
    l.look = .town
    l.scene = { s, names in let g = GalaxyScene(script: s, names: names, seed: s.seed); g.inspect = true; holder.scene = g; return g }
    l.captionsOn = false
    l.startsAtFirstNote = true
    l.openingTitle = false
    l.sound = true
    l.workCount = FilmRenderer.Labels.notesAndEdits
    let kind = GalaxyScene.name(of: script.form)
    l.endTitle = { _ in "My notebook is \(kind)" }
    return l
}

func save(_ image: CGImage, _ name: String) {
    let url = out.appendingPathComponent(name)
    guard let d = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(d, image, nil)
    CGImageDestinationFinalize(d)
}

/// The frame's average brightness over every pixel (a few sampled ones read a name passing over
/// one of them as a flash).
func luma(_ ctx: CGContext) -> Double {
    // (Its pixels are blue, green, red, alpha, as the renderer makes them.)
    let p = ctx.data!.assumingMemoryBound(to: UInt8.self), row = ctx.bytesPerRow
    var sum = 0.0
    for y in 0..<ctx.height { for x in 0..<ctx.width { let k = y * row + x * 4; sum += 0.0722 * Double(p[k]) + 0.7152 * Double(p[k + 1]) + 0.2126 * Double(p[k + 2]) } }
    return sum / Double(ctx.width * ctx.height)
}

struct Fault { var kind: String; var at: Double; var detail: String }

let cal = Calendar(identifier: .gregorian)
let phone = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
for (index, scenario) in mine {
    let started = Date()
    let script = FilmScript(scenario.input, calendar: cal, bang: true)
    var faults: [Fault] = []
    func fault(_ kind: String, _ at: Double, _ detail: String) {
        // (One of each kind every half second is enough to see it.)
        if let last = faults.last(where: { $0.kind == kind }), at - last.at < 0.5 { return }
        faults.append(Fault(kind: kind, at: at, detail: detail))
    }
    // The script itself.
    if zip(script.nodes, script.nodes.dropFirst()).contains(where: { $0.birth > $1.birth + 1e-9 }) { fault("order", 0, "notes out of order") }
    if script.nodes.contains(where: { $0.birth > script.growth + 1e-9 }) { fault("late", 0, "a note after the end") }
    if script.opening > FilmScript.lead + FilmScript.cascade + FilmScript.bangHold + 1e-9 { fault("opening", 0, "opening \(script.opening)") }

    // The picture, every frame, as the app plays it on a phone (drawn small: the checks are geometry).
    let holder = Holder()
    let renderer = FilmRenderer(script: script, labels: labels(script, holder: holder), canvas: phone, opening: .brief)
    let w = 360, h = Int((Double(w) * phone.height / 1080).rounded())
    let ctx = FilmRenderer.context(width: w, height: h)!
    var frame = 0, lastLuma: Double?, hiddenFor = 0, worstHidden = 0, overlapFor = 0
    var last: CGImage?
    while !renderer.isDone {
        renderer.drawNext(in: ctx)
        let t = Double(frame) / Double(FilmScript.fps)
        frame += 1
        guard let image = ctx.makeImage() else { continue }
        last = image
        // (Stills through it to look at: as the bursts settle, a third and two thirds through.)
        for (name, when) in [("a", script.opening + 0.3), ("b", script.opening + (script.growth - script.opening) / 3), ("c", script.opening + (script.growth - script.opening) * 2 / 3)] where frame == Int(when * Double(FilmScript.fps)) { save(image, "\(index)-\(name).png") }
        let y = luma(ctx)
        if let lastLuma, abs(y - lastLuma) > 10 { fault("flash", t, String(format: "brightness jumps %.0f in a frame", abs(y - lastLuma))); save(image, "\(index)-flash-\(frame).png") }
        lastLuma = y
        guard let seen = holder.scene?.inspected else { continue }
        let shown = seen.names.filter { $0.alpha > 0.5 }
        var overlap: String?
        for a in shown.indices { for b in shown.indices where b > a && shown[a].box.insetBy(dx: 2, dy: 2).intersects(shown[b].box.insetBy(dx: 2, dy: 2)) { overlap = "\(shown[a].name) on \(shown[b].name)" } }
        overlapFor = overlap == nil ? 0 : overlapFor + 1
        if let overlap, overlapFor == 4 { fault("names overlap", t, overlap); save(image, "\(index)-overlap-\(frame).png") }
        for n in shown where n.box.minX < 4 || n.box.maxX > 1076 { fault("name cut off", t, n.name) }
        for n in shown where n.box.minY < seen.sky.minY - 20 { fault("name over the words", t, n.name); save(image, "\(index)-words-\(frame).png") }
        let hidden = seen.stars.filter { !seen.sky.insetBy(dx: -12, dy: -12).contains($0) }.count
        hiddenFor = hidden > 0 ? hiddenFor + 1 : 0
        worstHidden = max(worstHidden, hidden)
        if hiddenFor == 15 { fault("stars out of the picture", t, "\(hidden) of \(seen.stars.count)"); save(image, "\(index)-hidden-\(frame).png") }
    }
    if let last { save(last, "\(index)-end.png") }
    // On the card, every name is all there or gone: none stuck half faded.
    for n in holder.scene?.inspected.names ?? [] where n.alpha > 0.02 && n.alpha < 0.95 && n.box.maxY < phone.height - phone.top - 220 { fault("name half there at the end", script.growth, n.name) }
    // The words under the picture: nothing written reaches its right edge.
    do {
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self), row = ctx.bytesPerRow
        let words = Int((phone.bottom + 250) / 1080 * Double(w))
        var ink = 0
        for y in (h - words)..<h { for x in (w - 10)..<w {
            let k = y * row + x * 4
            if 0.0722 * Double(p[k]) + 0.7152 * Double(p[k + 1]) + 0.2126 * Double(p[k + 2]) > 200 { ink += 1 }
        } }
        if ink > 0 { fault("words off the edge", script.growth, "\(ink) bright pixels at the right edge of the card") }
    }

    // How long a frame takes at the size the app draws it (every tenth, on this Mac).
    let timing = FilmRenderer(script: script, labels: labels(script, holder: Holder()), canvas: phone, opening: .brief)
    let tw = 786, big = FilmRenderer.context(width: tw, height: Int((Double(tw) * phone.height / 1080).rounded()))!
    var times: [Double] = []
    var k = 0
    while !timing.isDone {
        if k % 10 == 0 {
            // (Thread CPU time, so a busy Mac doesn't read as a slow film.)
            let a = clock_gettime_nsec_np(CLOCK_THREAD_CPUTIME_ID)
            timing.drawNext(in: big)
            times.append(Double(clock_gettime_nsec_np(CLOCK_THREAD_CPUTIME_ID) - a) / 1e6)
        } else { timing.skip() }
        k += 1
    }
    times.sort()
    let p95 = times.isEmpty ? 0 : times[min(times.count - 1, times.count * 95 / 100)]
    if p95 > 25 { fault("slow", 0, String(format: "p95 %.0f ms a frame", p95)) }

    // The sound.
    let sound = FilmSound(script: script).samples()
    let rate = FilmSound.rate
    var peak: Float = 0, sum = 0.0, bad = false
    for v in sound { if !v.isFinite { bad = true }; peak = max(peak, abs(v)); sum += Double(v * v) }
    let level = 10 * log10(max(1e-12, sum / Double(max(1, sound.count))))
    let win = Int(0.4 * rate) * 2
    var loudest = -200.0, quietRun = 0.0, longestQuiet = 0.0
    var at = 0
    while at + win <= sound.count {
        var s = 0.0
        for k in stride(from: at, to: at + win, by: 2) { s += Double(sound[k] * sound[k] + sound[k + 1] * sound[k + 1]) / 2 }
        let db = 10 * log10(max(1e-12, s / Double(win / 2)))
        loudest = max(loudest, db)
        let time = Double(at / 2) / rate
        if db < -48, time < script.growth { quietRun += 0.4; longestQuiet = max(longestQuiet, quietRun) } else { quietRun = 0 }
        at += win
    }
    if bad { fault("sound broken", 0, "not a number in it") }
    if peak > 0.9 { fault("sound clips", 0, String(format: "peak %.2f", peak)) }
    if level < -26 || level > -12 { fault("sound level", 0, String(format: "%.1f dB", level)) }
    if loudest - level > 13 { fault("sound spike", 0, String(format: "a moment %.0f dB over the rest", loudest - level)) }
    if longestQuiet > 1.6 { fault("sound gap", 0, String(format: "%.1f s nearly silent while it grows", longestQuiet)) }

    let kinds = Dictionary(grouping: faults, by: \.kind).map { "\($0.key) ×\($0.value.count)" }.sorted().joined(separator: ", ")
    let what = "\(script.form), \(script.nodes.count) notes, \(script.folders.filter { !$0.isEmpty }.count) folders, \(script.subfolders.count) inside, \(script.bangs.count) bursts, \(String(format: "%.1f", script.growth + FilmScript.outro)) s"
    let line = String(format: "%03d %@ | %@ | p95 %.0fms, sound %.1f dB peak %.2f | %.0fs | %@", index, scenario.name, what, p95, level, peak, Date().timeIntervalSince(started), faults.isEmpty ? "ok" : kinds)
    print(line); fflush(stdout)
    let lines = [line] + faults.map { String(format: "      %@ at %.1f s: %@", $0.kind, $0.at, $0.detail) }
    try lines.joined(separator: "\n").appending("\n").write(to: out.appendingPathComponent(String(format: "r-%03d.txt", index)), atomically: true, encoding: .utf8)
}
