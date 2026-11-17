import Foundation
import Testing
@testable import Pane

/// The whiteboard library's merge rules (CanvasLibraryContents), one device at a time: order,
/// renames on two devices, removal against rename, the first merge after the update, accounts and
/// Start fresh. LibrarySyncTests runs them across two devices and a server.
extension CanvasLibrarySyncTests {
    static func item(_ name: String? = nil, source: String? = nil, width: Double = 80, id: String = UUID().uuidString) -> CanvasLibraryItem {
        CanvasLibraryItem(id: id, name: name, source: source, elements: [shape(width: width)])!
    }

    /// A library that went up at version 1, its places from `now` down.
    static func synced(_ items: [CanvasLibraryItem], now: Double = 1_000_000) -> CanvasLibraryContents {
        var c = CanvasLibraryContents(items: items, ledger: CanvasLibraryLedger())
        c.placeAll(now: now)
        for item in items { c.sent(item.id, version: 1, edited: 0) }
        c.ledger.pulled = true
        return c
    }

    static func pulled(_ c: CanvasLibraryContents, _ id: String, version: Int64, name: String?, edited: Double) -> CanvasLibraryContents.Pulled {
        let item = c.items.first { $0.id.lowercased() == id.lowercased() }!
        var head = c.head(item)
        head.name = name
        head.edited = edited
        return .init(id: id.lowercased(), version: version, head: head, removed: false)
    }

    // MARK: Order

    @Test func aLibraryFromBeforeSyncKeepsItsOrder() {
        let a = Self.item("A"), b = Self.item("B"), c = Self.item("C")
        var contents = CanvasLibraryContents(items: [a, b, c], ledger: CanvasLibraryLedger())
        contents.placeAll(now: 5000)
        #expect(contents.items.map(\.name) == ["A", "B", "C"])
        #expect(contents.items.map { contents.entry($0.id)!.place } == [5000, 4999.99, 4999.98])
        #expect(contents.unsent.count == 3 && contents.unsynced == 3, "all of it goes up at the first sync")
    }

    @Test func newItemsGoFirstInTheOrderGiven() {
        var c = Self.synced([Self.item("Old")])
        c.made([Self.item("Server", source: "Data flow"), Self.item("Database", source: "Data flow")], now: 10)
        #expect(c.items.map(\.name) == ["Server", "Database", "Old"], "above what's there, even with a clock that's behind")
        c.made([Self.item("Mine")], now: 2_000_000)
        #expect(c.items.map(\.name) == ["Mine", "Server", "Database", "Old"])
        #expect(CanvasLibraryGrid(c.items).groups.map(\.title) == ["Saved", "Data flow"], "yours under Saved, above the file")
    }

    @Test func everyDeviceShowsTheSameOrder() {
        let items = (0..<6).map { Self.item("\($0)") }
        var one = Self.synced(items)
        // Two made in the same millisecond on two devices: their ids decide.
        one.ledger.entries[items[2].id.lowercased()]!.place = one.entry(items[3].id)!.place
        var other = CanvasLibraryContents(items: items.reversed(), ledger: one.ledger)
        other.sort()
        one.sort()
        #expect(one.items.map(\.id) == other.items.map(\.id))
    }

    // MARK: Renames

    @Test func theLaterRenameWins() {
        let server = Self.item("Server")
        // Renamed here, then a later rename from another device comes down: theirs.
        var c = Self.synced([server])
        c.renamed(server.id, to: "Web server", now: 2_000)
        c.take([Self.pulled(c, server.id, version: 2, name: "Database", edited: 3_000)])
        #expect(c.items[0].name == "Database" && c.renames.isEmpty && c.entry(server.id)?.version == 2)

        // An earlier one comes down: this device's stays, and goes up over the version it read.
        var d = Self.synced([server])
        d.renamed(server.id, to: "Web server", now: 4_000)
        d.take([Self.pulled(d, server.id, version: 2, name: "Database", edited: 3_000)])
        #expect(d.items[0].name == "Web server")
        #expect(d.renames.map(\.version) == [2])
        d.sent(server.id, version: 3, edited: 4_000)
        #expect(d.renames.isEmpty && d.unsynced == 0)
    }

    @Test func aRenameMadeWhileOneWasGoingUpStillGoes() {
        let server = Self.item("Server")
        var c = Self.synced([server])
        c.renamed(server.id, to: "Web", now: 2_000)
        let sentEdit = c.entry(server.id)!.edited
        c.renamed(server.id, to: "Web server", now: 2_001)
        c.sent(server.id, version: 2, edited: sentEdit)
        #expect(c.renames.count == 1, "the second name hasn't gone up yet")
    }

    @Test func itsOwnRenameComingBackChangesNothing() {
        let server = Self.item("Server")
        var c = Self.synced([server])
        c.renamed(server.id, to: "Web server", now: 2_000)
        c.sent(server.id, version: 2, edited: 2_000)
        let before = c
        c.take([Self.pulled(c, server.id, version: 2, name: "Web server", edited: 2_000)])
        #expect(c == before)
    }

    // MARK: Removals

    @Test func removedOnAnotherDeviceWinsOverARenameHere() {
        let server = Self.item("Server"), db = Self.item("Database")
        var c = Self.synced([server, db])
        c.renamed(server.id, to: "Web server")
        c.take([.init(id: server.id.lowercased(), version: 2, head: nil, removed: true)])
        #expect(c.items.map(\.name) == ["Database"])
        #expect(c.unsynced == 0, "the rename doesn't go up")
    }

    @Test func removedHereWinsOverARenameFromAnotherDevice() {
        let server = Self.item("Server")
        var c = Self.synced([server])
        let renamed = Self.pulled(c, server.id, version: 2, name: "Web server", edited: .greatestFiniteMagnitude)
        c.removed(server.id)
        #expect(c.wanted([renamed]).isEmpty, "its shapes aren't fetched again")
        c.take([renamed], new: [server.id.lowercased(): server])
        #expect(c.items.isEmpty && c.ledger.removed == [server.id.lowercased()], "it stays removed, and the removal still goes up")
        c.sentRemovals([server.id])
        #expect(c.unsynced == 0)
    }

    // MARK: Coming down

    @Test func anItemFromAnotherDeviceTakesItsPlace() {
        let mine = Self.item("Mine")
        var c = Self.synced([mine], now: 1_000)
        let theirs = Self.item("Theirs", source: "Data flow")
        let head = CanvasLibraryHead(name: "Theirs", source: "Data flow", place: 2_000, edited: 0)
        let row = CanvasLibraryContents.Pulled(id: theirs.id.lowercased(), version: 1, head: head, removed: false)
        #expect(c.wanted([row]) == [theirs.id.lowercased()])
        c.take([row], new: [theirs.id.lowercased(): theirs])
        #expect(c.items.map(\.name) == ["Theirs", "Mine"])
        #expect(c.items[0].source == "Data flow" && c.unsynced == 0)
    }

    /// The device sent it, but the answer was lost: the server's row is that item, not a new one.
    @Test func aLostAnswerIsNotASecondCopy() {
        let server = Self.item("Server")
        var c = CanvasLibraryContents(items: [server], ledger: CanvasLibraryLedger())
        c.placeAll()
        c.ledger.pulled = true
        let row = CanvasLibraryContents.Pulled(id: server.id.lowercased(), version: 1, head: c.head(server), removed: false)
        #expect(c.wanted([row]).isEmpty)
        c.take([row])
        #expect(c.items.count == 1 && c.unsent.isEmpty && c.entry(server.id)?.version == 1)
    }

    @Test func aRowThatDoesNotOpenIsLeftAlone() {
        var c = Self.synced([Self.item("Mine")])
        let before = c
        c.take([.init(id: UUID().uuidString.lowercased(), version: 1, head: nil, removed: false)])
        #expect(c == before)
    }

    // MARK: The first merge

    @Test func theFirstMergeMakesOneOfTheSameItem() {
        // This device had the same library file imported as the one that synced first.
        let here = Self.item("Server", source: "Data flow", width: 120)
        let saved = Self.item("Server", source: nil, width: 120)
        let other = Self.item("Database", source: "Data flow", width: 60)
        var c = CanvasLibraryContents(items: [here, saved, other], ledger: CanvasLibraryLedger())
        c.placeAll()
        let there = Self.item("Server", source: "Data flow", width: 120)
        let head = CanvasLibraryHead(name: "Server", source: "Data flow", place: 1, edited: 0)
        let merged = c.take([.init(id: there.id.lowercased(), version: 1, head: head, removed: false)], new: [there.id.lowercased(): there])
        #expect(merged.map(\.from) == [here.id] && merged.map(\.to) == [there.id.lowercased()])
        #expect(Set(c.items.map(\.id)) == [there.id.lowercased(), saved.id, other.id], "the same shapes saved by you are yours: not merged")
        #expect(c.unsent.map(\.id).sorted() == [saved.id, other.id].sorted())
    }

    @Test func afterTheFirstMergeTwoOfTheSameStayTwo() {
        let here = Self.item("Server", source: "Data flow")
        var c = CanvasLibraryContents(items: [here], ledger: CanvasLibraryLedger())
        c.placeAll()
        c.ledger.pulled = true
        let there = Self.item("Server", source: "Data flow")
        let head = CanvasLibraryHead(name: "Server", source: "Data flow", place: 1, edited: 0)
        let merged = c.take([.init(id: there.id.lowercased(), version: 1, head: head, removed: false)], new: [there.id.lowercased(): there])
        #expect(merged.isEmpty)
        #expect(c.items.count == 2, "saved twice on purpose")
    }

    // MARK: Accounts and keys

    @Test func anotherAccountsLibraryGoes() {
        let owner = UUID().uuidString, other = UUID().uuidString
        var c = CanvasLibraryContents(items: [Self.item("Before sync")], ledger: CanvasLibraryLedger())
        c.placeAll()
        let first = c.adopt(owner: owner)
        #expect(!first && c.items.count == 1, "one that never synced is merged into the first account's")
        let same = c.adopt(owner: owner.lowercased())
        #expect(!same)
        let another = c.adopt(owner: other)
        #expect(another && c.items.isEmpty && c.ledger.owner == other.lowercased())
    }

    @Test func startFreshSendsEverythingAgain() {
        let a = Self.item("A"), b = Self.item("B")
        var c = Self.synced([a, b])
        c.ledger.cursor = .now
        c.keptHere(b.id)
        c.forgetServer()
        #expect(c.unsent.map(\.id) == [a.id, b.id] && c.ledger.cursor == nil && !c.ledger.pulled)
    }

    @Test func anIDTheServerCantHoldGetsANewOne() {
        let odd = Self.item("Odd", id: "hand-edited")
        var c = Self.synced([odd])
        c.removed("also-odd")
        let moved = c.reidentify()
        #expect(moved.map(\.from) == ["hand-edited"])
        #expect(UUID(uuidString: c.items[0].id) != nil && c.unsent.count == 1 && c.ledger.removed.isEmpty)
    }

    // MARK: On the wire, and in the file

    @Test func anItemGoesUpAndComesDownWhole() throws {
        let png = "data:image/png;base64,iVBORw0KGgo="
        let picture: [String: Any] = ["type": "image", "id": "i", "x": 0, "y": 0, "width": 40, "height": 40, "fileId": "f1"]
        let item = try #require(CanvasLibraryItem(name: "Logo", source: "Brand", created: 1234, elements: [picture, Self.shape()],
                                                  files: ["f1": ["id": "f1", "dataURL": png, "mimeType": "image/png", "created": 1]]))
        let body = try #require(CanvasLibraryWire.body(item))
        let head = CanvasLibraryHead(name: "Logo", source: "Brand", place: 9, edited: 3)
        #expect(CanvasLibraryWire.head(CanvasLibraryWire.json(head)) == head)
        let back = try #require(CanvasLibraryWire.item(id: item.id, head: head, body: body))
        #expect(back.look == item.look && back.created == 1234 && back.name == "Logo" && back.source == "Brand")
        #expect((back.files["f1"] as? [String: Any])?["dataURL"] as? String == png, "the picture inside comes with it")
        #expect(back.id == item.id.lowercased())
    }

    @MainActor @Test func theLedgerIsKeptWithTheLibrary() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-ledger-\(UUID())")
        defer { try? FileManager.default.removeItem(at: dir) }
        let lib = CanvasLibrary(folder: dir)
        lib.add(elements: [Self.shape()], name: "Server")
        lib.add(elements: [Self.shape(width: 30)], name: "Database")
        lib.update(local: false) { $0.ledger.owner = "me"; $0.ledger.pulled = true; $0.sent(lib.items[0].id, version: 4, edited: 0) }
        lib.flush()
        let again = CanvasLibrary(folder: dir)
        #expect(again.items.map(\.name) == ["Database", "Server"])
        #expect(again.ledger == lib.ledger)
        // Excalidraw (and an older Pinto) still read the file as a library.
        let data = try Data(contentsOf: dir.appending(path: "library.excalidrawlib"))
        #expect(CanvasLibraryFile.items(from: data)?.count == 2)
    }

    @MainActor @Test func aLibraryFileFromBeforeSyncLoadsInItsOrder() throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-old-\(UUID())")
        defer { try? FileManager.default.removeItem(at: dir) }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let items = [Self.item("First"), Self.item("Second"), Self.item("Third")]
        try CanvasLibraryFile.data(items).write(to: dir.appending(path: "library.excalidrawlib"))
        let lib = CanvasLibrary(folder: dir)
        #expect(lib.items.map(\.name) == ["First", "Second", "Third"])
        #expect(lib.contents.unsent.count == 3 && !lib.ledger.pulled && lib.ledger.owner == nil)
    }
}
