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
            let ids = ["canvas.tool.selection", "canvas.tool.hand", "canvas.tool.freedraw", "canvas.tool.arrow", "canvas.tool.text",
                       "canvas.tool.eraser", "canvas.tool.library", "canvas.comments", "note.fullScreen"]
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
            #expect(checked >= 6, "found the board's buttons: \(checked)")
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

    /// The style panel: at the board's top left, folded and opened from its title. With nothing
    /// selected it sets how the next shape is drawn; with a selection, the selection. Clicks
    /// beside it reach the board.
    @Test func theStylePanelSetsTheNextShapeAndTheSelection() async throws {
        let d = UserDefaults.standard
        let kept = d.object(forKey: CanvasStyleSidebar.openKey)
        defer { if let kept { d.set(kept, forKey: CanvasStyleSidebar.openKey) } else { d.removeObject(forKey: CanvasStyleSidebar.openKey) } }
        d.set(true, forKey: CanvasStyleSidebar.openKey)
        let c = try CanvasNativeUITests.canvasLibrary()
        let board = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        let (w, web, canvas) = try await Self.openBoard(c, board)
        defer { w.close() }
        await MacWindowChromeTests.settle(w, 5)
        // Nothing selected: everything a new shape takes.
        #expect(CanvasStyleSidebar.parts(canvas.state).next)
        let panel = try #require(await frame("canvas.stylePanel", in: w), "the style panel shows")
        let area = web.convert(web.bounds, to: nil)
        #expect(abs(panel.minX - area.minX - CanvasStyleSidebar.inset) < 2, "at the board's left: \(panel) in \(area)")
        #expect(panel.width <= CanvasStyleSidebar.width + 1)
        // Extra bold, for the next shape.
        try press("canvas.stylePanel.width.2", in: w)
        try await CanvasTests().run(web, until: "window.amber._canvas.api.getAppState().currentItemStrokeWidth === 4")
        // Clicks beside and below it reach the board.
        // (A view's hitTest takes its superview's coordinates: the window's frame view has none.)
        let root = try #require(w.contentView?.superview)
        for p in [NSPoint(x: panel.maxX + 6, y: panel.midY), NSPoint(x: panel.midX, y: panel.minY - 6), NSPoint(x: panel.midX, y: panel.minY - 200)] {
            let hit = root.hitTest(root.convert(p, from: nil))
            var v = hit, onBoard = false
            while let x = v { if x === web { onBoard = true; break }; v = x.superview }
            #expect(onBoard, "a click beside the panel at \(p) lands on \(hit.map { String(describing: type(of: $0)) } ?? "nothing")")
        }
        // And a click on it is the panel's.
        let onPanel = root.hitTest(root.convert(NSPoint(x: panel.midX, y: panel.maxY - 14), from: nil))
        var under = onPanel, toBoard = false
        while let x = under { if x === web { toBoard = true; break }; under = x.superview }
        #expect(onPanel != nil && !toBoard, "a click on the panel's title is the panel's: \(onPanel.map { String(describing: type(of: $0)) } ?? "nothing")")
        // The box beside it selected: its bar keeps off the panel (it lay over the Opacity row).
        _ = try await web.evaluateJavaScript("(() => { const api = amber._canvas.api, e = api.getSceneElements().find((x) => x.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [e.id]: true } } }); return 1; })()")
        for _ in 0..<40 where !canvas.state.hasSelection { await MacWindowChromeTests.settle(w, 1) }
        await MacWindowChromeTests.settle(w, 5)
        let bar = try #require(await frame("canvas.selectionBar", in: w), "the selection bar shows")
        let beside = try #require(await frame("canvas.stylePanel", in: w))
        #expect(!bar.intersects(beside), "the selection bar \(bar) keeps off the style panel \(beside)")
        // A selection: the panel sets it.
        canvas.run(.selectAll)
        for _ in 0..<40 where !canvas.state.hasSelection { await MacWindowChromeTests.settle(w, 1) }
        #expect(!CanvasStyleSidebar.parts(canvas.state).next)
        try press("canvas.stylePanel.strokeStyle.1", in: w)
        try await CanvasTests().run(web, until: "window.amber._canvas.api.getSceneElements().filter(e => !e.isDeleted && e.type === 'rectangle').every(e => e.strokeStyle === 'dashed')")
        // Folded to its title, and open again.
        try press("canvas.stylePanel.toggle", in: w)
        await MacWindowChromeTests.settle(w, 3)
        let folded = try #require(await frame("canvas.stylePanel", in: w))
        #expect(folded.height < 40 && folded.width < panel.width, "folded to its title: \(folded)")
        #expect(d.bool(forKey: CanvasStyleSidebar.openKey) == false, "remembered folded")
        try press("canvas.stylePanel.toggle", in: w)
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

    /// Full Screen is in every note's toolbar, as a board's: an ordinary note and a note app too.
    @Test(arguments: ["note", "board", "app"])
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
                let writing = labels.contains("Checklist"), drawing = labels.contains("Select")
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
        let d = UserDefaults.standard
        let kept = d.object(forKey: CanvasStyleSidebar.openKey)
        defer { if let kept { d.set(kept, forKey: CanvasStyleSidebar.openKey) } else { d.removeObject(forKey: CanvasStyleSidebar.openKey) } }
        for dark in [false, true] {
            let look = dark ? "dark" : "light"
            func save(_ name: String, _ w: NSWindow, _ web: WKWebView?) async throws {
                try await Self.picture(w, covering: web).write(to: dir.appending(path: "\(name)-\(look).png"))
            }
            // A board: its toolbar and location, the panel folded.
            d.set(false, forKey: CanvasStyleSidebar.openKey)
            let c = try CanvasNativeUITests.canvasLibrary()
            let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
            let board = try #require(notes.first { $0.title == "Publishing flow" })
            do {
                let (w, web, canvas) = try await AppSnapshotTests.withLastNote(c, board.title) { try await CanvasNativeUITests.boardWindow(c, board, dark: dark) }
                defer { w.close() }
                _ = try await CanvasNativeUITests.settledView(w, web)
                try await save("board", w, web)
                // The style panel open: for the next shape, then for a selection.
                d.set(true, forKey: CanvasStyleSidebar.openKey)
                await MacWindowChromeTests.settle(w, 5)
                try await save("style-panel-next-shape", w, web)
                _ = try await web.evaluateJavaScript("(() => { const api = amber._canvas.api, e = api.getSceneElements().find((x) => x.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [e.id]: true } } }); return 1; })()")
                for _ in 0..<40 where !canvas.state.hasSelection { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 5)
                try await save("style-panel-selection", w, web)
                // Nothing drawn in view: Back to content.
                d.set(false, forKey: CanvasStyleSidebar.openKey)
                canvas.run(.selectAll)
                _ = try await web.evaluateJavaScript("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
                canvas.send(.pan(dx: 20000, dy: 20000))
                for _ in 0..<40 where !canvas.state.lost { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 5)
                try await save("back-to-content", w, web)
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
    private static func picture(_ w: NSWindow, covering web: WKWebView?) async throws -> Data {
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
    private func frame(_ id: String, in w: NSWindow) async -> CGRect? {
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

    private func press(_ id: String, in w: NSWindow) throws {
        let enhanced = NSAccessibility.Attribute(rawValue: "AXEnhancedUserInterface")
        NSApp.accessibilitySetValue(true, forAttribute: enhanced)
        defer { NSApp.accessibilitySetValue(false, forAttribute: enhanced) }
        let e = try #require(MacEmptyDetailTests.element(id, in: w), "no \(id)")
        _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
    }
}
#endif
