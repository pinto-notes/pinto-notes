import CryptoKit
import Foundation
import SwiftData
import Testing
#if os(macOS)
import AppKit
import SwiftUI
#endif
@testable import Pane

/// The AIEditTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/AIEditTests.swift.
@MainActor @Suite struct AIEditTests {
    /// A note on its own; nothing here needs a store.
    static func note(_ body: String) -> Note { Note(body: body) }

    /// What the sync engine does with a row that carries an AI's edit.
    static func arrive(_ n: Note, body: String, by ai: String = "ChatGPT", at: Date = .now, quiet: Bool = false) {
        let old = n.body, oldAt = n.aiEditedAt
        n.body = body
        n.aiEditor = ai
        n.aiEditedAt = at
        AIEdit.arrived(n, previousBody: old, previousEditAt: oldAt, quiet: quiet)
    }
}
