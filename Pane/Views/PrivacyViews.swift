import SwiftUI

// Privacy mode's own views (PrivacyMode): the cover that asks when your screen is shared, the
// eye in the toolbar while it's on, and its settings.

/// Put on every window that shows notes: the cover while it asks, and the watching itself.
struct PrivacyCover: ViewModifier {
    @State private var mode = PrivacyMode.shared
    @Environment(\.scenePhase) private var phase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay {
                if mode.asking {
                    PrivacyCoverView(mode: mode)
                        .transition(.opacity)
                }
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: mode.asking)
            .task { mode.watchThisDevice() }
            // Control Centre's switch, set while the app was behind it.
            .onChange(of: phase, initial: true) { _, now in if now == .active { mode.takeUpControl() } }
    }
}

extension View {
    func privacyCover() -> some View { modifier(PrivacyCover()) }

    /// A note's preview, blurred while privacy mode is on (PreviewBlur).
    func previewBlur(revealsOnHover: Bool = true) -> some View {
        modifier(PrivacyPreviewBlur(revealsOnHover: revealsOnHover))
    }
}

/// `previewBlur()`: PreviewBlur, on while privacy mode is.
struct PrivacyPreviewBlur: ViewModifier {
    var revealsOnHover = true
    @State private var mode = PrivacyMode.shared

    func body(content: Content) -> some View {
        content.modifier(PreviewBlur(on: mode.isOn, revealsOnHover: revealsOnHover))
    }
}

/// "Your screen is being shared. Hide your notes?" over the whole window, frosted (solid with
/// Reduce Transparency). While it shows, it is what hides the notes.
struct PrivacyCoverView: View {
    let mode: PrivacyMode
    @State private var remember = false
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        ZStack {
            Group {
                if reduceTransparency {
                    Color.notePage
                } else {
                    Rectangle().fill(.regularMaterial)
                }
            }
            .ignoresSafeArea()
            // Every click and tap lands on the cover, not on the notes under it.
            .contentShape(Rectangle())
            .onTapGesture {}
            .accessibilityHidden(true)
            card
        }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
        .accessibilityIdentifier("privacy.cover")
    }

    private var card: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 30, weight: .regular))
                .foregroundStyle(Color.amberInk)
                .accessibilityHidden(true)
            VStack(spacing: 4) {
                Text(PrivacyWords.coverTitle)
                    .font(titleFont)
                    .multilineTextAlignment(.center)
                    .accessibilityAddTraits(.isHeader)
                Text(PrivacyWords.coverQuestion)
                    .foregroundStyle(.secondary)
            }
            rememberBox
            buttons
        }
        .padding(28)
        .frame(maxWidth: 380)
    }

    private var titleFont: Font {
        #if os(macOS)
        .system(size: 17, weight: .semibold)
        #else
        .title3.weight(.semibold)
        #endif
    }

    @ViewBuilder private var rememberBox: some View {
        #if os(macOS)
        Toggle(PrivacyWords.remember, isOn: $remember)
            .toggleStyle(.checkbox)
            .accessibilityIdentifier("privacy.remember")
        #else
        // iOS has no checkbox: a tick in a circle beside the words, as Notes' checklists.
        Button { remember.toggle() } label: {
            Label(PrivacyWords.remember, systemImage: remember ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(.primary)
        }
        .buttonStyle(.plain)
        .accessibilityValue(remember ? "On" : "Off")
        .accessibilityAddTraits(remember ? [.isSelected] : [])
        .accessibilityIdentifier("privacy.remember")
        #endif
    }

    @ViewBuilder private var buttons: some View {
        let show = Button(PrivacyWords.show) { mode.answer(hide: false, remember: remember) }
            .buttonStyle(.secondary)
            .accessibilityIdentifier("privacy.show")
        let hide = Button(PrivacyWords.hide) { mode.answer(hide: true, remember: remember) }
            .buttonStyle(.amberProminent)
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier("privacy.hide")
        #if os(macOS)
        // The default on the right, as in a Mac alert.
        HStack(spacing: 10) { show; hide }
        #else
        VStack(spacing: 10) { hide.frame(maxWidth: .infinity); show.frame(maxWidth: .infinity) }
        #endif
    }
}

/// The eye in the toolbar while privacy mode is on: it says so, and turns it off.
struct PrivacyEyeButton: View {
    @State private var mode = PrivacyMode.shared

    var body: some View {
        if mode.isOn {
            Button(PrivacyWords.turnOff, systemImage: "eye.slash") { mode.toggle() }
                .labelStyle(.iconOnly)
                .foregroundStyle(Color.amberInk)
                .help(PrivacyWords.help)
                .accessibilityIdentifier("privacy.eye")
        }
    }
}

/// Settings › Privacy › Privacy mode: on or off now, and what happens when your screen is shared.
struct PrivacyModeSection: View {
    @State private var mode = PrivacyMode.shared

    var body: some View {
        Section {
            Toggle(PrivacyWords.name, isOn: Binding(get: { mode.isOn }, set: { mode.setManual($0) }))
                .settingsSwitch()
                .accessibilityIdentifier("settings.privacyMode")
            Picker(PrivacyWords.whenSharedTitle, selection: Binding(get: { mode.whenShared }, set: { mode.whenShared = $0 })) {
                ForEach(PrivacyMode.WhenShared.allCases) { Text($0.title).tag($0) }
            }
            .accessibilityIdentifier("settings.privacyWhenShared")
        } footer: {
            Text(footer).foregroundStyle(.secondary)
        }
    }

    private var footer: String {
        #if os(macOS)
        "\(PrivacyWords.settingsFooter) \(PrivacyWords.whenSharedFooter) The Mac can tell when Zoom, Screen Sharing or a screen recording is on. For a meeting in a browser, use View \u{203A} \(PrivacyWords.menuTitle) (\u{2303}\u{2318}P)."
        #else
        "\(PrivacyWords.settingsFooterPhone) \(PrivacyWords.whenSharedFooter) You can also add it to Control Centre."
        #endif
    }
}

// MARK: Titles in the Mac's list

/// The Mac's note list while privacy mode is on: its titles are blurred until you point anywhere
/// at the list, or move through it with the arrow keys while it has the keys (Emil, 13 November
/// 2026). They blur again a moment after the pointer leaves, so brushing past on the way to the
/// toolbar doesn't flicker. The open note's title always shows. One for each list.
@MainActor @Observable final class ListTitleReveal {
    /// How long the titles stay sharp after the pointer leaves (or the keys move on).
    static let delay: Duration = .milliseconds(300)

    /// The titles show now.
    private(set) var shown = false
    private var over = false
    private var navigating = false
    @ObservationIgnored private let delay: Duration
    @ObservationIgnored private var pending: Task<Void, Never>?

    init(delay: Duration = ListTitleReveal.delay) { self.delay = delay }

    /// The pointer came over the list, or left it.
    func pointer(_ inside: Bool) { over = inside; update() }
    /// An arrow key moved the selection while the list had the keys.
    func navigated() { navigating = true; update() }
    /// The list got or lost the keys; losing them ends moving through it.
    func focus(_ focused: Bool) { if !focused { navigating = false; update() } }

    private func update() {
        pending?.cancel()
        pending = nil
        if over || navigating {
            shown = true
        } else if shown {
            pending = Task { [weak self, delay] in
                try? await Task.sleep(for: delay)
                guard !Task.isCancelled else { return }
                self?.shown = false
            }
        }
    }

    /// Whether a row's title is blurred: on the Mac, with privacy mode on, unless it's the open
    /// note's or the list shows its titles. The iPhone's titles never are.
    nonisolated static func blurs(privacyOn: Bool, open: Bool, revealed: Bool) -> Bool {
        #if os(macOS)
        privacyOn && !open && !revealed
        #else
        false
        #endif
    }
}

extension EnvironmentValues {
    /// The list's title reveal (ListTitleReveal); nil outside a list, where titles blur while privacy mode is on.
    @Entry var listTitleReveal: ListTitleReveal? = nil
}

#if os(macOS)
/// Gives a list its title reveal: one hover region for the whole list, and its arrow keys.
struct RevealsTitles: ViewModifier {
    @State private var reveal = ListTitleReveal()
    @FocusState private var focused: Bool

    func body(content: Content) -> some View {
        content
            .environment(\.listTitleReveal, reveal)
            .onHover { reveal.pointer($0) }
            // Arrow keys move the list's selection; moving through the list shows its titles while
            // it keeps the keys. Ignored, so the list still moves.
            .onKeyPress(keys: [.upArrow, .downArrow, .pageUp, .pageDown, .home, .end], phases: .down) { _ in
                reveal.navigated()
                return .ignored
            }
            .focused($focused)
            .onChange(of: focused) { _, now in reveal.focus(now) }
    }
}
#endif
