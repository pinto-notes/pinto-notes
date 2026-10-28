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
        /// A grey line under the item on the iPhone welcome. Not saved: a note's lines are its text.
        let detail: String
    }

    static let title = "Welcome"
    static let lines = ["This is your notebook.", "Your AI writes in it too."]
    static let section = "Get started"

    /// What there is to do, in the order the AIs write it on the welcome.
    static func items(for device: Device) -> [Item] {
        switch device {
        case .iPhone:
            [Item(title: "Get Pinto on your Mac", detail: "Your notes are already there when you open it"),
             Item(title: "Bring your Apple Notes over", detail: "On the Mac, in a minute or two"),
             Item(title: "Connect ChatGPT or Claude", detail: "In Settings here, or on the Mac")]
        case .mac:
            [Item(title: "Bring your Apple Notes over", detail: "From the Notes app on this Mac"),
             Item(title: "Connect ChatGPT or Claude", detail: "In Settings, Connect an AI"),
             Item(title: "Get Pinto on your iPhone", detail: "Your notes are already there when you open it")]
        }
    }

    static var thisDevice: Device {
        #if os(macOS)
        .mac
        #else
        .iPhone
        #endif
    }

    /// The note as it's saved: plain markdown, the items you ticked on the welcome ticked. No
    /// sublines and no word of who wrote it.
    static func body(for device: Device, ticked: Set<Int> = []) -> String {
        let todo = items(for: device).enumerated().map { i, item in "- [\(ticked.contains(i) ? "x" : " ")] \(item.title)" }
        return (["# \(title)", ""] + lines + ["", section, ""] + todo).joined(separator: "\n") + "\n"
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

/// iPhone: the welcome note after a sign-in from it. Over everything, the finished note waits for
/// the account's first sync, then folds into its row in the list (a new account, whose note this
/// is) or slides away (an account from before, which gets no note).
@MainActor @Observable
final class WelcomeHandoff {
    static let shared = WelcomeHandoff()

    enum Phase: Equatable { case idle, waiting, folding, leaving }
    private(set) var phase: Phase = .idle
    /// The note this device wrote, once it has; its row reports where it is.
    private(set) var noteID: UUID?
    /// Where that row is on the screen.
    var target: CGRect?
    /// The row lights up as the note lands in it, then fades.
    private(set) var flash: UUID?
    private(set) var ticked: Set<Int> = []
    @ObservationIgnored private var armedAt: Date?

    /// A sign-in from the welcome note is under way: what's ticked goes with it.
    func arm(ticked: Set<Int>) {
        self.ticked = ticked
        WelcomeNote.ticked = ticked
        armedAt = .now
        phase = .waiting
        noteID = nil
        target = nil
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
        if let id { noteID = id } else { phase = .leaving }
    }

    /// Something else needs the screen (the key gate, a long wait): the note steps aside.
    func leave() {
        if phase == .waiting { phase = .leaving }
    }

    /// The row has reported where it is: the fold can run.
    func fold() {
        guard phase == .waiting, noteID != nil, target != nil else { return }
        phase = .folding
    }

    /// The fold or the slide has finished.
    func done() {
        if phase == .folding { flash = noteID }
        phase = .idle
        armedAt = nil
    }

    func flashShown() { flash = nil }

    /// How long the note waits for the first sync before it steps aside.
    static let patience: TimeInterval = 8
    var waitedTooLong: Bool { armedAt.map { Date.now.timeIntervalSince($0) > Self.patience } ?? false }
}
