#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The screens W2 added (persona council, 4 November 2026), light and dark, at a fixed size: the
/// receipt with Review, the review card part way through, and Ask ChatGPT about a folder.
/// `TEST_RUNNER_PANE_PERSONA_SHOTS=/dir scripts/qa-test.sh PaneTests/PersonaAIAfterShots`
@MainActor @Suite(.serialized) struct PersonaAIAfterShots {
    struct Card: View {
        @State var review: AIReview
        var body: some View { AIReviewCard(review: $review, undo: { _ in }, undoAll: {}, done: {}) }
    }

    @Test func reviewAnAIEdit() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let r = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: AIReviewTests.before, after: AIReviewTests.after, lines: 5)
        // Part way: the first kept, the second undone, the third changed since and refused.
        var rv = try #require(AIReview(r))
        rv.keep(0)
        var text = try rv.undo(1, in: AIReviewTests.after)
        text = text.replacingOccurrences(of: "Tell Leo.", with: "Tell Leo and Maya.")
        _ = try? rv.undo(2, in: text)
        var fresh = try #require(AIReview(r))
        fresh.focus = 0
        for dark in [false, true] {
            let receipt = try await PersonaAIShots.shoot(AIReceipt(receipt: r, seeAll: {}, review: {}, undo: {}).padding(.top, 24), size: CGSize(width: 600, height: 90), dark: dark)
            try PersonaAIShots.save(receipt, "review-ai-edit", "receipt", dark: dark)
            let start = try await PersonaAIShots.shoot(Card(review: fresh).padding(20), size: CGSize(width: 600, height: 420), dark: dark)
            try PersonaAIShots.save(start, "review-ai-edit", "card-start", dark: dark)
            let mid = try await PersonaAIShots.shoot(Card(review: rv).padding(20), size: CGSize(width: 600, height: 420), dark: dark)
            try PersonaAIShots.save(mid, "review-ai-edit", "card-part-way", dark: dark)
            let toast = try await PersonaAIShots.shoot(Toast(text: "Kept 2, undid 1").padding(.top, 24), size: CGSize(width: 600, height: 90), dark: dark)
            try PersonaAIShots.save(toast, "review-ai-edit", "result", dark: dark)
        }
    }

    @Test func askAnAIAboutAFolder() async throws {
        guard PersonaAIShots.dir != nil else { return }
        for dark in [false, true] {
            for (target, name) in [(AskAI.Target(ai: "ChatGPT"), "popover-chatgpt"), (AskAI.Target(ai: "Codex"), "popover-codex")] {
                let pop = AskAIPopover(target: target, subject: .folder("Running"), open: { _ in }, copy: { _ in })
                let rep = try await PersonaAIShots.shoot(pop.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
                try PersonaAIShots.save(rep, "ask-ai-about-folder", name, dark: dark)
            }
            let done = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .folder("Running"), open: { _ in }, copy: { _ in }, previewDone: true)
            let rep = try await PersonaAIShots.shoot(done.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
            try PersonaAIShots.save(rep, "ask-ai-about-folder", "popover-opened", dark: dark)
        }
    }
}
#endif
