#if os(macOS)
import Foundation
import Testing
@testable import Pane

/// The Mac's first run, the Spotlight panel (`FirstRun`): every step finishes only when what it
/// asks for has happened, Skip for now never counts as done, Return picks the step's one primary
/// row, and the panel counts "2 of 4". Emil, 29 October 2026: he ticked all three welcome to-dos
/// in four seconds without doing any of them, and the panel was "a bit confusing".
@MainActor @Suite struct FirstRunTests {
    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    /// A new account's panel, on `step`.
    private func panel(at step: Onboarding.Step = .bring) -> FirstRunModel {
        let store = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
        store.attach(account: UUID(), created: now.addingTimeInterval(-30), holdsNothing: true, now: now)
        store.settle(accountIsNew: true, progress: SetupProgress())
        if step != .bring { store.go(to: step) }
        let model = FirstRunModel(store: store)
        model.signedIn()
        model.follow(store.step)
        return model
    }

    // MARK: The count

    @Test func everyStepSaysWhereItIsOfFour() {
        let signedOut = FirstRunModel(store: OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps))
        #expect(signedOut.count == "1 of 4")
        #expect(panel(at: .bring).count == "2 of 4")
        #expect(panel(at: .connect).count == "3 of 4")
        #expect(panel(at: .tryIt).count == "4 of 4")
        // A page under a step keeps the step's count.
        let p = panel()
        p.go(.otherApps)
        #expect(p.count == "2 of 4")
    }

    // MARK: Return and Esc

    /// Return does the step's one primary row, the first, until the arrows move the pick.
    @Test func returnPicksThePrimaryRow() {
        let signIn = FirstRunModel(store: OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps))
        #expect(signIn.returnPressed() == .signIn(.apple))
        let notes = panel()
        #expect(notes.returnPressed() == .importAppleNotes)
        notes.move(1)
        #expect(notes.returnPressed() == .otherApps, "the arrows move what Return does")
        notes.move(1)
        #expect(notes.returnPressed() == .importAppleNotes, "and wrap around")
        #expect(panel(at: .connect).returnPressed() == .connect(.chatgpt))
    }

    /// Each step has exactly one way past, labelled Skip for now; it is never one of the rows.
    /// Recording the first run, 29 October: the pointer rested where Allow had been, the next
    /// step's third row came up under it, and hovering made that row Return's pick.
    @Test func aRestingPointerDoesNotChangeThePick() {
        let resting = CGPoint(x: 779, y: 457)
        #expect(!FirstRun.hoverPicks(restingAt: resting, here: resting), "the rows came up under a still pointer")
        #expect(FirstRun.hoverPicks(restingAt: resting, here: CGPoint(x: 790, y: 440)), "the pointer moved onto the row")
        #expect(FirstRun.hoverPicks(restingAt: nil, here: resting), "once it has moved, hovering picks")
    }

    /// The browser way (allowed on pintonotes.com/connect, no Allow sheet) is the usual one, so
    /// "Pinto noticed" comes from the connection itself.
    @Test func pintoNoticesAConnectionWithoutTheAllowSheet() {
        let model = panel(at: .connect)
        let before = model.connected
        model.connecting(.chatgpt, line: "Waiting for ChatGPT")
        model.connected(.chatgpt)
        #expect(FirstRun.noticed(before: before, after: model.connected) == .chatgpt)
        let again = model.connected
        model.connected(.chatgpt)
        #expect(FirstRun.noticed(before: again, after: model.connected) == nil, "said once")
        model.connected(.claude)
        #expect(FirstRun.noticed(before: again, after: model.connected) == .claude)
    }

    @Test func skipIsTheWayOutNeverARow() {
        for step in [Onboarding.Step.bring, .connect, .tryIt] {
            let p = panel(at: step)
            #expect(p.canSkip)
            #expect(!p.rows.contains { $0.title.localizedCaseInsensitiveContains("not now") || $0.title.localizedCaseInsensitiveContains("skip") })
        }
        #expect(FirstRun.skip == "Skip for now")
        let signIn = FirstRunModel(store: OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps))
        #expect(!signIn.canSkip, "signing in has no way past")
        #expect(!signIn.skip())
    }

    // MARK: Your notes

    @Test func theNotesStepIsNotDoneUntilAnImportBringsNotesIn() {
        let p = panel()
        p.appleNotesReading()
        #expect(p.outcome(.notes) == nil)
        p.importStarted(from: "Apple Notes", total: 40)
        #expect(p.step == .ai, "the panel goes on while the import runs behind it")
        #expect(p.outcome(.notes) == nil, "but the step isn't done yet")
        p.importProgress(done: 12, total: 40)
        #expect(p.statusLine == "Importing from Apple Notes \u{00B7} 12 of 40")
        p.importFinished(count: 0)
        #expect(p.outcome(.notes) == nil, "an import that brought nothing doesn't finish it")
        #expect(!p.done.contains(.notes))
    }

    @Test func notesBroughtInFinishTheStep() {
        let p = panel()
        p.importStarted(from: "Apple Notes", total: 40)
        p.importFinished(count: 38, line: "Imported 38 notes")
        #expect(p.outcome(.notes) == .done)
        #expect(p.statusLine == "Imported 38 notes")
    }

    /// Another app's import sheet: the step waits on it, and moves on only once notes came in.
    @Test func anotherAppsImportFinishesTheStepWhenItBringsNotes() {
        let p = panel()
        p.go(.otherApps)
        p.importFinished(count: 0)
        #expect(p.step == .notes && p.outcome(.notes) == nil)
        p.importFinished(count: 12)
        #expect(p.outcome(.notes) == .done)
        #expect(p.step == .ai)
    }

    @Test func skippingTheNotesNeverMarksThemDone() {
        let p = panel()
        p.skip()
        #expect(p.outcome(.notes) == .skipped)
        #expect(!p.done.contains(.notes))
        #expect(p.statusLine == nil, "no line says notes came in")
        #expect(p.step == .ai)
    }

    @Test func aRefusedAppleNotesSaysHowToAllowIt() {
        let p = panel()
        p.appleNotesDenied()
        #expect(p.page == .notesDenied)
        #expect(p.returnPressed() == .openPrivacy)
        #expect(p.outcome(.notes) == nil)
        p.back()
        #expect(p.page == .notes)
    }

    // MARK: Your AI

    @Test func theAIStepIsNotDoneUntilAnAIIsConnected() {
        let p = panel(at: .connect)
        #expect(!p.rows.contains { $0.action == .proceed }, "no Continue before an AI is connected")
        p.connecting(.claude, line: "Waiting for Claude\u{2026}")
        #expect(p.outcome(.ai) == nil, "pressing Connect isn't connecting")
        p.proceed()
        #expect(p.step == .ai, "Continue does nothing with nothing connected")
        p.connected(.claude)
        #expect(p.outcome(.ai) == .done)
        #expect(p.question == "Claude is connected. Anything else?")
        #expect(p.returnPressed() == .proceed, "Continue is now the primary row")
        p.proceed()
        #expect(p.step == .tryIt)
    }

    @Test func skippingTheAIEndsInANewNoteAndIsNotDone() {
        let p = panel(at: .connect)
        p.skip()
        #expect(p.outcome(.ai) == .skipped)
        #expect(!p.done.contains(.ai))
        #expect(p.landing == .some(.newNote), "nothing to try without an AI: the notes, on a new note")
    }

    /// App Review 5.1.1 and 5.1.2: on the AI step what is sent, and to which company, is on the
    /// panel itself, never behind a disclosure.
    @Test func theAIStepSaysWhatIsSentAndToWhom() throws {
        let p = panel(at: .connect)
        let words = try #require(p.disclosure)
        #expect(words.contains("OpenAI") && words.contains("Anthropic"))
        #expect(words.contains("sent"))
        #expect(words.contains("until you allow it"))
        p.go(.terminal)
        #expect(p.disclosure != nil)
        #expect(panel().disclosure == nil)
    }

    // MARK: Try it

    @Test func tryItIsDoneOnlyWhenTheAIsNoteArrives() {
        let p = panel(at: .connect)
        p.connected(.chatgpt)
        p.proceed()
        #expect(p.question == "Ask ChatGPT to write your first note?")
        guard case .ask(.chatgpt) = p.returnPressed() else { Issue.record("Return asks ChatGPT"); return }
        p.asking(.chatgpt)
        #expect(p.outcome(.tryIt) == nil)
        #expect(p.landing == nil)
        let note = UUID()
        p.noteArrived(note)
        #expect(p.outcome(.tryIt) == .done)
        #expect(p.landing == .some(.note(note)), "the panel lands on the note the AI wrote")
    }

    @Test func skippingTryItLandsOnANewNote() {
        let p = panel(at: .connect)
        p.connected(.chatgpt)
        p.proceed()
        p.skip()
        #expect(p.outcome(.tryIt) == .skipped)
        #expect(p.landing == .some(.newNote))
    }

    @Test func theNoteTheAIWroteIsTheNewestAIEditSinceTheAsk() {
        let since = now
        let old = UUID(), mine = UUID(), newer = UUID(), byYou = UUID()
        let entries: [UUID: AIEditStore.Entry] = [
            old: .init(editor: "ChatGPT", editedAt: since.addingTimeInterval(-60)),
            mine: .init(editor: "ChatGPT", editedAt: since.addingTimeInterval(5)),
            newer: .init(editor: "ChatGPT", editedAt: since.addingTimeInterval(9)),
            byYou: .init(editor: nil, editedAt: since.addingTimeInterval(20)),
        ]
        #expect(FirstRun.written(entries, since: since) == newer)
        #expect(FirstRun.written([old: entries[old]!], since: since) == nil, "an edit from before the ask doesn't count")
    }

    // MARK: Who sees it

    @Test func aNewAccountGetsThePanelAtItsNotes() {
        let store = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
        let account = UUID()
        store.attach(account: account, created: now.addingTimeInterval(-30), holdsNothing: true, now: now)
        #expect(AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { true }, keyGate: false, armed: false, covers: store.covers(account)))
        store.settle(accountIsNew: true, progress: SetupProgress(), nameKnown: false)
        #expect(store.phase == .showing(.bring), "no name step on the Mac: the sign-in brought it")
        #expect(AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { false }, keyGate: false, armed: false, covers: store.covers(account)))
    }

    /// Recording the first run, 29 October: the panel landed on the new note, and the window
    /// built the app again from scratch (another branch of the gate), the sidebar slid under the
    /// title bar. The app is one view from the panel to the notes.
    @Test func theAppIsTheSameViewWhenThePanelEnds() {
        let signedIn = Backend.State.signedIn(email: "a@b.c")
        #expect(AppGate.appShown(state: signedIn, firstRun: true, keyGate: false, onboarding: true), "the panel's steps, over the app")
        #expect(AppGate.appShown(state: signedIn, firstRun: false, keyGate: false, onboarding: false), "and after it, the same app")
        #expect(AppGate.appShown(state: .signedOut, firstRun: true, keyGate: false, onboarding: false), "signing in from the panel")
        #expect(!AppGate.appShown(state: .signedOut, firstRun: false, keyGate: false, onboarding: false), "the welcome card")
        #expect(!AppGate.appShown(state: signedIn, firstRun: false, keyGate: true, onboarding: false), "a key that needs you")
    }

    @Test func anOnboardedAccountNeverGetsIt() {
        let store = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
        let account = UUID()
        // Set up before (on another device, or here).
        store.attach(account: account, created: now.addingTimeInterval(-30), holdsNothing: true, now: now)
        store.settle(accountIsNew: true, progress: SetupProgress(dismissed: true))
        #expect(store.phase == .off)
        #expect(!AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { false }, keyGate: false, armed: false, covers: store.covers(account)))
        // An account from before: never even waited on.
        let older = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
        let other = UUID()
        older.attach(account: other, created: now.addingTimeInterval(-3 * 86400), holdsNothing: true, now: now)
        #expect(!older.covers(other))
        #expect(!AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { true }, keyGate: false, armed: false, covers: older.covers(other)))
    }

    @Test func signedOutThePanelShowsOnlyOnAMacThatHoldsNothing() {
        #expect(AppGate.firstRunShown(state: .signedOut, holdsNothing: { true }, keyGate: false, armed: false, covers: false))
        #expect(!AppGate.firstRunShown(state: .signedOut, holdsNothing: { false }, keyGate: false, armed: false, covers: false),
                "a Mac that held an account's notes signs in on the welcome's card")
        #expect(!AppGate.firstRunShown(state: .disabled, holdsNothing: { true }, keyGate: false, armed: false, covers: false))
    }

    /// A key that needs you (another device, the recovery key) takes the window from the panel.
    @Test func aKeyThatNeedsYouTakesTheWindow() {
        #expect(AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { true }, keyGate: false, armed: true, covers: false))
        #expect(!AppGate.firstRunShown(state: .signedIn(email: "a@b.c"), holdsNothing: { true }, keyGate: true, armed: true, covers: true))
    }

    @Test func aReplayStartsAtYourNotes() {
        let store = OnboardingStore(defaults: TestDefaults(), steps: FirstRun.storeSteps)
        store.attach(account: UUID(), created: now.addingTimeInterval(-9 * 86400), holdsNothing: false, now: now)
        store.startReplay()
        #expect(store.phase == .showing(.bring))
        let p = FirstRunModel(store: store)
        p.reset(signedIn: true)
        p.follow(store.step)
        #expect(p.count == "2 of 4")
    }

    /// A step the card flow saved at its name resumes in the panel at your notes.
    @Test func aNameStepSavedByTheCardFlowResumesAtYourNotes() {
        let defaults = TestDefaults()
        let account = UUID()
        defaults.set("name", forKey: Onboarding.savedKey(account))
        let store = OnboardingStore(defaults: defaults, steps: FirstRun.storeSteps)
        store.attach(account: account, created: now.addingTimeInterval(-60), holdsNothing: false, now: now)
        #expect(store.phase == .showing(.bring))
    }
}
#endif
