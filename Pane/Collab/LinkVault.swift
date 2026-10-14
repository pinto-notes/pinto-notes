import Foundation
import Security

/// Where a note's link is kept between launches: its id, its secret and what it lets people do.
/// The secret never leaves your devices except inside the link, so it lives in the Keychain, synced
/// through iCloud Keychain to your other devices (they can share the same link), never on our server.
protocol LinkVault {
    func load(_ note: UUID) -> LinkVaultEntry?
    /// False when it couldn't be kept (no Keychain access).
    @discardableResult func save(_ entry: LinkVaultEntry, for note: UUID) -> Bool
    func remove(_ note: UUID)
}

struct LinkVaultEntry: Codable, Equatable {
    var id: String
    var secret: Data
    /// "Can edit" or "Can view" (ShareState.Access). Off isn't kept: the entry is removed.
    var access: String
}

struct KeychainLinkVault: LinkVault {
    /// One service per account: another account on the same device has its own, and Start fresh
    /// removes all of one account's at once.
    static func service(_ account: UUID) -> String { AppIdentity.keychainPrefix + ".note-links." + account.uuidString.lowercased() }
    let account: UUID

    /// Keyed by the shared note's id: the same on every device, and what the server and the link use.
    private func query(_ note: UUID) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: Self.service(account),
         kSecAttrAccount as String: note.uuidString.lowercased(),
         kSecAttrSynchronizable as String: true, kSecUseDataProtectionKeychain as String: true]
    }

    /// Start fresh: the account's note keys are gone, so its links are too, on every device.
    static func removeAll(account: UUID) {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service(account),
                                kSecAttrSynchronizable as String: true, kSecUseDataProtectionKeychain as String: true]
        SecItemDelete(q as CFDictionary)
    }

    func load(_ note: UUID) -> LinkVaultEntry? {
        var q = query(note)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
        return try? JSONDecoder().decode(LinkVaultEntry.self, from: data)
    }

    @discardableResult func save(_ entry: LinkVaultEntry, for note: UUID) -> Bool {
        guard let data = try? JSONEncoder().encode(entry) else { return false }
        let q = query(note)
        let updated = SecItemUpdate(q as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        guard updated == errSecItemNotFound else { return updated == errSecSuccess }
        var add = q
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }

    func remove(_ note: UUID) { SecItemDelete(query(note) as CFDictionary) }
}

/// Links kept in memory only: tests, and the gallery.
final class MemoryLinkVault: LinkVault {
    private var entries: [UUID: LinkVaultEntry] = [:]
    func load(_ note: UUID) -> LinkVaultEntry? { entries[note] }
    @discardableResult func save(_ entry: LinkVaultEntry, for note: UUID) -> Bool { entries[note] = entry; return true }
    func remove(_ note: UUID) { entries[note] = nil }
}

/// The people whose safety code you checked, with the key you checked it for: a key that changes
/// later isn't checked any more. Only public keys are kept, in this device's defaults.
struct VerifiedPeople {
    let account: UUID?
    var defaults: UserDefaults = .standard

    private var storageKey: String { "collab.verified.\(account?.uuidString.lowercased() ?? "none")" }
    private var all: [String: String] { defaults.dictionary(forKey: storageKey) as? [String: String] ?? [:] }

    func isVerified(_ user: UUID, key: Data) -> Bool {
        account != nil && all[user.uuidString.lowercased()] == key.base64EncodedString()
    }

    func mark(_ user: UUID, key: Data) {
        guard account != nil else { return }
        var a = all
        a[user.uuidString.lowercased()] = key.base64EncodedString()
        defaults.set(a, forKey: storageKey)
    }
}
