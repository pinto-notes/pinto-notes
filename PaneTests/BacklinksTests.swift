import Foundation
import SwiftData
import Testing
@testable import Pane

/// What links to a note, for Linked From in its ••• menu: only real links (a `[[link]]` or a note
/// link), never the same words as its title; kept up to date as notes are saved, without being
/// looked up again for typing. And the headings `[[Note#` offers.
@MainActor @Suite(.serialized) struct BacklinksTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    // MARK: Linked From

    /// The notes that link here, newest first: a wiki link and a note link do; a link by the same
    /// title to the other note of that name (nearer the linking note) doesn't, and nor do the
    /// title's words written out in another note (Emil, 12 November 2026: a note called To Play
    /// was "mentioned" by every note that said "to play").
    @Test func onlyRealLinksLinkHere() throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let work = context.createFolder(named: "Work"), home = context.createFolder(named: "Home")
        let index = context.createNote(in: .folder(work.id), body: "Index\nwork")
        _ = context.createNote(in: .folder(home.id), body: "Index\nhome")
        let plan = context.createNote(in: .folder(work.id), body: "Plan\nFirst [[Index]] here.\nThen [[Work/Index#Top|the top]].")
        _ = context.createNote(in: .folder(home.id), body: "Chores\nSee [[Index]].")
        let byLink = context.createNote(in: .folder(home.id), body: "Shopping\nAsk [the index](pane-note:\(index.id.uuidString.lowercased())) first")
        byLink.updatedAt = .now.addingTimeInterval(-60)
        _ = context.createNote(in: .folder(work.id), body: "Reading\nThe index of the book, and the Index at the back.")
        try context.save()
        WikiDirectory.invalidate()

        let found = context.linkedFrom(index, limit: 50)
        #expect(found.notes.map(\.id) == [plan.id, byLink.id])
        #expect(found.total == 2)
        #expect(context.linkedFrom(index, limit: 1).notes.map(\.id) == [plan.id])
        #expect(context.linkedFrom(index, limit: 1).total == 2, "the rest are counted, not read")

        // Saved without the link: gone, note by note, without the library read again.
        plan.body = "Plan\nno links now"
        try context.save()
        #expect(context.linkedFrom(index, limit: 50).notes.map(\.id) == [byLink.id])
        // Renamed: the links follow it, and so does Linked From.
        index.body = "Work index\nwork"
        plan.body = "Plan\nback to [[Index]]"
        try context.save()
        context.retargetWikiLinks(to: index, renamedFrom: "Index")
        #expect(plan.body == "Plan\nback to [[Work index]]")
        #expect(Set(context.linkedFrom(index, limit: 50).notes.map(\.id)) == [plan.id, byLink.id])
    }

    /// Linked From is made again only when what links where (or a title) may have changed: a
    /// save of typing that touches neither leaves it, a link added or taken away doesn't.
    @Test func linkedFromIsLookedUpAgainOnlyWhenLinksChange() throws {
        let c = try Self.container()
        let context = c.mainContext
        WikiDirectory.invalidate()
        let lisbon = context.createNote(in: .all, body: "Lisbon\nTiles and trams")
        let weekend = context.createNote(in: .all, body: "Weekend plans\nPack for the trip")
        try context.save()
        WikiDirectory.invalidate()
        #expect(LinkedFromMenu.notes(linkingTo: lisbon, in: context).notes.isEmpty)

        var version = LinkChanges.shared.version
        lisbon.body = "Lisbon\nTiles and trams, and pastries"
        lisbon.touch()
        try context.save()
        weekend.body = "Weekend plans\nPack for the Lisbon trip"
        weekend.touch()
        try context.save()
        #expect(LinkChanges.shared.version == version, "typing, and the title's words written out, change nothing")
        #expect(LinkedFromMenu.notes(linkingTo: lisbon, in: context).notes.isEmpty)

        weekend.body = "Weekend plans\nPack for [[Lisbon]]"
        weekend.touch()
        try context.save()
        #expect(LinkChanges.shared.version != version, "a link added")
        #expect(LinkedFromMenu.notes(linkingTo: lisbon, in: context).notes.map(\.id) == [weekend.id])

        version = LinkChanges.shared.version
        weekend.trashedAt = .now
        try context.save()
        #expect(LinkChanges.shared.version != version, "the linking note deleted")
        #expect(LinkedFromMenu.notes(linkingTo: lisbon, in: context).notes.isEmpty)
        // A locked note, or one in Recently Deleted, lists nothing.
        weekend.trashedAt = nil
        try context.save()
        lisbon.trashedAt = .now
        #expect(LinkedFromMenu.notes(linkingTo: lisbon, in: context).notes.isEmpty)
        #expect(LinkedFromMenu.more(3) == "3 More")
    }

    /// Asking for Linked From reads the links there and then, and tells no other menu: two
    /// libraries open at once (each window's own context) asked in turn for ever, each read
    /// telling the other's menu to ask again (WindowMinHeightTests hung, 13 November 2026).
    @Test func askingForLinkedFromTellsNoOtherMenu() throws {
        let a = try Self.container(), b = try Self.container()
        let one = a.mainContext.createNote(in: .all, body: "Lisbon\nTiles")
        _ = a.mainContext.createNote(in: .all, body: "Trip\nSee [[Lisbon]]")
        let two = b.mainContext.createNote(in: .all, body: "Porto\nBridges")
        try a.mainContext.save()
        try b.mainContext.save()
        WikiDirectory.invalidate()
        let version = LinkChanges.shared.version
        for _ in 0..<3 {
            #expect(LinkedFromMenu.notes(linkingTo: one, in: a.mainContext).total == 1)
            #expect(LinkedFromMenu.notes(linkingTo: two, in: b.mainContext).total == 0)
        }
        #expect(LinkChanges.shared.version == version, "a read asked for is the asker's; the other menu isn't made again")
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
