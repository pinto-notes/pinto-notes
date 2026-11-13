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
        #expect(note.body == "Canvas")
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
