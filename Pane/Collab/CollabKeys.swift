import CryptoKit
import Foundation
import os

private let log = Logger(subsystem: "dev.emilwagman.pane", category: "collab")

/// The account's identity key for shared notes, and the keys of the people you share with.
///
/// One identity key pair per account, never per device: the first device that shares or joins
/// makes it and publishes it, the private half sealed under the account's data key (the real one,
/// from AccountCrypto). Every other device opens that copy. It never changes once published (the
/// server refuses a different one); Start fresh deletes it with the rest of the account's data.
///
/// Other people's keys are trusted the first time they're seen (`CollabKeyBook`). A different key
/// later for the same person is what a server slipping in its own key would look like, so it's
/// kept as a `Collab.KeyChange` for the Share sheet to show until the person checks the code.
@MainActor
final class CollabKeys {
    enum Problem: LocalizedError, Equatable {
        /// The account's key isn't open on this device yet.
        case noDataKey
        /// The server has an identity key this account's data key can't open.
        case unreadable

        var errorDescription: String? {
            switch self {
            case .noDataKey: "Your notes aren't open on this device yet."
            case .unreadable: "Your sharing key couldn't be opened on this device."
            }
        }
    }

    private let transport: CollabTransport
    private let dataKey: @MainActor () -> SymmetricKey?
    let book: CollabKeyBook
    private var cached: CollabCrypto.Identity?
    private var pending: Task<CollabCrypto.Identity, Error>?

    init(transport: CollabTransport, dataKey: @escaping @MainActor () -> SymmetricKey?, book: CollabKeyBook) {
        self.transport = transport
        self.dataKey = dataKey
        self.book = book
    }

    var me: UUID { transport.me }

    /// The identity, made and published the first time it's needed (the first share or join), and
    /// opened from the server's copy on every other device. Calls at the same time share one.
    func identity() async throws -> CollabCrypto.Identity {
        if let cached { return cached }
        if let pending { return try await pending.value }
        let task = Task { try await self.load() }
        pending = task
        defer { pending = nil }
        let id = try await task.value
        cached = id
        return id
    }

    /// The identity if the account already has one, without making it (nil before the first share or join).
    func existing() async throws -> CollabCrypto.Identity? {
        if let cached { return cached }
        guard let key = dataKey() else { throw Problem.noDataKey }
        guard let row = try await transport.ownIdentity() else { return nil }
        let id = try open(row, key: key)
        cached = id
        return id
    }

    private func load() async throws -> CollabCrypto.Identity {
        guard let key = dataKey() else { throw Problem.noDataKey }
        if let row = try await transport.ownIdentity() { return try open(row, key: key) }
        let made = CollabCrypto.Identity()
        do {
            try await transport.publishIdentity(publicKey: made.publicBase64, privateWrap: try CollabCrypto.wrapIdentity(made, dataKey: key, user: me))
        } catch Collab.Failure.identityExists {
            // Another device published first: use its key, never ours.
            guard let row = try await transport.ownIdentity() else { throw Problem.unreadable }
            return try open(row, key: key)
        }
        // Read back what the server kept: a publish that raced another device keeps the first key.
        guard let row = try await transport.ownIdentity() else { throw Problem.unreadable }
        return try open(row, key: key)
    }

    private func open(_ row: Collab.IdentityRow, key: SymmetricKey) throws -> CollabCrypto.Identity {
        guard let id = try? CollabCrypto.unwrapIdentity(row.private_wrap, dataKey: key, user: me), id.publicBase64 == row.public_key else {
            log.error("the account's identity key doesn't open with its data key")
            throw Problem.unreadable
        }
        return id
    }

    /// Forgets the opened key (signing out, or the account's data key changed).
    func reset() {
        cached = nil
        pending?.cancel()
        pending = nil
    }

    // MARK: Other people's keys

    /// Takes in a note's members: first sightings are remembered, a different key for someone
    /// already known becomes a key change. Returns the changes among these members.
    @discardableResult
    func check(_ members: [Collab.Member]) -> [Collab.KeyChange] {
        members.compactMap { m in
            guard m.user_id != me, let key = m.public_key else { return nil }
            return book.see(m.user_id, key: key, name: m.display_name)
        }
    }

    /// The public key a wrap must come from: the one on record for that person. A key the server
    /// gives that differs from the one first seen is refused here; the change is kept for the
    /// Share sheet.
    func trustedKey(of member: Collab.Member) -> Data? {
        guard let key = member.public_key else { return nil }
        if member.user_id == me { return Data(base64Encoded: key) }
        if book.see(member.user_id, key: key, name: member.display_name) != nil { return nil }
        return Data(base64Encoded: key)
    }

    /// The 12-digit code to compare with someone, from both public keys.
    func safetyCode(with member: Collab.Member) async throws -> String? {
        guard let key = member.public_key.flatMap({ Data(base64Encoded: $0) }) else { return nil }
        return CollabCrypto.safetyCode(try await identity().publicRaw, key)
    }
}

extension Collab {
    /// Someone's identity key isn't the one this account first saw for them.
    struct KeyChange: Identifiable, Equatable, Sendable {
        var id: UUID { user }
        let user: UUID
        let name: String
        let was: String
        let now: String

        var message: String {
            let first = name.split(separator: " ").first.map(String.init) ?? name
            // The identity key is one per account and never changes with a new device: only Start
            // fresh changes it, or a server handing out a key that isn't theirs.
            return "\(first)\u{2019}s key changed. That happens when \(first) starts fresh, or when someone pretends to be \(first). Check the code with \(first) before you share more."
        }
    }
}

/// The identity keys this account has seen for other people, by person: trust on first use. Kept
/// per account, so signing in as someone else starts their own book.
@MainActor
final class CollabKeyBook {
    private struct Entry: Codable, Equatable {
        var key: String
        /// A different key the server gave since, not yet trusted.
        var changed: String?
        var name: String?
    }

    private let defaults: UserDefaults
    private let storageKey: String
    private var entries: [UUID: Entry]

    init(account: UUID, defaults: UserDefaults = .standard) {
        self.defaults = defaults
        storageKey = "collab.keys.\(account.uuidString.lowercased())"
        entries = (defaults.data(forKey: storageKey)).flatMap { try? JSONDecoder().decode([UUID: Entry].self, from: $0) } ?? [:]
    }

    /// Records a sighting. Nil when the key is the known one (or the first); a change otherwise.
    func see(_ user: UUID, key: String, name: String?) -> Collab.KeyChange? {
        guard var e = entries[user] else {
            entries[user] = Entry(key: key, name: name)
            save()
            return nil
        }
        if let name, e.name != name { e.name = name }
        if e.key == key {
            if e.changed != nil { e.changed = nil }
            entries[user] = e
            save()
            return nil
        }
        e.changed = key
        entries[user] = e
        save()
        return Collab.KeyChange(user: user, name: e.name ?? "Someone", was: e.key, now: key)
    }

    /// Every unresolved key change.
    var changes: [Collab.KeyChange] {
        entries.compactMap { u, e in e.changed.map { Collab.KeyChange(user: u, name: e.name ?? "Someone", was: e.key, now: $0) } }
            .sorted { $0.name < $1.name }
    }

    /// The person checked the code: their new key is the one on record from now on.
    func trust(_ change: Collab.KeyChange) {
        guard var e = entries[change.user], e.changed == change.now else { return }
        e.key = change.now
        e.changed = nil
        entries[change.user] = e
        save()
    }

    func knownKey(_ user: UUID) -> String? { entries[user]?.key }

    private func save() {
        if let data = try? JSONEncoder().encode(entries) { defaults.set(data, forKey: storageKey) }
    }
}
