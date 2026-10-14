import Automerge
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
    static func absorb(_ bytes: Data, into doc: Document) throws {
        if doc.heads().isEmpty { try doc.merge(other: try Document(bytes)) } else { try doc.applyEncodedChanges(encoded: bytes) }
    }
}
