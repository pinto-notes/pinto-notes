import Automerge
import CryptoKit
import Foundation

/// A shared note's text as an Automerge document: the parts of collaboration that touch Automerge.
enum CollabText {
    typealias Document = Automerge.Document
    typealias ObjId = Automerge.ObjId
    typealias Cursor = Automerge.Cursor

    /// A stable position: an Automerge cursor (hex) on the character after the caret, or, at the end
    /// of the text, on the last character with `after` set. Edits anywhere, merges included, move it
    /// with its character, so it resolves to the same place on every device.
    struct Anchor: Codable, Equatable {
        var c: String
        var after: Bool?
    }

    static func anchor(in doc: Document, _ body: ObjId, at offset: Int) -> Anchor? {
        let length = doc.length(obj: body)
        guard length > 0 else { return nil }
        if offset < Int(length), let c = try? doc.cursor(obj: body, position: UInt64(max(0, offset))) { return Anchor(c: c.description) }
        guard let c = try? doc.cursor(obj: body, position: length - 1) else { return nil }
        return Anchor(c: c.description, after: true)
    }

    /// Where an anchor is in the document now (UTF-16), or nil when it names a character that
    /// hasn't arrived here yet (their presence can outrun their change).
    static func offset(of a: Anchor?, in doc: Document, _ body: ObjId) -> Int? {
        guard let a else { return doc.length(obj: body) == 0 ? 0 : nil }
        guard let c = Cursor(hex: a.c), let p = try? doc.position(obj: body, cursor: c) else { return nil }
        return Int(p) + (a.after == true ? 1 : 0)
    }

    /// Takes changes (or a whole saved document) into `doc`. Into an empty document automerge-swift
    /// swaps in a freshly loaded one, which counts text in Unicode scalars instead of UTF-16, and
    /// every splice after that lands in the wrong place next to an emoji. Merging keeps the encoding.
    /// How big a note's text is as a sealed snapshot, before it's shared: the server takes
    /// snapshots up to `CollabSession.maxSnapshot`, and a note whose snapshot can't go up can't be
    /// opened by anyone joining it.
    static func sealedSnapshotSize(of text: String) throws -> Int {
        let doc = Document(textEncoding: .utf16)
        let body = try doc.putObject(obj: .ROOT, key: "body", ty: .Text)
        try doc.spliceText(obj: body, start: 0, delete: 0, value: text)
        // amb3s.<epoch>.<base64 of nonce (12) ‖ ciphertext ‖ tag (16)>
        return 12 + ((doc.save().count + 28 + 2) / 3) * 4
    }

    static func absorb(_ bytes: Data, into doc: Document) throws {
        if doc.heads().isEmpty { try doc.merge(other: try Document(bytes)) } else { try doc.applyEncodedChanges(encoded: bytes) }
    }

    typealias ChangeHash = Automerge.ChangeHash

    /// A change's hash, from its bytes, so it can be looked for before Automerge has taken it in:
    /// the SHA-256 of its chunk after the magic bytes and checksum (its type, length and contents),
    /// as the checksum's four bytes confirm. Nil for anything but one uncompressed change (changes
    /// typed on a device go up several to a blob; an AI's, written by the MCP server, is one).
    static func hash(of change: Data) -> ChangeHash? {
        let b = [UInt8](change)
        guard b.count > 10, b[0..<4].elementsEqual([0x85, 0x6F, 0x4A, 0x83]), b[8] == 1 else { return nil }
        var i = 9, length = 0, shift = 0
        while true {
            guard i < b.count, shift < 63 else { return nil }
            let byte = b[i]
            i += 1
            length |= Int(byte & 0x7F) << shift
            if byte & 0x80 == 0 { break }
            shift += 7
        }
        guard length == b.count - i else { return nil }
        let digest = Data(SHA256.hash(data: b[8...]))
        guard digest.prefix(4).elementsEqual(b[4..<8]) else { return nil }
        return digest.heads()?.first
    }

    /// Each change in a blob of them (what a device sends: one or more change chunks, one after
    /// another), with its bytes and its hash, so the ones Automerge holds back for a change they
    /// build on can be found and kept. A compressed chunk (Automerge deflates changes over 256
    /// bytes) is hashed as the change it holds, as Automerge does; its checksum confirms it. Nil
    /// for anything that isn't changes (a saved document), or bytes that don't parse.
    static func changes(in blob: Data) -> [(bytes: Data, hash: ChangeHash)]? {
        let b = [UInt8](blob)
        var out: [(bytes: Data, hash: ChangeHash)] = []
        var i = 0
        while i < b.count {
            guard b.count - i > 9, b[i..<(i + 4)].elementsEqual(magic) else { return nil }
            let type = b[i + 8]
            var j = i + 9, length = 0, shift = 0
            while true {
                guard j < b.count, shift < 63 else { return nil }
                let byte = b[j]
                j += 1
                length |= Int(byte & 0x7F) << shift
                if byte & 0x80 == 0 { break }
                shift += 7
            }
            let end = j + length
            guard end <= b.count else { return nil }
            let chunk: [UInt8]
            switch type {
            case 1:
                chunk = Array(b[(i + 8)..<end])
            case 2:
                guard let raw = try? (Data(b[j..<end]) as NSData).decompressed(using: .zlib) as Data else { return nil }
                chunk = [1] + leb128(raw.count) + [UInt8](raw)
            default:
                return nil
            }
            let digest = Data(SHA256.hash(data: chunk))
            guard digest.prefix(4).elementsEqual(b[(i + 4)..<(i + 8)]), let hash = digest.heads()?.first else { return nil }
            out.append((Data(b[i..<end]), hash))
            i = end
        }
        return out
    }

    private static let magic: [UInt8] = [0x85, 0x6F, 0x4A, 0x83]

    private static func leb128(_ n: Int) -> [UInt8] {
        var n = n, out: [UInt8] = []
        repeat {
            var byte = UInt8(n & 0x7F)
            n >>= 7
            if n != 0 { byte |= 0x80 }
            out.append(byte)
        } while n != 0
        return out
    }

    /// The text as `doc` holds it without `change` (and anything built on it): everything else it
    /// has, read at that point in its history. Nil for a change it doesn't have.
    static func text(without change: ChangeHash, in doc: Document, _ body: ObjId) -> String? {
        guard let deps = doc.change(hash: change)?.deps else { return nil }
        let heads = doc.heads()
        let rest = heads.contains(change) ? heads.subtracting([change]).union(deps) : Set(deps)
        return try? doc.textAt(obj: body, heads: rest)
    }
}

/// Checklist boxes a merge left with more than one character inside ("[xx]", "[  ]"): two people
/// ticked, or unticked, the same item at once (CollabSession.mendTicks).
enum CollabTicks {
    private static let box = try! NSRegularExpression(pattern: #"^[ \t]*[-*+][ \t]+\[([ xX]{2,})\](?=[ \t])"#, options: .anchorsMatchLines)

    /// What to drop to mend them (UTF-16 ranges): every character in each such box but its first.
    static func drops(in text: String) -> [NSRange] {
        box.matches(in: text, range: NSRange(location: 0, length: (text as NSString).length)).map { m in
            let inside = m.range(at: 1)
            return NSRange(location: inside.location + 1, length: inside.length - 1)
        }
    }
}
