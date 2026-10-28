import Foundation
import Testing
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
}
