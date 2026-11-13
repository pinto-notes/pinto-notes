import Foundation
import Testing
@testable import Pane

/// The AdvancedProtectionHiddenTests suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/Interaction/AdvancedProtectionHiddenTests.swift.
@MainActor @Suite(.serialized) struct AdvancedProtectionHiddenTests {
    /// An account as most have it: Pinto Notes keeps a copy, Advanced protection off.
    static func standard() async -> AccountCrypto { await AddDeviceSnapshots.readyWithCopy() }

    /// An account that turned Advanced protection on before it was retired.
    static func strict() async throws -> AccountCrypto {
        let crypto = await standard()
        try await crypto.markRecoveryKeySaved()
        try await crypto.keepOnDevicesOnly(device: UUID())
        return crypto
    }
}
