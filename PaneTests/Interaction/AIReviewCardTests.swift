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
    /// The card over a real note, wired as the note view wires it (AIReview's undo on the note).
    struct Host: View {
        @State var review: AIReview
        let note: Note
        let finished: (String) -> Void
        var body: some View {
            AIReviewCard(review: $review,
                         undo: { id in
                             var rv = review
                             rv.undo(id, on: note)
                             review = rv
                             if rv.isFinished { finished(rv.result) }
                         },
                         undoAll: {
                             var rv = review
                             if rv.undoAll(on: note) == 0 { finished(rv.result) }
                             review = rv
                         },
                         done: { finished(review.result) })
                .padding(20)
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

    /// Keep one, undo one, undo the last: the note has the kept part and loses the other two; the
    /// card ends with "Kept 1, undid 2".
    @Test func eachPartIsKeptOrUndoneInTheNote() async throws {
        let (c, note) = try Self.note(AIReviewTests.after)
        _ = c
        var result: [String] = []
        let ax = OffscreenAX(Host(review: AIReview(by: "Claude", previous: AIReviewTests.before, after: AIReviewTests.after), note: note) { result.append($0) }, size: Self.size)
        defer { ax.close() }
        await ax.settle()
        #expect(ax.find("review.title")?.text.contains("Claude changed 3 parts") == true, "\(ax.ids())")
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
        // Undo All takes the rest back and leaves that part.
        #expect(try #require(ax.find("review.undoAll")).press())
        await ax.settle(200)
        #expect(note.body.contains("Tell Leo and Maya.") && note.body.contains("- [ ] Queue the writes\n") && !note.body.contains("Have Codex"))
        #expect(result.isEmpty, "one part is still to decide")
        #expect(try #require(ax.find("review.done")).press())
        await ax.settle(200)
        #expect(result == ["Kept 1, undid 2"], "Done keeps what's left")
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
