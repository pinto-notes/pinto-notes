import Foundation
import Testing
@testable import Pane

/// A note's link opened in the app: it joins (once you're signed in), says plainly when it can't,
/// and never spins for longer than its time limit.
@MainActor @Suite(.serialized) struct JoinLinkTests {
    static let link = URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!

    static let teamOffsite = JoinPreview(title: "Team offsite", owner: "Emil Wagman", canEdit: true)

    /// A center over stand-ins: `preview` is what the link leads to (nil: it doesn't open),
    /// `answer` what joining says (nil: it worked).
    static func center(ready: Bool = true, preview: JoinPreview? = teamOffsite, answer: String? = nil, delay: Duration = .zero) -> (JoinCenter, Joined) {
        let c = JoinCenter()
        let joined = Joined()
        joined.ready = ready
        c.ready = { joined.ready }
        c.preview = { _ in
            if delay > .zero { try? await Task.sleep(for: delay) }
            return preview
        }
        c.problem = { "This link was turned off or changed. Ask for a new one." }
        c.join = { url in
            joined.urls.append(url)
            return answer
        }
        return (c, joined)
    }

    static func asked(_ c: JoinCenter) -> JoinPreview? { if case .asking(let p) = c.phase { p } else { nil } }

    @MainActor final class Joined {
        var ready = true
        var urls: [URL] = []
    }

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

    /// A link asks first, naming the note and who shared it, and joins only on Join.
    @Test func aLinkAsksThenJoins() async {
        let (c, joined) = Self.center()
        c.open(Self.link)
        await Self.settle(c)
        #expect(Self.asked(c) == Self.teamOffsite)
        #expect(joined.urls.isEmpty)
        c.accept()
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.phase == .idle)
    }

    /// Not Now: nothing is joined.
    @Test func notNowJoinsNothing() async {
        let (c, joined) = Self.center()
        c.open(Self.link)
        await Self.settle(c)
        c.decline()
        try? await Task.sleep(for: .milliseconds(200))
        #expect(joined.urls.isEmpty && c.phase == .idle)
    }

    /// A note you're already in opens without asking.
    @Test func aNoteYoureInJustOpens() async {
        var p = Self.teamOffsite
        p.alreadyIn = true
        let (c, joined) = Self.center(preview: p)
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.phase == .idle)
    }

    /// The question's words: the title when there is one, else who shared it.
    @Test func theQuestion() {
        #expect(JoinCopy.askTitle(Self.teamOffsite) == "Join \u{201C}Team offsite\u{201D}?")
        #expect(JoinCopy.askMessage(Self.teamOffsite) == "Emil shared it with you. People in it see your name and photo.")
        #expect(JoinCopy.askTitle(JoinPreview(title: nil, owner: "Emil Wagman", canEdit: true)) == "Join the note Emil shared?")
        #expect(JoinCopy.askTitle(JoinPreview(title: nil, owner: nil, canEdit: true)) == "Join this shared note?")
        #expect(JoinCopy.askMessage(JoinPreview(title: nil, owner: nil, canEdit: false)) == "People in it see your name and photo.")
    }

    /// Signed out: the link waits, and asks by itself once you're signed in.
    @Test func signedOutTheLinkWaitsForSignIn() async {
        let (c, joined) = Self.center(ready: false)
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(joined.urls.isEmpty && c.phase == .idle && c.pending == Self.link)
        joined.ready = true
        await Self.settle(c)
        #expect(Self.asked(c) == Self.teamOffsite)
    }

    @Test func aLinkThatDoesntOpenSaysWhy() async {
        let (c, _) = Self.center(preview: nil)
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed("This link was turned off or changed. Ask for a new one."))
        c.dismissProblem()
        #expect(c.phase == .idle)
    }

    @Test func aLinkThatHangsStopsAndSaysSo() async {
        let (c, _) = Self.center(delay: .seconds(5))
        c.timeout = .milliseconds(150)
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed(JoinCopy.slow))
    }

    /// A failed join after Join says why.
    @Test func aFailedJoinSaysWhy() async {
        let (c, _) = Self.center(answer: "This link didn't open. Ask for a new one.")
        c.open(Self.link)
        await Self.settle(c)
        c.accept()
        await Self.settle(c)
        #expect(c.phase == .failed("This link didn't open. Ask for a new one."))
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
}
