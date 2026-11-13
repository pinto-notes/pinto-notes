import CoreImage
import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Privacy mode in the editor (PrivacyMode): every paragraph blurred but the one you're writing
/// on, and the one under the pointer (on iPhone, under your finger). Drawn by the layout
/// fragments (DecoratedLayoutFragment), so the text itself is untouched: VoiceOver, Find and
/// copying read it as ever.
final class PrivacyVeil: @unchecked Sendable {
    private(set) var on = false
    /// The caret's paragraph (or a selection's paragraphs).
    private(set) var caret: NSRange?
    /// The paragraph under the pointer or your finger.
    private(set) var pointer: NSRange?

    /// The email blur's radius (PrivateBlur), so both blurs look alike. At 4, sentences and titles
    /// could still be read in the pictures (13 November 2026).
    static let radius: CGFloat = 8
    /// Below this, note text can be read through the blur (PrivacyModeTests guards it).
    static let minimumRadius: CGFloat = 8

    /// Whether the paragraph starting at `offset` is drawn blurred.
    func veils(_ offset: Int) -> Bool {
        on && !Self.holds(caret, offset) && !Self.holds(pointer, offset)
    }

    private static func holds(_ r: NSRange?, _ offset: Int) -> Bool {
        guard let r else { return false }
        return NSLocationInRange(offset, r) || offset == r.location
    }

    /// The paragraphs `range` touches, in `text`.
    static func paragraphs(_ range: NSRange, in text: NSString) -> NSRange {
        let start = min(range.location, text.length)
        return text.paragraphRange(for: NSRange(location: start, length: min(range.length, text.length - start)))
    }

    // Each returns the ranges to draw again: empty when nothing changed.

    func set(_ on: Bool, length: Int) -> [NSRange] {
        guard on != self.on else { return [] }
        self.on = on
        return [NSRange(location: 0, length: length)]
    }

    /// The caret or selection moved (nil: you're not editing).
    func setCaret(_ selection: NSRange?, in text: NSString) -> [NSRange] {
        let now = selection.map { Self.paragraphs($0, in: text) }
        guard now != caret else { return [] }
        defer { caret = now }
        return on ? [caret, now].compactMap { $0 } : []
    }

    /// The pointer is over the character at `offset` (nil: over no text).
    func setPointer(_ offset: Int?, in text: NSString) -> [NSRange] {
        let now = offset.map { Self.paragraphs(NSRange(location: $0, length: 0), in: text) }
        guard now != pointer else { return [] }
        defer { pointer = now }
        return on ? [pointer, now].compactMap { $0 } : []
    }

    // MARK: Drawing

    /// One for every fragment: making a Core Image context is the slow part.
    static let images = CIContext(options: [.cacheIntermediates: false])

    /// Draws `draw` blurred into `context` over `rect` (the fragment's surface, in its own
    /// coordinates, placed at `point` in a flipped context).
    static func drawBlurred(rect: CGRect, at point: CGPoint, in context: CGContext, cache: inout (key: String, image: CGImage)?, key: String,
                            _ draw: (CGContext) -> Void) {
        let device = context.userSpaceToDeviceSpaceTransform
        let scale = max(1, min(4, hypot(device.a, device.b)))
        let pad = radius * 3
        let area = rect.insetBy(dx: -pad, dy: -pad).integral
        let w = Int(ceil(area.width * scale)), h = Int(ceil(area.height * scale))
        guard w > 0, h > 0, w < 16384, h < 16384 else { return }
        let fullKey = "\(key)|\(w)x\(h)|\(scale)"
        let image: CGImage
        if let cache, cache.key == fullKey {
            image = cache.image
        } else {
            guard let space = CGColorSpace(name: CGColorSpace.sRGB),
                  let bitmap = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                                         bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
            else { return }
            // Flipped, as the fragment's own context is, with the fragment's origin where it falls.
            bitmap.scaleBy(x: scale, y: scale)
            bitmap.translateBy(x: 0, y: area.height)
            bitmap.scaleBy(x: 1, y: -1)
            bitmap.translateBy(x: -area.minX, y: -area.minY)
            #if os(macOS)
            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = NSGraphicsContext(cgContext: bitmap, flipped: true)
            draw(bitmap)
            NSGraphicsContext.restoreGraphicsState()
            #else
            UIGraphicsPushContext(bitmap)
            draw(bitmap)
            UIGraphicsPopContext()
            #endif
            guard let sharp = bitmap.makeImage() else { return }
            // Not clamped: the padding is transparent, so the blur fades out into the page.
            let input = CIImage(cgImage: sharp)
            let blurred = input.applyingGaussianBlur(sigma: Double(radius * scale)).cropped(to: input.extent)
            guard let made = images.createCGImage(blurred, from: input.extent) else { return }
            image = made
            cache = (fullKey, made)
        }
        context.saveGState()
        context.translateBy(x: point.x + area.minX, y: point.y + area.minY + area.height)
        context.scaleBy(x: 1, y: -1)
        context.draw(image, in: CGRect(x: 0, y: 0, width: area.width, height: area.height))
        context.restoreGState()
    }
}

/// Hears privacy mode turn on or off for one editor; gone with the editor.
@MainActor final class VeilWatcher: NSObject {
    private let run: @MainActor () -> Void
    init(_ run: @escaping @MainActor () -> Void) { self.run = run }
    @objc func fire() { run() }
}
