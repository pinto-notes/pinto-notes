#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The PersonaEditorShots suite's declaration, and the helpers of it that tests in other test targets use
/// (a test target can't see another's code). Its tests are in PaneTests/HIG/PersonaEditorShots.swift.
@MainActor @Suite(.serialized) struct PersonaEditorShots {
    /// The notes window over `c` with `note` open, drawn at 2x after `prepare`.
    static func window(_ c: ModelContainer, note: String, dark: Bool, _ body: (NSWindow) async throws -> Void) async throws {
        try await AppSnapshotTests.withLastNote(c, note) {
            let w = MacWindowChromeTests.window(c, size: size)
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 16)
            // The list from its top (opened from below, it slides under the list's header off screen).
            try MacEmptyDetailTests.list(w).scrollRowToVisible(0)
            await MacWindowChromeTests.settle(w, 3)
            try await body(w)
        }
    }

    /// The notes list and the note, title bar included, at 2x. The sidebar's glass and the
    /// toolbar's glass buttons can't be drawn off screen (they come out white): the buttons'
    /// platters are hidden and the picture starts at the list.
    static func picture(_ w: NSWindow) throws -> NSBitmapImageRep {
        let frame = try #require(w.contentView?.superview)
        var hidden: [NSView] = []
        func hide(_ v: NSView) {
            if !v.isHidden, ["NSToolbarPlatterView", "NSGlassContainerView"].contains(String(describing: type(of: v))) { v.isHidden = true; hidden.append(v); return }
            v.subviews.forEach(hide)
        }
        hide(frame)
        defer { hidden.forEach { $0.isHidden = false } }
        let full = try MacEmptyDetailTests.picture(w)
        let table = try MacEmptyDetailTests.list(w)
        let left = table.convert(table.bounds, to: nil).minX
        let scale = CGFloat(full.pixelsWide) / frame.bounds.width
        let image = try #require(full.cgImage?.cropping(to: CGRect(x: (left * scale).rounded(), y: 0, width: CGFloat(full.pixelsWide) - (left * scale).rounded(), height: CGFloat(full.pixelsHigh))))
        return NSBitmapImageRep(cgImage: image)
    }

    static func editor(_ w: NSWindow) throws -> PaneTextView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
    }

    /// Scrolls the note to its foot.
    static func scrollToEnd(_ w: NSWindow) async throws {
        let sv = try #require(try editor(w).enclosingScrollView)
        for _ in 0..<3 {
            let doc = try #require(sv.documentView)
            sv.contentView.scroll(to: NSPoint(x: 0, y: max(0, doc.frame.height - sv.contentView.bounds.height)))
            sv.reflectScrolledClipView(sv.contentView)
            await MacWindowChromeTests.settle(w, 4)
        }
    }

    static let size = CGSize(width: 1180, height: 760)
    /// The demo library, with Weekend plans and Packing list linking Lisbon (as `-demoLinks`
    /// makes them) and a short Sintra note that Weekend plans links and Lisbon mentions.
    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let context = c.mainContext
        let travel = try #require(context.allFolders().first { $0.name == "Travel" })
        let weekend = context.createNote(in: .folder(travel.id), body: "Weekend plans\n\n- [ ] Flights for [[Lisbon]] on Thursday\n- [ ] Ask Sara about [[Lisbon#Food|where to eat]]\n- [ ] Train to [[Sintra]] on Saturday")
        weekend.updatedAt = .now.addingTimeInterval(-2 * 3600)
        let packing = context.createNote(in: .folder(travel.id), body: "Packing list\n\nRain jacket and good shoes for **[[Lisbon]]**, the hills are real.")
        packing.updatedAt = .now.addingTimeInterval(-26 * 3600)
        let sintra = context.createNote(in: .folder(travel.id), body: "Sintra\n\nA day by train from Rossio. Pena Palace first, then the Moorish castle.")
        sintra.updatedAt = .now.addingTimeInterval(-30 * 3600)
        try context.save()
        WikiDirectory.invalidate()
        return c
    }
}
#endif
