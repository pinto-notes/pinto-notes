#if os(macOS)
import AppKit
import Foundation
import Testing
import WebKit
@testable import Pane

/// What a board's page sends the app while you draw (the board benchmark, PaneBench/BoardPerfTests,
/// measures how it feels; this checks the count, which isn't a timing). The page draws in a window
/// off every screen: borderless at (-20000, -20000), ordered in behind everything so WebKit draws,
/// never key, never clicked.
@MainActor @Suite(.serialized) struct BoardStrokeTrafficTests {
    /// Off every screen, WebKit would count the page hidden and draw no frames.
    static func drawOffscreen(_ web: WKWebView) {
        let sel = NSSelectorFromString("_setWindowOcclusionDetectionEnabled:")
        guard web.responds(to: sel), let imp = class_getMethodImplementation(WKWebView.self, sel) else { return }
        typealias Set = @convention(c) (AnyObject, Selector, Bool) -> Void
        unsafeBitCast(imp, to: Set.self)(web, sel, false)
    }

    /// A stroke sends the app nothing while it's drawn: no board state on every pointer move, no
    /// drawing. The app's main thread had work on every move of every stroke, and the board was
    /// slow to draw on (16 November 2026). The state a few times for the whole stroke (busy once),
    /// the drawing once, a pause after the pen lifts.
    @Test func aStrokeSendsTheAppNothingWhileItIsDrawn() async throws {
        let shapes: [[String: Any]] = (0..<40).map { i in
            var e: [String: Any] = ["id": "s\(i)", "width": 110, "height": 80, "backgroundColor": "#a5d8ff", "fillStyle": "solid"]
            e["type"] = i % 3 == 0 ? "ellipse" : "rectangle"
            e["x"] = Double(i % 8) * 140
            e["y"] = Double(i / 8) * 110
            return e
        }
        let rig = try await CanvasTests.Rig(scene: CanvasTests.scene(shapes), size: CGSize(width: 1000, height: 700), dark: false)
        defer { rig.close() }
        let web = rig.sandbox.webView
        var states = 0, busy = 0
        rig.sandbox.onCanvas = { m in
            states += 1
            if (m as? [String: Any])?["busy"] as? Bool == true { busy += 1 }
        }
        Self.drawOffscreen(web)
        rig.window.ignoresMouseEvents = true
        rig.window.orderBack(nil)
        #expect(!NSScreen.screens.contains { $0.frame.intersects(rig.window.frame) }, "the window stays off every screen")
        try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas && document.querySelector('canvas.interactive'))")
        _ = try await web.evaluateJavaScript(try SettingsHomeTests.source("canvas-stack/bench/driver.js"))
        _ = try await web.callAsyncJavaScript("return JSON.stringify(await __boardBench.fit())", contentWorld: .page)
        try await Task.sleep(for: .milliseconds(600))
        let saves = rig.saves
        states = 0
        busy = 0
        let json = try #require(try await web.callAsyncJavaScript("return await __boardBench.run('freedraw', { duration: 1200, rate: 120, lead: 200, tail: 900 })", contentWorld: .page) as? String)
        let run = try #require(try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
        let moving = try #require(run["trafficMoving"] as? [String: Int])
        #expect((run["inked"] as? Int ?? 0) > 60, "the stroke was drawn: \(run["inked"] ?? 0) of \(run["moves"] ?? 0) moves inked")
        #expect(moving["canvas"] == 0, "no board state while the pointer moved: \(moving)")
        #expect(moving["data"] == 0, "no drawing sent while the pointer moved: \(moving)")
        #expect(rig.saves == saves + 1, "the stroke saved once, after it: \(rig.saves - saves)")
        // The pencil picked (the benchmark's driver picks it), the press begun (busy, once), the
        // press ended, the selection tool put back: four, whatever the stroke's length.
        #expect(busy == 1, "busy said once for the whole stroke: \(busy)")
        #expect(states <= 4, "the board's state a few times for the whole stroke, not per move: \(states)")
    }
}
#endif
