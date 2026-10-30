#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A note in Recently Deleted on the Mac, the Notes way (Emil, 10-30): no banner over it, no
/// writing tools, compose or Share; typing or clicking into it asks to recover it and changes
/// nothing; Recover puts it back in its folder, open and editable. Offscreen windows only.
@MainActor @Suite(.serialized) struct RecentlyDeletedEditTests {
    // MARK: The editor

    @Test func typingIntoADeletedNoteAsksToRecoverAndChangesNothing() async {
        let h = await EditorHarness("Plan\nMilk and eggs")
        defer { h.close() }
        var asked = 0
        h.controller.readOnly = true
        h.controller.askToRecover = { asked += 1 }
        h.view.isEditable = false
        await h.caret(after: "Milk")
        await h.key(0, "a")
        await h.press(EditorHarness.returnKey)
        await h.press(EditorHarness.delete)
        #expect(h.text == "Plan\nMilk and eggs", "nothing typed lands")
        #expect(asked == 3, "each try asks to recover")
        // Moving around and copying still work, without asking.
        await h.press(EditorHarness.left)
        await h.press(EditorHarness.down)
        await h.key(8, "c", .command)
        #expect(asked == 3)
    }

    @Test func clickingIntoADeletedNoteAsksToRecover() async {
        let h = await EditorHarness("Plan\n- [ ] Milk\nSome text to click on")
        defer { h.close() }
        var asked = 0
        h.controller.readOnly = true
        h.controller.askToRecover = { asked += 1 }
        h.view.isEditable = false
        let line = h.lineRect(at: (h.text as NSString).range(of: "Some").location)
        await h.click(CGPoint(x: line.minX + 40, y: line.midY))
        #expect(asked == 1, "a click into the text asks")
        // The checklist circle: asks, and the item stays open.
        let item = h.lineRect(at: (h.text as NSString).range(of: "- [ ]").location)
        let circle = h.view.core.checkboxRect(line: (h.text as NSString).range(of: "- [ ]").location, layout: h.view.textLayoutManager)
        let p = circle.map { CGPoint(x: $0.midX + h.view.textContainerOrigin.x, y: $0.midY + h.view.textContainerOrigin.y) }
            ?? CGPoint(x: item.minX + 8, y: item.midY)
        await h.click(p)
        #expect(h.text.contains("- [ ] Milk"), "the tick doesn't land")
        #expect(asked == 2)
    }

    @Test func aLiveNoteNeverAsks() async {
        let h = await EditorHarness("Plan")
        defer { h.close() }
        var asked = 0
        h.controller.askToRecover = { asked += 1 }
        await h.caret(after: "Plan")
        await h.key(0, "a")
        #expect(h.text == "Plana")
        #expect(asked == 0)
    }

    // MARK: The window

    /// The demo library's window with `note` open in Recently Deleted.
    private static func deletedNoteWindow(_ c: ModelContainer, _ note: Note, dark: Bool = false) async -> NSWindow {
        let w = MacWindowChromeTests.window(c, size: CGSize(width: 1469, height: 920))
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        await MacWindowChromeTests.settle(w)
        c.mainContext.trash(note)
        NoteOpener.shared.request = note.id
        await MacWindowChromeTests.settle(w)
        return w
    }

    private static func editor(_ w: NSWindow) throws -> PaneTextView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
    }

    @Test func aDeletedNoteShowsLikeAnyNoteWithoutWritingTools() async throws {
        let c = try AppSnapshotTests.container()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            // The live note first: where its text starts, and its toolbar.
            let live = MacWindowChromeTests.window(c, size: CGSize(width: 1469, height: 920))
            await MacWindowChromeTests.settle(live)
            let liveFrame = try Self.editor(live).enclosingScrollView.map { $0.convert($0.bounds, to: nil) }
            let liveItems = try MacWindowChromeTests.items(live).map(\.label)
            live.close()
            #expect(liveItems.contains("Format") && liveItems.contains("New Note"))

            let w = await Self.deletedNoteWindow(c, note)
            defer { w.close() }
            let editor = try Self.editor(w)
            #expect(editor.string.contains("Groceries"), "the deleted note is open")
            #expect(!editor.isEditable, "read-only")
            // No banner: the text sits where a live note's does, running under the toolbar.
            let frame = editor.enclosingScrollView.map { $0.convert($0.bounds, to: nil) }
            #expect(frame == liveFrame, "no banner pushes the note down: \(String(describing: frame)) vs \(String(describing: liveFrame))")
            let items = try MacWindowChromeTests.items(w)
            print("toolbar in Recently Deleted: " + items.map { "\($0.label.isEmpty ? "(blank)" : $0.label)@\($0.column)" }.joined(separator: ", "))
            for label in ["Format", "Checklist", "Table", "Attach", "Share", "New Note"] {
                #expect(!items.contains { $0.label == label }, "\(label) is hidden in Recently Deleted")
            }
            #expect(items.contains { $0.label == "More" && $0.column == 2 }, "the note's More stays, with Recover")
            #expect(NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: true, hasApp: false, appsEnabled: true, linkedFrom: false)
                    == [[.recover, .delete]])
        }
    }

    @Test func recoverFromThePromptPutsItBackOpenAndEditable() async throws {
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let note = try #require(try ctx.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        let folder = note.folder?.id
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = await Self.deletedNoteWindow(c, note)
            defer { w.close() }
            let editor = try Self.editor(w)
            let controller = try #require(editor.controller)
            var asked = 0
            controller.askToRecover = { asked += 1 }
            let before = editor.string
            let e = try #require(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: 0, windowNumber: w.windowNumber,
                                                  context: nil, characters: "x", charactersIgnoringModifiers: "x", isARepeat: false, keyCode: 7))
            editor.keyDown(with: e)
            #expect(asked == 1, "typing asks to recover")
            #expect(editor.string == before && note.trashedAt != nil)

            // Recover, as the prompt's default button does.
            NoteDetailView.recover(note, in: ctx, editor: controller)
            await MacWindowChromeTests.settle(w)
            #expect(note.trashedAt == nil)
            #expect(note.folder?.id == folder || (folder == nil && note.folder != nil), "back in its folder")
            let after = try Self.editor(w)
            #expect(after.string.contains("Groceries"), "still open")
            #expect(after.isEditable, "and editable")
            #expect(NoteOpener.shared.request == nil, "the window showed it where it lives")
            editor.keyDown(with: e)
            #expect(asked == 1, "no more asking")
        }
    }

    @Test func recoverGoesToNotesWhenItsFolderIsGone() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let trip = ctx.createFolder(named: "Trip")
        let note = ctx.createNote(in: .folder(trip.id), body: "Packing")
        ctx.trash(note)
        ctx.trash(trip)
        NoteDetailView.recover(note, in: ctx, editor: EditorController())
        NoteOpener.shared.request = nil
        #expect(note.trashedAt == nil)
        #expect(note.folder != nil && note.folder?.id != trip.id && note.folder?.deletedAt == nil)
    }

    // MARK: Captures (AMBER_HIG_SHOTS)

    @Test func captures() async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
            try await AppSnapshotTests.withLastNote(c, "Groceries") {
                let w = await Self.deletedNoteWindow(c, note, dark: dark)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 10)
                // The window's layout: offscreen the note's page draws blank and the toolbar's glass
                // as plain shapes (as in MacWindowChromeTests), but every item stands where it does.
                let frame = try #require(w.contentView?.superview)
                let rep = try #require(frame.bitmapImageRepForCachingDisplay(in: frame.bounds))
                frame.cacheDisplay(in: frame.bounds, to: rep)
                try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-recently-deleted-window-\(dark ? "dark" : "light").png"))
            }
            // The note itself, read-only, as the editor draws it: no banner over it.
            let h = await EditorHarness(note.body, width: 900, height: 700, dark: dark, focus: false)
            h.controller.readOnly = true
            h.view.isEditable = false
            let shot = await h.snapshot("recently-deleted-page")
            h.close()
            let out = dir.appending(path: "mac-recently-deleted-note-\(dark ? "dark" : "light").png")
            try? FileManager.default.removeItem(at: out)
            try FileManager.default.copyItem(at: URL(fileURLWithPath: shot), to: out)
            // The prompt, as AppKit lays it out (never run, never on screen).
            let alert = NSAlert()
            alert.messageText = NoteDetailView.recoverTitle
            alert.informativeText = NoteDetailView.recoverMessage
            alert.addButton(withTitle: "Recover")
            alert.addButton(withTitle: "Cancel")
            alert.window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            alert.layout()
            let view = try #require(alert.window.contentView)
            let arep = try #require(view.bitmapImageRepForCachingDisplay(in: view.bounds))
            view.cacheDisplay(in: view.bounds, to: arep)
            try #require(arep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-recently-deleted-prompt-\(dark ? "dark" : "light").png"))
        }
    }
}
#endif
