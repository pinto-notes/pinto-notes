#if os(macOS)
import AppKit
import ApplicationServices
import SwiftUI

/// A view in its own window far off the screen, read the way VoiceOver reads it: through the
/// accessibility API, in this process. SwiftUI builds a view's accessibility only for a window
/// that's ordered in, and only when it's asked through that API (NSAccessibility's own children
/// stay empty), so this is how a test finds a button by its identifier, reads what it says and
/// presses it. Never on the screen, never key, never activates the app; closed by the test.
@MainActor final class OffscreenAX {
    let window: NSWindow
    /// Picks this window out of the app's (other tests' windows may be in too).
    private let name = "offscreen-ax-\(UUID().uuidString)"

    init(_ view: some View, size: CGSize, dark: Bool = false) {
        window = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.title = name
        // Not by its title: a note's pane names its window for VoiceOver (WindowSpokenTitle).
        window.setAccessibilityIdentifier(name)
        window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingController(rootView: view)
        host.sizingOptions = []
        window.contentViewController = host
        window.setContentSize(size)
        window.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        window.orderFrontRegardless()  // far off screen; accessibility lists ordered-in windows only
    }

    func close() { window.orderOut(nil); window.close() }

    func settle(_ ms: Int = 400) async {
        for _ in 0..<4 {
            window.contentView?.layoutSubtreeIfNeeded()
            window.displayIfNeeded()
            try? await Task.sleep(for: .milliseconds(ms / 4))
        }
    }

    struct Element {
        let ax: AXUIElement
        /// What it says: its label, value and title together.
        var text: String { [Self.string(ax, kAXDescriptionAttribute), Self.string(ax, kAXValueAttribute), Self.string(ax, kAXTitleAttribute)].compactMap { $0 }.joined(separator: " ") }
        var role: String? { Self.string(ax, kAXRoleAttribute) }
        var enabled: Bool { (Self.value(ax, kAXEnabledAttribute) as? Bool) ?? true }
        /// In screen points, from the top left: a bigger y is lower down.
        var frame: CGRect {
            var origin = CGPoint.zero, size = CGSize.zero
            if let p = Self.value(ax, kAXPositionAttribute) { AXValueGetValue(p as! AXValue, .cgPoint, &origin) }
            if let s = Self.value(ax, kAXSizeAttribute) { AXValueGetValue(s as! AXValue, .cgSize, &size) }
            return CGRect(origin: origin, size: size)
        }
        @discardableResult func press() -> Bool { AXUIElementPerformAction(ax, kAXPressAction as CFString) == .success }

        static func value(_ e: AXUIElement, _ name: String) -> CFTypeRef? {
            var v: CFTypeRef?
            return AXUIElementCopyAttributeValue(e, name as CFString, &v) == .success ? v : nil
        }
        static func string(_ e: AXUIElement, _ name: String) -> String? {
            (value(e, name) as? String).flatMap { $0.isEmpty ? nil : $0 }
        }
        static func children(_ e: AXUIElement) -> [AXUIElement] { value(e, kAXChildrenAttribute) as? [AXUIElement] ?? [] }
    }

    /// This window, as the accessibility API has it.
    private var root: AXUIElement? {
        let app = AXUIElementCreateApplication(getpid())
        AXUIElementSetMessagingTimeout(app, 5)
        return Element.children(app).first { Element.string($0, "AXIdentifier") == name }
    }

    func find(_ id: String) -> Element? {
        func search(_ e: AXUIElement, _ depth: Int) -> AXUIElement? {
            if Element.string(e, "AXIdentifier") == id { return e }
            guard depth < 40 else { return nil }
            for k in Element.children(e) { if let hit = search(k, depth + 1) { return hit } }
            return nil
        }
        return root.flatMap { search($0, 0) }.map(Element.init)
    }

    /// Every identifier in the window, top to bottom as the tree has them.
    func ids() -> [String] {
        var out: [String] = []
        func walk(_ e: AXUIElement, _ depth: Int) {
            if let i = Element.string(e, "AXIdentifier"), i != name { out.append(i) }
            guard depth < 40 else { return }
            for k in Element.children(e) { walk(k, depth + 1) }
        }
        if let root { walk(root, 0) }
        return out
    }
}
#endif
