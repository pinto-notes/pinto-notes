#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Pictures of an AI's edit landing on the open note, the note screen itself (writing, resting
/// with the receipt), light and dark. Drawn in a borderless window that is never ordered in.
/// `AMBER_QA_SHOTS=/path scripts/qa-test.sh PaneTests/AIChangePictures`.
@MainActor @Suite(.serialized) struct AIChangePictures {
    static func snap(_ view: NSView, _ name: String) {
        guard let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: rep)
        let dir = EditorHarness.shotsDirectory
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try? rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: [false, true]) func noteScreen(dark: Bool) async throws {
        guard ProcessInfo.processInfo.environment["AMBER_QA_SHOTS"] != nil else { return }
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: AIChangeLookTests.before)
        AIEditTests.arrive(note, body: AIChangeLookTests.after, by: "ChatGPT")
        let controller = EditorController()
        let window = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: 760, height: 640), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c))
        window.contentView = host
        defer { window.close() }
        let slow = 5.0
        ChangeTint.slowMotion = slow
        ChangeTint.holdForCapture = true
        defer { ChangeTint.slowMotion = 1; ChangeTint.holdForCapture = false }
        let suffix = dark ? "-dark" : ""
        let start = Date.now
        // Writing takes 2.4 s for this edit (x5 here), after 0.15 s (x5) for the editor to take it.
        let writing = ChangeTint.writeDuration(characters: 400) * slow
        for (i, at) in [0.3, 0.6, 0.9].enumerated() {
            let t = 0.15 * slow + writing * at
            try? await Task.sleep(for: .seconds(max(0, t - Date.now.timeIntervalSince(start))))
            Self.snap(host, "screen\(suffix)-\(i + 1)-writing")
        }
        try? await Task.sleep(for: .seconds(max(0, 0.15 * slow + writing + 3 - Date.now.timeIntervalSince(start))))
        Self.snap(host, "screen\(suffix)-4-done")
    }
}
#endif
