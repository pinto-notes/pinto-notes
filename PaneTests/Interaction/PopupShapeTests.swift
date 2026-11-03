#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// A popup (setup card, Settings, Templates) lies over the notes window in a window of its own.
/// Emil (11-03): "this background shadow is covering outside the app, and even the traffic
/// lights". It takes the window's shape: its rounded corners, with the buttons left clear.
@MainActor @Suite(.serialized) struct PopupShapeTests {
    private func rig(toolbar: Bool) async throws -> (NSWindow, PopupPanel) {
        let host = NSHostingView(rootView: Color.clear.frame(width: 800, height: 600).modifier(BehindSetupCard(card: Text("A card").padding(40))))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 800, height: 600),
                              styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        if toolbar { window.toolbar = NSToolbar(identifier: "popup-shape"); window.toolbarStyle = .unified }
        window.contentView = host
        for _ in 0..<4 { host.layoutSubtreeIfNeeded(); try await Task.sleep(for: .milliseconds(100)) }
        return (window, try #require(PopupPanel.over(window).first))
    }

    @Test(arguments: [false, true]) func thePopupHasTheWindowsShape(toolbar: Bool) async throws {
        let (window, panel) = try await rig(toolbar: toolbar)
        defer { window.close() }
        // The radius the window itself has (read here only, from AppKit, to check ours).
        let real = try #require(window.value(forKey: "_cornerRadius") as? CGFloat)
        #expect(PopupPanel.cornerRadius(of: window) == real, "the corners as macOS draws them: \(real)")

        let mask = try #require(panel.contentView?.layer?.mask as? CAShapeLayer)
        let path = try #require(mask.path)
        func covers(_ p: CGPoint) -> Bool { path.contains(p, using: .evenOdd) }
        let size = panel.frame.size
        #expect(covers(CGPoint(x: size.width / 2, y: size.height / 2)), "the dimming covers the window")
        for corner in [CGPoint(x: 1, y: 1), CGPoint(x: size.width - 1, y: 1), CGPoint(x: 1, y: size.height - 1), CGPoint(x: size.width - 1, y: size.height - 1)] {
            #expect(!covers(corner), "nothing past the rounded corner at \(corner)")
        }
        for type in [NSWindow.ButtonType.closeButton, .miniaturizeButton, .zoomButton] {
            let b = try #require(window.standardWindowButton(type))
            let f = b.convert(b.bounds, to: nil)
            #expect(!covers(CGPoint(x: f.midX, y: f.midY)), "\(type) stays clear")
        }
    }
}
#endif
