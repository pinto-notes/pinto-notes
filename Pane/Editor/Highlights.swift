import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

extension NSAttributedString.Key {
    /// Highlighted text (`==text==`), drawn with a highlighter behind it by `DecoratedLayoutFragment`.
    static let paneHighlight = NSAttributedString.Key("pane.highlight")
}

/// Highlights: Obsidian's `==text==`, shown with a soft yellow highlighter behind the text and
/// the `==` hidden at rest like bold's `**`.
enum Highlights {
    /// `==text==` on one line: the text doesn't start or end with a space, and `===` is not a mark.
    static let regex = try! NSRegularExpression(pattern: #"(?<![=\\])==(?=[^\s=])([^\n]*?[^\s=\\])==(?!=)"#)

    /// Each highlight in `range`: the whole match with its marks, and the text between them.
    static func spans(in text: String, range: NSRange? = nil) -> [(outer: NSRange, inner: NSRange)] {
        let ns = text as NSString
        let scope = range ?? NSRange(location: 0, length: ns.length)
        guard scope.length >= 5 else { return [] }
        return regex.matches(in: text, range: scope).map { m in
            (m.range, m.range(at: 1))
        }
    }

    /// The highlighter: the High contrast theme's yellow, softened halfway into white for the
    /// light page; its own deep yellow on black, under white text. Solid, never see-through.
    static let color: PColor = Palette.pair(0xFFF0A6, 0x4F4100)
}

extension MarkdownStyler {
    /// `==text==`: the text gets the highlighter, the marks hide (dimmed on the caret's line).
    /// Not in code.
    func styleHighlights(_ storage: NSTextStorage, in scope: NSRange, isActive: (NSRange) -> Bool, skip: [NSRange]) {
        let text = storage.string
        guard (text as NSString).substring(with: scope).contains("==") else { return }
        for s in Highlights.spans(in: text, range: scope) {
            if skip.contains(where: { NSIntersectionRange($0, s.outer).length > 0 }) { continue }
            // Hidden lines (a table's source under its grid) stay hidden.
            if (storage.attribute(.foregroundColor, at: s.inner.location, effectiveRange: nil) as? PColor) == PColor.clear { continue }
            storage.addAttribute(.paneHighlight, value: true, range: s.inner)
            let look: [NSAttributedString.Key: Any] = isActive(s.outer)
                ? [.foregroundColor: PColor.paneTertiary]
                : [.font: PFont.systemFont(ofSize: 0.01), .foregroundColor: PColor.clear]
            storage.addAttributes(look, range: NSRange(location: s.outer.location, length: 2))
            storage.addAttributes(look, range: NSRange(location: NSMaxRange(s.inner), length: 2))
        }
    }
}

extension DecoratedLayoutFragment {
    /// Whether the paragraph has highlighted text.
    var hasHighlights: Bool {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 0 else { return false }
        var found = false
        p.attributedString.enumerateAttribute(.paneHighlight, in: NSRange(location: 0, length: p.attributedString.length)) { v, _, stop in
            if v != nil { found = true; stop.pointee = true }
        }
        return found
    }

    /// The highlighter's rectangles, one per highlighted run on each line it wraps over, in this
    /// fragment's coordinates.
    func highlightRects() -> [CGRect] {
        guard let p = textElement as? NSTextParagraph else { return [] }
        let text = p.attributedString
        var out: [CGRect] = []
        text.enumerateAttribute(.paneHighlight, in: NSRange(location: 0, length: text.length)) { v, r, _ in
            guard v != nil else { return }
            let font = text.attribute(.font, at: r.location, effectiveRange: nil) as? PFont ?? PFont.systemFont(ofSize: EditorMetrics.body)
            for line in textLineFragments {
                let span = NSIntersectionRange(line.characterRange, r)
                guard span.length > 0 else { continue }
                let x0 = line.typographicBounds.minX + line.locationForCharacter(at: span.location).x
                let x1 = line.typographicBounds.minX + line.locationForCharacter(at: NSMaxRange(span)).x
                guard x1 > x0 else { continue }
                let baseline = line.typographicBounds.minY + line.glyphOrigin.y
                let top = baseline - font.ascender - 1
                let bottom = baseline - font.descender + 1
                out.append(CGRect(x: x0 - 2, y: top, width: x1 - x0 + 4, height: bottom - top))
            }
        }
        return out
    }

    func drawHighlights(at o: CGPoint, in ctx: CGContext) {
        ctx.setFillColor(Highlights.color.cgColor)
        for rect in highlightRects() {
            let r = rect.offsetBy(dx: o.x, dy: o.y)
            ctx.addPath(CGPath(roundedRect: r, cornerWidth: 3, cornerHeight: 3, transform: nil))
            ctx.fillPath()
        }
    }
}
