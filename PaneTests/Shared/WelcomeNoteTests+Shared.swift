import Foundation
import SwiftData
import Testing
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// The WelcomeNoteTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/WelcomeNoteTests.swift.
@MainActor @Suite(.serialized) struct WelcomeNoteTests {
    #if os(iOS)
    static func textView(in view: UIView) -> PaneTextView? {
        if let tv = view as? PaneTextView { return tv }
        for v in view.subviews { if let tv = textView(in: v) { return tv } }
        return nil
    }
    #endif
}
