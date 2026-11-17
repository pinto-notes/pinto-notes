#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// The board's tools float on the board in Excalidraw's order, with its keys and its hint line;
/// the window's toolbar keeps only the actions (Emil, 17 November 2026: "normally these buttons
/// aren't toggles, but now they are, so that is messing with my brain"; "sharing, ... at the very
/// right, while the toggles in the center"). All offscreen.
@MainActor @Suite(.serialized) struct CanvasToolPaletteTests {

    /// Excalidraw's order: the lock, a line, the hand and the tools by their numbers (the sticky
    /// note after text, then the picture and the eraser), a line, More. The letters in the corners
    /// read V R D O A L P T N E; the help says each key, with Excalidraw's number.
    @Test func thePaletteHasExcalidrawsOrderAndKeys() {
        typealias P = CanvasToolPalette
        #expect(P.groups.count == 3 && P.groups[0] == [.lock] && P.groups[2] == [.more], "the lock, a line, the tools, a line, More")
        #expect(P.groups[1] == [.tool(.hand), .tool(.selection), .tool(.rectangle), .tool(.diamond), .tool(.ellipse), .tool(.arrow), .tool(.line),
                                .tool(.freedraw), .tool(.text), .sticky, .image, .tool(.eraser)])
        #expect(P.items.compactMap(\.letter).joined() == "VRDOALPTNE", "\(P.items.compactMap(\.letter))")
        #expect(P.Item.tool(.hand).letter == nil && P.Item.image.letter == nil && P.Item.lock.letter == nil)
        #expect(P.Item.tool(.rectangle).help == "Rectangle (R or 2)")
        #expect(P.Item.tool(.selection).help == "Select (V or 1)")
        #expect(P.Item.tool(.eraser).help == "Eraser (E or 0)")
        #expect(P.Item.image.help == "Insert Image (9)")
        #expect(P.Item.sticky.help == "Sticky Note (N)")
        #expect(P.Item.lock.help == "Keep selected tool active after drawing (Q)")
        // Every number from 1 to 0 is one tool's, as in Excalidraw.
        let numbers = P.items.flatMap(\.keys).filter { $0.count == 1 && $0.first!.isNumber }
        #expect(Set(numbers) == Set("1234567890".map(String.init)) && numbers.count == 10, "\(numbers)")
        for item in P.items where item != .more {
            #expect(NSImage(systemSymbolName: item.symbol, accessibilityDescription: nil) != nil, "\(item.symbol) is an SF Symbol")
        }
        // The lock is a soft tint when on, the tool you have the one filled chip.
        var s = CanvasState()
        s.tool = .rectangle; s.locked = true
        #expect(P.isPicked(.tool(.rectangle), s) && P.isPicked(.lock, s) && !P.isPicked(.tool(.selection), s))
        s.tool = .laser
        #expect(P.isPicked(.more, s), "a tool from More shows on More")
        s.tool = .comment
        #expect(!P.items.contains { P.isPicked($0, s) && $0 != .lock }, "the Comment tool is the Comments button's")
    }

    /// The hint's keys are drawn as keys: Excalidraw's key names, a letter after "Press", and keys
    /// joined by a plus.
    @Test func theHintsKeysAreKeys() {
        typealias H = CanvasHint
        #expect(H.parts("To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool")
                == [.words("To move canvas, hold mouse wheel or "), .key("spacebar"), .words(" while dragging, or use the hand tool")])
        #expect(H.parts("Press Escape or Cmd+Enter to finish editing")
                == [.words("Press "), .key("Escape"), .words(" or "), .key("Cmd"), .words("+"), .key("Enter"), .words(" to finish editing")])
        #expect(H.parts("Click to start multiple points, drag for single line. Press A again to change arrow type.")
                == [.words("Click to start multiple points, drag for single line. Press "), .key("A"), .words(" again to change arrow type.")])
        #expect(H.parts("Press Delete to remove point(s), Cmd+D to duplicate, or drag to move").filter { if case .key = $0 { true } else { false } }
                == [.key("Delete"), .key("Cmd"), .key("D")])
        #expect(H.parts("Hold Cmd and Double-click or press Cmd + Enter to edit points").filter { if case .key = $0 { true } else { false } }
                == [.key("Cmd"), .key("Cmd"), .key("Enter")])
        #expect(H.parts("Click and drag, release when you're finished") == [.words("Click and drag, release when you're finished")])
        // The words read back whole.
        for line in ["Select a point to edit (hold Shift to select multiple), or hold Option and click to add new points",
                     "Click outside the image or press Enter or ESCAPE to finish cropping"] {
            let back = H.parts(line).map { if case .words(let w) = $0 { w } else if case .key(let k) = $0 { k } else { "" } }.joined()
            #expect(back == line)
        }
        #expect(H.keycap("Shift").isTemplate, "drawn in the line's own colour")
    }

    /// The hint is Excalidraw's, word for word, for the tool and the selection, its keys as a Mac
    /// names them; none for a shape tool, the hand, or in view mode.
    @Test func theHintIsExcalidrawsWordForWord() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "box", "x": 100, "y": 100, "width": 160, "height": 90],
            ["type": "text", "id": "words", "x": 400, "y": 100, "text": "Hello"],
            ["type": "line", "id": "rule", "x": 100, "y": 300, "width": 200, "height": 0, "points": [[0, 0], [200, 0]]],
        ]))
        defer { j.close() }
        try await j.ready()
        func select(_ id: String?) async throws {
            _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: \(id.map { "{ \($0): true }" } ?? "{}") } }); 0")
        }
        let cases: [(CanvasTool?, String?, String?)] = [
            (.selection, nil, "To move canvas, hold mouse wheel or spacebar while dragging, or use the hand tool"),
            (.freedraw, nil, "Click and drag, release when you're finished"),
            (.arrow, nil, "Click to start multiple points, drag for single line. Press A again to change arrow type."),
            (.line, nil, "Click to start multiple points, drag for single line"),
            (.text, nil, "Tip: you can also add text by double-clicking anywhere with the selection tool"),
            (.eraser, nil, "Hold Option to revert the elements marked for deletion"),
            (.rectangle, nil, nil),
            (.hand, nil, nil),
            (.selection, "box", "Press Enter to add text. Hold Cmd and Arrow key to create a flowchart"),
            (.selection, "words", "Double-click or press Enter to edit text"),
            (.selection, "rule", "Hold Cmd and Double-click or press Cmd + Enter to edit points"),
        ]
        for (tool, selected, want) in cases {
            try await select(nil)
            if let tool { j.canvas.pick(tool) }
            if let selected { try await select(selected) }
            await j.until("\(tool.map(\.rawValue) ?? "-") \(selected ?? "-"): \(want ?? "no hint"), not \(j.canvas.state.hint ?? "none")") { j.canvas.state.hint == want }
        }
        // The Comment tool is the page's own: no hint of Excalidraw's for it.
        try await select(nil)
        j.canvas.pick(.comment)
        await j.until("no hint with the Comment tool") { j.canvas.state.tool == .comment && j.canvas.state.hint == nil }
    }

    /// The letters and Excalidraw's numbers pick the tools; Q keeps the tool after drawing, N adds a
    /// sticky note (selected, not typed into) and 9 asks for a picture (the app's own file panel),
    /// as the palette says.
    @Test func theKeysPickTheTools() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        func key(_ k: String) async throws {
            _ = try await j.js("document.dispatchEvent(new KeyboardEvent('keydown', { key: \(String(reflecting: k)), bubbles: true, cancelable: true })); 0")
        }
        for item in CanvasToolPalette.items {
            guard case .tool(let t) = item else { continue }
            for k in item.keys {
                try await key("v")
                await j.until("back to selecting") { j.canvas.state.tool == .selection }
                try await key(k.lowercased())
                await j.until("\(k) picks \(t.title), not \(j.canvas.state.tool.title)") { j.canvas.state.tool == t }
            }
        }
        // Q: the lock, on and off; the palette's lock says so.
        try await key("r")
        await j.until("the rectangle") { j.canvas.state.tool == .rectangle }
        try await key("q")
        await j.until("locked") { j.canvas.state.locked }
        j.canvas.send(.lock(false))
        await j.until("the palette's lock puts it down, back to selecting") { !j.canvas.state.locked && j.canvas.state.tool == .selection }
        j.canvas.pick(.ellipse)
        j.canvas.send(.lock(true))
        await j.until("the palette's lock keeps the ellipse") { j.canvas.state.locked && j.canvas.state.tool == .ellipse }
        // N: a sticky note, selected, not typed into (Excalidraw 0.18 has no sticky tool to place one
        // with a click; typing at once took the next tool keys as words).
        try await key("v")
        try await key("n")
        let stickies = "amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).length"
        for _ in 0..<100 where try await j.js(stickies) as? Int != 1 { try await Task.sleep(for: .milliseconds(30)) }
        #expect(try await j.js(stickies) as? Int == 1, "N makes a sticky note")
        try await Task.sleep(for: .milliseconds(200))
        #expect(!j.canvas.state.editing && j.canvas.state.tool == .selection && j.canvas.state.hasSelection, "selected, not typed into")
        // 9: a picture, from the app's panel; never the page's own file picker.
        var asked = 0
        j.canvas.pickImage = { asked += 1 }
        try await key("9")
        await j.until("9 asks for a picture") { asked == 1 }
        #expect(j.canvas.state.tool != .rectangle, "9 isn't a tool on the page")
    }

    /// The palette floats at the top middle of the board, the hint under it; clicks beside it, under
    /// it and on the hint reach the board, and a click on a tool picks it. The window's toolbar has
    /// no tool in it, only the actions: Share, the library, Comments and More (no writing tools).
    @Test func thePaletteFloatsOnTheBoardAndTheBarHoldsTheActions() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: false) }
        defer { w.close() }
        _ = try await CanvasNativeUITests.settledView(w, web)
        let area = web.convert(web.bounds, to: nil)
        let palette = try #require(await Self.frame("canvas.palette", in: w), "the palette")
        #expect(abs(palette.midX - area.midX) <= 2, "in the middle of the board: \(palette.midX) vs \(area.midX)")
        #expect(abs(area.maxY - palette.maxY - CanvasToolPalette.top) <= 2, "at the board's top: \(area.maxY - palette.maxY)")
        #expect(abs(palette.width - CanvasToolPalette.width(CanvasToolPalette.groups)) <= 2 && abs(palette.height - CanvasToolPalette.height) <= 2,
                "its measures: \(palette.size)")
        // No chin: as much glass under the tools as over them.
        let rect = try #require(await Self.frame("canvas.tool.rectangle", in: w))
        #expect(abs((rect.minY - palette.minY) - (palette.maxY - rect.maxY)) <= 1, "even padding: \(rect) in \(palette)")
        // The hint under it.
        let hint = try #require(await Self.frame("canvas.hint", in: w), "the hint")
        #expect(hint.maxY <= palette.minY - 4 && abs(hint.midX - area.midX) <= 2, "under the palette, centred: \(hint)")
        // Clicks.
        let root = try #require(w.contentView?.superview)
        func lands(_ p: CGPoint) -> NSView? { root.hitTest(root.convert(p, from: nil)) }
        func onBoard(_ p: CGPoint) -> Bool { lands(p).map { $0 === web || $0.isDescendant(of: web) } ?? false }
        for (name, p) in [("left of it", CGPoint(x: palette.minX - 30, y: palette.midY)), ("right of it", CGPoint(x: palette.maxX + 30, y: palette.midY)),
                          ("on the hint", CGPoint(x: hint.midX, y: hint.midY)), ("under the hint", CGPoint(x: hint.midX, y: hint.minY - 20)),
                          ("between the palette and the hint", CGPoint(x: palette.midX, y: (palette.minY + hint.maxY) / 2))] {
            #expect(onBoard(p), "a click \(name) reaches the board: \(lands(p).map { String(describing: type(of: $0)) } ?? "nothing")")
        }
        #expect(!onBoard(CGPoint(x: rect.midX, y: rect.midY)), "a click on a tool is the palette's")
        // A tool picked from the palette.
        try Self.press("canvas.tool.rectangle", in: w)
        await MacWindowChromeTests.settle(w, 5)
        for _ in 0..<60 where canvas.state.tool != .rectangle { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.tool == .rectangle, "the rectangle is picked: \(canvas.state.tool)")
        try Self.press("canvas.tool.lock", in: w)
        for _ in 0..<60 where !canvas.state.locked { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.locked, "the lock is on")
        // The toolbar: the actions only.
        let labels = try MacWindowChromeTests.items(w).map(\.label)
        #expect(!CanvasTool.allCases.contains { labels.contains($0.title) } && !labels.contains("Shapes") && !labels.contains("More Tools"), "no tools in the bar: \(labels)")
        #expect(labels.contains("Share") && labels.contains(CanvasLibraryPopover.title) && labels.contains(BoardCommentUI.title) && labels.contains("More"), "\(labels)")
        #expect(!labels.contains { $0.hasSuffix("Full Screen") }, "no Full Screen button: \(labels)")
        // A note's writing tools aren't there, not even greyed out (real-window check, 17 Nov).
        #expect(!labels.contains { ["Format", "Checklist", "Table", "Attach"].contains($0) }, "no writing tools on a board: \(labels)")
    }

    // MARK: The real-window check (17 November 2026)

    /// N, then a tool's key a moment later, as a person types them (real-window check, 17 Nov: N
    /// started typing in the new sticky, so the next tool keys went into it as words): N places a
    /// sticky and selects it, P picks the pen, and nothing is typed into the sticky.
    @Test func nPlacesAStickyAndTheNextKeyPicksATool() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        let w = j.rig.window
        #expect(w.makeFirstResponder(j.web))
        Self.keys("n", in: w)
        let stickies = "amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).length"
        for _ in 0..<100 where try await j.js(stickies) as? Int != 1 { try await Task.sleep(for: .milliseconds(20)) }
        #expect(try await j.js(stickies) as? Int == 1, "N places a sticky note")
        try await Task.sleep(for: .milliseconds(150))
        #expect(!j.canvas.state.editing, "not typed into")
        Self.keys("p", in: w)
        await j.until("P picks the pen, not \(j.canvas.state.tool)") { j.canvas.state.tool == .freedraw }
        let words = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.type === 'text').map((e) => e.originalText))") as? String ?? ""
        #expect(!words.lowercased().contains("p"), "nothing typed into the sticky: \(words)")
        #expect(!j.canvas.state.editing)
    }

    /// ⌘A picks the Select tool as it selects everything, as in Excalidraw (real-window check, 17
    /// Nov: with the pen, ⌘A selected everything and the palette still showed the pen). Edit ›
    /// Select All does the same.
    @Test func commandAPicksSelect() async throws {
        let j = try await CanvasNativeUITests.Joined(scene: CanvasNativeUITests.flowchart)
        defer { j.close() }
        try await j.ready()
        let all = "(() => { const api = amber._canvas.api, ids = api.getAppState().selectedElementIds || {}; return api.getSceneElements().filter((e) => !(e.type === 'text' && e.containerId)).every((e) => ids[e.id]); })()"
        let w = j.rig.window
        #expect(w.makeFirstResponder(j.web))
        // The key, as a person presses it.
        j.canvas.pick(.freedraw)
        await j.until("the pen") { j.canvas.state.tool == .freedraw }
        Self.keys("a", flags: .command, in: w)
        await j.until("⌘A picks Select, not \(j.canvas.state.tool)") { j.canvas.state.tool == .selection }
        #expect(try await j.js(all) as? Bool == true, "everything is selected")
        // The Edit menu's.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); 0")
        j.canvas.pick(.rectangle)
        await j.until("the rectangle") { j.canvas.state.tool == .rectangle && !j.canvas.state.hasSelection }
        let web = try #require(j.web as? NotePageWebView)
        #expect(web.validateUserInterfaceItem(NSMenuItem(title: "Select All", action: #selector(NotePageWebView.selectAll(_:)), keyEquivalent: "a")))
        web.selectAll(nil)
        await j.until("Select All picks Select, not \(j.canvas.state.tool)") { j.canvas.state.tool == .selection }
        #expect(try await j.js(all) as? Bool == true, "everything is selected from the menu")
    }

    /// Tab and Shift-Tab on the board keep the keys on the board (real-window check, 17 Nov: Tab
    /// went to the board's name in the window's toolbar, then P renamed the board "p"). After them
    /// P picks the pen and the name is as it was.
    @Test func tabKeepsTheKeysOnTheBoard() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: false) }
        defer { w.close() }
        _ = try await CanvasNativeUITests.settledView(w, web)
        _ = try #require(Self.nameField(in: w), "the board's name is in the toolbar")
        #expect(w.makeFirstResponder(web))
        for flags: NSEvent.ModifierFlags in [[], .shift] {
            Self.keys("\t", flags: flags, in: w)
            // WebKit hands the focus on a turn or two later, when it does.
            for _ in 0..<10 { await MacWindowChromeTests.settle(w, 1); try await Task.sleep(for: .milliseconds(20)) }
            let r = w.firstResponder
            #expect(r === web || (r as? NSView)?.isDescendant(of: web) == true,
                    "\(flags.isEmpty ? "Tab" : "Shift-Tab") leaves the keys on the board, not on \(r.map { String(describing: type(of: $0)) } ?? "nothing")")
        }
        Self.keys("p", in: w)
        for _ in 0..<60 where canvas.state.tool != .freedraw { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.tool == .freedraw, "P picks the pen: \(canvas.state.tool)")
        #expect(board.title == "Publishing flow", "the name is as it was: \(board.title)")
        // ⌃Tab still moves on from the board, as it does from a Mac text view.
        Self.keys("\t", flags: .control, in: w)
        for _ in 0..<10 { await MacWindowChromeTests.settle(w, 1); try await Task.sleep(for: .milliseconds(20)) }
        let r = w.firstResponder
        #expect(!(r === web || (r as? NSView)?.isDescendant(of: web) == true), "⌃Tab moves on: \(r.map { String(describing: type(of: $0)) } ?? "nothing")")
    }

    /// Return in the board's name renames it and gives the keys back to the board, so the next
    /// tool key picks a tool; Escape puts the name back and gives them back too.
    @Test func doneRenamingGivesTheKeysBackToTheBoard() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: false) }
        defer { w.close() }
        _ = try await CanvasNativeUITests.settledView(w, web)
        @MainActor func rename(to words: String, with command: Selector) async throws {
            let field = try #require(Self.nameField(in: w), "the board's name")
            #expect(w.makeFirstResponder(field))
            await MacWindowChromeTests.settle(w, 2)
            let editor = try #require(w.firstResponder as? NSTextView, "renaming: \(w.firstResponder.map { String(describing: type(of: $0)) } ?? "nothing")")
            editor.insertText(words, replacementRange: NSRange(location: 0, length: (editor.string as NSString).length))
            editor.doCommand(by: command)
            for _ in 0..<20 where w.firstResponder !== web { await MacWindowChromeTests.settle(w, 1) }
        }
        try await rename(to: "Launch flow", with: #selector(NSResponder.insertNewline(_:)))
        #expect(board.title == "Launch flow", "Return renames the board: \(board.title)")
        #expect(w.firstResponder === web, "and the keys are the board's: \(w.firstResponder.map { String(describing: type(of: $0)) } ?? "nothing")")
        Self.keys("p", in: w)
        for _ in 0..<60 where canvas.state.tool != .freedraw { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.tool == .freedraw && board.title == "Launch flow", "P picks the pen, the name stays: \(canvas.state.tool), \(board.title)")
        try await rename(to: "Something else", with: #selector(NSResponder.cancelOperation(_:)))
        #expect(board.title == "Launch flow", "Escape keeps the name: \(board.title)")
        #expect(w.firstResponder === web, "and the keys are the board's: \(w.firstResponder.map { String(describing: type(of: $0)) } ?? "nothing")")
    }

    /// A whiteboard's bar has no writing tools, not even greyed out (real-window check, 17 Nov: Aa,
    /// Checklist, Table and the paperclip on a new board): one made with New Whiteboard, in every
    /// frame from the note before it, and one in a window of its own (Open in New Window).
    @Test func aBoardsBarHasNoWritingTools() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let writing: Set<String> = ["Format", "Checklist", "Table", "Attach"]
        @MainActor func labels(_ w: NSWindow) -> Set<String> {
            Set((w.toolbar?.items ?? []).filter { !$0.isHidden && $0.view?.window != nil }.map { $0.label })
        }
        @MainActor func board(_ w: NSWindow) -> Bool { w.contentView.flatMap { MacWindowChromeTests.find(NotePageWebView.self, in: $0) } != nil }
        try await AppSnapshotTests.withLastNote(c, "Groceries") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 30)
            #expect(!board(w) && !labels(w).isDisjoint(with: writing), "a note and its writing tools to begin with: \(labels(w).sorted())")
            NewCanvas.shared.ask()
            // Each change of the bar, frame by frame, from the note to the new board, loaded.
            let loaded = "!!(window.amber && window.amber._canvas && window.amber._canvasView)"
            var seen: [String] = [], wrong: [String] = [], ready = false, after = 0, i = 0
            while i < 600 && after < 40 {
                i += 1
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                let web = w.contentView.flatMap { MacWindowChromeTests.find(NotePageWebView.self, in: $0) }
                if let web, !ready, i % 3 == 0 { ready = (try? await web.evaluateJavaScript(loaded)) as? Bool == true }
                if ready { after += 1 }
                let now = labels(w)
                let line = "\(web == nil ? "note" : ready ? "board" : "board, loading"): \(now.sorted().joined(separator: ", "))"
                if seen.last != line { seen.append(line) }
                if web != nil, !now.isDisjoint(with: writing), wrong.last != line { wrong.append(line) }
                try await Task.sleep(for: .milliseconds(16))
            }
            #expect(ready, "the new board opened: \(seen)")
            #expect(wrong.isEmpty, "no writing tools on the new board: \(wrong)")
            print("BAR new board: \(seen)")
        }
        // A board in a window of its own.
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1100, height: 760),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: NoteWindowView(noteID: note.id).modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1100, height: 760))
        defer { w.close() }
        for _ in 0..<100 where !board(w) { await MacWindowChromeTests.settle(w, 1) }
        await MacWindowChromeTests.settle(w, 20)
        #expect(board(w), "the board, in its own window")
        #expect(labels(w).contains("Share"), "its bar: \(labels(w).sorted())")
        #expect(labels(w).isDisjoint(with: writing), "no writing tools on a board in its own window: \(labels(w).sorted())")
    }

    /// The corner's tags stay on the board (real-window check, 17 Nov: "Hide Map", over the map's
    /// switch at the board's left edge, was cut off by the edge): a tag moves in to 8 points from
    /// either edge, and stays centred over its button where there's room.
    @Test func theCornersTagsStayOnTheBoard() async throws {
        let room = { (l: CGFloat, r: CGFloat) in CanvasTag.Room(left: l, right: r) }
        #expect(CanvasTag.middle(width: 80, room: .unlimited) == 40, "centred with room")
        #expect(CanvasTag.middle(width: 80, room: room(200, 200)) == 40)
        #expect(CanvasTag.middle(width: 80, room: room(22, 500)) == 14, "at the left edge: 8 from it")
        #expect(CanvasTag.middle(width: 80, room: room(500, 22)) == 66, "at the right edge: 8 from it")
        // Drawn: the map's switch at the board's left, its tag up.
        let view = ZStack(alignment: .bottomLeading) {
            Color.white
            CanvasBarButton(title: "Hide Map", symbol: "map.fill", tagShown: true) {}
                .padding(.leading, 6)
                .padding(.bottom, 8)
        }
        .frame(width: 320, height: 120)
        .coordinateSpace(.named(CanvasOverlay.space))
        let ax = OffscreenAX(view, size: CGSize(width: 320, height: 120))
        defer { ax.close() }
        await ax.settle()
        let rep = try MacEmptyDetailTests.picture(ax.window)
        let scale = CGFloat(rep.pixelsWide) / 320
        // The tag's dark points, above the button (the button's own glyph is below y = 70).
        var left = CGFloat.infinity, right = -CGFloat.infinity
        for y in stride(from: 4, to: 66, by: 1) {
            for x in stride(from: 0, to: 320, by: 0.5) {
                guard let c = rep.colorAt(x: Int(x * scale), y: Int(CGFloat(y) * scale))?.usingColorSpace(.sRGB) else { continue }
                if c.redComponent < 0.25 && c.greenComponent < 0.25 && c.blueComponent < 0.25 { left = min(left, x); right = max(right, x) }
            }
        }
        #expect(left.isFinite, "the tag is drawn")
        #expect(left >= CanvasTag.margin - 1, "the tag starts inside the board, 8 points in: \(left)")
        #expect(right > 40, "and reads in full: \(left) to \(right)")
    }

    /// Keys pressed down and up, as the window delivers them, without posting anything system-wide.
    /// `throughApp`: handed to the app first, as a key press comes (its local monitors see it).
    static func keys(_ text: String, flags: NSEvent.ModifierFlags = [], in w: NSWindow, throughApp: Bool = false) {
        let codes: [Character: UInt16] = ["a": 0, "s": 1, "n": 45, "p": 35, "r": 15, "v": 9, "x": 7, "\t": 48, "\r": 36, "\u{1B}": 53]
        for c in text {
            let chars = String(c)
            for kind in [NSEvent.EventType.keyDown, .keyUp] {
                if let e = NSEvent.keyEvent(with: kind, location: .zero, modifierFlags: flags, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: w.windowNumber,
                                            context: nil, characters: chars, charactersIgnoringModifiers: chars, isARepeat: false, keyCode: codes[c] ?? 0) {
                    if throughApp { NSApp.sendEvent(e) } else { w.sendEvent(e) }
                }
            }
        }
    }

    /// The board's name in the window's toolbar: the text field under it (its placeholder is a new
    /// board's name; the accessibility name is SwiftUI's, on a view around it).
    static func nameField(in w: NSWindow) -> NSTextField? {
        guard let frame = w.contentView?.superview else { return nil }
        return MacWindowChromeTests.find(NSTextField.self, in: frame) { $0.isEditable && $0.placeholderString == CanvasNote.title }
    }

    /// Each tool's letter reads in both looks (17 November 2026: in dark mode the letters were
    /// gone, drawn in a grey the glass's vibrancy turned to black): in a picture of the board, the
    /// corner of the Rectangle's cell where its R is has points well apart from the glass.
    @Test(arguments: [false, true])
    func theLettersReadInBothLooks(dark: Bool) async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, _) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark) }
        defer { w.close() }
        _ = try await CanvasNativeUITests.settledView(w, web)
        let cell = try #require(await Self.frame("canvas.tool.rectangle", in: w))
        let rep = try #require(NSBitmapImageRep(data: try await BoardEmilFixesTests.picture(w, covering: web)))
        let view = try #require(w.contentView?.superview)
        let scale = CGFloat(rep.pixelsWide) / view.bounds.width
        func light(_ x: CGFloat, _ y: CGFloat) -> CGFloat {
            guard let c = rep.colorAt(x: Int(x * scale), y: Int((view.bounds.height - y) * scale))?.usingColorSpace(.sRGB) else { return -1 }
            return 0.299 * c.redComponent + 0.587 * c.greenComponent + 0.114 * c.blueComponent
        }
        // The glass: the cell's top left corner, clear of its symbol. The letter: its bottom right.
        let ground = light(cell.minX + 3, cell.maxY - 3)
        var apart = 0
        for x in stride(from: cell.maxX - 9, to: cell.maxX - 1, by: 0.5) {
            for y in stride(from: cell.minY + 1, to: cell.minY + 8, by: 0.5) where abs(light(x, y) - ground) > 0.3 { apart += 1 }
        }
        #expect(apart >= 6, "the R stands apart from the glass in \(dark ? "dark" : "light") mode: \(apart) points, the glass \(ground)")
    }

    /// The whole window beside Excalidraw's (Emil, 17 November 2026: "they separate their UI
    /// more"): our board in Full Screen and plain Excalidraw (the board benchmark's page, the same
    /// version, BOARD_PLAIN) at the same size, the same drawing, its box selected, light and dark.
    /// Drawn only when EMIL_SHOTS names a folder.
    @Test func theWindowBesideExcalidraws() async throws {
        guard let path = ProcessInfo.processInfo.environment["EMIL_SHOTS"], BoardPenStrokeTests.plainFolder != nil else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let select = "(() => { const api = %@, e = api.getSceneElements().find((x) => x.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [e.id]: true } } }); return 1; })()"
        for dark in [false, true] {
            let c = try CanvasNativeUITests.canvasLibrary()
            let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
            // As the window you're using: Share's accent fill shows.
            let (w, web, _) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark, keyLook: true) }
            defer { w.close() }
            _ = try await CanvasNativeUITests.settledView(w, web)
            NotificationCenter.default.post(name: .paneCanvasPresenting, object: true)
            await MacWindowChromeTests.settle(w, 15)
            _ = try await CanvasNativeUITests.settledView(w, web)
            let scene = try #require(try await web.evaluateJavaScript("JSON.stringify({ type: 'excalidraw', version: 2, elements: amber._canvas.api.getSceneElements(), appState: {}, files: {} })") as? String)
            _ = try await web.evaluateJavaScript(String(format: select, "amber._canvas.api"))
            await MacWindowChromeTests.settle(w, 10)
            let ours = try #require(NSImage(data: try await BoardEmilFixesTests.picture(w, covering: web)))
            NotificationCenter.default.post(name: .paneCanvasPresenting, object: false)
            await MacWindowChromeTests.settle(w, 5)
            // Excalidraw, as large as our window, the same drawing.
            let size = w.frame.size
            let (pw, plain) = try await BoardPenStrokeTests.plainPage(size: size, titled: false)
            defer { pw.close() }
            let tall = try await plain.evaluateJavaScript("window.innerHeight") as? Double
            #expect(tall == Double(size.height), "the reference fills its window: \(tall ?? -1) of \(size.height)")
            _ = try await plain.callAsyncJavaScript("await window.__boardOpen(JSON.parse(scene)); return 1", arguments: ["scene": scene], contentWorld: .page)
            _ = try await plain.evaluateJavaScript("(() => { window.__excalidrawAPI.updateScene({ appState: { theme: '\(dark ? "dark" : "light")' } }); return 1; })()")
            _ = try await plain.evaluateJavaScript(String(format: select, "window.__excalidrawAPI"))
            try await Task.sleep(for: .milliseconds(600))
            let theirs = try await plain.takeSnapshot(configuration: WKSnapshotConfiguration())
            let picture = try #require(Self.sideBySide(ours, theirs, labels: ("Pinto Notes (Full Screen)", "Excalidraw 0.18.1"), dark: dark))
            try picture.write(to: dir.appending(path: "window-beside-excalidraw-\(dark ? "dark" : "light").png"))
        }
    }

    /// The browser board's tools, light and dark (Emil, 17 November 2026: the same tools in the
    /// browser board): the pages web/lib/board-palette-pictures.test.tsx writes into EMIL_SHOTS
    /// (its real palette, zoom and top bar with the board's stylesheet), photographed offscreen.
    @Test func theBrowserBoardsPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["EMIL_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        let pages = try FileManager.default.contentsOfDirectory(atPath: path).filter { $0.hasPrefix("web-board-") && $0.hasSuffix(".html") }.sorted()
        for page in pages {
            let size = page.contains("phone") ? CGSize(width: 390, height: 760) : CGSize(width: 1280, height: 720)
            for dark in [false, true] {
                let config = WKWebViewConfiguration()
                BoardLagTests.wakeful(config.preferences)
                let web = WKWebView(frame: CGRect(origin: .zero, size: size), configuration: config)
                web.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                let w = BoardLagTests.OffscreenWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                                      styleMask: [.borderless], backing: .buffered, defer: false)
                w.isReleasedWhenClosed = false
                w.ignoresMouseEvents = true
                w.hasShadow = false
                w.animationBehavior = .none
                w.collectionBehavior = [.transient, .ignoresCycle, .stationary, .fullScreenNone]
                w.contentView = web
                w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
                w.orderBack(nil)
                defer { w.close() }
                try #require(!NSScreen.screens.contains { $0.frame.intersects(w.frame) }, "the window stays off every screen: \(w.frame)")
                web.loadFileURL(dir.appending(path: page), allowingReadAccessTo: dir)
                try await CanvasTests().run(web, until: "document.readyState === 'complete' && !!document.querySelector('nav')")
                _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                try await Task.sleep(for: .milliseconds(200))
                let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                let rep = try #require(image.tiffRepresentation.flatMap(NSBitmapImageRep.init(data:)))
                let name = page.replacingOccurrences(of: ".html", with: "-\(dark ? "dark" : "light").png")
                try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: name))
            }
        }
    }

    /// Two pictures at one height side by side, each named above it.
    static func sideBySide(_ left: NSImage, _ right: NSImage, labels: (String, String), dark: Bool) -> Data? {
        let h: CGFloat = 900, gap: CGFloat = 40, top: CGFloat = 60
        let lw = left.size.width * h / left.size.height, rw = right.size.width * h / right.size.height
        let size = CGSize(width: lw + rw + 3 * gap, height: h + top + gap)
        guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width * 2), pixelsHigh: Int(size.height * 2), bitsPerSample: 8,
                                         samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { return nil }
        rep.size = size
        NSGraphicsContext.saveGraphicsState()
        defer { NSGraphicsContext.restoreGraphicsState() }
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        (dark ? NSColor(white: 0.16, alpha: 1) : NSColor(white: 0.9, alpha: 1)).setFill()
        CGRect(origin: .zero, size: size).fill()
        left.draw(in: CGRect(x: gap, y: gap, width: lw, height: h))
        right.draw(in: CGRect(x: 2 * gap + lw, y: gap, width: rw, height: h))
        let words: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 24, weight: .semibold), .foregroundColor: dark ? NSColor.white : NSColor.black]
        NSAttributedString(string: labels.0, attributes: words).draw(at: CGPoint(x: gap, y: h + gap + 16))
        NSAttributedString(string: labels.1, attributes: words).draw(at: CGPoint(x: 2 * gap + lw, y: h + gap + 16))
        return rep.representation(using: .png, properties: [:])
    }

    /// The palette's pictures, light and dark, for Emil (build/shots/emil-2): the whole window at
    /// 1400 pt with the pencil picked and the lock on, and a narrow board (more of it in More).
    /// Drawn only when EMIL_SHOTS names a folder.
    @Test func pictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["EMIL_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let look = dark ? "dark" : "light"
            let c = try CanvasNativeUITests.canvasLibrary()
            let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
            let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark) }
            defer { w.close() }
            _ = try await CanvasNativeUITests.settledView(w, web)
            try await BoardEmilFixesTests.picture(w, covering: web).write(to: dir.appending(path: "palette-board-\(look).png"))
            canvas.pick(.freedraw)
            canvas.send(.lock(true))
            for _ in 0..<60 where !(canvas.state.locked && canvas.state.tool == .freedraw) { await MacWindowChromeTests.settle(w, 1) }
            await MacWindowChromeTests.settle(w, 5)
            try await BoardEmilFixesTests.picture(w, covering: web).write(to: dir.appending(path: "palette-pencil-locked-\(look).png"))
            w.setContentSize(CGSize(width: 900, height: 700))
            _ = try await CanvasNativeUITests.settledView(w, web)
            await MacWindowChromeTests.settle(w, 10)
            try await BoardEmilFixesTests.picture(w, covering: web).write(to: dir.appending(path: "palette-narrow-\(look).png"))
        }
    }

    /// An element's frame in the window, found by its identifier.
    static func frame(_ id: String, in w: NSWindow) async -> CGRect? {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        for _ in 0..<20 {
            if let e = MacEmptyDetailTests.element(id, in: w), let screen = e.value(forKey: "accessibilityFrame") as? NSRect, screen.width > 0 {
                return w.convertFromScreen(screen)
            }
            await MacWindowChromeTests.settle(w, 1)
        }
        return nil
    }

    static func press(_ id: String, in w: NSWindow) throws {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        let e = try #require(MacEmptyDetailTests.element(id, in: w), "no \(id)")
        _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
    }
}
#endif
