import Foundation
import SwiftData
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Tags as coloured labels: each tag's colour (its own, or one chosen and kept for the account),
/// the label in the note, and tags added and taken out from a note's right-click.
@Suite struct TagColorsTests {
    /// Tags is an experiment (Experiments): these check it turned on.
    init() { UserDefaults.standard.set(true, forKey: Experiment.tags.key) }

    // MARK: Colours

    @Test func eachTagHasItsOwnColourEverywhere() {
        // From the name alone, the same on every launch and device, in any case.
        #expect(TagColor.standard(for: "needs-review") == TagColor.standard(for: "Needs-Review"))
        #expect(TagColor.standard(for: "work") != .gray)
        // Spread over the bright colours, not all one.
        let names = ["work", "home", "needs-review", "ideas", "later", "reading", "urgent", "family", "travel", "money"]
        #expect(Set(names.map(TagColor.standard(for:))).count >= 4)
    }

    @MainActor @Test func aChosenColourIsKeptAndCanGoBack() {
        let defaults = UserDefaults(suiteName: "TagColorsTests.\(UUID())")!
        let colors = TagColors(defaults: defaults)
        let own = TagColor.standard(for: "needs-review")
        #expect(colors.color(for: "needs-review") == own)
        let other: TagColor = own == .red ? .blue : .red
        colors.set(other, for: "Needs-Review")
        #expect(colors.color(for: "needs-review") == other)
        #expect(colors.isChosen("NEEDS-REVIEW"))
        colors.set(nil, for: "needs-review")
        #expect(colors.color(for: "needs-review") == own)
        #expect(!colors.isChosen("needs-review"))
    }

    @Test func storedAsJSONByLowerCaseName() {
        let map: [String: TagColor] = ["needs-review": .red, "work/clients": .blue]
        #expect(TagColors.decode(TagColors.encode(map)) == map)
        #expect(TagColors.decode(nil).isEmpty)
        #expect(TagColors.decode("not json").isEmpty)
        // A colour a newer build knows and this one doesn't is skipped, not the whole list.
        #expect(TagColors.decode(#"{"a":"red","b":"teal"}"#) == ["a": .red])
    }

    @Test func aChoiceMadeHereWinsOnlyForItsTag() {
        // Another device chose green for work; this one chose red for later and took home's away.
        let server: [String: TagColor] = ["work": .green, "home": .blue]
        let merged = TagColors.merge(server: server, pending: ["later": "red", "home": ""])
        #expect(merged == ["work": .green, "later": .red])
    }

    @Test func theBoxIsTheAccountsOwn() {
        let a = UUID(), b = UUID()
        #expect(TagColors.sealContext(a) != TagColors.sealContext(b))
        #expect(TagColors.sealContext(a).hasPrefix("tagcolors:"))
        #expect(TagColors.sealContext(a) != E2EE.body(a), "never a note's context")
    }

    // MARK: The label in the note

    @MainActor @Test func aTagIsALabelInItsColour() {
        let text = "Plan\n\nAsk Sam #needs-review today\n\n`#code` stays code"
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let ns = text as NSString
        let tag = ns.range(of: "#needs-review")
        let color = TagColors.current(for: "needs-review")
        #expect(storage.attribute(.paneTag, at: tag.location, effectiveRange: nil) as? TagColor == color)
        #expect(storage.attribute(.paneTag, at: NSMaxRange(tag) - 1, effectiveRange: nil) as? TagColor == color)
        #expect((storage.attribute(.foregroundColor, at: tag.location, effectiveRange: nil) as? PColor) == color.ink)
        // The text is the tag as written, and still opens its list.
        #expect(storage.string == text)
        #expect(storage.attribute(.link, at: tag.location, effectiveRange: nil) != nil)
        // Not the words around it, and not in code.
        #expect(storage.attribute(.paneTag, at: tag.location - 1, effectiveRange: nil) == nil)
        #expect(storage.attribute(.paneTag, at: ns.range(of: "#code").location, effectiveRange: nil) == nil)
    }

    @MainActor @Test func aTagBeingTypedIsNotALabelYet() {
        let text = "Plan\n\nAsk Sam #needs-rev"
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: (text as NSString).length, length: 0))
        let tag = (text as NSString).range(of: "#needs-rev")
        #expect(storage.attribute(.paneTag, at: tag.location, effectiveRange: nil) == nil)
        #expect((storage.attribute(.foregroundColor, at: tag.location, effectiveRange: nil) as? PColor) == PColor.paneLinkText)
    }

    @MainActor @Test func aTickedItemsTagStaysMuted() {
        let text = "Plan\n\n- [x] Sent #needs-review"
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let tag = (text as NSString).range(of: "#needs-review")
        #expect(storage.attribute(.paneTag, at: tag.location, effectiveRange: nil) == nil)
    }

    // MARK: Labels from the menu

    @Test func aLabelsNameKeepsItsSpaces() {
        #expect(NoteLabels.typedName("  Needs   review ") == "Needs review")
        #expect(NoteLabels.typedName("#Later") == "Later")
        #expect(NoteLabels.typedName("2026") == "2026", "a label can be a number")
        #expect(NoteLabels.typedName("   ") == nil)
        #expect(NoteLabels.typedName("#") == nil)
        #expect(NoteLabels.typedName("!!!") == nil)
    }

    @Test func labelsLiveInTheFrontMatterAsTags() {
        let fm = NoteLabels.setting(["Needs review", "Later"], in: nil)
        #expect(fm == "tags:\n  - Needs review\n  - Later")
        #expect(NoteLabels.labels(in: fm) == ["Needs review", "Later"])
        // Other keys stay as they were; an old tags list is replaced.
        let imported = "source: https://example.com\ntags:\n  - old\naliases: [Acme]"
        let set = NoteLabels.setting(["Needs review"], in: imported)
        #expect(set == "source: https://example.com\naliases: [Acme]\ntags:\n  - Needs review")
        #expect(NoteLabels.labels(in: set) == ["Needs review"])
        #expect(WikiLinks.aliases(inFrontMatter: set) == ["Acme"])
        // None left: no tags key; nothing else either: no front matter.
        #expect(NoteLabels.setting([], in: set) == "source: https://example.com\naliases: [Acme]")
        #expect(NoteLabels.setting([], in: fm) == nil)
        // Obsidian's ways of writing them are read too.
        #expect(NoteLabels.labels(in: "tags: [work, \"Needs review\"]") == ["work", "Needs review"])
        #expect(NoteLabels.labels(in: "tags: #work #home") == ["work", "home"])
        #expect(NoteLabels.labels(in: "title: Plan") == [])
        // Quoted when YAML would misread it.
        #expect(NoteLabels.labels(in: NoteLabels.setting(["a: b", "#x"], in: nil)) == ["a: b", "x"])
    }

    @Test func removingTakesAWrittenTagOutWhereverItIs() {
        #expect(Tags.removing("needs-review", from: "Plan\n#needs-review\nFirst line") == "Plan\nFirst line")
        #expect(Tags.removing("later", from: "Plan\n#needs-review #later\nText") == "Plan\n#needs-review\nText")
        #expect(Tags.removing("home", from: "Plan\nCall #home soon") == "Plan\nCall soon")
        #expect(Tags.removing("home", from: "Plan\n#home") == "Plan")
        #expect(Tags.removing("Home", from: "Plan\n#home and #HOME\nEnd") == "Plan\nand\nEnd")
        #expect(Tags.removing("work", from: "Plan\n#work #work/clients") == "Plan\n#work/clients")
        #expect(Tags.removing("work", from: "Plan\n`#work` here") == "Plan\n`#work` here")
    }

    @MainActor @Test func theMenuLabelsNotesAndUndoTakesItBack() throws {
        let container = try ModelContainer(for: Note.self, Folder.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        let a = Note(body: "Plan\nFirst"), b = Note(body: "Trip\nPack #later")
        b.frontMatter = "source: Bear"
        let locked = Note(body: "Secret")
        locked.lockedBody = "sealed"
        [a, b, locked].forEach(context.insert)
        let dated = a.updatedAt
        let undo = UndoManager()
        undo.groupsByEvent = false
        undo.beginUndoGrouping()
        context.setTag("Needs review", on: [a, b, locked], to: true, undo: undo)
        undo.endUndoGrouping()
        // A label, not text: the notes say what they said.
        #expect(a.body == "Plan\nFirst")
        #expect(NoteLabels.labels(in: a.frontMatter) == ["Needs review"])
        #expect(NoteLabels.labels(in: b.frontMatter) == ["Needs review"])
        #expect(b.frontMatter?.hasPrefix("source: Bear") == true)
        #expect(locked.frontMatter == nil, "a locked note isn't changed here")
        #expect(a.dirty, "it syncs")
        #expect(abs(a.updatedAt.timeIntervalSince(dated)) < 1, "it keeps its place in the list")
        undo.undo()
        #expect(a.frontMatter == nil)
        #expect(b.frontMatter == "source: Bear")

        // A tag written in the text counts: it's ticked, and taking it off takes it out of the text.
        #expect(NoteTagsMenu.has("later", b))
        context.setTag("later", on: [b], to: true, undo: nil)
        #expect(NoteLabels.labels(in: b.frontMatter).isEmpty, "it has it already")
        context.setTag("later", on: [b], to: false, undo: nil)
        #expect(b.body == "Trip\nPack")
    }

    @MainActor @Test func aLabelIsATagInTheSidebarAndItsList() throws {
        let container = try ModelContainer(for: Note.self, Folder.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let context = container.mainContext
        let a = Note(body: "Plan\nFirst"), b = Note(body: "Trip\n#work/clients here")
        a.frontMatter = NoteLabels.setting(["Needs review", "work"], in: nil)
        [a, b].forEach(context.insert)
        try context.save()
        let index = TagIndex()
        let entries = index.entries(in: context)
        #expect(entries.map(\.name) == ["Needs review", "work", "work/clients"])
        #expect(entries.first { $0.name == "work" }?.count == 2, "a label and a written tag nested under it")
        #expect(Tags.noteIDs(tagged: "Needs review", in: context) == [a.persistentModelID])
        #expect(Tags.noteIDs(tagged: "work", in: context) == [a.persistentModelID, b.persistentModelID])
        // Typing # never offers one with a space: it couldn't be written.
        #expect(!index.suggestions("ne", in: context).contains("Needs review"))
    }

    @Test func theListPreviewsTheTextNotTheTagLine() {
        #expect(NoteText.head(of: "Hotel booking\n#Needs-review #Lisbon-trip\nMemmo Príncipe Real") == ("Hotel booking", "Memmo Príncipe Real"))
        // Only tags, nothing else yet: no preview, as for a note with only a title.
        #expect(NoteText.head(of: "Hotel booking\n#Needs-review").preview == nil)
        // A line with words and a tag is still what the note says.
        #expect(NoteText.head(of: "Plan\nCall Sam #home").preview?.contains("Call Sam") == true)
        // A heading isn't a tag line.
        #expect(NoteText.head(of: "Plan\n# Big idea\nText").preview != nil)
    }

    @Test func aNestedTagTakesItsParentsColour() {
        #expect(TagColor.standard(for: "work/clients") == TagColor.standard(for: "work"))
        #expect(TagColors.lookup("work/clients", in: ["work": .purple]) == .purple)
        #expect(TagColors.lookup("work/clients", in: ["work": .purple, "work/clients": .green]) == .green)
    }

    @Test func theRightClickHasTags() {
        #expect(NoteRowMenu.macGroups(locked: false, trashed: false).joined().contains(.tags))
        #expect(NoteRowMenu.groups(locked: false, trashed: false).joined().contains(.tags))
        // Not where the note's text can't be written here.
        for (locked, trashed, shared) in [(true, false, false), (false, true, false), (false, false, true)] {
            #expect(!NoteRowMenu.macGroups(locked: locked, trashed: trashed, shared: shared).joined().contains(.tags))
            #expect(!NoteRowMenu.groups(locked: locked, trashed: trashed, shared: shared).joined().contains(.tags))
        }
    }

    @Test func aTagsListIsTitledWithoutAHash() {
        #expect(NoteListView.tagTitle("Needs review") == "Needs review")
        #expect(NoteListView.tagTitle("work/clients") == "work/clients")
    }

    @MainActor @Test func newTagPicksItsColour() throws {
        let colors = TagColors(defaults: UserDefaults(suiteName: "TagColorsTests.\(UUID())")!)
        // Before a pick: the colour the name has, and it follows the name as it's typed.
        #expect(NewTagSheet.colour(for: "Needs review", picked: nil, in: colors) == .standard(for: "Needs review"))
        #expect(NewTagSheet.colour(for: "Needs review", picked: .blue, in: colors) == .blue)
        let container = try ModelContainer(for: Note.self, Folder.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = Note(body: "Plan\nFirst")
        container.mainContext.insert(note)
        NewTagSheet.add("  Needs review ", colour: .red, to: [note], in: container.mainContext, colors: colors, undo: nil)
        #expect(NoteLabels.labels(in: note.frontMatter) == ["Needs review"])
        #expect(colors.color(for: "needs review") == .red)
        #expect(colors.isChosen("Needs review"))
        // No pick: the tag keeps the colour its name gives it, and nothing is stored as chosen.
        NewTagSheet.add("Waiting", colour: nil, to: [note], in: container.mainContext, colors: colors, undo: nil)
        #expect(NoteLabels.labels(in: note.frontMatter) == ["Needs review", "Waiting"])
        #expect(!colors.isChosen("Waiting"))
        // A name with nothing in it adds nothing.
        NewTagSheet.add("  ", colour: .red, to: [note], in: container.mainContext, colors: colors, undo: nil)
        #expect(NoteLabels.labels(in: note.frontMatter).count == 2)
    }

    @MainActor @Test func theNoteMenuShowsEachTagsColour() {
        let colors = TagColors(defaults: UserDefaults(suiteName: "TagColorsTests.\(UUID())")!)
        #expect(NoteTagsMenu.colour(of: "Needs review", in: colors) == .standard(for: "Needs review"))
        colors.set(.red, for: "Needs review")
        #expect(NoteTagsMenu.colour(of: "needs review", in: colors) == .red)
    }

    @MainActor @Test func tagsIsAnExperimentOffUntilTurnedOn() {
        let defaults = UserDefaults(suiteName: "TagColorsTests.\(UUID())")!
        #expect(!Experiments.isOn(.tags, defaults: defaults), "off until turned on")
        Experiments.set(.tags, true, defaults: defaults)
        #expect(Experiments.isOn(.tags, defaults: defaults))
        // Off: no Tags in a note's menus, on the Mac or iPhone.
        #expect(!NoteRowMenu.macGroups(locked: false, trashed: false, tags: false).joined().contains(.tags))
        #expect(!NoteRowMenu.groups(locked: false, trashed: false, tags: false).joined().contains(.tags))
        #expect(NoteRowMenu.groups(locked: false, trashed: false, tags: false) == [[.share, .move, .delete], [.pin, .lock, .duplicate]])
        // Its page is in Settings, last, signed in or not.
        #expect(SettingsPage.groups.last == [.experimental])
        #expect(SettingsPage.available(signedIn: false, hasClient: false).contains(.experimental))
        #expect(SettingsPage.experimental.title == "Experimental")
    }
}
