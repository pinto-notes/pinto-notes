import SwiftData
import SwiftUI

/// The sidebar's Tags, under the folders: each tag in the library with how many notes have it,
/// by name. Picking one lists its notes (Scope.tag), as clicking a tag in a note does. Only there
/// while some note has a tag. A view of its own, so a change to the tags works out these rows
/// and not the folders.
struct SidebarTags: View {
    @Environment(\.modelContext) private var context
    @Environment(TagIndex.self) private var index: TagIndex?
    @Binding var selection: Scope?
    /// The folders' heading inset on the Mac, so both headings start on one line.
    var nested = false
    /// Folded away with its heading's arrow (Mac); kept on this device.
    @AppStorage("sidebarTagsExpanded") private var expanded = true

    var body: some View {
        let entries = index?.entries(in: context) ?? []
        if !entries.isEmpty {
            #if os(macOS)
            Section(isExpanded: $expanded) {
                rows(entries)
            } header: {
                Text("Tags")
                    .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarStyle.headingInset)
            }
            #else
            Section {
                rows(entries)
            } header: {
                Text("Tags")
            }
            .listRowBackground(Color(Palette.row))
            #endif
        }
    }

    private func rows(_ entries: [Tags.Entry]) -> some View {
        ForEach(entries, id: \.name) { tag in
            TagRow(tag: tag, selection: $selection)
        }
    }
}

private struct TagRow: View {
    let tag: Tags.Entry
    @Binding var selection: Scope?

    var body: some View {
        let selected: Bool = if case .tag(let name)? = selection { name.lowercased() == tag.name.lowercased() } else { false }
        Label {
            SidebarRowText(title: tag.name, selected: selected) {
                Text(tag.count, format: .number)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
        } icon: {
            SidebarIcon(name: "number", selected: selected)
        }
        .sidebarRowLabel()
        .rowAccessibility("Tag " + tag.name, count: tag.count)
        .hoverRow("tag." + tag.name, reach: Hover.sidebarReach(), selected: selected)
        .quietSelection()
        .tag(Scope.tag(tag.name))
        .accessibilityIdentifier("tag.\(tag.name)")
    }
}
