#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The main window's candidate looks (DesignLook) for the owner to choose from, light and dark: the
/// window on a note with a checklist, a table and a heading, the sidebar on its own (an offscreen
/// capture can't draw the sidebar's glass, so it's drawn over a flat stand-in for it and laid into
/// the window's picture afterwards), and the one toast over a note. Runs only when AMBER_HIG_SHOTS
/// is set; the look comes from PINTO_LOOK, as in a debug build:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path TEST_RUNNER_PINTO_LOOK=warm scripts/qa-test.sh PaneTests/DesignLookSnapshots`.
@MainActor @Suite(.serialized) struct DesignLookSnapshots {
    /// Where the window's sidebar panel sits in an offscreen capture of RootView at 1180 by 760.
    static let sidebar = CGRect(x: 8, y: 8, width: 230, height: 744)

    /// A flat stand-in for the sidebar's glass over a plain desktop.
    static func glass(_ dark: Bool) -> Color { dark ? Color(white: 0.17) : Color(white: 0.93) }

    @Test(arguments: [false, true])
    func window(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light", look = DesignLook.current.rawValue
        let c = try AppSnapshotTests.container()
        NoteDetailView.captureWithoutToolbar = true
        defer { NoteDetailView.captureWithoutToolbar = false }
        // The first window of a run opens on the welcome note whatever was asked: one to warm up.
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "look-\(look)-root-\(mode)", size: CGSize(width: 1180, height: 760), dark: dark, wait: 0.6)
        }
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "look-\(look)-root-\(mode)", size: CGSize(width: 1180, height: 760), dark: dark, wait: 2.6)
        }
        // A wide window: where D's reading column shows (the note's pane past 680 pt).
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "look-\(look)-wide-\(mode)", size: CGSize(width: 1500, height: 900), dark: dark, wait: 2.6)
        }
        // The pointer over Groceries in the list, with Lisbon selected.
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c).environment(\.hoverPreview, ["Groceries"]), name: "look-\(look)-hover-\(mode)",
                                             size: CGSize(width: 1180, height: 760), dark: dark, wait: 2.6)
        }
        // One folder: its rows have no folder line (only All Notes and search show it).
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            UserDefaults.standard.set(try JSONEncoder().encode(Scope.folder(travel.id)), forKey: "lastScope")
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "look-\(look)-folder-\(mode)", size: CGSize(width: 1180, height: 760), dark: dark, wait: 2.6)
        }
        try await AppSnapshotTests.withLastNote(c, "Evening tracker") {
            try await AppSnapshotTests.shoot(RootView().modelContainer(c), name: "look-\(look)-tracker-\(mode)", size: CGSize(width: 1180, height: 760), dark: dark, wait: 2.6)
        }
        // The sidebar's List draws no rows offscreen (its rows come only in a window on screen), so
        // its rows are laid out here from the real row parts: the icon, the name and the count.
        let rows: [(String, String, Int, Bool)] = [("All Notes", "tray.full", 12, false), ("Notes", "folder", 5, false), ("Ideas", "folder", 2, false),
                                                   ("Travel", "folder", 3, true), ("Work", "folder", 2, false), ("Q4 planning", "folder", 1, false)]
        let side = { (hovered: Set<String>) in VStack(alignment: .leading, spacing: 0) {
            if DesignLook.calmList { Color.clear.frame(height: 20) } else { SidebarHeader().padding(.bottom, 12) }
            ForEach(rows, id: \.0) { title, icon, count, selected in
                Label {
                    SidebarRowText(title: title, selected: selected) { Text(count, format: .number).monospacedDigit().foregroundStyle(.secondary) }
                } icon: {
                    SidebarIcon(name: icon, selected: selected)
                }
                .sidebarRowLabel()
                .hoverRow(title, reach: Hover.sidebarReach(), selected: selected)
                .padding(.horizontal, 14)
                .frame(height: 32)
            }
            Spacer()
        }
        .padding(.top, 10)
        .frame(width: Self.sidebar.width, height: Self.sidebar.height, alignment: .topLeading)
        .background(Color(Palette.sidebarWarmth))
        .background(Self.glass(dark))
        .tint(Color(PColor.paneAccent))
        .environment(\.controlActiveState, .key)
        .environment(\.hoverPreview, hovered)
        }
        try await AppSnapshotTests.shoot(side([]), name: "look-\(look)-sidebar-\(mode)", size: Self.sidebar.size, dark: dark, wait: 0.6)
        // The pointer over Ideas, beside the selected Travel.
        try await AppSnapshotTests.shoot(side(["Ideas"]), name: "look-\(look)-sidebarhover-\(mode)", size: Self.sidebar.size, dark: dark, wait: 0.6)
        let toast = ZStack(alignment: .bottom) {
            Color.notePage
            Toast(text: "Imported 4 notes").padding(.bottom, 48)
        }
        try await AppSnapshotTests.shoot(toast, name: "look-\(look)-toast-\(mode)", size: CGSize(width: 420, height: 180), dark: dark)
    }
}
#endif
