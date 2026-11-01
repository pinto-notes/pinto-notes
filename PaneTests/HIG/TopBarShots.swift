#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The note's top bar (Emil, 11-01): back and forward on the left, the tools on the right.
/// Window-server captures, so CI only (snapshots workflow).
@MainActor @Suite(.serialized) struct TopBarShots {
    static let body = "Lisbon trip\n\nThree days in May. Flights are booked, the hotel is in Alfama.\n\n## To book\n- [ ] Tram 28 tickets\n- [x] Hotel\n- [ ] Dinner at Ramiro\n\n```swift\nlet budget = 600\n```\n\n"
        + (1...30).map { "Day plan line \($0): a walk, a café, a view." }.joined(separator: "\n\n")

    @Test(arguments: [false, true])
    func bar(dark: Bool) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        let travel = try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" } ?? c.mainContext.createFolder(named: "Travel")
        let n = c.mainContext.createNote(in: .folder(travel.id), body: Self.body)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
            let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                .tint(Color(PColor.paneAccent))
                .environment(\.controlActiveState, .key)
            let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 900), dark: dark)
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(1.5))
            // A narrower list, so the note's column is wide enough for back and forward.
            if let split = AIEditSnapshots.splitView(in: w.contentView) {
                split.setPosition(190, ofDividerAt: 0)
                split.setPosition(190 + 230, ofDividerAt: 1)
            }
            try? await Task.sleep(for: .seconds(1))
            let mode = dark ? "dark" : "light"
            try await WarmGreySnapshots.shoot(w, "topbar-top-\(mode)", in: dir)
            let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
            if let clip = editor.enclosingScrollView?.contentView {
                clip.scroll(to: NSPoint(x: 0, y: clip.bounds.origin.y + 260))
                editor.enclosingScrollView?.reflectScrolledClipView(clip)
            }
            try? await Task.sleep(for: .seconds(0.8))
            try await WarmGreySnapshots.shoot(w, "topbar-scrolled-\(mode)", in: dir)
            // The sidebar hidden: the note's column is wide enough for back and forward.
            w.makeKey()
            NSApp.sendAction(#selector(NSSplitViewController.toggleSidebar(_:)), to: nil, from: w)
            try? await Task.sleep(for: .seconds(1.2))
            try await WarmGreySnapshots.shoot(w, "topbar-wide-\(mode)", in: dir)
        }
    }
}
#endif
