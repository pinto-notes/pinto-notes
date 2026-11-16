import Foundation
import Observation
#if canImport(AudioToolbox)
import AudioToolbox
#endif

/// Voting and a timer for a team session on a whiteboard (round 16: FigJam's retro tools), calm
/// and native. Whoever starts one hosts it: their presence carries it (`Session`), and each voter's
/// presence carries their own dots (`Dots`), so it's live for everyone on a shared board and never
/// part of the drawing (the .excalidraw file, pictures and the share page leave it out). On a
/// board of your own it's all here. The browser does the same (web/lib/board-team.ts), and the two
/// read each other's (supabase/functions/_shared/collab-vectors.json, team_presence).
///
/// - Voting: each person has a number of votes (3 to start with). While it's on, a click on a shape
///   or a sticky puts one of your dots on it, in your colour; a click on one of your dots takes it
///   back. You see your own dots, as in FigJam, so nobody votes with the crowd; the host sees how
///   many are in. End Voting shows everyone the totals on the shapes; Done clears them.
/// - Timer: 1, 3, 5 or 10 minutes, or your own. Everyone sees it count down, and it ends with a
///   soft chime at the system's alert volume (none when the system's sounds are off).
enum BoardTeam {
    /// What the host's presence carries.
    struct Session: Codable, Equatable, Sendable {
        var voting: Voting?
        var timer: Timer?
        var isEmpty: Bool { voting == nil && timer == nil }
        /// As it arrived, checked: anything malformed is left out, not half taken (as the browser's sessionOf).
        var checked: Session? {
            var out = Session()
            if let v = voting, BoardTeam.ok(v.id), (1...BoardTeam.mostVotes).contains(v.votes) {
                out.voting = Voting(id: v.id, votes: v.votes, results: v.results.map { r in
                    Dictionary(uniqueKeysWithValues: r.filter { BoardTeam.ok($0.key) && $0.value > 0 }.prefix(500).map { ($0.key, $0.value) })
                })
            }
            let most = Double(BoardTeam.mostMinutes * 60)
            if let t = timer, BoardTeam.ok(t.id), t.total > 0, t.total <= most, t.left >= 0, t.left <= most, t.total.isFinite, t.left.isFinite { out.timer = t }
            return out.isEmpty ? nil : out
        }
    }
    static func ok(_ id: String) -> Bool { !id.isEmpty && id.count <= 64 }
    struct Voting: Codable, Equatable, Sendable {
        /// This round of voting: dots from another round don't count in it.
        var id: String
        /// Each person's.
        var votes: Int
        /// The totals once the host ended it: shape id → dots.
        var results: [String: Int]?
    }
    struct Timer: Codable, Equatable, Sendable {
        var id: String
        /// What it was set to, in seconds.
        var total: Double
        /// Seconds left when it was sent: each device counts down from when it heard it, so two
        /// devices whose clocks differ still agree.
        var left: Double
    }
    /// What each voter's presence carries: the shapes their dots are on (a shape can have several).
    struct Dots: Codable, Equatable, Sendable {
        var id: String
        var on: [String]
        var checked: Dots? {
            let on = Array(on.filter(BoardTeam.ok).prefix(BoardTeam.mostVotes))
            return BoardTeam.ok(id) && !on.isEmpty ? Dots(id: id, on: on) : nil
        }
    }

    static let defaultVotes = 3
    /// The Start Voting menu: the usual first, then the others.
    static let voteChoices = [3, 1, 5, 10]
    static let mostVotes = 20
    static let timerMinutes = [1, 3, 5, 10]
    static let mostMinutes = 60
    /// A finished timer's "Time's up" clears itself after this long, if the host hasn't.
    static let timesUpFor: TimeInterval = 120

    // MARK: Words (sentence case in the board; title case in menus, as the Mac's are)

    static let startVoting = "Start Voting"
    static func votesEach(_ n: Int) -> String { n == 1 ? "1 Vote Each" : "\(n) Votes Each" }
    static let endVoting = "End Voting"
    static let clearVotes = "Clear Votes"
    static let timerMenu = "Timer"
    static func minutes(_ n: Int) -> String { n == 1 ? "1 Minute" : "\(n) Minutes" }
    static let customTimer = "Custom\u{2026}"
    static let customQuestion = "Timer"
    static let customMessage = "How many minutes? Up to 60."
    static let stopTimer = "Stop Timer"
    static let timesUp = "Time\u{2019}s up"
    static let done = "Done"
    static let voting = "Voting"
    static func votesLeft(_ n: Int) -> String { n == 0 ? "No votes left" : n == 1 ? "1 vote left" : "\(n) votes left" }
    static func votesIn(_ n: Int) -> String { n == 1 ? "1 vote in" : "\(n) votes in" }
    static func results(_ n: Int) -> String { n == 1 ? "Results: 1 vote" : "Results: \(n) votes" }
    static func hostedBy(_ name: String) -> String { "\(name) started it" }
    /// Why a menu item is off: someone else runs the session.
    static func running(by name: String) -> String { "\(name) is running a session" }

    /// The minutes typed for Timer › Custom… (1 to 60, whole), or nil.
    static func minutes(from typed: String) -> Int? {
        guard let n = Int(typed.trimmingCharacters(in: .whitespacesAndNewlines)), (1...mostMinutes).contains(n) else { return nil }
        return n
    }

    /// The totals of everyone's dots: shape id → dots.
    static func tally(_ all: [[String]]) -> [String: Int] {
        var out: [String: Int] = [:]
        for dots in all { for id in dots { out[id, default: 0] += 1 } }
        return out
    }

    /// "4:32", "0:07", "10:00": whole seconds, rounded up, so it reads 0:00 only at the end.
    static func clock(_ seconds: Double) -> String {
        let s = max(0, Int(seconds.rounded(.up)))
        return String(format: "%d:%02d", s / 60, s % 60)
    }

    static func newID(_ kind: String) -> String { "\(kind)-\(UUID().uuidString.prefix(8).lowercased())" }

    /// The soft chime at a timer's end: the system's Glass sound at the alert volume, through the
    /// system's sound effects, so it's silent when they are. Tests replace it (agents run muted).
    @MainActor static var chime: () -> Void = { playChime() }

    @MainActor private static var chimeSound: UInt32 = 0
    @MainActor private static func playChime() {
        // Never from a test run (tests run muted).
        if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil { return }
        #if canImport(AudioToolbox)
        if chimeSound == 0 {
            #if os(macOS)
            let url = URL(fileURLWithPath: "/System/Library/Sounds/Glass.aiff")
            var id: SystemSoundID = 0
            if AudioServicesCreateSystemSoundID(url as CFURL, &id) == noErr { chimeSound = id }
            #else
            chimeSound = 1013
            #endif
        }
        if chimeSound != 0 { AudioServicesPlaySystemSound(chimeSound) }
        #endif
    }
}

/// One board's team session, as this device sees it: yours when you host it, else the host's as
/// their presence says, with your own dots and (while you host) everyone's.
@MainActor @Observable
final class BoardTeamModel {
    /// You on a shared board; nil on a board of your own.
    var me: UUID?
    /// You may start voting or a timer: you can edit the board (not when you can only comment or view).
    var canHost = true
    /// You may vote: you can edit or comment.
    var canVote = true
    /// Who hosts it when it's someone else, and their first name.
    private(set) var host: UUID?
    private(set) var hostName: String?
    private(set) var voting: BoardTeam.Voting?
    private(set) var timer: BoardTeam.Timer?
    /// When the timer ends here.
    private(set) var endsAt: Date?
    /// The timer reached its end here: "Time's up".
    private(set) var finished = false
    private(set) var myDots: [String] = []
    private var theirs: [UUID: BoardTeam.Dots] = [:]
    @ObservationIgnored private var chimed: Set<String> = []
    @ObservationIgnored private var ticking: Task<Void, Never>?
    @ObservationIgnored private var clearing: Task<Void, Never>?

    /// What the page draws changed (your dots, the totals, voting on or off).
    @ObservationIgnored var pageChanged: () -> Void = {}
    /// What your presence carries changed (your session as host, your dots).
    @ObservationIgnored var published: () -> Void = {}
    @ObservationIgnored var clock: () -> Date = { .now }

    /// You run it (and it's on).
    var hosting: Bool { host == nil && running }
    var running: Bool { voting != nil || timer != nil }
    /// Voting is on and its totals aren't out yet.
    var votingOpen: Bool { voting != nil && voting?.results == nil }
    var votesLeft: Int { max(0, (voting?.votes ?? 0) - myDots.count) }
    /// Everyone's dots in this round (the host's count; others see only their own).
    var votesIn: Int {
        guard let id = voting?.id else { return 0 }
        return myDots.count + theirs.values.filter { $0.id == id }.reduce(0) { $0 + $1.on.count }
    }
    var resultsTotal: Int { voting?.results?.values.reduce(0, +) ?? 0 }
    func timeLeft(at now: Date) -> Double { endsAt.map { max(0, $0.timeIntervalSince(now)) } ?? 0 }
    /// You can start one: nobody else runs a session.
    var canStart: Bool { canHost && host == nil }

    // MARK: The host's

    func startVoting(votes: Int = BoardTeam.defaultVotes) {
        guard canStart else { return }
        voting = .init(id: BoardTeam.newID("v"), votes: min(max(votes, 1), BoardTeam.mostVotes))
        myDots = []
        theirs = theirs.filter { _, d in d.id != voting?.id }
        changed()
    }

    /// The totals, for everyone.
    func endVoting() {
        guard host == nil, var v = voting, v.results == nil else { return }
        v.results = BoardTeam.tally([myDots] + theirs.values.filter { $0.id == v.id }.map(\.on))
        voting = v
        changed()
    }

    func clearVoting() {
        guard host == nil, voting != nil else { return }
        voting = nil
        myDots = []
        changed()
    }

    func startTimer(seconds: Double) {
        guard canStart, seconds > 0 else { return }
        let s = min(seconds, Double(BoardTeam.mostMinutes * 60))
        timer = .init(id: BoardTeam.newID("t"), total: s, left: s)
        endsAt = clock().addingTimeInterval(s)
        finished = false
        tick()
        changed()
    }

    func stopTimer() {
        guard host == nil, timer != nil else { return }
        timer = nil
        endsAt = nil
        finished = false
        ticking?.cancel()
        clearing?.cancel()
        changed()
    }

    // MARK: Voting

    func vote(on id: String) {
        guard canVote, votingOpen, votesLeft > 0 else { return }
        myDots.append(id)
        changed()
    }

    func unvote(on id: String) {
        guard votingOpen, let i = myDots.lastIndex(of: id) else { return }
        myDots.remove(at: i)
        changed()
    }

    // MARK: What your presence carries

    /// Yours while you host it, with the timer's seconds left now.
    var session: BoardTeam.Session? {
        guard hosting else { return nil }
        return .init(voting: voting, timer: timer.map { t in var t = t; t.left = (timeLeft(at: clock()) * 10).rounded() / 10; return t })
    }

    /// Your dots in this round, while it's open.
    var dots: BoardTeam.Dots? {
        guard let v = voting, v.results == nil, !myDots.isEmpty else { return nil }
        return .init(id: v.id, on: myDots)
    }

    // MARK: What the others' presence carries

    /// Someone's beat: their dots, and their session when they run one.
    func heard(_ user: UUID, name: String, session: BoardTeam.Session?, dots: BoardTeam.Dots?) {
        guard user != me else { return }
        let before = (theirs[user], host, voting, timer?.id)
        if let dots, !dots.on.isEmpty { theirs[user] = .init(id: dots.id, on: Array(dots.on.prefix(BoardTeam.mostVotes))) } else { theirs[user] = nil }
        if let s = session, !s.isEmpty {
            // Two started at once: the one whose account id sorts first runs it, on every device.
            if hosting, let me, me.uuidString.lowercased() < user.uuidString.lowercased() {
                if before.0 != theirs[user] { pageChanged() }
                return
            }
            adopt(user, name: name, s)
        } else if host == user {
            end()
        }
        if before.0 != theirs[user] || before.1 != host || before.2 != voting || before.3 != timer?.id { pageChanged() }
    }

    /// They left the board: their dots go, and their session if they ran it.
    func left(_ user: UUID) {
        theirs[user] = nil
        if host == user { end(); pageChanged() }
    }

    /// Back to nothing (the board closed or stopped being shared).
    func reset() {
        ticking?.cancel(); clearing?.cancel()
        host = nil; hostName = nil; voting = nil; timer = nil; endsAt = nil; finished = false; myDots = []; theirs = [:]
        pageChanged()
    }

    private func adopt(_ user: UUID, name: String, _ s: BoardTeam.Session) {
        if hosting { ticking?.cancel(); clearing?.cancel() }
        host = user
        hostName = name.split(separator: " ").first.map(String.init) ?? name
        if s.voting?.id != voting?.id { myDots = [] }
        voting = s.voting
        if let t = s.timer {
            let ends = clock().addingTimeInterval(max(0, t.left))
            if t.id != timer?.id {
                timer = t
                endsAt = ends
                finished = t.left <= 0
                // Joined after it ended: no chime.
                if finished { chimed.insert(t.id) }
                tick()
            } else if let e = endsAt, abs(e.timeIntervalSince(ends)) > 1 {
                timer = t
                endsAt = ends
                tick()
            }
        } else if timer != nil {
            timer = nil; endsAt = nil; finished = false; ticking?.cancel()
        }
    }

    private func end() {
        ticking?.cancel()
        host = nil; hostName = nil; voting = nil; timer = nil; endsAt = nil; finished = false; myDots = []
    }

    private func changed() {
        pageChanged()
        published()
    }

    /// Waits for the end, then "Time's up" and the chime, once a timer.
    private func tick() {
        ticking?.cancel()
        guard let id = timer?.id, let ends = endsAt else { return }
        ticking = Task { [weak self] in
            let wait = ends.timeIntervalSince(self?.clock() ?? .now)
            if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
            guard let self, !Task.isCancelled, self.timer?.id == id else { return }
            self.finish(id)
        }
    }

    private func finish(_ id: String) {
        finished = true
        if !chimed.contains(id) { chimed.insert(id); BoardTeam.chime() }
        pageChanged()
        // The host's "Time's up" clears itself after a while.
        guard host == nil else { return }
        clearing?.cancel()
        clearing = Task { [weak self] in
            try? await Task.sleep(for: .seconds(BoardTeam.timesUpFor))
            guard let self, !Task.isCancelled, self.timer?.id == id, self.host == nil else { return }
            self.stopTimer()
        }
    }
}
