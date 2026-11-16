import Foundation
import SwiftData
import SwiftUI
import Testing
import UniformTypeIdentifiers
import WebKit
#if os(macOS)
import AppKit
#else
import UIKit
#endif
@testable import Pane

/// A canvas's controls are the app's own (13 November 2026): the page and the app talk through
/// `amber._canvasCommand` and the `amberCanvas` message, none of the drawing engine's own UI shows,
/// right-drag pans on the Mac, a canvas folds the columns away, and the sidebar button steps
/// through three states.
@MainActor @Suite(.serialized) struct CanvasNativeUITests {
    /// The canvas page in an offscreen window, joined to a controller as the note pane joins it.
    @MainActor final class Joined {
        let rig: CanvasTests.Rig
        let canvas = CanvasController()
        var web: WKWebView { rig.sandbox.webView }

        init(scene: [String: Any] = CanvasNote.emptyScene(), size: CGSize = CGSize(width: 900, height: 600), dark: Bool = false) async throws {
            rig = try await CanvasTests.Rig(scene: scene, size: size, dark: dark)
            let s = rig.sandbox
            s.onCanvas = { [weak canvas] m in canvas?.receive(m) }
            canvas.deliver = { [weak s] c in s?.canvas(c) }
            canvas.exporter = { [weak s] f, selected, light, page in await s?.canvasExport(f, selected: selected, light: light, page: page) }
            canvas.call = { [weak s] name, args in await s?.canvasCall(name, args) }
            #if os(macOS)
            (s.webView as? NotePageWebView)?.canvas = canvas
            #endif
        }

        func ready() async throws {
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvasCommand)")
            for _ in 0..<100 where !canvas.connected { try await Task.sleep(for: .milliseconds(30)) }
            #expect(canvas.connected, "the page reports its state")
        }

        func until(_ what: String, _ ok: () -> Bool) async {
            for _ in 0..<100 where !ok() { try? await Task.sleep(for: .milliseconds(30)) }
            #expect(ok(), "\(what)")
        }

        func js(_ s: String) async throws -> Any? { try await web.evaluateJavaScript(s) }

        func close() { rig.close() }
    }

    /// The design study's drawing ("Publishing flow"), for pictures.
    static let flowchart: [String: Any] = CanvasTests.scene([
        ["type": "ellipse", "id": "idea", "x": 0, "y": 20, "width": 170, "height": 90, "label": ["text": "Idea"], "backgroundColor": "#ffec99", "fillStyle": "solid"],
        ["type": "rectangle", "id": "draft", "x": 270, "y": 20, "width": 190, "height": 90, "label": ["text": "Draft"], "roundness": ["type": 3]],
        ["type": "diamond", "id": "ready", "x": 540, "y": 0, "width": 220, "height": 130, "label": ["text": "Ready?"]],
        ["type": "rectangle", "id": "publish", "x": 860, "y": 20, "width": 190, "height": 90, "label": ["text": "Publish"], "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "rectangle", "id": "fix", "x": 560, "y": 260, "width": 180, "height": 80, "label": ["text": "Fix it"], "backgroundColor": "#ffc9c9", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "arrow", "x": 172, "y": 65, "width": 96, "height": 0, "start": ["id": "idea"], "end": ["id": "draft"]],
        ["type": "arrow", "x": 462, "y": 65, "width": 76, "height": 0, "start": ["id": "draft"], "end": ["id": "ready"]],
        ["type": "arrow", "x": 762, "y": 65, "width": 96, "height": 0, "start": ["id": "ready"], "end": ["id": "publish"], "label": ["text": "yes"]],
        ["type": "arrow", "x": 650, "y": 132, "width": 0, "height": 126, "start": ["id": "ready"], "end": ["id": "fix"], "label": ["text": "no"]],
    ])

    static let box: [[String: Any]] = [
        ["type": "rectangle", "id": "box", "x": 100, "y": 120, "width": 200, "height": 100],
        ["type": "arrow", "id": "line", "x": 400, "y": 200, "width": 120, "height": 0],
    ]

    // MARK: Round 14

    /// Present fills the view from its first step: Full Screen and Present start together, the
    /// window grows as the first frame is fitted, and the step is fitted to the size the page has
    /// now, not the one the engine had (round 13, 25-present-1: the first step kept the column's
    /// size, the frame off centre with the next one showing). Each step fills alike, and the cover
    /// round the frame is opaque.
    #if os(macOS)
    @Test func presentFillsTheViewFromTheFirstStepAfterTheWindowGrows() async throws {
        let j = try await Joined(scene: Self.twoFrames)
        defer { j.close() }
        try await j.ready()
        #expect(CanvasPresentMask.opacity == 1, "only the frame shows: nothing reads through the cover")
        let size = CGSize(width: 1400, height: 860)
        j.rig.window.setContentSize(size)
        j.web.frame = CGRect(origin: .zero, size: size)
        j.canvas.send(.present(.start))
        await j.until("presenting") { j.canvas.state.present?.index == 0 }
        @MainActor func fill(_ id: String) async throws -> [Double] {
            try #require(try await j.js("""
            (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === '\(id)');
              const c = document.querySelector('#canvas') || document.body, W = c.clientWidth, H = c.clientHeight;
              const x1 = (f.x + s.scrollX) * z, y1 = (f.y + s.scrollY) * z, x2 = (f.x + f.width + s.scrollX) * z, y2 = (f.y + f.height + s.scrollY) * z;
              return [W, H, Math.max((x2 - x1) / W, (y2 - y1) / H), Math.abs((x1 + x2) / 2 - W / 2), y1, H - y2]; })()
            """) as? [Double])
        }
        var first: [Double] = []
        for _ in 0..<40 {
            first = try await fill("f1")
            if first[0] == Double(size.width), first[2] > 0.8, first[3] < 3 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(first[0] == Double(size.width), "the page has the new size: \(first)")
        #expect(first[2] > 0.8 && first[2] <= 0.95, "the first frame fills the view: \(first)")
        #expect(first[3] < 3 && first[4] >= -1 && first[5] >= -1, "centred across, and whole: \(first)")
        j.canvas.send(.present(.next))
        await j.until("the second") { j.canvas.state.present?.index == 1 }
        try await Task.sleep(for: .milliseconds(500))
        let second = try await fill("f2")
        #expect(abs(second[2] - first[2]) < 0.03 && second[3] < 3, "the second fills it alike: \(second) against \(first)")
        j.canvas.send(.present(.prev))
        await j.until("back to the first") { j.canvas.state.present?.index == 0 }
        try await Task.sleep(for: .milliseconds(500))
        let again = try await fill("f1")
        #expect(abs(again[2] - first[2]) < 0.03 && again[3] < 3, "and the first again: \(again)")
        j.canvas.send(.present(.stop))
    }
    #endif

    /// A change from another of your devices is outlined for a moment, quieter than an AI's: grey,
    /// with the device's name, no receipt, gone after a few seconds (round 13, 38-sync-2 and
    /// 41-sync-iphone-2: it came in unmarked). The sync names the device from the row's client.
    @Test func aChangeFromYourOtherDeviceIsOutlinedQuietlyWithItsName() async throws {
        #expect(SyncEngine.device("iPhone") == "iPhone" && SyncEngine.device("Mac") == "Mac" && SyncEngine.device("Claude") == nil && SyncEngine.device(nil) == nil)
        let id = UUID()
        let store = NotePageDataStore.shared
        store.set(id, ["values": ["scene": CanvasTests.scene(Self.box)], "collections": [String: Any]()])
        defer { store.set(id, nil) }
        store.take(id, server: NotePageData.encode(["values": ["scene": CanvasTests.scene(Self.box + [["type": "rectangle", "id": "x", "x": 0, "y": 0, "width": 10, "height": 10]])], "collections": [String: Any]()]), device: "iPhone")
        #expect(store.fromDevices[id]?.device == "iPhone", "the store says which device")
        #expect(store.arrivals[id] == nil, "not an AI's")

        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("amber._flush(); 0")
        try await Task.sleep(for: .milliseconds(300))
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        elements.append(["type": "rectangle", "id": "phone-box", "x": 420, "y": 120, "width": 180, "height": 70, "label": ["text": "Added on iPhone"]])
        let time = CanvasController.arrivalTime
        CanvasController.arrivalTime = 0.8
        defer { CanvasController.arrivalTime = time }
        j.canvas.arrived(from: "iPhone", kind: .device)
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        #expect(h.kind == .device && h.by == "iPhone" && h.kind.quiet && h.time == 0.8, "\(h)")
        #expect(h.boxes.count == 1 && h.rect.width < 240, "only what came: \(h.rect)")
        #expect(j.canvas.notice == nil && j.canvas.lastChangeBy == nil && j.canvas.aiChanges.isEmpty, "no receipt, and not an AI's change")
        #expect(CanvasAIHighlight.tagWidth("iPhone", mark: true) > CanvasAIHighlight.tagWidth("iPhone", mark: false), "the device's symbol in its tag")
        try await Task.sleep(for: .seconds(1.3))
        #expect(j.canvas.highlight == nil, "gone after a moment")
        // Only a device or a person is taken this way.
        j.canvas.arrived(from: "Claude", kind: .ai)
        elements.append(["type": "rectangle", "id": "later", "x": 420, "y": 320, "width": 180, "height": 70])
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        try await Task.sleep(for: .milliseconds(600))
        #expect(j.canvas.highlight == nil)
    }

    /// Someone's change on a shared board is outlined in their colour with their name, the view
    /// left where you have it; nothing while you can see them drawing (their pointer is there);
    /// your own other device is named as such (round 13: changes from another person came in
    /// unmarked).
    @Test func someonesChangeIsOutlinedInTheirColourUnlessYouWatchThem() async throws {
        let people = BoardPeople()
        let (emilDevice, others, note) = try await people.share(CanvasTests.scene([SharedBoardTests.shape("a", x: 40, y: 40)]), people: ["Sara", "Ola"])
        let e = try people.session(emilDevice, note), s = try people.session(others[0], note), o = try people.session(others[1], note)
        let j = try await Joined(scene: CanvasNote.emptyScene())
        defer { j.close() }
        try await j.ready()
        BoardCollab.wire(e, j.canvas)
        defer { BoardCollab.unwire(e, j.canvas) }
        @MainActor func has(_ id: String) async -> Bool { (try? await j.js("amber._canvas.api.getSceneElements().some((e) => e.id === '\(id)')") as? Bool) == true }
        for _ in 0..<100 where !(await has("a")) { try await Task.sleep(for: .milliseconds(30)) }
        let times = (CanvasController.highlightTime, CanvasController.arrivalTime)
        CanvasController.highlightTime = 60; CanvasController.arrivalTime = 60
        defer { (CanvasController.highlightTime, CanvasController.arrivalTime) = times }
        let view = try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.scrollX, s.scrollY, s.zoom.value].join(','); })()") as? String

        s.boardLocal([SharedBoardTests.shape("sara-1", x: 500, y: 300, index: "a5")])
        await people.server.settle()
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        let c = e.boardColors(of: others[0].id)
        #expect(h.kind == .person(color: c.light, dark: c.dark) && h.by == "Sara" && h.kind.quiet, "\(h)")
        #expect(j.canvas.sent.contains(.outline(["sara-1"], move: false)), "outlined where it is, the view yours")
        #expect(try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.scrollX, s.scrollY, s.zoom.value].join(','); })()") as? String == view, "the view didn't move")
        #expect(j.canvas.notice == nil && j.canvas.aiChanges.isEmpty, "no receipt for people")

        // Two at once: both named.
        j.canvas.highlight = nil
        s.boardLocal([SharedBoardTests.shape("sara-2", x: 700, y: 300, index: "a6")])
        o.boardLocal([SharedBoardTests.shape("ola-1", x: 900, y: 300, index: "a7")])
        await people.server.settle()
        await j.until("outlined again") { j.canvas.highlight != nil }
        #expect(["Sara", "Ola", "Sara and Ola", "Ola and Sara"].contains(j.canvas.highlight?.by ?? ""), "\(String(describing: j.canvas.highlight))")

        // Sara's pointer is on the board: you see her drawing, so nothing more marks it.
        s.boardPresence(pointer: CGPoint(x: 520, y: 320), selection: [])
        await people.server.eventually { e.watching(others[0].id) }
        #expect(e.watching(others[0].id))
        j.canvas.highlight = nil
        s.boardLocal([SharedBoardTests.shape("sara-3", x: 500, y: 500, index: "a8")])
        await people.server.settle()
        for _ in 0..<100 where !(await has("sara-3")) { try await Task.sleep(for: .milliseconds(30)) }
        try await Task.sleep(for: .milliseconds(400))
        #expect(await has("sara-3") && j.canvas.highlight == nil, "on the board, not outlined: \(String(describing: j.canvas.highlight))")

        // Who's named, from the authors of what came.
        #expect(BoardCollab.arrival([others[0].id], in: e) == nil, "watching her")
        let me = e.me
        #expect(BoardCollab.arrival([me], in: e)?.name == BoardCollab.yourOtherDevice && BoardCollab.arrival([me], in: e)?.kind == .device)
        #expect(BoardCollab.arrival([others[1].id], in: e)?.name == "Ola")
        _ = note
    }

    /// Whole frames that came at once get one outline each, round the frame and its name, not one
    /// round every shape inside as well; the name tag goes above the frame's name (round 14,
    /// follow-0: boxes in boxes, and "Sara" on "The problem").
    @Test func framesThatCameAreOutlinedOnceEachNameAndAll() async throws {
        let j = try await Joined(scene: CanvasNote.emptyScene())
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("""
        amber._canvasCommand({ op: 'insert', elements: [
          { type: 'text', id: 'p1', x: 40, y: 40, text: 'Sign-up takes 6 steps', fontSize: 28 },
          { type: 'rectangle', id: 'p2', x: 40, y: 110, width: 200, height: 120, label: { text: '42% drop at step 4' } },
          { type: 'frame', id: 'fp', children: ['p1', 'p2'], name: 'The problem' },
          { type: 'rectangle', id: 'i2', x: 640, y: 120, width: 180, height: 90, label: { text: 'Sign in with Apple' } },
          { type: 'frame', id: 'fi', children: ['i2'], name: 'The idea' },
        ] }); 1
        """)
        for _ in 0..<100 where (try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'frame').length") as? Int ?? 0) < 2 {
            try await Task.sleep(for: .milliseconds(30))
        }
        _ = try await j.js("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.7, animate: false }); 1")
        try await Task.sleep(for: .milliseconds(200))
        let time = CanvasController.highlightTime
        CanvasController.highlightTime = 60
        defer { CanvasController.highlightTime = time }
        // Inserting gives everything new ids: all of it, as it came.
        let ids = try #require(try await j.js("amber._canvas.api.getSceneElements().filter((e) => !e.containerId).map((e) => e.id).join(',')") as? String).split(separator: ",").map(String.init)
        #expect(ids.count == 5)
        j.canvas.highlight = nil
        j.canvas.arrived(by: "Sara")
        j.canvas.send(.outline(ids, move: false))
        await j.until("outlined") { j.canvas.highlight?.by == "Sara" }
        let h = try #require(j.canvas.highlight)
        #expect(h.boxes.count == 2, "one box for each frame: \(h.boxes)")
        let frame = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.type === 'frame' && e.name === 'The problem');
          return [(f.x + s.scrollX) * z, (f.y + s.scrollY) * z, f.width * z, f.height * z].join(','); })()
        """) as? String).split(separator: ",").compactMap { Double($0) }
        let drawn = CGRect(x: frame[0], y: frame[1], width: frame[2], height: frame[3])
        // Its name is drawn 14 pt high, just above it, at any zoom.
        let name = CGRect(x: drawn.minX, y: drawn.minY - 20, width: 90, height: 18)
        let box = try #require(h.boxes.first { $0.insetBy(dx: -2, dy: -2).contains(drawn) }, "round the frame: \(drawn) in \(h.boxes)")
        #expect(box.minY <= name.minY, "and its name: \(box) over \(name)")
        let outlines = CanvasAIHighlight(highlight: h).outlines
        let spot = CanvasAIHighlight.tag(for: h, outlines: outlines)
        let tag = CGRect(origin: spot, size: CGSize(width: CanvasAIHighlight.tagWidth("Sara"), height: CanvasAIHighlight.tagHeight))
        #expect(!tag.intersects(name), "the tag isn't on the frame's name: \(tag) on \(name)")
    }

    /// The AI's name tag stands at least 8 pt from words beside it, ink and all (round 13, 12, 13
    /// and 15: the ChatGPT tag sat a few points from the end of the how-to line, third round).
    @Test func theAIsTagKeepsEightPointsFromWords() {
        let shape = CGRect(x: 300, y: 200, width: 180, height: 70)
        for words in [CGRect(x: 40, y: 150, width: 262, height: 25), CGRect(x: 40, y: 166, width: 250, height: 25), CGRect(x: 380, y: 150, width: 300, height: 22)] {
            let h = CanvasController.Highlight(rect: shape, by: "ChatGPT", count: 1, boxes: [shape], near: [words], view: CGSize(width: 900, height: 600))
            let outlines = CanvasAIHighlight(highlight: h).outlines
            let spot = CanvasAIHighlight.tag(for: h, outlines: outlines)
            let tag = CGRect(origin: spot, size: CGSize(width: CanvasAIHighlight.tagWidth("ChatGPT"), height: CanvasAIHighlight.tagHeight))
            let gap = max(words.minX - tag.maxX, tag.minX - words.maxX, words.minY - tag.maxY, tag.minY - words.maxY)
            #expect(gap >= CanvasAIHighlight.clearance + CanvasAIHighlight.inkReach - 0.5, "\(gap) pt: \(tag) by \(words)")
        }
    }

    /// Nor does it sit on a row of words beside it, however far it keeps: next to the end of the
    /// how-to line it read as the line's last word (round 15, 12-ai-drew: 8 pt past "…to add an
    /// arrow.", four rounds running). It goes beside its shape instead, still 8 pt from everything.
    @Test func theAIsTagNeverSharesARowWithWords() {
        // As in 12-ai-drew: the AI's group on the right, the how-to line ending just left of it,
        // a little above its top.
        let shape = CGRect(x: 845, y: 276, width: 180, height: 70)
        let line = CGRect(x: 240, y: 222, width: 594, height: 22)
        let h = CanvasController.Highlight(rect: shape, by: "ChatGPT", count: 1, boxes: [shape], near: [line], rows: [line], view: CGSize(width: 1100, height: 800))
        let outlines = CanvasAIHighlight(highlight: h).outlines
        let spot = CanvasAIHighlight.tag(for: h, outlines: outlines)
        let tag = CGRect(origin: spot, size: CGSize(width: CanvasAIHighlight.tagWidth("ChatGPT"), height: CanvasAIHighlight.tagHeight))
        let inked = line.insetBy(dx: -CanvasAIHighlight.inkReach, dy: -CanvasAIHighlight.inkReach)
        #expect(!(tag.minY < inked.maxY && inked.minY < tag.maxY), "not on the line's row: \(tag) by \(inked)")
        #expect(CanvasAIHighlight.gap(tag, to: [inked], lines: []) >= CanvasAIHighlight.clearance, "8 pt clear: \(tag)")
        let top = outlines[0]
        #expect(!tag.intersects(top) && tag.insetBy(dx: -12, dy: -12).intersects(top), "by its outline: \(tag) at \(top)")
        // Without the line there, it stays above its shape at its left end, as before.
        let alone = CanvasAIHighlight.tag(for: CanvasController.Highlight(rect: shape, by: "ChatGPT", count: 1, boxes: [shape], view: CGSize(width: 1100, height: 800)), outlines: outlines)
        #expect(alone == CGPoint(x: top.minX, y: top.minY - 4 - CanvasAIHighlight.tagHeight), "\(alone)")
        // A line of words far off to the left is no row of the tag's.
        #expect(!CanvasAIHighlight.sharesRow(CGRect(x: 845, y: 230, width: 90, height: 22), with: [CGRect(x: 40, y: 222, width: 300, height: 22)]))
    }

    /// An AI's reply in a comment thread that comes with a change offers Show change: it outlines
    /// that change with the AI's name and brings it into view, as Show Last AI Change does (round
    /// 14). A person's reply, another AI's, or one from long before offers nothing.
    @Test func anAIsReplyWithAChangeOffersShowChange() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("amber._flush(); 0")
        try await Task.sleep(for: .milliseconds(300))
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        elements.append(["type": "rectangle", "id": "ai-box", "x": 600, "y": 120, "width": 180, "height": 70, "label": ["text": "Notify team"]])
        let time = CanvasController.highlightTime
        CanvasController.highlightTime = 60
        defer { CanvasController.highlightTime = time }
        j.canvas.arrived(by: "Claude")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let mark = try #require(j.canvas.aiChanges.last)
        #expect(mark.by == "Claude" && mark.ids.contains("ai-box"), "\(mark)")
        let now = BoardComments.stamp(.now)
        func reply(_ ai: String?, at: String = now) -> BoardComment {
            BoardComment(id: UUID().uuidString, thread: "t", by: "me", name: "Emil", ai: ai, text: "I added Notify team under Approved.", created: at)
        }
        #expect(j.canvas.change(for: reply("Claude")) == mark)
        #expect(j.canvas.change(for: reply("Emil's Claude")) == mark, "named with its person")
        #expect(j.canvas.change(for: reply(nil)) == nil, "a person's reply")
        #expect(j.canvas.change(for: reply("ChatGPT")) == nil, "another AI's")
        #expect(j.canvas.change(for: reply("Claude", at: BoardComments.stamp(.now.addingTimeInterval(-3600)))) == nil, "an hour before")
        #expect(BoardCommentUI.showChange == "Show change")
        // Shown: outlined again, in view.
        j.canvas.highlight = nil
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { scrollX: -3000, scrollY: 0 } }); 1")
        j.canvas.show(mark)
        #expect(j.canvas.sent.contains(.outline(mark.ids)))
        await j.until("outlined again") { j.canvas.highlight?.by == "Claude" }
        let inView = try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === 'ai-box');
          const x1 = (b.x + s.scrollX) * z, x2 = (b.x + b.width + s.scrollX) * z, y1 = (b.y + s.scrollY) * z, y2 = (b.y + b.height + s.scrollY) * z;
          return x1 >= 0 && x2 <= s.width && y1 >= 0 && y2 <= s.height; })()
        """) as? Bool
        #expect(inView == true, "brought into view")
        #expect(j.canvas.aiChanges.count == 1, "the same change, not a new one")
    }

    /// The follower's banner names the frame and the step: "Emil is presenting · Launch · 2 of 4"
    /// (round 14), the step alone for an unnamed frame, nothing more for one step.
    @Test func theFollowBannerNamesTheFrameAndStep() {
        let emil = BoardPerson(id: TestPeople.emil, name: "Emil", color: TestPeople.color(TestPeople.emil).light, dark: TestPeople.color(TestPeople.emil).dark, presenting: BoardPresenting(frame: "f2", i: 1, n: 4))
        let names = ["f2": "Launch"]
        #expect(BoardFollow.Banner.presenting(emil).words { names[$0] } == "Emil is presenting \u{00B7} Launch \u{00B7} 2 of 4")
        #expect(BoardFollow.Banner.following(emil).words { names[$0] } == "Following Emil \u{00B7} Launch \u{00B7} 2 of 4")
        #expect(BoardFollow.Banner.presenting(emil).words { _ in nil } == "Emil is presenting \u{00B7} 2 of 4")
        var one = emil
        one.presenting = BoardPresenting(frame: nil, i: 0, n: 1)
        #expect(BoardFollow.Banner.presenting(one).words { _ in "Board" } == "Emil is presenting")
        one.presenting = BoardPresenting(frame: "f2", i: 0, n: 1)
        #expect(BoardFollow.Banner.presenting(one).words { names[$0] } == "Emil is presenting \u{00B7} Launch", "one step needs no count")
        var none = emil
        none.presenting = nil
        #expect(BoardFollow.Banner.following(none).words { names[$0] } == "Following Emil")
    }

    /// A board opened from a search shows its first match: in view, outlined for a moment, with no
    /// name (round 14: a search for a word on a board found the board, but it opened anywhere).
    /// Asked before the page is ready, it's done once it is. Case and accents don't matter.
    @Test func aSearchOpensTheBoardAtItsMatch() async throws {
        let id = UUID()
        SearchJump.set(id, query: " Fix ")
        #expect(SearchJump.take(id) == "Fix" && SearchJump.take(id) == nil, "the words, once")
        var scene = Self.flowchart
        scene["elements"] = (scene["elements"] as? [[String: Any]] ?? []) + [["type": "text", "id": "far", "x": 3200, "y": 1800, "text": "Email the waitlist", "fontSize": 20]]
        let j = try await Joined(scene: scene)
        defer { j.close() }
        let times = (CanvasController.highlightTime, CanvasController.foundTime)
        CanvasController.highlightTime = 60; CanvasController.foundTime = 60
        defer { (CanvasController.highlightTime, CanvasController.foundTime) = times }
        j.canvas.find("WAITLIST")
        try await j.ready()
        await j.until("the match is outlined") { j.canvas.highlight?.kind == .found }
        #expect(j.canvas.finding == nil)
        @MainActor func inView(_ id: String) async throws -> Bool {
            try await j.js("""
            (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === '\(id)');
              const x1 = (b.x + s.scrollX) * z, x2 = (b.x + b.width + s.scrollX) * z, y1 = (b.y + s.scrollY) * z, y2 = (b.y + b.height + s.scrollY) * z;
              return x1 >= 0 && x2 <= s.width && y1 >= 0 && y2 <= s.height && z >= 0.5; })()
            """) as? Bool == true
        }
        #expect(try await inView("far"), "the far words in view, readable")
        let centre = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === 'far');
          return [((b.x + b.width / 2) + s.scrollX) * z - s.width / 2, ((b.y + b.height / 2) + s.scrollY) * z - s.height / 2]; })()
        """) as? [Double])
        // (Within a few points: words are measured again once the hand-drawn font is in.)
        #expect(abs(centre[0]) < 40 && abs(centre[1]) < 40, "in the middle of the view, not at its edge: \(centre)")
        let h = try #require(j.canvas.highlight)
        #expect(h.by.isEmpty && h.count >= 1 && h.kind.quiet, "\(h)")
        #expect(j.canvas.aiChanges.isEmpty && j.canvas.lastChangeBy == nil, "not an AI's change")
        // A shape's words: the shape.
        j.canvas.highlight = nil
        j.canvas.find("réady")
        await j.until("Ready? is outlined") { j.canvas.highlight?.kind == .found }
        #expect(try await inView("ready"))
        // Nothing found: nothing outlined.
        j.canvas.highlight = nil
        j.canvas.find("zebra")
        try await Task.sleep(for: .milliseconds(500))
        #expect(j.canvas.highlight == nil)
    }

    #if os(macOS)
    /// End to end in the notes window: a search for a word that's on a board lists the board, and
    /// opening it shows the word in view, outlined for a moment (round 14). Pictures with
    /// WHITEBOARD_SHOTS.
    @Test func aBoardFoundBySearchOpensAtTheWord() async throws {
        let dir = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        let c = try AppSnapshotTests.container()
        let launch = CanvasNote.make(in: .all, context: c.mainContext)
        launch.body = "Product launch"
        launch.updatedAt = .now.addingTimeInterval(-600)
        var scene = Self.flowchart
        scene["elements"] = (scene["elements"] as? [[String: Any]] ?? []) + [
            ["type": "rectangle", "id": "wait", "x": 1500, "y": 700, "width": 230, "height": 90, "label": ["text": "Email the waitlist"], "backgroundColor": "#ffec99", "fillStyle": "solid", "roundness": ["type": 3]],
        ]
        NotePageDataStore.shared.set(launch.id, ["values": ["scene": scene], "collections": [String: Any]()])
        defer { NotePageDataStore.shared.set(launch.id, nil) }
        let roadmap = CanvasNote.make(in: .all, context: c.mainContext)
        roadmap.body = "Q3 roadmap"
        NotePageDataStore.shared.set(roadmap.id, ["values": ["scene": CanvasTests.scene(WhiteboardTemplate.kanban.elements)], "collections": [String: Any]()])
        defer { NotePageDataStore.shared.set(roadmap.id, nil) }
        try c.mainContext.save()
        let times = (CanvasController.highlightTime, CanvasController.foundTime)
        CanvasController.highlightTime = 60; CanvasController.foundTime = 60
        defer { (CanvasController.highlightTime, CanvasController.foundTime) = times }
        for dark in [false, true] where dir != nil || !dark {
            // Each window opens on the roadmap, as after a launch, so picking the result opens the board.
            try await AppSnapshotTests.withLastNote(c, "Q3 roadmap") {
                let size = CGSize(width: 1400, height: 900)
                let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                 styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
                    .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
                w.setContentSize(size)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                @MainActor func shot(_ name: String, web: WKWebView?) async throws {
                    guard let dir else { return }
                    await MacWindowChromeTests.settle(w, 10)
                    var cover: NSImageView?
                    if let web {
                        _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                        let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                        let v = NSImageView(frame: web.bounds)
                        v.image = image
                        v.imageScaling = .scaleAxesIndependently
                        web.addSubview(v)
                        cover = v
                    }
                    defer { cover?.removeFromSuperview() }
                    w.contentView?.layoutSubtreeIfNeeded()
                    w.displayIfNeeded()
                    try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"))
                }
                // The list's search, as ⌘F or Go to Note starts it, for a word on the board.
                NotificationCenter.default.post(name: .paneSearchNotes, object: "waitlist")
                await MacWindowChromeTests.settle(w, 10)
                let table = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
                for _ in 0..<100 where table.numberOfRows == 0 { await MacWindowChromeTests.settle(w, 1) }
                #expect(table.numberOfRows >= 1, "the board is in the results")
                try await shot("42-search-1-results", web: NotePageLive.view(roadmap.id))
                // Opened from the results: the board at the word.
                // The board's own view in this window, with its canvas (not the last window's).
                @MainActor func opened() -> NotePageWebView? {
                    guard let v = NotePageLive.view(launch.id) as? NotePageWebView, v.window === w, v.canvas != nil else { return nil }
                    return v
                }
                var web: NotePageWebView?
                for row in 0..<table.numberOfRows where web == nil {
                    table.selectRowIndexes(IndexSet(integer: row), byExtendingSelection: false)
                    for _ in 0..<60 where web == nil { web = opened(); if web == nil { await MacWindowChromeTests.settle(w, 1) } }
                }
                let board = try #require(web, "the board opened from its result")
                try await CanvasTests().run(board, until: "!!(window.amber && window.amber._canvas)")
                let canvas = try #require(board.canvas)
                for _ in 0..<150 where canvas.highlight?.kind != .found { await MacWindowChromeTests.settle(w, 1) }
                #expect(canvas.highlight?.kind == .found, "the match is outlined: \(String(describing: canvas.highlight))")
                let inView = try await board.evaluateJavaScript("""
                (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === 'wait');
                  const x1 = (b.x + s.scrollX) * z, x2 = (b.x + b.width + s.scrollX) * z, y1 = (b.y + s.scrollY) * z, y2 = (b.y + b.height + s.scrollY) * z;
                  return x1 >= 0 && x2 <= s.width && y1 >= 0 && y2 <= s.height && z >= 0.5; })()
                """) as? Bool
                #expect(inView == true, "the waitlist's shape is in view, readable")
                _ = try? await Self.settledView(w, board)
                try await shot("42-search-2-board-at-the-word", web: board)
                NotificationCenter.default.post(name: .paneToggleSearch, object: nil)
                await MacWindowChromeTests.settle(w, 5)
            }
        }
    }
    #endif

    // MARK: The bridge

    @Test func aToolPickedInTheAppReachesThePageAndComesBack() async throws {
        let j = try await Joined()
        defer { j.close() }
        try await j.ready()
        #expect(j.canvas.state.tool == .selection)
        j.canvas.pick(.rectangle)
        await j.until("the page's tool is the rectangle") { j.canvas.state.tool == .rectangle }
        #expect(try await j.js("amber._canvas.api.getAppState().activeTool.type") as? String == "rectangle")
        #expect(j.canvas.state.stylable, "a drawing tool's style can be set before drawing")
        // A key on the canvas (the page's own shortcut) is reported back too.
        _ = try await j.js("amber._canvas.api.setActiveTool({ type: 'ellipse' }); 1")
        await j.until("the app sees the ellipse") { j.canvas.state.tool == .ellipse }
        // Anything else is refused.
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'embeddable' })") as? Bool == false)
        #expect(try await j.js("amber._canvasCommand({ op: 'nope' })") as? Bool == false)
    }

    @Test func aStyleSetInTheAppChangesTheSelectionAndUndoTakesItBack() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        #expect(!j.canvas.state.hasSelection && !j.canvas.state.showsSelectionBar)
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        await j.until("the selection is reported, with where it is") { j.canvas.state.selection == ["rectangle"] && j.canvas.state.bounds != nil }
        let bounds = try #require(j.canvas.state.bounds)
        #expect(bounds.width > 150 && bounds.height > 60, "the box's size on screen: \(bounds)")
        #expect(j.canvas.state.showsSelectionBar && j.canvas.state.showsFill && !j.canvas.state.showsArrowheads)

        // One at a time, as a person picks them.
        j.canvas.set(.strokeColor, .text("#e03131"))
        await j.until("the stroke colour") { j.canvas.state.strokeColor == "#e03131" }
        j.canvas.set(.backgroundColor, .text("#a5d8ff"))
        await j.until("the fill") { j.canvas.state.backgroundColor == "#a5d8ff" }
        j.canvas.set(.strokeWidth, .number(4))
        await j.until("the box shows the new style") { j.canvas.state.strokeWidth == 4 }
        let box = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().find((e) => e.id === 'box'))") as? String ?? ""
        #expect(box.contains("\"strokeColor\":\"#e03131\"") && box.contains("\"strokeWidth\":4"))
        #expect(j.canvas.canUndo, "each change is a step in the drawing's history")

        j.canvas.run(.undo)
        await j.until("Undo takes back the last change") { j.canvas.state.strokeWidth == 2 }
        #expect(j.canvas.canRedo)
        j.canvas.run(.redo)
        await j.until("and Redo puts it back") { j.canvas.state.strokeWidth == 4 }

        // Layer order and Duplicate run through the engine's own actions.
        j.canvas.run(.sendToBack)
        await j.until("sent to the back") { true }
        let first = try await j.js("amber._canvas.api.getSceneElements()[0].id") as? String
        #expect(first == "box")
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        await j.until("the box selected again") { j.canvas.state.selection == ["rectangle"] }
        j.canvas.run(.duplicate)
        try await Task.sleep(for: .milliseconds(200))
        let rectangles = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'rectangle').length") as? Int
        #expect(rectangles == 2, "duplicated: \(String(describing: rectangles))")
    }

    @Test func zoomAndTheBackgroundFromTheMenus() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let before = j.canvas.state.zoom
        j.canvas.run(.zoomIn)
        await j.until("View › Zoom In zooms the drawing") { j.canvas.state.zoom > before }
        j.canvas.run(.resetZoom)
        await j.until("Actual Size") { abs(j.canvas.state.zoom - 1) < 0.001 }
        j.canvas.send(.background("#fffce8"))
        await j.until("the background from the ••• menu") { j.canvas.state.background == "#fffce8" }
        // Saved with the drawing.
        for _ in 0..<60 where (j.rig.scene?["appState"] as? [String: Any])?["viewBackgroundColor"] as? String != "#fffce8" { try await Task.sleep(for: .milliseconds(50)) }
        #expect((j.rig.scene?["appState"] as? [String: Any])?["viewBackgroundColor"] as? String == "#fffce8")
        // The ••• menu has the canvas's items, first.
        let groups = NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: true, appsEnabled: true, phone: false, dev: false, canvas: true)
        #expect(groups.first(where: { $0.contains(.canvasClear) }) == [.canvasLastAIChange, .canvasZoomToFit, .canvasBackground, .canvasExport, .canvasSaveTemplate, .canvasClear])
        let present = groups.firstIndex(of: [.canvasPresent, .canvasLaser]), drawing = groups.firstIndex { $0.contains(.canvasClear) }
        #expect(present != nil && drawing != nil && present! + 1 == drawing!, "Present and the laser pointer, then the drawing's items: \(groups)")
        #expect(!NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: true, appsEnabled: true).joined().contains(.canvasClear))
    }

    // MARK: None of the engine's UI

    /// What of the engine's own UI can be seen: its buttons, panels, inputs and hint lines.
    static let visibleEngineUI = """
    (() => {
      const seen = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && el.offsetParent !== null; };
      const all = [...document.querySelectorAll('.excalidraw button, .excalidraw [role=button], .excalidraw .Island, .excalidraw input, .excalidraw label, .excalidraw .HintViewer, .excalidraw .welcome-screen-center, .excalidraw [class*=toolbar], .excalidraw [class*=menu]')];
      return all.filter(seen).map((e) => (e.className && e.className.baseVal === undefined ? e.className : e.tagName) + '').slice(0, 12);
    })()
    """

    @Test(arguments: [false, true]) func noneOfTheEnginesOwnUIShows(dark: Bool) async throws {
        #if os(macOS)
        let size = CGSize(width: 1100, height: 700)
        #else
        let size = CGSize(width: 393, height: 760)
        #endif
        let j = try await Joined(scene: CanvasTests.scene(Self.box), size: size, dark: dark)
        defer { j.close() }
        try await j.ready()
        // With a tool picked and a shape selected: the moments its panels used to open.
        j.canvas.pick(.freedraw)
        try await Task.sleep(for: .milliseconds(300))
        var seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing of the engine's UI with the pencil: \(seen ?? [])")
        _ = try await j.js("amber._canvas.api.setActiveTool({ type: 'selection' }); amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        try await Task.sleep(for: .milliseconds(300))
        seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing with a shape selected: \(seen ?? [])")
        // Its dialogs' keys open nothing (help, the command palette, search).
        _ = try await j.js("""
        for (const k of [{ key: '?' }, { key: '/', metaKey: true }, { key: 'f', metaKey: true }, { key: 'p', metaKey: true, shiftKey: true }])
          document.dispatchEvent(new KeyboardEvent('keydown', { ...k, bubbles: true })); 1
        """)
        try await Task.sleep(for: .milliseconds(200))
        let dialog = try await j.js("amber._canvas.api.getAppState().openDialog")
        #expect(dialog is NSNull, "no dialog opened: \(String(describing: dialog))")
        seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing after its keys: \(seen ?? [])")
        // The single-key tools still work: they're the page's own.
        _ = try await j.js("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true })); 1")
        await j.until("R picks the rectangle") { j.canvas.state.tool == .rectangle }
        // A right click on the page never reaches the engine's menu or the web view's.
        let refused = try await j.js("""
        (() => { const c = document.querySelector('.excalidraw canvas.interactive') || document.querySelector('.excalidraw canvas');
          const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 200, clientY: 200 });
          return !c.dispatchEvent(e); })()
        """) as? Bool
        #expect(refused == true, "the page stops the context menu")
        #expect(try await j.js("document.querySelectorAll('.excalidraw .context-menu').length") as? Int == 0)
    }

    // MARK: Mac: right-drag, Undo, the menu

    #if os(macOS)
    static func event(_ type: NSEvent.EventType, at p: CGPoint, in w: NSWindow) -> NSEvent {
        NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                           windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
    }

    /// Delivered to the web view itself, in this process: nothing is posted to the system.
    @Test func rightDragPansTheDrawingAndARightClickOpensTheAppsMenu() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let web = try #require(j.web as? NotePageWebView)
        let w = j.rig.window
        var shown: [NSMenu] = []
        web.presentMenu = { menu, _, _ in shown.append(menu) }
        let x0 = try #require(try await j.js("amber._canvas.api.getAppState().scrollX") as? Double)
        let y0 = try #require(try await j.js("amber._canvas.api.getAppState().scrollY") as? Double)
        // Down, then right 80 and up 30 in the window (y runs up), then let go.
        web.rightMouseDown(with: Self.event(.rightMouseDown, at: CGPoint(x: 300, y: 300), in: w))
        for step in 1...4 {
            let d = CGFloat(step)
            web.rightMouseDragged(with: Self.event(.rightMouseDragged, at: CGPoint(x: 300 + 20 * d, y: 300 + 7.5 * d), in: w))
        }
        #expect(web.panning)
        web.rightMouseUp(with: Self.event(.rightMouseUp, at: CGPoint(x: 380, y: 330), in: w))
        try await Task.sleep(for: .milliseconds(200))
        let x1 = try #require(try await j.js("amber._canvas.api.getAppState().scrollX") as? Double)
        let y1 = try #require(try await j.js("amber._canvas.api.getAppState().scrollY") as? Double)
        #expect(abs((x1 - x0) - 80) < 0.5, "the drawing follows the pointer right: \(x1 - x0)")
        #expect(abs((y1 - y0) - (-30)) < 0.5, "and up: \(y1 - y0)")
        #expect(shown.isEmpty, "a drag opens no menu")
        #expect(j.canvas.sent.allSatisfy { if case .pan = $0 { true } else { false } })

        // A right click that doesn't move: the app's menu, never the web view's.
        web.rightMouseDown(with: Self.event(.rightMouseDown, at: CGPoint(x: 300, y: 300), in: w))
        web.rightMouseDragged(with: Self.event(.rightMouseDragged, at: CGPoint(x: 301, y: 301), in: w))
        web.rightMouseUp(with: Self.event(.rightMouseUp, at: CGPoint(x: 301, y: 301), in: w))
        let menu = try #require(shown.first)
        let titles: [String] = menu.items.map(\.title).filter { !$0.isEmpty }
        // Comment first: on the spot clicked, as nothing is selected (BoardCommentsCanvasTests).
        let expected: [String] = ["Comment", "Duplicate", "Delete", "Save to Library", NoteMoreMenu.saveTemplateTitle, "Bring to Front", "Bring Forward", "Send Backward", "Send to Back", "Select All", "Zoom to Fit"]
        #expect(titles == expected)
        #expect(menu.items.first { $0.title == "Delete" }?.isEnabled == false, "nothing selected: nothing to delete")
        // Select All from it reaches the page.
        let all = try #require(menu.items.first { $0.title == "Select All" })
        _ = all.target?.perform(all.action, with: all)
        await j.until("everything is selected") { j.canvas.state.selection.count == 2 }
        // The web view's own menu, should one start (Control-click): emptied.
        let webMenu = NSMenu()
        webMenu.addItem(withTitle: "Reload", action: nil, keyEquivalent: "")
        web.willOpenMenu(webMenu, with: Self.event(.rightMouseDown, at: .zero, in: w))
        #expect(webMenu.items.isEmpty)
    }

    /// An empty whiteboard offers its templates; one comes in whole, joined up, as one step Undo
    /// takes back (Emil, 13 November 2026: "a quick option to create a blank whiteboard or use
    /// some templates").
    @Test func anEmptyWhiteboardOffersTemplatesThatComeInAsOneUndoStep() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        await j.until("the page says it's empty") { j.canvas.state.empty }
        #expect(CanvasStart.shows(j.canvas.state))
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        #expect(!CanvasStart.shows(j.canvas.state), "the templates step away")
        let n = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type !== 'text').length") as? Int
        #expect(n == 10, "five shapes and five arrows: \(n ?? -1)")
        let joined = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'arrow' && e.startBinding && e.endBinding).length") as? Int
        #expect(joined == 5, "every arrow joins two shapes: \(joined ?? -1)")
        let labels = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'text').map((e) => e.originalText).sort().join('|')") as? String
        #expect(labels?.hasPrefix("Did it work?|Do the thing|Done|Double-click a shape") == true && labels?.contains("|No|") == true && labels?.contains("|Yes") == true, "\(labels ?? "")")
        let hint = try await j.js("amber._canvas.scene().elements.filter((e) => e.customData && e.customData.pintoHint).length") as? Int
        #expect(hint == 1, "the how-to line keeps its mark once saved, for the list's preview")
        let web = try #require(j.web as? NotePageWebView)
        NSApp.sendAction(#selector(NotePageWebView.undo(_:)), to: web, from: NSMenuItem(title: "Undo", action: #selector(NotePageWebView.undo(_:)), keyEquivalent: "z"))
        await j.until("one Undo takes it back") { j.canvas.state.empty }
    }

    /// A board exports as a PNG, an SVG that carries its scene, and an .excalidraw file, the
    /// whole board or only what's selected (14 November 2026: Excalidraw's Export image and Copy
    /// as PNG; nothing could leave a whiteboard before).
    @Test func aBoardExportsAsPNGSVGAndExcalidraw() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        #expect(await j.canvas.export(.png) == nil, "an empty board has nothing to export")
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        let png = try #require(await j.canvas.export(.png))
        #expect(png.prefix(4) == Data([0x89, 0x50, 0x4E, 0x47]), "a PNG")
        #if os(macOS)
        let whole = try #require(NSBitmapImageRep(data: png))
        #expect(whole.pixelsWide > 800, "at 2x: \(whole.pixelsWide)")
        #endif
        let svgFile = try #require(await j.canvas.export(.svg))
        let svg = String(decoding: svgFile, as: UTF8.self)
        #expect(svg.hasPrefix("<svg") && svg.contains("payload-type:application/vnd.excalidraw+json"), "an SVG that carries its scene")
        #expect(!svg.contains("Double-click a shape"), "the template's how-to line isn't in the picture")
        let file = try #require(await j.canvas.export(.excalidraw))
        let json = try #require(try JSONSerialization.jsonObject(with: file) as? [String: Any])
        #expect(json["type"] as? String == "excalidraw")
        let all = (json["elements"] as? [[String: Any]])?.count ?? 0
        #expect(all >= 15, "every shape, arrow and label: \(all)")
        // Only the selection, when asked and something is selected.
        _ = try await j.js("(() => { const api = amber._canvas.api; const box = api.getSceneElements().find((e) => e.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [box.id]: true } } }); return 1; })()")
        await j.until("the box is selected") { j.canvas.state.selection == ["rectangle"] }
        let oneFile = try #require(await j.canvas.export(.excalidraw, selected: true))
        let one = try #require(try JSONSerialization.jsonObject(with: oneFile) as? [String: Any])
        #expect((one["elements"] as? [[String: Any]])?.count == 1, "only the selected box")
        #if os(macOS)
        let partFile = try #require(await j.canvas.export(.png, selected: true))
        let part = try #require(NSBitmapImageRep(data: partFile))
        #expect(part.pixelsWide < whole.pixelsWide, "the selection's picture is smaller than the board's")
        #endif
        #expect(CanvasExport.filename("Q3: plan/roadmap", .png) == "Q3 planroadmap.png")
        #expect(CanvasExport.filename("  ", .svg) == "Whiteboard.svg")
    }

    /// A shared board's web page shows a picture of it (BoardPicture, 14 November 2026): the
    /// whole board at 2x, on its own light background even while the app is dark, as the page
    /// shows it on a light card.
    @Test func aSharedBoardsPictureIsTheWholeBoardLightAt2x() async throws {
        let j = try await Joined(scene: Self.flowchart, dark: true)
        defer { j.close() }
        try await j.ready()
        let note = UUID()
        BoardPicture.opened(j.canvas, note: note)
        defer { BoardPicture.closed(j.canvas, note: note) }
        #expect(BoardPicture.board(note) === j.canvas, "the open board is found by its note")
        #if os(macOS)
        func corner(_ png: Data) throws -> CGFloat {
            let rep = try #require(NSBitmapImageRep(data: png))
            return try #require(rep.colorAt(x: 4, y: 4)?.usingColorSpace(.deviceRGB)).brightnessComponent
        }
        #expect(try await j.js("amber._canvas.api.getAppState().theme") as? String == "dark", "the board shows dark")
        // Export and the page's picture are both the board as drawn, light (a dark picture pasted
        // as a black block; whiteboard council, round 2).
        let root = { (svg: Data) in String(String(decoding: svg, as: UTF8.self).prefix { $0 != ">" }) }
        #expect(!root(try #require(await j.canvas.export(.svg))).contains("filter="), "Export from dark mode is light")
        #expect(!root(try #require(await j.canvas.export(.svg, light: true))).contains("filter="), "light: as drawn")
        let picture = try #require(await j.canvas.export(.png, light: true))
        #expect(try corner(picture) > 0.95, "the page's picture is the board's white")
        let rep = try #require(NSBitmapImageRep(data: picture))
        #expect(rep.pixelsWide > 2000 && rep.pixelsHigh > 600, "the whole flowchart at 2x: \(rep.pixelsWide)×\(rep.pixelsHigh)")
        #expect(BoardPicture.fitted(picture) == picture && picture.count < BoardPicture.maxBytes, "well under the limit: \(picture.count) bytes")
        #endif
        // Its words are the page's text.
        let words = CanvasSketch(elements: Self.flowchart["elements"] as? [[String: Any]] ?? []).texts
        #expect(BoardPicture.body(title: "Publishing flow", words: words) == "Publishing flow\n\nIdea\n\nDraft\n\nReady?\n\nPublish\n\nFix it\n\nyes\n\nno")
    }

    /// A picture of a board leaves out a template's how-to line and the band it stood in
    /// (whiteboard council, round 3: about 75 pt of blank paper between the title and the drawing
    /// in 14, 18, 19 and 20). The shared page's picture also leaves out the board's title when the
    /// page's heading says it (20, 21: the title twice), and the page's scene leaves out the
    /// how-to line. Export's .excalidraw file keeps everything where it was.
    @Test func picturesCloseTheHowToBandAndThePagesPictureLeavesOutItsTitle() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        let name = "Sprint 14 retro"
        j.canvas.send(.insert(.retro, title: name))
        await j.until("the retro is in") { !j.canvas.state.empty }
        func elements(_ file: Data?) throws -> [[String: Any]] {
            let data = try #require(file)
            let json = try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
            return json["elements"] as? [[String: Any]] ?? []
        }
        func marked(_ e: [String: Any], _ k: String) -> Bool { (e["customData"] as? [String: Any])?[k] as? Bool == true }
        func num(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        // A lane: the retro's tall boxes.
        func lane(_ all: [[String: Any]]) -> [String: Any]? { all.filter { $0["type"] as? String == "rectangle" && num($0, "height") > 300 }.min { num($0, "x") < num($1, "x") } }

        // Export's file keeps the how-to line where it is.
        let full = try elements(await j.canvas.export(.excalidraw))
        let title = try #require(full.first { marked($0, "pintoTitle") }), hint = try #require(full.first { marked($0, "pintoHint") })
        #expect(title["text"] as? String == name)
        let fullLane = try #require(lane(full))
        // The band: the line's height and the gap above it.
        let band = num(hint, "y") + num(hint, "height") - (num(title, "y") + num(title, "height"))
        #expect(band > 15 && band < 40, "\(band)")

        // The page's scene: no how-to line, what was under it moved up by the band, the title kept.
        let page = try elements(await j.canvas.export(.excalidraw, page: name))
        #expect(!page.contains { marked($0, "pintoHint") } && page.count == full.count - 1)
        let pageTitle = try #require(page.first { marked($0, "pintoTitle") })
        #expect(num(pageTitle, "y") == num(title, "y"), "what's above the line stays")
        let pageLane = try #require(lane(page))
        #expect(abs(num(pageLane, "y") - (num(fullLane, "y") - band)) < 0.5, "the lanes moved up by the band: \(num(fullLane, "y")) to \(num(pageLane, "y"))")
        #expect(abs((num(pageLane, "y") - num(title, "y") - num(title, "height")) - (num(fullLane, "y") - num(hint, "y") - num(hint, "height"))) < 0.5,
                "the gap under the title is the one that was under the line")

        // The page's SVG has no title; one made for another name, or Export's, has it.
        let svg = { (d: Data?) in String(decoding: d ?? Data(), as: UTF8.self) }
        #expect(!svg(await j.canvas.export(.svg, light: true, page: name)).contains(">\(name)<"))
        #expect(svg(await j.canvas.export(.svg)).contains(">\(name)<"))
        #expect(svg(await j.canvas.export(.svg, light: true, page: "Another board")).contains(">\(name)<"))
        #expect(!svg(await j.canvas.export(.svg)).contains("Double-click a card"), "no how-to line in any picture")

        #if os(macOS)
        func height(_ png: Data?) throws -> Int {
            let data = try #require(png)
            return try #require(NSBitmapImageRep(data: data)).pixelsHigh
        }
        let picture = try height(await j.canvas.export(.png))
        // The page's picture starts at the lanes: the title and the gap under it are gone (at 2x).
        let pagePicture = try height(await j.canvas.export(.png, light: true, page: name))
        let cut = 2 * (num(pageLane, "y") - num(title, "y"))
        #expect(abs(Double(picture - pagePicture) - cut) < 8, "\(picture) to \(pagePicture), \(cut) less")
        #expect(try height(await j.canvas.export(.png, light: true, page: "Another board")) == picture, "a title that isn't the page's name stays")
        // The how-to line rubbed out by hand leaves nothing to close: its band shows, and the
        // picture is that much taller than the one that closed it.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.customData && e.customData.pintoHint ? { ...e, isDeleted: true } : e) }); return 1; })()")
        let banded = try height(await j.canvas.export(.png))
        #expect(abs(Double(banded - picture) - 2 * band) < 4, "\(banded) with the band, \(picture) without; \(2 * band) expected")
        #endif
    }

    #if os(macOS)
    static func png(width: Int, height: Int, clear: Bool) -> Data {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                   isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        (clear ? NSColor.clear : NSColor.systemTeal).setFill()
        NSRect(x: 0, y: 0, width: width, height: height).fill(using: .copy)
        NSColor.systemOrange.setFill()
        NSRect(x: width / 4, y: height / 4, width: width / 2, height: height / 2).fill()
        NSGraphicsContext.restoreGraphicsState()
        return rep.representation(using: .png, properties: [:])!
    }

    /// Like a photo: smooth colour that changes everywhere, with grain.
    static func photo(width: Int, height: Int) -> Data {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false,
                                   isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        let p = rep.bitmapData!, row = rep.bytesPerRow
        var seed: UInt32 = 7
        for y in 0..<height {
            for x in 0..<width {
                seed = seed &* 1_664_525 &+ 1_013_904_223
                let grain = Int(seed >> 28)
                let i = y * row + x * 3
                p[i] = UInt8(clamping: 128 + Int(100 * sin(Double(x) / 90)) + grain)
                p[i + 1] = UInt8(clamping: 128 + Int(100 * cos(Double(y) / 70)) + grain)
                p[i + 2] = UInt8(clamping: (x + y) / 20 % 256 + grain)
            }
        }
        return rep.representation(using: .png, properties: [:])!
    }

    /// Pictures go on a board: pasted, dropped or picked, each made at most 2560 pixels across, a
    /// PNG for a screenshot and a JPEG for a photo, placed in the view, selected, and saved with the
    /// board (whiteboard council, round 1: "images on the board" was missing).
    @Test func aPictureGoesOnTheBoardSmallEnoughToKeep() async throws {
        // A screenshot (flat colours): sharp, as a PNG, at most 2560 across.
        let big = try #require(CanvasImage(data: Self.png(width: 3200, height: 2000, clear: false)))
        #expect(big.mimeType == "image/png" && big.dataURL.hasPrefix("data:image/png;base64,"))
        #expect(big.width == 2560 && big.height == 1600, "\(big.width)x\(big.height)")
        #expect(big.dataURL.utf8.count < 400_000, "small enough to keep: \(big.dataURL.utf8.count) bytes")
        // A photo (every pixel different): a JPEG, at most 1920 across, still small enough to keep.
        let photo = try #require(CanvasImage(data: Self.photo(width: 3000, height: 2000)))
        #expect(photo.mimeType == "image/jpeg" && photo.width == 1920, "\(photo.mimeType) \(photo.width)")
        #expect(photo.dataURL.utf8.count < 1_200_000, "\(photo.dataURL.utf8.count) bytes")
        let cut = try #require(CanvasImage(data: Self.png(width: 400, height: 300, clear: true)))
        #expect(cut.mimeType == "image/png", "see-through parts stay see-through")
        #expect(CanvasImage(data: Data("not a picture".utf8)) == nil)

        // The clipboard: a picture, or picture files; never the board's own copied shapes (text).
        let pb = NSPasteboard(name: .init("pinto.test.\(UUID().uuidString)"))
        defer { pb.releaseGlobally() }
        pb.clearContents(); pb.setData(Self.png(width: 20, height: 20, clear: false), forType: .png)
        #expect(NotePageWebView.pictures(on: pb).count == 1)
        pb.clearContents(); pb.setString("{\"type\":\"excalidraw/clipboard\"}", forType: .string)
        #expect(NotePageWebView.pictures(on: pb).isEmpty, "the board's own shapes paste as they did")

        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.image(big, at: nil))
        await j.until("the picture is selected") { j.canvas.state.selection == ["image"] }
        let kept = try await j.js("(() => { const s = amber._canvas.scene(); const i = s.elements.find((e) => e.type === 'image'); return [!!i, !!(i && s.files[i.fileId]), i ? Math.round(i.width) : 0].join(','); })()") as? String
        #expect(kept?.hasPrefix("true,true,") == true, "an image element with its file, saved in the scene: \(kept ?? "")")
        // Pasted over the drawing, it goes beside it, in view (whiteboard council, round 2, 11).
        let left = try await j.js("Math.round(amber._canvas.api.getSceneElements().find((e) => e.type === 'image').x)") as? Int
        #expect((left ?? 0) >= 520, "right of the box and arrow: \(left ?? -1)")
        let b = try #require(j.canvas.state.bounds)
        #expect(b.minX >= 0 && b.maxX <= 900 && b.minY >= 0 && b.maxY <= 600, "in view: \(b)")
        // Crop (round 6: "pasted screenshots almost always need trimming"): the handles, then Done keeps it.
        j.canvas.run(.crop)
        await j.until("cropping") { j.canvas.state.cropping }
        #expect(try await j.js("(() => { const s = amber._canvas.api.getAppState(), i = amber._canvas.api.getSceneElements().find((e) => e.type === 'image'); return s.croppingElementId === i.id; })()") as? Bool == true)
        _ = try await j.js("(() => { const api = amber._canvas.api, i = api.getSceneElements().find((e) => e.type === 'image'); api.updateScene({ elements: api.getSceneElements().map((e) => e.id === i.id ? { ...e, width: e.width / 2, crop: { x: 0, y: 0, width: 1600, height: 2000, naturalWidth: 3200, naturalHeight: 2000 }, version: e.version + 1 } : e) }); return 0; })()")
        j.canvas.send(.cropDone)
        await j.until("done cropping") { !j.canvas.state.cropping }
        #expect(j.canvas.state.selection == ["image"], "the picture stays selected")
        #expect(try await j.js("!!amber._canvas.scene().elements.find((e) => e.type === 'image').crop") as? Bool == true, "the crop is saved")
        // A save the store refuses is said, not lost quietly.
        j.canvas.receive(["error": "Not saved: too big"])
        #expect(j.canvas.notice == "Not saved: too big")
    }

    /// When an AI draws on the open board, what it drew is outlined with its name, and the receipt
    /// says it drew (whiteboard council, round 1: "show what the AI did").
    @Test func whatAnAIDrewIsOutlinedWithItsName() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        // As an AI writes it over MCP: the short form, far to the right of what's there.
        elements.append(["type": "rectangle", "id": "ai-box", "x": 2400, "y": 200, "width": 220, "height": 90, "label": ["text": "Launch"]])
        j.canvas.arrived(by: "Claude")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        #expect(h.by == "Claude" && h.count >= 1)
        // Off to the side, so it was brought into view: only as far as needed, by the right edge,
        // so the rest stays as close as it can (round 2, 16).
        #expect(h.rect.minX >= -1 && h.rect.maxX <= 901, "in view: \(h.rect)")
        #expect(h.rect.maxX > 820 && h.rect.maxX < 880, "moved just far enough: \(h.rect)")
        #expect(h.rect.width > 100)
        // Later, panned away: More › Show Claude's Last Change outlines it again, in view (round 7).
        #expect(CanvasController.showLastChangeTitle(j.canvas.lastChangeBy) == "Show Claude\u{2019}s Last Change")
        #expect(CanvasController.showLastChangeTitle(nil) == "Show Last AI Change")
        j.canvas.highlight = nil
        j.canvas.send(.pan(dx: 3000, dy: 0))
        try await Task.sleep(for: .milliseconds(200))
        j.canvas.showLastChange()
        await j.until("outlined again") { j.canvas.highlight != nil }
        let again = try #require(j.canvas.highlight)
        #expect(again.by == "Claude" && again.rect.minX >= -1 && again.rect.maxX <= 901, "named and in view: \(again.rect)")
        let r = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: "", lines: 0, kind: .dataEdit, board: true)
        #expect(r.summary == "Claude drew on this whiteboard" && r.shortSummary == "Claude drew on it")
    }

    /// Only what the AI drew is outlined, not the arrows already on the board that the merge
    /// re-laid (whiteboard council, round 2, 12-ai-drew: the outline took in half the flowchart).
    @Test func theOutlineTakesInOnlyWhatTheAIDrew() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(1500))
        _ = try await j.js("amber._flush(); 0")
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        let right = try #require(try await j.js("Math.round(Math.max(...amber._canvas.api.getSceneElements().map((e) => e.x + e.width)))") as? Int)
        elements.append(["type": "rectangle", "id": "ai-box", "x": right + 80, "y": 0, "width": 180, "height": 70, "label": ["text": "Request"]])
        CanvasController.highlightTime = 60
        j.canvas.arrived(by: "ChatGPT")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        #expect(h.count == 2, "the box and its words: \(h.count)")
        #expect(h.rect.width < 260 && h.rect.height < 120, "only the new box: \(h.rect)")
        // The window gets wider, the view stays centred, and the outline moves with the drawing,
        // however long after it arrived.
        defer { CanvasController.highlightTime = 4 }
        try await Task.sleep(for: .seconds(9))
        j.rig.window.setContentSize(CGSize(width: 1300, height: 600))
        j.web.frame = CGRect(x: 0, y: 0, width: 1300, height: 600)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1300 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        await j.until("the outline followed") { (j.canvas.highlight?.rect.minX ?? h.rect.minX) - h.rect.minX > 150 }
        #expect(abs((j.canvas.highlight?.rect.minX ?? 0) - (h.rect.minX + 200)) < 4, "moved by half the new width: \(String(describing: j.canvas.highlight?.rect)) from \(h.rect)")
    }

    /// An AI's arrow in the short form, to a shape the board already has (`"end": { "id": "idea" }`,
    /// as the README tells it), comes in joined to it both ways (round 13: Claude's arrow from a new
    /// Inbox into the board's Idea came in loose: the engine joins only shapes written with it).
    @Test func anAIsArrowJoinsAShapeAlreadyOnTheBoard() async throws {
        let j = try await Joined(scene: Self.flowchart)
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("amber._flush(); 0")
        try await Task.sleep(for: .milliseconds(300))
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        elements += [
            ["type": "rectangle", "id": "inbox", "x": -5, "y": -170, "width": 180, "height": 76, "label": ["text": "Inbox"]],
            ["type": "arrow", "id": "inbox-idea", "x": 85, "y": -92, "width": 0, "height": 110, "start": ["id": "inbox"], "end": ["id": "idea"]],
            // Without an id of its own, from a shape on the board to another.
            ["type": "arrow", "x": 650, "y": 132, "width": 0, "height": 126, "start": ["id": "fix"], "end": ["id": "publish"]],
        ]
        j.canvas.arrived(by: "Claude")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        let joins = """
        (() => { const els = amber._canvas.api.getSceneElements(), by = (id) => els.find((e) => e.id === id);
          const a = by('inbox-idea'), b = els.find((e) => e.type === 'arrow' && e.startBinding && e.startBinding.elementId === 'fix');
          const has = (shape, arrow) => !!(by(shape) && arrow && (by(shape).boundElements || []).some((x) => x.id === arrow.id));
          return JSON.stringify({ a: a ? [a.startBinding && a.startBinding.elementId, a.endBinding && a.endBinding.elementId, has('inbox', a), has('idea', a)] : null,
                                  b: b ? [b.endBinding && b.endBinding.elementId, has('fix', b), has('publish', b)] : null }); })()
        """
        var said = ""
        for _ in 0..<100 {
            said = try await j.js(joins) as? String ?? ""
            if said.contains("\"a\":[") && said.contains("\"b\":[") { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(said == #"{"a":["inbox","idea",true,true],"b":["publish",true,true]}"#, "joined both ways: \(said)")
    }

    /// The person's own drawing stays in view: a paste beside it zooms out to show both, an AI's
    /// change shows the whole board when it fits, and each thing the AI changed gets its own
    /// outline, round the shape whose words it changed, with the name tag clear of it
    /// (whiteboard council, round 3: 11, 12, 13 and 16).
    @Test func theWholeBoardStaysInViewAndEachAIChangeIsOutlined() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box + [
            ["type": "text", "id": "box-t", "containerId": "box", "text": "Manager review", "x": 120, "y": 160, "width": 160, "height": 25, "fontSize": 20],
        ]))
        defer { j.close() }
        try await j.ready()
        let allInView = """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value; const els = api.getSceneElements();
          const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y)), x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
          return (x1 + s.scrollX) * z >= -1 && (y1 + s.scrollY) * z >= -1 && (x2 + s.scrollX) * z <= s.width + 1 && (y2 + s.scrollY) * z <= s.height + 1; })()
        """
        // A big screenshot pasted onto the drawing goes beside it, and the view zooms out to show both.
        let shot = try #require(CanvasImage(data: Self.png(width: 3200, height: 2000, clear: false)))
        j.canvas.send(.image(shot, at: nil))
        await j.until("the picture is in") { j.canvas.state.selection == ["image"] }
        #expect(try await j.js(allInView) as? Bool == true, "the drawing and the picture both in view")
        let zoom = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(zoom < 1 && zoom >= 0.5, "zoomed out to fit, not below half: \(zoom)")
        // The picture goes and the window gets bigger: the view zooms back in towards 100%.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'image') }); return 0; })()")
        j.rig.window.setContentSize(CGSize(width: 1300, height: 800))
        j.web.frame = CGRect(x: 0, y: 0, width: 1300, height: 800)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1300 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        try await Task.sleep(for: .milliseconds(200))
        let back = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(back > zoom + 0.05 && back <= 1, "zoomed back in, not past 100%: \(zoom) → \(back)")
        // A wide board, whole at 100%; the window narrows: it stays whole, zoomed out (round 4, 15).
        _ = try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState();
          const wide = { ...api.getSceneElements().find((e) => e.id === 'box'), id: 'far', x: 1000, y: 140, width: 150, height: 80, boundElements: [], seed: 7, version: 1 };
          api.updateScene({ elements: [...api.getSceneElements(), wide], appState: { zoom: { value: 1 }, scrollX: -80 + 48, scrollY: 0 } }); return 0; })()
        """)
        try await Task.sleep(for: .milliseconds(200))
        #expect(try await j.js(allInView) as? Bool == true, "whole before")
        j.rig.window.setContentSize(CGSize(width: 900, height: 600))
        j.web.frame = CGRect(x: 0, y: 0, width: 900, height: 600)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 900 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        try await Task.sleep(for: .milliseconds(300))
        #expect(try await j.js(allInView) as? Bool == true, "still whole after the window narrowed")
        let narrowed = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(narrowed < 1 && narrowed >= 0.5, "zoomed out to keep it whole: \(narrowed)")
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.id !== 'far') }); return 0; })()")
        // Panned so part of the board is cut off; the AI renames the box and adds one beside it, in
        // view: the whole board comes back into view (it fits at this zoom).
        _ = try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(); api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'image'), appState: { zoom: { value: 1 }, scrollX: -200, scrollY: 0 } }); return 0; })()")
        try await Task.sleep(for: .milliseconds(300))
        #expect(try await j.js(allInView) as? Bool == false, "cut off before")
        _ = try await j.js("amber._flush(); 0")
        try await Task.sleep(for: .milliseconds(300))
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        for i in elements.indices where elements[i]["id"] as? String == "box-t" { elements[i]["text"] = "Finance review"; elements[i]["version"] = 50 }
        elements.append(["type": "rectangle", "id": "ai-box", "x": 560, "y": 120, "width": 200, "height": 100, "label": ["text": "Notify team"]])
        elements.append(["type": "arrow", "id": "ai-arrow", "x": 300, "y": 170, "width": 260, "height": 0, "points": [[0, 0], [260, 0]]])
        CanvasController.highlightTime = 60
        defer { CanvasController.highlightTime = 4 }
        j.canvas.arrived(by: "ChatGPT")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        #expect(try await j.js(allInView) as? Bool == true, "the whole board in view after the AI's change")
        let h = try #require(j.canvas.highlight)
        #expect(h.boxes.count == 2, "the renamed box and the new one, each on its own; the arrow between them without a box: \(h.boxes)")
        // The arrow it added has no outline, but the name tag still keeps clear of it (round 8, 16).
        let arrowAt = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, a = api.getSceneElements().find((e) => e.id === 'ai-arrow');
          return [(a.x + s.scrollX) * z, (a.y + s.scrollY) * z, a.width * z].join(','); })()
        """) as? String).split(separator: ",").compactMap { Double($0) }
        #expect(h.lines.contains { l in l.points.count == 2 && abs(l.points[0].x - arrowAt[0]) < 4 && abs(l.points[0].y - arrowAt[1]) < 6 && abs(l.points[1].x - l.points[0].x - arrowAt[2]) < 4 },
                "the AI's own arrow is among what the tag avoids, as the line it draws: \(arrowAt) in \(h.lines)")
        #expect(!h.near.contains { $0.width < 2 || $0.height < 2 }, "arrows aren't boxes any more: \(h.near)")
        // The renamed box's outline goes round the box, not just its words.
        let box = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === 'box');
          return [(b.x + s.scrollX) * z, (b.y + s.scrollY) * z, b.width * z, b.height * z].join(','); })()
        """) as? String).split(separator: ",").compactMap { Double($0) }
        let shape = CGRect(x: box[0], y: box[1], width: box[2], height: box[3])
        #expect(h.boxes.contains { $0.insetBy(dx: -2, dy: -2).contains(shape) }, "round the whole box: \(shape) in \(h.boxes)")
        #expect(!h.boxes.contains { $0.contains(shape) && $0.width > shape.width * 2 }, "not one box round both")
        // The tag sits above the topmost outline, clear of it.
        let tag = CanvasAIHighlight.tag(over: CanvasAIHighlight(highlight: h).outlines)
        let top = try #require(CanvasAIHighlight(highlight: h).outlines.min { $0.minY < $1.minY })
        #expect(tag.y + 22 <= top.minY || tag.y >= top.maxY, "the tag doesn't cover the shape: \(tag) over \(top)")
        // …nor the rest of the drawing when there's a clear spot (round 4: the how-to line, an arrow).
        let shape2 = CGRect(x: 100, y: 200, width: 300, height: 80)
        let hint = CGRect(x: 90, y: 160, width: 120, height: 20)
        let at = CanvasAIHighlight.tag(over: [shape2], avoiding: [hint])
        #expect(!CGRect(x: at.x, y: at.y, width: 96, height: 22).intersects(hint), "clear of the hint line: \(at)")
        #expect(at.y + 22 <= shape2.minY || at.y >= shape2.maxY, "still clear of the shape: \(at)")
        // An arrow running down into the shape just past the tag's end, its head's barbs
        // spreading 8.5 pt either side. The tag keeps 8 pt from the line and the head (rounds 7
        // and 10, 16: "ChatGPT" touched it).
        let tip = CGPoint(x: shape2.minX + 99, y: shape2.minY - 4)
        let arrow: [CanvasAIHighlight.Line] = [
            .init(points: [CGPoint(x: tip.x, y: 140), tip], radius: 2.5),
            .init(points: [tip, CGPoint(x: tip.x - 8.5, y: tip.y - 23.5)], radius: 2.5),
            .init(points: [tip, CGPoint(x: tip.x + 8.5, y: tip.y - 23.5)], radius: 2.5),
        ]
        let byArrow = CanvasAIHighlight.tag(over: [shape2], lines: arrow)
        let gap = CanvasAIHighlight.gap(CGRect(x: byArrow.x, y: byArrow.y, width: 96, height: 22), to: [], lines: arrow)
        #expect(gap >= 8, "8 pt clear of the arrow and its head: \(gap) at \(byArrow)")
        #expect(byArrow.y + 22 <= shape2.minY, "still above the shape: \(byArrow)")
    }

    /// Undo and Redo give back exactly what was there: after Align, Undo, Redo, a bound arrow
    /// runs where it ran after Align (whiteboard council, round 4, 22-sequence: Redo put the arrow
    /// 9 pt lower).
    @Test func redoPutsABoundArrowBackWhereItWas() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("""
        amber._canvasCommand({ op: 'insert', elements: [
          { type: 'rectangle', id: 'a', x: 0, y: 160, width: 200, height: 90, label: { text: 'Plan' } },
          { type: 'rectangle', id: 'b', x: 420, y: 0, width: 200, height: 90, label: { text: 'Ship' } },
          { type: 'arrow', x: 204, y: 200, width: 212, height: -150, start: { id: 'a' }, end: { id: 'b' } },
        ] }); 0
        """)
        await j.until("drawn") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(500))
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.type === 'rectangle').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids }, captureUpdate: 'IMMEDIATELY' }); return 0; })()")
        try await Task.sleep(for: .milliseconds(200))
        let arrow = "(() => { const a = amber._canvas.api.getSceneElements().find((e) => e.type === 'arrow'); return [a.x, a.y, ...a.points.flat()].map((v) => Math.round(v)).join(','); })()"
        j.canvas.run(.alignMiddle)
        try await Task.sleep(for: .milliseconds(20))
        let soon = try #require(try await j.js(arrow) as? String)
        try await Task.sleep(for: .milliseconds(600))
        let aligned = try #require(try await j.js(arrow) as? String)
        #expect(soon == aligned, "nothing moves it after Align: \(soon) then \(aligned)")
        // Lined up, the arrow runs straight across between them (round 4, 22-sequence-2).
        let dy = aligned.split(separator: ",").compactMap { Int($0) }.last ?? 99
        #expect(abs(dy) <= 1, "straight across after Align › Middle: \(aligned)")
        j.canvas.run(.undo)
        try await Task.sleep(for: .milliseconds(600))
        let undone = try #require(try await j.js(arrow) as? String)
        #expect(undone != aligned, "Undo moved it back")
        j.canvas.run(.redo)
        try await Task.sleep(for: .milliseconds(600))
        let redone = try #require(try await j.js(arrow) as? String)
        #expect(redone == aligned, "Redo: \(redone), after Align: \(aligned)")
        j.canvas.run(.undo); try await Task.sleep(for: .milliseconds(600))
        j.canvas.run(.redo); try await Task.sleep(for: .milliseconds(600))
        #expect(try await j.js(arrow) as? String == aligned, "and again")
    }

    /// In dark mode the selection's outline and handles show in the accent, not the dim brown the
    /// dark filter made of it (whiteboard council, round 2, 07-selected-box-dark).
    @Test func theSelectionShowsInTheAccentInDarkMode() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        // Through the filter (invert, then hue-rotate 180°), what's drawn comes out as the accent.
        let js = """
        (() => { const H = [[-0.574, 1.43, 0.144], [0.426, 0.43, 0.144], [0.426, 1.43, -0.856]];
          return ["#ff9f0a", "#c9711a", "#3478f6"].map((want) => { const x = amber._throughDarkFilter(want);
            const n = parseInt(x.slice(1), 16), inv = [255 - ((n >> 16) & 255), 255 - ((n >> 8) & 255), 255 - (n & 255)];
            const shown = H.map((r) => Math.min(255, Math.max(0, r[0] * inv[0] + r[1] * inv[1] + r[2] * inv[2])));
            const w = parseInt(want.slice(1), 16), t = [(w >> 16) & 255, (w >> 8) & 255, w & 255];
            return Math.max(...shown.map((v, i) => Math.abs(v - t[i]))); }).join(","); })()
        """
        let errors = try #require(try await j.js(js) as? String)
        #expect(errors.split(separator: ",").allSatisfy { Double($0)! <= 40 }, "each within a shade: \(errors)")
        // A dark board: the colour the engine reads for the selection is the one made for the filter.
        let d = try await Joined(scene: CanvasTests.scene(Self.box), dark: true)
        defer { d.close() }
        try await d.ready()
        let read = """
        (() => { const c = document.querySelector('.excalidraw'), r = getComputedStyle(document.documentElement);
          return [c && c.className, r.getPropertyValue('--amber-accent').trim(), document.documentElement.style.getPropertyValue('--pinto-selection-dark'),
            c && getComputedStyle(c).getPropertyValue('--color-selection').trim(), c && getComputedStyle(c.querySelector('canvas.interactive') || c).filter].join('|'); })()
        """
        let seen = try #require(try await d.js(read) as? String)
        let parts = seen.split(separator: "|", omittingEmptySubsequences: false).map(String.init)
        #expect(parts.count == 5 && parts[0].contains("theme--dark"), "\(seen)")
        let made = try await d.js("amber._throughDarkFilter('\(parts[1])')") as? String
        #expect(parts.count == 5 && parts[3].lowercased() == made?.lowercased(), "the engine reads the filtered accent: \(seen), made \(made ?? "nil")")
        // Exported from a dark board, the picture is light: it goes into mostly white documents.
        d.canvas.exporter = { [weak s = d.rig.sandbox] f, selected, light, page in await s?.canvasExport(f, selected: selected, light: light, page: page) }
        let png = try #require(await d.canvas.export(.png))
        let corner = try #require(NSBitmapImageRep(data: png)?.colorAt(x: 2, y: 2)?.usingColorSpace(.sRGB))
        #expect(corner.brightnessComponent > 0.9, "a light background: \(corner)")
    }

    /// An empty whiteboard offers to bring in Excalidraw files (whiteboard council, round 4:
    /// "an Excalidraw import entry on the empty board").
    @Test func anEmptyBoardOffersToImportExcalidrawFiles() async throws {
        let ax = OffscreenAX(CanvasStart(canvas: CanvasController()), size: CGSize(width: 700, height: 360))
        defer { ax.close() }
        await ax.settle()
        let link = try #require(ax.find("canvas.import"), "\(ax.ids())")
        #expect(link.text.contains("Import Excalidraw files"), "\(link.text)")
        #expect(ax.find("canvas.template.retro") != nil)
    }

    /// An AI's short-form arrow with a width of 0 and no points runs straight down, as written
    /// (the engine read the 0 as missing and drew it slanting).
    @Test func aStraightDownArrowFromAnAIStaysStraight() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "arrow", "id": "down", "x": 100, "y": 100, "width": 0, "height": 120],
            ["type": "line", "id": "across", "x": 100, "y": 300, "width": 160, "height": 0],
        ]))
        defer { j.close() }
        try await j.ready()
        let ends = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.type === 'arrow' || e.type === 'line').map((e) => e.points[e.points.length - 1].map(Math.round)))") as? String)
        let v = ends.filter { "-0123456789,".contains($0) }.split(separator: ",").compactMap { Int($0) }
        #expect(v.count == 4 && v[0] == 0 && abs(v[1] - 120) <= 2 && abs(v[2] - 160) <= 2 && v[3] == 0, "straight down, straight across: \(ends)")
    }

    /// Present walks the board's frames one by one, each filling the view, with the laser pointer
    /// picked; next, previous and Escape from the keyboard; with no frames, the whole board
    /// (whiteboard council, rounds 4 and 5: frames, presenting, a laser pointer).
    @Test func presentWalksTheFramesAndEnds() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 40, "y": 40, "width": 120, "height": 80],
            ["type": "rectangle", "id": "b", "x": 1460, "y": 960, "width": 420, "height": 280],
            ["type": "frame", "id": "f1", "children": ["a"], "name": "Intro"],
            ["type": "frame", "id": "f2", "children": ["b"], "name": "Plan"],
        ]))
        defer { j.close() }
        try await j.ready()
        // While you work, a frame doesn't cut what runs over its edge: drawn whole (round 14, web-04).
        #expect(try await j.js("amber._canvas.api.getAppState().frameRendering.clip") as? Bool == false, "frames don't cut shapes while you work")
        let frameInView = { (id: String) in """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === '\(id)');
          const x1 = (f.x + s.scrollX) * z, y1 = (f.y + s.scrollY) * z, x2 = (f.x + f.width + s.scrollX) * z, y2 = (f.y + f.height + s.scrollY) * z;
          return x1 >= -1 && y1 >= -1 && x2 <= s.width + 1 && y2 <= s.height + 1 && ((x2 - x1) > s.width * 0.6 || (y2 - y1) > s.height * 0.6); })()
        """ }
        let before = try #require(try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.zoom.value, s.scrollX, s.scrollY].join(','); })()") as? String)
        j.canvas.send(.present(.start))
        await j.until("presenting the first frame") { j.canvas.state.present?.index == 0 }
        #expect(j.canvas.state.present?.index == 0 && j.canvas.state.present?.count == 2 && j.canvas.state.present?.name == "Intro")
        #expect(j.canvas.state.tool == .laser, "the laser pointer is picked")
        #expect(CanvasPresentBar.position(j.canvas.state.present!) == "1 of 2")
        try await Task.sleep(for: .milliseconds(700))
        #expect(try await j.js(frameInView("f1")) as? Bool == true, "the first frame fills the view")
        j.canvas.send(.present(.next))
        await j.until("the second") { j.canvas.state.present?.index == 1 }
        #expect(j.canvas.state.present?.name == "Plan")
        try await Task.sleep(for: .milliseconds(700))
        #expect(try await j.js(frameInView("f2")) as? Bool == true, "the second frame fills the view")
        // The frame's name and outline are hidden while presenting: the bar names it (round 6).
        // What runs over its edge is cut there: only the frame shows.
        #expect(try await j.js("(() => { const r = amber._canvas.api.getAppState().frameRendering; return !r.name && !r.outline && r.clip; })()") as? Bool == true)
        // The window grows (Full Screen hides the columns): the step fits again (round 6, 25-present-1).
        let size0 = j.web.frame.size
        j.rig.window.setContentSize(CGSize(width: size0.width + 500, height: size0.height + 200))
        j.web.frame = CGRect(x: 0, y: 0, width: size0.width + 500, height: size0.height + 200)
        try await Task.sleep(for: .milliseconds(500))
        #expect(try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === 'f2'); return f.width * z > s.width * 0.8 || f.height * z > s.height * 0.8; })()") as? Bool == true, "refitted to the larger window")
        // The laser toggles off and on from the Present bar.
        j.canvas.send(.tool(.selection))
        await j.until("laser off") { j.canvas.state.tool == .selection }
        j.canvas.send(.tool(.laser))
        await j.until("laser on") { j.canvas.state.tool == .laser }
        j.rig.window.setContentSize(size0)
        j.web.frame = CGRect(origin: .zero, size: size0)
        try await Task.sleep(for: .milliseconds(500))
        // Where it is on screen, for the cover over the rest of the board (round 6).
        let shown = try #require(j.canvas.state.present?.frame)
        let real = try #require(try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === 'f2'); return [(f.x + s.scrollX) * z, (f.y + s.scrollY) * z, f.width * z, f.height * z].map(Math.round).join(','); })()") as? String)
        #expect("\(Int(shown.minX)),\(Int(shown.minY)),\(Int(shown.width)),\(Int(shown.height))" == real, "\(shown) vs \(real)")
        j.canvas.send(.present(.next))
        try await Task.sleep(for: .milliseconds(150))
        #expect(j.canvas.state.present?.index == 1, "no further than the last")
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); 0")
        await j.until("← goes back") { j.canvas.state.present?.index == 0 }
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); 0")
        await j.until("Escape ends it") { j.canvas.state.present == nil }
        #expect(j.canvas.state.tool == .selection)
        let after = try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.zoom.value, s.scrollX, s.scrollY].join(','); })()") as? String
        #expect(after == before, "the view as it was before presenting: \(before) → \(after ?? "")")
        #expect(try await j.js("amber._canvas.api.getAppState().frameRendering.name") as? Bool == true, "frame names back after")
        #expect(try await j.js("amber._canvas.api.getAppState().frameRendering.clip") as? Bool == false, "and shapes whole again")
        // No frames: one step, the whole board.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'frame').map((e) => ({ ...e, frameId: null })) }); return 0; })()")
        j.canvas.send(.present(.start))
        await j.until("presenting the board") { j.canvas.state.present != nil }
        #expect(j.canvas.state.present == .init(index: 0, count: 1, name: "Whole board", frame: nil), "the whole board, uncovered")
        j.canvas.send(.present(.stop))
        await j.until("stopped") { j.canvas.state.present == nil }
        // F and K reach the page's frame and laser tools.
        j.canvas.pick(.frame)
        await j.until("the frame tool") { j.canvas.state.tool == .frame }
        j.canvas.pick(.laser)
        await j.until("the laser") { j.canvas.state.tool == .laser }
    }

    /// Present walks the frames in the order you set (round 7: it was only the order they were
    /// made): the order is kept in the scene, as each frame's `customData.presentOrder`, so it
    /// saves with the board; Present from Here starts at the selected frame, or the frame what's
    /// selected is in; reordering while presenting keeps the frame on screen.
    @Test func presentFollowsTheOrderYouSetAndStartsFromHere() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 40, "y": 40, "width": 120, "height": 80],
            ["type": "rectangle", "id": "b", "x": 640, "y": 40, "width": 120, "height": 80],
            ["type": "rectangle", "id": "c", "x": 1240, "y": 40, "width": 120, "height": 80],
            ["type": "frame", "id": "f1", "children": ["a"], "name": "Intro"],
            ["type": "frame", "id": "f2", "children": ["b"], "name": "Plan"],
            ["type": "frame", "id": "f3", "children": ["c"], "name": "Ask"],
        ]))
        defer { j.close() }
        try await j.ready()
        await j.until("the frames, as made") { j.canvas.state.frames.map(\.id) == ["f1", "f2", "f3"] }
        #expect(j.canvas.state.frames.map(\.name) == ["Intro", "Plan", "Ask"])
        // Ask first: Move Up twice, as the Order list does it.
        var ids = j.canvas.state.frames.map(\.id)
        ids = try #require(CanvasPresentOrder.moved(ids, at: 2, by: -1))
        ids = try #require(CanvasPresentOrder.moved(ids, at: 1, by: -1))
        #expect(CanvasPresentOrder.moved(ids, at: 0, by: -1) == nil, "nothing above the first")
        #expect(ids == ["f3", "f1", "f2"])
        #expect(CanvasPresentOrder.moved(["f1", "f2", "f3"], from: IndexSet(integer: 2), to: 0) == ["f3", "f1", "f2"], "dragged to the top")
        j.canvas.send(.presentOrder(ids))
        await j.until("the new order reported") { j.canvas.state.frames.map(\.id) == ["f3", "f1", "f2"] }
        // Kept in the scene the board saves, for the next time and for an AI reading it.
        let kept = try await j.js("JSON.stringify(amber._canvas.scene().elements.filter((e) => e.type === 'frame').map((e) => [e.id, e.customData && e.customData.presentOrder]))") as? String
        #expect(kept == #"[["f1",1],["f2",2],["f3",0]]"#, "\(kept ?? "")")
        // Present walks it.
        j.canvas.send(.present(.start))
        await j.until("presenting") { j.canvas.state.present != nil }
        #expect(j.canvas.state.present?.name == "Ask" && j.canvas.state.present?.index == 0)
        j.canvas.send(.present(.next))
        await j.until("the second") { j.canvas.state.present?.index == 1 }
        #expect(j.canvas.state.present?.name == "Intro")
        // Reordered while presenting: Intro stays on screen, at its new place.
        j.canvas.send(.presentOrder(["f1", "f2", "f3"]))
        await j.until("reordered") { j.canvas.state.frames.map(\.id) == ["f1", "f2", "f3"] }
        await j.until("still Intro, now first") { j.canvas.state.present?.index == 0 }
        #expect(j.canvas.state.present?.name == "Intro")
        // A frame picked in the Order list.
        j.canvas.send(.presentFrom("f3"))
        await j.until("Ask") { j.canvas.state.present?.name == "Ask" }
        #expect(j.canvas.state.present?.index == 2)
        j.canvas.send(.present(.stop))
        await j.until("stopped") { j.canvas.state.present == nil }
        // Present from Here: something in Plan selected.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { b: true } } }); return 1; })()")
        await j.until("in a frame") { j.canvas.state.inFrame }
        #if os(macOS)
        let web = try #require(j.web as? NotePageWebView)
        #expect(web.canvasMenu().items.contains { $0.title == CanvasPresentOrder.fromHere }, "in the right-click menu")
        #endif
        j.canvas.send(.presentFrom(nil))
        await j.until("presenting Plan") { j.canvas.state.present?.name == "Plan" }
        #expect(j.canvas.state.present?.index == 1)
        j.canvas.send(.present(.stop))
        await j.until("stopped") { j.canvas.state.present == nil }
        // Nothing in a frame: no Present from Here.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        await j.until("nothing selected") { !j.canvas.state.inFrame }
        #if os(macOS)
        #expect(!web.canvasMenu().items.contains { $0.title == CanvasPresentOrder.fromHere })
        #endif
    }

    /// The Present bar's Order list shows the frames in their order, numbered.
    @Test func thePresentOrderListShowsTheFramesInOrder() async throws {
        let canvas = CanvasController()
        canvas.receive(["frames": [["id": "f3", "name": "Ask"], ["id": "f1", "name": "Intro"]], "present": ["index": 0, "count": 2, "name": "Ask"]])
        #expect(canvas.state.frames == [.init(id: "f3", name: "Ask"), .init(id: "f1", name: "Intro")])
        let ax = OffscreenAX(CanvasPresentOrder(canvas: canvas), size: CGSize(width: 240, height: 140))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("canvas.present.order.frame"))
        #expect(row.text.contains("1. Ask"), "\(row.text)")
        row.press()
        await ax.settle(100)
        #expect(canvas.sent.last == .presentFrom("f3"), "a frame clicked: presented")
        let bar = OffscreenAX(CanvasPresentBar(canvas: canvas, step: canvas.state.present!), size: CGSize(width: 520, height: 60))
        defer { bar.close() }
        await bar.settle()
        #expect(bar.find("canvas.present.order") != nil, "the Order button in the Present bar")
    }

    /// Presenting hides the window's toolbar, and Done brings it back (round 7, 25-present-1).
    @Test func presentingHidesTheWindowToolbar() async throws {
        let w = NSWindow(contentRect: CGRect(x: 0, y: 0, width: 400, height: 300), styleMask: [.titled], backing: .buffered, defer: true)
        w.isReleasedWhenClosed = false
        defer { w.close() }
        w.toolbar = NSToolbar(identifier: "test.present")
        let probe = WindowToolbarHider.Probe()
        w.contentView = probe
        // It lies over the whole board: it never takes a click (round 9: every click on the board went to it).
        probe.frame = CGRect(x: 0, y: 0, width: 400, height: 300)
        #expect(probe.hitTest(NSPoint(x: 200, y: 150)) == nil)
        probe.apply(true)
        #expect(w.toolbar?.isVisible == false)
        probe.apply(false)
        #expect(w.toolbar?.isVisible == true)
        // A toolbar hidden already stays hidden after.
        w.toolbar?.isVisible = false
        probe.apply(true); probe.apply(false)
        #expect(w.toolbar?.isVisible == false)
    }

    /// In a narrow column the board's toolbar steps down: the main tools, the rest in More Tools,
    /// so every tool can still be reached (whiteboard council, round 2, 15), and what's shown is
    /// worked out from what the bar holds (round 12): each step needs less room, a long name or
    /// Ask AI moves the steps, and the name gets what's left.
    @Test func aNarrowWindowKeepsEveryToolReachable() {
        typealias T = CanvasToolbarTools
        #expect(!CanvasSelectionBar.inView(CGRect(x: -400, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)), "no bar for a selection out of view")
        #expect(CanvasSelectionBar.inView(CGRect(x: -100, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)))
        for fit in T.Fit.allCases {
            let reachable = Set(fit.shown + fit.inMore + CanvasTool.shapes + T.inShapesMenu + T.inComments + T.inNoteMore)
            #expect(reachable == Set(CanvasTool.allCases), "\(fit) misses \(Set(CanvasTool.allCases).subtracting(reachable))")
            #expect(Set(fit.shown).isDisjoint(with: fit.inMore), "\(fit): a tool is in the bar or in the menu, not both")
        }
        let room = T.Room(title: T.titleWidth("Publishing flow"), place: 50, asks: true)
        let widths = T.Fit.allCases.map { T.needed($0, room) }
        #expect(widths == widths.sorted(by: >), "each step needs less: \(widths)")
        // The board column at 1400 pt with the sidebar (809 pt) has room for everything.
        #expect(T.layout(room, width: 809).fit == .full)
        // Ask AI and a shared board's people take room; a long name takes room before tools go.
        #expect(T.layout(room, width: 700).fit > T.layout(T.Room(title: room.title, place: 50), width: 700).fit || T.layout(room, width: 700).fit == T.layout(T.Room(title: room.title, place: 50), width: 700).fit)
        var people = room
        people.people = PresenceStack.barWidth(viewOnly: false)
        #expect(T.layout(people, width: 809).fit > .full, "the faces of a shared board push the folder out")
        let long = T.Room(title: T.titleWidth(String(repeating: "Quarterly planning ", count: 4)), place: 50, asks: true)
        let (fit, title) = T.layout(long, width: 809)
        #expect(title <= T.titleMax && title >= T.titleFloor(fit), "\(fit) \(title)")
        // The smallest window (710 pt) beside the list: the narrowest, its name at its least
        // (theBoardsToolbarNeverClips measures that it fits).
        let least = T.layout(room, width: 710 - T.listBarEnd + 4)
        #expect(least.fit == .narrowest && least.title == T.titleMin, "\(least)")
        // Folding: Pencil goes before Arrow and Text, and Ask AI keeps its button until the one
        // Tools menu (round 13, 15-narrow-window: at 1000 pt Pencil stayed and Ask AI folded).
        let order = T.Fit.allCases.map { fit in (fit, T.Fit.allCases.firstIndex { !$0.shown.contains(.freedraw) }!, T.Fit.allCases.firstIndex { !$0.shown.contains(.arrow) }!) }
        #expect(order.allSatisfy { $0.1 < $0.2 }, "Pencil folds before Arrow")
        #expect(T.Fit.narrow.shown == [.selection, .arrow, .text] && T.Fit.narrow.inMore.contains(.freedraw))
        #expect(T.Fit.allCases.filter { $0 != .narrowest }.allSatisfy(\.showsAsk) && !T.Fit.narrowest.showsAsk)
        let at1000 = T.layout(room, width: 1000 - T.listBarEnd + 4)
        #expect(at1000.fit <= .narrow && at1000.fit.showsAsk, "\(at1000)")
    }

    /// A sticky note: yellow, square, typed into at once; the next one goes beside it, never on
    /// top, and S makes one too (whiteboard council, round 2: retro and kanban boards with no sticky tool).
    @Test func aStickyNoteIsTypedIntoAndTheNextGoesBesideIt() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.sticky)
        await j.until("typing in the sticky note") { j.canvas.state.editing }
        let first = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => [Math.round(e.x), Math.round(e.y), e.width, e.backgroundColor]))") as? String)
        #expect(first.contains("180,\"#ffec99\""), "\(first)")
        // Done typing; another goes beside it, not on top of it.
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        j.canvas.send(.sticky)
        await j.until("typing in the second") { j.canvas.state.editing }
        let xs = try #require(try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => Math.round(e.x)).join(',')") as? String)
        let both = xs.split(separator: ",").compactMap { Int($0) }
        #expect(both.count == 2 && both[1] - both[0] == 180 + 24, "side by side: \(xs)")
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true })); 0")
        await j.until("S makes one") { j.canvas.state.editing }
        let n = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).length") as? Int
        #expect(n == 3)
        // On a retro, a sticky goes on the lanes, in view; they don't push it away.
        _ = try await j.js("document.activeElement && document.activeElement.blur(); amber._canvas.api.updateScene({ elements: [] }); 0")
        await j.until("cleared") { j.canvas.state.empty }
        j.canvas.send(.insert(.retro))
        await j.until("the retro is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        j.canvas.send(.sticky)
        await j.until("typing in it") { j.canvas.state.editing }
        let place = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
          const e = api.getSceneElements().find((e) => e.customData && e.customData.pintoSticky);
          return [(e.x + s.scrollX) * z, (e.y + s.scrollY) * z, (e.x + e.width + s.scrollX) * z, (e.y + e.height + s.scrollY) * z].map(Math.round).join(','); })()
        """) as? String)
        let v = place.split(separator: ",").compactMap { Double($0) }
        #expect(v.count == 4 && v[0] >= 0 && v[2] <= 900 && v[1] >= 0 && v[3] <= 600, "in view on the retro: \(place)")
        let clear = try await j.js("""
        (() => { const all = amber._canvas.api.getSceneElements(); const st = all.find((e) => e.customData && e.customData.pintoSticky);
          const cards = all.filter((e) => (e.type === 'rectangle' || (e.type === 'text' && !e.containerId)) && !(e.customData && e.customData.pintoSticky) && e.width * e.height < 180 * 180 * 2);
          const over = cards.some((c) => st.x < c.x + c.width && st.x + st.width > c.x && st.y < c.y + c.height && st.y + st.height > c.y);
          const words = all.find((e) => e.containerId === st.id);
          return JSON.stringify({ over, ink: words && words.strokeColor }); })()
        """) as? String
        #expect(clear == "{\"over\":false,\"ink\":\"#2a1d10\"}", "not on a card, its words in ink: \(clear ?? "")")
        // Pick a lane's card and press S twice: each goes under the last in that lane, and the
        // view follows when it runs past the edge (never onto another lane or a lane's name).
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("(() => { const api = amber._canvas.api; const st = new Set(api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => e.id)); api.updateScene({ elements: api.getSceneElements().filter((e) => !st.has(e.id) && !st.has(e.containerId)) }); return 0; })()")
        _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === 'Demo every Friday'); api.updateScene({ appState: { selectedElementIds: { [t.containerId]: true } } }); return 0; })()")
        try await Task.sleep(for: .milliseconds(100))
        for n in 0..<2 {
            if n > 0 {
                // Done typing, the note stays selected (as Escape leaves it).
                _ = try await j.js("(() => { const api = amber._canvas.api, st = api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky); api.updateScene({ appState: { selectedElementIds: { [st[st.length - 1].id]: true } } }); return 0; })()")
                try await Task.sleep(for: .milliseconds(100))
            }
            j.canvas.send(.sticky)
            await j.until("typing in the next") { j.canvas.state.editing }
            _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
            await j.until("done typing") { !j.canvas.state.editing }
        }
        let lane = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
          const st = api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky);
          const b = st[1]; const inView = (b.x + s.scrollX) * z >= 0 && (b.x + b.width + s.scrollX) * z <= s.width && (b.y + s.scrollY) * z >= 0 && (b.y + b.height + s.scrollY) * z <= s.height;
          return JSON.stringify({ sameX: Math.round(st[0].x) === Math.round(b.x), below: b.y > st[0].y, inView }) + (Math.round(st[0].x) === Math.round(b.x) ? '' : JSON.stringify({ st: st.map((e) => [e.x, e.y, e.width, e.height]), card: (() => { const t = api.getSceneElements().find((e) => e.text === 'Demo every Friday'); const c = api.getSceneElements().find((e) => e.id === t.containerId); return [c.x, c.y, c.width, c.height]; })(), lanes: api.getSceneElements().filter((e) => e.width * e.height >= 64800).map((e) => [e.type, e.x, e.y, e.width, e.height]), view: [s.scrollX, s.scrollY, s.width, s.height, z] })); })()
        """) as? String)
        #expect(lane == "{\"sameX\":true,\"below\":true,\"inView\":true}", "under it in the same lane, the view following it: \(lane)")
        // With room below, picking a card puts the sticky under it, and the lane grows to hold
        // the next one (as a retro board fills up).
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("amber._canvas.api.updateScene({ elements: amber._canvas.api.getSceneElements().filter((e) => !(e.customData && e.customData.pintoSticky) && !(e.containerId && amber._canvas.api.getSceneElements().find((c) => c.id === e.containerId && c.customData && c.customData.pintoSticky))) }); amber._canvas.api.updateScene({ appState: { zoom: { value: 0.4 }, scrollX: 200, scrollY: 200 } }); 0")
        try await Task.sleep(for: .milliseconds(200))
        for _ in 0..<2 {
            _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const st = all.filter((e) => e.customData && e.customData.pintoSticky); const t = all.find((e) => e.type === 'text' && e.text === 'Shipped on time'); const c = st.length ? st[st.length - 1] : all.find((e) => e.id === t.containerId); api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); return 0; })()")
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.send(.sticky)
            await j.until("typing in it") { j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(100))
            _ = try await j.js("(() => { const t = document.querySelector('textarea'); t.value = 'Typed here'; t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); return 0; })()")
            await j.until("done typing") { !j.canvas.state.editing }
        }
        // What's typed goes in the new sticky, never in the card it was put under.
        let typed = try await j.js("(() => { const all = amber._canvas.api.getSceneElements(); return JSON.stringify(all.filter((e) => e.type === 'text' && e.containerId).map((e) => { const c = all.find((x) => x.id === e.containerId); return [!!(c.customData && c.customData.pintoSticky), e.text]; })); })()") as? String ?? ""
        #expect(typed.contains("[false,\"Shipped on time\"]") && typed.components(separatedBy: "[true,\"Typed here\"]").count == 3, "typed into the stickies only: \(typed)")
        let grew = try #require(try await j.js("""
        (() => { const all = amber._canvas.api.getSceneElements(); const st = all.filter((e) => e.customData && e.customData.pintoSticky);
          const t = all.find((e) => e.type === 'text' && e.text === 'Shipped on time'); const card = all.find((e) => e.id === t.containerId);
          const lane = all.find((e) => e.type === 'rectangle' && e.width * e.height >= 180 * 180 * 2 && card.x >= e.x && card.x + card.width <= e.x + e.width && card.y >= e.y && card.y + card.height <= e.y + e.height);
          const inside = (b) => b.x >= lane.x && b.x + b.width <= lane.x + lane.width && b.y >= lane.y && b.y + b.height <= lane.y + lane.height;
          const words = (b) => all.find((e) => e.containerId === b.id);
          const fill = card.backgroundColor && card.backgroundColor !== 'transparent' ? card.backgroundColor : '#ffec99';
          if (!st.every((b) => b.backgroundColor === fill)) return 'not the card colour: ' + JSON.stringify([fill, st.map((b) => b.backgroundColor)]);
          if (!st.every((b) => b.width === card.width && b.strokeColor === card.strokeColor && words(b) && words(b).textAlign === 'center')) return 'not like the card: ' + JSON.stringify(st.map((b) => [b.width, b.strokeColor, words(b) && words(b).textAlign]));
          return JSON.stringify({ n: st.length, under: st.every((b) => b.y > card.y + card.height), inLane: st.every(inside) }) + (st.every(inside) ? '' : JSON.stringify({ lane: [lane.x, lane.y, lane.width, lane.height], st: st.map((b) => [b.x, b.y]), z: amber._canvas.api.getAppState().zoom.value })); })()
        """) as? String)
        #expect(grew.hasPrefix("{\"n\":2,\"under\":true,\"inLane\":true}") && !grew.contains("lane\":"), "under the card, inside a lane that grew: \(grew)")
    }

    /// Two or more shapes line up and space out from the bar; an arrow turns straight, curved or
    /// elbowed; different fills show as mixed; a picture has no stroke to set (whiteboard council,
    /// round 2: 09, 10, 11).
    @Test func shapesAlignArrowsBendAndMixedFillsShowAsMixed() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 100, "y": 100, "width": 100, "height": 60, "backgroundColor": "#ffc9c9", "fillStyle": "solid"],
            ["type": "rectangle", "id": "b", "x": 160, "y": 220, "width": 100, "height": 60, "backgroundColor": "#b2f2bb", "fillStyle": "solid"],
            ["type": "rectangle", "id": "c", "x": 400, "y": 340, "width": 100, "height": 60, "backgroundColor": "#b2f2bb", "fillStyle": "solid"],
            ["type": "arrow", "id": "line", "x": 300, "y": 100, "width": 120, "height": 80, "points": [[0, 0], [60, 20], [120, 80]]],
        ]))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { a: true, b: true, c: true } } }); 0")
        await j.until("three selected") { j.canvas.state.selection.count == 3 }
        #expect(j.canvas.state.showsAlign && j.canvas.state.mixedFill, "align offered, the fill shown as mixed")
        j.canvas.run(.alignLeft)
        try await Task.sleep(for: .milliseconds(300))
        let xs = try await j.js("['a','b','c'].map((id) => Math.round(amber._canvas.api.getSceneElements().find((e) => e.id === id).x)).join(',')") as? String
        #expect(xs == "100,100,100", "lined up on the left: \(xs ?? "")")
        j.canvas.run(.distributeVertically)
        try await Task.sleep(for: .milliseconds(300))
        let ys = try await j.js("['a','b','c'].map((id) => Math.round(amber._canvas.api.getSceneElements().find((e) => e.id === id).y)).join(',')") as? String
        #expect(ys == "100,220,340", "spaced evenly: \(ys ?? "")")

        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { line: true } } }); 0")
        await j.until("the arrow selected") { j.canvas.state.selection == ["arrow"] }
        #expect(!j.canvas.state.showsAlign && !j.canvas.state.mixedFill)
        j.canvas.set(.arrowType, .text("elbow"))
        await j.until("elbowed") { j.canvas.state.arrowType == "elbow" }
        let elbowed = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.id === 'line').elbowed === true") as? Bool
        #expect(elbowed == true)
        j.canvas.set(.arrowType, .text("sharp"))
        await j.until("straight") { j.canvas.state.arrowType == "sharp" }

        var picture = CanvasState()
        picture.selection = ["image"]
        #expect(!picture.showsStroke && !picture.showsFill, "a picture: no stroke or fill to set")
    }

    /// When the board gets wider (the sidebar folding away, Full Screen) the drawing stays where
    /// it was in the middle of the view; the engine kept its left edge, which left a drawing in the
    /// left half (whiteboard council, round 1, 08-fullscreen).
    @Test func theViewStaysCentredWhenTheBoardGetsWider() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let centre = "(() => { const s = amber._canvas.api.getAppState(); const z = s.zoom.value; return [Math.round(-s.scrollX + s.width / 2 / z), Math.round(-s.scrollY + s.height / 2 / z)].join(','); })()"
        let before = try await j.js(centre) as? String
        j.rig.window.setContentSize(CGSize(width: 1400, height: 800))
        j.web.frame = CGRect(x: 0, y: 0, width: 1400, height: 800)
        var after: String?
        for _ in 0..<60 {
            try await Task.sleep(for: .milliseconds(50))
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1400 { after = try await j.js(centre) as? String; break }
        }
        #expect(before != nil && after == before, "the middle of the view is the same point of the drawing: \(before ?? "?") then \(after ?? "?")")
    }

    // MARK: Note cards

    /// What the app knows of each note, for the cards (CanvasNoteCard.info stands in).
    @MainActor final class Library {
        var notes: [String: CanvasNoteCard] = [:]
        var asked = 0
        var opened: [UUID] = []
        var restored: [UUID] = []

        func join(_ canvas: CanvasController, board: UUID? = nil) {
            canvas.noteID = board
            canvas.cardInfo = { [weak self] refs in
                guard let self else { return [:] }
                asked += 1
                return refs.reduce(into: [:]) { out, r in out[r] = self.notes[r] ?? CanvasNoteCard(id: nil, title: nil, preview: CanvasNoteCard.missingText, deleted: true) }
            }
            canvas.openNote = { [weak self] id in self?.opened.append(id) }
        }
    }

    static let plan = UUID(uuidString: "6F1C2A3B-0000-4000-8000-0000000000A1")!
    static let press = UUID(uuidString: "6F1C2A3B-0000-4000-8000-0000000000B2")!
    static let planCard = CanvasNoteCard(id: plan, title: "Launch plan", preview: "Ship the beta to the waitlist on Friday. Post on the blog and the newsletter the same morning, then answer replies.")
    static let pressCard = CanvasNoteCard(id: press, title: "Press list", preview: "Who hears first, and when.")

    /// Each part of each card on the page: its role, its note, its words, where it is.
    /// A colour's contrast with the board's paper, as drawn in light, or through the dark filter
    /// (invert, then hue-rotate 180°) in dark.
    static func contrast(_ hex: String, dark: Bool) -> Double {
        func rgb(_ h: String) -> [Double] { let n = Int(h.dropFirst(), radix: 16) ?? 0; return [Double((n >> 16) & 255), Double((n >> 8) & 255), Double(n & 255)] }
        let rot = [[-0.574, 1.43, 0.144], [0.426, 0.43, 0.144], [0.426, 1.43, -0.856]]
        func shown(_ c: [Double]) -> [Double] { dark ? rot.map { r in min(255, max(0, (0..<3).reduce(0) { $0 + r[$1] * (255 - c[$1]) })) } : c }
        func lum(_ c: [Double]) -> Double { let f = { (v: Double) -> Double in let s = v / 255; return s <= 0.03928 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4) }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
        let a = lum(shown(rgb(hex))), b = lum(shown([255, 255, 255]))
        return (max(a, b) + 0.05) / (min(a, b) + 0.05)
    }

    static func cardParts(_ j: Joined) async throws -> [[String: Any]] {
        let json = try await j.js("""
        (() => JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote).map((e) => ({
          id: e.id, type: e.type, role: e.customData.pintoCard || null, note: e.customData.pintoNote, title: e.customData.title || null,
          text: e.text || null, group: (e.groupIds || [])[0] || null, groups: (e.groupIds || []).length, x: e.x, y: e.y, width: e.width, height: e.height,
          strokeStyle: e.strokeStyle, strokeColor: e.strokeColor, link: e.link, fontFamily: e.fontFamily || null,
        }))))()
        """) as? String ?? "[]"
        return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] ?? []
    }

    static func part(_ parts: [[String: Any]], _ role: String, of note: String? = nil) -> [String: Any]? {
        parts.first { $0["role"] as? String == role && (note == nil || ($0["note"] as? String) == note) }
    }

    /// The page's point (client coordinates) over a card's title, or over the middle of an element.
    static func clientPoint(_ j: Joined, of filter: String, dy: Double? = nil) async throws -> CGPoint {
        let r = try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, e = api.getSceneElements().find((e) => \(filter));
          if (!e) return null; const y = \(dy.map { "e.y + \($0)" } ?? "e.y + e.height / 2");
          return [(e.x + e.width / 2 + s.scrollX) * z + s.offsetLeft, (y + s.scrollY) * z + s.offsetTop]; })()
        """) as? [Double]
        let p = try #require(r, "found \(filter)")
        return CGPoint(x: p[0], y: p[1])
    }

    /// A note from the app goes on as a card: one group of ordinary elements whose customData names
    /// the note, its title and first lines in the card's own font, selected, one step Undo takes
    /// back. The bar over it has Open Note and nothing to style.
    @Test func aNoteFromTheAppGoesOnAsACardThatSaysWhatItsNoteSays() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on the board, selected") { j.canvas.state.card?.note == Self.plan.uuidString }
        let parts = try await Self.cardParts(j)
        let frame = try #require(Self.part(parts, "card"))
        #expect(frame["type"] as? String == "rectangle" && frame["note"] as? String == Self.plan.uuidString && frame["title"] as? String == "Launch plan")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        let preview = try #require(Self.part(parts, "preview")?["text"] as? String)
        #expect(preview.hasPrefix("Ship the beta") && preview.split(separator: "\n").count <= 3, "the first lines, at most three: \(preview)")
        #expect(parts.filter { $0["role"] as? String == "glyph" }.count == 2, "a note glyph")
        #expect(Set(parts.compactMap { $0["group"] as? String }).count == 1 && parts.allSatisfy { $0["group"] is String }, "one group")
        #expect(parts.allSatisfy { $0["link"] is NSNull || $0["link"] == nil }, "no web link on any part")
        #expect(Self.part(parts, "title")?["fontFamily"] as? Int == 6, "the card's words in the normal font")
        // Readable in light and in dark (drawn through the dark filter): the excerpt at 4.5:1 or
        // more, the edge at 2:1 or more (whiteboard council, round 7: both faded out in dark mode).
        let ink = try #require(Self.part(parts, "preview")?["strokeColor"] as? String), edge = try #require(frame["strokeColor"] as? String)
        for dark in [false, true] {
            #expect(Self.contrast(ink, dark: dark) >= 4.5, "the excerpt \(ink) in \(dark ? "dark" : "light"): \(Self.contrast(ink, dark: dark))")
            #expect(Self.contrast(edge, dark: dark) >= 2, "the edge \(edge) in \(dark ? "dark" : "light"): \(Self.contrast(edge, dark: dark))")
        }
        // Laid out inside the card.
        let fx = frame["x"] as? Double ?? 0, fw = frame["width"] as? Double ?? 0, fy = frame["y"] as? Double ?? 0, fh = frame["height"] as? Double ?? 0
        for p in parts where p["role"] as? String != "card" {
            let x = p["x"] as? Double ?? 0, y = p["y"] as? Double ?? 0, w = p["width"] as? Double ?? 0, h = p["height"] as? Double ?? 0
            #expect(x >= fx && y >= fy && x + w <= fx + fw + 0.5 && y + h <= fy + fh + 0.5, "\(p["role"] ?? "?") is inside the card")
        }
        let s = j.canvas.state
        #expect(s.onlyCards && s.selectedCards == 1 && s.showsSelectionBar)
        #expect(!s.showsStroke && !s.showsFill && !s.showsText && !s.showsAlign, "nothing to style on a card")
        #expect(s.cardNotes == [Self.plan.uuidString])
        #expect(j.canvas.canUndo)
        j.canvas.run(.undo)
        await j.until("Undo takes it back") { j.canvas.state.cardNotes.isEmpty }
        // A deleted note, or the board itself, doesn't go on.
        library.notes[Self.press.uuidString] = CanvasNoteCard(id: Self.press, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.addCards([Self.press, j.canvas.noteID!])
        try await Task.sleep(for: .milliseconds(300))
        #expect(j.canvas.state.cardNotes.isEmpty)
    }

    /// "On boards" at the foot of a note opens the board with that note's card selected (the whole
    /// card, as a click selects it) and in view at a size you can read, though the board opened
    /// somewhere else; asked before the page was ready, it's done once it is. Another card next.
    @Test func aBoardOpenedFromOnBoardsSelectsTheCardInView() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box + [
            ["type": "rectangle", "id": "far", "x": 3200, "y": 2400, "customData": ["pintoNote": Self.plan.uuidString]],
            ["type": "rectangle", "id": "near", "x": 420, "y": 0, "customData": ["pintoNote": Self.press.uuidString]],
        ]))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard, Self.press.uuidString: Self.pressCard]
        library.join(j.canvas, board: UUID())
        j.canvas.focusCard(Self.plan)
        try await j.ready()
        await j.until("the far card is selected") { j.canvas.state.card?.note == Self.plan.uuidString }
        let shown = """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, sel = s.selectedElementIds || {};
          const parts = api.getSceneElements().filter((e) => e.customData && (e.customData.pintoNote || '').toUpperCase() === '%@');
          const frame = parts.find((e) => e.customData.pintoCard === 'card');
          const x = (frame.x + s.scrollX) * z, y = (frame.y + s.scrollY) * z;
          return JSON.stringify({ all: parts.every((e) => sel[e.id]), missing: parts.filter((e) => !sel[e.id]).map((e) => e.customData.pintoCard + ':' + e.isDeleted), only: Object.keys(sel).filter((k) => sel[k]).length === parts.length,
            inView: x >= 0 && y >= 0 && x + frame.width * z <= s.width && y + frame.height * z <= s.height, zoom: z }); })()
        """
        func look(_ id: UUID) async throws -> [String: Any] {
            let json = try await j.js(shown.replacingOccurrences(of: "%@", with: id.uuidString)) as? String ?? "{}"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] ?? [:]
        }
        let far = try await look(Self.plan)
        #expect(far["all"] as? Bool == true && far["only"] as? Bool == true, "the whole card, and only it, selected: \(far)")
        #expect(far["inView"] as? Bool == true, "the card in view: \(far)")
        #expect((far["zoom"] as? Double ?? 0) >= 0.99, "at a size you can read: \(far)")
        #expect(j.canvas.state.onlyCards && j.canvas.state.selectedCards == 1)
        #expect(!j.canvas.canUndo, "not a step to undo")
        // The page is ready now: the next one is selected at once.
        j.canvas.focusCard(Self.press)
        await j.until("the near card is selected") { j.canvas.state.card?.note == Self.press.uuidString }
        let near = try await look(Self.press)
        #expect(near["all"] as? Bool == true && near["inView"] as? Bool == true, "\(near)")
    }

    /// Double-click a card (or ⌘-click it, or Open Note on its bar or its right-click menu) and its
    /// note opens; the engine doesn't start typing in the card's words. A card whose note is gone
    /// says so and opens nothing; a double-click elsewhere opens nothing.
    @Test func aCardOpensItsNote() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on") { j.canvas.state.card != nil }
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } }); return 1; })()")
        await j.until("nothing selected") { !j.canvas.state.hasSelection }

        // Double-click on its title, where the engine would start editing the words.
        let title = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'title'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(title.x), \(title.y)), at = { bubbles: true, cancelable: true, view: window, clientX: \(title.x), clientY: \(title.y), pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }; for (let i = 0; i < 2; i++) { el.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 })); window.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 })); } el.dispatchEvent(new MouseEvent('dblclick', { ...at, detail: 2 })); return el.tagName; })()")
        await j.until("the note opened") { library.opened == [Self.plan] }
        try await Task.sleep(for: .milliseconds(200))
        #expect(!j.canvas.state.editing, "no typing started in the card")
        #expect(try await j.js("amber._canvas.api.getAppState().editingGroupId") is NSNull, "nor inside its group")

        // ⌘-click.
        let middle = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(middle.x), \(middle.y)), at = { bubbles: true, cancelable: true, view: window, clientX: \(middle.x), clientY: \(middle.y), pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, metaKey: true }; el.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 })); window.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 })); return 1; })()")
        await j.until("⌘-click opened it") { library.opened.count == 2 }

        // A double-click on the box opens nothing.
        let box = try await Self.clientPoint(j, of: "e.id === 'box'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(box.x), \(box.y)); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: \(box.x), clientY: \(box.y), detail: 2 })); return 1; })()")
        try await Task.sleep(for: .milliseconds(300))
        #expect(library.opened.count == 2)

        // Selected: Open Note on the bar, and first in the right-click menu.
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
        await j.until("the card selected") { j.canvas.state.card != nil }
        let card = try #require(j.canvas.state.card)
        #expect(card.title == "Launch plan")
        j.canvas.openCard(card.note)
        #expect(library.opened.count == 3)
        let web = try #require(j.web as? NotePageWebView)
        let menu = web.canvasMenu()
        #expect(menu.items.first?.title == CanvasSelectionBar.openNote)
        menu.performActionForItem(at: 0)
        #expect(library.opened.count == 4)

        // Its note deleted: it says so and opens nothing.
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.openCard(Self.plan.uuidString)
        #expect(library.opened.count == 4)
        #expect(j.canvas.notice == "This note was deleted")
    }

    /// A card follows its note: the board opening with a card whose note has since been renamed
    /// shows the new title; a note edited while the board is open changes its card at once (a save
    /// of any other note asks nothing); a deleted note's card says "Note deleted", quietly; what's
    /// saved says the same.
    @Test func aCardFollowsItsNoteWhenRenamedEditedOrDeleted() async throws {
        // As saved on the last visit: the title it had then.
        let old: [[String: Any]] = [["type": "rectangle", "id": "plan", "x": 0, "y": 0, "customData": ["pintoNote": Self.plan.uuidString, "title": "Launch plan draft"]]]
        let j = try await Joined(scene: CanvasTests.scene(old))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "title")?["text"] as? String == "Launch plan" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        var parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        #expect(Self.part(parts, "card")?["title"] as? String == "Launch plan")
        #expect((Self.part(parts, "preview")?["text"] as? String)?.hasPrefix("Ship the beta") == true)
        let tall = Self.part(parts, "card")?["height"] as? Double ?? 0

        // Renamed and emptied while the board is open.
        let asked = library.asked
        j.canvas.notesChanged([UUID()])
        #expect(library.asked == asked, "another note's save asks nothing")
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: "Launch plan v2", preview: "")
        j.canvas.notesChanged([Self.plan])
        #expect(library.asked == asked + 1)
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "title")?["text"] as? String == "Launch plan v2" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan v2")
        #expect(Self.part(parts, "preview") == nil, "nothing under the title")
        #expect((Self.part(parts, "card")?["height"] as? Double ?? 0) < tall, "the card is shorter")

        // Deleted.
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.notesChanged([Self.plan])
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "preview")?["text"] as? String == "Note deleted" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "preview")?["text"] as? String == "Note deleted")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan v2", "the title it had")
        #expect(Self.part(parts, "card")?["strokeStyle"] as? String == "dashed" && Self.part(parts, "title")?["strokeColor"] as? String == "#868e96", "quiet")

        // What's saved says the same.
        _ = try await j.js("(() => { amber._flush(); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        let saved = j.rig.elements.first { $0["id"] as? String == "plan" }
        #expect((saved?["customData"] as? [String: Any])?["title"] as? String == "Launch plan v2")
        #expect(j.rig.elements.contains { ($0["customData"] as? [String: Any])?["pintoCard"] as? String == "preview" && $0["text"] as? String == "Note deleted" })
    }

    #if os(macOS)
    /// The page as drawn, as RGBA bytes at its own scale.
    static func pixels(_ web: WKWebView) async throws -> (bytes: [UInt8], width: Int, height: Int, scale: CGFloat, png: Data?) {
        let config = WKSnapshotConfiguration()
        config.afterScreenUpdates = true
        let image = try await web.takeSnapshot(configuration: config)
        let cg = try #require(image.cgImage(forProposedRect: nil, context: nil, hints: nil))
        let w = cg.width, h = cg.height
        var bytes = [UInt8](repeating: 0, count: w * h * 4)
        let ctx = try #require(CGContext(data: &bytes, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                         space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        let png = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])
        return (bytes, w, h, CGFloat(w) / web.bounds.width, png)
    }

    /// No empty selection box is left drawn once cards are put on and then let go (whiteboard
    /// council, round 6, 24-note-card-board: a small dark corner bracket by a card, gone once the
    /// card was selected). Cards go on selected as a group; a selection cleared by element only
    /// left the group selected, and the engine drew its empty box at the drawing's origin. The
    /// group is let go, and nothing is drawn there, in light and dark.
    @Test(arguments: [false, true]) func aCardShowsNothingOffItsCorner(dark: Bool) async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box), dark: dark)
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard, Self.press.uuidString: Self.pressCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan, Self.press])
        await j.until("the cards are on") { j.canvas.state.selectedCards == 2 }
        #expect(try await j.js("Object.keys(amber._canvas.api.getAppState().selectedGroupIds).length") as? Int == 2, "selected as groups")
        // Let go by element only, as the app's own commands and the pictures do.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        await j.until("nothing selected") { !j.canvas.state.hasSelection }
        var groups = -1
        for _ in 0..<60 {
            groups = try await j.js("Object.keys(amber._canvas.api.getAppState().selectedGroupIds).filter((g) => amber._canvas.api.getAppState().selectedGroupIds[g]).length") as? Int ?? -1
            if groups == 0 { break }
            try await Task.sleep(for: .milliseconds(30))
        }
        #expect(groups == 0, "no group stays selected with nothing in it")
        try await Task.sleep(for: .milliseconds(400))
        // The drawing's origin, where the empty box was drawn; nothing else is drawn near it.
        let origin = try #require(try await j.js("(() => { const s = amber._canvas.api.getAppState(), z = s.zoom.value; return [s.scrollX * z, s.scrollY * z]; })()") as? [Double])
        let shot = try await Self.pixels(j.web)
        if let dir = ProcessInfo.processInfo.environment["CARD_CORNER_SHOT"], let png = shot.png {
            try png.write(to: URL(fileURLWithPath: dir).appending(path: "card-corner-\(dark ? "dark" : "light").png"))
        }
        func at(_ x: Int, _ y: Int) -> [Int] { let i = (y * shot.width + x) * 4; return (0..<3).map { Int(shot.bytes[i + $0]) } }
        let paper = at(shot.width - 3, shot.height - 3)
        var marks = 0
        let x0 = Int((origin[0] - 24) * shot.scale), y0 = Int((origin[1] - 24) * shot.scale), x1 = Int((origin[0] + 24) * shot.scale), y1 = Int((origin[1] + 24) * shot.scale)
        for y in max(0, y0)..<min(shot.height, y1) {
            for x in max(0, x0)..<min(shot.width, x1) where zip(at(x, y), paper).contains(where: { abs($0 - $1) > 40 }) { marks += 1 }
        }
        #expect(marks == 0, "\(marks) pixels drawn at the drawing's origin, where nothing is")
    }
    #endif

    /// A card whose note is in Recently Deleted offers Restore Note (first on its bar and in its
    /// right-click menu, in place of Open Note): the note comes back, and the card says what it says
    /// again. A note deleted for good, or a title no note has, offers nothing.
    @Test func aDeletedNotesCardRestoresItsNote() async throws {
        let scene: [[String: Any]] = [["type": "rectangle", "id": "press", "x": 0, "y": 0, "customData": ["pintoNote": Self.press.uuidString, "title": "Press list"]],
                                      ["type": "rectangle", "id": "gone", "x": 400, "y": 0, "customData": ["pintoNote": "No such note", "title": "No such note"]]]
        let j = try await Joined(scene: CanvasTests.scene(scene))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.press.uuidString: CanvasNoteCard(id: Self.press, title: nil, preview: CanvasNoteCard.deletedText, deleted: true, restorable: true)]
        library.join(j.canvas, board: UUID())
        j.canvas.restoreNote = { [library] id in
            library.restored.append(id)
            library.notes[id.uuidString] = Self.pressCard
        }
        try await j.ready()
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "preview", of: Self.press.uuidString)?["text"] as? String == "Note deleted" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(j.canvas.restorable == [Self.press.uuidString], "only the note in Recently Deleted")
        // The other card selected: nothing to restore.
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote === 'No such note').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
        await j.until("the missing note's card selected") { j.canvas.state.card?.note == "No such note" }
        #if os(macOS)
        let web = try #require(j.web as? NotePageWebView)
        #expect(web.canvasMenu().items.first?.title == CanvasSelectionBar.openNote)
        #endif
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote === '\(Self.press.uuidString)').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
        await j.until("the deleted note's card selected") { j.canvas.state.card?.note == Self.press.uuidString }
        #if os(macOS)
        let menu = web.canvasMenu()
        #expect(menu.items.first?.title == CanvasSelectionBar.restoreNote)
        menu.performActionForItem(at: 0)
        #else
        j.canvas.restoreCard(Self.press.uuidString)
        #endif
        #expect(library.restored == [Self.press])
        #expect(j.canvas.notice == "Note restored")
        #expect(j.canvas.restorable.isEmpty)
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "title", of: Self.press.uuidString)?["text"] as? String == "Press list",
               try await Self.part(Self.cardParts(j), "preview", of: Self.press.uuidString)?["text"] as? String != "Note deleted" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "preview", of: Self.press.uuidString)?["text"] as? String == "Who hears first, and when.", "the card says what its note says again")
        #expect(Self.part(parts, "card", of: Self.press.uuidString)?["strokeStyle"] as? String == "solid", "no longer quiet")
        // Restored, the card opens its note again.
        j.canvas.openCard(Self.press.uuidString)
        #expect(library.opened == [Self.press])
    }

    /// A confirmation ("Note restored") stays whole long enough to read, about 2 s, and the same
    /// words said again start their own time: an earlier one ending never takes the new one down
    /// (round 12, 24-note-card-restored: caught almost faded, at 1.8 s).
    @Test func aConfirmationStaysLongEnoughToRead() async throws {
        let canvas = CanvasController()
        #expect(CanvasController.noticeTime >= .seconds(2.2), "\(CanvasController.noticeTime)")
        let start = ContinuousClock.now
        canvas.confirm("Note restored")
        try await Task.sleep(for: .seconds(1.2))
        canvas.confirm("Note restored")
        // 2.1 s after the first: the first's time is up, the second's isn't.
        try await Task.sleep(until: start + .seconds(2.1))
        #expect(canvas.notice == "Note restored", "still showing 2.1 s on")
        try await Task.sleep(until: start + .seconds(3.2))
        #expect(canvas.notice == "Note restored", "the second one's own time: 2 s after it was said")
        try await Task.sleep(until: start + .seconds(4.2))
        #expect(canvas.notice == nil, "gone after its time")
    }

    /// What the app says of a card's note: one in Recently Deleted can be restored (and the note's
    /// view takes it out of there); one deleted for good can't.
    @Test func aCardKnowsWhenItsNoteCanBeRestored() throws {
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Press list\n\nWho hears first.\n")
        try ctx.save()
        var card = CanvasNoteCard.of(note)
        #expect(!card.deleted && !card.restorable)
        note.trashedAt = .now
        card = CanvasNoteCard.of(note)
        #expect(card.deleted && card.restorable)
        ctx.restore(note)
        #expect(note.trashedAt == nil)
        card = CanvasNoteCard.of(note)
        #expect(!card.deleted && card.title == "Press list")
        note.trashedAt = .now
        note.deletedAt = .now
        card = CanvasNoteCard.of(note)
        #expect(card.deleted && !card.restorable, "deleted for good: nothing to restore")
    }

    /// A selection at the very top of the view: the view moves down just enough that the rotate
    /// handle above it shows (whiteboard council, round 6: it was cut off under the toolbar). One
    /// lower down doesn't move the view, nor does a selection too tall to fit with the room.
    @Test func aSelectionAtTheTopMovesTheViewSoItsRotateHandleShows() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "top", "x": 0, "y": 0, "width": 200, "height": 80],
            ["type": "rectangle", "id": "low", "x": 300, "y": 300, "width": 200, "height": 80],
            ["type": "rectangle", "id": "tall", "x": 600, "y": 0, "width": 100, "height": 2000],
        ]))
        defer { j.close() }
        try await j.ready()
        func top(_ id: String) async throws -> Double {
            try #require(try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), e = api.getSceneElements().find((e) => e.id === '\(id)'); return (e.y + s.scrollY) * s.zoom.value; })()") as? Double)
        }
        func select(_ id: String, at y: Double) async throws {
            _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
            await j.until("nothing selected") { !j.canvas.state.hasSelection }
            // Its top \(y) points from the top of the view.
            _ = try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), e = api.getSceneElements().find((e) => e.id === '\(id)'); api.updateScene({ appState: { scrollY: \(y) / s.zoom.value - e.y } }); return 1; })()")
            #expect(abs(try await top(id) - y) < 0.5)
            _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(id)': true } } }); return 1; })()")
            await j.until("\(id) selected") { j.canvas.state.selection.count == 1 }
            try await Task.sleep(for: .milliseconds(200))
        }
        try await select("top", at: 4)
        let shown = try await top("top")
        #expect(shown >= 39 && shown <= 41, "moved down just enough for the handle: \(shown)")
        // Selected again where it is now: nothing moves.
        try await select("low", at: 200)
        #expect(abs(try await top("low") - 200) < 0.5, "lower down, the view stays")
        try await select("tall", at: 4)
        #expect(abs(try await top("tall") - 4) < 0.5, "too tall to fit: the view stays")
    }

    /// Tab on a selected shape grows a mind map's next branch, as in FigJam: a box to its right,
    /// in its colour, joined by an arrow drawn as its other branches are (no heads in the mind
    /// map), selected and typed into. Tab again puts the next one under it; Tab while typing in
    /// one grows a branch from that one. Undo takes a branch back with its arrow. The mind map's
    /// how-to line says so.
    @Test func tabOnAShapeGrowsAMindMapBranch() async throws {
        let hint = try #require(WhiteboardTemplate.mindMap.elements.first { ($0["customData"] as? [String: Any])?["pintoHint"] as? Bool == true }?["text"] as? String)
        #expect(hint.contains("press Tab"), "the hint teaches it: \(hint)")
        let j = try await Joined(size: CGSize(width: 900, height: 760))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.mindMap, title: "Plan"))
        await j.until("the mind map is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        // The shape whose words say `words`.
        func node(_ words: String) async throws -> [String: Any] {
            let json = try await j.js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.type === 'text' && e.containerId && e.text === \(String(reflecting: words))); const e = t && api.getSceneElements().find((e) => e.id === t.containerId); return e ? JSON.stringify(e) : null; })()") as? String
            let text = try #require(json)
            return try #require(try JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any])
        }
        func all() async throws -> [[String: Any]] {
            let json = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements())") as? String ?? "[]"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] ?? []
        }
        func num(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        // The shape being typed in, or else the ids selected, in the page (typing starts at once,
        // and the engine lets go of the selection as it does).
        func selected() async throws -> [String] {
            let ids = try await j.js("(() => { const s = amber._canvas.api.getAppState(), t = s.editingTextElement; if (t && t.containerId) return [t.containerId]; return Object.keys(s.selectedElementIds || {}).filter((k) => s.selectedElementIds[k]); })()") as? [String]
            return ids ?? []
        }
        func until(_ what: String, _ ok: ([String]) -> Bool) async throws -> [String] {
            var ids = try await selected()
            for _ in 0..<100 where !ok(ids) { try await Task.sleep(for: .milliseconds(30)); ids = try await selected() }
            #expect(ok(ids), "\(what): \(ids)")
            return ids
        }
        func tab() async throws {
            _ = try await j.js("(() => { (document.activeElement && document.activeElement.tagName === 'TEXTAREA' ? document.activeElement : window).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })); return 1; })()")
        }
        let when = try await node("When")
        let whenID = try #require(when["id"] as? String)
        let before = try await all().count
        let viewBefore = try await Self.mindMapView(j, whenID)
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(whenID)': true } } }); return 1; })()")
        _ = try await until("When selected") { $0 == [whenID] }
        try await tab()
        let childID = try #require(try await until("a branch grew and is typed in") { $0.count == 1 && $0 != [whenID] }.first)
        await j.until("typing in it") { j.canvas.state.editing }
        // In its parent's size and font (round 7, 26-mindmap-tab: the words came out bigger).
        try await Task.sleep(for: .milliseconds(150))
        let typing = try await j.js("(() => { const api = amber._canvas.api, t = api.getAppState().editingTextElement, p = api.getSceneElements().find((e) => e.type === 'text' && e.text === 'When'); return t && p ? [t.fontSize, p.fontSize, t.fontFamily, p.fontFamily].join(',') : 'none'; })()") as? String
        let sizes = (typing ?? "").split(separator: ",")
        #expect(sizes.count == 4 && sizes[0] == sizes[1] && sizes[2] == sizes[3], "size and font as When's: \(typing ?? "")")
        var els = try await all()
        let child = try #require(els.first { $0["id"] as? String == childID })
        #expect(child["type"] as? String == "rectangle")
        #expect(num(child, "x") >= num(when, "x") + num(when, "width") + 40, "to its right")
        #expect(abs((num(child, "y") + num(child, "height") / 2) - (num(when, "y") + num(when, "height") / 2)) < 1, "level with it")
        #expect(child["backgroundColor"] as? String == when["backgroundColor"] as? String, "in its colour")
        #expect(num(child, "width") == num(when, "width") && num(child, "height") == num(when, "height"), "its size")
        let joint = try #require(els.first { $0["type"] as? String == "arrow" && ($0["endBinding"] as? [String: Any])?["elementId"] as? String == childID })
        #expect((joint["startBinding"] as? [String: Any])?["elementId"] as? String == whenID, "joined to the branch it grew from")
        #expect(joint["endArrowhead"] is NSNull && joint["startArrowhead"] is NSNull, "drawn as the mind map's other branches are")
        #expect(((child["boundElements"] as? [[String: Any]]) ?? []).contains { $0["id"] as? String == joint["id"] as? String }, "bound both ends")
        #expect(els.count >= before + 2, "a box and its arrow (and the words being typed)")
        // The parent and the new branch in view at the zoom you had; and the whole map, in the
        // middle, as it fits at that zoom (round 10: each Tab zoomed out and pushed it right).
        let viewAfter = try await Self.mindMapView(j, whenID, childID)
        Self.expectBranchInView(before: viewBefore, after: viewAfter)

        // Tab while typing in it: its own branch, to its right.
        try await tab()
        let grandID = try #require(try await until("a branch from the new one") { $0.count == 1 && $0 != [childID] }.first)
        els = try await all()
        let grand = try #require(els.first { $0["id"] as? String == grandID })
        #expect(num(grand, "x") >= num(child, "x") + num(child, "width") + 40)
        #expect(els.contains { $0["type"] as? String == "arrow" && ($0["startBinding"] as? [String: Any])?["elementId"] as? String == childID && ($0["endBinding"] as? [String: Any])?["elementId"] as? String == grandID })

        // Tab on When again: the next goes under the first, clear of it.
        await j.until("typing in the branch's branch") { j.canvas.state.editing }
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); return 1; })()")
        try await Task.sleep(for: .milliseconds(100))
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(whenID)': true } } }); return 1; })()")
        _ = try await until("When selected again") { $0 == [whenID] }
        await j.until("not typing") { !j.canvas.state.editing }
        try await tab()
        let secondID = try #require(try await until("a second branch") { $0.count == 1 && ![whenID, childID, grandID].contains($0[0]) }.first)
        els = try await all()
        let second = try #require(els.first { $0["id"] as? String == secondID })
        #expect(num(second, "x") == num(child, "x"), "lined up with the first")
        #expect(num(second, "y") >= num(child, "y") + num(child, "height") + 8, "under it, clear of it")
        // Left empty, then Undo: the branch and its arrow go together.
        await j.until("typing in the second") { j.canvas.state.editing }
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("not typing") { !j.canvas.state.editing }
        try await Task.sleep(for: .milliseconds(200))
        var ids: [String] = []
        // (Typing ending is a step of the engine's own, as after a double-click.)
        for _ in 0..<3 {
            j.canvas.run(.undo)
            try await Task.sleep(for: .milliseconds(300))
            ids = try await all().compactMap { $0["id"] as? String }
            if !ids.contains(secondID) { break }
        }
        let gone = !ids.contains(secondID)
        #expect(gone, "Undo takes the branch back")
        let arrows = try await all().filter { ($0["endBinding"] as? [String: Any])?["elementId"] as? String == secondID }
        #expect(arrows.isEmpty, "and its arrow")
        let kept = ids.contains(childID) && ids.contains(grandID)
        #expect(kept, "the others stay")

        // Nothing selected, or two things: Tab does nothing here.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        await j.until("nothing selected") { !j.canvas.state.hasSelection }
        try await Task.sleep(for: .milliseconds(200))
        let n = try await all().count
        try await tab()
        try await Task.sleep(for: .milliseconds(200))

        let after = try await all().count
        #expect(after == n, "nothing selected: Tab adds nothing")
    }


    /// Where the view is round a mind map, in the view's points: the zoom, the board's size, the
    /// map's boxes together, and the parent with its new branch (`ids`).
    struct MindMapView { var zoom: Double; var width: Double; var height: Double; var map: CGRect; var pair: CGRect }

    static func mindMapView(_ j: Joined, _ ids: String...) async throws -> MindMapView {
        let list = ids.map { "'\($0)'" }.joined(separator: ",")
        let r = try await json(j, """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, els = api.getSceneElements();
          const box = (l) => { const x1 = Math.min(...l.map((e) => e.x)), y1 = Math.min(...l.map((e) => e.y)), x2 = Math.max(...l.map((e) => e.x + e.width)), y2 = Math.max(...l.map((e) => e.y + e.height));
            return [(x1 + s.scrollX) * z, (y1 + s.scrollY) * z, (x2 - x1) * z, (y2 - y1) * z]; };
          const want = new Set([\(list)]);
          return { zoom: z, width: s.width, height: s.height, map: box(els.filter((e) => e.type !== 'arrow' && e.type !== 'line' && !e.containerId)), pair: box(els.filter((e) => want.has(e.id))) }; })()
        """)
        func rect(_ k: String) -> CGRect { let v = (r[k] as? [Double]) ?? [0, 0, 0, 0]; return CGRect(x: v[0], y: v[1], width: v[2], height: v[3]) }
        return MindMapView(zoom: r["zoom"] as? Double ?? 0, width: r["width"] as? Double ?? 0, height: r["height"] as? Double ?? 0, map: rect("map"), pair: rect("pair"))
    }

    /// The rule for the view after Tab (round 10): the parent and new branch in view; the zoom you
    /// had if the whole map fits at it, with the map in the middle; else zoomed out only as far as
    /// it fits, never below 75% (nor below where you were).
    static func expectBranchInView(before: MindMapView, after: MindMapView, sourceLocation: SourceLocation = #_sourceLocation) {
        let pair = after.pair
        #expect(pair.minX >= 39 && pair.minY >= 39 && pair.maxX <= after.width - 39 && pair.maxY <= after.height - 39,
                "the parent and its new branch in view: \(pair) in \(after.width)×\(after.height)", sourceLocation: sourceLocation)
        let fitsBefore = after.map.width / after.zoom * before.zoom <= after.width - 96 && after.map.height / after.zoom * before.zoom <= after.height - 96
        if fitsBefore {
            #expect(abs(after.zoom - before.zoom) < 1e-6, "the zoom you had, as the map fits at it: \(before.zoom) → \(after.zoom)", sourceLocation: sourceLocation)
        } else {
            #expect(after.zoom <= before.zoom + 1e-6 && after.zoom >= min(before.zoom, 0.75) - 1e-6, "zoomed out no further than 75%: \(before.zoom) → \(after.zoom)", sourceLocation: sourceLocation)
        }
        let whole = after.map.minX >= -1 && after.map.minY >= -1 && after.map.maxX <= after.width + 1 && after.map.maxY <= after.height + 1
        if after.map.width <= after.width - 96 && after.map.height <= after.height - 96 {
            #expect(whole, "the whole map in view: \(after.map)", sourceLocation: sourceLocation)
            // Where the view moved, it put the map in the middle (not against an edge).
            let moved = abs(after.map.minX - before.map.minX) > 1 || abs(after.map.minY - before.map.minY) > 1 || abs(after.zoom - before.zoom) > 1e-6
            if moved {
                #expect(abs(after.map.midX - after.width / 2) < 2 && abs(after.map.midY - after.height / 2) < 2, "moved, so the map is in the middle: \(after.map) in \(after.width)×\(after.height)", sourceLocation: sourceLocation)
            }
        }
    }

    /// Tab on a mind map in a board too small for it (the MacBook Air's board column, round 10,
    /// real-mindmap-second-tab: 90, 75 then 60%, the map against the right edge): the first Tab
    /// zooms out only to 75%, the next ones not at all; each time the parent and the new branch
    /// show. In a big board at 80%, a branch off the right edge brings the whole map to the middle
    /// at 80%. Already below 75%, a Tab only pans.
    @Test func tabKeepsTheZoomAndZoomsOutOnlyWhenTheMapCantFit() async throws {
        func tab(_ j: Joined) async throws {
            _ = try await j.js("(() => { (document.activeElement && document.activeElement.tagName === 'TEXTAREA' ? document.activeElement : window).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })); return 1; })()")
        }
        func open(_ size: CGSize) async throws -> Joined {
            let j = try await Joined(size: size)
            try await j.ready()
            j.canvas.send(.insert(.mindMap, title: "Plan"))
            await j.until("the mind map is in") { !j.canvas.state.empty }
            try await Task.sleep(for: .milliseconds(300))
            return j
        }
        func whenID(_ j: Joined) async throws -> String {
            try #require(try await j.js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.type === 'text' && e.containerId && e.text === 'When'); return t ? t.containerId : null; })()") as? String)
        }
        func editing(_ j: Joined) async throws -> String? {
            try await j.js("(() => { const t = amber._canvas.api.getAppState().editingTextElement; return t && t.containerId ? t.containerId : null; })()") as? String
        }
        func grow(_ j: Joined, from parent: String, select: Bool) async throws -> (MindMapView, MindMapView, String) {
            if select {
                _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(parent)': true } } }); return 1; })()")
                try await Task.sleep(for: .milliseconds(150))
            }
            let before = try await Self.mindMapView(j, parent)
            try await tab(j)
            var child: String?
            for _ in 0..<100 { child = try await editing(j); if let child, child != parent { break }; try await Task.sleep(for: .milliseconds(30)) }
            let id = try #require(child, "a branch grew and is typed in")
            try await Task.sleep(for: .milliseconds(100))
            return (before, try await Self.mindMapView(j, parent, id), id)
        }

        // A board column narrower than the map once it has grown (the Air's was 828 pt), at 100%.
        let air = try await open(CGSize(width: 760, height: 780))
        defer { air.close() }
        _ = try await air.js("(() => { const api = amber._canvas.api; api.updateScene({ appState: { zoom: { value: 1 } } }); api.scrollToContent(undefined, { animate: false }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        let when = try await whenID(air)
        let (b1, a1, first) = try await grow(air, from: when, select: true)
        Self.expectBranchInView(before: b1, after: a1)
        #expect(abs(a1.zoom - 0.75) < 1e-6, "zoomed out to 75% and no further: \(a1.zoom)")
        // Tab while typing in it: its own branch; the zoom stays.
        let (b2, a2, second) = try await grow(air, from: first, select: false)
        Self.expectBranchInView(before: b2, after: a2)
        #expect(abs(a2.zoom - a1.zoom) < 1e-6, "the next Tab keeps the zoom: \(a1.zoom) → \(a2.zoom)")
        let (b3, a3, _) = try await grow(air, from: second, select: false)
        Self.expectBranchInView(before: b3, after: a3)
        #expect(a3.zoom >= 0.75 - 1e-6, "never below 75% for a Tab: \(a3.zoom)")

        // A big board at 80%, the map pushed against its right edge: the new branch would be off
        // it, the map fits at 80%, so it comes to the middle, at 80%.
        let big = try await open(CGSize(width: 1400, height: 900))
        defer { big.close() }
        _ = try await big.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), els = api.getSceneElements();
          const x2 = Math.max(...els.map((e) => e.x + e.width)), y1 = Math.min(...els.map((e) => e.y)), y2 = Math.max(...els.map((e) => e.y + e.height));
          api.updateScene({ appState: { zoom: { value: 0.8 }, scrollX: (s.width - 20) / 0.8 - x2, scrollY: s.height / 2 / 0.8 - (y1 + y2) / 2 } }); return 1; })()
        """)
        try await Task.sleep(for: .milliseconds(200))
        let (b4, a4, _) = try await grow(big, from: try await whenID(big), select: true)
        Self.expectBranchInView(before: b4, after: a4)
        #expect(abs(a4.zoom - 0.8) < 1e-6, "the zoom you had: \(a4.zoom)")
        #expect(abs(a4.map.midX - a4.width / 2) < 2, "the map in the middle, not against the edge: \(a4.map) in \(a4.width)")

        // Already at 60% in the small board: a Tab pans, and doesn't zoom.
        let small = try await open(CGSize(width: 600, height: 600))
        defer { small.close() }
        _ = try await small.js("(() => { const api = amber._canvas.api; api.updateScene({ appState: { zoom: { value: 0.6 } } }); api.scrollToContent(undefined, { animate: false }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        let (b5, a5, _) = try await grow(small, from: try await whenID(small), select: true)
        Self.expectBranchInView(before: b5, after: a5)
        #expect(abs(a5.zoom - 0.6) < 1e-6, "below 75% already: the zoom stays: \(a5.zoom)")
    }

    /// Keys typed straight after Tab go into the new branch (seen on a Mac, 15 November 2026:
    /// "Next spring" typed fast after Tab showed only "spring" in the box). Typing started 30 to 70
    /// ms after Tab, on a timer, and keys typed before it went to the engine (E picked the eraser,
    /// T the text tool, S added a sticky). Real key presses go to the offscreen window one after
    /// another without a pause, Tab first, and Tab again while typing; what the box shows is read
    /// after every key and every few milliseconds (an offscreen page gets no animation frames):
    /// always the start of the words, never a later part alone, all of it in view, and in the end
    /// both branches have all their words. The tool stays Select, no sticky appears, and your own
    /// font size is back once the typing ends.
    @Test func keysTypedStraightAfterTabAllGoInTheNewBranch() async throws {
        let j = try await Joined(size: CGSize(width: 900, height: 760))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.mindMap, title: "Plan"))
        await j.until("the mind map is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        let whenID = try #require(try await j.js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.type === 'text' && e.containerId && e.text === 'When'); return t ? t.containerId : null; })()") as? String)
        let stickies = "amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).length"
        let stickiesBefore = try await j.js(stickies) as? Int ?? -1
        // Your own size for new words, which a branch borrows its parent's in place of.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { currentItemFontSize: 36, selectedElementIds: { '\(whenID)': true } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        // What the box shows, after each key and every few milliseconds: its words, and whether some
        // of them are out of view (the box one line tall with two lines in it).
        _ = try await j.js("""
        (() => { window.__shown = []; const api = amber._canvas.api;
          const look = () => { const ta = document.querySelector('textarea.excalidraw-wysiwyg'); if (!ta) return;
            window.__shown.push({ text: ta.value, hidden: ta.scrollHeight > ta.clientHeight + 1 || ta.scrollTop > 0, tool: api.getAppState().activeTool.type }); };
          window.__look = setInterval(look, 4);
          window.addEventListener('input', look);
          window.addEventListener('keyup', look);
          return 1; })()
        """)
        let w = j.rig.window
        #expect(w.makeFirstResponder(j.web))
        let codes: [Character: UInt16] = ["N": 45, "e": 14, "x": 7, "t": 17, " ": 49, "s": 1, "p": 35, "r": 15, "i": 34, "n": 45, "g": 5, "S": 1, "o": 31, "\t": 48]
        // Down and up, as the window would deliver them, without posting anything system-wide.
        func type(_ text: String) {
            for c in text {
                let chars = String(c), flags: NSEvent.ModifierFlags = c.isUppercase ? .shift : []
                for kind in [NSEvent.EventType.keyDown, .keyUp] {
                    let e = NSEvent.keyEvent(with: kind, location: .zero, modifierFlags: flags, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: w.windowNumber,
                                             context: nil, characters: chars, charactersIgnoringModifiers: chars.lowercased(), isARepeat: false, keyCode: codes[c] ?? 0)
                    if let e { w.sendEvent(e) }
                }
            }
        }
        type("\tNext spring\tSoon")
        // Typed into until the last key lands.
        func branch(_ words: String) async throws -> Bool {
            try await j.js("amber._canvas.api.getSceneElementsIncludingDeleted().some((e) => e.type === 'text' && !e.isDeleted && e.containerId && e.originalText === \(String(reflecting: words)))") as? Bool ?? false
        }
        for _ in 0..<100 where try await !branch("Soon") { try await Task.sleep(for: .milliseconds(30)) }
        try await Task.sleep(for: .milliseconds(100))
        _ = try await j.js("(() => { clearInterval(window.__look); const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("not typing") { !j.canvas.state.editing }

        #expect(try await branch("Next spring"), "the first branch has every word")
        #expect(try await branch("Soon"), "and the second")
        let shown = try await Self.json(j, "{ list: window.__shown }")["list"] as? [[String: Any]] ?? []
        let texts = shown.compactMap { $0["text"] as? String }
        #expect(texts.contains("Next spring") && texts.contains("Soon"), "the box was read as it was typed in: \(Set(texts).sorted())")
        let partial = texts.filter { !"Next spring".hasPrefix($0) && !"Soon".hasPrefix($0) }
        #expect(partial.isEmpty, "the box only ever shows the start of the words: \(Set(partial).sorted())")
        let hidden = shown.filter { $0["hidden"] as? Bool == true }.compactMap { $0["text"] as? String }
        #expect(hidden.isEmpty, "nothing typed is out of view: \(Set(hidden).sorted())")
        let tools = Set(shown.compactMap { $0["tool"] as? String })
        #expect(tools == ["selection"], "no key went to the engine as a tool: \(tools)")
        #expect(try await j.js(stickies) as? Int == stickiesBefore, "S added no sticky")
        // Your own size, once the typing ends (not the first branch's, after a run of Tabs).
        try await Task.sleep(for: .milliseconds(400))
        #expect(try await j.js("amber._canvas.api.getAppState().currentItemFontSize") as? Int == 36, "your own font size is back")
    }

    /// Tab while typing grows the next branch and never takes the Mac's grey typing suggestion
    /// (round 10, real-select-and-tab: "sp" with a grey "ring" after it, inside a branch; in a Mac
    /// text field Tab accepts that suggestion). The board's text box asks for no inline
    /// predictions, autocorrect or autofill, and the web view allows no inline predictions, so
    /// what's typed is what's kept: "Next spr", Tab, "Book the venue" gives exactly those two.
    @Test func tabWhileTypingNeverTakesATypingSuggestion() async throws {
        let j = try await Joined(size: CGSize(width: 900, height: 760))
        defer { j.close() }
        try await j.ready()
        #expect(j.web.configuration.allowsInlinePredictions == false, "the web view shows no inline predictions")
        j.canvas.send(.insert(.mindMap, title: "Plan"))
        await j.until("the mind map is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        let whenID = try #require(try await j.js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.type === 'text' && e.containerId && e.text === 'When'); return t ? t.containerId : null; })()") as? String)
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(whenID)': true } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        let w = j.rig.window
        #expect(w.makeFirstResponder(j.web))
        let codes: [Character: UInt16] = ["N": 45, "e": 14, "x": 7, "t": 17, " ": 49, "s": 1, "p": 35, "r": 15, "B": 11, "o": 31, "k": 40, "h": 4, "v": 9, "n": 45, "u": 32, "\t": 48]
        func type(_ text: String) {
            for c in text {
                let chars = String(c), flags: NSEvent.ModifierFlags = c.isUppercase ? .shift : []
                for kind in [NSEvent.EventType.keyDown, .keyUp] {
                    let e = NSEvent.keyEvent(with: kind, location: .zero, modifierFlags: flags, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: w.windowNumber,
                                             context: nil, characters: chars, charactersIgnoringModifiers: chars.lowercased(), isARepeat: false, keyCode: codes[c] ?? 0)
                    if let e { w.sendEvent(e) }
                }
            }
        }
        type("\tNext spr\tBook the venue")
        func branches() async throws -> [String] {
            try await j.js("JSON.stringify(amber._canvas.api.getSceneElementsIncludingDeleted().filter((e) => e.type === 'text' && !e.isDeleted && e.containerId).map((e) => e.originalText))").flatMap { $0 as? String }
                .flatMap { try JSONSerialization.jsonObject(with: Data($0.utf8)) as? [String] } ?? []
        }
        for _ in 0..<100 where try await !branches().contains("Book the venue") { try await Task.sleep(for: .milliseconds(30)) }
        // The box being typed in asks for no suggestions.
        let box = try await Self.json(j, "(() => { const t = document.querySelector('textarea.excalidraw-wysiwyg'); return t ? { writingsuggestions: t.getAttribute('writingsuggestions'), autocorrect: t.getAttribute('autocorrect'), autocomplete: t.getAttribute('autocomplete'), spellcheck: t.spellcheck } : {}; })()")
        #expect(box["writingsuggestions"] as? String == "false", "no inline predictions in the box: \(box)")
        #expect(box["autocorrect"] as? String == "off" && box["autocomplete"] as? String == "off", "no autocorrect or autofill: \(box)")
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("not typing") { !j.canvas.state.editing }
        let words = try await branches()
        #expect(words.contains("Next spr"), "the first branch has exactly what was typed: \(words)")
        #expect(words.contains("Book the venue"), "the second, grown by Tab while typing: \(words)")
        #expect(!words.contains { $0.hasPrefix("Next spr") && $0 != "Next spr" }, "nothing was added to it: \(words)")
        // The second grew from the first: Tab grew a branch rather than taking anything.
        let joined = try await j.js("""
        (() => { const api = amber._canvas.api, els = api.getSceneElements(), box = (w) => { const t = els.find((e) => e.type === 'text' && e.originalText === w); return t && t.containerId; };
          const a = box('Next spr'), b = box('Book the venue');
          return !!a && !!b && els.some((e) => e.type === 'arrow' && e.startBinding && e.startBinding.elementId === a && e.endBinding && e.endBinding.elementId === b); })()
        """) as? Bool
        #expect(joined == true, "Book the venue is a branch of Next spr")
    }

    /// An AI writes a card in the short form, a shape whose customData names a note by title: the
    /// board draws it as a card where it was, keeping its id (an arrow bound to it stays bound and
    /// still meets it), takes the note's id, and saves it back in full. One written while the board
    /// is open is drawn too; a title no note has says so.
    @Test func anAIsShortCardIsDrawnAsACard() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "draft", "x": -320, "y": 0, "width": 180, "height": 70, "label": ["text": "Draft"]],
            ["type": "rectangle", "id": "plan", "x": 0, "y": -15, "width": 260, "height": 100, "customData": ["pintoNote": "Launch plan"], "label": ["text": "Launch plan"]],
            ["type": "arrow", "id": "join", "x": -138, "y": 35, "width": 136, "height": 0, "start": ["id": "draft"], "end": ["id": "plan"]],
        ]))
        defer { j.close() }
        let library = Library()
        library.notes = ["Launch plan": Self.planCard, Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "card")?["note"] as? String == Self.plan.uuidString { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let parts = try await Self.cardParts(j)
        let frame = try #require(Self.part(parts, "card"))
        #expect(frame["id"] as? String == "plan" && frame["note"] as? String == Self.plan.uuidString, "its id kept, the note's id taken: \(frame)")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        #expect((Self.part(parts, "preview")?["text"] as? String)?.hasPrefix("Ship the beta") == true)
        let label = try await j.js("(() => amber._canvas.api.getSceneElements().filter((e) => e.containerId === 'plan').length)()") as? Int
        #expect(label == 0, "the AI's own label gave way to the card's title")
        // The arrow still joins it, and still meets its edge.
        let arrow = try #require(try await j.js("(() => { const a = amber._canvas.api.getSceneElements().find((e) => e.id === 'join'); return JSON.stringify({ end: a.endBinding && a.endBinding.elementId, y: a.y + a.points[a.points.length - 1][1] }); })()") as? String)
        let a = try JSONSerialization.jsonObject(with: Data(arrow.utf8)) as? [String: Any] ?? [:]
        #expect(a["end"] as? String == "plan")
        let fy = frame["y"] as? Double ?? 0, fh = frame["height"] as? Double ?? 0, ay = a["y"] as? Double ?? -1
        #expect(ay >= fy && ay <= fy + fh, "the arrow ends on the card (\(ay) in \(fy)…\(fy + fh))")
        // Saved back in full.
        _ = try await j.js("(() => { amber._flush(); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        #expect(j.rig.elements.contains { $0["id"] as? String == "plan-title" && $0["text"] as? String == "Launch plan" })

        // An AI adds another while the board is open; one names a note that isn't there.
        var all = j.rig.elements
        all.append(["type": "rectangle", "id": "press", "x": 0, "y": 200, "customData": ["pintoNote": "Press list"]])
        all.append(["type": "rectangle", "id": "nope", "x": 0, "y": 400, "customData": ["pintoNote": "Nobody wrote this"]])
        library.notes["Press list"] = Self.pressCard
        library.notes[Self.press.uuidString] = Self.pressCard
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(all)], "collections": [String: Any]()])
        for _ in 0..<80 {
            let p = try await Self.cardParts(j)
            if Self.part(p, "card", of: Self.press.uuidString) != nil, Self.part(p, "preview", of: "Nobody wrote this") != nil { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let now = try await Self.cardParts(j)
        #expect(Self.part(now, "title", of: Self.press.uuidString)?["text"] as? String == "Press list")
        #expect(Self.part(now, "preview", of: "Nobody wrote this")?["text"] as? String == CanvasNoteCard.missingText)
        j.canvas.openCard("Nobody wrote this")
        #expect(library.opened.isEmpty && j.canvas.notice == "No note has this title")
    }

    /// Export and the shared page's picture show a card as drawn, its title and first lines, with
    /// no link in it; the .excalidraw file keeps which note it is.
    @Test func aCardExportsAsDrawn() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on") { j.canvas.state.card != nil }
        let svg = String(decoding: try #require(await j.canvas.export(.svg)), as: UTF8.self)
        #expect(svg.contains("Launch plan") && svg.contains("Ship the beta"), "its words are in the picture")
        #expect(!svg.contains("<a ") && !svg.contains("xlink:href=\"http") && !svg.contains("href=\"http"), "no link to follow")
        #expect(await j.canvas.export(.png, light: true, page: "Product launch") != nil)
        let file = String(decoding: try #require(await j.canvas.export(.excalidraw)), as: UTF8.self)
        #expect(file.contains("\"pintoNote\"") && file.contains(Self.plan.uuidString))
    }

    /// Notes dragged from the list onto a board go on as cards where they're dropped, side by side;
    /// the board itself doesn't, and a folder is refused with a word.
    @Test func notesDroppedFromTheListGoOnAsCards() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        let library = Library()
        let board = UUID()
        library.notes = [Self.plan.uuidString: Self.planCard, Self.press.uuidString: Self.pressCard]
        library.join(j.canvas, board: board)
        try await j.ready()
        func provider(_ item: PaneDragItem) -> NSItemProvider {
            let p = NSItemProvider()
            let data = try? JSONEncoder().encode(item)
            p.registerDataRepresentation(forTypeIdentifier: UTType.paneItem.identifier, visibility: .all) { done in done(data, nil); return nil }
            return p
        }
        let drop = [provider(PaneDragItem(kind: .note, id: Self.plan, others: [Self.press, board]))]
        #expect(CanvasNoteDrop.carriesNotes(drop))
        CanvasNoteDrop.place(drop, at: CGPoint(x: 300, y: 260), on: j.canvas)
        await j.until("two cards") { j.canvas.state.cardNotes.count == 2 }
        #expect(Set(j.canvas.state.cardNotes) == [Self.plan.uuidString, Self.press.uuidString], "not the board itself")
        let first = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card' && e.customData.pintoNote === '\(Self.plan.uuidString)'")
        #expect(abs(first.x - 300) < 2, "the first card is centred where it was dropped: \(first)")
        let second = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card' && e.customData.pintoNote === '\(Self.press.uuidString)'")
        #expect(second.x > first.x + 200, "the next beside it")
        // A folder isn't a note.
        CanvasNoteDrop.place([provider(PaneDragItem(kind: .folder, id: UUID()))], at: .zero, on: j.canvas)
        await j.until("said") { j.canvas.notice == "Only notes and pictures can go on a whiteboard" }
    }

    /// The picker's choice goes in the middle of the view, clear of what's drawn there.
    @Test func aCardFromThePickerGoesWhereNothingIsDrawn() async throws {
        let j = try await Joined(scene: CanvasTests.scene([["type": "rectangle", "id": "mid", "x": -100, "y": -60, "width": 200, "height": 120]]))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        _ = try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(); api.updateScene({ appState: { scrollX: s.width / 2, scrollY: s.height / 2, zoom: { value: 1 } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(100))
        j.canvas.addCards([Self.plan])
        await j.until("on") { j.canvas.state.card != nil }
        let overlap = try await j.js("""
        (() => { const els = amber._canvas.api.getSceneElements(), f = els.find((e) => e.customData && e.customData.pintoCard === 'card'), m = els.find((e) => e.id === 'mid');
          return f.x < m.x + m.width && f.x + f.width > m.x && f.y < m.y + m.height && f.y + f.height > m.y; })()
        """) as? Bool
        #expect(overlap == false, "not on top of the box")
        let bounds = try #require(j.canvas.state.bounds)
        #expect(bounds.minX >= 0 && bounds.maxX <= 900 && bounds.minY >= 0 && bounds.maxY <= 600, "in view: \(bounds)")
    }
    #endif

    @Test func editUndoAndRedoReachTheDrawingsHistory() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let web = try #require(j.web as? NotePageWebView)
        let undo = NSMenuItem(title: "Undo", action: #selector(NotePageWebView.undo(_:)), keyEquivalent: "z")
        #expect(web.responds(to: #selector(NotePageWebView.undo(_:))))
        #expect(!web.validateUserInterfaceItem(undo), "nothing to undo yet")
        // Selected as a step of its own, as a click selects.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } }, captureUpdate: 'IMMEDIATELY' }); 1")
        await j.until("selected") { j.canvas.state.hasSelection }
        j.canvas.set(.strokeColor, .text("#2f9e44"))
        await j.until("there's something to undo") { j.canvas.canUndo && j.canvas.state.strokeColor == "#2f9e44" }
        #expect(web.validateUserInterfaceItem(undo))
        NSApp.sendAction(#selector(NotePageWebView.undo(_:)), to: web, from: undo)
        try await Task.sleep(for: .milliseconds(300))
        let color = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.id === 'box').strokeColor") as? String
        #expect(color != "#2f9e44", "Edit › Undo took the colour back: \(color ?? "")")
        // Not a canvas: the web view leaves Undo to the window.
        web.canvas = nil
        #expect(!web.responds(to: #selector(NotePageWebView.undo(_:))))
    }

    // MARK: The library (whiteboard council, round 5)

    /// Two items of "Data flow" (version 2, wmartzh/data-flow) as libraries.excalidraw.com serves
    /// them, old field names (strokeSharpness) and all.
    static let dataFlowLibrary = ##"{"type":"excalidrawlib","version":2,"source":"https://app.excalidraw.com","libraryItems":[{"status":"published","elements":[{"type":"rectangle","version":108,"versionNonce":848887945,"isDeleted":false,"id":"XkAdaH1IwXkCjxQatp0pT","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1483.89453125,"y":-29.243408203125,"strokeColor":"#000000","backgroundColor":"#fff","width":257,"height":101.93063354492188,"seed":841639,"groupIds":[],"strokeSharpness":"round","boundElements":[{"type":"text","id":"teIXOJCl7lqVSBxz13SLo"},{"id":"ws0W9X53qIvWrct3Bm-gk","type":"arrow"}],"updated":1664316938680,"link":null,"locked":false},{"type":"text","version":77,"versionNonce":534505607,"isDeleted":false,"id":"teIXOJCl7lqVSBxz13SLo","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1488.89453125,"y":10.221908569335938,"strokeColor":"#000000","backgroundColor":"#fff","width":247,"height":23,"seed":1486156295,"groupIds":[],"strokeSharpness":"round","boundElements":[],"updated":1664316938680,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"process","baseline":17,"textAlign":"center","verticalAlign":"middle","containerId":"XkAdaH1IwXkCjxQatp0pT","originalText":"process"}],"id":"-HAghVFVWMglgZs-d97P4","created":1664316941555,"name":"Process"},{"status":"published","elements":[{"type":"rectangle","version":308,"versionNonce":1700457967,"isDeleted":false,"id":"bKHk3GOZWrcCSzOwuJq83","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1621.8062670196573,"y":878.6495665282432,"strokeColor":"#000000","backgroundColor":"transparent","width":224,"height":51.660491943359375,"seed":1154761121,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[{"id":"T25UGS-Sj4gZjQVfuaCop","type":"text"},{"id":"T25UGS-Sj4gZjQVfuaCop","type":"text"},{"type":"text","id":"T25UGS-Sj4gZjQVfuaCop"}],"updated":1664303280978,"link":null,"locked":false},{"type":"line","version":443,"versionNonce":2125010831,"isDeleted":false,"id":"wDekN_ZvIVKa0IN5GNmoW","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1671.1207482460186,"y":877.8450575839769,"strokeColor":"#000000","backgroundColor":"transparent","width":0.7604041975725977,"height":51.55870056152344,"seed":1388504303,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[],"updated":1664303280020,"link":null,"locked":false,"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[0.5249305647600977,25.85967849675626],[-0.2354736328125,51.55870056152344]]},{"type":"text","version":208,"versionNonce":1686531201,"isDeleted":false,"id":"T25UGS-Sj4gZjQVfuaCop","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1626.8062670196573,"y":891.9798124999229,"strokeColor":"#000000","backgroundColor":"transparent","width":214,"height":25,"seed":1526556033,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[],"updated":1664303280978,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"Store","baseline":18,"textAlign":"center","verticalAlign":"middle","containerId":"bKHk3GOZWrcCSzOwuJq83","originalText":"Store"},{"type":"text","version":102,"versionNonce":336107279,"isDeleted":false,"id":"SEtPWSeAsRJsNU3OADEIZ","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1635.826436755428,"y":895.3547373976627,"strokeColor":"#000000","backgroundColor":"#fff","width":22,"height":25,"seed":87136207,"groupIds":["FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"sharp","boundElements":[],"updated":1664303279242,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"D1","baseline":18,"textAlign":"left","verticalAlign":"top","containerId":null,"originalText":"D1"}],"id":"1PU7FVRjr4UDcNG3OesgJ","created":1664303296127,"name":"Data storage"}]}"##

    /// Two items of "Basic shapes" (version 1, pgilfernandez/basic-shapes), as the site serves them.
    static let basicShapesLibrary = ##"{"type":"excalidrawlib","version":1,"source":"https://excalidraw.com","library":[[{"type":"line","version":896,"versionNonce":235201635,"isDeleted":false,"id":"skg7gqUlRzEIoOiugXifs","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":-595.9369869225809,"y":-57.47827374377303,"strokeColor":"#000000","backgroundColor":"#ced4da","width":154.11430603829422,"height":154.8767364889196,"seed":1126339617,"groupIds":[],"strokeSharpness":"sharp","boundElementIds":[],"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[154.0813522663615,154.6580432751842],[-0.032953771932716,154.8767364889196],[0,0]]}],[{"type":"line","version":906,"versionNonce":1980765645,"isDeleted":false,"id":"5XJBeMDTZE77o24DN2uK_","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":-323.49494066630416,"y":-53.87499999999951,"strokeColor":"#000000","backgroundColor":"#ced4da","width":176.0048133026142,"height":153.16773078464527,"seed":1932509089,"groupIds":[],"strokeSharpness":"sharp","boundElementIds":[],"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[85.76001280730273,153.16773078464527],[-90.24480049531147,151.29227411511434],[0,0]]}]]}"##

    /// A library of the test's own, swapped in for the app's while it runs.
    static func withLibrary(_ folder: URL? = nil, _ body: (CanvasLibrary) async throws -> Void) async rethrows {
        let kept = CanvasLibrary.shared
        let lib = CanvasLibrary(folder: folder)
        CanvasLibrary.shared = lib
        defer { CanvasLibrary.shared = kept }
        try await body(lib)
    }

    /// What a library item added to a board did: the new elements' boxes (in the scene), whether
    /// any of them covers what was there before, whether they're all in view, and what's selected.
    static func added(_ j: Joined, before: [String]) async throws -> (boxes: [[Double]], covers: Bool, inView: Bool, selected: Int, fresh: Int, centre: CGPoint) {
        let json = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, old = new Set(\(String(decoding: try JSONSerialization.data(withJSONObject: before), as: UTF8.self)));
          const box = (e) => { const xs = [e.x, e.x + e.width], ys = [e.y, e.y + e.height]; return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
          const all = api.getSceneElements(), fresh = all.filter((e) => !old.has(e.id)), was = all.filter((e) => old.has(e.id));
          const boxes = fresh.map(box);
          const covers = boxes.some(([a, b, c, d]) => was.map(box).some(([x1, y1, x2, y2]) => a < x2 && c > x1 && b < y2 && d > y1));
          const inView = boxes.every(([a, b, c, d]) => (a + s.scrollX) * z >= 0 && (b + s.scrollY) * z >= 0 && (c + s.scrollX) * z <= s.width && (d + s.scrollY) * z <= s.height);
          const x1 = Math.min(...boxes.map((b) => b[0])), y1 = Math.min(...boxes.map((b) => b[1])), x2 = Math.max(...boxes.map((b) => b[2])), y2 = Math.max(...boxes.map((b) => b[3]));
          const centre = [((x1 + x2) / 2 + s.scrollX) * z, ((y1 + y2) / 2 + s.scrollY) * z];
          const selected = fresh.filter((e) => s.selectedElementIds[e.id]).length;
          return JSON.stringify({ boxes, covers, inView, selected, fresh: fresh.length, centre }); })()
        """) as? String)
        let r = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        let c = r["centre"] as? [Double] ?? [0, 0]
        return (r["boxes"] as? [[Double]] ?? [], r["covers"] as? Bool ?? true, r["inView"] as? Bool ?? false, r["selected"] as? Int ?? 0, r["fresh"] as? Int ?? 0, CGPoint(x: c[0], y: c[1]))
    }

    static func ids(_ j: Joined) async throws -> [String] {
        let json = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().map((e) => e.id))") as? String)
        return try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String])
    }

    /// Save to Library keeps what's selected as one item: the shapes, their words, the arrow
    /// between them still joined, and joins to what was left behind cut. The board draws its
    /// picture. It's kept in the app, not in the board's file.
    @Test func aSelectionIsSavedToTheLibraryWithItsWordsAndAPicture() async throws {
        try await Self.withLibrary { lib in
            let j = try await Joined(scene: Self.flowchart)
            defer { j.close() }
            try await j.ready()
            #expect(await j.canvas.saveSelectionToLibrary(lib) == nil, "nothing selected: nothing saved")
            #expect(lib.items.isEmpty && j.canvas.notice?.hasPrefix("Select something") == true, "and it says why: \(j.canvas.notice ?? "")")
            // Draft and Ready?, and the arrow between them; the arrow from Idea into Draft stays behind.
            _ = try await j.js("(() => { const api = amber._canvas.api, ids = { draft: true, ready: true }; for (const e of api.getSceneElements()) if (e.type === 'arrow' && e.startBinding && e.startBinding.elementId === 'draft' && e.endBinding && e.endBinding.elementId === 'ready') ids[e.id] = true; api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
            await j.until("three selected") { j.canvas.state.selection.count == 3 }
            let item = try #require(await j.canvas.saveSelectionToLibrary(lib))
            #expect(lib.items.map(\.id) == [item.id])
            #expect(j.canvas.notice == CanvasController.savedTitle)
            let els = item.elements
            #expect(els.compactMap { $0["type"] as? String }.sorted() == ["arrow", "diamond", "rectangle", "text", "text"], "the box, the diamond, the arrow and their words")
            #expect(item.name == "Draft \u{00B7} Ready?", "named by its words: \(item.name ?? "nil")")
            let ids = Set(els.compactMap { $0["id"] as? String })
            let draft = try #require(els.first { $0["id"] as? String == "draft" })
            let joined = (draft["boundElements"] as? [[String: Any]] ?? []).compactMap { $0["id"] as? String }
            #expect(!joined.isEmpty && joined.allSatisfy(ids.contains), "only joins to what's in the item: \(joined)")
            let arrow = try #require(els.first { $0["type"] as? String == "arrow" })
            #expect((arrow["startBinding"] as? [String: Any])?["elementId"] as? String == "draft" && (arrow["endBinding"] as? [String: Any])?["elementId"] as? String == "ready")
            let image = try #require(lib.thumbnails[item.id], "its picture, drawn by the board")
            #expect(max(image.size.width, image.size.height) >= 200, "\(image.size)")
            let saved = String(decoding: try JSONSerialization.data(withJSONObject: j.rig.doc), as: UTF8.self)
            #expect(!saved.contains("libraryItems") && !saved.contains("excalidrawlib"), "nothing of it in the board's file")
        }
    }

    /// Save to Library is in the board's right-click menu and the selection bar's More menu.
    @Test func saveToLibraryIsInTheRightClickMenuAndTheMoreMenu() async throws {
        try await Self.withLibrary { lib in
            let j = try await Joined(scene: CanvasTests.scene(Self.box))
            defer { j.close() }
            try await j.ready()
            let web = try #require(j.web as? NotePageWebView)
            let idle = try #require(web.canvasMenu().items.first { $0.title == CanvasLibraryPopover.saveTitle })
            #expect(!idle.isEnabled, "nothing selected: nothing to save")
            _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); return 1; })()")
            await j.until("the box selected") { j.canvas.state.selection == ["rectangle"] }
            let save = try #require(web.canvasMenu().items.first { $0.title == CanvasLibraryPopover.saveTitle })
            #expect(save.isEnabled)
            _ = save.target?.perform(save.action, with: save)
            await j.until("saved from the right-click menu") { lib.items.count == 1 }
            // The selection bar's More menu (its items, as the menu shows them).
            let ax = OffscreenAX(VStack { CanvasMoreItems(canvas: j.canvas) }.padding(10), size: CGSize(width: 320, height: 420))
            defer { ax.close() }
            await ax.settle()
            let more = try #require(ax.find("canvas.saveToLibrary"), "\(ax.ids())")
            #expect(more.text.contains(CanvasLibraryPopover.saveTitle), "\(more.text)")
            more.press()
            await j.until("saved from the More menu") { lib.items.count == 2 }
            #expect(lib.items.allSatisfy { $0.elements.first?["type"] as? String == "rectangle" })
        }
    }

    /// A click in the library puts the item in the middle of the view, in a free spot, never on
    /// the drawing, selected, as one step Undo takes back; again, and the copy goes beside it.
    @Test func aLibraryItemGoesInAFreeSpotInTheMiddleOfTheViewSelected() async throws {
        try await Self.withLibrary { lib in
            let item = try #require(lib.add(elements: [
                ["type": "rectangle", "id": "srv", "x": 3000, "y": 3000, "width": 160, "height": 80, "backgroundColor": "#a5d8ff", "fillStyle": "solid",
                 "seed": 1, "version": 1, "versionNonce": 1, "boundElements": [["type": "text", "id": "srv-t"]]],
                ["type": "text", "id": "srv-t", "x": 3050, "y": 3028, "width": 60, "height": 25, "text": "Server", "originalText": "Server", "containerId": "srv",
                 "fontSize": 20, "fontFamily": 5, "textAlign": "center", "verticalAlign": "middle", "seed": 2, "version": 1, "versionNonce": 2],
            ]))
            // An empty board: right in the middle.
            do {
                let j = try await Joined(scene: CanvasTests.scene([]))
                defer { j.close() }
                try await j.ready()
                j.canvas.insert(item)
                await j.until("it's on the board") { !j.canvas.state.empty }
                let r = try await Self.added(j, before: [])
                #expect(r.fresh == 2 && abs(r.centre.x - 450) < 3 && abs(r.centre.y - 300) < 3, "in the middle of a 900 by 600 view: \(r.centre)")
                let text = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.type === 'text').originalText") as? String
                #expect(text == "Server", "its words came along")
                let ids = try await Self.ids(j)
                #expect(!ids.contains("srv"), "new ids, so it can go on as often as you like")
            }
            // A drawing across the middle: beside it, in view, selected.
            let j = try await Joined(scene: Self.flowchart)
            defer { j.close() }
            try await j.ready()
            _ = try await j.js("(() => { const api = amber._canvas.api; api.scrollToContent(api.getSceneElements(), { fitToContent: true, animate: false }); return 1; })()")
            try await Task.sleep(for: .milliseconds(200))
            let before = try await Self.ids(j)
            j.canvas.insert(item)
            await j.until("it's selected") { j.canvas.state.selection == ["rectangle"] }
            let first = try await Self.added(j, before: before)
            #expect(first.fresh == 2 && !first.covers, "never on the drawing: \(first.boxes)")
            #expect(first.inView && first.selected == 1, "in view and selected: \(first)")
            #expect(j.canvas.state.showsSelectionBar, "the selection bar shows for it")
            let after = try await Self.ids(j)
            j.canvas.insert(item)
            for _ in 0..<100 where (try await Self.ids(j)).count < after.count + 2 { try await Task.sleep(for: .milliseconds(30)) }
            let second = try await Self.added(j, before: after)
            #expect(!second.covers, "the second copy isn't on the first: \(second.boxes)")
            // One step each for Undo.
            j.canvas.run(.undo)
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.run(.undo)
            for _ in 0..<100 where try await Self.ids(j) != before { try await Task.sleep(for: .milliseconds(30)) }
            #expect(try await Self.ids(j) == before, "two Undos take both back")
        }
    }

    /// A tile dragged from the library onto the board goes where it's dropped, selected.
    @Test func aLibraryItemDroppedOnTheBoardGoesWhereItsDropped() async throws {
        try await Self.withLibrary { lib in
            _ = try #require(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)))
            let item = try #require(lib.items.first { $0.name == "Process" })
            let j = try await Joined(scene: CanvasTests.scene(Self.box))
            defer { j.close() }
            try await j.ready()
            let before = try await Self.ids(j)
            await CanvasImageDrop.place([CanvasLibraryDrag.provider(item)], at: CGPoint(x: 640, y: 420), on: j.canvas, library: lib).value
            await j.until("it's selected") { j.canvas.state.selection == ["rectangle"] }
            let r = try await Self.added(j, before: before)
            #expect(r.fresh == 2 && abs(r.centre.x - 640) < 3 && abs(r.centre.y - 420) < 3, "centred where it was dropped: \(r.centre)")
            #expect(r.selected == 1)
            // Something else of this type that isn't in the library: nothing goes on.
            let stranger = NSItemProvider()
            stranger.registerDataRepresentation(forTypeIdentifier: CanvasLibraryDrag.type.identifier, visibility: .ownProcess) { done in done(Data("gone".utf8), nil); return nil }
            #expect(await CanvasLibraryDrag.item(from: [stranger], in: lib) == nil)
        }
    }

    /// Excalidraw libraries come in from their files, version 1 and 2, as libraries.excalidraw.com
    /// serves them; the same library twice adds nothing; a file that isn't one is refused. An
    /// imported item goes on a board with its words, and the board draws its picture.
    @Test func excalidrawLibrariesImportVersion1And2() async throws {
        let v2 = try #require(CanvasLibraryFile.items(from: Data(Self.dataFlowLibrary.utf8)))
        #expect(v2.map(\.name) == ["Process", "Data storage"])
        #expect(v2.map { $0.elements.count } == [2, 4])
        let v1 = try #require(CanvasLibraryFile.items(from: Data(Self.basicShapesLibrary.utf8)))
        #expect(v1.count == 2 && v1.allSatisfy { $0.elements.first?["type"] as? String == "line" })
        #expect(CanvasLibraryFile.items(from: Data(#"{"type":"excalidraw","elements":[]}"#.utf8)) == nil, "a board, not a library")
        #expect(CanvasLibraryFile.items(from: Data("not json".utf8)) == nil)
        try await Self.withLibrary { lib in
            #expect(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)) == .init(added: 2, already: 0))
            #expect(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)) == .init(added: 0, already: 2), "the same library twice adds nothing")
            // From files, as Import Library… takes them; and one that isn't a library.
            let dir = FileManager.default.temporaryDirectory.appending(path: "library-import-\(UUID().uuidString)")
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: dir) }
            let shapes = dir.appending(path: "basic-shapes.excalidrawlib"), board = dir.appending(path: "Board.excalidraw")
            try Data(Self.basicShapesLibrary.utf8).write(to: shapes)
            try Data(#"{"type":"excalidraw","elements":[]}"#.utf8).write(to: board)
            let report = CanvasLibraryImport.add([shapes, board], to: lib)
            #expect(report == .init(added: 2, already: 0, refused: ["Board.excalidraw"]))
            #expect(CanvasLibraryImport.said(report) == "Added 2 items to the library")
            #expect(lib.items.count == 4 && lib.items.prefix(2).allSatisfy { $0.name == nil }, "newest first")
            // Onto a board: its words come along, and the board draws it.
            let j = try await Joined(scene: CanvasTests.scene([]))
            defer { j.close() }
            try await j.ready()
            let store = try #require(lib.items.first { $0.name == "Data storage" })
            j.canvas.insert(store)
            await j.until("it's on the board") { !j.canvas.state.empty }
            let words = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'text').map((e) => e.originalText).sort().join('|')") as? String
            #expect(words == "D1|Store", "\(words ?? "")")
            await j.canvas.drawThumbnails(lib)
            #expect(lib.items.allSatisfy { lib.thumbnails[$0.id] != nil }, "every item has its picture")
        }
    }

    /// An Excalidraw library file dropped on a board goes into the library, which opens on it.
    @Test func aLibraryFileDroppedOnABoardGoesIntoTheLibrary() async throws {
        try await Self.withLibrary { lib in
            let dir = FileManager.default.temporaryDirectory.appending(path: "library-drop-\(UUID().uuidString)")
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: dir) }
            let file = dir.appending(path: "data-flow.excalidrawlib")
            try Data(Self.dataFlowLibrary.utf8).write(to: file)
            let canvas = CanvasController()
            await CanvasImageDrop.place([NSItemProvider(object: file as NSURL)], at: .zero, on: canvas, library: lib).value
            #expect(lib.items.map(\.name) == ["Process", "Data storage"])
            #expect(canvas.showingLibrary && canvas.notice == "Added 2 items to the library")
            #expect(canvas.sent.isEmpty, "nothing goes on the board itself")
        }
    }

    /// A picture in a saved item comes with it onto another board.
    @Test func aPictureInALibraryItemComesWithIt() async throws {
        try await Self.withLibrary { lib in
            let png = Self.png(width: 40, height: 30, clear: false)
            let url = "data:image/png;base64," + png.base64EncodedString()
            let j = try await Joined(scene: CanvasTests.scene([]))
            defer { j.close() }
            try await j.ready()
            _ = try await j.js("(() => { const api = amber._canvas.api; api.addFiles([{ id: 'pic', dataURL: '\(url)', mimeType: 'image/png', created: 1 }]); api.updateScene({ elements: [{ type: 'image', id: 'img', fileId: 'pic', x: 0, y: 0, width: 40, height: 30, angle: 0, strokeColor: 'transparent', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: 1, link: null, locked: false, status: 'saved', scale: [1, 1] }], appState: { selectedElementIds: { img: true } } }); return 1; })()")
            await j.until("the picture selected") { j.canvas.state.selection == ["image"] }
            let item = try #require(await j.canvas.saveSelectionToLibrary(lib))
            #expect((item.files["pic"] as? [String: Any])?["dataURL"] as? String == url, "its picture is kept with it")
            let k = try await Joined(scene: CanvasTests.scene([]))
            defer { k.close() }
            try await k.ready()
            k.canvas.insert(item)
            await k.until("it's on the other board") { k.canvas.state.selection == ["image"] }
            #expect(try await k.js("!!amber._canvas.api.getFiles().pic") as? Bool == true, "and its picture with it")
        }
    }

    /// The library is kept in the app (its folder in Application Support), for every board, and
    /// comes back after a relaunch with its pictures; a removed item stays gone. Tests never use
    /// the app's own folder. The file is a version 2 library that Excalidraw imports.
    @Test func theLibraryIsKeptInTheAppAndComesBackAfterARelaunch() throws {
        #expect(CanvasLibrary.shared.folder == nil, "tests keep the library in memory, never in your folder")
        #expect(CanvasLibrary.defaultFolder.path.hasSuffix("/\(AppIdentity.dataFolder)/Whiteboard Library"), "\(CanvasLibrary.defaultFolder.path)")
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-keep-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let lib = CanvasLibrary(folder: dir)
        let mine = try #require(lib.add(elements: [["type": "ellipse", "id": "e", "x": 0, "y": 0, "width": 80, "height": 50, "seed": 1, "version": 1, "versionNonce": 1]]))
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
        lib.setThumbnail(Self.png(width: 64, height: 40, clear: true), for: mine.id)
        lib.flush()
        let again = CanvasLibrary(folder: dir)
        #expect(again.items.map(\.id) == lib.items.map(\.id) && again.items.map(\.name) == lib.items.map(\.name), "the same items, in the same order")
        #expect(NSArray(array: again.items.map(\.elements)).isEqual(to: lib.items.map(\.elements)), "with their elements")
        #expect(again.thumbnails[mine.id] != nil, "with their pictures")
        let file = try Data(contentsOf: dir.appending(path: "library.excalidrawlib"))
        let json = try #require(try JSONSerialization.jsonObject(with: file) as? [String: Any])
        #expect(json["type"] as? String == "excalidrawlib" && json["version"] as? Int == 2)
        #expect(CanvasLibraryFile.items(from: file)?.count == 3, "a library file anyone can import")
        again.remove(mine.id)
        again.flush()
        let third = CanvasLibrary(folder: dir)
        #expect(!third.items.contains { $0.id == mine.id } && third.items.count == 2, "removed stays removed")
        #expect(!FileManager.default.fileExists(atPath: dir.appending(path: "thumbnails/\(mine.id).png").path), "and its picture goes")
    }

    /// The library popover: a tile for each item, a click adds it and closes the popover;
    /// removed, it's gone; empty, one plain line and Import Library….
    @Test func theLibraryPopoverShowsItsItemsAndAddsOneOnAClick() async throws {
        let lib = CanvasLibrary(folder: nil)
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
        let mine = try #require(lib.add(elements: [["type": "diamond", "id": "d", "x": 0, "y": 0, "width": 120, "height": 80, "seed": 1, "version": 1, "versionNonce": 1]]))
        let canvas = CanvasController()
        canvas.showingLibrary = true
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: lib), size: CGSize(width: CanvasLibraryPopover.width, height: 360))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.ids().filter { $0 == "canvas.library.item" }.count == 3, "\(ax.ids())")
        #expect(ax.find("canvas.library.import")?.text.contains("Import Library") == true)
        let first = try #require(ax.find("canvas.library.item"))
        first.press()
        await ax.settle(100)
        #expect(canvas.sent.last == .libraryInsert(mine, at: nil), "the newest first, added in the middle of the view")
        #expect(!canvas.showingLibrary, "the popover closes on it")
        lib.remove(mine.id)
        await ax.settle()
        #expect(ax.ids().filter { $0 == "canvas.library.item" }.count == 2, "removed: gone from the grid")
        let empty = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: CanvasLibrary(folder: nil)), size: CGSize(width: CanvasLibraryPopover.width, height: 160))
        defer { empty.close() }
        await empty.settle()
        #expect(empty.find("canvas.library.empty")?.text == CanvasLibraryPopover.emptyLine)
        #expect(empty.find("canvas.library.import") != nil && empty.find("canvas.library.item") == nil)
    }

    /// Each item shows its name (or what it is, when its library leaves it unnamed), grouped under
    /// the library file it came from, yours under Saved, newest group first (library council,
    /// round 6). The file's name is kept with each item, so the groups come back after a relaunch.
    @Test func libraryItemsShowTheirNamesUnderTheLibraryTheyCameFrom() async throws {
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-groups-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }
        let flow = dir.appending(path: "data-flow.excalidrawlib"), shapes = dir.appending(path: "basic_shapes.excalidrawlib")
        try Data(Self.dataFlowLibrary.utf8).write(to: flow)
        try Data(Self.basicShapesLibrary.utf8).write(to: shapes)
        #expect(CanvasLibraryFile.displayName(flow) == "Data flow" && CanvasLibraryFile.displayName(shapes) == "Basic shapes")
        let lib = CanvasLibrary(folder: dir.appending(path: "kept"))
        #expect(CanvasLibraryImport.add([flow], to: lib).added == 2)
        #expect(CanvasLibraryImport.add([shapes], to: lib).added == 2)
        let mine = try #require(lib.add(elements: [["type": "diamond", "id": "d", "x": 0, "y": 0, "width": 120, "height": 80]]))
        #expect(mine.source == nil && mine.title == "Diamond", "yours, named by what it is: \(mine.title)")
        let grid = CanvasLibraryGrid(lib.items)
        #expect(grid.groups.map(\.title) == ["Saved", "Basic shapes", "Data flow"], "\(grid.groups.map(\.title))")
        #expect(grid.groups.map { $0.items.map(\.title) } == [["Diamond"], ["Right triangle", "Triangle"], ["Process", "Data storage"]])
        // Kept with each item, so a relaunch groups them the same.
        lib.flush()
        let again = CanvasLibraryGrid(CanvasLibrary(folder: dir.appending(path: "kept")).items)
        #expect(again.groups.map(\.title) == grid.groups.map(\.title) && again.items.map(\.id) == grid.items.map(\.id))
        // The popover: a heading for each group, each tile says its name.
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: lib), size: CGSize(width: CanvasLibraryPopover.width, height: 460))
        defer { ax.close() }
        await ax.settle()
        let tree = ax.ids()
        #expect(tree.filter { $0 == "canvas.library.group" }.count == 3, "\(tree)")
        #expect(tree.filter { $0 == "canvas.library.item" }.count == 5, "\(tree)")
        let heading = try #require(ax.find("canvas.library.group"))
        #expect(heading.text == "Saved", "\(heading.text)")
        let tile = try #require(ax.find("canvas.library.item"))
        #expect(tile.text.contains("Diamond"), "\(tile.text)")
        #expect(ax.find("canvas.library.search") == nil, "five items: no search field")
    }

    /// An item with no name of its own is named by what it is, with the detail that tells it
    /// apart (round 7: two different triangles were both "Line"); an imported library's names
    /// are kept; and you can rename any item, kept with the library.
    @Test func libraryItemsAreNamedByWhatTheyAreAndCanBeRenamed() async throws {
        func title(_ els: [[String: Any]]) -> String? { CanvasLibraryItem(elements: els)?.title }
        let tri: [[Double]] = [[0, 0], [80, 150], [-90, 150], [0, 0]]
        #expect(title([["type": "line", "x": 0, "y": 0, "width": 170, "height": 150, "points": tri]]) == "Triangle")
        #expect(title([["type": "line", "x": 0, "y": 0, "width": 150, "height": 150, "points": [[0, 0], [150, 150], [0, 150], [0, 0]]]]) == "Right triangle")
        #expect(title([["type": "line", "x": 0, "y": 0, "width": 100, "height": 100, "points": [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]]) == "Polygon")
        #expect(title([["type": "line", "x": 0, "y": 0, "width": 100, "height": 100, "polygon": true, "points": [[0, 0], [100, 0], [100, 100], [0, 100]]]]) == "Polygon")
        #expect(title([["type": "line", "x": 0, "y": 0, "width": 100, "height": 100, "points": [[0, 0], [100, 0], [100, 100]]]]) == "Line", "open: a line")
        #expect(title([["type": "arrow", "x": 0, "y": 0, "width": 100, "height": 0, "points": [[0, 0], [100, 0]]]]) == "Arrow")
        #expect(title([["type": "freedraw", "x": 0, "y": 0, "width": 50, "height": 50, "points": [[0, 0], [50, 50]]]]) == "Freehand")
        #expect(title([["type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 60, "backgroundColor": "#a5d8ff"]]) == "Blue rectangle")
        #expect(title([["type": "ellipse", "x": 0, "y": 0, "width": 100, "height": 60, "strokeColor": "#e03131"]]) == "Red ellipse")
        #expect(title([["type": "ellipse", "x": 0, "y": 0, "width": 100, "height": 60, "strokeColor": "#2a1d10"]]) == "Ellipse", "ink isn't a detail")
        #expect(title((0..<3).map { ["type": "rectangle", "id": "r\($0)", "x": $0 * 120, "y": 0, "width": 100, "height": 60] }) == "3 rectangles")
        // The two triangles of a real library aren't both "Line" any more; named ones keep their names.
        let shapes = try #require(CanvasLibraryFile.items(from: Data(Self.basicShapesLibrary.utf8))).map(\.title)
        #expect(shapes == ["Right triangle", "Triangle"], "\(shapes)")
        #expect(try #require(CanvasLibraryFile.items(from: Data(Self.dataFlowLibrary.utf8))).map(\.title) == ["Process", "Data storage"])
        // Rename, kept with the library; an empty name gives it back its own.
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-rename-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let lib = CanvasLibrary(folder: dir)
        _ = lib.importLibrary(Data(Self.basicShapesLibrary.utf8), source: "Basic shapes")
        let first = try #require(lib.items.first)
        lib.rename(first.id, to: "  Ramp  ")
        #expect(lib.items.first?.title == "Ramp")
        lib.flush()
        #expect(CanvasLibrary(folder: dir).items.first?.title == "Ramp", "kept after a relaunch")
        lib.rename(first.id, to: " ")
        #expect(lib.items.first?.title == "Right triangle")
        // The popover: Rename… opens the name in place, filled with what it's called now.
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: lib), size: CGSize(width: CanvasLibraryPopover.width, height: 300))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("canvas.library.rename") == nil)
        canvas.renamingLibraryItem = first.id
        await ax.settle()
        let field = try #require(ax.find("canvas.library.rename"))
        #expect(field.text.contains("Right triangle"), "\(field.text)")
    }

    /// Past 12 items the popover has a search field; it filters by the item's name or its
    /// library's, and says so when nothing matches.
    @Test func theLibrarySearchFiltersByNameOnceThereAreMoreThan12() async throws {
        #expect(!CanvasLibraryGrid.showsSearch(12) && CanvasLibraryGrid.showsSearch(13))
        let lib = CanvasLibrary(folder: nil)
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8), source: "Data flow")
        for i in 0..<11 {
            lib.add(elements: [["type": "rectangle", "id": "r\(i)", "x": 0, "y": 0, "width": 100 + i, "height": 60]], name: "Box \(i)")
        }
        #expect(lib.items.count == 13)
        #expect(CanvasLibraryGrid(lib.items, query: "stor").items.map(\.title) == ["Data storage"])
        #expect(CanvasLibraryGrid(lib.items, query: "DATA FLOW").items.map(\.title) == ["Process", "Data storage"], "its library's name finds it too")
        #expect(CanvasLibraryGrid(lib.items, query: "box 1").items.map(\.title) == ["Box 10", "Box 1"])
        #expect(CanvasLibraryGrid(lib.items, query: "  ").items.count == 13, "nothing typed: everything")
        #expect(CanvasLibraryGrid(lib.items, query: "zebra").groups.isEmpty)
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: lib), size: CGSize(width: CanvasLibraryPopover.width, height: 480))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("canvas.library.search") != nil, "13 items: a search field, \(ax.ids())")
        lib.remove(lib.items[0].id)
        await ax.settle()
        #expect(ax.find("canvas.library.search") == nil, "12: none")
    }

    /// The arrow keys move through the grid as it shows (beside, and row by row across groups);
    /// Return adds the picked item, or the first match while searching.
    @Test func arrowKeysMoveThroughTheLibraryAndReturnAddsTheItem() throws {
        func item(_ name: String, _ source: String?) throws -> CanvasLibraryItem {
            try #require(CanvasLibraryItem(id: name, name: name, source: source, elements: [["type": "rectangle", "id": "r", "x": 0, "y": 0, "width": 10, "height": 10]]))
        }
        // Mine: a0 a1 a2 a3 / a4; then Kit: b0 b1 b2.
        let items = try (0..<5).map { try item("a\($0)", nil) } + (0..<3).map { try item("b\($0)", "Kit") }
        let grid = CanvasLibraryGrid(items, columns: 4)
        #expect(grid.moved(nil, .down) == "a0", "nothing picked: the first")
        #expect(grid.moved("a0", .left) == "a0" && grid.moved("a0", .right) == "a1")
        #expect(grid.moved("a3", .right) == "a4", "right runs on to the next row")
        #expect(grid.moved("a2", .down) == "a4", "down to the row below, its last tile when it's shorter")
        #expect(grid.moved("a4", .down) == "b0", "down into the next group")
        #expect(grid.moved("b2", .up) == "a4" && grid.moved("a1", .up) == "a1" && grid.moved("b1", .down) == "b1")
        #expect(grid.moved("a4", .up) == "a0")
        #expect(grid.chosen("b1", searching: false)?.id == "b1")
        #expect(grid.chosen(nil, searching: false) == nil, "Return with nothing picked adds nothing")
        let found = CanvasLibraryGrid(items, query: "b2")
        #expect(found.chosen(nil, searching: true)?.id == "b2", "searching: Return adds the first match")
        #expect(found.chosen("a0", searching: true)?.id == "b2", "a pick the search hid doesn't count")
    }

    /// The gap between what was just added and everything else on the board, in screen points,
    /// and where its middle is in the view.
    static func room(_ j: Joined, before: [String]) async throws -> (gap: Double, centre: CGPoint, fresh: Int) {
        let json = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, old = new Set(\(String(decoding: try JSONSerialization.data(withJSONObject: before), as: UTF8.self)));
          const box = (e) => { if (Array.isArray(e.points) && e.points.length) { const xs = e.points.map((p) => e.x + p[0]), ys = e.points.map((p) => e.y + p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; } return [e.x, e.y, e.x + e.width, e.y + e.height]; };
          const all = api.getSceneElements(), fresh = all.filter((e) => !old.has(e.id)).map(box), was = all.filter((e) => old.has(e.id)).map(box);
          const a = Math.min(...fresh.map((b) => b[0])), b = Math.min(...fresh.map((b) => b[1])), c = Math.max(...fresh.map((b) => b[2])), d = Math.max(...fresh.map((b) => b[3]));
          let gap = Infinity;
          for (const [x1, y1, x2, y2] of was) gap = Math.min(gap, Math.hypot(Math.max(x1 - c, a - x2, 0), Math.max(y1 - d, b - y2, 0)));
          return JSON.stringify({ gap: gap * z, centre: [((a + c) / 2 + s.scrollX) * z, ((b + d) / 2 + s.scrollY) * z], fresh: fresh.length }); })()
        """) as? String)
        let o = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        let c = o["centre"] as? [Double] ?? [0, 0]
        return ((o["gap"] as? Double) ?? 0, CGPoint(x: c[0], y: c[1]), (o["fresh"] as? Int) ?? 0)
    }

    /// A click in the library never squeezes the item into a tight gap: it keeps 48 pt from every
    /// shape, line and word, and goes in the roomiest empty part of the view (library council,
    /// round 6: "D1 Store" landed 25 pt above an arrowhead).
    @Test func aLibraryItemKeeps48PointsFromEverythingInTheRoomiestSpot() async throws {
        try await Self.withLibrary { lib in
            _ = try #require(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)))
            let store = try #require(lib.items.first { $0.name == "Data storage" })
            // The flowchart filling the view, as the judges had it.
            do {
                let j = try await Joined(scene: Self.flowchart)
                defer { j.close() }
                try await j.ready()
                _ = try await j.js("(() => { const api = amber._canvas.api; api.scrollToContent(api.getSceneElements(), { fitToContent: true, animate: false }); return 1; })()")
                try await Task.sleep(for: .milliseconds(200))
                let before = try await Self.ids(j)
                j.canvas.insert(store)
                for _ in 0..<100 where (try await Self.ids(j)).count < before.count + 4 { try await Task.sleep(for: .milliseconds(30)) }
                let r = try await Self.room(j, before: before)
                #expect(r.fresh == 4 && r.gap >= 47.5, "at least 48 pt from everything: \(r)")
            }
            // A tight gap in the middle (between two boxes) and the right half empty: it goes right.
            let j = try await Joined(scene: CanvasTests.scene([
                ["type": "rectangle", "id": "top", "x": 0, "y": 0, "width": 400, "height": 250],
                ["type": "rectangle", "id": "bottom", "x": 0, "y": 410, "width": 400, "height": 190],
                ["type": "arrow", "id": "link", "x": 200, "y": 250, "width": 0, "height": 160, "points": [[0, 0], [0, 160]]],
            ]))
            defer { j.close() }
            try await j.ready()
            _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { scrollX: 0, scrollY: 0, zoom: { value: 1 } } }); return 1; })()")
            try await Task.sleep(for: .milliseconds(100))
            let before = try await Self.ids(j)
            j.canvas.insert(store)
            for _ in 0..<100 where (try await Self.ids(j)).count < before.count + 4 { try await Task.sleep(for: .milliseconds(30)) }
            let r = try await Self.room(j, before: before)
            #expect(r.fresh == 4 && r.gap >= 100, "well clear of the drawing: \(r)")
            #expect(r.centre.x > 560 && r.centre.x < 900 && r.centre.y > 0 && r.centre.y < 600, "in the empty right half, in view: \(r.centre)")
        }
    }

    /// In dark mode a tile shows the item in the colours the dark canvas shows it in (the board
    /// draws it light and turns it): the same as a swatch in the style bar, see-through kept.
    @Test func aLibraryPictureShowsInTheDarkCanvasColours() throws {
        let w = 4, h = 2
        let ctx = try #require(CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                         bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        ctx.setFillColor(CGColor(srgbRed: 1, green: 0xec / 255.0, blue: 0x99 / 255.0, alpha: 1))  // the sticky yellow
        ctx.fill(CGRect(x: 0, y: 0, width: 2, height: h))
        let drawn = try #require(ctx.makeImage())
        let png = try #require(NSBitmapImageRep(cgImage: drawn).representation(using: .png, properties: [:]))
        let dark = try #require(CanvasLibrary.darkened(png)?.cgImage(forProposedRect: nil, context: nil, hints: nil))
        let rep = NSBitmapImageRep(cgImage: dark)
        let want = try #require(CanvasStyle.rgb("#ffec99"))
        let (r, g, b) = CanvasStyle.throughDark(want.0, want.1, want.2)
        // The bytes as stored (sRGB, as the board drew them), not converted on the way out.
        var yellow = [Int](repeating: 0, count: 4), clear = [Int](repeating: 0, count: 4)
        rep.getPixel(&yellow, atX: 0, y: 0)
        rep.getPixel(&clear, atX: 3, y: 0)
        let expected = [r, g, b].map { Int(($0 * 255).rounded()) }
        #expect(zip(yellow.prefix(3), expected).allSatisfy { abs($0 - $1) <= 2 } && yellow[3] == 255, "as the dark canvas shows #ffec99: \(yellow) for \(expected)")
        #expect(clear[3] == 0, "see-through stays see-through: \(clear)")
        // The library keeps both, and drops both with the item.
        let lib = CanvasLibrary(folder: nil)
        let item = try #require(lib.add(elements: [["type": "rectangle", "id": "r", "x": 0, "y": 0, "width": 10, "height": 10]]))
        lib.setThumbnail(png, for: item.id)
        #expect(lib.thumbnails[item.id] != nil && lib.darkThumbnails[item.id] != nil)
        lib.remove(item.id)
        #expect(lib.thumbnails[item.id] == nil && lib.darkThumbnails[item.id] == nil)
    }

    /// The Library button is in the toolbar (Image moved into the Shapes menu to make room); in a
    /// narrow window it's in More Tools.
    @Test func theLibraryIsInTheToolbarAndInMoreToolsWhenNarrow() async throws {
        let c = try Self.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            var labels = try MacWindowChromeTests.items(w).map(\.label)
            #expect(labels.contains(CanvasLibraryPopover.title) && !labels.contains(CanvasToolbarTools.imageTitle), "Library in the toolbar, Image in the Shapes menu: \(labels)")
            w.setContentSize(CGSize(width: 1000, height: 700))
            await MacWindowChromeTests.settle(w, 20)
            labels = try MacWindowChromeTests.items(w).map(\.label)
            #expect(!labels.contains(CanvasLibraryPopover.title) && labels.contains("More Tools"), "narrow: in More Tools: \(labels)")
        }
    }

    /// Nothing in a board's toolbar is ever clipped (round 12: at 1400 pt the board's items pushed
    /// into the list's side of the bar, its "…" over "All Notes"; at 1000 pt Share and More fell
    /// into AppKit's overflow). At the pictures' widths and 1400 to 710 pt, measured in the window:
    /// every item is whole and inside the window, none overlaps another, nothing is in the
    /// overflow, the board's items stay on its side of the bar, Share and More always show, every
    /// tool is in the bar or in a menu, and the list's title is clear of its buttons. Also with a
    /// long name, and in Full Screen.
    @Test func theBoardsToolbarNeverClips() async throws {
        let keptAIs = ConnectedAIs.shared.connections
        ConnectedAIs.shared.set([AskAITests.chatgpt])
        defer { ConnectedAIs.shared.set(keptAIs) }
        let c = try Self.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
            for (name, widths) in [("Publishing flow", [1400.0, 1280, 1100, 1000, 900, 760, 710]),
                                   ("Quarterly planning for the whole design team, with dates", [1400.0, 1100, 900, 760])] {
                if board.title != name { CanvasRename.renamed(board, to: name) }
                for width in widths {
                    w.setContentSize(CGSize(width: width, height: 800))
                    await MacWindowChromeTests.settle(w, 20)
                    try await Self.expectWholeToolbar(w, "\(Int(width)) pt, \(name.prefix(12))")
                }
            }
            // Full Screen: the board has the window; the bar starts after the window's buttons.
            CanvasRename.renamed(board, to: "Publishing flow")
            @MainActor func press(_ id: String) async throws {
                let e = try #require(await MacEmptyDetailTests.waitForElement(id, in: w) ?? MacEmptyDetailTests.element(id, in: w), "no \(id)")
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 15)
            }
            w.setContentSize(CGSize(width: 1400, height: 800))
            await MacWindowChromeTests.settle(w, 15)
            try await press("note.fullScreen")
            #expect(try Self.collapsed(w) == [true, true], "Full Screen")
            for width in [1400.0, 760] {
                w.setContentSize(CGSize(width: width, height: 800))
                await MacWindowChromeTests.settle(w, 20)
                try await Self.expectWholeToolbar(w, "Full Screen, \(Int(width)) pt", focus: true)
            }
            try await press("canvas.back")
        }
    }

    /// The window's toolbar, measured: see theBoardsToolbarNeverClips.
    static func expectWholeToolbar(_ w: NSWindow, _ at: String, focus: Bool = false) async throws {
        let items = w.toolbar?.items ?? []
        let width = w.frame.width
        var shown: [(label: String, frame: CGRect, board: Bool)] = []
        var board = focus
        for item in items {
            if item.itemIdentifier.rawValue.hasSuffix("splitViewSeparator-1") { board = true }
            guard !item.isHidden, let v = item.view else { continue }
            #expect(v.window != nil, "\(at): \(item.label.isEmpty ? "an item" : item.label) is in the overflow, not the bar")
            guard v.window != nil else { continue }
            let f = v.convert(v.bounds, to: nil)
            #expect(f.minX >= -0.5 && f.maxX <= width + 0.5, "\(at): \(item.label) runs out of the window: \(f)")
            #expect(!v.isHiddenOrHasHiddenAncestor && v.alphaValue > 0.5, "\(at): \(item.label) is hidden")
            if f.width > 2 { shown.append((item.label, f, board)) }
        }
        // Nothing in AppKit's overflow (its "»").
        @MainActor func overflow(_ v: NSView) -> Bool {
            if String(describing: type(of: v)).contains("ClippedItemsIndicator"), !v.isHiddenOrHasHiddenAncestor, v.frame.width > 0 { return true }
            return v.subviews.contains { overflow($0) }
        }
        if let frame = w.contentView?.superview { #expect(!overflow(frame), "\(at): the toolbar has an overflow menu") }
        let sorted = shown.sorted { $0.frame.minX < $1.frame.minX }
        for (a, b) in zip(sorted, sorted.dropFirst()) {
            #expect(a.frame.maxX <= b.frame.minX + 0.5, "\(at): \(a.label) overlaps \(b.label): \(a.frame) \(b.frame)")
        }
        // The board's items on its side of the bar: after the list's own, in the board's column.
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let column = try #require(split.arrangedSubviews.last).convert(split.arrangedSubviews.last!.bounds, to: nil)
        let listEnd = shown.filter { !$0.board }.map(\.frame.maxX).max() ?? 0
        for item in shown where item.board {
            #expect(item.frame.minX >= max(column.minX, listEnd) - 0.5, "\(at): \(item.label) stands over the list: \(item.frame.minX) < \(max(column.minX, listEnd))")
        }
        let labels = Set(shown.filter(\.board).map(\.label))
        #expect(labels.contains("Share") && labels.contains("More"), "\(at): Share and More show: \(labels.sorted())")
        #expect(labels.contains(BoardCommentUI.title), "\(at): Comments shows")
        // One Comments button: no Comment tool beside it (round 12, two near-identical bubbles).
        let boardLabels = shown.filter(\.board).map(\.label)
        #expect(boardLabels.filter { $0 == BoardCommentUI.title }.count == 1 && !boardLabels.contains(CanvasTool.comment.title) && !boardLabels.contains(BoardCommentUI.comment),
                "\(at): one Comments button: \(boardLabels)")
        // Every tool in the bar or in a menu: the step the bar shows is the one whose tools these are.
        typealias T = CanvasToolbarTools
        let tools = Set(CanvasTool.allCases.filter { labels.contains($0.title) })
        let fit = labels.contains("Tools") ? T.Fit.narrowest : T.Fit.allCases.first { Set($0.shown) == tools && ($0.showsLibrary == labels.contains(CanvasLibraryPopover.title)) }
        let step = try #require(fit, "\(at): the bar's tools \(tools.map(\.title).sorted()) are no step's")
        #expect(step == .narrowest || labels.contains("Shapes"), "\(at): the shapes' button")
        #expect(step.inMore.isEmpty || labels.contains("More Tools") || labels.contains("Tools"), "\(at): More Tools holds \(step.inMore)")
        #expect(step.showsLibrary || labels.contains("More Tools") || labels.contains("Tools"), "\(at): the library is in More Tools")
        #expect(labels.contains { $0.hasSuffix("Full Screen") } || labels.contains("More Tools") || labels.contains("Tools"), "\(at): Full Screen in the bar or More Tools")
        #expect(labels.contains { $0.hasPrefix("Ask ") } || NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: false, appsEnabled: true, shared: false, asks: true, canvas: true).joined().contains(.askAI),
                "\(at): Ask AI in the bar or in More")
        print("toolbar at \(at): \(step) " + sorted.map { "\($0.label.isEmpty ? "(blank)" : $0.label) \(Int($0.frame.minX))-\(Int($0.frame.maxX))" }.joined(separator: ", "))
        // The list's title is clear of its buttons (round 11: its "…" sat on "All Notes").
        if !focus, let title = await MacEmptyDetailTests.waitForElement("list.folderName", in: w),
           let screen = title.value(forKey: "accessibilityFrame") as? NSRect, screen.width > 0 {
            let f = w.convertFromScreen(screen)
            for item in shown where !item.board && ["More", "New Note"].contains(item.label) {
                #expect(!f.intersects(item.frame), "\(at): the list's title \(f) is under \(item.label) \(item.frame)")
            }
        }
    }

    // MARK: Focus and the sidebar steps

    /// Full Screen is yours to enter: it folds the columns and puts them back as they were.
    @Test func fullScreenPutsTheColumnsBackAsTheyWere() {
        var f = FullScreen()
        #expect(f.leave() == nil, "not on: nothing to put back")
        #expect(f.enter(from: .all) == .detailOnly)
        #expect(f.isOn)
        #expect(f.enter(from: .detailOnly) == nil, "on already")
        #expect(f.leave() == .all)
        #expect(!f.isOn)
        #expect(f.enter(from: .doubleColumn) == .detailOnly)
        #expect(f.leave() == .doubleColumn, "list and note, as they were")
        _ = f.enter(from: .all)
        f.userChanged()
        #expect(!f.isOn && f.leave() == nil, "the sidebar button takes over")
    }

    /// The templates: each a whole drawing whose arrows join shapes in it, with a picture that
    /// exists; they show only while nothing is drawn and no drawing tool is picked.
    @Test func theWhiteboardTemplatesAreWhole() {
        for t in WhiteboardTemplate.allCases {
            let ids = t.elements.compactMap { $0["id"] as? String }
            #expect(Set(ids).count == ids.count, "\(t): ids are unique")
            for e in t.elements where ["arrow", "line"].contains(e["type"] as? String) {
                for end in ["start", "end"] {
                    let id = (e[end] as? [String: Any])?["id"] as? String
                    #expect(id.map(ids.contains) == true, "\(t): an arrow's \(end) is a shape in it")
                }
            }
            #expect(NSImage(systemSymbolName: t.symbol, accessibilityDescription: nil) != nil, "\(t.symbol) exists")
            #expect(CanvasCommand.insert(t).payload["op"] as? String == "insert")
            // Every one has a title and a line on how to use it, and is small enough to open near
            // full size (round 1 of the whiteboard council: some had titles, some opened at 60%).
            let texts = t.elements.filter { $0["type"] as? String == "text" }.compactMap { $0["text"] as? String }
            #expect(texts.first == t.title, "\(t): its title first: \(texts)")
            // Named by you, it carries your board's name; the default name leaves the template's.
            let named = t.elements(titled: "Product launch").compactMap { $0["text"] as? String }
            #expect(named.first == "Product launch" && t.elements(titled: CanvasNote.title).compactMap { $0["text"] as? String }.first == t.title)
            #expect(!texts.contains { $0.contains("\u{2610}") }, "\(t): no box character that looks tickable and isn't")
            if t == .mindMap {
                // Branches are joined arrows with no heads, ending at each box's edge (round 2, 03).
                let branches = t.elements.filter { $0["type"] as? String == "arrow" }
                #expect(!branches.isEmpty && branches.allSatisfy { $0["endArrowhead"] is NSNull })
                let boxes = Dictionary(uniqueKeysWithValues: t.elements.compactMap { e -> (String, CGRect)? in
                    guard let id = e["id"] as? String, let x = e["x"] as? Double, let y = e["y"] as? Double, let w = e["width"] as? Double, let h = e["height"] as? Double else { return nil }
                    return (id, CGRect(x: x, y: y, width: w, height: h))
                })
                for b in branches {
                    let to = try? #require(((b["end"] as? [String: Any])?["id"] as? String).flatMap { boxes[$0] })
                    let pts = b["points"] as? [[Double]] ?? []
                    let end = CGPoint(x: (b["x"] as? Double ?? 0) + (pts.last?[0] ?? 0), y: (b["y"] as? Double ?? 0) + (pts.last?[1] ?? 0))
                    #expect(to.map { !$0.insetBy(dx: 1, dy: 1).contains(end) } == true, "a branch stops at its box's edge: \(end) \(String(describing: to))")
                }
            }
            let frames = t.outline.map(\.frame)
            let width = (frames.map(\.maxX).max() ?? 0) - (frames.map(\.minX).min() ?? 0)
            #expect(width <= 760, "\(t) is \(Int(width)) wide")
        }
        var s = CanvasState()
        #expect(!CanvasStart.shows(s), "not before the page has said it's empty")
        s.empty = true
        #expect(CanvasStart.shows(s))
        s.tool = .freedraw
        #expect(!CanvasStart.shows(s), "a drawing tool picked: you're drawing")
        s.tool = .selection; s.busy = true
        #expect(!CanvasStart.shows(s))
    }

    /// An empty whiteboard's last line asks your AI to draw (whiteboard council, round 1): the
    /// questions are about drawing on this board, by its name, and your own line says "draw this".
    @Test func anEmptyWhiteboardAsksYourAIToDraw() {
        let board = AskAI.Subject.whiteboard(.init(title: "Launch plan", folder: "Work"))
        let qs = AskAI.questions(board)
        #expect(qs.count == 3)
        #expect(qs.allSatisfy { $0.prompt.hasPrefix("In Pinto Notes, open my whiteboard \u{201C}Launch plan\u{201D} in \u{201C}Work\u{201D} (an Excalidraw scene)") }, "\(qs.map(\.prompt))")
        #expect(AskAI.own("a timeline of the launch", board) == "In Pinto Notes, open my whiteboard \u{201C}Launch plan\u{201D} in \u{201C}Work\u{201D} (an Excalidraw scene) and draw this on it: a timeline of the launch")
        #expect(AskAI.ownPlaceholder(board) == "Describe what to draw")
        #expect(AskAI.ownPlaceholder(.note(.init(title: "x"))) == AskAI.ownPlaceholder)
        #expect(board.menuName == "This Whiteboard")
        #expect(CanvasStart.askTitle(.init(ai: "ChatGPT")) == "Ask ChatGPT to draw it\u{2026}")
    }

    /// A board's row in the list shows its words and a small picture of it, and search finds its
    /// words (whiteboard council, round 1: "No additional text" under a whole flowchart).
    @Test func aBoardsWordsShowInTheListAndSearchFindsThem() throws {
        let sketch = CanvasSketch(elements: [
            ["type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 50, "label": ["text": "Start"], "backgroundColor": "#b2f2bb"],
            ["type": "text", "x": 0, "y": 80, "text": "Did it\nwork?", "originalText": "Did it work?"],
            ["type": "text", "x": 0, "y": 120, "text": "Start"],
            ["type": "text", "x": 0, "y": 160, "text": "Gone", "isDeleted": true],
            ["type": "arrow", "x": 50, "y": 50, "width": 0, "height": 30, "points": [[0, 0], [0, 30]]],
            ["type": "freedraw", "x": 10, "y": 10, "width": 20, "height": 5, "points": [[0, 0], [10, 5], [20, 0]]],
        ])
        #expect(sketch.preview == "Start \u{00B7} Did it work?", "each word once, in the order drawn, none deleted")
        #expect(sketch.shapes.map(\.kind) == ["rectangle", "arrow", "freedraw"])
        #expect(sketch.shapes[0].fill == "#b2f2bb" && sketch.shapes[2].points.count == 3)
        #expect(CanvasSketch(elements: []).preview == nil)
        #expect(CanvasSketch(elements: [["type": "freedraw", "x": 0, "y": 0, "width": 9, "height": 9]]).preview == "Drawing")
        #expect(CanvasSketch(elements: WhiteboardTemplate.kanban.elements).preview?.hasPrefix("To do \u{00B7} Write the brief") == true, "the title and how-to line left out: \(CanvasSketch(elements: WhiteboardTemplate.kanban.elements).preview ?? "")")
        #expect(NoteRow.boardPreview(nil) == "Empty whiteboard" && NoteRow.boardPreview(CanvasSketch(elements: [])) == "Empty whiteboard")

        let c = try Self.canvasLibrary()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": "Quarterly roadmap"]])], "collections": [String: Any]()])
        #expect(CanvasSketch.of(note.id)?.preview == "Quarterly roadmap")
        #expect(CanvasSketch.notes(holding: "roadmap").contains(note.id), "search finds a word on the board")
        #expect(!CanvasSketch.notes(holding: "zebra").contains(note.id))
        // A change to the board is read again.
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": "Hiring plan"]])], "collections": [String: Any]()])
        #expect(CanvasSketch.of(note.id)?.preview == "Hiring plan")
    }

    /// A whiteboard's row follows the board: the list watches one signal that moves a moment
    /// after a burst of changes, not every stroke (whiteboard council, round 2, 12-ai-drew).
    @Test func aBoardsRowIsToldWhenTheBoardChanges() async throws {
        let store = NotePageDataStore(file: nil)
        let id = UUID()
        let scene = { (t: String) -> NotePageData.Doc in ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": t]])], "collections": [String: Any]()] }
        final class Told: @unchecked Sendable { var n = 0 }
        let t = Told()
        var told: Int { t.n }
        let watch = { withObservationTracking { _ = NoteRow.sketch(id, in: store) } onChange: { t.n += 1 } }
        watch()
        let start = store.listRevision
        for t in ["A", "AB", "ABC"] { store.set(id, scene(t)) }
        #expect(store.listRevision == start, "not on every stroke")
        for _ in 0..<40 where told == 0 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(store.listRevision == start + 1 && told == 1, "once, for the burst")
        #expect(NoteRow.sketch(id, in: store)?.preview == "ABC")
        store.pushed(id, try #require(store.peek(id)))
        watch()
        store.take(id, server: NotePageData.encode(scene("From ChatGPT")), by: "ChatGPT")
        for _ in 0..<40 where told == 1 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(told == 2 && NoteRow.sketch(id, in: store)?.preview == "From ChatGPT", "and when an AI's drawing arrives")
    }

    /// Naming a canvas: one line, trimmed; empty or unchanged leaves it (13 November 2026).
    @Test func aCanvasIsRenamedFromItsTitleField() throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        #expect(note.title == CanvasNote.title)
        #expect(CanvasTitleField.renamed(note, to: "  Launch plan\nv2 ") == "Launch plan v2")
        #expect(note.body == "Launch plan v2" && note.dirty)
        #expect(CanvasTitleField.renamed(note, to: "   ") == nil, "empty keeps the name")
        #expect(CanvasTitleField.renamed(note, to: "Launch plan v2") == nil, "unchanged: nothing to save")
        #expect(note.title == "Launch plan v2")
        // A template on a board still called Whiteboard names it; a board with a name keeps it.
        let fresh = CanvasNote.make(in: .all, context: c.mainContext)
        let canvas = CanvasController()
        canvas.title = fresh.title
        canvas.rename = { _ = CanvasTitleField.renamed(fresh, to: $0) }
        canvas.insert(.retro)
        #expect(fresh.title == "Retro" && canvas.title == "Retro")
        canvas.insert(.kanban)
        #expect(fresh.title == "Retro", "named now: kept")
    }

    /// A board's name cut short in a narrow column ends in "…", not mid-letter (round 12: the
    /// field clipped it, "Product laun"). Read from the pixels: the last ink is the ellipsis's dots,
    /// on the baseline, not the top of a cut letter. A short name is whole.
    @Test func aLongBoardNameEndsInAnEllipsis() async throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        /// The rows the name's ink covers, overall and in its last 3 pt.
        @MainActor func ink(_ name: String, width: CGFloat) async throws -> (all: ClosedRange<Int>, last: ClosedRange<Int>, right: Int) {
            note.body = name
            let ax = OffscreenAX(CanvasTitleField(note: note, maxWidth: width).modelContainer(c), size: CGSize(width: width + 40, height: 30))
            defer { ax.close() }
            await ax.settle()
            // Shown, not being renamed (a bare window hands its one field the first responder).
            ax.window.makeFirstResponder(nil)
            await ax.settle()
            let root = try #require(ax.window.contentView)
            let rep = try #require(root.bitmapImageRepForCachingDisplay(in: root.bounds))
            root.cacheDisplay(in: root.bounds, to: rep)
            let scale = CGFloat(rep.pixelsWide) / root.bounds.width
            var dark: [(x: Int, y: Int)] = []
            for y in 0..<rep.pixelsHigh {
                for x in 0..<rep.pixelsWide {
                    if let p = rep.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB), p.alphaComponent > 0.5, p.redComponent + p.greenComponent + p.blueComponent < 1.2 { dark.append((x, y)) }
                }
            }
            let right = try #require(dark.map(\.x).max(), "the name drew")
            let last = dark.filter { $0.x > right - Int(3 * scale) }
            return (dark.map(\.y).min()!...dark.map(\.y).max()!, last.map(\.y).min()!...last.map(\.y).max()!, Int(CGFloat(right) / scale))
        }
        let long = try await ink("Quarterly planning for the whole design team", width: CanvasToolbarTools.titleMin)
        let middle = long.all.lowerBound + (long.all.upperBound - long.all.lowerBound) / 2
        #expect(long.last.lowerBound > middle, "the last ink is low, the ellipsis's dots: \(long)")
        #expect(long.right <= Int(CanvasToolbarTools.titleMin), "inside the field: \(long)")
        let short = try await ink("Plan B", width: CanvasToolbarTools.titleMin)
        #expect(short.last.lowerBound <= short.all.lowerBound + 2, "a short name ends in its whole last letter: \(short)")
    }

    static func canvasLibrary() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Publishing flow"
        note.updatedAt = .now.addingTimeInterval(-30)
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene(Self.box)], "collections": [String: Any]()])
        try c.mainContext.save()
        return c
    }

    static func collapsed(_ w: NSWindow) throws -> [Bool] {
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let controller = try #require(split.delegate as? NSSplitViewController)
        return controller.splitViewItems.prefix(2).map(\.isCollapsed)
    }

    /// A canvas opens with the columns as they are (Emil, 13 November 2026: it went full screen
    /// by itself). The sidebar button hides the folders in one click, as in Notes; Full Screen
    /// folds both and puts them back.
    @Test func aCanvasKeepsTheColumnsUntilYouGoFullScreen() async throws {
        let c = try Self.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            #expect(try Self.collapsed(w) == [false, false], "the canvas leaves the columns open")
            // The tools are in the window's toolbar, where a note's are, then Full Screen, Share and More.
            let labels = try MacWindowChromeTests.items(w).map(\.label)
            // At 1280 with both columns, the compact set: the rest under More Tools.
            for l in ["Select", "Pencil", "Shapes", "Arrow", "Text", "More Tools", "Full Screen", "Share"] {
                #expect(labels.contains(l), "\(l) in the toolbar: \(labels)")
            }
            // Its name, as a field you can type in, beside where it is.
            @MainActor func fields(_ v: NSView) -> [NSTextField] { (v as? NSTextField).map { [$0] } ?? [] + v.subviews.flatMap(fields) }
            let all = [w.contentView?.superview].compactMap { $0 }.flatMap(fields)
            #expect(all.contains { $0.isEditable && $0.stringValue == "Publishing flow" }, "the name field: \(all.map(\.stringValue))")
            @MainActor func press(_ id: String) async throws {
                let found = await MacEmptyDetailTests.waitForElement(id, in: w)
                let direct = MacEmptyDetailTests.element(id, in: w)
                let e = try #require(found ?? direct, "no \(id)")
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 12)
            }
            try await press("sidebar.toggle")
            #expect(try Self.collapsed(w) == [true, false], "one click: the folders")
            try await press("note.fullScreen")
            #expect(try Self.collapsed(w) == [true, true], "Full Screen: the canvas alone")
            try await press("note.fullScreen")
            #expect(try Self.collapsed(w) == [true, false], "and back as they were")
        }
    }

    /// Drawing in the app as it ships (13 November 2026, "it gets laggier and laggier"): each stroke
    /// is saved once, the save isn't pushed back to the page that made it, and neither a stroke nor
    /// dragging a shape redraws the note pane on every move.
    /// Before: two saves a stroke (the page merged its own save back in and saved again), each one
    /// sent back to the page a second time, and the note pane redrawn on every move of a drag.
    @Test func strokesSaveOnceAndDontRedrawTheNotePane() async throws {
        let c = try Self.canvasLibrary()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            var found: WKWebView?
            for _ in 0..<100 where found == nil {
                found = NotePageLive.view(note.id)
                if found == nil { await MacWindowChromeTests.settle(w, 1) }
            }
            let web = try #require(found, "the canvas opened")
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
            _ = try await web.evaluateJavaScript("""
            amber.__lag = \(CanvasTests.lagKit);
            window.__saves = 0; window.__heard = 0;
            const set = amber.store.set; amber.store.set = (k, v) => { __saves++; return set(k, v); };
            amber.onChange(() => { __heard++; });
            window.__heard = 0; 1
            """)
            await MacWindowChromeTests.settle(w, 5)
            RenderProbe.begin(in: c.mainContext)
            defer { RenderProbe.end(in: c.mainContext) }
            let strokes = 4
            for s in 0..<strokes {
                _ = try await web.callAsyncJavaScript("return await amber.__lag.stroke(40, \(300 + s * 60))", contentWorld: .page)
                await MacWindowChromeTests.settle(w, 8)
            }
            let saves = try await web.evaluateJavaScript("__saves") as? Int ?? -1
            let heard = try await web.evaluateJavaScript("__heard") as? Int ?? -1
            let strokeRenders = RenderProbe.values(in: c.mainContext)["NoteDetailView"] ?? 0
            #expect(saves == strokes, "one save a stroke: \(saves) for \(strokes)")
            #expect(heard == strokes, "the page hears of each save once, by the store's reply, not again by a push: \(heard)")
            #expect(strokeRenders <= 2, "\(strokes) strokes of 40 moves redraw the note pane at most twice (Undo turning on): \(strokeRenders)")

            // A drag of the selected box, as the page reports it: its bounds on every move. The bar over
            // the selection follows; the note pane stays. (The engine moves a drag on animation frames,
            // which an offscreen page doesn't get, so the page's reports stand in for the drag.)
            let canvas = try #require((web as? NotePageWebView)?.canvas)
            RenderProbe.begin(in: c.mainContext)
            for k in 0..<30 {
                canvas.receive(["tool": "selection", "selection": ["rectangle"], "busy": k < 29, "canUndo": true,
                                "bounds": ["x": 100 + k * 2, "y": 120 + k, "width": 200, "height": 100],
                                "style": [String: Any](), "zoom": 1, "background": "#ffffff"])
                await MacWindowChromeTests.settle(w, 1)
            }
            let dragRenders = RenderProbe.values(in: c.mainContext)["NoteDetailView"] ?? 0
            #expect(canvas.state.bounds?.minX == 158, "the controller has the last move")
            #expect(dragRenders <= 2, "a drag of 30 moves redraws the note pane at most twice: \(dragRenders)")
            print("PERF canvas app strokes=\(strokes) saves=\(saves) heard=\(heard) noteDetailRenders stroke=\(strokeRenders) drag=\(dragRenders)")
        }
    }

    /// What a shared retro's page gets from the board (BoardPicture: the picture, made for the
    /// page, and its .excalidraw file), and what Export makes of it, for the share page's pictures.
    /// Made only when SHARE_PAGE_PICTURE is set (TEST_RUNNER_SHARE_PAGE_PICTURE=dir).
    @Test func sharedRetroPictureForThePage() async throws {
        guard let path = ProcessInfo.processInfo.environment["SHARE_PAGE_PICTURE"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let j = try await Joined(scene: CanvasTests.scene([]), size: CGSize(width: 1200, height: 900))
        defer { j.close() }
        try await j.ready()
        let name = "Product launch"
        j.canvas.send(.insert(.retro, title: name))
        await j.until("the retro is in") { !j.canvas.state.empty }
        // The whole retro in view, as on a Mac window, so each sticky has room under its card.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { zoom: { value: 0.5 } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(150))
        _ = try await j.js("(() => { const api = amber._canvas.api; api.scrollToContent(api.getSceneElements(), { fitToContent: false }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        // Sticky notes under the cards, as people add them on a retro: pick the card, press S, type.
        // One in each lane, then a second in the first (its lane grows to hold it).
        for (under, words) in [("Shipped on time", "Demo went well"), ("Too many meetings", "Standups run long"), ("Demo every Friday", "Ask design to join planning"), ("Demo went well", "Calm launch day")] {
            _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === \(String(reflecting: under))); const c = t && (all.find((e) => e.id === t.containerId) || t); if (c) api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); return 1; })()")
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.send(.sticky)
            await j.until("the sticky is typed into") { j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(150))
            _ = try await j.js("(() => { const t = document.querySelector('textarea'); if (t) { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); } return 1; })()")
            await j.until("the sticky is written") { !j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(100))
        }
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(300))
        try #require(await j.canvas.export(.png, light: true, page: name)).write(to: dir.appending(path: "board-page.png"))
        try #require(await j.canvas.export(.excalidraw, page: name)).write(to: dir.appending(path: "board-page.excalidraw"))
        try #require(await j.canvas.export(.png)).write(to: dir.appending(path: "board-export.png"))
    }

    // MARK: Your templates (both judges, round 8)

    /// Save as Template… keeps the whole board: its shapes, words and joins, the how-to line, and
    /// its pictures, under the name asked for. An empty board has nothing to keep, and says so.
    @Test func aBoardIsSavedAsATemplateWithItsElementsHintAndPictures() async throws {
        let templates = WhiteboardTemplates(folder: nil)
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        #expect(await j.canvas.saveAsTemplate(named: "Nothing", templates) == nil, "an empty board: nothing saved")
        #expect(templates.items.isEmpty && j.canvas.notice?.hasPrefix("Draw something") == true, "\(j.canvas.notice ?? "")")
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        let picture = try #require(CanvasImage(data: Self.png(width: 120, height: 80, clear: false)))
        j.canvas.send(.image(picture, at: nil))
        await j.until("the picture is in") { j.canvas.state.selection == ["image"] }
        let onBoard = try #require(try await j.js("amber._canvas.api.getSceneElements().length") as? Int)
        let item = try #require(await j.canvas.saveAsTemplate(named: "  Release check  ", templates))
        #expect(templates.items.map(\.id) == [item.id])
        #expect(item.name == "Release check", "the name asked for, trimmed: \(item.name ?? "nil")")
        #expect(j.canvas.notice == CanvasController.templateSavedTitle)
        let els = item.elements
        #expect(els.count == onBoard, "every element on the board: \(els.count) of \(onBoard)")
        #expect(els.contains { ($0["customData"] as? [String: Any])?["pintoHint"] as? Bool == true }, "the how-to line is kept")
        #expect(els.filter { $0["type"] as? String == "arrow" && $0["startBinding"] is [String: Any] && $0["endBinding"] is [String: Any] }.count == 5, "the arrows stay joined")
        let image = try #require(els.first { $0["type"] as? String == "image" })
        let fileId = try #require(image["fileId"] as? String)
        #expect((item.files[fileId] as? [String: Any])?["dataURL"] as? String == picture.dataURL, "the picture itself is kept")
        // A board saved with no name given takes the board's.
        j.canvas.title = "Launch board"
        let named = try #require(await j.canvas.saveAsTemplate(named: "", templates))
        #expect(named.name == "Launch board" && templates.items.first?.id == named.id, "newest first")
        let saved = String(decoding: try JSONSerialization.data(withJSONObject: j.rig.doc), as: UTF8.self)
        #expect(!saved.contains("excalidrawlib"), "nothing of it in the board's file")
    }

    /// Right-click a frame, Save as Template…: it asks for a name, and keeps the frame with all
    /// that's in it, nothing else (round 15: Save as Template was only in the More menu). With
    /// nothing selected the menu's Save as Template… keeps the whole board, as the More menu's does.
    @Test func aFrameIsSavedAsATemplateFromTheRightClickMenu() async throws {
        let templates = WhiteboardTemplates(folder: nil)
        func box(_ id: String, x: Double) -> [String: Any] {
            ["type": "rectangle", "id": id, "x": x, "y": 60, "width": 120, "height": 70, "strokeColor": "#2a1d10", "backgroundColor": "#ffec99"]
        }
        let j = try await Joined(scene: CanvasTests.scene([box("in1", x: 30), box("in2", x: 220), box("out", x: 900),
                                                           ["type": "frame", "id": "f1", "children": ["in1", "in2"], "name": "Launch"]]))
        defer { j.close() }
        try await j.ready()
        let web = try #require(j.web as? NotePageWebView)
        // Nothing selected: the whole board.
        let whole = try #require(web.canvasMenu().items.first { $0.title == NoteMoreMenu.saveTemplateTitle }, "in the right-click menu")
        #expect(whole.isEnabled)
        web.canvasMenu().performActionForItem(at: web.canvasMenu().items.firstIndex { $0.title == NoteMoreMenu.saveTemplateTitle }!)
        #expect(j.canvas.namingTemplate == .board, "asks for the name, for the whole board")
        j.canvas.namingTemplate = nil
        // The frame selected: it and what's in it.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { f1: true } } }); return 1; })()")
        await j.until("the frame selected") { j.canvas.state.inFrame }
        let menu = web.canvasMenu()
        menu.performActionForItem(at: try #require(menu.items.firstIndex { $0.title == NoteMoreMenu.saveTemplateTitle }))
        #expect(j.canvas.namingTemplate == .selection, "asks for the name, for what's selected")
        let item = try #require(await j.canvas.saveAsTemplate(named: "Launch frame", selection: true, templates))
        #expect(Set(item.elements.compactMap { $0["id"] as? String }) == ["f1", "in1", "in2"], "the frame and all in it: \(item.elements.compactMap { $0["id"] as? String })")
        #expect(item.name == "Launch frame" && j.canvas.notice == CanvasController.templateSavedTitle)
        #expect(item.elements.allSatisfy { e in (e["frameId"] as? String).map { $0 == "f1" } ?? true }, "still in their frame")
        // Nothing selected and asked for the selection: it says so.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        await j.until("nothing selected") { j.canvas.state.selection.isEmpty }
        #expect(await j.canvas.saveAsTemplate(named: "None", selection: true, templates) == nil)
        #expect(j.canvas.notice == "Select something to save it as a template")
        // The selection bar's More has it too.
        let source = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views/CanvasControls.swift"), encoding: .utf8)
        #expect(source.contains("canvas.askTemplateName(.selection)"))
    }

    // MARK: Templates that grow (round 15)

    /// A timeline's line is plain, its last stretch too: an arrowhead there ran into the last dot
    /// (rounds 13 and 14, 31-template-timeline). Its dots and steps are marked, so Add Step can
    /// make the next; its how-to line says Tab.
    @Test func theTimelinesLineEndsAtItsLastDotWithoutAHead() {
        let els = WhiteboardTemplate.timeline.elements
        let line = els.filter { e in e["type"] as? String == "arrow" && ((e["start"] as? [String: Any])?["id"] as? String)?.hasPrefix("dot") == true
            && ((e["end"] as? [String: Any])?["id"] as? String)?.hasPrefix("dot") == true }
        #expect(line.count == 4)
        #expect(line.allSatisfy { $0["endArrowhead"] is NSNull && $0["startArrowhead"] is NSNull }, "no heads on the line")
        #expect(els.filter { ($0["customData"] as? [String: Any])?["pintoStep"] as? String == "dot" }.count == 5)
        #expect(els.filter { ($0["customData"] as? [String: Any])?["pintoStep"] as? String == "step" }.count == 5)
        #expect(WhiteboardTemplate.timeline.hint.contains("press Tab"), "\(WhiteboardTemplate.timeline.hint)")
        for t in [WhiteboardTemplate.kanban, .retro] {
            #expect(t.elements.filter { ($0["customData"] as? [String: Any])?["pintoColumn"] as? Bool == true }.count == 3, "\(t)")
            #expect(t.hint.contains("Tab to add a column"), "\(t.hint)")
        }
    }

    /// Add Step: a step selected on a timeline, Tab (or Add Step on its bar, or in the right-click
    /// menu) adds the next one at its end: a dot the same distance on, joined to the last by the
    /// line, and a box on the other side from the last one, in the colour of the one before it
    /// there, joined to its dot, typed into at once. One Undo takes it back (round 15, Opus #5:
    /// "FigJam users add a step to a timeline with one key or one plus button").
    @Test func tabAddsATimelinesNextStep() async throws {
        let j = try await Joined(size: CGSize(width: 1100, height: 760))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.timeline, title: "Launch"))
        await j.until("the timeline is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        func all() async throws -> [[String: Any]] {
            let json = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements())") as? String ?? "[]"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] ?? []
        }
        func num(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        func part(_ e: [String: Any]) -> String? { (e["customData"] as? [String: Any])?["pintoStep"] as? String }
        var els = try await all()
        let dots = els.filter { part($0) == "dot" }.sorted { num($0, "x") < num($1, "x") }
        let steps = els.filter { part($0) == "step" }.sorted { num($0, "x") < num($1, "x") }
        #expect(dots.count == 5 && steps.count == 5)
        // The second step (Research) selected: the bar offers Add Step.
        let research = try #require(steps[1]["id"] as? String)
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(research)': true } } }); return 1; })()")
        await j.until("Add Step offered") { j.canvas.state.grows == .step }
        let web = try #require(j.web as? NotePageWebView)
        #expect(web.canvasMenu().items.first?.title == "Add Step", "first in the right-click menu")
        let before = els.count
        _ = try await j.js("(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("typing in the new step") { j.canvas.state.editing }
        els = try await all()
        let newDots = els.filter { part($0) == "dot" }.sorted { num($0, "x") < num($1, "x") }
        let newSteps = els.filter { part($0) == "step" }.sorted { num($0, "x") < num($1, "x") }
        #expect(newDots.count == 6 && newSteps.count == 6, "\(newDots.count) dots, \(newSteps.count) steps")
        let dot = try #require(newDots.last), step = try #require(newSteps.last)
        let spacing = num(dots[4], "x") - num(dots[3], "x")
        #expect(abs(num(dot, "x") - num(dots[4], "x") - spacing) < 0.5 && abs(num(dot, "y") - num(dots[4], "y")) < 0.5, "a dot the same distance on")
        // Launch is above the line: the new step goes below, where Beta is, in Beta's colour.
        #expect(abs(num(step, "y") - num(steps[3], "y")) < 0.5, "on the other side, level with the one before there")
        #expect(step["backgroundColor"] as? String == steps[3]["backgroundColor"] as? String, "in its colour")
        #expect(abs((num(step, "x") + num(step, "width") / 2) - (num(dot, "x") + num(dot, "width") / 2)) < 0.5, "over its dot")
        let lastID = try #require(dots[4]["id"] as? String), dotID = try #require(dot["id"] as? String), stepID = try #require(step["id"] as? String)
        func joined(_ a: String, _ b: String) -> [String: Any]? {
            els.first { e in e["type"] as? String == "arrow" && Set([(e["startBinding"] as? [String: Any])?["elementId"] as? String, (e["endBinding"] as? [String: Any])?["elementId"] as? String]) == Set([a, b]) }
        }
        let line = try #require(joined(lastID, dotID), "the line runs on to the new dot")
        #expect(line["endArrowhead"] is NSNull, "plain, as the rest of the line")
        #expect(joined(dotID, stepID) != nil, "the step joined to its dot")
        #expect(els.count >= before + 4, "a dot, a step, two lines (and its words)")
        let typing = try await j.js("(() => { const t = amber._canvas.api.getAppState().editingTextElement; return t ? t.containerId : null; })()") as? String
        #expect(typing == stepID, "typed into at once")
        // Typed in and done; then one Undo takes the step back, line and all.
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') { t.value = 'Review\\nWeek 10'; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); } return 1; })()")
        await j.until("typing done") { !j.canvas.state.editing }
        // Add Step from the bar this time, on the new step.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(stepID)': true } } }); return 1; })()")
        await j.until("Add Step offered on it") { j.canvas.state.grows == .step }
        j.canvas.send(.grow)
        await j.until("a seventh") { j.canvas.state.editing }
        els = try await all()
        #expect(els.filter { part($0) == "dot" }.count == 7)
        let seventh = try #require(els.filter { part($0) == "step" }.max { num($0, "x") < num($1, "x") })
        #expect(abs(num(seventh, "y") - num(steps[4], "y")) < 0.5, "above again, where Launch is")
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("typing done again") { !j.canvas.state.editing }
        // (Typing ending is a step of the engine's own, as after a double-click.)
        for _ in 0..<3 {
            j.canvas.run(.undo)
            try await Task.sleep(for: .milliseconds(300))
            els = try await all()
            if els.filter({ part($0) == "dot" }).count < 7 { break }
        }
        #expect(els.filter { part($0) == "dot" }.count == 6 && els.filter { part($0) == "step" }.count == 6, "Undo takes the seventh back, its dot and line with it")
        #expect(!els.contains { e in e["type"] as? String == "arrow" && (e["endBinding"] as? [String: Any])?["elementId"] as? String == (seventh["id"] as? String) }, "and its stem")
        // Nothing of a timeline selected: nothing to add.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        await j.until("nothing selected") { j.canvas.state.grows == nil }
    }

    /// Add Column: a card or a column of a Kanban or Retro board selected, Tab (or Add Column) adds
    /// a column like the last, the same gap to its right, its heading "New column" selected for
    /// typing over. S still adds a card under a card.
    @Test func tabAddsAKanbanColumn() async throws {
        let j = try await Joined(size: CGSize(width: 1100, height: 760))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.kanban, title: "Sprint"))
        await j.until("the kanban is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        func all() async throws -> [[String: Any]] {
            let json = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements())") as? String ?? "[]"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] ?? []
        }
        func num(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        func lane(_ e: [String: Any]) -> Bool { (e["customData"] as? [String: Any])?["pintoColumn"] as? Bool == true }
        var els = try await all()
        let lanes = els.filter(lane).sorted { num($0, "x") < num($1, "x") }
        #expect(lanes.count == 3)
        // A card in Doing selected.
        let card = try #require(els.first { e in e["type"] as? String == "rectangle" && !lane(e) && num(e, "x") > num(lanes[1], "x") && num(e, "x") < num(lanes[2], "x") })
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(card["id"] as! String)': true } } }); return 1; })()")
        await j.until("Add Column offered") { j.canvas.state.grows == .column }
        _ = try await j.js("(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })); return 1; })()")
        await j.until("typing its heading") { j.canvas.state.editing }
        els = try await all()
        let now = els.filter(lane).sorted { num($0, "x") < num($1, "x") }
        #expect(now.count == 4)
        let added = try #require(now.last)
        #expect(abs(num(added, "x") - num(lanes[2], "x") - (num(lanes[2], "x") - num(lanes[1], "x"))) < 0.5, "the same gap on")
        #expect(num(added, "y") == num(lanes[2], "y") && num(added, "width") == num(lanes[2], "width") && num(added, "height") == num(lanes[2], "height"))
        #expect(added["backgroundColor"] as? String == lanes[2]["backgroundColor"] as? String)
        let heading = try await j.js("(() => { const t = amber._canvas.api.getAppState().editingTextElement; return t ? t.text : null; })()") as? String
        #expect(heading == "New column", "its heading, being typed in: \(heading ?? "nil")")
        let selected = try await j.js("(() => { const t = document.activeElement; return t && t.tagName === 'TEXTAREA' ? t.selectionEnd - t.selectionStart : -1; })()") as? Int
        #expect(selected == "New column".count, "all of it selected, so typing replaces it")
        _ = try await j.js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') { t.value = 'Review'; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); } return 1; })()")
        await j.until("typed") { !j.canvas.state.editing }
        let words = try await j.js("(() => amber._canvas.api.getSceneElements().some((e) => e.type === 'text' && e.text === 'Review'))()") as? Bool
        #expect(words == true, "the new column is called Review")
        // A column itself selected: Add Column there too, first in the right-click menu.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { '\(lanes[0]["id"] as! String)': true } } }); return 1; })()")
        await j.until("Add Column offered on a column") { j.canvas.state.grows == .column }
        let web = try #require(j.web as? NotePageWebView)
        #expect(web.canvasMenu().items.first?.title == "Add Column")
        // The title selected: nothing to add.
        _ = try await j.js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.customData && e.customData.pintoTitle); api.updateScene({ appState: { selectedElementIds: { [t.id]: true } } }); return 1; })()")
        await j.until("nothing to add on the title") { j.canvas.state.grows == nil && !j.canvas.state.selection.isEmpty }
    }

    /// One of your templates comes in on an empty board as a built-in one does: everything it
    /// kept, its joins and picture, nothing selected, as one step Undo takes back. Its title line
    /// says the board's own name; a board still called Whiteboard takes the template's.
    @Test func yourTemplateComesInWholeAsOneUndoStep() async throws {
        let templates = WhiteboardTemplates(folder: nil)
        let source = try await Joined(scene: CanvasTests.scene([]))
        try await source.ready()
        source.canvas.send(.insert(.retro))
        await source.until("the retro is in") { !source.canvas.state.empty }
        let picture = try #require(CanvasImage(data: Self.png(width: 120, height: 80, clear: false)))
        source.canvas.send(.image(picture, at: nil))
        await source.until("the picture is in") { source.canvas.state.selection == ["image"] }
        let item = try #require(await source.canvas.saveAsTemplate(named: "Team retro", templates))
        source.close()

        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        await j.until("the page says it's empty") { j.canvas.state.empty }
        var renamed: [String] = []
        j.canvas.title = CanvasNote.title
        j.canvas.rename = { renamed.append($0) }
        j.canvas.insertTemplate(item)
        await j.until("the template is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(200))
        #expect(renamed == ["Team retro"], "a board called Whiteboard takes the template's name: \(renamed)")
        #expect(j.canvas.title == "Team retro")
        let n = try await j.js("amber._canvas.api.getSceneElements().length") as? Int
        #expect(n == item.elements.count, "everything it kept: \(n ?? -1) of \(item.elements.count)")
        let ids = Set(try await Self.ids(j)), was = Set(item.elements.compactMap { $0["id"] as? String })
        #expect(ids.isDisjoint(with: was), "new ids, so the same template twice doesn't clash")
        #expect(try await j.js("(() => { const api = amber._canvas.api, i = api.getSceneElements().find((e) => e.type === 'image'); return !!(i && api.getFiles()[i.fileId]); })()") as? Bool == true, "its picture came with it")
        #expect(try await j.js("amber._canvas.scene().elements.filter((e) => e.customData && e.customData.pintoHint).length") as? Int == 1, "the how-to line too")
        #expect(j.canvas.state.selection.isEmpty, "nothing selected, as a built-in template")
        let web = try #require(j.web as? NotePageWebView)
        NSApp.sendAction(#selector(NotePageWebView.undo(_:)), to: web, from: NSMenuItem(title: "Undo", action: #selector(NotePageWebView.undo(_:)), keyEquivalent: "z"))
        await j.until("one Undo takes it back") { j.canvas.state.empty }

        // A board with a name of its own keeps it, and the template's title line says it.
        renamed = []
        j.canvas.title = "Sprint 12"
        j.canvas.insertTemplate(item)
        await j.until("in again") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(200))
        #expect(renamed.isEmpty)
        let title = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.customData && e.customData.pintoTitle).text") as? String
        #expect(title == "Sprint 12", "\(title ?? "nil")")
    }

    /// A template's tile shows what it holds, words too, so no two look alike (round 10, 28: "Weekly
    /// review" looked the same as "Meeting"; Retro and Kanban were three like columns). The tile drew
    /// the boxes only: a board's own words, a lane's heading, the lines written in a section, the
    /// words on a card, weren't drawn, so a meeting board with its notes written in drew exactly as
    /// the empty template. Now each line of words is a soft bar where it sits.
    @Test func templateTilesShowWhatTheyHold() throws {
        typealias T = WhiteboardTemplate
        // Every line of words, a template's title and how-to aside; not an arrow's Yes and No.
        #expect(CanvasSketch(elements: T.flowchart.elements).words.count == 5)
        #expect(CanvasSketch(elements: T.mindMap.elements).words.count == 7)
        #expect(CanvasSketch(elements: T.retro.elements).words.count == 6, "three headings, three cards")
        #expect(CanvasSketch(elements: T.kanban.elements).words.count == 7, "three headings, four cards")
        #expect(CanvasSketch(elements: T.meeting.elements).words.count == 8, "four headings, four lines")
        // On a board the engine set them: a shape's words where it put them, an arrow's left out.
        let drawn = CanvasSketch(elements: [
            ["type": "rectangle", "id": "b", "x": 0, "y": 0, "width": 200, "height": 80],
            ["type": "text", "id": "bt", "x": 50, "y": 28, "width": 100, "height": 25, "text": "Draft", "fontSize": 20, "containerId": "b"],
            ["type": "arrow", "id": "a", "x": 200, "y": 40, "width": 100, "height": 0, "points": [[0, 0], [100, 0]]],
            ["type": "text", "id": "at", "x": 230, "y": 30, "width": 40, "height": 20, "text": "Yes", "fontSize": 16, "containerId": "a"],
            ["type": "text", "id": "t", "x": 0, "y": 120, "width": 180, "height": 50, "text": "Ask Sam\nby Friday", "fontSize": 20],
        ])
        #expect(drawn.words.map(\.frame) == [CGRect(x: 50, y: 28, width: 100, height: 20),
                                             CGRect(x: 0, y: 120, width: 140, height: 20), CGRect(x: 0, y: 145, width: 180, height: 20)],
                "a line as wide as its words: \(drawn.words.map(\.frame))")

        func tile(_ elements: [[String: Any]]) throws -> [UInt8] {
            let r = ImageRenderer(content: CanvasSketchView(sketch: CanvasSketch(elements: elements)).frame(width: 100, height: 70)
                .background(Color.white).environment(\.colorScheme, .light))
            r.scale = 2
            let cg = try #require(r.cgImage)
            var bytes = [UInt8](repeating: 0, count: cg.width * cg.height * 4)
            let ctx = try #require(CGContext(data: &bytes, width: cg.width, height: cg.height, bitsPerComponent: 8, bytesPerRow: cg.width * 4,
                                             space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: cg.width, height: cg.height))
            return bytes
        }
        /// The share of the tile's pixels that differ.
        func apart(_ a: [UInt8], _ b: [UInt8]) -> Double {
            var n = 0
            for i in stride(from: 0, to: min(a.count, b.count), by: 4) where (0..<3).contains(where: { abs(Int(a[i + $0]) - Int(b[i + $0])) > 24 }) { n += 1 }
            return Double(n) / Double(a.count / 4)
        }
        // A meeting board with its notes written in isn't the empty meeting template.
        let written = T.meeting.elements + [
            ["type": "text", "x": 376, "y": 52, "text": "Launch moves to Friday\nSam writes the post", "fontSize": 16],
            ["type": "text", "x": 16, "y": 292, "text": "Ship the beta first", "fontSize": 16],
        ]
        let meeting = try tile(T.meeting.elements)
        let notes = apart(meeting, try tile(written))
        #expect(notes > 0.01, "the written-in meeting draws its notes: \(notes)")
        // Every tile on the empty board, and the pictures' weekly review: each its own at a glance.
        var tiles = try T.allCases.map { ($0.title, try tile($0.elements)) }
        tiles.append(("Weekly review", try tile(Self.weeklyReview)))
        for i in tiles.indices { for k in tiles.indices where k > i {
            let d = apart(tiles[i].1, tiles[k].1)
            #expect(d > 0.08, "\(tiles[i].0) and \(tiles[k].0) look alike: \(d)")
        } }
    }

    /// FigJam's other everyday boards (round 12): Journey map, SWOT, Timeline, Org chart and User
    /// story map, each with its how-to line, its cards clear of each other with room for their
    /// words, in their own "More templates" row on the empty board, under the first five.
    @Test func moreTemplatesOnTheEmptyBoard() async throws {
        typealias T = WhiteboardTemplate
        #expect(T.first + T.more == T.allCases && T.more.count >= 4)
        for t in T.more {
            #expect(!t.hint.isEmpty && t.hint.count <= 90 && t.hint.hasSuffix("."), "\(t): a how-to line: \(t.hint)")
            #expect(!t.line.isEmpty && !t.line.hasSuffix("."), "\(t): a line for the gallery")
            // Every number is a Double, as the tile and the list's preview read them (the journey
            // map's mood dots were CGFloat, and its tile drew them all in the corner).
            for e in t.elements { for k in ["x", "y", "width", "height"] where e[k] != nil { #expect(e[k] is Double, "\(t): \(k) of \(e["id"] ?? e["type"] ?? "")") } }
            // The gallery's line is whole on its card (SWOT's was cut, "in four squa…").
            let font = NSFont.systemFont(ofSize: SetupTemplateCard.lineSize)
            #expect((t.line as NSString).size(withAttributes: [.font: font]).width <= SetupTemplateCard.wordsWidth(TemplateLibraryView.cardWidth(row: TemplateLibraryView.size.width - 64, gap: TemplateLibraryView.gap)),
                    "\(t): \(t.line)")
            // Cards (shapes with words) never overlap one another; each holds its words.
            let cards = t.elements.compactMap { e -> (String, CGRect, [String], Double)? in
                guard let label = e["label"] as? [String: Any], let words = label["text"] as? String, let id = e["id"] as? String,
                      let x = e["x"] as? Double, let y = e["y"] as? Double, let w = e["width"] as? Double, let h = e["height"] as? Double else { return nil }
                return (id, CGRect(x: x, y: y, width: w, height: h), words.components(separatedBy: "\n"), label["fontSize"] as? Double ?? 20)
            }
            #expect(cards.count >= 4, "\(t): \(cards.count) cards")
            for (i, a) in cards.enumerated() {
                for b in cards.dropFirst(i + 1) { #expect(!a.1.intersects(b.1), "\(t): \(a.0) and \(b.0) overlap") }
                // The hand-drawn font runs about 0.55 of its size a letter; the engine wraps longer words.
                let longest = a.2.map(\.count).max() ?? 0
                #expect(Double(longest) * a.3 * 0.55 <= a.1.width - 8 || a.2.count == 1 && Double(longest) * a.3 * 0.55 <= (a.1.width - 8) * 2,
                        "\(t): \(a.0)'s words fit: \(a.2)")
                #expect(Double(a.2.count) * a.3 * 1.25 <= a.1.height - 8, "\(t): \(a.0)'s lines fit its height")
            }
            // Its words never sit under a card: the headings and labels are clear of every card.
            for e in t.elements where e["type"] as? String == "text" {
                guard (e["customData"] as? [String: Any]) == nil, let x = e["x"] as? Double, let y = e["y"] as? Double,
                      let words = e["text"] as? String, let size = e["fontSize"] as? Double else { continue }
                let box = CGRect(x: x, y: y, width: Double(words.count) * size * 0.55, height: size * 1.25)
                for c in cards { #expect(!box.intersects(c.1), "\(t): \"\(words)\" runs into \(c.0)") }
            }
        }
        // On the empty board: the first five in a row, then "More templates" and the five more,
        // their tiles in line with the first row's.
        let ax = OffscreenAX(CanvasStart(canvas: CanvasController()), size: CGSize(width: 760, height: 560))
        defer { ax.close() }
        await ax.settle()
        let more = try #require(ax.find("canvas.moreTemplates"), "\(ax.ids())")
        #expect(more.text.contains(CanvasStart.moreTemplatesTitle), "\(more.text)")
        let first = try T.first.map { try #require(ax.find("canvas.template.\($0.rawValue)"), "\($0)").frame }
        let second = try T.more.map { try #require(ax.find("canvas.template.\($0.rawValue)"), "\($0)").frame }
        for (a, b) in zip(first, second) {
            #expect(abs(a.minX - b.minX) < 1 && abs(a.width - b.width) < 1, "in line: \(a) \(b)")
            #expect(b.minY > a.maxY + 20, "under the first row, with its heading between: \(a) \(b)")
        }
        #expect(Set(second.map { Int($0.minY.rounded()) }).count == 1, "one row")
        #expect(ax.find("canvas.import") != nil && ax.find("canvas.ask") != nil, "Import and Ask still under them")
    }

    /// The templates gallery has the whiteboards too, after the notes' under All and Work, found
    /// by Search; a card makes a new board, named for the template, which goes in once its page is
    /// ready, as from the empty board (round 12).
    @Test func theTemplatesGalleryMakesABoardFromATemplate() async throws {
        typealias L = TemplateLibraryView
        typealias T = WhiteboardTemplate
        #expect(L.boards(T.allCases, filter: "All", query: "") == T.allCases && L.boards(T.allCases, filter: "Work", query: "") == T.allCases)
        #expect(L.boards(T.allCases, filter: "Apps", query: "").isEmpty && L.boards(T.allCases, filter: "Habits and health", query: "").isEmpty)
        #expect(L.boards(T.allCases, filter: "All", query: "swot") == [.swot] && L.boards(T.allCases, filter: "All", query: "Journey") == [.journeyMap])
        #expect(L.boards(T.allCases, filter: "All", query: "board") == T.allCases, "\"board\" finds them all")
        #expect(L.boards(T.allCases, filter: "All", query: "zzz").isEmpty)
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        #expect(root.contains("boards: WhiteboardTemplate.allCases, makeBoard:") && root.contains("CanvasLanding.shared.request(board.id, template: t)"))
        // Searched for, its card is there; a press makes the board.
        var made: T?
        let ax = OffscreenAX(TemplateLibraryView(catalog: .shipped, ais: [.chatgpt], boards: T.allCases, makeBoard: { made = $0 }, query: "swot"), size: L.size)
        defer { ax.close() }
        await ax.settle()
        let card = try #require(ax.find("templates.board.swot"), "\(ax.ids())")
        #expect(card.text.contains("SWOT") && ax.find("templates.boards") != nil)
        #expect(ax.find("templates.none") == nil, "not \"nothing found\"")
        card.press()
        #expect(made == .swot)
        // The pictures: the gallery searched for "board", in both looks.
        if let path = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"] {
            for dark in [false, true] {
                let view = TemplateLibraryView(catalog: .shipped, ais: [.chatgpt], boards: T.allCases, query: "board", size: L.size)
                    .environment(\.inSheet, true).frame(width: L.size.width, height: L.size.height).background(SetupCards.ground)
                let shown = OffscreenAX(view, size: L.size, dark: dark)
                defer { shown.close() }
                await shown.settle(800)
                let png = try #require(try MacEmptyDetailTests.picture(shown.window).representation(using: .png, properties: [:]))
                try png.write(to: URL(fileURLWithPath: path).appending(path: "34-templates-gallery-boards-\(dark ? "dark" : "light").png"))
            }
        }
        // The board takes it once: before its page is ready, it waits; then it goes in.
        let board = UUID()
        CanvasLanding.shared.request(board, template: .timeline)
        #expect(CanvasLanding.shared.takeTemplate(UUID()) == nil)
        #expect(CanvasLanding.shared.takeTemplate(board) == .timeline && CanvasLanding.shared.takeTemplate(board) == nil, "once")
        let j = try await Joined()
        defer { j.close() }
        j.canvas.start(.timeline)
        try await j.ready()
        var steps = 0
        for _ in 0..<100 {
            steps = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.id === 'step0' || (e.type === 'rectangle' && e.backgroundColor === '#b2f2bb')).length") as? Int ?? 0
            if !j.canvas.state.empty, steps > 0 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(!j.canvas.state.empty && j.canvas.starting == nil, "the timeline went in once the page was ready")
        #expect(steps > 0)
        #expect(j.canvas.canUndo, "one step Undo takes back")
    }

    /// Where sync is, for the board's line in a test.
    @Observable final class SyncBox {
        var reach: SyncEngine.Reach = .online
        var syncedAt: Date?
    }

    struct SyncLineHost: View {
        let box: SyncBox
        var body: some View {
            BoardSyncLine().environment(\.networkReach, box.reach).environment(\.syncedAt, box.syncedAt).frame(width: 360, height: 60)
        }
    }

    /// The board says where sync is (round 12: offline, the board said nothing, and with its
    /// columns folded away the sidebar's line wasn't in view): offline, the sidebar's words; back,
    /// "Back online · syncing" until a sync after it got through; then "Synced" for a moment; then
    /// nothing. BoardSyncPictureTests runs it against the app's sync.
    @Test func theBoardSaysWhenItsOfflineAndWhenItsSyncedAgain() async throws {
        typealias S = BoardSync
        let back = Date.now
        #expect(S.now(reach: .online, backAt: nil, syncedAt: nil) == nil, "nothing while all is well")
        #expect(S.now(reach: .offline, backAt: nil, syncedAt: .now) == .away(.offline))
        #expect(S.now(reach: .unreachable, backAt: back, syncedAt: nil) == .away(.unreachable))
        #expect(S.now(reach: .online, backAt: back, syncedAt: nil) == .syncing)
        #expect(S.now(reach: .online, backAt: back, syncedAt: back.addingTimeInterval(-5)) == .syncing, "a sync from before it was back doesn't count")
        #expect(S.now(reach: .online, backAt: back, syncedAt: back.addingTimeInterval(1)) == .synced)
        #expect(S.away(.offline).lines(device: "Mac").first == "Offline \u{00B7} saved on this Mac", "the sidebar's words")
        #expect(S.away(.unreachable).lines(device: "iPhone").first == "Sync paused \u{00B7} saved on this iPhone")
        #expect(S.away(.offline).symbol == OfflineCopy.symbol(.offline) && S.synced.lines() == ["Synced"] && S.syncing.lines().first == "Back online \u{00B7} syncing")
        let controls = try SettingsHomeTests.source("Pane/Views/CanvasControls.swift")
        #expect(controls.components(separatedBy: "BoardSyncLine()").count == 3, "on the Mac across from the zoom, on iPhone above the dock")
        let app = try SettingsHomeTests.source("Pane/App/PaneApp.swift")
        #expect(app.components(separatedBy: ".environment(\\.syncedAt, sync.syncedAt)").count == 4, "beside the reach, wherever the notes window is")
        #if os(macOS)
        let box = SyncBox()
        let hold = BoardSyncLine.hold
        BoardSyncLine.hold = .milliseconds(400)
        defer { BoardSyncLine.hold = hold }
        let ax = OffscreenAX(SyncLineHost(box: box), size: CGSize(width: 360, height: 60))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("canvas.sync") == nil)
        box.reach = .offline
        await ax.settle()
        #expect(ax.find("canvas.sync")?.text.contains("Offline \u{00B7} saved on this") == true, "\(ax.ids())")
        box.reach = .online
        await ax.settle()
        #expect(ax.find("canvas.sync")?.text.contains("Back online") == true)
        box.syncedAt = .now
        await ax.settle(200)
        #expect(ax.find("canvas.sync")?.text == "Synced")
        try await Task.sleep(for: .milliseconds(600))
        await ax.settle(200)
        #expect(ax.find("canvas.sync") == nil, "then nothing")
        // Offline again, then a sync from before: still away, never "Synced".
        box.reach = .unreachable
        await ax.settle()
        #expect(ax.find("canvas.sync")?.text.contains("Sync paused") == true)
        #endif
    }

    /// The board as it is now, as the page keeps it in its page data.
    static func drawn(_ j: Joined) async throws -> [String: Any] {
        let json = try #require(try await j.js("JSON.stringify({ type: 'excalidraw', version: 2, elements: amber._canvas.api.getSceneElementsIncludingDeleted(), files: amber._canvas.api.getFiles(), appState: {} })") as? String)
        return try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
    }

    /// What's drawn on the board now, by id.
    static func shown(_ j: Joined) async throws -> Set<String> {
        Set(try await j.js("amber._canvas.api.getSceneElements().map((e) => e.id)") as? [String] ?? [])
    }

    /// A board's History (round 12, both judges: "open History on a board, pick an earlier
    /// version, the board shows it, Restore"): the versions the server keeps of its drawing, newest
    /// first after the board as it is, each drawn as the board draws it; Restore puts one back as a
    /// step Undo takes back, and the board says so.
    @Test func aBoardsHistoryShowsAnEarlierVersionAndRestoresIt() async throws {
        #expect(BoardVersion.author(nil) == .you(device: nil) && BoardVersion.author("iPhone") == .you(device: "iPhone") && BoardVersion.author("ChatGPT") == .ai("ChatGPT"))
        // A board's History is its drawing's; a shared board's isn't offered here yet.
        let detail = try SettingsHomeTests.source("Pane/Views/NoteDetailView.swift")
        #expect(detail.contains("if isCanvas, collab == nil {") && detail.contains("BoardHistorySheet(model: BoardHistoryModel("))
        #expect(try SettingsHomeTests.source("Pane/App/PaneApp.swift").contains("BoardHistoryModel.store = backend.client.map { SupabaseBoardHistory(client: $0) }"))

        let j = try await Joined()
        defer { j.close() }
        try await j.ready()
        @MainActor func put(_ t: WhiteboardTemplate) async throws -> [String: Any] {
            _ = try await j.js("amber._canvas.api.updateScene({ elements: [] }); 1")
            await j.until("cleared") { j.canvas.state.empty }
            j.canvas.send(.insert(t, title: j.canvas.title))
            await j.until("\(t) drawn") { !j.canvas.state.empty }
            try await Task.sleep(for: .milliseconds(150))
            return try await Self.drawn(j)
        }
        @MainActor func ids(_ scene: [String: Any]) -> Set<String> {
            Set((scene["elements"] as? [[String: Any]] ?? []).filter { $0["isDeleted"] as? Bool != true }.compactMap { $0["id"] as? String })
        }
        let kanban = try await put(.kanban), retro = try await put(.retro), now = try await put(.flowchart)
        #expect(ids(retro) != ids(now) && !ids(retro).isEmpty)
        let board = UUID()
        NotePageDataStore.shared.set(board, ["values": ["scene": now], "collections": [String: Any]()])
        defer { NotePageDataStore.shared.set(board, nil) }
        let byAI = BoardVersion(id: 41, madeAt: .now.addingTimeInterval(-50 * 60), author: .ai("ChatGPT"))
        let onPhone = BoardVersion(id: 40, madeAt: .now.addingTimeInterval(-2 * 86_400), author: .you(device: "iPhone"))
        let store = MemoryBoardHistory([(onPhone, ["values": ["scene": kanban]]), (byAI, ["values": ["scene": retro]]),
                                        (BoardVersion(id: 39, madeAt: .now.addingTimeInterval(-3 * 86_400), author: .you(device: nil)), NotePageData.empty())])
        let model = BoardHistoryModel(board: board, title: "Product launch", changedAt: .now, store: store, canvas: j.canvas)
        await model.load()
        #expect(model.phase == .loaded)
        #expect(model.versions.map(\.id) == [BoardVersion.current, 41, 40, 39], "the board as it is, then newest first")
        #expect(model.days.first?.title == HistoryGrouping.title(for: .now) && model.days.count >= 2)
        // It opens on the newest earlier version, drawn.
        #expect(model.selection == 41)
        let picked = try #require(model.picture, "\(String(describing: model.previewFailed))")
        #if os(macOS)
        let image = try #require(NSImage(data: picked))
        #expect(image.size.width > 200 && image.size.height > 100, "\(image.size)")
        #endif
        #expect(BoardHistoryModel.heading(byAI).hasPrefix("\(HistoryGrouping.title(for: byAI.madeAt)) at "))
        #expect(BoardHistoryModel.heading(model.versions[0]) == "Current version")
        await model.select(40)
        #expect(model.picture != nil && model.picture != picked, "another version, another drawing")
        await model.select(39)
        #expect(model.emptyVersion && model.picture == nil, "kept before anything was drawn")
        // The board as it is has nothing to restore.
        await model.select(BoardVersion.current)
        #expect(model.picture != nil)
        #expect(await model.restore() == false)
        #expect(try await Self.shown(j) == ids(now))

        // Restore: the board shows the version, says so, and Undo takes it back.
        await model.select(41)
        #expect(await model.restore())
        for _ in 0..<100 where try await Self.shown(j) != ids(retro) { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.shown(j) == ids(retro), "the board is the version again")
        #expect(j.canvas.notice == BoardHistoryModel.restoredLine && j.canvas.noticeUndo != nil)
        #expect(j.canvas.canUndo)
        let undo = try #require(j.canvas.noticeUndo)
        undo()
        for _ in 0..<100 where try await Self.shown(j) != ids(now) { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.shown(j) == ids(now), "Undo puts the board back as it was")
        #expect(j.canvas.notice == nil)
        // Restored elements count as changes: each one's version is past the one it replaced, so
        // the restore syncs and wins a merge as an edit does.
        j.canvas.run(.redo)
        for _ in 0..<100 where try await Self.shown(j) != ids(retro) { try await Task.sleep(for: .milliseconds(30)) }
        let after = try await Self.drawn(j)
        let before = Dictionary(((retro["elements"] as? [[String: Any]]) ?? []).map { ($0["id"] as! String, $0["version"] as? Int ?? 0) }, uniquingKeysWith: { a, _ in a })
        for e in (after["elements"] as? [[String: Any]] ?? []) where ids(retro).contains(e["id"] as? String ?? "") {
            #expect((e["version"] as? Int ?? 0) > before[e["id"] as! String] ?? 0, "\(e["id"] ?? "")")
        }

        #if os(macOS)
        // The sheet: the versions by day, the picked one drawn, Restore at the top.
        _ = try await put(.flowchart)
        NotePageDataStore.shared.set(board, ["values": ["scene": try await Self.drawn(j)], "collections": [String: Any]()])
        for dark in [false, true] {
            let sheet = BoardHistoryModel(board: board, title: "Product launch", changedAt: .now.addingTimeInterval(-60), store: store, canvas: j.canvas)
            let size = CGSize(width: 900, height: 600)
            let ax = OffscreenAX(BoardHistorySheet(model: sheet).frame(width: size.width, height: size.height), size: size, dark: dark)
            defer { ax.close() }
            for _ in 0..<60 where ax.find("boardHistory.picture") == nil { await ax.settle(100) }
            if let path = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"] {
                await ax.settle(400)
                let png = try #require(try MacEmptyDetailTests.picture(ax.window).representation(using: .png, properties: [:]))
                try png.write(to: URL(fileURLWithPath: path).appending(path: "35-board-history-\(dark ? "dark" : "light").png"))
            }
            #expect(sheet.dark == dark, "drawn in the window's look")
            #expect(ax.find("boardHistory.row.current") != nil && ax.find("boardHistory.row.41") != nil && ax.find("boardHistory.row.40") != nil, "\(ax.ids())")
            #expect(ax.find("boardHistory.heading")?.text.contains(BoardHistoryModel.heading(byAI)) == true, "\(ax.ids())")
            #expect(ax.find("boardHistory.picture") != nil)
            let restore = try #require(ax.find("boardHistory.restore"))
            #expect(restore.enabled && restore.text.contains(BoardHistorySheet.restoreTitle))
            if !dark {
                restore.press()
                for _ in 0..<100 where try await Self.shown(j) != ids(retro) { try await Task.sleep(for: .milliseconds(30)) }
                #expect(try await Self.shown(j) == ids(retro), "Restore in the sheet puts the version on the board")
                #expect(j.canvas.notice == BoardHistoryModel.restoredLine)
            }
        }
        #endif
    }

    /// The empty board shows your templates after the five built-in tiles, each with its drawing
    /// and name; a click puts it in. Rename and Delete (with Undo) from the right-click menu.
    @Test func yourTemplatesShowOnTheEmptyBoardAndCanBeRenamedAndDeleted() async throws {
        let templates = WhiteboardTemplates(folder: nil)
        let none = OffscreenAX(CanvasStart(canvas: CanvasController(), templates: templates), size: CGSize(width: 700, height: 420))
        await none.settle()
        #expect(none.find("canvas.yourTemplates") == nil, "none yet: no heading")
        none.close()
        let a = try #require(templates.add(name: "Weekly review", elements: WhiteboardTemplate.meeting.elements))
        let b = try #require(templates.add(name: "Bug triage", elements: WhiteboardTemplate.kanban.elements))
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasStart(canvas: canvas, templates: templates), size: CGSize(width: 700, height: 460))
        defer { ax.close() }
        await ax.settle()
        let group = try #require(ax.find("canvas.yourTemplates"), "\(ax.ids())")
        #expect(group.text.contains(CanvasStart.yourTemplatesTitle))
        let ids = ax.ids()
        let builtIn = try #require(ids.lastIndex { $0.hasPrefix("canvas.template.") })
        let first = try #require(ids.firstIndex(of: "canvas.yourTemplate.\(b.id)"))
        #expect(builtIn < first, "after the five built-in tiles: \(ids)")
        #expect(ids.contains("canvas.yourTemplate.\(a.id)") && ax.find("canvas.yourTemplates.more") == nil)
        let tile = try #require(ax.find("canvas.yourTemplate.\(a.id)"))
        #expect(tile.text.contains("Weekly review"), "\(tile.text)")
        tile.press()
        await ax.settle(100)
        #expect(canvas.sent.last == .template(a, title: canvas.title), "a click puts it in: \(canvas.sent)")

        // Rename… keeps the new name; an empty one changes nothing.
        templates.rename(a.id, to: "  Friday review ")
        #expect(templates.items.first { $0.id == a.id }?.name == "Friday review")
        templates.rename(a.id, to: "   ")
        #expect(templates.items.first { $0.id == a.id }?.name == "Friday review")
        await ax.settle(200)
        #expect(ax.find("canvas.yourTemplate.\(a.id)")?.text.contains("Friday review") == true)
        // Delete (asked first, in the view): gone, and Undo puts it back where it was.
        #expect(CanvasStart.deleteQuestion("Bug triage") == "Delete \u{201C}Bug triage\u{201D}?")
        canvas.deleteTemplate(b.id, templates)
        #expect(templates.items.map(\.id) == [a.id] && canvas.notice == CanvasController.templateDeletedTitle)
        await ax.settle(200)
        #expect(ax.find("canvas.yourTemplate.\(b.id)") == nil, "its tile goes")
        let undo = try #require(canvas.noticeUndo, "the notice offers Undo")
        undo()
        #expect(templates.items.map(\.id) == [b.id, a.id], "back where it was")
        #expect(canvas.notice == nil)
    }

    /// Many templates keep to one row: four, then More…, which opens them all in a grid.
    @Test func manyTemplatesKeepToOneRowWithMore() async throws {
        let templates = WhiteboardTemplates(folder: nil)
        for i in 0..<WhiteboardTemplates.rowLimit { templates.add(name: "Board \(i)", elements: WhiteboardTemplate.flowchart.elements) }
        #expect(templates.row.items.count == WhiteboardTemplates.rowLimit && !templates.row.more, "five fit")
        for i in 5..<9 { templates.add(name: "Board \(i)", elements: WhiteboardTemplate.retro.elements) }
        #expect(templates.row.items.count == WhiteboardTemplates.rowLimit - 1 && templates.row.more)
        #expect(templates.row.items.first?.name == "Board 8", "newest first")
        let ax = OffscreenAX(CanvasStart(canvas: CanvasController(), templates: templates), size: CGSize(width: 700, height: 460))
        defer { ax.close() }
        await ax.settle()
        let shown = ax.ids().filter { $0.hasPrefix("canvas.yourTemplate.") }
        #expect(shown.count == 4, "\(shown)")
        let more = try #require(ax.find("canvas.yourTemplates.more"), "\(ax.ids())")
        #expect(more.text.contains("More"), "\(more.text)")
    }

    /// The whiteboard in the app's window, light and dark, for the whiteboard council. Drawn only
    /// when WHITEBOARD_SHOTS is set (TEST_RUNNER_WHITEBOARD_SHOTS=dir).
    @Test func whiteboardWindowPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let keptAIs = ConnectedAIs.shared.connections
        ConnectedAIs.shared.set([AskAITests.chatgpt])
        defer { ConnectedAIs.shared.set(keptAIs) }
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            @MainActor func board(_ title: String, _ elements: [[String: Any]], ago: Double) -> Note {
                let n = CanvasNote.make(in: .all, context: c.mainContext)
                n.body = title
                n.updatedAt = .now.addingTimeInterval(-ago)
                NotePageDataStore.shared.set(n.id, ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
                return n
            }
            _ = board("Q3 roadmap", WhiteboardTemplate.kanban.elements, ago: 300)
            _ = board("Onboarding flow", WhiteboardTemplate.flowchart.elements, ago: 900)
            _ = board("Logo ideas", (0..<5).map { i in ["type": "freedraw", "x": Double(i) * 60, "y": 0, "width": 50, "height": 40,
                                                         "points": [[0, 20], [10, 0], [25, 35], [40, 5], [50, 25]]] }, ago: 1500)
            let note = board("Product launch", [], ago: 30)
            // The notes behind the launch board's steps (its note cards, 24).
            let planNote = c.mainContext.createNote(in: .all, body: "Launch plan\n\nShip the beta to the waitlist on Friday 21 November. Post on the blog and the newsletter the same morning.\n\n- [ ] Final copy by Wednesday\n- [ ] Screenshots from the 1.4 build\n")
            planNote.updatedAt = .now.addingTimeInterval(-2400)
            let pressNote = c.mainContext.createNote(in: .all, body: "Press list\n\nWho hears first, and when: tech press on Monday at 9, newsletters on Tuesday, podcast hosts after the launch.\n")
            pressNote.updatedAt = .now.addingTimeInterval(-3000)
            try c.mainContext.save()
            WikiDirectory.invalidate()
            defer { WikiDirectory.invalidate() }
            try await AppSnapshotTests.withLastNote(c, "Product launch") {
                @MainActor func window(_ size: CGSize) -> NSWindow {
                    let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                     styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
                    w.isReleasedWhenClosed = false
                    w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                    w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
                        .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
                    w.setContentSize(size)
                    return w
                }
                let w = window(CGSize(width: 1400, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                @MainActor func open(_ w: NSWindow) async throws -> (NotePageWebView, CanvasController) {
                    var found: WKWebView?
                    for _ in 0..<100 where found == nil {
                        found = NotePageLive.view(note.id)
                        if found == nil { await MacWindowChromeTests.settle(w, 1) }
                    }
                    let web = try #require(found as? NotePageWebView, "the whiteboard opened")
                    try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
                    return (web, try #require(web.canvas))
                }
                let (web, canvas) = try await open(w)
                for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 10)
                // A click on the board reaches the board: nothing native lies over it (round 9, on
                // the Air: no click reached the board; a view that only finds the window lay over it).
                @MainActor func clicksReachTheBoard(_ w: NSWindow, _ web: NotePageWebView) {
                    guard let root = w.contentView else { return }
                    for (fx, fy) in [(0.5, 0.5), (0.25, 0.7), (0.8, 0.3)] {
                        let p = web.convert(NSPoint(x: web.bounds.width * fx, y: web.bounds.height * fy), to: root)
                        let hit = root.hitTest(p)
                        var v = hit, onBoard = false
                        while let x = v { if x === web { onBoard = true; break }; v = x.superview }
                        #expect(onBoard, "a click at \(fx),\(fy) of the board lands on \(hit.map { String(describing: type(of: $0)) } ?? "nothing"), not the board")
                    }
                }
                @MainActor func capture(_ w: NSWindow, _ web: NotePageWebView) async throws -> NSBitmapImageRep {
                    _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                    await MacWindowChromeTests.settle(w, 10)
                    // The view settled at the window's size first (round 10, 13-fullscreen-dark was
                    // taken a resize step early, the drawing centred for a narrower board).
                    _ = try? await Self.settledView(w, web)
                    let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                    let cover = NSImageView(frame: web.bounds)
                    cover.image = image
                    cover.imageScaling = .scaleAxesIndependently
                    cover.wantsLayer = true
                    web.addSubview(cover)
                    defer { cover.removeFromSuperview() }
                    w.contentView?.layoutSubtreeIfNeeded()
                    w.displayIfNeeded()
                    return try MacEmptyDetailTests.picture(w)
                }
                @MainActor func shot(_ name: String, _ w: NSWindow, _ web: NotePageWebView) async throws {
                    let png = try #require(try await capture(w, web).representation(using: .png, properties: [:]))
                    try png.write(to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"))
                }
                @MainActor func js(_ s: String) async throws { _ = try await web.evaluateJavaScript("(() => { " + s + "; return 1; })()") }
                @MainActor func insert(_ t: WhiteboardTemplate) async throws {
                    try await js("amber._canvas.api.updateScene({ elements: [] })")
                    for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    canvas.send(.insert(t, title: canvas.title))  // as the template tile does
                    for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 10)
                }
                @MainActor func select(_ filter: String) async throws {
                    try await js("const api = amber._canvas.api; const ids = {}; api.getSceneElements().filter((e) => \(filter)).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } })")
                    for _ in 0..<50 where canvas.state.bounds == nil { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 5)
                }
                try await shot("01-empty", w, web)
                try await Self.expectWholeToolbar(w, "picture 01-empty")
                // Your templates (both judges, round 8): the empty board with two of your own
                // after the five built-in ones.
                do {
                    let mine = WhiteboardTemplates.shared
                    let kept = mine.items
                    defer { for t in mine.items where !kept.contains(where: { $0.id == t.id }) { mine.remove(t.id) } }
                    mine.add(name: "Weekly review", elements: Self.weeklyReview)
                    mine.add(name: "Release checklist", elements: WhiteboardTemplate.kanban.elements + [
                        ["type": "rectangle", "x": 720, "y": 0, "width": 220, "height": 380, "strokeColor": "#ced4da", "backgroundColor": "#fff5f5", "fillStyle": "solid"],
                    ])
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("28-your-templates", w, web)
                }
                for (i, t) in (dark ? [WhiteboardTemplate.flowchart] : WhiteboardTemplate.allCases).enumerated() {
                    try await insert(t)
                    // The first five 02 to 06; the more templates after the rest (29 to 33).
                    try await shot(String(format: "%02d-template-%@", i < 5 ? 2 + i : 29 + i - 5, t.rawValue), w, web)
                    if i == 0 { clicksReachTheBoard(w, web) }
                }
                // Templates that grow, and your own (round 15, Opus #5): a timeline gains a step
                // with Tab, a kanban a column; a frame saved as a template and used on a new board.
                if !dark {
                    @MainActor func typeAndFinish(_ words: String) async throws {
                        for _ in 0..<100 where !canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        try await js("const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })); }")
                        for _ in 0..<100 where canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                    }
                    try await insert(.timeline)
                    try await select("e.customData && e.customData.pintoStep === 'step' && e.x > 500")
                    for _ in 0..<50 where canvas.state.grows != .step { await MacWindowChromeTests.settle(w, 1) }
                    #expect(canvas.state.grows == .step)
                    try await shot("43-timeline-1-add-step", w, web)
                    try await js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }))")
                    try await typeAndFinish("Review\nWeek 10")
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("43-timeline-2-step-added", w, web)

                    try await insert(.kanban)
                    try await select("e.type === 'rectangle' && e.backgroundColor === '#a5d8ff'")
                    for _ in 0..<50 where canvas.state.grows != .column { await MacWindowChromeTests.settle(w, 1) }
                    #expect(canvas.state.grows == .column)
                    try await shot("44-kanban-1-add-column", w, web)
                    canvas.send(.grow)
                    try await typeAndFinish("Review")
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("44-kanban-2-column-added", w, web)

                    // A board's frame, selected; saved as a template (the right-click menu's Save as
                    // Template…, named "Launch checklist"); on a new board, under Your templates; used.
                    let mine = WhiteboardTemplates.shared
                    let kept = mine.items
                    defer { for t in mine.items where !kept.contains(where: { $0.id == t.id }) { mine.remove(t.id) } }
                    try await insert(.flowchart)
                    try await js("""
                    const api = amber._canvas.api, els = api.getSceneElements();
                    const body = els.filter((e) => !(e.customData && (e.customData.pintoTitle || e.customData.pintoHint)));
                    const [x1, y1, x2, y2] = [Math.min(...body.map((e) => e.x)), Math.min(...body.map((e) => e.y)), Math.max(...body.map((e) => e.x + e.width)), Math.max(...body.map((e) => e.y + e.height))];
                    const frame = { type: 'frame', id: 'launch-frame', x: x1 - 40, y: y1 - 40, width: x2 - x1 + 80, height: y2 - y1 + 80, name: 'Launch checklist' };
                    // The frame is the board: the template's title and how-to line go.
                    amber._canvasCommand({ op: 'restoreVersion', scene: { elements: [frame, ...body.map((e) => ({ ...e, frameId: 'launch-frame' }))] } });
                    """)
                    try await select("e.id === 'launch-frame'")
                    #expect(web.canvasMenu().items.contains { $0.title == NoteMoreMenu.saveTemplateTitle })
                    try await shot("45-save-template-1-frame-selected", w, web)
                    let saved = try #require(await canvas.saveAsTemplate(named: "Launch checklist", selection: true, mine))
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 6)
                    try await shot("45-save-template-2-saved", w, web)
                    canvas.notice = nil
                    try await js("amber._canvas.api.updateScene({ elements: [] })")
                    for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("45-save-template-3-your-templates", w, web)
                    canvas.insertTemplate(saved)
                    for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("45-save-template-4-used", w, web)
                }
                try await insert(.flowchart)
                try await select("e.type === 'rectangle' && e.backgroundColor === '#a5d8ff'")
                try await shot("07-selected-box", w, web)
                if !dark {
                    // The board's title (named after the board now), scrolled to just under the toolbar.
                    try await js("const api = amber._canvas.api, s = api.getAppState(), t = api.getSceneElements().find((e) => e.customData && e.customData.pintoTitle); api.updateScene({ appState: { scrollY: -t.y + 16 / s.zoom.value } })")
                    try await select("e.customData && e.customData.pintoTitle")
                    try await shot("08-selected-title-near-top", w, web)
                    try await select("e.type === 'arrow' && e.width > 50")
                    try await shot("09-selected-arrow", w, web)
                    try await select("!e.containerId")
                    try await shot("10-selected-all", w, web)
                }
                // History (round 12, both judges): the board's History opened from the board, the
                // newest earlier version picked and drawn; then the board after Restore, saying so.
                do {
                    @MainActor func scene() async throws -> [String: Any] {
                        let json = try #require(try await web.evaluateJavaScript("JSON.stringify({ type: 'excalidraw', version: 2, elements: amber._canvas.api.getSceneElementsIncludingDeleted(), files: amber._canvas.api.getFiles(), appState: { viewBackgroundColor: amber._canvas.api.getAppState().viewBackgroundColor } })") as? String)
                        return try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
                    }
                    try await insert(.retro)
                    let retro = try await scene()
                    try await insert(.kanban)
                    let kanban = try await scene()
                    try await insert(.flowchart)
                    NotePageDataStore.shared.set(note.id, ["values": ["scene": try await scene()], "collections": [String: Any]()])
                    let store = MemoryBoardHistory([
                        (BoardVersion(id: 41, madeAt: .now.addingTimeInterval(-40 * 60), author: .ai("ChatGPT")), ["values": ["scene": retro]]),
                        (BoardVersion(id: 40, madeAt: .now.addingTimeInterval(-26 * 3600), author: .you(device: "iPhone")), ["values": ["scene": kanban]]),
                        (BoardVersion(id: 39, madeAt: .now.addingTimeInterval(-50 * 3600), author: .you(device: "Mac")), ["values": ["scene": kanban]]),
                    ])
                    let kept = BoardHistoryModel.store
                    BoardHistoryModel.store = store
                    defer { BoardHistoryModel.store = kept }
                    // A sheet attaches only to a window that's ordered in: far off the screen, as
                    // OffscreenAX's are, and out again after.
                    w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
                    w.orderFrontRegardless()
                    defer { w.orderOut(nil) }
                    NotificationCenter.default.post(name: CollabScript.history, object: "open")
                    var sheet: NSWindow?
                    for _ in 0..<50 where sheet == nil { await MacWindowChromeTests.settle(w, 1); sheet = w.attachedSheet }
                    let shown = try #require(sheet, "History opens over the board")
                    shown.appearance = w.appearance
                    await MacWindowChromeTests.settle(shown, 30)
                    // The window with its sheet where it sits, as one picture.
                    let base = try await capture(w, web)
                    let top = try MacEmptyDetailTests.picture(shown)
                    let ctx = try #require(NSGraphicsContext(bitmapImageRep: base))
                    let at = CGRect(x: (shown.frame.minX - w.frame.minX) * 2, y: (shown.frame.minY - w.frame.minY) * 2, width: CGFloat(top.pixelsWide), height: CGFloat(top.pixelsHigh))
                    ctx.cgContext.draw(try #require(top.cgImage), in: at)
                    ctx.flushGraphics()
                    try #require(base.representation(using: .png, properties: [:])).write(to: dir.appending(path: "36-board-history-open-\(dark ? "dark" : "light").png"))
                    // Restore, as its button does (the note History's script line): the version on
                    // the board, "Version restored" with Undo (held while the picture is taken), and
                    // the sheet gone.
                    CanvasController.noticeHold = .seconds(60)
                    defer { CanvasController.noticeHold = nil }
                    NotificationCenter.default.post(name: CollabScript.history, object: "restore")
                    for _ in 0..<100 {
                        let back = try? await web.evaluateJavaScript("amber._canvas.api.getSceneElements().some((e) => e.type === 'text' && e.text === 'Went well')") as? Bool
                        if back == true, w.attachedSheet == nil { break }
                        await MacWindowChromeTests.settle(w, 1)
                    }
                    #expect(w.attachedSheet == nil, "the history closes")
                    #expect(canvas.notice == BoardHistoryModel.restoredLine)
                    if !dark {
                        await MacWindowChromeTests.settle(w, 6)
                        try await shot("37-board-history-restored", w, web)
                    }
                    canvas.notice = nil
                    canvas.noticeUndo = nil
                    try await insert(.flowchart)
                }
                try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                // A screenshot pasted on: the window itself, as a picture.
                let screenshot = try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])
                if !dark, let screenshot, let picture = CanvasImage(data: screenshot) {
                    canvas.send(.image(picture, at: nil))
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("11-pasted-screenshot", w, web)
                    canvas.run(.crop)
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("11-cropping", w, web)
                    canvas.send(.cropDone)
                    try await js("const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().filter((e) => e.type !== 'image'), appState: { selectedElementIds: {} } })")
                }
                // An AI draws an approval flow next to it, as an MCP write arrives through sync.
                var doc = NotePageDataStore.shared.doc(note.id)
                await MacWindowChromeTests.settle(w, 10)
                doc = NotePageDataStore.shared.doc(note.id)
                var scene = (doc["values"] as? [String: Any])?["scene"] as? [String: Any] ?? [:]
                var els = scene["elements"] as? [[String: Any]] ?? []
                let ink = "#2a1d10"
                els += [
                    ["type": "rectangle", "id": "ai-req", "x": 560, "y": 0, "width": 180, "height": 70, "label": ["text": "Request"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "rectangle", "id": "ai-rev", "x": 560, "y": 130, "width": 180, "height": 70, "label": ["text": "Manager review"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "rectangle", "id": "ai-ok", "x": 560, "y": 260, "width": 180, "height": 70, "label": ["text": "Approved"], "strokeColor": ink, "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "arrow", "x": 650, "y": 70, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-req"], "end": ["id": "ai-rev"], "strokeColor": ink],
                    ["type": "arrow", "x": 650, "y": 200, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-rev"], "end": ["id": "ai-ok"], "strokeColor": ink],
                ]
                scene["elements"] = els
                let server = NotePageData.encode(["values": ["scene": scene], "collections": [String: Any]()])
                CanvasController.highlightTime = 60
                defer { CanvasController.highlightTime = 4 }
                NotePageDataStore.shared.take(note.id, server: server, by: "ChatGPT")
                for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                // Its tag isn't on the how-to line's row (round 15).
                if let h = canvas.highlight {
                    let spot = CanvasAIHighlight.tag(for: h, outlines: CanvasAIHighlight(highlight: h).outlines)
                    let tag = CGRect(origin: spot, size: CGSize(width: CanvasAIHighlight.tagWidth(h.by), height: CanvasAIHighlight.tagHeight))
                    #expect(!h.rows.isEmpty, "the board's lines of words are known")
                    #expect(!CanvasAIHighlight.sharesRow(tag, with: h.rows), "the tag is on no row of words: \(tag) in \(h.rows)")
                }
                try await shot("12-ai-drew", w, web)
                let fullScreen = await MacEmptyDetailTests.waitForElement("note.fullScreen", in: w)
                let e = try #require(fullScreen ?? MacEmptyDetailTests.element("note.fullScreen", in: w))
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 15)
                try await shot("13-fullscreen", w, web)
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 15)
                // What Export › PNG Image makes of the board.
                if !dark, let png = await canvas.export(.png) { try png.write(to: dir.appending(path: "14-exported-board.png")) }
                // Narrow windows, a shape selected: at 1000 pt and 760 pt every tool is in the bar
                // or in More Tools, and Share and More stay (round 12).
                for (width, name) in [(1000.0, "15-narrow-window"), (760, "15-narrow-760")] {
                    w.setContentSize(CGSize(width: width, height: 700))
                    await MacWindowChromeTests.settle(w, 20)
                    try await select("e.type === 'diamond'")
                    try await shot(name, w, web)
                    try await Self.expectWholeToolbar(w, "picture \(name)")
                }
                w.setContentSize(CGSize(width: 1400, height: 900))
                await MacWindowChromeTests.settle(w, 20)
                try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                // Exported while in dark mode: still a light picture.
                if dark, let png = await canvas.export(.png) { try png.write(to: dir.appending(path: "18-exported-from-dark.png")) }
                // The AI changes what's there: renames a step and adds one; the receipt says what.
                if !dark {
                    try await js("amber._canvas.api.scrollToContent(undefined, { animate: false })")
                    await MacWindowChromeTests.settle(w, 30)
                    var now = (NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any] ?? [:]
                    var all = now["elements"] as? [[String: Any]] ?? []
                    for i in all.indices where all[i]["containerId"] as? String == "ai-rev" {
                        all[i]["text"] = "Finance review"; all[i]["originalText"] = "Finance review"
                        all[i]["version"] = ((all[i]["version"] as? Int) ?? 1) + 1
                    }
                    all += [
                        ["type": "rectangle", "id": "ai-tell", "x": 560, "y": 390, "width": 180, "height": 70, "label": ["text": "Notify team"], "strokeColor": ink, "backgroundColor": "#a5d8ff", "fillStyle": "solid", "roundness": ["type": 3]],
                        ["type": "arrow", "x": 650, "y": 330, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-ok"], "end": ["id": "ai-tell"], "strokeColor": ink],
                    ]
                    now["elements"] = all
                    canvas.highlight = nil
                    NotePageDataStore.shared.take(note.id, server: NotePageData.encode(["values": ["scene": now], "collections": [String: Any]()]), by: "ChatGPT")
                    for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("16-ai-changed", w, web)
                    // Sticky notes on a retro: four made with S's command, each typed into.
                    canvas.highlight = nil
                    try await insert(.retro)
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    // Each under a card in its lane, as people do on a retro: pick the card, press S.
                    for (under, words) in [("Shipped on time", "Demo went well"), ("Demo went well", "Calm launch day"), ("Too many meetings", "Fewer meetings on Fridays"), ("Demo every Friday", "Ask design to join planning")] {
                        try await js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === \(String(reflecting: under))); const c = t && (all.find((e) => e.id === t.containerId) || t); if (c) api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); })()")
                        await MacWindowChromeTests.settle(w, 3)
                        canvas.send(.sticky)
                        for _ in 0..<60 where !canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        try await Task.sleep(for: .milliseconds(150))
                        try await js("const t = document.querySelector('textarea'); if (t) { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); }")
                        for _ in 0..<60 where canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        await MacWindowChromeTests.settle(w, 3)
                    }
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("17-sticky-notes", w, web)
                    // The picture a shared link's page shows (BoardPicture: light, the whole board).
                    if let png = await canvas.export(.png, light: true, page: canvas.title) { try png.write(to: dir.appending(path: "19-shared-board-picture.png")) }
                    if let file = await canvas.export(.excalidraw, page: canvas.title) { try file.write(to: dir.appending(path: "19-shared-board.excalidraw")) }
                    // A drawing sequence (council round 3 asked for it): two labelled boxes joined
                    // by an arrow, then both lined up with Align › Middle (the arrow follows), then
                    // Undo (the move), Redo. One picture per step.
                    try await js("amber._canvas.api.updateScene({ elements: [], captureUpdate: 'IMMEDIATELY' })")
                    canvas.highlight = nil
                    await MacWindowChromeTests.settle(w, 10)
                    try await js("""
                    amber._canvasCommand({ op: 'insert', elements: [
                      { type: 'rectangle', id: 'a', x: 0, y: 160, width: 200, height: 90, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Plan' } },
                      { type: 'rectangle', id: 'b', x: 420, y: 0, width: 200, height: 90, backgroundColor: '#b2f2bb', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Ship' } },
                      { type: 'arrow', x: 204, y: 200, width: 212, height: -150, start: { id: 'a' }, end: { id: 'b' } },
                    ] })
                    """)
                    for _ in 0..<40 where canvas.state.empty { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-1-joined", w, web)
                    try await js("const api = amber._canvas.api; const ids = {}; api.getSceneElements().filter((e) => e.type === 'rectangle').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids }, captureUpdate: 'IMMEDIATELY' })")
                    await MacWindowChromeTests.settle(w, 5)
                    canvas.run(.alignMiddle)
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-2-aligned", w, web)
                    canvas.run(.undo); await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-3-undo", w, web)
                    canvas.run(.redo); await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-4-redo", w, web)
                    // Frames, and Present walking through them (council rounds 4 and 5).
                    try await js("amber._canvas.api.updateScene({ elements: [], captureUpdate: 'IMMEDIATELY' })")
                    await MacWindowChromeTests.settle(w, 5)
                    try await js("""
                    amber._canvasCommand({ op: 'insert', elements: [
                      { type: 'text', id: 'p1', x: 40, y: 40, text: 'Sign-up takes 6 steps', fontSize: 28 },
                      { type: 'rectangle', id: 'p2', x: 40, y: 110, width: 200, height: 120, backgroundColor: '#ffc9c9', fillStyle: 'solid', roundness: { type: 3 }, label: { text: '42% drop at step 4' } },
                      { type: 'rectangle', id: 'p3', x: 270, y: 110, width: 200, height: 120, backgroundColor: '#ffec99', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Email code is slow' } },
                      { type: 'frame', id: 'fp', children: ['p1', 'p2', 'p3'], name: 'The problem' },
                      { type: 'text', id: 'i1', x: 640, y: 40, text: 'One screen, then the app', fontSize: 28 },
                      { type: 'ellipse', id: 'i2', x: 640, y: 120, width: 180, height: 90, backgroundColor: '#b2f2bb', fillStyle: 'solid', label: { text: 'Sign in with Apple' } },
                      { type: 'rectangle', id: 'i3', x: 900, y: 120, width: 180, height: 90, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Open the app' } },
                      { type: 'arrow', x: 822, y: 165, width: 76, height: 0, start: { id: 'i2' }, end: { id: 'i3' } },
                      { type: 'frame', id: 'fi', children: ['i1', 'i2', 'i3'], name: 'The idea' },
                      { type: 'text', id: 'n1', x: 1240, y: 40, text: 'This week', fontSize: 28 },
                      { type: 'rectangle', id: 'n2', x: 1240, y: 110, width: 220, height: 70, backgroundColor: '#eebefa', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Mon: prototype' } },
                      { type: 'rectangle', id: 'n3', x: 1240, y: 200, width: 220, height: 70, backgroundColor: '#eebefa', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Wed: test with 5 people' } },
                      { type: 'frame', id: 'fn', children: ['n1', 'n2', 'n3'], name: 'The plan' },
                    ] })
                    """)
                    for _ in 0..<40 where canvas.state.empty { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("25-frames", w, web)
                    canvas.send(.present(.start))
                    for _ in 0..<40 where canvas.state.present == nil { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 20)
                    try await shot("25-present-1", w, web)
                    canvas.send(.present(.next))
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("25-present-2", w, web)
                    canvas.send(.present(.stop))
                    await MacWindowChromeTests.settle(w, 20)
                    try await shot("25-present-done", w, web)
                }
                // The library (whiteboard council, round 5): two Excalidraw libraries imported and
                // two shapes saved from the board; the popover with them (drawn on its own, as a
                // popover can't be drawn off screen, and placed under its button), then a click on
                // a tile: the item in the middle of the view, beside the drawing, selected.
                let keptLibrary = CanvasLibrary.shared
                let lib = CanvasLibrary(folder: nil)
                CanvasLibrary.shared = lib
                defer { CanvasLibrary.shared = keptLibrary }
                canvas.highlight = nil
                try await insert(.flowchart)
                _ = lib.importLibrary(Data(Self.basicShapesLibrary.utf8))
                _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
                for shape in ["e.type === 'ellipse' && e.backgroundColor === '#b2f2bb' && e.y < 100", "e.type === 'diamond'"] {
                    try await select(shape)
                    await canvas.saveSelectionToLibrary(lib)
                }
                try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                canvas.notice = nil
                await canvas.drawThumbnails(lib)
                await MacWindowChromeTests.settle(w, 10)
                let popover = try await Self.libraryPopoverPicture(canvas: canvas, library: lib, dark: dark)
                try #require(popover.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-popover-\(dark ? "dark" : "light").png"))
                if !dark {
                    let empty = try await Self.libraryPopoverPicture(canvas: canvas, library: CanvasLibrary(folder: nil), dark: dark)
                    try #require(empty.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-empty-light.png"))
                }
                // The popover where it opens, under the toolbar's Library button.
                let found = await MacEmptyDetailTests.waitForElement("canvas.tool.library", in: w)
                if let button = found ?? MacEmptyDetailTests.element("canvas.tool.library", in: w),
                   let onScreen = (button.value(forKey: "accessibilityFrame") as? NSValue)?.rectValue {
                    let frame = w.convertFromScreen(onScreen)
                    if frame.width > 0 {
                        let open = try Self.placed(popover, under: frame, on: try await capture(w, web), size: w.frame.size, dark: dark)
                        try #require(open.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-open-\(dark ? "dark" : "light").png"))
                    }
                }
                let store = try #require(lib.items.first { $0.name == "Data storage" })
                canvas.insert(store)
                for _ in 0..<60 where canvas.state.selection.isEmpty { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 10)
                try await shot("23-library-inserted", w, web)
                // Note cards (whiteboard council, round 6): a launch flowchart whose first and last
                // steps are joined to the notes behind them, written as an AI writes cards (by the
                // notes' titles); then one card selected; then (light) one of the notes deleted
                // while the board is open.
                try await js("amber._canvas.api.updateScene({ elements: [], appState: { selectedElementIds: {} }, captureUpdate: 'IMMEDIATELY' })")
                canvas.highlight = nil
                for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                func step(_ id: String, _ type: String = "rectangle", x: Double, y: Double, w: Double = 200, h: Double = 80, _ text: String, _ fill: String) -> [String: Any] {
                    var e: [String: Any] = ["type": type, "id": id, "x": x, "y": y, "width": w, "height": h, "label": ["text": text], "strokeColor": ink, "backgroundColor": fill, "fillStyle": "solid"]
                    if type == "rectangle" { e["roundness"] = ["type": 3] }
                    return e
                }
                let launch: [[String: Any]] = [
                    ["type": "text", "x": -30, "y": -300, "text": canvas.title, "fontSize": 32, "strokeColor": ink],
                    step("draft", x: 0, y: 0, "Draft the post", "#a5d8ff"),
                    step("ready", "diamond", x: 280, y: -14, w: 180, h: 108, "Ready?", "#ffec99"),
                    step("publish", x: 540, y: 0, "Publish", "#b2f2bb"),
                    step("fix", x: 280, y: 170, w: 180, h: 70, "Fix it", "#ffc9c9"),
                    ["type": "arrow", "x": 202, "y": 40, "width": 76, "height": 0, "start": ["id": "draft"], "end": ["id": "ready"], "strokeColor": ink],
                    ["type": "arrow", "x": 462, "y": 40, "width": 76, "height": 0, "start": ["id": "ready"], "end": ["id": "publish"], "strokeColor": ink, "label": ["text": "yes"]],
                    ["type": "arrow", "x": 370, "y": 96, "width": 0, "height": 72, "points": [[0, 0], [0, 72]], "start": ["id": "ready"], "end": ["id": "fix"], "strokeColor": ink, "label": ["text": "no"]],
                    // The notes, as an AI writes a card: a shape whose customData names the note.
                    ["type": "rectangle", "id": "plan", "x": -30, "y": -200, "width": 260, "height": 111, "customData": ["pintoNote": "Launch plan"]],
                    ["type": "rectangle", "id": "press", "x": 510, "y": -200, "width": 260, "height": 111, "customData": ["pintoNote": "Press list"]],
                    ["type": "arrow", "x": 100, "y": -86, "width": 0, "height": 82, "points": [[0, 0], [0, 82]], "start": ["id": "plan"], "end": ["id": "draft"], "strokeColor": ink, "strokeStyle": "dashed", "startArrowhead": NSNull(), "endArrowhead": NSNull()],
                    ["type": "arrow", "x": 640, "y": -86, "width": 0, "height": 82, "points": [[0, 0], [0, 82]], "start": ["id": "press"], "end": ["id": "publish"], "strokeColor": ink, "strokeStyle": "dashed", "startArrowhead": NSNull(), "endArrowhead": NSNull()],
                ]
                let json = String(decoding: try JSONSerialization.data(withJSONObject: launch), as: UTF8.self)
                try await js("amber._canvasCommand({ op: 'insert', elements: \(json) })")
                // Until both cards have found their notes (they then name them by id). Each pass
                // takes a picture of the page, which lets through what an offscreen window holds
                // back (round 11: the dark pass once waited it out with the cards drawn but the
                // page's report still naming them by title).
                for _ in 0..<150 where canvas.state.cardNotes.count < 2 || canvas.state.cardNotes.contains(where: { UUID(uuidString: $0) == nil }) {
                    _ = try? await web.takeSnapshot(configuration: nil)
                    await MacWindowChromeTests.settle(w, 2)
                }
                #expect(Set(canvas.state.cardNotes) == [planNote.id.uuidString, pressNote.id.uuidString], "both cards found their notes")
                await MacWindowChromeTests.settle(w, 20)
                try await shot("24-note-card-board", w, web)
                try await js("const api = amber._canvas.api, ids = {}, groups = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote === '\(planNote.id.uuidString)').forEach((e) => { ids[e.id] = true; if (e.groupIds[0]) groups[e.groupIds[0]] = true; }); api.updateScene({ appState: { selectedElementIds: ids, selectedGroupIds: groups } })")
                for _ in 0..<50 where canvas.state.card == nil { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 5)
                try await shot("24-note-card-selected", w, web)
                if !dark {
                    // Deleted while the board is open: its card says so, quietly.
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } })")
                    pressNote.trashedAt = .now
                    pressNote.touchKeepingDate()
                    try c.mainContext.save()
                    for _ in 0..<100 {
                        let said = try? await web.evaluateJavaScript("(() => amber._canvas.api.getSceneElements().some((e) => e.customData && e.customData.pintoCard === 'preview' && e.text === 'Note deleted'))()") as? Bool
                        if said == true { break }
                        await MacWindowChromeTests.settle(w, 2)
                    }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("24-note-card-deleted", w, web)
                    // Its card offers Restore Note (round 6), and the note comes back.
                    try await js("const api = amber._canvas.api, ids = {}, groups = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote === '\(pressNote.id.uuidString)').forEach((e) => { ids[e.id] = true; if (e.groupIds[0]) groups[e.groupIds[0]] = true; }); api.updateScene({ appState: { selectedElementIds: ids, selectedGroupIds: groups } })")
                    for _ in 0..<50 where canvas.state.card == nil { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 5)
                    try await shot("24-note-card-restore-offered", w, web)
                    // "Note restored" held while the picture is taken (rounds 8 and 12 caught it
                    // gone, then fading: the picture takes longer than the line shows).
                    CanvasController.noticeHold = .seconds(60)
                    defer { CanvasController.noticeHold = nil }
                    canvas.restoreCard(pressNote.id.uuidString)
                    for _ in 0..<100 {
                        let back = try? await web.evaluateJavaScript("(() => !amber._canvas.api.getSceneElements().some((e) => e.customData && e.customData.pintoCard === 'preview' && e.text === 'Note deleted'))()") as? Bool
                        if back == true { break }
                        await MacWindowChromeTests.settle(w, 2)
                    }
                    #expect(canvas.notice == "Note restored")
                    await MacWindowChromeTests.settle(w, 6)
                    let restored = try await capture(w, web)
                    try #require(restored.representation(using: .png, properties: [:])).write(to: dir.appending(path: "24-note-card-restored-light.png"))
                    // Whole, not fading: its words are as dark as the toolbar's.
                    let found = await MacEmptyDetailTests.waitForElement("canvas.notice", in: w)
                    let toast = try #require(found ?? MacEmptyDetailTests.element("canvas.notice", in: w), "the notice shows")
                    let at = w.convertFromScreen(try #require((toast.value(forKey: "accessibilityFrame") as? NSValue)?.rectValue))
                    #expect(Self.darkest(in: at, of: restored, window: w.frame.size) < 90, "\"Note restored\" at full strength in the picture")
                    CanvasController.noticeHold = nil
                    canvas.notice = nil
                }
                // A mind map grown with Tab (round 6: "Tab for a joined child branch").
                try await js("amber._canvas.api.updateScene({ elements: [], appState: { selectedElementIds: {}, selectedGroupIds: {} }, captureUpdate: 'IMMEDIATELY' })")
                canvas.highlight = nil
                for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                try await insert(.mindMap)
                try await js("(() => { const api = amber._canvas.api, t = api.getSceneElements().find((e) => e.type === 'text' && e.containerId && e.text === 'When'); api.updateScene({ appState: { selectedElementIds: { [t.containerId]: true } } }); return 1; })()")
                await MacWindowChromeTests.settle(w, 5)
                try await js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }))")
                for _ in 0..<50 where !canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                try await js("(() => { const t = document.activeElement; if (t && t.tagName === 'TEXTAREA') { t.value = 'Next Friday'; t.dispatchEvent(new Event('input', { bubbles: true })); } return 1; })()")
                await MacWindowChromeTests.settle(w, 10)
                try await shot("26-mindmap-tab", w, web)
                try await js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))")
                if !dark {
                    // On boards (round 8): the launch board again, then its "Launch plan" card
                    // opened; the note's foot names the board it's on.
                    try await js("amber._canvas.api.updateScene({ elements: [], appState: { selectedElementIds: {}, selectedGroupIds: {} }, captureUpdate: 'IMMEDIATELY' })")
                    for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    try await js("amber._canvasCommand({ op: 'insert', elements: \(json) })")
                    for _ in 0..<150 where canvas.state.cardNotes.count < 2 || canvas.state.cardNotes.contains(where: { UUID(uuidString: $0) == nil }) {
                        await MacWindowChromeTests.settle(w, 2)
                    }
                    _ = try? await web.evaluateJavaScript("amber._flush && amber._flush(); 0")
                    await MacWindowChromeTests.settle(w, 40)
                    canvas.openCard(planNote.id.uuidString)
                    await MacWindowChromeTests.settle(w, 40)
                    w.displayIfNeeded()
                    try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])).write(to: dir.appending(path: "27-note-on-boards-light.png"))
                }
            }
        }
    }

    /// Every name in the library's last row shows above its footer, with one group, three and a
    /// long library that scrolls (round 12, library-sync-mac: "Import Library…" and "8 items" sat
    /// over the Basic shapes names; the grid's height left out the gap under each heading).
    @Test func theLibrarysLastNamesShowAboveItsFooter() async throws {
        let box: [[String: Any]] = [["type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 60, "backgroundColor": "#a5d8ff", "fillStyle": "solid"]]
        func library(saved: Int, files: Bool) -> CanvasLibrary {
            let lib = CanvasLibrary(folder: nil)
            if files {
                _ = lib.importLibrary(Data(Self.basicShapesLibrary.utf8), source: "Basic shapes")
                _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8), source: "Data flow")
            }
            for i in 0..<saved { _ = lib.add(elements: box, name: "Saved \(i)") }
            return lib
        }
        for (lib, scrolls) in [(library(saved: 3, files: true), false), (library(saved: 2, files: false), false), (library(saved: 9, files: false), false), (library(saved: 11, files: true), true)] {
            let grid = CanvasLibraryGrid(lib.items)
            let search: CGFloat = CanvasLibraryGrid.showsSearch(lib.items.count) ? 34 : 0
            let size = CGSize(width: CanvasLibraryPopover.width, height: CanvasLibraryPopover.gridHeight(grid) + 44 + search)
            let ax = OffscreenAX(CanvasLibraryPopover(canvas: CanvasController(), library: lib).frame(width: size.width, height: size.height, alignment: .top), size: size)
            defer { ax.close() }
            await ax.settle(400)
            let footer = try #require(ax.find("canvas.library.import"), "\(ax.ids())")
            let items = ax.all("canvas.library.item")
            #expect(!items.isEmpty)
            let groups = grid.groups.map(\.title)
            if scrolls {
                // Too many to show: the grid stops at about four rows and scrolls.
                let row = CanvasLibraryPopover.tile + CanvasLibraryPopover.label
                #expect(CanvasLibraryPopover.gridHeight(grid) == 4.4 * (row + CanvasLibraryPopover.spacing) + CanvasLibraryPopover.padding, "a long library scrolls: \(groups)")
            } else {
                for item in items {
                    #expect(item.frame.maxY <= footer.frame.minY - 4, "\(item.text) ends at \(item.frame.maxY), the footer starts at \(footer.frame.minY): \(groups)")
                }
            }
        }
    }

    /// A long library scrolled so a row of tiles runs up to the search field: the grid is cut a gap
    /// below the field and fades in, so no tile shows under or against it (round 14,
    /// library-sync-mac-end: Lane and Risk scrolled up under the field and touched its edge).
    @Test func theLibrarysTilesStayClearOfItsSearchField() async throws {
        let lib = CanvasLibrary(folder: nil)
        _ = lib.importLibrary(Data(Self.basicShapesLibrary.utf8), source: "Basic shapes")
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8), source: "Data flow")
        let box: [[String: Any]] = [["type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 60, "backgroundColor": "#a5d8ff", "fillStyle": "solid"]]
        for i in 0..<11 { _ = lib.add(elements: box, name: "Saved \(i)") }
        #expect(CanvasLibraryGrid.showsSearch(lib.items.count))
        let grid = CanvasLibraryGrid(lib.items)
        let size = CGSize(width: CanvasLibraryPopover.width, height: CanvasLibraryPopover.gridHeight(grid) + 44 + 34)
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: CanvasController(), library: lib)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(Color.white), size: size)
        defer { ax.close() }
        await ax.settle(500)
        let field = try #require(ax.find("canvas.library.search"), "\(ax.ids())")
        let v = try #require(ax.window.contentView)
        let scroll = try #require(MacWindowChromeTests.find(NSScrollView.self, in: v))
        // The first row's tiles start under the heading (padding, heading, gap); scrolled so they
        // start 20 points above the grid's top, their middles at its top.
        let first = CanvasLibraryPopover.padding + CanvasLibraryPopover.heading + CanvasLibraryPopover.spacing
        let doc = try #require(scroll.documentView)
        scroll.contentView.scroll(to: NSPoint(x: 0, y: doc.isFlipped ? first + 20 : doc.frame.height - scroll.contentView.bounds.height - first - 20))
        scroll.reflectScrolledClipView(scroll.contentView)
        await ax.settle(200)
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        // From the field's foot down: the gap is the popover's white; lower down, the tiles show.
        let top = scroll.convert(scroll.bounds, to: nil).maxY // The grid's top, from the bottom left.
        let tiles = CGRect(x: CanvasLibraryPopover.padding + 4, y: 0, width: CanvasLibraryPopover.tile - 8, height: 1)
        let below = Self.darkest(in: tiles.offsetBy(dx: 0, dy: top - 30).union(tiles.offsetBy(dx: 0, dy: top - 22)), of: rep, window: size)
        // The field's foot, from the window's top (its frame is the screen's, from the top left).
        let screen = NSScreen.screens.first?.frame.height ?? 0
        let foot = field.frame.maxY - (screen - ax.window.frame.maxY)
        #expect(foot <= size.height - top + 1, "the grid starts under the field: \(foot) \(size.height - top)")
        // From a point under the field's edge to the end of the gap.
        let band = tiles.offsetBy(dx: 0, dy: top - CanvasLibraryPopover.searchGap + 0.5).union(tiles.offsetBy(dx: 0, dy: size.height - foot - 2))
        let gap = Self.darkest(in: band, of: rep, window: size)
        if let dir = ProcessInfo.processInfo.environment["LIBRARY_GAP_SHOT"] { try rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: dir).appending(path: "library-gap.png")) }
        #expect(gap >= 253, "nothing of the tiles in the gap under the search field: \(gap)")
        #expect(below <= 248, "the tiles do show lower down (the test sees them): \(below)")
    }

    /// The darkest grey (0 to 255, by its brightest channel) in `rect` (the window's points, from
    /// the bottom left) of a window's picture `rep` (from the top left), the window `size` points.
    static func darkest(in rect: CGRect, of rep: NSBitmapImageRep, window size: CGSize) -> Int {
        let scale = CGFloat(rep.pixelsWide) / size.width
        let x0 = max(0, Int(rect.minX * scale)), x1 = min(rep.pixelsWide, Int(rect.maxX * scale))
        let y0 = max(0, Int((size.height - rect.maxY) * scale)), y1 = min(rep.pixelsHigh, Int((size.height - rect.minY) * scale))
        var low = 255
        for y in stride(from: y0, to: y1, by: 1) {
            for x in stride(from: x0, to: x1, by: 1) {
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                low = min(low, Int(max(c.redComponent, c.greenComponent, c.blueComponent) * 255))
            }
        }
        return low
    }

    /// The library popover's view drawn on its own at 2x, on a popover's plain card.
    static func libraryPopoverPicture(canvas: CanvasController, library: CanvasLibrary, dark: Bool, scrolledToEnd: Bool = false) async throws -> NSBitmapImageRep {
        let search: CGFloat = CanvasLibraryGrid.showsSearch(library.items.count) ? 34 : 0
        let height = library.items.isEmpty ? 120 : CanvasLibraryPopover.gridHeight(CanvasLibraryGrid(library.items)) + 44 + search
        let size = CGSize(width: CanvasLibraryPopover.width, height: height)
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: library)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(Color(nsColor: .windowBackgroundColor)), size: size, dark: dark)
        defer { ax.close() }
        await ax.settle(600)
        let v = try #require(ax.window.contentView)
        if scrolledToEnd, let scroll = MacWindowChromeTests.find(NSScrollView.self, in: v), let doc = scroll.documentView {
            // The grid scrolled to its last row, as someone scrolling a long library sees it.
            let end = doc.isFlipped ? max(0, doc.frame.height - scroll.contentView.bounds.height) : 0
            scroll.contentView.scroll(to: NSPoint(x: 0, y: end))
            scroll.reflectScrolledClipView(scroll.contentView)
            await ax.settle(200)
        }
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        return rep
    }

    /// `popover` drawn over a window's picture (the window `size` in points) as it opens: under
    /// `button` (in the window's points), with its arrow, rounded corners and shadow.
    static func placed(_ popover: NSBitmapImageRep, under button: CGRect, on window: NSBitmapImageRep, size points: CGSize, dark: Bool) throws -> NSBitmapImageRep {
        let scale = CGFloat(window.pixelsWide) / points.width
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: window.pixelsWide, pixelsHigh: window.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = points
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        window.draw(in: CGRect(origin: .zero, size: points))
        let size = CGSize(width: CGFloat(popover.pixelsWide) / scale, height: CGFloat(popover.pixelsHigh) / scale), arrow: CGFloat = 9
        let x = min(max(button.midX - size.width / 2, 8), points.width - size.width - 8)
        let card = CGRect(x: x, y: button.minY - 6 - arrow - size.height, width: size.width, height: size.height)
        let shape = NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12)
        let tip = NSBezierPath()
        tip.move(to: CGPoint(x: button.midX - arrow, y: card.maxY - 1))
        tip.line(to: CGPoint(x: button.midX, y: card.maxY + arrow))
        tip.line(to: CGPoint(x: button.midX + arrow, y: card.maxY - 1))
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
    #endif

    #if os(iOS)
    /// The canvas on iPhone, edge to edge, its dock at the foot, light and dark, with a shape
    /// selected and the bar above it. Drawn only when CANVAS_SHOTS is set (TEST_RUNNER_CANVAS_SHOTS=dir).
    nonisolated(unsafe) static var keptStores: [ModelContainer] = []

    @Test func iPhonePictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["CANVAS_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Publishing flow"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": Self.flowchart], "collections": [String: Any]()])
        try c.mainContext.save()
        // One window and one store for both: a second store's note crashed SwiftData ("destroyed by
        // calling ModelContext.reset") while something still held the first one's.
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = UIHostingController(rootView: NavigationStack {
            NoteDetailView(note: note, controller: EditorController(), onNewNote: {})
        }.modelContainer(c).tint(Color(PColor.paneAccent)))
        window.isHidden = false
        // The store outlives the test: the hidden window still drew its note after a store that
        // had gone, and SwiftData stopped the run.
        Self.keptStores.append(c)
        defer { window.isHidden = true; window.rootViewController = nil }
        try await Task.sleep(for: .seconds(3))
        func find(_ v: UIView) -> WKWebView? { (v as? WKWebView) ?? v.subviews.lazy.compactMap(find).first }
        let web = try #require(find(window))
        _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85 }); 1")
        try await Task.sleep(for: .seconds(0.5))
        _ = try await web.evaluateJavaScript("amber._canvas.api.updateScene({ appState: { selectedElementIds: { draft: true } } }); 1")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            try await Task.sleep(for: .seconds(1.5))
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            let url = dir.appending(path: "canvas-iphone-\(dark ? "dark" : "light").png")
            try #require(image.pngData()).write(to: url)
            print("CANVAS_SHOT \(url.path)")
        }
    }
    #endif

    // MARK: The bar over the selection

    @Test func theSelectionBarFloatsJustAboveTheSelectionAndStaysInside() {
        let bar = CGSize(width: 200, height: 40), area = CGSize(width: 800, height: 600)
        let above = CanvasSelectionBar.position(bounds: CGRect(x: 300, y: 300, width: 100, height: 50), bar: bar, area: area)
        let gap = CanvasSelectionBar.gap
        #if os(macOS)
        #expect(gap >= 24, "clear of the rotate handle above the selection (whiteboard council, round 1)")
        #endif
        #expect(abs(above.x - 350) < 0.01 && abs(above.y - (300 - gap - 20)) < 0.01, "just above, centred")
        let below = CanvasSelectionBar.position(bounds: CGRect(x: 300, y: 10, width: 100, height: 50), bar: bar, area: area)
        #expect(abs(below.y - (60 + gap + 20)) < 0.01, "no room above: below it (\(below.y))")
        let edge = CanvasSelectionBar.position(bounds: CGRect(x: -50, y: 300, width: 60, height: 50), bar: bar, area: area)
        #expect(abs(edge.x - 108) < 0.01, "kept inside the canvas (\(edge.x))")
        // Something drawn just above (an arrow coming in, a shape): it slides along, or goes
        // below, or beside, to cover none of it (whiteboard council, round 2, 07).
        let box = CGRect(x: 300, y: 300, width: 100, height: 50)
        let arrowIn = CanvasObstacle.line([CGPoint(x: 350, y: 200), CGPoint(x: 350, y: 298)])
        let slid = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [arrowIn])
        #expect(abs(slid.y - above.y) < 0.01 && abs(slid.x - 350) > 100, "above, slid clear of the arrow: \(slid)")
        let shapeAbove = CanvasObstacle.box(CGRect(x: 0, y: 200, width: 800, height: 60))
        let under = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [shapeAbove, arrowIn])
        #expect(abs(under.y - (350 + gap + 20)) < 0.01, "below it: \(under)")
        let arrowOut = CanvasObstacle.line([CGPoint(x: 350, y: 352), CGPoint(x: 350, y: 500)])
        let beside = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [shapeAbove, arrowIn, arrowOut, .box(CGRect(x: 0, y: 360, width: 800, height: 200))])
        #expect(abs(beside.y - 325) < 0.01 && (beside.x < 300 || beside.x > 400), "beside it: \(beside)")
        // A shape as wide as the selection right above it, and arrows coming in from above and
        // the right: off the corner, covering none of them (whiteboard council, round 5, 07).
        let start = CanvasObstacle.box(CGRect(x: 300, y: 180, width: 100, height: 60))
        let fromRight = CanvasObstacle.line([CGPoint(x: 600, y: 330), CGPoint(x: 402, y: 325)])
        let done = CanvasObstacle.box(CGRect(x: 300, y: 420, width: 100, height: 60))
        let fromLeft = CanvasObstacle.line([CGPoint(x: 0, y: 325), CGPoint(x: 298, y: 325)])
        let all = [start, arrowIn, fromRight, done, fromLeft]
        let corner = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: all)
        let cr = CGRect(x: corner.x - 100, y: corner.y - 20, width: 200, height: 40)
        #expect(!all.contains { $0.hits(cr) }, "off a corner, clear of everything: \(corner)")
        #expect(CanvasObstacle.line([CGPoint(x: 0, y: 0), CGPoint(x: 100, y: 100)]).hits(CGRect(x: 45, y: 45, width: 10, height: 10)))
        #expect(!CanvasObstacle.line([CGPoint(x: 0, y: 0), CGPoint(x: 100, y: 100)]).hits(CGRect(x: 70, y: 0, width: 20, height: 20)), "a diagonal's box isn't the line")
        var state = CanvasState()
        state.selection = ["rectangle"]
        state.bounds = CGRect(x: 0, y: 0, width: 10, height: 10)
        #expect(state.showsSelectionBar)
        state.busy = true
        #expect(!state.showsSelectionBar, "hidden while a handle is dragged")
    }

    @Test func swatchesShowAsTheCanvasDrawsThemInTheDark() {
        // Ink turns to a light cream, white to black, and a picked colour round-trips.
        let ink = CanvasStyle.rgb("#2a1d10")!
        #expect(ink.0 < 0.2)
        #expect(CanvasStyle.hex(CanvasStyle.shown("#ffffff", dark: false)!, dark: false) == "#ffffff")
        #expect(CanvasStyle.hex(CanvasStyle.shown("#ffffff", dark: true)!, dark: false) == "#000000")
        let blue = CanvasStyle.hex(CanvasStyle.shown("#1971c2", dark: true)!, dark: true)
        let (r, g, b) = CanvasStyle.rgb(blue)!
        let (r0, g0, b0) = CanvasStyle.rgb("#1971c2")!
        #expect(abs(r - r0) + abs(g - g0) + abs(b - b0) < 0.06, "\(blue)")
    }
}

extension CanvasNativeUITests {
    /// An exported picture leaves the gap round an arrow's label that the canvas draws (whiteboard
    /// council, rounds 4 to 7: in 14 and on the share page, "No" sat on its line).
    @Test func anExportedArrowLabelHasItsGap() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 0, "y": 0, "width": 120, "height": 80],
            ["type": "rectangle", "id": "b", "x": 300, "y": 0, "width": 120, "height": 80],
            ["type": "arrow", "x": 122, "y": 40, "width": 176, "height": 0, "start": ["id": "a"], "end": ["id": "b"], "label": ["text": "No"]],
        ]))
        defer { j.close() }
        try await j.ready()
        try await Task.sleep(for: .milliseconds(800))
        _ = try await j.js("""
        (async () => { const api = amber._canvas.api, els = api.getSceneElements(), t = els.find((e) => e.type === 'text' && e.text === 'No'), a = els.find((e) => e.id === t.containerId);
          const b64 = await amber._canvasExport('png', false);
          const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
          // Where the line would run, just left and right of the word: paper, not ink.
          const minX = Math.min(...els.map((e) => e.x)), minY = Math.min(...els.map((e) => e.y));
          const ink = (x, y) => { let n = 0; for (let dy = -2; dy <= 2; dy++) { const d = g.getImageData(Math.round((x - minX + 32) * 2), Math.round((y - minY + 32) * 2) + dy, 1, 1).data; if (d[0] < 128) n++; } return n; };
          const y = a.y + a.points[0][1];
          // And the word itself is there: ink inside its box.
          let word = 0; for (let x = t.x; x < t.x + t.width; x += 1) for (let yy = t.y + 2; yy < t.y + t.height - 2; yy += 1) { const d = g.getImageData(Math.round((x - minX + 32) * 2), Math.round((yy - minY + 32) * 2), 1, 1).data; if (d[0] < 128) word++; }
          window._gap = JSON.stringify({ left: ink(t.x - 2, y), right: ink(t.x + t.width + 2, y), line: ink(a.x + 10, y), word });
        })(); 0
        """)
        var got: [String: Int] = [:]
        for _ in 0..<50 {
            if let s = try await j.js("window._gap || ''") as? String, !s.isEmpty { got = (try JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Int]) ?? [:]; break }
            try await Task.sleep(for: .milliseconds(100))
        }
        #expect((got["line"] ?? 0) > 0, "the line itself is drawn: \(got)")
        #expect(got["left"] == 0 && got["right"] == 0, "a gap either side of the label: \(got)")
        #expect((got["word"] ?? 0) > 20, "the label's word is drawn, over the gap: \(got)")
    }
}

// MARK: A board shared with people (Pane/Collab/CollabBoard.swift, canvas-stack/src/shared.js)

extension CanvasNativeUITests {
    static let twoBoxes: [[String: Any]] = [
        ["type": "rectangle", "id": "a", "x": 80, "y": 100, "width": 200, "height": 100],
        ["type": "rectangle", "id": "b", "x": 400, "y": 100, "width": 200, "height": 100],
    ]

    /// The page's element `id` as it holds it (deleted ones too), or nil.
    static func element(_ j: Joined, _ id: String) async throws -> [String: Any]? {
        let s = try await j.js("JSON.stringify(amber._canvas.api.getSceneElementsIncludingDeleted().find((e) => e.id === '\(id)') || null)") as? String ?? "null"
        return try JSONSerialization.jsonObject(with: Data(s.utf8), options: .fragmentsAllowed) as? [String: Any]
    }

    static func json(_ j: Joined, _ expression: String) async throws -> [String: Any] {
        let s = try await j.js("JSON.stringify(\(expression))") as? String ?? "{}"
        return (try JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any]) ?? [:]
    }

    /// Someone else's change, as the shared document hands it to the page: the whole drawing, each
    /// element as their device saved it. What you're dragging stays where your hand is, your
    /// selection stays, and the rest lands. Let go, and their newer edit of it lands too.
    @Test func othersDrawingLandsWithoutTakingWhatYouHold() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes))
        defer { j.close() }
        try await j.ready()
        var deltas: [[[String: Any]]] = []
        j.canvas.onBoardDelta = { e, _ in deltas.append(e) }
        j.canvas.share(true)
        await j.until("the page has the drawing as known") { true }
        // You're dragging "a". The engine takes app state on a later turn (React): wait until it has,
        // or the remote scene below can arrive first (half the runs failed on 2026-11-15).
        func dragging(_ on: Bool) async throws {
            _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { a: true }, selectedElementsAreBeingDragged: \(on) } }); 1")
            for _ in 0..<100 where try await j.js("amber._canvas.api.getAppState().selectedElementsAreBeingDragged") as? Bool != on {
                try await Task.sleep(for: .milliseconds(10))
            }
        }
        try await dragging(true)
        var a = try #require(try await Self.element(j, "a")), b = try #require(try await Self.element(j, "b"))
        let aX = a["x"] as? Double
        a["x"] = 999; a["version"] = (a["version"] as? Int ?? 1) + 5
        b["x"] = 450; b["version"] = (b["version"] as? Int ?? 1) + 1; b["strokeColor"] = "#e03131"
        var c = b
        c["id"] = "c"; c["x"] = 700; c["index"] = "a5"
        j.canvas.remote(scene: CollabBoard.scene(elements: [a, b, c], settings: ["viewBackgroundColor": "#ffffff"]))
        for _ in 0..<100 where try await Self.element(j, "c") == nil { try await Task.sleep(for: .milliseconds(30)) }

        let landed = try await Self.element(j, "b")
        #expect(landed?["x"] as? Double == 450 && landed?["strokeColor"] as? String == "#e03131", "their change lands")
        #expect(try await Self.element(j, "c")?["x"] as? Double == 700, "their new shape lands")
        #expect(try await Self.element(j, "a")?["x"] as? Double == aX, "what you're dragging stays in your hand")
        #expect(try await j.js("JSON.stringify(amber._canvas.api.getAppState().selectedElementIds)") as? String == "{\"a\":true}", "your selection stays")

        // Let go: their newer edit of it lands (a drag of yours would have made yours newer).
        try await dragging(false)
        j.canvas.remote(scene: CollabBoard.scene(elements: [a, b, c], settings: [:]))
        for _ in 0..<100 where try await Self.element(j, "a")?["x"] as? Double != 999 { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.element(j, "a")?["x"] as? Double == 999)

        // What came isn't sent back as yours; what you change is, as the elements that changed.
        try await Task.sleep(for: .milliseconds(400))
        #expect(!deltas.joined().contains { ["b", "c"].contains($0["id"] as? String ?? "") }, "\(deltas.joined().compactMap { $0["id"] as? String })")
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { c: true } } }); 1")
        await j.until("c is selected") { j.canvas.state.selection == ["rectangle"] }
        j.canvas.set(.strokeColor, .text("#2f9e44"))
        await j.until("the change goes out within a quarter second") { deltas.last?.contains { $0["id"] as? String == "c" && $0["strokeColor"] as? String == "#2f9e44" } == true }
        #expect(deltas.last?.count == 1, "only what changed: \(deltas.last?.compactMap { $0["id"] as? String } ?? [])")
        // The page's own store isn't written while it's shared.
        let saves = j.rig.saves
        try await Task.sleep(for: .milliseconds(1200))
        #expect(j.rig.saves == saves)
    }

    /// An AI's short form, merged on two devices: both fill it out the same way (the label's id,
    /// seeds and nonces from the element's own id), so a shape gets one label, not one from each.
    @Test func anAIsShortFormIsFilledOutTheSameOnEveryDevice() async throws {
        let short: [String: Any] = ["type": "rectangle", "id": "plan", "x": 0, "y": 300, "width": 180, "height": 70, "label": ["text": "Plan"]]
        var made: [[[String: Any]]] = []
        for _ in 0..<2 {
            let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes))
            defer { j.close() }
            try await j.ready()
            var deltas: [[String: Any]] = []
            j.canvas.onBoardDelta = { e, _ in deltas += e }
            j.canvas.share(true)
            let a = try #require(try await Self.element(j, "a")), b = try #require(try await Self.element(j, "b"))
            j.canvas.remote(scene: CollabBoard.scene(elements: [a, b, short], settings: [:]))
            await j.until("the filled-out shape and its label go back as this device's") { deltas.contains { $0["id"] as? String == "plan-label" } }
            made.append(deltas.filter { ["plan", "plan-label"].contains($0["id"] as? String ?? "") }.sorted { ($0["id"] as! String) < ($1["id"] as! String) })
        }
        let stamps = made.map { $0.map { "\($0["id"]!):\($0["seed"]!):\($0["versionNonce"]!)" } }
        #expect(stamps[0].count == 2 && stamps[0] == stamps[1], "\(stamps)")
        #expect(made[0].last?["text"] as? String == "Plan" && made[0].last?["containerId"] as? String == "plan")
    }

    /// On a dark board each person shows in the dark shade of their colour, the same hue as on a
    /// light board (round 10: Emil was slate blue on a light board, mauve on a dark one).
    @Test(arguments: [false, true]) func aPersonShowsInTheirShadeForTheBoard(dark: Bool) async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes), dark: dark)
        defer { j.close() }
        try await j.ready()
        j.canvas.share(true)
        let (light, deep) = CollabSession.palette[2]
        j.canvas.show(peers: [BoardPeer(id: UUID(), name: "Emil", color: CollabSession.hex(light), dark: CollabSession.hex(deep), pointer: CGPoint(x: 300, y: 260), selection: ["b"])])
        try await Task.sleep(for: .milliseconds(300))
        let r = try await Self.json(j, "(() => { const p = document.querySelector('.pinto-peer-pointer'), f = document.querySelector('.pinto-peer-flag'), b = document.querySelector('.pinto-peer-box'); return { theme: amber._canvas.api.getAppState().theme, fill: p.querySelector('path').getAttribute('fill'), flag: getComputedStyle(f).backgroundColor, box: getComputedStyle(b).borderTopColor }; })()")
        let want = dark ? deep : light
        let css = "rgb(\(want >> 16 & 0xFF), \(want >> 8 & 0xFF), \(want & 0xFF))"
        #expect(r["theme"] as? String == (dark ? "dark" : "light"))
        #expect(r["fill"] as? String == CollabSession.hex(want) && r["flag"] as? String == css && r["box"] as? String == css, "\(r)")
    }

    /// Everyone else on the board: a solid pointer in their colour, edged white, with their first
    /// name on a small flag, and an outline round what they've selected. In the board's own
    /// coordinates, so it stays on the same spot as you zoom or scroll; nothing in it takes a click.
    @Test func othersPointersAndSelectionsAreDrawnOnTheBoard() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes))
        defer { j.close() }
        try await j.ready()
        j.canvas.share(true)
        let sara = BoardPeer(id: TestPeople.sara, name: "Sara", color: TestPeople.color(TestPeople.sara).light, pointer: CGPoint(x: 300, y: 260), selection: ["b"])
        j.canvas.show(peers: [sara])
        await j.until("Sara is drawn") { true }
        try await Task.sleep(for: .milliseconds(300))
        let where_ = """
        (() => {
          const s = amber._canvas.api.getAppState(), z = s.zoom.value;
          const p = document.querySelector('.pinto-peer-pointer'), f = document.querySelector('.pinto-peer-flag'), box = document.querySelector('.pinto-peer-box');
          const pr = p.getBoundingClientRect(), br = box.getBoundingClientRect(), fs = getComputedStyle(f);
          const hit = document.elementFromPoint(pr.left + 4, pr.top + 8);
          return { px: pr.left, py: pr.top, wantX: (300 + s.scrollX) * z + s.offsetLeft - 1.5, wantY: (260 + s.scrollY) * z + s.offsetTop - 1.5,
                   bx: br.left, by: br.top, bw: br.width, wantBX: (400 + s.scrollX) * z + s.offsetLeft - 4, wantBW: 200 * z + 8,
                   flag: f.textContent, flagBg: fs.backgroundColor, flagOpacity: +fs.opacity, flagTo: +f.style.opacity, flagHeight: f.getBoundingClientRect().height,
                   fill: p.querySelector('path').getAttribute('fill'), boxColor: getComputedStyle(box).borderTopColor,
                   layer: getComputedStyle(document.querySelector('.pinto-peers')).pointerEvents, hitLayer: !!(hit && hit.closest('.pinto-peers')) };
        })()
        """
        var r = try await Self.json(j, where_)
        func near(_ a: String, _ b: String) -> Bool { abs((r[a] as? Double ?? -1e9) - (r[b] as? Double ?? 1e9)) < 1.5 }
        #expect(near("px", "wantX") && near("py", "wantY"), "the pointer is where Sara's is on the board: \(r)")
        #expect(near("bx", "wantBX") && near("bw", "wantBW"), "her selection is outlined: \(r)")
        // Her indigo (TestPeople), as on every device.
        #expect(r["flag"] as? String == "Sara" && r["flagBg"] as? String == "rgb(82, 82, 197)" && r["flagOpacity"] as? Double == 1 && r["flagHeight"] as? Double == 16)
        #expect(r["fill"] as? String == "#5252C5" && r["boxColor"] as? String == "rgb(82, 82, 197)")
        #expect(r["layer"] as? String == "none" && r["hitLayer"] as? Bool == false, "a click there reaches the board")

        // You zoom and scroll: she stays on the same spot of the board.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 1.6 }, scrollX: -120, scrollY: 40 } }); 1")
        try await Task.sleep(for: .milliseconds(200))
        r = try await Self.json(j, where_)
        #expect(near("px", "wantX") && near("py", "wantY") && near("bx", "wantBX"), "\(r)")

        // She goes quiet: grey, and her flag fades.
        j.canvas.show(peers: [BoardPeer(id: sara.id, name: "Sara", color: "#8E8E93", pointer: sara.pointer, selection: [], showsName: false)])
        try await Task.sleep(for: .milliseconds(400))
        r = try await Self.json(j, where_.replacingOccurrences(of: "box = document.querySelector('.pinto-peer-box')", with: "box = p")
                                    .replacingOccurrences(of: "getComputedStyle(box).borderTopColor", with: "''"))
        // (Where it fades to: an offscreen page doesn't run the 200 ms fade.)
        #expect(r["fill"] as? String == "#8E8E93" && r["flagTo"] as? Double == 0, "\(r)")

        // She leaves: nothing of her stays.
        j.canvas.show(peers: [])
        try await Task.sleep(for: .milliseconds(100))
        #expect(try await j.js("document.querySelectorAll('.pinto-peer').length") as? Int == 0)
        // Your own pointer goes out, in the board's coordinates (the engine's pointer update).
        var mine: [CGPoint?] = []
        j.canvas.onPresence = { p, _ in mine.append(p) }
        _ = try await j.js("""
        (() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
                 c.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 200, bubbles: true, pointerType: 'mouse', isPrimary: true })); return 1; })()
        """)
        await j.until("your pointer is reported") { mine.contains { $0 != nil } }
        let s = try await Self.json(j, "(() => { const s = amber._canvas.api.getAppState(); return { x: 300 / s.zoom.value - s.scrollX, y: 200 / s.zoom.value - s.scrollY }; })()")
        let p = try #require(mine.compactMap { $0 }.last)
        #expect(abs(p.x - (s["x"] as? Double ?? 0)) < 1 && abs(p.y - (s["y"] as? Double ?? 0)) < 1, "\(p) vs \(s)")
    }

    /// Can view: the engine is in its view mode, the app's edits are refused, and nothing goes out.
    @Test func aViewersBoardTakesNoEdits() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes))
        defer { j.close() }
        try await j.ready()
        var deltas: [[[String: Any]]] = []
        j.canvas.onBoardDelta = { e, _ in deltas.append(e) }
        j.canvas.share(true, viewOnly: true)
        for _ in 0..<100 where try await j.js("amber._canvas.api.getAppState().viewModeEnabled") as? Bool != true { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await j.js("amber._canvas.api.getAppState().viewModeEnabled") as? Bool == true)
        for op in ["{ op: 'sticky' }", "{ op: 'action', name: 'delete' }", "{ op: 'action', name: 'selectAll' }", "{ op: 'background', color: '#000000' }"] {
            #expect(try await j.js("amber._canvasCommand(\(op))") as? Bool == false, "\(op) refused")
        }
        #expect(try await j.js("amber._canvasCommand({ op: 'action', name: 'zoomIn' })") as? Bool == true, "looking around isn't")
        // Even a change that reached the engine some other way isn't sent.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.id === 'a' ? { ...e, x: 5, version: e.version + 1 } : e) }); return 1; })()")
        try await Task.sleep(for: .milliseconds(500))
        #expect(deltas.isEmpty)
        // No tools or style controls for a viewer: the app's own state says so.
        #expect(j.canvas.viewOnly && !j.canvas.showingStyle)
    }

    /// A picture pasted on a shared board goes to the app with the change that shows it. One the
    /// board can't take (the app says which) comes off the page again, and isn't sent as a
    /// deletion: it never reached anyone. A viewer's board takes none, and the app says why.
    @Test func aPictureTheSharedBoardCantTakeComesOffThePage() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.twoBoxes))
        defer { j.close() }
        try await j.ready()
        var deltas: [[[String: Any]]] = [], files: [[String: Any]] = []
        j.canvas.onBoardDelta = { e, _ in deltas.append(e) }
        j.canvas.onBoardFiles = { files.append($0) }
        j.canvas.share(true)
        // The document's drawing, as the app hands it over when the board opens.
        let a = try #require(try await Self.element(j, "a")), b = try #require(try await Self.element(j, "b"))
        j.canvas.remote(scene: CollabBoard.scene(elements: [a, b], settings: [:]))
        try await Task.sleep(for: .milliseconds(100))
        let png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        _ = try await j.js("amber._canvasCommand({ op: 'image', dataURL: '\(png)', mimeType: 'image/png', width: 40, height: 40 })")
        await j.until("the picture goes with its change") { !files.isEmpty }
        let image = try #require(deltas.joined().first { $0["type"] as? String == "image" })
        let id = try #require(image["id"] as? String), file = try #require(image["fileId"] as? String)
        #expect((files.first?[file] as? [String: Any])?["dataURL"] as? String == png)
        #expect(j.canvas.pageFiles.contains(file), "the page has it: the app won't hand it back")

        let mark = deltas.count
        j.canvas.send(.refusePictures([id]))
        func images() async throws -> Int { try await j.js("amber._canvas.api.getSceneElementsIncludingDeleted().filter((e) => e.type === 'image').length") as? Int ?? -1 }
        for _ in 0..<100 where try await images() != 0 { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await images() == 0, "off the page")
        try await Task.sleep(for: .milliseconds(400))
        #expect(!deltas.dropFirst(mark).joined().contains { $0["id"] as? String == id })
        // Sent again only once: each picture goes with the change that first shows it.
        #expect(files.count == 1)

        // A viewer's board: the app's own picture paths refuse it, and say why.
        j.canvas.share(true, viewOnly: true)
        j.canvas.send(.image(CanvasImage(dataURL: png, mimeType: "image/png", width: 40, height: 40), at: nil))
        #expect(!j.canvas.sent.contains { if case .image = $0 { true } else { false } })
        #expect(j.canvas.notice == CollabBoard.Pictures.viewOnly)
    }

    // MARK: Following someone (BoardFollow)

    /// Two frames far apart, as someone presenting them has them.
    static let twoFrames: [String: Any] = CanvasTests.scene([
        ["type": "rectangle", "id": "a", "x": 40, "y": 40, "width": 120, "height": 80],
        ["type": "rectangle", "id": "b", "x": 1460, "y": 960, "width": 420, "height": 280],
        ["type": "frame", "id": "f1", "children": ["a"], "name": "Intro"],
        ["type": "frame", "id": "f2", "children": ["b"], "name": "Plan"],
    ])

    /// The frame fills the view, as Present fills the presenter's.
    static func frameFills(_ j: Joined, _ id: String) async throws -> Bool {
        try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === '\(id)');
          const x1 = (f.x + s.scrollX) * z, y1 = (f.y + s.scrollY) * z, x2 = (f.x + f.width + s.scrollX) * z, y2 = (f.y + f.height + s.scrollY) * z;
          return x1 >= -1 && y1 >= -1 && x2 <= s.width + 1 && y2 <= s.height + 1 && ((x2 - x1) > s.width * 0.6 || (y2 - y1) > s.height * 0.6); })()
        """) as? Bool == true
    }

    /// Following someone, on the page: the board goes at once to the frame they show, filling the
    /// view, or to what they see, all of it in view. Moving the board yourself ends it: a scroll, a
    /// press on the board, a key that moves it, Escape. The app is told, and tells the others.
    @Test func aFollowersBoardGoesWhereTheyLookUntilTheyMoveIt() async throws {
        let j = try await Joined(scene: Self.twoFrames)
        defer { j.close() }
        try await j.ready()
        j.canvas.share(true)
        var told: [UUID?] = []
        j.canvas.onFollow = { told.append($0) }
        var sara = BoardPerson(id: TestPeople.sara, name: "Sara", color: TestPeople.color(TestPeople.sara).light, dark: TestPeople.color(TestPeople.sara).dark, presenting: BoardPresenting(frame: "f2", i: 1, n: 2))
        j.canvas.show(people: [sara])
        #expect(j.canvas.followBanner == .presenting(sara))
        j.canvas.follow(sara.id)
        #expect(told == [sara.id] && j.canvas.followBanner == .following(sara))
        for _ in 0..<50 where try await !Self.frameFills(j, "f2") { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.frameFills(j, "f2"), "the frame she shows fills the view")
        // She steps back: the board goes with her.
        sara.presenting = BoardPresenting(frame: "f1", i: 0, n: 2)
        j.canvas.show(people: [sara])
        for _ in 0..<50 where try await !Self.frameFills(j, "f1") { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await Self.frameFills(j, "f1"))

        // Her view, from her avatar: all of what she sees is in view, its middle in the middle.
        j.canvas.stopFollowing()
        sara.presenting = nil
        sara.view = CGRect(x: 1400, y: 900, width: 600, height: 400)
        j.canvas.show(people: [sara])
        j.canvas.follow(sara.id)
        let middle = "(() => { const s = amber._canvas.api.getAppState(), z = s.zoom.value; return [Math.round(-s.scrollX + s.width / 2 / z), Math.round(-s.scrollY + s.height / 2 / z), Math.round(s.width / z), Math.round(s.height / z)]; })()"
        for _ in 0..<50 where (try await j.js(middle) as? [Int])?.first != 1700 { try await Task.sleep(for: .milliseconds(30)) }
        let v = try #require(try await j.js(middle) as? [Int])
        #expect(abs(v[0] - 1700) <= 1 && abs(v[1] - 1100) <= 1, "her view's middle in the middle: \(v)")
        #expect(v[2] >= 599 && v[3] >= 399 && (v[2] <= 601 || v[3] <= 401), "all of it in view, filling one side: \(v)")

        // Moving the board yourself ends it: a scroll.
        _ = try await j.js("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true })); 1")
        await j.until("a scroll ends following") { j.canvas.following == nil }
        #expect(told.last == .some(nil) && j.canvas.sent.last == .follow(nil))
        // Escape, which the board doesn't also take (nothing is deselected or put down).
        j.canvas.follow(sara.id)
        _ = try await j.js("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); 1")
        await j.until("Escape ends following") { j.canvas.following == nil }
        // A press on the board.
        j.canvas.follow(sara.id)
        _ = try await j.js("""
        (() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
          c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true, button: 0, pointerType: 'mouse', isPrimary: true }));
          c.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 200, bubbles: true, button: 0, pointerType: 'mouse', isPrimary: true })); return 1; })()
        """)
        await j.until("a press ends following") { j.canvas.following == nil }
        // Not following: a scroll is a scroll, and the app hears nothing.
        let heard = told.count
        _ = try await j.js("window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true })); 1")
        try await Task.sleep(for: .milliseconds(150))
        #expect(told.count == heard)
        // Not shared: the page takes no follow.
        j.canvas.share(false)
        let pageTook = try await j.js("amber._canvasCommand({ op: 'follow', frame: 'f2' })") as? Bool
        #expect(pageTook == false)
    }

    /// On a shared board your presence says what you present (the frame, its step, the steps), what
    /// of the board you see, and, while the laser is pressed, its points: the others follow you by it.
    @Test func yourPresenceSaysWhatYouPresentAndSee() async throws {
        let j = try await Joined(scene: Self.twoFrames)
        defer { j.close() }
        try await j.ready()
        var looks: [BoardLook] = []
        j.canvas.onBoardLook = { looks.append($0) }
        j.canvas.share(true)
        j.canvas.send(.present(.start))
        await j.until("it says the first frame") { looks.last?.presenting == BoardPresenting(frame: "f1", i: 0, n: 2) }
        try await Task.sleep(for: .milliseconds(400))
        let seen = try #require(looks.last?.view)
        #expect(seen.contains(CGRect(x: 40, y: 40, width: 120, height: 80)) && seen.width < 1000, "what's in view is the first frame: \(seen)")
        j.canvas.send(.present(.next))
        await j.until("then the second") { looks.last?.presenting == BoardPresenting(frame: "f2", i: 1, n: 2) }

        // The laser (picked when presenting), pressed and drawn across the frame: its points go.
        #expect(j.canvas.state.tool == .laser)
        // A hand's events, each on its own turn (the engine takes the press on a later one).
        func hand(_ kind: String, _ x: Double, _ y: Double) async throws {
            _ = try await j.js("""
            (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
              const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
              c.dispatchEvent(new PointerEvent('\(kind)', { clientX: (\(x) + s.scrollX) * z + s.offsetLeft, clientY: (\(y) + s.scrollY) * z + s.offsetTop, bubbles: true, button: 0, buttons: \(kind == "pointerup" ? 0 : 1), pointerType: 'mouse', isPrimary: true, pointerId: 1 }));
              return 1; })()
            """)
            try await Task.sleep(for: .milliseconds(20))
        }
        try await hand("pointerdown", 1500, 1000)
        for i in 1...6 { try await hand("pointermove", 1500 + Double(i) * 40, 1000 + Double(i) * 20) }
        try await hand("pointerup", 1740, 1120)
        await j.until("the laser's points go") { looks.compactMap(\.laser).joined().count >= 3 }
        let points = looks.compactMap(\.laser).joined()
        #expect(points.count >= 3 && points.allSatisfy { $0.x >= 1490 && $0.x <= 1750 && $0.y >= 990 && $0.y <= 1130 }, "in the board's coordinates: \(Array(points))")
        // Done: nothing presented any more.
        j.canvas.send(.present(.stop))
        await j.until("Done says so") { looks.last.map { $0.presenting == nil } == true && j.canvas.state.present == nil }
        // Not shared: nothing goes.
        j.canvas.share(false)
        let n = looks.count
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { scrollX: 300 } }); 1")
        try await Task.sleep(for: .milliseconds(200))
        #expect(looks.count == n)
    }

    /// Someone's laser on your board: their trail, in the laser's red, at the spot of the board they
    /// drew it, fading.
    @Test func someonesLaserDrawsOnYourBoard() async throws {
        let j = try await Joined(scene: Self.twoFrames)
        defer { j.close() }
        try await j.ready()
        j.canvas.share(true)
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { zoom: { value: 1 }, scrollX: 0, scrollY: 0 } }); 1")
        let sara = UUID()
        j.canvas.laser(from: sara, points: [CGPoint(x: 200, y: 200), CGPoint(x: 260, y: 230), CGPoint(x: 320, y: 260)])
        #expect(j.canvas.sent.last == .laser(sara, [CGPoint(x: 200, y: 200), CGPoint(x: 260, y: 230), CGPoint(x: 320, y: 260)]))
        let trail = try #require(try await Self.json(j, "amber._canvas.trails()")[sara.uuidString] as? [[String: Any]])
        let at = try await Self.json(j, "(() => { const s = amber._canvas.api.getAppState(); return { x: s.offsetLeft, y: s.offsetTop }; })()")
        #expect(trail.count == 3 && abs((trail[2]["x"] as? Double ?? 0) - 320 - (at["x"] as? Double ?? 0)) < 1, "where she drew it: \(trail)")
        // Drawn: red along the trail (the page draws on its next frame).
        let red = """
        (() => { const c = document.querySelector('.pinto-laser'); if (!c) return -1; const g = c.getContext('2d'), r = window.devicePixelRatio || 1;
          const d = g.getImageData(Math.round(260 * r), Math.round(230 * r), 1, 1).data; return d[0] > 150 && d[1] < 120 && d[2] < 120 ? 1 : 0; })()
        """
        #expect(try await j.js(red) as? Int == 1, "the trail is drawn in red, as it comes")
        #expect(try await j.js("getComputedStyle(document.querySelector('.pinto-laser')).pointerEvents") as? String == "none", "it takes no click")
        // A second later it has faded away.
        try await Task.sleep(for: .milliseconds(1200))
        #expect(try await Self.json(j, "amber._canvas.trails()").isEmpty)
    }

    #if os(macOS)
    /// Two people on one board, end to end: each one's board in its own offscreen page, joined to
    /// their own session (BoardCollab), through the in-memory server. What one draws reaches the
    /// other's board; each one's pointer and selection is drawn on the other's, at the same spot of
    /// the board whatever their zoom. Pictures of both side by side, light and dark, when
    /// BOARD_COLLAB_SHOTS names a folder.
    @Test func twoPeopleOnOneBoard() async throws {
        let dir = ProcessInfo.processInfo.environment["BOARD_COLLAB_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        // The same two accounts in light and dark, so each is in the same colour in both pictures
        // (round 10: Emil was slate blue in one and mauve in the other, two runs with new accounts).
        let accounts = TestPeople.accounts
        for dark in [false, true] {
            let people = BoardPeople()
            // The drawing as a board saves it: every element with an id (an arrow's too).
            var flow = Self.flowchart
            flow["elements"] = ((flow["elements"] as? [[String: Any]]) ?? []).enumerated().map { i, e in e["id"] == nil ? e.merging(["id": "arrow-\(i)"]) { a, _ in a } : e }
            let (emilDevice, others, note) = try await people.share(flow, people: ["Sara"], title: "Publishing flow", accounts: accounts)
            let emil = try people.session(emilDevice, note), sara = try people.session(others[0], note)
            let size = CGSize(width: 760, height: 520)
            let left = try await Joined(scene: CanvasNote.emptyScene(), size: size, dark: dark)
            let right = try await Joined(scene: CanvasNote.emptyScene(), size: size, dark: dark)
            defer { left.close(); right.close() }
            try await left.ready()
            try await right.ready()
            BoardCollab.wire(emil, left.canvas)
            BoardCollab.wire(sara, right.canvas)
            func count(_ j: Joined) async throws -> Int { try await j.js("amber._canvas.api.getSceneElements().length") as? Int ?? 0 }
            func counts() async throws -> (Int, Int) { (try await count(left), try await count(right)) }
            for _ in 0..<150 { let (l, r) = try await counts(); if l >= 9 && r >= 9 && l == r { break }; try await Task.sleep(for: .milliseconds(40)) }
            let (l, r) = try await counts()
            #expect(l == r && l >= 9, "both boards have the drawing: \(l), \(r)")
            // Each fits the board to their own window: Sara's is zoomed differently.
            _ = try await left.js("amber._canvasCommand({ op: 'action', name: 'zoomToFit' })")
            _ = try await right.js("(() => { const api = amber._canvas.api; api.updateScene({ appState: { zoom: { value: 0.55 }, scrollX: 120, scrollY: 260 } }); return 1; })()")

            // Emil adds a sticky note, on his board; it reaches Sara's.
            _ = try await left.js("(() => { const api = amber._canvas.api, b = api.getSceneElements().find((e) => e.id === 'fix'); api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), { ...b, id: 'note-1', x: 860, y: 260, index: 'b0', version: 1, versionNonce: 4242, seed: 99, backgroundColor: '#fff3bf', boundElements: [] }] }); return 1; })()")
            for _ in 0..<150 where try await Self.element(right, "note-1") == nil { try await Task.sleep(for: .milliseconds(40)) }
            #expect(try await Self.element(right, "note-1") != nil, "Emil's new shape is on Sara's board")

            // Each points at something and selects it, on their own board (the engine's own pointer
            // moves, in the page; nothing outside it).
            func point(_ j: Joined, sceneX: Double, sceneY: Double, select id: String) async throws {
                _ = try await j.js("""
                (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
                  api.updateScene({ appState: { selectedElementIds: { '\(id)': true } } });
                  const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
                  c.dispatchEvent(new PointerEvent('pointermove', { clientX: (\(sceneX) + s.scrollX) * z + s.offsetLeft, clientY: (\(sceneY) + s.scrollY) * z + s.offsetTop, bubbles: true, pointerType: 'mouse', isPrimary: true }));
                  return 1; })()
                """)
            }
            try await point(left, sceneX: 380, sceneY: 95, select: "draft")
            try await point(right, sceneX: 700, sceneY: 300, select: "fix")
            func peer(_ j: Joined) async throws -> Int { try await j.js("document.querySelectorAll('.pinto-peer-pointer[style*=\"block\"]').length") as? Int ?? 0 }
            func peers() async throws -> (Int, Int) { (try await peer(left), try await peer(right)) }
            for _ in 0..<150 { let (l, r) = try await peers(); if l >= 1 && r >= 1 { break }; try await Task.sleep(for: .milliseconds(40)) }
            let seen = try await peers()
            #expect(seen.0 == 1 && seen.1 == 1, "each sees the other's pointer: \(seen)")
            #expect(try await left.js("document.querySelector('.pinto-peer-flag').textContent") as? String == "Sara")
            #expect(try await right.js("document.querySelector('.pinto-peer-flag').textContent") as? String == "Emil")
            #expect(try await right.js("document.querySelectorAll('.pinto-peer-box').length") as? Int == 1, "Emil's selection is outlined on Sara's board")
            // At the same spot of the board on Sara's, at her zoom.
            let at = try await Self.json(right, "(() => { const s = amber._canvas.api.getAppState(), r = document.querySelector('.pinto-peer-pointer').getBoundingClientRect(); return { x: r.left, want: (380 + s.scrollX) * s.zoom.value + s.offsetLeft - 1.5 }; })()")
            #expect(abs((at["x"] as? Double ?? 0) - (at["want"] as? Double ?? 1e9)) < 2, "\(at)")

            if let dir {
                try await Task.sleep(for: .milliseconds(400))
                _ = try? await left.web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                let a = try await Self.pixels(left.web), b = try await Self.pixels(right.web)
                let pair = try Self.sideBySide(a.png, b.png, gap: 24, dark: dark)
                try pair.write(to: dir.appending(path: "board-collab-two-people-\(dark ? "dark" : "light").png"))
                if !dark {
                    // The same moment with Sara's flag faded (she's been still a few seconds).
                    left.canvas.show(peers: left.canvas.peers.map { BoardPeer(id: $0.id, name: $0.name, color: $0.color, dark: $0.dark, pointer: $0.pointer, selection: $0.selection, showsName: false) })
                    try await Task.sleep(for: .milliseconds(400))
                    // An offscreen page doesn't run the 200 ms fade: ended, as it is on screen by now.
                    _ = try await left.js("(() => { document.getAnimations().forEach((a) => a.finish()); return getComputedStyle(document.querySelector('.pinto-peer-flag')).opacity; })()")
                    #expect(try await left.js("+getComputedStyle(document.querySelector('.pinto-peer-flag')).opacity") as? Double == 0)
                    let c = try await Self.pixels(left.web)
                    try c.png?.write(to: dir.appending(path: "board-collab-flag-faded-light.png"))
                }
            }
            BoardCollab.unwire(emil, left.canvas)
            BoardCollab.unwire(sara, right.canvas)
        }
    }

    /// Following the presenter between two Macs, in the app's own window (offscreen), each board
    /// joined to its own session through the in-memory server: the follower's board with "Sara is
    /// presenting · Follow"; following, her frame and her laser on it; and the presenter's own
    /// board with "Emil is following" in the Present bar. Light and dark, when BOARD_COLLAB_SHOTS
    /// names a folder.
    @Test func followPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["BOARD_COLLAB_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let accounts = TestPeople.accounts
        let frames = """
        amber._canvasCommand({ op: 'insert', elements: [
          { type: 'text', id: 'p1', x: 40, y: 40, text: 'Sign-up takes 6 steps', fontSize: 28 },
          { type: 'rectangle', id: 'p2', x: 40, y: 110, width: 200, height: 120, backgroundColor: '#ffc9c9', fillStyle: 'solid', roundness: { type: 3 }, label: { text: '42% drop at step 4' } },
          { type: 'rectangle', id: 'p3', x: 270, y: 110, width: 200, height: 120, backgroundColor: '#ffec99', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Email code is slow' } },
          { type: 'frame', id: 'fp', children: ['p1', 'p2', 'p3'], name: 'The problem' },
          { type: 'text', id: 'i1', x: 640, y: 40, text: 'One screen, then the app', fontSize: 28 },
          { type: 'ellipse', id: 'i2', x: 640, y: 120, width: 180, height: 90, backgroundColor: '#b2f2bb', fillStyle: 'solid', label: { text: 'Sign in with Apple' } },
          { type: 'rectangle', id: 'i3', x: 900, y: 120, width: 180, height: 90, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Open the app' } },
          { type: 'arrow', x: 822, y: 165, width: 76, height: 0, start: { id: 'i2' }, end: { id: 'i3' } },
          { type: 'frame', id: 'fi', children: ['i1', 'i2', 'i3'], name: 'The idea' },
        ] }); 1
        """
        @MainActor func capture(_ w: NSWindow, _ web: WKWebView, settle: Bool = true) async throws -> Data {
            if settle {
                _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                await MacWindowChromeTests.settle(w, 10)
                _ = try? await Self.settledView(w, web)
            }
            let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
            let cover = NSImageView(frame: web.bounds)
            cover.image = image
            cover.imageScaling = .scaleAxesIndependently
            web.addSubview(cover)
            defer { cover.removeFromSuperview() }
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            return try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:]))
        }
        for dark in [false, true] {
            for presenterHere in [false, true] {
                let people = BoardPeople()
                let (emilDevice, others, shared) = try await people.share(CanvasTests.scene([]), people: ["Sara"], title: "Sign-up plan", accounts: accounts)
                let e = try people.session(emilDevice, shared), s = try people.session(others[0], shared)
                let c = try AppSnapshotTests.container()
                let note = CanvasNote.make(in: .all, context: c.mainContext)
                note.body = "Sign-up plan"
                NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([])], "collections": [String: Any]()])
                try c.mainContext.save()
                try await AppSnapshotTests.withLastNote(c, "Sign-up plan") {
                    let (w, web, canvas) = try await Self.boardWindow(c, note, dark: dark)
                    defer { w.close() }
                    let other = try await Joined(scene: CanvasNote.emptyScene(), size: CGSize(width: 1100, height: 700), dark: dark)
                    defer { other.close() }
                    try await other.ready()
                    // The window is the follower's board (Emil's), then the presenter's (Sara's).
                    let (here, there) = presenterHere ? (s, e) : (e, s)
                    BoardCollab.wire(here, canvas)
                    BoardCollab.wire(there, other.canvas)
                    defer { BoardCollab.unwire(here, canvas); BoardCollab.unwire(there, other.canvas) }
                    // The window's note keeps the shared drawing for its list row, as the library
                    // keeps a shared board's (SharedLibrary.open): round 13's follow pictures had
                    // a note of their own beside the session, and its row said "Empty whiteboard".
                    let kept = here.onBoardSettled
                    here.onBoardSettled = { scene in kept?(scene); NotePageDataStore.shared.takeShared(note.id, scene: scene) }
                    let presenter = presenterHere ? canvas : other.canvas, follower = presenterHere ? other.canvas : canvas
                    let presenterPage: WKWebView = presenterHere ? web : other.web, followerPage: WKWebView = presenterHere ? other.web : web
                    let times = (CanvasController.highlightTime, CanvasController.arrivalTime)
                    CanvasController.highlightTime = 60; CanvasController.arrivalTime = 60
                    _ = try await presenterPage.evaluateJavaScript(frames)
                    for _ in 0..<150 where (try await followerPage.evaluateJavaScript("amber._canvas.api.getSceneElements().filter((e) => e.type === 'frame').length") as? Int ?? 0) < 2 {
                        await MacWindowChromeTests.settle(w, 1)
                    }
                    _ = try await followerPage.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.8, animate: false }); 1")
                    await MacWindowChromeTests.settle(w, 10)
                    if !presenterHere {
                        // What Sara drew, outlined in her colour with her name for a moment (round 14).
                        for _ in 0..<150 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                        let c = here.boardColors(of: accounts["Sara"]!)
                        #expect(canvas.highlight?.by == "Sara" && canvas.highlight?.kind == .person(color: c.light, dark: c.dark), "\(String(describing: canvas.highlight))")
                        try await capture(w, web).write(to: dir.appending(path: "follow-0-sara-drew-\(dark ? "dark" : "light").png"))
                    }
                    canvas.highlight = nil
                    (CanvasController.highlightTime, CanvasController.arrivalTime) = times
                    presenter.send(.present(.start))
                    for _ in 0..<150 where follower.followBanner == nil { await MacWindowChromeTests.settle(w, 1) }
                    #expect(follower.followBanner?.line == "Sara is presenting")
                    // The banner names her frame and step (round 13).
                    #expect(follower.followBanner?.words { id in follower.state.frames.first { $0.id == id }?.name } == "Sara is presenting \u{00B7} The problem \u{00B7} 1 of 2")
                    for _ in 0..<150 where NoteRow.boardPreview(CanvasSketch.of(note.id)) == NoteRow.emptyBoard { await MacWindowChromeTests.settle(w, 1) }
                    #expect(NoteRow.boardPreview(CanvasSketch.of(note.id)) != NoteRow.emptyBoard, "the board's row shows its words")
                    let sara = accounts["Sara"]!
                    if !presenterHere {
                        try await capture(w, web).write(to: dir.appending(path: "follow-1-banner-\(dark ? "dark" : "light").png"))
                        follower.follow(sara)
                        presenter.send(.present(.next))
                        // Frames inserted get ids of their own: her first, then her second.
                        @MainActor func steps() -> [CanvasCommand] { follower.sent.filter { if case .follow(.frame?) = $0 { true } else { false } } }
                        for _ in 0..<150 where steps().count < 2 { await MacWindowChromeTests.settle(w, 1) }
                        #expect(steps().count == 2 && steps()[0] != steps()[1], "his board went to her first frame, then her second: \(steps())")
                        _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                        await MacWindowChromeTests.settle(w, 10)
                        _ = try? await Self.settledView(w, web)
                        // Her laser, drawn across "Sign in with Apple" on her board.
                        let mark = follower.sent.count
                        for i in 0...8 {
                            let kind = i == 0 ? "pointerdown" : "pointermove"
                            _ = try await other.js("""
                            (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
                              const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
                              c.dispatchEvent(new PointerEvent('\(kind)', { clientX: (\(660 + i * 50) + s.scrollX) * z + s.offsetLeft, clientY: (\(215 + Double(i * i) * 0.9) + s.scrollY) * z + s.offsetTop, bubbles: true, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true, pointerId: 1 }));
                              return 1; })()
                            """)
                            try await Task.sleep(for: .milliseconds(25))
                        }
                        for _ in 0..<100 where !follower.sent.dropFirst(mark).contains(where: { if case .laser = $0 { true } else { false } }) { try await Task.sleep(for: .milliseconds(10)) }
                        #expect(follower.sent.dropFirst(mark).contains { if case .laser = $0 { true } else { false } }, "her laser reached his board")
                        try await capture(w, web, settle: false).write(to: dir.appending(path: "follow-2-following-\(dark ? "dark" : "light").png"))
                        _ = try await other.js("(() => { const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1]; c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse', isPrimary: true, pointerId: 1 })); return 1; })()")
                    } else {
                        follower.follow(sara)
                        for _ in 0..<150 where presenter.followers.isEmpty { await MacWindowChromeTests.settle(w, 1) }
                        #expect(BoardFollow.followersLine(presenter.followers) == "Emil is following")
                        try await capture(w, web).write(to: dir.appending(path: "follow-3-presenter-\(dark ? "dark" : "light").png"))
                    }
                    presenter.send(.present(.stop))
                    await MacWindowChromeTests.settle(w, 5)
                }
                _ = (emilDevice, others)
            }
        }
    }

    /// A board in the app's own window, offscreen, as `whiteboardWindowPictures` opens it.
    static func boardWindow(_ c: ModelContainer, _ note: Note, size: CGSize = CGSize(width: 1400, height: 900), dark: Bool) async throws -> (NSWindow, NotePageWebView, CanvasController) {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
            .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
        w.setContentSize(size)
        do {
            await MacWindowChromeTests.settle(w, 20)
            var found: WKWebView?
            for _ in 0..<100 where found == nil {
                found = NotePageLive.view(note.id)
                if found == nil { await MacWindowChromeTests.settle(w, 1) }
            }
            let web = try #require(found as? NotePageWebView, "the whiteboard opened")
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas && window.amber._canvasView)")
            return (w, web, try #require(web.canvas))
        } catch {
            w.close()
            throw error
        }
    }

    /// Waits for the board's view to settle after its size changed (Full Screen, a wider window):
    /// the page has seen every resize step and the view stopped moving. An offscreen window holds
    /// back the page's rendering, and with it the resize steps; a picture of the page lets one
    /// through (round 10, 13-fullscreen-dark: the picture was taken a step early, the view still
    /// centred for a narrower board). Returns where the view is (`amber._canvasView`).
    static func settledView(_ w: NSWindow, _ web: WKWebView) async throws -> [String: Any] {
        func view() async throws -> [String: Any] {
            let json = try await web.evaluateJavaScript("JSON.stringify(amber._canvasView())") as? String ?? "{}"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] ?? [:]
        }
        func same(_ a: [String: Any], _ b: [String: Any]) -> Bool {
            ["width", "height", "scrollX", "scrollY", "zoom"].allSatisfy { k in
                guard let x = a[k] as? Double, let y = b[k] as? Double else { return false }
                return abs(x - y) < 0.01
            }
        }
        var last: [String: Any] = [:]
        for _ in 0..<60 {
            _ = try? await web.takeSnapshot(configuration: nil)
            await MacWindowChromeTests.settle(w, 1)
            let now = try await view()
            if now["settled"] as? Bool == true, same(now, last) { return now }
            last = now
        }
        return last
    }

    /// The scene of picture 16: the flowchart template, then an AI's approval flow beside it, then
    /// the AI renaming a step and adding one under it.
    static let approvalFlow: [[String: Any]] = {
        let ink = "#2a1d10"
        return [
            ["type": "rectangle", "id": "ai-req", "x": 560, "y": 0, "width": 180, "height": 70, "label": ["text": "Request"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
            ["type": "rectangle", "id": "ai-rev", "x": 560, "y": 130, "width": 180, "height": 70, "label": ["text": "Manager review"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
            ["type": "rectangle", "id": "ai-ok", "x": 560, "y": 260, "width": 180, "height": 70, "label": ["text": "Approved"], "strokeColor": ink, "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
            ["type": "arrow", "x": 650, "y": 70, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-req"], "end": ["id": "ai-rev"], "strokeColor": ink],
            ["type": "arrow", "x": 650, "y": 200, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-rev"], "end": ["id": "ai-ok"], "strokeColor": ink],
        ]
    }()

    /// A weekly review as someone draws it (picture 28's "Weekly review" tile): what went well on
    /// stickies, what got in the way, next week's list. Its own board, not the meeting template's.
    static let weeklyReview: [[String: Any]] = {
        let ink = "#2a1d10", edge = "#ced4da"
        func text(_ s: String, _ x: Double, _ y: Double, _ size: Double = 20) -> [String: Any] {
            ["type": "text", "x": x, "y": y, "text": s, "fontSize": size, "strokeColor": ink]
        }
        func area(_ id: String, _ x: Double, _ y: Double, _ w: Double, _ h: Double, _ fill: String) -> [String: Any] {
            ["type": "rectangle", "id": id, "x": x, "y": y, "width": w, "height": h, "strokeColor": edge, "backgroundColor": fill, "fillStyle": "solid", "roundness": ["type": 3]]
        }
        func sticky(_ id: String, _ s: String, _ x: Double) -> [String: Any] {
            ["type": "rectangle", "id": id, "x": x, "y": 60, "width": 130, "height": 100, "label": ["text": s, "fontSize": 16], "strokeColor": ink, "backgroundColor": "#ffec99", "fillStyle": "solid"]
        }
        return [
            text("Week 46", 0, -60, 32),
            area("wins", 0, 0, 460, 190, "#ebfbee"), text("Wins", 16, 14),
            sticky("w1", "Shipped\nsharing", 16), sticky("w2", "Ten new\nusers", 162), sticky("w3", "Fixed the\nsync bug", 308),
            area("stuck", 480, 0, 300, 190, "#fff5f5"), text("In the way", 496, 14),
            text("Review queue\nToo many meetings", 496, 60, 16),
            area("next", 0, 210, 780, 150, "#e7f5ff"), text("Next week", 16, 224),
            text("1. Ship 1.4\n2. Write the launch post\n3. Book three user calls", 16, 262, 16),
        ]
    }()

    /// The AI's name tag keeps real room round it in picture 16's own scene and window (round 10,
    /// 16-ai-changed: "ChatGPT" over "Finance review" sat against the arrow coming down into it
    /// from "Request", reported fixed three rounds running). The arrow's box was a hairline and the
    /// tag, finding no clear spot above or below, took the first one anyway. Arrows now count as
    /// the lines they draw, heads and all, and the tag moves to where it's clear. Checked on the
    /// page as drawn: nothing is drawn within 8 pt of the tag (its own shape aside), at the zoom
    /// the AI's change left and at three others.
    @Test func theAIsNameTagKeepsClearOfTheArrowIntoItsShape() async throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Product launch"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([])], "collections": [String: Any]()])
        try c.mainContext.save()
        CanvasController.highlightTime = 60
        defer { CanvasController.highlightTime = 4 }
        try await AppSnapshotTests.withLastNote(c, "Product launch") {
            let (w, web, canvas) = try await Self.boardWindow(c, note, dark: false)
            defer { w.close() }
            canvas.send(.insert(.flowchart, title: canvas.title))
            for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
            await MacWindowChromeTests.settle(w, 10)
            // The AI's flow beside it, as an MCP write arrives through sync.
            @MainActor func scene() -> [String: Any] { (NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any] ?? [:] }
            @MainActor func take(_ elements: [[String: Any]]) {
                var s = scene()
                s["elements"] = elements
                NotePageDataStore.shared.take(note.id, server: NotePageData.encode(["values": ["scene": s], "collections": [String: Any]()]), by: "ChatGPT")
            }
            await MacWindowChromeTests.settle(w, 10)
            take((scene()["elements"] as? [[String: Any]] ?? []) + Self.approvalFlow)
            for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
            _ = try await web.evaluateJavaScript("(() => { amber._canvas.api.scrollToContent(undefined, { animate: false }); return 1; })()")
            await MacWindowChromeTests.settle(w, 20)
            // It renames Manager review and adds Notify team under Approved.
            var all = scene()["elements"] as? [[String: Any]] ?? []
            for i in all.indices where all[i]["containerId"] as? String == "ai-rev" {
                all[i]["text"] = "Finance review"; all[i]["originalText"] = "Finance review"
                all[i]["version"] = ((all[i]["version"] as? Int) ?? 1) + 1
            }
            all += [
                ["type": "rectangle", "id": "ai-tell", "x": 560, "y": 390, "width": 180, "height": 70, "label": ["text": "Notify team"], "strokeColor": "#2a1d10", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "roundness": ["type": 3]],
                ["type": "arrow", "x": 650, "y": 330, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-ok"], "end": ["id": "ai-tell"], "strokeColor": "#2a1d10"],
            ]
            canvas.highlight = nil
            take(all)
            for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
            await MacWindowChromeTests.settle(w, 10)
            let width = CanvasAIHighlight.tagWidth("ChatGPT")
            for zoom in [nil, 1.0, 0.8, 1.25] as [Double?] {
                if let zoom {
                    // Zoomed about the renamed shape, as a pinch over it would: the outline follows.
                    _ = try await web.evaluateJavaScript("""
                    (() => { const api = amber._canvas.api, s = api.getAppState(), b = api.getSceneElements().find((e) => e.id === 'ai-rev');
                      const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
                      api.updateScene({ appState: { zoom: { value: \(zoom) }, scrollX: s.width / 2 / \(zoom) - cx, scrollY: s.height / 2 / \(zoom) - cy } }); return 1; })()
                    """)
                    await MacWindowChromeTests.settle(w, 6)
                }
                let h = try #require(canvas.highlight, "the AI's change is outlined")
                let outlines = CanvasAIHighlight(highlight: h).outlines
                let top = try #require(outlines.min { ($0.minY, $0.minX) < ($1.minY, $1.minX) })
                let spot = CanvasAIHighlight.tag(over: outlines, avoiding: h.near, lines: h.lines, in: h.view, width: width)
                let tag = CGRect(x: spot.x, y: spot.y, width: width, height: CanvasAIHighlight.tagHeight)
                #expect(h.lines.count >= 6, "the arrows round it are known as lines, heads and all: \(h.lines.count)")
                // Beside its shape: within 40 pt of its outline, and off it.
                #expect(!tag.intersects(top) && tag.insetBy(dx: -40, dy: -40).intersects(top), "by its outline: \(tag) at \(top)")
                // On the page as drawn: nothing within 8 pt of the tag but its own shape.
                let shot = try await Self.pixels(web)
                func at(_ x: Int, _ y: Int) -> [Int] { let i = (y * shot.width + x) * 4; return (0..<3).map { Int(shot.bytes[i + $0]) } }
                let paper = at(shot.width - 3, shot.height / 2)
                let room = tag.insetBy(dx: -CanvasAIHighlight.clearance, dy: -CanvasAIHighlight.clearance)
                var inked: [CGPoint] = []
                for y in stride(from: Int(room.minY * shot.scale), to: Int(room.maxY * shot.scale), by: 1) where y >= 0 && y < shot.height {
                    for x in stride(from: Int(room.minX * shot.scale), to: Int(room.maxX * shot.scale), by: 1) where x >= 0 && x < shot.width {
                        let p = CGPoint(x: CGFloat(x) / shot.scale, y: CGFloat(y) / shot.scale)
                        if top.contains(p) { continue }
                        if zip(at(x, y), paper).contains(where: { abs($0 - $1) > 40 }) { inked.append(p) }
                    }
                }
                #expect(inked.isEmpty, "at zoom \(zoom.map { "\($0)" } ?? "as left"): \(inked.count) drawn points within 8 pt of the tag \(tag), first \(inked.prefix(3))")
                if let dir = ProcessInfo.processInfo.environment["AI_TAG_SHOTS"], let png = shot.png {
                    try png.write(to: URL(fileURLWithPath: dir).appending(path: "ai-tag-\(zoom.map { "\($0)" } ?? "left").png"))
                    print("AI_TAG zoom \(zoom.map { "\($0)" } ?? "left") tag \(tag) top \(top) view \(String(describing: h.view))")
                }
            }
        }
    }

    /// Full Screen keeps the drawing in the middle of the board, in light and dark (round 10,
    /// 13-fullscreen-dark: the drawing sat about 100 pt left of centre, the light one centred).
    /// The view was right; the picture was taken before the page had seen the last step of the
    /// resize (an offscreen window holds back its rendering, and its resize steps with it), with
    /// the view still centred for the narrower board in between. The view now settles first, for
    /// the pictures too. Checked on the page's own view and on the page as drawn.
    @Test(arguments: [false, true]) func fullScreenKeepsTheDrawingCentred(dark: Bool) async throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Product launch"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene(WhiteboardTemplate.flowchart.elements + Self.approvalFlow)], "collections": [String: Any]()])
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Product launch") {
            let (w, web, _) = try await Self.boardWindow(c, note, dark: dark)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 10)
            let before = try await Self.settledView(w, web)
            // Where the view is as each resize step reaches the page, read straight after the
            // page's own centring (observers are called in the order they were made). Each step
            // is centred at once, so the next step builds on it (round 11: a step that came before
            // the engine took the last one's scroll lost it; the drawing settled 4.5 pt off).
            _ = try await web.evaluateJavaScript("""
            (() => { const area = document.getElementById('canvas'); window.__steps = [];
              new ResizeObserver(() => { const s = amber._canvas.api.getAppState(); window.__steps.push([area.clientWidth, area.clientHeight, s.scrollX, s.scrollY, s.zoom.value]); }).observe(area);
              return 1; })()
            """)
            let full = await MacEmptyDetailTests.waitForElement("note.fullScreen", in: w)
            let button = try #require(full ?? MacEmptyDetailTests.element("note.fullScreen", in: w))
            _ = button.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
            // What the page has seen while the window lays out, before anything draws it.
            var early: [String] = []
            for _ in 0..<8 {
                await MacWindowChromeTests.settle(w, 2)
                let json = try await web.evaluateJavaScript("JSON.stringify(amber._canvasView())") as? String ?? ""
                early.append(json)
            }
            print("FULLSCREEN \(dark ? "dark" : "light") before \(before) early \(early)")
            let view = try await Self.settledView(w, web)
            let steps = try #require(try JSONSerialization.jsonObject(with: Data((try await web.evaluateJavaScript("JSON.stringify(window.__steps)") as? String ?? "[]").utf8)) as? [[Double]])
            let w0 = try #require(before["width"] as? Double), h0 = try #require(before["height"] as? Double)
            let x0 = try #require(before["scrollX"] as? Double), y0 = try #require(before["scrollY"] as? Double)
            #expect(steps.count >= 2, "the page saw the resize: \(steps)")
            for st in steps where st[4] == 1 && (st[0] != w0 || st[1] != h0) {
                #expect(abs(st[2] - (x0 + (st[0] - w0) / 2)) < 0.5 && abs(st[3] - (y0 + (st[1] - h0) / 2)) < 0.5,
                        "centred at once for \(st[0]) by \(st[1]): \(steps), from \(before)")
            }
            #expect(view["settled"] as? Bool == true, "the view settles: \(view)")
            let width = try #require(view["width"] as? Double), height = try #require(view["height"] as? Double)
            #expect(width > (before["width"] as? Double ?? 0) + 300, "the board is wider: \(before) → \(view)")
            let d = try #require(view["drawing"] as? [Double])
            #expect(abs(d[0] + d[2] / 2 - width / 2) < 3, "the drawing in the middle across: \(d) in \(width)")
            #expect(abs(d[1] + d[3] / 2 - height / 2) < 3 || d[3] > height, "and down: \(d) in \(height)")
            // On the page as drawn: the ink is as far from the left edge as from the right.
            let shot = try await Self.pixels(web)
            func px(_ x: Int, _ y: Int) -> [Int] { let i = (y * shot.width + x) * 4; return (0..<3).map { Int(shot.bytes[i + $0]) } }
            let paper = px(shot.width - 3, shot.height / 2)
            var lo = shot.width, hi = 0
            for y in stride(from: shot.height / 4, to: shot.height * 3 / 4, by: 4) {
                for x in 0..<shot.width where zip(px(x, y), paper).contains(where: { abs($0 - $1) > 60 }) { lo = min(lo, x); hi = max(hi, x) }
            }
            let left = CGFloat(lo) / shot.scale, right = width - CGFloat(hi) / shot.scale
            #expect(abs(left - right) < 12, "drawn in the middle: \(left) pt on the left, \(right) on the right")
        }
    }

    /// A board whole at 1000 pt stays whole when the window narrows to 760 pt (about 52%), and
    /// the one Tools button left shows a menu's chevron. Round 12, 15-narrow-760: it stayed at 76%,
    /// cut off on both sides, because with 48 pt kept round it the board needed 44%, under the
    /// 50% floor; and the Tools button was a grey arrow with no sign it opens a menu.
    @Test func aNarrowerWindowKeepsTheWholeBoard() async throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Product launch"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene(WhiteboardTemplate.flowchart.elements(titled: "Product launch") + Self.approvalFlow)], "collections": [String: Any]()])
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Product launch") {
            let (w, web, _) = try await Self.boardWindow(c, note, size: CGSize(width: 1000, height: 700), dark: false)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 10)
            func whole(_ v: [String: Any]) -> Bool {
                guard let d = v["drawing"] as? [Double], let width = v["width"] as? Double, let height = v["height"] as? Double else { return false }
                return d[0] >= -1 && d[1] >= -1 && d[0] + d[2] <= width + 1 && d[1] + d[3] <= height + 1
            }
            var before = try await Self.settledView(w, web)
            if !whole(before) {
                _ = try await web.evaluateJavaScript("amber._canvasCommand({ op: 'action', name: 'zoomToFit' }); 1")
                before = try await Self.settledView(w, web)
            }
            #expect(whole(before), "whole at 1000 pt: \(before)")
            w.setContentSize(CGSize(width: 760, height: 700))
            await MacWindowChromeTests.settle(w, 20)
            let after = try await Self.settledView(w, web)
            #expect((after["width"] as? Double ?? 999) < (before["width"] as? Double ?? 0) - 150, "the board's column narrowed: \(before) → \(after)")
            #expect(whole(after), "still whole at 760 pt: \(after)")
            let zoom = try #require(after["zoom"] as? Double)
            #expect(zoom >= 0.5 - 1e-6 && zoom < (before["zoom"] as? Double ?? 1), "zoomed out, not under half: \(zoom)")
            // The one Tools button: a chevron beside the tool, drawn in the button's own padding, so
            // the button is as wide as a plain one and the bar still fits 710 pt
            // (theBoardsToolbarNeverClips). Its right part has ink; Share's, a plain button with a
            // narrow symbol, has none.
            let shown = (w.toolbar?.items ?? []).filter { !$0.isHidden && $0.view?.window != nil }
            let tools = try #require(shown.first { $0.label == "Tools" }?.view, "the Tools menu at 760 pt: \(shown.map(\.label))")
            let comments = try #require(shown.first { $0.label == BoardCommentUI.title }?.view)
            #expect(abs(tools.frame.width - comments.frame.width) <= 2, "as wide as a plain button: \(tools.frame.width) against \(comments.frame.width)")
            let picture = try MacEmptyDetailTests.picture(w)
            let height = try #require(w.contentView?.superview).bounds.height
            @MainActor func rightInk(_ v: NSView) -> Int {
                let f = v.convert(v.bounds, to: nil)
                let y = Int((height - f.midY) * 2)
                guard let ground = picture.colorAt(x: Int((f.minX + 4) * 2), y: y)?.usingColorSpace(.deviceRGB) else { return -1 }
                var n = 0
                for x in Int((f.minX + 27) * 2)..<Int((f.maxX - 2) * 2) {
                    for y in Int((height - f.maxY + 8) * 2)..<Int((height - f.minY - 8) * 2) {
                        guard let c = picture.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                        if abs(c.redComponent - ground.redComponent) + abs(c.greenComponent - ground.greenComponent) + abs(c.blueComponent - ground.blueComponent) > 0.3 { n += 1 }
                    }
                }
                return n
            }
            let share = try #require(shown.first { $0.label == "Share" }?.view, "Share at 760 pt: \(shown.map(\.label))")
            let chevron = rightInk(tools), plain = rightInk(share)
            #expect(chevron >= 12 && plain <= 4, "a chevron beside the tool: \(chevron) inked pixels in the button's right part, \(plain) in a plain button's")
            try await Self.expectWholeToolbar(w, "760 pt")
        }
    }

    /// Emil pastes a picture on a shared board: it draws on Sara's board too, its bytes sealed on
    /// the way through the in-memory server and fetched by her device. Both boards end the same.
    /// A picture of both side by side when BOARD_COLLAB_SHOTS names a folder.
    @Test func aPictureOnePersonPastesDrawsOnTheOthersBoard() async throws {
        let dir = ProcessInfo.processInfo.environment["BOARD_COLLAB_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        let people = BoardPeople()
        var flow = Self.flowchart
        flow["elements"] = ((flow["elements"] as? [[String: Any]]) ?? []).enumerated().map { i, e in e["id"] == nil ? e.merging(["id": "arrow-\(i)"]) { a, _ in a } : e }
        let (emilDevice, others, note) = try await people.share(flow, people: ["Sara"], title: "Publishing flow")
        let emil = try people.session(emilDevice, note), sara = try people.session(others[0], note)
        let size = CGSize(width: 760, height: 520)
        let left = try await Joined(scene: CanvasNote.emptyScene(), size: size)
        let right = try await Joined(scene: CanvasNote.emptyScene(), size: size)
        defer { left.close(); right.close() }
        try await left.ready()
        try await right.ready()
        BoardCollab.wire(emil, left.canvas)
        BoardCollab.wire(sara, right.canvas)
        defer { BoardCollab.unwire(emil, left.canvas); BoardCollab.unwire(sara, right.canvas) }
        func count(_ j: Joined) async throws -> Int { try await j.js("amber._canvas.api.getSceneElements().length") as? Int ?? 0 }
        for _ in 0..<150 { let l = try await count(left), r = try await count(right); if l >= 9 && l == r { break }; try await Task.sleep(for: .milliseconds(40)) }

        // Emil pastes a picture, made ready as the app makes a paste ready.
        let pasted = try #require(CanvasImage(data: try Self.landscape()))
        let photo = pasted.dataURL
        left.canvas.send(.image(pasted, at: nil))
        func picture(_ j: Joined) async throws -> [String: Any] {
            try await Self.json(j, "(() => { const api = amber._canvas.api, e = api.getSceneElements().find((x) => x.type === 'image'); const f = e && api.getFiles()[e.fileId]; return e ? { id: e.id, fileId: e.fileId, x: e.x, width: e.width, dataURL: f ? f.dataURL : null } : {}; })()")
        }
        var theirs: [String: Any] = [:]
        for _ in 0..<250 {
            theirs = try await picture(right)
            if theirs["dataURL"] as? String != nil { break }
            try await Task.sleep(for: .milliseconds(40))
        }
        let mine = try await picture(left)
        let file = try #require(mine["fileId"] as? String)
        #expect(theirs["dataURL"] as? String == photo, "the photo is on Sara's board")
        #expect(theirs["id"] as? String == mine["id"] as? String && theirs["x"] as? Double == mine["x"] as? Double && theirs["width"] as? Double == mine["width"] as? Double)
        // Through the server sealed, under the note key.
        let stored = try #require(people.server.files[note.id]?[file])
        #expect(stored.ct.hasPrefix("amb3f.1.") && !stored.ct.contains(String(photo.dropFirst(30).prefix(40))))

        // Drawn on both: the photo's sun shows on each board, the same at the same zoom.
        for j in [left, right] { _ = try await j.js("amber._canvasCommand({ op: 'action', name: 'zoomToFit' })") }
        func sun(_ j: Joined) async throws -> Int {
            let p = try await Self.pixels(j.web)
            var n = 0
            for i in stride(from: 0, to: p.bytes.count, by: 4) where p.bytes[i] > 220 && (90...160).contains(p.bytes[i + 1]) && p.bytes[i + 2] < 60 { n += 1 }
            return n
        }
        var drawn = (0, 0)
        for _ in 0..<100 {
            drawn = (try await sun(left), try await sun(right))
            if drawn.0 > 100 && drawn.1 > 100 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        #expect(drawn.0 > 100 && drawn.1 > 100, "the photo is drawn on both boards: \(drawn)")
        #expect(abs(drawn.0 - drawn.1) < max(drawn.0, drawn.1) / 5, "the same on both: \(drawn)")

        if let dir {
            _ = try? await left.web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
            try await Task.sleep(for: .milliseconds(300))
            let a = try await Self.pixels(left.web), b = try await Self.pixels(right.web)
            try Self.sideBySide(a.png, b.png, gap: 24, dark: false).write(to: dir.appending(path: "board-collab-picture-light.png"))
        }
    }

    /// A small picture of a landscape (sky, sun, hills), as a PNG: something to paste.
    static func landscape(width: Int = 320, height: Int = 200) throws -> Data {
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                                isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        let w = CGFloat(width), h = CGFloat(height)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSGradient(starting: NSColor(red: 0.85, green: 0.93, blue: 1, alpha: 1), ending: NSColor(red: 0.33, green: 0.58, blue: 0.93, alpha: 1))?.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)
        NSColor(red: 1, green: 0.48, blue: 0, alpha: 1).setFill()
        NSBezierPath(ovalIn: NSRect(x: w * 0.62, y: h * 0.52, width: h * 0.34, height: h * 0.34)).fill()
        let hills = NSBezierPath()
        hills.move(to: .zero)
        hills.line(to: NSPoint(x: 0, y: h * 0.32))
        hills.curve(to: NSPoint(x: w * 0.55, y: h * 0.3), controlPoint1: NSPoint(x: w * 0.18, y: h * 0.52), controlPoint2: NSPoint(x: w * 0.36, y: h * 0.5))
        hills.curve(to: NSPoint(x: w, y: h * 0.4), controlPoint1: NSPoint(x: w * 0.72, y: h * 0.14), controlPoint2: NSPoint(x: w * 0.86, y: h * 0.46))
        hills.line(to: NSPoint(x: w, y: 0))
        hills.close()
        NSColor(red: 0.27, green: 0.6, blue: 0.32, alpha: 1).setFill()
        hills.fill()
        NSGraphicsContext.restoreGraphicsState()
        return try #require(rep.representation(using: .png, properties: [:]))
    }

    /// Two pictures side by side on the window's ground, with a gap.
    static func sideBySide(_ a: Data?, _ b: Data?, gap: Int, dark: Bool) throws -> Data {
        let l = try #require(a.flatMap { NSBitmapImageRep(data: $0) }), r = try #require(b.flatMap { NSBitmapImageRep(data: $0) })
        let w = l.pixelsWide + gap + r.pixelsWide, h = max(l.pixelsHigh, r.pixelsHigh)
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                                isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        (dark ? NSColor(white: 0.17, alpha: 1) : NSColor(white: 0.86, alpha: 1)).setFill()
        NSRect(x: 0, y: 0, width: w, height: h).fill()
        l.draw(in: NSRect(x: 0, y: h - l.pixelsHigh, width: l.pixelsWide, height: l.pixelsHigh))
        r.draw(in: NSRect(x: l.pixelsWide + gap, y: h - r.pixelsHigh, width: r.pixelsWide, height: r.pixelsHigh))
        NSGraphicsContext.restoreGraphicsState()
        return try #require(out.representation(using: .png, properties: [:]))
    }
    #endif
}
