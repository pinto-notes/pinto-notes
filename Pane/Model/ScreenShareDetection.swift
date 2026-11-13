import Foundation
#if os(iOS)
import UIKit
#endif

// How Pinto Notes knows your screen is shared (PrivacyMode).
//
// iPhone: the system says so (a scene's capture state, UIScreen.isCaptured): recording, mirroring
// and AirPlay alike.
//
// Mac: there's no public way to ask whether another app is capturing the screen (checked for
// macOS 26), so it looks at which processes run, every 2 seconds, off the main thread: their
// names only (libproc), which needs no permission and shows no dialog. What it looks for is in
// `ShareSignals.mac`; a meeting in a browser (Google Meet) can't be told apart from browsing, so
// View › Privacy Mode (⌃⌘P) covers it.

/// One app or system service that runs while the screen is shared.
struct ShareSignal: Sendable, Equatable {
    let name: String
    /// Process names (as libproc gives them, compared without case).
    let processes: Set<String>
    /// How long it has to run before it counts, for a process that also runs briefly for
    /// something else (the screenshot tool, for a screenshot).
    var after: TimeInterval = 0
    /// Whether it was seen doing this, or only read about.
    let checked: String
}

enum ShareSignals {
    static let mac: [ShareSignal] = [
        // zoom.us.app/Contents/Frameworks/CptHost.app, Zoom's sharing host: Zoom's community
        // threads on sharing errors name it. Not seen here (no Zoom on the build Mac).
        ShareSignal(name: "Zoom", processes: ["cpthost"], checked: "documented by Zoom's community, not seen running"),
        // Someone viewing this Mac with Screen Sharing (or a VNC app): the system's server, which
        // launchd starts only for a session.
        ShareSignal(name: "Screen Sharing", processes: ["screensharingd"], checked: "macOS 26 system daemon, on demand only"),
        // ⇧⌘5 and QuickTime's New Screen Recording show the system's capture tool, which stays up
        // while it records. It also runs for a screenshot and its thumbnail (about 5 s), so it
        // counts after 8 s. `screencapture -v` records from Terminal.
        ShareSignal(name: "Screen recording", processes: ["screencaptureui", "screencapture"], after: 8,
                    checked: "/System/Library/CoreServices/screencaptureui.app, not running when idle (seen here)"),
    ]
}

/// Decides from the running processes, poll by poll. Pure, for the tests.
struct ShareHeuristic: Sendable {
    let signals: [ShareSignal]
    /// When each signal's process was first seen in the run it's in now.
    private var since: [String: Date] = [:]

    init(signals: [ShareSignal] = ShareSignals.mac) { self.signals = signals }

    /// The signals that count now.
    mutating func active(running: Set<String>, now: Date) -> [String] {
        var on: [String] = []
        for s in signals {
            if !s.processes.isDisjoint(with: running) {
                let first = since[s.name] ?? now
                since[s.name] = first
                if now.timeIntervalSince(first) >= s.after { on.append(s.name) }
            } else {
                since[s.name] = nil
            }
        }
        return on
    }
}

/// The names of the processes running now, lowercased.
protocol ProcessLister: Sendable {
    func names() -> Set<String>
}

#if os(macOS)
import Darwin

/// libproc: every process's short name, no permission needed. About a millisecond for 700
/// processes (ShareDetectionTests measures it).
struct LibProcLister: ProcessLister {
    func names() -> Set<String> {
        let count = proc_listallpids(nil, 0)
        guard count > 0 else { return [] }
        var pids = [pid_t](repeating: 0, count: Int(count) + 32)
        let got = pids.withUnsafeMutableBytes { proc_listallpids($0.baseAddress, Int32($0.count)) }
        guard got > 0 else { return [] }
        var out = Set<String>()
        out.reserveCapacity(Int(got))
        var buffer = [CChar](repeating: 0, count: 64)
        for pid in pids.prefix(Int(got)) where pid > 0 {
            let n = proc_name(pid, &buffer, UInt32(buffer.count))
            if n > 0 { out.insert(String(cString: buffer).lowercased()) }
        }
        return out
    }
}

/// The Mac's detector: looks every 2 seconds (a timer with a second of leeway, so the system
/// can fold its wake-ups into others), on a utility queue, and tells the main thread only when
/// the answer changes.
final class ProcessShareDetector: ScreenShareDetector {
    static let interval: TimeInterval = 2
    private let poller: SharePoller

    init(lister: ProcessLister = LibProcLister(), signals: [ShareSignal] = ShareSignals.mac) {
        poller = SharePoller(lister: lister, signals: signals)
    }

    func start(_ changed: @escaping @MainActor (Bool) -> Void) {
        poller.start(every: Self.interval) { on in DispatchQueue.main.async { MainActor.assumeIsolated { changed(on) } } }
    }

    func stop() { poller.stop() }
}

/// The looking itself, off the main actor: everything it keeps is read and written on `queue`.
/// (Made inside the detector, the timer's closure was the main actor's, and stopped the app when
/// it ran on the queue: seen in the tests.)
final class SharePoller: @unchecked Sendable {
    private let lister: ProcessLister
    private let queue = DispatchQueue(label: "pinto.share-detector", qos: .utility)
    private var timer: DispatchSourceTimer?
    private var heuristic: ShareHeuristic
    private var last = false

    init(lister: ProcessLister, signals: [ShareSignal]) {
        self.lister = lister
        heuristic = ShareHeuristic(signals: signals)
    }

    func start(every interval: TimeInterval, _ changed: @escaping @Sendable (Bool) -> Void) {
        stop()
        let t = DispatchSource.makeTimerSource(queue: queue)
        t.schedule(deadline: .now(), repeating: interval, leeway: .seconds(1))
        t.setEventHandler { [weak self] in
            guard let self else { return }
            let on = !self.heuristic.active(running: self.lister.names(), now: Date()).isEmpty
            guard on != self.last else { return }
            self.last = on
            changed(on)
        }
        timer = t
        t.resume()
    }

    func stop() {
        timer?.cancel()
        timer = nil
        queue.async { [self] in last = false; heuristic = ShareHeuristic(signals: heuristic.signals) }
    }
}
#endif

#if os(iOS)
/// The iPhone's detector: a window scene's capture state (recording, mirroring, AirPlay) or the
/// screen's, read again whenever the system says it changed.
@MainActor
final class SceneCaptureDetector: ScreenShareDetector {
    /// Whether anything captures the app's screen now; tests pass their own.
    private let read: @MainActor () -> Bool
    private var observers: [NSObjectProtocol] = []
    private var registrations: [(UIWindowScene, any UITraitChangeRegistration)] = []
    private var changed: (@MainActor (Bool) -> Void)?
    private var last = false

    init(read: @escaping @MainActor () -> Bool = SceneCaptureDetector.systemSays) { self.read = read }

    static func systemSays() -> Bool {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.contains { $0.traitCollection.sceneCaptureState == .active || $0.screen.isCaptured }
    }

    func start(_ changed: @escaping @MainActor (Bool) -> Void) {
        stop()
        self.changed = changed
        let center = NotificationCenter.default
        for name in [UIScreen.capturedDidChangeNotification, UIScene.didActivateNotification, UIScene.willConnectNotification, UIApplication.didBecomeActiveNotification] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.check() }
            })
        }
        watchScenes()
        last = false
        check()
    }

    /// A scene's capture state is a trait: its change comes as a trait change.
    private func watchScenes() {
        for scene in UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }) {
            let r = scene.registerForTraitChanges([UITraitSceneCaptureState.self]) { [weak self] (_: UIWindowScene, _: UITraitCollection) in
                self?.check()
            }
            registrations.append((scene, r))
        }
    }

    func check() {
        let on = read()
        guard on != last else { return }
        last = on
        changed?(on)
    }

    func stop() {
        observers.forEach(NotificationCenter.default.removeObserver)
        observers = []
        for (scene, r) in registrations { scene.unregisterForTraitChanges(r) }
        registrations = []
        changed = nil
    }
}
#endif

extension PrivacyMode {
    /// Watches this device's screen, once, in the app (never in a test host).
    func watchThisDevice() {
        guard !PaneApp.isUnitTestHost, !Self.watching else { return }
        Self.watching = true
        #if os(macOS)
        watch(ProcessShareDetector())
        #else
        watch(SceneCaptureDetector())
        #endif
    }

    @MainActor private static var watching = false
}
