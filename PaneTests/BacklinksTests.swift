import Foundation
import SwiftData
import Testing
@testable import Pane

/// The foot of a note, as Obsidian's backlinks: the notes that link here with the lines they link
/// on, the notes that mention it without a link (and Link, which makes one, with Undo), and the
/// headings `[[Note#` offers.
@MainActor @Suite(.serialized) struct BacklinksTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    func marked(_ line: LinkLine) -> [String] { line.marks.map { (line.text as NSString).substring(with: $0) } }

    // MARK: Lines

    /// A line reads as text: list marks, headings and emphasis out of sight, links as their text,
    /// the one that links here marked.
    @Test func aLineReadsAsTextWithItsLinkMarked() {
        let body = "Trip\n- [ ] Book **the flat** near [[Kitchen remodel|the kitchen]] and [[Lisbon]]\n## Later"
        let at = (body as NSString).range(of: "[[Kitchen remodel|the kitchen]]")
        let line = LinkSnippets.lines(body, spots: [at])[0]
        #expect(line.text == "Book the flat near the kitchen and Lisbon")
        #expect(marked(line) == ["the kitchen"])
        #expect(line.location == at.location, "opening it goes to the link")

        let heading = LinkSnippets.lines("T\n### See [[A]] `code`", spots: [("T\n### See [[A]] `code`" as NSString).range(of: "[[A]]")])[0]
        #expect(heading.text == "See A code" && marked(heading) == ["A"])
        let mdLink = "T\n> Read [the plan](pane-note:abc) today"
        let ml = LinkSnippets.lines(mdLink, spots: [(mdLink as NSString).range(of: "[the plan](pane-note:abc)")])[0]
        #expect(ml.text == "Read the plan today" && marked(ml) == ["the plan"])
    }

    /// A long line is cut around its link, at a word, with an ellipsis on the cut sides.
    @Test func aLongLineIsCutAroundItsLink() {
        let words = (0..<60).map { "word\($0)" }.joined(separator: " ")
        let body = "T\n\(words) [[Target]] \(words)"
        let line = LinkSnippets.lines(body, spots: [(body as NSString).range(of: "[[Target]]")])[0]
        #expect((line.text as NSString).length <= LinkSnippets.maxLength + 2)
        #expect(line.text.hasPrefix("\u{2026}word") && line.text.hasSuffix("\u{2026}"))
        #expect(marked(line) == ["Target"])
    }

    /// Two links on one line make one entry with both marked; a note shows at most five lines.
    @Test func linksOnOneLineAreOneEntry() {
        let body = "T\n[[A]] and [[A|again]]\n" + (0..<8).map { "line \($0) [[A]]" }.joined(separator: "\n")
        let ns = body as NSString
        let spots = WikiLinks.links(in: body).map(\.range)
        let lines = LinkSnippets.lines(body, spots: spots)
        #expect(lines.count == LinkSnippets.maxLines)
        #expect(lines[0].text == "A and again" && marked(lines[0]) == ["A", "again"])
        #expect(ns.substring(with: lines[1].spots[0]) == "[[A]]")
    }

    // MARK: Linked from

    /// The notes that link here, with their lines; a link by the same title to the other note
    /// of that name (nearer the linking note) isn't one, and a note link is.
    @Test func linkingNotesWithTheirLines() throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let work = context.createFolder(named: "Work"), home = context.createFolder(named: "Home")
        let index = context.createNote(in: .folder(work.id), body: "Index\nwork")
        _ = context.createNote(in: .folder(home.id), body: "Index\nhome")
        let plan = context.createNote(in: .folder(work.id), body: "Plan\nFirst [[Index]] here.\nnothing\nThen [[Work/Index#Top|the top]].")
        _ = context.createNote(in: .folder(home.id), body: "Chores\nSee [[Index]].")
        let byLink = context.createNote(in: .folder(home.id), body: "Shopping\nAsk [the index](pane-note:\(index.id.uuidString.lowercased())) first")
        byLink.updatedAt = .now.addingTimeInterval(-60)
        try context.save()
        WikiDirectory.invalidate()

        let found = context.linkingNotes(to: index)
        #expect(found.total == 2)
        #expect(found.notes.map(\.id) == [plan.id, byLink.id])
        #expect(found.notes[0].lines.map(\.text) == ["First Index here.", "Then the top."])
        #expect(found.notes[0].lines.map(marked) == [["Index"], ["the top"]])
        #expect(found.notes[1].lines.map(\.text) == ["Ask the index first"])
        #expect(found.notes[0].folders == ["Work"])

        // Saved without the link: gone, note by note, without the library read again.
        plan.body = "Plan\nno links now"
        try context.save()
        #expect(context.linkingNotes(to: index).notes.map(\.id) == [byLink.id])
        // Renamed: the links follow it, and so does Linked from.
        index.body = "Work index\nwork"
        plan.body = "Plan\nback to [[Index]]"
        try context.save()
        context.retargetWikiLinks(to: index, renamedFrom: "Index")
        #expect(plan.body == "Plan\nback to [[Work index]]")
        #expect(Set(context.linkingNotes(to: index).notes.map(\.id)) == [plan.id, byLink.id])
    }

    /// The link index finds the notes that link by a name without resolving every link: kept as
    /// each note's links change, a link's whole target counted too (a title with a slash).
    @Test func theLinkGraphFollowsEachNote() {
        let a = UUID(), b = UUID(), target = UUID()
        var g = LinkGraph()
        let links = { (t: [String], n: Set<UUID>) in OutgoingLinks(wikiTargets: t, noteLinks: n, folders: []) }
        g[a] = links(["Kitchen", "Q1/Q2 plan"], [])
        g[b] = links(["Projects/kitchen"], [target])
        #expect(g.linking(named: "kitchen") == [a, b])
        #expect(g.linking(named: "q1/q2 plan") == [a])
        #expect(g.linking(note: target) == [b])
        g[b] = nil
        #expect(g.linking(named: "kitchen") == [a] && g.linking(note: target).isEmpty)
        g[a] = links(["Other"], [])
        #expect(g.linking(named: "kitchen").isEmpty && g.count == 1)
    }

    // MARK: Unlinked mentions

    /// A mention is the title (or an alias) as words of their own, case and accents aside, and
    /// never inside a link, code, an address, or the note's own title line.
    @Test func mentionsAreWholeWordsOutsideLinksAndCode() {
        let body = """
        Kitchen remodel budget
        The kitchen remodel starts in May. Kitchen remodeling isn't it, nor [[Kitchen remodel]].
        `kitchen remodel` and [the Kitchen Remodel](https://x.y) and https://x.y/kitchen-remodel
        ```
        kitchen remodel
        ```
        Done: KITCHEN REMODEL.
        """
        let found = Mentions.find(["Kitchen remodel"], in: body).map { (body as NSString).substring(with: $0) }
        #expect(found == ["kitchen remodel", "KITCHEN REMODEL"])
        #expect(Mentions.find(["Café"], in: "Notes\nat the cafe today").count == 1, "accents aside")
        #expect(Mentions.find(["Go"], in: "T\ngo go go").isEmpty == false)
        #expect(Mentions.names(title: "Go", frontMatter: nil).isEmpty, "names shorter than three letters aren't looked for")
        #expect(Mentions.names(title: "Kitchen remodel", frontMatter: "aliases:\n  - Reno\n  - kitchen remodel\nsource: x") == ["Kitchen remodel", "Reno"])
    }

    /// The search runs on a context of its own, finds the notes that mention the title or an
    /// alias, newest first, and leaves out this note, locked and deleted ones.
    @Test func mentionsAreFoundOffTheMainThread() async throws {
        let c = try Self.container()
        let context = c.mainContext
        let reno = context.createNote(in: .all, body: "Kitchen remodel\nthe plan")
        reno.frontMatter = "aliases: [Reno]"
        let old = context.createNote(in: .all, body: "Budget\nMoney for the kitchen remodel.")
        old.updatedAt = .now.addingTimeInterval(-100)
        let new = context.createNote(in: .all, body: "Week\nCall about the reno, then [[Kitchen remodel]].")
        let locked = context.createNote(in: .all, body: "Diary\nkitchen remodel")
        locked.lockedBody = "sealed"
        let trashed = context.createNote(in: .all, body: "Old\nkitchen remodel")
        trashed.trashedAt = .now
        _ = context.createNote(in: .all, body: "Other\nkitchens and remodels")
        try context.save()

        let names = Mentions.names(title: reno.title, frontMatter: reno.frontMatter)
        let id = reno.id
        let found = await Task.detached { Mentions.search(names, excluding: id, container: c) }.value
        #expect(found.notes.map(\.id) == [new.id, old.id])
        #expect(found.notes[0].lines.map(marked) == [["reno"]], "the alias, and not the link")
        #expect(found.notes[1].lines.map(\.text) == ["Money for the kitchen remodel."])
        #expect(!found.more)
    }

    /// Link makes the mention a link (as written: `[[Title]]`, or `[[Title|as written]]` for an
    /// alias or other capitals), qualified by folder when the title alone leads elsewhere from
    /// there. Undo puts the text back, unless the note changed since.
    @Test func linkTurnsAMentionIntoALinkAndUndoPutsItBack() throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let work = context.createFolder(named: "Work"), home = context.createFolder(named: "Home")
        let reno = context.createNote(in: .folder(work.id), body: "Kitchen remodel\nplan")
        _ = context.createNote(in: .folder(home.id), body: "Kitchen remodel\nthe other one")
        let week = context.createNote(in: .folder(work.id), body: "Week\nStart the Kitchen remodel. Then the kitchen remodel again.")
        let chores = context.createNote(in: .folder(home.id), body: "Chores\nAsk about the Kitchen remodel")
        try context.save()
        WikiDirectory.invalidate()
        let ns = week.body as NSString
        let first = ns.range(of: "Kitchen remodel", options: [], range: NSRange(location: 5, length: ns.length - 5))
        let second = ns.range(of: "kitchen remodel")

        let done = try #require(context.linkMentions(of: reno, in: week, at: [first, second]))
        #expect(week.body == "Week\nStart the [[Kitchen remodel]]. Then the [[Kitchen remodel|kitchen remodel]] again.")
        #expect(week.dirty)
        WikiDirectory.invalidate()
        #expect(context.backlinks(to: reno).map(\.id) == [week.id], "it links here now")
        #expect(Mentions.find(["Kitchen remodel"], in: week.body).isEmpty)

        // From Home, the title alone is Home's own Kitchen remodel: the link names the folder.
        let spot = (chores.body as NSString).range(of: "Kitchen remodel")
        #expect(context.linkMentions(of: reno, in: chores, at: [spot]) != nil)
        #expect(chores.body == "Chores\nAsk about the [[Work/Kitchen remodel|Kitchen remodel]]")
        WikiDirectory.invalidate()
        #expect(context.resolveWikiLink("Work/Kitchen remodel", from: chores)?.id == reno.id)

        #expect(context.undoLinkMentions(in: week, before: done.before, after: done.after))
        #expect(week.body == done.before)
        // A spot that isn't a mention any more does nothing.
        #expect(context.linkMentions(of: reno, in: week, at: [NSRange(location: 0, length: 4)]) == nil)
        // Changed since: Undo leaves it.
        week.body += " more"
        #expect(!context.undoLinkMentions(in: week, before: "x", after: done.after))
    }

    /// The model behind the section: Link takes the line off the mentions at once and offers
    /// Undo, which brings it back.
    @Test func theSectionsLinkAndUndo() async throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let reno = context.createNote(in: .all, body: "Kitchen remodel\nplan")
        let week = context.createNote(in: .all, body: "Week\nStart the kitchen remodel.\nAnd [[Kitchen remodel]].")
        try context.save()
        WikiDirectory.invalidate()
        let links = NoteLinks()
        links.refresh(context.backlinks(to: reno), note: reno, context: context)
        links.findMentions(reno, context: context)
        await links.mentionsSettled()
        #expect(links.linked.map(\.id) == [week.id] && links.linkedTotal == 1)
        #expect(links.mentions.map(\.id) == [week.id])
        let line = try #require(links.mentions.first?.lines.first)
        #expect(line.text == "Start the kitchen remodel.")

        let l = try #require(links.link(line, in: links.mentions[0]))
        #expect(week.body == "Week\nStart the [[Kitchen remodel|kitchen remodel]].\nAnd [[Kitchen remodel]].")
        #expect(links.mentions.isEmpty && links.lastLinked == l)
        links.refresh(context.backlinks(to: reno), note: reno, context: context)
        #expect(links.linked.first?.lines.count == 2, "it's a linked line now")

        links.undo(l)
        await links.mentionsSettled()
        #expect(week.body == "Week\nStart the kitchen remodel.\nAnd [[Kitchen remodel]].")
        #expect(links.lastLinked == nil)
        #expect(links.mentions.first?.lines.map(\.text) == ["Start the kitchen remodel."])
    }

    // MARK: Headings

    /// `[[Note#` offers the note's headings: outside code, never its title line, those starting
    /// with what's typed first.
    @Test func headingsAreOfferedAfterTheHash() throws {
        let body = "# Budget\nintro\n## October\n```\n# not a heading\n```\n### Next year\n## Old october numbers\n#hashtag"
        #expect(WikiLinks.headings(in: body) == ["October", "Next year", "Old october numbers"])
        #expect(WikiDirectory.headingSuggestions("oct", in: body) == ["October", "Old october numbers"])
        #expect(WikiDirectory.headingSuggestions("", in: body).count == 3)

        func typing(_ text: String) -> (String, String)? {
            WikiLinks.typingHeading(in: text, caret: (text as NSString).length).map { ($0.target, (text as NSString).substring(with: $0.query)) }
        }
        #expect(typing("See [[Budget#Oct").map { [$0.0, $0.1] } == ["Budget", "Oct"])
        #expect(typing("See [[Work/Budget#").map { [$0.0, $0.1] } == ["Work/Budget", ""])
        #expect(typing("See [[Budget#Oct|x") == nil, "not in an alias")
        #expect(typing("See [[#Oct") == nil, "a heading of this note has no note to look in")
        #expect(typing("See [[Budget]] #Oct") == nil)

        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let budget = context.createNote(in: .all, body: "Budget\n## October\n## November")
        let plan = context.createNote(in: .all, body: "Plan\n")
        let locked = context.createNote(in: .all, body: "Secret\n## Inside")
        locked.lockedBody = "sealed"
        try context.save()
        WikiDirectory.invalidate()
        #expect(WikiDirectory.headingSuggestions("", target: "budget", from: plan, in: context) == ["October", "November"])
        #expect(WikiDirectory.headingSuggestions("", target: "Secret", from: plan, in: context).isEmpty)
        #expect(WikiDirectory.headingSuggestions("", target: "Nowhere", from: plan, in: context).isEmpty)
        _ = budget
    }
}
