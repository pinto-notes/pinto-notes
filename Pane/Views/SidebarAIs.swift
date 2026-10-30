import SwiftUI

/// Design study (2026-10-30): what makes Pinto different, visible at a glance. Templates and
/// Import in the sidebar, and the AI's mark on the notes it made. (A section of your AIs in the
/// sidebar was tried and dropped: Emil, 2026-10-30, "I don't like the AIs in sidebar at all".)
/// Off unless a capture turns it on.
struct SidebarStudy: Equatable {}

extension EnvironmentValues {
    @Entry var sidebarStudy: SidebarStudy?
}

enum SidebarAIWords {
    static let templates = "Templates"
    static let importNotes = "Import notes"
    static func madeBy(_ ai: String) -> String { "Made by \(ai)" }
}

/// A quiet row that does one thing: browse templates, import.
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
            // A folder row's height, so the two read as rows, not a caption.
            .frame(maxWidth: .infinity, minHeight: 28, alignment: .leading)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(id)
    }
}
