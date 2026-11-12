import Foundation
import SwiftData

/// Sign Out, as the alert's one Sign Out button does it (Emil, 12 November 2026: removing is the
/// default): signing out, and this device's copy of the notes goes with it. It leaves nothing to
/// read on the device, and nothing is lost by it. When it can't be done, the alert says why and
/// offers Sign Out and Keep Notes, which keeps the library and the key here for next time
/// (`SignOutFlow`).
///
///   1. It's offered only while something else can open the notes (`offer`). The key in iCloud
///      Keychain is never deleted, since that would take it from every device; a key that lives on
///      this device alone goes only when the server keeps a copy of it (signing in again brings it
///      back), or a saved recovery key or another device holds it too.
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

    /// `serverCopy`: the server keeps a copy of the key (KeyCopy), so signing in again brings it back.
    static func offer(keyOpen: Bool, inICloudKeychain: Bool, recoverySaved: Bool, others: [KeyDevice], serverCopy: Bool = false, now: Date = .now) -> Offer {
        guard keyOpen else { return .unavailable }
        // Nothing of the key is deleted, so nothing can be lost.
        if inICloudKeychain { return .offered(keyStays: true) }
        if serverCopy { return .offered(keyStays: false) }
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
    /// Reads from the server again whether it keeps a copy of the key. Throws when it can't be
    /// reached. What `offer` says after this is as the server is now, never as it was remembered.
    var refreshCopy: () async throws -> Void = {}
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
        // The server's copy may be why the key can go from here. Whether it's there is asked
        // now: Advanced protection may have been turned on since this device last looked.
        do { try await refreshCopy() } catch { await restore(); throw Refusal.offline }
        do { try allowed() } catch { await restore(); throw error }
        await stopSync()
        // Nothing waits between this check and the erase, so nothing typed meanwhile is erased unseen.
        guard !hasUnsynced() else { await restore(); throw Refusal.unsynced }
        defaults.set(account.uuidString.lowercased(), forKey: Self.pendingFlag)
        await finish(account)
    }

    /// The account was deleted on the server: nothing there to push to or keep, and this device's
    /// copy of its notes goes, as with Sign Out and Remove Notes. Then signed out.
    func runAfterAccountGone(account: UUID) async {
        guard !gate.running else { return }
        gate.running = true
        defer { gate.running = false }
        await stopSync()
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
            refreshCopy: { try await crypto.refreshCopyState() },
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
        offer(keyOpen: crypto.isReady, inICloudKeychain: crypto.backedUp, recoverySaved: crypto.recoveryKeySaved, others: devices.others, serverCopy: crypto.serverCopy)
    }
}

/// The words of the sign-out alert, by device ("Mac", "iPhone", "iPad").
enum SignOutCopy {
    static let signOut = "Sign Out"
    static let keepNotes = "Sign Out and Keep Notes"
    static let cancel = "Cancel"
    static func removing(_ kind: String = InstallID.kind) -> String { "Removing notes from this \(kind)\u{2026}" }
    static let saveRecoveryKey = "Save a Recovery Key\u{2026}"
    static let title = "Sign out?"
    static let refusedTitle = "Couldn\u{2019}t remove your notes"

    static func title(_ choice: SignOutAsk.Choice) -> String {
        switch choice {
        case .signOut: signOut
        case .keepNotes: keepNotes
        case .saveRecoveryKey: saveRecoveryKey
        case .cancel: cancel
        }
    }

    /// What Sign Out does when it removes the notes.
    static func removes(keyStays: Bool, kind: String = InstallID.kind) -> String {
        keyStays ? "This removes your notes from this \(kind). They stay in your account."
                 : "This removes your notes and key from this \(kind). They stay in your account."
    }

    /// Why the notes can't be removed now, in one line. `unsynced`: how many changes are still
    /// here (0 when only something else is, such as an app's page). `offline`: this device has no
    /// network, rather than the server not answering.
    static func why(_ refusal: SignOutRemoval.Refusal, unsynced: Int = 0, offline: Bool = false, kind: String = InstallID.kind) -> String {
        switch refusal {
        case .unsynced:
            switch unsynced {
            case 0: "Some changes haven\u{2019}t synced yet."
            case 1: "1 change hasn\u{2019}t synced yet."
            default: "\(unsynced) changes haven\u{2019}t synced yet."
            }
        case .offline: offline ? "You\u{2019}re offline." : "Pinto Notes can\u{2019}t be reached."
        case .needsRecoveryKey: "This \(kind) holds the only copy of your key. Save your recovery key first."
        case .unavailable: "Your notes aren\u{2019}t open on this \(kind), so they can\u{2019}t be removed."
        }
    }
}

/// The sign-out alert, on the Mac and on iPhone and iPad: a title, at most one line, and its
/// buttons in order, the first the default.
struct SignOutAsk: Equatable {
    enum Choice: Equatable {
        /// Signs out and removes this device's notes (`SignOutRemoval.run`).
        case signOut
        /// Signs out and leaves the notes and key here (`Backend.signOut`).
        case keepNotes
        case saveRecoveryKey
        case cancel
    }

    let title: String
    let line: String?
    let choices: [Choice]

    /// Asked when Sign Out… is pressed. Sign Out removes the notes whenever that's safe; when it
    /// isn't, the line says why and Sign Out and Keep Notes is offered instead.
    static func first(_ offer: SignOutRemoval.Offer, kind: String = InstallID.kind) -> SignOutAsk {
        switch offer {
        case .offered(let keyStays):
            SignOutAsk(title: SignOutCopy.title, line: SignOutCopy.removes(keyStays: keyStays, kind: kind), choices: [.signOut, .cancel])
        case .needsRecoveryKey:
            SignOutAsk(title: SignOutCopy.title, line: SignOutCopy.why(.needsRecoveryKey, kind: kind), choices: [.keepNotes, .saveRecoveryKey, .cancel])
        case .unavailable:
            SignOutAsk(title: SignOutCopy.title, line: SignOutCopy.why(.unavailable, kind: kind), choices: [.keepNotes, .cancel])
        }
    }

    /// Asked when Sign Out was refused. Nothing on the device changed, and it's still signed in.
    static func refused(_ refusal: SignOutRemoval.Refusal, unsynced: Int = 0, offline: Bool = false, kind: String = InstallID.kind) -> SignOutAsk {
        SignOutAsk(title: SignOutCopy.refusedTitle, line: SignOutCopy.why(refusal, unsynced: unsynced, offline: offline, kind: kind),
                   choices: refusal == .needsRecoveryKey ? [.keepNotes, .saveRecoveryKey, .cancel] : [.keepNotes, .cancel])
    }
}

/// Sign Out… from start to end: what the alert asks (`ask`, nil when nothing is asked), and what
/// each of its buttons does. The views only show `ask` and hand back the button pressed.
@MainActor @Observable final class SignOutFlow {
    private(set) var ask: SignOutAsk?
    private(set) var removing = false

    let kind: String
    private let offer: () -> SignOutRemoval.Offer
    /// Signs out and removes the notes; throws a `Refusal` and changes nothing when it can't.
    private let remove: () async throws -> Void
    private let keep: () async -> Void
    private let showRecoveryKey: () -> Void
    private let unsynced: () -> Int
    private let offline: () -> Bool

    init(kind: String = InstallID.kind, offer: @escaping () -> SignOutRemoval.Offer, remove: @escaping () async throws -> Void,
         keep: @escaping () async -> Void, showRecoveryKey: @escaping () -> Void, unsynced: @escaping () -> Int = { 0 }, offline: @escaping () -> Bool = { false }) {
        self.kind = kind
        self.offer = offer
        self.remove = remove
        self.keep = keep
        self.showRecoveryKey = showRecoveryKey
        self.unsynced = unsynced
        self.offline = offline
    }

    /// Sign Out… was pressed.
    func start() {
        guard !removing else { return }
        ask = .first(offer(), kind: kind)
    }

    /// A button was pressed in an alert that closes by itself (iPhone's): it's gone at once, and
    /// what the button does follows.
    func answer(_ choice: SignOutAsk.Choice) {
        ask = nil
        Task { await choose(choice) }
    }

    /// A button of the alert was pressed (or it was closed: `.cancel`).
    func choose(_ choice: SignOutAsk.Choice) async {
        ask = nil
        switch choice {
        case .signOut:
            removing = true
            defer { removing = false }
            do {
                try await remove()
            } catch {
                let why = error as? SignOutRemoval.Refusal ?? .offline
                ask = .refused(why, unsynced: why == .unsynced ? unsynced() : 0, offline: offline(), kind: kind)
            }
        case .keepNotes: await keep()
        case .saveRecoveryKey: showRecoveryKey()
        case .cancel: break
        }
    }
}

extension SignOutFlow {
    /// The app's own: this device's library, sync, key and session.
    static func live(backend: Backend, sync: SyncEngine?, context: ModelContext, crypto: AccountCrypto = .shared, devices: KeyDevices = .shared,
                     pages: NotePageStore = .shared, pageData: NotePageDataStore = .shared, showRecoveryKey: @escaping () -> Void) -> SignOutFlow {
        SignOutFlow(
            offer: { SignOutRemoval.offer(crypto: crypto, devices: devices) },
            remove: {
                guard let account = backend.userID else { throw SignOutRemoval.Refusal.unavailable }
                try await SignOutRemoval.live(backend: backend, sync: sync, context: context, crypto: crypto, devices: devices, pages: pages, pageData: pageData).run(account: account)
            },
            keep: { await backend.signOut() },
            showRecoveryKey: showRecoveryKey,
            unsynced: {
                DebouncedSave.flushAll()
                return AccountLibrary.unsyncedCount(context) + pages.unpushed.count + pageData.dirty.count
            },
            offline: { sync?.reach == .offline })
    }
}
