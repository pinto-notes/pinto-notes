import AppIntents
import SwiftUI
import WidgetKit

/// A checklist note, as the widget's settings offer them: the ones the app left (ChecklistShelf).
struct ChecklistListEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Checklist"
    static let defaultQuery = ChecklistListQuery()
    var id: UUID
    var title: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(title)") }

    init(_ list: ChecklistShelf.List) {
        id = list.id
        title = list.title
    }
}

struct ChecklistListQuery: EntityStringQuery {
    func entities(for identifiers: [UUID]) async throws -> [ChecklistListEntity] {
        ChecklistShelf.lists().filter { identifiers.contains($0.id) }.map(ChecklistListEntity.init)
    }

    func entities(matching string: String) async throws -> [ChecklistListEntity] {
        ChecklistShelf.lists().filter { $0.title.localizedCaseInsensitiveContains(string) }.prefix(50).map(ChecklistListEntity.init)
    }

    func suggestedEntities() async throws -> [ChecklistListEntity] {
        ChecklistShelf.lists().prefix(50).map(ChecklistListEntity.init)
    }

    func defaultResult() async -> ChecklistListEntity? {
        ChecklistShelf.defaultList(in: ChecklistShelf.lists()).map(ChecklistListEntity.init)
    }
}

/// The widget's one setting: which note.
struct ChecklistWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Checklist"
    static let description = IntentDescription("Tick items in a checklist note without opening Pinto Notes.")

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
        let content = ChecklistWidgetContent.resolve(picked: configuration.list?.id, lists: ChecklistShelf.lists())
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
        .configurationDisplayName("Checklist")
        .description("Tick items in a checklist note. Touch and hold the widget to pick the note.")
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
