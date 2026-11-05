#if os(macOS)
import AppKit
import SwiftData
import Testing
@testable import Pane

/// ⌘F with a note open finds in that note even before you've clicked in it, as in Notes: just
/// after the app opens the keys are with the list (council round 16: ⌘F straight after launch did
/// nothing). With no note open it searches the notes.
@MainActor @Suite(.serialized) struct FindBeforeClickingTests {
    @Test(arguments: ["list", "nothing"])
    func commandFFindsInTheOpenNote(focus: String) async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Notes")
        let n = ctx.createNote(in: .folder(folder.id), body: "Lisbon\n\nFour days of tiles, trams and pastries.")
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        defer {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
        d.set(n.id.uuidString, forKey: "lastNote")
        let w = MacWindowChromeTests.window(c, size: CGSize(width: 1180, height: 760))
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 10)
        let e = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
        let scroll = try #require(e.enclosingScrollView)
        if focus == "list" {
            let table = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSTableView.self, in: $0) })
            w.makeFirstResponder(table)
        } else {
            w.makeFirstResponder(nil)
        }
        #expect(w.firstResponder !== e)
        // What Edit › Find › Find… sends, to whoever takes it: with the keys in the list nothing in
        // the window does, so it ends up with the app.
        let item = NSMenuItem(); item.tag = Int(NSFindPanelAction.showFindPanel.rawValue)
        let sel = #selector(NSTextView.performFindPanelAction(_:))
        let start = w.firstResponder ?? w
        #expect(!start.tryToPerform(sel, with: item) || focus == "nothing")
        let app = try #require(NSApp.target(forAction: sel, to: nil, from: item) as? NSObject, "the app takes ⌘F")
        #expect(app.responds(to: sel))
        FindRouter.find(in: w, sender: item)
        await MacWindowChromeTests.settle(w, 3)
        #expect(scroll.isFindBarVisible, "the find bar shows over the note (\(focus))")
        #expect(w.firstResponder === e || (w.firstResponder as? NSView)?.isDescendant(of: scroll) == true, "with the keys in the note or its find field")
        withExtendedLifetime(c) {}
    }
}
#endif
