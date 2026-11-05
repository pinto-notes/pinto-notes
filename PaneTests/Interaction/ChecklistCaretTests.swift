#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// The caret on a checklist item sits where its letters do, centred on them, from the first
/// letter on (Emil, 11-04: "when you start typing in a checklist, the caret is not vertically
/// centered").
@MainActor @Suite(.serialized) struct ChecklistCaretTests {
    /// The caret's rect at `location`, as the text view draws it, in its coordinates.
    static func caret(_ h: EditorHarness, at location: Int) -> CGRect? {
        let v = h.view
        guard let tlm = v.textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: location) else { return nil }
        var r: CGRect?
        tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .selection, options: [.rangeNotRequired]) { _, f, _, _ in r = f; return false }
        return r.map { $0.offsetBy(dx: v.textContainerOrigin.x, dy: v.textContainerOrigin.y) }
    }

    /// The typed letter's ink band: its line's baseline less the font's ascender to descender.
    static func letter(_ h: EditorHarness, at location: Int) -> CGRect? {
        let v = h.view
        guard let tlm = v.textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: location),
              let frag = tlm.textLayoutFragment(for: loc),
              let font = v.textStorage?.attribute(.font, at: location, effectiveRange: nil) as? NSFont else { return nil }
        let inFrag = tcm.offset(from: frag.rangeInElement.location, to: loc)
        guard let line = frag.textLineFragments.first(where: { NSLocationInRange(inFrag, $0.characterRange) }) ?? frag.textLineFragments.last else { return nil }
        let baseline = frag.layoutFragmentFrame.minY + line.typographicBounds.minY + line.glyphOrigin.y + v.textContainerOrigin.y
        return CGRect(x: 0, y: baseline - font.ascender, width: 1, height: font.ascender - font.descender)
    }

    /// An empty item's caret is the one you'll type with: as tall and as high as after the first
    /// letter, and that letter lands where an item's text starts.
    @Test func anEmptyItemsCaretIsWhereItsLettersGo() async {
        for prefix in ["- [ ] ", "- ", "1. "] {
            let empty = await EditorHarness("Plan\n- [ ] Milk\n" + prefix)
            let end = (empty.text as NSString).length
            await empty.select(end)
            let before = Self.caret(empty, at: end)
            await empty.type("E")
            let after = Self.caret(empty, at: end + 1)
            let typedX = Self.caret(empty, at: end)?.minX
            empty.close()
            guard let before, let after, let typedX else { Issue.record("no caret for \(prefix)"); continue }
            #expect(abs(before.height - after.height) < 0.5, "\(prefix): \(before.height) pt, then \(after.height) as you type")
            #expect(abs(before.minY - after.minY) < 0.5, "\(prefix): it doesn't jump (\(before.minY), then \(after.minY))")
            #expect(abs(before.minX - typedX) < 0.5, "\(prefix): the caret stands where the letter goes")
        }
        // And the marker still takes no more room than before: a checklist's text starts after
        // the circle and its gap, as in Notes.
        let h = await EditorHarness("Plan\n- [ ] Milk")
        defer { h.close() }
        let at = ("Plan\n- [ ] " as NSString).length
        let x = Self.caret(h, at: at)?.minX ?? 0
        let expected = h.view.textContainerOrigin.x + (h.view.textContainer?.lineFragmentPadding ?? 0) + EditorMetrics.checkSize + EditorMetrics.checkGap
        #expect(abs(x - expected) < 1, "text at \(x), circle and gap end at \(expected)")
    }
}
#endif
