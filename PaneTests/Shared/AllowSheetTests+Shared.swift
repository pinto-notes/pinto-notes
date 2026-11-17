import Supabase
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// The AllowSheetTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/AllowSheetTests.swift.
@MainActor @Suite struct AllowSheetTests {
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
    static let glama = ConnectRequest(id: UUID(), client_name: "glama", redirect_host: "glama.ai",
                                      redirect_uri: "https://glama.ai/oauth/callback", claimed_name: "glama", loopback: false)
}
