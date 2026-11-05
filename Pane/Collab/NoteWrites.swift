import Foundation

/// Changes to a note's text made outside its editor: Siri and Shortcuts, a tick in the widget,
/// "Add to a note" in the share sheet, Undo and Review of an AI's change.
///
/// A shared note's text lives in its document (SharedLibrary). Writing `note.body` alone looks
/// fine for a moment, then the document's next change mirrors over it: the edit never reaches the
/// others, and goes from your own copy too. So a shared note's change goes into the document as
/// your edit, as typing would, and the note takes the merged text.
@MainActor
enum NoteWrites {
    enum Outcome: Equatable {
        case changed, unchanged
        /// Can view: the server refuses the change, so nothing is written.
        case viewOnly
        /// A shared note whose document isn't open on this device yet (signed out, or it hasn't
        /// arrived): nothing is written, so the caller keeps the change or puts it elsewhere.
        case notReady
    }

    nonisolated static let viewOnlyMessage = "You can view this note, not change it."
    nonisolated static let notReadyMessage = "This shared note isn't ready yet. Open it in Pinto Notes, then try again."

    /// Siri and Shortcuts can run just after launch, before sharing has started: a shared note
    /// waits a few seconds for it and for its document before the change is tried.
    static func ready(_ note: Note, within: Duration = .seconds(5),
                      library: @MainActor () -> SharedLibrary? = { CollabStore.shared?.library }) async {
        guard note.isShared else { return }
        let end = ContinuousClock.now + within
        while library() == nil, ContinuousClock.now < end { try? await Task.sleep(for: .milliseconds(100)) }
        guard let lib = library(), lib.session(for: note) == nil else { return }
        _ = await lib.ensureDocument(note)
    }

    /// `edit` gets the note's current text (a shared note's: the document's) and returns the new
    /// text. Saving is the caller's.
    @discardableResult
    static func change(_ note: Note, library: SharedLibrary? = CollabStore.shared?.library,
                       _ edit: (String) throws -> String) rethrows -> Outcome {
        guard note.isShared else {
            let new = try edit(note.body)
            guard new != note.body else { return .unchanged }
            note.body = new
            note.touch()
            return .changed
        }
        guard let library else { return .notReady }
        guard let session = library.session(for: note), !session.isClosed else {
            Task { await library.ensureDocument(note) }
            return .notReady
        }
        guard session.record.canEdit, !session.isViewOnly else { return .viewOnly }
        let new = try edit(session.text)
        guard new != session.text else { return .unchanged }
        // The open editor takes it too (it didn't make it).
        session.localFromOutside(new)
        library.mirror(session.text, into: note)
        return .changed
    }
}
