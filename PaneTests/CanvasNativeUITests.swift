import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
#if os(macOS)
import AppKit
#else
import UIKit
#endif
@testable import Pane

/// A canvas's controls are the app's own (13 November 2026): the page and the app talk through
/// `amber._canvasCommand` and the `amberCanvas` message, none of the drawing engine's own UI shows,
/// right-drag pans on the Mac, a canvas folds the columns away, and the sidebar button steps
/// through three states.
@MainActor @Suite(.serialized) struct CanvasNativeUITests {
    /// The canvas page in an offscreen window, joined to a controller as the note pane joins it.
    @MainActor final class Joined {
        let rig: CanvasTests.Rig
        let canvas = CanvasController()
        var web: WKWebView { rig.sandbox.webView }

        init(scene: [String: Any] = CanvasNote.emptyScene(), size: CGSize = CGSize(width: 900, height: 600), dark: Bool = false) async throws {
            rig = try await CanvasTests.Rig(scene: scene, size: size, dark: dark)
            let s = rig.sandbox
            s.onCanvas = { [weak canvas] m in canvas?.receive(m) }
            canvas.deliver = { [weak s] c in s?.canvas(c) }
            #if os(macOS)
            (s.webView as? NotePageWebView)?.canvas = canvas
            #endif
        }

        func ready() async throws {
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvasCommand)")
            for _ in 0..<100 where !canvas.connected { try await Task.sleep(for: .milliseconds(30)) }
            #expect(canvas.connected, "the page reports its state")
        }

        func until(_ what: String, _ ok: () -> Bool) async {
            for _ in 0..<100 where !ok() { try? await Task.sleep(for: .milliseconds(30)) }
            #expect(ok(), "\(what)")
        }

        func js(_ s: String) async throws -> Any? { try await web.evaluateJavaScript(s) }

        func close() { rig.close() }
    }

    /// The design study's drawing ("Publishing flow"), for pictures.
    static let flowchart: [String: Any] = CanvasTests.scene([
        ["type": "ellipse", "id": "idea", "x": 0, "y": 20, "width": 170, "height": 90, "label": ["text": "Idea"], "backgroundColor": "#ffec99", "fillStyle": "solid"],
        ["type": "rectangle", "id": "draft", "x": 270, "y": 20, "width": 190, "height": 90, "label": ["text": "Draft"], "roundness": ["type": 3]],
        ["type": "diamond", "id": "ready", "x": 540, "y": 0, "width": 220, "height": 130, "label": ["text": "Ready?"]],
        ["type": "rectangle", "id": "publish", "x": 860, "y": 20, "width": 190, "height": 90, "label": ["text": "Publish"], "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "rectangle", "id": "fix", "x": 560, "y": 260, "width": 180, "height": 80, "label": ["text": "Fix it"], "backgroundColor": "#ffc9c9", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "arrow", "x": 172, "y": 65, "width": 96, "height": 0, "start": ["id": "idea"], "end": ["id": "draft"]],
        ["type": "arrow", "x": 462, "y": 65, "width": 76, "height": 0, "start": ["id": "draft"], "end": ["id": "ready"]],
        ["type": "arrow", "x": 762, "y": 65, "width": 96, "height": 0, "start": ["id": "ready"], "end": ["id": "publish"], "label": ["text": "yes"]],
        ["type": "arrow", "x": 650, "y": 132, "width": 0, "height": 126, "start": ["id": "ready"], "end": ["id": "fix"], "label": ["text": "no"]],
    ])

    static let box: [[String: Any]] = [
        ["type": "rectangle", "id": "box", "x": 100, "y": 120, "width": 200, "height": 100],
        ["type": "arrow", "id": "line", "x": 400, "y": 200, "width": 120, "height": 0],
    ]

    // MARK: The bridge

    @Test func aToolPickedInTheAppReachesThePageAndComesBack() async throws {
        let j = try await Joined()
        defer { j.close() }
        try await j.ready()
        #expect(j.canvas.state.tool == .selection)
        j.canvas.pick(.rectangle)
        await j.until("the page's tool is the rectangle") { j.canvas.state.tool == .rectangle }
        #expect(try await j.js("amber._canvas.api.getAppState().activeTool.type") as? String == "rectangle")
        #expect(j.canvas.state.stylable, "a drawing tool's style can be set before drawing")
        // A key on the canvas (the page's own shortcut) is reported back too.
        _ = try await j.js("amber._canvas.api.setActiveTool({ type: 'ellipse' }); 1")
        await j.until("the app sees the ellipse") { j.canvas.state.tool == .ellipse }
        // Anything else is refused.
        #expect(try await j.js("amber._canvasCommand({ op: 'tool', tool: 'embeddable' })") as? Bool == false)
        #expect(try await j.js("amber._canvasCommand({ op: 'nope' })") as? Bool == false)
    }

    @Test func aStyleSetInTheAppChangesTheSelectionAndUndoTakesItBack() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        #expect(!j.canvas.state.hasSelection && !j.canvas.state.showsSelectionBar)
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        await j.until("the selection is reported, with where it is") { j.canvas.state.selection == ["rectangle"] && j.canvas.state.bounds != nil }
        let bounds = try #require(j.canvas.state.bounds)
        #expect(bounds.width > 150 && bounds.height > 60, "the box's size on screen: \(bounds)")
        #expect(j.canvas.state.showsSelectionBar && j.canvas.state.showsFill && !j.canvas.state.showsArrowheads)

        // One at a time, as a person picks them.
        j.canvas.set(.strokeColor, .text("#e03131"))
        await j.until("the stroke colour") { j.canvas.state.strokeColor == "#e03131" }
        j.canvas.set(.backgroundColor, .text("#a5d8ff"))
        await j.until("the fill") { j.canvas.state.backgroundColor == "#a5d8ff" }
        j.canvas.set(.strokeWidth, .number(4))
        await j.until("the box shows the new style") { j.canvas.state.strokeWidth == 4 }
        let box = try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().find((e) => e.id === 'box'))") as? String ?? ""
        #expect(box.contains("\"strokeColor\":\"#e03131\"") && box.contains("\"strokeWidth\":4"))
        #expect(j.canvas.canUndo, "each change is a step in the drawing's history")

        j.canvas.run(.undo)
        await j.until("Undo takes back the last change") { j.canvas.state.strokeWidth == 2 }
        #expect(j.canvas.canRedo)
        j.canvas.run(.redo)
        await j.until("and Redo puts it back") { j.canvas.state.strokeWidth == 4 }

        // Layer order and Duplicate run through the engine's own actions.
        j.canvas.run(.sendToBack)
        await j.until("sent to the back") { true }
        let first = try await j.js("amber._canvas.api.getSceneElements()[0].id") as? String
        #expect(first == "box")
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        await j.until("the box selected again") { j.canvas.state.selection == ["rectangle"] }
        j.canvas.run(.duplicate)
        try await Task.sleep(for: .milliseconds(200))
        let rectangles = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'rectangle').length") as? Int
        #expect(rectangles == 2, "duplicated: \(String(describing: rectangles))")
    }

    @Test func zoomAndTheBackgroundFromTheMenus() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let before = j.canvas.state.zoom
        j.canvas.run(.zoomIn)
        await j.until("View › Zoom In zooms the drawing") { j.canvas.state.zoom > before }
        j.canvas.run(.resetZoom)
        await j.until("Actual Size") { abs(j.canvas.state.zoom - 1) < 0.001 }
        j.canvas.send(.background("#fffce8"))
        await j.until("the background from the ••• menu") { j.canvas.state.background == "#fffce8" }
        // Saved with the drawing.
        for _ in 0..<60 where (j.rig.scene?["appState"] as? [String: Any])?["viewBackgroundColor"] as? String != "#fffce8" { try await Task.sleep(for: .milliseconds(50)) }
        #expect((j.rig.scene?["appState"] as? [String: Any])?["viewBackgroundColor"] as? String == "#fffce8")
        // The ••• menu has the canvas's items, first.
        let groups = NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: true, appsEnabled: true, phone: false, dev: false, canvas: true)
        #expect(groups.first(where: { $0.contains(.canvasClear) }) == [.canvasZoomToFit, .canvasBackground, .canvasClear])
        #expect(!NoteMoreMenu.groups(locked: false, vaultOpen: false, trashed: false, hasApp: true, appsEnabled: true).joined().contains(.canvasClear))
    }

    // MARK: None of the engine's UI

    /// What of the engine's own UI can be seen: its buttons, panels, inputs and hint lines.
    static let visibleEngineUI = """
    (() => {
      const seen = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && el.offsetParent !== null; };
      const all = [...document.querySelectorAll('.excalidraw button, .excalidraw [role=button], .excalidraw .Island, .excalidraw input, .excalidraw label, .excalidraw .HintViewer, .excalidraw .welcome-screen-center, .excalidraw [class*=toolbar], .excalidraw [class*=menu]')];
      return all.filter(seen).map((e) => (e.className && e.className.baseVal === undefined ? e.className : e.tagName) + '').slice(0, 12);
    })()
    """

    @Test(arguments: [false, true]) func noneOfTheEnginesOwnUIShows(dark: Bool) async throws {
        #if os(macOS)
        let size = CGSize(width: 1100, height: 700)
        #else
        let size = CGSize(width: 393, height: 760)
        #endif
        let j = try await Joined(scene: CanvasTests.scene(Self.box), size: size, dark: dark)
        defer { j.close() }
        try await j.ready()
        // With a tool picked and a shape selected: the moments its panels used to open.
        j.canvas.pick(.freedraw)
        try await Task.sleep(for: .milliseconds(300))
        var seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing of the engine's UI with the pencil: \(seen ?? [])")
        _ = try await j.js("amber._canvas.api.setActiveTool({ type: 'selection' }); amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); 1")
        try await Task.sleep(for: .milliseconds(300))
        seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing with a shape selected: \(seen ?? [])")
        // Its dialogs' keys open nothing (help, the command palette, search).
        _ = try await j.js("""
        for (const k of [{ key: '?' }, { key: '/', metaKey: true }, { key: 'f', metaKey: true }, { key: 'p', metaKey: true, shiftKey: true }])
          document.dispatchEvent(new KeyboardEvent('keydown', { ...k, bubbles: true })); 1
        """)
        try await Task.sleep(for: .milliseconds(200))
        let dialog = try await j.js("amber._canvas.api.getAppState().openDialog")
        #expect(dialog is NSNull, "no dialog opened: \(String(describing: dialog))")
        seen = try await j.js(Self.visibleEngineUI) as? [String]
        #expect(seen == [], "nothing after its keys: \(seen ?? [])")
        // The single-key tools still work: they're the page's own.
        _ = try await j.js("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true })); 1")
        await j.until("R picks the rectangle") { j.canvas.state.tool == .rectangle }
        // A right click on the page never reaches the engine's menu or the web view's.
        let refused = try await j.js("""
        (() => { const c = document.querySelector('.excalidraw canvas.interactive') || document.querySelector('.excalidraw canvas');
          const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 200, clientY: 200 });
          return !c.dispatchEvent(e); })()
        """) as? Bool
        #expect(refused == true, "the page stops the context menu")
        #expect(try await j.js("document.querySelectorAll('.excalidraw .context-menu').length") as? Int == 0)
    }

    // MARK: Mac: right-drag, Undo, the menu

    #if os(macOS)
    static func event(_ type: NSEvent.EventType, at p: CGPoint, in w: NSWindow) -> NSEvent {
        NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                           windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: 1)!
    }

    /// Delivered to the web view itself, in this process: nothing is posted to the system.
    @Test func rightDragPansTheDrawingAndARightClickOpensTheAppsMenu() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let web = try #require(j.web as? NotePageWebView)
        let w = j.rig.window
        var shown: [NSMenu] = []
        web.presentMenu = { menu, _, _ in shown.append(menu) }
        let x0 = try #require(try await j.js("amber._canvas.api.getAppState().scrollX") as? Double)
        let y0 = try #require(try await j.js("amber._canvas.api.getAppState().scrollY") as? Double)
        // Down, then right 80 and up 30 in the window (y runs up), then let go.
        web.rightMouseDown(with: Self.event(.rightMouseDown, at: CGPoint(x: 300, y: 300), in: w))
        for step in 1...4 {
            let d = CGFloat(step)
            web.rightMouseDragged(with: Self.event(.rightMouseDragged, at: CGPoint(x: 300 + 20 * d, y: 300 + 7.5 * d), in: w))
        }
        #expect(web.panning)
        web.rightMouseUp(with: Self.event(.rightMouseUp, at: CGPoint(x: 380, y: 330), in: w))
        try await Task.sleep(for: .milliseconds(200))
        let x1 = try #require(try await j.js("amber._canvas.api.getAppState().scrollX") as? Double)
        let y1 = try #require(try await j.js("amber._canvas.api.getAppState().scrollY") as? Double)
        #expect(abs((x1 - x0) - 80) < 0.5, "the drawing follows the pointer right: \(x1 - x0)")
        #expect(abs((y1 - y0) - (-30)) < 0.5, "and up: \(y1 - y0)")
        #expect(shown.isEmpty, "a drag opens no menu")
        #expect(j.canvas.sent.allSatisfy { if case .pan = $0 { true } else { false } })

        // A right click that doesn't move: the app's menu, never the web view's.
        web.rightMouseDown(with: Self.event(.rightMouseDown, at: CGPoint(x: 300, y: 300), in: w))
        web.rightMouseDragged(with: Self.event(.rightMouseDragged, at: CGPoint(x: 301, y: 301), in: w))
        web.rightMouseUp(with: Self.event(.rightMouseUp, at: CGPoint(x: 301, y: 301), in: w))
        let menu = try #require(shown.first)
        let titles: [String] = menu.items.map(\.title).filter { !$0.isEmpty }
        let expected: [String] = ["Duplicate", "Delete", "Bring to Front", "Bring Forward", "Send Backward", "Send to Back", "Select All", "Zoom to Fit"]
        #expect(titles == expected)
        #expect(menu.items.first { $0.title == "Delete" }?.isEnabled == false, "nothing selected: nothing to delete")
        // Select All from it reaches the page.
        let all = try #require(menu.items.first { $0.title == "Select All" })
        _ = all.target?.perform(all.action, with: all)
        await j.until("everything is selected") { j.canvas.state.selection.count == 2 }
        // The web view's own menu, should one start (Control-click): emptied.
        let webMenu = NSMenu()
        webMenu.addItem(withTitle: "Reload", action: nil, keyEquivalent: "")
        web.willOpenMenu(webMenu, with: Self.event(.rightMouseDown, at: .zero, in: w))
        #expect(webMenu.items.isEmpty)
    }

    @Test func editUndoAndRedoReachTheDrawingsHistory() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let web = try #require(j.web as? NotePageWebView)
        let undo = NSMenuItem(title: "Undo", action: #selector(NotePageWebView.undo(_:)), keyEquivalent: "z")
        #expect(web.responds(to: #selector(NotePageWebView.undo(_:))))
        #expect(!web.validateUserInterfaceItem(undo), "nothing to undo yet")
        // Selected as a step of its own, as a click selects.
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } }, captureUpdate: 'IMMEDIATELY' }); 1")
        await j.until("selected") { j.canvas.state.hasSelection }
        j.canvas.set(.strokeColor, .text("#2f9e44"))
        await j.until("there's something to undo") { j.canvas.canUndo && j.canvas.state.strokeColor == "#2f9e44" }
        #expect(web.validateUserInterfaceItem(undo))
        NSApp.sendAction(#selector(NotePageWebView.undo(_:)), to: web, from: undo)
        try await Task.sleep(for: .milliseconds(300))
        let color = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.id === 'box').strokeColor") as? String
        #expect(color != "#2f9e44", "Edit › Undo took the colour back: \(color ?? "")")
        // Not a canvas: the web view leaves Undo to the window.
        web.canvas = nil
        #expect(!web.responds(to: #selector(NotePageWebView.undo(_:))))
    }

    // MARK: Focus and the sidebar steps

    /// Full Screen is yours to enter: it folds the columns and puts them back as they were.
    @Test func fullScreenPutsTheColumnsBackAsTheyWere() {
        var f = FullScreen()
        #expect(f.leave() == nil, "not on: nothing to put back")
        #expect(f.enter(from: .all) == .detailOnly)
        #expect(f.isOn)
        #expect(f.enter(from: .detailOnly) == nil, "on already")
        #expect(f.leave() == .all)
        #expect(!f.isOn)
        #expect(f.enter(from: .doubleColumn) == .detailOnly)
        #expect(f.leave() == .doubleColumn, "list and note, as they were")
        _ = f.enter(from: .all)
        f.userChanged()
        #expect(!f.isOn && f.leave() == nil, "the sidebar button takes over")
    }

    /// Naming a canvas: one line, trimmed; empty or unchanged leaves it (13 November 2026).
    @Test func aCanvasIsRenamedFromItsTitleField() throws {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        #expect(note.title == CanvasNote.title)
        #expect(CanvasTitleField.renamed(note, to: "  Launch plan\nv2 ") == "Launch plan v2")
        #expect(note.body == "Launch plan v2" && note.dirty)
        #expect(CanvasTitleField.renamed(note, to: "   ") == nil, "empty keeps the name")
        #expect(CanvasTitleField.renamed(note, to: "Launch plan v2") == nil, "unchanged: nothing to save")
        #expect(note.title == "Launch plan v2")
    }

    static func canvasLibrary() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Publishing flow"
        note.updatedAt = .now.addingTimeInterval(-30)
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene(Self.box)], "collections": [String: Any]()])
        try c.mainContext.save()
        return c
    }

    static func collapsed(_ w: NSWindow) throws -> [Bool] {
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let controller = try #require(split.delegate as? NSSplitViewController)
        return controller.splitViewItems.prefix(2).map(\.isCollapsed)
    }

    /// A canvas opens with the columns as they are (Emil, 13 November 2026: it went full screen
    /// by itself). The sidebar button hides the folders in one click, as in Notes; Full Screen
    /// folds both and puts them back.
    @Test func aCanvasKeepsTheColumnsUntilYouGoFullScreen() async throws {
        let c = try Self.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            #expect(try Self.collapsed(w) == [false, false], "the canvas leaves the columns open")
            // The tools are in the window's toolbar, where a note's are, then Full Screen, Share and More.
            let labels = try MacWindowChromeTests.items(w).map(\.label)
            for l in ["Select", "Hand", "Pencil", "Shapes", "Arrow", "Text", "Eraser", "Full Screen", "Share"] {
                #expect(labels.contains(l), "\(l) in the toolbar: \(labels)")
            }
            // Its name, as a field you can type in, beside where it is.
            @MainActor func fields(_ v: NSView) -> [NSTextField] { (v as? NSTextField).map { [$0] } ?? [] + v.subviews.flatMap(fields) }
            let all = [w.contentView?.superview].compactMap { $0 }.flatMap(fields)
            #expect(all.contains { $0.isEditable && $0.stringValue == "Publishing flow" }, "the name field: \(all.map(\.stringValue))")
            @MainActor func press(_ id: String) async throws {
                let found = await MacEmptyDetailTests.waitForElement(id, in: w)
                let direct = MacEmptyDetailTests.element(id, in: w)
                let e = try #require(found ?? direct, "no \(id)")
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 12)
            }
            try await press("sidebar.toggle")
            #expect(try Self.collapsed(w) == [true, false], "one click: the folders")
            try await press("note.fullScreen")
            #expect(try Self.collapsed(w) == [true, true], "Full Screen: the canvas alone")
            try await press("note.fullScreen")
            #expect(try Self.collapsed(w) == [true, false], "and back as they were")
        }
    }
    #endif

    #if os(iOS)
    /// The canvas on iPhone, edge to edge, its dock at the foot, light and dark, with a shape
    /// selected and the bar above it. Drawn only when CANVAS_SHOTS is set (TEST_RUNNER_CANVAS_SHOTS=dir).
    nonisolated(unsafe) static var keptStores: [ModelContainer] = []

    @Test func iPhonePictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["CANVAS_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Publishing flow"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": Self.flowchart], "collections": [String: Any]()])
        try c.mainContext.save()
        // One window and one store for both: a second store's note crashed SwiftData ("destroyed by
        // calling ModelContext.reset") while something still held the first one's.
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = UIHostingController(rootView: NavigationStack {
            NoteDetailView(note: note, controller: EditorController(), onNewNote: {})
        }.modelContainer(c).tint(Color(PColor.paneAccent)))
        window.isHidden = false
        // The store outlives the test: the hidden window still drew its note after a store that
        // had gone, and SwiftData stopped the run.
        Self.keptStores.append(c)
        defer { window.isHidden = true; window.rootViewController = nil }
        try await Task.sleep(for: .seconds(3))
        func find(_ v: UIView) -> WKWebView? { (v as? WKWebView) ?? v.subviews.lazy.compactMap(find).first }
        let web = try #require(find(window))
        _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85 }); 1")
        try await Task.sleep(for: .seconds(0.5))
        _ = try await web.evaluateJavaScript("amber._canvas.api.updateScene({ appState: { selectedElementIds: { draft: true } } }); 1")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            try await Task.sleep(for: .seconds(1.5))
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            let url = dir.appending(path: "canvas-iphone-\(dark ? "dark" : "light").png")
            try #require(image.pngData()).write(to: url)
            print("CANVAS_SHOT \(url.path)")
        }
    }
    #endif

    // MARK: The bar over the selection

    @Test func theSelectionBarFloatsJustAboveTheSelectionAndStaysInside() {
        let bar = CGSize(width: 200, height: 40), area = CGSize(width: 800, height: 600)
        let above = CanvasSelectionBar.position(bounds: CGRect(x: 300, y: 300, width: 100, height: 50), bar: bar, area: area)
        let gap = CanvasSelectionBar.gap
        #expect(abs(above.x - 350) < 0.01 && abs(above.y - (300 - gap - 20)) < 0.01, "just above, centred")
        let below = CanvasSelectionBar.position(bounds: CGRect(x: 300, y: 10, width: 100, height: 50), bar: bar, area: area)
        #expect(abs(below.y - (60 + gap + 20)) < 0.01, "no room above: below it (\(below.y))")
        let edge = CanvasSelectionBar.position(bounds: CGRect(x: -50, y: 300, width: 60, height: 50), bar: bar, area: area)
        #expect(abs(edge.x - 108) < 0.01, "kept inside the canvas (\(edge.x))")
        var state = CanvasState()
        state.selection = ["rectangle"]
        state.bounds = CGRect(x: 0, y: 0, width: 10, height: 10)
        #expect(state.showsSelectionBar)
        state.busy = true
        #expect(!state.showsSelectionBar, "hidden while a handle is dragged")
    }

    @Test func swatchesShowAsTheCanvasDrawsThemInTheDark() {
        // Ink turns to a light cream, white to black, and a picked colour round-trips.
        let ink = CanvasStyle.rgb("#2a1d10")!
        #expect(ink.0 < 0.2)
        #expect(CanvasStyle.hex(CanvasStyle.shown("#ffffff", dark: false)!, dark: false) == "#ffffff")
        #expect(CanvasStyle.hex(CanvasStyle.shown("#ffffff", dark: true)!, dark: false) == "#000000")
        let blue = CanvasStyle.hex(CanvasStyle.shown("#1971c2", dark: true)!, dark: true)
        let (r, g, b) = CanvasStyle.rgb(blue)!
        let (r0, g0, b0) = CanvasStyle.rgb("#1971c2")!
        #expect(abs(r - r0) + abs(g - g0) + abs(b - b0) < 0.06, "\(blue)")
    }
}
