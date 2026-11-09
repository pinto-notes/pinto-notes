import AVFoundation
import CoreGraphics
import CoreText
import Foundation

// Lab: shared bits for film-look experiments. Not app code.

struct LC {
    var r, g, b: Double
    init(_ r: Double, _ g: Double, _ b: Double) { self.r = r; self.g = g; self.b = b }
    init(_ hex: UInt32) { r = Double((hex >> 16) & 255) / 255; g = Double((hex >> 8) & 255) / 255; b = Double(hex & 255) / 255 }
    func mix(_ o: LC, _ t: Double) -> LC { let t = min(1, max(0, t)); return LC(r + (o.r - r) * t, g + (o.g - g) * t, b + (o.b - b) * t) }
    func cg(_ a: Double = 1) -> CGColor { CGColor(srgbRed: r, green: g, blue: b, alpha: a) }
}

func lsmooth(_ x: Double) -> Double { let c = min(1, max(0, x)); return c * c * (3 - 2 * c) }
func lerp(_ a: Double, _ b: Double, _ t: Double) -> Double { a + (b - a) * t }
/// A little overshoot on arrival.
func lbackOut(_ x: Double) -> Double { let c = min(1, max(0, x)) - 1; return 1 + c * c * (2.7 * c + 1.7) }

struct LRand {
    var s: UInt64
    init(_ seed: UInt64) { s = seed &* 0x9E37_79B9_7F4A_7C15 | 1 }
    mutating func next() -> Double {
        s ^= s << 13; s ^= s >> 7; s ^= s << 17
        return Double(s >> 11) / Double(1 << 53)
    }
}

func lhash(_ a: Int, _ b: Int = 0) -> Double {
    var r = LRand(UInt64(truncatingIfNeeded: a &* 7919 &+ b &* 104_729 &+ 13))
    _ = r.next(); _ = r.next()
    return r.next()
}

enum Kit {
    static func context(_ w: Int, _ h: Int, data: UnsafeMutableRawPointer? = nil, bytesPerRow: Int = 0) -> CGContext? {
        CGContext(data: data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: bytesPerRow, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                  bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
    }

    /// Fine paper grain, tiled over the frame.
    static let grain: CGImage = {
        let n = 256
        let ctx = context(n, n)!
        var r = LRand(77)
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        for i in 0..<(n * n) {
            let v = UInt8(118 + r.next() * 20)
            p[i * 4] = v; p[i * 4 + 1] = v; p[i * 4 + 2] = v; p[i * 4 + 3] = 255
        }
        return ctx.makeImage()!
    }()

    /// The same grain as faint light and dark specks, to lay over with plain blending (quicker).
    static let speckle: CGImage = {
        let n = 256
        let ctx = context(n, n)!
        var r = LRand(77)
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        for i in 0..<(n * n) {
            let v = r.next()
            // Premultiplied BGRA: light specks or dark ones, at most about 5% strong.
            let a = UInt8(abs(v - 0.5) * 2 * 9)
            let c: UInt8 = v > 0.5 ? a : 0
            p[i * 4] = c; p[i * 4 + 1] = c; p[i * 4 + 2] = c; p[i * 4 + 3] = a
        }
        return ctx.makeImage()!
    }()

    static func glow(_ c: LC) -> CGImage {
        let n = 96
        let ctx = context(n, n)!
        let g = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: [c.cg(1), c.cg(0.5), c.cg(0.16), c.cg(0.04), c.cg(0)] as CFArray, locations: [0, 0.2, 0.45, 0.72, 1])!
        let m = CGPoint(x: n / 2, y: n / 2)
        ctx.drawRadialGradient(g, startCenter: m, startRadius: 0, endCenter: m, endRadius: Double(n) / 2, options: [])
        return ctx.makeImage()!
    }

    nonisolated(unsafe) static var fonts: [String: CTFont] = [:]
    static func font(_ size: Double, _ weight: Double) -> CTFont {
        let key = "\(size)-\(weight)"
        if let f = fonts[key] { return f }
        let base = CTFontCreateUIFontForLanguage(.system, size, nil)!
        let desc = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base), [kCTFontTraitsAttribute: [kCTFontWeightTrait: weight]] as CFDictionary)
        let f = CTFontCreateWithFontDescriptor(desc, size, nil)
        fonts[key] = f
        return f
    }

    static func width(_ s: String, _ size: Double, _ weight: Double = 0) -> Double {
        let a = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight)])
        return CTLineGetTypographicBounds(CTLineCreateWithAttributedString(a), nil, nil, nil)
    }

    @discardableResult
    static func text(_ s: String, _ size: Double, _ weight: Double = 0, _ color: CGColor, at p: CGPoint, align: Double = 0, in ctx: CGContext) -> Double {
        let a = NSAttributedString(string: s, attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font(size, weight),
                                                           NSAttributedString.Key(kCTForegroundColorAttributeName as String): color])
        let line = CTLineCreateWithAttributedString(a)
        let w = CTLineGetTypographicBounds(line, nil, nil, nil)
        ctx.textPosition = CGPoint(x: p.x - w * align, y: p.y)
        CTLineDraw(line, ctx)
        return w
    }

    /// Writes `frames` frames drawn by `draw(ctx, index)` (origin bottom left) to an H.264 movie.
    static func write(to url: URL, width w: Int, height h: Int, fps: Int = 30, frames: Int, draw: (CGContext, Int) -> Void) throws {
        try? FileManager.default.removeItem(at: url)
        let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: h,
            AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 12_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
        ])
        input.expectsMediaDataInRealTime = false
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
        ])
        writer.add(input)
        writer.startWriting()
        writer.startSession(atSourceTime: .zero)
        for i in 0..<frames {
            while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
            var buffer: CVPixelBuffer?
            CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
            guard let buffer else { continue }
            CVPixelBufferLockBaseAddress(buffer, [])
            if let ctx = context(w, h, data: CVPixelBufferGetBaseAddress(buffer), bytesPerRow: CVPixelBufferGetBytesPerRow(buffer)) { draw(ctx, i) }
            CVPixelBufferUnlockBaseAddress(buffer, [])
            adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: CMTimeScale(fps)))
        }
        input.markAsFinished()
        let done = DispatchSemaphore(value: 0)
        writer.finishWriting { done.signal() }
        done.wait()
    }
}
