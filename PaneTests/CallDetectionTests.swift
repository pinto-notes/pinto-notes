import Foundation
import Testing
@testable import Pane

/// A microphone the test drives: says who captures when told.
final class FakeMic: MicSource, @unchecked Sendable {
    private let lock = NSLock()
    private var changed: (@Sendable (Set<MicUser>) -> Void)?
    var started: Bool { lock.withLock { changed != nil } }
    func start(_ changed: @escaping @Sendable (Set<MicUser>) -> Void) { lock.withLock { self.changed = changed } }
    func stop() { lock.withLock { changed = nil } }
    func say(_ users: Set<MicUser>) { lock.withLock { changed }?(users) }
}

/// A clock the test moves.
@MainActor final class FakeClock {
    var now = Date(timeIntervalSinceReferenceDate: 800_000_000)
    func advance(_ s: TimeInterval) { now = now.addingTimeInterval(s) }
}

/// Calls on the Mac (Emil, 13 November 2026): a meeting app or a browser holding the microphone
/// for 3 seconds is a call; released for 10, it's over. CallDetection.swift.
@MainActor @Suite struct CallDetectionTests {
    static let own = "dev.example.pinto"

    static func user(_ id: String, _ pid: Int32 = 100) -> MicUser { MicUser(pid: pid, bundleID: id) }

    /// A detector on a fake microphone and clock, with what it said.
    static func detector() -> (CallDetector, FakeMic, FakeClock, Heard<Bool>) {
        let mic = FakeMic(), clock = FakeClock(), said = Heard<Bool>()
        let d = CallDetector(source: mic, own: own, now: { clock.now })
        d.start { said.add($0) }
        return (d, mic, clock, said)
    }

    // MARK: Which apps count

    @Test func meetingAppsAndBrowserHelpersCountAsTheirApp() {
        #expect(CallApps.app(for: "com.microsoft.teams2", own: Self.own) == "Microsoft Teams")
        #expect(CallApps.app(for: "us.zoom.xos", own: Self.own) == "Zoom")
        #expect(CallApps.app(for: "com.tinyspeck.slackmacgap.helper", own: Self.own) == "Slack", "Slack's huddles run in its helper")
        #expect(CallApps.app(for: "com.apple.avconferenced", own: Self.own) == "FaceTime")
        // Google Meet in a browser: the capture runs in the browser's helper.
        #expect(CallApps.app(for: "com.google.Chrome.helper", own: Self.own) == "Chrome")
        #expect(CallApps.app(for: "com.google.Chrome.helper.Renderer", own: Self.own) == "Chrome")
        #expect(CallApps.app(for: "com.brave.Browser.helper", own: Self.own) == "Brave")
        #expect(CallApps.app(for: "com.apple.WebKit.GPU", own: Self.own) == "Safari")
        #expect(CallApps.app(for: "org.mozilla.plugincontainer", own: Self.own) == "Firefox")
        #expect(CallApps.app(for: "company.thebrowser.Browser.helper", own: Self.own) == "Arc")
    }

    @Test func dictationSiriVoiceMemosAndPintoNeverCount() {
        for id in ["com.apple.SpeechRecognitionCore.speechrecognitiond", "com.apple.assistantd", "com.apple.Siri",
                   "com.apple.VoiceMemos", "com.apple.corespeechd", "com.apple.dictation", "",
                   Self.own, Self.own + ".helper", "com.example.someapp"] {
            #expect(CallApps.app(for: id, own: Self.own) == nil, "\(id) isn't a call")
        }
        // A prefix only counts at a dot: com.google.ChromeCast isn't Chrome.
        #expect(CallApps.app(for: "com.google.ChromeCast", own: Self.own) == nil)
    }

    // MARK: Timing

    @Test func aCallStartsAfterThreeSecondsAndEndsTenAfterRelease() {
        let (d, _, clock, said) = Self.detector()
        defer { d.stop() }
        d.heard([Self.user("com.google.Chrome.helper")])
        clock.advance(2.9); d.evaluate()
        #expect(said.all.isEmpty, "not yet: a short voice message isn't a call")
        clock.advance(0.2); d.evaluate()
        #expect(said.all == [true])
        d.heard([])
        clock.advance(9.5); d.evaluate()
        #expect(said.all == [true], "a muted moment doesn't end it")
        clock.advance(0.6); d.evaluate()
        #expect(said.all == [true, false])
    }

    @Test func briefUseNeverStartsACallAndAReturnKeepsItGoing() {
        let (d, _, clock, said) = Self.detector()
        defer { d.stop() }
        d.heard([Self.user("us.zoom.xos")])
        clock.advance(1); d.heard([])
        clock.advance(5); d.evaluate()
        #expect(said.all.isEmpty, "1 second of microphone isn't a call")
        d.heard([Self.user("us.zoom.xos")])
        clock.advance(3); d.evaluate()
        #expect(said.all == [true])
        d.heard([]); clock.advance(8)
        d.heard([Self.user("us.zoom.xos")]); clock.advance(8); d.evaluate()
        #expect(said.all == [true], "picked up again within 10 seconds: the same call")
    }

    @Test func onlyExcludedUsersIsNoCall() {
        let (d, _, clock, said) = Self.detector()
        defer { d.stop() }
        d.heard([Self.user("com.apple.VoiceMemos"), Self.user(Self.own, 2), Self.user("com.apple.assistantd", 3)])
        clock.advance(60); d.evaluate()
        #expect(said.all.isEmpty)
    }

    /// The detector looks again by itself when a wait ends, without another change.
    @Test func itLooksAgainWhenTheWaitEnds() async throws {
        let mic = FakeMic(), said = Heard<Bool>()
        let d = CallDetector(source: mic, own: Self.own)
        d.start { said.add($0) }
        defer { d.stop() }
        #expect(mic.started)
        mic.say([Self.user("com.microsoft.teams2")])
        let deadline = Date().addingTimeInterval(CallHeuristic.start + 3)
        while said.all.isEmpty, Date() < deadline { try await Task.sleep(for: .milliseconds(100)) }
        #expect(said.all == [true], "the call started about 3 s in, with nothing else said")
    }

    // MARK: Privacy mode

    static func mode() -> (PrivacyMode, FakeShareDetector, FakeShareDetector) {
        let mode = PrivacyMode(store: MemoryDefaults())
        let share = FakeShareDetector(), call = FakeShareDetector()
        mode.watch(share)
        mode.watchCalls(call)
        return (mode, share, call)
    }

    @Test func aCallAsksWithItsOwnTitle() {
        let (mode, share, call) = Self.mode()
        call.say(true)
        #expect(mode.asking && mode.isOn)
        #expect(mode.coverTitle == "You\u{2019}re in a call")
        share.say(true)
        #expect(mode.coverTitle == "Your screen is being shared", "sharing says more than a call")
    }

    @Test func turnedOnByACallItTurnsOffWhenTheCallEnds() {
        let (mode, share, call) = Self.mode()
        call.say(true)
        mode.answer(hide: true, remember: false)
        #expect(mode.isOn && !mode.isManual)
        call.say(false)
        #expect(!mode.isOn, "the call ended, and nothing is shared")

        // A call that ends while the screen is still shared leaves it on.
        call.say(true)
        mode.answer(hide: true, remember: false)
        share.say(true)
        call.say(false)
        #expect(mode.isOn, "still sharing")
        share.say(false)
        #expect(!mode.isOn)
    }

    @Test func sharingDuringACallDoesntAskAgain() {
        let (mode, share, call) = Self.mode()
        call.say(true)
        mode.answer(hide: false, remember: false)
        #expect(!mode.isOn)
        share.say(true)
        #expect(!mode.asking, "you already said show them, for this call")
        call.say(false); share.say(false)
        call.say(true)
        #expect(mode.asking, "the next call asks again")
    }

    @Test func oneRememberedChoiceCoversCallsAndSharing() {
        let (mode, share, call) = Self.mode()
        call.say(true)
        mode.answer(hide: true, remember: true)
        call.say(false)
        share.say(true)
        #expect(mode.isOn && !mode.asking, "remembered from the call")
        share.say(false)
        mode.whenShared = .nothing
        call.say(true)
        #expect(!mode.isOn && !mode.asking)
    }

    @Test func turnedOnByHandItStaysOnAfterTheCall() {
        let (mode, _, call) = Self.mode()
        mode.setManual(true)
        call.say(true)
        #expect(!mode.asking)
        call.say(false)
        #expect(mode.isOn && mode.isManual)
    }

    // MARK: Words

    @Test func theCallCopy() {
        #expect(PrivacyWords.coverTitleCall == "You\u{2019}re in a call")
        #expect(PrivacyWords.whenSharedTitleMac == "In calls and when sharing your screen")
        for w in [PrivacyWords.coverTitleCall, PrivacyWords.whenSharedTitleMac, PrivacyWords.whenSharedFooterMac, PrivacyModeSection.footer] {
            #expect(!w.contains("\u{2014}"), "no em dash: \(w)")
        }
        #if os(macOS)
        #expect(PrivacyModeSection.pickerTitle == PrivacyWords.whenSharedTitleMac)
        #expect(PrivacyModeSection.footer.contains("Calls count in Teams, Zoom, FaceTime, Slack"))
        #else
        #expect(PrivacyModeSection.pickerTitle == PrivacyWords.whenSharedTitle, "the iPhone doesn't hear calls")
        #endif
    }
}
