import Foundation
import SwiftData
import Supabase
import Testing
@testable import Pane

/// A deleted account is said as that, not as "Can't reach Pinto Notes" (2026-10-12: the owner's
/// account was deleted on the server while the app was signed in; the next launch asked him to
/// connect to the internet). Only the auth server's own "this user doesn't exist" decides it.
@MainActor @Suite(.serialized) struct AccountGoneTests {
    static func authError(code: String, message: String, status: Int) -> AuthError {
        let response = HTTPURLResponse(url: URL(string: "https://example.test/auth/v1/user")!, statusCode: status, httpVersion: nil, headerFields: nil)!
        return .api(message: message, errorCode: ErrorCode(rawValue: code), underlyingData: Data(), underlyingResponse: response)
    }

    @Test func onlyTheAuthServersUserNotFoundMeansDeleted() {
        #expect(Backend.accountGone(Self.authError(code: "user_not_found", message: "User from sub claim in JWT does not exist", status: 403)))
        #expect(Backend.accountGone(Self.authError(code: "unexpected_failure", message: "User from sub claim in JWT does not exist", status: 403)),
                "an older server that only says it in words")
        // Not deleted: a signed-out session, an expired or bad token, an outage, a server error.
        #expect(!Backend.accountGone(Self.authError(code: "session_not_found", message: "Session from session_id claim in JWT does not exist", status: 403)))
        #expect(!Backend.accountGone(Self.authError(code: "refresh_token_not_found", message: "Invalid Refresh Token: Refresh Token Not Found", status: 400)))
        #expect(!Backend.accountGone(Self.authError(code: "bad_jwt", message: "invalid JWT", status: 401)))
        #expect(!Backend.accountGone(Self.authError(code: "unexpected_failure", message: "Internal error", status: 500)))
        #expect(!Backend.accountGone(URLError(.notConnectedToInternet)))
        #expect(!Backend.accountGone(URLError(.timedOut)))
    }

    typealias T = KeyStartupTests

    /// A device without the key, starting up while the key server doesn't answer.
    func startUp(accountExists: Bool?) async -> AccountCrypto {
        let server = T.FakeServer()
        server.row = try? StoredKey.generate().serverRow(user: user)
        server.offline = true
        let crypto = AccountCrypto(store: T.FakeKeychain(cloud: T.Cloud(), autoReceive: false), defaults: UserDefaults(suiteName: "account-gone-\(UUID())")!,
                                   sleep: { _ in throw CancellationError() })
        crypto.accountExists = { accountExists }
        await crypto.attach(account: user, server: server)
        return crypto
    }

    let user = UUID()

    @Test func aDeletedAccountSaysSoAndAnOutageStillSaysCantReach() async {
        let gone = await startUp(accountExists: false)
        #expect(gone.phase == .accountGone)
        #expect(KeyGateView.shown(gone.phase, .auto) == .accountGone)
        gone.signedOut()
        // Offline, or an auth server that can't say: Can't reach, as before.
        for unknown in [nil, true] as [Bool?] {
            let offline = await startUp(accountExists: unknown)
            #expect(offline.phase == .unreachable)
            #expect(KeyGateView.shown(offline.phase, .auto) == .unreachable)
            offline.signedOut()
        }
    }

    @Test func aDeletedAccountClosesNotesThatWereOpen() async throws {
        // The key is here and opened at once, the server confirms it, then the account is deleted.
        let server = T.FakeServer()
        let k = StoredKey.generate()
        server.row = try k.serverRow(user: user)
        let keychain = T.FakeKeychain(cloud: T.Cloud(), autoReceive: false)
        keychain.synced[user] = k
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "account-gone-\(UUID())")!, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: user, server: server)
        #expect(crypto.phase == .ready)
        server.offline = true
        crypto.accountExists = { nil }
        await crypto.recheck()
        #expect(crypto.phase == .ready, "an outage leaves the notes open")
        crypto.accountExists = { false }
        await crypto.recheck()
        #expect(crypto.phase == .accountGone)
        crypto.signedOut()
    }

    @Test func signingInAfterwardsRemovesThisDevicesCopyWithoutAskingTheServer() async throws {
        let rig = try SignOutRemovalTests.Rig(user: user, syncs: false, list: KeyDevicesTests.FakeList())
        rig.note("Groceries", synced: false)
        #expect(rig.notes == 1)
        await rig.removal.runAfterAccountGone(account: user)
        #expect(rig.notes == 0 && !rig.hasFiles, "the deleted account's notes and files are gone from this device")
        #expect(!rig.steps.contains("push") && !rig.steps.contains("withdraw"), "nothing is sent: the account isn't there")
        #expect(rig.steps.contains("dropKey") && rig.steps.contains("signOut"))
        #expect(!rig.pending, "finished, so a relaunch doesn't erase again")
    }
}
