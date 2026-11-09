import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The pages of Settings, one list for the Mac and iPhone (Emil, 7 November 2026: "copy this onto
/// Mac so it's fully consistent"): you at the top, then General, AI Connections and Appearance;
/// Privacy and Storage; Help and feedback. Keys for apps is one level down on the
/// Mac, parked. iPhone's rows and the Mac's sidebar are both built from `groups`, and each page's
/// view is the same on both (SettingsPages.swift).
enum SettingsPage: String, Hashable, CaseIterable, Identifiable {
    case account, ai, general, appearance, security, storage, help, appKeys
    /// Account's own pages, one level down, as Apple Account has them (Emil, 7 November 2026).
    case personal, signIn
    /// Privacy's own page one level down: who holds your key, the recovery key, Advanced protection
    /// (Emil, 7 November 2026: Privacy itself is just that row and Diagnostics).
    case encryption
    /// Features with settings of their own, out of General (Emil, 7 November 2026, as Obsidian's
    /// Daily notes), and the Mac's shortcuts, listed (Emil: "where can I see what shortcuts exist?").
    case todaysNote, shortcuts
    /// AI Connections' pages one level down: one connected AI (the one `AISelection` holds), and
    /// Add an AI, the onboarding picker's rows (Emil, 7 November 2026: as Bluetooth has it).
    case aiConnection, addAI
    var id: String { rawValue }

    /// The page a page one level down opens from: Account's for your details and how you sign in.
    var parent: SettingsPage? {
        switch self {
        case .personal, .signIn: .account
        case .encryption: .security
        case .aiConnection, .addAI: .ai
        default: nil
        }
    }

    /// The rows under you (Account), in groups.
    /// General, Appearance and Keyboard shortcuts; the features with settings of their own (AI
    /// Connections first, the reason people use Pinto); Privacy and Storage; Help and feedback. No
    /// headings: the gaps group them (Emil, 7 November 2026).
    static let groups: [[SettingsPage]] = [[.general, .appearance, .shortcuts], [.ai, .todaysNote], [.security, .storage], [.help]]

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
        case .personal: "Personal information"
        case .signIn: "Sign-in and security"
        case .encryption: "Encryption"
        case .todaysNote: SettingsNames.todaysNote
        case .shortcuts: SettingsNames.shortcuts
        case .aiConnection: AISelection.title
        case .addAI: "Add an AI"
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
        case .personal: "person.text.rectangle"
        case .signIn: "lock"
        case .encryption: "key.horizontal"
        case .todaysNote: SettingsIcons.todaysNote
        case .shortcuts: SettingsIcons.shortcuts
        case .aiConnection: SettingsIcons.ai
        case .addAI: "plus"
        }
    }

    /// The pages there is something on. Account, General, Appearance, Privacy (how it
    /// works, signed out too) and Help and feedback always; AI Connections and Storage with an
    /// account. Keys for apps is parked (Emil, 6 November 2026): nothing leads to it.
    static func available(signedIn: Bool, hasClient: Bool, demoStorage: Bool = false) -> Set<SettingsPage> {
        var out: Set<SettingsPage> = [.account, .general, .appearance, .todaysNote, .security, .help]
        #if os(macOS)
        out.insert(.shortcuts)  // the Mac's menus; iPhone has none to list
        #endif
        if signedIn { out.formUnion([.personal, .signIn, .encryption]) }
        if signedIn && hasClient { out.formUnion([.ai, .aiConnection, .addAI, .storage]) }
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
    static let security = "Privacy"
    static let storage = "Storage"
    static let help = "Help and feedback"
    static let todaysNote = "Today\u{2019}s note"
    static let shortcuts = "Keyboard shortcuts"
}

/// Settings' page symbols, the same on the Mac and iPhone: one outline family.
enum SettingsIcons {
    /// Picked by Emil from three sets on 7 November 2026 (B): a link for what's connected, the
    /// sliders for General (Emil, later the same day), the text-size glyph for Appearance.
    static let ai = "link"
    static let general = "slider.horizontal.3"
    static let appearance = "textformat.size"
    static let security = "lock.shield"
    static let storage = "externaldrive"
    static let help = "questionmark.circle"
    static let todaysNote = "calendar"
    static let shortcuts = "command"
}

#if os(macOS)

/// Things that left Settings for a menu, still found by Settings search: a result runs the menu
/// item, and says which menu it is in.
enum SettingsMenuLink: String, Hashable, CaseIterable, Sendable {
    case export, connectHelp, setupGuide

    var menu: String { self == .export ? "File menu" : "Help menu" }
    var symbol: String {
        switch self {
        case .export: "square.and.arrow.up"
        case .connectHelp: "questionmark.circle"
        case .setupGuide: "sparkles"
        }
    }

    /// Runs it once Settings has closed, so what it opens isn't under the card.
    @MainActor func run() {
        switch self {
        case .export: NotificationCenter.default.post(name: .paneExportNotes, object: nil)
        case .connectHelp: MacHelp.helpConnecting()
        case .setupGuide: NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil)
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
        e("Personal information", .personal, "settings.personalName", also: ["Change name", "Change photo"]),
        e("Sign-in and security", .signIn, "settings.signInWith", also: ["Signed in with", "Email address", "How I sign in"]),
        e("Devices", .account, "settings.accountDevices", also: ["This Mac", "My devices"]),
        e("Sign Out", .account, "settings.signOut"), e("Remove notes from this Mac", .account),
        e("Delete account", .signIn, "settings.deleteAccount"),
        // Named for what the page shows; its status line is what syncs when pressed (round 24).
        e("Sync status", .account, "settings.syncStatus", also: ["Sync now"]),
        e("Your account", .account, "settings.accountSummary", also: ["Profile", "Email", "Sync"]),
        Entry(label: "Export All Notes", page: .account, also: ["Export notes", "Markdown", "Backup"], menu: .export),
        e("Connect ChatGPT", .ai), e("Connect Claude", .ai), e("Connect Grok", .ai), e("Connect Codex", .ai),
        e("Connected AIs", .ai, "connect.sent"), e("Disconnect", .ai), e("App previews", .ai),
        e("Add an AI", .addAI, also: ["Connect another AI", "Other apps", "Cursor", "Gemini"]),
        // One AI's page needs the AI picked first: Disconnect is found on the list of them.
        e("Disconnect an AI", .ai, also: ["Remove an AI", "Revoke", "Last used"]),
        Entry(label: "Help Connecting an AI", page: .ai, also: ["Having trouble", "Connector address", "Access token"], menu: .connectHelp),
        // Privacy is two rows; what was on it is on Encryption, one level down, and the devices on
        // Account (Emil, 7 November 2026).
        e("Encryption", .security, "privacy.encryption", also: ["Encrypted", "Who can open my notes", "Key", "Security"]),
        e(recoveryKey, .encryption), e("Add a device", .account),
        e(advancedProtection, .encryption), e("Locked notes password", .encryption), e("Touch ID", .encryption), e("Lock Now", .encryption),
        e("Terms of Service", .security, "settings.terms"), e("Privacy Policy", .security, "settings.privacy"),
        e("How it works", .encryption, "privacy.howItWorks"),
        e("Today\u{2019}s note folder", .todaysNote, "settings.today.folder",
          also: ["Today", "Daily note", "Daily notes", "Journal", "Date format"]),
        e("Today\u{2019}s note title", .todaysNote, "settings.today.title", also: ["Daily note title", "Date format"]),
        e("Today\u{2019}s note template", .todaysNote, "settings.today.template", also: ["Template", "Daily note template"]),
        e("Open today\u{2019}s note when Pinto starts", .todaysNote, "settings.today.launch", also: ["Open on launch", "Daily note"]),
        e("Ticked items move to the bottom", .general, "settings.notes.ticked", also: ["Checklist", "Sort checked items", "Ticked"]),
        e("Share diagnostics and usage", .security, "settings.diagnostics"),
        e("Light or dark mode", .appearance, "settings.mode.system"), e("Theme", .appearance, "settings.theme.default"),
        e("Font", .appearance, "settings.font", also: ["Typeface", "Serif", "Rounded", "Mono", "Monospace", "New York"]),
        e("Storage used", .storage, "settings.storage", also: ["Space", "Recently Deleted", "Earlier versions", "Full"]),
        e("Questions and Answers", .help, "settings.support", also: ["Help", "Support"]),
        e("Write to Me", .help, "settings.feedback", also: ["Send feedback", "Feedback", "Email", "Contact", "Support", "Report an issue", "Bug", "Problem"]),
        e("Pinto Notes on GitHub", .help, "settings.github", also: ["GitHub", "Contribute", "Star", "Open source"]),
        // Only in the Help menu on the Mac: a row in Help read as part of Settings and dropped you
        // into importing notes (Emil, 8 November 2026: "kinda off").
        Entry(label: "Show Setup Guide", page: .help, also: ["Onboarding", "Welcome"], menu: .setupGuide),
        e(WhatsNew.row, .general, "settings.whatsNew", also: ["What's New", "Changelog", "Release notes"]),
        e("Keyboard shortcuts", .help, "settings.openShortcuts", also: ["Shortcuts", "Hotkeys", "Keys"]),
        // The Mac's own: View › Bigger's size is on Appearance there.
        e("Show in menu bar", .general, "settings.menuBar"),
        e("Quick note shortcut", .shortcuts, "settings.quickNoteShortcut", also: ["Hotkey", "Keyboard shortcut", "Global shortcut"]),
        e("Open at login", .general, "settings.openAtLogin", also: ["Login item", "Start at login", "Launch at login"]),
        e("Text size", .appearance, "settings.textSize", also: ["Font size", "Bigger", "Smaller", "Zoom", "Larger text"]),
    ]

    /// The menus' shortcuts whose names have what's typed ("bold" finds Bold ⌘B), each leading
    /// to Keyboard shortcuts. At most `limit`, so they never bury the settings found.
    static func shortcuts(_ query: String, in groups: [Shortcuts.Group], limit: Int = 6) -> [Entry] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 2 else { return [] }
        var out: [Entry] = []
        for g in groups { for e in g.entries where e.title.localizedStandardContains(q) {
            let entry = Entry(label: "\(e.title)  \(e.keys)", page: .shortcuts)
            if !out.contains(entry) { out.append(entry) }
        } }
        return Array(out.prefix(limit))
    }

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

/// Tells `changed` the window a sheet hangs on (the top one, for a sheet on a sheet), when the
/// sheet shows and each time that window is resized.
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
                    // A sheet on a sheet (a guide opened from a card) follows the notes window,
                    // not the card it hangs on.
                    if let parent = sheet.sheetParent { self.follow(ImportSheetFit.top(parent)); return }
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
    static let setupGuide = "Show Setup Guide"
    /// The top of Help: Emil, who makes it, in his words (Emil, 7 November 2026: "you can have my
    /// photo and name there").
    static let greeting = "Hi, I\u{2019}m Emil. I make Pinto Notes."
    static let greetingLine = "If something\u{2019}s off or you have an idea, write to me. I read every message."
    static let writeToMe = "Write to me"
    /// One quiet line for the project on GitHub, its two links in it.
    static var openSourceLine: AttributedString {
        (try? AttributedString(markdown: "Pinto Notes is open source. [See the code](\(ShareAsk.repository.absoluteString)) or [help build it](\(ShareAsk.contributing.absoluteString)) on GitHub."))
            ?? AttributedString("Pinto Notes is open source on GitHub.")
    }
    static let openSourcePlain = "Pinto Notes is open source. See the code or help build it on GitHub."
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

/// Where you have been in Settings, for Back and Forward as System Settings has them (Emil,
/// 7 November 2026). Each place is a page and the pages one level down open from it, top first.
struct SettingsHistory: Equatable {
    private(set) var places: [[SettingsPage]] = []
    private(set) var at = -1

    /// The place shown: the last opened, or none before anything was.
    var place: [SettingsPage]? { places.indices.contains(at) ? places[at] : nil }
    var canGoBack: Bool { at > 0 }
    var canGoForward: Bool { at < places.count - 1 }

    /// Opens `page` from `from` (where Settings is now, the first time). A page one level down
    /// opens over its parent; a sidebar page on its own. Forward is dropped, as in a browser.
    mutating func open(_ page: SettingsPage, from: [SettingsPage]) {
        if places.isEmpty { places = [from]; at = 0 }
        let here = place ?? from
        let next: [SettingsPage]
        if let parent = page.parent {
            next = here.contains(parent) ? Array(here.prefix(through: here.firstIndex(of: parent)!)) + [page] : [parent, page]
        } else if page == .appKeys {
            next = here + [page]
        } else {
            next = [page]
        }
        guard next != here else { return }
        places = Array(places.prefix(at + 1)) + [next]
        at = places.count - 1
    }

    mutating func back() { if canGoBack { at -= 1 } }
    mutating func forward() { if canGoForward { at += 1 } }
}

/// The line under your name, Mac and iPhone: your email, but never Apple's relay address
/// ("f7k6w27tsh@privaterelay.appleid.com", random letters nobody knows), which says how you sign in.
enum AccountLine {
    static func shown(email: String) -> String {
        email.hasSuffix("privaterelay.appleid.com") ? "Signed in with Apple" : email
    }
}

/// An email address on screen is blurred until the pointer is over it (or, where it can be,
/// it's tapped on iPhone), so a screenshot or a screen recording doesn't give it away (Emil,
/// 8 November 2026). Words without an @ ("Signed in with Apple") are left as they are.
/// VoiceOver still reads it.
struct PrivateBlur: ViewModifier {
    var on: Bool
    var revealsOnTap = false
    @State private var revealed = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    static let radius: CGFloat = 4
    static func hides(_ text: String) -> Bool { text.contains("@") }

    func body(content: Content) -> some View {
        content
            .blur(radius: on && !revealed ? Self.radius : 0)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: revealed)
            #if os(macOS)
            .onHover { revealed = $0 }
            #else
            .modifier(TapReveal(enabled: on && revealsOnTap, revealed: $revealed))
            #endif
            .help(on ? "Point here to show it" : "")
    }
}

#if os(iOS)
private struct TapReveal: ViewModifier {
    let enabled: Bool
    @Binding var revealed: Bool
    func body(content: Content) -> some View {
        if enabled { content.contentShape(Rectangle()).onTapGesture { revealed.toggle() } } else { content }
    }
}
#endif

extension View {
    /// Blurs `text` if it's an email address: see `PrivateBlur`.
    func privateBlur(_ text: String, revealsOnTap: Bool = false) -> some View {
        modifier(PrivateBlur(on: PrivateBlur.hides(text), revealsOnTap: revealsOnTap))
    }
}
