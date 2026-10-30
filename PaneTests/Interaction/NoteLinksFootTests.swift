#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The foot of a note in the real Mac editor: "Linked from" and "Unlinked mentions" under the last
/// line, scrolling with the text; a line opens its note at the link; Link makes a mention a link;
/// each part folds away; and `[[Note#` offers that note's headings as you type.
@MainActor @Suite(.serialized) struct NoteLinksFootTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    /// A library where three notes link to Lisbon (one twice) and one mentions it.
    @MainActor struct Library {
        let container: ModelContainer
        let lisbon: Note
        let weekend: Note
        let packing: Note
        let documents: Note
        let links: NoteLinks
    }

    static func library() async throws -> Library {
        let c = try container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let travel = context.createFolder(named: "Travel")
        let lisbon = context.createNote(in: .folder(travel.id), body: "Lisbon\n\nFour days of tiles, trams and pastries in May.\n\n## Food\nPastel de nata at Manteigaria.")
        let weekend = context.createNote(in: .folder(travel.id), body: "Weekend plans\n\n- [ ] Flights for [[Lisbon]] on Thursday\n- [ ] Ask Sara about [[Lisbon#Food|where to eat]]")
        let packing = context.createNote(in: .folder(travel.id), body: "Packing\n\nRain jacket and good shoes for **[[Lisbon]]**, the hills are real.")
        packing.updatedAt = .now.addingTimeInterval(-3600)
        let documents = context.createNote(in: .folder(travel.id), body: "Trip documents\n\nEverything for the Lisbon trip in one place.")
        documents.updatedAt = .now.addingTimeInterval(-7200)
        try context.save()
        WikiDirectory.invalidate()
        let lib = Library(container: c, lisbon: lisbon, weekend: weekend, packing: packing, documents: documents, links: NoteLinks())
        lib.links.refresh(context.backlinkIDs(to: lisbon), note: lisbon, context: context)
        lib.links.findMentions(lisbon, context: context)
        await lib.links.mentionsSettled()
        return lib
    }

    /// Clicks down the foot, `step` points at a time from `from` (points below its top), at `x`
    /// (from its left; negative: from its right), until `done` or its foot. A click lands where a
    /// person's would: the window routes it to the SwiftUI button under it.
    /// SwiftUI's buttons take clicks only in a window in front of an active app: on CI only
    /// (FileRowClickTests.onCI), never on a developer's Mac. Elsewhere the tests call what each
    /// button calls.
    @discardableResult
    func sweep(_ h: EditorHarness, x: CGFloat, from: CGFloat, step: CGFloat = 4, done: () -> Bool) async -> Bool {
        guard let foot = h.view.footFrame else { return false }
        NSApp.activate(ignoringOtherApps: true)
        h.window.makeKeyAndOrderFront(nil)
        await h.settle(0.3)
        var y = foot.minY + from
        while y < foot.maxY {
            await h.clickRouted(CGPoint(x: x >= 0 ? foot.minX + x : foot.maxX + x, y: y))
            if done() { return true }
            y += step
        }
        return false
    }

    func setUp(_ lib: Library, dark: Bool = false) async -> EditorHarness {
        UserDefaults.standard.removeObject(forKey: "noteLinks.linkedShown")
        UserDefaults.standard.removeObject(forKey: "noteLinks.mentionsShown")
        let h = await EditorHarness(lib.lisbon.body, dark: dark, focus: false)
        h.view.setFoot(lib.links)
        _ = await h.until { lib.links.height > 0 }
        await h.settle(0.1)
        return h
    }

    /// Under the last line, the text where it was, the view taller by the foot; typing a line
    /// moves it down by that line.
    @Test func theFootSitsUnderTheLastLine() async throws {
        let lib = try await Self.library()
        let before = await EditorHarness(lib.lisbon.body, focus: false)
        let firstLine = before.lineRect(at: 0)
        let plainHeight = before.view.frame.height
        before.close()

        let h = await setUp(lib)
        defer { h.close() }
        #expect(lib.links.linked.map(\.id) == [lib.weekend.id, lib.packing.id])
        #expect(lib.links.mentions.map(\.id) == [lib.documents.id])
        let foot = try #require(h.view.footFrame)
        let last = h.lineRect(at: (h.text as NSString).length - 1)
        #expect(abs(foot.minY - (last.maxY + EditorFoot.gap)) < 1, "36 pt under the last line: \(foot) after \(last)")
        #expect(abs(h.lineRect(at: 0).minY - firstLine.minY) < 0.5, "the text doesn't move")
        #expect(abs(foot.height - lib.links.height) < 0.5 && foot.height > 100)
        #expect(h.view.frame.height >= foot.maxY, "the view makes room for it: \(h.view.frame.height) for \(foot)")
        #expect(h.view.frame.height > plainHeight || plainHeight >= foot.maxY)
        #expect(abs(foot.minX - h.view.textContainerOrigin.x) < 0.5, "lined up with the text")
        await h.snapshot("note-links-light")

        await h.select((h.text as NSString).length)
        await h.type("\nOne more line")
        let moved = try #require(h.view.footFrame)
        let lastNow = h.lineRect(at: (h.text as NSString).length - 1)
        #expect(abs(moved.minY - (lastNow.maxY + EditorFoot.gap)) < 1)
        #expect(moved.minY > foot.minY + 10, "a new line moves it down")
    }

    /// The lines read as text, with the link marked; a line opens its note at that link.
    @Test func aLineOpensItsNoteAtTheLink() async throws {
        let lib = try await Self.library()
        let h = await setUp(lib)
        defer { h.close() }
        let weekend = try #require(lib.links.linked.first)
        #expect(weekend.lines.map(\.text) == ["Flights for Lisbon on Thursday", "Ask Sara about where to eat"])
        #expect(lib.links.linked[1].lines.map(\.text) == ["Rain jacket and good shoes for Lisbon, the hills are real."])
        let first = (lib.weekend.body as NSString).range(of: "[[Lisbon]]").location
        let at = (lib.weekend.body as NSString).range(of: "[[Lisbon#Food|where to eat]]").location
        let packing = (lib.packing.body as NSString).range(of: "[[Lisbon]]").location
        // The title opens the note at its first link, each line at its own.
        #expect(weekend.lines.map(\.location) == [first, at])
        #expect(lib.links.linked[1].lines.map(\.location) == [packing])
        if FileRowClickTests.onCI {
            var opened: [(UUID, Int)] = []
            lib.links.open = { id, at in if opened.last.map({ $0 != (id, at) }) ?? true { opened.append((id, at)) } }
            // Below the header (a click there folds it), down every card.
            await sweep(h, x: 60, from: 30, step: 3) { opened.count >= 3 }
            #expect(opened.map(\.0) == [lib.weekend.id, lib.weekend.id, lib.packing.id])
            #expect(opened.map(\.1) == [first, at, packing], "the title and each line open the note at their link, in order")
        }

        // Where it lands: LinkLanding hands the place to the note that opens, once.
        LinkLanding.shared.request(lib.weekend.id, location: at)
        #expect(LinkLanding.shared.take(lib.weekend.id) == nil, "not a heading")
        #expect(LinkLanding.shared.takeLocation(lib.weekend.id) == at)
        #expect(LinkLanding.shared.takeLocation(lib.weekend.id) == nil)
    }

    /// Mentions start folded and stay as they were left; Linked from folds too. Folding gives the
    /// room back.
    @Test func eachPartFoldsAndIsRemembered() async throws {
        let lib = try await Self.library()
        let h = await setUp(lib)
        defer { h.close() }
        let open = lib.links.height
        // Mentions start folded; shown as left (here, as the defaults say).
        UserDefaults.standard.set(true, forKey: "noteLinks.mentionsShown")
        _ = await h.until { lib.links.height > open + 20 }
        #expect(lib.links.height > open + 20, "mentions open")
        let both = lib.links.height
        let viewHeight = h.view.frame.height
        // A click on "Linked from 2 notes" folds it (on CI; here, as its button does), and that's remembered.
        if FileRowClickTests.onCI {
            NSApp.activate(ignoringOtherApps: true)
            h.window.makeKeyAndOrderFront(nil)
            await h.settle(0.3)
            await h.clickRouted(CGPoint(x: (h.view.footFrame?.minX ?? 0) + 30, y: (h.view.footFrame?.minY ?? 0) + 12))
        } else {
            UserDefaults.standard.set(false, forKey: "noteLinks.linkedShown")
        }
        _ = await h.until { lib.links.height < both - 40 }
        #expect(lib.links.height < both - 40, "Linked from folded: \(lib.links.height) of \(both)")
        #expect(UserDefaults.standard.object(forKey: "noteLinks.linkedShown") as? Bool == false)
        await h.settle(0.1)
        #expect(h.view.frame.height < viewHeight || viewHeight <= h.scroll.contentView.bounds.height, "the room comes back")
        #expect(abs((h.view.footFrame?.height ?? 0) - lib.links.height) < 0.5)
        await h.snapshot("note-links-folded-light")
        UserDefaults.standard.set(true, forKey: "noteLinks.linkedShown")
        _ = await h.until { lib.links.height > both - 1 }
        #expect(abs(lib.links.height - both) < 0.5)
        UserDefaults.standard.removeObject(forKey: "noteLinks.mentionsShown")
    }

    /// Link (one press) makes the mention a link; the note moves to Linked from as its save comes
    /// through; Undo puts the text back.
    @Test func linkAndUndoFromTheFoot() async throws {
        let lib = try await Self.library()
        UserDefaults.standard.set(true, forKey: "noteLinks.mentionsShown")
        let h = await EditorHarness(lib.lisbon.body, focus: false)
        defer { h.close(); UserDefaults.standard.removeObject(forKey: "noteLinks.mentionsShown") }
        h.view.setFoot(lib.links)
        _ = await h.until { lib.links.height > 0 }
        // Link sits at the right of the mention's line (clicked on CI; here, what it calls).
        if FileRowClickTests.onCI {
            let linked = await sweep(h, x: -24, from: 30, step: 3) { lib.documents.body.contains("[[") }
            #expect(linked)
        } else {
            let mention = try #require(lib.links.mentions.first)
            #expect(lib.links.link(mention.lines[0], in: mention) != nil)
        }
        await h.settle(0.1)
        #expect(lib.documents.body == "Trip documents\n\nEverything for the [[Lisbon]] trip in one place.")
        #expect(lib.links.mentions.isEmpty)
        #expect(lib.links.lastLinked?.note == lib.documents.id, "says where, with Undo")
        await h.snapshot("note-links-linked-light")
        let context = lib.container.mainContext
        lib.links.refresh(context.backlinkIDs(to: lib.lisbon), note: lib.lisbon, context: context)
        #expect(lib.links.linked.map(\.id).contains(lib.documents.id))

        // Undo, at the right of "Linked in Trip documents".
        if FileRowClickTests.onCI {
            let undone = await sweep(h, x: -24, from: 30, step: 3) { !lib.documents.body.contains("[[") }
            #expect(undone)
        } else {
            lib.links.undo(try #require(lib.links.lastLinked))
        }
        await lib.links.mentionsSettled()
        await h.settle(0.1)
        #expect(lib.documents.body == "Trip documents\n\nEverything for the Lisbon trip in one place.")
        #expect(lib.links.mentions.map(\.id) == [lib.documents.id])
    }

    /// Nothing links here and nothing mentions it: no foot, no room for one.
    @Test func nothingShowsWhenNothingLinksHere() async throws {
        let lib = try await Self.library()
        let context = lib.container.mainContext
        let alone = context.createNote(in: .all, body: "Quiet note\n\nnothing points here")
        try context.save()
        let links = NoteLinks()
        links.refresh(context.backlinkIDs(to: alone), note: alone, context: context)
        links.findMentions(alone, context: context)
        await links.mentionsSettled()
        #expect(links.isEmpty)
        let plain = await EditorHarness(alone.body, focus: false)
        let plainHeight = plain.view.frame.height
        plain.close()
        let h = await EditorHarness(alone.body, focus: false)
        defer { h.close() }
        h.view.setFoot(links)
        await h.settle(0.2)
        #expect(links.height < 0.5)
        #expect(abs(h.view.frame.height - plainHeight) < 0.5)
    }

    @Test func darkMode() async throws {
        let lib = try await Self.library()
        UserDefaults.standard.set(true, forKey: "noteLinks.mentionsShown")
        defer { UserDefaults.standard.removeObject(forKey: "noteLinks.mentionsShown") }
        let h = await EditorHarness(lib.lisbon.body, dark: true, focus: false)
        defer { h.close() }
        h.view.setFoot(lib.links)
        _ = await h.until { lib.links.height > 0 }
        await h.snapshot("note-links-dark")
    }

    /// `[[Lisbon#` offers Lisbon's headings; Return takes one and closes the link.
    @Test func typingAHashOffersTheNotesHeadings() async throws {
        let h = await EditorHarness("Plan\n")
        defer { h.close() }
        h.controller.suggestTitles = { _ in ["Lisbon"] }
        h.controller.suggestHeadings = { target, typed in
            target == "Lisbon" ? WikiDirectory.headingSuggestions(typed, in: "Lisbon\n## Food\n## Plan\n## Places") : []
        }
        await h.select((h.text as NSString).length)
        await h.type("Eat at [[Lisbon#")
        #expect(h.controller.wikiSuggestions == ["Food", "Plan", "Places"])
        #expect(h.controller.wikiHeadings)
        await h.type("pl")
        #expect(h.controller.wikiSuggestions == ["Plan", "Places"])
        #expect(h.view.subviews.contains { $0 is NSHostingView<WikiSuggestionList> })
        await h.snapshot("wiki-heading-suggestions-light")
        await h.press(EditorHarness.down)
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\nEat at [[Lisbon#Places]]")
        #expect(h.controller.wikiSuggestions.isEmpty && !h.controller.wikiHeadings)

        // Inside a link that's closed already: the brackets aren't doubled.
        await h.type(" and [[Lisbon#]]")
        await h.select((h.text as NSString).length - 2)
        await h.type("F")
        #expect(h.controller.wikiSuggestions == ["Food"])
        await h.press(EditorHarness.returnKey)
        #expect(h.text == "Plan\nEat at [[Lisbon#Places]] and [[Lisbon#Food]]")
    }
}
#endif
