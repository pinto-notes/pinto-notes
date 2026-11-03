import PhotosUI
import Supabase
import SwiftUI
import UniformTypeIdentifiers

/// The pages of Settings: rows that open a page on iPhone; on the Mac, where links land in the
/// card's sidebar (SettingsPlace).
enum SettingsTab: String, CaseIterable, Identifiable, Hashable {
    case general, appearance, account, ai, security, storage, help

    var id: String { rawValue }

    /// iPhone's rows, in groups, in the Mac sidebar's order (SettingsPlace.groups) less Account,
    /// which sits under you on iPhone. Help and feedback is last, alone, as on the Mac.
    static let phoneGroups: [[SettingsTab]] = [[.ai, .general, .appearance], [.security, .storage], [.help]]

    var title: String {
        switch self {
        case .general: "General"
        case .appearance: "Appearance"
        case .account: "Account"
        case .ai: "AI"
        case .security: PrivacyCopy.title
        case .storage: "Storage"
        case .help: "Help and feedback"
        }
    }

    var symbol: String {
        switch self {
        case .general: "gearshape"
        case .appearance: "circle.lefthalf.filled"
        case .account: "person.crop.circle"
        case .ai: "sparkles"
        case .security: "lock.shield"
        case .storage: "externaldrive"
        case .help: "questionmark.circle"
        }
    }
}

/// Account, sync status, the AIs connected to your notes, your devices and your storage.
struct SettingsView: View {
    let backend: Backend
    let sync: SyncEngine?
    var crypto: AccountCrypto = .shared
    var devices: KeyDevices = .shared
    /// Captures: shows these instead of asking the server.
    var connections: [Connection]? = nil
    #if os(macOS)
    /// Captures: Connect an AI waiting for this AI.
    var connectWaiting: SetupCards.AI? = nil
    #endif
    var route: SettingsRoute = .shared
    #if os(macOS)
    /// Captures: the page to open on, and a search already typed.
    var start: SettingsPlace? = nil
    var search = ""
    /// Over the notes window: closes the card (RootView). Nil: Settings is in a sheet of its own.
    var close: (() -> Void)? = nil
    #endif
    @Environment(\.dismiss) private var dismiss
    #if os(iOS)
    @State private var path: [SettingsTab] = []
    @State private var addingDevice = false
    @State private var storage = StorageStore.shared
    #endif

    var body: some View {
        #if os(macOS)
        // A big card over the notes, its pages in a sidebar of its own (SettingsCard).
        SettingsCard(backend: backend, available: places, page: { AnyView(place($0)) },
                     advancedProtection: AdvancedProtection.shown(crypto.protection),
                     recoveryKey: crypto.offersRecoveryKey, route: route, start: start, close: close, search: search)
        .environment(\.networkReach, reach)
        // Allowing an AI shows over Settings.
        .consentHost(client: backend.client, active: isSignedIn)
        .onChange(of: isSignedIn) { was, now in if was && !now { if let close { close() } else { dismiss() } } }
        #else
        NavigationStack(path: $path) {
            root
                .navigationTitle("Settings")
                // Scrolled, the rows pass under a solid edge instead of showing through the title.
                .scrollEdgeEffectStyle(.hard, for: .top)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
                }
                .navigationDestination(for: SettingsTab.self) { tab in
                    page(tab)
                        .navigationTitle(tab.title)
                        .navigationBarTitleDisplayMode(.inline)
                }
        }
        .roomySheet()
        .environment(\.networkReach, reach)
        .consentHost(client: backend.client, active: isSignedIn)
        // A link, a card or the storage warning opens Settings at its page.
        .onChange(of: route.target, initial: true) { _, target in
            guard let target else { return }
            if tabs.contains(target) { path = [target] }
            route.target = nil
        }
        .onChange(of: isSignedIn) { was, now in if was && !now { dismiss() } }
        #endif
    }

    private var isSignedIn: Bool {
        if case .signedIn = backend.state { return true }
        return false
    }

    /// Whether the server can be reached; signed out there's nothing that needs it.
    private var reach: SyncEngine.Reach { isSignedIn ? sync?.reach ?? .online : .online }

    private var demoStorage: Bool { ProcessInfo.processInfo.arguments.contains("-demoStorage") }

    /// The pages there is something on: signed out, only General and Account.
    var tabs: [SettingsTab] {
        SettingsTab.allCases.filter { tab in
            switch tab {
            case .general, .appearance, .account, .help: true
            case .ai: isSignedIn && backend.client != nil
            case .security: (isSignedIn && crypto.isReady) || NoteVault.shared.isSetUp
            case .storage: (isSignedIn && backend.client != nil) || demoStorage
            }
        }
    }

    #if os(macOS)
    /// The pages there is something on: those of `tabs`, and Profile and the keys for apps.
    var places: Set<SettingsPlace> {
        var out = Set(tabs.map(SettingsPlace.init))
        // `.account` maps to Profile (where the account row lands); Account is its own page too.
        if isSignedIn { out.insert(.account) } else { out.remove(.profile) }
        if NoteApps.enabled { out.insert(.appKeys) }
        return out
    }

    @ViewBuilder
    func place(_ place: SettingsPlace) -> some View {
        switch place {
        case .profile: SettingsPage { ProfilePage(backend: backend, sync: sync) }
        case .ai:
            // The setup card's tiles and wait, on a page of its own (ConnectAIPage).
            if let client = backend.client {
                ConnectAIPage(client: client, preview: connections, previewWaiting: connectWaiting)
                    .background(NoInitialFocus())
                    .connectGuides(client: client)
            }
        case .security: page(.security)
        case .storage: page(.storage)
        case .account: page(.account)
        case .general: SettingsPage { GeneralPage() }
        case .appearance: SettingsPage { AppearancePage() }
        case .help: page(.help)
        case .appKeys: SettingsPage { APIKeysSection() }
        }
    }
    #endif

    /// The remembered tab, or General when that page isn't there now.
    private func shown(_ tab: SettingsTab) -> SettingsTab { tabs.contains(tab) ? tab : .general }

    @ViewBuilder
    func page(_ tab: SettingsTab) -> some View {
        switch tab {
        case .general:
            SettingsPage { GeneralSettings() }
        case .appearance:
            SettingsPage { AppearancePage() }
        case .account:
            SettingsPage { AccountSettings(backend: backend, sync: sync) }
        case .ai:
            SettingsPage {
                if let client = backend.client {
                    ConnectAISection(client: client, preview: connections)
                    if NoteApps.enabled, NoteApps.realPreviews { AppPreviewSection(client: client) }
                }
            }
            .connectGuides(client: backend.client)
        case .security:
            if isSignedIn, crypto.isReady {
                #if os(macOS)
                // Tiles on the card's own ground: a page of its own, not a form.
                securityPage
                #else
                SettingsPage { securityPage }
                #endif
            } else {
                // Signed out with a notes password: only locked notes.
                SettingsPage { LockedNotesSection(sync: sync) }
            }
        case .storage:
            SettingsPage {
                if isSignedIn, let client = backend.client {
                    StorageSection(client: client)
                } else {
                    // Captures without an account.
                    StorageSectionBody(usage: StorageStore.shared.usage)
                }
            }
        case .help:
            SettingsPage { HelpPage(signedIn: isSignedIn, close: closeSettings) }
        }
    }

    /// Security: who can open your notes, locked notes, how it works (PrivacySecuritySection).
    private var securityPage: some View {
        PrivacySecuritySection(crypto: crypto, devices: devices, addDeviceServer: backend.client.map { SupabaseAddDevice(client: $0) },
                               client: backend.client, connections: connections, sync: sync)
    }

    /// Closes Settings: the card over the notes on the Mac, the sheet on iPhone.
    private func closeSettings() {
        #if os(macOS)
        if let close { close(); return }
        #endif
        dismiss()
    }

    #if os(iOS)
    /// You first, like the Apple Account at the top of Settings, then a row per page.
    private var root: some View {
        Form {
            OfflineSection()
            if case .signedIn(let email) = backend.state {
                Section {
                    NavigationLink(value: SettingsTab.account) {
                        AccountRow(backend: backend, email: backend.displayEmail ?? email)
                    }
                    .accessibilityIdentifier("settings.account")
                }
            } else if backend.state == .disabled {
                Section {
                    Text("Sync is off. This build keeps notes on this device only.")
                        .foregroundStyle(.secondary)
                }
            }
            // The Mac's order (SettingsPlace.groups); Account sits under you on iPhone.
            ForEach(Array(SettingsTab.phoneGroups.enumerated()), id: \.offset) { _, group in
                let shown = group.filter(tabs.contains)
                if !shown.isEmpty {
                    Section {
                        ForEach(shown) { tab in
                            row(tab)
                            if tab == .security { addDeviceRow }
                        }
                    }
                }
            }
        }
        .formStyle(.grouped)
        .task(id: isSignedIn) { await storage.refresh(backend.client, force: false) }
    }

    /// A new device's screen says Settings › Security › Add a device; here it's one tap. With a
    /// copy of the key kept by Pinto Notes there's nothing to add: a new device signs in.
    @ViewBuilder private var addDeviceRow: some View {
        if isSignedIn, crypto.isReady, !crypto.serverCopy {
            Button { addingDevice = true } label: {
                Label(AddDeviceCopy.sheetTitle, systemImage: "plus.circle")
            }
            .accessibilityIdentifier("settings.addDevice")
            .disabled(reach != .online)
            .sheet(isPresented: $addingDevice) {
                AddDeviceSheet(crypto: crypto, server: backend.client.map { SupabaseAddDevice(client: $0) })
                    .onDisappear { Task { await devices.refresh(crypto) } }
            }
        }
    }

    private func row(_ tab: SettingsTab) -> some View {
        NavigationLink(value: tab) {
            if tab == .storage, let usage = storage.usage {
                LabeledContent {
                    Text(usage.summary).monospacedDigit()
                } label: {
                    Label(tab.title, systemImage: tab.symbol)
                }
            } else {
                Label(tab == .ai ? "Connect an AI" : tab.title, systemImage: tab.symbol)
            }
        }
        .accessibilityIdentifier("settings.\(tab.rawValue)")
    }
    #endif
}

/// One page of Settings: a grouped form. On the Mac the window takes the page's own height, so
/// no page scrolls at its normal size.
private struct SettingsPage<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        Form {
            // Every page has something that needs the server, so each says it at its top: on
            // iPhone a page covers the first screen, where it was said before.
            OfflineSection()
            content
        }
            .formStyle(.grouped)
            #if os(macOS)
            // On the card's own ground (SettingsCard), as wide as the card lets it be.
            .scrollContentBackground(.hidden)
            .background(NoInitialFocus())
            #endif
    }
}

/// At the top of Settings while the server can't be reached: what still works and what waits.
private struct OfflineSection: View {
    @Environment(\.networkReach) private var reach

    var body: some View {
        if reach != .online {
            Section {
                Label(OfflineCopy.settings, systemImage: OfflineCopy.symbol(reach))
                    .foregroundStyle(Color.muted)
                    .accessibilityIdentifier("settings.offline")
            }
        }
    }
}

#if os(macOS)
/// A page opens with nothing focused. AppKit hands a window's keyboard to its first text field
/// when the window becomes key or a tab's page comes in, which put a caret in your name, ready
/// for a stray keystroke. Clicking a field still focuses it.
private struct NoInitialFocus: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView { Resigner() }
    func updateNSView(_ nsView: NSView, context: Context) {}

    final class Resigner: NSView {
        private var keyObserver: NSObjectProtocol?

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            if let keyObserver { NotificationCenter.default.removeObserver(keyObserver) }
            keyObserver = nil
            guard let window else { return }
            resignSoon()
            // Only the first time the window becomes key: later the focus is the person's own.
            keyObserver = NotificationCenter.default.addObserver(forName: NSWindow.didBecomeKeyNotification, object: window, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    self?.resignSoon()
                    if let o = self?.keyObserver { NotificationCenter.default.removeObserver(o) }
                    self?.keyObserver = nil
                }
            }
        }

        /// After AppKit and SwiftUI have placed their focus, on the next pass and once more a
        /// moment later (SwiftUI can place it a pass late): a text field's editor gives it up.
        private func resignSoon() {
            for delay in [0, 0.15] {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                    guard let window = self?.window, window.firstResponder is NSText else { return }
                    window.makeFirstResponder(nil)
                }
            }
        }
    }
}
#endif

/// General: the menu bar item on the Mac, API keys for apps in notes, and the diagnostics
/// switch. The setup guide, the links and the version are on Help and feedback.
private struct GeneralSettings: View {
    var body: some View {
        // Appearance has a page of its own.
        #if os(macOS)
        MenuBarSection()
        #endif
        if NoteApps.enabled { APIKeysSection() }
        DiagnosticsSection()
    }
}

/// Account: you, sync, how you sign in, exporting your notes, and signing out last, apart, as in
/// System Settings.
private struct AccountSettings: View {
    let backend: Backend
    let sync: SyncEngine?

    var body: some View {
        if case .signedIn(let email) = backend.state {
            #if os(iOS)
            ProfileSection(backend: backend, email: backend.displayEmail ?? email)
            #else
            // On the Mac you, your name and Sign Out are on the Profile page.
            let _ = email
            #endif
            Section {
                // The status and its action on one row, like iCloud in System Settings.
                LabeledContent("Sync") {
                    HStack(spacing: 10) {
                        SyncStatusLabel(status: sync?.status ?? .idle, reach: sync?.reach ?? .online)
                        Button("Sync Now") { Task { await sync?.sync() } }
                            .controlSize(.small)
                            .accessibilityIdentifier("settings.syncNow")
                    }
                }
                AppleIDRow(backend: backend)
            }
            // Next to Delete Account, which says to export first.
            Section {
                ExportNotesButton(sync: sync)
            } footer: {
                Text(PrivacyCopy.exportFooter)
            }
            Section {
                #if os(iOS)
                SignOutButton(backend: backend, sync: sync)
                #endif
                DeleteAccountButton(backend: backend)
            }
        } else if backend.state == .disabled {
            // Only a build without a backend.
            Section {
                Text("Sync is off. This build keeps notes on this device only.")
                    .foregroundStyle(.secondary)
            }
            localExport
        } else {
            Section {
                Text("Sign in to sync your notes across your iPhone and Mac.")
                    .foregroundStyle(.secondary)
            }
            localExport
        }
    }

    /// Signed out, the notes on this device are still yours to take.
    private var localExport: some View {
        Section {
            ExportNotesButton(sync: nil)
        } footer: {
            Text(PrivacyCopy.exportFooterLocal)
        }
    }
}

/// Sign Out…: signing out alone, which keeps the notes on this device for next time, or signing
/// out and removing them from it (`SignOutRemoval`). The second is only offered while something
/// else can open the notes, and is refused while anything here hasn't synced.
struct SignOutButton: View {
    let backend: Backend
    let sync: SyncEngine?
    var crypto: AccountCrypto = .shared
    var devices: KeyDevices = .shared
    var route: SettingsRoute = .shared
    @Environment(\.modelContext) private var context
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var asking = false
    @State private var removing = false
    @State private var refusal: SignOutRemoval.Refusal?

    var body: some View {
        let offer = SignOutRemoval.offer(crypto: crypto, devices: devices)
        Button(role: .destructive) {
            refusal = nil
            #if os(macOS)
            askOnMac(offer)
            #else
            asking = true
            #endif
        } label: {
            HStack(spacing: 8) {
                Text(removing ? SignOutCopy.removing() : "Sign Out\u{2026}").foregroundStyle(.red)
                if removing { ProgressView().controlSize(.small) }
            }
        }
        .disabled(removing)
        .accessibilityIdentifier("settings.signOut")
        // Settings closes once you're signed out.
        .confirmationDialog(SignOutCopy.title, isPresented: $asking, titleVisibility: .visible) {
            Button(SignOutCopy.signOut, role: .destructive) { Task { await backend.signOut() } }
                .accessibilityIdentifier("settings.confirmSignOut")
            if offer != .unavailable {
                // At the largest text sizes the full title runs past the dialog's edge on iPhone; the
                // message above it names the device.
                Button(typeSize.isAccessibilitySize ? SignOutCopy.removeShort : SignOutCopy.remove(), role: .destructive) { Task { await remove() } }
                    .disabled(offer == .needsRecoveryKey)
                    .accessibilityIdentifier("settings.signOutAndRemove")
            }
            if offer == .needsRecoveryKey {
                Button(SignOutCopy.saveRecoveryKey) { showSecurity() }
                    .accessibilityIdentifier("settings.signOutRecoveryKey")
            }
        } message: {
            Text(SignOutCopy.message(offer))
        }
        if let refusal {
            Label(SignOutCopy.refusal(refusal), systemImage: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
                .font(.callout)
                .accessibilityIdentifier("settings.signOutRefused")
        }
    }

    #if os(macOS)
    /// The Mac asks with an alert of its own: Sign Out, Cancel, and a box to remove the notes too.
    private func askOnMac(_ offer: SignOutRemoval.Offer) {
        let words = SignOutCopy.macAlert(offer)
        let alert = NSAlert()
        alert.messageText = words.title
        alert.informativeText = words.message
        let signOut = alert.addButton(withTitle: SignOutCopy.signOut)
        signOut.hasDestructiveAction = true
        if let recovery = words.recoveryButton { alert.addButton(withTitle: recovery) }
        alert.addButton(withTitle: "Cancel").keyEquivalent = "\u{1b}"
        if let box = words.removeBox {
            alert.showsSuppressionButton = true
            alert.suppressionButton?.title = box
            alert.suppressionButton?.state = .off
        }
        let answer: (NSApplication.ModalResponse) -> Void = { response in
            let removeToo = alert.suppressionButton?.state == .on && words.removeBox != nil
            switch response {
            case .alertFirstButtonReturn: Task { if removeToo { await remove() } else { await backend.signOut() } }
            case .alertSecondButtonReturn where words.recoveryButton != nil: showSecurity()
            default: break
            }
        }
        if let window = NSApp.keyWindow { alert.beginSheetModal(for: window, completionHandler: answer) } else { answer(alert.runModal()) }
    }
    #endif

    private func remove() async {
        guard let account = backend.userID else { return }
        removing = true
        defer { removing = false }
        do {
            try await SignOutRemoval.live(backend: backend, sync: sync, context: context).run(account: account)
        } catch {
            refusal = error as? SignOutRemoval.Refusal ?? .offline
        }
    }

    /// Security, where the recovery key is saved.
    private func showSecurity() {
        #if os(macOS)
        route.open(.security)
        #else
        route.target = .security
        #endif
    }
}

#if os(iOS)
/// Settings' first row on iPhone: your photo, name and email, opening Account.
private struct AccountRow: View {
    let backend: Backend
    let email: String
    @State private var profile = ProfileStore.shared

    var body: some View {
        HStack(spacing: 14) {
            AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 56)
            VStack(alignment: .leading, spacing: 2) {
                Text(profile.name ?? "Your Name")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(profile.name == nil ? .secondary : .primary)
                Text(email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
        }
        .padding(.vertical, 4)
        .task(id: backend.state) { await profile.bind(backend) }
    }
}
#endif

/// Your photo, name and email, and the controls to change the first two.
private struct ProfileSection: View {
    let backend: Backend
    let email: String
    @State private var profile = ProfileStore.shared
    @State private var draft = ""
    @FocusState private var editing: Bool
    @State private var importing = false
    #if os(iOS)
    @State private var picked: PhotosPickerItem?
    #endif

    var body: some View {
        Section {
            HStack(spacing: 16) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 64)
                    #if os(macOS)
                    .dropDestination(for: URL.self) { urls, _ in
                        guard let url = urls.first, let data = try? Data(contentsOf: url) else { return false }
                        Task { await profile.setPhoto(data) }
                        return true
                    }
                    #endif
                VStack(alignment: .leading, spacing: 2) {
                    TextField("Name", text: $draft, prompt: Text("Your Name"))
                        .labelsHidden()
                        .textFieldStyle(.plain)
                        .multilineTextAlignment(.leading)
                        .font(.title3.weight(.semibold))
                        .focused($editing)
                        .onSubmit(commit)
                        .accessibilityLabel("Name")
                        .accessibilityIdentifier("settings.profileName")
                    Text(email)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                        .textSelection(.enabled)
                }
            }
            .padding(.vertical, 4)
            HStack(spacing: 10) {
                #if os(iOS)
                PhotosPicker(profile.photo == nil ? "Choose Photo…" : "Change Photo…", selection: $picked, matching: .images)
                    .accessibilityIdentifier("settings.choosePhoto")
                #else
                Button(profile.photo == nil ? "Choose Photo…" : "Change Photo…") { importing = true }
                    .accessibilityIdentifier("settings.choosePhoto")
                #endif
                if profile.photo != nil {
                    Button("Remove Photo", role: .destructive) { Task { await profile.removePhoto() } }
                        .accessibilityIdentifier("settings.removePhoto")
                }
                if profile.working { ProgressView().controlSize(.small) }
            }
            if let problem = profile.problem {
                Text(problem).font(.footnote).foregroundStyle(.secondary)
            }
        } footer: {
            Text("Shown in the app and on notes you share.")
        }
        .onAppear { draft = profile.name ?? "" }
        .onChange(of: profile.name) { _, new in if !editing { draft = new ?? "" } }
        .onChange(of: editing) { _, now in if !now { commit() } }
        .onChange(of: draft) { _, new in if new.count > ProfileName.maxLength { draft = String(new.prefix(ProfileName.maxLength)) } }
        .task(id: backend.state) { await profile.bind(backend) }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.jpeg, .png, .heic, .image]) { result in
            guard case .success(let url) = result else { return }
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { return }
            Task { await profile.setPhoto(data) }
        }
        #if os(iOS)
        .onChange(of: picked) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) { await profile.setPhoto(data) }
                picked = nil
            }
        }
        #endif
    }

    private func commit() {
        Task { await profile.setName(draft) }
    }
}

/// Sign in with Apple for this account: connect it once, then Apple is how you sign in.
private struct AppleIDRow: View {
    let backend: Backend
    @State private var working = false
    @State private var error: String?

    var body: some View {
        if let apple = backend.apple {
            LabeledContent("Sign in with Apple") {
                Label(apple.email ?? "Connected", systemImage: "checkmark.circle.fill")
                    .labelStyle(.titleAndIcon)
                    .foregroundStyle(.secondary)
            }
            .accessibilityIdentifier("settings.appleConnected")
        } else {
            // A settings row: what it is on the left, the standard Apple button on the right.
            LabeledContent {
                AppleAuthButton(label: .continue, height: 30, title: "Continue with Apple", web: webLink) { result in
                    switch result {
                    case .success(let credential): link(credential)
                    case .failure(let failure): error = AppleSignIn.message(for: failure)
                    }
                }
                .frame(width: 190)
                .disabled(working)
                .accessibilityIdentifier("settings.connectApple")
            } label: {
                Text("Sign in with Apple")
                // On iPhone the second line of a row's label is already drawn in the secondary
                // colour: asking for it again made it fainter than the Sync line above.
                Text(error ?? "Sign in on every device without a password.")
                    #if os(iOS)
                    .foregroundStyle(error == nil ? AnyShapeStyle(.primary) : AnyShapeStyle(.red))
                    #else
                    .foregroundStyle(error == nil ? AnyShapeStyle(.secondary) : AnyShapeStyle(.red))
                    #endif
            }
        }
    }

    /// The Mac download links your Apple ID on the web (see AppleAuthButton.web).
    private var webLink: (@MainActor () -> Void)? {
        #if DIRECT
        return {
            working = true
            error = nil
            Task {
                do { try await backend.linkAppleOnTheWeb() } catch where !Backend.isCanceled(error) {
                    self.error = Backend.appleMessage(for: error, linking: true)
                } catch {}
                working = false
            }
        }
        #else
        return nil
        #endif
    }

    private func link(_ credential: AppleSignIn.Credential) {
        working = true
        error = nil
        Task {
            do { try await backend.linkApple(credential) } catch { self.error = Backend.appleMessage(for: error, linking: true) }
            working = false
        }
    }
}

struct SyncStatusLabel: View {
    /// An iPad is named too: "your iPhone and Mac" read as if this device were left out.
    static var syncing: String { InstallID.kind == "iPad" ? "Syncing to your iPad, iPhone and Mac" : "Syncing to your iPhone and Mac" }

    let status: SyncEngine.Status
    /// Whether the server can be reached now. The status only changes when a sync is tried, so
    /// without this a Mac that went offline after its last sync still said "Syncing … just now".
    var reach: SyncEngine.Reach = .online
    var body: some View {
        switch status {
        case _ where Self.away(status, reach: reach) != nil: Text(Self.away(status, reach: reach) ?? "").foregroundStyle(.secondary)
        case .idle: Text("Waiting").foregroundStyle(.secondary)
        case .syncing: HStack(spacing: 6) { ProgressView().controlSize(.mini); Text("Syncing…") }
        case .synced(let d): Text("\(Self.syncing) · \(Self.when(d))").foregroundStyle(.secondary)
        // No network isn't a problem to fix: said plainly. Refusals and the like stay orange.
        case .offline(let why): Text(why).foregroundStyle(why == SyncEngine.describe(URLError(.notConnectedToInternet)) ? AnyShapeStyle(.secondary) : AnyShapeStyle(.orange))
        }
    }

    /// What the row says while the server can't be reached and nothing is being tried: that, and
    /// when it last synced. Nil while online, mid-sync, or when the status already says why.
    static func away(_ status: SyncEngine.Status, reach: SyncEngine.Reach) -> String? {
        guard let lead = OfflineCopy.line(reach, waiting: false) else { return nil }
        switch status {
        case .idle: return lead
        case .synced(let d): return "\(lead) \u{00B7} last synced \(d.formatted(date: .omitted, time: .shortened))"
        case .syncing, .offline: return nil
        }
    }

    /// "just now" for the last minute, then the time.
    static func when(_ d: Date, now: Date = .now) -> String {
        now.timeIntervalSince(d) < 60 ? "just now" : "last synced \(d.formatted(date: .omitted, time: .shortened))"
    }
}

#if os(macOS)
/// Amber Notes in the menu bar, on by default.
private struct MenuBarSection: View {
    @AppStorage(MenuBarSettings.key) private var show = true

    var body: some View {
        Section {
            Toggle("Show in menu bar", isOn: $show)
                .accessibilityIdentifier("settings.menuBar")
        } header: {
            Text("Menu Bar")
        } footer: {
            Text("Capture a note or find one from the menu bar, even with the window closed.")
                .foregroundStyle(.secondary)
        }
    }
}
#endif

/// What Help and feedback shows about the app: its version, and the project's links on GitHub.
enum AboutSection {
    /// "1.2 (2610100857)": what to quote when something goes wrong.
    static var version: String { version(short: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
                                          build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String) }

    static func version(short: String?, build: String?) -> String {
        switch (short, build) {
        case let (s?, b?) where s != b: "\(s) (\(b))"
        case let (s?, _): s
        case let (nil, b?): b
        default: "Unknown"
        }
    }

    /// Reporting a problem first: it's what someone on Help most likely came for.
    static let links: [(title: String, url: URL, id: String)] = [
        ("Report an issue", ShareAsk.newIssue, "settings.reportIssue"),
        ("Contribute", ShareAsk.contributing, "settings.contribute"),
        ("Star on GitHub", ShareAsk.repository, "settings.github"),
    ]
}
