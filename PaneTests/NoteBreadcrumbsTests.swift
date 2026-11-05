import SwiftData
import Foundation
import Testing
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

    @Test func theEmptyPaneStaysQuietWhileANoteIsOnItsWay() {
        #expect(EmptyDetailView.showsWords(opening: nil))
        #expect(!EmptyDetailView.showsWords(opening: UUID()))
    }
}
