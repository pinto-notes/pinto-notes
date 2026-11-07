import Supabase
import SwiftData
import SwiftUI

/// Settings: you, sync, the AIs connected to your notes, your devices and your storage. One view
/// per page, the same on the Mac and iPhone (`page`); only the shell differs: the Mac's card with
/// its sidebar and search (SettingsCard), iPhone's list that pushes each page.
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
    var start: SettingsPage? = nil
    var search = ""
    /// Over the notes window: closes the card (RootView). Nil: Settings is in a sheet of its own.
    var close: (() -> Void)? = nil
    #endif
    @Environment(\.dismiss) private var dismiss
    #if os(iOS)
    @State private var path: [SettingsPage] = []
    @State private var addingDevice = false
    @State private var storage = StorageStore.shared
    #endif

    var body: some View {
        #if os(macOS)
        // A big card over the notes, its pages in a sidebar of its own (SettingsCard).
        SettingsCard(backend: backend, available: available, page: { AnyView(page($0)) },
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
                .navigationDestination(for: SettingsPage.self) { p in
                    page(p)
                        .onAppear { SettingsUsage.shared.opened(SettingsPageWord(p)) }
                        .navigationTitle(p.title)
                        .navigationBarTitleDisplayMode(.inline)
                }
        }
        .roomySheet()
        .environment(\.networkReach, reach)
        .consentHost(client: backend.client, active: isSignedIn)
        // A link, a card or the storage warning opens Settings at its page.
        .onChange(of: route.target, initial: true) { _, target in
            guard let target else { return }
            if available.contains(target) { path = target.parent.map { [$0, target] } ?? [target] }
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

    /// The pages there is something on (SettingsPage.available).
    var available: Set<SettingsPage> {
        SettingsPage.available(signedIn: isSignedIn, hasClient: backend.client != nil, demoStorage: demoStorage)
    }

    /// The list's pages in order: Account, then the groups (SettingsPage.groups).
    var pages: [SettingsPage] { SettingsPage.groups(available: available).flatMap { $0 } }

    /// A page of Settings, the same view on the Mac and iPhone.
    @ViewBuilder
    func page(_ p: SettingsPage) -> some View {
        switch p {
        case .account: AccountSettingsPage(backend: backend, sync: sync, close: closeSettings, crypto: crypto, devices: devices)
        case .personal: AccountSettingsPage(backend: backend, sync: sync, close: closeSettings, part: .personal, crypto: crypto, devices: devices)
        case .signIn: AccountSettingsPage(backend: backend, sync: sync, close: closeSettings, part: .signIn, crypto: crypto, devices: devices)
        case .ai:
            if let client = backend.client {
                #if os(macOS)
                AIConnectionsPage(client: client, preview: connections, previewWaiting: connectWaiting)
                #else
                AIConnectionsPage(client: client, preview: connections)
                #endif
            }
        case .general: GeneralSettingsPage()
        case .todaysNote: TodaysNoteSettingsPage()
        case .shortcuts:
            #if os(macOS)
            KeyboardShortcutsSettingsPage()
            #else
            EmptyView()
            #endif
        case .appearance: AppearanceSettingsPage()
        case .storage: StorageSettingsPage(backend: backend)
        case .help: HelpSettingsPage(signedIn: isSignedIn, close: closeSettings)
        case .security:
            if isSignedIn, crypto.isReady {
                // Two rows: Encryption, one level down, and Diagnostics (Emil, 7 November 2026).
                PrivacyPage(crypto: crypto)
            } else {
                // Signed out, or still setting up: how it works, the notes password if there is one, the terms.
                SignedOutPrivacyPage(signedIn: isSignedIn, sync: sync)
            }
        case .encryption:
            if isSignedIn, crypto.isReady {
                PrivacySecuritySection(crypto: crypto, devices: devices, client: backend.client, connections: connections, sync: sync)
            } else {
                // Signed out, or still setting up: how it works, the notes password if there is one, the terms.
                SignedOutPrivacyPage(signedIn: isSignedIn, sync: sync)
            }
        // Parked: nothing leads to it (Emil, 6 November 2026).
        case .appKeys: SettingsPageForm { APIKeysSection() }
        }
    }

    /// Closes Settings: the card over the notes on the Mac, the sheet on iPhone.
    private func closeSettings() {
        #if os(macOS)
        if let close { close(); return }
        #endif
        dismiss()
    }

    #if os(iOS)
    /// You first, like the Apple Account at the top of Settings, then a row per page: the same
    /// groups as the Mac's sidebar (SettingsPage.groups).
    private var root: some View {
        Form {
            OfflineSection()
            if case .signedIn(let email) = backend.state {
                Section {
                    NavigationLink(value: SettingsPage.account) {
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
            ForEach(Array(SettingsPage.groups(available: available).enumerated()), id: \.offset) { _, group in
                let shown = group.filter { $0 != .account }
                if !shown.isEmpty {
                    Section {
                        ForEach(shown) { p in
                            row(p)
                            if p == .security { addDeviceRow }
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

    private func row(_ p: SettingsPage) -> some View {
        NavigationLink(value: p) {
            if p == .storage, let usage = storage.usage {
                LabeledContent {
                    Text(usage.summary).monospacedDigit()
                } label: {
                    Label(p.title, systemImage: p.symbol).foregroundStyle(Color.ink)
                }
            } else {
                // Icons in the text's colour, not the accent, on both apps (Emil, 7 November 2026).
                Label(p.title, systemImage: p.symbol).foregroundStyle(Color.ink)
            }
        }
        .accessibilityIdentifier("settings.\(p.rawValue)")
    }
    #endif
}

#if os(macOS)
/// A page opens with nothing focused. AppKit hands a window's keyboard to its first text field
/// when the window becomes key or a tab's page comes in, which put a caret in your name, ready
/// for a stray keystroke. Clicking a field still focuses it.
struct NoInitialFocus: NSViewRepresentable {
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

/// General's words, the same on the Mac and iPhone.
enum GeneralCopy {
    static let today = "Today\u{2019}s note"
    static let todayFooter = "In the template, {{date}} becomes the date and {{time}} the time."
    static let openOnLaunch = "Open today\u{2019}s note when Pinto starts"
    static let updatesOnTheirOwn = "Updates install on their own when you quit."
    static let updateReadyDetail = "It installs when you quit, or now."
    static let updatesFromAppStore = "Updates come from the App Store."
    static let checklists = "Checklists"
    static let ticked = "Ticked items move to the bottom"
    static let thisMac = "This Mac"
    static let shortcut = "Quick note shortcut"
    static let shortcutDetail = "Works in any app."
    static let record = "Record Shortcut"
    static let typeShortcut = "Type a shortcut\u{2026}"
    static let login = "Open at login"
}

/// What General's menus offer: your folders, and the notes a day can start from.
@MainActor
struct GeneralChoices {
    let context: ModelContext

    /// Every folder's name, in the sidebar's order, the chosen one kept even before it's made
    /// (Daily is made the first time today's note is).
    func folders(keeping chosen: String) -> [String] {
        var names: [String] = []
        for f in context.allFolders().filter({ $0.deletedAt == nil && !ModelContext.isSharedWithMe($0) }).sorted(by: { $0.sortIndex < $1.sortIndex }) where !names.contains(where: { DailyNotes.same($0, f.name) }) {
            names.append(f.name)
        }
        if !names.contains(where: { DailyNotes.same($0, chosen) }) { names.insert(chosen, at: 0) }
        return names
    }

    struct Template: Equatable { let id: UUID; let title: String }

    /// The notes in a folder named Templates, if there is one; else your 12 latest notes with
    /// something in them. The chosen one stays listed wherever it is. Drawn with the page, so it
    /// reads each note's saved title only, never its text: 40 long notes' text took 18 ms a draw.
    func templates(keeping chosen: String) -> [Template] {
        let live = { (n: Note) in n.deletedAt == nil && n.trashedAt == nil && !n.isLocked }
        var notes: [Note]
        if let folder = context.namedFolder("Templates"), !folder.liveNotes.isEmpty {
            notes = folder.liveNotes.filter(live).sorted { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
        } else {
            // Only what the menu needs, never the text: an empty note is one titled New Note with
            // nothing under it (NoteText.head).
            let unlocked = #Predicate<Note> { (n: Note) -> Bool in n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil }
            var latest = FetchDescriptor<Note>(predicate: unlocked, sortBy: [SortDescriptor(\Note.updatedAt, order: .reverse)])
            latest.fetchLimit = 40
            latest.propertiesToFetch = [\Note.id, \Note.summaryTitle, \Note.summaryPreview, \Note.updatedAt]
            let empty = { (n: Note) in n.title == NoteText.noTitle && n.preview == NoteText.noPreview }
            notes = Array(((try? context.fetch(latest)) ?? []).filter { !empty($0) }.prefix(12))
        }
        if let id = UUID(uuidString: chosen), !notes.contains(where: { $0.id == id }), let n = context.note(id), live(n) { notes.insert(n, at: 0) }
        return notes.map { Template(id: $0.id, title: $0.title.isEmpty ? "Untitled" : $0.title) }
    }

    /// Each title form as today's note would be named today.
    static func example(_ form: TodaysNoteSettings.Title, now: Date = .now) -> String { DailyNotes.title(for: now, as: form) }
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
    /// A button of its own at the end of Account (the Mac's, as System Settings has it), not a row.
    var compact = false
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
            // Red at the end of the list on iPhone; ink on the Mac, over the red Delete Account….
            HStack(spacing: 8) {
                Text(removing ? SignOutCopy.removing() : "Sign Out\u{2026}").foregroundStyle(Self.ink)
                if removing { ProgressView().controlSize(.small) }
                if !compact { Spacer(minLength: 0) }
            }
            .contentShape(.rect)
        }
        .signOutLook(compact: compact)
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
    static var ink: Color { Color.ink }
    #else
    static var ink: Color { .red }
    #endif

    #if os(macOS)
    private func askOnMac(_ offer: SignOutRemoval.Offer) {
        MacSignOut.ask(offer: offer, backend: backend, sync: sync, context: context, route: route,
                       removing: { removing = $0 }, refused: { refusal = $0 })
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
        Self.showSecurity(route)
    }

    static func showSecurity(_ route: SettingsRoute) {
        #if os(macOS)
        route.open(.security)
        #else
        route.target = .security
        #endif
    }
}

#if os(macOS)
/// Sign Out… on the Mac, from Settings › Account and from the account menu at the foot of the
/// sidebar: one alert, Sign Out and Cancel, and a box to remove the notes from this Mac too
/// (SignOutCopy.macAlert).
@MainActor
enum MacSignOut {
    static func ask(offer: SignOutRemoval.Offer, backend: Backend, sync: SyncEngine?, context: ModelContext,
                    route: SettingsRoute = .shared, removing: @escaping (Bool) -> Void = { _ in },
                    refused: ((SignOutRemoval.Refusal) -> Void)? = nil) {
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
            case .alertFirstButtonReturn:
                Task {
                    if removeToo {
                        await remove(backend: backend, sync: sync, context: context, removing: removing, refused: refused)
                    } else {
                        await backend.signOut()
                    }
                }
            case .alertSecondButtonReturn where words.recoveryButton != nil: SignOutButton.showSecurity(route)
            default: break
            }
        }
        if let window = NSApp.keyWindow { alert.beginSheetModal(for: window, completionHandler: answer) } else { answer(alert.runModal()) }
    }

    /// Signs out and removes the notes from this Mac; a refusal is said where it was asked, or in
    /// an alert of its own when nothing there can show it (the account menu).
    private static func remove(backend: Backend, sync: SyncEngine?, context: ModelContext,
                               removing: (Bool) -> Void, refused: ((SignOutRemoval.Refusal) -> Void)?) async {
        guard let account = backend.userID else { return }
        removing(true)
        defer { removing(false) }
        do {
            try await SignOutRemoval.live(backend: backend, sync: sync, context: context).run(account: account)
        } catch {
            let why = error as? SignOutRemoval.Refusal ?? .offline
            if let refused { refused(why) } else {
                let alert = NSAlert()
                alert.messageText = "Couldn\u{2019}t remove your notes"
                alert.informativeText = SignOutCopy.refusal(why)
                alert.runModal()
            }
        }
    }
}
#endif

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
                Text(AccountLine.shown(email: email))
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

    /// The project on GitHub, then how to help with it. Reporting an issue is with the ways to
    /// reach us, above them.
    static let links: [(title: String, url: URL, symbol: String, id: String)] = [
        ("Pinto Notes on GitHub", ShareAsk.repository, "chevron.left.forwardslash.chevron.right", "settings.github"),
        ("Contribute", ShareAsk.contributing, "hammer", "settings.contribute"),
    ]
}

private extension View {
    /// Sign Out…: a row on iPhone and in a list; a button of its own at the end of the Mac's Account.
    @ViewBuilder func signOutLook(compact: Bool) -> some View {
        if compact { settingsRowButton() } else { settingsRowLink() }
    }
}
