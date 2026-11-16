import CoreGraphics
import Foundation
import Testing
@testable import Pane

/// Following someone on a shared whiteboard (Pane/Collab/BoardFollow.swift): the banner, whom it
/// offers, where a follower's view goes, and the presence that carries it between two people
/// through CollabStore and the in-memory server (BoardPeople). Offscreen; no window, no network.
@MainActor
@Suite struct BoardFollowTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }

    static let sara = UUID(uuidString: "22222222-2222-4222-8222-222222222222")!
    static let mia = UUID(uuidString: "33333333-3333-4333-8333-333333333333")!

    static func person(_ id: UUID, _ name: String, presenting: BoardPresenting? = nil, view: CGRect? = nil, following: UUID? = nil, stale: Bool = false) -> BoardPerson {
        BoardPerson(id: id, name: name, color: "#2D6E36", dark: "#4BA35A", presenting: presenting, view: view, following: following, stale: stale)
    }

    // MARK: The rules

    /// What presence carries is checked as it arrives: a malformed step, view or point is left out.
    /// One colour per person on every device (round 14: Sara was purple on the Mac and teal in the
    /// browser). The app gives each person the colour the shared vectors list for their board's
    /// members (collab-vectors.json, people_colours), as the browser does (web/lib/board-colours.test.ts),
    /// and the people in the tests' pictures have theirs: Emil teal, Sara indigo.
    @Test func everyoneHasTheColourTheBrowserGivesThem() throws {
        let url = try #require(Bundle(for: BoardPeople.self).url(forResource: "collab-vectors", withExtension: "json"))
        let v = try #require(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        let colours = try #require(v["people_colours"] as? [String: Any])
        #expect(colours["palette"] as? [String] == CollabSession.palette.map { CollabSession.hex($0.light) })
        let cases = try #require(colours["cases"] as? [[String: Any]])
        #expect(cases.count == 4)
        for c in cases {
            let ids = try #require(c["members"] as? [String]).compactMap(UUID.init(uuidString:))
            let slots = CollabSession.slots(for: ids)
            let got = ids.map { CollabSession.hex(CollabSession.palette[slots[$0] ?? Int(CollabSession.paletteIndex(for: $0))].light) }
            #expect(got == c["colours"] as? [String], "\(c["about"] ?? "")")
        }
        #expect(TestPeople.color(TestPeople.emil).light == "#186B70" && TestPeople.color(TestPeople.sara).light == "#5252C5")
        // On a board of his own, Emil's comments take the colour his id picks: the same teal.
        #expect(BoardComments.color(for: TestPeople.emil.uuidString) == "#186B70" && BoardComments.color(for: TestPeople.sara.uuidString) == "#5252C5")
    }

    @Test func whatPresenceCarriesIsChecked() {
        #expect(BoardPresenting(frame: "f1", i: 0, n: 3).checked != nil)
        #expect(BoardPresenting(frame: nil, i: 0, n: 1).checked != nil, "a board with no frames presents as a whole")
        for bad in [BoardPresenting(frame: "", i: 0, n: 1), BoardPresenting(frame: "f", i: 3, n: 3), BoardPresenting(frame: "f", i: -1, n: 2),
                    BoardPresenting(frame: "f", i: 0, n: 0), BoardPresenting(frame: String(repeating: "x", count: 201), i: 0, n: 1)] {
            #expect(bad.checked == nil)
        }
        #expect(BoardFollow.rect([1, 2, 300, 200]) == CGRect(x: 1, y: 2, width: 300, height: 200))
        for bad: [Double]? in [[1, 2, 0, 200], [1, 2, 3], [1, 2, .nan, 4], [1, 2, 1e8, 4], nil] { #expect(BoardFollow.rect(bad) == nil) }
        #expect(BoardFollow.points([[1, 2], [3], [5, .infinity], [8, 9]]) == [CGPoint(x: 1, y: 2), CGPoint(x: 8, y: 9)])
        #expect(BoardFollow.points(Array(repeating: [1, 1], count: 500)).count == BoardFollow.mostLaserPoints)
        #expect(BoardFollow.rounded(CGRect(x: 10.4, y: -3.6, width: 800.2, height: 499.5)) == CGRect(x: 10, y: -4, width: 800, height: 500))
    }

    /// "Sara is presenting · Follow"; "Following Sara · Stop following"; nothing while you present.
    @Test func theBannerSaysWhoPresentsThenWhomYouFollow() {
        let sara = Self.person(Self.sara, "Sara", presenting: BoardPresenting(frame: "f1", i: 0, n: 2)), mia = Self.person(Self.mia, "Mia")
        #expect(BoardFollow.banner(people: [mia], following: nil, presentingHere: false) == nil)
        let presenting = BoardFollow.banner(people: [mia, sara], following: nil, presentingHere: false)
        #expect(presenting == .presenting(sara) && presenting?.line == "Sara is presenting" && presenting?.action == "Follow")
        #expect(BoardFollow.banner(people: [mia, sara], following: nil, presentingHere: true) == nil)
        let following = BoardFollow.banner(people: [mia, sara], following: Self.mia, presentingHere: false)
        #expect(following == .following(mia) && following?.line == "Following Mia" && following?.action == "Stop following")
        // Someone not heard from isn't offered; of two presenting, every device picks the same one.
        var quiet = sara
        quiet.stale = true
        #expect(BoardFollow.presenter(in: [quiet]) == nil)
        let both = [Self.person(Self.mia, "Mia", presenting: BoardPresenting(frame: nil, i: 0, n: 1)), sara]
        #expect(BoardFollow.presenter(in: both)?.id == Self.sara && BoardFollow.presenter(in: both.reversed())?.id == Self.sara)
    }

    /// The presenter sees who follows: "Sara is following", "2 following".
    @Test func thePresenterSeesWhoFollows() {
        let me = UUID()
        let list = [Self.person(Self.sara, "Sara", following: me), Self.person(Self.mia, "Mia", following: me), Self.person(UUID(), "Ola", following: me, stale: true)]
        #expect(BoardFollow.followersLine(BoardFollow.followers(of: me, in: Array(list.prefix(1)))) == "Sara is following")
        #expect(BoardFollow.followersLine(BoardFollow.followers(of: me, in: list)) == "2 following")
        #expect(BoardFollow.followers(of: me, in: list).map(\.name) == ["Mia", "Sara"])
        #expect(BoardFollow.followersLine([]) == nil && BoardFollow.followers(of: nil, in: list).isEmpty)
    }

    /// A follower's view goes to the frame on show, the whole board when it has none, else what the
    /// person followed sees; the page is told so.
    @Test func whereAFollowersViewGoes() {
        #expect(BoardFollow.target(for: Self.person(Self.sara, "Sara", presenting: BoardPresenting(frame: "f2", i: 1, n: 3))) == .frame("f2"))
        #expect(BoardFollow.target(for: Self.person(Self.sara, "Sara", presenting: BoardPresenting(frame: nil, i: 0, n: 1), view: CGRect(x: 0, y: 0, width: 1, height: 1))) == .wholeBoard)
        #expect(BoardFollow.target(for: Self.person(Self.sara, "Sara", view: CGRect(x: 0, y: 10, width: 800, height: 600))) == .view(CGRect(x: 0, y: 10, width: 800, height: 600)))
        #expect(BoardFollow.target(for: Self.person(Self.sara, "Sara")) == nil)
        #expect(CanvasCommand.follow(.frame("f2")).payload as NSDictionary == ["op": "follow", "frame": "f2"])
        #expect(CanvasCommand.follow(.wholeBoard).payload as NSDictionary == ["op": "follow", "whole": true])
        #expect(CanvasCommand.follow(.view(CGRect(x: 0, y: 10, width: 800, height: 600))).payload as NSDictionary == ["op": "follow", "view": [0, 10, 800, 600]])
        #expect(CanvasCommand.follow(nil).payload as NSDictionary == ["op": "follow", "off": true])
        #expect(CanvasCommand.laser(Self.sara, [CGPoint(x: 1, y: 2)]).payload as NSDictionary == ["op": "laser", "id": Self.sara.uuidString, "points": [[1, 2]]])
        #expect(CanvasCommand.focusComment("c1", above: 0.45).payload as NSDictionary == ["op": "focusComment", "id": "c1", "above": 0.45])
        #expect(CanvasCommand.focusComment("c1").payload as NSDictionary == ["op": "focusComment", "id": "c1"])
    }

    /// What the page says of your view with your pointer: what you present, what you see, the laser.
    @Test func thePagesLookIsRead() {
        let look = CanvasController.look(["pointer": [1, 2], "present": ["frame": "f1", "i": 1, "n": 3], "view": [-10, 20, 800, 500], "laser": [[1, 2], ["x", 3], [4, 5]]])
        #expect(look == BoardLook(presenting: BoardPresenting(frame: "f1", i: 1, n: 3), view: CGRect(x: -10, y: 20, width: 800, height: 500), laser: [CGPoint(x: 1, y: 2), CGPoint(x: 4, y: 5)]))
        #expect(CanvasController.look(["pointer": [1, 2], "present": ["i": 5, "n": 2], "view": "x"]) == BoardLook())
    }

    // MARK: Two people

    /// Sara presents with the laser down: Emil reads her frame, what she sees and each laser point
    /// once; he follows her and she reads that; her Done clears it.
    @Test func whatSomeonePresentsAndSeesReachesTheOthers() async throws {
        let (emil, others, note) = try await people.share(SharedBoardTests.scene([SharedBoardTests.shape("a")]), people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        var lasers: [(UUID, [CGPoint])] = []
        var told = 0
        e.onBoardPeople = { _ in told += 1 }
        e.onBoardLaser = { lasers.append(($0, $1)) }

        s.boardLook(BoardLook(presenting: BoardPresenting(frame: "f2", i: 1, n: 3), view: CGRect(x: -10.4, y: 20.6, width: 800, height: 500), laser: [CGPoint(x: 40, y: 50), CGPoint(x: 41, y: 52)]))
        s.boardLook(BoardLook(presenting: BoardPresenting(frame: "f2", i: 1, n: 3), view: CGRect(x: -10.4, y: 20.6, width: 800, height: 500), laser: [CGPoint(x: 43, y: 55)]))
        await server.eventually { e.boardPeople.first?.presenting != nil && lasers.flatMap(\.1).count == 3 }
        let sara = try #require(e.boardPeople.first)
        #expect(sara.id == others[0].id && sara.name == "Sara")
        #expect(sara.presenting == BoardPresenting(frame: "f2", i: 1, n: 3))
        #expect(sara.view == CGRect(x: -10, y: 21, width: 800, height: 500), "to the nearest point")
        #expect(sara.color == CollabSession.hex(CollabSession.palette[e.paletteSlot(of: others[0].id)].light))
        #expect(lasers.flatMap(\.1) == [CGPoint(x: 40, y: 50), CGPoint(x: 41, y: 52), CGPoint(x: 43, y: 55)], "each point once, in order")
        #expect(lasers.allSatisfy { $0.0 == others[0].id })
        #expect(told > 0)

        // Emil follows her: she reads it.
        e.boardFollow(others[0].id)
        await server.eventually { s.boardPeople.first?.following == emil.id }
        #expect(BoardFollow.followers(of: others[0].id, in: s.boardPeople).map(\.name) == ["Emil"])

        // Her Done: no frame, the laser off; nothing sent again for the same look.
        s.boardLook(BoardLook(presenting: nil, view: CGRect(x: -10.4, y: 20.6, width: 800, height: 500), laser: nil))
        await server.eventually { e.boardPeople.first?.presenting == nil }
        #expect(e.boardPeople.first?.presenting == nil && e.boardPeople.first?.view != nil)
        let heard = told
        s.boardLook(BoardLook(presenting: nil, view: CGRect(x: -10.1, y: 20.9, width: 800, height: 500), laser: nil))
        await server.settle()
        #expect(told == heard, "a view that hasn't really moved isn't news")

        // Emil stops; then Sara leaves: her people are gone from his.
        e.boardFollow(nil)
        await server.eventually { s.boardPeople.first?.following == nil }
        #expect(s.boardPeople.first?.following == nil)
    }

    /// Two boards open on two Macs: Sara presents, Emil's banner offers Follow; Follow moves his
    /// board to each frame she shows, her laser draws on it, and she sees he follows; her Done ends
    /// it. From her avatar he follows her view wherever she moves it; moving his board himself ends it.
    @Test func followingThePresenterBetweenTwoBoards() async throws {
        let (emil, others, note) = try await people.share(SharedBoardTests.scene([SharedBoardTests.shape("a")]), people: ["Sara"])
        let e = try people.session(emil, note), s = try people.session(others[0], note)
        let mine = CanvasController(), hers = CanvasController()
        BoardCollab.wire(e, mine)
        BoardCollab.wire(s, hers)
        let saraID = others[0].id
        func follows() -> [CanvasCommand] { mine.sent.filter { if case .follow = $0 { true } else { false } } }

        // Sara presents her first frame: Emil's banner offers to follow.
        hers.receive(["presence": ["pointer": [10, 10], "sel": [], "present": ["frame": "f1", "i": 0, "n": 2], "view": [0, 0, 800, 500]]])
        await server.eventually { mine.followBanner != nil }
        let offered = try #require(mine.followBanner)
        #expect(offered.line == "Sara is presenting" && offered.action == "Follow" && offered.person.id == saraID)
        #expect(hers.followBanner == nil, "the presenter has no banner")

        // Follow: his board goes to her frame, and she sees him follow.
        mine.follow(saraID)
        #expect(mine.followBanner?.line == "Following Sara" && mine.following == saraID)
        #expect(follows() == [.follow(.frame("f1"))])
        await server.eventually { !hers.followers.isEmpty }
        #expect(BoardFollow.followersLine(hers.followers) == "Emil is following")

        // She steps on: his board goes with her. Her laser draws on his board.
        hers.receive(["presence": ["pointer": [12, 10], "sel": [], "present": ["frame": "f2", "i": 1, "n": 2], "view": [900, 0, 800, 500], "laser": [[12, 10], [13, 11]]]])
        await server.eventually { follows().count == 2 && mine.sent.contains { if case .laser = $0 { true } else { false } } }
        #expect(follows() == [.follow(.frame("f1")), .follow(.frame("f2"))])
        #expect(mine.sent.contains(.laser(saraID, [CGPoint(x: 12, y: 10), CGPoint(x: 13, y: 11)])))

        // Her Done ends it, where his board is.
        hers.receive(["presence": ["pointer": [12, 10], "sel": [], "view": [900, 0, 800, 500]]])
        await server.eventually { mine.following == nil }
        #expect(mine.following == nil && mine.followBanner == nil && follows().last == .follow(nil))
        await server.eventually { hers.followers.isEmpty }
        #expect(hers.followers.isEmpty, "she sees nobody follows any more")

        // From her avatar: her view, as she moves it, past a presentation of hers, until he moves his board.
        mine.follow(saraID)
        #expect(follows().last == .follow(.view(CGRect(x: 900, y: 0, width: 800, height: 500))))
        hers.receive(["presence": ["pointer": [12, 10], "sel": [], "view": [950, 40, 800, 500]]])
        await server.eventually { follows().last == .follow(.view(CGRect(x: 950, y: 40, width: 800, height: 500))) }
        hers.receive(["presence": ["pointer": [12, 10], "sel": [], "present": ["frame": "f1", "i": 0, "n": 2], "view": [0, 0, 800, 500]]])
        await server.eventually { follows().last == .follow(.frame("f1")) }
        hers.receive(["presence": ["pointer": [12, 10], "sel": [], "view": [10, 0, 800, 500]]])
        await server.eventually { follows().last == .follow(.view(CGRect(x: 10, y: 0, width: 800, height: 500))) }
        #expect(mine.following == saraID, "her Done doesn't end following her view")
        // The page loaded again: told again where to look.
        mine.receive(["load": "again", "tool": "selection"])
        #expect(follows().last == .follow(.view(CGRect(x: 10, y: 0, width: 800, height: 500))))
        mine.receive(["unfollow": true])
        #expect(mine.following == nil && follows().last == .follow(nil))
        await server.eventually { hers.followers.isEmpty }
        #expect(hers.followers.isEmpty)

        // Presenting himself ends following her.
        mine.follow(saraID)
        mine.receive(["tool": "selection", "present": ["index": 0, "count": 1, "name": "Board"]])
        #expect(mine.following == nil)

        BoardCollab.unwire(e, mine)
        BoardCollab.unwire(s, hers)
        #expect(mine.people.isEmpty && mine.followBanner == nil)
    }

    /// Someone you follow leaves the board: following ends.
    @Test func followingEndsWhenTheyLeave() {
        let canvas = CanvasController()
        canvas.share(true)
        let sara = Self.person(Self.sara, "Sara", view: CGRect(x: 0, y: 0, width: 100, height: 100))
        var told: [UUID?] = []
        canvas.onFollow = { told.append($0) }
        canvas.show(people: [sara])
        canvas.follow(Self.sara)
        canvas.show(people: [sara])
        #expect(canvas.sent.filter { if case .follow = $0 { true } else { false } } == [.follow(.view(CGRect(x: 0, y: 0, width: 100, height: 100)))], "the same view isn't sent twice")
        canvas.show(people: [])
        #expect(canvas.following == nil && told == [Self.sara, nil] && canvas.sent.last == .follow(nil))
        // Nobody here to follow: nothing happens. Not shared: nothing at all.
        canvas.follow(Self.mia)
        #expect(canvas.following == nil)
        canvas.share(false)
        canvas.show(people: [sara])
        #expect(canvas.people.isEmpty && canvas.followBanner == nil)
    }
}
