import Foundation
import Testing
@testable import Pane

/// Deleting a shared note asks first and says what happens, as Notes does; other notes go
/// straight to Recently Deleted.
@MainActor @Suite struct SharedDeleteTests {
    static func note(_ title: String, shared: UUID?) -> Note {
        let n = Note(body: "\(title)\n")
        n.sharedNoteID = shared
        return n
    }

    @Test func yoursStopsBeingSharedAndSaysForWhom() throws {
        let n = Self.note("Team offsite", shared: nil)
        n.sharedNoteID = n.id
        let two = try #require(SharedDelete.ask([n]) { _ in ["Sara", "Jonas"] })
        #expect(two.title == "Delete \u{201C}Team offsite\u{201D}?" && two.button == "Delete")
        #expect(two.message == "It stops being shared, and it\u{2019}s removed for Sara and Jonas.")
        #expect(SharedDelete.ask([n]) { _ in ["Sara"] }?.message == "It stops being shared, and it\u{2019}s removed for Sara.")
        #expect(SharedDelete.ask([n]) { _ in ["Sara", "Jonas", "Emma", "Li"] }?.message == "It stops being shared, and it\u{2019}s removed for Sara and 3 others.")
        // Nobody known here yet (its document isn't open).
        #expect(SharedDelete.ask([n]) { _ in [] }?.message == "It stops being shared, and it\u{2019}s removed for everyone in it.")
    }

    @Test func oneSharedWithYouIsLeft() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Team offsite", shared: UUID())]) { _ in ["Emil"] })
        #expect(ask.title == "Delete \u{201C}Team offsite\u{201D}?" && ask.button == "Delete")
        #expect(ask.message == "You\u{2019}ll leave it. It stays for the others.")
    }

    @Test func ordinaryNotesDontAsk() {
        #expect(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Also mine", shared: nil)]) == nil)
        // In Recently Deleted already: "Delete forever?" asks instead.
        let trashed = Self.note("Gone", shared: UUID())
        trashed.trashedAt = .now
        #expect(SharedDelete.ask([trashed]) == nil)
    }

    @Test func severalWithASharedOneAskOnce() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Theirs", shared: UUID())]) { _ in [] })
        #expect(ask.title == "Delete 2 notes?" && ask.message.hasPrefix("Some are shared."))
    }
}
