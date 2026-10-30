import Supabase
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The Allow sheet an AI's connect request opens: a recognized AI, an app Pinto Notes doesn't
/// recognize, an app on this computer and a request by number, light and dark. Offscreen; runs
/// only when AMBER_HIG_SHOTS is set (`AMBER_SHOT_PREFIX` names the files, e.g. "before-").
/// Mac: `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/AllowSheetSnapshots`;
/// iPhone: the same test on a simulator.
@MainActor @Suite(.serialized) struct AllowSheetSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var prefix: String { ProcessInfo.processInfo.environment["AMBER_SHOT_PREFIX"] ?? "" }
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")

    static let claude = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude.ai",
                                       redirect_uri: "https://claude.ai/api/mcp/auth_callback", loopback: false)
    /// The request in Emil's screenshot: Glama, by its own address.
    static let glama = ConnectRequest(id: UUID(), client_name: "glama", redirect_host: "glama.ai",
                                      redirect_uri: "https://glama.ai/oauth/callback", claimed_name: "glama", loopback: false)
    static let local = ConnectRequest(id: UUID(), client_name: "An app on this computer", redirect_host: "127.0.0.1",
                                      redirect_uri: "http://127.0.0.1:53682/callback", claimed_name: "incredible", loopback: true)
    static let notified = ConnectJourneySnapshots.notified

    static var sheets: [(String, ConsentSheet)] {
        [("claude", ConsentSheet(client: client, requestID: claude.id, initial: .asking(claude), finish: { _ in })),
         ("unknown-glama", ConsentSheet(client: client, requestID: glama.id, initial: .asking(glama), finish: { _ in })),
         ("local-app", ConsentSheet(client: client, requestID: local.id, initial: .asking(local), finish: { _ in })),
         ("by-number", ConnectJourneySnapshots.sheet(.asking(notified), match: ConnectJourneySnapshots.match))]
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        for (name, sheet) in Self.sheets {
            try await AppSnapshotTests.render(sheet, name: "\(Self.prefix)mac-\(name)-\(dark ? "dark" : "light")", dark: dark, wait: 1.4)
        }
    }
    #endif

    #if os(iOS)
    @Test(arguments: [false, true])
    func iPhone(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for (name, sheet) in Self.sheets {
            let view = Color(.systemGroupedBackground).ignoresSafeArea().sheet(isPresented: .constant(true)) { sheet }
            try await ConnectJourneySnapshots.shoot(view, "\(Self.prefix)iphone-\(name)-\(dark ? "dark" : "light")",
                                                    size: CGSize(width: 393, height: 852), type: .large, dark: dark, scene: scene, dir: dir)
        }
    }
    #endif
}
