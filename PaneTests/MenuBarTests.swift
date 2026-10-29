#if os(macOS)
import AppKit
#endif
import Foundation
import SwiftData
import Testing
@testable import Pane

@MainActor @Suite struct MenuBarTests {
    func library() throws -> ModelContext {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        return ModelContext(c)
    }

    func note(_ body: String, in context: ModelContext, pinned: Bool = false, minutesAgo: Double) -> Note {
        let n = context.createNote(in: .all, body: body)
        n.isPinned = pinned
        n.updatedAt = Date.now.addingTimeInterval(-minutesAgo * 60)
        return n
    }

    #if os(macOS)
    /// The menu bar shows the app icon's own leaf (2026-10-11: it still showed the tilted page of
    /// the old icon): a template image of 18 pt with a bitmap for each screen density, its ink
    /// leaning the way the leaf does, tip top right and stem bottom left, the note lines cut out.
    @Test func theMenuBarGlyphIsTheLeaf() throws {
        let image = try #require(NSImage(named: "MenuBarIcon"))
        #expect(image.isTemplate, "one ink: the menu bar colours it for light, dark and tinted bars")
        #expect(image.size == CGSize(width: 18, height: 18))
        #expect(Set(image.representations.map(\.pixelsWide)) == [18, 36])
        // Drawn at 2x into a bitmap of our own, to look at where its ink is.
        let big = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 36, pixelsHigh: 36, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                                isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: big)
        image.draw(in: CGRect(x: 0, y: 0, width: 36, height: 36))
        NSGraphicsContext.restoreGraphicsState()
        func ink(_ xs: Range<Int>, _ ys: Range<Int>) -> Double {
            var sum = 0.0
            for y in ys { for x in xs { sum += Double(big.colorAt(x: x, y: y)?.alphaComponent ?? 0) } }
            return sum / Double(xs.count * ys.count)
        }
        // Rows count from the top. The leaf fills the top right and leaves the top left corner and
        // the bottom right corner empty; the old page filled all four alike.
        #expect(ink(0..<36, 0..<36) > 0.25 && ink(0..<36, 0..<36) < 0.5)
        #expect(ink(24..<32, 4..<10) > 0.6, "the leaf's tip side")
        #expect(ink(0..<6, 0..<6) < 0.05)
        #expect(ink(30..<36, 30..<36) < 0.05)
        #expect(ink(6..<12, 30..<36) > 0.1, "the stem")
        // The icon's note lines are cut out of it: down a column left of the midrib the ink is
        // broken at least twice between the leaf's top and bottom edges.
        let column = (0..<36).map { ink(12..<13, $0..<($0 + 1)) > 0.5 }
        let runs = zip(column, column.dropFirst()).filter { $0 && !$1 }.count
        #expect(runs >= 3, "ink ends three times or more: at two cut lines at least, and at the bottom edge")
    }
    #endif

    @Test func pinnedFirstThenTheLatestSixWithoutDeleted() throws {
        let ctx = try library()
        let pinned = note("Groceries", in: ctx, pinned: true, minutesAgo: 90)
        let recent = (0..<8).map { note("Note \($0)", in: ctx, minutesAgo: Double($0)) }
        let trashed = note("Old", in: ctx, minutesAgo: 0.5)
        trashed.trashedAt = .now
        let s = MenuBarList.sections(try ctx.fetch(FetchDescriptor<Note>()), query: "")
        #expect(s.pinned == [pinned.id])
        #expect(s.recent == recent.prefix(6).map(\.id))
        #expect(!s.all.contains(trashed.id))
    }

    @Test func searchPutsTitleMatchesBeforeTextMatches() throws {
        let ctx = try library()
        let inBody = note("Monday\nbuy milk", in: ctx, minutesAgo: 1)
        let inTitle = note("Milk run\nsaturday", in: ctx, minutesAgo: 30)
        _ = note("Unrelated", in: ctx, minutesAgo: 2)
        let s = MenuBarList.sections(try ctx.fetch(FetchDescriptor<Note>()), query: " MILK ")
        #expect(s.matches == [inTitle.id, inBody.id])
        #expect(s.all == s.matches)
    }

    @Test func quickCaptureMakesANoteTitledByItsFirstLine() throws {
        let ctx = try library()
        #expect(QuickCapture.save("   \n ", in: ctx) == nil)
        let n = try #require(QuickCapture.save("  Call the dentist\nbefore Friday ", in: ctx))
        #expect(n.title == "Call the dentist")
        #expect(n.body == "Call the dentist\nbefore Friday")
        #expect(n.folder != nil)
    }

    @Test func openingANoteRemembersItForAFreshWindow() {
        // The test host shares the app's settings: put back the note you really had open.
        let before = UserDefaults.standard.string(forKey: "lastNote")
        defer { UserDefaults.standard.set(before, forKey: "lastNote") }
        let id = UUID()
        NoteOpener.shared.open(id)
        #expect(NoteOpener.shared.request == id)
        #expect(UserDefaults.standard.string(forKey: "lastNote") == id.uuidString)
        NoteOpener.shared.request = nil
    }

    @Test func testRunsNeverShowTheMenuBarItem() {
        #expect(MenuBarSettings.allowed == false)
    }
}

#if os(macOS)
import SwiftUI

/// Offscreen pictures of the panel: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/MenuBarSnapshotTests`.
@MainActor @Suite(.serialized) struct MenuBarSnapshotTests {
    @Test(arguments: [false, true]) func panel(dark: Bool) async throws {
        let c = try AppSnapshotTests.container()
        let backend = Backend()
        try await AppSnapshotTests.render(MenuBarPanel(backend: backend, sync: nil).modelContainer(c),
                                          name: "mac-menubar-\(dark ? "dark" : "light")", dark: dark)
        try await AppSnapshotTests.render(MenuBarPanel(backend: backend, sync: nil, query: "lis").modelContainer(c),
                                          name: "mac-menubar-typing-\(dark ? "dark" : "light")", dark: dark)
    }
}
#endif
