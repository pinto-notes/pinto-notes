import Foundation
import Observation
import Supabase

/// "How did you hear about Pinto Notes?": one optional question, once per new account
/// (20261007152000_heard_from.sql). One tap answers, one tap skips, and either way it's never
/// asked again on any device. It never stands between a new person and their notes: it waits
/// for the third launch on this device and a note of their own, and stays away on a launch
/// that has shown an account notice (`HeardFromStore.refresh`).
enum HeardFrom {
    enum Source: String, CaseIterable, Sendable {
        case google
        case blog
        case aiAssistant = "ai_assistant"
        case tiktok
        case youtube
        case instagram
        case friend
        case productHuntHN = "product_hunt_hn"
        case github
        case other
        case skipped
    }

    /// The choices, in the order they're shown.
    static let choices: [Source] = [.google, .blog, .aiAssistant, .tiktok, .youtube, .instagram, .friend, .productHuntHN, .github, .other]

    static func title(_ source: Source) -> String {
        switch source {
        case .google: "Google search"
        case .blog: "A blog post"
        case .aiAssistant: "ChatGPT or Claude"
        case .tiktok: "TikTok"
        case .youtube: "YouTube"
        case .instagram: "Instagram"
        case .friend: "A friend"
        case .productHuntHN: "Product Hunt or Hacker News"
        case .github: "GitHub"
        case .other: "Something else"
        case .skipped: "Skip"
        }
    }

    /// The server keeps at most this many characters of "Something else".
    static let detailLimit = 120
}

protocol HeardFromService: Sendable {
    /// Whether the server says to ask this account now.
    func shouldAsk() async throws -> Bool
    func answer(_ source: HeardFrom.Source, detail: String?) async throws
}

struct SupabaseHeardFrom: HeardFromService {
    let client: SupabaseClient
    private struct State: Decodable { let ask: Bool }

    func shouldAsk() async throws -> Bool {
        let state: State = try await client.rpc("pane_heard_from_state").execute().value
        return state.ask
    }

    func answer(_ source: HeardFrom.Source, detail: String?) async throws {
        try await client.rpc("pane_heard_from_answer", params: ["source": source.rawValue, "detail": detail ?? ""]).execute()
    }
}

@MainActor
@Observable
final class HeardFromStore {
    /// The question is on screen.
    var visible = false
    /// The choice just tapped: its row shows a tick for a moment before the sheet goes.
    private(set) var chosen: HeardFrom.Source?

    /// The latest answer's send, so tests can wait for it rather than guess.
    @ObservationIgnored private(set) var sending: Task<Void, Never>?
    @ObservationIgnored private var service: HeardFromService?
    @ObservationIgnored private var account: UUID?
    @ObservationIgnored let defaults: UserDefaults
    @ObservationIgnored let forced: Bool
    /// This launch has been counted for the account attached now.
    @ObservationIgnored private var counted: UUID?

    /// The question waits for this launch of the app on this device (signing up is the first).
    static let firstLaunch = 3

    init(defaults: UserDefaults = .standard, arguments: [String] = ProcessInfo.processInfo.arguments) {
        self.defaults = defaults
        forced = arguments.contains("-forceHeardFrom")
    }

    /// An answer given on this device: kept until the server has it, so an answer given offline
    /// still arrives, and this device never asks again meanwhile.
    private var answerKey: String { "heardFrom.\(account?.uuidString.lowercased() ?? "device")" }

    func attach(account: UUID?, service: HeardFromService?) {
        self.account = account
        self.service = service
        if service == nil { visible = forced && visible }
        // One launch per run of the app, however often the session is set up again.
        if let account, service != nil, counted != account {
            counted = account
            defaults.set(launches + 1, forKey: launchesKey)
        }
    }

    private var launchesKey: String { "heardFrom.launches.\(account?.uuidString.lowercased() ?? "device")" }
    /// How many runs of the app this account has had on this device, this one included.
    var launches: Int { defaults.integer(forKey: launchesKey) }

    /// Sends an answer this device couldn't send yet, then asks the server whether to ask.
    /// The question itself waits: not before the third launch, not before the person has a
    /// note, and not on a launch that has shown an account notice.
    func refresh(hasNote: Bool, noticeThisLaunch: Bool) async {
        guard let service, !forced else { return }
        if let saved = defaults.dictionary(forKey: answerKey) as? [String: String] {
            guard saved["sent"] == nil, let source = saved["source"].flatMap(HeardFrom.Source.init(rawValue:)) else { return }
            if (try? await service.answer(source, detail: saved["detail"])) != nil {
                defaults.set(["source": source.rawValue, "sent": "1"], forKey: answerKey)
            }
            return
        }
        guard launches >= Self.firstLaunch, hasNote, !noticeThisLaunch else { return }
        if (try? await service.shouldAsk()) == true, !visible {
            chosen = nil
            visible = true
        }
    }

    /// Dev and captures: `-forceHeardFrom`.
    func showIfForced() {
        if forced, !visible {
            chosen = nil
            visible = true
        }
    }

    /// One tap: the answer is kept and the sheet goes after its tick has shown.
    func answer(_ source: HeardFrom.Source, detail: String? = nil) {
        guard chosen == nil else { return }
        let words = detail?.trimmingCharacters(in: .whitespacesAndNewlines)
        let kept = source == .other && !(words ?? "").isEmpty ? String(words!.prefix(HeardFrom.detailLimit)) : nil
        chosen = source
        if !forced {
            var saved = ["source": source.rawValue]
            if let kept { saved["detail"] = kept }
            defaults.set(saved, forKey: answerKey)
            if let service {
                let key = answerKey
                sending = Task {
                    if (try? await service.answer(source, detail: kept)) != nil {
                        defaults.set(["source": source.rawValue, "sent": "1"], forKey: key)
                    }
                }
            }
        }
    }

    /// Skip, or the sheet swiped away without an answer: never asked again either.
    func skip() {
        answer(.skipped)
        visible = false
    }

    /// The sheet went.
    func closed() {
        if chosen == nil { answer(.skipped) }
        visible = false
    }

    /// Whether this device already has an answer waiting or sent (the store never asks then).
    var answeredHere: Bool { defaults.dictionary(forKey: answerKey) != nil }
}
