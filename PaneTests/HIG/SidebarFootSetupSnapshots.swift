#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The sidebar's foot in Emil's state (an AI connected, notes imported, the account older than
/// two weeks), dark, for looking at: the AI's last change and you. Offscreen:
/// `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/SidebarFootSetupSnapshots`.
@MainActor @Suite(.serialized) struct SidebarFootSetupSnapshots {
    final class OneChange: AIChangesStore {
        let change: AIChange
        init(_ change: AIChange) { self.change = change }
        func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] { [change] }
    }

    @Test func emilsFoot() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = ctx.createFolder(named: "Notes")
        let made = ctx.createNote(in: .folder(notes.id), body: "Personal links\n\nA few places")
        try ctx.save()
        let old = AIChangesCenter.shared.store
        AIChangesCenter.shared.store = OneChange(AIChange(id: "shot", kind: .created, noteID: made.id, ai: "ChatGPT", at: .now))
        defer { AIChangesCenter.shared.store = old }
        let backend = Backend()
        let account = UUID()
        backend.showSignedInForPreview(email: "sara@example.com", account: account)
        // The account's first note was a month ago.
        let defaults = UserDefaults(suiteName: "foot-shot-\(UUID())")!
        defaults.set(Date.now.addingTimeInterval(-30 * 86_400), forKey: SidebarSetup(defaults: defaults, account: account).firstNoteKey)
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let foot = SidebarFoot(backend: backend, nested: false, rows: true)
            .frame(width: 260)
            .padding(.vertical, 8)
            .background(Color(Palette.sidebarWarmth))
            .environment(SetupStore(progress: SetupProgress(imported: true, connected: true, dismissed: true)))
            .tint(Color(PColor.paneAccent))
            // As in the window in front: the AI's line loads only then.
            .environment(\.appearsActive, true)
            .environment(\.sidebarSetupDefaults, defaults)
            .modelContainer(c)
        try await AppSnapshotTests.render(foot, name: "sidebar-foot-emil-dark", dark: true, wait: 1.0)
    }
}
#endif
