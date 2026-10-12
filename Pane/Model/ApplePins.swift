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

    static var store: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appending(path: "Library/Group Containers/group.com.apple.notes/NoteStore.sqlite")
    }

    /// Sandboxed builds can't reach another app's container at all, so the option is hidden there.
    static var isAvailable: Bool { ProcessInfo.processInfo.environment["APP_SANDBOX_CONTAINER_ID"] == nil }

    /// Whether the database can be opened right now (i.e. Full Disk Access is granted).
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
