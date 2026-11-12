import Foundation
import SwiftData
import Testing
@testable import Pane

/// Which features are used (feature_used), how fast notes and searches feel (note_opened_speed,
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

private func telemetry(_ defaults: UserDefaults = TestDefaults(), clock: Clock = Clock(), store: TelemetryQueueStore = MemoryTelemetryQueue())
    -> (Telemetry, StubTransport) {
    let transport = StubTransport()
    let t = Telemetry(config: TelemetryConfig(key: "phc_test", host: TelemetryGate.defaultHost, context: context), transport: transport,
                      store: store, defaults: defaults, now: { clock.now })
    return (t, transport)
}

private func events(_ t: Telemetry, _ name: String) -> [[String: Any]] {
    t.waiting.filter { $0["event"] as? String == name }
}

private func props(_ e: [String: Any]?) -> [String: Any] { e?["properties"] as? [String: Any] ?? [:] }

@Suite struct FeatureUsedTests {
    private func features(_ t: Telemetry) -> [String?] { events(t, "feature_used").map { props($0)["feature"] as? String } }

    @Test func eachUseIsOneEventSayingWhichFeature() {
        let (t, _) = telemetry()
        t.used(.notesCreated)
        t.used(.searchUsed)
        t.used(.searchUsed)
        t.used(.todaysNote)
        #expect(features(t) == ["notes_created", "search_used", "search_used", "todays_note"])
        #expect(props(events(t, "feature_used").first).keys.contains("app_version"), "with what every event says")
        #expect(TelemetryEvent.featureUsed(.slashMenu).properties == [.feature: .word(UsedFeature.slashMenu)])
        #expect(!TelemetryEvent.featureUsed(.slashMenu).goesSoon, "batched, like the other product events")
    }

    /// Offline, one event per use can fill the queue; an error that comes after must still be kept.
    @Test func featureUsesNeverCrowdOutAnError() {
        let (t, _) = telemetry()
        for _ in 0 ..< Telemetry.cap + 10 { t.used(.searchUsed) }
        #expect(t.waiting.count == Telemetry.cap)
        t.record(.signInFailed(.email, .other, status: 500))
        #expect(t.waiting.count == Telemetry.cap)
        #expect(events(t, "sign_in_failed").count == 1, "the error took a feature use's place")
        #expect(events(t, "feature_used").count == Telemetry.cap - 1)
        t.used(.todaysNote)
        #expect(!features(t).contains("todays_note"), "a feature use never pushes out another event")
        for i in 0 ..< Telemetry.cap { t.record(.signInFailed(.email, .other, status: i)) }
        #expect(events(t, "feature_used").isEmpty, "errors take every feature use's place, then the newest is dropped")
        #expect(props(events(t, "sign_in_failed").first)["status"] as? Int == 500, "what led to a flood stays")
    }

    @Test func aNoteTypedInIsOneEventALaunchNotOneAKeystroke() {
        let d = TestDefaults()
        let (t, _) = telemetry(d)
        let a = UUID(), b = UUID()
        for _ in 0..<40 { t.edited(a) }
        t.edited(b); t.edited(b)
        #expect(features(t) == ["notes_edited", "notes_edited"], "a and b, once each")
        let (next, _) = telemetry(d)
        next.edited(a)
        #expect(features(next) == ["notes_edited"], "the next launch: again")
    }

    @Test func nothingIsRecordedOrKeptWithDiagnosticsOff() {
        let d = TestDefaults()
        let (t, _) = telemetry(d)
        t.used(.notesCreated)
        t.consent = false
        #expect(t.waiting.isEmpty, "turning it off drops what waited")
        let a = UUID()
        t.used(.notesCreated); t.edited(a); t.speed(.noteOpened, seconds: 0.05)
        #expect(t.waiting.isEmpty)
        t.consent = true
        t.edited(a)
        #expect(features(t) == ["notes_edited"], "a note typed in while it was off still counts once it's on")
        let before = Set(d.dictionaryRepresentation().keys)
        t.consent = false
        t.used(.checklistTicked)
        #expect(Set(d.dictionaryRepresentation().keys).subtracting(before).subtracting([Telemetry.consentKey]).isEmpty, "nothing kept on the device")
    }

    @Test func theOldDailyCountsAreRemovedAtStart() {
        let d = TestDefaults()
        d.set(["notes_created": 4], forKey: "telemetry.usage")
        d.set(20_000, forKey: "telemetry.usageDay")
        d.set(20_000, forKey: "telemetry.settingsDay")
        _ = telemetry(d)
        for key in ["telemetry.usage", "telemetry.usageDay", "telemetry.settingsDay"] { #expect(d.object(forKey: key) == nil, "\(key)") }
        #expect(Telemetry.retiredKeys == ["telemetry.usage", "telemetry.usageDay", "telemetry.settingsDay"])
    }
}

/// What waits is in a file, written as each event is recorded: a quit or a kill before the upload
/// leaves it for the next launch.
@Suite struct TelemetryQueueFileTests {
    private func file() -> FileTelemetryQueue {
        FileTelemetryQueue(url: FileManager.default.temporaryDirectory.appending(path: "telemetry-\(UUID().uuidString)/queue.jsonl"))
    }

    @Test func whatWaitedSurvivesARelaunchAndGoesOut() async throws {
        let store = file()
        defer { try? FileManager.default.removeItem(at: store.url.deletingLastPathComponent()) }
        let d = TestDefaults()
        do {
            let (t, transport) = telemetry(d, store: store)
            t.used(.checklistTicked)
            t.used(.goToNote)
            #expect(transport.events.isEmpty, "killed before any upload")
        }
        let (next, transport) = telemetry(d, store: file(at: store.url))
        #expect(events(next, "feature_used").compactMap { props($0)["feature"] as? String } == ["checklist_ticked", "go_to_note"])
        await next.flush()
        #expect(transport.events.count == 2)
        #expect(store.load().isEmpty, "sent: the file is gone")
        let (third, _) = telemetry(d, store: store)
        #expect(third.waiting.isEmpty, "never sent twice")
    }

    @Test func theFileKeepsAtMostTheCap() throws {
        let store = file()
        defer { try? FileManager.default.removeItem(at: store.url.deletingLastPathComponent()) }
        let d = TestDefaults()
        let (t, _) = telemetry(d, store: store)
        for _ in 0..<(Telemetry.cap + 30) { t.used(.searchUsed) }
        #expect(store.load().count == Telemetry.cap)
        let (next, _) = telemetry(d, store: store)
        #expect(next.waiting.count == Telemetry.cap)
    }

    @Test func turnedOffWhileItWaitedLeavesNothingForTheNextLaunch() {
        let store = file()
        defer { try? FileManager.default.removeItem(at: store.url.deletingLastPathComponent()) }
        let d = TestDefaults()
        let (t, _) = telemetry(d, store: store)
        t.used(.notePinned)
        d.set(false, forKey: Telemetry.consentKey)
        let (next, _) = telemetry(d, store: store)
        #expect(next.waiting.isEmpty)
        #expect(store.load().isEmpty)
    }

    private func file(at url: URL) -> FileTelemetryQueue { FileTelemetryQueue(url: url) }
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
    /// The switch says what it sends: the features used too (feature_used), and never the notes.
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
        #expect(ConnectRevoke.disconnected([row("Grok", "oauth", "grok.com")]) == .aiDisconnected(.grok))
        #expect(ConnectRevoke.disconnected([row("Grok", "oauth", "grok.example.net")]) == .aiDisconnected(.other), "a name is never enough")
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

/// Coming back to an app left open, taking back what an AI did, and every kind of AI.
@Suite struct ReturnAndUndoTelemetryTests {
    @Test func comingBackAfterHalfAnHourIsSaidTheSameDayOnly() {
        let clock = Clock()
        let (t, _) = telemetry(clock: clock)
        t.becameActive(signedIn: true)
        t.left()
        clock.now += 10 * 60
        t.becameActive(signedIn: true)
        #expect(events(t, "app_returned").isEmpty, "ten minutes away isn't coming back")
        t.left()
        clock.now += 45 * 60
        t.becameActive(signedIn: true)
        t.left()
        clock.now += 3 * 3600
        t.becameActive(signedIn: true)
        #expect(events(t, "app_returned").map { props($0)["away"] as? String } == ["under_2h", "under_8h"])
        // Brought to the front again without leaving: nothing.
        clock.now += 3600
        t.becameActive(signedIn: true)
        #expect(events(t, "app_returned").count == 2)
        // A new day is an app_opened, not a return.
        t.left()
        clock.now += 86400
        t.becameActive(signedIn: true)
        #expect(events(t, "app_returned").count == 2)
        #expect(events(t, "app_opened").count == 2)
    }

    @Test func theRangesEdges() {
        #expect(AwayBucket(seconds: 1799) == nil)
        #expect(AwayBucket(seconds: 1800) == .under2h)
        #expect(AwayBucket(seconds: 7200) == .under8h)
        #expect(AwayBucket(seconds: 28800) == .over8h)
        #expect(SinceBucket(seconds: 299) == .under5m)
        #expect(SinceBucket(seconds: 300) == .under1h)
        #expect(SinceBucket(seconds: 3600) == .under1d)
        #expect(SinceBucket(seconds: 86400) == .under7d)
        #expect(SinceBucket(seconds: 7 * 86400) == nil, "past a week it isn't about the AI")
    }

    @Test func whatTheAIDidHasAWordForEachKindOfChange() {
        let words = [AIChange.Kind.edit, .restore, .created, .moved, .deleted, .restored].map { AIChangeWord($0).rawValue }
        #expect(words == ["edited", "version_restored", "created", "moved", "deleted", "recovered"])
    }

    @Test func everyAIThatSignsInWhereOnlyItCanHasAKindOfItsOwn() {
        #expect(AIKind(verified: "Claude") == .claude)
        #expect(AIKind(verified: "ChatGPT") == .chatgpt)
        #expect(AIKind(verified: "Grok") == .grok)
        #expect(AIKind(verified: nil) == .other)
        #expect(ConnectAIKind(guideName: "Grok") == .grok)
        #expect(ConnectAIKind(guideName: "Something") == .other)
    }
}

@MainActor @Suite(.serialized) struct AIUndoWiringTests {
    private func library() throws -> ModelContext {
        ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
    }

    @Test func undoingAnAIsChangeSaysWhatItWasAndHowSoon() {
        let steps = FunnelSteps()
        let now = Date()
        steps.watch {
            AIUndoUsage.undone(.undo, change: .edited, at: now.addingTimeInterval(-60), now: now)
            AIUndoUsage.undone(.changesList, change: .created, at: now.addingTimeInterval(-2 * 3600), now: now)
            AIUndoUsage.undone(.changesList, change: .moved, at: now.addingTimeInterval(-30 * 86400), now: now)
        }
        #expect(steps.events == [.aiChangeUndone(.undo, change: .edited, after: .under5m),
                                 .aiChangeUndone(.changesList, change: .created, after: .under1d)])
    }

    @Test func deletingNotesCountsOnceAndSaysSoForANoteAnAIChanged() throws {
        let c = try library()
        let mine = c.createNote(in: .all, body: "Mine\n\nshopping")
        let theirs = c.createNote(in: .all, body: "Plan\n\nfrom the AI")
        theirs.aiEditor = "Claude"
        theirs.aiEditedAt = Date().addingTimeInterval(-120)
        defer { theirs.aiEditor = nil; theirs.aiEditedAt = nil }
        let used = UsedFeatures()
        let steps = FunnelSteps()
        used.watch { steps.watch { Usage.trashed([mine, theirs]) } }
        #expect(used.count(.notesTrashed) == 1, "one delete, however many notes")
        #expect(steps.events == [.aiChangeUndone(.deleted, change: nil, after: .under5m)])
        // Nothing to delete: nothing said.
        c.trash(mine)
        used.watch { Usage.trashed([mine]) }
        #expect(used.count(.notesTrashed) == 1)
    }
}
