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
    private var colors: TagColors { .shared }

    var body: some View {
        let selected: Bool = if case .tag(let name)? = selection { name.lowercased() == tag.name.lowercased() } else { false }
        Label {
            SidebarRowText(title: tag.name, selected: selected) {
                Text(tag.count, format: .number)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
        } icon: {
            // The tag's colour, as Finder shows its tags.
            Image(systemName: "circle.fill")
                .font(.system(size: 9))
                .foregroundStyle(Color(tagColor: colors.color(for: tag.name)))
                .frame(width: SidebarStyle.tagDotWidth)
                .accessibilityHidden(true)
        }
        .sidebarRowLabel()
        .rowAccessibility("Tag " + tag.name, count: tag.count)
        .hoverRow("tag." + tag.name, reach: Hover.sidebarReach(), selected: selected)
        .quietSelection()
        .tag(Scope.tag(tag.name))
        .contextMenu { TagColorMenu(tag: tag.name) }
        .accessibilityIdentifier("tag.\(tag.name)")
    }
}

/// A tag's colours to choose from, as Finder offers them: each with its dot, the one it has ticked.
struct TagColorMenu: View {
    let tag: String
    private var colors: TagColors { .shared }

    var body: some View {
        // An inline picker: the menu ticks the colour the tag has.
        Picker("Colour", selection: Binding(get: { colors.color(for: tag) }, set: { colors.set($0, for: tag) })) {
            ForEach(TagColor.allCases) { c in
                Label {
                    Text(c.title)
                } icon: {
                    Image(nsOrUIImage: TagColorMenu.dot(c))
                }
                .tag(c)
                .accessibilityIdentifier("tag.color.\(c.rawValue)")
            }
        }
        .pickerStyle(.inline)
    }

    /// A coloured dot as a plain picture: menus draw SF Symbols in one colour, so a symbol would
    /// lose the tag's.
    static func dot(_ c: TagColor) -> PImage {
        let size = CGSize(width: 12, height: 12)
        #if os(macOS)
        let image = NSImage(size: size, flipped: false) { rect in
            c.dot.setFill()
            NSBezierPath(ovalIn: rect.insetBy(dx: 1, dy: 1)).fill()
            return true
        }
        image.isTemplate = false
        return image
        #else
        return UIGraphicsImageRenderer(size: size).image { _ in
            c.dot.setFill()
            UIBezierPath(ovalIn: CGRect(origin: .zero, size: size).insetBy(dx: 1, dy: 1)).fill()
        }.withRenderingMode(.alwaysOriginal)
        #endif
    }
}

extension Image {
    init(nsOrUIImage image: PImage) {
        #if os(macOS)
        self.init(nsImage: image)
        #else
        self.init(uiImage: image)
        #endif
    }
}
