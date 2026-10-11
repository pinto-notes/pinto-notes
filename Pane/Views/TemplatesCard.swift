import SwiftUI

/// "Templates" at the foot of the sidebar, above your account: one line about the website's
/// templates and a button that opens them. Small and quiet, and closing it closes it for good:
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
    static func shows(account: UUID?, closedHere: Bool, progress: SetupProgress?, sidebarHeight: CGFloat,
                      arguments: [String] = ProcessInfo.processInfo.arguments) -> Bool {
        guard account != nil, !closedHere, progress?.templatesClosed != true else { return false }
        return sidebarHeight >= minimumSidebarHeight && !arguments.contains("-uitest")
    }
}

struct TemplatesCard: View {
    let onClose: () -> Void
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            VStack(alignment: .leading, spacing: 2) {
                Text(TemplatesPromo.title)
                    .font(Metrics.title)
                    .foregroundStyle(Color.ink)
                Text(TemplatesPromo.line)
                    .font(Metrics.line)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            // Room on the right for the close button.
            .padding(.trailing, Metrics.closeSize)
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
        .padding(.horizontal, Metrics.padding)
        .padding(.top, Metrics.padding)
        .padding(.bottom, Metrics.padding - 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.fill.quaternary, in: .rect(cornerRadius: Metrics.radius, style: .continuous))
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
            .accessibilityLabel("Close Templates")
            .accessibilityHint("Hides this for good")
            .accessibilityIdentifier("sidebar.templates.close")
            #if os(macOS)
            .help("Close")
            #endif
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("sidebar.templates")
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
        #endif
    }
}
