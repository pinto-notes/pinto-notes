#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The sidebar's foot, light and dark, for looking at: a new account with its notice (before and
/// after an import), and an older account, Templates and you. Offscreen only (never ordered in):
/// `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/SidebarFootSetupSnapshots`.
@MainActor @Suite(.serialized) struct SidebarFootSetupSnapshots {
    final class OneChange: AIChangesStore {
        let change: AIChange
        init(_ change: AIChange) { self.change = change }
        func changes(before: Date?, limit: Int, ai: String?) async throws -> [AIChange] { [change] }
    }

    enum Account: String, CaseIterable { case new, imported, older }

    /// The foot alone, at the sidebar's width.
    func foot(_ account: Account, library c: ModelContainer, nested: Bool = false) -> some View {
        let backend = Backend()
        let id = UUID()
        let created: Date = account == .older ? .now.addingTimeInterval(-120 * 86_400) : .now.addingTimeInterval(-3_600)
        backend.showSignedInForPreview(email: "sara@example.com", account: id, created: created)
        let progress: SetupProgress = switch account {
        case .new: SetupProgress(dismissed: true)
        case .imported: SetupProgress(imported: true, dismissed: true)
        case .older: SetupProgress(imported: true, connected: true, dismissed: true)
        }
        return SidebarFoot(backend: backend, nested: nested, rows: true)
            .environment(SetupStore(progress: progress))
            .tint(Color(PColor.paneAccent))
            .environment(\.appearsActive, true)
            .environment(\.sidebarSetupDefaults, UserDefaults(suiteName: "foot-shot-\(UUID())")!)
            .modelContainer(c)
    }

    func library() throws -> ModelContainer {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let notes = c.mainContext.createFolder(named: "Notes")
        _ = c.mainContext.createNote(in: .folder(notes.id), body: "Welcome\n\nA first note")
        try c.mainContext.save()
        return c
    }

    @Test(arguments: [false, true])
    func feet(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let old = AIChangesCenter.shared.store
        AIChangesCenter.shared.store = nil
        defer { AIChangesCenter.shared.store = old }
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let mode = dark ? "dark" : "light"
        for account in Account.allCases {
            let c = try library()
            let view = foot(account, library: c)
                .frame(width: 260)
                // Its whole height: asked for its smallest, the notice's words cut to one line.
                .fixedSize(horizontal: false, vertical: true)
                .padding(.vertical, 8)
                .background(Color(Palette.sidebarWarmth))
            try await AppSnapshotTests.render(view, name: "sidebar-foot-\(account.rawValue)-\(mode)", dark: dark, wait: 1.0)
        }
    }

    /// The new account's notice in the whole sidebar, under the folders.
    @Test(arguments: [false, true])
    func inTheSidebar(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let old = AIChangesCenter.shared.store
        AIChangesCenter.shared.store = nil
        defer { AIChangesCenter.shared.store = old }
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let lib = try AppSnapshotTests.container()
        let view = NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
            .overlay(alignment: .bottomLeading) { foot(.new, library: lib, nested: true).padding(.bottom, 8) }
            .frame(width: 259, height: 640)
            .background(Color(nsColor: .windowBackgroundColor))
            .environment(\.controlActiveState, .key)
            .tint(Color(PColor.paneAccent))
            .modelContainer(lib)
        try await AppSnapshotTests.shoot(view, name: "sidebar-new-account-\(dark ? "dark" : "light")", size: CGSize(width: 259, height: 640), dark: dark, wait: 1.2)
    }
}
#endif
