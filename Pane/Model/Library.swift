import Foundation
import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// What the sidebar has selected.
enum Scope: Hashable, Codable {
    case all
    case folder(UUID)
    case trash
    /// The notes with a tag (`#work`), or one nested under it (Tags). Picked in the sidebar's
    /// Tags, or by clicking a tag in a note.
    case tag(String)

    /// Where the sidebar should point, given the folders that exist. A folder that's gone
    /// (deleted here, with a parent, or on another device) falls back to All Notes, and with a
    /// single folder there's no All Notes row, so that folder stands in. No scope (the iPhone
    /// folder list is showing) stays that way: selecting a row there without pushing it
    /// leaves the row marked and deaf to taps.
    static func settled(_ scope: Scope?, liveFolders: [UUID]) -> Scope? {
        settled(scope, liveFolders: liveFolders, loose: false, standIn: nil).scope
    }

    /// The same, knowing whether a note is in no folder (an AI's note at the top of the
    /// notebook), when All Notes keeps its row with one folder. `standIn` is the folder put in
    /// for All Notes earlier: while it's still what's shown, All Notes comes back once a loose
    /// note arrives (round 15: a new Mac opened on Notes, 1 note, with the AI's notes synced in
    /// after and nowhere in view). A folder you picked yourself stays.
    static func settled(_ scope: Scope?, liveFolders: [UUID], loose: Bool, standIn: UUID?) -> (scope: Scope?, standIn: UUID?) {
        var s = scope
        var kept = standIn.flatMap { s == .folder($0) ? $0 : nil }
        if case .folder(let id)? = s, !liveFolders.contains(id) { s = .all; kept = nil }
        if loose, kept != nil { return (.all, nil) }
        if s == .all, liveFolders.count == 1, !loose { s = .folder(liveFolders[0]); kept = liveFolders[0] }
        return (s, kept)
    }
}

extension Scope {
    /// The list a note is shown in when it's opened from the iPhone folder list: its folder.
    static func opening(_ note: Note) -> Scope {
        note.folder.map { .folder($0.id) } ?? .all
    }
}

extension UTType {
    static let paneItem = UTType(exportedAs: "dev.emilwagman.pane.item")
}

/// A note, folder or file being dragged inside the app.
struct PaneDragItem: Codable, Transferable {
    enum Kind: String, Codable { case note, folder, file }
    var kind: Kind
    var id: UUID
    /// The rest of a multi-selection dragged together with `id` (notes only).
    var others: [UUID]? = nil

    /// Every item this drag carries, `id` first.
    var ids: [UUID] { [id] + (others ?? []) }

    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .paneItem)
    }
}

/// Mutations on the library. Every change bumps `updatedAt` so sync can find it.
@MainActor
extension ModelContext {
    func allFolders() -> [Folder] {
        ((try? fetch(FetchDescriptor<Folder>())) ?? []).filter { $0.deletedAt == nil }
    }

    func folder(_ id: UUID) -> Folder? {
        try? fetch(FetchDescriptor<Folder>(predicate: #Predicate { $0.id == id })).first
    }

    /// Where an import's notes are: the top folder above the note (Google Keep, not its label's
    /// folder inside it), or All Notes when it has none.
    func importScope(of noteID: UUID) -> Scope {
        guard var folder = note(noteID)?.folder else { return .all }
        while let parent = folder.parent { folder = parent }
        return .folder(folder.id)
    }

    /// What Show Imported Notes opens after an import: its top folder, on the newest note that folder's
    /// list shows (notes in folders inside it aren't in that list). When every note went into an
    /// inner folder, the first note's own folder.
    func importLanding(of ids: [UUID]) -> (scope: Scope, note: UUID?) {
        guard let first = ids.first else { return (.all, nil) }
        let scope = importScope(of: first)
        guard case .folder(let top) = scope else { return (scope, first) }
        let notes = ids.compactMap(note)
        if let shown = notes.filter({ $0.folder?.id == top }).max(by: { $0.updatedAt < $1.updatedAt }) { return (scope, shown.id) }
        guard let newest = notes.max(by: { $0.updatedAt < $1.updatedAt }), let folder = newest.folder else { return (scope, nil) }
        return (.folder(folder.id), newest.id)
    }

    func note(_ id: UUID) -> Note? {
        try? fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.id == id })).first
    }

    /// The folder new notes go into when "All Notes" is selected.
    /// Where a note goes when no folder is chosen: your first folder, never "Shared with me". That
    /// one is made to sort first (sortIndex -1), so new notes in All Notes went into it, where they
    /// read as shared and aren't.
    func defaultFolder() -> Folder {
        if let f = allFolders().filter({ $0.parent == nil && !Self.isSharedWithMe($0) }).min(by: { $0.sortIndex < $1.sortIndex }) { return f }
        let f = Folder(name: "Notes")
        insert(f)
        return f
    }

    /// "Shared with me" (SharedNotes.sharedWithMe): its name, sorted ahead of every folder of yours.
    static func isSharedWithMe(_ f: Folder) -> Bool { f.sortIndex < 0 && f.name == "Shared with me" }

    @discardableResult
    func createNote(in scope: Scope, body: String = "") -> Note {
        let target: Folder
        if case .folder(let id) = scope, let f = folder(id), f.deletedAt == nil { target = f } else { target = defaultFolder() }
        let n = Note(body: body, folder: target)
        insert(n)
        saveOrReport()
        return n
    }

    /// True when a note with this title, dated to this second, is here and not deleted: an
    /// import brought it before. (The Apple Notes import asks ImportWriter, which counts them.)
    func hasImported(title: String, modified: Date) -> Bool {
        let stamp = modified.timeIntervalSinceReferenceDate.rounded()
        return ((try? fetch(FetchDescriptor<Note>())) ?? []).contains {
            $0.trashedAt == nil && $0.deletedAt == nil && $0.title == title
                && $0.createdAt.timeIntervalSinceReferenceDate.rounded() == stamp
        }
    }

    @discardableResult
    func createFolder(named name: String, parent: Folder? = nil) -> Folder {
        let siblings = allFolders().filter { $0.parent?.id == parent?.id }
        let f = Folder(name: name, parent: parent, sortIndex: (siblings.map(\.sortIndex).max() ?? 0) + 1)
        insert(f)
        saveOrReport()
        return f
    }

    /// New Folder on the Mac, as in Notes: a folder named "New Folder" (or "New Folder 2", and on,
    /// when one beside it has that name) made at once, its name then typed in its row. Nil when
    /// the account has as many folders as the server keeps.
    @MainActor func createUntitledFolder(parent: Folder? = nil) -> Folder? {
        let folders = allFolders()
        guard folders.count < Folder.serverLimit else { return nil }
        let beside = folders.filter { $0.parent?.id == parent?.id }.map(\.name)
        return createFolder(named: Folder.untitledName(among: beside), parent: parent)
    }

    /// A folder's name typed in its row: the new name kept and saved, or, empty or the same, the
    /// name it had (Escape never calls this). Whether the name changed.
    @discardableResult
    @MainActor func finishNaming(_ folder: Folder, typed: String) -> Bool {
        guard let name = Folder.typedName(typed, previous: folder.name) else { return false }
        folder.name = name
        folder.touch()
        saveOrReport()
        return true
    }

    /// The note to open at launch: the one you were on, otherwise the one edited last. A blank
    /// note you left open (the app was closed before you typed) is discarded, as leaving it
    /// would have done, instead of opening on an empty page.
    /// `inTrash`: the window reopens on Recently Deleted, where the note you were on was a
    /// deleted one: that one reopens, as the list beside it holds it.
    func noteToReopen(last: UUID?, inTrash: Bool = false) -> Note? {
        func blank(_ n: Note) -> Bool { !n.isLocked && n.body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if inTrash, let last, let n = note(last), n.deletedAt == nil, n.trashedAt != nil { return n }
        if let last, let n = note(last), n.deletedAt == nil, n.trashedAt == nil {
            guard blank(n) else { return n }
            purge(n)
        }
        var newest = FetchDescriptor<Note>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        newest.fetchLimit = 20
        return ((try? fetch(newest)) ?? []).first { $0.deletedAt == nil && $0.trashedAt == nil && !blank($0) }
    }

    /// Sub-notes are gone as a feature (2026-10-28). A note made as one, here before or by an AI
    /// that wrote "Work/Acme/Agenda.md" next to the note "Work/Acme.md", is an ordinary note in a
    /// folder named after the note it was under ("Work/Acme/"), made if there isn't one. The AI
    /// sees the same path as before: a folder and a note with the same name are one place there.
    /// Its text, history, files and links stay as they are; the link in the other note's text
    /// is an ordinary link to it now. Notes under a note that's gone stay where they are, and so
    /// do notes that would need a new folder past the server's folder limit: the server refuses
    /// that folder, and the notes waiting on it would never sync.
    /// Returns how many notes moved.
    @discardableResult
    func foldSubNotesIntoFolders() -> Int {
        let subs = (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.parentID != nil && $0.deletedAt == nil }))) ?? []
        guard !subs.isEmpty else { return 0 }
        // Notes under notes under notes: each one's folder is made after its parent's.
        var depth: [UUID: Int] = [:]
        func depthOf(_ n: Note) -> Int {
            if let d = depth[n.id] { return d }
            var d = 0, cursor = n.parentID
            while let id = cursor, d < 64, let p = self.note(id) { d += 1; cursor = p.parentID }
            depth[n.id] = d
            return d
        }
        var moved = 0
        var liveFolders = allFolders().count
        // Live notes first at each depth: one in Recently Deleted goes into a folder only if a live
        // one needed it (whatever order the store gave them in).
        let ordered = subs.sorted { (depthOf($0), $0.trashedAt == nil ? 0 : 1) < (depthOf($1), $1.trashedAt == nil ? 0 : 1) }
        for child in ordered {
            defer { child.parentID = nil; child.dirty = true; moved += 1 }
            guard let pid = child.parentID, pid != child.id, let parent = note(pid), parent.deletedAt == nil else { continue }
            let name = parent.title.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else { continue }
            let place = parent.folder.flatMap { $0.deletedAt == nil ? $0 : nil }
            let folders = allFolders()
            if let existing = folders.first(where: { $0.deletedAt == nil && $0.parent?.id == place?.id && $0.name.caseInsensitiveCompare(name) == .orderedSame }) {
                child.folder = existing
                continue
            }
            // A note in Recently Deleted needs no new folder: it waits in the one it was in.
            guard child.trashedAt == nil, liveFolders < Folder.serverLimit else { continue }
            let siblings = folders.filter { $0.parent?.id == place?.id }
            let f = Folder(name: name, parent: place, sortIndex: (siblings.map(\.sortIndex).max() ?? 0) + 1)
            insert(f)
            liveFolders += 1
            child.folder = f
        }
        saveOrReport()
        SyncSignal.changed()
        return moved
    }

    /// Notes and files dragged onto Recently Deleted go there; anything already in it stays put.
    func trashDropped(_ items: [PaneDragItem]) {
        for item in items {
            switch item.kind {
            case .note:
                for id in item.ids {
                    if let n = note(id), n.trashedAt == nil { trash(n) }
                }
            case .file:
                for id in item.ids {
                    if let f = attachment(id), f.trashedAt == nil { trash(f) }
                }
            case .folder:
                break
            }
        }
    }

    func trash(_ note: Note) {
        // A blank note has nothing to recover: deleting it removes it for good, as leaving one
        // does, never an empty row in Recently Deleted (Emil, 3 November 2026).
        if Self.isBlank(note) { purge(note); return }
        note.trashedAt = .now
        note.isPinned = false
        note.touchKeepingDate()
        saveOrReport()
        // A shared note deleted, as in Apple Notes: yours stops being shared (and goes to Recently
        // Deleted, as now); someone else's you leave.
        if note.isShared { SharedNotes.trashed?(note) }
        #if os(macOS)
        Charm.noteTrashed()
        #endif
    }

    /// No text and nothing locked: what leaving or deleting a note throws away.
    static func isBlank(_ note: Note) -> Bool {
        !note.isLocked && note.body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// Whether `note` is in `scope`'s list (a folder's list holds its own notes, not those of the
    /// folders inside it). Tags aren't worked out here: nil.
    static func lists(_ scope: Scope, _ note: Note) -> Bool? {
        switch scope {
        case .all: return note.trashedAt == nil
        case .folder(let id): return note.trashedAt == nil && note.folder?.id == id
        case .trash: return note.trashedAt != nil
        case .tag: return nil
        }
    }

    func restore(_ note: Note) {
        note.trashedAt = nil
        if note.folder == nil || note.folder?.deletedAt != nil { note.folder = defaultFolder() }
        note.touchKeepingDate()
        saveOrReport()
    }

    func purge(_ note: Note) {
        note.deletedAt = .now
        note.body = ""
        note.lockedBody = nil
        note.touch()
        saveOrReport()
        // Someone else's shared note deleted for good: you leave it, as in Apple Notes.
        if note.isShared { SharedNotes.purged?(note) }
    }

    /// Deletes several notes the way one is deleted: live notes go to Recently Deleted,
    /// notes already there are deleted for good.
    func remove(_ notes: [Note]) {
        for n in notes where n.deletedAt == nil {
            if n.trashedAt == nil { trash(n) } else { purge(n) }
        }
    }

    /// Delete Note that ⌘Z takes back, as in Notes: the notes return to their folders, pinned
    /// as they were, and `reopen` selects them again (council round 16: ⌘Z after Delete Note did
    /// nothing). A blank note is gone for good and a shared one stops being shared, so neither
    /// has an undo; nor does deleting from Recently Deleted, which asks first. `gone`: what Redo
    /// opens instead, as the delete itself did (round 19: it left the deleted note open).
    func remove(_ notes: [Note], undo: UndoManager?, reopen: (([Note]) -> Void)? = nil, gone: (() -> Void)? = nil) {
        let back = notes.filter { $0.deletedAt == nil && $0.trashedAt == nil && !Self.isBlank($0) && !$0.isShared }
            .map { (note: $0, folder: $0.folder, pinned: $0.isPinned) }
        remove(notes)
        guard let undo, !back.isEmpty else { return }
        undo.registerUndo(withTarget: self) { ctx in
            MainActor.assumeIsolated {
                for b in back where b.note.trashedAt != nil && b.note.deletedAt == nil {
                    b.note.trashedAt = nil
                    if let f = b.folder, f.deletedAt == nil { b.note.folder = f } else { b.note.folder = ctx.defaultFolder() }
                    b.note.isPinned = b.pinned
                    // Deleting and undoing isn't an edit: it goes back to its place in the list.
                    b.note.touchKeepingDate()
                }
                ctx.saveOrReport()
                let notes = back.map(\.note)
                reopen?(notes)
                // Redo deletes them again.
                undo.registerUndo(withTarget: ctx) { ctx in
                    MainActor.assumeIsolated {
                        ctx.remove(notes, undo: undo, reopen: reopen, gone: gone)
                        gone?()
                    }
                }
                undo.setActionName(notes.count == 1 ? "Delete Note" : "Delete Notes")
            }
        }
        undo.setActionName(back.count == 1 ? "Delete Note" : "Delete Notes")
    }

    func move(_ notes: [Note], to folder: Folder) {
        for n in notes { move(n, to: folder) }
    }

    /// A move ⌘Z takes back, into the folders they came from with their dates as they were, and
    /// ⇧⌘Z does again (round 21: a dropped note had no way back but dragging it home).
    /// Returns what the toast's Undo does: the same way back, and the step off ⌘Z's list.
    @discardableResult
    func move(_ notes: [Note], to folder: Folder, undo: UndoManager?) -> () -> Void {
        let back = notes.filter { $0.folder?.id != folder.id || $0.trashedAt != nil }
            .map { (note: $0, folder: $0.folder, trashed: $0.trashedAt) }
        move(notes, to: folder)
        let restore = { @MainActor [self] in
            for b in back {
                b.note.folder = b.folder
                b.note.trashedAt = b.trashed
                b.note.touchKeepingDate()
            }
            saveOrReport()
        }
        guard let undo, !back.isEmpty else { return restore }
        undo.registerUndo(withTarget: self) { ctx in
            MainActor.assumeIsolated {
                restore()
                // The line under the note says what's true now (round 24: "Moved to Ideas" stayed
                // after ⌘Z had taken the note home).
                NotificationCenter.default.post(name: .paneNotesMoved, object: Self.movedBackLine(back.map { $0.folder?.name }))
                undo.registerUndo(withTarget: ctx) { again in
                    MainActor.assumeIsolated {
                        let reversal = again.move(back.map(\.note), to: folder, undo: undo)
                        NotificationCenter.default.post(name: .paneNotesMoved, object: "Moved to \(folder.name)", userInfo: ["undo": reversal])
                    }
                }
            }
        }
        undo.setActionName("Move")
        return { [self] in
            restore()
            undo.removeAllActions(withTarget: self)
        }
    }

    /// One folder they all went back to is named; otherwise it just says they went back.
    nonisolated static func movedBackLine(_ folders: [String?]) -> String {
        let names = Set(folders)
        if names.count == 1, let only = names.first, let name = only { return "Moved back to \(name)" }
        return "Moved back"
    }

    func togglePin(_ note: Note) {
        note.isPinned.toggle()
        note.touchKeepingDate()
        saveOrReport()
    }

    /// Into `folder`, out of Recently Deleted if it was there (also into the folder it was in).
    func move(_ note: Note, to folder: Folder) {
        guard note.folder?.id != folder.id || note.trashedAt != nil else { return }
        note.folder = folder
        note.trashedAt = nil
        note.touchKeepingDate()
        saveOrReport()
    }

    /// Nests `folder` inside `parent` (nil = top level), refusing cycles.
    func move(_ folder: Folder, into parent: Folder?) {
        var cursor = parent
        while let c = cursor {
            if c.id == folder.id { return }
            cursor = c.parent
        }
        guard folder.parent?.id != parent?.id else { return }
        // Last among its new siblings, as a new folder is: keeping its old index could put it
        // first at the top level, where the first folder is where new notes go (`defaultFolder`).
        let siblings = allFolders().filter { $0.parent?.id == parent?.id && $0.id != folder.id }
        folder.sortIndex = (siblings.map(\.sortIndex).max() ?? 0) + 1
        folder.parent = parent
        folder.touch()
        saveOrReport()
    }

    /// A copy of `folder` right after it, named "<name> copy" ("<name> copy 2" when that's taken):
    /// its notes and the folders inside it, each a new note or folder with a new id, marked for
    /// sync as new ones are. The notes keep their dates, so the copy lists them in the same order.
    /// Files kept in the folder on their own stay with the original (copying them means copying
    /// their bytes in storage).
    @discardableResult
    func duplicate(_ folder: Folder) -> Folder {
        let row = siblings(of: folder)
        let taken = Set(row.map { $0.name.lowercased() })
        var name = "\(folder.name) copy", n = 2
        while taken.contains(name.lowercased()) { name = "\(folder.name) copy \(n)"; n += 1 }
        // Halfway to the next folder beside it: right after it, and no other folder changes.
        let next = row.first { $0.id != folder.id && $0.sortIndex > folder.sortIndex }
        let index = next.map { (folder.sortIndex + $0.sortIndex) / 2 } ?? folder.sortIndex + 1
        var seen: Set<UUID> = []
        func copy(_ f: Folder, name: String, parent: Folder?, sortIndex: Double, depth: Int) -> Folder {
            let made = Folder(name: name, parent: parent, sortIndex: sortIndex)
            insert(made)
            for note in f.liveNotes {
                let c = Note(body: note.body, folder: made)
                c.lockedBody = note.lockedBody
                c.isPinned = note.isPinned
                c.createdAt = note.createdAt
                c.updatedAt = note.updatedAt
                insert(c)
            }
            // A loop of folders (a bad sync) can't copy forever.
            guard depth < 32, seen.insert(f.id).inserted else { return made }
            for child in f.liveChildren { _ = copy(child, name: child.name, parent: made, sortIndex: child.sortIndex, depth: depth + 1) }
            return made
        }
        let made = copy(folder, name: name, parent: folder.parent, sortIndex: index, depth: 0)
        saveOrReport()
        SyncSignal.changed()
        return made
    }

    /// The live folders beside `folder` (its parent's, or the top level), in their order, itself included.
    func siblings(of folder: Folder) -> [Folder] {
        allFolders().filter { $0.parent?.id == folder.parent?.id }.sorted { $0.sortIndex < $1.sortIndex }
    }

    /// Puts `folder` at `index` among its siblings (iPhone's Edit, a row dragged by its handle). At
    /// the top level the first folder stays first: it is Notes, where new notes go
    /// (`defaultFolder`), and it can't be moved, as in Notes. The order is the folders'
    /// `sortIndex`, which syncs; only the folders whose index changes are marked for sync.
    func reorder(_ folder: Folder, to index: Int) {
        var row = siblings(of: folder)
        guard let from = row.firstIndex(where: { $0.id == folder.id }) else { return }
        let pinned = folder.parent == nil ? 1 : 0
        guard from >= pinned else { return }
        row.remove(at: from)
        row.insert(folder, at: min(max(index, pinned), row.count))
        var changed = false
        for (i, f) in row.enumerated() where f.sortIndex != Double(i + 1) {
            f.sortIndex = Double(i + 1)
            f.touch()
            changed = true
        }
        if changed { saveOrReport() }
    }

    /// Deleting a folder sends its notes and files (and sub-folders') to Recently Deleted, and the
    /// deletion goes up with the next sync.
    func trash(_ folder: Folder) {
        // Marked first, so a loop of folders can't recurse forever.
        folder.deletedAt = .now
        folder.touch()
        for child in folder.liveChildren { trash(child) }
        for note in folder.liveNotes { trash(note) }
        for file in files(in: folder.id) { trash(file) }
        saveOrReport()
    }

    /// Removes a folder from this device for good, without telling the server (SwiftData's delete).
    func erase(_ folder: Folder) {
        func remove<T: PersistentModel>(_ m: T) { delete(m) }
        remove(folder)
    }

    /// Apple Notes keeps deleted notes for 30 days.
    /// At launch: the store picks the notes, instead of every note being read (with 20,000 notes,
    /// most of a second before the window).
    func purgeExpiredTrash() {
        let cutoff = Date.now.addingTimeInterval(-30 * 24 * 3600)
        let expired = #Predicate<Note> { $0.deletedAt == nil && $0.trashedAt != nil && ($0.trashedAt ?? cutoff) < cutoff }
        let old = (try? fetch(FetchDescriptor<Note>(predicate: expired))) ?? []
        old.forEach(purge)
        purgeExpiredTrashedFiles()
    }

    /// Imports dropped files: markdown and text become notes; anything else (PDFs,
    /// spreadsheets, images…) is kept in the folder as a file of its own. Returns what was made.
    @discardableResult
    func importFiles(_ urls: [URL], into scope: Scope) -> [UUID] {
        var made: [UUID] = []
        for url in urls {
            let ext = url.pathExtension.lowercased()
            // A folder from Finder: a folder here, with its files.
            if (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true, !FileKinds.isPackageDocument(url) {
                let parent: Folder? = { if case .folder(let id) = scope { return folder(id) } else { return nil } }()
                made += addFolder(url, into: parent).map(\.id)
                continue
            }
            if ["md", "markdown", "txt", "text"].contains(ext) {
                let access = url.startAccessingSecurityScopedResource()
                defer { if access { url.stopAccessingSecurityScopedResource() } }
                guard let text = try? String(contentsOf: url, encoding: .utf8) else { continue }
                let name = url.deletingPathExtension().lastPathComponent
                let body = NoteText.title(of: text) == name || text.hasPrefix("# ") ? text : "# \(name)\n\n\(text)"
                made.append(createNote(in: scope, body: body).id)
            } else {
                made += addFiles([url], to: folderForFiles(scope)).map(\.id)
            }
        }
        saveOrReport()
        return made
    }

    func attachment(_ id: UUID) -> Attachment? {
        try? fetch(FetchDescriptor<Attachment>(predicate: #Predicate { $0.id == id })).first
    }

    /// Copies files into Pane for embedding in a note (kinds the app can't show are refused).
    func addAttachments(_ urls: [URL]) -> [Attachment] {
        let files = FileKinds.accept(urls).compactMap { try? FileStore.importFile(at: $0) }
        files.forEach(insert)
        saveOrReport()
        SyncSignal.changed()
        return files
    }
}

/// What the list groups by date: notes, and files kept in folders.
protocol DatedListItem {
    /// When it was last edited: the list's own order.
    var listDate: Date { get }
    var pinnedInList: Bool { get }
    /// For the other orders the list can be put in (`ListOrder`).
    var listCreated: Date { get }
    var listTitle: String { get }
}

extension Note: DatedListItem {
    var listDate: Date { updatedAt }
    var pinnedInList: Bool { isPinned && trashedAt == nil }
    var listCreated: Date { createdAt }
    var listTitle: String { title }
}

extension Attachment: DatedListItem {
    var pinnedInList: Bool { false }
    var listCreated: Date { createdAt }
    var listTitle: String { filename }
}

/// Grouping of the note list by recency, like Apple Notes.
enum DateBucket {
    /// Apple Notes' heading for the best matches of a search.
    static let topHits = "Top Hits"

    /// The items `isTopHit` picks moved out of their sections into "Top Hits", first: a search for
    /// a note's whole title finds it at the top, however old it is (round 7: "Lisbon 7" came after
    /// the newer "Lisbon 7 day plan"). Nothing picked, nothing changes.
    static func withTopHits<Item>(_ sections: [(String, [Item])], isTopHit: (Item) -> Bool) -> [(String, [Item])] {
        var hits: [Item] = []
        let rest = sections.compactMap { name, items -> (String, [Item])? in
            let kept = items.filter { item in
                guard isTopHit(item) else { return true }
                hits.append(item)
                return false
            }
            return kept.isEmpty ? nil : (name, kept)
        }
        return hits.isEmpty ? sections : [(topHits, hits)] + rest
    }

    /// The query is the whole title, as search folds them (case and accents).
    static func isWholeTitle(_ title: String, query: String) -> Bool {
        let q = query.trimmingCharacters(in: .whitespaces)
        return !q.isEmpty && title.trimmingCharacters(in: .whitespaces).compare(q, options: [.caseInsensitive, .diacriticInsensitive]) == .orderedSame
    }

    static func sections<Item: DatedListItem>(_ notes: [Item], now: Date = .now, calendar: Calendar = .current) -> [(String, [Item])] {
        // Each date read once: model properties aren't free, and a sort reads them often.
        sections(newestFirst: notes.map { ($0, $0.listDate) }.sorted { $0.1 > $1.1 }, now: now, calendar: calendar)
    }

    /// The same, for items already in order, newest first, each with its date: nothing is sorted
    /// or read again (the list hands over its notes in this order already).
    static func sections<Item: DatedListItem>(newestFirst dated: [(Item, Date)], now: Date = .now, calendar: Calendar = .current) -> [(String, [Item])] {
        sections(dated, oldestFirst: false, now: now, calendar: calendar)
    }

    /// The list in the order it was chosen to be in (`ListOrder`), for items already in that order.
    /// By date: the same headings, on the date the list is sorted by, running the way the list
    /// does. By title, or with grouping off: the pinned notes, then the rest in one run.
    static func sections<Item: DatedListItem>(ordered items: [Item], by order: ListOrder, now: Date = .now, calendar: Calendar = .current) -> [(String, [Item])] {
        guard !order.showsDateHeadings else {
            return sections(items.map { ($0, order.date(of: $0)) }, oldestFirst: order.reversed, now: now, calendar: calendar)
        }
        var pinned: [Item] = [], rest: [Item] = []
        rest.reserveCapacity(items.count)
        for n in items { if n.pinnedInList { pinned.append(n) } else { rest.append(n) } }
        if pinned.isEmpty { return rest.isEmpty ? [] : [(unheaded, rest)] }
        return rest.isEmpty ? [("Pinned", pinned)] : [("Pinned", pinned), ("Notes", rest)]
    }

    /// The name of a run of the list that has no heading.
    static let unheaded = ""

    private static func sections<Item: DatedListItem>(_ dated: [(Item, Date)], oldestFirst: Bool, now: Date, calendar: Calendar) -> [(String, [Item])] {
        var pinned: [Item] = []
        var groups: [(key: String, order: Date, notes: [Item])] = []
        var index: [String: Int] = [:]
        let today = calendar.startOfDay(for: now)
        func daysBack(_ n: Int) -> Date { calendar.date(byAdding: .day, value: -n, to: today) ?? today.addingTimeInterval(Double(-n) * 86400) }
        // Day boundaries once, then plain date comparisons per note.
        let yesterday = daysBack(1), week = daysBack(7), month30 = daysBack(30)
        var monthKeys: [Int: (String, Date)] = [:]
        let thisYear = calendar.component(.year, from: now)
        for (n, d) in dated {
            if n.pinnedInList { pinned.append(n); continue }
            let key: String
            let order: Date
            if d >= today { key = "Today"; order = today }
            else if d >= yesterday { key = "Yesterday"; order = yesterday }
            else if d >= week { key = "Previous 7 Days"; order = daysBack(2) }
            else if d >= month30 { key = "Previous 30 Days"; order = daysBack(8) }
            else {
                let comps = calendar.dateComponents([.year, .month], from: d)
                let k = (comps.year ?? 0) * 100 + (comps.month ?? 0)
                if let known = monthKeys[k] { (key, order) = known } else {
                    let month = calendar.date(from: comps) ?? d
                    let label = comps.year == thisYear ? month.formatted(.dateTime.month(.wide).locale(locale)) : month.formatted(.dateTime.month(.wide).year().locale(locale))
                    monthKeys[k] = (label, month)
                    (key, order) = (label, month)
                }
            }
            if let i = index[key] { groups[i].notes.append(n) } else { index[key] = groups.count; groups.append((key, order, [n])) }
        }
        var result: [(String, [Item])] = []
        if !pinned.isEmpty { result.append(("Pinned", pinned)) }
        result += groups.sorted { oldestFirst ? $0.order < $1.order : $0.order > $1.order }.map { ($0.key, $0.notes) }
        return result
    }

    /// The locale dates are written in: the person's own. Captures pin it (en_US) so every picture reads the same.
    nonisolated(unsafe) static var locale: Locale = .autoupdatingCurrent {
        didSet { rowDates = [:] }
    }

    nonisolated(unsafe) private static var rowDates: [Int: String] = [:]
    nonisolated(unsafe) private static var rowDatesDay = Date.distantPast

    /// Row date: time today, "Yesterday", weekday this week, else a short date.
    /// Remembered per minute (today) or per day, since the list asks for every row.
    static func rowDate(_ d: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        let today = calendar.startOfDay(for: now)
        if today != rowDatesDay { rowDates = [:]; rowDatesDay = today }
        let isToday = d >= today && d < today.addingTimeInterval(86400 + 3600)
        let key = isToday ? Int(d.timeIntervalSince1970 / 60) : -Int(calendar.startOfDay(for: d).timeIntervalSince1970 / 86400) - 1
        if let s = rowDates[key] { return s }
        let s: String
        if calendar.isDateInToday(d) { s = d.formatted(Date.FormatStyle(date: .omitted, time: .shortened).locale(locale)) }
        else if calendar.isDateInYesterday(d) { s = "Yesterday" }
        else {
            let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: d), to: today).day ?? 99
            s = days < 7 ? d.formatted(.dateTime.weekday(.wide).locale(locale)) : d.formatted(Date.FormatStyle(date: .numeric, time: .omitted).locale(locale))
        }
        rowDates[key] = s
        return s
    }

    /// Editor header: "27 September 2026 at 16:02".
    static func header(_ d: Date) -> String {
        d.formatted(.dateTime.day().month(.wide).year().hour().minute().locale(locale))
    }
}

