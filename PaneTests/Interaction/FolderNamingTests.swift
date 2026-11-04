#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// New Folder and Rename on the Mac, as in Notes: the folder is made at once as "New Folder" (then
/// "New Folder 2"…), and its name is typed in its own row. Return and a click away keep the typed
/// name, Escape keeps the old one, an empty name keeps the old one. The names and the store are
/// checked as values; the field's keys through its delegate; the field in an offscreen window.
@MainActor @Suite(.serialized) struct FolderNamingTests {
    static func store() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    @Test func aNewFolderTakesTheFirstFreeName() {
        #expect(Folder.untitledName(among: []) == "New Folder")
        #expect(Folder.untitledName(among: ["Work"]) == "New Folder")
        #expect(Folder.untitledName(among: ["New Folder"]) == "New Folder 2")
        #expect(Folder.untitledName(among: ["New Folder", "New Folder 2"]) == "New Folder 3")
        #expect(Folder.untitledName(among: ["new folder", "New Folder 3"]) == "New Folder 2", "case aside, the first gap")
    }

    @Test func newFolderExistsAtOnceWithAUniqueNameInItsParent() throws {
        let c = try Self.store()
        let ctx = c.mainContext
        let work = ctx.createFolder(named: "Work")
        let first = try #require(ctx.createUntitledFolder())
        let second = try #require(ctx.createUntitledFolder())
        let inside = try #require(ctx.createUntitledFolder(parent: work))
        #expect(first.name == "New Folder" && second.name == "New Folder 2")
        #expect(inside.name == "New Folder" && inside.parent?.id == work.id, "the names beside it count, not those elsewhere")
        // Saved: a fresh read of the store has them.
        let fresh = ModelContext(c)
        #expect(Set(fresh.allFolders().map(\.name)) == ["Work", "New Folder", "New Folder 2"])
        #expect(fresh.allFolders().filter { $0.name == "New Folder" }.count == 2)
        #expect(second.sortIndex > first.sortIndex, "a new folder goes last among its own")
    }

    @Test func newFolderStopsAtTheServersLimit() throws {
        let c = try Self.store()
        let ctx = c.mainContext
        for i in 0 ..< Folder.serverLimit - 1 { ctx.insert(Folder(name: "F\(i)", sortIndex: Double(i))) }
        try ctx.save()
        #expect(ctx.createUntitledFolder() != nil, "the last one fits")
        #expect(ctx.createUntitledFolder() == nil, "no more than the server keeps")
        #expect(ctx.allFolders().count == Folder.serverLimit)
        #expect(SidebarView.folderLimitMessage.contains(Folder.serverLimit.formatted()))
    }

    @Test func aTypedNameIsKeptAndAnEmptyOneKeepsTheOld() throws {
        let c = try Self.store()
        let ctx = c.mainContext
        let f = try #require(ctx.createUntitledFolder())
        f.dirty = false
        #expect(!ctx.finishNaming(f, typed: "   "), "empty: nothing changes")
        #expect(f.name == "New Folder" && !f.dirty)
        #expect(!ctx.finishNaming(f, typed: "New Folder"), "the same name: nothing to sync")
        #expect(!f.dirty)
        #expect(ctx.finishNaming(f, typed: "  Recipes \n"))
        #expect(f.name == "Recipes" && f.dirty, "trimmed, and marked for sync")
        #expect(ModelContext(c).allFolders().map(\.name) == ["Recipes"], "saved")
    }

    // MARK: The field

    static func coordinator() -> (InlineNameField.Coordinator, () -> [String]) {
        final class Log { var events: [String] = [] }
        let log = Log()
        let c = InlineNameField.Coordinator(commit: { log.events.append("commit:\($0)") }, cancel: { log.events.append("cancel") })
        return (c, { log.events })
    }

    @Test func returnKeepsWhatWasTyped() {
        let (c, events) = Self.coordinator()
        let field = NSTextField(string: "Recipes")
        #expect(c.control(field, textView: NSTextView(), doCommandBy: #selector(NSResponder.insertNewline(_:))))
        // The field then ends its editing as it goes away: no second commit.
        c.controlTextDidEndEditing(Notification(name: NSControl.textDidEndEditingNotification, object: field))
        #expect(events() == ["commit:Recipes"])
    }

    @Test func escapeKeepsTheNameItHad() {
        let (c, events) = Self.coordinator()
        let field = NSTextField(string: "Half typ")
        #expect(c.control(field, textView: NSTextView(), doCommandBy: #selector(NSResponder.cancelOperation(_:))))
        c.controlTextDidEndEditing(Notification(name: NSControl.textDidEndEditingNotification, object: field))
        #expect(events() == ["cancel"], "Escape never saves what was typed, even as the field goes")
    }

    @Test func clickingAwayKeepsWhatWasTyped() {
        let (c, events) = Self.coordinator()
        let field = NSTextField(string: "Travel")
        c.controlTextDidEndEditing(Notification(name: NSControl.textDidEndEditingNotification, object: field))
        #expect(events() == ["commit:Travel"])
        #expect(!c.control(field, textView: NSTextView(), doCommandBy: #selector(NSResponder.moveLeft(_:))), "other keys edit the text")
    }

    /// The field in a window, as the sidebar row shows it: it takes the keys with the whole name
    /// selected, so typing replaces "New Folder".
    @Test func theFieldOpensFocusedWithTheNameSelected() async throws {
        var committed: [String] = []
        let w = FileRowClickTests.KeyWindow(contentRect: CGRect(x: -20000, y: -20000, width: 260, height: 40), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = NSHostingView(rootView: InlineNameField(initial: "New Folder", commit: { committed.append($0) }, cancel: {}).frame(width: 220))
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        defer { w.orderOut(nil); w.close() }
        w.orderFrontRegardless()
        w.contentView?.layoutSubtreeIfNeeded()
        try? await Task.sleep(for: .milliseconds(300))
        let editor = try #require(w.firstResponder as? NSTextView, "the field isn't focused")
        #expect(editor.string == "New Folder")
        #expect(editor.selectedRange() == NSRange(location: 0, length: ("New Folder" as NSString).length), "all of the name is selected")
        // Typed over, then Return (as AppKit sends it).
        editor.insertText("Recipes", replacementRange: editor.selectedRange())
        editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
        #expect(committed == ["Recipes"])
    }

    /// The sidebar itself, offscreen: the folder's row as FolderTree draws it.
    static func sidebar(_ c: ModelContainer, scope: Binding<Scope?>) -> NSWindow {
        let w = FileRowClickTests.KeyWindow(contentRect: CGRect(x: -20000, y: -20000, width: 280, height: 520), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let sidebar = SidebarView(scope: scope, onNewNote: {})
        w.contentView = NSHostingView(rootView: NavigationStack { sidebar }.modelContainer(c).frame(width: 260, height: 500))
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        w.orderFrontRegardless()
        w.makeKey()
        return w
    }

    /// The field's editor once it has the keys. Other suites run beside this one and make their
    /// own offscreen windows key, so the window is made key again while it waits (three seconds at
    /// most): the field can only take the keys in the key window.
    static func editor(in w: NSWindow) async -> NSTextView? {
        for _ in 0..<30 {
            if let editor = w.firstResponder as? NSTextView, nameField(in: w.contentView) != nil { return editor }
            w.makeKey()
            try? await Task.sleep(for: .milliseconds(100))
        }
        return w.firstResponder as? NSTextView
    }

    @MainActor @Observable final class Box { var scope: Scope? = .all }

    /// New Folder (the toolbar, ⇧⌘N, the menus): the folder is there at once, selected, with its
    /// name open for typing in its row; Return keeps the typed name.
    @Test func newFolderOpensItsNameInItsRow() async throws {
        let c = try Self.store()
        let ctx = c.mainContext
        _ = ctx.createFolder(named: "Notes")
        try ctx.save()
        let box = Box()
        let w = Self.sidebar(c, scope: Binding(get: { box.scope }, set: { box.scope = $0 }))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .milliseconds(400))
        #expect(Self.nameField(in: w.contentView) == nil, "no field until a folder is named")
        NotificationCenter.default.post(name: .paneNewFolder, object: nil)
        try? await Task.sleep(for: .milliseconds(500))
        let made = try #require(ctx.allFolders().first { $0.name == "New Folder" }, "made at once, before a name is typed")
        #expect(box.scope == .folder(made.id), "and selected")
        let field = try #require(Self.nameField(in: w.contentView), "its row shows the name as a field")
        #expect(field.stringValue == "New Folder")
        let editor = try #require(await Self.editor(in: w), "the field has the keys")
        #expect(editor.selectedRange().length == ("New Folder" as NSString).length, "all of it selected")
        editor.insertText("Recipes", replacementRange: editor.selectedRange())
        editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
        try? await Task.sleep(for: .milliseconds(400))
        #expect(made.name == "Recipes")
        #expect(Self.nameField(in: w.contentView) == nil, "Return closes the field")
        // A second one beside it while "Recipes" is taken: "New Folder" is free again.
        NotificationCenter.default.post(name: .paneNewFolder, object: nil)
        try? await Task.sleep(for: .milliseconds(500))
        #expect(Self.nameField(in: w.contentView) != nil)
        let second = try #require(await Self.editor(in: w))
        second.doCommand(by: #selector(NSResponder.cancelOperation(_:)))
        try? await Task.sleep(for: .milliseconds(300))
        #expect(ctx.allFolders().map(\.name).sorted() == ["New Folder", "Notes", "Recipes"], "Escape keeps the folder, named New Folder")
    }

    /// Rename opens the same field in the folder's row; an empty name keeps the old one.
    @Test func renameOpensTheSameFieldInTheRow() async throws {
        let c = try Self.store()
        let ctx = c.mainContext
        let work = ctx.createFolder(named: "Work")
        _ = ctx.createFolder(named: "Home")
        try ctx.save()
        let box = Box()
        let w = Self.sidebar(c, scope: Binding(get: { box.scope }, set: { box.scope = $0 }))
        defer { w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .milliseconds(400))
        NotificationCenter.default.post(name: .paneRenameFolder, object: work.id)
        try? await Task.sleep(for: .milliseconds(500))
        let field = try #require(Self.nameField(in: w.contentView), "Rename opens the field in the row")
        #expect(field.stringValue == "Work")
        let editor = try #require(await Self.editor(in: w))
        editor.insertText("", replacementRange: NSRange(location: 0, length: (editor.string as NSString).length))
        editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
        try? await Task.sleep(for: .milliseconds(400))
        #expect(work.name == "Work", "an empty name keeps the one it had")
        #expect(Self.nameField(in: w.contentView) == nil)
    }

    /// Deleting a folder that holds notes asks first, as in Notes, and nothing goes until Delete
    /// Folder is chosen; an empty folder goes at once (Emil, 2 November 2026).
    @Test func deletingAFolderWithNotesAsksFirst() async throws {
        let c = try Self.store()
        let ctx = c.mainContext
        // The first folder is Notes, which stays, as in Apple Notes.
        let notes = ctx.createFolder(named: "Notes")
        let work = ctx.createFolder(named: "Work")
        let empty = ctx.createFolder(named: "Empty")
        _ = ctx.createNote(in: .folder(work.id), body: "Plans")
        try ctx.save()
        let box = Box()
        let w = Self.sidebar(c, scope: Binding(get: { box.scope }, set: { box.scope = $0 }))
        defer { w.attachedSheet.map { w.endSheet($0) }; w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .milliseconds(400))

        NotificationCenter.default.post(name: .paneDeleteFolder, object: notes.id)
        try? await Task.sleep(for: .milliseconds(500))
        #expect(notes.deletedAt == nil && w.attachedSheet == nil, "Notes can't be deleted")

        NotificationCenter.default.post(name: .paneDeleteFolder, object: empty.id)
        try? await Task.sleep(for: .milliseconds(500))
        #expect(empty.deletedAt != nil, "an empty folder goes at once")
        #expect(w.attachedSheet == nil, "without asking")

        NotificationCenter.default.post(name: .paneDeleteFolder, object: work.id)
        try? await Task.sleep(for: .milliseconds(700))
        #expect(work.deletedAt == nil, "a folder with notes stays until Delete Folder is chosen")
        #expect(work.liveNotes.count == 1)
        let sheet = try #require(w.attachedSheet, "the confirmation shows")
        let buttons = Self.buttons(in: sheet.contentView).map(\.title)
        #expect(buttons.contains("Delete Folder"), "\(buttons)")
    }

    /// ⌘ picks folders beside the one shown, and Delete takes them all with one question, never
    /// Notes (Emil, 3 November 2026: "I wanna be able to shift click multiple folders too, delete
    /// them").
    @Test func severalPickedFoldersAreDeletedTogether() async throws {
        let c = try Self.store()
        let ctx = c.mainContext
        let notes = ctx.createFolder(named: "Notes")
        let work = ctx.createFolder(named: "Work")
        let trips = ctx.createFolder(named: "Trips")
        let ideas = ctx.createFolder(named: "Ideas")
        _ = ctx.createNote(in: .folder(work.id), body: "Plans")
        try ctx.save()
        let box = Box()
        box.scope = .folder(work.id)
        let w = Self.sidebar(c, scope: Binding(get: { box.scope }, set: { box.scope = $0 }))
        defer { w.attachedSheet.map { w.endSheet($0) }; w.orderOut(nil); w.close() }
        try? await Task.sleep(for: .milliseconds(500))
        let outline = try #require(MacWindowChromeTests.find(NSOutlineView.self, in: w.contentView!))
        let workRow = outline.selectedRow
        try #require(workRow >= 0, "Work is shown")
        #expect(outline.allowsMultipleSelection, "the folders pick several")
        let press = NSEvent.mouseEvent(with: .leftMouseDown, location: .zero, modifierFlags: .command, timestamp: 0,
                                       windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
        #expect(PressSelect.pick(press, on: outline, row: workRow + 2), "⌘ picks Ideas")
        try? await Task.sleep(for: .milliseconds(300))
        #expect(box.scope == .folder(work.id), "Work is still the one shown")
        #expect(outline.selectedRowIndexes == [workRow, workRow + 2])

        _ = outline.tryToPerform(#selector(NSText.delete(_:)), with: nil)
        try? await Task.sleep(for: .milliseconds(700))
        #expect(work.deletedAt == nil, "Work holds a note: nothing goes before the question")
        let sheet = try #require(w.attachedSheet, "one question for both")
        let delete = try #require(Self.buttons(in: sheet.contentView).first { $0.title == "Delete Folders" })
        delete.performClick(nil)
        try? await Task.sleep(for: .milliseconds(500))
        #expect(work.deletedAt != nil && ideas.deletedAt != nil, "both picked folders are gone")
        #expect(trips.deletedAt == nil && notes.deletedAt == nil, "the others stay")
        #expect(work.liveNotes.isEmpty, "Work's note went to Recently Deleted")
    }

    @Test func pickingFoldersKeepsTheOneShown() {
        let a = UUID(), b = UUID()
        #expect(SidebarView.picking([.folder(a)], scope: .folder(b)) == (.folder(a), []), "a plain pick shows that folder")
        let two = SidebarView.picking([.folder(a), .folder(b)], scope: .folder(b))
        #expect(two.scope == .folder(b) && two.picked == [a, b])
        #expect(SidebarView.picking([], scope: .folder(b)) == (.folder(b), []), "⌘ on the last keeps it shown")
        #expect(SidebarView.selection(scope: .folder(b), picked: [a]) == [.folder(a), .folder(b)])
    }

    static func buttons(in view: NSView?) -> [NSButton] {
        guard let view else { return [] }
        return (view as? NSButton).map { [$0] } ?? [] + view.subviews.flatMap { buttons(in: $0) }
    }

    static func nameField(in view: NSView?) -> NSTextField? {
        guard let view else { return nil }
        if let f = view as? InlineNameField.Field { return f }
        for v in view.subviews { if let f = nameField(in: v) { return f } }
        return nil
    }
}
#endif
