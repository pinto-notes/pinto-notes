#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The website's template pages (web/app/templates/[slug], layout D): each plain-note template as the
/// Mac app draws it, filled in (the template's example, what its demo calls produce) and as it starts,
/// at a Mac window's size and a phone's width, and scrolled to the section a picture is about.
/// web/scripts/template-page-shots.mjs writes manifest.json into the folder and turns the PNGs into
/// the site's pictures. Offscreen: a borderless window at -20000, never ordered front or made key.
/// Runs only when TEMPLATE_PAGE_SHOTS is set:
/// `TEST_RUNNER_TEMPLATE_PAGE_SHOTS=/path scripts/qa-test.sh PaneTests/TemplatePageShots`.
@MainActor @Suite(.serialized) struct TemplatePageShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["TEMPLATE_PAGE_SHOTS"].map { URL(fileURLWithPath: $0) } }

    struct Shot: Decodable { let slug: String; let name: String; let body: String; let width: Double; let height: Double; let from: String? }

    @Test func plainTemplates() async throws {
        guard let dir = Self.dir else { return }
        let shots = try JSONDecoder().decode([Shot].self, from: Data(contentsOf: dir.appending(path: "manifest.json")))
        // The "Type / for formatting" hint is for someone who hasn't learned the / menu yet; it isn't part of a template.
        let saved = SlashRecents.defaults
        let learned = try #require(UserDefaults(suiteName: "template-page-shots"))
        learned.set(SlashRecents.learned, forKey: SlashRecents.usesKey)
        SlashRecents.defaults = learned
        defer { SlashRecents.defaults = saved; learned.removePersistentDomain(forName: "template-page-shots") }
        for shot in shots {
            let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let note = c.mainContext.createNote(in: .all, body: shot.body)
            try c.mainContext.save()
            let size = CGSize(width: shot.width, height: shot.height)
            let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
            let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: .aqua)
            let host = NSHostingView(rootView: view)
            host.appearance = window.appearance
            host.frame = CGRect(origin: .zero, size: size)
            window.contentView = host
            try? await Task.sleep(for: .seconds(1.4))
            if let from = shot.from { try Self.scroll(host, to: from) }
            try? await Task.sleep(for: .seconds(0.5))
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            let url = dir.appending(path: "\(shot.slug)/\(shot.name).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try #require(rep.representation(using: .png, properties: [:])).write(to: url)
            window.close()
        }
    }

    /// How far above the heading the scroll stops, in points: the picture then starts a line above it
    /// (measured on these pictures; the editor's own top margin takes the rest).
    static let lead: CGFloat = 80

    /// Scrolls the note's text so the line that starts with `heading` is near the top.
    static func scroll(_ root: NSView, to heading: String) throws {
        func scrolls(in view: NSView) -> [NSScrollView] {
            if let s = view as? NSScrollView, s.documentView is NSTextView { return [s] }
            return view.subviews.flatMap(scrolls)
        }
        let editor = try #require(scrolls(in: root).max(by: { $0.frame.width * $0.frame.height < $1.frame.width * $1.frame.height }))
        let text = try #require(editor.documentView as? NSTextView)
        let found = (text.string as NSString).range(of: heading)
        try #require(found.location != NSNotFound, "\(heading) isn't in the note")
        // Where that line starts in the text view, from its layout.
        var y: CGFloat?
        if let tlm = text.textLayoutManager, let tcm = tlm.textContentManager,
           let loc = tcm.location(tcm.documentRange.location, offsetBy: found.location) {
            tlm.ensureLayout(for: tcm.documentRange)
            if let frag = tlm.textLayoutFragment(for: loc) { y = frag.layoutFragmentFrame.minY + text.textContainerOrigin.y }
        } else if let lm = text.layoutManager, let tc = text.textContainer {
            let glyphs = lm.glyphRange(forCharacterRange: NSRange(location: found.location, length: 1), actualCharacterRange: nil)
            y = lm.boundingRect(forGlyphRange: glyphs, in: tc).minY + text.textContainerOrigin.y
        }
        let top = try #require(y)
        let inset = editor.contentInsets.top
        editor.contentView.scroll(to: NSPoint(x: 0, y: max(-inset, top - inset - Self.lead)))
        editor.reflectScrolledClipView(editor.contentView)
    }
}
#endif
