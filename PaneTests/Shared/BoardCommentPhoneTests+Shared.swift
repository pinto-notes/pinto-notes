#if os(iOS)
import Foundation
import SwiftData
import SwiftUI
import Testing
import UIKit
import WebKit
@testable import Pane

/// The BoardCommentPhoneTests suite's declaration, and the helper of it that tests in other test
/// targets use (a test target can't see another's code). Its tests are in PaneTests/BoardCommentPhoneTests.swift.
@MainActor @Suite(.serialized) struct BoardCommentPhoneTests {
    /// Accessibility on in the test host, as VoiceOver or Voice Control turn it on: SwiftUI builds
    /// what it says of a view (its buttons, their names and frames) only then.
    static let accessibilityOn: Bool = {
        let root = ProcessInfo.processInfo.environment["IPHONE_SIMULATOR_ROOT"] ?? ""
        guard let lib = dlopen(root + "/usr/lib/libAccessibility.dylib", RTLD_LOCAL) ?? dlopen("/usr/lib/libAccessibility.dylib", RTLD_LOCAL) else {
            print("AX: no libAccessibility at \(root)"); return false
        }
        typealias SetEnabled = @convention(c) (Int32) -> Void
        typealias Enabled = @convention(c) () -> Int32
        guard let set = dlsym(lib, "_AXSSetAutomationEnabled"), let get = dlsym(lib, "_AXSAutomationEnabled") else { print("AX: no symbols"); return false }
        unsafeBitCast(set, to: SetEnabled.self)(1)
        let on = unsafeBitCast(get, to: Enabled.self)() != 0
        print("AX: automation \(on)")
        return on
    }()
}
#endif
