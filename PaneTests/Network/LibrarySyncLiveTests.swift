import Foundation
import Supabase
import Testing
@testable import Pane

/// The whiteboard library through the real server, on the LOCAL Supabase stack only: two sessions
/// of one account (a Mac and an iPhone) keep one library through PostgREST, row-level security
/// and the table's triggers (20261117120000_whiteboard_library.sql), and another account sees
/// none of it. Skipped unless the stack's address and two test users are given, as
/// `scripts/add-device-e2e.sh` gives them (PANE_LOCAL_*).
@MainActor @Suite(.serialized) struct LibrarySyncLiveTests {
    typealias Env = AddDeviceLiveTests.Env

    func session(_ env: Env, email: String) async throws -> (SupabaseClient, UUID) {
        let client = SupabaseClient(supabaseURL: env.url, supabaseKey: env.key, options: SupabaseClientOptions(
            auth: .init(storage: AddDeviceLiveTests.MemoryStorage()),
            global: .init(headers: ["x-pane-device": Backend.device, "x-amber-client": Backend.clientTag])))
        let s = try await client.auth.signIn(email: email, password: env.password)
        return (client, s.user.id)
    }

    struct Row: Decodable { var id: UUID; var version: Int64; var head_ct: String?; var body_ct: String?; var deleted_at: String? }

    func rows(_ client: SupabaseClient) async throws -> [Row] {
        try await client.from(CanvasLibraryWire.table).select("id,version,head_ct,body_ct,deleted_at").execute().value
    }

    func shown(_ l: CanvasLibrary) -> [String] { l.items.map { "\($0.id.lowercased()) \($0.title) [\($0.source ?? "Saved")]" } }

    @Test func aMacAndAnIPhoneKeepOneLibraryOnTheRealServer() async throws {
        guard let env = Env.current else { return }
        let (macClient, user) = try await session(env, email: env.email)
        let (phoneClient, same) = try await session(env, email: env.email)
        let (stranger, strangerID) = try await session(env, email: env.other)
        #expect(user == same && strangerID != user)
        // The account's key, made by its first device as the app makes it.
        let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud(), autoReceive: false)
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "library-live-\(UUID())")!, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: user, server: SupabaseAccountKeys(client: macClient))
        let sealer = Sealer(key: try #require(crypto.dataKey), user: user)
        func sync(_ client: SupabaseClient, _ library: CanvasLibrary) async throws {
            try await LibrarySync.sync(client, sealer: sealer, library: library, owner: user, check: {})
        }

        // Before the update: each device's own library, the same library file imported on both.
        let mac = CanvasLibrary(folder: nil), phone = CanvasLibrary(folder: nil)
        let dataURL = "data:image/png;base64," + NetworkFaults.LibrarySyncPictureTests.leaf().base64EncodedString()
        let picture: [String: Any] = ["type": "image", "id": "img", "x": 0, "y": 0, "width": 40, "height": 40, "fileId": "leaf"]
        let leaf = try #require(mac.add(elements: [picture], files: ["leaf": ["id": "leaf", "dataURL": dataURL, "mimeType": "image/png", "created": 1]], name: "Leaf logo"))
        _ = mac.importLibrary(NetworkFaults.LibrarySyncTests.dataFlow, source: "Data flow")
        _ = phone.importLibrary(NetworkFaults.LibrarySyncTests.dataFlow, source: "Data flow")
        phone.add(elements: [NetworkFaults.LibrarySyncTests.shape("ellipse", width: 50)], name: "Phone circle")
        try await sync(macClient, mac)
        try await sync(phoneClient, phone)
        try await sync(macClient, mac)
        #expect(Set(mac.items.map(\.title)) == ["Leaf logo", "Phone circle", "Server", "Database", "Cache"])
        #expect(shown(mac) == shown(phone))
        let arrived = try #require(phone.items.first { $0.name == "Leaf logo" })
        #expect((arrived.files["leaf"] as? [String: Any])?["dataURL"] as? String == dataURL, "the picture inside came too")

        // The server holds boxes only, and only for this account.
        let held = try await rows(macClient)
        #expect(held.count == 5 && held.allSatisfy { ($0.head_ct ?? "").hasPrefix("amb2.") && ($0.body_ct ?? "").hasPrefix("amb2.") })
        #expect(try await rows(stranger).isEmpty, "another account sees none of it")

        // Renamed on both: the later rename wins on both. Removed on one, renamed on the other: removed.
        let server = try #require(mac.items.first { $0.name == "Server" }), cache = try #require(mac.items.first { $0.name == "Cache" })
        mac.rename(server.id, to: "Web server")
        try await Task.sleep(for: .milliseconds(5))
        phone.rename(server.id.lowercased(), to: "API")
        phone.remove(cache.id.lowercased())
        mac.rename(cache.id, to: "Redis")
        try await sync(macClient, mac)
        try await sync(phoneClient, phone)
        try await sync(macClient, mac)
        #expect(mac.items.first { $0.id.lowercased() == server.id.lowercased() }?.title == "API")
        #expect(!mac.items.contains { $0.id.lowercased() == cache.id.lowercased() } && shown(mac) == shown(phone))

        // A rename that read an older version (the other device wrote between this one's pull
        // and its push) doesn't write over it unseen: the later one stays.
        try await LibrarySync.pull(phoneClient, sealer: sealer, library: phone, check: {})
        phone.rename(leaf.id.lowercased(), to: "Leaf")
        try await Task.sleep(for: .milliseconds(5))
        mac.rename(leaf.id, to: "Pinto leaf")
        try await sync(macClient, mac)
        try await LibrarySync.push(phoneClient, sealer: sealer, library: phone, check: {})
        #expect(phone.items.first { $0.id == leaf.id.lowercased() }?.name == "Pinto leaf")
        try await sync(phoneClient, phone)
        try await sync(macClient, mac)
        #expect(shown(mac) == shown(phone) && mac.contents.unsynced == 0 && phone.contents.unsynced == 0)

        // Removed rows stay, empty, and a device can't delete them.
        let gone = try #require(try await rows(macClient).first { $0.id.uuidString.lowercased() == cache.id.lowercased() })
        #expect(gone.deleted_at != nil && gone.head_ct == nil && gone.body_ct == nil)
        await #expect(throws: (any Error).self) {
            try await macClient.from(CanvasLibraryWire.table).delete().eq("id", value: gone.id.uuidString.lowercased()).execute()
        }
        #expect(try await rows(macClient).count == 5)
    }
}
