import Foundation
import Supabase
import Testing
@testable import Pane

/// The server's copy of the key through the real `key` function and the real auth server, with
/// the app's own code on each side: a second session of an account opens the notes by signing
/// in; an account from before gets its copy once its device chooses; Advanced protection
/// deletes the copy and the next device is asked to link. On a local stack or staging,
/// never production. Skipped unless `scripts/key-copy-e2e.sh` names the server and two test users.
@MainActor @Suite(.serialized) struct KeyCopyLiveTests {
    struct Env {
        let url: URL, key: String, email: String, old: String, password: String

        static let production = "rodegaeruhyybqilrnpn"

        static var current: Env? {
            let e = ProcessInfo.processInfo.environment
            guard let api = e["PANE_KEYCOPY_API"], let url = URL(string: api), let host = url.host,
                  host == "127.0.0.1" || (host.hasSuffix(".supabase.co") && !host.hasPrefix(production)),
                  let key = e["PANE_KEYCOPY_ANON"], let email = e["PANE_KEYCOPY_EMAIL"], let old = e["PANE_KEYCOPY_OLD_EMAIL"],
                  let password = e["PANE_KEYCOPY_PASSWORD"] else { return nil }
            return Env(url: url, key: key, email: email, old: old, password: password)
        }
    }

    typealias Keychain = KeyStartupTests.FakeKeychain

    /// A signed-in session of its own, as each device has.
    func session(_ env: Env, email: String) async throws -> (SupabaseClient, UUID) {
        let client = SupabaseClient(supabaseURL: env.url, supabaseKey: env.key, options: SupabaseClientOptions(
            auth: .init(storage: AddDeviceLiveTests.MemoryStorage()),
            global: .init(headers: ["x-pane-device": Backend.device, "x-amber-client": Backend.clientTag])))
        let s = try await client.auth.signIn(email: email, password: env.password)
        return (client, s.user.id)
    }

    /// A device of this build: a Keychain of its own that shares nothing, and the server's copies.
    /// `copies: false` is a build from before, which knows nothing of them.
    func device(_ client: SupabaseClient, user: UUID, keychain: Keychain? = nil, syncs: Bool = true, copies: Bool = true) async -> (AccountCrypto, Keychain) {
        let k = keychain ?? Keychain(cloud: KeyStartupTests.Cloud(), autoReceive: false)
        k.syncs = syncs
        let crypto = AccountCrypto(store: k, defaults: UserDefaults(suiteName: "key-copy-live-\(UUID())")!, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: user, server: SupabaseAccountKeys(client: client), copies: copies ? SupabaseKeyCopy(client: client) : nil)
        return (crypto, k)
    }

    struct Notice: Decodable { var kind: String }

    @Test func aSecondDeviceOpensBySigningInAndAStrictAccountAsksToLink() async throws {
        guard let env = Env.current else { return }
        let (clientA, user) = try await session(env, email: env.email)
        // The account's first device makes its key and, being a new account, stores the copy.
        let (a, keychainA) = await device(clientA, user: user)
        #expect(a.phase == .ready && a.serverCopy && a.protection == .standard && !a.asksProtection)
        let phone = UUID(), mac = UUID()
        // Nothing else could open the notes yet, so the key can't be made device-only.
        await #expect(throws: KeyCopyError.needsRecoveryKey) { try await a.keepOnDevicesOnly(device: phone) }
        #expect(a.serverCopy && a.protection == .standard)

        // A second device: its own session, nothing in its Keychain, no iCloud Keychain (the Mac download).
        let (clientB, userB) = try await session(env, email: env.email)
        #expect(user == userB)
        let (b, keychainB) = await device(clientB, user: user, syncs: false)
        #expect(b.phase == .ready && !b.unverified && b.arrivedHow == .signIn, "no linking, no recovery key: \(b.phase)")
        #expect(KeyGateView.shown(b.phase, .auto, held: b.held) == .welcome, "the notes, not a key screen")
        #expect(b.keyID == a.keyID && b.recoveryKeyText == a.recoveryKeyText && keychainB.synced[user] == keychainA.synced[user])
        // What one device seals, the other opens.
        let note = UUID()
        let keyA = try #require(a.dataKey), keyB = try #require(b.dataKey)
        let sealed = try #require(Sealer(key: keyA, user: user).seal("Milk, eggs", context: E2EE.body(note)))
        #expect(Sealer(key: keyB, user: user).open(sealed, context: E2EE.body(note)) == "Milk, eggs")
        // Every device is told.
        let notices: [Notice] = try await clientA.from("account_notices").select("kind").eq("kind", value: "key_fetched").execute().value
        #expect(notices.count == 1)
        // The new device lists itself as signed in, and is safe to sign out of and erase.
        let onPhone = KeyDevices(device: phone, platform: "ios", name: "iPhone", identity: DeviceIdentity(store: MemoryDeviceIdentityStore()))
        let onMac = KeyDevices(device: mac, platform: "macos", name: "MacBook Air", identity: DeviceIdentity(store: MemoryDeviceIdentityStore()))
        onPhone.attach(account: user, server: SupabaseKeyDevices(client: clientA))
        onMac.attach(account: user, server: SupabaseKeyDevices(client: clientB))
        await onMac.refresh(b)
        await onPhone.refresh(a)
        #expect(onPhone.others.map(\.name) == ["MacBook Air"] && onPhone.others.first?.how == .signIn)
        #expect(SignOutRemoval.offer(crypto: b, devices: onMac) == .offered(keyStays: false))
        #expect(onMac.safety(b) != .onlyThisDevice)

        // Advanced protection: the Mac counts as another way back, so it goes through,
        // and the server's copy is gone at once.
        try await a.keepOnDevicesOnly(device: phone)
        #expect(a.protection == .strict && !a.serverCopy)
        let (clientC, _) = try await session(env, email: env.email)
        let (c, _) = await device(clientC, user: user)
        #expect(c.phase == .waiting && !c.copiesOffered && c.protection == .strict)
        #expect(KeyGateView.shown(c.phase, .auto, held: c.held) == .addDevice, "a strict account's new device is asked to link")
        #expect(await c.pollCopy() == false)
        // The devices that already have the key carry on, and store nothing by themselves.
        await a.recheck()
        await b.recheck()
        #expect(a.phase == .ready && b.phase == .ready && !b.serverCopy && b.protection == .strict)
        #expect(await c.pollCopy() == false)
        // The recovery key still opens the notes there.
        try await c.recover(typed: try #require(a.recoveryKeyText))
        #expect(c.phase == .ready && c.keyID == a.keyID)

        // Switched off again: a copy goes back, and the next device opens by signing in.
        try await a.keepCopy()
        let (clientD, _) = try await session(env, email: env.email)
        let (d, _) = await device(clientD, user: user)
        #expect(d.phase == .ready && d.arrivedHow == .signIn && d.keyID == a.keyID)
        for x in [a, b, c, d] { x.signedOut() }
    }

    @Test func anAccountFromBeforeGetsItsCopyWhenItsDeviceChooses() async throws {
        guard let env = Env.current else { return }
        let (clientA, user) = try await session(env, email: env.old)
        // A build from before makes the account's key: nothing is copied.
        let (before, keychainA) = await device(clientA, user: user, copies: false)
        #expect(before.phase == .ready && !before.serverCopy && before.protection == nil)
        before.signedOut()

        // Its second device, on this build, waits as it always did, and says what else opens it.
        let (clientB, _) = try await session(env, email: env.old)
        let (b, _) = await device(clientB, user: user)
        #expect(b.phase == .waiting && b.copiesOffered && b.protection == nil)
        #expect(KeyGateView.shown(b.phase, .auto, held: b.held) == .addDevice)

        // The first device gets this build and comes online: it asks, and stores nothing meanwhile.
        let (a, _) = await device(clientA, user: user, keychain: keychainA)
        #expect(a.phase == .ready && a.asksProtection && !a.serverCopy)
        #expect(await b.pollCopy() == false, "nothing was copied before the person chose")
        // Continue: the copy is stored, and the waiting device opens by itself.
        try await a.keepCopy()
        #expect(!a.asksProtection && a.serverCopy && a.protection == .standard)
        #expect(await b.pollCopy())
        #expect(b.phase == .ready && b.arrivedHow == .signIn && b.keyID == a.keyID)

        // A build from before on a third device still works against this server: it waits for
        // another device or the recovery key, as it did.
        let (clientC, _) = try await session(env, email: env.old)
        let (c, _) = await device(clientC, user: user, copies: false)
        #expect(c.phase == .waiting)
        try await c.recover(typed: try #require(a.recoveryKeyText))
        #expect(c.phase == .ready && c.keyID == a.keyID)
        for x in [a, b, c] { x.signedOut() }
    }
}
