import Foundation
import SwiftUI
import Testing
@testable import Pane

/// A note's link opened in the app: the site's link (a universal link, tapped) joins straight away,
/// once you're signed in; one by the app's own scheme, which any web page can send, asks first.
/// Either way it then says you joined and who sees you, with Leave. It says plainly when a link
/// can't open, and never spins for longer than its time limit.
@MainActor @Suite(.serialized) struct JoinLinkTests {
    static let link = URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!
    /// The same link by the app's own scheme, as the link's web page sends it.
    static let schemeLink = URL(string: "\(AppIdentity.scheme)://s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!
    static let teamOffsite = JoinPreview(title: "Team offsite", owner: "Emil Wagman", canEdit: true)
    static let note = UUID()
    static let joinedEmils = JoinOutcome.joined(note: note, owner: "Emil Wagman")
    static let joinedLine = "You joined Emil's note. People in it see your name and photo."

    /// A center over stand-ins: `outcome` is what joining does, `left` what leaving says (nil: it worked).
    static func center(ready: Bool = true, outcome: JoinOutcome = joinedEmils, preview: Result<JoinPreview, JoinFailure> = .success(teamOffsite),
                       left: String? = nil, delay: Duration = .zero) -> (JoinCenter, Joined) {
        let c = JoinCenter()
        let joined = Joined()
        joined.ready = ready
        c.ready = { joined.ready }
        c.preview = { url in
            joined.previewed.append(url)
            return preview
        }
        c.join = { url in
            if delay > .zero { try? await Task.sleep(for: delay) }
            joined.urls.append(url)
            return outcome
        }
        c.leave = { id in
            joined.left.append(id)
            return left
        }
        return (c, joined)
    }

    @MainActor final class Joined {
        var ready = true
        var urls: [URL] = []
        var left: [UUID] = []
        var previewed: [URL] = []
    }

    static func asked(_ c: JoinCenter) -> JoinPreview? { if case .asking(let p) = c.phase { p } else { nil } }

    static func settle(_ c: JoinCenter, while busy: () -> Bool = { false }) async {
        for _ in 0..<100 where busy() || c.phase == .joining || c.pending != nil { try? await Task.sleep(for: .milliseconds(30)) }
    }

    init() { CollabFeature.forced = true }

    /// The link's forms: the site's, and the app's own scheme from the link's web page. Other links aren't joined.
    @Test func whatCountsAsANoteLink() {
        #expect(JoinCenter.isNoteLink(Self.link))
        #expect(JoinCenter.isNoteLink(URL(string: "\(AppIdentity.scheme)://s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!))
        // No secret, a short id, a public page, a template.
        #expect(!JoinCenter.isNoteLink(URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA")!))
        #expect(!JoinCenter.isNoteLink(URL(string: "https://pintonotes.com/s/abc#gIfSqgKHVsQcWBm2RTA0aw")!))
        #expect(!JoinCenter.isNoteLink(URL(string: "https://pintonotes.com/n/k3v9-dinner-guide-and-more-words")!))
        #expect(!JoinCenter.isNoteLink(URL(string: "https://pintonotes.com/open/template/habit-tracker")!))
    }

    /// Opening a link joins at once, with no question (Emil, 16 November 2026), and then says so,
    /// naming who shared it and who sees you, with Leave.
    @Test func aLinkJoinsRightAwayAndSaysSo() async {
        let (c, joined) = Self.center()
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.phase == .idle)
        let n = c.notice
        #expect(n?.kind == .joined && n?.text == Self.joinedLine && n?.note == Self.note && n?.canLeave == true)
        #expect(joined.previewed.isEmpty, "no question, so nothing to read first")
    }

    /// Which links ask: the app's own scheme, which a web page can send without a tap. The site's
    /// link, which opens the app only when tapped, doesn't.
    @Test func onlyTheAppsOwnSchemeAsks() {
        #expect(JoinCenter.asksFirst(Self.schemeLink))
        #expect(JoinCenter.asksFirst(URL(string: "\(AppIdentity.scheme.uppercased())://s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!))
        #expect(!JoinCenter.asksFirst(Self.link))
        #expect(!JoinCenter.asksFirst(URL(string: "http://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!))
    }

    /// A link by the app's own scheme asks first, naming the note and who shared it, and joins only
    /// on Join; then the same line with Leave.
    @Test func aSchemeLinkAsksThenJoins() async {
        let (c, joined) = Self.center()
        c.open(Self.schemeLink)
        await Self.settle(c)
        #expect(Self.asked(c) == Self.teamOffsite && joined.urls.isEmpty && c.notice == nil)
        c.accept()
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.schemeLink] && c.phase == .idle)
        #expect(c.notice?.kind == .joined && c.notice?.text == Self.joinedLine)
    }

    /// Not Now: nothing is joined, and nothing says it was.
    @Test func notNowJoinsNothing() async {
        let (c, joined) = Self.center()
        c.open(Self.schemeLink)
        await Self.settle(c)
        c.decline()
        try? await Task.sleep(for: .milliseconds(200))
        #expect(joined.urls.isEmpty && c.phase == .idle && c.notice == nil)
    }

    /// A scheme link to a note you're already in opens without asking.
    @Test func aSchemeLinkToANoteYoureInJustOpens() async {
        var p = Self.teamOffsite
        p.alreadyIn = true
        let (c, joined) = Self.center(outcome: .opened, preview: .success(p))
        c.open(Self.schemeLink)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.schemeLink] && c.phase == .idle && c.notice == nil)
    }

    /// A scheme link that doesn't open says why, with nothing to answer.
    @Test func aSchemeLinkThatDoesntOpenSaysWhy() async {
        let (c, joined) = Self.center(preview: .failure(JoinFailure("This link was turned off or changed. Ask for a new one.")))
        c.open(Self.schemeLink)
        await Self.settle(c)
        #expect(c.phase == .failed("This link was turned off or changed. Ask for a new one.") && joined.urls.isEmpty)
    }

    /// The question's words, as before: the title when there is one, else who shared it.
    @Test func theQuestion() {
        #expect(JoinCopy.askTitle(Self.teamOffsite) == "Join \u{201C}Team offsite\u{201D}?")
        #expect(JoinCopy.askMessage(Self.teamOffsite) == "Emil shared it with you. People in it see your name and photo.")
        #expect(JoinCopy.askTitle(JoinPreview(title: nil, owner: "Emil Wagman", canEdit: true)) == "Join the note Emil shared?")
        #expect(JoinCopy.askTitle(JoinPreview(title: nil, owner: nil, canEdit: true)) == "Join this shared note?")
        #expect(JoinCopy.askMessage(JoinPreview(title: nil, owner: nil, canEdit: false)) == "People in it see your name and photo.")
    }

    /// The same link from two of the app's handlers at once joins once.
    @Test func theSameLinkTwiceJoinsOnce() async {
        let (c, joined) = Self.center(delay: .milliseconds(200))
        c.open(Self.link)
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(50))
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link])
    }

    /// Every way a link reaches the app goes through ConnectCenter.receive (on the Mac it takes the
    /// URL event itself, so onOpenURL never sees it): both forms of a note's link go to joining, as
    /// they came, and nothing else does.
    @Test func everyNoteLinkGoesToJoining() {
        let center = ConnectCenter()
        var joining: [URL] = []
        center.joinLink = { joining.append($0) }
        #if os(macOS)
        center.activate = {}
        #endif
        center.receive(Self.link)
        center.receive(Self.schemeLink)
        center.receive(URL(string: "https://pintonotes.com/s/abc#gIfSqgKHVsQcWBm2RTA0aw")!)
        #expect(joining == [Self.link, Self.schemeLink])
    }

    /// Leave on that line leaves the note it joined, and then says you left (no Leave on that).
    @Test func leaveLeavesTheNote() async {
        let (c, joined) = Self.center()
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        await c.leaveJoined()
        #expect(joined.left == [Self.note])
        #expect(c.notice?.kind == .left && c.notice?.text == "You left the note." && c.notice?.canLeave == false)
        // Pressed again (a second tap as it changes): nothing more is left.
        await c.leaveJoined()
        #expect(joined.left == [Self.note])
    }

    /// Leaving that fails says why, and Leave stays to try again.
    @Test func aFailedLeaveSaysWhyAndKeepsLeave() async {
        let why = ShareController.failed(.leave)
        let (c, joined) = Self.center(left: why)
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        await c.leaveJoined()
        #expect(c.notice?.kind == .failed && c.notice?.text == why && c.notice?.canLeave == true)
        await c.leaveJoined()
        #expect(joined.left == [Self.note, Self.note])
    }

    /// The line goes by itself after a few seconds.
    @Test func theLineGoesByItself() async {
        let (c, joined) = Self.center()
        c.noticeFor = .milliseconds(150)
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(c.notice != nil)
        for _ in 0..<40 where c.notice != nil { try? await Task.sleep(for: .milliseconds(30)) }
        #expect(c.notice == nil)
        #expect(JoinCenter().noticeFor == .seconds(6), "a few seconds in the app")
    }

    /// A note you're already in just opens: no line, nothing to leave.
    @Test func aNoteYoureInJustOpens() async {
        let (c, joined) = Self.center(outcome: .opened)
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.phase == .idle && c.notice == nil)
    }

    /// The line's words: who shared it when the link says, else "the note".
    @Test func theLinesWords() {
        #expect(JoinCopy.joined(owner: "Emil Wagman") == Self.joinedLine)
        #expect(JoinCopy.joined(owner: nil) == "You joined the note. People in it see your name and photo.")
        #expect(!JoinCopy.joined(owner: "Emil").contains("\u{2014}"), "no em dashes")
    }

    /// Signed out: the link waits, and joins by itself once you're signed in (a scheme link asks then).
    @Test func signedOutTheLinkWaitsForSignIn() async {
        let (c, joined) = Self.center(ready: false)
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(joined.urls.isEmpty && c.phase == .idle && c.pending == Self.link)
        joined.ready = true
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.notice?.kind == .joined)

        let (s, waited) = Self.center(ready: false)
        s.open(Self.schemeLink)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(s.pending == Self.schemeLink && s.phase == .idle)
        waited.ready = true
        await Self.settle(s)
        #expect(Self.asked(s) == Self.teamOffsite && waited.urls.isEmpty)
    }

    @Test func aLinkThatDoesntOpenSaysWhy() async {
        let (c, _) = Self.center(outcome: .failed("This link was turned off or changed. Ask for a new one."))
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed("This link was turned off or changed. Ask for a new one.") && c.notice == nil)
        c.dismissProblem()
        #expect(c.phase == .idle)
    }

    @Test func aLinkThatHangsStopsAndSaysSo() async {
        let (c, _) = Self.center(delay: .seconds(5))
        c.timeout = .milliseconds(150)
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed(JoinCopy.slow) && c.notice == nil)
    }

    /// With sharing off, links do nothing (the release that doesn't have it).
    @Test func offTheLinkIsIgnored() async {
        CollabFeature.forced = false
        defer { CollabFeature.forced = true }
        let (c, joined) = Self.center()
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(100))
        #expect(joined.urls.isEmpty && c.pending == nil)
    }

    /// Through JoinCenter, with the live store's retry: joining after a dropped request still
    /// joins, within the one time limit.
    @Test func aDroppedRequestIsTriedAgainWithinTheTimeLimit() async {
        let (c, joined) = Self.center()
        var joinTries = 0
        c.join = { url in
            do {
                try await CollabStore.retryingOnce {
                    joinTries += 1
                    if joinTries == 1 { throw URLError(.timedOut) }
                }
                joined.urls.append(url)
                return Self.joinedEmils
            } catch { return .failed("no") }
        }
        c.timeout = .seconds(2)
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && joinTries == 2 && c.phase == .idle && c.notice?.kind == .joined)
    }

    #if os(macOS)
    /// On screen (offscreen here): the line shows at the foot with its words and a Leave button,
    /// and pressing Leave leaves the note.
    @Test func theLineShowsWithLeaveAndLeaveLeaves() async throws {
        let (c, joined) = Self.center()
        let ax = OffscreenAX(Color.white.modifier(JoinLinkHandler(center: c)), size: CGSize(width: 900, height: 600))
        defer { ax.close() }
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        let line = try #require(await ax.waiting(for: "collab.joined"), "the line after joining")
        #expect(ax.texts().contains { $0.contains(Self.joinedLine) }, "\(ax.texts())")
        let leave = try #require(await ax.waiting(for: "collab.joined.leave"), "Leave on the line")
        #expect(leave.text.contains("Leave") && leave.role == "AXButton")
        // At the foot of the window (accessibility frames run from the top: a bigger y is lower).
        let top = (NSScreen.screens.first?.frame.height ?? 0) - ax.window.frame.maxY
        #expect(line.frame.height > 0 && line.frame.midY > top + ax.window.frame.height / 2, "\(line.frame), window top \(top)")
        #expect(leave.press())
        for _ in 0..<40 where joined.left.isEmpty { try? await Task.sleep(for: .milliseconds(30)) }
        #expect(joined.left == [Self.note])
        for _ in 0..<20 where !ax.texts().contains(where: { $0.contains("You left the note.") }) { await ax.settle() }
        #expect(ax.texts().contains { $0.contains("You left the note.") }, "\(ax.texts())")
    }
    #endif
}
