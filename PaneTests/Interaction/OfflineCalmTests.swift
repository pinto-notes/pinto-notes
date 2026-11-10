#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// While sync can't reach the server the app says so calmly (Emil, 10 November 2026, on "Can't
/// reach Pinto Notes" beside a spinner: "this scares me away from working offline"): every line
/// says the notes are safe, nothing looks like an error, no spinner turns against a connection
/// that's away, and the status opens a popover that says you can keep writing.
@MainActor @Suite(.serialized) struct OfflineCalmTests {
    // MARK: The words

    @Test func everyLineSaysTheNotesAreSafe() {
        #expect(OfflineCopy.lines(.online).isEmpty && OfflineCopy.line(.online) == nil)
        #expect(OfflineCopy.lines(.offline, device: "Mac") == ["Offline \u{00B7} saved on this Mac", "Offline \u{00B7} saved here", "Saved on this Mac"])
        #expect(OfflineCopy.lines(.unreachable, device: "Mac") == ["Sync paused \u{00B7} saved on this Mac", "Sync paused \u{00B7} saved here", "Saved on this Mac"])
        #expect(OfflineCopy.line(.offline, device: "iPhone") == "Offline \u{00B7} saved on this iPhone")
        #expect(OfflineCopy.line(.unreachable, device: "iPad") == "Sync paused \u{00B7} saved on this iPad")
        for reach in [SyncEngine.Reach.offline, .unreachable] {
            for device in ["Mac", "iPhone", "iPad"] {
                let lines = OfflineCopy.lines(reach, device: device)
                // Never a failure first, and nothing that shouts.
                for line in lines {
                    #expect(!line.hasPrefix("Can") && !line.contains("reach") && !line.contains("!") && !line.contains("\u{2014}"), "\(line)")
                }
                #expect(lines.first?.contains("saved on this \(device)") == true)
                // Whichever fits, it says the notes are saved.
                #expect(lines.allSatisfy { $0.lowercased().contains("saved") }, "\(lines)")
                // Longest first, so the first that fits is the most it can say.
                #expect(lines.map(\.count) == lines.map(\.count).sorted(by: >))
            }
            // With only the server away, nothing says "offline": the Wi-Fi is on.
            #expect(reach == .offline || OfflineCopy.lines(reach).allSatisfy { !$0.lowercased().contains("offline") })
        }
    }

    @Test func theSymbolIsNeverAnAlarm() {
        for reach in [SyncEngine.Reach.offline, .unreachable] {
            let name = OfflineCopy.symbol(reach)
            #expect(!name.contains("exclamationmark") && !name.contains("xmark") && !name.contains("triangle"), "\(name)")
            #expect(NSImage(systemSymbolName: name, accessibilityDescription: nil) != nil, "\(name) is a symbol the system has")
        }
    }

    @Test func thePopoverSaysYouCanKeepWriting() {
        for reach in [SyncEngine.Reach.offline, .unreachable] {
            let text = OfflineCopy.explanation(reach, device: "Mac")
            #expect(text.contains("Keep writing") && text.contains("saved on this Mac") && text.contains("syncs by itself") && text.contains("Your AI sees the changes after that"), "\(text)")
            #expect(!OfflineCopy.title(reach).contains("Can"))
        }
        #expect(OfflineCopy.title(.offline) == "You\u{2019}re offline")
        #expect(OfflineCopy.title(.unreachable) == "Sync is paused")
        #expect(!OfflineCopy.explanation(.unreachable).lowercased().contains("offline"))
        #expect(OfflineCopy.waiting(0) == nil)
        #expect(OfflineCopy.waiting(1) == "1 change is waiting to sync.")
        #expect(OfflineCopy.waiting(3) == "3 changes are waiting to sync.")
        #expect(OfflineCopy.tried(.online) == "Back online. Everything is synced.")
        #expect(OfflineCopy.tried(.offline).hasPrefix("Still offline"))
        #expect(!OfflineCopy.tried(.unreachable).lowercased().contains("offline"))
    }

    /// Settings says it in the same voice: the row beside Sync, and the banner at the top.
    @Test func settingsSaysItTheSameWay() {
        let last = Date(timeIntervalSince1970: 1_790_000_000)
        let at = last.formatted(date: .omitted, time: .shortened)
        #expect(SyncStatusLabel.away(.synced(last), reach: .offline) == "Offline \u{00B7} last synced \(at)")
        #expect(SyncStatusLabel.away(.synced(last), reach: .unreachable) == "Sync paused \u{00B7} last synced \(at)")
        // What the failed sync called it ("Sync paused", an error's words) never shows while the
        // connection is what's away: the calm lead does, and in plain grey, not orange.
        #expect(SyncStatusLabel.away(.offline(SyncEngine.describe(URLError(.timedOut))), reach: .unreachable) == "Sync paused")
        #expect(SyncStatusLabel.away(.offline(SyncEngine.describe(URLError(.notConnectedToInternet))), reach: .offline) == "Offline")
        #expect(SyncStatusLabel.isCalm("anything", reach: .unreachable) && SyncStatusLabel.isCalm("Offline", reach: .online))
        #expect(!SyncStatusLabel.isCalm("Storage is full", reach: .online), "a real problem stays orange")
        #expect(!SyncEngine.describe(URLError(.cannotConnectToHost)).contains("server"))
        #expect(!OfflineCopy.settings(.unreachable).hasPrefix("Can") && OfflineCopy.settings(.unreachable).contains("work as usual"))
        #expect(OfflineCopy.settings(.offline).contains("work as usual"))
    }

    // MARK: The spinner

    /// The spinner by your name turns for a sync that is getting through, never for a try against
    /// a connection that's away.
    @Test func noSpinnerWhileTheServerIsAway() {
        #expect(OfflineCopy.spins(.syncing, reach: .online))
        #expect(!OfflineCopy.spins(.syncing, reach: .unreachable))
        #expect(!OfflineCopy.spins(.syncing, reach: .offline))
        #expect(!OfflineCopy.spins(.idle, reach: .online) && !OfflineCopy.spins(.synced(.now), reach: .online))
        let foot = (try? String(contentsOfFile: Self.source("Pane/Views/SidebarAIs.swift"), encoding: .utf8)) ?? ""
        #expect(foot.contains("SyncSpinner(syncing: OfflineCopy.spins("), "the foot's spinner asks OfflineCopy.spins")
        #expect(!foot.contains("SyncSpinner(syncing: sync?.status == .syncing)"))
    }

    // MARK: Try now

    @Test func tryNowSaysWhatItFound() async throws {
        let away = OfflineStandIn(.unreachable, returns: false, takes: .milliseconds(30))
        let status = OfflineStatus()
        status.noticed(away.reach)
        status.toggle()
        #expect(status.showing && status.shows(away.reach))
        await status.tryNow(away, hold: .milliseconds(60))
        #expect(status.found == .unreachable && !status.trying)
        try await Task.sleep(for: .milliseconds(150))
        #expect(status.showing, "still away: the popover stays, with what it found")

        let back = OfflineStandIn(.offline, returns: true, takes: .milliseconds(30))
        let s = OfflineStatus()
        s.noticed(back.reach)
        s.toggle()
        await s.tryNow(back, hold: .milliseconds(60))
        #expect(s.found == .online && back.reach == .online)
        // The line stays while the popover says "Back online", and still speaks of where it was.
        #expect(s.shows(.online) && s.spoken(.online) == .offline)
        try await Task.sleep(for: .milliseconds(200))
        #expect(!s.showing && !s.shows(.online), "then both go by themselves")
        // Closing it by hand forgets what was found.
        let t = OfflineStatus()
        t.toggle()
        await t.tryNow(away, hold: .milliseconds(60))
        t.toggle()
        #expect(!t.showing && t.found == nil)
    }

    // MARK: Where it sits

    /// Under your name, with a cloud beside the name: no row of its own, and nothing in the foot
    /// moves when it shows.
    @Test(arguments: [SyncEngine.Reach.offline, .unreachable])
    func theWordsSitUnderYourName(reach: SyncEngine.Reach) async throws {
        let plain = try await Self.laidOut(.online, width: 240)
        let frames = try await Self.laidOut(reach, width: 240)
        #expect(frames["sidebar.offline"] == nil, "no row of its own")
        let words = try #require(frames["sidebar.offline.title"], "the words are in the account row: \(frames.keys.sorted())")
        let cloud = try #require(frames["sidebar.offline.cloud"], "and the cloud")
        let name = try #require(frames["sidebar.account.name"]), account = try #require(frames["sidebar.account"])
        #expect(abs(words.minX - name.minX) < 0.5, "on your name's line: \(words.minX) against \(name.minX)")
        #expect(words.minY >= name.maxY - 1.5, "under it: \(words) under \(name)")
        #expect(words.height < 16, "one small line: \(words.height)")
        #expect(words.maxX <= account.maxX + 0.5 && cloud.maxX <= account.maxX + 0.5, "inside the row's pill: \(words), \(cloud) in \(account)")
        #expect(abs(cloud.midY - name.midY) < 2 && cloud.minX >= name.maxX, "the cloud is beside your name: \(cloud) by \(name)")
        let before = try #require(plain["sidebar.account"]), foot = try #require(frames["sidebar.foot"]), footBefore = try #require(plain["sidebar.foot"])
        #expect(abs(account.height - before.height) < 0.5 && abs(foot.height - footBefore.height) < 0.5, "nothing moves when it shows: \(foot.height) against \(footBefore.height)")
        for id in ["sidebar.templates", "sidebar.connectAI", "sidebar.import"] {
            #expect(frames[id] == plain[id], "\(id) stays where it was")
        }
    }

    /// The whole line whenever it fits (at the sidebar's usual widths it does, for both states);
    /// a shorter one only where it truly doesn't, and never cut or wrapped.
    @Test func theFullLineShowsWheneverItFits() async throws {
        func width(_ s: String) -> CGFloat { (s as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 11)]).width }
        for reach in [SyncEngine.Reach.offline, .unreachable] {
            let lines = OfflineCopy.lines(reach, device: InstallID.kind)
            for sidebar in [260.0, 270.0, 320.0] {
                let words = try #require(try await Self.laidOut(reach, width: sidebar)["sidebar.offline.title"])
                #expect(abs(words.width - width(lines[0])) < 2, "\(lines[0]) whole at \(sidebar): \(words.width) against \(width(lines[0]))")
            }
            // The narrowest sidebar: whichever is the longest that fits, whole.
            let frames = try await Self.laidOut(reach, width: 240)
            let words = try #require(frames["sidebar.offline.title"]), account = try #require(frames["sidebar.account"]), name = try #require(frames["sidebar.account.name"])
            let room = account.maxX - Hover.sidebarReach().trailing - name.minX
            let fits = try #require(lines.first { width($0) <= room }, "something fits \(room) pt")
            #expect(abs(words.width - width(fits)) < 2, "\(fits) at 240: \(words.width) against \(width(fits)), room \(room)")
        }
    }

    /// While a status shows, the whole account row opens its popover; otherwise Settings at Account.
    @Test func theAccountRowOpensThePopoverWhileSyncIsAway() {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com", userID: UUID())
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "offline-calm-\(UUID())")!)
        let status = OfflineStatus()
        AccountButton(backend: backend, offline: (OfflineStandIn(.unreachable), status)).activate(route)
        #expect(status.showing && route.opened == 0, "the popover, not Settings")
        AccountButton(backend: backend, offline: (OfflineStandIn(.unreachable), status)).activate(route)
        #expect(!status.showing, "and again closes it")
        AccountButton(backend: backend).activate(route)
        #expect(route.opened == 1 && route.target == .account)
    }

    /// Online, nothing shows.
    @Test func nothingShowsOnline() async throws {
        let frames = try await Self.laidOut(.online, width: 260)
        #expect(frames["sidebar.offline.title"] == nil && frames["sidebar.offline.cloud"] == nil)
    }

    /// The Mac's sidebar no longer shows the old line over the foot: the account row says it.
    @Test func theOldLineIsGoneFromTheMacSidebar() throws {
        let sidebar = try String(contentsOfFile: Self.source("Pane/Views/SidebarView.swift"), encoding: .utf8)
        let mac = try #require(sidebar.range(of: "private func footed"))
        let foot = String(sidebar[mac.lowerBound...].prefix(3000))
        #expect(!foot.contains("OfflineLine(sync: sync)"))
    }

    // MARK: Pictures (TEST_RUNNER_OFFLINE_SHOTS=<dir>)

    @Test(arguments: [false, true])
    func shots(dark: Bool) async throws {
        guard let dir = ProcessInfo.processInfo.environment["OFFLINE_SHOTS"] else { return }
        try FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        let mode = dark ? "dark" : "light"
        for (state, reach) in [("offline", SyncEngine.Reach.offline), ("paused", .unreachable)] {
            for width in [240.0, 260.0, 270.0] {
                let host = try Self.host(reach, width: width, dark: dark)
                await Self.settle(host)
                try Self.write(host, to: "\(dir)/foot-\(state)-\(Int(width))-\(mode).png")
            }
        }
        let hovered = try Self.host(.offline, width: 270, dark: dark, hovered: ["sidebar.account"])
        await Self.settle(hovered)
        try Self.write(hovered, to: "\(dir)/foot-offline-pointer-\(mode).png")
        let online = try Self.host(.online, width: 270, dark: dark)
        await Self.settle(online)
        try Self.write(online, to: "\(dir)/foot-online-\(mode).png")
        for (state, reach) in [("offline", SyncEngine.Reach.offline), ("paused", .unreachable)] {
            let container = try Self.container(waiting: 3)
            let status = OfflineStatus()
            let view = OfflinePopover(source: OfflineStandIn(reach), status: status)
                .background(Color(nsColor: .windowBackgroundColor))
                .modelContainer(container)
            let host = NSHostingView(rootView: AnyView(view))
            host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            host.frame = CGRect(origin: .zero, size: host.fittingSize)
            await Self.settle(host)
            try Self.write(host, to: "\(dir)/popover-\(state)-\(mode).png")
        }
    }

    // MARK: Helpers

    static func source(_ path: String) -> String {
        URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent(path).path
    }

    static func container(waiting: Int = 0) throws -> ModelContainer {
        let container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = container.mainContext
        let notes = ctx.createFolder(named: "Notes")
        notes.dirty = false
        for i in 0..<max(waiting, 1) {
            let n = ctx.createNote(in: .folder(notes.id), body: "Note \(i)\n\ntext")
            n.dirty = i < waiting
        }
        try ctx.save()
        return container
    }

    static func host(_ reach: SyncEngine.Reach, width: CGFloat, dark: Bool = false, hovered: Set<String> = []) throws -> NSHostingView<AnyView> {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com", userID: UUID())
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        let view = SidebarFoot(backend: backend, rows: true, offline: OfflineStandIn(reach))
            .padding(.vertical, 8)
            .frame(width: width, alignment: .leading)
            .background(Color(nsColor: .windowBackgroundColor))
            .environment(\.sidebarStudy, SidebarStudy())
            .environment(\.hoverPreview, hovered)
            .environment(backend)
            .modelContainer(try container())
        let host = NSHostingView(rootView: AnyView(view))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        host.frame = CGRect(origin: .zero, size: CGSize(width: width, height: host.fittingSize.height))
        return host
    }

    static func settle(_ host: NSView) async {
        for _ in 0..<4 {
            host.layoutSubtreeIfNeeded()
            host.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(80))
        }
    }

    /// The foot's parts as laid out, by their probe names.
    static func laidOut(_ reach: SyncEngine.Reach, width: CGFloat) async throws -> [String: CGRect] {
        HoverProbe.enabled = true
        FootProbe.frames = [:]
        defer { HoverProbe.enabled = false; HoverProbe.reset(); FootProbe.frames = [:] }
        let host = try host(reach, width: width)
        await settle(host)
        return FootProbe.frames
    }

    static func write(_ host: NSView, to path: String) throws {
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        try #require(rep.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: path))
    }
}
#endif
