#if os(iOS)
import Foundation
import SwiftData
import SwiftUI
import Testing
import UIKit
import WebKit
@testable import Pane

/// Comments on the iPhone board (Pane/Views/BoardCommentPhone.swift): the Comment tool on the dock,
/// a tap on the board pins a comment there, the thread in a sheet over the lower half with its pin
/// above it, the Comments list in a sheet, on a board shared with someone on a Mac.
///
/// The app's own note view in a window of the simulator's test host. Nothing posts input: the
/// app's buttons are pressed through accessibility, as VoiceOver presses them, and a tap on the
/// board is the page's own touch events. Pictures when CANVAS_SHOTS names a folder
/// (TEST_RUNNER_CANVAS_SHOTS=dir for xcodebuild).
@MainActor @Suite(.serialized) struct BoardCommentPhoneTests {
    /// The stores outlive the tests: a hidden window can still draw its note after its store has gone.
    nonisolated(unsafe) static var keptStores: [ModelContainer] = []

    static let elements: [[String: Any]] = [
        ["type": "rectangle", "id": "idea", "x": 0, "y": 0, "width": 180, "height": 90, "label": ["text": "Idea"], "backgroundColor": "#ffec99", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "rectangle", "id": "draft", "x": 0, "y": 200, "width": 180, "height": 90, "label": ["text": "Draft"], "roundness": ["type": 3]],
        ["type": "rectangle", "id": "publish", "x": 0, "y": 400, "width": 180, "height": 90, "label": ["text": "Publish"], "backgroundColor": "#b2f2bb", "fillStyle": "solid", "roundness": ["type": 3]],
        ["type": "arrow", "id": "a1", "x": 90, "y": 92, "width": 0, "height": 106, "start": ["id": "idea"], "end": ["id": "draft"]],
        ["type": "arrow", "id": "a2", "x": 90, "y": 292, "width": 0, "height": 106, "start": ["id": "draft"], "end": ["id": "publish"]],
    ]

    /// Accessibility on in the test host, as VoiceOver or Voice Control turn it on: SwiftUI builds
    /// what it says of a view (its buttons, their names and frames) only then.
    static let accessibilityOn: Bool = {
        let root = ProcessInfo.processInfo.environment["IPHONE_SIMULATOR_ROOT"] ?? ""
        guard let lib = dlopen(root + "/usr/lib/libAccessibility.dylib", RTLD_LOCAL) ?? dlopen("/usr/lib/libAccessibility.dylib", RTLD_LOCAL) else {
            print("AX: no libAccessibility at \(root)"); return false
        }
        typealias SetEnabled = @convention(c) (Int32) -> Void
        typealias Enabled = @convention(c) () -> Int32
        guard let set = dlsym(lib, "_AXSSetAutomationEnabled"), let get = dlsym(lib, "_AXSAutomationEnabled") else { print("AX: no symbols"); return false }
        unsafeBitCast(set, to: SetEnabled.self)(1)
        let on = unsafeBitCast(get, to: Enabled.self)() != 0
        print("AX: automation \(on)")
        return on
    }()

    /// A board open on the phone, as the app opens a note.
    @MainActor final class Phone {
        let window: UIWindow
        let note: Note
        let canvas: CanvasController
        let web: WKWebView

        init(title: String = "Launch plan", dark: Bool = false) async throws {
            _ = BoardCommentPhoneTests.accessibilityOn
            let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
            let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
            BoardCommentPhoneTests.keptStores.append(c)
            let made = CanvasNote.make(in: .all, context: c.mainContext, scene: CanvasTests.scene(BoardCommentPhoneTests.elements), named: title)
            note = made
            try c.mainContext.save()
            window = UIWindow(windowScene: scene)
            window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
            window.overrideUserInterfaceStyle = dark ? .dark : .light
            window.rootViewController = UIHostingController(rootView: NavigationStack {
                NoteDetailView(note: made, controller: EditorController(), onNewNote: {})
            }.modelContainer(c).tint(Color(PColor.paneAccent)))
            window.isHidden = false
            var found: CanvasController?
            for _ in 0..<200 {
                found = BoardPicture.board(made.id)
                if found?.connected == true { break }
                try await Task.sleep(for: .milliseconds(30))
            }
            canvas = try #require(found, "the board opened")
            func find(_ v: UIView) -> WKWebView? { (v as? WKWebView) ?? v.subviews.lazy.compactMap(find).first }
            web = try #require(find(window))
            try await CanvasTests().run(web, until: "!!(window.amber && window.amber._canvas)")
            for _ in 0..<100 where !canvas.connected { try await Task.sleep(for: .milliseconds(30)) }
            canvas.seenStore = BoardComments.Seen(defaults: TestDefaults())
        }

        func close() {
            window.rootViewController?.dismiss(animated: false)
            window.isHidden = true
            window.rootViewController = nil
        }

        func js(_ s: String) async throws -> Any? { try await web.evaluateJavaScript(s) }

        func json(_ expression: String) async throws -> [String: Any] {
            let s = try await js("JSON.stringify(\(expression))") as? String ?? "{}"
            return (try JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any]) ?? [:]
        }

        func until(_ what: String, _ ok: () -> Bool) async {
            for _ in 0..<150 where !ok() { try? await Task.sleep(for: .milliseconds(30)) }
            #expect(ok(), "\(what)")
        }

        /// Everything accessibility has in the window (the sheets' too), by identifier.
        func elements() -> [(id: String, element: NSObject)] {
            var out: [(String, NSObject)] = []
            var seen = Set<ObjectIdentifier>()
            func walk(_ o: NSObject, _ depth: Int) {
                guard depth < 80, seen.insert(ObjectIdentifier(o)).inserted else { return }
                let pick = NSSelectorFromString("accessibilityIdentifier")
                if o.responds(to: pick), let id = o.perform(pick)?.takeUnretainedValue() as? String, !id.isEmpty { out.append((id, o)) }
                if let list = o.accessibilityElements as? [NSObject] {
                    for e in list { walk(e, depth + 1) }
                } else {
                    let n = o.accessibilityElementCount()
                    if n != NSNotFound, n > 0 { for i in 0..<n { if let e = o.accessibilityElement(at: i) as? NSObject { walk(e, depth + 1) } } }
                }
                if let v = o as? UIView { for s in v.subviews where !s.isHidden { walk(s, depth + 1) } }
            }
            walk(window, 0)
            return out
        }

        func ids() -> [String] { elements().map(\.id) }

        /// What accessibility has in the window, for a failure's message: how many, and their names.
        func described() -> String {
            var labels: [String] = []
            var n = 0
            func walk(_ o: NSObject, _ depth: Int) {
                guard depth < 80 else { return }
                n += 1
                if let l = o.accessibilityLabel, !l.isEmpty, labels.count < 40 { labels.append("\(type(of: o)):\(l)") }
                if let list = o.accessibilityElements as? [NSObject] { for e in list { walk(e, depth + 1) } }
                if let v = o as? UIView { for s in v.subviews where !s.isHidden { walk(s, depth + 1) } }
            }
            walk(window, 0)
            return "\(n) nodes: \(labels)"
        }
        func find(_ id: String) -> NSObject? { elements().first { $0.id == id }?.element }

        /// Presses a button as VoiceOver does: its own activation, or, for a bar button (UIKit's,
        /// which leaves it to a tap), its control's action.
        @discardableResult func press(_ id: String) -> Bool {
            guard let e = find(id) else { return false }
            if e.accessibilityActivate() { return true }
            func control(_ v: UIView) -> UIControl? { (v as? UIControl) ?? v.subviews.lazy.compactMap(control).first }
            guard let view = e as? UIView, let c = control(view) else { return false }
            c.sendActions(for: .primaryActionTriggered)
            c.sendActions(for: .touchUpInside)
            return true
        }

        /// Waits for an element to be there (a sheet slides up first).
        func appears(_ id: String) async -> NSObject? {
            for _ in 0..<100 { if let e = find(id) { return e }; try? await Task.sleep(for: .milliseconds(40)) }
            return nil
        }

        /// A tap on the board at a point of the board, as a finger's touch events reach the page.
        func tap(_ x: Double, _ y: Double) async throws {
            _ = try await js("""
            (() => { const api = amber._canvas.api, s = api.getAppState(), z = s.zoom.value;
              const c = document.querySelector('canvas.excalidraw__canvas.interactive') || document.querySelectorAll('canvas')[1];
              const o = { clientX: (\(x) + s.scrollX) * z + s.offsetLeft, clientY: (\(y) + s.scrollY) * z + s.offsetTop, bubbles: true, cancelable: true, button: 0, pointerType: 'touch', isPrimary: true, pointerId: 7 };
              c.dispatchEvent(new PointerEvent('pointerdown', o)); c.dispatchEvent(new PointerEvent('pointerup', o)); return 1; })()
            """)
        }

        /// Where a point of the board is in the window.
        func onScreen(_ x: Double, _ y: Double) async throws -> CGPoint {
            let v = try await json("(() => { const s = amber._canvas.api.getAppState(), z = s.zoom.value; return { x: (\(x) + s.scrollX) * z + s.offsetLeft, y: (\(y) + s.scrollY) * z + s.offsetTop }; })()")
            let p = CGPoint(x: v["x"] as? Double ?? .nan, y: v["y"] as? Double ?? .nan)
            return web.convert(p, to: window)
        }

        func picture(_ name: String, in dir: URL) async throws {
            try await Task.sleep(for: .seconds(0.8))
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3
            let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
            }
            let url = dir.appending(path: "\(name)-\(window.overrideUserInterfaceStyle == .dark ? "dark" : "light").png")
            try #require(image.pngData()).write(to: url)
            print("CANVAS_SHOT \(url.path)")
        }
    }

    /// A board Emil shares with Sara: the phone's board joined to Emil's session, Sara's on a Mac.
    struct Shared {
        let people: BoardPeople
        let emil: CollabSession
        let sara: CollabSession
        let saraID: UUID
        /// The devices' stores: their sessions use them until the test ends.
        let devices: [BoardPeople.Device]
    }

    func share(_ phone: Phone) async throws -> Shared {
        let people = BoardPeople()
        let (emilDevice, others, note) = try await people.share(CanvasTests.scene(Self.elements), people: ["Sara"], title: phone.note.title)
        let emil = try people.session(emilDevice, note), sara = try people.session(others[0], note)
        Self.keptStores += ([emilDevice] + others).map(\.container)
        BoardCollab.wire(emil, phone.canvas)
        await people.server.eventually { phone.canvas.shared }
        return Shared(people: people, emil: emil, sara: sara, saraID: others[0].id, devices: [emilDevice] + others)
    }

    // MARK: Writing a comment

    /// The Comment tool on the dock; a tap on a shape pins a comment on it; the composer opens in a
    /// sheet with the pin above it; the comment posted, its thread in the sheet; a reply, Resolve,
    /// your own edited and deleted. Into the board's shared document: Sara, on her Mac, has it.
    @Test func theCommentToolPinsACommentWhereYouTap() async throws {
        let phone = try await Phone()
        defer { phone.close() }
        // The dock is the same on a board of your own as on a shared one, Comment and the library
        // with the tools (round 13: the sync and library pictures had no Comment button).
        _ = await phone.appears("canvas.tool.comment")
        let dock = { Set(phone.ids().filter { $0.hasPrefix("canvas.tool.") }) }
        let ownDock = dock()
        #expect(ownDock.isSuperset(of: ["canvas.tool.selection", "canvas.tool.freedraw", "canvas.tool.arrow", "canvas.tool.text", "canvas.tool.eraser", "canvas.tool.library", "canvas.tool.comment"]), "\(ownDock)")
        let shared = try await share(phone)
        defer { BoardCollab.unwire(shared.emil, phone.canvas) }
        try await Task.sleep(for: .milliseconds(300))
        #expect(dock() == ownDock, "the shared board's dock: \(dock()) against \(ownDock)")
        let hers = CanvasController()
        BoardCollab.wire(shared.sara, hers)
        defer { BoardCollab.unwire(shared.sara, hers) }

        // The tool, on the dock: pressed, it's picked, and the bar above the dock says what to do.
        let tool = try #require(await phone.appears("canvas.tool.comment"), "the Comment tool is on the dock: \(phone.ids()) \(phone.described())")
        #expect(tool.accessibilityLabel == BoardCommentUI.comment)
        #expect(phone.press("canvas.tool.comment"))
        await phone.until("the Comment tool is picked") { phone.canvas.state.tool == .comment }
        #expect(await phone.appears("canvas.comment.hint")?.accessibilityLabel == CanvasPhoneComments.hint)
        let list = try #require(await phone.appears("canvas.comments"))
        #expect(list.accessibilityFrame.height >= 44 - 0.5, "the Comments button is 44 points tall: \(list.accessibilityFrame)")

        // A tap a quarter of the way into Draft: the comment goes on Draft, there.
        try await phone.tap(45, 222.5)
        await phone.until("a new comment, on Draft") { phone.canvas.draft != nil }
        #expect(phone.canvas.draft == BoardComments.Place(on: "draft", x: 0.25, y: 0.25))
        await phone.until("the tool is put down") { phone.canvas.state.tool == .selection }
        // The composer, in a sheet; the pin moved up above it.
        #expect(await phone.appears("comment.composer") != nil, "\(phone.ids())")
        #expect(phone.canvas.sent.contains(.focusComment("draft", above: BoardCommentUI.sheetRoom)))
        try await Task.sleep(for: .milliseconds(500))
        let pin = try await phone.onScreen(45, 222.5)
        #expect(pin.y <= phone.window.bounds.height * BoardCommentUI.sheetRoom + 1, "the pin is above the sheet: \(pin.y) of \(phone.window.bounds.height)")

        // Posted (the field's own send): its thread in the sheet, and Sara has it.
        let posted = try #require(phone.canvas.post("Can we make this the first step?"))
        await phone.until("its thread is open") { phone.canvas.openThread == posted.id }
        #expect(await phone.appears("comment.thread") != nil, "\(phone.ids())")
        await shared.people.server.eventually { hers.threads.contains { $0.id == posted.id } }
        #expect(hers.threads.first { $0.id == posted.id }?.first.on == "draft", "the same document as the Mac's")

        // Sara replies on her Mac, mentioning Emil; the phone's thread has it.
        _ = hers.reply(to: posted.id, "@Emil yes, let's do that")
        await shared.people.server.eventually { phone.canvas.threads.first { $0.id == posted.id }?.replies.count == 1 }
        #expect(phone.canvas.threads.first { $0.id == posted.id }?.replies.first?.text == "@Emil yes, let's do that")
        // Emil replies from the phone.
        #expect(phone.canvas.reply(to: posted.id, "Done") != nil)
        await shared.people.server.eventually { hers.threads.first { $0.id == posted.id }?.replies.count == 2 }

        // Your own comment's ⋯ is there, 44 points square; Sara's has none.
        let more = phone.elements().filter { $0.id == "comment.more" }
        #expect(more.count == 2, "yours: the comment and your reply: \(phone.ids())")
        // In the sheet's own points (the sheet is drawn a little smaller while it's at half height).
        let sheet = try #require(phone.window.rootViewController?.presentedViewController?.view)
        let scale = sheet.convert(sheet.bounds, to: nil).width / sheet.bounds.width
        #expect(more.allSatisfy { $0.element.accessibilityFrame.width / scale >= 43.5 && $0.element.accessibilityFrame.height / scale >= 43.5 }, "\(more.map(\.element.accessibilityFrame)) at \(scale)")
        // Edited and deleted (what the ⋯ menu's Edit and Delete do; the ask is a dialog on a phone).
        #expect(phone.canvas.edit(posted.id, "Can this be the first step?") != nil)
        let reply = try #require(phone.canvas.threads.first { $0.id == posted.id }?.replies.last)
        phone.canvas.delete(reply.id)
        await shared.people.server.eventually { hers.comments.first { $0.id == reply.id }?.deleted == true && hers.comments.first { $0.id == posted.id }?.text == "Can this be the first step?" }
        #expect(hers.comments.first { $0.id == posted.id }?.edited != nil)

        // Resolve, the sheet's one action: resolved for both, and the thread closes (as on the Mac).
        #expect(phone.press("comment.resolve"), "\(phone.ids())")
        await shared.people.server.eventually { hers.threads.first { $0.id == posted.id }?.resolved == true }
        #expect(phone.canvas.threads.first { $0.id == posted.id }?.resolved == true && phone.canvas.openThread == nil)
        for _ in 0..<50 where phone.window.rootViewController?.presentedViewController != nil { try await Task.sleep(for: .milliseconds(40)) }
        #expect(phone.window.rootViewController?.presentedViewController == nil, "the sheet went")

        // Opened again from its pin: Open Again is there; the close button closes it.
        phone.canvas.open(thread: posted.id)
        #expect(await phone.appears("comment.thread") != nil)
        #expect(phone.find("comment.resolve")?.accessibilityLabel == BoardCommentUI.reopen)
        #expect(phone.press("comment.close"), "\(phone.ids())")
        await phone.until("the thread closes") { phone.canvas.openThread == nil }
        for _ in 0..<50 where phone.window.rootViewController?.presentedViewController != nil { try await Task.sleep(for: .milliseconds(40)) }
        #expect(phone.window.rootViewController?.presentedViewController == nil)
    }

    // MARK: The list

    /// The Comments list in a sheet: the latest first, each row saying who, when, what and where
    /// ("on Draft · 1 reply"), an unread dot on what Sara wrote; Show resolved shows the resolved
    /// ones. A row opens its thread in its own sheet once the list has gone.
    @Test func theCommentsListOpensAThread() async throws {
        let phone = try await Phone()
        defer { phone.close() }
        // The dock is the same on a board of your own as on a shared one, Comment and the library
        // with the tools (round 13: the sync and library pictures had no Comment button).
        _ = await phone.appears("canvas.tool.comment")
        let dock = { Set(phone.ids().filter { $0.hasPrefix("canvas.tool.") }) }
        let ownDock = dock()
        #expect(ownDock.isSuperset(of: ["canvas.tool.selection", "canvas.tool.freedraw", "canvas.tool.arrow", "canvas.tool.text", "canvas.tool.eraser", "canvas.tool.library", "canvas.tool.comment"]), "\(ownDock)")
        let shared = try await share(phone)
        defer { BoardCollab.unwire(shared.emil, phone.canvas) }
        try await Task.sleep(for: .milliseconds(300))
        #expect(dock() == ownDock, "the shared board's dock: \(dock()) against \(ownDock)")
        let hers = CanvasController()
        BoardCollab.wire(shared.sara, hers)
        defer { BoardCollab.unwire(shared.sara, hers) }
        // Emil's comment on Draft, Sara's reply from her Mac; his on Publish, resolved.
        phone.canvas.receive(["comment": ["new": ["on": "publish", "x": 1, "y": 0]]])
        let done = try #require(phone.canvas.post("Friday"))
        phone.canvas.resolve(done.id)
        phone.canvas.receive(["comment": ["new": ["on": "draft", "x": 1, "y": 0]]])
        let open = try #require(phone.canvas.post("Shorter?"))
        phone.canvas.closeThread()
        await shared.people.server.eventually { hers.threads.count == 2 }
        _ = hers.reply(to: open.id, "Yes, half")
        await shared.people.server.eventually { phone.canvas.threads.first { $0.id == open.id }?.replies.count == 1 }
        #expect(phone.canvas.unseen, "Sara's reply: the quiet dot")

        // The Comment tool's bar has the list.
        phone.canvas.startCommenting()
        await phone.until("the Comment tool is picked") { phone.canvas.state.tool == .comment }
        #expect(phone.press("canvas.comments"))
        #expect(await phone.appears("comments.list") != nil, "\(phone.ids())")
        await phone.until("the list's open") { phone.canvas.showingComments }
        #expect(!phone.canvas.unseen, "seen, once the list is open")
        var rows = phone.elements().filter { $0.id == "comments.row" }
        #expect(rows.count == 1, "the open thread; the resolved one hidden: \(phone.ids())")
        let sheet = try #require(phone.window.rootViewController?.presentedViewController?.view)
        let scale = sheet.convert(sheet.bounds, to: nil).width / sheet.bounds.width
        #expect(rows.allSatisfy { $0.element.accessibilityFrame.height / scale >= 43.5 }, "\(rows.map(\.element.accessibilityFrame))")
        // The row reads as one: who, when, what, where.
        let said = rows.first?.element.accessibilityLabel ?? ""
        #expect(said.contains("Emil") && said.contains("Shorter?") && said.contains("on Draft") && said.contains("1 reply"), "\(said)")
        #expect(phone.find("comments.showResolved") != nil)
        phone.canvas.showResolved = true
        for _ in 0..<50 where phone.elements().filter({ $0.id == "comments.row" }).count < 2 { try await Task.sleep(for: .milliseconds(40)) }
        rows = phone.elements().filter { $0.id == "comments.row" }
        #expect(rows.count == 2, "\(phone.ids())")
        phone.canvas.showResolved = false
        for _ in 0..<50 where phone.elements().filter({ $0.id == "comments.row" }).count > 1 { try await Task.sleep(for: .milliseconds(40)) }

        // A row: the list goes, and the thread opens in its own sheet.
        #expect(phone.press("comments.row"), "\(phone.ids())")
        await phone.until("the thread opens") { phone.canvas.openThread == open.id && !phone.canvas.showingComments }
        #expect(await phone.appears("comment.thread") != nil, "\(phone.ids())")
    }

    // MARK: Pictures

    /// The pin, the thread and the list, light and dark, on a board Emil shares with Sara.
    @Test func iPhoneCommentPictures() async throws {
        guard let path = ProcessInfo.processInfo.environment["CANVAS_SHOTS"] else { return }
        let dir = URL(fileURLWithPath: path)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for dark in [false, true] {
            let phone = try await Phone(dark: dark)
            defer { phone.close() }
            let shared = try await share(phone)
            defer { BoardCollab.unwire(shared.emil, phone.canvas) }
            let hers = CanvasController()
            BoardCollab.wire(shared.sara, hers)
            defer { BoardCollab.unwire(shared.sara, hers) }
            _ = try await phone.js("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.7, animate: false }); 1")
            try await Task.sleep(for: .milliseconds(400))
            // Sara's comment on Idea (from her Mac), and Emil's on Publish.
            hers.receive(["comment": ["new": ["on": "idea", "x": 1, "y": 0]]])
            let hersPosted = try #require(hers.post("Should this say who it's for?"))
            hers.closeThread()
            await shared.people.server.eventually { phone.canvas.threads.contains { $0.id == hersPosted.id } }
            phone.canvas.receive(["comment": ["new": ["on": "publish", "x": 1, "y": 0]]])
            let mine = try #require(phone.canvas.post("Friday, after the review"))
            phone.canvas.closeThread()
            await shared.people.server.eventually { hers.threads.contains { $0.id == mine.id } }
            #expect(hers.reply(to: mine.id, "@Emil works for me") != nil)
            await shared.people.server.eventually { phone.canvas.threads.first { $0.id == mine.id }?.replies.count == 1 }

            func fit() async throws {
                _ = try await phone.js("amber._canvas.api.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.62, animate: false }); 1")
                try await Task.sleep(for: .milliseconds(300))
            }
            try await fit()
            // 1. The Comment tool picked: the bar above the dock, and the pins.
            phone.canvas.startCommenting()
            await phone.until("the Comment tool is picked") { phone.canvas.state.tool == .comment }
            try await phone.picture("comments-iphone-1-tool", in: dir)
            // 2. A tap on Draft: the composer in its sheet, the pin above it.
            let (x, y) = (45.0, 222.5)
            try await phone.tap(x, y)
            await phone.until("the composer") { phone.canvas.draft != nil }
            _ = await phone.appears("comment.composer")
            try await phone.picture("comments-iphone-2-new", in: dir)
            phone.canvas.closeThread()
            for _ in 0..<50 where phone.window.rootViewController?.presentedViewController != nil { try await Task.sleep(for: .milliseconds(40)) }
            try await fit()
            // 3. Sara's thread with Emil's reply, in its sheet.
            _ = phone.canvas.reply(to: hersPosted.id, "Yes: for people new to the board")
            phone.canvas.open(thread: hersPosted.id)
            _ = await phone.appears("comment.thread")
            try await phone.picture("comments-iphone-3-thread", in: dir)
            phone.canvas.closeThread()
            for _ in 0..<50 where phone.window.rootViewController?.presentedViewController != nil { try await Task.sleep(for: .milliseconds(40)) }
            try await fit()
            // 4. The list.
            phone.canvas.showingComments = true
            for _ in 0..<50 where phone.window.rootViewController?.presentedViewController == nil { try await Task.sleep(for: .milliseconds(40)) }
            #expect(phone.window.rootViewController?.presentedViewController != nil, "the list's sheet is up")
            try await phone.picture("comments-iphone-4-list", in: dir)
            phone.canvas.showingComments = false
            for _ in 0..<50 where phone.window.rootViewController?.presentedViewController != nil { try await Task.sleep(for: .milliseconds(40)) }
        }
    }
}
#endif
