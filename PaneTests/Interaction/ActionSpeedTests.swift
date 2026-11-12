#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import UniformTypeIdentifiers
@testable import Pane

/// Everyday actions are done the moment you do them: delete, switching folders, New Folder, moving
/// a note (Emil, 12 November 2026: "I genuinely think we need to work even more on speed of
/// actions and navigation"). The whole window, never shown, with a library of a real size. The
/// budgets are for an optimised build (`CONFIG=Release scripts/qa-test.sh`); PERF lines say where
/// the time went.
@MainActor @Suite(.serialized) struct ActionSpeedTests {
    /// Delete Note: the row leaves the list and the next note opens straight away ("it feels like
    /// it takes a second before it gets deleted").
    @Test(.timeLimit(.minutes(3))) func deletingTheOpenNoteIsImmediate() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let folder = ctx.createFolder(named: "Notes")
        var notes: [Note] = []
        for i in 0..<600 {
            let lines = (0..<(i % 3 == 0 ? 200 : 6)).map { "- [ ] Item \($0) with **bold** and a [link](https://example.com)" }.joined(separator: "\n")
            let n = ctx.createNote(in: .folder(folder.id), body: "Note \(i)\n\n\(lines)")
            n.updatedAt = .now.addingTimeInterval(-Double(i + 1) * 3600)
            notes.append(n)
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        defer {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(folder.id)), forKey: "lastScope")
        d.set(notes[1].id.uuidString, forKey: "lastNote")
        let w = NoteOpenClickTests.ClickWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                                               styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1180, height: 760))
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 15)
        let list = try MacEmptyDetailTests.list(w)
        func open() -> String {
            let e = w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }
            return e.map { String($0.string.prefix { $0 != "\n" }) } ?? "no note"
        }
        // Rows, headings too: cheap enough to ask every few milliseconds. A delete takes one away.
        func rows() -> Int { list.numberOfRows }
        // Every editor in the window, by its first line: during a fade the old note's and the new one's both are.
        func editors() -> [String] {
            var out: [String] = []
            func walk(_ v: NSView) { if let t = v as? PaneTextView { out.append(String(t.string.prefix { $0 != "\n" })) }; v.subviews.forEach(walk) }
            w.contentView.map(walk)
            return out
        }

        var times: [Double] = []
        for k in 0..<4 {
            // The open note is deleted; the one below it opens next, as in Notes.
            let victim = try #require(notes.first { $0.title == open() && $0.trashedAt == nil }, "open: \(open())")
            let next = "Note \(try #require(notes.firstIndex { $0 === victim }) + 1)"
            _ = k
            let before = rows()
            let clock = ContinuousClock(), start = clock.now
            NotificationCenter.default.post(name: .paneDeleteNotes, object: Set([victim.id]))
            let sync = clock.now - start
            var gone: Duration?, opened: Duration?, arrived: Duration?
            while clock.now - start < .seconds(4), open() != next || rows() != before - 1 {
                if arrived == nil, editors().contains(next) { arrived = clock.now - start; print("PERF   editors when the next arrived: \(editors())") }
                if gone == nil, rows() == before - 1 { gone = clock.now - start }
                if opened == nil, open() == next { opened = clock.now - start }
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                try? await Task.sleep(for: .milliseconds(5))
            }
            let all = clock.now - start
            let ms = { (x: Duration) in Double(x.components.seconds) * 1000 + Double(x.components.attoseconds) / 1e15 }
            print("PERF delete open note \(k): call \(Int(ms(sync))) ms, row gone \(Int(ms(gone ?? all))) ms, next editor made \(Int(ms(arrived ?? all))) ms, old one gone \(Int(ms(opened ?? all))) ms, both \(Int(ms(all))) ms")
            #expect(open() == next && rows() == before - 1)
            times.append(ms(all))
            await MacWindowChromeTests.settle(w, 5)
        }
        let median = times.sorted()[times.count / 2]
        #expect(median < 300 * PerfBudget.slack, "delete takes \(Int(median)) ms")
    }

    /// A click on another folder lists its notes at once (Emil, 12 November 2026: "switching
    /// between folders is not fast enough"). Two folders of 300 notes, back and forth. About 240 ms
    /// on 12 November with the machine loaded; the aim is under 100. Most of it is AppKit sizing the
    /// new table's rows: 26 rows built for 12 that show, each twice, then the rest in the next 2 s.
    @Test(.timeLimit(.minutes(3))) func switchingFoldersIsImmediate() async throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let home = ctx.createFolder(named: "Notes")
        let work = ctx.createFolder(named: "Work")
        var first: Note?
        for (f, count) in [(home, 300), (work, 200)] {
            for i in 0..<count {
                let lines = (0..<(i % 3 == 0 ? 200 : 6)).map { "- [ ] Item \($0) with **bold** and a [link](https://example.com)" }.joined(separator: "\n")
                let n = ctx.createNote(in: .folder(f.id), body: "\(f.name) \(i)\n\n\(lines)")
                n.updatedAt = .now.addingTimeInterval(-Double(i + 1) * 3600)
                if first == nil { first = n }
            }
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        defer {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(home.id)), forKey: "lastScope")
        d.set(first!.id.uuidString, forKey: "lastNote")
        let w = NoteOpenClickTests.ClickWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                                               styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1180, height: 760))
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 15)
        let list = try MacEmptyDetailTests.list(w)
        let sidebar = try #require(MacWindowChromeTests.find(NSOutlineView.self, in: w.contentView!) { $0 !== list }, "the sidebar")
        func open() -> String {
            let e = w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) }
            return e.map { String($0.string.prefix { $0 != "\n" }) } ?? "no note"
        }
        func listed() -> Int { (try? MacEmptyDetailTests.list(w)).map { l in (0 ..< l.numberOfRows).filter { !l.isHeadingRow($0) }.count } ?? -1 }
        func editors() -> [String] {
            var out: [String] = []
            func walk(_ v: NSView) { if let t = v as? PaneTextView { out.append(String(t.string.prefix { $0 != "\n" })) }; v.subviews.forEach(walk) }
            w.contentView.map(walk)
            return out
        }
        // While waiting, only the row count, headings too: counting note rows takes longer than a frame.
        func rowCount() -> Int { (try? MacEmptyDetailTests.list(w))?.numberOfRows ?? -1 }
        func click(_ row: Int) {
            let r = sidebar.rect(ofRow: row)
            let p = sidebar.convert(NSPoint(x: r.midX, y: r.midY), to: nil)
            for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
                NSApp.postEvent(NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                   windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1,
                                                   pressure: type == .leftMouseDown ? 1 : 0)!, atStart: false)
            }
        }
        try #require(listed() == 300)
        let notesRow = sidebar.selectedRow
        try #require(notesRow >= 0 && notesRow + 1 < sidebar.numberOfRows)
        // Each folder's rows, headings too, once, so the wait below only reads a count.
        let homeRows = rowCount()
        click(notesRow + 1)
        await MacWindowChromeTests.settle(w, 10)
        try #require(listed() == 200)
        let workRows = rowCount()
        click(notesRow)
        await MacWindowChromeTests.settle(w, 10)
        try #require(listed() == 300 && open() == "Notes 0")
        var times: [Double] = []
        for k in 0..<6 {
            let (row, want, rowsWanted, top) = k % 2 == 0 ? (notesRow + 1, 200, workRows, "Work 0") : (notesRow, 300, homeRows, "Notes 0")
            let clock = ContinuousClock(), start = clock.now
            click(row)
            var listedAt: Duration?, arrived: Duration?
            while clock.now - start < .seconds(4), rowCount() != rowsWanted || open() != top {
                if listedAt == nil, rowCount() == rowsWanted { listedAt = clock.now - start }
                if arrived == nil, editors().contains(top) { arrived = clock.now - start; print("PERF   editors when the top note arrived: \(editors())") }
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                try? await Task.sleep(for: .milliseconds(5))
            }
            // Drawn as well as listed.
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            let all = clock.now - start
            let ms = Double(all.components.seconds) * 1000 + Double(all.components.attoseconds) / 1e15
            let lms = listedAt.map { Double($0.components.seconds) * 1000 + Double($0.components.attoseconds) / 1e15 } ?? ms
            let ams = arrived.map { Double($0.components.seconds) * 1000 + Double($0.components.attoseconds) / 1e15 } ?? ms
            print("PERF switch folder \(k): listed \(Int(lms)) ms, top note's editor made \(Int(ams)) ms, alone \(Int(ms)) ms")
            #expect(listed() == want && open() == top)
            times.append(ms)
            await MacWindowChromeTests.settle(w, 5)
        }
        let median = times.sorted()[times.count / 2]
        #expect(median < 300 * PerfBudget.slack, "a folder opens in \(Int(median)) ms")
    }
    /// Where you were is kept for the next launch, but not in the click that opens a folder: as
    /// @AppStorage, writing it updated every view that reads a default, about a tenth of a switch.
    /// It reads back at once, and is written half a second later or when a window closes.
    @Test func whereYouWereIsWrittenAfterTheSwitch() async throws {
        let d = UserDefaults.standard
        let keep = d.object(forKey: "lastScope")
        defer { if let keep { d.set(keep, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") } }
        d.removeObject(forKey: "lastScope")
        let first = Data("first".utf8), second = Data("second".utf8)
        LaunchSpot.set(first, forKey: "lastScope")
        #expect(d.data(forKey: "lastScope") == nil, "nothing written in the click")
        #expect(LaunchSpot.value(forKey: "lastScope") as? Data == first, "but it reads back at once")
        NotificationCenter.default.post(name: NSWindow.willCloseNotification, object: nil)
        #expect(d.data(forKey: "lastScope") == first, "written when a window closes")
        LaunchSpot.set(second, forKey: "lastScope")
        try await Task.sleep(for: .milliseconds(800))
        #expect(d.data(forKey: "lastScope") == second, "and half a second after the switch")
    }

    /// The window as it opens: a folder of `count` notes ("Notes 0" newest), `open` open in it.
    static func window(notes count: Int, extra: [String] = []) async throws -> (NSWindow, ModelContainer, [Note], () -> Void) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let home = ctx.createFolder(named: "Notes")
        for name in extra { _ = ctx.createFolder(named: name) }
        var notes: [Note] = []
        for i in 0..<count {
            let lines = (0..<(i % 3 == 0 ? 200 : 6)).map { "- [ ] Item \($0) with **bold** and a [link](https://example.com)" }.joined(separator: "\n")
            let n = ctx.createNote(in: .folder(home.id), body: "Notes \(i)\n\n\(lines)")
            n.updatedAt = .now.addingTimeInterval(-Double(i + 1) * 3600)
            notes.append(n)
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        d.set(try JSONEncoder().encode(Scope.folder(home.id)), forKey: "lastScope")
        d.set(notes[0].id.uuidString, forKey: "lastNote")
        let w = NoteOpenClickTests.ClickWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                                               styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1180, height: 760))
        await MacWindowChromeTests.settle(w, 15)
        return (w, c, notes, {
            w.close()
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        })
    }

    static func ms(_ d: Duration) -> Double { Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15 }

    /// New Folder: its name takes the keys at once, so typing right after the click names it
    /// (Emil, 12 November 2026: "I go to type, hear a sound indicating I can't type, after half a
    /// second the folder finally shows up").
    @Test(.timeLimit(.minutes(3))) func aNewFolderTakesTheKeysAtOnce() async throws {
        let (w, _, _, done) = try await Self.window(notes: 300, extra: ["Work"])
        defer { done() }
        var times: [Double] = []
        for k in 0..<4 {
            let clock = ContinuousClock(), start = clock.now
            NotificationCenter.default.post(name: .paneNewFolder, object: nil)
            var shown: Duration?
            while clock.now - start < .seconds(4), !(w.firstResponder is NSTextView && FolderNamingTests.nameField(in: w.contentView) != nil) {
                if shown == nil, FolderNamingTests.nameField(in: w.contentView) != nil { shown = clock.now - start }
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                try? await Task.sleep(for: .milliseconds(2))
            }
            let all = clock.now - start
            print("PERF new folder \(k): field shown \(Int(Self.ms(shown ?? all))) ms, takes the keys \(Int(Self.ms(all))) ms")
            let editor = try #require(w.firstResponder as? NSTextView, "the name has the keys")
            editor.doCommand(by: #selector(NSResponder.cancelOperation(_:)))
            times.append(Self.ms(all))
            await MacWindowChromeTests.settle(w, 5)
        }
        let median = times.sorted()[times.count / 2]
        #expect(median < 100 * PerfBudget.slack, "the name takes the keys after \(Int(median)) ms")
    }

    /// A note moved to another folder (a drop on the folder, Move To) leaves the list at once
    /// (Emil, 12 November 2026: "because the note stays on screen after I let it go into the
    /// folder, it looks like the whole app is just frozen"). The drop's own loading of what was
    /// dragged isn't in this: it needs a real drag.
    @Test(.timeLimit(.minutes(3))) func aMovedNoteLeavesTheListAtOnce() async throws {
        let (w, c, notes, done) = try await Self.window(notes: 300, extra: ["Work"])
        defer { done() }
        let ctx = c.mainContext
        let work = try #require(ctx.allFolders().first { $0.name == "Work" })
        let list = try MacEmptyDetailTests.list(w)
        var times: [Double] = []
        for k in 0..<4 {
            let note = notes[5 + k]
            let before = list.numberOfRows
            let clock = ContinuousClock(), start = clock.now
            // What the folder's drop does with a note.
            let back = ctx.move([note], to: work, undo: nil)
            NotificationCenter.default.post(name: .paneNotesMoved, object: "Moved to Work", userInfo: ["undo": back])
            let call = clock.now - start
            while clock.now - start < .seconds(4), list.numberOfRows != before - 1 {
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                try? await Task.sleep(for: .milliseconds(2))
            }
            let all = clock.now - start
            print("PERF move note \(k): call \(Int(Self.ms(call))) ms, row gone \(Int(Self.ms(all))) ms")
            #expect(list.numberOfRows == before - 1)
            times.append(Self.ms(all))
            await MacWindowChromeTests.settle(w, 5)
        }
        let median = times.sorted()[times.count / 2]
        #expect(median < 100 * PerfBudget.slack, "the row goes after \(Int(median)) ms")
    }
    /// A note dropped on a folder moves in the drop, not a turn or more later: its items are read
    /// from the drag itself. Loaded through their providers they took about 300 ms on the Air, with
    /// the note still in the list after the drop (Emil, 12 November 2026: "it looks like the whole
    /// app is just frozen"). A drop from outside the app, a file, still loads through its provider.
    @Test func aDropReadsTheDragAtOnce() throws {
        let note = PaneDragItem(kind: .note, id: UUID(), others: [UUID()])
        let data = try JSONEncoder().encode(note)
        let drag = NSPasteboard(name: .drag)
        drag.clearContents()
        let item = NSPasteboardItem()
        item.setData(data, forType: NSPasteboard.PasteboardType(UTType.paneItem.identifier))
        drag.writeObjects([item])
        let provider = NSItemProvider()
        provider.registerDataRepresentation(forTypeIdentifier: UTType.paneItem.identifier, visibility: .ownProcess) { done in
            done(data, nil)
            return nil
        }
        var got: [PaneDragItem]?
        DropLoader.load([provider]) { items, _ in got = items }
        #expect(got?.map(\.ids) == [note.ids], "handled in the drop itself, with every note of the drag")

        let file = NSItemProvider(contentsOf: URL(fileURLWithPath: "/System/Library/CoreServices/SystemVersion.plist"))!
        var fileHandled = false
        DropLoader.load([file]) { _, _ in fileHandled = true }
        #expect(!fileHandled, "a file still loads through its provider")
        drag.clearContents()
    }

    /// Typing straight after New Folder names the folder: no key is lost to the row before its
    /// field has the keys (Emil, 12 November 2026: "I go to type, hear a sound indicating I can't
    /// type"). The keys are handed to the hold the way its key monitor hands them, before the
    /// window has been drawn again: a test's window can't be sent keys through the app's queue
    /// (the app isn't active, so they never arrive), which is also why they go to the window.
    @Test(.timeLimit(.minutes(3))) func typingRightAfterNewFolderNamesIt() async throws {
        let (w, c, _, done) = try await Self.window(notes: 300, extra: ["Work"])
        defer { done() }
        NotificationCenter.default.post(name: .paneNewFolder, object: nil)
        #expect(NameKeyHold.holding, "keys are held from New Folder on")
        #expect(FolderNamingTests.nameField(in: w.contentView) == nil, "before the field is there")
        for ch in "Recipes" {
            for type in [NSEvent.EventType.keyDown, .keyUp] {
                NameKeyHold.hold(NSEvent.keyEvent(with: type, location: .zero, modifierFlags: ch.isUppercase ? .shift : [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                  windowNumber: w.windowNumber, context: nil, characters: String(ch), charactersIgnoringModifiers: String(ch).lowercased(),
                                                  isARepeat: false, keyCode: 0)!)
            }
        }
        await MacWindowChromeTests.settle(w, 10)
        #expect(!NameKeyHold.holding, "and let go once the field has them")
        let editor = try #require(w.firstResponder as? NSTextView, "the name has the keys")
        #expect(editor.string == "Recipes", "every key went into the name: \(editor.string)")
        editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
        await MacWindowChromeTests.settle(w, 3)
        #expect(c.mainContext.allFolders().contains { $0.name == "Recipes" })
    }
}
#endif
