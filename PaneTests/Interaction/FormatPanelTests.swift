#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// The iPhone Format panel's controls, driven through the real editor in an offscreen window:
/// each one applies its format to the caret's line or the selection and then shows as on, the
/// panel follows the caret, and closing it gives the keyboard back to the text. The panel's
/// buttons call exactly `EditorController.apply(_:)` and read `controller.format`.
@MainActor @Suite(.serialized) struct FormatPanelTests {
    struct Case: CustomTestStringConvertible, Sendable {
        let control: FormatControl
        let before: String
        let caretAfter: String
        let after: String
        /// A second tap gives back `before` (toggles); nil when the style just stays (Title, Body…).
        let toggles: Bool
        var testDescription: String { control.name }
    }

    nonisolated static let cases: [Case] = [
        Case(control: .title, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n# Plan", toggles: false),
        Case(control: .heading, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n## Plan", toggles: false),
        Case(control: .subheading, before: "Trip\n* Plan", caretAfter: "Plan", after: "Trip\n### Plan", toggles: false),
        Case(control: .body, before: "Trip\n## Plan", caretAfter: "Plan", after: "Trip\nPlan", toggles: false),
        Case(control: .monostyled, before: "Trip\nlet x = 1\nend", caretAfter: "x = 1", after: "Trip\n```\nlet x = 1\n```\nend", toggles: true),
        Case(control: .bold, before: "Trip\nBook pastries", caretAfter: "pastries", after: "Trip\nBook **pastries**", toggles: true),
        Case(control: .italic, before: "Trip\nBook pastries", caretAfter: "pastries", after: "Trip\nBook *pastries*", toggles: true),
        Case(control: .underline, before: "Trip\nBook pastries", caretAfter: "pastries", after: "Trip\nBook <u>pastries</u>", toggles: true),
        Case(control: .strikethrough, before: "Trip\nBook pastries", caretAfter: "pastries", after: "Trip\nBook ~~pastries~~", toggles: true),
        Case(control: .bulleted, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n* Plan", toggles: true),
        Case(control: .dashed, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n- Plan", toggles: true),
        Case(control: .numbered, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n1. Plan", toggles: true),
        Case(control: .quote, before: "Trip\nPlan", caretAfter: "Plan", after: "Trip\n> Plan", toggles: true),
    ]

    @Test(arguments: cases)
    func everyControlAppliesAndShowsOn(_ c: Case) async {
        let h = await EditorHarness(c.before)
        defer { h.close() }
        await h.caret(after: c.caretAfter)
        h.controller.showFormatPanel()
        #expect(!h.controller.format.isOn(c.control), "\(c.control.name) is off before")
        h.controller.apply(c.control)
        await h.settle()
        #expect(h.text == c.after)
        #expect(h.controller.format.isOn(c.control), "\(c.control.name) shows as on")
        h.controller.apply(c.control)
        await h.settle()
        if c.toggles {
            #expect(h.text == c.before, "a second tap takes \(c.control.name) off")
            #expect(!h.controller.format.isOn(c.control))
        } else {
            #expect(h.text == c.after, "choosing the line's own style keeps it")
            #expect(h.controller.format.isOn(c.control))
        }
    }

    @Test func indentAndOutdentNestListItems() async {
        let h = await EditorHarness("Trip\n* Places\n* Belém\nNot a list")
        defer { h.close() }
        await h.caret(after: "Belém")
        h.controller.showFormatPanel()
        #expect(h.controller.format.isEnabled(.indent) && !h.controller.format.isEnabled(.outdent))
        h.controller.apply(.indent)
        await h.settle()
        #expect(h.text == "Trip\n* Places\n  * Belém\nNot a list")
        #expect(h.controller.format.isEnabled(.outdent), "a nested item can come back out")
        h.controller.apply(.outdent)
        await h.settle()
        #expect(h.text == "Trip\n* Places\n* Belém\nNot a list")
        // Plain text can't nest in markdown: the indents are off there.
        await h.caret(after: "Not a list")
        #expect(!h.controller.format.isEnabled(.indent) && !h.controller.format.isEnabled(.outdent))
        h.controller.apply(.indent)
        #expect(h.text == "Trip\n* Places\n* Belém\nNot a list")
        // Several items at once.
        let all = (h.text as NSString).range(of: "* Places\n* Belém")
        await h.select(all.location, all.length)
        h.controller.apply(.indent)
        await h.settle()
        #expect(h.text == "Trip\n  * Places\n  * Belém\nNot a list")
    }

    /// The panel follows the caret, as Notes' does: the line's style, its list, and the inline
    /// formats around the caret.
    @Test func theActiveStateFollowsTheCaret() async {
        let text = "Trip\n## Plan\nBook **pastries** and ~~trams~~ <u>early</u> *slowly*\n* first\n  1. nested **bold**\n> said\n```\ncode\n```\nend"
        let h = await EditorHarness(text)
        defer { h.close() }
        h.controller.showFormatPanel()
        func on() -> Set<FormatControl> { Set(FormatControl.allCases.filter { h.controller.format.isOn($0) }) }

        await h.caret(after: "Tr")
        #expect(on() == [.title])
        await h.caret(after: "Pl")
        #expect(on() == [.heading])
        await h.caret(after: "Bo")
        #expect(on() == [.body])
        await h.caret(after: "**past")
        #expect(on() == [.body, .bold])
        await h.caret(after: "~~tr")
        #expect(on() == [.body, .strikethrough])
        await h.caret(after: "<u>ear")
        #expect(on() == [.body, .underline])
        await h.caret(after: "*slow")
        #expect(on() == [.body, .italic])
        await h.caret(after: "fir")
        #expect(on() == [.body, .bulleted])
        await h.caret(after: "nested **bo")
        #expect(on() == [.body, .numbered, .bold], "a nested item four spaces in still reads its bold")
        await h.caret(after: "sai")
        #expect(on() == [.body, .quote])
        await h.caret(after: "cod")
        #expect(on() == [.monostyled])
        #expect(!h.controller.format.isEnabled(.bold), "markdown in code is shown as written")
        await h.caret(after: "en")
        #expect(on() == [.body])

        // A selection inside bold text is bold; one that runs past it isn't.
        let inside = (h.text as NSString).range(of: "pastries")
        await h.select(inside.location, inside.length)
        #expect(h.controller.format.isOn(.bold))
        await h.select(inside.location, inside.length + 6)
        #expect(!h.controller.format.isOn(.bold))
    }

    /// Bold on a selection keeps the selection on the same letters, so the panel shows it on and a
    /// second tap takes it off again.
    @Test func aSelectionStaysSelected() async {
        let h = await EditorHarness("Trip\nBook pastries early")
        defer { h.close() }
        h.controller.showFormatPanel()
        let r = (h.text as NSString).range(of: "pastries early")
        await h.select(r.location, r.length)
        h.controller.apply(.bold)
        await h.settle()
        #expect(h.text == "Trip\nBook **pastries early**")
        #expect((h.text as NSString).substring(with: h.selection) == "pastries early")
        #expect(h.controller.format.isOn(.bold))
        h.controller.apply(.italic)
        await h.settle()
        #expect(h.text == "Trip\nBook ***pastries early***")
        #expect(h.controller.format.isOn(.bold) && h.controller.format.isOn(.italic))
        h.controller.apply(.bold)
        await h.settle()
        #expect(h.text == "Trip\nBook *pastries early*")
        #expect((h.text as NSString).substring(with: h.selection) == "pastries early")
        #expect(!h.controller.format.isOn(.bold) && h.controller.format.isOn(.italic))
    }

    /// B with no word under the caret: the marks go in and the panel shows bold on.
    @Test func boldWithNothingUnderTheCaret() async {
        let h = await EditorHarness("Trip\nBook ")
        defer { h.close() }
        await h.select((h.text as NSString).length)
        h.controller.showFormatPanel()
        h.controller.apply(.bold)
        await h.settle()
        #expect(h.text == "Trip\nBook ****")
        #expect(h.selection == NSRange(location: (h.text as NSString).length - 2, length: 0))
        #expect(h.controller.format.isOn(.bold))
        h.controller.apply(.bold)
        await h.settle()
        #expect(h.text == "Trip\nBook ")
    }

    /// Several lines at once, like Notes: lists, then a heading that takes their markers off.
    @Test func selectedLinesTakeTheStyleTogether() async {
        let h = await EditorHarness("Trip\nTrams\nTiles\nend")
        defer { h.close() }
        h.controller.showFormatPanel()
        let r = (h.text as NSString).range(of: "Trams\nTiles")
        await h.select(r.location, r.length)
        h.controller.apply(.numbered)
        await h.settle()
        #expect(h.text == "Trip\n1. Trams\n2. Tiles\nend")
        #expect(h.controller.format.isOn(.numbered))
        h.controller.apply(.heading)
        await h.settle()
        #expect(h.text == "Trip\n## Trams\n## Tiles\nend")
        h.controller.apply(.dashed)
        await h.settle()
        #expect(h.text == "Trip\n- Trams\n- Tiles\nend", "a heading turned into a list loses its marks")
    }

    /// The first line is the note's title: a code fence above it would take its place.
    @Test func theTitleLineCantBeMonostyled() async {
        let h = await EditorHarness("Trip\nPlan")
        defer { h.close() }
        await h.caret(after: "Tri")
        h.controller.showFormatPanel()
        #expect(!h.controller.format.isEnabled(.monostyled))
        h.controller.apply(.monostyled)
        #expect(h.text == "Trip\nPlan")
    }

    /// The close button: the panel goes and the text has the keyboard again.
    @Test func closeRestoresTheKeyboard() async {
        let h = await EditorHarness("Trip\nPlan")
        defer { h.close() }
        await h.caret(after: "Plan")
        h.controller.showFormatPanel()
        #expect(h.controller.formatPanelShown)
        // Something else took the keyboard while the panel was up.
        h.window.makeFirstResponder(nil)
        #expect(h.window.firstResponder !== h.view)
        h.controller.closeFormatPanel()
        await h.settle()
        #expect(!h.controller.formatPanelShown)
        #expect(h.window.firstResponder === h.view, "the keyboard is back in the text")
        #expect(h.selection == NSRange(location: 9, length: 0), "on the same caret")
        // Closed, it no longer follows the caret (no work while typing).
        let before = h.controller.format
        await h.caret(after: "Tr")
        #expect(h.controller.format == before)
    }

    /// What's on reads at a glance, in light and dark, with and without Increase Contrast: a
    /// selected segment stands 3:1 off an unselected one (the pill), its white glyph 3:1 on the
    /// amber, and an unselected glyph 4.5:1 on the pill. (The soft amber tint failed this.)
    @Test(arguments: [(false, false), (false, true), (true, false), (true, true)])
    func selectedSegmentsStandOut(_ args: (Bool, Bool)) {
        let look = (dark: args.0, highContrast: args.1)
        let F = Palette.Format.self
        func c(_ hex: UInt32) -> NSColor { Palette.rgb(hex) }
        let pill = c(F.pill(dark: look.dark, highContrast: look.highContrast))
        let on = c(F.on(dark: look.dark, highContrast: look.highContrast))
        let glyph = c(F.glyph(dark: look.dark, highContrast: look.highContrast))
        let selected = AmberButtonTests.contrast(on, pill)
        #expect(selected >= 3, "selected against unselected: \(selected)")
        #expect(AmberButtonTests.contrast(c(F.onGlyph), on) >= 3, "the white glyph on amber")
        #expect(AmberButtonTests.contrast(glyph, pill) >= 4.5, "an unselected glyph on its pill")
        if look.highContrast {
            #expect(selected >= AmberButtonTests.contrast(c(F.on(dark: look.dark, highContrast: false)), c(F.pill(dark: look.dark, highContrast: false))),
                    "Increase Contrast never lowers it")
        }
    }

    /// Recently Deleted: nothing to format.
    @Test func aReadOnlyNoteHasNoPanel() async {
        let h = await EditorHarness("Trip\nPlan")
        defer { h.close() }
        h.controller.readOnly = true
        h.controller.showFormatPanel()
        #expect(!h.controller.formatPanelShown)
    }
}
#endif
