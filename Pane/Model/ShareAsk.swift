import Foundation
import Observation
import Supabase
import SwiftUI
import TipKit

/// "Enjoying Pinto Notes?": one ask to share the app, at a launch, once it has really been used.
///
/// The rules (2026-10-12; before, it came at any quiet moment once this device had 7 days of use,
/// counted per device rather than per account, so a new account on a well-used Mac was asked
/// within the hour):
/// - only at app launch, before the person does anything: once per launch, within the first two
///   minutes, and never once a key has been typed. Never at a moment in the middle of a session;
/// - only for an account that has been used: notes opened on at least 3 different days (the
///   account's days, on all its devices, `pane_active_days`) and made at least 7 days ago;
/// - never during the first-run flow or the day after it, and never on a launch that shows any
///   other prompt (How did you hear, an account notice, a tip);
/// - once per account: an answer is kept on the server (`pane_share_ask`). Not now waits at least
///   30 days, then it may come once more at a launch; after that never. Sharing is final.
///
/// Dev: `-forceShareAsk` shows it a second after launch, whatever the rules say, and sends
/// nothing to the server; `-forceShareAsk thanks` opens straight on the thank-you.
enum ShareAsk {
    /// Different days with notes opened or edited, on the account's devices.
    static let activeDays = 3
    /// How old the account has to be.
    static let accountAge: TimeInterval = 7 * 86_400
    /// How long after launch it may still come (a slow server answering late).
    static let launchWindow: TimeInterval = 120
    /// How long Not now holds before the one more ask.
    static let againAfter: TimeInterval = 30 * 86_400
    /// How many times an account is ever asked.
    static let maxAsks = 2

    static let site = "https://pintonotes.com"
    static let postText = "I\u{2019}ve been using Pinto Notes: a simple notes app for iPhone and Mac that ChatGPT and Claude can actually read and edit. Free."

    enum Choice: String, Sendable { case sharedX = "shared_x", sharedLinkedIn = "shared_linkedin", starredGitHub = "starred_github", dismissed }

    /// Amber Notes on GitHub: the repository, a new issue, and how to contribute.
    static let repository = URL(string: "https://github.com/pinto-notes/pinto-notes")!
    static let newIssue = URL(string: "https://github.com/pinto-notes/pinto-notes/issues/new/choose")!
    static let contributing = URL(string: "https://github.com/pinto-notes/pinto-notes/blob/main/CONTRIBUTING.md")!

    /// What the ask says, and its sharing buttons in order (Not now always follows). Developers
    /// (accounts that ever connected a tool on their computer or with a token: Claude Code,
    /// Codex, Gemini CLI, Incredible) hear that it's open source; everyone else, as before.
    struct Content: Equatable {
        var title: String
        var line: String
        var choices: [Choice]
    }

    static func content(developer: Bool) -> Content {
        developer
            ? Content(title: "Enjoying Pinto Notes?", line: "It\u{2019}s open source.", choices: [.starredGitHub, .sharedX])
            : Content(title: "Enjoying Pinto Notes?",
                      line: "I\u{2019}m building it on my own, and word of mouth is how people find it. If it\u{2019}s been useful, a post would mean a lot.",
                      choices: [.sharedX, .sharedLinkedIn])
    }

    static func buttonTitle(_ choice: Choice) -> String {
        switch choice {
        case .sharedX: "Share on X"
        case .sharedLinkedIn: "Share on LinkedIn"
        case .starredGitHub: "Star on GitHub"
        case .dismissed: "Not now"
        }
    }

    /// The thank-you's second line, for what you did.
    static func thanks(for choice: Choice?) -> String {
        choice == .starredGitHub ? "Every star helps someone find it." : "Every post helps someone find it."
    }

    static var xURL: URL {
        URL(string: "https://x.com/intent/post?text=\(encode(postText))&url=\(encode(site))")!
    }

    static var linkedInURL: URL {
        URL(string: "https://www.linkedin.com/sharing/share-offsite/?url=\(encode(site))")!
    }

    static func url(for choice: Choice) -> URL? {
        switch choice {
        case .sharedX: xURL
        case .sharedLinkedIn: linkedInURL
        case .starredGitHub: repository
        case .dismissed: nil
        }
    }

    /// Percent-encodes everything but unreserved characters, as a query value needs.
    static func encode(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")) ?? s
    }

    /// Whether the account is due an ask, leaving out the moment. `state` is nil until the server
    /// has said (never asked then); `local` is an answer this device gave and when.
    static func isDue(state: ShareAskState?, localDays: Int, created: Date?, local: (choice: Choice, at: Date)?, now: Date = .now) -> Bool {
        guard let state, let created, now.timeIntervalSince(created) >= accountAge else { return false }
        guard max(state.days, localDays) >= activeDays else { return false }
        // The latest answer: the server's, or this device's when the server doesn't have it yet.
        var choice = state.choice.flatMap(Choice.init(rawValue:))
        var at = state.decidedAt
        var asked = state.asked
        if let local, local.at > (at ?? .distantPast).addingTimeInterval(1) {
            choice = local.choice
            at = local.at
            asked += 1
        }
        // A server from before Not now could wait: an answer there is final.
        if state.decided, state.choice == nil { return false }
        guard let choice else { return true }
        guard choice == .dismissed, asked < maxAsks, let at else { return false }
        return now.timeIntervalSince(at) >= againAfter
    }

    // MARK: Days of use

    static let sentKey = "shareAskDaysSent"
    /// This device's days of use for the account signed in (`account`): never another's.
    static func daysKey(_ account: UUID?) -> String { "shareAskDays.\(account?.uuidString.lowercased() ?? "device")" }
    /// The account signed in, whose days `noteUsed` counts.
    @MainActor static var account: UUID?
    /// The day last noted, and where: a fast path for every keystroke. Held weakly, so a new
    /// UserDefaults at a freed one's address (tests) is never mistaken for it.
    @MainActor private static var lastStamp: String?
    @MainActor private static weak var lastDefaults: UserDefaults?
    @MainActor static var lastKeystroke: Date = .distantPast
    /// A new day of use was noted on this device (the store sends it to the server).
    @MainActor static var onNewDay: () -> Void = {}

    /// A note was opened or edited: today counts as a day of use. Cheap enough for every keystroke.
    @MainActor static func noteUsed(typing: Bool = false, now: Date = .now, defaults: UserDefaults = .standard,
                                    calendar: Calendar = .current) {
        if typing { lastKeystroke = now }
        let today = day(now, calendar: calendar)
        let key = daysKey(account)
        guard lastStamp != key + today || lastDefaults !== defaults else { return }
        lastStamp = key + today
        lastDefaults = defaults
        var days = defaults.stringArray(forKey: key) ?? []
        guard !days.contains(today) else { return }
        days.append(today)
        // Only whether there are 3 matters; a few more keep it honest across clock changes.
        defaults.set(Array(days.suffix(30)), forKey: key)
        onNewDay()
    }

    /// This device's days of use, as the server takes them: "2026-09-30", in your own time zone.
    @MainActor static func localDays(defaults: UserDefaults = .standard) -> [String] {
        defaults.stringArray(forKey: daysKey(account)) ?? []
    }

    static func day(_ d: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}

/// What the server knows about the ask for this account.
struct ShareAskState: Equatable, Decodable, Sendable {
    var decided: Bool
    /// Different days notes were used, on all the account's devices.
    var days: Int
    /// The account ever connected a developer tool (20261001120000_open_source_ask.sql). Servers
    /// from before it don't say: then it's the ask everyone gets.
    var developer: Bool = false
    /// The latest answer, when, and how many times the account answered
    /// (20261012140000_share_ask_once_more.sql). Servers from before it don't say.
    var choice: String?
    var decidedAt: Date?
    var asked = 0

    init(decided: Bool, days: Int, developer: Bool = false, choice: String? = nil, decidedAt: Date? = nil, asked: Int = 0) {
        self.decided = decided
        self.days = days
        self.developer = developer
        self.choice = choice
        self.decidedAt = decidedAt
        self.asked = asked
    }

    private enum CodingKeys: String, CodingKey { case decided, days, developer, choice, asked, decidedAt = "decided_at" }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        decided = try c.decode(Bool.self, forKey: .decided)
        days = try c.decode(Int.self, forKey: .days)
        developer = try c.decodeIfPresent(Bool.self, forKey: .developer) ?? false
        choice = try c.decodeIfPresent(String.self, forKey: .choice)
        asked = try c.decodeIfPresent(Int.self, forKey: .asked) ?? 0
        decidedAt = (try c.decodeIfPresent(String.self, forKey: .decidedAt)).flatMap(Self.date)
    }

    /// Postgres's timestamptz in JSON: "2026-10-12T09:41:00.123456+00:00".
    static func date(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }
}

/// Where the account's answer is kept, and where the ask is counted (the server; tests swap it).
protocol ShareAskService: Sendable {
    func state() async throws -> ShareAskState
    /// Days of use from this device ("yyyy-MM-dd"); days already known change nothing.
    func addDays(_ days: [String]) async throws
    func decide(_ choice: ShareAsk.Choice) async throws
    func count(_ event: String) async
}

struct SupabaseShareAsk: ShareAskService {
    let client: SupabaseClient
    func state() async throws -> ShareAskState {
        try await client.rpc("pane_share_ask_state").execute().value
    }
    func addDays(_ days: [String]) async throws {
        try await client.rpc("pane_active_days_add", params: ["days": days]).execute()
    }
    func decide(_ choice: ShareAsk.Choice) async throws {
        try await client.rpc("pane_share_ask_decide", params: ["choice": choice.rawValue]).execute()
    }
    func count(_ event: String) async {
        _ = try? await client.rpc("pane_tip_event", params: ["tip": "shareAsk", "event": event]).execute()
    }
}

@MainActor
@Observable
final class ShareAskStore {
    /// The ask is on screen (the thank-you included).
    var visible = false
    /// You chose to share (or star): the thank-you shows.
    private(set) var thanked = false
    /// What you chose, for the thank-you's words.
    private(set) var thankedFor: ShareAsk.Choice?
    /// The developers' ask (see `ShareAsk.content`), once the server has said.
    private(set) var developer = false

    @ObservationIgnored private var service: ShareAskService?
    @ObservationIgnored private var account: UUID?
    /// When the account was made.
    @ObservationIgnored private var created: Date?
    /// What the server says, once it has.
    @ObservationIgnored private(set) var server: ShareAskState?
    /// This showing was answered (closing the sheet after an answer is no second answer).
    @ObservationIgnored private var answered = false
    /// This launch has had its one chance.
    @ObservationIgnored private(set) var launchChecked = false
    @ObservationIgnored let defaults: UserDefaults
    @ObservationIgnored let launched: Date
    @ObservationIgnored let forced: Bool

    init(defaults: UserDefaults = .standard, launched: Date = .now, arguments: [String] = ProcessInfo.processInfo.arguments) {
        self.defaults = defaults
        self.launched = launched
        forced = arguments.contains("-forceShareAsk")
        if forced, let i = arguments.firstIndex(of: "-forceShareAsk"), arguments.indices.contains(i + 1), arguments[i + 1] == "thanks" {
            thanked = true
        }
        // Captures of the developers' ask.
        if forced, arguments.contains("-shareAskDeveloper") {
            developer = true
            if thanked { thankedFor = .starredGitHub }
        }
        attach(account: nil, service: nil, created: nil)
    }

    private var decidedKey: String { "shareAskDecided.\(account?.uuidString.lowercased() ?? "device")" }
    private var decidedAtKey: String { "shareAskDecidedAt.\(account?.uuidString.lowercased() ?? "device")" }

    /// This device's latest answer for the account, and when.
    var localAnswer: (choice: ShareAsk.Choice, at: Date)? {
        guard let choice = defaults.string(forKey: decidedKey).flatMap(ShareAsk.Choice.init) else { return nil }
        // An answer from before answers had a date: it was final then, and stays so.
        let at = defaults.object(forKey: decidedAtKey) as? Date ?? .distantPast
        return (choice, at)
    }

    /// The account (or none) the ask is for, and when it was made. It waits for `refresh` to know more.
    func attach(account: UUID?, service: ShareAskService?, created: Date? = nil) {
        if account != self.account { launchChecked = false }
        self.account = account
        self.service = service
        self.created = created
        ShareAsk.account = account
        server = nil
        if service != nil { ShareAsk.onNewDay = { [weak self] in Task { await self?.refresh() } } }
    }

    @ObservationIgnored private var refreshing: Task<Void, Never>?
    @ObservationIgnored private var refreshAgain = false

    /// Tells the server this device's days of use it hasn't had yet, and an answer this device
    /// gave while it couldn't reach it; then asks what the account adds up to. One at a time: a
    /// new day of use starts one (onNewDay) while the app may be refreshing already, and two at
    /// once would send the same days twice and could let an older answer overwrite a newer one.
    /// A refresh asked for meanwhile runs once more after the current one, and the caller waits
    /// for that.
    func refresh() async {
        guard service != nil else { return }
        if let running = refreshing {
            refreshAgain = true
            await running.value
            return
        }
        let run = Task { [weak self] in
            guard let self else { return }
            repeat {
                self.refreshAgain = false
                await self.refreshOnce()
            } while self.refreshAgain
        }
        refreshing = run
        await run.value
        refreshing = nil
    }

    private func refreshOnce() async {
        guard let service else { return }
        let sentKey = ShareAsk.sentKey + "." + (account?.uuidString.lowercased() ?? "device")
        let sent = Set(defaults.stringArray(forKey: sentKey) ?? [])
        let local = ShareAsk.localDays(defaults: defaults)
        let unsent = local.filter { !sent.contains($0) }
        if !unsent.isEmpty, (try? await service.addDays(unsent)) != nil {
            defaults.set(Array((sent.union(unsent)).sorted().suffix(30)), forKey: sentKey)
        }
        guard var there = try? await service.state() else { return }
        // An answer given here that the server doesn't have yet.
        let unsentAnswer: Bool = {
            guard let here = localAnswer else { return false }
            // From before answers had a date: send it only if the server has none.
            if here.at == .distantPast { return !there.decided }
            return here.at > (there.decidedAt ?? .distantPast).addingTimeInterval(1)
        }()
        if unsentAnswer, let here = localAnswer {
            try? await service.decide(here.choice)
            there = (try? await service.state()) ?? there
        }
        server = there
        developer = there.developer
    }

    /// Whether the rules allow asking, leaving out the moment.
    func isDue(now: Date = .now) -> Bool {
        ShareAsk.isDue(state: server, localDays: ShareAsk.localDays(defaults: defaults).count, created: created, local: localAnswer, now: now)
    }

    /// The launch's one chance, once the account's state is known: it asks if the account is due,
    /// nothing else asks or shows on this launch, and the person hasn't started doing anything.
    func atLaunch(otherPrompt: Bool, now: Date = .now) {
        guard !forced, !visible, !launchChecked, server != nil else { return }
        launchChecked = true
        guard !otherPrompt, now.timeIntervalSince(launched) <= ShareAsk.launchWindow,
              ShareAsk.lastKeystroke < launched, isDue(now: now) else { return }
        show()
    }

    /// Dev: `-forceShareAsk`.
    func showIfForced() {
        if forced, !visible { show() }
    }

    private func show() {
        answered = false
        visible = true
        PaneTips.shareAskVisible = true
        count("shown")
    }

    /// Your answer, for good. Sharing returns the page to open and shows the thank-you.
    @discardableResult
    func choose(_ choice: ShareAsk.Choice) -> URL? {
        if !forced {
            defaults.set(choice.rawValue, forKey: decidedKey)
            defaults.set(Date.now, forKey: decidedAtKey)
            answered = true
            count(choice.rawValue)
            if let service { Task { try? await service.decide(choice) } }
        }
        guard let url = ShareAsk.url(for: choice) else {
            close()
            return nil
        }
        thankedFor = choice
        withAnimation(.smooth(duration: 0.35)) { thanked = true }
        return url
    }

    /// The sheet went: swiping it away before answering counts as Not now.
    func closed() {
        if !thanked && !forced && !answered { choose(.dismissed) }
        close()
    }

    private func close() {
        visible = false
        PaneTips.shareAskVisible = false
    }

    /// Once per event per install, like the tips.
    private func count(_ event: String) {
        guard !forced else { return }
        let key = "tipLog.shareAsk.\(event)"
        guard !defaults.bool(forKey: key) else { return }
        defaults.set(true, forKey: key)
        sent.append(event)
        if let service { Task { await service.count(event) } }
    }

    /// Tests read what would have been counted.
    @ObservationIgnored private(set) var sent: [String] = []
}

extension Notification.Name {
    /// A note closed (you went back to the list, or opened another): a quiet moment.
    static let paneNoteClosed = Notification.Name("pane.noteClosed")
}
