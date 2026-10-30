#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Today's note and templates in the real editor and the real menus: a template that starts with
/// {{title}} puts the cursor in the title, ⌘T is Today's Note and nothing else, and Go to Note…
/// runs both. Pictures light and dark when PANE_SNAPSHOT_DIR is set.
@MainActor @Suite(.serialized) struct DailyNotesEditorTests {
    @Test func aTemplateWithItsTitleLeftEmptyPutsTheCursorInTheTitle() async {
        let body = DailyNotes.fill("{{title}}\nAttendees:\n- ", title: nil)
        let h = await EditorHarness(body, focus: false)
        defer { h.close() }
        h.view.takeNewNoteFocus()
        await h.settle()
        #expect(h.window.firstResponder === h.view)
        #expect(h.selection == NSRange(location: 0, length: 0), "the cursor is on the empty first line, the title")
        h.view.insertText("Planning with Sam", replacementRange: h.selection)
        #expect(NoteText.title(of: h.text) == "Planning with Sam")
    }

    @Test func aNoteWithATitleKeepsTheCursorWhereItWas() async {
        let h = await EditorHarness("30 October 2026\n", focus: false)
        defer { h.close() }
        let before = h.selection
        h.view.takeNewNoteFocus()
        await h.settle()
        #expect(h.window.firstResponder === h.view)
        #expect(h.selection == before)
    }

    /// File › Today's Note has ⌘T, and no other item in the menu bar answers it.
    @Test func commandTIsTodaysNoteAlone() throws {
        guard let main = NSApp.mainMenu, main.items.contains(where: { $0.title == "File" }) else { Issue.record("the test host has no menu bar to check"); return }
        func items(_ menu: NSMenu) -> [NSMenuItem] { menu.items.flatMap { [$0] + ($0.submenu.map(items) ?? []) } }
        let all = items(main)
        let t = all.filter { $0.keyEquivalent == "t" && $0.keyEquivalentModifierMask.intersection(.deviceIndependentFlagsMask) == .command }
        #expect(t.map(\.title) == ["Today\u{2019}s Note"])
        #expect(all.contains { $0.title == "New from Template" && $0.submenu != nil })
    }

    @Test func goToNoteRunsTodaysNoteAndTheTemplates() {
        let meeting = TemplateItem(id: UUID(), name: "Meeting")
        let commands = QuickOpen.commands(openNote: false, pinned: false, importKinds: [], templates: [meeting])
        func found(_ q: String) -> [QuickOpen.Action] { QuickOpen.commands(commands, matching: q).map(\.action) }
        #expect(found("today") == [.todaysNote])
        #expect(found("meeting") == [.newFromTemplate(meeting.id)])
        #expect(found("template").first == .newFromTemplate(meeting.id))
        #expect(found("template").contains(.newTemplate))
        #expect(commands.first { $0.action == .todaysNote }?.shortcut == "⌘T", "the panel shows the menu's key")
        // Two templates with one name are two rows.
        let twin = TemplateItem(id: UUID(), name: "Meeting")
        let both = QuickOpen.commands(openNote: false, pinned: false, importKinds: [], templates: [meeting, twin])
        #expect(Set(both.map(\.id)).count == both.count)
    }

    // MARK: Pictures

    @Test func snapshots() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_SNAPSHOT_DIR"] else { return }
        let out = URL(fileURLWithPath: dir)
        let context = ModelContext(try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let templates = context.createFolder(named: "Templates")
        context.createNote(in: .folder(templates.id), body: "Daily\n\n## Plan\n- [ ] \n\n## Notes\n\nStarted at {{time}}.")
        let today = context.openTodaysNote(locale: Locale(identifier: "en_GB")).note
        for dark in [false, true] {
            let h = await EditorHarness(today.body, width: 640, height: 420, dark: dark)
            let path = await h.snapshot("daily-note-\(dark ? "dark" : "light")")
            h.close()
            try? FileManager.default.removeItem(at: out.appending(path: URL(fileURLWithPath: path).lastPathComponent))
            try FileManager.default.copyItem(at: URL(fileURLWithPath: path), to: out.appending(path: URL(fileURLWithPath: path).lastPathComponent))
        }
        let commands = QuickOpen.commands(openNote: false, pinned: false, importKinds: [],
                                          templates: [TemplateItem(id: UUID(), name: "Daily"), TemplateItem(id: UUID(), name: "Meeting"), TemplateItem(id: UUID(), name: "Weekly review")])
        DateBucket.locale = Locale(identifier: "en_GB")
        defer { DateBucket.locale = .autoupdatingCurrent }
        for (name, query) in [("today", "today"), ("template", "template")] {
            for dark in [false, true] {
                let panel = QuickOpenPanel(notes: QuickOpenTests.library, commands: commands, choose: { _ in }, close: {}, initialQuery: query)
                let host = NSHostingView(rootView: panel.padding(40).background(Color(nsColor: .windowBackgroundColor)))
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                let png = try #require(rep.representation(using: .png, properties: [:]))
                try png.write(to: out.appending(path: "quickopen-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
}
#endif
