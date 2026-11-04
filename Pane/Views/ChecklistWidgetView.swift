import AppIntents
import SwiftUI
import WidgetKit

// The checklist widget's look (2026-11-04), shared by the widget extension (PaneWidgets) and the
// app, so the tests draw it offscreen (ChecklistWidgetShots) exactly as the Home Screen does.
// Apple Notes' widget can only open a note; this one ticks items where they are.

/// What the widget shows.
enum ChecklistWidgetContent: Equatable, Sendable {
    case list(ChecklistShelf.List)
    /// The app hasn't left any checklist yet (not opened since it was installed, or no checklists).
    case noLists
    /// The note picked for this widget has no checklist now, or is locked or deleted.
    case gone

    /// The widget's kind; the app redraws it by this (ModelContext.checklistWidgetKind).
    static let kind = "ChecklistWidget"

    /// The picked note, or, with none picked, a pinned checklist or the newest.
    static func resolve(picked: UUID?, lists: [ChecklistShelf.List]) -> Self {
        if let picked { return lists.first { $0.id == picked }.map(Self.list) ?? .gone }
        return ChecklistShelf.defaultList(in: lists).map(Self.list) ?? .noLists
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
            Image(systemName: "checklist")
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

/// A tick in the widget: kept in the App Group for the app, which writes it into the note the
/// next time it's open, and shown in the widget at once. Not offered in Shortcuts (Tick Item is).
struct WidgetTickIntent: AppIntent {
    static let title: LocalizedStringResource = "Tick Item in Widget"
    static let isDiscoverable = false

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

    func perform() async throws -> some IntentResult {
        if let id = UUID(uuidString: note) { ChecklistShelf.tick(note: id, index: index, text: text, done: done) }
        return .result()
    }
}
