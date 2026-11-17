#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// The board's map (CanvasMap, canvas-stack/src/minimap.js; Emil, 17 November 2026): off at first
/// and remembered for every board; the page draws it at the bottom right above the zoom, with the
/// part in view outlined; a click there moves the view; it redraws at most every quarter second
/// and never mid-press; off, it listens to nothing.
@MainActor @Suite(.serialized) struct CanvasMapTests {
    /// Off at first, kept for every board under a key with no dot (ColumnsLayout.key), and what the
    /// page is told.
    @Test func offAtFirstAndRememberedForEveryBoard() throws {
        let d = try #require(UserDefaults(suiteName: "canvas-map-\(UUID().uuidString)"))
        #expect(!CanvasMap.isOn(d))
        d.set(true, forKey: CanvasMap.key)
        #expect(CanvasMap.isOn(d))
        #expect(!CanvasMap.key.contains("."))
        let p = CanvasCommand.minimap(true).payload
        #expect(p["op"] as? String == "minimap" && p["on"] as? Bool == true && p["right"] as? Double == 12 && p["bottom"] as? Double == CanvasMap.bottom)
        #expect(CanvasMap.bottom == Double(CanvasDock.margin + CanvasCorner.height + 8), "above the zoom's bar")
        // It's across from the style panel, which keeps its height with the map on.
        #expect(CanvasStyleSidebar.foot == 64)
    }

    /// The corner bar has the map's switch and the zoom, and no Undo or Redo (⌘Z and ⇧⌘Z; Emil, 17
    /// November 2026); the switch tells the page and is remembered.
    @Test func theCornerHasTheMapAndTheZoomOnly() async throws {
        let d = UserDefaults.standard
        let kept = d.object(forKey: CanvasMap.key)
        defer { if let kept { d.set(kept, forKey: CanvasMap.key) } else { d.removeObject(forKey: CanvasMap.key) } }
        d.removeObject(forKey: CanvasMap.key)
        let canvas = CanvasController()
        let ax = OffscreenAX(CanvasCorner(canvas: canvas).padding(8), size: CGSize(width: 420, height: 70))
        defer { ax.close() }
        await ax.settle()
        for id in ["canvas.map", "canvas.zoomOut", "canvas.zoom", "canvas.zoomIn"] {
            #expect(await ax.waiting(for: id, tries: 5) != nil, "\(id) in \(ax.ids())")
        }
        #expect(ax.find("canvas.undo") == nil && ax.find("canvas.redo") == nil, "no Undo or Redo: \(ax.ids())")
        let map = try #require(ax.find("canvas.map"))
        #expect(map.text.contains(CanvasMap.title(false)), "\(map.text)")
        map.press()
        await ax.settle()
        #expect(CanvasMap.isOn(d), "remembered")
        #expect(canvas.sent.contains(.minimap(true)), "the page is told: \(canvas.sent)")
        ax.find("canvas.map")?.press()
        await ax.settle()
        #expect(!CanvasMap.isOn(d) && canvas.sent.last == .minimap(false), "\(canvas.sent)")
    }

    /// The page's map: none until it's told; then the drawing, small, at the bottom right above the
    /// zoom; a click on it moves the view's middle there; off, it's gone and listens to nothing.
    @Test func thePageDrawsTheMapAndAClickMovesTheView() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasNativeUITests.flowchart, size: CGSize(width: 1000, height: 640))
        defer { j.close() }
        try await j.ready()
        #expect(try await j.js("!!document.querySelector('.pinto-map')") as? Bool == false, "off at first")
        j.canvas.send(.minimap(true))
        try await CanvasTests().run(j.web, until: "!!document.querySelector('.pinto-map')")
        let place = try #require(try await j.js("(() => { const r = document.querySelector('.pinto-map').getBoundingClientRect(); return [innerWidth - r.right, innerHeight - r.bottom, r.width, r.height]; })()") as? [Double])
        #expect(place == [12, CanvasMap.bottom, Double(CanvasMap.size.width), Double(CanvasMap.size.height)], "at the bottom right: \(place)")
        // The drawing is on it, and the view's box: inside the map.
        let inked = try await j.js("(() => { const c = document.querySelector('.pinto-map canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; })()") as? Int ?? 0
        #expect(inked > 200, "the drawing is drawn: \(inked) pixels")
        let view = try #require(try await j.js("(() => { const b = document.querySelector('.pinto-map-view').getBoundingClientRect(), m = document.querySelector('.pinto-map').getBoundingClientRect(); return [b.left - m.left, b.top - m.top, b.width, b.height]; })()") as? [Double])
        #expect(view[0] >= 0 && view[1] >= 0 && view[0] + view[2] <= 200.5 && view[1] + view[3] <= 128.5 && view[2] > 10, "the view's box: \(view)")
        // A click near the map's right edge: the view's middle goes to that point of the board.
        _ = try await j.js("""
            (() => { const m = document.querySelector('.pinto-map'), r = m.getBoundingClientRect(), f = amber._canvas.map().fit, x = r.width - 14, y = r.height / 2;
              window.__mapTarget = { x: (x - f.ox) / f.scale, y: (y - f.oy) / f.scale };
              const o = { bubbles: true, cancelable: true, clientX: r.left + x, clientY: r.top + y, pointerId: 7, button: 0, isPrimary: true };
              m.dispatchEvent(new PointerEvent('pointerdown', o)); m.dispatchEvent(new PointerEvent('pointerup', o)); return 1; })()
            """)
        try await CanvasTests().run(j.web, until: "(() => { const s = amber._canvas.api.getAppState(), t = window.__mapTarget, z = s.zoom.value; return Math.abs(-s.scrollX + s.width / 2 / z - t.x) < 1 && Math.abs(-s.scrollY + s.height / 2 / z - t.y) < 1; })()")
        // Off: gone, and it hears nothing more.
        j.canvas.send(.minimap(false))
        try await CanvasTests().run(j.web, until: "!document.querySelector('.pinto-map')")
        let counts = "JSON.stringify(amber._canvas.map().counts)"
        let off = try await j.js(counts) as? String
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().map((e) => e.id === 'fix' ? { ...e, x: e.x + 40, version: e.version + 1, versionNonce: e.versionNonce + 1 } : e) }); return 1; })()")
        try await Task.sleep(for: .milliseconds(400))
        #expect(try await j.js(counts) as? String == off, "off, the map draws nothing")
    }

    /// While the board changes, the drawing on the map is redrawn at most every quarter second,
    /// and never while a press draws or moves something; the view's box follows the view. (The
    /// changes come from here, one at a time: an offscreen page's own timers run about once a
    /// second, so a burst timed in the page spread over half a minute.)
    @Test func theMapRedrawsAtMostEveryQuarterSecondAndNeverMidPress() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasNativeUITests.flowchart, size: CGSize(width: 1000, height: 640))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.minimap(true))
        try await CanvasTests().run(j.web, until: "!!document.querySelector('.pinto-map')")
        try await Task.sleep(for: .milliseconds(300))
        func scene() async throws -> Int { try await j.js("amber._canvas.map().counts.scene") as? Int ?? -1 }
        let move = "(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().map((e) => e.id === 'fix' ? { ...e, x: e.x + 1, version: e.version + 1, versionNonce: e.versionNonce + 1 } : e) }); return 1; })()"
        func changes(_ n: Int) async throws { for _ in 0..<n { _ = try await j.js(move); try await Task.sleep(for: .milliseconds(25)) } }
        // Thirty changes at once: drawn once or twice, not thirty times.
        var before = try await scene()
        _ = try await j.js("(() => { for (let i = 0; i < 30; i++) \(move); return 1; })()")
        try await CanvasTests().run(j.web, until: "amber._canvas.map().counts.scene > \(before)")
        try await Task.sleep(for: .milliseconds(400))
        #expect(try await scene() - before <= 2, "30 changes at once")
        // Sixteen changes over about half a second: a quarter second or more between two drawings.
        before = try await scene()
        let start = try #require(try await j.js("performance.now()") as? Double)
        try await changes(16)
        try await CanvasTests().run(j.web, until: "amber._canvas.map().counts.scene > \(before)")
        try await Task.sleep(for: .milliseconds(400))
        let times = try #require(try await j.js("amber._canvas.map().counts.times.filter((t) => t >= \(start))") as? [Double])
        let gaps = zip(times.dropFirst(), times).map { $0 - $1 }
        #expect(!times.isEmpty && times.count < 16 && gaps.allSatisfy { $0 >= 245 }, "drawn at \(times.map { Int($0 - start) }) ms for 16 changes")
        // Mid-press: nothing, then once when it ends.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { cursorButton: 'down' } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(300))
        let pressed = try await scene()
        try await changes(12)
        try await Task.sleep(for: .milliseconds(600))
        #expect(try await scene() == pressed, "nothing redrawn while the press goes on")
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { cursorButton: 'up' } }); return 1; })()")
        try await CanvasTests().run(j.web, until: "amber._canvas.map().counts.scene > \(pressed)")
        try await Task.sleep(for: .milliseconds(500))
        #expect(try await scene() == pressed + 1, "redrawn once when it ends")
        // The view moves: its box follows, with no redraw of the drawing while it stays on the map.
        let boxBefore = try await j.js("document.querySelector('.pinto-map-view').style.transform") as? String
        j.canvas.send(.pan(dx: 30, dy: 0))
        try await CanvasTests().run(j.web, until: "document.querySelector('.pinto-map-view').style.transform !== \(String(reflecting: boxBefore ?? ""))")
    }

    /// Dark mode turns the map's drawing as the board is turned; light mode leaves it.
    @Test(arguments: [false, true])
    func theMapTurnsWithTheBoard(dark: Bool) async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasNativeUITests.flowchart, size: CGSize(width: 900, height: 600), dark: dark)
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.minimap(true))
        try await CanvasTests().run(j.web, until: "!!document.querySelector('.pinto-map canvas')")
        let filter = try await j.js("getComputedStyle(document.querySelector('.pinto-map canvas')).filter") as? String ?? ""
        #expect(filter.contains("invert") == dark, "\(filter)")
    }

    /// Pictures for Emil (EMIL_SHOTS): the board with its map, beside the columns and in Full
    /// Screen, light and dark.
    @Test func pictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["EMIL_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let d = UserDefaults.standard
        let kept = d.object(forKey: CanvasMap.key)
        defer { if let kept { d.set(kept, forKey: CanvasMap.key) } else { d.removeObject(forKey: CanvasMap.key) } }
        d.set(true, forKey: CanvasMap.key)
        for dark in [false, true] {
            let c = try CanvasNativeUITests.canvasLibrary()
            let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
            let (w, web, _) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark) }
            defer { w.close() }
            _ = try await CanvasNativeUITests.settledView(w, web)
            try await CanvasTests().run(web, until: "!!document.querySelector('.pinto-map')")
            await MacWindowChromeTests.settle(w, 5)
            try await BoardEmilFixesTests.picture(w, covering: web).write(to: dir.appending(path: "map-\(dark ? "dark" : "light").png"))
            NotificationCenter.default.post(name: .paneCanvasPresenting, object: true)
            await MacWindowChromeTests.settle(w, 15)
            _ = try await CanvasNativeUITests.settledView(w, web)
            await MacWindowChromeTests.settle(w, 5)
            try await BoardEmilFixesTests.picture(w, covering: web).write(to: dir.appending(path: "map-fullscreen-\(dark ? "dark" : "light").png"))
            NotificationCenter.default.post(name: .paneCanvasPresenting, object: false)
            await MacWindowChromeTests.settle(w, 10)
        }
    }
}
#endif
