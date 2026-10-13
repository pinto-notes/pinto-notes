#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// DESIGN STUDY: the screens around the guided imports for the journey boards, written under
/// `$AMBER_HIG_SHOTS/_journey/`: the first run's Bring your notes, the outside pages drawn large
/// (Takeout, Gmail, Evernote, macOS's Notes prompt) and the window with the notes arrived.
/// Offscreen. `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/ImportJourneySnapshots`.
@MainActor @Suite(.serialized) struct ImportJourneySnapshots {
    static let drawings: [(String, ImportGuide.Drawn)] = [
        ("drawn-takeout-pick", .takeoutPick), ("drawn-takeout-create", .takeoutCreate), ("drawn-gmail-inbox", .gmailInbox),
        ("drawn-gmail-email", .takeoutEmail), ("drawn-evernote-menu", .evernoteExport), ("drawn-evernote-format", .evernoteFormat),
        ("drawn-bear-select", .bearSelect), ("drawn-settings-automation", .settingsAutomation), ("drawn-notes-prompt", .notesPrompt),
    ]

    /// The folder each import makes, and a few of the made-up notes in it.
    static let arrived: [(String, String, [String])] = [
        ("keep", "Google Keep", ["Shopping list", "Gift ideas for Mum", "Cabin Wi-Fi", "Books to read", "Running plan"]),
        ("evernote", "Travel journal", ["Porto, day one", "Packing list", "Lisbon restaurants", "Train times"]),
        ("bear", "Bear", ["Morning pages", "Recipe: weeknight curry", "Garden plan", "Quotes I like"]),
        ("obsidian", "Second brain", ["Weekly review", "Reading list", "Trip to Lisbon", "Ideas", "Meeting notes 2026-10-05"]),
        ("markdown", "Notion export", ["Team handbook", "Onboarding checklist", "Roadmap Q4"]),
        ("apple-notes", "Travel", ["Porto in October", "Packing list", "Train to Coimbra"]),
    ]

    @Test func journeyScreens() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        try FileManager.default.createDirectory(at: dir.appending(path: "_journey"), withIntermediateDirectories: true)
        try await WelcomeSnapshots.shoot(OnboardingSnapshots.flow(OnboardingSnapshots.Shot(name: "bring", step: .bring)),
                                         name: "_journey/mac-bring", dark: false)
        for (name, d) in Self.drawings {
            try await AppSnapshotTests.shoot(GuideDrawing(drawn: d).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(white: 0.93)),
                                             name: "_journey/\(name)", size: CGSize(width: 520, height: 330), dark: false)
        }
        let d = UserDefaults.standard
        let keepNote = d.object(forKey: "lastNote"), keepScope = d.object(forKey: "lastScope")
        defer {
            if let keepNote { d.set(keepNote, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let keepScope { d.set(keepScope, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        for (id, folderName, titles) in Self.arrived {
            let c = try AppSnapshotTests.container()
            let folder = Folder(name: folderName, sortIndex: -1)
            c.mainContext.insert(folder)
            var first: Note?
            for (i, title) in titles.enumerated() {
                let note = Note(body: "# \(title)\n\nBrought in from \(id == "apple-notes" ? "Apple Notes" : folderName).\n", folder: folder)
                note.updatedAt = .now.addingTimeInterval(-Double(i) * 3_600)
                c.mainContext.insert(note)
                if i == 0 { first = note }
            }
            try c.mainContext.save()
            d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
            if let first { d.set(first.id.uuidString, forKey: "lastNote") }
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "_journey/mac-arrived-\(id)", size: CGSize(width: 1180, height: 760), dark: false)
        }
    }
}
#endif
