import Foundation

/// What a note shared with people can't do yet (parked in release 1.3; see ISSUES.md): hold files
/// or photos (they're sealed under the owner's key, so the others couldn't open them), be an app,
/// be locked, show Version History, or be a public web page (that would publish everyone's text).
/// The app doesn't offer any of them for a shared note, and a note with files or an app isn't
/// shared with people.
enum SharedNoteLimits {
    /// Whether files and photos can go into the note.
    static func allowsFiles(_ note: Note) -> Bool { !note.isLocked && !note.isShared }

    /// The note's text embeds a file or picture (`[name](pane-file:<id>)`).
    static func hasFiles(_ text: String) -> Bool { text.contains("](pane-file:") }

    /// Why this note can't be shared with people yet, or nil when it can. A note that is shared
    /// already, or whose link was on, is past the question.
    static func notYet(text: String, hasApp: Bool, alreadyShared: Bool) -> String? {
        guard !alreadyShared else { return nil }
        if hasApp { return appLine }
        if hasFiles(text) { return filesLine }
        return nil
    }

    static let appLine = "A note with an app can't be shared with people yet. Send a copy instead."
    static let filesLine = "A note with files or photos can't be shared with people yet. Send a copy instead."

    /// Said when a file is dropped, pasted or attached into a shared note.
    static let filesTitle = "Files can't go in a shared note yet"
    static let filesMessage = "The people in this note couldn't open them. Add the file to a note of your own instead."

    /// The web page of a note that was shared with people after it got one: its copy stays as it was.
    static let pageLine = "This page shows the note from before you shared it with people, and isn't updated. Stop sharing to take it down."
}
