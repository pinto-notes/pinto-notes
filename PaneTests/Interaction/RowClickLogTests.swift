#if os(macOS)
import AppKit
import Testing
@testable import Pane

/// RowClickLog sees every press in the app. A drag on a board (a pencil stroke) is one event for
/// every pointer move, and each was hit tested through the whole window for nothing: in the owner's
/// sample of a laggy board (17 November 2026). Events are handed to the log directly; nothing is
/// posted to the system, and the window is never shown.
@MainActor @Suite struct RowClickLogTests {
    @Test func aDragIsNotHitTestedMoveByMove() throws {
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 400, height: 300), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        defer { w.close() }
        w.contentView = NSView(frame: CGRect(x: 0, y: 0, width: 400, height: 300))
        func event(_ type: NSEvent.EventType, _ x: CGFloat) throws -> NSEvent {
            try #require(NSEvent.mouseEvent(with: type, location: CGPoint(x: x, y: 150), modifierFlags: [], timestamp: 0, windowNumber: w.windowNumber,
                                            context: nil, eventNumber: 0, clickCount: 1, pressure: 1))
        }
        #expect(try event(.leftMouseDown, 10).window === w)
        let before = RowClickLog.hitTests
        RowClickLog.note(try event(.leftMouseDown, 10))
        for i in 0..<100 { RowClickLog.note(try event(.leftMouseDragged, 10 + CGFloat(i))) }
        RowClickLog.note(try event(.leftMouseUp, 110))
        #expect(RowClickLog.hitTests - before == 2, "the press and the release only: \(RowClickLog.hitTests - before)")
    }
}
#endif
