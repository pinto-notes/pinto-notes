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

    /// Emil (10-29): "make the default main app window on mac bigger... no one would use it as
    /// small as it is by default." It was 1180×760 on every screen; now it's most of the screen.
    @Test func theDefaultGrowsWithTheScreen() {
        // A 14" MacBook Pro: most of the screen, room around it.
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 1512, height: 982)) == CGSize(width: 1285, height: 864))
        // A 27" display: capped, a notes window doesn't need the whole of it.
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 2560, height: 1415)) == CGSize(width: 1600, height: 1000))
        // A small screen: the old default where it fits, and always 40 points clear of each edge.
        #expect(WindowFrameMemory.defaultSize(on: CGSize(width: 1280, height: 720)) == CGSize(width: 1180, height: 640))
        #expect(WindowFrameMemory.defaultSize(on: nil) == WindowFrameMemory.smallDefault)
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
