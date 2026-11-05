import Foundation
import SwiftData
import Testing
@testable import Pane

/// Round 7 captures: "renovaton" gave No Results in a library with a "Kitchen renovation" note.
@MainActor @Suite struct TypoSearchTests {
    @Test func aWordALetterOffStillMatches() {
        #expect(TypoSearch.matches("renovaton", in: "Kitchen renovation\n\nBlue tiles"))
        #expect(TypoSearch.matches("renovatoin", in: "Kitchen renovation"), "two letters swapped")
        #expect(TypoSearch.matches("kitchn renovaton", in: "Kitchen renovation"), "each word on its own")
        #expect(TypoSearch.matches("Lisbn", in: "Lisbon trip"))
        #expect(!TypoSearch.matches("cat", in: "car park"), "short words must be exact")
        #expect(!TypoSearch.matches("renovaton", in: "Garden plans"))
        #expect(!TypoSearch.applies(to: "tea"))
    }

    @Test func aCloseMatchHoldsOneOfItsPiecesExactly() {
        for typo in ["renovaton", "renvation", "renovatoon", "xenovation"] {
            #expect(TypoSearch.probes(typo).contains { "renovation".contains($0) }, "\(typo): \(TypoSearch.probes(typo))")
        }
    }

    @Test func theListFindsANoteDespiteATypoOnlyWhenNothingMatchesAsTyped() throws {
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        _ = context.createNote(in: .all, body: "Kitchen renovation\n\nBlue tiles from the shop on Rua Augusta.")
        _ = context.createNote(in: .all, body: "Garden\n\nPlant the beans.")
        _ = context.createNote(in: .all, body: "Renovate the bathroom\n\nLater.")
        try context.save()
        let all = LibraryNotes().entries(in: context, order: .standard)
        func titles(_ q: String) -> [String] {
            NoteListView.found(q, in: all, listedBy: .standard, context: context).compactMap { $0.note(in: context)?.title }
        }
        #expect(titles("renovaton") == ["Kitchen renovation"])
        #expect(titles("Renovate") == ["Renovate the bathroom"], "an exact match shows alone")
        #expect(titles("Gardn") == ["Garden"])
        #expect(titles("zzzzzz").isEmpty)
    }
}
