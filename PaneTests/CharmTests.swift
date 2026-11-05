#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The glyphs' small moves (Charm): each one ends exactly where it started, so a glyph never
/// rests a pixel off; the rare version waits its turn; ticking a list's last item is noticed.
@MainActor @Suite(.serialized) struct CharmTests {
    /// A frame's pixels (RGBA), drawn offscreen at 4x.
    static func pixels(_ kind: Charm.Kind, t: Double, rare: Bool = false) throws -> [UInt8] {
        let room = 24 * Charm.bleed(kind)
        let view = CharmFrame(kind: kind, t: t, rare: rare, accent: .orange, day: 4)
            .frame(width: room, height: room).foregroundStyle(.black).background(.white)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 4
        let rep = NSBitmapImageRep(cgImage: try #require(renderer.cgImage))
        let data = try #require(rep.bitmapData)
        return Array(UnsafeBufferPointer(start: data, count: rep.bytesPerRow * rep.pixelsHigh))
    }

    /// The share of pixels that differ visibly between two frames.
    static func difference(_ a: [UInt8], _ b: [UInt8]) -> Double {
        var n = 0
        for i in stride(from: 0, to: min(a.count, b.count), by: 4)
        where abs(Int(a[i]) - Int(b[i])) + abs(Int(a[i + 1]) - Int(b[i + 1])) + abs(Int(a[i + 2]) - Int(b[i + 2])) > 60 {
            n += 1
        }
        return Double(n) / Double(a.count / 4)
    }

    /// Every move, ordinary and rare, has settled back onto the glyph at rest by its last frame
    /// (no jump when it stops), and moves in between. The note's tick is left out: it stays ticked.
    @Test(arguments: Charm.Kind.allCases.filter { $0 != .tick })
    func endsAtRest(_ kind: Charm.Kind) throws {
        let rest = try Self.pixels(kind, t: 0)
        for rare in [false, true] where !rare || Charm.hasRare(kind) {
            let d = Charm.duration(kind, rare: rare)
            let last = Self.difference(try Self.pixels(kind, t: d - 0.01, rare: rare), rest)
            #expect(last < 0.002, "\(kind)\(rare ? " rare" : ""): its last frame is \(last) off its rest")
            let moved = try stride(from: 0.1, to: d, by: 0.1).contains { Self.difference(try Self.pixels(kind, t: $0, rare: rare), rest) > 0.01 }
            #expect(moved, "\(kind)\(rare ? " rare" : "") moves at all")
        }
    }

    /// Today's torn page flies clear of the icon: mid-flight it has ink well below the calendar, at rest none.
    @Test func tornPageLeavesTheIcon() throws {
        func inkBelowIcon(_ t: Double) throws -> Int {
            let room = 24 * Charm.bleed(.today)
            let view = CharmFrame(kind: .today, t: t, accent: .orange, day: 5).frame(width: room, height: room).foregroundStyle(.black).background(.white)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let rep = NSBitmapImageRep(cgImage: try #require(renderer.cgImage))
            let top = Int((room / 2 + 12 + 3) * 2)
            var n = 0
            for y in top..<rep.pixelsHigh { for x in 0..<rep.pixelsWide where (rep.colorAt(x: x, y: y)?.brightnessComponent ?? 1) < 0.5 { n += 1 } }
            return n
        }
        #expect(try inkBelowIcon(0) == 0)
        #expect(try inkBelowIcon(0.75) > 40)
    }

    /// A finished list's other circles are found for the wave, and a neighbouring paragraph isn't one.
    @Test func waveTakesTheRestOfTheList() {
        let text = "Title\n- [x] Milk\n- [x] Eggs\n- [x] Bread\n\nAfter"
        let eggs = (text as NSString).range(of: "- [x] Eggs").location
        let found = CheckPop.otherLines(text, lineStart: eggs)
        #expect(found.sorted() == [(text as NSString).range(of: "- [x] Milk").location, (text as NSString).range(of: "- [x] Bread").location])
    }

    /// Every symbol it stands in for maps to a glyph, and others stay symbols.
    @Test func standsInForSymbols() {
        for name in ["magnifyingglass", "square.and.pencil", "checklist", "tablecells", "paperclip", "square.and.arrow.up",
                     "ellipsis", "folder", "trash", "textformat", "calendar", "arrow.uturn.backward", "gearshape", "lock", "tray.full"] {
            #expect(Charm.kind(forSymbol: name) != nil, "\(name)")
        }
        #expect(Charm.kind(forSymbol: "folder.fill") == nil)
    }

    /// The burst plays only when the tick leaves no open item in its list of two or more.
    @Test func completesList() {
        let text = "Groceries\n- [x] Milk\n- [x] Eggs\n- [ ] Bread\n\nAfter"
        let eggs = (text as NSString).range(of: "- [x] Eggs").location
        #expect(!CheckPop.completesList(text, lineStart: eggs))
        let done = text.replacingOccurrences(of: "- [ ] Bread", with: "- [x] Bread")
        let bread = (done as NSString).range(of: "- [x] Bread").location
        #expect(CheckPop.completesList(done, lineStart: bread))
        // A list elsewhere in the note doesn't count.
        let two = done + "\n- [ ] Other\n"
        #expect(CheckPop.completesList(two, lineStart: bread))
        // One item alone is not a list.
        let one = "Note\n- [x] Only\n"
        #expect(!CheckPop.completesList(one, lineStart: (one as NSString).range(of: "- [x]").location))
        // Indented items belong to the same list.
        let nested = "- [x] A\n  - [x] B\n- [x] C\n"
        #expect(CheckPop.completesList(nested, lineStart: 0))
    }
}
#endif
