import SwiftUI

#if !os(macOS)
/// iPhone has no setup cards, but shares their AIs and marks (AI Connections, Add an AI).
enum SetupCards {}
#endif

// The AIs and their marks, shared by the Mac's setup card and both platforms' AI Connections page.
extension SetupCards {
    enum AI: String, CaseIterable, Identifiable {
        case chatgpt, claude, grok, codex, other
        var id: String { rawValue }

        /// The name in sentences ("Finish in ChatGPT.") and on its tile.
        var name: String {
            switch self {
            case .chatgpt: "ChatGPT"
            case .claude: "Claude"
            case .grok: "Grok"
            case .codex: "Codex"
            case .other: "your AI"
            }
        }

        var tile: String { self == .other ? "Another AI" : name }
        /// At the start of a sentence.
        var Name: String { self == .other ? "Your AI" : name }
        /// The mark `AITile` draws.
        var mark: String { self == .other ? "Another AI" : name }

        var button: String { self == .other ? "Connect another AI" : "Connect \(name)" }

        /// What App Review asks every screen before an AI to say: what it can do, and that you decide.
        var reads: String { "\(Name) can read and edit your notes when you ask. Disconnect anytime." }

        var guide: ConnectAISection.Guide {
            switch self {
            case .chatgpt: .chatgpt
            case .claude: .claude
            case .grok: .grok
            case .codex: .codex
            case .other: .other
            }
        }

        /// ChatGPT and Claude open from a link with the ask in them (`TryIt.page`). Codex and
        /// another AI get the gallery too, and the ask to copy.
        var asks: Bool { self == .chatgpt || self == .claude }

        /// The old card's three tiles: Codex came with the brand buttons' row (2 November 2026).
        static let tiles: [AI] = [.chatgpt, .claude, .other]
    }

    /// The brand buttons, top to bottom (Emil, 2 November 2026).
    static let brands: [AI] = [.chatgpt, .claude, .grok]
    /// The connect card's tiles: the brands, then Other (any other app, by its address).
    static let connectTiles: [AI] = brands + [.other]
    /// The brands' own grounds: ChatGPT black, Claude's orange.
    /// ChatGPT black, Claude's orange, Grok white (its mark is black on white).
    static func brandFill(_ ai: AI) -> Color {
        switch ai {
        case .claude: AIGlyph.color("Claude")
        case .grok: Color(white: 0.98)
        default: Color(white: 0.04)
        }
    }
    static func brandInk(_ ai: AI) -> Color { ai == .grok ? Color(white: 0.04) : .white }
}

/// An AI's mark on its brand's own ground, like an app icon: ChatGPT black, Claude orange, Grok white.
struct BrandMark: View {
    let ai: SetupCards.AI
    var size: CGFloat = 30

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.24, style: .continuous)
        if ai == .other {
            Image(systemName: "plus")
                .font(.system(size: size * 0.45, weight: .semibold))
                .foregroundStyle(Color.muted)
                .frame(width: size, height: size)
                .overlay(shape.strokeBorder(Color.muted.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [3, 2.5])))
                .accessibilityHidden(true)
        } else {
            mark(shape)
        }
    }

    private func mark(_ shape: RoundedRectangle) -> some View {
        AIGlyph(ai: ai.mark, size: size * 0.6, monochrome: true)
            .foregroundStyle(SetupCards.brandInk(ai))
            .frame(width: size, height: size)
            .background(SetupCards.brandFill(ai), in: shape)
            .overlay(shape.strokeBorder(Color.black.opacity(ai == .grok ? 0.14 : 0), lineWidth: 1))
            .accessibilityHidden(true)
    }
}

