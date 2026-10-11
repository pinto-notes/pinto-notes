import AuthenticationServices
import CryptoKit
import Foundation
import Supabase
import Testing
@testable import Pane

@Suite struct GoogleSignInTests {
    @Test func googleAlwaysShowsItsChooserAndPutsTheHintFirst() {
        let plain = Backend.googleQuery(hint: nil)
        #expect(plain.map(\.name) == ["prompt"])
        #expect(plain.first?.value == "select_account")
        #expect(Backend.googleQuery(hint: "  ").map(\.name) == ["prompt"])
        let hinted = Backend.googleQuery(hint: " sara@example.com ")
        #expect(hinted.map(\.name) == ["prompt", "login_hint"])
        #expect(hinted.last?.value == "sara@example.com")
    }

    @Test func itComesBackToTheAppsOwnScheme() {
        #expect(Backend.webCallback.absoluteString == "ambernotes://auth-callback")
    }

    // MARK: The host the sign-in opens at (PANE_AUTH_HOST)

    static let backend = URL(string: "https://abcdefghijklmnopqrst.supabase.co")!
    static let pair = "abcdefghijklmnopqrst.supabase.co=auth.example.com"

    /// The address the Supabase client itself builds for a web sign-in, with its PKCE challenge.
    static func authorizeURL(_ base: URL, provider: Provider = .google) throws -> URL {
        let client = SupabaseClient(supabaseURL: base, supabaseKey: "key",
                                    options: SupabaseClientOptions(auth: .init(storage: MemoryStorage(), autoRefreshToken: false)))
        return try client.auth.getOAuthSignInURL(provider: provider, redirectTo: Backend.webCallback, queryParams: Backend.googleQuery(hint: "sara+notes@example.com"))
    }

    final class MemoryStorage: AuthLocalStorage, @unchecked Sendable {
        private let lock = NSLock()
        private var items: [String: Data] = [:]
        func store(key: String, value: Data) { lock.withLock { items[key] = value } }
        func retrieve(key: String) -> Data? { lock.withLock { items[key] } }
        func remove(key: String) { lock.withLock { items[key] = nil } }
        var keys: [String] { lock.withLock { items.keys.sorted() } }
    }

    @Test func aBuildWithoutASignInHostOpensTheBackendsOwn() throws {
        for unset in [nil, "", "  ", "$(PANE_AUTH_HOST)"] as [String?] {
            #expect(BackendConfig.signInHost(configured: unset, backend: Self.backend) == nil)
        }
        let url = try Self.authorizeURL(Self.backend)
        #expect(BackendConfig.signInURL(url, backend: Self.backend, host: nil) == url)
        #expect(url.host() == "abcdefghijklmnopqrst.supabase.co")
    }

    @Test func theSignInHostBelongsToTheBackendItNames() {
        #expect(BackendConfig.signInHost(configured: Self.pair, backend: Self.backend) == "auth.example.com")
        #expect(BackendConfig.signInHost(configured: " ABCDEFGHIJKLMNOPQRST.supabase.co = Auth.Example.com ", backend: Self.backend) == "auth.example.com")
        // The same setting in a build pointed at another backend: staging, the local stack, a fork's project.
        for other in ["https://zyxwvutsrqponmlkjihg.supabase.co", "http://127.0.0.1:56421", "http://abcdefghijklmnopqrst.supabase.co"] {
            #expect(BackendConfig.signInHost(configured: Self.pair, backend: URL(string: other)) == nil)
        }
        #expect(BackendConfig.signInHost(configured: Self.pair, backend: nil) == nil)
    }

    @Test func aSignInHostThatIsNotAPlainHostNameIsIgnored() {
        for bad in ["auth.example.com", "abcdefghijklmnopqrst.supabase.co=", "abcdefghijklmnopqrst.supabase.co=https://auth.example.com",
                    "abcdefghijklmnopqrst.supabase.co=auth.example.com/path", "abcdefghijklmnopqrst.supabase.co=auth.example.com:8443",
                    "abcdefghijklmnopqrst.supabase.co=localhost", "abcdefghijklmnopqrst.supabase.co=auth..example.com",
                    "abcdefghijklmnopqrst.supabase.co=-auth.example.com", "abcdefghijklmnopqrst.supabase.co=user@auth.example.com",
                    "abcdefghijklmnopqrst.supabase.co=auth.example.com=evil.example", "abcdefghijklmnopqrst.supabase.co=auth.example.com?x"] {
            #expect(BackendConfig.signInHost(configured: bad, backend: Self.backend) == nil, "\(bad)")
        }
    }

    /// Only the host moves: the path, the PKCE challenge, the return address and Google's
    /// parameters reach the server exactly as the client wrote them.
    @Test func theSignInOpensAtTheConfiguredHostAndNothingElseChanges() throws {
        for provider in [Provider.google, .apple] {
            let url = try Self.authorizeURL(Self.backend, provider: provider)
            let host = BackendConfig.signInHost(configured: Self.pair, backend: Self.backend)
            let shown = BackendConfig.signInURL(url, backend: Self.backend, host: host)
            #expect(shown.host() == "auth.example.com")
            #expect(shown.scheme == "https")
            #expect(shown.port == nil)
            #expect(shown.path() == "/auth/v1/authorize")
            let before = try #require(URLComponents(url: url, resolvingAgainstBaseURL: false))
            let after = try #require(URLComponents(url: shown, resolvingAgainstBaseURL: false))
            #expect(after.percentEncodedQuery == before.percentEncodedQuery)
            #expect(after.percentEncodedPath == before.percentEncodedPath)
            let query = Dictionary(uniqueKeysWithValues: (after.queryItems ?? []).map { ($0.name, $0.value ?? "") })
            #expect(query["provider"] == provider.rawValue)
            #expect(query["redirect_to"] == "ambernotes://auth-callback")
            #expect(query["code_challenge_method"] == "s256")
            #expect(query["code_challenge"]?.isEmpty == false)
            #expect(query["login_hint"] == "sara+notes@example.com")
            #expect(shown.absoluteString == url.absoluteString.replacingOccurrences(of: "abcdefghijklmnopqrst.supabase.co", with: "auth.example.com"))
        }
    }

    /// An address that isn't the backend's own is left alone: the provider's page a link request
    /// answers with, another server, a plain http address.
    @Test func onlyTheBackendsOwnAddressMoves() {
        for other in ["https://appleid.apple.com/auth/authorize?client_id=x", "https://accounts.google.com/o/oauth2/v2/auth",
                      "https://abcdefghijklmnopqrst.supabase.co.evil.example/auth/v1/authorize",
                      "http://abcdefghijklmnopqrst.supabase.co/auth/v1/authorize", "https://abcdefghijklmnopqrst.supabase.co:8443/auth/v1/authorize"] {
            let url = URL(string: other)!
            #expect(BackendConfig.signInURL(url, backend: Self.backend, host: "auth.example.com") == url)
        }
    }

    /// The update must not sign anyone out, and the one-time code must be swapped with the
    /// verifier made for it: the client keeps its backend, so the session and the PKCE verifier
    /// stay under the names they had (both come from the backend's host), and the swap goes to
    /// the backend's host, not the one the browser sheet opened.
    @MainActor @Test func theStoredSessionAndTheCodeSwapStayOnTheBackendsHost() async throws {
        let storage = MemoryStorage()
        let asked = Asked()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [AskedProtocol.self]
        AskedProtocol.asked = asked
        let client = SupabaseClient(supabaseURL: Self.backend, supabaseKey: "key", options: SupabaseClientOptions(
            auth: .init(storage: storage, autoRefreshToken: false), global: .init(session: URLSession(configuration: config))))
        #expect(Backend.sessionKey(Self.backend) == "sb-abcdefghijklmnopqrst-auth-token")
        _ = try? await client.auth.signInWithOAuth(provider: .google, redirectTo: Backend.webCallback) { url in
            asked.opened = BackendConfig.signInURL(url, backend: Self.backend, host: "auth.example.com")
            return URL(string: "ambernotes://auth-callback?code=one-time-code")!
        }
        let opened = try #require(asked.opened)
        #expect(opened.host() == "auth.example.com")
        let swap = try #require(asked.requests.first { $0.url?.path() == "/auth/v1/token" })
        #expect(swap.url?.host() == "abcdefghijklmnopqrst.supabase.co")
        #expect(swap.url?.query() == "grant_type=pkce")
        let body = try #require(asked.bodies.first.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: String] })
        #expect(body["auth_code"] == "one-time-code")
        let verifier = try #require(body["code_verifier"])
        let challenge = URLComponents(url: opened, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "code_challenge" }?.value
        #expect(challenge == Self.s256(verifier))
        #expect(asked.requests.allSatisfy { $0.url?.host() == "abcdefghijklmnopqrst.supabase.co" })
        // The refused swap leaves the verifier where the client put it: under the backend's name.
        #expect(storage.keys == ["sb-abcdefghijklmnopqrst-auth-token-code-verifier"])
    }

    static func s256(_ verifier: String) -> String {
        Data(SHA256.hash(data: Data(verifier.utf8))).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }

    final class Asked: @unchecked Sendable {
        private let lock = NSLock()
        private var _requests: [URLRequest] = [], _bodies: [Data] = []
        private var _opened: URL?
        var opened: URL? {
            get { lock.withLock { _opened } }
            set { lock.withLock { _opened = newValue } }
        }
        func add(_ request: URLRequest, body: Data?) { lock.withLock { _requests.append(request); if let body { _bodies.append(body) } } }
        var requests: [URLRequest] { lock.withLock { _requests } }
        var bodies: [Data] { lock.withLock { _bodies } }
    }

    /// Answers every request with a refusal, after noting where it went and what it carried.
    final class AskedProtocol: URLProtocol, @unchecked Sendable {
        nonisolated(unsafe) static var asked: Asked?
        override class func canInit(with request: URLRequest) -> Bool { true }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func startLoading() {
            var body = request.httpBody
            if body == nil, let stream = request.httpBodyStream {
                stream.open(); defer { stream.close() }
                var data = Data(), buffer = [UInt8](repeating: 0, count: 4096)
                while stream.hasBytesAvailable { let n = stream.read(&buffer, maxLength: buffer.count); if n <= 0 { break }; data.append(buffer, count: n) }
                body = data
            }
            Self.asked?.add(request, body: body)
            let response = HTTPURLResponse(url: request.url!, statusCode: 400, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(#"{"code":400,"error_code":"flow_state_not_found","msg":"refused"}"#.utf8))
            client?.urlProtocolDidFinishLoading(self)
        }
        override func stopLoading() {}
    }

    @Test func closingTheSheetIsQuiet() {
        #expect(Backend.isCanceled(ASWebAuthenticationSessionError(.canceledLogin)))
        #expect(!Backend.isCanceled(ASWebAuthenticationSessionError(.presentationContextInvalid)))
        #expect(!Backend.isCanceled(URLError(.timedOut)))
    }

    @Test func failuresGetWordsAPersonCanActOn() {
        struct E: LocalizedError { let errorDescription: String? }
        #expect(Backend.googleMessage(for: URLError(.notConnectedToInternet)).contains("connection"))
        #expect(Backend.googleMessage(for: E(errorDescription: "Unsupported provider: provider is not enabled")) == "Sign in with Google isn't available yet.")
        #expect(Backend.googleMessage(for: E(errorDescription: "Signups not allowed for this instance")).contains("Couldn't make an account"))
        #expect(Backend.googleMessage(for: E(errorDescription: "Unverified email with google")).contains("hasn't confirmed"))
        // Anything else: a plain retry line, never the server's raw words.
        #expect(Backend.googleMessage(for: E(errorDescription: "server_error: Database error")) == "Sign in with Google didn't finish. Try again.")
    }

    /// Google's chooser can pick another Google account, which is another Amber Notes account:
    /// Start fresh must never run there.
    @Test func startFreshRunsOnlyOnTheAccountThatAskedForIt() {
        let a = UUID(), b = UUID()
        #expect(KeyGateView.sameAccount(before: a, after: a))
        #expect(!KeyGateView.sameAccount(before: a, after: b))
        #expect(!KeyGateView.sameAccount(before: nil, after: a))
        #expect(!KeyGateView.sameAccount(before: a, after: nil))
    }

    /// developers.google.com/identity/branding-guidelines: the light and dark buttons' colours.
    @Test func theButtonUsesGooglesColours() {
        #expect(GoogleAuthButton.colors(.light) == .init(fill: 0xFFFFFF, stroke: 0x747775, label: 0x1F1F1F))
        #expect(GoogleAuthButton.colors(.dark) == .init(fill: 0x131314, stroke: 0x8E918F, label: 0xE3E3E3))
    }

    @Test func theLogoKeepsGooglesProportionAtTheFormsRowHeights() {
        // Google's 18 pt logo on its 40 pt button; the iPhone row is 48, the Mac row 36.
        #expect(GoogleAuthButton.logoSize(height: 48) == 20)
        #expect(GoogleAuthButton.logoSize(height: 40) == 17)
        #expect(GoogleAuthButton.logoSize(height: 36) == 16)
        #expect(GoogleAuthButton.logoSize(height: 30) == 16)
    }

    @Test func theSignInScreenOffersGoogleAndSaysSoPlainly() {
        #expect(SignInView.offersGoogle)
        #expect(SignInView.noPasswordNote.contains("Apple or Google"))
        #expect(!SignInView.noPasswordNote.contains("\u{2014}"))
    }

    /// The Google button folds away with Apple's for the password, and comes back with it.
    @Test func googleFoldsAwayWithApple() {
        var flow = EmailSignInFlow()
        #expect(flow.showsApple)
        flow.email = "sara@example.com"
        var began = flow.beginCheck()
        #expect(began)
        flow.finishCheck(.password)
        #expect(!flow.showsApple)
        flow.back()
        #expect(flow.showsApple)
        flow.email = "sara@example.com"
        began = flow.beginCheck()
        #expect(began)
        flow.finishCheck(.appleOnly)
        #expect(flow.showsApple, "an account without a password keeps both buttons in view")
    }
}

/// Closing Google's sheet without signing in: AuthenticationServices answers from a background
/// XPC queue, and the app must not assume it's on the main thread (it quit with SIGTRAP).
@Suite struct WebAuthSessionCompletionTests {
    @Test func closingTheSheetOffTheMainThreadThrowsCanceled() async {
        await #expect(throws: ASWebAuthenticationSessionError.self) {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
                let finish = WebAuthSession.finish(continuation)
                DispatchQueue.global().async { finish(nil, ASWebAuthenticationSessionError(.canceledLogin)) }
            }
        }
    }

    @Test func noURLAndNoErrorCountsAsCanceled() async {
        do {
            _ = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
                let finish = WebAuthSession.finish(continuation)
                DispatchQueue.global().async { finish(nil, nil) }
            }
            Issue.record("expected the sign-in to be canceled")
        } catch {
            #expect(Backend.isCanceled(error))
        }
    }

    @Test func theCallbackURLComesBackFromAnyQueue() async throws {
        let url = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            let finish = WebAuthSession.finish(continuation)
            DispatchQueue.global().async { finish(Backend.webCallback, nil) }
        }
        #expect(url == Backend.webCallback)
    }
}
