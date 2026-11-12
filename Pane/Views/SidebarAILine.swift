import SwiftData
import SwiftUI

/// What the sidebar's foot says about the AIs: the last thing one did, and when. The words,
/// apart from the view, so tests can read them.
enum SidebarAICopy {
    /// "ChatGPT edited Lisbon".
    static func line(_ c: AIChange, title: String) -> String {
        "\(shown(c.ai)) \(verb(c.kind)) \(title)"
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
    /// The AI's own name for one known only by its site: Grok signs in as "grok.com" (Emil,
    /// 8 November 2026: the foot said "grok.com connected", with no mark).
    static func shown(_ name: String) -> String { ConnectTrust.knownHosts[name.lowercased()] ?? name }
    static let noChanges = "No changes yet"
    /// Under "ChatGPT connected" once the last change has aged off the foot: there are changes,
    /// just none this week (council round 11: it said "No changes yet").
    static let pastChanges = "See past changes"

    /// What goes under "X connected": "No changes yet" only when there are none.
    static func underConnected(hasChanges: Bool) -> String { hasChanges ? pastChanges : noChanges }

    /// The last change stays at the foot for a week, and only while its AI is still connected;
    /// then the foot says which AIs are connected, or nothing (council round 10: it showed the
    /// newest change forever). `connected` is nil until the list is known: then the change shows,
    /// so the foot doesn't blink empty at launch. A known empty list hides it (council round 11:
    /// disconnecting your only AI left its change up for the week).
    static func showsChange(_ c: AIChange, connected: [String]?, now: Date = .now) -> Bool {
        guard now.timeIntervalSince(c.at) < 7 * 86_400 else { return false }
        guard let connected else { return true }
        return connected.contains(c.ai)
    }

    /// "ChatGPT connected", "ChatGPT and Claude connected", "3 AIs connected"; nil for none.
    static func connected(_ names: [String]) -> String? {
        var seen = Set<String>()
        let unique = names.map(shown).filter { seen.insert($0).inserted }
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

/// The notes open in an editor right now, in any window (a note can be open twice).
@MainActor @Observable final class OpenNoteIDs {
    static let shared = OpenNoteIDs()
    private(set) var counts: [UUID: Int] = [:]
    func opened(_ id: UUID) { counts[id, default: 0] += 1 }
    func closed(_ id: UUID) {
        guard let n = counts[id] else { return }
        counts[id] = n > 1 ? n - 1 : nil
    }
    func contains(_ id: UUID) -> Bool { counts[id] != nil }
}

extension SidebarAICopy {
    /// Not while its note is open: the note itself shows the change (Emil, 12 November 2026:
    /// "if I have the note open I don't see why I need to see this").
    @MainActor static func showsChange(_ c: AIChange, connected: [String]?, open: OpenNoteIDs, now: Date = .now) -> Bool {
        !open.contains(c.noteID) && showsChange(c, connected: connected, now: now)
    }
}

#if os(macOS)
/// The first row of the sidebar's foot on the Mac, for a week after an AI changed something: its
/// mark, what it did and when, opening AI Changes. Nothing otherwise (council rounds 6 and 7 asked
/// for the window to say what an AI last did; Emil, 8 November 2026, cut "X connected").
struct SidebarAILine: View {
    @Environment(\.modelContext) private var context
    @Environment(\.appearsActive) private var appearsActive
    @State private var last: AIChange?

    var body: some View {
        // A stack, not a Group: with no row it is still there, so the task below still runs.
        VStack(spacing: 0) {
            if let last, SidebarAICopy.showsChange(last, connected: ConnectedAIs.shared.knownNames, open: OpenNoteIDs.shared) {
                let title = Self.title(last, context: context)
                row(ai: last.ai, line: SidebarAICopy.line(last, title: title), label: SidebarAICopy.accessibility(last, title: title)) {
                    TimelineView(.periodic(from: .now, by: 60)) { t in
                        Text(SidebarAICopy.when(last.at, now: t.date))
                    }
                }
            }
            // Nothing for an AI that's only connected: "Grok connected" read as a notification and
            // said less than Connect an AI under it (Emil, 8 November 2026). Only what one did.
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

    /// Laid out as the rows under it (Templates, Connect an AI, Import notes): the AI's mark in
    /// their icons' column, its words on their names' line at their size, the same pill under the
    /// pointer; a second line only for a change.
    private func row<Under: View>(ai: String, line: String, label: String, @ViewBuilder under: () -> Under) -> some View {
        Button { AIChangesCenter.shared.show() } label: {
            SidebarFootLabel {
                VStack(alignment: .leading, spacing: 1) {
                    Text(line)
                        .foregroundStyle(Color.ink)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    under()
                        .font(.system(size: 11))
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                }
            } icon: {
                VersionAuthorMark(author: .ai(SidebarAICopy.shown(ai)), size: 15)
            }
            .frame(minHeight: SidebarFoot.rowContentHeight, alignment: .leading)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect)
            .sidebarFootPill("sidebar.ai")
        }
        .buttonStyle(.plain)
        .help("Open AI Changes")
        .accessibilityLabel(label)
        .accessibilityHint(SidebarAICopy.hint)
        .accessibilityIdentifier("sidebar.aiLine")
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
