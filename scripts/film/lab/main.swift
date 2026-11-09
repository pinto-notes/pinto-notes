import Foundation
import ImageIO
// Lab: renders a film-look experiment from the demo notebook.
//   scripts/film/lab/render.sh STYLE OUT.mp4 [seed] [light] [nofolders]
let args = CommandLine.arguments
let style = args.count > 1 ? args[1] : "town"
let out = URL(fileURLWithPath: args.count > 2 ? args[2] : "lab.mp4")
let seed = args.count > 3 ? UInt64(args[3]) ?? 7 : 7
let input = FilmDemo.notebook(days: 35, seed: seed, light: args.contains("light"))
let script = FilmScript(input, calendar: Calendar(identifier: .gregorian))
var mark: CGImage?
if let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: "Pane/Resources/Assets.xcassets/MarkTight.imageset/mark-tight.png") as CFURL, nil) { mark = CGImageSourceCreateImageAtIndex(src, 0, nil) }
let start = Date()
switch style {
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
case "dusk", "night", "paper", "apptown":
    // The app's own looks, for side-by-side sheets with the experiments.
    var labels = FilmRenderer.Labels()
    labels.locale = Locale(identifier: "en_US")
    labels.markImage = mark
    labels.look = style == "apptown" ? .town : FilmLook(rawValue: style) ?? .night
    labels.folderNames = !args.contains("nofolders")
    try FilmVideo.write(FilmRenderer(script: script, labels: labels), to: out)
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
