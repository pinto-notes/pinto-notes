import Foundation
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// How a note's lists and code blocks are laid out (Emil, 31 October 2026).
@MainActor @Suite struct NoteBlockLookTests {
    static func styled(_ text: String, caret: Int? = nil) -> NSTextStorage {
        let storage = NSTextStorage(string: text)
        var styler = MarkdownStyler()
        styler.firstLineIsTitle = true
        styler.apply(to: storage, active: NSRange(location: caret ?? (text as NSString).length, length: 0))
        return storage
    }

    static func decoration(_ storage: NSTextStorage, at text: String) -> LineDecoration? {
        let at = (storage.string as NSString).range(of: text).location
        return storage.attribute(.paneLine, at: at, effectiveRange: nil) as? LineDecoration
    }

    /// A colour as light mode draws it (the palette's colours are made anew on each call).
    static func light(_ c: PColor?) -> String {
        guard let c else { return "none" }
        #if os(macOS)
        var out = ""
        NSAppearance(named: .aqua)!.performAsCurrentDrawingAppearance { out = c.usingColorSpace(.sRGB).map { "\($0.redComponent) \($0.greenComponent) \($0.blueComponent)" } ?? "?" }
        return out
        #else
        return c.resolvedColor(with: UITraitCollection(userInterfaceStyle: .light)).description
        #endif
    }

    static func paragraph(_ storage: NSTextStorage, at text: String) -> NSParagraphStyle? {
        let at = (storage.string as NSString).range(of: text).location
        return storage.attribute(.paragraphStyle, at: at, effectiveRange: nil) as? NSParagraphStyle
    }

    /// "Why aren't the bullet points and numbered lists aligned visually?" Every marker ends on one
    /// edge, a number's dot, a bullet's and a dash's right side, and the text starts at the gutter.
    @Test func listMarkersEndOnOneEdge() throws {
        let s = Self.styled("List\n\n* Bullet\n- Dash\n1. Number\n")
        let end = MarkdownStyler.markerEnd
        let bullet = try #require(Self.decoration(s, at: "Bullet"))
        let dash = try #require(Self.decoration(s, at: "Dash"))
        #expect(abs(bullet.markerX + LineDecoration.bulletRadius - end) < 0.01, "a bullet ends on the edge: \(bullet.markerX)")
        #expect(abs(dash.markerX + LineDecoration.dashWidth / 2 - end) < 0.01, "a dash ends on the edge: \(dash.markerX)")
        let number = try #require(Self.paragraph(s, at: "1. Number"))
        let font = PFont.monospacedDigitSystemFont(ofSize: EditorMetrics.body, weight: .regular)
        let dot = number.firstLineHeadIndent + ("1." as NSString).size(withAttributes: [.font: font]).width
        #expect(abs(dot - end) < 0.5, "a number's dot ends on the edge: \(dot) for \(end)")
        for line in ["Bullet", "Dash", "1. Number"] {
            #expect(abs((Self.paragraph(s, at: line)?.headIndent ?? 0) - EditorMetrics.gutter) < 0.5, "\(line)'s text starts at the gutter")
        }
    }

    /// "Make code blocks a proper thing": its fences are padding, not text; the language is a grey
    /// label at the top right; the code is coloured by its language. With the caret on a fence it
    /// shows as written, so it can be edited.
    @Test func aCodeBlockIsABlock() throws {
        let text = "Note\n\n```swift\nlet greeting = \"Hello\"\n```\n\nAfter"
        let s = Self.styled(text)
        let ns = text as NSString
        let open = ns.range(of: "```swift").location
        let fence = s.attribute(.font, at: open, effectiveRange: nil) as? PFont
        #expect((fence?.pointSize ?? 99) < 1, "the opening fence is hidden: \(String(describing: fence))")
        let close = ns.range(of: "```", options: .backwards).location
        #expect(((s.attribute(.font, at: close, effectiveRange: nil) as? PFont)?.pointSize ?? 99) < 1, "the closing fence is hidden")
        let first = try #require(s.attribute(.paneLine, at: open, effectiveRange: nil) as? LineDecoration)
        #expect(first.kind == .code(first: true, last: false, label: nil, open: false), "no row of its own for the label: \(first.kind)")
        let paragraph = s.attribute(.paragraphStyle, at: open, effectiveRange: nil) as? NSParagraphStyle
        #expect(paragraph?.maximumLineHeight == MarkdownStyler.codePad, "the opening fence is the block's top padding, as tall as its bottom")
        let code = try #require(s.attribute(.paneLine, at: ns.range(of: "let greeting").location, effectiveRange: nil) as? LineDecoration)
        #expect(code.kind == .code(first: false, last: false, label: "swift"), "the label floats over the first line of code: \(code.kind)")
        let keyword = s.attribute(.foregroundColor, at: ns.range(of: "let").location, effectiveRange: nil) as? PColor
        let string = s.attribute(.foregroundColor, at: ns.range(of: "\"Hello\"").location, effectiveRange: nil) as? PColor
        #expect(Self.light(keyword) == Self.light(CodePalette.color(.keyword)), "a keyword is coloured")
        #expect(Self.light(string) == Self.light(CodePalette.color(.string)), "a string is coloured")

        // The caret on the fence: written out, no label.
        let editing = Self.styled(text, caret: open + 4)
        #expect(((editing.attribute(.font, at: open, effectiveRange: nil) as? PFont)?.pointSize ?? 0) > 5, "the fence shows while the caret is on it")
        let raw = try #require(editing.attribute(.paneLine, at: ns.range(of: "let greeting").location, effectiveRange: nil) as? LineDecoration)
        #expect(raw.kind == .code(first: false, last: false, label: nil), "no label while the fence is written out")
        let fenceLine = try #require(editing.attribute(.paneLine, at: open, effectiveRange: nil) as? LineDecoration)
        #expect(fenceLine.kind == .code(first: true, last: false, label: nil, open: true), "a written-out fence gets the block's padding past it")
        // The caret on a line of code: the whole block is being edited, both fences written out.
        let inside = Self.styled(text, caret: ns.range(of: "greeting").location)
        #expect(((inside.attribute(.font, at: open, effectiveRange: nil) as? PFont)?.pointSize ?? 0) > 5, "the opening fence shows while the block is edited")
        #expect(((inside.attribute(.font, at: close, effectiveRange: nil) as? PFont)?.pointSize ?? 0) > 5, "the closing fence shows while the block is edited")
        let insideCode = try #require(inside.attribute(.paneLine, at: ns.range(of: "let greeting").location, effectiveRange: nil) as? LineDecoration)
        #expect(insideCode.kind == .code(first: false, last: false, label: nil), "no label while the block is edited: \(insideCode.kind)")
        let closeLine = try #require(inside.attribute(.paneLine, at: close, effectiveRange: nil) as? LineDecoration)
        #expect(closeLine.kind == .code(first: false, last: true, label: nil, open: true), "the closing fence sits inside the block: \(closeLine.kind)")
        // The caret outside again: back at rest.
        let after = Self.styled(text, caret: ns.range(of: "After").location)
        #expect(((after.attribute(.font, at: close, effectiveRange: nil) as? PFont)?.pointSize ?? 99) < 1, "at rest when the caret leaves")
        // Not closed yet: its last line keeps the block's bottom padding.
        let unclosed = Self.styled("Note\n\n```python\ndef hello():\n    return 1", caret: 4)
        let last = try #require(Self.decoration(unclosed, at: "return"))
        #expect(last.kind == .code(first: false, last: true, label: nil, open: true), "\(last.kind)")
    }

    /// A language name after the fence picks the colours, by its usual names.
    @Test func fenceLanguages() {
        #expect(CodeLanguage(fence: "swift") == .swift)
        #expect(CodeLanguage(fence: "Python") == .python)
        #expect(CodeLanguage(fence: "bash") == .shell)
        #expect(CodeLanguage(fence: "typescript") == .javascript)
        #expect(CodeLanguage(fence: "") == .plain)
        #expect(CodeLanguage(fence: "klingon") == .plain)
    }
}
