#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A note showing its app has no big title, so the bar names it ("Work › Doom") for as long as the
/// app shows. Before, the bar said only the folder (Emil, 15 November 2026: "it looks like it is
/// called 'work'. that is the folder obviously").
@MainActor @Suite(.serialized) struct AppNoteTitleInBarTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    @Test func theTitleShowsWhileAnAppShowsOrOnceTheBigTitleIsGone() {
        let controller = EditorController()
        #expect(!NoteBreadcrumbs.showsTitle(nil), "no controller: the iPad's path, folders only")
        #expect(!NoteBreadcrumbs.showsTitle(controller), "a note's text at the top: its big title says it")
        controller.showingApp = true
        #expect(NoteBreadcrumbs.showsTitle(controller), "an app: the bar names the note")
        controller.showingApp = false
        controller.titleScrolledAway = true
        #expect(NoteBreadcrumbs.showsTitle(controller), "text scrolled past its title, as before")
    }

    /// The iPhone has no path beside a list button and its back button shows no folder name, so its
    /// bar carries the path (Work › Doom) while a note shows its app; text notes and the iPad don't.
    @Test func theIPhoneBarCarriesThePathWhileAnAppShows() {
        #expect(NoteBreadcrumbs.inPhoneBar(showingApp: true, compact: true), "an app on the iPhone: Work › Doom")
        #expect(!NoteBreadcrumbs.inPhoneBar(showingApp: false, compact: true), "text: its big title says it")
        #expect(!NoteBreadcrumbs.inPhoneBar(showingApp: true, compact: false), "the iPad shows the path beside the list button")
    }

    /// The real note pane, offscreen: opening a note that shows its app tells the bar, and the path
    /// then reads Work, Doom; the next note, plain text, takes the title away again.
    @Test func openingAnAppNoteNamesItInTheBar() async throws {
        let c = try Self.container()
        let work = Folder(name: "Work")
        c.mainContext.insert(work)
        let doom = c.mainContext.createNote(in: .folder(work.id), body: "Doom")
        let groceries = c.mainContext.createNote(in: .folder(work.id), body: "Groceries\nOat milk")
        NotePageStore.shared[doom.id] = .init(html: "<!doctype html><p>Doom</p>", by: "Codex", at: .now)
        defer { NotePageStore.shared[doom.id] = nil }
        let controller = EditorController()

        func open(_ note: Note) async -> OffscreenAX {
            let ax = OffscreenAX(NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }
                .modelContainer(c), size: CGSize(width: 700, height: 500))
            await ax.settle(800)
            return ax
        }
        func bar(_ note: Note) async -> OffscreenAX {
            let ax = OffscreenAX(NoteBreadcrumbs(note: note, controller: controller, open: { _ in }), size: CGSize(width: 400, height: 40))
            await ax.settle(200)
            return ax
        }

        let app = await open(doom)
        #expect(controller.showingApp, "the Doom note shows its app")
        let appBar = await bar(doom)
        #expect(appBar.find("note.crumb.0")?.text.contains("Work") == true)
        #expect(appBar.find("note.crumb.title")?.text.contains("Doom") == true, "the bar says Work › Doom, not just Work")
        appBar.close(); app.close()

        let text = await open(groceries)
        #expect(!controller.showingApp, "a plain note: the next pane resets it")
        let textBar = await bar(groceries)
        #expect(textBar.find("note.crumb.title") == nil, "its big title is on the page, so the bar shows only the folder")
        textBar.close(); text.close()
    }
}
#endif
