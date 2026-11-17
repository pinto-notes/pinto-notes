#if os(macOS)
import AppKit
import Darwin
import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// Drawing on a board leaves the rest of the window alone (Emil, 17 November 2026: the whiteboard
/// was "10 fps laggy" on his Mac, and a sample showed its main thread all but always busy working
/// out the window again: RootView, the note's view, its toolbar and the menus, for every stroke).
///
/// The app's own window, as it opens a board: the demo library, the whole window (folders, list,
/// toolbar, the board's controls), off every screen and never key. A pencil stroke of 300 points
/// goes through the real page and bridge (pointer events dispatched inside the page by the board
/// benchmark's driver, canvas-stack/bench/driver.js: nothing reaches the system), and the probe
/// counts how often the window's big views worked out their bodies meanwhile. The menus (PaneCommands)
/// aren't made for a window that's never key; they're given new values only when RootView or the
/// note's view work theirs out (focusedSceneValue), so those two counts are theirs too.
@MainActor @Suite(.serialized) struct BoardLagTests {
    /// A board with something on it, as one in use has.
    static func shapes(_ n: Int = 40) -> [[String: Any]] {
        (0..<n).map { i in
            var e: [String: Any] = ["id": "s\(i)", "width": 110, "height": 80, "backgroundColor": "#a5d8ff", "fillStyle": "solid"]
            e["type"] = i % 3 == 0 ? "ellipse" : "rectangle"
            e["x"] = Double(i % 8) * 140
            e["y"] = Double(i / 8) * 110
            return e
        }
    }

    /// The demo library, in memory, with a board on it.
    static func library() throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        let board = CanvasNote.make(in: .all, context: c.mainContext, scene: CanvasTests.scene(shapes()), named: "Lag board")
        board.updatedAt = .now
        try c.mainContext.save()
        return (c, board)
    }

    /// The main thread's own CPU time, in ms.
    static func mainThreadCPU() -> Double {
        var info = thread_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<thread_basic_info>.size / MemoryLayout<integer_t>.size)
        let port = pthread_mach_thread_np(pthread_self())
        let ok = withUnsafeMutablePointer(to: &info) { p in
            p.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { thread_info(port, thread_flavor_t(THREAD_BASIC_INFO), $0, &count) }
        }
        guard ok == KERN_SUCCESS else { return 0 }
        let user = Double(info.user_time.seconds) * 1000 + Double(info.user_time.microseconds) / 1000
        let system = Double(info.system_time.seconds) * 1000 + Double(info.system_time.microseconds) / 1000
        return user + system
    }

    /// Writes to the app's defaults while it runs (a view on a key with a dot in it is told of every one).
    final class Writes: @unchecked Sendable { var count = 0 }

    /// One stroke on the board in the app's window: the window's big views' body counts, the
    /// defaults written, the main thread's share of the stroke's time, and the page's own numbers.
    struct Stroke {
        var counts: [String: Int]
        var defaultsWrites: Int
        var mainBusy: Double
        var run: [String: Any]
    }

    /// Titled, so the toolbar and the board's controls are made as on screen, but never on one: at
    /// (-20000, -20000) and kept there (AppKit moves a window it orders in onto a screen unless the
    /// window says no), never key, never clicked, out of the window cycle.
    final class OffscreenWindow: NSWindow {
        override func constrainFrameRect(_ frameRect: NSRect, to screen: NSScreen?) -> NSRect { frameRect }
        override var canBecomeKey: Bool { false }
        override var canBecomeMain: Bool { false }
    }

    /// WebKit's idle throttles off for a page (as PaneBench's BoardPerfTests does): nobody sees a
    /// window off every screen, and WebKit would otherwise hold the page's timers, let its process
    /// nap, or stop answering scripts altogether (this test's first run waited on the page for good).
    static func wakeful(_ preferences: WKPreferences) {
        guard let all = (WKPreferences.perform(NSSelectorFromString("_features"))?.takeUnretainedValue()) as? [NSObject],
              let imp = class_getMethodImplementation(WKPreferences.self, NSSelectorFromString("_setEnabled:forFeature:")) else { return }
        typealias SetFeature = @convention(c) (AnyObject, Selector, Bool, AnyObject) -> Void
        let off = ["HiddenPageDOMTimerThrottlingEnabled", "PageVisibilityBasedProcessSuppressionEnabled", "BackgroundWebContentRunningBoardThrottlingEnabled"]
        for f in all where off.contains(f.value(forKey: "key") as? String ?? "") {
            unsafeBitCast(imp, to: SetFeature.self)(preferences, NSSelectorFromString("_setEnabled:forFeature:"), false, f)
        }
    }

    /// Keeps the window changing, as one on a screen does (off every screen, the window server
    /// counts a window whose only change is its web view's as idle): a 2 pt square that changes
    /// colour 120 times a second.
    final class Heartbeat: NSView {
        private var timer: Timer?
        private var on = false
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            timer?.invalidate()
            guard window != nil else { timer = nil; return }
            wantsLayer = true
            let t = Timer(timeInterval: 1.0 / 120, repeats: true) { [weak self] _ in MainActor.assumeIsolated { self?.beat() } }
            RunLoop.main.add(t, forMode: .common)
            timer = t
        }
        private func beat() {
            on.toggle()
            layer?.backgroundColor = on ? NSColor.white.cgColor : NSColor(white: 0.99, alpha: 1).cgColor
        }
    }

    struct Late: Error, CustomStringConvertible { let description: String }

    /// A script in the page, given up on after `seconds` (a page WebKit has stopped never answers).
    static func js(_ web: WKWebView, _ body: String, seconds: Double = 30) async throws -> Any? {
        final class Once: @unchecked Sendable { var done = false }
        struct Box: @unchecked Sendable { let value: Any? }
        let once = Once()
        return try await withCheckedThrowingContinuation { (k: CheckedContinuation<Box, Error>) in
            web.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { result in
                guard !once.done else { return }
                once.done = true
                switch result {
                case .success(let v): k.resume(returning: Box(value: v))
                case .failure(let e): k.resume(throwing: e)
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
                guard !once.done else { return }
                once.done = true
                k.resume(throwing: Late(description: "the page didn't answer in \(Int(seconds)) s: \(body.prefix(80))"))
            }
        }.value
    }

    /// The app's window with the board open, ordered in behind everything (WebKit draws only into a
    /// window in the window list); closed at once if it isn't off every screen.
    static func boardWindow(_ c: ModelContainer, _ board: Note, size: CGSize = CGSize(width: 1400, height: 900)) async throws -> (NSWindow, WKWebView) {
        let w = OffscreenWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.ignoresMouseEvents = true
        w.hasShadow = false
        w.animationBehavior = .none
        w.collectionBehavior = [.transient, .ignoresCycle, .stationary, .fullScreenNone]
        w.appearance = NSAppearance(named: .aqua)
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
            .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
        w.setContentSize(size)
        w.contentView?.addSubview(Heartbeat(frame: CGRect(x: 0, y: 0, width: 2, height: 2)))
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        guard !NSScreen.screens.contains(where: { $0.frame.intersects(w.frame) }) else {
            w.close()
            throw CocoaError(.featureUnsupported, userInfo: [NSLocalizedDescriptionKey: "the window would be on a screen at \(w.frame)"])
        }
        w.orderBack(nil)
        guard !NSScreen.screens.contains(where: { $0.frame.intersects(w.frame) }), w.frame.minX < -10000 else {
            w.close()
            throw CocoaError(.featureUnsupported, userInfo: [NSLocalizedDescriptionKey: "the window came on a screen at \(w.frame); closed"])
        }
        do {
            await MacWindowChromeTests.settle(w, 20)
            var found: WKWebView?
            let deadline = CACurrentMediaTime() + 30
            while found == nil, CACurrentMediaTime() < deadline {
                found = NotePageLive.view(board.id)
                if found == nil { await MacWindowChromeTests.settle(w, 1) }
            }
            let web = try #require(found, "the whiteboard opened")
            var ready = false
            while !ready, CACurrentMediaTime() < deadline + 30 {
                ready = try await js(web, "return !!(window.amber && window.amber._canvas && document.querySelector('canvas.interactive'))") as? Bool ?? false
                if !ready { try await Task.sleep(for: .milliseconds(50)) }
            }
            try #require(ready, "the whiteboard was ready to draw on")
            return (w, web)
        } catch {
            w.close()
            throw error
        }
    }

    static func stroke(points: Int = 300, rate: Int = 120, printChanges: Bool = false) async throws -> Stroke {
        let (c, board) = try library()
        // Every page drawn off screen and kept awake from the moment it's made, before it loads.
        NotePageSandbox.forTests = { web in
            BoardStrokeTrafficTests.drawOffscreen(web)
            wakeful(web.configuration.preferences)
        }
        defer { NotePageSandbox.forTests = nil }
        // As in use: the app you draw in is frontmost and never napped (the test host is an
        // accessory app with its windows off screen, which macOS naps).
        let activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiated, .latencyCritical], reason: "BoardLagTests")
        defer { ProcessInfo.processInfo.endActivity(activity) }
        return try await AppSnapshotTests.withLastNote(c, board.title) {
            let (w, web) = try await boardWindow(c, board)
            defer { w.close(); w.contentViewController = nil }
            #expect(!NSScreen.screens.contains { $0.frame.intersects(w.frame) }, "the window stays off every screen")
            _ = try await js(web, try SettingsHomeTests.source("canvas-stack/bench/driver.js") + "\nreturn true")
            _ = try await js(web, "return JSON.stringify(await __boardBench.fit())")
            // Everything the open set going has settled (the list's pictures, the first save).
            await MacWindowChromeTests.settle(w, 15)

            let writes = Writes()
            let token = NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification, object: nil, queue: nil) { _ in writes.count += 1 }
            defer { NotificationCenter.default.removeObserver(token) }
            RenderProbe.begin(in: c.mainContext)
            RenderProbe.printsChanges = printChanges
            defer { RenderProbe.printsChanges = false; RenderProbe.end(in: c.mainContext) }
            let cpu0 = mainThreadCPU(), t0 = CACurrentMediaTime()
            let duration = Double(points) / Double(rate) * 1000
            let json = try #require(try await js(web,
                "return await __boardBench.run('freedraw', { duration: \(Int(duration)), rate: \(rate), lead: 200, tail: 1200 })") as? String)
            let cpu = mainThreadCPU() - cpu0, wall = (CACurrentMediaTime() - t0) * 1000
            let run = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
            return Stroke(counts: RenderProbe.values(in: c.mainContext), defaultsWrites: writes.count, mainBusy: 100 * cpu / wall, run: run)
        }
    }

    /// What the page saw of a stroke given to the window as a pointer gives it.
    static let pageWatch = """
    (() => {
      const w = window.__lagWatch = { moves: 0, frames: [], on: true, t0: performance.now() };
      addEventListener('pointermove', () => { w.moves++; }, { capture: true, passive: true });
      const tick = (t) => { if (!w.on) return; w.frames.push(t); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    })(); return true
    """
    static let pageWatchEnd = """
    const w = window.__lagWatch; w.on = false;
    const gaps = []; for (let i = 1; i < w.frames.length; i++) gaps.push(w.frames[i] - w.frames[i - 1]);
    gaps.sort((a, b) => a - b);
    const p = (q) => gaps.length ? Math.round(gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))] * 10) / 10 : null;
    const els = amber._canvas.api.getSceneElements().filter((e) => e.type === 'freedraw');
    const last = els[els.length - 1];
    const span = w.frames.length > 1 ? (w.frames[w.frames.length - 1] - w.frames[0]) / 1000 : 0;
    return JSON.stringify({ moves: w.moves, frames: w.frames.length, fps: span ? Math.round(w.frames.length / span) : 0,
      p50: p(0.5), p95: p(0.95), max: gaps.length ? Math.round(gaps[gaps.length - 1]) : null,
      points: last ? last.points.length : 0, strokes: els.length })
    """

    /// The window's frame view, for hit tests in window coordinates (hitTest takes its receiver's
    /// superview's coordinates; the frame view has none).
    static func hit(_ w: NSWindow, _ p: CGPoint) -> NSView? {
        guard let frame = w.contentView?.superview else { return nil }
        return frame.hitTest(frame.convert(p, from: nil))
    }

    /// WebKit gives the page's pointer events the buttons the Mac says are held
    /// (NSEvent.pressedMouseButtons), not the event's own: a drag handed to the web view while no
    /// button is held on the Mac reaches the page with no buttons and no pressure (0, where a held
    /// mouse button gives 0.5), unlike a real drag. While a stroke is given, this process is told
    /// the left button is held (nothing changes outside it). The closure puts it back.
    static func holdLeftButton() -> () -> Void {
        guard let m = class_getClassMethod(NSEvent.self, #selector(getter: NSEvent.pressedMouseButtons)) else { return {} }
        let held: @convention(block) (AnyObject) -> Int = { _ in 1 }
        let original = method_setImplementation(m, imp_implementationWithBlock(held))
        return { method_setImplementation(m, original) }
    }

    static func mouse(_ type: NSEvent.EventType, _ p: CGPoint, _ w: NSWindow) -> NSEvent {
        NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                           windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1)!
    }

    /// One pencil stroke given to the board as the pointer gives it: mouse down, `points` drags at
    /// `rate` a second, mouse up, each handed to the web view in this process (its own mouse
    /// methods: WebKit makes the page's pointer events from them, as from a real pointer; nothing
    /// is posted to the system). A window in an app that isn't active is never key, so these go to
    /// the web view, not through the window (which would refuse them). What the page saw of it,
    /// the big views' body counts, the main thread's share of the stroke's time, and how long the
    /// app took over each event.
    static func pointerStroke(points: Int = 300, rate: Double = 120, printChanges: Bool = false, menuBarLoop: Bool = false) async throws -> (Stroke, [String: Any]) {
        let (c, board) = try library()
        NotePageSandbox.forTests = { web in
            BoardStrokeTrafficTests.drawOffscreen(web)
            wakeful(web.configuration.preferences)
        }
        defer { NotePageSandbox.forTests = nil }
        let activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiated, .latencyCritical], reason: "BoardLagTests")
        defer { ProcessInfo.processInfo.endActivity(activity) }
        return try await AppSnapshotTests.withLastNote(c, board.title) {
            let (w, web) = try await boardWindow(c, board)
            defer { w.close(); w.contentViewController = nil }
            #expect(!NSScreen.screens.contains { $0.frame.intersects(w.frame) }, "the window stays off every screen")
            // The pencil, picked as from the palette.
            _ = try await js(web, "amber._canvas.api.setActiveTool({ type: 'freedraw' }); return true")
            await MacWindowChromeTests.settle(w, 15)
            // A path over the middle of the board: a wide loop, clear of the controls on it.
            let board = web.convert(web.bounds, to: nil)
            let mid = CGPoint(x: board.midX, y: board.midY)
            let path: [CGPoint] = (0..<points).map { i in
                let t = Double(i) / Double(points - 1) * 2 * .pi
                return CGPoint(x: mid.x + board.width * 0.22 * sin(t), y: mid.y + board.height * 0.18 * sin(2 * t))
            }
            for p in [path[0], path[points / 4], path[points / 2]] {
                let v = try #require(hit(w, p), "something is under \(p)")
                try #require(v === web || v.isDescendant(of: web), "the board is under \(p), not \(type(of: v))")
            }
            _ = try await js(web, pageWatch)

            let writes = Writes()
            let token = NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification, object: nil, queue: nil) { _ in writes.count += 1 }
            defer { NotificationCenter.default.removeObserver(token) }
            RenderProbe.begin(in: c.mainContext)
            RenderProbe.printsChanges = printChanges
            defer { RenderProbe.printsChanges = false; RenderProbe.end(in: c.mainContext) }
            // The owner's loop, as the menu bar item drove it: its "shown" flag set again on every
            // turn of the main run loop, with what it already holds (SwiftUI sets the item's
            // binding each time its status item reports in). A key of this test's own: the app's
            // real menu bar setting is left alone. Nothing at all when the flag writes only a change.
            let flagKey = "BoardLagTestsMenuBar"
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
            let cpu0 = mainThreadCPU(), t0 = CACurrentMediaTime()
            var handling: [Double] = []
            @MainActor func send(_ e: NSEvent) {
                let s = CACurrentMediaTime()
                switch e.type {
                case .leftMouseDown: web.mouseDown(with: e)
                case .leftMouseDragged: web.mouseDragged(with: e)
                default: web.mouseUp(with: e)
                }
                handling.append((CACurrentMediaTime() - s) * 1000)
            }
            var release: (() -> Void)? = holdLeftButton()
            defer { release?() }
            send(mouse(.leftMouseDown, path[0], w))
            let step = 1 / rate
            var next = CACurrentMediaTime() + step
            for p in path.dropFirst() {
                let wait = next - CACurrentMediaTime()
                if wait > 0 { try await Task.sleep(for: .seconds(wait)) } else { await Task.yield() }
                next += step
                send(mouse(.leftMouseDragged, p, w))
            }
            release?(); release = nil
            send(mouse(.leftMouseUp, path[points - 1], w))
            let strokeWall = (CACurrentMediaTime() - t0) * 1000, strokeCPU = mainThreadCPU() - cpu0
            if let o = observer { CFRunLoopRemoveObserver(CFRunLoopGetMain(), o, .commonModes); observer = nil }
            // The pen up and what follows it (the save, the state).
            try await Task.sleep(for: .milliseconds(1200))
            let page = try JSONSerialization.jsonObject(with: Data((try #require(try await js(web, pageWatchEnd) as? String)).utf8)) as? [String: Any] ?? [:]
            handling.sort()
            let main: [String: Any] = ["strokeMs": Int(strokeWall), "busyPct": Int(100 * strokeCPU / strokeWall),
                                       "eventP50": (handling[handling.count / 2] * 100).rounded() / 100,
                                       "eventP95": (handling[Int(Double(handling.count) * 0.95)] * 100).rounded() / 100,
                                       "eventMax": ((handling.last ?? 0) * 100).rounded() / 100]
            return (Stroke(counts: RenderProbe.values(in: c.mainContext), defaultsWrites: writes.count, mainBusy: 100 * strokeCPU / strokeWall, run: page), main)
        }
    }

    /// A stroke as the pointer gives it: the window's big views (RootView, the note's view, its
    /// toolbar) work out their bodies a couple of times in all, not on every move; the page gets
    /// every move and draws the stroke.
    @Test func aPointerStrokeLeavesTheWindowAlone() async throws {
        let (s, main) = try await Self.pointerStroke(printChanges: ProcessInfo.processInfo.environment["BOARD_LAG_PRINT"] != nil)
        print("BoardLagPointer: \(s.counts.sorted { $0.key < $1.key }) defaults writes \(s.defaultsWrites), main \(main), page \(s.run)")
        let moves = s.run["moves"] as? Int ?? 0
        #expect(moves >= 290, "the page got the stroke's moves: \(moves)")
        #expect(s.run["points"] as? Int ?? 0 >= 150, "the stroke was drawn: \(s.run["points"] ?? 0) points")
        for view in ["RootView", "NoteDetailView", "NoteToolbarStage"] {
            #expect(s.counts[view, default: 0] <= 2, "\(view) worked out its body \(s.counts[view, default: 0]) times for one stroke")
        }
    }

    /// A stroke while the menu bar item reports in on every turn of the run loop, as it did on the
    /// owner's Mac: its flag, set to what it holds, writes nothing, so the window isn't worked out
    /// again on every turn, and the page gets the stroke's moves and draws on time.
    @Test func aStrokeWhileTheMenuBarItemReportsIn() async throws {
        let (s, main) = try await Self.pointerStroke(printChanges: ProcessInfo.processInfo.environment["BOARD_LAG_PRINT"] != nil, menuBarLoop: true)
        print("BoardLagMenuBar: \(s.counts.sorted { $0.key < $1.key }) defaults writes \(s.defaultsWrites), main \(main), page \(s.run)")
        #expect(s.defaultsWrites <= 1, "the flag wrote \(s.defaultsWrites) times")
        for view in ["RootView", "NoteDetailView", "NoteToolbarStage"] {
            #expect(s.counts[view, default: 0] <= 2, "\(view) worked out its body \(s.counts[view, default: 0]) times for one stroke")
        }
        #expect(s.run["moves"] as? Int ?? 0 >= 290, "the page got the stroke's moves: \(s.run["moves"] ?? 0)")
    }

    /// A write to the app's defaults, of a setting none of the window's views shows, leaves the
    /// window alone. The owner's sample (17 November 2026) had the window working itself out again
    /// in a loop: the menu bar item's status item told SwiftUI it was shown, its binding wrote that
    /// to the defaults every time, and RootView, on a setting whose name has a dot in it
    /// ("experiment.layout": SwiftUI can't watch such a key on its own and redraws on every write
    /// to the defaults), worked out the whole window again, which updated the menu bar item again.
    @Test func aDefaultsWriteLeavesTheWindowAlone() async throws {
        let (c, board) = try Self.library()
        NotePageSandbox.forTests = { web in
            BoardStrokeTrafficTests.drawOffscreen(web)
            Self.wakeful(web.configuration.preferences)
        }
        defer { NotePageSandbox.forTests = nil }
        let key = "BoardLagTestsUnrelated"
        defer { UserDefaults.standard.removeObject(forKey: key) }
        let counts: [String: Int] = try await AppSnapshotTests.withLastNote(c, board.title) {
            let (w, _) = try await Self.boardWindow(c, board)
            defer { w.close(); w.contentViewController = nil }
            await MacWindowChromeTests.settle(w, 15)
            RenderProbe.begin(in: c.mainContext)
            RenderProbe.printsChanges = ProcessInfo.processInfo.environment["BOARD_LAG_PRINT"] != nil
            defer { RenderProbe.printsChanges = false; RenderProbe.end(in: c.mainContext) }
            for i in 0..<5 {
                UserDefaults.standard.set(i, forKey: key)
                await MacWindowChromeTests.settle(w, 3)
            }
            return RenderProbe.values(in: c.mainContext)
        }
        print("BoardLagDefaults: \(counts.sorted { $0.key < $1.key })")
        for view in ["RootView", "NoteDetailView", "NoteToolbarStage"] {
            #expect(counts[view, default: 0] == 0, "\(view) worked out its body \(counts[view, default: 0]) times for 5 writes to an unrelated setting")
        }
    }

    /// A stroke works out the window's big views no more than a couple of times in all (its start
    /// and its end), not once a frame: RootView, the note's view and its toolbar.
    @Test func aStrokeLeavesTheWindowAlone() async throws {
        let s = try await Self.stroke(printChanges: ProcessInfo.processInfo.environment["BOARD_LAG_PRINT"] != nil)
        let moves = s.run["moves"] as? Int ?? 0
        print("BoardLag: \(s.counts.sorted { $0.key < $1.key }) defaults writes \(s.defaultsWrites), main thread \(Int(s.mainBusy))% of the stroke, \(moves) moves, inked \(s.run["inked"] ?? 0), traffic \(s.run["traffic"] ?? [:])")
        #expect(moves >= 290, "the stroke was drawn: \(moves) moves")
        for view in ["RootView", "NoteDetailView", "NoteToolbarStage"] {
            #expect(s.counts[view, default: 0] <= 2, "\(view) worked out its body \(s.counts[view, default: 0]) times for one stroke")
        }
    }
}
#endif
