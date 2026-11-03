#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Settings on the Mac, a card with its pages in a sidebar: few pages in a few groups, every
/// setting found by its words, links landing on their page, and how you sign in said plainly.
@MainActor @Suite(.serialized) struct SettingsHomeTests {
    /// Direction A (3 November 2026): Account, Connect an AI and Appearance; Security and Storage;
    /// Help and feedback. No General page: its switches are on Appearance and Help.
    @Test func theSidebarIsAccountFirstWithNoGeneral() {
        let all = Set(SettingsPlace.allCases)
        let groups = SettingsPlace.groups(available: all)
        #expect(groups == [[.account, .ai, .appearance], [.security, .storage], [.help]])
        #expect(!groups.joined().contains(.appKeys), "Keys for apps sits under Connect an AI")
        #expect(!SettingsPlace.allCases.map(\.rawValue).contains("general") && !SettingsPlace.allCases.map(\.rawValue).contains("profile"))
        // Signed out: only what there is.
        #expect(SettingsPlace.groups(available: [.account, .appearance, .help]) == [[.account, .appearance], [.help]])
        #expect(SettingsCard.first(all) == .account, "Settings opens at Account, never at Connect an AI")
        #expect(SettingsCard.first([.appearance, .help]) == .appearance)
        for place in SettingsPlace.allCases {
            #expect(!place.intro.isEmpty && place.intro.hasSuffix(".") && !place.intro.contains("\u{2014}"), "\(place) has one plain line under its title")
        }
        #expect(SettingsPlace.account.intro == "Who you are here, and how you sign in.")
    }

    /// iPhone keeps its own list (General is still a page there); the pages both have come in the
    /// same order.
    @Test func iPhoneGroupsFollowTheMacsOrder() throws {
        let mac = SettingsPlace.groups(available: Set(SettingsPlace.allCases)).joined()
        let phone = SettingsTab.phoneGroups.joined().map(SettingsPlace.init)
        let shared = phone.filter(mac.contains)
        var seen: [SettingsPlace] = []
        for p in shared where !seen.contains(p) { seen.append(p) }
        #expect(seen == mac.filter(seen.contains), "the iPhone's pages come in the Mac's order: \(seen)")
        #expect(SettingsTab.phoneGroups.last == [.help], "Help and feedback, alone and last, as on the Mac")
        let source = try Self.source("Pane/Views/SettingsView.swift")
        #expect(source.contains("ForEach(Array(SettingsTab.phoneGroups.enumerated())"), "the iPhone list is built from phoneGroups")
    }

    static func source(_ path: String) throws -> String {
        try String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appending(path: path), encoding: .utf8)
    }

    @Test func linksIntoSettingsLandOnTheirPage() {
        #expect(SettingsPlace(.account) == .account, "the account menu's Account opens Account")
        #expect(SettingsPlace(.ai) == .ai)
        #expect(SettingsPlace(.storage) == .storage)
        #expect(SettingsPlace(.security) == .security)
        #expect(SettingsPlace(.general) == .appearance, "General's switches moved: Show in menu bar is on Appearance")
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
        #expect(SettingsIndex.matches("theme", available: [.account, .help]).isEmpty, "not when the page isn't there")
    }

    /// Every setting that existed before is in the index, so search finds it, on its page.
    @Test func searchFindsEverySettingByItsWords() {
        let all = Set(SettingsPlace.allCases)
        #expect(SettingsIndex.matches("menu bar", available: all).map(\.place) == [.appearance], "Show in menu bar moved to Appearance")
        #expect(SettingsIndex.matches("diagnostics", available: all).map(\.place) == [.help], "diagnostics moved to Help and feedback")
        #expect(SettingsIndex.matches("recovery", available: all, recoveryKey: true).map(\.place) == [.security])
        #expect(SettingsIndex.matches("export", available: all).map(\.place) == [.account])
        #expect(SettingsIndex.matches("sign out", available: all).map(\.place) == [.account])
        #expect(SettingsIndex.matches("name", available: all).map(\.place).contains(.account))
        #expect(SettingsIndex.matches("STORAGE", available: all).allSatisfy { $0.place == .storage })
        #expect(SettingsIndex.matches("", available: all).isEmpty)
        #expect(SettingsIndex.matches("recovery", available: [.account, .help], recoveryKey: true).isEmpty, "not on a page that isn't there")
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
        let mac = try Self.source("Pane/Views/SettingsPages.swift")
        #expect(mac.contains("if HelpPage.offersSetupGuide(signedIn: signedIn)") && mac.contains("HelpPage.playSetupGuide(close: close)")
                && mac.contains("noMail = HelpPage.mailed(accepted: accepted, copy: copy)"), "the Mac's page uses the same steps")
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
        // With a copy kept by Pinto Notes, the page says Pinto Notes can open the notes too.
        #expect(PrivacyCopy.backInFooterWithCopy.contains("Pinto Notes can open them too"))
        // How an AI opens the notes: its own copy of the key, locked to its token, open in memory
        // only during a request, never Pinto Notes' copy.
        let ai = PrivacyCopy.how(serverCopy: true, advanced: false, keychain: false, recovery: false).first { $0.title == "Connected AIs" }?.line ?? ""
        for part in ["its own copy of your key", "token", "in memory only while", "doesn\u{2019}t use Pinto Notes\u{2019} copy"] {
            #expect(ai.contains(part), "\(part)")
        }
        // Locked notes: an AI sees their titles, not their contents, and keeps what it already read.
        for text in [LockedNotesCopy.footer, LockedNotesCopy.howTo] { #expect(text.contains("title"), "\(text)") }
        #expect(LockedNotesCopy.footer.contains("titles of locked notes, not what\u{2019}s in them") && LockedNotesCopy.footer.contains("stays with that AI"))
        #expect(LockedNotesCopy.howTo == "An AI can see the title, not what\u{2019}s inside. Lock one from a note\u{2019}s \u{2022}\u{2022}\u{2022} menu.")
        #expect(!LockedNotesCopy.howTo.contains("AIs"), "\"AIs\" reads as \"Als\"")
        #expect([PrivacyCopy.showRecovery, PrivacyCopy.hideRecovery, PrivacyCopy.saveRecovery] == ["Show Recovery Key", "Hide Recovery Key", "Save Recovery Key\u{2026}"])
        #expect(LockedNotesCopy.header == "Locked notes")
        for text in [PrivacyCopy.status, PrivacyCopy.backInFooterWithCopy, PrivacyCopy.backInFooterDevicesOnly, PrivacyCopy.aiFooter, LockedNotesCopy.howTo, LockedNotesCopy.footer,
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
        for place in [SettingsPlace.account, .ai, .appearance, .security, .storage, .help] {
            let f = try await Self.layout(place, window: window)
            let page = try #require(f["page"], "\(place): the page reports its frame")
            let area = try #require(f["area"])
            let title = try #require(f["title"])
            #expect(page.width <= SettingsCard.pageWidth + 0.5, "\(place): the column is capped at \(SettingsCard.pageWidth), was \(page.width)")
            #expect(abs(page.width - min(SettingsCard.pageWidth, area.width - 2 * SettingsCard.gutter)) < 0.5, "\(place): as wide as the cap or the room allows")
            #expect(abs(page.midX - area.midX) < 0.5, "\(place): centred, page \(page) in area \(area)")
            #expect(abs(title.minX - (page.minX + SettingsCard.pageInset)) < 0.5, "\(place): the title starts at the content's edge: \(title.minX) vs \(page.minX + SettingsCard.pageInset)")
        }
        #expect(SettingsCard.contentWidth >= 560 && SettingsCard.contentWidth <= 620)
    }

    /// Connect an AI's boxes fill the content column, their left edge under the title's; what is
    /// connected comes before what there is to add.
    @Test func connectBoxesLineUpWithTheTitle() async throws {
        let f = try await Self.layout(.ai, window: CGSize(width: 1180, height: 760))
        let add = try #require(f["connect.add"], "the AIs to add are on the page")
        let title = try #require(f["title"]), page = try #require(f["page"])
        #expect(abs(add.minX - title.minX) < 0.5, "add \(add.minX), title \(title.minX)")
        #expect(abs(add.width - (page.width - 2 * SettingsCard.pageInset)) < 0.5)
        let list = try #require(f["connect.connected"], "what is connected is listed")
        #expect(list.maxY < add.minY && abs(list.minX - add.minX) < 0.5)
    }

    /// Two tabs next to each other in the sidebar never touch, so their fills never merge.
    @Test func adjacentTabsHaveAGap() async throws {
        let f = try await Self.layout(.storage, window: CGSize(width: 1180, height: 760))
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
    /// rejected 1.2 for hiding it); every AI there is to add has a row, less those connected, and
    /// never Mistral.
    @Test func connectSaysWhatIsSentAndToWhom() throws {
        #expect(ConnectAIPage.sent(["ChatGPT", "Claude"]) == "The notes ChatGPT opens go to OpenAI and the notes Claude opens go to Anthropic. Nothing is shared until you allow it.")
        #expect(ConnectAIPage.sent(["Grok"]) == "The notes Grok opens go to xAI. Nothing is shared until you allow it.")
        #expect(ConnectAIPage.sent([]) == ConnectCopy.shared, "before any is connected, the general line")
        #expect(ConnectAIPage.sent(["ChatGPT", "An app on this computer"]).contains("Other connected apps get only the notes they open."))
        #expect(ConnectAIPage.headline([]) == "No AI can open your notes yet")
        #expect(ConnectAIPage.headline(["ChatGPT", "Claude"]) == "ChatGPT and Claude can open your notes")
        #expect(ConnectAIPage.headline(["ChatGPT", "Claude", "Grok"]) == "ChatGPT, Claude and Grok can open your notes")
        let all: [ConnectAISection.Guide] = [.chatgpt, .claude, .grok, .codex, .incredible, .other]
        #expect(ConnectAIPage.addable(offered: all, connected: ["ChatGPT", "Claude"]) == [.grok, .codex, .incredible, .other])
        #expect(ConnectAIPage.addable(offered: all, connected: []) == all)
        for g in all { #expect(!ConnectAIPage.line(g).isEmpty && !ConnectAIPage.line(g).contains("\u{2014}")) }
        let src = try Self.source("Pane/Views/ConnectAI.swift")
        let page = try #require(src.range(of: "struct ConnectAIPage").map { src[$0.lowerBound...] })
        let body = String(page.prefix(while: { _ in true }).prefix(9000))
        #expect(body.contains("Text(Self.sent(names))") && !body.contains("DisclosureGroup"), "the line is on the page, not behind a disclosure")
        #expect(!ConnectAISection.Guide.allCases.contains { $0.title.localizedCaseInsensitiveContains("mistral") || $0.title.localizedCaseInsensitiveContains("le chat") }, "never Mistral")
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
}
#endif
