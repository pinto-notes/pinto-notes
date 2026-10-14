import Foundation
import Security

/// Where a note's link is kept between launches: its id, its secret and what it lets people do.
/// The secret never leaves your devices except inside the link, so it lives in the Keychain, synced
/// through iCloud Keychain to your other devices (they can share the same link), never on our server.
protocol LinkVault {
    func load(_ note: UUID) -> LinkVaultEntry?
    func save(_ entry: LinkVaultEntry, for note: UUID)
    func remove(_ note: UUID)
}

struct LinkVaultEntry: Codable, Equatable {
    var id: String
    var secret: Data
    /// "Can edit" or "Can view" (ShareState.Access). Off isn't kept: the entry is removed.
    var access: String
}

struct KeychainLinkVault: LinkVault {
    static let service = AppIdentity.keychainPrefix + ".note-links"
    /// The account the links belong to: another account on the same device has its own.
    let account: UUID

    private func query(_ note: UUID) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: Self.service,
         kSecAttrAccount as String: "\(account.uuidString.lowercased()):\(note.uuidString.lowercased())",
         kSecAttrSynchronizable as String: true, kSecUseDataProtectionKeychain as String: true]
    }

    func load(_ note: UUID) -> LinkVaultEntry? {
        var q = query(note)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
        return try? JSONDecoder().decode(LinkVaultEntry.self, from: data)
    }

    func save(_ entry: LinkVaultEntry, for note: UUID) {
        guard let data = try? JSONEncoder().encode(entry) else { return }
        let q = query(note)
        if SecItemUpdate(q as CFDictionary, [kSecValueData as String: data] as CFDictionary) == errSecItemNotFound {
            var add = q
            add[kSecValueData as String] = data
            add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
            SecItemAdd(add as CFDictionary, nil)
        }
    }

    func remove(_ note: UUID) { SecItemDelete(query(note) as CFDictionary) }
}

/// Links kept in memory only: tests, and the gallery.
final class MemoryLinkVault: LinkVault {
    private var entries: [UUID: LinkVaultEntry] = [:]
    func load(_ note: UUID) -> LinkVaultEntry? { entries[note] }
    func save(_ entry: LinkVaultEntry, for note: UUID) { entries[note] = entry }
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
