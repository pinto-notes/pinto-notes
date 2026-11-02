#if os(macOS)
import Foundation
import Testing
@testable import Pane

/// The notes window reopens where you left it, like Notes; a frame that's no longer
/// on a screen falls back to the centred default.
@Suite struct WindowFrameTests {
    let laptop = CGRect(x: 0, y: 0, width: 1512, height: 944)
    let external = CGRect(x: 1512, y: 0, width: 2560, height: 1415)

    @Test func firstLaunchIsCentredAtTheDefaultSize() {
        let f = WindowFrameMemory.frame(saved: nil, screens: [laptop], main: laptop)
        #expect(f.size == WindowFrameMemory.defaultSize(on: laptop.size))
        #expect(abs(f.midX - laptop.midX) < 1 && abs(f.midY - laptop.midY) < 1)
    }

    @Test func aCardSizedFrameIsNeverRestored() {
        // Signing out shrinks the window to the sign-in card; that size must not come back after sign-in.
        let card = CGRect(x: 500, y: 300, width: 380, height: 340)
        #expect(WindowFrameMemory.frame(saved: card, screens: [laptop], main: laptop).size == WindowFrameMemory.defaultSize(on: laptop.size))
    }

    /// One size on every screen (Emil, 2 November 2026: 88% of the screen's height was "sooo
    /// tall", about 1200×780 "pretty good"), smaller only where it doesn't fit.
    @Test func theDefaultIsOneSizeThatFits() {
        // A 14" MacBook Pro at either setting, and a 27" display: the same window.
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 1512, height: 982)) == WindowFrameMemory.standard)
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 1728, height: 1084)) == WindowFrameMemory.standard)
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 2560, height: 1415)) == WindowFrameMemory.standard)
        // A small screen: 40 points clear of each edge.
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 1280, height: 720)) == CGSize(width: 1200, height: 640))
        #expect(WindowFrameMemory.defaultSize(on: nil) == WindowFrameMemory.standard)
    }

    @Test func aWindowLeftAtTheOldDefaultGetsTheNewOne() {
        // Saved on every move, so a window that was only moved holds the old fixed size.
        let old = CGRect(x: 100, y: 100, width: 1180, height: 760)
        #expect(WindowFrameMemory.frame(saved: old, screens: [laptop], main: laptop).size == WindowFrameMemory.defaultSize(on: laptop.size))
        let card = CGRect(x: 300, y: 200, width: 900, height: 632)
        #expect(CardWindow.notesFrame(from: card, saved: old, screen: laptop).size == WindowFrameMemory.defaultSize(on: laptop.size))
    }

    @Test func savedFrameComesBackExactly() {
        let saved = CGRect(x: 1700, y: 200, width: 1400, height: 900)
        #expect(WindowFrameMemory.frame(saved: saved, screens: [laptop, external], main: laptop) == saved)
    }

    @Test func frameOnADisconnectedScreenFallsBack() {
        let saved = CGRect(x: 1700, y: 200, width: 1400, height: 900)
        let f = WindowFrameMemory.frame(saved: saved, screens: [laptop], main: laptop)
        #expect(laptop.contains(f))
    }

    @Test func titleBarMustBeReachable() {
        // Pushed up so the title bar sits above the screen: can't be dragged back.
        let saved = CGRect(x: 100, y: 900, width: 1000, height: 700)
        #expect(WindowFrameMemory.frame(saved: saved, screens: [laptop], main: laptop) != saved)
    }

    @Test func savesAndReadsTheFrameString() {
        let d = UserDefaults.standard, keep = d.object(forKey: WindowFrameMemory.key)
        defer { if let keep { d.set(keep, forKey: WindowFrameMemory.key) } else { d.removeObject(forKey: WindowFrameMemory.key) } }
        let r = CGRect(x: 40, y: 60, width: 1200, height: 800)
        WindowFrameMemory.save(r)
        #expect(WindowFrameMemory.saved == r)
    }
}
#endif
