import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

#if os(macOS)

/// The pages of Settings on the Mac (SettingsCard), in its sidebar's order: Account, Connect an
/// AI, Appearance, Privacy and security (Emil, 3 November 2026: "simplify and cut things"). No
/// Storage page (its bar is on Account) and no Help and feedback page (its links are in the Help
/// menu). Keys for apps is one level down from Connect an AI.
enum SettingsPlace: String, Hashable, CaseIterable, Identifiable {
    case account, ai, appearance, security, appKeys
    var id: String { rawValue }

    var title: String {
        switch self {
        case .account: "Account"
        case .ai: "Connect an AI"
        case .appearance: "Appearance"
        case .security: "Privacy and security"
        case .appKeys: "Keys for apps"
        }
    }

    /// Monochrome, like System Settings' sidebar in its plain form. Account shows your photo instead.
    var symbol: String {
        switch self {
        case .account: "person.crop.circle"
        case .ai: "sparkles"
        case .appearance: "circle.lefthalf.filled"
        case .security: "lock"
        case .appKeys: "key"
        }
    }

    /// Where a link into Settings lands (a card, the storage warning, an alert). Pages that went:
    /// Storage's bar is on Account; General's switch is on Appearance; Help's links are in the Help
    /// menu, so a link to it opens Account.
    init(_ tab: SettingsTab) {
        switch tab {
        case .account, .storage, .help: self = .account
        case .ai: self = .ai
        case .security: self = .security
        case .general, .appearance: self = .appearance
        }
    }

    /// The sidebar's pages, in order, from the places there is something on. Keys for apps sits
    /// under Connect an AI, not in the sidebar.
    static func groups(available: Set<SettingsPlace>) -> [[SettingsPlace]] {
        [[.account, .ai, .appearance, .security]]
            .map { $0.filter(available.contains) }
            .filter { !$0.isEmpty }
    }
}

/// Things that left Settings for a menu, still found by Settings search: a result runs the menu
/// item, and says which menu it is in.
enum SettingsMenuLink: String, Hashable, CaseIterable, Sendable {
    case export, setupGuide, whatsNew, questions, feedback, reportIssue, github, connectHelp

    var menu: String { self == .export ? "File menu" : "Help menu" }
    var symbol: String { self == .export ? "square.and.arrow.up" : "questionmark.circle" }

    /// Runs it once Settings has closed, so what it opens isn't under the card.
    @MainActor func run() {
        switch self {
        case .export: NotificationCenter.default.post(name: .paneExportNotes, object: nil)
        case .setupGuide: NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil)
        case .whatsNew: NSWorkspace.shared.open(WhatsNew.changelogURL)
        case .questions: MacHelp.questions()
        case .feedback: MacHelp.sendFeedback()
        case .reportIssue: MacHelp.reportIssue()
        case .github: MacHelp.github()
        case .connectHelp: MacHelp.helpConnecting()
        }
    }

    /// Connect an AI's help opens over Settings itself; the rest close it first.
    var closesSettings: Bool { self != .connectHelp }
}

/// Every setting by the words on it, for the search field. Each word leads to its page, or to the
/// menu item it moved to.
enum SettingsIndex {
    struct Entry: Hashable {
        let label: String
        /// Its page; for a menu item, the page whose presence it goes with.
        let place: SettingsPlace
        /// Other words it goes by, found but not shown.
        var also: [String] = []
        /// Set: it is a menu item now, and the result runs it.
        var menu: SettingsMenuLink? = nil

        /// The line under the result: its page, or the menu it is in.
        var whereItIs: String { menu?.menu ?? place.title }
    }

    static let all: [Entry] = ([
        ("Name", .account), ("Photo", .account), ("Sign Out", .account), ("Remove notes from this Mac", .account),
        ("Storage used", .account), ("Delete account", .account),
        ("Connect ChatGPT", .ai), ("Connect Claude", .ai), ("Connect Grok", .ai), ("Connect Codex", .ai), ("Connected AIs", .ai),
        ("Disconnect", .ai), ("App previews", .ai),
        (recoveryKey, .security), ("Devices", .security), ("Add a device", .security), (advancedProtection, .security),
        ("Locked notes password", .security), ("Touch ID", .security), ("Lock Now", .security),
        ("Share diagnostics and usage", .security), ("Terms of Service", .security), ("Privacy Policy", .security), ("How it works", .security),
        ("Light or dark mode", .appearance), ("Theme", .appearance), ("Show in menu bar", .appearance),
    ] as [(String, SettingsPlace)]).map { Entry(label: $0.0, place: $0.1) }
        + [Entry(label: "Accent colour", place: .appearance, also: ["Accent color"]),
           // Named for what the page shows; its status line is what syncs when pressed (round 24).
           Entry(label: "Sync status", place: .account, also: ["Sync now"]),
           Entry(label: "Your account", place: .account, also: ["Profile", "Email", "Signed in with", "Sync"]),
           Entry(label: "Storage", place: .account, also: ["Space", "Recently Deleted", "Earlier versions", "Full"]),
           Entry(label: "Export All Notes", place: .account, also: ["Export notes", "Markdown", "Backup"], menu: .export),
           Entry(label: "Show Setup Guide", place: .account, menu: .setupGuide),
           Entry(label: WhatsNew.title, place: .account, also: ["What's new", "Changelog", "Version"], menu: .whatsNew),
           Entry(label: "Questions and Answers", place: .account, also: ["Help", "Support"], menu: .questions),
           Entry(label: "Send Feedback", place: .account, also: ["Email", "Contact", "Support", "Help"], menu: .feedback),
           Entry(label: "Report an Issue", place: .account, also: ["Bug"], menu: .reportIssue),
           Entry(label: "Pinto Notes on GitHub", place: .account, also: ["Contribute", "Star", "Open source"], menu: .github),
           Entry(label: "Help Connecting an AI", place: .ai, also: ["Having trouble", "Connector address", "Access token"], menu: .connectHelp)]
        + macOnly

    /// The Mac's own settings: View › Bigger's size is on Appearance there.
    #if os(macOS)
    static let macOnly = [Entry(label: "Text size", place: .appearance, also: ["Font size", "Bigger", "Smaller", "Zoom", "Larger text"])]
    #else
    static let macOnly: [Entry] = []
    #endif

    static let advancedProtection = "Advanced protection"
    /// Only for an account offered a recovery key (RecoveryKeyOffer): signing in opens a standard account's notes.
    static let recoveryKey = "Recovery key"

    /// The settings whose words, or whose page's name, have what's typed; only on pages that are there.
    /// `advancedProtection`: its switch is on Security (AdvancedProtection.shown); otherwise it isn't found.
    /// `recoveryKey`: the same, for the recovery key.
    static func matches(_ query: String, available: Set<SettingsPlace>, advancedProtection: Bool = false, recoveryKey: Bool = false) -> [Entry] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        return all.filter { e in
            available.contains(e.place) && (advancedProtection || e.label != Self.advancedProtection)
                && (recoveryKey || e.label != Self.recoveryKey)
                && ([e.label, e.place.title] + e.also).contains { $0.localizedStandardContains(q) }
        }
    }
}

/// How the person signs in, for the Profile page: "Apple", "Google" or the email. Never an Apple
/// relay address.
enum SignInShown {
    static func label(email: String, apple: Bool, google: Bool) -> String {
        if google { return "Google" }
        if apple || email.hasSuffix("privaterelay.appleid.com") { return "Apple" }
        return email
    }
}

/// Tells `changed` the window a sheet hangs on, when the sheet shows and each time that window
/// is resized.
struct SheetParentReader: NSViewRepresentable {
    let changed: (NSWindow?) -> Void

    func makeNSView(context: Context) -> Probe { Probe(changed: changed) }
    func updateNSView(_ view: Probe, context: Context) { view.changed = changed }

    final class Probe: NSView {
        var changed: (NSWindow?) -> Void
        nonisolated(unsafe) private var watch: NSObjectProtocol?
        init(changed: @escaping (NSWindow?) -> Void) { self.changed = changed; super.init(frame: .zero) }
        required init?(coder: NSCoder) { nil }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            if let watch { NotificationCenter.default.removeObserver(watch) }
            watch = nil
            guard window != nil else { return }
            // The sheet's window is in place before it is attached to its parent: wait for that.
            Task { @MainActor [weak self] in
                for _ in 0..<40 {
                    guard let self, let sheet = self.window else { return }
                    if let parent = sheet.sheetParent { self.follow(parent); return }
                    try? await Task.sleep(for: .milliseconds(50))
                }
            }
        }

        private func follow(_ parent: NSWindow) {
            changed(parent)
            watch = NotificationCenter.default.addObserver(forName: NSWindow.didResizeNotification, object: parent, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.changed(parent) }
            }
        }

        deinit { if let watch { NotificationCenter.default.removeObserver(watch) } }
    }
}

#endif

/// What Help and feedback says and where it leads, in one place.
enum HelpCopy {
    /// The address the website's support page and privacy policy give.
    static let email = "hello@pintonotes.com"
    /// The website's help page: common questions, and the address (/support shows the same page).
    static let supportPage = URL(string: "https://pintonotes.com/help")!
    static let questions = "Questions and answers"
    static let feedback = "Send feedback"
    static let feedbackFooter = "Write to \(email) about a problem or an idea. You\u{2019}ll normally hear back within a day or two."
    static let setupGuideFooter = "Shows the first steps again: your name, bringing your notes and connecting your AI."
    static let openSource = "Open source on GitHub"
    static let openSourceFooter = "Pinto Notes is built in the open. Reporting an issue there needs a GitHub account."
    static let trademarks = "Evernote is a trademark of Bending Spoons US Inc., used under license. Bear is a trademark of Shiny Frog Ltd. Other names and icons belong to their owners."
    /// Said under Send feedback when no mail app took the message.
    static let noMailApp = "No mail app opened, so the address is copied: \(email)."

    /// A message to support with the subject filled in, and the version and system under room to
    /// write: what's asked first when something goes wrong. Nothing else about the device.
    static func mail(version: String, system: String) -> URL {
        var c = URLComponents()
        c.scheme = "mailto"
        c.path = email
        c.queryItems = [
            URLQueryItem(name: "subject", value: "Pinto Notes feedback"),
            URLQueryItem(name: "body", value: "\n\n\nPinto Notes \(version), \(system)"),
        ]
        return c.url!
    }

    /// "macOS 26.1" or "iOS 26.1.2".
    static var system: String {
        let v = ProcessInfo.processInfo.operatingSystemVersion
        #if os(macOS)
        let name = "macOS"
        #else
        let name = "iOS"
        #endif
        return "\(name) \(v.majorVersion).\(v.minorVersion)" + (v.patchVersion > 0 ? ".\(v.patchVersion)" : "")
    }
}

/// Help and feedback, on the Mac and iPhone: the setup guide, answers and a way to write to us,
/// the project on GitHub, then what's new, the version and the terms.
struct HelpPage: View {
    /// The setup guide plays only for an account (it starts from your name).
    var signedIn: Bool
    /// Closes Settings, so the setup guide shows.
    var close: () -> Void = {}
    /// Where the address goes when no mail app opens; tests keep the real clipboard out of it.
    var copy: @MainActor (String) -> Void = { HelpPage.toClipboard($0) }
    @Environment(\.openURL) private var openURL
    /// Said under Send feedback when no mail app took the message.
    @State private var noMail = false

    var body: some View {
        if Self.offersSetupGuide(signedIn: signedIn) {
            Section {
                Button("Show Setup Guide") { Self.playSetupGuide(close: close) }
                .accessibilityIdentifier("settings.setupGuide")
            } footer: {
                Text(HelpCopy.setupGuideFooter)
            }
        }
        Section {
            link(HelpCopy.questions, HelpCopy.supportPage, symbol: "questionmark.circle", id: "settings.support")
            Button { sendFeedback() } label: {
                row(HelpCopy.feedback, symbol: "envelope", trailing: "arrow.up.right")
            }
            .buttonStyle(.plain)
            .hoverRow()
            .accessibilityIdentifier("settings.feedback")
            if noMail {
                Label(HelpCopy.noMailApp, systemImage: "doc.on.doc")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("settings.feedbackCopied")
            }
        } footer: {
            Text(HelpCopy.feedbackFooter)
        }
        Section {
            ForEach(AboutSection.links, id: \.id) { l in
                link(l.title, l.url, symbol: nil, id: l.id)
            }
        } header: {
            Text(HelpCopy.openSource)
        } footer: {
            Text(HelpCopy.openSourceFooter)
        }
        Section {
            // What changed in each version, on the website: the app shows no release notes by itself.
            link(WhatsNew.title, WhatsNew.changelogURL, symbol: nil, id: "settings.whatsNew")
            LabeledContent("Version") {
                Text(AboutSection.version).textSelection(.enabled).monospacedDigit()
            }
            .accessibilityIdentifier("settings.version")
        } footer: {
            VStack(alignment: .leading, spacing: 6) {
                LegalLinksRow()
                // The import list shows these apps' own icons to name where notes come from.
                Text(HelpCopy.trademarks)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func link(_ title: String, _ url: URL, symbol: String?, id: String) -> some View {
        Link(destination: url) { row(title, symbol: symbol, trailing: "arrow.up.right") }
            .buttonStyle(.plain)
            .hoverRow()
            .accessibilityIdentifier(id)
    }

    /// A row that leaves the app: its words, and an arrow out at the end.
    private func row(_ title: String, symbol: String?, trailing: String) -> some View {
        LabeledContent {
            Image(systemName: trailing).font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
        } label: {
            if let symbol { Label(title, systemImage: symbol) } else { Text(title) }
        }
        .foregroundStyle(.primary)
        .contentShape(.rect)
    }

    private func sendFeedback() {
        noMail = false
        openURL(HelpCopy.mail(version: AboutSection.version, system: HelpCopy.system)) { accepted in
            noMail = Self.mailed(accepted: accepted, copy: copy)
        }
    }

    /// Signed out there's no setup guide to play (it starts from your name, and the app only
    /// plays it for an account), so its button isn't there to do nothing.
    static func offersSetupGuide(signedIn: Bool) -> Bool { signedIn }

    /// Plays the setup guide and closes Settings, which would otherwise cover it.
    static func playSetupGuide(close: () -> Void) {
        NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil)
        close()
    }

    /// After Send feedback: when no mail app took the message, the address is copied, and the
    /// answer is true, for the line under the button that says so.
    static func mailed(accepted: Bool, copy: (String) -> Void) -> Bool {
        guard !accepted else { return false }
        copy(HelpCopy.email)
        return true
    }

    static func toClipboard(_ text: String) {
        #if os(macOS)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #else
        UIPasteboard.general.string = text
        #endif
    }
}
