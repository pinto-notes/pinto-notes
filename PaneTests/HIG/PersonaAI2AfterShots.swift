#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Persona council round 2 (W4, AI): the new screens, light and dark: Ask about this note (its
/// toolbar button and the questions for a plan, a table and plain text), a quiet folder's
/// questions, and File › Import with the AI tile picked. After only: none of it was there before.
/// `TEST_RUNNER_PANE_PERSONA_SHOTS=/dir scripts/qa-test.sh PaneTests/PersonaAI2AfterShots`
@MainActor @Suite(.serialized) struct PersonaAI2AfterShots {
    @Test func askAboutThisNote() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let notes: [(String, String)] = [
            ("plan", "Week plan\n\n- [x] Run Tuesday, 5 km\n- [ ] Dentist Thursday\n- [ ] Long run Sunday"),
            ("table", "Runs\n\n| Date | km |\n| --- | --- |\n| Mon | 5 |\n| Wed | 7 |"),
            ("text", "Photosynthesis\n\nPlants turn light, water and carbon dioxide into sugar."),
        ]
        for dark in [false, true] {
            for (name, body) in notes {
                let subject = AskAI.Subject.note(AskAI.NoteAbout(body: body, folder: name == "text" ? "Biology" : "Running"))
                let pop = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: subject, open: { _ in }, copy: { _ in })
                let rep = try await PersonaAIShots.shoot(pop.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
                try PersonaAIShots.save(rep, "ask-about-this-note", "note-\(name)", dark: dark)
            }
            let done = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .note(AskAI.NoteAbout(body: notes[0].1, folder: "Running")),
                                    open: { _ in }, copy: { _ in }, previewDone: true)
            let d = try await PersonaAIShots.shoot(done.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
            try PersonaAIShots.save(d, "ask-about-this-note", "note-opened", dark: dark)
            let quiet = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .folder("Recipes"), recent: false, open: { _ in }, copy: { _ in })
            let q = try await PersonaAIShots.shoot(quiet.padding(20), size: CGSize(width: AskAIPopover.width + 40, height: 260), dark: dark)
            try PersonaAIShots.save(q, "ask-about-this-note", "folder-recipes", dark: dark)
            // The toolbar's button beside Share and More, as the bar draws them: 28 points.
            let bar = HStack(spacing: 2) {
                AskAINoteButton(targets: [AskAI.Target(ai: "ChatGPT")]) { _ in }
                Button {} label: { Label("Share", systemImage: "square.and.arrow.up") }
                Button {} label: { Label("More", systemImage: "ellipsis") }
            }
            .labelStyle(.iconOnly)
            .buttonStyle(.accessoryBar)
            .controlSize(.large)
            .tint(.primary)
            let b = try await PersonaAIShots.shoot(bar.padding(16), size: CGSize(width: 160, height: 64), dark: dark)
            try PersonaAIShots.save(b, "ask-about-this-note", "toolbar-buttons", dark: dark)
        }
    }

    @Test func fileImportWithTheAITilePicked() async throws {
        guard PersonaAIShots.dir != nil else { return }
        let (c, _) = try PersonaAI2Shots.lisbon()
        for dark in [false, true] {
            let importing = SetupCardsFlow(store: nil, backend: Backend(), preview: .init(card: .bring, bringAI: true), only: .importNotes, finish: { _ in }).modelContainer(c)
            let i = try await PersonaAIShots.shoot(importing.padding(20), size: CGSize(width: 480, height: 460), dark: dark)
            try PersonaAIShots.save(i, "keep-what-your-ai-knows", "file-import-ai-picked", dark: dark)
            let prompt = SetupCardsFlow(store: nil, backend: Backend(), preview: .init(card: .prompt, ai: .codex, prompt: BringOver.prompt("Codex")), finish: { _ in }).modelContainer(c)
            let p = try await PersonaAIShots.shoot(prompt.padding(20), size: CGSize(width: 480, height: 360), dark: dark)
            try PersonaAIShots.save(p, "keep-what-your-ai-knows", "codex-prompt", dark: dark)
        }
    }
}
#endif
