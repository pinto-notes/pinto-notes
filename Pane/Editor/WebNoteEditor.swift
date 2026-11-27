import SwiftUI
import WebKit
import OSLog
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// Which editor a note opens in while the Web editor experiment is on (Settings › Experimental).
enum EditorChoice: String, CaseIterable, Identifiable {
    case native, web
    /// The Mac only: both, side by side, on the same note.
    case both

    static let key = "webEditorChoice"
    var id: String { rawValue }
    var title: String {
        switch self {
        case .native: "Native"
        case .web: "Web"
        case .both: "Both"
        }
    }

    static var offered: [EditorChoice] {
        #if os(macOS)
        allCases
        #else
        [.native, .web]
        #endif
    }

    /// What a note opens in now: always native unless the experiment is on.
    static func current(_ d: UserDefaults = .standard) -> EditorChoice {
        guard Experiments.isOn(.webEditor, defaults: d) else { return .native }
        let c = d.string(forKey: key).flatMap(EditorChoice.init) ?? .web
        return offered.contains(c) ? c : .web
    }
}

/// A note in the web editor (web-editor/ in the repo, bundled as WebEditor/web-editor.html).
/// The same contract as MarkdownEditor: the note's markdown goes in, every edit comes back out
/// as the whole markdown. A note the web editor can't hold exactly opens read-only.
struct WebNoteEditor: View {
    let initialText: String
    let header: String
    let controller: EditorController
    var autofocus = false
    let onChange: (String) -> Void

    var body: some View {
        WebNoteView(initialText: initialText, header: header, controller: controller, autofocus: autofocus, onChange: onChange)
    }
}

enum WebEditorSource {
    static let log = Logger(subsystem: "dev.emilwagman.pane", category: "web-editor")

    /// The page as shipped in the app.
    static var bundled: URL? { Bundle.main.url(forResource: "web-editor", withExtension: "html") }

    /// A live page from `web-editor/build.mjs --serve` on the Mac, for trying changes on the Mac
    /// and the iPhone without a new build: set at build time (PINTO_WEB_EDITOR_DEV_URL) or in
    /// UserDefaults (`webEditorDevURL`). Empty: the bundled page only.
    static var live: URL? {
        let set = UserDefaults.standard.string(forKey: "webEditorDevURL")
            ?? (Bundle.main.object(forInfoDictionaryKey: "PintoWebEditorDevURL") as? String)
        guard let s = set?.trimmingCharacters(in: .whitespaces), !s.isEmpty, !s.hasPrefix("$(") else { return nil }
        return URL(string: s)
    }
}

/// Serves a note's pictures (`pane-file:<id>`) to the page from the app's files.
final class PaneFileScheme: NSObject, WKURLSchemeHandler {
    /// The file on disk and its MIME type for an attachment id (set on the main actor).
    var resolve: @MainActor (UUID) -> (URL, String)? = { _ in nil }

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        guard let url = task.request.url,
              let id = UUID(uuidString: url.absoluteString.replacingOccurrences(of: "pane-file:", with: "").trimmingCharacters(in: CharacterSet(charactersIn: "/"))),
              let (file, mime) = MainActor.assumeIsolated({ resolve(id) }),
              let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        task.didReceive(URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: nil))
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}
}

@MainActor
final class WebNoteCoordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    var text: String
    var header: String
    var autofocus: Bool
    var onChange: (String) -> Void
    weak var controller: EditorController?
    weak var webView: WKWebView?
    private var ready = false
    /// The last text the page sent or was given, so an echo of a save doesn't reload it.
    private var known: String
    private var triedLive = false
    let files = PaneFileScheme()

    init(text: String, header: String, autofocus: Bool, controller: EditorController, onChange: @escaping (String) -> Void) {
        self.text = text; self.header = header; self.autofocus = autofocus; self.onChange = onChange
        self.controller = controller; known = text
    }

    func makeWebView() -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(WeakHandler(self), name: "pinto")
        files.resolve = { [weak self] id in
            guard let a = self?.controller?.resolveAttachment(id) else { return nil }
            return (FileStore.url(for: a.id, filename: a.filename), a.type.preferredMIMEType ?? "application/octet-stream")
        }
        config.setURLSchemeHandler(files, forURLScheme: "pane-file")
        #if os(iOS)
        config.dataDetectorTypes = []
        #endif
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.isInspectable = true
        #if os(macOS)
        web.setAccessibilityIdentifier("web.editor")
        web.setValue(false, forKey: "drawsBackground")
        web.allowsMagnification = false
        #else
        web.accessibilityIdentifier = "web.editor"
        web.isOpaque = false
        web.backgroundColor = .clear
        web.scrollView.backgroundColor = .clear
        web.scrollView.keyboardDismissMode = .interactive
        web.scrollView.contentInsetAdjustmentBehavior = .automatic
        #endif
        webView = web
        if let live = WebEditorSource.live {
            triedLive = true
            web.load(URLRequest(url: live, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 2))
        } else {
            loadBundled()
        }
        return web
    }

    private func loadBundled() {
        guard let page = WebEditorSource.bundled else { WebEditorSource.log.error("web-editor.html missing from the app"); return }
        webView?.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    // The live page isn't running: use the one in the app.
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: any Error) {
        if triedLive { triedLive = false; WebEditorSource.log.info("live web editor unreachable, using the bundled one"); loadBundled() }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
        // The page itself (and its live reloads) load; links leave for the browser.
        if action.navigationType == .linkActivated, let url = action.request.url { open(url); return .cancel }
        return .allow
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            ready = true
            sendLoad()
        case "change":
            guard let t = body["text"] as? String else { return }
            known = t; text = t
            onChange(t)
        case "openNote":
            if let title = body["title"] as? String { self.controller?.openWiki(title) }
        case "openLink":
            if let s = body["href"] as? String, let url = URL(string: s) { open(url) }
        case "loaded":
            WebEditorSource.log.info("web editor loaded a note in \(body["ms"] as? Int ?? -1, privacy: .public) ms, \(body["blocks"] as? Int ?? -1, privacy: .public) blocks, exact: \(body["guard"] as? Bool ?? false, privacy: .public)")
        case "log":
            WebEditorSource.log.info("page: \(body["message"] as? String ?? "", privacy: .public)")
        default: break
        }
    }

    /// The note changed outside the page (sync, an AI, the native editor beside it).
    func update(text new: String, header: String) {
        self.header = header
        guard new != known else { return }
        known = new; text = new
        guard ready else { return }
        call("window.PintoEditor.receive(\(Self.json(new)))")
    }

    private func sendLoad() {
        let opts: [String: Any] = ["text": text, "header": header, "focus": autofocus, "style": WebEditorStyle.current()]
        guard let data = try? JSONSerialization.data(withJSONObject: opts), let json = String(data: data, encoding: .utf8) else { return }
        call("window.PintoEditor.load(\(json))")
    }

    private func call(_ js: String) {
        webView?.evaluateJavaScript(js) { _, error in
            if let error { WebEditorSource.log.error("web editor call failed: \(error.localizedDescription, privacy: .public)") }
        }
    }

    private func open(_ url: URL) {
        #if os(macOS)
        NSWorkspace.shared.open(url)
        #else
        UIApplication.shared.open(url)
        #endif
    }

    static func json(_ s: String) -> String {
        let data = (try? JSONSerialization.data(withJSONObject: [s])) ?? Data("[\"\"]".utf8)
        let a = String(decoding: data, as: UTF8.self)
        return String(a.dropFirst().dropLast())
    }
}

/// WKUserContentController keeps its handlers: this keeps the coordinator from leaking.
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WebNoteCoordinator?
    init(_ t: WebNoteCoordinator) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        MainActor.assumeIsolated { target?.userContentController(c, didReceive: m) }
    }
}

/// The note's sizes, face and colours, as the native editor draws them, for the page.
@MainActor
enum WebEditorStyle {
    static func current() -> [String: Any] {
        #if os(macOS)
        let platform = "mac"
        #else
        let platform = "ios"
        #endif
        return [
            "body": EditorMetrics.body, "title": EditorMetrics.title, "label": EditorMetrics.label,
            "lineSpacing": EditorMetrics.lineSpacing, "font": NoteFont.current.rawValue, "platform": platform,
            "colors": ["light": colors(dark: false), "dark": colors(dark: true)],
        ]
    }

    private static func colors(dark: Bool) -> [String: String] {
        ["ink": hex(Palette.ink, dark), "muted": hex(Palette.muted, dark), "accent": hex(Palette.amber, dark),
         "accent-ink": hex(Palette.amberInk, dark), "line": hex(Palette.line, dark), "soft": hex(Palette.soft, dark),
         "selection": hex(Palette.amberSoft, dark)]
    }

    private static func hex(_ c: PColor, _ dark: Bool) -> String {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 1
        #if os(macOS)
        NSAppearance(named: dark ? .darkAqua : .aqua)?.performAsCurrentDrawingAppearance {
            (c.usingColorSpace(.sRGB) ?? c).getRed(&r, green: &g, blue: &b, alpha: &a)
        }
        #else
        c.resolvedColor(with: UITraitCollection(userInterfaceStyle: dark ? .dark : .light)).getRed(&r, green: &g, blue: &b, alpha: &a)
        #endif
        let i = { (v: CGFloat) in Int((max(0, min(1, v)) * 255).rounded()) }
        return a < 1 ? "rgba(\(i(r)),\(i(g)),\(i(b)),\(String(format: "%.2f", a)))" : String(format: "#%02X%02X%02X", i(r), i(g), i(b))
    }
}

#if os(macOS)
private struct WebNoteView: NSViewRepresentable {
    let initialText: String
    let header: String
    let controller: EditorController
    let autofocus: Bool
    let onChange: (String) -> Void

    func makeCoordinator() -> WebNoteCoordinator { WebNoteCoordinator(text: initialText, header: header, autofocus: autofocus, controller: controller, onChange: onChange) }
    func makeNSView(context: Context) -> WKWebView { context.coordinator.makeWebView() }
    func updateNSView(_ view: WKWebView, context: Context) {
        context.coordinator.onChange = onChange
        context.coordinator.update(text: initialText, header: header)
    }
}
#else
private struct WebNoteView: UIViewRepresentable {
    let initialText: String
    let header: String
    let controller: EditorController
    let autofocus: Bool
    let onChange: (String) -> Void

    func makeCoordinator() -> WebNoteCoordinator { WebNoteCoordinator(text: initialText, header: header, autofocus: autofocus, controller: controller, onChange: onChange) }
    func makeUIView(context: Context) -> WKWebView { context.coordinator.makeWebView() }
    func updateUIView(_ view: WKWebView, context: Context) {
        context.coordinator.onChange = onChange
        context.coordinator.update(text: initialText, header: header)
    }
}
#endif

/// The switch at the foot of a note while the experiment is on: Native, Web, or Both (Mac).
struct EditorChoiceSwitch: View {
    @AppStorage(EditorChoice.key) private var stored = EditorChoice.web.rawValue

    var body: some View {
        Picker("Editor", selection: Binding(get: { EditorChoice(rawValue: stored) ?? .web }, set: { stored = $0.rawValue })) {
            ForEach(EditorChoice.offered) { Text($0.title).tag($0) }
        }
        .pickerStyle(.segmented)
        .labelsHidden()
        .fixedSize()
        .padding(4)
        .background(.regularMaterial, in: Capsule())
        .accessibilityIdentifier("editor.choice")
    }
}
