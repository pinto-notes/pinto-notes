#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac, like WhatsApp's: few rows on the first page, every setting found by its
/// words, links landing on their page, and how you sign in said plainly.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    @Test func theFirstPageHasFewGroupsAndFewRows() {
        let all = Set(SettingsPlace.allCases)
        let groups = SettingsPlace.groups(available: all)
        #expect(groups == [[.ai, .security, .storage], [.account, .general], [.help]])
        // The profile card and these: eight or fewer.
        #expect(1 + groups.joined().count <= 8)
        #expect(groups.last == [.help], "Help and feedback is the last single row")
        // Signed out: only what there is.
        #expect(SettingsPlace.groups(available: [.general, .help]) == [[.general], [.help]])
    }

    @Test func linksIntoSettingsLandOnTheirPage() {
        #expect(SettingsPlace(.account) == .profile, "the account row opens Profile")
        #expect(SettingsPlace(.ai) == .ai)
        #expect(SettingsPlace(.storage) == .storage)
        #expect(SettingsPlace(.security) == .security)
    }

    /// Every setting that existed before is in the index, so search finds it, on its page.
    @Test func searchFindsEverySettingByItsWords() {
        let all = Set(SettingsPlace.allCases)
        #expect(SettingsIndex.matches("menu bar", available: all).map(\.place) == [.general])
        #expect(SettingsIndex.matches("recovery", available: all).map(\.place) == [.security])
        #expect(SettingsIndex.matches("export", available: all).map(\.place) == [.account])
        #expect(SettingsIndex.matches("sign out", available: all).map(\.place) == [.profile])
        #expect(SettingsIndex.matches("STORAGE", available: all).allSatisfy { $0.place == .storage })
        #expect(SettingsIndex.matches("", available: all).isEmpty)
        #expect(SettingsIndex.matches("recovery", available: [.general, .help]).isEmpty, "not on a page that isn't there")
        for place in SettingsPlace.allCases {
            #expect(SettingsIndex.all.contains { $0.place == place }, "\(place) has words to find it by")
        }
    }

    @Test func howYouSignInIsSaidPlainly() {
        #expect(SignInShown.label(email: "f7k6w27tsh@privaterelay.appleid.com", apple: true, google: false) == "Apple")
        #expect(SignInShown.label(email: "f7k6w27tsh@privaterelay.appleid.com", apple: false, google: false) == "Apple")
        #expect(SignInShown.label(email: "sara@gmail.com", apple: false, google: true) == "Google")
        #expect(SignInShown.label(email: "sara@example.com", apple: false, google: false) == "sara@example.com")
    }

    @Test func aLinkOpensItsPageEvenWhenItWasTheLastOne() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-route-\(UUID())")!)
        route.open(.security)
        let first = route.opened
        route.open(.security)
        #expect(route.opened == first + 1)
    }

    /// The first page and two inner pages, light and dark, and the alternative look.
    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard let dir = AppSnapshotTests.dir else { return }
        let mode = dark ? "dark" : "light"
        var view = try await AppSnapshotTests.settingsFixture()
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        for (name, start, tiles) in [("home", nil, false), ("home-alt-tiles", nil, true), ("profile", SettingsPlace.profile, false),
                                     ("general", .general, false), ("security", .security, false), ("help", .help, false)] as [(String, SettingsPlace?, Bool)] {
            view.start = start
            view.tiles = tiles
            let host = NSHostingView(rootView: view.tint(Color(PColor.paneAccent)).frame(width: SettingsHome.width, height: 640))
            host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: SettingsHome.width, height: 640), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = host.appearance
            window.contentView = host
            try? await Task.sleep(for: .seconds(1.2))
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-settings2-\(name)-\(mode).png"))
            window.close()
        }
    }
}
#endif
