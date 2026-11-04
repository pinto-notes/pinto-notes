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
    /// Every link of the account (Start fresh).
    func removeAll()
}

struct LinkVaultEntry: Codable, Equatable {
    var id: String
    var secret: Data
    /// "Can edit" or "Can view" (ShareState.Access). Off isn't kept: the entry is removed.
    var access: String
}

/// The Keychain calls the link vault makes, so a test can stand in a Keychain that refuses.
protocol LinkSecItems {
    func copy(_ query: [String: Any]) -> (OSStatus, Data?)
    func update(_ query: [String: Any], data: Data) -> OSStatus
    func add(_ query: [String: Any]) -> OSStatus
    func delete(_ query: [String: Any]) -> OSStatus
}

struct SystemLinkSecItems: LinkSecItems {
    func copy(_ query: [String: Any]) -> (OSStatus, Data?) {
        var q = query
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &out)
        return (status, out as? Data)
    }
    func update(_ query: [String: Any], data: Data) -> OSStatus {
        SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
    }
    func add(_ query: [String: Any]) -> OSStatus { SecItemAdd(query as CFDictionary, nil) }
    func delete(_ query: [String: Any]) -> OSStatus { SecItemDelete(query as CFDictionary) }
}

/// The link vault in the app: a synced Keychain item per note. A build that can't use the
/// data-protection Keychain (the Mac download and the Beta have no keychain access group, and the
/// Keychain answers errSecMissingEntitlement) keeps links in the app's private storage instead, as
/// the account key does (SessionStorage). There they survive a relaunch on that Mac but don't
/// reach the owner's other devices.
final class KeychainLinkVault: LinkVault {
    /// One service per account: another account on the same device has its own, and Start fresh
    /// removes all of one account's at once.
    static func service(_ account: UUID) -> String { AppIdentity.keychainPrefix + ".note-links." + account.uuidString.lowercased() }
    let account: UUID
    private let items: LinkSecItems
    private let fallback: SessionStorage
    /// The Keychain refused for want of an entitlement once: from then on, the fallback.
    private(set) var usesFallback = false

    /// `keychainWorks`: whether this build can write synced Keychain items. Decided up front, as the
    /// account key store decides it (a probe write): a build without the entitlement still reads
    /// "not found" rather than refusing, so a read alone can't tell.
    init(account: UUID, items: LinkSecItems = SystemLinkSecItems(), fallback: SessionStorage = SessionStorage(),
         keychainWorks: Bool = KeychainAccountKeyStore.dataProtectionAvailable) {
        self.account = account
        self.items = items
        self.fallback = fallback
        usesFallback = !keychainWorks
    }

    /// Keyed by the shared note's id: the same on every device, and what the server and the link use.
    private func query(_ note: UUID?) -> [String: Any] {
        var q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: Self.service(account),
                                kSecAttrSynchronizable as String: true, kSecUseDataProtectionKeychain as String: true]
        if let note { q[kSecAttrAccount as String] = note.uuidString.lowercased() }
        return q
    }

    private func refused(_ status: OSStatus) -> Bool {
        if status == errSecMissingEntitlement { usesFallback = true }
        return usesFallback
    }

    // The fallback: one file per note, and a list of the account's notes so Start fresh finds them.
    private var prefix: String { "note-link-\(account.uuidString.lowercased())-" }
    private var indexKey: String { "note-links-\(account.uuidString.lowercased())" }
    private func fallbackKey(_ note: UUID) -> String { prefix + note.uuidString.lowercased() }
    private var index: [UUID] {
        get { ((try? fallback.retrieve(key: indexKey)).flatMap { $0 }).flatMap { try? JSONDecoder().decode([UUID].self, from: $0) } ?? [] }
        set { if let d = try? JSONEncoder().encode(newValue) { try? fallback.store(key: indexKey, value: d) } }
    }

    func load(_ note: UUID) -> LinkVaultEntry? {
        var data: Data?
        if !usesFallback {
            let (status, out) = items.copy(query(note))
            if !refused(status) { data = out }
        }
        // Not in the Keychain (or no Keychain): a link kept in the app's own storage still counts.
        if data == nil { data = (try? fallback.retrieve(key: fallbackKey(note))).flatMap { $0 } }
        return data.flatMap { try? JSONDecoder().decode(LinkVaultEntry.self, from: $0) }
    }

    @discardableResult func save(_ entry: LinkVaultEntry, for note: UUID) -> Bool {
        guard let data = try? JSONEncoder().encode(entry) else { return false }
        if !usesFallback {
            let q = query(note)
            let updated = items.update(q, data: data)
            if !refused(updated) {
                guard updated == errSecItemNotFound else { return updated == errSecSuccess }
                var add = q
                add[kSecValueData as String] = data
                add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
                let added = items.add(add)
                if !refused(added) { return added == errSecSuccess }
            }
        }
        guard (try? fallback.store(key: fallbackKey(note), value: data)) != nil else { return false }
        if !index.contains(note) { index.append(note) }
        return true
    }

    func remove(_ note: UUID) {
        if !usesFallback { _ = refused(items.delete(query(note))) }
        // Both places: a copy in the app's own storage mustn't bring the link back.
        try? fallback.remove(key: fallbackKey(note))
        index.removeAll { $0 == note }
    }

    /// Start fresh: the account's note keys are gone, so its links are too (on every device, where
    /// the Keychain syncs them).
    func removeAll() {
        if !usesFallback { _ = refused(items.delete(query(nil))) }
        for note in index { try? fallback.remove(key: fallbackKey(note)) }
        try? fallback.remove(key: indexKey)
    }

    static func removeAll(account: UUID) { KeychainLinkVault(account: account).removeAll() }
}

/// Links kept in memory only: tests, and the gallery.
final class MemoryLinkVault: LinkVault {
    private var entries: [UUID: LinkVaultEntry] = [:]
    func load(_ note: UUID) -> LinkVaultEntry? { entries[note] }
    @discardableResult func save(_ entry: LinkVaultEntry, for note: UUID) -> Bool { entries[note] = entry; return true }
    func remove(_ note: UUID) { entries[note] = nil }
    func removeAll() { entries = [:] }
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
