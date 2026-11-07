import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// The account's key changes while a sync is on its way (signed out, another account, Start
/// fresh): the run stops, and nothing more is written, sealed or taken in with the key it started with.
@MainActor @Suite(.sealedAccount) struct KeySwitchSyncTests {
    let context: ModelContext
    let engine: SyncEngine

    init() throws {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
        UserDefaults.standard.removeObject(forKey: "syncCursor.none")
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        context = ModelContext(c)
        engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com"), context: context)
    }

    private func finish() async {
        StubSupabase.onRequest = nil
        await engine.stop()
        NetFault.config = .init()
    }

    /// Each request from the moment the key went, and a hook that retires the run's key (as
    /// `E2EE.sealer` does when another account's key takes its place) as the `n`th request
    /// matching `method` and `path` reaches the server.
    private func switchAccounts(on method: String, _ path: String, number n: Int = 1) -> Log {
        let key = Wire.sealer!
        let log = Log()
        StubSupabase.onRequest = { m, p in
            if log.switched { log.add("\(m) \(p)"); return }
            guard m == method, p == path, log.count() == n else { return }
            key.retire()
            log.switched = true
        }
        return log
    }

    @Test func aSwitchDuringThePushStopsTheRunBeforeAnotherWrite() async throws {
        let notes = (1 ... 4).map { i in
            let n = context.createNote(in: .all, body: "Note \(i)")
            n.dirty = true
            return n
        }
        try context.save()
        let log = switchAccounts(on: "POST", "/rest/v1/notes")
        await engine.sync()
        // The note on its way when the key went still lands (it was sealed before); no other does.
        // Its answer isn't taken in either, so all four stay to go up with the account's next sync.
        #expect(StubSupabase.rows("notes").count == 1)
        #expect(notes.allSatisfy { $0.dirty })
        #expect(log.after.isEmpty, "nothing else reached the server: \(log.after)")
        #expect(engine.problem == nil, "not a note that couldn't sync")
        #expect(engine.status == .idle, "not a failed sync, nor one still going")
        await finish()
    }

    @Test func aSwitchDuringThePullTakesNothingIn() async throws {
        let ids = (0 ..< 3).map { i -> UUID in
            let id = UUID()
            let body = "From another device \(i)"
            StubSupabase.insert("notes", [
                "id": id.uuidString.lowercased(), "body_ct": Wire.sealer!.seal(body, context: E2EE.body(id))!,
                "head_ct": Wire.sealer!.sealHead(.of(body), note: id)!, "is_pinned": false,
                "created_at": StubSupabase.stamp(.now), "updated_at": StubSupabase.stamp(.now),
                "version": 1, "server_updated_at": StubSupabase.stamp(.now),
            ])
            return id
        }
        let log = switchAccounts(on: "GET", "/rest/v1/notes")
        await engine.sync()
        #expect(try context.fetchCount(FetchDescriptor<Note>()) == 0, "nothing read after the switch is taken in")
        #expect(engine.problem == nil, "and nothing is called unreadable")
        #expect(UserDefaults.standard.object(forKey: "syncCursor.none") == nil, "the cursor stays, so the account gets them next time")
        #expect(log.after.allSatisfy { $0.hasPrefix("GET") }, "nothing written: \(log.after)")
        _ = ids
        await finish()
    }

    /// Sign Out and Remove Notes while a pull's answer is on its way: the engine stops, the library
    /// is erased, and the answer that arrives after takes nothing back in.
    @Test func aPullAnsweredAfterTheLibraryWasErasedPutsNothingBack() async throws {
        for i in 0 ..< 3 {
            let id = UUID()
            let body = "Someone else's note \(i)"
            StubSupabase.insert("notes", [
                "id": id.uuidString.lowercased(), "body_ct": Wire.sealer!.seal(body, context: E2EE.body(id))!,
                "head_ct": Wire.sealer!.sealHead(.of(body), note: id)!, "is_pinned": false,
                "created_at": StubSupabase.stamp(.now), "updated_at": StubSupabase.stamp(.now),
                "version": 1, "server_updated_at": StubSupabase.stamp(.now),
            ])
        }
        // The notes' answer is held until the erase is done.
        let gate = Gate()
        StubSupabase.onRequest = { m, p in
            guard m == "GET", p == "/rest/v1/notes" else { return }
            gate.arrived()
            gate.waitForRelease()
        }
        let running = Task { await engine.sync() }
        while !gate.hasArrived { try await Task.sleep(for: .milliseconds(5)) }
        await engine.stop()
        let files = FileManager.default.temporaryDirectory.appending(path: "wiped-\(UUID().uuidString)")
        context.wipeLocalLibrary(files: files)
        gate.release()
        await running.value
        #expect(try context.fetchCount(FetchDescriptor<Note>()) == 0, "the erased library stays empty")
        #expect(UserDefaults.standard.object(forKey: "syncCursor.none") == nil, "and remembers no sync")
        #expect(engine.problem == nil)
        await finish()
    }

    /// The rule `E2EE.sealer` follows: the same key set again keeps a run going; another
    /// account's key, a new key, or none stops it.
    @Test func whichReplacementsRetireTheKey() {
        let a = Sealer(key: SymmetricKey(size: .bits256), user: UUID())
        let again = Sealer(key: a.key, user: a.user)
        let otherAccount = Sealer(key: SymmetricKey(size: .bits256), user: UUID())
        let startFresh = Sealer(key: SymmetricKey(size: .bits256), user: a.user)
        #expect(!E2EE.retires(a, for: a))
        #expect(!E2EE.retires(a, for: again))
        #expect(E2EE.retires(a, for: otherAccount))
        #expect(E2EE.retires(a, for: startFresh))
        #expect(E2EE.retires(a, for: nil))
        // A retired key seals and opens nothing.
        let box = a.seal("Groceries", context: "body:x")!
        a.retire()
        #expect(a.seal("Groceries 2", context: "body:x") == nil && a.open(box, context: "body:x") == nil)
        #expect(throws: Sealer.Retired.self) { try a.sealFile(Data("x".utf8), id: UUID()) }
    }
}
}

/// What reached the stub after the switch.
private final class Log: @unchecked Sendable {
    private let lock = NSLock()
    private var n = 0
    private var _after: [String] = []
    private var _switched = false
    var switched: Bool {
        get { lock.withLock { _switched } }
        set { lock.withLock { _switched = newValue } }
    }
    var after: [String] { lock.withLock { _after } }
    func add(_ s: String) { lock.withLock { _after.append(s) } }
    func count() -> Int { lock.withLock { n += 1; return n } }
}

/// Holds a request until the test lets it go.
private final class Gate: @unchecked Sendable {
    private let lock = NSLock()
    private let released = DispatchSemaphore(value: 0)
    private var _arrived = false
    var hasArrived: Bool { lock.withLock { _arrived } }
    func arrived() { lock.withLock { _arrived = true } }
    func waitForRelease() { _ = released.wait(timeout: .now() + 10) }
    func release() { released.signal() }
}
