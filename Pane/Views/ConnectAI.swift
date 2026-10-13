import LocalAuthentication
import Observation
import Supabase
import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

// Connecting an AI to Amber Notes.
//
// ChatGPT and Claude sign in with OAuth: they send the person's browser to the MCP server's
// /authorize, which opens ambernotes.app/connect?request=<id>. That page hands over to the app,
// by https://ambernotes.app/open/connect?request=<id> or ambernotes://connect?request=<id>. The
// app (already signed in) shows who's asking, the person allows read-only or read and edit with
// Face ID or Touch ID, and the app sends the browser on to the AI with the result.
//
// The notes are end-to-end encrypted, so approving hands the AI a copy of the account's key: the
// app makes the authorization code itself and sends the server only its hash and the key wrapped
// under it. The server's answer is the AI's return address without a code; the app adds it.
// Claude Code and Codex get a pane_ token made here the same way, used only in a request header.

// MARK: Pure pieces (tested)

enum ConnectLink {
    static let scheme = AppIdentity.scheme
    /// The site's universal link for the same thing: https://ambernotes.app/open/connect?request=<uuid>.
    static let webHosts = AppIdentity.webHosts
    static let webPath = "/open/connect"

    /// The request id in ambernotes://connect?request=<uuid> or its universal link, if this is one.
    static func requestID(from url: URL) -> UUID? {
        let scheme = url.scheme?.lowercased(), host = url.host?.lowercased() ?? ""
        let custom = scheme == Self.scheme && host == "connect"
        let web = scheme == "https" && webHosts.contains(host) && url.path == webPath
        guard custom || web, let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let raw = comps.queryItems?.first(where: { $0.name == "request" })?.value else { return nil }
        return UUID(uuidString: raw)
    }
}

enum ConnectTrust {
    /// Where known AI apps receive their sign-in, host only: enough for a connection that already
    /// exists (the server kept where it was sent), never for a mark on the consent sheet.
    static let knownHosts: [String: String] = [
        "chatgpt.com": "ChatGPT",
        "chat.openai.com": "ChatGPT",
        "claude.ai": "Claude",
        "claude.com": "Claude",
    ]

    /// The exact addresses where ChatGPT and Claude receive their sign-in, as on the server
    /// (oauth.ts KNOWN_CALLBACKS) and the web consent page. Only a request that returns to one of
    /// these may show that AI's name and mark.
    static let knownCallbacks: [String: String] = [
        "https://chatgpt.com/connector_platform_oauth_redirect": "ChatGPT",
        "https://platform.openai.com/apps-manage/oauth": "ChatGPT",
        "https://claude.ai/api/mcp/auth_callback": "Claude",
        "https://claude.com/api/mcp/auth_callback": "Claude",
    ]

    /// Who will receive access, in words for the consent sheet.
    static func destination(host: String, loopback: Bool) -> String {
        if loopback { return "an app on this computer" }
        return host
    }

    /// The AI whose name and mark the consent sheet may show: decided only by the exact address the
    /// approval is sent to, never by the name a client registered. Anyone can call themselves
    /// "ChatGPT"; only ChatGPT receives answers at its callback. A server too old to send the
    /// address verifies nothing.
    static func verifiedAI(redirectURI: String?) -> String? {
        guard let redirectURI else { return nil }
        if let ai = knownCallbacks[redirectURI] { return ai }
        return redirectURI.wholeMatch(of: chatGPTConnectorCallback) != nil ? "ChatGPT" : nil
    }

    /// ChatGPT's per-connector callback, used when a server doesn't send `iss` (as on the server).
    nonisolated(unsafe) static let chatGPTConnectorCallback = /https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]{1,128}/

    /// The AI behind an existing connection, by the exact host its approval went to.
    static func verifiedAI(host: String, loopback: Bool) -> String? {
        loopback ? nil : knownHosts[host.lowercased()]
    }
}

enum ConnectSnippets {
    /// What Claude Code and Codex call the server in their own lists. It was amber-notes (and
    /// amber_notes) before the app was renamed; a connection added under the old name keeps working.
    static let serverName = "pinto-notes"
    static let oldServerName = "amber-notes"

    static func claudeCode(url: String, token: String) -> String {
        "claude mcp add --scope user --transport http \(serverName) \(url) --header \"Authorization: Bearer \(token)\""
    }

    static func codex(url: String, token: String) -> String {
        "[mcp_servers.pinto_notes]\nurl = \"\(url)\"\nhttp_headers = { \"Authorization\" = \"Bearer \(token)\" }"
    }
}

/// Knowing when a guided connection worked, wherever the person approved it.
enum ConnectCompletion {
    /// The newest ChatGPT or Claude sign-in made since the guide opened, if any. Named by where
    /// its answers went, never by the name the client registered, like the consent sheet.
    static func newConnection(_ rows: [Connection], ai: String, since: Date) -> Connection? {
        rows.filter { c in
            c.isOAuth && c.revoked_at == nil && c.created_at >= since
                && ConnectTrust.verifiedAI(host: c.redirect_host ?? "", loopback: false) == ai
        }
        .max { $0.created_at < $1.created_at }
    }
}

// MARK: Server calls

struct ConnectRequest: Decodable, Identifiable, Equatable {
    let id: UUID
    let client_name: String
    let redirect_host: String
    /// The exact return address. It decides whether an AI's mark shows, and goes back to the
    /// server unchanged with the answer, so what you approved is where the code goes.
    var redirect_uri: String? = nil
    /// What an unverified app calls itself, made plain ASCII by the server; never a title.
    var claimed_name: String? = nil
    let loopback: Bool
    let wants_write: Bool
    /// Asked from a browser (anywhere) that waits for this account's devices to approve: the code
    /// goes to that page, sealed to its key, and this device opens nothing.
    var asked: Bool? = nil
    var started_at: Date? = nil
    /// What the page says it is, e.g. "Chrome on a Mac".
    var started_from: String? = nil
    /// The client's `state` and the issuer (`iss`) the server adds to the return address: a device
    /// that hands the code to a browser builds that address itself and seals it with the code.
    var state: String? = nil
    var iss: String? = nil
    /// Asked by a page that shows a QR code: the page's public key (base64), which the device that
    /// scanned the code checks against the code (`ConnectScan`).
    var scan: Bool? = nil
    var browser_key: String? = nil

    var isAsked: Bool { asked == true }

    /// The access the sheet starts at: what the app asked for. Someone who just started connecting
    /// expects their AI to work; the warning and the number, not a weaker default, guard an app
    /// Amber Notes can't name.
    var startsWithWrite: Bool { wants_write }

    /// "Requested 2 minutes ago from Chrome on a Mac", for a request asked from a browser.
    func requestedLine(now: Date = .now) -> String? {
        guard isAsked else { return nil }
        let from = started_from.flatMap { $0.isEmpty ? nil : $0 } ?? "a web browser"
        guard let started_at else { return "Requested from \(from)" }
        let when = now.timeIntervalSince(started_at) < 60 ? "just now"
            : started_at.formatted(.relative(presentation: .numeric, unitsStyle: .wide))
        return "Requested \(when) from \(from)"
    }

    /// The AI access goes to, when the return address is its own. For a request asked from a
    /// browser too: what ties that request to the person is the code they scanned on their own
    /// screen (or the number it shows), and the address decides who gets access.
    var verifiedAI: String? { ConnectTrust.verifiedAI(redirectURI: redirect_uri) }
    /// Who's asking, as the sheet names it: the verified AI, or else where access goes.
    var who: String { verifiedAI ?? ConnectTrust.destination(host: redirect_host, loopback: loopback) }
    /// The name an unverified app gave itself, shown only as a secondary claim, and only as the
    /// server's plain-ASCII version of it.
    var claimedName: String? { verifiedAI == nil ? claimed_name.flatMap { $0.isEmpty ? nil : $0 } : nil }

    /// Where the browser that asked goes with the code: the return address with `state` and
    /// `iss`, exactly as the server builds it. Nil when the server didn't say (too old).
    var handoffRedirect: String? {
        guard let redirect_uri, let iss else { return nil }
        return ConnectAPI.clientRedirect(redirect_uri, state: state, iss: iss)
    }
}

/// Number matching for a request asked from a browser, commit then reveal (`E2EE.matchCommit`,
/// `E2EE.matchNumber`). The page committed to its key and a nonce when it asked; this device writes
/// its own nonce (once), the page then reveals its nonce, and this device checks the reveal opens
/// the commit before it shows anything. The page shows two digits made from its key, both nonces
/// and the request; the person types what the page shows. A key swapped on the way (by anyone who
/// can write the ask) was committed before this device's nonce existed, so it can't be ground to
/// give the same digits.
///
/// The key and commit are the ones this device read first (`Snapshot`): its nonce is written
/// against them, and every later read, the answer and the sealed code must carry the same pair.
/// Whoever can write the ask could otherwise swap key, commit and revealed nonce together once
/// this device's nonce is known (grinding a nonce until the digits match), and the ask changing
/// under this device is declined, never shown.
enum ConnectMatch {
    enum Check: Equatable {
        /// This device's nonce isn't on the ask yet, or the page hasn't revealed its nonce.
        case waiting
        /// The ask carries another device's nonce: that device answers it.
        case otherDevice
        /// The page's reveal doesn't open its commit, or the ask is malformed. Never shows a number.
        case broken
        /// The ask's key or commit isn't what this device read first. Never shows a number.
        case changed
        /// The two digits the page shows, if it's the page that committed.
        case number(String)
    }

    /// The page's key and commit as this device first read them.
    struct Snapshot: Equatable, Sendable {
        let key: Data
        let commit: String

        /// Nil when the ask is malformed.
        init?(_ row: ConnectAskMatch) {
            guard let key = row.browserKey, key.count == 65, row.match_commit.count == 64 else { return nil }
            self.key = key
            commit = row.match_commit
        }

        /// The ask still carries this key and this commit.
        func holds(_ row: ConnectAskMatch) -> Bool { row.browserKey == key && row.match_commit == commit }
    }

    /// A number shown: what it was made from. The number and the sealed code use only the
    /// snapshot's key.
    struct Match: Equatable, Sendable {
        let snapshot: Snapshot
        /// The ask as it was when the number was made; the answer requires it unchanged.
        let row: ConnectAskMatch
        let number: String
        var key: Data { snapshot.key }
    }

    /// How following an ask ended.
    enum Outcome: Equatable {
        case number(Match)
        case otherDevice
        case broken
        case changed
        /// The ask is gone (answered or expired).
        case expired
    }

    /// What the ask says now, checked against the nonce this device wrote.
    static func check(_ row: ConnectAskMatch, deviceNonce: Data, requestID: UUID) -> Check {
        guard let snapshot = Snapshot(row) else { return .broken }
        return check(row, against: snapshot, deviceNonce: deviceNonce, requestID: requestID)
    }

    /// What the ask says now, against the key and commit this device read first.
    static func check(_ row: ConnectAskMatch, against snapshot: Snapshot, deviceNonce: Data, requestID: UUID) -> Check {
        guard snapshot.holds(row) else { return .changed }
        guard let written = row.device_nonce else { return .waiting }
        guard written == E2EE.hex(deviceNonce) else { return .otherDevice }
        guard let revealed = row.page_nonce else { return .waiting }
        guard let pageNonce = E2EE.fromHex(revealed), pageNonce.count == 16,
              E2EE.commitOpens(snapshot.commit, browserKey: snapshot.key, pageNonce: pageNonce) else { return .broken }
        return .number(E2EE.matchNumber(browserKey: snapshot.key, pageNonce: pageNonce, deviceNonce: deviceNonce, requestID: requestID))
    }

    /// Reads the ask, writes this device's nonce on it (against the key and commit of that first
    /// read), then reads it about every `poll` until the page reveals its nonce. Ends with the
    /// number only when the reveal opens the first read's commit and key and commit never changed.
    @MainActor
    static func follow(requestID: UUID, read: () async throws -> ConnectAskMatch?, write: (Data) async throws -> Void,
                       poll: Duration) async throws -> Outcome {
        guard var row = try await read() else { return .expired }
        guard let snapshot = Snapshot(row) else { return .broken }
        let nonce = deviceNonce(for: requestID, commit: snapshot.commit)
        if row.device_nonce == nil {
            do { try await write(nonce) } catch {
                // Another device may have written first; the ask says.
                guard let again = try await read() else { return .expired }
                if again.device_nonce == nil, snapshot.holds(again) { throw error }
                row = again
            }
        }
        while true {
            try Task.checkCancellation()
            switch check(row, against: snapshot, deviceNonce: nonce, requestID: requestID) {
            case .number(let n): return .number(Match(snapshot: snapshot, row: row, number: n))
            case .otherDevice: return .otherDevice
            case .broken: return .broken
            case .changed: return .changed
            case .waiting: break
            }
            try await Task.sleep(for: poll)
            guard let next = try await read() else { return .expired }
            row = next
        }
    }

    enum Recheck: Equatable { case same, changed, expired }

    /// The ask read again after its number was shown: it must be exactly what the number was made from.
    static func recheck(_ match: Match, now: ConnectAskMatch?) -> Recheck {
        guard let now else { return .expired }
        return now == match.row && match.snapshot.holds(now) ? .same : .changed
    }

    /// Reads the ask about every `poll` while its number shows; returns once it changed or is gone.
    @MainActor
    static func watch(_ match: Match, read: () async throws -> ConnectAskMatch?, poll: Duration) async throws -> Recheck {
        while true {
            try await Task.sleep(for: poll)
            let r = recheck(match, now: try await read())
            if r != .same { return r }
        }
    }

    /// The nonce this device writes for a request with a given commit: made once, and the same
    /// when the sheet shows it again (the server takes the first one written). Another commit on
    /// the same request never gets the same nonce.
    @MainActor static func deviceNonce(for request: UUID, commit: String) -> Data {
        let key = NonceKey(request: request, commit: commit)
        if let n = nonces[key] { return n }
        let n = E2EE.randomBytes(16)
        nonces[key] = n
        return n
    }

    private struct NonceKey: Hashable { let request: UUID; let commit: String }
    @MainActor private static var nonces: [NonceKey: Data] = [:]

    /// Two digits typed on the keypad: a digit adds (up to two), delete takes the last one off.
}

/// What the sheet says about number matching.
enum ConnectMatchCopy {
    static let wrongNumber = "That isn't the number your browser shows, so the request was declined. "
        + "If you didn't start it, someone who knows your password tried to connect an AI. Change your password."
    static let broken = "Your browser's request changed after it was made, so it was declined. Start connecting again in your browser."
    static let otherDevice = "Another of your devices is answering this request. Finish it there."
    static let expired = "This request expired. Start connecting again in your browser."
    static let changed = "The page in your browser changed. Start connecting again in your browser."
    static let changedWhileAnswering = "This request changed while you were answering it, so it was declined. Start connecting again."
    static let rescan = "This code changed on your computer. Scan it again."
}

enum ConnectAPI {
    struct Failure: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    /// One call to the MCP server's /connect endpoints: path, method, JSON body → response body.
    typealias Send = @Sendable (_ path: String, _ method: String, _ body: [String: Any]?) async throws -> Data

    /// The app's session goes in a header, never in the address.
    static func sender(_ client: SupabaseClient) -> Send {
        { path, method, body in
            guard let base = BackendConfig.mcpURL else { throw Failure(message: "Sync is off in this build.") }
            let jwt = try await client.auth.session.accessToken
            var req = URLRequest(url: URL(string: base.absoluteString + path)!)
            req.httpMethod = method
            req.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
            if let body {
                req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                req.httpBody = try JSONSerialization.data(withJSONObject: body)
            }
            let (data, response) = try await AppNetwork.session.data(for: req)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
                throw Failure(message: message ?? "Couldn't reach Pinto Notes. Check your connection.")
            }
            return data
        }
    }

    static func request(_ client: SupabaseClient, id: UUID) async throws -> ConnectRequest {
        try await request(id: id, send: sender(client))
    }

    static func request(id: UUID, send: Send) async throws -> ConnectRequest {
        let data = try await send("/connect/request?id=\(id.uuidString.lowercased())", "GET", nil)
        return try AnyJSON.decoder.decode(ConnectRequest.self, from: data)
    }

    /// What happens after an answer.
    enum Answer: Equatable {
        /// Send the browser here (the request came by link on this device).
        case open(URL)
        /// A browser elsewhere asked: it picks the answer up itself, and this device opens nothing.
        case handedOff

        var url: URL? { if case .open(let url) = self { url } else { nil } }
    }

    /// The client's return address with `state` (when there is one) and `iss` set, as the server
    /// writes it (`new URL(redirect_uri)`, then `searchParams.set`): the query is read as form
    /// data and written back form-encoded, every existing parameter included.
    static func clientRedirect(_ redirectURI: String, state: String?, iss: String) -> String {
        var base = redirectURI, fragment = ""
        if let hash = base.firstIndex(of: "#") {
            fragment = String(base[hash...])
            base = String(base[..<hash])
        }
        var query = ""
        if let q = base.firstIndex(of: "?") {
            query = String(base[base.index(after: q)...])
            base = String(base[..<q])
        }
        var params: [(String, String)] = query.split(separator: "&", omittingEmptySubsequences: true).map { pair in
            let parts = pair.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false)
            return (formDecode(String(parts[0])), parts.count > 1 ? formDecode(String(parts[1])) : "")
        }
        func set(_ name: String, _ value: String) {
            if let i = params.firstIndex(where: { $0.0 == name }) {
                params[i].1 = value
                var j = params.count - 1
                while j > i { if params[j].0 == name { params.remove(at: j) }; j -= 1 }
            } else {
                params.append((name, value))
            }
        }
        if let state { set("state", state) }
        set("iss", iss)
        return base + "?" + params.map { formEncode($0.0) + "=" + formEncode($0.1) }.joined(separator: "&") + fragment
    }

    /// application/x-www-form-urlencoded, as URLSearchParams writes it.
    static func formEncode(_ s: String) -> String {
        var out = ""
        for b in s.utf8 {
            switch b {
            case UInt8(ascii: "a") ... UInt8(ascii: "z"), UInt8(ascii: "A") ... UInt8(ascii: "Z"), UInt8(ascii: "0") ... UInt8(ascii: "9"),
                 UInt8(ascii: "*"), UInt8(ascii: "-"), UInt8(ascii: "."), UInt8(ascii: "_"):
                out.unicodeScalars.append(Unicode.Scalar(b))
            case UInt8(ascii: " "):
                out += "+"
            default:
                out += String(format: "%%%02X", b)
            }
        }
        return out
    }

    static func formDecode(_ s: String) -> String {
        var bytes: [UInt8] = []
        var u = Array(s.utf8)[...]
        while let b = u.popFirst() {
            if b == UInt8(ascii: "+") { bytes.append(UInt8(ascii: " ")); continue }
            if b == UInt8(ascii: "%"), u.count >= 2, let v = UInt8(String(decoding: u.prefix(2), as: UTF8.self), radix: 16) {
                bytes.append(v)
                u = u.dropFirst(2)
                continue
            }
            bytes.append(b)
        }
        return String(decoding: bytes, as: UTF8.self)
    }

    /// The server described the request without its return address, so there's nowhere to send an answer.
    static let noReturnAddress = "Pinto Notes didn't get this AI's return address. Start connecting again from the AI."

    /// Allow or deny. `redirect_uri` goes back exactly as /connect/request gave it. Allowing sends
    /// a code made here (`code`): only its hash and the account's key wrapped under it reach the
    /// server. A request asked from a browser (`browserKey`, the page's public key) also gets the
    /// code sealed to that page together with the address it goes to (`handoffRedirect`), so
    /// nobody on the way can send the page elsewhere; otherwise the code is added to the return
    /// address here.
    ///
    /// `wrongNumber`: declined because the person typed a number the page didn't show. The server
    /// then takes no asks for this account for an hour and tells every device.
    static func decide(id: UUID, redirectURI: String?, allow: Bool, write: Bool,
                       code: (code: String, hash: String, wrap: String)?, browserKey: Data? = nil, handoffRedirect: String? = nil,
                       wrongNumber: Bool = false, scan: String? = nil, send: Send) async throws -> Answer {
        guard let redirectURI else { throw Failure(message: Self.noReturnAddress) }
        guard !allow || code != nil else { throw Failure(message: "Open Pinto Notes and finish setting up encryption first.") }
        var body: [String: Any] = ["id": id.uuidString.lowercased(), "allow": allow, "write": write, "redirect_uri": redirectURI]
        if !allow, wrongNumber { body["wrong_number"] = true }
        if let scan { body["scan"] = scan }
        if allow, let code {
            body["code_hash"] = code.hash
            body["code_wrap"] = code.wrap
            if let browserKey {
                guard let handoffRedirect, ConnectCenter.isReturnAddress(URL(string: handoffRedirect) ?? URL(fileURLWithPath: "/")),
                      let sealed = try? E2EE.sealHandoff(code: E2EE.handoffPayload(code: code.code, redirect: handoffRedirect),
                                                         browserKey: browserKey, requestID: id) else {
                    throw Failure(message: "Start connecting again in your browser.")
                }
                body["handoff"] = sealed
            }
        }
        let data = try await send("/connect/decide", "POST", body)
        let answer = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        // The browser that asked goes on by itself, allowed or not.
        if answer?["handoff"] as? Bool == true { return .handedOff }
        guard let s = answer?["redirect"] as? String, let url = URL(string: s) else {
            throw Failure(message: "Pinto Notes gave an unexpected answer. Try connecting again.")
        }
        guard allow, let code else { return .open(url) }
        return .open(withCode(url, code.code))
    }

    enum Answered: Equatable {
        case answered(Answer)
        /// The ask changed after its number showed: declined, and nothing sealed.
        case declinedChanged
    }

    /// The person's answer to a request. A request asked from a browser with its number showing
    /// (`match`) is read again first (`read`): unless it's exactly what the number was made from,
    /// the request is declined (never as a wrong number) and no code is made or sealed. Allowing
    /// seals the code only to the key the number was made from.
    @MainActor static func answer(_ r: ConnectRequest, allow: Bool, write: Bool, wrongNumber: Bool = false, match: ConnectMatch.Match?,
                       scanned: (scan: ConnectScan, key: Data)? = nil,
                       read: () async throws -> ConnectAskMatch?, code: () throws -> (code: String, hash: String, wrap: String),
                       send: Send) async throws -> Answered {
        var key: Data?
        if r.isAsked, let scanned {
            // Scanned from the page: its key was checked against the code when the sheet opened.
            if allow { key = scanned.key }
            let made = allow ? try code() : nil
            return .answered(try await decide(id: r.id, redirectURI: r.redirect_uri, allow: allow, write: write, code: made, browserKey: key,
                                              handoffRedirect: r.handoffRedirect, scan: scanned.scan.secret, send: send))
        } else if r.isAsked, let match {
            switch ConnectMatch.recheck(match, now: try await read()) {
            case .expired:
                throw Failure(message: ConnectMatchCopy.expired)
            case .changed:
                _ = try await decide(id: r.id, redirectURI: r.redirect_uri, allow: false, write: false, code: nil, send: send)
                return .declinedChanged
            case .same:
                if allow { key = match.key }
            }
        } else if allow, r.isAsked {
            throw Failure(message: ConnectMatchCopy.changed)
        }
        let made = allow ? try code() : nil
        return .answered(try await decide(id: r.id, redirectURI: r.redirect_uri, allow: allow, write: write, code: made, browserKey: key,
                                          handoffRedirect: r.handoffRedirect, wrongNumber: wrongNumber, send: send))
    }

    /// Lets go of a request this account opened and didn't answer, so another account (or the
    /// recovery key on the page) can answer it.
    static func release(id: UUID, send: Send) async throws {
        _ = try await send("/connect/release", "POST", ["id": id.uuidString.lowercased()])
    }

    /// This device's nonce for an asked request (16 random bytes, lowercase hex), written once
    /// before the page reveals its own.
    static func writeNonce(id: UUID, nonce: Data, send: Send) async throws {
        _ = try await send("/connect/nonce", "POST", ["id": id.uuidString.lowercased(), "nonce": E2EE.hex(nonce)])
    }

    /// The AI's return address with the code this device made, next to what the server put there.
    static func withCode(_ url: URL, _ code: String) -> URL {
        guard var parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return url }
        parts.queryItems = (parts.queryItems ?? []).filter { $0.name != "code" } + [URLQueryItem(name: "code", value: code)]
        return parts.url ?? url
    }
}

/// Disconnecting an AI: its grant is revoked, and it loses access at once.
enum ConnectRevoke {
    static func revoke(_ client: SupabaseClient, id: UUID) async throws {
        try await client.from("mcp_tokens").update(["revoked_at": AnyJSON.string(Date.now.ISO8601Format())]).eq("id", value: id).execute()
    }
}

/// Access tokens for Claude Code and Codex, made on this device.
@MainActor
enum ConnectTokens {
    /// A new pane_ token: made here with the account's key wrapped under it, registered by its hash
    /// only. The token itself never leaves the device except in the AI's Authorization header.
    static func create(_ client: SupabaseClient, name: String, write: Bool,
                       make: () throws -> (token: String, hash: String, wrap: String)) async throws -> String {
        let made = try make()
        struct Params: Encodable { var token_name: String; var write_access: Bool; var token_hash: String; var dk_wrap: String }
        try await client.rpc("create_mcp_token", params: Params(token_name: name, write_access: write, token_hash: made.hash, dk_wrap: made.wrap)).execute()
        return made.token
    }
}

/// Face ID or Touch ID (or the device password) before an AI gets your notes.
enum ConnectApproval {
    /// Whether this device can ask for Face ID, Touch ID or its passcode. Without one, nobody is
    /// asked, so an AI can't be allowed from it.
    static var canConfirm: Bool {
        var error: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    }

    static func confirm(_ who: String) async -> Bool {
        let context = LAContext()
        return (try? await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "allow \(who) to read your notes")) ?? false
    }
}

// MARK: Receiving the link

/// Holds a connect request that arrived by link, or was asked from a browser, until the consent
/// sheet takes it. One sheet at a time; asks that arrive meanwhile wait their turn.
@MainActor
@Observable
final class ConnectCenter: NSObject {
    static let shared = ConnectCenter()
    var pending: UUID?
    /// Asks from a browser this device knows are waiting, by request id.
    private(set) var asks: [UUID: ConnectAsk] = [:]
    /// Asks and links waiting for the sheet, in the order they'll show. Nothing that arrives
    /// replaces the sheet that's showing: the person answers what they're looking at.
    private(set) var queue: [UUID] = []
    /// Requests in the queue that came by link on this device (not asks).
    private var links: Set<UUID> = []
    /// What a scanned QR code (or the page's Open Amber Notes on this Mac) carried, by request id.
    private(set) var scans: [UUID: ConnectScan] = [:]
    /// Asks that have been offered here: each opens the sheet by itself once.
    private var offered: Set<UUID> = []
    /// Answered on this device: the update saying so doesn't cut the sheet's "Allowed" short.
    private var answeredHere: Set<UUID> = []
    /// When each ask became known here, counted, so a look at the server that started before it
    /// can't close it (see `gone(from:lookedAt:)`).
    private var learned = 0
    private var learnedAt: [UUID: Int] = [:]
    private var expiry: Task<Void, Never>?
    /// Between one sheet closing and the next opening.
    var nextDelay: Duration = .milliseconds(450)
    /// The last approval made on this device, so an open guide can say it worked right away.
    var approved: (ai: String?, at: Date)?
    /// Looks at the server for asks now (set while signed in, by ConnectAsks): a push was tapped
    /// or arrived.
    @ObservationIgnored var lookAgain: (@MainActor () async -> Void)?
    /// Where the consent sheet can show, bottom to top: the window's root, then each sheet on
    /// screen over it (Settings, then Connect Claude over that). Only the top one presents it: a
    /// view that's already presenting a sheet can't present another, so a sheet asked for on the
    /// root while Settings is up never appears.
    private(set) var hosts: [UUID] = []
    /// Connect guides on screen: an ask is expected any moment, so the app looks more often.
    private(set) var expecting = 0

    func hostAppeared(_ id: UUID) {
        hosts.removeAll { $0 == id }
        hosts.append(id)
    }

    func hostGone(_ id: UUID) { hosts.removeAll { $0 == id } }

    /// Whether this host is the one that presents the consent sheet now.
    func presents(host id: UUID) -> Bool { hosts.last == id }

    /// A connect guide appeared: looks for asks now, and often until it goes.
    func expectAsks() {
        expecting += 1
        if expecting == 1, let lookAgain { Task { await lookAgain() } }
    }

    func stopExpectingAsks() { expecting = max(0, expecting - 1) }
    #if os(macOS)
    /// The browser the request showing came from, so the answer goes back to the same one.
    var browser: URL?
    /// The browser each queued link came from.
    private var browsers: [UUID: URL] = [:]
    /// Brings the app to the front for a link; tests keep it where it is.
    @ObservationIgnored var activate: () -> Void = { NSApp.activate() }
    private var installed = false

    /// Takes URL events ourselves so we can tell which app sent them (SwiftUI's
    /// onOpenURL doesn't say). Installed once the first window is up.
    func installHandler() {
        guard !installed else { return }
        installed = true
        NSAppleEventManager.shared().setEventHandler(self, andSelector: #selector(handle(_:reply:)),
                                                     forEventClass: AEEventClass(kInternetEventClass), andEventID: AEEventID(kAEGetURL))
    }

    @objc private func handle(_ event: NSAppleEventDescriptor, reply: NSAppleEventDescriptor) {
        guard let s = event.paramDescriptor(forKeyword: AEKeyword(keyDirectObject))?.stringValue, let url = URL(string: s) else { return }
        let pid = event.attributeDescriptor(forKeyword: AEKeyword(0x7370_6964))?.int32Value // 'spid': sender's process id
        let sender = pid.flatMap { NSRunningApplication(processIdentifier: $0)?.bundleURL }
        receive(url, from: sender)
    }
    #endif

    var askIDs: [UUID] { Array(asks.keys) }

    /// A browser asked this account's devices. Opens the sheet, or queues it behind the one showing.
    /// True when it's new here (the caller may notify); an expired or answered ask is ignored.
    @discardableResult
    func offer(_ ask: ConnectAsk, now: Date = .now) -> Bool {
        guard ask.isOpen(now: now) else { withdraw(ask.id); return false }
        if asks[ask.id] == nil {
            learned += 1
            learnedAt[ask.id] = learned
        }
        asks[ask.id] = ask
        guard !offered.contains(ask.id) else { return false }
        offered.insert(ask.id)
        if pending == ask.id { return false }
        if pending == nil { show(ask.id) } else { queue.append(ask.id) }
        return true
    }

    /// An ask was answered on another device, or expired: its sheet closes.
    func withdraw(_ id: UUID) {
        asks[id] = nil
        learnedAt[id] = nil
        queue.removeAll { $0 == id }
        guard pending == id, !answeredHere.contains(id) else { return }
        pending = nil
        showNextSoon()
    }

    /// Where a look at the server starts, for `gone(from:lookedAt:)`.
    func lookStarts() -> Int { learned }

    /// The asks a look at the server no longer found (answered elsewhere, or expired). An ask that
    /// became known after the look started isn't gone: realtime brought it while the look was out,
    /// and the look's answer is simply older than it.
    func gone(from open: Set<UUID>, lookedAt mark: Int) -> [UUID] {
        asks.keys.filter { !open.contains($0) && (learnedAt[$0] ?? 0) <= mark }
    }

    /// Asks still waiting for an answer whose sheet isn't showing: closed without an answer (a
    /// swipe, a tap beside it) or queued behind another. Closing the sheet never answers an ask;
    /// it stays here until it's answered or expires, and "Approval waiting" opens it again.
    func waiting(now: Date = .now) -> [ConnectAsk] {
        asks.values.filter { $0.id != pending && $0.isOpen(now: now) && !answeredHere.contains($0.id) }
            .sorted { $0.created_at > $1.created_at }
    }

    /// The notification for an ask was tapped, or "Approval waiting": it's next, or showing already.
    func showAsk(_ id: UUID) {
        guard pending != id else { return }
        if pending == nil { show(id); return }
        queue.removeAll { $0 == id }
        queue.insert(id, at: 0)
    }

    /// The sheet is answering this request; it closes itself.
    func answering(_ id: UUID) { answeredHere.insert(id) }

    /// The sheet closed, answered or not: the next ask shows. One answered here is done; one that
    /// wasn't stays waiting (`waiting`).
    func sheetClosed() {
        if let id = pending, answeredHere.remove(id) != nil { asks[id] = nil }
        pending = nil
        expiry?.cancel()
        showNextSoon()
    }

    /// Signed out.
    func clearAsks() {
        if let id = pending, asks[id] != nil { pending = nil }
        asks = [:]
        queue = []
        links = []
        scans = [:]
        offered = []
        answeredHere = []
        learnedAt = [:]
        expiry?.cancel()
    }

    private func show(_ id: UUID) {
        pending = id
        #if os(macOS)
        browser = browsers.removeValue(forKey: id)
        #endif
        expiry?.cancel()
        // An ask left unanswered closes when it expires.
        guard let ends = asks[id]?.expires_at else { return }
        expiry = Task { [weak self] in
            try? await Task.sleep(for: .seconds(max(0, ends.timeIntervalSinceNow)))
            guard !Task.isCancelled else { return }
            self?.withdraw(id)
        }
    }

    private func showNextSoon() {
        let delay = nextDelay
        Task { [weak self] in
            try? await Task.sleep(for: delay)
            self?.showNext()
        }
    }

    /// The next ask still waiting, if nothing is showing.
    func showNext(now: Date = .now) {
        guard pending == nil else { return }
        while let id = queue.first {
            queue.removeFirst()
            if links.remove(id) != nil { show(id); return }
            if asks[id]?.isOpen(now: now) == true { show(id); return }
            asks[id] = nil
        }
    }

    /// A request by link on this device. It shows now, or next when a sheet is showing: it never
    /// replaces what the person is looking at.
    func receive(_ url: URL, from sender: URL? = nil) {
        // Places the onboarding emails link to (Settings › Connect an AI, import, version history).
        if AppPlaceCenter.shared.receive(url) {
            #if os(macOS)
            activate()
            #endif
            return
        }
        // "Use this template" and "Use this note" links: their sheet shows over the notes.
        if NoteSourceCenter.shared.receive(url) {
            #if os(macOS)
            activate()
            #endif
            return
        }
        guard let id = ConnectLink.requestID(from: url) else { return }
        if let scan = ConnectScan(url: url) { scans[id] = scan }
        #if os(macOS)
        let from = sender.flatMap { Self.isBrowser($0) ? $0 : nil }
        if let from { browsers[id] = from } else { browsers[id] = nil }
        activate()
        #endif
        guard pending != id else { return }
        guard pending == nil else {
            // Queued asks keep their place behind the person's own link.
            if !queue.contains(id) { queue.insert(id, at: 0) }
            links.insert(id)
            return
        }
        show(id)
    }

    /// Sends the browser on to the AI with the result, in the browser it came from when known.
    /// Only ever a web address (the server allows nothing else; this checks again).
    func open(_ url: URL) {
        guard Self.isReturnAddress(url) else { return }
        #if os(macOS)
        if let browser {
            NSWorkspace.shared.open([url], withApplicationAt: browser, configuration: NSWorkspace.OpenConfiguration())
        } else {
            NSWorkspace.shared.open(url)
        }
        #else
        UIApplication.shared.open(url)
        #endif
    }

    /// https anywhere, or http back to this computer (native clients listen there).
    nonisolated static func isReturnAddress(_ url: URL) -> Bool {
        switch url.scheme?.lowercased() {
        case "https": return true
        case "http": return ["localhost", "127.0.0.1", "::1", "[::1]"].contains(url.host?.lowercased() ?? "")
        default: return false
        }
    }

    #if os(macOS)
    private static func isBrowser(_ app: URL) -> Bool {
        NSWorkspace.shared.urlsForApplications(toOpen: URL(string: "https://example.com")!).contains { $0.standardizedFileURL == app.standardizedFileURL }
    }
    #endif
}

/// Wires links and the consent sheet into the app's root view.
struct ConnectHandler: ViewModifier {
    let backend: Backend
    @State private var center = ConnectCenter.shared

    func body(content: Content) -> some View {
        content
            .onOpenURL { center.receive($0) }
            // The site's universal link, https://ambernotes.app/open/connect?request=<id>.
            .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                if let url = activity.webpageURL { center.receive(url) }
            }
            #if os(macOS)
            // Links land in the window that's already open instead of a new one.
            .handlesExternalEvents(preferring: [ConnectLink.scheme], allowing: ["*"])
            .onAppear { center.installHandler() }
            // Handoff from iPhone: carry on connecting here, in Connect an AI.
            .onContinueUserActivity(ConnectHandoff.activityType) { _ in
                NotificationCenter.default.post(name: .paneConnectAI, object: nil)
            }
            #endif
            .onAppear { center.installNotifications() }
            .modifier(ConsentHost(client: backend.client, active: isSignedIn))
    }

    private var isSignedIn: Bool {
        if case .signedIn = backend.state { return true }
        return false
    }
}

/// Presents the consent sheet when it's the top host on screen (`ConnectCenter.hosts`): the
/// window's root, or on iPhone and iPad a sheet over it. An ask that arrives while Settings and
/// Connect Claude are open shows over them instead of waiting, unseen, behind them.
struct ConsentHost: ViewModifier {
    let client: SupabaseClient?
    var active = true
    @State private var center = ConnectCenter.shared
    @State private var id = UUID()

    func body(content: Content) -> some View {
        content
            .onAppear { center.hostAppeared(id) }
            .onDisappear { center.hostGone(id) }
            .sheet(item: Binding(
                get: { client != nil && active && center.presents(host: id) ? center.pending.map(PendingID.init) : nil },
                set: { if $0 == nil { center.sheetClosed() } }
            )) { pending in
                if let client {
                    ConsentSheet(client: client, requestID: pending.id, finish: { center.open($0) },
                                 allowed: { r in
                                     center.approved = (r.verifiedAI, .now)
                                     Telemetry.shared.record(.aiConnected(AIKind(verified: r.verifiedAI)))
                                     // Connected an AI: the moment to ask to notify (the next
                                     // ask can then reach this device when the app isn't open).
                                     Task { await ConnectNotifier.system.askPermission() }
                                 },
                                 answering: { center.answering($0) })
                }
            }
    }

    private struct PendingID: Identifiable { let id: UUID }
}

/// "Approval waiting": an ask whose sheet isn't showing (closed without an answer, or queued),
/// on top of the notes list and in Connect an AI. Tapping it opens the sheet again.
struct ConnectWaitingRow: View {
    let ask: ConnectAsk
    @State private var center = ConnectCenter.shared

    /// "Requested from Chrome on a Mac."
    nonisolated static func detail(_ ask: ConnectAsk) -> String {
        "Requested from \(ask.started_from.isEmpty ? "a web browser" : ask.started_from)."
    }

    var body: some View {
        Button { center.showAsk(ask.id) } label: {
            HStack(spacing: 12) {
                Image(systemName: "lock.shield.fill")
                    .font(.title3)
                    .foregroundStyle(.tint)
                    .frame(width: 32, height: 32)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Approval waiting").font(.body.weight(.semibold)).foregroundStyle(.primary)
                    Text(Self.detail(ask)).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text("Review").font(.body.weight(.medium)).foregroundStyle(.tint)
            }
            .padding(.vertical, 2)
            .contentShape(.rect)
            .hoverRow()
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Approval waiting. \(Self.detail(ask))")
        .accessibilityHint("Opens the request to connect an AI")
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("connect.waiting")
    }
}

extension View {
    func connectHandler(backend: Backend) -> some View { modifier(ConnectHandler(backend: backend)) }

    /// A sheet's content: the consent sheet can show over it. On the Mac each window presents its
    /// own sheets, so only the window's root hosts it.
    @ViewBuilder
    func consentHost(client: SupabaseClient?, active: Bool = true) -> some View {
        #if os(iOS)
        modifier(ConsentHost(client: client, active: active))
        #else
        self
        #endif
    }
}

// MARK: Consent

/// An app the consent sheet can't name: a plain symbol on the same white tile as `AITile`, so a
/// known AI and an unknown app look like one set.
struct ClientTile: View {
    let symbol: String
    var size: CGFloat = 30

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
        Image(systemName: symbol)
            .font(.system(size: size * 0.46, weight: .regular))
            .foregroundStyle(Color(white: 0.45))
            .frame(width: size, height: size)
            .background(Color.white, in: shape)
            .overlay(shape.strokeBorder(Color.black.opacity(0.08), lineWidth: 0.5))
            .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.10), radius: 3, y: 1.5)
            .environment(\.colorScheme, .light)
            .accessibilityHidden(true)
    }
}

struct ConsentSheet: View {
    let client: SupabaseClient
    let requestID: UUID
    /// Opens the AI's return address in the browser.
    let finish: (URL) -> Void
    /// Told when the person allowed the request.
    var allowed: (ConnectRequest) -> Void = { _ in }
    /// Told just before the answer is sent.
    var answering: (UUID) -> Void = { _ in }
    @Environment(\.dismiss) private var dismiss

    enum Phase: Equatable { case loading, asking(ConnectRequest), working, done(String), handedOff(String), failed(String) }
    @State private var phase: Phase
    @State private var write = true
    @Environment(\.dynamicTypeSize) private var typeSize
    /// Asked from a browser that the person signed in on (a notification): what the number was
    /// made from (the page's key and commit as first read, and the revealed nonce), and the
    /// number both screens show. Nil until the page has revealed its nonce and it opened the commit.
    typealias Match = ConnectMatch.Match
    @State private var match: Match?
    /// Scanned from the page's QR code (or opened by its button on this Mac): the code's secret,
    /// and the page's key once it's checked against the code. Then no number is needed.
    @State private var scanned: (scan: ConnectScan, key: Data)?
    /// Allow waits a moment after what the sheet shows changes, so a tap meant for what was there
    /// before doesn't land on what's there now.
    @State private var armed = false
    /// The server took this sheet's answer. A sheet that closes without one lets go of the request
    /// (`release`): on 13 October 2026 a failed answer left it held, and the recovery key on the
    /// page, signed in to another account, was turned away.
    @State private var serverAnswered = false
    var release: (SupabaseClient, UUID) async -> Void = { client, id in
        try? await ConnectAPI.release(id: id, send: ConnectAPI.sender(client))
    }
    static let armDelay: Duration = .seconds(1)
    /// The sheet's height follows what it shows (iPhone), up to the full screen.
    @State private var contentHeight: CGFloat = 0
    /// Face ID or Touch ID before allowing; tests and captures answer for it.
    var confirm: (String) async -> Bool = ConnectApproval.confirm
    var canConfirm: () -> Bool = { ConnectApproval.canConfirm }
    /// The ask's number-matching columns as they are now (nil once it's answered or expired).
    var askMatch: (SupabaseClient, UUID) async throws -> ConnectAskMatch? = { try await ConnectAsks.match($0, id: $1) }
    /// Writes this device's nonce on the ask.
    var writeNonce: (SupabaseClient, UUID, Data) async throws -> Void = { client, id, nonce in
        try await ConnectAPI.writeNonce(id: id, nonce: nonce, send: ConnectAPI.sender(client))
    }
    /// How often the ask is read again while the page hasn't revealed its nonce.
    var pollInterval: Duration = .seconds(1)
    /// What the link carried, when it was a scanned code. Read from `ConnectCenter` by default.
    var scan: ConnectScan?

    init(client: SupabaseClient, requestID: UUID, initial: Phase = .loading, finish: @escaping (URL) -> Void,
         allowed: @escaping (ConnectRequest) -> Void = { _ in }, answering: @escaping (UUID) -> Void = { _ in },
         scan: ConnectScan? = nil, previewMatch: Match? = nil) {
        self.client = client
        self.requestID = requestID
        self.finish = finish
        self.allowed = allowed
        self.answering = answering
        self.scan = scan ?? ConnectCenter.shared.scans[requestID]
        _phase = State(initialValue: initial)
        _match = State(initialValue: previewMatch)
    }

    private struct Shown: Equatable { var phase: Phase; var match: Match? }

    var body: some View {
        sized
            #if os(macOS)
            .frame(width: 440)
            #endif
            .foregroundStyle(Color.ink)
            .background(Color(Palette.sheetGround))
            .tint(Color(Palette.amber))
            .task {
                if phase == .loading { await load() }
                else if case .asking(let r) = phase { await opened(r) }
            }
            .task(id: Shown(phase: phase, match: match)) {
                armed = false
                try? await Task.sleep(for: Self.armDelay)
                if !Task.isCancelled { armed = true }
            }
            .animation(.smooth(duration: 0.25), value: phase)
            .blurDemoCue { cue in
                if cue == "working" { phase = .working } else if cue == "done" { phase = .done("ChatGPT") }
            }
            .onDisappear {
                guard !serverAnswered else { return }
                let (release, client, id) = (release, client, requestID)
                Task { await release(client, id) }
            }
    }

    /// iPhone: as tall as what it shows, scrolling when that's more than the screen (the
    /// largest text sizes). Nothing is ever cut short.
    @ViewBuilder
    private var sized: some View {
        #if os(iOS)
        ScrollView {
            content
                .padding(.horizontal, 24)
                .padding(.top, 32)
                .padding(.bottom, 16)
                .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { contentHeight = $0 }
        }
        .scrollBounceBehavior(.basedOnSize)
        .presentationDetents(contentHeight > 0 ? [.height(contentHeight + 24)] : [.medium])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color(Palette.sheetGround))
        #else
        content
            .padding(.horizontal, 36)
            .padding(.top, 32)
            .padding(.bottom, 20)
        #endif
    }

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Each of the sheet's states rises into focus as the one before fades (BlurMotion).
    private var content: some View {
        ZStack {
            states
                .id(phaseKey)
                .transition(reduceMotion ? .opacity : BlurMotion.page)
        }
        .animation(reduceMotion ? .easeOut(duration: 0.2) : BlurMotion.enter, value: phaseKey)
    }

    private var phaseKey: Int {
        switch phase {
        case .loading, .working: 0
        case .asking: 1
        case .done, .handedOff: 2
        case .failed: 3
        }
    }

    @ViewBuilder
    private var states: some View {
        switch phase {
        case .loading, .working:
            ProgressView().controlSize(.large).frame(maxWidth: .infinity).frame(height: 160)
        case .asking(let r):
            asking(r)
        case .done(let name):
            finished("Go back to \(name) to finish.")
        case .handedOff:
            #if os(macOS)
            finished("It finishes connecting in your browser.")
            #else
            finished("It finishes connecting on your computer.")
            #endif
        case .failed(let message):
            VStack(spacing: 14) {
                AppMark(size: 56)
                Text("Couldn't connect").font(.title3.weight(.semibold))
                Text(message).multilineTextAlignment(.center).foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("connect.failure")
                Button("Close") { dismiss() }.keyboardShortcut(.cancelAction)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func finished(_ detail: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 52))
                .foregroundStyle(.green)
                .accessibilityHidden(true)
            Text("Connected").font(.title2.weight(.semibold)).accessibilityIdentifier("connect.done")
            Text(detail).multilineTextAlignment(.center).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .accessibilityElement(children: .combine)
    }

    #if os(iOS)
    static let compact = true
    #else
    static let compact = false
    #endif

    /// One icon: the AI's mark when the return address is its own, else a plain tile.
    private func icon(_ r: ConnectRequest) -> some View {
        let ai = r.verifiedAI
        let size: CGFloat = Self.compact ? 72 : 64
        return Group {
            if let ai {
                AITile(ai: ai, size: size)
            } else {
                // An app we can't vouch for: a plain glyph, never a borrowed mark.
                ClientTile(symbol: r.loopback ? "desktopcomputer" : "globe", size: size)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ai ?? "An app")
        .accessibilityIdentifier(ai == nil ? "connect.header.unknown" : "connect.header.\(ai!)")
    }

    #if os(macOS)
    static let allowHint = "Confirms with Touch ID or your password"
    #else
    static let allowHint = "Confirms with Face ID or your passcode"
    #endif

    /// The title: who gets access, by the address it goes to.
    nonisolated static func title(_ r: ConnectRequest) -> String { "Allow \(r.who) to use your notes?" }

    /// What an app calls itself, as a name reads: "glama" is Glama, "claude code" Claude Code.
    /// A name with capitals of its own ("ChatGPT", "iA Writer") stays as it is.
    nonisolated static func displayName(_ name: String) -> String {
        guard name == name.lowercased() else { return name }
        return name.split(separator: " ", omittingEmptySubsequences: false)
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: " ")
    }

    /// The line under the title. A recognized AI: where access goes. Any other app: a calm
    /// caution, with the name it gives itself shown only as a claim (anyone can call themselves
    /// Claude), and never the name the person is told to check against.
    nonisolated static func detail(_ r: ConnectRequest) -> String {
        guard r.verifiedAI == nil else { return "Access goes to \(r.redirect_host). Locked notes stay private." }
        let claim = r.claimedName.map { " It calls itself \(displayName($0))." } ?? ""
        return "Pinto Notes doesn\u{2019}t recognize this app.\(claim) Only allow it if you just started connecting it yourself."
    }

    /// What the chosen access lets the app do.
    nonisolated static func accessLine(write: Bool) -> String {
        write ? "It can read, create and change notes. Every change keeps the previous version."
            : "It can read notes, but not change them."
    }

    /// A request by notification: the number both screens show, compared by the person.
    private func byNumber(_ r: ConnectRequest) -> Bool { r.isAsked && scanned == nil }

    private func asking(_ r: ConnectRequest) -> some View {
        VStack(spacing: 0) {
            icon(r).padding(.bottom, 18)
            Text(Self.title(r))
                .font(.display(Self.compact ? 26 : 22))
                .tracking(Palette.tracking(Self.compact ? 26 : 22))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 8)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("connect.title")
            Text(Self.detail(r))
                .font(Self.compact ? .body : .system(size: 14))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier(r.verifiedAI == nil ? "connect.unknown" : "connect.destination")
            if let line = r.requestedLine() {
                Text(line)
                    .font(Self.compact ? .footnote : .system(size: 12))
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .padding(.top, 6)
                    .accessibilityIdentifier("connect.requested")
            }
            if byNumber(r) { number.padding(.top, 18) }
            access(r).padding(.top, 20)
            Button { Task { await decide(r, allow: true) } } label: {
                Text("Allow").frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent(height: Self.compact ? 50 : 40, cornerRadius: Self.compact ? 14 : 10))
            .keyboardShortcut(.defaultAction)
            .frame(maxWidth: Self.compact ? .infinity : 320)
            .disabled(!armed || (byNumber(r) && match == nil))
            .padding(.top, 22)
            .accessibilityHint(Self.allowHint)
            .accessibilityIdentifier("connect.allow")
            Button("Don\u{2019}t Allow") { Task { await decide(r, allow: false) } }
                .buttonStyle(.hoverLink)
                .font(.system(size: Self.compact ? 15 : 13, weight: .medium))
                .foregroundStyle(Color.muted)
                .keyboardShortcut(.cancelAction)
                .frame(minHeight: Self.compact ? 44 : 34)
                .padding(.top, 6)
                .accessibilityIdentifier("connect.deny")
        }
        .frame(maxWidth: .infinity)
    }

    /// Asked by notification: the two digits the page shows, to compare.
    @ViewBuilder
    private var number: some View {
        VStack(spacing: 6) {
            if let match {
                Text(match.number)
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color.ink)
                    .accessibilityLabel("Number \(match.number.map(String.init).joined(separator: " "))")
                    .accessibilityIdentifier("connect.number")
                Text("Allow only if your computer shows the same number.")
            } else {
                ProgressView().frame(height: 62)
                Text("Waiting for your computer\u{2026}")
            }
        }
        .font(Self.compact ? .callout : .system(size: 13))
        .foregroundStyle(Color.muted)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
    }

    /// Read and edit or read only, in plain sight: what the app asked for is chosen. An app that
    /// asked only to read gets no choice, just the line that says so.
    private func access(_ r: ConnectRequest) -> some View {
        let canEdit = Binding(get: { write && r.wants_write }, set: { write = $0 })
        return VStack(spacing: 8) {
            if r.wants_write {
                Group {
                    if typeSize.isAccessibilitySize {
                        // Segments don't fit the largest text sizes: a choice per line does.
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach([true, false], id: \.self) { edit in
                                Button { canEdit.wrappedValue = edit } label: {
                                    Label(edit ? "Read and edit" : "Read only",
                                          systemImage: canEdit.wrappedValue == edit ? "checkmark.circle.fill" : "circle")
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .buttonStyle(.plain)
                                .foregroundStyle(Color.ink)
                                .accessibilityAddTraits(canEdit.wrappedValue == edit ? .isSelected : [])
                            }
                        }
                    } else {
                        Picker("Access", selection: canEdit) {
                            Text("Read and edit").tag(true)
                            Text("Read only").tag(false)
                        }
                        .pickerStyle(.segmented)
                        .labelsHidden()
                        .frame(maxWidth: Self.compact ? .infinity : 260)
                    }
                }
                .accessibilityLabel("Access")
                .accessibilityIdentifier("connect.access")
            }
            Text(Self.accessLine(write: canEdit.wrappedValue))
                .font(Self.compact ? .footnote : .system(size: 12))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("connect.access.line")
        }
    }

    private func load() async {
        do {
            let r = try await ConnectAPI.request(client, id: requestID)
            // Someone who just started connecting expects their AI to work.
            write = r.startsWithWrite
            phase = .asking(r)
            await opened(r)
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    /// A request asked from a browser: scanned, its key checked against the code; otherwise by
    /// notification, with the number.
    private func opened(_ r: ConnectRequest) async {
        guard r.isAsked, match == nil, scanned == nil else { return }
        if let scan, r.scan == true {
            guard let key = r.browser_key.flatMap({ Data(base64Encoded: $0) }), scan.holds(browserKey: key) else {
                phase = .failed(ConnectMatchCopy.rescan)
                return
            }
            scanned = (scan, key)
            return
        }
        await loadMatch(r)
    }

    /// Writes this device's nonce on the ask, then reads the ask about every second until the page
    /// reveals its nonce, and shows the number only if the reveal opens the page's commit and the
    /// ask still carries the key and commit it had when first read. While the number shows, the
    /// ask keeps being read: if it changes, the number goes and the request is declined.
    private func loadMatch(_ r: ConnectRequest) async {
        let read = { try await askMatch(client, r.id) }
        do {
            let outcome = try await ConnectMatch.follow(requestID: r.id, read: read, write: { try await writeNonce(client, r.id, $0) },
                                                        poll: pollInterval)
            switch outcome {
            case .number(let m):
                match = m
            case .otherDevice:
                phase = .failed(ConnectMatchCopy.otherDevice)
                return
            case .broken:
                // Whoever wrote this ask isn't the page that committed: no number, and no.
                await decide(r, allow: false, declined: ConnectMatchCopy.broken)
                return
            case .changed:
                await decide(r, allow: false, declined: ConnectMatchCopy.changedWhileAnswering)
                return
            case .expired:
                phase = .failed(ConnectMatchCopy.expired)
                return
            }
            guard let m = match else { return }
            let seen = try await ConnectMatch.watch(m, read: read, poll: pollInterval)
            // Answering already reads the ask again itself.
            guard case .asking = phase, match == m else { return }
            match = nil
            if seen == .changed {
                await decide(r, allow: false, declined: ConnectMatchCopy.changedWhileAnswering)
            } else {
                phase = .failed(ConnectMatchCopy.expired)
            }
        } catch is CancellationError {
            return
        } catch {
            guard case .asking = phase else { return }
            phase = .failed(error.localizedDescription)
        }
    }

    private func decide(_ r: ConnectRequest, allow: Bool, declined: String? = nil) async {
        // Handing over the key to your notes takes you, not just a click.
        if allow {
            guard armed, !byNumber(r) || match != nil else { return }
            guard canConfirm() else {
                phase = .failed("Turn on a passcode, Face ID or Touch ID on this device to connect an AI.")
                return
            }
            if !(await confirm(r.who)) { return }
        }
        phase = .working
        do {
            answering(r.id)
            // The connection gets its own copy of the account's key, wrapped under a code made here.
            // Asked from a browser: the code goes to that page, sealed to its key (checked against
            // the scanned code, or the key the number was made from), with the address it goes to.
            let answered = try await ConnectAPI.answer(r, allow: allow, write: write && r.wants_write,
                                                       match: r.isAsked ? match : nil, scanned: scanned,
                                                       read: { try await askMatch(client, r.id) },
                                                       code: { try AccountCrypto.shared.connectionCode() }, send: ConnectAPI.sender(client))
            serverAnswered = true
            guard case .answered(let answer) = answered else {
                match = nil
                phase = .failed(ConnectMatchCopy.changedWhileAnswering)
                return
            }
            // Only a request that came by link here is sent on from here.
            if let url = answer.url { finish(url) }
            if allow {
                allowed(r)
                phase = answer == .handedOff ? .handedOff(r.redirect_host) : .done(r.who)
                try? await Task.sleep(for: .seconds(answer == .handedOff ? 2.4 : 1.6))
            } else if let declined {
                phase = .failed(declined)
                return
            }
            dismiss()
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }
}


// MARK: Settings

struct Connection: Decodable, Identifiable {
    let id: UUID
    let name: String
    let kind: String?
    let can_write: Bool
    let created_at: Date
    let last_used_at: Date?
    let revoked_at: Date?
    let redirect_host: String?

    var isOAuth: Bool { kind == "oauth" }
    /// What the list calls it. A sign-in the app can't vouch for is named by where access went,
    /// never by the name the app gave itself (grants from before 2026-09-30 still carry that name).
    var title: String { Self.title(name: name, kind: kind, host: redirect_host) }

    static func title(name: String, kind: String?, host: String?) -> String {
        let named = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard kind == "oauth", let host, !host.isEmpty,
              ConnectTrust.verifiedAI(host: host, loopback: false) == nil else {
            return named.isEmpty ? (kind == "oauth" ? "An app" : "Access token") : named
        }
        return Self.isLoopback(host) ? "An app on this computer" : host
    }

    static func isLoopback(_ host: String) -> Bool { ["localhost", "127.0.0.1", "[::1]", "::1"].contains(host.lowercased()) }

    /// The AI whose mark the row shows: by where a sign-in's approval went, or for an access token,
    /// the guide that made it (Claude Code, Codex). Nil: a plain glyph (`symbol`).
    var mark: String? {
        if isOAuth { return ConnectTrust.verifiedAI(host: redirect_host ?? "", loopback: false) }
        return ["Claude Code", "Codex"].contains(name) ? name : nil
    }

    /// A glyph for a connection without a mark: a key for an access token, a computer for an app
    /// on this computer, a globe for anywhere else.
    var symbol: String {
        if !isOAuth { return "key.fill" }
        return Self.isLoopback(redirect_host ?? "") ? "desktopcomputer" : "globe"
    }
}

/// A connection's mark: the AI's, or a plain glyph in the same tile. Never a blank tile or text.
struct ConnectionTile: View {
    let connection: Connection
    var size: CGFloat = 26

    var body: some View {
        if let ai = connection.mark {
            AITile(ai: ai, size: size)
        } else {
            Image(systemName: connection.symbol)
                .font(.system(size: size * 0.46, weight: .medium))
                .foregroundStyle(.secondary)
                .frame(width: size, height: size)
                .background(.fill.tertiary, in: .rect(cornerRadius: size * 0.3, style: .continuous))
                .accessibilityHidden(true)
        }
    }
}

/// Settings → AI: Connect an AI, the one design (`ConnectChoices`), as a section of the form.
struct ConnectAISection: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil

    enum Guide: String, Identifiable, CaseIterable {
        case chatgpt, claude, claudeCode, codex, incredible, other
        var id: String { rawValue }
        /// The guide as the connect funnel names its AI.
        var funnel: ConnectAIKind {
            switch self {
            case .chatgpt: .chatgpt
            case .claude: .claude
            case .claudeCode: .claudeCode
            case .codex: .codex
            case .incredible: .incredible
            case .other: .other
            }
        }
        var title: String {
            switch self {
            case .chatgpt: "ChatGPT"
            case .claude: "Claude"
            case .claudeCode: "Claude Code"
            case .codex: "Codex"
            case .incredible: "Incredible"
            case .other: "Another AI"
            }
        }
        var subtitle: String {
            switch self {
            case .chatgpt: "Added once in ChatGPT on the web, then works in its apps"
            case .claude: "Added once in Claude on the web or desktop, then works in its apps"
            case .claudeCode: "Adds Pinto Notes to Claude Code on this Mac"
            case .codex: "Adds Pinto Notes to Codex"
            case .incredible: "Connected once in Incredible on your computer"
            case .other: "Any app that speaks MCP, with the address or an access token"
            }
        }
        /// The ways offered: Incredible only on a Mac where the Incredible app is (a newcomer has
        /// never heard of it; newcomer audit #17). Claude Code has no choice of its own: Claude's
        /// connector reaches it (code.claude.com/docs/en/mcp), and with only the command on the
        /// Mac, Claude is added to Claude Code directly (`ConnectRun`).
        static var offered: [Guide] { offered(incredibleInstalled: incredibleInstalled) }
        static func offered(incredibleInstalled: Bool) -> [Guide] {
            allCases.filter { $0 != .claudeCode && ($0 != .incredible || incredibleInstalled) }
        }
        private static var incredibleInstalled: Bool {
            #if os(macOS)
            IncredibleConnect.appURL != nil
            #else
            false
            #endif
        }

        /// What it is for, in a few plain words, so someone who doesn't code sees at once which is
        /// theirs. Never where it runs: Claude Code and Codex also live in the Claude and ChatGPT apps.
        var line: String {
            switch self {
            case .chatgpt: "Chat with ChatGPT"
            case .claude: "Chat with Claude, and Claude Code"
            case .claudeCode: "Claude for coding"
            case .codex: "ChatGPT for coding"
            case .incredible: "Connects from the Incredible app"
            case .other: "Any other app that can add a connector"
            }
        }
    }

    var body: some View {
        Section {
            VStack(alignment: .leading, spacing: 12) {
                Text(ConnectChoices.why)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                ConnectChoices(client: client, preview: preview)
            }
            .padding(.vertical, 4)
        } header: {
            Text(ConnectAISheet.title)
        }
    }
}

/// Which connect guide is open. The form around Connect an AI holds it and presents the guide, not
/// the section's rows: a form's rows come and go as it redraws and scrolls, and a sheet presented
/// from one closes with it (the Connect Claude sheet that opened and closed itself on the first tap).
@MainActor
@Observable
final class ConnectGuideRoute {
    /// Incredible's own guide (the only AI that still has one).
    var guide: ConnectAISection.Guide?
    /// Having trouble?
    var help: HelpTopic?
    /// Bumped each time a guide closes, so the Connected list loads again.
    private(set) var closed = 0
    /// The guide on screen, for the connect funnel.
    @ObservationIgnored private var shown: ConnectAISection.Guide?

    /// A guide opened (`guide` was set).
    func guideOpened(_ g: ConnectAISection.Guide) {
        shown = g
        ConnectFunnel.opened(g.funnel)
    }

    func guideClosed() {
        closed += 1
        if let g = shown { ConnectFunnel.closed(g.funnel) }
        shown = nil
    }
}

/// Presents the connect guides for the Connect an AI section inside this view.
struct ConnectGuides: ViewModifier {
    let client: SupabaseClient?
    @State private var route = ConnectGuideRoute()

    func body(content: Content) -> some View {
        content
            .environment(route)
            .onChange(of: route.guide) { _, g in if let g { route.guideOpened(g) } }
            .sheet(item: Binding(get: { client == nil ? nil : route.guide }, set: { route.guide = $0 }),
                   onDismiss: { route.guideClosed() }) { _ in
                if let client { IncredibleSheet(client: client) }
            }
            .sheet(item: Binding(get: { client == nil ? nil : route.help }, set: { route.help = $0 }),
                   onDismiss: { route.guideClosed() }) { topic in
                if let client { ConnectHelpSheet(topic: topic, client: client).consentHost(client: client) }
            }
    }
}

extension View {
    /// Put on the form that contains `ConnectAISection`.
    func connectGuides(client: SupabaseClient?) -> some View { modifier(ConnectGuides(client: client)) }
}

/// Incredible's guide, as a sheet: it connects from the Incredible app, not from a web page.
struct IncredibleSheet: View {
    let client: SupabaseClient
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form { IncredibleGuide(client: client) }
                .formStyle(.grouped)
                .navigationTitle("Connect Incredible")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .consentHost(client: client)
        #if os(macOS)
        .frame(width: 560, height: 560)
        #endif
    }
}


