import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Light or dark for the whole app, or whatever the system is set to. Set on each device, like
/// the theme (Settings › Appearance).
enum AppearanceMode: String, CaseIterable, Identifiable, Sendable {
    case system, light, dark

    var id: String { rawValue }

    var title: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    /// For SwiftUI's `preferredColorScheme`: nil follows the system.
    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

/// The mode this device uses, kept in its defaults, and put on the app: `NSApp.appearance` on the
/// Mac (every window, panel and sheet follows it), the windows' `overrideUserInterfaceStyle` on
/// iPhone. Applied before the first window shows, so a launch never flashes the other mode.
@MainActor
@Observable
final class AppearanceModeStore {
    static let shared = AppearanceModeStore(applies: !PaneApp.isUnitTestHost)
    static let key = "PintoAppearance"

    @ObservationIgnored private let defaults: UserDefaults
    /// Off in the unit-test host, so a stored mode never changes what other tests draw.
    @ObservationIgnored private let applies: Bool

    var mode: AppearanceMode {
        didSet {
            guard mode != oldValue else { return }
            // System is the default and stores nothing, like the Default theme.
            defaults.set(mode == .system ? nil : mode.rawValue, forKey: Self.key)
            if applies { apply() }
        }
    }

    init(defaults: UserDefaults = .standard, applies: Bool = true) {
        self.defaults = defaults
        self.applies = applies
        mode = defaults.string(forKey: Self.key).flatMap(AppearanceMode.init(rawValue:)) ?? .system
    }

    /// Puts the mode on the app now.
    func apply() { if applies { Self.apply(mode) } }

    #if os(macOS)
    /// The app's appearance for `mode`: nil follows the system.
    static func appearance(_ mode: AppearanceMode) -> NSAppearance? {
        switch mode {
        case .system: nil
        case .light: NSAppearance(named: .aqua)
        case .dark: NSAppearance(named: .darkAqua)
        }
    }

    static func apply(_ mode: AppearanceMode) {
        let app = NSApplication.shared
        guard app.appearance?.name != appearance(mode)?.name else { return }
        app.appearance = appearance(mode)
        // The editor's text keeps colours it worked out; draw it again, as a theme change does.
        DispatchQueue.main.async { ThemeRedraw.all() }
    }
    #else
    static func style(_ mode: AppearanceMode) -> UIUserInterfaceStyle {
        switch mode {
        case .system: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }

    static func apply(_ mode: AppearanceMode) {
        for scene in UIApplication.shared.connectedScenes {
            for w in (scene as? UIWindowScene)?.windows ?? [] { w.overrideUserInterfaceStyle = style(mode) }
        }
    }

    /// Every window as it first shows (before it draws): the notes, and any the system adds.
    @ObservationIgnored private var watch: NSObjectProtocol?
    func watchWindows() {
        guard applies, watch == nil else { return }
        watch = NotificationCenter.default.addObserver(forName: UIWindow.didBecomeVisibleNotification, object: nil, queue: .main) { n in
            nonisolated(unsafe) let window = n.object as? UIWindow
            MainActor.assumeIsolated {
                window?.overrideUserInterfaceStyle = Self.style(AppearanceModeStore.shared.mode)
            }
        }
    }
    #endif
}

extension View {
    /// The app's root: SwiftUI's own scheme follows the mode too (`pinned`: a test run's), so
    /// SwiftUI never puts the other one back on the window. The Mac's comes from `NSApp.appearance`.
    func followsAppearanceMode(pinned: ColorScheme?) -> some View { modifier(FollowsAppearanceMode(pinned: pinned)) }
}

private struct FollowsAppearanceMode: ViewModifier {
    let pinned: ColorScheme?
    @State private var store = AppearanceModeStore.shared

    func body(content: Content) -> some View {
        #if os(iOS)
        content.preferredColorScheme(pinned ?? store.mode.colorScheme)
        #else
        content.preferredColorScheme(pinned)
        #endif
    }
}
