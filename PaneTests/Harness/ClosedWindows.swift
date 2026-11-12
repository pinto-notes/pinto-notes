import Foundation
#if os(macOS)
import AppKit
import Testing
#endif

/// Runs as the test bundle loads (its NSPrincipalClass).
///
/// A test's window, closed, stays alive while anything holds it, and so does the SwiftUI inside it:
/// it still answers "New Folder" and the other app-wide notifications, and it's still in
/// NSApp.windows with a field editor. By the end of a full run there were dozens, and tests failed
/// depending on what ran before them. A closed window now lets go of what it shows.
final class PaneTestsLoaded: NSObject {
    override init() {
        super.init()
        #if os(macOS)
        NotificationCenter.default.addObserver(forName: NSWindow.willCloseNotification, object: nil, queue: .main) { n in
            // Plain test windows only: AppKit's own panels and SwiftUI's sheets look after themselves.
            guard let w = n.object as? NSWindow, type(of: w) == NSWindow.self else { return }
            let window = UncheckedWindow(w)
            DispatchQueue.main.async {
                window.w.contentViewController = nil
                window.w.contentView = nil
            }
        }
        #endif
    }
}

#if os(macOS)
private struct UncheckedWindow: @unchecked Sendable {
    let w: NSWindow
    init(_ w: NSWindow) { self.w = w }
}
#endif
