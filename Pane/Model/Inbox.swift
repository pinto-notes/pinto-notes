import Foundation

/// Things shared into Amber Notes from other apps, waiting for the app to file them.
/// The share extension writes items into the shared App Group container; the app
/// turns each into a note the next time it's active.
enum Inbox {
    static let appGroup = AppIdentity.appGroup

    struct Item: Codable {
        var id = UUID()
        var markdown: String
        /// Files copied next to item.json, embedded at the end of the note.
        var files: [String] = []
        var createdAt = Date()
        /// The folder picked in the share sheet. Files shared without text are kept there on
        /// their own; text becomes a note there. Nil: the default folder.
        var folder: UUID?
        /// The note picked under Add to (2026-11-04): what was shared goes at its end instead of
        /// into a new note. Nil: a new note.
        var note: UUID?
    }

    /// A folder the share sheet offers: the app lists them here each time it opens or leaves.
    struct FolderChoice: Codable, Hashable, Identifiable {
        var id: UUID
        /// Its path, "Work/Clients".
        var name: String
    }

    static var root: URL? { rootOverride ?? groupRoot }

    /// The inbox in the App Group container. Only where there is a share extension to fill it:
    /// on iPhone and iPad. No Mac build has one, and the Mac download has no app group either
    /// (it isn't sandboxed), so reaching for the group's folder there made macOS ask, at the
    /// first launch, whether Pinto Notes may "access data from other apps".
    static var groupRoot: URL? {
        #if os(macOS)
        nil
        #else
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)?.appending(path: "Inbox", directoryHint: .isDirectory)
        #endif
    }

    /// The group's settings, shared with the share extension. None on the Mac (see `groupRoot`).
    static var groupDefaults: UserDefaults? {
        #if os(macOS)
        nil
        #else
        UserDefaults(suiteName: appGroup)
        #endif
    }

    /// The share extension has written here at least once, on this device: the folder is made on
    /// its first use and stays after the items in it are filed.
    static var everUsed: Bool {
        guard let root else { return false }
        return FileManager.default.fileExists(atPath: root.path(percentEncoded: false))
    }

    /// Tests point the inbox at a temporary folder (unsigned test builds have no app group).
    nonisolated(unsafe) static var rootOverride: URL?

    /// Writes an item (called by the share extension).
    static func add(markdown: String, files: [URL], folder: UUID? = nil, note: UUID? = nil) throws {
        guard let root else { throw CocoaError(.fileNoSuchFile) }
        var item = Item(markdown: markdown, folder: folder, note: note)
        let dir = root.appending(path: item.id.uuidString, directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for f in files {
            let dest = dir.appending(path: f.lastPathComponent)
            try? FileManager.default.removeItem(at: dest)
            try FileManager.default.copyItem(at: f, to: dest)
            item.files.append(f.lastPathComponent)
        }
        try JSONEncoder().encode(item).write(to: dir.appending(path: "item.json"), options: .atomic)
    }

    /// Everything waiting, oldest first, with each item's folder.
    static func pending() -> [(Item, URL)] {
        guard let root, let dirs = try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil) else { return [] }
        return dirs.compactMap { dir in
            guard let data = try? Data(contentsOf: dir.appending(path: "item.json")),
                  let item = try? JSONDecoder().decode(Item.self, from: data) else { return nil }
            return (item, dir)
        }.sorted { $0.0.createdAt < $1.0.createdAt }
    }

    static func remove(_ dir: URL) { try? FileManager.default.removeItem(at: dir) }

    /// Where the app leaves its folder list for the share sheet, next to the inbox.
    private static var foldersFile: URL? { root?.deletingLastPathComponent().appending(path: "Folders.json") }

    static func saveFolders(_ folders: [FolderChoice]) {
        guard let url = foldersFile, folders != self.folders() else { return }
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? JSONEncoder().encode(folders).write(to: url, options: .atomic)
    }

    static func folders() -> [FolderChoice] {
        guard let url = foldersFile, let data = try? Data(contentsOf: url) else { return [] }
        return (try? JSONDecoder().decode([FolderChoice].self, from: data)) ?? []
    }

    /// The folder last picked in the share sheet.
    static var lastFolder: UUID? {
        get { groupDefaults?.string(forKey: "shareFolder").flatMap(UUID.init(uuidString:)) }
        set { groupDefaults?.set(newValue?.uuidString, forKey: "shareFolder") }
    }
}

/// What the share sheet says. Items wait in the App Group until Pinto Notes next opens, so it
/// says "Saved", not "Added", and when it goes in (persona council round 5).
enum InboxCopy {
    static let save = "Save"
    static let saved = "Saved"
    static let add = "Add"
    static let addTo = "Add to"
    static let newNote = "New note"
    static let search = "Search notes"
    static func noMatch(_ q: String) -> String { "No note called \u{201C}\(q)\u{201D}" }

    /// Under Add to, once a note is picked.
    static let addToFooter = "Pinto Notes adds it at the end the next time it opens. If the note can\u{2019}t take it (it\u{2019}s locked, deleted, view only, or shared and this has files), it becomes a new note."

    /// After Save.
    static func done(note: String?) -> String {
        guard let note else { return "Saved. It\u{2019}s in your notes the next time Pinto Notes opens." }
        return "Saved for \(note). Pinto Notes adds it the next time it opens."
    }
}

/// A note's markdown as people read it, for sending a copy and for previews: no "#", "**" or
/// "- [ ]", checklists as ○ and ✓, bullets as •, links as their words (Emil, 4 November 2026: the
/// share sheet showed "## Plan" and "- [ ]").
enum ReadableText {
    static func from(markdown: String) -> String {
        markdown.components(separatedBy: "\n")
            .filter { !isTableRule($0) }
            .map(line).joined(separator: "\n")
    }

    /// A table's "| --- | :---: |" line, which says nothing to a reader.
    static func isTableRule(_ s: String) -> Bool {
        let t = s.trimmingCharacters(in: .whitespaces)
        return t.contains("-") && t.contains("|") && t.allSatisfy { "-:| ".contains($0) }
    }

    static func line(_ raw: String) -> String {
        var s = Substring(raw)
        let indent = s.prefix { $0 == " " || $0 == "\t" }
        s = s.dropFirst(indent.count)
        let pad = String(repeating: "  ", count: indent.replacingOccurrences(of: "\t", with: "  ").count / 2)
        var lead = ""
        if let m = s.firstMatch(of: /^#{1,6}\s+/) { s = s[m.range.upperBound...] }
        else if let m = s.firstMatch(of: /^[-*+]\s+\[( |x|X)\]\s+/) {
            lead = m.output.1 == " " ? "\u{25CB} " : "\u{2713} "
            s = s[m.range.upperBound...]
        } else if let m = s.firstMatch(of: /^[-*+]\s+/) { lead = "\u{2022} "; s = s[m.range.upperBound...] }
        else if let m = s.firstMatch(of: /^>\s?/) { s = s[m.range.upperBound...] }
        var t = String(s)
        t = t.replacing(/!\[([^\]]*)\]\([^)]*\)/) { $0.output.1.isEmpty ? "" : String($0.output.1) }
        t = t.replacing(/!\[\[[^\]]*\]\]/, with: "")
        t = t.replacing(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/) { String($0.output.3 ?? $0.output.1) }
        t = t.replacing(/\[([^\]]+)\]\(([^)]+)\)/) { "\($0.output.1) (\($0.output.2))" }
        t = t.replacing(/(\*\*|__|~~|`)/, with: "")
        if t.hasPrefix("|") {
            t = t.split(separator: "|").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }.joined(separator: "  ")
        }
        return pad + lead + t
    }
}
