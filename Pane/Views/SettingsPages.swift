import Supabase
import SwiftData
import SwiftUI
#if os(macOS)
import AppKit
import Carbon.HIToolbox
#else
import PhotosUI
#endif

// The pages of Settings, each written once for the Mac and iPhone (7 November 2026): a grouped
// form of sections. The Mac draws it in its card beside the sidebar (SettingsCard), like System
// Settings; iPhone pushes it from its list (SettingsView). Platform branches are only for what
// one of them lacks or does differently: the Mac's menu bar, shortcut and login item, the photo
// picker, the File menu's export. Account, AI Connections, General, Appearance, Security and
// privacy, Storage, Help and feedback; Privacy is PrivacySecurity.swift's.

/// One page of Settings: a grouped form, with the line on being offline at its top. On the Mac, on
/// the card's own ground, its switches in the accent.
struct SettingsPageForm<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        Form {
            // Every page has something that needs the server, so each says it at its top.
            OfflineSection()
            content
        }
        .formStyle(.grouped)
        #if os(macOS)
        // On the card's own ground, the sections a step off it, their edges under the title (the
        // grouped form keeps its own 20 pt, the card's page inset).
        .scrollContentBackground(.hidden)
        .contentMargins(.horizontal, 0, for: .scrollContent)
        .contentMargins(.top, 6, for: .scrollContent)
        // Menus show their value in the text colour, as in System Settings; switches the accent.
        .tint(Color.ink)
        #endif
    }
}

#if os(iOS)
extension View {
    /// The Mac card's layout probe; iPhone has no card.
    func settingsProbe(_ name: String) -> some View { self }
}
#endif

/// A section without a box: the page's own ground behind it (an account's picture and name, the AI
/// cards, which are boxes themselves). The Mac's grouped form draws a box behind every row, so
/// there it's the header of a section without rows.
struct OpenSection<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        #if os(macOS)
        // A header sits 10 pt inside the boxes' edges; this one spans them, like a box.
        Section {} header: {
            content.textCase(nil).font(.body).foregroundStyle(Color.ink).padding(.horizontal, -10)
        }
        #else
        Section { content }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
        #endif
    }
}

/// At the top of a page while the server can't be reached: what still works and what waits.
struct OfflineSection: View {
    @Environment(\.networkReach) private var reach

    var body: some View {
        if reach != .online {
            Section {
                Label(OfflineCopy.settings(reach), systemImage: OfflineCopy.symbol(reach))
                    .foregroundStyle(Color.muted)
                    .accessibilityIdentifier("settings.offline")
            }
        }
    }
}

extension View {
    /// A switch on a Settings row: the system's, small on the Mac (the page's tint is the accent).
    func settingsSwitch() -> some View {
        #if os(macOS)
        toggleStyle(.switch).controlSize(.small).tint(SettingsInk.switchOn)
        #else
        toggleStyle(.switch)
        #endif
    }

    /// A button at the end of a row (Remove…, Show, Save…): the Mac's row button; on iPhone a
    /// borderless one, so two in one row each take their own tap.
    func settingsRowButton() -> some View {
        #if os(macOS)
        buttonStyle(.settings)
        #else
        buttonStyle(.borderless)
        #endif
    }
}

/// A row that leaves the app or opens something: its symbol and words, an arrow or a chevron at
/// the end, the whole row to click. On the Mac the row takes a fill under the pointer.
struct SettingsLinkRow: View {
    let title: String
    var detail: String? = nil
    var symbol: String? = nil
    var trailing = "arrow.up.right"

    var body: some View {
        LabeledContent {
            Image(systemName: trailing).font(.footnote.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
        } label: {
            if let symbol {
                Label { words } icon: { Image(systemName: symbol).foregroundStyle(Color.paneAccent) }
            } else {
                words
            }
        }
        .foregroundStyle(Color.ink)
        .contentShape(.rect)
    }

    @ViewBuilder private var words: some View {
        Text(title)
        if let detail { Text(detail) }
    }
}

extension View {
    /// A whole row that is a button or a link: on the Mac plain, with the row's hover; on iPhone
    /// the list's own row, which highlights as it's tapped.
    @ViewBuilder func settingsRowLink() -> some View {
        #if os(macOS)
        buttonStyle(.plain).hoverRow()
        #else
        self
        #endif
    }
}

// MARK: Account

/// Account: you at the top, centred, as Settings shows your Apple Account (your photo, your name to
/// edit where it is, how you sign in), then sync, then Sign Out… and Delete Account…. iPhone also
/// exports from here; the Mac exports from File › Export All Notes…. Signed out: what signing in
/// adds, and Sign In….
struct AccountSettingsPage: View {
    let backend: Backend
    let sync: SyncEngine?
    /// Tests: what clicking the sync status runs, in place of a real sync.
    var syncNow: (() async -> Void)? = nil
    /// Signed out: Sign In… closes Settings, which covers the sign-in card, and puts the caret in its email field.
    var close: () -> Void = {}
    @State private var profile = ProfileStore.shared
    @State private var draft = ""
    @FocusState private var editing: Bool
    @Environment(\.networkReach) private var reach
    #if os(macOS)
    @State private var importing = false
    @State private var photoMenu = MenuAnchor()
    @State private var nameHover = false
    #else
    @State private var picked: PhotosPickerItem?
    #endif

    var body: some View {
        SettingsPageForm {
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
        #if os(macOS)
        .fileImporter(isPresented: $importing, allowedContentTypes: [.jpeg, .png, .heic, .image]) { result in
            guard case .success(let url) = result else { return }
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { return }
            Task { await profile.setPhoto(data) }
        }
        #else
        .onChange(of: picked) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) { await profile.setPhoto(data) }
                picked = nil
            }
        }
        #endif
    }

    /// The address under your name; never an Apple relay address ("Signed in with Apple").
    static func shownEmail(_ email: String, apple: Bool, google: Bool) -> String {
        let how = SignInShown.label(email: email, apple: apple, google: google)
        return how == email ? email : "Signed in with \(how)"
    }

    /// The status beside Sync, short: "Synced just now", "Synced 5 minutes ago", "Syncing…".
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

    /// Signed out on the Mac, where Export went: the File menu, signed in or not.
    static let exportHint = "File \u{203A} Export All Notes\u{2026} saves a copy of the notes on this Mac."

    /// The space used, short: "1.2 GB of 2 GB".
    static func storageLine(_ u: StorageUsage) -> String { "\(StorageUsage.size(u.used)) of \(StorageUsage.size(u.limit))" }

    /// What the sync control does: a sync, now.
    static func syncNow(_ sync: SyncEngine?, override: (() async -> Void)? = nil) {
        Task { if let override { await override() } else { await sync?.sync() } }
    }

    private func runSync() { Self.syncNow(sync, override: syncNow) }

    @ViewBuilder private func signedIn(email: String) -> some View {
        OpenSection {
            VStack(spacing: 8) {
                photo.padding(.bottom, 4)
                name
                Text(Self.shownEmail(email, apple: backend.apple != nil, google: backend.google))
                    .font(.callout).foregroundStyle(Color.muted)
                    .lineLimit(1).truncationMode(.middle)
                    .textSelection(.enabled)
                    .accessibilityIdentifier("settings.signedInWith")
                if let problem = profile.problem {
                    Text(problem).font(.footnote).foregroundStyle(.red)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("settings.accountSummary")
        }
        Section {
            LabeledContent("Sync") { syncControl }
        }
        #if os(iOS)
        // Next to Delete Account, which says to export first. The Mac's is File › Export All Notes….
        Section {
            ExportNotesButton(sync: sync)
        } footer: {
            Text(PrivacyCopy.exportFooter)
        }
        #endif
        Section {
            SignOutButton(backend: backend, sync: sync)
            // The App Store asks for deleting an account inside the app.
            DeleteAccountButton(backend: backend)
                .settingsProbe("account.delete")
        }
    }

    /// Sync's status, said the same on both, and how to sync now: on the Mac the status is the
    /// button (a click), on iPhone a Sync Now button beside it (a tap needs something to tap).
    private var syncControl: some View {
        TimelineView(.periodic(from: .now, by: 30)) { context in
            let line = Self.syncLine(sync?.status ?? .idle, reach: sync?.reach ?? .online, now: context.date)
            #if os(macOS)
            Button { runSync() } label: {
                HStack(spacing: 5) {
                    if case .syncing = sync?.status { ProgressView().controlSize(.mini) } else {
                        Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 10.5)).accessibilityHidden(true)
                    }
                    Text(line)
                }
                .foregroundStyle(Color.muted)
                .lineLimit(1)
            }
            .buttonStyle(.hoverText)
            .disabled(reach != .online)
            .help("Sync now")
            .accessibilityHint("Syncs now")
            .accessibilityIdentifier("settings.syncStatus")
            .settingsProbe("account.syncStatus")
            #else
            HStack(spacing: 10) {
                if case .syncing = sync?.status { ProgressView().controlSize(.mini) }
                Text(line).foregroundStyle(Color.muted).lineLimit(1)
                    .accessibilityIdentifier("settings.syncStatus")
                Button("Sync Now") { runSync() }
                    .settingsRowButton()
                    .disabled(reach != .online)
                    .accessibilityIdentifier("settings.syncNow")
            }
            #endif
        }
    }

    /// Your photo, with a pencil that says it can be changed: Choose Photo… and Remove Photo.
    @ViewBuilder private var photo: some View {
        let face = ZStack {
            AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: Self.photoSize)
            if profile.working { ProgressView().controlSize(.small) }
        }
        .overlay(alignment: .bottomTrailing) {
            Image(systemName: "pencil")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.ink)
                .frame(width: 24, height: 24)
                .background(Circle().fill(.background))
                .overlay(Circle().strokeBorder(.separator, lineWidth: 0.5))
                .offset(x: 3, y: 3)
                .accessibilityHidden(true)
        }
        #if os(macOS)
        Button { showPhotoMenu() } label: { face.background(MenuAnchorView(anchor: photoMenu)) }
            .buttonStyle(.tile(radius: Self.photoSize / 2))
            .help(profile.photo == nil ? "Choose a photo" : "Change your photo")
            .accessibilityLabel(profile.photo == nil ? "Choose photo" : "Change photo")
            .accessibilityIdentifier("settings.photo")
            .settingsProbe("account.photo")
            .dropDestination(for: URL.self) { urls, _ in
                guard let url = urls.first, let data = try? Data(contentsOf: url) else { return false }
                Task { await profile.setPhoto(data) }
                return true
            }
        #else
        Menu {
            PhotosPicker(profile.photo == nil ? "Choose Photo\u{2026}" : "Change Photo\u{2026}", selection: $picked, matching: .images)
                .accessibilityIdentifier("settings.choosePhoto")
            if profile.photo != nil {
                Button("Remove Photo", role: .destructive) { Task { await profile.removePhoto() } }
                    .accessibilityIdentifier("settings.removePhoto")
            }
        } label: { face }
        .buttonStyle(.plain)
        .accessibilityLabel(profile.photo == nil ? "Choose photo" : "Change photo")
        .accessibilityIdentifier("settings.photo")
        #endif
    }

    #if os(macOS)
    static let photoSize: CGFloat = 64
    #else
    static let photoSize: CGFloat = 84
    #endif

    #if os(macOS)
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
    #endif

    /// Your name, edited where it is: a click or tap puts the caret in it, Return or leaving keeps it.
    private var name: some View {
        TextField("Name", text: $draft, prompt: Text("Add your name").foregroundStyle(Color.muted))
            .labelsHidden()
            .textFieldStyle(.plain)
            .font(.title3.weight(.semibold))
            .foregroundStyle(Color.ink)
            .multilineTextAlignment(.center)
            .focused($editing)
            .onSubmit { Task { await profile.setName(draft) } }
            #if os(macOS)
            // Always a field on the Mac, so it reads as one you can type in (Emil, 6 November 2026).
            .padding(.horizontal, 8)
            .frame(height: 30)
            .background(RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(editing ? SettingsInk.ground : nameHover ? SettingsInk.selection : SettingsInk.group))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(editing ? SettingsInk.edge : SettingsInk.hairline, lineWidth: 1))
            .onHover { nameHover = $0 }
            .frame(maxWidth: 240)
            #endif
            .accessibilityLabel("Name")
            .accessibilityIdentifier("settings.profileName")
            .settingsProbe("account.name")
    }

    @ViewBuilder private var signedOut: some View {
        Section {
            HStack(spacing: 14) {
                AvatarView(photo: nil, name: nil, size: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Not signed in").font(.headline).foregroundStyle(Color.ink)
                    // One line beside Sign In…, which says what to do (council round 11).
                    Text(backend.state == .disabled ? "Sync is off. This build keeps notes on this device only." : SignInView.shortLine)
                        .font(.callout).foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 12)
                if backend.state != .disabled {
                    Button("Sign In\u{2026}") {
                        close()
                        // Once Settings has gone, the sign-in card's email field takes the caret.
                        DispatchQueue.main.async { NotificationCenter.default.post(name: SignInView.focusEmailNotice, object: nil) }
                    }
                    .settingsRowButton()
                    .accessibilityIdentifier("settings.signIn")
                }
            }
            .padding(.vertical, 4)
        } footer: {
            #if os(macOS)
            Text(Self.exportHint).accessibilityIdentifier("settings.exportHint")
            #endif
        }
        #if os(iOS)
        // Signed out, the notes on this device are still yours to take.
        Section {
            ExportNotesButton(sync: nil)
        } footer: {
            Text(PrivacyCopy.exportFooterLocal)
        }
        #endif
    }
}

// MARK: General

/// General: today's note, whether ticked items sink, this Mac's menu bar, shortcut and login
/// item (the Mac only), keys for apps in notes (iPhone only: parked on the Mac, Emil, 6 November
/// 2026), and the diagnostics switch. The setup guide is on Help and feedback.
struct GeneralSettingsPage: View {
    @Environment(\.modelContext) private var context
    @AppStorage(TodaysNoteSettings.folderKey, store: TodaysNoteSettings.store) private var folder = DailyNotes.folderName
    @AppStorage(TodaysNoteSettings.titleKey, store: TodaysNoteSettings.store) private var title = TodaysNoteSettings.Title.long
    @AppStorage(TodaysNoteSettings.templateKey, store: TodaysNoteSettings.store) private var template = ""
    @AppStorage(TodaysNoteSettings.launchKey, store: TodaysNoteSettings.store) private var openOnLaunch = false
    @AppStorage(ChecklistSorting.key, store: ChecklistSorting.store) private var sortsTicked = true
    #if os(macOS)
    @AppStorage(MenuBarSettings.key) private var menuBar = true
    @State private var login = LoginItem.isOn
    #endif

    static let menuBarDetail = "Write or find a note with the window closed."

    var body: some View {
        let choices = GeneralChoices(context: context)
        SettingsPageForm {
            Section {
                Picker("Folder", selection: $folder) { ForEach(choices.folders(keeping: folder), id: \.self) { Text($0).tag($0) } }
                    .accessibilityIdentifier("settings.today.folder")
                Picker("Title", selection: $title) { ForEach(TodaysNoteSettings.Title.allCases) { Text(GeneralChoices.example($0)).tag($0) } }
                    .accessibilityIdentifier("settings.today.title")
                Picker("Template", selection: $template) {
                    Text("None").tag("")
                    ForEach(choices.templates(keeping: template), id: \.id) { Text($0.title).tag($0.id.uuidString) }
                }
                .accessibilityIdentifier("settings.today.template")
                Toggle(GeneralCopy.openOnLaunch, isOn: $openOnLaunch).settingsSwitch().accessibilityIdentifier("settings.today.launch")
            } header: {
                Text(GeneralCopy.today)
            } footer: {
                Text(GeneralCopy.todayFooter)
            }
            Section(GeneralCopy.checklists) {
                Toggle(GeneralCopy.ticked, isOn: $sortsTicked).settingsSwitch().accessibilityIdentifier("settings.notes.ticked")
            }
            #if os(macOS)
            Section(GeneralCopy.thisMac) {
                Toggle(isOn: $menuBar) {
                    Text("Show in menu bar")
                    Text(Self.menuBarDetail)
                }
                .settingsSwitch()
                .accessibilityIdentifier("settings.menuBar")
                LabeledContent {
                    ShortcutRecorder()
                } label: {
                    Text(GeneralCopy.shortcut)
                    Text(GeneralCopy.shortcutDetail)
                }
                Toggle(GeneralCopy.login, isOn: Binding(get: { login }, set: { on in LoginItem.set(on); login = LoginItem.isOn; SettingsUsage.shared.check(asksSystem: true) }))
                    .settingsSwitch()
                    .accessibilityIdentifier("settings.openAtLogin")
            }
            #else
            if NoteApps.enabled { APIKeysSection() }
            #endif
        }
        #if os(macOS)
        .onAppear { login = LoginItem.isOn }
        #endif
    }
}

#if os(macOS)
/// The quick note shortcut's chip: click, press the keys; Delete clears it, Escape keeps it.
private struct ShortcutRecorder: View {
    @State private var shortcut = QuickNoteHotKey.shared.shortcut
    @State private var recording = false
    @State private var monitor: Any?

    var body: some View {
        Button { recording ? stop() : start() } label: {
            Text(recording ? GeneralCopy.typeShortcut : shortcut?.display ?? GeneralCopy.record)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(shortcut == nil && !recording ? SettingsInk.muted : SettingsInk.text)
                .padding(.horizontal, 8).frame(height: 22)
                .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(SettingsInk.selection))
                .overlay { if recording { RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(SettingsInk.text.opacity(0.5), lineWidth: 1) } }
        }
        .buttonStyle(.tile(radius: 6))
        .accessibilityLabel(GeneralCopy.shortcut)
        .accessibilityValue(shortcut?.display ?? "None")
        .accessibilityIdentifier("settings.quickNoteShortcut")
        .onDisappear { stop() }
    }

    private func start() {
        recording = true
        monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            switch Int(event.keyCode) {
            case kVK_Delete, kVK_ForwardDelete:
                QuickNoteHotKey.shared.shortcut = nil
                shortcut = nil
                stop()
            case kVK_Escape:
                stop()
            default:
                guard let s = QuickNoteHotKey.shortcut(keyCode: event.keyCode, flags: event.modifierFlags, characters: event.charactersIgnoringModifiers) else { NSSound.beep(); return nil }
                QuickNoteHotKey.shared.shortcut = s
                shortcut = s
                stop()
            }
            return nil
        }
    }

    private func stop() {
        recording = false
        if let monitor { NSEvent.removeMonitor(monitor) }
        monitor = nil
    }
}
#endif

// MARK: Storage

/// Storage: the space used against the limit, what takes it, and what counts.
struct StorageSettingsPage: View {
    let backend: Backend
    @State private var storage = StorageStore.shared

    var body: some View {
        SettingsPageForm { StorageSectionBody(usage: storage.usage) }
            .task(id: backend.state) { await storage.refresh(backend.client, force: false) }
    }
}

// MARK: Help and feedback

/// Help and feedback: answers, a message to us, an issue, the project on GitHub, the setup guide
/// again, what's new, and the terms. The Help menu has the same on the Mac; the version is at the
/// foot of the Mac's sidebar, on iPhone a row here.
struct HelpSettingsPage: View {
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
        SettingsPageForm {
            Section {
                link(HelpCopy.questions, HelpCopy.supportPage, symbol: "questionmark.circle", id: "settings.support")
                Button { sendFeedback() } label: { SettingsLinkRow(title: HelpCopy.feedback, symbol: "envelope") }
                    .settingsRowLink()
                    .accessibilityIdentifier("settings.feedback")
                if noMail {
                    Label(HelpCopy.noMailApp, systemImage: "doc.on.doc")
                        .font(.footnote)
                        .foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("settings.feedbackCopied")
                }
                link(HelpCopy.report, ShareAsk.newIssue, symbol: "exclamationmark.bubble", id: "settings.reportIssue")
            } footer: {
                Text(HelpCopy.feedbackFooter)
            }
            Section {
                ForEach(AboutSection.links, id: \.id) { l in link(l.title, l.url, symbol: l.symbol, id: l.id) }
            } header: {
                Text(HelpCopy.openSource)
            } footer: {
                Text(HelpCopy.openSourceFooter)
            }
            if HelpPage.offersSetupGuide(signedIn: signedIn) {
                Section {
                    Button { HelpPage.playSetupGuide(close: close) } label: {
                        SettingsLinkRow(title: HelpCopy.setupGuide, symbol: "sparkles", trailing: "chevron.right")
                    }
                    .settingsRowLink()
                    .accessibilityIdentifier("settings.setupGuide")
                } footer: {
                    Text(HelpCopy.setupGuideFooter)
                }
            }
            Section {
                // What changed in each version, on the website: the app shows no release notes by itself.
                link(WhatsNew.title, WhatsNew.changelogURL, symbol: "sparkles.rectangle.stack", id: "settings.whatsNew")
                #if os(iOS)
                LabeledContent("Version") {
                    Text(AboutSection.version).textSelection(.enabled).monospacedDigit()
                }
                .accessibilityIdentifier("settings.version")
                #endif
            } footer: {
                VStack(alignment: .leading, spacing: 6) {
                    LegalLinksRow()
                    #if os(iOS)
                    // The import list shows these apps' own icons; on the Mac this is About's credits.
                    Text(HelpCopy.trademarks)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    #endif
                }
            }
        }
    }

    private func link(_ title: String, _ url: URL, symbol: String?, id: String) -> some View {
        Link(destination: url) { SettingsLinkRow(title: title, symbol: symbol) }
            .settingsRowLink()
            .accessibilityIdentifier(id)
    }

    private func sendFeedback() {
        noMail = false
        openURL(HelpCopy.mail(version: AboutSection.version, system: HelpCopy.system)) { accepted in
            noMail = HelpPage.mailed(accepted: accepted, copy: copy)
        }
    }
}

// MARK: Appearance

/// Appearance: System, Light and Dark as pictures of the window; the theme and its accent; on the
/// Mac the size of note text (iPhone follows the system's text size). For this device only.
struct AppearanceSettingsPage: View {
    /// How many are on screen, for tests: Appearance shows on its own page only.
    @MainActor static var onScreen = 0
    @State private var mode = AppearanceModeStore.shared
    @Environment(\.colorScheme) private var scheme

    /// The accent row shows for every theme but High contrast, which draws with its own blue and yellow.
    static func showsAccent(_ look: ThemeLook) -> Bool { look.theme != .contrast }

    static func footer(_ look: ThemeLook) -> String {
        look.theme == .contrast ? "High contrast uses its own blue and yellow. Set on each device." : "Set on each device."
    }

    #if os(macOS)
    static let modeHeight: CGFloat = 74, themeHeight: CGFloat = 46
    #else
    static let modeHeight: CGFloat = 56, themeHeight: CGFloat = 56
    #endif

    /// Three across for the modes; the themes all in a row on the Mac, three across on iPhone, each
    /// wide enough to tap.
    static func columns(_ count: Int) -> [GridItem] {
        #if os(macOS)
        Array(repeating: GridItem(.flexible(), spacing: 10), count: count)
        #else
        Array(repeating: GridItem(.flexible(), spacing: 10), count: min(count, 3))
        #endif
    }

    var body: some View {
        let look = ThemeStore.shared.look
        SettingsPageForm {
            Section("Mode") {
                LazyVGrid(columns: Self.columns(AppearanceMode.allCases.count), spacing: 12) {
                    ForEach(AppearanceMode.allCases) { m in
                        WindowChoice(title: m.title, selected: mode.mode == m, height: Self.modeHeight, id: "settings.mode.\(m.rawValue)") {
                            ModePicture(mode: m, theme: look.theme)
                        } pick: { mode.mode = m }
                    }
                }
                .padding(.vertical, 8)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Mode")
            }
            Section {
                LazyVGrid(columns: Self.columns(Theme.allCases.count), spacing: 12) {
                    ForEach(Theme.allCases) { t in
                        WindowChoice(title: t.title, selected: look.theme == t, height: Self.themeHeight, id: "settings.theme.\(t.rawValue)") {
                            // In the mode showing now: dark Settings showed six light windows.
                            ThemeWindowPicture(theme: t, dark: scheme == .dark)
                        } pick: { ThemeStore.shared.theme = t }
                    }
                }
                .padding(.vertical, 8)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Theme")
                if Self.showsAccent(look) {
                    AccentPicker(look: look, style: .current)
                }
            } header: {
                Text("Theme")
            } footer: {
                Text(Self.footer(look))
            }
            #if os(macOS)
            // Persona council 11-04: note text from 13 to 24 pt, as Notes' and Books' View menus do it.
            Section {
                TextSizeRow()
                TextSizeSample()
            } header: {
                Text("Text size")
            } footer: {
                Text(TextSizeRow.footer)
            }
            #endif
        }
        .onAppear { Self.onScreen += 1 }
        .onDisappear { Self.onScreen -= 1 }
    }
}

#if os(macOS)
/// Text size: a slider of five stops between a small and a large A, the size in points beside it.
/// It changes every open note as it moves, and the sample under it.
struct TextSizeRow: View {
    @AppStorage(TextSize.key) private var stored: Double = 0

    static let label = "Note text"
    static let footer = "View \u{203A} Make Text Bigger and Make Text Smaller change it too."

    var body: some View {
        let size = TextSize.size(stored: stored)
        LabeledContent {
            HStack(spacing: 10) {
                Text("A").font(.system(size: 11)).foregroundStyle(Color.muted).accessibilityHidden(true)
                Slider(value: Binding(get: { Double(TextSize.index(of: size)) },
                                      set: { TextSize.set(TextSize.steps[min(max(Int($0.rounded()), 0), TextSize.steps.count - 1)]) }),
                       in: 0...Double(TextSize.steps.count - 1), step: 1)
                    .labelsHidden()
                    .frame(width: 180)
                    // Its name and size in words: the Mac's slider read its step number, "0" (round 15).
                    .accessibilityLabel(Self.label)
                    .accessibilityValue(TextSize.spoken(size))
                    .accessibilityAdjustableAction { direction in
                        let i = TextSize.index(of: size)
                        switch direction {
                        case .increment: TextSize.set(TextSize.steps[min(i + 1, TextSize.steps.count - 1)])
                        case .decrement: TextSize.set(TextSize.steps[max(i - 1, 0)])
                        @unknown default: break
                        }
                    }
                    .accessibilityIdentifier("settings.textSize")
                Text("A").font(.system(size: 19)).foregroundStyle(Color.muted).accessibilityHidden(true)
                Text("\(Int(size)) pt")
                    .font(.system(size: 12).monospacedDigit())
                    .foregroundStyle(Color.muted)
                    .frame(width: 36, alignment: .trailing)
                    .accessibilityHidden(true)
            }
        } label: {
            // "Note text" under the Text size header, not the header again (UI council round 7).
            Text(Self.label)
        }
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
            .foregroundStyle(Color.ink)
            .lineLimit(2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 6)
            .animation(reduceMotion ? nil : .snappy(duration: 0.15), value: stored)
            .accessibilityLabel("Sample: \(Self.text)")
            .accessibilityIdentifier("settings.textSizeSample")
    }
}
#endif

/// A choice drawn as a picture of the window with its name under it; the chosen one ringed in ink,
/// the same for Mode and Theme.
private struct WindowChoice<Art: View>: View {
    /// The name under the picture: 12 pt on both (the Mac's caption is 10).
    #if os(macOS)
    static var label: Font { .system(size: 12) }
    #else
    static var label: Font { .caption }
    #endif

    let title: String
    let selected: Bool
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
                    .overlay(shape.strokeBorder(Color(PColor.paneSeparator), lineWidth: 1))
                    .padding(3)
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(selected ? Color.ink : .clear, lineWidth: 2))
                Text(title).font(Self.label.weight(selected ? .semibold : .regular))
                    .foregroundStyle(selected ? Color.ink : Color.muted)
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

// MARK: AI Connections

/// AI Connections: a card per AI (ChatGPT, Claude, Grok, Other apps), each saying where it stands,
/// with Connect… or Manage. The line on what an AI may do and which company the notes go to is at
/// the top, always in view, in every stage (App Review rejected 1.2 for hiding the company). The
/// Mac runs the setup card's flows from its cards (ConnectAIPage); iPhone connects in the browser
/// or on the Mac (ConnectChoices).
struct AIConnectionsPage: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    #if os(macOS)
    /// Captures: the page waiting for this AI.
    var previewWaiting: SetupCards.AI? = nil
    #endif

    var body: some View {
        SettingsPageForm {
            #if os(macOS)
            OpenSection {
                VStack(alignment: .leading, spacing: 8) {
                    sent.font(.callout)
                    ConnectAIPage(client: client, preview: preview, previewWaiting: previewWaiting)
                }
            }
            #else
            Section {
                ConnectChoices(client: client, preview: preview, cards: true)
            } header: {
                sent.font(.footnote).textCase(nil).padding(.bottom, 4)
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
            #endif
            if NoteApps.enabled, NoteApps.realPreviews { AppPreviewSection(client: client) }
        }
        .connectGuides(client: client)
    }

    /// Who the notes go to: never behind a disclosure, and there while a connection is made too.
    private var sent: some View {
        Text(ConnectCopy.page)
            .foregroundStyle(Color.muted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("connect.sent")
            .settingsProbe("connect.sent")
    }
}

// MARK: Help menu

#if os(macOS)
/// What the Help and feedback page has, in the Help menu (RootView's PaneCommands) and the account
/// menu: answers on the website, feedback by email, the project on GitHub, and Connect an AI's
/// "Having trouble?".
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
