import Foundation
import Testing
@testable import Pane

/// A note's link opened in the app: it joins (once you're signed in), says plainly when it can't,
/// and never spins for longer than its time limit.
@MainActor @Suite(.serialized) struct JoinLinkTests {
    static let link = URL(string: "https://pintonotes.com/s/sEbHaDgYXLDfpSMmrziRgA#gIfSqgKHVsQcWBm2RTA0aw")!

    static func center(ready: Bool = true, answer: String? = nil, delay: Duration = .zero) -> (JoinCenter, Joined) {
        let c = JoinCenter()
        let joined = Joined()
        joined.ready = ready
        c.ready = { joined.ready }
        c.join = { url in
            joined.urls.append(url)
            if delay > .zero { try? await Task.sleep(for: delay) }
            return answer
        }
        return (c, joined)
    }

    @MainActor final class Joined {
        var ready = true
        var urls: [URL] = []
    }

    static func settle(_ c: JoinCenter, while busy: () -> Bool = { false }) async {
        for _ in 0..<100 where busy() || c.phase == .joining || c.pending != nil { try? await Task.sleep(for: .milliseconds(30)) }
    }

    init() { CollabFeature.isOn = true }

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

    @Test func aLinkJoinsAndTheLineGoesAway() async {
        let (c, joined) = Self.center()
        c.open(Self.link)
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link])
        #expect(c.phase == .idle)
    }

    /// Signed out: the link waits, and joins by itself once you're signed in.
    @Test func signedOutTheLinkWaitsForSignIn() async {
        let (c, joined) = Self.center(ready: false)
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(400))
        #expect(joined.urls.isEmpty && c.phase == .idle && c.pending == Self.link)
        joined.ready = true
        await Self.settle(c) { joined.urls.isEmpty }
        #expect(joined.urls == [Self.link] && c.phase == .idle)
    }

    @Test func aLinkThatDoesntOpenSaysWhy() async {
        let (c, _) = Self.center(answer: "This link was turned off or changed. Ask for a new one.")
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed("This link was turned off or changed. Ask for a new one."))
        c.dismissProblem()
        #expect(c.phase == .idle)
    }

    @Test func aJoinThatHangsStopsAndSaysSo() async {
        let (c, _) = Self.center(delay: .seconds(5))
        c.timeout = .milliseconds(150)
        c.open(Self.link)
        await Self.settle(c)
        #expect(c.phase == .failed(JoinCopy.slow))
    }

    /// With sharing off, links do nothing (the release that doesn't have it).
    @Test func offTheLinkIsIgnored() async {
        CollabFeature.isOn = false
        defer { CollabFeature.isOn = true }
        let (c, joined) = Self.center()
        c.open(Self.link)
        try? await Task.sleep(for: .milliseconds(100))
        #expect(joined.urls.isEmpty && c.pending == nil)
    }
}
