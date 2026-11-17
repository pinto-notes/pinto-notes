import Foundation
import SwiftData
import SwiftUI
@testable import Pane

/// A small library for the locked and shared pictures: a pinned shared note, a pinned note, two
/// locked notes, a shared note and a plain one, in one folder, with a notes password set up and
/// every locked note locked. Its own vault (`NoteVault.shared` is swapped in by the shots).
@MainActor struct LockedSharedScene {
    static var dir: URL? { ProcessInfo.processInfo.environment["PANE_LOCKED_SHARED_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let password = "correct horse"

    let container: ModelContainer
    let vault: NoteVault
    let folder: UUID

    /// The locked note the pictures open.
    let locked: Note

    static func make(biometry: String?) async throws -> LockedSharedScene {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = c.mainContext
        let folder = context.createFolder(named: "Personal")
        let vault = NoteVault(keyStore: MemoryKeyStore(biometryName: biometry), defaults: MemoryDefaults(), iterations: 1_000)
        try await vault.setUp(password: password, hint: "The usual")
        func note(_ body: String, minutesAgo: Double, pinned: Bool = false, shared: Bool = false, locked: Bool = false) throws -> Note {
            let n = context.createNote(in: .folder(folder.id), body: body)
            n.isPinned = pinned
            if shared { n.sharedNoteID = UUID() }
            if locked { try vault.lock(n) }
            n.updatedAt = Calendar.current.startOfDay(for: .now).addingTimeInterval(9 * 3600 - minutesAgo * 60)
            n.createdAt = n.updatedAt
            return n
        }
        _ = try note("Weekend in Lisbon\n\nTram 28 early, before the queues. Dinner on Saturday.", minutesAgo: -200, pinned: true, shared: true)
        _ = try note("Groceries\n\nOat milk, lemons, rice, basil", minutesAgo: -150, pinned: true)
        let bank = try note("Bank details\n\nAccount 1234 5678, sort code 12-34-56", minutesAgo: -90, locked: true)
        _ = try note("Book club\n\nNext up: Piranesi, on the 14th at Ana's", minutesAgo: -60, shared: true)
        _ = try note("Ideas for the garden\n\nLavender by the path, a bench under the pear tree", minutesAgo: -20)
        _ = try note("Passport numbers\n\nMine, Sara's and the kids'", minutesAgo: 600, locked: true)
        try context.save()
        // Locked, and Face ID or Touch ID has no key to open them with until the password is typed.
        vault.forgetDeviceKey()
        return LockedSharedScene(container: c, vault: vault, folder: folder.id, locked: bank)
    }
}
