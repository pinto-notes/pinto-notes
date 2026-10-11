import Foundation
import SwiftData

/// Sign Out and Remove Notes from This Mac: signing out, and this device's copy of the notes goes
/// with it. Plain Sign Out keeps the library and the key here for next time; this one leaves
/// nothing to read on the device, and nothing is lost by it:
///
///   1. It's offered only while something else can open the notes (`offer`). The key in iCloud
///      Keychain is never deleted, since that would take it from every device; a key that lives on
///      this device alone goes only when a saved recovery key or another device holds it too.
///   2. What hasn't synced goes up first, and the server has to answer. If anything is still
///      waiting, or the server can't be reached, it's refused and nothing here changes.
///   3. This device's row leaves the list of devices that hold the key before its key does, and
///      the list is read again: two devices leaving at the same moment each find the other gone,
///      and at least one of them stays.
///   4. "Removing" is written down, then the key and the library go, then the device signs out.
///      The mark is cleared last, so a quit midway is finished at the next launch
///      (`eraseIfInterrupted`, before anything is drawn, and `resumeIfInterrupted`).
@MainActor
struct SignOutRemoval {
    /// What the sign-out dialog offers. Pure.
    enum Offer: Equatable {
        /// `keyStays`: the key is an iCloud Keychain item, which stays where it is.
        case offered(keyStays: Bool)
        /// The key lives on this device alone and nothing else is known to hold it: removing it
        /// could leave the notes with nobody able to open them.
        case needsRecoveryKey
        /// The key isn't open here, so nothing can be pushed or checked: only Sign Out.
        case unavailable
    }

    /// Why a removal didn't happen. Nothing on the device changed.
    enum Refusal: Error, Equatable {
        case unsynced, offline, needsRecoveryKey, unavailable
    }

    static func offer(keyOpen: Bool, inICloudKeychain: Bool, recoverySaved: Bool, others: [KeyDevice], now: Date = .now) -> Offer {
        guard keyOpen else { return .unavailable }
        // Nothing of the key is deleted, so nothing can be lost.
        if inICloudKeychain { return .offered(keyStays: true) }
        if case .safe = KeyDeviceList.safety(thisBackedUp: false, others: others, recoverySaved: recoverySaved, now: now) { return .offered(keyStays: false) }
        return .needsRecoveryKey
    }

    /// The account whose removal is under way on this device (its id), until it's finished.
    static let pendingFlag = "signOut.removalPending"
    /// After this long the sync is given up, and the removal refused.
    static let pushLimit: Duration = .seconds(60)

    /// One removal at a time: signing out at its end tells the app, which looks for an unfinished one.
    @MainActor final class Gate {
        static let shared = Gate()
        var running = false
    }

    var defaults: UserDefaults = .standard
    var gate: Gate = .shared
    var offer: () -> Offer
    /// Syncs, pushing what's unsynced. True when the server answered and took it.
    var push: () async -> Bool
    /// Whether anything on this device hasn't reached the server, typing still on its way to the note included.
    var hasUnsynced: () -> Bool
    /// This device's row leaves the list of devices that hold the key, and the list is read again.
    /// Throws when the server can't be reached.
    var withdraw: () async throws -> Void
    var stopSync: () async -> Void
    /// Refused after the row left or sync stopped: both are as they were.
    var restore: () async -> Void
    /// Deletes the copies of the key that live on this device alone. Never the iCloud Keychain item.
    var dropKey: (UUID) -> Void
    /// Erases the local library and its files.
    var erase: () -> Void
    /// The device's epoch changes, and its row goes if it's still there (`KeyDevices.removalDone`).
    var forget: (UUID) async -> Void
    var signOut: () async -> Void

    func run(account: UUID) async throws {
        guard !gate.running else { return }
        gate.running = true
        defer { gate.running = false }
        try allowed()
        let reached = await push()
        guard !hasUnsynced() else { throw Refusal.unsynced }
        guard reached else { throw Refusal.offline }
        do { try await withdraw() } catch { throw Refusal.offline }
        do { try allowed() } catch { await restore(); throw error }
        await stopSync()
        // Nothing waits between this check and the erase, so nothing typed meanwhile is erased unseen.
        guard !hasUnsynced() else { await restore(); throw Refusal.unsynced }
        defaults.set(account.uuidString.lowercased(), forKey: Self.pendingFlag)
        await finish(account)
    }

    private func allowed() throws {
        switch offer() {
        case .offered: return
        case .needsRecoveryKey: throw Refusal.needsRecoveryKey
        case .unavailable: throw Refusal.unavailable
        }
    }

    /// At launch, before anything is drawn: the key and the library of a removal that was cut
    /// short go at once, so the notes are never shown again. `resumeIfInterrupted` does the rest.
    func eraseIfInterrupted() {
        guard let account = pending else { return }
        dropKey(account)
        erase()
    }

    /// A removal that was cut short is finished: it never pushes, since everything was on the
    /// server before the mark was written.
    func resumeIfInterrupted() async {
        guard !gate.running, let account = pending else { return }
        gate.running = true
        defer { gate.running = false }
        await stopSync()
        await finish(account)
    }

    private var pending: UUID? { defaults.string(forKey: Self.pendingFlag).flatMap(UUID.init(uuidString:)) }

    private func finish(_ account: UUID) async {
        dropKey(account)
        erase()
        await forget(account)
        await signOut()
        // Once more with the session gone: nothing a sync brought meanwhile is left behind.
        erase()
        // Last: with the session still here and the mark gone, the notes would come down again.
        defaults.removeObject(forKey: Self.pendingFlag)
    }
}

extension SignOutRemoval {
    /// The app's own: its library, sync, key and session. Tests hand in theirs.
    static func live(backend: Backend, sync: SyncEngine?, context: ModelContext, crypto: AccountCrypto = .shared, devices: KeyDevices = .shared,
                     vault: NoteVault = .shared, pages: NotePageStore = .shared, pageData: NotePageDataStore = .shared,
                     defaults: UserDefaults = .standard, files: URL? = nil, gate: Gate = .shared) -> SignOutRemoval {
        SignOutRemoval(
            defaults: defaults,
            gate: gate,
            offer: { offer(crypto: crypto, devices: devices) },
            push: {
                guard let sync else { return false }
                DebouncedSave.flushAll()
                let asked = Date.now
                _ = try? await AccountCrypto.within(pushLimit, sleep: { try await Task.sleep(for: $0) }) { @MainActor in await sync.sync() }
                // A sync that didn't run (no network, no key) leaves an earlier answer standing.
                if case .synced(let at) = sync.status { return at >= asked }
                return false
            },
            hasUnsynced: {
                DebouncedSave.flushAll()
                // The apps in notes go up on their own, and a failed push of theirs fails no sync.
                return AccountLibrary.hasUnsynced(context) || !pages.unpushed.isEmpty || !pageData.dirty.isEmpty
            },
            withdraw: { try await devices.withdraw(crypto) },
            stopSync: { await sync?.stop() },
            restore: {
                await devices.rejoin(crypto)
                await sync?.start()
            },
            dropKey: {
                crypto.forgetLocalKey(of: $0)
                // The key Face ID uses to open locked notes lives on this device only.
                vault.forgetDeviceKey()
            },
            erase: {
                AccountLibrary.erase(context: context, defaults: defaults, files: files)
                AccountLibrary.scrub(context)
            },
            forget: { await devices.removalDone(account: $0) },
            signOut: { await backend.signOut() })
    }

    static func offer(crypto: AccountCrypto, devices: KeyDevices) -> Offer {
        offer(keyOpen: crypto.isReady, inICloudKeychain: crypto.backedUp, recoverySaved: crypto.recoveryKeySaved, others: devices.others)
    }
}

/// The words of the sign-out dialog, by device ("Mac", "iPhone", "iPad").
enum SignOutCopy {
    static let title = "Sign out of Pinto Notes?"
    static let signOut = "Sign Out"
    static func remove(_ kind: String = InstallID.kind) -> String { "Sign Out and Remove Notes from This \(kind)" }
    static func removing(_ kind: String = InstallID.kind) -> String { "Removing notes from this \(kind)\u{2026}" }
    static let saveRecoveryKey = "Save a Recovery Key\u{2026}"

    static func message(_ offer: SignOutRemoval.Offer, kind: String = InstallID.kind) -> String {
        let stays = "Your notes stay in your account and come back when you sign in again. They also stay on this \(kind) unless you remove them."
        switch offer {
        case .offered(keyStays: true): return stays + " Your key stays in iCloud Keychain either way."
        case .offered(keyStays: false): return stays + " Removing them also removes your key from this \(kind)."
        case .needsRecoveryKey: return "Your notes stay in your account and on this \(kind), and come back when you sign in again. They can\u{2019}t be removed from this \(kind) yet. " + needsRecoveryKey
        case .unavailable: return "Your notes stay in your account and on this \(kind), and come back when you sign in again."
        }
    }

    static let needsRecoveryKey = "Save your recovery key first, or your notes could not be opened again."

    static func refusal(_ refusal: SignOutRemoval.Refusal, kind: String = InstallID.kind) -> String {
        switch refusal {
        case .unsynced: "Some changes haven\u{2019}t synced yet. Connect to the internet and try again."
        case .offline: "Can\u{2019}t reach Pinto Notes. Connect to the internet and try again."
        case .needsRecoveryKey: needsRecoveryKey
        case .unavailable: "Open your notes on this \(kind) first."
        }
    }
}
