import Foundation
import Testing
import WebKit
@testable import Pane

/// The web editor experiment (Settings › Experimental › Web editor): which editor a note opens
/// in, and that the bundled page gives a note back exactly as it was given.
@MainActor
@Suite(.serialized)
struct WebNoteEditorTests {
    @Test(.experiment(.webEditor, on: false))
    func notesStayNativeWhileTheExperimentIsOff() {
        #expect(EditorChoice.current() == .native)
    }

    @Test(.experiment(.webEditor))
    func theExperimentOpensNotesInTheWebEditor() {
        let d = UserDefaults.standard
        let before = d.string(forKey: EditorChoice.key)
        defer { if let before { d.set(before, forKey: EditorChoice.key) } else { d.removeObject(forKey: EditorChoice.key) } }
        d.removeObject(forKey: EditorChoice.key)
        #expect(EditorChoice.current() == .web)
        d.set(EditorChoice.native.rawValue, forKey: EditorChoice.key)
        #expect(EditorChoice.current() == .native)
        d.set(EditorChoice.both.rawValue, forKey: EditorChoice.key)
        #if os(macOS)
        #expect(EditorChoice.current() == .both)
        #else
        // No room for two editors on the iPhone.
        #expect(EditorChoice.current() == .web)
        #endif
    }

    @Test func textGoesToThePageAsOneJavaScriptString() {
        #expect(WebNoteCoordinator.json("a \"b\"\n</script>") == #""a \"b\"\n<\/script>""#)
    }

    /// The page holds a note one block per line and writes it back byte for byte, so opening a
    /// note in the web editor never rewrites it.
    @Test func thePageGivesANoteBackExactly() async throws {
        let page = try #require(WebEditorSource.bundled, "web-editor.html is in the app")
        let web = WKWebView(frame: CGRect(x: 0, y: 0, width: 600, height: 800))
        let loaded = PageLoad()
        web.navigationDelegate = loaded
        web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        try await loaded.wait()
        let note = """
        Week plan

        ## Today
        - [ ] Book the dentist
        - [x] Send times
          - [ ] nested
        1. one
        <!-- pane-table: {"cols":["text","number"]} -->
        | Item | Cost |
        | --- | ---: |
        | **Rent** | 9 800 |
        See [[Lisbon|the trip]] and #travel, ==bright== ~~gone~~ `code`
        ![photo.jpg](pane-file:0D1B6C8E-1111-2222-3333-444455556666)
        > [!warning] Passport
        ```
        unclosed
        """
        let back = try await web.evaluateJavaScript("window.PintoEditor.load({ text: \(WebNoteCoordinator.json(note)) }); window.PintoEditor.text()") as? String
        #expect(back == note)
        let changed = try await web.evaluateJavaScript("window.PintoEditor.receive(window.PintoEditor.text().replace('Rent', 'Rent (AI)')); window.PintoEditor.text()") as? String
        #expect(changed == note.replacingOccurrences(of: "Rent", with: "Rent (AI)"))
    }
}

@MainActor
private final class PageLoad: NSObject, WKNavigationDelegate {
    private var done = false
    private var failure: (any Error)?

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { done = true }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) { failure = error; done = true }

    func wait() async throws {
        for _ in 0..<200 where !done { try await Task.sleep(for: .milliseconds(25)) }
        if let failure { throw failure }
        #expect(done, "the page loaded")
    }
}
