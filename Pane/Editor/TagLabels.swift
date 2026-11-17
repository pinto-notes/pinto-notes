import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

extension NSAttributedString.Key {
    /// A tag shown as a label (`#needs-review`), with its colour (TagColor): `DecoratedLayoutFragment`
    /// draws the label's fill behind the text.
    static let paneTag = NSAttributedString.Key("pane.tag")
}

/// The room a label takes around its text: its padding, made in the line with kerning (on the
/// character before the tag and on the tag's last one), so the label never touches the words or
/// the label beside it.
enum TagLabel {
    static let padding: CGFloat = 3
    static let room: CGFloat = 5
}

extension DecoratedLayoutFragment {
    /// Whether the paragraph has a tag shown as a label.
    var hasTagLabels: Bool {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 1 else { return false }
        var found = false
        p.attributedString.enumerateAttribute(.paneTag, in: NSRange(location: 0, length: p.attributedString.length)) { v, _, stop in
            if v != nil { found = true; stop.pointee = true }
        }
        return found
    }

    /// Each label's rounded rectangle and colour, one per line a tag wraps over, in this
    /// fragment's coordinates. As tall as the line's capitals and descenders, with a little room
    /// either side, so the text reads as sitting in it.
    func tagLabelRects() -> [(CGRect, TagColor)] {
        guard let p = textElement as? NSTextParagraph else { return [] }
        let text = p.attributedString
        var out: [(CGRect, TagColor)] = []
        text.enumerateAttribute(.paneTag, in: NSRange(location: 0, length: text.length)) { v, r, _ in
            guard let color = v as? TagColor else { return }
            let font = text.attribute(.font, at: r.location, effectiveRange: nil) as? PFont ?? PFont.systemFont(ofSize: EditorMetrics.body)
            for line in textLineFragments {
                let span = NSIntersectionRange(line.characterRange, r)
                guard span.length > 0 else { continue }
                let x0 = line.typographicBounds.minX + line.locationForCharacter(at: span.location).x
                // The room after the tag (kerning on its last character) isn't in this position: the
                // label ends its padding past the last letter, inside that room.
                let x1 = line.typographicBounds.minX + line.locationForCharacter(at: NSMaxRange(span)).x
                guard x1 > x0 else { continue }
                let baseline = line.typographicBounds.minY + line.glyphOrigin.y
                let top = baseline - font.ascender
                let bottom = baseline - font.descender
                out.append((CGRect(x: x0 - TagLabel.padding, y: top, width: x1 - x0 + TagLabel.padding * 2, height: bottom - top), color))
            }
        }
        return out
    }

    func drawTagLabels(at o: CGPoint, in ctx: CGContext) {
        for (rect, color) in tagLabelRects() {
            let r = rect.offsetBy(dx: o.x, dy: o.y)
            let radius = r.height * 0.3
            ctx.addPath(CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil))
            ctx.setFillColor(color.fill.cgColor)
            ctx.fillPath()
        }
    }
}
