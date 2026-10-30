import Foundation
import Observation

/// Every account's first note, "Welcome": a short to-do list for getting started, written for the
/// device the account starts on (Emil's pick, 28 October 2026, from PN design's "the welcome
/// screen is a note"). On iPhone the signed-out welcome shows it being written (WelcomeNoteView);
/// on the Mac it's simply there after the first sign-in.
///
/// It's made once per account. Notes are end-to-end encrypted, so the server can't write it: the
/// first device to ask `claim_welcome_note()` wins and writes it, in its own words; every other
/// device, and every account from before, is told no.
@MainActor
enum WelcomeNote {
    enum Device: Equatable, Sendable { case iPhone, mac }

    struct Item: Equatable, Sendable {
        let title: String
    }

    static let title = "Welcome"
    static let lines = ["This is your notebook.", "Your AI writes in it too."]
    static let section = "Get started"

    /// What there is to do, in the order the AIs write it on the welcome. On iPhone only ChatGPT
    /// connects for now (Claude's listing is still in review), so it says ChatGPT alone.
    static func items(for device: Device) -> [Item] {
        switch device {
        case .iPhone:
            [Item(title: "Get Pinto on your Mac"), Item(title: "Bring your Apple Notes over"), Item(title: "Connect ChatGPT")]
        case .mac:
            [Item(title: "Bring your Apple Notes over"), Item(title: "Connect ChatGPT or Claude"), Item(title: "Get Pinto on your iPhone")]
        }
    }

    static var thisDevice: Device {
        #if os(macOS)
        .mac
        #else
        .iPhone
        #endif
    }

    /// How far the note is written: characters of each part, and how many to-dos have begun.
    struct Progress: Equatable, Sendable {
        var title = 0, line1 = 0, line2 = 0, section = 0
        var todos: [Int] = []
        @MainActor static func finished(_ device: Device) -> Progress {
            Progress(title: WelcomeNote.title.count, line1: lines[0].count, line2: lines[1].count, section: WelcomeNote.section.count,
                     todos: items(for: device).map(\.title.count))
        }
    }

    /// The note's markdown as far as `progress` has written it, ticks applied: the title (the
    /// editor's title line), the two lines, "Get started" as a ### heading (the editor's small
    /// label) and the to-dos. Finished, it's exactly what's saved.
    static func text(_ progress: Progress, for device: Device, ticked: Set<Int> = []) -> String {
        var s = String(title.prefix(progress.title))
        if progress.line1 > 0 || progress.line2 > 0 || progress.section > 0 || !progress.todos.isEmpty {
            s += "\n\n" + String(lines[0].prefix(progress.line1))
        }
        if progress.line2 > 0 || progress.section > 0 || !progress.todos.isEmpty {
            s += "\n" + String(lines[1].prefix(progress.line2))
        }
        if progress.section > 0 || !progress.todos.isEmpty {
            s += "\n\n### " + String(section.prefix(progress.section))
        }
        let all = items(for: device)
        for (i, n) in progress.todos.enumerated() where i < all.count {
            s += "\n- [\(ticked.contains(i) ? "x" : " ")] " + String(all[i].title.prefix(n))
        }
        return s
    }

    /// The note as it's saved: plain markdown, the items you ticked on the welcome ticked, and no
    /// word of who wrote it.
    static func body(for device: Device, ticked: Set<Int> = []) -> String {
        text(.finished(device), for: device, ticked: ticked) + "\n"
    }

    /// Which to-dos a note's text has ticked, by their titles (the editor may have moved them).
    static func ticks(in text: String, for device: Device) -> Set<Int> {
        let all = items(for: device).map(\.title)
        var out: Set<Int> = []
        for line in text.split(separator: "\n") where line.hasPrefix("- [x] ") || line.hasPrefix("- [X] ") {
            let title = String(line.dropFirst(6))
            if let i = all.firstIndex(where: { $0.hasPrefix(title) || title.hasPrefix($0) }), !title.isEmpty { out.insert(i) }
        }
        return out
    }

    /// The items ticked on the iPhone welcome before signing in, kept for the saved note.
    static var ticked: Set<Int> = []

    static func askedKey(_ account: UUID) -> String { "welcome.asked.\(account.uuidString.lowercased())" }

    /// After an account's first sync on this device: asks the server once whether this device
    /// writes the note, and if so writes it (`write` makes the note and returns its id). An answer
    /// is remembered, so a later launch doesn't ask again; a failed ask is tried next launch.
    /// Returns the note's id when this device wrote it.
    @discardableResult
    static func settle(account: UUID, defaults: UserDefaults = .standard, claim: () async throws -> Bool,
                       write: (String) -> UUID?) async -> UUID? {
        guard !defaults.bool(forKey: askedKey(account)) else { return nil }
        let won: Bool
        do { won = try await claim() } catch { return nil }
        defaults.set(true, forKey: askedKey(account))
        guard won else { return nil }
        let id = write(body(for: thisDevice, ticked: ticked))
        ticked = []
        return id
    }
}

/// iPhone: the welcome note after a sign-in from it. Over everything, the finished note waits
/// for the account's key and first sync; then the note this device wrote opens in the editor under
/// it and it goes (a new account), or it slides away (an account from before, which gets no note).
@MainActor @Observable
final class WelcomeHandoff {
    static let shared = WelcomeHandoff()

    enum Phase: Equatable { case idle, waiting, opening, leaving }
    private(set) var phase: Phase = .idle
    /// The note this device wrote, once it has.
    private(set) var noteID: UUID?
    private(set) var ticked: Set<Int> = []
    /// Which button started it: it stays on the screen, working, until the note opens.
    enum Way: Equatable { case apple, google, email }
    private(set) var way: Way = .apple
    @ObservationIgnored private var armedAt: Date?
    /// The note being opened under the welcome, read without observing: an editor asks once, as
    /// it's made (NoteEditorText), and nothing should draw again when it changes.
    @ObservationIgnored private(set) var opening: UUID?

    /// A sign-in from the welcome note is under way: what's ticked goes with it.
    func arm(ticked: Set<Int>, way: Way = .apple) {
        self.ticked = ticked
        self.way = way
        WelcomeNote.ticked = ticked
        armedAt = .now
        phase = .waiting
        noteID = nil
    }

    /// The sign-in failed or was cancelled: the welcome is still there.
    func disarm() {
        phase = .idle
        armedAt = nil
    }

    /// The first sync has answered: `id` is the note this device wrote, or nil (an account from
    /// before, or another device wrote it).
    func settled(_ id: UUID?) {
        guard phase == .waiting else { return }
        if let id {
            noteID = id
            opening = id
            phase = .opening
        } else {
            phase = .leaving
        }
    }

    /// Something else needs the screen (the key gate, a long wait): the note steps aside.
    func leave() {
        if phase == .waiting { phase = .leaving }
    }

    /// The note is open in the editor under the welcome: the welcome goes.
    func opened() {
        if phase == .opening { done() }
    }

    /// The slide, or the opening, has finished.
    func done() {
        phase = .idle
        armedAt = nil
        opening = nil
    }

    /// How long the note waits for the key and the first sync before it steps aside.
    static let patience: TimeInterval = 20
    var waitedTooLong: Bool { armedAt.map { Date.now.timeIntervalSince($0) > Self.patience } ?? false }
}
