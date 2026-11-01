#if os(iOS)
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The iPhone half of the accessibility before-and-after pictures (A11yBeforeAfterShots lays out
/// the sheets): the Format panel in dark mode, before and after the A11yStudy.formatOn fix, and the
/// Appearance page's accent dots with two study layouts. On a simulator:
/// `TEST_RUNNER_PANE_A11Y_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:PaneTests/A11yBeforeAfterPhoneShots CODE_SIGNING_ALLOWED=NO`
@MainActor @Suite(.serialized) struct A11yBeforeAfterPhoneShots {
    static func render(_ window: UIWindow) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        return UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
    }

    static func look(_ accent: AccentChoice, formatOn: Bool) {
        A11yStudy.formatOn = formatOn
        Palette.forgetBuiltColours()
        ThemeStore.shared.set(ThemeLook(theme: .paper, accent: .graphite), persist: false)
        ThemeStore.shared.set(ThemeLook(theme: .standard, accent: accent), persist: false)
    }

    @Test func pictures() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_A11Y_SHOTS"].map({ URL(fileURLWithPath: $0).appending(path: "raw-ios") }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer {
            A11yStudy.formatOn = false
            Palette.forgetBuiltColours()
            ThemeStore.shared.set(kept, persist: false)
        }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)

        // 3. The Format panel on a dark keyboard-sheet grey, the body line's style on.
        for accent in [AccentChoice.blue, .green] {
            for after in [false, true] {
                Self.look(accent, formatOn: after)
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(x: 0, y: 0, width: 520, height: 874)
                window.overrideUserInterfaceStyle = .dark
                let root = UIViewController()
                root.view.backgroundColor = UIColor(white: 0.17, alpha: 1)
                window.rootViewController = root
                window.isHidden = false
                let panel = FormatPanelHost(controller: EditorController())
                root.view.addSubview(panel)
                let height = panel.intrinsicContentSize.height
                panel.frame = CGRect(x: 0, y: 0, width: 520, height: height)
                try? await Task.sleep(for: .seconds(0.8))
                panel.layoutIfNeeded()
                window.frame = CGRect(x: 0, y: 0, width: 520, height: height - 40)
                try? await Task.sleep(for: .seconds(0.3))
                let image = Self.render(window)
                window.isHidden = true
                try #require(image.pngData()).write(to: dir.appending(path: "format-\(accent.rawValue)-\(after ? "after" : "before").png"))
            }
        }

        // 8. The Appearance section, then the two study layouts.
        Self.look(.blue, formatOn: false)
        let pages: [(String, AnyView)] = [
            ("dots-before", AnyView(Form { AppearanceSection() })),
            ("dots-a", AnyView(Form { AccentStudyA() })),
            ("dots-b", AnyView(NavigationStack { Form { AccentStudyB() } })),
        ]
        for (name, view) in pages {
            let window = UIWindow(windowScene: scene)
            window.frame = CGRect(x: 0, y: 0, width: 402, height: name == "dots-b" ? 860 : 520)
            window.overrideUserInterfaceStyle = .light
            window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)))
            window.isHidden = false
            try? await Task.sleep(for: .seconds(0.8))
            let image = Self.render(window)
            window.isHidden = true
            try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
        }
    }
}

/// Study, option a: the theme row as today, then the accents on their own rows under the label, each
/// a 30 pt dot inside a 44 by 44 pt target, ringed and ticked when chosen.
private struct AccentStudyA: View {
    var body: some View {
        let look = ThemeStore.shared.look
        Section {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 62, maximum: 80), spacing: 10)], alignment: .leading, spacing: 10) {
                ForEach(Theme.allCases) { theme in ThemeTile(theme: theme, selected: look.theme == theme) {} }
            }
            .padding(.vertical, 4)
            VStack(alignment: .leading, spacing: 6) {
                Text("Accent")
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(44), spacing: 12), count: 6), alignment: .leading, spacing: 6) {
                    ForEach(AccentChoice.allCases) { choice in
                        let hex = choice.hex ?? look.theme.preview.accent
                        let selected = look.accent == choice
                        Circle().fill(hex.color).frame(width: 30, height: 30)
                            .overlay { if selected { Image(systemName: "checkmark").font(.system(size: 13, weight: .heavy)).foregroundStyle(.white) } }
                            .padding(4)
                            .overlay(Circle().strokeBorder(selected ? hex.color : .clear, lineWidth: 2.5))
                            .frame(width: 44, height: 44)
                            .accessibilityLabel(choice.spokenName)
                    }
                }
                Text(AccentChoice.allCases.first { $0 == look.accent }.map { $0.spokenName } ?? "")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .padding(.vertical, 4)
        } header: {
            Text("Appearance")
        } footer: {
            Text("Follows light and dark mode. Set on each device.")
        }
    }
}

/// Study, option b: one Accent row with the chosen accent's dot and name, and the list it opens.
private struct AccentStudyB: View {
    var body: some View {
        let look = ThemeStore.shared.look
        Section {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 62, maximum: 80), spacing: 10)], alignment: .leading, spacing: 10) {
                ForEach(Theme.allCases) { theme in ThemeTile(theme: theme, selected: look.theme == theme) {} }
            }
            .padding(.vertical, 4)
            HStack {
                Text("Accent")
                Spacer()
                Circle().fill((look.accent.hex ?? look.theme.preview.accent).color).frame(width: 14, height: 14)
                Text(look.accent.spokenName).foregroundStyle(.secondary)
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
            }
            .frame(minHeight: 44)
        } header: {
            Text("Appearance")
        }
        Section {
            ForEach(AccentChoice.allCases) { choice in
                HStack(spacing: 12) {
                    Circle().fill((choice.hex ?? look.theme.preview.accent).color).frame(width: 22, height: 22)
                    Text(choice.spokenName)
                    Spacer()
                    if look.accent == choice { Image(systemName: "checkmark").fontWeight(.semibold).foregroundStyle(.tint) }
                }
                .frame(minHeight: 44)
            }
        } header: {
            Text("Accent (the page the row opens)")
        }
    }
}
#endif
