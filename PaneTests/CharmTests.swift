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
        let view = CharmFrame(kind: kind, t: t, rare: rare, accent: .orange, day: 4)
            .frame(width: 24, height: 24).foregroundStyle(.black).background(.white)
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

    /// The rare version: Format's only, never on the first hovers, and once a launch at most.
    @Test func rareWaitsItsTurn() {
        Charm.forcedRare = nil
        Charm.resetRolls()
        var rares: [Bool] = []
        for _ in 0..<1000 { rares.append(Charm.rollRare(.format)) }
        #expect(!rares.prefix(4).contains(true))
        #expect(rares.filter { $0 }.count == 1)
        Charm.resetRolls()
        #expect(!(0..<1000).contains { _ in Charm.rollRare(.today) || Charm.rollRare(.search) || Charm.rollRare(.trash) })
        Charm.resetRolls()
    }

    /// Today's ordinary flip never shows another day's number: the page turning away is blank.
    @Test func todayNeverShowsAnotherDay() {
        var blanks = 0
        for t in stride(from: 0.0, to: Charm.duration(.today, rare: false), by: 0.01) {
            let page = Charm.todayPage(t, false, day: 5)
            #expect(page.shown == nil || page.shown == 5, "t=\(t): \(String(describing: page.shown))")
            if page.shown == nil { blanks += 1 }
        }
        #expect(blanks > 0)
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
