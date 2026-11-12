import AppKit
import Foundation
import Testing
@testable import Pane

/// "Pinto Notes is now in the Mac App Store": only the Mac download says it, only once the site
/// says the store version is live, at most twice per Mac, and its buttons do what they say.
@MainActor @Suite(.serialized) struct MacStoreMoveTests {
    let start = Date(timeIntervalSinceReferenceDate: 800_000_000)

    /// One launch, offline: the flag's answer, the person's answer, and what was opened.
    final class Launch {
        var fetched = 0
        var presented = 0
        var opened: [URL] = []
    }

    @discardableResult
    func launch(_ l: Launch, direct: Bool = true, live: Bool = true, otherPrompt: Bool = false,
                defaults: UserDefaults, at now: Date, answer: MacStoreMove.Answer = .notNow) async -> MacStoreMove.Answer? {
        await MacStoreMove.atLaunch(direct: direct, otherPrompt: otherPrompt, defaults: defaults, now: { now },
                                    fetchLive: { l.fetched += 1; return live },
                                    present: { l.presented += 1; return answer },
                                    open: { l.opened.append($0) })
    }

    @Test func appStoreBuildsNeverSayIt() async {
        // The test host is the App Store build of the Mac app: not DIRECT.
        #expect(!MacStoreMove.isDirectBuild)
        let d = TestDefaults(), l = Launch()
        for day in 0..<30 {
            await launch(l, direct: false, defaults: d, at: start.addingTimeInterval(Double(day) * 86_400))
        }
        #expect(l.presented == 0)
        #expect(l.fetched == 0, "an App Store build never even reads the flag")
        #expect(!MacStoreMove.isDue(direct: false, live: true, defaults: d, now: start))
    }

    @Test func onlyOnceTheSiteSaysTheStoreVersionIsLive() async {
        let d = TestDefaults(), l = Launch()
        #expect(await launch(l, live: false, defaults: d, at: start) == nil)
        #expect(l.fetched == 1 && l.presented == 0)
        #expect(d.integer(forKey: MacStoreMove.shownKey) == 0, "not counted as shown")
        #expect(await launch(l, live: true, defaults: d, at: start) == .notNow)
        #expect(l.presented == 1)
    }

    @Test func theFlagFileSaysLiveOnlyWithLiveTrue() {
        #expect(MacStoreMove.live(from: Data(#"{"live": true}"#.utf8)))
        #expect(!MacStoreMove.live(from: Data(#"{"live": false}"#.utf8)))
        #expect(!MacStoreMove.live(from: Data("{}".utf8)))
        #expect(!MacStoreMove.live(from: Data("<html>Not found</html>".utf8)))
        #expect(!MacStoreMove.live(from: Data()))
        #expect(MacStoreMove.flagURL.absoluteString == "https://pintonotes.com/mac-app-store.json")
    }

    @Test func neverOnALaunchWithAnotherPrompt() async {
        let d = TestDefaults(), l = Launch()
        #expect(await launch(l, otherPrompt: true, defaults: d, at: start) == nil)
        #expect(l.presented == 0 && l.fetched == 0)
    }

    @Test func notNowComesBackOnceAWeekLaterThenNever() async {
        let d = TestDefaults(), l = Launch()
        let steps = FunnelSteps()
        await steps.watch {
            #expect(await launch(l, defaults: d, at: start) == .notNow)
            // Not within the week.
            await launch(l, defaults: d, at: start.addingTimeInterval(86_400))
            await launch(l, defaults: d, at: start.addingTimeInterval(MacStoreMove.againAfter - 60))
            #expect(l.presented == 1)
            // A week later, once more.
            #expect(await launch(l, defaults: d, at: start.addingTimeInterval(MacStoreMove.againAfter)) == .notNow)
            #expect(l.presented == 2)
            // Then never again.
            for week in 2..<12 {
                await launch(l, defaults: d, at: start.addingTimeInterval(Double(week) * MacStoreMove.againAfter + 1))
            }
        }
        #expect(l.presented == 2, "at most twice per Mac")
        #expect(l.opened.isEmpty, "Not Now opens nothing")
        #expect(steps.count(.macAppStoreStep(.shown)) == 2)
        #expect(steps.count(.macAppStoreStep(.notNow)) == 2)
        #expect(steps.count(.macAppStoreStep(.openStore)) == 0)
    }

    @Test func openTheAppStoreOpensTheAppsPageAndEndsIt() async {
        let d = TestDefaults(), l = Launch()
        let steps = FunnelSteps()
        await steps.watch {
            #expect(await launch(l, defaults: d, at: start, answer: .openStore) == .openStore)
            for week in 1..<6 {
                await launch(l, defaults: d, at: start.addingTimeInterval(Double(week) * MacStoreMove.againAfter + 1))
            }
        }
        #expect(l.presented == 1)
        #expect(l.opened == [URL(string: "macappstore://apps.apple.com/app/id6817253103")!])
        #expect(steps.count(.macAppStoreStep(.shown)) == 1)
        #expect(steps.count(.macAppStoreStep(.openStore)) == 1)
    }

    @Test func openTheAppStoreAfterOneNotNowAlsoEndsIt() async {
        let d = TestDefaults(), l = Launch()
        await launch(l, defaults: d, at: start)
        await launch(l, defaults: d, at: start.addingTimeInterval(MacStoreMove.againAfter), answer: .openStore)
        await launch(l, defaults: d, at: start.addingTimeInterval(3 * MacStoreMove.againAfter))
        #expect(l.presented == 2 && l.opened.count == 1)
    }

    @Test func theAlertSaysItPlainlyWithItsTwoButtons() {
        // Built, never shown.
        let alert = MacStoreMove.makeAlert()
        #expect(alert.messageText == "Pinto Notes is now in the Mac App Store")
        #expect(alert.informativeText == "Updates come from the App Store from now on. Your notes stay in your account: delete this copy, get Pinto Notes from the App Store, and sign in.")
        #expect(alert.buttons.map(\.title) == ["Open the App Store", "Not Now"])
        #expect(!alert.informativeText.contains("\u{2014}") && !alert.messageText.contains("\u{2014}"), "no em dashes")
        // The first button (the default, Return) opens the store; the second (and Escape) is Not Now.
        #expect(alert.buttons.first?.keyEquivalent == "\r")
        #expect(alert.buttons.last?.keyEquivalent == "\u{1b}")
        #expect(MacStoreMove.answer(for: .alertFirstButtonReturn) == .openStore)
        #expect(MacStoreMove.answer(for: .alertSecondButtonReturn) == .notNow)
        #expect(MacStoreMove.answer(for: .abort) == .notNow)
    }

    @Test func itsTelemetryCarriesOnlyItsStep() {
        #expect(TelemetryEvent.macAppStoreStep(.shown).properties.count == 1)
        #expect(MacStoreStep.allCases.map(\.rawValue) == ["shown", "open_store", "not_now"])
    }
}
