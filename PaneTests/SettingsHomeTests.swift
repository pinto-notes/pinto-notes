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

    /// iPhone's Settings rows come in the Mac sidebar's groups and order, less Account (it sits
    /// under you on iPhone): Help and feedback is the last group on both. The iPhone list draws
    /// from them.
    @Test func iPhoneGroupsMatchTheMac() throws {
        let mac = SettingsPlace.groups(available: Set(SettingsPlace.allCases))
            .map { $0.filter { $0 != .account } }.filter { !$0.isEmpty }
        #expect(SettingsTab.phoneGroups.map { $0.map(SettingsPlace.init) } == mac)
        #expect(SettingsTab.phoneGroups.last == [.help], "Help and feedback, alone and last, as on the Mac")
        #expect(Set(SettingsTab.phoneGroups.joined()) == Set(SettingsTab.allCases).subtracting([.account]), "every page but Account (your row) has a row")
        let source = try Self.source("Pane/Views/SettingsView.swift")
        #expect(source.contains("ForEach(Array(SettingsTab.phoneGroups.enumerated())"), "the iPhone list is built from phoneGroups")
    }

    static func source(_ path: String) throws -> String {
        try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: path), encoding: .utf8)
    }

    @Test func linksIntoSettingsLandOnTheirPage() {
        #expect(SettingsPlace(.account) == .profile, "the account row opens Profile")
        #expect(SettingsPlace(.ai) == .ai)
        #expect(SettingsPlace(.storage) == .storage)
        #expect(SettingsPlace(.security) == .security)
        #expect(SettingsPlace(.general) == .general)
        #expect(SettingsPlace(.appearance) == .appearance)
        #expect(SettingsPlace(.help) == .help)
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

    // MARK: Help and feedback

    /// Help and feedback is there signed in and signed out, on both platforms, as a page of its own.
    @Test func helpIsAlwaysThere() {
        let signedOut = SettingsView(backend: Backend(), sync: nil)
        #expect(signedOut.tabs.contains(.help) && signedOut.places.contains(.help))
        let backend = Backend()
        backend.showSignedInForPreview(email: "sara@example.com")
        #expect(SettingsView(backend: backend, sync: nil).tabs.contains(.help))
        #expect(SettingsTab.help.title == SettingsPlace.help.title && SettingsTab.help.symbol == SettingsPlace.help.symbol)
    }

    /// Send feedback writes to the address the website gives, with the subject filled in and the
    /// version and system under room to write. Nothing else about the device.
    @Test func feedbackGoesToTheSitesAddressWithTheVersion() throws {
        let url = HelpCopy.mail(version: "1.2.31 (2611011200)", system: "macOS 26.1")
        let c = try #require(URLComponents(url: url, resolvingAgainstBaseURL: false))
        #expect(c.scheme == "mailto" && c.path == "hello@pintonotes.com")
        let items = Dictionary(uniqueKeysWithValues: (c.queryItems ?? []).map { ($0.name, $0.value ?? "") })
        #expect(items["subject"] == "Pinto Notes feedback")
        #expect(items["body"] == "\n\n\nPinto Notes 1.2.31 (2611011200), macOS 26.1")
        #expect(Set(items.keys) == ["subject", "body"])
        #expect(!url.absoluteString.contains(" "), "spaces are escaped, so every mail app reads it")
        // The same address the website's help page, privacy policy and support page give.
        #expect(try Self.source("web/lib/site.ts").contains("SUPPORT_EMAIL = \"\(HelpCopy.email)\""))
        #expect(try Self.source("web/content/privacy-policy.md").contains(HelpCopy.email))
        #expect(HelpCopy.system.hasPrefix("macOS ") && HelpCopy.system.split(separator: ".").count >= 2)
    }

    /// Every link on Help and on Security goes to a page that exists: the website's own, or the
    /// project on GitHub, over https.
    @Test func helpsLinksAreRealAndCurrent() throws {
        let site: [(URL, String)] = [(HelpCopy.supportPage, "help"), (WhatsNew.changelogURL, "changelog"), (Legal.terms, "terms"),
                                     (Legal.privacy, "privacy"), (PrivacyCopy.learnMoreURL, "privacy-security")]
        for (url, page) in site {
            #expect(url.absoluteString == "https://pintonotes.com/\(page)")
            #expect(FileManager.default.fileExists(atPath: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
                .appending(path: "web/app/\(page)/page.tsx").path), "the site has /\(page)")
        }
        for link in AboutSection.links {
            #expect(link.url.absoluteString.hasPrefix("https://github.com/pinto-notes/pinto-notes"), "\(link.title)")
        }
        #expect(AboutSection.links.first?.title == "Report an issue", "what someone on Help came for comes first")
    }

    /// Help by the words people use for it.
    @Test func searchFindsHelpAndFeedback() {
        let all = Set(SettingsPlace.allCases)
        for word in ["feedback", "email", "contact", "support", "what's new", "version", "setup guide", "report"] {
            #expect(SettingsIndex.matches(word, available: all).contains { $0.place == .help }, "\(word) finds Help and feedback")
        }
    }

    /// Signed out there's no setup guide to play (it starts from your name), so the button isn't
    /// there to do nothing. Signed in it plays and closes Settings, so the guide is seen. Send
    /// feedback with no mail app copies the address and says so under the button.
    @Test func helpsButtonsEachDoSomethingVisible() async throws {
        #expect(!HelpPage.offersSetupGuide(signedIn: false) && HelpPage.offersSetupGuide(signedIn: true))
        var closed = 0
        let replays = NotificationCenter.default.notifications(named: .paneReplayOnboarding)
        let heard = Task { for await _ in replays { return true }; return false }
        try await Task.sleep(for: .milliseconds(50))
        HelpPage.playSetupGuide(close: { closed += 1 })
        #expect(closed == 1, "Settings closes, so the guide shows")
        #expect(await heard.value, "the guide is asked to play")

        var copied: [String] = []
        #expect(!HelpPage.mailed(accepted: true, copy: { copied.append($0) }) && copied.isEmpty, "a mail app took it: nothing more")
        #expect(HelpPage.mailed(accepted: false, copy: { copied.append($0) }), "no mail app: the line under the button shows")
        #expect(copied == [HelpCopy.email], "and the address is copied")
        #expect(HelpCopy.noMailApp.contains(HelpCopy.email))
        // The page uses them, rather than its own copies of the same steps.
        let src = try Self.source("Pane/Views/SettingsHome.swift")
        #expect(src.contains("if Self.offersSetupGuide(signedIn: signedIn)") && src.contains("Self.playSetupGuide(close: close)")
                && src.contains("noMail = Self.mailed(accepted: accepted, copy: copy)"))
    }

    // MARK: Security

    /// Security says what it's for first, in plain words: encrypted, never "end-to-end" unless
    /// Advanced protection is on. Its buttons are named like Apple's, and locked notes are
    /// explained before there is a password.
    @Test func securitySaysPlainlyWhatItIsFor() {
        for summary in [PrivacyCopy.summary(serverCopy: false), PrivacyCopy.summary(serverCopy: true)] {
            #expect(summary.hasPrefix("Your notes are encrypted"), "\(summary)")
            #expect(!summary.localizedCaseInsensitiveContains("end-to-end") && !summary.contains("E2EE"))
            #expect(summary.contains("AI"), "the one exception is said")
        }
        #expect(!PrivacyCopy.summary(serverCopy: true).contains("can\u{2019}t read"), "not claimed while Pinto Notes keeps a copy")
        #expect(!KeyCopyWords.strictFooterOff.contains("end-to-end") && KeyCopyWords.strictFooterOn.contains("end-to-end"))
        #expect(PrivacyCopy.keyHeader == "What can open your notes")
        #expect([PrivacyCopy.showRecovery, PrivacyCopy.hideRecovery, PrivacyCopy.saveRecovery] == ["Show Recovery Key", "Hide Recovery Key", "Save Recovery Key\u{2026}"])
        #expect(LockedNotesCopy.header == "Locked notes")
        #expect(LockedNotesCopy.howTo.contains("Lock Note"), "names the menu item it's under")
        for text in [PrivacyCopy.summary, PrivacyCopy.summaryWithCopy, PrivacyCopy.keptInKeychain, LockedNotesCopy.howTo, LockedNotesCopy.footer,
                     HelpCopy.feedbackFooter, HelpCopy.setupGuideFooter, HelpCopy.openSourceFooter, HelpCopy.noMailApp] {
            #expect(!text.contains("\u{2014}") && !text.contains("\u{2013}"), "\(text)")
        }
    }

    /// Without a notes password Security says how to lock a note; with one, its controls.
    @Test func lockedNotesSaysHowBeforeThereIsAPassword() {
        #expect(LockedNotesSection.shown(setUp: false) == .howTo)
        #expect(LockedNotesSection.shown(setUp: true) == .controls)
    }

    /// Every page of Settings says it's offline at its top, on iPhone too: there a page covers the
    /// first screen, and Security's Add a device and Advanced protection were greyed out unexplained.
    @Test func everyPageSaysWhenItIsOffline() throws {
        let src = try Self.source("Pane/Views/SettingsView.swift")
        let page = try #require(src.range(of: "private struct SettingsPage").map { src[$0.lowerBound...] })
        let form = String(page.prefix(while: { $0 != "}" }))
        #expect(form.contains("OfflineSection()") && !form.contains("#if os(macOS)"), "OfflineSection on both platforms")
    }
}
#endif
