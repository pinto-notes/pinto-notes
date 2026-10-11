import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// What the sign-out dialog offers, and says, by where the key is kept and what else holds it.
@MainActor @Suite struct SignOutOfferTests {
    private func other(seen: Date = .now, removing: Bool = false) -> KeyDevice {
        KeyDevice(id: UUID(), name: "Sara\u{2019}s iPhone", platform: "ios", how: .added, backedUp: false, addedAt: .now, seenAt: seen, removing: removing)
    }

    @Test func aKeyInICloudKeychainIsNeverAtRiskSoRemovingIsAlwaysOffered() {
        // The iPhone and the App Store Mac: the removal deletes nothing of the key.
        for saved in [false, true] {
            #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: true, recoverySaved: saved, others: []) == .offered(keyStays: true))
        }
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: true, recoverySaved: false, others: [other()]) == .offered(keyStays: true))
    }

    @Test func aKeyOnThisDeviceAloneGoesOnlyWhenSomethingElseHoldsIt() {
        // The Mac download, and a device that got its key from Add a device.
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: []) == .needsRecoveryKey)
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: true, others: []) == .offered(keyStays: false))
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [other()]) == .offered(keyStays: false))
    }

    @Test func aDeviceBeingRemovedOrNotSeenForAMonthIsNoWayBack() {
        let long = Date.now.addingTimeInterval(-KeyDevice.recent - 60)
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [other(removing: true)]) == .needsRecoveryKey)
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [other(seen: long)]) == .needsRecoveryKey)
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [other(seen: long), other()]) == .offered(keyStays: false))
    }

    @Test func withoutTheKeyOpenOnlySignOutIsThere() {
        for keychain in [false, true] {
            #expect(SignOutRemoval.offer(keyOpen: false, inICloudKeychain: keychain, recoverySaved: true, others: [other()]) == .unavailable)
        }
    }

    @Test func theDialogNamesTheDeviceAndSaysWhatHappensToTheKey() {
        #expect(SignOutCopy.remove("Mac") == "Sign Out and Remove Notes from This Mac")
        #expect(SignOutCopy.remove("iPhone") == "Sign Out and Remove Notes from This iPhone")
        #expect(SignOutCopy.remove("iPad") == "Sign Out and Remove Notes from This iPad")
        #expect(SignOutCopy.message(.offered(keyStays: true), kind: "iPhone")
                == "Your notes stay in your account and come back when you sign in again. They also stay on this iPhone unless you remove them. Your key stays in iCloud Keychain either way.")
        #expect(SignOutCopy.message(.offered(keyStays: false), kind: "Mac")
                == "Your notes stay in your account and come back when you sign in again. They also stay on this Mac unless you remove them. Removing them also removes your key from this Mac.")
        #expect(SignOutCopy.message(.needsRecoveryKey, kind: "Mac")
                == "Your notes stay in your account and on this Mac, and come back when you sign in again. They can\u{2019}t be removed from this Mac yet. Save your recovery key first, or your notes could not be opened again.")
        #expect(SignOutCopy.message(.unavailable, kind: "iPad") == "Your notes stay in your account and on this iPad, and come back when you sign in again.")
        #expect(SignOutCopy.refusal(.unsynced) == "Some changes haven\u{2019}t synced yet. Connect to the internet and try again.")
        // Sentence case, and no dashes, in everything the dialog can say.
        let all = [SignOutRemoval.Offer.offered(keyStays: true), .offered(keyStays: false), .needsRecoveryKey, .unavailable].map { SignOutCopy.message($0) }
            + [SignOutRemoval.Refusal.unsynced, .offline, .needsRecoveryKey, .unavailable].map { SignOutCopy.refusal($0) }
        for text in all { #expect(!text.contains("\u{2014}") && !text.contains("\u{2013}"), "\(text)") }
    }
}

/// Sign Out and Remove Notes, with a real key store, device list and library, and a server that
/// takes what's pushed or doesn't.
@MainActor @Suite(.serialized) struct SignOutRemovalTests {
    let user = UUID()
    /// Someone else who used this device before: nothing of theirs is touched.
    let stranger = UUID()
    let keyServer = KeyStartupTests.FakeServer()
    let list = KeyDevicesTests.FakeList()

    /// One device: its Keychain, its library and files, and what the removal did, in order.
    @MainActor final class Rig {
        let user: UUID
        let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud())
        let crypto: AccountCrypto
        let devices: KeyDevices
        let id = UUID()
        let context: ModelContext
        let defaults = TestDefaults()
        let files: URL
        let lockKeys = MemoryKeyStore(biometryName: "Face ID")
        let vault: NoteVault
        let gate = SignOutRemoval.Gate()
        /// The server takes what's pushed.
        var reachable = true
        var steps: [String] = []
        /// At each step: whether the removal was written down, and how many notes were still here.
        var pendingAt: [String: Bool] = [:]
        var notesAt: [String: Int] = [:]
        /// Typed while the removal was at this step.
        var typeDuring: String?

        init(user: UUID, syncs: Bool, list: KeyDeviceServer) throws {
            self.user = user
            keychain.syncs = syncs
            crypto = AccountCrypto(store: keychain, defaults: defaults, sleep: { _ in throw CancellationError() })
            devices = KeyDevices(device: id, platform: syncs ? "ios" : "macos", name: syncs ? "iPhone" : "Mac", identity: DeviceIdentity(store: MemoryDeviceIdentityStore()))
            devices.attach(account: user, server: list)
            context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
            files = FileManager.default.temporaryDirectory.appending(path: "SignOutRemovalTests.\(UUID().uuidString)", directoryHint: .isDirectory)
            vault = NoteVault(keyStore: lockKeys, defaults: MemoryDefaults())
            try FileManager.default.createDirectory(at: files, withIntermediateDirectories: true)
            try Data("a photo".utf8).write(to: files.appending(path: "photo.jpg"))
            AccountLibrary.adopt(user, context: context, defaults: defaults, files: files)
            defaults.set("cursor", forKey: "syncCursor.\(user.uuidString.lowercased())")
            defaults.set("a note", forKey: "lastNote")
        }

        var notes: Int { (try? context.fetchCount(FetchDescriptor<Note>())) ?? -1 }
        var hasFiles: Bool { FileManager.default.fileExists(atPath: files.path) }
        var pending: Bool { defaults.string(forKey: SignOutRemoval.pendingFlag) != nil }

        @discardableResult func note(_ body: String, synced: Bool) -> Note {
            let n = context.createNote(in: .all, body: body)
            n.dirty = !synced
            // The folder it made for the note is on the server.
            for f in context.allFoldersIncludingDeleted() { f.dirty = false }
            try? context.save()
            return n
        }

        private func mark(_ step: String) {
            steps.append(step)
            pendingAt[step] = pending
            notesAt[step] = notes
            if typeDuring == step { note("Typed meanwhile", synced: false) }
        }

        var removal: SignOutRemoval {
            SignOutRemoval(
                defaults: defaults,
                gate: gate,
                offer: { [self] in SignOutRemoval.offer(crypto: crypto, devices: devices) },
                push: { [self] in
                    mark("push")
                    guard reachable else { return false }
                    for n in (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.dirty }))) ?? [] { n.dirty = false }
                    return true
                },
                hasUnsynced: { [self] in AccountLibrary.hasUnsynced(context) },
                withdraw: { [self] in mark("withdraw"); try await devices.withdraw(crypto) },
                stopSync: { [self] in mark("stopSync") },
                restore: { [self] in mark("restore"); await devices.rejoin(crypto) },
                dropKey: { [self] in mark("dropKey"); crypto.forgetLocalKey(of: $0); vault.forgetDeviceKey() },
                erase: { [self] in mark("erase"); AccountLibrary.erase(context: context, defaults: defaults, files: files) },
                forget: { [self] in mark("forget"); await devices.removalDone(account: $0) },
                signOut: { [self] in mark("signOut") })
        }
    }

    /// A device with the account's key open and itself on the list. `syncs`: the iPhone and the App
    /// Store Mac keep the key as an iCloud Keychain item; the Mac download keeps it on itself.
    func device(syncs: Bool, adding key: StoredKey? = nil) async throws -> Rig {
        let rig = try Rig(user: user, syncs: syncs, list: list)
        await rig.crypto.attach(account: user, server: keyServer)
        if let key { try rig.crypto.adopt(added: key) }
        #expect(rig.crypto.phase == .ready)
        await rig.devices.refresh(rig.crypto)
        // Someone else's key and settings on the same device.
        rig.keychain.local[stranger] = StoredKey.generate()
        rig.keychain.synced[stranger] = StoredKey.generate()
        rig.defaults.set("theirs", forKey: "syncCursor.\(stranger.uuidString.lowercased())")
        _ = rig.lockKeys.save(SymmetricKey(size: .bits256), keyID: "lock")
        return rig
    }

    private func refusal(_ rig: Rig) async -> SignOutRemoval.Refusal? {
        do { try await rig.removal.run(account: user); return nil } catch { return error as? SignOutRemoval.Refusal }
    }

    // MARK: Whether it's offered

    @Test func withTheKeyInICloudKeychainItIsOffered() async throws {
        let phone = try await device(syncs: true)
        #expect(phone.crypto.backedUp)
        #expect(SignOutRemoval.offer(crypto: phone.crypto, devices: phone.devices) == .offered(keyStays: true))
        // Signed out, or before the key is open: only Sign Out.
        phone.crypto.signedOut()
        #expect(SignOutRemoval.offer(crypto: phone.crypto, devices: phone.devices) == .unavailable)
    }

    @Test func aDeviceAloneWithTheKeyIsRefusedUntilARecoveryKeyIsSaved() async throws {
        // The Mac download: the key lives on this Mac only.
        let mac = try await device(syncs: false)
        mac.note("Mine", synced: true)
        #expect(!mac.crypto.backedUp)
        #expect(SignOutRemoval.offer(crypto: mac.crypto, devices: mac.devices) == .needsRecoveryKey)
        #expect(await refusal(mac) == .needsRecoveryKey)
        #expect(mac.steps.isEmpty && mac.crypto.phase == .ready && mac.keychain.synced[user] != nil && mac.notes == 1 && mac.hasFiles, "nothing was tried")
        try await mac.crypto.markRecoveryKeySaved()
        #expect(SignOutRemoval.offer(crypto: mac.crypto, devices: mac.devices) == .offered(keyStays: false))
        mac.crypto.signedOut()
    }

    @Test func anotherDeviceThatHoldsTheKeyIsEnough() async throws {
        let phone = try await device(syncs: true)
        let mac = try await device(syncs: false, adding: try #require(phone.crypto.keyToHandOver))
        #expect(mac.devices.others.map(\.id) == [phone.id])
        #expect(SignOutRemoval.offer(crypto: mac.crypto, devices: mac.devices) == .offered(keyStays: false))
        for c in [phone.crypto, mac.crypto] { c.signedOut() }
    }

    // MARK: What hasn't synced

    @Test func unsyncedEditsThatCantGoUpRefuseTheRemovalAndNothingChanges() async throws {
        let phone = try await device(syncs: true)
        phone.note("On the server", synced: true)
        phone.note("Typed on the train", synced: false)
        phone.reachable = false
        #expect(await refusal(phone) == .unsynced)
        #expect(phone.steps == ["push"], "it stopped at the push")
        #expect(phone.notes == 2 && phone.hasFiles && AccountLibrary.hasUnsynced(phone.context))
        #expect(phone.crypto.phase == .ready && phone.keychain.synced[user] != nil)
        #expect(await phone.lockKeys.load(keyID: "lock", reason: "") != nil)
        #expect(!phone.pending && phone.defaults.string(forKey: AccountLibrary.ownerKey) != nil)
        #expect(list.rows.contains { $0.device_id == phone.id }, "still listed")
        phone.crypto.signedOut()
    }

    @Test func aServerThatDoesntAnswerRefusesItEvenWithNothingToPush() async throws {
        let phone = try await device(syncs: true)
        phone.note("On the server", synced: true)
        phone.reachable = false
        #expect(await refusal(phone) == .offline)
        #expect(phone.steps == ["push"] && phone.notes == 1 && phone.hasFiles && phone.crypto.phase == .ready && !phone.pending)
        phone.crypto.signedOut()
    }

    @Test func somethingTypedWhileItWasCheckingIsNeverErased() async throws {
        let phone = try await device(syncs: true)
        phone.note("On the server", synced: true)
        phone.typeDuring = "stopSync"
        #expect(await refusal(phone) == .unsynced)
        #expect(phone.steps == ["push", "withdraw", "stopSync", "restore"])
        #expect(phone.notes == 2 && phone.hasFiles && phone.crypto.phase == .ready && !phone.pending)
        #expect(list.rows.contains { $0.device_id == phone.id }, "it lists itself again")
        phone.crypto.signedOut()
    }

    // MARK: The wipe

    @Test func onADeviceWithTheKeyInICloudKeychainTheNotesGoAndTheKeyStays() async throws {
        let phone = try await device(syncs: true)
        let key = try #require(phone.crypto.keyToHandOver)
        phone.note("On the server", synced: true)
        phone.note("Typed on the train", synced: false)
        #expect(await refusal(phone) == nil)
        #expect(phone.steps == ["push", "withdraw", "stopSync", "dropKey", "erase", "forget", "signOut", "erase"])
        #expect(phone.notes == 0 && !phone.hasFiles)
        #expect(try phone.context.fetchCount(FetchDescriptor<Folder>()) == 0 && phone.context.fetchCount(FetchDescriptor<Pane.Attachment>()) == 0)
        #expect(phone.keychain.synced[user] == key && phone.keychain.cloud.keys[user] == key, "the iCloud Keychain item is untouched")
        #expect(phone.crypto.phase != .ready && phone.crypto.keyToHandOver == nil, "the key isn't open here any more")
        #expect(await phone.lockKeys.load(keyID: "lock", reason: "") == nil, "nor is the key Face ID opened locked notes with")
        #expect(phone.defaults.string(forKey: AccountLibrary.ownerKey) == nil && phone.defaults.string(forKey: "syncCursor.\(user.uuidString.lowercased())") == nil
                && phone.defaults.string(forKey: "lastNote") == nil, "signing in again starts from an empty library and pulls everything")
        #expect(!phone.pending)
        // Someone else's key and settings are as they were.
        #expect(phone.keychain.local[stranger] != nil && phone.keychain.synced[stranger] != nil)
        #expect(phone.defaults.string(forKey: "syncCursor.\(stranger.uuidString.lowercased())") == "theirs")
        phone.crypto.signedOut()
    }

    @Test func onADeviceThatKeepsTheKeyItselfTheKeyGoesToo() async throws {
        // The Mac download: every copy of the key lives on this Mac.
        let mac = try await device(syncs: false)
        try await mac.crypto.markRecoveryKeySaved()
        mac.note("On the server", synced: true)
        #expect(await refusal(mac) == nil)
        #expect(mac.notes == 0 && !mac.hasFiles)
        for slot in [KeySlot.synced, .pending, .local] { #expect(mac.keychain.load(account: user, slot: slot) == nil, "\(slot)") }
        #expect(mac.crypto.phase != .ready)
        #expect(!list.rows.contains { $0.device_id == mac.id }, "it no longer says it holds the key")
        #expect(mac.keychain.local[stranger] != nil && mac.keychain.synced[stranger] != nil, "someone else's key stays")
        mac.crypto.signedOut()
    }

    @Test func aKeyAnotherDeviceHandedOverGoesAndTheICloudKeychainOneStays() async throws {
        // An iPhone that got its key from Add a device keeps it on itself, beside the other's Keychain item.
        let phone = try await device(syncs: true)
        let key = try #require(phone.crypto.keyToHandOver)
        let added = try Rig(user: user, syncs: true, list: list)
        added.keychain.autoReceive = false
        await added.crypto.attach(account: user, server: keyServer)
        try added.crypto.adopt(added: key)
        await added.devices.refresh(added.crypto)
        await phone.devices.refresh(phone.crypto)
        #expect(!added.crypto.backedUp && added.keychain.local[user] == key)
        #expect(await refusal(added) == nil)
        #expect(added.keychain.local[user] == nil, "its own copy went")
        #expect(phone.keychain.synced[user] == key && phone.crypto.phase == .ready, "the other device's is as it was")
        for c in [phone.crypto, added.crypto] { c.signedOut() }
    }

    // MARK: Never the last copy

    @Test func twoDevicesThatOnlyHaveEachOtherCantBothLeave() async throws {
        let a = try await device(syncs: false)
        let b = try await device(syncs: false, adding: try #require(a.crypto.keyToHandOver))
        await a.devices.refresh(a.crypto)
        #expect(a.devices.others.map(\.id) == [b.id] && b.devices.others.map(\.id) == [a.id])
        b.note("B's", synced: true)
        #expect(await refusal(a) == nil, "A leaves: B still holds the key")
        // B's list is from before A left. It finds out before it gives up its key.
        #expect(b.devices.others.map(\.id) == [a.id])
        #expect(await refusal(b) == .needsRecoveryKey)
        #expect(b.steps == ["push", "withdraw", "restore"])
        #expect(b.crypto.phase == .ready && b.keychain.local[user] != nil && b.notes == 1 && b.hasFiles && !b.pending, "one device still opens the notes")
        #expect(list.rows.contains { $0.device_id == b.id }, "and says so")
        for c in [a.crypto, b.crypto] { c.signedOut() }
    }

    @Test func aServerThatCantTakeThisDeviceOffTheListRefusesIt() async throws {
        let mac = try await device(syncs: false)
        try await mac.crypto.markRecoveryKeySaved()
        mac.devices.attach(account: user, server: nil)
        #expect(await refusal(mac) == .offline)
        #expect(mac.steps == ["push", "withdraw"] && mac.crypto.phase == .ready && mac.keychain.synced[user] != nil && !mac.pending)
        mac.crypto.signedOut()
    }

    // MARK: A quit midway

    @Test func itIsWrittenDownBeforeAnythingGoesAndClearedAfterTheSessionIs() async throws {
        let mac = try await device(syncs: false)
        try await mac.crypto.markRecoveryKeySaved()
        mac.note("One", synced: true)
        mac.note("Two", synced: true)
        #expect(await refusal(mac) == nil)
        #expect(mac.pendingAt["push"] == false && mac.pendingAt["withdraw"] == false && mac.pendingAt["stopSync"] == false, "nothing is marked while it can still be refused")
        #expect(mac.pendingAt["dropKey"] == true && mac.pendingAt["signOut"] == true, "marked from the first thing that goes to the sign-out")
        #expect(mac.notesAt["signOut"] == 0, "the session never goes while notes are still here")
        #expect(!mac.pending)
        mac.crypto.signedOut()
    }

    @Test func aQuitMidwayIsFinishedAtTheNextLaunchWithoutPushing() async throws {
        // Killed right after the mark, with half the library erased, and after everything but the sign-out.
        for killedAfter in ["mark", "half", "erase"] {
            keyServer.row = nil
            list.rows = []
            let mac = try await device(syncs: false)
            try await mac.crypto.markRecoveryKeySaved()
            let one = mac.note("One", synced: true)
            mac.note("Two", synced: true)
            mac.defaults.set(user.uuidString.lowercased(), forKey: SignOutRemoval.pendingFlag)
            if killedAfter == "half" {
                mac.crypto.forgetLocalKey(of: user)
                mac.context.delete(one)
                try mac.context.save()
            }
            if killedAfter == "erase" {
                mac.crypto.forgetLocalKey(of: user)
                AccountLibrary.erase(context: mac.context, defaults: mac.defaults, files: mac.files)
            }
            // The next launch, before anything is drawn.
            mac.removal.eraseIfInterrupted()
            #expect(mac.notes == 0 && !mac.hasFiles && mac.keychain.synced[user] == nil && mac.crypto.phase != .ready, "\(killedAfter): nothing is left to show")
            #expect(mac.pending, "\(killedAfter): still to be signed out")
            mac.steps = []
            await mac.removal.resumeIfInterrupted()
            #expect(mac.steps == ["stopSync", "dropKey", "erase", "forget", "signOut", "erase"], "\(killedAfter): finished, with no push")
            #expect(!mac.pending && mac.notes == 0)
            // Done: the launch after that does nothing.
            mac.steps = []
            mac.removal.eraseIfInterrupted()
            await mac.removal.resumeIfInterrupted()
            #expect(mac.steps.isEmpty)
            mac.crypto.signedOut()
        }
    }

    @Test func aLaunchWithNothingUnfinishedTouchesNothing() async throws {
        let phone = try await device(syncs: true)
        phone.note("Mine", synced: false)
        phone.removal.eraseIfInterrupted()
        await phone.removal.resumeIfInterrupted()
        #expect(phone.steps.isEmpty && phone.notes == 1 && phone.hasFiles && phone.crypto.phase == .ready)
        phone.crypto.signedOut()
    }

    @Test func theSignOutAtItsEndDoesntStartItAgain() async throws {
        // Signing out tells the app, which looks for an unfinished removal while this one is still running.
        let phone = try await device(syncs: true)
        var resumed: [String] = []
        var r = phone.removal
        let signOut = r.signOut
        r.signOut = {
            await signOut()
            let before = phone.steps
            await phone.removal.resumeIfInterrupted()
            resumed = Array(phone.steps.dropFirst(before.count))
        }
        try await r.run(account: user)
        #expect(resumed.isEmpty && !phone.pending)
        phone.crypto.signedOut()
    }
}
