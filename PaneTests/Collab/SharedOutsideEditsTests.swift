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

    /// Just after launch, before sharing starts (no library yet): a share-sheet item and a widget
    /// tick for a shared list wait, rather than becoming a new note or being dropped, and go in
    /// once sharing is ready (CollabStore.attach and each document opening call applyCaptures).
    @Test func capturesForASharedNoteWaitForSharingToStart() async throws {
        let tmp = FileManager.default.temporaryDirectory.appending(path: "captures-\(UUID())")
        Inbox.rootOverride = tmp.appending(path: "Inbox")
        ChecklistShelf.rootOverride = tmp.appending(path: "Shelf")
        defer { Inbox.rootOverride = nil; ChecklistShelf.rootOverride = nil; try? FileManager.default.removeItem(at: tmp) }
        let emil = try device(owner), sara = try device(member)
        let (note, emilSession) = try await shared("Groceries\n- [ ] Bread", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")

        try Inbox.add(markdown: "Oat milk", files: [], note: mine.id)
        ChecklistShelf.tick(note: mine.id, index: 0, text: "Bread", done: true)

        // Cold start: no library.
        sara.context.applyCaptures(library: nil)
        #expect(Inbox.pending().count == 1, "the share sheet's item waits")
        #expect(ChecklistShelf.ticks().count == 1, "the tick waits")
        #expect(mine.body == "Groceries\n- [ ] Bread")
        let notes = try sara.context.fetch(FetchDescriptor<Note>())
        #expect(!notes.contains { $0.body.contains("Oat milk") }, "no new note for it")

        // Sharing is ready.
        sara.context.applyCaptures(library: sara.library)
        #expect(Inbox.pending().isEmpty && ChecklistShelf.ticks().isEmpty)
        #expect(mine.body.contains("Oat milk") && mine.body.contains("[x] Bread"), "\(mine.body)")
        await waitUntil { emilSession.text.contains("Oat milk") && emilSession.text.contains("[x] Bread") }
        #expect(emilSession.text.contains("Oat milk") && emilSession.text.contains("[x] Bread"), "\(emilSession.text)")
    }

    /// Siri waits for sharing to start (a few seconds at most) instead of saying the note isn't ready.
    @Test func siriWaitsForSharingToStart() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, _) = try await shared("Groceries", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        sara.library.closeAll()
        var available: SharedLibrary? = nil
        let started = ContinuousClock.now
        Task { @MainActor in try? await Task.sleep(for: .milliseconds(300)); available = sara.library }
        await NoteWrites.ready(mine, within: .seconds(3)) { available }
        #expect(ContinuousClock.now - started >= .milliseconds(250), "it waited for sharing")
        #expect(NoteWrites.change(mine, library: sara.library) { $0 + "\n- [ ] Milk" } == .changed)
    }

    /// A tap in a note you can't type in (persona council round 4): Recover only for a deleted
    /// note; a Can view note says so; a shared note still opening says it's opening.
    @Test func aTapInANoteYouCantEditSaysWhy() {
        #expect(SharedEditing.tap(trashed: true, shared: false, viewOnly: nil) == .recover)
        #expect(SharedEditing.tap(trashed: true, shared: true, viewOnly: true) == .recover)
        #expect(SharedEditing.tap(trashed: false, shared: true, viewOnly: true) == .viewOnly)
        #expect(SharedEditing.tap(trashed: false, shared: true, viewOnly: nil) == .opening)
        #expect(SharedEditing.tap(trashed: false, shared: true, viewOnly: false) == .none)
        #expect(SharedEditing.tap(trashed: false, shared: false, viewOnly: nil) == .none)
        #expect(SharedEditing.opening == "Opening the shared note\u{2026}")
    }

    /// A shared note drawn before sharing started finds its document when it opens, and is
    /// editable then, without leaving the note (persona council round 5).
    @Test func aNoteOpenedBeforeSharingStartsFindsItsDocument() async throws {
        let emil = try device(owner), sara = try device(member)
        let (note, _) = try await shared("Groceries", on: emil)
        server.add(member, to: note.id)
        let mine = try await sara.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        var ready = false, waits = 0
        Task { @MainActor in try? await Task.sleep(for: .milliseconds(300)); ready = true }
        let found = await SharedEditing.waitForSession(every: .milliseconds(50), { ready ? sara.library.session(for: mine) : nil },
                                                       whileWaiting: { waits += 1 })
        #expect(found != nil && waits >= 3, "waited \(waits) times, then found it")
        #expect(SharedEditing.readOnly(trashed: false, shared: true, viewOnly: found?.isViewOnly) == false, "editable once found")
    }
}
