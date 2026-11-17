import CryptoKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// People with a whiteboard shared between them, through CollabStore and the in-memory server:
/// for these tests and the board's own (CanvasNativeUITests).
@MainActor final class BoardPeople {
    let server = MemoryCollabServer()

    struct Device {
        let id: UUID
        let store: CollabStore
        let context: ModelContext
        let container: ModelContainer
    }

    func device(_ user: UUID, name: String) throws -> Device {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let key = SymmetricKey(size: .bits256)
        let store = CollabStore(name: name, transport: server.transport(for: user), dataKey: { key }, book: CollabKeyBook(account: user, defaults: TestDefaults()))
        store.context = container.mainContext
        return Device(id: user, store: store, context: container.mainContext, container: container)
    }

    /// Emil's board with `scene`, shared with an Edit (or View) link; `people` join it. `accounts`:
    /// fixed account ids by name (so a person has the same colour from one board to the next).
    func share(_ scene: [String: Any], access: ShareState.Access = .edit, people: [String] = ["Sara", "Ola"], title: String = "Launch plan", accounts: [String: UUID] = [:])
        async throws -> (emil: Device, others: [Device], note: Note) {
        let emil = try device(server.account("Emil", id: accounts["Emil"] ?? UUID()), name: "Emil")
        let note = CanvasNote.make(in: .all, context: emil.context, scene: scene, named: title)
        try await emil.store.setAccess(access, for: note)
        let url = try #require(emil.store.linkURL(note))
        var others: [Device] = []
        for name in people {
            let d = try device(server.account(name, id: accounts[name] ?? UUID()), name: name)
            #expect(await d.store.join(url).worked)
            others.append(d)
        }
        await server.eventually { server.channelCount(note.id) == 1 + people.count }
        return (emil, others, note)
    }

    func session(_ d: Device, _ note: Note) throws -> CollabSession {
        if let s = d.store.session(for: note.id) { return s }
        return try #require(d.store.session(for: d.context.pointer(forShared: note.id)?.id ?? UUID()))
    }
}

/// The people in the tests' pictures, with the account ids they have everywhere: the Mac's and the
/// iPhone's pictures, and the browser's (scripts/board-web-e2e.sh makes its two accounts with these
/// ids). So each has one colour in every picture, as a person does on every device (round 14: Sara
/// was purple in the Mac's comments, teal in the browser). Emil's id picks teal, Sara's indigo
/// (CollabSession.paletteIndex), and on a board they share, Emil's, they keep them.
enum TestPeople {
    static let emil = UUID(uuidString: "E0000000-0000-4000-8000-000000000001")!
    static let sara = UUID(uuidString: "5A000000-0000-4000-8000-000000000002")!
    /// Can comment, in the pictures and the browser test (scripts/board-web-e2e.ts): violet.
    static let cleo = UUID(uuidString: "C1E00000-0000-4000-8000-000000000002")!
    static let accounts = ["Emil": emil, "Sara": sara, "Cleo": cleo]

    /// Someone's colour on Emil's board shared with Sara, light and dark ("#RRGGBB").
    @MainActor static func color(_ id: UUID) -> (light: String, dark: String) {
        let p = CollabSession.palette[CollabSession.slots(for: [emil, sara])[id] ?? Int(CollabSession.paletteIndex(for: id))]
        return (CollabSession.hex(p.light), CollabSession.hex(p.dark))
    }
}
