#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// Pencil strokes as the pointer draws them. Emil, 17 November 2026: the board's strokes looked
/// "ugly and unlike Excalidraw's", with few points, pinched in the middle and blobs at the ends.
/// Excalidraw draws a pencil stroke from the pointer's moves alone: with a mouse or trackpad it
/// works out the line's width from how far apart the moves are (simulated pressure), so moves that
/// reach the page late, merged into fewer, far apart, give a line that thins to a pinch between
/// them and ends in round blobs. A stroke drawn by hand (below) is given to the board's web view as
/// the pointer gives it (its own mouse methods: WebKit makes the page's pointer events; nothing is
/// posted to the system), in the app's window off every screen, and to plain Excalidraw the same.
@MainActor @Suite(.serialized) struct BoardPenStrokeTests {
    /// A quick hand-drawn scribble in a box of `size`: a tall loop, a zigzag with sharp turns, a
    /// circle and a swoosh, through a smooth curve, at a hand's pace (slow to start and to stop,
    /// fast between: about 1.8 points a millisecond at the fastest), one point every 1/120 s, the
    /// rate a trackpad reports on a 120 Hz Mac. The same every run.
    static func scribble(in size: CGSize, seconds: Double = 1.6, rate: Double = 120) -> [CGPoint] {
        let marks: [CGPoint] = [
            CGPoint(x: 0.04, y: 0.78), CGPoint(x: 0.10, y: 0.35), CGPoint(x: 0.15, y: 0.06), CGPoint(x: 0.20, y: 0.30),
            CGPoint(x: 0.13, y: 0.82), CGPoint(x: 0.27, y: 0.30), CGPoint(x: 0.34, y: 0.86), CGPoint(x: 0.42, y: 0.30),
            CGPoint(x: 0.50, y: 0.86), CGPoint(x: 0.62, y: 0.40),
        ] + (0...8).map { i in
            let a = -Double.pi / 2 - Double(i) / 8 * 2 * .pi
            return CGPoint(x: 0.72 + 0.11 * cos(a), y: 0.55 + 0.17 * sin(a))
        } + [CGPoint(x: 0.86, y: 0.44), CGPoint(x: 0.97, y: 0.30)]
        // Catmull-Rom through the marks, finely, then spaced by the hand's pace along its length.
        let pts = marks.map { CGPoint(x: $0.x * size.width, y: $0.y * size.height) }
        var fine: [CGPoint] = []
        for i in 0..<(pts.count - 1) {
            let p0 = pts[max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[min(pts.count - 1, i + 2)]
            for k in 0..<40 {
                let t = Double(k) / 40, t2 = t * t, t3 = t2 * t
                func c(_ a: CGFloat, _ b: CGFloat, _ c: CGFloat, _ d: CGFloat) -> CGFloat {
                    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
                }
                fine.append(CGPoint(x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y)))
            }
        }
        fine.append(pts[pts.count - 1])
        var along: [Double] = [0]
        for i in 1..<fine.count { along.append(along[i - 1] + hypot(fine[i].x - fine[i - 1].x, fine[i].y - fine[i - 1].y)) }
        let total = along.last ?? 1
        let n = Int(seconds * rate)
        return (0...n).map { j in
            // Minimum jerk: how a hand moves from rest to rest.
            let t = Double(j) / Double(n)
            let s = (10 * pow(t, 3) - 15 * pow(t, 4) + 6 * pow(t, 5)) * total
            let i = min(fine.count - 2, max(0, (along.firstIndex { $0 >= s } ?? fine.count - 1) - 1))
            let span = along[i + 1] - along[i]
            let f = span > 0 ? (s - along[i]) / span : 0
            return CGPoint(x: fine[i].x + (fine[i + 1].x - fine[i].x) * f, y: fine[i].y + (fine[i + 1].y - fine[i].y) * f)
        }
    }

    /// Watches the page's pointer events while a stroke is drawn: how many moves, their kind,
    /// buttons and pressure, the moves the browser merged into them (getCoalescedEvents), and the
    /// gaps between the moves' times.
    static let watch = """
    (() => {
      const w = window.__penWatch = { moves: 0, coalesced: 0, types: {}, pressures: {}, buttons: {}, down: false, times: [], hasCoalesced: typeof PointerEvent.prototype.getCoalescedEvents === 'function' };
      addEventListener('pointerdown', (e) => { w.down = true; w.downPressure = e.pressure; }, { capture: true, passive: true });
      addEventListener('pointerup', () => { w.down = false; }, { capture: true, passive: true });
      addEventListener('pointermove', (e) => {
        if (!w.down) return;
        w.moves++;
        w.types[e.pointerType] = (w.types[e.pointerType] || 0) + 1;
        const p = String(Math.round(e.pressure * 100) / 100); w.pressures[p] = (w.pressures[p] || 0) + 1;
        w.buttons[e.buttons] = (w.buttons[e.buttons] || 0) + 1;
        const all = w.hasCoalesced ? e.getCoalescedEvents() : [];
        w.coalesced += all.length;
        for (const c of all.length ? all : [e]) w.times.push(c.timeStamp);
      }, { capture: true, passive: true });
    })(); return true
    """

    /// The last pencil stroke on the page, with what the page saw drawing it.
    static let read = """
    const api = (window.amber && amber._canvas && amber._canvas.api) || window.__excalidrawAPI;
    const all = api.getSceneElements().filter((e) => e.type === 'freedraw');
    const e = all[all.length - 1];
    const w = window.__penWatch || {};
    const gaps = (w.times || []).slice(1).map((t, i) => t - w.times[i]).sort((a, b) => a - b);
    const q = (f) => gaps.length ? Math.round(gaps[Math.min(gaps.length - 1, Math.floor(f * gaps.length))] * 10) / 10 : null;
    const watch = { ...w, times: undefined, gapP50: q(0.5), gapMax: q(1) };
    return JSON.stringify({ watch, strokes: all.length, zoom: api.getAppState().zoom.value, frameRate: (window.amber && amber._frameRate) || 0, element: e || null })
    """

    typealias Sent = [(at: TimeInterval, point: CGPoint)]

    struct Drawn {
        /// The press and each move as given to the web view: when, and where (its coordinates).
        var sent: Sent
        var watch: [String: Any]
        var element: [String: Any]
        var moves: Int { sent.count - 1 }
        var points: Int { (element["points"] as? [Any])?.count ?? 0 }
    }

    /// Gives `path` (in the web view's own coordinates, y down) to the web view as the pointer would:
    /// down, a drag every 1/`rate` s, up, with the left button held for the page (holdLeftButton).
    static func draw(_ path: [CGPoint], on web: WKWebView, rate: Double = 120) async throws -> Sent {
        let w = try #require(web.window)
        func at(_ p: CGPoint) -> CGPoint { web.convert(CGPoint(x: p.x, y: web.isFlipped ? p.y : web.bounds.height - p.y), to: nil) }
        var sent: Sent = []
        var release: (() -> Void)? = BoardLagTests.holdLeftButton()
        defer { release?() }
        let down = BoardLagTests.mouse(.leftMouseDown, at(path[0]), w)
        sent.append((down.timestamp, path[0]))
        web.mouseDown(with: down)
        var next = CACurrentMediaTime() + 1 / rate
        for p in path.dropFirst() {
            let wait = next - CACurrentMediaTime()
            if wait > 0 { try await Task.sleep(for: .seconds(wait)) } else { await Task.yield() }
            next += 1 / rate
            let e = BoardLagTests.mouse(.leftMouseDragged, at(p), w)
            sent.append((e.timestamp, p))
            web.mouseDragged(with: e)
        }
        release?(); release = nil
        web.mouseUp(with: BoardLagTests.mouse(.leftMouseUp, at(path[path.count - 1]), w))
        try await Task.sleep(for: .milliseconds(600))
        return sent
    }

    static func result(_ web: WKWebView, sent: Sent) async throws -> Drawn {
        let json = try #require(try await BoardLagTests.js(web, read) as? String)
        let m = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        #expect(m["zoom"] as? Double == 1, "drawn at 100%: \(m["zoom"] ?? 0)")
        return Drawn(sent: sent, watch: m["watch"] as? [String: Any] ?? [:], element: try #require(m["element"] as? [String: Any], "a stroke was drawn"))
    }

    /// How many frames a second the board's pages draw (NotePageSandbox.frameRate; plain
    /// Excalidraw's page here draws as fast).
    static var frameRate: Int { NotePageSandbox.frameRate }

    /// The line plain Excalidraw draws from these moves when every frame is on time: the press, the
    /// first move in each frame (`frameRate` a second, from the press), and the lift.
    static func onTime(_ sent: Sent) -> [[Double]] {
        let p0 = sent[0].point, t0 = sent[0].at, frame = 1 / Double(frameRate)
        var points: [[Double]] = [[0, 0]], last = -1
        for s in sent.dropFirst() {
            let f = Int(((s.at - t0) / frame).rounded(.down))
            guard f > last else { continue }
            last = f
            let q = [Double(s.point.x - p0.x), Double(s.point.y - p0.y)]
            if q != points.last { points.append(q) }
        }
        if let end = sent.last { points.append([Double(end.point.x - p0.x), Double(end.point.y - p0.y)]) }
        return points
    }

    /// `like` with the on-time line's points.
    static func onTimeElement(_ sent: Sent, like: [String: Any]) -> [String: Any] {
        let points = onTime(sent)
        var e = like
        e["points"] = points
        e["pressures"] = [Double]()
        e["simulatePressure"] = true
        e["lastCommittedPoint"] = points.last
        let xs = points.map { $0[0] }, ys = points.map { $0[1] }
        e["width"] = (xs.max() ?? 0) - (xs.min() ?? 0)
        e["height"] = (ys.max() ?? 0) - (ys.min() ?? 0)
        return e
    }

    /// The stroke on the board in the app's own window (an empty board), with the owner's menu bar
    /// loop going if `menuBarLoop` (BoardLagTests.pointerStroke), and the board's kept moves
    /// (canvas.jsx, window.__pintoPen) turned off if not `kept`.
    static func ours(_ path: [CGPoint], box: CGSize, menuBarLoop: Bool = false, kept: Bool = true) async throws -> Drawn {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        let board = CanvasNote.make(in: .all, context: c.mainContext, scene: CanvasTests.scene([]), named: "Pen board")
        board.updatedAt = .now
        try c.mainContext.save()
        NotePageSandbox.forTests = { web in
            BoardStrokeTrafficTests.drawOffscreen(web)
            BoardLagTests.wakeful(web.configuration.preferences)
        }
        defer { NotePageSandbox.forTests = nil }
        let activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiated, .latencyCritical], reason: "BoardPenStrokeTests")
        defer { ProcessInfo.processInfo.endActivity(activity) }
        return try await AppSnapshotTests.withLastNote(c, board.title) {
            let (w, web) = try await BoardLagTests.boardWindow(c, board)
            defer { w.close(); w.contentViewController = nil }
            _ = try await BoardLagTests.js(web, "amber._canvas.api.updateScene({ appState: { zoom: { value: 1 } } }); amber._canvas.api.setActiveTool({ type: 'freedraw' }); if (window.__pintoPen) window.__pintoPen.off = \(!kept); return true")
            await MacWindowChromeTests.settle(w, 10)
            _ = try await BoardLagTests.js(web, watch)
            let o = CGPoint(x: (web.bounds.width - box.width) / 2, y: (web.bounds.height - box.height) / 2)
            let flagKey = "BoardPenStrokeTestsMenuBar"
            let flag = DefaultsFlag(flagKey, default: true)
            var observer: CFRunLoopObserver?
            if menuBarLoop {
                observer = CFRunLoopObserverCreateWithHandler(nil, CFRunLoopActivity.beforeWaiting.rawValue, true, 0) { _, _ in
                    MainActor.assumeIsolated { flag.value = true }
                }
                CFRunLoopAddObserver(CFRunLoopGetMain(), observer, .commonModes)
            }
            defer {
                if let observer { CFRunLoopRemoveObserver(CFRunLoopGetMain(), observer, .commonModes) }
                UserDefaults.standard.removeObject(forKey: flagKey)
            }
            let sent = try await draw(path.map { CGPoint(x: $0.x + o.x, y: $0.y + o.y) }, on: web)
            if let o = observer { CFRunLoopRemoveObserver(CFRunLoopGetMain(), o, .commonModes); observer = nil }
            return try await result(web, sent: sent)
        }
    }

    /// Plain Excalidraw (the board benchmark's page, the same version as the board's), built by
    /// `node canvas-stack/bench/build.mjs` into the folder TEST_RUNNER_BOARD_PLAIN names.
    nonisolated static var plainFolder: URL? {
        ProcessInfo.processInfo.environment["BOARD_PLAIN"].map { URL(fileURLWithPath: $0, isDirectory: true) }
            .flatMap { FileManager.default.fileExists(atPath: $0.appending(path: "index.html").path) ? $0 : nil }
    }

    static func plainPage(size: CGSize) async throws -> (NSWindow, WKWebView) {
        let dir = try #require(plainFolder)
        let config = WKWebViewConfiguration()
        BoardLagTests.wakeful(config.preferences)
        // As fast as the display, as the board's pages and Chrome draw.
        NotePageSandbox.drawAtDisplayRate(config.preferences)
        config.userContentController.addUserScript(WKUserScript(source: "window.__boardScene = { type: 'excalidraw', version: 2, elements: [], appState: {}, files: {} };",
                                                                injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
        let web = WKWebView(frame: CGRect(origin: .zero, size: size), configuration: config)
        BoardStrokeTrafficTests.drawOffscreen(web)
        let w = BoardLagTests.OffscreenWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                              styleMask: [.titled, .closable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.ignoresMouseEvents = true
        w.hasShadow = false
        w.animationBehavior = .none
        w.collectionBehavior = [.transient, .ignoresCycle, .stationary, .fullScreenNone]
        w.appearance = NSAppearance(named: .aqua)
        let holder = NSView(frame: CGRect(origin: .zero, size: size))
        web.frame = holder.bounds
        holder.addSubview(web)
        holder.addSubview(BoardLagTests.Heartbeat(frame: CGRect(x: 0, y: 0, width: 2, height: 2)))
        w.contentView = holder
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        w.orderBack(nil)
        guard !NSScreen.screens.contains(where: { $0.frame.intersects(w.frame) }), w.frame.minX < -10000 else {
            w.close()
            throw CocoaError(.featureUnsupported, userInfo: [NSLocalizedDescriptionKey: "the window came on a screen at \(w.frame); closed"])
        }
        web.loadFileURL(dir.appending(path: "index.html"), allowingReadAccessTo: dir)
        let deadline = CACurrentMediaTime() + 30
        var shown = false
        while !shown, CACurrentMediaTime() < deadline {
            try await Task.sleep(for: .milliseconds(50))
            shown = (try? await web.evaluateJavaScript("!!window.__boardShownAt")) as? Bool ?? false
        }
        guard shown else { w.close(); throw CocoaError(.featureUnsupported, userInfo: [NSLocalizedDescriptionKey: "plain Excalidraw never opened"]) }
        return (w, web)
    }

    static func plain(_ path: [CGPoint], box: CGSize, size: CGSize) async throws -> Drawn {
        let (w, web) = try await plainPage(size: size)
        defer { w.close(); w.contentView = nil }
        _ = try await BoardLagTests.js(web, "window.__excalidrawAPI.updateScene({ appState: { zoom: { value: 1 } } }); window.__excalidrawAPI.setActiveTool({ type: 'freedraw' }); return true")
        try await Task.sleep(for: .milliseconds(300))
        _ = try await BoardLagTests.js(web, watch)
        let o = CGPoint(x: (size.width - box.width) / 2, y: (size.height - box.height) / 2)
        let sent = try await draw(path.map { CGPoint(x: $0.x + o.x, y: $0.y + o.y) }, on: web)
        return try await result(web, sent: sent)
    }

    /// The strokes drawn by plain Excalidraw's own renderer, side by side in columns of `size`'s
    /// width over their count: the picture, and each stroke's ink (dark pixels) for comparing.
    static func pictures(_ strokes: [[String: Any]], size: CGSize) async throws -> (png: Data, inks: [[Bool]], width: Int, height: Int) {
        let (w, web) = try await plainPage(size: size)
        defer { w.close(); w.contentView = nil }
        let elements = strokes.enumerated().map { i, e -> [String: Any] in
            var e = e
            e["id"] = "stroke\(i)"
            e["type"] = "freedraw"
            // Each line's top left corner 20 points into its column.
            let points = (e["points"] as? [[Double]]) ?? (e["points"] as? [Any])?.compactMap { $0 as? [Double] } ?? []
            e["x"] = 20 + Double(i) * (Double(size.width) / Double(strokes.count)) - (points.map { $0[0] }.min() ?? 0)
            e["y"] = 20 - (points.map { $0[1] }.min() ?? 0)
            e["strokeColor"] = "#1e1e1e"
            e["opacity"] = 100
            e["angle"] = 0
            e["roughness"] = 1
            return e
        }
        let data = try JSONSerialization.data(withJSONObject: elements)
        let json = try #require(try await BoardLagTests.js(web, """
        const api = window.__excalidrawAPI;
        api.updateScene({ elements: \(String(decoding: data, as: UTF8.self)), appState: { zoom: { value: 1 }, scrollX: 0, scrollY: 0 } });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return document.querySelector('canvas.excalidraw__canvas.static').toDataURL('image/png')
        """) as? String)
        let png = try #require(Data(base64Encoded: String(json.drop { $0 != "," }.dropFirst())))
        let image = try #require(NSBitmapImageRep(data: png))
        let width = image.pixelsWide, height = image.pixelsHigh
        var inks: [[Bool]] = Array(repeating: [], count: strokes.count)
        let half = width / strokes.count
        for i in 0..<strokes.count {
            var ink = [Bool](); ink.reserveCapacity(half * height)
            for y in 0..<height {
                for x in (i * half)..<((i + 1) * half) {
                    let c = image.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB)
                    ink.append((c.map { ($0.redComponent + $0.greenComponent + $0.blueComponent) / 3 } ?? 1) < 0.5 && (c?.alphaComponent ?? 0) > 0.5)
                }
            }
            inks[i] = ink
        }
        return (png, inks, width, height)
    }

    /// Where the pictures go: TEST_RUNNER_BOARD_SHOTS (build/shots/emil-2 in the checkout), or nowhere.
    nonisolated static var shots: URL? { ProcessInfo.processInfo.environment["BOARD_SHOTS"].map { URL(fileURLWithPath: $0, isDirectory: true) } }

    static func describe(_ d: Drawn) -> String {
        let w = d.watch
        return "moves sent \(d.moves), page got \(w["moves"] ?? 0) (with merged \(w["coalesced"] ?? 0)), gaps p50 \(w["gapP50"] ?? 0) max \(w["gapMax"] ?? 0) ms, "
            + "points \(d.points) (on time \(onTime(d.sent).count)), simulatePressure \(d.element["simulatePressure"] ?? "?"), "
            + "pressure \((w["pressures"] as? [String: Int])?.keys.sorted() ?? []), buttons \((w["buttons"] as? [String: Int])?.keys.sorted() ?? []), width \(d.element["strokeWidth"] ?? "?")"
    }

    /// The stroke on the board keeps the pointer's moves: its line has the points plain Excalidraw
    /// gives the same moves when every frame is on time (within 5%), drawn with simulated pressure
    /// as Excalidraw draws a mouse's or trackpad's line (WebKit gives a held mouse button 0.5).
    @Test func aPencilStrokeKeepsThePointersMoves() async throws {
        let box = CGSize(width: 520, height: 300)
        let s = try await Self.ours(Self.scribble(in: box), box: box)
        print("PenStroke ours: \(Self.describe(s)), \(Self.frameRate) frames a second")
        let expected = Self.onTime(s.sent).count
        #expect(Double(s.points) >= Double(expected) * 0.95 && s.points <= expected + 2, "\(s.points) points, on time \(expected)")
        #expect(s.element["simulatePressure"] as? Bool == true)
        #expect((s.watch["types"] as? [String: Int])?.keys.sorted() == ["mouse"])
        #expect((s.watch["pressures"] as? [String: Int])?.keys.sorted() == ["0.5"], "\(s.watch["pressures"] ?? [:])")
    }

    /// The same, while the menu bar item reports in on every turn of the run loop, as on the
    /// owner's Mac (BoardLagTests.aStrokeWhileTheMenuBarItemReportsIn).
    @Test func aPencilStrokeKeepsItsMovesWhileTheMenuBarItemReportsIn() async throws {
        let box = CGSize(width: 520, height: 300)
        let s = try await Self.ours(Self.scribble(in: box), box: box, menuBarLoop: true)
        print("PenStroke loop: \(Self.describe(s))")
        let expected = Self.onTime(s.sent).count
        #expect(Double(s.points) >= Double(expected) * 0.95, "\(s.points) points, on time \(expected)")
        if let dir = Self.shots, Self.plainFolder != nil {
            let pic = try await Self.pictures([s.element, Self.onTimeElement(s.sent, like: s.element)], size: CGSize(width: 1180, height: 380))
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try pic.png.write(to: dir.appending(path: "pen-stroke-\(Self.label)-menu-bar-loop-ours-left-excalidraw-on-time-right.png"))
        }
    }

    nonisolated static var label: String { ProcessInfo.processInfo.environment["BOARD_SHOTS_LABEL"] ?? "after" }

    /// The same moves on the board and on plain Excalidraw come out the same: the board's line has
    /// the points, pressure handling and width plain Excalidraw gives them when every frame is on
    /// time, and the same ink (both drawn by plain Excalidraw's own renderer: at most a few percent
    /// of the ink differs). Plain Excalidraw drawing them live here is shown too: a frame it draws
    /// late loses moves (it keeps one a frame), as the board did before it kept them. Pictures: the
    /// board, plain Excalidraw on time, plain Excalidraw live, left to right.
    @Test(.enabled(if: plainFolder != nil, "plain Excalidraw is built (node canvas-stack/bench/build.mjs)"))
    func aPencilStrokeComesOutAsInPlainExcalidraw() async throws {
        let box = CGSize(width: 520, height: 300)
        let path = Self.scribble(in: box)
        let ours = try await Self.ours(path, box: box)
        let plain = try await Self.plain(path, box: box, size: CGSize(width: 1000, height: 640))
        let onTime = Self.onTimeElement(ours.sent, like: ours.element)
        print("PenStroke plain: \(Self.describe(plain))")
        print("PenStroke ours: \(Self.describe(ours))")
        let expected = (onTime["points"] as? [Any])?.count ?? 0
        #expect(abs(ours.points - expected) <= max(2, expected * 5 / 100), "points: ours \(ours.points), plain Excalidraw on time \(expected)")
        #expect(ours.element["simulatePressure"] as? Bool == plain.element["simulatePressure"] as? Bool)
        #expect((ours.element["pressures"] as? [Any])?.count == (plain.element["pressures"] as? [Any])?.count)
        #expect(ours.element["strokeWidth"] as? Double == plain.element["strokeWidth"] as? Double, "width: ours \(ours.element["strokeWidth"] ?? 0), plain \(plain.element["strokeWidth"] ?? 0)")
        let pic = try await Self.pictures([ours.element, onTime, plain.element], size: CGSize(width: 1680, height: 380))
        func share(_ a: [Bool], _ b: [Bool]) -> (union: Int, differ: Int, share: Double) {
            let union = zip(a, b).filter { $0 || $1 }.count, differ = zip(a, b).filter { $0 != $1 }.count
            return (union, differ, union > 0 ? Double(differ) / Double(union) : 1)
        }
        let mine = share(pic.inks[0], pic.inks[1]), live = share(pic.inks[2], pic.inks[1])
        print("PenStroke ink: ours vs on time \(mine.union) px, \(mine.differ) differ (\(Int(mine.share * 100))%); plain live vs on time \(live.differ) differ (\(Int(live.share * 100))%)")
        #expect(mine.share < 0.12, "the ink differs in \(Int(mine.share * 100))% of its pixels")
        if let dir = Self.shots {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try pic.png.write(to: dir.appending(path: "pen-stroke-\(Self.label)-ours-excalidraw-on-time-excalidraw-live.png"))
        }
    }
}
#endif
