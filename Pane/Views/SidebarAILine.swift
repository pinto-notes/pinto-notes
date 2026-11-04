import SwiftData
import SwiftUI

/// What the sidebar's foot says about the AIs: the last thing one did, and when. The words,
/// apart from the view, so tests can read them.
enum SidebarAICopy {
    /// "ChatGPT edited Lisbon".
    static func line(_ c: AIChange, title: String) -> String {
        "\(c.ai) \(verb(c.kind)) \(title)"
    }

    static func verb(_ kind: AIChange.Kind) -> String {
        switch kind {
        case .edit: "edited"
        case .created: "made"
        case .moved: "moved"
        case .deleted: "deleted"
        case .restore, .restored: "restored"
        }
    }

    /// "Just now" under a minute, then "2 min ago", "3 hr ago", "Yesterday" and so on.
    static func when(_ date: Date, now: Date = .now) -> String {
        if now.timeIntervalSince(date) < 60 { return "Just now" }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        f.dateTimeStyle = .named
        let s = f.localizedString(for: date, relativeTo: now)
        return s.prefix(1).uppercased() + s.dropFirst()
    }

    static func accessibility(_ c: AIChange, title: String, now: Date = .now) -> String {
        "\(line(c, title: title)), \(when(c.at, now: now)). Opens AI Changes."
    }
}

#if os(macOS)
/// The sidebar's foot on the Mac: the AI's mark and its last change, opening AI Changes. Nothing
/// when no AI has changed anything. Until now nothing in the notes window said an AI was
/// connected or what it last did (council rounds 6 and 7).
struct SidebarAILine: View {
    @Environment(\.modelContext) private var context
    @Environment(\.appearsActive) private var appearsActive
    @State private var last: AIChange?

    var body: some View {
        Group {
            if let last {
                let title = Self.title(last, context: context)
                Button { AIChangesCenter.shared.show() } label: {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        VersionAuthorMark(author: .ai(last.ai), size: 14)
                            .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 2 }
                        VStack(alignment: .leading, spacing: 1) {
                            Text(SidebarAICopy.line(last, title: title))
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color.ink)
                                .lineLimit(1)
                                .truncationMode(.tail)
                            TimelineView(.periodic(from: .now, by: 60)) { t in
                                Text(SidebarAICopy.when(last.at, now: t.date))
                                    .font(.system(size: 11))
                                    .foregroundStyle(Color.muted)
                            }
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .hoverRow("sidebar.ai", reach: Hover.noteRowReach)
                .help("Open AI Changes")
                .accessibilityLabel(SidebarAICopy.accessibility(last, title: title))
                .accessibilityIdentifier("sidebar.aiLine")
                .padding(.horizontal, 10)
                .padding(.bottom, 8)
            }
        }
        // Fresh each time the window comes forward, and every few minutes while it's in front.
        .task(id: appearsActive) {
            guard appearsActive else { return }
            while !Task.isCancelled {
                await load()
                // Soon again while there's nothing yet: the store is set up a moment after launch.
                try? await Task.sleep(for: .seconds(last == nil ? 5 : 180))
            }
        }
    }

    private func load() async {
        guard let store = AIChangesCenter.shared.store,
              let newest = try? await store.changes(before: nil, limit: 1, ai: nil).first else { return }
        if newest != last { last = newest }
    }

    static func title(_ c: AIChange, context: ModelContext) -> String {
        context.note(c.noteID).map { $0.isLocked ? "a locked note" : ($0.title.isEmpty ? "a note" : $0.title) } ?? "a note"
    }
}
#endif
