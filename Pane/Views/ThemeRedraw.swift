import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

#if os(macOS)
/// After the look changes, every window draws again: TextKit's line layers, layer colours set by
/// hand (views redo them when told their appearance changed), and the rest.
enum ThemeRedraw {
    @MainActor static func all() {
        for w in NSApp?.windows ?? [] { redraw(w.contentView) }
    }

    @MainActor static func redraw(_ view: NSView?) {
        guard let view else { return }
        if let tv = view as? NSTextView, let tlm = tv.textLayoutManager {
            tlm.invalidateLayout(for: tlm.documentRange)
            tlm.textViewportLayoutController.layoutViewport()
        }
        view.viewDidChangeEffectiveAppearance()
        view.needsDisplay = true
        view.needsLayout = true
        for s in view.subviews { redraw(s) }
    }
}
#else
enum ThemeRedraw {
    @MainActor static func all() {
        for scene in UIApplication.shared.connectedScenes {
            for w in (scene as? UIWindowScene)?.windows ?? [] { redraw(w) }
        }
    }

    @MainActor static func redraw(_ view: UIView) {
        if let tv = view as? UITextView, let tlm = tv.textLayoutManager {
            tlm.invalidateLayout(for: tlm.documentRange)
        }
        view.setNeedsDisplay()
        view.setNeedsLayout()
        for s in view.subviews { redraw(s) }
    }
}
#endif
