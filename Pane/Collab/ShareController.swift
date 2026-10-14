import Foundation
import Observation

/// Sharing a note with people. One switch in code: `released` turns it on for everyone in a
/// release. Before that, the `collabEnabled` default turns it on for one Mac or iPhone (the
/// two-device check on staging: `defaults write <bundle id> collabEnabled -bool YES`), and tests
/// set `forced`.
enum CollabFeature {
    static let released = false
    nonisolated(unsafe) static var forced: Bool?
    static var isOn: Bool { forced ?? (released || UserDefaults.standard.bool(forKey: "collabEnabled")) }
}

/// What Share does with a note, whoever does it: the live store (CollabStore), or a stand-in in
/// tests and pictures.
@MainActor
protocol ShareBackend: AnyObject {
    /// The note's link, what it lets people do, and who's in the note (you first).
    func shareState(for note: Note) -> ShareState
    func setAccess(_ access: ShareState.Access, for note: Note) async throws
    func remove(_ user: UUID, from note: Note) async throws
    /// You leave someone else's note: it goes from your notes, and from their People.
    func leave(_ note: Note) async throws
}

/// The Share sheet's state and what its buttons do, on Mac and iPhone (ShareForm,
/// ShareNotePopover). Every button says what it does and the sheet shows it happening: a link
/// being made, someone being removed. Nothing waits forever: after `timeout` a step stops and
/// says so.
@MainActor
@Observable
final class ShareController {
    let note: Note
    let backend: ShareBackend
    private(set) var state: ShareState
    /// What's being done right now, said on the button that started it.
    private(set) var working: Work?
    /// Remove asks first: the person loses the note.
    var confirmingRemove: ShareState.Person?
    var confirmingLeave = false
    /// The link to hand to the system share sheet or menu, once it's made.
    var sharing: URL?
    /// You left the note: the sheet closes.
    private(set) var left = false
    @ObservationIgnored var timeout: Duration = .seconds(20)

    enum Work: Equatable { case link, access, remove(UUID), leave }

    init(note: Note, backend: ShareBackend) {
        self.note = note
        self.backend = backend
        state = backend.shareState(for: note)
    }

    var isOwner: Bool { state.myRole == "owner" }

    func refresh() {
        let problem = state.problem
        state = backend.shareState(for: note)
        state.problem = problem
    }

    /// Share Link: the note's link to the share sheet. A note with no link yet gets one that lets
    /// people edit (what sharing a note with people is for), then the sheet opens by itself.
    func shareLink() async {
        if let link = state.link, state.access != .off {
            sharing = link
            return
        }
        guard isOwner else { return }
        await run(.link) { try await self.backend.setAccess(.edit, for: self.note) }
        if let link = state.link, state.access != .off { sharing = link }
    }

    func setAccess(_ access: ShareState.Access) async {
        guard isOwner, access != state.access else { return }
        await run(.access) { try await self.backend.setAccess(access, for: self.note) }
    }

    func askRemove(_ person: ShareState.Person) {
        guard isOwner, !person.isMe else { return }
        confirmingRemove = person
    }

    func confirmRemove() async {
        guard let person = confirmingRemove else { return }
        confirmingRemove = nil
        await run(.remove(person.id)) { try await self.backend.remove(person.id, from: self.note) }
    }

    func askLeave() {
        guard !isOwner else { return }
        confirmingLeave = true
    }

    func confirmLeave() async {
        confirmingLeave = false
        await run(.leave) { try await self.backend.leave(self.note) }
        if state.problem == nil { left = true }
    }

    private func run(_ work: Work, _ step: @escaping @MainActor @Sendable () async throws -> Void) async {
        working = work
        state.problem = nil
        do {
            try await Self.within(timeout, step)
        } catch is TimedOut {
            state.problem = Self.timedOut(work)
        } catch {
            state.problem = Self.failed(work)
        }
        working = nil
        refresh()
    }

    struct TimedOut: Error {}

    /// Runs `step`, or gives up after `limit` (the step may still finish later; its result is
    /// then shown by the next refresh).
    static func within(_ limit: Duration, _ step: @escaping @MainActor @Sendable () async throws -> Void) async throws {
        try await withCheckedThrowingContinuation { (c: CheckedContinuation<Void, Error>) in
            let once = Once(c)
            Task { @MainActor in
                do { try await step(); once.resume(nil) } catch { once.resume(error) }
            }
            Task { @MainActor in
                try? await Task.sleep(for: limit)
                once.resume(TimedOut())
            }
        }
    }

    /// Resumes a continuation the first time only.
    @MainActor private final class Once {
        private var c: CheckedContinuation<Void, Error>?
        init(_ c: CheckedContinuation<Void, Error>) { self.c = c }
        func resume(_ error: Error?) {
            guard let c else { return }
            self.c = nil
            if let error { c.resume(throwing: error) } else { c.resume() }
        }
    }

    static func failed(_ work: Work) -> String {
        switch work {
        case .link: "The link wasn't made. Check your connection and try again."
        case .access: "The link didn't change. Check your connection and try again."
        case .remove: "They weren't removed. Check your connection and try again."
        case .leave: "You didn't leave the note. Check your connection and try again."
        }
    }

    static func timedOut(_ work: Work) -> String {
        switch work {
        case .link: "Making the link took too long. Try again."
        case .access: "Changing the link took too long. Try again."
        case .remove: "Removing took too long. Try again."
        case .leave: "Leaving took too long. Try again."
        }
    }
}

/// The words Share uses, in one place so tests can check them.
enum ShareCopy {
    /// Under People. True whether or not the server keeps a copy of your key: only the people in
    /// the note can open it, and an AI request is the one time the server reads it.
    static let privacy = "Only people in this note can read it. When one of them asks their AI about it, the server reads the note for that request."

    static func link(_ access: ShareState.Access) -> String {
        switch access {
        case .edit: "Anyone with the link can join and edit in Pinto Notes."
        case .view: "Anyone with the link can join and read in Pinto Notes."
        case .off: "The link doesn't work. Turning it on makes a new one."
        }
    }

    /// Under the link: what it does now, or, before the note is shared, what Share Link will do.
    static func link(_ state: ShareState) -> String {
        state.access == .off && state.people.count <= 1 ? notSharedYet : link(state.access)
    }

    static let notSharedYet = "Share Link makes a link anyone can join with and edit, in Pinto Notes."

    static func role(_ role: String) -> String {
        role == "owner" ? "Owner" : role == "editor" ? "Can edit" : "Can view"
    }

    static func first(_ name: String) -> String { name.split(separator: " ").first.map(String.init) ?? name }

    static func verify(_ first: String) -> String {
        "Compare this code with \(first), in person or on a call. If it's the same on both screens, you're sharing with the real \(first)."
    }

    static func removeTitle(_ person: ShareState.Person) -> String { "Remove \(first(person.name))?" }
    static func removeMessage(_ person: ShareState.Person) -> String {
        "\(first(person.name)) can't open this note anymore. What they've already seen stays with them. The link changes, so the old one stops working."
    }

    static func leaveTitle(_ title: String) -> String { "Leave \u{201C}\(title)\u{201D}?" }
    static let leaveMessage = "It's removed from your notes. To join again, you need a new link."

    static func working(_ work: ShareController.Work) -> String {
        switch work {
        case .link: "Making the link…"
        case .access: "Changing the link…"
        case .remove: "Removing…"
        case .leave: "Leaving…"
        }
    }
}
