import SwiftUI

extension ListEditing {
    /// What a line is, for the Format choices: one of these at a time.
    enum ParagraphStyle: Equatable { case title, heading, subheading, body, bulleted, dashed, numbered, checklist, quote }

    /// The style of the caret's line. A note's first written line is its title without any mark.
    static func paragraphStyle(in text: String, selection: NSRange) -> ParagraphStyle {
        let ns = text as NSString
        let lineRange = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: 0))
        let line = ns.substring(with: lineRange).trimmingCharacters(in: .newlines)
        if let hashes = line.range(of: #"^#{1,6}(?= |$)"#, options: .regularExpression) {
            switch line.distance(from: hashes.lowerBound, to: hashes.upperBound) {
            case 1: return .title
            case 2: return .heading
            default: return .subheading
            }
        }
        if line.range(of: #"^[ \t]*>"#, options: .regularExpression) != nil { return .quote }
        if let list = ListPrefix(line: line) {
            if list.checkbox != nil { return .checklist }
            return list.ordered ? .numbered : list.marker == "-" ? .dashed : .bulleted
        }
        let before = ns.substring(to: lineRange.location)
        let first = before.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !line.trimmingCharacters(in: .whitespaces).isEmpty
        return first ? .title : .body
    }
}

#if os(macOS)

/// The toolbar's Aa: what a line of text can be, and nothing else, like Notes. The paragraph
/// styles first, each written the way it looks in the note, then the three lists, then the block
/// quote, and bold, italic, underline and strikethrough as one compact row.
struct FormatPopover: View {
    let controller: EditorController
    /// The style of the line the caret is on, ticked.
    let current: ListEditing.ParagraphStyle?
    /// The alternative look: the row of four first, and every style in the same plain type.
    var formatsFirst = false
    let close: () -> Void

    static let width: CGFloat = 212

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if formatsFirst {
                formats
                rule
            }
            row("Title", .title, font: face(EditorMetrics.title, .bold)) { controller.heading(1) }
            row("Heading", .heading, font: face(EditorMetrics.body * 1.25, .bold)) { controller.heading(2) }
            row("Subheading", .subheading, font: face(EditorMetrics.body * 1.1, .semibold)) { controller.heading(3) }
            row("Body", .body, font: .system(size: 13)) { controller.heading(0) }
            row("Monostyled", nil, font: formatsFirst ? .system(size: 13) : .system(size: 12.5, design: .monospaced), action: controller.code)
            rule
            row("Bulleted List", .bulleted, marker: "•", action: controller.bulletList)
            row("Dashed List", .dashed, marker: "–", action: controller.dashedList)
            row("Numbered List", .numbered, marker: "1.", action: controller.numberedList)
            rule
            row("Block Quote", .quote, marker: "▎", action: controller.blockQuote)
            if !formatsFirst {
                rule
                formats
            }
        }
        .padding(6)
        .frame(width: Self.width)
        .accessibilityIdentifier("format.popover")
    }

    private func face(_ size: CGFloat, _ weight: Font.Weight) -> Font {
        formatsFirst ? .system(size: 13) : .system(size: size, weight: weight)
    }

    private var rule: some View {
        Divider().padding(.horizontal, 8).padding(.vertical, 5)
    }

    /// One choice: it applies to the caret's line (or the selected lines) and the popover closes.
    private func row(_ title: String, _ style: ListEditing.ParagraphStyle?, font: Font = .system(size: 13), marker: String? = nil, action: @escaping () -> Void) -> some View {
        Button {
            action()
            close()
        } label: {
            HStack(spacing: 0) {
                Image(systemName: "checkmark")
                    .font(.system(size: 10, weight: .semibold))
                    .opacity(style != nil && style == current ? 1 : 0)
                    .frame(width: 18, alignment: .leading)
                if let marker {
                    Text(marker).font(.system(size: 13)).foregroundStyle(.secondary).frame(width: 20, alignment: .leading)
                }
                Text(title).font(font)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .frame(minHeight: 26)
            .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(style != nil && style == current ? .isSelected : [])
    }

    /// Bold, italic, underline and strikethrough: four equal buttons on one line. They act on the
    /// selection and the popover stays, so two can be set one after the other.
    private var formats: some View {
        HStack(spacing: 4) {
            format("Bold", "bold", "⌘B", action: controller.bold)
            format("Italic", "italic", "⌘I", action: controller.italic)
            format("Underline", "underline", "⌘U", action: controller.underline)
            format("Strikethrough", "strikethrough", "⇧⌘X", action: controller.strikethrough)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
    }

    private func format(_ title: String, _ symbol: String, _ keys: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .medium))
                .frame(maxWidth: .infinity)
                .frame(height: 28)
                .background(.fill.quaternary, in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                .hoverHighlight(RoundedRectangle(cornerRadius: 7, style: .continuous))
        }
        .buttonStyle(.plain)
        .help("\(title) (\(keys))")
        .accessibilityLabel(title)
    }
}

/// The Aa button in the note's toolbar. A plain button with a popover, not a menu: a menu in the
/// toolbar is drawn apart from the buttons beside it, with a caret (2026-10-11), and this one
/// belongs in one group with Checklist, Table and Attach, like Notes.
struct FormatButton: View {
    let controller: EditorController
    @State private var showing = false
    @State private var current: ListEditing.ParagraphStyle?

    var body: some View {
        Button {
            current = controller.target.map { ListEditing.paragraphStyle(in: $0.currentText, selection: $0.currentSelection) }
            showing.toggle()
        } label: {
            Label("Format", systemImage: "textformat")
        }
        .help("Format")
        .popover(isPresented: $showing, arrowEdge: .bottom) {
            FormatPopover(controller: controller, current: current) { showing = false }
        }
        .accessibilityIdentifier("editor.format")
    }
}
#endif
