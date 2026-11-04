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

    /// "Just now" under a minute, then "2 minutes ago", "3 hours ago", "Yesterday", as Account
    /// says "Synced 5 minutes ago" (council round 8: "2 hr. ago").
    static func when(_ date: Date, now: Date = .now) -> String {
        if now.timeIntervalSince(date) < 60 { return "Just now" }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        f.dateTimeStyle = .named
        let s = f.localizedString(for: date, relativeTo: now)
        return s.prefix(1).uppercased() + s.dropFirst()
    }

    static func accessibility(_ c: AIChange, title: String, now: Date = .now) -> String {
        "\(line(c, title: title)), \(when(c.at, now: now))"
    }
    static let hint = "Opens AI Changes."
    static let noChanges = "No changes yet"

    /// "ChatGPT connected", "ChatGPT and Claude connected", "3 AIs connected"; nil for none.
    static func connected(_ names: [String]) -> String? {
        var seen = Set<String>()
        let unique = names.filter { seen.insert($0).inserted }
        switch unique.count {
        case 0: return nil
        case 1: return "\(unique[0]) connected"
        case 2: return "\(unique[0]) and \(unique[1]) connected"
        default: return "\(unique.count) AIs connected"
        }
    }

    /// In line with the folder rows above: the mark over their icons, the words over their names
    /// (council round 8: 7 and 9 pt to the left).
    static let leading: CGFloat = 17
    static let gap: CGFloat = 10
}

#if os(macOS)
/// The sidebar's foot on the Mac: the AI's mark and its last change, opening AI Changes; with
/// none yet, which AIs are connected; nothing with neither. Until now nothing in the notes window said an AI was
/// connected or what it last did (council rounds 6 and 7).
struct SidebarAILine: View {
    @Environment(\.modelContext) private var context
    @Environment(\.appearsActive) private var appearsActive
    @State private var last: AIChange?

    var body: some View {
        Group {
            if let last {
                let title = Self.title(last, context: context)
                row(ai: last.ai, line: SidebarAICopy.line(last, title: title), label: SidebarAICopy.accessibility(last, title: title)) {
                    TimelineView(.periodic(from: .now, by: 60)) { t in
                        Text(SidebarAICopy.when(last.at, now: t.date))
                    }
                }
            } else if let line = SidebarAICopy.connected(ConnectedAIs.shared.connections.map(\.name)) {
                // Connected, nothing changed yet: the window still says an AI is there (council round 9).
                row(ai: ConnectedAIs.shared.connections[0].name, line: line, label: line + ", " + SidebarAICopy.noChanges) {
                    Text(SidebarAICopy.noChanges)
                }
            }
        }
        // Fresh each time the window comes forward, the moment an AI edit lands (its receipt and
        // this line agree; council round 8: up to 3 minutes apart), and every few minutes.
        .task(id: Refresh(active: appearsActive, latest: AIEditStore.shared.entries.values.compactMap(\.editedAt).max())) {
            guard appearsActive else { return }
            while !Task.isCancelled {
                await load()
                // Soon again while there's nothing yet: the store is set up a moment after launch.
                try? await Task.sleep(for: .seconds(last == nil ? 5 : 180))
            }
        }
    }

    private func row<Under: View>(ai: String, line: String, label: String, @ViewBuilder under: () -> Under) -> some View {
        Button { AIChangesCenter.shared.show() } label: {
            HStack(alignment: .firstTextBaseline, spacing: SidebarAICopy.gap) {
                VersionAuthorMark(author: .ai(ai), size: 14)
                    .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 2 }
                VStack(alignment: .leading, spacing: 1) {
                    Text(line)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    under()
                        .font(.system(size: 11))
                        .foregroundStyle(Color.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(.leading, SidebarAICopy.leading)
            .padding(.trailing, 10)
            .padding(.vertical, 7)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .hoverRow("sidebar.ai", reach: Hover.noteRowReach)
        .help("Open AI Changes")
        .accessibilityLabel(label)
        .accessibilityHint(SidebarAICopy.hint)
        .accessibilityIdentifier("sidebar.aiLine")
        .padding(.horizontal, 10)
        .padding(.bottom, 8)
    }

    private struct Refresh: Equatable { var active: Bool; var latest: Date? }

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
