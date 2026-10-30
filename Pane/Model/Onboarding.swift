import Foundation
import Observation
import SwiftData

/// The first-run flow: your name, bring your notes, connect your AI, then the notes with the
/// first useful thing ready. It starts at the first step that does something: the welcome before
/// sign-in already said what the app is, and a name this device already knows is not asked again. It fills the window once, right after an account's first
/// sign-up, and never again: not for an account that already holds anything, not on a second
/// device, not after it was finished or skipped. Help › Show Setup Guide plays it again.
///
/// Who sees it is decided from two facts. The account was made within the last day and this
/// device holds nothing of it (both known the moment you sign in), and then its first sync brings
/// nothing either (`SyncEngine.claimNewAccount`): an account that has never held anything. Until
/// that sync answers, the window waits on the welcome's picture instead of flashing empty notes.
/// The step you are on is kept on this device, per account, so quitting midway resumes there.
/// Finishing marks the account's setup as dismissed on the server, which is what keeps older
/// versions of the app on your other devices from showing their setup card.
enum Onboarding {
    enum Step: String, CaseIterable, Sendable {
        case name, bring, connect, tryIt

        /// The step as the onboarding funnel names it (`onboarding_step`).
        var funnel: OnboardingStep {
            switch self {
            case .name: .name
            case .bring: .bring
            case .connect: .connect
            case .tryIt: .tryIt
            }
        }

        /// The steps that count in "Step 2 of 3", from the one the flow began at: Try it only
        /// exists once an AI is connected.
        static func counted(from first: Step) -> [Step] {
            Array([Step.name, .bring, .connect].drop { $0 != first })
        }

        /// A step saved by a version that still had a welcome after sign-in resumes at the name.
        init?(saved raw: String) {
            if raw == "welcome" { self = .name } else { self.init(rawValue: raw) }
        }
    }

    enum Segment: Equatable { case done, current, ahead }

    /// The progress bar's segments on `step`: full only for the steps behind you, so the bar is
    /// never full while a step is still to do. Try it, after the last counted step, fills them all.
    static func segments(on step: Step, first: Step) -> [Segment] {
        let steps = Step.counted(from: first)
        guard let at = steps.firstIndex(of: step) else { return steps.map { _ in .done } }
        return steps.indices.map { $0 < at ? .done : $0 == at ? .current : .ahead }
    }

    /// Where the flow begins: the name, unless one is known already (from Apple or Google, or the
    /// account this device had before), then bringing your notes.
    static func first(nameKnown: Bool) -> Step { nameKnown ? .bring : .name }

    /// Where the notes open when the flow ends.
    enum Landing: Equatable, Sendable {
        /// A new, empty note with the cursor in it.
        case newNote
        /// The To-do note the prompt on the last step writes to.
        case note(UUID)
    }

    /// An account older than this is never shown the flow, whatever it holds.
    static let newAccountWindow: TimeInterval = 24 * 60 * 60

    /// What the last step asks your AI: a tick item in the note the flow made for it, by name.
    static let prompt = TrialNote.prompt

    /// Might this be a brand-new account? Known at sign-in, before any sync.
    static func isCandidate(created: Date?, holdsNothing: Bool, now: Date = .now) -> Bool {
        guard let created, holdsNothing else { return false }
        return now.timeIntervalSince(created) < newAccountWindow
    }

    /// Setup that is already over, or under way, on the server: an account like that is not new.
    static func alreadySetUp(_ progress: SetupProgress?) -> Bool {
        guard let progress else { return false }
        return progress.dismissed || progress.celebrated || progress.imported || progress.connected || progress.aiEdits > 0
    }

    /// The step after `step`. nil: the flow is over.
    static func next(after step: Step, connected: Bool) -> Step? {
        switch step {
        case .name: .bring
        case .bring: .connect
        case .connect: connected ? .tryIt : nil
        case .tryIt: nil
        }
    }

    /// The step before `step`. nil on `first`, the step the flow began at.
    static func previous(before step: Step, first: Step = .name) -> Step? {
        guard step != first else { return nil }
        return switch step {
        case .name: nil
        case .bring: .name
        case .connect: .bring
        case .tryIt: .connect
        }
    }

    static func savedKey(_ account: UUID) -> String { "onboarding.step.\(account.uuidString.lowercased())" }
    static func firstKey(_ account: UUID) -> String { "onboarding.first.\(account.uuidString.lowercased())" }
    static func endedKey(_ account: UUID) -> String { "onboarding.ended.\(account.uuidString.lowercased())" }

    /// No ask ("How did you hear…", "Enjoying Pinto Notes?") for this long after the flow ends,
    /// however many times the app is opened in between.
    static let quietAfter: TimeInterval = 24 * 60 * 60
}

@MainActor
@Observable
final class OnboardingStore {
    enum Phase: Equatable {
        /// Nothing to show: the notes.
        case off
        /// Possibly a new account; its first sync hasn't said yet.
        case waiting
        case showing(Onboarding.Step)
    }

    private(set) var phase: Phase = .off
    /// The step the flow began at: Back stops there, and the progress counts from it.
    private(set) var first: Onboarding.Step = .name
    /// Played again from Help › Show Setup Guide: nothing is saved or marked.
    private(set) var replay = false
    /// Where the notes open once the flow has ended. The notes window takes it (`takeLanding`).
    private(set) var landing: Onboarding.Landing?
    /// The flow ended during this launch: no ask or tip follows it.
    private(set) var endedThisLaunch = false

    /// The flow is up, or ended less than a day ago on this device: nothing else asks for attention.
    func holdsAsks(now: Date = .now) -> Bool {
        if active || endedThisLaunch { return true }
        guard let account, let ended = defaults.object(forKey: Onboarding.endedKey(account)) as? Date else { return false }
        return now.timeIntervalSince(ended) < Onboarding.quietAfter
    }

    @ObservationIgnored private var account: UUID?
    /// The wait for the first sync ran out during this launch.
    @ObservationIgnored private var waitedOut = false
    @ObservationIgnored private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    /// For screenshots and previews only.
    func showForPreview(_ step: Onboarding.Step, first: Onboarding.Step = .name, replay: Bool = false) {
        phase = .showing(step)
        self.first = first
        self.replay = replay
    }

    var step: Onboarding.Step? {
        if case .showing(let step) = phase { return step }
        return nil
    }

    /// The flow, or the wait before it, has the window.
    var active: Bool { phase != .off }

    /// Does the window belong to the flow for `account`? Asked by the gate on every draw, so a
    /// launch that resumes midway never shows the notes first: before `attach` has run for this
    /// account, the saved step answers.
    func covers(_ account: UUID?) -> Bool {
        guard let account else { return false }
        if account == self.account { return active }
        return saved(account) != nil
    }

    /// Signed in (or out, with nil): resumes a flow that was quit midway, waits on an account
    /// that may be new, and leaves every other account alone.
    func attach(account: UUID?, created: Date?, holdsNothing: Bool, now: Date = .now) {
        guard account != self.account else { return }
        self.account = account
        replay = false
        landing = nil
        endedThisLaunch = false
        waitedOut = false
        first = .name
        guard let account else { phase = .off; return }
        if let step = saved(account) {
            first = defaults.string(forKey: Onboarding.firstKey(account)).flatMap(Onboarding.Step.init(rawValue:)) ?? .name
            phase = .showing(step)
            // A flow quit midway is shown again where it was.
            record(step.funnel, .shown)
        } else if Onboarding.isCandidate(created: created, holdsNothing: holdsNothing, now: now) {
            phase = .waiting
        } else {
            phase = .off
        }
    }

    /// The first sync has answered. A wait becomes the flow for an account that has never held
    /// anything and has no setup behind it; a resumed flow closes if setup was finished elsewhere.
    /// `nameKnown`: the account has its name already, so the flow starts past that step.
    func settle(accountIsNew: Bool, progress: SetupProgress?, nameKnown: Bool = false) {
        switch phase {
        case .waiting:
            if accountIsNew, !Onboarding.alreadySetUp(progress) { begin(nameKnown: nameKnown) } else { phase = .off }
        // The wait ran out before a slow first sync answered: the flow still comes, late.
        case .off where waitedOut:
            waitedOut = false
            if accountIsNew, !Onboarding.alreadySetUp(progress) { begin(nameKnown: nameKnown) }
        case .showing where !replay:
            if let progress, progress.dismissed || progress.celebrated { close() }
        default:
            break
        }
    }

    /// The first sync has not said yet (slow, offline, a server error): the notes open rather
    /// than keep the window shut. If the sync answers later in this launch the flow still starts
    /// (`settle`); otherwise the question stays open for the next launch.
    func giveUpWaiting() {
        if phase == .waiting {
            phase = .off
            waitedOut = true
        }
    }

    /// Moves to the next step. False when there is none: the caller ends the flow (`finish`).
    /// `skipped`: left by the quiet way past (Skip), not Continue.
    @discardableResult
    func advance(connected: Bool, skipped: Bool = false) -> Bool {
        guard let step else { return false }
        record(step.funnel, skipped ? .skipped : .continued)
        guard let next = Onboarding.next(after: step, connected: connected) else { return false }
        show(next)
        return true
    }

    func go(to step: Onboarding.Step) {
        guard phase != .off, phase != .waiting else { return }
        show(step)
    }

    func back() {
        guard let step, let previous = Onboarding.previous(before: step, first: first) else { return }
        record(step.funnel, .back)
        show(previous)
    }

    /// The flow is over: the notes open on `landing`.
    func finish(landing: Onboarding.Landing?) {
        self.landing = landing
        if phase != .off { record(.done, .shown) }
        close()
    }

    /// The notes window has opened what the flow left for it.
    func takeLanding() -> Onboarding.Landing? {
        defer { landing = nil }
        return landing
    }

    /// Help › Show Setup Guide: from the name, where it can be changed.
    func startReplay() {
        guard account != nil, phase == .off else { return }
        replay = true
        first = .name
        phase = .showing(.name)
    }

    private func begin(nameKnown: Bool) {
        first = Onboarding.first(nameKnown: nameKnown)
        if let account { defaults.set(first.rawValue, forKey: Onboarding.firstKey(account)) }
        show(first)
    }

    private func show(_ step: Onboarding.Step) {
        if self.step != step { record(step.funnel, .shown) }
        phase = .showing(step)
        if !replay, let account { defaults.set(step.rawValue, forKey: Onboarding.savedKey(account)) }
    }

    private func close() {
        if !replay, let account {
            defaults.removeObject(forKey: Onboarding.savedKey(account))
            defaults.removeObject(forKey: Onboarding.firstKey(account))
        }
        if !replay {
            endedThisLaunch = true
            if let account { defaults.set(Date.now, forKey: Onboarding.endedKey(account)) }
        }
        replay = false
        phase = .off
    }

    /// The onboarding funnel, for a new account's own flow only: a replay from Help isn't someone
    /// getting started.
    private func record(_ step: OnboardingStep, _ action: FunnelAction) {
        guard !replay else { return }
        Funnel.record(.onboardingStep(step, action))
    }

    private func saved(_ account: UUID) -> Onboarding.Step? {
        defaults.string(forKey: Onboarding.savedKey(account)).flatMap(Onboarding.Step.init(saved:))
    }
}

/// The flow's last step: one click hands the prompt to the AI, the To-do note is on the screen,
/// and the step ends by itself when the AI's line arrives.
///
/// What a link can do: `chatgpt.com/?q=` and `claude.ai/new?q=` both put the prompt in the box
/// and wait for send (Emil, signed in, 2026-10-30; ChatGPT sent it at once on 2026-10-11, signed
/// out), Claude under a caution note. Whether either company's Mac or iPhone app takes the text from
/// the link was not tested, so the prompt is always copied as well. Claude Code, Codex and other
/// MCP apps have no such link: the prompt is shown to paste.
enum TryIt {
    enum Way: Equatable, Identifiable {
        /// A button that opens the AI's site with the prompt in it.
        case ask(ai: String)
        /// The prompt to copy and paste.
        case paste

        var id: String {
            switch self {
            case .ask(let ai): ai
            case .paste: "paste"
            }
        }
    }

    /// The AIs a link can hand the prompt to, in the order they are offered.
    static let askable = ["ChatGPT", "Claude"]

    /// How the prompt reaches the AI, by what is connected: a button for ChatGPT and for Claude
    /// when they are, and the prompt to paste when something else is (or nothing is known yet).
    static func ways(connected: Set<String>) -> [Way] {
        let asks = askable.filter(connected.contains).map { Way.ask(ai: $0) }
        let others = connected.subtracting(askable)
        if asks.isEmpty { return [.paste] }
        return others.isEmpty ? asks : asks + [.paste]
    }

    static func page(for ai: String, prompt: String = Onboarding.prompt) -> URL? {
        switch ai {
        case "ChatGPT": WebConnectPlan.prefilled("https://chatgpt.com/", prompt)
        case "Claude": WebConnectPlan.prefilled("https://claude.ai/new", prompt)
        default: nil
        }
    }

    static func askTitle(_ ai: String) -> String { "Ask \(ai)" }

    /// Under Claude's button, before it is pressed: what Claude will show.
    static let claudeNote = "Claude shows a caution note for prompts that arrive by link. Press send there."

    /// One calm line after the prompt was handed over.
    static func afterAsking(_ ai: String?, pasteInto: String? = nil) -> String {
        switch ai {
        case "ChatGPT": "Press send in ChatGPT. Its line appears here when it is done."
        case "Claude": "Press send in Claude, under its caution note. Its line appears here when it is done."
        default: "Paste it into \(pasteInto ?? "your AI") and send it. Its line appears here when it is done."
        }
    }

    /// The AI the prompt is pasted into, by name: Codex or Claude Code added on the step before
    /// ("Codex on Emil's MacBook Pro" is Codex). Nil when none of them is connected.
    static func pasteTarget(connected: Set<String>) -> String? {
        for ai in ["Codex", "Claude Code"] where connected.contains(where: { $0 == ai || $0.hasPrefix("\(ai) on ") }) { return ai }
        return nil
    }

    static let waiting = "Waiting for your AI\u{2026}"
    static let worked = "It worked"
    static let workedLine = "Your AI just wrote in your notes."

    /// After this long with nothing arriving, the step says what to check.
    static let lateAfter: TimeInterval = 150

    static let late = "Nothing has arrived yet. Check that your AI answered and that Pinto Notes is switched on in it, or give it the prompt again."

    /// The AI's line is in: the note is no longer what it was when the step began.
    static func arrived(body: String, since start: String, aiEdits: Int, editsAtStart: Int) -> Bool {
        if aiEdits > editsAtStart { return true }
        return normalized(body) != normalized(start)
    }

    private static func normalized(_ body: String) -> String { body.trimmingCharacters(in: .whitespacesAndNewlines) }

    /// One line of the note as the step draws it.
    struct Line: Equatable, Identifiable {
        enum Kind: Equatable { case title, todo(done: Bool), bullet, text }
        let id: Int
        let kind: Kind
        let text: String
        /// Not in the note when the step began: drawn the way the app tints what an AI added.
        var fresh = false
    }

    /// The note's first lines, checklists and bullets read as such; lines that were not there at
    /// the start are marked fresh.
    static func lines(of body: String, since start: String = "", limit: Int = 6) -> [Line] {
        let before = Set(start.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) })
        var out: [Line] = []
        for raw in body.split(separator: "\n", omittingEmptySubsequences: true) {
            let line = raw.trimmingCharacters(in: .whitespaces)
            guard !line.isEmpty, out.count < limit else { continue }
            let fresh = !out.isEmpty && !start.isEmpty && !before.contains(line)
            if out.isEmpty {
                out.append(Line(id: 0, kind: .title, text: line.replacingOccurrences(of: #"^#+\s*"#, with: "", options: .regularExpression)))
            } else if let m = line.firstMatch(of: /^[-*]\s+\[( |x|X)\]\s+(.*)$/) {
                out.append(Line(id: out.count, kind: .todo(done: m.1 != " "), text: String(m.2), fresh: fresh))
            } else if let m = line.firstMatch(of: /^[-*]\s+(.*)$/) {
                out.append(Line(id: out.count, kind: .bullet, text: String(m.1), fresh: fresh))
            } else {
                out.append(Line(id: out.count, kind: .text, text: line, fresh: fresh))
            }
        }
        return out
    }
}

extension Notification.Name {
    /// Help › Show Setup Guide (Settings on iPhone): the first-run flow, from the name.
    static let paneReplayOnboarding = Notification.Name("pane.replayOnboarding")
    /// Connect an AI: the File menu, the list's menu on iPhone and iPad, the sidebar's card.
    static let paneConnectAI = Notification.Name("pane.connectAI")
}

/// The note the Try it step has an AI write in. It has a title no imported note will have (an
/// imported "To-do" is somebody's real list), it is made by the flow and remembered by its id on
/// this device, and it goes again, for good, if the flow ends with nothing written in it.
enum TrialNote {
    static let title = "My first AI note"
    /// As the flow makes it: the title and one item already ticked, so the AI's arrives as a
    /// tick item under it.
    static let body = "My first AI note\n\n- [x] Connect my AI\n"
    static let prompt = "Add \"Call mom\" as a to-do in my note called My first AI note"

    static func key(_ account: UUID) -> String { "onboarding.trialNote.\(account.uuidString.lowercased())" }

    /// Nothing was written in it: its text is still exactly what the flow put there.
    static func untouched(_ body: String) -> Bool {
        body.trimmingCharacters(in: .whitespacesAndNewlines) == Self.body.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

extension ModelContext {
    private func live(_ note: Note) -> Bool { note.deletedAt == nil && note.trashedAt == nil }

    /// The trial note for the Try it step: the one this device's flow made if it is still there,
    /// else a note of that exact title the account already has (a replay on another device:
    /// shown and watched, never removed by this device), else a new one, remembered by its id.
    /// Call it only once the account's notes have come down.
    @MainActor
    func trialNote(account: UUID, defaults: UserDefaults = .standard) -> Note? {
        if let id = defaults.string(forKey: TrialNote.key(account)).flatMap(UUID.init(uuidString:)), let mine = note(id), live(mine) { return mine }
        let notes = (try? fetch(FetchDescriptor<Note>())) ?? []
        if let there = notes.first(where: { live($0) && $0.title == TrialNote.title }) { return there }
        let home = allFolders().first { $0.name == "Notes" && $0.parent == nil }
        let made = createNote(in: home.map { .folder($0.id) } ?? .all, body: TrialNote.body)
        defaults.set(made.id.uuidString, forKey: TrialNote.key(account))
        return made
    }

    /// The flow is over. The note this device's flow made stays if anything was written in it
    /// (returned, so the notes open on it); untouched, it is deleted for good, not to Recently
    /// Deleted. A note the flow did not make is never removed.
    @MainActor @discardableResult
    func settleTrialNote(account: UUID, defaults: UserDefaults = .standard) -> Note? {
        guard let id = defaults.string(forKey: TrialNote.key(account)).flatMap(UUID.init(uuidString:)) else {
            // Another device's (a replay here): land on it only if an AI wrote in it.
            let notes = (try? fetch(FetchDescriptor<Note>())) ?? []
            return notes.first { live($0) && $0.title == TrialNote.title && !TrialNote.untouched($0.body) }
        }
        guard let mine = note(id), live(mine) else { return nil }
        if TrialNote.untouched(mine.body) {
            purge(mine)
            defaults.removeObject(forKey: TrialNote.key(account))
            return nil
        }
        return mine
    }
}
