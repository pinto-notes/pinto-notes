#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Privacy mode in the real editor (untouched), list, cover and menu, offscreen (Emil, 13 November 2026).
@MainActor @Suite(.serialized) struct PrivacyModeInteractionTests {
    /// Every test leaves the app's own privacy mode off, asking, and watching nothing.
    static func reset() { PrivacyModeInteractionReset.reset() }

    static let note = "Secret plan\nBuy the ring on Friday\nTell nobody at work\n"

    static func offset(_ h: EditorHarness, _ s: String) -> Int { (h.text as NSString).range(of: s).location }

    /// The darkest pixel's brightness (0 black, 1 white) inside `rect` of the text view, as drawn.
    static func darkest(_ h: EditorHarness, in rect: CGRect) -> CGFloat {
        let view = h.view
        let bounds = view.visibleRect
        guard let rep = view.bitmapImageRepForCachingDisplay(in: bounds) else { return 1 }
        view.cacheDisplay(in: bounds, to: rep)
        let sx = CGFloat(rep.pixelsWide) / bounds.width, sy = CGFloat(rep.pixelsHigh) / bounds.height
        let r = rect.intersection(bounds)
        return darkest(rep, in: CGRect(x: (r.minX - bounds.minX) * sx, y: view.isFlipped ? (r.minY - bounds.minY) * sy : (bounds.maxY - r.maxY) * sy,
                                       width: min(r.width, 400) * sx, height: r.height * sy))
    }

    /// The darkest pixel in `rect` (pixels, from the top), composited over white.
    static func darkest(_ rep: NSBitmapImageRep, in rect: CGRect) -> CGFloat {
        var low: CGFloat = 1
        for y in Int(rect.minY)..<min(Int(rect.maxY), rep.pixelsHigh) {
            for x in Int(rect.minX)..<min(Int(rect.maxX), rep.pixelsWide) {
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB) else { continue }
                let lum = 0.299 * c.redComponent + 0.587 * c.greenComponent + 0.114 * c.blueComponent
                low = min(low, 1 - c.alphaComponent * (1 - lum / max(c.alphaComponent, 0.001)))
            }
        }
        return low
    }

    /// The note you have open is never blurred: privacy mode only hides previews (Emil, 13
    /// November 2026: "we can't be hiding the notes that you have open"). Every line draws as
    /// sharp with it on as with it off, and you can type.
    @Test func theOpenNoteIsNeverBlurred() async throws {
        Self.reset()
        defer { Self.reset() }
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        await h.caret(after: "Buy the")
        let lines = ["Secret plan", "Buy the", "Tell nobody"]
        let off = lines.map { Self.darkest(h, in: h.lineRect(at: Self.offset(h, $0))) }
        PrivacyMode.shared.setManual(true)
        await h.settle(0.2)
        let on = lines.map { Self.darkest(h, in: h.lineRect(at: Self.offset(h, $0))) }
        print("privacy-editor: darkest pixel per line off \(off), on \(on)")
        for (i, line) in lines.enumerated() {
            #expect(off[i] < 0.35 && on[i] < 0.35, "\(line) drawn sharp: off \(off[i]), on \(on[i])")
            #expect(abs(off[i] - on[i]) < 0.02, "\(line) looks the same with privacy mode on: off \(off[i]), on \(on[i])")
        }
        await h.type(" evening")
        #expect(h.text.contains("Buy the evening ring"))
        #expect(Self.darkest(h, in: h.lineRect(at: Self.offset(h, "Tell nobody"))) < 0.35)
    }

    static func library() throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: "Salary talk\nAsk for the raise on Monday")
        try c.mainContext.save()
        return (c, note)
    }

    /// In the list the title shows as always (sharp, and VoiceOver names it); the preview is gone.
    @Test func theListShowsTitlesAndHidesPreviews() async throws {
        Self.reset()
        defer { Self.reset() }
        let (c, note) = try Self.library()
        let ax = OffscreenAX(NoteRow(note: note).modelContainer(c).frame(width: 320), size: CGSize(width: 320, height: 80))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("note.Salary talk"))
        #expect(row.text.contains("Ask for the raise"), "off: the preview shows: \(row.text)")
        let titleOff = try Self.titleInk(note, c)
        PrivacyMode.shared.setManual(true)
        await ax.settle()
        let hidden = try #require(ax.find("note.Salary talk"))
        #expect(!hidden.text.contains("Ask for the raise"), "on: no preview: \(hidden.text)")
        #expect(hidden.text.contains("Salary talk"), "VoiceOver hears the title")
        let titleOn = try Self.titleInk(note, c)
        print("privacy-list: title's darkest pixel off \(titleOff), on \(titleOn)")
        #expect(titleOn < 0.35 && abs(titleOn - titleOff) < 0.02, "the title is drawn sharp: off \(titleOff), on \(titleOn)")
        // Nothing blurs a title or a note's words any more (the earlier build's modifier is gone).
        for file in ["Pane/Views/NoteListView.swift", "Pane/Views/SidebarView.swift", "Pane/Views/MenuBarPanel.swift", "Pane/Views/NoteDetailView.swift",
                     "Pane/Views/AIChangesView.swift", "Pane/Views/SidebarAILine.swift", "Pane/Views/NoteWindow.swift", "Pane/Editor/MarkdownEditor.swift"] {
            let source = try SettingsHomeTests.source(file)
            #expect(!source.contains("privacyBlur") && !source.contains("veil"), "\(file) blurs note words")
        }
        // The folder's hover card drops its preview too.
        #expect(try SettingsHomeTests.source("Pane/Views/SidebarView.swift").contains("!PrivacyMode.shared.isOn, note.preview != NoteText.noPreview"))
    }

    /// The darkest pixel of the row's title line (its top third), rendered as the list draws it.
    static func titleInk(_ note: Note, _ c: ModelContainer) throws -> CGFloat {
        let r = ImageRenderer(content: NoteRow(note: note).modelContainer(c).frame(width: 320).environment(\.colorScheme, .light))
        r.scale = 2
        let rep = NSBitmapImageRep(cgImage: try #require(r.cgImage))
        return darkest(rep, in: CGRect(x: 0, y: 0, width: rep.pixelsWide, height: rep.pixelsHigh / 2))
    }

    /// The (fake) detector says sharing started: the cover is up, and previews are hidden while it is.
    /// Remember this with Hide previews keeps the choice.
    @Test func theCoverAppearsAndRemembers() async throws {
        Self.reset()
        defer { Self.reset() }
        let fake = FakeShareDetector()
        PrivacyMode.shared.watch(fake)
        let (c, note) = try Self.library()
        let ax = OffscreenAX(NoteRow(note: note).modelContainer(c).frame(width: 600, height: 400).privacyCover(), size: CGSize(width: 600, height: 400))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("privacy.cover") == nil)
        fake.say(true)
        await ax.settle(800)
        #expect(ax.find("privacy.cover") != nil, "the cover is up: \(ax.ids())")
        #expect(PrivacyMode.shared.isOn, "previews are hidden while it asks")
        let words = ax.ids()
        #expect(words.contains("privacy.hide") && words.contains("privacy.show") && words.contains("privacy.remember"))
        try #require(ax.find("privacy.remember")).press()
        await ax.settle()
        // The box redraws the card; its buttons come back in the tree a moment later on a busy run.
        for _ in 0..<20 where ax.find("privacy.hide") == nil { await ax.settle() }
        try #require(ax.find("privacy.hide"), "Hide previews after Remember this: \(ax.ids())").press()
        await ax.settle(800)
        #expect(ax.find("privacy.cover") == nil, "gone after Hide previews")
        #expect(PrivacyMode.shared.isOn && PrivacyMode.shared.source == .automatic)
        #expect(PrivacyMode.shared.whenShared == .hide, "Remember this kept Hide previews")
        fake.say(false)
        #expect(!PrivacyMode.shared.isOn, "sharing stopped: off again")
    }

    /// View › Privacy Mode, ⌃⌘P: nothing else in the menus has that key, and it toggles.
    @Test func theShortcutTogglesAndClashesWithNothing() throws {
        Self.reset()
        defer { Self.reset() }
        guard let main = NSApp.mainMenu, let view = main.items.first(where: { $0.title == "View" })?.submenu else {
            Issue.record("the test host has no View menu to check"); return
        }
        let item = try #require(view.items.first { $0.title == PrivacyWords.menuTitle }, "View › Privacy Mode: \(view.items.map(\.title))")
        #expect(item.keyEquivalent == "p")
        #expect(item.keyEquivalentModifierMask.intersection(.deviceIndependentFlagsMask) == [.control, .command])
        func all(_ menu: NSMenu) -> [NSMenuItem] { menu.items.flatMap { [$0] + ($0.submenu.map(all) ?? []) } }
        let same = all(main).filter { $0 !== item && $0.keyEquivalent.lowercased() == "p" && $0.keyEquivalentModifierMask.intersection(.deviceIndependentFlagsMask) == [.control, .command] }
        #expect(same.isEmpty, "⌃⌘P is taken by \(same.map(\.title))")
        view.performActionForItem(at: view.index(of: item))
        #expect(PrivacyMode.shared.isOn && PrivacyMode.shared.isManual)
        view.performActionForItem(at: view.index(of: item))
        #expect(!PrivacyMode.shared.isOn)
    }

    /// Settings › Privacy has privacy mode and what happens when your screen is shared.
    @Test func settingsPrivacyHasIt() throws {
        #expect(try SettingsHomeTests.source("Pane/Views/PrivacySecurity.swift").contains("PrivacyModeSection()"))
        #expect(PrivacyMode.WhenShared.allCases.map(\.title) == ["Ask", "Hide previews", "Show previews"])
    }
}
#endif
