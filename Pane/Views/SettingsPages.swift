#if os(macOS)
import AppKit
import Supabase
import SwiftUI

// The pages of Settings on the Mac, in the System Settings form (SettingsForm): a summary box at
// the top, then boxes of rows, names on the left and controls on the right.

// MARK: Account

/// Account: you (photo, name, email, sync, Sign Out…), then your profile, signing in and syncing,
/// and your notes (export, delete).
struct AccountSettingsPage: View {
    let backend: Backend
    let sync: SyncEngine?
    @State private var profile = ProfileStore.shared
    @State private var draft = ""
    @State private var importing = false
    @FocusState private var editing: Bool

    var body: some View {
        SettingsStack {
            switch backend.state {
            case .signedIn(let email): signedIn(email: backend.displayEmail ?? email)
            default: signedOut
            }
        }
        .task(id: backend.state) { await profile.bind(backend) }
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

    /// The address under your name; never an Apple relay address ("Signed in with Apple").
    static func shownEmail(_ email: String, apple: Bool, google: Bool) -> String {
        let how = SignInShown.label(email: email, apple: apple, google: google)
        return how == email ? email : "Signed in with \(how)"
    }

    @ViewBuilder private func signedIn(email: String) -> some View {
        SettingsSummary {
            HStack(spacing: 14) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 54)
                    .dropDestination(for: URL.self) { urls, _ in
                        guard let url = urls.first, let data = try? Data(contentsOf: url) else { return false }
                        Task { await profile.setPhoto(data) }
                        return true
                    }
                VStack(alignment: .leading, spacing: 3) {
                    Text(AccountName.shown(profile.name)).font(.system(size: 17, weight: .semibold)).foregroundStyle(SettingsInk.text)
                        .lineLimit(1)
                    Text(Self.shownEmail(email, apple: backend.apple != nil, google: backend.google))
                        .font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
                        .lineLimit(1).truncationMode(.middle)
                        .textSelection(.enabled)
                        .accessibilityIdentifier("settings.signedInWith")
                    HStack(spacing: 5) {
                        Image(systemName: "icloud").font(.system(size: 11)).accessibilityHidden(true)
                        SyncStatusLabel(status: sync?.status ?? .idle, reach: sync?.reach ?? .online)
                    }
                    .font(.system(size: 12))
                    .foregroundStyle(SettingsInk.muted)
                    .lineLimit(1)
                }
                Spacer(minLength: 12)
                VStack(alignment: .trailing, spacing: 6) {
                    SignOutButton(backend: backend, sync: sync, red: false).buttonStyle(.settings)
                }
            }
        }
        .accessibilityIdentifier("settings.accountSummary")
        SettingsGroup(header: "Profile", footer: "Shown in the app and on notes you share.") {
            SettingsLine(title: "Name") {
                TextField("Name", text: $draft, prompt: Text("Add your name"))
                    .labelsHidden()
                    .textFieldStyle(.plain)
                    .multilineTextAlignment(.trailing)
                    .font(.system(size: 13))
                    .foregroundStyle(SettingsInk.text)
                    .focused($editing)
                    .onSubmit { Task { await profile.setName(draft) } }
                    .frame(maxWidth: 240)
                    .accessibilityLabel("Name")
                    .accessibilityIdentifier("settings.profileName")
            }
            SettingsLine(title: "Photo", detail: profile.problem) {
                HStack(spacing: 8) {
                    if profile.working { ProgressView().controlSize(.small) }
                    if profile.photo != nil {
                        Button("Remove") { Task { await profile.removePhoto() } }
                            .buttonStyle(.hoverText)
                            .foregroundStyle(SettingsInk.muted)
                            .accessibilityIdentifier("settings.removePhoto")
                    }
                    Button(profile.photo == nil ? "Choose\u{2026}" : "Change\u{2026}") { importing = true }
                        .buttonStyle(.settings)
                        .accessibilityIdentifier("settings.choosePhoto")
                }
            }
        }
        SettingsGroup(header: "Sign in and sync") {
            SettingsLine(title: "Sync", detail: "Your notes are the same on every device you sign in on.") {
                Button("Sync Now") { Task { await sync?.sync() } }
                    .buttonStyle(.settings)
                    .accessibilityIdentifier("settings.syncNow")
            }
            AppleIDRow(backend: backend)
        }
        notes(signedIn: true)
    }

    @ViewBuilder private var signedOut: some View {
        SettingsSummary {
            HStack(spacing: 14) {
                AvatarView(photo: nil, name: nil, size: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Not signed in").font(.system(size: 17, weight: .semibold)).foregroundStyle(SettingsInk.text)
                    Text(backend.state == .disabled ? "Sync is off. This build keeps notes on this device only."
                         : "Sign in to sync your notes across your iPhone and Mac.")
                        .font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
        notes(signedIn: false)
    }

    private func notes(signedIn: Bool) -> some View {
        SettingsGroup(header: "Your notes") {
            SettingsLine(title: "Export your notes", detail: signedIn ? PrivacyCopy.exportFooter : PrivacyCopy.exportFooterLocal) {
                VStack(alignment: .trailing, spacing: 4) {
                    ExportNotesButton(sync: signedIn ? sync : nil, title: "Export\u{2026}")
                        .buttonStyle(.settings)
                        .font(.system(size: 11.5))
                        .foregroundStyle(SettingsInk.muted)
                }
            }
            if signedIn {
                SettingsLine(title: "Delete account", detail: "Deletes your account and every note in it. Export first to keep a copy.") {
                    VStack(alignment: .trailing, spacing: 4) {
                        DeleteAccountButton(backend: backend, title: "Delete Account\u{2026}")
                            .buttonStyle(.settings)
                            .font(.system(size: 11.5))
                            .foregroundStyle(SettingsInk.muted)
                    }
                }
            }
        }
    }
}

// MARK: Appearance

/// Appearance: System, Light and Dark as pictures of the window; the theme and its accent; the
/// menu bar item.
struct AppearanceSettingsPage: View {
    @State private var mode = AppearanceModeStore.shared
    @AppStorage(MenuBarSettings.key) private var menuBar = true

    var body: some View {
        let look = ThemeStore.shared.look
        SettingsStack {
            SettingsGroup(header: "Mode") {
                HStack(spacing: 14) {
                    ForEach(AppearanceMode.allCases) { m in
                        WindowChoice(title: m.title, selected: mode.mode == m, orange: true, height: 74, id: "settings.mode.\(m.rawValue)") {
                            ModePicture(mode: m, theme: look.theme)
                        } pick: { mode.mode = m }
                    }
                }
                .padding(.vertical, 14)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Mode")
            }
            SettingsGroup(header: "Theme", footer: AppearanceSection.footer(look)) {
                HStack(spacing: 10) {
                    ForEach(Theme.allCases) { t in
                        WindowChoice(title: t.title, selected: look.theme == t, orange: false, height: 46, id: "settings.theme.\(t.rawValue)") {
                            ThemeWindowPicture(theme: t, dark: false)
                        } pick: { ThemeStore.shared.theme = t }
                    }
                }
                .padding(.vertical, 14)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Theme")
                if AppearanceSection.showsAccent(look) {
                    SettingsLine(title: "Accent", detail: look.accent.spokenName) {
                        HStack(spacing: 6) {
                            ForEach(AccentChoice.allCases) { choice in
                                AccentDot(choice: choice, theme: look.theme, selected: look.accent == choice, style: .row) { ThemeStore.shared.accent = choice }
                            }
                        }
                    }
                }
            }
            SettingsGroup(header: "Menu bar") {
                SettingsLine(title: "Show in menu bar", detail: "Capture or find a note from the menu bar, even with the window closed.") {
                    Toggle("Show in menu bar", isOn: $menuBar)
                        .settingsSwitch()
                        .accessibilityIdentifier("settings.menuBar")
                }
            }
        }
        .onAppear { AppearancePage.onScreen += 1 }
        .onDisappear { AppearancePage.onScreen -= 1 }
    }
}

/// A choice drawn as a picture of the window with its name under it; the chosen one ringed, in the
/// accent for the page's one orange control (Mode), in ink for the rest.
private struct WindowChoice<Art: View>: View {
    let title: String
    let selected: Bool
    let orange: Bool
    let height: CGFloat
    let id: String
    @ViewBuilder let art: Art
    let pick: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        Button(action: pick) {
            VStack(spacing: 6) {
                art
                    .frame(height: height)
                    .frame(maxWidth: .infinity)
                    .clipShape(shape)
                    .overlay(shape.strokeBorder(SettingsInk.hairline, lineWidth: 1))
                    .padding(3)
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(selected ? (orange ? Color(PColor.paneAccent) : SettingsInk.text) : .clear, lineWidth: 2))
                Text(title).font(.system(size: 12, weight: selected ? .semibold : .regular))
                    .foregroundStyle(selected ? SettingsInk.text : SettingsInk.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .contentShape(.rect)
        }
        .buttonStyle(.tile(radius: 10))
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier(id)
    }
}

/// System is the window light on the left and dark on the right.
private struct ModePicture: View {
    let mode: AppearanceMode
    let theme: Theme

    var body: some View {
        switch mode {
        case .light: ThemeWindowPicture(theme: theme, dark: false)
        case .dark: ThemeWindowPicture(theme: theme, dark: true)
        case .system:
            ThemeWindowPicture(theme: theme, dark: false).overlay {
                GeometryReader { geo in
                    ThemeWindowPicture(theme: theme, dark: true).mask(alignment: .trailing) { Rectangle().frame(width: geo.size.width / 2) }
                }
            }
        }
    }
}

/// A picture of the notes window in a theme, light or dark: the sidebar, the list and a note.
struct ThemeWindowPicture: View {
    let theme: Theme
    let dark: Bool

    var body: some View {
        let c = theme.preview
        func color(_ h: Theme.Hex) -> Color { let v = dark ? h.dark : h.light; return Color(Palette.pair(v, v)) }
        return GeometryReader { geo in
            let w = geo.size.width
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: w * 0.025) {
                    ForEach(0..<4) { i in
                        HStack(spacing: w * 0.012) {
                            Circle().fill(i == 0 ? color(c.accent) : color(c.muted)).frame(width: w * 0.022)
                            Capsule().fill(color(c.muted).opacity(0.7)).frame(width: w * 0.09, height: w * 0.014)
                        }
                    }
                }
                .padding(w * 0.03)
                .frame(width: w * 0.22, alignment: .topLeading)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(color(c.sidebar))
                VStack(alignment: .leading, spacing: w * 0.03) {
                    ForEach(0..<3) { i in
                        RoundedRectangle(cornerRadius: w * 0.01).fill(i == 0 ? color(c.selection) : .clear)
                            .frame(height: w * 0.07)
                            .overlay(alignment: .leading) {
                                VStack(alignment: .leading, spacing: w * 0.01) {
                                    Capsule().fill(color(c.ink)).frame(width: w * 0.12, height: w * 0.014)
                                    Capsule().fill(color(c.muted)).frame(width: w * 0.08, height: w * 0.01)
                                }
                                .padding(.leading, w * 0.015)
                            }
                    }
                }
                .padding(w * 0.02)
                .frame(width: w * 0.26)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(color(c.list))
                color(c.line).frame(width: 0.5)
                VStack(alignment: .leading, spacing: w * 0.02) {
                    Capsule().fill(color(c.ink)).frame(width: w * 0.2, height: w * 0.024)
                    ForEach(0..<2) { _ in Capsule().fill(color(c.muted)).frame(width: w * 0.36, height: w * 0.012) }
                    HStack(spacing: w * 0.012) {
                        RoundedRectangle(cornerRadius: 2).fill(color(c.accent)).frame(width: w * 0.02, height: w * 0.02)
                        Capsule().fill(color(c.muted)).frame(width: w * 0.22, height: w * 0.012)
                    }
                    RoundedRectangle(cornerRadius: w * 0.01).fill(color(c.code)).frame(width: w * 0.4, height: w * 0.06)
                }
                .padding(w * 0.04)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(color(c.page))
            }
        }
        .accessibilityHidden(true)
    }
}

// MARK: Storage

/// Storage: the space used against the account's limit, then what takes it, largest first.
struct StorageSettingsPage: View {
    /// Nil: captures without an account, which show what the store holds.
    let client: SupabaseClient?
    @State private var store = StorageStore.shared
    @Environment(\.networkReach) private var reach

    static let footer = "Notes, files and apps count as stored, encrypted. Recently Deleted and earlier versions count until they\u{2019}re deleted for good, after 30 days. Files can be up to 100 MB each."

    var body: some View {
        SettingsStack {
            SettingsSummary { summary }
                .accessibilityIdentifier("settings.storage")
            if let u = store.usage {
                SettingsGroup(header: "What takes the space", footer: Self.footer) {
                    ForEach(u.parts.sorted { $0.bytes > $1.bytes }, id: \.name) { part in
                        SettingsLine(title: part.name, detail: Self.detail(part.name)) {
                            Text(StorageUsage.size(part.bytes)).font(.system(size: 13)).monospacedDigit().foregroundStyle(SettingsInk.muted)
                        }
                    }
                }
            }
        }
        .task { if let client { await store.refresh(client, force: false) } }
    }

    /// What each kind is, where it isn't plain from its name.
    static func detail(_ part: String) -> String? {
        switch part {
        case "Recently Deleted": "Deleted notes and files, kept for 30 days."
        case "Earlier versions": "Older versions of your notes, kept for 30 days."
        case "Files": "Pictures, PDFs and other files in your notes."
        case "Apps": "The apps in your notes."
        default: nil
        }
    }

    @ViewBuilder private var summary: some View {
        if let u = store.usage {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text(u.summary).font(.system(size: 17, weight: .semibold)).monospacedDigit().foregroundStyle(SettingsInk.text)
                    Spacer()
                    if u.level != .fine {
                        Text(u.level == .full ? "Full" : "Almost full")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(u.level == .full ? Color.red : Color.orange)
                    }
                }
                // A bar of its own: the Mac's progress bar doesn't take a tint.
                Capsule().fill(SettingsInk.selection)
                    .frame(height: 8)
                    .overlay(alignment: .leading) {
                        GeometryReader { g in
                            Capsule().fill(u.level == .full ? Color.red : u.level == .nearlyFull ? Color.orange : SettingsInk.text)
                                .frame(width: max(8, g.size.width * u.fraction))
                        }
                    }
                    .accessibilityElement()
                    .accessibilityLabel("Storage used")
                    .accessibilityValue(u.summary)
                Text(u.warning?.detail ?? "Every account has \(StorageUsage.size(u.limit)) for its notes, files and apps.")
                    .font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        } else if reach != .online {
            Text("Counted when you\u{2019}re online.").font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
                .accessibilityIdentifier("settings.storageOffline")
        } else {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("Counting\u{2026}").font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
            }
        }
    }
}

// MARK: Help and feedback

/// Help and feedback: the setup guide, answers and a way to write to us, diagnostics, the project
/// on GitHub, then what's new, the version and the terms.
struct HelpSettingsPage: View {
    var signedIn: Bool
    var close: () -> Void = {}
    var copy: @MainActor (String) -> Void = { HelpPage.toClipboard($0) }
    @Environment(\.openURL) private var openURL
    @AppStorage(Telemetry.consentKey) private var share = true
    @State private var noMail = false

    var body: some View {
        SettingsStack {
            SettingsSummary {
                HStack(spacing: 14) {
                    AppMark(size: 40)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Pinto Notes").font(.system(size: 17, weight: .semibold)).foregroundStyle(SettingsInk.text)
                        Text("Version \(AboutSection.version)").font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
                            .monospacedDigit().textSelection(.enabled)
                            .accessibilityIdentifier("settings.version")
                    }
                    Spacer(minLength: 12)
                    Link(destination: WhatsNew.changelogURL) { Text(WhatsNew.title) }
                        .buttonStyle(.settings)
                        .accessibilityIdentifier("settings.whatsNew")
                }
            }
            SettingsGroup(header: "Get help", footer: HelpCopy.feedbackFooter) {
                if HelpPage.offersSetupGuide(signedIn: signedIn) {
                    SettingsLine(title: "Setup guide", detail: HelpCopy.setupGuideFooter) {
                        Button("Show Setup Guide") { HelpPage.playSetupGuide(close: close) }
                            .buttonStyle(.settings)
                            .accessibilityIdentifier("settings.setupGuide")
                    }
                }
                link(HelpCopy.questions, HelpCopy.supportPage, id: "settings.support")
                Button { sendFeedback() } label: {
                    SettingsLinkLine(title: HelpCopy.feedback, detail: noMail ? HelpCopy.noMailApp : nil, trailing: "envelope")
                }
                .buttonStyle(.plain)
                .hoverRow(reach: Self.rowReach)
                .accessibilityIdentifier("settings.feedback")
            }
            SettingsGroup(header: "Diagnostics", footer: DiagnosticsCopy.footer) {
                SettingsLine(title: DiagnosticsCopy.title) {
                    Toggle(DiagnosticsCopy.title, isOn: Binding(get: { share }, set: { share = $0; Telemetry.shared.consent = $0 }))
                        .settingsSwitch()
                        .accessibilityIdentifier("settings.diagnostics")
                }
            }
            SettingsGroup(header: HelpCopy.openSource, footer: HelpCopy.openSourceFooter) {
                ForEach(AboutSection.links, id: \.id) { l in link(l.title, l.url, id: l.id) }
            }
            VStack(alignment: .leading, spacing: 6) {
                LegalLinksRow()
                Text(HelpCopy.trademarks)
                    .font(.system(size: 11))
                    .foregroundStyle(SettingsInk.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 4)
        }
    }

    /// A row's hover reaches the box's edges: the row is inset 14 pt in it.
    static let rowReach = EdgeInsets(top: 0, leading: 14, bottom: 0, trailing: 14)

    private func link(_ title: String, _ url: URL, id: String) -> some View {
        Link(destination: url) { SettingsLinkLine(title: title) }
            .buttonStyle(.plain)
            .hoverRow(reach: Self.rowReach)
            .accessibilityIdentifier(id)
    }

    private func sendFeedback() {
        noMail = false
        openURL(HelpCopy.mail(version: AboutSection.version, system: HelpCopy.system)) { accepted in
            noMail = HelpPage.mailed(accepted: accepted, copy: copy)
        }
    }
}
#endif
