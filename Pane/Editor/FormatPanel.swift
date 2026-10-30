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
        // No forehead: the first row sits as far from the top as the pills from the sides, as in
        // Notes (Emil, 30 October 2026: "format panel has a forehead for some reason").
        .padding(.top, Self.inset)
        .padding(.bottom, 8)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("format.panel")
    }

    /// The close button's circle, the first row's height; its target reaches past it to 44 pt.
    static let closeSize: CGFloat = 36

    /// Where the first row was laid out, in the window (tests).
    static var firstRowFrame: CGRect = .zero

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
                    .frame(width: Self.closeSize, height: Self.closeSize)
                    .background(Color.formatPill, in: Circle())
                    .padding(4)
                    .contentShape(Circle())
            }
            .buttonStyle(PressScale())
            .accessibilityLabel("Close")
            .accessibilityIdentifier("format.close")
            .padding(-4)
        }
        .frame(height: Self.closeSize)
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { Self.firstRowFrame = $0 }
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
struct StyleChip: View {
    let style: FormatControl
    let on: Bool
    let enabled: Bool
    let action: () -> Void

    /// The note's own face for the style, from the styler, never a copy of its numbers.
    static func font(_ style: FormatControl) -> UIFont { MarkdownStyler().font(for: style) ?? MarkdownStyler().bodyFont }

    var body: some View {
        Button(action: action) {
            Text(style.name)
                .font(Font(Self.font(style)))
                .tracking(MarkdownStyler().kern(for: style))
                .lineLimit(1)
                .fixedSize()
                .foregroundStyle(on ? Color.formatOnGlyph : enabled ? Color.formatInk : Color.formatOff)
                .padding(.horizontal, 14)
                // A Title too tall for the row makes the row taller; it's never shrunk.
                .padding(.vertical, 4)
                .frame(minHeight: 44)
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

/// How the panel and the keyboard change places. Normally they trade places on the keyboard's own
/// curve and timing (the system's keyboard move); with Reduce Motion one fades into the other.
enum FormatPanelMotion: Equatable {
    case trade, crossFade

    static func motion(reduceMotion: Bool) -> FormatPanelMotion { reduceMotion ? .crossFade : .trade }
    static var now: FormatPanelMotion { motion(reduceMotion: UIAccessibility.isReduceMotionEnabled || forceReduceMotion) }
    /// Captures: `-uitest -reduceMotion` plays the Reduce Motion version.
    static let forceReduceMotion = ProcessInfo.processInfo.arguments.contains("-uitest") && ProcessInfo.processInfo.arguments.contains("-reduceMotion")
    static let fadeDuration: CFTimeInterval = 0.25
    /// Longer than the keyboard's move down and the panel's up.
    static let holdDuration: TimeInterval = 0.7
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

    private var fadeIn: TimeInterval?

    /// Reduce Motion: the panel's controls fade in where the keyboard was, once it's there.
    func fadeInOnArrival(_ duration: TimeInterval) {
        fadeIn = duration
        host.view.alpha = 0
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil, let fadeIn {
            self.fadeIn = nil
            UIView.animate(withDuration: fadeIn, delay: 0, options: [.beginFromCurrentState]) { self.host.view.alpha = 1 }
        }
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
