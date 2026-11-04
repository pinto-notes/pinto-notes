import Foundation
import SwiftData
import Testing
@testable import Pane

/// Edits from outside the editor (Siri, the widget, the share sheet) on a shared note
/// (Pane/Collab/NoteWrites.swift). They wrote `note.body` alone: the other person never got
/// them, and the document's next change took them out of your own copy too. Now they go into
/// the document as your edit.
extension NetworkFaults.SharedLibraryTests {
    @Test func siriAddingToASharedListReachesTheOtherPersonAndStays() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, emilSession) = try await shared("Groceries\n- [ ] Bread", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        _ = try #require(sara.library.session(for: mine))

        let outcome = NoteWrites.change(mine, library: sara.library) { Checklist.adding("Milk", to: $0) }
        #expect(outcome == .changed)
        #expect(mine.body.contains("Milk"))
        await waitUntil { emilSession.text.contains("Milk") }
        #expect(emilSession.text.contains("- [ ] Milk"), "the other person gets it")

        // Emil types after it: Sara's copy keeps the milk (it went into the document, not over it).
        type("\n- [ ] Eggs", in: emilSession)
        await waitUntil { mine.body.contains("Eggs") }
        #expect(mine.body.contains("Milk") && mine.body.contains("Eggs"))
    }

    @Test func aWidgetTickOnASharedNoteGoesThroughItsDocument() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, emilSession) = try await shared("Packing\n- [ ] Passport\n- [ ] Charger", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let session = try #require(sara.library.session(for: mine))

        let outcome = NoteWrites.change(mine, library: sara.library) { Checklist.setting(true, index: 0, text: "Passport", in: $0) ?? $0 }
        #expect(outcome == .changed)
        #expect(session.text.contains("- [x] Passport"))
        await waitUntil { emilSession.text.contains("[x] Passport") }
        #expect(emilSession.text.contains("[x] Passport"))
    }

    @Test func canViewRefusesAnOutsideEditAndLeavesTheTextAlone() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, _) = try await shared("Menu\n- [ ] Soup", on: emil)
        server.add(member, to: note.id, role: "viewer")
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "viewer")
        _ = try #require(sara.library.session(for: mine))

        let outcome = NoteWrites.change(mine, library: sara.library) { Checklist.adding("Bread", to: $0) }
        #expect(outcome == .viewOnly)
        #expect(mine.body == "Menu\n- [ ] Soup")
        #expect(server.updates(of: note.id).isEmpty)
    }

    @Test func aSharedNoteWithoutItsDocumentTakesNothing() async throws {
        let sara = try device(member)
        let note = sara.context.createNote(in: .all, body: "Trip\n- [ ] Tickets")
        note.sharedNoteID = UUID()
        // No library (signed out): nothing is written, so the caller keeps the change.
        #expect(NoteWrites.change(note, library: nil) { $0 + "\n- [ ] Hotel" } == .notReady)
        #expect(note.body == "Trip\n- [ ] Tickets")
    }

    @Test func anOrdinaryNoteIsWrittenAsBefore() throws {
        let sara = try device(member)
        let note = sara.context.createNote(in: .all, body: "Ideas")
        #expect(NoteWrites.change(note, library: sara.library) { $0 + "\nOne more" } == .changed)
        #expect(note.body == "Ideas\nOne more")
        #expect(NoteWrites.change(note, library: sara.library) { $0 } == .unchanged)
    }
}
