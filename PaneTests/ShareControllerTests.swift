import Foundation
import Testing
@testable import Pane

/// Share with people, as the buttons drive it (ShareController over a sample backend): Share Link,
/// the link switch, Remove, Leave, and what the sheet says when something fails or takes too long.
@MainActor @Suite(.serialized) struct ShareControllerTests {
    static let me = CollabGallery.emil
    static let sara = CollabGallery.sara

    static func owner(link: ShareState.Access = .off) -> ShareState {
        ShareState(link: link == .off ? nil : URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw"), access: link, people: [
            .init(id: me, name: "Emil Wagman", isMe: true, role: "owner"),
            .init(id: sara, name: "Sara Lind", role: "editor", safetyCode: "4821 0937 5512"),
        ])
    }

    static func member() -> ShareState {
        ShareState(people: [
            .init(id: sara, name: "Sara Lind", isMe: true, role: "editor"),
            .init(id: me, name: "Emil Wagman", role: "owner", safetyCode: "4821 0937 5512"),
        ])
    }

    static func controller(_ state: ShareState) -> (ShareController, SampleShare) {
        let backend = SampleShare(state)
        return (ShareController(note: Note(body: "Team offsite"), backend: backend), backend)
    }

    /// One button: on a note with no link, Share Link makes one people can edit with, and the share
    /// sheet opens by itself with it. Nothing else to press.
    @Test func shareLinkMakesAnEditLinkAndOpensTheShareSheet() async {
        let (share, backend) = Self.controller(ShareState(people: [.init(id: Self.me, name: "Emil Wagman", isMe: true, role: "owner")]))
        #expect(share.state.access == .off && share.state.link == nil)
        await share.shareLink()
        #expect(backend.calls == ["access Can edit"])
        #expect(share.state.access == .edit)
        #expect(share.sharing != nil && share.sharing == share.state.link)
        #expect(share.working == nil && share.state.problem == nil)
    }

    /// With a link on, Share Link hands it over at once: no second link, no server call.
    @Test func shareLinkWithALinkOnSharesThatLink() async {
        let (share, backend) = Self.controller(Self.owner(link: .view))
        await share.shareLink()
        #expect(backend.calls.isEmpty)
        #expect(share.sharing == share.state.link)
    }

    /// People with the link: Can edit, Can view, Off. Off stops the link (nothing to share);
    /// choosing what's already chosen does nothing.
    @Test func theLinkSwitch() async {
        let (share, backend) = Self.controller(Self.owner(link: .edit))
        await share.setAccess(.view)
        #expect(share.state.access == .view && share.state.link != nil)
        await share.setAccess(.view)
        await share.setAccess(.off)
        #expect(share.state.access == .off && share.state.link == nil)
        await share.setAccess(.edit)
        #expect(backend.calls == ["access Can view", "access Off", "access Can edit"])
        #expect(share.state.access == .edit && share.state.link != nil)
    }

    /// Remove asks first; Cancel keeps them. Confirmed, they're gone and the link is a new one.
    @Test func removeAsksThenRemoves() async throws {
        let (share, backend) = Self.controller(Self.owner(link: .edit))
        let sara = try #require(share.state.people.first { $0.id == Self.sara })
        let oldLink = share.state.link
        share.askRemove(sara)
        #expect(share.confirmingRemove == sara)
        share.confirmingRemove = nil
        #expect(backend.calls.isEmpty)
        share.askRemove(sara)
        await share.confirmRemove()
        #expect(backend.calls == ["remove \(Self.sara.uuidString)"])
        #expect(share.state.people.map(\.id) == [Self.me])
        #expect(share.state.link != nil && share.state.link != oldLink)
        #expect(share.confirmingRemove == nil && share.working == nil)
    }

    /// You can't remove yourself, and only the owner removes or changes the link.
    @Test func onlyTheOwnerRemovesOrChangesTheLink() async throws {
        let (owner, _) = Self.controller(Self.owner())
        owner.askRemove(try #require(owner.state.people.first { $0.isMe }))
        #expect(owner.confirmingRemove == nil)
        owner.askLeave()
        #expect(!owner.confirmingLeave)

        let (member, backend) = Self.controller(Self.member())
        #expect(!member.isOwner)
        member.askRemove(try #require(member.state.people.first { !$0.isMe }))
        #expect(member.confirmingRemove == nil)
        await member.setAccess(.edit)
        await member.shareLink()
        #expect(backend.calls.isEmpty && member.sharing == nil)
    }

    /// Leave asks first; confirmed, you're out and the sheet closes.
    @Test func leaveAsksThenLeaves() async {
        let (share, backend) = Self.controller(Self.member())
        share.askLeave()
        #expect(share.confirmingLeave)
        await share.confirmLeave()
        #expect(backend.calls == ["leave"])
        #expect(share.left)
    }

    /// A failure says so on the sheet, in words, and nothing moves on as if it worked.
    @Test func aFailureSaysWhatDidntHappen() async {
        let (share, backend) = Self.controller(Self.member())
        backend.fails = true
        share.askLeave()
        await share.confirmLeave()
        #expect(!share.left)
        #expect(share.state.problem == ShareController.failed(.leave))
        #expect(share.working == nil)
        // The next try clears it.
        backend.fails = false
        share.askLeave()
        await share.confirmLeave()
        #expect(share.left && share.state.problem == nil)
    }

    /// No endless spinner: a step that hangs stops after the time limit and says so.
    @Test func aStepThatHangsStopsAndSaysSo() async {
        let (share, backend) = Self.controller(ShareState(people: [.init(id: Self.me, name: "Emil Wagman", isMe: true, role: "owner")]))
        backend.delay = .seconds(5)
        share.timeout = .milliseconds(150)
        let started = ContinuousClock.now
        await share.shareLink()
        #expect(ContinuousClock.now - started < .seconds(2))
        #expect(share.working == nil)
        #expect(share.state.problem == ShareController.timedOut(.link))
        #expect(share.sharing == nil)
    }

    /// While a step runs, the button that started it says what's happening.
    @Test func theButtonSaysWhatsHappening() async {
        let (share, backend) = Self.controller(Self.owner(link: .edit))
        backend.delay = .milliseconds(300)
        let sara = share.state.people[1]
        share.askRemove(sara)
        let task = Task { await share.confirmRemove() }
        try? await Task.sleep(for: .milliseconds(80))
        #expect(share.working == .remove(Self.sara))
        await task.value
        #expect(share.working == nil)
    }

    /// The words: true whether or not the server keeps a copy of your key. They say who can read
    /// the note and that a member's AI request lets the server read it for that request.
    @Test func theCopyIsPlainAndTrue() {
        let privacy = ShareCopy.privacy.lowercased()
        #expect(privacy.contains("only people in this note can read it"))
        #expect(privacy.contains("their ai reads it only when they ask"))
        for line in [ShareCopy.privacy, ShareCopy.leaveMessage] + ShareState.Access.allCases.map(ShareCopy.link) {
            let l = line.lowercased()
            // Nothing the key copy could make untrue, and no hype.
            #expect(!l.contains("end-to-end") && !l.contains("end to end") && !l.contains("nobody else") && !l.contains("!"), "\(line)")
        }
        #expect(ShareCopy.link(.edit).contains("edit") && ShareCopy.link(.view).contains("read"))
        #expect(ShareCopy.link(.off).contains("new one"))
        // Before the note is shared, the line says what Share Link will do, not that a link is off.
        #expect(ShareCopy.link(ShareState(people: [.init(id: Self.me, name: "Emil Wagman", isMe: true, role: "owner")])) == ShareCopy.notSharedYet)
        #expect(ShareCopy.link(Self.owner(link: .off)) == ShareCopy.link(.off))
        #expect(ShareCopy.removeMessage(Self.owner().people[1]).hasPrefix("Sara can't open this note anymore."))
    }

    #if os(macOS)
    /// The Mac popover: with collaboration, Collaborate comes first, and it opens there for a note
    /// people are in or whose link is on; otherwise as before.
    @Test func thePopoverOpensOnCollaborate() {
        #expect(ShareWays.ways(collaborating: true) == [.people, .link, .copy])
        #expect(ShareWays.ways(collaborating: false) == [.link, .copy])
        #expect(ShareWays.initial(collaborating: true, inNote: 2, linkOn: false, webShared: true, linkAvailable: true) == .people)
        #expect(ShareWays.initial(collaborating: true, inNote: 1, linkOn: true, webShared: false, linkAvailable: true) == .people)
        #expect(ShareWays.initial(collaborating: true, inNote: 1, linkOn: false, webShared: true, linkAvailable: true) == .link)
        #expect(ShareWays.initial(collaborating: true, inNote: 1, linkOn: false, webShared: false, linkAvailable: false) == .people)
        #expect(ShareWays.initial(collaborating: false, inNote: 3, linkOn: true, webShared: false, linkAvailable: true) == .link)
        #expect(ShareWays.Way.link.label(collaborating: true) == "Web Page")
    }
    #endif

    /// Every action says when it's done, for a moment: Removed, Saved, Copied or Sent, Verified.
    @Test func eachActionSaysWhenItsDone() async throws {
        let (share, _) = Self.controller(Self.owner(link: .edit))
        share.doneFor = .milliseconds(200)
        share.askRemove(share.state.people[1])
        await share.confirmRemove()
        #expect(share.done == .removed(Self.sara) && share.done?.text == "Removed")
        await share.setAccess(.view)
        #expect(share.done == .linkChanged)
        share.shareFinished(sent: true, copied: true)
        #expect(share.done?.text == "Copied")
        share.shareFinished(sent: true, copied: false)
        #expect(share.done?.text == "Sent")
        // Closed without sending: nothing claims it was sent.
        share.shareFinished(sent: false, copied: false)
        #expect(share.done?.text == "Sent")
        try await Task.sleep(for: .milliseconds(400))
        #expect(share.done == nil)
    }

    /// "They match" marks the person checked, and says so.
    @Test func theyMatchMarksThemChecked() throws {
        var state = Self.owner()
        state.people[1].keyChanged = "Sara's key changed."
        let (share, backend) = Self.controller(state)
        let sara = share.state.people[1]
        share.verify(sara)
        #expect(backend.calls == ["verified \(Self.sara.uuidString)"])
        #expect(share.state.people[1].verified && share.state.people[1].keyChanged == nil)
        #expect(share.done == .verified(Self.sara))
    }

    /// Someone's key changed, so the server refuses a new key without them: Remove says whose code to check.
    @Test func aChangedKeySaysWhoseCodeToCheck() async {
        var state = Self.owner(link: .edit)
        state.people.append(.init(id: CollabGallery.jonas, name: "Jonas Berg", role: "viewer", safetyCode: "1", keyChanged: "Jonas's key changed."))
        let backend = RefusingShare(state)
        let share = ShareController(note: Note(body: "x"), backend: backend)
        share.askRemove(share.state.people[1])
        await share.confirmRemove()
        #expect(share.state.problem == "Check Jonas's code first.")
        #expect(share.done == nil)
    }

    /// A note's link outlives a relaunch: kept in the vault (the Keychain in the app), never on the server.
    @Test func theLinkIsKeptBetweenLaunches() {
        let store = CollabStore(name: "Emil Wagman")
        let vault = MemoryLinkVault()
        store.linkVault = vault
        let note = Note(body: "Team offsite")
        vault.save(LinkVaultEntry(id: "sEbHaDgYXLDfpSMmrziRgA", secret: Data(repeating: 7, count: 16), access: "Can view"), for: note.id)
        let state = store.shareState(for: note)
        #expect(state.access == .view)
        #expect(state.link?.absoluteString.contains("/s/sEbHaDgYXLDfpSMmrziRgA#") == true)
        // Off isn't kept.
        vault.save(LinkVaultEntry(id: "x", secret: Data(), access: "Off"), for: UUID())
    }
}

/// A backend whose Remove the server refuses because someone's key changed.
@MainActor final class RefusingShare: ShareBackend {
    var state: ShareState
    init(_ state: ShareState) { self.state = state }
    func shareState(for note: Note) -> ShareState { state }
    func setAccess(_ access: ShareState.Access, for note: Note) async throws {}
    func remove(_ user: UUID, from note: Note) async throws { throw Collab.Failure.wrapsIncomplete }
    func leave(_ note: Note) async throws {}
    func markVerified(_ user: UUID, in note: Note) {}
}
