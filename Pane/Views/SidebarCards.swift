import SwiftUI

/// The one card at the foot of the sidebar, above your account. One at a time, by what the
/// account has done: "Connect your AI" until an AI is connected (or that card was closed), then
/// "Templates". Each is small, wears a strip of pictures in its own colours, and closes for good:
/// on this device at once (kept per account) and on the account's other devices through its setup
/// marks on the server (`connect_card_closed`, `templates_closed`). Never during the first-run
/// flow, which has the whole window.
enum SidebarCard: Equatable {
    case connect, templates

    /// Below this the folders need the room, so no card.
    static let minimumSidebarHeight: CGFloat = 540

    /// Which card, if any. Nothing until the server has said what the account has done, so a
    /// card never flashes and swaps.
    static func pick(account: UUID?, progress: SetupProgress?, connectClosedHere: Bool, templatesClosedHere: Bool,
                     sidebarHeight: CGFloat, largestText: Bool = false,
                     arguments: [String] = ProcessInfo.processInfo.arguments) -> SidebarCard? {
        // At the largest text sizes the folders need every row of the screen.
        guard account != nil, let progress, !largestText, sidebarHeight >= minimumSidebarHeight, !arguments.contains("-uitest") else { return nil }
        if !progress.connected, !progress.connectCardClosed, !connectClosedHere { return .connect }
        if !progress.templatesClosed, !templatesClosedHere { return .templates }
        return nil
    }

    var mark: String {
        switch self {
        case .connect: "connect_card_closed"
        case .templates: "templates_closed"
        }
    }

    static func closedKey(_ card: SidebarCard, _ account: UUID) -> String {
        "\(card == .connect ? "connectCard" : "templatesCard").closed.\(account.uuidString.lowercased())"
    }

    static func isClosedHere(_ card: SidebarCard, _ account: UUID, defaults: UserDefaults = .standard) -> Bool {
        defaults.bool(forKey: closedKey(card, account))
    }

    static func closeHere(_ card: SidebarCard, _ account: UUID, defaults: UserDefaults = .standard) {
        defaults.set(true, forKey: closedKey(card, account))
    }
}

enum ConnectCardWords {
    static let title = "Connect your AI"
    static let line = "So your AI can use your notes."
    static let button = "Connect an AI"
    static let marks = ["ChatGPT", "Claude", "Another AI"]
}

enum TemplatesPromo {
    static let title = "Templates"
    static let line = "Lists and trackers for your AI"
    static let button = "Browse templates"

    /// The website's templates, tagged so the site can count visits from here.
    static let url = URL(string: "https://pintonotes.com/templates?utm_source=app&utm_medium=sidebar")!

    /// The website's own paper-cut covers (web/public/templates/covers), each cropped to a square
    /// around its subject: the covers keep their subject in the top half for the site's title.
    static let covers = ["TemplateHabitTracker", "TemplateMealPlan", "TemplateTripPlan"]
}

/// "Connect your AI": the AIs' own marks fanned beside the words; the button opens Connect an AI.
struct ConnectCard: View {
    let onConnect: () -> Void
    let onClose: () -> Void

    var body: some View {
        SidebarCardShell(id: "sidebar.connect", title: ConnectCardWords.title, line: ConnectCardWords.line,
                         button: ConnectCardWords.button, opensWeb: false, action: onConnect, onClose: onClose) { size in
            ForEach(Array(ConnectCardWords.marks.enumerated()), id: \.offset) { i, ai in
                AITile(ai: ai, size: size * 0.86)
                    .rotationEffect(.degrees(Double(i - 1) * 9))
                    .offset(x: CGFloat(i - 1) * size * 0.42, y: abs(CGFloat(i - 1)) * 3)
                    .zIndex(i == 1 ? 1 : 0)
            }
        }
    }
}

/// "Templates": three of the website's covers fanned beside the words; the button opens them.
struct TemplatesCard: View {
    let onClose: () -> Void
    @Environment(\.openURL) private var openURL

    var body: some View {
        SidebarCardShell(id: "sidebar.templates", title: TemplatesPromo.title, line: TemplatesPromo.line,
                         button: TemplatesPromo.button, opensWeb: true, action: { openURL(TemplatesPromo.url) }, onClose: onClose) { size in
            ForEach(Array(TemplatesPromo.covers.enumerated()), id: \.offset) { i, name in
                Self.thumb(name, size: size)
                    .rotationEffect(.degrees(Double(i - 1) * 9))
                    .offset(x: CGFloat(i - 1) * size * 0.42, y: abs(CGFloat(i - 1)) * 3)
                    .zIndex(i == 1 ? 1 : 0)
            }
        }
    }

    static func thumb(_ name: String, size: CGFloat) -> some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.16, style: .continuous)
        return Image(name).resizable().interpolation(.high).scaledToFill()
            .frame(width: size, height: size)
            .clipShape(shape)
            .overlay(shape.strokeBorder(Color.white.opacity(0.7), lineWidth: 1.5))
            .shadow(color: .black.opacity(0.18), radius: 3, y: 1.5)
    }
}

/// What both cards share: the words, the fanned pictures at the right, the button under both
/// (so it keeps to one line in a narrow sidebar), and the close button in the corner.
struct SidebarCardShell<Art: View>: View {
    let id: String
    let title: String
    let line: String
    let button: String
    /// The button leaves the app (an arrow says so).
    let opensWeb: Bool
    let action: () -> Void
    let onClose: () -> Void
    @ViewBuilder let art: (CGFloat) -> Art

    typealias Metrics = SidebarCardMetrics

    /// The card's width: below `Metrics.sideBySide` the pictures go above the words, so a narrow
    /// sidebar (the Mac's default, about as wide as Notes' own) never squeezes the words into a
    /// tall column.
    @State private var width: CGFloat = 0
    private var stacked: Bool { width < Metrics.sideBySide }

    private var words: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(Metrics.title).foregroundStyle(Color.ink).lineLimit(1).minimumScaleFactor(0.85)
            Text(line).font(Metrics.line).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
        }
    }

    /// The whole card is one button: a click anywhere opens what its link line says. The close
    /// button in the corner is its own button, on top, so a click there only closes.
    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        Button(action: action) {
            content
                .padding(.leading, Metrics.padding)
                .padding(.top, Metrics.padding)
                .padding(.bottom, Metrics.padding - 4)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.fill.quaternary, in: shape)
                .hoverOverlay(shape, Color.primary.opacity(0.05))
                .contentShape(shape)
        }
        .buttonStyle(SidebarCardPress())
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
        .clipShape(shape)
        // One button for VoiceOver: the words, then what it does.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(title). \(line)")
        .accessibilityHint(opensWeb ? "\(button). Opens pintonotes.com in your browser" : button)
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("\(id).open")
        .overlay(alignment: .topTrailing) {
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: Metrics.closeGlyph, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: Metrics.closeSize, height: Metrics.closeSize)
                    .contentShape(.rect)
            }
            .buttonStyle(.hoverIcon(cornerRadius: Metrics.closeSize / 2))
            .padding(Metrics.closeInset)
            .accessibilityLabel("Close \(title)")
            .accessibilityHint("Hides this for good")
            .accessibilityIdentifier("\(id).close")
            #if os(macOS)
            .help("Close")
            #endif
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(id)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            if stacked {
                // The pictures in a row on top, small, out of the close button's way.
                ZStack { art(Metrics.stackedThumb) }
                    .frame(width: Metrics.stackedThumb * 2.1, height: Metrics.stackedThumb * 1.15)
                    .padding(.bottom, 2)
                words.padding(.trailing, Metrics.padding)
            } else {
                HStack(alignment: .center, spacing: 8) {
                    words
                    Spacer(minLength: 0)
                    ZStack { art(Metrics.thumb) }
                        .frame(width: Metrics.thumb * 2.1, height: Metrics.thumb * 1.2)
                        .padding(.trailing, Metrics.closeSize - 2)
                }
            }
            // What a click on the card does, said as a link line; the card is the button.
            HStack(spacing: 3) {
                Text(button)
                Image(systemName: opensWeb ? "arrow.up.right" : "chevron.right").font(Metrics.arrow)
            }
            .font(Metrics.button)
            .foregroundStyle(Color.amberInk)
            .frame(minHeight: Metrics.buttonHeight)
        }
    }
}

/// A card pressed: it dims a little and settles a touch smaller, the way the app's large choices do.
struct SidebarCardPress: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.8 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

enum SidebarCardMetrics {
    #if os(macOS)
    static let title = Font.system(size: 12, weight: .semibold)
    static let line = Font.system(size: 11)
    static let button = Font.system(size: 11, weight: .semibold)
    static let arrow = Font.system(size: 8, weight: .semibold)
    static let gap: CGFloat = 4
    static let padding: CGFloat = 10
    static let radius: CGFloat = 8
    static let buttonHeight: CGFloat = 20
    /// The X: a 24-point target, its glyph a little larger than the words' size (2026-10-12).
    static let closeSize: CGFloat = 24
    static let closeGlyph: CGFloat = 10.5
    static let closeInset: CGFloat = 3
    static let thumb: CGFloat = 36
    static let stackedThumb: CGFloat = 28
    /// Wide enough for the pictures beside the words.
    static let sideBySide: CGFloat = 300
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
    static let closeGlyph: CGFloat = 14
    static let closeInset: CGFloat = 0
    static let thumb: CGFloat = 54
    static let stackedThumb: CGFloat = 40
    static let sideBySide: CGFloat = 320
    #endif
}
