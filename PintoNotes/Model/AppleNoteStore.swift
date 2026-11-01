#if os(macOS)
import Foundation
import SQLite3

/// What Apple Notes' own database knows and its AppleScript doesn't say: which list items are
/// checklist items and whether they're ticked, which lists are numbered, and which notes are pinned.
///
/// Only apps with Full Disk Access may open the database. The import never asks for that: it reads
/// this when access is already there and imports from AppleScript alone when it isn't.
///
/// It copies the database (with its -wal/-shm journal) to a private temporary folder, opens the
/// copy read-only and deletes it when closed. Not available in the sandboxed App Store build.
final class AppleNoteStore {
    private var db: OpaquePointer?
    private let dir: URL
    /// The primary keys of pinned notes.
    let pinned: Set<Int>

    static func open(at url: URL = ApplePins.store) -> Result<AppleNoteStore, ApplePins.Failure> {
        guard ApplePins.hasAccess(at: url) else { return .failure(.noAccess) }
        let fm = FileManager.default
        let dir = fm.temporaryDirectory.appending(path: "amber-pins-\(UUID().uuidString)", directoryHint: .isDirectory)
        do {
            try fm.createDirectory(at: dir, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
            let copy = dir.appending(path: "n.sqlite")
            try fm.copyItem(at: url, to: copy)
            // The journal holds recent changes (like a pin made a minute ago); copy it when present.
            for suffix in ["-wal", "-shm"] {
                let side = URL(fileURLWithPath: url.path + suffix)
                if fm.fileExists(atPath: side.path) { try? fm.copyItem(at: side, to: URL(fileURLWithPath: copy.path + suffix)) }
            }
            var db: OpaquePointer?
            guard sqlite3_open_v2(copy.path, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else {
                sqlite3_close(db)
                try? fm.removeItem(at: dir)
                return .failure(.unreadable)
            }
            // Check the layout before trusting it.
            let columns = strings(db, "select name from pragma_table_info('ZICCLOUDSYNCINGOBJECT')")
            let entities = strings(db, "select Z_NAME from Z_PRIMARYKEY where Z_NAME = 'ICNote'")
            guard columns.contains("Z_PK"), columns.contains("ZISPINNED"), columns.contains("Z_ENT"), entities == ["ICNote"] else {
                sqlite3_close(db)
                try? fm.removeItem(at: dir)
                return .failure(.schemaUnknown)
            }
            let keys = strings(db, """
            select Z_PK from ZICCLOUDSYNCINGOBJECT
            where ZISPINNED = 1 and Z_ENT = (select Z_ENT from Z_PRIMARYKEY where Z_NAME = 'ICNote')
            """).compactMap(Int.init)
            return .success(AppleNoteStore(db: db, dir: dir, pinned: Set(keys)))
        } catch {
            try? fm.removeItem(at: dir)
            return .failure((error as NSError).code == NSFileReadNoPermissionError ? .noAccess : .unreadable)
        }
    }

    private init(db: OpaquePointer?, dir: URL, pinned: Set<Int>) {
        self.db = db
        self.dir = dir
        self.pinned = pinned
    }

    deinit { close() }

    /// Closes the copy and deletes it.
    func close() {
        guard db != nil else { return }
        sqlite3_close(db)
        db = nil
        try? FileManager.default.removeItem(at: dir)
    }

    /// The list items of the note with this primary key, in order. Empty when the note has no
    /// lists, is locked, or its text isn't stored the way we expect.
    func listItems(ofNote key: Int) -> [RichTextToMarkdown.ListItem] {
        stored(ofNote: key).map(AppleNoteText.listItems(inStored:)) ?? []
    }

    /// The named links of the note with this primary key, in order. AppleScript hands a link
    /// over as its words alone, without where it leads.
    func links(ofNote key: Int) -> [AppleNoteText.Link] {
        stored(ofNote: key).map(AppleNoteText.links(inStored:)) ?? []
    }

    private func stored(ofNote key: Int) -> Data? {
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, "select ZDATA from ZICNOTEDATA where ZNOTE = ?", -1, &stmt, nil) == SQLITE_OK else { return nil }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_int64(stmt, 1, Int64(key))
        guard sqlite3_step(stmt) == SQLITE_ROW, let bytes = sqlite3_column_blob(stmt, 0) else { return nil }
        return Data(bytes: bytes, count: Int(sqlite3_column_bytes(stmt, 0)))
    }

    private static func strings(_ db: OpaquePointer?, _ sql: String) -> [String] {
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return [] }
        defer { sqlite3_finalize(stmt) }
        var out: [String] = []
        while sqlite3_step(stmt) == SQLITE_ROW, let c = sqlite3_column_text(stmt, 0) { out.append(String(cString: c)) }
        return out
    }
}

/// Reads the text of one Apple note as its database stores it: gzip around a protocol buffer that
/// holds the plain text and, run by run, each paragraph's style and each link's address. Only
/// list paragraphs and links are read.
enum AppleNoteText {
    /// Words in a note that lead somewhere.
    struct Link: Equatable {
        var text: String
        var url: String
    }

    private static func note(inStored data: Data) -> (units: [UInt16], runs: [Proto])? {
        guard let raw = gunzip(data),
              let document = Proto(raw).message(2), let note = document.message(3),
              let text = note.bytes(2).flatMap({ String(data: $0, encoding: .utf8) }) else { return nil }
        return (Array(text.utf16), note.messages(5))
    }

    /// Links whose words aren't the address itself (a typed address stays as typed), in order.
    static func links(inStored data: Data) -> [Link] {
        guard let (units, runs) = note(inStored: data) else { return [] }
        var links: [Link] = []
        var at = 0
        var lastEnd = -1
        for run in runs {
            let length = Int(run.varint(1) ?? 0)
            defer { at += length }
            guard let url = run.bytes(9).flatMap({ String(data: $0, encoding: .utf8) }), !url.isEmpty, at < units.count else { continue }
            let text = String(decoding: units[at..<min(at + length, units.count)], as: UTF16.self)
            // One link set in two styles is two runs: its words are joined again.
            if lastEnd == at, let last = links.last, last.url == url {
                links[links.count - 1].text += text
            } else {
                links.append(Link(text: text, url: url))
            }
            lastEnd = at + length
        }
        return links.filter { $0.text.trimmingCharacters(in: .whitespacesAndNewlines) != $0.url && !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    static func listItems(inStored data: Data) -> [RichTextToMarkdown.ListItem] {
        guard let (units, runs) = note(inStored: data) else { return [] }
        var items: [RichTextToMarkdown.ListItem] = []
        var at = 0
        // A paragraph's style is that of the run its first character is in.
        var paragraphStart = true
        var current: (kind: RichTextToMarkdown.ListItem.Kind, indent: Int)?
        var line: [UInt16] = []
        func end() {
            if let current { items.append(.init(text: String(decoding: line, as: UTF16.self), kind: current.kind, indent: current.indent)) }
            line = []
            current = nil
            paragraphStart = true
        }
        for run in runs {
            let length = Int(run.varint(1) ?? 0)
            let style = run.message(2)
            for unit in units[min(at, units.count)..<min(at + length, units.count)] {
                if paragraphStart {
                    paragraphStart = false
                    let indent = Int(style?.varint(4) ?? 0)
                    switch style?.varint(1) {
                    case 100: current = (.bullet, indent)
                    case 101: current = (.dash, indent)
                    case 102: current = (.number, indent)
                    case 103: current = (.check(done: style?.message(5)?.varint(2) == 1), indent)
                    default: current = nil
                    }
                }
                if unit == 0x0A { end() } else { line.append(unit) }
            }
            at += length
        }
        if !line.isEmpty { end() }
        return items
    }

    /// The contents of a gzip file: its header is stepped over and the rest inflated.
    static func gunzip(_ data: Data) -> Data? {
        let b = [UInt8](data)
        guard b.count > 18, b[0] == 0x1F, b[1] == 0x8B, b[2] == 8 else { return nil }
        let flags = b[3]
        var i = 10
        if flags & 0x04 != 0 { guard i + 2 <= b.count else { return nil }; i += 2 + Int(b[i]) + Int(b[i + 1]) << 8 }
        for bit in [UInt8(0x08), 0x10] where flags & bit != 0 {
            while i < b.count, b[i] != 0 { i += 1 }
            i += 1
        }
        if flags & 0x02 != 0 { i += 2 }
        guard i < b.count - 8 else { return nil }
        return try? (Data(b[i..<(b.count - 8)]) as NSData).decompressed(using: .zlib) as Data
    }

    /// Just enough of the protocol buffer wire format to walk nested messages by field number.
    struct Proto {
        private var fields: [(number: Int, varint: UInt64?, bytes: Data?)] = []

        init(_ data: Data) {
            let b = [UInt8](data)
            var i = 0
            func readVarint() -> UInt64? {
                var value: UInt64 = 0, shift: UInt64 = 0
                while i < b.count, shift < 64 {
                    let c = b[i]; i += 1
                    value |= UInt64(c & 0x7F) << shift
                    if c < 0x80 { return value }
                    shift += 7
                }
                return nil
            }
            while i < b.count {
                guard let key = readVarint() else { break }
                let number = Int(key >> 3)
                switch key & 7 {
                case 0:
                    guard let v = readVarint() else { return }
                    fields.append((number, v, nil))
                case 1: i += 8
                case 5: i += 4
                case 2:
                    guard let n = readVarint(), n <= UInt64(b.count - i) else { return }
                    fields.append((number, nil, Data(b[i..<(i + Int(n))])))
                    i += Int(n)
                default: return
                }
            }
        }

        func varint(_ number: Int) -> UInt64? { fields.first { $0.number == number && $0.varint != nil }?.varint }
        func bytes(_ number: Int) -> Data? { fields.first { $0.number == number && $0.bytes != nil }?.bytes }
        func message(_ number: Int) -> Proto? { bytes(number).map(Proto.init) }
        func messages(_ number: Int) -> [Proto] { fields.filter { $0.number == number }.compactMap { $0.bytes.map(Proto.init) } }
    }
}
#endif
