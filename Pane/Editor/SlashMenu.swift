import SwiftUI

#if os(macOS)
/// The `/` menu under the caret on the Mac: the commands the typed `/query` names, each with its
/// symbol and the Format menu's shortcut, dimmed, like a menu. Arrows move, Return or Tab runs
/// one, Escape puts it away; a click runs one too. The same panel as the `[[` titles.
struct SlashCommandList: View {
    let controller: EditorController
    static let rowHeight: CGFloat = 24
    static let width: CGFloat = 236

    /// The list's size for so many commands (the text view places it before SwiftUI lays it out).
    static func size(rows: Int) -> CGSize { CGSize(width: width, height: CGFloat(rows) * rowHeight + 8) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(controller.slashCommands.enumerated()), id: \.element) { i, command in
                Button { controller.runSlash(command) } label: {
                    HStack(spacing: 8) {
                        Image(systemName: command.symbol)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)
                            .frame(width: 18)
                        Text(command.name)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        Spacer(minLength: 8)
                        if let shortcut = command.shortcut {
                            Text(shortcut)
                                .font(.system(size: 12))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .padding(.horizontal, 8)
                    .frame(maxWidth: .infinity, minHeight: Self.rowHeight, maxHeight: Self.rowHeight, alignment: .leading)
                    .hoverHighlight(RoundedRectangle(cornerRadius: 5))
                    .background(i == controller.slashChoice ? Color.amberSoft : .clear, in: .rect(cornerRadius: 5))
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(command.name)
                .accessibilityAddTraits(i == controller.slashChoice ? .isSelected : [])
                .accessibilityIdentifier("slash.command.\(command.rawValue)")
            }
        }
        .padding(4)
        .frame(width: Self.width)
        .background(Color(PColor.panePanel), in: .rect(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(PColor.paneSeparator)))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Insert")
    }
}
#endif

#if os(iOS)
/// The same commands in the bar above the keyboard on iPhone, in the tools' place while a
/// `/query` is typed, as the `[[` titles are. Glyphs at the bar's 22 pt.
struct SlashCommandRow: View {
    let controller: EditorController

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 2) {
                ForEach(controller.slashCommands) { command in
                    Button { controller.runSlash(command) } label: {
                        HStack(spacing: 6) {
                            Image(systemName: command.symbol)
                                .font(.system(size: 22, weight: .regular))
                                .frame(width: 26)
                            Text(command.name)
                                .font(.system(size: 16, weight: .medium))
                                .lineLimit(1)
                        }
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 10)
                        .frame(height: 44)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(command.name)
                    .accessibilityIdentifier("slash.command.\(command.rawValue)")
                }
            }
            .padding(.horizontal, 4)
        }
        .accessibilityLabel("Insert")
    }
}
#endif
