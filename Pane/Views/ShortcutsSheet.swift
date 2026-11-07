#if os(macOS)
import AppKit
import SwiftUI

/// Help › Keyboard Shortcuts (Emil, 3 November 2026). Read from the menu bar when it opens, so
/// the list is never kept by hand: a command with a shortcut shows here because it has one there.
enum Shortcuts {
    static let title = "Keyboard Shortcuts"

    struct Entry: Hashable {
        let title: String
        let keys: String
    }

    struct Group: Hashable {
        let menu: String
        let entries: [Entry]
    }

    /// Every menu in `bar` that has a command with a shortcut, in the bar's order, and its
    /// commands in the menu's order (submenus' too). Hidden items and alternates are left out.
    @MainActor static func groups(in bar: NSMenu?) -> [Group] {
        guard let bar else { return [] }
        return bar.items.compactMap { top in
            guard let menu = top.submenu, !top.isHidden else { return nil }
            var seen = Set<String>()
            let entries = entries(in: menu).filter { seen.insert($0.title + $0.keys).inserted }
            guard !entries.isEmpty else { return nil }
            // The app's own menu goes by the app's name in the bar; here it says what it is.
            let name = top == bar.items.first ? "Pinto Notes" : (menu.title.isEmpty ? top.title : menu.title)
            return Group(menu: name, entries: entries)
        }
    }

    @MainActor private static func entries(in menu: NSMenu) -> [Entry] {
        menu.items.flatMap { item -> [Entry] in
            if item.isHidden || item.isAlternate || item.isSeparatorItem { return [] }
            if let sub = item.submenu { return entries(in: sub) }
            guard !item.keyEquivalent.isEmpty, !item.title.isEmpty else { return [] }
            return [Entry(title: item.title, keys: keys(item.keyEquivalent, item.keyEquivalentModifierMask))]
        }
    }

    /// A shortcut as the menus draw it: ⌃⌥⇧⌘ then the key (⇧ when the key is a capital letter).
    static func keys(_ key: String, _ mask: NSEvent.ModifierFlags) -> String {
        var mods = mask
        if key.count == 1, let c = key.first, c.isLetter, c.isUppercase { mods.insert(.shift) }
        var s = ""
        if mods.contains(.control) { s += "⌃" }
        if mods.contains(.option) { s += "⌥" }
        if mods.contains(.shift) { s += "⇧" }
        if mods.contains(.command) { s += "⌘" }
        return s + name(of: key)
    }

    private static func name(of key: String) -> String {
        guard let scalar = key.unicodeScalars.first else { return key }
        switch Int(scalar.value) {
        case NSUpArrowFunctionKey: return "↑"
        case NSDownArrowFunctionKey: return "↓"
        case NSLeftArrowFunctionKey: return "←"
        case NSRightArrowFunctionKey: return "→"
        case NSDeleteFunctionKey: return "⌦"
        case NSHomeFunctionKey: return "↖"
        case NSEndFunctionKey: return "↘"
        case NSPageUpFunctionKey: return "⇞"
        case NSPageDownFunctionKey: return "⇟"
        case 0x0D, 0x03: return "↩"
        case 0x09: return "⇥"
        case 0x1B: return "⎋"
        case 0x08, 0x7F: return "⌫"
        case 0x20: return "Space"
        default:
            if (NSF1FunctionKey...NSF35FunctionKey).contains(Int(scalar.value)) {
                return "F\(Int(scalar.value) - NSF1FunctionKey + 1)"
            }
            return key.uppercased()
        }
    }
}

/// The list, as a sheet over the notes.
struct ShortcutsSheet: View {
    let groups: [Shortcuts.Group]
    let close: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(Shortcuts.title).font(.title3.weight(.semibold))
                Spacer()
                Button("Done", action: close)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("shortcuts.done")
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)
            .padding(.bottom, 12)
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ForEach(groups, id: \.self) { group in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(group.menu)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Color.muted)
                            ForEach(group.entries, id: \.self) { entry in
                                HStack {
                                    Text(entry.title).foregroundStyle(Color.ink)
                                    Spacer(minLength: 16)
                                    Text(entry.keys)
                                        .font(.body.monospaced())
                                        .foregroundStyle(Color.muted)
                                }
                                .accessibilityElement(children: .combine)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .frame(width: 460, height: 560)
        .onExitCommand(perform: close)
        .accessibilityIdentifier("shortcuts.sheet")
    }
}

/// Settings › Keyboard shortcuts (Emil, 7 November 2026: "where can I see what shortcuts
/// exist?"): the quick note shortcut, which works in any app and is set here, then every menu's
/// shortcuts, read from the menu bar as the sheet does, with a field to find one.
struct KeyboardShortcutsSettingsPage: View {
    /// The menus to read; tests give their own.
    var bar: () -> NSMenu? = { NSApp.mainMenu }
    @State private var query = ""
    @State private var groups: [Shortcuts.Group] = []

    static let footer = "To change a menu\u{2019}s shortcut, use System Settings \u{203A} Keyboard \u{203A} Keyboard Shortcuts \u{203A} App Shortcuts."

    var body: some View {
        SettingsPageForm {
            Section {
                LabeledContent {
                    ShortcutRecorder()
                } label: {
                    Text(GeneralCopy.shortcut)
                    Text(GeneralCopy.shortcutDetail)
                }
            }
            Section {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color.muted).accessibilityHidden(true)
                    TextField("Find a shortcut", text: $query, prompt: Text("Find a shortcut").foregroundStyle(Color.muted))
                        .labelsHidden()
                        .textFieldStyle(.plain)
                        .accessibilityIdentifier("shortcuts.search")
                }
            }
            let shown = Shortcuts.filter(groups, query)
            if shown.isEmpty, !query.isEmpty {
                Section { Text("No shortcuts match \u{201C}\(query)\u{201D}").foregroundStyle(Color.muted) }
            }
            ForEach(shown, id: \.self) { group in
                Section(group.menu) {
                    ForEach(group.entries, id: \.self) { entry in
                        LabeledContent(entry.title) {
                            Text(entry.keys).font(.body.monospaced()).foregroundStyle(Color.muted)
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityIdentifier("shortcuts.entry")
                    }
                }
            }
            Section {} footer: { Text(Self.footer) }
        }
        .onAppear { groups = Shortcuts.groups(in: bar()) }
    }
}

extension Shortcuts {
    /// The groups with only the commands whose name or keys have `query` (all of them when empty).
    static func filter(_ groups: [Group], _ query: String) -> [Group] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return groups }
        return groups.compactMap { g in
            let hits = g.entries.filter { $0.title.localizedStandardContains(q) || $0.keys.localizedStandardContains(q) || g.menu.localizedStandardContains(q) }
            return hits.isEmpty ? nil : Group(menu: g.menu, entries: hits)
        }
    }
}
#endif
