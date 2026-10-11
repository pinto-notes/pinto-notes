#if os(macOS)
import Foundation
import SwiftData
import UniformTypeIdentifiers

/// One note in Apple Notes, as listed for the import picker.
struct AppleNote: Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let folder: String
    let modified: Date
    var created: Date?
    /// Locked in Apple Notes: its text can't be read, so it's left where it is.
    var locked = false
    /// The folders its folder is inside, from the top.
    var parents: [String] = []
    /// The account it's in ("iCloud", "On My Mac", "Google").
    var account = ""
    /// Where its folder comes in Apple Notes' own list of folders.
    var folderOrder = 0

    /// Its folder from the top, by name. A name is never split: "Claude Code / Notes" is one folder.
    var path: [String] { parents + [folder.isEmpty ? "Notes" : folder] }

    /// Each note once. Should Notes list a note under a folder and again under the folder inside
    /// it, the deeper place is the note's own.
    static func unique(_ notes: [AppleNote]) -> [AppleNote] {
        var best: [String: AppleNote] = [:]
        var order: [String] = []
        for n in notes {
            if let had = best[n.id] {
                if n.parents.count > had.parents.count { best[n.id] = n }
            } else {
                best[n.id] = n
                order.append(n.id)
            }
        }
        return order.compactMap { best[$0] }
    }
}

/// Everything Apple Notes holds, as the import lists it.
struct AppleNotesListing: Equatable, Sendable {
    /// Every note of every account, outside Recently Deleted.
    var notes: [AppleNote] = []
    /// The account new notes go to in Apple Notes: its folders come in at the top here too.
    var mainAccount = ""
    /// Folders Apple Notes wouldn't list the notes of, and what it said. Never dropped quietly.
    var unreadFolders: [Unread] = []

    struct Unread: Equatable, Sendable {
        var folder: String
        var why: String
    }

    var accounts: [String] {
        var seen = Set<String>()
        return notes.map(\.account).filter { seen.insert($0).inserted }
    }

    /// Where a note goes here: its folders as in Apple Notes. With several accounts, the folders
    /// of the others sit inside a folder named after their account, so two "Notes" stay two.
    func destination(of note: AppleNote) -> [String] {
        accounts.count > 1 && note.account != mainAccount && !note.account.isEmpty ? [note.account] + note.path : note.path
    }

    /// The same, as the sheet's group heading: "Brain", "Recipes › Italian", "Google › Notes".
    func heading(of note: AppleNote) -> String {
        destination(of: note).joined(separator: " \u{203A} ")
    }
}

extension AppleNotesListing {
    /// The notes in the sheet's groups: one per folder, in Apple Notes' own order, every note in
    /// exactly one. `shown` narrows it (a search); nil is everything.
    func groups(_ shown: [AppleNote]? = nil) -> [(heading: String, notes: [AppleNote])] {
        var order: [String] = []
        var map: [String: [AppleNote]] = [:]
        for n in (shown ?? notes).sorted(by: { ($0.folderOrder, $1.modified) < ($1.folderOrder, $0.modified) }) {
            let h = heading(of: n)
            if map[h] == nil { order.append(h) }
            map[h, default: []].append(n)
        }
        return order.map { ($0, map[$0]!) }
    }

    /// The live notes here, as the import tells an earlier import's note by: title and date.
    @MainActor static func keysOfNotes(in context: ModelContext) -> Set<String> {
        Set(((try? context.fetch(FetchDescriptor<Note>())) ?? []).filter { $0.deletedAt == nil && $0.trashedAt == nil }
            .map { ImportWriter.key(title: $0.title, created: $0.createdAt) })
    }

    /// True when this note was brought in before (dated by the day it was written, or by its
    /// last edit as 1.2.4 did), wherever its folder is.
    @MainActor static func isHere(_ note: AppleNote, keys: Set<String>) -> Bool {
        let title = NoteText.title(of: ImportWriter.titleLine(note.name))
        return keys.contains(ImportWriter.key(title: title, created: note.created ?? note.modified))
            || keys.contains(ImportWriter.key(title: title, created: note.modified))
    }

    /// What is picked when the sheet opens: every note that can come and isn't here yet.
    @MainActor func pickedAtFirst(keys: Set<String>) -> Set<String> {
        Set(notes.filter { !$0.locked && !Self.isHere($0, keys: keys) }.map(\.id))
    }
}

/// What an Apple Notes import did, for the line shown afterwards.
struct AppleNotesImportSummary: Equatable, Sendable {
    var noteIDs: [UUID] = []
    /// How many notes were asked for (the picked ones, and the locked ones nobody could pick).
    var asked = 0
    var alreadyImported = 0
    /// Notes that didn't come over, each with why.
    var notImported: [Left] = []

    struct Left: Equatable, Sendable {
        var name: String
        var why: String
    }
    var pictures = 0
    /// Pictures over the size a file can be.
    var picturesLeftOut = 0
    /// Notes' own database was read too: checklists and pins came over as they are.
    var readStore = false
}

extension AppleNotesImportSummary {
    static let lockedWhy = "Locked in Apple Notes"
    static let unreadableWhy = "Apple Notes didn't hand it over"
    static let tooLongWhy = "Longer than a note can be"

    /// What the window says once the sheet has closed, and the sheet's first line when it stays:
    /// "Imported 18 notes", "Imported 31 of 35 notes · 2 already here".
    func line(locale: Locale = .current) -> String {
        func n(_ count: Int) -> String { count.formatted(.number.locale(locale)) }
        let made = noteIDs.count
        var first: String
        if made == asked || asked == 0 {
            first = made == 0 ? "No new notes imported" : "Imported \(n(made)) \(made == 1 ? "note" : "notes")"
        } else {
            first = made == 0 && notImported.isEmpty ? "No new notes imported" : "Imported \(n(made)) of \(n(asked)) notes"
        }
        var parts = [first]
        if alreadyImported > 0 { parts.append("\(n(alreadyImported)) already here") }
        if picturesLeftOut > 0 { parts.append("\(n(picturesLeftOut)) \(picturesLeftOut == 1 ? "picture" : "pictures") too big to keep") }
        return parts.joined(separator: " \u{00B7} ")
    }

    /// "4 could not be imported:", above their names.
    func leftLine(locale: Locale = .current) -> String? {
        guard !notImported.isEmpty else { return nil }
        return "\(notImported.count.formatted(.number.locale(locale))) could not be imported:"
    }
}

/// Copies picked Apple Notes in. Text comes from AppleScript (`body`, as HTML); what that HTML
/// can't say (checklists, ticks, numbered lists after dashed ones, pins) comes from Notes'
/// database when this app may already read it.
@MainActor
struct AppleNotesImporter {
    let context: ModelContext
    /// The HTML of the note with this AppleScript id.
    var body: @Sendable (String) throws -> String = { try AppleNotesBridge.body(of: $0) }
    var openStore: @Sendable () -> AppleNoteStore? = { ApplePins.isAvailable ? try? AppleNoteStore.open().get() : nil }

    /// `listing` says where each note's folder goes (accounts, nesting); without one, a note goes
    /// by its own path.
    func run(_ notes: [AppleNote], listing: AppleNotesListing? = nil, keepFolders: Bool, progress: (Int, Int) -> Void) async -> AppleNotesImportSummary {
        var summary = AppleNotesImportSummary()
        summary.asked = notes.count
        let writer = ImportWriter(context: context)
        func destination(_ n: AppleNote) -> [String] { listing?.destination(of: n) ?? n.path }
        func folder(_ n: AppleNote) -> Folder {
            let path = destination(n)
            return keepFolders ? writer.folder(source: path[0], path: Array(path.dropFirst()), .perSource) : context.defaultFolder()
        }
        // Folders are made in Apple Notes' own order, before any note asks for one, so they
        // stand here as they stood there. One that has only locked notes isn't made.
        if keepFolders {
            var seen = Set<[String]>()
            for n in notes.sorted(by: { $0.folderOrder < $1.folderOrder }) where !n.locked && seen.insert(destination(n)).inserted { _ = folder(n) }
        }
        let openStore = openStore, body = body
        let store = await Task.detached { Unchecked(openStore()) }.value.value
        defer { store?.close() }
        summary.readStore = store != nil

        for (i, n) in notes.enumerated() {
            progress(i, notes.count)
            if n.locked { summary.notImported.append(.init(name: n.name, why: AppleNotesImportSummary.lockedWhy)); continue }
            let titleLine = ImportWriter.titleLine(n.name)
            // The same unchanged note again would only make a copy. Imports before 1.2.5 dated a
            // note by its last edit; now it keeps the day it was written.
            if writer.alreadyImported(titleLine: titleLine, created: n.created ?? n.modified)
                || (n.created != nil && writer.alreadyImported(titleLine: titleLine, created: n.modified)) { continue }
            let id = n.id
            let html: String
            do {
                html = try await Task.detached(operation: { try body(id) }).value
            } catch {
                // Named with what Apple Notes said, never dropped quietly.
                let said = error.localizedDescription.trimmingCharacters(in: .whitespacesAndNewlines)
                summary.notImported.append(.init(name: n.name, why: said.isEmpty ? AppleNotesImportSummary.unreadableWhy : "\(AppleNotesImportSummary.unreadableWhy): \(said)"))
                continue
            }
            let key = ApplePins.primaryKey(fromNoteID: n.id)
            let (marked, pictures) = Self.takePictures(from: html)
            var md = RichPaste.clean(RichTextToMarkdown.markdown(
                fromHTML: marked, keepBlankLines: true, listItems: key.flatMap { store?.listItems(ofNote: $0) } ?? []))
            if let key, let links = store?.links(ofNote: key) { md = Self.name(links, in: md) }
            var files: [Attachment] = []
            for (token, picture) in pictures {
                var line = ""
                if let a = attachment(picture, writer: writer) {
                    files.append(a)
                    line = a.markdown
                } else {
                    summary.picturesLeftOut += 1
                }
                md = Self.place(line, for: token, in: md)
            }
            if md.isEmpty { md = titleLine }
            guard writer.add(markdown: md, created: n.created ?? n.modified, updated: n.modified, in: folder(n), files: files,
                             pinned: key.map { store?.pinned.contains($0) == true } ?? false) else {
                summary.notImported.append(.init(name: n.name, why: AppleNotesImportSummary.tooLongWhy))
                continue
            }
            summary.pictures += files.count
        }
        let written = writer.finish()
        summary.noteIDs = written.noteIDs
        summary.alreadyImported = written.alreadyImported
        return summary
    }

    // MARK: Links

    /// Gives each named link its address back: the next place its words stand, in order, where
    /// they aren't a link already. Words set partly in another style are left as they are.
    nonisolated static func name(_ links: [AppleNoteText.Link], in markdown: String) -> String {
        var md = markdown
        var from = md.startIndex
        for link in links {
            let words = RichTextToMarkdown.escape(link.text.trimmingCharacters(in: .whitespacesAndNewlines))
            guard !words.isEmpty, !words.contains("\n") else { continue }
            var search = from
            while let r = md.range(of: words, range: search..<md.endIndex) {
                if r.lowerBound > md.startIndex, md[md.index(before: r.lowerBound)] == "[" { search = r.upperBound; continue }
                let linked = "[\(words)](\(link.url.replacingOccurrences(of: ")", with: "%29").replacingOccurrences(of: " ", with: "%20")))"
                let start = md.distance(from: md.startIndex, to: r.lowerBound)
                md.replaceSubrange(r, with: linked)
                from = md.index(md.startIndex, offsetBy: start + linked.count)
                break
            }
        }
        return md
    }

    // MARK: Pictures

    struct Picture: Equatable {
        var data: Data
        var type: UTType
    }

    /// Notes hands a picture over inside the HTML, as a `data:` address. Each is cut out and a
    /// word left in its place, so the text converter never sees megabytes of base64.
    nonisolated static func takePictures(from html: String) -> (html: String, pictures: [(token: String, picture: Picture)]) {
        guard let re = try? NSRegularExpression(pattern: #"<img\b[^>]*?\bsrc="data:(image/[a-zA-Z0-9.+-]+);base64,([^"]*)"[^>]*>"#, options: [.caseInsensitive]) else { return (html, []) }
        let ns = html as NSString
        var out = "", last = 0
        var pictures: [(String, Picture)] = []
        for m in re.matches(in: html, range: NSRange(location: 0, length: ns.length)) {
            out += ns.substring(with: NSRange(location: last, length: m.range.location - last))
            last = NSMaxRange(m.range)
            guard let data = Data(base64Encoded: ns.substring(with: m.range(at: 2)), options: .ignoreUnknownCharacters), !data.isEmpty else { continue }
            let token = "PINTOPICTURE\(pictures.count)PLACE"
            pictures.append((token, Picture(data: data, type: UTType(mimeType: ns.substring(with: m.range(at: 1))) ?? .png)))
            out += token
        }
        out += ns.substring(from: last)
        return (out, pictures)
    }

    /// Puts a picture's line where its word was: on a line of its own, as a file must be.
    nonisolated static func place(_ line: String, for token: String, in markdown: String) -> String {
        var lines: [String] = []
        for l in markdown.components(separatedBy: "\n") {
            guard let r = l.range(of: token) else { lines.append(l); continue }
            let before = l[..<r.lowerBound].trimmingCharacters(in: .whitespaces)
            let after = l[r.upperBound...].trimmingCharacters(in: .whitespaces)
            if !before.isEmpty { lines.append(before) }
            if !line.isEmpty { lines.append(line) }
            if !after.isEmpty { lines.append(after) }
        }
        return lines.joined(separator: "\n")
    }

    private func attachment(_ picture: Picture, writer: ImportWriter) -> Attachment? {
        let scratch = FileManager.default.temporaryDirectory.appending(path: "pinto-import-\(UUID().uuidString)")
        guard (try? picture.data.write(to: scratch)) != nil else { return nil }
        defer { try? FileManager.default.removeItem(at: scratch) }
        return writer.attachment(from: scratch, filename: nil, type: picture.type, move: true)
    }
}

/// Carries a value that is handed over once, from the thread that made it.
private struct Unchecked<T>: @unchecked Sendable {
    let value: T
    init(_ value: T) { self.value = value }
}
#endif
