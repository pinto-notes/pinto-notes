import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A folder shown as a gallery of cards (FolderGallery), as View as Gallery in Apple Notes: each
/// folder keeps its own choice on the device, never Recently Deleted, and the cards are the
/// folder's notes in the list's order with pinned ones first.
@MainActor @Suite struct FolderGalleryTests {
    let context: ModelContext

    init() throws {
        context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
    }

    @Test func eachFolderKeepsItsOwnChoiceOnTheDevice() {
        let defaults = MemoryDefaults()
        defaults.set(true, forKey: Experiment.gallery.key)
        let store = ListOrderStore(defaults: defaults)
        let recipes = Scope.folder(UUID()), work = Scope.folder(UUID())
        #expect(!store.showsGallery(recipes))
        store.setGallery(true, for: recipes)
        #expect(store.showsGallery(recipes) && !store.showsGallery(work))
        // Read again, as the next launch does.
        #expect(ListOrderStore(defaults: defaults).showsGallery(recipes))
        store.setGallery(false, for: recipes)
        #expect(!ListOrderStore(defaults: defaults).showsGallery(recipes))
    }

    /// Off in Settings › Experimental, no folder is a gallery; each keeps its choice for when it's on.
    @Test func theExperimentSwitchHidesEveryGallery() {
        let defaults = MemoryDefaults()
        let store = ListOrderStore(defaults: defaults)
        let recipes = Scope.folder(UUID())
        store.setGallery(true, for: recipes)
        #expect(!store.showsGallery(recipes))
        defaults.set(true, forKey: Experiment.gallery.key)
        #expect(store.showsGallery(recipes))
    }

    @Test func recentlyDeletedIsNeverAGallery() {
        let defaults = MemoryDefaults()
        defaults.set(true, forKey: Experiment.gallery.key)
        let store = ListOrderStore(defaults: defaults)
        store.setGallery(true, for: .trash)
        #expect(!store.showsGallery(.trash))
    }

    @Test func cardsAreTheFoldersNotesPinnedFirst() throws {
        let recipes = context.createFolder(named: "Recipes"), work = context.createFolder(named: "Work")
        let pasta = context.createNote(in: .folder(recipes.id), body: "🍋 Lemon pasta\n\n20 min.")
        pasta.updatedAt = .now
        let buns = context.createNote(in: .folder(recipes.id), body: "Kanelbullar\n\nMakes 24.")
        buns.updatedAt = .now.addingTimeInterval(-3600)
        buns.isPinned = true
        let gone = context.createNote(in: .folder(recipes.id), body: "Old soup")
        gone.trashedAt = .now
        _ = context.createNote(in: .folder(work.id), body: "Agenda")
        try context.save()
        let cards = FolderGallery.notes(in: .folder(recipes.id), library: LibraryNotes(), context: context, order: .standard)
        #expect(cards.map(\.title) == ["Kanelbullar", "🍋 Lemon pasta"])
        #expect(FolderGallery.title(of: .folder(recipes.id), context: context) == "Recipes")
    }
}

extension FolderGalleryTests {
    /// A card without a picture shows the note's own lines, as they read.
    @Test func aCardWithoutAPictureShowsTheNotesLines() {
        let body = "Shopping list\n\n![x.jpg|cover](pane-file:1)\n- [ ] Oat milk\n- [x] Lemons\n## Later\nBasil"
        #expect(GalleryFace.firstLines(of: body) == "Oat milk\nLemons\nLater\nBasil")
    }
}

#if os(macOS)
extension FolderGalleryTests {
    /// One way back in a note opened from the cards: the toolbar's Back, to the note before, then
    /// to the cards. No second arrow beside it.
    @Test func backLeadsToTheCardsOnceNoNoteIsBefore() {
        typealias Stage = NoteToolbarStage<EmptyView>
        #expect(Stage.backGoesToGallery(canGoBack: false, inGallery: true))
        #expect(!Stage.backGoesToGallery(canGoBack: true, inGallery: true))
        #expect(!Stage.backGoesToGallery(canGoBack: false, inGallery: false))
    }
}
#endif
