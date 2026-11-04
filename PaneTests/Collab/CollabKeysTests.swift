import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// The account's identity key for shared notes (CollabKeys) and the warning when someone's key
/// changes (CollabKeyBook), against the in-memory server with the migration's rules.
@MainActor
@Suite struct CollabKeysTests {
    let server = MemoryCollabServer()

    private func keys(_ user: UUID, dataKey: SymmetricKey?, defaults: UserDefaults = TestDefaults()) -> CollabKeys {
        CollabKeys(transport: server.transport(for: user), dataKey: { dataKey }, book: CollabKeyBook(account: user, defaults: defaults))
    }

    @Test func theFirstShareMakesAndPublishesTheKeyAndOtherDevicesOpenTheSameOne() async throws {
        let sara = server.account("Sara")
        let dataKey = SymmetricKey(size: .bits256)
        let phone = keys(sara, dataKey: dataKey)
        // Starting up never makes one.
        #expect(try await phone.existing() == nil)
        #expect(server.identities[sara] == nil)

        let made = try await phone.identity()
        let row = try #require(server.identities[sara])
        #expect(row.public_key == made.publicBase64)
        // The private half is on the server only sealed under the data key.
        #expect(row.private_wrap.hasPrefix("amb2."))
        #expect(!row.private_wrap.contains(made.scalar.base64EncodedString()))

        // A new Mac with the same account (its data key came through iCloud Keychain): the same key.
        let mac = keys(sara, dataKey: dataKey)
        #expect(try await mac.existing()?.publicBase64 == made.publicBase64)
        #expect(try await mac.identity().publicBase64 == made.publicBase64)
        #expect(server.calls.filter { $0 == "publish_identity" }.count == 1)
    }

    @Test func twoDevicesStartingAtOnceEndWithOneKey() async throws {
        let sara = server.account("Sara")
        let dataKey = SymmetricKey(size: .bits256)
        let a = keys(sara, dataKey: dataKey), b = keys(sara, dataKey: dataKey)
        async let x = a.identity()
        async let y = b.identity()
        let (ka, kb) = try await (x, y)
        #expect(ka.publicBase64 == kb.publicBase64)
        #expect(server.identities[sara]?.public_key == ka.publicBase64)
    }

    @Test func aKeyThatDoesntOpenIsNeverReplaced() async throws {
        let sara = server.account("Sara")
        _ = try await keys(sara, dataKey: SymmetricKey(size: .bits256)).identity()
        let published = server.identities[sara]
        // A device with another data key (the account's key changed under it) can't open it, and
        // must not publish one of its own.
        await #expect(throws: CollabKeys.Problem.unreadable) { try await keys(sara, dataKey: SymmetricKey(size: .bits256)).identity() }
        #expect(server.identities[sara] == published)
        await #expect(throws: CollabKeys.Problem.noDataKey) { try await keys(sara, dataKey: nil).identity() }
    }

    @Test func aKeyIsTrustedOnFirstSightAndAChangeIsKeptUntilChecked() throws {
        let me = UUID(), sara = UUID()
        let defaults = TestDefaults()
        let book = CollabKeyBook(account: me, defaults: defaults)
        let first = CollabCrypto.Identity().publicBase64, second = CollabCrypto.Identity().publicBase64
        #expect(book.see(sara, key: first, name: "Sara Lind") == nil)
        #expect(book.see(sara, key: first, name: "Sara Lind") == nil)

        let change = try #require(book.see(sara, key: second, name: "Sara Lind"))
        #expect(change.was == first && change.now == second)
        #expect(change.message == "Sara\u{2019}s key changed. That happens when Sara starts fresh, or when someone pretends to be Sara. Check the code with Sara before you share more.")
        // Remembered across launches, and the first key stays the trusted one.
        let again = CollabKeyBook(account: me, defaults: defaults)
        #expect(again.changes == [change])
        #expect(again.knownKey(sara) == first)

        again.trust(change)
        #expect(again.changes.isEmpty)
        #expect(again.knownKey(sara) == second)
        #expect(again.see(sara, key: second, name: nil) == nil)
        // Another account on this device starts its own book.
        #expect(CollabKeyBook(account: UUID(), defaults: defaults).knownKey(sara) == nil)
    }

    @Test func aWrapFromAChangedKeyIsRefusedAndTheChangeShows() async throws {
        let emil = server.account("Emil"), sara = server.account("Sara")
        let note = UUID(), nk = SymmetricKey(size: .bits256)
        let emilKey = SymmetricKey(size: .bits256), saraKey = SymmetricKey(size: .bits256)
        let emilStore = CollabStore(name: "Emil", transport: server.transport(for: emil), dataKey: { emilKey }, book: CollabKeyBook(account: emil, defaults: TestDefaults()))
        let saraStore = CollabStore(name: "Sara", transport: server.transport(for: sara), dataKey: { saraKey }, book: CollabKeyBook(account: sara, defaults: TestDefaults()))
        let emilID = try await emilStore.ensureIdentity()
        let saraID = try await saraStore.ensureIdentity()

        // Emil's note, with Sara in it through a wrap he sealed to her.
        let toSelf = try CollabCrypto.sealNoteKey(nk, from: emilID, to: emilID.publicRaw, party: .init(note: note, epoch: 1, from: emil, to: emil))
        try server.share(emil, note: note, keyWrap: toSelf, selfWrap: try CollabCrypto.selfWrap(nk, dataKey: emilKey, note: note, epoch: 1), head: "h")
        let toSara = try CollabCrypto.sealNoteKey(nk, from: emilID, to: saraID.publicRaw, party: .init(note: note, epoch: 1, from: emil, to: sara))
        try server.invite(emil, note: note, user: sara, role: "editor", keyWrap: toSara, epoch: 1)

        // Sara has seen Emil's real key once…
        saraStore.checkKeys(try await server.transport(for: sara).members(of: note))
        #expect(saraStore.keyChanges.isEmpty)
        // …then the server hands out a key of its own for Emil and a wrap made with it.
        let fake = CollabCrypto.Identity()
        server.substituteIdentity(of: emil, with: fake.publicBase64)
        let forged = try CollabCrypto.sealNoteKey(SymmetricKey(size: .bits256), from: fake, to: saraID.publicRaw, party: .init(note: note, epoch: 1, from: emil, to: sara))
        let row = Collab.Membership(note_id: note, role: "editor", epoch: 1, key_wrap: forged, wrapped_by: emil, self_wrap: nil,
                                    invited_by: emil, accepted_at: nil, head_ct: nil, owner_id: emil)
        await #expect(throws: (any Error).self) { try await saraStore.openKey(row) }
        #expect(saraStore.keyChanges.map(\.user) == [emil])
        #expect(saraStore.keyChanges.first?.message.hasPrefix("Emil\u{2019}s key changed.") == true)

        // The real wrap from the key she first saw still opens.
        let real = Collab.Membership(note_id: note, role: "editor", epoch: 1, key_wrap: toSara, wrapped_by: emil, self_wrap: nil,
                                     invited_by: emil, accepted_at: nil, head_ct: nil, owner_id: emil)
        server.substituteIdentity(of: emil, with: emilID.publicBase64)
        #expect(E2EE.bytes(try await saraStore.openKey(real).nk) == E2EE.bytes(nk))
        #expect(saraStore.keyChanges.isEmpty)
    }

    @Test func theSafetyCodeIsTheSameOnBothSides() async throws {
        let emil = server.account("Emil"), sara = server.account("Sara")
        let e = CollabStore(name: "Emil", transport: server.transport(for: emil), dataKey: { SymmetricKey(size: .bits256) }, book: CollabKeyBook(account: emil, defaults: TestDefaults()))
        let s = CollabStore(name: "Sara", transport: server.transport(for: sara), dataKey: { SymmetricKey(size: .bits256) }, book: CollabKeyBook(account: sara, defaults: TestDefaults()))
        let ei = try await e.ensureIdentity(), si = try await s.ensureIdentity()
        let codeOnEmils = e.safetyCode(with: Collab.Member(user_id: sara, role: "editor", display_name: "Sara", avatar_path: nil, public_key: si.publicBase64, accepted: true))
        let codeOnSaras = s.safetyCode(with: Collab.Member(user_id: emil, role: "owner", display_name: "Emil", avatar_path: nil, public_key: ei.publicBase64, accepted: true))
        #expect(codeOnEmils != nil && codeOnEmils == codeOnSaras)
        #expect(codeOnEmils?.count == 14)
    }

    @Test func renewingAKeyWithNoOneRemovedSendsAnExplicitNullUser() throws {
        let params = SupabaseCollabTransport.RemoveParams(p_note: "n", p_user: nil, p_epoch: 2, p_wraps: [])
        let json = try #require(try JSONSerialization.jsonObject(with: JSONEncoder().encode(params)) as? [String: Any])
        #expect(Set(json.keys) == ["p_note", "p_user", "p_epoch", "p_wraps"])
        #expect(json["p_user"] is NSNull)
    }
}
