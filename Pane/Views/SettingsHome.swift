#if os(macOS)
import SwiftUI

/// Settings on the Mac, like WhatsApp's (owner, 2026-10-11): a search field, you at the top, then
/// a few groups of rows, each opening a page of its own. Rarely used and technical things sit one
/// level down. Every page shows what Settings showed before; only where it lives changed.
enum SettingsPlace: String, Hashable, CaseIterable, Identifiable {
    case profile, ai, security, storage, account, general, help, appKeys
    var id: String { rawValue }

    var title: String {
        switch self {
        case .profile: "Profile"
        case .ai: "Connect an AI"
        case .security: PrivacyCopy.title
        case .storage: "Storage"
        case .account: "Account"
        case .general: "General"
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
        }
    }

    /// The groups of the first page, in order, from the places there is something on.
    static func groups(available: Set<SettingsPlace>) -> [[SettingsPlace]] {
        [[.ai, .security, .storage], [.account, .general], [.help]]
            .map { $0.filter(available.contains) }
            .filter { !$0.isEmpty }
    }
}

/// Every setting by the words on it, for the search field. Each word leads to its page.
enum SettingsIndex {
    struct Entry: Hashable { let label: String; let place: SettingsPlace }

    static let all: [Entry] = ([
        ("Name", .profile), ("Photo", .profile), ("Signed in with", .profile), ("Sign Out", .profile), ("Remove notes from this Mac", .profile),
        ("Connect ChatGPT", .ai), ("Connect Claude", .ai), ("Connected AIs", .ai), ("App previews", .ai),
        ("Recovery key", .security), ("Devices", .security), ("Add a device", .security), ("Advanced protection", .security),
        ("Locked notes password", .security), ("Touch ID", .security), ("Lock Now", .security),
        ("Storage used", .storage), ("Recently Deleted", .storage), ("Earlier versions", .storage),
        ("Sync", .account), ("Sync Now", .account), ("Sign in with Apple", .account), ("Export notes", .account), ("Delete account", .account),
        ("Show in menu bar", .general), ("Share diagnostics and usage", .general), ("Keys for apps", .appKeys),
        ("Show Setup Guide", .help), ("Report an issue", .help), ("Contribute", .help), ("Star on GitHub", .help),
        ("Terms", .help), ("Privacy policy", .help), ("Version", .help),
    ] as [(String, SettingsPlace)]).map { Entry(label: $0.0, place: $0.1) }

    /// The settings whose words, or whose page's name, have what's typed; only on pages that are there.
    static func matches(_ query: String, available: Set<SettingsPlace>) -> [Entry] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        return all.filter { available.contains($0.place) && ($0.label.localizedStandardContains(q) || $0.place.title.localizedStandardContains(q)) }
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

/// The first page of Settings, and the pages it opens: a sheet on the notes window, with its own
/// header row (back at the left, level with the title; Done at the right; Esc closes it).
struct SettingsHome: View {
    let backend: Backend
    let sync: SyncEngine?
    let available: Set<SettingsPlace>
    let page: (SettingsPlace) -> AnyView
    var route: SettingsRoute = .shared
    /// Captures: the page to open on.
    var start: SettingsPlace?
    /// Captures: the alternative look, each row's symbol on a tile of its own colour.
    var tiles = false

    @State private var path: [SettingsPlace] = []
    @State private var query = ""
    @State private var profile = ProfileStore.shared
    @Environment(\.dismiss) private var dismiss
    /// As tall as `height`, or less on a short notes window, so the sheet never runs past it.
    @State private var fit = SettingsHome.fitted(NSApp.keyWindow ?? NSApp.mainWindow)

    /// A little narrower than a window's Settings, and taller, like WhatsApp's (owner, 2026-10-12).
    static let width: CGFloat = 460
    static let height: CGFloat = 660

    /// The sheet's height on `window`: `height`, less on a window that is not tall enough.
    static func fitted(_ window: NSWindow?) -> CGFloat {
        guard let window else { return height }
        return min(height, max(360, window.frame.height - 60))
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            NavigationStack(path: $path) {
                VStack(spacing: 0) {
                    searchField
                    Form {
                        if query.isEmpty {
                            if available.contains(.profile) { profileCard }
                            ForEach(Array(SettingsPlace.groups(available: available).enumerated()), id: \.offset) { _, group in
                                Section {
                                    ForEach(group) { place in
                                        NavigationLink(value: place) { label(place) }
                                            .accessibilityIdentifier("settings.\(place.rawValue)")
                                    }
                                }
                            }
                        } else {
                            let found = SettingsIndex.matches(query, available: available)
                            Section {
                                if found.isEmpty {
                                    Text("No settings match \u{201C}\(query)\u{201D}").foregroundStyle(.secondary)
                                }
                                ForEach(found, id: \.self) { entry in
                                    NavigationLink(value: entry.place) {
                                        LabeledContent {
                                            Text(entry.place.title).foregroundStyle(.secondary)
                                        } label: {
                                            Label { Text(entry.label) } icon: { icon(entry.place) }
                                        }
                                        .padding(.vertical, SettingsRows.padding)
                                    }
                                }
                            }
                        }
                    }
                    .formStyle(.grouped)
                    .scrollContentBackground(.hidden)
                }
                // The sheet's own header names the page and goes back; the stack draws neither.
                .toolbar(.hidden)
                .navigationDestination(for: SettingsPlace.self) { place in
                    page(place).navigationBarBackButtonHidden(true).toolbar(.hidden)
                }
            }
        }
        .frame(width: Self.width, height: fit)
        // The app's warm sheet ground, as the import and "How did you hear" sheets have.
        .background(Color(Palette.sheetGround))
        .presentationBackground(Color(Palette.sheetGround))
        // Room under the last row, like WhatsApp's.
        .contentMargins(.bottom, 28, for: .scrollContent)
        .onAppear { if let start { path = [start] } }
        // A link into Settings (the account row, a card, the storage warning) opens its page.
        .onChange(of: route.target, initial: true) { _, target in
            guard let target else { return }
            let place = SettingsPlace(target)
            if available.contains(place), path.last != place { path = [place] }
            route.target = nil
        }
        .task(id: backend.state) { await profile.bind(backend) }
    }

    /// Back at the left (on an inner page), the page's name in the middle, Done at the right.
    private var header: some View {
        ZStack {
            Text(path.last?.title ?? "Settings")
                .font(.system(size: 14, weight: .semibold))
                .lineLimit(1)
                .padding(.horizontal, 90)
                .accessibilityAddTraits(.isHeader)
            HStack {
                if !path.isEmpty {
                    // A plain chevron at the top left, like WhatsApp's; a soft circle under the pointer.
                    Button { path.removeLast() } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color.ink)
                            .frame(width: 30, height: 30)
                            .contentShape(Circle())
                    }
                    .buttonStyle(.hoverIcon(cornerRadius: 15))
                    .keyboardShortcut("[", modifiers: .command)
                    .help("Back")
                    .accessibilityLabel("Back")
                    .accessibilityIdentifier("settings.back")
                }
                Spacer()
                Button("Done") { dismiss() }
                    // Esc closes Settings, wherever you are in it.
                    .keyboardShortcut(.cancelAction)
                    .accessibilityIdentifier("settings.done")
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
    }

    /// Search, in a fill of its own so it never reads as one of the rows.
    private var searchField: some View {
        HStack(spacing: 7) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search", text: $query).textFieldStyle(.plain)
                .accessibilityIdentifier("settings.search")
            if !query.isEmpty {
                Button { query = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Clear search")
            }
        }
        .font(.system(size: 14))
        .padding(.horizontal, 11)
        .frame(height: 36)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color(Palette.searchFill)))
        .padding(.horizontal, 20)
        .padding(.top, 4)
    }

    /// You, at the top: your photo (or initials) and name, opening Profile.
    private var profileCard: some View {
        Section {
            NavigationLink(value: SettingsPlace.profile) {
                HStack(spacing: 14) {
                    AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 52)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(AccountName.shown(profile.name)).font(.system(size: 15, weight: .semibold))
                        Text("Name, photo and sign in").font(.system(size: 12)).foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }
            .accessibilityIdentifier("settings.profile")
        }
    }

    private func label(_ place: SettingsPlace) -> some View {
        Label { Text(place.title) } icon: { icon(place) }
            .font(.system(size: SettingsRows.text))
            .padding(.vertical, SettingsRows.padding)
    }

    @ViewBuilder private func icon(_ place: SettingsPlace) -> some View {
        if tiles {
            Image(systemName: place.symbol)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
                .background(Self.tile(place), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
        } else {
            // One width for every symbol, so the rows' words line up.
            Image(systemName: place.symbol).foregroundStyle(Color.muted).frame(width: 20)
        }
    }

    private static func tile(_ place: SettingsPlace) -> Color {
        switch place {
        case .ai: Color(PColor.paneAccent)
        case .security: .blue
        case .storage: .gray
        case .account: .green
        case .general: .gray
        case .help: .indigo
        default: .gray
        }
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
/// apps one level down.
struct GeneralPage: View {
    @AppStorage(MenuBarSettings.key) private var menuBar = true
    @AppStorage(Telemetry.consentKey) private var share = true

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
                NavigationLink(value: SettingsPlace.appKeys) {
                    Label("Keys for apps", systemImage: SettingsPlace.appKeys.symbol)
                }
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
