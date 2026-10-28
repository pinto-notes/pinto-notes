import SwiftUI

/// The one card at the foot of the sidebar, above your account. One at a time, by what the
/// account has done: "Connect your AI" until an AI is connected (or that card was closed), then
/// "Templates". Each is small, wears a strip of pictures in its own colours, and closes for good:
/// on this device at once (kept per account) and on the account's other devices through its setup
/// marks on the server (`connect_card_closed`, `templates_closed`). Never during the first-run
/// flow, which has the whole window.
enum SidebarCard: Equatable {
    /// iPhone and iPad, before the others, for an account that has never had a Mac: importing
    /// and connecting an AI happen in the Mac app (the iPhone has no first-run steps).
    case mac
    case connect, templates

    static var onMac: Bool {
        #if os(macOS)
        true
        #else
        false
        #endif
    }

    /// Below this the folders need the room, so no card.
    static let minimumSidebarHeight: CGFloat = 540

    /// Which card, if any. Nothing until the server has said what the account has done, so a
    /// card never flashes and swaps.
    static func pick(account: UUID?, progress: SetupProgress?, connectClosedHere: Bool, templatesClosedHere: Bool,
                     sidebarHeight: CGFloat, largestText: Bool = false, mac: Bool = SidebarCard.onMac,
                     hasHadMac: Bool? = nil, macClosedHere: Bool = false,
                     arguments: [String] = ProcessInfo.processInfo.arguments) -> SidebarCard? {
        // At the largest text sizes the folders need every row of the screen.
        guard account != nil, let progress, !largestText, sidebarHeight >= minimumSidebarHeight, !arguments.contains("-uitest") else { return nil }
        // Only once the devices list has said there's no Mac (nil: not known yet), so it never
        // flashes for someone who has one.
        if !mac, hasHadMac == false, !macClosedHere { return .mac }
        if !progress.connected, !progress.connectCardClosed, !connectClosedHere { return .connect }
        if !progress.templatesClosed, !templatesClosedHere { return .templates }
        return nil
    }

    /// The setup mark that closes it on the account's other devices. The Mac card has none: it
    /// only shows on iPhone and iPad, and closing it there is enough.
    var mark: String? {
        switch self {
        case .mac: nil
        case .connect: "connect_card_closed"
        case .templates: "templates_closed"
        }
    }

    static func closedKey(_ card: SidebarCard, _ account: UUID) -> String {
        let name = switch card {
        case .mac: "macCard"
        case .connect: "connectCard"
        case .templates: "templatesCard"
        }
        return "\(name).closed.\(account.uuidString.lowercased())"
    }

    /// Has the account ever had a Mac, by the devices that hold its key? nil until they're known.
    static func hasHadMac(loaded: Bool, others: [KeyDevice]) -> Bool? {
        guard loaded else { return nil }
        return others.contains { $0.platform == "macos" }
    }

    static func isClosedHere(_ card: SidebarCard, _ account: UUID, defaults: UserDefaults = .standard) -> Bool {
        defaults.bool(forKey: closedKey(card, account))
    }

    static func closeHere(_ card: SidebarCard, _ account: UUID, defaults: UserDefaults = .standard) {
        defaults.set(true, forKey: closedKey(card, account))
    }
}

enum MacCardWords {
    static let title = "Get Pinto Notes on your Mac"
    static let line = "Import your notes and connect your AI there. They show up here a moment later."
    static let button = "Send the Mac link to myself"
}

/// "Get Pinto Notes on your Mac": the app's icon, the words, and one tinted button that opens
/// the share sheet with the download link, to send to yourself. It sits right under the folders
/// (not at the foot, where the other cards are) and closes for good.
struct MacCard: View {
    let onClose: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                AppMark(size: 44)
                VStack(alignment: .leading, spacing: 3) {
                    Text(MacCardWords.title)
                        .font(.headline)
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .accessibilityAddTraits(.isHeader)
                    Text(MacCardWords.line)
                        .font(.subheadline)
                        .foregroundStyle(Color.muted)
                        .lineLimit(2)
                        .minimumScaleFactor(0.9)
                        .fixedSize(horizontal: false, vertical: true)
                }
                // Clear of the close button.
                .padding(.trailing, 22)
            }
            ShareLink(item: Self.download, subject: Text("Pinto Notes for Mac"), message: Text("Pinto Notes for Mac")) {
                Label(MacCardWords.button, systemImage: "square.and.arrow.up")
                    .foregroundStyle(Color.amberInk)
            }
            // The design system's secondary button (DESIGN.md, Buttons): a soft fill, under the
            // one amber button a screen may have.
            .buttonStyle(.secondary(.form, wide: true))
            .accessibilityIdentifier("sidebar.mac.open")
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        #if os(iOS)
        .background(Color(Palette.row), in: shape)
        #else
        .background(Color.card, in: shape)
        #endif
        .overlay(alignment: .topTrailing) {
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: 44, height: 44)
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close \(MacCardWords.title)")
            .accessibilityHint("Hides this for good")
            .accessibilityIdentifier("sidebar.mac.close")
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("sidebar.mac")
    }

    static var download: URL {
        #if os(iOS)
        OnboardingFlow.macDownload
        #else
        URL(string: "https://pintonotes.com/download")!
        #endif
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
            // At most three lines, never fixed to its full height: asked for its smallest size
            // at a narrow width, a fixed line grew one word per line, and the window took that
            // as its own smallest height (1.2.9: the window couldn't be made shorter than the screen).
            Text(line).font(Metrics.line).foregroundStyle(Color.muted).lineLimit(3)
        }
    }

    /// The whole card is one button: a click anywhere opens what its link line says. The close
    /// button in the corner is its own button, on top, so a click there only closes.
    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        let label = content
            .padding(.leading, Metrics.padding)
            .padding(.top, Metrics.padding)
            .padding(.bottom, Metrics.padding - 4)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.fill.quaternary, in: shape)
            .hoverOverlay(shape, Color.primary.opacity(0.05))
            .contentShape(shape)
        Button(action: action) { label }
        .buttonStyle(CardPress())
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
            .buttonStyle(.quietIcon)
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
