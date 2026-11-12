#if os(macOS)
import Foundation

/// Where Apple Notes keeps its database and whether this app may read it. AppleScript can't tell
/// which notes are pinned; `AppleNoteStore` reads that, and what a checklist is, from the database.
enum ApplePins {
    enum Failure: Error, Equatable {
        /// Full Disk Access isn't granted.
        case noAccess
        /// The database isn't laid out the way we expect (a new macOS, for example).
        case schemaUnknown
        case unreadable
    }

    /// In the person's own home folder. A sandboxed build's home is its container, so the home is
    /// taken from the account, the folder the App Store build's read-only exception is relative to
    /// (`temporary-exception.files.home-relative-path.read-only`, Pane-mac-appstore.entitlements).
    static var store: URL {
        realHome.appending(path: "Library/Group Containers/group.com.apple.notes/NoteStore.sqlite")
    }

    static var realHome: URL {
        if let pw = getpwuid(getuid()), let dir = pw.pointee.pw_dir { return URL(fileURLWithPath: String(cString: dir), isDirectory: true) }
        return FileManager.default.homeDirectoryForCurrentUser
    }

    /// Whether the database can be opened right now (i.e. Full Disk Access is granted). Each try
    /// is also what puts Pinto Notes in System Settings' Full Disk Access list: macOS lists an app
    /// there only once it has been refused.
    static func hasAccess(at url: URL = store) -> Bool {
        guard let h = try? FileHandle(forReadingFrom: url) else { return false }
        try? h.close()
        return true
    }

    /// System Settings → Privacy & Security → Full Disk Access.
    static let settingsURL = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")!

    /// The AppleScript id `x-coredata://<store>/ICNote/p123` names the row whose Z_PK is 123.
    static func primaryKey(fromNoteID id: String) -> Int? {
        guard let range = id.range(of: "/ICNote/p", options: .backwards) else { return nil }
        return Int(id[range.upperBound...])
    }

    /// The primary keys of pinned notes.
    static func pinnedKeys(at url: URL = store) -> Result<Set<Int>, Failure> {
        AppleNoteStore.open(at: url).map { store in
            defer { store.close() }
            return store.pinned
        }
    }
}
#endif
