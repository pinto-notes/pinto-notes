import SwiftUI

// The design system (docs/DESIGN.md) in code: the radius scale, the three button kinds in their three
// sizes, the shared shadow and the one toast. Every ButtonStyle in the app lives in this file, and a
// call site picks a kind and a size, never a height or a radius (AmberButtonTests pins both).

/// One radius scale everywhere (DESIGN.md, Shape). Concentric corners: an inner shape's radius is
/// the outer one minus the padding between them.
enum Radius {
    /// Tags, inline chips, small icon wells.
    static let xs: CGFloat = 6
    /// Rows, menu items, small buttons (28 pt).
    static let sm: CGFloat = 10
    /// Buttons of 40 and 50 pt, fields.
    static let md: CGFloat = 14
    /// Cards, popovers, toasts.
    static let lg: CGFloat = 20
    /// Sheets, the sign-in card, big illustrated panels.
    static let xl: CGFloat = 28
}

/// A button's size: its height, corners and title follow from it.
enum ButtonSize: CaseIterable, Sendable {
    /// 50 pt: onboarding, sign-in on iPhone, the website.
    case big
    /// 40 pt: the default, and every form row on the Mac.
    case regular
    /// 28 pt: rows, toolbars, sheets' small actions.
    case compact

    /// The height DESIGN.md gives the size.
    var designHeight: CGFloat {
        switch self {
        case .big: 50
        case .regular: 40
        case .compact: 28
        }
    }

    /// The height it's drawn at: on iPhone never under 44 pt, Apple's smallest target.
    var height: CGFloat {
        #if os(iOS)
        max(designHeight, 44)
        #else
        designHeight
        #endif
    }

    var radius: CGFloat { self == .compact ? Radius.sm : Radius.md }

    /// The title's size: about the size Sign in with Apple draws at the same height, so the
    /// sign-in form's buttons read as one family.
    var textSize: CGFloat {
        #if os(macOS)
        switch self {
        case .big: 17
        case .regular: 15
        case .compact: 13
        }
        #else
        switch self {
        case .big: 18
        case .regular: 17
        case .compact: 15
        }
        #endif
    }

    var padding: CGFloat {
        switch self {
        case .big: 24
        case .regular: 18
        case .compact: 12
        }
    }

    /// The form's size: sign-in, the key screens and the first-run flow. 40 on the Mac, 50 on iPhone.
    static var form: ButtonSize {
        #if os(macOS)
        .regular
        #else
        .big
        #endif
    }
}

/// What every button kind shares: a press dips to 0.97 in 120 ms, keyboard focus draws a 2 pt
/// accent ring 2 pt outside, and Reduce Motion keeps it still.
private struct ButtonChrome: ViewModifier {
    let shape: AnyShape
    let pressed: Bool
    let focused: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay {
                if focused { shape.stroke(Color(Palette.amber), lineWidth: 2).padding(-3) }
            }
            .contentShape(shape)
            .scaleEffect(pressed && !reduceMotion ? 0.97 : 1)
            .animation(.easeOut(duration: 0.12), value: pressed)
    }
}

// MARK: Primary

/// The primary button, the one thing to do on a screen: the deeper amber with a bold white label,
/// the same in light and dark (the system's prominent style takes the dark-mode amber, under which
/// white text reads at about 2:1). Disabled turns a quiet warm grey with muted text, and a
/// destructive button (`Button(role: .destructive)`) is the deeper red instead.
///
///     Button("Done") { … }.buttonStyle(.amberProminent)                       // compact, as wide as its title
///     Button("Continue") { … }.buttonStyle(.amberProminent(.form, wide: true)) // a form's full-width row
///
/// `.amberBusy(true)` swaps the label for a spinner of the same size, so nothing moves.
struct AmberProminentButtonStyle: ButtonStyle {
    var size: ButtonSize = .compact
    /// Full width (a form's row) instead of as wide as the title.
    var wide = false
    /// A long title in a narrow place takes a second line instead of being cut.
    var wraps = false

    func makeBody(configuration: Configuration) -> some View {
        AmberProminentButton(configuration: configuration, size: size, wide: wide, wraps: wraps)
    }

    /// The fills and the label's colour, for the contrast test.
    static let fill = Palette.amberButton
    static let destructiveFill = Palette.destructiveButton
    static let label = PColor.white
    static let disabledFill = Palette.disabledButton
    static let disabledLabel = Palette.disabledButtonLabel
}

extension ButtonStyle where Self == AmberProminentButtonStyle {
    static var amberProminent: AmberProminentButtonStyle { .init() }
    static var amberProminentWrapping: AmberProminentButtonStyle { .init(wraps: true) }
    static func amberProminent(_ size: ButtonSize, wide: Bool = false) -> AmberProminentButtonStyle { .init(size: size, wide: wide) }
}

private struct AmberBusyKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var amberBusy: Bool {
        get { self[AmberBusyKey.self] }
        set { self[AmberBusyKey.self] = newValue }
    }
}

extension View {
    /// Shows a primary button's spinner in place of its label (and says so to VoiceOver).
    func amberBusy(_ busy: Bool) -> some View {
        environment(\.amberBusy, busy)
    }
}

private struct AmberProminentButton: View {
    let configuration: ButtonStyleConfiguration
    let size: ButtonSize
    let wide: Bool
    var wraps = false
    @Environment(\.amberBusy) private var busy
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.hoverPreview) private var preview
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var hovering = false
    #if os(iOS)
    /// How far the person's text size has moved the body text from its default: the title
    /// grows with it, as every other label does.
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1
    #endif

    var body: some View {
        let shape = AnyShape(RoundedRectangle(cornerRadius: size.radius, style: .continuous))
        // A busy button stays solid: it's working, not unavailable.
        let off = !isEnabled && !busy
        let fill = off ? AmberProminentButtonStyle.disabledFill
            : configuration.role == .destructive ? AmberProminentButtonStyle.destructiveFill : AmberProminentButtonStyle.fill
        return configuration.label
            .font(.system(size: textSize, weight: .bold))
            .foregroundStyle(Color(off ? AmberProminentButtonStyle.disabledLabel : AmberProminentButtonStyle.label))
            .lineLimit(wraps ? 3 : twoLines ? 2 : 1)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: twoLines || wraps)
            // Room above and below a title that grows, so a large title never meets the edge.
            .padding(.vertical, twoLines ? 12 : wraps || grows ? 6 : 0)
            // Busy: the label keeps its place (so nothing moves) and a spinner sits on it.
            .opacity(busy ? 0 : 1)
            .overlay { if busy { AmberSpinner(reduceMotion: reduceMotion) } }
            .padding(.horizontal, size.padding)
            .frame(maxWidth: wide ? .infinity : nil)
            // The size's height, until a larger text size or a second line needs more.
            .frame(minHeight: size.height * growth, maxHeight: grows || wraps || twoLines ? nil : size.height)
            .background {
                shape
                    .fill(Color(fill))
                    // Under the pointer a touch lighter; pressed, darker.
                    .overlay {
                        if configuration.isPressed { shape.fill(.black.opacity(0.14)) }
                        else if !off && (hovering || preview.contains("*")) { shape.fill(.white.opacity(0.12)) }
                    }
            }
            .modifier(ButtonChrome(shape: shape, pressed: configuration.isPressed, focused: isFocused))
            .modifier(HoverTracking(hovering: $hovering))
            .accessibilityValue(busy ? Text("Working") : Text(""))
    }

    private var textSize: CGFloat {
        #if os(iOS)
        (size.textSize * scale).rounded()
        #else
        size.textSize
        #endif
    }

    /// At the accessibility sizes a title that doesn't fit takes a second line instead of being cut.
    private var twoLines: Bool {
        #if os(iOS)
        typeSize.isAccessibilitySize
        #else
        false
        #endif
    }

    /// The height follows the title's size, up to half as tall again (past that the title wraps).
    private var growth: CGFloat {
        #if os(iOS)
        grows ? min(max(scale, 1), 1.5) : 1
        #else
        1
        #endif
    }

    /// Whether the button may grow past its height: on iPhone, when the text size is larger than the default.
    private var grows: Bool {
        #if os(iOS)
        typeSize > .large
        #else
        false
        #endif
    }
}

/// The busy button's spinner: a white arc that turns (the Mac's own spinner draws grey, and dimmed
/// in a disabled button). With Reduce Motion it holds still.
private struct AmberSpinner: View {
    let reduceMotion: Bool

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { context in
            let turn = reduceMotion ? 0 : context.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 0.9) / 0.9
            Circle()
                .trim(from: 0, to: 0.72)
                .stroke(Color(AmberProminentButtonStyle.label), style: StrokeStyle(lineWidth: 2, lineCap: .round))
                .frame(width: 14, height: 14)
                .rotationEffect(.degrees(turn * 360))
        }
        .accessibilityHidden(true)
    }
}

// MARK: Secondary

/// Every other button with a shape: the soft fill and an ink label, no border. Under the pointer
/// the fill leans toward amber.
///
///     Button("Not now") { … }.buttonStyle(.secondary)
///     Button("Sign in with Google") { … }.buttonStyle(.secondary(.form, wide: true))
struct SecondaryButtonStyle: ButtonStyle {
    var size: ButtonSize = .compact
    var wide = false

    func makeBody(configuration: Configuration) -> some View {
        SecondaryButton(configuration: configuration, size: size, wide: wide)
    }

    static let fill = Palette.soft
    static let label = Palette.ink
}

extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { .init() }
    static func secondary(_ size: ButtonSize, wide: Bool = false) -> SecondaryButtonStyle { .init(size: size, wide: wide) }
}

private struct SecondaryButton: View {
    let configuration: ButtonStyleConfiguration
    let size: ButtonSize
    let wide: Bool
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.hoverPreview) private var preview
    @State private var hovering = false

    var body: some View {
        let shape = AnyShape(RoundedRectangle(cornerRadius: size.radius, style: .continuous))
        let on = isEnabled && (hovering || preview.contains("*"))
        configuration.label
            .font(.system(size: size.textSize, weight: .semibold))
            .foregroundStyle(Color(isEnabled ? SecondaryButtonStyle.label : Palette.disabledButtonLabel))
            .lineLimit(1)
            .padding(.horizontal, size.padding)
            .frame(maxWidth: wide ? .infinity : nil)
            .frame(height: size.height)
            .background {
                shape.fill(Color(isEnabled ? SecondaryButtonStyle.fill : Palette.disabledButton))
                    .overlay {
                        if configuration.isPressed { shape.fill(Color(Palette.amber).opacity(0.2)) }
                        else if on { shape.fill(Color(Palette.amber).opacity(0.12)) }
                    }
            }
            .modifier(ButtonChrome(shape: shape, pressed: configuration.isPressed, focused: isFocused))
            .modifier(HoverTracking(hovering: $hovering))
    }
}

// MARK: Quiet

/// Cancel, Back, Skip, Not now: no fill until the pointer is over it, a muted label that turns to
/// ink. `icon` buttons (a close ×, a glyph in a card or a toolbar row) keep their glyph's own
/// colour and get the soft fill under the pointer.
///
///     Button("Skip for now") { … }.buttonStyle(.quiet)
///     Button { … } label: { Image(systemName: "xmark") }.buttonStyle(.quietIcon)
struct QuietButtonStyle: ButtonStyle {
    var size: ButtonSize = .compact
    var icon = false
    /// Room around a bare symbol, so the fill isn't tight on its ink.
    var padding: CGFloat = 0

    /// How far a quiet text button's word sits in from its edge: a Back above a heading moves left
    /// by this much, so the word lines up with the heading.
    static let inset = ButtonSize.compact.padding * 0.75

    func makeBody(configuration: Configuration) -> some View {
        QuietButton(configuration: configuration, size: size, icon: icon, padding: padding)
    }
}

extension ButtonStyle where Self == QuietButtonStyle {
    static var quiet: QuietButtonStyle { .init() }
    static func quiet(_ size: ButtonSize) -> QuietButtonStyle { .init(size: size) }
    static var quietIcon: QuietButtonStyle { .init(icon: true) }
    static func quietIcon(padding: CGFloat) -> QuietButtonStyle { .init(icon: true, padding: padding) }
}

private struct QuietButton: View {
    let configuration: ButtonStyleConfiguration
    let size: ButtonSize
    let icon: Bool
    let padding: CGFloat
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.hoverPreview) private var preview
    @State private var hovering = false

    var body: some View {
        let on = isEnabled && (hovering || preview.contains("*"))
        if icon {
            #if os(macOS)
            let shape = AnyShape(RoundedRectangle(cornerRadius: Radius.xs, style: .continuous))
            configuration.label
                .padding(padding)
                .opacity(isEnabled ? 1 : 0.5)
                .background {
                    if configuration.isPressed { shape.fill(Color.soft).overlay(shape.fill(Color(Palette.amber).opacity(0.14))) }
                    else if on { shape.fill(Color.soft) }
                }
                .modifier(ButtonChrome(shape: shape, pressed: configuration.isPressed, focused: isFocused))
                .modifier(HoverTracking(hovering: $hovering))
            #else
            // On iPhone, as the plain style draws it.
            configuration.label.padding(padding).opacity(configuration.isPressed ? 0.6 : isEnabled ? 1 : 0.5)
            #endif
        } else {
            let shape = AnyShape(RoundedRectangle(cornerRadius: size.radius, style: .continuous))
            configuration.label
                .font(.system(size: size.textSize, weight: .semibold))
                .foregroundStyle(on || configuration.isPressed ? Color.ink : Color.muted)
                .opacity(isEnabled ? 1 : 0.5)
                .lineLimit(1)
                .padding(.horizontal, size.padding * 0.75)
                .frame(minHeight: size.height)
                .background {
                    if configuration.isPressed { shape.fill(Color.soft).overlay(shape.fill(Color(Palette.amber).opacity(0.14))) }
                    else if on { shape.fill(Color.soft) }
                }
                .modifier(ButtonChrome(shape: shape, pressed: configuration.isPressed, focused: isFocused))
                .modifier(HoverTracking(hovering: $hovering))
        }
    }
}

// MARK: Words and cards that act

/// Words inside a sentence or a list (a link in the consent line, an item in a PDF's outline):
/// underlined under the pointer, dimmed while pressed. A link also shows the pointing hand. Not a
/// button with a shape, so not one of the three kinds.
struct HoverTextButtonStyle: ButtonStyle {
    var link = false

    func makeBody(configuration: Configuration) -> some View {
        HoverTextButton(configuration: configuration, link: link)
    }
}

private struct HoverTextButton: View {
    let configuration: ButtonStyleConfiguration
    let link: Bool
    @State private var hovering = false
    @Environment(\.hoverPreview) private var preview
    @Environment(\.isEnabled) private var enabled

    var body: some View {
        let on = enabled && (hovering || preview.contains("*"))
        configuration.label
            .underline(on)
            .opacity(configuration.isPressed ? 0.6 : enabled ? 1 : 0.5)
            .contentShape(.rect)
            .modifier(HoverTracking(hovering: $hovering))
            #if os(macOS)
            .pointerStyle(link && enabled ? .link : nil)
            #endif
    }
}

extension ButtonStyle where Self == HoverTextButtonStyle {
    static var hoverText: HoverTextButtonStyle { .init() }
    static var hoverLink: HoverTextButtonStyle { .init(link: true) }
}

/// Something that draws its own look and only needs a press: an embed's card, a format bar's
/// glyph, Apple's and Google's sign-in buttons. It dips to 0.97 in 120 ms.
struct PressScale: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        PressScaleBody(configuration: configuration)
    }
}

private struct PressScaleBody: View {
    let configuration: ButtonStyleConfiguration
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.97 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

/// A large choice or card pressed (an AI to connect, a card in the sidebar): it dims a little and
/// settles a touch smaller (a big shape at 0.97 moves too far).
struct CardPress: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: Depth

extension View {
    /// The one shadow recipe for raised things (cards, popovers, toasts): a 1 px `line` ring, a
    /// contact shadow and one long soft shadow tinted brown. Nothing in the editor or the list has one.
    func raised<S: InsettableShape>(in shape: S) -> some View {
        self
            .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
            .shadow(color: Color(Palette.shadow).opacity(0.6), radius: 1, y: 1)
            .shadow(color: Color(Palette.shadow), radius: 16, y: 8)
    }
}

extension View {
    /// A large choice that is a button (an AI to connect, a place to import from, a list of them):
    /// the card fill a step lighter than its ground, a contact shadow for its edge, and under the
    /// pointer a lean toward amber. No border: borders mark content, never controls. `lit`: the
    /// one being set up, in the soft amber.
    func choiceCard<S: InsettableShape>(_ shape: S, lit: Bool = false) -> some View {
        self
            .background(lit ? Color.amberSoft : Color.card, in: shape)
            .hoverOverlay(shape, Color(Palette.amber).opacity(0.07))
            .shadow(color: Color(Palette.shadow).opacity(0.55), radius: 0.75, y: 0.75)
            .contentShape(shape)
    }
}

// MARK: Toast

/// The one toast (DESIGN.md, Overlays): the card fill, the large radius, the shared shadow, a
/// symbol (or a spinner while it works) and one line of text. Bottom centre on the Mac.
struct Toast: View {
    enum Kind { case done, working, failed }
    let text: String
    var kind = Kind.done

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
        HStack(spacing: 8) {
            switch kind {
            case .working: ProgressView().controlSize(.small)
            case .done: Image(systemName: "checkmark.circle.fill").symbolRenderingMode(.hierarchical).foregroundStyle(Color(Palette.amber))
            case .failed: Image(systemName: "exclamationmark.triangle.fill").symbolRenderingMode(.multicolor)
            }
            Text(text)
                .foregroundStyle(Color.ink)
                .lineLimit(1)
        }
        .font(.system(size: ButtonSize.compact.textSize, weight: .semibold))
        .padding(.horizontal, 16)
        .frame(minHeight: 40)
        // Solid, so the note behind never shows through.
        .background(Color.card, in: shape)
        .raised(in: shape)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.updatesFrequently)
    }
}
