import Foundation
import Testing
@testable import Pane

/// Signed out, the app opens on the welcome; sign-in is one step in.
@Suite(.serialized) struct WelcomeTests {
    @Test func aSignedOutLaunchStartsOnTheWelcome() {
        #expect(WelcomeFlow.Stage.first(arguments: []) == .welcome)
        #expect(WelcomeFlow.Stage.first(arguments: ["-synctest", "-signout"]) == .welcome)
    }

    @Test func testsCanGoStraightToSignIn() {
        #expect(WelcomeFlow.Stage.first(arguments: ["-signout", "-skipWelcome"]) == .signIn(returning: true))
    }

    /// After deleting the account the welcome says so, once (newcomer audit, 2026-10-12).
    @Test func theWelcomeAfterDeletingTheAccountSaysSo() {
        #expect(!WelcomeFlow.Farewell.take())
        WelcomeFlow.Farewell.accountDeleted()
        #expect(WelcomeFlow.Farewell.take())
        #expect(!WelcomeFlow.Farewell.take(), "the next welcome is the usual one")
    }

    /// "Sign in" on a deleted account's screen lands on sign-in, not on the welcome; once.
    @Test func aSignInButtonLandsOnSignIn() {
        WelcomeFlow.Stage.signInNext = true
        #expect(WelcomeFlow.Stage.first(arguments: []) == .signIn(returning: true))
        #expect(WelcomeFlow.Stage.first(arguments: []) == .welcome, "the next signed-out launch is the welcome again")
    }
}

#if os(macOS)
import AppKit

/// The Mac welcome window: it could be resized, filled or made full screen, and the
/// picture then sat in a band of empty background. The card holds its size now, and the picture
/// is cut for exactly its half.
@MainActor @Suite struct WelcomeWindowTests {
    @Test(arguments: OnboardingArt.Set.allCases)
    func thePictureIsCutForItsHalf(_ set: OnboardingArt.Set) throws {
        let picture = try #require(NSImage(named: OnboardingArt.name(.signin, in: set)))
        let half = CGSize(width: WelcomeFlow.size.width / 2, height: WelcomeFlow.size.height)
        #expect(abs(picture.size.width / picture.size.height - half.width / half.height) < 0.01)
    }

    @Test func theCardCantGoFullScreenAndTheNotesCan() {
        // Off screen, borderless and never ordered front: nothing appears on a developer's Mac.
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                              styleMask: [.borderless], backing: .buffered, defer: true)
        window.collectionBehavior.insert(.fullScreenPrimary)
        CardWindow.lock(window)
        #expect(window.collectionBehavior.contains(.fullScreenNone))
        #expect(!window.collectionBehavior.contains(.fullScreenPrimary))
        CardWindow.unlock(window)
        #expect(window.collectionBehavior.contains(.fullScreenPrimary))
        #expect(!window.collectionBehavior.contains(.fullScreenNone))
    }

    @Test func theWindowWrapsTheCardAndItsTitleBar() {
        // It needs a title bar to measure, so it can't be borderless; it stays off screen and is
        // never ordered front.
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760),
                              styleMask: [.titled, .fullSizeContentView], backing: .buffered, defer: true)
        let titleBar = window.frame.height - window.contentLayoutRect.height
        #expect(titleBar > 0)
        #expect(CardWindow.frameSize(window, card: WelcomeFlow.size) == CGSize(width: 900, height: 600 + titleBar))
    }

    /// Emil (dev 2610071519): "the window keeps moving around. When I filled in the 6 digit code,
    /// the window moved." Signing in sent the window to the screen's centre (or to where the notes
    /// were last time). Now the window stays where you put the card: the notes grow out of it with
    /// its top edge and centre in place, and signing out shrinks them back into the same card.
    @Test func theWindowStaysWhereYouPutTheCard() {
        let screen = CGRect(x: 0, y: 0, width: 1728, height: 1084)
        let saved = CGRect(x: 40, y: 60, width: 1300, height: 820)
        // The card, dragged up and to the left of where it opened.
        let card = CGRect(x: 300, y: 380, width: 900, height: 632)
        for remembered in [nil, saved] {
            let before = WindowFrameMemory.frame(saved: remembered, screens: [screen], main: screen)
            let notes = CardWindow.notesFrame(from: card, saved: remembered, screen: screen)
            let back = CardWindow.resized(notes, to: card.size, on: screen)
            print("window flow (saved \(remembered.map(NSStringFromRect) ?? "none")): card \(NSStringFromRect(card))"
                  + " -> notes before \(NSStringFromRect(before)), after \(NSStringFromRect(notes)) -> card \(NSStringFromRect(back))")
            #expect(notes.maxY == card.maxY, "the top edge stays put")
            #expect(notes.midX == card.midX, "the centre stays put")
            #expect(notes.size == (remembered?.size ?? WindowFrameMemory.defaultSize(on: screen.size)), "the notes keep their size")
            #expect(back == card, "signing out brings back the same card")
        }
    }

    @Test func aWindowNearTheEdgeMovesOnlyEnoughToStayOnScreen() {
        let screen = CGRect(x: 0, y: 0, width: 1440, height: 875)
        let card = CGRect(x: 520, y: 200, width: 900, height: 632)
        let notes = CardWindow.notesFrame(from: card, saved: nil, screen: screen)
        #expect(screen.contains(notes))
        #expect(notes.maxX == screen.maxX, "pushed back from the right edge, no further")
        #expect(notes.maxY == card.maxY)
        // Bigger than the screen: it fills it.
        let huge = CardWindow.resized(card, to: CGSize(width: 3000, height: 2000), on: screen)
        #expect(huge == screen)
    }

    @Test func nothingMovesWhenTheSizeIsTheSame() {
        let screen = CGRect(x: 0, y: 0, width: 1728, height: 1084)
        let card = CGRect(x: 311, y: 207, width: 900, height: 632)
        #expect(CardWindow.resized(card, to: card.size, on: screen) == card)
    }
}
#endif

