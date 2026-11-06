import Automerge
import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// A shared note's version history comes from its own document: who wrote what and when, on every
/// device with no server, and a restore goes to everyone as a new edit.
@MainActor
@Suite struct SharedHistoryTests {
    let server = MemoryCollabServer()
    let emilID = UUID(), saraID = UUID()

    // MARK: Reading versions from the document

    private func edit(_ doc: Document, _ body: ObjId, _ text: String, _ message: String?, at seconds: Double) throws {
        try doc.spliceText(obj: body, start: doc.length(obj: body), delete: 0, value: text)
        doc.commitWith(message: message, timestamp: Date(timeIntervalSince1970: seconds))
    }

    private func runs(_ doc: Document) -> [CollabHistory.Run] {
        CollabHistory.runs(in: doc, me: emilID, start: Date(timeIntervalSince1970: 500), now: Date(timeIntervalSince1970: 100_000)) { _ in "Sara" }
    }

    private func document() throws -> (Document, ObjId) {
        let doc = Document(textEncoding: .utf16)
        return (doc, try doc.putObject(obj: .ROOT, key: "body", ty: .Text))
    }

    @Test func aPersonsTypingIsOneVersionUntilThePause() throws {
        let (doc, body) = try document()
        let me = CollabHistory.stamp(emilID)
        try edit(doc, body, "a", me, at: 1000)
        try edit(doc, body, "b", me, at: 1100)
        try edit(doc, body, "c", me, at: 1100 + CollabHistory.burst + 1)
        let list = runs(doc)
        #expect(list.count == 2)
        #expect(list[0].version.isCurrent && !list[1].version.isCurrent)
        #expect(list[1].version.author == .you(device: nil))
        #expect(try doc.textAt(obj: body, heads: list[1].heads) == "ab")
    }

    @Test func someoneElsesEditAfterAPauseIsItsOwnVersionUnderTheirName() throws {
        let (doc, body) = try document()
        try edit(doc, body, "mine", CollabHistory.stamp(emilID), at: 1000)
        try edit(doc, body, " theirs", CollabHistory.stamp(saraID), at: 1000 + CollabHistory.together)
        let list = runs(doc)
        #expect(list.map(\.version.author) == [.person("Sara"), .you(device: nil)])
        #expect(try doc.textAt(obj: body, heads: list[1].heads) == "mine")
    }

    @Test func twoPeopleWritingTogetherAreOneVersionUnderBothNames() throws {
        let (doc, body) = try document()
        for i in 0..<6 {
            try edit(doc, body, "x", CollabHistory.stamp(i % 2 == 0 ? saraID : emilID), at: 1000 + Double(i))
        }
        let list = runs(doc)
        #expect(list.count == 1)
        #expect(list[0].version.author == .person("You and Sara"))
    }

    @Test func anAIsEditAndARestoreAlwaysStandAlone() throws {
        let (doc, body) = try document()
        let me = CollabHistory.stamp(emilID)
        try edit(doc, body, "a", me, at: 1000)
        try edit(doc, body, "b", "Sara's Claude", at: 1001)
        try edit(doc, body, "c", me, at: 1002)
        try edit(doc, body, "d", CollabHistory.stamp(saraID, restored: true), at: 1003)
        try edit(doc, body, "e", me, at: 1004)
        let list = runs(doc)
        #expect(list.count == 5)
        #expect(list[3].version.author == .ai("Sara's Claude"))
        #expect(list[1].version.restored && list[1].version.author == .person("Sara"))
        #expect(VersionHistoryModel.byline(HistoryEntry(version: list[1].version)) == "Restored by Sara")
    }

    @Test func aChangeWithoutAStampIsSomeoneAtTheTimeBeforeIt() throws {
        let (doc, body) = try document()
        try edit(doc, body, "old", nil, at: 0)
        try edit(doc, body, " new", CollabHistory.stamp(emilID), at: 2000)
        let list = runs(doc)
        #expect(list.last?.version.author == .person("Someone"))
        #expect(list.last?.version.madeAt == Date(timeIntervalSince1970: 500))
    }

    @Test func aWrongClockCantPutAVersionInTheFutureOrBeforeTheLast() throws {
        let (doc, body) = try document()
        try edit(doc, body, "a", CollabHistory.stamp(emilID), at: 5000)
        try edit(doc, body, "b", CollabHistory.stamp(saraID), at: 2000)
        try edit(doc, body, "c", CollabHistory.stamp(emilID), at: 900_000)
        let times = runs(doc).map { $0.version.madeAt.timeIntervalSince1970 }
        #expect(times.first == 100_000)
        #expect(times == times.sorted(by: >))
    }

    // MARK: Two people

    private func device(_ user: UUID, name: String) throws -> (store: CollabStore, context: ModelContext, container: ModelContainer) {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { SymmetricKey(size: .bits256) }, book: CollabKeyBook(account: user, defaults: UserDefaults(suiteName: UUID().uuidString)!))
        store.context = container.mainContext
        return (store, container.mainContext, container)
    }

    private func sharedNote(access: ShareState.Access = .edit) async throws -> (mine: CollabSession, theirs: CollabSession, note: Note, history: NoteHistory, clock: Clock) {
        let emilID = server.account("Emil"), saraID = server.account("Sara")
        let emil = try device(emilID, name: "Emil"), sara = try device(saraID, name: "Sara")
        retained.append(emil.container); retained.append(sara.container)
        let note = Note(body: "Plan\n\nFirst draft\n")
        emil.context.insert(note)
        try await emil.store.setAccess(access, for: note)
        #expect(await sara.store.join(try #require(emil.store.linkURL(note))))
        await server.eventually { server.channelCount(note.id) == 2 }
        let mine = try #require(emil.store.session(for: note.id))
        let theirs = try #require(sara.store.session(for: sara.context.pointer(forShared: note.id)!.id))
        let clock = Clock()
        mine.now = { clock.date }
        theirs.now = { clock.date }
        let base = NoteHistory(store: EmptyHistoryStore(), context: emil.context, sync: nil)
        retainedStores.append((emil.store, sara.store))
        return (mine, theirs, note, base.forShared(mine), clock)
    }

    final class Clock { var date = Date.now }
    private let box = Retained()
    private final class Retained { var containers: [ModelContainer] = []; var stores: [(CollabStore, CollabStore)] = [] }
    private var retained: [ModelContainer] { get { box.containers } nonmutating set { box.containers = newValue } }
    private var retainedStores: [(CollabStore, CollabStore)] { get { box.stores } nonmutating set { box.stores = newValue } }

    @Test func restoringAnEarlierVersionReachesEveryoneAndCanBeGoneBackOn() async throws {
        let (mine, theirs, note, history, clock) = try await sharedNote()
        clock.date += 60
        mine.local("Plan\n\nMy paragraph\n", selection: nil)
        await server.settle()
        await server.eventually { theirs.text == mine.text }
        clock.date += 60
        theirs.local("Plan\n\nSara rewrote it\n", selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text }
        await mine.refreshMembers()

        let model = VersionHistoryModel(note: note, history: history)
        await model.load()
        let versions = model.entries.map(\.version)
        #expect(versions[0].isCurrent)
        #expect(versions[0].author == .person("Sara"))
        #expect(model.canRestore)
        // The newest earlier version is the one offered first.
        #expect(model.previewText == "Plan\n\nMy paragraph\n")
        #expect(!model.sameAsNow)

        clock.date += 60
        #expect(await model.restore())
        #expect(mine.text == "Plan\n\nMy paragraph\n")
        await server.settle()
        await server.eventually { theirs.text == mine.text }
        #expect(theirs.text == "Plan\n\nMy paragraph\n")

        // The rewrite isn't lost: it's a version, and the restore says what it was.
        await model.load()
        #expect(model.entries[0].version.restored)
        #expect(VersionHistoryModel.byline(model.entries[0]) == "Restored by you")
        let store = history.store
        let older = try await store.body(of: note.id, version: model.entries[1].version.version)
        #expect(older == "Plan\n\nSara rewrote it\n")
    }

    @Test func aListedVersionKeepsItsTextWhenChangesArrive() async throws {
        let (mine, theirs, note, history, clock) = try await sharedNote()
        clock.date += 60
        mine.local("Plan\n\nOne\n", selection: nil)
        clock.date += 60
        await server.settle()
        await server.eventually { theirs.text == mine.text }
        theirs.local("Plan\n\nTwo\n", selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text }
        let versions = try await history.store.versions(of: note.id)
        let earlier = try #require(versions.first { !$0.isCurrent })
        let before = try await history.store.body(of: note.id, version: earlier.version)
        clock.date += 60
        theirs.local("Plan\n\nThree\n", selection: nil)
        await server.settle()
        await server.eventually { mine.text == theirs.text }
        #expect(try await history.store.body(of: note.id, version: earlier.version) == before)
    }

    @Test func someoneWhoCanOnlyViewCanLookBackButNotRestore() async throws {
        let (mine, theirs, note, _, clock) = try await sharedNote(access: .view)
        clock.date += 60
        mine.local("Plan\n\nOne\n", selection: nil)
        await server.settle()
        await server.eventually { theirs.text == mine.text }
        clock.date += CollabHistory.burst + 60
        mine.local("Plan\n\nTwo\n", selection: nil)
        await server.settle()
        await server.eventually { theirs.text == mine.text }

        let store = SharedHistoryStore(session: theirs)
        #expect(!store.canRestore)
        let versions = try await store.versions(of: note.id)
        let earlier = try #require(versions.first { !$0.isCurrent })
        #expect(try await store.body(of: note.id, version: earlier.version) == "Plan\n\nOne\n")
        await #expect(throws: HistoryError.self) { _ = try await store.restore(note: note.id, version: earlier.version) }
        #expect(theirs.text == "Plan\n\nTwo\n")
    }

    /// Shared notes type one change per keystroke, each now with a stamp: a long note's list is
    /// still one version a burst, and its stored size barely moves.
    @Test func aLongNotesHistoryStaysSmall() throws {
        let (doc, body) = try document()
        let stamp = CollabHistory.stamp(emilID)
        let plain = Document(textEncoding: .utf16)
        let plainBody = try plain.putObject(obj: .ROOT, key: "body", ty: .Text)
        for i in 0..<20_000 {
            try doc.spliceText(obj: body, start: doc.length(obj: body), delete: 0, value: "x")
            doc.commitWith(message: stamp, timestamp: Date(timeIntervalSince1970: 1_000_000 + Double(i)))
            try plain.spliceText(obj: plainBody, start: plain.length(obj: plainBody), delete: 0, value: "x")
            plain.commitWith(message: nil, timestamp: Date(timeIntervalSince1970: 0))
        }
        let list = CollabHistory.runs(in: doc, me: emilID, start: .distantPast, now: Date(timeIntervalSince1970: 2_000_000)) { _ in "Sara" }
        #expect(list.count == 1)
        // A snapshot has to fit `CollabSession.maxSnapshot`: the stamps add next to nothing.
        #expect(doc.save().count < plain.save().count + 1024)
    }
}
