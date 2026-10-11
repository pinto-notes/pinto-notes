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

/// What an Apple Notes import did, for the line shown afterwards.
struct AppleNotesImportSummary: Equatable, Sendable {
    var noteIDs: [UUID] = []
    var alreadyImported = 0
    /// Locked in Apple Notes, so left there.
    var locked = 0
    /// Notes Apple Notes wouldn't hand over, by name.
    var unreadable: [String] = []
    var pictures = 0
    /// Pictures over the size a file can be.
    var picturesLeftOut = 0
    /// Notes' own database was read too: checklists and pins came over as they are.
    var readStore = false
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

    func run(_ notes: [AppleNote], keepFolders: Bool, progress: (Int, Int) -> Void) async -> AppleNotesImportSummary {
        var summary = AppleNotesImportSummary()
        let writer = ImportWriter(context: context)
        let openStore = openStore, body = body
        let store = await Task.detached { Unchecked(openStore()) }.value.value
        defer { store?.close() }
        summary.readStore = store != nil

        for (i, n) in notes.enumerated() {
            progress(i, notes.count)
            if n.locked { summary.locked += 1; continue }
            let titleLine = ImportWriter.titleLine(n.name)
            // The same unchanged note again would only make a copy. Imports before 1.2.5 dated a
            // note by its last edit; now it keeps the day it was written.
            if writer.alreadyImported(titleLine: titleLine, created: n.created ?? n.modified)
                || (n.created != nil && writer.alreadyImported(titleLine: titleLine, created: n.modified)) { continue }
            let id = n.id
            guard let html = try? await Task.detached(operation: { try body(id) }).value else {
                summary.unreadable.append(n.name)
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
            // Folders inside folders come over as they are.
            let path = n.parents + [n.folder.isEmpty ? "Notes" : n.folder]
            let folder = keepFolders ? writer.folder(source: path[0], path: Array(path.dropFirst()), .perSource) : context.defaultFolder()
            guard writer.add(markdown: md, created: n.created ?? n.modified, updated: n.modified, in: folder, files: files,
                             pinned: key.map { store?.pinned.contains($0) == true } ?? false) else {
                summary.unreadable.append(n.name)
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
