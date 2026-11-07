import Foundation
import SwiftData
import Testing
@testable import Pane

/// Which features are used (usage_day), how fast notes and searches feel (note_opened_speed,
/// search_speed), who leaves (ai_disconnected, signed_out, account_deleted), sharing's steps and
/// the storage level (docs/Technical/app-telemetry.md).

/// The features a piece of code counts (Usage.tap), in order.
final class UsedFeatures: @unchecked Sendable {
    private(set) var seen: [UsedFeature] = []
    private let lock = NSLock()

    func watch<T>(_ body: () throws -> T) rethrows -> T {
        try Usage.$tap.withValue({ [self] f in lock.withLock { seen.append(f) } }, operation: body)
    }

    func watch<T>(isolation: isolated (any Actor)? = #isolation, _ body: () async throws -> T) async rethrows -> T {
        try await Usage.$tap.withValue({ [self] f in lock.withLock { seen.append(f) } }, operation: body, isolation: isolation)
    }

    func count(_ f: UsedFeature) -> Int { lock.withLock { seen.filter { $0 == f }.count } }
}

private let context = TelemetryContext(appVersion: VersionNumber("1.3"), appBuild: nil, osVersion: nil, platform: .macos, deviceClass: .mac,
                                       channel: .release, distribution: .direct)

/// A Telemetry that sends through a stub, on a clock the test moves.
private final class Clock: @unchecked Sendable {
    var now = Date(timeIntervalSince1970: 86400 * 20_000 + 3600)
}

private func telemetry(_ defaults: UserDefaults = TestDefaults(), clock: Clock = Clock()) -> (Telemetry, StubTransport) {
    let transport = StubTransport()
    let t = Telemetry(config: TelemetryConfig(key: "phc_test", host: TelemetryGate.defaultHost, context: context), transport: transport,
                      defaults: defaults, now: { clock.now })
    return (t, transport)
}

private func events(_ t: Telemetry, _ name: String) -> [[String: Any]] {
    t.waiting.filter { $0["event"] as? String == name }
}

private func props(_ e: [String: Any]?) -> [String: Any] { e?["properties"] as? [String: Any] ?? [:] }

@Suite struct UsageDayTests {
    @Test func theFirstDayStartsTheCountAndEachNextDaySendsWhatWasCountedAsRanges() {
        let clock = Clock()
        let (t, _) = telemetry(clock: clock)
        t.becameActive(signedIn: true)
        t.used(.notesCreated)
        #expect(events(t, "usage_day").isEmpty, "the first day only starts the count")
        for _ in 0..<2 { t.used(.notesCreated) }
        for _ in 0..<25 { t.used(.searchUsed) }
        t.used(.checklistTicked)
        let a = UUID(), b = UUID()
        t.edited(a); t.edited(a); t.edited(a); t.edited(b)
        t.becameActive(signedIn: true)
        #expect(events(t, "usage_day").isEmpty, "the same day: nothing")

        clock.now.addTimeInterval(86400)
        t.becameActive(signedIn: true)
        let sent = events(t, "usage_day")
        #expect(sent.count == 1)
        let p = props(sent.first)
        #expect(p["notes_created"] as? String == "2-5")
        #expect(p["search_used"] as? String == "21+")
        #expect(p["checklist_ticked"] as? String == "1")
        #expect(p["notes_edited"] as? String == "2-5", "two notes, however often each was typed in")
        for f in UsedFeature.allCases { #expect(p[f.rawValue] is String, "\(f) is always there") }
        #expect(p["go_to_note"] as? String == "0")

        // Counting starts again after a send.
        t.edited(a)
        clock.now.addTimeInterval(86400)
        t.becameActive(signedIn: true)
        let next = props(events(t, "usage_day").last)
        #expect(events(t, "usage_day").count == 2)
        #expect(next["notes_created"] as? String == "0" && next["notes_edited"] as? String == "1")
    }

    @Test func rangesNeverTheNumber() {
        #expect([0, 1, 2, 5, 6, 20, 21, 5000].map { UsageBucket($0).rawValue } == ["0", "1", "2-5", "2-5", "6-20", "6-20", "21+", "21+"])
        #expect(TelemetryEvent.usageDay([.slashMenu: 7]).properties[.slashMenu] == .word(UsageBucket.some))
    }

    @Test func nothingIsCountedOrKeptWithDiagnosticsOff() {
        let d = TestDefaults()
        let clock = Clock()
        let (t, _) = telemetry(d, clock: clock)
        t.used(.notesCreated)
        #expect(d.object(forKey: Telemetry.usageKey) != nil)
        t.consent = false
        #expect(d.object(forKey: Telemetry.usageKey) == nil, "turning it off drops what was counted")
        t.used(.notesCreated); t.edited(UUID()); t.speed(.noteOpened, seconds: 0.05)
        #expect(d.object(forKey: Telemetry.usageKey) == nil)
        t.becameActive(signedIn: true)
        clock.now.addTimeInterval(86400)
        t.becameActive(signedIn: true)
        #expect(t.waiting.isEmpty)
    }
}

@Suite struct FeltSpeedTests {
    @Test func countedIntoRangesAndSentEveryFiftyAndAtQuit() async {
        let (t, _) = telemetry()
        for i in 0..<49 { t.speed(.noteOpened, seconds: [0.05, 0.2, 0.6, 3][i % 4]) }
        #expect(events(t, "note_opened_speed").isEmpty)
        t.speed(.noteOpened, seconds: 0.099)
        let e = props(events(t, "note_opened_speed").first)
        #expect(e["under_100ms"] as? Int == 14 && e["under_250ms"] as? Int == 12 && e["under_1s"] as? Int == 12 && e["over_1s"] as? Int == 12)
        // The rest when the app quits (on iPhone, when it leaves the screen).
        let (t2, transport) = telemetry()
        t2.speed(.search, seconds: 0.3)
        t2.speed(.search, seconds: 0.01)
        await t2.resigning(quitting: Telemetry.leavingIsQuitting)
        if !Telemetry.leavingIsQuitting { #expect(transport.events.filter { $0["event"] as? String == "search_speed" }.isEmpty, "not until it quits") }
        await t2.resigning(quitting: true)
        let s = transport.events.filter { $0["event"] as? String == "search_speed" }
        #expect(s.count == 1)
        #expect(props(s.first)["under_100ms"] as? Int == 1 && props(s.first)["under_1s"] as? Int == 1)
    }

    @Test func theRangesEdges() {
        var t = SpeedTimings()
        for s in [0.0, 0.0999, 0.1, 0.2499, 0.25, 0.999, 1.0, 9] { t.add(seconds: s) }
        #expect(t == SpeedTimings(under100ms: 2, under250ms: 2, under1s: 2, over1s: 2))
    }

    @MainActor @Test func aNoteOpenIsFromTheTapToItsEditorDrawn() {
        var clock: TimeInterval = 100
        var seen: [TimeInterval] = []
        NoteOpenSpeed.now = { clock }
        NoteOpenSpeed.record = { seen.append($0) }
        defer { NoteOpenSpeed.now = { ProcessInfo.processInfo.systemUptime }; NoteOpenSpeed.record = { Telemetry.shared.speed(.noteOpened, seconds: $0) } }
        NoteOpenSpeed.drawn()
        #expect(seen.isEmpty, "an editor nobody tapped for (the launch's note)")
        NoteOpenSpeed.tapped()
        clock += 0.18
        NoteOpenSpeed.drawn()
        NoteOpenSpeed.drawn()
        #expect(seen.count == 1 && abs(seen[0] - 0.18) < 0.0001, "once, from the tap")
        NoteOpenSpeed.tapped(at: 99.5)
        NoteOpenSpeed.drawn()
        #expect(seen.count == 2 && abs(seen[1] - 0.68) < 0.0001, "from the click's own time")
        NoteOpenSpeed.tapped()
        clock += 5
        NoteOpenSpeed.drawn()
        #expect(seen.count == 2, "nothing drew it (a locked note, an app): dropped")
    }

    @MainActor @Test func aSearchIsFromTheFirstKeyToItsResults() {
        var clock: TimeInterval = 10
        var seen: [TimeInterval] = []
        SearchSpeed.now = { clock }
        SearchSpeed.record = { seen.append($0) }
        defer { SearchSpeed.now = { ProcessInfo.processInfo.systemUptime }; SearchSpeed.record = { Telemetry.shared.speed(.search, seconds: $0) } }
        SearchSpeed.typed()
        clock += 0.02
        SearchSpeed.typed()
        clock += 0.03
        SearchSpeed.shown()
        SearchSpeed.shown()
        #expect(seen.count == 1 && abs(seen[0] - 0.05) < 0.0001)
    }
}

@Suite struct DiagnosticsFooterTests {
    /// The switch says what it sends: the feature counts too (usage_day), and never the notes.
    @Test func theFooterSaysFeaturesAreCounted() {
        #expect(DiagnosticsCopy.footer.contains("which settings and features you use"))
        #expect(DiagnosticsCopy.footer.contains("Never your notes"))
    }
}

@Suite struct LeavingTelemetryTests {
    @Test func signingOutIsSaidUnderTheAccountBeforeItGoes() {
        let (t, _) = telemetry()
        let me = UUID()
        t.identify(me)
        t.signedOut()
        let e = events(t, "signed_out")
        #expect(e.count == 1 && e.first?["distinct_id"] as? String == me.uuidString.lowercased())
        t.signedOut()
        #expect(events(t, "signed_out").count == 1, "signed out already: nothing more")
    }

    @Test func deletingTheAccountDropsWhatWaitedAndSaysSoUnderItsIdOnce() {
        let (t, _) = telemetry()
        let me = UUID()
        t.identify(me)
        t.record(.firstNoteCreated)
        t.used(.notesCreated)
        t.accountDeleted()
        #expect(t.waiting.map { $0["event"] as? String } == ["account_deleted"])
        #expect(t.waiting.first?["distinct_id"] as? String == me.uuidString.lowercased())
        t.record(.appOpened(launch: false, signedIn: false))
        #expect(t.waiting.last?["distinct_id"] as? String != me.uuidString.lowercased(), "what follows has a new id")
        t.signedOut()
        #expect(events(t, "signed_out").isEmpty, "the deleted account doesn't sign out as well")
        #expect(TelemetryEvent.accountDeleted.goesSoon && TelemetryEvent.signedOut.goesSoon && TelemetryEvent.aiDisconnected(.claude).goesSoon)
    }

    @Test func aDisconnectSaysTheKindOfAIByItsMarkNeverItsName() {
        func row(_ name: String, _ kind: String?, _ host: String?) -> Connection {
            Connection(id: UUID(), name: name, kind: kind, created_at: .now, last_used_at: nil, revoked_at: .now, redirect_host: host)
        }
        #expect(ConnectRevoke.disconnected([row("Claude", "oauth", "claude.ai")]) == .aiDisconnected(.claude))
        #expect(ConnectRevoke.disconnected([row("ChatGPT", "oauth", "chatgpt.com")]) == .aiDisconnected(.chatgpt))
        #expect(ConnectRevoke.disconnected([row("Claude Code", nil, nil)]) == .aiDisconnected(.claude))
        #expect(ConnectRevoke.disconnected([row("Codex", "token", nil)]) == .aiDisconnected(.chatgpt))
        #expect(ConnectRevoke.disconnected([row("Claude", "oauth", "claude.example.net")]) == .aiDisconnected(.other), "a name is never enough")
        #expect(ConnectRevoke.disconnected([row("Grok", "oauth", "grok.com")]) == .aiDisconnected(.other))
        #expect(ConnectRevoke.disconnected([]) == nil, "not this account's, or gone already")
    }
}

@MainActor @Suite struct StorageLevelTelemetryTests {
    @Test func saidWhenItChangesAndOnlyThen() {
        let d = TestDefaults()
        let steps = FunnelSteps()
        steps.watch {
            StorageLevelWatch.saw(.fine, defaults: d, isOn: true)
            StorageLevelWatch.saw(.nearlyFull, defaults: d, isOn: true)
            StorageLevelWatch.saw(.nearlyFull, defaults: d, isOn: true)
            StorageLevelWatch.saw(.full, defaults: d, isOn: true)
            StorageLevelWatch.saw(.fine, defaults: d, isOn: true)
        }
        #expect(steps.events == [.storageLevel(.almostFull), .storageLevel(.full), .storageLevel(.fine)])
        let off = TestDefaults()
        StorageLevelWatch.saw(.full, defaults: off, isOn: false)
        #expect(off.object(forKey: StorageLevelWatch.key) == nil, "nothing kept while it's off")
    }
}

/// Each feature is counted at the place it happens.
@MainActor @Suite(.serialized) struct UsageWiringTests {
    private func library() throws -> ModelContext {
        ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
    }

    @Test func notesMadePinnedAndFromTheMenuBar() throws {
        let c = try library()
        let used = UsedFeatures()
        try used.watch {
            let n = c.createNote(in: .all, body: "Plan")
            c.togglePin(n)
            c.togglePin(n)
            _ = QuickCapture.save("Call Sara", in: c)
            _ = QuickCapture.save("   ", in: c)
            try c.save()
        }
        #expect(used.count(.notesCreated) == 2)
        #expect(used.count(.notePinned) == 1, "pinning, not unpinning")
        #expect(used.count(.menuBarNote) == 1)
    }

    @Test func anImportCountsOnceWhenItStartsBringingNotes() {
        let used = UsedFeatures()
        used.watch {
            Funnel.record(.importStep(.appleNotes, .opened))
            Funnel.record(.importStep(.appleNotes, .importing))
            Funnel.record(.importStep(.appleNotes, .done, count: .upTo9))
        }
        #expect(used.seen == [.importsStarted])
    }

    #if os(macOS)
    @Test func goToNoteCountsWhatWasChosen() {
        let used = UsedFeatures()
        let actions = QuickOpen.Actions(open: { _ in }, run: { _ in }, search: { _ in })
        used.watch { QuickOpen.choose(.search("milk"), with: actions) }
        #expect(used.seen == [.goToNote])
    }
    #endif

    #if os(macOS)
    @Test func theEditorsTablesSlashCommandsTicksAndLinks() async {
        let h = await EditorHarness("Plan\n- [ ] Milk\n")
        defer { h.close() }
        let used = UsedFeatures()
        await used.watch {
            await h.caret(after: "Plan")
            await h.type(" /todo")
            #expect(h.controller.slashCommands == [.checklist])
            h.controller.runSlashChoice()
            await h.settle()
            let milk = (h.text as NSString).range(of: "- [ ] Milk").location
            _ = h.view.tick(line: milk)
            _ = h.view.tick(line: milk)
            await h.select((h.text as NSString).length)
            h.controller.insertWikiLink("Groceries")
            await h.settle()
            h.controller.insertTable()
            await h.settle()
        }
        #expect(used.count(.tablesInserted) == 1)
        #expect(used.count(.linksInserted) == 1)
        #expect(used.count(.slashMenu) == 1)
        #expect(used.count(.checklistTicked) == 1, "ticking counts, unticking doesn't")
    }
    #endif
}
