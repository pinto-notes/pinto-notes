import AppIntents
import SwiftUI
import WidgetKit

/// A note, as the widget's settings offer them: every note the app left (ChecklistShelf's recent
/// notes), checklists first in the suggestions.
struct ChecklistListEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Note"
    static let defaultQuery = ChecklistListQuery()
    var id: UUID
    var title: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(title)") }

    init(_ list: ChecklistShelf.List) {
        id = list.id
        title = list.title
    }

    init(_ note: ChecklistShelf.Recent) {
        id = note.id
        title = note.title.isEmpty ? "New Note" : note.title
    }
}

struct ChecklistListQuery: EntityStringQuery {
    func entities(for identifiers: [UUID]) async throws -> [ChecklistListEntity] {
        ChecklistShelf.recents().filter { identifiers.contains($0.id) }.map(ChecklistListEntity.init)
    }

    func entities(matching string: String) async throws -> [ChecklistListEntity] {
        ChecklistShelf.search(string, in: ChecklistShelf.recents()).prefix(50).map(ChecklistListEntity.init)
    }

    /// Checklists first (the widget ticks them), then the newest notes.
    func suggestedEntities() async throws -> [ChecklistListEntity] {
        let lists = ChecklistShelf.lists().prefix(20)
        let ids = Set(lists.map(\.id))
        let rest = ChecklistShelf.recents().filter { !ids.contains($0.id) }.prefix(40)
        return lists.map(ChecklistListEntity.init) + rest.map(ChecklistListEntity.init)
    }

    func defaultResult() async -> ChecklistListEntity? {
        if let l = ChecklistShelf.defaultList(in: ChecklistShelf.lists()) { return ChecklistListEntity(l) }
        return ChecklistShelf.recents().first.map(ChecklistListEntity.init)
    }
}

/// The widget's one setting: which note.
struct ChecklistWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Note"
    static let description = IntentDescription("A note on your Home Screen. Tap a checklist item to tick it.")

    @Parameter(title: "Note") var list: ChecklistListEntity?
}

struct ChecklistEntry: TimelineEntry {
    let date: Date
    let content: ChecklistWidgetContent
}

/// One entry, as the lists are now. The app redraws the widget when they change (and WidgetKit
/// does after a tick), so nothing is scheduled.
struct ChecklistProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> ChecklistEntry {
        ChecklistEntry(date: .now, content: .list(ChecklistWidgetContent.sample))
    }

    func snapshot(for configuration: ChecklistWidgetIntent, in context: Context) async -> ChecklistEntry {
        let content = ChecklistWidgetContent.resolve(picked: configuration.list?.id, lists: ChecklistShelf.lists(),
                                                     previews: ChecklistShelf.previews(), recents: ChecklistShelf.recents())
        // A note the app hasn't left yet: asked for, so it does the next time it runs.
        if case .waiting(let id, _) = content { ChecklistShelf.want(id) }
        // The widget gallery, before the app has left any list: the sample.
        if context.isPreview, content == .noLists { return placeholder(in: context) }
        return ChecklistEntry(date: .now, content: content)
    }

    func timeline(for configuration: ChecklistWidgetIntent, in context: Context) async -> Timeline<ChecklistEntry> {
        Timeline(entries: [await snapshot(for: configuration, in: context)], policy: .never)
    }
}

struct ChecklistWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: ChecklistWidgetContent.kind, intent: ChecklistWidgetIntent.self, provider: ChecklistProvider()) { entry in
            ChecklistFamilyView(content: entry.content)
                .containerBackground(for: .widget) { ChecklistWidgetGround() }
        }
        .configurationDisplayName("Note")
        .description("A note on your Home Screen: tick a checklist right there, or tap to open it. Touch and hold the widget to pick the note.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// The shared view, told which size it is.
private struct ChecklistFamilyView: View {
    let content: ChecklistWidgetContent
    @Environment(\.widgetFamily) private var family

    var body: some View {
        ChecklistWidgetView(content: content, medium: family == .systemMedium)
    }
}
