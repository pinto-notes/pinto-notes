#if os(macOS)
import AppKit
import Supabase
import SwiftUI

// The pages of Settings on the Mac, in the System Settings form (SettingsForm). Four pages since
// 3 November 2026 ("simplify and cut things"): Account, Connect an AI, Appearance, Privacy and
// security. What left Settings is in a menu (MacHelp, the Help menu, the account menu).

// MARK: Account

/// Account: one card (Emil, 3 November 2026: "simplify and cut things"). Your photo (click it to
/// change or remove it), your name (edit it on the card), your email, the sync status (click it to
/// sync now) and the space used. Under the card, Sign Out… and a quiet Delete Account…. Export is
/// File › Export All Notes…; Sign in with Apple is offered only when signing in.
struct AccountSettingsPage: View {
    let backend: Backend
    let sync: SyncEngine?
    /// Tests: what clicking the sync status runs, in place of a real sync.
    var syncNow: (() async -> Void)? = nil
    /// Signed out: Sign In… closes Settings, which covers the sign-in card, and puts the caret in its email field.
    var close: () -> Void = {}
    @State private var profile = ProfileStore.shared
    @State private var storage = StorageStore.shared
    @State private var draft = ""
    @State private var importing = false
    @State private var photoMenu = MenuAnchor()
    @State private var nameHover = false
    @FocusState private var editing: Bool
    @Environment(\.networkReach) private var reach

    var body: some View {
        SettingsStack {
            switch backend.state {
            case .signedIn(let email): signedIn(email: backend.displayEmail ?? email)
            default: signedOut
            }
        }
        .task(id: backend.state) { await profile.bind(backend) }
        .task(id: backend.state) { await storage.refresh(backend.client, force: false) }
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

    /// The status under your email, short: "Synced just now", "Synced 5 minutes ago", "Syncing…".
    /// Offline, or refused, it says why, as SyncStatusLabel does.
    static func syncLine(_ status: SyncEngine.Status, reach: SyncEngine.Reach, now: Date = .now) -> String {
        if let away = SyncStatusLabel.away(status, reach: reach) { return away }
        switch status {
        case .idle: return "Not synced yet"
        case .syncing: return "Syncing\u{2026}"
        case .synced(let d):
            return now.timeIntervalSince(d) < 60 ? "Synced just now" : "Synced \(d.formatted(.relative(presentation: .named, unitsStyle: .wide)))"
        case .offline(let why): return why
        }
    }

    /// Signed out, where Export went: the File menu, signed in or not.
    static let exportHint = "File \u{203A} Export All Notes\u{2026} saves a copy of the notes on this Mac."

    /// The space used, short: "1.2 GB of 2 GB".
    static func storageLine(_ u: StorageUsage) -> String { "\(StorageUsage.size(u.used)) of \(StorageUsage.size(u.limit))" }

    private func runSync() { Self.syncNow(sync, override: syncNow) }

    /// What clicking the sync status does: a sync, now.
    static func syncNow(_ sync: SyncEngine?, override: (() async -> Void)? = nil) {
        Task { if let override { await override() } else { await sync?.sync() } }
    }

    @ViewBuilder private func signedIn(email: String) -> some View {
        SettingsSummary {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 14) {
                    photo
                    VStack(alignment: .leading, spacing: 2) {
                        name
                        Text(Self.shownEmail(email, apple: backend.apple != nil, google: backend.google))
                            .font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
                            .lineLimit(1).truncationMode(.middle)
                            .textSelection(.enabled)
                            .padding(.leading, 4)
                            .accessibilityIdentifier("settings.signedInWith")
                        syncStatus.padding(.leading, 4)
                        if let problem = profile.problem {
                            Text(problem).font(.system(size: 12)).foregroundStyle(.red).padding(.leading, 4)
                        }
                    }
                    Spacer(minLength: 0)
                }
                if let u = storage.usage {
                    SettingsInk.hairline.frame(height: 0.5)
                    storageBar(u)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("settings.accountSummary")
        HStack(spacing: 12) {
            SignOutButton(backend: backend, sync: sync, red: false).buttonStyle(.settings)
            Spacer(minLength: 12)
            // Quiet, but there: the App Store asks for deleting an account inside the app.
            DeleteAccountButton(backend: backend, title: "Delete Account\u{2026}")
                .buttonStyle(.hoverText)
                .font(.system(size: 12.5))
                .settingsProbe("account.delete")
        }
        .padding(.horizontal, 4)
    }

    /// Your photo: click it for Choose Photo… and Remove Photo. A photo can be dropped on it too.
    private var photo: some View {
        Button { showPhotoMenu() } label: {
            ZStack {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 54)
                if profile.working { ProgressView().controlSize(.small) }
            }
            .background(MenuAnchorView(anchor: photoMenu))
        }
        .buttonStyle(.tile(radius: 30))
        .help(profile.photo == nil ? "Choose a photo" : "Change your photo")
        .accessibilityLabel(profile.photo == nil ? "Choose photo" : "Change photo")
        .accessibilityIdentifier("settings.photo")
        .settingsProbe("account.photo")
        .dropDestination(for: URL.self) { urls, _ in
            guard let url = urls.first, let data = try? Data(contentsOf: url) else { return false }
            Task { await profile.setPhoto(data) }
            return true
        }
    }

    private func showPhotoMenu() {
        let menu = NSMenu()
        menu.autoenablesItems = false
        menu.addItem(AccountMenu.Item("Choose Photo\u{2026}", symbol: "photo") { importing = true })
        if profile.photo != nil {
            menu.addItem(AccountMenu.Item("Remove Photo", symbol: "trash") { Task { await profile.removePhoto() } })
        }
        guard let view = photoMenu.view else { importing = true; return }
        menu.popUp(positioning: nil, at: NSPoint(x: 0, y: view.isFlipped ? view.bounds.height + 4 : -4), in: view)
    }

    /// Your name, edited where it is: a click puts the caret in it, Return or a click away keeps it.
    private var name: some View {
        TextField("Name", text: $draft, prompt: Text("Add your name").foregroundStyle(SettingsInk.muted))
            .labelsHidden()
            .textFieldStyle(.plain)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(SettingsInk.text)
            .focused($editing)
            .onSubmit { Task { await profile.setName(draft) } }
            .padding(.horizontal, 4)
            .padding(.vertical, 1)
            .background(RoundedRectangle(cornerRadius: 5, style: .continuous)
                .fill(editing ? SettingsInk.ground : nameHover ? SettingsInk.selection : .clear))
            .overlay(RoundedRectangle(cornerRadius: 5, style: .continuous).strokeBorder(editing ? SettingsInk.edge : .clear, lineWidth: 1))
            .onHover { nameHover = $0 }
            .frame(maxWidth: 300, alignment: .leading)
            .accessibilityLabel("Name")
            .accessibilityIdentifier("settings.profileName")
            .settingsProbe("account.name")
    }

    /// "Synced 2 minutes ago": click it to sync now.
    private var syncStatus: some View {
        TimelineView(.periodic(from: .now, by: 30)) { context in
            Button { runSync() } label: {
                HStack(spacing: 5) {
                    if case .syncing = sync?.status { ProgressView().controlSize(.mini) } else {
                        Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 10.5)).accessibilityHidden(true)
                    }
                    Text(Self.syncLine(sync?.status ?? .idle, reach: sync?.reach ?? .online, now: context.date))
                }
                .font(.system(size: 12))
                .foregroundStyle(SettingsInk.muted)
                .lineLimit(1)
            }
            .buttonStyle(.hoverText)
            .disabled(reach != .online)
            .help("Sync now")
            .accessibilityHint("Syncs now")
            .accessibilityIdentifier("settings.syncStatus")
            .settingsProbe("account.syncStatus")
        }
    }

    private func storageBar(_ u: StorageUsage) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(alignment: .firstTextBaseline) {
                Text(Self.storageLine(u)).font(.system(size: 13)).monospacedDigit().foregroundStyle(SettingsInk.text)
                Spacer()
                if u.level != .fine {
                    Text(u.level == .full ? "Full" : "Almost full")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(u.level == .full ? Color.red : Color.orange)
                }
            }
            // A bar of its own: the Mac's progress bar doesn't take a tint.
            Capsule().fill(SettingsInk.selection)
                .frame(height: 6)
                .overlay(alignment: .leading) {
                    GeometryReader { g in
                        Capsule().fill(u.level == .full ? Color.red : u.level == .nearlyFull ? Color.orange : SettingsInk.text)
                            .frame(width: max(6, g.size.width * u.fraction))
                    }
                }
                .accessibilityElement()
                .accessibilityLabel("Storage used")
                .accessibilityValue(u.summary)
            if let warning = u.warning {
                Text(warning.detail)
                    .font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .accessibilityIdentifier("settings.storage")
    }

    @ViewBuilder private var signedOut: some View {
        SettingsSummary {
            HStack(spacing: 14) {
                AvatarView(photo: nil, name: nil, size: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Not signed in").font(.system(size: 17, weight: .semibold)).foregroundStyle(SettingsInk.text)
                    // One line beside Sign In…, which says what to do (council round 11: the longer
                    // line left "or Claude." alone on a second line).
                    Text(backend.state == .disabled ? "Sync is off. This build keeps notes on this device only."
                         : SignInView.shortLine)
                        .font(.system(size: 13)).foregroundStyle(SettingsInk.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 12)
                if backend.state != .disabled {
                    Button("Sign In\u{2026}") {
                        close()
                        // Once Settings has gone, the card's email field takes the caret.
                        DispatchQueue.main.async { NotificationCenter.default.post(name: SignInView.focusEmailNotice, object: nil) }
                    }
                        .buttonStyle(.settings)
                        .accessibilityIdentifier("settings.signIn")
                }
            }
        }
        Text(AccountSettingsPage.exportHint)
            .font(.system(size: 12)).foregroundStyle(SettingsInk.muted)
            .padding(.horizontal, 4)
            .accessibilityIdentifier("settings.exportHint")
    }
}

// MARK: Appearance

/// Appearance: System, Light and Dark as pictures of the window; the theme and its accent; the
/// menu bar item.
struct AppearanceSettingsPage: View {
    @State private var mode = AppearanceModeStore.shared
    @AppStorage(MenuBarSettings.key) private var menuBar = true
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let look = ThemeStore.shared.look
        SettingsStack {
            SettingsGroup(header: "Mode") {
                HStack(spacing: 14) {
                    ForEach(AppearanceMode.allCases) { m in
                        WindowChoice(title: m.title, selected: mode.mode == m, orange: false, height: 74, id: "settings.mode.\(m.rawValue)") {
                            ModePicture(mode: m, theme: look.theme)
                        } pick: { mode.mode = m }
                    }
                }
                .padding(.vertical, 14)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Mode")
            }
            SettingsGroup(header: "Theme", footer: AppearanceSection.macFooter(look)) {
                HStack(spacing: 10) {
                    ForEach(Theme.allCases) { t in
                        WindowChoice(title: t.title, selected: look.theme == t, orange: false, height: 46, id: "settings.theme.\(t.rawValue)") {
                            // In the mode showing now: dark Settings showed six light windows.
                            ThemeWindowPicture(theme: t, dark: scheme == .dark)
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
            // Persona council 11-04: note text from 13 to 24 pt, as Notes' and Books' View menus do it.
            SettingsGroup(header: "Text size", footer: TextSizeRow.footer) {
                TextSizeRow()
                TextSizeSample()
            }
            SettingsGroup {
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

/// Text size: a slider of five stops between a small and a large A, the size in points beside it.
/// It changes every open note as it moves, and the sample under it.
struct TextSizeRow: View {
    @AppStorage(TextSize.key) private var stored: Double = 0

    static let label = "Note text"
    static let footer = "Note text on this Mac. Make Text Bigger and Make Text Smaller in the View menu change it too."

    var body: some View {
        let size = TextSize.size(stored: stored)
        HStack(spacing: 10) {
            // "Note text" under the Text size header, not the header again (UI council round 7).
            Text(Self.label).font(.system(size: 13)).foregroundStyle(SettingsInk.text)
            Spacer(minLength: 12)
            Text("A").font(.system(size: 11)).foregroundStyle(SettingsInk.muted).accessibilityHidden(true)
            Slider(value: Binding(get: { Double(TextSize.index(of: size)) },
                                  set: { TextSize.set(TextSize.steps[min(max(Int($0.rounded()), 0), TextSize.steps.count - 1)]) }),
                   in: 0...Double(TextSize.steps.count - 1), step: 1)
                .labelsHidden()
                .tint(SettingsInk.switchOn)
                .frame(width: 180)
                .accessibilityLabel(Self.label)
                .accessibilityValue(TextSize.spoken(size))
                .accessibilityIdentifier("settings.textSize")
            Text("A").font(.system(size: 19)).foregroundStyle(SettingsInk.muted).accessibilityHidden(true)
            Text("\(Int(size)) pt")
                .font(.system(size: 12).monospacedDigit())
                .foregroundStyle(SettingsInk.muted)
                .frame(width: 36, alignment: .trailing)
                .accessibilityHidden(true)
        }
        .frame(minHeight: 44)
    }
}

/// A line of a note at the chosen size, as the notes will show it.
struct TextSizeSample: View {
    @AppStorage(TextSize.key) private var stored: Double = 0
    static let text = "Four days of tiles, trams and pastries in May."
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Text(Self.text)
            .font(.system(size: TextSize.size(stored: stored)))
            .foregroundStyle(SettingsInk.text)
            .lineLimit(2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 12)
            .animation(reduceMotion ? nil : .snappy(duration: 0.15), value: stored)
            .accessibilityLabel("Sample: \(Self.text)")
            .accessibilityIdentifier("settings.textSizeSample")
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

// MARK: Help menu

/// What the Help and feedback page held, now in the Help menu (RootView's PaneCommands) and the
/// account menu: answers on the website, feedback by email, the project on GitHub, and Connect an
/// AI's "Having trouble?".
@MainActor
enum MacHelp {
    /// The Help menu's items after Keyboard Shortcuts, What's New… and Show Setup Guide, in order.
    static let menu = [questionsTitle, feedbackTitle, reportTitle, githubTitle, connectHelp]
    static let questionsTitle = "Questions and Answers"
    static let feedbackTitle = "Send Feedback\u{2026}"
    static let reportTitle = "Report an Issue\u{2026}"
    static let githubTitle = "Pinto Notes on GitHub"
    static let connectHelp = "Help Connecting an AI\u{2026}"

    static func questions() { NSWorkspace.shared.open(HelpCopy.supportPage) }
    static func reportIssue() { NSWorkspace.shared.open(ShareAsk.newIssue) }
    static func github() { NSWorkspace.shared.open(ShareAsk.repository) }

    /// A message to us in the mail app. With no mail app the address is copied, and an alert says so.
    static func sendFeedback(open: (URL) -> Bool = { NSWorkspace.shared.open($0) }, copy: (String) -> Void = { HelpPage.toClipboard($0) },
                             tell: (String) -> Void = { tellNoMail($0) }) {
        let mailed = open(HelpCopy.mail(version: AboutSection.version, system: HelpCopy.system))
        if HelpPage.mailed(accepted: mailed, copy: copy) { tell(HelpCopy.noMailApp) }
    }

    private static func tellNoMail(_ line: String) {
        let alert = NSAlert()
        alert.messageText = "No mail app opened"
        alert.informativeText = line
        alert.runModal()
    }

    /// Connect an AI's "Having trouble?": Settings at Connect an AI, with the help sheet over it.
    static func helpConnecting(route: SettingsRoute = .shared, asks: ConnectHelpAsk = .shared) {
        asks.pending = true
        route.open(.ai)
    }
}

/// The Help menu's Help Connecting an AI… asks Connect an AI to open its help when it shows.
@MainActor @Observable
final class ConnectHelpAsk {
    static let shared = ConnectHelpAsk()
    var pending = false
}
#endif
