import CryptoKit
import Foundation

/// The formats for shared folders (docs/Technical/collaboration-design.md, section 8), the same as
/// `supabase/functions/_shared/collab.ts`. A shared folder has a folder key (FK) per epoch, held by
/// its members as a note key is held by a note's (`amb3k` to their identity, `amb2` under their
/// data key). Under FK: the names of the folder and its subfolders (`amb3f`) and each note's key
/// (`amb3w`), so a member opens any note in the folder and joins it.
extension CollabCrypto {
    static func folderKeyContext(_ root: UUID, epoch: Int) -> String { "folderkey:\(root.uuidString.lowercased()):\(epoch)" }

    /// FK to a member's identity: `amb3k` with the folder's id where a note's would be.
    static func sealFolderKey(_ fk: SymmetricKey, from sender: Identity, to: Data, root: UUID, epoch: Int, recipient: UUID, by: UUID) throws -> String {
        try sealNoteKey(fk, from: sender, to: to, party: Party(note: root, epoch: epoch, from: by, to: recipient))
    }

    static func openFolderKey(_ sealed: String, me: Identity, from: Data, root: UUID, epoch: Int, sender: UUID, recipient: UUID) throws -> SymmetricKey {
        try openNoteKey(sealed, me: me, from: from, party: Party(note: root, epoch: epoch, from: sender, to: recipient))
    }

    /// FK under the member's own data key.
    static func folderSelfWrap(_ fk: SymmetricKey, dataKey: SymmetricKey, root: UUID, epoch: Int) throws -> String {
        try NoteCrypto.seal(E2EE.bytes(fk).base64EncodedString(), key: dataKey, keyID: E2EE.keyID(of: dataKey), context: folderKeyContext(root, epoch: epoch))
    }

    static func openFolderSelfWrap(_ box: String, dataKey: SymmetricKey, root: UUID, epoch: Int) throws -> SymmetricKey {
        guard let text = try? NoteCrypto.open(box, key: dataKey, context: folderKeyContext(root, epoch: epoch)),
              let raw = Data(base64Encoded: text), raw.count == 32 else { throw Failure.wrongKey }
        return SymmetricKey(data: raw)
    }

    // MARK: Names

    private static func nameAAD(root: UUID, epoch: Int, folder: UUID) -> Data {
        Data("amb3f|\(root.uuidString.lowercased())|\(epoch)|\(folder.uuidString.lowercased())".utf8)
    }

    /// A folder's or subfolder's name: `amb3f.<epoch>.<b64>`.
    static func sealFolderName(_ name: String, fk: SymmetricKey, root: UUID, epoch: Int, folder: UUID) throws -> String {
        let box = try AES.GCM.seal(Data(name.utf8), using: fk, authenticating: nameAAD(root: root, epoch: epoch, folder: folder))
        guard let combined = box.combined else { throw Failure.malformed }
        return "amb3f.\(epoch).\(combined.base64EncodedString())"
    }

    /// The epoch a box was sealed in (`amb3f.<epoch>.…`, `amb3w.<epoch>.…`).
    static func epoch(of sealed: String) -> Int? {
        let parts = sealed.split(separator: ".", maxSplits: 2)
        return parts.count == 3 ? Int(parts[1]) : nil
    }

    static func openFolderName(_ sealed: String, fk: SymmetricKey, root: UUID, folder: UUID) throws -> String {
        let parts = sealed.split(separator: ".", maxSplits: 2)
        guard parts.count == 3, parts[0] == "amb3f", let epoch = Int(parts[1]),
              let b = Data(base64Encoded: String(parts[2])), let box = try? AES.GCM.SealedBox(combined: b) else { throw Failure.malformed }
        guard let plain = try? AES.GCM.open(box, using: fk, authenticating: nameAAD(root: root, epoch: epoch, folder: folder)),
              let name = String(data: plain, encoding: .utf8) else { throw Failure.wrongKey }
        return name
    }

    // MARK: Note keys under FK

    private static func wrapAAD(root: UUID, epoch: Int, note: UUID, noteEpoch: Int) -> Data {
        Data("amb3w|\(root.uuidString.lowercased())|\(epoch)|\(note.uuidString.lowercased())|\(noteEpoch)".utf8)
    }

    /// A note's key under FK: `amb3w.<epoch>.<note epoch>.<b64>`.
    static func sealNoteKeyUnderFolder(_ nk: SymmetricKey, fk: SymmetricKey, root: UUID, epoch: Int, note: UUID, noteEpoch: Int) throws -> String {
        let box = try AES.GCM.seal(E2EE.bytes(nk), using: fk, authenticating: wrapAAD(root: root, epoch: epoch, note: note, noteEpoch: noteEpoch))
        guard let combined = box.combined else { throw Failure.malformed }
        return "amb3w.\(epoch).\(noteEpoch).\(combined.base64EncodedString())"
    }

    /// The note epoch an `amb3w` box is for, read from the box without opening it.
    static func wrapNoteEpoch(_ wrap: String) -> Int? {
        let parts = wrap.split(separator: ".", maxSplits: 3)
        return parts.count == 4 ? Int(parts[2]) : nil
    }

    /// The note key and its epoch, from its box under FK. `epoch` is the box's FK epoch.
    static func openNoteKeyUnderFolder(_ sealed: String, fk: SymmetricKey, root: UUID, note: UUID) throws -> (nk: SymmetricKey, folderEpoch: Int, noteEpoch: Int) {
        let parts = sealed.split(separator: ".", maxSplits: 3)
        guard parts.count == 4, parts[0] == "amb3w", let epoch = Int(parts[1]), let noteEpoch = Int(parts[2]),
              let b = Data(base64Encoded: String(parts[3])), let box = try? AES.GCM.SealedBox(combined: b) else { throw Failure.malformed }
        guard let raw = try? AES.GCM.open(box, using: fk, authenticating: wrapAAD(root: root, epoch: epoch, note: note, noteEpoch: noteEpoch)),
              raw.count == 32 else { throw Failure.wrongKey }
        return (SymmetricKey(data: raw), epoch, noteEpoch)
    }
}

enum SharedFolders {
    /// Your own id for someone else's shared folder or subfolder: the same on each of your devices,
    /// never the owner's (`folders.id` is unique across accounts). HMAC like `SharedNotes.noteID`.
    static func folderID(for shared: UUID, dataKey: SymmetricKey) -> UUID {
        SharedNotes.derived("pinto shared folder \(shared.uuidString.lowercased())", key: dataKey)
    }
}
