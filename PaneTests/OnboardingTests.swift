import Foundation
import SwiftData
import Testing
@testable import Pane

/// The first-run flow: who sees it, where it resumes, and how it ends.
@MainActor @Suite struct OnboardingTests {
    private let now = Date(timeIntervalSince1970: 1_800_000_000)
    private var justNow: Date { now.addingTimeInterval(-30) }

    private func store(_ defaults: UserDefaults = TestDefaults()) -> OnboardingStore { OnboardingStore(defaults: defaults) }

    // MARK: Who sees it

    /// Item 99 (2026-10-12): after signing in, the flow opened on a second "Welcome to Pinto
    /// Notes" with only Continue. The welcome before sign-in said it; the flow starts at the name.
    @Test func aNewAccountWaitsThenStartsAtItsName() {
        let s = store()
        let account = UUID()
        s.attach(account: account, created: justNow, holdsNothing: true, now: now)
        #expect(s.phase == .waiting, "the window holds on the picture until the first sync has said")
        #expect(s.covers(account))
        s.settle(accountIsNew: true, progress: SetupProgress())
        #expect(s.phase == .showing(.name))
        #expect(Onboarding.Step.counted(from: s.first) == [.name, .bring, .connect])
    }

    /// Item 100: a name that is known (Apple's, Google's, this device's last) is not asked again.
    @Test func aKnownNameStartsAtBringingNotes() {
        let defaults = TestDefaults()
        let account = UUID()
        let s = store(defaults)
        s.attach(account: account, created: justNow, holdsNothing: true, now: now)
        s.settle(accountIsNew: true, progress: SetupProgress(), nameKnown: true)
        #expect(s.phase == .showing(.bring))
        #expect(Onboarding.Step.counted(from: s.first) == [.bring, .connect], "Step 1 of 2")
        s.back()
        #expect(s.step == .bring, "nothing behind the first step")
        s.advance(connected: false)
        s.back()
        #expect(s.step == .bring)
        // Quit and opened again: it still began at Bring.
        let again = store(defaults)
        again.attach(account: account, created: justNow, holdsNothing: false, now: now)
        #expect(again.first == .bring)
        again.back()
        #expect(again.step == .bring)
    }

    @Test func aStepSavedByAVersionWithTheWelcomeResumesAtTheName() {
        let defaults = TestDefaults()
        let account = UUID()
        defaults.set("welcome", forKey: Onboarding.savedKey(account))
        let s = store(defaults)
        #expect(s.covers(account))
        s.attach(account: account, created: justNow, holdsNothing: false, now: now)
        #expect(s.phase == .showing(.name))
    }

    @Test func anAccountWithNotesNeverSeesIt() {
        let s = store()
        // Notes already on this device (it was used signed out, or the library came down before).
        s.attach(account: UUID(), created: justNow, holdsNothing: false, now: now)
        #expect(s.phase == .off)
        s.settle(accountIsNew: false, progress: SetupProgress())
        #expect(s.phase == .off)
    }

    @Test func aSecondDeviceOnTheSameAccountDoesNotSeeIt() {
        // Minutes after signing up on the first device: this one is empty too, so it waits, and
        // the first sync says the account already holds something (its Notes folder at least).
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        #expect(s.phase == .waiting)
        s.settle(accountIsNew: false, progress: SetupProgress())
        #expect(s.phase == .off)
    }

    @Test func anAccountOlderThanADayIsNeverHeldBack() {
        let s = store()
        s.attach(account: UUID(), created: now.addingTimeInterval(-Onboarding.newAccountWindow - 1), holdsNothing: true, now: now)
        #expect(s.phase == .off, "an old account on a new device opens its notes at once")
    }

    @Test(arguments: [
        SetupProgress(dismissed: true), SetupProgress(celebrated: true), SetupProgress(imported: true),
        SetupProgress(connected: true), SetupProgress(aiEdits: 1),
    ])
    func setupAlreadyBehindItMeansNoFlow(progress: SetupProgress) {
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        s.settle(accountIsNew: true, progress: progress)
        #expect(s.phase == .off)
    }

    @Test func aSyncThatCannotSayOpensTheNotes() {
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        s.giveUpWaiting()
        #expect(s.phase == .off)
        #expect(!s.endedThisLaunch, "nothing was shown, so nothing is held back after it")
    }

    /// Found on staging under load: the first sync took longer than the wait, the notes opened
    /// with the old setup card, and the flow never came.
    @Test func aSlowFirstSyncStillGetsTheFlow() {
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        s.giveUpWaiting()
        #expect(s.phase == .off, "the notes, rather than a window that stays shut")
        s.settle(accountIsNew: true, progress: SetupProgress())
        #expect(s.phase == .showing(.name), "and the flow when the sync has answered")
    }

    @Test func aSlowFirstSyncOfAnAccountWithNotesStaysInTheNotes() {
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        s.giveUpWaiting()
        s.settle(accountIsNew: false, progress: SetupProgress())
        #expect(s.phase == .off)
        s.settle(accountIsNew: true, progress: SetupProgress())
        #expect(s.phase == .off, "asked once")
    }

    // MARK: Moving through it

    @Test func theStepsInOrderWithAndWithoutAnAI() {
        var seen: [Onboarding.Step] = []
        var step: Onboarding.Step? = .name
        while let s = step { seen.append(s); step = Onboarding.next(after: s, connected: false) }
        #expect(seen == [.name, .bring, .connect])
        #expect(Onboarding.next(after: .connect, connected: true) == .tryIt)
        #expect(Onboarding.next(after: .tryIt, connected: true) == nil)
        #expect(Onboarding.previous(before: .name) == nil)
        #expect(Onboarding.previous(before: .bring, first: .bring) == nil)
        #expect(Onboarding.previous(before: .tryIt) == .connect)
    }

    @Test func quittingMidwayResumesAtTheSameStep() {
        let defaults = TestDefaults()
        let account = UUID()
        let first = store(defaults)
        first.attach(account: account, created: justNow, holdsNothing: true, now: now)
        first.settle(accountIsNew: true, progress: SetupProgress())
        first.advance(connected: false)
        #expect(first.step == .bring)

        // The next launch, a day later, with the first folder now on the device.
        let second = store(defaults)
        #expect(second.covers(account), "the gate shows the flow on the first frame, before the session has attached")
        second.attach(account: account, created: justNow, holdsNothing: false, now: now.addingTimeInterval(2 * 86_400))
        #expect(second.phase == .showing(.bring))
        // An import on this device before quitting doesn't end it either.
        second.settle(accountIsNew: false, progress: SetupProgress(imported: true))
        #expect(second.phase == .showing(.bring))
    }

    @Test func finishingElsewhereClosesAResumedFlow() {
        let defaults = TestDefaults()
        let account = UUID()
        let first = store(defaults)
        first.attach(account: account, created: justNow, holdsNothing: true, now: now)
        first.settle(accountIsNew: true, progress: SetupProgress())
        let second = store(defaults)
        second.attach(account: account, created: justNow, holdsNothing: false, now: now)
        second.settle(accountIsNew: false, progress: SetupProgress(dismissed: true))
        #expect(second.phase == .off)
        #expect(!store(defaults).covers(account), "and it stays closed")
    }

    @Test func skippingEverythingEndsInANewNote() {
        let defaults = TestDefaults()
        let account = UUID()
        let s = store(defaults)
        s.attach(account: account, created: justNow, holdsNothing: true, now: now)
        s.settle(accountIsNew: true, progress: SetupProgress())
        #expect(s.advance(connected: false))   // name, left as it was
        #expect(s.advance(connected: false))   // Skip, I'll start empty
        #expect(!s.advance(connected: false), "Skip for now: nothing after it without an AI")
        s.finish(landing: .newNote)
        #expect(s.phase == .off)
        #expect(s.endedThisLaunch)
        #expect(s.takeLanding() == .newNote)
        #expect(s.takeLanding() == nil, "taken once")
        #expect(!store(defaults).covers(account), "never again on this device")
    }

    @Test func nothingAsksForADayAfterTheFlow() {
        let defaults = TestDefaults()
        let account = UUID()
        let s = store(defaults)
        #expect(!s.holdsAsks())
        s.attach(account: account, created: justNow, holdsNothing: true, now: now)
        #expect(s.holdsAsks(), "while the window waits")
        s.settle(accountIsNew: true, progress: SetupProgress())
        #expect(s.holdsAsks(), "during the flow")
        s.finish(landing: .newNote)
        #expect(s.holdsAsks(), "right after it")
        // Later launches, the same day and the day after next.
        let later = store(defaults)
        later.attach(account: account, created: justNow, holdsNothing: false, now: now)
        #expect(later.holdsAsks(now: .now.addingTimeInterval(3600)), "three launches in the first hour still ask nothing")
        #expect(!later.holdsAsks(now: .now.addingTimeInterval(Onboarding.quietAfter + 60)))
        // An account that never saw the flow is asked as before.
        later.attach(account: nil, created: nil, holdsNothing: false, now: now)
        later.attach(account: UUID(), created: now.addingTimeInterval(-90 * 86_400), holdsNothing: false, now: now)
        #expect(!later.holdsAsks())
    }

    @Test func anotherAccountOnTheSameDeviceStartsClean() {
        let defaults = TestDefaults()
        let s = store(defaults)
        let a = UUID(), b = UUID()
        s.attach(account: a, created: justNow, holdsNothing: true, now: now)
        s.settle(accountIsNew: true, progress: SetupProgress())
        s.advance(connected: false)
        s.attach(account: nil, created: nil, holdsNothing: false, now: now)
        #expect(s.phase == .off)
        s.attach(account: b, created: now.addingTimeInterval(-90 * 86_400), holdsNothing: false, now: now)
        #expect(s.phase == .off)
        #expect(!s.covers(b), "the account that's signed in now has nothing to resume")
    }

    // MARK: Help › Show Setup Guide

    @Test func replayStartsAtTheNameAndSavesNothing() {
        let defaults = TestDefaults()
        let account = UUID()
        let s = store(defaults)
        s.attach(account: account, created: now.addingTimeInterval(-90 * 86_400), holdsNothing: false, now: now)
        s.startReplay()
        #expect(s.phase == .showing(.name))
        #expect(s.replay)
        s.advance(connected: true)
        #expect(defaults.string(forKey: Onboarding.savedKey(account)) == nil, "quitting during a replay doesn't bring it back")
        s.finish(landing: nil)
        #expect(!s.endedThisLaunch, "a replay holds no ask back")
        #expect(!s.replay)
    }

    @Test func replayDoesNothingWhileTheFlowIsAlreadyUp() {
        let s = store()
        s.attach(account: UUID(), created: justNow, holdsNothing: true, now: now)
        s.settle(accountIsNew: true, progress: SetupProgress())
        s.advance(connected: false)
        s.startReplay()
        #expect(s.step == .bring)
        #expect(!s.replay)
    }

    // MARK: The trial note

    private func library() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        _ = c.mainContext.createFolder(named: "Notes")
        return c
    }

    @Test func theTrialNoteIsMadeOnceUnderANameNoImportHas() throws {
        let c = try library(), defaults = TestDefaults(), account = UUID()
        let made = try #require(c.mainContext.trialNote(account: account, defaults: defaults))
        #expect(made.title == "My first AI note")
        #expect(made.body == TrialNote.body)
        #expect(Onboarding.prompt.contains("my note called My first AI note"), "the prompt names it exactly")
        let again = try #require(c.mainContext.trialNote(account: account, defaults: defaults))
        #expect(again.id == made.id, "a replay reuses the one the flow made")
    }

    @Test func anImportedToDoNoteIsLeftAlone() throws {
        let c = try library(), defaults = TestDefaults(), account = UUID()
        let imported = c.mainContext.createNote(in: .all, body: "To-do\n\n- [ ] Buy milk\n")
        let trial = try #require(c.mainContext.trialNote(account: account, defaults: defaults))
        #expect(trial.id != imported.id)
        #expect(imported.body == "To-do\n\n- [ ] Buy milk\n")
        c.mainContext.settleTrialNote(account: account, defaults: defaults)
        #expect(imported.deletedAt == nil && imported.trashedAt == nil, "never removed, never moved")
    }

    @Test func untouchedItIsRemovedForGoodWhenTheFlowEnds() throws {
        let c = try library(), defaults = TestDefaults(), account = UUID()
        let trial = try #require(c.mainContext.trialNote(account: account, defaults: defaults))
        #expect(c.mainContext.settleTrialNote(account: account, defaults: defaults) == nil, "skipped: nowhere to land but a new note")
        #expect(trial.deletedAt != nil && trial.trashedAt == nil, "deleted for good, not to Recently Deleted")
        #expect(defaults.string(forKey: TrialNote.key(account)) == nil)
    }

    @Test func writtenInItStaysAndIsWhereTheNotesOpen() throws {
        let c = try library(), defaults = TestDefaults(), account = UUID()
        let trial = try #require(c.mainContext.trialNote(account: account, defaults: defaults))
        trial.body = TrialNote.body + "- [ ] Call mom\n"
        let kept = try #require(c.mainContext.settleTrialNote(account: account, defaults: defaults))
        #expect(kept.id == trial.id && trial.deletedAt == nil)
    }

    @Test func aTrialNoteThisDeviceDidNotMakeIsNeverRemoved() throws {
        let c = try library(), account = UUID()
        // Made by the flow on another device, synced here; a replay on this one.
        let theirs = c.mainContext.createNote(in: .all, body: TrialNote.body)
        let here = TestDefaults()
        #expect(c.mainContext.trialNote(account: account, defaults: here)?.id == theirs.id, "shown and watched, not doubled")
        #expect(c.mainContext.settleTrialNote(account: account, defaults: here) == nil)
        #expect(theirs.deletedAt == nil, "this device did not make it")
    }

    // MARK: Try it

    @Test func oneClickForChatGPTAndClaudeThePromptToPasteForTheRest() {
        #expect(TryIt.ways(connected: ["ChatGPT"]) == [.ask(ai: "ChatGPT")])
        #expect(TryIt.ways(connected: ["Claude"]) == [.ask(ai: "Claude")])
        #expect(TryIt.ways(connected: ["Claude", "ChatGPT"]) == [.ask(ai: "ChatGPT"), .ask(ai: "Claude")])
        #expect(TryIt.ways(connected: ["Claude Code"]) == [.paste], "no link reaches a terminal")
        #expect(TryIt.ways(connected: ["Codex", "Another AI"]) == [.paste])
        #expect(TryIt.ways(connected: ["ChatGPT", "Claude Code"]) == [.ask(ai: "ChatGPT"), .paste])
        #expect(TryIt.ways(connected: []) == [.paste], "before what is connected is known, the prompt is still there")
    }

    @Test func theLinkCarriesThePrompt() throws {
        let chatgpt = try #require(TryIt.page(for: "ChatGPT"))
        #expect(chatgpt.host == "chatgpt.com")
        #expect(URLComponents(url: chatgpt, resolvingAgainstBaseURL: false)?.queryItems == [URLQueryItem(name: "q", value: Onboarding.prompt)])
        let claude = try #require(TryIt.page(for: "Claude"))
        #expect(claude.host == "claude.ai" && claude.path == "/new")
        #expect(URLComponents(url: claude, resolvingAgainstBaseURL: false)?.queryItems?.first?.value == Onboarding.prompt)
        #expect(TryIt.page(for: "Claude Code") == nil)
        #expect(TryIt.askTitle("ChatGPT") == "Ask ChatGPT")
    }

    /// What each AI does with a prompt that arrives by link, said as it is.
    @Test func afterAskingSaysWhatTheAIDoes() {
        #expect(TryIt.afterAsking("ChatGPT").hasPrefix("ChatGPT has the message."))
        #expect(TryIt.afterAsking("Claude").hasPrefix("Press send in Claude, under its caution note."))
        #expect(TryIt.afterAsking(nil).hasPrefix("Paste it into your AI"))
        #expect(TryIt.claudeNote.contains("caution note"))
    }

    @Test func theStepKnowsWhenTheAIsLineIsIn() {
        let start = TrialNote.body
        #expect(!TryIt.arrived(body: start, since: start, aiEdits: 0, editsAtStart: 0))
        #expect(!TryIt.arrived(body: start + "\n\n", since: start, aiEdits: 0, editsAtStart: 0), "white space is not an edit")
        #expect(TryIt.arrived(body: start + "- [ ] Call mom\n", since: start, aiEdits: 0, editsAtStart: 0))
        #expect(TryIt.arrived(body: start, since: start, aiEdits: 1, editsAtStart: 0), "the server counted an AI's edit")
        // A replay on an account whose AI has edited before: only a new edit counts.
        #expect(!TryIt.arrived(body: "To-do\n\n- [ ] Buy milk", since: "To-do\n\n- [ ] Buy milk", aiEdits: 7, editsAtStart: 7))
    }

    @Test func theNoteIsDrawnAsItsLinesWithTheNewOneMarked() {
        let start = "To-do\n\n- [x] Buy milk\n"
        let lines = TryIt.lines(of: "To-do\n\n- [x] Buy milk\n- [ ] Call mom\n* a bullet\nplain words", since: start)
        #expect(lines.map(\.kind) == [.title, .todo(done: true), .todo(done: false), .bullet, .text])
        #expect(lines.map(\.text) == ["To-do", "Buy milk", "Call mom", "a bullet", "plain words"])
        #expect(lines.map(\.fresh) == [false, false, true, true, true])
        #expect(TryIt.lines(of: TrialNote.body, since: TrialNote.body).map(\.text) == ["My first AI note", "Connect my AI"])
        #expect(TryIt.lines(of: TrialNote.body + "- [ ] Call mom", since: TrialNote.body).last == TryIt.Line(id: 2, kind: .todo(done: false), text: "Call mom", fresh: true))
        #expect(TryIt.lines(of: "# To-do\n" + (1...20).map { "- item \($0)" }.joined(separator: "\n")).count == 6, "a long note shows its first lines")
        #expect(TryIt.lines(of: "# To-do").first?.text == "To-do")
    }

    @Test func aStuckTryItSaysWhatToCheck() {
        #expect(TryIt.lateAfter >= 120 && TryIt.lateAfter <= 180)
        #expect(TryIt.late.contains("Check that your AI answered"))
    }

    // MARK: Connecting from a terminal

    @Test func aRootAddressSignsInThroughTheBrowserAndCarriesNoSecret() {
        let server = "https://mcp.pintonotes.com"
        #expect(TerminalConnect.way(server: server) == .signIn)
        let claude = TerminalConnect.command(.claudeCode, server: server, way: .signIn)
        #expect(claude == "claude mcp add --scope user --transport http pinto-notes https://mcp.pintonotes.com && claude mcp login pinto-notes")
        let codex = TerminalConnect.command(.codex, server: server, way: .signIn)
        #expect(codex == "codex mcp add pinto-notes --url https://mcp.pintonotes.com")
        for c in [claude, codex] { #expect(!c.contains("Bearer") && !c.contains("pane_")) }
    }

    /// A function's own address (staging, a local stack): Claude Code asks the host, not the
    /// function, where to register, and gets a 404. There the command carries a token.
    @Test func anAddressWithAPathCarriesATokenMadeByCopy() {
        let server = "https://example.supabase.co/functions/v1/mcp"
        #expect(TerminalConnect.way(server: server) == .token)
        #expect(TerminalConnect.way(server: "http://127.0.0.1:54321/functions/v1/mcp") == .token)
        let before = TerminalConnect.command(.claudeCode, server: server, way: .token)
        #expect(before.contains("Bearer \(TerminalConnect.hidden)"), "dots until Copy makes the token")
        #expect(TerminalConnect.command(.claudeCode, server: server, way: .token, token: "pane_abc").contains("Bearer pane_abc"))
        #expect(TerminalConnect.command(.codex, server: server, way: .token, token: "pane_abc").contains("[mcp_servers.pinto_notes]"))
    }

    @Test func theStepsUseNoJargon() {
        for guide in [ConnectAISection.Guide.claudeCode, .codex, .other] {
            for way in [TerminalConnect.Way.signIn, .token] {
                let steps = TerminalConnect.steps(guide, way: way)
                #expect(steps.count == 3)
                for s in steps + [TerminalConnect.intro(guide)] {
                    for word in ["access token", "request header", "OAuth", "Bearer"] { #expect(!s.contains(word), "\(s)") }
                }
            }
        }
        #expect(TerminalConnect.steps(.claudeCode, way: .signIn).first == "Copy this command")
    }

    @Test func theGuideKnowsWhenItsConnectionIsThere() {
        let opened = Date.now
        func row(kind: String, name: String, host: String?, used: Date?, at: Date) -> Connection {
            Connection(id: UUID(), name: name, kind: kind, can_write: true, created_at: at, last_used_at: used, revoked_at: nil, redirect_host: host)
        }
        // Signing in: a new sign-in from this computer. An older one, or ChatGPT's, is not it.
        #expect(!TerminalConnect.isConnected([row(kind: "oauth", name: "x", host: "localhost", used: nil, at: opened.addingTimeInterval(-600))], guide: .claudeCode, way: .signIn, since: opened))
        #expect(!TerminalConnect.isConnected([row(kind: "oauth", name: "ChatGPT", host: "chatgpt.com", used: nil, at: opened.addingTimeInterval(5))], guide: .claudeCode, way: .signIn, since: opened))
        #expect(TerminalConnect.isConnected([row(kind: "oauth", name: "x", host: "127.0.0.1", used: nil, at: opened.addingTimeInterval(5))], guide: .claudeCode, way: .signIn, since: opened))
        // A token: made by Copy, connected at its first call.
        #expect(!TerminalConnect.isConnected([row(kind: "token", name: "Claude Code", host: nil, used: nil, at: opened.addingTimeInterval(3))], guide: .claudeCode, way: .token, since: opened))
        #expect(TerminalConnect.isConnected([row(kind: "token", name: "Claude Code", host: nil, used: .now, at: opened.addingTimeInterval(3))], guide: .claudeCode, way: .token, since: opened))
    }

    // MARK: Words

    @Test func everyStepSaysWhatItIsInPlainWords() {
        for step in Onboarding.Step.allCases {
            let words = [OnboardingFlow.title(step), OnboardingFlow.line(step)]
            for w in words {
                #expect(!w.isEmpty)
                #expect(!w.contains("\u{2014}") && !w.contains("\u{2013}"), "no dashes: \(w)")
            }
        }
        #expect(OnboardingFlow.line(.connect) == "Your AI can then read and write your notes when you ask it to.")
        #expect(OnboardingFlow.skipBring.lowercased() != AccountCrypto.startFreshPhrase, "not the account's destructive action")
    }

    @Test func appleNotesComesFirstThenTheImportSheetsKinds() {
        #expect(OnboardingFlow.sourceOrder == ImportKind.allCases, "the import sheet's own order")
        #if os(iOS)
        // On iPhone Apple Notes is not a choice like the others: it says where it is easy.
        #expect(OnboardingFlow.appleNotesLine.hasPrefix("Easiest on a Mac."))
        #expect(OnboardingFlow.macDownload.absoluteString == "https://pintonotes.com/download")
        #endif
        #expect(Set(OnboardingFlow.sourceOrder) == Set(ImportKind.allCases), "every kind the import sheet knows is offered")
        #expect(OnboardingFlow.sourceOrder.count == ImportKind.allCases.count)
    }

    /// Connect an AI is one design: what a choice says is what happens, in plain words. Commands,
    /// file paths and menu trails belong in the guide it opens.
    @Test func connectChoicesSayWhatHappensInPlainWords() {
        for g in ConnectAISection.Guide.allCases {
            let words = g.plain
            #expect(!words.isEmpty)
            for raw in ["→", "~/", ".toml", "mcp add", "Plugins", "Directory", "Amber", "MCP", "address", "token", "header"] {
                #expect(!words.contains(raw), "\(g.title): \(words)")
            }
            #expect(!words.hasSuffix("."))
        }
        #expect(ConnectAISection.Guide.incredible.plain.contains("Incredible"))
        #expect(ConnectAISheet.title == "Connect an AI", "not just \u{201C}AI\u{201D}")
        #expect(ConnectChoices.reassurance == "You approve each AI, and every change can be undone.")
        #expect(OnboardingFlow.line(.connect) == ConnectChoices.why, "the flow and the sheet give the same reason")
    }

    @Test func aConnectionSaysWhatItCanDoWithoutJargon() {
        let c = OnboardingSnapshots.twoConnected
        #expect(ConnectChoices.detail(c[0]).hasPrefix("chatgpt.com · Can read and edit · Used"))
        #expect(ConnectChoices.detail(c[1]) == "Can read only · Not used yet")
    }

    @Test func everyWayToConnectHasItsGuide() {
        #expect(OnboardingFlow.guides.map(\.title) == ["ChatGPT", "Claude", "Claude Code", "Codex", "Another AI"])
    }
}
