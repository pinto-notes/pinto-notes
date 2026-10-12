import Foundation
import Testing
@testable import Pane

/// "Enjoying Pinto Notes?": only at a launch, only for an account that has really been used,
/// never beside another prompt, and Not now waits 30 days for its one more ask.
@MainActor @Suite(.serialized) struct ShareAskTests {
    static let day: TimeInterval = 86400
    /// Days are counted in the device's calendar; tests pin one so they read the same in any zone.
    static let cal: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()
    /// 21 Sep 2026, 14:13 UTC: mid-afternoon, far from midnight.
    static let t0 = Date(timeIntervalSince1970: 1_790_000_000)
    /// The account was made then; it is two weeks old at `launch`.
    static let made = t0
    static let launch = t0.addingTimeInterval(14 * day)

    static func defaults() -> UserDefaults { TestDefaults() }

    /// Notes used on `n` different days for `account`, every other day from t0.
    static func usedOn(_ n: Int, _ d: UserDefaults, account: UUID) {
        ShareAsk.account = account
        for i in 0..<n { ShareAsk.noteUsed(now: t0.addingTimeInterval(Double(i) * 2 * day), defaults: d, calendar: Self.cal) }
    }

    /// The server: one account's answer, when, how often, and its days of use from every device.
    /// It answers as pane_share_ask_decide does: the first answer, or after Not now, one more
    /// after 30 days. Its methods run off the main actor (like a real network call), so its state
    /// is locked.
    final class FakeService: ShareAskService, @unchecked Sendable {
        private let lock = NSLock()
        private var _answered: ShareAsk.Choice?
        private var _at: Date?
        private var _asked = 0
        private var _days: Set<String> = []
        private var _counted: [String] = []
        var fails = false
        /// The account ever connected a developer tool.
        var developer = false
        /// The server's clock.
        var now: Date = Date(timeIntervalSince1970: 1_790_000_000 + 14 * 86400)
        /// A server from before answers had a date: it says only whether there is one.
        var old = false

        var answered: ShareAsk.Choice? { get { lock.withLock { _answered } } set { lock.withLock { _answered = newValue; _at = now; _asked = newValue == nil ? 0 : 1 } } }
        var asked: Int { lock.withLock { _asked } }
        var days: Set<String> { get { lock.withLock { _days } } set { lock.withLock { _days = newValue } } }
        var counted: [String] { lock.withLock { _counted } }

        func setAnswered(_ choice: ShareAsk.Choice, at: Date, asked: Int = 1) { lock.withLock { _answered = choice; _at = at; _asked = asked } }

        func state() async throws -> ShareAskState {
            if fails { throw URLError(.notConnectedToInternet) }
            return lock.withLock {
                old ? ShareAskState(decided: _answered != nil, days: _days.count, developer: developer)
                    : ShareAskState(decided: _answered != nil, days: _days.count, developer: developer, choice: _answered?.rawValue, decidedAt: _at, asked: _asked)
            }
        }
        func addDays(_ new: [String]) async throws {
            if fails { throw URLError(.notConnectedToInternet) }
            lock.withLock { _days.formUnion(new) }
        }
        func decide(_ choice: ShareAsk.Choice) async throws {
            if fails { throw URLError(.notConnectedToInternet) }
            lock.withLock {
                if _answered == nil { _answered = choice; _at = now; _asked = 1 }
                else if _answered == .dismissed, _asked < 2, let at = _at, now.timeIntervalSince(at) >= 30 * 86400 { _answered = choice; _at = now; _asked += 1 }
            }
        }
        func count(_ event: String) async { lock.withLock { _counted.append(event) } }
    }

    /// A store for an account made at `made`, launched at `launched`, its notes used on `days`
    /// days, with the server answering from `service`, refreshed.
    static func store(days: Int = 3, made: Date = Self.made, launched: Date = Self.launch, service: FakeService = FakeService(),
                      account: UUID = UUID(), defaults d: UserDefaults = TestDefaults()) async -> ShareAskStore {
        usedOn(days, d, account: account)
        let s = ShareAskStore(defaults: d, launched: launched, arguments: [])
        s.attach(account: account, service: service, created: made)
        await s.refresh()
        return s
    }

    init() {
        ShareAsk.lastKeystroke = .distantPast
        ShareAsk.onNewDay = {}
    }

    // MARK: Only at a launch

    @Test func itAsksAtALaunchOnceTheAccountIsDue() async {
        let s = await Self.store()
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(4))
        #expect(s.visible)
        #expect(s.sent == ["shown"])
        #expect(PaneTips.shareAskVisible, "tips wait while it shows")
        s.closed()
    }

    @Test func oneChancePerLaunchNeverMidSession() async {
        let s = await Self.store()
        // The first check of this launch found something else on screen: no ask this launch,
        // however long the session goes on.
        s.atLaunch(otherPrompt: true, now: Self.launch.addingTimeInterval(4))
        #expect(!s.visible)
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(600))
        #expect(!s.visible, "never later in the session")
        #expect(s.launchChecked)
    }

    @Test func notOnceThePersonHasStartedTyping() async {
        let s = await Self.store()
        ShareAsk.lastKeystroke = Self.launch.addingTimeInterval(2)
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(5))
        #expect(!s.visible, "never over a note being typed in")
    }

    @Test func notWhenTheServerAnswersLate() async {
        let s = await Self.store()
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(ShareAsk.launchWindow + 1))
        #expect(!s.visible, "only near the start of a launch")
    }

    @Test func notBeforeTheServerHasSaid() async {
        let service = FakeService()
        service.fails = true
        let s = await Self.store(service: service)
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(4))
        #expect(!s.visible)
        #expect(!s.launchChecked, "the launch's chance waits for the server")
    }

    // MARK: Only once the account has been used

    @Test func threeDaysOfUseOnTheAccountsDevices() async {
        #expect(!(await Self.store(days: 2)).isDue(now: Self.launch))
        #expect((await Self.store(days: 3)).isDue(now: Self.launch))
        // Two days on the Mac and one on the iPhone, for one account.
        let account = UUID()
        let server = FakeService()
        let mac = await Self.store(days: 2, service: server, account: account)
        #expect(!mac.isDue(now: Self.launch))
        let phone = TestDefaults()
        ShareAsk.account = account
        ShareAsk.noteUsed(now: Self.t0.addingTimeInterval(9 * Self.day), defaults: phone, calendar: Self.cal)
        let onPhone = ShareAskStore(defaults: phone, launched: Self.launch, arguments: [])
        onPhone.attach(account: account, service: server, created: Self.made)
        await onPhone.refresh()
        #expect(onPhone.isDue(now: Self.launch))
    }

    @Test func atLeastAWeekSinceTheAccountWasMade() async {
        let made = Self.launch.addingTimeInterval(-6 * Self.day)
        #expect(!(await Self.store(days: 5, made: made)).isDue(now: Self.launch), "six days old")
        #expect((await Self.store(days: 5, made: made)).isDue(now: Self.launch.addingTimeInterval(Self.day)))
        let unknown = ShareAskStore(defaults: TestDefaults(), launched: Self.launch, arguments: [])
        unknown.attach(account: UUID(), service: FakeService(), created: nil)
        await unknown.refresh()
        #expect(!unknown.isDue(now: Self.launch), "nothing without knowing when the account was made")
    }

    /// What happened on 2026-10-11: the days were this device's, kept for every account on it,
    /// so a new account on a well-used Mac was asked within the hour.
    @Test func anotherAccountsDaysOnThisDeviceNeverCount() async {
        let d = TestDefaults()
        Self.usedOn(20, d, account: UUID())
        let fresh = UUID()
        ShareAsk.account = fresh
        #expect(ShareAsk.localDays(defaults: d).isEmpty)
        let s = await Self.store(days: 0, made: Self.launch.addingTimeInterval(-3600), account: fresh, defaults: d)
        #expect(!s.isDue(now: Self.launch))
    }

    @Test func daysOfUseAreDifferentCalendarDays() {
        let d = Self.defaults()
        ShareAsk.account = UUID()
        for minute in 0..<5 { ShareAsk.noteUsed(typing: true, now: Self.t0.addingTimeInterval(Double(minute) * 60), defaults: d, calendar: Self.cal) }
        #expect(ShareAsk.localDays(defaults: d).count == 1, "typing all afternoon is one day")
        ShareAsk.noteUsed(now: Self.t0.addingTimeInterval(Self.day), defaults: d, calendar: Self.cal)
        ShareAsk.noteUsed(now: Self.t0, defaults: d, calendar: Self.cal)
        #expect(ShareAsk.localDays(defaults: d) == ["2026-09-21", "2026-09-22"], "sent as yyyy-MM-dd")
    }

    @Test func aDayIsTheDevicesOwnCalendarDay() {
        var stockholm = Calendar(identifier: .gregorian)
        stockholm.timeZone = TimeZone(identifier: "Europe/Stockholm")!
        let late = stockholm.date(from: DateComponents(year: 2026, month: 9, day: 29, hour: 23, minute: 30))!
        let early = late.addingTimeInterval(3600)
        let d = Self.defaults()
        ShareAsk.account = UUID()
        ShareAsk.noteUsed(now: late, defaults: d, calendar: stockholm)
        ShareAsk.noteUsed(now: early, defaults: d, calendar: stockholm)
        #expect(ShareAsk.localDays(defaults: d) == ["2026-09-29", "2026-09-30"])
    }

    @Test func daysAreSentOnceAndOfflineDaysLater() async {
        let server = FakeService()
        server.fails = true
        let account = UUID()
        let d = TestDefaults()
        _ = await Self.store(days: 3, service: server, account: account, defaults: d)
        #expect(server.days.isEmpty)
        server.fails = false
        let s = ShareAskStore(defaults: d, launched: Self.launch, arguments: [])
        s.attach(account: account, service: server, created: Self.made)
        await s.refresh()
        #expect(server.days.count == 3)
    }

    // MARK: Never beside anything else

    @Test func neverBesideAnotherPrompt() async {
        let s = await Self.store()
        // The first-run flow (and the day after it), How did you hear, a notice, a tip: any of
        // them on screen or shown this launch.
        s.atLaunch(otherPrompt: true, now: Self.launch.addingTimeInterval(3))
        #expect(!s.visible)
    }

    // MARK: Once, and Not now once more after 30 days

    @Test func sharingIsFinal() async {
        for choice in [ShareAsk.Choice.sharedX, .sharedLinkedIn, .starredGitHub] {
            let service = FakeService()
            service.developer = choice == .starredGitHub
            let account = UUID()
            let d = TestDefaults()
            let s = await Self.store(service: service, account: account, defaults: d)
            s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(3))
            #expect(s.choose(choice) != nil)
            s.closed()
            for _ in 0 ..< 200 where service.answered != choice { try? await Task.sleep(for: .milliseconds(10)) }
            #expect(service.answered == choice)
            // A launch months later.
            service.now = Self.launch.addingTimeInterval(120 * Self.day)
            let later = ShareAskStore(defaults: d, launched: service.now, arguments: [])
            later.attach(account: account, service: service, created: Self.made)
            await later.refresh()
            later.atLaunch(otherPrompt: false, now: service.now.addingTimeInterval(3))
            #expect(!later.visible, "\(choice): never again")
        }
    }

    @Test func notNowWaitsThirtyDaysThenAsksOnceMore() async {
        let service = FakeService()
        let account = UUID()
        let d = TestDefaults()
        let s = await Self.store(service: service, account: account, defaults: d)
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(3))
        #expect(s.visible)
        s.choose(.dismissed)
        #expect(!s.visible, "Not now closes it")
        for _ in 0 ..< 200 where service.answered != .dismissed { try? await Task.sleep(for: .milliseconds(10)) }
        service.setAnswered(.dismissed, at: Self.launch)
        // A launch 29 days on: not yet.
        func launch(after days: Double) async -> ShareAskStore {
            service.now = Self.launch.addingTimeInterval(days * Self.day)
            d.set(Self.launch, forKey: "shareAskDecidedAt.\(account.uuidString.lowercased())")
            let next = ShareAskStore(defaults: d, launched: service.now, arguments: [])
            next.attach(account: account, service: service, created: Self.made)
            await next.refresh()
            next.atLaunch(otherPrompt: false, now: service.now.addingTimeInterval(3))
            return next
        }
        #expect(!(await launch(after: 29)).visible)
        let second = await launch(after: 31)
        #expect(second.visible, "once more, at a launch")
        second.choose(.dismissed)
        for _ in 0 ..< 200 where service.asked < 2 { try? await Task.sleep(for: .milliseconds(10)) }
        #expect(service.asked == 2)
        // Then never.
        service.now = Self.launch.addingTimeInterval(200 * Self.day)
        let last = ShareAskStore(defaults: d, launched: service.now, arguments: [])
        last.attach(account: account, service: service, created: Self.made)
        await last.refresh()
        last.atLaunch(otherPrompt: false, now: service.now.addingTimeInterval(3))
        #expect(!last.visible, "after a second answer, never")
    }

    @Test func swipingItAwayCountsAsNotNowOnce() async {
        let s = await Self.store()
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(3))
        s.closed()
        #expect(s.sent == ["shown", "dismissed"])
        #expect(s.localAnswer?.choice == .dismissed)
    }

    @Test func answeredOnAnotherDeviceMeansNotHere() async {
        let service = FakeService()
        service.setAnswered(.sharedLinkedIn, at: Self.t0)
        let s = await Self.store(service: service)
        s.atLaunch(otherPrompt: false, now: Self.launch.addingTimeInterval(3))
        #expect(!s.visible)
    }

    @Test func aServerFromBeforeNotNowCouldWaitTreatsAnyAnswerAsFinal() async {
        let service = FakeService()
        service.setAnswered(.dismissed, at: Self.t0)
        service.old = true
        let s = await Self.store(service: service)
        #expect(!s.isDue(now: Self.launch.addingTimeInterval(400 * Self.day)))
    }

    @Test func anAnswerGivenOfflineReachesTheServerLater() async {
        let account = UUID()
        let d = TestDefaults()
        let offline = FakeService()
        offline.fails = true
        let s = ShareAskStore(defaults: d, launched: Self.launch, arguments: [])
        s.attach(account: account, service: offline, created: Self.made)
        s.choose(.sharedX)
        let online = FakeService()
        let next = ShareAskStore(defaults: d, launched: Self.launch, arguments: [])
        next.attach(account: account, service: online, created: Self.made)
        await next.refresh()
        #expect(online.answered == .sharedX)
    }

    @Test func theServersAnswerReads() throws {
        let json = #"{"decided":true,"days":4,"developer":false,"choice":"dismissed","decided_at":"2026-10-12T09:41:00.123456+00:00","asked":1}"#
        let st = try JSONDecoder().decode(ShareAskState.self, from: Data(json.utf8))
        #expect(st.choice == "dismissed" && st.asked == 1 && st.decidedAt != nil)
        let old = try JSONDecoder().decode(ShareAskState.self, from: Data(#"{"decided":false,"days":3}"#.utf8))
        #expect(old == ShareAskState(decided: false, days: 3, developer: false))
    }

    // MARK: Who it's for

    @Test func developersHearItsOpenSource() async {
        let service = FakeService()
        service.developer = true
        let s = await Self.store(service: service)
        #expect(s.developer)
        let content = ShareAsk.content(developer: s.developer)
        #expect(content.line == "It\u{2019}s open source.")
        #expect(content.choices.map(ShareAsk.buttonTitle) == ["Star on GitHub", "Share on X"])
        #expect(ShareAsk.buttonTitle(.dismissed) == "Not now")
    }

    @Test func everyoneElseGetsTodaysAsk() {
        let content = ShareAsk.content(developer: false)
        #expect(content.title == "Enjoying Pinto Notes?")
        #expect(content.choices.map(ShareAsk.buttonTitle) == ["Share on X", "Share on LinkedIn"])
    }

    @Test func devForceShowsItAndSendsNothing() {
        let s = ShareAskStore(defaults: TestDefaults(), launched: .now, arguments: ["-forceShareAsk"])
        s.attach(account: UUID(), service: FakeService(), created: Self.made)
        s.atLaunch(otherPrompt: false)
        #expect(!s.visible, "only the Dev trigger shows it")
        s.showIfForced()
        #expect(s.visible)
        s.choose(.sharedX)
        #expect(s.sent.isEmpty)
        s.closed()
    }

    @Test func theLinksCarryThePost() throws {
        let x = ShareAsk.xURL.absoluteString
        #expect(x.hasPrefix("https://x.com/intent/post?text=I%E2%80%99ve%20been%20using%20Pinto%20Notes%3A%20a%20simple%20notes%20app"))
        #expect(x.hasSuffix("&url=https%3A%2F%2Fpintonotes.com"))
        let text = try #require(URLComponents(url: ShareAsk.xURL, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "text" }?.value)
        #expect(text == ShareAsk.postText)
        #expect(text.hasSuffix("ChatGPT and Claude can actually read and edit. Free."))
        #expect(ShareAsk.linkedInURL.absoluteString == "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fpintonotes.com")
    }

    @Test func theOpenSourceLinksGoToGitHub() {
        #expect(ShareAsk.url(for: .starredGitHub)?.absoluteString == "https://github.com/pinto-notes/pinto-notes")
        #expect(ShareAsk.url(for: .dismissed) == nil)
        #expect(AboutSection.links.map(\.title) == ["Star on GitHub", "Report an issue", "Contribute"])
        #expect(AboutSection.links.map(\.url.absoluteString) == [
            "https://github.com/pinto-notes/pinto-notes",
            "https://github.com/pinto-notes/pinto-notes/issues/new/choose",
            "https://github.com/pinto-notes/pinto-notes/blob/main/CONTRIBUTING.md",
        ])
    }
}
