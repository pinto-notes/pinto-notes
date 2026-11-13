#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The Layout experiment (Settings › Experimental): each option's columns, in a real window that is
/// never shown. Nothing is posted to the system: keys go to the note's text view in-process.
@MainActor @Suite(.serialized) struct ColumnsLayoutTests {
    /// Runs `body` with `layout` picked, and today's layout after: the window tests in the other
    /// suites (MacWindowChromeTests) measure today's columns, and a Narrow left behind by a run
    /// that was stopped made the sidebar too narrow for its Search button.
    static func with<T>(_ layout: ColumnsLayout, _ body: () async throws -> T) async rethrows -> T {
        let d = UserDefaults.standard
        d.set(layout.rawValue, forKey: ColumnsLayout.key)
        defer { d.removeObject(forKey: ColumnsLayout.key) }
        return try await body()
    }

    static func split(_ w: NSWindow) throws -> NSSplitView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
    }

    /// The folders' and the list's widths, 0 for a folded one.
    static func widths(_ w: NSWindow) throws -> [CGFloat] {
        let s = try split(w)
        let controller = try #require(s.delegate as? NSSplitViewController)
        let shown = controller.splitViewItems.prefix(2).map { !($0.isCollapsed || $0.viewController.view.isHidden) }
        // The list as seen: on macOS 26 its view runs on under the floating sidebar (ListWidthKeeper).
        let folders = shown[0] ? s.arrangedSubviews[0].frame.width : 0
        let list = shown[1] ? s.arrangedSubviews[1].frame.maxX - (shown[0] ? s.arrangedSubviews[0].frame.maxX : s.arrangedSubviews[1].frame.minX) : 0
        return [folders, list]
    }

    static func textView(_ w: NSWindow) throws -> PaneTextView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
    }

    // MARK: The picker

    @Test func theOptionsAndWhatTheyKeep() {
        #expect(ColumnsLayout.allCases.map(\.title) == ["Today", "Narrow columns", "Writing focus", "Two columns"])
        let suite = "layout-\(UUID())"
        let d = UserDefaults(suiteName: suite)!
        defer { d.removePersistentDomain(forName: suite) }
        #expect(ColumnsLayout.current(d) == .today, "today's layout until another is picked")
        d.set("narrow", forKey: ColumnsLayout.key)
        #expect(ColumnsLayout.current(d) == .narrow)
        #expect(ColumnsLayout.narrow.folderWidths.ideal == 220 && ColumnsLayout.narrow.listWidths.ideal == 280)
        #expect(ColumnsLayout.today.folderWidths.ideal == 260 && ColumnsLayout.today.listWidths.ideal == 330)
        #expect(ColumnsLayout.twoColumns.opening == .doubleColumn && ColumnsLayout.today.opening == .all)
        // Two columns has no folders to show: list and note, the note alone, back.
        #expect(ColumnsLayout.twoColumns.next(.doubleColumn) == .detailOnly)
        #expect(ColumnsLayout.twoColumns.next(.detailOnly) == .doubleColumn)
        #expect(ColumnsLayout.today.next(.all) == .doubleColumn)
    }

    @Test func writingFocusFoldsOnceAndEscBringsTheColumnsBack() {
        var f = WritingFocus()
        let a = UUID(), b = UUID()
        #expect(f.typed(in: a, visibility: .all) == .detailOnly)
        #expect(f.isFocused)
        #expect(f.typed(in: a, visibility: .detailOnly) == nil, "already folded")
        #expect(f.escape() == .all)
        #expect(f.escape() == nil, "Esc with nothing folded is the note's own")
        #expect(f.typed(in: a, visibility: .all) == nil, "typing on in the same note leaves them")
        f.opened(b)
        #expect(f.typed(in: b, visibility: .doubleColumn) == .detailOnly, "another note folds them again")
        f.userChanged()
        #expect(f.escape() == nil, "folded by hand: yours")
    }

    // MARK: Each option in a window

    @Test(arguments: ColumnsLayout.allCases) func eachOptionOpensWithItsColumns(_ layout: ColumnsLayout) async throws {
        let c = try AppSnapshotTests.container()
        try await Self.with(layout) {
            try await AppSnapshotTests.withLastNote(c, "Groceries") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1440, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let widths = try Self.widths(w)
                switch layout {
                case .today, .writingFocus:
                    #expect(abs(widths[0] - 260) < 2 && abs(widths[1] - 330) < 2, "\(layout): \(widths)")
                case .narrow:
                    #expect(abs(widths[0] - 220) < 2 && abs(widths[1] - 280) < 2, "narrow: \(widths)")
                case .twoColumns:
                    #expect(widths[0] == 0 && widths[1] > 200, "two columns: no folders (\(widths))")
                    let menu = await MacEmptyDetailTests.waitForElement("list.folderMenu", in: w)
                    #expect(menu != nil || MacEmptyDetailTests.element("list.folderMenu", in: w) != nil, "the list's title is a menu")
                }
            }
        }
    }

    @Test func switchingThePickerChangesTheWindowAtOnce() async throws {
        let c = try AppSnapshotTests.container()
        try await Self.with(.today) {
            try await AppSnapshotTests.withLastNote(c, "Groceries") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1440, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                UserDefaults.standard.set(ColumnsLayout.narrow.rawValue, forKey: ColumnsLayout.key)
                await MacWindowChromeTests.settle(w, 20)
                var widths = try Self.widths(w)
                #expect(abs(widths[0] - 220) < 2 && abs(widths[1] - 280) < 2, "narrow, no relaunch: \(widths)")
                UserDefaults.standard.set(ColumnsLayout.twoColumns.rawValue, forKey: ColumnsLayout.key)
                await MacWindowChromeTests.settle(w, 20)
                widths = try Self.widths(w)
                #expect(widths[0] == 0 && widths[1] > 200, "two columns, no relaunch: \(widths)")
                UserDefaults.standard.set(ColumnsLayout.today.rawValue, forKey: ColumnsLayout.key)
                await MacWindowChromeTests.settle(w, 20)
                widths = try Self.widths(w)
                #expect(widths[0] > 200 && widths[1] > 200, "today again: \(widths)")
            }
        }
    }

    @Test func writingFocusFoldsOnTheFirstKeystrokeNotOnScroll() async throws {
        let c = try AppSnapshotTests.container()
        try await Self.with(.writingFocus) {
            try await AppSnapshotTests.withLastNote(c, "Groceries") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1440, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let text = try Self.textView(w)
                // Reading: scrolling the note leaves the columns.
                if let clip = text.enclosingScrollView?.contentView {
                    clip.scroll(to: CGPoint(x: 0, y: 120))
                    text.enclosingScrollView?.reflectScrolledClipView(clip)
                }
                await MacWindowChromeTests.settle(w, 10)
                #expect(try CanvasNativeUITests.collapsed(w) == [false, false], "scrolling doesn't fold")
                // The first keystroke folds both.
                w.makeFirstResponder(text)
                text.setSelectedRange(NSRange(location: (text.string as NSString).length, length: 0))
                text.insertText("x", replacementRange: text.selectedRange())
                await MacWindowChromeTests.settle(w, 12)
                #expect(try CanvasNativeUITests.collapsed(w) == [true, true], "typing folds the columns")
                // Esc brings them back.
                text.doCommand(by: #selector(NSResponder.cancelOperation(_:)))
                await MacWindowChromeTests.settle(w, 12)
                #expect(try CanvasNativeUITests.collapsed(w) == [false, false], "Esc brings them back")
                text.insertText("y", replacementRange: text.selectedRange())
                await MacWindowChromeTests.settle(w, 8)
                #expect(try CanvasNativeUITests.collapsed(w) == [false, false], "and they stay for this note")
            }
        }
    }

    @Test func theTwoColumnsMenuSwitchesFolder() async throws {
        let c = try AppSnapshotTests.container()
        let travel = try #require(try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" })
        try await Self.with(.twoColumns) {
            try await AppSnapshotTests.withLastNote(c, "Groceries") {
                let w = MacWindowChromeTests.window(c, size: CGSize(width: 1440, height: 900))
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let menu = try #require(Self.folderMenu(w), "the title's menu: \((w.toolbar?.items ?? []).map { "\($0.label)|\($0.menuFormRepresentation?.submenu?.items.map(\.title) ?? [])" })")
                let i = try #require(menu.items.firstIndex { $0.title.trimmingCharacters(in: .whitespaces) == "Travel" }, "\(menu.items.map(\.title))")
                menu.performActionForItem(at: i)
                await MacWindowChromeTests.settle(w, 12)
                let shown = UserDefaults.standard.data(forKey: "lastScope").flatMap { try? JSONDecoder().decode(Scope.self, from: $0) }
                #expect(shown == .folder(travel.id), "the list shows Travel")
            }
        }
    }

    /// The title menu's own menu, as AppKit holds it: the toolbar item's menu form.
    static func folderMenu(_ w: NSWindow) -> NSMenu? {
        (w.toolbar?.items ?? []).lazy.compactMap { $0.menuFormRepresentation?.submenu }
            .first { $0.items.contains { $0.title.contains("Recently Deleted") } }
    }
}
#endif
