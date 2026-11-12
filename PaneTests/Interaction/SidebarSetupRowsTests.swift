#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The setup rows at the foot of the Mac sidebar (Templates, Connect an AI, Import notes) leave
/// once their job is done or you remove them, and never come back; their homes are your account's
/// menu and the File menu (Emil, 12 November 2026: "I kinda wanna get these off my sidebar").
@MainActor @Suite(.serialized) struct SidebarSetupRowsTests {
    static func suite() -> (UserDefaults, String) {
        let name = "sidebar-setup-\(UUID())"
        return (UserDefaults(suiteName: name)!, name)
    }

    let day: TimeInterval = 86_400
    static let day: TimeInterval = 86_400

    // MARK: When each row leaves

    @Test func eachRowLeavesWhenItsJobIsDone() {
        let now = Date.now
        let fresh = SidebarSetupFacts(firstNote: now.addingTimeInterval(-day))
        func shown(_ facts: SidebarSetupFacts) -> [SidebarSetupRow] {
            SidebarSetup(defaults: Self.suite().0, account: UUID()).shown(facts, now: now)
        }
        #expect(shown(fresh) == [.templates, .connect, .importNotes], "a new account: all three, Templates first")
        var f = fresh; f.connected = true
        #expect(shown(f) == [.templates, .importNotes], "an AI connected: Connect an AI leaves")
        f = fresh; f.imported = true
        #expect(shown(f) == [.templates, .connect], "an import finished: Import notes leaves")
        f = fresh; f.madeFromTemplate = true
        #expect(shown(f) == [.connect, .importNotes], "a note made from a template: Templates leaves")
        f = fresh; f.firstNote = now.addingTimeInterval(-13.9 * day)
        #expect(shown(f) == [.templates, .connect, .importNotes], "not yet two weeks")
        f.firstNote = now.addingTimeInterval(-14 * day)
        #expect(shown(f) == [.connect], "two weeks after the first note: Templates and Import notes leave, Connect an AI waits for an AI")
        f.connected = true; f.imported = true
        #expect(shown(f).isEmpty, "Emil's account: none")
        #expect(shown(SidebarSetupFacts()) == SidebarSetupRow.allCases, "no notes yet: the clock hasn't started")
    }

    /// Once gone, gone: an AI disconnected or a template's note deleted doesn't bring a row back.
    @Test func aRowThatLeftNeverComesBack() {
        let (defaults, _) = Self.suite()
        let setup = SidebarSetup(defaults: defaults, account: UUID())
        let now = Date.now
        #expect(setup.shown(SidebarSetupFacts(connected: true, madeFromTemplate: true, firstNote: now), now: now) == [.importNotes])
        #expect(setup.shown(SidebarSetupFacts(firstNote: now), now: now) == [.importNotes], "the facts went back; the rows didn't")
        // Per account: another account on this Mac still has its own.
        let other = SidebarSetup(defaults: defaults, account: UUID())
        #expect(other.shown(SidebarSetupFacts(firstNote: now), now: now) == SidebarSetupRow.allCases)
        #expect(setup.key(.connect).hasPrefix("sidebarSetup.connectAI.") && setup.key(.connect).hasSuffix(setup.account))
        #expect(setup.account == setup.account.lowercased(), "keyed as the other per-account flags are (noteSources.<account>)")
    }

    /// The clock starts at the account's first note: the sign-up day (its Welcome note), never an
    /// imported note's own date, and it's kept once known.
    @Test func theTwoWeeksStartAtTheAccountsFirstNote() throws {
        let (defaults, _) = Self.suite()
        let setup = SidebarSetup(defaults: defaults, account: UUID())
        let now = Date.now
        #expect(setup.firstNote(hasNotes: false, accountCreated: now.addingTimeInterval(-30 * day), now: now) == nil, "no notes, no clock")
        let made = now.addingTimeInterval(-3 * day)
        #expect(setup.firstNote(hasNotes: true, accountCreated: made, now: now) == made)
        #expect(setup.firstNote(hasNotes: true, accountCreated: nil, now: now.addingTimeInterval(day)) == made, "kept")
        // Notes imported from Apple Notes keep their years-old dates: the clock isn't theirs.
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let old = c.mainContext.createNote(in: .all, body: "From 2019\n\ntext")
        old.createdAt = now.addingTimeInterval(-2_000 * day)
        try c.mainContext.save()
        let account = UUID()
        let facts = SidebarSetup.facts(progress: nil, connected: nil, ledger: NoteSourceLedger(defaults: defaults, account: account), context: c.mainContext,
                                       accountCreated: nil, setup: SidebarSetup(defaults: defaults, account: account), now: now)
        #expect(facts.firstNote == now, "first seen now, not \(old.createdAt)")
        #expect(SidebarSetup(defaults: defaults, account: account).shown(facts, now: now) == SidebarSetupRow.allCases)
    }

    /// What the app already knows: the server's marks, the AI connections list, the templates made.
    @Test func theFactsComeFromWhatTheAppKnows() throws {
        let (defaults, _) = Self.suite()
        let account = UUID()
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ledger = NoteSourceLedger(defaults: defaults, account: account)
        let setup = SidebarSetup(defaults: defaults, account: account)
        func facts(_ p: SetupProgress?, _ names: [String]?) -> SidebarSetupFacts {
            SidebarSetup.facts(progress: p, connected: names, ledger: ledger, context: c.mainContext, accountCreated: nil, setup: setup)
        }
        #expect(facts(nil, nil) == SidebarSetupFacts(), "nothing known yet: nothing done")
        #expect(facts(nil, []).connected == false)
        #expect(facts(nil, ["ChatGPT"]).connected, "Settings › AI Connections' list")
        #expect(facts(SetupProgress(connected: true), nil).connected, "the server's mark")
        #expect(facts(SetupProgress(imported: true), nil).imported)
        #expect(!ledger.madeFromTemplate)
        ledger.record(NoteSourceLink(kind: .copy, slug: "someones-note"), note: UUID())
        #expect(!ledger.madeFromTemplate, "a copied note isn't a template")
        ledger.record(NoteSourceLink(kind: .template, slug: "weekly-plan"), note: UUID())
        #expect(facts(nil, nil).madeFromTemplate, "the library records each template's note")
        #expect(!NoteSourceLedger(defaults: defaults, account: UUID()).madeFromTemplate, "per account")
    }

    // MARK: In the window

    static func footFrames(_ host: AccountRowTests.Host) async -> [String: CGRect] {
        for _ in 0..<4 { await host.settle() }
        return FootProbe.frames
    }

    static let rowIDs = SidebarSetupRow.allCases.map(\.id)

    /// In the real window: each row goes when its condition is met, and with none left the foot is
    /// you alone, with no gap where the rows were.
    @Test(arguments: [
        (SetupProgress(), false, false, [SidebarSetupRow.templates, .connect, .importNotes]),
        (SetupProgress(connected: true), false, false, [.templates, .importNotes]),
        (SetupProgress(imported: true), false, false, [.templates, .connect]),
        (SetupProgress(), true, false, [.connect, .importNotes]),
        (SetupProgress(), false, true, [.connect]),
        (SetupProgress(imported: true, connected: true), false, true, []),
    ])
    func eachRowHidesInTheWindow(progress: SetupProgress, template: Bool, aged: Bool, expected: [SidebarSetupRow]) async throws {
        HoverProbe.enabled = true
        FootProbe.frames = [:]
        let store = AIChangesCenter.shared.store
        AIChangesCenter.shared.store = nil
        defer { HoverProbe.enabled = false; HoverProbe.reset(); FootProbe.frames = [:]; AIChangesCenter.shared.store = store }
        let (defaults, _) = Self.suite()
        let account = UUID()
        if template { NoteSourceLedger(defaults: defaults, account: account).record(NoteSourceLink(kind: .template, slug: "weekly-plan"), note: UUID()) }
        if aged { defaults.set(Date.now.addingTimeInterval(-15 * Self.day), forKey: SidebarSetup(defaults: defaults, account: account).firstNoteKey) }
        let host = try await AccountRowTests.Host(rows: true, progress: progress, account: account, defaults: defaults)
        defer { host.close() }
        let frames = await Self.footFrames(host)
        let shown = SidebarSetupRow.allCases.filter { frames[$0.id] != nil }
        #expect(shown == expected, "shown \(shown.map(\.rawValue)), expected \(expected.map(\.rawValue))")
        let foot = try #require(frames["sidebar.foot"]), account_ = try #require(frames["sidebar.account"])
        if expected.isEmpty {
            #expect(abs(account_.minY - foot.minY) < 0.5, "no gap above you: the account starts \(account_.minY - foot.minY) pt into the foot")
            #expect(abs(foot.height - account_.height) < 0.5, "the foot is you alone: \(foot.height) against \(account_.height)")
        } else if let lastRow = expected.last, let firstRow = expected.first {
            let last = try #require(frames[lastRow.id]), first = try #require(frames[firstRow.id])
            #expect(abs(account_.minY - last.maxY - (SidebarStyle.pillGap + SidebarFoot.accountGap)) < 0.5, "the gap under the rows is as it was: \(account_.minY - last.maxY)")
            #expect(abs(foot.minY - first.minY) < 0.5, "the first row starts the foot")
        }
        // Each one that left is put away for good.
        for row in SidebarSetupRow.allCases where !expected.contains(row) {
            #expect(defaults.bool(forKey: SidebarSetup(defaults: defaults, account: account).key(row)), "\(row) is kept as gone")
        }
    }

    /// Remove from Sidebar: the row goes, and stays gone after a relaunch (a new window reading
    /// the defaults again, from a new instance of them).
    @Test func removeFromSidebarSurvivesARelaunch() async throws {
        HoverProbe.enabled = true
        FootProbe.frames = [:]
        defer { HoverProbe.enabled = false; HoverProbe.reset(); FootProbe.frames = [:] }
        let (defaults, name) = Self.suite()
        let account = UUID()
        let first = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), account: account, defaults: defaults)
        #expect(Self.rowIDs.allSatisfy { FootProbe.frames[$0] != nil }, "all three to start with")
        // What the row's Remove from Sidebar does (its context menu and accessibility action call it).
        SidebarSetup(defaults: defaults, account: account).remove(.connect)
        first.close()
        FootProbe.frames = [:]
        let again = UserDefaults(suiteName: name)!
        #expect(again.bool(forKey: SidebarSetup(defaults: again, account: account).key(.connect)), "written to the defaults")
        let second = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), account: account, defaults: again)
        defer { second.close() }
        let frames = await Self.footFrames(second)
        #expect(frames["sidebar.connectAI"] == nil, "Connect an AI stays gone")
        #expect(frames["sidebar.templates"] != nil && frames["sidebar.import"] != nil, "the others stay")
    }

    /// Each row has Remove from Sidebar in its right-click menu and as an accessibility action,
    /// and the foot hands each row its remove.
    @Test func everyRowCanBeRemoved() throws {
        let file = try SettingsHomeTests.source("Pane/Views/SidebarAIs.swift")
        let start = try #require(file.range(of: "struct SidebarActionRow: View {"))
        let end = try #require(file.range(of: "\n}\n", range: start.upperBound..<file.endIndex))
        let row = file[start.upperBound..<end.lowerBound]
        #expect(row.contains(".contextMenu {") && row.contains("Button(SidebarSetupRow.removeTitle"), "a right-click menu")
        #expect(row.contains(".accessibilityActions {"), "an accessibility action")
        #expect(SidebarSetupRow.removeTitle == "Remove from Sidebar", "title case, as a Mac menu item")
        let rows = try #require(file.range(of: "struct SidebarStudyRows: View {"))
        #expect(file[rows.upperBound...].contains("remove: setup.map { setup in { remove(row, setup) } })"))
    }

    // MARK: Their homes

    /// Your account's menu: Connect an AI first, then Templates and Import Notes, each opening its
    /// sheet on the notes window.
    @Test(arguments: [(SidebarSetupRow.connect, "connectAI"), (.templates, "templates"), (.importNotes, "importNotes")])
    func theAccountMenuOpensEachSheet(row: SidebarSetupRow, sheet: String) async throws {
        #expect(AccountMenuItems.items.map(\.title) == ["Connect an AI\u{2026}", "Templates\u{2026}", "Import Notes\u{2026}"])
        let host = try await AccountRowTests.Host()
        defer { host.close(); SettingsRoute.shared.page = nil }
        #expect(host.popup == nil)
        let item = try #require(AccountMenuItems.items.first { $0.row == row })
        item.open()
        for _ in 0..<20 where host.popup != sheet { await host.settle() }
        #expect(host.popup == sheet, "\(item.title) opens \(sheet), got \(host.popup ?? "nothing")")
    }

    /// The menu is on the account row itself (and its items are accessibility actions there); a
    /// click on the row still opens Settings at Account.
    @Test func theAccountRowHasTheMenu() throws {
        let file = try SettingsHomeTests.source("Pane/Views/SidebarView.swift")
        let start = try #require(file.range(of: "struct AccountButton: View {"))
        let end = try #require(file.range(of: "\n}\n", range: start.upperBound..<file.endIndex))
        let button = file[start.upperBound..<end.lowerBound]
        #expect(button.contains(".contextMenu {") && button.contains("ForEach(AccountMenuItems.items)"), "the items are in the account's menu")
        #expect(button.contains(".accessibilityActions {"))
        #expect(button.contains("activate()"), "a click still opens Settings")
    }

    /// File › New from Template… opens the library; File › Import Notes has the sources.
    @Test func theFileMenuHasTemplatesAndImport() throws {
        let root = try SettingsHomeTests.source("Pane/Views/RootView.swift")
        let newItems = try #require(root.range(of: "CommandGroup(replacing: .newItem) {"))
        let newEnd = try #require(root.range(of: "CommandGroup(after: .saveItem)", range: newItems.upperBound..<root.endIndex))
        let group = root[newItems.upperBound..<newEnd.lowerBound]
        #expect(group.contains("Button(AppMenuWords.newFromTemplate) { NotificationCenter.default.post(name: .paneTemplates"))
        #expect(AppMenuWords.newFromTemplate == "New from Template\u{2026}")
        #expect(root.contains("Menu(AppMenuWords.importNotes) {"))
        #expect(root.contains("Button(\"Connect an AI\\u{2026}\") { NotificationCenter.default.post(name: .paneConnectAI"), "Connect an AI is in File too")
    }
}
#endif
