import Foundation
import Supabase
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// Sign Out and Remove Notes as the app wires it (`SignOutRemoval.live`), with the real sync engine
/// against a stubbed server: what hasn't synced goes up first or the removal is refused, and the
/// notes come back at the next sign-in.
@MainActor @Suite(.sealedAccount) struct SignOutRemovalSyncTests {
    let user = SealedAccount.user
    let context: ModelContext
    let defaults: UserDefaults = MemoryDefaults()
    let files: URL
    let client: SupabaseClient
    let backend: Backend
    let engine: SyncEngine
    let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud())
    let crypto: AccountCrypto
    let list = KeyDevicesTests.FakeList()
    let devices: KeyDevices
    let device = UUID()

    init() async throws {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
        context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        files = FileManager.default.temporaryDirectory.appending(path: "SignOutRemovalSyncTests.\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: files, withIntermediateDirectories: true)
        try Data("a photo".utf8).write(to: files.appending(path: "photo.jpg"))
        client = StubSupabase.client()
        try await client.auth.signIn(email: "qa@example.com", password: "a-long-password")
        backend = Backend(testClient: client, email: "qa@example.com", userID: user)
        engine = SyncEngine(backend: backend, context: context, defaults: defaults, path: NetworkPath())
        crypto = AccountCrypto(store: keychain, defaults: defaults, sleep: { _ in throw CancellationError() })
        devices = KeyDevices(device: device, platform: "ios", name: "iPhone", identity: DeviceIdentity(store: MemoryDeviceIdentityStore()))
        devices.attach(account: user, server: list)
        await crypto.attach(account: user, server: KeyStartupTests.FakeServer())
        await devices.refresh(crypto)
        AccountLibrary.adopt(user, context: context, defaults: defaults, files: files)
    }

    private var removal: SignOutRemoval {
        SignOutRemoval.live(backend: backend, sync: engine, context: context, crypto: crypto, devices: devices,
                            vault: NoteVault(keyStore: MemoryKeyStore(), defaults: MemoryDefaults()),
                            pages: NotePageStore(file: nil), pageData: NotePageDataStore(file: nil),
                            defaults: defaults, files: files, gate: SignOutRemoval.Gate())
    }

    private func refusal() async -> SignOutRemoval.Refusal? {
        do { try await removal.run(account: user); return nil } catch { return error as? SignOutRemoval.Refusal }
    }

    private var notes: [Note] { (try? context.fetch(FetchDescriptor<Note>())) ?? [] }
    private var signOuts: Int { StubSupabase.requests.filter { $0.contains("/auth/v1/logout") }.count }

    private func nothingChanged(_ count: Int) {
        #expect(notes.count == count && FileManager.default.fileExists(atPath: files.path), "the library and its files are here")
        #expect(crypto.phase == .ready && keychain.synced[user] != nil, "so is the key")
        #expect(signOuts == 0 && client.auth.currentSession != nil, "still signed in")
        #expect(defaults.string(forKey: SignOutRemoval.pendingFlag) == nil && defaults.string(forKey: AccountLibrary.ownerKey) != nil)
        #expect(list.rows.contains { $0.device_id == device })
    }

    private func finish() async {
        await engine.stop()
        crypto.signedOut()
        NetFault.config = .init()
    }

    @Test func offlineWithUnsyncedEditsItIsRefusedAndNothingIsLost() async throws {
        let synced = context.createNote(in: .all, body: "On the server")
        synced.dirty = true
        await engine.sync()
        #expect(!synced.dirty)
        let typed = context.createNote(in: .all, body: "Typed on the train")
        typed.dirty = true
        NetFault.config = .init(offline: true)
        #expect(await refusal() == .unsynced)
        nothingChanged(2)
        #expect(typed.dirty && StubSupabase.note(typed.id) == nil)
        // Plain Sign Out still works offline, and keeps the notes here.
        await backend.signOut()
        #expect(client.auth.currentSession == nil && notes.count == 2)
        await finish()
    }

    @Test func aServerThatWontTakeTheEditsRefusesIt() async throws {
        let typed = context.createNote(in: .all, body: "Typed just now")
        typed.dirty = true
        StubSupabase.tooFast = true
        #expect(await refusal() == .unsynced)
        nothingChanged(1)
        #expect(typed.dirty)
        StubSupabase.tooFast = false
        await finish()
    }

    @Test func offlineWithNothingToPushItIsStillRefused() async throws {
        context.createNote(in: .all, body: "On the server").dirty = true
        await engine.sync()
        NetFault.config = .init(offline: true)
        #expect(await refusal() == .offline)
        nothingChanged(1)
        await finish()
    }

    @Test func anAppInANoteThatHasntGoneUpRefusesIt() async throws {
        let note = context.createNote(in: .all, body: "Tracker")
        note.dirty = true
        await engine.sync()
        let pages = NotePageStore(file: nil)
        pages.setHere(note.id, nil)
        #expect(!pages.unpushed.isEmpty)
        let r = SignOutRemoval.live(backend: backend, sync: engine, context: context, crypto: crypto, devices: devices,
                                    vault: NoteVault(keyStore: MemoryKeyStore(), defaults: MemoryDefaults()), pages: pages, pageData: NotePageDataStore(file: nil),
                                    defaults: defaults, files: files, gate: SignOutRemoval.Gate())
        await #expect(throws: SignOutRemoval.Refusal.unsynced) { try await r.run(account: user) }
        nothingChanged(1)
        await finish()
    }

    @Test func onlineTheEditsGoUpTheNotesLeaveThisDeviceAndComeBackAtTheNextSignIn() async throws {
        let synced = context.createNote(in: .all, body: "On the server")
        synced.dirty = true
        await engine.sync()
        let typed = context.createNote(in: .all, body: "Typed on the train")
        typed.dirty = true
        defaults.set(synced.id.uuidString, forKey: "lastNote")
        let (one, two) = (synced.id, typed.id)
        #expect(await refusal() == nil)
        #expect(StubSupabase.note(two) != nil, "what hadn't synced went up first")
        #expect(notes.isEmpty && !FileManager.default.fileExists(atPath: files.path), "the library and its files are gone from this device")
        #expect(keychain.synced[user] != nil && keychain.cloud.keys[user] != nil, "the iCloud Keychain item is untouched")
        #expect(crypto.phase != .ready, "but the key isn't open here")
        #expect(signOuts == 1 && client.auth.currentSession == nil, "and this session ended")
        #expect(defaults.string(forKey: SignOutRemoval.pendingFlag) == nil && defaults.string(forKey: AccountLibrary.ownerKey) == nil
                && defaults.string(forKey: "lastNote") == nil)
        await engine.stop()
        // Signing in again on this device: the notes come down.
        try await client.auth.signIn(email: "qa@example.com", password: "a-long-password")
        AccountLibrary.adopt(user, context: context, defaults: defaults, files: files)
        let again = SyncEngine(backend: Backend(testClient: client, email: "qa@example.com", userID: user), context: context, defaults: defaults, path: NetworkPath())
        await again.sync()
        #expect(Set(notes.map(\.id)) == [one, two] && Set(notes.map(\.body)) == ["On the server", "Typed on the train"])
        await again.stop()
        await finish()
    }
}
}
