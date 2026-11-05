#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Review an AI's edit, on the card (persona council, 4 November 2026: Jonas, Maya, Marcus): the
/// receipt offers Review for an edit of the text only; on the card, Undo on one part puts that part
/// back in the note and leaves the rest, Keep leaves it, the last decision ends it with the count;
/// a part changed since says so and the note keeps your typing. Pressed through accessibility in a
/// window far off the screen.
@MainActor @Suite(.serialized) struct AIReviewCardTests {
    /// A struck line rules through its words, not its checkbox: a line through the circle read as
    /// a ticked box (persona council r7c).
    @Test func aStruckChecklistLineLeavesItsCircleClear() throws {
        func pixels(_ struck: Bool) throws -> (data: [UInt8], w: Int, h: Int) {
            let r = ImageRenderer(content: AIReview.text("- [ ] Pick dates", struck: struck).font(.system(size: 20)).foregroundStyle(.black).background(.white))
            r.scale = 2
            let bitmap = NSBitmapImageRep(cgImage: try #require(r.cgImage))
            let w = bitmap.pixelsWide, h = bitmap.pixelsHigh
            var out = [UInt8](); out.reserveCapacity(w * h)
            for y in 0..<h { for x in 0..<w { out.append(UInt8((bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceGray)?.whiteComponent ?? 0) * 255)) } }
            return (out, w, h)
        }
        let plain = try pixels(false), struck = try pixels(true)
        #expect(plain.w == struck.w && plain.h == struck.h)
        // The circle: about the first line-height across.
        let circle = 40
        var inCircle = 0, inWords = 0
        for y in 0..<plain.h { for x in 0..<plain.w where plain.data[y * plain.w + x] != struck.data[y * plain.w + x] {
            if x < circle { inCircle += 1 } else { inWords += 1 }
        } }
        #expect(inCircle == 0, "nothing ruled through the circle: \(inCircle) pixels")
        #expect(inWords > 100, "the words are ruled through: \(inWords) pixels")
    }

    @Test func noSlashHintAgainstATablesEdge() {
        let text = "Title\n\n| A | B |\n|---|---|\n| 1 | 2 |\n"
        #expect(PaneTextView.followsTable(text, at: (text as NSString).length), "the line under a table")
        #expect(!PaneTextView.followsTable(text + "\n", at: (text as NSString).length + 1), "a blank line below it")
        #expect(!PaneTextView.followsTable("Title\n\n", at: 7))
    }

    /// The card over a real note, wired as the note view wires it (AIReview's undo on the note).
    struct Host: View {
        @State var review: AIReview
        let note: Note
        let finished: (String) -> Void
        var inSheet = false
        var body: some View {
            if inSheet {
                AIReviewSheet(review: $review, undo: undoPart, undoAll: undoEvery, done: { finished(review.result) })
            } else {
                AIReviewCard(review: $review, undo: undoPart, undoAll: undoEvery, done: { finished(review.result) })
                    .padding(20)
            }
        }
        func undoPart(_ id: Int) {
            var rv = review
            rv.undo(id, on: note)
            review = rv
            if rv.isFinished { finished(rv.result) }
        }
        func undoEvery() {
            var rv = review
            if rv.undoAll(on: note) == 0 { finished(rv.result) }
            review = rv
        }
    }

    static func note(_ body: String) throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: body)
        return (c, n)
    }

    static let size = CGSize(width: AIReviewCard.width + 40, height: 520)

    @Test func theReceiptOffersReviewForAnEditOfTheTextOnly() async throws {
        let edit = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: AIReviewTests.before, after: AIReviewTests.after, lines: 4)
        #expect(AIReceipt.reviews(edit))
        var wrote = edit
        wrote.created = true
        #expect(!AIReceipt.reviews(wrote), "a note it wrote is undone whole")
        var page = edit
        page.kind = .pageMade
        #expect(!AIReceipt.reviews(page))
        var pressed = 0
        let ax = OffscreenAX(AIReceipt(receipt: edit, review: { pressed += 1 }, undo: {}).padding(20), size: CGSize(width: 520, height: 90))
        defer { ax.close() }
        await ax.settle()
        let review = try #require(ax.find("receipt.review"), "\(ax.ids())")
        #expect(review.text.contains("Review"))
        #expect(review.press())
        await ax.settle(200)
        #expect(pressed == 1)
        let none = OffscreenAX(AIReceipt(receipt: wrote, review: { pressed += 1 }, undo: {}).padding(20), size: CGSize(width: 520, height: 90))
        defer { none.close() }
        await none.settle()
        #expect(none.find("receipt.review") == nil, "not for a note it wrote")
    }

    /// iPhone's sheet (persona council round 2): the card fills a phone-wide sheet, Keep and Undo
    /// are full width under each part at 44 pt and up, the text is 17 pt, and Undo still puts the
    /// part back in the note. Drawn at 390 pt wide.
    @Test func inASheetTheCardFillsThePhoneWithBigButtons() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note,
                                  finished: { result.append($0) }, inSheet: true), size: CGSize(width: 390, height: 700))
        defer { ax.close() }
        await ax.settle()
        let keep = try #require(ax.find("review.keep.0"), "\(ax.ids())")
        let undo = try #require(ax.find("review.undo.0"))
        #expect(keep.frame.height >= 40 && undo.frame.height >= 40, "\(keep.frame) \(undo.frame)")
        #expect(keep.frame.width > 140 && undo.frame.width > 140, "full width, side by side: \(keep.frame) \(undo.frame)")
        #expect(abs(keep.frame.minY - undo.frame.minY) < 1)
        let part = try #require(ax.find("review.part.0"))
        #expect(part.frame.width > 340, "the part spans the sheet: \(part.frame)")
        #expect(keep.frame.minY > part.frame.minY + 20, "the buttons sit under the part's lines")
        #expect(undo.press())
        await ax.settle(200)
        #expect(ax.find("review.undone.0") != nil, "\(ax.ids())")
        #expect(note.body != AIReviewTests.after, "the part went back in the note")
    }

    /// iPhone's sheet is a normal sheet (Emil, 4 November 2026: "why is there a done button? Why
    /// is it not a normal X"): a close button, not Done; one change has no "1 of 1" and no Keep All
    /// or Undo All; several have both. Closing keeps what's left.
    @Test func theSheetHasACloseButtonAndOnlyShowsAllActionsForSeveralParts() async throws {
        let (c, note) = try Self.note("Groceries\n\n- [ ] Paella rice\n- [ ] Oat milk")
        _ = c
        var result: [String] = []
        let one = OffscreenAX(Host(review: AIReview(by: "ChatGPT", previous: "Groceries\n\n- [ ] Oat milk", after: "Groceries\n\n- [ ] Paella rice\n- [ ] Oat milk"),
                                   note: note, finished: { result.append($0) }, inSheet: true), size: CGSize(width: 390, height: 600))
        defer { one.close() }
        await one.settle()
        let close = try #require(one.find("review.done"), "\(one.ids())")
        #expect(close.text.contains("Close"), "a close button: \(close.text)")
        #expect(one.find("review.title")?.text == "ChatGPT changed 1 line", "counted in lines, as the note's button")
        #expect(one.find("review.position") == nil && one.find("review.keepAll") == nil && one.find("review.undoAll") == nil,
                "one change: \(one.ids())")
        #expect(one.find("review.keep.0") != nil && one.find("review.undo.0") != nil)
        #expect(close.press())
        await one.settle(200)
        #expect(result.count == 1, "closing ends the review, keeping it")
        let many = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note,
                                    finished: { _ in }, inSheet: true), size: CGSize(width: 390, height: 900))
        defer { many.close() }
        await many.settle()
        #expect(many.find("review.position") != nil && many.find("review.keepAll") != nil && many.find("review.undoAll") != nil, "\(many.ids())")
    }

    /// The Mac card follows the note text size (UI council round 7): at 24 pt the text is 24 pt,
    /// the card wider, and nothing is cut; at the standard size it's as before.
    @Test func theMacCardFollowsTheNoteTextSize() async throws {
        #expect(AIReviewCard.cardText(0) == 13 && AIReviewCard.cardText(24) == 24 && AIReviewCard.cardText(16) == 17)
        #expect(AIReviewCard.scale(13) == 1 && AIReviewCard.scale(24) == 1.6)
        let saved = UserDefaults.standard.object(forKey: TextSize.key)
        defer { UserDefaults.standard.set(saved, forKey: TextSize.key) }
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        func card() -> OffscreenAX {
            OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { _ in },
                        size: CGSize(width: AIReviewCard.width * 1.6 + 40, height: 900))
        }
        // One at a time: every card reads the setting live.
        UserDefaults.standard.set(13.0, forKey: TextSize.key)
        let small = card()
        await small.settle()
        let p0 = try #require(small.find("review.part.0"))
        small.close()
        UserDefaults.standard.set(24.0, forKey: TextSize.key)
        let big = card()
        defer { big.close() }
        await big.settle()
        let p1 = try #require(big.find("review.part.0"))
        #expect(p1.frame.width > p0.frame.width * 1.4, "wider: \(p0.frame) \(p1.frame)")
        #expect(p1.frame.height > p0.frame.height * 1.4, "bigger text: \(p0.frame) \(p1.frame)")
        #expect(big.find("review.title")?.text.contains("Claude changed 4 lines") == true)
    }

    /// At 24 pt in a narrow note column (520 pt, round 5): the card fits, and Done, Keep and Undo
    /// are inside it, not past the window's edge.
    @Test func aBigCardFitsANarrowColumn() async throws {
        let saved = UserDefaults.standard.object(forKey: TextSize.key)
        defer { UserDefaults.standard.set(saved, forKey: TextSize.key) }
        UserDefaults.standard.set(24.0, forKey: TextSize.key)
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { _ in },
                             size: CGSize(width: 520, height: 800))
        defer { ax.close() }
        await ax.settle()
        // Frames are on the screen (the window is far off it): measured against the card.
        let card = try #require(ax.find("review.card"), "\(ax.ids())")
        #expect(card.frame.width <= 520 - 40, "the card fits the column less the host's margins: \(card.frame)")
        #expect(ax.find("review.done")?.text.contains("Close") == true, "the Mac card closes with the ×, not an orange Done")
        for id in ["review.done", "review.keep.0", "review.undo.0", "review.part.0"] {
            let e = try #require(ax.find(id), "\(id): \(ax.ids())")
            #expect(e.frame.minX >= card.frame.minX && e.frame.maxX <= card.frame.maxX + 0.5, "\(id) inside the card: \(e.frame) in \(card.frame)")
        }
    }

    /// The sheet follows the person's text size (round 3: fixed 17 pt ignored it): at an
    /// accessibility size the title wraps instead of being cut, and Keep and Undo stay 44 pt and up.
    @Test func theSheetGrowsWithTheTextSize() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        func card(_ size: DynamicTypeSize) -> some View {
            Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note,
                 finished: { _ in }, inSheet: true).environment(\.dynamicTypeSize, size)
        }
        let normal = OffscreenAX(card(.large), size: CGSize(width: 390, height: 900))
        defer { normal.close() }
        let big = OffscreenAX(card(.accessibility3), size: CGSize(width: 390, height: 900))
        defer { big.close() }
        await normal.settle()
        await big.settle()
        let t0 = try #require(normal.find("review.title")), t1 = try #require(big.find("review.title"))
        #expect(t1.frame.height > t0.frame.height * 1.4, "bigger text: \(t0.frame) \(t1.frame)")
        #expect(t1.text == AIReviewSheet.title(AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after)), "whole, not cut: \(t1.text)")
        let keep = try #require(big.find("review.keep.0"))
        #expect(keep.frame.height >= 40)
    }

    /// Keep one, undo one, undo the last: the note has the kept part and loses the other two; the
    /// card ends with "Kept 1, undid 2".
    @Test func eachPartIsKeptOrUndoneInTheNote() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { result.append($0) }, size: Self.size)
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("review.title")?.text.contains("Claude changed 4 lines") == true, "\(ax.ids())")
        #expect(ax.find("review.position")?.text.contains("1 of 3") == true)
        for id in 0..<3 { #expect(ax.find("review.part.\(id)") != nil, "part \(id)") }
        #expect(try #require(ax.find("review.keep.0"), "\(ax.ids())").press())
        await ax.settle(200)
        #expect(ax.find("review.kept.0") != nil, "says Kept")
        #expect(ax.find("review.position")?.text.contains("2 of 3") == true, "moves on")
        #expect(note.body == AIReviewTests.after, "Keep changes nothing")
        #expect(try #require(ax.find("review.undo.1")).press())
        await ax.settle(200)
        #expect(!note.body.contains("Have Codex review it"), "that part went back")
        #expect(note.body.contains("Queue the writes offline, in order") && note.body.contains("Drop the old path now."), "the others stay")
        #expect(ax.find("review.undone.1") != nil)
        #expect(ax.find("review.undo.1") == nil && ax.find("review.keep.1") == nil, "decided: no buttons, the quiet Undone")
        #expect(result.isEmpty, "not finished yet")
        #expect(try #require(ax.find("review.undo.2")).press())
        await ax.settle(200)
        #expect(note.body.contains("Keep the old path for a week.") && !note.body.contains("Tell Leo."))
        #expect(result == ["Kept 1, undid 2"], "the last decision ends it with the count")
    }

    /// You changed a part after the AI did: its Undo says why and the note keeps your words.
    @Test func aPartYouChangedSaysSoAndKeepsYourTyping() async throws {
        let typed = AIReviewTests.after.replacingOccurrences(of: "Tell Leo.", with: "Tell Leo and Maya.")
        let (c, note) = try Self.note(typed)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { result.append($0) }, size: Self.size)
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("review.conflict.2") == nil)
        #expect(try #require(ax.find("review.undo.2"), "\(ax.ids())").press())
        await ax.settle(200)
        #expect(note.body == typed, "nothing undone")
        let why = try #require(ax.find("review.conflict.2"), "the reason shows: \(ax.ids())")
        #expect(why.text.contains("You changed this part since"), "\(why.text)")
        // Round 1 of the councils: Undo stayed beside "it can't be undone". It goes; Keep stays.
        #expect(ax.find("review.undo.2") == nil, "no Undo on a part that can't be undone: \(ax.ids())")
        #expect(ax.find("review.keep.2") != nil)
        // Undo All takes the rest back and leaves that part.
        #expect(try #require(ax.find("review.undoAll")).press())
        await ax.settle(200)
        #expect(note.body.contains("Tell Leo and Maya.") && note.body.contains("- [ ] Queue the writes\n") && !note.body.contains("Have Codex"))
        #expect(result.isEmpty, "one part is still to decide")
        #expect(try #require(ax.find("review.done")).press())
        await ax.settle(200)
        #expect(result == ["Kept 1, undid 2"], "the part you changed stays: it counts as kept")
    }

    /// Round 1 of the councils: an undone part stayed struck through, so it looked deleted. It reads
    /// as restored now (what was there, back), with the AI's lines taken out; and Done with parts
    /// undecided says they were left as the AI wrote them.
    @Test func anUndonePartReadsAsRestoredAndDoneSaysWhatWasLeft() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { result.append($0) }, size: Self.size)
        defer { ax.close() }
        await ax.settle()
        let was = try #require(ax.find("review.removed.2.0"), "\(ax.ids())")
        #expect(was.text.contains("Was: Keep the old path for a week."), "\(was.text)")
        #expect(try #require(ax.find("review.undo.2")).press())
        await ax.settle(200)
        #expect(note.body.contains("Keep the old path for a week."))
        let back = try #require(ax.find("review.removed.2.0"), "\(ax.ids())")
        #expect(back.text.contains("Back: Keep the old path for a week."), "\(back.text)")
        let out = try #require(ax.find("review.added.2.1"))
        #expect(out.text.contains("Taken out: Tell Leo."), "\(out.text)")
        #expect(try #require(ax.find("review.done")).press())
        await ax.settle(200)
        #expect(result == ["Undid 1 \u{00B7} 2 parts left as Claude wrote them"])
    }

    /// Keep All: the note is as the AI left it, and the count says so.
    @Test func keepAllLeavesTheNote() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { result.append($0) }, size: Self.size)
        defer { ax.close() }
        await ax.settle()
        #expect(try #require(ax.find("review.keepAll"), "\(ax.ids())").press())
        await ax.settle(200)
        #expect(note.body == AIReviewTests.after)
        #expect(result == ["Kept 3"])
    }
}
#endif
