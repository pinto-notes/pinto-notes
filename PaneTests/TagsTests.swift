import Foundation
import SwiftData
import Testing
@testable import Pane

/// Tags in notes (`#work`, `#work/clients`), by Obsidian's rules: found in the text, collected
/// across the notes with counts, listed by tag, and offered while one is typed.
@Suite struct TagsTests {
    func names(_ text: String) -> [String] { Tags.find(in: text).map(\.name) }

    @Test func tagsByObsidiansRules() {
        let text = "Plan\n#work at the start, then (#home) and #work/clients, #snake_case, #kebab-case and #2026goals."
        #expect(names(text) == ["work", "home", "work/clients", "snake_case", "kebab-case", "2026goals"])
        // The range covers the `#` and the name, not what follows.
        let r = Tags.find(in: "Plan\nSee #idea.").first!.range
        #expect(((("Plan\nSee #idea." as NSString).substring(with: r))) == "#idea")
        #expect(names("Plan\nNon-Latin #café and #日本 too") == ["café", "日本"])
        #expect(names("Plan\nA nested tag ends at a slash: #a/b/") == ["a/b"])
    }

    @Test func notHeadingsNumbersOrWordsWithAHash() {
        #expect(names("Plan\n# Heading\n## Sub").isEmpty, "a heading has a space after its #")
        #expect(names("Plan\nIssue #123 and #42/7").isEmpty, "all digits isn't a tag")
        #expect(names("Plan\nC#sharp, foo#bar, ##double, \\#escaped, &#123;").isEmpty)
    }

    @Test func notInCodeLinksOrAddresses() {
        let text = """
        Plan
        `#inline` and ``#double``
        ```
        #fenced
        ```
        [Jump](#anchor) and [[#Heading]] and [[Note|#alias]]
        https://example.com/,#frag and <https://x.com/#a>
        #real
        """
        #expect(names(text) == ["real"])
        #expect(names("Plan\n```\n#unclosed").isEmpty, "a fence not closed yet runs to the end")
    }

    @Test func notInTheTitleLine() {
        #expect(names("Trip #travel\nPacking #lists") == ["lists"], "the first plain line is the title")
        // A note that starts with tags has no plain title line: they count.
        #expect(names("#inbox #later\nSomething") == ["inbox", "later"])
        #expect(names("\n\nTitle #x\n#y") == ["y"])
    }

    @Test func eachTagOnceInTheFirstSpelling() {
        #expect(Tags.names(in: "Plan\n#Work and #work and #home #WORK") == ["Work", "home"])
    }

    @Test func aTagListsItsNestedTags() {
        #expect(Tags.matches("work", "work"))
        #expect(Tags.matches("Work/Clients", "work"))
        #expect(!Tags.matches("workshop", "work"))
        #expect(!Tags.matches("work", "work/clients"))
        #expect(Tags.has("work", in: "Plan\nFor #work/clients"))
        #expect(!Tags.has("work", in: "Plan\nFor #workshop"))
        #expect(!Tags.has("work", in: "Plan\n`#work`"))
    }

    @Test func collectedWithCountsByName() {
        let entries = Tags.collect([["work", "home"], ["Work/clients"], ["work"], ["Home"], ["home"]])
        // `work` lists the note tagged work/clients too; the most common spelling shows.
        #expect(entries == [Tags.Entry(name: "home", count: 3), Tags.Entry(name: "work", count: 3), Tags.Entry(name: "Work/clients", count: 1)])
        #expect(Tags.collect([]).isEmpty)
    }

    @Test func theTagBeingTyped() {
        func typed(_ text: String) -> String? {
            Tags.typingQuery(in: text, caret: (text as NSString).length).map { (text as NSString).substring(with: $0) }
        }
        #expect(typed("Plan\nCall #wo") == "wo")
        #expect(typed("Plan\n#work/cl") == "work/cl")
        #expect(typed("Plan\nCall #") == nil, "a bare # (a heading on its way) offers nothing")
        #expect(typed("Plan\n# Head") == nil)
        #expect(typed("Plan\nIssue #12") == nil)
        #expect(typed("Plan\n`#co` and #wo") == "wo")
        #expect(typed("Plan\n`#co`") == nil, "in inline code, nothing")
        #expect(typed("Trip #tr") == nil, "not in the title")
        #expect(typed("Plan\nC#sh") == nil)
        // In the middle of a word, nothing.
        #expect(Tags.typingQuery(in: "Plan\n#work", caret: 7) == nil)
    }

    @Test func suggestionsBestFirst() {
        let entries = [Tags.Entry(name: "work", count: 5), Tags.Entry(name: "work/clients", count: 2), Tags.Entry(name: "workshop", count: 9),
                       Tags.Entry(name: "home/cleaning", count: 1), Tags.Entry(name: "reading", count: 3)]
        #expect(Tags.suggestions("wor", from: entries) == ["workshop", "work", "work/clients"])
        #expect(Tags.suggestions("cl", from: entries) == ["work/clients", "home/cleaning"], "a part after a slash counts")
        #expect(Tags.suggestions("work", from: entries) == ["workshop", "work/clients"], "not the one typed in full")
        #expect(Tags.suggestions("", from: entries).isEmpty)
    }

    @Test func aTagLinkOpensOnlyItsList() {
        let url = LinkPolicy.tagURL("work/clients & co")!
        #expect(url.scheme == LinkPolicy.tagScheme)
        #expect(LinkPolicy.action(for: url) == .tag("work/clients & co"))
        #expect(LinkPolicy.action(for: URL(string: "pane-tag:")!) == .nothing)
    }
}

/// A tag's list and the sidebar's Tags, from a library.
@MainActor @Suite struct TagLibraryTests {
    let container: ModelContainer
    var ctx: ModelContext { container.mainContext }

    init() throws {
        container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    private func listed(_ scope: Scope) throws -> [String] {
        NoteListView.scoped(try ctx.fetch(FetchDescriptor<Note>()).map(NoteEntry.init), to: scope, context: ctx).compactMap { $0.note(in: ctx)?.title }.sorted()
    }

    @Test func aTagsListHasItsNotesAndTheirNestedTags() throws {
        ctx.createNote(in: .all, body: "Acme kickoff\nAgenda #work/clients")
        ctx.createNote(in: .all, body: "Standup\nNotes #Work")
        ctx.createNote(in: .all, body: "Workshop\n#workshop day")
        ctx.createNote(in: .all, body: "Snippet\n`#work`")
        let gone = ctx.createNote(in: .all, body: "Old\n#work")
        gone.trashedAt = .now
        try ctx.save()
        #expect(try listed(.tag("work")) == ["Acme kickoff", "Standup"])
        #expect(try listed(.tag("work/clients")) == ["Acme kickoff"])
        #expect(try listed(.tag("nothing")).isEmpty)
    }

    @Test func theIndexCountsTagsAndFollowsSaves() throws {
        let a = ctx.createNote(in: .all, body: "Acme\n#work #clients")
        ctx.createNote(in: .all, body: "Home\n#home and #work")
        try ctx.save()
        let index = TagIndex()
        #expect(index.entries(in: ctx) == [Tags.Entry(name: "clients", count: 1), Tags.Entry(name: "home", count: 1), Tags.Entry(name: "work", count: 2)])

        // A tag written, one taken out: counted again from the save.
        a.body = "Acme\n#work #reading"
        try ctx.save()
        #expect(index.entries(in: ctx).map(\.name) == ["home", "reading", "work"])

        // A note in Recently Deleted no longer counts.
        a.trashedAt = .now
        try ctx.save()
        #expect(index.entries(in: ctx) == [Tags.Entry(name: "home", count: 1), Tags.Entry(name: "work", count: 1)])
        #expect(index.suggestions("ho", in: ctx) == ["home"])
        #expect(index.listedName("WORK", in: ctx) == "work")
    }

    @Test func aTagScopeIsRememberedAndOrderedOnItsOwn() throws {
        let data = try JSONEncoder().encode(Scope.tag("work/clients"))
        #expect(try JSONDecoder().decode(Scope.self, from: data) == .tag("work/clients"))
        #expect(ListOrderStore.key(of: .tag("Work")) == ListOrderStore.key(of: .tag("work")))
        #expect(ListOrderStore.key(of: .tag("work")) != ListOrderStore.key(of: .all))
    }
}
