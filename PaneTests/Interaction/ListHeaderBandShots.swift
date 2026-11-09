#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Pictures of the list's top in All Notes, Notes and Daily, light and dark, each taken on the
/// first frame after its folder was clicked. Written only with BAND_SHOTS set to a folder.
@MainActor @Suite(.serialized) struct ListHeaderBandShots {
    @Test func shots() async throws {
        guard let dir = ProcessInfo.processInfo.environment["BAND_SHOTS"] else { return }
        for dark in [true, false] {
            let (w, done) = try await ListHeaderBandTests.window(height: 520)
            defer { done() }
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            // Sidebar rows: Folders 0, All Notes 1, Notes 2, Test 3, Daily 4.
            for (name, row) in [("all", 1), ("notes", 2), ("daily", 4), ("all-again", 1)] {
                ListHeaderBandTests.clickSidebar(w, row: row)
                // The first frame with the new list.
                let before = try? MacEmptyDetailTests.list(w)
                let clock = ContinuousClock(), start = clock.now
                while clock.now - start < .seconds(2) {
                    try? await Task.sleep(for: .milliseconds(10))
                    if let now = MacWindowChromeTests.find(NSTableView.self, in: w.contentView!, where: { $0.numberOfRows > 0 && $0.style != .sourceList && $0.accessibilityLabel() != "Sidebar" }), now !== before { break }
                }
                for (k, wait) in [0, 16, 16, 32, 100].enumerated() {
                    if wait > 0 { try? await Task.sleep(for: .milliseconds(wait)) }
                    w.contentView?.layoutSubtreeIfNeeded()
                    w.displayIfNeeded()
                    let list = try MacEmptyDetailTests.list(w)
                    let scroll = try #require(list.enclosingScrollView)
                    let rep = try #require(scroll.bitmapImageRepForCachingDisplay(in: scroll.bounds))
                    scroll.cacheDisplay(in: scroll.bounds, to: rep)
                    try rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: "\(dir)/frame\(k)-\(name)-\(dark ? "dark" : "light").png"))
                }
                await MacWindowChromeTests.settle(w, 6)
            }
        }
    }
}
#endif
