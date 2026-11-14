import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Canvas notes (prototype): New Canvas makes one, the drawing round-trips through the page's data,
/// two devices' drawings merge by element, and the page loads nothing from outside the app.
@MainActor @Suite(.serialized) struct CanvasTests {
    static func container() throws -> ModelContainer {
        try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }

    // MARK: New Canvas

    @Test func newCanvasMakesACanvasNoteWithAnEmptyScene() throws {
        let c = try Self.container()
        let pages = NotePageStore(file: nil), data = NotePageDataStore(file: nil)
        let note = CanvasNote.make(in: .all, context: c.mainContext, pages: pages, data: data)
        #expect(note.body == "Whiteboard")
        #expect(note.folder != nil)
        let page = try #require(pages[note.id])
        #expect(CanvasNote.isCanvas(page.html))
        #expect(CanvasNote.has(note, in: pages))
        #expect(NoteAppMark.has(note, in: pages), "a canvas is an app underneath: it syncs and reaches an AI like one")
        #expect(pages.unpushed[note.id] != nil, "the page goes to the other devices")
        #expect(data.dirty.contains(note.id), "and so does its scene")
        let scene = try #require((data.doc(note.id)["values"] as? [String: Any])?["scene"] as? [String: Any])
        #expect(scene["type"] as? String == "excalidraw")
        #expect((scene["elements"] as? [Any])?.isEmpty == true)
        // The project is valid, opens as the canvas page, and tells an AI what it is.
        let project = try #require(NotePageProject.parse(page.html))
        #expect(project.problem == nil)
        #expect(project.index.contains("amber-lib:///canvas/canvas.js"))
        #expect(project.files["/README.md"]?.contains("values.scene") == true)
    }

    @Test func anOrdinaryAppIsNotACanvas() {
        #expect(!CanvasNote.isCanvas("<!doctype html><p>Habits</p>"))
        #expect(!CanvasNote.isCanvas(nil))
        #expect(!CanvasNote.isCanvas(#"{"amberApp":1,"files":{"/index.html":"<p>pinto-canvas is a word here</p>"}}"#))
    }

    @Test func theNewCanvasAskIsMadeOnceHoweverManyWindowsHearIt() {
        let ask = NewCanvas()
        ask.ask()
        #expect(ask.claim())
        #expect(!ask.claim(), "a second window doesn't make a second canvas")
        ask.ask()
        #expect(ask.claim())
    }

    // MARK: Served from the app

    @Test func theCanvasFilesAreInTheAppAndNothingElseIsServed() throws {
        let js = try #require(NotePageLibraries.canvasFile("canvas.js"))
        #expect(js.type == "text/javascript")
        #expect(js.data.count > 500_000)
        #expect(NotePageLibraries.canvasFile("canvas.css")?.type == "text/css")
        let font = try #require(NotePageLibraries.canvasFile("fonts/Excalifont/Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2"))
        #expect(font.type == "font/woff2")
        #expect(NotePageLibraries.canvasFile("../Info.plist") == nil)
        #expect(NotePageLibraries.canvasFile("fonts/x/../../Info.plist") == nil)
        #expect(NotePageLibraries.canvasFile("canvas-licenses.txt") == nil)
        // The engine's licence ships with it.
        let licence = try #require(Bundle.main.url(forResource: "canvas-licenses", withExtension: "txt"))
        #expect(try String(contentsOf: licence, encoding: .utf8).contains("Copyright (c) 2020 Excalidraw"))
        // No address of a CDN for fonts, and none of the engine's web app's keys.
        let text = String(decoding: js.data, as: UTF8.self)
        #expect(!text.contains("esm.sh") && !text.contains("unpkg.com"))
        #expect(!text.contains("AIza"))
    }

    // MARK: Two devices at once

    static func el(_ id: String, version: Int, x: Int = 0, deleted: Bool = false) -> [String: Any] {
        ["id": id, "type": "rectangle", "version": version, "x": x, "y": 0, "isDeleted": deleted]
    }

    static func scene(_ elements: [[String: Any]]) -> [String: Any] {
        ["type": "excalidraw", "version": 2, "elements": elements, "appState": [String: Any](), "files": [String: Any]()]
    }

    static func ids(_ scene: Any?) -> [String: Int] {
        Dictionary(((scene as? [String: Any])?["elements"] as? [[String: Any]] ?? []).map { ($0["id"] as! String, $0["x"] as? Int ?? 0) }, uniquingKeysWith: { a, _ in a })
    }

    @Test func drawingsFromTwoDevicesMergeByElement() {
        let base = Self.scene([Self.el("a", version: 1), Self.el("b", version: 1)])
        // Here: moved a, drew c. There: moved b, drew d.
        let mine = Self.scene([Self.el("a", version: 2, x: 10), Self.el("b", version: 1), Self.el("c", version: 1)])
        let theirs = Self.scene([Self.el("a", version: 1), Self.el("b", version: 2, x: 20), Self.el("d", version: 1)])
        let merged = CanvasNote.merge(base: base, mine: mine, theirs: theirs)
        #expect(Self.ids(merged) == ["a": 10, "b": 20, "c": 0, "d": 0])
    }

    /// An AI's arrow in the short form has no id until the board opens; merged with this device's
    /// unsynced changes it was dropped (whiteboard council round 2: the AI's arrows went missing).
    @Test func elementsWithNoIdSurviveAMerge() {
        let arrow: [String: Any] = ["type": "arrow", "x": 0, "y": 0, "width": 0, "height": 60, "start": ["id": "a"], "end": ["id": "b"]]
        let base = Self.scene([Self.el("a", version: 1)])
        let mine = Self.scene([Self.el("a", version: 2, x: 10)])
        let theirs = Self.scene([Self.el("a", version: 1), Self.el("b", version: 1), arrow])
        let merged = CanvasNote.merge(base: base, mine: mine, theirs: theirs) as? [String: Any]
        let els = (merged?["elements"] as? [[String: Any]]) ?? []
        #expect(els.filter { $0["type"] as? String == "arrow" }.count == 1, "the AI's arrow is kept, once")
        #expect(els.count == 3)
        // Merged again with itself as theirs: still once.
        let again = CanvasNote.merge(base: base, mine: merged, theirs: merged) as? [String: Any]
        #expect(((again?["elements"] as? [[String: Any]]) ?? []).filter { $0["type"] as? String == "arrow" }.count == 1)
    }

    @Test func theNewerEditWinsWhenBothMovedTheSameElement() {
        let base = Self.scene([Self.el("a", version: 1)])
        let mine = Self.scene([Self.el("a", version: 2, x: 10)])
        let theirs = Self.scene([Self.el("a", version: 5, x: 50)])
        #expect(Self.ids(CanvasNote.merge(base: base, mine: mine, theirs: theirs)) == ["a": 50])
        #expect(Self.ids(CanvasNote.merge(base: base, mine: theirs, theirs: mine)) == ["a": 50])
    }

    @Test func aDeletionOnOneDeviceStays() {
        let base = Self.scene([Self.el("a", version: 1)])
        let mine = Self.scene([Self.el("a", version: 2, deleted: true)])
        let theirs = Self.scene([Self.el("a", version: 1), Self.el("b", version: 1)])
        let merged = CanvasNote.merge(base: base, mine: mine, theirs: theirs)
        let a = ((merged as? [String: Any])?["elements"] as? [[String: Any]])?.first { $0["id"] as? String == "a" }
        #expect(a?["isDeleted"] as? Bool == true)
        #expect(Self.ids(merged).keys.sorted() == ["a", "b"])
    }

    @Test func thePageDataStoreMergesACanvasRatherThanPickingOneSide() {
        let store = NotePageDataStore(file: nil)
        let id = UUID()
        let base = ["values": ["scene": Self.scene([Self.el("a", version: 1)])], "collections": [String: Any]()] as [String: Any]
        store.take(id, server: NotePageData.encode(base))
        store.set(id, ["values": ["scene": Self.scene([Self.el("a", version: 1), Self.el("mine", version: 1)])], "collections": [String: Any]()])
        let theirs = ["values": ["scene": Self.scene([Self.el("a", version: 1), Self.el("theirs", version: 1)])], "collections": [String: Any]()] as [String: Any]
        store.take(id, server: NotePageData.encode(theirs))
        let scene = (store.doc(id)["values"] as? [String: Any])?["scene"]
        #expect(Self.ids(scene).keys.sorted() == ["a", "mine", "theirs"])
    }

    // MARK: The page

    func run(_ web: WKWebView, until: String, tries: Int = 200) async throws {
        for _ in 0..<tries {
            if (try? await web.evaluateJavaScript(until)) as? Bool == true { return }
            try await Task.sleep(for: .milliseconds(50))
        }
        Issue.record("timed out waiting for \(until)")
    }

    /// What the page reports: requests the policy refused, and every resource it loaded.
    static let watch = """
    window.__violations = [];
    addEventListener("securitypolicyviolation", (e) => __violations.push(e.blockedURI + " " + e.violatedDirective));
    """

    /// The canvas page in a sandbox at `size`, in a borderless window that is never shown, with its
    /// data kept in `doc` as the app keeps it.
    @MainActor final class Rig {
        let sandbox: NotePageSandbox
        var doc: NotePageData.Doc
        var saves = 0
        #if os(macOS)
        let window: NSWindow
        #else
        let window: UIWindow
        #endif

        init(scene: [String: Any], size: CGSize, dark: Bool) async throws {
            sandbox = NotePageSandbox(rules: try await NotePageSandbox.prepare())
            doc = ["values": ["scene": scene], "collections": [String: Any]()]
            #if os(macOS)
            window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            sandbox.webView.frame = CGRect(origin: .zero, size: size)
            window.contentView = sandbox.webView
            #else
            // In the test host's scene (a simulator has no screen anyone sees): a window without one never draws.
            if let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first {
                window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: size)
            } else {
                window = UIWindow(frame: CGRect(origin: .zero, size: size))
            }
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            sandbox.webView.frame = CGRect(origin: .zero, size: size)
            window.addSubview(sandbox.webView)
            window.isHidden = false
            #endif
            sandbox.onData = { [weak self] message in
                guard let self else { throw NotePage.OpError("Gone.") }
                let (after, _) = try NotePageData.apply(try NotePageData.Op(message), to: self.doc)
                self.doc = after
                self.saves += 1
                return ["data": after]
            }
            sandbox.load(html: CanvasNote.project, body: "Canvas", data: doc)
            sandbox.webView.configuration.userContentController.addUserScript(WKUserScript(source: CanvasTests.watch, injectionTime: .atDocumentStart, forMainFrameOnly: true, in: .page))
        }

        var scene: [String: Any]? { (doc["values"] as? [String: Any])?["scene"] as? [String: Any] }
        var elements: [[String: Any]] { scene?["elements"] as? [[String: Any]] ?? [] }

        func close() {
            sandbox.disconnect()
            #if os(macOS)
            window.close()
            #else
            window.isHidden = true
            #endif
        }
    }

    @Test func aDrawingIsSavedAsAStandardSceneAndComesBack() async throws {
        // An AI wrote the short form: the canvas fills it out and saves it back in full.
        let short: [String: Any] = Self.scene([
            ["type": "rectangle", "id": "start", "x": 0, "y": 0, "width": 180, "height": 70, "label": ["text": "Start"]],
        ])
        let rig = try await Rig(scene: short, size: CGSize(width: 900, height: 600), dark: false)
        defer { rig.close() }
        let web = rig.sandbox.webView
        try await run(web, until: "!!(window.amber && window.amber._canvas)")
        for _ in 0..<60 where rig.saves == 0 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(rig.saves >= 1, "the filled-out scene is saved back")
        #expect(rig.scene?["type"] as? String == "excalidraw")
        let start = try #require(rig.elements.first { $0["id"] as? String == "start" })
        #expect(start["seed"] is Int && start["version"] is Int, "a full element, as any Excalidraw scene has")
        #expect(rig.elements.contains { $0["type"] as? String == "text" && $0["text"] as? String == "Start" }, "its label is a bound text element")

        // A stroke on the canvas is saved after a short pause...
        let before = rig.saves
        _ = try await web.evaluateJavaScript("""
        (() => { const api = amber._canvas.api;
          const els = api.getSceneElementsIncludingDeleted();
          const r = { ...els.find((e) => e.id === "start"), id: "drawn", x: 300, version: 1, versionNonce: 7, seed: 11, boundElements: null };
          api.updateScene({ elements: [...els, r] }); return 1; })()
        """)
        for _ in 0..<60 where rig.saves == before { try await Task.sleep(for: .milliseconds(50)) }
        #expect(rig.elements.contains { $0["id"] as? String == "drawn" })

        // ...and a change from elsewhere (an AI, the other device) shows on the open canvas.
        var doc = rig.doc
        var scene = try #require(rig.scene)
        var els = try #require(scene["elements"] as? [[String: Any]])
        els.append(["type": "ellipse", "id": "fromAI", "x": 0, "y": 200, "width": 80, "height": 80])
        scene["elements"] = els
        doc["values"] = ["scene": scene]
        rig.doc = doc
        rig.sandbox.push(body: "Canvas", data: doc)
        try await run(web, until: "amber._canvas.api.getSceneElements().some((e) => e.id === 'fromAI' && e.type === 'ellipse')")
        #expect(try await web.evaluateJavaScript("amber._canvas.api.getSceneElements().some((e) => e.id === 'drawn')") as? Bool == true, "what was drawn here stays")

        // The page reached nothing outside the app, fonts included.
        let violations = try await web.evaluateJavaScript("window.__violations") as? [String]
        #expect(violations == [], "\(violations ?? [])")
        let loaded = try await web.evaluateJavaScript("performance.getEntriesByType('resource').map((e) => e.name)") as? [String] ?? []
        #expect(loaded.allSatisfy { $0.hasPrefix("amber-lib:") || $0.hasPrefix("amber-app:") }, "\(loaded)")
        #expect(rig.sandbox.blocked.isEmpty, "\(rig.sandbox.blocked)")
        try await run(web, until: "document.fonts.check('20px Excalifont')")
    }

    @Test func theLastStrokesAreSavedWhenTheCanvasCloses() async throws {
        let rig = try await Rig(scene: CanvasNote.emptyScene(), size: CGSize(width: 600, height: 400), dark: false)
        let web = rig.sandbox.webView
        try await run(web, until: "!!(window.amber && window.amber._canvas)")
        _ = try await web.evaluateJavaScript("""
        (() => { amber._canvas.api.updateScene({ elements: [{ type: "rectangle", id: "last", x: 0, y: 0, width: 10, height: 10, version: 1, versionNonce: 1, seed: 1, isDeleted: false,
          strokeColor: "#1e1e1e", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100, angle: 0,
          groupIds: [], frameId: null, roundness: null, boundElements: null, updated: 1, link: null, locked: false, index: "a0" }] }); return 1; })()
        """)
        // Closed at once, inside the save delay.
        rig.close()
        for _ in 0..<40 where !rig.elements.contains(where: { $0["id"] as? String == "last" }) { try await Task.sleep(for: .milliseconds(50)) }
        #expect(rig.elements.contains { $0["id"] as? String == "last" })
    }

    // MARK: Lag

    /// Draws in the page as a person does: pointer events on the drawing surface, inside the web
    /// view (nothing reaches the system). `amber.__lag.seed(n)` adds n strokes at once;
    /// `amber.__lag.stroke(moves, y)` draws one with the pencil. An offscreen page draws no frames,
    /// so the times it returns leave out drawing.
    static let lagKit = """
    (() => {
      const api = amber._canvas.api;
      const surface = () => document.querySelector("canvas.excalidraw__canvas.interactive") || document.querySelectorAll("canvas")[1];
      const tick = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
      const settle = async () => { await tick(); await tick(); await new Promise((r) => setTimeout(r, 0)); };
      let n = 0;
      const stroke = (i) => {
        const pts = []; for (let k = 0; k < 60; k++) pts.push([k * 3, Math.sin(k / 5) * 20]);
        return { type: "freedraw", id: "s" + i, x: (i % 30) * 30, y: Math.floor(i / 30) * 30, width: 180, height: 40, angle: 0,
          strokeColor: "#2a1d10", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100,
          groupIds: [], frameId: null, roundness: null, seed: 100 + i, version: 2, versionNonce: 7 + i, isDeleted: false, boundElements: null,
          updated: Date.now(), link: null, locked: false, points: pts, pressures: [], simulatePressure: true, lastCommittedPoint: null };
      };
      const ev = (type, x, y, buttons) => {
        const r = surface().getBoundingClientRect();
        const init = { clientX: r.left + x, clientY: r.top + y, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons, bubbles: true, cancelable: true, view: window };
        (type === "pointerdown" ? surface() : (type === "pointerup" ? window : surface())).dispatchEvent(new PointerEvent(type, init));
      };
      return {
        seed: (count) => { const els = api.getSceneElementsIncludingDeleted().slice(); for (let i = 0; i < count; i++) els.push(stroke(n++)); api.updateScene({ elements: els }); return els.length; },
        stroke: async (moves, y0 = 300) => {
          api.setActiveTool({ type: "freedraw" });
          await settle();
          const times = [];
          ev("pointerdown", 100, y0, 1);
          await settle();
          for (let k = 1; k <= moves; k++) {
            const t = performance.now();
            ev("pointermove", 100 + k * 2, y0 + Math.sin(k / 4) * 30, 1);
            await settle();
            times.push(performance.now() - t);
          }
          const t = performance.now();
          ev("pointerup", 100 + moves * 2, y0, 0);
          await settle();
          const up = performance.now() - t;
          times.sort((a, b) => a - b);
          return { saved: (amber.data.values.scene.elements || []).length, median: times[Math.floor(times.length / 2)], p90: times[Math.floor(times.length * 0.9)], up, count: api.getSceneElementsIncludingDeleted().length };
        },
      };
    })()
    """

    /// A stroke is saved once, on canvases of 10, 100 and 500 strokes, through the app's data store
    /// (to a file, as on a person's Mac), with the store's reply and the app's push back to the page.
    /// Before (13 November 2026, "it gets laggier and laggier"): two saves a stroke, because the page
    /// took its own save, back from the app, for someone else's and merged it in (every element
    /// rebuilt and redrawn) and saved again; each save cost the main thread 5, 18 and 80 ms at 10,
    /// 100 and 500 strokes (after: 2, 6 and about 25 ms, once). The times are printed (PERF), never
    /// checked.
    @Test func aStrokeIsSavedOnceHoweverBigTheDrawing() async throws {
        let rig = try await Rig(scene: CanvasNote.emptyScene(), size: CGSize(width: 1000, height: 700), dark: false)
        defer { rig.close() }
        let dir = FileManager.default.temporaryDirectory.appending(path: "canvas-lag-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: dir) }
        let store = NotePageDataStore(file: dir.appending(path: "data.json"))
        let id = UUID()
        store.set(id, rig.doc)
        var mainMs: [Double] = []
        rig.sandbox.onData = { [weak rig] message in
            guard let rig else { throw NotePage.OpError("Gone.") }
            let t = Date()
            let (after, encoded, _) = try NotePageData.applyEncoded(try NotePageData.Op(message), to: store.doc(id))
            store.set(id, after, encoded: encoded)
            mainMs.append(Date().timeIntervalSince(t) * 1000)
            rig.doc = after
            rig.saves += 1
            // The app's push of the store's change, as an echo the page must see as its own.
            Task { @MainActor in rig.sandbox.push(body: "Canvas", data: store.doc(id)) }
            return ["data": after]
        }
        let web = rig.sandbox.webView
        try await run(web, until: "!!(window.amber && window.amber._canvas)")
        _ = try await web.evaluateJavaScript("amber.__lag = \(Self.lagKit); 1")
        var have = 0
        for size in [10, 100, 500] {
            _ = try await web.callAsyncJavaScript("return amber.__lag.seed(\(size - have))", contentWorld: .page)
            have = size
            for _ in 0..<40 where (rig.elements.count < size) { try await Task.sleep(for: .milliseconds(50)) }
            try await Task.sleep(for: .milliseconds(500))
            let saves = rig.saves
            mainMs = []
            let strokes = 3
            for s in 0..<strokes {
                _ = try await web.callAsyncJavaScript("return await amber.__lag.stroke(40, \(150 + s * 120))", contentWorld: .page)
                for _ in 0..<40 where rig.saves < saves + s + 1 { try await Task.sleep(for: .milliseconds(50)) }
                // Long enough for a second save, should the echo start one.
                try await Task.sleep(for: .milliseconds(600))
            }
            #expect(rig.saves - saves == strokes, "\(size) strokes: one save a stroke, \(rig.saves - saves) for \(strokes)")
            #expect(rig.elements.count == size + strokes, "every stroke is in the saved scene: \(rig.elements.count)")
            have += strokes
            store.waitForSave()
            let mb = Double(store.docs[id]?.count ?? 0) / 1_048_576
            print("PERF canvas save strokes=\(size) scene=\(String(format: "%.2f", mb))MB saves/stroke=\(Double(rig.saves - saves) / Double(strokes)) mainMs=\(mainMs.map { Int($0.rounded()) })")
        }
    }

    // MARK: Pictures

    /// The canvas with a small flowchart, light and dark, for the hand-back: drawn only when
    /// CANVAS_SHOTS is set (TEST_RUNNER_CANVAS_SHOTS=1 for xcodebuild), into the test's temporary
    /// folder, whose path it prints.
    @Test(arguments: [false, true]) func pictures(dark: Bool) async throws {
        guard ProcessInfo.processInfo.environment["CANVAS_SHOTS"] != nil else { return }
        let chart: [[String: Any]] = [
            ["type": "rectangle", "id": "idea", "x": 0, "y": 0, "width": 200, "height": 80, "label": ["text": "An idea"], "backgroundColor": "#ffec99", "fillStyle": "solid"],
            ["type": "diamond", "id": "worth", "x": -10, "y": 160, "width": 220, "height": 120, "label": ["text": "Worth it?"]],
            ["type": "rectangle", "id": "build", "x": 320, "y": 180, "width": 180, "height": 80, "label": ["text": "Build it"], "backgroundColor": "#b2f2bb", "fillStyle": "solid"],
            ["type": "rectangle", "id": "park", "x": 0, "y": 360, "width": 200, "height": 80, "label": ["text": "Park it"]],
            ["type": "arrow", "x": 100, "y": 80, "width": 0, "height": 80, "start": ["id": "idea"], "end": ["id": "worth"]],
            ["type": "arrow", "x": 210, "y": 220, "width": 110, "height": 0, "start": ["id": "worth"], "end": ["id": "build"], "label": ["text": "yes"]],
            ["type": "arrow", "x": 100, "y": 280, "width": 0, "height": 80, "start": ["id": "worth"], "end": ["id": "park"], "label": ["text": "no"]],
            ["type": "text", "id": "title", "x": 300, "y": 20, "text": "Drawn on a canvas", "fontSize": 28],
        ]
        #if os(macOS)
        let size = CGSize(width: 1100, height: 720)
        #else
        let size = CGSize(width: 393, height: 760)
        #endif
        let rig = try await Rig(scene: Self.scene(chart), size: size, dark: dark)
        defer { rig.close() }
        let web = rig.sandbox.webView
        try await run(web, until: "!!(window.amber && window.amber._canvas)")
        try await run(web, until: "document.fonts.check('20px Excalifont')")
        #if os(iOS)
        _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.8 }); 1")
        #endif
        try await Task.sleep(for: .seconds(1.5))
        let config = WKSnapshotConfiguration()
        config.afterScreenUpdates = true
        let image = try await web.takeSnapshot(configuration: config)
        #if os(macOS)
        let png = try #require(image.tiffRepresentation.flatMap { NSBitmapImageRep(data: $0) }?.representation(using: .png, properties: [:]))
        let platform = "mac"
        #else
        let png = try #require(image.pngData())
        let platform = "iphone"
        #endif
        let dir = FileManager.default.temporaryDirectory.appending(path: "canvas-shots")
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: "canvas-\(platform)-\(dark ? "dark" : "light").png")
        try png.write(to: url)
        print("CANVAS_SHOT \(url.path)")
        Testing.Attachment.record(png, named: url.lastPathComponent)
    }
}
