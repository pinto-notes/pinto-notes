#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The foot of the Mac sidebar: Templates is a row for good, and Connect an AI and Import notes
/// are no rows at all; a new account sees one notice, once, that Settings does both (Emil,
/// 12 November 2026: "maybe we should keep templates there. but put connect AI and import notes as
/// a notice you see"). Hidden places count as gone, so the notice points at Settings, and Settings
/// really connects an AI and imports notes.
@MainActor @Suite(.serialized) struct SidebarSetupRowsTests {
    static func suite() -> (UserDefaults, String) {
        let name = "sidebar-setup-\(UUID())"
        return (UserDefaults(suiteName: name)!, name)
    }

    static let day: TimeInterval = 86_400

    // MARK: The notice's rules

    @Test func theNoticeSaysWhatSettingsDoes() {
        #expect(SetupNoticeWords.line(imported: false) == "You can connect more AIs and import notes any time in Settings.")
        #expect(SetupNoticeWords.line(imported: true) == "You can connect more AIs any time in Settings.")
        #expect(SetupNoticeWords.open == "Open Settings")
    }

    /// When it shows: after setup, with a note, once the server has said whether there's been an
    /// import; its words follow the import.
    @Test func theNoticeShowsForANewAccountAfterSetup() {
        let now = Date.now
        let notice = SetupNotice(defaults: Self.suite().0, account: UUID())
        let fresh = SetupNoticeFacts(imported: false, firstNote: now.addingTimeInterval(-Self.day))
        #expect(notice.line(fresh, onboarding: false, now: now) == SetupNoticeWords.connectAndImport, "a new account")
        #expect(notice.line(fresh, onboarding: true, now: now) == nil, "never during the first-run flow")
        var f = fresh; f.imported = true
        #expect(notice.line(f, onboarding: false, now: now) == SetupNoticeWords.connect, "after an import: AIs only")
        f = fresh; f.imported = nil
        #expect(notice.line(f, onboarding: false, now: now) == nil, "not before the server has said, so the words never swap")
        f = fresh; f.firstNote = nil
        #expect(notice.line(f, onboarding: false, now: now) == nil, "no notes yet")
        #expect(!notice.isGone, "none of that put it away")
    }

    /// Fourteen days after the first note it goes, during the flow too, and is kept as gone.
    @Test func theNoticeGoesAfterTwoWeeksForGood() {
        let now = Date.now
        let (defaults, _) = Self.suite()
        let notice = SetupNotice(defaults: defaults, account: UUID())
        var f = SetupNoticeFacts(imported: false, firstNote: now.addingTimeInterval(-13.9 * Self.day))
        #expect(notice.line(f, onboarding: false, now: now) != nil, "not yet two weeks")
        f.firstNote = now.addingTimeInterval(-14 * Self.day)
        #expect(notice.line(f, onboarding: true, now: now) == nil)
        #expect(notice.isGone, "two weeks: gone for good")
        f.firstNote = now
        #expect(notice.line(f, onboarding: false, now: now) == nil, "and it never comes back")
        // Per account: another on this Mac has its own.
        let other = SetupNotice(defaults: defaults, account: UUID())
        #expect(other.line(f, onboarding: false, now: now) != nil)
        #expect(notice.goneKey == "sidebarSetup.notice.\(notice.account)" && notice.account == notice.account.lowercased())
    }

    /// Closed (either button) is gone for good, whatever the facts say after.
    @Test func aClosedNoticeNeverReturns() {
        let now = Date.now
        let (defaults, name) = Self.suite()
        let account = UUID()
        SetupNotice(defaults: defaults, account: account).close()
        let again = SetupNotice(defaults: UserDefaults(suiteName: name)!, account: account)
        #expect(again.isGone)
        #expect(again.line(SetupNoticeFacts(imported: false, firstNote: now), onboarding: false, now: now) == nil)
    }

    /// The clock starts at the account's sign-up day, never an imported note's own date, and is
    /// kept once known. An account whose sign-up date isn't known yet isn't taken for a new one.
    @Test func theTwoWeeksStartAtTheAccountsFirstNote() throws {
        let (defaults, _) = Self.suite()
        let notice = SetupNotice(defaults: defaults, account: UUID())
        let now = Date.now
        #expect(notice.firstNote(hasNotes: false, accountCreated: now.addingTimeInterval(-30 * Self.day), now: now) == nil, "no notes, no clock")
        #expect(notice.firstNote(hasNotes: true, accountCreated: nil, now: now) == nil, "sign-up date not known: nothing kept")
        let made = now.addingTimeInterval(-3 * Self.day)
        #expect(notice.firstNote(hasNotes: true, accountCreated: made, now: now) == made)
        #expect(notice.firstNote(hasNotes: true, accountCreated: nil, now: now.addingTimeInterval(Self.day)) == made, "kept")
        // Notes imported from Apple Notes keep their years-old dates: the clock isn't theirs.
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let old = c.mainContext.createNote(in: .all, body: "From 2019\n\ntext")
        old.createdAt = now.addingTimeInterval(-2_000 * Self.day)
        try c.mainContext.save()
        let fresh = SetupNotice(defaults: defaults, account: UUID())
        let facts = SetupNotice.facts(progress: SetupProgress(imported: true), context: c.mainContext, accountCreated: now, notice: fresh, now: now)
        #expect(facts == SetupNoticeFacts(imported: true, firstNote: now), "first note the sign-up day, not \(old.createdAt)")
        #expect(SetupNotice.facts(progress: nil, context: c.mainContext, accountCreated: now, notice: fresh, now: now).imported == nil)
    }

    /// Emil's account: made months ago, an AI connected, notes imported. It never sees the notice.
    @Test func anOlderAccountNeverSeesIt() throws {
        let (defaults, _) = Self.suite()
        let notice = SetupNotice(defaults: defaults, account: UUID())
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        _ = c.mainContext.createNote(in: .all, body: "Personal links\n\ntext")
        try c.mainContext.save()
        let facts = SetupNotice.facts(progress: SetupProgress(imported: true, connected: true, dismissed: true), context: c.mainContext,
                                      accountCreated: .now.addingTimeInterval(-120 * Self.day), notice: notice)
        #expect(notice.line(facts, onboarding: false) == nil)
        #expect(notice.isGone, "put away at once")
    }

    // MARK: In the window

    static func footFrames(_ host: AccountRowTests.Host) async -> [String: CGRect] {
        for _ in 0..<4 { await host.settle() }
        return FootProbe.frames
    }

    static func probing<T>(_ body: () async throws -> T) async rethrows -> T {
        HoverProbe.enabled = true
        FootProbe.frames = [:]
        FootProbe.notice = nil
        let store = AIChangesCenter.shared.store
        AIChangesCenter.shared.store = nil
        defer { HoverProbe.enabled = false; HoverProbe.reset(); FootProbe.frames = [:]; FootProbe.notice = nil; AIChangesCenter.shared.store = store }
        return try await body()
    }

    /// Templates is there for every account, new or old, done with setup or not; Connect an AI and
    /// Import notes are not rows any more.
    @Test(arguments: [
        (SetupProgress(), 0.0),
        (SetupProgress(imported: true, connected: true, dismissed: true), 0.0),
        (SetupProgress(imported: true, connected: true, dismissed: true), 120.0),
    ])
    func templatesNeverLeaves(progress: SetupProgress, ageDays: Double) async throws {
        try await Self.probing {
            let (defaults, _) = Self.suite()
            let host = try await AccountRowTests.Host(rows: true, progress: progress, defaults: defaults,
                                                      created: .now.addingTimeInterval(-ageDays * Self.day))
            defer { host.close() }
            let frames = await Self.footFrames(host)
            #expect(frames["sidebar.templates"] != nil, "Templates is in the foot: \(frames.keys.sorted())")
            #expect(frames["sidebar.connectAI"] == nil && frames["sidebar.import"] == nil, "no Connect an AI or Import notes row")
            let account = try #require(frames["sidebar.account"]), templates = try #require(frames["sidebar.templates"])
            #expect(abs(account.minY - templates.maxY - (SidebarStyle.pillGap + SidebarFoot.accountGap)) < 0.5,
                    "the gap under Templates is as it was: \(account.minY - templates.maxY)")
        }
        // And no way to take it out: the row has no right-click menu or Remove action any more.
        let file = try SettingsHomeTests.source("Pane/Views/SidebarAIs.swift")
        let start = try #require(file.range(of: "struct SidebarActionRow: View {"))
        let end = try #require(file.range(of: "\n}\n", range: start.upperBound..<file.endIndex))
        let row = file[start.upperBound..<end.lowerBound]
        #expect(!row.contains(".contextMenu") && !row.contains("Remove from Sidebar") && !row.contains("remove"))
        let rows = try #require(file.range(of: "struct SidebarStudyRows: View {"))
        let rowsEnd = try #require(file.range(of: "\n}\n", range: rows.upperBound..<file.endIndex))
        let foot = file[rows.upperBound..<rowsEnd.lowerBound]
        #expect(foot.contains("SidebarSetupRow.templates") && !foot.contains(".connect") && !foot.contains(".importNotes"))
    }

    /// A new account, setup over: the notice, above Templates, in the foot; its words change once
    /// an import has finished.
    @Test func theNoticeShowsAndFollowsTheImport() async throws {
        try await Self.probing {
            let (defaults, _) = Self.suite()
            let host = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), defaults: defaults, created: .now)
            defer { host.close() }
            var frames = await Self.footFrames(host)
            let card = try #require(frames[SetupNoticeCard.id], "the notice is in the foot: \(frames.keys.sorted())")
            let templates = try #require(frames["sidebar.templates"]), foot = try #require(frames["sidebar.foot"])
            #expect(card.maxY <= templates.minY, "above Templates and your account")
            #expect(abs(card.minY - foot.minY) < 0.5, "it starts the foot")
            #expect(card.minX >= foot.minX && card.maxX <= foot.maxX)
            // Its words start on the rows' icons' line.
            let words = try #require(frames["\(SetupNoticeCard.id).text"])
            #expect(abs(words.minX - (templates.minX + Hover.sidebarReach().leading)) < 0.5, "words at \(words.minX), Templates' icon at \(templates.minX + Hover.sidebarReach().leading)")
            #expect(FootProbe.notice == SetupNoticeWords.connectAndImport)
            host.setup.apply(SetupProgress(imported: true))
            frames = await Self.footFrames(host)
            #expect(FootProbe.notice == SetupNoticeWords.connect, "after an import: \(FootProbe.notice ?? "nothing")")
            #expect(frames[SetupNoticeCard.id] != nil)
        }
    }

    /// Never while the first-run flow is up; it comes once the flow is over.
    @Test func notDuringOnboarding() async throws {
        try await Self.probing {
            let (defaults, _) = Self.suite()
            let onboarding = OnboardingStore(defaults: TestDefaults())
            onboarding.showForPreview(.name)
            let host = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), defaults: defaults, created: .now, onboarding: onboarding)
            defer { host.close() }
            let frames = await Self.footFrames(host)
            #expect(frames[SetupNoticeCard.id] == nil && FootProbe.notice == nil, "no notice during onboarding")
            #expect(!SetupNotice(defaults: defaults, account: host.backend.userID!).isGone, "still to come")
        }
    }

    /// No notes yet, an older account, or a notice put away: none.
    @Test(arguments: ["no notes", "older", "closed"])
    func noNotice(_ why: String) async throws {
        try await Self.probing {
            let (defaults, _) = Self.suite()
            let account = UUID()
            if why == "closed" { SetupNotice(defaults: defaults, account: account).close() }
            let host = try await AccountRowTests.Host(foldersLater: why == "no notes", rows: true, progress: SetupProgress(), account: account,
                                                      defaults: defaults, created: why == "older" ? .now.addingTimeInterval(-15 * Self.day) : .now)
            defer { host.close() }
            let frames = await Self.footFrames(host)
            #expect(frames[SetupNoticeCard.id] == nil, "\(why): no notice")
            #expect(frames["sidebar.templates"] != nil, "\(why): Templates still")
            if why == "older" { #expect(SetupNotice(defaults: defaults, account: account).isGone, "an older account's is put away for good") }
        }
    }

    /// Each button puts it away for good: the notice leaves the foot, and a relaunch (a new window
    /// reading the defaults again) doesn't bring it back. Open Settings opens AI Connections.
    @Test(arguments: ["open", "close"])
    func eitherButtonPutsItAwayForGood(_ button: String) async throws {
        try await Self.probing {
            let (defaults, name) = Self.suite()
            let account = UUID()
            let first = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), account: account, defaults: defaults, created: .now)
            defer { SettingsRoute.shared.page = nil; SettingsRoute.shared.presenting = false }
            _ = await Self.footFrames(first)
            #expect(FootProbe.frames[SetupNoticeCard.id] != nil, "there to start with")
            // What the button does (an offscreen window that's never ordered in has no
            // accessibility tree to press it through, and no input event is ever posted).
            SetupNoticeCard.press(button == "open" ? .open : .close, SetupNotice(defaults: defaults, account: account))
            let templates = try #require(FootProbe.frames["sidebar.templates"]), you = try #require(FootProbe.frames["sidebar.account"])
            #expect(FootProbe.notice != nil)
            FootProbe.frames = [:]
            _ = await Self.footFrames(first)
            #expect(FootProbe.notice == nil, "gone from the foot")
            // The foot is Templates and you, with no room left where the notice was.
            let foot = try #require(FootProbe.frames["sidebar.foot"], "the foot shrank")
            let rest = templates.height + SidebarStyle.pillGap + SidebarFoot.accountGap + you.height
            #expect(abs(foot.height - rest) < 0.5, "the foot is \(foot.height) pt, Templates and you \(rest)")
            if button == "open" { #expect(SettingsRoute.shared.page == .ai || SettingsRoute.shared.target == .ai, "Settings at AI Connections") }
            first.close()
            FootProbe.frames = [:]
            let again = UserDefaults(suiteName: name)!
            #expect(SetupNotice(defaults: again, account: account).isGone, "written to the defaults")
            let second = try await AccountRowTests.Host(rows: true, progress: SetupProgress(), account: account, defaults: again, created: .now)
            defer { second.close() }
            let frames = await Self.footFrames(second)
            #expect(frames[SetupNoticeCard.id] == nil, "never comes back")
        }
    }

    /// Both buttons show hover: the link's underline and the ×'s quiet fill (the scan in
    /// AmberButtonTests checks every plain button; these aren't plain).
    @Test func bothButtonsHover() throws {
        let file = try SettingsHomeTests.source("Pane/Views/SidebarAIs.swift")
        let start = try #require(file.range(of: "struct SetupNoticeCard: View {"))
        let end = try #require(file.range(of: "\n}\n", range: start.upperBound..<file.endIndex))
        let card = file[start.upperBound..<end.lowerBound]
        #expect(card.contains(".buttonStyle(.hoverText)"), "Open Settings underlines under the pointer")
        #expect(card.contains(".buttonStyle(.quietIcon)"), "the × fills under the pointer")
        #expect(!card.contains(".buttonStyle(.plain)"))
        // Each button runs `press`, the action the window test runs.
        #expect(card.contains("Button(action: openSettings)") && card.contains("Self.press(.open, notice)"))
        #expect(card.contains("Button(action: close)") && card.contains("Self.press(.close, notice)"))
    }

    // MARK: The notice is true: Settings connects an AI and imports notes

    /// Settings › General has Import Notes…, which closes Settings and opens the import sheet;
    /// search finds it. AI Connections connects an AI.
    @Test func settingsImportsNotesAndConnectsAnAI() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let general = try await SettingsPageRowTests.ids(.general, backend: backend)
        #expect(general.contains("settings.importNotes"), "Import Notes… is on General: \(general)")
        #expect(GeneralCopy.importNotes == "Import Notes\u{2026}")
        let found = SettingsIndex.matches("import", available: Set(SettingsPage.allCases))
        #expect(found.contains { $0.id == "settings.importNotes" && $0.page == .general }, "search finds it")
        let pages = try SettingsHomeTests.source("Pane/Views/SettingsPages.swift")
        let start = try #require(pages.range(of: "struct GeneralSettingsPage: View {"))
        let end = try #require(pages.range(of: "\n}\n", range: start.upperBound..<pages.endIndex))
        let page = pages[start.upperBound..<end.lowerBound]
        #expect(page.contains("close()") && page.contains("NotificationCenter.default.post(name: .paneImportNotes"), "the same sheet as File › Import Notes")
        let settings = try SettingsHomeTests.source("Pane/Views/SettingsView.swift")
        #expect(settings.contains("case .general: GeneralSettingsPage(close: closeSettings)"))
        // AI Connections: the AIs to connect (with none yet) and Add an AI (with some).
        #expect(SettingsIndex.matches("connect chatgpt", available: Set(SettingsPage.allCases)).contains { $0.page == .ai })
        #expect(pages.contains("AIAddRows(installed:") && pages.contains("SettingsSubPageRow(page: .addAI"))
    }

    /// The import sheet the row asks for opens on the notes window, as from the account's menu.
    @Test func theImportNoticeOpensTheImportSheet() async throws {
        let host = try await AccountRowTests.Host()
        defer { host.close() }
        NotificationCenter.default.post(name: .paneImportNotes, object: nil)
        for _ in 0..<20 where host.popup != "importNotes" { await host.settle() }
        #expect(host.popup == "importNotes")
    }

    // MARK: Their other homes, as they were

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
