#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac, a card with its pages in a sidebar: four pages, every setting found by its
/// words (or sent to the menu item it moved to), links landing on their page, and how you sign in
/// said plainly.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    /// Four pages (Emil, 3 November 2026: "simplify and cut things"): Account, Connect an AI,
    /// Appearance, Privacy and security. No General, Storage or Help and feedback page.
    @Test func theSidebarIsFourPages() {
        let all = Set(SettingsPlace.allCases)
        let groups = SettingsPlace.groups(available: all)
        #expect(groups == [[.account, .ai, .appearance, .security]])
        #expect(!groups.joined().contains(.appKeys), "Keys for apps sits under Connect an AI")
        for gone in ["general", "profile", "storage", "help"] {
            #expect(!SettingsPlace.allCases.map(\.rawValue).contains(gone), "no \(gone) page")
        }
        #expect(SettingsPlace.security.title == "Privacy and security")
        // Signed out: only what there is.
        #expect(SettingsPlace.groups(available: [.account, .appearance, .security]) == [[.account, .appearance, .security]])
        #expect(SettingsCard.first(all) == .account, "Settings opens at Account, never at Connect an AI")
        #expect(SettingsCard.first([.appearance, .security]) == .appearance)
        for place in SettingsPlace.allCases {
            #expect(!place.intro.isEmpty && place.intro.hasSuffix(".") && !place.intro.contains("\u{2014}"), "\(place) has one plain line under its title")
        }
    }

    /// Signed out there are still Account (Sign in), Appearance and Privacy and security, where
    /// diagnostics and the terms are now.
    @Test func signedOutThereAreThreePages() {
        #expect(SettingsView(backend: Backend(), sync: nil).places == [.account, .appearance, .security])
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let places = SettingsView(backend: backend, sync: nil).places
        #expect([.account, .ai, .appearance, .security].allSatisfy(places.contains))
    }

    /// iPhone keeps its own list (General, Storage and Help are still pages there); the pages both
    /// have come in the same order. Account sits under you on iPhone.
    @Test func iPhoneGroupsFollowTheMacsOrder() throws {
        let mac = SettingsPlace.groups(available: Set(SettingsPlace.allCases)).joined()
        let phone = SettingsTab.phoneGroups.joined().filter { ![.storage, .help].contains($0) }.map(SettingsPlace.init)
        let shared = phone.filter(mac.contains)
        var seen: [SettingsPlace] = []
        for p in shared where !seen.contains(p) { seen.append(p) }
        #expect(seen == mac.filter(seen.contains), "the iPhone's pages come in the Mac's order: \(seen)")
        #expect(SettingsTab.phoneGroups.last == [.help], "iPhone keeps Help and feedback, alone and last")
        let source = try Self.source("Pane/Views/SettingsView.swift")
        #expect(source.contains("ForEach(Array(SettingsTab.phoneGroups.enumerated())"), "the iPhone list is built from phoneGroups")
    }

    static func source(_ path: String) throws -> String {
        try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: path), encoding: .utf8)
    }

    @Test func linksIntoSettingsLandOnTheirPage() {
        #expect(SettingsPlace(.account) == .account, "the account menu's Account opens Account")
        #expect(SettingsPlace(.ai) == .ai)
        #expect(SettingsPlace(.storage) == .account, "the storage warning opens Account, where the bar is")
        #expect(SettingsPlace(.security) == .security)
        #expect(SettingsPlace(.general) == .appearance, "General's switches moved: Show in menu bar is on Appearance")
        #expect(SettingsPlace(.appearance) == .appearance)
        #expect(SettingsPlace(.help) == .account, "Help's links are in the Help menu")
    }

    /// Appearance by any of the words people use for it.
    @Test func searchFindsAppearance() {
        let all = Set(SettingsPlace.allCases)
        for word in ["appearance", "theme", "dark", "light", "dark mode", "colour", "color", "accent", "Theme", "DARK MODE"] {
            let found = SettingsIndex.matches(word, available: all).map(\.place)
            #expect(found.contains(.appearance), "\(word) finds Appearance")
            #expect(Set(found) == [.appearance], "\(word) finds only Appearance: \(found)")
        }
        #expect(SettingsIndex.matches("theme", available: [.account, .security]).isEmpty, "not when the page isn't there")
    }

    #if os(macOS)
    /// Note text size is on Appearance as well as in the View menu, and search finds it by the
    /// words people use (council round 3, 11-04). Its line says how to get back to standard.
    @Test func textSizeIsOnAppearance() throws {
        let all = Set(SettingsPlace.allCases)
        for word in ["text size", "font size", "bigger", "zoom"] {
            #expect(SettingsIndex.matches(word, available: all).map(\.place).contains(.appearance), "\(word) finds Appearance")
        }
        // The theme pictures are drawn in the mode showing (dark Settings showed light windows).
        let src = try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
            .appending(path: "Pane/Views/SettingsPages.swift"), encoding: .utf8)
        #expect(src.contains("ThemeWindowPicture(theme: t, dark: scheme == .dark)") && !src.contains("ThemeWindowPicture(theme: t, dark: false)"))
        // Mode and Theme show their choice the same way: the ink ring, never one orange and one ink.
        #expect(!src.contains("orange: true"), "one ring look on Appearance")
        // A switch that's on, in the dark: its white knob stands out from the track (at least 3:1).
        var lum: CGFloat = 0
        NSAppearance(named: .darkAqua)!.performAsCurrentDrawingAppearance {
            let c = NSColor(SettingsInk.switchOn).usingColorSpace(.sRGB)!
            func lin(_ v: CGFloat) -> CGFloat { v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            lum = 0.2126 * lin(c.redComponent) + 0.7152 * lin(c.greenComponent) + 0.0722 * lin(c.blueComponent)
        }
        #expect(1.05 / (lum + 0.05) >= 3, "white knob on the dark track: \(1.05 / (lum + 0.05)):1")
    }
    #endif

    /// Every setting that existed before is in the index, so search finds it, on its page.
    @Test func searchFindsEverySettingByItsWords() {
        let all = Set(SettingsPlace.allCases)
        #expect(SettingsIndex.matches("menu bar", available: all).map(\.place) == [.appearance], "Show in menu bar moved to Appearance")
        #expect(SettingsIndex.matches("diagnostics", available: all).map(\.place) == [.security], "diagnostics moved to Privacy and security")
        #expect(SettingsIndex.matches("recovery", available: all, recoveryKey: true).map(\.place) == [.security])
        #expect(SettingsIndex.matches("export", available: all).map(\.menu) == [.export], "Export is File › Export All Notes…")
        #expect(SettingsIndex.matches("sign out", available: all).map(\.place) == [.account])
        #expect(SettingsIndex.matches("name", available: all).map(\.place).contains(.account))
        #expect(!SettingsIndex.matches("STORAGE", available: all).isEmpty && SettingsIndex.matches("STORAGE", available: all).allSatisfy { $0.place == .account },
                "storage is on Account")
        #expect(SettingsIndex.matches("sync", available: all).allSatisfy { $0.place == .account })
        #expect(SettingsIndex.matches("apple", available: all).isEmpty, "no Sign in with Apple row any more")
        #expect(SettingsIndex.matches("terms", available: all).map(\.place) == [.security])
        #expect(SettingsIndex.matches("", available: all).isEmpty)
        #expect(SettingsIndex.matches("recovery", available: [.account, .appearance], recoveryKey: true).isEmpty, "not on a page that isn't there")
    }

    /// Advanced protection is retired (AdvancedProtection): search finds it only for an account
    /// that has it on, whose Security page shows its switch.
    @Test func searchFindsAdvancedProtectionOnlyWhenItIsOn() {
        let all = Set(SettingsPlace.allCases)
        for word in ["advanced", "Advanced protection", "PROTECTION"] {
            #expect(SettingsIndex.matches(word, available: all).isEmpty, "\(word): not found while it's off")
            #expect(SettingsIndex.matches(word, available: all, advancedProtection: AdvancedProtection.shown(.standard)).isEmpty)
            #expect(SettingsIndex.matches(word, available: all, advancedProtection: AdvancedProtection.shown(.strict)).map(\.label) == ["Advanced protection"],
                    "\(word): found while it's on")
        }
        #expect(SettingsIndex.matches("security", available: all).allSatisfy { $0.label != "Advanced protection" })
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

    /// Settings' own window is sized to Settings, not to the template gallery (both judges, council
    /// round 2, 11-04: "oversized, mostly empty"): the sidebar and one page column, no more.
    @Test func theSettingsWindowFitsItsSidebarAndOnePage() {
        let page = SettingsCard.pageWidth + 2 * SettingsCard.gutter
        #expect(SettingsWindow.size.width - SettingsCard.sidebarWidth >= page, "a page's column fits beside the sidebar")
        #expect(SettingsWindow.size.width - SettingsCard.sidebarWidth - page <= 40, "with little to spare")
        #expect(SettingsWindow.size.width < SettingsCard.size.width, "narrower than the template card")
        #expect(SettingsWindow.size.height <= 760, "fits a 13-inch Mac's screen (about 800 pt under the menu bar)")
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

    // MARK: Help, now a menu

    /// The Help menu has what the Help and feedback page held, after Keyboard Shortcuts, What's
    /// New… and Show Setup Guide; the account menu has Send Feedback….
    @Test func theHelpMenuHasWhatHelpHeld() throws {
        #expect(MacHelp.menu == ["Questions and Answers", "Send Feedback\u{2026}", "Report an Issue\u{2026}", "Pinto Notes on GitHub", "Help Connecting an AI\u{2026}"])
        let root = try Self.source("Pane/Views/RootView.swift")
        let help = try #require(root.range(of: "CommandGroup(after: .help) {").map { String(root[$0.lowerBound...].prefix(1400)) })
        let group = String(help.prefix(while: { _ in true }).components(separatedBy: "CommandGroup(replacing: .importExport)")[0])
        for item in ["Shortcuts.title", "WhatsNew.title", "Show Setup Guide", "MacHelp.questionsTitle", "MacHelp.feedbackTitle",
                     "MacHelp.reportTitle", "MacHelp.githubTitle", "MacHelp.connectHelp"] {
            #expect(group.contains(item), "the Help menu has \(item)")
        }
        #expect(root.contains("Button(\"Export All Notes\\u{2026}\")"), "File › Export All Notes… stays")
    }

    /// Things that moved to a menu are still found by Settings search, and say which menu.
    @Test func searchSendsWhatMovedToItsMenu() {
        let all = Set(SettingsPlace.allCases)
        func first(_ q: String) -> SettingsIndex.Entry? { SettingsIndex.matches(q, available: all).first { $0.menu != nil } }
        #expect(first("export")?.menu == .export && first("export")?.whereItIs == "File menu")
        for (word, link) in [("feedback", SettingsMenuLink.feedback), ("report", .reportIssue), ("github", .github), ("questions", .questions),
                             ("setup guide", .setupGuide), ("changelog", .whatsNew), ("having trouble", .connectHelp)] {
            #expect(first(word)?.menu == link, "\(word) finds \(link)")
            #expect(first(word)?.whereItIs == "Help menu")
        }
        // Export is there signed out too: its entry goes with Account, which always is.
        #expect(SettingsIndex.matches("export", available: [.account, .appearance, .security]).first?.menu == .export)
        #expect(SettingsMenuLink.allCases.allSatisfy { l in SettingsIndex.all.contains { $0.menu == l } }, "every moved item has words")
    }

    /// Send Feedback… from a menu: the mail app, or with none the address copied and said.
    @Test func sendFeedbackFromTheMenuSaysWhenNoMailAppOpened() {
        var copied: [String] = [], told: [String] = [], opened: [URL] = []
        MacHelp.sendFeedback(open: { opened.append($0); return true }, copy: { copied.append($0) }, tell: { told.append($0) })
        #expect(opened.first?.scheme == "mailto" && copied.isEmpty && told.isEmpty)
        MacHelp.sendFeedback(open: { _ in false }, copy: { copied.append($0) }, tell: { told.append($0) })
        #expect(copied == [HelpCopy.email] && told == [HelpCopy.noMailApp])
    }

    /// Help Connecting an AI… opens Settings at Connect an AI, which opens its help.
    @Test func helpConnectingOpensConnectAnAI() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "help-connecting-\(UUID())")!)
        let asks = ConnectHelpAsk()
        MacHelp.helpConnecting(route: route, asks: asks)
        #expect(asks.pending && route.target == .ai && SettingsPlace(route.target!) == .ai)
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

    /// Help by the words people use for it: each finds its menu item.
    @Test func searchFindsHelpAndFeedback() {
        let all = Set(SettingsPlace.allCases)
        for word in ["feedback", "email", "contact", "support", "what's new", "version", "setup guide", "report"] {
            #expect(SettingsIndex.matches(word, available: all).contains { $0.menu != nil }, "\(word) finds its Help menu item")
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
        // The iPhone's page and the Mac's menu use them, rather than their own copies of the same steps.
        let src = try Self.source("Pane/Views/SettingsHome.swift")
        #expect(src.contains("if Self.offersSetupGuide(signedIn: signedIn)") && src.contains("Self.playSetupGuide(close: close)")
                && src.contains("noMail = Self.mailed(accepted: accepted, copy: copy)"))
        let mac = try Self.source("Pane/Views/SettingsPages.swift")
        #expect(mac.contains("HelpPage.mailed(accepted: mailed, copy: copy)"), "the Mac's Send Feedback… uses the same step")
    }

    // MARK: Security

    /// Security says what it's for first, in plain words: who can open your notes, encrypted, never
    /// "end-to-end" unless Advanced protection is on. Its buttons are named like Apple's, and locked
    /// notes say what an AI sees before there is a password.
    @Test func securitySaysPlainlyWhatItIsFor() {
        #expect(PrivacyCopy.whoCanOpen == "Who can open your notes")
        #expect(PrivacyCopy.status == "Encrypted on your devices before they sync.")
        #expect(!PrivacyCopy.status.localizedCaseInsensitiveContains("end-to-end") && !PrivacyCopy.status.contains("E2EE"))
        #expect(!KeyCopyWords.strictFooterOff.contains("end-to-end") && KeyCopyWords.strictFooterOn.contains("end-to-end"))
        // With a copy kept by Pinto Notes, the page says Pinto Notes can open the notes too, in its one line.
        #expect(PrivacyCopy.backInFooterWithCopy.contains("Pinto Notes can open them too"))
        #expect(PrivacyCopy.summary(serverCopy: true).hasPrefix(PrivacyCopy.status) && PrivacyCopy.summary(serverCopy: true).contains("Pinto Notes can open them too"))
        #expect(!PrivacyCopy.summary(serverCopy: false).contains("Pinto Notes can open them") && !PrivacyCopy.summary(serverCopy: false).localizedCaseInsensitiveContains("end-to-end"))
        #expect(PrivacyCopy.settingsPath == "Settings \u{203A} Privacy and security", "the Mac names the page as it is now")
        // How to lock a note is said in How it works, now that the explainer row is gone.
        let locked = PrivacyCopy.how(serverCopy: true, advanced: false, keychain: false, recovery: false).first { $0.title == "Locked notes" }?.line ?? ""
        #expect(locked.contains("menu") && locked.contains("title"))
        // How an AI opens the notes: its own copy of the key, good for that AI only, used only
        // during a request (plainer words, council rounds 7 and 8; "doesn't use Pinto Notes'
        // copy" went: the key working only for that AI says it).
        let ai = PrivacyCopy.how(serverCopy: true, advanced: false, keychain: false, recovery: false).first { $0.title == "Connected AIs" }?.line ?? ""
        for part in ["its own copy of your key", "only while it works on a request"] {
            #expect(ai.contains(part), "\(part)")
        }
        // Locked notes: an AI sees that one exists, not its title or text, and keeps what it already read.
        for text in [LockedNotesCopy.footer, LockedNotesCopy.howTo] { #expect(text.contains("not its title or text"), "\(text)") }
        #expect(LockedNotesCopy.footer.contains("An AI sees that a locked note exists") && LockedNotesCopy.footer.contains("stays with that AI"))
        // Every place that explains locked notes says the same; none says an AI sees the title.
        let how = PrivacyCopy.how(serverCopy: true, advanced: false, keychain: false, recovery: false).first { $0.title == "Locked notes" }?.line ?? ""
        for text in [LockedNotesCopy.setupLine, LockedNotesCopy.footer, LockedNotesCopy.howTo, PrivacyCopy.lockedLine, how] {
            #expect(text.contains("An AI sees that a locked note exists, not its title or text."), "\(text)")
            #expect(!text.contains("sees the title") && !text.contains("see the title") && !text.contains("titles of locked notes"), "\(text)")
        }
        // Setting up the password: short, and both warnings in plain view (council round 16).
        #expect(LockedNotesCopy.setupLine.components(separatedBy: ". ").count <= 4 && LockedNotesCopy.setupLine.count < 240)
        #expect(LockedNotesCopy.forgetLine.contains("can\u{2019}t be recovered") && LockedNotesCopy.historyLine.contains("earlier versions"))
        #expect(LockedNotesCopy.howTo == "An AI sees that a locked note exists, not its title or text. Lock one from a note\u{2019}s \u{2022}\u{2022}\u{2022} menu.")
        #expect(!LockedNotesCopy.howTo.contains("AIs"), "\"AIs\" reads as \"Als\"")
        #expect([PrivacyCopy.showRecovery, PrivacyCopy.hideRecovery, PrivacyCopy.saveRecovery] == ["Show Recovery Key", "Hide Recovery Key", "Save Recovery Key\u{2026}"])
        #expect(LockedNotesCopy.header == "Locked notes")
        for text in [PrivacyCopy.status, PrivacyCopy.backInFooterWithCopy, PrivacyCopy.backInFooterDevicesOnly, PrivacyCopy.aiFooter, LockedNotesCopy.howTo, LockedNotesCopy.footer,
                     HelpCopy.feedbackFooter, HelpCopy.setupGuideFooter, HelpCopy.openSourceFooter, HelpCopy.noMailApp,
                     PrivacyCopy.summary(serverCopy: true), AccountSettingsPage.exportHint, ConnectCopy.shared] {
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

    // MARK: Layout (design/settings-layout-connect, 2 November 2026)

    /// Where the card's parts land, as the probe reports them.
    final class Frames { var all: [String: CGRect] = [:] }

    /// Draws Settings offscreen (borderless, far off screen, never ordered front) and reads where
    /// the title, the page and each tab land.
    static func layout(_ start: SettingsPlace, window size: CGSize) async throws -> [String: CGRect] {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let two = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com")]
        var view = SettingsView(backend: backend, sync: nil, connections: two, route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-layout-\(UUID())")!))
        view.start = start
        view.close = {}
        let frames = Frames()
        let host = NSHostingView(rootView: view.environment(\.settingsLayoutProbe, { name, rect in frames.all[name] = rect }))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: size.width, height: size.height), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        for _ in 0..<20 {
            host.layoutSubtreeIfNeeded()
            try await Task.sleep(for: .milliseconds(50))
            if frames.all["page"] != nil, frames.all["title"] != nil { break }
        }
        try await Task.sleep(for: .milliseconds(150))
        host.layoutSubtreeIfNeeded()
        return frames.all
    }

    /// Every page is one column no wider than the cap, centred in the page area, and its title
    /// starts where its content does; on a small window too.
    @Test(arguments: [CGSize(width: 1180, height: 760), CGSize(width: 860, height: 600)])
    func thePageIsACentredColumnUnderItsTitle(window: CGSize) async throws {
        for place in [SettingsPlace.account, .ai, .appearance, .security] {
            let f = try await Self.layout(place, window: window)
            let page = try #require(f["page"], "\(place): the page reports its frame")
            let area = try #require(f["area"])
            let title = try #require(f["title"])
            // A page taller than the window scrolls; with scroll bars always shown (a mouse, or
            // the setting) the bar takes its width from the column's room (Appearance and Privacy
            // after the text size row, 11-04). With overlay scroll bars it takes nothing.
            let bar: CGFloat = page.maxY > area.maxY && NSScroller.preferredScrollerStyle == .legacy
                ? NSScroller.scrollerWidth(for: .regular, scrollerStyle: .legacy) : 0
            let room = CGRect(x: area.minX, y: area.minY, width: area.width - bar, height: area.height)
            #expect(page.width <= SettingsCard.pageWidth + 0.5, "\(place): the column is capped at \(SettingsCard.pageWidth), was \(page.width)")
            #expect(abs(page.width - min(SettingsCard.pageWidth, room.width - 2 * SettingsCard.gutter)) < 0.5, "\(place): as wide as the cap or the room allows")
            #expect(abs(page.midX - room.midX) < 0.5, "\(place): centred, page \(page) in area \(room)")
            #expect(abs(title.minX - (page.minX + SettingsCard.pageInset)) <= bar / 2 + 0.5, "\(place): the title starts at the content's edge: \(title.minX) vs \(page.minX + SettingsCard.pageInset)")
        }
        #expect(SettingsCard.contentWidth >= 560 && SettingsCard.contentWidth <= 620)
    }

    /// Connect an AI is one list filling the content column, its left edge under the title's, and
    /// the line on what is sent right under it, in view without scrolling (App Review 5.1.2).
    @Test func connectIsOneListWithTheSharingLineInView() async throws {
        let f = try await Self.layout(.ai, window: CGSize(width: 1180, height: 760))
        let list = try #require(f["connect.list"], "the AIs are one list")
        let title = try #require(f["title"]), page = try #require(f["page"]), area = try #require(f["area"])
        #expect(abs(list.minX - title.minX) < 0.5, "list \(list.minX), title \(title.minX)")
        #expect(abs(list.width - (page.width - 2 * SettingsCard.pageInset)) < 0.5)
        let sent = try #require(f["connect.sent"], "the line on what is sent is on the page")
        #expect(sent.minY > list.maxY && sent.minY - list.maxY < 20, "right under the list: \(sent) under \(list)")
        #expect(sent.height > 10 && sent.maxY < area.maxY, "in view without scrolling: \(sent) in \(area)")
        #expect(f["connect.connected"] == nil && f["connect.add"] == nil, "no separate Connected and Add boxes")
    }

    /// Two tabs next to each other in the sidebar never touch, so their fills never merge.
    @Test func adjacentTabsHaveAGap() async throws {
        let f = try await Self.layout(.security, window: CGSize(width: 1180, height: 760))
        var pairs = 0
        for group in SettingsPlace.groups(available: Set(SettingsPlace.allCases)) {
            for (a, b) in zip(group, group.dropFirst()) {
                guard let upper = f["tab.\(a.rawValue)"], let lower = f["tab.\(b.rawValue)"] else { continue }
                pairs += 1
                let gap = lower.minY - upper.maxY
                #expect(gap >= 2 && gap <= 4, "\(a) and \(b): \(gap) pt apart")
            }
        }
        #expect(pairs >= 2, "measured \(pairs) pairs of tabs")
    }

    /// The page and the setup card run the same connect flows, not copies.
    @Test func settingsConnectUsesTheSetupCardsPieces() throws {
        let page = try Self.source("Pane/Views/ConnectAI.swift")
        let setup = try Self.source("Pane/Views/SetupCards.swift")
        for piece in ["ConnectWaitingPanel(", "ConnectedPanel(", "SetupCards.guidePage("] {
            #expect(page.contains(piece) && setup.contains(piece), "\(piece) is shared")
        }
        #expect(SetupCards.guidePage(.grok) == .grok && SetupCards.guidePage(.other) == .other)
        #expect(SetupCards.guidePage(.chatgpt) == nil && SetupCards.guidePage(.claude) == nil)
        #expect(ConnectAIPage.more(offered: [.chatgpt, .claude, .grok, .codex, .incredible, .other]) == [.codex, .incredible], "Codex and Incredible stay reachable")
        #expect(ConnectCopy.why.hasSuffix(ConnectCopy.shared), "the line on what is shared is the same words everywhere")
    }

    /// Connect an AI says what is sent and to which company, by name, always in view (App Review
    /// rejected 1.2 for hiding it); one row per AI there is, connected or not, and never Mistral.
    @Test func connectSaysWhatIsSentAndToWhom() throws {
        #expect(ConnectAIPage.sent(["ChatGPT", "Claude"]) == "The notes ChatGPT opens go to OpenAI and the notes Claude opens go to Anthropic. Disconnect an AI any time to stop sharing with it.")
        #expect(ConnectAIPage.sent(["Grok"]) == "The notes Grok opens go to xAI. Disconnect an AI any time to stop sharing with it.")
        #expect(ConnectAIPage.sent([]) == ConnectCopy.shared, "before any is connected, the general line")
        #expect(ConnectAIPage.sent(["ChatGPT", "An app on this computer"]).contains("Other connected apps get only the notes they open."))
        for g in ConnectAISection.Guide.allCases { #expect(!ConnectAIPage.line(g).isEmpty && !ConnectAIPage.line(g).contains("\u{2014}")) }
        let src = try Self.source("Pane/Views/ConnectAI.swift")
        let page = try #require(src.range(of: "struct ConnectAIPage").map { String(src[$0.lowerBound...].prefix(9000)) })
        #expect(page.contains("Text(Self.sent(names))") && !page.contains("DisclosureGroup"), "the line is on the page, not behind a disclosure")
        #expect(!page.contains("ConnectCopy.trouble") && !page.contains("SettingsSummary"), "no summary box; Having trouble? is in the Help menu")
        #expect(!ConnectAISection.Guide.allCases.contains { $0.title.localizedCaseInsensitiveContains("mistral") || $0.title.localizedCaseInsensitiveContains("le chat") }, "never Mistral")
    }

    /// One row per AI: a connected one in its place (each account its own row), the rest with
    /// Connect…; connections no AI in the list made after them; Another AI last, always there.
    @Test func connectIsOneRowPerAI() {
        let all: [ConnectAISection.Guide] = [.chatgpt, .claude, .grok, .codex, .incredible, .other]
        func c(_ name: String, host: String? = nil) -> Connection {
            Connection(id: UUID(), name: name, kind: host == nil ? "token" : "oauth", created_at: .now, last_used_at: .now.addingTimeInterval(-120), revoked_at: nil, redirect_host: host)
        }
        let none = ConnectAIPage.rows(offered: all, connections: [])
        #expect(none.map(\.guide) == all && none.allSatisfy { $0.connection == nil })
        let gpt = c("ChatGPT", host: "chatgpt.com"), local = c("My tool", host: "localhost")
        let rows = ConnectAIPage.rows(offered: all, connections: [gpt, local])
        #expect(rows.map(\.guide) == [.chatgpt, .claude, .grok, .codex, .incredible, nil, .other])
        #expect(rows[0].connection?.id == gpt.id, "ChatGPT's row is its connection")
        #expect(rows[5].connection?.id == local.id && rows.last?.connection == nil, "the app on this computer, then Another AI")
        #expect(ConnectAIPage.detail(rows[0]) == "Used 2 minutes ago", "a connected one says when it was last used")
        #expect(ConnectAIPage.detail(rows[5]).hasPrefix("localhost"), "one the list can't name says where access went")
        let two = ConnectAIPage.rows(offered: all, connections: [gpt, c("ChatGPT", host: "chatgpt.com")])
        #expect(two.filter { $0.guide == .chatgpt }.count == 2, "two accounts, two rows")
    }

    // MARK: Account (3 November 2026: one card)

    /// Account is one card: no Sign in with Apple row, no Sync row or Sync Now, no Export; Sign
    /// Out… and a quiet Delete Account… under it. Clicking the sync status syncs (a click sent to
    /// this window only, never a global event).
    @Test func accountIsOneCardAndItsStatusSyncs() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        final class Count { var n = 0 }
        let synced = Count()
        let frames = Frames()
        let page = AccountSettingsPage(backend: backend, sync: nil, syncNow: { synced.n += 1 })
            .padding(20)
            .frame(width: SettingsCard.pageWidth, height: 520, alignment: .top)
            .coordinateSpace(.named(SettingsCard.space))
            .environment(\.settingsLayoutProbe, { name, rect in frames.all[name] = rect })
            .modelContainer(try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true)))
        let host = NSHostingView(rootView: page)
        let window = FileRowClickTests.KeyWindow(contentRect: CGRect(x: -20000, y: -20000, width: SettingsCard.pageWidth, height: 520), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.orderOut(nil); window.close() }
        for _ in 0..<30 where frames.all["account.syncStatus"] == nil {
            host.layoutSubtreeIfNeeded()
            try await Task.sleep(for: .milliseconds(50))
        }
        let status = try #require(frames.all["account.syncStatus"], "the sync status is on the card")
        for part in ["account.photo", "account.name", "account.delete"] {
            #expect(frames.all[part] != nil, "\(part) is there")
        }
        let photo = try #require(frames.all["account.photo"]), name = try #require(frames.all["account.name"])
        #expect(name.minX > photo.maxX && status.minY > name.minY, "the name beside the photo, the status under it")
        // What the status runs when clicked: a sync.
        AccountSettingsPage.syncNow(nil) { synced.n += 1 }
        for _ in 0..<20 where synced.n == 0 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(synced.n == 1)
        let src = try Self.source("Pane/Views/SettingsPages.swift")
        let account = try #require(src.range(of: "struct AccountSettingsPage").map { String(src[$0.lowerBound...].prefix(12000)) })
        #expect(account.contains("Button { runSync() } label:") && account.contains("private func runSync() { Self.syncNow(sync, override: syncNow) }"),
                "the status is the button that syncs")
        for gone in ["AppleIDRow", "ExportNotesButton", "\"Sync Now\"", "settings.syncNow"] {
            #expect(!account.contains(gone), "\(gone) is cut from Account")
        }
        #expect(account.contains("DeleteAccountButton(") && account.contains("SignOutButton("))
        // A real click on the status needs a key window: where windows may be ordered in (CI).
        guard FileRowClickTests.onCI else { return }
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        try await Task.sleep(for: .milliseconds(400))
        let point = host.convert(CGPoint(x: status.midX, y: status.midY), to: nil)
        for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
            let e = try #require(NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                                   windowNumber: window.windowNumber, context: nil, eventNumber: 0, clickCount: 1, pressure: type == .leftMouseDown ? 1 : 0))
            window.sendEvent(e)
        }
        for _ in 0..<20 where synced.n == 1 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(synced.n == 2, "clicking the status syncs now")
    }

    @Test func theSyncLineIsShort() {
        let now = Date.now
        #expect(AccountSettingsPage.syncLine(.synced(now.addingTimeInterval(-10)), reach: .online, now: now) == "Synced just now")
        #expect(AccountSettingsPage.syncLine(.synced(now.addingTimeInterval(-300)), reach: .online, now: now).hasPrefix("Synced "))
        #expect(AccountSettingsPage.syncLine(.syncing, reach: .online, now: now) == "Syncing\u{2026}")
        let g: Int64 = 1_073_741_824
        let line = AccountSettingsPage.storageLine(StorageUsage(used: g + g / 5, limit: 2 * g, notes: 0, files: 0, apps: 0, deleted: 0, versions: 0))
        #expect(line.hasPrefix("1.2") && line.hasSuffix(" GB of 2 GB") && !line.contains("used"), "\(line)")
    }

    // MARK: The card's size (3 November 2026: "the popup changes size when the app loses focus")

    @MainActor @Observable final class Active { var on = true }

    /// In a sheet the card measures the window under it once, when it opens. Before, it read the
    /// main or key window on every redraw, and that changed as the app lost and regained focus.
    @Test func theCardKeepsItsSizeWhenTheAppLosesFocus() async throws {
        let keptFront = SettingsCard.frontWindowSize
        defer { SettingsCard.frontWindowSize = keptFront }
        SettingsCard.frontWindowSize = { CGSize(width: 1100, height: 720) }
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let active = Active()
        struct Flip: View {
            let active: Active
            let backend: Backend
            var body: some View {
                SettingsView(backend: backend, sync: nil, connections: [], route: SettingsRoute(defaults: UserDefaults(suiteName: "settings-size-\(UUID())")!))
                    .environment(\.appearsActive, active.on)
                    .environment(\.controlActiveState, active.on ? .key : .inactive)
            }
        }
        let frames = Frames()
        let host = NSHostingView(rootView: Flip(active: active, backend: backend).environment(\.settingsLayoutProbe, { name, rect in frames.all[name] = rect }))
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1300, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        defer { window.close() }
        func settle() async throws {
            for _ in 0..<6 { host.layoutSubtreeIfNeeded(); try await Task.sleep(for: .milliseconds(60)) }
        }
        try await settle()
        let first = try #require(frames.all["card"], "the card reports its frame")
        #expect(first.size == SettingsCard.fitted(CGSize(width: 1100, height: 720)))
        // The app loses focus: the main window is gone and only another one is key, a smaller one.
        SettingsCard.frontWindowSize = { CGSize(width: 700, height: 500) }
        for on in [false, true, false, true] {
            active.on = on
            try await settle()
            #expect(frames.all["card"]?.size == first.size, "active \(on): \(String(describing: frames.all["card"]))")
        }
        let src = try Self.source("Pane/Views/SettingsCard.swift")
        #expect(!src.contains("Self.fitted((NSApp.mainWindow"), "no reading the front window on a redraw")
    }

    /// Round 7: signed out, Account's Sign In… brings the card forward ready for an email; the
    /// sign-in footer reads as two short paragraphs; Privacy says what it means in plain words.
    @Test func signedOutSignInFocusesTheCardAndTheCopyIsPlain() throws {
        let pages = try Self.source("Pane/Views/SettingsPages.swift")
        #expect(pages.contains("post(name: SignInView.focusEmailNotice"), "Sign In… puts the caret in the card's email field")
        let card = try Self.source("Pane/Views/SignInView.swift")
        #expect(card.contains("publisher(for: Self.focusEmailNotice)") && card.contains("focus = .email }"))
        let legal = try Self.source("Pane/Views/LegalLinks.swift")
        #expect(legal.contains("Text(ConsentFooter.diagnosticsLines)") && legal.contains("signin.diagnostics"), "diagnostics is its own paragraph under the terms")
        #if os(macOS)
        // Round 8: the small print at 11 pt, links and all (10 pt read as miniature).
        let print = LinkLabel.styled(Legal.consentSentence)
        #expect((print.attribute(.font, at: 0, effectiveRange: nil) as? NSFont)?.pointSize == ConsentFooter.size)
        #expect(ConsentFooter.size == 12)
        // The terms on two lines, the two names together on the second, each line measured
        // (council round 10: "Privacy Policy." sat alone).
        let terms = String(Legal.consentLines.characters)
        #expect(terms == "By continuing, you agree to the\nTerms of Service and Privacy Policy.")
        for line in terms.split(separator: "\n") {
            let width = NSAttributedString(string: String(line), attributes: [.font: NSFont.systemFont(ofSize: ConsentFooter.size)]).size().width
            #expect(width <= ConsentFooter.column - 4, "\(line): \(width) pt in \(ConsentFooter.column)")
        }
        #expect(SignInView.settingsLine.contains("ChatGPT or Claude"), "signed out, Account says what the card says")
        // On the Mac card, the short line, on one line beside Sign In… (council round 11: "or
        // Claude." wrapped alone). The 880 pt window less the sidebar (about 208), the card's
        // margins and padding, the 54 pt avatar and the Sign In… button leaves about 370 pt.
        let accountPage = try Self.source("Pane/Views/SettingsPages.swift")
        #expect(accountPage.contains(": SignInView.shortLine)"))
        let short = NSAttributedString(string: SignInView.shortLine, attributes: [.font: NSFont.systemFont(ofSize: 13)]).size().width
        #expect(short <= 360, "\(short) pt")
        // Table cells: 0.6 em either side, 8 pt at the smallest size, 14 at the biggest.
        #expect(GridMetrics.inset(body: 13) == 8 && GridMetrics.inset(body: 24) == 14)
        // And a click counts from where the text starts (council round 11: clicks still counted 8 pt):
        // at 24 pt, a click 2 pt into "Ma" lands before "M", at any inset.
        let font = NSFont.systemFont(ofSize: 24)
        let m = ("M" as NSString).size(withAttributes: [.font: font]).width
        for inset: CGFloat in [8, 14] {
            #expect(TableGridView.caretIndex(in: "Manteigaria", x: inset + 2, width: 200, trailing: false, body: 24, inset: inset) == 0)
            #expect(TableGridView.caretIndex(in: "Manteigaria", x: inset + m + 2, width: 200, trailing: false, body: 24, inset: inset) == 1)
        }
        let grid = try Self.source("Pane/Editor/TableGrid.swift")
        #expect(!grid.contains("p.x - 8"), "links and the pointer count the same inset")
        #expect(ConsentFooter.diagnosticsLines == "Sends error reports and counts.\nNever your notes. Turn off in Settings.", "two lines")
        // And each sentence fits its line, measured, not counted (round 9: it passed and wrapped on the Air).
        for line in ConsentFooter.diagnosticsLines.split(separator: "\n") {
            let width = NSAttributedString(string: String(line), attributes: [.font: NSFont.systemFont(ofSize: ConsentFooter.size)]).size().width
            #expect(width <= ConsentFooter.column - 4, "\(line): \(width) pt in \(ConsentFooter.column)")
        }
        #endif
        let privacy = try Self.source("Pane/Views/PrivacySecurity.swift")
        #expect(!privacy.contains("Text(HelpCopy.trademarks)"), "no trademark notes on Privacy")
        #expect(privacy.contains("\"Each AI you connect \" + PrivacyCopy.aiMay") && privacy.contains("It has its own copy of your key, used only while it works on a request."), "what it may do, then how its key works")
        // Standard accounts never hear of Advanced protection (it's hidden for them, 11-01).
        #expect(!privacy.contains("Turn on Advanced protection"), "the court order row offers nothing a standard account can't see")
    }


    #if os(macOS)
    /// Signed out, ⌘, opens Settings over the sign-in card (a sheet), not nothing (council round 7).
    @Test func settingsOpensOverTheSignInCard() {
        typealias K = SettingsCardHost.KeyWindow
        #expect(SettingsCardHost.takes(active: true, key: K()), "the notes window in front")
        // The trademark notes are About's credits, not the foot of Privacy and security.
        #expect(AboutCredits.credits.string == HelpCopy.trademarks)
        // Settings has an edge against a black window in dark mode (council rounds 7 to 9).
        #expect(SettingsWindowEdge.opacity == 0.1)
        let app = (try? Self.source("Pane/App/PaneApp.swift")) ?? ""
        #expect(app.contains(".overlay { SettingsWindowEdge() }"))
        #expect(AIChangesStatus.offersConnect(ais: []) && !AIChangesStatus.offersConnect(ais: ["Claude"]), "no AI yet: a way to connect one")
        #expect(SettingsCardHost.takes(active: false, key: nil), "no window key, as at launch")
        #expect(SettingsCardHost.takes(active: false, key: K(settings: true)), "Settings in front")
        #expect(SettingsCardHost.takes(active: false, key: K(sheet: true)), "the sign-in card in front")
        #expect(!SettingsCardHost.takes(active: false, key: K()), "another window in front takes it, not this one")
    }
    #endif

}
#endif
