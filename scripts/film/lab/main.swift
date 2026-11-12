import Foundation
import ImageIO
// Lab: renders a film-look experiment from the demo notebook.
//   scripts/film/lab/render.sh STYLE OUT.mp4 [seed] [light] [nofolders]
let args = CommandLine.arguments
let style = args.count > 1 ? args[1] : "town"
let out = URL(fileURLWithPath: args.count > 2 ? args[2] : "lab.mp4")
let seed = args.count > 3 ? UInt64(args[3]) ?? 7 : 7
let person = args.contains("p1") ? 1 : args.contains("p2") ? 2 : args.contains("p3") ? 3 : 0
// "busy" is someone who writes in their notes three times as often; "super" lives in it: a big
// month, written in eight times as often.
let lives = args.contains("super")
let days = args.first { $0.hasPrefix("days=") }.flatMap { Int($0.dropFirst(5)) } ?? 35
// "real" is a month the way a notebook is really used (a new note about once a week, written in on
// up to every other day); "realdaily" adds a note for each day; "perweek=3" changes how often.
let perWeek = args.first { $0.hasPrefix("perweek=") }.flatMap { Double($0.dropFirst(8)) } ?? 1
// "me" is Emil's own month: 20 notes brought in, 15 made, 12 of those removed again, and a tracker
// written in every day. "kb" is a knowledge base built for an AI: hundreds brought in and many made.
let input = args.contains("me") ? FilmDemo.real(days: days, seed: seed, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: args.contains("evening"))
    : args.contains("kb") ? FilmDemo.real(days: days, seed: seed, notesPerWeek: 22, imported: 240, removed: 8, linked: 0.6)
    : args.contains("real") || args.contains("realdaily")
    ? FilmDemo.real(days: days, seed: seed, notesPerWeek: perWeek, dailyNote: args.contains("realdaily"))
    : FilmDemo.notebook(days: days, seed: seed, light: args.contains("light"), heavy: args.contains("heavy") || lives, person: person, work: lives ? 8 : args.contains("busy") ? 3 : 1, daily: (style == "galaxy" || style == "dump" || style == "cards") && !args.contains("mixed"))
// "long=17" tries another length for the biggest notebooks' films (seconds of growing).
let longest = args.first { $0.hasPrefix("long=") }.flatMap { Double($0.dropFirst(5)) } ?? FilmScript.longGrowth
let script = FilmScript(input, calendar: Calendar(identifier: .gregorian), longest: longest, bang: style == "galaxy" || style == "slides")
var mark: CGImage?
if let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: "Pane/Resources/Assets.xcassets/MarkTight.imageset/mark-tight.png") as CFURL, nil) { mark = CGImageSourceCreateImageAtIndex(src, 0, nil) }
let start = Date()
switch style {
case "slides":
    // The intro and slides before the film, each at its end and on its way in: OUT is a folder.
    try FilmSlides(input: input, script: script, mark: mark).write(to: out)
    exit(0)
case "dump":
    // What's in the notebook, day by day, for drawing a timeline of it: {start, days, notes: [{folder, created, edits: [[day, ai]]}]}.
    let cal = Calendar(identifier: .gregorian)
    let day0 = cal.startOfDay(for: input.notes.map(\.created).min() ?? input.now)
    func day(_ d: Date) -> Double { (d.timeIntervalSince(day0) / 86_400 * 1000).rounded() / 1000 }
    let notes = input.notes.sorted { $0.created < $1.created }.map { n -> [String: Any] in
        ["folder": n.folder, "created": day(n.created), "edits": n.edits.map { [day($0.at), $0.ai == nil ? 0 : 1] }]
    }
    let all: [String: Any] = ["start": ISO8601DateFormatter().string(from: day0), "days": day(input.now), "notes": notes, "form": script.form.rawValue, "growth": script.growth]
    try JSONSerialization.data(withJSONObject: all).write(to: out)
    print("\(input.notes.count) notes, \(script.work) edits, most in one note \(input.notes.map(\.edits.count).max() ?? 0), form \(script.form.rawValue)")
    exit(0)
case "town":
    let film = TownFilm(script: script)
    film.mark = mark
    film.folderNames = !args.contains("nofolders")
    try Kit.write(to: out, width: 1080, height: 1350, frames: film.frameCount) { ctx, i in film.draw(frame: i, in: ctx) }
case "garden":
    let film = GardenFilm(script: script)
    film.mark = mark
    film.folderNames = !args.contains("nofolders")
    try Kit.write(to: out, width: 1080, height: 1350, frames: film.frameCount) { ctx, i in film.draw(frame: i, in: ctx) }
case "night", "paper", "apptown":
    // The app's own looks, for side-by-side sheets with the experiments.
    var labels = FilmRenderer.Labels()
    labels.locale = Locale(identifier: "en_US")
    labels.markImage = mark
    labels.look = style == "apptown" ? .town : FilmLook(rawValue: style) ?? .night
    labels.folderNames = !args.contains("nofolders")
    try await FilmVideo.write(FilmRenderer(script: script, labels: labels), to: out)
case "pages", "rings", "leaf":
    // New scenes tried through the app's own renderer (its words, opening and end card), in
    // Pinto's cut paper: on the cream page, or with "dark" on leaf brown.
    let dark = args.contains("dark")
    var labels = FilmRenderer.Labels()
    labels.locale = Locale(identifier: "en_US")
    labels.markImage = mark
    labels.look = dark ? .leaf : .cream
    labels.folderNames = !args.contains("nofolders")
    let cal = Calendar(identifier: .gregorian)
    labels.scene = { script, names in
        switch style {
        case "pages": PagesScene(script: script, names: names, calendar: cal, dark: dark)
        case "rings": RingsScene(script: script, names: names, calendar: cal, dark: dark)
        default: LeafScene(script: script, names: names, calendar: cal, dark: dark)
        }
    }
    try await FilmVideo.write(FilmRenderer(script: script, labels: labels), to: out)
case "flock", "lanterns", "bloom":
    // Spectacles in Pinto's world: the footer's dusk sky and hills, or its cream page.
    var labels = FilmRenderer.Labels()
    labels.locale = Locale(identifier: "en_US")
    labels.markImage = mark
    labels.look = style == "bloom" ? .cream : .town
    labels.folderNames = !args.contains("nofolders")
    labels.scene = { script, names in
        switch style {
        case "flock": FlockScene(script: script, names: names)
        case "lanterns": LanternScene(script: script, names: names)
        default: BloomScene(script: script, names: names)
        }
    }
    try await FilmVideo.write(FilmRenderer(script: script, labels: labels), to: out)
case "galaxy":
    // The notebook as something in space, cut from paper: its kind comes from how it was written in, its sky from the seed.
    var labels = FilmRenderer.Labels()
    labels.locale = Locale(identifier: "en_US")
    labels.markImage = mark
    labels.look = .town
    labels.folderNames = !args.contains("nofolders")
    // What it's drawn as comes from how the notebook was written in; naming one here overrides that.
    let form: FilmForm? = args.contains("spiral") ? .spiral : args.contains("nebula") ? .nebula : args.contains("comet") ? .comet : nil
    labels.workCount = { notes, edits in "\(notes) notes \u{00B7} \(edits) edits" }
    // (Nothing to read while it grows: the picture, the date and the count.)
    labels.captionsOn = false
    // For a knowledge base the film opens on its claim, and the rest is the proof.
    if args.contains("kb") {
        labels.title = { "\($0.notes) notes in my \($0.period)" }
        labels.subtitle = { s in s.ai.map { "\(s.aiNotes) of them written with \($0)" } ?? "\(s.edits) edits" }
    }
    // The film says what the notebook turned out to be: something to post it with.
    let kind = GalaxyScene.name(of: form ?? script.form)
    // (Only at the end: what it turned out to be is the film's last word, not its first.)
    labels.endTitle = { _ in "Your notebook is \(kind)" }
    labels.openingTitle = false
    print("form: \(script.form.rawValue)\(form.map { " (shown as \($0.rawValue))" } ?? ""), \(script.nodes.count) notes, \(script.stats.folders) folders, \(script.work) edits, away \(script.stats.quietDays) days, wrote on \(script.stats.writingDays) of \(script.stats.days)")
    labels.scene = { script, names in GalaxyScene(script: script, names: names, seed: Int(seed), form: form) }
    // "tall" is the shape for stories and reels, 9:16, with room left for the app's own buttons.
    let canvas = args.contains("tall") ? FilmCanvas(height: 1920, top: 150, bottom: 190) : FilmCanvas.shared
    // It starts at the first note and never shows the finished thing before the end: that's the film's payoff.
    try await FilmVideo.write(FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .none), to: out)
    // "sound" also writes its sound beside it, as OUT.wav (render.sh puts the two together).
    if args.contains("sound") { try FilmSound(script: script).wav().write(to: out.appendingPathExtension("wav")) }
case "bench":
    let town = TownFilm(script: script)
    let frames = Array(stride(from: 40, to: 400, by: 12))
    Bench.run("town", width: 1080, height: 1350, frames: frames) { ctx, i in town.draw(frame: i, in: ctx) }
    let tall = TownFilm(script: script, height: 2348)
    Bench.run("town tall", width: 1080, height: 2348, frames: frames) { ctx, i in tall.draw(frame: i, in: ctx) }
    let r = FilmRenderer(script: script)
    Bench.run("stars", width: 1080, height: 1350, frames: Array(0..<300)) { ctx, _ in r.drawNext(in: ctx) }
    exit(0)
default:
    print("unknown style \(style)")
}
print("wrote \(out.path) in \(String(format: "%.1f", Date().timeIntervalSince(start)))s")
