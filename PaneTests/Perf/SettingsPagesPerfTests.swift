#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// How long each page of Settings takes to its first drawn frame with a big library on disk:
/// 5,000 notes (the 40 latest long, as after pasting in a few big documents), a few folders. A
/// page is drawn offscreen (a borderless window far off screen, never ordered front), the way it
/// is the moment its sidebar row is pressed. Reports only: timing tests never gate (CLAUDE.md).
/// What keeps a page fast is checked by SettingsPagesLoadTests.
@MainActor @Suite(.serialized) struct SettingsPagesPerfTests {
    nonisolated static let count = 5_000

    nonisolated static let store = Task.detached(priority: .utility) { () -> URL in
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("SettingsPagesPerf-\(ProcessInfo.processInfo.processIdentifier)")
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent("library.store")
        let c = try! ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let ctx = ModelContext(c)
        ctx.autosaveEnabled = false
        var folders: [Folder] = []
        for i in 0..<12 {
            let f = Folder(name: "Folder \(i)", sortIndex: Double(i))
            f.dirty = false
            ctx.insert(f)
            folders.append(f)
        }
        let long = PerfFixtures.longNote(lines: 3000)
        for i in 0..<Self.count {
            let body = i < 40 || i % 100 == 0 ? "Long note \(i)\n" + long : "Note \(i)\n\nSome text for note \(i).\n- one\n- two\n"
            let n = Note(body: body, folder: folders[i % folders.count])
            n.updatedAt = Date().addingTimeInterval(Double(-i * 600))
            n.dirty = false
            ctx.insert(n)
            if i % 1000 == 999 { try! ctx.save() }
        }
        try! ctx.save()
        return url
    }

    static func ms(_ d: Duration) -> Double { Double(d.components.attoseconds) / 1e15 + Double(d.components.seconds) * 1000 }

    /// Draws a page in a window of its own until its first frame is on screen: the hosting
    /// view's first layout and display, then the turn its onAppear and first tasks start on.
    static func firstFrame(_ page: SettingsPage, library: ModelContainer) async -> Double {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let view = SettingsView(backend: backend, sync: nil, connections: [])
        let clock = ContinuousClock()
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: SettingsCard.pageWidth, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        let start = clock.now
        let host = NSHostingView(rootView: view.page(page).modelContainer(library))
        window.contentView = host
        host.layoutSubtreeIfNeeded()
        host.display()
        await Task.yield()
        host.layoutSubtreeIfNeeded()
        host.display()
        let took = ms(clock.now - start)
        window.contentView = nil
        window.close()
        return took
    }

    @Test(.timeLimit(.minutes(4))) func eachPagesFirstFrame() async throws {
        let url = await Self.store.value
        let pages: [SettingsPage] = [.account, .ai, .general, .appearance, .storage, .help, .security]
        // Cold: a library just opened, nothing of it read yet, as when Settings opens after launch.
        for page in pages {
            let library = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
            await PerfTiming.quietMainQueue()
            let cold = await Self.firstFrame(page, library: library)
            var warm: [Double] = []
            for _ in 0..<5 { warm.append(await Self.firstFrame(page, library: library)) }
            print("PERF settings page \(page) (\(Self.count) notes on disk): first frame cold \(String(format: "%.1f", cold)) ms, warm median \(String(format: "%.1f", PerfTiming.median(warm))) ms")
        }
    }

    /// General's parts on their own: its two menus' lists, and asking the system about Open at
    /// login (the real system here: a read, nothing changes).
    @Test(.timeLimit(.minutes(4))) func generalsParts() async throws {
        let url = await Self.store.value
        let library = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let choices = GeneralChoices(context: library.mainContext)
        let clock = ContinuousClock()
        let templates = clock.measure { _ = choices.templates(keeping: "") }
        let templatesAgain = clock.measure { _ = choices.templates(keeping: "") }
        let folders = clock.measure { _ = choices.folders(keeping: DailyNotes.folderName) }
        let system = SystemLoginService()
        let login = clock.measure { _ = system.isEnabled }
        let loginAgain = clock.measure { _ = system.isEnabled }
        // The same page with no notes at all: what's left is drawing the page itself.
        let none = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        _ = await Self.firstFrame(.general, library: none)
        var bare: [Double] = []
        for _ in 0..<5 { bare.append(await Self.firstFrame(.general, library: none)) }
        print("PERF settings general with no notes: first frame warm median \(String(format: "%.1f", PerfTiming.median(bare))) ms")
        print("PERF settings general parts: templates cold \(String(format: "%.1f", Self.ms(templates))) ms, again \(String(format: "%.1f", Self.ms(templatesAgain))) ms; folders \(String(format: "%.1f", Self.ms(folders))) ms; login status \(String(format: "%.1f", Self.ms(login))) ms, again \(String(format: "%.1f", Self.ms(loginAgain))) ms")
    }
}
#endif
