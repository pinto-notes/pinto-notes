#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Tables in the real app, step by step (Emil, 11-01: "I want to see the experience"): at rest,
/// a cell being edited, a row picked by its handle, a row added, a wide table that scrolls,
/// and a new table made with Insert Table. Window-server captures, so CI only.
@MainActor @Suite(.serialized) struct TableShots {
    static let body = """
    Trip to Lisbon

    Where we stay and what it costs.

    | Day | Place | Cost |
    | --- | --- | --- |
    | Fri | Alfama flat | 120 |
    | Sat | Sintra day trip | 45 |
    | Sun | Belém and pastéis | 30 |

    Every booking, wider than the page:

    | Booking | Ref | From | To | Guests | Paid | Notes |
    | --- | --- | --- | --- | --- | --- | --- |
    | Flight out | TP1233 | Stockholm | Lisbon | 2 | Yes | Window seats |
    | Flat | AF-88 | Fri | Mon | 2 | Yes | Keys at the café |

    Packing next.

    """

    /// Round 1 (Emil, 1 November 2026: "why are there no vertical lines?"): the three line styles
    /// on the same note, at rest, editing, and a new table.
    @Test(arguments: TableLines.allCases)
    func lines(_ lines: TableLines) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let keep = TableLines.current
        TableLines.current = lines
        defer { TableLines.current = keep }
        let c = try AppSnapshotTests.container()
        let n = c.mainContext.createNote(in: .all, body: Self.body)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Trip to Lisbon") {
            let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                .tint(Color(PColor.paneAccent))
                .environment(\.controlActiveState, .key)
            let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 1000), dark: false)
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(3))
            let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
            let controller = try #require(editor.controller)
            controller.presentsTableMenus = false
            try await WarmGreySnapshots.shoot(w, "lines-\(lines)-1-rest", in: dir)
            w.makeFirstResponder(editor)
            editor.focusGrid(0, cell: GridCell(row: 2, column: 1))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "lines-\(lines)-2-editing", in: dir)
            controller.leftTable()
            editor.setSelectedRange(NSRange(location: (editor.string as NSString).length, length: 0))
            controller.insertTable()
            try? await Task.sleep(for: .seconds(1.5))
            if let clip = editor.enclosingScrollView?.contentView {
                clip.scroll(to: NSPoint(x: 0, y: max(0, editor.frame.height - clip.bounds.height)))
                editor.enclosingScrollView?.reflectScrolledClipView(clip)
            }
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "lines-\(lines)-3-new-table", in: dir)
        }
    }

    @Test(arguments: [false, true])
    func tables(dark: Bool) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        let body = Self.body
        let n = c.mainContext.createNote(in: .all, body: body)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        let mode = dark ? "dark" : "light"
        try await AppSnapshotTests.withLastNote(c, "Trip to Lisbon") {
            let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                .tint(Color(PColor.paneAccent))
                .environment(\.controlActiveState, .key)
            let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 1000), dark: dark)
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(3))
            let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
            let controller = try #require(editor.controller)
            controller.presentsTableMenus = false

            try await WarmGreySnapshots.shoot(w, "table-1-rest-\(mode)", in: dir)

            // A click in a cell: the keyboard is in it, its row and column show their handles.
            editor.focusGrid(0, cell: GridCell(row: 2, column: 1))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-2-editing-\(mode)", in: dir)

            // The row's handle: the row is picked (its menu would open here).
            controller.pickTableLine(.row(2), grid: 0, cell: GridCell(row: 2, column: 1))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-3-row-picked-\(mode)", in: dir)

            // Add Row Below, from that menu.
            controller.performTable(.addRowBelow, grid: 0, cell: GridCell(row: 2, column: 1))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-4-row-added-\(mode)", in: dir)

            // The column's handle.
            controller.pickTableLine(.column(2), grid: 0, cell: GridCell(row: 1, column: 2))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-5-column-picked-\(mode)", in: dir)

            // The wide table, a cell in it being edited.
            editor.focusGrid(1, cell: GridCell(row: 1, column: 3))
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-6-wide-\(mode)", in: dir)

            // Insert Table on the empty last line: a 2×2 table, keyboard in its first cell.
            controller.leftTable()
            w.makeFirstResponder(editor)
            editor.setSelectedRange(NSRange(location: (editor.string as NSString).length, length: 0))
            controller.insertTable()
            try? await Task.sleep(for: .seconds(1.5))
            if let clip = editor.enclosingScrollView?.contentView {
                clip.scroll(to: NSPoint(x: 0, y: max(0, editor.frame.height - clip.bounds.height)))
                editor.enclosingScrollView?.reflectScrolledClipView(clip)
            }
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "table-7-inserted-\(mode)", in: dir)
        }
    }
}
#endif
