#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Persona council round 2 (W4, AI): the screens round 1 asked to change, drawn the same way on the
/// branch before (origin/persona/ai-1.3) and after, light and dark, at a fixed size: the review
/// card part way and Done midway, a folder's Ask questions, Go to Note and the list's search for a
/// word on many lines, the setup gallery and File › Import. Offscreen; the windows are never
/// ordered in. Uses only what both sides have (PersonaAI2AfterShots has the new screens).
/// `TEST_RUNNER_PANE_PERSONA_SHOTS=/dir TEST_RUNNER_PANE_PERSONA_SIDE=before|after scripts/qa-test.sh PaneTests/PersonaAI2Shots`
@MainActor @Suite(.serialized) struct PersonaAI2Shots {
    struct Card: View {
        @State var review: AIReview
        var body: some View { AIReviewCard(review: $review, undo: { _ in }, undoAll: {}, done: {}) }
    }

    /// The review card with one part undone and one you changed since, and the line Done shows
    /// with two parts left undecided.
    @Test func reviewFixes() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let r = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: AIReviewTests.before, after: AIReviewTests.after, lines: 5)
        var rv = try #require(AIReview(r))
        let typed = AIReviewTests.after.replacingOccurrences(of: "Tell Leo.", with: "Tell Leo and Maya.")
        _ = try rv.undo(1, in: typed)
        _ = try? rv.undo(2, in: typed)
        rv.focus = 0
        var midway = try #require(AIReview(r))
        _ = try midway.undo(1, in: AIReviewTests.after)
        for dark in [false, true] {
            let card = try await PersonaAIShots.shoot(Card(review: rv).padding(20), size: CGSize(width: 600, height: 440), dark: dark)
            try PersonaAIShots.save(card, "review-fixes", "card-undone-and-refused", dark: dark)
            let toast = try await PersonaAIShots.shoot(Toast(text: midway.result).padding(.top, 24), size: CGSize(width: 600, height: 90), dark: dark)
            try PersonaAIShots.save(toast, "review-fixes", "done-midway", dark: dark)
        }
    }

    /// A folder nobody touched for a month: what its Ask popover offers.
    @Test func askAboutAQuietFolder() async throws {
        guard PersonaAIShots.dir != nil else { return }
        for dark in [false, true] {
            let pop = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .folder("Recipes"), open: { _ in }, copy: { _ in })
            let rep = try await PersonaAIShots.shoot(pop.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
            try PersonaAIShots.save(rep, "ask-about-this-note", "folder-recipes", dark: dark)
        }
    }

    /// "Lisbon" in five notes, on seven lines of one of them.
    static func lisbon() throws -> (ModelContainer, Note) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let travel = ctx.createFolder(named: "Travel")
        let trip = ctx.createNote(in: .folder(travel.id), body: """
        Trip ideas

        Fly to Lisbon on Friday, back Monday night
        - [ ] Book the hotel near the river
        - [ ] Tram 28 across Lisbon in the morning
        Sintra on Saturday
        Lisbon cards for the museums and the trams
        Dinner in Alfama, the best fish in Lisbon
        Back from Lisbon on Monday
        [[Lisbon]] has the map
        - [x] Buy the Lisbon guidebook
        """)
        trip.updatedAt = .now.addingTimeInterval(-3600)
        let budget = ctx.createNote(in: .folder(travel.id), body: "Budget\n\nFlights to Lisbon: 240\nHotel: 410")
        budget.updatedAt = .now.addingTimeInterval(-2 * 86_400)
        let work = ctx.createNote(in: .all, body: "Q4 offsite\n\nLisbon or Porto? Lisbon has the direct flights.")
        work.updatedAt = .now.addingTimeInterval(-5 * 86_400)
        try ctx.save()
        return (c, trip)
    }

    /// Go to Note (⌘O) and the list's search for "lisbon".
    @Test func searchEveryMatch() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let (c, trip) = try Self.lisbon()
        let hits = await QuickOpen.textHits(for: "lisbon", in: c)
        for dark in [false, true] {
            let panel = QuickOpenPanel(notes: [], commands: [], choose: { _ in }, close: {}, initialQuery: "lisbon", initialTextHits: hits)
            let rep = try await PersonaAIShots.shoot(panel.padding(20), size: CGSize(width: QuickOpenPanel.Metrics.width + 40, height: 420), dark: dark)
            try PersonaAIShots.save(rep, "search-every-match", "go-to-note", dark: dark)
            let row = NoteRow(note: trip, query: "lisbon", showFolder: true).frame(width: 300, alignment: .leading).padding(16).modelContainer(c)
            let list = try await PersonaAIShots.shoot(row, size: CGSize(width: 332, height: 170), dark: dark)
            try PersonaAIShots.save(list, "search-every-match", "list-row", dark: dark)
        }
    }

    /// The first run's AI step (the gallery) and File › Import.
    @Test func keepWhatYourAIKnows() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let (c, _) = try Self.lisbon()
        for dark in [false, true] {
            let gallery = SetupCardsFlow(store: OnboardingStore(defaults: TestDefaults()), backend: Backend(), preview: .init(card: .gallery), finish: { _ in }).modelContainer(c)
            let g = try await PersonaAIShots.shoot(gallery.padding(20), size: CGSize(width: 820, height: 560), dark: dark)
            try PersonaAIShots.save(g, "keep-what-your-ai-knows", "first-run-gallery", dark: dark)
            let importing = SetupCardsFlow(store: nil, backend: Backend(), preview: .init(card: .bring), only: .importNotes, finish: { _ in }).modelContainer(c)
            let i = try await PersonaAIShots.shoot(importing.padding(20), size: CGSize(width: 480, height: 420), dark: dark)
            try PersonaAIShots.save(i, "keep-what-your-ai-knows", "file-import", dark: dark)
        }
    }
}
#endif
