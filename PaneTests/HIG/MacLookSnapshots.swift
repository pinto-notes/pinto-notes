#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Mac window against Apple Notes (the 2026-10-11 pass): the sidebar's selection and its
/// Recently Deleted row, and the account row at its foot, each in light and dark,
/// with the alternative look where there is one. Offscreen, like the other shots:
/// `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/MacLookSnapshots`.
@MainActor @Suite(.serialized) struct MacLookSnapshots {
    static func sidebar(_ c: ModelContainer, scope: Scope) -> some View {
        NavigationStack { SidebarView(scope: .constant(scope), onNewNote: {}) }
            .frame(width: 260, height: 400)
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
            // As in the window in front: the capture's own window is never key.
            .environment(\.controlActiveState, .key)
    }

    /// A folder selected, All Notes selected, a folder under the pointer beside the selection,
    /// and Recently Deleted once a note is in it (it has no row before).
    @Test(arguments: [false, true])
    func sidebarSelection(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let c = try AppSnapshotTests.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-folder-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .all), name: "mac-look-sidebar-all-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)).environment(\.hoverPreview, ["Travel"]), name: "mac-look-sidebar-hover-\(mode)", dark: dark)
        Hover.tintedSelection = true
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-folder-alt-tinted-\(mode)", dark: dark)
        Hover.tintedSelection = false
        // Two notes deleted: the row is back, last, with its count.
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>()).filter { $0.trashedAt == nil && $0.deletedAt == nil }
        c.mainContext.remove(Array(notes.prefix(2)))
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .folder(ideas.id)), name: "mac-look-sidebar-deleted-\(mode)", dark: dark)
        try await AppSnapshotTests.render(Self.sidebar(c, scope: .trash), name: "mac-look-sidebar-deleted-open-\(mode)", dark: dark)
    }

    /// The selection is drawn by the rows, so it has to follow the selection when it changes
    /// under a sidebar that is already up (the window hands it over as an equatable view, which
    /// skips updates from outside): Ideas first, then Travel, in the same view.
    @Test func theDrawnSelectionFollowsTheSelection() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        let ideas = try #require(c.mainContext.allFolders().first { $0.name == "Ideas" })
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let box = ScopeBox(scope: .folder(ideas.id))
        let host = NSHostingView(rootView: FollowingSidebar(box: box).modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 260, height: 400), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: .darkAqua)
        window.contentView = host
        defer { window.close() }
        func shot(_ name: String) throws -> Data {
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            let png = try #require(rep.representation(using: .png, properties: [:]))
            try png.write(to: dir.appending(path: "\(name).png"))
            return png
        }
        try? await Task.sleep(for: .seconds(0.8))
        let first = try shot("mac-look-sidebar-follows-1-ideas")
        box.scope = .folder(travel.id)
        try? await Task.sleep(for: .seconds(0.8))
        let second = try shot("mac-look-sidebar-follows-2-travel")
        #expect(first != second, "the drawn selection moved with the selection")
    }

    /// The account row: a name with a photo, a name alone (initials), and no name yet, which is
    /// "Your account" with a person, never an address. The alternative adds the email under the name.
    @Test(arguments: [false, true])
    func accountRow(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        backend.showSignedInForPreview(email: "f7k6w27tsh@privaterelay.appleid.com")
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        func row(_ email: String? = nil) -> some View {
            AccountButton(backend: backend, email: email).frame(width: 240).padding(10).tint(Color(PColor.paneAccent))
        }
        let face = try ProfileImage.prepare(try #require(NSImage(named: "MarkTight")?.tiffRepresentation))
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        try await AppSnapshotTests.render(row(), name: "mac-look-account-name-\(mode)", dark: dark)
        try await AppSnapshotTests.render(row("emil@example.com"), name: "mac-look-account-alt-email-\(mode)", dark: dark)
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: NSImage(data: face))
        try await AppSnapshotTests.render(row(), name: "mac-look-account-photo-\(mode)", dark: dark)
        ProfileStore.shared.showForPreview(name: nil, photo: nil)
        try await AppSnapshotTests.render(row(), name: "mac-look-account-noname-\(mode)", dark: dark)
    }
}

@MainActor @Observable private final class ScopeBox {
    var scope: Scope?
    init(scope: Scope?) { self.scope = scope }
}

/// The sidebar as the window holds it: its selection bound to state outside it, and equatable.
private struct FollowingSidebar: View {
    @Bindable var box: ScopeBox
    var body: some View {
        NavigationStack { SidebarView(scope: $box.scope, onNewNote: {}).equatable() }
            .frame(width: 260, height: 400)
    }
}
#endif
