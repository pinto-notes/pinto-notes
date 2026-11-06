import SwiftUI

#if os(macOS)
/// The `/` menu under the caret on the Mac: the commands the typed `/query` names, each with its
/// symbol and the Format menu's shortcut, dimmed, like a menu. Arrows move, Return or Tab runs
/// one, Escape puts it away; a click runs one too. The same panel as the `[[` titles.
struct SlashCommandList: View {
    let controller: EditorController
    /// Grows with the note's text, to half as big again (round 21: 13 pt beside 24 pt text).
    static var scale: CGFloat { min(EditorMetrics.scale, 1.5) }
    static var rowHeight: CGFloat { (24 * scale).rounded() }
    static var width: CGFloat { (236 * scale).rounded() }
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

    /// What VoiceOver says for the chosen command.
    static func spoken(_ name: String, at index: Int, of count: Int) -> String { "\(name), \(index + 1) of \(count)" }
    /// "Shift Command H" for ⇧⌘H: VoiceOver doesn't read the symbols (round 22).
    static func spokenShortcut(_ keys: String) -> String {
        let names: [Character: String] = ["\u{2303}": "Control", "\u{2325}": "Option", "\u{21E7}": "Shift", "\u{2318}": "Command"]
        return keys.map { names[$0] ?? String($0) }.joined(separator: " ")
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
                // The keyboard stays in the text while the arrows move the choice, so VoiceOver has
                // to be told what's chosen (council round 16: the menu was silent).
                .onChange(of: controller.slashChoice, initial: true) { _, i in
                    guard controller.slashCommands.indices.contains(i) else { return }
                    AccessibilityNotification.Announcement(Self.spoken(controller.slashName(controller.slashCommands[i]), at: i, of: controller.slashCommands.count)).post()
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
                            .font(.system(size: 12 * Self.scale, weight: .medium))
                            .foregroundStyle(.secondary)
                            .frame(width: 18 * Self.scale)
                        Text(controller.slashName(command))
                            .font(.system(size: 13 * Self.scale))
                            .foregroundStyle(Color.ink)
                            .lineLimit(1)
                        Spacer(minLength: 8)
                        if let shortcut = command.shortcut {
                            Text(shortcut)
                                .font(.system(size: 12 * Self.scale))
                                // Readable on the chosen row's tint too (round 20: 1.67:1).
                                .foregroundStyle(i == controller.slashChoice ? Color.ink : Color.muted)
                        }
                    }
                    .padding(.horizontal, 8)
                    .frame(maxWidth: .infinity, minHeight: Self.rowHeight, maxHeight: Self.rowHeight, alignment: .leading)
                    .hoverHighlight(RoundedRectangle(cornerRadius: 5))
                    .background(i == controller.slashChoice ? Color.amberSoft : .clear, in: .rect(cornerRadius: 5))
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(Self.spoken(command.shortcut.map { "\(controller.slashName(command)), \(Self.spokenShortcut($0))" } ?? controller.slashName(command), at: i, of: controller.slashCommands.count))
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
