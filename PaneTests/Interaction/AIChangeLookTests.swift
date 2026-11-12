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

    /// An AI's edit writes itself in from the top: a later changed line is hidden at first, all of
    /// it shows within a few seconds, and the note's text is the AI's the whole time (only the
    /// drawing waits, so nothing is saved or synced twice).
    @Test func anAIEditWritesItselfIn() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        let seconds = h.controller.writeChanges(from: Self.before, to: Self.after, by: "ChatGPT", color: .systemGreen)
        #expect(seconds >= 0.5 && seconds <= 2.4, "\(seconds)")
        let last = (h.text as NSString).range(of: "- I also build").location
        #expect(tint.written(at: last) == 0, "the last changed line isn't written yet")
        #expect(tint.revealed != nil)
        #expect(await h.until(4) { tint.revealed == nil }, "all written")
        #expect(tint.written(at: last) == nil)
        #expect(h.text == Self.after, "the text was the AI's all along")
        #expect(h.controller.isTinted, "and the tint rests a moment before it fades")
    }

    /// The tint is in the AI's own colour, the one its caret has; a plain tint keeps the accent.
    /// The margin tick shows only with Differentiate Without Colour.
    @Test func theTintIsTheAIsColourAndNeedsNoTick() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.writeChanges(from: Self.before, to: Self.after, by: "ChatGPT", color: AIGlyph.caretColor("ChatGPT"))
        #expect(tint.color == AIGlyph.caretColor("ChatGPT"))
        h.controller.tintChanges(from: Self.before)
        #expect(tint.color == nil)
        DecoratedLayoutFragment.tickOverride = nil
        #expect(DecoratedLayoutFragment.showsTick == NSWorkspace.shared.accessibilityDisplayShouldDifferentiateWithoutColor)
    }

    /// The editor hears of the edit before it has the text: nothing is hidden or written until
    /// the text arrives, then it starts in the same pass, so the new lines never show whole first.
    @Test func writingWaitsForTheTextAndStartsTheMomentItArrives() async throws {
        let h = await EditorHarness(Self.before, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.writeChanges(from: Self.before, to: Self.after, by: "ChatGPT", color: .systemGreen)
        #expect(tint.revealed == nil, "nothing to write yet")
        h.view.syncExternal(Self.after)
        #expect(tint.revealed != nil, "writing from the moment the text is in")
        let last = (h.text as NSString).range(of: "- I also build").location
        #expect(tint.written(at: last) == 0)
    }

    /// A note opened with an AI's edit waiting hides the new lines before the writing starts.
    @Test func openingHidesTheNewLinesFirst() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.hideChanges(from: Self.before, to: Self.after)
        let last = (h.text as NSString).range(of: "- I also build").location
        #expect(tint.written(at: last) == 0)
        #expect(!h.controller.isTinted, "hidden, not yet lit")
    }

    /// Typing while it writes shows the whole edit at once and takes the caret away.
    @Test func typingStopsTheWriting() async throws {
        let h = await EditorHarness(Self.after, width: 640, focus: false)
        defer { h.close() }
        let tint = h.view.core.layoutDelegate.tint
        h.controller.writeChanges(from: Self.before, to: Self.after, by: "Claude", color: .systemOrange)
        h.controller.clearTint()
        #expect(tint.revealed == nil)
    }

    @Test func writingReadsTheChangedLinesInOrder() {
        let order = [NSRange(location: 10, length: 5), NSRange(location: 30, length: 4)]
        #expect(ChangeTint.offset(after: 0, in: order) == 10)
        #expect(ChangeTint.offset(after: 4, in: order) == 14)
        #expect(ChangeTint.offset(after: 5, in: order) == 30, "past the first, straight on to the next")
        #expect(ChangeTint.offset(after: 9, in: order) == 34)
        #expect(ChangeTint.writeDuration(characters: 40) == 0.5)
        #expect(ChangeTint.writeDuration(characters: 30_000) == 2.4)
    }

    /// Halfway through the writing, for a look at it (AMBER_QA_SHOTS).
    @Test(arguments: [false, true]) func pictureWhileWriting(dark: Bool) async throws {
        let h = await EditorHarness(Self.after, width: 720, height: 620, dark: dark, focus: false)
        defer { h.close() }
        ChangeTint.slowMotion = 6
        defer { ChangeTint.slowMotion = 1 }
        let seconds = h.controller.writeChanges(from: Self.before, to: Self.after, by: "ChatGPT", color: AIGlyph.caretColor("ChatGPT"))
        await h.settle(seconds * 6 * 0.55)
        await h.snapshot("ai-change-writing\(dark ? "-dark" : "")")
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
