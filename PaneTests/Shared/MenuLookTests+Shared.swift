#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The MenuLookTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Interaction/MenuLookTests.swift.
@MainActor @Suite(.serialized) struct MenuLookTests {
    static func titleColor(_ item: NSMenuItem?) -> NSColor? {
        guard let a = item?.attributedTitle, a.length > 0 else { return nil }
        return a.attribute(.foregroundColor, at: 0, effectiveRange: nil) as? NSColor
    }

    /// Red as the system red is: strong red, little green or blue.
    static func isRed(_ color: NSColor?) -> Bool {
        guard let c = color?.usingColorSpace(.sRGB) else { return false }
        return c.redComponent > 0.8 && c.greenComponent < 0.45 && c.blueComponent < 0.45
    }
}
#endif
