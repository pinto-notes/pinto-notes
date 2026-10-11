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

    static func store(_ service: FakeService) -> HeardFromStore {
        let defaults = UserDefaults(suiteName: "heardFrom.\(UUID())")!
        // The third launch: the first one that may ask.
        return store(service, defaults: defaults, account: UUID(), launchesBefore: HeardFromStore.firstLaunch - 1)
    }

    /// A store as the app makes one at launch, after `launchesBefore` earlier runs for this account.
    static func store(_ service: FakeService, defaults: UserDefaults, account: UUID, launchesBefore: Int) -> HeardFromStore {
        for _ in 0..<launchesBefore {
            HeardFromStore(defaults: defaults, arguments: []).attach(account: account, service: service)
        }
        let s = HeardFromStore(defaults: defaults, arguments: [])
        s.attach(account: account, service: service)
        return s
    }

    @Test func itWaitsForTheThirdLaunchANoteAndAQuietLaunch() async {
        let defaults = UserDefaults(suiteName: "heardFrom.\(UUID())")!
        let account = UUID(), service = FakeService()
        // Right after sign-up, and on the second launch: nothing, even with a note.
        let first = Self.store(service, defaults: defaults, account: account, launchesBefore: 0)
        await first.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(!first.visible)
        // Setting the session up again in the same run is not another launch.
        first.attach(account: account, service: service)
        #expect(first.launches == 1)
        let second = Self.store(service, defaults: defaults, account: account, launchesBefore: 0)
        await second.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(!second.visible)
        // Third launch: not without a note, not beside an account notice, then yes.
        let third = Self.store(service, defaults: defaults, account: account, launchesBefore: 0)
        #expect(third.launches == 3)
        await third.refresh(hasNote: false, noticeThisLaunch: false)
        #expect(!third.visible)
        await third.refresh(hasNote: true, noticeThisLaunch: true)
        #expect(!third.visible)
        await third.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(third.visible)
    }

    @Test func itShowsOnlyWhenTheServerSaysToAsk() async {
        let quiet = FakeService()
        quiet.ask = false
        let a = Self.store(quiet)
        await a.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(!a.visible)

        let b = Self.store(FakeService())
        await b.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(b.visible)
    }

    @Test func oneTapAnswersAndIsSent() async {
        let service = FakeService()
        let s = Self.store(service)
        await s.refresh(hasNote: true, noticeThisLaunch: false)
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
        await a.refresh(hasNote: true, noticeThisLaunch: false); await b.refresh(hasNote: true, noticeThisLaunch: false)
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
        await s.refresh(hasNote: true, noticeThisLaunch: false)
        #expect(service.answers.map(\.0) == [.friend])
        #expect(!s.visible, "answered here: not asked again while the server catches up")
        await s.refresh(hasNote: true, noticeThisLaunch: false)
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
