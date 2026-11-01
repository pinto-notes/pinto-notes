import SwiftUI
import Testing
@testable import PintoNotes
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Settings › Appearance › Mode: System by default, kept per device, and put on the whole app.
@MainActor @Suite(.serialized) struct AppearanceModeTests {
    func defaults() -> UserDefaults { UserDefaults(suiteName: "AppearanceModeTests.\(UUID().uuidString)")! }

    @Test func systemIsTheDefault() {
        let d = defaults()
        #expect(AppearanceModeStore(defaults: d, applies: false).mode == .system)
        #expect(AppearanceMode.allCases.map(\.title) == ["System", "Light", "Dark"])
        #expect(AppearanceMode.system.colorScheme == nil, "System follows the system")
        // A Default theme stays with System: picking a theme never sets a mode.
        let themes = ThemeStore(defaults: d)
        themes.theme = .sepia
        themes.theme = .standard
        #expect(AppearanceModeStore(defaults: d, applies: false).mode == .system)
        #expect(d.string(forKey: AppearanceModeStore.key) == nil)
    }

    @Test func theModeIsKeptForTheNextLaunch() {
        let d = defaults()
        let store = AppearanceModeStore(defaults: d, applies: false)
        store.mode = .dark
        #expect(AppearanceModeStore(defaults: d, applies: false).mode == .dark, "the next launch is dark too")
        store.mode = .light
        #expect(AppearanceModeStore(defaults: d, applies: false).mode == .light)
        store.mode = .system
        #expect(d.string(forKey: AppearanceModeStore.key) == nil, "System stores nothing, like the Default theme")
        d.set("sideways", forKey: AppearanceModeStore.key)
        #expect(AppearanceModeStore(defaults: d, applies: false).mode == .system, "something unknown is System")
    }

    #if os(macOS)
    /// Light and Dark set the app's appearance, which every window, panel and sheet follows;
    /// System clears it.
    @Test func theModeIsPutOnTheWholeApp() {
        let kept = NSApp.appearance
        defer { NSApp.appearance = kept }
        let store = AppearanceModeStore(defaults: defaults(), applies: true)
        store.mode = .dark
        #expect(NSApp.appearance?.name == .darkAqua, "every window, panel and sheet without one of its own follows the app's")
        store.mode = .light
        #expect(NSApp.appearance?.name == .aqua)
        store.mode = .system
        #expect(NSApp.appearance == nil, "System: the app follows the system again")
        #expect(AppearanceModeStore.appearance(.system) == nil)
    }

    /// The unit-test host never takes a mode someone set on this Mac.
    @Test func theTestHostLeavesTheAppAlone() {
        #expect(NSApp.appearance == nil)
    }
    #else
    @Test func theModeIsPutOnEveryWindow() {
        #expect(AppearanceModeStore.style(.system) == .unspecified)
        #expect(AppearanceModeStore.style(.light) == .light)
        #expect(AppearanceModeStore.style(.dark) == .dark)
        let scene = try? #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        guard let scene else { return }
        let window = UIWindow(windowScene: scene)
        defer { window.isHidden = true }
        AppearanceModeStore.apply(.dark)
        #expect(window.overrideUserInterfaceStyle == .dark)
        AppearanceModeStore.apply(.system)
        #expect(window.overrideUserInterfaceStyle == .unspecified)
    }
    #endif
}
