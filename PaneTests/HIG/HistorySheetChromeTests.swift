#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Version History and AI Changes are cards like the app's others: one close × in the top corner
/// and the actions at the top, not a bar of Done and action buttons along the bottom (Emil,
/// 5 November 2026: "it doesn't look like a normal sheet like the other ones do"). Drawn
/// offscreen and read from the pixels.
@MainActor @Suite(.serialized) struct HistorySheetChromeTests {
    static func draw(_ view: some View, size: CGSize) async throws -> NSBitmapImageRep {
        let host = NSHostingView(rootView: view.frame(width: size.width, height: size.height).environment(\.controlActiveState, .key))
        host.appearance = NSAppearance(named: .aqua)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        host.frame = CGRect(origin: .zero, size: size)
        defer { window.close() }
        try? await Task.sleep(for: .seconds(0.6))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.appearance!.performAsCurrentDrawingAppearance { host.cacheDisplay(in: host.bounds, to: rep) }
        return rep
    }

    /// How much of a rect (points, from the top left) differs from its own corner pixel.
    static func ink(_ rep: NSBitmapImageRep, _ rect: CGRect, size: CGSize) -> Double {
        let sx = CGFloat(rep.pixelsWide) / size.width, sy = CGFloat(rep.pixelsHigh) / size.height
        let x0 = Int(rect.minX * sx), x1 = Int(rect.maxX * sx), y0 = Int(rect.minY * sy), y1 = Int(rect.maxY * sy)
        guard let base = rep.colorAt(x: x0, y: y0)?.usingColorSpace(.deviceRGB) else { return 1 }
        var differ = 0, all = 0
        for y in stride(from: y0, to: y1, by: 2) {
            for x in stride(from: x0, to: x1, by: 2) {
                all += 1
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                let d = abs(c.redComponent - base.redComponent) + abs(c.greenComponent - base.greenComponent) + abs(c.blueComponent - base.blueComponent)
                if d > 0.06 { differ += 1 }
            }
        }
        return Double(differ) / Double(max(all, 1))
    }

    static func check(_ rep: NSBitmapImageRep, size: CGSize) {
        // Where Done and the action used to sit: the bottom right, now plain page.
        let bottom = ink(rep, CGRect(x: size.width - 340, y: size.height - 56, width: 330, height: 50), size: size)
        #expect(bottom < 0.01, "no buttons along the bottom: \(bottom)")
        // The close × in the top corner.
        let corner = ink(rep, CGRect(x: size.width - 46, y: 13, width: 32, height: 32), size: size)
        #expect(corner > 0.2, "a close × in the top corner: \(corner)")
        // The action beside it, on the top row.
        let action = ink(rep, CGRect(x: size.width - 200, y: 14, width: 140, height: 30), size: size)
        #expect(action > 0.2, "the action on the top row: \(action)")
    }

    @Test func versionHistoryIsACard() async throws {
        let c = try AppSnapshotTests.container()
        let notes = try c.mainContext.fetch(FetchDescriptor<Note>())
        let history = NoteHistory(store: DemoHistoryStore(context: c.mainContext), context: c.mainContext, sync: nil)
        let model = VersionHistoryModel(note: try #require(notes.first { $0.title == "Groceries" }), history: history)
        await model.load()
        await model.select(model.entries[1].id)
        let size = CGSize(width: 900, height: 600)
        Self.check(try await Self.draw(MacVersionHistory(model: model, close: {}), size: size), size: size)
    }

    @Test func aiChangesIsACard() async throws {
        let (container, history, store) = try AIChangesSnapshots.library()
        let model = AIChangesModel(store: store, history: history, connected: ["ChatGPT", "Claude Code"])
        await model.load()
        let size = CGSize(width: 940, height: 620)
        Self.check(try await Self.draw(MacAIChanges(model: model, close: {}, open: { _ in }), size: size), size: size)
        withExtendedLifetime(container) {}
    }
}
#endif
