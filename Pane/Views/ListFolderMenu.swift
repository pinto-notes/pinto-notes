#if os(macOS)
import SwiftData
import SwiftUI

/// Two columns (ColumnsLayout.twoColumns): with no folders column, the list's title is a menu, "Notes ⌄",
/// that switches folders. What sat at the sidebar's foot is in it too: Templates, Connect an AI,
/// Import and your account.
struct ListFolderMenu: View {
    let scope: Scope
    let title: String
    let pick: (Scope) -> Void
    @Environment(\.modelContext) private var context
    @Query(filter: #Predicate<Folder> { $0.deletedAt == nil }, sort: \Folder.sortIndex) private var folders: [Folder]

    /// The menu's places, in the sidebar's order: All Notes, each folder a level in under its
    /// parent, then Recently Deleted.
    static func places(_ folders: [Folder], showsAll: Bool) -> [(scope: Scope, title: String, depth: Int)] {
        let roots = folders.filter { $0.parent == nil || $0.parent?.deletedAt != nil }
        let rows = SidebarView.editRows(roots)
        let byID = Dictionary(folders.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        var out: [(scope: Scope, title: String, depth: Int)] = showsAll ? [(.all, "All Notes", 0)] : []
        out += rows.compactMap { r in byID[r.id].map { (.folder(r.id), $0.name, r.depth) } }
        out.append((.trash, "Recently Deleted", 0))
        return out
    }

    var body: some View {
        let places = Self.places(folders, showsAll: SidebarView.showsAllNotes(folders: folders.count, context: context))
        Menu {
            Section {
                ForEach(Array(places.enumerated()), id: \.offset) { _, p in
                    Toggle(isOn: Binding(get: { p.scope == scope }, set: { _ in pick(p.scope) })) {
                        Text(String(repeating: "    ", count: p.depth) + p.title)
                    }
                }
            }
            Section {
                Button("New Folder", systemImage: "folder.badge.plus") {
                    NotificationCenter.default.post(name: .paneNewFolder, object: nil)
                }
            }
            Section {
                Button(SidebarAIWords.templates, systemImage: "square.grid.2x2") {
                    NotificationCenter.default.post(name: .paneTemplates, object: nil)
                }
                Button(SidebarAIWords.connect, systemImage: "sparkles") {
                    NotificationCenter.default.post(name: .paneConnectAI, object: nil)
                }
                Button(SidebarAIWords.importNotes, systemImage: "square.and.arrow.down") {
                    NotificationCenter.default.post(name: .paneImportNotes, object: nil)
                }
            }
            Section {
                Button("Account…", systemImage: "person.crop.circle") { AccountButton.open() }
            }
        } label: {
            // A Label, so the toolbar names the item and keeps its menu (as the list's More).
            Label(title, systemImage: "chevron.down").labelStyle(TitleThenChevron())
        }
        // The toolbar's own menu, as the list's More: styled as a plain button it lost its menu form.
        .menuIndicator(.hidden)
        .tint(.primary)
        .accessibilityLabel("Folder: \(title)")
        .accessibilityIdentifier("list.folderMenu")
    }
}

/// "Notes ⌄": the folder's name in the list's title type, the chevron small and quiet after it.
private struct TitleThenChevron: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 4) {
            configuration.title.font(.system(size: 14, weight: .bold)).foregroundStyle(Color.ink).lineLimit(1)
            configuration.icon.font(.system(size: 10, weight: .semibold)).foregroundStyle(Color.muted)
        }
    }
}

extension EnvironmentValues {
    /// Two columns: the list's title switches folders with this (ListFolderMenu). Nil: the sidebar does.
    @Entry var pickScope: ((Scope) -> Void)? = nil
}
#endif
