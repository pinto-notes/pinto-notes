#if os(macOS)
import Foundation
import Observation

/// The Mac's first run, "Spotlight" (round 5, Emil's pick, 29 October 2026: "just keep spotlight
/// as is. build it for real though"). The real app is in the window from the first second; one
/// panel over it asks one thing at a time, Return says yes, and the app fills up behind it as you
/// answer. It ends in the app, on a note.
///
/// Four questions, counted "1 of 4": sign in, bring your notes, connect your AI, try it. Each
/// one is finished only by what it asks for having happened (Emil, 29 October: he once ticked
/// all three welcome to-dos in four seconds without doing any of them):
/// - your notes, when an import has brought notes in;
/// - your AI, when an AI is connected, through its real Allow (or, for Claude Code and Codex,
///   their own command taking the access token);
/// - try it, when the note your AI wrote has arrived.
/// "Skip for now" (Esc) is always the way past and never counts as done.
///
/// Steps 2 to 4 are the onboarding store's (`Onboarding`, `OnboardingStore`): who sees them,
/// resuming after a quit and the funnel all stay as they were.
enum FirstRun {
    enum Step: Int, CaseIterable, Sendable {
        case signIn = 1, notes, ai, tryIt

        init(_ step: Onboarding.Step) {
            switch step {
            case .name, .bring: self = .notes
            case .connect: self = .ai
            case .tryIt: self = .tryIt
            }
        }
    }

    /// "2 of 4", in the panel's corner.
    static func count(_ step: Step) -> String { "\(step.rawValue) of \(Step.allCases.count)" }

    /// How a step ended. `.done` comes only from the real event; Skip for now is `.skipped`.
    enum Outcome: Equatable, Sendable { case done, skipped }

    /// The onboarding store's steps for the Mac: sign-in comes before the store, and the name
    /// comes from the sign-in (or Settings) instead of a step of its own.
    static let storeSteps: [Onboarding.Step] = [.bring, .connect, .tryIt]

    static let skip = "Skip for now"

    typealias Guide = ConnectAISection.Guide

    enum Way: String, Equatable, Sendable { case apple, google }

    /// What a row does when it is picked.
    enum Action: Equatable {
        case signIn(Way)
        case email
        case importAppleNotes
        case otherApps
        case importFrom(ImportKind)
        case openPrivacy
        case back
        case connect(Guide)
        case terminal
        case proceed
        case ask(Guide)
    }

    enum Mark: Equatable {
        case apple, google, email, more, back, check, settings, retry
        case origin(ImportOrigin)
        case ai(String)
    }

    struct Row: Identifiable, Equatable {
        let id: String
        let title: String
        let detail: String
        let mark: Mark
        let action: Action
        /// The prompt itself, in quotes, on the try-it step.
        var quote = false
    }

    /// What the panel is showing, within its step.
    enum Page: Equatable {
        case signIn, email
        case notes, otherApps, notesDenied, notesEmpty
        case ai, terminal
        case tryIt

        var step: Step {
            switch self {
            case .signIn, .email: .signIn
            case .notes, .otherApps, .notesDenied, .notesEmpty: .notes
            case .ai, .terminal: .ai
            case .tryIt: .tryIt
            }
        }
    }

    /// An import running behind the panel, said at the panel's foot.
    enum ImportStatus: Equatable {
        case running(from: String, done: Int, total: Int)
        case finished(String)
        case failed(String)
    }

    /// What the try-it step asks your AI (the prototype's words).
    static let prompt = "Make me a packing list for a weekend in Lisbon and save it in Pinto."

    /// The note an AI wrote or changed since `since`, the newest, from the AI-edit store's entries.
    static func written(_ entries: [UUID: AIEditStore.Entry], since: Date) -> UUID? {
        entries.filter { $0.value.editor != nil && ($0.value.editedAt ?? .distantPast) >= since }
            .max { ($0.value.editedAt ?? .distantPast) < ($1.value.editedAt ?? .distantPast) }?.key
    }

    /// The AIs the panel offers to connect, by the order they connected in.
    static func title(_ g: Guide) -> String { g.title }

    /// The page that opens Privacy & Security, Automation.
    static let automationSettings = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation")!
}

/// The panel's state: the page, which row is picked, how each step ended, and what runs behind it.
/// Pure state and events: the view does the work (sign-in, imports, connecting) and reports back.
@MainActor
@Observable
final class FirstRunModel {
    typealias Guide = ConnectAISection.Guide

    private(set) var page: FirstRun.Page = .signIn
    /// The row Return picks: the step's one primary row until you move with the arrows.
    private(set) var selection = 0
    private(set) var outcomes: [FirstRun.Step: FirstRun.Outcome] = [:]
    /// The row that is working, and what it says meanwhile ("Signing in", "Waiting for Claude…").
    private(set) var working: String?
    private(set) var workingLine: String?
    /// Something went wrong with the last pick, said under the rows.
    private(set) var problem: String?
    /// AIs connected during this run, in order.
    private(set) var connected: [Guide] = []
    private(set) var importStatus: FirstRun.ImportStatus?
    /// The try-it prompt went to this AI: the panel waits for its note.
    private(set) var asked: Guide?
    /// The first name, for "Emil, bring in…".
    var name: String?
    /// A sign-in was started from the panel and hasn't reached the notes yet (`AppGate`: the key
    /// screens stay behind the panel unless they need you).
    private(set) var armed = false
    /// Where the panel lands, once it has (the view animates it and then calls `finish`).
    private(set) var landing: Onboarding.Landing??

    /// Steps 2 to 4.
    let store: OnboardingStore
    /// The Apple Notes import, which goes on behind the panel and after it.
    @ObservationIgnored var background: Task<Void, Never>?

    init(store: OnboardingStore) {
        self.store = store
    }

    var step: FirstRun.Step { page.step }
    var count: String { FirstRun.count(step) }
    var canSkip: Bool { step != .signIn && landing == nil }
    func outcome(_ step: FirstRun.Step) -> FirstRun.Outcome? { outcomes[step] }
    /// Only steps that really happened.
    var done: Set<FirstRun.Step> { Set(outcomes.filter { $0.value == .done }.keys) }

    // MARK: Words

    var question: String {
        switch page {
        case .signIn: "Sign in to Pinto"
        case .email: "Use email"
        case .notes:
            if let name, !name.isEmpty { "\(name), bring in your notes from Apple Notes?" } else { "Bring in your notes from Apple Notes?" }
        case .otherApps: "Import from"
        case .notesDenied: "Pinto Notes can\u{2019}t read Apple Notes yet"
        case .notesEmpty: "Apple Notes has no notes on this Mac"
        case .ai:
            if let first = connected.first { "\(first.title) is connected. Anything else?" } else { "Connect ChatGPT?" }
        case .terminal: "Connect an AI in the terminal"
        case .tryIt: "Ask \(tryAI.title) to write your first note?"
        }
    }

    /// The AI the try-it step asks: the first connected, ChatGPT or Claude before the rest.
    var tryAI: Guide {
        connected.first { $0 == .chatgpt || $0 == .claude } ?? connected.first ?? .chatgpt
    }

    var rows: [FirstRun.Row] {
        switch page {
        case .signIn:
            return [
                .init(id: "apple", title: "Continue with Apple", detail: "Uses your Apple Account", mark: .apple, action: .signIn(.apple)),
                .init(id: "google", title: "Continue with Google", detail: "Uses your Google account", mark: .google, action: .signIn(.google)),
                .init(id: "email", title: "Use email", detail: "Sign in or sign up with your email address", mark: .email, action: .email),
            ]
        case .email:
            return []
        case .notes:
            return [
                .init(id: "appleNotes", title: "Import from Apple Notes", detail: "Every folder. Apple Notes stays as it is.", mark: .origin(.appleNotes), action: .importAppleNotes),
                otherAppsRow,
            ]
        case .otherApps:
            return ImportKind.listed.map { kind in
                .init(id: "import.\(kind.rawValue)", title: kind.sourceName, detail: OnboardingFlow.sourceDetail(kind), mark: .origin(.files(kind)), action: .importFrom(kind))
            } + [.init(id: "back", title: "Back", detail: "Apple Notes", mark: .back, action: .back)]
        case .notesDenied:
            return [
                .init(id: "privacy", title: "Open Privacy & Security", detail: "Turn on Notes for Pinto Notes under Automation", mark: .settings, action: .openPrivacy),
                .init(id: "retry", title: "Try again", detail: "Once it\u{2019}s turned on", mark: .retry, action: .importAppleNotes),
                otherAppsRow,
            ]
        case .notesEmpty:
            return [otherAppsRow, .init(id: "retry", title: "Try again", detail: "Apple Notes", mark: .retry, action: .importAppleNotes)]
        case .ai:
            var out: [FirstRun.Row] = []
            if !connected.isEmpty {
                out.append(.init(id: "continue", title: "Continue", detail: "Try it with \(tryAI.title)", mark: .check, action: .proceed))
            }
            if !connected.contains(.chatgpt) {
                out.append(.init(id: "chatgpt", title: connected.isEmpty ? "Connect ChatGPT" : "Connect ChatGPT too", detail: Self.chatgptDetail, mark: .ai("ChatGPT"), action: .connect(.chatgpt)))
            }
            if !connected.contains(.claude) {
                out.append(.init(id: "claude", title: connected.isEmpty ? "Connect Claude" : "Connect Claude too", detail: "Opens Claude in your browser", mark: .ai("Claude"), action: .connect(.claude)))
            }
            out.append(.init(id: "terminal", title: "Other AIs\u{2026}", detail: "Claude Code or Codex in the terminal", mark: .more, action: .terminal))
            return out.map(withWorkingLine)
        case .terminal:
            return ([Guide.claudeCode, .codex].filter { !connected.contains($0) }.map { g in
                .init(id: g.rawValue, title: g.title, detail: "Adds Pinto Notes with \(g.title)\u{2019}s own command", mark: .ai(g.title), action: .connect(g))
            } + [.init(id: "back", title: "Back", detail: "ChatGPT and Claude", mark: .back, action: .back)]).map(withWorkingLine)
        case .tryIt:
            let ai = tryAI
            let detail: String = switch ai {
            case .chatgpt: "Copies this and opens ChatGPT"
            case .claude: "Copies this and opens Claude. Press send there."
            default: "Copies this. Paste it into \(ai.title)."
            }
            return [withWorkingLine(.init(id: "ask", title: "\u{201C}\(FirstRun.prompt)\u{201D}", detail: detail, mark: .ai(ai.title), action: .ask(ai), quote: true))]
        }
    }

    private var otherAppsRow: FirstRun.Row {
        .init(id: "otherApps", title: "Choose another app\u{2026}", detail: "Obsidian, Bear, Evernote, Google Keep or Markdown files", mark: .more, action: .otherApps)
    }

    static var chatgptDetail: String {
        ChatGPTPlugin.listing != nil ? "Opens ChatGPT in your browser. Click Connect there." : "Opens ChatGPT in your browser, with a short guide"
    }

    private func withWorkingLine(_ row: FirstRun.Row) -> FirstRun.Row {
        guard row.id == working, let workingLine else { return row }
        return .init(id: row.id, title: row.title, detail: workingLine, mark: row.mark, action: row.action, quote: row.quote)
    }

    /// On the AI steps: what connecting means, in full, never behind a disclosure (App Review
    /// 5.1.1 and 5.1.2: what is sent, to which company, and that it asks first).
    var disclosure: String? {
        page == .ai || page == .terminal ? ConnectCopy.why : nil
    }

    /// The import's line at the panel's foot.
    var statusLine: String? {
        switch importStatus {
        case .running(let from, let done, let total): "Importing from \(from) \u{00B7} \(done.formatted()) of \(total.formatted())"
        case .finished(let line): line
        case .failed(let line): line
        case nil: nil
        }
    }

    // MARK: Keys

    func select(_ i: Int) {
        guard !rows.isEmpty else { return }
        selection = (i % rows.count + rows.count) % rows.count
    }

    func move(_ by: Int) { select(selection + by) }

    /// Return: the picked row's action (the primary row unless the arrows moved). Nil while the
    /// panel is landing or the page has no rows.
    func returnPressed() -> FirstRun.Action? {
        guard landing == nil, rows.indices.contains(selection) else { return nil }
        return rows[selection].action
    }

    /// Esc, or Skip for now: past the step, never marked done. False on sign-in, which has no way past.
    @discardableResult
    func skip() -> Bool {
        guard canSkip else { return false }
        switch page {
        case .otherApps:
            go(.notes)
            return true
        case .terminal:
            go(.ai)
            return true
        default:
            break
        }
        if outcomes[step] == nil { outcomes[step] = .skipped }
        stopWorking()
        if step == .tryIt {
            land(.newNote)
            return true
        }
        if !store.advance(connected: !connected.isEmpty, skipped: outcomes[step] == .skipped) {
            land(.newNote)
        } else {
            follow(store.step)
        }
        return true
    }

    // MARK: Pages

    func go(_ page: FirstRun.Page) {
        guard self.page != page else { return }
        self.page = page
        selection = 0
        problem = nil
    }

    /// Use email: the email form in the panel. The key screens stay behind it from here, as for
    /// Apple and Google.
    func chooseEmail() {
        armed = true
        go(.email)
    }

    /// Back, or Esc on a page under a step's first.
    func back() {
        switch page {
        case .email:
            armed = false
            go(.signIn)
        case .otherApps, .notesDenied, .notesEmpty: go(.notes)
        case .terminal: go(.ai)
        default: break
        }
    }

    /// The onboarding store's step changed (shown, resumed, played again): the panel follows it.
    func follow(_ step: Onboarding.Step?) {
        guard let step else { return }
        let to = FirstRun.Step(step)
        guard to != self.step || page == .signIn || page == .email else { return }
        switch to {
        case .signIn: go(.signIn)
        case .notes: go(.notes)
        case .ai: go(.ai)
        case .tryIt: go(.tryIt)
        }
    }

    // MARK: Sign-in

    func signInStarted(_ row: String) {
        armed = true
        problem = nil
        work(row, "Signing in")
    }

    func signInFailed(_ message: String?) {
        armed = false
        stopWorking()
        problem = message
    }

    /// Signed in: the first question is answered.
    func signedIn() {
        outcomes[.signIn] = .done
    }

    /// The notes are open and the panel no longer needs the key screens held back.
    func disarm() {
        armed = false
        if page == .signIn || page == .email { stopWorking() }
    }

    // MARK: Notes

    func appleNotesReading() {
        problem = nil
        work("appleNotes", "Reading Apple Notes\u{2026}")
    }

    func appleNotesDenied() {
        stopWorking()
        go(.notesDenied)
    }

    func appleNotesEmpty() {
        stopWorking()
        go(.notesEmpty)
    }

    func appleNotesFailed(_ message: String) {
        stopWorking()
        problem = message
    }

    /// Apple Notes is being read in, behind the panel: the panel goes on to your AI meanwhile.
    /// The notes step is not done until notes have come in (`importFinished`).
    func importStarted(from: String, total: Int) {
        stopWorking()
        importStatus = .running(from: from, done: 0, total: total)
        guard step == .notes else { return }
        if store.advance(connected: !connected.isEmpty) { follow(store.step) } else { land(.newNote) }
    }

    func importProgress(done: Int, total: Int) {
        guard case .running(let from, _, _) = importStatus else { return }
        importStatus = .running(from: from, done: done, total: total)
    }

    /// An import ended. Only notes brought in finish the step.
    func importFinished(count: Int, line: String? = nil) {
        let ranBehind = if case .running = importStatus { true } else { false }
        if count > 0 {
            outcomes[.notes] = .done
            importStatus = .finished(line ?? (count == 1 ? "1 note imported" : "\(count.formatted()) notes imported"))
        } else if ranBehind {
            importStatus = .failed(line ?? "No notes were imported")
        }
        // An import sheet (another app) brought them while the panel waited on this step.
        guard count > 0, !ranBehind, step == .notes else { return }
        if store.advance(connected: !connected.isEmpty) { follow(store.step) } else { land(.newNote) }
    }

    // MARK: AI

    func connecting(_ g: Guide, line: String) {
        problem = nil
        work(g.rawValue, line)
    }

    func connectFailed(_ line: String) {
        stopWorking()
        problem = line
    }

    func stopConnecting() { stopWorking() }

    /// Connected, for real: the server lists it, or it was allowed here.
    func connected(_ g: Guide) {
        if !connected.contains(g) { connected.append(g) }
        outcomes[.ai] = .done
        stopWorking()
        if step == .ai {
            page = .ai
            selection = 0
        }
    }

    /// Continue, on the AI step with an AI connected.
    func proceed() {
        guard step == .ai, !connected.isEmpty else { return }
        if store.advance(connected: true) { follow(store.step) } else { land(.newNote) }
    }

    // MARK: Try it

    func asking(_ g: Guide) {
        asked = g
        work("ask", "Waiting for \(g.title) to write it\u{2026}")
    }

    /// The note the AI wrote is here: the panel lands on it.
    func noteArrived(_ id: UUID) {
        guard step == .tryIt, landing == nil else { return }
        outcomes[.tryIt] = .done
        stopWorking()
        land(.note(id))
    }

    // MARK: Landing

    /// The panel goes into the app. The view animates it, then calls the gate's finish.
    func land(_ to: Onboarding.Landing?) {
        guard landing == nil else { return }
        landing = .some(to)
    }

    /// A replay or a new account: the panel starts clean.
    func reset(signedIn: Bool) {
        page = signedIn ? .notes : .signIn
        selection = 0
        outcomes = signedIn ? [.signIn: .done] : [:]
        working = nil
        workingLine = nil
        problem = nil
        connected = []
        asked = nil
        landing = nil
        armed = false
        if !signedIn { importStatus = nil }
    }

    private func work(_ row: String, _ line: String) {
        working = row
        workingLine = line
    }

    private func stopWorking() {
        working = nil
        workingLine = nil
    }
}
#endif
