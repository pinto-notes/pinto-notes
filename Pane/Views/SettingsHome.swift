#if os(macOS)
import SwiftUI

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
        ("Recovery key", .security), ("Devices", .security), ("Add a device", .security), ("Advanced protection", .security),
        ("Locked notes password", .security), ("Touch ID", .security), ("Lock Now", .security),
        ("Storage used", .storage), ("Recently Deleted", .storage), ("Earlier versions", .storage),
        ("Sync", .account), ("Sync Now", .account), ("Sign in with Apple", .account), ("Export notes", .account), ("Delete account", .account),
        ("Light or dark mode", .appearance), ("Theme", .appearance),
        ("Show in menu bar", .general), ("Share diagnostics and usage", .general), ("Keys for apps", .appKeys),
        ("Show Setup Guide", .help), ("Report an issue", .help), ("Contribute", .help), ("Star on GitHub", .help),
        ("Terms", .help), ("Privacy policy", .help), ("Version", .help),
    ] as [(String, SettingsPlace)]).map { Entry(label: $0.0, place: $0.1) }
        + [Entry(label: "Accent colour", place: .appearance, also: ["Accent color"])]

    /// The settings whose words, or whose page's name, have what's typed; only on pages that are there.
    static func matches(_ query: String, available: Set<SettingsPlace>) -> [Entry] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        return all.filter { e in
            available.contains(e.place) && ([e.label, e.place.title] + e.also).contains { $0.localizedStandardContains(q) }
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

/// Help and feedback: the setup guide, the project's links, the terms, and the version.
struct HelpPage: View {
    var body: some View {
        Section {
            Button("Show Setup Guide") { NotificationCenter.default.post(name: .paneReplayOnboarding, object: nil) }
                .accessibilityIdentifier("settings.setupGuide")
        }
        Section {
            ForEach(AboutSection.links, id: \.id) { link in
                Link(destination: link.url) {
                    LabeledContent(link.title) { Image(systemName: "arrow.up.right").foregroundStyle(.tertiary) }
                }
                .foregroundStyle(.primary)
                .accessibilityIdentifier(link.id)
            }
        } header: {
            Text("Pinto Notes is open source")
        }
        Section {
            LabeledContent("Version", value: AboutSection.version)
                .accessibilityIdentifier("settings.version")
        } footer: {
            LegalLinksRow()
        }
    }
}
#endif
