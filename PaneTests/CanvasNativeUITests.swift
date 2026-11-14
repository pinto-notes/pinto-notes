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
            canvas.exporter = { [weak s] f, selected in await s?.canvasExport(f, selected: selected) }
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
        d.canvas.exporter = { [weak s = d.rig.sandbox] f, selected in await s?.canvasExport(f, selected: selected) }
        let png = try #require(await d.canvas.export(.png))
        let corner = try #require(NSBitmapImageRep(data: png)?.colorAt(x: 2, y: 2)?.usingColorSpace(.sRGB))
        #expect(corner.brightnessComponent > 0.9, "a light background: \(corner)")
    }

    /// In a narrow column the board's toolbar is compact: the main tools, the rest in More Tools,
    /// so every tool can still be reached (whiteboard council, round 2, 15).
    @Test func aNarrowWindowKeepsEveryToolReachable() {
        // A 1400 window (the default) with both columns has room for every tool; 1000 doesn't.
        #expect(CanvasToolbarTools.compact(670) && !CanvasToolbarTools.compact(800))
        #expect(!CanvasSelectionBar.inView(CGRect(x: -400, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)), "no bar for a selection out of view")
        #expect(CanvasSelectionBar.inView(CGRect(x: -100, y: 100, width: 200, height: 80), area: CGSize(width: 800, height: 600)))
        let reachable = Set(CanvasToolbarTools.compactShown + CanvasToolbarTools.compactMore + CanvasTool.shapes)
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
          const cards = all.filter((e) => e.type === 'rectangle' && !(e.customData && e.customData.pintoSticky) && e.width * e.height < 180 * 180 * 2);
          const over = cards.some((c) => st.x < c.x + c.width && st.x + st.width > c.x && st.y < c.y + c.height && st.y + st.height > c.y);
          const words = all.find((e) => e.containerId === st.id);
          return JSON.stringify({ over, ink: words && words.strokeColor }); })()
        """) as? String
        #expect(clear == "{\"over\":false,\"ink\":\"#2a1d10\"}", "not on a card, its words in ink: \(clear ?? "")")
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
            try c.mainContext.save()
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
                @MainActor func shot(_ name: String, _ w: NSWindow, _ web: NotePageWebView) async throws {
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
                    let rep = try MacEmptyDetailTests.picture(w)
                    let png = try #require(rep.representation(using: .png, properties: [:]))
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
                    try await select("e.type === 'text' && e.text === 'Flowchart'")
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
                    // Sticky notes on a retro: three made with S's command, each typed into.
                    canvas.highlight = nil
                    try await insert(.retro)
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    for words in ["Demo went well", "Ask design to join planning", "Fewer meetings on Fridays"] {
                        canvas.send(.sticky)
                        for _ in 0..<60 where !canvas.state.editing { await MacWindowChromeTests.settle(w, 1) }
                        try await js("const t = document.querySelector('textarea'); if (t) { t.value = \(String(reflecting: words)); t.dispatchEvent(new Event('input', { bubbles: true })); t.blur(); }")
                        await MacWindowChromeTests.settle(w, 5)
                        try await js("const api = amber._canvas.api; const s = api.getSceneElements().filter((e) => e.customData && e.customData.pintoSticky); const last = s[s.length - 1]; api.updateScene({ appState: { selectedElementIds: { [last.id]: true } } })")
                        await MacWindowChromeTests.settle(w, 3)
                    }
                    try await js("amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } })")
                    await MacWindowChromeTests.settle(w, 10)
                    try await shot("17-sticky-notes", w, web)
                }
            }
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
