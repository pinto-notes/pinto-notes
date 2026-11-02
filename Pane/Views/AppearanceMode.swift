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

/// Settings › Appearance: light or dark, the theme and the accent, all for this device.
struct AppearancePage: View {
    /// How many are on screen, for tests: Appearance shows on its own page only.
    @MainActor static var onScreen = 0

    var body: some View {
        AppearanceModeSection()
            .onAppear { Self.onScreen += 1 }
            .onDisappear { Self.onScreen -= 1 }
        AppearanceSection()
    }
}

/// System, Light and Dark as three small pictures of the window, like the theme cards (and like
/// System Settings' own Appearance).
struct AppearanceModeSection: View {
    @State private var store = AppearanceModeStore.shared

    var body: some View {
        Section {
            LazyVGrid(columns: AppearanceGrid.columns, alignment: .leading, spacing: 10) {
                ForEach(AppearanceMode.allCases) { mode in
                    ModeTile(mode: mode, theme: ThemeStore.shared.look.theme, selected: store.mode == mode) { store.mode = mode }
                }
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Mode")
        } header: {
            Text("Mode")
        }
    }
}

/// The columns the mode and theme cards sit in: small cards on the Mac, three across on iPhone,
/// each wide enough to tap.
enum AppearanceGrid {
    #if os(iOS)
    static let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)
    #else
    static let columns = [GridItem(.adaptive(minimum: 62, maximum: 80), spacing: 10)]
    #endif
}

/// A small picture of the window in the theme, light, dark, or half of each for System.
private struct ModeTile: View {
    let mode: AppearanceMode
    let theme: Theme
    let selected: Bool
    let pick: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 7, style: .continuous)
        Button(action: pick) {
            VStack(spacing: 5) {
                picture
                    .frame(height: 42)
                    .clipShape(shape)
                    .overlay(shape.strokeBorder(Color(PColor.paneSeparator), lineWidth: 1))
                    .padding(2)
                    .overlay(RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .strokeBorder(selected ? Color(PColor.paneAccent) : .clear, lineWidth: 2))
                Text(mode.title)
                    .font(.caption)
                    .foregroundStyle(selected ? Color.ink : Color.muted)
                    .lineLimit(1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.tile(radius: 9))
        .accessibilityLabel(mode.title)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier("settings.mode.\(mode.rawValue)")
    }

    @ViewBuilder private var picture: some View {
        switch mode {
        case .light: window(dark: false)
        case .dark: window(dark: true)
        case .system:
            // Light on the left, dark on the right, split down the middle.
            window(dark: false).overlay {
                GeometryReader { geo in
                    window(dark: true).mask(alignment: .trailing) { Rectangle().frame(width: geo.size.width / 2) }
                }
            }
        }
    }

    private func window(dark: Bool) -> some View {
        let c = theme.preview
        func color(_ h: Theme.Hex) -> Color { let v = dark ? h.dark : h.light; return Color(Palette.pair(v, v)) }
        return HStack(spacing: 0) {
            color(c.sidebar).frame(width: 16)
            ZStack(alignment: .topLeading) {
                color(c.page)
                VStack(alignment: .leading, spacing: 4) {
                    Capsule().fill(color(c.ink)).frame(width: 26, height: 4)
                    Capsule().fill(color(c.muted)).frame(width: 18, height: 3)
                    Capsule().fill(color(c.muted)).frame(width: 30, height: 3)
                }
                .padding(6)
            }
        }
    }
}
