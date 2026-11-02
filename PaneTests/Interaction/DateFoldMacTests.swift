#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A note opens at its title, its date folded away above it, from the first frame drawn. The fold
/// used to be a scroll a turn after the note was laid out: the note showed for a frame with its
/// date, then jumped up, and clicking from note to note flickered (Emil, 11-02).
@MainActor @Suite(.serialized) struct DateFoldMacTests {
    @Test func aNoteIsFirstDrawnWithItsDateAlreadyFolded() async throws {
        guard DesignLook.readingPage else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Notes")
        var notes: [Note] = []
        for i in 0..<5 {
            // Short notes and long ones: a short note still folds (it gets the room to).
            let lines = (0..<(i % 2 == 0 ? 120 : 2)).map { "Line \($0) of the note" }.joined(separator: "\n")
            let n = ctx.createNote(in: .folder(folder.id), body: "Note \(i)\n\n\(lines)")
            n.updatedAt = .now.addingTimeInterval(-Double(i + 1) * 60)
            notes.append(n)
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        defer {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
        d.set(notes[4].id.uuidString, forKey: "lastNote")
        let w = MacWindowChromeTests.window(c, size: CGSize(width: 1180, height: 760))
        defer { w.close() }
        func editor() -> PaneTextView? { w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) } }
        func title(_ e: PaneTextView) -> String { String(e.string.prefix { $0 != "\n" }) }
        func check(_ name: String) {
            guard let e = editor(), let scroll = e.enclosingScrollView else { Issue.record("\(name): no editor"); return }
            #expect(scroll.contentInsets.top > 0, "the note is under the toolbar")
            let first = try? #require(e.firstDrawn, "\(name) was drawn")
            #expect(first.map { abs($0.top - PaneTextView.fold) < 0.5 } == true,
                    "\(name): first drawn at its title, scrolled \(PaneTextView.fold) past its date (was \(first?.top ?? -1))")
            #expect(first.map { $0.date < 0.01 } == true, "\(name): no date in the first frame (alpha \(first?.date ?? -1))")
            let now = scroll.contentView.bounds.origin.y + scroll.contentInsets.top
            #expect(abs(now - PaneTextView.fold) < 0.5, "\(name): still there after it settles (\(now))")
        }

        // The note open at launch.
        await MacWindowChromeTests.settle(w, 10)
        try #require(editor().map(title) == "Note 4", "the window opens Note 4")
        check("Note 4 at launch")

        // Each note chosen in the list: the window draws as soon as its pane is there.
        let table = try MacEmptyDetailTests.list(w)
        let rows = (0..<table.numberOfRows).filter { !table.isHeadingRow($0) }
        for i in [0, 1, 2, 3, 0] {
            table.selectRowIndexes(IndexSet(integer: rows[i]), byExtendingSelection: false)
            let clock = ContinuousClock(), start = clock.now
            while clock.now - start < .seconds(3), editor().map(title) != "Note \(i)" || editor()?.firstDrawn == nil {
                await Task.yield()
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
            }
            await MacWindowChromeTests.settle(w, 3)
            check("Note \(i)")
        }
    }
}
#endif
