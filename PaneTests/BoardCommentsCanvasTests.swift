#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// Comments on the board's page (canvas-stack/src/comments.js): pins in the board's own
/// coordinates that follow their shape, take clicks only on themselves, are drawn on everyone's
/// board, and are never part of a picture or file of the drawing. Offscreen pages (Joined), joined
/// to sessions through the in-memory server where there are two people. No window shows; nothing
/// is posted to the system: the page's own events, in the page.
@MainActor @Suite(.serialized) struct BoardCommentsCanvasTests {
    typealias Joined = CanvasNativeUITests.Joined

    static let box: [[String: Any]] = [
        ["type": "rectangle", "id": "box", "x": 100, "y": 120, "width": 200, "height": 100],
        ["type": "rectangle", "id": "other", "x": 420, "y": 300, "width": 160, "height": 80],
    ]
    static let sara = "5A7A0000-0000-4000-8000-000000000001"

    /// A pin on the page: where it is (viewport), shown or not, its colour and letter.
    static let pinJS = """
    (() => {
      const out = {};
      for (const b of document.querySelectorAll('.pinto-pin')) {
        const r = b.getBoundingClientRect(), s = getComputedStyle(b);
        out[b.dataset.comment] = { x: r.left, y: r.top, w: r.width, h: r.height, shown: s.display !== 'none', bg: s.backgroundColor, letter: b.textContent, open: b.classList.contains('open') };
      }
      return out;
    })()
    """

    static func pins(_ j: Joined) async throws -> [String: [String: Any]] {
        (try await CanvasNativeUITests.json(j, pinJS)) as? [String: [String: Any]] ?? [:]
    }

    /// Where a point of the board is in the page now.
    static func viewport(_ j: Joined, _ x: Double, _ y: Double) async throws -> CGPoint {
        let v = try await CanvasNativeUITests.json(j, "(() => { const s = amber._canvas.api.getAppState(), z = s.zoom.value; return { x: (\(x) + s.scrollX) * z + s.offsetLeft, y: (\(y) + s.scrollY) * z + s.offsetTop }; })()")
        return CGPoint(x: v["x"] as? Double ?? .nan, y: v["y"] as? Double ?? .nan)
    }

    static func rgb(_ hex: String) -> String {
        let v = UInt32(hex.dropFirst(), radix: 16) ?? 0
        return "rgb(\(v >> 16 & 0xFF), \(v >> 8 & 0xFF), \(v & 0xFF))"
    }

    static func thread(_ id: String, on: String? = nil, x: Double = 1, y: Double = 0, by: String = "me", name: String = "Emil", ai: String? = nil, created: String = "2026-11-15T09:00:00Z") -> BoardComment {
        BoardComment(id: id, on: on, x: x, y: y, by: by, name: name, ai: ai, text: "About \(id)", created: created)
    }

    private func joined(_ elements: [[String: Any]] = Self.box) async throws -> Joined {
        let j = try await Joined(scene: CanvasTests.scene(elements))
        try await j.ready()
        j.canvas.author = BoardComments.Author(id: "me", name: "Emil")
        j.canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        return j
    }

    // MARK: Pins

    /// A pin on a shape stands at its place on the shape's box (its point on the top right corner)
    /// and follows the shape as it moves and grows; a pin on a spot stays on that spot of the board
    /// as you zoom and scroll. Each in its writer's colour, with their initial.
    @Test func pinsFollowTheirShape() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.show(comments: [Self.thread("c-box", on: "box", by: Self.sara, name: "Sara"), Self.thread("c-spot", x: 500, y: 60, created: "2026-11-15T09:01:00Z")])
        for _ in 0..<100 where try await Self.pins(j).count < 2 { try await Task.sleep(for: .milliseconds(30)) }
        func check(_ what: String, box: CGRect) async throws {
            let p = try await Self.pins(j)
            let onBox = try #require(p["c-box"]), onSpot = try #require(p["c-spot"])
            let corner = try await Self.viewport(j, box.maxX, box.minY), spot = try await Self.viewport(j, 500, 60)
            // The pin's point (its lower left corner) is on the spot.
            #expect(abs((onBox["x"] as? Double ?? 0) - corner.x) < 1.5 && abs((onBox["y"] as? Double ?? 0) + 24 - corner.y) < 1.5, "\(what): on the box's corner \(corner): \(onBox)")
            #expect(abs((onSpot["x"] as? Double ?? 0) - spot.x) < 1.5 && abs((onSpot["y"] as? Double ?? 0) + 24 - spot.y) < 1.5, "\(what): on its spot \(spot): \(onSpot)")
        }
        try await check("as drawn", box: CGRect(x: 100, y: 120, width: 200, height: 100))
        let p = try await Self.pins(j)
        #expect(p["c-box"]?["bg"] as? String == Self.rgb(BoardComments.color(for: Self.sara)) && p["c-box"]?["letter"] as? String == "S")
        #expect(p["c-spot"]?["letter"] as? String == "E" && p["c-box"]?["w"] as? Double == 24)

        // The box moves and grows (someone drags it): its pin goes with it.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.id === 'box' ? { ...e, x: 260, y: 200, width: 320, version: e.version + 1 } : e) }); return 1; })()")
        try await Task.sleep(for: .milliseconds(150))
        try await check("moved", box: CGRect(x: 260, y: 200, width: 320, height: 100))
        // Zoomed and scrolled: both stay on their spot of the board.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 1.5 }, scrollX: -80, scrollY: 30 } }); 1")
        try await Task.sleep(for: .milliseconds(150))
        try await check("zoomed", box: CGRect(x: 260, y: 200, width: 320, height: 100))

        // Its shape deleted: the pin goes too (the thread stays in the list).
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.id === 'box' ? { ...e, isDeleted: true, version: e.version + 1 } : e) }); return 1; })()")
        try await Task.sleep(for: .milliseconds(150))
        #expect(try await Self.pins(j)["c-box"]?["shown"] as? Bool == false)
        #expect(j.canvas.threads.count == 2)

        // Resolved: off the board.
        j.canvas.resolve("c-spot")
        try await Task.sleep(for: .milliseconds(150))
        #expect(try await Self.pins(j)["c-spot"] == nil)
    }

    /// The layer over the board takes no click: only a pin does, and only on itself. A click on a
    /// pin opens its thread (and nothing on the board is selected); beside it, the board has it.
    /// Natively, the thread's popover anchor lies over the board and takes no click either.
    @Test func pinsTakeClicksOnlyOnThemselves() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.show(comments: [Self.thread("c-box", on: "box")])
        for _ in 0..<100 where try await Self.pins(j)["c-box"]?["shown"] as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        let r = try await CanvasNativeUITests.json(j, """
        (() => {
          const b = document.querySelector('.pinto-pin'), r = b.getBoundingClientRect();
          const on = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          const beside = document.elementFromPoint(r.left - 12, r.top + r.height / 2);
          const below = document.elementFromPoint(r.left + 4, r.bottom + 30);
          return { onPin: on === b, besideLayer: !!(beside && beside.closest('.pinto-comments')), belowLayer: !!(below && below.closest('.pinto-comments')),
                   besideCanvas: !!(beside && beside.tagName === 'CANVAS'), layer: getComputedStyle(document.querySelector('.pinto-comments')).pointerEvents,
                   pin: getComputedStyle(b).pointerEvents };
        })()
        """)
        #expect(r["onPin"] as? Bool == true, "the pin takes a click on itself: \(r)")
        #expect(r["besideLayer"] as? Bool == false && r["belowLayer"] as? Bool == false && r["besideCanvas"] as? Bool == true, "beside it, the board does: \(r)")
        #expect(r["layer"] as? String == "none" && r["pin"] as? String == "auto")

        // A click on the pin (the page's own events, as a press makes them): its thread opens,
        // and the board selects nothing.
        _ = try await j.js("""
        (() => { const b = document.querySelector('.pinto-pin'), r = b.getBoundingClientRect(), o = { clientX: r.left + 12, clientY: r.top + 12, bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true };
          b.dispatchEvent(new PointerEvent('pointerdown', o)); b.dispatchEvent(new PointerEvent('pointerup', o)); b.dispatchEvent(new MouseEvent('click', o)); return 1; })()
        """)
        await j.until("its thread opens") { j.canvas.openThread == "c-box" }
        #expect(j.canvas.sent.contains(.focusComment("c-box")))
        await j.until("the page says where the pin is") { j.canvas.commentAnchor != nil }
        let pin = try #require(try await Self.pins(j)["c-box"])
        let anchor = try #require(j.canvas.commentAnchor)
        #expect(abs(anchor.minX - (pin["x"] as? Double ?? 0)) < 1.5 && abs(anchor.minY - (pin["y"] as? Double ?? 0)) < 1.5, "\(anchor) vs \(pin)")
        #expect(try await Self.pins(j)["c-box"]?["open"] as? Bool == true)
        #expect(try await j.js("Object.keys(amber._canvas.api.getAppState().selectedElementIds).length") as? Int == 0)
        j.canvas.closeThread()

        // Natively, as the note pane has it: the board in SwiftUI, the canvas's own controls over
        // it (CanvasOverlay, with the popover's anchor), and the anchor's clear spot where a thread
        // open stands. None of it takes a click on the board (clicksReachTheBoard); the popover
        // itself isn't opened here (a real one would be a window).
        let web = j.web
        let window = try #require(web.window)
        let size = web.bounds.size
        let host = NSHostingView(rootView: BoardHost(web: web)
            .overlay { CanvasOverlay(canvas: j.canvas) }
            .overlay { CanvasCommentAnchor.spot(CanvasCommentAnchor.placed(anchor, in: size)) }
            .frame(width: size.width, height: size.height))
        host.frame = CGRect(origin: .zero, size: size)
        window.contentView = host
        host.layoutSubtreeIfNeeded()
        await MacWindowChromeTests.settle(window, 4)
        for (fx, fy) in [(anchor.midX / size.width, anchor.midY / size.height), (0.5, 0.5), (0.2, 0.8)] {
            // The web view is flipped: y from the top, as the page measures it.
            let p = web.convert(NSPoint(x: size.width * fx, y: size.height * fy), to: host)
            var v = host.hitTest(p), onBoard = false
            while let x = v { if x === web { onBoard = true; break }; v = x.superview }
            #expect(onBoard, "a click at \(fx),\(fy) reaches the board, not \(host.hitTest(p).map { String(describing: type(of: $0)) } ?? "nothing")")
        }
    }

    /// The Comment tool (C, or the toolbar's): the next click on the board places a comment on the
    /// shape there, at that spot of its box, in your colour; the app opens its composer. Escape
    /// puts the tool down. Right-click's Comment with nothing selected places one at the click.
    @Test func theCommentToolPlacesACommentWhereYouClick() async throws {
        let j = try await joined()
        defer { j.close() }
        // C, as typed on the board.
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true })); 1")
        await j.until("the Comment tool is picked") { j.canvas.state.tool == .comment }
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1")
        await j.until("Escape puts it down") { j.canvas.state.tool == .selection }
        j.canvas.startCommenting()
        await j.until("picked from the app") { j.canvas.state.tool == .comment }
        #expect(try await j.js("document.getElementById('canvas').classList.contains('pinto-commenting')") as? Bool == true)

        // A click a quarter of the way into the box.
        let at = try await Self.viewport(j, 150, 145)
        _ = try await j.js("""
        (() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
          c.dispatchEvent(new PointerEvent('pointerdown', { clientX: \(at.x), clientY: \(at.y), bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true })); return 1; })()
        """)
        await j.until("a new comment, on the box") { j.canvas.draft != nil }
        #expect(j.canvas.draft == BoardComments.Place(on: "box", x: 0.25, y: 0.25))
        await j.until("the tool is put down") { j.canvas.state.tool == .selection }
        #expect(try await j.js("amber._canvas.api.getSceneElements().length") as? Int == 2, "nothing drawn")
        for _ in 0..<50 where try await Self.pins(j)["draft"]?["shown"] as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        let draft = try #require(try await Self.pins(j)["draft"])
        #expect(abs((draft["x"] as? Double ?? 0) - at.x) < 1.5 && draft["open"] as? Bool == true)
        let c = try #require(j.canvas.post("Make the corner rounder"))
        for _ in 0..<50 where try await Self.pins(j)[c.id] == nil { try await Task.sleep(for: .milliseconds(30)) }
        let pins = try await Self.pins(j)
        #expect(pins["draft"] == nil && pins[c.id]?["shown"] as? Bool == true, "\(pins.keys)")

        // On an empty spot: on the board, there.
        j.canvas.closeThread()
        let empty = try await Self.viewport(j, 700, 60)
        j.canvas.comment(at: empty)
        await j.until("a comment at the spot") { j.canvas.draft != nil }
        #expect(j.canvas.draft.map { $0.on == nil && abs($0.x - 700) < 1 && abs($0.y - 60) < 1 } == true, "\(String(describing: j.canvas.draft))")
        // On the selection (the bar's Comment): its top right corner.
        j.canvas.closeThread()
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { other: true } } }); 1")
        await j.until("selected") { j.canvas.state.hasSelection }
        j.canvas.comment()
        await j.until("a comment on the selection") { j.canvas.draft?.on == "other" }
        #expect(j.canvas.draft == BoardComments.Place(on: "other", x: 1, y: 0))

        // Right-click's Comment: with nothing selected, on the spot clicked.
        j.canvas.closeThread()
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); 1")
        await j.until("nothing selected") { !j.canvas.state.hasSelection }
        let web = try #require(j.web as? NotePageWebView)
        let click = try await Self.viewport(j, 680, 420)
        let menu = web.canvasMenu(at: click)
        let item = try #require(menu.items.firstIndex { $0.title == BoardCommentUI.comment }, "\(menu.items.map(\.title))")
        menu.performActionForItem(at: item)
        await j.until("a comment where the menu opened") { j.canvas.draft != nil }
        #expect(j.canvas.draft.map { $0.on == nil && abs($0.x - 680) < 1 && abs($0.y - 420) < 1 } == true, "\(String(describing: j.canvas.draft))")
    }

    /// Someone who can't comment (a viewer): no Comment tool, no C, no Comment from the app; the
    /// pins still show, and open their thread.
    @Test func aViewerHasNoCommentTool() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.show(comments: [Self.thread("c-box", on: "box", by: Self.sara, name: "Sara")])
        j.canvas.share(true, viewOnly: true)
        j.canvas.setCanComment(false)
        for _ in 0..<100 where try await j.js("amber._canvas.api.getAppState().viewModeEnabled") as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'comment' })") as? Bool == false)
        #expect(try await j.js("amber._canvasCommand({ op: 'commentHere', x: 150, y: 150 })") as? Bool == false)
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true })); 1")
        try await Task.sleep(for: .milliseconds(150))
        #expect(j.canvas.state.tool != .comment)
        j.canvas.startCommenting()
        j.canvas.comment()
        try await Task.sleep(for: .milliseconds(150))
        #expect(j.canvas.draft == nil)
        #expect(!(try #require(j.web as? NotePageWebView)).canvasMenu().items.contains { $0.title == BoardCommentUI.comment })
        for _ in 0..<50 where try await Self.pins(j)["c-box"]?["shown"] as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.pins(j)["c-box"]?["shown"] as? Bool == true, "viewers read comments")
    }

    /// Comments are not part of the drawing: the PNG, SVG and .excalidraw file leave them out, and
    /// the drawing the page keeps has none.
    @Test func picturesAndFilesLeaveCommentsOut() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.show(comments: [Self.thread("c-box", on: "box", by: Self.sara, name: "Sara"), Self.thread("c-spot", x: 40, y: 40)])
        for _ in 0..<100 where try await Self.pins(j).count < 2 { try await Task.sleep(for: .milliseconds(30)) }
        let file = try #require(await j.canvas.export(.excalidraw))
        let json = try #require(try JSONSerialization.jsonObject(with: file) as? [String: Any])
        #expect((json["elements"] as? [[String: Any]])?.count == 2)
        let text = String(decoding: file, as: UTF8.self)
        #expect(!text.contains("c-box") && !text.contains("About") && !text.contains("pinto-pin"))
        let svg = String(decoding: try #require(await j.canvas.export(.svg)), as: UTF8.self)
        #expect(svg.contains("<svg") && !svg.contains("pinto-pin") && !svg.contains("c-spot"))
        #expect(try #require(await j.canvas.export(.png)).count > 100)
        let kept = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().map((e) => e.id))") as? String
        #expect(kept == "[\"box\",\"other\"]")
    }

    // MARK: Two people

    /// Emil comments on a shape with the Comment tool on his board; the pin is drawn on Sara's, on
    /// the same shape at her zoom, in his colour there with his initial. She replies; he sees it
    /// in the thread and the quiet dot.
    @Test func pinsAreDrawnOnAnotherPersonsBoard() async throws {
        let people = BoardPeople()
        let scene = SharedBoardTests.scene([SharedBoardTests.shape("box", x: 100, y: 120), SharedBoardTests.shape("other", x: 420, y: 300, index: "a1")])
        let (emilDevice, others, note) = try await people.share(scene, people: ["Sara"])
        let emil = try people.session(emilDevice, note), sara = try people.session(others[0], note)
        let left = try await Joined(scene: CanvasNote.emptyScene()), right = try await Joined(scene: CanvasNote.emptyScene())
        defer { left.close(); right.close() }
        try await left.ready()
        try await right.ready()
        left.canvas.noteID = note.id
        left.canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        right.canvas.noteID = UUID()
        right.canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        BoardCollab.wire(emil, left.canvas)
        BoardCollab.wire(sara, right.canvas)
        defer { BoardCollab.unwire(emil, left.canvas); BoardCollab.unwire(sara, right.canvas) }
        for j in [left, right] {
            for _ in 0..<150 where try await j.js("amber._canvas.api.getSceneElements().length") as? Int != 2 { try await Task.sleep(for: .milliseconds(40)) }
        }
        _ = try await right.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 0.7 }, scrollX: 140, scrollY: 90 } }); 1")

        // Emil: the Comment tool, a click on the box's middle.
        left.canvas.startCommenting()
        await left.until("Emil's Comment tool") { left.canvas.state.tool == .comment }
        let at = try await Self.viewport(left, 160, 150)
        _ = try await left.js("""
        (() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
          c.dispatchEvent(new PointerEvent('pointerdown', { clientX: \(at.x), clientY: \(at.y), bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true })); return 1; })()
        """)
        await left.until("his new comment, on the box") { left.canvas.draft?.on == "box" }
        let c = try #require(left.canvas.post("Can this say who signs off?"))

        // On Sara's board: the pin, on the box, at her zoom, in Emil's colour.
        for _ in 0..<150 where try await Self.pins(right)[c.id]?["shown"] as? Bool != true { try await Task.sleep(for: .milliseconds(40)) }
        let pin = try #require(try await Self.pins(right)[c.id])
        let spot = try await Self.viewport(right, 100 + 120 * 0.5, 120 + 60 * 0.5)
        #expect(abs((pin["x"] as? Double ?? 0) - spot.x) < 2 && abs((pin["y"] as? Double ?? 0) + 24 - spot.y) < 2, "\(pin) at \(spot)")
        #expect(pin["bg"] as? String == Self.rgb(sara.boardColor(of: emil.me.uuidString)) && pin["letter"] as? String == "E")
        #expect(right.canvas.unseen)
        // She moves the box: the pin goes with it on both boards.
        _ = try await right.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.id === 'box' ? { ...e, x: 160, version: e.version + 1, versionNonce: 77 } : e) }); return 1; })()")
        for _ in 0..<150 where (try await CanvasNativeUITests.element(left, "box"))?["x"] as? Double != 160 { try await Task.sleep(for: .milliseconds(40)) }
        try await Task.sleep(for: .milliseconds(150))
        let moved = try #require(try await Self.pins(left)[c.id]), now = try await Self.viewport(left, 160 + 60, 150)
        #expect(abs((moved["x"] as? Double ?? 0) - now.x) < 2, "\(moved) at \(now)")

        // She replies from her board; Emil has it.
        right.canvas.open(thread: c.id)
        _ = right.canvas.reply(to: c.id, "Yes, I'll add the owner")
        await left.until("Sara's reply on Emil's board") { left.canvas.threads.first?.replies.count == 1 }
        #expect(left.canvas.byline(try #require(left.canvas.threads.first?.replies.first)) == "Sara")
    }

    // MARK: Pictures

    /// The board in the app's window with two pins (a thread on a shape with a reply, an AI's on
    /// another), the quiet dot on Comments, an open thread, and the Comments list: light and dark.
    /// Drawn only when BOARD_COMMENTS_SHOTS names a folder (TEST_RUNNER_BOARD_COMMENTS_SHOTS=dir).
    /// The popovers are drawn on their own and placed where they open, as the library's are: a
    /// popover can't be drawn off screen.
    @Test func boardCommentsPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["BOARD_COMMENTS_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let note = CanvasNote.make(in: .all, context: c.mainContext)
            note.body = "Publishing flow"
            let ago = { (m: Double) in BoardComments.stamp(Date.now.addingTimeInterval(-m * 60)) }
            // On the oval's edge, up and to the right; on Fix it's top right corner.
            let ask = BoardComment(id: "c-ready", on: "idea", x: 0.85, y: 0.15, by: Self.sara, name: "Sara", text: "Can ideas come from newsletter replies too? Half of ours did last month.", created: ago(48))
            let answer = BoardComment(id: "c-ready-1", thread: "c-ready", by: "me", name: "Emil", text: "Yes. I'll add an arrow from the inbox.", created: ago(31))
            let ai = BoardComment(id: "c-publish", on: "fix", x: 1, y: 0, by: "me", name: "Emil", ai: "Claude", text: "Fix it has no owner yet. Sara reviewed the last three drafts: should it be her?", created: ago(12))
            let old = BoardComment(id: "c-old", on: "draft", x: 1, y: 0, by: "me", name: "Emil", text: "Split Draft in two?", created: ago(60 * 26), resolved: true, version: 2)
            NotePageDataStore.shared.set(note.id, BoardComments.keeping([ask, answer, ai, old], in: ["values": ["scene": CanvasNativeUITests.flowchart], "collections": [String: Any]()]))
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
                let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1400, height: 900),
                                 styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
                    .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
                w.setContentSize(CGSize(width: 1400, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                var found: WKWebView?
                for _ in 0..<100 where found == nil {
                    found = NotePageLive.view(note.id)
                    if found == nil { await MacWindowChromeTests.settle(w, 1) }
                }
                let web = try #require(found as? NotePageWebView, "the board opened")
                try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
                let canvas = try #require(web.canvas)
                for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                canvas.author = BoardComments.Author(id: "me", name: "Emil")
                _ = try await web.evaluateJavaScript("amber._canvasCommand({ op: 'action', name: 'zoomToFit' })")
                await MacWindowChromeTests.settle(w, 10)
                // Sara's newest, arriving now (synced in): the quiet dot.
                let late = BoardComment(id: "c-ready-2", thread: "c-ready", by: Self.sara, name: "Sara", text: "Thanks, that works.", created: ago(2))
                NotePageDataStore.shared.set(note.id, BoardComments.keeping([late], in: NotePageDataStore.shared.doc(note.id)))
                for _ in 0..<50 where !canvas.unseen { await MacWindowChromeTests.settle(w, 1) }
                #expect(canvas.unseen && canvas.pins.count == 2)
                await MacWindowChromeTests.settle(w, 10)
                @MainActor func capture() async throws -> NSBitmapImageRep {
                    _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                    await MacWindowChromeTests.settle(w, 6)
                    let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                    let cover = NSImageView(frame: web.bounds)
                    cover.image = image
                    cover.imageScaling = .scaleAxesIndependently
                    web.addSubview(cover)
                    defer { cover.removeFromSuperview() }
                    w.contentView?.layoutSubtreeIfNeeded()
                    w.displayIfNeeded()
                    return try MacEmptyDetailTests.picture(w)
                }
                func write(_ rep: NSBitmapImageRep, _ name: String) throws {
                    try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"))
                }
                // The board and its toolbar: from just left of the board to the window's right edge.
                let boardLeft = web.convert(web.bounds, to: nil).minX - 40
                func board(_ rep: NSBitmapImageRep) throws -> NSBitmapImageRep {
                    let scale = CGFloat(rep.pixelsWide) / w.frame.width
                    let x = Int(boardLeft * scale), width = rep.pixelsWide - x
                    let cg = try #require(rep.cgImage?.cropping(to: CGRect(x: x, y: 0, width: width, height: rep.pixelsHigh)))
                    let out = NSBitmapImageRep(cgImage: cg)
                    out.size = CGSize(width: CGFloat(width) / scale, height: w.frame.height)
                    return out
                }
                try write(try board(try await capture()), "comments-1-board-two-pins")

                // A thread open by its pin: the pin ringed, its popover beside it.
                canvas.send(.comments(canvas.pins.map { var p = $0; p.open = p.id == "c-ready"; return p }, me: BoardComments.Pin(id: "me", x: 0, y: 0, color: BoardComments.color(for: "me"), letter: "E"),
                                      open: "c-ready", draft: nil, canComment: true))
                await MacWindowChromeTests.settle(w, 4)
                let r = try await Self.json(web, "(() => { const r = document.querySelector('[data-comment=\"c-ready\"]').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()")
                let pinInWeb = CGRect(x: r["x"] as? Double ?? 0, y: r["y"] as? Double ?? 0, width: r["w"] as? Double ?? 24, height: r["h"] as? Double ?? 24)
                let pin = web.convert(web.isFlipped ? pinInWeb : CGRect(x: pinInWeb.minX, y: web.bounds.height - pinInWeb.maxY, width: pinInWeb.width, height: pinInWeb.height), to: nil)
                let thread = try await Self.popover(BoardThreadView(canvas: canvas, id: "c-ready"), dark: dark)
                try write(try board(try Self.beside(thread, pin: pin, on: try await capture(), size: w.frame.size, dark: dark)), "comments-2-thread-open")
                canvas.send(.comments(canvas.pins, me: BoardComments.Pin(id: "me", x: 0, y: 0, color: BoardComments.color(for: "me"), letter: "E"),
                                      open: nil, draft: nil, canComment: true))

                // The Comments list, under its toolbar button.
                let list = try await Self.popover(BoardCommentsList(canvas: canvas), dark: dark)
                let found2 = await MacEmptyDetailTests.waitForElement("canvas.comments", in: w)
                let button = try #require(found2 ?? MacEmptyDetailTests.element("canvas.comments", in: w), "the Comments button")
                let onScreen = try #require((button.value(forKey: "accessibilityFrame") as? NSValue)?.rectValue)
                let frame = w.convertFromScreen(onScreen)
                try write(try board(try CanvasNativeUITests.placed(list, under: frame, on: try await capture(), size: w.frame.size, dark: dark)), "comments-3-list")
                try write(list, "comments-list-popover")
                try write(thread, "comments-thread-popover")
            }
        }
    }

    static func json(_ web: WKWebView, _ expression: String) async throws -> [String: Any] {
        let s = try await web.evaluateJavaScript("JSON.stringify(\(expression))") as? String ?? "{}"
        return (try JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any]) ?? [:]
    }

    /// A popover's view drawn on its own at 2x, at the size it takes.
    static func popover(_ view: some View, dark: Bool) async throws -> NSBitmapImageRep {
        let probe = NSHostingView(rootView: view.fixedSize())
        let size = probe.fittingSize
        let ax = OffscreenAX(view.frame(width: size.width, height: size.height, alignment: .top).background(Color(nsColor: .windowBackgroundColor)), size: size, dark: dark)
        defer { ax.close() }
        await ax.settle(600)
        let v = try #require(ax.window.contentView)
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        return rep
    }

    /// `popover` drawn over a window's picture beside `pin` (in the window's points), its arrow on
    /// its left edge pointing at the pin, as it opens on the trailing side.
    static func beside(_ popover: NSBitmapImageRep, pin: CGRect, on window: NSBitmapImageRep, size points: CGSize, dark: Bool) throws -> NSBitmapImageRep {
        let scale = CGFloat(window.pixelsWide) / points.width
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: window.pixelsWide, pixelsHigh: window.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = points
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        window.draw(in: CGRect(origin: .zero, size: points))
        let size = CGSize(width: CGFloat(popover.pixelsWide) / scale, height: CGFloat(popover.pixelsHigh) / scale), arrow: CGFloat = 9
        let y = min(max(pin.midY - size.height / 2, 8), points.height - size.height - 8)
        // On the leading side when there's no room on the trailing one, as a popover flips.
        let right = pin.maxX + 4 + arrow + size.width <= points.width - 8
        let card = CGRect(x: right ? pin.maxX + 4 + arrow : pin.minX - 4 - arrow - size.width, y: y, width: size.width, height: size.height)
        let shape = NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12)
        let tip = NSBezierPath()
        let edge = right ? card.minX : card.maxX, point: CGFloat = right ? -arrow : arrow, inside: CGFloat = right ? 1 : -1
        tip.move(to: CGPoint(x: edge + inside, y: pin.midY + arrow))
        tip.line(to: CGPoint(x: edge + point, y: pin.midY))
        tip.line(to: CGPoint(x: edge + inside, y: pin.midY - arrow))
        tip.close()
        shape.append(tip)
        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(dark ? 0.55 : 0.22)
        shadow.shadowBlurRadius = 18
        shadow.shadowOffset = CGSize(width: 0, height: -6)
        shadow.set()
        (dark ? NSColor(white: 0.17, alpha: 1) : NSColor(white: 0.93, alpha: 1)).setFill()
        shape.fill()
        NSGraphicsContext.restoreGraphicsState()
        NSGraphicsContext.saveGraphicsState()
        NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12).addClip()
        popover.draw(in: card)
        NSGraphicsContext.restoreGraphicsState()
        NSColor(white: dark ? 1 : 0, alpha: dark ? 0.16 : 0.12).setStroke()
        shape.lineWidth = 1 / scale
        shape.stroke()
        return out
    }
}

/// The board's web view in SwiftUI, as the note pane holds it.
private struct BoardHost: NSViewRepresentable {
    let web: WKWebView
    func makeNSView(context: Context) -> WKWebView { web }
    func updateNSView(_ v: WKWebView, context: Context) {}
}
#endif
