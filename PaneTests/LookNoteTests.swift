#if os(macOS)
import AppKit
import SwiftData
import Testing
@testable import Pane

/// The Pinto look note (LookNote): its lines are read as settings, its colours win over the
/// theme's key by key, its faces reach the note's text and headings, and its pictures and font
/// files are found in the note and in the folder with its name. Looks and faces are set with
/// task-local overrides, so the app's own look and other suites never see them.
@MainActor @Suite struct LookNoteTests {
    @Test func readsEverySettingAndPassesOverProse() {
        let spec = LookSpec.parse("""
        Pinto look

        A colour is #RRGGBB, or two for light and dark mode, like #FFFFFF / #1C1C1E.

        ## Colours
        page: #FBF8F1 / #1A1815
        - accent: #f0a
        text: #222222
        lines:
        secondary text: blue
        font: "New York"
        heading font: Grotesk.otf
        text size: 17pt
        background: ![Dunes.jpg](pane-file:2E7C3C4B-2C1D-4C59-9E1A-6A0C8B3C1F00)
        background fade: 65%
        background blur: 12
        icon: Leaf.png
        """)
        #expect(spec.colors["page"] == Theme.Hex(0xFBF8F1, 0x1A1815))
        #expect(spec.colors["accent"] == Theme.Hex(0xFF00AA, 0xFF00AA))
        #expect(spec.colors["ink"] == Theme.Hex(0x222222, 0x222222))
        // Empty keeps the theme's; what can't be read is kept to say so.
        #expect(spec.colors["line"] == nil && spec.colors["muted"] == nil)
        #expect(spec.unread == ["secondary text: blue"])
        #expect(spec.font == "New York" && spec.headingFont == "Grotesk.otf")
        #expect(spec.textSize == 17)
        #expect(spec.background == "2E7C3C4B-2C1D-4C59-9E1A-6A0C8B3C1F00")
        #expect(spec.fade == 0.65 && spec.blur == 12 && spec.icon == "Leaf.png")
    }

    /// A new note sets nothing: every line is empty until someone fills it in.
    @Test func theTemplateSetsNothing() {
        let spec = LookSpec.parse(LookSpec.template)
        #expect(spec.isEmpty && spec.unread.isEmpty)
        #expect(LookSpec.template.hasPrefix(LookSpec.title + "\n"))
        for (word, _) in LookSpec.colorKeys { #expect(LookSpec.template.contains("\n\(word):\n")) }
    }

    /// Out-of-range numbers are held to what draws well.
    @Test func numbersAreHeldInRange() {
        let spec = LookSpec.parse("text size: 400\nbackground fade: 140\nbackground blur: -3\nbackground: none")
        #expect(spec.textSize == 48 && spec.fade == 1 && spec.blur == 0 && spec.background == nil)
    }

    /// The note's colours win over the theme's, one by one; the rest stay the theme's.
    @Test func colorsWinOverTheThemeKeyByKey() {
        let custom = LookColors(values: ["page": Theme.Hex(0x123456, 0x0A0B0C), "accent": Theme.Hex(0xAA0000, 0xFF8888)])
        let sepia = ThemeLook(theme: .sepia, accent: .theme)
        var mine = sepia
        mine.custom = custom
        ThemeTests.within(mine) {
            #expect(ThemeTests.hex(Palette.page, .aqua) == 0x123456)
            #expect(ThemeTests.hex(Palette.page, .darkAqua) == 0x0A0B0C)
            #expect(ThemeTests.hex(Palette.listGround, .aqua) == Theme.sepia.colors!.list.light)
            #expect(mine.accentShades.light == 0xAA0000)
        }
        // On Default too, whose colours are the build's own.
        var plain = ThemeLook.standard
        plain.custom = custom
        #expect(!plain.isStock && !plain.paintsSidebar && !ThemeLook.standard.paintsSidebar)
        // A sidebar colour replaces the glass.
        plain.custom?.values["sidebar"] = Theme.Hex(0xEEEEEE, 0x111111)
        #expect(plain.paintsSidebar)
        ThemeTests.within(plain) { #expect(ThemeTests.hex(Palette.page, .aqua) == 0x123456) }
    }

    /// The look's face draws the note's text, and its heading face the title and headings.
    @Test func facesReachTextAndHeadings() throws {
        let georgia = try #require(LookFace.named("georgia"))
        let mono = try #require(LookFace.named("Mono"))
        #expect(LookFace.named("No Such Face 123") == nil)
        #expect(LookFace.named("New York") == LookFace(kind: .design(.serif)))
        LookFaces.$override.withValue((body: georgia, heading: mono)) {
            let styler = MarkdownStyler()
            #expect(styler.bodyFont.familyName == "Georgia")
            let title = MarkdownStyler.titleFont
            #expect(title.fontDescriptor.symbolicTraits.contains(.monoSpace))
            #expect(styler.headingFont(2).familyName != "Georgia")
        }
        // A heading face alone: the text stays the system's.
        LookFaces.$override.withValue((body: nil, heading: georgia)) {
            #expect(MarkdownStyler.titleFont.familyName == "Georgia")
            #expect(MarkdownStyler().bodyFont.familyName != "Georgia")
        }
    }

    /// Pictures and fonts are the note's own files and the ones in the folder with its name
    /// beside it (where an AI's "Notes/Pinto look/Dunes.jpg" lands); by name or by id.
    @Test func findsTheNotesFiles() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = Folder(name: "Notes")
        let kept = Folder(name: "Pinto look"); kept.parent = notes
        let elsewhere = Folder(name: "Pinto look")
        ctx.insert(notes); ctx.insert(kept); ctx.insert(elsewhere)
        let shown = Pane.Attachment(filename: "Leaf.png", contentType: "public.png", size: 1)
        let dunes = Pane.Attachment(filename: "Dunes.jpg", contentType: "public.jpeg", size: 1); dunes.folderID = kept.id
        let other = Pane.Attachment(filename: "Other.jpg", contentType: "public.jpeg", size: 1); other.folderID = elsewhere.id
        [shown, dunes, other].forEach(ctx.insert)
        let note = ctx.createNote(in: .folder(notes.id), body: "Pinto look\n\nicon: Leaf.png\n\n\(shown.markdown)\n")
        try ctx.save()

        #expect(LookStore.note(in: ctx) === note)
        let files = LookStore.files(of: note, in: ctx)
        #expect(Set(files.map(\.filename)) == ["Leaf.png", "Dunes.jpg"])
        #expect(LookStore.file("dunes.JPG", in: files) === dunes)
        #expect(LookStore.file("Dunes", in: files) === dunes)
        #expect(LookStore.file(shown.id.uuidString, in: files) === shown)
        #expect(LookStore.file("Other.jpg", in: files) == nil)

        // A trashed one is no look at all.
        note.trashedAt = .now
        try ctx.save()
        #expect(LookStore.note(in: ctx) == nil)
    }
}
#endif
