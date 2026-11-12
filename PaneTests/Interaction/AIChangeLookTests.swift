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

    /// Words kept in a rewritten line stay plain, even when most of the line is new (council r1).
    @Test func keptWordsStayPlainInALongerLine() {
        func marked(_ old: String, _ new: String) -> [String] {
            // Whether the full stop is in the mark doesn't matter.
            ChangeTint.newWords(from: old, to: new).map { (new as NSString).substring(with: $0).trimmingCharacters(in: .punctuationCharacters) }
        }
        #expect(marked("- Swedish, based in Jönköping.", "- Swedish, based in Jönköping, with plans to move to Stockholm.")
            == ["with plans to move to Stockholm"])
        #expect(marked("Last refreshed: 1 October 2026.", "Last refreshed: 12 November 2026. This is enduring context.")
            == ["12 November", "This is enduring context"])
    }

    /// A tick changes only the marker: no words of the line are new, and nothing out of range
    /// (round 2's pictures: an exception here dropped the mark and the receipt).
    @Test func aTickHasNoNewWords() {
        #expect(ChangeTint.newWords(from: "- [ ] Eggs", to: "- [x] Eggs").isEmpty)
        #expect(ChangeTint.newWords(from: "- [ ] Eggs", to: "- [x] Eggs, free range") .map { ("- [x] Eggs, free range" as NSString).substring(with: $0) } == ["free range"])
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

    /// An edit you only see later says how long ago it was; one that just happened doesn't.
    @Test func aLaterEditSaysWhen() {
        let now = Date.now
        #expect(AIReceipt.age(now.addingTimeInterval(-30), now: now) == nil)
        #expect(AIReceipt.age(now.addingTimeInterval(-600), now: now) == "10 min ago")
        #expect(AIReceipt.age(now.addingTimeInterval(-7300), now: now) == "2 h ago")
        #expect(AIReceipt.age(now.addingTimeInterval(-90000), now: now) == "yesterday")
    }

    /// Typing right after an AI's edit: the marks follow the text and fade in a third of a
    /// second, not cut out (council r1).
    @Test func typingFadesTheMarksAndTheyFollowTheText() async {
        let tint = ChangeTint()
        let old = "Trip\n\nWe land on Tuesday."
        let new = "Trip\n\nWe land on Wednesday."
        tint.play(from: old, to: new, color: nil)
        try? await Task.sleep(for: .seconds(0.9))
        let before = tint.marks
        tint.typed("Hi " + new)
        #expect(tint.marks == before.map { NSRange(location: $0.location + 3, length: $0.length) }, "moved with the text")
        #expect(tint.strength > 0, "still fading")
        try? await Task.sleep(for: .seconds(0.5))
        #expect(tint.marks.isEmpty && tint.strength == 0, "then gone")
    }

    /// A second AI's edit on top of the first: the first one's marks stay, in its colour (council r2).
    @Test func anotherAIsEditKeepsTheFirstOnesMarks() async {
        let tint = ChangeTint()
        let g = "Groceries\n\n- [ ] Eggs"
        let one = g + "\n- [ ] Saffron"
        let two = "Groceries\n\n- [ ] Milk\n- [ ] Eggs\n- [ ] Saffron"
        let green = AIGlyph.caretColor("ChatGPT"), orange = AIGlyph.caretColor("Claude")
        tint.play(from: g, to: one, color: green)
        try? await Task.sleep(for: .seconds(0.9))
        tint.play(from: one, to: two, color: orange)
        let ns = two as NSString
        #expect(tint.marks.map { ns.substring(with: $0) } == ["Milk"])
        #expect(tint.carried.map { ns.substring(with: $0.range) } == ["Saffron"], "moved down a line, still marked")
        #expect(tint.carried.first?.color == green)
        #expect(tint.ranges.contains { NSLocationInRange(ns.range(of: "Saffron").location, $0) }, "its line is drawn")
        // The same AI again is one change, not a carried one.
        tint.play(from: one, to: two, color: green)
        #expect(tint.carried.isEmpty)
        tint.stop()
    }

    /// A later edit from the same AI while the first is marked: the first mark stays drawn whole
    /// and lit, only the new change sweeps, and a ticked box is in the AI's colour from its first
    /// frame (council r3: Saffron swept in again; the box went orange, green, orange).
    @Test func aLaterEditDoesNotReplayTheFirst() async {
        let tint = ChangeTint()
        let g = "Groceries\n\n- [ ] Eggs\n- [ ] Bread"
        let one = g + "\n- [ ] Saffron"
        let two = one.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")
        tint.play(from: g, to: one, color: .systemGreen)
        try? await Task.sleep(for: .seconds(0.9))
        let lit = tint.strength
        tint.play(from: g, to: two, color: .systemGreen)
        let ns = two as NSString
        #expect(tint.strength == lit, "no dip, no second pop")
        #expect(tint.sweep(at: ns.range(of: "- [ ] Saffron").location) == 1, "Saffron stays whole")
        #expect(tint.sweep(at: ns.range(of: "- [x] Eggs").location) < 1, "the tick sweeps in")
        #expect(tint.tickBlend == 1, "the box is the AI's colour at once")
        tint.stop()
        // As in the editor: the text arrives first and the marks follow it, then the mark plays.
        tint.play(from: g, to: one, color: .systemGreen)
        try? await Task.sleep(for: .seconds(0.9))
        #expect(tint.follow(two))
        tint.play(from: g, to: two, color: .systemGreen)
        #expect(tint.strength == lit)
        #expect(tint.sweep(at: ns.range(of: "- [ ] Saffron").location) == 1, "Saffron stays whole after the editor moved it")
        tint.stop()
        // Then a line above it deleted: Saffron moves up and still doesn't sweep again.
        let three = two.replacingOccurrences(of: "- [ ] Bread\n", with: "")
        tint.play(from: g, to: two, color: .systemGreen)
        try? await Task.sleep(for: .seconds(0.9))
        tint.follow(three)
        tint.play(from: g, to: three, color: .systemGreen)
        let n3 = three as NSString
        #expect(tint.sweep(at: n3.range(of: "- [ ] Saffron").location) == 1, "Saffron stays whole after a deletion above it")
        tint.stop()
        // A first tick, from nothing: the AI's colour from the first frame too.
        tint.play(from: g, to: g.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs"), color: .systemGreen)
        try? await Task.sleep(for: .seconds(0.05))
        #expect(tint.tickBlend == 1)
        tint.stop()
    }

    /// A line removed where another, unrelated one was added is still shown as removed (council r3, 16).
    @Test func aRemovedLineNextToANewOneIsShown() {
        let g = "Groceries\n\n- [ ] Oat milk\n- [ ] Eggs\n- [ ] Bread"
        let now = "Groceries\n\n- [ ] Oat milk\n- [x] Eggs\n- [ ] Saffron"
        let gaps = ChangeTint.removals(from: g, to: now)
        let ns = now as NSString
        #expect(gaps.map(\.paragraph.location) == [ns.range(of: "- [ ] Saffron").location], "between Eggs and Saffron, where Bread was")
        // A real rewrite of the line isn't a removal.
        #expect(ChangeTint.removals(from: g, to: g.replacingOccurrences(of: "Bread", with: "Bread rolls")).isEmpty)
    }

    /// Three edits in a row are counted, never described as one change that didn't happen (council r2).
    @Test func threeEditsAreCounted() {
        let g = "Groceries\n\n- [ ] Eggs\n- [ ] Bread"
        var r = AIEdit.Receipt(noteID: UUID(), by: "ChatGPT", at: .now, previous: g,
                               after: "Groceries\n\n- [x] Eggs\n- [ ] Saffron", lines: 2)
        r.edits = 3
        #expect(r.summary == "ChatGPT made 3 changes")
    }

    /// The receipt says what happened when it's one plain thing.
    @Test func theReceiptSaysWhatHappened() {
        let g = "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs"
        #expect(AIEdit.describe(previous: g, after: g.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")) == "ticked \u{201C}Eggs\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g.replacingOccurrences(of: "\n- [ ] Lemons", with: "")) == "removed \u{201C}Lemons\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g + "\n- [ ] Saffron") == "added \u{201C}Saffron\u{201D}")
        #expect(AIEdit.describe(previous: "B\n\n| a | b |\n|---|---|", after: "B\n\n| a | b |\n|---|---|\n| c | d |") == "added \u{201C}c\u{201D} to the table")
        #expect(AIEdit.describe(previous: Self.before, after: Self.after) == nil, "a rewrite: changed N lines")
        // A swapped word and a renamed title say so (council r1), and quotes stay short.
        let trip = "Trip\n\nWe land on Tuesday at 14:20."
        #expect(AIEdit.describe(previous: trip, after: trip.replacingOccurrences(of: "Tuesday", with: "Wednesday")) == "changed \u{201C}Tuesday\u{201D} to \u{201C}Wednesday\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g.replacingOccurrences(of: "Groceries", with: "Groceries for Saturday")) == "renamed the note")
        #expect(AIEdit.describe(previous: g, after: g + "\n- [ ] Book 31: added by ChatGPT today") == "added \u{201C}Book 31: added by ChatGPT today\u{201D}")
        #expect(AIEdit.describe(previous: g, after: g + "\n- [ ] Smoked paprika from the market on Rua do Bonjardim") == "added \u{201C}Smoked paprika from the market…\u{201D}")
        // Words added to a line, or taken out of it, are named (council r2: "changed 1 line").
        let pack = "Trip\n\nPack light: one bag each."
        #expect(AIEdit.describe(previous: pack, after: "Trip\n\nPack light: one bag each, and a rain jacket.") == "added \u{201C}and a rain jacket\u{201D}")
        #expect(AIEdit.describe(previous: pack, after: "Trip\n\nPack light: one bag.") == "removed \u{201C}each\u{201D}")
        // Two edits in a row say both when they're short.
        #expect(AIEdit.describe(previous: g, after: (g + "\n- [ ] Saffron").replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs"))
                == "added \u{201C}Saffron\u{201D} and ticked \u{201C}Eggs\u{201D}")
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

    /// A new table row's cells fade together with the text's mark, not on a timer of their own.
    @Test func tableCellsFadeWithTheMark() async throws {
        let t = "B\n\n| Item | Cost |\n|---|---|\n| Flights | 240 |"
        let after = t + "\n| Food | 150 |"
        let h = await EditorHarness(after, width: 640, focus: false)
        defer { h.close() }
        h.controller.markChanges(from: t, to: after, color: .systemGreen)
        h.controller.markTableCells(from: t, to: after, color: .systemGreen)
        #expect(!h.controller.aiCells.isEmpty)
        try? await Task.sleep(for: .seconds(1.5))
        if h.controller.isTinted { #expect(!h.controller.aiCells.isEmpty, "kept while the mark rests") }
        #expect(await h.until(12) { !h.controller.isTinted && h.controller.aiCells.isEmpty }, "gone with the mark")
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
        // The last line comes up clear of the bottom, where the receipt sits.
        let r2 = try #require(h.view.firstChangeRect(from: before))
        #expect(r2.maxY < h.view.visibleRect.maxY - 100, "\(r2) in \(h.view.visibleRect)")
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
