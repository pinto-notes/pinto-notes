#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A click on a note is answered in the first pass after it (owner, 2026-10-12: a note that
/// appeared only once built read as a lost click): the pane shows the new title at once, and
/// the note's own view follows a turn later.
@MainActor @Suite(.serialized) struct NoteOpenFeedbackTests {
    /// How long the pass after a selection change takes, staged or not, on a long note.
    func firstPass(staged: Bool) async throws -> (ms: Double, opening: Bool) {
        RootView.stagesOpen = staged
        defer { RootView.stagesOpen = true }
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let long = ctx.createNote(in: .all, body: "Long note\n\n" + (0..<400).map { "- [ ] Item \($0) with **bold** and a [[Link \($0)]]" }.joined(separator: "\n"))
        let short = ctx.createNote(in: .all, body: "Short\n\nHello")
        try ctx.save()
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1100, height: 700), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let host = NSHostingView(rootView: RootView().modelContainer(c))
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(1))
        NoteOpener.shared.request = short.id
        try? await Task.sleep(for: .seconds(1))
        let drawnBefore = NoteOpening.drawn
        let start = ContinuousClock.now
        NoteOpener.shared.request = long.id
        host.layoutSubtreeIfNeeded()
        host.displayIfNeeded()
        let ms = Double((ContinuousClock.now - start).components.attoseconds) / 1e15 + Double((ContinuousClock.now - start).components.seconds) * 1000
        let opening = NoteOpening.drawn > drawnBefore
        try? await Task.sleep(for: .seconds(1))
        let settled = NoteOpening.drawn
        try? await Task.sleep(for: .milliseconds(300))
        #expect(NoteOpening.drawn == settled, "the placeholder is gone, not drawn again")
        return (ms, opening)
    }

    static func find(_ view: NSView, _ id: String) -> Bool {
        func walk(_ e: Any, _ depth: Int) -> Bool {
            guard depth < 40, let o = e as? NSObject else { return false }
            if (o.value(forKey: "accessibilityIdentifier") as? String) == id { return true }
            return ((o.value(forKey: "accessibilityChildren") as? [Any]) ?? []).contains { walk($0, depth + 1) }
        }
        return walk(view, 0)
    }

    @Test func theFirstPassAfterAClickIsShortAndShowsTheNewNote() async throws {
        let before = try await firstPass(staged: false)
        let after = try await firstPass(staged: true)
        print("PERF note open first pass: unstaged \(Int(before.ms)) ms, staged \(Int(after.ms)) ms")
        #expect(after.opening, "the placeholder is up in the first pass")
        #expect(after.ms < before.ms)
    }

    /// The placeholder as it looks once the lines are in, light and dark.
    @Test(arguments: [false, true])
    func picture(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        try await AppSnapshotTests.render(NoteOpening(title: "Health plan", date: "12 October 2026 at 19:42").frame(width: 600, height: 300),
                                          name: "mac-note-opening-\(dark ? "dark" : "light")", dark: dark, wait: 0.6)
    }
}
#endif
