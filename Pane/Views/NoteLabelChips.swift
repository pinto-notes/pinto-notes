import SwiftUI

/// A note's labels as small coloured chips, each in its tag's colour (TagColors): in the note's
/// row in the list, and in the open note's bar. A tap on one in the bar opens the tag's list.
struct NoteLabelChips: View {
    let labels: [String]
    /// The row's chips are smaller than the bar's.
    var compact = false
    /// At most this many; then "+2".
    var limit = 3
    /// A tap on a chip (the bar): the tag's list.
    var open: ((String) -> Void)? = nil
    private var colors: TagColors { .shared }

    var body: some View {
        HStack(spacing: compact ? 4 : 6) {
            ForEach(labels.prefix(limit), id: \.self) { name in
                if let open {
                    Button { open(name) } label: { chip(name) }
                        .buttonStyle(LabelChipButtonStyle())
                        .help("Show the notes tagged \(name)")
                } else {
                    chip(name)
                }
            }
            if labels.count > limit {
                Text("+\(labels.count - limit)")
                    .font(font)
                    .foregroundStyle(Color.muted)
            }
        }
        .lineLimit(1)
        .accessibilityElement(children: open == nil ? .combine : .contain)
        .accessibilityLabel(open == nil ? "Tags: " + labels.joined(separator: ", ") : "")
        .accessibilityIdentifier("note.labels")
    }

    private var font: Font {
        #if os(macOS)
        .system(size: compact ? TextSize.interface(11) : 12, weight: .medium)
        #else
        // iPhone follows the reader's text size, as the row's other lines do.
        compact ? .caption.weight(.medium) : .footnote.weight(.medium)
        #endif
    }

    private func chip(_ name: String) -> some View {
        let c = colors.color(for: name)
        return Text(name)
            .font(font)
            .foregroundStyle(Color(c.ink))
            .padding(.horizontal, compact ? 6 : 8)
            .padding(.vertical, compact ? 1.5 : 3)
            .background(Color(c.fill), in: Capsule())
            .fixedSize()
            .accessibilityLabel("Tag " + name)
            .accessibilityIdentifier("label.\(name)")
    }
}

/// A chip that opens its tag: a touch darker under the pointer and when pressed, with the link
/// pointer, as every clickable has a hover.
private struct LabelChipButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        LabelChipButton(configuration: configuration)
    }
}

private struct LabelChipButton: View {
    let configuration: ButtonStyleConfiguration
    @State private var hovering = false

    var body: some View {
        configuration.label
            .brightness(configuration.isPressed ? -0.08 : hovering ? -0.04 : 0)
            .contentShape(Capsule())
            .modifier(HoverTracking(hovering: $hovering))
            #if os(macOS)
            .pointerStyle(.link)
            #endif
    }
}
