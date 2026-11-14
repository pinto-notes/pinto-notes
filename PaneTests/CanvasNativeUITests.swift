import Foundation
import SwiftData
import SwiftUI
import Testing
import UniformTypeIdentifiers
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
            canvas.exporter = { [weak s] f, selected, light, page in await s?.canvasExport(f, selected: selected, light: light, page: page) }
            canvas.call = { [weak s] name, args in await s?.canvasCall(name, args) }
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
        #expect(groups.first(where: { $0.contains(.canvasClear) }) == [.canvasZoomToFit, .canvasBackground, .canvasExport, .canvasClear])
        let present = groups.firstIndex(of: [.canvasPresent, .canvasLaser]), drawing = groups.firstIndex { $0.contains(.canvasClear) }
        #expect(present != nil && drawing != nil && present! + 1 == drawing!, "Present and the laser pointer, then the drawing's items: \(groups)")
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
        let expected: [String] = ["Duplicate", "Delete", "Save to Library", "Bring to Front", "Bring Forward", "Send Backward", "Send to Back", "Select All", "Zoom to Fit"]
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

    /// An empty whiteboard offers its templates; one comes in whole, joined up, as one step Undo
    /// takes back (Emil, 13 November 2026: "a quick option to create a blank whiteboard or use
    /// some templates").
    @Test func anEmptyWhiteboardOffersTemplatesThatComeInAsOneUndoStep() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        await j.until("the page says it's empty") { j.canvas.state.empty }
        #expect(CanvasStart.shows(j.canvas.state))
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        #expect(!CanvasStart.shows(j.canvas.state), "the templates step away")
        let n = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type !== 'text').length") as? Int
        #expect(n == 10, "five shapes and five arrows: \(n ?? -1)")
        let joined = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'arrow' && e.startBinding && e.endBinding).length") as? Int
        #expect(joined == 5, "every arrow joins two shapes: \(joined ?? -1)")
        let labels = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'text').map((e) => e.originalText).sort().join('|')") as? String
        #expect(labels?.hasPrefix("Did it work?|Do the thing|Done|Double-click a shape") == true && labels?.contains("|No|") == true && labels?.contains("|Yes") == true, "\(labels ?? "")")
        let hint = try await j.js("amber._canvas.scene().elements.filter((e) => e.customData && e.customData.pintoHint).length") as? Int
        #expect(hint == 1, "the how-to line keeps its mark once saved, for the list's preview")
        let web = try #require(j.web as? NotePageWebView)
        NSApp.sendAction(#selector(NotePageWebView.undo(_:)), to: web, from: NSMenuItem(title: "Undo", action: #selector(NotePageWebView.undo(_:)), keyEquivalent: "z"))
        await j.until("one Undo takes it back") { j.canvas.state.empty }
    }

    /// A board exports as a PNG, an SVG that carries its scene, and an .excalidraw file, the
    /// whole board or only what's selected (14 November 2026: Excalidraw's Export image and Copy
    /// as PNG; nothing could leave a whiteboard before).
    @Test func aBoardExportsAsPNGSVGAndExcalidraw() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        #expect(await j.canvas.export(.png) == nil, "an empty board has nothing to export")
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        let png = try #require(await j.canvas.export(.png))
        #expect(png.prefix(4) == Data([0x89, 0x50, 0x4E, 0x47]), "a PNG")
        #if os(macOS)
        let whole = try #require(NSBitmapImageRep(data: png))
        #expect(whole.pixelsWide > 800, "at 2x: \(whole.pixelsWide)")
        #endif
        let svgFile = try #require(await j.canvas.export(.svg))
        let svg = String(decoding: svgFile, as: UTF8.self)
        #expect(svg.hasPrefix("<svg") && svg.contains("payload-type:application/vnd.excalidraw+json"), "an SVG that carries its scene")
        #expect(!svg.contains("Double-click a shape"), "the template's how-to line isn't in the picture")
        let file = try #require(await j.canvas.export(.excalidraw))
        let json = try #require(try JSONSerialization.jsonObject(with: file) as? [String: Any])
        #expect(json["type"] as? String == "excalidraw")
        let all = (json["elements"] as? [[String: Any]])?.count ?? 0
        #expect(all >= 15, "every shape, arrow and label: \(all)")
        // Only the selection, when asked and something is selected.
        _ = try await j.js("(() => { const api = amber._canvas.api; const box = api.getSceneElements().find((e) => e.type === 'rectangle'); api.updateScene({ appState: { selectedElementIds: { [box.id]: true } } }); return 1; })()")
        await j.until("the box is selected") { j.canvas.state.selection == ["rectangle"] }
        let oneFile = try #require(await j.canvas.export(.excalidraw, selected: true))
        let one = try #require(try JSONSerialization.jsonObject(with: oneFile) as? [String: Any])
        #expect((one["elements"] as? [[String: Any]])?.count == 1, "only the selected box")
        #if os(macOS)
        let partFile = try #require(await j.canvas.export(.png, selected: true))
        let part = try #require(NSBitmapImageRep(data: partFile))
        #expect(part.pixelsWide < whole.pixelsWide, "the selection's picture is smaller than the board's")
        #endif
        #expect(CanvasExport.filename("Q3: plan/roadmap", .png) == "Q3 planroadmap.png")
        #expect(CanvasExport.filename("  ", .svg) == "Whiteboard.svg")
    }

    /// A shared board's web page shows a picture of it (BoardPicture, 14 November 2026): the
    /// whole board at 2x, on its own light background even while the app is dark, as the page
    /// shows it on a light card.
    @Test func aSharedBoardsPictureIsTheWholeBoardLightAt2x() async throws {
        let j = try await Joined(scene: Self.flowchart, dark: true)
        defer { j.close() }
        try await j.ready()
        let note = UUID()
        BoardPicture.opened(j.canvas, note: note)
        defer { BoardPicture.closed(j.canvas, note: note) }
        #expect(BoardPicture.board(note) === j.canvas, "the open board is found by its note")
        #if os(macOS)
        func corner(_ png: Data) throws -> CGFloat {
            let rep = try #require(NSBitmapImageRep(data: png))
            return try #require(rep.colorAt(x: 4, y: 4)?.usingColorSpace(.deviceRGB)).brightnessComponent
        }
        #expect(try await j.js("amber._canvas.api.getAppState().theme") as? String == "dark", "the board shows dark")
        // Export and the page's picture are both the board as drawn, light (a dark picture pasted
        // as a black block; whiteboard council, round 2).
        let root = { (svg: Data) in String(String(decoding: svg, as: UTF8.self).prefix { $0 != ">" }) }
        #expect(!root(try #require(await j.canvas.export(.svg))).contains("filter="), "Export from dark mode is light")
        #expect(!root(try #require(await j.canvas.export(.svg, light: true))).contains("filter="), "light: as drawn")
        let picture = try #require(await j.canvas.export(.png, light: true))
        #expect(try corner(picture) > 0.95, "the page's picture is the board's white")
        let rep = try #require(NSBitmapImageRep(data: picture))
        #expect(rep.pixelsWide > 2000 && rep.pixelsHigh > 600, "the whole flowchart at 2x: \(rep.pixelsWide)×\(rep.pixelsHigh)")
        #expect(BoardPicture.fitted(picture) == picture && picture.count < BoardPicture.maxBytes, "well under the limit: \(picture.count) bytes")
        #endif
        // Its words are the page's text.
        let words = CanvasSketch(elements: Self.flowchart["elements"] as? [[String: Any]] ?? []).texts
        #expect(BoardPicture.body(title: "Publishing flow", words: words) == "Publishing flow\n\nIdea\n\nDraft\n\nReady?\n\nPublish\n\nFix it\n\nyes\n\nno")
    }

    /// A picture of a board leaves out a template's how-to line and the band it stood in
    /// (whiteboard council, round 3: about 75 pt of blank paper between the title and the drawing
    /// in 14, 18, 19 and 20). The shared page's picture also leaves out the board's title when the
    /// page's heading says it (20, 21: the title twice), and the page's scene leaves out the
    /// how-to line. Export's .excalidraw file keeps everything where it was.
    @Test func picturesCloseTheHowToBandAndThePagesPictureLeavesOutItsTitle() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        let name = "Sprint 14 retro"
        j.canvas.send(.insert(.retro, title: name))
        await j.until("the retro is in") { !j.canvas.state.empty }
        func elements(_ file: Data?) throws -> [[String: Any]] {
            let data = try #require(file)
            let json = try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
            return json["elements"] as? [[String: Any]] ?? []
        }
        func marked(_ e: [String: Any], _ k: String) -> Bool { (e["customData"] as? [String: Any])?[k] as? Bool == true }
        func num(_ e: [String: Any], _ k: String) -> Double { (e[k] as? Double) ?? (e[k] as? Int).map(Double.init) ?? 0 }
        // A lane: the retro's tall boxes.
        func lane(_ all: [[String: Any]]) -> [String: Any]? { all.filter { $0["type"] as? String == "rectangle" && num($0, "height") > 300 }.min { num($0, "x") < num($1, "x") } }

        // Export's file keeps the how-to line where it is.
        let full = try elements(await j.canvas.export(.excalidraw))
        let title = try #require(full.first { marked($0, "pintoTitle") }), hint = try #require(full.first { marked($0, "pintoHint") })
        #expect(title["text"] as? String == name)
        let fullLane = try #require(lane(full))
        // The band: the line's height and the gap above it.
        let band = num(hint, "y") + num(hint, "height") - (num(title, "y") + num(title, "height"))
        #expect(band > 15 && band < 40, "\(band)")

        // The page's scene: no how-to line, what was under it moved up by the band, the title kept.
        let page = try elements(await j.canvas.export(.excalidraw, page: name))
        #expect(!page.contains { marked($0, "pintoHint") } && page.count == full.count - 1)
        let pageTitle = try #require(page.first { marked($0, "pintoTitle") })
        #expect(num(pageTitle, "y") == num(title, "y"), "what's above the line stays")
        let pageLane = try #require(lane(page))
        #expect(abs(num(pageLane, "y") - (num(fullLane, "y") - band)) < 0.5, "the lanes moved up by the band: \(num(fullLane, "y")) to \(num(pageLane, "y"))")
        #expect(abs((num(pageLane, "y") - num(title, "y") - num(title, "height")) - (num(fullLane, "y") - num(hint, "y") - num(hint, "height"))) < 0.5,
                "the gap under the title is the one that was under the line")

        // The page's SVG has no title; one made for another name, or Export's, has it.
        let svg = { (d: Data?) in String(decoding: d ?? Data(), as: UTF8.self) }
        #expect(!svg(await j.canvas.export(.svg, light: true, page: name)).contains(">\(name)<"))
        #expect(svg(await j.canvas.export(.svg)).contains(">\(name)<"))
        #expect(svg(await j.canvas.export(.svg, light: true, page: "Another board")).contains(">\(name)<"))
        #expect(!svg(await j.canvas.export(.svg)).contains("Double-click a card"), "no how-to line in any picture")

        #if os(macOS)
        func height(_ png: Data?) throws -> Int {
            let data = try #require(png)
            return try #require(NSBitmapImageRep(data: data)).pixelsHigh
        }
        let picture = try height(await j.canvas.export(.png))
        // The page's picture starts at the lanes: the title and the gap under it are gone (at 2x).
        let pagePicture = try height(await j.canvas.export(.png, light: true, page: name))
        let cut = 2 * (num(pageLane, "y") - num(title, "y"))
        #expect(abs(Double(picture - pagePicture) - cut) < 8, "\(picture) to \(pagePicture), \(cut) less")
        #expect(try height(await j.canvas.export(.png, light: true, page: "Another board")) == picture, "a title that isn't the page's name stays")
        // The how-to line rubbed out by hand leaves nothing to close: its band shows, and the
        // picture is that much taller than the one that closed it.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().map((e) => e.customData && e.customData.pintoHint ? { ...e, isDeleted: true } : e) }); return 1; })()")
        let banded = try height(await j.canvas.export(.png))
        #expect(abs(Double(banded - picture) - 2 * band) < 4, "\(banded) with the band, \(picture) without; \(2 * band) expected")
        #endif
    }

    #if os(macOS)
    static func png(width: Int, height: Int, clear: Bool) -> Data {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                   isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        (clear ? NSColor.clear : NSColor.systemTeal).setFill()
        NSRect(x: 0, y: 0, width: width, height: height).fill(using: .copy)
        NSColor.systemOrange.setFill()
        NSRect(x: width / 4, y: height / 4, width: width / 2, height: height / 2).fill()
        NSGraphicsContext.restoreGraphicsState()
        return rep.representation(using: .png, properties: [:])!
    }

    /// Like a photo: smooth colour that changes everywhere, with grain.
    static func photo(width: Int, height: Int) -> Data {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false,
                                   isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        let p = rep.bitmapData!, row = rep.bytesPerRow
        var seed: UInt32 = 7
        for y in 0..<height {
            for x in 0..<width {
                seed = seed &* 1_664_525 &+ 1_013_904_223
                let grain = Int(seed >> 28)
                let i = y * row + x * 3
                p[i] = UInt8(clamping: 128 + Int(100 * sin(Double(x) / 90)) + grain)
                p[i + 1] = UInt8(clamping: 128 + Int(100 * cos(Double(y) / 70)) + grain)
                p[i + 2] = UInt8(clamping: (x + y) / 20 % 256 + grain)
            }
        }
        return rep.representation(using: .png, properties: [:])!
    }

    /// Pictures go on a board: pasted, dropped or picked, each made at most 2560 pixels across, a
    /// PNG for a screenshot and a JPEG for a photo, placed in the view, selected, and saved with the
    /// board (whiteboard council, round 1: "images on the board" was missing).
    @Test func aPictureGoesOnTheBoardSmallEnoughToKeep() async throws {
        // A screenshot (flat colours): sharp, as a PNG, at most 2560 across.
        let big = try #require(CanvasImage(data: Self.png(width: 3200, height: 2000, clear: false)))
        #expect(big.mimeType == "image/png" && big.dataURL.hasPrefix("data:image/png;base64,"))
        #expect(big.width == 2560 && big.height == 1600, "\(big.width)x\(big.height)")
        #expect(big.dataURL.utf8.count < 400_000, "small enough to keep: \(big.dataURL.utf8.count) bytes")
        // A photo (every pixel different): a JPEG, at most 1920 across, still small enough to keep.
        let photo = try #require(CanvasImage(data: Self.photo(width: 3000, height: 2000)))
        #expect(photo.mimeType == "image/jpeg" && photo.width == 1920, "\(photo.mimeType) \(photo.width)")
        #expect(photo.dataURL.utf8.count < 1_200_000, "\(photo.dataURL.utf8.count) bytes")
        let cut = try #require(CanvasImage(data: Self.png(width: 400, height: 300, clear: true)))
        #expect(cut.mimeType == "image/png", "see-through parts stay see-through")
        #expect(CanvasImage(data: Data("not a picture".utf8)) == nil)

        // The clipboard: a picture, or picture files; never the board's own copied shapes (text).
        let pb = NSPasteboard(name: .init("pinto.test.\(UUID().uuidString)"))
        defer { pb.releaseGlobally() }
        pb.clearContents(); pb.setData(Self.png(width: 20, height: 20, clear: false), forType: .png)
        #expect(NotePageWebView.pictures(on: pb).count == 1)
        pb.clearContents(); pb.setString("{\"type\":\"excalidraw/clipboard\"}", forType: .string)
        #expect(NotePageWebView.pictures(on: pb).isEmpty, "the board's own shapes paste as they did")

        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.image(big, at: nil))
        await j.until("the picture is selected") { j.canvas.state.selection == ["image"] }
        let kept = try await j.js("(() => { const s = amber._canvas.scene(); const i = s.elements.find((e) => e.type === 'image'); return [!!i, !!(i && s.files[i.fileId]), i ? Math.round(i.width) : 0].join(','); })()") as? String
        #expect(kept?.hasPrefix("true,true,") == true, "an image element with its file, saved in the scene: \(kept ?? "")")
        // Pasted over the drawing, it goes beside it, in view (whiteboard council, round 2, 11).
        let left = try await j.js("Math.round(amber._canvas.api.getSceneElements().find((e) => e.type === 'image').x)") as? Int
        #expect((left ?? 0) >= 520, "right of the box and arrow: \(left ?? -1)")
        let b = try #require(j.canvas.state.bounds)
        #expect(b.minX >= 0 && b.maxX <= 900 && b.minY >= 0 && b.maxY <= 600, "in view: \(b)")
        // Crop (round 6: "pasted screenshots almost always need trimming"): the handles, then Done keeps it.
        j.canvas.run(.crop)
        await j.until("cropping") { j.canvas.state.cropping }
        #expect(try await j.js("(() => { const s = amber._canvas.api.getAppState(), i = amber._canvas.api.getSceneElements().find((e) => e.type === 'image'); return s.croppingElementId === i.id; })()") as? Bool == true)
        _ = try await j.js("(() => { const api = amber._canvas.api, i = api.getSceneElements().find((e) => e.type === 'image'); api.updateScene({ elements: api.getSceneElements().map((e) => e.id === i.id ? { ...e, width: e.width / 2, crop: { x: 0, y: 0, width: 1600, height: 2000, naturalWidth: 3200, naturalHeight: 2000 }, version: e.version + 1 } : e) }); return 0; })()")
        j.canvas.send(.cropDone)
        await j.until("done cropping") { !j.canvas.state.cropping }
        #expect(j.canvas.state.selection == ["image"], "the picture stays selected")
        #expect(try await j.js("!!amber._canvas.scene().elements.find((e) => e.type === 'image').crop") as? Bool == true, "the crop is saved")
        // A save the store refuses is said, not lost quietly.
        j.canvas.receive(["error": "Not saved: too big"])
        #expect(j.canvas.notice == "Not saved: too big")
    }

    /// When an AI draws on the open board, what it drew is outlined with its name, and the receipt
    /// says it drew (whiteboard council, round 1: "show what the AI did").
    @Test func whatAnAIDrewIsOutlinedWithItsName() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        // As an AI writes it over MCP: the short form, far to the right of what's there.
        elements.append(["type": "rectangle", "id": "ai-box", "x": 2400, "y": 200, "width": 220, "height": 90, "label": ["text": "Launch"]])
        j.canvas.arrived(by: "Claude")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        #expect(h.by == "Claude" && h.count >= 1)
        // Off to the side, so it was brought into view: only as far as needed, by the right edge,
        // so the rest stays as close as it can (round 2, 16).
        #expect(h.rect.minX >= -1 && h.rect.maxX <= 901, "in view: \(h.rect)")
        #expect(h.rect.maxX > 820 && h.rect.maxX < 880, "moved just far enough: \(h.rect)")
        #expect(h.rect.width > 100)
        let r = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: "", lines: 0, kind: .dataEdit, board: true)
        #expect(r.summary == "Claude drew on this whiteboard" && r.shortSummary == "Claude drew on it")
    }

    /// Only what the AI drew is outlined, not the arrows already on the board that the merge
    /// re-laid (whiteboard council, round 2, 12-ai-drew: the outline took in half the flowchart).
    @Test func theOutlineTakesInOnlyWhatTheAIDrew() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.insert(.flowchart))
        await j.until("the flowchart is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(1500))
        _ = try await j.js("amber._flush(); 0")
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        let right = try #require(try await j.js("Math.round(Math.max(...amber._canvas.api.getSceneElements().map((e) => e.x + e.width)))") as? Int)
        elements.append(["type": "rectangle", "id": "ai-box", "x": right + 80, "y": 0, "width": 180, "height": 70, "label": ["text": "Request"]])
        CanvasController.highlightTime = 60
        j.canvas.arrived(by: "ChatGPT")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        let h = try #require(j.canvas.highlight)
        #expect(h.count == 2, "the box and its words: \(h.count)")
        #expect(h.rect.width < 260 && h.rect.height < 120, "only the new box: \(h.rect)")
        // The window gets wider, the view stays centred, and the outline moves with the drawing,
        // however long after it arrived.
        defer { CanvasController.highlightTime = 4 }
        try await Task.sleep(for: .seconds(9))
        j.rig.window.setContentSize(CGSize(width: 1300, height: 600))
        j.web.frame = CGRect(x: 0, y: 0, width: 1300, height: 600)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1300 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        await j.until("the outline followed") { (j.canvas.highlight?.rect.minX ?? h.rect.minX) - h.rect.minX > 150 }
        #expect(abs((j.canvas.highlight?.rect.minX ?? 0) - (h.rect.minX + 200)) < 4, "moved by half the new width: \(String(describing: j.canvas.highlight?.rect)) from \(h.rect)")
    }

    /// The person's own drawing stays in view: a paste beside it zooms out to show both, an AI's
    /// change shows the whole board when it fits, and each thing the AI changed gets its own
    /// outline, round the shape whose words it changed, with the name tag clear of it
    /// (whiteboard council, round 3: 11, 12, 13 and 16).
    @Test func theWholeBoardStaysInViewAndEachAIChangeIsOutlined() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box + [
            ["type": "text", "id": "box-t", "containerId": "box", "text": "Manager review", "x": 120, "y": 160, "width": 160, "height": 25, "fontSize": 20],
        ]))
        defer { j.close() }
        try await j.ready()
        let allInView = """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value; const els = api.getSceneElements();
          const x1 = Math.min(...els.map((e) => e.x)), y1 = Math.min(...els.map((e) => e.y)), x2 = Math.max(...els.map((e) => e.x + e.width)), y2 = Math.max(...els.map((e) => e.y + e.height));
          return (x1 + s.scrollX) * z >= -1 && (y1 + s.scrollY) * z >= -1 && (x2 + s.scrollX) * z <= s.width + 1 && (y2 + s.scrollY) * z <= s.height + 1; })()
        """
        // A big screenshot pasted onto the drawing goes beside it, and the view zooms out to show both.
        let shot = try #require(CanvasImage(data: Self.png(width: 3200, height: 2000, clear: false)))
        j.canvas.send(.image(shot, at: nil))
        await j.until("the picture is in") { j.canvas.state.selection == ["image"] }
        #expect(try await j.js(allInView) as? Bool == true, "the drawing and the picture both in view")
        let zoom = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(zoom < 1 && zoom >= 0.5, "zoomed out to fit, not below half: \(zoom)")
        // The picture goes and the window gets bigger: the view zooms back in towards 100%.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'image') }); return 0; })()")
        j.rig.window.setContentSize(CGSize(width: 1300, height: 800))
        j.web.frame = CGRect(x: 0, y: 0, width: 1300, height: 800)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1300 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        try await Task.sleep(for: .milliseconds(200))
        let back = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(back > zoom + 0.05 && back <= 1, "zoomed back in, not past 100%: \(zoom) → \(back)")
        // A wide board, whole at 100%; the window narrows: it stays whole, zoomed out (round 4, 15).
        _ = try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState();
          const wide = { ...api.getSceneElements().find((e) => e.id === 'box'), id: 'far', x: 1000, y: 140, width: 150, height: 80, boundElements: [], seed: 7, version: 1 };
          api.updateScene({ elements: [...api.getSceneElements(), wide], appState: { zoom: { value: 1 }, scrollX: -80 + 48, scrollY: 0 } }); return 0; })()
        """)
        try await Task.sleep(for: .milliseconds(200))
        #expect(try await j.js(allInView) as? Bool == true, "whole before")
        j.rig.window.setContentSize(CGSize(width: 900, height: 600))
        j.web.frame = CGRect(x: 0, y: 0, width: 900, height: 600)
        for _ in 0..<100 {
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 900 { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        try await Task.sleep(for: .milliseconds(300))
        #expect(try await j.js(allInView) as? Bool == true, "still whole after the window narrowed")
        let narrowed = try #require(try await j.js("amber._canvas.api.getAppState().zoom.value") as? Double)
        #expect(narrowed < 1 && narrowed >= 0.5, "zoomed out to keep it whole: \(narrowed)")
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.id !== 'far') }); return 0; })()")
        // Panned so part of the board is cut off; the AI renames the box and adds one beside it, in
        // view: the whole board comes back into view (it fits at this zoom).
        _ = try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(); api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'image'), appState: { zoom: { value: 1 }, scrollX: -200, scrollY: 0 } }); return 0; })()")
        try await Task.sleep(for: .milliseconds(300))
        #expect(try await j.js(allInView) as? Bool == false, "cut off before")
        _ = try await j.js("amber._flush(); 0")
        try await Task.sleep(for: .milliseconds(300))
        let stored = try #require(try await j.js("JSON.stringify(amber._canvas.scene().elements)") as? String)
        var elements = try #require(try JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [[String: Any]])
        for i in elements.indices where elements[i]["id"] as? String == "box-t" { elements[i]["text"] = "Finance review"; elements[i]["version"] = 50 }
        elements.append(["type": "rectangle", "id": "ai-box", "x": 560, "y": 120, "width": 200, "height": 100, "label": ["text": "Notify team"]])
        elements.append(["type": "arrow", "id": "ai-arrow", "x": 300, "y": 170, "width": 260, "height": 0, "points": [[0, 0], [260, 0]]])
        CanvasController.highlightTime = 60
        defer { CanvasController.highlightTime = 4 }
        j.canvas.arrived(by: "ChatGPT")
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
        await j.until("outlined") { j.canvas.highlight != nil }
        #expect(try await j.js(allInView) as? Bool == true, "the whole board in view after the AI's change")
        let h = try #require(j.canvas.highlight)
        #expect(h.boxes.count == 2, "the renamed box and the new one, each on its own; the arrow between them without a box: \(h.boxes)")
        // The renamed box's outline goes round the box, not just its words.
        let box = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, b = api.getSceneElements().find((e) => e.id === 'box');
          return [(b.x + s.scrollX) * z, (b.y + s.scrollY) * z, b.width * z, b.height * z].join(','); })()
        """) as? String).split(separator: ",").compactMap { Double($0) }
        let shape = CGRect(x: box[0], y: box[1], width: box[2], height: box[3])
        #expect(h.boxes.contains { $0.insetBy(dx: -2, dy: -2).contains(shape) }, "round the whole box: \(shape) in \(h.boxes)")
        #expect(!h.boxes.contains { $0.contains(shape) && $0.width > shape.width * 2 }, "not one box round both")
        // The tag sits above the topmost outline, clear of it.
        let tag = CanvasAIHighlight.tag(over: CanvasAIHighlight(highlight: h).outlines)
        let top = try #require(CanvasAIHighlight(highlight: h).outlines.min { $0.minY < $1.minY })
        #expect(tag.y + 22 <= top.minY || tag.y >= top.maxY, "the tag doesn't cover the shape: \(tag) over \(top)")
        // …nor the rest of the drawing when there's a clear spot (round 4: the how-to line, an arrow).
        let shape2 = CGRect(x: 100, y: 200, width: 300, height: 80)
        let hint = CGRect(x: 90, y: 160, width: 120, height: 20)
        let at = CanvasAIHighlight.tag(over: [shape2], avoiding: [hint])
        #expect(!CGRect(x: at.x, y: at.y, width: 96, height: 22).intersects(hint), "clear of the hint line: \(at)")
        #expect(at.y + 22 <= shape2.minY || at.y >= shape2.maxY, "still clear of the shape: \(at)")
    }

    /// Undo and Redo give back exactly what was there: after Align, Undo, Redo, a bound arrow
    /// runs where it ran after Align (whiteboard council, round 4, 22-sequence: Redo put the arrow
    /// 9 pt lower).
    @Test func redoPutsABoundArrowBackWhereItWas() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("""
        amber._canvasCommand({ op: 'insert', elements: [
          { type: 'rectangle', id: 'a', x: 0, y: 160, width: 200, height: 90, label: { text: 'Plan' } },
          { type: 'rectangle', id: 'b', x: 420, y: 0, width: 200, height: 90, label: { text: 'Ship' } },
          { type: 'arrow', x: 204, y: 200, width: 212, height: -150, start: { id: 'a' }, end: { id: 'b' } },
        ] }); 0
        """)
        await j.until("drawn") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(500))
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.type === 'rectangle').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids }, captureUpdate: 'IMMEDIATELY' }); return 0; })()")
        try await Task.sleep(for: .milliseconds(200))
        let arrow = "(() => { const a = amber._canvas.api.getSceneElements().find((e) => e.type === 'arrow'); return [a.x, a.y, ...a.points.flat()].map((v) => Math.round(v)).join(','); })()"
        j.canvas.run(.alignMiddle)
        try await Task.sleep(for: .milliseconds(20))
        let soon = try #require(try await j.js(arrow) as? String)
        try await Task.sleep(for: .milliseconds(600))
        let aligned = try #require(try await j.js(arrow) as? String)
        #expect(soon == aligned, "nothing moves it after Align: \(soon) then \(aligned)")
        // Lined up, the arrow runs straight across between them (round 4, 22-sequence-2).
        let dy = aligned.split(separator: ",").compactMap { Int($0) }.last ?? 99
        #expect(abs(dy) <= 1, "straight across after Align › Middle: \(aligned)")
        j.canvas.run(.undo)
        try await Task.sleep(for: .milliseconds(600))
        let undone = try #require(try await j.js(arrow) as? String)
        #expect(undone != aligned, "Undo moved it back")
        j.canvas.run(.redo)
        try await Task.sleep(for: .milliseconds(600))
        let redone = try #require(try await j.js(arrow) as? String)
        #expect(redone == aligned, "Redo: \(redone), after Align: \(aligned)")
        j.canvas.run(.undo); try await Task.sleep(for: .milliseconds(600))
        j.canvas.run(.redo); try await Task.sleep(for: .milliseconds(600))
        #expect(try await j.js(arrow) as? String == aligned, "and again")
    }

    /// In dark mode the selection's outline and handles show in the accent, not the dim brown the
    /// dark filter made of it (whiteboard council, round 2, 07-selected-box-dark).
    @Test func theSelectionShowsInTheAccentInDarkMode() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        // Through the filter (invert, then hue-rotate 180°), what's drawn comes out as the accent.
        let js = """
        (() => { const H = [[-0.574, 1.43, 0.144], [0.426, 0.43, 0.144], [0.426, 1.43, -0.856]];
          return ["#ff9f0a", "#c9711a", "#3478f6"].map((want) => { const x = amber._throughDarkFilter(want);
            const n = parseInt(x.slice(1), 16), inv = [255 - ((n >> 16) & 255), 255 - ((n >> 8) & 255), 255 - (n & 255)];
            const shown = H.map((r) => Math.min(255, Math.max(0, r[0] * inv[0] + r[1] * inv[1] + r[2] * inv[2])));
            const w = parseInt(want.slice(1), 16), t = [(w >> 16) & 255, (w >> 8) & 255, w & 255];
            return Math.max(...shown.map((v, i) => Math.abs(v - t[i]))); }).join(","); })()
        """
        let errors = try #require(try await j.js(js) as? String)
        #expect(errors.split(separator: ",").allSatisfy { Double($0)! <= 40 }, "each within a shade: \(errors)")
        // A dark board: the colour the engine reads for the selection is the one made for the filter.
        let d = try await Joined(scene: CanvasTests.scene(Self.box), dark: true)
        defer { d.close() }
        try await d.ready()
        let read = """
        (() => { const c = document.querySelector('.excalidraw'), r = getComputedStyle(document.documentElement);
          return [c && c.className, r.getPropertyValue('--amber-accent').trim(), document.documentElement.style.getPropertyValue('--pinto-selection-dark'),
            c && getComputedStyle(c).getPropertyValue('--color-selection').trim(), c && getComputedStyle(c.querySelector('canvas.interactive') || c).filter].join('|'); })()
        """
        let seen = try #require(try await d.js(read) as? String)
        let parts = seen.split(separator: "|", omittingEmptySubsequences: false).map(String.init)
        #expect(parts.count == 5 && parts[0].contains("theme--dark"), "\(seen)")
        let made = try await d.js("amber._throughDarkFilter('\(parts[1])')") as? String
        #expect(parts.count == 5 && parts[3].lowercased() == made?.lowercased(), "the engine reads the filtered accent: \(seen), made \(made ?? "nil")")
        // Exported from a dark board, the picture is light: it goes into mostly white documents.
        d.canvas.exporter = { [weak s = d.rig.sandbox] f, selected, light, page in await s?.canvasExport(f, selected: selected, light: light, page: page) }
        let png = try #require(await d.canvas.export(.png))
        let corner = try #require(NSBitmapImageRep(data: png)?.colorAt(x: 2, y: 2)?.usingColorSpace(.sRGB))
        #expect(corner.brightnessComponent > 0.9, "a light background: \(corner)")
    }

    /// An empty whiteboard offers to bring in Excalidraw files (whiteboard council, round 4:
    /// "an Excalidraw import entry on the empty board").
    @Test func anEmptyBoardOffersToImportExcalidrawFiles() async throws {
        let ax = OffscreenAX(CanvasStart(canvas: CanvasController()), size: CGSize(width: 700, height: 360))
        defer { ax.close() }
        await ax.settle()
        let link = try #require(ax.find("canvas.import"), "\(ax.ids())")
        #expect(link.text.contains("Import Excalidraw files"), "\(link.text)")
        #expect(ax.find("canvas.template.retro") != nil)
    }

    /// An AI's short-form arrow with a width of 0 and no points runs straight down, as written
    /// (the engine read the 0 as missing and drew it slanting).
    @Test func aStraightDownArrowFromAnAIStaysStraight() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "arrow", "id": "down", "x": 100, "y": 100, "width": 0, "height": 120],
            ["type": "line", "id": "across", "x": 100, "y": 300, "width": 160, "height": 0],
        ]))
        defer { j.close() }
        try await j.ready()
        let ends = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.type === 'arrow' || e.type === 'line').map((e) => e.points[e.points.length - 1].map(Math.round)))") as? String)
        let v = ends.filter { "-0123456789,".contains($0) }.split(separator: ",").compactMap { Int($0) }
        #expect(v.count == 4 && v[0] == 0 && abs(v[1] - 120) <= 2 && abs(v[2] - 160) <= 2 && v[3] == 0, "straight down, straight across: \(ends)")
    }

    /// Present walks the board's frames one by one, each filling the view, with the laser pointer
    /// picked; next, previous and Escape from the keyboard; with no frames, the whole board
    /// (whiteboard council, rounds 4 and 5: frames, presenting, a laser pointer).
    @Test func presentWalksTheFramesAndEnds() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 40, "y": 40, "width": 120, "height": 80],
            ["type": "rectangle", "id": "b", "x": 1460, "y": 960, "width": 420, "height": 280],
            ["type": "frame", "id": "f1", "children": ["a"], "name": "Intro"],
            ["type": "frame", "id": "f2", "children": ["b"], "name": "Plan"],
        ]))
        defer { j.close() }
        try await j.ready()
        let frameInView = { (id: String) in """
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === '\(id)');
          const x1 = (f.x + s.scrollX) * z, y1 = (f.y + s.scrollY) * z, x2 = (f.x + f.width + s.scrollX) * z, y2 = (f.y + f.height + s.scrollY) * z;
          return x1 >= -1 && y1 >= -1 && x2 <= s.width + 1 && y2 <= s.height + 1 && ((x2 - x1) > s.width * 0.6 || (y2 - y1) > s.height * 0.6); })()
        """ }
        let before = try #require(try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.zoom.value, s.scrollX, s.scrollY].join(','); })()") as? String)
        j.canvas.send(.present(.start))
        await j.until("presenting the first frame") { j.canvas.state.present?.index == 0 }
        #expect(j.canvas.state.present?.index == 0 && j.canvas.state.present?.count == 2 && j.canvas.state.present?.name == "Intro")
        #expect(j.canvas.state.tool == .laser, "the laser pointer is picked")
        #expect(CanvasPresentBar.position(j.canvas.state.present!) == "1 of 2")
        try await Task.sleep(for: .milliseconds(700))
        #expect(try await j.js(frameInView("f1")) as? Bool == true, "the first frame fills the view")
        j.canvas.send(.present(.next))
        await j.until("the second") { j.canvas.state.present?.index == 1 }
        #expect(j.canvas.state.present?.name == "Plan")
        try await Task.sleep(for: .milliseconds(700))
        #expect(try await j.js(frameInView("f2")) as? Bool == true, "the second frame fills the view")
        // The frame's name and outline are hidden while presenting: the bar names it (round 6).
        #expect(try await j.js("(() => { const r = amber._canvas.api.getAppState().frameRendering; return !r.name && !r.outline; })()") as? Bool == true)
        // The window grows (Full Screen hides the columns): the step fits again (round 6, 25-present-1).
        let size0 = j.web.frame.size
        j.rig.window.setContentSize(CGSize(width: size0.width + 500, height: size0.height + 200))
        j.web.frame = CGRect(x: 0, y: 0, width: size0.width + 500, height: size0.height + 200)
        try await Task.sleep(for: .milliseconds(500))
        #expect(try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === 'f2'); return f.width * z > s.width * 0.8 || f.height * z > s.height * 0.8; })()") as? Bool == true, "refitted to the larger window")
        // The laser toggles off and on from the Present bar.
        j.canvas.send(.tool(.selection))
        await j.until("laser off") { j.canvas.state.tool == .selection }
        j.canvas.send(.tool(.laser))
        await j.until("laser on") { j.canvas.state.tool == .laser }
        j.rig.window.setContentSize(size0)
        j.web.frame = CGRect(origin: .zero, size: size0)
        try await Task.sleep(for: .milliseconds(500))
        // Where it is on screen, for the cover over the rest of the board (round 6).
        let shown = try #require(j.canvas.state.present?.frame)
        let real = try #require(try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, f = api.getSceneElements().find((e) => e.id === 'f2'); return [(f.x + s.scrollX) * z, (f.y + s.scrollY) * z, f.width * z, f.height * z].map(Math.round).join(','); })()") as? String)
        #expect("\(Int(shown.minX)),\(Int(shown.minY)),\(Int(shown.width)),\(Int(shown.height))" == real, "\(shown) vs \(real)")
        j.canvas.send(.present(.next))
        try await Task.sleep(for: .milliseconds(150))
        #expect(j.canvas.state.present?.index == 1, "no further than the last")
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); 0")
        await j.until("← goes back") { j.canvas.state.present?.index == 0 }
        _ = try await j.js("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); 0")
        await j.until("Escape ends it") { j.canvas.state.present == nil }
        #expect(j.canvas.state.tool == .selection)
        let after = try await j.js("(() => { const s = amber._canvas.api.getAppState(); return [s.zoom.value, s.scrollX, s.scrollY].join(','); })()") as? String
        #expect(after == before, "the view as it was before presenting: \(before) → \(after ?? "")")
        #expect(try await j.js("amber._canvas.api.getAppState().frameRendering.name") as? Bool == true, "frame names back after")
        // No frames: one step, the whole board.
        _ = try await j.js("(() => { const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElements().filter((e) => e.type !== 'frame').map((e) => ({ ...e, frameId: null })) }); return 0; })()")
        j.canvas.send(.present(.start))
        await j.until("presenting the board") { j.canvas.state.present != nil }
        #expect(j.canvas.state.present == .init(index: 0, count: 1, name: "Whole board", frame: nil), "the whole board, uncovered")
        j.canvas.send(.present(.stop))
        await j.until("stopped") { j.canvas.state.present == nil }
        // F and K reach the page's frame and laser tools.
        j.canvas.pick(.frame)
        await j.until("the frame tool") { j.canvas.state.tool == .frame }
        j.canvas.pick(.laser)
        await j.until("the laser") { j.canvas.state.tool == .laser }
    }

    /// In a narrow column the board's toolbar is compact: the main tools, the rest in More Tools,
    /// so every tool can still be reached (whiteboard council, round 2, 15).
    @Test func aNarrowWindowKeepsEveryToolReachable() {
        // A 1400 window (the default) with both columns has room for every tool; 1000 doesn't.
        #expect(CanvasToolbarTools.compact(670) && !CanvasToolbarTools.compact(800))
        #expect(!CanvasSelectionBar.inView(CGRect(x: -400, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)), "no bar for a selection out of view")
        #expect(CanvasSelectionBar.inView(CGRect(x: -100, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)))
        let reachable = Set(CanvasToolbarTools.compactShown + CanvasToolbarTools.compactMore + CanvasTool.shapes + CanvasToolbarTools.inShapesMenu)
        #expect(reachable == Set(CanvasTool.allCases), "missing: \(Set(CanvasTool.allCases).subtracting(reachable))")
        #expect(CanvasToolbarTools.compactShown.count + 2 <= 6, "few enough to fit beside Full Screen, Share and More")
    }

    /// A sticky note: yellow, square, typed into at once; the next one goes beside it, never on
    /// top, and S makes one too (whiteboard council, round 2: retro and kanban boards with no sticky tool).
    @Test func aStickyNoteIsTypedIntoAndTheNextGoesBesideIt() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        try await j.ready()
        j.canvas.send(.sticky)
        await j.until("typing in the sticky note") { j.canvas.state.editing }
        let first = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => [Math.round(e.x), Math.round(e.y), e.width, e.backgroundColor]))") as? String)
        #expect(first.contains("180,\"#ffec99\""), "\(first)")
        // Done typing; another goes beside it, not on top of it.
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        j.canvas.send(.sticky)
        await j.until("typing in the second") { j.canvas.state.editing }
        let xs = try #require(try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => Math.round(e.x)).join(',')") as? String)
        let both = xs.split(separator: ",").compactMap { Int($0) }
        #expect(both.count == 2 && both[1] - both[0] == 180 + 24, "side by side: \(xs)")
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true })); 0")
        await j.until("S makes one") { j.canvas.state.editing }
        let n = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).length") as? Int
        #expect(n == 3)
        // On a retro, a sticky goes on the lanes, in view; they don't push it away.
        _ = try await j.js("document.activeElement && document.activeElement.blur(); amber._canvas.api.updateScene({ elements: [] }); 0")
        await j.until("cleared") { j.canvas.state.empty }
        j.canvas.send(.insert(.retro))
        await j.until("the retro is in") { !j.canvas.state.empty }
        try await Task.sleep(for: .milliseconds(300))
        j.canvas.send(.sticky)
        await j.until("typing in it") { j.canvas.state.editing }
        let place = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
          const e = api.getSceneElements().find((e) => e.customData && e.customData.pintoSticky);
          return [(e.x + s.scrollX) * z, (e.y + s.scrollY) * z, (e.x + e.width + s.scrollX) * z, (e.y + e.height + s.scrollY) * z].map(Math.round).join(','); })()
        """) as? String)
        let v = place.split(separator: ",").compactMap { Double($0) }
        #expect(v.count == 4 && v[0] >= 0 && v[2] <= 900 && v[1] >= 0 && v[3] <= 600, "in view on the retro: \(place)")
        let clear = try await j.js("""
        (() => { const all = amber._canvas.api.getSceneElements(); const st = all.find((e) => e.customData && e.customData.pintoSticky);
          const cards = all.filter((e) => (e.type === 'rectangle' || (e.type === 'text' && !e.containerId)) && !(e.customData && e.customData.pintoSticky) && e.width * e.height < 180 * 180 * 2);
          const over = cards.some((c) => st.x < c.x + c.width && st.x + st.width > c.x && st.y < c.y + c.height && st.y + st.height > c.y);
          const words = all.find((e) => e.containerId === st.id);
          return JSON.stringify({ over, ink: words && words.strokeColor }); })()
        """) as? String
        #expect(clear == "{\"over\":false,\"ink\":\"#2a1d10\"}", "not on a card, its words in ink: \(clear ?? "")")
        // Pick a lane's card and press S twice: each goes under the last in that lane, and the
        // view follows when it runs past the edge (never onto another lane or a lane's name).
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("(() => { const api = amber._canvas.api; const st = new Set(api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky).map((e) => e.id)); api.updateScene({ elements: api.getSceneElements().filter((e) => !st.has(e.id) && !st.has(e.containerId)) }); return 0; })()")
        _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === 'Demo every Friday'); api.updateScene({ appState: { selectedElementIds: { [t.containerId]: true } } }); return 0; })()")
        try await Task.sleep(for: .milliseconds(100))
        for n in 0..<2 {
            if n > 0 {
                // Done typing, the note stays selected (as Escape leaves it).
                _ = try await j.js("(() => { const api = amber._canvas.api, st = api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky); api.updateScene({ appState: { selectedElementIds: { [st[st.length - 1].id]: true } } }); return 0; })()")
                try await Task.sleep(for: .milliseconds(100))
            }
            j.canvas.send(.sticky)
            await j.until("typing in the next") { j.canvas.state.editing }
            _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
            await j.until("done typing") { !j.canvas.state.editing }
        }
        let lane = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
          const st = api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky);
          const b = st[1]; const inView = (b.x + s.scrollX) * z >= 0 && (b.x + b.width + s.scrollX) * z <= s.width && (b.y + s.scrollY) * z >= 0 && (b.y + b.height + s.scrollY) * z <= s.height;
          return JSON.stringify({ sameX: Math.round(st[0].x) === Math.round(b.x), below: b.y > st[0].y, inView }) + (Math.round(st[0].x) === Math.round(b.x) ? '' : JSON.stringify({ st: st.map((e) => [e.x, e.y, e.width, e.height]), card: (() => { const t = api.getSceneElements().find((e) => e.text === 'Demo every Friday'); const c = api.getSceneElements().find((e) => e.id === t.containerId); return [c.x, c.y, c.width, c.height]; })(), lanes: api.getSceneElements().filter((e) => e.width * e.height >= 64800).map((e) => [e.type, e.x, e.y, e.width, e.height]), view: [s.scrollX, s.scrollY, s.width, s.height, z] })); })()
        """) as? String)
        #expect(lane == "{\"sameX\":true,\"below\":true,\"inView\":true}", "under it in the same lane, the view following it: \(lane)")
        // With room below, picking a card puts the sticky under it, and the lane grows to hold
        // the next one (as a retro board fills up).
        _ = try await j.js("document.activeElement && document.activeElement.blur(); 0")
        await j.until("done typing") { !j.canvas.state.editing }
        _ = try await j.js("amber._canvas.api.updateScene({ elements: amber._canvas.api.getSceneElements().filter((e) => !(e.customData && e.customData.pintoSticky) && !(e.containerId && amber._canvas.api.getSceneElements().find((c) => c.id === e.containerId && c.customData && c.customData.pintoSticky))) }); amber._canvas.api.updateScene({ appState: { zoom: { value: 0.4 }, scrollX: 200, scrollY: 200 } }); 0")
        try await Task.sleep(for: .milliseconds(200))
        for _ in 0..<2 {
            _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const st = all.filter((e) => e.customData && e.customData.pintoSticky); const t = all.find((e) => e.type === 'text' && e.text === 'Shipped on time'); const c = st.length ? st[st.length - 1] : all.find((e) => e.id === t.containerId); api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); return 0; })()")
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.send(.sticky)
            await j.until("typing in it") { j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(100))
            _ = try await j.js("(() => { const t = document.querySelector('textarea'); t.value = 'Typed here'; t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); return 0; })()")
            await j.until("done typing") { !j.canvas.state.editing }
        }
        // What's typed goes in the new sticky, never in the card it was put under.
        let typed = try await j.js("(() => { const all = amber._canvas.api.getSceneElements(); return JSON.stringify(all.filter((e) => e.type === 'text' && e.containerId).map((e) => { const c = all.find((x) => x.id === e.containerId); return [!!(c.customData && c.customData.pintoSticky), e.text]; })); })()") as? String ?? ""
        #expect(typed.contains("[false,\"Shipped on time\"]") && typed.components(separatedBy: "[true,\"Typed here\"]").count == 3, "typed into the stickies only: \(typed)")
        let grew = try #require(try await j.js("""
        (() => { const all = amber._canvas.api.getSceneElements(); const st = all.filter((e) => e.customData && e.customData.pintoSticky);
          const t = all.find((e) => e.type === 'text' && e.text === 'Shipped on time'); const card = all.find((e) => e.id === t.containerId);
          const lane = all.find((e) => e.type === 'rectangle' && e.width * e.height >= 180 * 180 * 2 && card.x >= e.x && card.x + card.width <= e.x + e.width && card.y >= e.y && card.y + card.height <= e.y + e.height);
          const inside = (b) => b.x >= lane.x && b.x + b.width <= lane.x + lane.width && b.y >= lane.y && b.y + b.height <= lane.y + lane.height;
          const words = (b) => all.find((e) => e.containerId === b.id);
          const fill = card.backgroundColor && card.backgroundColor !== 'transparent' ? card.backgroundColor : '#ffec99';
          if (!st.every((b) => b.backgroundColor === fill)) return 'not the card colour: ' + JSON.stringify([fill, st.map((b) => b.backgroundColor)]);
          if (!st.every((b) => b.width === card.width && b.strokeColor === card.strokeColor && words(b) && words(b).textAlign === 'center')) return 'not like the card: ' + JSON.stringify(st.map((b) => [b.width, b.strokeColor, words(b) && words(b).textAlign]));
          return JSON.stringify({ n: st.length, under: st.every((b) => b.y > card.y + card.height), inLane: st.every(inside) }) + (st.every(inside) ? '' : JSON.stringify({ lane: [lane.x, lane.y, lane.width, lane.height], st: st.map((b) => [b.x, b.y]), z: amber._canvas.api.getAppState().zoom.value })); })()
        """) as? String)
        #expect(grew.hasPrefix("{\"n\":2,\"under\":true,\"inLane\":true}") && !grew.contains("lane\":"), "under the card, inside a lane that grew: \(grew)")
    }

    /// Two or more shapes line up and space out from the bar; an arrow turns straight, curved or
    /// elbowed; different fills show as mixed; a picture has no stroke to set (whiteboard council,
    /// round 2: 09, 10, 11).
    @Test func shapesAlignArrowsBendAndMixedFillsShowAsMixed() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "a", "x": 100, "y": 100, "width": 100, "height": 60, "backgroundColor": "#ffc9c9", "fillStyle": "solid"],
            ["type": "rectangle", "id": "b", "x": 160, "y": 220, "width": 100, "height": 60, "backgroundColor": "#b2f2bb", "fillStyle": "solid"],
            ["type": "rectangle", "id": "c", "x": 400, "y": 340, "width": 100, "height": 60, "backgroundColor": "#b2f2bb", "fillStyle": "solid"],
            ["type": "arrow", "id": "line", "x": 300, "y": 100, "width": 120, "height": 80, "points": [[0, 0], [60, 20], [120, 80]]],
        ]))
        defer { j.close() }
        try await j.ready()
        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { a: true, b: true, c: true } } }); 0")
        await j.until("three selected") { j.canvas.state.selection.count == 3 }
        #expect(j.canvas.state.showsAlign && j.canvas.state.mixedFill, "align offered, the fill shown as mixed")
        j.canvas.run(.alignLeft)
        try await Task.sleep(for: .milliseconds(300))
        let xs = try await j.js("['a','b','c'].map((id) => Math.round(amber._canvas.api.getSceneElements().find((e) => e.id === id).x)).join(',')") as? String
        #expect(xs == "100,100,100", "lined up on the left: \(xs ?? "")")
        j.canvas.run(.distributeVertically)
        try await Task.sleep(for: .milliseconds(300))
        let ys = try await j.js("['a','b','c'].map((id) => Math.round(amber._canvas.api.getSceneElements().find((e) => e.id === id).y)).join(',')") as? String
        #expect(ys == "100,220,340", "spaced evenly: \(ys ?? "")")

        _ = try await j.js("amber._canvas.api.updateScene({ appState: { selectedElementIds: { line: true } } }); 0")
        await j.until("the arrow selected") { j.canvas.state.selection == ["arrow"] }
        #expect(!j.canvas.state.showsAlign && !j.canvas.state.mixedFill)
        j.canvas.set(.arrowType, .text("elbow"))
        await j.until("elbowed") { j.canvas.state.arrowType == "elbow" }
        let elbowed = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.id === 'line').elbowed === true") as? Bool
        #expect(elbowed == true)
        j.canvas.set(.arrowType, .text("sharp"))
        await j.until("straight") { j.canvas.state.arrowType == "sharp" }

        var picture = CanvasState()
        picture.selection = ["image"]
        #expect(!picture.showsStroke && !picture.showsFill, "a picture: no stroke or fill to set")
    }

    /// When the board gets wider (the sidebar folding away, Full Screen) the drawing stays where
    /// it was in the middle of the view; the engine kept its left edge, which left a drawing in the
    /// left half (whiteboard council, round 1, 08-fullscreen).
    @Test func theViewStaysCentredWhenTheBoardGetsWider() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        try await j.ready()
        let centre = "(() => { const s = amber._canvas.api.getAppState(); const z = s.zoom.value; return [Math.round(-s.scrollX + s.width / 2 / z), Math.round(-s.scrollY + s.height / 2 / z)].join(','); })()"
        let before = try await j.js(centre) as? String
        j.rig.window.setContentSize(CGSize(width: 1400, height: 800))
        j.web.frame = CGRect(x: 0, y: 0, width: 1400, height: 800)
        var after: String?
        for _ in 0..<60 {
            try await Task.sleep(for: .milliseconds(50))
            if (try await j.js("amber._canvas.api.getAppState().width") as? Double) == 1400 { after = try await j.js(centre) as? String; break }
        }
        #expect(before != nil && after == before, "the middle of the view is the same point of the drawing: \(before ?? "?") then \(after ?? "?")")
    }

    // MARK: Note cards

    /// What the app knows of each note, for the cards (CanvasNoteCard.info stands in).
    @MainActor final class Library {
        var notes: [String: CanvasNoteCard] = [:]
        var asked = 0
        var opened: [UUID] = []

        func join(_ canvas: CanvasController, board: UUID? = nil) {
            canvas.noteID = board
            canvas.cardInfo = { [weak self] refs in
                guard let self else { return [:] }
                asked += 1
                return refs.reduce(into: [:]) { out, r in out[r] = self.notes[r] ?? CanvasNoteCard(id: nil, title: nil, preview: CanvasNoteCard.missingText, deleted: true) }
            }
            canvas.openNote = { [weak self] id in self?.opened.append(id) }
        }
    }

    static let plan = UUID(uuidString: "6F1C2A3B-0000-4000-8000-0000000000A1")!
    static let press = UUID(uuidString: "6F1C2A3B-0000-4000-8000-0000000000B2")!
    static let planCard = CanvasNoteCard(id: plan, title: "Launch plan", preview: "Ship the beta to the waitlist on Friday. Post on the blog and the newsletter the same morning, then answer replies.")
    static let pressCard = CanvasNoteCard(id: press, title: "Press list", preview: "Who hears first, and when.")

    /// Each part of each card on the page: its role, its note, its words, where it is.
    static func cardParts(_ j: Joined) async throws -> [[String: Any]] {
        let json = try await j.js("""
        (() => JSON.stringify(amber._canvas.api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote).map((e) => ({
          id: e.id, type: e.type, role: e.customData.pintoCard || null, note: e.customData.pintoNote, title: e.customData.title || null,
          text: e.text || null, group: (e.groupIds || [])[0] || null, groups: (e.groupIds || []).length, x: e.x, y: e.y, width: e.width, height: e.height,
          strokeStyle: e.strokeStyle, strokeColor: e.strokeColor, link: e.link, fontFamily: e.fontFamily || null,
        }))))()
        """) as? String ?? "[]"
        return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]] ?? []
    }

    static func part(_ parts: [[String: Any]], _ role: String, of note: String? = nil) -> [String: Any]? {
        parts.first { $0["role"] as? String == role && (note == nil || ($0["note"] as? String) == note) }
    }

    /// The page's point (client coordinates) over a card's title, or over the middle of an element.
    static func clientPoint(_ j: Joined, of filter: String, dy: Double? = nil) async throws -> CGPoint {
        let r = try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, e = api.getSceneElements().find((e) => \(filter));
          if (!e) return null; const y = \(dy.map { "e.y + \($0)" } ?? "e.y + e.height / 2");
          return [(e.x + e.width / 2 + s.scrollX) * z + s.offsetLeft, (y + s.scrollY) * z + s.offsetTop]; })()
        """) as? [Double]
        let p = try #require(r, "found \(filter)")
        return CGPoint(x: p[0], y: p[1])
    }

    /// A note from the app goes on as a card: one group of ordinary elements whose customData names
    /// the note, its title and first lines in the card's own font, selected, one step Undo takes
    /// back. The bar over it has Open Note and nothing to style.
    @Test func aNoteFromTheAppGoesOnAsACardThatSaysWhatItsNoteSays() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on the board, selected") { j.canvas.state.card?.note == Self.plan.uuidString }
        let parts = try await Self.cardParts(j)
        let frame = try #require(Self.part(parts, "card"))
        #expect(frame["type"] as? String == "rectangle" && frame["note"] as? String == Self.plan.uuidString && frame["title"] as? String == "Launch plan")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        let preview = try #require(Self.part(parts, "preview")?["text"] as? String)
        #expect(preview.hasPrefix("Ship the beta") && preview.split(separator: "\n").count <= 3, "the first lines, at most three: \(preview)")
        #expect(parts.filter { $0["role"] as? String == "glyph" }.count == 2, "a note glyph")
        #expect(Set(parts.compactMap { $0["group"] as? String }).count == 1 && parts.allSatisfy { $0["group"] is String }, "one group")
        #expect(parts.allSatisfy { $0["link"] is NSNull || $0["link"] == nil }, "no web link on any part")
        #expect(Self.part(parts, "title")?["fontFamily"] as? Int == 6, "the card's words in the normal font")
        // Laid out inside the card.
        let fx = frame["x"] as? Double ?? 0, fw = frame["width"] as? Double ?? 0, fy = frame["y"] as? Double ?? 0, fh = frame["height"] as? Double ?? 0
        for p in parts where p["role"] as? String != "card" {
            let x = p["x"] as? Double ?? 0, y = p["y"] as? Double ?? 0, w = p["width"] as? Double ?? 0, h = p["height"] as? Double ?? 0
            #expect(x >= fx && y >= fy && x + w <= fx + fw + 0.5 && y + h <= fy + fh + 0.5, "\(p["role"] ?? "?") is inside the card")
        }
        let s = j.canvas.state
        #expect(s.onlyCards && s.selectedCards == 1 && s.showsSelectionBar)
        #expect(!s.showsStroke && !s.showsFill && !s.showsText && !s.showsAlign, "nothing to style on a card")
        #expect(s.cardNotes == [Self.plan.uuidString])
        #expect(j.canvas.canUndo)
        j.canvas.run(.undo)
        await j.until("Undo takes it back") { j.canvas.state.cardNotes.isEmpty }
        // A deleted note, or the board itself, doesn't go on.
        library.notes[Self.press.uuidString] = CanvasNoteCard(id: Self.press, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.addCards([Self.press, j.canvas.noteID!])
        try await Task.sleep(for: .milliseconds(300))
        #expect(j.canvas.state.cardNotes.isEmpty)
    }

    /// Double-click a card (or ⌘-click it, or Open Note on its bar or its right-click menu) and its
    /// note opens; the engine doesn't start typing in the card's words. A card whose note is gone
    /// says so and opens nothing; a double-click elsewhere opens nothing.
    @Test func aCardOpensItsNote() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on") { j.canvas.state.card != nil }
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } }); return 1; })()")
        await j.until("nothing selected") { !j.canvas.state.hasSelection }

        // Double-click on its title, where the engine would start editing the words.
        let title = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'title'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(title.x), \(title.y)), at = { bubbles: true, cancelable: true, view: window, clientX: \(title.x), clientY: \(title.y), pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 }; for (let i = 0; i < 2; i++) { el.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 })); window.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 })); } el.dispatchEvent(new MouseEvent('dblclick', { ...at, detail: 2 })); return el.tagName; })()")
        await j.until("the note opened") { library.opened == [Self.plan] }
        try await Task.sleep(for: .milliseconds(200))
        #expect(!j.canvas.state.editing, "no typing started in the card")
        #expect(try await j.js("amber._canvas.api.getAppState().editingGroupId") is NSNull, "nor inside its group")

        // ⌘-click.
        let middle = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(middle.x), \(middle.y)), at = { bubbles: true, cancelable: true, view: window, clientX: \(middle.x), clientY: \(middle.y), pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, metaKey: true }; el.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 })); window.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 })); return 1; })()")
        await j.until("⌘-click opened it") { library.opened.count == 2 }

        // A double-click on the box opens nothing.
        let box = try await Self.clientPoint(j, of: "e.id === 'box'")
        _ = try await j.js("(() => { const el = document.elementFromPoint(\(box.x), \(box.y)); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: \(box.x), clientY: \(box.y), detail: 2 })); return 1; })()")
        try await Task.sleep(for: .milliseconds(300))
        #expect(library.opened.count == 2)

        // Selected: Open Note on the bar, and first in the right-click menu.
        _ = try await j.js("(() => { const api = amber._canvas.api, ids = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
        await j.until("the card selected") { j.canvas.state.card != nil }
        let card = try #require(j.canvas.state.card)
        #expect(card.title == "Launch plan")
        j.canvas.openCard(card.note)
        #expect(library.opened.count == 3)
        let web = try #require(j.web as? NotePageWebView)
        let menu = web.canvasMenu()
        #expect(menu.items.first?.title == CanvasSelectionBar.openNote)
        menu.performActionForItem(at: 0)
        #expect(library.opened.count == 4)

        // Its note deleted: it says so and opens nothing.
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.openCard(Self.plan.uuidString)
        #expect(library.opened.count == 4)
        #expect(j.canvas.notice == "This note was deleted")
    }

    /// A card follows its note: the board opening with a card whose note has since been renamed
    /// shows the new title; a note edited while the board is open changes its card at once (a save
    /// of any other note asks nothing); a deleted note's card says "Note deleted", quietly; what's
    /// saved says the same.
    @Test func aCardFollowsItsNoteWhenRenamedEditedOrDeleted() async throws {
        // As saved on the last visit: the title it had then.
        let old: [[String: Any]] = [["type": "rectangle", "id": "plan", "x": 0, "y": 0, "customData": ["pintoNote": Self.plan.uuidString, "title": "Launch plan draft"]]]
        let j = try await Joined(scene: CanvasTests.scene(old))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "title")?["text"] as? String == "Launch plan" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        var parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        #expect(Self.part(parts, "card")?["title"] as? String == "Launch plan")
        #expect((Self.part(parts, "preview")?["text"] as? String)?.hasPrefix("Ship the beta") == true)
        let tall = Self.part(parts, "card")?["height"] as? Double ?? 0

        // Renamed and emptied while the board is open.
        let asked = library.asked
        j.canvas.notesChanged([UUID()])
        #expect(library.asked == asked, "another note's save asks nothing")
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: "Launch plan v2", preview: "")
        j.canvas.notesChanged([Self.plan])
        #expect(library.asked == asked + 1)
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "title")?["text"] as? String == "Launch plan v2" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan v2")
        #expect(Self.part(parts, "preview") == nil, "nothing under the title")
        #expect((Self.part(parts, "card")?["height"] as? Double ?? 0) < tall, "the card is shorter")

        // Deleted.
        library.notes[Self.plan.uuidString] = CanvasNoteCard(id: Self.plan, title: nil, preview: "Note deleted", deleted: true)
        j.canvas.notesChanged([Self.plan])
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "preview")?["text"] as? String == "Note deleted" { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        parts = try await Self.cardParts(j)
        #expect(Self.part(parts, "preview")?["text"] as? String == "Note deleted")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan v2", "the title it had")
        #expect(Self.part(parts, "card")?["strokeStyle"] as? String == "dashed" && Self.part(parts, "title")?["strokeColor"] as? String == "#868e96", "quiet")

        // What's saved says the same.
        _ = try await j.js("(() => { amber._flush(); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        let saved = j.rig.elements.first { $0["id"] as? String == "plan" }
        #expect((saved?["customData"] as? [String: Any])?["title"] as? String == "Launch plan v2")
        #expect(j.rig.elements.contains { ($0["customData"] as? [String: Any])?["pintoCard"] as? String == "preview" && $0["text"] as? String == "Note deleted" })
    }

    /// An AI writes a card in the short form, a shape whose customData names a note by title: the
    /// board draws it as a card where it was, keeping its id (an arrow bound to it stays bound and
    /// still meets it), takes the note's id, and saves it back in full. One written while the board
    /// is open is drawn too; a title no note has says so.
    @Test func anAIsShortCardIsDrawnAsACard() async throws {
        let j = try await Joined(scene: CanvasTests.scene([
            ["type": "rectangle", "id": "draft", "x": -320, "y": 0, "width": 180, "height": 70, "label": ["text": "Draft"]],
            ["type": "rectangle", "id": "plan", "x": 0, "y": -15, "width": 260, "height": 100, "customData": ["pintoNote": "Launch plan"], "label": ["text": "Launch plan"]],
            ["type": "arrow", "id": "join", "x": -138, "y": 35, "width": 136, "height": 0, "start": ["id": "draft"], "end": ["id": "plan"]],
        ]))
        defer { j.close() }
        let library = Library()
        library.notes = ["Launch plan": Self.planCard, Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        for _ in 0..<60 {
            if try await Self.part(Self.cardParts(j), "card")?["note"] as? String == Self.plan.uuidString { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let parts = try await Self.cardParts(j)
        let frame = try #require(Self.part(parts, "card"))
        #expect(frame["id"] as? String == "plan" && frame["note"] as? String == Self.plan.uuidString, "its id kept, the note's id taken: \(frame)")
        #expect(Self.part(parts, "title")?["text"] as? String == "Launch plan")
        #expect((Self.part(parts, "preview")?["text"] as? String)?.hasPrefix("Ship the beta") == true)
        let label = try await j.js("(() => amber._canvas.api.getSceneElements().filter((e) => e.containerId === 'plan').length)()") as? Int
        #expect(label == 0, "the AI's own label gave way to the card's title")
        // The arrow still joins it, and still meets its edge.
        let arrow = try #require(try await j.js("(() => { const a = amber._canvas.api.getSceneElements().find((e) => e.id === 'join'); return JSON.stringify({ end: a.endBinding && a.endBinding.elementId, y: a.y + a.points[a.points.length - 1][1] }); })()") as? String)
        let a = try JSONSerialization.jsonObject(with: Data(arrow.utf8)) as? [String: Any] ?? [:]
        #expect(a["end"] as? String == "plan")
        let fy = frame["y"] as? Double ?? 0, fh = frame["height"] as? Double ?? 0, ay = a["y"] as? Double ?? -1
        #expect(ay >= fy && ay <= fy + fh, "the arrow ends on the card (\(ay) in \(fy)…\(fy + fh))")
        // Saved back in full.
        _ = try await j.js("(() => { amber._flush(); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        #expect(j.rig.elements.contains { $0["id"] as? String == "plan-title" && $0["text"] as? String == "Launch plan" })

        // An AI adds another while the board is open; one names a note that isn't there.
        var all = j.rig.elements
        all.append(["type": "rectangle", "id": "press", "x": 0, "y": 200, "customData": ["pintoNote": "Press list"]])
        all.append(["type": "rectangle", "id": "nope", "x": 0, "y": 400, "customData": ["pintoNote": "Nobody wrote this"]])
        library.notes["Press list"] = Self.pressCard
        library.notes[Self.press.uuidString] = Self.pressCard
        j.rig.sandbox.push(body: "Canvas", data: ["values": ["scene": CanvasTests.scene(all)], "collections": [String: Any]()])
        for _ in 0..<80 {
            let p = try await Self.cardParts(j)
            if Self.part(p, "card", of: Self.press.uuidString) != nil, Self.part(p, "preview", of: "Nobody wrote this") != nil { break }
            try await Task.sleep(for: .milliseconds(50))
        }
        let now = try await Self.cardParts(j)
        #expect(Self.part(now, "title", of: Self.press.uuidString)?["text"] as? String == "Press list")
        #expect(Self.part(now, "preview", of: "Nobody wrote this")?["text"] as? String == CanvasNoteCard.missingText)
        j.canvas.openCard("Nobody wrote this")
        #expect(library.opened.isEmpty && j.canvas.notice == "No note has this title")
    }

    /// Export and the shared page's picture show a card as drawn, its title and first lines, with
    /// no link in it; the .excalidraw file keeps which note it is.
    @Test func aCardExportsAsDrawn() async throws {
        let j = try await Joined(scene: CanvasTests.scene(Self.box))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        j.canvas.addCards([Self.plan])
        await j.until("the card is on") { j.canvas.state.card != nil }
        let svg = String(decoding: try #require(await j.canvas.export(.svg)), as: UTF8.self)
        #expect(svg.contains("Launch plan") && svg.contains("Ship the beta"), "its words are in the picture")
        #expect(!svg.contains("<a ") && !svg.contains("xlink:href=\"http") && !svg.contains("href=\"http"), "no link to follow")
        #expect(await j.canvas.export(.png, light: true, page: "Product launch") != nil)
        let file = String(decoding: try #require(await j.canvas.export(.excalidraw)), as: UTF8.self)
        #expect(file.contains("\"pintoNote\"") && file.contains(Self.plan.uuidString))
    }

    /// Notes dragged from the list onto a board go on as cards where they're dropped, side by side;
    /// the board itself doesn't, and a folder is refused with a word.
    @Test func notesDroppedFromTheListGoOnAsCards() async throws {
        let j = try await Joined(scene: CanvasTests.scene([]))
        defer { j.close() }
        let library = Library()
        let board = UUID()
        library.notes = [Self.plan.uuidString: Self.planCard, Self.press.uuidString: Self.pressCard]
        library.join(j.canvas, board: board)
        try await j.ready()
        func provider(_ item: PaneDragItem) -> NSItemProvider {
            let p = NSItemProvider()
            let data = try? JSONEncoder().encode(item)
            p.registerDataRepresentation(forTypeIdentifier: UTType.paneItem.identifier, visibility: .all) { done in done(data, nil); return nil }
            return p
        }
        let drop = [provider(PaneDragItem(kind: .note, id: Self.plan, others: [Self.press, board]))]
        #expect(CanvasNoteDrop.carriesNotes(drop))
        CanvasNoteDrop.place(drop, at: CGPoint(x: 300, y: 260), on: j.canvas)
        await j.until("two cards") { j.canvas.state.cardNotes.count == 2 }
        #expect(Set(j.canvas.state.cardNotes) == [Self.plan.uuidString, Self.press.uuidString], "not the board itself")
        let first = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card' && e.customData.pintoNote === '\(Self.plan.uuidString)'")
        #expect(abs(first.x - 300) < 2, "the first card is centred where it was dropped: \(first)")
        let second = try await Self.clientPoint(j, of: "e.customData && e.customData.pintoCard === 'card' && e.customData.pintoNote === '\(Self.press.uuidString)'")
        #expect(second.x > first.x + 200, "the next beside it")
        // A folder isn't a note.
        CanvasNoteDrop.place([provider(PaneDragItem(kind: .folder, id: UUID()))], at: .zero, on: j.canvas)
        await j.until("said") { j.canvas.notice == "Only notes and pictures can go on a whiteboard" }
    }

    /// The picker's choice goes in the middle of the view, clear of what's drawn there.
    @Test func aCardFromThePickerGoesWhereNothingIsDrawn() async throws {
        let j = try await Joined(scene: CanvasTests.scene([["type": "rectangle", "id": "mid", "x": -100, "y": -60, "width": 200, "height": 120]]))
        defer { j.close() }
        let library = Library()
        library.notes = [Self.plan.uuidString: Self.planCard]
        library.join(j.canvas, board: UUID())
        try await j.ready()
        _ = try await j.js("(() => { const api = amber._canvas.api, s = api.getAppState(); api.updateScene({ appState: { scrollX: s.width / 2, scrollY: s.height / 2, zoom: { value: 1 } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(100))
        j.canvas.addCards([Self.plan])
        await j.until("on") { j.canvas.state.card != nil }
        let overlap = try await j.js("""
        (() => { const els = amber._canvas.api.getSceneElements(), f = els.find((e) => e.customData && e.customData.pintoCard === 'card'), m = els.find((e) => e.id === 'mid');
          return f.x < m.x + m.width && f.x + f.width > m.x && f.y < m.y + m.height && f.y + f.height > m.y; })()
        """) as? Bool
        #expect(overlap == false, "not on top of the box")
        let bounds = try #require(j.canvas.state.bounds)
        #expect(bounds.minX >= 0 && bounds.maxX <= 900 && bounds.minY >= 0 && bounds.maxY <= 600, "in view: \(bounds)")
    }
    #endif

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

    // MARK: The library (whiteboard council, round 5)

    /// Two items of "Data flow" (version 2, wmartzh/data-flow) as libraries.excalidraw.com serves
    /// them, old field names (strokeSharpness) and all.
    static let dataFlowLibrary = ##"{"type":"excalidrawlib","version":2,"source":"https://app.excalidraw.com","libraryItems":[{"status":"published","elements":[{"type":"rectangle","version":108,"versionNonce":848887945,"isDeleted":false,"id":"XkAdaH1IwXkCjxQatp0pT","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1483.89453125,"y":-29.243408203125,"strokeColor":"#000000","backgroundColor":"#fff","width":257,"height":101.93063354492188,"seed":841639,"groupIds":[],"strokeSharpness":"round","boundElements":[{"type":"text","id":"teIXOJCl7lqVSBxz13SLo"},{"id":"ws0W9X53qIvWrct3Bm-gk","type":"arrow"}],"updated":1664316938680,"link":null,"locked":false},{"type":"text","version":77,"versionNonce":534505607,"isDeleted":false,"id":"teIXOJCl7lqVSBxz13SLo","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1488.89453125,"y":10.221908569335938,"strokeColor":"#000000","backgroundColor":"#fff","width":247,"height":23,"seed":1486156295,"groupIds":[],"strokeSharpness":"round","boundElements":[],"updated":1664316938680,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"process","baseline":17,"textAlign":"center","verticalAlign":"middle","containerId":"XkAdaH1IwXkCjxQatp0pT","originalText":"process"}],"id":"-HAghVFVWMglgZs-d97P4","created":1664316941555,"name":"Process"},{"status":"published","elements":[{"type":"rectangle","version":308,"versionNonce":1700457967,"isDeleted":false,"id":"bKHk3GOZWrcCSzOwuJq83","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1621.8062670196573,"y":878.6495665282432,"strokeColor":"#000000","backgroundColor":"transparent","width":224,"height":51.660491943359375,"seed":1154761121,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[{"id":"T25UGS-Sj4gZjQVfuaCop","type":"text"},{"id":"T25UGS-Sj4gZjQVfuaCop","type":"text"},{"type":"text","id":"T25UGS-Sj4gZjQVfuaCop"}],"updated":1664303280978,"link":null,"locked":false},{"type":"line","version":443,"versionNonce":2125010831,"isDeleted":false,"id":"wDekN_ZvIVKa0IN5GNmoW","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1671.1207482460186,"y":877.8450575839769,"strokeColor":"#000000","backgroundColor":"transparent","width":0.7604041975725977,"height":51.55870056152344,"seed":1388504303,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[],"updated":1664303280020,"link":null,"locked":false,"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[0.5249305647600977,25.85967849675626],[-0.2354736328125,51.55870056152344]]},{"type":"text","version":208,"versionNonce":1686531201,"isDeleted":false,"id":"T25UGS-Sj4gZjQVfuaCop","fillStyle":"hachure","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1626.8062670196573,"y":891.9798124999229,"strokeColor":"#000000","backgroundColor":"transparent","width":214,"height":25,"seed":1526556033,"groupIds":["-LyObzXSQqgNQicckZCSO","FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"round","boundElements":[],"updated":1664303280978,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"Store","baseline":18,"textAlign":"center","verticalAlign":"middle","containerId":"bKHk3GOZWrcCSzOwuJq83","originalText":"Store"},{"type":"text","version":102,"versionNonce":336107279,"isDeleted":false,"id":"SEtPWSeAsRJsNU3OADEIZ","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":1635.826436755428,"y":895.3547373976627,"strokeColor":"#000000","backgroundColor":"#fff","width":22,"height":25,"seed":87136207,"groupIds":["FmhoDIyh_U8guPPxK6ys_"],"strokeSharpness":"sharp","boundElements":[],"updated":1664303279242,"link":null,"locked":false,"fontSize":20,"fontFamily":1,"text":"D1","baseline":18,"textAlign":"left","verticalAlign":"top","containerId":null,"originalText":"D1"}],"id":"1PU7FVRjr4UDcNG3OesgJ","created":1664303296127,"name":"Data storage"}]}"##

    /// Two items of "Basic shapes" (version 1, pgilfernandez/basic-shapes), as the site serves them.
    static let basicShapesLibrary = ##"{"type":"excalidrawlib","version":1,"source":"https://excalidraw.com","library":[[{"type":"line","version":896,"versionNonce":235201635,"isDeleted":false,"id":"skg7gqUlRzEIoOiugXifs","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":-595.9369869225809,"y":-57.47827374377303,"strokeColor":"#000000","backgroundColor":"#ced4da","width":154.11430603829422,"height":154.8767364889196,"seed":1126339617,"groupIds":[],"strokeSharpness":"sharp","boundElementIds":[],"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[154.0813522663615,154.6580432751842],[-0.032953771932716,154.8767364889196],[0,0]]}],[{"type":"line","version":906,"versionNonce":1980765645,"isDeleted":false,"id":"5XJBeMDTZE77o24DN2uK_","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":-323.49494066630416,"y":-53.87499999999951,"strokeColor":"#000000","backgroundColor":"#ced4da","width":176.0048133026142,"height":153.16773078464527,"seed":1932509089,"groupIds":[],"strokeSharpness":"sharp","boundElementIds":[],"startBinding":null,"endBinding":null,"lastCommittedPoint":null,"startArrowhead":null,"endArrowhead":null,"points":[[0,0],[85.76001280730273,153.16773078464527],[-90.24480049531147,151.29227411511434],[0,0]]}]]}"##

    /// A library of the test's own, swapped in for the app's while it runs.
    static func withLibrary(_ folder: URL? = nil, _ body: (CanvasLibrary) async throws -> Void) async rethrows {
        let kept = CanvasLibrary.shared
        let lib = CanvasLibrary(folder: folder)
        CanvasLibrary.shared = lib
        defer { CanvasLibrary.shared = kept }
        try await body(lib)
    }

    /// What a library item added to a board did: the new elements' boxes (in the scene), whether
    /// any of them covers what was there before, whether they're all in view, and what's selected.
    static func added(_ j: Joined, before: [String]) async throws -> (boxes: [[Double]], covers: Bool, inView: Bool, selected: Int, fresh: Int, centre: CGPoint) {
        let json = try #require(try await j.js("""
        (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value, old = new Set(\(String(decoding: try JSONSerialization.data(withJSONObject: before), as: UTF8.self)));
          const box = (e) => { const xs = [e.x, e.x + e.width], ys = [e.y, e.y + e.height]; return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
          const all = api.getSceneElements(), fresh = all.filter((e) => !old.has(e.id)), was = all.filter((e) => old.has(e.id));
          const boxes = fresh.map(box);
          const covers = boxes.some(([a, b, c, d]) => was.map(box).some(([x1, y1, x2, y2]) => a < x2 && c > x1 && b < y2 && d > y1));
          const inView = boxes.every(([a, b, c, d]) => (a + s.scrollX) * z >= 0 && (b + s.scrollY) * z >= 0 && (c + s.scrollX) * z <= s.width && (d + s.scrollY) * z <= s.height);
          const x1 = Math.min(...boxes.map((b) => b[0])), y1 = Math.min(...boxes.map((b) => b[1])), x2 = Math.max(...boxes.map((b) => b[2])), y2 = Math.max(...boxes.map((b) => b[3]));
          const centre = [((x1 + x2) / 2 + s.scrollX) * z, ((y1 + y2) / 2 + s.scrollY) * z];
          const selected = fresh.filter((e) => s.selectedElementIds[e.id]).length;
          return JSON.stringify({ boxes, covers, inView, selected, fresh: fresh.length, centre }); })()
        """) as? String)
        let r = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        let c = r["centre"] as? [Double] ?? [0, 0]
        return (r["boxes"] as? [[Double]] ?? [], r["covers"] as? Bool ?? true, r["inView"] as? Bool ?? false, r["selected"] as? Int ?? 0, r["fresh"] as? Int ?? 0, CGPoint(x: c[0], y: c[1]))
    }

    static func ids(_ j: Joined) async throws -> [String] {
        let json = try #require(try await j.js("JSON.stringify(amber._canvas.api.getSceneElements().map((e) => e.id))") as? String)
        return try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String])
    }

    /// Save to Library keeps what's selected as one item: the shapes, their words, the arrow
    /// between them still joined, and joins to what was left behind cut. The board draws its
    /// picture. It's kept in the app, not in the board's file.
    @Test func aSelectionIsSavedToTheLibraryWithItsWordsAndAPicture() async throws {
        try await Self.withLibrary { lib in
            let j = try await Joined(scene: Self.flowchart)
            defer { j.close() }
            try await j.ready()
            #expect(await j.canvas.saveSelectionToLibrary(lib) == nil, "nothing selected: nothing saved")
            #expect(lib.items.isEmpty && j.canvas.notice?.hasPrefix("Select something") == true, "and it says why: \(j.canvas.notice ?? "")")
            // Draft and Ready?, and the arrow between them; the arrow from Idea into Draft stays behind.
            _ = try await j.js("(() => { const api = amber._canvas.api, ids = { draft: true, ready: true }; for (const e of api.getSceneElements()) if (e.type === 'arrow' && e.startBinding && e.startBinding.elementId === 'draft' && e.endBinding && e.endBinding.elementId === 'ready') ids[e.id] = true; api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
            await j.until("three selected") { j.canvas.state.selection.count == 3 }
            let item = try #require(await j.canvas.saveSelectionToLibrary(lib))
            #expect(lib.items.map(\.id) == [item.id])
            #expect(j.canvas.notice == CanvasController.savedTitle)
            let els = item.elements
            #expect(els.compactMap { $0["type"] as? String }.sorted() == ["arrow", "diamond", "rectangle", "text", "text"], "the box, the diamond, the arrow and their words")
            #expect(item.name == "Draft \u{00B7} Ready?", "named by its words: \(item.name ?? "nil")")
            let ids = Set(els.compactMap { $0["id"] as? String })
            let draft = try #require(els.first { $0["id"] as? String == "draft" })
            let joined = (draft["boundElements"] as? [[String: Any]] ?? []).compactMap { $0["id"] as? String }
            #expect(!joined.isEmpty && joined.allSatisfy(ids.contains), "only joins to what's in the item: \(joined)")
            let arrow = try #require(els.first { $0["type"] as? String == "arrow" })
            #expect((arrow["startBinding"] as? [String: Any])?["elementId"] as? String == "draft" && (arrow["endBinding"] as? [String: Any])?["elementId"] as? String == "ready")
            let image = try #require(lib.thumbnails[item.id], "its picture, drawn by the board")
            #expect(max(image.size.width, image.size.height) >= 200, "\(image.size)")
            let saved = String(decoding: try JSONSerialization.data(withJSONObject: j.rig.doc), as: UTF8.self)
            #expect(!saved.contains("libraryItems") && !saved.contains("excalidrawlib"), "nothing of it in the board's file")
        }
    }

    /// Save to Library is in the board's right-click menu and the selection bar's More menu.
    @Test func saveToLibraryIsInTheRightClickMenuAndTheMoreMenu() async throws {
        try await Self.withLibrary { lib in
            let j = try await Joined(scene: CanvasTests.scene(Self.box))
            defer { j.close() }
            try await j.ready()
            let web = try #require(j.web as? NotePageWebView)
            let idle = try #require(web.canvasMenu().items.first { $0.title == CanvasLibraryPopover.saveTitle })
            #expect(!idle.isEnabled, "nothing selected: nothing to save")
            _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: { box: true } } }); return 1; })()")
            await j.until("the box selected") { j.canvas.state.selection == ["rectangle"] }
            let save = try #require(web.canvasMenu().items.first { $0.title == CanvasLibraryPopover.saveTitle })
            #expect(save.isEnabled)
            _ = save.target?.perform(save.action, with: save)
            await j.until("saved from the right-click menu") { lib.items.count == 1 }
            // The selection bar's More menu (its items, as the menu shows them).
            let ax = OffscreenAX(VStack { CanvasMoreItems(canvas: j.canvas) }.padding(10), size: CGSize(width: 320, height: 420))
            defer { ax.close() }
            await ax.settle()
            let more = try #require(ax.find("canvas.saveToLibrary"), "\(ax.ids())")
            #expect(more.text.contains(CanvasLibraryPopover.saveTitle), "\(more.text)")
            more.press()
            await j.until("saved from the More menu") { lib.items.count == 2 }
            #expect(lib.items.allSatisfy { $0.elements.first?["type"] as? String == "rectangle" })
        }
    }

    /// A click in the library puts the item in the middle of the view, in a free spot, never on
    /// the drawing, selected, as one step Undo takes back; again, and the copy goes beside it.
    @Test func aLibraryItemGoesInAFreeSpotInTheMiddleOfTheViewSelected() async throws {
        try await Self.withLibrary { lib in
            let item = try #require(lib.add(elements: [
                ["type": "rectangle", "id": "srv", "x": 3000, "y": 3000, "width": 160, "height": 80, "backgroundColor": "#a5d8ff", "fillStyle": "solid",
                 "seed": 1, "version": 1, "versionNonce": 1, "boundElements": [["type": "text", "id": "srv-t"]]],
                ["type": "text", "id": "srv-t", "x": 3050, "y": 3028, "width": 60, "height": 25, "text": "Server", "originalText": "Server", "containerId": "srv",
                 "fontSize": 20, "fontFamily": 5, "textAlign": "center", "verticalAlign": "middle", "seed": 2, "version": 1, "versionNonce": 2],
            ]))
            // An empty board: right in the middle.
            do {
                let j = try await Joined(scene: CanvasTests.scene([]))
                defer { j.close() }
                try await j.ready()
                j.canvas.insert(item)
                await j.until("it's on the board") { !j.canvas.state.empty }
                let r = try await Self.added(j, before: [])
                #expect(r.fresh == 2 && abs(r.centre.x - 450) < 3 && abs(r.centre.y - 300) < 3, "in the middle of a 900 by 600 view: \(r.centre)")
                let text = try await j.js("amber._canvas.api.getSceneElements().find((e) => e.type === 'text').originalText") as? String
                #expect(text == "Server", "its words came along")
                let ids = try await Self.ids(j)
                #expect(!ids.contains("srv"), "new ids, so it can go on as often as you like")
            }
            // A drawing across the middle: beside it, in view, selected.
            let j = try await Joined(scene: Self.flowchart)
            defer { j.close() }
            try await j.ready()
            _ = try await j.js("(() => { const api = amber._canvas.api; api.scrollToContent(api.getSceneElements(), { fitToContent: true, animate: false }); return 1; })()")
            try await Task.sleep(for: .milliseconds(200))
            let before = try await Self.ids(j)
            j.canvas.insert(item)
            await j.until("it's selected") { j.canvas.state.selection == ["rectangle"] }
            let first = try await Self.added(j, before: before)
            #expect(first.fresh == 2 && !first.covers, "never on the drawing: \(first.boxes)")
            #expect(first.inView && first.selected == 1, "in view and selected: \(first)")
            #expect(j.canvas.state.showsSelectionBar, "the selection bar shows for it")
            let after = try await Self.ids(j)
            j.canvas.insert(item)
            for _ in 0..<100 where (try await Self.ids(j)).count < after.count + 2 { try await Task.sleep(for: .milliseconds(30)) }
            let second = try await Self.added(j, before: after)
            #expect(!second.covers, "the second copy isn't on the first: \(second.boxes)")
            // One step each for Undo.
            j.canvas.run(.undo)
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.run(.undo)
            for _ in 0..<100 where try await Self.ids(j) != before { try await Task.sleep(for: .milliseconds(30)) }
            #expect(try await Self.ids(j) == before, "two Undos take both back")
        }
    }

    /// A tile dragged from the library onto the board goes where it's dropped, selected.
    @Test func aLibraryItemDroppedOnTheBoardGoesWhereItsDropped() async throws {
        try await Self.withLibrary { lib in
            _ = try #require(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)))
            let item = try #require(lib.items.first { $0.name == "Process" })
            let j = try await Joined(scene: CanvasTests.scene(Self.box))
            defer { j.close() }
            try await j.ready()
            let before = try await Self.ids(j)
            await CanvasImageDrop.place([CanvasLibraryDrag.provider(item)], at: CGPoint(x: 640, y: 420), on: j.canvas, library: lib).value
            await j.until("it's selected") { j.canvas.state.selection == ["rectangle"] }
            let r = try await Self.added(j, before: before)
            #expect(r.fresh == 2 && abs(r.centre.x - 640) < 3 && abs(r.centre.y - 420) < 3, "centred where it was dropped: \(r.centre)")
            #expect(r.selected == 1)
            // Something else of this type that isn't in the library: nothing goes on.
            let stranger = NSItemProvider()
            stranger.registerDataRepresentation(forTypeIdentifier: CanvasLibraryDrag.type.identifier, visibility: .ownProcess) { done in done(Data("gone".utf8), nil); return nil }
            #expect(await CanvasLibraryDrag.item(from: [stranger], in: lib) == nil)
        }
    }

    /// Excalidraw libraries come in from their files, version 1 and 2, as libraries.excalidraw.com
    /// serves them; the same library twice adds nothing; a file that isn't one is refused. An
    /// imported item goes on a board with its words, and the board draws its picture.
    @Test func excalidrawLibrariesImportVersion1And2() async throws {
        let v2 = try #require(CanvasLibraryFile.items(from: Data(Self.dataFlowLibrary.utf8)))
        #expect(v2.map(\.name) == ["Process", "Data storage"])
        #expect(v2.map { $0.elements.count } == [2, 4])
        let v1 = try #require(CanvasLibraryFile.items(from: Data(Self.basicShapesLibrary.utf8)))
        #expect(v1.count == 2 && v1.allSatisfy { $0.elements.first?["type"] as? String == "line" })
        #expect(CanvasLibraryFile.items(from: Data(#"{"type":"excalidraw","elements":[]}"#.utf8)) == nil, "a board, not a library")
        #expect(CanvasLibraryFile.items(from: Data("not json".utf8)) == nil)
        try await Self.withLibrary { lib in
            #expect(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)) == .init(added: 2, already: 0))
            #expect(lib.importLibrary(Data(Self.dataFlowLibrary.utf8)) == .init(added: 0, already: 2), "the same library twice adds nothing")
            // From files, as Import Library… takes them; and one that isn't a library.
            let dir = FileManager.default.temporaryDirectory.appending(path: "library-import-\(UUID().uuidString)")
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: dir) }
            let shapes = dir.appending(path: "basic-shapes.excalidrawlib"), board = dir.appending(path: "Board.excalidraw")
            try Data(Self.basicShapesLibrary.utf8).write(to: shapes)
            try Data(#"{"type":"excalidraw","elements":[]}"#.utf8).write(to: board)
            let report = CanvasLibraryImport.add([shapes, board], to: lib)
            #expect(report == .init(added: 2, already: 0, refused: ["Board.excalidraw"]))
            #expect(CanvasLibraryImport.said(report) == "Added 2 items to the library")
            #expect(lib.items.count == 4 && lib.items.prefix(2).allSatisfy { $0.name == nil }, "newest first")
            // Onto a board: its words come along, and the board draws it.
            let j = try await Joined(scene: CanvasTests.scene([]))
            defer { j.close() }
            try await j.ready()
            let store = try #require(lib.items.first { $0.name == "Data storage" })
            j.canvas.insert(store)
            await j.until("it's on the board") { !j.canvas.state.empty }
            let words = try await j.js("amber._canvas.api.getSceneElements().filter((e) => e.type === 'text').map((e) => e.originalText).sort().join('|')") as? String
            #expect(words == "D1|Store", "\(words ?? "")")
            await j.canvas.drawThumbnails(lib)
            #expect(lib.items.allSatisfy { lib.thumbnails[$0.id] != nil }, "every item has its picture")
        }
    }

    /// An Excalidraw library file dropped on a board goes into the library, which opens on it.
    @Test func aLibraryFileDroppedOnABoardGoesIntoTheLibrary() async throws {
        try await Self.withLibrary { lib in
            let dir = FileManager.default.temporaryDirectory.appending(path: "library-drop-\(UUID().uuidString)")
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: dir) }
            let file = dir.appending(path: "data-flow.excalidrawlib")
            try Data(Self.dataFlowLibrary.utf8).write(to: file)
            let canvas = CanvasController()
            await CanvasImageDrop.place([NSItemProvider(object: file as NSURL)], at: .zero, on: canvas, library: lib).value
            #expect(lib.items.map(\.name) == ["Process", "Data storage"])
            #expect(canvas.showingLibrary && canvas.notice == "Added 2 items to the library")
            #expect(canvas.sent.isEmpty, "nothing goes on the board itself")
        }
    }

    /// A picture in a saved item comes with it onto another board.
    @Test func aPictureInALibraryItemComesWithIt() async throws {
        try await Self.withLibrary { lib in
            let png = Self.png(width: 40, height: 30, clear: false)
            let url = "data:image/png;base64," + png.base64EncodedString()
            let j = try await Joined(scene: CanvasTests.scene([]))
            defer { j.close() }
            try await j.ready()
            _ = try await j.js("(() => { const api = amber._canvas.api; api.addFiles([{ id: 'pic', dataURL: '\(url)', mimeType: 'image/png', created: 1 }]); api.updateScene({ elements: [{ type: 'image', id: 'img', fileId: 'pic', x: 0, y: 0, width: 40, height: 30, angle: 0, strokeColor: 'transparent', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: 1, link: null, locked: false, status: 'saved', scale: [1, 1] }], appState: { selectedElementIds: { img: true } } }); return 1; })()")
            await j.until("the picture selected") { j.canvas.state.selection == ["image"] }
            let item = try #require(await j.canvas.saveSelectionToLibrary(lib))
            #expect((item.files["pic"] as? [String: Any])?["dataURL"] as? String == url, "its picture is kept with it")
            let k = try await Joined(scene: CanvasTests.scene([]))
            defer { k.close() }
            try await k.ready()
            k.canvas.insert(item)
            await k.until("it's on the other board") { k.canvas.state.selection == ["image"] }
            #expect(try await k.js("!!amber._canvas.api.getFiles().pic") as? Bool == true, "and its picture with it")
        }
    }

    /// The library is kept in the app (its folder in Application Support), for every board, and
    /// comes back after a relaunch with its pictures; a removed item stays gone. Tests never use
    /// the app's own folder. The file is a version 2 library that Excalidraw imports.
    @Test func theLibraryIsKeptInTheAppAndComesBackAfterARelaunch() throws {
        #expect(CanvasLibrary.shared.folder == nil, "tests keep the library in memory, never in your folder")
        #expect(CanvasLibrary.defaultFolder.path.hasSuffix("/\(AppIdentity.dataFolder)/Whiteboard Library"), "\(CanvasLibrary.defaultFolder.path)")
        let dir = FileManager.default.temporaryDirectory.appending(path: "library-keep-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let lib = CanvasLibrary(folder: dir)
        let mine = try #require(lib.add(elements: [["type": "ellipse", "id": "e", "x": 0, "y": 0, "width": 80, "height": 50, "seed": 1, "version": 1, "versionNonce": 1]]))
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
        lib.setThumbnail(Self.png(width: 64, height: 40, clear: true), for: mine.id)
        lib.flush()
        let again = CanvasLibrary(folder: dir)
        #expect(again.items.map(\.id) == lib.items.map(\.id) && again.items.map(\.name) == lib.items.map(\.name), "the same items, in the same order")
        #expect(NSArray(array: again.items.map(\.elements)).isEqual(to: lib.items.map(\.elements)), "with their elements")
        #expect(again.thumbnails[mine.id] != nil, "with their pictures")
        let file = try Data(contentsOf: dir.appending(path: "library.excalidrawlib"))
        let json = try #require(try JSONSerialization.jsonObject(with: file) as? [String: Any])
        #expect(json["type"] as? String == "excalidrawlib" && json["version"] as? Int == 2)
        #expect(CanvasLibraryFile.items(from: file)?.count == 3, "a library file anyone can import")
        again.remove(mine.id)
        again.flush()
        let third = CanvasLibrary(folder: dir)
        #expect(!third.items.contains { $0.id == mine.id } && third.items.count == 2, "removed stays removed")
        #expect(!FileManager.default.fileExists(atPath: dir.appending(path: "thumbnails/\(mine.id).png").path), "and its picture goes")
    }

    /// The library popover: a tile for each item, a click adds it and closes the popover;
    /// removed, it's gone; empty, one plain line and Import Library….
    @Test func theLibraryPopoverShowsItsItemsAndAddsOneOnAClick() async throws {
        let lib = CanvasLibrary(folder: nil)
        _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
        let mine = try #require(lib.add(elements: [["type": "diamond", "id": "d", "x": 0, "y": 0, "width": 120, "height": 80, "seed": 1, "version": 1, "versionNonce": 1]]))
        let canvas = CanvasController()
        canvas.showingLibrary = true
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: lib), size: CGSize(width: CanvasLibraryPopover.width, height: 360))
        defer { ax.close() }
        await ax.settle()
        #expect(ax.ids().filter { $0 == "canvas.library.item" }.count == 3, "\(ax.ids())")
        #expect(ax.find("canvas.library.import")?.text.contains("Import Library") == true)
        let first = try #require(ax.find("canvas.library.item"))
        first.press()
        await ax.settle(100)
        #expect(canvas.sent.last == .libraryInsert(mine, at: nil), "the newest first, added in the middle of the view")
        #expect(!canvas.showingLibrary, "the popover closes on it")
        lib.remove(mine.id)
        await ax.settle()
        #expect(ax.ids().filter { $0 == "canvas.library.item" }.count == 2, "removed: gone from the grid")
        let empty = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: CanvasLibrary(folder: nil)), size: CGSize(width: CanvasLibraryPopover.width, height: 160))
        defer { empty.close() }
        await empty.settle()
        #expect(empty.find("canvas.library.empty")?.text == CanvasLibraryPopover.emptyLine)
        #expect(empty.find("canvas.library.import") != nil && empty.find("canvas.library.item") == nil)
    }

    /// In dark mode a tile shows the item in the colours the dark canvas shows it in (the board
    /// draws it light and turns it): the same as a swatch in the style bar, see-through kept.
    @Test func aLibraryPictureShowsInTheDarkCanvasColours() throws {
        let w = 4, h = 2
        let ctx = try #require(CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                         bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        ctx.setFillColor(CGColor(srgbRed: 1, green: 0xec / 255.0, blue: 0x99 / 255.0, alpha: 1))  // the sticky yellow
        ctx.fill(CGRect(x: 0, y: 0, width: 2, height: h))
        let drawn = try #require(ctx.makeImage())
        let png = try #require(NSBitmapImageRep(cgImage: drawn).representation(using: .png, properties: [:]))
        let dark = try #require(CanvasLibrary.darkened(png)?.cgImage(forProposedRect: nil, context: nil, hints: nil))
        let rep = NSBitmapImageRep(cgImage: dark)
        let want = try #require(CanvasStyle.rgb("#ffec99"))
        let (r, g, b) = CanvasStyle.throughDark(want.0, want.1, want.2)
        // The bytes as stored (sRGB, as the board drew them), not converted on the way out.
        var yellow = [Int](repeating: 0, count: 4), clear = [Int](repeating: 0, count: 4)
        rep.getPixel(&yellow, atX: 0, y: 0)
        rep.getPixel(&clear, atX: 3, y: 0)
        let expected = [r, g, b].map { Int(($0 * 255).rounded()) }
        #expect(zip(yellow.prefix(3), expected).allSatisfy { abs($0 - $1) <= 2 } && yellow[3] == 255, "as the dark canvas shows #ffec99: \(yellow) for \(expected)")
        #expect(clear[3] == 0, "see-through stays see-through: \(clear)")
        // The library keeps both, and drops both with the item.
        let lib = CanvasLibrary(folder: nil)
        let item = try #require(lib.add(elements: [["type": "rectangle", "id": "r", "x": 0, "y": 0, "width": 10, "height": 10]]))
        lib.setThumbnail(png, for: item.id)
        #expect(lib.thumbnails[item.id] != nil && lib.darkThumbnails[item.id] != nil)
        lib.remove(item.id)
        #expect(lib.thumbnails[item.id] == nil && lib.darkThumbnails[item.id] == nil)
    }

    /// The Library button is in the toolbar (Image moved into the Shapes menu to make room); in a
    /// narrow window it's in More Tools.
    @Test func theLibraryIsInTheToolbarAndInMoreToolsWhenNarrow() async throws {
        let c = try Self.canvasLibrary()
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1400, height: 900))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            var labels = try MacWindowChromeTests.items(w).map(\.label)
            #expect(labels.contains(CanvasLibraryPopover.title) && !labels.contains(CanvasToolbarTools.imageTitle), "Library in the toolbar, Image in the Shapes menu: \(labels)")
            w.setContentSize(CGSize(width: 1000, height: 700))
            await MacWindowChromeTests.settle(w, 20)
            labels = try MacWindowChromeTests.items(w).map(\.label)
            #expect(!labels.contains(CanvasLibraryPopover.title) && labels.contains("More Tools"), "narrow: in More Tools: \(labels)")
        }
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

    /// The templates: each a whole drawing whose arrows join shapes in it, with a picture that
    /// exists; they show only while nothing is drawn and no drawing tool is picked.
    @Test func theWhiteboardTemplatesAreWhole() {
        for t in WhiteboardTemplate.allCases {
            let ids = t.elements.compactMap { $0["id"] as? String }
            #expect(Set(ids).count == ids.count, "\(t): ids are unique")
            for e in t.elements where ["arrow", "line"].contains(e["type"] as? String) {
                for end in ["start", "end"] {
                    let id = (e[end] as? [String: Any])?["id"] as? String
                    #expect(id.map(ids.contains) == true, "\(t): an arrow's \(end) is a shape in it")
                }
            }
            #expect(NSImage(systemSymbolName: t.symbol, accessibilityDescription: nil) != nil, "\(t.symbol) exists")
            #expect(CanvasCommand.insert(t).payload["op"] as? String == "insert")
            // Every one has a title and a line on how to use it, and is small enough to open near
            // full size (round 1 of the whiteboard council: some had titles, some opened at 60%).
            let texts = t.elements.filter { $0["type"] as? String == "text" }.compactMap { $0["text"] as? String }
            #expect(texts.first == t.title, "\(t): its title first: \(texts)")
            // Named by you, it carries your board's name; the default name leaves the template's.
            let named = t.elements(titled: "Product launch").compactMap { $0["text"] as? String }
            #expect(named.first == "Product launch" && t.elements(titled: CanvasNote.title).compactMap { $0["text"] as? String }.first == t.title)
            #expect(!texts.contains { $0.contains("\u{2610}") }, "\(t): no box character that looks tickable and isn't")
            if t == .mindMap {
                // Branches are joined arrows with no heads, ending at each box's edge (round 2, 03).
                let branches = t.elements.filter { $0["type"] as? String == "arrow" }
                #expect(!branches.isEmpty && branches.allSatisfy { $0["endArrowhead"] is NSNull })
                let boxes = Dictionary(uniqueKeysWithValues: t.elements.compactMap { e -> (String, CGRect)? in
                    guard let id = e["id"] as? String, let x = e["x"] as? Double, let y = e["y"] as? Double, let w = e["width"] as? Double, let h = e["height"] as? Double else { return nil }
                    return (id, CGRect(x: x, y: y, width: w, height: h))
                })
                for b in branches {
                    let to = try? #require(((b["end"] as? [String: Any])?["id"] as? String).flatMap { boxes[$0] })
                    let pts = b["points"] as? [[Double]] ?? []
                    let end = CGPoint(x: (b["x"] as? Double ?? 0) + (pts.last?[0] ?? 0), y: (b["y"] as? Double ?? 0) + (pts.last?[1] ?? 0))
                    #expect(to.map { !$0.insetBy(dx: 1, dy: 1).contains(end) } == true, "a branch stops at its box's edge: \(end) \(String(describing: to))")
                }
            }
            let frames = t.outline.map(\.frame)
            let width = (frames.map(\.maxX).max() ?? 0) - (frames.map(\.minX).min() ?? 0)
            #expect(width <= 760, "\(t) is \(Int(width)) wide")
        }
        var s = CanvasState()
        #expect(!CanvasStart.shows(s), "not before the page has said it's empty")
        s.empty = true
        #expect(CanvasStart.shows(s))
        s.tool = .freedraw
        #expect(!CanvasStart.shows(s), "a drawing tool picked: you're drawing")
        s.tool = .selection; s.busy = true
        #expect(!CanvasStart.shows(s))
    }

    /// An empty whiteboard's last line asks your AI to draw (whiteboard council, round 1): the
    /// questions are about drawing on this board, by its name, and your own line says "draw this".
    @Test func anEmptyWhiteboardAsksYourAIToDraw() {
        let board = AskAI.Subject.whiteboard(.init(title: "Launch plan", folder: "Work"))
        let qs = AskAI.questions(board)
        #expect(qs.count == 3)
        #expect(qs.allSatisfy { $0.prompt.hasPrefix("In Pinto Notes, open my whiteboard \u{201C}Launch plan\u{201D} in \u{201C}Work\u{201D} (an Excalidraw scene)") }, "\(qs.map(\.prompt))")
        #expect(AskAI.own("a timeline of the launch", board) == "In Pinto Notes, open my whiteboard \u{201C}Launch plan\u{201D} in \u{201C}Work\u{201D} (an Excalidraw scene) and draw this on it: a timeline of the launch")
        #expect(AskAI.ownPlaceholder(board) == "Describe what to draw")
        #expect(AskAI.ownPlaceholder(.note(.init(title: "x"))) == AskAI.ownPlaceholder)
        #expect(board.menuName == "This Whiteboard")
        #expect(CanvasStart.askTitle(.init(ai: "ChatGPT")) == "Ask ChatGPT to draw it\u{2026}")
    }

    /// A board's row in the list shows its words and a small picture of it, and search finds its
    /// words (whiteboard council, round 1: "No additional text" under a whole flowchart).
    @Test func aBoardsWordsShowInTheListAndSearchFindsThem() throws {
        let sketch = CanvasSketch(elements: [
            ["type": "rectangle", "x": 0, "y": 0, "width": 100, "height": 50, "label": ["text": "Start"], "backgroundColor": "#b2f2bb"],
            ["type": "text", "x": 0, "y": 80, "text": "Did it\nwork?", "originalText": "Did it work?"],
            ["type": "text", "x": 0, "y": 120, "text": "Start"],
            ["type": "text", "x": 0, "y": 160, "text": "Gone", "isDeleted": true],
            ["type": "arrow", "x": 50, "y": 50, "width": 0, "height": 30, "points": [[0, 0], [0, 30]]],
            ["type": "freedraw", "x": 10, "y": 10, "width": 20, "height": 5, "points": [[0, 0], [10, 5], [20, 0]]],
        ])
        #expect(sketch.preview == "Start \u{00B7} Did it work?", "each word once, in the order drawn, none deleted")
        #expect(sketch.shapes.map(\.kind) == ["rectangle", "arrow", "freedraw"])
        #expect(sketch.shapes[0].fill == "#b2f2bb" && sketch.shapes[2].points.count == 3)
        #expect(CanvasSketch(elements: []).preview == nil)
        #expect(CanvasSketch(elements: [["type": "freedraw", "x": 0, "y": 0, "width": 9, "height": 9]]).preview == "Drawing")
        #expect(CanvasSketch(elements: WhiteboardTemplate.kanban.elements).preview?.hasPrefix("To do \u{00B7} Write the brief") == true, "the title and how-to line left out: \(CanvasSketch(elements: WhiteboardTemplate.kanban.elements).preview ?? "")")
        #expect(NoteRow.boardPreview(nil) == "Empty whiteboard" && NoteRow.boardPreview(CanvasSketch(elements: [])) == "Empty whiteboard")

        let c = try Self.canvasLibrary()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": "Quarterly roadmap"]])], "collections": [String: Any]()])
        #expect(CanvasSketch.of(note.id)?.preview == "Quarterly roadmap")
        #expect(CanvasSketch.notes(holding: "roadmap").contains(note.id), "search finds a word on the board")
        #expect(!CanvasSketch.notes(holding: "zebra").contains(note.id))
        // A change to the board is read again.
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": "Hiring plan"]])], "collections": [String: Any]()])
        #expect(CanvasSketch.of(note.id)?.preview == "Hiring plan")
    }

    /// A whiteboard's row follows the board: the list watches one signal that moves a moment
    /// after a burst of changes, not every stroke (whiteboard council, round 2, 12-ai-drew).
    @Test func aBoardsRowIsToldWhenTheBoardChanges() async throws {
        let store = NotePageDataStore(file: nil)
        let id = UUID()
        let scene = { (t: String) -> NotePageData.Doc in ["values": ["scene": CanvasTests.scene([["type": "text", "x": 0, "y": 0, "text": t]])], "collections": [String: Any]()] }
        final class Told: @unchecked Sendable { var n = 0 }
        let t = Told()
        var told: Int { t.n }
        let watch = { withObservationTracking { _ = NoteRow.sketch(id, in: store) } onChange: { t.n += 1 } }
        watch()
        let start = store.listRevision
        for t in ["A", "AB", "ABC"] { store.set(id, scene(t)) }
        #expect(store.listRevision == start, "not on every stroke")
        for _ in 0..<40 where told == 0 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(store.listRevision == start + 1 && told == 1, "once, for the burst")
        #expect(NoteRow.sketch(id, in: store)?.preview == "ABC")
        store.pushed(id, try #require(store.peek(id)))
        watch()
        store.take(id, server: NotePageData.encode(scene("From ChatGPT")), by: "ChatGPT")
        for _ in 0..<40 where told == 1 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(told == 2 && NoteRow.sketch(id, in: store)?.preview == "From ChatGPT", "and when an AI's drawing arrives")
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
        // A template on a board still called Whiteboard names it; a board with a name keeps it.
        let fresh = CanvasNote.make(in: .all, context: c.mainContext)
        let canvas = CanvasController()
        canvas.title = fresh.title
        canvas.rename = { _ = CanvasTitleField.renamed(fresh, to: $0) }
        canvas.insert(.retro)
        #expect(fresh.title == "Retro" && canvas.title == "Retro")
        canvas.insert(.kanban)
        #expect(fresh.title == "Retro", "named now: kept")
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
            // At 1280 with both columns, the compact set: the rest under More Tools.
            for l in ["Select", "Pencil", "Shapes", "Arrow", "Text", "More Tools", "Full Screen", "Share"] {
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

    /// Drawing in the app as it ships (13 November 2026, "it gets laggier and laggier"): each stroke
    /// is saved once, the save isn't pushed back to the page that made it, and neither a stroke nor
    /// dragging a shape redraws the note pane on every move.
    /// Before: two saves a stroke (the page merged its own save back in and saved again), each one
    /// sent back to the page a second time, and the note pane redrawn on every move of a drag.
    @Test func strokesSaveOnceAndDontRedrawTheNotePane() async throws {
        let c = try Self.canvasLibrary()
        let note = try #require(try c.mainContext.fetch(FetchDescriptor<Note>()).first { $0.title == "Publishing flow" })
        try await AppSnapshotTests.withLastNote(c, "Publishing flow") {
            let w = MacWindowChromeTests.window(c, size: CGSize(width: 1280, height: 800))
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 20)
            var found: WKWebView?
            for _ in 0..<100 where found == nil {
                found = NotePageLive.view(note.id)
                if found == nil { await MacWindowChromeTests.settle(w, 1) }
            }
            let web = try #require(found, "the canvas opened")
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
            _ = try await web.evaluateJavaScript("""
            amber.__lag = \(CanvasTests.lagKit);
            window.__saves = 0; window.__heard = 0;
            const set = amber.store.set; amber.store.set = (k, v) => { __saves++; return set(k, v); };
            amber.onChange(() => { __heard++; });
            window.__heard = 0; 1
            """)
            await MacWindowChromeTests.settle(w, 5)
            RenderProbe.begin(in: c.mainContext)
            defer { RenderProbe.end(in: c.mainContext) }
            let strokes = 4
            for s in 0..<strokes {
                _ = try await web.callAsyncJavaScript("return await amber.__lag.stroke(40, \(300 + s * 60))", contentWorld: .page)
                await MacWindowChromeTests.settle(w, 8)
            }
            let saves = try await web.evaluateJavaScript("__saves") as? Int ?? -1
            let heard = try await web.evaluateJavaScript("__heard") as? Int ?? -1
            let strokeRenders = RenderProbe.values(in: c.mainContext)["NoteDetailView"] ?? 0
            #expect(saves == strokes, "one save a stroke: \(saves) for \(strokes)")
            #expect(heard == strokes, "the page hears of each save once, by the store's reply, not again by a push: \(heard)")
            #expect(strokeRenders <= 2, "\(strokes) strokes of 40 moves redraw the note pane at most twice (Undo turning on): \(strokeRenders)")

            // A drag of the selected box, as the page reports it: its bounds on every move. The bar over
            // the selection follows; the note pane stays. (The engine moves a drag on animation frames,
            // which an offscreen page doesn't get, so the page's reports stand in for the drag.)
            let canvas = try #require((web as? NotePageWebView)?.canvas)
            RenderProbe.begin(in: c.mainContext)
            for k in 0..<30 {
                canvas.receive(["tool": "selection", "selection": ["rectangle"], "busy": k < 29, "canUndo": true,
                                "bounds": ["x": 100 + k * 2, "y": 120 + k, "width": 200, "height": 100],
                                "style": [String: Any](), "zoom": 1, "background": "#ffffff"])
                await MacWindowChromeTests.settle(w, 1)
            }
            let dragRenders = RenderProbe.values(in: c.mainContext)["NoteDetailView"] ?? 0
            #expect(canvas.state.bounds?.minX == 158, "the controller has the last move")
            #expect(dragRenders <= 2, "a drag of 30 moves redraws the note pane at most twice: \(dragRenders)")
            print("PERF canvas app strokes=\(strokes) saves=\(saves) heard=\(heard) noteDetailRenders stroke=\(strokeRenders) drag=\(dragRenders)")
        }
    }

    /// What a shared retro's page gets from the board (BoardPicture: the picture, made for the
    /// page, and its .excalidraw file), and what Export makes of it, for the share page's pictures.
    /// Made only when SHARE_PAGE_PICTURE is set (TEST_RUNNER_SHARE_PAGE_PICTURE=dir).
    @Test func sharedRetroPictureForThePage() async throws {
        guard let path = ProcessInfo.processInfo.environment["SHARE_PAGE_PICTURE"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let j = try await Joined(scene: CanvasTests.scene([]), size: CGSize(width: 1200, height: 900))
        defer { j.close() }
        try await j.ready()
        let name = "Product launch"
        j.canvas.send(.insert(.retro, title: name))
        await j.until("the retro is in") { !j.canvas.state.empty }
        // The whole retro in view, as on a Mac window, so each sticky has room under its card.
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { zoom: { value: 0.5 } } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(150))
        _ = try await j.js("(() => { const api = amber._canvas.api; api.scrollToContent(api.getSceneElements(), { fitToContent: false }); return 1; })()")
        try await Task.sleep(for: .milliseconds(200))
        // Sticky notes under the cards, as people add them on a retro: pick the card, press S, type.
        // One in each lane, then a second in the first (its lane grows to hold it).
        for (under, words) in [("Shipped on time", "Demo went well"), ("Too many meetings", "Standups run long"), ("Demo every Friday", "Ask design to join planning"), ("Demo went well", "Calm launch day")] {
            _ = try await j.js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === \(String(reflecting: under))); const c = t && (all.find((e) => e.id === t.containerId) || t); if (c) api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); return 1; })()")
            try await Task.sleep(for: .milliseconds(100))
            j.canvas.send(.sticky)
            await j.until("the sticky is typed into") { j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(150))
            _ = try await j.js("(() => { const t = document.querySelector('textarea'); if (t) { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); } return 1; })()")
            await j.until("the sticky is written") { !j.canvas.state.editing }
            try await Task.sleep(for: .milliseconds(100))
        }
        _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
        try await Task.sleep(for: .milliseconds(300))
        try #require(await j.canvas.export(.png, light: true, page: name)).write(to: dir.appending(path: "board-page.png"))
        try #require(await j.canvas.export(.excalidraw, page: name)).write(to: dir.appending(path: "board-page.excalidraw"))
        try #require(await j.canvas.export(.png)).write(to: dir.appending(path: "board-export.png"))
    }

    /// The whiteboard in the app's window, light and dark, for the whiteboard council. Drawn only
    /// when WHITEBOARD_SHOTS is set (TEST_RUNNER_WHITEBOARD_SHOTS=dir).
    @Test func whiteboardWindowPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["WHITEBOARD_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let keptAIs = ConnectedAIs.shared.connections
        ConnectedAIs.shared.set([AskAITests.chatgpt])
        defer { ConnectedAIs.shared.set(keptAIs) }
        for dark in [false, true] {
            let c = try AppSnapshotTests.container()
            @MainActor func board(_ title: String, _ elements: [[String: Any]], ago: Double) -> Note {
                let n = CanvasNote.make(in: .all, context: c.mainContext)
                n.body = title
                n.updatedAt = .now.addingTimeInterval(-ago)
                NotePageDataStore.shared.set(n.id, ["values": ["scene": CanvasTests.scene(elements)], "collections": [String: Any]()])
                return n
            }
            _ = board("Q3 roadmap", WhiteboardTemplate.kanban.elements, ago: 300)
            _ = board("Onboarding flow", WhiteboardTemplate.flowchart.elements, ago: 900)
            _ = board("Logo ideas", (0..<5).map { i in ["type": "freedraw", "x": Double(i) * 60, "y": 0, "width": 50, "height": 40,
                                                         "points": [[0, 20], [10, 0], [25, 35], [40, 5], [50, 25]]] }, ago: 1500)
            let note = board("Product launch", [], ago: 30)
            // The notes behind the launch board's steps (its note cards, 24).
            let planNote = c.mainContext.createNote(in: .all, body: "Launch plan\n\nShip the beta to the waitlist on Friday 21 November. Post on the blog and the newsletter the same morning.\n\n- [ ] Final copy by Wednesday\n- [ ] Screenshots from the 1.4 build\n")
            planNote.updatedAt = .now.addingTimeInterval(-2400)
            let pressNote = c.mainContext.createNote(in: .all, body: "Press list\n\nWho hears first, and when: tech press on Monday at 9, newsletters on Tuesday, podcast hosts after the launch.\n")
            pressNote.updatedAt = .now.addingTimeInterval(-3000)
            try c.mainContext.save()
            WikiDirectory.invalidate()
            defer { WikiDirectory.invalidate() }
            try await AppSnapshotTests.withLastNote(c, "Product launch") {
                @MainActor func window(_ size: CGSize) -> NSWindow {
                    let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                                     styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
                    w.isReleasedWhenClosed = false
                    w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                    w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore())
                        .tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key))
                    w.setContentSize(size)
                    return w
                }
                let w = window(CGSize(width: 1400, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                @MainActor func open(_ w: NSWindow) async throws -> (NotePageWebView, CanvasController) {
                    var found: WKWebView?
                    for _ in 0..<100 where found == nil {
                        found = NotePageLive.view(note.id)
                        if found == nil { await MacWindowChromeTests.settle(w, 1) }
                    }
                    let web = try #require(found as? NotePageWebView, "the whiteboard opened")
                    try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
                    return (web, try #require(web.canvas))
                }
                let (web, canvas) = try await open(w)
                for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 10)
                @MainActor func capture(_ w: NSWindow, _ web: NotePageWebView) async throws -> NSBitmapImageRep {
                    _ = try? await web.callAsyncJavaScript("await document.fonts.ready; return 1", contentWorld: .page)
                    await MacWindowChromeTests.settle(w, 10)
                    let image = try await web.takeSnapshot(configuration: WKSnapshotConfiguration())
                    let cover = NSImageView(frame: web.bounds)
                    cover.image = image
                    cover.imageScaling = .scaleAxesIndependently
                    cover.wantsLayer = true
                    web.addSubview(cover)
                    defer { cover.removeFromSuperview() }
                    w.contentView?.layoutSubtreeIfNeeded()
                    w.displayIfNeeded()
                    return try MacEmptyDetailTests.picture(w)
                }
                @MainActor func shot(_ name: String, _ w: NSWindow, _ web: NotePageWebView) async throws {
                    let png = try #require(try await capture(w, web).representation(using: .png, properties: [:]))
                    try png.write(to: dir.appending(path: "\(name)-\(dark ? "dark" : "light").png"))
                }
                @MainActor func js(_ s: String) async throws { _ = try await web.evaluateJavaScript("(() => { " + s + "; return 1; })()") }
                @MainActor func insert(_ t: WhiteboardTemplate) async throws {
                    try await js("amber._canvas.api.updateScene({ elements: [] })")
                    for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    canvas.send(.insert(t, title: canvas.title))  // as the template tile does
                    for _ in 0..<100 where canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 10)
                }
                @MainActor func select(_ filter: String) async throws {
                    try await js("const api = amber._canvas.api; const ids = {}; api.getSceneElements().filter((e) => \(filter)).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } })")
                    for _ in 0..<50 where canvas.state.bounds == nil { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 5)
                }
                try await shot("01-empty", w, web)
                for (i, t) in (dark ? [WhiteboardTemplate.flowchart] : WhiteboardTemplate.allCases).enumerated() {
                    try await insert(t)
                    try await shot(String(format: "%02d-template-%@", 2 + i, t.rawValue), w, web)
                }
                try await insert(.flowchart)
                try await select("e.type === 'rectangle' && e.backgroundColor === '#a5d8ff'")
                try await shot("07-selected-box", w, web)
                if !dark {
                    // The board's title (named after the board now), scrolled to just under the toolbar.
                    try await js("const api = amber._canvas.api, s = api.getAppState(), t = api.getSceneElements().find((e) => e.customData && e.customData.pintoTitle); api.updateScene({ appState: { scrollY: -t.y + 16 / s.zoom.value } })")
                    try await select("e.customData && e.customData.pintoTitle")
                    try await shot("08-selected-title-near-top", w, web)
                    try await select("e.type === 'arrow' && e.width > 50")
                    try await shot("09-selected-arrow", w, web)
                    try await select("!e.containerId")
                    try await shot("10-selected-all", w, web)
                }
                try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                // A screenshot pasted on: the window itself, as a picture.
                let screenshot = try MacEmptyDetailTests.picture(w).representation(using: .png, properties: [:])
                if !dark, let screenshot, let picture = CanvasImage(data: screenshot) {
                    canvas.send(.image(picture, at: nil))
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("11-pasted-screenshot", w, web)
                    canvas.run(.crop)
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("11-cropping", w, web)
                    canvas.send(.cropDone)
                    try await js("const api = amber._canvas.api; api.updateScene({ elements: api.getSceneElementsIncludingDeleted().filter((e) => e.type !== 'image'), appState: { selectedElementIds: {} } })")
                }
                // An AI draws an approval flow next to it, as an MCP write arrives through sync.
                var doc = NotePageDataStore.shared.doc(note.id)
                await MacWindowChromeTests.settle(w, 10)
                doc = NotePageDataStore.shared.doc(note.id)
                var scene = (doc["values"] as? [String: Any])?["scene"] as? [String: Any] ?? [:]
                var els = scene["elements"] as? [[String: Any]] ?? []
                let ink = "#2a1d10"
                els += [
                    ["type": "rectangle", "id": "ai-req", "x": 560, "y": 0, "width": 180, "height": 70, "label": ["text": "Request"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "rectangle", "id": "ai-rev", "x": 560, "y": 130, "width": 180, "height": 70, "label": ["text": "Manager review"], "strokeColor": ink, "backgroundColor": "#eebefa", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "rectangle", "id": "ai-ok", "x": 560, "y": 260, "width": 180, "height": 70, "label": ["text": "Approved"], "strokeColor": ink, "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
                    ["type": "arrow", "x": 650, "y": 70, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-req"], "end": ["id": "ai-rev"], "strokeColor": ink],
                    ["type": "arrow", "x": 650, "y": 200, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-rev"], "end": ["id": "ai-ok"], "strokeColor": ink],
                ]
                scene["elements"] = els
                let server = NotePageData.encode(["values": ["scene": scene], "collections": [String: Any]()])
                CanvasController.highlightTime = 60
                defer { CanvasController.highlightTime = 4 }
                NotePageDataStore.shared.take(note.id, server: server, by: "ChatGPT")
                for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                try await shot("12-ai-drew", w, web)
                let fullScreen = await MacEmptyDetailTests.waitForElement("note.fullScreen", in: w)
                let e = try #require(fullScreen ?? MacEmptyDetailTests.element("note.fullScreen", in: w))
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 15)
                try await shot("13-fullscreen", w, web)
                _ = e.perform(#selector(NSAccessibilityProtocol.accessibilityPerformPress))
                await MacWindowChromeTests.settle(w, 15)
                // What Export › PNG Image makes of the board.
                if !dark, let png = await canvas.export(.png) { try png.write(to: dir.appending(path: "14-exported-board.png")) }
                // A narrow window, a shape selected.
                if !dark {
                    w.setContentSize(CGSize(width: 1000, height: 700))
                    await MacWindowChromeTests.settle(w, 20)
                    try await select("e.type === 'diamond'")
                    try await shot("15-narrow-window", w, web)
                    w.setContentSize(CGSize(width: 1400, height: 900))
                    await MacWindowChromeTests.settle(w, 20)
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                }
                // Exported while in dark mode: still a light picture.
                if dark, let png = await canvas.export(.png) { try png.write(to: dir.appending(path: "18-exported-from-dark.png")) }
                // The AI changes what's there: renames a step and adds one; the receipt says what.
                if !dark {
                    try await js("amber._canvas.api.scrollToContent(undefined, { animate: false })")
                    await MacWindowChromeTests.settle(w, 30)
                    var now = (NotePageDataStore.shared.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any] ?? [:]
                    var all = now["elements"] as? [[String: Any]] ?? []
                    for i in all.indices where all[i]["containerId"] as? String == "ai-rev" {
                        all[i]["text"] = "Finance review"; all[i]["originalText"] = "Finance review"
                        all[i]["version"] = ((all[i]["version"] as? Int) ?? 1) + 1
                    }
                    all += [
                        ["type": "rectangle", "id": "ai-tell", "x": 560, "y": 390, "width": 180, "height": 70, "label": ["text": "Notify team"], "strokeColor": ink, "backgroundColor": "#a5d8ff", "fillStyle": "solid", "roundness": ["type": 3]],
                        ["type": "arrow", "x": 650, "y": 330, "width": 0, "height": 60, "points": [[0, 0], [0, 60]], "start": ["id": "ai-ok"], "end": ["id": "ai-tell"], "strokeColor": ink],
                    ]
                    now["elements"] = all
                    canvas.highlight = nil
                    NotePageDataStore.shared.take(note.id, server: NotePageData.encode(["values": ["scene": now], "collections": [String: Any]()]), by: "ChatGPT")
                    for _ in 0..<100 where canvas.highlight == nil { await MacWindowChromeTests.settle(w, 1) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("16-ai-changed", w, web)
                    // Sticky notes on a retro: four made with S's command, each typed into.
                    canvas.highlight = nil
                    try await insert(.retro)
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    // Each under a card in its lane, as people do on a retro: pick the card, press S.
                    for (under, words) in [("Shipped on time", "Demo went well"), ("Demo went well", "Calm launch day"), ("Too many meetings", "Fewer meetings on Fridays"), ("Demo every Friday", "Ask design to join planning")] {
                        try await js("(() => { const api = amber._canvas.api, all = api.getSceneElements(); const t = all.find((e) => e.type === 'text' && e.text === \(String(reflecting: under))); const c = t && (all.find((e) => e.id === t.containerId) || t); if (c) api.updateScene({ appState: { selectedElementIds: { [c.id]: true } } }); })()")
                        await MacWindowChromeTests.settle(w, 3)
                        canvas.send(.sticky)
                        for _ in 0..<60 where !canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        try await Task.sleep(for: .milliseconds(150))
                        try await js("const t = document.querySelector('textarea'); if (t) { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); }")
                        for _ in 0..<60 where canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        await MacWindowChromeTests.settle(w, 3)
                    }
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("17-sticky-notes", w, web)
                    // The picture a shared link's page shows (BoardPicture: light, the whole board).
                    if let png = await canvas.export(.png, light: true, page: canvas.title) { try png.write(to: dir.appending(path: "19-shared-board-picture.png")) }
                    if let file = await canvas.export(.excalidraw, page: canvas.title) { try file.write(to: dir.appending(path: "19-shared-board.excalidraw")) }
                    // A drawing sequence (council round 3 asked for it): two labelled boxes joined
                    // by an arrow, then both lined up with Align › Middle (the arrow follows), then
                    // Undo (the move), Redo. One picture per step.
                    try await js("amber._canvas.api.updateScene({ elements: [], captureUpdate: 'IMMEDIATELY' })")
                    canvas.highlight = nil
                    await MacWindowChromeTests.settle(w, 10)
                    try await js("""
                    amber._canvasCommand({ op: 'insert', elements: [
                      { type: 'rectangle', id: 'a', x: 0, y: 160, width: 200, height: 90, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Plan' } },
                      { type: 'rectangle', id: 'b', x: 420, y: 0, width: 200, height: 90, backgroundColor: '#b2f2bb', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Ship' } },
                      { type: 'arrow', x: 204, y: 200, width: 212, height: -150, start: { id: 'a' }, end: { id: 'b' } },
                    ] })
                    """)
                    for _ in 0..<40 where canvas.state.empty { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-1-joined", w, web)
                    try await js("const api = amber._canvas.api; const ids = {}; api.getSceneElements().filter((e) => e.type === 'rectangle').forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids }, captureUpdate: 'IMMEDIATELY' })")
                    await MacWindowChromeTests.settle(w, 5)
                    canvas.run(.alignMiddle)
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-2-aligned", w, web)
                    canvas.run(.undo); await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-3-undo", w, web)
                    canvas.run(.redo); await MacWindowChromeTests.settle(w, 10)
                    try await shot("22-sequence-4-redo", w, web)
                    // Frames, and Present walking through them (council rounds 4 and 5).
                    try await js("amber._canvas.api.updateScene({ elements: [], captureUpdate: 'IMMEDIATELY' })")
                    await MacWindowChromeTests.settle(w, 5)
                    try await js("""
                    amber._canvasCommand({ op: 'insert', elements: [
                      { type: 'text', id: 'p1', x: 40, y: 40, text: 'Sign-up takes 6 steps', fontSize: 28 },
                      { type: 'rectangle', id: 'p2', x: 40, y: 110, width: 200, height: 120, backgroundColor: '#ffc9c9', fillStyle: 'solid', roundness: { type: 3 }, label: { text: '42% drop at step 4' } },
                      { type: 'rectangle', id: 'p3', x: 270, y: 110, width: 200, height: 120, backgroundColor: '#ffec99', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Email code is slow' } },
                      { type: 'frame', id: 'fp', children: ['p1', 'p2', 'p3'], name: 'The problem' },
                      { type: 'text', id: 'i1', x: 640, y: 40, text: 'One screen, then the app', fontSize: 28 },
                      { type: 'ellipse', id: 'i2', x: 640, y: 120, width: 180, height: 90, backgroundColor: '#b2f2bb', fillStyle: 'solid', label: { text: 'Sign in with Apple' } },
                      { type: 'rectangle', id: 'i3', x: 900, y: 120, width: 180, height: 90, backgroundColor: '#a5d8ff', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Open the app' } },
                      { type: 'arrow', x: 822, y: 165, width: 76, height: 0, start: { id: 'i2' }, end: { id: 'i3' } },
                      { type: 'frame', id: 'fi', children: ['i1', 'i2', 'i3'], name: 'The idea' },
                      { type: 'text', id: 'n1', x: 1240, y: 40, text: 'This week', fontSize: 28 },
                      { type: 'rectangle', id: 'n2', x: 1240, y: 110, width: 220, height: 70, backgroundColor: '#eebefa', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Mon: prototype' } },
                      { type: 'rectangle', id: 'n3', x: 1240, y: 200, width: 220, height: 70, backgroundColor: '#eebefa', fillStyle: 'solid', roundness: { type: 3 }, label: { text: 'Wed: test with 5 people' } },
                      { type: 'frame', id: 'fn', children: ['n1', 'n2', 'n3'], name: 'The plan' },
                    ] })
                    """)
                    for _ in 0..<40 where canvas.state.empty { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("25-frames", w, web)
                    canvas.send(.present(.start))
                    for _ in 0..<40 where canvas.state.present == nil { await MacWindowChromeTests.settle(w, 2) }
                    await MacWindowChromeTests.settle(w, 20)
                    try await shot("25-present-1", w, web)
                    canvas.send(.present(.next))
                    await MacWindowChromeTests.settle(w, 15)
                    try await shot("25-present-2", w, web)
                    canvas.send(.present(.stop))
                    await MacWindowChromeTests.settle(w, 20)
                    try await shot("25-present-done", w, web)
                }
                // The library (whiteboard council, round 5): two Excalidraw libraries imported and
                // two shapes saved from the board; the popover with them (drawn on its own, as a
                // popover can't be drawn off screen, and placed under its button), then a click on
                // a tile: the item in the middle of the view, beside the drawing, selected.
                let keptLibrary = CanvasLibrary.shared
                let lib = CanvasLibrary(folder: nil)
                CanvasLibrary.shared = lib
                defer { CanvasLibrary.shared = keptLibrary }
                canvas.highlight = nil
                try await insert(.flowchart)
                _ = lib.importLibrary(Data(Self.basicShapesLibrary.utf8))
                _ = lib.importLibrary(Data(Self.dataFlowLibrary.utf8))
                for shape in ["e.type === 'ellipse' && e.backgroundColor === '#b2f2bb' && e.y < 100", "e.type === 'diamond'"] {
                    try await select(shape)
                    await canvas.saveSelectionToLibrary(lib)
                }
                try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                canvas.notice = nil
                await canvas.drawThumbnails(lib)
                await MacWindowChromeTests.settle(w, 10)
                let popover = try await Self.libraryPopoverPicture(canvas: canvas, library: lib, dark: dark)
                try #require(popover.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-popover-\(dark ? "dark" : "light").png"))
                if !dark {
                    let empty = try await Self.libraryPopoverPicture(canvas: canvas, library: CanvasLibrary(folder: nil), dark: dark)
                    try #require(empty.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-empty-light.png"))
                }
                // The popover where it opens, under the toolbar's Library button.
                let found = await MacEmptyDetailTests.waitForElement("canvas.tool.library", in: w)
                if let button = found ?? MacEmptyDetailTests.element("canvas.tool.library", in: w),
                   let onScreen = (button.value(forKey: "accessibilityFrame") as? NSValue)?.rectValue {
                    let frame = w.convertFromScreen(onScreen)
                    if frame.width > 0 {
                        let open = try Self.placed(popover, under: frame, on: try await capture(w, web), size: w.frame.size, dark: dark)
                        try #require(open.representation(using: .png, properties: [:])).write(to: dir.appending(path: "23-library-open-\(dark ? "dark" : "light").png"))
                    }
                }
                let store = try #require(lib.items.first { $0.name == "Data storage" })
                canvas.insert(store)
                for _ in 0..<60 where canvas.state.selection.isEmpty { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 10)
                try await shot("23-library-inserted", w, web)
                // Note cards (whiteboard council, round 6): a launch flowchart whose first and last
                // steps are joined to the notes behind them, written as an AI writes cards (by the
                // notes' titles); then one card selected; then (light) one of the notes deleted
                // while the board is open.
                try await js("amber._canvas.api.updateScene({ elements: [], appState: { selectedElementIds: {} }, captureUpdate: 'IMMEDIATELY' })")
                canvas.highlight = nil
                for _ in 0..<100 where !canvas.state.empty { await MacWindowChromeTests.settle(w, 1) }
                func step(_ id: String, _ type: String = "rectangle", x: Double, y: Double, w: Double = 200, h: Double = 80, _ text: String, _ fill: String) -> [String: Any] {
                    var e: [String: Any] = ["type": type, "id": id, "x": x, "y": y, "width": w, "height": h, "label": ["text": text], "strokeColor": ink, "backgroundColor": fill, "fillStyle": "solid"]
                    if type == "rectangle" { e["roundness"] = ["type": 3] }
                    return e
                }
                let launch: [[String: Any]] = [
                    ["type": "text", "x": -30, "y": -300, "text": canvas.title, "fontSize": 32, "strokeColor": ink],
                    step("draft", x: 0, y: 0, "Draft the post", "#a5d8ff"),
                    step("ready", "diamond", x: 280, y: -14, w: 180, h: 108, "Ready?", "#ffec99"),
                    step("publish", x: 540, y: 0, "Publish", "#b2f2bb"),
                    step("fix", x: 280, y: 170, w: 180, h: 70, "Fix it", "#ffc9c9"),
                    ["type": "arrow", "x": 202, "y": 40, "width": 76, "height": 0, "start": ["id": "draft"], "end": ["id": "ready"], "strokeColor": ink],
                    ["type": "arrow", "x": 462, "y": 40, "width": 76, "height": 0, "start": ["id": "ready"], "end": ["id": "publish"], "strokeColor": ink, "label": ["text": "yes"]],
                    ["type": "arrow", "x": 370, "y": 96, "width": 0, "height": 72, "points": [[0, 0], [0, 72]], "start": ["id": "ready"], "end": ["id": "fix"], "strokeColor": ink, "label": ["text": "no"]],
                    // The notes, as an AI writes a card: a shape whose customData names the note.
                    ["type": "rectangle", "id": "plan", "x": -30, "y": -200, "width": 260, "height": 111, "customData": ["pintoNote": "Launch plan"]],
                    ["type": "rectangle", "id": "press", "x": 510, "y": -200, "width": 260, "height": 111, "customData": ["pintoNote": "Press list"]],
                    ["type": "arrow", "x": 100, "y": -86, "width": 0, "height": 82, "points": [[0, 0], [0, 82]], "start": ["id": "plan"], "end": ["id": "draft"], "strokeColor": ink, "strokeStyle": "dashed", "startArrowhead": NSNull(), "endArrowhead": NSNull()],
                    ["type": "arrow", "x": 640, "y": -86, "width": 0, "height": 82, "points": [[0, 0], [0, 82]], "start": ["id": "press"], "end": ["id": "publish"], "strokeColor": ink, "strokeStyle": "dashed", "startArrowhead": NSNull(), "endArrowhead": NSNull()],
                ]
                let json = String(decoding: try JSONSerialization.data(withJSONObject: launch), as: UTF8.self)
                try await js("amber._canvasCommand({ op: 'insert', elements: \(json) })")
                // Until both cards have found their notes (they then name them by id).
                for _ in 0..<150 where canvas.state.cardNotes.count < 2 || canvas.state.cardNotes.contains(where: { UUID(uuidString: $0) == nil }) {
                    await MacWindowChromeTests.settle(w, 2)
                }
                #expect(Set(canvas.state.cardNotes) == [planNote.id.uuidString, pressNote.id.uuidString], "both cards found their notes")
                await MacWindowChromeTests.settle(w, 20)
                try await shot("24-note-card-board", w, web)
                try await js("const api = amber._canvas.api, ids = {}, groups = {}; api.getSceneElements().filter((e) => e.customData && e.customData.pintoNote === '\(planNote.id.uuidString)').forEach((e) => { ids[e.id] = true; if (e.groupIds[0]) groups[e.groupIds[0]] = true; }); api.updateScene({ appState: { selectedElementIds: ids, selectedGroupIds: groups } })")
                for _ in 0..<50 where canvas.state.card == nil { await MacWindowChromeTests.settle(w, 1) }
                await MacWindowChromeTests.settle(w, 5)
                try await shot("24-note-card-selected", w, web)
                if !dark {
                    // Deleted while the board is open: its card says so, quietly.
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } })")
                    pressNote.trashedAt = .now
                    pressNote.touchKeepingDate()
                    try c.mainContext.save()
                    for _ in 0..<100 {
                        let said = try? await web.evaluateJavaScript("(() => amber._canvas.api.getSceneElements().some((e) => e.customData && e.customData.pintoCard === 'preview' && e.text === 'Note deleted'))()") as? Bool
                        if said == true { break }
                        await MacWindowChromeTests.settle(w, 2)
                    }
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("24-note-card-deleted", w, web)
                }
            }
        }
    }

    /// The library popover's view drawn on its own at 2x, on a popover's plain card.
    static func libraryPopoverPicture(canvas: CanvasController, library: CanvasLibrary, dark: Bool) async throws -> NSBitmapImageRep {
        let height = library.items.isEmpty ? 120 : CanvasLibraryPopover.gridHeight(library.items.count) + 44
        let size = CGSize(width: CanvasLibraryPopover.width, height: height)
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: library)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(Color(nsColor: .windowBackgroundColor)), size: size, dark: dark)
        defer { ax.close() }
        await ax.settle(600)
        let v = try #require(ax.window.contentView)
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        return rep
    }

    /// `popover` drawn over a window's picture (the window `size` in points) as it opens: under
    /// `button` (in the window's points), with its arrow, rounded corners and shadow.
    static func placed(_ popover: NSBitmapImageRep, under button: CGRect, on window: NSBitmapImageRep, size points: CGSize, dark: Bool) throws -> NSBitmapImageRep {
        let scale = CGFloat(window.pixelsWide) / points.width
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: window.pixelsWide, pixelsHigh: window.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = points
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        window.draw(in: CGRect(origin: .zero, size: points))
        let size = CGSize(width: CGFloat(popover.pixelsWide) / scale, height: CGFloat(popover.pixelsHigh) / scale), arrow: CGFloat = 9
        let x = min(max(button.midX - size.width / 2, 8), points.width - size.width - 8)
        let card = CGRect(x: x, y: button.minY - 6 - arrow - size.height, width: size.width, height: size.height)
        let shape = NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12)
        let tip = NSBezierPath()
        tip.move(to: CGPoint(x: button.midX - arrow, y: card.maxY - 1))
        tip.line(to: CGPoint(x: button.midX, y: card.maxY + arrow))
        tip.line(to: CGPoint(x: button.midX + arrow, y: card.maxY - 1))
        tip.close()
        shape.append(tip)
        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(dark ? 0.55 : 0.22)
        shadow.shadowBlurRadius = 18
        shadow.shadowOffset = CGSize(width: 0, height: -6)
        shadow.set()
        (dark ? NSColor(white: 0.17, alpha: 1) : NSColor(white: 0.93, alpha: 1)).setFill()
        shape.fill()
        NSGraphicsContext.restoreGraphicsState()
        NSGraphicsContext.saveGraphicsState()
        NSBezierPath(roundedRect: card, xRadius: 12, yRadius: 12).addClip()
        popover.draw(in: card)
        NSGraphicsContext.restoreGraphicsState()
        NSColor(white: dark ? 1 : 0, alpha: dark ? 0.16 : 0.12).setStroke()
        shape.lineWidth = 1 / scale
        shape.stroke()
        return out
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
        #if os(macOS)
        #expect(gap >= 24, "clear of the rotate handle above the selection (whiteboard council, round 1)")
        #endif
        #expect(abs(above.x - 350) < 0.01 && abs(above.y - (300 - gap - 20)) < 0.01, "just above, centred")
        let below = CanvasSelectionBar.position(bounds: CGRect(x: 300, y: 10, width: 100, height: 50), bar: bar, area: area)
        #expect(abs(below.y - (60 + gap + 20)) < 0.01, "no room above: below it (\(below.y))")
        let edge = CanvasSelectionBar.position(bounds: CGRect(x: -50, y: 300, width: 60, height: 50), bar: bar, area: area)
        #expect(abs(edge.x - 108) < 0.01, "kept inside the canvas (\(edge.x))")
        // Something drawn just above (an arrow coming in, a shape): it slides along, or goes
        // below, or beside, to cover none of it (whiteboard council, round 2, 07).
        let box = CGRect(x: 300, y: 300, width: 100, height: 50)
        let arrowIn = CanvasObstacle.line([CGPoint(x: 350, y: 200), CGPoint(x: 350, y: 298)])
        let slid = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [arrowIn])
        #expect(abs(slid.y - above.y) < 0.01 && abs(slid.x - 350) > 100, "above, slid clear of the arrow: \(slid)")
        let shapeAbove = CanvasObstacle.box(CGRect(x: 0, y: 200, width: 800, height: 60))
        let under = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [shapeAbove, arrowIn])
        #expect(abs(under.y - (350 + gap + 20)) < 0.01, "below it: \(under)")
        let arrowOut = CanvasObstacle.line([CGPoint(x: 350, y: 352), CGPoint(x: 350, y: 500)])
        let beside = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: [shapeAbove, arrowIn, arrowOut, .box(CGRect(x: 0, y: 360, width: 800, height: 200))])
        #expect(abs(beside.y - 325) < 0.01 && (beside.x < 300 || beside.x > 400), "beside it: \(beside)")
        // A shape as wide as the selection right above it, and arrows coming in from above and
        // the right: off the corner, covering none of them (whiteboard council, round 5, 07).
        let start = CanvasObstacle.box(CGRect(x: 300, y: 180, width: 100, height: 60))
        let fromRight = CanvasObstacle.line([CGPoint(x: 600, y: 330), CGPoint(x: 402, y: 325)])
        let done = CanvasObstacle.box(CGRect(x: 300, y: 420, width: 100, height: 60))
        let fromLeft = CanvasObstacle.line([CGPoint(x: 0, y: 325), CGPoint(x: 298, y: 325)])
        let all = [start, arrowIn, fromRight, done, fromLeft]
        let corner = CanvasSelectionBar.position(bounds: box, bar: bar, area: area, nearby: all)
        let cr = CGRect(x: corner.x - 100, y: corner.y - 20, width: 200, height: 40)
        #expect(!all.contains { $0.hits(cr) }, "off a corner, clear of everything: \(corner)")
        #expect(CanvasObstacle.line([CGPoint(x: 0, y: 0), CGPoint(x: 100, y: 100)]).hits(CGRect(x: 45, y: 45, width: 10, height: 10)))
        #expect(!CanvasObstacle.line([CGPoint(x: 0, y: 0), CGPoint(x: 100, y: 100)]).hits(CGRect(x: 70, y: 0, width: 20, height: 20)), "a diagonal's box isn't the line")
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
