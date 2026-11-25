import Foundation
import Testing
@testable import Pane

/// The telemetry chokepoint (docs/Technical/telemetry-inventory.md). Everything the app records or
/// sends about itself passes one gate, `Telemetry.allowed`, and the switch follows the account.
/// Run by every `scripts/prepush.sh --tests` (scripts/ci/always-tests.txt): a new path that goes
/// around the gate fails here, whichever file it is in.
@Suite struct TelemetryGuardTests {
    /// Every Swift file of both apps, the share extension and the widgets, comments taken out.
    static func sources() throws -> [(name: String, code: String)] {
        var out: [(String, String)] = []
        for folder in ["Views", "App", "Model", "Editor", "Sync", "Telemetry", "Collab", "PaneShare", "PaneWidgets"] {
            let root = try TestFiles.url(folder)
            let files = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil)?.compactMap { $0 as? URL } ?? []
            for f in files where f.pathExtension == "swift" {
                let text = try String(contentsOf: f, encoding: .utf8)
                let code = text.split(separator: "\n", omittingEmptySubsequences: false)
                    .map { line -> Substring in
                        let t = line.drop { $0 == " " }
                        return t.hasPrefix("//") ? "" : line
                    }.joined(separator: "\n")
                out.append(("\(folder)/\(f.lastPathComponent)", code))
            }
        }
        return out
    }

    /// Where each way out of the app may be named: nowhere else.
    static let onlyIn: [(what: String, files: Set<String>)] = [
        // PostHog, its transport, its body and its queue file: Telemetry.swift.
        ("URLSessionTelemetryTransport", ["Telemetry/Telemetry.swift"]),
        ("TelemetryBody", ["Telemetry/Telemetry.swift"]),
        ("FileTelemetryQueue", ["Telemetry/Telemetry.swift"]),
        ("posthog", ["Telemetry/Telemetry.swift"]),
        ("PostHog", ["Telemetry/Telemetry.swift"]),
        // Apple's crash and hang reports: TelemetryDiagnostics.swift, which records through the gate.
        ("MetricKit", ["Telemetry/TelemetryDiagnostics.swift"]),
        ("MXMetricManager", ["Telemetry/TelemetryDiagnostics.swift"]),
        // The account's choice.
        ("telemetry_choice_", ["Telemetry/TelemetryChoice.swift"]),
        // The switch itself is set only through the gate's owner and the sync.
        ("Telemetry.consentKey)", ["Views/DiagnosticsSection.swift"]),
        ("\"shareDiagnostics", ["Telemetry/Telemetry.swift"]),
    ] + ServerUsage.functions.map { ("\"\($0)\"", ["Telemetry/ServerUsage.swift"]) }

    @Test func nothingOutsideTheTelemetryModuleReachesATransportPostHogMetricKitOrAUsageTable() throws {
        let files = try Self.sources()
        #expect(files.count > 100, "the app's code is in the test bundle (project.yml)")
        for (what, allowed) in Self.onlyIn {
            let found = Set(files.filter { $0.code.contains(what) }.map(\.name))
            #expect(found.subtracting(allowed).isEmpty, "\(what) is named outside \(allowed.sorted()): \(found.subtracting(allowed).sorted()). Go through Telemetry, Funnel, Usage or ServerUsage.")
        }
    }

    @Test func noOtherAnalyticsOrCrashSDK() throws {
        let sdks = ["Firebase", "Crashlytics", "Sentry", "Mixpanel", "Amplitude", "Segment", "Bugsnag", "TelemetryDeck", "AppCenter", "Datadog", "PostHog", "Aptabase"]
        for (name, code) in try Self.sources() {
            for sdk in sdks { #expect(!code.contains("import \(sdk)"), "\(name) imports \(sdk)") }
        }
        let project = try TestFiles.text("project.yml")
        for sdk in sdks { #expect(!project.localizedCaseInsensitiveContains("github.com/\(sdk)"), "project.yml adds \(sdk)") }
    }

    /// Every server function that records usage is a case of ServerUsage.Call.
    @Test func everyUsageCallIsListed() {
        let calls: [ServerUsage.Call] = [.tipEvent(tip: "t", event: "shown"), .featureUsed("menuBar"), .activeDays(["2026-11-25"]),
                                         .seenDevice(UUID(), platform: "macos"), .heardFrom(source: "friend", detail: "")]
        #expect(Set(calls.map(\.function)) == Set(ServerUsage.functions))
    }

    // MARK: Off means off, through every entry point

    private static func on() -> (Telemetry, StubTransport) {
        let transport = StubTransport()
        let config = TelemetryConfig(key: "phc_test", host: TelemetryGate.defaultHost,
                                     context: TelemetryContext(platform: .macos, deviceClass: .mac, channel: .release, distribution: .direct))
        return (Telemetry(config: config, transport: transport, store: MemoryTelemetryQueue(), defaults: TestDefaults()), transport)
    }

    @Test func offEveryEventFeatureFunnelStepSpeedAndTimingIsDropped() async {
        let (t, transport) = Self.on()
        t.consent = false
        #expect(!t.allowed(.posthog) && !t.allowed(.server))
        for event in TelemetryEvent.samples { t.record(event) }
        for feature in UsedFeature.allCases { t.used(feature) }
        t.edited(UUID())
        t.speed(.noteOpened, seconds: 0.1)
        t.speed(.search, seconds: 0.1)
        t.syncFinished(seconds: 1, ok: true)
        t.launched(opensNotes: true)
        t.notesShown()
        t.becameActive(signedIn: true)
        t.signedOut()
        t.accountDeleted()
        await t.resigning(quitting: true)
        await t.flush()
        #expect(t.waiting.isEmpty && transport.bodies.isEmpty)
    }

    @Test func onEveryEventGoesThroughTheGate() async {
        let (t, transport) = Self.on()
        #expect(t.allowed(.posthog))
        for event in TelemetryEvent.samples { t.record(event) }
        await t.flush()
        #expect(transport.events.count == TelemetryEvent.samples.count)
    }

    @Test func offNothingGoesToTheServer() async throws {
        let t = Telemetry(defaults: TestDefaults())
        let sent = GuardBox<[ServerUsage.Call]>([])
        let calls: [ServerUsage.Call] = [.tipEvent(tip: "shareLink", event: "shown"), .featureUsed("menuBar"), .activeDays(["2026-11-25"]),
                                         .seenDevice(UUID(), platform: "macos"), .heardFrom(source: "friend", detail: "")]
        try await ServerUsage.$tap.withValue({ c in sent.value.append(c) }) {
            for c in calls { try await ServerUsage.send(c, nil, telemetry: t) }
            #expect(sent.value == calls, "on: every call goes")
            t.consent = false
            for c in calls { try await ServerUsage.send(c, nil, telemetry: t) }
        }
        #expect(sent.value == calls, "off: none goes")
    }

    // MARK: The switch follows the account

    @Test func theLatestChoiceWins() {
        let early = Date(timeIntervalSince1970: 1_000), late = Date(timeIntervalSince1970: 2_000)
        typealias S = TelemetryChoiceSync
        #expect(S.decide(device: true, deviceAt: nil, account: .init(share: nil)) == .agree)
        #expect(S.decide(device: false, deviceAt: early, account: .init(share: nil)) == .push(false, at: early), "off while signed out tells the account")
        #expect(S.decide(device: true, deviceAt: nil, account: .init(share: false, updatedAt: 1_000)) == .adopt(false, at: early), "a new device takes the account's off")
        #expect(S.decide(device: true, deviceAt: late, account: .init(share: false, updatedAt: 1_000)) == .push(true, at: late))
        #expect(S.decide(device: true, deviceAt: early, account: .init(share: false, updatedAt: 2_000)) == .adopt(false, at: late))
        #expect(S.decide(device: false, deviceAt: early, account: .init(share: false, updatedAt: 2_000)) == .agree)
    }

    @MainActor @Test func signingInToAnAccountThatIsOffTurnsThisDeviceOffBeforeAnythingIsSent() async {
        let (t, transport) = Self.on()
        t.waitsForAccountChoice = true
        t.record(.appOpened(launch: true, signedIn: false))
        let account = UUID()
        t.identify(account)
        t.record(.signedIn(.apple))
        #expect(t.holding)
        await t.flush()
        #expect(transport.bodies.isEmpty, "nothing goes before the account's choice is known")
        let service = GuardFakeChoice(.init(share: false, updatedAt: Date().timeIntervalSince1970))
        await TelemetryChoiceSync.sync(account, service: service, telemetry: t)
        #expect(!t.consent && !t.holding && t.waiting.isEmpty)
        await t.flush()
        #expect(transport.bodies.isEmpty)
    }

    @MainActor @Test func signingInToAnAccountThatIsOnSendsWhatWaited() async {
        let (t, transport) = Self.on()
        t.waitsForAccountChoice = true
        let account = UUID()
        t.identify(account)
        t.record(.signedIn(.apple))
        await TelemetryChoiceSync.sync(account, service: GuardFakeChoice(.init(share: nil)), telemetry: t)
        #expect(!t.holding)
        await t.flush()
        #expect(transport.events.count == 1)
        // The same account next launch: its choice is known here, so nothing waits.
        let (t2, _) = Self.on()
        t2.waitsForAccountChoice = true
        t2.accountChoiceKnown(account)
        t2.identify(account)
        #expect(!t2.holding)
    }

    @MainActor @Test func offlineTheChoiceStaysUnknownAndNothingIsSent() async {
        let (t, transport) = Self.on()
        t.waitsForAccountChoice = true
        let account = UUID()
        t.identify(account)
        t.record(.signedIn(.apple))
        let service = GuardFakeChoice(.init(share: nil))
        service.offline = true
        await TelemetryChoiceSync.sync(account, service: service, telemetry: t)
        await t.flush()
        #expect(t.holding && transport.bodies.isEmpty)
    }

    @MainActor @Test func turningItOffWhileSignedOutTellsTheAccountAtSignIn() async {
        let (t, _) = Self.on()
        t.consent = false
        let service = GuardFakeChoice(.init(share: nil))
        await TelemetryChoiceSync.sync(UUID(), service: service, telemetry: t)
        #expect(service.sets.map(\.0) == [false])
        #expect(!t.consent)
    }
}

final class GuardBox<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: T
    init(_ v: T) { stored = v }
    var value: T {
        get { lock.withLock { stored } }
        set { lock.withLock { stored = newValue } }
    }
}

final class GuardFakeChoice: TelemetryChoiceService, @unchecked Sendable {
    private let lock = NSLock()
    private var choice: AccountTelemetryChoice
    private(set) var sets: [(Bool, Date)] = []
    var offline = false

    init(_ choice: AccountTelemetryChoice) { self.choice = choice }

    func get() async throws -> AccountTelemetryChoice {
        try lock.withLock {
            if offline { throw URLError(.notConnectedToInternet) }
            return choice
        }
    }

    func set(_ share: Bool, at: Date) async throws -> AccountTelemetryChoice {
        try lock.withLock {
            if offline { throw URLError(.notConnectedToInternet) }
            sets.append((share, at))
            choice = .init(share: share, updatedAt: at.timeIntervalSince1970)
            return choice
        }
    }
}
