import SwiftUI

#if os(macOS)
/// The `/` menu under the caret on the Mac: the commands the typed `/query` names, each with its
/// symbol and the Format menu's shortcut, dimmed, like a menu. Arrows move, Return or Tab runs
/// one, Escape puts it away; a click runs one too. The same panel as the `[[` titles.
struct SlashCommandList: View {
    let controller: EditorController
    static let rowHeight: CGFloat = 24
    static let width: CGFloat = 236
    /// Nine and a half rows show; more scroll, with the choice kept in view (18 commands made a
    /// list taller than a small window's note). The half row says there's more (council round 13:
    /// ten whole rows looked like the whole menu).
    static let maxRows = 9.5
    /// The line under the recent ones.
    static let recentLine: CGFloat = 9
    static let fade: CGFloat = 12

    /// The list's size for so many commands (the text view places it before SwiftUI lays it out).
    static func size(rows: Int, recent: Int = 0) -> CGSize {
        let line = recent > 0 && recent < rows ? recentLine : 0
        let full = CGFloat(rows) * rowHeight + line
        // The line under the recents comes on top of the cap, so half a row still peeks out.
        return CGSize(width: width, height: min(full, CGFloat(maxRows) * rowHeight + line) + 8)
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical) { rows }
                // The half row past the fold fades out rather than being cut through its letters.
                .mask {
                    VStack(spacing: 0) {
                        Color.black
                        // Not once the end is in view, where the last row is the one you're on.
                        if Double(controller.slashCommands.count) > Self.maxRows, controller.slashChoice < controller.slashCommands.count - 2 {
                            LinearGradient(colors: [.black, .black.opacity(0.15)], startPoint: .top, endPoint: .bottom)
                                .frame(height: Self.fade)
                        }
                    }
                }
                .scrollIndicators(Double(controller.slashCommands.count) > Self.maxRows ? .automatic : .never)
                .scrollBounceBehavior(.basedOnSize)
                .onChange(of: controller.slashChoice) { _, i in
                    guard controller.slashCommands.indices.contains(i) else { return }
                    proxy.scrollTo(controller.slashCommands[i])
                }
        }
        .padding(4)
        .frame(width: Self.width)
        .background(Color(PColor.panePanel), in: .rect(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color(PColor.paneSeparator)))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(EditorController.slashMenuName)
    }

    private var rows: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(controller.slashCommands.enumerated()), id: \.element) { i, command in
                Button { controller.runSlash(command) } label: {
                    HStack(spacing: 8) {
                        Image(systemName: controller.slashSymbol(command))
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)
                            .frame(width: 18)
                        Text(controller.slashName(command))
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
                .accessibilityLabel(controller.slashName(command))
                .accessibilityAddTraits(i == controller.slashChoice ? .isSelected : [])
                .accessibilityIdentifier("slash.command.\(command.rawValue)")
                .id(command)
                if i == controller.slashRecentCount - 1, i < controller.slashCommands.count - 1 {
                    // Used last, above; the menu's own order, below.
                    Rectangle().fill(Color(PColor.paneSeparator)).frame(height: 1)
                        .padding(.vertical, (Self.recentLine - 1) / 2).padding(.horizontal, 8)
                        .accessibilityHidden(true)
                }
            }
        }
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
                            Image(systemName: controller.slashSymbol(command))
                                .font(.system(size: 22, weight: .regular))
                                .frame(width: 26)
                            Text(controller.slashName(command))
                                .font(.system(size: 16, weight: .medium))
                                .lineLimit(1)
                        }
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 10)
                        .frame(height: 44)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(controller.slashName(command))
                    .accessibilityIdentifier("slash.command.\(command.rawValue)")
                }
            }
            .padding(.horizontal, 4)
        }
        .accessibilityLabel(EditorController.slashMenuName)
    }
}
#endif
