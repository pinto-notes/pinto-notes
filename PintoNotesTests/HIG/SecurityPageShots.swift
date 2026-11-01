import SwiftUI
import Testing
@testable import PintoNotes
#if os(iOS)
import UIKit
#endif

/// Settings › Security as two accounts see it: one whose key Pinto Notes keeps a copy of (most
/// accounts), and one that turned Advanced protection on before it was retired. Light and dark, on
/// the Mac and on iPhone. The device row is sample data, named so, with dates relative to the day
/// the shot is taken. Offscreen; runs only when AMBER_HIG_SHOTS is set. Mac:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PintoNotesTests/SecurityPageShots`; iPhone: the
/// same test on a simulator.
@MainActor @Suite(.serialized) struct SecurityPageShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    static let sample = KeyDevice(id: UUID(), name: "MacBook Air (sample)", platform: "macos", how: .signIn, backedUp: false,
                                  addedAt: .now.addingTimeInterval(-6 * 86400), seenAt: .now, removing: false)

    static func accounts() async throws -> [(name: String, crypto: AccountCrypto)] {
        let standard = await AddDeviceSnapshots.readyWithCopy()
        let strict = await AddDeviceSnapshots.readyWithCopy()
        try await strict.markRecoveryKeySaved()
        try await strict.keepOnDevicesOnly(device: UUID())
        return [("standard", standard), ("advanced-on", strict)]
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        for (name, crypto) in try await Self.accounts() {
            let page = Form {
                PrivacySecuritySection(crypto: crypto, devices: AddDeviceSnapshots.devices([Self.sample]))
                LockedNotesSection(sync: nil)
            }
            .formStyle(.grouped).frame(width: 560)
            try await AppSnapshotTests.render(page, name: "mac-security-\(name)-\(mode)", dark: dark, wait: 1.2)
            crypto.signedOut()
        }
        let asked = await AddDeviceSnapshots.readyWithCopy()
        try await AppSnapshotTests.render(KeyProtectionAsk(crypto: asked), name: "mac-ask-\(mode)", dark: dark, wait: 1.2)
        asked.signedOut()
    }
    #endif

    #if os(iOS)
    @Test(arguments: [false, true])
    func iPhone(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let mode = dark ? "dark" : "light"
        for (name, crypto) in try await Self.accounts() {
            let page = NavigationStack { PrivacySecurityView(crypto: crypto, devices: AddDeviceSnapshots.devices([Self.sample])) }
            try await ConnectJourneySnapshots.shoot(page, "iphone-security-\(name)-\(mode)", size: CGSize(width: 393, height: 1500),
                                                    type: .large, dark: dark, scene: scene, dir: dir)
            crypto.signedOut()
        }
        let asked = await AddDeviceSnapshots.readyWithCopy()
        let sheet = Color(.systemGroupedBackground).ignoresSafeArea().sheet(isPresented: .constant(true)) { KeyProtectionAsk(crypto: asked) }
        try await ConnectJourneySnapshots.shoot(sheet, "iphone-ask-\(mode)", size: CGSize(width: 393, height: 852), type: .large, dark: dark, scene: scene, dir: dir)
        asked.signedOut()
    }
    #endif
}
