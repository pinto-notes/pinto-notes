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
extension BoardCommentsCanvasTests {
    static let box: [[String: Any]] = [
        ["type": "rectangle", "id": "box", "x": 100, "y": 120, "width": 200, "height": 100],
        ["type": "rectangle", "id": "other", "x": 420, "y": 300, "width": 160, "height": 80],
    ]
    static let sara = TestPeople.sara.uuidString

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

    /// On an iPhone a thread opens in a sheet over the lower half: its pin is brought into the top
    /// part of the board, above the sheet, and one already there stays where it is. So is the pin
    /// of a comment being written.
    @Test func aPinStaysAboveTheThreadsSheet() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.focusRoom = BoardCommentUI.sheetRoom
        j.canvas.show(comments: [Self.thread("c-low", x: 500, y: 560), Self.thread("c-high", x: 300, y: 200, created: "2026-11-15T09:01:00Z")])
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 1 }, scrollX: 0, scrollY: 0 } }); 1")
        for _ in 0..<100 where try await Self.pins(j).count < 2 { try await Task.sleep(for: .milliseconds(30)) }
        let height = try #require(try await j.js("amber._canvas.api.getAppState().height") as? Double)
        let top = try #require(try await j.js("amber._canvas.api.getAppState().offsetTop") as? Double)

        // Low on the board: under where the sheet will be. Opened, it moves up above it.
        j.canvas.open(thread: "c-low")
        #expect(j.canvas.sent.last == .focusComment("c-low", above: BoardCommentUI.sheetRoom))
        var low = try await Self.viewport(j, 500, 560)
        for _ in 0..<50 where low.y - top > height * BoardCommentUI.sheetRoom { try await Task.sleep(for: .milliseconds(30)); low = try await Self.viewport(j, 500, 560) }
        #expect(low.y - top <= height * BoardCommentUI.sheetRoom && low.y - top >= 40, "above the sheet: \(low.y - top) of \(height)")
        j.canvas.closeThread()

        // High on the board already: it stays.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { scrollX: 0, scrollY: 0 } }); 1")
        try await Task.sleep(for: .milliseconds(100))
        let before = try await Self.viewport(j, 300, 200)
        j.canvas.open(thread: "c-high")
        try await Task.sleep(for: .milliseconds(150))
        let after = try await Self.viewport(j, 300, 200)
        #expect(abs(after.y - before.y) < 0.5 && abs(after.x - before.x) < 0.5, "\(before) → \(after)")
        j.canvas.closeThread()

        // On a Mac (no sheet): the whole view is the room, as before.
        j.canvas.focusRoom = nil
        j.canvas.open(thread: "c-low")
        #expect(j.canvas.sent.last == .focusComment("c-low"))
        j.canvas.closeThread()
    }

    /// An AI's pin is its own mark on neutral graphite (light grey on a dark board, the mark in
    /// black), never the accent or a letter (round 12: an orange "C"). The page names the shapes
    /// the threads are on, for the list ("on Idea"), and again when a shape's words change.
    @Test func anAIPinShowsItsMarkAndThePageNamesTheShapes() async throws {
        let j = try await Joined(scene: CanvasNativeUITests.flowchart)
        defer { j.close() }
        try await j.ready()
        j.canvas.author = BoardComments.Author(id: "me", name: "Emil")
        j.canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        j.canvas.show(comments: [Self.thread("c-ai", on: "fix", ai: "Claude"), Self.thread("c-idea", on: "idea", by: Self.sara, name: "Sara"),
                                 Self.thread("c-spot", x: 900, y: 300, created: "2026-11-15T09:02:00Z")])
        for _ in 0..<100 where try await Self.pins(j).count < 3 { try await Task.sleep(for: .milliseconds(30)) }
        let markJS = "(() => { const b = document.querySelector('[data-comment=\"c-ai\"]'), m = b.querySelector('.pinto-pin-mark'); return { letter: b.textContent, mark: !!m, mask: m ? (getComputedStyle(m).webkitMaskImage || '') : '', ink: m ? getComputedStyle(m).backgroundColor : '', w: m ? m.getBoundingClientRect().width : 0 }; })()"
        var m = try await CanvasNativeUITests.json(j, markJS)
        #expect(m["mark"] as? Bool == true && (m["letter"] as? String ?? "x").isEmpty, "a mark, no letter: \(m)")
        #expect((m["mask"] as? String ?? "").contains("data:image/png"), "\(m)")
        #expect(m["ink"] as? String == "rgb(255, 255, 255)" && (m["w"] as? Double ?? 0) >= 12, "\(m)")
        var p = try await Self.pins(j)
        #expect(p["c-ai"]?["bg"] as? String == Self.rgb(BoardComments.aiColor), "graphite, not the accent: \(p["c-ai"] ?? [:])")
        #expect(p["c-idea"]?["letter"] as? String == "S", "a person keeps their initial")

        // A dark board: the light grey pin, the mark in black.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { theme: 'dark' } }); 1")
        for _ in 0..<50 where try await Self.pins(j)["c-ai"]?["bg"] as? String != Self.rgb(BoardComments.aiDark) { try await Task.sleep(for: .milliseconds(30)) }
        p = try await Self.pins(j)
        m = try await CanvasNativeUITests.json(j, markJS)
        #expect(p["c-ai"]?["bg"] as? String == Self.rgb(BoardComments.aiDark) && m["ink"] as? String == "rgb(29, 29, 31)", "\(p["c-ai"] ?? [:]) \(m)")

        // The shapes' names, for the list.
        await j.until("the page names the shapes") { j.canvas.commentShapes["idea"] == "Idea" && j.canvas.commentShapes["fix"] == "Fix it" }
        let idea = try #require(j.canvas.threads.first { $0.id == "c-idea" }), spot = try #require(j.canvas.threads.first { $0.id == "c-spot" })
        #expect(j.canvas.place(of: idea) == "on Idea" && j.canvas.place(of: spot) == "on the board")
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.containerId === 'idea' && e.type === 'text' ? { ...e, text: 'Ideas from readers', originalText: 'Ideas from readers', version: e.version + 1 } : e) }); return 1; })()")
        await j.until("renamed with its words") { j.canvas.commentShapes["idea"] == "Ideas from readers" }
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

    /// An open thread hangs where it covers neither its shape nor what's drawn near it, when there's
    /// room (round 13, comments-2-thread-open: the thread on Draft hid Draft and its arrows). The
    /// page says where the shape and its neighbours are; the popover takes the first clear side,
    /// off the pin or off the shape's own edges.
    @Test func anOpenThreadKeepsClearOfItsShapeAndWhatsNearIt() async throws {
        let j = try await joined([
            ["type": "rectangle", "id": "idea", "x": 0, "y": 140, "width": 170, "height": 90],
            ["type": "rectangle", "id": "draft", "x": 280, "y": 140, "width": 190, "height": 90],
            ["type": "rectangle", "id": "ready", "x": 560, "y": 120, "width": 220, "height": 130],
            ["type": "arrow", "id": "a1", "x": 172, "y": 185, "width": 106, "height": 0, "start": ["id": "idea"], "end": ["id": "draft"]],
            ["type": "arrow", "id": "a2", "x": 472, "y": 185, "width": 86, "height": 0, "start": ["id": "draft"], "end": ["id": "ready"]],
        ])
        defer { j.close() }
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 1 }, scrollX: 80, scrollY: 120 } }); 1")
        j.canvas.show(comments: [Self.thread("c-draft", on: "draft"), BoardComment(id: "r1", thread: "c-draft", by: "me", name: "Emil", text: "Shorter?", created: "2026-11-15T09:05:00Z")])
        for _ in 0..<100 where try await Self.pins(j)["c-draft"]?["shown"] as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        j.canvas.open(thread: "c-draft")
        await j.until("the page says where the pin and its shape are") { j.canvas.commentAnchor != nil && j.canvas.commentAround.on != nil }
        let around = j.canvas.commentAround
        let draft = try #require(around.on)
        let at = try await Self.viewport(j, 280, 140)
        #expect(abs(draft.minX - at.x) < 2 && abs(draft.width - 190) < 2, "the shape, in the view's points: \(draft) at \(at)")
        #expect(around.near.count >= 2, "Idea and Ready (and the arrows) are near it: \(around.near)")
        let area = j.web.bounds.size
        let size = CanvasCommentAnchor.popoverSize(j.canvas)
        let place = CanvasCommentAnchor.placement(pin: try #require(j.canvas.commentAnchor), around: around, area: area, size: size)
        let popover = CanvasCommentAnchor.frame(place.edge, anchor: place.anchor, size: size, area: area)
        #expect(!popover.intersects(draft), "the thread doesn't cover its shape: \(popover) over \(draft)")
        #expect(around.near.allSatisfy { !popover.intersects($0) }, "nor what's near it: \(popover) over \(around.near)")
        #expect(popover.minX >= 0 && popover.minY >= 0 && popover.maxX <= area.width && popover.maxY <= area.height, "in the board: \(popover) in \(area)")
        j.canvas.closeThread()
    }

    /// The placement on its own: beside the pin when that side is clear; off the shape's edge when
    /// the pin's sides all cover something; the side that covers least when nothing is clear.
    @Test func theThreadsPlacementTakesTheFirstClearSide() {
        typealias A = CanvasCommentAnchor
        let area = CGSize(width: 1000, height: 700), size = CGSize(width: 304, height: 244)
        let draft = CGRect(x: 380, y: 260, width: 190, height: 90)
        let pin = CGRect(x: 556, y: 246, width: 24, height: 24)
        // Nothing near: to the right of the pin, as before.
        #expect(A.placement(pin: pin, around: .init(on: draft, near: []), area: area, size: size) == A.Placement(anchor: pin, edge: .trailing))
        // Idea to the left, Ready to the right (round 13, comments-2): below Draft, clear of all three.
        let idea = CGRect(x: 100, y: 260, width: 170, height: 90), ready = CGRect(x: 660, y: 240, width: 220, height: 130)
        let p = A.placement(pin: pin, around: .init(on: draft, near: [idea, ready]), area: area, size: size)
        let f = A.frame(p.edge, anchor: p.anchor, size: size, area: area)
        #expect(![draft, idea, ready].contains { f.intersects($0) }, "\(p) \(f)")
        // A board full of shapes: the side that covers least, still in the board.
        let full = (0..<6).flatMap { r in (0..<5).map { c in CGRect(x: c * 200 + 10, y: r * 115 + 10, width: 170, height: 90) } }
        let q = A.placement(pin: pin, around: .init(on: draft, near: full), area: area, size: size)
        let g = A.frame(q.edge, anchor: q.anchor, size: size, area: area)
        #expect(q.anchor == pin && g.minX >= 0 && g.maxX <= area.width && g.minY >= 0 && g.maxY <= area.height, "\(q) \(g)")
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

    /// Can comment: the drawing is view only, and the Comment tool still places a comment (from the
    /// app, C, or the page's button); the drawing tools stay away, and the Comment button pressed
    /// again puts it down. On a board with no comments yet, as a reviewer first opens it.
    @Test func aCommenterCommentsOnAViewOnlyBoard() async throws {
        let j = try await joined()
        defer { j.close() }
        j.canvas.share(true, viewOnly: true)
        j.canvas.setCanComment(true)
        for _ in 0..<100 where try await j.js("amber._canvas.api.getAppState().viewModeEnabled") as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        #expect(j.canvas.commentsOnly)
        // A page that loads afresh, as a reviewer first opens the board: it starts knowing nothing
        // of Can comment, and the app tells it, though the board has no comments yet.
        _ = try await j.js("amber._canvasCommand({ op: 'comments', pins: [], can: true }); 1")
        j.canvas.receive(["load": "again"])
        try await Task.sleep(for: .milliseconds(100))
        // The browser's Comment button: on, then off again.
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'comment' })") as? Bool != false)
        await j.until("the Comment tool is picked on a view-only board") { j.canvas.state.tool == .comment }
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'comment', on: false })") as? Bool != false)
        await j.until("the button pressed again puts it down") { j.canvas.state.tool != .comment }
        // A drawing tool does nothing here.
        _ = try await j.js("amber._canvasCommand({ op: 'tool', tool: 'rectangle' }); 1")
        try await Task.sleep(for: .milliseconds(150))
        #expect(try await j.js("amber._canvas.api.getAppState().activeTool.type") as? String != "rectangle")
        // C, then a click on the box: a comment on it, nothing drawn.
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true })); 1")
        await j.until("C picks it") { j.canvas.state.tool == .comment }
        // The engine's tool on a view-only board is the hand (a drag pans it): the Comment tool
        // stays through a pan (the browser's put it down at once).
        _ = try await j.js("(() => { const a = amber._canvas.api; a.setActiveTool({ type: 'hand' }); a.updateScene({ appState: { scrollX: a.getAppState().scrollX + 1 } }); return 1; })()")
        for _ in 0..<20 where try await j.js("amber._canvas.api.getAppState().activeTool.type") as? String != "hand" { try await Task.sleep(for: .milliseconds(30)) }
        try await Task.sleep(for: .milliseconds(200))
        #expect(j.canvas.state.tool == .comment, "a pan on a view-only board keeps the Comment tool")
        let at = try await Self.viewport(j, 150, 145)
        _ = try await j.js("""
        (() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
          c.dispatchEvent(new PointerEvent('pointerdown', { clientX: \(at.x), clientY: \(at.y), bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true })); return 1; })()
        """)
        await j.until("a new comment, on the box") { j.canvas.draft != nil }
        #expect(j.canvas.draft?.on == "box")
        #expect(try await j.js("amber._canvas.api.getSceneElements().length") as? Int == 2, "nothing drawn")
        let c = try #require(j.canvas.post("Can this be wider?"))
        for _ in 0..<50 where try await Self.pins(j)[c.id] == nil { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.pins(j)[c.id]?["shown"] as? Bool == true)
        // Made a viewer: the tool goes.
        j.canvas.setCanComment(false)
        try await Task.sleep(for: .milliseconds(100))
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'comment' })") as? Bool == false)
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

    // MARK: The views (round 12)

    /// The list: New Comment at its top picks the Comment tool (as C does) and closes the list;
    /// rows, latest activity first, give the first comment's time and "on Idea · 2 replies · last
    /// reply …". A viewer's list has no New Comment.
    @Test func theListOffersNewCommentAndSaysWhereEachThreadIs() async throws {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "me", name: "Emil")
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        let now = Date.now
        canvas.now = { now }
        let ago = { (m: Double) in BoardComments.stamp(now.addingTimeInterval(-m * 60)) }
        canvas.show(comments: [
            BoardComment(id: "c-idea", on: "idea", by: Self.sara, name: "Sara", text: "Newsletter replies too?", created: ago(48)),
            BoardComment(id: "c-r1", thread: "c-idea", by: "me", name: "Emil", text: "Yes", created: ago(31)),
            BoardComment(id: "c-r2", thread: "c-idea", by: Self.sara, name: "Sara", text: "Thanks", created: ago(2)),
            BoardComment(id: "c-ai", on: "fix", by: "me", name: "Emil", ai: "Claude", text: "No owner yet", created: ago(12)),
        ])
        canvas.receive(["commentShapes": ["idea": "Idea", "fix": "Fix it"]])
        canvas.showingComments = true
        let ax = OffscreenAX(BoardCommentsList(canvas: canvas), size: CGSize(width: BoardCommentUI.listWidth, height: 480))
        defer { ax.close() }
        await ax.settle()
        let ids = ax.ids()
        let new = try #require(ax.find("comments.new"), "\(ids)")
        #expect(new.text.contains(BoardCommentUI.new))
        #expect(ids.firstIndex(of: "comments.new")! < ids.firstIndex(of: "comments.row")!, "at the top")
        // A row reads as one button: who, when it was started, what it says, where and its replies.
        let rows = ax.all("comments.row").map(\.text)
        #expect(rows.count == 2, "\(rows)")
        let first = try #require(rows.first)
        #expect(first.contains("Sara") && first.contains("on Idea \u{00B7} 2 replies \u{00B7} last reply 2 min ago"), "Sara's thread first, the latest word: \(first)")
        #expect(first.contains("48 min ago"), "the time beside the first comment is the first comment's: \(first)")
        #expect(rows.last?.contains("on Fix it") == true && rows.last?.contains("repl") == false, "\(rows)")
        new.press()
        await ax.settle(100)
        #expect(!canvas.showingComments && canvas.sent.last == .tool(.comment), "\(canvas.sent.suffix(2))")

        // A viewer: no New Comment.
        canvas.setCanComment(false)
        await ax.settle()
        #expect(ax.find("comments.new") == nil)
    }

    /// The toolbar's one Comments button (round 12: Comment and Comments were two near-identical
    /// bubbles): named Comments, its help says C adds one, it says when there's something new (the
    /// dot) and stays so while the Comment tool is picked. Its popover isn't opened here: no window.
    @Test func oneCommentsButtonKeepsTheDot() async throws {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "me", name: "Emil")
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        canvas.noteID = UUID()
        canvas.show(comments: [])
        let ax = OffscreenAX(CanvasCommentsButton(canvas: canvas), size: CGSize(width: 80, height: 40))
        defer { ax.close() }
        await ax.settle()
        let quiet = try #require(ax.find("canvas.comments"), "\(ax.ids())")
        #expect(quiet.text.contains(BoardCommentUI.title) && !quiet.text.contains("New comments"), "\(quiet.text)")
        #expect(OffscreenAX.Element.string(quiet.ax, kAXHelpAttribute) == BoardCommentUI.help)
        canvas.show(comments: [Self.thread("c-1", on: "box", by: Self.sara, name: "Sara")])
        #expect(canvas.unseen)
        // The page says the Comment tool is picked (C, or the list's New Comment).
        canvas.receive(["tool": CanvasTool.comment.rawValue])
        #expect(canvas.state.tool == .comment)
        await ax.settle()
        let new = try #require(ax.find("canvas.comments"))
        #expect(new.text.contains("New comments"), "the dot, with the Comment tool picked: \(new.text)")
    }

    /// Your own comment in its thread: Edit and Delete (Delete asks once, in place); a thread start
    /// deleted with replies reads "Comment deleted", the replies after it. Someone else's has neither.
    @Test func yourOwnCommentIsEditedAndDeletedInItsThread() async throws {
        let canvas = CanvasController()
        canvas.author = BoardComments.Author(id: "me", name: "Emil")
        canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        var kept: [BoardComment] = []
        canvas.onComments = { kept += $0 }
        canvas.show(comments: [Self.thread("c-1", on: "box"), BoardComment(id: "c-r", thread: "c-1", by: Self.sara, name: "Sara", text: "Agreed", created: "2026-11-15T09:05:00Z")])
        let ax = OffscreenAX(BoardThreadView(canvas: canvas, id: "c-1"), size: CGSize(width: BoardCommentUI.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        let ids = ax.ids()
        #expect(ids.filter { $0 == "comment.row.mine" }.count == 1 && ids.filter { $0 == "comment.row" }.count == 1, "\(ids)")
        #expect(ids.contains("comment.more"), "your own has its ⋯: \(ids)")

        // Edit: the field with its words; saved, marked edited.
        canvas.editingComment = "c-1"
        await ax.settle()
        #expect(ax.find("comment.editor") != nil && ax.find("comment.field")?.text.contains("About c-1") == true)
        #expect(canvas.edit("c-1", "About the box, again") != nil && canvas.editingComment == nil)
        await ax.settle()
        #expect(ax.find("comment.edited")?.text.contains(BoardCommentUI.edited) == true, "\(ax.ids())")

        // Delete asks once, in place; Cancel keeps it.
        canvas.deletingComment = "c-1"
        await ax.settle()
        #expect(ax.find("comment.deleteAsk") != nil && ax.find("comment.deleteQuestion")?.text.contains(BoardCommentUI.deleteQuestion) == true, "\(ax.ids())")
        try #require(ax.find("comment.deleteCancel")).press()
        await ax.settle()
        #expect(canvas.deletingComment == nil && canvas.comments.first { $0.id == "c-1" }?.deleted == false)
        canvas.deletingComment = "c-1"
        await ax.settle()
        try #require(ax.find("comment.deleteConfirm")).press()
        await ax.settle()
        #expect(kept.last?.deleted == true && kept.last?.id == "c-1")
        #expect(ax.find("comment.deleted")?.text.contains(BoardComments.deletedText) == true, "\(ax.ids())")
        #expect(ax.ids().contains("comment.row") && !ax.ids().contains("comment.more"), "Sara's reply stays; nothing left of yours to change")
    }

    /// Typing @ offers the board's people; a pick puts in "@Sara ".
    @Test func typingAtOffersTheBoardsPeople() async throws {
        let people = [BoardComments.Person(id: "u2", name: "Sara"), BoardComments.Person(id: "u3", name: "Sam"), BoardComments.Person(id: "u4", name: "Mo")]
        let ax = OffscreenAX(BoardCommentField(prompt: "Reply", initial: "Thanks @Sa", people: people) { _ in true }.frame(width: 280), size: CGSize(width: 300, height: 200))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("comment.mention.Sara") != nil && ax.find("comment.mention.Sam") != nil && ax.find("comment.mention.Mo") == nil, "\(ax.ids())")
        try #require(ax.find("comment.mention.Sara")).press()
        await ax.settle()
        #expect(ax.find("comment.field")?.text.contains("Thanks @Sara ") == true, "\(ax.find("comment.field")?.text ?? "")")
        #expect(ax.find("comment.mentions") == nil, "the offer goes once it's picked")
        // No people (a board of your own): nothing offered.
        let alone = OffscreenAX(BoardCommentField(prompt: "Reply", initial: "@") { _ in true }.frame(width: 280), size: CGSize(width: 300, height: 120))
        defer { alone.close() }
        await alone.settle()
        #expect(alone.find("comment.mentions") == nil)
    }

    /// In a thread an AI's avatar is its mark on graphite, not a letter on the accent.
    @Test func anAIsAvatarIsItsMark() throws {
        @MainActor func picture(_ ai: String?) throws -> NSBitmapImageRep {
            let r = ImageRenderer(content: BoardCommentAvatar(letter: "C", color: BoardComments.aiColor, ai: ai, size: 40).environment(\.colorScheme, .light))
            r.scale = 1
            return NSBitmapImageRep(cgImage: try #require(r.cgImage))
        }
        let mark = try picture("Claude"), letter = try picture(nil)
        #expect(mark.tiffRepresentation != letter.tiffRepresentation, "the mark, not the letter")
        // Graphite: a dark neutral grey (not the accent's orange).
        let edge = try #require(mark.colorAt(x: 4, y: 20)?.usingColorSpace(.sRGB))
        #expect(abs(edge.redComponent - edge.greenComponent) < 0.03 && abs(edge.blueComponent - edge.greenComponent) < 0.03 && edge.redComponent < 0.45, "graphite: \(edge)")
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
            // An AI's reply in the thread: its own mark, in neutral colours (round 12).
            // It comes with its change (below), so it offers Show change (round 14).
            // Claude's reply keeps what its write changed (the box and the arrow), for Show change.
            let aiReply = BoardComment(id: "c-ready-1b", thread: "c-ready", by: "me", name: "Emil", ai: "Claude", text: Self.claudesReply, created: ago(0.2),
                                       changes: Self.claudesChange.compactMap { $0["id"] as? String })
            let ai = BoardComment(id: "c-publish", on: "fix", x: 1, y: 0, by: "me", name: "Emil", ai: "Claude", text: "Fix it has no owner yet. Sara reviewed the last three drafts: should it be her?", created: ago(12))
            let old = BoardComment(id: "c-old", on: "draft", x: 1, y: 0, by: "me", name: "Emil", text: "Split Draft in two?", created: ago(60 * 26), resolved: true, version: 2)
            NotePageDataStore.shared.set(note.id, BoardComments.keeping([ask, answer, aiReply, ai, old], in: ["values": ["scene": CanvasNativeUITests.flowchart], "collections": [String: Any]()]))
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
                // What Claude's reply says it did, on the board as an AI's change lands: the Inbox
                // and its arrow into Idea, outlined with Claude's name (round 12: the reply named
                // an Inbox the board didn't have).
                CanvasController.highlightTime = 600
                defer { CanvasController.highlightTime = 4 }
                var doc = NotePageDataStore.shared.doc(note.id)
                var values = doc["values"] as? [String: Any] ?? [:]
                var scene = values["scene"] as? [String: Any] ?? [:]
                scene["elements"] = (scene["elements"] as? [[String: Any]] ?? []) + Self.claudesChange
                values["scene"] = scene
                doc["values"] = values
                NotePageDataStore.shared.take(note.id, server: NotePageData.encode(doc), by: "Claude")
                for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                #expect(canvas.highlight?.by == "Claude", "Claude's change is outlined with its name")
                #expect(canvas.highlight?.boxes.count == 1, "the Inbox outlined; the arrow it added has no box of its own: \(String(describing: canvas.highlight?.boxes))")
                let drawn = try await Self.json(web, "(() => { const els = amber._canvas.api.getSceneElements(); const inbox = els.find((e) => e.id === 'inbox'); const a = els.find((e) => e.id === 'inbox-idea'); return { inbox: !!inbox, words: els.filter((e) => e.containerId === 'inbox').map((e) => e.text).join(), from: a && a.startBinding && a.startBinding.elementId, to: a && a.endBinding && a.endBinding.elementId }; })()")
                #expect(drawn["inbox"] as? Bool == true && drawn["words"] as? String == "Inbox" && drawn["from"] as? String == "inbox" && drawn["to"] as? String == "idea",
                        "the board has what the reply says: \(drawn)")
                _ = try await web.evaluateJavaScript("amber._canvasCommand({ op: 'action', name: 'zoomToFit' })")
                await MacWindowChromeTests.settle(w, 10)
                // Sara's newest, arriving now (synced in), with a mention of Emil: the quiet dot, and
                // "Mentions you" in the list.
                let late = BoardComment(id: "c-ready-2", thread: "c-ready", by: Self.sara, name: "Sara", text: "Thanks, that works. @Emil, can Fix it be yours?", created: ago(2), mentions: ["me"])
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
                // Opened as a click on the pin opens it: the page says where the pin, its shape and
                // what's near are, and the thread hangs where it covers none of them (round 13,
                // comments-2: it hid Idea and its arrows).
                canvas.highlight = nil
                canvas.open(thread: "c-ready")
                for _ in 0..<100 where canvas.commentAnchor == nil || canvas.commentAround.on == nil { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 6)
                let thread = try await Self.popover(BoardThreadView(canvas: canvas, id: "c-ready"), dark: dark)
                #expect(canvas.changeLink(for: aiReply) != nil && canvas.changeLink(for: aiReply) != .gone, "Claude's reply offers Show change")
                @MainActor func hang(_ popover: NSBitmapImageRep) throws -> (frame: CGRect, edge: Edge, anchor: CGRect) {
                    let anchor = try #require(canvas.commentAnchor)
                    let scale = popover.size.width > 0 ? CGFloat(popover.pixelsWide) / popover.size.width : 2
                    let size = CGSize(width: CGFloat(popover.pixelsWide) / scale, height: CGFloat(popover.pixelsHigh) / scale)
                    // Placed as the app places it, from its estimate of the popover's size.
                    let place = CanvasCommentAnchor.placement(pin: CanvasCommentAnchor.placed(anchor, in: web.bounds.size), around: canvas.commentAround, area: web.bounds.size, size: CanvasCommentAnchor.popoverSize(canvas))
                    let f = CanvasCommentAnchor.frame(place.edge, anchor: place.anchor, size: size, area: web.bounds.size)
                    #expect(!f.intersects(canvas.commentAround.on ?? .null), "the thread is off its shape: \(f) \(String(describing: canvas.commentAround.on))")
                    #expect(canvas.commentAround.near.allSatisfy { !f.intersects($0) } || place.anchor == anchor, "and off what's near, when there's room")
                    func toWindow(_ r: CGRect) -> CGRect { web.convert(web.isFlipped ? r : CGRect(x: r.minX, y: web.bounds.height - r.maxY, width: r.width, height: r.height), to: nil) }
                    // Above in the page is above on screen: the edge is the same.
                    return (toWindow(f), place.edge, toWindow(place.anchor))
                }
                let hung = try hang(thread)
                try write(try board(try Self.hung(thread, at: hung.frame, edge: hung.edge, anchor: hung.anchor, on: try await capture(), size: w.frame.size, dark: dark)), "comments-2-thread-open")

                // Show change on Claude's reply: all of its change outlined again, the arrow too
                // (round 14, comments-4), with its name, in view.
                guard case .show(let mark)? = canvas.changeLink(for: aiReply) else { Issue.record("Claude's reply has its change"); return }
                #expect(Set(mark.ids) == ["inbox", "inbox-idea"])
                _ = try await web.evaluateJavaScript("amber._canvas.api.updateScene({ appState: { scrollX: -1400, scrollY: 400 } }); 1")
                canvas.closeThread()
                canvas.show(mark)
                for _ in 0..<100 where canvas.highlight?.by != "Claude" { await MacWindowChromeTests.settle(w, 1) }
                #expect(canvas.highlight?.by == "Claude" && canvas.highlight?.boxes.count == 2, "the box and the arrow, outlined: \(String(describing: canvas.highlight))")
                _ = try? await CanvasNativeUITests.settledView(w, web)
                try write(try board(try await capture()), "comments-4-show-change")
                canvas.highlight = nil

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

    /// Claude's reply in the pictured thread, and what it added: an Inbox over Idea, with the
    /// arrow from it into Idea (on `CanvasNativeUITests.flowchart`, whose Idea is at 0, 20).
    static let claudesReply = "Added the arrow from Inbox to Idea."
    static let claudesChange: [[String: Any]] = [
        ["type": "rectangle", "id": "inbox", "x": -5, "y": -170, "width": 180, "height": 76, "label": ["text": "Inbox"],
         "backgroundColor": "#a5d8ff", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "arrow", "id": "inbox-idea", "x": 85, "y": -92, "width": 0, "height": 110, "points": [[0, 0], [0, 110]],
         "start": ["id": "inbox"], "end": ["id": "idea"]],
    ]

    /// The comments pictures' board and thread agree: what Claude's reply says it added is on the
    /// board, joined as it says (round 12, comments-1 against comments-2).
    @Test func theCommentPicturesBoardHasWhatClaudesReplySays() throws {
        let board = (CanvasNativeUITests.flowchart["elements"] as? [[String: Any]] ?? []) + Self.claudesChange
        func named(_ text: String) -> String? {
            board.first { (($0["label"] as? [String: Any])?["text"] as? String) == text }?["id"] as? String
        }
        let inbox = try #require(named("Inbox")), idea = try #require(named("Idea"))
        #expect(Self.claudesReply.contains("Inbox") && Self.claudesReply.contains("Idea"))
        #expect(board.contains { $0["type"] as? String == "arrow" && ($0["start"] as? [String: Any])?["id"] as? String == inbox && ($0["end"] as? [String: Any])?["id"] as? String == idea },
                "an arrow from Inbox to Idea")
        // Clear of the rest: nothing else drawn where the Inbox goes.
        let at = CGRect(x: -5, y: -170, width: 180, height: 76)
        for e in board where e["id"] as? String != inbox {
            guard let x = e["x"] as? Double, let y = e["y"] as? Double, let w = e["width"] as? Double, let h = e["height"] as? Double, e["type"] as? String != "arrow" else { continue }
            #expect(!CGRect(x: x, y: y, width: w, height: h).intersects(at), "\(e["id"] ?? "") overlaps the Inbox")
        }
    }

    static func json(_ web: WKWebView, _ expression: String) async throws -> [String: Any] {
        let s = try await web.evaluateJavaScript("JSON.stringify(\(expression))") as? String ?? "{}"
        return (try JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any]) ?? [:]
    }

    /// `popover` drawn over a window's picture at `card` (the window's points, y up), its arrow on
    /// the side facing `anchor`: `edge` is the side of the anchor it opens on, as seen (.top: above
    /// it on screen, its arrow on its lower edge).
    static func hung(_ popover: NSBitmapImageRep, at card: CGRect, edge: Edge, anchor: CGRect, on window: NSBitmapImageRep, size points: CGSize, dark: Bool) throws -> NSBitmapImageRep {
        let scale = CGFloat(window.pixelsWide) / points.width
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: window.pixelsWide, pixelsHigh: window.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = points
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        window.draw(in: CGRect(origin: .zero, size: points))
        let arrow: CGFloat = 9
        let shape = NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12)
        let tip = NSBezierPath()
        switch edge {
        case .trailing, .leading:
            let right = edge == .trailing
            let x = right ? card.minX : card.maxX, y = min(max(anchor.midY, card.minY + 18), card.maxY - 18)
            tip.move(to: CGPoint(x: x + (right ? 1 : -1), y: y + arrow))
            tip.line(to: CGPoint(x: x + (right ? -arrow : arrow), y: y))
            tip.line(to: CGPoint(x: x + (right ? 1 : -1), y: y - arrow))
        case .top, .bottom:
            // Above the anchor on screen: the arrow on the card's bottom edge, pointing down.
            let above = edge == .top
            let y = above ? card.minY : card.maxY, x = min(max(anchor.midX, card.minX + 18), card.maxX - 18)
            tip.move(to: CGPoint(x: x - arrow, y: y + (above ? 1 : -1)))
            tip.line(to: CGPoint(x: x, y: y + (above ? -arrow : arrow)))
            tip.line(to: CGPoint(x: x + arrow, y: y + (above ? 1 : -1)))
        }
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
