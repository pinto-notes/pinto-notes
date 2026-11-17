import AuthenticationServices
import CryptoKit
import Foundation
import Supabase
import Testing
@testable import Pane

/// The GoogleSignInTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/GoogleSignInTests.swift.
@Suite struct GoogleSignInTests {
    final class MemoryStorage: AuthLocalStorage, @unchecked Sendable {
        private let lock = NSLock()
        private var items: [String: Data] = [:]
        func store(key: String, value: Data) { lock.withLock { items[key] = value } }
        func retrieve(key: String) -> Data? { lock.withLock { items[key] } }
        func remove(key: String) { lock.withLock { items[key] = nil } }
        var keys: [String] { lock.withLock { items.keys.sorted() } }
    }
}
