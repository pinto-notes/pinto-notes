#if os(iOS)
import SwiftUI
import UIKit

/// Format, in place of the keyboard, laid out like Notes' own on iOS 26: on the system's rounded
/// keyboard sheet, "Format" and a close button, the paragraph styles in one scrolling row (each
/// written in its own face, the caret line's one in a filled capsule), then grouped pills of 50 pt:
/// bold, italic, underline and strikethrough; the three lists, the indents and the block quote.
/// Everything acts on the selection or the caret's line, and the panel follows the caret. The
/// pills are solid (`Palette.Format`); what's on is a solid amber with a white glyph.
struct FormatPanel: View {
    let controller: EditorController

    static let pillHeight: CGFloat = 50
    static let gap: CGFloat = 10
    /// Clear of the sheet's rounded corners.
    static let inset: CGFloat = 20

    var body: some View {
        let state = controller.format
        VStack(alignment: .leading, spacing: 14) {
            header
            styles(state)
            ForEach(Array(FormatControl.rows.enumerated()), id: \.offset) { _, row in
                PillRow(row: row, state: state, apply: controller.apply)
            }
        }
        // The sheet is the system's: iOS 26 lays its keyboard ground, a rounded sheet over the
        // note, behind every input view. A card of our own on it read as a frame in a frame.
        .padding(.horizontal, Self.inset)
        .padding(.top, 18)
        .padding(.bottom, 8)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("format.panel")
    }

    private var header: some View {
        HStack {
            Text("Format")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color.formatInk)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            Button { controller.closeFormatPanel() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.formatInk)
                    .frame(width: 36, height: 36)
                    .background(Color.formatPill, in: Circle())
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
            }
            .buttonStyle(PressScale())
            .accessibilityLabel("Close")
            .accessibilityIdentifier("format.close")
            .padding(.trailing, -4)
        }
    }

    private func styles(_ state: FormatState) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(FormatControl.styles) { style in
                    StyleChip(style: style, on: state.isOn(style), enabled: state.isEnabled(style)) { controller.apply(style) }
                }
            }
        }
        .scrollClipDisabled()
        .padding(.horizontal, -Self.inset)
        .contentMargins(.horizontal, Self.inset - 6, for: .scrollContent)
    }
}

/// A paragraph style, written in its own face; the caret line's one sits in the accent capsule.
private struct StyleChip: View {
    let style: FormatControl
    let on: Bool
    let enabled: Bool
    let action: () -> Void

    private var font: Font {
        switch style {
        case .title: .system(size: 22, weight: .bold)
        case .heading: .system(size: 18, weight: .bold)
        case .subheading: .system(size: 16, weight: .semibold)
        case .monostyled: .system(size: 16, design: .monospaced)
        default: .system(size: 17)
        }
    }

    var body: some View {
        Button(action: action) {
            Text(style.name)
                .font(font)
                .lineLimit(1)
                .fixedSize()
                .foregroundStyle(on ? Color.formatOnGlyph : enabled ? Color.formatInk : Color.formatOff)
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(on ? Color.formatOn : .clear, in: Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(PressScale())
        .disabled(!enabled)
        .accessibilityLabel(style.name)
        .accessibilityIdentifier("format.\(style.rawValue)")
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// One row of pills; every segment in the row is the same width, so a pill of three is three
/// times as wide as a pill of one, as in Notes.
private struct PillRow: View {
    let row: [[FormatControl]]
    let state: FormatState
    let apply: (FormatControl) -> Void

    var body: some View {
        GeometryReader { geo in
            let segments = CGFloat(row.reduce(0) { $0 + $1.count })
            let unit = (geo.size.width - FormatPanel.gap * CGFloat(row.count - 1)) / segments
            HStack(spacing: FormatPanel.gap) {
                ForEach(Array(row.enumerated()), id: \.offset) { _, pill in
                    HStack(spacing: 0) {
                        ForEach(pill) { control in
                            Segment(control: control, on: state.isOn(control), enabled: state.isEnabled(control)) { apply(control) }
                        }
                    }
                    .padding(4)
                    .frame(width: unit * CGFloat(pill.count))
                    .background(Color.formatPill, in: Capsule())
                }
            }
        }
        .frame(height: FormatPanel.pillHeight)
    }
}

/// A glyph in a pill: the label colour on the pill, or white on solid amber when it's on.
private struct Segment: View {
    let control: FormatControl
    let on: Bool
    let enabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: control.symbol)
                .font(.system(size: 19, weight: on ? .semibold : .medium))
                .foregroundStyle(on ? Color.formatOnGlyph : enabled ? Color.formatInk : Color.formatOff)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(on ? Color.formatOn : .clear, in: Capsule())
                .contentShape(Capsule())
        }
        .buttonStyle(PressScale())
        .disabled(!enabled)
        .accessibilityLabel(control.name)
        .accessibilityIdentifier("format.\(control.rawValue)")
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// Hosts the panel as the text view's input view: it takes the keyboard's place, so the caret
/// and the selection stay in the text while it's up.
final class FormatPanelHost: UIInputView {
    private let host: UIHostingController<FormatPanel>

    init(controller: EditorController) {
        host = UIHostingController(rootView: FormatPanel(controller: controller))
        super.init(frame: CGRect(x: 0, y: 0, width: 390, height: 300), inputViewStyle: .default)
        autoresizingMask = [.flexibleWidth, .flexibleHeight]
        backgroundColor = .clear
        host.view.backgroundColor = .clear
        host.view.translatesAutoresizingMaskIntoConstraints = false
        addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            host.view.topAnchor.constraint(equalTo: topAnchor),
            host.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    /// The panel's own height, and the home indicator's room under it.
    override var intrinsicContentSize: CGSize {
        let width = window?.bounds.width ?? UIScreen.main.bounds.width
        let fitted = host.sizeThatFits(in: CGSize(width: width, height: .greatestFiniteMagnitude)).height
        let bottom = window?.safeAreaInsets.bottom ?? 0
        return CGSize(width: UIView.noIntrinsicMetric, height: ceil(fitted) + bottom)
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        invalidateIntrinsicContentSize()
    }

    required init?(coder: NSCoder) { fatalError() }
}

/// The panel's colours (`Palette.Format`), by appearance and Increase Contrast.
extension Color {
    private static func format(_ pick: @escaping (Bool, Bool) -> UInt32) -> Color {
        Color(UIColor { Palette.rgb(pick($0.userInterfaceStyle == .dark, $0.accessibilityContrast == .high)) })
    }
    static let formatPill = format(Palette.Format.pill)
    static let formatInk = format(Palette.Format.glyph)
    static let formatOn = format(Palette.Format.on)
    static let formatOnGlyph = Color(Palette.rgb(Palette.Format.onGlyph))
    /// A control that can't act here (indent on a plain line).
    static let formatOff = Color(UIColor { $0.userInterfaceStyle == .dark ? Palette.muted.resolvedColor(with: $0).withAlphaComponent(0.55) : .tertiaryLabel })
}
#endif
