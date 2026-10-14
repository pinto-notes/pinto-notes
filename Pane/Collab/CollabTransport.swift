import Foundation

/// Collaboration: what a device needs from the server for shared notes, behind one protocol so the
/// library, the Share sheet and the tests don't care where it goes. The app's is
/// `SupabaseCollabTransport` (PostgREST calls to the `collab_*` functions and tables, and a Realtime
/// private channel `note:<id>` per open note, all as the signed-in account); tests use an in-memory
/// server with the same rules (PaneTests/Collab/MemoryCollabServer.swift).
///
/// Everything that crosses it is sealed already (`CollabCrypto`): the server sees who is in which
/// note and when they write, never the text, a key or a cursor.
@MainActor
protocol CollabTransport: AnyObject {
    /// The signed-in account.
    var me: UUID { get }

    // MARK: Identity

    /// Your own identity row (the public half and the private half sealed under your data key), or
    /// nil before your first share or join.
    func ownIdentity() async throws -> Collab.IdentityRow?
    /// Refused with `.identityExists` when the account already has a different key.
    func publishIdentity(publicKey: String, privateWrap: String) async throws

    // MARK: Membership

    /// Every shared note you're in, with your wraps and the note's sealed head.
    func memberships() async throws -> [Collab.Membership]
    /// Who is in a note (names, photos, roles, public keys; never wraps).
    func members(of note: UUID) async throws -> [Collab.Member]
    /// Makes the note shared, with you as its owner and first member (epoch 1).
    func share(note: UUID, keyWrap: String, selfWrap: String, head: String) async throws
    /// Your wrap under your own data key, once you've opened the one sealed to your identity.
    func accept(note: UUID, selfWrap: String) async throws
    /// A new note key for everyone who stays (owner only); `user` nil only renews the key. Every
    /// remaining member's wrap must be in `wraps`, the owner's included. Returns the new epoch.
    @discardableResult
    func remove(note: UUID, user: UUID?, epoch: Int, wraps: [Collab.Wrap]) async throws -> Int
    /// Leaves a note you were invited to (`collab_leave`; refused for the owner with `.notOwner`).
    /// The owner's next device renews the key.
    func leave(note: UUID) async throws
    /// The note's sealed title and preview (`amb3h`), for lists.
    func updateHead(note: UUID, head: String) async throws

    // MARK: Edit links

    func createLink(id: String, note: UUID, role: String, epoch: Int, answerHash: String, keyWrap: String) async throws
    func stopLink(note: UUID) async throws
    /// Nil when the link expired, was stopped, or the answer is wrong.
    func openLink(id: String, answer: String) async throws -> Collab.OpenedLink?
    func joinLink(id: String, answer: String, keyWrap: String, selfWrap: String) async throws

    // MARK: Sealed read-only links and templates (20261007163100_sealed_links_and_templates.sql)

    func publishSealedLink(id: String, note: UUID, ct: String) async throws
    func stopSealedLink(note: UUID) async throws
    func publishTemplate(id: String, note: UUID, name: String, json: String) async throws
    func stopTemplate(note: UUID) async throws
    /// A shared template as the public page reads it: `{maker, template}` JSON, or nil when it isn't shared.
    func sharedTemplate(id: String) async throws -> Data?

    // MARK: The document

    /// Starting out (`after` 0) or behind the newest snapshot: that snapshot, then every change
    /// after it. Otherwise no snapshot and every change after `after`. In order of id.
    func pull(note: UUID, after: Int64) async throws -> Collab.Pull
    /// Refused with `.readOnly` for a viewer and `.staleEpoch` for an old key.
    func send(update ct: String, note: UUID, epoch: Int) async throws -> Collab.Update
    /// The server drops the changes it covers (`upto`).
    func send(snapshot ct: String, note: UUID, upto: Int64, epoch: Int) async throws

    // MARK: Live

    /// Joins the note's channel (members only). Events arrive on the main actor until `close()`.
    func join(note: UUID, onEvent: @escaping @MainActor (Collab.Event) -> Void) async throws -> CollabChannel
}

/// An open note's live channel.
@MainActor
protocol CollabChannel: AnyObject {
    /// Your sealed presence (`amb3p`), to everyone else in the note.
    func send(presence ct: String)
    func close()
}

/// The rows and events of collaboration, as the server has them.
enum Collab {
    struct IdentityRow: Decodable, Sendable, Equatable {
        let public_key: String
        let private_wrap: String
    }

    struct Person: Decodable, Sendable {
        let user_id: UUID
        let display_name: String?
        let public_key: String
    }

    struct Member: Decodable, Sendable, Equatable {
        let user_id: UUID
        let role: String
        let display_name: String?
        let avatar_path: String?
        let public_key: String?
        let accepted: Bool
    }

    struct Membership: Decodable, Sendable, Equatable {
        let note_id: UUID
        let role: String
        let epoch: Int
        let key_wrap: String
        let wrapped_by: UUID
        let self_wrap: String?
        let invited_by: UUID?
        let accepted_at: String?
        let head_ct: String?
        let owner_id: UUID
    }

    struct Update: Decodable, Sendable, Equatable {
        let id: Int64
        let note_id: UUID
        let author_id: UUID
        let epoch: Int
        let ct: String
        let client: String?
    }

    struct Snapshot: Decodable, Sendable, Equatable {
        let note_id: UUID
        let upto: Int64
        let epoch: Int
        let ct: String
    }

    struct Pull: Decodable, Sendable {
        let snapshot: Snapshot?
        let updates: [Update]
    }

    struct Wrap: Encodable, Sendable {
        let user_id: UUID
        let key_wrap: String
    }

    struct OpenedLink: Decodable, Sendable {
        let note_id: UUID
        let role: String
        let epoch: Int
        let key_wrap: String
    }

    enum Event: Sendable {
        /// A change someone (you included, from another device) stored.
        case update(Update)
        /// Someone's sealed presence (`amb3p`).
        case presence(user: UUID, ct: String)
        /// Someone closed the note on their last device, or lost their connection.
        case leave(UUID)
        /// The channel dropped and joined again: changes may have been missed, so pull.
        case reconnected
    }

    /// What the server refused, by its hint, so callers can act on it.
    enum Failure: LocalizedError, Equatable {
        case notSignedIn
        /// The account already has a different identity key (`identity_exists`).
        case identityExists
        /// The note's key changed (`stale_epoch`): open it again with the new one.
        case staleEpoch
        /// You can view the note but not change it (`read_only`).
        case readOnly
        /// Only the owner can do that (`not_owner`).
        case notOwner
        /// Not every remaining member got the new key (`wraps_incomplete`).
        case wrapsIncomplete
        /// The channel refused you: you aren't in the note (any more).
        case notMember
        case server(String)

        var errorDescription: String? {
            switch self {
            case .notSignedIn: "Sign in to share notes."
            case .identityExists: "This account already has a different sharing key."
            case .staleEpoch: "The note's key changed. Open it again."
            case .readOnly: "You can view this note but not change it."
            case .notOwner: "Only the note's owner can do that."
            case .wrapsIncomplete: "Every remaining person needs the new key."
            case .notMember: "You're not in this note anymore."
            case .server(let m): m
            }
        }

        static func from(hint: String?, message: String) -> Failure {
            switch hint {
            case "identity_exists": .identityExists
            case "stale_epoch": .staleEpoch
            case "read_only": .readOnly
            case "not_owner": .notOwner
            case "wraps_incomplete": .wrapsIncomplete
            default: .server(message)
            }
        }
    }
}
