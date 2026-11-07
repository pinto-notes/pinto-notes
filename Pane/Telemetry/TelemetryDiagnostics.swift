import Foundation
import MetricKit
#if os(iOS)
import UIKit
#else
import AppKit
#endif

// Crashes and hangs, from Apple's MetricKit: the system writes a diagnostic when the app crashes
// or stops answering, and hands it over at the next launch. No crash SDK is linked. What's sent is
// a summary in numbers: the exception and signal, the version that crashed, and where in the
// app's own binary it was (offsets, to look up against that build's symbols). The system's
// reports also hold a termination reason in words and the names of other binaries; those stay here.

/// A crash or hang report's stack, cut down to the app's own frames.
enum StackReader {
    static let kept = 8

    /// `json`: a diagnostic's `callStackTree.jsonRepresentation()`. `binary`: the app's executable
    /// name (frames of anything else are skipped). The stack of the thread the report is about,
    /// or the first one.
    static func summary(_ json: Data, binary: String) -> StackSummary {
        guard let top = try? JSONSerialization.jsonObject(with: json) as? [String: Any] else { return StackSummary() }
        // The tree itself, or wrapped as it is inside a whole payload.
        let tree = top["callStackTree"] as? [String: Any] ?? top
        guard let stacks = tree["callStacks"] as? [[String: Any]], !stacks.isEmpty else { return StackSummary() }
        let stack = stacks.first { $0["threadAttributed"] as? Bool == true } ?? stacks[0]
        var frames: [[String: Any]] = []
        var next = (stack["callStackRootFrames"] as? [[String: Any]])?.first
        // Each frame holds the one it called (or was called by) as its first sub-frame.
        while let frame = next, frames.count < 512 {
            frames.append(frame)
            next = (frame["subFrames"] as? [[String: Any]])?.first
        }
        let own = frames.filter { $0["binaryName"] as? String == binary }
        let offsets = own.compactMap { ($0["offsetIntoBinaryTextSegment"] as? NSNumber)?.intValue }
        let id = own.compactMap { $0["binaryUUID"] as? String }.first.flatMap(UUID.init(uuidString:))
        // Both ends of a deep stack: where it started and where it was.
        let shown = offsets.count <= kept ? offsets : Array(offsets.prefix(kept / 2) + offsets.suffix(kept / 2))
        return StackSummary(binary: id, offsets: shown, frames: offsets.count)
    }
}

/// Receives MetricKit's diagnostics and turns each into events.
final class DiagnosticReports: NSObject, MXMetricManagerSubscriber, @unchecked Sendable {
    static let shared = DiagnosticReports()
    /// At most this many crashes and hangs from one delivery: a crash loop says the same thing.
    static let most = 5

    private let telemetry: Telemetry
    private let binary: String

    init(telemetry: Telemetry = .shared, binary: String = Bundle.main.executableURL?.lastPathComponent ?? "") {
        self.telemetry = telemetry
        self.binary = binary
    }

    func start() {
        MXMetricManager.shared.add(self)
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            for c in (payload.crashDiagnostics ?? []).prefix(Self.most) {
                telemetry.record(.crash(exceptionType: c.exceptionType?.intValue, exceptionCode: c.exceptionCode?.intValue,
                                        signal: c.signal?.intValue, version: VersionNumber(c.applicationVersion),
                                        build: VersionNumber(c.metaData.applicationBuildVersion),
                                        stack: StackReader.summary(c.callStackTree.jsonRepresentation(), binary: binary)))
            }
            let hangs = payload.hangDiagnostics ?? []
            for h in hangs.prefix(Self.most) {
                telemetry.record(.hang(milliseconds: Int(h.hangDuration.converted(to: .milliseconds).value),
                                       version: VersionNumber(h.applicationVersion), build: VersionNumber(h.metaData.applicationBuildVersion),
                                       stack: StackReader.summary(h.callStackTree.jsonRepresentation(), binary: binary)))
            }
            if !hangs.isEmpty { telemetry.record(.hangs(count: hangs.count)) }
        }
    }
}

/// Sends what's waiting when the app leaves the front, and counts "app opened" when it comes back.
@MainActor
enum TelemetryLifecycle {
    private static var observers: [NSObjectProtocol] = []

    static func start(signedIn: @escaping @MainActor @Sendable () -> Bool) {
        guard observers.isEmpty, Telemetry.shared.sends else { return }
        let center = NotificationCenter.default
        #if os(iOS)
        let active = UIApplication.didBecomeActiveNotification
        let leaving = [(UIApplication.didEnterBackgroundNotification, false)]
        #else
        let active = NSApplication.didBecomeActiveNotification
        let leaving = [(NSApplication.didResignActiveNotification, false), (NSApplication.willTerminateNotification, true)]
        #endif
        SettingsUsage.shared.start()
        observers.append(center.addObserver(forName: active, object: nil, queue: .main) { _ in
            MainActor.assumeIsolated {
                Telemetry.shared.becameActive(signedIn: signedIn())
                SettingsUsage.shared.becameActive()
            }
        })
        for (name, quitting) in leaving {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { _ in
                MainActor.assumeIsolated { leave(quitting: quitting) }
            })
        }
    }

    private static func leave(quitting: Bool) {
        #if os(iOS)
        // A little time from the system to finish the send after the app has left the screen.
        let time = BackgroundTime()
        time.begin()
        Task {
            await Telemetry.shared.resigning(quitting: quitting)
            time.end()
        }
        #else
        Task { await Telemetry.shared.resigning(quitting: quitting) }
        #endif
    }
}

/// Which settings people use (docs/Technical/app-telemetry.md): every setting's value as a
/// starting point (once per install, again after an update and when Share diagnostics is turned
/// back on), a change when the person makes one, and the Settings pages they open. Nothing is
/// recorded with Share diagnostics off (Telemetry.record).
@MainActor
final class SettingsUsage {
    static let shared = SettingsUsage()

    var defaults: UserDefaults = .standard
    var loginOn: () -> Bool = {
        #if os(macOS)
        LoginItem.isOn
        #else
        false
        #endif
    }
    var record: (TelemetryEvent) -> Void = { Telemetry.shared.record($0) }
    var isOn: () -> Bool = { Telemetry.shared.isOn }
    /// This build's version: a new one says the settings again.
    var version: () -> String = { Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "" }
    private var last: [SettingName: TelemetryValue]?
    /// Share diagnostics as last seen, so turning it back on says the settings at once.
    private var wasOn = false
    /// Open at login as last read: the system is asked at start, with each `settings_state` and
    /// when its switch is flipped, not on every write to the defaults.
    private var login = false
    private var watch: NSObjectProtocol?

    /// Every setting's value as `defaults` holds it, each as it reads when never changed.
    static func values(_ d: UserDefaults, loginOn: Bool) -> [SettingName: TelemetryValue] {
        let folder = d.string(forKey: TodaysNoteSettings.folderKey)?.trimmingCharacters(in: .whitespaces) ?? ""
        var v: [SettingName: TelemetryValue] = [
            .appearance: .word(d.string(forKey: AppearanceModeStore.key).flatMap(AppearanceMode.init) ?? .system),
            .theme: .word(d.string(forKey: ThemeStore.themeKey).flatMap(Theme.init) ?? .standard),
            .accent: .word(d.string(forKey: ThemeStore.accentKey).flatMap(AccentChoice.init) ?? .theme),
            .todayFolder: .word(folder.isEmpty || DailyNotes.same(folder, DailyNotes.folderName) ? TodayFolderWord.default : .custom),
            .todayTitle: .word(d.string(forKey: TodaysNoteSettings.titleKey).flatMap(TodaysNoteSettings.Title.init) ?? .long),
            .todayTemplate: .flag(d.string(forKey: TodaysNoteSettings.templateKey).flatMap(UUID.init) != nil),
            .todayOnLaunch: .flag(d.bool(forKey: TodaysNoteSettings.launchKey)),
            .tickedToBottom: .flag(d.object(forKey: ChecklistSorting.key) as? Bool ?? true),
        ]
        #if os(macOS)
        // iPhone follows the system's text size; the Mac has its own.
        v[.textSize] = .number(Int(TextSize.size(stored: d.double(forKey: TextSize.key))))
        v[.menuBar] = .flag(d.object(forKey: MenuBarSettings.key) as? Bool ?? true)
        v[.quickNoteShortcut] = .flag(d.data(forKey: QuickNoteHotKey.key) != nil)
        v[.openAtLogin] = .flag(loginOn)
        #endif
        return v
    }

    /// Notes where things stand, and watches for changes from now on.
    func start() {
        login = loginOn()
        last = Self.values(defaults, loginOn: login)
        wasOn = Telemetry.consents(defaults)
        guard watch == nil else { return }
        watch = NotificationCenter.default.addObserver(forName: UserDefaults.didChangeNotification, object: defaults, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.check() }
        }
    }

    /// The app came to the front: every setting's value, unless this version has said them.
    func becameActive() {
        guard isOn(), defaults.string(forKey: Telemetry.settingsSnapshotKey) != version() else { return }
        snapshot()
    }

    private func snapshot() {
        defaults.set(version(), forKey: Telemetry.settingsSnapshotKey)
        login = loginOn()
        record(.settingsState(Self.values(defaults, loginOn: login)))
    }

    /// A setting that changed since the last look: one `setting_changed` for each. `asksSystem`:
    /// read Open at login again (its switch was flipped). Share diagnostics turned back on says
    /// every setting again. Runs for every write to the defaults, some made under Telemetry's
    /// lock, so the switch is read from the defaults, not asked of Telemetry.
    func check(asksSystem: Bool = false) {
        let on = Telemetry.consents(defaults)
        let turnedOn = on && !wasOn
        wasOn = on
        if turnedOn, isOn() { snapshot() }
        if asksSystem { login = loginOn() }
        let now = Self.values(defaults, loginOn: login)
        defer { last = now }
        guard let last else { return }
        for name in SettingName.allCases {
            if let value = now[name], value != last[name] { record(.settingChanged(name, value)) }
        }
    }

    func opened(_ page: SettingsPageWord) { record(.settingsPageOpened(page)) }
}

#if os(iOS)
@MainActor
private final class BackgroundTime {
    private var id = UIBackgroundTaskIdentifier.invalid

    func begin() {
        id = UIApplication.shared.beginBackgroundTask { [weak self] in
            Task { @MainActor in self?.end() }
        }
    }

    func end() {
        guard id != .invalid else { return }
        UIApplication.shared.endBackgroundTask(id)
        id = .invalid
    }
}
#endif
