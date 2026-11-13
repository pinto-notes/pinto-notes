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

    /// In the list the title shows as always; the preview stays in its place, the row the same
    /// size, but blurred too much to read (Emil: "visibly blurred, not hidden"). VoiceOver reads
    /// it, as it does the email blur.
    @Test func theListBlursPreviewsInPlaceAndKeepsTitlesSharp() async throws {
        Self.reset()
        defer { Self.reset() }
        let (c, note) = try Self.library()
        let ax = OffscreenAX(NoteRow(note: note).modelContainer(c).frame(width: 320), size: CGSize(width: 320, height: 80))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("note.Salary talk"))
        #expect(row.text.contains("Ask for the raise"), "off: the preview shows: \(row.text)")
        let off = try Self.rowInk(note, c)
        PrivacyMode.shared.setManual(true)
        await ax.settle()
        let blurred = try #require(ax.find("note.Salary talk"))
        #expect(blurred.text.contains("Salary talk") && blurred.text.contains("Ask for the raise"), "VoiceOver reads the row: \(blurred.text)")
        let on = try Self.rowInk(note, c)
        print("privacy-list: size off \(off.size) on \(on.size); title ink off \(off.title) on \(on.title); preview ink off \(off.preview) on \(on.preview); total ink off \(off.previewInk) on \(on.previewInk)")
        #expect(on.size == off.size, "the row keeps its size: \(off.size) then \(on.size)")
        #expect(on.title < 0.35 && abs(on.title - off.title) < 0.02, "the title is drawn sharp: off \(off.title), on \(on.title)")
        #expect(off.preview < 0.6, "off: the preview has ink: \(off.preview)")
        // A blur spreads the ink out but keeps it: the line is still there, drawn.
        #expect(on.previewInk > off.previewInk * 0.5, "on: the preview is still drawn: ink \(off.previewInk) then \(on.previewInk)")
        #expect(on.preview > off.preview + 0.2, "on: blurred, its darkest pixel far lighter than the text's: \(off.preview) then \(on.preview)")
        // Nothing blurs a title or the open note (the earlier builds' blurs are gone).
        for file in ["Pane/Views/NoteDetailView.swift", "Pane/Views/AIChangesView.swift", "Pane/Views/SidebarAILine.swift",
                     "Pane/Views/NoteWindow.swift", "Pane/Editor/MarkdownEditor.swift", "Pane/Views/VersionHistoryView.swift"] {
            let source = try SettingsHomeTests.source(file)
            #expect(!source.contains("previewBlur") && !source.contains("privacyBlur") && !source.contains("veil"), "\(file) blurs note words")
        }
        // The folder's hover card and the menu bar blur their previews too.
        #expect(try SettingsHomeTests.source("Pane/Views/SidebarView.swift").contains(".lineLimit(6)\n                    .previewBlur("))
        #expect(try SettingsHomeTests.source("Pane/Views/MenuBarPanel.swift").contains(".lineLimit(1)\n                .previewBlur()"))
    }

    /// The row as the list draws it: its size, and the darkest pixel of the title (the top half)
    /// and of the preview (the bottom half, past the date).
    static func rowInk(_ note: Note, _ c: ModelContainer) throws -> (size: CGSize, title: CGFloat, preview: CGFloat, previewInk: CGFloat) {
        let r = ImageRenderer(content: NoteRow(note: note).modelContainer(c).frame(width: 320).environment(\.colorScheme, .light))
        r.scale = 2
        let rep = NSBitmapImageRep(cgImage: try #require(r.cgImage))
        let w = rep.pixelsWide, h = rep.pixelsHigh
        return (CGSize(width: w, height: h), darkest(rep, in: CGRect(x: 0, y: 0, width: w, height: h / 2)),
                // The date and its dot end before 40% of the width at 320 pt; the preview runs after.
                darkest(rep, in: CGRect(x: w * 2 / 5, y: h / 2, width: w - w * 2 / 5, height: h / 2)),
                ink(rep, in: CGRect(x: w * 2 / 5, y: h / 2, width: w - w * 2 / 5, height: h / 2)))
    }

    /// The ink in `rect` (pixels, from the top): the sum of each pixel's darkness over white.
    static func ink(_ rep: NSBitmapImageRep, in rect: CGRect) -> CGFloat {
        var sum: CGFloat = 0
        for y in Int(rect.minY)..<min(Int(rect.maxY), rep.pixelsHigh) {
            for x in Int(rect.minX)..<min(Int(rect.maxX), rep.pixelsWide) {
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB) else { continue }
                let lum = 0.299 * c.redComponent + 0.587 * c.greenComponent + 0.114 * c.blueComponent
                // NSColor's components here are straight (not premultiplied) alpha.
                sum += max(0, c.alphaComponent * (1 - lum))
            }
        }
        return sum
    }

    /// The (fake) detector says sharing started: the cover is up, and previews are blurred while it is.
    /// Remember this with Blur previews keeps the choice.
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
        for _ in 0..<20 where ax.find("privacy.hide") == nil { await ax.settle() }
        #expect(ax.find("privacy.cover") != nil, "the cover is up: \(ax.ids())")
        #expect(PrivacyMode.shared.isOn, "previews are blurred while it asks")
        let words = ax.ids()
        #expect(words.contains("privacy.hide") && words.contains("privacy.show") && words.contains("privacy.remember"))
        try #require(ax.find("privacy.remember")).press()
        await ax.settle()
        // The box redraws the card; its buttons come back in the tree a moment later on a busy run.
        for _ in 0..<20 where ax.find("privacy.hide") == nil { await ax.settle() }
        try #require(ax.find("privacy.hide"), "Blur previews after Remember this: \(ax.ids())").press()
        await ax.settle(800)
        #expect(ax.find("privacy.cover") == nil, "gone after Blur previews")
        #expect(PrivacyMode.shared.isOn && PrivacyMode.shared.source == .automatic)
        #expect(PrivacyMode.shared.whenShared == .hide, "Remember this kept Blur previews")
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
        #expect(PrivacyMode.WhenShared.allCases.map(\.title) == ["Ask", "Blur previews", "Show previews"])
    }
}
#endif
