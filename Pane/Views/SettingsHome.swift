import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

#if os(macOS)

/// The pages of Settings on the Mac (SettingsCard): you at the top, then a few groups of pages in
/// its sidebar. Rarely used and technical things sit one level down.
enum SettingsPlace: String, Hashable, CaseIterable, Identifiable {
    case profile, ai, security, storage, account, general, appearance, help, appKeys
    var id: String { rawValue }

    var title: String {
        switch self {
        case .profile: "Profile"
        case .ai: "Connect an AI"
        case .security: PrivacyCopy.title
        case .storage: "Storage"
        case .account: "Account"
        case .general: "General"
        case .appearance: "Appearance"
        case .help: "Help and feedback"
        case .appKeys: "Keys for apps"
        }
    }

    var symbol: String {
        switch self {
        case .profile: "person.crop.circle"
        case .ai: "sparkles"
        case .security: "lock.shield"
        case .storage: "externaldrive"
        case .account: "person.text.rectangle"
        case .general: "gearshape"
        case .appearance: "circle.lefthalf.filled"
        case .help: "questionmark.circle"
        case .appKeys: "key"
        }
    }

    /// Where a link into Settings lands (the account row, a card, the storage warning).
    init(_ tab: SettingsTab) {
        switch tab {
        case .account: self = .profile
        case .ai: self = .ai
        case .security: self = .security
        case .storage: self = .storage
        case .general: self = .general
        case .appearance: self = .appearance
        case .help: self = .help
        }
    }

    /// The sidebar's groups, in order, from the places there is something on: what you do most
    /// first, then you and your data, then help. Profile sits above them, Keys for apps under General.
    static func groups(available: Set<SettingsPlace>) -> [[SettingsPlace]] {
        [[.ai, .general, .appearance], [.security, .storage, .account], [.help]]
            .map { $0.filter(available.contains) }
            .filter { !$0.isEmpty }
    }
}

/// Every setting by the words on it, for the search field. Each word leads to its page.
enum SettingsIndex {
    struct Entry: Hashable {
        let label: String
        let place: SettingsPlace
        /// Other words it goes by, found but not shown.
        var also: [String] = []
    }

    static let all: [Entry] = ([
        ("Name", .profile), ("Photo", .profile), ("Signed in with", .profile), ("Sign Out", .profile), ("Remove notes from this Mac", .profile),
        ("Connect ChatGPT", .ai), ("Connect Claude", .ai), ("Connected AIs", .ai), ("App previews", .ai),
        (recoveryKey, .security), ("Devices", .security), ("Add a device", .security), (advancedProtection, .security),
        ("Locked notes password", .security), ("Touch ID", .security), ("Lock Now", .security),
        ("Storage used", .storage), ("Recently Deleted", .storage), ("Earlier versions", .storage),
        ("Sync", .account), ("Sync Now", .account), ("Sign in with Apple", .account), ("Export notes", .account), ("Delete account", .account),
        ("Light or dark mode", .appearance), ("Theme", .appearance),
        ("Show in menu bar", .general), ("Share diagnostics and usage", .general), ("Keys for apps", .appKeys),
        ("Show Setup Guide", .help), ("Questions and answers", .help), ("Report an issue", .help), ("Contribute", .help), ("Star on GitHub", .help),
        ("Terms", .help), ("Privacy policy", .help), ("Version", .help),
    ] as [(String, SettingsPlace)]).map { Entry(label: $0.0, place: $0.1) }
        + [Entry(label: "Accent colour", place: .appearance, also: ["Accent color"]),
           Entry(label: WhatsNew.title, place: .help, also: ["What's new", "Changelog"]),
           Entry(label: "Send feedback", place: .help, also: ["Email", "Contact", "Support", "Help"])]

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

/// Settings' rows: taller than a form's own, like WhatsApp's.
enum SettingsRows {
    static let padding: CGFloat = 7
    static let text: CGFloat = 14
}

/// Profile: your photo large, with Edit photo under it; your name and how you sign in, each a
/// row of its own; Sign Out at the end, in red, with the sign-out choices it always had.
struct ProfilePage: View {
    let backend: Backend
    let sync: SyncEngine?
    @State private var profile = ProfileStore.shared
    @State private var draft = ""
    @State private var importing = false
    @FocusState private var editing: Bool

    private var email: String {
        if case .signedIn(let e) = backend.state { return backend.displayEmail ?? e }
        return ""
    }

    var body: some View {
        // Each field a row of its own under its label, like WhatsApp's Profile.
        Section {
            TextField("Name", text: $draft, prompt: Text("Add your name"))
                .labelsHidden()
                .textFieldStyle(.plain)
                .focused($editing)
                .onSubmit { Task { await profile.setName(draft) } }
                .font(.system(size: SettingsRows.text))
                .padding(.vertical, SettingsRows.padding)
                .accessibilityLabel("Name")
                .accessibilityIdentifier("settings.profileName")
        } header: {
            // Your photo with Edit photo under it, on the page itself rather than in a card, then
            // the field's label.
            VStack(alignment: .leading, spacing: 0) {
                photo
                Text("Name")
            }
        } footer: {
            Text("Shown in the app and on notes you share.")
        }
        Section {
            Text(SignInShown.label(email: email, apple: backend.apple != nil, google: backend.google))
                .textSelection(.enabled)
                .font(.system(size: SettingsRows.text))
                .padding(.vertical, SettingsRows.padding)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityLabel("Signed in with \(SignInShown.label(email: email, apple: backend.apple != nil, google: backend.google))")
                .accessibilityIdentifier("settings.signedInWith")
        } header: {
            Text("Signed in with")
        }
        Section {
            // Alone at the end, in red, like Log out in WhatsApp; the same sign-out choices.
            SignOutButton(backend: backend, sync: sync)
                .buttonStyle(.plain)
                .font(.system(size: SettingsRows.text))
                .padding(.vertical, SettingsRows.padding)
                .frame(maxWidth: .infinity, alignment: .leading)
        } header: {
            Color.clear.frame(height: 22).accessibilityHidden(true)
        }
        .onAppear { draft = profile.name ?? "" }
        // The name as it arrives, unless you are typing a different one.
        .onChange(of: profile.name) { _, new in if !editing || draft.isEmpty { draft = new ?? "" } }
        .onChange(of: editing) { _, now in if !now { Task { await profile.setName(draft) } } }
        .onChange(of: draft) { _, new in if new.count > ProfileName.maxLength { draft = String(new.prefix(ProfileName.maxLength)) } }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.jpeg, .png, .heic, .image]) { result in
            guard case .success(let url) = result else { return }
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { return }
            Task { await profile.setPhoto(data) }
        }
    }

    private var photo: some View {
        VStack(spacing: 10) {
            AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 96)
                .dropDestination(for: URL.self) { urls, _ in
                    guard let url = urls.first, let data = try? Data(contentsOf: url) else { return false }
                    Task { await profile.setPhoto(data) }
                    return true
                }
            Menu("Edit photo") {
                Button(profile.photo == nil ? "Choose Photo…" : "Change Photo…") { importing = true }
                    .accessibilityIdentifier("settings.choosePhoto")
                if profile.photo != nil {
                    Button("Remove Photo", role: .destructive) { Task { await profile.removePhoto() } }
                        .accessibilityIdentifier("settings.removePhoto")
                }
            }
            .menuStyle(.button)
            .buttonStyle(.plain)
            .menuIndicator(.hidden)
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(.tint)
            .fixedSize()
            if profile.working { ProgressView().controlSize(.small) }
            if let problem = profile.problem { Text(problem).font(.footnote).foregroundStyle(.secondary) }
        }
        .textCase(nil)
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
        .padding(.bottom, 26)
    }
}

/// General: the menu bar and diagnostics, one switch each, and (when apps are on) the keys for
/// apps one level down. Appearance has a page of its own.
struct GeneralPage: View {
    @AppStorage(MenuBarSettings.key) private var menuBar = true
    @AppStorage(Telemetry.consentKey) private var share = true
    @Environment(\.openSettingsPlace) private var openPlace

    var body: some View {
        Section {
            Toggle("Show in menu bar", isOn: $menuBar)
                .tint(Color(Palette.switchOn))
                .accessibilityIdentifier("settings.menuBar")
        } footer: {
            Text("Capture or find a note from the menu bar.")
        }
        Section {
            Toggle(DiagnosticsCopy.title, isOn: Binding(get: { share }, set: { share = $0; Telemetry.shared.consent = $0 }))
                .tint(Color(Palette.switchOn))
                .accessibilityIdentifier("settings.diagnostics")
        } footer: {
            Text("Error reports and a few counts. Never your notes.")
        }
        if NoteApps.enabled {
            Section {
                // One level down, with Back in the card's header.
                Button { openPlace?(.appKeys) } label: {
                    LabeledContent {
                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(.tertiary)
                    } label: {
                        Label("Keys for apps", systemImage: SettingsPlace.appKeys.symbol)
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("settings.appKeys")
            }
        }
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
