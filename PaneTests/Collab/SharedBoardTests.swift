import Automerge
import CryptoKit
import Foundation
import SwiftData
import Testing
#if os(macOS)
import AppKit
#endif
@testable import Pane

/// Whiteboards shared with people (Pane/Collab/CollabBoard.swift): the drawing in the note's shared
/// document, element by element, so people drawing at once all end with the same board.
///
/// Three people through CollabStore and the in-memory server (MemoryCollabServer), as in
/// CollabTwoPeopleTests; AI drawing through the library and FakeCollabServer, as in
/// SharedLibraryTests. Offscreen; no window, no network.
/// People with a whiteboard shared between them, through CollabStore and the in-memory server:
/// for these tests and the board's own (CanvasNativeUITests).
@MainActor final class BoardPeople {
    let server = MemoryCollabServer()

    struct Device {
        let id: UUID
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
    }

    func device(_ user: UUID, name: String) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let key = SymmetricKey(size: .bits256)
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { key }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        return Device(id: user, store: store, context: container.mainContext, container: container)
    }

    /// Emil's board with `scene`, shared with an Edit (or View) link; `people` join it. `accounts`:
    /// fixed account ids by name (so a person has the same colour from one board to the next).
    func share(_ scene: [String: Any], access: ShareState.Access = .edit, people: [String] = ["Sara", "Ola"], title: String = "Launch plan", accounts: [String: UUID] = [:])
        async throws -> (emil: Device, others: [Device], note: Note) {
        let emil = try device(server.account("Emil", id: accounts["Emil"] ?? UUID()), name: "Emil")
        let note = CanvasNote.make(in: .all, context: emil.context, scene: scene, named: title)
        try await emil.store.setAccess(access, for: note)
        let url = try #require(emil.store.linkURL(note))
        var others: [Device] = []
        for name in people {
            let d = try device(server.account(name, id: accounts[name] ?? UUID()), name: name)
            #expect(await d.store.join(url))
            others.append(d)
        }
        await server.eventually { server.channelCount(note.id) == 1 + people.count }
        return (emil, others, note)
    }

    func session(_ d: Device, _ note: Note) throws -> CollabSession {
        if let s = d.store.session(for: note.id) { return s }
        return try #require(d.store.session(for: d.context.pointer(forShared: note.id)?.id ?? UUID()))
    }
}

/// The people in the tests' pictures, with the account ids they have everywhere: the Mac's and the
/// iPhone's pictures, and the browser's (scripts/board-web-e2e.sh makes its two accounts with these
/// ids). So each has one colour in every picture, as a person does on every device (round 14: Sara
/// was purple in the Mac's comments, teal in the browser). Emil's id picks teal, Sara's indigo
/// (CollabSession.paletteIndex), and on a board they share, Emil's, they keep them.
enum TestPeople {
    static let emil = UUID(uuidString: "E0000000-0000-4000-8000-000000000001")!
    static let sara = UUID(uuidString: "5A000000-0000-4000-8000-000000000002")!
    /// Can comment, in the pictures and the browser test (scripts/board-web-e2e.ts): violet.
    static let cleo = UUID(uuidString: "C1E00000-0000-4000-8000-000000000002")!
    static let accounts = ["Emil": emil, "Sara": sara, "Cleo": cleo]

    /// Someone's colour on Emil's board shared with Sara, light and dark ("#RRGGBB").
    @MainActor static func color(_ id: UUID) -> (light: String, dark: String) {
        let p = CollabSession.palette[CollabSession.slots(for: [emil, sara])[id] ?? Int(CollabSession.paletteIndex(for: id))]
        return (CollabSession.hex(p.light), CollabSession.hex(p.dark))
    }
}

@MainActor
@Suite struct SharedBoardTests {
    let people = BoardPeople()
    var server: MemoryCollabServer { people.server }
    typealias Device = BoardPeople.Device

    private func sharedBoard(_ elements: [[String: Any]], access: ShareState.Access = .edit, people names: [String] = ["Sara", "Ola"])
        async throws -> (emil: Device, others: [Device], note: Note) {
        try await people.share(Self.scene(elements), access: access, people: names)
    }

    private func session(_ d: Device, _ note: Note) throws -> CollabSession { try people.session(d, note) }

    /// A shape as the board's engine keeps it (the fields the document and the rule read).
    static func shape(_ id: String, x: Double = 0, y: Double = 0, version: Int = 1, nonce: Int = 1, index: String = "a0", text: String? = nil, type: String = "rectangle") -> [String: Any] {
        var e: [String: Any] = ["id": id, "type": type, "x": x, "y": y, "width": 120, "height": 60, "angle": 0, "version": version, "versionNonce": nonce,
                                "index": index, "isDeleted": false, "seed": 7, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
                                "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100, "groupIds": [String](), "boundElements": NSNull(),
                                "updated": 1, "link": NSNull(), "locked": false]
        if let text { e["text"] = text }
        return e
    }

    static func scene(_ elements: [[String: Any]]) -> [String: Any] {
        CollabBoard.scene(elements: elements, settings: ["viewBackgroundColor": "#ffffff"])
    }

    /// Each element's id and stamp, in drawing order: two boards that say the same are the same.
    static func said(_ s: CollabSession) -> [String] {
        ((s.boardScene()["elements"] as? [[String: Any]]) ?? []).map {
            let st = CollabBoard.Stamp($0)
            return "\($0["id"] as? String ?? "?"):\(st.version):\(st.nonce)\(($0["isDeleted"] as? Bool) == true ? ":deleted" : "")"
        }
    }

    static func element(_ id: String, in s: CollabSession) -> [String: Any]? {
        ((s.boardScene()["elements"] as? [[String: Any]]) ?? []).first { $0["id"] as? String == id }
    }

    // MARK: Drawing at once

    /// Sharing a board puts its drawing in the document, and everyone who joins has it, title and all.
    @Test func aSharedBoardReachesEveryoneWhoJoins() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a", x: 10), Self.shape("b", x: 200, index: "a1")])
        let mine = try session(emil, note)
        #expect(mine.isBoard)
        for d in others {
            let theirs = try session(d, note)
            #expect(theirs.isBoard && theirs.text == "Launch plan")
            #expect(Self.said(theirs) == ["a:1:1", "b:1:1"])
            // Their note for it is a board too, with the drawing kept beside it (the list's picture).
            let pointer = try #require(d.context.pointer(forShared: note.id))
            #expect(CanvasNote.isCanvas(NotePageStore.shared[pointer.id]?.html))
            #expect(((NotePageDataStore.shared.doc(pointer.id)["values"] as? [String: Any])?["scene"] as? [String: Any]).map { ($0["elements"] as? [Any])?.count } == 2)
        }
    }

    /// A shared board's row in everyone's list follows the drawing: Sara writes on it and Emil's
    /// row and Ola's say her words, not "Empty whiteboard" (round 13, follow-1 and follow-2).
    @Test func aSharedBoardsListRowFollowsWhatOthersDraw() async throws {
        let (emil, others, note) = try await sharedBoard([])
        let s = try session(others[0], note)
        let ola = try #require(others[1].context.pointer(forShared: note.id))
        #expect(NoteRow.boardPreview(CanvasSketch.of(note.id)) == NoteRow.emptyBoard)
        s.boardLocal([Self.shape("t", x: 20, y: 20, text: "Launch checklist", type: "text")])
        await server.settle()
        await server.eventually { NoteRow.boardPreview(CanvasSketch.of(note.id)) == "Launch checklist" && NoteRow.boardPreview(CanvasSketch.of(ola.id)) == "Launch checklist" }
        #expect(NoteRow.boardPreview(CanvasSketch.of(note.id)) == "Launch checklist", "Emil's row")
        #expect(NoteRow.boardPreview(CanvasSketch.of(ola.id)) == "Launch checklist", "Ola's row")
        // And again when she changes it.
        s.boardLocal([Self.shape("t", x: 20, y: 20, version: 2, nonce: 3, text: "Launch list", type: "text")])
        await server.settle()
        await server.eventually { NoteRow.boardPreview(CanvasSketch.of(note.id)) == "Launch list" }
        #expect(NoteRow.boardPreview(CanvasSketch.of(note.id)) == "Launch list")
        _ = emil
    }

    /// Three people draw at once, each before seeing the others: a new shape each, and two move
    /// different shapes. Every change lands, and all three end with the same board.
    @Test func threePeopleDrawingAtOnceAllEndWithTheSameBoard() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a", x: 10), Self.shape("b", x: 200, index: "a1")])
        let e = try session(emil, note), s = try session(others[0], note), o = try session(others[1], note)
        var seen: [ObjectIdentifier: Int] = [:]
        for x in [e, s, o] { let k = ObjectIdentifier(x); x.onRemoteBoard = { _ in seen[k, default: 0] += 1 } }

        e.boardLocal([Self.shape("emil-1", x: 0, y: 300, index: "a2")])
        s.boardLocal([Self.shape("sara-1", x: 200, y: 300, index: "a3"), Self.shape("a", x: 40, version: 2, nonce: 55)])
        o.boardLocal([Self.shape("ola-1", x: 400, y: 300, index: "a4"), Self.shape("b", x: 260, version: 2, nonce: 9, index: "a1")])
        await server.settle()
        await server.eventually { Self.said(e) == Self.said(s) && Self.said(s) == Self.said(o) && Self.said(e).count == 5 }

        #expect(Self.said(e) == ["a:2:55", "b:2:9", "emil-1:1:1", "sara-1:1:1", "ola-1:1:1"])
        #expect(Self.said(s) == Self.said(e) && Self.said(o) == Self.said(e))
        #expect(Self.element("a", in: o)?["x"] as? Double == 40 && Self.element("b", in: s)?["x"] as? Double == 260)
        // Each open board was handed the merged drawing as others' changes came.
        #expect([e, s, o].allSatisfy { (seen[ObjectIdentifier($0)] ?? 0) > 0 })
        // Every change went up sealed: nothing on the server reads as the drawing.
        #expect((server.updates[note.id] ?? []).allSatisfy { !$0.ct.contains("sara-1") && !$0.ct.contains("rectangle") })
    }

    /// Two people change the same shape at once: every device keeps the same one, by the engine's
    /// own rule. The newer edit wins; two as new, the lower nonce does. A late, older edit doesn't
    /// bring back a shape someone deleted.
    @Test func twoPeopleChangingTheSameShapeAtOnceEndTheSame() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a", x: 10)], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)

        // As new as each other: the lower nonce, on both.
        e.boardLocal([Self.shape("a", x: 100, version: 2, nonce: 900)])
        s.boardLocal([Self.shape("a", x: 50, version: 2, nonce: 300)])
        await server.settle()
        await server.eventually { Self.said(e) == Self.said(s) && Self.said(e) == ["a:2:300"] }
        #expect(Self.element("a", in: e)?["x"] as? Double == 50 && Self.element("a", in: s)?["x"] as? Double == 50)

        // One dragged it further (version 4) while the other changed it once (version 3): the newer.
        e.boardLocal([Self.shape("a", x: 300, version: 4, nonce: 800)])
        s.boardLocal([Self.shape("a", x: 70, version: 3, nonce: 1)])
        await server.settle()
        await server.eventually { Self.said(e) == Self.said(s) && Self.said(e) == ["a:4:800"] }
        #expect(Self.element("a", in: s)?["x"] as? Double == 300)

        // Emil deletes it; Sara's page, behind, sends an older edit of it: it stays deleted.
        var gone = Self.shape("a", x: 300, version: 5, nonce: 2)
        gone["isDeleted"] = true
        e.boardLocal([gone])
        await server.eventually { Self.said(s) == ["a:5:2:deleted"] }
        s.boardLocal([Self.shape("a", x: 70, version: 4, nonce: 1)])
        await server.settle()
        #expect(Self.said(e) == ["a:5:2:deleted"] && Self.said(s) == ["a:5:2:deleted"])
    }

    /// An edit that lost to the document's (the page hadn't merged someone else's yet) sends the
    /// page the document's drawing, so it doesn't keep showing its own.
    @Test func aLosingEditIsCorrectedOnThePage() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a", x: 10)], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        s.boardLocal([Self.shape("a", x: 50, version: 3, nonce: 4)])
        await server.eventually { Self.said(e) == ["a:3:4"] }
        var handed: [[String: Any]] = []
        e.onRemoteBoard = { handed.append($0) }
        e.boardLocal([Self.shape("a", x: 99, version: 2, nonce: 1)])
        #expect(Self.said(e) == ["a:3:4"])
        #expect(handed.count == 1 && ((handed[0]["elements"] as? [[String: Any]])?.first?["x"] as? Double) == 50)
    }

    /// The board's colour goes with the drawing.
    @Test func theBackgroundIsShared() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        e.boardLocal([], settings: ["viewBackgroundColor": "#fdf8e8", "gridModeEnabled": true])
        await server.eventually { (s.boardScene()["appState"] as? [String: Any])?["viewBackgroundColor"] as? String == "#fdf8e8" }
        let state = try #require(s.boardScene()["appState"] as? [String: Any])
        #expect(state["viewBackgroundColor"] as? String == "#fdf8e8" && state["gridModeEnabled"] as? Bool == true)
    }

    // MARK: Viewers

    /// Someone with a View link sees the board and every change, and can't change it: nothing of
    /// theirs goes into the document or to the server, and their board is in view mode.
    @Test func aViewerSeesTheBoardButCantDrawOnIt() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], access: .view, people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        #expect(!s.canWrite)
        let before = server.updates[note.id]?.count ?? 0
        s.boardLocal([Self.shape("sara-1", index: "a1")])
        await server.settle()
        #expect(Self.said(s) == ["a:1:1"] && (server.updates[note.id]?.count ?? 0) == before)

        e.boardLocal([Self.shape("emil-1", index: "a1")])
        await server.eventually { Self.said(s) == ["a:1:1", "emil-1:1:1"] }

        let canvas = CanvasController()
        BoardCollab.wire(s, canvas)
        #expect(canvas.shared && canvas.viewOnly)
        #expect(canvas.sent.contains(.shared(on: true, viewOnly: true)))
        // The page's changes go nowhere.
        canvas.receive(["board": ["elements": [Self.shape("sara-2", index: "a2")], "settings": [String: Any]()]])
        #expect(Self.said(s) == ["a:1:1", "emil-1:1:1"])
        BoardCollab.unwire(s, canvas)
        #expect(!canvas.shared && canvas.sent.last == .peers([]))
    }

    // MARK: Presence

    /// Each person's pointer and selection reach the others, in the board's own coordinates, with
    /// their first name and colour; grey and without a name once they go quiet.
    @Test func pointersAndSelectionsReachTheOthers() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a"), Self.shape("b", x: 200, index: "a1")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        var drawn: [[BoardPeer]] = []
        e.onBoardPeers = { drawn.append($0) }
        s.boardPresence(pointer: CGPoint(x: 140.5, y: -32), selection: ["b"])
        await server.eventually { e.boardPeers.first?.pointer != nil }

        let sara = try #require(e.boardPeers.first)
        #expect(e.boardPeers.count == 1 && sara.name == "Sara" && sara.id == others[0].id)
        #expect(sara.pointer == CGPoint(x: 140.5, y: -32) && sara.selection == ["b"] && sara.showsName)
        #expect(sara.color == CollabSession.hex(CollabSession.palette[e.paletteSlot(of: others[0].id)].light))
        #expect(sara.dark == CollabSession.hex(CollabSession.palette[e.paletteSlot(of: others[0].id)].dark), "and its dark shade for a dark board")
        #expect(sara.payload["dark"] as? String == sara.dark)
        #expect(!drawn.isEmpty, "handed to the open board as it came")
        #expect(sara.payload["x"] as? Double == 140.5 && sara.payload["sel"] as? [String] == ["b"] && sara.payload["flag"] as? Bool == true)

        let quiet = try #require(e.boardPeers(at: .now.addingTimeInterval(CollabSession.Peer.staleAfter + 1)).first)
        #expect(quiet.color == "#8E8E93" && !quiet.showsName)
        // Their name flag fades a moment after they stop moving, as a caret's does.
        #expect(e.boardPeers(at: .now.addingTimeInterval(RemoteCaret.flagFor + 0.5)).first?.showsName == false)

        // Off the board and nothing selected: they're not drawn.
        s.boardPresence(pointer: nil, selection: [])
        await server.eventually { e.boardPeers.isEmpty }
        #expect(e.boardPeers.isEmpty)
    }

    /// `count` account ids that all pick the same colour from their id alone.
    static func idsWithOneColour(_ count: Int) -> [UUID] {
        let first = UUID()
        var ids = [first]
        while ids.count < count {
            let id = UUID()
            if CollabSession.paletteIndex(for: id) == CollabSession.paletteIndex(for: first) { ids.append(id) }
        }
        return ids
    }

    /// No two people in a note or board share a colour (Emil and Sara were both olive): two whose
    /// ids pick the same one get two, six get six, the owner keeps the one their id picks, and
    /// past six it's the id's again.
    @Test func noTwoPeopleShareAColour() {
        let two = Self.idsWithOneColour(2)
        let slots = CollabSession.slots(for: two)
        #expect(slots[two[0]] != nil && slots[two[1]] != nil && slots[two[0]] != slots[two[1]], "two people, two colours: \(slots)")
        #expect(slots[two[0]] == Int(CollabSession.paletteIndex(for: two[0])), "the owner keeps their own")
        let six = Self.idsWithOneColour(6)
        #expect(Set(CollabSession.slots(for: six).values).count == 6, "six with one colour get six")
        var shared = 0
        for _ in 0..<500 {
            let pair = [UUID(), UUID()], group = (0..<6).map { _ in UUID() }
            let p = CollabSession.slots(for: pair), g = CollabSession.slots(for: group)
            if p[pair[0]] == p[pair[1]] || Set(group.compactMap { g[$0] }).count != 6 { shared += 1 }
        }
        #expect(shared == 0, "random pairs and groups of six never share a colour")
        // Given in order: the same list gives the same colours, wherever it's worked out.
        #expect(CollabSession.slots(for: six) == CollabSession.slots(for: six))
        let seventh = UUID()
        #expect(CollabSession.slots(for: six + [seventh])[seventh] == nil, "a seventh: the colour their id picks")
    }

    /// People's colours stay clear of the app's accent, which marks your own selection and AI
    /// edits (round 10, board-collab: Sara's clay outline looked like Emil's own selection), and
    /// each person reads as one colour in light and dark (Emil was slate blue in one, mauve in the
    /// other). Six hues, each 60° or more from both shades of the accent and 25° or more from the
    /// next, in light and dark; a person's two shades the same hue; white initials readable on
    /// both; the light shade clear on a white board, the dark one on a black board.
    @Test func peoplesColoursStayClearOfTheAccentAndKeepTheirHueInTheDark() {
        func rgb(_ c: UInt32) -> (Double, Double, Double) { (Double(c >> 16 & 0xFF) / 255, Double(c >> 8 & 0xFF) / 255, Double(c & 0xFF) / 255) }
        func hue(_ c: UInt32) -> Double {
            let (r, g, b) = rgb(c), mx = max(r, g, b), mn = min(r, g, b), d = mx - mn
            guard d > 0 else { return 0 }
            let h = mx == r ? (g - b) / d : mx == g ? (b - r) / d + 2 : (r - g) / d + 4
            return (h * 60 + 360).truncatingRemainder(dividingBy: 360)
        }
        func apart(_ a: Double, _ b: Double) -> Double { let d = abs(a - b).truncatingRemainder(dividingBy: 360); return min(d, 360 - d) }
        func luminance(_ c: UInt32) -> Double {
            let (r, g, b) = rgb(c)
            func lin(_ v: Double) -> Double { v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
        }
        func contrast(_ a: UInt32, _ b: UInt32) -> Double { let x = luminance(a), y = luminance(b); return (max(x, y) + 0.05) / (min(x, y) + 0.05) }
        let accent = [Palette.Accent.amber.light, Palette.Accent.amber.dark]
        let pal = CollabSession.palette
        #expect(pal.count == 6)
        #expect(!pal.contains { $0.light == 0xA85A3C || $0.dark == 0xA85A3C }, "no clay")
        for (i, p) in pal.enumerated() {
            for shade in [p.light, p.dark] {
                let fromAccent = accent.map { apart(hue(shade), hue($0)) }.min() ?? 0
                #expect(fromAccent >= 60, "colour \(i) #\(String(shade, radix: 16)) is \(Int(fromAccent))° from the accent")
                #expect(contrast(shade, 0xFFFFFF) >= 4.5, "white initials on colour \(i) #\(String(shade, radix: 16)): \(contrast(shade, 0xFFFFFF))")
            }
            #expect(apart(hue(p.light), hue(p.dark)) <= 3, "colour \(i) is one hue in light and dark: \(hue(p.light)) and \(hue(p.dark))")
            #expect(luminance(p.dark) > luminance(p.light), "colour \(i) is lighter on black")
            #expect(contrast(p.light, 0xFFFFFF) >= 4.5 && contrast(p.dark, 0x000000) >= 4.4, "colour \(i) clear on a white board and on a black one")
        }
        for mode in [\(light: UInt32, dark: UInt32).light, \.dark] {
            let hues = pal.map { hue($0[keyPath: mode]) }
            for a in hues.indices { for b in hues.indices where b > a {
                #expect(apart(hues[a], hues[b]) >= 25, "colours \(a) and \(b) are \(Int(apart(hues[a], hues[b])))° apart")
            } }
        }
        #if os(macOS)
        // As the app draws them: the light shade in light mode, the dark one in dark mode.
        for (i, p) in pal.enumerated() {
            for (name, want) in [(NSAppearance.Name.aqua, p.light), (.darkAqua, p.dark)] {
                var got: UInt32 = 0
                NSAppearance(named: name)?.performAsCurrentDrawingAppearance {
                    if let c = NSColor(CollabSession.color(at: i)).usingColorSpace(.sRGB) {
                        got = UInt32((c.redComponent * 255).rounded()) << 16 | UInt32((c.greenComponent * 255).rounded()) << 8 | UInt32((c.blueComponent * 255).rounded())
                    }
                }
                #expect(got == want, "colour \(i) in \(name.rawValue): #\(String(got, radix: 16)), not #\(String(want, radix: 16))")
            }
        }
        #endif
    }

    /// Six people on one board whose ids all pick one colour: each has their own, the owner's is
    /// the one their id picks, and each person is the same colour on all six devices, in their
    /// pointer on the board, their avatar and their row in Share.
    @Test func everyoneOnABoardHasTheirOwnColourOnEveryDevice() async throws {
        let ids = Self.idsWithOneColour(6)
        let names = ["Emil", "Sara", "Ola", "Mia", "Leo", "Ida"]
        let emil = try people.device(server.account(names[0], id: ids[0]), name: names[0])
        let note = CanvasNote.make(in: .all, context: emil.context, scene: Self.scene([Self.shape("a")]), named: "Launch plan")
        try await emil.store.setAccess(.edit, for: note)
        let url = try #require(emil.store.linkURL(note))
        var devices = [emil]
        for i in 1..<6 {
            let d = try people.device(server.account(names[i], id: ids[i]), name: names[i])
            #expect(await d.store.join(url))
            devices.append(d)
        }
        await server.eventually { server.channelCount(note.id) == 6 }
        let sessions = try devices.map { try session($0, note) }
        await server.eventually { sessions.allSatisfy { $0.members.count == 6 } }
        #expect(sessions.allSatisfy { $0.members.count == 6 }, "everyone's members loaded")

        let colours = sessions.map { s in ids.map { s.paletteSlot(of: $0) } }
        #expect(Set(colours[0]).count == 6, "six people, six colours: \(colours[0])")
        #expect(colours.allSatisfy { $0 == colours[0] }, "the same on every device: \(colours)")
        #expect(colours[0][0] == Int(CollabSession.paletteIndex(for: ids[0])), "the owner keeps theirs")

        // Everyone's pointer on Emil's board, each in their own colour.
        for (i, s) in sessions.enumerated().dropFirst() { s.boardPresence(pointer: CGPoint(x: Double(i) * 40, y: 10), selection: []) }
        await server.eventually { sessions[0].boardPeers.count == 5 }
        let drawn = sessions[0].boardPeers
        #expect(drawn.count == 5 && Set(drawn.map(\.color)).count == 5, "five pointers, five colours: \(drawn.map(\.color))")
        for p in drawn {
            let i = try #require(ids.firstIndex(of: p.id))
            #expect(p.color == CollabSession.hex(CollabSession.palette[colours[0][i]].light), "\(p.name)'s pointer in their colour")
        }
        // Their avatars and their rows in Share, on every device.
        for (d, s) in zip(devices, sessions) {
            let mine = try #require(d.id == ids[0] ? note : d.context.pointer(forShared: note.id))
            let rows = d.store.shareState(for: mine).people
            #expect(rows.count == 6)
            for row in rows {
                let i = try #require(ids.firstIndex(of: row.id))
                #expect(PersonRow.color(row) == CollabSession.color(at: colours[0][i]), "\(row.name)'s row on \(d.id == ids[0] ? "Emil's" : "another") device")
                #expect(s.color(of: row.id) == PersonRow.color(row), "avatar and row agree")
            }
        }
    }

    // MARK: Pictures

    /// A picture as the board keeps it: `bytes` of data (a 1×1 PNG when 0).
    static func picture(_ id: String, bytes: Int = 0) -> [String: Any] {
        let b64 = bytes == 0 ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            : Data((0..<bytes).map { UInt8(truncatingIfNeeded: $0 &* 31) }).base64EncodedString()
        return ["id": id, "dataURL": "data:image/png;base64," + b64, "mimeType": "image/png", "created": 1]
    }

    /// An image element showing the picture `file`.
    static func image(_ id: String, file: String, index: String = "a1", deleted: Bool = false) -> [String: Any] {
        var e = shape(id, x: 300, index: index, type: "image")
        e["fileId"] = file
        e["status"] = "saved"
        e["scale"] = [1, 1]
        if deleted { e["isDeleted"] = true }
        return e
    }

    /// Someone puts a picture on the board, as the open board hands it over: its element and its bytes.
    static func put(_ s: CollabSession, _ element: [String: Any], _ picture: [String: Any]) {
        s.offerPictures([picture["id"] as! String: picture])
        s.boardLocal([element])
    }

    static func has(_ s: CollabSession, _ file: String, _ picture: [String: Any]) -> Bool {
        s.pictures[file]?["dataURL"] as? String == picture["dataURL"] as? String
    }

    /// One person pastes a picture: everyone on the board gets the element and the picture, the
    /// bytes go up sealed under the note key before the change that shows them, and neither the
    /// stored picture nor any change reads as it.
    @Test func aPictureOnePersonPutsOnTheBoardReachesEveryone() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")])
        let e = try session(emil, note), s = try session(others[0], note), o = try session(others[1], note)
        let photo = Self.picture("Photo-1aB")
        let canvas = CanvasController()
        BoardCollab.wire(e, canvas)
        let mark = server.calls.count
        // Through the open board, as a paste reaches the app: the element and the picture with it.
        canvas.receive(["board": ["elements": [Self.image("pic", file: "Photo-1aB")], "settings": [String: Any](), "files": ["Photo-1aB": photo]]])
        await server.eventually { Self.has(s, "Photo-1aB", photo) && Self.has(o, "Photo-1aB", photo) }
        #expect(Self.has(s, "Photo-1aB", photo) && Self.has(o, "Photo-1aB", photo))
        #expect(Self.said(s) == ["a:1:1", "pic:1:1"] && Self.said(o) == Self.said(e))
        // The bytes first, then the change that shows them.
        #expect(server.calls.dropFirst(mark).first { $0 == "put_file" || $0 == "update" } == "put_file")
        let stored = try #require(server.files[note.id]?["Photo-1aB"])
        #expect(stored.epoch == 1 && stored.ct.hasPrefix("amb3f.1.") && stored.author == emil.id)
        let b64 = String((photo["dataURL"] as! String).split(separator: ",")[1])
        #expect(!stored.ct.contains(b64))
        #expect((server.updates[note.id] ?? []).allSatisfy { !$0.ct.contains(b64) && !$0.ct.contains("Photo-1aB") })
        // The board that pasted it isn't handed the picture back; the others' boards get it.
        let sara = CanvasController()
        BoardCollab.wire(s, sara)
        guard case .remoteScene(let json)? = sara.sent.last(where: { if case .remoteScene = $0 { true } else { false } }),
              let scene = try JSONSerialization.jsonObject(with: json) as? [String: Any] else { Issue.record("no scene for Sara's board"); return }
        #expect(((scene["files"] as? [String: Any])?["Photo-1aB"] as? [String: Any])?["dataURL"] as? String == photo["dataURL"] as? String)
        #expect(canvas.pageFiles.contains("Photo-1aB"))
        canvas.remote(scene: e.boardScene())
        guard case .remoteScene(let mine)? = canvas.sent.last, let back = try JSONSerialization.jsonObject(with: mine) as? [String: Any] else { Issue.record("no scene"); return }
        #expect(((back["files"] as? [String: Any]) ?? [:]).isEmpty, "the page has it already")
        // Kept beside the note on each device, for the list and for opening it offline.
        await server.eventually {
            let kept = (NotePageDataStore.shared.doc(others[0].context.pointer(forShared: note.id)?.id ?? UUID())["values"] as? [String: Any])?["scene"] as? [String: Any]
            return (kept?["files"] as? [String: Any])?["Photo-1aB"] != nil
        }
        let pointer = try #require(others[0].context.pointer(forShared: note.id))
        let kept = (NotePageDataStore.shared.doc(pointer.id)["values"] as? [String: Any])?["scene"] as? [String: Any]
        #expect(((kept?["files"] as? [String: Any])?["Photo-1aB"] as? [String: Any])?["dataURL"] as? String == photo["dataURL"] as? String)
        BoardCollab.unwire(e, canvas)
        BoardCollab.unwire(s, sara)
    }

    /// A picture whose bytes aren't there yet when its element arrives: the board shows the element
    /// and asks for the picture again a little later, until it's there.
    @Test func aPictureNotThereYetIsFetchedWhenItIs() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        server.holdFiles = true
        Self.put(e, Self.image("pic", file: "late"), Self.picture("late"))
        await server.eventually { Self.said(s) == ["a:1:1", "pic:1:1"] }
        try await Task.sleep(for: .milliseconds(200))
        #expect(Self.said(s) == ["a:1:1", "pic:1:1"] && s.pictures["late"] == nil)
        let asked = server.calls.filter { $0 == "file" }.count
        server.holdFiles = false
        for _ in 0..<150 where s.pictures["late"] == nil { try await Task.sleep(for: .milliseconds(20)) }
        #expect(Self.has(s, "late", Self.picture("late")))
        #expect(server.calls.filter { $0 == "file" }.count > asked, "asked again, later")
    }

    /// A viewer sees the pictures on the board but can't put one there: not through the session,
    /// not through the server, and the open board says so.
    @Test func aViewerSeesPicturesButCantAddThem() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], access: .view, people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        Self.put(e, Self.image("pic", file: "f1"), Self.picture("f1"))
        await server.eventually { Self.has(s, "f1", Self.picture("f1")) }
        #expect(Self.has(s, "f1", Self.picture("f1")))

        Self.put(s, Self.image("hers", file: "f2", index: "a2"), Self.picture("f2"))
        await server.settle()
        #expect(Self.said(s) == ["a:1:1", "pic:1:1"] && server.files[note.id]?["f2"] == nil)
        let sealed = try CollabBoard.Pictures.seal(Self.picture("f2"), nk: SymmetricKey(size: .bits256), note: note.id, epoch: 1)
        await #expect(throws: Collab.Failure.readOnly) { try await server.transport(for: others[0].id).putFile(note: note.id, id: "f2", epoch: 1, ct: sealed) }

        let canvas = CanvasController()
        BoardCollab.wire(s, canvas)
        canvas.send(.image(CanvasImage(dataURL: Self.picture("f3")["dataURL"] as! String, mimeType: "image/png", width: 1, height: 1), at: nil))
        #expect(!canvas.sent.contains { if case .image = $0 { true } else { false } })
        #expect(canvas.notice == CollabBoard.Pictures.viewOnly)
        #expect(!CollabBoard.Pictures.viewOnly.contains("\u{2014}"))
        BoardCollab.unwire(s, canvas)
    }

    /// A board with pictures can be shared: its pictures go up with it, and whoever joins has them.
    /// A deleted picture doesn't count, and doesn't go.
    @Test func aBoardWithPicturesIsSharedWithThem() async throws {
        var scene = Self.scene([Self.shape("a"), Self.image("pic", file: "f1"), Self.image("old", file: "gone", index: "a2", deleted: true)])
        scene["files"] = ["f1": Self.picture("f1"), "gone": Self.picture("gone")]
        // The Share controls don't hold it back.
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let photo = CanvasNote.make(in: .all, context: container.mainContext, scene: scene)
        let alone = ShareState(people: [.init(id: UUID(), name: "Emil Wagman", isMe: true, role: "owner")])
        #expect(ShareController(note: photo, backend: SampleShare(alone)).notYet == nil)
        #expect(SharedNoteLimits.notYet(text: "Habits", hasApp: true, board: false, alreadyShared: false) == SharedNoteLimits.appLine)

        let (emil, others, note) = try await people.share(scene, people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        await server.eventually { Self.has(s, "f1", Self.picture("f1")) }
        #expect(Self.has(s, "f1", Self.picture("f1")))
        #expect(Set(server.files[note.id]?.keys.map { $0 } ?? []) == ["f1"])
        #expect(s.pictures["gone"] == nil)
        // Emil brings the deleted one back (Undo): its bytes go up from his copy, and Sara has it.
        e.boardLocal([Self.image("old", file: "gone", index: "a2").merging(["version": 2, "versionNonce": 5]) { _, b in b }])
        await server.eventually { Self.has(s, "gone", Self.picture("gone")) }
        #expect(Self.has(s, "gone", Self.picture("gone")) && Self.said(s) == ["a:1:1", "pic:1:1", "old:2:5"])
    }

    /// Someone is removed: the board's pictures are sealed again under the new key, so whoever
    /// joins after opens them, the server gives the removed person none, and their key opens none.
    @Test func removingSomeoneSealsThePicturesAgainForWhoeverStays() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")])
        let e = try session(emil, note), s = try session(others[0], note), o = try session(others[1], note)
        Self.put(s, Self.image("pic", file: "f1"), Self.picture("f1"))
        await server.eventually { Self.has(e, "f1", Self.picture("f1")) && Self.has(o, "f1", Self.picture("f1")) }
        let olaRow = try #require(try await server.transport(for: others[1].id).memberships().first { $0.note_id == note.id })
        let olaKey = try await others[1].store.openKey(olaRow).nk

        try await emil.store.remove(others[1].id, from: note)
        await server.eventually { e.epoch == 2 && server.files[note.id]?["f1"]?.epoch == 2 }
        let stored = try #require(server.files[note.id]?["f1"])
        #expect(stored.epoch == 2 && stored.ct.hasPrefix("amb3f.2.") && stored.author == others[0].id, "sealed again, still Sara's")
        #expect(throws: (any Error).self) { try CollabCrypto.open(.file, stored.ct, nk: olaKey, note: note.id, extra: "f1") }
        #expect(try await server.transport(for: others[1].id).file(note: note.id, id: "f1") == nil)
        #expect(try await server.transport(for: others[1].id).files(of: note.id).isEmpty)

        // Lin joins with the new link: only the new key, and the picture opens.
        let url = try #require(emil.store.linkURL(note))
        let lin = try people.device(server.account("Lin"), name: "Lin")
        #expect(await lin.store.join(url))
        let l = try session(lin, note)
        await server.eventually { Self.has(l, "f1", Self.picture("f1")) }
        #expect(Self.has(l, "f1", Self.picture("f1")))
        // Sara stays, and still has it; what she adds now goes under the new key.
        await server.eventually { s.epoch == 2 }
        #expect(Self.has(s, "f1", Self.picture("f1")))
        Self.put(s, Self.image("pic2", file: "f2", index: "a2"), Self.picture("f2", bytes: 64))
        await server.eventually { Self.has(l, "f2", Self.picture("f2", bytes: 64)) }
        #expect(server.files[note.id]?["f2"]?.epoch == 2)
    }

    /// The person who put a picture there is removed, and the owner's device never fetched it: it's
    /// sealed again from the stored copy, so it stays on the board for whoever stays and joins.
    @Test func aRemovedPersonsPictureStaysForEveryoneElse() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        server.holdFiles = true
        let mark = server.calls.count
        Self.put(s, Self.image("pic", file: "f1"), Self.picture("f1"))
        await server.eventually { Self.said(e).count == 2 && server.calls.dropFirst(mark).contains("file") }
        #expect(e.pictures["f1"] == nil)
        server.holdFiles = false
        try await emil.store.remove(others[0].id, from: note)
        await server.eventually { server.files[note.id]?["f1"]?.epoch == 2 }
        let stored = try #require(server.files[note.id]?["f1"])
        #expect(stored.epoch == 2 && stored.author == others[0].id)
        let row = try #require(try await server.transport(for: emil.id).memberships().first { $0.note_id == note.id })
        #expect(row.epoch == 2)
        let nk = try await emil.store.openKey(row).nk
        #expect(try CollabBoard.Pictures.open(Collab.File(file_id: "f1", epoch: 2, ct: stored.ct), keys: [2: nk], note: note.id)["dataURL"] as? String
                == Self.picture("f1")["dataURL"] as? String)
    }

    /// A picture too big for the board's room (4 MB of pictures in use, as on a board of your own)
    /// stays off it, and the board says why; one that fits goes on.
    @Test func aPictureTooBigForTheBoardStaysOffWithAReason() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        var refused: [([String], String)] = []
        e.onPicturesRefused = { refused.append(($0, $1)) }
        let big = Self.picture("big", bytes: 2_400_000), bigger = Self.picture("bigger", bytes: 2_400_000)
        Self.put(e, Self.image("p1", file: "big"), big)
        await server.eventually { Self.has(s, "big", big) }
        Self.put(e, Self.image("p2", file: "bigger", index: "a2"), bigger)
        await server.settle()
        #expect(refused.count == 1 && refused.first?.0 == ["p2"] && refused.first?.1 == CollabBoard.Pictures.tooBig)
        #expect(Self.said(e) == ["a:1:1", "p1:1:1"] && server.files[note.id]?["bigger"] == nil)
        #expect(!CollabBoard.Pictures.tooBig.contains("\u{2014}"))
        // A picture with no bytes at all doesn't go on either.
        e.boardLocal([Self.image("p3", file: "nothing", index: "a3")])
        #expect(refused.last?.0 == ["p3"] && refused.last?.1 == CollabBoard.Pictures.notThere)
        // Once the first is deleted, there's room.
        e.boardLocal([Self.image("p1", file: "big", deleted: true).merging(["version": 2, "versionNonce": 9]) { _, b in b }])
        Self.put(e, Self.image("p2", file: "bigger", index: "a2"), bigger)
        await server.eventually { Self.has(s, "bigger", bigger) }
        #expect(Self.said(s) == ["a:1:1", "p1:2:9:deleted", "p2:1:1"])
    }

    /// The server has no room for the picture (the board's 32 MB): it comes off the board again for
    /// everyone, and the board says why.
    @Test func aPictureTheServerHasNoRoomForComesOff() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        var refused: [String] = []
        e.onPicturesRefused = { refused.append($1) }
        server.filesRoom = 1000
        Self.put(e, Self.image("pic", file: "f1"), Self.picture("f1", bytes: 2000))
        await server.eventually { e.unsent == 0 && Self.said(s).count == 2 }
        #expect(refused == [CollabBoard.Pictures.tooBig])
        #expect(server.files[note.id]?["f1"] == nil)
        #expect(Self.said(e).last?.hasSuffix(":deleted") == true && Self.said(s) == Self.said(e))
        #expect(e.pictures["f1"] == nil)
    }

    /// A picture that's on the board but never reached the server (the app quit first): the next
    /// look at the server sends it, from the copy kept beside the note.
    @Test func aPictureThatNeverWentUpGoesAtTheNextCheck() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        Self.put(e, Self.image("pic", file: "f1"), Self.picture("f1"))
        await server.eventually { server.files[note.id]?["f1"] != nil && Self.said(s).count == 2 }
        server.forgetFile(note: note.id, id: "f1")
        await e.syncPictures().value
        await server.eventually { server.files[note.id]?["f1"] != nil }
        #expect(server.files[note.id]?["f1"]?.epoch == 1)
        // A device that has it only beside the note (opened offline, say) has it for the board.
        server.holdFiles = true
        let fresh = try await CollabSession.load(record: SharedDocument(id: note.id, epoch: 1, role: "editor", saved: Data()),
                                                 nk: try await emil.store.openKey(try #require(try await server.transport(for: emil.id).memberships().first { $0.note_id == note.id })).nk,
                                                 transport: server.transport(for: emil.id), me: emil.id, name: "Emil")
        fresh.seedPictures(["f1": Self.picture("f1"), "f9": Self.picture("f9")])
        #expect(Self.has(fresh, "f1", Self.picture("f1")))
        // The board is handed the pictures it shows, and only those.
        #expect(((fresh.boardScene()["files"] as? [String: Any]) ?? [:]).keys.sorted() == ["f1"])
        fresh.close()
        server.holdFiles = false
    }

    /// A board that stops being shared keeps its pictures with its drawing, as the owner's own;
    /// any the owner's device hasn't fetched yet are fetched first.
    @Test func aBoardThatStopsBeingSharedKeepsItsPictures() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        server.holdFiles = true
        Self.put(s, Self.image("pic", file: "f1"), Self.picture("f1"))
        await server.eventually { Self.said(e).count == 2 }
        #expect(e.pictures["f1"] == nil)
        server.holdFiles = false
        await e.picturesReady()
        #expect(Self.has(e, "f1", Self.picture("f1")))
        try #require(emil.store.library).removeLocally(note)
        let scene = try #require((NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any])
        #expect(((scene["elements"] as? [[String: Any]]) ?? []).compactMap { $0["id"] as? String } == ["a", "pic"])
        #expect(((scene["files"] as? [String: Any])?["f1"] as? [String: Any])?["dataURL"] as? String == Self.picture("f1")["dataURL"] as? String)
    }

    /// A board too big for one snapshot isn't shared: nobody could open it.
    @Test func theDrawingCountsTowardsTheSizeLimit() throws {
        let small = try CollabText.sealedSnapshotSize(of: "Launch plan")
        // Each with words of its own (the document compresses what repeats).
        let drawn = try CollabText.sealedSnapshotSize(of: "Launch plan", scene: Self.scene((0..<50).map { Self.shape("s\($0)", x: Double($0) * 10, index: "a\($0)", text: UUID().uuidString + UUID().uuidString) }))
        #expect(drawn > small + 50 * 50, "\(small) → \(drawn)")
    }

    // MARK: The open board

    /// The open board joined to the session: the page's changes go into the document, others'
    /// come back as the whole drawing, the others' pointers are sent when they change, and a page
    /// that loads again is told it all again.
    @Test func theOpenBoardIsJoinedToItsSession() async throws {
        let (emil, others, note) = try await sharedBoard([Self.shape("a")], people: ["Sara"])
        let e = try session(emil, note), s = try session(others[0], note)
        let canvas = CanvasController()
        BoardCollab.wire(e, canvas)
        #expect(canvas.shared && !canvas.viewOnly)
        #expect(canvas.sent.prefix(2).first == .shared(on: true, viewOnly: false))
        #expect(canvas.sent.contains { if case .remoteScene = $0 { true } else { false } })

        // The page drew: into the document, and to Sara.
        canvas.receive(["board": ["elements": [Self.shape("emil-1", index: "a1")], "settings": ["viewBackgroundColor": "#ffffff"]]])
        await server.eventually { Self.said(s) == ["a:1:1", "emil-1:1:1"] }
        #expect(Self.said(s) == ["a:1:1", "emil-1:1:1"])

        // Sara drew: the page is handed the merged drawing.
        var mark = canvas.sent.count
        s.boardLocal([Self.shape("sara-1", index: "a2")])
        await server.eventually { canvas.sent.dropFirst(mark).contains { if case .remoteScene = $0 { true } else { false } } }
        guard case .remoteScene(let json)? = canvas.sent.dropFirst(mark).last(where: { if case .remoteScene = $0 { true } else { false } }),
              let scene = try JSONSerialization.jsonObject(with: json) as? [String: Any] else { Issue.record("no scene sent"); return }
        #expect(((scene["elements"] as? [[String: Any]]) ?? []).compactMap { $0["id"] as? String } == ["a", "emil-1", "sara-1"])

        // Your pointer, from the page, to Sara.
        canvas.receive(["presence": ["pointer": [12.5, 40], "sel": ["emil-1"]]])
        await server.eventually { s.boardPeers.first?.pointer == CGPoint(x: 12.5, y: 40) }
        #expect(s.boardPeers.first?.selection == ["emil-1"])
        // Sara's, to the page.
        s.boardPresence(pointer: CGPoint(x: 5, y: 6), selection: [])
        await server.eventually { canvas.peers.first?.pointer == CGPoint(x: 5, y: 6) }
        #expect(canvas.sent.last == .peers(canvas.peers))

        // The page loaded again (its web content went away): told again.
        canvas.receive(["load": "first", "tool": "selection"])
        mark = canvas.sent.count
        canvas.receive(["load": "second", "tool": "selection"])
        let told = Array(canvas.sent.dropFirst(mark))
        #expect(told.first == .shared(on: true, viewOnly: false))
        #expect(told.contains { if case .remoteScene = $0 { true } else { false } } && told.last == .peers(canvas.peers))
        BoardCollab.unwire(e, canvas)
        #expect(!canvas.shared)
    }

    /// A card on a shared board for one of the owner's notes: someone without that note gets a
    /// plain line when they open it, and their board doesn't rewrite the card.
    @Test func aCardForANoteYouDontHaveSaysSo() {
        let canvas = CanvasController()
        canvas.cardInfo = { _ in [:] }
        canvas.share(true)
        canvas.openCard(UUID().uuidString)
        #expect(canvas.notice == "This note isn\u{2019}t shared with you")
    }
}

/// An AI drawing on a shared board through the file tools, through the library (SharedLibrary) and
/// the fake server, as in SharedLibraryTests: it lands like anyone's, and is marked as an AI's.
@MainActor @Suite struct SharedBoardAITests {
    let server = FakeCollabServer()
    let owner = UUID(uuidString: "0A000000-0000-4000-8000-0000000000B1")!
    let member = UUID(uuidString: "0A000000-0000-4000-8000-0000000000B2")!
    let nk = SymmetricKey(size: .bits256)
    let dataKeys: [UUID: SymmetricKey]

    init() {
        dataKeys = [owner: SymmetricKey(size: .bits256), member: SymmetricKey(size: .bits256)]
        server.names = [owner: "Emil Wagman", member: "Sara Lind"]
    }

    struct Device {
        let context: ModelContext
        let transport: FakeCollabTransport
        let library: SharedLibrary
    }

    func device(_ user: UUID) throws -> Device {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = ModelContext(c)
        let transport = FakeCollabTransport(server: server, me: user)
        let key = dataKeys[user]!, nk = self.nk
        let library = SharedLibrary(context: context, transport: transport, name: user == owner ? "Emil" : "Sara", dataKey: { key }, openKey: { _ in nk })
        return Device(context: context, transport: transport, library: library)
    }

    func waitUntil(_ seconds: Double = 5, _ done: () -> Bool) async {
        let end = Date.now.addingTimeInterval(seconds)
        while !done(), Date.now < end { try? await Task.sleep(for: .milliseconds(20)) }
    }

    /// Emil's board, shared; Sara in it on her phone.
    func board(_ elements: [[String: Any]]) async throws -> (emil: Device, phone: Device, note: Note, mine: Note, e: CollabSession, s: CollabSession) {
        let emil = try device(owner)
        let note = CanvasNote.make(in: .all, context: emil.context, scene: SharedBoardTests.scene(elements), named: "Launch plan")
        try await emil.transport.share(note: note.id, keyWrap: "amb3k.AA==", selfWrap: "", head: "")
        let e = try await emil.library.becomeShared(note, nk: nk)
        server.add(member, to: note.id)
        await e.refreshMembers()
        let phone = try device(member)
        let mine = try await phone.library.adopt(shared: note.id, nk: nk, epoch: 1, role: "editor")
        let s = try #require(phone.library.session(for: mine))
        return (emil, phone, note, mine, e, s)
    }

    /// Her AI draws two shapes through the server: on her phone it's outlined as "Claude", her
    /// own; on Emil's as "Sara's Claude". Both get the "drew" line with Undo, from the drawing
    /// before it.
    @Test func anAIsDrawingLandsAndIsMarked() async throws {
        let (emil, phone, note, mine, e, s) = try await board([SharedBoardTests.shape("a")])
        var outlined: [(String, [String])] = []
        s.onBoardAI = { outlined.append(($0, $1)) }
        var outlinedHere: [(String, [String])] = []
        e.onBoardAI = { outlinedHere.append(($0, $1)) }

        try server.aiDraws(note.id, as: member, ai: "Claude", nk: nk, [SharedBoardTests.shape("ai-1", y: 200, index: "a1", text: "Budget"),
                                                                     SharedBoardTests.shape("ai-2", y: 300, index: "a2")])
        await s.catchUp().value
        await waitUntil { !outlined.isEmpty }
        #expect(SharedBoardTests.said(s) == ["a:1:1", "ai-1:1:1", "ai-2:1:1"])
        #expect(outlined.first?.0 == "Claude" && outlined.first?.1 == ["ai-1", "ai-2"])
        await waitUntil { NotePageDataStore.shared.arrivals[mine.id] != nil }
        let arrival = try #require(NotePageDataStore.shared.arrivals[mine.id])
        #expect(arrival.by == "Claude")
        // What it did, said as for a board of your own, from the drawing before it.
        #expect(CanvasNote.change(from: NotePageData.decode(arrival.before), to: NotePageDataStore.shared.doc(mine.id)) == "added 2 shapes")
        #expect(mine.aiEditedAt == nil, "the title didn't change: no note receipt")
        _ = phone

        await e.catchUp().value
        await waitUntil { !outlinedHere.isEmpty }
        #expect(outlinedHere.first?.0 == "Sara's Claude")
        #expect(NotePageDataStore.shared.arrivals[note.id]?.by == "Sara's Claude")
        _ = emil
    }

    /// Her phone missed a stroke of Emil's, and her AI's drawing builds on it: held back until
    /// Emil's comes, then marked, with only what the AI drew.
    @Test func anAIsDrawingHeldBackIsMarkedWhenItLands() async throws {
        let (_, phone, note, _, e, s) = try await board([SharedBoardTests.shape("a")])
        var outlined: [(String, [String])] = []
        s.onBoardAI = { outlined.append(($0, $1)) }
        phone.transport.deaf = true
        e.boardLocal([SharedBoardTests.shape("emil-1", index: "a1")])
        await waitUntil { e.isSent }
        phone.transport.deaf = false
        try server.aiDraws(note.id, as: member, ai: "Claude", nk: nk, [SharedBoardTests.shape("ai-1", index: "a2")])
        await waitUntil(0.5) { false }
        #expect(SharedBoardTests.said(s) == ["a:1:1"], "held back: it builds on Emil's stroke, which hasn't come")
        await s.catchUp().value
        await waitUntil { !outlined.isEmpty }
        #expect(SharedBoardTests.said(s) == ["a:1:1", "emil-1:1:1", "ai-1:1:1"])
        #expect(outlined.first?.1 == ["ai-1"], "only what the AI drew")
    }

    /// An AI's drawing is one change over 256 bytes, which Automerge sends deflated. Its hash is
    /// still read from its bytes, so one held back for a change it builds on is marked when it lands.
    @Test func aDeflatedChangeIsKnownByItsHash() throws {
        let doc = Document(textEncoding: .utf16)
        let board = try doc.putObject(obj: .ROOT, key: "board", ty: .Map)
        for (key, size) in [("small", 1), ("big", 20)] {
            let heads = doc.heads()
            try doc.put(obj: board, key: key, value: .String(String(repeating: UUID().uuidString, count: size)))
            let change = try doc.encodeChangesSince(heads: heads)
            #expect(change[8] == (size == 1 ? 1 : 2), "a big change is deflated")
            #expect(CollabText.hash(of: change).map { [$0] } == doc.heads(), "\(key)")
        }
    }

    /// Undo on the "drew" line takes the AI's drawing back out for everyone: as edits of yours,
    /// newer than its, so they win on every device.
    @Test func undoingAnAIsDrawingTakesItOutForEveryone() async throws {
        let (_, phone, note, mine, e, s) = try await board([SharedBoardTests.shape("a")])
        defer { withExtendedLifetime(phone) {} } // her library marks the drawing
        try server.aiDraws(note.id, as: member, ai: "Claude", nk: nk, [SharedBoardTests.shape("ai-1", index: "a1"), SharedBoardTests.shape("a", x: 500, version: 2, nonce: 3)])
        await s.catchUp().value
        await waitUntil { NotePageDataStore.shared.arrivals[mine.id] != nil }
        let before = try #require(NotePageData.decode(NotePageDataStore.shared.arrivals[mine.id]?.before)["values"] as? [String: Any])
        s.boardRevert(to: try #require(before["scene"] as? [String: Any]))
        await waitUntil { s.isSent }
        await e.catchUp().value
        await waitUntil { SharedBoardTests.element("a", in: e)?["x"] as? Double == 0 }
        #expect(SharedBoardTests.element("a", in: e)?["x"] as? Double == 0)
        #expect(SharedBoardTests.element("ai-1", in: e)?["isDeleted"] as? Bool == true)
        #expect(SharedBoardTests.said(e) == SharedBoardTests.said(s))
    }

    /// Stopping sharing keeps the board's drawing as it last was, as the owner's own again (synced
    /// as any board's), and Emil's other strokes from while it was shared are in it.
    @Test func aBoardThatStopsBeingSharedKeepsItsDrawing() async throws {
        let (emil, _, note, _, e, s) = try await board([SharedBoardTests.shape("a")])
        s.boardLocal([SharedBoardTests.shape("sara-1", index: "a1")])
        await waitUntil { s.isSent }
        await e.catchUp().value
        emil.library.removeLocally(note)
        let scene = try #require((NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any])
        #expect(((scene["elements"] as? [[String: Any]]) ?? []).compactMap { $0["id"] as? String } == ["a", "sara-1"])
        #expect(NotePageDataStore.shared.dirty.contains(note.id), "synced as a board of your own again")
        #expect(!note.isShared)
    }
}
