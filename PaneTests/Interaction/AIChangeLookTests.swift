#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// How an AI's edit of a whole note looks (Emil, 12 November 2026: "make it look nicer"). A
/// heading or an italic line was measured in the hidden markdown marker's tiny font, so its
/// highlight came out as a thin underline with a dot for a tick. Lines of one paragraph join into
/// one shape, and the ticks of changed paragraphs next to each other run as one line.
@MainActor @Suite(.serialized) struct AIChangeLookTests {
    nonisolated static let before = """
    # About me

    *Last refreshed: 1 October 2026.*

    ## Who I am
    - Swedish, based in Jönköping.
    - I started programming at 11.
    """

    nonisolated static let after = """
    # About me

    *Last refreshed: 12 November 2026. This is enduring context, not a daily status report.*

    ## Who I am
    - Swedish, based in Jönköping, with plans to move to Stockholm. I generally prefer speaking and reading English, although Swedish is my native language.
    - I started programming at 11 and became interested in AI around 14. I studied AI Engineering at Jönköping University.
    - I care deeply about ambitious work, scientific and technical understanding, autonomy, creativity, and building things that matter.

    ## Work and projects
    - I also build **Pinto Notes**, a notes app with AI integration.
    """

    func fragment(_ h: EditorHarness, at needle: String) throws -> DecoratedLayoutFragment {
        let layout = try #require(h.view.textLayoutManager)
        let content = try #require(layout.textContentManager)
        let offset = (h.text as NSString).range(of: needle).location
        let loc = try #require(content.location(content.documentRange.location, offsetBy: offset))
        layout.ensureLayout(for: content.documentRange)
        return try #require(layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment)
    }

    /// A heading's and an italic line's highlight is as tall as their letters, not a sliver.
    @Test func headingsAndItalicLinesGetAFullHighlight() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        for needle in ["About me", "Who I am", "Last refreshed"] {
            let runs = try fragment(h, at: needle).changeRuns(at: .zero)
            let run = try #require(runs.first, "\(needle)")
            #expect(run.height > 16, "\(needle): \(runs)")
        }
        let title = try fragment(h, at: "About me").changeRuns(at: .zero)
        let body = try fragment(h, at: "Swedish").changeRuns(at: .zero)
        #expect(title[0].height > body[0].height, "the title's highlight is taller than a body line's: \(title) \(body)")
    }

    /// The lines of one wrapped paragraph meet: no stripe of page between them.
    @Test func wrappedLinesJoinIntoOneShape() async throws {
        let h = await EditorHarness(Self.after, width: 420, focus: false)
        defer { h.close() }
        let shape = try fragment(h, at: "Swedish").changeShape(at: .zero)
        let runs = try fragment(h, at: "Swedish").changeRuns(at: .zero)
        #expect(runs.count >= 2)
        for (a, b) in zip(runs, runs.dropFirst()) {
            let seam = CGPoint(x: (max(a.minX, b.minX) + min(a.maxX, b.maxX)) / 2, y: (a.maxY + b.minY) / 2)
            #expect(shape.contains(seam), "between \(a) and \(b)")
        }
    }

    /// The sidebar doesn't repeat an AI's change to the note you have open; it's back once it closes.
    @Test func sidebarLeavesOutTheOpenNotesChange() {
        let open = OpenNoteIDs()
        let c = AIChange(id: "c", kind: .created, noteID: UUID(), ai: "ChatGPT", at: .now)
        #expect(SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open))
        open.opened(c.noteID)
        open.opened(c.noteID) // in a second window too
        #expect(!SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open))
        open.closed(c.noteID)
        #expect(!SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open), "still open in the other window")
        open.closed(c.noteID)
        #expect(SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open))
        #expect(!SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open, seenAt: c.at), "seen on the note: not back")
        #expect(SidebarAICopy.showsChange(c, connected: ["ChatGPT"], open: open, seenAt: c.at.addingTimeInterval(-3600)), "a later change, not seen yet")
    }

    /// The receipt offers Undo only, and goes on its own a few seconds after the tint fades.
    @Test func receiptIsUndoOnlyAndLeaves() {
        #expect(!AIReceipt.offersReview)
        #expect(AIReceipt.stays > 3 && AIReceipt.stays <= 10)
    }

    /// The tint of an AI's edit fades by itself, without typing or leaving the note.
    @Test func aiTintFadesOnItsOwn() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        h.controller.tintChanges(from: Self.before)
        #expect(await h.until(1) { h.controller.isTinted })
        #expect(await h.until(9) { !h.controller.isTinted }, "faded within a few seconds")
    }

    /// The tint is in the AI's own colour, the one its caret has; a plain tint keeps the accent.
    /// The margin tick shows only with Differentiate Without Colour.
    @Test func theTintIsTheAIsColourAndNeedsNoTick() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.markChanges(from: Self.before, to: Self.after, color: AIGlyph.caretColor("ChatGPT"))
        #expect(tint.color == AIGlyph.caretColor("ChatGPT"))
        h.controller.tintChanges(from: Self.before)
        #expect(tint.color == nil)
        DecoratedLayoutFragment.tickOverride = nil
        #expect(DecoratedLayoutFragment.showsTick == NSWorkspace.shared.accessibilityDisplayShouldDifferentiateWithoutColor)
    }

    /// Inside a rewritten line only the new words are marked: a one-word fix lights one word.
    @Test func aOneWordFixMarksOneWord() {
        let old = "We land on Tuesday at 14:20 and walk to the hotel."
        let new = "We land on Wednesday at 14:20 and walk to the hotel."
        let marks = ChangeTint.changedWords(from: "Trip\n\n" + old, to: "Trip\n\n" + new)
        let words = marks.map { (("Trip\n\n" + new) as NSString).substring(with: $0) }
        #expect(words == ["Wednesday"], "\(words)")
    }

    /// New words next to each other are one mark, across the space between them.
    @Test func neighbouringNewWordsAreOneMark() {
        let words = ChangeTint.newWords(from: "Day 3: LX Factory", to: "Day 3: LX Factory and a late lunch")
            .map { ("Day 3: LX Factory and a late lunch" as NSString).substring(with: $0) }
        #expect(words == ["and a late lunch"], "\(words)")
    }

    /// A new line, a tick, and a line mostly rewritten are marked whole, from after the marker.
    @Test func newLinesTicksAndRewritesAreMarkedWhole() {
        let g = "Groceries\n\n- [ ] Oat milk\n- [ ] Eggs"
        let added = g + "\n- [ ] Saffron"
        #expect(ChangeTint.changedWords(from: g, to: added).map { (added as NSString).substring(with: $0) } == ["Saffron"])
        let ticked = g.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")
        #expect(ChangeTint.changedWords(from: g, to: ticked).map { (ticked as NSString).substring(with: $0) } == ["Eggs"])
        let rewritten = "Groceries\n\n- [ ] Something else entirely\n- [ ] Eggs"
        #expect(ChangeTint.changedWords(from: g, to: rewritten).map { (rewritten as NSString).substring(with: $0) } == ["Something else entirely"])
        let table = "Budget\n\n| Item | Cost |\n|---|---|\n| Hotel | 380 |"
        #expect(ChangeTint.changedWords(from: table, to: table + "\n| Food | 150 |").isEmpty, "a table's grid isn't its text")
    }

    /// The receipt says what happened when it's one plain thing.
    @Test func theReceiptSaysWhatHappened() {
        let g = "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs"
        #expect(AIEdit.describe(previous: g, after: g.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")) == "ticked \u{201C}Eggs\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g.replacingOccurrences(of: "\n- [ ] Lemons", with: "")) == "removed \u{201C}Lemons\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g + "\n- [ ] Saffron") == "added \u{201C}Saffron\u{201D}")
        #expect(AIEdit.describe(previous: "B\n\n| a | b |\n|---|---|", after: "B\n\n| a | b |\n|---|---|\n| c | d |") == "added a row to the table")
        #expect(AIEdit.describe(previous: Self.before, after: Self.after) == nil, "a rewrite: changed N lines")
    }

    /// The highlight is pulled across the words in about a third of a second, then drawn whole.
    @Test func theMarkSweepsInThenRests() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.markChanges(from: Self.before, to: Self.after, color: .systemGreen)
        let first = (h.text as NSString).range(of: "*Last").location
        #expect(tint.sweep(at: first) < 1, "sweeping")
        #expect(await h.until(2) { tint.sweepElapsed == nil })
        #expect(tint.sweep(at: first) == 1)
        #expect(h.controller.isTinted, "resting before the fade")
        #expect(h.text == Self.after)
    }

    /// The mark waits for the text and starts the moment the editor takes it, in the same pass.
    @Test func theMarkStartsWithTheText() async throws {
        let h = await EditorHarness(Self.before, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.markChanges(from: Self.before, to: Self.after, color: .systemGreen)
        #expect(tint.marks.isEmpty, "nothing to mark yet")
        h.view.syncExternal(Self.after)
        #expect(!tint.marks.isEmpty, "marked as the text lands")
    }

    /// A tick an AI made, and the table cells it changed.
    @Test func ticksAndTableCellsAreFound() {
        let g = "G\n\n- [ ] Oat milk\n- [ ] Eggs"
        #expect(ChangeTint.tickedLines(from: g, to: g.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")) == [(g as NSString).range(of: "- [ ] Eggs").location])
        let t = "B\n\n| Item | Cost |\n|---|---|\n| Flights | 240 |"
        #expect(GridTable.changedCells(from: t, to: t + "\n| Food | 150 |") == [0: [GridCell(row: 2, column: 0), GridCell(row: 2, column: 1)]])
        #expect(GridTable.changedCells(from: t, to: t.replacingOccurrences(of: "240", with: "260")) == [0: [GridCell(row: 1, column: 1)]])
    }

    /// A change below what you can see: the receipt can take you there.
    @Test func aChangeOutOfViewIsFound() async throws {
        let lines = (1...60).map { "- Book \($0)" }.joined(separator: "\n")
        let before = "Reading\n\n" + lines, after = before + "\n- Book 61"
        let h = await EditorHarness(after, width: 640, height: 400, focus: false)
        defer { h.close() }
        h.view.scroll(.zero)
        #expect(h.controller.changePlacement(from: before) == 1)
        let r0 = h.view.firstChangeRect(from: before)
        h.controller.showChange(from: before)
        let r1 = h.view.firstChangeRect(from: before)
        await h.settle(0.2)
        #expect(h.controller.changePlacement(from: before) == 0, "r0 \(String(describing: r0)) r1 \(String(describing: r1)) r2 \(String(describing: h.view.firstChangeRect(from: before))) visible \(h.view.visibleRect), bounds \(h.view.bounds), clip \(h.scroll.contentView.bounds)")
    }

    /// Pictures of the resting mark, light and dark, for a look at it (AMBER_QA_SHOTS).
    @Test(arguments: [false, true]) func picture(dark: Bool) async throws {
        let h = await EditorHarness(Self.after, width: 720, height: 620, dark: dark, focus: false)
        defer { h.close() }
        h.controller.tintChanges(from: Self.before, untilCleared: true)
        await h.settle(1.2)
        let name = "ai-change-look\(dark ? "-dark" : "")\(ProcessInfo.processInfo.environment["AI_LOOK_SUFFIX"] ?? "")"
        await h.snapshot(name)
    }
}
#endif
