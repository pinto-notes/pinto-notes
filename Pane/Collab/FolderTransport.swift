import Foundation
import Supabase

/// What a shared folder needs from the server (supabase/migrations/20261118120000_shared_folders.sql).
/// Apart from `CollabTransport`, so its fakes and the note's stay as they are.
@MainActor
protocol FolderTransport: AnyObject {
    func shareFolder(root: UUID, keyWrap: String, selfWrap: String, name: String) async throws
    func folderMemberships() async throws -> [Collab.FolderMembership]
    func acceptFolder(root: UUID, epoch: Int, selfWrap: String) async throws
    func folderMembers(root: UUID) async throws -> [Collab.Member]
    func folderTree(root: UUID) async throws -> [Collab.FolderRow]
    func putFolder(root: UUID, folder: UUID, parent: UUID, name: String, sort: Double) async throws
    func dropFolder(root: UUID, folder: UUID) async throws
    func folderNotes(root: UUID) async throws -> [Collab.FolderNote]
    func addNote(root: UUID, note: UUID, folder: UUID, wrap: String) async throws
    func moveNote(root: UUID, note: UUID, folder: UUID) async throws
    func rewrapNote(root: UUID, note: UUID, wrap: String) async throws
    func removeNote(root: UUID, note: UUID) async throws
    func joinNote(root: UUID, note: UUID, epoch: Int, keyWrap: String, selfWrap: String) async throws
    func setFolderRole(root: UUID, user: UUID, role: String) async throws
    func removeFromFolder(root: UUID, user: UUID) async throws
    func leaveFolder(root: UUID) async throws
    func rekeyFolder(root: UUID, epoch: Int, wraps: [Collab.Wrap], selfWrap: String, noteWraps: [Collab.NoteWrap], names: [Collab.FolderName]) async throws
    func unshareFolder(root: UUID) async throws
    func folderAccessEnded() async throws -> [Collab.FolderAccessEnded]
    func createFolderLink(id: String, root: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws
    func stopFolderLink(root: UUID) async throws
    func openFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink?
    func joinFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink?
    func linkKind(id: String) async throws -> String?
}

extension Collab {
    struct FolderMembership: Decodable, Sendable, Equatable {
        let root: UUID
        var role: String
        var epoch: Int
        var key_wrap: String
        var wrapped_by: UUID?
        var self_wrap: String?
        var invited_by: UUID?
        var accepted_at: String?
        let owner_id: UUID
        var rekey_after: String? = nil
    }

    struct FolderRow: Decodable, Sendable, Equatable {
        let id: UUID
        var parent_id: UUID?
        var name: String
        var sort_index: Double
        var deleted: Bool
    }

    struct FolderNote: Decodable, Sendable, Equatable {
        let note_id: UUID
        var folder_id: UUID
        var folder_wrap: String
        let owner_id: UUID
        var note_epoch: Int
        var joined: Bool
    }

    struct NoteWrap: Codable, Sendable, Equatable {
        let note_id: UUID
        let folder_wrap: String
    }

    struct FolderName: Codable, Sendable, Equatable {
        let id: UUID
        let name: String
    }

    struct FolderAccessEnded: Decodable, Sendable, Equatable {
        let root: UUID
        let reason: String
        let at: String
    }

    struct OpenedFolderLink: Decodable, Sendable, Equatable {
        let root: UUID
        let role: String
        let epoch: Int
        let key_wrap: String
        var owner_name: String?
        var folder_name: String?
    }
}

extension SupabaseCollabTransport: FolderTransport {
    private static func s(_ u: UUID) -> String { u.uuidString.lowercased() }

    private func rpc(_ name: String, _ params: some Encodable & Sendable) async throws {
        do { try await client.rpc(name, params: params).execute() } catch let e as PostgrestError {
            throw Collab.Failure.from(hint: e.hint, message: e.message)
        }
    }

    private func rows<T: Decodable>(_ name: String, _ params: some Encodable & Sendable) async throws -> [T] {
        do { return try await client.rpc(name, params: params).execute().value } catch let e as PostgrestError {
            throw Collab.Failure.from(hint: e.hint, message: e.message)
        }
    }

    private func rows<T: Decodable>(_ name: String) async throws -> [T] {
        do { return try await client.rpc(name).execute().value } catch let e as PostgrestError {
            throw Collab.Failure.from(hint: e.hint, message: e.message)
        }
    }

    func shareFolder(root: UUID, keyWrap: String, selfWrap: String, name: String) async throws {
        try await rpc("collab_share_folder", ["p_root": Self.s(root), "p_key_wrap": keyWrap, "p_self_wrap": selfWrap, "p_name": name])
    }

    func folderMemberships() async throws -> [Collab.FolderMembership] { try await rows("collab_folder_memberships") }

    func acceptFolder(root: UUID, epoch: Int, selfWrap: String) async throws {
        struct P: Encodable, Sendable { let p_root: String, p_epoch: Int, p_self_wrap: String }
        try await rpc("collab_folder_accept", P(p_root: Self.s(root), p_epoch: epoch, p_self_wrap: selfWrap))
    }

    func folderMembers(root: UUID) async throws -> [Collab.Member] { try await rows("collab_folder_members", ["p_root": Self.s(root)]) }

    func folderTree(root: UUID) async throws -> [Collab.FolderRow] { try await rows("collab_folder_folders", ["p_root": Self.s(root)]) }

    func putFolder(root: UUID, folder: UUID, parent: UUID, name: String, sort: Double) async throws {
        struct P: Encodable, Sendable { let p_root, p_folder, p_parent, p_name: String; let p_sort: Double }
        try await rpc("collab_folder_put", P(p_root: Self.s(root), p_folder: Self.s(folder), p_parent: Self.s(parent), p_name: name, p_sort: sort))
    }

    func dropFolder(root: UUID, folder: UUID) async throws {
        try await rpc("collab_folder_drop", ["p_root": Self.s(root), "p_folder": Self.s(folder)])
    }

    func folderNotes(root: UUID) async throws -> [Collab.FolderNote] { try await rows("collab_folder_notes", ["p_root": Self.s(root)]) }

    func addNote(root: UUID, note: UUID, folder: UUID, wrap: String) async throws {
        try await rpc("collab_folder_note_add", ["p_root": Self.s(root), "p_note": Self.s(note), "p_folder": Self.s(folder), "p_wrap": wrap])
    }

    func moveNote(root: UUID, note: UUID, folder: UUID) async throws {
        try await rpc("collab_folder_note_move", ["p_root": Self.s(root), "p_note": Self.s(note), "p_folder": Self.s(folder)])
    }

    func rewrapNote(root: UUID, note: UUID, wrap: String) async throws {
        try await rpc("collab_folder_note_rewrap", ["p_root": Self.s(root), "p_note": Self.s(note), "p_wrap": wrap])
    }

    func removeNote(root: UUID, note: UUID) async throws {
        try await rpc("collab_folder_note_remove", ["p_root": Self.s(root), "p_note": Self.s(note)])
    }

    func joinNote(root: UUID, note: UUID, epoch: Int, keyWrap: String, selfWrap: String) async throws {
        struct P: Encodable, Sendable { let p_root, p_note: String; let p_epoch: Int; let p_key_wrap, p_self_wrap: String }
        try await rpc("collab_folder_join_note", P(p_root: Self.s(root), p_note: Self.s(note), p_epoch: epoch, p_key_wrap: keyWrap, p_self_wrap: selfWrap))
    }

    func setFolderRole(root: UUID, user: UUID, role: String) async throws {
        try await rpc("collab_folder_set_role", ["p_root": Self.s(root), "p_user": Self.s(user), "p_role": role])
    }

    func removeFromFolder(root: UUID, user: UUID) async throws {
        try await rpc("collab_folder_remove", ["p_root": Self.s(root), "p_user": Self.s(user)])
    }

    func leaveFolder(root: UUID) async throws { try await rpc("collab_folder_leave", ["p_root": Self.s(root)]) }

    func rekeyFolder(root: UUID, epoch: Int, wraps: [Collab.Wrap], selfWrap: String, noteWraps: [Collab.NoteWrap], names: [Collab.FolderName]) async throws {
        struct P: Encodable, Sendable { let p_root: String; let p_epoch: Int; let p_wraps: [Collab.Wrap]; let p_self_wrap: String; let p_note_wraps: [Collab.NoteWrap]; let p_names: [Collab.FolderName] }
        try await rpc("collab_folder_rekey", P(p_root: Self.s(root), p_epoch: epoch, p_wraps: wraps, p_self_wrap: selfWrap, p_note_wraps: noteWraps, p_names: names))
    }

    func unshareFolder(root: UUID) async throws { try await rpc("collab_unshare_folder", ["p_root": Self.s(root)]) }

    func folderAccessEnded() async throws -> [Collab.FolderAccessEnded] { try await rows("collab_folder_access_ended") }

    func createFolderLink(id: String, root: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws {
        struct P: Encodable, Sendable { let p_id, p_root, p_role: String; let p_epoch: Int; let p_answer_hash, p_key_wrap: String }
        try await rpc("collab_folder_create_link", P(p_id: id, p_root: Self.s(root), p_role: role, p_epoch: epoch, p_answer_hash: answerHash, p_key_wrap: keyWrap))
    }

    func stopFolderLink(root: UUID) async throws { try await rpc("collab_folder_stop_link", ["p_root": Self.s(root)]) }

    func openFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink? {
        let r: [Collab.OpenedFolderLink] = try await rows("collab_folder_open_link", ["p_id": id, "p_answer": answer])
        return r.first
    }

    func joinFolderLink(id: String, answer: String) async throws -> Collab.OpenedFolderLink? {
        let r: [Collab.OpenedFolderLink] = try await rows("collab_folder_join_link", ["p_id": id, "p_answer": answer])
        return r.first
    }

    func linkKind(id: String) async throws -> String? {
        do {
            let v: String? = try await client.rpc("collab_link_kind", params: ["p_id": id]).execute().value
            return v
        } catch let e as PostgrestError { throw Collab.Failure.from(hint: e.hint, message: e.message) }
    }
}
