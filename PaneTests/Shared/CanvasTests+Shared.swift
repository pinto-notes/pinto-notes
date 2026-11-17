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

/// The CanvasTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code): a board's scene, the page in an offscreen window (Rig),
/// and waiting on the page. Its tests are in PaneTests/CanvasTests.swift.
@MainActor @Suite(.serialized) struct CanvasTests {
    static func scene(_ elements: [[String: Any]]) -> [String: Any] {
        ["type": "excalidraw", "version": 2, "elements": elements, "appState": [String: Any](), "files": [String: Any]()]
    }

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
}
