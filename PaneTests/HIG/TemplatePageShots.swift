import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The website's template pages (web/app/templates/[slug], layout D): each plain-note template as
/// the app draws it, at each slide's step (the note before or after the change its chat talks
/// about, from the template's demo calls), and scrolled to the section a slide is about. The Mac
/// pictures ("mac-…") come from the Mac app, the iPhone ones ("phone-…") from the iPhone app on a
/// simulator. web/scripts/template-page-shots.mjs writes manifest.json into the folder and turns
/// the PNGs into the site's pictures. Runs only when TEMPLATE_PAGE_SHOTS is set:
///   Mac: `TEST_RUNNER_TEMPLATE_PAGE_SHOTS=/path scripts/qa-test.sh PaneTests/TemplatePageShots`
///   iPhone: `scripts/template-page-shots-iphone.sh /path` (a headless simulator of its own).
/// Offscreen on the Mac: a borderless window at -20000, never ordered front or made key.
@MainActor @Suite(.serialized) struct TemplatePageShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["TEMPLATE_PAGE_SHOTS"].map { URL(fileURLWithPath: $0) } }

    struct Shot: Decodable { let slug: String; let name: String; let body: String; let width: Double; let height: Double; let from: String? }

    static func shots(_ prefix: String) throws -> [Shot]? {
        guard let dir else { return nil }
        let all = try JSONDecoder().decode([Shot].self, from: Data(contentsOf: dir.appending(path: "manifest.json")))
        let only = ProcessInfo.processInfo.environment["TEMPLATE_PAGE_SHOTS_ONLY"].flatMap { $0.isEmpty ? nil : $0 }.map { Set($0.split(separator: ",").map(String.init)) }
        return all.filter { $0.name.hasPrefix(prefix) && (only?.contains($0.slug) ?? true) }
    }

    static func note(_ body: String) throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: body)
        try c.mainContext.save()
        return (c, note)
    }

    static func file(_ shot: Shot, in dir: URL) throws -> URL {
        let url = dir.appending(path: "\(shot.slug)/\(shot.name).png")
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        return url
    }

    /// Where the heading's line starts, in the text's own coordinates. A heading is a "## …" line
    /// or a bold label on a line of its own ("**Meat and fish**").
    static func offset(of heading: String, in text: String) throws -> Int {
        // The line that is the heading, not the same words inside another line.
        let lines = text.components(separatedBy: "\n")
        var at = 0
        for line in lines {
            let bare = line.replacingOccurrences(of: #"^#+\s*"#, with: "", options: .regularExpression)
                .replacingOccurrences(of: #"^\*\*(.*)\*\*$"#, with: "$1", options: .regularExpression)
            if bare == heading || line == heading { return (text as NSString).range(of: heading, range: NSRange(location: at, length: (line as NSString).length)).location }
            at += (line as NSString).length + 1
        }
        let found = (text as NSString).range(of: heading)
        try #require(found.location != NSNotFound, "\(heading) isn't in the note")
        return found.location
    }

    #if os(macOS)
    @Test func plainTemplates() async throws {
        guard let dir = Self.dir, let shots = try Self.shots("mac-") else { return }
        // The "Type / for formatting" hint is for someone who hasn't learned the / menu yet; it isn't part of a template.
        let saved = SlashRecents.defaults
        let learned = try #require(UserDefaults(suiteName: "template-page-shots"))
        learned.set(SlashRecents.learned, forKey: SlashRecents.usesKey)
        SlashRecents.defaults = learned
        defer { SlashRecents.defaults = saved; learned.removePersistentDomain(forName: "template-page-shots") }
        // No toolbar in a borderless window: without its fade the note's title shows, as it does under one.
        NoteDetailView.captureWithoutToolbar = true
        defer { NoteDetailView.captureWithoutToolbar = false }
        for shot in shots {
            let (c, note) = try Self.note(shot.body)
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
            let short = try shot.from.map { try Self.scroll(host, to: $0) } ?? 0
            try? await Task.sleep(for: .seconds(0.5))
            host.layoutSubtreeIfNeeded()
            var rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            // A heading near the note's end can't scroll up to the top: the picture then starts just
            // above it instead (the window's top cropped off), and is white below the note.
            if short > 4 { rep = try Self.raised(rep, by: short) }
            try #require(rep.representation(using: .png, properties: [:])).write(to: Self.file(shot, in: dir))
            window.close()
        }
    }

    /// How far above the heading the scroll stops, in points.
    static let lead: CGFloat = 14

    /// The picture moved up by `points`, white where it leaves the foot.
    static func raised(_ rep: NSBitmapImageRep, by points: CGFloat) throws -> NSBitmapImageRep {
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: rep.pixelsWide, pixelsHigh: rep.pixelsHigh, bitsPerSample: 8,
                                                samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = rep.size
        NSGraphicsContext.saveGraphicsState()
        defer { NSGraphicsContext.restoreGraphicsState() }
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        NSColor.white.setFill()
        NSRect(origin: .zero, size: rep.size).fill()
        rep.draw(in: NSRect(x: 0, y: points, width: rep.size.width, height: rep.size.height))
        return out
    }

    /// Scrolls the note's text so the line that is `heading` is near the top. Returns how far short
    /// of that the scroll stopped, in points (a heading near the end can only come up so far).
    @discardableResult
    static func scroll(_ root: NSView, to heading: String) throws -> CGFloat {
        func scrolls(in view: NSView) -> [NSScrollView] {
            if let s = view as? NSScrollView, s.documentView is NSTextView { return [s] }
            return view.subviews.flatMap(scrolls)
        }
        let editor = try #require(scrolls(in: root).max(by: { $0.frame.width * $0.frame.height < $1.frame.width * $1.frame.height }))
        let text = try #require(editor.documentView as? NSTextView)
        let found = try Self.offset(of: heading, in: text.string)
        // Where that line starts in the text view, from its layout.
        var y: CGFloat?
        if let tlm = text.textLayoutManager, let tcm = tlm.textContentManager,
           let loc = tcm.location(tcm.documentRange.location, offsetBy: found) {
            tlm.ensureLayout(for: tcm.documentRange)
            if let frag = tlm.textLayoutFragment(for: loc) { y = frag.layoutFragmentFrame.minY + text.textContainerOrigin.y }
        } else if let lm = text.layoutManager, let tc = text.textContainer {
            let glyphs = lm.glyphRange(forCharacterRange: NSRange(location: found, length: 1), actualCharacterRange: nil)
            y = lm.boundingRect(forGlyphRange: glyphs, in: tc).minY + text.textContainerOrigin.y
        }
        let top = try #require(y)
        let inset = editor.contentInsets.top
        let wanted = max(-inset, top - inset - Self.lead)
        editor.contentView.scroll(to: editor.contentView.constrainBoundsRect(NSRect(origin: NSPoint(x: 0, y: wanted), size: editor.contentView.bounds.size)).origin)
        editor.reflectScrolledClipView(editor.contentView)
        return wanted - editor.contentView.bounds.minY
    }
    #endif

    #if os(iOS)
    /// The iPhone app's note screen, as the simulator's screen shows it (its navigation bar and the
    /// note under it), without the status bar: the page draws its own over the picture.
    @Test func plainTemplatesOnIPhone() async throws {
        guard let dir = Self.dir, let shots = try Self.shots("phone-") else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for shot in shots {
            let (c, note) = try Self.note(shot.body)
            let window = UIWindow(windowScene: scene)
            window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
            window.overrideUserInterfaceStyle = .light
            let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
            window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)).environment(\.locale, Locale(identifier: "en_US")))
            window.isHidden = false
            try? await Task.sleep(for: .seconds(1.6))
            var top = window.safeAreaInsets.top
            if let from = shot.from {
                try Self.scroll(window, to: from)
                try? await Task.sleep(for: .seconds(0.6))
                // A heading near the note's end can't scroll up to the bar: the picture then starts
                // just above it instead (the screen's top cropped off), and is white below the note.
                let (at, wanted) = try Self.heading(from, in: window)
                if at > wanted + 4 { top = at - Self.lead }
            } else {
                try? await Task.sleep(for: .seconds(0.6))
            }
            let status = window.safeAreaInsets.top
            let bounds = CGRect(x: 0, y: top, width: window.bounds.width, height: window.bounds.height - status)
            let format = UIGraphicsImageRendererFormat()
            format.scale = 2
            format.opaque = true
            let image = UIGraphicsImageRenderer(bounds: bounds, format: format).image { ctx in
                UIColor.white.setFill()
                ctx.fill(bounds)
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            window.isHidden = true
            try #require(image.pngData()).write(to: Self.file(shot, in: dir))
        }
    }

    /// How far above the heading the scroll stops, under the navigation bar, in points.
    static let lead: CGFloat = 10

    static func editor(in root: UIView) throws -> UITextView {
        func editors(in view: UIView) -> [UITextView] {
            if let t = view as? UITextView, t.isScrollEnabled { return [t] }
            return view.subviews.flatMap(editors)
        }
        return try #require(editors(in: root).max(by: { $0.bounds.width * $0.bounds.height < $1.bounds.width * $1.bounds.height }))
    }

    /// Where the heading's line starts in the text view, as the editor's own capture scroll finds it
    /// (DateFold.scrollToText): from the line's layout fragment.
    static func lineY(_ heading: String, in text: UITextView) throws -> CGFloat {
        let found = try Self.offset(of: heading, in: text.text)
        let tlm = try #require(text.textLayoutManager)
        let tcm = try #require(tlm.textContentManager)
        let loc = try #require(tcm.location(tcm.documentRange.location, offsetBy: found))
        tlm.ensureLayout(for: tcm.documentRange)
        let frag = try #require(tlm.textLayoutFragment(for: loc))
        return frag.layoutFragmentFrame.minY + text.textContainerInset.top
    }

    /// The heading's top in the window, and where scrolling meant to put it (`lead` under the bar).
    static func heading(_ heading: String, in window: UIWindow) throws -> (at: CGFloat, wanted: CGFloat) {
        let text = try Self.editor(in: window)
        let at = text.convert(CGPoint(x: 0, y: try Self.lineY(heading, in: text)), to: window).y
        let wanted = text.convert(CGPoint(x: 0, y: text.contentOffset.y + text.adjustedContentInset.top + Self.lead), to: window).y
        return (at, wanted)
    }

    /// Scrolls the note's text so the line that is `heading` sits just under the navigation bar.
    static func scroll(_ root: UIView, to heading: String) throws {
        let text = try Self.editor(in: root)
        let y = try Self.lineY(heading, in: text)
        let inset = text.adjustedContentInset.top
        let most = max(-inset, text.contentSize.height - text.bounds.height + text.adjustedContentInset.bottom)
        text.setContentOffset(CGPoint(x: 0, y: min(most, max(-inset, y - inset - Self.lead))), animated: false)
        text.layoutIfNeeded()
    }
    #endif
}
