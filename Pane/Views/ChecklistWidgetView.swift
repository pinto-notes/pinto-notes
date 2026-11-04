import AppIntents
import SwiftUI
import WidgetKit

// The checklist widget's look (2026-11-04), shared by the widget extension (PaneWidgets) and the
// app, so the tests draw it offscreen (ChecklistWidgetShots) exactly as the Home Screen does.
// Apple Notes' widget can only open a note; this one ticks items where they are.

/// What the widget shows.
enum ChecklistWidgetContent: Equatable, Sendable {
    case list(ChecklistShelf.List)
    /// A note without a checklist: its title and first lines.
    case note(ChecklistShelf.Preview)
    /// A note picked for this widget that the app hasn't left yet: it does the next time it runs.
    case waiting(UUID, String)
    /// The app hasn't left any note yet (not opened since it was installed).
    case noLists
    /// The note picked for this widget is locked or deleted.
    case gone

    /// The widget's kind; the app redraws it by this (ModelContext.checklistWidgetKind).
    static let kind = "ChecklistWidget"

    /// The picked note: as a checklist when it has one, else its lines. With none picked, a
    /// pinned checklist or the newest, else the newest note.
    static func resolve(picked: UUID?, title: String? = nil, lists: [ChecklistShelf.List],
                        previews: [ChecklistShelf.Preview] = [], recents: [ChecklistShelf.Recent] = []) -> Self {
        if let picked {
            if let l = lists.first(where: { $0.id == picked }) { return .list(l) }
            if let n = previews.first(where: { $0.id == picked }) { return .note(n) }
            if let r = recents.first(where: { $0.id == picked }) { return .waiting(picked, r.title) }
            return .gone
        }
        if let l = ChecklistShelf.defaultList(in: lists) { return .list(l) }
        return previews.first.map(Self.note) ?? .noLists
    }

    /// The widget gallery's picture before there are lists.
    static let sample = ChecklistShelf.List(id: UUID(), title: "Groceries", items: [
        "Oat milk", "Lemons", "Coffee beans", "Fresh basil", "Burrata", "Cherry tomatoes", "Olive oil", "Dark chocolate",
    ].enumerated().map { ChecklistLine(text: $1, done: false, index: $0) }, updatedAt: .now)
}

/// Sizes, from the brief: small shows the title and 4 items, medium 7; 22 pt circles, 15 pt text.
enum ChecklistWidgetLayout {
    static let smallRows = 4
    static let mediumRows = 7
    static let circle: CGFloat = 22
    static let text: CGFloat = 15
    /// Each row is a tap target the full width of its column; four fill the small widget's height.
    static let row: CGFloat = 28

    /// The items shown, in the note's order: the first open ones, then ticked ones if there's room.
    /// A tick made here stays where it was (ChecklistShelf.tick) until the app sinks it.
    static func shown(_ list: ChecklistShelf.List, rows: Int) -> [ChecklistLine] {
        let open = list.items.filter { !$0.done }
        if open.count >= rows {
            // Up to the last open item that fits; ticked ones among them (a tick just made here)
            // keep their place.
            let last = open[rows - 1].index
            return Array(list.items.filter { $0.index <= last }.prefix(rows))
        }
        let ticked = list.items.filter(\.done).prefix(rows - open.count)
        return (open + ticked).sorted { $0.index < $1.index }
    }
}

/// The widget's ground: white, or pure black in dark mode, as the app's notes.
struct ChecklistWidgetGround: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View { scheme == .dark ? Color.black : Color.white }
}

struct ChecklistWidgetView: View {
    let content: ChecklistWidgetContent
    var medium = false

    var body: some View {
        switch content {
        case .list(let list):
            VStack(alignment: .leading, spacing: 4) {
                header(list)
                if medium {
                    let shown = ChecklistWidgetLayout.shown(list, rows: ChecklistWidgetLayout.mediumRows)
                    HStack(alignment: .top, spacing: 14) {
                        rows(list, Array(shown.prefix(4)))
                        rows(list, Array(shown.dropFirst(4)))
                    }
                } else {
                    rows(list, ChecklistWidgetLayout.shown(list, rows: ChecklistWidgetLayout.smallRows))
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            // A tap anywhere but an item (the title, the space under the rows) opens the note. A
            // small widget is one tap area, so a Link wouldn't work there.
            .widgetURL(QuickLink.note(list.id).url)
        case .note(let n):
            VStack(alignment: .leading, spacing: 4) {
                Text(n.title)
                    .font(.system(size: ChecklistWidgetLayout.text, weight: .semibold))
                    .foregroundStyle(.tint)
                    .lineLimit(1)
                    .widgetAccentable()
                    .frame(height: 20)
                    .accessibilityIdentifier("widget.title")
                ForEach(Array(n.lines.prefix(medium ? 6 : 5).enumerated()), id: \.offset) { _, line in
                    Text(line)
                        .font(.system(size: 13))
                        .foregroundStyle(.primary.opacity(0.8))
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetURL(QuickLink.note(n.id).url)
        case .waiting(let id, let title):
            message(title, QuickWords.noteWaiting)
                .widgetURL(QuickLink.note(id).url)
        case .noLists:
            message(QuickWords.noLists, QuickWords.noListsLine)
                .widgetURL(QuickLink.newNote.url)
        case .gone:
            // Opens the app on its list.
            message(QuickWords.listGone, QuickWords.listGoneLine)
        }
    }

    /// The note's title and how many items are left.
    private func header(_ list: ChecklistShelf.List) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(list.title)
                .font(.system(size: ChecklistWidgetLayout.text, weight: .semibold))
                .foregroundStyle(.tint)
                .lineLimit(1)
                .widgetAccentable()
            Spacer(minLength: 4)
            Group {
                if list.open == 0 {
                    Image(systemName: "checkmark")
                } else {
                    Text("\(list.open)").monospacedDigit()
                }
            }
            .font(.system(size: ChecklistWidgetLayout.text, weight: .semibold))
            .foregroundStyle(.secondary)
            .accessibilityLabel(QuickWords.left(list.open))
        }
        .frame(height: 20)
        .accessibilityIdentifier("widget.title")
    }

    private func rows(_ list: ChecklistShelf.List, _ items: [ChecklistLine]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(items, id: \.index) { item in
                Button(intent: WidgetTickIntent(note: list.id, item: item)) {
                    ChecklistWidgetRow(item: item)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("widget.item.\(item.index)")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func message(_ title: String, _ line: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: "note.text")
                .font(.system(size: 22, weight: .regular))
                .foregroundStyle(.tint)
                .widgetAccentable()
            Spacer(minLength: 0)
            Text(title).font(.system(size: ChecklistWidgetLayout.text, weight: .semibold))
            Text(line).font(.system(size: 13)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

/// One item: the circle as the editor draws it (an outline; ticked, the accent's disc with a
/// tick) and the text, struck through once ticked.
struct ChecklistWidgetRow: View {
    let item: ChecklistLine

    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                if item.done {
                    Circle().fill(.tint)
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                } else {
                    Circle().strokeBorder(Color.secondary.opacity(0.55), lineWidth: 1.5)
                }
            }
            .frame(width: ChecklistWidgetLayout.circle, height: ChecklistWidgetLayout.circle)
            .widgetAccentable()
            Text(item.text)
                .font(.system(size: ChecklistWidgetLayout.text))
                .strikethrough(item.done)
                .foregroundStyle(item.done ? .secondary : .primary)
                .lineLimit(1)
            Spacer(minLength: 0)
        }
        .frame(height: ChecklistWidgetLayout.row)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(item.done ? [.isButton, .isSelected] : .isButton)
    }
}

/// A tick in the widget opens Pinto Notes at the note and ticks the item there (Emil, 4 November
/// 2026), so the tick is in the note at once and syncs: to your Mac, and to the person you share
/// the list with. A widget can't send it by itself (iOS runs it with no time to sync), and a tick
/// that waited for the next visit left a partner's list stale. Apple Notes' widget only opens the
/// note. Not offered in Shortcuts (Tick Item is).
struct WidgetTickIntent: AppIntent {
    static let title: LocalizedStringResource = "Tick Item in Widget"
    static let isDiscoverable = false
    /// Runs in the app, which it opens, as New Note does.
    static let supportedModes: IntentModes = .foreground(.immediate)
    /// A widget's button runs its intent in the widget extension, where the mode above alone
    /// doesn't bring the app up (seen in the persona showcase recording, 2026-11-04).
    static let openAppWhenRun = true

    @Parameter(title: "Note") var note: String
    @Parameter(title: "Item") var index: Int
    @Parameter(title: "Text") var text: String
    @Parameter(title: "Ticked") var done: Bool

    init() {}

    /// Ticks the item, or unticks it when it's ticked.
    init(note: UUID, item: ChecklistLine) {
        self.note = note.uuidString
        index = item.index
        text = item.text
        done = !item.done
    }

    @MainActor func perform() async throws -> some IntentResult {
        guard let id = UUID(uuidString: note) else { return .result() }
        // Kept first, so a tick still lands if the note isn't ready yet (a shared note just after launch).
        ChecklistShelf.tick(note: id, index: index, text: text, done: done)
        #if !WIDGET_EXTENSION
        NoteOpener.shared.open(id)
        PaneApp.sharedContainer?.mainContext.applyCaptures()
        #endif
        return .result()
    }
}
