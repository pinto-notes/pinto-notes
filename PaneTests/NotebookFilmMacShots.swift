#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The notebook film on the Mac, as its sheet shows it: the slides, the film and the share screen,
/// drawn offscreen in a window that's never ordered in. Without PANE_SNAPSHOT_DIR it only checks the
/// sheet comes up on its first slide; with it, it goes through the whole thing on its own (as
/// `-filmAutoCards` does) and keeps a picture every half second.
@MainActor
@Suite struct NotebookFilmMacShots {
    @Test func theFilmPlaysThroughInTheMacSheet() async throws {
        let dir = ProcessInfo.processInfo.environment["PANE_SNAPSHOT_DIR"]
        let store = NotebookFilmStore(defaults: UserDefaults(suiteName: "film-mac-\(UUID())")!, arguments: ["-forceNotebookFilm", "-filmMe", "-filmAutoCards"])
        store.showIfForced()
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let host = NSHostingView(rootView: NotebookFilmView(store: store).modelContainer(container))
        let size = CGSize(width: 440, height: 760)
        let window = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20_000, y: -20_000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        host.wantsLayer = true
        defer { window.close() }

        func picture() throws -> Data {
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            return try #require(rep.representation(using: .png, properties: [:]))
        }

        try await Task.sleep(for: .seconds(2))
        let first = try picture()
        #expect(first.count > 10_000, "the first slide is drawn")
        guard let dir else { return }
        let out = URL(fileURLWithPath: dir)
        try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
        // Through the slides (about five seconds each), the film and the share screen.
        for k in 0..<180 {
            try picture().write(to: out.appending(path: String(format: "mac-%03d.png", k)))
            try await Task.sleep(for: .milliseconds(500))
        }
    }
}
#endif
