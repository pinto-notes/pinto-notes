import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The pages of Settings, one list for the Mac and iPhone (Emil, 7 November 2026: "copy this onto
/// Mac so it's fully consistent"): you at the top, then General, AI Connections and Appearance;
/// Security and privacy and Storage; Help and feedback. Keys for apps is one level down on the
/// Mac, parked. iPhone's rows and the Mac's sidebar are both built from `groups`, and each page's
/// view is the same on both (SettingsPages.swift).
enum SettingsPage: String, Hashable, CaseIterable, Identifiable {
    case account, ai, general, appearance, security, storage, help, appKeys
    var id: String { rawValue }

    /// The rows under you (Account), in groups.
    static let groups: [[SettingsPage]] = [[.general, .ai, .appearance], [.security, .storage], [.help]]

    var title: String {
        switch self {
        case .account: "Account"
        case .ai: SettingsNames.ai
        case .general: SettingsNames.general
        case .appearance: SettingsNames.appearance
        case .security: SettingsNames.security
        case .storage: SettingsNames.storage
        case .help: SettingsNames.help
        case .appKeys: "Keys for apps"
        }
    }

    /// Account shows your photo in the Mac's sidebar and iPhone's first row.
    var symbol: String {
        switch self {
        case .account: "person.crop.circle"
        case .ai: SettingsIcons.ai
        case .general: SettingsIcons.general
        case .appearance: SettingsIcons.appearance
        case .security: SettingsIcons.security
        case .storage: SettingsIcons.storage
        case .help: SettingsIcons.help
        case .appKeys: "key"
        }
    }

    /// The pages there is something on. Account, General, Appearance, Security and privacy (how it
    /// works, signed out too) and Help and feedback always; AI Connections and Storage with an
    /// account. Keys for apps is parked (Emil, 6 November 2026): nothing leads to it.
    static func available(signedIn: Bool, hasClient: Bool, demoStorage: Bool = false) -> Set<SettingsPage> {
        var out: Set<SettingsPage> = [.account, .general, .appearance, .security, .help]
        if signedIn && hasClient { out.formUnion([.ai, .storage]) }
        if demoStorage { out.insert(.storage) }
        return out
    }

    /// The list, in order, from the pages there are: Account (you, at the top), then `groups`.
    static func groups(available: Set<SettingsPage>) -> [[SettingsPage]] {
        ([[.account]] + groups)
            .map { $0.filter(available.contains) }
            .filter { !$0.isEmpty }
    }
}

/// Settings' page names, the same on the Mac and iPhone.
enum SettingsNames {
    static let ai = "AI Connections"
    static let general = "General"
    static let appearance = "Appearance"
    static let security = "Security and privacy"
    static let storage = "Storage"
    static let help = "Help and feedback"
}

/// Settings' page symbols, the same on the Mac and iPhone: one outline family.
enum SettingsIcons {
    /// Picked by Emil from three sets on 7 November 2026 (B): a link for what's connected, the
    /// gear for General, the text-size glyph for Appearance.
    static let ai = "link"
    static let general = "gearshape"
    static let appearance = "textformat.size"
    static let security = "lock.shield"
    static let storage = "externaldrive"
    static let help = "questionmark.circle"
}

#if os(macOS)

/// Things that left Settings for a menu, still found by Settings search: a result runs the menu
/// item, and says which menu it is in.
enum SettingsMenuLink: String, Hashable, CaseIterable, Sendable {
    case export, connectHelp

    var menu: String { self == .export ? "File menu" : "Help menu" }
    var symbol: String { self == .export ? "square.and.arrow.up" : "questionmark.circle" }

    /// Runs it once Settings has closed, so what it opens isn't under the card.
    @MainActor func run() {
        switch self {
        case .export: NotificationCenter.default.post(name: .paneExportNotes, object: nil)
        case .connectHelp: MacHelp.helpConnecting()
        }
    }

    /// Connect an AI's help opens over Settings itself; the rest close it first.
    var closesSettings: Bool { self != .connectHelp }
}

/// Every setting by the words on it, for the Mac's search field. Each word leads to its page, or to
/// the menu item it moved to. `id` is the row's accessibility identifier on its page, so a test
/// checks each one is there (SettingsPageRowTests).
enum SettingsIndex {
    struct Entry: Hashable {
        let label: String
        /// Its page; for a menu item, the page whose presence it goes with.
        let page: SettingsPage
        /// Other words it goes by, found but not shown.
        var also: [String] = []
        /// Set: it is a menu item now, and the result runs it.
        var menu: SettingsMenuLink? = nil
        /// The row's accessibility identifier, where the row is always on its page.
        var id: String? = nil

        /// The line under the result: its page, or the menu it is in.
        var whereItIs: String { menu?.menu ?? page.title }
    }

    private static func e(_ label: String, _ page: SettingsPage, _ id: String? = nil, also: [String] = []) -> Entry {
        Entry(label: label, page: page, also: also, id: id)
    }

    static let all: [Entry] = [
        e("Name", .account, "settings.profileName"), e("Photo", .account, "settings.photo"),
        e("Sign Out", .account, "settings.signOut"), e("Remove notes from this Mac", .account),
        e("Delete account", .account, "settings.deleteAccount"),
        // Named for what the page shows; its status line is what syncs when pressed (round 24).
        e("Sync status", .account, "settings.syncStatus", also: ["Sync now"]),
        e("Your account", .account, "settings.accountSummary", also: ["Profile", "Email", "Signed in with", "Sync"]),
        Entry(label: "Export All Notes", page: .account, also: ["Export notes", "Markdown", "Backup"], menu: .export),
        e("Connect ChatGPT", .ai), e("Connect Claude", .ai), e("Connect Grok", .ai), e("Connect Codex", .ai),
        e("Connected AIs", .ai, "connect.sent"), e("Disconnect", .ai), e("App previews", .ai),
        Entry(label: "Help Connecting an AI", page: .ai, also: ["Having trouble", "Connector address", "Access token"], menu: .connectHelp),
        e(recoveryKey, .security), e("Devices", .security, "privacy.thisDevice"), e("Add a device", .security),
        e(advancedProtection, .security), e("Locked notes password", .security), e("Touch ID", .security), e("Lock Now", .security),
        e("Terms of Service", .security, "settings.terms"), e("Privacy Policy", .security, "settings.privacy"),
        e("How it works", .security, "privacy.howItWorks"),
        e("Today\u{2019}s note", .general, "settings.today.folder",
          also: ["Daily note", "Daily notes", "Journal", "Template", "Date format", "Open on launch"]),
        e("Ticked items move to the bottom", .general, "settings.notes.ticked", also: ["Checklist", "Sort checked items", "Ticked"]),
        e("Share diagnostics and usage", .general, "settings.diagnostics"),
        e("Light or dark mode", .appearance, "settings.mode.system"), e("Theme", .appearance, "settings.theme.default"),
        e("Accent colour", .appearance, "settings.accent.theme", also: ["Accent color"]),
        e("Storage used", .storage, "settings.storage", also: ["Space", "Recently Deleted", "Earlier versions", "Full"]),
        e("Questions and Answers", .help, "settings.support", also: ["Help", "Support"]),
        e("Send Feedback", .help, "settings.feedback", also: ["Email", "Contact", "Support"]),
        e("Report an Issue", .help, "settings.reportIssue", also: ["Bug", "Problem"]),
        e("Pinto Notes on GitHub", .help, "settings.github", also: ["Contribute", "Star", "Open source"]),
        e("Show Setup Guide", .help, "settings.setupGuide", also: ["Onboarding", "Welcome"]),
        e(WhatsNew.title, .help, "settings.whatsNew", also: ["What's new", "Changelog", "Version"]),
        // The Mac's own: View › Bigger's size is on Appearance there.
        e("Show in menu bar", .general, "settings.menuBar"),
        e("Quick note shortcut", .general, "settings.quickNoteShortcut", also: ["Hotkey", "Keyboard shortcut", "Global shortcut"]),
        e("Open at login", .general, "settings.openAtLogin", also: ["Login item", "Start at login", "Launch at login"]),
        e("Text size", .appearance, "settings.textSize", also: ["Font size", "Bigger", "Smaller", "Zoom", "Larger text"]),
    ]

    static let advancedProtection = "Advanced protection"
    /// Only for an account offered a recovery key (RecoveryKeyOffer): signing in opens a standard account's notes.
    static let recoveryKey = "Recovery key"

    /// The settings whose words, or whose page's name, have what's typed; only on pages that are there.
    /// `advancedProtection`: its switch is on Security (AdvancedProtection.shown); otherwise it isn't found.
    /// `recoveryKey`: the same, for the recovery key.
    static func matches(_ query: String, available: Set<SettingsPage>, advancedProtection: Bool = false, recoveryKey: Bool = false) -> [Entry] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        return all.filter { e in
            available.contains(e.page) && (advancedProtection || e.label != Self.advancedProtection)
                && (recoveryKey || e.label != Self.recoveryKey)
                && ([e.label, e.page.title] + e.also).contains { $0.localizedStandardContains(q) }
        }
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
    static let report = "Report an issue"
    static let setupGuide = "Show Setup Guide"
    static let feedbackFooter = "Write to \(email) about a problem or an idea. You\u{2019}ll normally hear back within a day or two."
    static let setupGuideFooter = "Your name, bringing your notes and connecting your AI, again."
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

/// Help and feedback's steps, shared by its page (HelpSettingsPage) and the Mac's Help menu.
@MainActor
enum HelpPage {
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

/// How the person signs in, for the Profile page: "Apple", "Google" or the email. Never an Apple
/// relay address.
enum SignInShown {
    static func label(email: String, apple: Bool, google: Bool) -> String {
        if google { return "Google" }
        if apple || email.hasSuffix("privaterelay.appleid.com") { return "Apple" }
        return email
    }
}
