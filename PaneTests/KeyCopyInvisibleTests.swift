import Foundation
import Supabase
import Testing
@testable import Pane

/// This build against a server as production is before the key copy goes live: `account_key_state`
/// as it was (no `protection`, `copy` or `protection_paused_until`), no `key` function (the gateway
/// answers 404) and no `keep_key_on_devices`. Through the app's own Supabase code, nothing of the
/// key copy shows or happens: no switch, no question, no "sign in again", the linking screen as
/// before, Sign Out and Remove Notes as before, and nothing but one look at the function.
@MainActor @Suite(.serialized) struct KeyCopyInvisibleTests {
    /// The server, answering as production does today.
    final class Production: URLProtocol, @unchecked Sendable {
        nonisolated(unsafe) static var keyRow: [String: Any]?
        nonisolated(unsafe) static var requests: [String] = []
        private static let lock = NSLock()

        override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "production.stub.test" }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

        override func startLoading() {
            let url = request.url!
            let path = url.path
            Self.lock.withLock { Self.requests.append("\(request.httpMethod ?? "GET") \(path)") }
            let (status, body): (Int, Any) = switch path {
            case "/rest/v1/rpc/account_key_state":
                (200, ["key": Self.keyRow ?? NSNull(), "generation": 0] as [String: Any])
            case "/functions/v1/key":
                (404, ["code": "NOT_FOUND", "message": "Requested function was not found"])
            case "/rest/v1/rpc/keep_key_on_devices":
                (404, ["code": "PGRST202", "message": "Could not find the function public.keep_key_on_devices(p_device) in the schema cache", "hint": NSNull(), "details": NSNull()])
            default:
                (404, ["message": "not stubbed"])
            }
            let data = try! JSONSerialization.data(withJSONObject: body)
            client?.urlProtocol(self, didReceive: HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        }

        override func stopLoading() {}

        static func client() -> SupabaseClient {
            let config = URLSessionConfiguration.ephemeral
            config.protocolClasses = [Production.self]
            return SupabaseClient(supabaseURL: URL(string: "https://production.stub.test")!, supabaseKey: "anon", options: SupabaseClientOptions(
                auth: .init(storage: AddDeviceLiveTests.MemoryStorage(), autoRefreshToken: false),
                global: .init(session: URLSession(configuration: config))))
        }
    }

    typealias Keychain = KeyStartupTests.FakeKeychain
    let user = UUID()

    func device(_ keychain: Keychain, defaults: UserDefaults = UserDefaults(suiteName: "invisible-\(UUID())")!) async -> AccountCrypto {
        let client = Production.client()
        let crypto = AccountCrypto(store: keychain, defaults: defaults, sleep: { _ in throw CancellationError() })
        await crypto.attach(account: user, server: SupabaseAccountKeys(client: client), copies: SupabaseKeyCopy(client: client))
        return crypto
    }

    /// Nothing of the key copy on this device.
    func expectNothingShown(_ c: AccountCrypto, sourceLocation: SourceLocation = #_sourceLocation) {
        #expect(c.protection == nil && !c.copiesOn, "no Advanced protection section in Settings", sourceLocation: sourceLocation)
        #expect(!c.asksProtection, "no question for an account from before", sourceLocation: sourceLocation)
        #expect(!c.needsSignIn && c.asksBeforeFetch == nil && !c.held, "no sign in again, no question before a fetch, no hold", sourceLocation: sourceLocation)
        #expect(!c.serverCopy && !c.copiesOffered && c.strictPausedUntil == nil, sourceLocation: sourceLocation)
    }

    @Test func aDeviceWithTheKeySeesAndDoesNothingNew() async throws {
        let k = StoredKey.generate()
        Production.keyRow = try JSONSerialization.jsonObject(with: JSONEncoder().encode(k.serverRow(user: user))) as? [String: Any]
        Production.requests = []
        let keychain = Keychain(cloud: KeyStartupTests.Cloud())
        keychain.synced[user] = k
        let defaults = UserDefaults(suiteName: "invisible-\(UUID())")!
        let a = await device(keychain, defaults: defaults)
        #expect(a.phase == .ready && !a.unverified)
        expectNothingShown(a)
        #expect(KeyCopy.welcomeMessage(recoverable: a.serverCopy) == "Only your devices, and AI connections you approve, can unlock your notes.")
        #expect(PrivacyCopy.summary(serverCopy: a.serverCopy) == PrivacyCopy.summary && PrivacyCopy.keyFooter(serverCopy: a.serverCopy) == PrivacyCopy.keyFooter)
        // It looked once at the function, was told it isn't there, and stored nothing.
        #expect(Production.requests.filter { $0.contains("/functions/v1/key") } == ["GET /functions/v1/key"])
        // Opened again in a while (Settings, a sync, the foreground): it doesn't ask the function again.
        await a.recheck()
        await a.recheck()
        expectNothingShown(a)
        #expect(Production.requests.filter { $0.contains("/functions/v1/key") }.count == 1, "off is remembered for hours")
        #expect(!Production.requests.contains { $0.hasPrefix("POST /functions") || $0.contains("keep_key_on_devices") })

        // Sign Out and Remove Notes, as in 1.2.5: offered on the same evidence, and the new re-read
        // of the key state goes through on today's server and changes nothing.
        let others = [KeyDevice(id: UUID(), name: "Mac", platform: "macos", how: .made, backedUp: false, addedAt: .now, removing: false)]
        let offerFor = { SignOutRemoval.offer(keyOpen: a.isReady, inICloudKeychain: false, recoverySaved: false, others: others, serverCopy: a.serverCopy) }
        #expect(offerFor() == SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: others))
        #expect(SignOutRemoval.offer(keyOpen: true, inICloudKeychain: false, recoverySaved: false, others: [], serverCopy: a.serverCopy) == .needsRecoveryKey, "as in 1.2.5: refused with one device and no recovery key")
        @MainActor final class Steps { var done: [String] = [] }
        let steps = Steps()
        let removal = SignOutRemoval(
            defaults: defaults, gate: SignOutRemoval.Gate(), offer: offerFor,
            push: { true }, hasUnsynced: { false }, withdraw: { steps.done.append("withdraw") },
            refreshCopy: { try await a.refreshCopyState(); steps.done.append("reread") }, stopSync: {}, restore: { steps.done.append("restore") },
            dropKey: { _ in steps.done.append("drop") }, erase: { steps.done.append("erase") }, forget: { _ in }, signOut: { steps.done.append("signOut") })
        try await removal.run(account: user)
        #expect(steps.done == ["withdraw", "reread", "drop", "erase", "signOut", "erase"], "removed, as before")
        expectNothingShown(a)
    }

    @Test func aDeviceWithoutTheKeySeesTheLinkingScreenAsBefore() async throws {
        let k = StoredKey.generate()
        Production.keyRow = try JSONSerialization.jsonObject(with: JSONEncoder().encode(k.serverRow(user: user))) as? [String: Any]
        Production.requests = []
        let b = await device(Keychain(cloud: KeyStartupTests.Cloud()))
        #expect(b.phase == .waiting)
        expectNothingShown(b)
        #expect(KeyGateView.shown(b.phase, .auto, held: b.held, before: b.needsSignIn || b.asksBeforeFetch != nil) == .addDevice)
        #expect(KeyCopyWords.gateWhy(b.protection) == AddDeviceCopy.gateWhy && KeyCopyWords.noDeviceMessage(b.protection) == AddDeviceCopy.noDeviceMessage)
        // Waiting, it looks at the server now and then: nothing is fetched from a function that isn't there.
        #expect(await b.pollCopy() == false)
        #expect(!Production.requests.contains { $0.hasPrefix("POST /functions") })
        expectNothingShown(b)
    }

    @Test func aNewAccountMakesItsKeyAndStoresNothing() async throws {
        Production.keyRow = nil
        Production.requests = []
        let c = await device(Keychain(cloud: KeyStartupTests.Cloud()))
        // The stub doesn't keep the row create_account_key sends; what matters is that no copy is stored.
        #expect(!Production.requests.contains { $0.hasPrefix("POST /functions") })
        expectNothingShown(c)
    }
}
