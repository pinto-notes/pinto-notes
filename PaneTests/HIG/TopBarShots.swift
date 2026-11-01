#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The note's top bar study (11-01): versions A (location left, tools right), B (one plain bar)
/// and C (today's), light and dark. Window-server captures, so CI only (snapshots workflow).
@MainActor @Suite(.serialized) struct TopBarShots {
    static let body = """
    Lisbon trip

    Three days in May. Flights are booked, the hotel is in Alfama.

    ## To book
    - [ ] Tram 28 tickets
    - [x] Hotel
    - [ ] Dinner at Ramiro

    ```swift
    let budget = 600
    ```
    """

    @Test(arguments: ["A", "B", "C"])
    func bar(look: String) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let d = UserDefaults.standard
        d.set(look, forKey: "noteBarLook")
        defer { d.removeObject(forKey: "noteBarLook") }
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let travel = c.mainContext.createFolder(named: "Travel")
            let n = c.mainContext.createNote(in: .folder(travel.id), body: Self.body)
            n.updatedAt = .now.addingTimeInterval(600)
            try c.mainContext.save()
            try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
                let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                    .tint(Color(PColor.paneAccent))
                    .environment(\.controlActiveState, .key)
                let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 900), dark: dark)
                defer { w.orderOut(nil); w.close() }
                try? await Task.sleep(for: .seconds(2.5))
                try await WarmGreySnapshots.shoot(w, "topbar-\(look)-\(dark ? "dark" : "light")", in: dir)
            }
        }
    }
}
#endif
