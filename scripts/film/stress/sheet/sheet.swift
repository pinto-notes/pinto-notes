import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

// Puts stills side by side with their names under them, to look at many films at once.
//   swift scripts/film/stress/sheet/sheet.swift OUT.png COLUMNS WIDTH a.png b.png ...

let args = CommandLine.arguments
guard args.count > 4 else { print("sheet OUT.png COLUMNS WIDTH images..."); exit(1) }
let out = URL(fileURLWithPath: args[1]), columns = Int(args[2])!, cell = Double(args[3])!
let files = Array(args.dropFirst(4))
let images = files.compactMap { f -> (String, CGImage)? in
    guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: f) as CFURL, nil), let i = CGImageSourceCreateImageAtIndex(s, 0, nil) else { return nil }
    return ((f as NSString).lastPathComponent.replacingOccurrences(of: ".png", with: ""), i)
}
guard let first = images.first?.1 else { exit(1) }
let ch = cell * Double(first.height) / Double(first.width), caption = 22.0, gap = 8.0
let rows = (images.count + columns - 1) / columns
let W = Int(Double(columns) * (cell + gap) + gap), H = Int(Double(rows) * (ch + caption + gap) + gap)
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(gray: 0.12, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high
let font = CTFontCreateWithName("Helvetica" as CFString, 14, nil)
for (k, (name, image)) in images.enumerated() {
    let x = gap + Double(k % columns) * (cell + gap)
    let y = Double(H) - gap - Double(k / columns + 1) * (ch + caption + gap) + gap
    ctx.draw(image, in: CGRect(x: x, y: y + caption, width: cell, height: ch))
    let line = CTLineCreateWithAttributedString(NSAttributedString(string: name, attributes: [
        NSAttributedString.Key(kCTFontAttributeName as String): font,
        NSAttributedString.Key(kCTForegroundColorAttributeName as String): CGColor(gray: 0.9, alpha: 1)]))
    ctx.textPosition = CGPoint(x: x + 2, y: y + 6)
    CTLineDraw(line, ctx)
}
let d = CGImageDestinationCreateWithURL(out as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(d, ctx.makeImage()!, nil)
CGImageDestinationFinalize(d)
