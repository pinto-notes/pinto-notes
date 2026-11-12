#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Pictures of bringing ticks and pins over after an Apple Notes import, light and dark, for
/// Emil's review (12 November 2026). Offscreen windows, never shown; the made-up library and the
/// made-up NoteStore only. Runs only when FOLLOWUP_SHOTS names a folder:
/// `TEST_RUNNER_FOLLOWUP_SHOTS=/path scripts/qa-test.sh PaneTests/AppleNotesFollowUpShots`
@MainActor @Suite(.serialized) struct AppleNotesFollowUpShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["FOLLOWUP_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let sheet = CGSize(width: 540, height: AppleNotesImportView.guideHeight)

    static func url(_ name: String, dark: Bool) throws -> URL {
        try #require(dir).appending(path: "\(name)-\(dark ? "dark" : "light").png")
    }

    @Test func theSheetPages() async throws {
        guard Self.dir != nil else { return }
        AppleNotesBridge.forceDemo = true
        DateBucket.locale = Locale(identifier: "en_US")
        defer { AppleNotesBridge.forceDemo = false; AppleNotesImportView.demoPage = nil; DateBucket.locale = .autoupdatingCurrent }
        let c = try ImportSheetSnapshots.container()
        let pages: [(String, AppleNotesImportView.DemoPage?)] = [
            ("01-import-button", nil), ("02-summary-offer", .offer), ("03-explanation", .explain),
            ("04-turn-on", .waiting), ("06-confirmation", .applied),
        ]
        for dark in [false, true] {
            for (name, page) in pages {
                AppleNotesImportView.demoPage = page
                let view = AppleNotesImportView().modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US"))
                try await VersionHistorySnapshots.shoot(view, to: try Self.url(name, dark: dark), size: Self.sheet, dark: dark)
            }
        }
    }

    /// The notes list after the ticks and pins came over: Weekend list pinned, its checklist ticked.
    @Test func theResultInTheNotesList() async throws {
        guard Self.dir != nil else { return }
        let url = try AppleNotesImportTests.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        let c = try AppSnapshotTests.container()
        let context = c.mainContext
        let summary = await AppleNotesImportTests.importer(context, store: nil).run([AppleNotesImportTests.notes[0]], keepFolders: true) { _, _ in }
        let store = try AppleNoteStore.open(at: url).get()
        defer { store.close() }
        let outcome = AppleNotesFollowUp.apply(summary.followUp, store: store, in: context)
        #expect(outcome.ticked == 2 && outcome.pinned == 1)
        // Dated today, so it sits with the library's other recent notes.
        if let weekend = try context.fetch(FetchDescriptor<Note>()).first(where: { $0.title == "Weekend list" }) { weekend.updatedAt = .now.addingTimeInterval(-600) }
        try context.save()
        for dark in [false, true] {
            try await PersonaEditorShots.window(c, note: "Weekend list", dark: dark) { w in
                let rep = try PersonaEditorShots.picture(w)
                try #require(rep.representation(using: .png, properties: [:])).write(to: try Self.url("07-notes-list-result", dark: dark))
            }
        }
    }
}
#endif
