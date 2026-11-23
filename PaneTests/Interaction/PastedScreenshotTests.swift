#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A screenshot copied straight to the clipboard (Shottr, Cmd-Ctrl-Shift-4) carries only image data,
/// no text and no file. Paste has to be on for it, as in Apple Notes (support, Moebius 11-22:
/// Cmd-V did nothing and the context menu's Paste was greyed out).
@MainActor @Suite(.serialized) struct PastedScreenshotTests {
    /// A small screenshot-like picture: an orange area with a light panel in it.
    static func png() -> Data {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 360, pixelsHigh: 160, bitsPerSample: 8, samplesPerPixel: 4,
                                   hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSColor.systemOrange.setFill(); NSRect(x: 0, y: 0, width: 360, height: 160).fill()
        NSColor.white.setFill(); NSRect(x: 24, y: 24, width: 200, height: 112).fill()
        NSGraphicsContext.restoreGraphicsState()
        return rep.representation(using: .png, properties: [:])!
    }

    func withClipboard(_ fill: (NSPasteboard) -> Void, _ body: () async -> Void) async {
        let pb = NSPasteboard.general
        let saved = pb.string(forType: .string)
        defer { pb.clearContents(); if let saved { pb.setString(saved, forType: .string) } }
        pb.clearContents()
        fill(pb)
        await body()
    }

    static func textView(in v: NSView) -> PaneTextView? {
        if let t = v as? PaneTextView { return t }
        for s in v.subviews { if let t = textView(in: s) { return t } }
        return nil
    }

    func pasteIsOn(_ h: EditorHarness) -> Bool {
        h.view.validateUserInterfaceItem(NSMenuItem(title: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v"))
    }

    @Test func pasteIsOnForAScreenshotOnTheClipboard() async {
        let h = await EditorHarness("Ideas\n\n")
        defer { h.close() }
        await withClipboard({ $0.setData(Self.png(), forType: .png) }) {
            #expect(pasteIsOn(h), "PNG only, as Shottr copies it")
        }
        await withClipboard({ $0.setData(NSImage(data: Self.png())!.tiffRepresentation!, forType: .tiff) }) {
            #expect(pasteIsOn(h), "TIFF only, as some screenshot tools copy it")
        }
    }

    /// The whole path in the real note view: Cmd-V asks the menu item first, as AppKit does, then
    /// pastes; the screenshot is saved with the note and shown in it.
    @Test func cmdVPutsAScreenshotInTheNote() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: "Ideas\n\n")
        try c.mainContext.save()
        let controller = EditorController()
        let view = NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }
            .modelContainer(c).frame(width: 720, height: 800)
        let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 720, height: 800), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        // Tear the view down before the in-memory store goes: queued card layouts read it.
        defer { w.contentView = nil; w.close(); withExtendedLifetime(c) {} }
        let hosting = NSHostingView(rootView: view)
        w.contentView = hosting
        hosting.layoutSubtreeIfNeeded()
        w.displayIfNeeded()
        let tv = try #require(Self.textView(in: hosting))
        tv.setSelectedRange(NSRange(location: (tv.string as NSString).length, length: 0))
        await withClipboard({ $0.setData(Self.png(), forType: .png) }) {
            let item = NSMenuItem(title: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
            if tv.validateUserInterfaceItem(item) { tv.paste(item) }
        }
        try await Task.sleep(for: .milliseconds(600))
        // The user's path, as a picture: .shots/qa/pasted-screenshot.png (scripts/qa-shots.sh).
        hosting.layoutSubtreeIfNeeded()
        if let rep = hosting.bitmapImageRepForCachingDisplay(in: hosting.bounds) {
            hosting.cacheDisplay(in: hosting.bounds, to: rep)
            try? FileManager.default.createDirectory(at: EditorHarness.shotsDirectory, withIntermediateDirectories: true)
            try? rep.representation(using: .png, properties: [:])?.write(to: EditorHarness.shotsDirectory.appending(path: "pasted-screenshot.png"))
        }
        let files = try c.mainContext.fetch(FetchDescriptor<Pane.Attachment>())
        defer { for f in files { try? FileManager.default.removeItem(at: FileStore.url(for: f.id, filename: f.filename).deletingLastPathComponent()) } }
        #expect(files.count == 1, "the screenshot is saved with the note")
        if let f = files.first { #expect(tv.string.contains(f.markdown), "and shown in it") }
    }

    @Test func pasteStaysOffWithNothingToPaste() async {
        let h = await EditorHarness("Ideas\n\n")
        defer { h.close() }
        await withClipboard({ _ in }) {
            #expect(!pasteIsOn(h))
        }
    }
}
#endif
