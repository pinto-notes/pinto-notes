import SwiftUI

/// Design study (2026-10-30): what makes Pinto different, visible at a glance, like Cursor's
/// agent panel beside VS Code's files. Your AIs in the sidebar with their own marks, a row to
/// connect another, Templates and Import, and the AI's mark on the notes it made. Nothing nags:
/// a green dot says an AI is ready, and that's all. Off unless a capture turns it on.
struct SidebarStudy: Equatable {
    /// The connected AIs, by name ("ChatGPT", "Claude").
    var ais: [String]
    /// A: the AIs above the folders. B: under them.
    var aisFirst = true
}

extension EnvironmentValues {
    @Entry var sidebarStudy: SidebarStudy?
}

enum SidebarAIWords {
    static let heading = "AI"
    static let ready = "Ready"
    static let connectAnother = "Connect another AI"
    static let templates = "Templates"
    static let importNotes = "Import notes"
    static func madeBy(_ ai: String) -> String { "Made by \(ai)" }
}

/// One AI: its mark, its name, and a green dot with "Ready".
struct SidebarAIRow: View {
    let ai: String

    var body: some View {
        Label {
            SidebarRowText(title: ai) {
                HStack(spacing: 5) {
                    Circle().fill(Color.green).frame(width: 6, height: 6)
                    Text(SidebarAIWords.ready)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color.muted)
                }
                .fixedSize()
            }
        } icon: {
            AITile(ai: ai, size: 18)
        }
        .sidebarRowLabel()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(ai), \(SidebarAIWords.ready)")
        .accessibilityIdentifier("sidebar.ai.\(ai)")
    }
}

/// A quiet row that does one thing: connect, browse templates, import.
struct SidebarActionRow: View {
    let title: String
    let symbol: String
    let id: String
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Label {
                Text(title).foregroundStyle(Color.muted)
            } icon: {
                SidebarIcon(name: symbol)
            }
            .sidebarRowLabel()
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(id)
    }
}
