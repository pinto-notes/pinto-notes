import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Settings › Security as built from the picked study (2026-11-01): the Mac's card (tiles) and the
/// iPhone's page (by reason), light and dark, the iPhone at accessibility text size 2 too, for a
/// standard account (Pinto Notes keeps a copy) and one with Advanced protection on. Device names
/// are marked "(sample)". Offscreen, into pinto-internal/evidence/security-page-final:
/// Mac: `TEST_RUNNER_AMBER_HIG_SHOTS=$PINTO_INTERNAL/evidence/security-page-final scripts/qa-test.sh PaneTests/SecurityPageSnapshots`.
/// iPhone: the same suite on a simulator (`TEST_RUNNER_AMBER_HIG_SHOTS=… xcodebuild test -scheme Pane
/// -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -only-testing:PaneHIGTests/SecurityPageSnapshots CODE_SIGNING_ALLOWED=NO`).
extension SecurityPageSnapshots {
    /// The two kinds of account: a copy kept by Pinto Notes, and Advanced protection on.
    static func accounts() async throws -> [(String, AccountCrypto)] {
        [("standard", await AdvancedProtectionHiddenTests.standard()), ("advanced", try await AdvancedProtectionHiddenTests.strict())]
    }

    #if os(macOS)
    /// The real window under the Settings card, as SidebarStudySnapshots draws it.
    private func window(_ card: some View, library: ModelContainer) -> some View {
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
        .environment(\.controlActiveState, .key)
        .tint(Color(PColor.paneAccent))
        .modelContainer(library)
    }

    @Test func macCard() async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let lib = try SidebarStudySnapshots.library()
        let kept = ThemeStore.shared.current
        defer {
            ProfileStore.shared.showForPreview(name: nil, photo: nil)
            ThemeStore.shared.set(kept, persist: false)
        }
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: .theme), persist: false)
        let fixture = try await AppSnapshotTests.settingsFixture()
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        try await AppSnapshotTests.withLastNote(lib, "Trip documents") {
            for (name, crypto) in try await Self.accounts() {
                defer { crypto.signedOut() }
                let route = SettingsRoute(defaults: UserDefaults(suiteName: "security-final-\(UUID())")!)
                var v = SettingsView(backend: fixture.backend, sync: nil, crypto: crypto, devices: AddDeviceSnapshots.devices([Self.mac, Self.phone]),
                                     connections: Self.ais, route: route)
                v.start = .security
                v.close = {}
                for dark in [false, true] {
                    try await AppSnapshotTests.shoot(window(v, library: lib), name: "mac-\(name)-\(dark ? "dark" : "light")",
                                                     size: SidebarStudySnapshots.size, dark: dark, wait: 1.4)
                }
                // "How it works", opened.
                let content = SecurityContent(crypto: crypto, devices: AddDeviceSnapshots.devices([Self.mac, Self.phone]), connections: Self.ais)
                try await AppSnapshotTests.render(HowItWorksSheet(content: content).tint(Color(PColor.paneAccent)),
                                                  name: "mac-\(name)-how-it-works-light", dark: false, wait: 1.0)
            }
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard ListLayoutSnapshots.dir != nil else { return }
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        for (name, crypto) in try await Self.accounts() {
            defer { crypto.signedOut() }
            let devices = AddDeviceSnapshots.devices([Self.mac, Self.phone])
            func page(_ type: DynamicTypeSize) -> some View {
                let route = SettingsRoute(defaults: UserDefaults(suiteName: "security-final-\(UUID())")!)
                route.open(.security)
                return SettingsView(backend: backend, sync: nil, crypto: crypto, devices: devices, connections: Self.ais, route: route)
                    .environment(\.dynamicTypeSize, type)
            }
            for dark in [false, true] {
                try await ListLayoutSnapshots.shoot(page(.large), name, dark: dark, wait: 1.5)
                try await ListLayoutSnapshots.shoot(page(.large), "\(name)-end", dark: dark, scroll: .infinity, wait: 1.5)
            }
            // Accessibility text size 2, top, middle and end: nothing may be cut short.
            for (part, scroll) in [("", 0), ("-mid", 800), ("-end", .infinity)] as [(String, CGFloat)] {
                try await ListLayoutSnapshots.shoot(page(.accessibility2), "\(name)-ax2\(part)", dark: false, scroll: scroll, wait: 1.5)
            }
        }
    }

    /// Settings on iPhone, signed in: the list and every page, light and dark, and each page's end
    /// (7 November 2026). `-only-testing:PaneHIGTests/SecurityPageSnapshots/phoneSettings()`.
    @Test func phoneSettings() async throws {
        guard ListLayoutSnapshots.dir != nil else { return }
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        ProfileStore.shared.showForPreview(name: "Sara Lind", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let crypto = try await AdvancedProtectionHiddenTests.standard()
        defer { crypto.signedOut() }
        let devices = AddDeviceSnapshots.devices([SecurityPageSnapshots.mac, SecurityPageSnapshots.phone])
        func view(_ tab: SettingsPage?) -> some View {
            let route = SettingsRoute(defaults: UserDefaults(suiteName: "phone-settings-\(UUID())")!)
            if let tab { route.open(tab) }
            return SettingsView(backend: backend, sync: nil, crypto: crypto, devices: devices, connections: SecurityPageSnapshots.ais, route: route)
        }
        let tabs: [SettingsPage?] = [nil] + SettingsPage.groups.flatMap { $0 } + [.account, .signIn, .encryption, .aiConnection, .addAI]
        if let first = AIList.connected(SecurityPageSnapshots.ais).first { AISelection.shared.select(first) }
        for tab in tabs {
            let name = "phone-\(tab?.rawValue ?? "home")"
            for dark in [false, true] {
                try await ListLayoutSnapshots.shoot(view(tab), "\(name)-\(dark ? "dark" : "light")", dark: dark, wait: 1.5)
            }
            try await ListLayoutSnapshots.shoot(view(tab), "\(name)-end-light", dark: false, scroll: .infinity, wait: 1.5)
        }
    }
    #endif
}
