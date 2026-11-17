import Foundation
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Format › Divider: `---` on its own line, drawn as a hairline (Emil, 3 November 2026).
@Suite struct DividersTests {
    func run(_ text: String, _ at: Int) -> (String, Int) {
        let e = Dividers.insert(in: text, selection: NSRange(location: at, length: 0))
        return ((text as NSString).replacingCharacters(in: e.range, with: e.replacement), e.caret)
    }

    @Test func underALineOfText() {
        // A blank line between, or Markdown makes the text a heading.
        // And one after, so the next line doesn't sit tight under it, as a typed divider has.
        #expect(run("Plan\n\nMilk", 10) == ("Plan\n\nMilk\n\n---\n\n", 17))
        // From the middle of the line it still goes under the whole line.
        #expect(run("Plan\n\nMilk\nEggs", 7) == ("Plan\n\nMilk\n\n---\n\nEggs", 17))
        // A blank line after already: no second one.
        #expect(run("Plan\n\nMilk\n\nEggs", 7) == ("Plan\n\nMilk\n\n---\n\nEggs", 16))
    }

    @Test func onAnEmptyLine() {
        // Text above: a blank line comes first.
        #expect(run("Plan\n\nMilk\n", 11) == ("Plan\n\nMilk\n\n---\n\n", 17))
        // Already blank above: the empty line becomes the divider.
        #expect(run("Plan\n\n\nEggs", 6) == ("Plan\n\n---\nEggs", 10))
    }

    @Test func theCaretLandsOnTheLineAfter() {
        let (text, caret) = run("Plan\n\nMilk\nEggs", 10)
        #expect((text as NSString).substring(from: caret) == "Eggs")
    }

    @MainActor @Test func drawnAsALineAndTheTextAboveStaysBody() {
        let (text, _) = run("Plan\n\nMilk", 10)
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let ns = text as NSString
        let rule = ns.range(of: "---")
        #expect((storage.attribute(.paneLine, at: rule.location, effectiveRange: nil) as? LineDecoration)?.kind == .rule(editing: false))
        // The caret on it: marked, so the line starts after the dashes.
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: rule.location + 1, length: 0))
        #expect((storage.attribute(.paneLine, at: rule.location, effectiveRange: nil) as? LineDecoration)?.kind == .rule(editing: true))
        let milk = ns.range(of: "Milk")
        let font = storage.attribute(.font, at: milk.location, effectiveRange: nil) as? PFont
        #expect(font?.pointSize == MarkdownStyler().bodyFont.pointSize)
    }

    @Test func inTheFormatPanelBesideTheQuote() {
        #expect(FormatControl.rows.flatMap { $0 }.contains([.quote, .divider]))
        // Not in a code block, where `---` is code.
        var s = FormatState()
        s.monostyled = true
        #expect(!s.isEnabled(.divider))
        #expect(FormatState().isEnabled(.divider))
    }

    #if os(macOS)
    /// The line's grey once laid over the page: black in dark mode, white in light.
    private func onPage(_ color: NSColor, dark: Bool) -> CGFloat {
        var level: CGFloat = 0
        NSAppearance(named: dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance {
            let c = color.usingColorSpace(.sRGB)!
            let ground: CGFloat = dark ? 0 : 1
            level = c.redComponent * c.alphaComponent + ground * (1 - c.alphaComponent)
        }
        return level
    }

    /// On the pure black page the system separator (10% white) left the line all but invisible
    /// (Emil, 12 November 2026). It reads at least a quarter of the way to white, and stays a quiet
    /// grey in light mode.
    @Test func theLineShowsOnTheBlackPage() {
        #expect(onPage(.paneRule, dark: true) >= 0.24)
        #expect(onPage(.paneRule, dark: true) > onPage(.separatorColor, dark: true) * 2)
        let light = onPage(.paneRule, dark: false)
        #expect(light <= 0.88 && light >= 0.78)
    }
    #endif
}
