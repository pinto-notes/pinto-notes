import CryptoKit
import Foundation
import Testing
@testable import Pane

/// The server's copy of the account's key (KeyCopy, docs/Technical/recoverable-key.md): signing in
/// is enough to open the notes on a new device, unless the account keeps its key on its devices
/// only. A fake Keychain per device and one fake server, which seals nothing: what crosses is
/// checked by `KeyCopyBox` against the vectors the server's tests check too.
@MainActor @Suite(.serialized) struct KeyCopyTests {
    typealias Keychain = KeyStartupTests.FakeKeychain

    /// The account's key row and the `key` function, as one server.
    final class Server: AccountKeyServer, KeyCopyServer, @unchecked Sendable {
        var row: ServerKey?
        var generation = 0
        var protection: KeyProtection?
        /// account_key_copies: what a device stored.
        var copy: StoredKey?
        /// KEY_COPY isn't on.
        var off = false
        var offline = false
        /// The function can't be reached, while the rest of the server can.
        var functionDown = false
        /// Storing a copy fails, while the function answers everything else.
        var storeFails = false
        /// A password reset in the last 72 hours.
        var pausedUntil: Date?
        /// What `fetch` hands out instead of the copy (a server gone wrong).
        var handsOut: StoredKey?
        /// keep_key_on_devices is satisfied: a recovery key was saved or another device holds the key.
        var anotherWayBack = false
        private(set) var stores: [Bool] = []
        private(set) var fetches = 0
        private(set) var asked = 0

        func fetch() async throws -> ServerKeyState {
            if offline { throw URLError(.notConnectedToInternet) }
            return ServerKeyState(key: row, generation: generation, protection: protection, copy: copy != nil && copy?.keyID == row?.key_id)
        }

        func create(_ key: ServerKey, generation: Int) async throws -> (key: ServerKey, created: Bool) {
            if offline { throw URLError(.notConnectedToInternet) }
            if generation < self.generation { throw KeyError.staleGeneration }
            let made = row == nil
            if made { row = key }
            return (row!, made)
        }

        func markRecoveryKeySaved() async throws -> Date? {
            row?.recovery_saved_at = Date(timeIntervalSince1970: 1000)
            anotherWayBack = true
            return row?.recovery_saved_at
        }

        func startFresh(keyID: String) async throws -> Bool {
            guard row?.key_id == keyID else { return false }
            row = nil
            copy = nil
            generation += 1
            return true
        }

        func available() async throws -> Bool {
            asked += 1
            if offline || functionDown { throw KeyCopyError.offline }
            return !off
        }

        func store(_ key: StoredKey, user: UUID, choose: Bool) async throws {
            if offline || functionDown || storeFails { throw KeyCopyError.offline }
            if off { throw KeyCopyError.off }
            stores.append(choose)
            guard let row else { throw KeyCopyError.noCopy }
            if !choose, protection != .standard { throw protection == .strict ? KeyCopyError.strict : KeyCopyError.notChosen }
            guard AccountCrypto.isAccountsKey(key, row, user: user) else { throw KeyCopyError.wrongKey }
            copy = key
            protection = .standard
        }

        func fetch(user: UUID, keyID: String) async throws -> StoredKey {
            fetches += 1
            if offline || functionDown { throw KeyCopyError.offline }
            if off { throw KeyCopyError.off }
            if protection == .strict { throw KeyCopyError.strict }
            guard let copy, copy.keyID == row?.key_id else { throw KeyCopyError.noCopy }
            if let pausedUntil { throw KeyCopyError.paused(until: pausedUntil) }
            return handsOut ?? copy
        }

        func keepOnDevices(device: UUID) async throws {
            if offline { throw KeyCopyError.offline }
            guard anotherWayBack else { throw KeyCopyError.needsRecoveryKey }
            protection = .strict
            copy = nil
        }
    }

    let user = UUID()
    let server = Server()
    let defaults = UserDefaults(suiteName: "key-copy-\(UUID())")!

    /// A device with a Keychain of its own, which shares nothing with any other (no iCloud Keychain).
    func device(_ keychain: Keychain? = nil) -> (AccountCrypto, Keychain) {
        let k = keychain ?? Keychain(cloud: KeyStartupTests.Cloud())
        return (AccountCrypto(store: k, defaults: defaults, sleep: { _ in throw CancellationError() }), k)
    }

    func attach(_ crypto: AccountCrypto) async { await crypto.attach(account: user, server: server, copies: server) }

    /// An account from before copies: a device holds its key, and nobody has chosen anything.
    func accountFromBefore() throws -> (AccountCrypto, Keychain, StoredKey) {
        let k = StoredKey.generate()
        server.row = try k.serverRow(user: user)
        let keychain = Keychain(cloud: KeyStartupTests.Cloud())
        keychain.synced[user] = k
        let (crypto, _) = device(keychain)
        return (crypto, keychain, k)
    }

    // MARK: The boxes on the way

    struct Vectors: Decodable {
        var user_id: String, data: String, recovery: String, id: String, nonce: String
        var receiver_private: String, receiver_public: String, sender_ephemeral_private: String
        var up: String, down: String
    }

    /// supabase/functions/_shared/keycopy-vectors.json, the file the server's tests check too.
    @Test func theBoxesAreExactlyTheServers() throws {
        let url = try #require(Bundle(for: VectorsToken.self).url(forResource: "keycopy-vectors", withExtension: "json"))
        let v = try JSONDecoder().decode(Vectors.self, from: Data(contentsOf: url))
        let user = try #require(UUID(uuidString: v.user_id))
        let key = try #require(StoredKey(dataKey: Data(base64Encoded: v.data)!, recovery: Data(base64Encoded: v.recovery)!))
        #expect(key.keyID == v.id)
        let receiver = try P256.KeyAgreement.PrivateKey(rawRepresentation: Data(base64Encoded: v.receiver_private)!)
        let receiverPublic = Data(base64Encoded: v.receiver_public)!
        #expect(receiver.publicKey.x963Representation == receiverPublic)
        let ephemeral = try P256.KeyAgreement.PrivateKey(rawRepresentation: Data(base64Encoded: v.sender_ephemeral_private)!)
        let nonce = try AES.GCM.Nonce(data: Data(base64Encoded: v.nonce)!)
        #expect(try KeyCopyBox.seal(key, to: receiverPublic, direction: .up, user: user, ephemeral: ephemeral, nonce: nonce) == v.up)
        #expect(try KeyCopyBox.seal(key, to: receiverPublic, direction: .down, user: user, ephemeral: ephemeral, nonce: nonce) == v.down)
        #expect(try KeyCopyBox.open(v.down, with: receiver, direction: .down, user: user, keyID: v.id, generation: 4) == StoredKey(dataKey: key.dataKey, recovery: key.recovery, generation: 4))
        #expect(try KeyCopyBox.open(v.up, with: receiver, direction: .up, user: user, keyID: v.id) == key)

        // Only for its own direction, account, key id and receiver.
        #expect(throws: E2EE.Failure.wrongKey) { try KeyCopyBox.open(v.down, with: receiver, direction: .up, user: user, keyID: v.id) }
        #expect(throws: E2EE.Failure.wrongKey) { try KeyCopyBox.open(v.down, with: receiver, direction: .down, user: UUID(), keyID: v.id) }
        #expect(throws: E2EE.Failure.wrongKey) { try KeyCopyBox.open(v.down, with: receiver, direction: .down, user: user, keyID: String(repeating: "0", count: 16)) }
        #expect(throws: E2EE.Failure.wrongKey) { try KeyCopyBox.open(v.down, with: .init(), direction: .down, user: user, keyID: v.id) }
        #expect(throws: E2EE.Failure.malformed) { try KeyCopyBox.open("amb2t.AAAA", with: receiver, direction: .down, user: user, keyID: v.id) }
        #expect(throws: E2EE.Failure.malformed) { try KeyCopyBox.seal(key, to: receiverPublic.prefix(33), direction: .up, user: user) }
        // Sealed at random it's a different box each time, with the same key inside.
        let again = try KeyCopyBox.seal(key, to: receiverPublic, direction: .down, user: user)
        #expect(again != v.down)
        #expect(try KeyCopyBox.open(again, with: receiver, direction: .down, user: user, keyID: v.id) == key)
    }

    // MARK: The decision

    @Test func withACopyADeviceWithoutTheKeyFetchesIt() throws {
        let k = StoredKey.generate(), other = StoredKey.generate()
        let row = try k.serverRow(user: user)
        #expect(KeyStartup.decide(user: user, synced: nil, pending: nil, server: .key(row), copy: true) == .fetch(mismatch: false))
        #expect(KeyStartup.decide(user: user, synced: other, pending: nil, server: .key(row), copy: true) == .fetch(mismatch: true))
        // A key that's here and the account's is used as it is: nothing is fetched.
        #expect(KeyStartup.decide(user: user, synced: k, pending: nil, server: .key(row), copy: true) == .ready(k, verified: true, promote: false))
        #expect(KeyStartup.decide(user: user, synced: other, pending: nil, local: k, server: .key(row), copy: true) == .ready(k, verified: true, promote: false))
        #expect(KeyStartup.decide(user: user, synced: nil, pending: k, server: .key(row), copy: true) == .ready(k, verified: true, promote: true))
        // Without a copy (a strict account, or one from before): as it always was.
        #expect(KeyStartup.decide(user: user, synced: nil, pending: nil, server: .key(row), copy: false) == .wait)
        #expect(KeyStartup.decide(user: user, synced: other, pending: nil, server: .key(row)) == .mismatch)
        // A copy changes nothing when there's no key row, or no server.
        #expect(KeyStartup.decide(user: user, synced: nil, pending: nil, server: .none(generation: 0), copy: true) == .create(generation: 0))
        #expect(KeyStartup.decide(user: user, synced: nil, pending: nil, server: .unreachable, copy: true) == .unreachable)
        #expect(AccountCrypto.outcome(.fetch(mismatch: false)) == .fetch)
    }

    // MARK: A new account

    @Test func aNewAccountStoresACopyAndASecondDeviceOpensBySigningIn() async throws {
        let (first, firstKeychain) = device()
        await attach(first)
        #expect(first.phase == .ready && first.serverCopy && first.protection == .standard)
        #expect(!first.asksProtection, "a new account isn't asked: a copy is the default")
        #expect(server.stores == [true] && server.copy == firstKeychain.synced[user])
        #expect(KeyCopy.welcomeMessage(recoverable: first.serverCopy).contains("Signing in opens them"))

        // Another device, with nothing in its Keychain and no iCloud Keychain: no linking screen.
        let (second, secondKeychain) = device()
        await attach(second)
        #expect(second.phase == .ready && !second.unverified && second.arrivedHow == .signIn)
        #expect(KeyGateView.shown(second.phase, .auto, held: second.held) == .welcome)
        #expect(secondKeychain.synced[user] == firstKeychain.synced[user], "kept, so the next launch has it")
        #expect(second.dataKey.map(E2EE.bytes) == first.dataKey.map(E2EE.bytes))
        #expect(second.recoveryKeyText == first.recoveryKeyText, "the same recovery key on every device")
        #expect(server.fetches == 1 && !second.keyNotSaved)

        // Its next launch opens with the key it kept, and asks the server for nothing.
        let (again, _) = device(secondKeychain)
        #expect(again.openHeld(account: user))
        await attach(again)
        #expect(again.phase == .ready && server.fetches == 1 && server.stores == [true])
    }

    @Test func aNewAccountsCopyIsStoredLaterWhenTheServerCouldNotTakeItAtFirst() async throws {
        // The function says it keeps copies, and then the store itself doesn't get through.
        server.storeFails = true
        let (first, keychain) = device()
        await attach(first)
        #expect(first.phase == .ready && !first.serverCopy && server.copy == nil, "the notes open all the same")
        #expect(!first.asksProtection)
        #expect(KeyCopy.welcomeMessage(recoverable: first.serverCopy).contains("Only your devices"))
        server.storeFails = false
        await first.recheck()
        #expect(first.serverCopy && first.protection == .standard && server.copy == keychain.synced[user])
        #expect(!first.asksProtection, "still the account this build made where copies are kept: never asked")
    }

    @Test func whileTheServerKeepsNoCopiesNothingIsStoredOrAskedAndItIsNotAskedAtEveryLaunch() async throws {
        server.off = true
        let (first, keychain) = device()
        await attach(first)
        #expect(first.phase == .ready && !first.serverCopy && server.stores.isEmpty && !first.asksProtection && !first.copiesOn)
        #expect(server.asked == 1)
        #expect(!defaults.bool(forKey: AccountCrypto.copyByDefaultKey(user)), "made while only devices held keys: it will be asked, not copied")
        await first.recheck()
        await first.recheck()
        #expect(server.asked == 1, "off is remembered for a few hours")
        // A second device then waits as devices always did.
        let (second, _) = device()
        await attach(second)
        #expect(second.phase == .waiting && !second.copiesOffered && server.fetches == 0)
        // Switched on, and the hours over: the account was made under the old promise, so its
        // device asks first and stores nothing by itself.
        server.off = false
        defaults.set(Date.now.addingTimeInterval(-1), forKey: AccountCrypto.copiesOffUntilKey)
        await first.recheck()
        #expect(first.asksProtection && !first.serverCopy && server.stores.isEmpty)
        try await first.keepCopy()
        #expect(first.serverCopy && server.copy == keychain.synced[user])
    }

    // MARK: An account from before

    @Test func anAccountFromBeforeIsAskedAndNothingIsStoredUntilItAnswers() async throws {
        let (first, _, k) = try accountFromBefore()
        await attach(first)
        #expect(first.phase == .ready && first.asksProtection && first.copiesOn)
        #expect(server.stores.isEmpty && server.copy == nil && first.protection == nil)
        await first.recheck()
        #expect(server.stores.isEmpty, "asking again stores nothing either")

        // Meanwhile its second device shows the code for another device, and says what else opens it.
        let (second, secondKeychain) = device()
        await attach(second)
        #expect(second.phase == .waiting && second.copiesOffered && server.fetches == 0)
        #expect(KeyGateView.shown(second.phase, .auto, held: second.held) == .addDevice)
        #expect(await second.pollCopy() == false)

        // Continue on the first device: the copy is stored, and the second opens by itself.
        try await first.keepCopy()
        #expect(!first.asksProtection && first.serverCopy && first.protection == .standard && server.stores == [true])
        #expect(await second.pollCopy())
        #expect(second.phase == .ready && second.arrivedHow == .signIn && secondKeychain.synced[user] == k)
    }

    @Test func askMeLaterStoresNothingAndAsksAgainAtTheNextLaunch() async throws {
        let (first, keychain, _) = try accountFromBefore()
        await attach(first)
        first.askProtectionLater()
        #expect(!first.asksProtection)
        await first.recheck()
        #expect(!first.asksProtection && server.stores.isEmpty)
        let (next, _) = device(keychain)
        await attach(next)
        #expect(next.asksProtection)
    }

    @Test func anAnswerOnOneDeviceEndsTheQuestionOnTheOthers() async throws {
        let (first, keychain, _) = try accountFromBefore()
        await attach(first)
        let (other, _) = device(keychain)
        await attach(other)
        #expect(first.asksProtection && other.asksProtection)
        server.anotherWayBack = true
        try await other.keepOnDevicesOnly(device: UUID())
        await first.recheck()
        #expect(!first.asksProtection && first.protection == .strict && server.stores.isEmpty)
    }

    @Test func anAccountThatStartedFreshIsAskedLikeAnyFromBefore() async throws {
        server.generation = 1
        let (first, _) = device()
        await attach(first)
        #expect(first.phase == .ready && first.asksProtection && server.stores.isEmpty)
    }

    // MARK: Advanced protection

    @Test func strictDeletesTheCopyAndANewDeviceIsAskedToLink() async throws {
        let (first, _) = device()
        await attach(first)
        #expect(server.copy != nil)
        // Nothing else could open the notes: refused, and the copy stays.
        await #expect(throws: KeyCopyError.needsRecoveryKey) { try await first.keepOnDevicesOnly(device: UUID()) }
        #expect(server.copy != nil && first.protection == .standard)
        try await first.markRecoveryKeySaved()
        try await first.keepOnDevicesOnly(device: UUID())
        #expect(server.copy == nil && first.protection == .strict && !first.serverCopy)
        await first.recheck()
        #expect(server.copy == nil && server.stores == [true], "a strict account's device never stores a copy again by itself")

        let (second, _) = device()
        await attach(second)
        #expect(second.phase == .waiting && !second.copiesOffered && server.fetches == 0)
        #expect(KeyGateView.shown(second.phase, .auto, held: second.held) == .addDevice)
        #expect(await second.pollCopy() == false)

        // Turned off again: a copy goes back, and the waiting device opens.
        try await first.keepCopy()
        #expect(server.copy != nil && first.protection == .standard)
        #expect(await second.pollCopy())
        #expect(second.phase == .ready)
    }

    @Test func aStandardAccountsMissingCopyIsStoredAgainSilently() async throws {
        let (first, keychain) = device()
        await attach(first)
        server.copy = nil   // the function's secret was lost, and its rows deleted
        let (next, _) = device(keychain)
        await attach(next)
        #expect(server.copy == keychain.synced[user] && server.stores == [true, false] && !next.asksProtection)
    }

    // MARK: What the server hands out is checked

    @Test func aKeyThatIsNotTheAccountsIsNeverUsed() async throws {
        let (first, _) = device()
        await attach(first)
        server.handsOut = StoredKey.generate()
        let (second, keychain) = device()
        await attach(second)
        #expect(second.phase == .waiting && second.dataKey == nil)
        #expect(keychain.synced[user] == nil && keychain.local[user] == nil, "nothing of it is kept")
        // The right data key with someone else's recovery key isn't the account's either.
        let real = try #require(server.copy)
        server.handsOut = StoredKey(dataKey: real.dataKey, recovery: E2EE.randomBytes(16))
        await second.restart()
        #expect(second.phase == .waiting)
    }

    @Test func nextToAWrongKeychainKeyTheCopyIsKeptOnThisDeviceOnly() async throws {
        let (first, _) = device()
        await attach(first)
        let stale = StoredKey.generate()
        let keychain = Keychain(cloud: KeyStartupTests.Cloud())
        keychain.synced[user] = stale
        let (second, _) = device(keychain)
        await attach(second)
        #expect(second.phase == .ready && !second.backedUp)
        #expect(keychain.synced[user] == stale && keychain.local[user] == server.copy)
    }

    @Test func aKeychainThatRefusesTheKeySaysSoOnce() async throws {
        let (first, _) = device()
        await attach(first)
        let keychain = Keychain(cloud: KeyStartupTests.Cloud())
        keychain.refusesAll = true
        let (second, _) = device(keychain)
        await attach(second)
        #expect(second.phase == .ready && second.keyNotSaved)
    }

    // MARK: After a password reset

    @Test func afterAPasswordResetTheKeyWaitsAndTheOtherWaysStillWork() async throws {
        let (first, _) = device()
        await attach(first)
        let until = Date.now.addingTimeInterval(72 * 3600)
        server.pausedUntil = until
        let (second, _) = device()
        await attach(second)
        #expect(second.phase == .waiting && second.held && second.heldUntil == until)
        #expect(KeyGateView.shown(second.phase, .auto, held: second.held) == .held)
        #expect(KeyGateView.shown(second.phase, .link, held: second.held) == .addDevice, "adding it from another device is one tap away")
        #expect(KeyGateView.shown(second.phase, .recovery, held: second.held) == .recovery)
        #expect(GateScreen(.held).rawValue == "held")
        #expect(KeyCopyWords.heldMessage(until: until).contains("password was just reset"))
        // Nothing is asked before the time the server gave.
        let asked = server.fetches
        #expect(await second.pollCopy() == false && server.fetches == asked)
        // The recovery key opens the notes meanwhile.
        try await second.recover(typed: try #require(first.recoveryKeyText))
        #expect(second.phase == .ready && !second.held && second.arrivedHow == .recovery)

        // A third device waits it out: when the time has come, it opens by itself.
        let (third, _) = device()
        await attach(third)
        #expect(third.held)
        server.pausedUntil = nil
        #expect(await third.pollCopy(now: until.addingTimeInterval(1)))
        #expect(third.phase == .ready && !third.held && third.arrivedHow == .signIn)
    }

    @Test func offlineWithoutTheKeyRetriesAndTheFunctionBeingDownFallsBackToLinking() async throws {
        let (first, _) = device()
        await attach(first)
        server.functionDown = true
        let (second, _) = device()
        await attach(second)
        #expect(second.phase == .unreachable, "the copy is there and couldn't be reached: try again, not a linking screen")
        server.functionDown = false
        await second.restart()
        #expect(second.phase == .ready)
    }

    @Test func theKeyChangingWhileADeviceWaitsStartsItAgain() async throws {
        let (first, _, _) = try accountFromBefore()
        await attach(first)
        let (second, _) = device()
        await attach(second)
        #expect(second.phase == .waiting)
        // Start fresh on the first device: the second makes nothing, it reads the account again.
        _ = try await server.startFresh(keyID: try #require(server.row?.key_id))
        #expect(await second.pollCopy())
        #expect(second.phase == .ready && server.row != nil, "the account had no key any more, so this device made it")
    }

    // MARK: What follows from a copy

    @Test func withACopySigningOutAndRemovingNotesIsAlwaysOffered() {
        typealias S = SignOutRemoval
        #expect(S.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: []) == .needsRecoveryKey)
        #expect(S.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [], serverCopy: true) == .offered(keyStays: false))
        #expect(S.offer(keyOpen: true, inICloudKeychain: true, recoverySaved: false, others: [], serverCopy: true) == .offered(keyStays: true))
        #expect(S.offer(keyOpen: false, inICloudKeychain: false, recoverySaved: false, others: [], serverCopy: true) == .unavailable)
        #expect(KeyDeviceList.safety(thisBackedUp: false, others: [], recoverySaved: false) == .onlyThisDevice)
        #expect(KeyDeviceList.safety(thisBackedUp: false, others: [], recoverySaved: false, serverCopy: true) == .safe(ways: 1))
    }

    @Test func aDeviceThatGotTheKeyBySigningInSaysSo() {
        #expect(KeyHow(rawValue: "signin") == .signIn)
        #expect(AccountCrypto.readyHow(.signIn, startingFresh: false) == .signIn)
        let d = KeyDevice(id: UUID(), name: "Mac", platform: "macos", how: .signIn, backedUp: false, addedAt: .now, removing: false)
        #expect(d.detail().hasPrefix("Signed in on "))
    }

    @Test func theNoticeIsNewsOnEveryDeviceButTheOneThatJustSignedIn() {
        let ledger = NoticeLedger(account: user, defaults: defaults)
        let now = Date.now
        let notice = AccountNotice(id: 7, kind: .keyFetched, created_at: now.addingTimeInterval(-5))
        #expect(notice.text().title == "A new device opened your notes" && notice.text().message.contains("reset your password"))
        #expect(ledger.unseen([notice], now: now).map(\.id) == [7], "another device says it")
        #expect(ledger.unseen([notice], now: now, fetchedHere: now.addingTimeInterval(-6)).isEmpty, "the device that just got the key doesn't")
        #expect(ledger.unseen([notice], now: now).isEmpty, "and never does later")
        let decoded = try? JSONDecoder().decode(AccountNotice.self, from: Data(#"{"id":1,"kind":"key_fetched","created_at":0}"#.utf8))
        #expect(decoded?.kind == .keyFetched)
    }

    @Test func theFunctionsRefusalsAsTheAppKnowsThem() {
        func refusal(_ status: Int, _ json: String) -> KeyCopyError { SupabaseKeyCopy.refusal(status: status, body: Data(json.utf8)) }
        #expect(refusal(503, #"{"hint":"off"}"#) == .off)
        #expect(refusal(409, #"{"hint":"strict"}"#) == .strict)
        #expect(refusal(409, #"{"hint":"not_chosen"}"#) == .notChosen)
        #expect(refusal(404, #"{"hint":"no_copy"}"#) == .noCopy)
        #expect(refusal(404, #"{"hint":"no_key"}"#) == .noCopy)
        #expect(refusal(429, #"{"hint":"rate"}"#) == .tooMany)
        #expect(refusal(400, #"{"hint":"wrong_key"}"#) == .wrongKey)
        #expect(refusal(403, #"{"hint":"paused_after_reset","until":"2026-10-14T09:30:00.000Z"}"#) == .paused(until: Date(timeIntervalSince1970: 1_791_970_200)))
        #expect(refusal(403, #"{"hint":"paused_after_reset"}"#) == .paused(until: nil))
        #expect(refusal(401, "not json") == .signIn)
        #expect(refusal(404, "not found") == .off, "a server from before the function: as if it were off")
        #expect(refusal(503, #"{"hint":"unreadable"}"#) == .noCopy, "the other ways to the notes are offered")
        // A passing fault is never taken for "the server keeps no copies", which is remembered for hours.
        #expect(refusal(500, #"{"hint":"error"}"#) == .offline)
        #expect(refusal(502, "bad gateway") == .offline)
        #expect(refusal(503, "") == .offline)
        #expect(SupabaseKeyCopy.refusal(URLError(.timedOut)) == .offline)
    }

    // MARK: The words

    @Test func theSwitchIsAdvancedProtectionAndSaysWhatItCosts() {
        typealias W = KeyCopyWords
        #expect(W.strictTitle == "Advanced protection")
        #expect(W.strictSubtitle == "Only your devices hold your key. We can\u{2019}t open your notes, and can\u{2019}t help you back in.")
        // Off, the default: said candidly, who else could open the notes.
        for part in ["encrypted on your devices before they sync", "locked copy of your key", "we could open your notes if we had to", "court order", "someone who gets into your account"] {
            #expect(W.strictFooterOff.contains(part), "\(part)")
        }
        #expect(!W.strictFooterOff.contains("end-to-end"))
        #expect(W.strictFooterOn.contains("end-to-end encrypted") && W.strictFooterOn.contains("can\u{2019}t help you back in"))
        #expect(W.askTitle == "Signing in now opens your notes" && W.askContinue == "Continue" && W.askStrict == "Keep My Key on My Devices Only")
        #expect(W.askMessage.contains("court order") && W.askMessage.contains("someone who gets into your account"))
        // After a password reset the switch waits, and says until when.
        let until = Date(timeIntervalSince1970: 1_791_970_200)
        #expect(W.error(.strictPaused(until: until)).contains("Advanced protection can be turned on on ") && W.error(.strictPaused(until: nil)).contains("in 3 days"))
        #expect(W.error(.needsRecoveryKey) == W.needsRecoveryKey)
        // Nothing a person reads has a dash that isn't a hyphen.
        let all = [W.strictTitle, W.strictSubtitle, W.strictFooterOff, W.strictFooterOn, W.turnOnTitle, W.turnOnMessage, W.turnOn, W.turnOffTitle, W.turnOffMessage, W.turnOff,
                   W.needsRecoveryKey, W.saveFirstTitle, W.saveFirstMessage, W.saveFirst, W.copyDetail, W.safeBySignIn, W.askTitle, W.askMessage, W.askStrict, W.heldTitle,
                   W.heldMessage(until: until), W.waitForOther, W.strictPaused(until: until), AccountNotice(id: 1, kind: .keyFetched, created_at: until).text().message]
        for text in all { #expect(!text.contains("\u{2013}") && !text.contains("\u{2014}"), "\(text)") }
        #expect(AccountNotice(id: 1, kind: .keyFetched, created_at: until).text().message.contains("turn on Advanced protection in Settings"))
    }
}

private final class VectorsToken {}
