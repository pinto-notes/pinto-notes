#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// Pictures of the list's top in a folder and in All Notes, light and dark: as it shows now, and
/// with the heading left pinned at rest (how a new list showed before 9 November 2026). Written
/// only with BAND_SHOTS set to a folder.
@MainActor @Suite(.serialized) struct ListHeaderBandShots {
    @Test func shots() async throws {
        guard let dir = ProcessInfo.processInfo.environment["BAND_SHOTS"] else { return }
        for dark in [true, false] {
            let (w, done) = try await ListHeaderBandTests.window(height: 520)
            defer { done() }
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            for (name, row) in [("notes", 2), ("all", 1)] {
                ListHeaderBandTests.clickSidebar(w, row: row)
                await MacWindowChromeTests.settle(w, 8)
                let list = try MacEmptyDetailTests.list(w)
                let scroll = try #require(list.enclosingScrollView)
                for (kind, floats) in [("after", list.floatsGroupRows), ("before", true)] {
                    list.floatsGroupRows = floats
                    await MacWindowChromeTests.settle(w, 2)
                    let rep = try #require(scroll.bitmapImageRepForCachingDisplay(in: scroll.bounds))
                    scroll.cacheDisplay(in: scroll.bounds, to: rep)
                    try rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: "\(dir)/\(kind)-\(name)-\(dark ? "dark" : "light").png"))
                }
                list.floatsGroupRows = false
            }
        }
    }
}
#endif
