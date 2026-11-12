#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Tags in a note, the tags offered while one is typed, and the window with the sidebar's Tags and
/// a tag's list, in light and dark. Drawn from windows that are never shown (far off screen, never
/// ordered in), like ThemeShots and DateChipShots: nothing appears on the display.
/// `TEST_RUNNER_PANE_TAG_SHOTS=/path scripts/qa-test.sh PaneTests/TagShots`
@MainActor @Suite(.serialized) struct TagShots {
    static let note = """
    Acme kickoff

    Met with Dana and Theo about the spring launch. #work/clients #meetings

    ## Decisions
    - Ship the beta on the 14th #launch
    - Weekly check-in on Thursdays
    - Theo owns the pricing page (#growth)

    ## Next
    - [ ] Send the deck to Theo #todo
    - [x] Book the room #todo

    Issue #42 is still open, and `#fff` is the page colour, so neither is a tag.
    """

    static let others = [
        "Standup notes\n\nBlockers cleared, demo on Friday. #work #meetings",
        "Reading list\n\n- Four Thousand Weeks #books\n- The Making of Prince of Persia #books #games",
        "Kitchen remodel\n\nTiles picked, the plumber comes Tuesday. #home",
        "Q3 planning\n\nGoals and budget for the quarter. #work",
        "Launch checklist\n\n- [ ] Press kit\n- [ ] Changelog #launch #work/clients",
    ]

    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        for (i, body) in others.enumerated() {
            let n = c.mainContext.createNote(in: .all, body: body)
            n.updatedAt = .now.addingTimeInterval(Double(100 + i * 10))
        }
        let n = c.mainContext.createNote(in: .all, body: note)
        n.updatedAt = .now.addingTimeInterval(600)
        // Labels from the right-click (NoteLabels): on the open note and two others in the list.
        n.frontMatter = NoteLabels.setting(["Needs review", "Q2"], in: nil)
        let all = (try? c.mainContext.fetch(FetchDescriptor<Note>())) ?? []
        for (title, labels) in [("Launch checklist", ["Needs review"]), ("Q3 planning", ["Waiting on Theo"])] {
            all.first { $0.title == title }?.frontMatter = NoteLabels.setting(labels, in: nil)
        }
        try c.mainContext.save()
        return c
    }

    /// The text view as it draws, with the suggestion list (a view of its own) where it sits.
    /// The list is drawn again in a borderless window of its own (a hosting view inside the text
    /// view draws nothing through cacheDisplay offscreen).
    static func render(_ tv: PaneTextView, dark: Bool) async throws -> Data {
        let base = try #require(NSBitmapImageRep(data: CodeBlockShots.render(tv, dark: dark)))
        guard let controller = tv.controller, let q = controller.wikiQuery, !controller.wikiSuggestions.isEmpty else {
            return try #require(base.representation(using: .png, properties: [:]))
        }
        // Where the text view puts it: under the `#` of the tag being typed.
        let frame: CGRect
        if let list = tv.subviews.first(where: { $0 is NSHostingView<WikiSuggestionList> }) {
            frame = list.frame
        } else {
            let screen = tv.firstRect(forCharacterRange: NSRange(location: q.location - 1, length: 1), actualRange: nil)
            let at = tv.convert(tv.window!.convertFromScreen(screen), from: nil)
            frame = CGRect(origin: CGPoint(x: at.minX - 8, y: at.maxY + 4), size: WikiSuggestionList.size(rows: controller.wikiSuggestions.count))
        }
        let rep = try await ThemeShots.host(WikiSuggestionList(controller: controller).tint(Color(PColor.paneAccent)), size: frame.size, dark: dark, wait: 0.6)
        // A new bitmap: one read from a PNG can't be drawn into.
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: base.pixelsWide, pixelsHigh: base.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = base.size
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        let h = base.size.height
        base.draw(in: CGRect(origin: .zero, size: base.size))
        // Clipped to the list's rounded corners: the drawing window's own ground shows past them.
        let at = CGRect(x: frame.minX, y: h - frame.maxY, width: frame.width, height: frame.height)
        NSBezierPath(roundedRect: at, xRadius: 8, yRadius: 8).setClip()
        rep.draw(in: at)
        return try #require(out.representation(using: .png, properties: [:]))
    }

    @Test func states() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_TAG_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try Self.library()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Acme kickoff" })
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            try await AppSnapshotTests.withLastNote(c, "Acme kickoff") {
                let w = ThemeShots.window(c, dark: dark)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let tv = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                // The note at rest: its tags in the accent.
                try CodeBlockShots.render(tv, dark: dark).write(to: dir.appending(path: "tags-note-\(mode).png"))

                // The window: Tags under the folders, #work picked, its notes in the list.
                let page = try ThemeShots.page(w, ThemeShots.shot(w))
                let sidebar = try await ThemeShots.host(NavigationStack { SidebarView(scope: .constant(.tag("work")), onNewNote: {}) }
                    .modelContainer(c).environment(TagIndex()).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 220, height: page.size.height), dark: dark)
                let list = try await ThemeShots.host(NavigationStack { NoteListView(scope: .tag("work"), selection: .constant([note.id]), onNewNote: {}) }
                    .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 280, height: page.size.height), dark: dark, wait: 2.5, layers: true)
                try #require(ThemeShots.stitch([sidebar, list, page]).representation(using: .png, properties: [:]))
                    .write(to: dir.appending(path: "tags-window-\(mode).png"))

                // Typing a tag after a decision: the library's tags under the caret.
                let line = (tv.string as NSString).range(of: "Weekly check-in on Thursdays")
                tv.setSelectedRange(NSRange(location: NSMaxRange(line), length: 0))
                w.makeFirstResponder(tv)
                tv.insertText(" #wo", replacementRange: tv.selectedRange())
                await MacWindowChromeTests.settle(w, 4)
                tv.controller?.typingChanged(text: tv.string, selection: tv.selectedRange())
                tv.layoutWikiSuggestions()
                await MacWindowChromeTests.settle(w, 4)
                #expect(tv.controller?.wikiSuggestions == ["work", "work/clients"])
                try await Self.render(tv, dark: dark).write(to: dir.appending(path: "tags-typing-\(mode).png"))
                tv.undoManager?.removeAllActions()
                note.body = Self.note
                // Newest again, so the dark window lists the notes as the light one did.
                note.updatedAt = .now.addingTimeInterval(600)
                try c.mainContext.save()
            }
        }
    }
}
#endif
