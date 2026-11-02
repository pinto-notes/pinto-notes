#if os(macOS)
import AppKit
import SwiftUI

/// A folder's name typed in its own sidebar row, as Notes names a new folder and renames one: the
/// field opens focused with all of the name selected. Return keeps what you typed, Escape keeps the
/// name it had, and clicking anywhere else keeps what you typed. What an empty name does is the
/// caller's (`ModelContext.finishNaming` keeps the old one).
///
/// An AppKit field: a SwiftUI TextField in a List row doesn't take focus reliably on the Mac, and
/// can't be told to select all of its text.
struct InlineNameField: NSViewRepresentable {
    let initial: String
    /// The text when Return is pressed or the field loses focus.
    let commit: (String) -> Void
    /// Escape.
    let cancel: () -> Void
    var identifier = "folder.nameField"

    func makeCoordinator() -> Coordinator { Coordinator(commit: commit, cancel: cancel) }

    func makeNSView(context: Context) -> Field {
        let f = Field(string: initial)
        f.delegate = context.coordinator
        f.isBordered = false
        f.isBezeled = false
        f.drawsBackground = true
        f.backgroundColor = .textBackgroundColor
        f.focusRingType = .exterior
        f.font = .systemFont(ofSize: NSFont.systemFontSize)
        f.usesSingleLineMode = true
        f.lineBreakMode = .byClipping
        f.cell?.isScrollable = true
        f.cell?.wraps = false
        f.setContentHuggingPriority(.defaultLow, for: .horizontal)
        f.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        f.setAccessibilityIdentifier(identifier)
        f.setAccessibilityLabel("Folder name")
        return f
    }

    func updateNSView(_ f: Field, context: Context) {
        context.coordinator.commit = commit
        context.coordinator.cancel = cancel
    }

    /// Takes the keys, with its text selected, as soon as it's in a window.
    final class Field: NSTextField {
        private var focused = false

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            guard !focused, window != nil else { return }
            focused = true
            // After the row is laid out: a field made first responder before that loses it again.
            DispatchQueue.main.async { [weak self] in self?.focusAndSelectAll() }
        }

        func focusAndSelectAll() {
            guard let window else { return }
            window.makeFirstResponder(self)
            currentEditor()?.selectAll(nil)
        }
    }

    @MainActor final class Coordinator: NSObject, NSTextFieldDelegate {
        var commit: (String) -> Void
        var cancel: () -> Void
        /// Once committed or cancelled it's done: the field ending its editing as it goes away
        /// mustn't commit a second time (or commit after Escape).
        private(set) var finished = false

        init(commit: @escaping (String) -> Void, cancel: @escaping () -> Void) {
            self.commit = commit
            self.cancel = cancel
        }

        func control(_ control: NSControl, textView: NSTextView, doCommandBy selector: Selector) -> Bool {
            switch selector {
            case #selector(NSResponder.insertNewline(_:)):
                finish(committing: control.stringValue)
            case #selector(NSResponder.cancelOperation(_:)):
                finish(committing: nil)
            default:
                return false
            }
            // The keys go back to the sidebar, as in Notes.
            if let list = Self.enclosingTable(of: control) { control.window?.makeFirstResponder(list) }
            return true
        }

        /// A click elsewhere (or another window in front) ends the editing: what was typed is kept.
        func controlTextDidEndEditing(_ notification: Notification) {
            guard let f = notification.object as? NSTextField else { return }
            finish(committing: f.stringValue)
        }

        /// The text to keep, or nil for Escape.
        func finish(committing text: String?) {
            guard !finished else { return }
            finished = true
            if let text { commit(text) } else { cancel() }
        }

        static func enclosingTable(of view: NSView) -> NSTableView? {
            var v = view.superview
            while let s = v {
                if let t = s as? NSTableView { return t }
                v = s.superview
            }
            return nil
        }
    }
}
#endif
