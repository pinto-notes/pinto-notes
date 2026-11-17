#if os(macOS)
import Foundation
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The SettingsPageRowTests suite's declaration, and its helper that tests in other test targets
/// use (a test target can't see another's code). Its tests are in PaneTests/SettingsHomeTests.swift.
@MainActor @Suite(.serialized) struct SettingsPageRowTests {
    static func ids(_ page: SettingsPage, backend: Backend, crypto: AccountCrypto = .shared, height: CGFloat = 1600) async throws -> [String] {
        let view = SettingsView(backend: backend, sync: nil, crypto: crypto, devices: AddDeviceSnapshots.devices([SecurityPageSnapshots.mac]),
                                connections: SecurityPageSnapshots.ais)
        let lib = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ax = OffscreenAX(view.page(page).modelContainer(lib), size: CGSize(width: SettingsCard.pageWidth, height: height))
        defer { ax.close() }
        await ax.settle(600)
        // Under load the offscreen page can answer nothing at first, or its last sections a beat
        // later: read until two non-empty reads agree.
        var ids = ax.ids()
        for _ in 0..<12 {
            await ax.settle(250)
            let again = ax.ids()
            if !again.isEmpty, Set(again) == Set(ids) { break }
            ids = again
        }
        return ids
    }
}
#endif
