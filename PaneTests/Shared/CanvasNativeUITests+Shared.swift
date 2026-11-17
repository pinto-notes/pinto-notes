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

/// The CanvasNativeUITests suite's declaration, and the helpers of it that tests in other test
/// targets use (a test target can't see another's code): the board joined to its controller, the
/// study's drawing, and pictures of the board. Its tests are in PaneTests/CanvasNativeUITests.swift.
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

    #if os(macOS)
    /// The library popover's view drawn on its own at 2x, on a popover's plain card.
    static func libraryPopoverPicture(canvas: CanvasController, library: CanvasLibrary, dark: Bool, scrolledToEnd: Bool = false) async throws -> NSBitmapImageRep {
        let search: CGFloat = CanvasLibraryGrid.showsSearch(library.items.count) ? 34 : 0
        let height = library.items.isEmpty ? 120 : CanvasLibraryPopover.gridHeight(CanvasLibraryGrid(library.items)) + 44 + search
        let size = CGSize(width: CanvasLibraryPopover.width, height: height)
        let ax = OffscreenAX(CanvasLibraryPopover(canvas: canvas, library: library)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(Color(nsColor: .windowBackgroundColor)), size: size, dark: dark)
        defer { ax.close() }
        await ax.settle(600)
        let v = try #require(ax.window.contentView)
        if scrolledToEnd, let scroll = MacWindowChromeTests.find(NSScrollView.self, in: v), let doc = scroll.documentView {
            // The grid scrolled to its last row, as someone scrolling a long library sees it.
            let end = doc.isFlipped ? max(0, doc.frame.height - scroll.contentView.bounds.height) : 0
            scroll.contentView.scroll(to: NSPoint(x: 0, y: end))
            scroll.reflectScrolledClipView(scroll.contentView)
            await ax.settle(200)
        }
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        return rep
    }

    /// Waits for the board's view to settle after its size changed (Full Screen, a wider window):
    /// the page has seen every resize step and the view stopped moving. An offscreen window holds
    /// back the page's rendering, and with it the resize steps; a picture of the page lets one
    /// through (round 10, 13-fullscreen-dark: the picture was taken a step early, the view still
    /// centred for a narrower board). Returns where the view is (`amber._canvasView`).
    static func settledView(_ w: NSWindow, _ web: WKWebView) async throws -> [String: Any] {
        func view() async throws -> [String: Any] {
            let json = try await web.evaluateJavaScript("JSON.stringify(amber._canvasView())") as? String ?? "{}"
            return try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] ?? [:]
        }
        func same(_ a: [String: Any], _ b: [String: Any]) -> Bool {
            ["width", "height", "scrollX", "scrollY", "zoom"].allSatisfy { k in
                guard let x = a[k] as? Double, let y = b[k] as? Double else { return false }
                return abs(x - y) < 0.01
            }
        }
        var last: [String: Any] = [:]
        for _ in 0..<60 {
            _ = try? await web.takeSnapshot(configuration: nil)
            await MacWindowChromeTests.settle(w, 1)
            let now = try await view()
            if now["settled"] as? Bool == true, same(now, last) { return now }
            last = now
        }
        return last
    }
    #endif
}
