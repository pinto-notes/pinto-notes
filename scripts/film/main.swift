import Foundation
import ImageIO
// Renders the notebook film from the demo notebook, with the app's own code:
//   scripts/film/render.sh OUT.mp4 [seed] [days] [town|night|paper] [light|heavy] [nofolders]
let args = CommandLine.arguments
let out = URL(fileURLWithPath: args.count > 1 ? args[1] : "film.mp4")
let seed = args.count > 2 ? UInt64(args[2]) ?? 7 : 7
let days = args.count > 3 ? Int(args[3]) ?? 35 : 35
let look = args.count > 4 ? FilmLook(rawValue: args[4]) ?? .night : .night
let input = FilmDemo.notebook(days: days, seed: seed, light: args.contains("light"), heavy: args.contains("heavy"))
let script = FilmScript(input, calendar: Calendar(identifier: .gregorian))
let s = script.stats
print("notes \(s.notes) links \(s.links) days \(s.days) active \(s.activeDays) ai \(s.ai ?? "-") \(Int(s.aiShare * 100))% ready \(FilmEligibility.isReady(input))")
var labels = FilmRenderer.Labels()
labels.locale = Locale(identifier: "en_US")
labels.look = look
labels.folderNames = !args.contains("nofolders")
let markURL = URL(fileURLWithPath: "Pane/Resources/Assets.xcassets/MarkTight.imageset/mark-tight.png")
if let src = CGImageSourceCreateWithURL(markURL as CFURL, nil) { labels.markImage = CGImageSourceCreateImageAtIndex(src, 0, nil) }
let start = Date()
try FilmVideo.write(FilmRenderer(script: script, labels: labels), to: out)
print("wrote \(out.path) in \(String(format: "%.1f", Date().timeIntervalSince(start)))s")
