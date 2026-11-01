import Foundation

/// Gets a note ready while the pointer rests on its row, so the click opens what is ready.
///
/// A time profile of note opens (2026-10-12) found the app's own part of an open small: finding the
/// note, its text and styling are a few milliseconds; most of an open is the system building the
/// note's views, which can't be done ahead. What can is pictures. Each is decoded at the size the
/// note shows it (EmbedImages), off the main thread, while the pointer rests on the row.
///
/// One note at a time: a row the pointer passes over on its way elsewhere does nothing, since the
/// work starts only after it has rested `dwell` on the row, and leaving cancels it. Never a locked
/// note, never anything over the network (pictures not on this device are left), and nothing at all
/// for a note with no pictures. A note that is an app needs nothing here: a web view is always
/// kept ready for it (NotePageSandbox.prewarm).
@MainActor
enum NotePreload {
    /// How long the pointer rests on a row before its note is got ready.
    static let dwell: Duration = .milliseconds(80)
    private static var current: (id: UUID, task: Task<Void, Never>)?
    /// Notes got ready (for tests).
    private(set) static var prepared = 0

    /// The pointer came onto a note's row (`over`), or left it.
    static func pointer(_ over: Bool, on note: Note) {
        guard over else {
            if current?.id == note.id { current?.task.cancel(); current = nil }
            return
        }
        current?.task.cancel()
        guard note.lockedBody == nil, note.body.contains("pane-file:") else { current = nil; return }
        let id = note.id, body = note.body, context = note.modelContext
        current = (id, Task {
            try? await Task.sleep(for: dwell)
            guard !Task.isCancelled else { return }
            let urls = EditorController.imageIDs(in: body).compactMap { context?.attachment($0) }.map { FileStore.url(for: $0.id, filename: $0.filename) }
            prepared += 1
            await EmbedImages.warm(urls)
        })
    }
}
