import SwiftUI

/// "Templates" at the foot of the sidebar, above your account: one line about the website's
/// templates, a few of their covers in their own colours, and a button that opens them. Small,
/// and closing it closes it for good:
/// on this device at once (kept per account), and on your other devices through the account's
/// setup marks on the server (`pane_setup_mark('templates_closed')`). It is never on screen
/// during the first-run flow, which has the whole window.
enum TemplatesPromo {
    static let title = "Templates"
    static let line = "Trackers, plans and lists your AI can keep"
    static let button = "Browse templates"

    /// The website's templates, tagged so the site can count visits from here.
    static let url = URL(string: "https://pintonotes.com/templates?utm_source=app&utm_medium=sidebar")!

    /// Below this the folders need the room, so the card stays away.
    static let minimumSidebarHeight: CGFloat = 540

    static func closedKey(_ account: UUID) -> String { "templatesCard.closed.\(account.uuidString.lowercased())" }

    static func isClosedHere(_ account: UUID, defaults: UserDefaults = .standard) -> Bool { defaults.bool(forKey: closedKey(account)) }
    static func closeHere(_ account: UUID, defaults: UserDefaults = .standard) { defaults.set(true, forKey: closedKey(account)) }

    /// Shown to a signed-in account that hasn't closed it here or anywhere, in a sidebar tall
    /// enough for it. Captures and UI tests (`-uitest`) draw the sidebar without it.
    static func shows(account: UUID?, closedHere: Bool, progress: SetupProgress?, sidebarHeight: CGFloat, largestText: Bool = false,
                      arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
        // At the largest text sizes the folders need every row of the screen.
        guard account != nil, !closedHere, progress?.templatesClosed != true, !largestText else { return false }
        return sidebarHeight >= minimumSidebarHeight && !arguments.contains("-uitest")
    }
}

struct TemplatesCard: View {
    /// Two looks, for choosing between. `strip`: three of the website's template covers fanned
    /// beside the words. `cover`: one cover across the top of the card.
    enum Style: String { case strip, cover }

    var style: Style = .strip
    let onClose: () -> Void
    @Environment(\.openURL) private var openURL

    /// The website's own paper-cut covers (web/public/templates/covers), small.
    static let covers = ["TemplateHabitTracker", "TemplateMealPlan", "TemplateTripPlan"]

    var body: some View {
        Group {
            switch style {
            case .strip: strip
            case .cover: cover
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.fill.quaternary, in: .rect(cornerRadius: Metrics.radius, style: .continuous))
        .clipShape(.rect(cornerRadius: Metrics.radius, style: .continuous))
        .overlay(alignment: .topTrailing) { close }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("sidebar.templates")
    }

    /// The words, with three covers fanned at the right like cards in a hand; the button under
    /// both, so it keeps to one line in a narrow sidebar.
    private var strip: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            HStack(alignment: .center, spacing: 8) {
                titleAndLine
                Spacer(minLength: 0)
                ZStack {
                    ForEach(Array(Self.covers.enumerated()), id: \.offset) { i, name in
                        thumb(name, size: Metrics.thumb)
                            .rotationEffect(.degrees(Double(i - 1) * 9))
                            .offset(x: CGFloat(i - 1) * Metrics.thumb * 0.42, y: abs(CGFloat(i - 1)) * 3)
                            .zIndex(i == 1 ? 1 : 0)
                    }
                }
                .frame(width: Metrics.thumb * 2.1, height: Metrics.thumb * 1.2)
                .padding(.trailing, Metrics.closeSize - 2)
                .accessibilityHidden(true)
            }
            open
        }
        .padding(.leading, Metrics.padding)
        .padding(.top, Metrics.padding)
        .padding(.bottom, Metrics.padding - 4)
    }

    /// One cover across the top, the words under it.
    private var cover: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 0) {
                ForEach(Self.covers, id: \.self) { name in
                    Image(name).resizable().interpolation(.high).scaledToFill()
                        .frame(maxWidth: .infinity).frame(height: Metrics.band).clipped()
                }
            }
            .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: Metrics.gap) {
                titleAndLine
                open
            }
                .padding(.horizontal, Metrics.padding)
                .padding(.top, Metrics.padding - 2)
                .padding(.bottom, Metrics.padding - 4)
        }
    }

    private var titleAndLine: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(TemplatesPromo.title)
                .font(Metrics.title)
                .foregroundStyle(Color.ink)
            Text(TemplatesPromo.line)
                .font(Metrics.line)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var open: some View {
        Button { openURL(TemplatesPromo.url) } label: {
            HStack(spacing: 3) {
                Text(TemplatesPromo.button)
                Image(systemName: "arrow.up.right").font(Metrics.arrow)
            }
            .frame(minHeight: Metrics.buttonHeight)
            .contentShape(.rect)
        }
        .buttonStyle(.hoverLink)
        .font(Metrics.button)
        .foregroundStyle(Color.amberInk)
        .accessibilityHint("Opens pintonotes.com in your browser")
        .accessibilityIdentifier("sidebar.templates.open")
    }

    private func thumb(_ name: String, size: CGFloat) -> some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.16, style: .continuous)
        return Image(name).resizable().interpolation(.high).scaledToFill()
            .frame(width: size, height: size)
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.white.opacity(0.7), lineWidth: 1.5))
            .shadow(color: .black.opacity(0.18), radius: 3, y: 1.5)
    }

    private var close: some View {
        Button(action: onClose) {
            Image(systemName: "xmark")
                .font(.system(size: Metrics.closeGlyph, weight: .semibold))
                .foregroundStyle(style == .cover ? AnyShapeStyle(.white) : AnyShapeStyle(.secondary))
                .frame(width: Metrics.closeSize, height: Metrics.closeSize)
                .background { if style == .cover { Circle().fill(.black.opacity(0.35)).padding(Metrics.closeSize * 0.14) } }
                .contentShape(.rect)
        }
        .buttonStyle(.hoverIcon(cornerRadius: Metrics.closeSize / 2))
        .padding(Metrics.closeInset)
        .accessibilityLabel("Close Templates")
        .accessibilityHint("Hides this for good")
        .accessibilityIdentifier("sidebar.templates.close")
        #if os(macOS)
        .help("Close")
        #endif
    }

    enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 12, weight: .semibold)
        static let line = Font.system(size: 11)
        static let button = Font.system(size: 11, weight: .semibold)
        static let arrow = Font.system(size: 8, weight: .semibold)
        static let gap: CGFloat = 4
        static let padding: CGFloat = 10
        static let radius: CGFloat = 8
        static let buttonHeight: CGFloat = 20
        static let closeSize: CGFloat = 20
        static let closeGlyph: CGFloat = 8
        static let closeInset: CGFloat = 4
        static let thumb: CGFloat = 36
        static let band: CGFloat = 44
        #else
        static let title = Font.subheadline.weight(.semibold)
        static let line = Font.footnote
        static let button = Font.footnote.weight(.semibold)
        static let arrow = Font.caption2.weight(.semibold)
        static let gap: CGFloat = 4
        static let padding: CGFloat = 14
        static let radius: CGFloat = 14
        static let buttonHeight: CGFloat = 36
        static let closeSize: CGFloat = 44
        static let closeGlyph: CGFloat = 11
        static let closeInset: CGFloat = 0
        static let thumb: CGFloat = 54
        static let band: CGFloat = 64
        #endif
    }
}

extension EnvironmentValues {
    /// Design review: which of the card's two looks to draw.
    @Entry var templatesCardStyle: TemplatesCard.Style = .strip
}
