import Foundation
import Testing
@testable import Pane

/// The places the onboarding emails link to (Pane/Model/AppPlace.swift).
struct AppPlaceTests {
    @Test func parsesTheWebAndAppLinks() {
        let cases: [(String, AppPlace?)] = [
            ("https://ambernotes.app/open/connect-ai", .connectAI),
            ("https://www.ambernotes.app/open/import/", .importNotes),
            ("https://ambernotes.app/open/history", .history),
            // The new name's address, alongside the old one.
            ("https://pintonotes.com/open/history", .history),
            ("https://www.pintonotes.com/open/connect-ai", .connectAI),
            ("pintonotes://connect-ai", .connectAI),
            ("pintonotes://history", .history),
            ("pintonotes://import", .importNotes),
        ]
        for (link, place) in cases { #expect(AppPlace.parse(URL(string: link)!) == place, "\(link)") }
    }

    @Test func leavesEverythingElseAlone() {
        for link in ["https://ambernotes.app/open/template/grocery-list", "https://ambernotes.app/open/connect?request=x",
                     "https://evil.example/open/history", "http://ambernotes.app/open/history", "pintonotes://template/trip-plan",
                     "pintonotes://history/extra", "https://ambernotes.app/history"] {
            #expect(AppPlace.parse(URL(string: link)!) == nil, "\(link)")
        }
    }

    @Test func templateAndCopyLinksStillParseAsBefore() {
        #expect(NoteSourceLink.parse(URL(string: "https://ambernotes.app/open/template/grocery-list")!)?.slug == "grocery-list")
        #expect(NoteSourceLink.parse(URL(string: "https://ambernotes.app/open/connect-ai")!) == nil)
    }

    @Test func historyOpensOnTheNoteAnAIChangedLast() {
        let now = Date()
        let notes: [(id: Int, aiEditedAt: Date?)] = [(1, nil), (2, now.addingTimeInterval(-60)), (3, now), (4, now.addingTimeInterval(-3600))]
        #expect(AppPlace.historyNote(notes) == 3)
        #expect(AppPlace.historyNote([(id: 1, aiEditedAt: nil)]) == nil)
    }

    @Test @MainActor func centerTakesOnlyItsOwnLinks() {
        let center = AppPlaceCenter()
        #expect(center.receive(URL(string: "https://ambernotes.app/open/history")!))
        #expect(center.pending == .history)
        #expect(!center.receive(URL(string: "https://ambernotes.app/open/template/trip-plan")!))
    }
}

/// Settings' pages: the Mac remembers its last tab, links open theirs, and signed out there are
/// only General, Appearance and Account.
@MainActor struct SettingsPageTests {
    func defaults() -> UserDefaults { UserDefaults(suiteName: "SettingsPageTests.\(UUID().uuidString)")! }

    @Test func remembersTheLastTab() {
        let d = defaults()
        #expect(SettingsRoute(defaults: d).tab == .general, "General the first time")
        let route = SettingsRoute(defaults: d)
        route.tab = .storage
        #expect(SettingsRoute(defaults: d).tab == .storage, "the next launch opens where you left it")
    }

    @Test func linksOpenTheirTab() {
        let route = SettingsRoute(defaults: defaults())
        route.open(.ai)
        #expect(route.tab == .ai)
        #expect(route.target == .ai, "the page opens once Settings shows")
        #if os(macOS)
        #expect(route.presenting, "the Mac opens Settings' window (SettingsWindow)")
        #endif
    }

    /// Keyboard shortcuts is on the Mac only: iPhone has no menus to list.
    static let shortcuts: [SettingsPage] = {
        #if os(macOS)
        [.shortcuts]
        #else
        []
        #endif
    }()

    /// In the groups' order (SettingsPage.groups, 7 November 2026), with Today's note and, last,
    /// Experimental (Settings › Experimental, 12 November 2026).
    @Test func signedOutShowsGeneralAndAccount() {
        let view = SettingsView(backend: Backend(), sync: nil, route: SettingsRoute(defaults: defaults()))
        #expect(view.pages == [.account, .general, .appearance] + Self.shortcuts + [.todaysNote, .security, .help, .experimental],
                "Appearance and how security works are there signed out too")
        #expect(!view.pages.contains(.ai) && !view.pages.contains(.storage))
    }

    @Test func signedInShowsAccountAIAndStorage() {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let view = SettingsView(backend: backend, sync: nil, route: SettingsRoute(defaults: defaults()))
        #expect(view.pages == [.account, .general, .appearance] + Self.shortcuts + [.ai, .todaysNote, .security, .storage, .help, .experimental],
                "the Mac's sidebar and iPhone's list, in order")
    }
}
