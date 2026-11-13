#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Privacy mode in the real editor, list, cover and menu, offscreen (Emil, 13 November 2026).
@MainActor @Suite(.serialized) struct PrivacyModeInteractionTests {
    /// Every test leaves the app's own privacy mode off, asking, and watching nothing.
    static func reset() { PrivacyModeInteractionReset.reset() }

    static let note = "Secret plan\nBuy the ring on Friday\nTell nobody at work\n"

    static func fragment(_ h: EditorHarness, at offset: Int) -> DecoratedLayoutFragment? {
        guard let tlm = h.view.textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: offset) else { return nil }
        tlm.ensureLayout(for: tcm.documentRange)
        return tlm.textLayoutFragment(for: loc) as? DecoratedLayoutFragment
    }

    static func offset(_ h: EditorHarness, _ s: String) -> Int { (h.text as NSString).range(of: s).location }

    /// The darkest pixel's brightness (0 black, 1 white) inside `rect` of the text view, as drawn.
    static func darkest(_ h: EditorHarness, in rect: CGRect) -> CGFloat {
        let view = h.view
        let bounds = view.visibleRect
        guard let rep = view.bitmapImageRepForCachingDisplay(in: bounds) else { return 1 }
        view.cacheDisplay(in: bounds, to: rep)
        let sx = CGFloat(rep.pixelsWide) / bounds.width, sy = CGFloat(rep.pixelsHigh) / bounds.height
        var low: CGFloat = 1
        let r = rect.intersection(bounds)
        var y = r.minY
        while y < r.maxY {
            var x = r.minX
            while x < min(r.maxX, r.minX + 400) {
                let py = view.isFlipped ? (y - bounds.minY) * sy : (bounds.maxY - y) * sy
                if let c = rep.colorAt(x: Int((x - bounds.minX) * sx), y: Int(py))?.usingColorSpace(.sRGB) {
                    // Over the white page: the text view draws no background of its own.
                    let lum = 0.299 * c.redComponent + 0.587 * c.greenComponent + 0.114 * c.blueComponent
                    low = min(low, 1 - c.alphaComponent * (1 - lum / max(c.alphaComponent, 0.001)))
                }
                x += 0.5
            }
            y += 0.5
        }
        return low
    }

    /// Every line blurred but the caret's; the pointer shows the one it's over; VoiceOver reads all.
    @Test func theEditorBlursEveryLineButTheCaretsAndThePointers() async throws {
        Self.reset()
        defer { Self.reset() }
        let h = await EditorHarness(Self.note)
        defer { h.close() }
        let title = 0, ring = Self.offset(h, "Buy the")
        var nobody = Self.offset(h, "Tell nobody")
        await h.caret(after: "Buy the")
        #expect(Self.fragment(h, at: ring)?.veiled == false, "off: nothing blurred")
        let sharpBefore = Self.darkest(h, in: h.lineRect(at: nobody))

        PrivacyMode.shared.setManual(true)
        await h.settle(0.1)
        #expect(Self.fragment(h, at: ring)?.veiled == false, "the caret's line stays clear, so you can write")
        #expect(Self.fragment(h, at: title)?.veiled == true)
        #expect(Self.fragment(h, at: nobody)?.veiled == true)
        // Drawn blurred: the line's darkest pixel is far lighter than the text's ink.
        let blurred = Self.darkest(h, in: h.lineRect(at: nobody))
        let caretLine = Self.darkest(h, in: h.lineRect(at: ring))
        #expect(sharpBefore < 0.35, "sharp text has dark ink: \(sharpBefore)")
        #expect(caretLine < 0.35, "the caret's line drawn sharp: \(caretLine)")
        print("privacy-blur: darkest pixel sharp \(sharpBefore), caret line \(caretLine), blurred \(blurred)")
        #expect(blurred > sharpBefore + 0.25, "blurred: \(blurred) against \(sharpBefore)")

        // Typing still lands on the clear line.
        await h.type(" evening")
        #expect(h.text.contains("Buy the evening ring"))
        #expect(Self.fragment(h, at: ring)?.veiled == false)
        nobody = Self.offset(h, "Tell nobody")
        #expect(Self.fragment(h, at: nobody)?.veiled == true)

        // The pointer over the last line shows it, while it's there.
        let rect = h.lineRect(at: nobody)
        let inWindow = h.view.convert(CGPoint(x: rect.minX + 30, y: rect.midY), to: nil)
        let moved = try #require(NSEvent.mouseEvent(with: .mouseMoved, location: inWindow, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                    windowNumber: h.window.windowNumber, context: nil, eventNumber: 0, clickCount: 0, pressure: 0))
        h.view.mouseMoved(with: moved)
        await h.settle()
        #expect(Self.fragment(h, at: nobody)?.veiled == false, "under the pointer it reads")
        #expect(Self.fragment(h, at: title)?.veiled == true)
        let exited = try #require(NSEvent.enterExitEvent(with: .mouseExited, location: inWindow, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                         windowNumber: h.window.windowNumber, context: nil, eventNumber: 0, trackingNumber: 0, userData: nil))
        h.view.mouseExited(with: exited)
        await h.settle()
        #expect(Self.fragment(h, at: nobody)?.veiled == true, "the pointer gone, it blurs again")

        // The caret moves: its new line clears, the old one blurs.
        await h.caret(after: "Secret")
        #expect(Self.fragment(h, at: title)?.veiled == false)
        #expect(Self.fragment(h, at: ring)?.veiled == true)

        // VoiceOver reads the whole note: the text itself is untouched.
        let spoken = h.view.accessibilityValue() as? String ?? h.view.string
        #expect(spoken.contains("Tell nobody at work") && spoken.contains("Secret plan"))

        PrivacyMode.shared.setManual(false)
        await h.settle(0.1)
        #expect(Self.fragment(h, at: nobody)?.veiled == false, "off: every line clear")
    }

    static func library() throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = c.mainContext.createNote(in: .all, body: "Salary talk\nAsk for the raise on Monday")
        try c.mainContext.save()
        return (c, note)
    }

    /// In the list a note's title is blurred (VoiceOver still names it) and its preview is gone.
    @Test func theListBlursTitlesAndDropsPreviews() async throws {
        Self.reset()
        defer { Self.reset() }
        let (c, note) = try Self.library()
        let ax = OffscreenAX(NoteRow(note: note).modelContainer(c).frame(width: 320), size: CGSize(width: 320, height: 80))
        defer { ax.close() }
        await ax.settle()
        let row = try #require(ax.find("note.Salary talk"))
        #expect(row.text.contains("Ask for the raise"), "off: the preview shows: \(row.text)")
        PrivacyMode.shared.setManual(true)
        await ax.settle()
        let hidden = try #require(ax.find("note.Salary talk"))
        #expect(!hidden.text.contains("Ask for the raise"), "on: no preview: \(hidden.text)")
        #expect(hidden.text.contains("Salary talk"), "VoiceOver still hears the title")
        #expect(try SettingsHomeTests.source("Pane/Views/NoteListView.swift").contains(".lineLimit(large ? 3 : 1)\n                        .privacyBlur()"), "the row's title is blurred")
        // The folder's hover card, AI Changes and the sidebar's AI line blur titles too.
        for (file, call) in [("Pane/Views/SidebarView.swift", ".lineLimit(2).privacyBlur()"), ("Pane/Views/AIChangesView.swift", ".privacyBlur()"),
                             ("Pane/Views/SidebarAILine.swift", ".privacyBlur()"), ("Pane/Views/MenuBarPanel.swift", ".privacyBlur()"),
                             ("Pane/Views/AIChangesView.swift", "veiled: PrivacyMode.shared.isOn")] {
            #expect(try SettingsHomeTests.source(file).contains(call), "\(file) shows note words unblurred")
        }
    }

    /// The (fake) detector says sharing started: the cover is up, and the notes are hidden while it is.
    /// Remember this with Hide notes keeps the choice.
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
        #expect(PrivacyMode.shared.isOn, "the notes are hidden while it asks")
        let words = ax.ids()
        #expect(words.contains("privacy.hide") && words.contains("privacy.show") && words.contains("privacy.remember"))
        try #require(ax.find("privacy.remember")).press()
        await ax.settle()
        try #require(ax.find("privacy.hide")).press()
        await ax.settle(800)
        #expect(ax.find("privacy.cover") == nil, "gone after Hide notes")
        #expect(PrivacyMode.shared.isOn && PrivacyMode.shared.source == .automatic)
        #expect(PrivacyMode.shared.whenShared == .hide, "Remember this kept Hide notes")
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
        #expect(PrivacyMode.WhenShared.allCases.map(\.title) == ["Ask", "Hide notes", "Show notes"])
    }
}
#endif
