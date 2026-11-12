#if os(macOS)
import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Ticks and pins after an Apple Notes import that ran without Notes' database (the App Store
/// build, or any Mac without Full Disk Access): the import remembers each note's row, the last
/// page offers to bring them over, and once access is on they're put on the notes that came in.
/// Against the made-up NoteStore of AppleNotesImportTests only, never this Mac's own.
@MainActor @Suite(.serialized) struct AppleNotesFollowUpTests {
    typealias Fixture = AppleNotesImportTests

    /// Each test with its own settings and its own stand-ins for access and the database.
    static func clean(access: Bool, store: URL?, _ body: (AppleNotesFollowUpCenter, Counter) async throws -> Void) async throws {
        let center = AppleNotesFollowUpCenter.shared
        let kept = (AppleNotesFollowUp.defaults, center.hasAccess, center.openStore, AppleNotesImporter.storeOpener)
        let counter = Counter(access: access)
        AppleNotesFollowUp.defaults = TestDefaults()
        center.reset()
        center.hasAccess = { counter.ask() }
        center.openStore = { store.flatMap { try? AppleNoteStore.open(at: $0).get() } }
        AppleNotesImporter.storeOpener = { nil }
        defer {
            center.reset()
            (AppleNotesFollowUp.defaults, center.hasAccess, center.openStore, AppleNotesImporter.storeOpener) = kept
        }
        try await body(center, counter)
    }

    /// Whether Full Disk Access is on, and how often it was tried.
    final class Counter: @unchecked Sendable {
        private let lock = NSLock()
        private var on: Bool
        private var count = 0
        init(access: Bool) { on = access }
        func ask() -> Bool { lock.withLock { count += 1; return on } }
        var tries: Int { lock.withLock { count } }
        func turn(_ value: Bool) { lock.withLock { on = value } }
    }

    static func importWithout(_ context: ModelContext, notes: [AppleNote] = Array(Fixture.notes.prefix(2))) async -> AppleNotesImportSummary {
        await Fixture.importer(context, store: nil).run(notes, keepFolders: true) { _, _ in }
    }

    /// Pictures an import wrote out are removed again.
    static func discardFiles(_ context: ModelContext) {
        for a in (try? context.fetch(FetchDescriptor<Pane.Attachment>())) ?? [] {
            try? FileManager.default.removeItem(at: FileStore.url(for: a.id, filename: a.filename).deletingLastPathComponent())
        }
    }

    static func note(_ title: String, in context: ModelContext) throws -> Note {
        try #require(try context.fetch(FetchDescriptor<Note>()).first { $0.title == title })
    }

    // MARK: The import remembers

    @Test func withoutTheDatabaseEachNoteIsRememberedWithItsRow() async throws {
        let c = try Fixture.container()
        defer { Self.discardFiles(c.mainContext) }
        let summary = await Self.importWithout(c.mainContext)
        #expect(!summary.readStore && summary.noteIDs.count == 2)
        let weekend = try Self.note("Weekend list", in: c.mainContext)
        #expect(summary.followUp.map(\.key) == [10, 11], "each note by its row in Notes' database")
        #expect(summary.followUp.first?.note == weekend.id)
        #expect(summary.followUp.first?.fingerprint == AppleNotesFollowUp.fingerprint(weekend.body), "the text as it came in")
    }

    @Test func withTheDatabaseNothingWaits() async throws {
        let c = try Fixture.container()
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        defer { Self.discardFiles(c.mainContext) }
        let summary = await Fixture.importer(c.mainContext, store: url).run(Array(Fixture.notes.prefix(2)), keepFolders: true) { _, _ in }
        #expect(summary.readStore && summary.followUp.isEmpty, "access on at import time: all in one go, nothing offered")
    }

    // MARK: Bringing them over

    /// The same notes as an import with the database would have made them, without a second
    /// import: no note is added, and asking again changes nothing.
    @Test func onceAccessIsOnTheNotesGetTheirTicksAndPins() async throws {
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        try await Self.clean(access: false, store: url) { center, access in
            let c = try Fixture.container()
            let context = c.mainContext
            defer { Self.discardFiles(context) }
            let summary = await Self.importWithout(context)
            let weekend = try Self.note("Weekend list", in: context)
            let photo = try Self.note("Links and photo", in: context)
            let dated = weekend.updatedAt
            #expect(weekend.body.contains("* Call the plumber") && !weekend.isPinned)

            center.ask(summary.followUp)
            #expect(access.tries == 1, "asking tries the database once, so macOS lists Pinto Notes under Full Disk Access")
            #expect(await center.applyIfReady(in: context) == nil, "still off: nothing changes")
            #expect(center.isWaiting)

            access.turn(true)
            let outcome = try #require(await center.applyIfReady(in: context))
            #expect(outcome == .init(checklistItems: 4, ticked: 2, checklistNotes: 1, pinned: 1))
            #expect(outcome.line(locale: Locale(identifier: "en_US")) == "Ticked 2 items and pinned 1 note")

            // What an import with the database writes, for the same note.
            let with = try Fixture.container()
            defer { Self.discardFiles(with.mainContext) }
            _ = await Fixture.importer(with.mainContext, store: url).run(Array(Fixture.notes.prefix(2)), keepFolders: true) { _, _ in }
            #expect(weekend.body == (try Self.note("Weekend list", in: with.mainContext)).body)
            #expect(weekend.body.contains("- [ ] Buy oat milk\n- [x] Call the plumber\n- [ ] Book train\n  - [x] Window seat\n"))
            #expect(weekend.body.contains("* Bullet a\n* Bullet b"), "a bulleted list stays bulleted")
            #expect(weekend.isPinned && !photo.isPinned)
            #expect(photo.body.contains("[the map](https://example.com/named)"), "a named link leads somewhere again")
            #expect(weekend.updatedAt.timeIntervalSince(dated) < 1, "not an edit: the note keeps its date")
            #expect(try context.fetch(FetchDescriptor<Note>()).count == 2, "no second import, no copies")

            #expect(!center.isWaiting)
            #expect(await center.applyIfReady(in: context) == nil, "done once")
        }
    }

    /// After a relaunch (macOS may quit and reopen the app for Full Disk Access) the window
    /// brings them over and says so, unless the import sheet is waiting and says it itself.
    @Test func theWindowSaysItWhenTheSheetIsNotThere() async throws {
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        try await Self.clean(access: true, store: url) { center, _ in
            let en = Locale(identifier: "en_US")
            let c = try Fixture.container()
            let summary = await Self.importWithout(c.mainContext, notes: [Fixture.notes[0]])
            #expect(await center.windowLine(in: c.mainContext, locale: en) == nil, "nothing asked for: nothing said")
            AppleNotesFollowUp.pending = .init(items: summary.followUp, asked: .now)
            center.sheetWaiting = true
            #expect(await center.windowLine(in: c.mainContext, locale: en) == nil, "the sheet says it")
            #expect(center.isWaiting)
            center.sheetWaiting = false
            #expect(await center.windowLine(in: c.mainContext, locale: en) == "Ticked 2 items and pinned 1 note")
            #expect(try Self.note("Weekend list", in: c.mainContext).isPinned)
        }
    }

    @Test func aNoteChangedSinceTheImportIsLeftAsItIs() async throws {
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        try await Self.clean(access: true, store: url) { center, _ in
            let c = try Fixture.container()
            let context = c.mainContext
            let summary = await Self.importWithout(context, notes: [Fixture.notes[0]])
            let weekend = try Self.note("Weekend list", in: context)
            weekend.body += "Typed here after the import\n"
            let typed = weekend.body
            center.ask(summary.followUp)
            let outcome = try #require(await center.applyIfReady(in: context))
            #expect(outcome.changedSince == 1 && outcome.ticked == 0 && outcome.pinned == 0)
            #expect(weekend.body == typed && !weekend.isPinned)
            #expect(outcome.leftLine(locale: Locale(identifier: "en_US")) == "1 note you changed since the import was left as it is.")
        }
    }

    @Test func aDeletedNoteIsLeftOut() async throws {
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        try await Self.clean(access: true, store: url) { center, _ in
            let c = try Fixture.container()
            let context = c.mainContext
            let summary = await Self.importWithout(context, notes: [Fixture.notes[0]])
            try Self.note("Weekend list", in: context).trashedAt = .now
            center.ask(summary.followUp)
            let outcome = try #require(await center.applyIfReady(in: context))
            #expect(outcome.gone == 1 && outcome.pinned == 0)
        }
    }

    @Test func nothingIsReadUntilAsked() async throws {
        try await Self.clean(access: true, store: nil) { center, access in
            let c = try Fixture.container()
            _ = await Self.importWithout(c.mainContext, notes: [Fixture.notes[0]])
            #expect(await center.applyIfReady(in: c.mainContext) == nil)
            #expect(access.tries == 0, "never asked: Notes' database is never tried, nothing changes")
        }
    }

    @Test func anOfferNeverTakenUpIsForgottenAfterAWeek() async throws {
        try await Self.clean(access: true, store: nil) { _, _ in
            let item = AppleNotesFollowUp.Item(note: UUID(), key: 10, fingerprint: "x")
            AppleNotesFollowUp.pending = .init(items: [item], asked: .now.addingTimeInterval(-6 * 86_400))
            #expect(AppleNotesFollowUp.pending?.items == [item], "kept across a relaunch")
            AppleNotesFollowUp.pending = .init(items: [item], asked: .now.addingTimeInterval(-8 * 86_400))
            #expect(AppleNotesFollowUp.pending == nil)
        }
    }

    @Test func anUnreadableDatabaseChangesNothingAndSaysSo() async throws {
        try await Self.clean(access: true, store: nil) { center, _ in
            let c = try Fixture.container()
            let summary = await Self.importWithout(c.mainContext, notes: [Fixture.notes[0]])
            let before = try Self.note("Weekend list", in: c.mainContext).body
            center.ask(summary.followUp)
            let outcome = try #require(await center.applyIfReady(in: c.mainContext))
            #expect(outcome.unreadable)
            #expect(try Self.note("Weekend list", in: c.mainContext).body == before)
        }
    }

    // MARK: Lists

    @Test func onlyItemsWhoseWordsMatchBecomeChecklistItems() {
        let items: [RichTextToMarkdown.ListItem] = [
            .init(text: "Buy *oat* milk", kind: .check(done: true)),
            .init(text: "Added in Notes since", kind: .check(done: false)),
            .init(text: "Read the map", kind: .check(done: false), indent: 1),
            .init(text: "Plain bullet", kind: .bullet),
            .init(text: "Last", kind: .check(done: true)),
        ]
        let md = """
        Title
        * Buy \\*oat\\* milk
          * Read [the map](https://example.com)
        * Plain bullet
        ```
        * Last
        ```
        - [ ] Already a checklist
        * Last
        """
        let r = AppleNotesFollowUp.checklists(in: md, items: items)
        #expect(r.markdown == """
        Title
        - [x] Buy \\*oat\\* milk
          - [ ] Read [the map](https://example.com)
        * Plain bullet
        ```
        * Last
        ```
        - [ ] Already a checklist
        - [x] Last
        """)
        #expect(r.checks == 3 && r.ticked == 2)
        #expect(AppleNotesFollowUp.checklists(in: "* a", items: [.init(text: "a", kind: .bullet)]).checks == 0)
    }

    @Test func theConfirmationReadsPlainly() {
        let en = Locale(identifier: "en_US")
        typealias O = AppleNotesFollowUp.Outcome
        #expect(O(checklistItems: 30, ticked: 14, checklistNotes: 5, pinned: 3).line(locale: en) == "Ticked 14 items and pinned 3 notes")
        #expect(O(checklistItems: 1, ticked: 1, checklistNotes: 1).line(locale: en) == "Ticked 1 item")
        #expect(O(checklistItems: 4, checklistNotes: 2).line(locale: en) == "Brought back 2 checklists")
        #expect(O(pinned: 1).line(locale: en) == "Pinned 1 note")
        #expect(O(checklistItems: 2, ticked: 1_200, checklistNotes: 1, pinned: 2).line(locale: en) == "Ticked 1,200 items and pinned 2 notes")
        #expect(O().line(locale: en) == "No checklists or pins to bring over")
        #expect(O(changedSince: 3).leftLine(locale: en) == "3 notes you changed since the import were left as they are.")
        #expect(O().leftLine(locale: en) == nil)
    }

    /// The offer and why Full Disk Access is asked for, said plainly (Emil, 12 November 2026).
    @Test func theOfferSaysWhatIsReadAndThatTheCopyGoes() {
        #expect(AppleNotesImportView.plainListsLine == "Checklists came in as plain lists, and pins were skipped.")
        #expect(AppleNotesImportView.offerTitle == "Bring over ticks and pins")
        let why = AppleNotesImportView.fullDiskAccessWhy
        #expect(why.components(separatedBy: ". ").count <= 2, "one or two sentences")
        for word in ["Full Disk Access", "ticked", "pinned", "copy", "deletes"] { #expect(why.contains(word)) }
        for text in [why, AppleNotesImportView.turnOnLine, AppleNotesImportView.turnOnHelp, AppleNotesImportView.plainListsLine] {
            #expect(!text.contains("\u{2014}"), "no em dashes")
        }
    }

    // MARK: Where the database is, and what the App Store build may do

    @Test func theDatabaseIsLookedForInTheAccountsHomeNotTheSandboxContainer() {
        let path = ApplePins.store.path
        #expect(path.hasSuffix("/Library/Group Containers/group.com.apple.notes/NoteStore.sqlite"))
        #expect(!path.contains("/Library/Containers/"))
        #expect(path.hasPrefix(String(cString: getpwuid(getuid())!.pointee.pw_dir)))
    }

    /// Read-only, Notes' group container alone: the narrowest exception that reaches it.
    @Test func theSandboxedBuildsMayOnlyReadNotesGroupContainer() throws {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
        for name in ["Pane-mac-appstore", "Pane-mac-beta"] {
            let data = try Data(contentsOf: root.appending(path: "Pane/Resources/\(name).entitlements"))
            let plist = try #require(try PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any])
            #expect(plist["com.apple.security.app-sandbox"] as? Bool == true)
            #expect(plist["com.apple.security.temporary-exception.files.home-relative-path.read-only"] as? [String] == ["/Library/Group Containers/group.com.apple.notes/"], "\(name)")
            let writes = plist.keys.filter { $0.contains("temporary-exception.files") && !$0.hasSuffix("read-only") }
            #expect(writes.isEmpty, "\(name) never writes outside its container: \(writes)")
        }
    }

    // MARK: The sheet, pressed through

    /// Apple Notes as the stand-in answers it: Weekend list (p10) and Links and photo (p11).
    static func standIn(_ source: String) throws -> NSAppleEventDescriptor {
        func list(_ items: [NSAppleEventDescriptor]) -> NSAppleEventDescriptor {
            let l = NSAppleEventDescriptor.list()
            for (i, item) in items.enumerated() { l.insert(item, at: i + 1) }
            return l
        }
        func text(_ s: String) -> NSAppleEventDescriptor { NSAppleEventDescriptor(string: s) }
        if source.contains("get body of note id") {
            if source.contains("p10") { return text(Fixture.weekendHTML) }
            return text(Fixture.photoHTML)
        }
        if source.contains("get plaintext") { return text("") }
        let day = Fixture.day
        return list([text("iCloud"), list([list([
            text("Notes"),
            list([text("x-coredata://3060958B/ICNote/p10"), text("x-coredata://3060958B/ICNote/p11")]),
            list([text("Weekend list"), text("Links and photo")]),
            list([NSAppleEventDescriptor(date: day.addingTimeInterval(3600)), NSAppleEventDescriptor(date: day.addingTimeInterval(7200))]),
            list([NSAppleEventDescriptor(date: day), NSAppleEventDescriptor(date: day.addingTimeInterval(60))]),
            list([NSAppleEventDescriptor(boolean: false), NSAppleEventDescriptor(boolean: false)]),
            list([]),
            text("iCloud"),
        ])]), list([])])
    }

    static func waitFor(_ ax: OffscreenAX, _ id: String, seconds: Double = 8) async -> OffscreenAX.Element? {
        let end = Date.now.addingTimeInterval(seconds)
        while Date.now < end {
            if let e = ax.find(id) { return e }
            await ax.settle(200)
        }
        return nil
    }

    /// Import, the offer on the last page, why, System Settings (stood in for), back with access
    /// on: the confirmation, and the notes ticked and pinned.
    @Test func theSheetOffersTicksAndPinsAndBringsThemOverOnReturn() async throws {
        let url = try Fixture.store()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        try await Self.clean(access: false, store: url) { center, access in
            AppleNotesBridge.standIn = { try Self.standIn($0) }
            var opened: [URL] = []
            let keptOpen = AppleNotesImportView.openSettings
            AppleNotesImportView.openSettings = { opened.append($0) }
            defer { AppleNotesBridge.standIn = nil; AppleNotesImportView.openSettings = keptOpen }
            let c = try Fixture.container()
            defer { Self.discardFiles(c.mainContext) }
            let ax = OffscreenAX(AppleNotesImportView().modelContainer(c).environment(\.locale, Locale(identifier: "en_US")),
                                 size: CGSize(width: 540, height: AppleNotesImportView.guideHeight))
            defer { ax.close() }

            let start = try #require(await Self.waitFor(ax, "import.start"))
            #expect(start.press())
            let offer = try #require(await Self.waitFor(ax, "import.ticksAndPins"), "the last page offers the ticks and pins")
            #expect(ax.find("import.plainLists")?.text.contains("plain lists") == true)
            #expect(try c.mainContext.fetch(FetchDescriptor<Note>()).count == 2)
            #expect(offer.press())

            #expect(await Self.waitFor(ax, "import.fullDiskAccessWhy") != nil, "why, before System Settings opens")
            #expect(opened.isEmpty && !center.isWaiting, "nothing opened or kept before the press")
            #expect(try #require(ax.find("import.openFullDiskAccess")).press())
            for _ in 0..<20 where opened.isEmpty { await ax.settle(100) }
            #expect(opened == [ApplePins.settingsURL], "Privacy & Security, Full Disk Access")
            #expect(access.tries >= 1, "the database was tried first, so Pinto Notes is in the list")
            #expect(center.isWaiting && center.sheetWaiting)

            // Back from System Settings, still off.
            NotificationCenter.default.post(name: NSApplication.didBecomeActiveNotification, object: nil)
            #expect(await Self.waitFor(ax, "import.stillOff") != nil)

            // Turned on, and back.
            access.turn(true)
            NotificationCenter.default.post(name: NSApplication.didBecomeActiveNotification, object: nil)
            #expect(await Self.waitFor(ax, "import.applied") != nil, "the confirmation")
            #expect(center.outcome?.line(locale: Locale(identifier: "en_US")) == "Ticked 2 items and pinned 1 note")
            let weekend = try Self.note("Weekend list", in: c.mainContext)
            #expect(weekend.isPinned && weekend.body.contains("- [x] Call the plumber"))
            #expect(try c.mainContext.fetch(FetchDescriptor<Note>()).count == 2)
            #expect(!center.isWaiting && !center.sheetWaiting)
        }
    }

    /// Not now: nothing is kept, and nothing changes later.
    @Test func notNowKeepsNothing() async throws {
        try await Self.clean(access: false, store: nil) { center, _ in
            AppleNotesBridge.standIn = { try Self.standIn($0) }
            var opened: [URL] = []
            let keptOpen = AppleNotesImportView.openSettings
            AppleNotesImportView.openSettings = { opened.append($0) }
            defer { AppleNotesBridge.standIn = nil; AppleNotesImportView.openSettings = keptOpen }
            let c = try Fixture.container()
            defer { Self.discardFiles(c.mainContext) }
            let ax = OffscreenAX(AppleNotesImportView().modelContainer(c), size: CGSize(width: 540, height: AppleNotesImportView.guideHeight))
            defer { ax.close() }
            #expect(try #require(await Self.waitFor(ax, "import.start")).press())
            #expect(try #require(await Self.waitFor(ax, "import.ticksAndPins")).press())
            #expect(try #require(await Self.waitFor(ax, "import.notNow")).press())
            #expect(await Self.waitFor(ax, "import.ticksAndPins") != nil, "back on the last page")
            #expect(opened.isEmpty && !center.isWaiting)
        }
    }
}
#endif
