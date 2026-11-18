#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The MenuLookTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Interaction/MenuLookTests.swift.
/// Tags off, as it ships: the right-click has no Tags item (Experiments).
@MainActor @Suite(.serialized, .experiment(.tags, on: false)) struct MenuLookTests {
    static func titleColor(_ item: NSMenuItem?) -> NSColor? {
        guard let a = item?.attributedTitle, a.length > 0 else { return nil }
        return a.attribute(.foregroundColor, at: 0, effectiveRange: nil) as? NSColor
    }

    /// Red as the system red is: strong red, little green or blue.
    static func isRed(_ color: NSColor?) -> Bool {
        guard let c = color?.usingColorSpace(.sRGB) else { return false }
        return c.redComponent > 0.8 && c.greenComponent < 0.45 && c.blueComponent < 0.45
    }

    /// The menu `view` gives the right-click `e` (an event made here, never posted). A table is asked
    /// only where one of its rows is: at a point past its rows the sidebar list looks up row -1 and
    /// throws on the CI runners' macOS (here it returns nothing). AppKit catches that exception in
    /// its event loop after it has unwound the test's async frames, so the test never ends and the
    /// job waits for its time limit (FolderMenuShots, 18 November 2026).
    static func menu(of view: NSView, for e: NSEvent) -> NSMenu? {
        if let table = view as? NSTableView, table.row(at: table.convert(e.locationInWindow, from: nil)) < 0 { return nil }
        return view.menu(for: e)
    }

    /// The first menu that `wanted` accepts, from a right-click at `x` every `step` points across
    /// `host`'s height. Each hit view and the views it sits in are asked, as AppKit asks them.
    static func menu(in host: NSView, window: NSWindow, x: CGFloat, step: CGFloat = 4, wanted: (NSMenu) -> Bool) -> NSMenu? {
        for y in stride(from: host.bounds.height - step - 1, to: step + 1, by: -step) {
            let p = host.convert(CGPoint(x: x, y: y), to: nil)
            guard let e = NSEvent.mouseEvent(with: .rightMouseDown, location: p, modifierFlags: [], timestamp: 0, windowNumber: window.windowNumber,
                                             context: nil, eventNumber: 0, clickCount: 1, pressure: 1),
                  let hit = host.hitTest(host.convert(p, from: nil)) else { continue }
            var v: NSView? = hit
            while let view = v {
                if let m = menu(of: view, for: e), wanted(m) { return m }
                v = view.superview
            }
        }
        return nil
    }
}
#endif
