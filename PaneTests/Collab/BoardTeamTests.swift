import Foundation
import Testing
@testable import Pane

/// Voting and a timer for a team session on a whiteboard (Pane/Collab/BoardTeam.swift; round 16,
/// FigJam's retro tools): the rules, what presence carries (read the same as the browser reads it,
/// collab-vectors.json team_presence), and two Macs on one shared board through CollabStore and
/// the in-memory server (BoardPeople). Offscreen; no window, no network, no sound.
@MainActor
@Suite(.serialized) struct BoardTeamTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }

    // MARK: The rules

    @Test func eachPersonHasTheirVotesAndTheTotalsAddUp() {
        let team = BoardTeamModel()
        var page = 0, out = 0
        team.pageChanged = { page += 1 }
        team.published = { out += 1 }
        #expect(!team.running && team.canStart)
        team.vote(on: "a")
        #expect(team.myDots.isEmpty, "no vote before voting starts")
        team.startVoting()
        #expect(team.voting?.votes == BoardTeam.defaultVotes && team.votingOpen && team.hosting)
        team.vote(on: "a"); team.vote(on: "a"); team.vote(on: "b"); team.vote(on: "c")
        #expect(team.myDots == ["a", "a", "b"], "three votes each, no more")
        #expect(team.votesLeft == 0 && BoardTeam.votesLeft(team.votesLeft) == "No votes left")
        team.unvote(on: "a")
        #expect(team.myDots == ["a", "b"] && BoardTeam.votesLeft(team.votesLeft) == "1 vote left")
        #expect(team.dots == BoardTeam.Dots(id: team.voting!.id, on: ["a", "b"]))
        team.endVoting()
        #expect(team.voting?.results == ["a": 1, "b": 1] && !team.votingOpen)
        #expect(team.dots == nil, "dots stop going out once the totals are in")
        team.vote(on: "a")
        #expect(team.myDots == ["a", "b"], "no votes after it ended")
        team.clearVoting()
        #expect(team.voting == nil && !team.running)
        #expect(page > 0 && out > 0)
        // Someone who can only comment votes but doesn't start one; someone who can only view does neither.
        let commenter = BoardTeamModel()
        commenter.canHost = false
        commenter.startVoting()
        commenter.startTimer(seconds: 60)
        #expect(!commenter.running)
        #expect(BoardTeam.votesEach(1) == "1 Vote Each" && BoardTeam.votesEach(3) == "3 Votes Each" && BoardTeam.minutes(1) == "1 Minute" && BoardTeam.minutes(10) == "10 Minutes")
        #expect(BoardTeam.minutes(from: " 7 ") == 7 && BoardTeam.minutes(from: "0") == nil && BoardTeam.minutes(from: "61") == nil && BoardTeam.minutes(from: "two") == nil)
    }

    /// The app and the browser write and read the same presence (collab-vectors.json, team_presence).
    @Test func voteAndTimerPresenceReadsAsTheBrowserWritesIt() throws {
        let url = try #require(Bundle(for: BoardPeople.self).url(forResource: "collab-vectors", withExtension: "json"))
        let v = try #require(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        let t = try #require(v["team_presence"] as? [String: Any])
        func decode<T: Decodable>(_ type: T.Type, _ any: Any) throws -> T { try JSONDecoder().decode(type, from: JSONSerialization.data(withJSONObject: any)) }
        let presence = try #require(t["presence"] as? [String: Any])
        let session = try #require(try decode(BoardTeam.Session.self, presence["team"]!).checked)
        #expect(session.voting == BoardTeam.Voting(id: "v-1a2b3c4d", votes: 3, results: nil))
        #expect(session.timer == BoardTeam.Timer(id: "t-5e6f7a8b", total: 300, left: 287.5))
        let dots = try #require(try decode(BoardTeam.Dots.self, presence["dots"]!).checked)
        #expect(dots == BoardTeam.Dots(id: "v-1a2b3c4d", on: ["box-1", "box-1", "sticky-2"]))
        let ended = try #require(try decode(BoardTeam.Session.self, t["ended"]!).checked)
        #expect(ended.voting?.results == ["box-1": 4, "sticky-2": 1] && ended.timer == nil)
        let tally = try #require(t["tally"] as? [String: Any])
        #expect(BoardTeam.tally(try #require(tally["dots"] as? [[String]])) == (tally["totals"] as? [String: Int]))
        for pair in try #require(t["clock"] as? [[Any]]) {
            let s = try #require((pair[0] as? NSNumber)?.doubleValue)
            #expect(BoardTeam.clock(s) == pair[1] as? String, "\(s)")
        }
        for bad in try #require(t["malformed"] as? [[String: Any]]) {
            #expect(try decode(BoardTeam.Session.self, bad).checked == nil, "\(bad)")
        }
        // What the app writes, the browser reads: the same keys.
        let mine = BoardTeam.Session(voting: .init(id: "v-1", votes: 3), timer: .init(id: "t-1", total: 60, left: 42))
        let written = try #require(try JSONSerialization.jsonObject(with: JSONEncoder().encode(mine)) as? [String: Any])
        #expect(Set(written.keys) == ["voting", "timer"])
        #expect(Set((written["timer"] as? [String: Any])?.keys.map { $0 } ?? []) == ["id", "total", "left"])
    }

    // MARK: Two Macs

    /// Emil starts voting on the board he shares with Sara: she sees it and has her three votes;
    /// she votes for the box twice (her dots on her page, in her colour), he votes once for the
    /// sticky; he sees four votes in; End Voting shows them both the totals; Done clears them.
    /// Nothing of it goes in the drawing.
    @Test func twoPeopleVoteAndSeeTheTotals() async throws {
        let (emil, others, note) = try await people.share(SharedBoardTests.scene([SharedBoardTests.shape("box"), SharedBoardTests.shape("sticky")]), people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = CanvasController(), hers = CanvasController()
        BoardCollab.wire(e, mine)
        BoardCollab.wire(s, hers)
        defer { BoardCollab.unwire(e, mine); BoardCollab.unwire(s, hers) }
        func votes(_ c: CanvasController) -> CanvasVotes? { c.sent.compactMap { if case .votes(let v) = $0 { v } else { nil } }.last }

        #expect(mine.team.canStart && hers.team.canStart, "both can edit")
        mine.team.startVoting(votes: 3)
        #expect(votes(mine)?.on == true)
        await server.eventually { hers.team.voting != nil }
        #expect(hers.team.voting?.votes == 3 && hers.team.hostName == "Emil" && !hers.team.hosting)
        #expect(!hers.team.canStart, "one session at a time: Emil runs it")
        #expect(votes(hers)?.on == true, "her clicks vote")

        // Her two clicks on the box, from her page; his on the sticky.
        hers.receive(["vote": ["on": "box"]])
        hers.receive(["vote": ["on": "box"]])
        let sara = s.boardColors(of: others[0].id)
        #expect(votes(hers)?.dots == [.init(on: "box", color: sara.light, dark: sara.dark), .init(on: "box", color: sara.light, dark: sara.dark)], "her dots, in her colour")
        mine.receive(["vote": ["on": "sticky"]])
        await server.eventually { mine.team.votesIn == 3 }
        #expect(mine.team.votesIn == 3 && BoardTeam.votesIn(3) == "3 votes in")
        #expect(votes(mine)?.dots.map(\.on) == ["sticky"], "he sees his own dots, not hers")
        // One taken back, and given again.
        hers.receive(["vote": ["off": "box"]])
        await server.eventually { mine.team.votesIn == 2 }
        hers.receive(["vote": ["on": "box"]])
        await server.eventually { mine.team.votesIn == 3 }

        mine.team.endVoting()
        #expect(mine.team.voting?.results == ["box": 2, "sticky": 1])
        await server.eventually { hers.team.voting?.results != nil }
        #expect(hers.team.voting?.results == ["box": 2, "sticky": 1])
        #expect(votes(hers) == CanvasVotes(on: false, dots: [], results: ["box": 2, "sticky": 1]), "the totals on her board, her dots gone")
        #expect(BoardTeam.results(hers.team.resultsTotal) == "Results: 3 votes")
        // Not in the drawing.
        let id = try #require(mine.team.voting?.id)
        let drawing = String(data: try JSONSerialization.data(withJSONObject: e.boardScene()), encoding: .utf8) ?? ""
        #expect(!drawing.contains(id) && !drawing.contains("results"))

        mine.team.clearVoting()
        await server.eventually { hers.team.voting == nil }
        #expect(!hers.team.running && hers.team.canStart && votes(hers)?.results == nil)
    }

    /// A timer from Emil counts down on both Macs and ends on both with one chime each; Done
    /// clears it for her too.
    @Test func aTimerCountsDownForEveryoneAndChimesOnce() async throws {
        let was = BoardTeam.chime
        var rang = 0
        BoardTeam.chime = { rang += 1 }
        defer { BoardTeam.chime = was }
        let (emil, others, note) = try await people.share(SharedBoardTests.scene([SharedBoardTests.shape("box")]), people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = CanvasController(), hers = CanvasController()
        BoardCollab.wire(e, mine)
        BoardCollab.wire(s, hers)
        defer { BoardCollab.unwire(e, mine); BoardCollab.unwire(s, hers) }

        mine.team.startTimer(seconds: 1.5)
        #expect(mine.team.timer?.total == 1.5 && mine.team.hosting)
        await server.eventually { hers.team.timer != nil }
        let left = hers.team.timeLeft(at: .now)
        #expect(left > 0.3 && left <= 1.5, "about as long left as on his: \(left)")
        #expect(!hers.team.finished)
        for _ in 0..<3 where !(mine.team.finished && hers.team.finished) { await server.eventually { mine.team.finished && hers.team.finished } }
        #expect(mine.team.finished && hers.team.finished)
        #expect(rang == 2, "one chime on each Mac: \(rang)")
        #expect(BoardTeam.timesUp == "Time\u{2019}s up")
        // Heard again after the end: no second chime.
        try await Task.sleep(for: .milliseconds(400))
        #expect(rang == 2)
        mine.team.stopTimer()
        await server.eventually { hers.team.timer == nil }
        #expect(!hers.team.running)
        // On a board of your own, it's all here.
        let solo = CanvasController()
        solo.team.startTimer(seconds: 60)
        #expect(solo.team.hosting && BoardTeam.clock(solo.team.timeLeft(at: .now)) == "1:00")
        solo.team.stopTimer()
    }

    /// The host leaves the board: their session ends for everyone else.
    @Test func theSessionEndsWhenItsHostLeaves() {
        let team = BoardTeamModel()
        team.me = TestPeople.sara
        team.heard(TestPeople.emil, name: "Emil Wagman", session: .init(voting: .init(id: "v-1", votes: 3)), dots: nil)
        #expect(team.voting != nil && team.hostName == "Emil" && !team.canStart)
        team.vote(on: "box")
        #expect(team.myDots == ["box"])
        // Someone else's dots count for the host, not here.
        team.heard(TestPeople.cleo, name: "Cleo", session: nil, dots: .init(id: "v-1", on: ["box"]))
        team.left(TestPeople.emil)
        #expect(!team.running && team.myDots.isEmpty && team.canStart)
        // Two start at once: the one whose account id sorts first runs it on both.
        let sara = BoardTeamModel()
        sara.me = TestPeople.sara
        sara.startVoting()
        sara.heard(TestPeople.emil, name: "Emil", session: .init(voting: .init(id: "v-emil", votes: 5)), dots: nil)
        #expect(sara.voting?.id != "v-emil" && sara.hosting, "5A… sorts before E0…: hers stays")
        let emil = BoardTeamModel()
        emil.me = TestPeople.emil
        emil.startVoting()
        emil.heard(TestPeople.sara, name: "Sara", session: sara.session, dots: nil)
        #expect(emil.voting?.id == sara.voting?.id && !emil.hosting && emil.hostName == "Sara")
    }
}
