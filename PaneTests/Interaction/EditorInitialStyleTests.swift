#if os(macOS)
import AppKit
import Testing
@testable import Pane

@MainActor struct EditorInitialStyleTests {
    /// Assigning the initial string sends a selection notification. Installing the delegate
    /// before that assignment styled the note there, then again in configure's explicit pass.
    @Test func openingStylesTheInitialTextOnce() {
        let text = "Title\n\nSome **bold** text.\n- [ ] A task\n"
        let view = PaneTextView(frame: NSRect(x: 0, y: 0, width: 720, height: 760))
        view.configure(text: text, header: "Today")

        #expect(view.core.lastRegions == ["full"], "one initial markdown pass, before selection notifications are observed")
        #expect(view.string == text)
        #expect(view.delegate === view, "later selection and editing notifications still reach the editor")
        let storage = view.textStorage!
        #expect(storage.attribute(.font, at: 0, effectiveRange: nil) as? NSFont == MarkdownStyler.titleFont)
        let task = (text as NSString).range(of: "- [ ]")
        #expect((storage.attribute(.paneLine, at: task.location, effectiveRange: nil) as? LineDecoration)?.kind == .checkbox(checked: false))
    }
}
#endif
