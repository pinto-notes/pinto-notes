#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// An account with nothing in it, whose first run didn't come (newcomer audit #19: a second,
/// brand-new account on a Mac that had run setup showed "No Notes" and nothing to press). The
/// empty library offers its two ways to start in place: New Note, and Bring Your Notes.
@MainActor @Suite(.serialized) struct EmptyLibraryTests {
    final class Pressed { var newNote = 0, bring = 0 }

    static func window(scope: Scope, pressed: Pressed, dark: Bool = false) async throws -> NSWindow {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let root = NavigationStack {
            NoteListView(scope: scope, selection: .constant([]), onNewNote: { pressed.newNote += 1 })
        }
        .environment(\.importActions, ImportActions(appleNotes: { pressed.bring += 1 }, from: { _ in }))
        .modelContainer(c)
        .tint(Color(PColor.paneAccent))
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 320, height: 520), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: root)
        w.setContentSize(CGSize(width: 320, height: 520))
        try await Task.sleep(for: .seconds(0.6))
        w.contentView?.layoutSubtreeIfNeeded()
        return w
    }

    /// Accessibility elements with these identifiers, as VoiceOver and the UI tests find them.
    static func elements(_ root: Any, _ wanted: Set<String>, depth: Int = 0) -> [String: NSAccessibilityElementProtocol] {
        guard depth < 40, let el = root as? NSAccessibilityProtocol else { return [:] }
        var out: [String: NSAccessibilityElementProtocol] = [:]
        if let id = (root as? NSObject)?.value(forKey: "accessibilityIdentifier") as? String, wanted.contains(id), let e = root as? NSAccessibilityElementProtocol { out[id] = e }
        for k in el.accessibilityChildren() ?? [] { out.merge(elements(k, wanted, depth: depth + 1)) { a, _ in a } }
        return out
    }

    @Test func anEmptyLibraryOffersNewNoteAndBringYourNotes() async throws {
        let pressed = Pressed()
        let w = try await Self.window(scope: .all, pressed: pressed)
        defer { w.close() }
        let found = Self.elements(try #require(w.contentView), ["empty.newNote", "empty.bringNotes"])
        let newNote = try #require(found["empty.newNote"] as? NSAccessibilityButton)
        let bring = try #require(found["empty.bringNotes"] as? NSAccessibilityButton)
        _ = newNote.accessibilityPerformPress()
        _ = bring.accessibilityPerformPress()
        #expect(pressed.newNote == 1 && pressed.bring == 1)

        // Pictures for the review, light and dark.
        guard let dir = AppSnapshotTests.dir else { return }
        for dark in [false, true] {
            let shot = try await Self.window(scope: .all, pressed: Pressed(), dark: dark)
            defer { shot.close() }
            let view = try #require(shot.contentView)
            let rep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
            view.cacheDisplay(in: view.bounds, to: rep)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "empty-library-\(dark ? "dark" : "light").png"))
        }
    }

    /// An empty folder keeps the quiet "No Notes": the compose button is the way to start there.
    @Test func anEmptyFolderStaysQuiet() async throws {
        let w = try await Self.window(scope: .folder(UUID()), pressed: Pressed())
        defer { w.close() }
        #expect(Self.elements(try #require(w.contentView), ["empty.newNote", "empty.bringNotes"]).isEmpty)
    }
}
#endif
