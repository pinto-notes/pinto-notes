import AppKit
import Darwin
import Foundation
import QuartzCore
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// The board benchmark (scripts/board-perf.sh): how a whiteboard of 500 and 2000 elements feels in
/// the app, against plain Excalidraw (the same version) in a plain web view, on the same machine
/// at the same moment. The board is the app's own: the whole window (list, toolbar, the board's
/// controls) in a window off every screen, drawn into by WebKit as on screen. Pointer and wheel
/// events are dispatched inside the page (canvas-stack/bench/driver.js): nothing reaches the system.
///
/// Runs only when BOARD_PERF names the benchmark's folder (TEST_RUNNER_BOARD_PERF=build/board-perf,
/// made by canvas-stack/bench/build.mjs) and writes results-<BOARD_PERF_LABEL>.json there. Timing
/// never gates anything; the check that a stroke sends the app nothing while it's drawn does
/// (PaneTests/BoardStrokeTrafficTests). A target of its own, so a change to it builds in seconds.
@MainActor @Suite(.serialized) struct BoardPerfTests {
    static let env = ProcessInfo.processInfo.environment
    static var folder: URL? { env["BOARD_PERF"].map { URL(fileURLWithPath: $0, isDirectory: true) } }
    static var label: String { env["BOARD_PERF_LABEL"] ?? "idle" }
    static var sizes: [Int] { (env["BOARD_PERF_SIZES"] ?? "500,2000").split(separator: ",").compactMap { Int($0) } }
    static var only: Set<String> { Set((env["BOARD_PERF_ONLY"] ?? "pinto,plain,plain120").split(separator: ",").map(String.init)) }
    /// Seconds of each scenario.
    static var seconds: Double { Double(env["BOARD_PERF_SECONDS"] ?? "3") ?? 3 }
    /// Seconds of drawing on the biggest board while its memory is watched (0: none).
    static var soak: Double { Double(env["BOARD_PERF_SOAK"] ?? "0") ?? 0 }
    static let windowSize = CGSize(width: 1400, height: 900)

    // MARK: A window off every screen that WebKit still draws into

    /// Titled, so the app's toolbar (the board's tools) is made as on screen, but never on one: at
    /// (-20000, -20000), kept there (no constraining onto a screen), behind every window, never key,
    /// never clicked, out of Mission Control and the window cycle. Ordered in, as WebKit draws only
    /// into a window in the window list; its web views' occlusion checks are off (drawOffscreen), as
    /// off every screen they'd count as hidden and stop drawing.
    final class OffscreenWindow: NSWindow {
        override func constrainFrameRect(_ frameRect: NSRect, to screen: NSScreen?) -> NSRect { frameRect }
        override var canBecomeKey: Bool { false }
        override var canBecomeMain: Bool { false }
    }

    /// Keeps the app's windows changing, as they do on a screen. Off every screen, the window server
    /// counts a window whose only change is its web view's as unchanged after a few seconds, and
    /// WebKit then treats the page as visually idle: frames 30 a second, timers held for a second
    /// (plain Excalidraw's first runs, 16 November 2026). A 2 pt square that changes colour every
    /// frame, in every benchmark window alike. On a timer, not the display's link: a window off every
    /// screen has no display, and its link stopped (the plain runs of the first baseline went to 30
    /// frames a second again, minutes in). Not enough on its own: see `wakeful`.
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

    /// Whether WebKit is holding the page back as idle (timers held a second, frames halved): a
    /// probe of 400 ms. The benchmark pokes its windows and waits for it to pass before measuring.
    static let throttledProbe = """
    return await new Promise((done) => {
      const late = []; let frames = 0; const t0 = performance.now();
      const tick = () => { frames++; if (performance.now() - t0 < 400) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      const probe = () => { const s = performance.now(); setTimeout(() => { late.push(performance.now() - s - 5); if (performance.now() - t0 < 400) probe(); else done(JSON.stringify({ late: Math.max(...late), frames })); }, 5); };
      probe();
    });
    """

    /// The primary display's top rate: where WebKit draws a window that's on no screen.
    static var displayFPS: Double { Double(NSScreen.screens.first?.maximumFramesPerSecond ?? 60) }

    /// Waits (up to 5 s) until the page isn't held back as idle; false if it still is. `fps`: the
    /// rate the page draws at awake (halved, 120 a second is still 60, which a 60 Hz page reaches).
    static func awake(_ web: WKWebView, fps: Double) async -> Bool {
        let least = (fps * 0.4 * 0.75).rounded(.down)
        for _ in 0..<12 {
            if let j = try? await web.callAsyncJavaScript(throttledProbe, contentWorld: .page) as? String,
               let m = try? JSONSerialization.jsonObject(with: Data(j.utf8)) as? [String: Double],
               (m["late"] ?? 1000) < 200, (m["frames"] ?? 0) >= least { return true }
            web.window?.contentView?.needsDisplay = true
            web.window?.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(100))
        }
        return false
    }

    static func beat(_ w: NSWindow) {
        guard let v = w.contentView else { return }
        let h = Heartbeat(frame: CGRect(x: 0, y: 0, width: 2, height: 2))
        v.addSubview(h)
    }

    static func window(_ size: CGSize, titled: Bool) -> NSWindow {
        let style: NSWindow.StyleMask = titled ? [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView] : [.borderless]
        let w = OffscreenWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: style, backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.ignoresMouseEvents = true
        w.hasShadow = false
        w.animationBehavior = .none
        w.collectionBehavior = [.transient, .ignoresCycle, .stationary, .fullScreenNone]
        w.appearance = NSAppearance(named: .aqua)
        return w
    }

    /// Into the window list, behind everything; closed at once if it isn't off every screen.
    static func show(_ w: NSWindow) throws {
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        w.orderBack(nil)
        let onScreen = NSScreen.screens.contains { $0.frame.intersects(w.frame) }
        if onScreen || w.frame.minX > -10000 { w.close(); throw Failure("the benchmark's window came on screen at \(w.frame); closed") }
    }

    struct Failure: Error, CustomStringConvertible { let description: String; init(_ s: String) { description = s } }

    /// WebKit's own check of whether the view is seen, off: off every screen, the page would be
    /// hidden (no animation frames, timers slowed).
    static func drawOffscreen(_ web: WKWebView) {
        let sel = NSSelectorFromString("_setWindowOcclusionDetectionEnabled:")
        guard web.responds(to: sel), let imp = class_getMethodImplementation(WKWebView.self, sel) else { return }
        typealias Set = @convention(c) (AnyObject, Selector, Bool) -> Void
        unsafeBitCast(imp, to: Set.self)(web, sel, false)
    }

    /// WebKit's idle throttles off, every page alike (Pinto's and plain Excalidraw's), as nobody
    /// sees a window off every screen: about a minute in, WebKit held each page's timers for up to
    /// a second and let its web content process nap (timers 100 ms late, 17 frames a second). What
    /// these leave is WebKit halving the frame rate, for every page of the app at once, about a
    /// minute after it starts; nothing done off screen undid it or kept it off (new views, new
    /// windows, moves, resizes, redraws; 16 November 2026). So each subject runs in an app of its
    /// own (scripts/board-perf.sh), and a scenario started at half the rate is marked.
    static func wakeful(_ preferences: WKPreferences) {
        guard let all = (WKPreferences.perform(NSSelectorFromString("_features"))?.takeUnretainedValue()) as? [NSObject],
              let imp = class_getMethodImplementation(WKPreferences.self, NSSelectorFromString("_setEnabled:forFeature:")) else { return }
        typealias SetFeature = @convention(c) (AnyObject, Selector, Bool, AnyObject) -> Void
        let off = ["HiddenPageDOMTimerThrottlingEnabled", "PageVisibilityBasedProcessSuppressionEnabled", "BackgroundWebContentRunningBoardThrottlingEnabled"]
        for f in all where off.contains(f.value(forKey: "key") as? String ?? "") {
            unsafeBitCast(imp, to: SetFeature.self)(preferences, NSSelectorFromString("_setEnabled:forFeature:"), false, f)
        }
    }

    /// The web content process behind a view.
    static func pid(_ web: WKWebView) -> pid_t? {
        (web.value(forKey: "_webProcessIdentifier") as? NSNumber).map { pid_t($0.int32Value) }.flatMap { $0 > 0 ? $0 : nil }
    }

    // MARK: The main thread and the processes

    /// The main thread's run loop as it runs: how long each turn took (a task anything waiting on
    /// the main thread waits for, the web view's frames included) and how long it was awake.
    final class MainWatch {
        private var observer: CFRunLoopObserver?
        private var turnAt = 0.0, wokeAt = 0.0, began = 0.0
        private(set) var turns: [Double] = []
        private(set) var awake = 0.0
        private(set) var wall = 0.0
        /// Each turn over 8 ms: when it began (epoch ms, as the page's clock gives it) and how long.
        private(set) var long: [[Double]] = []
        private var epochOffset = 0.0
        private func long(_ began: Double, _ d: Double) { if d > 8 { long.append([BoardPerfTests.r(began + epochOffset), BoardPerfTests.r(d)]) } }

        func start() {
            turns = []; awake = 0; turnAt = 0; wokeAt = 0; long = []
            epochOffset = Date().timeIntervalSince1970 * 1000 - CACurrentMediaTime() * 1000
            began = CACurrentMediaTime() * 1000
            let mask = CFRunLoopActivity.afterWaiting.rawValue | CFRunLoopActivity.beforeTimers.rawValue | CFRunLoopActivity.beforeWaiting.rawValue | CFRunLoopActivity.exit.rawValue
            let o = CFRunLoopObserverCreateWithHandler(nil, mask, true, 0) { [unowned self] _, activity in
                let t = CACurrentMediaTime() * 1000
                switch activity {
                case .afterWaiting: self.wokeAt = t; self.turnAt = t
                case .beforeTimers: if self.turnAt > 0 { self.turns.append(t - self.turnAt); self.long(self.turnAt, t - self.turnAt) }; self.turnAt = t
                default:
                    if self.turnAt > 0 { self.turns.append(t - self.turnAt); self.long(self.turnAt, t - self.turnAt) }
                    self.turnAt = 0
                    if self.wokeAt > 0 { self.awake += t - self.wokeAt; self.wokeAt = 0 }
                }
            }
            CFRunLoopAddObserver(CFRunLoopGetMain(), o, .commonModes)
            observer = o
        }

        func stop() -> [String: Any] {
            if let observer { CFRunLoopRemoveObserver(CFRunLoopGetMain(), observer, .commonModes) }
            observer = nil
            wall = CACurrentMediaTime() * 1000 - began
            let s = turns.sorted()
            func p(_ q: Double) -> Double { s.isEmpty ? 0 : s[min(s.count - 1, Int((q * Double(s.count)).rounded(.up)) - 1 < 0 ? 0 : Int((q * Double(s.count)).rounded(.up)) - 1)] }
            return ["turns": turns.count, "p95": BoardPerfTests.r(p(0.95)), "p99": BoardPerfTests.r(p(0.99)), "max": BoardPerfTests.r(s.last ?? 0),
                    "over8": turns.filter { $0 > 8 }.count, "over16": turns.filter { $0 > 16 }.count,
                    "busy": BoardPerfTests.r(wall > 0 ? 100 * awake / wall : 0), "long": Array(long.prefix(40))]
        }
    }

    nonisolated static func r(_ x: Double) -> Double { (x * 100).rounded() / 100 }

    /// CPU time (ms) and memory of a process: this one (the app), or a web content process.
    struct Usage {
        var cpu: Double, footprint: UInt64
        static let ticksPerNs: Double = {
            var tb = mach_timebase_info_data_t()
            mach_timebase_info(&tb)
            return Double(tb.numer) / Double(tb.denom)
        }()
        /// Whether the kernel gives CPU time in mach ticks (it does on Apple silicon) or nanoseconds:
        /// worked out on this process against getrusage, once.
        static let inTicks: Bool = {
            guard let raw = rawCPU(getpid()) else { return false }
            var u = rusage()
            getrusage(RUSAGE_SELF, &u)
            let ms = Double(u.ru_utime.tv_sec + u.ru_stime.tv_sec) * 1000 + Double(u.ru_utime.tv_usec + u.ru_stime.tv_usec) / 1000
            return raw.cpu / 1e6 < ms / 4
        }()
        static func rawCPU(_ pid: pid_t) -> (cpu: Double, footprint: UInt64)? {
            var info = rusage_info_v4()
            let ok = withUnsafeMutablePointer(to: &info) { p in
                p.withMemoryRebound(to: rusage_info_t?.self, capacity: 1) { proc_pid_rusage(pid, RUSAGE_INFO_V4, $0) }
            }
            guard ok == 0 else { return nil }
            return (Double(info.ri_user_time + info.ri_system_time), info.ri_phys_footprint)
        }
        static func of(_ pid: pid_t) -> Usage? {
            guard let raw = rawCPU(pid) else { return nil }
            let ns = inTicks ? raw.cpu * ticksPerNs : raw.cpu
            return Usage(cpu: ns / 1e6, footprint: raw.footprint)
        }
    }

    // MARK: The app's window

    /// The demo library, in memory.
    static func container() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        try? c.mainContext.save()
        return c
    }

    /// The window opens on `title` (the app restores the last note), and the setting goes back after.
    static func withLastNote<T>(_ c: ModelContainer, _ title: String, _ body: () async throws -> T) async rethrows -> T {
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        defer {
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.removeObject(forKey: "lastScope")
        let notes = (try? c.mainContext.fetch(FetchDescriptor<Note>())) ?? []
        if let n = notes.first(where: { $0.title == title }) { d.set(n.id.uuidString, forKey: "lastNote") }
        return try await body()
    }

    static func settle(_ w: NSWindow, _ turns: Int = 10) async {
        for _ in 0..<turns {
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(100))
        }
    }

    // MARK: Running a scenario

    @MainActor static var driver = ""

    /// Records when a board page says it has drawn, and when its engine holds the whole drawing,
    /// fitted, with a frame drawn after (epoch ms, in __perfT).
    static let openWatch = """
    (() => {
      let t = (window.__perfT = {});
      const at = () => performance.timeOrigin + performance.now();
      const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.amberReady;
      if (h) {
        // On the prototype: WebKit's handler objects take no property of their own.
        const proto = Object.getPrototypeOf(h), post = proto.postMessage;
        proto.postMessage = function (m) { if (this === h && m && "errors" in m && !t.ready) t.ready = at(); return post.call(this, m); };
      }
      // Where an open's time goes: the page's navigation start, this script (document start), the
      // document parsed (the canvas script has run), the board mounted, its drawing in, a frame.
      t.origin = performance.timeOrigin;
      t.boot = at();
      // The page's width at each step: a page that starts at no size lays the board out twice.
      t.bootW = innerWidth;
      const want = () => { try { return amber.data.values.scene.elements.filter((e) => !e.isDeleted).length; } catch (_) { return -1; } };
      let until = Date.now() + 20000;
      // A board's page made ahead (NotePageSandbox.standBy) is handed its board later: that's the
      // open, from the moment the page has it (origin, boot and dcl all then).
      window.__perfOpening = () => {
        t = window.__perfT = {};
        t.origin = t.boot = t.dcl = at();
        t.bootW = t.dclW = innerWidth;
        t.standby = 1;
        until = Date.now() + 20000;
        requestAnimationFrame(look);
      };
      const look = () => {
        const c = window.amber && window.amber._canvas;
        if (c && !t.mounted) { t.mounted = at(); t.mountW = innerWidth; }
        if (c && c.api) {
          const n = want();
          if (n >= 0 && c.api.getSceneElements().length >= n && (!amber._canvasView || amber._canvasView().settled)) {
            t.full = at();
            // The page's own marks (canvas.jsx, NotePageSandbox.open): the board handed over and
            // parsed, the engine's restore, its mount.
            for (const m of performance.getEntriesByType("mark")) if (m.name.startsWith("amber:")) t["m_" + m.name.slice(6)] = performance.timeOrigin + m.startTime;
            requestAnimationFrame(() => { t.shown = at(); });
            return;
          }
        }
        if (Date.now() < until) requestAnimationFrame(look);
      };
      addEventListener("DOMContentLoaded", () => { t.dcl = at(); t.dclW = innerWidth; if (window.amber) requestAnimationFrame(look); });
    })();
    """

    /// One scenario in the page, with the main thread and both processes watched while it runs.
    static func scenario(_ web: WKWebView, _ name: String, fps: Double, _ opts: [String: Any] = [:]) async throws -> [String: Any] {
        let awake = await awake(web, fps: fps)
        let watch = MainWatch()
        let webPid = pid(web)
        let app0 = Usage.of(getpid()), web0 = webPid.flatMap(Usage.of)
        let t0 = CACurrentMediaTime()
        watch.start()
        var o: [String: Any] = ["duration": seconds * 1000, "rate": 120]
        o.merge(opts) { _, b in b }
        let json = try await web.callAsyncJavaScript("return await __boardBench.run(name, opts)", arguments: ["name": name, "opts": o], contentWorld: .page) as? String ?? "{}"
        let main = watch.stop()
        let wall = (CACurrentMediaTime() - t0) * 1000
        let app1 = Usage.of(getpid()), web1 = webPid.flatMap(Usage.of)
        var out = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] ?? [:]
        out["main"] = main
        // Started while WebKit held the page back as idle (a fault of the bench, not the board): the
        // table marks it and compares nothing from it. A board that's slow on its own isn't marked.
        out["awake"] = awake
        // Average share of one core over the scenario (lead and tail included).
        if let a0 = app0, let a1 = app1 { out["appCPU"] = r(100 * (a1.cpu - a0.cpu) / wall) }
        if let w0 = web0, let w1 = web1 { out["webCPU"] = r(100 * (w1.cpu - w0.cpu) / wall); out["webMB"] = Int(w1.footprint / 1_048_576) }
        return out
    }

    /// The scenarios, on a board already fitted: the pencil, panning, pinch zoom and dragging 20 shapes.
    static func scenarios(_ web: WKWebView, fps: Double) async throws -> [String: Any] {
        var out: [String: Any] = [:]
        _ = try await web.callAsyncJavaScript("return JSON.stringify(await __boardBench.fit())", contentWorld: .page)
        for name in ["freedraw", "pan", "zoom", "drag"] {
            out[name] = try await scenario(web, name, fps: fps)
            // The view back where it was, for the next.
            _ = try await web.callAsyncJavaScript("return JSON.stringify(await __boardBench.fit())", contentWorld: .page)
        }
        return out
    }

    /// Memory of the web content process while `draw` strokes go on for `seconds` (a sample every
    /// 10 seconds), and the app's main thread over it all.
    static func soak(_ web: WKWebView, seconds: Double) async throws -> [String: Any] {
        guard seconds > 0, let p = pid(web) else { return [:] }
        var samples: [Int] = []
        let watch = MainWatch()
        watch.start()
        let start = CACurrentMediaTime()
        samples.append(Int((Usage.of(p)?.footprint ?? 0) / 1_048_576))
        var next = start + 10
        while CACurrentMediaTime() - start < seconds {
            _ = try await web.callAsyncJavaScript("return await __boardBench.run('freedraw', { duration: 2000, rate: 120, lead: 0, tail: 400 })", contentWorld: .page)
            if CACurrentMediaTime() >= next { samples.append(Int((Usage.of(p)?.footprint ?? 0) / 1_048_576)); next += 10 }
        }
        samples.append(Int((Usage.of(p)?.footprint ?? 0) / 1_048_576))
        let main = watch.stop()
        return ["seconds": Int(seconds), "webMB": samples, "main": main]
    }

    /// The web content process's memory once the page has been left alone for 10 seconds: what it
    /// keeps, not what it made and hasn't given back yet (each save makes the drawing's text anew).
    static func settledMB(_ web: WKWebView) async -> Int? {
        try? await Task.sleep(for: .seconds(10))
        guard let p = pid(web), let u = Usage.of(p) else { return nil }
        return Int(u.footprint / 1_048_576)
    }

    // MARK: The app's board

    static func scene(_ n: Int) throws -> [String: Any] {
        let url = try #require(folder).appending(path: "scene-\(n).json")
        return try #require(try JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
    }

    /// Opens `id` as from the list and waits until its board is drawn whole and fitted: ms from the
    /// click, the page's own report of it (its first frame), and the main thread's longest turn.
    /// The steps of the last open (open()), ms from the click.
    @MainActor static var lastSteps: [String: Double] = [:]

    static func open(_ id: UUID, _ w: NSWindow) async throws -> (ms: Double, web: WKWebView, main: [String: Any]) {
        lastSteps = [:]
        let watch = MainWatch()
        watch.start()
        let t0 = Date().timeIntervalSince1970 * 1000
        NoteOpener.shared.open(id)
        var found: WKWebView?
        // Long enough that a slow open under load is measured, not lost (15 s wasn't, loaded, once).
        let deadline = CACurrentMediaTime() + 30
        while found == nil, CACurrentMediaTime() < deadline {
            try await Task.sleep(for: .milliseconds(4))
            found = NotePageLive.view(id)
        }
        let web = try #require(found, "the board opened")
        var shown: Double?
        while shown == nil, CACurrentMediaTime() < deadline {
            let t = try await web.evaluateJavaScript("JSON.stringify(window.__perfT || {})") as? String ?? "{}"
            let m = try JSONSerialization.jsonObject(with: Data(t.utf8)) as? [String: Double] ?? [:]
            if let s = m["shown"] { shown = max(s, m["ready"] ?? s) } else { try await Task.sleep(for: .milliseconds(10)) }
        }
        let main = watch.stop()
        if shown != nil, let t = try? await web.evaluateJavaScript("JSON.stringify(Object.assign({ loadAt: window.__perfLoadAt || 0 }, window.__perfT || {}))") as? String,
           let m = try? JSONSerialization.jsonObject(with: Data(t.utf8)) as? [String: Double] {
            // ms from the click to each step (load: the app hands the page to WebKit).
            var steps: [String: Double] = [:]
            for k in ["loadAt", "origin", "boot", "dcl", "mounted", "full", "shown"] { if let v = m[k], v > 0 { steps[k == "loadAt" ? "load" : k] = r(v - t0) } }
            for (k, v) in m where k.hasPrefix("m_") && v > 0 { steps[k] = r(v - t0) }
            for k in ["bootW", "dclW", "mountW", "standby"] { if let v = m[k] { steps[k] = v } }
            lastSteps = steps
        }
        if shown == nil {
            let why = try? await web.evaluateJavaScript("""
            JSON.stringify({ perfT: window.__perfT || null, amber: !!window.amber, canvas: !!(window.amber && amber._canvas),
              drawn: window.amber && amber._canvas ? amber._canvas.api.getSceneElements().length : -1,
              want: (() => { try { return amber.data.values.scene.elements.length; } catch (e) { return String(e); } })(),
              view: window.amber && amber._canvasView ? amber._canvasView() : null, hidden: document.hidden, bench: !!window.__boardBench })
            """)
            Issue.record("the board never said it was drawn: \(why ?? "?")")
        }
        return (r((try #require(shown, "the board drew its drawing")) - t0), web, main)
    }

    static func pinto(_ n: Int, first: Bool) async throws -> [String: Any] {
        let scene = try scene(n)
        let c = try container()
        let a = CanvasNote.make(in: .all, context: c.mainContext, scene: scene, named: "Bench board A")
        let b = CanvasNote.make(in: .all, context: c.mainContext, scene: scene, named: "Bench board B")
        let text = c.mainContext.createNote(in: .all, body: "Bench text\n\nA note to open between the boards.")
        a.updatedAt = .now.addingTimeInterval(-60)
        b.updatedAt = .now.addingTimeInterval(-120)
        text.updatedAt = .now
        try c.mainContext.save()
        WikiDirectory.invalidate()
        defer { WikiDirectory.invalidate() }
        return try await withLastNote(c, "Bench text") {
            let w = window(windowSize, titled: true)
            w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
                .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
            w.setContentSize(windowSize)
            beat(w)
            try show(w)
            defer { w.close(); w.contentViewController = nil }
            await settle(w, 15)
            var out: [String: Any] = ["subject": "pinto", "n": n]
            // The first board opened since the app started (its spare page view made at launch).
            let cold = try await open(a.id, w)
            if first { out["openCold"] = cold.ms; out["openColdMain"] = cold.main; out["openColdSteps"] = lastSteps }
            let web = cold.web
            out["view"] = ["width": Double(web.bounds.width), "height": Double(web.bounds.height)]
            try await Task.sleep(for: .seconds(1))
            out["scenarios"] = try await scenarios(web, fps: displayFPS)
            if let p = pid(web), let u = Usage.of(p) { out["webMB"] = Int(u.footprint / 1_048_576) }
            if let mb = await settledMB(web) { out["webMBSettled"] = mb }
            if n == sizes.max(), soak > 0 { out["soak"] = try await soak(web, seconds: soak) }
            // Opened again from another note, three times; then from one board to the other.
            var warm: [Double] = [], switches: [Double] = [], switchMain: [Double] = []
            var warmSteps: [[String: Double]] = [], switchSteps: [[String: Double]] = []
            for _ in 0..<3 {
                NoteOpener.shared.open(text.id)
                await settle(w, 6)
                warm.append(try await open(a.id, w).ms)
                warmSteps.append(lastSteps)
                await settle(w, 4)
            }
            for i in 0..<4 {
                let s = try await open(i % 2 == 0 ? b.id : a.id, w)
                switches.append(s.ms)
                switchMain.append(s.main["max"] as? Double ?? 0)
                switchSteps.append(lastSteps)
                await settle(w, 4)
            }
            out["openWarm"] = warm
            out["openWarmSteps"] = warmSteps
            out["switch"] = switches
            out["switchSteps"] = switchSteps
            out["switchMainMax"] = switchMain
            return out
        }
    }

    // MARK: Plain Excalidraw

    /// WebKit's 60-frames-a-second preference off, so it draws as fast as the display (120 Hz on a
    /// ProMotion screen), as Chrome does.
    static func fastFrames(_ config: WKWebViewConfiguration) {
        guard let features = (WKPreferences.perform(NSSelectorFromString("_features"))?.takeUnretainedValue()) as? [NSObject],
              let f = features.first(where: { ($0.value(forKey: "key") as? String) == "PreferPageRenderingUpdatesNear60FPSEnabled" }) else { return }
        let sel = NSSelectorFromString("_setEnabled:forFeature:")
        guard let imp = class_getMethodImplementation(WKPreferences.self, sel) else { return }
        typealias Set = @convention(c) (AnyObject, Selector, Bool, AnyObject) -> Void
        unsafeBitCast(imp, to: Set.self)(config.preferences, sel, false, f)
    }

    static func plain(_ n: Int, size: CGSize, fast: Bool) async throws -> [String: Any] {
        let dir = try #require(folder).appending(path: "plain", directoryHint: .isDirectory)
        let sceneJSON = try String(contentsOf: try #require(folder).appending(path: "scene-\(n).json"), encoding: .utf8)
        var opens: [Double] = []
        var out: [String: Any] = ["subject": fast ? "plain120" : "plain", "n": n, "view": ["width": size.width, "height": size.height]]
        // Opened three times, a new view each (the first starts its web content process).
        for i in 0..<3 {
            let config = WKWebViewConfiguration()
            if fast { fastFrames(config) }
            wakeful(config.preferences)
            config.userContentController.addUserScript(WKUserScript(source: driver, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
            config.userContentController.addUserScript(WKUserScript(source: "window.__boardScene = \(sceneJSON);", injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
            let web = WKWebView(frame: CGRect(origin: .zero, size: size), configuration: config)
            drawOffscreen(web)
            // The same kind of window as the app's board (a borderless one was let rest more often).
            let w = window(size, titled: true)
            let holder = NSView(frame: CGRect(origin: .zero, size: size))
            web.frame = holder.bounds
            web.autoresizingMask = [.width, .height]
            holder.addSubview(web)
            w.contentView = holder
            beat(w)
            try show(w)
            defer { w.close(); w.contentView = nil }
            let t0 = Date().timeIntervalSince1970 * 1000
            web.loadFileURL(dir.appending(path: "index.html"), allowingReadAccessTo: dir)
            var shown: Double?
            let deadline = CACurrentMediaTime() + 20
            while shown == nil, CACurrentMediaTime() < deadline {
                try await Task.sleep(for: .milliseconds(10))
                shown = try? await web.evaluateJavaScript("window.__boardShownAt || null") as? Double
            }
            guard let shown else {
                let why = try? await web.evaluateJavaScript("JSON.stringify({ open: typeof window.__boardOpen, scene: !!window.__boardScene, api: !!window.__excalidrawAPI, drawn: window.__excalidrawAPI ? window.__excalidrawAPI.getSceneElements().length : -1, hidden: document.hidden, url: location.href })")
                Issue.record("plain Excalidraw never drew the drawing: \(why ?? "?")")
                return out
            }
            opens.append(r(shown - t0))
            if i == 2 {
                try await Task.sleep(for: .seconds(1))
                out["scenarios"] = try await scenarios(web, fps: fast ? displayFPS : 60)
                if let p = pid(web), let u = Usage.of(p) { out["webMB"] = Int(u.footprint / 1_048_576) }
                if let mb = await settledMB(web) { out["webMBSettled"] = mb }
            }
        }
        out["openCold"] = opens[0]
        out["openWarm"] = Array(opens.dropFirst())
        return out
    }

    // MARK: The run

    static func machine() -> [String: Any] {
        var load = [Double](repeating: 0, count: 3)
        getloadavg(&load, 3)
        var vm = vm_statistics64()
        var count = mach_msg_type_number_t(MemoryLayout<vm_statistics64>.size / MemoryLayout<integer_t>.size)
        _ = withUnsafeMutablePointer(to: &vm) { $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { host_statistics64(mach_host_self(), HOST_VM_INFO64, $0, &count) } }
        let page = UInt64(getpagesize())
        let pages = UInt64(vm.free_count) + UInt64(vm.inactive_count) + UInt64(vm.purgeable_count)
        let info = ProcessInfo.processInfo
        var m: [String: Any] = [:]
        m["cores"] = info.activeProcessorCount
        m["memoryGB"] = r(Double(info.physicalMemory) / 1e9)
        m["freeGB"] = r(Double(pages * page) / 1e9)
        m["load"] = load.map { r($0) }
        m["thermal"] = info.thermalState.rawValue
        m["lowPower"] = info.isLowPowerModeEnabled
        // Seconds since the last keystroke or pointer move anywhere (read, nothing posted): with no one
        // at the Mac for minutes, WebKit holds off-screen pages back as idle (16 November 2026).
        if let any = CGEventType(rawValue: UInt32.max) { m["userIdle"] = Int(CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: any)) }
        return m
    }

    @Test func boardPerf() async throws {
        guard let folder = Self.folder else { return }
        Self.driver = try String(contentsOf: folder.appending(path: "driver.js"), encoding: .utf8)
        // Each page as it starts loading (after the sandbox's own scripts): drawn off screen, with the
        // driver and the open watch in it.
        let script = Self.driver + Self.openWatch
        NotePageSandbox.forTests = { web in
            BoardPerfTests.drawOffscreen(web)
            // The view's own preferences (its configuration's copy shares them), before it loads.
            BoardPerfTests.wakeful(web.configuration.preferences)
            // Called as the page is handed to WebKit too (NotePageSandbox.load): that moment, for the
            // open's steps.
            let at = "window.__perfLoadAt = \(Date().timeIntervalSince1970 * 1000);"
            web.configuration.userContentController.addUserScript(WKUserScript(source: at + script, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
            // A board handed to a page made ahead loads nothing: that page is told now, before the
            // board reaches it (scripts run in the order sent).
            web.evaluateJavaScript("if (window.amber && amber._standby && !amber._opened && window.__perfOpening) { " + at + " __perfOpening(); } void 0") { _, _ in }
        }
        defer { NotePageSandbox.forTests = nil }
        // As in use: an app you draw in is frontmost and never napped. The test host is an accessory
        // app with its windows off screen, which macOS naps (timers put off, its work and its web
        // views' at a lower priority), Pinto and plain Excalidraw alike.
        let activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiated, .latencyCritical], reason: "The board benchmark")
        defer { ProcessInfo.processInfo.endActivity(activity) }
        let label = Self.label, only = Self.only
        var report: [String: Any] = ["label": label, "before": Self.machine(), "started": Date().timeIntervalSince1970]
        // As the app starts: its spare page view (PaneApp makes one at launch; the test host doesn't).
        NotePageSandbox.prewarm()
        try await Task.sleep(for: .seconds(3))
        var runs: [[String: Any]] = []
        let file = folder.appending(path: "results-\(label).json")
        // One subject and size at a time, each in an app of its own (scripts/board-perf.sh, see
        // `wakeful`): added to what the apps before it measured under this label.
        if Self.env["BOARD_PERF_APPEND"] != nil, let data = try? Data(contentsOf: file),
           let had = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            runs = had["runs"] as? [[String: Any]] ?? []
            for k in ["before", "started"] { if let v = had[k] { report[k] = v } }
        }
        // What's measured so far, kept after every run.
        func write() throws {
            report["runs"] = runs
            report["after"] = Self.machine()
            let data = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: file)
        }
        // Plain Excalidraw in a view the size of the app's board (its last run's, of any size).
        func boardSize() -> CGSize {
            guard let v = runs.last(where: { $0["subject"] as? String == "pinto" })?["view"] as? [String: Double],
                  let w = v["width"], let h = v["height"] else { return CGSize(width: 1000, height: 800) }
            return CGSize(width: w, height: h)
        }
        for (i, n) in Self.sizes.enumerated() {
            if only.contains("pinto") { runs.append(try await Self.pinto(n, first: i == 0)) }
            try write()
            if only.contains("plain") { runs.append(try await Self.plain(n, size: boardSize(), fast: false)); try write() }
            if only.contains("plain120") { runs.append(try await Self.plain(n, size: boardSize(), fast: true)); try write() }
            NSLog("BOARD_PERF %@ n=%d done", label, n)
        }
        try write()
    }
}
