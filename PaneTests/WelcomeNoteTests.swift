import Foundation
import Testing
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// Every account's first note (WelcomeNote): its words per device, written once, by one device,
/// never for an account from before; and the iPhone's hand-off after a sign-in from it.
@MainActor @Suite(.serialized) struct WelcomeNoteTests {
    @Test func theIPhoneNoteSendsYouToTheMac() {
        #expect(WelcomeNote.body(for: .iPhone) == """
        # Welcome

        This is your notebook.
        Your AI writes in it too.

        Get started

        - [ ] Get Pinto on your Mac
        - [ ] Bring your Apple Notes over
        - [ ] Connect ChatGPT or Claude

        """)
    }

    @Test func theMacNoteSendsYouToTheIPhoneLast() {
        let items = WelcomeNote.items(for: .mac).map(\.title)
        #expect(items == ["Bring your Apple Notes over", "Connect ChatGPT or Claude", "Get Pinto on your iPhone"])
        #expect(WelcomeNote.body(for: .mac).hasPrefix("# Welcome\n\nThis is your notebook.\nYour AI writes in it too.\n\nGet started\n\n"))
        #if os(macOS)
        #expect(WelcomeNote.thisDevice == .mac)
        #else
        #expect(WelcomeNote.thisDevice == .iPhone)
        #endif
    }

    @Test func theSavedNoteKeepsTicksAndSaysNothingElse() {
        let body = WelcomeNote.body(for: .iPhone, ticked: [0, 2])
        #expect(body.contains("- [x] Get Pinto on your Mac"))
        #expect(body.contains("- [ ] Bring your Apple Notes over"))
        #expect(body.contains("- [x] Connect ChatGPT or Claude"))
        for item in WelcomeNote.items(for: .iPhone) { #expect(!body.contains(item.detail), "the grey sublines aren't saved") }
        for name in ["ChatGPT", "Claude"] {
            #expect(!body.replacingOccurrences(of: "Connect ChatGPT or Claude", with: "").contains(name), "no word of who wrote it")
        }
        #expect(NoteText.head(of: body).title == "Welcome")
    }

    // MARK: Once per account

    private func account() -> (UUID, UserDefaults) { (UUID(), TestDefaults()) }

    @Test func aNewAccountsFirstDeviceWritesIt() async {
        let (me, defaults) = account()
        var written: [String] = []
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { true }, write: { written.append($0); return UUID() })
        #expect(id != nil)
        #expect(written == [WelcomeNote.body(for: WelcomeNote.thisDevice)])
    }

    @Test func anAccountFromBeforeOrAnotherDeviceWritesNothing() async {
        let (me, defaults) = account()
        var written = 0
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { false }, write: { _ in written += 1; return UUID() })
        #expect(id == nil)
        #expect(written == 0)
    }

    @Test func itAsksOnceAndTriesAgainOnlyAfterAFailure() async {
        let (me, defaults) = account()
        var asked = 0
        struct Offline: Error {}
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; throw Offline() }, write: { _ in UUID() })
        #expect(asked == 1)
        let id = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; return true }, write: { _ in UUID() })
        #expect(asked == 2 && id != nil, "a failed ask is tried again")
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { asked += 1; return true }, write: { _ in UUID() })
        #expect(asked == 2, "an answer is remembered: no second note, no second ask")
    }

    @Test func ticksFromTheWelcomeGoIntoTheNote() async {
        let (me, defaults) = account()
        WelcomeNote.ticked = [1]
        var body = ""
        _ = await WelcomeNote.settle(account: me, defaults: defaults, claim: { true }, write: { body = $0; return UUID() })
        #expect(body.contains("- [x] \(WelcomeNote.items(for: WelcomeNote.thisDevice)[1].title)"))
        #expect(WelcomeNote.ticked.isEmpty, "used once")
    }

    // MARK: The iPhone's hand-off

    @Test func aNewAccountsNoteFoldsOnceItsRowIsThere() {
        let h = WelcomeHandoff()
        h.arm(ticked: [0])
        #expect(h.phase == .waiting)
        let id = UUID()
        h.settled(id)
        h.fold()
        #expect(h.phase == .waiting, "no row yet: it waits")
        h.target = CGRect(x: 16, y: 180, width: 360, height: 64)
        h.fold()
        #expect(h.phase == .folding)
        h.done()
        #expect(h.phase == .idle && h.flash == id, "the row lights up as the note lands")
    }

    @Test func anAccountFromBeforeSlidesAway() {
        let h = WelcomeHandoff()
        h.arm(ticked: [])
        h.settled(nil)
        #expect(h.phase == .leaving)
        h.done()
        #expect(h.phase == .idle && h.flash == nil)
    }

    @Test func aCancelledSignInLeavesTheWelcome() {
        let h = WelcomeHandoff()
        h.arm(ticked: [2])
        h.disarm()
        #expect(h.phase == .idle)
        h.settled(UUID())
        #expect(h.phase == .idle, "nothing to fold")
    }

    // MARK: The AI's first edit

    /// The receipt the open note shows ("Claude changed 1 line", Undo) comes on the Welcome note's
    /// first AI edit like any other note's: the app writing the note doesn't count as an AI's edit.
    @Test func theFirstAIEditOfTheWelcomeNoteGetsItsReceipt() throws {
        let note = Note(body: WelcomeNote.body(for: .iPhone))
        // Written by Pinto: no AI named on it (the server keeps it so: welcome.pglite.test.ts).
        #expect(note.aiEditor == nil && note.aiEditedAt == nil)
        #expect(!AIEdit.isUnseen(note))
        let old = note.body, oldAt = note.aiEditedAt
        note.body = old + "- [ ] Buy milk\n"
        note.aiEditor = "Claude"
        note.aiEditedAt = .now
        AIEdit.arrived(note, previousBody: old, previousEditAt: oldAt, quiet: false)
        #expect(AIEdit.isUnseen(note))
        let receipt = try #require(AIEdit.markSeen(note))
        #expect(receipt.summary == "Claude changed 1 line")
        #expect(!receipt.created, "it changed the note, it didn't write it")
    }

    #if os(iOS)
    /// Played to the end without a tap, the way in comes up (it once never did: the last pause read
    /// the note being done as a skip).
    @Test func playedToTheEndTheWayInComesUp() async throws {
        WelcomeNoteView.pace = 0.01
        defer { WelcomeNoteView.pace = 1 }
        let before = WelcomeNoteView.wayInShown
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
        window.rootViewController = UIHostingController(rootView: WelcomeNoteView(backend: Backend(), useEmail: {}))
        window.isHidden = false
        defer { window.isHidden = true }
        for _ in 0..<40 where WelcomeNoteView.wayInShown == before { try await Task.sleep(for: .milliseconds(100)) }
        #expect(WelcomeNoteView.wayInShown == before + 1)
    }

    /// While it's written, nothing moves: every stage of the writing, carets and all, lays out the
    /// page at the height of the finished note (lines once jumped as a caret came and went).
    @Test func theLinesDontMoveWhileItsWritten() {
        let ticked = Binding<Set<Int>>(get: { [] }, set: { _ in })
        let date = Date(timeIntervalSince1970: 0)
        func height(_ page: WelcomeNotePage) -> CGFloat {
            UIHostingController(rootView: page).sizeThatFits(in: CGSize(width: 393, height: 4000)).height
        }
        let done = height(WelcomeNotePage(ticked: ticked, date: date))
        let n = WelcomeNote.items(for: .iPhone).map(\.title.count)
        let stages: [WelcomeNotePage] = [
            WelcomeNotePage(head: 0, line1: 0, line2: 0, section: 0, todo: [0, 0, 0], you: .head, ticked: ticked, date: date),
            WelcomeNotePage(head: 4, line1: 0, line2: 0, section: 0, todo: [0, 0, 0], you: .head, ticked: ticked, date: date),
            WelcomeNotePage(section: 0, todo: [0, 0, 0], ai: (.section, .chatGPT), ticked: ticked, date: date),
            WelcomeNotePage(section: 5, todo: [0, 0, 0], ai: (.section, .chatGPT), ticked: ticked, date: date),
            WelcomeNotePage(todo: [0, 0, 0], ai: (.todo(0), .claude), ticked: ticked, date: date),
            WelcomeNotePage(todo: [n[0], 6, 0], ai: (.todo(1), .chatGPT), ticked: ticked, date: date),
            WelcomeNotePage(todo: [n[0], n[1], 2], ai: (.todo(2), .claude), ticked: ticked, date: date),
        ]
        for (k, page) in stages.enumerated() { #expect(height(page) == done, "stage \(k)") }
    }
    #endif
}

/// After a sign-in from the welcome note (Emil, 28 October 2026: the key screens came up between
/// signing in and the fold, and the library flashed by). A new account's key, made here, needs
/// nobody: no key screen, and the note stays until it folds. An account from before that needs the
/// person (another device, the recovery key) gets its screens, and the note steps aside.
@MainActor @Suite struct WelcomeKeyGateTests {
    /// Every state a new account's key passes through on the way: none shows the gate.
    @Test func aNewAccountFromTheWelcomeNoteNeverSeesTheKeyGate() {
        let h = WelcomeHandoff()
        h.arm(ticked: [], way: .apple)
        for (phase, needsWelcome, keyIsAccounts) in [(AccountCrypto.Phase.off, false, false), (.checking, false, false), (.checking, false, true),
                                                     (.unreachable, false, true), (.ready, true, true), (.ready, false, true)] {
            let needs = AppGate.keyNeedsPerson(phase: phase, asksBeforeFetch: false, needsSignIn: false)
            #expect(!needs, "\(phase): nothing for the person to do")
            #expect(!AppGate.gateShown(phase: phase, needsWelcome: needsWelcome, keyIsAccounts: keyIsAccounts, handingOff: true, needsPerson: needs),
                    "\(phase): the key screen stays behind the note")
            if needs { h.leave() }
        }
        #expect(h.phase == .waiting, "the hand-off isn't left: the note will fold")
        // "Your notes are encrypted" is marked as said, for a key made here only.
        #expect(AppGate.welcomesSilently(handingOff: true, phase: .ready, needsWelcome: true, arrivedHow: .made))
        #expect(!AppGate.welcomesSilently(handingOff: true, phase: .ready, needsWelcome: true, arrivedHow: .signIn), "a key fetched for an account from before")
        #expect(!AppGate.welcomesSilently(handingOff: false, phase: .ready, needsWelcome: true, arrivedHow: .made), "no hand-off, the screen says it")
    }

    @Test func anAccountThatNeedsItsRecoveryKeyGetsTheGateAndTheNoteStepsAside() {
        let h = WelcomeHandoff()
        h.arm(ticked: [], way: .google)
        for (phase, asks, signIn) in [(AccountCrypto.Phase.waiting, false, false), (.mismatch, false, false), (.accountGone, false, false),
                                      (.checking, true, false), (.ready, false, true)] {
            let needs = AppGate.keyNeedsPerson(phase: phase, asksBeforeFetch: asks, needsSignIn: signIn)
            #expect(needs, "\(phase): the person has something to do")
            #expect(AppGate.gateShown(phase: phase == .ready ? .checking : phase, needsWelcome: false, keyIsAccounts: true, handingOff: true, needsPerson: needs))
        }
        h.leave()
        #expect(h.phase == .leaving, "the note steps aside")
        h.done()
        #expect(AppGate.gateShown(phase: .waiting, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: true))
    }

    /// Without a hand-off the gate is what it was.
    @Test func withoutAHandOffTheGateIsUnchanged() {
        #expect(AppGate.gateShown(phase: .checking, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(AppGate.gateShown(phase: .ready, needsWelcome: true, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(!AppGate.gateShown(phase: .ready, needsWelcome: false, keyIsAccounts: true, handingOff: false, needsPerson: false))
        #expect(AppGate.gateShown(phase: .ready, needsWelcome: false, keyIsAccounts: false, handingOff: false, needsPerson: false))
    }
}
