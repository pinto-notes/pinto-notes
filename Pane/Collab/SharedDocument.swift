import CryptoKit
import Foundation
import SwiftData

/// A shared note's document on this device: the Automerge document saved, the changes not yet on
/// the server, and how far this device has read the server's changes. Kept next to the note
/// (`Note.sharedDocument`), so a shared note opens and takes edits offline.
///
/// Storage keeps itself small, as the server does: changes are appended to `tail` as they happen
/// (yours and others'), and once there are many, the whole document is saved again into `saved`
/// and the tail starts over (`CollabSession.compactIfNeeded`).
@Model
final class SharedDocument {
    /// The shared note (`shared_notes.id`). For its owner it's also their note's id; everyone
    /// else's note has an id of its own (`SharedNotes.noteID`).
    @Attribute(.unique) var id: UUID
    var note: Note?
    /// The note key's generation this device last opened.
    var epoch: Int
    /// "owner", "editor" or "viewer".
    var role: String
    /// The document as of the last compaction (Automerge `save()`).
    @Attribute(.externalStorage) var saved: Data
    /// Changes since `saved`, concatenated: loading applies them after it.
    @Attribute(.externalStorage) var tail: Data
    var tailChanges: Int
    /// Your changes the server hasn't stored yet, oldest first (`SharedDocument.frames`). They are
    /// in `saved` and `tail` too: this is only what's still to send.
    @Attribute(.externalStorage) var outbox: Data
    /// The newest server change this document holds, as of the last pull. Catching up asks for
    /// the changes after it. Changes that arrive live don't move it (ids can arrive out of order).
    var cursor: Int64
    /// Server changes taken in since the newest snapshot this device knows of.
    var sinceSnapshot: Int
    /// The note keys this device has had, each sealed under your data key (`setKey`).
    var keyBoxes: Data = Data()

    init(id: UUID, epoch: Int, role: String, saved: Data, cursor: Int64 = 0) {
        self.id = id
        self.epoch = epoch
        self.role = role
        self.saved = saved
        tail = Data()
        tailChanges = 0
        outbox = Data()
        cursor = 0
        sinceSnapshot = 0
        keyBoxes = Data()
        self.cursor = cursor
    }

    var canEdit: Bool { role == "owner" || role == "editor" }

    /// The changes waiting to go up.
    var pending: [Data] {
        get { Self.frames(outbox) }
        set { outbox = Self.frame(newValue) }
    }

    /// A change of yours to send. Typed while others wait (offline, or one in flight), it joins
    /// the last one waiting: Automerge takes changes concatenated, so a long offline session goes
    /// up in a few requests. The first one waiting may be in flight and is never added to.
    func enqueue(_ change: Data) {
        var p = pending
        if p.count > 1, let last = p.last, last.count + change.count <= Self.batchBytes {
            p[p.count - 1] = last + change
        } else {
            p.append(change)
        }
        pending = p
    }

    /// Sealed, a batch stays well under what the server takes for one change.
    static let batchBytes = 96 * 1024

    /// Length-prefixed blobs in one Data (SwiftData keeps one value, not an array of them).
    static func frame(_ blobs: [Data]) -> Data {
        var out = Data()
        for b in blobs {
            var n = UInt32(b.count).bigEndian
            out.append(Data(bytes: &n, count: 4))
            out.append(b)
        }
        return out
    }

    static func frames(_ data: Data) -> [Data] {
        var out: [Data] = []
        var i = data.startIndex
        while data.endIndex - i >= 4 {
            let n = data[i..<i + 4].reduce(0) { $0 << 8 | Int($1) }
            i += 4
            guard data.endIndex - i >= n else { break }
            out.append(Data(data[i..<i + n]))
            i += n
        }
        return out
    }
}

/// Shared notes in the library: which note is shared, where someone else's shared note lives
/// here, and what the notes row on the server holds for it.
///
/// One note, one sync path. A shared note's text goes only through collaboration (sealed changes
/// under the note key). Its row in `notes` stays, so its place in your folders, pinning and
/// deletion sync between your devices as for any note, but it is a pointer (`shared_note_id`)
/// whose text is `placeholder`, never the note's (SyncEngine, `NoteDTO`).
enum SharedNotes {
    /// What a shared note's notes row says instead of its text: an app from before collaboration
    /// shows this, and nothing of the shared text reaches the notes path.
    static func placeholder(title: String) -> String {
        "\(title)\n\nThis note is shared. Update Pinto Notes to open it."
    }

    /// The id of someone else's shared note in your library. Your own id for it, so it never
    /// collides with the owner's note (`notes.id` is unique across accounts), and the same on each
    /// of your devices, so two of them joining make one note, not two.
    static func noteID(for shared: UUID, user: UUID) -> UUID {
        derived("pinto shared note \(shared.uuidString.lowercased()) \(user.uuidString.lowercased())")
    }

    /// "Shared with me": where notes others share with you land. One folder per account, with the
    /// same id on every device. You can move a note out of it; it's an ordinary folder.
    static func sharedWithMeID(user: UUID) -> UUID {
        derived("pinto shared with me \(user.uuidString.lowercased())")
    }

    static let sharedWithMeName = "Shared with me"

    /// A shared note's pointer came in by sync (from another of your devices, or the first time
    /// here): SharedLibrary gets its document.
    @MainActor static var pointerArrived: ((Note) -> Void)?

    private static func derived(_ s: String) -> UUID {
        var b = Array(SHA256.hash(data: Data(s.utf8)).prefix(16))
        b[6] = (b[6] & 0x0F) | 0x50 // version 5 (name-based)
        b[8] = (b[8] & 0x3F) | 0x80 // RFC 4122 variant
        return UUID(uuid: (b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]))
    }

    /// The "Shared with me" folder, made the first time something is shared with you.
    @MainActor
    static func sharedWithMe(_ context: ModelContext, user: UUID) -> Folder {
        let id = sharedWithMeID(user: user)
        if let f = context.folder(id) {
            if f.deletedAt != nil { f.deletedAt = nil; f.touch() }
            return f
        }
        let f = Folder(name: sharedWithMeName)
        f.id = id
        f.sortIndex = -1
        context.insert(f)
        f.touch()
        return f
    }
}

extension ModelContext {
    /// The shared document with this id, if this device has it.
    func sharedDocument(_ id: UUID) -> SharedDocument? {
        try? fetch(FetchDescriptor<SharedDocument>(predicate: #Predicate { $0.id == id })).first
    }

    /// Notes that are shared (pointers), live or in Recently Deleted.
    func sharedNotes() -> [Note] {
        (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.sharedNoteID != nil && $0.deletedAt == nil }))) ?? []
    }
}
