#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Today's note in the real menus and the editor: ⌘T is Today's Note and nothing else, Go to Note…
/// runs it, and a new day's note is its date as a title. Pictures light and dark when
/// PANE_SNAPSHOT_DIR is set.
@MainActor @Suite(.serialized) struct DailyNotesEditorTests {
    /// File › Today's Note has ⌘T, and no other item in the menu bar answers it.
    @Test func commandTIsTodaysNoteAlone() throws {
        guard let main = NSApp.mainMenu, main.items.contains(where: { $0.title == "File" }) else { Issue.record("the test host has no menu bar to check"); return }
        func items(_ menu: NSMenu) -> [NSMenuItem] { menu.items.flatMap { [$0] + ($0.submenu.map(items) ?? []) } }
        let all = items(main)
        let t = all.filter { $0.keyEquivalent == "t" && $0.keyEquivalentModifierMask.intersection(.deviceIndependentFlagsMask) == .command }
        #expect(t.map(\.title) == ["Today\u{2019}s Note"])
        #expect(!all.contains { $0.title.localizedCaseInsensitiveContains("template") }, "no templates of your own in the menus")
    }

    @Test func goToNoteRunsTodaysNote() {
        let commands = QuickOpen.commands(openNote: false, pinned: false, importKinds: [])
        func found(_ q: String) -> [QuickOpen.Action] { QuickOpen.commands(commands, matching: q).map(\.action) }
        #expect(found("today") == [.todaysNote])
        #expect(found("daily") == [.todaysNote])
        #expect(found("journal") == [.todaysNote])
        #expect(commands.first { $0.action == .todaysNote }?.shortcut == "⌘T", "the panel shows the menu's key")
        #expect(found("template").isEmpty)
    }

    // MARK: Pictures

    @Test func snapshots() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SNAPSHOT_DIR"] else { return }
        let out = URL(fileURLWithPath: dir)
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let today = context.openTodaysNote(locale: Locale(identifier: "en_GB")).note
        for dark in [false, true] {
            let h = await EditorHarness(today.body + "Slept well. Call Anna about Saturday.", width: 640, height: 420, dark: dark)
            let path = await h.snapshot("mac-daily-note-\(dark ? "dark" : "light")")
            h.close()
            let name = URL(fileURLWithPath: path).lastPathComponent
            try? FileManager.default.removeItem(at: out.appending(path: name))
            try FileManager.default.copyItem(at: URL(fileURLWithPath: path), to: out.appending(path: name))
        }
        let commands = QuickOpen.commands(openNote: false, pinned: false, importKinds: [])
        DateBucket.locale = Locale(identifier: "en_GB")
        defer { DateBucket.locale = .autoupdatingCurrent }
        for dark in [false, true] {
            let panel = QuickOpenPanel(notes: QuickOpenTests.library, commands: commands, choose: { _ in }, close: {}, initialQuery: "today")
            let host = NSHostingView(rootView: panel.padding(40).background(Color(nsColor: .windowBackgroundColor)))
            host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            host.frame = CGRect(origin: .zero, size: host.fittingSize)
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            let png = try #require(rep.representation(using: .png, properties: [:]))
            try png.write(to: out.appending(path: "mac-quickopen-today-\(dark ? "dark" : "light").png"))
        }
    }
}
#endif
