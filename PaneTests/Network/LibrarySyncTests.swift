import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// The whiteboard library across a person's Mac and iPhone (LibrarySync, over the in-memory
/// server): what one device adds, renames, removes or imports shows on the other at its next sync,
/// with its names, groups, order and pictures; changes made on both merge item by item; the first
/// sync after the update merges both libraries; and the server only ever holds sealed boxes.
@MainActor @Suite(.sealedAccount) struct LibrarySyncTests {
    let user = SealedAccount.user

    init() {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
    }

    struct Device {
        let context: ModelContext
        let engine: SyncEngine
        let library: CanvasLibrary
        let defaults: UserDefaults
    }

    /// `auto`: a change to the library starts a sync by itself, as in the app. Off, each test
    /// says when each device syncs.
    func device(_ library: CanvasLibrary = CanvasLibrary(folder: nil), defaults: UserDefaults = MemoryDefaults(), auto: Bool = false) throws -> Device {
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: user), context: context,
                                defaults: defaults, library: library)
        if !auto { library.onChange = nil; library.onLook = nil }
        return Device(context: context, engine: engine, library: library, defaults: defaults)
    }

    static func shape(_ type: String = "rectangle", width: Double = 80, colour: String? = nil) -> [String: Any] {
        CanvasLibrarySyncTests.shape(type, width: width).merging(colour.map { ["backgroundColor": $0] } ?? [:]) { $1 }
    }

    /// A library file as Excalidraw writes one: Server, Database and Cache.
    static var dataFlow: Data {
        CanvasLibraryFile.data([
            CanvasLibraryItem(name: "Server", elements: [shape(width: 120)])!,
            CanvasLibraryItem(name: "Database", elements: [shape("ellipse", width: 90)])!,
            CanvasLibraryItem(name: "Cache", elements: [shape("diamond", width: 60)])!,
        ])
    }

    var rows: [[String: Any]] { StubSupabase.rows(CanvasLibraryWire.table) }
    var live: [[String: Any]] { rows.filter { $0["deleted_at"] == nil || $0["deleted_at"] is NSNull } }

    /// A library as it shows: each item's id, name and group, in order.
    func shown(_ l: CanvasLibrary) -> [String] { l.items.map { "\($0.id.lowercased()) \($0.title) [\($0.source ?? "Saved")]" } }

    /// The name the server holds for an item, opened with the account's key.
    func serverName(_ id: String) -> String? {
        let row = rows.first { ($0["id"] as? String)?.lowercased() == id.lowercased() }
        guard let box = row?["head_ct"] as? String, let uuid = UUID(uuidString: id) else { return nil }
        return Wire.sealer?.open(box, context: E2EE.libraryHead(uuid)).flatMap(CanvasLibraryWire.head)?.name
    }

    /// Each device syncs, twice round.
    func settle(_ devices: Device...) async {
        for _ in 0..<2 { for d in devices { await d.engine.sync() } }
    }

    func stop(_ devices: Device...) async {
        StubSupabase.onRequest = nil
        for d in devices { await d.engine.stop() }
    }

    // MARK: One device to the other

    @Test func whatTheMacSavesShowsOnTheIPhoneWithItsPicture() async throws {
        let mac = try device(), phone = try device()
        let dataURL = "data:image/png;base64," + Data(repeating: 7, count: 600).base64EncodedString()
        let picture: [String: Any] = ["type": "image", "id": "img", "x": 0, "y": 0, "width": 40, "height": 40, "fileId": "logo"]
        _ = try #require(mac.library.add(elements: [picture], files: ["logo": ["id": "logo", "dataURL": dataURL, "mimeType": "image/png", "created": 1]], name: "Server rack"))
        _ = try #require(mac.library.add(elements: [Self.shape()], name: "Database"))
        await mac.engine.sync()
        #expect(live.count == 2)
        // Sealed: the server holds boxes, never a name or a picture.
        for r in rows {
            #expect((r["head_ct"] as? String)?.hasPrefix("amb2.") == true && (r["body_ct"] as? String)?.hasPrefix("amb2.") == true)
        }
        #expect(!StubSupabase.bodies.contains { $0.contains("Server rack") || $0.contains(dataURL.prefix(60)) })

        await phone.engine.sync()
        #expect(shown(phone.library) == shown(mac.library))
        let rack = try #require(phone.library.items.first { $0.name == "Server rack" })
        #expect((rack.files["logo"] as? [String: Any])?["dataURL"] as? String == dataURL, "the picture inside the item came too")
        #expect(rack.look == mac.library.items.first { $0.name == "Server rack" }?.look)
        #expect(phone.library.contents.unsynced == 0 && mac.library.contents.unsynced == 0)
        await stop(mac, phone)
    }

    @Test func renamesAndRemovalsReachTheOtherDevice() async throws {
        let mac = try device(), phone = try device()
        let items = ["Server", "Database", "Cache"].map { mac.library.add(elements: [Self.shape(width: Double($0.count) * 10)], name: $0)! }
        await settle(mac, phone)
        #expect(phone.library.items.count == 3)

        mac.library.rename(items[0].id, to: "Web server")
        mac.library.remove(items[1].id)
        await mac.engine.sync()
        await phone.engine.sync()
        #expect(phone.library.items.map(\.title) == ["Cache", "Web server"])
        #expect(shown(phone.library) == shown(mac.library))

        // And back: renamed on the iPhone, it shows on the Mac.
        phone.library.rename(items[2].id.lowercased(), to: "Redis")
        await phone.engine.sync()
        await mac.engine.sync()
        #expect(mac.library.items.map(\.title) == ["Redis", "Web server"])
        #expect(shown(phone.library) == shown(mac.library))
        let gone = try #require(rows.first { ($0["id"] as? String)?.lowercased() == items[1].id.lowercased() })
        #expect(gone["deleted_at"] is String && gone["head_ct"] is NSNull && gone["body_ct"] is NSNull, "the server keeps that it went, and nothing of it")
        await stop(mac, phone)
    }

    @Test func aLibraryImportedOnOneDeviceShowsInItsGroupOnTheOther() async throws {
        let mac = try device(), phone = try device()
        _ = try #require(mac.library.add(elements: [Self.shape("ellipse")], name: "Mine"))
        await mac.engine.sync()
        #expect(phone.library.importLibrary(Self.dataFlow, source: "Data flow") == .init(added: 3, already: 0))
        await settle(phone, mac)
        let onMac = CanvasLibraryGrid(mac.library.items), onPhone = CanvasLibraryGrid(phone.library.items)
        #expect(onMac.groups.map(\.title) == ["Data flow", "Saved"])
        #expect(onMac.groups.map { $0.items.map(\.title) } == [["Server", "Database", "Cache"], ["Mine"]])
        #expect(onPhone.groups.map { $0.items.map(\.title) } == onMac.groups.map { $0.items.map(\.title) })
        await stop(mac, phone)
    }

    /// The library is open: what's new comes down then, and what's made goes up by itself.
    @Test func changesGoUpByThemselvesAndOpeningTheLibraryBringsThem() async throws {
        let mac = try device(auto: true), phone = try device(auto: true)
        await settle(mac, phone)
        mac.library.add(elements: [Self.shape()], name: "Server")
        try await waitUntil { live.count == 1 }
        phone.library.looked()
        try await waitUntil { phone.library.items.map(\.title) == ["Server"] }
        await stop(mac, phone)
    }

    // MARK: Changed on both

    @Test(arguments: [true, false]) func theLaterRenameWinsWhicheverSyncsFirst(macFirst: Bool) async throws {
        let mac = try device(), phone = try device()
        let item = try #require(mac.library.add(elements: [Self.shape()], name: "Server"))
        await settle(mac, phone)
        mac.library.rename(item.id, to: "Web server")
        try await Task.sleep(for: .milliseconds(5))
        phone.library.rename(item.id.lowercased(), to: "Database")
        if macFirst { await settle(mac, phone) } else { await settle(phone, mac) }
        #expect(mac.library.items.map(\.title) == ["Database"] && phone.library.items.map(\.title) == ["Database"])
        #expect(serverName(item.id) == "Database")
        #expect(mac.library.contents.unsynced == 0 && phone.library.contents.unsynced == 0)
        await stop(mac, phone)
    }

    /// Another device renames it between this one's pull and its rename going up: the rename
    /// doesn't write over that one unseen. The later of the two stays, on the server and here.
    @Test(arguments: [true, false]) func aRenameRacingAnotherDevicesKeepsTheLaterOne(theirsIsLater: Bool) async throws {
        let mac = try device()
        let item = try #require(mac.library.add(elements: [Self.shape()], name: "Server"))
        await mac.engine.sync()
        mac.library.rename(item.id, to: "Web server")
        let id = try #require(UUID(uuidString: item.id))
        var head = mac.library.contents.head(mac.library.items[0])
        head.name = "Database"
        head.edited += theirsIsLater ? 1_000 : -1_000
        let box = try #require(Wire.sealer?.seal(CanvasLibraryWire.json(head), context: E2EE.libraryHead(id)))
        let once = Once()
        StubSupabase.onRequest = { method, path in
            guard method == "PATCH", path.hasSuffix("/" + CanvasLibraryWire.table), once.first() else { return }
            StubSupabase.update(CanvasLibraryWire.table, id: id) { $0["head_ct"] = box }
        }
        await mac.engine.sync()
        let winner = theirsIsLater ? "Database" : "Web server"
        #expect(serverName(item.id) == winner)
        #expect(mac.library.items.map(\.title) == [winner])
        #expect(mac.library.contents.unsynced == 0)
        await stop(mac)
    }

    @Test(arguments: [true, false]) func removedOnOneDeviceAndRenamedOnTheOtherStaysRemoved(removerFirst: Bool) async throws {
        let mac = try device(), phone = try device()
        let item = try #require(mac.library.add(elements: [Self.shape()], name: "Server"))
        let kept = try #require(mac.library.add(elements: [Self.shape("ellipse")], name: "Database"))
        await settle(mac, phone)
        mac.library.remove(item.id)
        phone.library.rename(item.id.lowercased(), to: "Web server")
        if removerFirst { await settle(mac, phone) } else { await settle(phone, mac) }
        #expect(mac.library.items.map(\.id) == [kept.id] && phone.library.items.map(\.title) == ["Database"])
        #expect(live.count == 1 && serverName(item.id) == nil)
        #expect(mac.library.contents.unsynced == 0 && phone.library.contents.unsynced == 0)
        await stop(mac, phone)
    }

    // MARK: The first sync after the update

    @Test func theFirstSyncMergesWhatEachDeviceHad() async throws {
        // Before the update: each device's own library, the same library file imported on both.
        let macLibrary = CanvasLibrary(folder: nil), phoneLibrary = CanvasLibrary(folder: nil)
        macLibrary.add(elements: [Self.shape(width: 30)], name: "Mac box")
        _ = macLibrary.importLibrary(Self.dataFlow, source: "Data flow")
        _ = phoneLibrary.importLibrary(Self.dataFlow, source: "Data flow")
        phoneLibrary.add(elements: [Self.shape("ellipse", width: 50)], name: "Phone circle")
        let mac = try device(macLibrary), phone = try device(phoneLibrary)

        await settle(mac, phone)
        #expect(Set(mac.library.items.map(\.title)) == ["Mac box", "Phone circle", "Server", "Database", "Cache"])
        #expect(shown(mac.library) == shown(phone.library), "the same items, ids and order on both")
        #expect(live.count == 5, "one of each on the server: the library file isn't there twice")
        #expect(mac.library.contents.unsynced == 0 && phone.library.contents.unsynced == 0)
        await stop(mac, phone)
    }

    // MARK: What the server won't take, or doesn't have

    @Test func anItemTooBigToSyncStaysOnTheDeviceAndTheRestGo() async throws {
        let mac = try device()
        let huge = "data:image/png;base64," + String(repeating: "A", count: CanvasLibraryWire.bodyLimit)
        let picture: [String: Any] = ["type": "image", "id": "img", "x": 0, "y": 0, "width": 40, "height": 40, "fileId": "big"]
        let big = try #require(mac.library.add(elements: [picture], files: ["big": ["id": "big", "dataURL": huge, "mimeType": "image/png"]], name: "Poster"))
        mac.library.add(elements: [Self.shape()], name: "Server")
        let note = mac.context.createNote(in: .all, body: "Still syncs")
        note.dirty = true
        await mac.engine.sync()
        #expect(live.count == 1 && serverName(mac.library.items.first { $0.name == "Server" }!.id) == "Server")
        #expect(mac.library.items.count == 2 && mac.library.contents.entry(big.id)?.keptHere == true, "kept on this Mac")
        #expect(!note.dirty, "the notes went up all the same")
        await mac.engine.sync()
        let posts = StubSupabase.requests.filter { $0.hasPrefix("POST") && $0.contains(CanvasLibraryWire.table) }
        #expect(posts.count == 1, "the big one isn't tried again at every sync: \(posts)")
        await stop(mac)
    }

    @Test func aFullLibraryKeepsWhatDoesNotFitAndSendsTheRest() async throws {
        let mac = try device(), phone = try device()
        mac.library.add(elements: [Self.shape()], name: "One")
        await mac.engine.sync()
        let size = live.map { ($0["head_ct"] as? String ?? "").count + ($0["body_ct"] as? String ?? "").count }.reduce(0, +)
        StubSupabase.libraryRoom = size * 5 / 2
        mac.library.add(elements: [Self.shape(width: 40)], name: "Two")
        mac.library.add(elements: [Self.shape(width: 50)], name: "Three")
        await mac.engine.sync()
        #expect(live.count == 2, "one more fits")
        #expect(mac.library.items.count == 3 && mac.library.items.filter { mac.library.contents.entry($0.id)?.keptHere == true }.count == 1)
        await phone.engine.sync()
        #expect(phone.library.items.count == 2)
        await stop(mac, phone)
    }

    @Test func aServerWithoutTheLibraryStillSyncsTheNotes() async throws {
        StubSupabase.missingTables = [CanvasLibraryWire.table]
        let mac = try device()
        mac.library.add(elements: [Self.shape()], name: "Server")
        let note = mac.context.createNote(in: .all, body: "Still syncs")
        note.dirty = true
        await mac.engine.sync()
        #expect(!note.dirty && StubSupabase.rows("notes").count == 1)
        #expect(mac.engine.problem == nil)
        #expect(mac.library.contents.unsent.count == 1, "it waits on this Mac")
        let asked = StubSupabase.requests.filter { $0.contains(CanvasLibraryWire.table) }.count
        #expect(asked == 1)
        await mac.engine.sync()
        #expect(StubSupabase.requests.filter { $0.contains(CanvasLibraryWire.table) }.count == asked, "not asked again for an hour")
        await stop(mac)
    }

    // MARK: Keys and accounts

    @Test func aNewAccountKeySendsTheLibraryUpAgain() async throws {
        let mac = try device()
        mac.library.add(elements: [Self.shape()], name: "Server")
        await mac.engine.sync()
        #expect(live.count == 1)
        // Start fresh on another device: the server's library went with the old key.
        StubSupabase.reset()
        let fresh = Sealer(key: SymmetricKey(size: .bits256), user: user)
        await Wire.$testSealer.withValue(fresh) { await mac.engine.sync() }
        let row = try #require(live.first)
        let id = try #require(UUID(uuidString: row["id"] as? String ?? ""))
        #expect(live.count == 1 && (row["head_ct"] as? String).flatMap { fresh.open($0, context: E2EE.libraryHead(id)) }.flatMap(CanvasLibraryWire.head)?.name == "Server")
        await stop(mac)
    }

    @Test func anotherAccountsLibraryLeavesTheDevice() async throws {
        let library = CanvasLibrary(folder: nil)
        library.add(elements: [Self.shape()], name: "Someone else's")
        library.update(local: false) { $0.ledger.owner = UUID().uuidString.lowercased(); $0.ledger.pulled = true }
        let mac = try device(library)
        await mac.engine.sync()
        #expect(library.items.isEmpty && live.isEmpty, "none of it goes to this account")
        await stop(mac)
    }

    private func waitUntil(_ done: () -> Bool) async throws {
        let until = Date.now.addingTimeInterval(5)
        while !done() {
            guard Date.now < until else { Issue.record("timed out"); return }
            try await Task.sleep(for: .milliseconds(20))
        }
    }
}
}

/// True the first time it's asked, from any thread.
private final class Once: @unchecked Sendable {
    private let lock = NSLock()
    private var done = false
    func first() -> Bool { lock.withLock { defer { done = true }; return !done } }
}
