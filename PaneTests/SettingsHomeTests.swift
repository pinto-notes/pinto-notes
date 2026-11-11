#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
import Carbon.HIToolbox
@testable import Pane

/// Settings on the Mac, a card with its pages in a sidebar: four pages, every setting found by its
/// words (or sent to the menu item it moved to), links landing on their page, and how you sign in
/// said plainly.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    /// The same rows as iPhone's Settings, with the same names (Emil, 7 November 2026: "copy this
    /// onto Mac as well so it's fully consistent"): you, then AI Connections, General, Appearance;
    /// Privacy, Storage; Help and feedback.
    @Test func theSidebarIsTheIPhonesList() {
        let all = Set(SettingsPage.allCases)
        let groups = SettingsPage.groups(available: all)
        // General, Appearance, Keyboard shortcuts; the features (AI first); Privacy, Storage; Help
        // (Emil, 7 November 2026). Keyboard shortcuts is the Mac's.
        #expect(groups == [[.account], [.general, .appearance, .shortcuts], [.ai, .todaysNote], [.security, .storage], [.help]])
        #expect(SettingsPage.todaysNote.title == "Today\u{2019}s note" && SettingsPage.todaysNote.symbol == "calendar")
        #expect(SettingsPage.shortcuts.title == "Keyboard shortcuts" && SettingsPage.shortcuts.symbol == "command")
        #expect(!groups.joined().contains(.appKeys), "Keys for apps is not in the sidebar")
        #expect(SettingsPage.ai.title == "AI Connections")
        #expect(SettingsPage.security.title == "Privacy")
        // Signed out: only what there is.
        #expect(SettingsPage.groups(available: [.account, .general, .appearance, .shortcuts, .todaysNote, .security, .help])
                == [[.account], [.general, .appearance, .shortcuts], [.todaysNote], [.security], [.help]])
        #expect(SettingsCard.first(all) == .account, "Settings opens at Account, never at AI Connections")
        #expect(SettingsCard.first([.appearance, .security]) == .appearance)
    }

    /// Signed out there are still Account (Sign in), General, Appearance, Privacy and
    /// Help and feedback; AI Connections and Storage come with an account.
    @Test func signedOutThereAreFivePages() {
        #expect(SettingsView(backend: Backend(), sync: nil).available == [.account, .general, .appearance, .shortcuts, .todaysNote, .security, .help])
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        #expect(SettingsView(backend: backend, sync: nil).available == [.account, .ai, .general, .appearance, .shortcuts, .todaysNote, .security, .storage, .help, .personal, .signIn, .encryption, .aiConnection, .addAI])
        #expect(SettingsPage.available(signedIn: false, hasClient: false, demoStorage: true).contains(.storage), "captures show Storage")
    }

    /// Both apps list the same pages from one list (SettingsPage.groups): the Mac's sidebar, drawn,
    /// has its rows in the order iPhone's list has them, with the same names and symbols.
    @Test func macAndIPhoneListTheSamePages() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let pages = SettingsView(backend: backend, sync: nil).pages
        #expect(pages == [.account, .general, .appearance, .shortcuts, .ai, .todaysNote, .security, .storage, .help])
        let f = try await Self.layout(.general, window: CGSize(width: 1180, height: 760))
        let drawn = pages.compactMap { p in f["tab.\(p.rawValue)"].map { (p, $0.minY) } }.sorted { $0.1 < $1.1 }.map(\.0)
        #expect(drawn == pages, "the sidebar, top to bottom: \(drawn)")
        // The Mac sidebar's groups part clearly: a gap many times the gap between rows.
        #expect(SettingsCard.groupGap >= 20 && SettingsCard.groupGap >= SettingsCard.tabGap * 6, "a group gap, not a flaw")
        // Emil's pick (B, 7 November 2026): outlines, each symbol different, and each exists.
        let picked = [SettingsIcons.ai, SettingsIcons.general, SettingsIcons.appearance]
        #expect(picked == ["link", "slider.horizontal.3", "textformat.size"])
        #expect(Set(picked).count == 3 && !picked.contains { $0.contains(".fill") })
        for p in SettingsPage.allCases { #expect(NSImage(systemSymbolName: p.symbol, accessibilityDescription: nil) != nil, "\(p.symbol) exists") }
    }

    static func source(_ path: String) throws -> String {
        try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: path), encoding: .utf8)
    }

    /// A link into Settings (a card, the storage warning, the account menu) opens its own page.
    @Test func linksIntoSettingsLandOnTheirPage() async throws {
        for page in [SettingsPage.storage, .security, .ai, .help, .appearance] {
            let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-link-\(UUID())")!)
            route.target = page
            _ = try await Self.layout(.account, window: CGSize(width: 1180, height: 760), route: route)
            #expect(route.page == page, "\(page) opens \(String(describing: route.page))")
            #expect(route.target == nil, "taken once")
        }
    }

    /// Appearance by any of the words people use for it.
    @Test func searchShowsTheFirstResultsPage() {
        let all = Set(SettingsPage.allCases)
        let found = SettingsIndex.matches("sync", available: all, advancedProtection: false, recoveryKey: false)
        #expect(SettingsCard.pageWhileSearching(found) == found.first { $0.menu == nil }?.page)
        #expect(SettingsCard.pageWhileSearching(found) == .account, "beside Sync status, Account")
        // The result says what's on the page, and "sync now" still finds it.
        #expect(found.contains { $0.label == "Sync status" })
        #expect(!found.contains { $0.label == "Sync now" }, "the page has no button by that name")
        #expect(SettingsIndex.matches("sync now", available: all).contains { $0.label == "Sync status" })
        #expect(SettingsCard.pageWhileSearching([]) == nil, "nothing found: the page you were on")
    }

    @Test func searchFindsAppearance() {
        let all = Set(SettingsPage.allCases)
        for word in ["appearance", "theme", "dark", "light", "dark mode", "font", "serif", "Theme", "DARK MODE"] {
            let found = SettingsIndex.matches(word, available: all).map(\.page)
            #expect(found.contains(.appearance), "\(word) finds Appearance")
            #expect(Set(found) == [.appearance], "\(word) finds only Appearance: \(found)")
        }
        #expect(SettingsIndex.matches("theme", available: [.account, .security]).isEmpty, "not when the page isn't there")
    }

    #if os(macOS)
    /// Note text size is on Appearance as well as in the View menu, and search finds it by the
    /// words people use (council round 3, 11-04). No footer under it (Emil, 7 November 2026).
    @Test func textSizeIsOnAppearance() throws {
        let all = Set(SettingsPage.allCases)
        for word in ["text size", "font size", "bigger", "zoom"] {
            #expect(SettingsIndex.matches(word, available: all).map(\.page).contains(.appearance), "\(word) finds Appearance")
        }
        // A switch that's on is in the accent, light and dark, with every accent: its white knob
        // stands out from the track (at least 3:1); a light accent is deepened, never swapped for grey.
        for accent in AccentChoice.allCases {
            ThemeStore.$override.withValue(ThemeLook(theme: .standard, accent: accent)) {
                for name in [NSAppearance.Name.aqua, .darkAqua] {
                    var track = NSColor.black, raw = NSColor.black
                    NSAppearance(named: name)!.performAsCurrentDrawingAppearance {
                        track = NSColor(SettingsInk.switchOn).usingColorSpace(.sRGB)!
                        raw = PColor.paneAccent.usingColorSpace(.sRGB)!
                    }
                    let ratio = SettingsInk.knobContrast(track)
                    #expect(ratio >= 3, "\(accent), \(name.rawValue): white knob at \(ratio):1")
                    // The accent's own hue: not a grey (its channels still apart as the accent's are).
                    let spread = { (c: NSColor) in max(c.redComponent, c.greenComponent, c.blueComponent) - min(c.redComponent, c.greenComponent, c.blueComponent) }
                    if spread(raw) > 0.1 { #expect(spread(track) > 0.05, "\(accent), \(name.rawValue): still the accent") }
                }
            }
        }
    }
    #endif

    /// Every setting that existed before is in the index, so search finds it, on its page.
    @Test func searchFindsEverySettingByItsWords() {
        let all = Set(SettingsPage.allCases)
        #expect(SettingsIndex.matches("menu bar", available: all).map(\.page) == [.general], "Show in menu bar is on General")
        #expect(SettingsIndex.matches("diagnostics", available: all).map(\.page) == [.security], "diagnostics is on Privacy")
        #expect(SettingsIndex.matches("setup guide", available: all).map(\.page) == [.help], "the setup guide is on Help and feedback, not General")
        #expect(SettingsIndex.matches("recovery", available: all, recoveryKey: true).map(\.page) == [.encryption])
        #expect(SettingsIndex.matches("export", available: all).map(\.menu) == [.export], "Export is File › Export All Notes…")
        #expect(SettingsIndex.matches("sign out", available: all).map(\.page) == [.account])
        #expect(SettingsIndex.matches("name", available: all).map(\.page).contains(.account))
        #expect(!SettingsIndex.matches("STORAGE", available: all).isEmpty && SettingsIndex.matches("STORAGE", available: all).allSatisfy { $0.page == .storage },
                "storage has its own page")
        #expect(SettingsIndex.matches("sync", available: all).allSatisfy { $0.page == .account })
        #expect(SettingsIndex.matches("apple", available: all).isEmpty, "no Sign in with Apple row any more")
        #expect(SettingsIndex.matches("terms", available: all).map(\.page) == [.security])
        #expect(SettingsIndex.matches("", available: all).isEmpty)
        #expect(SettingsIndex.matches("recovery", available: [.account, .appearance], recoveryKey: true).isEmpty, "not on a page that isn't there")
        #expect(SettingsIndex.matches("storage", available: [.account, .general]).isEmpty, "signed out there's no Storage page")
    }

    /// Advanced protection is retired (AdvancedProtection): search finds it only for an account
    /// that has it on, whose Security page shows its switch.
    @Test func searchFindsAdvancedProtectionOnlyWhenItIsOn() {
        let all = Set(SettingsPage.allCases)
        for word in ["advanced", "Advanced protection", "PROTECTION"] {
            #expect(SettingsIndex.matches(word, available: all).isEmpty, "\(word): not found while it's off")
            #expect(SettingsIndex.matches(word, available: all, advancedProtection: AdvancedProtection.shown(.standard)).isEmpty)
            #expect(SettingsIndex.matches(word, available: all, advancedProtection: AdvancedProtection.shown(.strict)).map(\.label) == ["Advanced protection"],
                    "\(word): found while it's on")
        }
        #expect(SettingsIndex.matches("security", available: all).allSatisfy { $0.label != "Advanced protection" })
        // Keys for apps is parked: nothing leads to it, search included. One AI's page needs an AI
        // picked, so search leads to the list (Disconnect an AI).
        #expect(SettingsIndex.matches("disconnect", available: SettingsPage.available(signedIn: true, hasClient: true)).contains { $0.page == .ai })
        for place in SettingsPage.allCases where place != .appKeys && place != .aiConnection {
            #expect(SettingsIndex.all.contains { $0.page == place }, "\(place) has words to find it by")
        }
    }

    @Test func howYouSignInIsSaidPlainly() {
        #expect(SignInShown.label(email: "f7k6w27tsh@privaterelay.appleid.com", apple: true, google: false) == "Apple")
        #expect(SettingsCard.accountLine(email: "f7k6w27tsh@privaterelay.appleid.com") == "Signed in with Apple", "never a relay address under your name")
        #expect(SettingsCard.accountLine(email: "emil@example.com") == "emil@example.com")
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
        #expect(SettingsWindow.size.height <= 760, "fits a 13-inch Mac's screen (about 800 pt under the menu bar)")
    }

    @Test func theCardIsNeverBiggerThanItsWindow() {
        #expect(SettingsCard.size == SettingsWindow.size, "the sheet is the size Settings needs")
        #expect(SettingsCard.fitted(CGSize(width: 1600, height: 1000)) == SettingsCard.size)
        #expect(SettingsCard.fitted(CGSize(width: 800, height: 600)) == CGSize(width: 752, height: 552))
        #expect(SettingsCard.fitted(CGSize(width: 300, height: 200)) == CGSize(width: 600, height: 420), "never so small the page can't be used")
    }

    @Test func aLinkOpensItsPageEvenWhenItWasTheLastOne() {
        let route = SettingsRoute(defaults: UserDefaults(suiteName: "settings-route-\(UUID())")!)
        route.open(.security)
        let first = route.opened
        route.open(.security)
        #expect(route.opened == first + 1)
    }

    // MARK: Help and feedback, a page and the Help menu

    /// The Help menu keeps its items; the Help and feedback page has the same, as on iPhone.
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

    /// Export and Help Connecting an AI are only in menus: search finds them and says which menu.
    @Test func searchSendsWhatMovedToItsMenu() {
        let all = Set(SettingsPage.allCases)
        func first(_ q: String) -> SettingsIndex.Entry? { SettingsIndex.matches(q, available: all).first { $0.menu != nil } }
        #expect(first("export")?.menu == .export && first("export")?.whereItIs == "File menu")
        #expect(first("having trouble")?.menu == .connectHelp && first("having trouble")?.whereItIs == "Help menu")
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
        #expect(asks.pending && route.target == .ai)
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
        let web = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: "web")
        // A page folded into another stays a link that works: the site sends it on (/changelog
        // became the blog's announcements on 7 November 2026; What's New still links there).
        let config = try String(contentsOf: web.appending(path: "next.config.ts"), encoding: .utf8)
        for (url, page) in site {
            #expect(url.absoluteString == "https://pintonotes.com/\(page)")
            let served = FileManager.default.fileExists(atPath: web.appending(path: "app/\(page)/page.tsx").path)
                || config.contains("{ source: \"/\(page)\", destination: ")
            #expect(served, "the site has /\(page), or sends it on")
        }
        for link in AboutSection.links {
            #expect(link.url.absoluteString.hasPrefix("https://github.com/pinto-notes/pinto-notes"), "\(link.title)")
        }
        #expect(AboutSection.links.map(\.id) == ["settings.github", "settings.contribute"])
        #expect(ShareAsk.newIssue.absoluteString.hasPrefix("https://github.com/pinto-notes/pinto-notes"), "Report an issue")
    }

    /// Help by the words people use for it: each finds the Help and feedback page.
    @Test func searchFindsHelpAndFeedback() {
        let all = Set(SettingsPage.allCases)
        for word in ["feedback", "contact", "support", "report", "github"] {
            #expect(SettingsIndex.matches(word, available: all).contains { $0.page == .help && $0.menu == nil }, "\(word) finds Help and feedback")
        }
    }

    /// What's new and the version are at the top of General, with updates; Today's note and
    /// Keyboard shortcuts are pages of their own, found by the words people use (Emil, 7 November 2026).
    @Test func generalStartsWithUpdatesAndFeaturesHaveTheirOwnPages() {
        let all = Set(SettingsPage.allCases)
        #expect(SettingsIndex.matches("what's new", available: all).map(\.page) == [.general])
        for word in ["daily note", "today"] {
            #expect(SettingsIndex.matches(word, available: all).contains { $0.page == .todaysNote }, "\(word) finds Today's note")
        }
        #expect(SettingsIndex.matches("quick note shortcut", available: all).map(\.page) == [.shortcuts])
        #expect(SettingsIndex.matches("shortcuts", available: all).contains { $0.page == .help && $0.id == "settings.openShortcuts" })
        #expect(SettingsPageWord(.todaysNote).rawValue == "todays_note" && SettingsPageWord(.shortcuts).rawValue == "shortcuts")
        #expect(!SettingsIndex.all.contains { $0.page == .general && $0.id?.hasPrefix("settings.today.") == true }, "Today's note left General")
    }

    /// Settings search finds a menu's shortcut by its name ("bold" finds Bold ⌘B), leading to
    /// Keyboard shortcuts; its page lists the menus' shortcuts and finds one by name or keys.
    @Test func shortcutsAreFoundByName() {
        let bar = NSMenu(title: "Main")
        let app = NSMenuItem(title: "Pinto Notes", action: nil, keyEquivalent: ""); app.submenu = NSMenu(title: "Pinto Notes")
        app.submenu?.addItem(NSMenuItem(title: "Settings\u{2026}", action: nil, keyEquivalent: ","))
        let format = NSMenuItem(title: "Format", action: nil, keyEquivalent: ""); format.submenu = NSMenu(title: "Format")
        format.submenu?.addItem(NSMenuItem(title: "Bold", action: nil, keyEquivalent: "b"))
        format.submenu?.addItem(NSMenuItem(title: "Italic", action: nil, keyEquivalent: "i"))
        bar.addItem(app); bar.addItem(format)
        let groups = Shortcuts.groups(in: bar)
        #expect(groups.map(\.menu) == ["Pinto Notes", "Format"])
        let hits = SettingsIndex.shortcuts("bold", in: groups)
        #expect(hits.map(\.label) == ["Bold  \u{2318}B"] && hits.allSatisfy { $0.page == .shortcuts })
        #expect(SettingsIndex.shortcuts("b", in: groups).isEmpty, "one letter finds nothing yet")
        #expect(Shortcuts.filter(groups, "ital").flatMap(\.entries).map(\.title) == ["Italic"])
        #expect(Shortcuts.filter(groups, "").count == 2)
        #expect(KeyboardShortcutsSettingsPage.footer.contains("App Shortcuts"))
    }

    /// The setup guide plays and closes Settings, so the guide is seen. Send
    /// feedback with no mail app copies the address and says so under the button.
    @Test func helpsButtonsEachDoSomethingVisible() async throws {
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
        #expect(PrivacyCopy.settingsPath == "Settings \u{203A} Privacy", "both apps name the page as it is now")
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
        // (Set Password has its own short line since fdbcca48; it says nothing an AI could contradict.)
        #expect(!LockedNotesCopy.setupLine.contains("title"))
        for text in [LockedNotesCopy.footer, LockedNotesCopy.howTo, PrivacyCopy.lockedLine, how] {
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
                     HelpCopy.greeting, HelpCopy.greetingLine, HelpCopy.openSourcePlain, HelpCopy.noMailApp,
                     PrivacyCopy.summary(serverCopy: true), AccountSettingsPage.exportHint, ConnectCopy.shared] {
            #expect(!text.contains("\u{2014}") && !text.contains("\u{2013}"), "\(text)")
        }
    }

    /// Without a notes password Security says how to lock a note; with one, its controls.
    @Test func lockedNotesSaysHowBeforeThereIsAPassword() {
        #expect(LockedNotesSection.shown(setUp: false) == .howTo)
        #expect(LockedNotesSection.shown(setUp: true) == .controls)
    }

    /// Every page of Settings says it's offline at its top, on iPhone too (each page is the same
    /// form there): a page covers the first screen, and Security's Add a device was greyed out unexplained.
    @Test func everyPageSaysWhenItIsOffline() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let view = SettingsView(backend: backend, sync: nil, connections: [])
        let lib = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        for page in [SettingsPage.account, .general, .appearance, .storage, .help, .security] {
            let ax = OffscreenAX(view.page(page).environment(\.networkReach, .offline).modelContainer(lib), size: CGSize(width: SettingsCard.pageWidth, height: 900))
            // A page's accessibility tree can take a moment longer to fill in on a busy machine.
            for _ in 0..<5 where ax.find("settings.offline") == nil { await ax.settle(400) }
            #expect(ax.find("settings.offline") != nil, "\(page) says it's offline: \(ax.ids().prefix(8))")
            ax.close()
        }
    }

    // MARK: Layout (design/settings-layout-connect, 2 November 2026)

    /// Where the card's parts land, as the probe reports them.
    final class Frames { var all: [String: CGRect] = [:] }

    /// Draws Settings offscreen (borderless, far off screen, never ordered front) and reads where
    /// the title, the page and each tab land.
    static func layout(_ start: SettingsPage, window size: CGSize, route: SettingsRoute? = nil) async throws -> [String: CGRect] {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let two = [Connection(id: UUID(), name: "ChatGPT", kind: "oauth", created_at: .now, last_used_at: .now, revoked_at: nil, redirect_host: "chatgpt.com")]
        var view = SettingsView(backend: backend, sync: nil, connections: two, route: route ?? SettingsRoute(defaults: UserDefaults(suiteName: "settings-layout-\(UUID())")!))
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

    /// A sub-page's breadcrumb starts with its parent's name exactly where that name sat as the
    /// parent's own title: going deeper adds to the line, it doesn't move it (Emil, 8 November 2026).
    @Test func theParentsNameStaysPutInTheBreadcrumb() async throws {
        let size = CGSize(width: 1180, height: 760)
        for (child, parent) in [(SettingsPage.personal, SettingsPage.account), (.signIn, .account), (.encryption, .security)] {
            let up = try #require(try await Self.layout(parent, window: size)["title"])
            let crumb = try #require(try await Self.layout(child, window: size)["crumb"], "\(child) shows its parent")
            #expect(abs(crumb.minX - up.minX) < 0.5, "\(child): \(parent.title) at \(crumb.minX), as its own title at \(up.minX)")
            #expect(abs(crumb.midY - up.midY) < 0.5, "\(child): on the same line")
        }
    }

    /// Every page is one column no wider than the cap, centred in the page area, and its title
    /// starts where its content does; on a small window too.
    @Test(arguments: [CGSize(width: 1180, height: 760), CGSize(width: 860, height: 600)])
    func thePageIsACentredColumnUnderItsTitle(window: CGSize) async throws {
        for place in [SettingsPage.account, .ai, .general, .appearance, .security, .storage, .help] {
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
            // Back and Forward start at the content's edge, the title right after them.
            let arrows = try #require(f["arrows"])
            #expect(abs(arrows.minX - (page.minX + SettingsCard.pageInset)) <= bar / 2 + 0.5, "\(place): Back and Forward start at the content's edge: \(arrows.minX) vs \(page.minX + SettingsCard.pageInset)")
            #expect(title.minX > arrows.maxX && title.minX - arrows.maxX < 14, "\(place): the title right after them")
        }
        #expect(SettingsCard.contentWidth >= 480 && SettingsCard.contentWidth <= 620)
    }

    /// AI Connections' line on what is sent and to whom is on the page, under the rows, in view
    /// without scrolling (App Review 5.1.2), inside the content column.
    @Test func connectCardsHaveTheSharingLineInView() async throws {
        let f = try await Self.layout(.ai, window: CGSize(width: 1180, height: 760))
        let page = try #require(f["page"]), area = try #require(f["area"])
        let sent = try #require(f["connect.sent"], "the line on what is sent is on the page")
        #expect(sent.minX >= page.minX && sent.maxX <= page.maxX, "in the column: \(sent) in \(page)")
        #expect(sent.height > 10 && sent.maxY < area.maxY, "in view without scrolling: \(sent) in \(area)")
    }

    /// A card per AI (Emil, 7 November 2026). A connected AI's card says Manage, not Connect, even
    /// when its sign-in calls itself something else: it's placed by where the sign-in went.
    @Test func connectIsACardPerAI() {
        typealias P = ConnectAIPage
        func c(_ name: String, host: String?, days: Double = 0, used: Date? = nil) -> Connection {
            Connection(id: UUID(), name: name, kind: host == nil ? "token" : "oauth", created_at: .now.addingTimeInterval(-86400 * days), last_used_at: used, revoked_at: nil, redirect_host: host)
        }
        let gpt = c("OpenAI connector", host: "chatgpt.com"), gpt2 = c("ChatGPT", host: "chatgpt.com", days: 9)
        let claude = c("claude-ai", host: "claude.ai", used: .now), cursor = c("Cursor", host: "localhost"), codex = c("Codex", host: nil)
        let all = [gpt2, claude, gpt, cursor, codex]
        #expect(P.tile(of: gpt) == .chatgpt, "a ChatGPT sign-in named otherwise is still ChatGPT's")
        #expect(P.tile(of: claude) == .claude)
        #expect(P.tile(of: cursor) == .other && P.tile(of: codex) == .other)
        #expect(P.accounts(.chatgpt, in: all).map(\.id) == [gpt.id, gpt2.id], "newest first")
        #expect(P.accounts(.grok, in: all).isEmpty)
        #expect(P.status(.grok, accounts: []) == "Not connected")
        #expect(P.status(.chatgpt, accounts: [gpt, gpt2]) == "2 accounts")
        #expect(P.status(.claude, accounts: [claude]).hasPrefix("Used "))
        #expect(P.status(.other, accounts: [codex, cursor]) == "2 apps")
        #expect(P.disconnectTitle(claude, tile: .claude, count: 1) == "Disconnect Claude\u{2026}")
        #expect(P.disconnectTitle(gpt2, tile: .chatgpt, count: 2).hasPrefix("Disconnect the account connected "))
        #expect(SetupCards.connectTiles == [.chatgpt, .claude, .grok, .other])
        // iPhone's cards (ConnectChoices) place the same connections the same way.
        #expect(ConnectChoices.cardGuides == [.chatgpt, .claude, .grok, .other])
        #expect(ConnectChoices.cardAccounts(.chatgpt, in: all).map(\.id) == [gpt.id, gpt2.id])
        #expect(Set(ConnectChoices.cardAccounts(.other, in: all).map(\.id)) == [cursor.id, codex.id], "Codex and apps on this computer are Other's")
        #expect(ConnectCopy.cardStatus(other: true, accounts: []).count <= 24, "fits an iPhone card")
    }

    /// Two tabs next to each other in the sidebar never touch, so their fills never merge.
    @Test func adjacentTabsHaveAGap() async throws {
        let f = try await Self.layout(.security, window: CGSize(width: 1180, height: 760))
        var pairs = 0
        for group in SettingsPage.groups(available: Set(SettingsPage.allCases)) {
            // The account stands apart above the pages, as in System Settings.
            let pages = group.filter { $0 != .account }
            for (a, b) in zip(pages, pages.dropFirst()) {
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
        #expect(ConnectAIPage.more(offered: [.chatgpt, .claude, .grok, .codex, .other]) == [.codex], "Codex stays reachable")
        #expect(ConnectCopy.why.hasSuffix(ConnectCopy.shared), "the line on what is shared is the same words everywhere")
    }

    /// Connect an AI says what is sent and to which company, by name, always in view (App Review
    /// rejected 1.2 for hiding it); one row per AI there is, connected or not, and never Mistral.
    @Test func connectSaysWhatIsSentAndToWhom() async throws {
        // One line: what it does, and that the notes it opens go to the company that makes it.
        #expect(ConnectAIPage.sent.contains("read and edit your notes") && ConnectAIPage.sent.contains("go to its maker"))
        #expect(ConnectAIPage.sent.contains("OpenAI") && ConnectAIPage.sent.contains("Anthropic"))
        for g in ConnectAISection.Guide.allCases { #expect(!ConnectAIPage.line(g).isEmpty && !ConnectAIPage.line(g).contains("\u{2014}")) }
        #expect(!ConnectAISection.Guide.allCases.contains { $0.title.localizedCaseInsensitiveContains("mistral") || $0.title.localizedCaseInsensitiveContains("le chat") }, "never Mistral")
        // On the page, said in words, not behind a disclosure; Having trouble? is in the Help menu.
        let view = SettingsView(backend: Backend(testClient: CaptureScreen.client, email: "sara@example.com"), sync: nil, connections: [])
        let ax = OffscreenAX(view.page(.ai), size: CGSize(width: SettingsCard.pageWidth, height: 900))
        defer { ax.close() }
        await ax.settle(400)
        let sent = try #require(ax.find("connect.sent"), "\(ax.ids())")
        #expect(sent.text.contains("go to its maker"), "\(sent.text)")
        #expect(ax.find("connect.trouble") == nil)
    }

    /// One row per AI: a connected one in its place (each account its own row), the rest with
    /// Connect…; connections no AI in the list made after them; Another AI last, always there.
    @Test func connectIsOneRowPerAI() {
        let all: [ConnectAISection.Guide] = [.chatgpt, .claude, .grok, .codex, .other]
        func c(_ name: String, host: String? = nil) -> Connection {
            Connection(id: UUID(), name: name, kind: host == nil ? "token" : "oauth", created_at: .now, last_used_at: .now.addingTimeInterval(-120), revoked_at: nil, redirect_host: host)
        }
        let none = ConnectAIPage.rows(offered: all, connections: [])
        #expect(none.map(\.guide) == all && none.allSatisfy { $0.connection == nil })
        let gpt = c("ChatGPT", host: "chatgpt.com"), local = c("My tool", host: "localhost")
        let rows = ConnectAIPage.rows(offered: all, connections: [gpt, local])
        #expect(rows.map(\.guide) == [.chatgpt, .claude, .grok, .codex, nil, .other])
        #expect(rows[0].connection?.id == gpt.id, "ChatGPT's row is its connection")
        #expect(rows[4].connection?.id == local.id && rows.last?.connection == nil, "the app on this computer, then Another AI")
        #expect(ConnectAIPage.detail(rows[0]) == "Used 2 minutes ago", "a connected one says when it was last used")
        #expect(ConnectAIPage.detail(rows[4]).hasPrefix("localhost"), "one the list can't name says where access went")
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
        for part in ["account.photo", "account.name"] {
            #expect(frames.all[part] != nil, "\(part) is there")
        }
        #expect(frames.all["account.delete"] == nil, "Delete Account… is on Sign-in and security, not beside Sign Out…")
        let photo = try #require(frames.all["account.photo"]), name = try #require(frames.all["account.name"])
        #expect(name.minY > photo.maxY && abs(name.midX - photo.midX) < 1, "the name centred under the photo, as System Settings shows you")
        #expect(status.minY > name.maxY, "sync is a row under you")
        // What the status runs when clicked: a sync.
        AccountSettingsPage.syncNow(nil) { synced.n += 1 }
        for _ in 0..<20 where synced.n == 0 { try await Task.sleep(for: .milliseconds(50)) }
        #expect(synced.n == 1)
        // Sync Now beside when it last synced (Emil, 7 November 2026), no Export on the Mac (it's
        // File › Export All Notes…); Sign Out… is under you.
        let ax = OffscreenAX(AccountSettingsPage(backend: backend, sync: nil).modelContainer(try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))),
                             size: CGSize(width: SettingsCard.pageWidth, height: 700))
        await ax.settle(400)
        let ids = ax.ids()
        ax.close()
        for gone in ["settings.exportNotes", "settings.connectApple"] { #expect(!ids.contains(gone), "\(gone) is not on the Mac's Account") }
        for here in ["settings.signOut", "settings.syncNow", "settings.syncStatus", "settings.profileName", "settings.openPersonal", "settings.openSignIn", "settings.accountDevices"] { #expect(ids.contains(here), "\(here): \(ids)") }
        #expect(!ids.contains("settings.deleteAccount"), "not on Account's own page")
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
        #expect(synced.n == 2, "clicking Sync Now syncs now")
    }

    @Test func theSyncLineIsShort() {
        let now = Date.now
        #expect(AccountSettingsPage.syncLine(.synced(now.addingTimeInterval(-10)), reach: .online, now: now) == "Synced just now")
        #expect(AccountSettingsPage.syncLine(.synced(now.addingTimeInterval(-300)), reach: .online, now: now).hasPrefix("Synced "))
        #expect(AccountSettingsPage.syncLine(.syncing, reach: .online, now: now) == "Syncing\u{2026}")
        #expect(AccountSettingsPage.syncLine(.idle, reach: .online, now: now) == "Syncs on its own", "never a bare \"Not synced yet\", which reads as broken")
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
        #expect(AIChangesStatus.offersConnect(ais: []) && !AIChangesStatus.offersConnect(ais: ["Claude"]), "no AI yet: a way to connect one")
        #expect(SettingsCardHost.takes(active: false, key: nil), "no window key, as at launch")
        #expect(SettingsCardHost.takes(active: false, key: K(settings: true)), "Settings in front")
        #expect(SettingsCardHost.takes(active: false, key: K(sheet: true)), "the sign-in card in front")
        #expect(!SettingsCardHost.takes(active: false, key: K()), "another window in front takes it, not this one")
    }
    #endif

}

/// Every page is one view on both apps, built from the rows the search index lists: each row
/// the index names is on its page, drawn, and search finds it by its words. Drawn on the Mac;
/// iPhone builds its pages from the same views (SettingsView.page).
@MainActor @Suite(.serialized) struct SettingsPageRowTests {
    static func ids(_ page: SettingsPage, backend: Backend, crypto: AccountCrypto = .shared, height: CGFloat = 1600) async throws -> [String] {
        let view = SettingsView(backend: backend, sync: nil, crypto: crypto, devices: AddDeviceSnapshots.devices([SecurityPageSnapshots.mac]),
                                connections: SecurityPageSnapshots.ais)
        let lib = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ax = OffscreenAX(view.page(page).modelContainer(lib), size: CGSize(width: SettingsCard.pageWidth, height: height))
        defer { ax.close() }
        await ax.settle(600)
        // Under load the offscreen page can answer nothing at first, or its last sections a beat
        // later: read until two non-empty reads agree.
        var ids = ax.ids()
        for _ in 0..<12 {
            await ax.settle(250)
            let again = ax.ids()
            if !again.isEmpty, Set(again) == Set(ids) { break }
            ids = again
        }
        return ids
    }

    /// Privacy is two rows, Encryption and Diagnostics (Emil, 7 November 2026); what it had is on
    /// Encryption, one level down, the devices (with Remove… and Add a device) on Account, and each
    /// AI's Disconnect on AI Connections.
    @Test func privacyIsEncryptionAndDiagnostics() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let crypto = try await AddDeviceSnapshots.ready(backedUp: true, recoverySaved: true)
        defer { crypto.signedOut() }
        let privacy = try await Self.ids(.security, backend: backend, crypto: crypto)
        for here in ["privacy.encryption", "settings.diagnostics"] { #expect(privacy.contains(here), "\(here) on Privacy: \(privacy)") }
        for gone in ["privacy.thisDevice", "privacy.device", "privacy.removeDevice", "privacy.addDevice", "privacy.disconnectAI",
                     "privacy.recoveryStatus", "privacy.recoveryRow", "privacy.howItWorks"] {
            #expect(!privacy.contains(gone), "\(gone) is not on Privacy any more")
        }
        let encryption = try await Self.ids(.encryption, backend: backend, crypto: crypto)
        #expect(encryption.contains("privacy.recoveryStatus") || encryption.contains("privacy.recoveryRow"), "the recovery key: \(encryption)")
        #expect(encryption.contains("privacy.howItWorks"))
        for gone in ["privacy.thisDevice", "privacy.removeDevice", "privacy.disconnectAI", "settings.diagnostics"] {
            #expect(!encryption.contains(gone), "\(gone) is not on Encryption")
        }
        let account = try await Self.ids(.account, backend: backend, crypto: crypto)
        #expect(account.contains("privacy.addDevice"), "Add a device is on Account's Devices: \(account)")
        let all = Set(SettingsPage.allCases)
        #expect(SettingsIndex.matches("advanced protection", available: all, advancedProtection: true).map(\.page) == [.encryption])
        #expect(SettingsIndex.matches("recovery key", available: all, recoveryKey: true).map(\.page) == [.encryption])
        #expect(SettingsIndex.matches("diagnostics", available: all).map(\.page) == [.security])
        #expect(SettingsPage.encryption.parent == .security)
        #expect(SettingsPageWord(.encryption) == .encryption)
        #expect(PrivacyPage.encryptionLine(advanced: false) == "Your notes are encrypted", "never end-to-end by default")
    }

    @Test func everyRowIsOnItsPageAndSearchFindsIt() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let kept = StorageStore.shared.usage
        StorageStore.shared.usage = StorageUsage(used: 1_240_000_000, limit: 2_147_483_648, notes: 41_000_000, files: 900_000_000, apps: 0, deleted: 0, versions: 0)
        defer { StorageStore.shared.usage = kept }
        let crypto = try await AddDeviceSnapshots.ready(backedUp: true, recoverySaved: true)
        defer { crypto.signedOut() }
        let all = Set(SettingsPage.allCases)
        var checked = 0
        for page in SettingsPage.groups.flatMap({ $0 }) + [.account, .personal, .signIn] {
            let ids = try await Self.ids(page, backend: backend, crypto: crypto)
            for entry in SettingsIndex.all where entry.page == page {
                #expect(SettingsIndex.matches(entry.label, available: all, advancedProtection: true, recoveryKey: true).contains(entry),
                        "search finds \(entry.label)")
                guard let id = entry.id else { continue }
                checked += 1
                #expect(ids.contains(id), "\(page): \(entry.label) (\(id)) is on the page: \(ids)")
            }
        }
        #expect(checked >= 28, "checked \(checked) rows")
    }

    /// On the Mac the setup guide is in the Help menu only, not a row in Settings (Emil, 8 November
    /// 2026: the row dropped you into importing notes, "kinda off"); search still finds it, as the menu item.
    /// Your email is blurred wherever it's shown, so a screenshot or a recording doesn't give it
    /// away; the pointer (or a tap on iPhone) shows it (Emil, 8 November 2026).
    @Test func theEmailIsBlurredOnScreen() throws {
        #expect(PrivateBlur.hides("emil@example.com"))
        #expect(!PrivateBlur.hides("Signed in with Apple") && !PrivateBlur.hides("Hidden by Apple") && !PrivateBlur.hides("Sign in to sync"))
        let places: [(String, String)] = [
            ("Pane/Views/SidebarView.swift", ".privateBlur(email)"),
            ("Pane/Views/SettingsCard.swift", ".privateBlur(Self.accountLine(backend))"),
            ("Pane/Views/SettingsView.swift", ".privateBlur(AccountLine.shown(email: email))"),
            ("Pane/Views/SettingsPages.swift", ".privateBlur(Self.accountEmail("),
            ("Pane/Views/SignInView.swift", ".privateBlur(flow.email"),
            ("Pane/Views/WelcomeEmailSignIn.swift", ".privateBlur(model.flow.email"),
        ]
        for (file, call) in places { #expect(try SettingsHomeTests.source(file).contains(call), "\(file) shows the email unblurred") }
        #expect(!(try SettingsHomeTests.source("Pane/Views/Encryption.swift")).contains("Password for \\(email)"), "the password field names the address")
    }

    @Test func theSetupGuideIsInTheHelpMenuOnly() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        #expect(!(try await Self.ids(.help, backend: backend)).contains("settings.setupGuide"))
        let found = SettingsIndex.all.first { $0.label == "Show Setup Guide" }
        #expect(found?.menu == .setupGuide && found?.whereItIs == "Help menu")
        // Terms and the privacy policy are rows on Help and Privacy, not centred links.
        for page in [SettingsPage.help, .security] {
            let ids = try await Self.ids(page, backend: backend)
            #expect(ids.contains("settings.terms") && ids.contains("settings.privacy"), "\(page)")
        }
        // Signed out, Account offers Sign In… (where the build can sign in at all).
        #expect(try await Self.ids(.account, backend: Backend(watching: CaptureScreen.client)).contains("settings.signIn"))
    }
}

/// Settings › General's rows on the Mac: the quick note shortcut, open at login, and search.
@MainActor @Suite struct GeneralSettingsTests {
    @Test func aShortcutNeedsCommandOptionOrControl() throws {
        #expect(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_ANSI_N), flags: [], characters: "n") == nil, "a bare letter would take it from every app")
        #expect(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_ANSI_N), flags: .shift, characters: "N") == nil)
        let s = try #require(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_ANSI_N), flags: [.control, .option], characters: "n"))
        #expect(s.display == "\u{2303}\u{2325}N" && s.keyCode == UInt32(kVK_ANSI_N) && s.modifiers == UInt32(controlKey | optionKey))
        #expect(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_Space), flags: [.option], characters: " ")?.display == "\u{2325}Space")
        #expect(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_ANSI_N), flags: [.command, .shift, .option, .control], characters: "n")?.display == "\u{2303}\u{2325}\u{21E7}\u{2318}N", "in the menus' order")
        for clear in [kVK_Delete, kVK_ForwardDelete, kVK_Escape] {
            #expect(QuickNoteHotKey.shortcut(keyCode: UInt16(clear), flags: .command, characters: nil) == nil, "Delete clears and Escape cancels")
        }
    }

    @Test func theShortcutIsKeptAndCleared() throws {
        let keys = QuickNoteHotKey.shared
        defer { keys.shortcut = nil }
        #expect(keys.shortcut == nil, "none until one is recorded")
        let s = try #require(QuickNoteHotKey.shortcut(keyCode: UInt16(kVK_ANSI_J), flags: [.control, .command], characters: "j"))
        keys.shortcut = s
        #expect(keys.shortcut == s)
        keys.shortcut = nil
        #expect(keys.shortcut == nil && QuickNoteHotKey.store.data(forKey: QuickNoteHotKey.key) == nil)
    }

    @Test func openAtLoginAsksTheSystem() {
        let fake = MemoryLoginService()
        let real = LoginItem.service
        LoginItem.service = fake
        defer { LoginItem.service = real }
        #expect(!LoginItem.isOn)
        #expect(LoginItem.set(true) && LoginItem.isOn && fake.isEnabled)
        #expect(LoginItem.set(false) && !LoginItem.isOn)
    }

    /// Help opens with Emil and a way to write to him; one Write to me in place of Send feedback and
    /// Report an issue; the project on GitHub is one line (Emil, 7 November 2026).
    @Test func helpOpensWithEmilAndOneWayToWrite() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let ids = try await SettingsPageRowTests.ids(.help, backend: backend)
        for here in ["settings.greeting", "settings.feedback", "settings.support", "settings.github"] { #expect(ids.contains(here), "\(here): \(ids)") }
        for gone in ["settings.reportIssue", "settings.contribute", "settings.whatsNew"] { #expect(!ids.contains(gone), "\(gone) is not on Help") }
        #expect(HelpCopy.greeting == "Hi, I\u{2019}m Emil. I make Pinto Notes.")
        #expect(String(HelpCopy.openSourceLine.characters) == HelpCopy.openSourcePlain)
        let links = HelpCopy.openSourceLine.runs.compactMap(\.link)
        #expect(links == [ShareAsk.repository, ShareAsk.contributing])
        // Write to me: the address, with the version and the system filled in.
        let mail = HelpCopy.mail(version: "1.3 (1)", system: "macOS 27.2").absoluteString
        #expect(mail.hasPrefix("mailto:hello@pintonotes.com") && mail.contains("1.3") && mail.contains("macOS"))
        #expect(NSImage(named: "EmilWagman") != nil, "his photo is in the app")
        // Search still finds where to write and the project.
        let all = Set(SettingsPage.allCases)
        for words in ["feedback", "report", "bug", "github"] {
            #expect(SettingsIndex.matches(words, available: all).map(\.page).contains(.help), "\(words) finds Help")
        }
    }

    /// A Settings row's hover is the whole row: its box's edges and the row's height, the box's
    /// corners only at its ends (Emil, 7 November 2026: no button inside the row).
    @Test func aRowsHoverFillsItsBoxEdgeToEdge() {
        #expect(SettingsRowEdge.of(0, in: 1) == .alone)
        #expect([0, 1, 2].map { SettingsRowEdge.of($0, in: 3) } == [.top, .middle, .bottom])
        let r = SettingsRowBox.radius
        let middle = SettingsRowBox.shape(.middle), top = SettingsRowBox.shape(.top), bottom = SettingsRowBox.shape(.bottom)
        #expect(middle.cornerRadii.topLeading == 0 && middle.cornerRadii.bottomTrailing == 0)
        #expect(top.cornerRadii.topLeading == r && top.cornerRadii.bottomLeading == 0)
        #expect(bottom.cornerRadii.bottomTrailing == r && bottom.cornerRadii.topTrailing == 0)
        #expect(SettingsRowBox.inset.leading > 0 && SettingsRowBox.inset.top > 0, "it reaches past the row's content to the box")
    }

    /// Today's note and the Quick note shortcut moved to pages of their own (Emil, 7 November 2026).
    @Test func searchFindsTheNewRows() {
        for (words, label, page) in [("daily", "Today\u{2019}s note template", SettingsPage.todaysNote),
                                     ("template", "Today\u{2019}s note template", .todaysNote),
                                     ("hotkey", "Quick note shortcut", .shortcuts),
                                     ("login", "Open at login", .general), ("ticked", "Ticked items move to the bottom", .general)] {
            let found = SettingsIndex.all.filter { e in ([e.label] + e.also).contains { $0.localizedCaseInsensitiveContains(words) } }
            #expect(found.contains { $0.label == label && $0.page == page }, "\(words) finds \(label) on \(page)")
        }
    }

    @Test func generalSaysItInPlainWords() {
        #expect(GeneralCopy.todayFooter == "In the template, {{date}} becomes the date and {{time}} the time.")
        #expect([GeneralCopy.openOnLaunch, GeneralCopy.ticked, GeneralCopy.shortcut, GeneralCopy.shortcutDetail, GeneralCopy.login]
                == ["Open today\u{2019}s note when Pinto starts", "Ticked items move to the bottom", "Quick note shortcut", "Works in any app.", "Open at login"])
        #expect(GeneralCopy.checklists == "Checklists" && GeneralCopy.thisMac == "This Mac")
    }
}
/// Account like System Settings' Apple Account (Emil, 7 November 2026): Back and Forward on every
/// page, your details and how you sign in one level down, your devices, Sign Out… at the end and
/// Delete Account… away from it.
@MainActor @Suite struct AccountPagesTests {
    @Test func backAndForwardWalkWhereYouHaveBeen() {
        var h = SettingsHistory()
        #expect(!h.canGoBack && !h.canGoForward && h.place == nil)
        h.open(.general, from: [.account])
        #expect(h.place == [.general] && h.canGoBack && !h.canGoForward)
        h.open(.signIn, from: [.general])
        #expect(h.place == [.account, .signIn], "a page one level down opens over its parent")
        h.back()
        #expect(h.place == [.general] && h.canGoForward)
        h.back()
        #expect(h.place == [.account] && !h.canGoBack)
        h.back()
        #expect(h.place == [.account], "greyed at the start: nothing happens")
        h.forward(); h.forward()
        #expect(h.place == [.account, .signIn] && !h.canGoForward)
        h.back()
        h.open(.appearance, from: [.general])
        #expect(h.place == [.appearance] && !h.canGoForward, "a new page drops Forward, as a browser does")
        h.open(.appearance, from: [.appearance])
        h.back()
        #expect(h.place == [.general], "opening the page you're on adds nothing")
        h.open(.account, from: [.general]); h.open(.personal, from: [.account])
        #expect(h.place == [.account, .personal])
        h.open(.signIn, from: [.account, .personal])
        #expect(h.place == [.account, .signIn], "a sibling replaces, it doesn't stack")
    }

    @Test func accountsPagesAreThereSignedInOnly() {
        let on = SettingsPage.available(signedIn: true, hasClient: true)
        #expect(on.isSuperset(of: [.personal, .signIn]))
        #expect(SettingsPage.available(signedIn: false, hasClient: true).isDisjoint(with: [.personal, .signIn]))
        #expect(SettingsPage.groups(available: on).flatMap { $0 }.allSatisfy { $0.parent == nil }, "never in the sidebar")
        #expect(SettingsPage.personal.title == "Personal information" && SettingsPage.signIn.title == "Sign-in and security")
        #expect(SettingsPageWord(.signIn) == .signIn && SettingsPageWord(.signIn).rawValue == "sign_in" && SettingsPageWord(.personal).rawValue == "personal")
        #expect(SettingsIndex.all.first { $0.label == "Delete account" }?.page == .signIn)
    }

    @Test func howYouSignInIsSaidAndTheRelayNeverShows() {
        let relay = "f7k6w27tsh@privaterelay.appleid.com"
        #expect(AccountSettingsPage.signInWay(email: relay, apple: true, google: false) == "Apple")
        #expect(AccountSettingsPage.signInWay(email: "sara@example.com", apple: false, google: true) == "Google")
        #expect(AccountSettingsPage.signInWay(email: "sara@example.com", apple: false, google: false) == "Email")
        #expect(AccountSettingsPage.accountEmail(relay) == "Hidden by Apple")
        #expect(SettingsCard.accountLine(email: relay) == "Signed in with Apple")
    }

    @Test func devicesAreThisOneThenTheOthers() {
        let lines = AccountSettingsPage.deviceLines(others: [SecurityPageSnapshots.mac, SecurityPageSnapshots.phone])
        #expect(lines.first?.detail == PrivacyCopy.thisDevice)
        #expect(lines.count == 3)
        #expect(lines.dropFirst().allSatisfy { $0.detail.contains("\u{00B7}") })
    }

    @Test func subPagesShowTheirRows() async throws {
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com")
        let personal = try await SettingsPageRowTests.ids(.personal, backend: backend)
        #expect(personal.contains("settings.personalName") && personal.contains("settings.choosePhoto"))
        let signIn = try await SettingsPageRowTests.ids(.signIn, backend: backend)
        for id in ["settings.signInWith", "settings.deleteAccount", "settings.openPrivacy"] { #expect(signIn.contains(id), "\(id): \(signIn)") }
        #expect(!signIn.contains("settings.signOut"))
    }

    /// The card's sidebar and page have the window's line between them, the card's full height.
    @Test func theCardHasALineBetweenSidebarAndPage() async throws {
        let f = try await SettingsHomeTests.layout(.general, window: CGSize(width: 1180, height: 760))
        let line = try #require(f["divider"], "the line is drawn")
        let area = try #require(f["area"])
        #expect(line.width > 0 && line.width <= 1, "one pixel: \(line.width)")
        #expect(abs(line.maxX - area.minX) < 0.5, "against the page: \(line) \(area)")
        #expect(abs(line.height - area.height) < 0.5, "the card's full height: \(line.height) vs \(area.height)")
        let arrows = try #require(f["arrows"], "Back and Forward are on every page")
        let title = try #require(f["title"])
        #expect(arrows.maxX < title.minX && abs(arrows.midY - title.midY) < 2)
    }
}

#endif
