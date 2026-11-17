// New App's glyph, app.corner.plus, as an SF Symbols template the asset catalog takes
// (Pane/Resources/Assets.xcassets/app.corner.plus.symbolset). It isn't one of the system's symbols.
//
//   swiftc -o /tmp/glyph scripts/glyphs/app-corner-plus.swift && /tmp/glyph \
//     Pane/Resources/Assets.xcassets/app.corner.plus.symbolset/app.corner.plus.svg
//
// The glyph is drawn at 20 x 20 with a 1.25 stroke, round caps and joins (the paths below). A
// symbol is filled shapes, so the strokes are outlined here (Core Graphics). At the template's 100
// points it's 6.25 units a point: the 20-point box a 16-point toolbar symbol takes, and the system
// symbols' regular stroke (8 units). Its square sits where the system's `app` square sits (centred
// 35 units above the baseline), with 4.5 units each side, as the square symbols have. One design
// (Regular, medium): other weights and scales use it.
import CoreGraphics
import Foundation

let paths = [
    "M10.2 4.625L7.119 4.625C4.165 4.625 3.175 5.615 3.175 8.569L3.175 13.281C3.175 16.235 4.165 17.225 7.119 17.225L11.831 17.225C14.785 17.225 15.775 16.235 15.775 13.281L15.775 10.2",
    "M12.65 4.75L18.65 4.75M15.65 7.75L15.65 1.75",
]
let k = 6.25, stroke = 1.25, bearing = 4.5, left = 1391.0
let centre = CGPoint(x: (3.175 + 15.775) / 2, y: (4.625 + 17.225) / 2)
func place(_ x: Double, _ y: Double) -> CGPoint { CGPoint(x: (x - centre.x) * k, y: (y - centre.y) * k - 35) }

/// Absolute M, L and C commands, as the drawing has.
func parse(_ d: String) -> CGPath {
    let p = CGMutablePath()
    let scanner = Scanner(string: d)
    scanner.charactersToBeSkipped = CharacterSet(charactersIn: " ,")
    var command: Character = "M"
    func n() -> Double { scanner.scanDouble() ?? 0 }
    while !scanner.isAtEnd {
        if let c = scanner.scanCharacter(), "MLCZ".contains(c) { command = c } else { scanner.currentIndex = scanner.string.index(before: scanner.currentIndex) }
        switch command {
        case "M": p.move(to: place(n(), n())); command = "L"
        case "L": p.addLine(to: place(n(), n()))
        case "C": let a = place(n(), n()), b = place(n(), n()), c = place(n(), n()); p.addCurve(to: c, control1: a, control2: b)
        case "Z": p.closeSubpath()
        default: break
        }
    }
    return p
}

func f(_ v: CGFloat) -> String {
    let s = String(format: "%.3f", Double(v))
    return s.hasSuffix(".000") ? String(s.dropLast(4)) : s
}

var d = ""
var bounds = CGRect.null
for s in paths {
    let outline = parse(s).copy(strokingWithWidth: stroke * k, lineCap: .round, lineJoin: .round, miterLimit: 10)
    bounds = bounds.union(outline.boundingBoxOfPath)
    outline.applyWithBlock { e in
        let p = e.pointee.points
        switch e.pointee.type {
        case .moveToPoint: d += "M\(f(p[0].x)) \(f(p[0].y))"
        case .addLineToPoint: d += "L\(f(p[0].x)) \(f(p[0].y))"
        case .addQuadCurveToPoint: d += "Q\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y))"
        case .addCurveToPoint: d += "C\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y)) \(f(p[2].x)) \(f(p[2].y))"
        case .closeSubpath: d += "Z"
        @unknown default: break
        }
    }
}
let width = bounds.width + 2 * bearing, origin = left + bearing - bounds.minX
let line = "fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;", margin = "fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
let svg = """
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3300" height="2200">
 <!--glyph: "", point size: 100.0, font version: "", template writer version: "138.0.0"-->
 <g id="Notes">
  <rect height="2200" id="artboard" style="fill:white;opacity:1" width="3300" x="0" y="0"/>
  <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;" transform="matrix(1 0 0 1 263 1800)">app.corner.plus (New App). Made by scripts/glyphs/app-corner-plus.swift.</text>
 </g>
 <g id="Guides">
  <line id="Baseline-S" style="\(line)" x1="263" x2="3036" y1="696" y2="696"/>
  <line id="Capline-S" style="\(line)" x1="263" x2="3036" y1="625.541" y2="625.541"/>
  <line id="Baseline-M" style="\(line)" x1="263" x2="3036" y1="1126" y2="1126"/>
  <line id="Capline-M" style="\(line)" x1="263" x2="3036" y1="1055.54" y2="1055.54"/>
  <line id="Baseline-L" style="\(line)" x1="263" x2="3036" y1="1556" y2="1556"/>
  <line id="Capline-L" style="\(line)" x1="263" x2="3036" y1="1485.54" y2="1485.54"/>
  <line id="left-margin-Regular-M" style="\(margin)" x1="\(f(left))" x2="\(f(left))" y1="1030.79" y2="1150.12"/>
  <line id="right-margin-Regular-M" style="\(margin)" x1="\(f(left + width))" x2="\(f(left + width))" y1="1030.79" y2="1150.12"/>
 </g>
 <g id="Symbols">
  <g id="Regular-M" transform="matrix(1 0 0 1 \(f(origin)) 1126)">
   <path d="\(d)"/>
  </g>
 </g>
</svg>

"""
FileManager.default.createFile(atPath: CommandLine.arguments[1], contents: Data(svg.utf8))
