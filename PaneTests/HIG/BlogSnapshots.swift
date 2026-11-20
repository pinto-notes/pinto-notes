#if os(macOS)
import AppKit
import Supabase
import SwiftUI
import SwiftData
import Testing
@testable import Pane

/// The Connect ChatGPT and Connect Claude guides as the Mac shows them, light, at 2x, for the
/// website's blog posts. Offscreen; nothing touches the screen. Runs only when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/BlogSnapshots`.
@MainActor @Suite(.serialized) struct BlogSnapshots {
    @Test func connectGuides() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        // Connect an AI as the sheet shows it, with nothing found on this Mac.
        let view = ConnectAISheet(client: client, preview: [], previewFound: []).frame(width: 560, height: 560)
        try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "mac-connect-light.png"),
                                                size: CGSize(width: 560, height: 560), dark: false)
    }

    /// The same guides, and the Connect an AI list, laid out narrow (about a blog card's width), so
    /// a card's picture shows whole lines at full size instead of a shrunken window.
    @Test func narrowForCards() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        let size = CGSize(width: 340, height: 560)
        let list = Form { ConnectAISection(client: client) }.formStyle(.grouped).frame(width: size.width, height: size.height)
        try await VersionHistorySnapshots.shoot(list, to: dir.appending(path: "card-connect-list.png"), size: size, dark: false)
    }

    /// The sheet that sets the notes password for locked notes, with its warning that a forgotten
    /// password can't be recovered. For the post about a forgotten Apple Notes password.
    @Test func notesPasswordSheet() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let size = CGSize(width: 440, height: 480)
        let view = NotesPasswordSetupSheet(onDone: {}).frame(width: size.width, height: size.height)
        try await VersionHistorySnapshots.shoot(view, to: dir.appending(path: "mac-notes-password-light.png"), size: size, dark: false)
    }

    /// Notes drawn at about a blog card's width (352 pt, so 704 px like the other card pictures), for
    /// the covers of the newer posts. The cover is cropped from these at a clean content boundary.
    @Test func notesForCards() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let notes = try ctx.fetch(FetchDescriptor<Note>())
        func note(_ title: String) throws -> Note { try #require(notes.first { $0.title == title }) }
        func from(_ heading: String, in text: String, until next: String? = nil) throws -> String {
            let start = try #require(text.range(of: heading)).lowerBound
            var rest = String(text[start...])
            if let next, let end = rest.range(of: next) { rest = String(rest[..<end.lowerBound]) }
            return rest.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        let lisbon = try note("Lisbon").body
        let size = CGSize(width: 352, height: 440)
        let controller = EditorController()
        func shoot(_ n: Note, _ name: String, before: () -> Void = {}) async throws {
            let view = NavigationStack { NoteDetailView(note: n, controller: controller, onNewNote: {}) }.modelContainer(c)
            let w = AIEditSnapshots.window(view, size: size)
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(1.0))
            before()
            try? await Task.sleep(for: .seconds(1.6))
            try AIEditSnapshots.snap(w, to: dir.appending(path: "\(name).png"))
        }
        try await shoot(try note("Welcome to Pinto Notes"), "card-welcome")
        try await shoot(ctx.createNote(in: .all, body: try from("## Food", in: lisbon)), "card-lisbon-food")
        try await shoot(ctx.createNote(in: .all, body: try from("## Places", in: lisbon, until: "## Food")), "card-lisbon-places")
    }

    /// The Lisbon plan just after ChatGPT added to it: the tinted lines in the note, for the card of
    /// the post on ChatGPT memory and notes.
    @Test func chatGPTEditForCard() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            let w = AIEditSnapshots.window(AIEditSnapshots.root(c), size: CGSize(width: 1000, height: 600))
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(1.2))
            Capture.aiEdit(c.mainContext, title: "Lisbon", scene: "lisbon", by: "ChatGPT")
            try? await Task.sleep(for: .seconds(1.6))
            try AIEditSnapshots.snap(w, to: dir.appending(path: "card-lisbon-chatgpt.png"))
        }
    }

    /// The consent sheet for an app on this computer, as Gemini CLI, Codex or VS Code see it.
    @Test func consentForCommandLine() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        let r = ConnectRequest(id: UUID(), client_name: "", redirect_host: "an app on this computer", loopback: true)
        let view = ConsentSheet(client: client, requestID: r.id, initial: .asking(r), finish: { _ in }).frame(width: 420)
        let host = NSHostingView(rootView: view.background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: .aqua)
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "card-consent-local.png"))
    }

    /// Standup notes just after Claude Code added today's standup: the lines it wrote tinted, and
    /// "Claude Code changed … lines · Undo" at the bottom. For the work-log post.
    @Test func standupByClaudeCode() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Standup notes") {
            let w = AIEditSnapshots.window(AIEditSnapshots.root(c), size: CGSize(width: 1180, height: 760))
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(1.2))
            Capture.aiEdit(c.mainContext, title: "Standup notes", scene: "standup", by: "Claude Code")
            try? await Task.sleep(for: .seconds(1.6))
            try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-standup-claude-code.png"))
        }
    }

    /// The Lisbon plan just after Claude added to it, in a short window so the tinted line and
    /// "Claude changed 1 line · Undo" at the bottom fit one picture. For the post on Claude memory and notes.
    @Test func claudeEditForMemoryPost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try AppSnapshotTests.container()
        try await AppSnapshotTests.withLastNote(c, "Lisbon") {
            let w = AIEditSnapshots.window(AIEditSnapshots.root(c), size: CGSize(width: 1180, height: 470))
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(1.2))
            Capture.aiEdit(c.mainContext, title: "Lisbon", scene: "lisbon", by: "Claude")
            try? await Task.sleep(for: .seconds(1.6))
            try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-lisbon-claude.png"))
        }
    }
    /// For the post on backlinks in Apple Notes: a note with [[links]] as the Mac editor shows it, and
    /// Linked From in the ••• menu of the note they link to (drawn from the menu's own items, beside
    /// Move to… and Version History as the menu groups them). Lisbon is linked from Weekend plans and
    /// Packing; Trip documents only says "Lisbon", so it isn't listed.
    @Test func linkedFromForBacklinksPost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        WikiDirectory.invalidate()
        let lisbon = ctx.createNote(in: .all, body: "Lisbon\n\nFour days of tiles, trams and pastries in May.\n\n- Alfama at sunset\n- Pastéis de Belém\n- Tram 28")
        _ = ctx.createNote(in: .all, body: "Book club\n\nNext: Station Eleven, 4 December.")
        let packing = ctx.createNote(in: .all, body: "Packing\n\n- [ ] Good shoes for [[Lisbon]]\n- [ ] Camera and charger\n- [ ] Rain jacket")
        packing.updatedAt = .now.addingTimeInterval(-3600)
        let docs = ctx.createNote(in: .all, body: "Trip documents\n\nEverything for the Lisbon trip in one place.")
        docs.updatedAt = .now.addingTimeInterval(-7200)
        let weekend = ctx.createNote(in: .all, body: "Weekend plans\n\n- [ ] Book flights for [[Lisbon]] on Thursday\n- [ ] Pick the next book for [[Book club]]\n- [x] Dentist at 10")
        try ctx.save()
        WikiDirectory.invalidate()

        let size = CGSize(width: 640, height: 300)
        let view = NavigationStack { NoteDetailView(note: weekend, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: size)
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.2))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-wiki-links-light.png"))

        let menuView = Color.white.frame(width: 200, height: 100).contextMenu {
            Button("Move to…", systemImage: "folder") {}
            LinkedFromMenu(note: lisbon, open: { _ in }).equatable()
            Button(NoteMoreMenu.historyTitle, systemImage: "clock.arrow.circlepath") {}
        }
        .modelContainer(c)
        let mw = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 200, height: 100), styleMask: [.borderless], backing: .buffered, defer: false)
        mw.isReleasedWhenClosed = false
        let host = NSHostingView(rootView: menuView)
        host.frame = CGRect(x: 0, y: 0, width: 200, height: 100)
        mw.contentView = host
        defer { mw.close() }
        try? await Task.sleep(for: .seconds(0.3))
        host.layoutSubtreeIfNeeded()
        // The menu a right-click made here would show (the event is handed to the views, never posted).
        var found: NSMenu?
        rows: for y in stride(from: 95.0, to: 5, by: -4) {
            let p = host.convert(CGPoint(x: 100, y: y), to: nil)
            guard let e = NSEvent.mouseEvent(with: .rightMouseDown, location: p, modifierFlags: [], timestamp: 0, windowNumber: mw.windowNumber,
                                             context: nil, eventNumber: 0, clickCount: 1, pressure: 1),
                  let hit = host.hitTest(host.convert(p, from: nil)) else { continue }
            var v: NSView? = hit
            while let view = v {
                if let menu = view.menu(for: e), menu.items.contains(where: { $0.title == LinkedFromMenu.title }) { found = menu; break rows }
                v = view.superview
            }
        }
        let m = try #require(found)
        let listed = try #require(m.items.first { $0.title == LinkedFromMenu.title }?.submenu).items.map(\.title)
        #expect(listed == ["Weekend plans", "Packing"], "newest first, and Trip documents, which only says Lisbon, isn't listed: \(listed)")
        let appearance = NSAppearance(named: .aqua)!
        var image: NSImage?
        appearance.performAsCurrentDrawingAppearance { image = FolderMenuShots.draw(m, dark: false, submenu: LinkedFromMenu.title) }
        let rep = try #require(image.flatMap { NSBitmapImageRep(data: $0.tiffRepresentation ?? Data()) })
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-linked-from-light.png"))
    }

    /// The workout log template filled in, as a note, for the workout log post: typed columns and the bests list.
    @Test func workoutLogForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let log = ctx.createNote(in: .all, body: "Workout log\n\nOne row per session. Add it yourself, or tell your AI what you did after training and it logs it.\n\n## Sessions\n<!-- pane-table: Date=date; Workout=choice Push|Pull|Legs|Run|Other; Exercise=text; Result=text; Effort (1\u{2013}10)=scale 1-10 -->\n| Date | Workout | Exercise | Result | Effort (1\u{2013}10) |\n| --- | --- | --- | --- | --- |\n| 2026-10-31 | Pull | Deadlift | 115 kg x 3 | 8 |\n| 2026-11-02 | Legs | Squat | 100 kg x 5 | 8 |\n| 2026-11-04 | Push | Bench press | 70 kg x 6 | 7 |\n| 2026-11-05 | Run | Easy run | 5 km in 29 min | 5 |\n| 2026-11-06 | Pull | Deadlift | 120 kg x 3 | 9 |\n\n## Personal bests\nYour best result for each exercise, with its date.\n- Deadlift: 120 kg x 3 (6 Nov)\n- Squat: 100 kg x 5 (2 Nov)\n- Bench press: 70 kg x 6 (4 Nov)\n- 5 km: 29 min (5 Nov)\n\n## Program\nLegs, push and pull in turn with a day between, and an easy run on a rest day.\n- Legs: squat, lunges, calves\n- Push: bench press, overhead press, dips\n- Pull: deadlift, rows, pull-ups\n")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: log, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 860))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-workout-log-light.png"))
    }
    @Test func recipeForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let recipe = ctx.createNote(in: .all, body: "Lentil soup with lemon\n\nServes 4, 35 minutes.\n\n- [x] 250 g red lentils\n- [x] 1 onion\n- [ ] 2 carrots\n- [ ] 2 cloves of garlic\n- [ ] 1 tsp ground cumin\n- [ ] 2 lemons\n\nFrom the cupboard: olive oil, salt.\n\n1. Soften the onion, carrots and garlic in olive oil with the cumin.\n2. Add the lentils and a litre of water. Simmer for 20 minutes.\n3. Blend half of it, then stir in the lemon juice and salt to taste.\n")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: recipe, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 760))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-recipe-light.png"))
    }

    @Test func groceryListForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let list = ctx.createNote(in: .all, body: "Grocery list\n\nOne running list for the shop, sorted by aisle. Type what you need under an aisle, or tell your AI and it files each thing. Tick things off as you shop.\n\n## Fruit and veg\n- [ ] Apples\n- [ ] Spinach\n- [ ] Lemons\n- [x] Bananas\n\n## Bread and dairy\n- [ ] Oat milk\n- [ ] Sourdough\n- [ ] Eggs\n- [x] Butter\n\n## Meat and fish\n- [ ] Salmon fillets\n- [ ] Minced beef\n\n## Cupboard\n- [ ] Tinned tomatoes, 2 cans\n- [ ] Rice\n- [ ] Olive oil\n- [ ] Coffee\n\n## Frozen\n- [ ] Peas\n")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: list, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 1000))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-grocery-list-light.png"))
    }
}
#endif
