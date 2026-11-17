#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// What Emil found using the whiteboard in a test build (16 November 2026): the toolbar's glyphs,
/// the board's location, buttons that took a click only on their glyph, the I-beam over the
/// board, a style panel, Back to content, Full Screen for every note, and the note-to-board switch.
/// All offscreen.
@MainActor @Suite(.serialized) struct BoardEmilFixesTests {

    /// One set of glyphs: every tool's is an SF Symbol, the same weight and size in the bar. Draw
    /// is a pen's tip, not a pencil's body; Shapes shows shapes, not a lone outline that read as an
    /// empty button.
    @Test func theToolbarsGlyphsAreOneSet() {
        for tool in CanvasTool.allCases {
            #expect(NSImage(systemSymbolName: tool.symbol, accessibilityDescription: nil) != nil, "\(tool.title): \(tool.symbol) is an SF Symbol")
        }
        for symbol in [CanvasTool.shapesSymbol, CanvasLibraryPopover.symbol, BoardCommentUI.symbol] {
            #expect(NSImage(systemSymbolName: symbol, accessibilityDescription: nil) != nil, "\(symbol) is an SF Symbol")
        }
        #expect(CanvasTool.freedraw.symbol == "pencil.tip")
        #expect(!["square", "circle", "rectangle", "diamond"].contains(CanvasTool.shapesSymbol), "Shapes shows more than one shape")
    }

    /// The board's location is one item, as a note's is: its folder, a chevron, then its name.
    /// Before, the folder and the name were two items with only space between ("Notes  Kanban").
    @Test func aBoardsLocationReadsAsANotes() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            let crumb = try #require(await frame("note.crumb.0", in: w), "the board's folder")
            let name = try #require(await frame("canvas.title", in: w), "the board's name")
            // One toolbar item holds both.
            let item = (w.toolbar?.items ?? []).first { i in
                guard let v = i.view, v.window != nil else { return false }
                let f = v.convert(v.bounds, to: nil).insetBy(dx: -0.5, dy: -0.5)
                return f.contains(crumb) && f.contains(name)
            }
            #expect(item != nil, "the folder \(crumb) and the name \(name) are one item")
            // The chevron between them, then the name at a note's title's inset: where a note's
            // title starts, not a toolbar item's gap further on.
            #expect(CanvasTitleField.inset == ButtonSize.compact.padding * 0.75)
            let gap = name.minX - crumb.maxX, want = NoteBreadcrumbs.chevronWidth + CanvasTitleField.inset
            #expect(abs(gap - want) <= 2, "the chevron and the inset between them: \(gap), want \(want)")
        }
    }

    /// Every point of a toolbar button's round hover takes the click: the button is the whole
    /// 36-point cell, not its glyph's box (Emil: a click in the corner of the hovered Eraser did
    /// nothing).
    @Test func aToolbarButtonIsItsWholeCell() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            // The board's own actions (its tools are on the board now: CanvasToolPaletteTests;
            // More is a note's, a menu).
            let ids = ["canvas.tool.library", "canvas.comments"]
            var checked = 0
            for id in ids {
                guard let f = await frame(id, in: w) else { continue }
                checked += 1
                #expect(f.width >= ToolbarCell.size - 1 && f.height >= ToolbarCell.size - 1, "\(id) takes clicks over its whole cell: \(f.size)")
                // AppKit gives every point of it to the item (the hover is a circle in the cell).
                // A point past the end of its glass group is between two groups, where no hover
                // shows: not asked.
                let frame = try #require(w.contentView?.superview)
                let item = (w.toolbar?.items ?? []).first { i in
                    guard let v = i.view else { return false }
                    return v.convert(v.bounds, to: nil).contains(NSPoint(x: f.midX, y: f.midY))
                }
                let group = try #require(item?.view.map { $0.convert($0.bounds, to: nil) }, "\(id) is in a toolbar item")
                var probed = 0
                for (dx, dy) in [(0.0, 0.0), (-12.0, -12.0), (12.0, 12.0), (-12.0, 12.0), (12.0, -12.0), (-17.0, 0.0), (17.0, 0.0), (0.0, -17.0), (0.0, 17.0)] {
                    let p = NSPoint(x: f.midX + dx, y: f.midY + dy)
                    guard group.insetBy(dx: 0.5, dy: 0.5).contains(p) else { continue }
                    probed += 1
                    let hit = frame.hitTest(frame.convert(p, from: nil))
                    var v = hit, inside = false
                    while let x = v { if x === item?.view { inside = true; break }; v = x.superview }
                    #expect(inside, "\(id): a click \(Int(dx)),\(Int(dy)) from its middle lands on \(hit.map { String(describing: type(of: $0)) } ?? "nothing")")
                }
                #expect(probed >= 7, "\(id): its corners and three of its edges were tried: \(probed)")
            }
            #expect(checked >= 2, "found the board's buttons: \(checked)")
        }
    }

    /// The I-beam flickered as the mouse crossed the board: the note's text view was only faded
    /// out under it, and its cursor rects stayed live. Under a board it's hidden; back on a note
    /// it shows.
    @Test func noTextViewLiesUnderTheBoard() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, _) = try await Self.openBoard(c, board)
        defer { w.close() }
        let area = web.convert(web.bounds, to: nil)
        func textViews(_ v: NSView) -> [NSTextView] { (v as? NSTextView).map { [$0] } ?? [] + v.subviews.flatMap(textViews) }
        let root = try #require(w.contentView?.superview)
        let under = textViews(root).filter { !$0.isHiddenOrHasHiddenAncestor && $0.convert($0.bounds, to: nil).intersects(area) }
        #expect(under.isEmpty, "text views live under the board: \(under.map { String(describing: type(of: $0)) })")
        // Back on a note, its text shows.
        let groceries = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Groceries" })
        NoteOpener.shared.request = groceries.id
        await MacWindowChromeTests.settle(w, 15)
        let editor = textViews(root).first { $0 is PaneTextView && !$0.isHiddenOrHasHiddenAncestor }
        #expect(editor != nil, "the note's text shows")
    }

    /// The style panel in Full Screen: Excalidraw's whole panel at the board's left, under the
    /// tools, always open (no title to fold it by). With nothing selected it sets how the next
    /// shape is drawn; with a selection, the selection, and it holds what the bar over the
    /// selection held (Layers, Align, Actions): the Mac has no bar over the selection now (Emil,
    /// 17 November 2026). Clicks beside it reach the board.
    @Test func theStylePanelIsExcalidrawsWholePanelInFullScreen() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        NotificationCenter.default.post(name: .paneCanvasPresenting, object: true)
        defer { NotificationCenter.default.post(name: .paneCanvasPresenting, object: false) }
        await MacWindowChromeTests.settle(w, 15)
        let area = web.convert(web.bounds, to: nil)
        #expect(CanvasStyleSidebar.layout(board: area.width) == .wide, "Full Screen gives the board \(area.width) pt")
        // Nothing selected: everything a new shape takes.
        #expect(CanvasStyleSidebar.parts(canvas.state).next)
        let panel = try #require(await frame("canvas.stylePanel", in: w), "the style panel shows")
        #expect(abs(panel.minX - area.minX - CanvasStyleSidebar.inset) < 2, "at the board's left: \(panel) in \(area)")
        #expect(abs(panel.width - CanvasStyleSidebar.width) <= 1, "the whole panel: \(panel.width)")
        #expect(await frame("canvas.stylePanel.toggle", in: w) == nil, "nothing to fold it by")
        #expect(await frame("canvas.stylePanel.picker.strokeColor", in: w) != nil, "the colour in use opens Excalidraw's picker")
        // Extra bold, for the next shape.
        try press("canvas.stylePanel.width.2", in: w)
        try await CanvasTests().run(web, until: "window.amber._canvas.api.getAppState().currentItemStrokeWidth === 4")
        // Clicks beside and below it reach the board; a click on it is the panel's.
        // (A view's hitTest takes its superview's coordinates: the window's frame view has none.)
        let root = try #require(w.contentView?.superview)
        func onBoard(_ p: NSPoint) -> Bool {
            var v = root.hitTest(root.convert(p, from: nil))
            while let x = v { if x === web { return true }; v = x.superview }
            return false
        }
        for p in [NSPoint(x: panel.maxX + 6, y: panel.midY), NSPoint(x: panel.midX, y: panel.minY - 6), NSPoint(x: panel.midX, y: panel.minY - 120)]
            where area.contains(p) {
            #expect(onBoard(p), "a click beside the panel at \(p) reaches the board")
        }
        #expect(!onBoard(NSPoint(x: panel.midX, y: panel.maxY - 16)), "a click on the panel is the panel's")
        // A box selected: no bar over it; the panel has its layers and what to do with it.
        _ = try await web.evaluateJavaScript("(() => { const api = amber._canvas.api, e = api.getSceneElements().find((x) => x.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [e.id]: true } } }); return 1; })()")
        for _ in 0..<40 where !canvas.state.hasSelection { await MacWindowChromeTests.settle(w, 1) }
        await MacWindowChromeTests.settle(w, 5)
        #expect(await frame("canvas.selectionBar", in: w) == nil, "no bar over the selection on the Mac")
        let parts = CanvasStyleSidebar.parts(canvas.state)
        #expect(!parts.next && parts.layers && parts.actions && !parts.align)
        for id in ["canvas.stylePanel.layer.sendToBack", "canvas.stylePanel.layer.bringToFront", "canvas.stylePanel.action.duplicate",
                   "canvas.stylePanel.action.delete", "canvas.stylePanel.action.saveToLibrary", "canvas.stylePanel.action.saveTemplate"] {
            #expect(await frame(id, in: w) != nil, "\(id) is in the panel")
        }
        #expect((await frame("canvas.stylePanel.action.comment", in: w) != nil) == (canvas.canComment && !canvas.viewOnly), "Add Comment when you can comment")
        let count = "amber._canvas.api.getSceneElements().filter((e) => !e.isDeleted).length"
        let before = try #require(try await web.evaluateJavaScript(count) as? Int)
        try press("canvas.stylePanel.action.duplicate", in: w)
        try await CanvasTests().run(web, until: "\(count) > \(before)")
        // Everything: the panel sets it, and lines it up.
        canvas.run(.selectAll)
        for _ in 0..<40 where canvas.state.selection.count < 2 { await MacWindowChromeTests.settle(w, 1) }
        await MacWindowChromeTests.settle(w, 3)
        #expect(!CanvasStyleSidebar.parts(canvas.state).next)
        try press("canvas.stylePanel.strokeStyle.1", in: w)
        try await CanvasTests().run(web, until: "window.amber._canvas.api.getSceneElements().filter(e => !e.isDeleted && e.type === 'rectangle').every(e => e.strokeStyle === 'dashed')")
        #expect(await frame("canvas.stylePanel.align.alignLeft", in: w) != nil, "Align, for two or more")
        // And the right-click menu lines them up too (the bar's Align).
        let align = try #require(web.canvasMenu().items.first { $0.title == CanvasStyleSidebar.alignTitle }?.submenu, "Align in the right-click menu")
        #expect(align.items.map(\.title) == CanvasStyleSidebar.aligns(canvas.state.alignCount).map(\.title))
    }

    /// The style panel beside the sidebar and the list: Excalidraw's compact strip, a button for
    /// each section that applies, each opening its section beside the strip (the board is narrower
    /// than CanvasStyleSidebar.wideFrom).
    @Test func theStylePanelIsAStripBesideTheColumns() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 5)
        let area = web.convert(web.bounds, to: nil)
        #expect(CanvasStyleSidebar.layout(board: area.width) == .compact, "the board beside the columns: \(area.width) pt")
        let strip = try #require(await frame("canvas.stylePanel", in: w), "the strip shows")
        #expect(abs(strip.width - CanvasStyleSidebar.strip) <= 1 && abs(strip.minX - area.minX - CanvasStyleSidebar.inset) < 2, "a strip at the left: \(strip)")
        @MainActor func shown() async -> [CanvasStyleSidebar.Pop] {
            var out: [CanvasStyleSidebar.Pop] = []
            for pop in CanvasStyleSidebar.Pop.allCases where await frame("canvas.stylePanel.open.\(pop.rawValue)", in: w, tries: 3) != nil { out.append(pop) }
            return out
        }
        // Nothing selected: the next shape's style.
        #expect(await shown() == [.stroke, .fill, .lines, .text, .opacity])
        // A box: its style, then Layers and Actions.
        _ = try await web.evaluateJavaScript("(() => { const api = amber._canvas.api, e = api.getSceneElements().find((x) => x.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [e.id]: true } } }); return 1; })()")
        for _ in 0..<40 where !canvas.state.hasSelection { await MacWindowChromeTests.settle(w, 1) }
        await MacWindowChromeTests.settle(w, 5)
        #expect(await shown() == CanvasStyleSidebar.Pop.allCases.filter { $0.shows(CanvasStyleSidebar.parts(canvas.state)) })
        #expect(await shown().suffix(2) == [.arrange, .actions])
        // Clicks beside it reach the board (where it is now: it grew for the box's Layers and Actions).
        let grown = try #require(await frame("canvas.stylePanel", in: w))
        #expect(grown.height > strip.height, "more buttons for a box: \(strip.height) to \(grown.height)")
        let root = try #require(w.contentView?.superview)
        for p in [NSPoint(x: grown.maxX + 6, y: grown.midY), NSPoint(x: grown.midX, y: grown.minY - 6)] where area.contains(p) {
            let hit = root.hitTest(root.convert(p, from: nil))
            var v = hit, onBoard = false, chain: [String] = []
            while let x = v { chain.append(String(describing: type(of: x))); if x === web { onBoard = true; break }; v = x.superview }
            #expect(onBoard, "a click beside the strip \(grown) at \(p) reaches the board: \(chain.prefix(6))")
        }
    }

    /// What a strip button or the colour in use opens shows beside the panel, below the tools
    /// (real-window check, 17 Nov: the colour popover, centred on its button, covered the left half
    /// of the tools' palette): its top at its opener's, none of it over the palette. The board's ink
    /// (#2a1d10, not one of the palette's colours) shows no Shades. A click on the board closes it,
    /// as Escape does, and the keys are the board's again. Beside the columns (the strip) and in
    /// Full Screen (the whole panel).
    @Test func whatThePanelOpensShowsBesideItBelowTheTools() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 5)
        canvas.set(.strokeColor, .text("#2a1d10"))
        for _ in 0..<40 where canvas.state.strokeColor != "#2a1d10" { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.strokeColor == "#2a1d10", "the board's ink: \(canvas.state.strokeColor)")
        @MainActor func opens(_ opener: String, beside panelID: String, _ name: String) async throws {
            let palette = try #require(await frame("canvas.palette", in: w), "\(name): the palette")
            let panel = try #require(await frame(panelID, in: w), "\(name): the panel")
            let button = try #require(await frame(opener, in: w), "\(name): \(opener)")
            try press(opener, in: w)
            let card = try #require(await frame("canvas.stylePanel.card", in: w), "\(name): it opens")
            // Window points: a bigger y is higher up.
            #expect(card.minX >= panel.maxX + 4 && card.minX <= panel.maxX + 12, "\(name): beside the panel: \(card) by \(panel)")
            #expect(!card.intersects(palette), "\(name): not over the tools: \(card) and \(palette)")
            #expect(card.maxY <= palette.minY, "\(name): below the tools' bottom edge: \(card.maxY) under \(palette.minY)")
            #expect(abs(card.maxY - button.maxY) <= 2, "\(name): at its opener's top: \(card.maxY) and \(button.maxY)")
            #expect(await frame("canvas.color.blue", in: w) != nil, "\(name): the palette's colours")
            let shades = await frame("canvas.color.shades", in: w, tries: 2), shade = await frame("canvas.color.shade.1", in: w, tries: 2)
            #expect(shades == nil && shade == nil, "\(name): no Shades for the board's ink")
        }
        // Beside the columns: the strip's Stroke.
        try await opens("canvas.stylePanel.open.stroke", beside: "canvas.stylePanel", "the strip")
        // A click on the board closes it; the click is the board's.
        let area = web.convert(web.bounds, to: nil)
        let root = try #require(w.contentView?.superview)
        let spot = NSPoint(x: area.maxX - 40, y: area.minY + 140)
        let down = try #require(NSEvent.mouseEvent(with: .leftMouseDown, location: spot, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                   windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1))
        let hit = root.hitTest(root.convert(spot, from: nil))
        #expect(hit === web || hit?.isDescendant(of: web) == true, "the spot is the board's")
        NSApp.sendEvent(down)
        let up = try #require(NSEvent.mouseEvent(with: .leftMouseUp, location: spot, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                 windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 0))
        NSApp.sendEvent(up)
        for _ in 0..<30 where await frame("canvas.stylePanel.card", in: w, tries: 1) != nil { await MacWindowChromeTests.settle(w, 1) }
        #expect(await frame("canvas.stylePanel.card", in: w, tries: 2) == nil, "a click on the board closes it")
        // Full Screen: the whole panel, and the colour in use's picker beside it.
        NotificationCenter.default.post(name: .paneCanvasPresenting, object: true)
        defer { NotificationCenter.default.post(name: .paneCanvasPresenting, object: false) }
        await MacWindowChromeTests.settle(w, 15)
        #expect(CanvasStyleSidebar.layout(board: web.convert(web.bounds, to: nil).width) == .wide)
        try await opens("canvas.stylePanel.picker.strokeColor", beside: "canvas.stylePanel", "the whole panel")
        // Escape closes it, and the keys are the board's (through the app, as a key press comes).
        CanvasToolPaletteTests.keys("\u{1B}", in: w, throughApp: true)
        for _ in 0..<30 where await frame("canvas.stylePanel.card", in: w, tries: 1) != nil { await MacWindowChromeTests.settle(w, 1) }
        #expect(await frame("canvas.stylePanel.card", in: w, tries: 2) == nil, "Escape closes it")
        #expect(w.firstResponder === web, "the keys are the board's: \(w.firstResponder.map { String(describing: type(of: $0)) } ?? "nothing")")
    }

    /// Something's drawn but none of it is in view: Back to content shows, and brings it back.
    @Test func backToContentFindsTheDrawing() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, _, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        #expect(!canvas.state.lost, "the drawing is in view as it opens")
        #expect(await MacEmptyDetailTests.element("canvas.backToContent", in: w) == nil)
        canvas.send(.pan(dx: 20000, dy: 20000))
        for _ in 0..<40 where !canvas.state.lost { await MacWindowChromeTests.settle(w, 1) }
        #expect(canvas.state.lost, "panned away from all of it")
        _ = try #require(await frame("canvas.backToContent", in: w), "Back to content shows")
        try press("canvas.backToContent", in: w)
        for _ in 0..<40 where canvas.state.lost { await MacWindowChromeTests.settle(w, 1) }
        #expect(!canvas.state.lost, "the drawing is back in view")
    }

    /// Full Screen is in every note's toolbar: an ordinary note and a note app. A board's bar has
    /// only its actions (Emil, 17 November 2026): its Full Screen is the window's, and ⇧⌘F
    /// (CanvasNativeUITests, theBoardsToolbarNeverClips).
    @Test(arguments: ["note", "app"])
    func everyNoteHasFullScreen(_ kind: String) async throws {
        let (c, title) = try Self.library(kind)
        try await AppSnapshotTests.withLastNote(c, title) {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            let labels = try MacWindowChromeTests.items(w).map(\.label)
            #expect(labels.contains("Full Screen"), "\(title): Full Screen in the toolbar: \(labels)")
            try press("note.fullScreen", in: w)
            await MacWindowChromeTests.settle(w, 10)
            #expect(try CanvasNativeUITests.collapsed(w) == [true, true], "\(title): Full Screen folds the columns")
            let after = try MacWindowChromeTests.items(w).map(\.label)
            #expect(after.contains("Exit Full Screen"), "\(title): and offers its way out: \(after)")
        }
    }

    /// Opening a board from a note, and a note from a board, changes the bar in one step: never a
    /// note's writing tools beside a board's tools, never a bar with neither, and the location
    /// always there.
    @Test(arguments: [false, true])
    func theSwitchChangesTheBarInOneStep(toNote: Bool) async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        let board = try #require(notes.first { $0.title == "Publishing flow" })
        let note = try #require(notes.first { $0.title == "Groceries" })
        try await AppSnapshotTests.withLastNote(c, toNote ? board.title : note.title) {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 30)
            NoteOpener.shared.request = toNote ? note.id : board.id
            var states: [String] = []
            for _ in 0..<60 {
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                let labels = Set((w.toolbar?.items ?? []).filter { !$0.isHidden && $0.view?.window != nil }.map(\.label))
                // A board's bar: its Comments (its tools are on the board now).
                let writing = labels.contains("Checklist"), drawing = labels.contains(BoardCommentUI.title)
                #expect(!(writing && drawing), "a note's tools beside a board's: \(labels.sorted())")
                let state = writing ? "note" : drawing ? "board" : "neither"
                if states.last != state { states.append(state) }
                try await Task.sleep(for: .milliseconds(16))
            }
            let want = toNote ? ["board", "note"] : ["note", "board"]
            #expect(states == want || states == [want[1]], "the bar went \(states.joined(separator: " → "))")
        }
    }

    /// A board comes back at the view you left it at, so it takes over from its picture (taken as
    /// you left it) without moving. Before, it opened centred while its picture showed it where you
    /// had been, and the drawing jumped as the live board came in.
    @Test func aBoardComesBackAsYouLeftIt() async throws {
        let c = try CanvasNativeUITests.canvasLibrary()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        let board = try #require(notes.first { $0.title == "Publishing flow" })
        let note = try #require(notes.first { $0.title == "Groceries" })
        let (w, web, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        let opened = try await CanvasNativeUITests.settledView(w, web)
        canvas.send(.pan(dx: 140, dy: -90))
        canvas.run(.zoomOut)
        try await CanvasTests().run(web, until: "window.amber._canvasView().zoom < \(opened["zoom"] as? Double ?? 1) - 0.01")
        let left = try await CanvasNativeUITests.settledView(w, web)
        NoteOpener.shared.request = note.id
        await MacWindowChromeTests.settle(w, 15)
        #expect(NotePageSandbox.boardViews[board.id] != nil, "its view kept as it went")
        NoteOpener.shared.request = board.id
        var again: NotePageWebView?
        for _ in 0..<100 where again == nil {
            if let v = NotePageLive.view(board.id) as? NotePageWebView, v !== web { again = v } else { await MacWindowChromeTests.settle(w, 1) }
        }
        let back = try #require(again, "the board opened again")
        let x = try #require(left["scrollX"] as? Double), y = try #require(left["scrollY"] as? Double), z = try #require(left["zoom"] as? Double)
        try await CanvasTests().run(back, until: "(() => { const v = window.amber && amber._canvasView && amber._canvasView(); return !!v && Math.abs(v.scrollX - \(x)) < 0.5 && Math.abs(v.scrollY - \(y)) < 0.5 && Math.abs(v.zoom - \(z)) < 0.001; })()")
        let now = try await CanvasNativeUITests.settledView(w, back)
        #expect(abs((now["scrollX"] as? Double ?? .nan) - x) < 0.5 && abs((now["zoom"] as? Double ?? .nan) - z) < 0.001, "back at \(now), left at \(left)")
    }

    /// The pictures for Emil (build/shots/emil-1), light and dark: the board's toolbar and
    /// location, a note's location beside it, the style panel for the next shape and for a
    /// selection, Back to content, and Full Screen on a note and on an app. Drawn only when
    /// EMIL_SHOTS names a folder (TEST_RUNNER_EMIL_SHOTS=dir).
    @Test func pictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["EMIL_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let look = dark ? "dark" : "light"
            func save(_ name: String, _ w: NSWindow, _ web: WKWebView?) async throws {
                try await Self.picture(w, covering: web).write(to: dir.appending(path: "\(name)-\(look).png"))
            }
            let c = try CanvasNativeUITests.canvasLibrary()
            let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
            let board = try #require(notes.first { $0.title == "Publishing flow" })
            do {
                let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark) }
                defer { w.close() }
                _ = try await CanvasNativeUITests.settledView(w, web)
                @MainActor func select(_ filter: String) async throws {
                    _ = try await web.evaluateJavaScript("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => \(filter)).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
                    for _ in 0..<40 where canvas.state.hasSelection == (filter == "false") { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 5)
                }
                let box = "e.id === (amber._canvas.api.getSceneElements().find((x) => x.type === 'rectangle') || {}).id"
                // Beside the columns: the compact strip, for the next shape, then for a box.
                try await save("board", w, web)
                try await select(box)
                try await save("style-panel-compact-selection", w, web)
                // Full Screen: the whole panel, for the next shape, a box, and all of it (Align).
                try await select("false")
                NotificationCenter.default.post(name: .paneCanvasPresenting, object: true)
                await MacWindowChromeTests.settle(w, 15)
                _ = try await CanvasNativeUITests.settledView(w, web)
                try await save("style-panel-wide-next-shape", w, web)
                try await select(box)
                try await save("style-panel-wide-selection", w, web)
                try await select("!e.isDeleted")
                try await save("style-panel-wide-all", w, web)
                try await select("false")
                NotificationCenter.default.post(name: .paneCanvasPresenting, object: false)
                await MacWindowChromeTests.settle(w, 15)
                // Nothing drawn in view: Back to content.
                canvas.send(.pan(dx: 20000, dy: 20000))
                for _ in 0..<40 where !canvas.state.lost { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 5)
                try await save("back-to-content", w, web)
            }
            // Excalidraw's colour picker, as its card shows it: the grid with its keys, the
            // shades with theirs, the hex code and the eyedropper.
            do {
                let canvas = CanvasController()
                canvas.receive(["selection": ["rectangle"], "style": ["strokeColor": "#1971c2"]])
                let ax = OffscreenAX(CanvasColorPicker(canvas: canvas, key: .strokeColor, current: "#1971c2")
                    .padding(14)
                    .background(Color.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(20)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(nsColor: .windowBackgroundColor)), size: CGSize(width: 260, height: 330), dark: dark)
                defer { ax.close() }
                await ax.settle()
                try #require(try MacEmptyDetailTests.picture(ax.window).representation(using: .png, properties: [:]))
                    .write(to: dir.appending(path: "color-picker-\(look).png"))
            }
            // A note's location, for the board's beside it: a long note scrolled past its title,
            // which then shows after the folder (as in Notes).
            try await AppSnapshotTests.withLastNote(c, "Welcome to Pinto Notes") {
                let w = Self.window(c, dark: dark)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                func editors(_ v: NSView) -> [PaneTextView] { ((v as? PaneTextView).map { [$0] } ?? []) + v.subviews.flatMap(editors) }
                let content = try #require(w.contentView)
                let scroll = try #require(editors(content).first?.enclosingScrollView)
                scroll.contentView.scroll(to: NSPoint(x: 0, y: 260))
                scroll.reflectScrolledClipView(scroll.contentView)
                await MacWindowChromeTests.settle(w, 10)
                try await save("note", w, nil)
            }
            // Full Screen on a note and on an app.
            for kind in ["note", "app"] {
                let (lib, title) = try Self.library(kind)
                let all = try lib.mainContext.fetch(FetchDescriptor<Note>())
                let app = kind == "app" ? all.first(where: { $0.title == title }) : nil
                try await AppSnapshotTests.withLastNote(lib, title) {
                    let w = Self.window(lib, dark: dark)
                    defer { w.close() }
                    await MacWindowChromeTests.settle(w, 20)
                    var web: WKWebView?
                    if let app {
                        for _ in 0..<100 where web == nil {
                            web = NotePageLive.view(app.id)
                            if web == nil { await MacWindowChromeTests.settle(w, 1) }
                        }
                        await MacWindowChromeTests.settle(w, 10)
                    }
                    try press("note.fullScreen", in: w)
                    await MacWindowChromeTests.settle(w, 15)
                    try await save("fullscreen-\(kind)", w, web)
                }
            }
        }
    }

    // MARK: Helpers

    /// A library with a note of each kind, and the title of the one asked for: an ordinary note,
    /// a board, or a note app (the habit tracker).
    private static func library(_ kind: String) throws -> (ModelContainer, String) {
        switch kind {
        case "board": return (try CanvasNativeUITests.canvasLibrary(), "Publishing flow")
        case "app":
            let c = try NotePageMacShots.library()
            let app = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.isPinned && NotePageStore.shared[$0.id] != nil })
            return (c, app.title)
        default: return (try CanvasNativeUITests.canvasLibrary(), "Groceries")
        }
    }

    /// The app's window, offscreen, light or dark.
    private static func window(_ c: ModelContainer, dark: Bool) -> NSWindow {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1400, height: 900),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
            .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
        w.setContentSize(CGSize(width: 1400, height: 900))
        return w
    }

    /// The window as a PNG, a page in it drawn from its own picture (an offscreen web view isn't
    /// drawn into the window's).
    static func picture(_ w: NSWindow, covering web: WKWebView?) async throws -> Data {
        var cover: NSImageView?
        if let web {
            _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
            let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
            let v = NSImageView(frame: web.bounds)
            v.image = image
            v.imageScaling = .scaleAxesIndependently
            v.wantsLayer = true
            web.addSubview(v)
            cover = v
        }
        defer { cover?.removeFromSuperview() }
        w.contentView?.layoutSubtreeIfNeeded()
        w.displayIfNeeded()
        return try #require(try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:]))
    }

    /// The board open in a window of its own, offscreen.
    private static func openBoard(_ c: ModelContainer, _ board: Note) async throws -> (NSWindow, NotePageWebView, CanvasController) {
        try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: false) }
    }

    /// An element's frame in the window, found by its identifier (toolbar items too).
    private func frame(_ id: String, in w: NSWindow, tries: Int = 20) async -> CGRect? {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        for _ in 0..<tries {
            if let e = MacEmptyDetailTests.element(id, in: w), let screen = e.value(forKey: "accessibilityFrame") as? NSRect, screen.width > 0 {
                return w.convertFromScreen(screen)
            }
            await MacWindowChromeTests.settle(w, 1)
        }
        return nil
    }

    private func press(_ id: String, in w: NSWindow) throws {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        let e = try #require(MacEmptyDetailTests.element(id, in: w), "no \(id)")
        _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
    }
}
#endif
