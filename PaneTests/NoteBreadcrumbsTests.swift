import SwiftData
import Foundation
import Testing
#if os(macOS)
import AppKit
import SwiftUI
#endif
@testable import Pane

/// The path beside back and forward, on the Mac too (WideLayoutTests has the rest, on iPhone).
@MainActor @Suite struct NoteBreadcrumbsTests {
    /// Three names pushed Share and ••• into the toolbar's overflow in a narrow window.
    @Test func aDeepFolderShowsItsTwoNearest() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let a = Folder(name: "A"), b = Folder(name: "B", parent: a), d = Folder(name: "D", parent: b)
        [a, b, d].forEach { c.mainContext.insert($0) }
        let note = c.mainContext.createNote(in: .folder(d.id), body: "Plan")
        #expect(NoteBreadcrumbs.path(note).map(\.name) == ["B", "D"])
        #expect(NoteBreadcrumbs.path(note).last?.scope == .folder(d.id))
    }

    #if os(macOS)
    /// The title joining the path once the big title scrolls away doesn't change the path's width,
    /// so the toolbar never moves "Notes" (Emil, 8 November 2026: "transition here is janky").
    @Test func theTitleFadesInWithoutMovingThePath() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let f = Folder(name: "Notes")
        c.mainContext.insert(f)
        let note = c.mainContext.createNote(in: .folder(f.id), body: "The loss of coding\nI never code by hand anymore.")
        let controller = EditorController()
        func width() -> CGFloat { NSHostingView(rootView: NoteBreadcrumbs(note: note, controller: controller, open: { _ in })).fittingSize.width }
        let before = width()
        controller.titleScrolledAway = true
        #expect(abs(width() - before) < 0.5, "the path is \(before) wide, then \(width()) with the title")
    }
    #endif

    #if os(macOS)
    /// The bar is the same for every note: a long title gave the note's items too little room,
    /// and macOS dropped the list's title and count and drew one grey band, note by note (Emil,
    /// 13 November 2026).
    @Test func everyNoteGetsTheSameWidthInTheBar() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let f = Folder(name: "Notes")
        c.mainContext.insert(f)
        let short = c.mainContext.createNote(in: .folder(f.id), body: "To Play")
        let long = c.mainContext.createNote(in: .folder(f.id), body: "My Current Goals (until Fri 18 Dec 2026) and a few more words")
        let room = NoteBreadcrumbs.room(column: 673, shared: false)
        func width(_ note: Note) -> CGFloat { NSHostingView(rootView: NoteBreadcrumbs(note: note, room: room, open: { _ in })).fittingSize.width }
        #expect(abs(width(short) - room) < 0.5)
        #expect(abs(width(long) - room) < 0.5)
    }

    /// The breadcrumbs take what the rest of the note's bar leaves, so a wider list never pushes
    /// the bar out of its columns (Emil, 13 November 2026).
    @Test func theBreadcrumbsLeaveTheRestOfTheBarItsRoom() {
        for shared in [false, true] {
            var last: CGFloat = 0
            for column in stride(from: CGFloat(360), through: 1400, by: 1) {
                let room = NoteBreadcrumbs.room(column: column, shared: shared)
                #expect(room == 0 || room + NoteBreadcrumbs.reserved(shared: shared) <= column, "\(column) wide: \(room)")
                #expect(room >= last, "never narrower in a wider column (\(column))")
                #expect(room <= NoteBreadcrumbs.titleWidth + 100)
                last = room
            }
        }
        // Emil's window with the list at its widest still shows where the note is.
        #expect(NoteBreadcrumbs.room(column: 600, shared: false) > 0)
        #expect(NoteBreadcrumbs.room(column: 360, shared: false) == 0)
    }
    #endif

    @Test func theEmptyPaneStaysQuietWhileANoteIsOnItsWay() {
        #expect(EmptyDetailView.showsWords(opening: nil))
        #expect(!EmptyDetailView.showsWords(opening: UUID()))
    }
}
