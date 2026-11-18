import Foundation

/// What a note shared with people can't do yet (parked in release 1.3; see ISSUES.md): be an app,
/// be locked, show Version History, or be a public web page (that would publish everyone's text).
/// The app doesn't offer any of them for a shared note, and a note with an app isn't shared with
/// people. Files and photos are fine since 18 November 2026: they're sealed under the note's key,
/// so everyone in it opens them (SharedFiles).
enum SharedNoteLimits {
    /// Whether files and photos can go into the note: not a locked one, and not a shared note you
    /// can only view.
    static func allowsFiles(_ note: Note, viewOnly: Bool = false) -> Bool { !note.isLocked && !(note.isShared && viewOnly) }

    /// The note's text embeds a file or picture (`[name](pane-file:<id>)`).
    static func hasFiles(_ text: String) -> Bool { text.contains("](pane-file:") }

    /// Why this note can't be shared with people yet, or nil when it can. A note that is shared
    /// already, or whose link was on, is past the question.
    static func notYet(text: String, hasApp: Bool, alreadyShared: Bool) -> String? {
        guard !alreadyShared else { return nil }
        if hasApp { return appLine }
        return nil
    }

    static let appLine = "A note with an app can't be shared with people yet. Send a copy instead."

    /// The web page of a note that was shared with people after it got one: its copy stays as it was.
    static let pageLine = "This page shows the note from before you shared it with people, and isn't updated. Stop sharing to take it down."
}
