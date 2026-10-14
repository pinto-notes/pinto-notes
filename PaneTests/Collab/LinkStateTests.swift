import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// The owner's Share tells the truth about the link on every device and after a relaunch: the
/// link's id, secret and role are kept in the account's synced Keychain item (a shared vault here
/// stands in for iCloud Keychain), never on the server.
@MainActor
@Suite struct LinkStateTests {
    let server = MemoryCollabServer()

    /// A device of `user`'s, with the vault their iCloud Keychain syncs.
    private func device(_ user: UUID, vault: LinkVault, dataKey: SymmetricKey) throws -> (CollabStore, ModelContext, ModelContainer) {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let store = CollabStore(name: "Emil", transport: server.transport(for: user), dataKey: { dataKey }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        store.linkVault = vault
        return (store, container.mainContext, container)
    }

    @Test func aRelaunchOrAnotherDeviceShowsTheLinkAsItIs() async throws {
        let emil = server.account("Emil"), vault = MemoryLinkVault(), key = SymmetricKey(size: .bits256)
        let (mac, context, container) = try device(emil, vault: vault, dataKey: key)
        let note = Note(body: "Team offsite\n")
        context.insert(note)
        try await mac.setAccess(.view, for: note)
        let link = try #require(mac.linkURL(note))

        // The app starts again (or the iPhone opens Share): the same link, still Can view, not Off.
        let (phone, _, phoneContainer) = try device(emil, vault: vault, dataKey: key)
        var state = phone.shareState(for: note)
        #expect(state.access == .view && state.link == link)
        // And the link really works: someone opening it joins as a viewer.
        let sara = server.account("Sara")
        let (saraStore, _, saraContainer) = try device(sara, vault: MemoryLinkVault(), dataKey: SymmetricKey(size: .bits256))
        #expect(await saraStore.join(link))

        // Off on one device: after a relaunch, Off everywhere.
        try await mac.setAccess(.off, for: note)
        let (later, _, laterContainer) = try device(emil, vault: vault, dataKey: key)
        state = later.shareState(for: note)
        #expect(state.access == .off && state.link == nil)
        #expect(vault.load(note.id) == nil)
        _ = (container, phoneContainer, saraContainer, laterContainer)
    }

    /// The secret never reaches the server: only the hash of what proves you hold the link.
    @Test func theSecretStaysOnYourDevices() async throws {
        let emil = server.account("Emil"), vault = MemoryLinkVault()
        let (mac, context, container) = try device(emil, vault: vault, dataKey: SymmetricKey(size: .bits256))
        let note = Note(body: "Team offsite\n")
        context.insert(note)
        try await mac.setAccess(.edit, for: note)
        let entry = try #require(vault.load(note.id))
        #expect(entry.access == "Can edit" && entry.secret.count == 16)
        let secret = SealedLink.base64url(entry.secret)
        #expect(!server.everythingStored.contains(secret))
        _ = container
    }

    /// The real Keychain item: synced, one per account and note. Skipped where the test host has no
    /// Keychain entitlement (CI's unsigned host).
    @Test func theKeychainItemRoundTrips() throws {
        let (storage, dir) = try Self.tempStorage()
        defer { try? FileManager.default.removeItem(at: dir) }
        let vault = KeychainLinkVault(account: UUID(), fallback: storage)
        let note = UUID()
        let entry = LinkVaultEntry(id: "sEbHaDgYXLDfpSMmrziRgA", secret: Data(repeating: 9, count: 16), access: "Can edit")
        guard vault.save(entry, for: note), !vault.usesFallback else { print("KEYCHAIN not available in this test host: skipped"); return }
        defer { vault.remove(note) }
        #expect(vault.load(note) == entry)
        var changed = entry
        changed.access = "Can view"
        vault.save(changed, for: note)
        #expect(vault.load(note)?.access == "Can view")
        vault.remove(note)
        #expect(vault.load(note) == nil)
    }

    /// A Keychain that refuses every call for want of an entitlement (the Mac download, the Beta).
    struct RefusingItems: LinkSecItems {
        func copy(_ query: [String: Any]) -> (OSStatus, Data?) { (errSecMissingEntitlement, nil) }
        func update(_ query: [String: Any], data: Data) -> OSStatus { errSecMissingEntitlement }
        func add(_ query: [String: Any]) -> OSStatus { errSecMissingEntitlement }
        func delete(_ query: [String: Any]) -> OSStatus { errSecMissingEntitlement }
    }

    static func tempStorage() throws -> (SessionStorage, URL) {
        let dir = FileManager.default.temporaryDirectory.appending(path: "linkvault-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return (SessionStorage(keychain: nil, directory: dir), dir)
    }

    /// Without the Keychain the link is kept in the app's own storage: it survives a relaunch on
    /// this Mac, Off removes it, and Start fresh removes all of the account's.
    @Test func withoutTheKeychainLinksAreKeptOnThisMac() throws {
        let (storage, dir) = try Self.tempStorage()
        defer { try? FileManager.default.removeItem(at: dir) }
        let account = UUID(), a = UUID(), b = UUID()
        let vault = KeychainLinkVault(account: account, items: RefusingItems(), fallback: storage)
        let entry = LinkVaultEntry(id: "sEbHaDgYXLDfpSMmrziRgA", secret: Data(repeating: 3, count: 16), access: "Can edit")
        #expect(vault.save(entry, for: a))
        #expect(vault.usesFallback)
        #expect(vault.save(LinkVaultEntry(id: "Nw8kQe0rTzYxUv2aBcDeFg", secret: Data(repeating: 4, count: 16), access: "Can view"), for: b))

        // A relaunch: a new vault over the same storage finds them.
        let again = KeychainLinkVault(account: account, items: RefusingItems(), fallback: storage)
        #expect(again.load(a) == entry)
        again.remove(a)
        #expect(again.load(a) == nil && again.load(b)?.access == "Can view")
        // Another account on this Mac has its own.
        #expect(KeychainLinkVault(account: UUID(), items: RefusingItems(), fallback: storage).load(b) == nil)
        // Start fresh.
        again.removeAll()
        #expect(KeychainLinkVault(account: account, items: RefusingItems(), fallback: storage).load(b) == nil)
    }

    /// Through the store: Share on the Mac download shows the link as it is after a relaunch.
    @Test func theMacDownloadShowsTheLinkAfterARelaunch() async throws {
        let (storage, dir) = try Self.tempStorage()
        defer { try? FileManager.default.removeItem(at: dir) }
        let emil = server.account("Emil"), key = SymmetricKey(size: .bits256)
        let (mac, context, container) = try device(emil, vault: KeychainLinkVault(account: emil, items: RefusingItems(), fallback: storage), dataKey: key)
        let note = Note(body: "Team offsite\n")
        context.insert(note)
        try await mac.setAccess(.edit, for: note)
        let link = try #require(mac.linkURL(note))
        let (relaunched, _, c2) = try device(emil, vault: KeychainLinkVault(account: emil, items: RefusingItems(), fallback: storage), dataKey: key)
        let state = relaunched.shareState(for: note)
        #expect(state.access == .edit && state.link == link)
        _ = (container, c2)
    }
}
