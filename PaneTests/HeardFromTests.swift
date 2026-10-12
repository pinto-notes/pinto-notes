import Foundation
import Testing
@testable import Pane

/// "How did you hear about Amber Notes?": asked once when the server says, one tap answers or
/// skips, and an answer given offline still reaches the server.
@MainActor
@Suite struct HeardFromTests {
    final class FakeService: HeardFromService, @unchecked Sendable {
        var ask = true
        var reachable = true
        var answers: [(HeardFrom.Source, String?)] = []
        func shouldAsk() async throws -> Bool {
            guard reachable else { throw URLError(.notConnectedToInternet) }
            return ask
        }
        func answer(_ source: HeardFrom.Source, detail: String?) async throws {
            guard reachable else { throw URLError(.notConnectedToInternet) }
            answers.append((source, detail))
        }
    }

    static func store(_ service: FakeService, defaults: UserDefaults = TestDefaults(), version: String = "1.2.9") -> HeardFromStore {
        let s = HeardFromStore(defaults: defaults, arguments: [], version: version)
        s.attach(account: UUID(), service: service)
        return s
    }

    @Test func notOnTheFirstDayOfUse() async {
        let s = Self.store(FakeService())
        await s.refresh(daysOfUse: 1, hasNote: true, otherPrompt: false)
        #expect(!s.visible, "the day the account was made")
        await s.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        #expect(s.visible, "the second different day with notes opened")
    }

    @Test func notWithoutANoteOfTheirOwn() async {
        let s = Self.store(FakeService())
        await s.refresh(daysOfUse: 5, hasNote: false, otherPrompt: false)
        #expect(!s.visible)
    }

    /// What the owner saw (2026-10-12): it waited for the third launch, and each update is a
    /// launch, so it came right after an update.
    @Test func neverOnTheFirstLaunchAfterAnUpdate() async {
        let d = TestDefaults()
        _ = Self.store(FakeService(), defaults: d, version: "1.2.8")
        let afterUpdate = Self.store(FakeService(), defaults: d, version: "1.2.9")
        #expect(afterUpdate.updatedThisLaunch)
        await afterUpdate.refresh(daysOfUse: 9, hasNote: true, otherPrompt: false)
        #expect(!afterUpdate.visible)
        let next = Self.store(FakeService(), defaults: d, version: "1.2.9")
        #expect(!next.updatedThisLaunch)
        await next.refresh(daysOfUse: 9, hasNote: true, otherPrompt: false)
        #expect(next.visible, "the launch after that may")
        // A fresh install is not an update.
        #expect(!Self.store(FakeService(), defaults: TestDefaults()).updatedThisLaunch)
    }

    @Test func neverBesideAnotherPrompt() async {
        let s = Self.store(FakeService())
        await s.refresh(daysOfUse: 9, hasNote: true, otherPrompt: true)
        #expect(!s.visible)
    }

    @Test func launchesNoLongerCount() async {
        // However many launches, one day of use is not enough.
        let d = TestDefaults()
        for _ in 0..<10 { _ = Self.store(FakeService(), defaults: d) }
        let s = Self.store(FakeService(), defaults: d)
        await s.refresh(daysOfUse: 1, hasNote: true, otherPrompt: false)
        #expect(!s.visible)
    }

    @Test func itShowsOnlyWhenTheServerSaysToAsk() async {
        let quiet = FakeService()
        quiet.ask = false
        let a = Self.store(quiet)
        await a.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        #expect(!a.visible)

        let b = Self.store(FakeService())
        await b.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        #expect(b.visible)
    }

    @Test func oneTapAnswersAndIsSent() async {
        let service = FakeService()
        let s = Self.store(service)
        await s.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        s.answer(.tiktok)
        #expect(s.chosen == .tiktok)
        await s.sending?.value
        #expect(service.answers.map(\.0) == [.tiktok])
        #expect(service.answers.first?.1 == nil)
        // A second tap while the tick shows changes nothing.
        s.answer(.google)
        await s.sending?.value
        #expect(service.answers.count == 1)
    }

    @Test func skipAndSwipingAwayBothCountAsSkipped() async {
        let one = FakeService(), two = FakeService()
        let a = Self.store(one), b = Self.store(two)
        await a.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false); await b.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        a.skip()
        b.closed()
        await a.sending?.value
        await b.sending?.value
        #expect(!a.visible && !b.visible)
        #expect(one.answers.map(\.0) == [.skipped])
        #expect(two.answers.map(\.0) == [.skipped])
    }

    @Test func somethingElseKeepsTrimmedWordsOnlyForOther() async {
        let service = FakeService()
        let s = Self.store(service)
        s.answer(.other, detail: "  a newsletter \n")
        await s.sending?.value
        #expect(service.answers.first?.1 == "a newsletter")

        let other = FakeService()
        let t = Self.store(other)
        t.answer(.other, detail: "   ")
        await t.sending?.value
        #expect(other.answers.first?.1 == nil, "an empty field is just Something else")
    }

    @Test func anOfflineAnswerIsSentLaterAndNeverAskedAgain() async {
        let service = FakeService()
        service.reachable = false
        let s = Self.store(service)
        s.answer(.friend)
        await s.sending?.value
        #expect(service.answers.isEmpty)
        s.visible = false

        service.reachable = true
        await s.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        #expect(service.answers.map(\.0) == [.friend])
        #expect(!s.visible, "answered here: not asked again while the server catches up")
        await s.refresh(daysOfUse: 2, hasNote: true, otherPrompt: false)
        #expect(service.answers.count == 1, "sent once")
    }

    @Test func everyChoiceHasPlainWordsAndTheServersName() {
        #expect(HeardFrom.choices.count == 10)
        #expect(!HeardFrom.choices.contains(.skipped))
        let names = HeardFrom.Source.allCases.map(\.rawValue)
        #expect(names == ["google", "blog", "ai_assistant", "tiktok", "youtube", "instagram", "friend", "product_hunt_hn", "github", "other", "skipped"])
        for source in HeardFrom.choices { #expect(!HeardFrom.title(source).isEmpty) }
    }
}
