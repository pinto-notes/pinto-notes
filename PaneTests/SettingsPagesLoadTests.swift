import Foundation
import SQLite3
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// What keeps each page of Settings quick to open, checked without a clock (timing tests never
/// gate; SettingsPagesPerfTests reports the times). General "took quite a while to load" (Emil,
/// 7 November 2026): its Template menu read the text of the 40 latest notes on every draw, and
/// it asked the system about Open at login twice on the main thread each time it opened.
@MainActor @Suite(.serialized) struct SettingsPagesLoadTests {
    /// A store on disk whose notes' text was changed under it, so the saved titles and the text
    /// disagree: which notes the Template menu lists says which of the two it read.
    @Test func generalsTemplatesNeverReadANotesText() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("SettingsPagesLoad-\(UUID())")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }
        let url = dir.appendingPathComponent("library.store")
        let titled: UUID, empty: UUID
        do {
            let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
            let ctx = ModelContext(c)
            let a = Note(body: "Weekly review\nWins"), b = Note(body: "")
            a.updatedAt = .now.addingTimeInterval(-60)
            ctx.autosaveEnabled = false
            ctx.insert(a)
            ctx.insert(b)
            try ctx.save()
            titled = a.id
            empty = b.id
        }
        // The text swapped round behind the saved titles: "Weekly review" now has none, the empty
        // note has some.
        var db: OpaquePointer?
        #expect(sqlite3_open(url.path, &db) == SQLITE_OK)
        sqlite3_busy_timeout(db, 5000)
        #expect(sqlite3_exec(db, "UPDATE ZNOTE SET ZBODY = CASE WHEN ZBODY = '' THEN 'Text only the body has' ELSE '' END", nil, nil, nil) == SQLITE_OK)
        #expect(sqlite3_changes(db) == 2, "both notes' text changed")
        sqlite3_close(db)

        let library = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let context = ModelContext(library)
        #expect(context.note(empty)?.body == "Text only the body has", "the store holds the swapped text")
        let fresh = ModelContext(library)
        let listed = GeneralChoices(context: fresh).templates(keeping: "")
        #expect(listed == [GeneralChoices.Template(id: titled, title: "Weekly review")],
                "listed by the saved titles, not by reading each note's text: \(listed)")
    }

    #if os(macOS)
    /// Counts each time the system is asked, and on which thread.
    final class CountingLoginService: LoginService, @unchecked Sendable {
        private let lock = NSLock()
        private var reads = 0, mainReads = 0
        var counts: (all: Int, onMain: Int) { lock.withLock { (reads, mainReads) } }
        var isEnabled: Bool {
            lock.withLock {
                reads += 1
                if Thread.isMainThread { mainReads += 1 }
            }
            return true
        }
        func register() throws {}
        func unregister() throws {}
    }

    /// Open at login is asked once as General opens, off the main thread (SMAppService is a round
    /// trip to the system), and the switch then shows the answer.
    @Test func generalAsksAboutOpenAtLoginOnceOffTheMainThread() async throws {
        let fake = CountingLoginService()
        let real = LoginItem.service
        LoginItem.service = fake
        defer { LoginItem.service = real }
        let lib = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ax = OffscreenAX(GeneralSettingsPage().modelContainer(lib), size: CGSize(width: SettingsCard.pageWidth, height: 900))
        defer { ax.close() }
        for _ in 0..<10 where fake.counts.all == 0 { await ax.settle(100) }
        await ax.settle(200)
        #expect(fake.counts.all == 1, "asked once as the page opens: \(fake.counts)")
        #expect(fake.counts.onMain == 0, "never on the main thread: \(fake.counts)")
        #expect(LoginItem.known == true, "the answer is kept for the next time the page opens")
    }
    #endif
}
