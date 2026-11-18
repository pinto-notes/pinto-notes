import CryptoKit
import Foundation
import Testing
@testable import Pane

/// The shared-folder formats against the server's pinned vectors (collab-vectors.json, "folder",
/// made with collab.ts): what the server's code and the AI tools seal opens here, and the ids a
/// member's library gives a shared note and folder are the same on both sides.
@Suite struct FolderVectorsTests {
    struct All: Decodable {
        var from: String; var to: String; var sender_public: String; var recipient_d: String
        var folder: F
    }
    struct F: Decodable {
        var root: String; var subfolder: String; var note: String; var epoch: Int; var note_epoch: Int
        var folder_key: String; var name: String; var name_box: String; var folder_wrap: String; var member_wrap: String
        var data_key: String; var self_wrap: String; var shared_note_id: String; var shared_folder_id: String
    }

    let v: All
    init() throws {
        let url = try #require(Bundle(for: CollabVectorsToken.self).url(forResource: "collab-vectors", withExtension: "json"))
        v = try JSONDecoder().decode(All.self, from: Data(contentsOf: url))
    }

    private func b64(_ s: String) -> Data { Data(base64Encoded: s)! }
    private var f: F { v.folder }
    private var root: UUID { UUID(uuidString: f.root)! }

    @Test func theServersFolderBoxesOpenHere() throws {
        let fk = SymmetricKey(data: b64(f.folder_key))
        #expect(try CollabCrypto.openFolderName(f.name_box, fk: fk, root: root, folder: UUID(uuidString: f.subfolder)!) == f.name)
        let opened = try CollabCrypto.openNoteKeyUnderFolder(f.folder_wrap, fk: fk, root: root, note: UUID(uuidString: f.note)!)
        #expect(opened.folderEpoch == f.epoch && opened.noteEpoch == f.note_epoch)
        let dk = SymmetricKey(data: b64(f.data_key))
        #expect(E2EE.bytes(try CollabCrypto.openFolderSelfWrap(f.self_wrap, dataKey: dk, root: root, epoch: f.epoch)) == b64(f.folder_key))
        let me = try CollabCrypto.Identity(scalar: b64(v.recipient_d))
        let fromMember = try CollabCrypto.openFolderKey(f.member_wrap, me: me, from: b64(v.sender_public), root: root, epoch: f.epoch,
                                                        sender: UUID(uuidString: v.from)!, recipient: UUID(uuidString: v.to)!)
        #expect(E2EE.bytes(fromMember) == b64(f.folder_key))
    }

    @Test func aMembersIdsAreTheServersToo() {
        let dk = SymmetricKey(data: b64(f.data_key))
        #expect(SharedFolders.folderID(for: root, dataKey: dk) == UUID(uuidString: f.shared_folder_id))
        #expect(SharedNotes.noteID(for: UUID(uuidString: f.note)!, dataKey: dk) == UUID(uuidString: f.shared_note_id))
    }
}
