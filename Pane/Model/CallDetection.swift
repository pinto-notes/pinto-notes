import Foundation

// How the Mac knows you're in a call (PrivacyMode), beside the screen sharing it already watches
// (ScreenShareDetection). Emil, 13 November 2026: Teams, Google Meet in any browser, FaceTime,
// Slack huddles and the like should bring up the cover too.
//
// A call is an app using the microphone: CoreAudio lists every process that talks to it, with
// whether it's capturing input now and its bundle id (kAudioHardwarePropertyProcessObjectList,
// kAudioProcessPropertyIsRunningInput, macOS 14.2 and later). Reading that needs no permission and
// shows no dialog: coreaudiod checks the reader's Microphone access only as a preflight, which
// never asks (seen in tccd's log, 13 November 2026). Pinto listens for changes rather than polling
// (CoreAudioMicSource says which).
//
// Only meeting apps and browsers count (`CallApps`), so dictation, Siri, Voice Memos, a dictation
// app or Pinto itself never do. A browser captures from a helper process (Chrome's
// com.google.Chrome.helper, Safari's com.apple.WebKit.GPU): a helper's bundle id starts with its
// app's, and WebKit's processes count as Safari. The microphone has to be in use for 3 seconds
// to start a call, and released for 10 to end it, so a short voice message or a muted moment
// doesn't flicker the cover.

/// A process capturing the microphone now.
struct MicUser: Sendable, Hashable {
    let pid: Int32
    let bundleID: String
}

/// The apps whose microphone use means a call.
enum CallApps {
    /// Meeting and call apps, by bundle id (a helper's id starts with its app's).
    static let meetings: [(id: String, name: String)] = [
        ("com.microsoft.teams2", "Microsoft Teams"), ("com.microsoft.teams", "Microsoft Teams"),
        ("us.zoom.xos", "Zoom"),
        ("com.tinyspeck.slackmacgap", "Slack"),
        // FaceTime's calls run their audio in the system's conference daemon, not the app.
        ("com.apple.FaceTime", "FaceTime"), ("com.apple.avconferenced", "FaceTime"),
        ("com.cisco.webexmeetingsapp", "Webex"), ("com.webex.meetingmanager", "Webex"), ("Cisco-Systems.Spark", "Webex"),
        ("com.hnc.Discord", "Discord"),
        ("com.skype.skype", "Skype"),
        ("co.teamport.around", "Around"),
        ("app.tuple.app", "Tuple"),
        ("net.whatsapp.WhatsApp", "WhatsApp"), ("desktop.WhatsApp", "WhatsApp"),
        ("ru.keepcoder.Telegram", "Telegram"),
        ("com.gather.Gather", "Gather"),
        ("com.pop.pop.app", "Pop"),
    ]

    /// Browsers, for a meeting in a web page (Google Meet, Teams on the web, Whereby).
    static let browsers: [(id: String, name: String)] = [
        ("com.google.Chrome", "Chrome"), ("com.apple.Safari", "Safari"),
        // Safari (and any app showing the web) captures in WebKit's GPU or web content process.
        ("com.apple.WebKit", "Safari"),
        ("company.thebrowser.Browser", "Arc"), ("company.thebrowser.dia", "Dia"),
        ("com.microsoft.edgemac", "Edge"), ("org.mozilla.firefox", "Firefox"), ("org.mozilla.plugincontainer", "Firefox"),
        ("com.brave.Browser", "Brave"), ("com.operasoftware.Opera", "Opera"), ("com.vivaldi.Vivaldi", "Vivaldi"),
        ("org.chromium.Chromium", "Chromium"), ("app.zen-browser.zen", "Zen"),
    ]

    /// The app a capturing process belongs to, if its microphone use means a call; nil for
    /// anything else (dictation, Siri, Voice Memos, Pinto itself, an app not on the lists).
    static func app(for bundleID: String, own: String? = Bundle.main.bundleIdentifier) -> String? {
        guard !bundleID.isEmpty else { return nil }
        if let own, bundleID == own || bundleID.hasPrefix(own + ".") { return nil }
        for (id, name) in meetings + browsers where bundleID == id || bundleID.hasPrefix(id + ".") { return name }
        return nil
    }
}

/// Decides from who's capturing the microphone, as it changes. Pure, for the tests.
struct CallHeuristic: Sendable {
    /// In use this long before it's a call.
    static let start: TimeInterval = 3
    /// Released this long before the call is over.
    static let end: TimeInterval = 10

    private(set) var inCall = false
    /// Since when a call app has held the microphone, in this run.
    private var heldSince: Date?
    /// Since when no call app has, during a call.
    private var releasedSince: Date?
    private let own: String?

    init(own: String? = Bundle.main.bundleIdentifier) { self.own = own }

    /// The apps capturing for a call among `users`.
    func callers(_ users: Set<MicUser>) -> Set<String> {
        Set(users.compactMap { CallApps.app(for: $0.bundleID, own: own) })
    }

    /// Takes in who captures now; returns whether it's a call, and when to look again (when a
    /// wait could end without anything changing).
    mutating func update(_ users: Set<MicUser>, now: Date) -> (inCall: Bool, recheck: Date?) {
        let held = !callers(users).isEmpty
        if held {
            releasedSince = nil
            let since = heldSince ?? now
            heldSince = since
            if !inCall, now.timeIntervalSince(since) >= Self.start { inCall = true }
        } else {
            heldSince = nil
            if inCall {
                let since = releasedSince ?? now
                releasedSince = since
                if now.timeIntervalSince(since) >= Self.end { inCall = false; releasedSince = nil }
            }
        }
        let recheck: Date? = if !inCall, let heldSince { heldSince.addingTimeInterval(Self.start) }
            else if inCall, let releasedSince { releasedSince.addingTimeInterval(Self.end) }
            else { nil }
        return (inCall, recheck)
    }
}

/// Who captures the microphone, told each time it may have changed. The Mac's is CoreAudio
/// (CoreAudioMicSource); the tests pass a fake.
protocol MicSource: AnyObject, Sendable {
    /// Starts listening; `changed` gets the capturing processes, on any thread, at the start and
    /// after each change.
    func start(_ changed: @escaping @Sendable (Set<MicUser>) -> Void)
    func stop()
}

/// Says whether you're in a call: a ScreenShareDetector, so PrivacyMode watches it the same way.
final class CallDetector: ScreenShareDetector {
    private let source: MicSource
    private var heuristic: CallHeuristic
    private var users: Set<MicUser> = []
    private var changed: (@MainActor (Bool) -> Void)?
    private var last = false
    private var recheck: Task<Void, Never>?
    private let own: String?
    /// The clock, for the tests.
    private let now: @MainActor () -> Date

    init(source: MicSource, own: String? = Bundle.main.bundleIdentifier, now: @escaping @MainActor () -> Date = { Date() }) {
        self.source = source
        self.own = own
        heuristic = CallHeuristic(own: own)
        self.now = now
    }

    func start(_ changed: @escaping @MainActor (Bool) -> Void) {
        stop()
        self.changed = changed
        source.start { [weak self] users in
            DispatchQueue.main.async { MainActor.assumeIsolated { self?.heard(users) } }
        }
    }

    func stop() {
        source.stop()
        recheck?.cancel()
        recheck = nil
        changed = nil
        last = false
        heuristic = CallHeuristic(own: own)
        users = []
    }

    /// Who captures now (from the source).
    func heard(_ users: Set<MicUser>) {
        self.users = users
        evaluate()
    }

    /// Looks again (a wait ended, or the tests' clock moved).
    func evaluate() {
        let (on, at) = heuristic.update(users, now: now())
        recheck?.cancel()
        recheck = nil
        if let at {
            let wait = max(0.05, at.timeIntervalSince(now()))
            recheck = Task { [weak self] in
                try? await Task.sleep(for: .seconds(wait))
                guard !Task.isCancelled else { return }
                self?.evaluate()
            }
        }
        guard on != last else { return }
        last = on
        changed?(on)
    }
}

#if os(macOS)
import CoreAudio

/// CoreAudio's own list of the processes using audio. It says nothing when a process starts or
/// stops capturing (no notice for kAudioProcessPropertyIsRunningInput: seen on macOS 27, 13
/// November 2026), so it listens for what does change then (the process list, and whether each
/// input device runs for anyone) and reads the list again; while a microphone is in use it also
/// reads it every 5 seconds, for a second app starting while the device already runs. Nothing
/// runs while no microphone is in use. Everything it keeps is on `queue`.
final class CoreAudioMicSource: MicSource, @unchecked Sendable {
    /// How often it reads again while a microphone is in use.
    static let whileInUse: TimeInterval = 5

    private let queue = DispatchQueue(label: "pinto.call-detector", qos: .utility)
    private var changed: (@Sendable (Set<MicUser>) -> Void)?
    private var systemListeners: [(AudioObjectPropertyAddress, AudioObjectPropertyListenerBlock)] = []
    private var deviceListeners: [AudioObjectID: AudioObjectPropertyListenerBlock] = [:]
    private var timer: DispatchSourceTimer?
    private var last: Set<MicUser>?

    private static let system = AudioObjectID(kAudioObjectSystemObject)
    private static func global(_ selector: AudioObjectPropertySelector) -> AudioObjectPropertyAddress {
        AudioObjectPropertyAddress(mSelector: selector, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    }

    func start(_ changed: @escaping @Sendable (Set<MicUser>) -> Void) {
        queue.async { [self] in
            stopListening()
            self.changed = changed
            last = nil
            for selector in [kAudioHardwarePropertyProcessObjectList, kAudioHardwarePropertyDevices] {
                var address = Self.global(selector)
                let block: AudioObjectPropertyListenerBlock = { [weak self] _, _ in self?.refresh() }
                if AudioObjectAddPropertyListenerBlock(Self.system, &address, queue, block) == noErr { systemListeners.append((address, block)) }
            }
            refresh()
        }
    }

    func stop() {
        queue.async { [self] in stopListening(); changed = nil; last = nil }
    }

    /// Listens to any new input device, reads who captures now, and says so if it changed. On `queue`.
    private func refresh() {
        let devices = Set(Self.inputDevices())
        for device in devices where deviceListeners[device] == nil {
            var address = Self.global(kAudioDevicePropertyDeviceIsRunningSomewhere)
            let block: AudioObjectPropertyListenerBlock = { [weak self] _, _ in self?.refresh() }
            if AudioObjectAddPropertyListenerBlock(device, &address, queue, block) == noErr { deviceListeners[device] = block }
        }
        for (device, block) in deviceListeners where !devices.contains(device) {
            var address = Self.global(kAudioDevicePropertyDeviceIsRunningSomewhere)
            AudioObjectRemovePropertyListenerBlock(device, &address, queue, block)
            deviceListeners[device] = nil
        }
        let inUse = devices.contains { Self.u32($0, kAudioDevicePropertyDeviceIsRunningSomewhere) != 0 }
        let users = inUse ? Self.users(Self.processObjects()) : []
        if inUse, timer == nil {
            let t = DispatchSource.makeTimerSource(queue: queue)
            t.schedule(deadline: .now() + Self.whileInUse, repeating: Self.whileInUse, leeway: .seconds(1))
            t.setEventHandler { [weak self] in self?.refresh() }
            timer = t
            t.resume()
        } else if !inUse, let t = timer {
            t.cancel()
            timer = nil
        }
        guard users != last else { return }
        last = users
        changed?(users)
    }

    private func stopListening() {
        for (address, block) in systemListeners {
            var address = address
            AudioObjectRemovePropertyListenerBlock(Self.system, &address, queue, block)
        }
        systemListeners = []
        for (device, block) in deviceListeners {
            var address = Self.global(kAudioDevicePropertyDeviceIsRunningSomewhere)
            AudioObjectRemovePropertyListenerBlock(device, &address, queue, block)
        }
        deviceListeners = [:]
        timer?.cancel()
        timer = nil
    }

    private static func objects(_ selector: AudioObjectPropertySelector) -> [AudioObjectID] {
        var address = global(selector)
        var size: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(system, &address, 0, nil, &size) == noErr, size > 0 else { return [] }
        var ids = [AudioObjectID](repeating: 0, count: Int(size) / MemoryLayout<AudioObjectID>.size)
        guard AudioObjectGetPropertyData(system, &address, 0, nil, &size, &ids) == noErr else { return [] }
        return ids
    }

    static func processObjects() -> [AudioObjectID] { objects(kAudioHardwarePropertyProcessObjectList) }

    /// The devices with an input side (built-in microphone, a headset, AirPods).
    static func inputDevices() -> [AudioObjectID] {
        objects(kAudioHardwarePropertyDevices).filter { device in
            var address = AudioObjectPropertyAddress(mSelector: kAudioDevicePropertyStreams, mScope: kAudioObjectPropertyScopeInput, mElement: kAudioObjectPropertyElementMain)
            var size: UInt32 = 0
            return AudioObjectGetPropertyDataSize(device, &address, 0, nil, &size) == noErr && size > 0
        }
    }

    private static func u32(_ object: AudioObjectID, _ selector: AudioObjectPropertySelector) -> UInt32 {
        var address = global(selector)
        var value: UInt32 = 0
        var size = UInt32(MemoryLayout<UInt32>.size)
        return AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value) == noErr ? value : 0
    }

    /// The processes among `objects` capturing input now, with their bundle ids.
    static func users(_ objects: [AudioObjectID]) -> Set<MicUser> {
        var out = Set<MicUser>()
        for object in objects where u32(object, kAudioProcessPropertyIsRunningInput) != 0 {
            out.insert(MicUser(pid: pid(object), bundleID: bundleID(object)))
        }
        return out
    }

    private static func pid(_ object: AudioObjectID) -> Int32 {
        var address = global(kAudioProcessPropertyPID)
        var pid: pid_t = 0
        var size = UInt32(MemoryLayout<pid_t>.size)
        return AudioObjectGetPropertyData(object, &address, 0, nil, &size, &pid) == noErr ? pid : 0
    }

    private static func bundleID(_ object: AudioObjectID) -> String {
        var address = global(kAudioProcessPropertyBundleID)
        var value: Unmanaged<CFString>?
        var size = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        guard AudioObjectGetPropertyData(object, &address, 0, nil, &size, &value) == noErr, let value else { return "" }
        return value.takeRetainedValue() as String
    }
}
#endif
