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
default:
    print("unknown style \(style)")
}
print("wrote \(out.path) in \(String(format: "%.1f", Date().timeIntervalSince(start)))s")
