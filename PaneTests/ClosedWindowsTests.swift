#if os(macOS)
import AppKit
import Testing

/// A closed test window lets go of what it shows (PaneTestsLoaded, PaneTests/Harness/ClosedWindows.swift).
@MainActor @Suite struct ClosedWindowsTests {
    @Test func aClosedTestWindowLetsGoOfWhatItShows() async throws {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 100, height: 100), styleMask: [.titled], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        weak var shown: NSView?
        do {
            let v = NSView()
            w.contentView = v
            shown = v
        }
        w.close()
        try? await Task.sleep(for: .milliseconds(50))
        #expect(w.contentView == nil)
        #expect(shown == nil)
    }
}
#endif
