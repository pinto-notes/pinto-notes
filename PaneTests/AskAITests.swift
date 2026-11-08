import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// Ask an AI about a folder or a note (persona council, 4 November 2026: Maya, Elena, the household): what
/// the menus offer for what's connected, the questions fit to the folder, the page each opens or
/// the text it copies, and the confirmation. The popover is driven offscreen on the Mac.
@MainActor @Suite(.serialized) struct AskAITests {
    static func oauth(_ host: String) -> Connection {
        Connection(id: UUID(), name: host, kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: host)
    }
    static func token(_ name: String, revoked: Bool = false) -> Connection {
        Connection(id: UUID(), name: name, kind: "token", created_at: .now, last_used_at: nil, revoked_at: revoked ? .now : nil, redirect_host: nil)
    }
    static let chatgpt = oauth("chatgpt.com")
    static let claude = oauth("claude.ai")

    @Test func theMenuOffersEachConnectedAIOnceAndNothingWithoutOne() {
        #expect(AskAI.targets([]).isEmpty, "hidden when no AI is connected")
        #expect(AskAI.targets([Self.token("Codex", revoked: true)]).isEmpty, "a disconnected AI isn't offered")
        // An app Pinto can't vouch for, or a bare access token, has no mark: not offered.
        #expect(AskAI.targets([Self.oauth("glama.ai"), Self.token("Access token")]).isEmpty)
        // Two ChatGPT accounts are one ChatGPT; the two whose page opens come first.
        let t = AskAI.targets([Self.token("Codex"), Self.chatgpt, Self.oauth("chatgpt.com"), Self.claude, Self.token("Claude Code")])
        #expect(t.map(\.ai) == ["ChatGPT", "Claude", "Claude Code", "Codex"])
        #expect(t.map(\.opensPage) == [true, true, false, false])
    }

    @Test func oneAIIsOneItemSeveralAreASubmenu() {
        let running = AskAI.Subject.folder("Running")
        let gpt = AskAI.Target(ai: "ChatGPT")
        #expect(AskAI.title(gpt, running) == "Ask ChatGPT About \u{201C}Running\u{201D}\u{2026}")
        #expect(AskAI.title(gpt, .all) == "Ask ChatGPT About Your Notes\u{2026}")
        #expect(AskAI.submenuTitle(running) == "Ask an AI About \u{201C}Running\u{201D}")
        #expect(AskAI.submenuItem(AskAI.Target(ai: "Claude Code")) == "Claude Code\u{2026}")
        #expect(AskAI.heading(gpt, running) == "Ask ChatGPT about \u{201C}Running\u{201D}")
    }

    @Test func theQuestionsAreFitToTheFolderAndNameIt() {
        let qs = AskAI.questions(.folder("Running"))
        #expect(qs.map(\.title) == ["Check my week against it", "Summarize this week", "Make a list from it"])
        for q in qs {
            #expect(q.prompt.hasPrefix("In Pinto Notes, read my folder \u{201C}Running\u{201D}"), "\(q.prompt)")
            #expect(!q.prompt.contains("\u{2014}"), "no em dashes")
        }
        #expect(AskAI.questions(.all).map(\.title) == ["Check my week", "Summarize this week", "Make a list from them"])
        #expect(AskAI.questions(.all).allSatisfy { $0.prompt.hasPrefix("In Pinto Notes,") })
        #expect(AskAI.own("  how far did I run?  ", .folder("Running")) == "In Pinto Notes, read my folder \u{201C}Running\u{201D}. how far did I run?")
        #expect(AskAI.own("   ", .folder("Running")) == nil, "nothing typed, nothing to ask")
    }

    /// Round 1 of the councils: every folder asked about its week, even one nobody touched in
    /// months. The week questions come only when something in it changed in the last seven days.
    @Test func aFolderAsksAboutTheWeekOnlyWhenItChangedThisWeek() throws {
        #expect(AskAI.questions(.folder("Recipes"), recent: false).map(\.title) == ["Summarize it", "Make a list from it", "Find what\u{2019}s out of date"])
        #expect(AskAI.questions(.all, recent: false).map(\.title) == ["Find what\u{2019}s unfinished", "Make a list from them"])
        for q in AskAI.questions(.folder("Recipes"), recent: false) + AskAI.questions(.all, recent: false) {
            #expect(!q.title.localizedCaseInsensitiveContains("week") && !q.prompt.localizedCaseInsensitiveContains("week"), "\(q.prompt)")
        }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let recipes = Folder(name: "Recipes")
        ctx.insert(recipes)
        let old = ctx.createNote(in: .folder(recipes.id), body: "Soup\n\nLeeks")
        old.updatedAt = .now.addingTimeInterval(-30 * 24 * 3600)
        #expect(!AskAI.recent(recipes), "nothing this week")
        #expect(!AskAI.recent(in: ctx))
        let inside = Folder(name: "Soups")
        inside.parent = recipes
        ctx.insert(inside)
        _ = ctx.createNote(in: .folder(inside.id), body: "Pho\n\nBroth first")
        #expect(AskAI.recent(recipes), "a note in a folder inside it changed today")
        #expect(AskAI.recent(in: ctx))
    }

    /// Ask about this note (round 2 of the councils): questions fit to what the note holds.
    @Test func aNoteGetsQuestionsForWhatItHolds() {
        let plan = AskAI.NoteAbout(body: "Week plan\n\n- [ ] Run Tuesday\n- [x] Dentist", folder: "Running")
        #expect(plan.title == "Week plan" && plan.plan && !plan.table)
        #expect(AskAI.questions(.note(plan)).map(\.title) == ["Check my progress", "Update this plan", "Find related notes"])
        let progress = AskAI.questions(.note(plan))[0].prompt
        #expect(progress.hasPrefix("In Pinto Notes, read my note \u{201C}Week plan\u{201D} in \u{201C}Running\u{201D} and check my progress"), "\(progress)")
        #expect(AskAI.questions(.note(plan))[1].prompt.contains("update the plan in that note"), "the same note, not a new one")
        // A plan by its title, with no ticks yet.
        #expect(AskAI.NoteAbout(body: "# Trip plan\n\nLisbon in May", folder: nil).plan)
        #expect(!AskAI.NoteAbout(body: "Planet facts\n\nMars is red", folder: nil).plan, "a word, not a part of one")
        let runs = AskAI.NoteAbout(body: "Runs\n\n| Date | km |\n| --- | --- |\n| Mon | 5 |", folder: nil)
        #expect(runs.table && !runs.plan)
        #expect(AskAI.questions(.note(runs)).map(\.title) == ["Make this a tracker", "Find related notes"])
        #expect(AskAI.questions(.note(runs))[0].prompt.contains("tracker: give each column a type, keep every row"))
        let text = AskAI.NoteAbout(body: "Photosynthesis\n\nPlants turn light into sugar.", folder: "Biology")
        #expect(AskAI.questions(.note(text)).map(\.title) == ["Make flashcards from this", "Find related notes"])
        #expect(AskAI.questions(.note(text))[0].prompt.contains("a new note called \u{201C}Photosynthesis flashcards\u{201D}"))
        // A plan with a table: three at most.
        let both = AskAI.NoteAbout(body: "Training plan\n\n- [ ] Long run\n\n| Week | km |\n|---|---|\n| 1 | 20 |", folder: nil)
        #expect(AskAI.questions(.note(both)).map(\.title) == ["Check my progress", "Update this plan", "Make this a tracker"])
        // No week questions for a note, whatever changed.
        #expect(AskAI.questions(.note(text), recent: true).allSatisfy { !$0.title.contains("week") })
        for q in AskAI.questions(.note(plan)) + AskAI.questions(.note(runs)) + AskAI.questions(.note(text)) {
            #expect(q.prompt.hasPrefix("In Pinto Notes, read my note"), "\(q.prompt)")
            #expect(!q.prompt.contains("\u{2014}"), "no em dashes")
        }
        #expect(AskAI.own("what's left?", .note(plan)) == "In Pinto Notes, read my note \u{201C}Week plan\u{201D} in \u{201C}Running\u{201D}. what's left?")
    }

    @Test func theNoteMenuAndToolbarSayThisNote() throws {
        let gpt = AskAI.Target(ai: "ChatGPT")
        let note = AskAI.Subject.note(.init(title: "Week plan"))
        #expect(AskAI.title(gpt, note) == "Ask ChatGPT About This Note\u{2026}")
        #expect(AskAI.submenuTitle(note) == "Ask an AI About This Note")
        #expect(AskAI.heading(gpt, note) == "Ask ChatGPT about \u{201C}Week plan\u{201D}")
        // The ••• menu: a group of its own above Delete, only when an AI can read the note.
        let groups = NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: false, appsEnabled: true, phone: false, dev: false, asks: true)
        #expect(groups.suffix(2) == [[.askAI], [.delete]])
        #expect(!NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: false, appsEnabled: true, phone: false, dev: false).joined().contains(.askAI))
        #expect(!NoteMoreMenu.groups(locked: true, vaultOpen: true, trashed: false, hasApp: false, appsEnabled: true, phone: false, dev: false, asks: true).joined().contains(.askAI), "an AI can't read a locked note")
        #expect(NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: true, hasApp: false, appsEnabled: true, asks: true) == [[.recover, .delete]])
        // Which notes: not locked, deleted or untitled.
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let n = c.mainContext.createNote(in: .all, body: "Week plan\n\n- [ ] Run")
        #expect(AskAI.asks(about: n))
        #expect(AskAI.subject(n) == .note(.init(title: "Week plan", folder: n.folder?.name, plan: true, table: false)))
        let blank = c.mainContext.createNote(in: .all, body: "")
        #expect(!AskAI.asks(about: blank), "nothing to find it by")
        n.trashedAt = .now
        #expect(!AskAI.asks(about: n))
    }

    @Test func chatGPTAndClaudeOpenWithItTypedInTheRestCopy() throws {
        let prompt = AskAI.questions(.folder("Running"))[1].prompt
        let gpt = try #require(AskAI.page(AskAI.Target(ai: "ChatGPT"), prompt: prompt))
        #expect(gpt.host == "chatgpt.com" && URLComponents(url: gpt, resolvingAgainstBaseURL: false)?.queryItems?.first?.value == prompt)
        let claude = try #require(AskAI.page(AskAI.Target(ai: "Claude"), prompt: prompt))
        #expect(claude.absoluteString.hasPrefix("https://claude.ai/new?q="))
        #expect(AskAI.page(AskAI.Target(ai: "Codex"), prompt: prompt) == nil)
        #expect(AskAI.done(AskAI.Target(ai: "ChatGPT")) == "Opened in ChatGPT")
        #expect(AskAI.done(AskAI.Target(ai: "Codex")) == "Copied. Paste it into Codex.")
        #expect(AskAI.how(AskAI.Target(ai: "Claude")) == "Opens Claude with it typed in. It\u{2019}s copied too.")
    }

    /// The list's ••• menu: about the folder, or every note; not in Recently Deleted or a tag.
    @Test func theListMenuAsksAboutItsFolder() {
        let id = UUID()
        let name: (UUID) -> String? = { $0 == id ? "Running" : nil }
        #expect(ListMoreMenu.askSubject(.folder(id), folderName: name) == .folder("Running"))
        #expect(ListMoreMenu.askSubject(.all, folderName: name) == .all)
        #expect(ListMoreMenu.askSubject(.trash, folderName: name) == nil)
        #expect(ListMoreMenu.askSubject(.tag("work"), folderName: name) == nil)
        #expect(ListMoreMenu.groups(asks: true) == [[.selectNotes], [.sortBy, .groupByDate], [.addFiles], [.askAI]])
        #expect(!ListMoreMenu.groups().joined().contains(.askAI), "not offered when no AI is connected")
    }

    @Test func settingsListsKeepWhatIsOfferedCurrent() {
        let kept = ConnectedAIs.shared.connections
        defer { ConnectedAIs.shared.set(kept) }
        ConnectedAIs.shared.set([Self.chatgpt, Self.token("Codex", revoked: true)])
        #expect(ConnectedAIs.shared.targets.map(\.ai) == ["ChatGPT"])
        ConnectedAIs.shared.set([])
        #expect(ConnectedAIs.shared.targets.isEmpty)
    }

    #if os(macOS)
    /// Picking a question opens ChatGPT with it, copies it, says "Opened in ChatGPT" and closes.
    /// Pressed through accessibility, in a window far off the screen.
    @Test func pickingAQuestionOpensTheAIAndSaysSo() async throws {
        var opened: [URL] = [], copied: [String] = [], closed = 0
        let popover = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .folder("Running"),
                                   open: { opened.append($0) }, copy: { copied.append($0) }, close: { closed += 1 })
        let ax = OffscreenAX(popover, size: CGSize(width: AskAIPopover.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        for id in ["week", "summary", "list"] { #expect(ax.find("ask.question.\(id)") != nil, "\(id): \(ax.ids())") }
        #expect(ax.find("ask.own") != nil, "Write your own")
        #expect(ax.find("ask.done") == nil)
        let summary = try #require(ax.find("ask.question.summary"))
        #expect(summary.text.contains("Summarize this week"), "\(summary.text)")
        #expect(summary.press())
        await ax.settle()
        let prompt = AskAI.questions(.folder("Running"))[1].prompt
        #expect(copied == [prompt])
        #expect(opened == [AskAI.page(AskAI.Target(ai: "ChatGPT"), prompt: prompt)!])
        let done = try #require(ax.find("ask.done"), "Opened in ChatGPT shows: \(ax.ids())")
        #expect(done.text.contains("Opened in ChatGPT"), "\(done.text)")
        // A second press while it says so does nothing more.
        ax.find("ask.question.summary")?.press()
        try? await Task.sleep(for: AskAI.closesAfter(AskAI.Target(ai: "ChatGPT")))
        #expect(closed == 1, "then it closes")
        #expect(copied.count == 1)
    }

    /// Ask about this note: a checklist note's popover offers Check my progress; picking it opens
    /// ChatGPT with the note named, says "Opened in ChatGPT" and closes. Pressed through accessibility.
    @Test func askingAboutANoteOpensTheAIAndSaysSo() async throws {
        var opened: [URL] = [], copied: [String] = [], closed = 0
        let plan = AskAI.Subject.note(AskAI.NoteAbout(body: "Week plan\n\n- [ ] Run Tuesday", folder: "Running"))
        let ax = OffscreenAX(AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: plan,
                                          open: { opened.append($0) }, copy: { copied.append($0) }, close: { closed += 1 }),
                             size: CGSize(width: AskAIPopover.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        for id in ["progress", "update", "related"] { #expect(ax.find("ask.question.\(id)") != nil, "\(id): \(ax.ids())") }
        #expect(ax.find("ask.question.week") == nil, "no week questions for a note")
        let progress = try #require(ax.find("ask.question.progress"))
        #expect(progress.text.contains("Check my progress"), "\(progress.text)")
        #expect(progress.press())
        await ax.settle()
        let prompt = AskAI.questions(plan)[0].prompt
        #expect(copied == [prompt])
        #expect(opened == [AskAI.page(AskAI.Target(ai: "ChatGPT"), prompt: prompt)!])
        #expect(ax.find("ask.done")?.text.contains("Opened in ChatGPT") == true)
        try? await Task.sleep(for: AskAI.closesAfter(AskAI.Target(ai: "ChatGPT")))
        #expect(closed == 1)
    }

    /// The note's toolbar button: one AI is its mark, pressed it asks that AI; several are a menu;
    /// none, nothing.
    @Test func theToolbarButtonAsksTheConnectedAI() async throws {
        var asked: [String] = []
        let one = OffscreenAX(AskAINoteButton(targets: [AskAI.Target(ai: "ChatGPT")]) { asked.append($0.ai) }.padding(10), size: CGSize(width: 120, height: 60))
        defer { one.close() }
        await one.settle()
        let button = try #require(one.find("editor.ask"), "\(one.ids())")
        #expect(button.text.contains("Ask ChatGPT About This Note"), "\(button.text)")
        #expect(button.frame.height >= 20, "a real target: \(button.frame)")
        #expect(button.press())
        await one.settle(100)
        #expect(asked == ["ChatGPT"])
        #expect(AskAINoteButton.mark("ChatGPT") != nil && AskAINoteButton.mark("Some app") == nil)
        let none = OffscreenAX(AskAINoteButton(targets: []) { _ in }.padding(10), size: CGSize(width: 120, height: 60))
        defer { none.close() }
        await none.settle()
        #expect(none.find("editor.ask") == nil)
    }

    /// Codex has no page to open: the question is copied, and the line says to paste it.
    @Test func codexGetsItCopied() async throws {
        var opened: [URL] = [], copied: [String] = []
        let ax = OffscreenAX(AskAIPopover(target: AskAI.Target(ai: "Codex"), subject: .all,
                                          open: { opened.append($0) }, copy: { copied.append($0) }),
                             size: CGSize(width: AskAIPopover.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        #expect(try #require(ax.find("ask.question.week"), "\(ax.ids())").press())
        await ax.settle()
        #expect(opened.isEmpty)
        #expect(copied == [AskAI.questions(.all)[0].prompt])
        #expect(ax.find("ask.done")?.text.contains("Copied. Paste it into Codex.") == true)
    }
    #endif
}
