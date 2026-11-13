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
    #if os(macOS)
    /// Scrolled off its top: the content fades out under the title, as the notes list's soft edge
    /// does (Emil, 8 November 2026: the hard band "doesnt look good"; steal the notes list's).
    @State private var scrolled = false
    static var fade: CGFloat { 24 }
    #endif

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
        .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y + $0.contentInsets.top > 0.5 } action: { _, now in scrolled = now }
        // A mask, not a gradient laid over the rows: the page's own ground shows through, in every theme.
        .mask {
            VStack(spacing: 0) {
                LinearGradient(colors: [.black.opacity(0), .black], startPoint: .top, endPoint: .bottom)
                    .frame(height: scrolled ? Self.fade : 0)
                Color.black
            }
            .animation(.easeOut(duration: 0.15), value: scrolled)
        }
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

/// A row that leaves the app or opens something: its symbol on a grey tile, its words, an arrow
/// or a chevron at the end, the whole row to click (Emil, 7 November 2026: one look for every such
/// row, the tile Account's rows have, not an orange glyph).
struct SettingsLinkRow: View {
    let title: String
    var detail: String? = nil
    var symbol: String? = nil
    var trailing = "arrow.up.right"

    var body: some View {
        HStack(spacing: 10) {
            if let symbol { SettingsIconTile(symbol: symbol) }
            VStack(alignment: .leading, spacing: 1) {
                Text(title).foregroundStyle(Color.ink)
                if let detail { Text(detail).font(.callout).foregroundStyle(Color.muted) }
            }
            Spacer(minLength: 0)
            Image(systemName: trailing).font(.footnote.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
        }
        .contentShape(.rect)
    }
}

/// Terms of Service and Privacy Policy as two ordinary rows that open the web page, on Privacy and
/// on Help (Emil, 8 November 2026: centred links under a page looked odd; "maybe even rows").
struct LegalRowsSection: View {
    var body: some View {
        Section {
            Link(destination: Legal.terms) { SettingsLinkRow(title: "Terms of Service", symbol: "doc.text") }
                .settingsRowLink(.top)
                .accessibilityIdentifier("settings.terms")
            Link(destination: Legal.privacy) { SettingsLinkRow(title: "Privacy Policy", symbol: "hand.raised") }
                .settingsRowLink(.bottom)
                .accessibilityIdentifier("settings.privacy")
        }
    }
}

/// A row's symbol on a grey rounded square, white, as System Settings draws its rows' icons.
struct SettingsIconTile: View {
    let symbol: String

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(.white)
            .frame(width: 22, height: 22)
            .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(Color(white: 0.56)))
            .accessibilityHidden(true)
    }
}

/// Where a row sits in its box, so its hover takes the box's corners on the ends and none between.
enum SettingsRowEdge: Sendable {
    case alone, top, middle, bottom

    static func of(_ index: Int, in count: Int) -> SettingsRowEdge {
        if count <= 1 { return .alone }
        if index == 0 { return .top }
        return index == count - 1 ? .bottom : .middle
    }
}

#if os(macOS)
/// The Mac's grouped form: how far a row's content sits in from its box (measured from the form as
/// drawn), and the box's corners. A row's hover fills all of that, edge to edge.
enum SettingsRowBox {
    static let inset = EdgeInsets(top: 10, leading: 13, bottom: 10, trailing: 13)
    static let radius: CGFloat = 11

    static func shape(_ edge: SettingsRowEdge) -> UnevenRoundedRectangle {
        let r = radius
        switch edge {
        case .alone: return UnevenRoundedRectangle(topLeadingRadius: r, bottomLeadingRadius: r, bottomTrailingRadius: r, topTrailingRadius: r, style: .continuous)
        case .top: return UnevenRoundedRectangle(topLeadingRadius: r, bottomLeadingRadius: 0, bottomTrailingRadius: 0, topTrailingRadius: r, style: .continuous)
        case .middle: return UnevenRoundedRectangle(topLeadingRadius: 0, bottomLeadingRadius: 0, bottomTrailingRadius: 0, topTrailingRadius: 0, style: .continuous)
        case .bottom: return UnevenRoundedRectangle(topLeadingRadius: 0, bottomLeadingRadius: r, bottomTrailingRadius: r, topTrailingRadius: 0, style: .continuous)
        }
    }
}

/// A whole Settings row under the pointer: one fill from the box's edge to its edge, the row's
/// full height, in the box's corners at its ends. Never a smaller pill inside the row.
struct SettingsRowHover: ViewModifier {
    let edge: SettingsRowEdge
    @State private var hovering = false
    @Environment(\.hoverPreview) private var preview
    @Environment(\.isEnabled) private var enabled

    func body(content: Content) -> some View {
        let on = enabled && (hovering || preview.contains("*") || preview.contains("settingsRow"))
        let i = SettingsRowBox.inset
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(.rect)
            .modifier(HoverTracking(hovering: $hovering))
            .background {
                if on {
                    SettingsRowBox.shape(edge).fill(Hover.row)
                        .padding(EdgeInsets(top: -i.top, leading: -i.leading, bottom: -i.bottom, trailing: -i.trailing))
                }
            }
    }
}
#endif

extension View {
    /// A whole row that is a button or a link: on the Mac plain, filled edge to edge under the
    /// pointer (`edge`: where it sits in its box); on iPhone the list's own row, which highlights
    /// as it's tapped.
    @ViewBuilder func settingsRowLink(_ edge: SettingsRowEdge = .alone) -> some View {
        #if os(macOS)
        buttonStyle(.plain).modifier(SettingsRowHover(edge: edge))
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
/// Account's pages: you, your devices and Sign Out…; then one level down, your details, and how you
/// sign in with Delete Account… (Emil, 7 November 2026, after System Settings' Apple Account).
enum AccountPart { case main, personal, signIn }

struct AccountSettingsPage: View {
    let backend: Backend
    let sync: SyncEngine?
    /// Tests: what clicking the sync status runs, in place of a real sync.
    var syncNow: (() async -> Void)? = nil
    /// Signed out: Sign In… closes Settings, which covers the sign-in card, and puts the caret in its email field.
    var close: () -> Void = {}
    /// Which of Account's pages: you and your devices, or one level down, your details or how you sign in.
    var part: AccountPart = .main
    var crypto: AccountCrypto = .shared
    var devices: KeyDevices = .shared
    @State private var profile = ProfileStore.shared
    #if os(macOS)
    @Environment(\.openSettingsPage) private var openPage
    #endif
    @State private var draft = ""
    @FocusState private var editing: Bool
    @State private var removingDevice: KeyDevice?
    @State private var addingDevice = false
    @State private var deviceProblem: String?
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
            case .signedIn(let email):
                switch part {
                case .main: signedIn(email: backend.displayEmail ?? email)
                case .personal: personal
                case .signIn: signIn(email: email)
                }
            default: signedOut
            }
        }
        .task(id: backend.state) { await profile.bind(backend) }
        .task { if part == .main, crypto.isReady { await devices.refresh(crypto) } }
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
        case .idle: return "Syncs on its own"
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
        // Your details and how you sign in, one level down, as Apple Account has them (Emil, 7 November 2026).
        Section {
            subPage(.personal, "settings.openPersonal", .top)
            subPage(.signIn, "settings.openSignIn", .bottom)
        }
        Section {
            syncRow
        }
        Section {
            ForEach(deviceRows) { d in deviceRow(d) }
            // With a copy kept by Pinto Notes a new device just signs in: nothing to add.
            if crypto.isReady, !crypto.serverCopy { addDeviceRow }
        } header: {
            Text("Devices")
        } footer: {
            if let deviceProblem { Text(deviceProblem).foregroundStyle(.red) }
        }
        // Sign Out… on its own at the end, as in System Settings; Delete Account… is on Sign-in and
        // security, never beside it (Emil, 7 November 2026: they aren't equals).
        #if os(macOS)
        OpenSection {
            SignOutButton(backend: backend, sync: sync, crypto: crypto, devices: devices, compact: true)
                .padding(.horizontal, 10)
        }
        #else
        Section {
            SignOutButton(backend: backend, sync: sync, crypto: crypto, devices: devices)
        }
        #endif
    }

    /// A row to one of Account's pages.
    private func subPage(_ p: SettingsPage, _ id: String, _ edge: SettingsRowEdge = .alone) -> some View { SettingsSubPageRow(page: p, id: id, edge: edge) }

    /// A device on the account: this one first, then the others that have your key.
    struct DeviceLine: Identifiable, Equatable {
        let id: String
        let name: String
        let detail: String
        let symbol: String
    }

    /// This device, then every other one that has your key and isn't being removed (KeyDevices).
    static func deviceLines(others: [KeyDevice], now: Date = .now) -> [DeviceLine] {
        let this = DeviceLine(id: "this", name: AddDeviceNames.thisDevice, detail: PrivacyCopy.thisDevice,
                              symbol: InstallID.kind == "Mac" ? "laptopcomputer" : "iphone")
        return [this] + others.filter { !$0.removing }.map { d in
            DeviceLine(id: d.id.uuidString, name: d.name,
                       detail: "\(d.platform == "macos" ? "Mac" : "iPhone") \u{00B7} \(SecurityContent.seen(d, now: now))", symbol: d.symbol)
        }
    }

    private var deviceRows: [DeviceLine] { Self.deviceLines(others: devices.others) }

    /// A device: its kind, its name and when it was seen; Remove… for one that can be removed
    /// (moved here from Privacy, Emil, 7 November 2026).
    private func deviceRow(_ d: DeviceLine) -> some View {
        HStack(spacing: 12) {
            Image(systemName: d.symbol).font(.system(size: 20, weight: .light)).foregroundStyle(Color.ink)
                .frame(width: 30).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 1) {
                Text(d.name).foregroundStyle(Color.ink).lineLimit(1)
                Text(d.detail).font(.callout).foregroundStyle(Color.muted).lineLimit(1)
            }
            .accessibilityElement(children: .combine)
            Spacer(minLength: 0)
            if let k = devices.others.first(where: { $0.id.uuidString == d.id }), k.canRemove { removeButton(k) }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(d.id == "this" ? "settings.accountDevices" : "settings.device")
    }

    private func removeButton(_ d: KeyDevice) -> some View {
        // The question hangs on the button that asked it.
        Button("Remove\u{2026}", role: .destructive) { removingDevice = d }
            .settingsRowButton()
            .accessibilityLabel("Remove \(d.name)")
            .accessibilityIdentifier("privacy.removeDevice")
            .confirmationDialog(PrivacyCopy.removeTitle(d.name),
                                isPresented: Binding(get: { removingDevice?.id == d.id }, set: { if !$0 { removingDevice = nil } }),
                                titleVisibility: .visible) {
                Button("Remove", role: .destructive) {
                    Task {
                        deviceProblem = nil
                        guard await DeviceOwner.authenticate(reason: "remove \(d.name)") else { return }
                        do { try await devices.remove(d, crypto: crypto) } catch { deviceProblem = error.localizedDescription }
                    }
                }
                .accessibilityIdentifier("privacy.confirmRemove")
            } message: {
                Text(PrivacyCopy.removeMessage + (crypto.serverCopy ? PrivacyCopy.removeNote : ""))
            }
    }

    /// Add a device…: a new device is added from one that has the notes.
    private var addDeviceRow: some View {
        HStack(spacing: 12) {
            Image(systemName: "plus").font(.system(size: 17, weight: .light)).foregroundStyle(Color.ink)
                .frame(width: 30).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 1) {
                Text("Add a device").foregroundStyle(Color.ink)
                Text("iPhone, iPad or another Mac").font(.callout).foregroundStyle(Color.muted)
            }
            Spacer(minLength: 0)
            Button("Add\u{2026}") { addingDevice = true }
                .settingsRowButton()
                .accessibilityLabel(PrivacyCopy.addDevice)
                .accessibilityIdentifier("privacy.addDevice")
                .disabled(reach != .online)
                .modifier(SheetOn(isPresented: $addingDevice) {
                    AnyView(AddDeviceSheet(crypto: crypto, server: backend.client.map { SupabaseAddDevice(client: $0) })
                        .onDisappear { Task { await devices.refresh(crypto) } })
                })
        }
        .padding(.vertical, 2)
    }

    // MARK: Personal information

    @ViewBuilder private var personal: some View {
        Section {
            LabeledContent("Name") {
                TextField("Name", text: $draft, prompt: Text("Add your name").foregroundStyle(Color.muted))
                    .labelsHidden()
                    #if os(macOS)
                    // A field that looks like one, as System Settings' are (Emil, 7 November 2026: it
                    // wasn't obvious the name could be changed).
                    .textFieldStyle(.roundedBorder)
                    .multilineTextAlignment(.leading)
                    .frame(width: 220)
                    #else
                    .multilineTextAlignment(.trailing)
                    #endif
                    .focused($editing)
                    .onSubmit { Task { await profile.setName(draft) } }
                    .accessibilityIdentifier("settings.personalName")
            }
            LabeledContent("Photo") {
                HStack(spacing: 10) {
                    AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? profile.name : nil, size: 28)
                    photoButtons
                }
            }
        } footer: {
            if let problem = profile.problem { Text(problem).foregroundStyle(.red) }
        }
    }

    @ViewBuilder private var photoButtons: some View {
        #if os(macOS)
        Button(profile.photo == nil ? "Choose\u{2026}" : "Change\u{2026}") { importing = true }
            .settingsRowButton()
            .accessibilityIdentifier("settings.choosePhoto")
        #else
        PhotosPicker(profile.photo == nil ? "Choose\u{2026}" : "Change\u{2026}", selection: $picked, matching: .images)
            .accessibilityIdentifier("settings.choosePhoto")
        #endif
        if profile.photo != nil {
            Button("Remove") { Task { await profile.removePhoto() } }
                .settingsRowButton()
                .accessibilityIdentifier("settings.removePhoto")
        }
    }

    // MARK: Sign-in and security

    /// How you sign in, said plainly: Apple, Google or your email.
    static func signInWay(email: String, apple: Bool, google: Bool) -> String {
        let how = SignInShown.label(email: email, apple: apple, google: google)
        return how == email ? "Email" : how
    }

    /// The email on the account; Apple's relay address is nobody's, so it says Apple hides it.
    static func accountEmail(_ email: String) -> String {
        email.hasSuffix("privaterelay.appleid.com") ? "Hidden by Apple" : email
    }

    @ViewBuilder private func signIn(email: String) -> some View {
        Section {
            LabeledContent("Signed in with") {
                Text(Self.signInWay(email: email, apple: backend.apple != nil, google: backend.google))
            }
            .accessibilityIdentifier("settings.signInWith")
            LabeledContent("Email") {
                Text(Self.accountEmail(backend.displayEmail ?? email)).lineLimit(1).truncationMode(.middle).textSelection(.enabled)
                    .privateBlur(Self.accountEmail(backend.displayEmail ?? email), revealsOnTap: true)
            }
        }
        // The recovery key and the devices that can open your notes stay on Privacy.
        Section {
            #if os(macOS)
            Button { openPage?(.security) } label: {
                SettingsLinkRow(title: "Recovery key and devices", symbol: "key", trailing: "chevron.right")
            }
            .settingsRowLink()
            .accessibilityIdentifier("settings.openPrivacy")
            #else
            NavigationLink(value: SettingsPage.security) { SettingsLinkRow(title: "Recovery key and devices", symbol: "key", trailing: "chevron.right") }
                .accessibilityIdentifier("settings.openPrivacy")
            #endif
        } footer: {
            Text("What can open your notes is on Privacy.")
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
            // The App Store asks for deleting an account inside the app.
            DeleteAccountButton(backend: backend)
                .settingsProbe("account.delete")
        }
    }

    /// Sync's status, said the same on both, and how to sync now: on the Mac the status is the
    /// button (a click), on iPhone a Sync Now button beside it (a tap needs something to tap).
    /// Sync: when it last synced under the word, and Sync Now beside it, on both apps (Emil,
    /// 7 November 2026: a bare "Not synced yet" read as something wrong).
    private var syncRow: some View {
        TimelineView(.periodic(from: .now, by: 30)) { context in
            LabeledContent {
                HStack(spacing: 8) {
                    if case .syncing = sync?.status { ProgressView().controlSize(.small) }
                    Button("Sync Now") { runSync() }
                        .settingsRowButton()
                        .disabled(reach != .online || { if case .syncing = sync?.status { return true }; return false }())
                        .accessibilityIdentifier("settings.syncNow")
                        .settingsProbe("account.syncStatus")
                }
            } label: {
                Text("Sync")
                Text(Self.syncLine(sync?.status ?? .idle, reach: sync?.reach ?? .online, now: context.date))
                    .accessibilityIdentifier("settings.syncStatus")
            }
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

    /// Your name as plain text with a pencil beside it, like the photo's (Emil, 7 November 2026: no box).
    /// A click or tap on the name or the pencil puts the caret in it; Return or leaving keeps it.
    private var name: some View {
        let font = Font.title3.weight(.semibold)
        return HStack(spacing: Self.nameGap) {
            Color.clear.frame(width: Self.namePencil, height: 1)  // keeps the name centred under the photo
            // The field takes exactly the width of what it shows (a plain field's own width runs
            // wider), so the pencil sits right after the name (Emil, 7 November 2026: closer).
            Text(draft.isEmpty ? "Add your name" : draft).font(font).lineLimit(1).padding(.horizontal, 1).hidden()
                .frame(maxWidth: 260)
                .fixedSize()
                .overlay {
                    TextField("Name", text: $draft, prompt: Text("Add your name").foregroundStyle(Color.muted))
                        .labelsHidden()
                        .textFieldStyle(.plain)
                        .font(font)
                        .foregroundStyle(Color.ink)
                        .multilineTextAlignment(.center)
                        .focused($editing)
                        .onSubmit { Task { await profile.setName(draft) } }
                }
            .accessibilityLabel("Name")
            .accessibilityIdentifier("settings.profileName")
            .settingsProbe("account.name")
            Button { editing = true } label: {
                Image(systemName: "pencil")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .frame(width: Self.namePencil, height: Self.namePencil)
                    .background(Circle().fill(.background))
                    #if os(macOS)
                    .overlay(Circle().fill(SettingsInk.selection).opacity(nameHover ? 1 : 0))
                    #endif
                    .overlay(Circle().strokeBorder(.separator, lineWidth: 0.5))
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            #if os(macOS)
            .onHover { nameHover = $0 }
            .help("Change your name")
            #endif
            .opacity(editing ? 0 : 1)
            .accessibilityLabel("Change name")
            .accessibilityIdentifier("settings.renameProfile")
        }
    }

    static let namePencil: CGFloat = 20
    static let nameGap: CGFloat = 4

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
/// 2026), and the diagnostics switch. The setup guide is on Help and feedback. On the Mac it
/// also imports notes, as the sidebar's notice says Settings does (Emil, 12 November 2026).
struct GeneralSettingsPage: View {
    /// Closes Settings, so what a row opens isn't under the card.
    var close: () -> Void = {}
    @AppStorage(ChecklistSorting.key, store: ChecklistSorting.store) private var sortsTicked = true
    #if os(macOS)
    @AppStorage(MenuBarSettings.key) private var menuBar = true
    /// As last read; the system is asked off the main thread as the page opens.
    @State private var login = LoginItem.known ?? false
    #endif

    static let menuBarDetail = "Write or find a note with the window closed."

    /// Software update and What's new first, as System Settings' General starts with them; then
    /// the Mac's own, then checklists. Today's note and the quick note shortcut have pages of their
    /// own (Emil, 7 November 2026).
    var body: some View {
        SettingsPageForm {
            Section {
                SoftwareUpdateRow()
                Link(destination: WhatsNew.changelogURL) { SettingsLinkRow(title: WhatsNew.row, symbol: "sparkles.rectangle.stack") }
                    .settingsRowLink()
                    .accessibilityIdentifier("settings.whatsNew")
            }
            #if os(macOS)
            Section(GeneralCopy.thisMac) {
                Toggle(isOn: $menuBar) {
                    Text("Show in menu bar")
                    Text(Self.menuBarDetail)
                }
                .settingsSwitch()
                .accessibilityIdentifier("settings.menuBar")
                Toggle(GeneralCopy.login, isOn: Binding(get: { login }, set: { on in LoginItem.set(on); login = LoginItem.isOn; SettingsUsage.shared.check(asksSystem: true) }))
                    .settingsSwitch()
                    .accessibilityIdentifier("settings.openAtLogin")
            }
            #endif
            Section(GeneralCopy.checklists) {
                Toggle(GeneralCopy.ticked, isOn: $sortsTicked).settingsSwitch().accessibilityIdentifier("settings.notes.ticked")
            }
            #if os(macOS)
            Section {
                // The same choice of where from as File › Import Notes and your account's menu.
                Button(action: importNotes) {
                    SettingsLinkRow(title: GeneralCopy.importNotes, detail: GeneralCopy.importDetail, symbol: "square.and.arrow.down", trailing: "chevron.right")
                }
                .settingsRowLink()
                .accessibilityIdentifier("settings.importNotes")
            }
            #endif
            #if os(iOS)
            if NoteApps.enabled { APIKeysSection() }
            #endif
        }
        #if os(macOS)
        .task { login = await LoginItem.refresh() }
        #endif
    }

    #if os(macOS)
    /// Settings closes, then the import sheet opens on the notes window.
    private func importNotes() {
        close()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { NotificationCenter.default.post(name: .paneImportNotes, object: nil) }
    }
    #endif
}

/// The version, and on the Mac download its updates: Sparkle installs them when you quit, and one
/// that has come down shows here with Install and Relaunch. The App Store builds get theirs from Apple.
struct SoftwareUpdateRow: View {
    #if SPARKLE
    @ObservedObject private var updater = Updater.shared
    #endif

    var body: some View {
        #if SPARKLE
        if let ready = updater.waiting {
            LabeledContent {
                Button("Install and Relaunch") { updater.installNow() }
                    .settingsRowButton()
                    .accessibilityIdentifier("settings.installUpdate")
            } label: {
                Text("Pinto Notes \(ready) is ready")
                Text(GeneralCopy.updateReadyDetail)
            }
            .accessibilityIdentifier("settings.softwareUpdate")
        } else {
            LabeledContent {
                Button("Check for Updates\u{2026}") { updater.checkForUpdates() }
                    .settingsRowButton()
                    .disabled(!updater.canCheck)
                    .accessibilityIdentifier("settings.checkForUpdates")
            } label: {
                Text("Pinto Notes \(AboutSection.version)")
                Text(GeneralCopy.updatesOnTheirOwn)
            }
            .accessibilityIdentifier("settings.softwareUpdate")
        }
        #else
        LabeledContent {
            Text(AboutSection.version).monospacedDigit().textSelection(.enabled)
        } label: {
            Text("Pinto Notes")
            Text(GeneralCopy.updatesLine(TelemetryGate.channel))
        }
        .accessibilityIdentifier("settings.softwareUpdate")
        #endif
    }
}

/// Today's note, a page of its own (Emil, 7 November 2026, as Obsidian's Daily notes): its folder,
/// its title, the note it starts from, and whether it opens when Pinto starts.
struct TodaysNoteSettingsPage: View {
    @Environment(\.modelContext) private var context
    @AppStorage(TodaysNoteSettings.folderKey, store: TodaysNoteSettings.store) private var folder = DailyNotes.folderName
    @AppStorage(TodaysNoteSettings.titleKey, store: TodaysNoteSettings.store) private var title = TodaysNoteSettings.Title.long
    @AppStorage(TodaysNoteSettings.templateKey, store: TodaysNoteSettings.store) private var template = ""
    @AppStorage(TodaysNoteSettings.launchKey, store: TodaysNoteSettings.store) private var openOnLaunch = false

    var body: some View {
        let choices = GeneralChoices(context: context)
        SettingsPageForm {
            Section {
                Picker("Folder", selection: $folder) { ForEach(choices.folders(keeping: folder), id: \.self) { Label($0, systemImage: "folder").tag($0) } }
                    .accessibilityIdentifier("settings.today.folder")
                Picker("Title", selection: $title) { ForEach(TodaysNoteSettings.Title.allCases) { Text(GeneralChoices.example($0)).tag($0) } }
                    .accessibilityIdentifier("settings.today.title")
                Picker("Template", selection: $template) {
                    // A dash, so "None" lines up with the notes under it (Emil, 8 November 2026).
                    Label("None", systemImage: "minus").tag("")
                    Divider()
                    ForEach(choices.templates(keeping: template), id: \.id) { Label($0.title, systemImage: "doc.text").tag($0.id.uuidString) }
                }
                .accessibilityIdentifier("settings.today.template")
            } footer: {
                Text(GeneralCopy.todayFooter)
            }
            Section {
                Toggle(GeneralCopy.openOnLaunch, isOn: $openOnLaunch).settingsSwitch().accessibilityIdentifier("settings.today.launch")
            }
        }
    }
}

#if os(macOS)
/// The quick note shortcut's chip: click, press the keys; Delete clears it, Escape keeps it.
struct ShortcutRecorder: View {
    @State private var shortcut = QuickNoteHotKey.shared.shortcut
    @State private var recording = false
    @State private var monitor: Any?

    var body: some View {
        HStack(spacing: 6) {
            if recording {
                // Listening, it reads as a field waiting for keys, with Cancel beside it (Emil,
                // 8 November 2026: it looked like another button, with no way out but Escape).
                Text(GeneralCopy.typeShortcut)
                    .font(.system(size: 12))
                    .foregroundStyle(SettingsInk.muted)
                    .padding(.horizontal, 8).frame(minWidth: 120, minHeight: 22, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(SettingsInk.ground))
                    .overlay { RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(Color(PColor.paneAccent), lineWidth: 1.5) }
                    .accessibilityLabel(GeneralCopy.shortcut)
                    .accessibilityValue(GeneralCopy.typeShortcut)
                    .accessibilityIdentifier("settings.quickNoteShortcut")
                Button(GeneralCopy.cancelRecording) { stop() }
                    .controlSize(.small)
                    .accessibilityIdentifier("settings.quickNoteShortcut.cancel")
            } else {
                // A button in full ink, never greyed: greyed reads as off (Emil, 8 November 2026).
                Button { start() } label: {
                    Text(shortcut?.display ?? GeneralCopy.record)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(SettingsInk.text)
                        .padding(.horizontal, 8).frame(height: 22)
                        .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(SettingsInk.selection))
                }
                .buttonStyle(.tile(radius: 6))
                .accessibilityLabel(GeneralCopy.shortcut)
                .accessibilityValue(shortcut?.display ?? "None")
                .accessibilityIdentifier("settings.quickNoteShortcut")
            }
        }
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

/// Help and feedback: Emil, who makes Pinto Notes, at the top with a way to write to him and the
/// answers; then the keyboard shortcuts (Mac) or the version (iPhone); then one line on the project being open
/// source, and the terms (Emil, 7 November 2026: breezier and friendlier).
struct HelpSettingsPage: View {
    /// Signed in or not; nothing on the page depends on it now the setup guide is gone from it.
    var signedIn: Bool
    /// The notebook film has been shown on this device and is kept: Help shows it again.
    var film = false
    /// How many months that film covers, for its name here.
    var filmMonths = 1
    /// Closes Settings.
    var close: () -> Void = {}
    /// Where the address goes when no mail app opens; tests keep the real clipboard out of it.
    var copy: @MainActor (String) -> Void = { HelpPage.toClipboard($0) }
    @Environment(\.openURL) private var openURL
    /// Said under Write to me when no mail app took the message.
    @State private var noMail = false

    static let photo: CGFloat = 52
    /// The setup guide is never a row here: on the Mac it's in the Help menu and found by Settings
    /// search (Emil, 8 November 2026), and iPhone and iPad have no setup steps to show (Emil,
    /// 28 October 2026), so its row did nothing (11 November 2026).
    static let offersSetupGuide = false

    var body: some View {
        SettingsPageForm {
            Section { greeting }
            if film {
                Section {
                    Button(HelpCopy.film(months: filmMonths)) { HelpPage.playFilm(close: close) }
                        .accessibilityIdentifier("settings.notebookFilm")
                } footer: {
                    Text(HelpCopy.filmFooter)
                }
            }
            #if os(macOS)
            // The setup guide is in the Help menu only (Emil, 8 November 2026).
            Section {
                SettingsSubPageRow(page: .shortcuts, id: "settings.openShortcuts", edge: .alone)
            }
            #else
            Section {
                LabeledContent("Version") {
                    Text(AboutSection.version).textSelection(.enabled).monospacedDigit()
                }
                .accessibilityIdentifier("settings.version")
            }
            #endif
            LegalRowsSection()
            OpenSection {
                VStack(alignment: .leading, spacing: 10) {
                    #if os(macOS)
                    // AppKit's label, so each link shows the hand and underlines under the pointer
                    // (Emil, 8 November 2026: SwiftUI's links inside a sentence had no hover).
                    LinkLabel(text: HelpCopy.openSourceLine, style: .settings)
                        .accessibilityIdentifier("settings.github")
                    #else
                    Text(HelpCopy.openSourceLine)
                        .font(.callout)
                        .foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("settings.github")
                    #endif
                    #if os(iOS)
                    // The import list shows these apps' own icons; on the Mac this is About's credits.
                    Text(HelpCopy.trademarks)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    #endif
                }
                .padding(.top, 4)
                #if os(iOS)
                // The open section has no row insets; line the text up with the rows' content.
                .padding(.horizontal, 18)
                .frame(maxWidth: .infinity, alignment: .leading)
                #endif
            }
        }
    }

    @ViewBuilder private var writeButtons: some View {
        Button(HelpCopy.writeToMe) { sendFeedback() }
            .settingsRowButton()
            .lineLimit(1)
            .accessibilityIdentifier("settings.feedback")
        Button(HelpCopy.questions) { openURL(HelpCopy.supportPage) }
            .settingsRowButton()
            .lineLimit(1)
            .accessibilityIdentifier("settings.support")
    }

    /// Emil's photo and a hello, with Write to me and the answers.
    private var greeting: some View {
        HStack(alignment: .top, spacing: 14) {
            Image("EmilWagman")
                .resizable()
                .scaledToFill()
                .frame(width: Self.photo, height: Self.photo)
                .clipShape(Circle())
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(HelpCopy.greeting).font(.headline).foregroundStyle(Color.ink)
                Text(HelpCopy.greetingLine).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                // Side by side when they fit; one under the other on a narrow iPhone, never wrapped.
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 8) { writeButtons }
                    VStack(alignment: .leading, spacing: 8) { writeButtons }
                }
                .padding(.top, 6)
                if noMail {
                    Label(HelpCopy.noMailApp, systemImage: "doc.on.doc")
                        .font(.footnote)
                        .foregroundStyle(Color.muted)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("settings.feedbackCopied")
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("settings.greeting")
    }

    private func sendFeedback() {
        noMail = false
        openURL(HelpCopy.mail(version: AboutSection.version, system: HelpCopy.system)) { accepted in
            noMail = HelpPage.mailed(accepted: accepted, copy: copy)
        }
    }
}

// MARK: Appearance

/// Appearance: System, Light and Dark as pictures of a note; the themes as cards, each with its
/// light and dark colours; the font and, on the Mac, the size of note text. For this device only.
/// Each theme carries its own accent: there's no Accent row (Emil, 7 November 2026).
struct AppearanceSettingsPage: View {
    /// How many are on screen, for tests: Appearance shows on its own page only.
    @MainActor static var onScreen = 0
    @State private var mode = AppearanceModeStore.shared
    @AppStorage(NoteFont.key) private var fontRaw = ""

    static let footer = "Set on each device."

    #if os(macOS)
    static let modeHeight: CGFloat = 104
    #else
    static let modeHeight: CGFloat = 92
    #endif

    /// Three across for the modes. On the Mac the six themes go three across too, so a theme card
    /// is as wide as a mode's (Emil, 8 November 2026: modes smaller than themes "feels a bit
    /// unbalanced"); the iPhone's narrower page keeps two.
    static let modeColumns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 3)
    #if os(macOS)
    static let themeColumns = modeColumns
    #else
    static let themeColumns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 2)
    #endif

    var body: some View {
        let look = ThemeStore.shared.look
        SettingsPageForm {
            Section("Mode") {
                LazyVGrid(columns: Self.modeColumns, spacing: 12) {
                    ForEach(AppearanceMode.allCases) { m in
                        WindowChoice(title: m.title, symbol: AppearanceMode.symbol(m), selected: mode.mode == m, height: Self.modeHeight, id: "settings.mode.\(m.rawValue)") {
                            ModePicture(mode: m, theme: look.theme)
                        } pick: { mode.mode = m }
                    }
                }
                .padding(.vertical, 8)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Mode")
            }
            Section {
                LazyVGrid(columns: Self.themeColumns, spacing: 12) {
                    ForEach(Theme.allCases) { t in
                        ThemeCard(theme: t, chosen: look.theme == t, mode: mode.mode) { ThemeStore.shared.theme = t }
                    }
                }
                .padding(.vertical, 8)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Theme")
            } header: {
                Text("Theme")
            } footer: {
                Text(Self.footer)
            }
            Section {
                Picker("Font", selection: Binding(get: { NoteFont(rawValue: fontRaw) ?? .standard }, set: { NoteFont.set($0) })) {
                    ForEach(NoteFont.allCases) { Text($0.title).tag($0) }
                }
                .accessibilityIdentifier("settings.font")
                #if os(iOS)
                // Its arrows are UIKit's, tinted once: drawn again for a new theme, or they stayed in
                // the old accent beside the new one (Emil, 11 November 2026).
                .id(look.theme)
                #endif
                #if os(macOS)
                // Persona council 11-04: note text from 13 to 24 pt, as Notes' and Books' View menus do it.
                TextSizeRow()
                #endif
                TextSample()
            } header: {
                // "Text", so the size row's "Note text" doesn't repeat it.
                Text("Text")
            }
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

#endif

/// A little of a note in the face and size chosen, in a box set into the page, so it
/// reads as a sample, not as the page's own text (Emil, 7 November 2026).
struct TextSample: View {
    @AppStorage(NoteFont.key) private var fontRaw = ""
    #if os(macOS)
    @AppStorage(TextSize.key) private var stored: Double = 0
    #endif
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    static let title = "Lisbon"
    static let text = "Four days of tiles, trams and pastries in May."

    private var size: CGFloat {
        #if os(macOS)
        TextSize.size(stored: stored)
        #else
        EditorMetrics.body
        #endif
    }

    var body: some View {
        let face = NoteFont(rawValue: fontRaw) ?? .standard
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        VStack(alignment: .leading, spacing: 4) {
            Text(Self.title).font(Font(face.font(ofSize: (size * 1.35).rounded(), weight: .bold) as CTFont))
            Text(Self.text).font(Font(face.font(ofSize: size) as CTFont)).lineLimit(2)
        }
        .foregroundStyle(Color.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 14).padding(.vertical, 12)
        // Inset in Settings' own ground, not the note's black: a sample of the face and size, set
        // into the box like a well (Emil, 7 November 2026: the black box didn't fit).
        #if os(macOS)
        .background(shape.fill(SettingsInk.ground))
        #else
        .background(shape.fill(Color(.systemGroupedBackground)))
        #endif
        .overlay(shape.strokeBorder(Color(PColor.paneSeparator), lineWidth: 1))
        .padding(.vertical, 6)
        .animation(reduceMotion ? nil : .snappy(duration: 0.15), value: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Sample: \(Self.title). \(Self.text)")
        .accessibilityIdentifier("settings.textSizeSample")
    }
}

/// A choice drawn as a picture with its name under it; the chosen one ringed in the accent, its
/// name in the text colour (Emil, 7 November 2026: not white).
private struct WindowChoice<Art: View>: View {
    #if os(macOS)
    static var label: Font { .system(size: 12) }
    #else
    static var label: Font { .caption }
    #endif

    let title: String
    /// A small symbol before the name (the mode's sun or moon, as the theme bubbles have).
    var symbol: String? = nil
    let selected: Bool
    let height: CGFloat
    let id: String
    @ViewBuilder let art: Art
    let pick: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 9, style: .continuous)
        Button(action: pick) {
            VStack(spacing: 7) {
                art
                    .frame(height: height)
                    .frame(maxWidth: .infinity)
                    .clipShape(shape)
                    .overlay(shape.strokeBorder(Color(PColor.paneSeparator), lineWidth: 1))
                    .padding(3)
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(selected ? Color(PColor.paneAccent) : .clear, lineWidth: 2.5))
                HStack(spacing: 4) {
                    if let symbol { Image(systemName: symbol).imageScale(.small).accessibilityHidden(true) }
                    Text(title)
                }
                .font(Self.label.weight(selected ? .semibold : .regular))
                .foregroundStyle(selected ? Color.ink : Color.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            }
            .contentShape(.rect)
        }
        .buttonStyle(.tile(radius: 12))
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityIdentifier(id)
    }
}

/// System is the note light on the left and dark on the right.
private struct ModePicture: View {
    let mode: AppearanceMode
    let theme: Theme

    var body: some View {
        switch mode {
        case .light: ModeNotePicture(theme: theme, dark: false)
        case .dark: ModeNotePicture(theme: theme, dark: true)
        case .system:
            ModeNotePicture(theme: theme, dark: false).overlay {
                GeometryReader { geo in
                    ModeNotePicture(theme: theme, dark: true).mask(alignment: .trailing) { Rectangle().frame(width: geo.size.width / 2) }
                }
            }
        }
    }
}

/// A close-up of the window in a theme: a strip of sidebar with two folders, the first picked in
/// the accent, and a note with its bold title and three lines. Few shapes, drawn big, so it reads
/// at a glance (Emil, 7 November 2026: taller and zoomed in).
struct ModeNotePicture: View {
    let theme: Theme
    let dark: Bool

    var body: some View {
        let c = theme.preview
        func color(_ h: Theme.Hex) -> Color { let v = dark ? h.dark : h.light; return Color(Palette.pair(v, v)) }
        return GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            // Fine lines with small corners, as a window looks in miniature, not pills (Emil, 7 November 2026).
            let line = max(h * 0.042, 3)
            let r = line * 0.35
            let bar = { (fill: Color, width: CGFloat, height: CGFloat?) in
                RoundedRectangle(cornerRadius: r, style: .continuous).fill(fill).frame(width: width, height: height ?? line)
            }
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    // The window's three buttons.
                    HStack(spacing: w * 0.016) {
                        ForEach(0..<3) { _ in Circle().fill(color(c.muted).opacity(0.45)).frame(width: line * 1.15, height: line * 1.15) }
                    }
                    .padding(.bottom, h * 0.13)
                    VStack(alignment: .leading, spacing: h * 0.03) {
                        ForEach(0..<3) { i in
                            HStack(spacing: w * 0.022) {
                                RoundedRectangle(cornerRadius: r, style: .continuous)
                                    .fill(i == 0 ? color(c.accent) : color(c.muted).opacity(0.7))
                                    .frame(width: line * 1.3, height: line * 1.05)
                                bar(i == 0 ? color(c.ink) : color(c.muted).opacity(0.7), w * [0.15, 0.12, 0.17][i], nil)
                            }
                            .padding(.horizontal, w * 0.022).padding(.vertical, h * 0.035)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: h * 0.035, style: .continuous).fill(i == 0 ? color(c.selection) : .clear))
                        }
                    }
                }
                .padding(.horizontal, w * 0.03).padding(.top, h * 0.09)
                .frame(width: w * 0.34, alignment: .topLeading)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(color(c.sidebar))
                color(c.line).frame(width: 1)
                VStack(alignment: .leading, spacing: h * 0.065) {
                    bar(color(c.ink), w * 0.3, line * 1.6)
                    VStack(alignment: .leading, spacing: h * 0.055) {
                        bar(color(c.muted), w * 0.5, nil)
                        bar(color(c.muted), w * 0.46, nil)
                        bar(color(c.muted), w * 0.38, nil)
                        bar(color(c.muted), w * 0.22, nil)
                    }
                }
                .padding(.leading, w * 0.06).padding(.top, h * 0.24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(color(c.page))
            }
        }
        .accessibilityHidden(true)
    }
}

/// A theme as T3 Code shows one: two soft bubbles of its colours, light with a sun and dark with a
/// moon, and its name. The chosen theme's card has the accent border; the bubbles never have
/// outlines (Emil, 7 November 2026). A click picks the theme, never the mode.
struct ThemeCard: View {
    let theme: Theme
    let chosen: Bool
    let mode: AppearanceMode
    let pick: () -> Void
    @State private var hover = false

    #if os(macOS)
    static let swatch: CGFloat = 50
    static let swatchGap: CGFloat = 10
    #else
    static let swatch: CGFloat = 56
    static let swatchGap: CGFloat = 16
    #endif

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
        Button(action: pick) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: ThemeCard.swatchGap) {
                    ThemeSwatch(theme: theme, dark: false)
                    ThemeSwatch(theme: theme, dark: true)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 6)
                Text(theme.title)
                    .font(.callout.weight(chosen ? .semibold : .regular))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(shape.fill(Color.primary.opacity(hover ? 0.07 : 0.035)))
            .overlay(shape.strokeBorder(chosen ? Color(PColor.paneAccent) : Color(PColor.paneSeparator), lineWidth: chosen ? 2 : 1))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        #if os(macOS)
        .onHover { hover = $0 }
        #endif
        .accessibilityLabel(theme.spokenName)
        .accessibilityAddTraits(chosen ? .isSelected : [])
        .accessibilityIdentifier("settings.theme.\(theme.rawValue)")
    }
}

/// One bubble of a theme: its page colour, softly lit by its accent from the top right and its
/// sidebar from the bottom left, with a light sheen, so it reads as the theme's mood rather than a
/// diagram of it. No outline. A sun or a moon badge says which half of the day it is.
struct ThemeSwatch: View {
    let theme: Theme
    let dark: Bool

    /// The colours the bubble is drawn from, for tests: page, sidebar, accent.
    static func colors(_ theme: Theme, dark: Bool) -> (page: UInt32, sidebar: UInt32, accent: UInt32) {
        let c = theme.preview
        return dark ? (c.page.dark, c.sidebar.dark, c.accent.dark) : (c.page.light, c.sidebar.light, c.accent.light)
    }

    var body: some View {
        let d = ThemeCard.swatch
        let c = Self.colors(theme, dark: dark)
        let color = { (v: UInt32) in Color(Palette.pair(v, v)) }
        // Soft fields of colour, not shapes: the page, the sidebar's tone rising from the bottom
        // left, the accent's glow from the top right, and a sheen (Emil, 7 November 2026: like T3 Code's).
        return ZStack {
            color(c.page)
            RadialGradient(colors: [color(c.sidebar), color(c.sidebar).opacity(0)], center: UnitPoint(x: 0.15, y: 0.9), startRadius: 0, endRadius: d * 0.75)
            RadialGradient(colors: [color(c.accent), color(c.accent).opacity(0)], center: UnitPoint(x: 0.85, y: 0.12), startRadius: 0, endRadius: d * 0.72)
                .opacity(dark ? 0.9 : 0.8)
            RadialGradient(colors: [.white.opacity(dark ? 0.12 : 0.4), .clear], center: UnitPoint(x: 0.3, y: 0.2), startRadius: 0, endRadius: d * 0.45)
        }
        .frame(width: d, height: d)
        .clipShape(Circle())
        .shadow(color: .black.opacity(dark ? 0.35 : 0.14), radius: 3, y: 1.5)
        .overlay(alignment: .bottomTrailing) {
            Image(systemName: dark ? "moon.fill" : "sun.max.fill")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(Color.ink)
                .frame(width: 20, height: 20)
                .background(Circle().fill(Color(Palette.page)))
                .offset(x: 2, y: 2)
        }
        .accessibilityHidden(true)
    }
}

// MARK: AI Connections

/// AI Connections, as Bluetooth has its devices (Emil, 7 November 2026): what is connected as rows,
/// each opening its own page (what it can do, when it was last used, Disconnect…), then Add an AI….
/// With nothing connected, the AIs are right there as rows with Connect…, the one on this Mac first.
/// The line on what an AI may do and which company the notes go to is always in view (App Review
/// rejected 1.2 for hiding the company). The Mac runs the setup card's flows (ConnectAIPage); iPhone
/// connects in the browser or on the Mac (ConnectGuideRoute).
struct AIConnectionsPage: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    #if os(macOS)
    /// Captures: the page waiting for this AI.
    var previewWaiting: SetupCards.AI? = nil
    #endif
    /// Captures: what counts as on this Mac.
    var previewInstalled: Set<SetupCards.AI>? = nil
    @State private var connected = ConnectedAIs.shared
    @State private var installed: Set<SetupCards.AI> = []

    var body: some View {
        #if os(macOS)
        macPage
        #else
        AIPhoneList(client: client, preview: preview)
        #endif
    }

    #if os(macOS)
    private var macPage: some View {
        let mine = AIList.connected(preview ?? connected.connections)
        return SettingsPageForm {
            OpenSection { ConnectAIPage(client: client, preview: preview, previewWaiting: previewWaiting) }
            if mine.isEmpty {
                OpenSection {
                    Text(AIList.intro).foregroundStyle(Color.ink).fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("connect.intro")
                }
                AIAddRows(installed: previewInstalled ?? installed)
            } else {
                Section {
                    ForEach(Array(mine.enumerated()), id: \.element.id) { i, c in
                        AIConnectedRow(connection: c, edge: .of(i, in: mine.count))
                    }
                } header: {
                    Text("Connected")
                }
                Section {
                    SettingsSubPageRow(page: .addAI, id: "connect.addAI")
                } footer: {
                    AISentLine()
                }
            }
            if NoteApps.enabled, NoteApps.realPreviews { AppPreviewSection(client: client) }
        }
        .connectGuides(client: client)
        .task {
            if preview == nil { await connected.refresh(client) }
            if previewInstalled == nil { installed = await AIList.lookForInstalled() }
        }
    }
    #endif
}

/// iPhone's AI page: what is connected, and Disconnect. Nothing here connects an AI (Emil, 8
/// November 2026: the setup on the phone was "horrible UI"); people connect on the Mac, or from
/// ChatGPT or Claude. An AI that asks while you're on the phone is allowed on the web page in the
/// phone's browser, or from the Approval waiting row above the list (AIWaitingAsk). It builds on
/// the Mac too, only so its tests can draw it offscreen; the Mac's page is `macPage`.
struct AIPhoneList: View {
    let client: SupabaseClient
    /// Captures: shows these instead of asking the server.
    var preview: [Connection]? = nil
    @State private var connected = ConnectedAIs.shared
    /// Disconnect was pressed for this one: the confirmation is showing.
    @State private var asking: Connection?
    @State private var working: UUID?
    @State private var error: String?
    /// The list didn't come back (offline, say): said, instead of a spinner that never ends.
    @State private var couldNotLoad = false

    private var loaded: Bool { preview != nil || connected.loaded }

    var body: some View {
        let mine = AIList.connected(preview ?? connected.connections)
        SettingsPageForm {
            #if os(iOS)
            AIWaitingAsk()
            #endif
            if mine.isEmpty {
                Section {
                    if loaded {
                        Text(AIList.phoneEmpty)
                            .foregroundStyle(Color.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("connect.phoneEmpty")
                    } else if couldNotLoad {
                        Text(AIList.phoneNotLoaded)
                            .foregroundStyle(Color.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityIdentifier("connect.phoneNotLoaded")
                    } else {
                        // Finding out what's connected: a row's height, so nothing jumps.
                        ProgressView().frame(maxWidth: .infinity)
                    }
                }
            } else {
                Section {
                    ForEach(mine) { c in
                        AIPhoneRow(connection: c, working: working == c.id) { asking = c }
                    }
                } header: {
                    Text("Connected")
                } footer: {
                    VStack(alignment: .leading, spacing: 6) {
                        if let error { Text(error).foregroundStyle(.red) }
                        AISentLine()
                    }
                }
            }
            if NoteApps.enabled, NoteApps.realPreviews { AppPreviewSection(client: client) }
        }
        .confirmationDialog(asking.map { AIList.disconnectTitle($0) } ?? "",
                            isPresented: Binding(get: { asking != nil }, set: { if !$0 { asking = nil } }),
                            titleVisibility: .visible, presenting: asking) { c in
            Button("Disconnect", role: .destructive) { Task { await disconnect(c) } }
        } message: { _ in
            Text(AIList.disconnectLine)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        guard preview == nil else { return }
        await connected.refresh(client)
        couldNotLoad = !connected.loaded
    }

    private func disconnect(_ c: Connection) async {
        guard preview == nil else { return }
        working = c.id
        error = nil
        defer { working = nil }
        do {
            try await ConnectRevoke.revoke(client, id: c.id)
            await connected.refresh(client)
        } catch {
            self.error = "Couldn\u{2019}t disconnect \(AIList.name(c)). Try again."
        }
    }
}

/// One connected AI on iPhone: its mark (monochrome, in the label colour), its name and when it
/// was last used. Disconnect is a swipe or a long press away, and asks first.
struct AIPhoneRow: View {
    let connection: Connection
    var working = false
    let disconnect: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            AIPhoneMark(connection: connection)
            VStack(alignment: .leading, spacing: 2) {
                Text(AIList.name(connection)).foregroundStyle(Color.ink)
                Text(AIList.lastUsedLine(connection)).font(.subheadline).foregroundStyle(Color.muted)
            }
            Spacer(minLength: 0)
            if working { ProgressView() }
        }
        .padding(.vertical, 2)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
        .accessibilityAction(named: "Disconnect", disconnect)
        .accessibilityIdentifier("connect.connected.\(connection.id.uuidString)")
        // Not role: .destructive: that takes the row out before the confirmation is answered.
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(action: disconnect) { Text("Disconnect") }
                .tint(.red)
                .accessibilityIdentifier("connect.swipeDisconnect")
        }
        .contextMenu {
            Button(role: .destructive, action: disconnect) { Label("Disconnect\u{2026}", systemImage: "xmark.circle") }
                .accessibilityIdentifier("connect.menuDisconnect")
        }
        .disabled(working)
    }
}

/// The AI's own mark in the label colour, or the plain glyph for an app without one, on one quiet
/// tile, so every row of the list looks alike.
struct AIPhoneMark: View {
    let connection: Connection
    var size: CGFloat = 30

    /// The AI whose mark the tile shows; nil for the plain glyph (`Connection.symbol`).
    static func mark(_ c: Connection) -> String? { c.mark.flatMap { AIGlyph.asset($0) == nil ? nil : $0 } }

    var body: some View {
        Group {
            if let ai = Self.mark(connection) {
                AIGlyph(ai: ai, size: size * 0.56, monochrome: true)
            } else {
                Image(systemName: connection.symbol).font(.system(size: size * 0.46, weight: .medium))
            }
        }
        .foregroundStyle(Color.ink)
        .frame(width: size, height: size)
        .background(.fill.tertiary, in: .rect(cornerRadius: size * 0.27, style: .continuous))
        .accessibilityHidden(true)
    }
}

/// Add an AI: the onboarding picker's AIs as rows with Connect…, the one on this Mac first.
struct AddAIPage: View {
    let client: SupabaseClient
    var preview: [Connection]? = nil
    var previewInstalled: Set<SetupCards.AI>? = nil
    @State private var installed: Set<SetupCards.AI> = []
    #if os(macOS)
    @Environment(\.openSettingsPage) private var openPage
    #endif

    var body: some View {
        #if os(macOS)
        SettingsPageForm {
            OpenSection { ConnectAIPage(client: client, preview: preview, onConnected: { openPage?(.ai) }) }
            AIAddRows(installed: previewInstalled ?? installed)
        }
        .connectGuides(client: client)
        .task { if previewInstalled == nil { installed = await AIList.lookForInstalled() } }
        #else
        // iPhone adds no AI (8 November 2026): nothing links here, and a stray route gets the list.
        AIPhoneList(client: client, preview: preview)
        #endif
    }
}

/// One connected AI's page: what it can do, when it was last used, and Disconnect….
struct AIConnectionPage: View {
    let client: SupabaseClient
    var preview: [Connection]? = nil
    @State private var connected = ConnectedAIs.shared
    @State private var selection = AISelection.shared
    @State private var asking = false
    @State private var working = false
    @State private var error: String?
    #if os(macOS)
    @Environment(\.openSettingsPage) private var openPage
    #else
    @Environment(\.dismiss) private var dismiss
    #endif

    /// The one picked; in captures, the first.
    private var connection: Connection? {
        let all = AIList.connected(preview ?? connected.connections)
        return all.first { $0.id == selection.id } ?? (preview != nil ? all.first : nil)
    }

    var body: some View {
        SettingsPageForm {
            if let c = connection {
                OpenSection {
                    VStack(spacing: 8) {
                        ConnectionTile(connection: c, size: 56)
                        Text(AIList.name(c)).font(.title3.weight(.semibold)).foregroundStyle(Color.ink)
                        HStack(spacing: 5) {
                            Circle().fill(.green).frame(width: 7, height: 7).accessibilityHidden(true)
                            Text("Connected").foregroundStyle(Color.muted)
                        }
                        .font(.callout)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
                }
                Section {
                    LabeledContent("Access", value: AIList.access)
                    LabeledContent("Last used", value: AIList.lastUsed(c))
                    LabeledContent("Connected on", value: c.created_at.formatted(date: .abbreviated, time: .omitted))
                } footer: {
                    AISentLine()
                }
                Section {
                    Button(role: .destructive) { asking = true } label: {
                        HStack(spacing: 8) {
                            Text("Disconnect\u{2026}").foregroundStyle(.red)
                            if working { ProgressView().controlSize(.small) }
                            Spacer(minLength: 0)
                        }
                        .contentShape(.rect)
                    }
                    .settingsRowLink()
                    .disabled(working)
                    .accessibilityIdentifier("connect.disconnect")
                } footer: {
                    if let error { Text(error).foregroundStyle(.red) }
                }
            } else {
                Section { Text("This AI isn\u{2019}t connected any more.").foregroundStyle(Color.muted) }
            }
        }
        // The title is the AI's name: if the page fell back to the first one, that one is selected.
        .onAppear { if let c = connection, c.id != selection.id { selection.select(c) } }
        .confirmationDialog("Disconnect \(connection.map(AIList.name) ?? "")?", isPresented: $asking, titleVisibility: .visible) {
            Button("Disconnect", role: .destructive) { Task { await disconnect() } }
        } message: {
            Text("It loses access to your notes right away.")
        }
    }

    private func disconnect() async {
        guard let c = connection, preview == nil else { return }
        working = true
        defer { working = false }
        do {
            try await ConnectRevoke.revoke(client, id: c.id)
            await connected.refresh(client)
            #if os(macOS)
            openPage?(.ai)
            #else
            dismiss()
            #endif
        } catch {
            self.error = "Couldn\u{2019}t disconnect \(AIList.name(c)). Try again."
        }
    }
}

/// The AIs to add, as rows with Connect…. Out of the way while one is being connected.
struct AIAddRows: View {
    let installed: Set<SetupCards.AI>
    @State private var flow = ConnectFlow.shared
    @Environment(ConnectGuideRoute.self) private var route: ConnectGuideRoute?
    @Environment(\.networkReach) private var reach

    var body: some View {
        if !flow.busy {
            Section {
                ForEach(AIList.choices(installed: installed)) { row($0) }
            } footer: {
                VStack(alignment: .leading, spacing: 6) {
                    if reach != .online { Text(OfflineCopy.needsNetwork("connect an AI", reach: reach)) }
                    AISentLine()
                }
            }
        }
    }

    private func row(_ t: SetupCards.AI) -> some View {
        HStack(spacing: 10) {
            BrandMark(ai: t, size: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(AIList.title(t)).foregroundStyle(Color.ink)
                Text(AIList.line(t, installed: installed.contains(t))).font(.callout).foregroundStyle(Color.muted)
            }
            Spacer(minLength: 8)
            Button("Connect\u{2026}") { connect(t) }
                .settingsRowButton()
                .disabled(reach != .online)
                .accessibilityLabel("Connect \(AIList.title(t))")
                .accessibilityIdentifier("connect.ai.\(t.rawValue)")
        }
    }

    /// The Mac's flow on the page (ConnectAIPage); iPhone's browser sheet or Connect on your Mac.
    private func connect(_ t: SetupCards.AI) {
        #if os(macOS)
        flow.asked = t
        #else
        let g = t.guide
        if BrowserConnect.opensSheet(g, onWeb: BrowserConnect.onWeb) { route?.guide = g; return }
        switch ConnectHere.press(g, connected: false) {
        case .onMac: route?.onMac = g
        default: route?.guide = g
        }
        #endif
    }
}

/// A connected AI: its mark, its name and when it was last used, opening its own page. Until it's
/// first used, one thing to ask it, to copy.
struct AIConnectedRow: View {
    let connection: Connection
    /// Where it sits in Connected's box, for the hover's corners.
    var edge: SettingsRowEdge = .alone
    @State private var copied = false
    #if os(macOS)
    @Environment(\.openSettingsPage) private var openPage
    #endif

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            link
            if let ask = AIList.tryIt(connection) {
                HStack(spacing: 8) {
                    Text(ask).font(.callout).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 8)
                    Button(copied ? "Copied" : "Copy") {
                        HelpPage.toClipboard(AIList.ask)
                        copied = true
                    }
                    .settingsRowButton()
                    .accessibilityIdentifier("connect.tryIt.copy")
                }
                .padding(.leading, 36)
            }
        }
    }

    private var label: some View {
        HStack(spacing: 10) {
            ConnectionTile(connection: connection, size: 26)
            VStack(alignment: .leading, spacing: 1) {
                Text(AIList.name(connection)).foregroundStyle(Color.ink)
                HStack(spacing: 5) {
                    Circle().fill(.green).frame(width: 6, height: 6).accessibilityHidden(true)
                    Text(AIList.used(connection)).font(.callout).foregroundStyle(Color.muted)
                }
            }
            Spacer(minLength: 0)
            #if os(macOS)
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
            #endif
        }
        .contentShape(.rect)
    }

    @ViewBuilder private var link: some View {
        #if os(macOS)
        Button {
            AISelection.shared.select(connection)
            openPage?(.aiConnection)
        } label: { label }
        .settingsRowLink(edge)
        .accessibilityIdentifier("connect.connected.\(connection.id.uuidString)")
        #else
        NavigationLink(value: SettingsPage.aiConnection) { label }
            .simultaneousGesture(TapGesture().onEnded { AISelection.shared.select(connection) })
            .accessibilityIdentifier("connect.connected.\(connection.id.uuidString)")
        #endif
    }
}

/// What an AI may do and which company the notes go to, under the list, in view in every stage.
struct AISentLine: View {
    var body: some View {
        Text(ConnectCopy.page)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("connect.sent")
            .settingsProbe("connect.sent")
    }
}

#if os(iOS)
/// An AI asking to connect, waiting for your Allow (the Mac shows it in ConnectAIPage).
struct AIWaitingAsk: View {
    @State private var center = ConnectCenter.shared
    var body: some View {
        if let ask = center.waiting().first { Section { ConnectWaitingRow(ask: ask) } }
    }
}
#endif

/// A row's Connect… on the Mac: the page's flow (ConnectAIPage) takes the ask and shows the wait.
@MainActor @Observable
final class ConnectFlow {
    static let shared = ConnectFlow()
    /// Connect… was pressed for this AI.
    var asked: SetupCards.AI?
    /// The wait or the tick is showing: the rows step aside.
    var busy = false
}

/// Which connected AI its page shows.
@MainActor @Observable
final class AISelection {
    static let shared = AISelection()
    private(set) var id: UUID?
    /// Its name, for the page's title.
    nonisolated(unsafe) static var title = "AI"

    func select(_ c: Connection) {
        id = c.id
        Self.title = AIList.name(c)
    }
}

/// The AI pages' words and order (tested).
enum AIList {
    static let intro = "Connect your AI so it knows your notes, and you stop explaining things twice."
    static let access = "Reads and edits your notes when you ask"
    /// One thing to ask a new one, so you see it work.
    static let ask = "What\u{2019}s in my Welcome note?"

    /// What is connected, the most recently used first.
    static func connected(_ rows: [Connection]) -> [Connection] {
        rows.filter { $0.revoked_at == nil }
            .sorted { ($0.last_used_at ?? $0.created_at) > ($1.last_used_at ?? $1.created_at) }
    }

    /// The AIs to add: the onboarding picker's (ChatGPT, Claude, Grok), any on this Mac first, then
    /// Other apps. Never Mistral (Emil, 2 November 2026).
    static func choices(installed: Set<SetupCards.AI>) -> [SetupCards.AI] {
        let brands = SetupCards.brands
        return brands.filter(installed.contains) + brands.filter { !installed.contains($0) } + [.other]
    }

    static func title(_ t: SetupCards.AI) -> String { t == .other ? "Other apps" : t.name }

    /// The line under an AI to add: on this Mac, who makes it, or what Other apps means.
    static func line(_ t: SetupCards.AI, installed: Bool) -> String {
        if installed { return "On this Mac" }
        if t == .other { return "Cursor, Codex and more" }
        return "Made by \(ConnectTrust.makers[t.name] ?? t.name)"
    }

    /// The brand a connection is, by where its sign-in went or its name; nil for an app the list can't name.
    static func brand(of c: Connection) -> SetupCards.AI? {
        let name = c.mark ?? c.title
        return SetupCards.brands.first { $0.name == name }
    }

    static func name(_ c: Connection) -> String { brand(of: c)?.name ?? c.title }

    static func used(_ c: Connection, now: Date = .now) -> String {
        guard let d = c.last_used_at else { return "Not used yet" }
        return now.timeIntervalSince(d) < 60 ? "Used just now" : "Used \(d.formatted(.relative(presentation: .named, unitsStyle: .wide)))"
    }

    /// iPhone's line under a connected AI: "Last used 2 hours ago", or "Not used yet".
    static func lastUsedLine(_ c: Connection, now: Date = .now) -> String {
        guard let d = c.last_used_at else { return "Not used yet" }
        return now.timeIntervalSince(d) < 60 ? "Last used just now" : "Last used \(d.formatted(.relative(presentation: .named, unitsStyle: .wide)))"
    }

    /// iPhone with nothing connected: the whole section (no connecting on the phone, 8 November 2026).
    static let phoneEmpty = "Connect an AI from Pinto Notes on your Mac, or from ChatGPT or Claude."
    static let phoneNotLoaded = "Couldn\u{2019}t check which AIs are connected. Pull down to try again."
    static func disconnectTitle(_ c: Connection) -> String { "Disconnect \(name(c))?" }
    static let disconnectLine = "It loses access to your notes right away."

    static func lastUsed(_ c: Connection, now: Date = .now) -> String {
        guard let d = c.last_used_at else { return "Not yet" }
        return now.timeIntervalSince(d) < 60 ? "Just now" : d.formatted(.relative(presentation: .named, unitsStyle: .wide))
    }

    /// Until a brand AI is first used: what to ask it.
    static func tryIt(_ c: Connection) -> String? {
        guard c.last_used_at == nil, let b = brand(of: c) else { return nil }
        return "Ask \(b.name): \u{201C}\(ask)\u{201D}"
    }

    /// The AIs installed on this Mac, by their app ids, looked up off the main thread. iPhone: none.
    static func lookForInstalled() async -> Set<SetupCards.AI> {
        #if os(macOS)
        return await Task.detached(priority: .utility) { installedNow() }.value
        #else
        return []
        #endif
    }

    #if os(macOS)
    nonisolated static let appIDs: [(SetupCards.AI, String)] = [(.chatgpt, "com.openai.chat"), (.claude, "com.anthropic.claudefordesktop")]

    nonisolated static func installedNow() -> Set<SetupCards.AI> {
        Set(appIDs.filter { NSWorkspace.shared.urlForApplication(withBundleIdentifier: $0.1) != nil }.map(\.0))
    }
    #endif
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

/// A row to a page one level down, as System Settings has them: its symbol on a grey tile, its
/// name (and a line under it, if any), a chevron. Account's pages, Privacy's Encryption.
struct SettingsSubPageRow: View {
    let page: SettingsPage
    let id: String
    var detail: String? = nil
    /// Where it sits in its box, for the hover's corners.
    var edge: SettingsRowEdge = .alone
    #if os(macOS)
    @Environment(\.openSettingsPage) private var openPage
    #endif

    var body: some View {
        let label = HStack(spacing: 10) {
            SettingsIconTile(symbol: page.symbol)
            VStack(alignment: .leading, spacing: 1) {
                Text(page.title).foregroundStyle(Color.ink)
                if let detail { Text(detail).font(.callout).foregroundStyle(Color.muted) }
            }
            Spacer(minLength: 0)
            #if os(macOS)
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary).accessibilityHidden(true)
            #endif
        }
        .contentShape(.rect)
        #if os(macOS)
        Button { openPage?(page) } label: { label }
            .settingsRowLink(edge)
            .opensOnPress { openPage?(page) }
            .accessibilityIdentifier(id)
        #else
        NavigationLink(value: page) { label }
            .accessibilityIdentifier(id)
        #endif
    }
}

/// Experimental: features to try, each with a switch, off until turned on (Experiments). Turning
/// one off hides it; what it kept stays for when it's on again.
struct ExperimentalSettingsPage: View {
    /// Read so the switches redraw when one changes.
    @AppStorage(Experiment.covers.key) private var coversOn = false
    @AppStorage(Experiment.gallery.key) private var galleryOn = false
    @AppStorage(Experiment.tags.key) private var tagsOn = false

    var body: some View {
        let _ = (coversOn, galleryOn, tagsOn)
        SettingsPageForm {
            Section {
                ForEach(Experiment.allCases) { e in
                    Toggle(isOn: Binding(get: { Experiments.isOn(e) }, set: { Experiments.set(e, $0) })) {
                        Text(e.title)
                        Text(e.detail)
                    }
                    .settingsSwitch()
                    .accessibilityIdentifier("settings.experiment.\(e.rawValue)")
                }
            } footer: {
                Text("These may change or go away. Turning one off hides it; nothing in your notes is lost.")
            }
        }
    }
}
