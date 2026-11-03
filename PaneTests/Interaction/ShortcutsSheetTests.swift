#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Help › Keyboard Shortcuts: read from the menus, never a list kept by hand (Emil, 3 November 2026).
@MainActor @Suite struct ShortcutsSheetTests {
    @Test func keysReadAsTheMenusDrawThem() {
        #expect(Shortcuts.keys("n", .command) == "⌘N")
        #expect(Shortcuts.keys("N", .command) == "⇧⌘N", "a capital letter means Shift")
        #expect(Shortcuts.keys("l", [.command, .shift]) == "⇧⌘L")
        #expect(Shortcuts.keys("a", [.command, .option]) == "⌥⌘A")
        #expect(Shortcuts.keys(String(UnicodeScalar(UInt16(NSLeftArrowFunctionKey))!), [.command, .option, .shift]) == "⌥⇧⌘←")
        #expect(Shortcuts.keys("/", .command) == "⌘/")
        #expect(Shortcuts.keys("\r", .command) == "⌘↩")
    }

    @Test func everyCommandWithAShortcutIsListedByItsMenu() {
        let bar = NSMenu()
        func top(_ title: String, _ items: [NSMenuItem]) {
            let m = NSMenu(title: title)
            items.forEach(m.addItem)
            let i = NSMenuItem(title: title, action: nil, keyEquivalent: "")
            i.submenu = m
            bar.addItem(i)
        }
        let hidden = NSMenuItem(title: "Hidden", action: nil, keyEquivalent: "h"); hidden.isHidden = true
        let sub = NSMenu(title: "Find")
        sub.addItem(NSMenuItem(title: "Find…", action: nil, keyEquivalent: "f"))
        let find = NSMenuItem(title: "Find", action: nil, keyEquivalent: ""); find.submenu = sub
        top("Pane Beta", [NSMenuItem(title: "Settings…", action: nil, keyEquivalent: ",")])
        top("File", [NSMenuItem(title: "New Note", action: nil, keyEquivalent: "n"), NSMenuItem(title: "No shortcut", action: nil, keyEquivalent: ""), hidden])
        top("Edit", [find])
        top("Window", [NSMenuItem(title: "Nothing", action: nil, keyEquivalent: "")])
        let groups = Shortcuts.groups(in: bar)
        #expect(groups.map(\.menu) == ["Pinto Notes", "File", "Edit"], "the app's menu by its name; menus with no shortcuts left out")
        #expect(groups[1].entries == [.init(title: "New Note", keys: "⌘N")], "only commands with a shortcut, never hidden ones")
        #expect(groups[2].entries == [.init(title: "Find…", keys: "⌘F")], "submenus' commands too")
    }

    @Test func helpOffersIt() throws {
        let root = try String(contentsOf: TestFiles.url("Views").appending(path: "RootView.swift"), encoding: .utf8)
        let help = try #require(root.range(of: "CommandGroup(after: .help) {"))
        let block = String(root[help.upperBound...].prefix(400))
        #expect(block.contains("Button(Shortcuts.title)") && block.contains(".keyboardShortcut(\"/\", modifiers: .command)"), "Help › Keyboard Shortcuts, ⌘/")
    }

    @Test func theSheetDrawsTheList() async throws {
        let groups = [Shortcuts.Group(menu: "File", entries: [.init(title: "New Note", keys: "⌘N")])]
        let host = NSHostingView(rootView: ShortcutsSheet(groups: groups, close: {}))
        host.frame = CGRect(x: 0, y: 0, width: 460, height: 560)
        host.layoutSubtreeIfNeeded()
        #expect(host.fittingSize.width > 0)
    }
}
#endif
