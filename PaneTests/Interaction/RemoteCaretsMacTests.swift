#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Other people's carets on the Mac, in the real editor: a bar the line's height where their
/// insertion point is, their name on a flag, their selection tinted behind the text, and none of
/// it in the way of a click.
@MainActor @Suite(.serialized) struct RemoteCaretsMacTests {
    static let sara = CollabGallery.sara

    @Test func aCaretSitsOnItsCharacterAndMovesWithTheText() async throws {
        let h = await EditorHarness("Team offsite\nAgenda\nBring snacks\n", dark: false)
        let at = ("Team offsite\nAgenda\nBring " as NSString).length
        h.view.showRemoteCarets([RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: at, length: 6))])
        await h.settle()
        let v = try #require(h.view.caretViews[Self.sara])
        let rect = try #require(h.view.remoteCaretRect(at: at))
        #expect(abs(v.bar.frame.minX - (rect.minX - 1)) < 0.5 && v.bar.frame.width == 2)
        #expect(v.bar.frame.height > 10 && abs(v.bar.frame.height - rect.height) < 0.5)
        #expect(v.flag.stringValue == "Sara" && v.flag.alphaValue == 1)
        // The flag sits on the caret's top, its left edge on the caret: it labels this line.
        #expect(abs(v.flag.frame.maxY - v.bar.frame.minY) < 0.5 && abs(v.flag.frame.minX - v.bar.frame.minX) < 0.5)
        // Her selection ("snacks") is tinted, solid.
        #expect(h.view.remoteSelections.count == 1 && !(h.view.remoteSelections.first?.rects.isEmpty ?? true))
        #expect(h.view.remoteSelections.first?.color.alphaComponent == 1)
        // Clicks go through to the text.
        let centre = NSPoint(x: v.bar.frame.midX, y: v.bar.frame.midY)
        #expect(h.view.hitTest(h.view.convert(centre, to: h.view.superview)) === h.view)

        // A line arrives above: the session hands the new range, and the bar goes to it in the same pass.
        h.view.syncExternal("Team offsite\nLunch\nAgenda\nBring snacks\n")
        let moved = ("Team offsite\nLunch\nAgenda\nBring " as NSString).length
        h.view.showRemoteCarets([RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: moved, length: 0))])
        let after = try #require(h.view.remoteCaretRect(at: moved))
        #expect(abs(v.bar.frame.minY - after.minY) < 0.5 && after.minY > rect.minY)
        #expect(h.view.remoteSelections.isEmpty)

        // She leaves: her caret goes.
        h.view.showRemoteCarets([])
        #expect(h.view.caretViews.isEmpty && v.bar.superview == nil)
    }

    /// On the first line too, the flag sits above the caret.
    @Test func onTheFirstLineTheFlagIsAbove() async throws {
        let h = await EditorHarness("Team offsite\nAgenda\n")
        h.view.showRemoteCarets([RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: 4, length: 0))])
        await h.settle()
        let v = try #require(h.view.caretViews[Self.sara])
        #expect(v.flag.frame.maxY <= v.bar.frame.minY)
    }

    /// The name fades after they stop; the bar stays.
    @Test func theNameFadesTheCaretStays() async throws {
        let h = await EditorHarness("Team offsite\nAgenda\n")
        h.view.showRemoteCarets([RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: 15, length: 0), showsName: false)])
        try? await Task.sleep(for: .seconds(0.9))
        let v = try #require(h.view.caretViews[Self.sara])
        #expect(v.flag.alphaValue < 0.05 && v.bar.superview != nil)
    }

    /// The flag is small (16 pt, 11 pt type, 4 pt corners), gone once they've been still a moment,
    /// and back while the pointer is over their caret.
    @Test func theFlagIsSmallAndShowsOnHover() async throws {
        let h = await EditorHarness("Team offsite\nAgenda\nBring snacks\n")
        let caret = RemoteCaret(id: Self.sara, name: "Sara", color: CollabSession.color(for: Self.sara), range: NSRange(location: 16, length: 0), showsName: false)
        h.view.showRemoteCarets([caret])
        try? await Task.sleep(for: .seconds(0.4))
        let v = try #require(h.view.caretViews[Self.sara])
        #expect(v.flag.frame.height == 16 && v.flag.font?.pointSize == 11 && v.flag.layer?.cornerRadius == 4)
        #expect(v.flag.alphaValue < 0.05)
        h.view.hoverCaret(at: CGPoint(x: v.bar.frame.midX + 2, y: v.bar.frame.midY))
        try? await Task.sleep(for: .seconds(0.4))
        #expect(h.view.hoveredCaret == Self.sara && v.flag.alphaValue > 0.95)
        h.view.hoverCaret(at: nil)
        try? await Task.sleep(for: .seconds(0.4))
        #expect(v.flag.alphaValue < 0.05)
    }
}
#endif
