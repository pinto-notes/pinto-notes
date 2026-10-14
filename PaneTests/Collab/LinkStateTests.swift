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
        let vault = KeychainLinkVault(account: UUID())
        let note = UUID()
        let entry = LinkVaultEntry(id: "sEbHaDgYXLDfpSMmrziRgA", secret: Data(repeating: 9, count: 16), access: "Can edit")
        guard vault.save(entry, for: note) else { print("KEYCHAIN not available in this test host: skipped"); return }
        defer { vault.remove(note) }
        #expect(vault.load(note) == entry)
        var changed = entry
        changed.access = "Can view"
        vault.save(changed, for: note)
        #expect(vault.load(note)?.access == "Can view")
        vault.remove(note)
        #expect(vault.load(note) == nil)
    }
}
