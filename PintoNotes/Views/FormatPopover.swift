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
/// The toolbar's Aa: what a line of text can be, and nothing else, laid out like Notes' own.
/// A thin row of plain glyphs for bold, italic, underline and strikethrough; a hairline; the
/// paragraph styles, each written in its own face and size; the three lists with their marker
/// before the name; a hairline; the block quote. The style of the caret's line is ticked.
struct FormatPopover: View {
    let controller: EditorController
    /// The style of the line the caret is on, ticked.
    let current: ListEditing.ParagraphStyle?
    let close: () -> Void

    static let width: CGFloat = 192
    /// Where every name starts: the tick sits to its left.
    static let inset: CGFloat = 40

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            formats
            rule
            row("Title", .title, font: .system(size: 20, weight: .heavy), height: 32) { controller.heading(1) }
            row("Heading", .heading, font: .system(size: 16.5, weight: .bold), height: 29) { controller.heading(2) }
            row("Subheading", .subheading, font: .system(size: 14, weight: .bold)) { controller.heading(3) }
            row("Body", .body, font: .system(size: 13)) { controller.heading(0) }
            row("Monostyled", nil, font: .system(size: 13, design: .monospaced), action: controller.code)
            row("• Bulleted List", .bulleted, title: "Bulleted List", action: controller.bulletList)
            row("– Dashed List", .dashed, title: "Dashed List", action: controller.dashedList)
            row("1. Numbered List", .numbered, title: "Numbered List", action: controller.numberedList)
            rule
            row("Block Quote", .quote, bar: true, action: controller.blockQuote)
        }
        .padding(.vertical, 6)
        .frame(width: Self.width)
        .accessibilityIdentifier("format.popover")
    }

    private var rule: some View {
        Divider().padding(.horizontal, 10).padding(.vertical, 5)
    }

    /// One choice: it applies to the caret's line (or the selected lines) and the popover closes.
    private func row(_ shown: String, _ style: ListEditing.ParagraphStyle?, title: String? = nil, font: Font = .system(size: 13), height: CGFloat = 27, bar: Bool = false,
                     action: @escaping () -> Void) -> some View {
        Button {
            action()
            close()
        } label: {
            HStack(spacing: 0) {
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .semibold))
                    .opacity(style != nil && style == current ? 1 : 0)
                    .frame(width: Self.inset - 10, alignment: .center)
                if bar {
                    RoundedRectangle(cornerRadius: 1).fill(.secondary).frame(width: 2.5, height: 15).padding(.trailing, 5)
                }
                Text(shown).font(font)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 5)
            .frame(height: height)
            .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
            .padding(.horizontal, 5)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title ?? shown)
        .accessibilityAddTraits(style != nil && style == current ? .isSelected : [])
    }

    /// Bold, italic, underline and strikethrough: plain glyphs on one line, no boxes. They act on
    /// the selection and the popover stays, so two can be set one after the other. The row leaves
    /// its right end free: a highlighter and a colour belong there, after a short rule, when
    /// coloured text exists.
    private var formats: some View {
        HStack(spacing: 0) {
            format("Bold", "bold", "⌘B", action: controller.bold)
            format("Italic", "italic", "⌘I", action: controller.italic)
            format("Underline", "underline", "⌘U", action: controller.underline)
            format("Strikethrough", "strikethrough", "⇧⌘X", action: controller.strikethrough)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.top, 1)
    }

    private func format(_ title: String, _ symbol: String, _ keys: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 16, weight: .medium))
                .frame(width: 30, height: 26)
                .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
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
