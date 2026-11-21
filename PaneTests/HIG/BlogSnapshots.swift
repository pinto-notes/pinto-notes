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
    @Test func meetingNotesForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Meeting notes\n\nAfter a meeting, paste your rough notes or the transcript into your AI. The summary and action items land here, newest meeting first.\n\n## Action items\nWho does what, and by when. Ticked when done.\n- [ ] Sara: send the new pricing to sales (10 Nov)\n- [ ] Emma: check Norway's VAT rules (next week)\n- [x] Jonas: review the checkout design (6 Nov)\n\n## Meetings\nOne section per meeting: what was said in two lines, and what was decided.\n### Pricing sync, 5 November\nThree plans stay, the lifetime deal goes, and the yearly discount drops to 15%.\n\n- Decided: no lifetime plan.\n- Open: whether students get the Pro plan free.\n\n### Design review, 3 November\nThe new checkout is approved with two changes: the total shows before the card details, and the error messages are in plain words.\n\n- Decided: one page, not three steps.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 980))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-meeting-notes-light.png"))
    }

    @Test func cornellNotesForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Cornell notes\n\n## Lectures\n### Supply and demand, 5 November\n| Cue | Notes |\n| --- | --- |\n| What shifts the demand curve? | Income, tastes, related prices. |\n| What moves along the curve? | Only the good's own price. |\n| What is the equilibrium price? | Where demand equals supply. |\n| What does a price ceiling cause? | A shortage, if it's below equilibrium. |\n\n**Summary:** The good's own price moves you along the demand curve; income, tastes and related prices shift it. The price settles where demand equals supply, and a ceiling below that leaves a shortage.\n\n## Cues to revisit\nThe cues you missed when quizzed, ticked once you get them right.\n- [ ] What shifts the demand curve?\n- [x] What does a price ceiling cause?")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 820))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-cornell-notes-light.png"))
    }
    @Test func bookNotesForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Book notes\n\nWhat stuck from each book: the big idea, the lines worth keeping, and what you'll do differently. Tell your AI which book you're reading to start its notes.\n\n## Books\nOne section per book, newest first.\n### Four Thousand Weeks by Oliver Burkeman\n> \"The day will never arrive when you finally have everything under control.\" (p. 31)\n\n- The to-do list is infinite by design. Finishing it isn't the goal.\n- Pick your three big projects; everything else waits.\n- Saying no to good things is the hard part.\n- Rest isn't a reward for finishing: nothing is ever finished.\n\n**The big idea:** life is short and attention is finite. Trying to do everything guarantees the important things get squeezed. Choose what to neglect, on purpose.\n\n- [ ] Keep a list of three active projects, no more\n- [ ] Do the most important thing first, before email\n- [ ] Keep one evening a week with nothing planned\n\n### Deep Work by Cal Newport\n- Two focused hours beat a scattered day.\n- Shallow work gets a slot of its own, so it can't leak into the rest.\n\n**The big idea:** attention is the thing to protect. Decide when the deep work happens before the day decides for you.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 1100))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-book-notes-light.png"))
    }
    @Test func bugTriageForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Bug triage\n\nEvery bug report in one table, with how much it hurts. Paste a report into your AI and it files it.\n\n## Bugs\n<!-- pane-table: Bug=text; Severity=choice P0|P1|P2|P3; Area=text; Status=choice New|Confirmed|In progress|Fixed|Won't fix; Reported=text; Link=text -->\n| Bug | Severity | Area | Status | Reported | Link |\n| --- | --- | --- | --- | --- | --- |\n| Saved cards fail at checkout | P1 | Checkout | In progress | 2026-11-04 | #412 |\n| Search misses \u{e5}, \u{e4} and \u{f6} | P2 | Search | Fixed | 2026-11-02 | #407 |\n| Order email arrives twice | P2 | Email | New | 2026-11-06 | #418 |\n| Footer logo is blurry on phones | P3 | Design | Confirmed | 2026-11-05 |   |\n\n## Details\nSteps to reproduce, what was expected and what happened. One section per bug.\n### Saved cards fail at checkout\n1. Sign in to an account with a saved card.\n2. Add anything to the basket and go to checkout.\n3. Choose the saved card and select Pay.\n\n- **Expected:** the order is placed.\n- **What happened:** \"Payment failed\", and no order.\n\n## Severity\n- **P0:** data loss, a security hole, or everyone is blocked. Drop everything.\n- **P1:** a main flow is broken for many people. This week.\n- **P2:** broken, but there's a workaround. Schedule it.\n- **P3:** polish. When there's time.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 1000))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-bug-triage-light.png"))
    }
    @Test func contentCalendarForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Content calendar\n\nWhat's going out, where and when, plus your ideas, so you never start from a blank page. Tell your AI an idea to add the first.\n\n## Calendar\n<!-- pane-table: Publish on=text; Title=text; Channel=choice Blog|Newsletter|LinkedIn|Instagram|YouTube; Status=choice Idea|Drafting|Scheduled|Published -->\n| Publish on | Title | Channel | Status |\n| --- | --- | --- | --- |\n| 2026-11-03 | Five questions for every new customer | Blog | Published |\n| 2026-11-10 | What 100 customer calls taught us | LinkedIn | Scheduled |\n| 2026-11-12 | Newsletter: three customer stories | Newsletter | Drafting |\n| 2026-11-17 | Our onboarding, before and after | LinkedIn | Drafting |\n| 2026-11-19 | Behind the scenes: the support desk | Instagram | Idea |\n\n## Ideas\nAnything worth a post, added the moment you think of it.\n- Three tools I use every day\n- A day in support, in numbers\n- What we stopped doing this year\n\n## Voice\n- Short sentences. One idea per post.\n- Show the work: a screenshot or a number beats an adjective.\n- End with a question, not a sales pitch.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 900))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-content-calendar-light.png"))
    }
    @Test func dailyJournalForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Daily journal\n\nA few lines a day. Tell your AI about your day, or let it ask the questions below, and the entry lands here, newest day first.\n\n## Questions\n1. What happened today?\n2. What took energy, and what gave it back?\n3. What do I want to remember?\n4. What's one thing for tomorrow?\n\n## Entries\nNewest day first.\n### Sunday 8 November\n- **Today:** quiet day; finished the bookshelf and went for a long walk.\n- **Energy:** low after lunch, better after coffee with Jonas.\n- **Remember:** the bakery on the corner opens at seven.\n- **Tomorrow:** call Mum.\n\n### Saturday 7 November\n- **Today:** helped Maja move; it went faster than we feared.\n- **Energy:** the stairs took it, the pizza after gave it back.\n- **Remember:** Maja said the new flat gets the evening sun.\n- **Tomorrow:** reply to the landlord before noon.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 900))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-daily-journal-light.png"))
    }
    @Test func dailyStandupForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Standup notes\n\nYesterday, today and blockers, one section a day, newest first. Tell your AI what you did, or let a coding agent write yesterday from your commits.\n\n## Blockers\nWhat you're waiting on. It goes from here once it's unblocked.\n- Waiting on API keys for the staging payment provider\n\n## Days\nOne section per working day.\n### Friday 6 November\n**Yesterday**\n- Fixed the sync conflict when two devices edit the same note\n- Added tests for the importer's table handling\n\n**Today**\n- Review the onboarding pull request\n- Start on the export to PDF\n\n### Thursday 5 November\n**Yesterday**\n- Paired with Emma on the importer\n\n**Today**\n- Fix the sync conflict\n- Write the importer's table tests")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 900))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-daily-standup-light.png"))
    }
    @Test func decisionLogForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Decision log\n\nEvery decision worth remembering: what you chose, what you didn't, and why. Tell your AI about one to log the first.\n\n## Open questions\nWhat still needs deciding.\n- Do we support offline editing in the first release?\n- Who owns the importer after the launch?\n\n## Decisions\nNewest first: the context, what you chose and why.\n### Stay on Postgres, 4 November\n- **Context:** notes grew to 2 million rows and search got slow.\n- **Options:** a document store, a search service, or better indexes.\n- **Chose:** Postgres with a trigram index.\n- **Why:** one database to run, and the index made search 40 times faster.\n- **Revisit:** at 20 million rows.\n\n### Release every Tuesday, 2 November\n- **Context:** releases slipped whenever one fix wasn't ready.\n- **Chose:** ship what's ready every Tuesday.\n- **Why:** small releases are easier to undo.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 900))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-decision-log-light.png"))
    }
    @Test func giftIdeasForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Gift ideas\n\nSave ideas the moment you hear them, so the next birthday is easy. Add one in the table, or tell your AI.\n\n## Ideas\n<!-- pane-table: Person=text; Occasion=text; Idea=text; Budget (kr)=number; Status=choice Idea|Bought|Given -->\n| Person | Occasion | Idea | Budget (kr) | Status |\n| --- | --- | --- | --- | --- |\n| Maja | Housewarming | A good chef's knife | 900 | Idea |\n| Dad | Christmas | Football tickets | 500 | Bought |\n| Jonas | Birthday | A green wool beanie | 300 | Idea |\n| Mum | Christmas | A weekend away | 2500 | Idea |\n| Emma | Thank you | Good olive oil | 200 | Given |\n\n## Sizes and likes\nWhat you learn about each person: sizes, favourites, what they already have.\n- **Maja:** cooks a lot, already has a stand mixer.\n- **Jonas:** medium, loves anything green.\n- **Mum:** no more things; she'd rather do something together.\n- **Dad:** has every scarf the club sells.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 800))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-gift-ideas-light.png"))
    }
    @Test func homeMaintenanceForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Home maintenance\n\nThe jobs that keep a home working, how often they're due, and when you last did them. Add a job in the table, or tell your AI about one.\n\n## Jobs\n<!-- pane-table: Task=text; Every=choice Month|3 months|6 months|Year; Last done=text; Next due=text -->\n| Task | Every | Last done | Next due |\n| --- | --- | --- | --- |\n| Descale the kettle | Month | 1 Nov 2026 | 1 Dec 2026 |\n| Clean the dishwasher filter | Month | 5 Nov 2026 | 5 Dec 2026 |\n| Test the smoke alarms | 3 months | 14 Aug 2026 | 14 Nov 2026 |\n| Service the boiler | Year | 20 Nov 2025 | 20 Nov 2026 |\n| Clear the gutters | 6 months | 24 May 2026 | 24 Nov 2026 |\n\n## This month\nWhat's due this month, ticked when done.\n- [x] Descale the kettle (done 1 Nov)\n- [x] Clean the dishwasher filter (done 5 Nov)\n- [ ] Test the smoke alarms (due 14 Nov)\n- [ ] Service the boiler (due 20 Nov)\n- [ ] Clear the gutters (due 24 Nov)\n\n## Who to call\n- Plumber: Nordin & Son, 08-465 004 27\n- Electrician: Volt Fix, 08-465 004 63\n\n## Appliances\nModel numbers and warranty dates.\n- Dishwasher: Bosch Series 4, warranty until 2028\n- Boiler: Vaillant ecoTEC, fitted in 2021")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 1100))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-home-maintenance-light.png"))
    }
    @Test func jobHuntForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Job hunt\n\nEvery application, where it stands, and what happens next. Add a job in the table, or paste a job ad into your AI and it files it.\n\n## Applications\n<!-- pane-table: Company=text; Role=text; Stage=choice Saved|Applied|Interview|Offer|Rejected|Withdrawn; Next step=text -->\n| Company | Role | Stage | Next step |\n| --- | --- | --- | --- |\n| Tideway | Senior designer | Interview | First interview, 12 Nov |\n| Marlow Studio | Design lead | Applied | Follow up, 16 Nov |\n| Finch Bikes | Product designer | Saved | Apply by 18 Nov |\n| Northlight | UX designer | Rejected | Asked for feedback |\n\n## Interview prep\nLikely questions and your talking points, one section per company.\n### Tideway, first interview 12 Nov\n1. A project you're proud of? *The onboarding redesign.*\n2. How do you work with engineers? *Weekly reviews, ship small.*\n3. Why Tideway? *I like untangling logistics.*\n\nTo ask them: how do design and support share what they hear?\n\n## This week\nThe follow-ups to do, ticked when done.\n- [ ] Send the portfolio link to Tideway\n- [x] Add the onboarding project to the CV\n\n## People I've talked to\nWho they are and what they said.\n- Karin, design manager at Tideway: cares more about plain prototypes than polish.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 1000))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-job-hunt-light.png"))
    }
    @Test func moodEnergyLogForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Mood and energy log\n\nA short check-in each evening: add a row, or tell your AI about your day and it logs it. After a few weeks, ask it what the patterns are.\n\n## Check-ins\n<!-- pane-table: Date=date; Mood (1\u{2013}5)=scale 1-5; Energy (1\u{2013}5)=scale 1-5; Sleep (hours)=number; Note=text -->\n| Date | Mood (1\u{2013}5) | Energy (1\u{2013}5) | Sleep (hours) | Note |\n| --- | --- | --- | --- | --- |\n| 2026-11-04 | 4 | 4 | 7.5 | Gym before work |\n| 2026-11-05 | 3 | 2 | 6 | Meetings all day |\n| 2026-11-06 | 4 | 3 | 6.5 | Lunch with Maja |\n| 2026-11-07 | 4 | 2 | 5.5 | Maja's moving day |\n| 2026-11-08 | 4 | 4 | 8 | Slept in |\n\n## Patterns\nWhat your AI notices when you ask it to look back.\n- Energy follows sleep: 2 on six hours or less, 4 on seven and a half or more.\n- Mood dipped to 3 only on the day with meetings all day.\n- Five days so far. Worth another look in a month.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 800))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-mood-energy-log-light.png"))
    }
    @Test func oneOnOneNotesForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "1:1 notes\n\nMy 1:1s with Emma, every other Thursday. Topics go in during the week so nothing waits until I've forgotten it.\n\n## Next time\nWhat to bring up, added during the week.\n- Feedback on the design review\n- The conference budget\n- Emma's goals for next quarter\n\n## Follow-ups\nWhat each of you promised, ticked when done.\n- [ ] Me: find Emma a mentor from the platform team\n- [ ] Me: ask about a quieter rotation\n- [ ] Emma: draft the launch plan by 20 Nov\n- [x] Emma: share the on-call notes\n\n## Past 1:1s\nNewest first: what you talked about and how they seemed.\n### 1:1 with Emma, 5 November\n- On-call was rough: two pages at night. She wants a quieter rotation.\n- Wants to lead the spring launch. Seemed tired but positive.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 800))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-one-on-one-notes-light.png"))
    }
    @Test func readingListForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Reading list\n\nEvery book you want to read, are reading or have finished. Add one in the table, or tell your AI about a book and it files it.\n\n## Books\n<!-- pane-table: Title=text; Author=text; Status=choice To read|Reading|Finished|Dropped; Rating (1\u{2013}5)=scale 1-5; Why=text -->\n| Title | Author | Status | Rating (1\u{2013}5) | Why |\n| --- | --- | --- | --- | --- |\n| Project Hail Mary | Andy Weir | Finished | 5 | Book club |\n| Piranesi | Susanna Clarke | Reading |   | From Jonas |\n| War and Peace | Leo Tolstoy | Dropped | 2 | Gave up, p. 90 |\n| Never Let Me Go | Kazuo Ishiguro | Finished | 4 | Holiday read |\n| The Overstory | Richard Powers | To read |   | Sara lent it |\n\n## Notes\nA few lines on each book once you've read it.\n### Project Hail Mary\nThe friendship carries the whole book. Lending my copy to Dad next.\n\n### Never Let Me Go\nQuiet and strange. I kept thinking about it for weeks after.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 800))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-reading-list-light.png"))
    }
    @Test func studyFlashcardsForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Study notes and flashcards\n\nAdd your first cards in the app, or paste your notes into your AI and it makes them. Cards you miss come back sooner; cards you know wait longer.\n\n## Notes\nYour notes on each topic, under a heading of its own.\n### Cell respiration\n- Glucose is broken down to make ATP, the cell's energy.\n- Three stages: glycolysis, the Krebs cycle, the electron transport chain.\n- Most ATP comes from the electron transport chain, in the mitochondria.")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 520))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-study-flashcards-light.png"))
    }
    @Test func weeklyReviewForTemplatePost() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let note = ctx.createNote(in: .all, body: "Weekly review\n\nTwenty minutes on Sunday. Your AI asks the questions, and the answers land here, newest week first.\n\n## Questions\n1. What went well this week?\n2. What didn't, and why?\n3. What did I learn?\n4. What am I grateful for?\n5. What are my top three for next week?\n\n## Reviews\nNewest week first.\n### Week of 2 November\n- **Went well:** handed in the report a day early; trained four times.\n- **Didn't:** no deep work on Thursday, too many meetings.\n- **Learned:** a 30-minute agenda beats a 60-minute meeting.\n- **Grateful for:** dinner with my sister.\n- [ ] Block Thursday mornings for deep work\n- [ ] Send the Q4 plan to Jonas\n- [x] Book the dentist")
        try ctx.save()
        let view = NavigationStack { NoteDetailView(note: note, controller: EditorController(), onNewNote: {}) }.modelContainer(c)
        let w = AIEditSnapshots.window(view, size: CGSize(width: 760, height: 760))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .seconds(1.5))
        try AIEditSnapshots.snap(w, to: dir.appending(path: "mac-weekly-review-light.png"))
    }
}
#endif
