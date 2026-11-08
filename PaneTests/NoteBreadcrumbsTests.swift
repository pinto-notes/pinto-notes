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

    @Test func theEmptyPaneStaysQuietWhileANoteIsOnItsWay() {
        #expect(EmptyDetailView.showsWords(opening: nil))
        #expect(!EmptyDetailView.showsWords(opening: UUID()))
    }
}
