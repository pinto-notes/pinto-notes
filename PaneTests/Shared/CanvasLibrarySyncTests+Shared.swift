import Foundation
import Testing
@testable import Pane

/// The CanvasLibrarySyncTests suite's declaration, and the helper of it that tests in other test
/// targets use (a test target can't see another's code). Its tests are in PaneTests/CanvasLibrarySyncTests.swift.
@Suite struct CanvasLibrarySyncTests {
    static func shape(_ type: String = "rectangle", x: Double = 0, width: Double = 80, text: String? = nil) -> [String: Any] {
        var e: [String: Any] = ["type": type, "id": UUID().uuidString, "x": x, "y": 0, "width": width, "height": 40]
        if let text { e["text"] = text }
        return e
    }
}
