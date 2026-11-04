#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Persona council 11-04: in a long note scrolled down, its text showed through the toolbar, under
/// the folder's name and the buttons. The page's ground is solid under the whole toolbar now,
/// fading out only below it. Drawn in a real window that is never shown (MacWindowChromeTests).
@MainActor @Suite(.serialized) struct ToolbarCoverTests {
    @Test func theCoverIsSolidForTheToolbarsHeight() {
        let solid = NoteDetailView.toolbarCover.filter { $0.opacity == 1 }.map(\.location).max() ?? 0
        #expect(solid * NoteDetailView.toolbarFade >= NoteDetailView.toolbarHeight, "solid to the toolbar's foot")
        #expect(NoteDetailView.toolbarCover.last?.opacity == 0 && NoteDetailView.toolbarCover.last?.location == 1, "then gone")
    }

    @Test(arguments: [false, true])
    func scrolledTextNeverShowsThroughTheToolbar(dark: Bool) async throws {
        let c = try AppSnapshotTests.container()
        let travel = try #require(c.mainContext.allFolders().first { $0.name == "Travel" })
        let lines = (1...140).map { "Line \($0): the long read goes on and on, words across the whole column, so some are always under the bar." }
        _ = c.mainContext.createNote(in: .folder(travel.id), body: "Long read\n\n" + lines.joined(separator: "\n"))
        try c.mainContext.save()
        try await PersonaEditorShots.window(c, note: "Long read", dark: dark) { w in
            try await PersonaEditorShots.scrollToEnd(w)
            let editor = try PersonaEditorShots.editor(w)
            let sv = try #require(editor.enclosingScrollView)
            #expect(sv.contentView.bounds.minY > 400, "scrolled well down: \(sv.contentView.bounds.minY)")
            // As the shots draw it: the toolbar's glass platters (white off screen) hidden, from the list on.
            let rep = try PersonaEditorShots.picture(w)
            let frame = try #require(w.contentView?.superview)
            let left = try MacEmptyDetailTests.list(w).convert(try MacEmptyDetailTests.list(w).bounds, to: nil).minX
            let scale = CGFloat(rep.pixelsHigh) / frame.bounds.height
            var column = sv.convert(sv.bounds, to: nil)
            column.origin.x -= left
            // Under the buttons and the folder's name (they sit in its top 40 pt), across the text.
            var seen: [NSColor] = []
            for y in stride(from: 42.0, through: 50.0, by: 2.0) {
                for x in stride(from: column.minX + 40, through: column.maxX - 40, by: 3.0) {
                    if let color = rep.colorAt(x: Int(x * scale), y: Int(y * scale))?.usingColorSpace(.sRGB) { seen.append(color) }
                }
            }
            #expect(seen.count > 100)
            func lum(_ c: NSColor) -> CGFloat { 0.2126 * c.redComponent + 0.7152 * c.greenComponent + 0.0722 * c.blueComponent }
            let range = (seen.map(lum).max() ?? 0) - (seen.map(lum).min() ?? 0)
            #expect(range < 0.01, "\(dark ? "dark" : "light"): one solid ground under the toolbar, no text through it (luminance varies by \(range))")
        }
    }
}
#endif
