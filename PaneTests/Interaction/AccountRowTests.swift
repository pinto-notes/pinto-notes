#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The account at the foot of the sidebar (owner, 2026-10-29): clicking it opens Settings at its
/// first page, as ⌘, does, and leaves the notes window as it was; its highlight sits where a
/// folder row's pill sits, with the photo on the folder icons' line ("why is the button here
/// weirdly indented on the left side").
@MainActor @Suite(.serialized) struct AccountRowTests {
    /// The notes window, signed in, in a window that is never ordered in.
    @MainActor final class Host {
        let window: NSWindow
        let container: ModelContainer

        init(nested: Bool = false, foldersLater: Bool = false, behindCard: Bool = false) async throws {
            container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            let ctx = container.mainContext
            if !foldersLater {
                let notes = ctx.createFolder(named: "Notes")
                for i in 0..<4 { _ = ctx.createNote(in: .folder(notes.id), body: "Note \(i)\n\ntext") }
            }
            if nested {
                let work = ctx.createFolder(named: "Work")
                ctx.move(ctx.createFolder(named: "Acme"), into: work)
            }
            try ctx.save()
            let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com", userID: UUID())
            ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
            let notes = RootView()
                .environment(backend)
                .environment(SyncEngine(backend: backend, context: ctx))
                .environment(SetupStore(progress: SetupProgress(connected: true, dismissed: true)))
            // `behindCard`: as the first run shows it, under a setup card (AppGate.notesBehind).
            let view = Group {
                if behindCard { notes.modifier(BehindSetupCard(card: Text("A setup card").padding(40))) } else { notes }
            }
                .modelContainer(container)
            window = NSWindow(contentRect: NSRect(x: -30000, y: -30000, width: 1180, height: 760),
                              styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            let host = NSHostingController(rootView: view)
            host.sizingOptions = []
            window.contentViewController = host
            window.setContentSize(CGSize(width: 1180, height: 760))
            window.setFrameOrigin(CGPoint(x: -30000, y: -30000))
            await settle()
        }

        func settle() async {
            for _ in 0..<8 { window.contentView?.layoutSubtreeIfNeeded(); window.displayIfNeeded(); try? await Task.sleep(for: .milliseconds(150)) }
        }

        func close() {
            window.close()
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
        }

        private var root: NSView { window.contentView! }


        /// The columns' widths, left to right.
        var columns: [Int] {
            func splits(_ v: NSView) -> [NSSplitView] { ((v as? NSSplitView).map { [$0] } ?? []) + v.subviews.flatMap(splits) }
            return splits(root).flatMap { $0.arrangedSubviews.map { Int($0.frame.width) } }
        }

        /// The toolbar's items by what they say (SwiftUI may make an item again under a new identifier).
        var toolbar: [String] { window.toolbar.map { t in t.items.map(\.label) + ["visible \(t.isVisible)"] } ?? [] }

        /// The sidebar's list: the leftmost one.
        var sidebarList: NSTableView? {
            func tables(_ v: NSView) -> [NSTableView] { ((v as? NSTableView).map { [$0] } ?? []) + v.subviews.flatMap(tables) }
            return tables(root).min { $0.convert($0.bounds, to: root).minX < $1.convert($1.bounds, to: root).minX }
        }

        /// The sidebar's own view (the glass the rows and the account row are laid out in) and the
        /// "Notes" row's content, in window coordinates.
        func sidebarAndNotesRow() throws -> (sidebar: CGRect, row: CGRect) {
            let list = try #require(sidebarList)
            var host: NSView? = list
            while let v = host, !String(describing: type(of: v)).hasPrefix("NSHostingView") { host = v.superview }
            let sidebar = try #require(host).convert(try #require(host).bounds, to: root)
            // The first row that isn't a heading: the top-level folder "Notes" (folders sort by name,
            // and "Notes" comes before "Work").
            let r = try #require((0..<list.numberOfRows).first { !list.isHeadingRow($0) && list.view(atColumn: 0, row: $0, makeIfNecessary: true) is NSTableCellView })
            let cell = try #require(list.view(atColumn: 0, row: r, makeIfNecessary: true))
            return (sidebar, cell.convert(cell.bounds, to: root))
        }
    }

    @Test(arguments: [false, true])
    func theAccountRowLinesUpWithTheFolderRows(nested: Bool) async throws {
        let host = try await Host(nested: nested)
        defer { host.close() }
        let (sidebar, row) = try host.sidebarAndNotesRow()
        let reach = Hover.sidebarReach()
        // The folder row's pill, from the sidebar's edges, as the list lays it out.
        let pill = (leading: row.minX - reach.leading - sidebar.minX, trailing: sidebar.maxX - (row.maxX + reach.trailing))
        let content = SidebarStyle.rowContent(nested: nested)
        #expect(row.minX - sidebar.minX == content.leading && sidebar.maxX - row.maxX == content.trailing,
                "the list puts a row's content \(row.minX - sidebar.minX) and \(sidebar.maxX - row.maxX) pt in; the account row expects \(content)")
        // The account row: its highlight is the button, padded in from the sidebar's edges.
        let account = SidebarStyle.rowPill(nested: nested)
        #expect(account.leading == pill.leading && account.trailing == pill.trailing, "the account's highlight \(account) against the folder's pill \(pill)")
        #expect(account.leading + AccountButton.inset == row.minX - sidebar.minX, "the photo starts where the folder icon does")
        #expect(abs(account.leading - account.trailing) <= 5, "about as far in on the left as on the right")
    }

    /// A first sync brings the first folder into an empty sidebar: the rows still start below the
    /// window's buttons, not up under them (Emil, 2 November 2026, a new account's "Notes"). Also
    /// under a setup card, where the notes once ignored clicks with `.allowsHitTesting(false)` and
    /// the sidebar lost its room for the toolbar ("very messed up", the same day).
    @Test(arguments: [(false, false), (true, false), (true, true)])
    func theFirstRowIsBelowTheWindowsButtons(foldersLater: Bool, behindCard: Bool) async throws {
        let host = try await Host(foldersLater: foldersLater, behindCard: behindCard)
        defer { host.close() }
        if foldersLater {
            // A new account: one folder, no notes in it, so the note pane is empty.
            _ = host.container.mainContext.createFolder(named: "Notes")
            try host.container.mainContext.save()
            await host.settle()
        }
        let (_, row) = try host.sidebarAndNotesRow()
        let buttons = try #require(host.window.standardWindowButton(.closeButton))
        let below = buttons.convert(buttons.bounds, to: host.window.contentView!)
        // In flipped terms: the row's top is under the buttons' bottom.
        let contentHeight = host.window.contentView!.bounds.height
        let rowTop = host.window.contentView!.isFlipped ? row.minY : contentHeight - row.maxY
        let buttonsBottom = host.window.contentView!.isFlipped ? below.maxY : contentHeight - below.minY
        #expect(rowTop >= buttonsBottom, "the first row starts at \(rowTop), the window's buttons end at \(buttonsBottom)")
        if behindCard {
            // Behind a setup card a click on a folder, the list or the note lands on the sink, not
            // on them (Emil, 2 November 2026: he could open notes behind the card).
            let content = host.window.contentView!
            for x in [row.midX, content.bounds.width * 0.4, content.bounds.width * 0.85] {
                let hit = content.hitTest(NSPoint(x: x, y: content.bounds.height * 0.25))
                #expect(hit is SetupClickSink.Sink, "a click at x \(Int(x)) reached \(String(describing: hit.map { type(of: $0) }))")
            }
        }
    }

    @Test func clickingOpensSettingsAtItsFirstPage() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "account-row-\(UUID())")!)
        route.tab = .storage
        AccountButton.open(route)
        #expect(route.presenting, "Settings shows on the notes window, as with ⌘,")
        #expect(route.target == nil, "on its first page, not straight onto Profile")
        #expect(SettingsPlace.groups(available: Set(SettingsPlace.allCases)).joined().contains(.account), "the account's page is on that first page")
        #expect(SettingsIndex.matches("Name", available: [.profile]).map(\.place) == [.profile])
        #expect(SettingsIndex.matches("Signed in with", available: [.profile]).map(\.place) == [.profile])
        #expect(SettingsIndex.matches("Sign Out", available: [.profile]).map(\.place) == [.profile], "name, how you sign in and Sign Out… stay in Settings, on Profile")
    }

    /// Opening Settings from the account row leaves the notes window as it was: the same columns,
    /// the same toolbar. (The old sheet's `.toolbar(.hidden)` once hid the window's toolbar.) The
    /// card shows over the notes at its first page, and links open theirs in it.
    @Test func openingSettingsKeepsTheWindowAsItWas() async throws {
        let host = try await Host()
        defer { host.close(); SettingsRoute.shared.page = nil }
        let columns = host.columns, toolbar = host.toolbar
        #expect(columns.count == 3 && !toolbar.isEmpty)
        let sheets = { NSApp.windows.filter { String(describing: type(of: $0)).contains("Sheet") }.count }
        let before = sheets()
        AccountButton.open()
        await host.settle()
        #expect(!SettingsRoute.shared.presenting, "the notes window took it")
        #expect(SettingsRoute.shared.page == .ai, "the card shows, at its first page")
        #expect(sheets() == before, "a card over the notes, not a sheet")
        #expect(host.columns == columns, "the columns keep their widths")
        #expect(host.toolbar == toolbar, "the toolbar keeps its items")
        // Links into Settings open their page in the card.
        for (tab, place) in [(SettingsTab.account, SettingsPlace.profile), (.storage, .storage), (.general, .general), (.appearance, .appearance), (.ai, .ai)] {
            SettingsRoute.shared.open(tab)
            await host.settle()
            #expect(SettingsRoute.shared.page == place, "\(tab) opens \(place)")
        }
        #expect(host.columns == columns && host.toolbar == toolbar, "an inner page of Settings leaves the window as it was too")
        // Appearance is its own page, and not part of General any more.
        SettingsRoute.shared.open(.appearance)
        await host.settle()
        #expect(AppearancePage.onScreen == 1, "Appearance's page shows its mode, theme and accent")
        SettingsRoute.shared.open(.general)
        await host.settle()
        #expect(SettingsRoute.shared.page == .general)
        #expect(AppearancePage.onScreen == 0, "General has no theme, mode or accent any more")
        let views = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().appending(path: "Pane/Views")
        for (file, start, end) in [("SettingsHome.swift", "struct GeneralPage", "struct HelpPage"), ("SettingsView.swift", "struct GeneralSettings", "struct AccountSettings")] {
            let src = try String(contentsOf: views.appending(path: file), encoding: .utf8)
            let general = try #require(src.range(of: start).flatMap { a in src.range(of: end, range: a.upperBound..<src.endIndex).map { src[a.lowerBound..<$0.lowerBound] } })
            #expect(!general.contains("AppearanceSection") && !general.contains("AppearancePage"), "\(start) leaves Appearance to its own page")
        }
    }

    /// The account row under the pointer in a sidebar-wide strip, light and dark, for looking at.
    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let backend = Backend()
        backend.showSignedInForPreview(email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let pill = SidebarStyle.rowPill(nested: false)
        let row = AccountButton(backend: backend)
            .padding(.leading, pill.leading)
            .padding(.trailing, pill.trailing)
            .frame(width: 230)
            .padding(.vertical, 8)
            .environment(\.hoverPreview, ["*"])
            .tint(Color(PColor.paneAccent))
        try await AppSnapshotTests.render(row, name: "mac-account-row-hover-\(dark ? "dark" : "light")", dark: dark)
    }
}
#endif
