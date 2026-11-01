#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac, a card with its pages in a sidebar: few pages in a few groups, every
/// setting found by its words, links landing on their page, and how you sign in said plainly.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    @Test func theSidebarHasFewGroupsWithAppearanceUnderGeneral() {
        let all = Set(SettingsPlace.allCases)
        let groups = SettingsPlace.groups(available: all)
        #expect(groups == [[.ai, .general, .appearance], [.security, .storage, .account], [.help]])
        #expect(!groups.joined().contains(.profile) && !groups.joined().contains(.appKeys), "Profile sits above the groups, Keys for apps under General")
        #expect(groups.last == [.help], "Help and feedback is the last single row")
        // Signed out: only what there is.
        #expect(SettingsPlace.groups(available: [.general, .appearance, .help]) == [[.general, .appearance], [.help]])
        #expect(SettingsCard.first(all) == .ai, "Settings opens at Connect an AI")
        #expect(SettingsCard.first([.general, .appearance, .help]) == .general, "or at General, signed out")
    }

    /// iPhone's Settings rows come in the Mac sidebar's groups and order, less Account and Help
    /// (they sit under you on iPhone), and the iPhone list draws from them.
    @Test func iPhoneGroupsMatchTheMac() throws {
        let mac = SettingsPlace.groups(available: Set(SettingsPlace.allCases))
            .map { $0.filter { $0 != .account && $0 != .help } }.filter { !$0.isEmpty }
        #expect(SettingsTab.phoneGroups.map { $0.map(SettingsPlace.init) } == mac)
        #expect(Set(SettingsTab.phoneGroups.joined()) == Set(SettingsTab.allCases).subtracting([.account]), "every page but Account (your row) has a row")
        let source = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appending(path: "Pane/Views/SettingsView.swift"), encoding: .utf8)
        #expect(source.contains("ForEach(Array(SettingsTab.phoneGroups.enumerated())"), "the iPhone list is built from phoneGroups")
    }

    @Test func linksIntoSettingsLandOnTheirPage() {
        #expect(SettingsPlace(.account) == .profile, "the account row opens Profile")
        #expect(SettingsPlace(.ai) == .ai)
        #expect(SettingsPlace(.storage) == .storage)
        #expect(SettingsPlace(.security) == .security)
        #expect(SettingsPlace(.general) == .general)
        #expect(SettingsPlace(.appearance) == .appearance)
    }

    /// Appearance by any of the words people use for it.
    @Test func searchFindsAppearance() {
        let all = Set(SettingsPlace.allCases)
        for word in ["appearance", "theme", "dark", "light", "dark mode", "colour", "color", "accent", "Theme", "DARK MODE"] {
            let found = SettingsIndex.matches(word, available: all).map(\.place)
            #expect(found.contains(.appearance), "\(word) finds Appearance")
            #expect(Set(found) == [.appearance], "\(word) finds only Appearance: \(found)")
        }
        #expect(SettingsIndex.matches("theme", available: [.general, .help]).isEmpty, "not when the page isn't there")
        #expect(!SettingsIndex.all.contains { $0.place == .general && ["Theme", "Accent colour", "Light or dark mode"].contains($0.label) },
                "nothing of Appearance is on General any more")
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

    @Test func theCardIsNeverBiggerThanItsWindow() {
        #expect(SettingsCard.size == TemplateLibraryView.size, "the same card as Templates")
        #expect(SettingsCard.fitted(CGSize(width: 1600, height: 1000)) == SettingsCard.size)
        #expect(SettingsCard.fitted(CGSize(width: 900, height: 600)) == CGSize(width: 852, height: 552))
        #expect(SettingsCard.fitted(CGSize(width: 300, height: 200)) == CGSize(width: 600, height: 420), "never so small the page can't be used")
    }

    @Test func aLinkOpensItsPageEvenWhenItWasTheLastOne() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-route-\(UUID())")!)
        route.open(.security)
        let first = route.opened
        route.open(.security)
        #expect(route.opened == first + 1)
    }
}
#endif
