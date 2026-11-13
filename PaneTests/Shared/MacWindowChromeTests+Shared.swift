#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The MacWindowChromeTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/MacWindowChromeTests.swift.
@MainActor @Suite(.serialized) struct MacWindowChromeTests {
    /// The demo library's window with `title` open, at `size`.
    static func window(_ c: ModelContainer, size: CGSize) -> NSWindow {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(size)
        return w
    }

    static func settle(_ w: NSWindow, _ turns: Int = 10) async {
        for _ in 0..<turns {
            w.contentView?.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(100))
        }
    }

    static func find<T: NSView>(_ type: T.Type, in view: NSView, where ok: @MainActor (T) -> Bool = { _ in true }) -> T? {
        if let v = view as? T, ok(v) { return v }
        for s in view.subviews { if let v = find(type, in: s, where: ok) { return v } }
        return nil
    }

    /// The toolbar's items with a view, by label, and the column each one stands over.
    static func items(_ w: NSWindow) throws -> [(label: String, column: Int, frame: CGRect)] {
        let split = try #require(w.contentView.flatMap { find(NSSplitView.self, in: $0) })
        let columns = split.arrangedSubviews.map { $0.isHidden ? CGRect.null : $0.convert($0.bounds, to: nil) }
        return (w.toolbar?.items ?? []).compactMap { item in
            guard !item.isHidden, let view = item.view, view.window != nil else { return nil }
            let f = view.convert(view.bounds, to: nil)
            let column = columns.firstIndex { !$0.isNull && f.midX >= $0.minX && f.midX < $0.maxX } ?? -1
            return (item.label, column, f)
        }
    }

    /// A toolbar item, by its label, while it stands in the window's toolbar.
    static func toolbarItem(_ w: NSWindow, _ label: String) -> NSToolbarItem? {
        w.toolbar?.items.first { $0.label == label && $0.view?.window != nil }
    }

    /// Presses a toolbar item's button the way its overflow menu does: the same action a click
    /// runs. (A click needs the window on screen; this window never is.)
    static func press(_ item: NSToolbarItem) -> Bool {
        guard let m = item.menuFormRepresentation, let action = m.action else { return false }
        return NSApp.sendAction(action, to: m.target, from: m)
    }
}
#endif
