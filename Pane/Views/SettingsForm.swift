#if os(macOS)
import AppKit
import SwiftUI

/// Settings on the Mac in the System Settings form Emil picked on 3 November 2026 (direction A of
/// the study): a flat sidebar on the card's own white or pure black, a hairline beside it, and
/// pages of grouped boxes with a summary box at the top. These are its few colours and pieces.
enum SettingsInk {
    static func dynamic(_ light: NSColor, _ dark: NSColor) -> Color {
        Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light })
    }

    /// The card: white, pure black in the dark.
    static let ground = dynamic(.white, .black)
    /// A box of rows, a summary: a step off the ground.
    static let group = dynamic(NSColor(white: 0.965, alpha: 1), NSColor(white: 0.085, alpha: 1))
    /// The selected page in the sidebar: the one selection look.
    static let selection = dynamic(NSColor(white: 0, alpha: 0.07), NSColor(white: 1, alpha: 0.13))
    static let hairline = dynamic(NSColor(white: 0, alpha: 0.09), NSColor(white: 1, alpha: 0.13))
    /// A button on a row: white, a step up from black in the dark.
    static let raised = dynamic(.white, NSColor(white: 0.16, alpha: 1))
    /// A button's and the card's own edge.
    static let edge = dynamic(NSColor(white: 0, alpha: 0.12), NSColor(white: 1, alpha: 0.18))
    static let text = dynamic(NSColor(white: 0.1, alpha: 1), NSColor(white: 0.93, alpha: 1))
    static let muted = dynamic(NSColor(white: 0.42, alpha: 1), NSColor(white: 0.62, alpha: 1))
    static let icon = dynamic(NSColor(white: 0.32, alpha: 1), NSColor(white: 0.72, alpha: 1))
    /// A switch that is on: ink, never a second orange on the page. In the dark a grey deep enough
    /// that the white knob stands out at 4:1 (0.62 put it at 2.7:1 and read as switched off or
    /// disabled, council round 3, 11-04).
    static let switchOn = dynamic(NSColor(white: 0.12, alpha: 1), NSColor(white: 0.5, alpha: 1))
}

/// A page's content: its boxes one under another, as wide as the page's column.
struct SettingsStack<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 20) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The box at the top of a page that says where things stand (you, who has access, the space used).
struct SettingsSummary<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(SettingsInk.group))
    }
}

/// A group of rows under a short header, in a box, a hairline between each two; a line under it.
struct SettingsGroup<Content: View>: View {
    var header: String? = nil
    var footer: String? = nil
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            if let header {
                Text(header)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SettingsInk.muted)
                    .padding(.leading, 4)
                    .accessibilityAddTraits(.isHeader)
            }
            _VariadicView.Tree(SettingsDivided(inset: 14)) { content }
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(SettingsInk.group))
            if let footer {
                Text(footer)
                    .font(.system(size: 12))
                    .foregroundStyle(SettingsInk.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 4)
            }
        }
    }
}

/// Rows with a hairline between each two.
private struct SettingsDivided: _VariadicView_MultiViewRoot {
    var inset: CGFloat = 0

    func body(children: _VariadicView.Children) -> some View {
        VStack(spacing: 0) {
            ForEach(children) { child in
                child.padding(.horizontal, inset)
                if child.id != children.last?.id { SettingsInk.hairline.frame(height: 0.5).padding(.leading, inset) }
            }
        }
    }
}

/// A row: its name on the left (a line under it, when there's more to say), its control on the right.
struct SettingsLine<Leading: View, Trailing: View>: View {
    let title: String
    var detail: String? = nil
    var red = false
    @ViewBuilder var leading: Leading
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(spacing: 12) {
            leading
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 13)).foregroundStyle(red ? Color.red : SettingsInk.text)
                if let detail {
                    Text(detail).font(.system(size: 11.5)).foregroundStyle(SettingsInk.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .accessibilityElement(children: .combine)
            Spacer(minLength: 12)
            trailing
        }
        .padding(.vertical, 9)
        .frame(minHeight: 44)
    }
}

extension SettingsLine where Leading == EmptyView {
    init(title: String, detail: String? = nil, red: Bool = false, @ViewBuilder trailing: () -> Trailing) {
        self.init(title: title, detail: detail, red: red, leading: { EmptyView() }, trailing: trailing)
    }
}

extension SettingsLine where Leading == EmptyView, Trailing == EmptyView {
    init(title: String, detail: String? = nil, red: Bool = false) {
        self.init(title: title, detail: detail, red: red, leading: { EmptyView() }, trailing: { EmptyView() })
    }
}

extension View {
    /// A switch on the right of a Settings row: the system's, in ink.
    func settingsSwitch() -> some View {
        toggleStyle(.switch).labelsHidden().tint(SettingsInk.switchOn).controlSize(.small)
    }
}

/// A row that leaves the app or opens something: its name, and an arrow or chevron at the end.
struct SettingsLinkLine: View {
    let title: String
    var detail: String? = nil
    var symbol: String? = nil
    var trailing = "arrow.up.right"

    var body: some View {
        SettingsLine(title: title, detail: detail) {
            if let symbol {
                Image(systemName: symbol).font(.system(size: 13)).foregroundStyle(SettingsInk.icon).frame(width: 20)
            }
        } trailing: {
            Image(systemName: trailing).font(.system(size: 11, weight: .semibold)).foregroundStyle(SettingsInk.muted)
        }
        .contentShape(.rect)
    }
}
#endif
