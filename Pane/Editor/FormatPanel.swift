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

/// The table's own panel, in the keyboard's place like Format (Emil, 1 November 2026: "the table
/// formatting panel should be like the Aa formatting sheet"): "Table" and a close button, then
/// pills of two: rows, columns, deleting them, and Delete Table. What you add most comes first.
/// A choice closes the panel, so the keyboard is back for what it made.
struct TablePanel: View {
    let controller: EditorController

    var body: some View {
        let menu = controller.currentTableMenu
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Table")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Color.formatInk)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Button { controller.closeTablePanel() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.formatInk)
                        .frame(width: FormatPanel.closeSize, height: FormatPanel.closeSize)
                        .background(Color.formatPill, in: Circle())
                        .padding(4)
                        .contentShape(Circle())
                }
                .buttonStyle(PressScale())
                .accessibilityLabel("Close")
                .accessibilityIdentifier("table.close")
                .padding(-4)
            }
            .frame(height: FormatPanel.closeSize)
            ForEach(Self.rows, id: \.self) { row in
                HStack(spacing: FormatPanel.gap) {
                    ForEach(row, id: \.self) { title in
                        if let item = menu?.item(title) { TablePill(item: item) { controller.runTablePanel(item) } }
                    }
                }
            }
        }
        .padding(.horizontal, FormatPanel.inset)
        .padding(.top, FormatPanel.inset)
        .padding(.bottom, 8)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("table.panel")
    }

    static let rows: [[String]] = [
        ["Add Row Below", "Add Row Above"],
        ["Add Column After", "Add Column Before"],
        ["Delete Row", "Delete Column"],
        ["Delete Table"],
    ]
}

/// One of the Table panel's actions: its symbol and its name on a pill, red when it deletes.
private struct TablePill: View {
    let item: TableMenu.Item
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let action = TableAction.allCases.first(where: { $0.title == item.title }) {
                    TableGlyph(action: action)
                } else {
                    Image(systemName: item.systemImage).font(.system(size: 17, weight: .medium)).frame(width: TableGlyph.size.width)
                }
                Text(item.title).font(.system(size: 15, weight: .medium)).lineLimit(1).minimumScaleFactor(0.75).allowsTightening(true)
            }
            .foregroundStyle(!item.enabled ? Color.formatOff : item.destructive ? Color.red : Color.formatInk)
            // Icons in one line down the panel, so they read as a list.
            .padding(.horizontal, 14)
            .frame(maxWidth: .infinity, minHeight: FormatPanel.pillHeight, alignment: .leading)
            .background(Color.formatPill, in: Capsule())
            .contentShape(Capsule())
        }
        .buttonStyle(PressScale())
        .disabled(!item.enabled)
        .accessibilityLabel(item.title)
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
    private let host: UIHostingController<AnyView>

    /// `table`: the Table panel instead of Format.
    init(controller: EditorController, table: Bool = false) {
        host = UIHostingController(rootView: table ? AnyView(TablePanel(controller: controller)) : AnyView(FormatPanel(controller: controller)))
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

/// A small table drawn for a row or column action (Emil, 1 November 2026: arrows and a trash can
/// said too little). Three rows and three columns; adding fills the band at the edge where the new
/// row or column goes, deleting fills the middle one. It takes the pill's colour, so deletes are red.
struct TableGlyph: View {
    let action: TableAction
    static let size = CGSize(width: 20, height: 16)

    var body: some View {
        Canvas { ctx, size in
            let rect = CGRect(origin: .zero, size: size).insetBy(dx: 0.75, dy: 0.75)
            let w = rect.width / 3, h = rect.height / 3
            let band: CGRect = switch action {
            case .addRowAbove: CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: h)
            case .addRowBelow: CGRect(x: rect.minX, y: rect.maxY - h, width: rect.width, height: h)
            case .deleteRow: CGRect(x: rect.minX, y: rect.minY + h, width: rect.width, height: h)
            case .addColumnBefore: CGRect(x: rect.minX, y: rect.minY, width: w, height: rect.height)
            case .addColumnAfter: CGRect(x: rect.maxX - w, y: rect.minY, width: w, height: rect.height)
            case .deleteColumn: CGRect(x: rect.minX + w, y: rect.minY, width: w, height: rect.height)
            }
            let ink = GraphicsContext.Shading.foreground
            ctx.fill(Path(band), with: ink)
            var lines = Path()
            for i in 1...2 {
                lines.move(to: CGPoint(x: rect.minX + w * CGFloat(i), y: rect.minY))
                lines.addLine(to: CGPoint(x: rect.minX + w * CGFloat(i), y: rect.maxY))
                lines.move(to: CGPoint(x: rect.minX, y: rect.minY + h * CGFloat(i)))
                lines.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + h * CGFloat(i)))
            }
            ctx.stroke(lines, with: ink, lineWidth: 1)
            ctx.stroke(Path(roundedRect: rect, cornerRadius: 2.5), with: ink, lineWidth: 1.5)
        }
        .frame(width: Self.size.width, height: Self.size.height)
        .accessibilityHidden(true)
    }
}
#endif
