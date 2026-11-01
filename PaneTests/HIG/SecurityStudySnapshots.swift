import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The Security page study (SecurityStudy, 2026-11-01): the page as it is ("before") and options
/// A, B and C, for an account in the default state (Pinto Notes keeps a locked copy of the key, no
/// recovery key saved, an iPhone not seen for six weeks, ChatGPT and Claude connected). Offscreen.
/// Mac, the Settings card light and dark:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=$PWD/docs/Evidence/security-page scripts/qa-test.sh PaneTests/SecurityStudySnapshots`.
/// iPhone, light: the same suite on a simulator (`xcodebuild test -scheme Pane -destination
/// 'platform=iOS Simulator,name=iPhone 17 Pro' -only-testing:PaneTests/SecurityStudySnapshots CODE_SIGNING_ALLOWED=NO`).
@MainActor @Suite(.serialized) struct SecurityStudySnapshots {
    static let ais = ["ChatGPT", "Claude"]

    /// Signed in, the key open here and in iCloud Keychain, and a copy kept by Pinto Notes.
    static func defaultAccount() async throws -> AccountCrypto {
        let keychain = KeyStartupTests.FakeKeychain(cloud: KeyStartupTests.Cloud())
        keychain.syncs = true
        let crypto = AccountCrypto(store: keychain, defaults: UserDefaults(suiteName: "security-study-\(UUID())")!, sleep: { _ in throw CancellationError() })
        let server = KeyCopyTests.Server()
        await crypto.attach(account: UUID(), server: server, copies: server)
        crypto.welcomeShown()
        return crypto
    }

    static func connections() -> [Connection] {
        [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com"),
         Connection(id: UUID(), name: "Claude", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "claude.ai")]
    }

    /// The study is off in the app until it's picked.
    @Test func theStudyIsOffByDefault() {
        #expect(EnvironmentValues().securityStudy == nil)
    }

    /// The page never says end-to-end unless Advanced protection is on, and every fact is in
    /// "How it works".
    @Test func theWordsStayTrue() {
        #expect(!SecurityStudyCopy.status.lowercased().contains("end-to-end"))
        #expect(SecurityStudyCopy.statusAdvanced.contains("End-to-end"))
        let off = SecurityStudyCopy.how(advanced: false).map { $0.title + " " + $0.line }.joined(separator: " ")
        for fact in ["court order", "gets into your account", "help you back in", "connected", "recovery", "password"] {
            #expect(off.localizedCaseInsensitiveContains(fact), "\(fact)")
        }
        #expect(!off.localizedCaseInsensitiveContains("end-to-end"))
    }

    #if os(macOS)
    /// The real window under the Settings card, as SidebarStudySnapshots draws it.
    private func window(_ card: some View, library: ModelContainer, study: SecurityStudy?) -> some View {
        ZStack(alignment: .topLeading) {
            RootView().allowsHitTesting(false)
            NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
                .overlay(alignment: .bottomLeading) { SidebarStudySnapshots.foot }
                .frame(width: 259, height: SidebarStudySnapshots.size.height - 16)
                .background(Color(nsColor: .windowBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .padding(8)
            card.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .environment(\.sidebarStudy, SidebarStudy())
        .environment(\.securityStudy, study)
        .environment(\.controlActiveState, .key)
        .tint(Color(PColor.paneAccent))
        .modelContainer(library)
    }

    @Test func macCard() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let lib = try SidebarStudySnapshots.library()
        let kept = ThemeStore.shared.current
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer {
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
            ThemeStore.shared.set(kept, persist: false)
        }
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        var fixture = try await AppSnapshotTests.settingsFixture()
        let crypto = try await Self.defaultAccount()
        defer { crypto.signedOut() }
        #expect(crypto.serverCopy && !crypto.recoveryKeySaved, "the default account: a copy kept, no recovery key")
        fixture.crypto = crypto
        fixture.devices = AddDeviceSnapshots.devices([AddDeviceSnapshots.stale])
        fixture.connections = Self.connections()
        fixture.start = .security
        fixture.close = {}
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        let options: [(String, SecurityStudy?)] = [("before", nil), ("a", .a), ("b", .b), ("c", .c)]
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (name, study) in options {
                for dark in [false, true] {
                    try await AppSnapshotTests.shoot(window(fixture, library: lib, study: study), name: "mac-\(name)-\(dark ? "dark" : "light")",
                                                     size: SidebarStudySnapshots.size, dark: dark, wait: 1.4)
                }
            }
        }
        // The details, one step in: A with "How it works" open, and C with Advanced protection on.
        let facts = SecurityFacts(crypto: crypto, devices: fixture.devices, ais: Self.ais)
        try await AppSnapshotTests.render(SecurityStatusFirst(facts: facts, howOpen: true).frame(width: 640, height: 1040),
                                          name: "detail-a-how-it-works-light", dark: false, wait: 1.0)
        var on = facts
        on.advanced = true
        try await AppSnapshotTests.render(SecurityWhoCanOpen(facts: on).frame(width: 640, height: 560),
                                          name: "detail-c-advanced-on-light", dark: false, wait: 1.0)
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard ListLayoutSnapshots.dir != nil else { return }
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let crypto = try await Self.defaultAccount()
        defer { crypto.signedOut() }
        #expect(crypto.serverCopy)
        let devices = AddDeviceSnapshots.devices([AddDeviceSnapshots.added, AddDeviceSnapshots.stale])
        for (name, study) in [("before", nil), ("a", .a), ("b", .b), ("c", .c)] as [(String, SecurityStudy?)] {
            let route = SettingsRoute(defaults: UserDefaults(suiteName: "security-study-\(UUID())")!)
            route.open(.security)
            let view = SettingsView(backend: backend, sync: nil, crypto: crypto, devices: devices, connections: Self.connections(), route: route)
                .environment(\.securityStudy, study)
            try await ListLayoutSnapshots.shoot(view, "security-\(name)", dark: false, wait: 1.5)
        }
    }
    #endif
}
