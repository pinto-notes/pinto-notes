import CoreGraphics
import Foundation
import ImageIO
import SwiftData
import SwiftUI
import Testing
import UniformTypeIdentifiers
import WebKit
#if os(iOS)
import UIKit
#endif
@testable import Pane

extension NetworkFaults {
/// Pictures of the whiteboard library after a sync: a library made on one device the way the app
/// makes one (shapes and a picture saved from a board, two library files imported), synced through
/// the in-memory server to the account's other device, and drawn there: in the Mac's Library
/// popover, and in the iPhone's Library sheet over a board. Drawn only when CANVAS_SHOTS is set
/// (TEST_RUNNER_CANVAS_SHOTS=dir for xcodebuild); offscreen, nothing posts input.
@MainActor @Suite(.sealedAccount) struct LibrarySyncPictureTests {
    init() {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
    }

    /// The stores and engines the libraries synced with; kept until the test ends.
    struct Synced {
        let made: CanvasLibrary
        let synced: CanvasLibrary
        let keep: [Any]
    }

    static var shotsFolder: URL? { ProcessInfo.processInfo.environment["CANVAS_SHOTS"].map { URL(fileURLWithPath: $0) } }

    /// An orange leaf on a clear square, as a PNG: the picture inside a library item.
    static func leaf(_ side: Int = 96) -> Data {
        let ctx = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        let s = CGFloat(side)
        let path = CGMutablePath()
        path.move(to: CGPoint(x: s * 0.15, y: s * 0.15))
        path.addCurve(to: CGPoint(x: s * 0.85, y: s * 0.85), control1: CGPoint(x: s * 0.15, y: s * 0.8), control2: CGPoint(x: s * 0.5, y: s * 0.85))
        path.addCurve(to: CGPoint(x: s * 0.15, y: s * 0.15), control1: CGPoint(x: s * 0.85, y: s * 0.5), control2: CGPoint(x: s * 0.8, y: s * 0.15))
        ctx.addPath(path)
        ctx.setFillColor(CGColor(srgbRed: 0.96, green: 0.52, blue: 0.17, alpha: 1))
        ctx.fillPath()
        ctx.setStrokeColor(CGColor(srgbRed: 0.55, green: 0.27, blue: 0.05, alpha: 1))
        ctx.setLineWidth(s * 0.03)
        ctx.move(to: CGPoint(x: s * 0.15, y: s * 0.15))
        ctx.addLine(to: CGPoint(x: s * 0.7, y: s * 0.7))
        ctx.strokePath()
        let out = NSMutableData()
        let dest = CGImageDestinationCreateWithData(out, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
        CGImageDestinationFinalize(dest)
        return out as Data
    }

    /// An element with every field Excalidraw keeps, as its library files have them.
    static func element(_ e: [String: Any]) -> [String: Any] {
        let base: [String: Any] = ["id": UUID().uuidString, "x": 0, "y": 0, "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
                                   "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid", "roughness": 1, "opacity": 100, "groupIds": [String](),
                                   "frameId": NSNull(), "roundness": NSNull(), "seed": 7, "version": 1, "versionNonce": 1, "isDeleted": false,
                                   "boundElements": NSNull(), "updated": 1, "link": NSNull(), "locked": false]
        return base.merging(e) { $1 }
    }

    /// Two library files, as Import Library… takes them.
    static var basicShapes: Data {
        CanvasLibraryFile.data([
            CanvasLibraryItem(name: "Triangle", elements: [element(["type": "line", "width": 120, "height": 100, "backgroundColor": "#ced4da", "polygon": true,
                                                                    "points": [[0, 0], [60, -100], [120, 0], [0, 0]]])])!,
            CanvasLibraryItem(name: "Circle", elements: [element(["type": "ellipse", "width": 100, "height": 100, "backgroundColor": "#ffec99"])])!,
        ])
    }

    static var dataFlow: Data {
        CanvasLibraryFile.data([
            CanvasLibraryItem(name: "Process", elements: [element(["type": "rectangle", "width": 180, "height": 80, "backgroundColor": "#a5d8ff", "roundness": ["type": 3]])])!,
            CanvasLibraryItem(name: "Decision", elements: [element(["type": "diamond", "width": 140, "height": 100, "backgroundColor": "#ffc9c9"])])!,
            CanvasLibraryItem(name: "Flow", elements: [element(["type": "arrow", "width": 160, "height": 0, "points": [[0, 0], [160, 0]], "endArrowhead": "arrow"])])!,
        ])
    }

    func engine(_ library: CanvasLibrary) throws -> (SyncEngine, ModelContainer) {
        let container = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: SealedAccount.user),
                                context: ModelContext(container), defaults: MemoryDefaults(), library: library)
        library.onChange = nil
        library.onLook = nil
        return (engine, container)
    }

    /// A library made on a board, and the same library on the account's other device after a sync each.
    func synced() async throws -> Synced {
        let made = CanvasLibrary(folder: nil), synced = CanvasLibrary(folder: nil)
        _ = made.importLibrary(Self.basicShapes, source: "Basic shapes")
        _ = made.importLibrary(Self.dataFlow, source: "Data flow")
        let j = try await CanvasNativeUITests.Joined(scene: CanvasNativeUITests.flowchart)
        defer { j.close() }
        try await j.ready()
        // Nothing selected, as the page says it: the next selection is the one saved.
        func clear() async throws {
            _ = try await j.js("(() => { amber._canvas.api.updateScene({ appState: { selectedElementIds: {} } }); return 1; })()")
            await j.until("nothing selected") { !j.canvas.state.hasSelection }
        }
        // Two shapes saved from the board, as Save to Library saves them.
        for shape in ["e.type === 'ellipse'", "e.type === 'rectangle' && e.backgroundColor === '#b2f2bb'"] {
            try await clear()
            _ = try await j.js("(() => { const api = amber._canvas.api; const ids = {}; api.getSceneElements().filter((e) => \(shape)).forEach((e) => { ids[e.id] = true }); api.updateScene({ appState: { selectedElementIds: ids } }); return 1; })()")
            await j.until("selected") { j.canvas.state.hasSelection }
            #expect(await j.canvas.saveSelectionToLibrary(made) != nil)
        }
        // And a picture.
        try await clear()
        let url = "data:image/png;base64," + Self.leaf().base64EncodedString()
        _ = try await j.js("(() => { const api = amber._canvas.api; api.addFiles([{ id: 'leaf', dataURL: '\(url)', mimeType: 'image/png', created: 1 }]); api.updateScene({ elements: [...api.getSceneElements(), { type: 'image', id: 'img', fileId: 'leaf', x: 0, y: 420, width: 96, height: 96, angle: 0, strokeColor: 'transparent', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: null, updated: 1, link: null, locked: false, status: 'saved', scale: [1, 1] }], appState: { selectedElementIds: { img: true } } }); return 1; })()")
        await j.until("the picture is selected") { j.canvas.state.hasSelection }
        let logo = try #require(await j.canvas.saveSelectionToLibrary(made))
        made.rename(logo.id, to: "Leaf logo")

        let (one, a) = try engine(made), (other, b) = try engine(synced)
        await one.sync()
        await other.sync()
        #expect(synced.items.map(\.title) == made.items.map(\.title) && synced.items.map(\.source) == made.items.map(\.source))
        #expect(CanvasLibraryGrid(synced.items).groups.map(\.title) == ["Saved", "Data flow", "Basic shapes"])
        #expect(made.items.prefix(3).map(\.title) == ["Leaf logo", "Publish", "Idea"], "each save took what was selected then")
        let picture = synced.items.first { $0.name == "Leaf logo" }
        #expect((picture?.files["leaf"] as? [String: Any])?["dataURL"] as? String == url, "the picture came with it")
        return Synced(made: made, synced: synced, keep: [one, other, a, b])
    }

    #if os(macOS)
    @Test func theLibraryOnTheMacAfterASync() async throws {
        guard let dir = Self.shotsFolder else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let s = try await synced()
        // The board draws each item's picture, as the popover asks it to.
        let j = try await CanvasNativeUITests.Joined()
        defer { j.close() }
        try await j.ready()
        await j.canvas.drawThumbnails(s.synced)
        #expect(s.synced.items.allSatisfy { s.synced.thumbnails[$0.id] != nil }, "every item has its picture")
        for dark in [false, true] {
            let rep = try await CanvasNativeUITests.libraryPopoverPicture(canvas: j.canvas, library: s.synced, dark: dark)
            let url = dir.appending(path: "library-sync-mac-\(dark ? "dark" : "light").png")
            try #require(rep.representation(using: .png, properties: [:])).write(to: url)
            print("CANVAS_SHOT \(url.path)")
        }
        _ = s.keep
    }
    #endif

    #if os(iOS)
    nonisolated(unsafe) static var keptStores: [ModelContainer] = []

    /// How far the colours in part of a picture (fractions of its width and height) stray from
    /// one another: the widest range of any channel, 0 to 255.
    static func spread(_ image: UIImage, x: ClosedRange<Double>, y: ClosedRange<Double>) -> Int? {
        guard let cg = image.cgImage else { return nil }
        let w = cg.width, h = cg.height
        var px = [UInt8](repeating: 0, count: w * h * 4)
        guard let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        var lo = [255, 255, 255], hi = [0, 0, 0]
        for row in Int(y.lowerBound * Double(h))..<Int(y.upperBound * Double(h)) {
            for col in Int(x.lowerBound * Double(w))..<Int(x.upperBound * Double(w)) {
                let i = (row * w + col) * 4
                for k in 0..<3 { lo[k] = min(lo[k], Int(px[i + k])); hi[k] = max(hi[k], Int(px[i + k])) }
            }
        }
        return (0..<3).map { hi[$0] - lo[$0] }.max()
    }

    @Test func theLibraryOnTheIPhoneAfterASync() async throws {
        guard let dir = Self.shotsFolder else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let s = try await synced()
        let kept = CanvasLibrary.shared
        CanvasLibrary.shared = s.synced
        defer { CanvasLibrary.shared = kept }

        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let note = CanvasNote.make(in: .all, context: c.mainContext)
        note.body = "Publishing flow"
        NotePageDataStore.shared.set(note.id, ["values": ["scene": CanvasNativeUITests.flowchart], "collections": [String: Any]()])
        try c.mainContext.save()
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = UIHostingController(rootView: NavigationStack {
            NoteDetailView(note: note, controller: EditorController(), onNewNote: {})
        }.modelContainer(c).tint(Color(PColor.paneAccent)))
        window.isHidden = false
        Self.keptStores.append(c)
        defer { window.isHidden = true; window.rootViewController = nil }
        try await Task.sleep(for: .seconds(3))
        func find(_ v: UIView) -> WKWebView? { (v as? WKWebView) ?? v.subviews.lazy.compactMap(find).first }
        let web = try #require(find(window))
        _ = try await web.evaluateJavaScript("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85 }); 1")
        let board = try #require(BoardPicture.board(note.id))

        @discardableResult func shot(_ name: String) throws -> UIImage {
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            let url = dir.appending(path: "\(name).png")
            try #require(image.pngData()).write(to: url)
            print("CANVAS_SHOT \(url.path)")
            return image
        }
        try await Task.sleep(for: .seconds(1))
        try shot("library-sync-iphone-dock")

        // The dock's Library button opens the sheet: the same items, groups and order as the Mac's.
        board.showingLibrary = true
        for _ in 0..<150 where !s.synced.items.allSatisfy({ s.synced.thumbnails[$0.id] != nil }) { try await Task.sleep(for: .milliseconds(100)) }
        #expect(window.rootViewController?.presentedViewController != nil, "the sheet is up")
        #expect(s.synced.items.allSatisfy { s.synced.thumbnails[$0.id] != nil }, "the board drew each item's picture")
        for dark in [false, true] {
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            try await Task.sleep(for: .seconds(1.5))
            let image = try shot("library-sync-iphone-\(dark ? "dark" : "light")")
            // The sheet is solid: over the dock, in the last row's empty fourth column, it's one
            // colour (round 12: the dock's pencil, Aa, eraser and colour well read through).
            let spread = try #require(Self.spread(image, x: 0.74...0.88, y: 0.93...0.965))
            #expect(spread < 10, "nothing reads through the sheet over the dock (\(dark ? "dark" : "light")): channels vary by \(spread)")
        }
        // A tap puts it on the board (CanvasLibrarySheet.add), and the sheet goes.
        let count = "amber._canvas.api.getSceneElements().length"
        let before = try await web.evaluateJavaScript(count) as? Int ?? 0
        board.showingLibrary = false
        board.insert(try #require(s.synced.items.first { $0.name == "Leaf logo" }))
        window.overrideUserInterfaceStyle = .light
        try await Task.sleep(for: .seconds(2))
        try shot("library-sync-iphone-added")
        #expect(try await web.evaluateJavaScript(count) as? Int ?? 0 > before, "the picture is on the board")
        _ = s.keep
    }
    #endif
}
}
