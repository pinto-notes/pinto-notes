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

    @Test func yoursStopsBeingSharedForEveryone() throws {
        let n = Self.note("Team offsite", shared: nil)
        n.sharedNoteID = n.id
        let ask = try #require(SharedDelete.ask([n]))
        #expect(ask.title == "Delete \u{201C}Team offsite\u{201D} for everyone?")
        #expect(ask.message.contains("People in this note lose it") && ask.message.contains("Recently Deleted"))
        #expect(ask.button == "Delete")
    }

    @Test func oneSharedWithYouIsLeft() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Team offsite", shared: UUID())]))
        #expect(ask.title == "Leave \u{201C}Team offsite\u{201D}?" && ask.button == "Leave")
        #expect(ask.message == ShareCopy.leaveMessage)
    }

    @Test func ordinaryNotesDontAsk() {
        #expect(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Also mine", shared: nil)]) == nil)
        // In Recently Deleted already: "Delete forever?" asks instead.
        let trashed = Self.note("Gone", shared: UUID())
        trashed.trashedAt = .now
        #expect(SharedDelete.ask([trashed]) == nil)
    }

    @Test func severalWithASharedOneAskOnce() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Theirs", shared: UUID())]))
        #expect(ask.title == "Delete 2 notes?" && ask.message.hasPrefix("Some are shared."))
    }
}
