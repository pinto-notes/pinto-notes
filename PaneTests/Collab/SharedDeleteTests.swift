import Foundation
import Testing
@testable import Pane

/// Deleting a shared note asks first and says what happens, as Notes does; other notes go
/// straight to Recently Deleted.
@MainActor @Suite struct SharedDeleteTests {
    static func note(_ title: String, shared: UUID?) -> Note {
        let n = Note(body: "\(title)\n")
        n.sharedNoteID = shared
        return n
    }

    @Test func yoursStopsBeingSharedAndSaysForWhom() throws {
        let n = Self.note("Team offsite", shared: nil)
        n.sharedNoteID = n.id
        let two = try #require(SharedDelete.ask([n]) { _ in ["Sara", "Jonas"] })
        #expect(two.title == "Delete \u{201C}Team offsite\u{201D} for everyone?" && two.button == "Delete")
        #expect(two.message == "Sara and Jonas lose it too. It stays in your Recently Deleted for 30 days, no longer shared.")
        #expect(SharedDelete.ask([n]) { _ in ["Sara"] }?.message.hasPrefix("Sara loses it too.") == true)
        #expect(SharedDelete.ask([n]) { _ in ["Sara", "Jonas", "Emma", "Li", "Ana"] }?.message
                == "Sara, Jonas and 3 others lose it too. It stays in your Recently Deleted for 30 days, no longer shared.")
        // Nobody known here yet (its document isn't open).
        #expect(SharedDelete.ask([n]) { _ in [] }?.message.hasPrefix("Everyone in it loses it too.") == true)
    }

    @Test func oneSharedWithYouIsLeft() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Team offsite", shared: UUID())]) { _ in ["Emil"] })
        #expect(ask.title == "Delete \u{201C}Team offsite\u{201D}?" && ask.button == "Delete")
        #expect(ask.message == "You\u{2019}ll leave it. It stays for the others.")
    }

    @Test func ordinaryNotesDontAsk() {
        #expect(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Also mine", shared: nil)]) == nil)
        // In Recently Deleted already: "Delete forever?" asks instead.
        let trashed = Self.note("Gone", shared: UUID())
        trashed.trashedAt = .now
        #expect(SharedDelete.ask([trashed]) == nil)
    }

    @Test func severalWithASharedOneAskOnce() throws {
        let ask = try #require(SharedDelete.ask([Self.note("Mine", shared: nil), Self.note("Theirs", shared: UUID())]) { _ in [] })
        #expect(ask.title == "Delete 2 notes?" && ask.message.hasPrefix("Some are shared."))
    }
}

#if os(macOS)
import AppKit
import SwiftUI

/// On the Mac, Return or Esc in the owner's "Delete for everyone?" cancels; only a click on Delete
/// deletes. The real question view in an offscreen window, with the keys sent to that window the
/// way it routes them (SwiftUI's shortcuts first). Nothing is posted system-wide.
@MainActor @Suite(.serialized) struct SharedDeleteKeysTests {
    static var ask: SharedDelete.Ask {
        SharedDelete.Ask(title: "Delete \u{201C}Team offsite\u{201D} for everyone?",
                         message: "Sara and Jonas lose it too. It stays in your Recently Deleted for 30 days, no longer shared.", button: "Delete")
    }

    @MainActor final class Answers { var cancelled = 0, deleted = 0 }

    static func shown(_ answers: Answers) async -> (KeyableWindow, NSHostingView<SharedDeleteQuestion>) {
        let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 360, height: 200), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let host = NSHostingView(rootView: SharedDeleteQuestion(ask: Self.ask, cancel: { answers.cancelled += 1 }, delete: { answers.deleted += 1 }))
        w.contentView = host
        w.makeKey()
        host.layoutSubtreeIfNeeded()
        try? await Task.sleep(for: .milliseconds(300))
        return (w, host)
    }

    static func press(_ chars: String, _ code: UInt16, in w: NSWindow) async {
        let e = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                 windowNumber: w.windowNumber, context: nil, characters: chars, charactersIgnoringModifiers: chars,
                                 isARepeat: false, keyCode: code)!
        w.sendEvent(e)
        try? await Task.sleep(for: .milliseconds(200))
    }

    @Test func returnCancels() async {
        let a = Answers()
        let (w, _) = await Self.shown(a)
        defer { w.close() }
        await Self.press("\r", 36, in: w)
        #expect(a.cancelled == 1 && a.deleted == 0)
    }

    @Test func escCancels() async {
        let a = Answers()
        let (w, _) = await Self.shown(a)
        defer { w.close() }
        await Self.press("\u{1b}", 53, in: w)
        #expect(a.cancelled == 1 && a.deleted == 0)
    }


    /// The same in Share's own questions on the Mac: Return or Esc on "Remove Sara?" and
    /// "Leave …?" cancels, and nothing is removed or left.
    @Test(arguments: [("\r", UInt16(36)), ("\u{1b}", UInt16(53))])
    func returnAndEscCancelRemoveAndLeave(_ key: (String, UInt16)) async throws {
        for leaving in [false, true] {
            let state = leaving ? ShareControllerTests.member() : ShareControllerTests.owner(link: .edit)
            let backend = SampleShare(state)
            let share = ShareController(note: Note(body: "Team offsite"), backend: backend)
            if leaving { share.askLeave() } else { share.askRemove(state.people[1]) }
            let w = KeyableWindow(contentRect: NSRect(x: -30000, y: -30000, width: 320, height: 300), styleMask: [.borderless], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            w.contentView = NSHostingView(rootView: CollaborateRows(share: share))
            w.makeKey()
            try? await Task.sleep(for: .milliseconds(300))
            await Self.press(key.0, key.1, in: w)
            #expect(backend.calls.isEmpty, "leaving \(leaving), key \(key.1)")
            #expect(share.confirmingRemove == nil && !share.confirmingLeave, "leaving \(leaving), key \(key.1)")
            w.close()
        }
    }
}
#endif
