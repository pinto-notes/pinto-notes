import LocalAuthentication
import Supabase
import SwiftUI
import UniformTypeIdentifiers
#if os(iOS)
import UIKit
#else
import AppKit
import PDFKit
#endif

/// What Settings › Security says, in one place.
enum PrivacyCopy {
    /// What a connected AI may do, in Allow's words without its "It": "can read, create and edit …".
    static let aiMay = String(ConnectCopy.scope.dropFirst("It ".count))
    static let title = SettingsNames.security
    /// Where the page is, in a sentence: the same name on the Mac and iPhone (7 November 2026).
    static let settingsPath = "Settings \u{203A} \(SettingsNames.security)"
    /// The page's question and its one-line answer. "Encrypted", never "end-to-end": that's said
    /// only in "How it works" with Advanced protection on.
    static let whoCanOpen = "Who can open your notes"
    static let status = "Encrypted on your devices before they sync."
    /// The Mac's page in one line: how the notes are kept, and with a copy kept by Pinto Notes,
    /// that Pinto Notes can open them too.
    static func summary(serverCopy: Bool) -> String { status + " " + backInFooter(serverCopy: serverCopy) }
    static let devicesHeader = "Your devices"
    static let backInHeader = "To help you back in"
    static let aiHeader = "While connected"
    static let inUseNow = "In use now"
    /// Pinto Notes' copy of the key: the Mac tile says it short, the iPhone row a little longer.
    static let pintoNotes = "Pinto Notes"
    static let pintoTile = "Helps you back in"
    static let pintoRow = "Keeps a copy of your key"
    static let aiTile = "While connected"
    static let aiRow = "Can read and edit your notes while connected"
    /// Under "To help you back in", with a copy kept by Pinto Notes.
    static let backInFooterWithCopy = "Pinto Notes keeps a copy of your key so signing in opens your notes on a new device, which means Pinto Notes can open them too."
    /// Without one (Advanced protection on, or an account that hasn't answered the one-time question).
    static let backInFooterDevicesOnly = "Only your devices and the AIs you connect can open your notes. If you lose your devices, a recovery key opens them."
    static func backInFooter(serverCopy: Bool) -> String { serverCopy ? backInFooterWithCopy : backInFooterDevicesOnly }
    static let aiFooter = "Each AI holds its own copy of your key."
    static let recoveryKey = "Recovery key"
    static let recoverySaved = "Saved"
    static let recoveryNotSaved = "Not saved"
    static let saveARecoveryKey = "Save a recovery key"
    static let saveARecoveryKeyLine = "Opens your notes if you lose your devices."
    static let lockedTitle = "Locked notes"
    /// "An AI", not "AIs": in this font "AIs" reads as "Als". An AI is shown "Locked note" in
    /// place of the title (the MCP server's LOCKED_TITLE, 4 November 2026).
    static let lockedLine = "An AI sees that a locked note exists, not its title or text. Lock one from a note\u{2019}s \u{2022}\u{2022}\u{2022} menu."
    static let howItWorks = "How it works"

    /// "How it works": every fact the page stands on, a title and a line or two each.
    /// `keychain`: the key is kept in iCloud Keychain here or on another device (as the page decides
    /// it). iCloud Keychain is said here only: it's your own Apple Account, not someone who can
    /// open your notes. `recovery`: the recovery key is offered (RecoveryKeyOffer).
    static func how(serverCopy: Bool, advanced: Bool, keychain: Bool, recovery: Bool) -> [(symbol: String, title: String, line: String)] {
        var out: [(String, String, String)] = [
            ("lock", "Encrypted before they sync", "Your notes are encrypted on your devices, then synced."),
        ]
        if serverCopy {
            out += [
                ("person.badge.key", "Pinto Notes keeps a copy of your key",
                 "So signing in opens your notes on a new device, and Pinto Notes can help you back in."),
                ("building.columns", "That means Pinto Notes could open them",
                 "For example under a court order. So could someone who gets into your account."),
            ]
        } else if advanced {
            out.append(("key", "Advanced protection is on",
                        "Pinto Notes keeps no copy of your key, so signing in doesn\u{2019}t open your notes on a new device. Add it from one of your devices, or use your recovery key."))
        } else {
            out.append(("key", "Only your devices hold the key",
                        "A new device is added from one that has your notes, or opened with your recovery key."))
        }
        if keychain {
            out.append(("icloud", "iCloud Keychain",
                        "Your key also syncs between your own devices through iCloud Keychain, end-to-end encrypted by Apple."))
        }
        out.append(("sparkles", "Connected AIs",
                    // What it may do first, as Allow says it; how its key works after (council round 7).
                    "Each AI you connect " + PrivacyCopy.aiMay
                    + " It has its own copy of your key, used only while it works on a request."))
        if recovery {
            out.append(("key.horizontal", "Recovery key", "Opens your notes if you lose your devices. Keep it somewhere safe."))
        }
        out.append(("lock.doc", "Locked notes", "Each locked note needs your notes password. Lock one from a note\u{2019}s \u{2022}\u{2022}\u{2022} menu. An AI sees that a locked note exists, not its title or text."))
        return out
    }

    /// Signed out, the page still says how it works (persona council, 4 November 2026: Marcus
    /// reads it before he signs in), as for a new account: Pinto Notes keeps a copy of its key.
    static let signedOutLine = "Sign in to see each device and AI that can open your notes. This is how it works for a new account."
    /// Signed in, and this Mac hasn't finished setting up: "Sign in" was wrong (round 24).
    static let settingUpLine = "Your devices and AIs show here once this Mac has finished setting up. This is how it works for a new account."
    static var signedOutHow: [(symbol: String, title: String, line: String)] {
        how(serverCopy: true, advanced: false, keychain: false, recovery: false)
    }

    static let pageTitle = "Pinto Notes recovery key"
    static let pageGuidance = "Keep this somewhere safe. With it, you can open your notes on a new device if you don't have your other devices."
    /// The website's page on what's stored, what's encrypted and what an AI can see.
    static let learnMore = "How your notes are kept private"
    static let learnMoreURL = URL(string: "https://pintonotes.com/privacy-security")!
    static let removeNote = " It can sign in again: to keep someone out, change your password."
    static var thisDevice: String { "This \(InstallID.kind)" }
    static var onlyTitle: String { "Only this \(InstallID.kind) can open your notes" }
    static let onlyDetail = "If you lose it, your notes are lost. Add another device, or save a recovery key."
    static let addDevice = "Add a device\u{2026}"
    static func removeTitle(_ name: String) -> String { "Remove \(name)?" }
    static let removeMessage = "It\u{2019}s signed out and its copy of your notes is erased the next time it\u{2019}s online. Notes on it that haven\u{2019}t synced are erased too. Anything it already showed could have been copied before that."
    static var removedTitle: String { "This \(InstallID.kind) was removed" }
    static let removedMessage = "Another of your devices removed it, so its copy of your notes was erased. To open them here again, sign in and add this device."
    static var notConfirmed: String { "This \(InstallID.kind) couldn\u{2019}t confirm it\u{2019}s you, so the recovery key stays hidden. Try again." }
    static var notSavedTitle: String { "Your key couldn\u{2019}t be saved on this \(InstallID.kind)" }
    /// `recovery`: the recovery key is offered (RecoveryKeyOffer). Without it, signing in brings the key back.
    static func notSavedMessage(recovery: Bool) -> String {
        recovery
            ? "Your notes are open now, but this \(InstallID.kind) will ask for your key again the next time Pinto Notes opens. Save your recovery key first, in \(settingsPath), or keep another device at hand to add this one."
            : "Your notes are open now, but this \(InstallID.kind) will need your key again the next time Pinto Notes opens. Signing in gets it back."
    }
    static let showRecovery = "Show Recovery Key"
    static let hideRecovery = "Hide Recovery Key"
    static let saveRecovery = "Save Recovery Key\u{2026}"
    static let showReason = "Show your recovery key"
    static let saveReason = "Save your recovery key"
    static let fileName = "Pinto Notes Recovery Key"
    static let recoveryChangedTitle = "Your recovery key changed"
    static let recoveryChanged = "Your account started fresh on another device, so a recovery key you saved before no longer opens your notes. The new one is here."
    static let recoveryChangedAlert = "Your account started fresh on another device, so it has a new recovery key. If you keep one, the new one is in \(settingsPath)."
    static let exportFooter = "Every note as a Markdown file, with its files, made on this device."
    static let exportFooterLocal = "Every note on this device as a Markdown file in its folder, with its files."
}

/// The recovery key is for accounts whose key only their own devices hold: Advanced protection
/// on, or an account that hasn't answered "Signing in now opens your notes" yet. With a copy kept
/// by Pinto Notes, signing in opens the notes, so nothing asks a standard account to save one.
/// Gated, not cut: the code stays for those accounts.
enum RecoveryKeyOffer {
    static func shown(serverCopy: Bool, protection: KeyProtection?) -> Bool {
        !serverCopy && protection != .standard
    }
}

extension AccountCrypto {
    /// Whether this account is offered a recovery key (RecoveryKeyOffer).
    var offersRecoveryKey: Bool { RecoveryKeyOffer.shown(serverCopy: serverCopy, protection: protection) }
}

/// What Settings › Security shows, read from the account: everything that can open your notes, in
/// the groups the page draws. Pure, so tests check it without drawing a thing.
struct SecurityContent: Equatable {
    /// The AI whose mark a connection shows: its own, or the one its name says (round 20: a
    /// connected Claude and ChatGPT with a key beside them).
    static func aiMark(_ mark: String?, title: String) -> String? {
        mark ?? (VersionAuthorMark.asset(title) != nil ? title : nil)
    }

    struct Opener: Identifiable, Equatable {
        enum Kind: Equatable { case thisDevice, device(UUID), pintoNotes, ai(UUID) }
        let kind: Kind
        let name: String
        /// The grey line under the name, on iPhone. The Mac's tile says `short`.
        let detail: String
        let short: String
        /// A glyph, or nil for Pinto Notes' mark or an AI's (`ai`).
        let symbol: String?
        /// The AI whose mark it shows.
        var ai: String? = nil
        var canRemove = false
        var id: String {
            switch kind {
            case .thisDevice: "this"
            case .device(let id): "device-\(id)"
            case .pintoNotes: "pinto"
            case .ai(let id): "ai-\(id)"
            }
        }
    }

    enum Recovery: Equatable { case saved, notSaved }

    let serverCopy: Bool
    let advanced: Bool
    let devices: [Opener]
    /// Pinto Notes, while it keeps a copy of the key.
    let pintoNotes: Opener?
    /// The AIs connected now. Never one that was disconnected.
    let ais: [Opener]
    /// Nil: no recovery key here (RecoveryKeyOffer).
    let recovery: Recovery?
    /// The Advanced protection switch: only for an account that has it on (AdvancedProtection).
    let showsProtection: Bool
    /// Add a device…: with a copy kept by Pinto Notes there's nothing to add, a new device signs in.
    let addsDevices: Bool
    /// "How it works" says iCloud Keychain.
    let keychain: Bool
    /// Nothing else is known to open the notes: said, in orange.
    let onlyThisDevice: Bool

    var openers: [Opener] { devices + (pintoNotes.map { [$0] } ?? []) + ais }
    var backInFooter: String { PrivacyCopy.backInFooter(serverCopy: serverCopy) }
    var how: [(symbol: String, title: String, line: String)] {
        PrivacyCopy.how(serverCopy: serverCopy, advanced: advanced, keychain: keychain, recovery: recovery != nil)
    }
    /// Every word the page shows, for tests.
    var words: [String] {
        var out: [String] = [PrivacyCopy.whoCanOpen, PrivacyCopy.status, backInFooter, PrivacyCopy.lockedLine]
        for o in openers { out += [o.name, o.detail, o.short] }
        if !ais.isEmpty { out.append(PrivacyCopy.aiFooter) }
        if recovery != nil { out += [PrivacyCopy.recoveryKey, PrivacyCopy.saveARecoveryKey, PrivacyCopy.saveRecovery, PrivacyCopy.showRecovery] }
        if showsProtection { out += [KeyCopyWords.strictTitle, KeyCopyWords.strictSubtitle] }
        for item in how { out += [item.title, item.line] }
        return out
    }

    static func == (a: Self, b: Self) -> Bool { a.openers == b.openers && a.recovery == b.recovery && a.showsProtection == b.showsProtection && a.serverCopy == b.serverCopy }

    init(serverCopy: Bool, protection: KeyProtection?, recoverySaved: Bool, backedUp: Bool, others: [KeyDevice],
         connections: [Connection], platform: String = InstallID.platform, now: Date = .now) {
        self.serverCopy = serverCopy
        advanced = protection == .strict
        let this = Opener(kind: .thisDevice, name: PrivacyCopy.thisDevice, detail: PrivacyCopy.inUseNow, short: PrivacyCopy.inUseNow,
                          symbol: platform == "macos" ? "laptopcomputer" : "iphone")
        devices = [this] + others.map { d in
            // Devices can share a name: when each was added tells them apart (round 18).
            let added = d.addedAt.formatted(.dateTime.day().month(.abbreviated).hour().minute())
            let seen = "\(Self.seen(d, now: now)) \u{00B7} added \(added)"
            return Opener(kind: .device(d.id), name: d.name, detail: seen, short: seen, symbol: d.symbol, canRemove: d.canRemove)
        }
        pintoNotes = serverCopy
            ? Opener(kind: .pintoNotes, name: PrivacyCopy.pintoNotes, detail: PrivacyCopy.pintoRow, short: PrivacyCopy.pintoTile, symbol: nil)
            : nil
        ais = connections.filter { $0.revoked_at == nil }.map { c in
            Opener(kind: .ai(c.id), name: c.title, detail: PrivacyCopy.aiRow, short: PrivacyCopy.aiTile,
                   symbol: SecurityContent.aiMark(c.mark, title: c.title) == nil ? c.symbol : nil, ai: SecurityContent.aiMark(c.mark, title: c.title))
        }
        recovery = RecoveryKeyOffer.shown(serverCopy: serverCopy, protection: protection) ? (recoverySaved ? .saved : .notSaved) : nil
        showsProtection = AdvancedProtection.shown(protection)
        addsDevices = !serverCopy
        keychain = backedUp || others.contains { $0.backedUp && !$0.removing && $0.isRecent(now: now) }
        onlyThisDevice = !serverCopy && KeyDeviceList.safety(thisBackedUp: backedUp, others: others, recoverySaved: recoverySaved, now: now) == .onlyThisDevice
    }

    @MainActor init(crypto: AccountCrypto, devices: KeyDevices, connections: [Connection]) {
        self.init(serverCopy: crypto.serverCopy, protection: crypto.protection, recoverySaved: crypto.recoveryKeySaved,
                  backedUp: crypto.backedUp, others: devices.others, connections: connections)
    }

    /// "Seen today", "Seen 18 Sep", "Not seen since 18 Sep", or that it's being removed.
    static func seen(_ d: KeyDevice, now: Date = .now) -> String {
        if d.removing { return "Removed" }
        let day = d.seenAt.formatted(.dateTime.day().month(.abbreviated))
        if !d.isRecent(now: now) { return "Not seen since \(day)" }
        return Calendar.current.isDate(d.seenAt, inSameDayAs: now) ? "Seen today" : "Seen \(day)"
    }
}

#if os(iOS)
/// Settings › Security on iPhone, a page of its own.
struct PrivacySecurityView: View {
    let crypto: AccountCrypto
    var devices: KeyDevices = .shared
    var addDeviceServer: AddDeviceServer?

    var body: some View {
        PrivacySecuritySection(crypto: crypto, devices: devices)
            .navigationTitle(PrivacyCopy.title)
            .navigationBarTitleDisplayMode(.inline)
    }
}
#endif

/// Settings › Privacy: two rows (Emil, 7 November 2026: the page was too much). Encryption, one
/// level down, and Diagnostics; the terms under them. Devices are on Account, and each AI's
/// Disconnect is on AI Connections.
struct PrivacyPage: View {
    let crypto: AccountCrypto

    /// Under Encryption. "Encrypted", never "end-to-end", unless only your devices hold the key.
    static func encryptionLine(advanced: Bool) -> String {
        advanced ? "Only your devices can open your notes" : "Your notes are encrypted"
    }

    var body: some View {
        SettingsPageForm {
            Section {
                SettingsSubPageRow(page: .encryption, id: "privacy.encryption", detail: Self.encryptionLine(advanced: crypto.protection == .strict))
            }
            PrivacyModeSection()
            DiagnosticsSection()
            LegalRowsSection()
        }
    }
}

/// Settings › Privacy › Encryption, on the Mac and iPhone alike: who can open your notes,
/// a picture of every mark over one line on how they're kept; then what helps you back in,
/// Advanced protection, locked notes, and "How it works". The recovery key (shown behind Face ID or Touch ID or the passcode, saved by printing, as a PDF or
/// by copying it) only for accounts whose key only their devices hold (RecoveryKeyOffer).
struct PrivacySecuritySection: View {
    let crypto: AccountCrypto
    var devices: KeyDevices = .shared
    /// The connected AIs, from the same list as Settings › AI. Nil: none (captures, tests).
    var client: SupabaseClient?
    /// Captures: shows these instead of asking the server.
    var connections: [Connection]?
    var sync: SyncEngine?
    /// The recovery key while it's shown.
    @State private var shown: String?
    @State private var saving: String?
    @State private var problem: String?
    @State private var loaded: [Connection] = []
    @State private var showsHow = false
    /// Which way the switch is being turned, while its question is up.
    @State private var turning: KeyProtection = .strict
    /// The question is up. Kept apart from `turning`, so the dialog's words and its button don't
    /// change under it while it goes away.
    @State private var asksTurn = false
    @State private var changing = false
    /// Advanced protection was refused because nothing else could open the notes: save the
    /// recovery key first (`asksToSaveFirst`), and it turns on when that's done (`strictWhenSaved`).
    @State private var asksToSaveFirst = false
    @State private var strictWhenSaved = false
    /// The server refused Advanced protection because the password was just reset: from when it can be turned on.
    @State private var strictPausedNote: String?
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.networkReach) private var reach

    private var content: SecurityContent { SecurityContent(crypto: crypto, devices: devices, connections: connections ?? loaded) }

    var body: some View {
        SettingsPageForm { page }
            .task {
                await crypto.recheck()
                await devices.refresh(crypto)
                await loadConnections()
            }
            #if os(iOS)
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in shown = nil }
            #endif
            .onDisappear { shown = nil }
            .sheet(isPresented: $showsHow) { HowItWorksSheet(content: content) }
    }

    /// The same list as Settings › AI (ConnectChoices): the account's connections, less those disconnected.
    private func loadConnections() async {
        guard connections == nil, let client else { return }
        if let rows = try? await Connection.list(client) { loaded = rows.filter { $0.revoked_at == nil } }
    }

    @ViewBuilder private var page: some View {
        let c = content
        Section {
            VStack(spacing: 10) {
                SecurityMarkStack(openers: c.openers)
                VStack(spacing: 2) {
                    Text(PrivacyCopy.whoCanOpen).font(.title3.weight(.semibold))
                    Text(PrivacyCopy.status).font(.subheadline).foregroundStyle(Color.muted)
                        .accessibilityIdentifier("privacy.summary")
                }
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .accessibilityElement(children: .combine)
            if c.onlyThisDevice { onlyThisDeviceRow }
            if let problem {
                Text(problem).font(.footnote).foregroundStyle(.red)
            }
        }
        if c.pintoNotes != nil || c.recovery != nil {
            Section {
                if let p = c.pintoNotes { opener(p).accessibilityIdentifier("privacy.serverCopy") }
                if let r = c.recovery { recoveryRows(r) }
            } header: {
                Text(PrivacyCopy.backInHeader)
            } footer: {
                Text(c.backInFooter).accessibilityIdentifier("privacy.backInFooter")
            }
        }
        if c.showsProtection {
            Section {
                protectionToggle
            } footer: {
                if let protectionFooter { Text(protectionFooter).accessibilityIdentifier("privacy.strictFooter") }
            }
        }
        LockedNotesSection(sync: sync)
        Section {
            Button { showsHow = true } label: {
                SettingsLinkRow(title: PrivacyCopy.howItWorks, symbol: "info.circle", trailing: "chevron.right")
            }
            .settingsRowLink()
            .accessibilityIdentifier("privacy.howItWorks")
        }
    }

    /// One thing that can open your notes: its mark, its name, a short grey line.
    private func opener(_ o: SecurityContent.Opener) -> some View {
        SecurityOpenerRow(opener: o) { EmptyView() }
    }

    /// The recovery key: saved or not, with Show or Hide and Save… on its row (short words on the
    /// row; VoiceOver hears the full names), and under it a changed key's warning and the key while it's shown.
    @ViewBuilder private func recoveryRows(_ r: SecurityContent.Recovery) -> some View {
        // Laid out like the device rows, so its name lines up with theirs.
        HStack(spacing: 12) {
            SecurityMark(opener: nil, symbol: "key.horizontal", size: SecurityLook.mark, scales: SecurityLook.scales)
            VStack(alignment: .leading, spacing: 1) {
                Text(r == .saved ? PrivacyCopy.recoveryKey : PrivacyCopy.saveARecoveryKey).foregroundStyle(Color.ink)
                Text(r == .saved ? PrivacyCopy.recoverySaved : PrivacyCopy.saveARecoveryKeyLine)
                    .font(.subheadline).foregroundStyle(Color.muted)
            }
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityElement(children: .combine)
            Spacer(minLength: 8)
            HStack(spacing: 6) {
                if r == .saved {
                    if shown != nil {
                        Button("Hide") { self.shown = nil }
                            .settingsRowButton()
                            .accessibilityLabel(PrivacyCopy.hideRecovery)
                            .accessibilityIdentifier("privacy.hideRecovery")
                    } else {
                        Button("Show") { Task { await reveal(reason: PrivacyCopy.showReason) { shown = $0 } } }
                            .settingsRowButton()
                            .accessibilityLabel(PrivacyCopy.showRecovery)
                            .accessibilityIdentifier("privacy.showRecovery")
                    }
                }
                Button("Save\u{2026}") { save() }
                    .settingsRowButton()
                    .accessibilityLabel(r == .saved ? PrivacyCopy.saveRecovery : PrivacyCopy.saveARecoveryKey)
                    .accessibilityIdentifier(r == .saved ? "privacy.saveRecoveryAgain" : "privacy.saveRecovery")
                    .modifier(saveSheet)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(r == .saved ? "privacy.recoveryStatus" : "privacy.recoveryRow")
        if shown != nil || crypto.recoveryKeyChanged { recoveryExtras }
    }

    private var onlyThisDeviceRow: some View {
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(PrivacyCopy.onlyTitle)
                Text(PrivacyCopy.onlyDetail).font(.footnote).foregroundStyle(Color.muted)
            }
            .fixedSize(horizontal: false, vertical: true)
        } icon: {
            Image(systemName: "exclamationmark.circle.fill").foregroundStyle(.orange)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("privacy.onlyThisDevice")
    }

    /// The recovery key changed, and the key while it's shown.
    @ViewBuilder private var recoveryExtras: some View {
        if crypto.recoveryKeyChanged {
            Label(PrivacyCopy.recoveryChanged, systemImage: "exclamationmark.triangle.fill")
                .font(.callout)
                .foregroundStyle(.orange)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("privacy.recoveryChanged")
        }
        if let shown {
            Text(shown)
                .font(.system(.body, design: .monospaced).weight(.semibold))
                .textSelection(.enabled)
                .accessibilityIdentifier("privacy.recoveryKey")
        }
    }

    private func save() { Task { await reveal(reason: PrivacyCopy.saveReason) { saving = $0 } } }

    /// Save a recovery key: on whichever button asked, as the sheet must hang on its button.
    private var saveSheet: SheetOn {
        SheetOn(isPresented: Binding(get: { saving != nil }, set: { if !$0 { saving = nil } })) {
            AnyView(SaveRecoveryKeySheet(key: saving ?? "") { await markSaved() }
                .onDisappear {
                    guard strictWhenSaved else { return }
                    strictWhenSaved = false
                    if crypto.recoveryKeySaved { Task { await change(to: .strict, confirmed: true) } }
                })
        }
    }

    // MARK: Advanced protection

    /// Whether the Advanced protection switch is on the page. Retired (AdvancedProtection): only
    /// for an account that has it on, so it can turn it off.
    static func showsProtection(_ crypto: AccountCrypto) -> Bool { AdvancedProtection.shown(crypto.protection) }

    /// Under the switch while it's off (shown then only if it's offered again). On, the switch's
    /// own line and the page above it say it already.
    private var protectionFooter: String? {
        guard crypto.protection == .standard else { return nil }
        return KeyCopyWords.strictFooterOff + (pausedNote.map { "\n\n" + $0 } ?? "")
    }

    /// On: only the person's devices hold the key. Off: Pinto Notes keeps a copy, and signing in
    /// opens the notes on a new device. Either way is asked once more before it's done.
    private var protectionToggle: some View {
        let strict = crypto.protection != .standard
        return Toggle(isOn: Binding(get: { strict }, set: { turning = $0 ? .strict : .standard; asksTurn = true })) {
            VStack(alignment: .leading, spacing: 2) {
                Text(KeyCopyWords.strictTitle)
                Text(KeyCopyWords.strictSubtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
            // Off and held by a password reset: it can't be turned on yet, and the footer says from when.
            .disabled(changing || reach != .online || (!strict && (crypto.strictPausedUntil ?? .distantPast) > .now))
            .settingsSwitch()
            .accessibilityIdentifier("privacy.strict")
            .confirmationDialog(turning == .strict ? KeyCopyWords.turnOnTitle : KeyCopyWords.turnOffTitle,
                                isPresented: $asksTurn, titleVisibility: .visible) {
                if turning == .strict {
                    Button(KeyCopyWords.turnOn, role: .destructive) { Task { await change(to: .strict) } }
                        .accessibilityIdentifier("privacy.confirmStrict")
                } else {
                    Button(KeyCopyWords.turnOff) { Task { await change(to: .standard) } }
                        .accessibilityIdentifier("privacy.confirmStandard")
                }
            } message: {
                Text(turning == .strict ? KeyCopyWords.turnOnMessage : KeyCopyWords.turnOffMessage)
            }
            // Nothing else could open the notes yet: the recovery key is shown and saved
            // first, and the switch turns on when it has been.
            .alert(KeyCopyWords.saveFirstTitle, isPresented: $asksToSaveFirst) {
                Button(KeyCopyWords.saveFirst) {
                    Task { await reveal(reason: PrivacyCopy.saveReason) { strictWhenSaved = true; saving = $0 } }
                }
                .accessibilityIdentifier("privacy.saveFirst")
                Button("Cancel", role: .cancel) {}
            } message: {
                Text(KeyCopyWords.saveFirstMessage)
            }
            // The page's recovery key buttons hold the sheet when they're there: one sheet per binding.
            .modifier(content.recovery == nil ? saveSheet : SheetOn(isPresented: .constant(false)) { AnyView(EmptyView()) })
    }

    /// Under the switch while a password reset holds it: from when it can be turned on. Known from
    /// the key state before anyone tries, or from the server's refusal.
    private var pausedNote: String? {
        if let until = crypto.strictPausedUntil, until > .now { return KeyCopyWords.strictPaused(until: until) }
        return strictPausedNote
    }

    /// `confirmed`: the device's owner was just asked (to show the recovery key), so isn't again.
    private func change(to mode: KeyProtection, confirmed: Bool = false) async {
        problem = nil
        if !confirmed {
            guard await DeviceOwner.authenticate(reason: mode == .strict ? "turn on Advanced protection" : "turn off Advanced protection") else { return }
        }
        changing = true
        defer { changing = false }
        do {
            switch mode {
            case .standard: try await crypto.keepCopy()
            case .strict:
                guard let device = devices.device else { throw KeyCopyError.offline }
                try await crypto.keepOnDevicesOnly(device: device)
            }
        } catch KeyCopyError.needsRecoveryKey {
            asksToSaveFirst = true
        } catch KeyCopyError.strictPaused(let until) {
            // Said under the switch, where it stays, and not as a passing error.
            strictPausedNote = KeyCopyWords.strictPaused(until: until)
        } catch {
            problem = (error as? KeyCopyError).map(KeyCopyWords.error) ?? error.localizedDescription
        }
    }

    private func reveal(reason: String, then show: (String) -> Void) async {
        problem = nil
        guard let key = crypto.recoveryKeyText else { return }
        switch await DeviceOwner.confirm(reason: reason) {
        case .confirmed: show(key)
        // You chose Cancel: nothing to say.
        case .cancelled: break
        // Anything else used to end in silence, as if the button did nothing.
        case .failed: problem = PrivacyCopy.notConfirmed
        }
    }

    private func markSaved() async {
        do { try await crypto.markRecoveryKeySaved() } catch { problem = error.localizedDescription }
    }
}

/// A sheet on the view it's put on, built only while it's up.
struct SheetOn: ViewModifier {
    @Binding var isPresented: Bool
    let sheet: () -> AnyView
    func body(content: Content) -> some View {
        content.sheet(isPresented: $isPresented) { sheet() }
    }
}

// MARK: Pieces

enum SecurityLook {
    #if os(macOS)
    static let radius: CGFloat = 10
    static let fill = Color.primary.opacity(0.045)
    /// A row's mark: the Mac's rows are a fixed 13 pt.
    static let mark: CGFloat = 15
    static let scales = false
    /// The circles of the picture at the top.
    /// Solid, so a circle hides the one under it instead of showing two edges through (Emil, 7 November 2026).
    static let disc = SettingsInk.dynamic(NSColor(white: 0.9, alpha: 1), NSColor(white: 0.26, alpha: 1))
    static let discEdge = SettingsInk.ground
    #else
    static let radius: CGFloat = 18
    static let fill = Color(.secondarySystemGroupedBackground)
    static let mark: CGFloat = 22
    static let scales = true
    static let disc = Color(.tertiarySystemGroupedBackground)
    static let discEdge = Color(.secondarySystemGroupedBackground)
    #endif
}

/// A thing that can open your notes, by its mark: a glyph, Pinto Notes' mark or an AI's.
struct SecurityMark: View {
    let opener: SecurityContent.Opener?
    var symbol: String? = nil
    var size: CGFloat = 22
    var scales = true
    /// Grows with the text, like Settings' row icons.
    @ScaledMetric(relativeTo: .body) private var scale: CGFloat = 1

    var body: some View {
        let size = size * (scales ? min(scale, 1.6) : 1)
        Group {
            if let o = opener, o.kind == .pintoNotes {
                AppMark(size: size * 1.2)
            } else if let ai = opener?.ai {
                VersionAuthorMark(author: .ai(ai), size: size)
            } else {
                Image(systemName: opener?.symbol ?? symbol ?? "circle").font(.system(size: size)).foregroundStyle(Color.ink)
            }
        }
        .frame(width: size * 1.4, height: size * 1.4)
        .accessibilityHidden(true)
    }
}

/// A list row like Settings › Apple Account's devices: mark, name, a grey line under it, and an
/// action (Remove…) at the end, or under the line at the largest text sizes.
struct SecurityOpenerRow<Action: View>: View {
    let opener: SecurityContent.Opener
    @ViewBuilder var action: Action
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        HStack(spacing: 12) {
            SecurityMark(opener: opener, size: SecurityLook.mark, scales: SecurityLook.scales)
            VStack(alignment: .leading, spacing: 1) {
                VStack(alignment: .leading, spacing: 1) {
                    Text(opener.name).foregroundStyle(Color.ink)
                    Text(opener.detail).font(.subheadline).foregroundStyle(Color.muted)
                }
                .accessibilityElement(children: .combine)
                if typeSize.isAccessibilitySize { action.padding(.top, 4) }
            }
            .fixedSize(horizontal: false, vertical: true)
            if !typeSize.isAccessibilitySize {
                Spacer(minLength: 8)
                action
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .contain)
    }
}

extension SecurityOpenerRow where Action == EmptyView {
    init(opener: SecurityContent.Opener) { self.init(opener: opener) { EmptyView() } }
}

/// Every opener's mark, overlapping, each in a small circle: the picture at the top of the page.
struct SecurityMarkStack: View {
    let openers: [SecurityContent.Opener]
    /// More than this and the row would run past a phone's width.
    static let most = 7

    var body: some View {
        HStack(spacing: -6) {
            ForEach(openers.prefix(Self.most)) { o in
                SecurityMark(opener: o, size: 20, scales: false)
                    .frame(width: 44, height: 44)
                    .background(SecurityLook.disc, in: Circle())
                    .overlay(Circle().strokeBorder(SecurityLook.discEdge, lineWidth: 2.5))
            }
        }
        .accessibilityHidden(true)
    }
}



/// "How it works": every fact the page stands on, in a sheet, and the website's longer page.
struct HowItWorksSheet: View {
    let content: SecurityContent
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        #if os(macOS)
        HowItWorksMac(content: content, done: { dismiss() })
        #else
        list
        #endif
    }

    private var list: some View {
        NavigationStack {
            Form {
                Section {
                    ForEach(content.how, id: \.title) { item in
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Image(systemName: item.symbol)
                                .foregroundStyle(.secondary)
                                .frame(width: 22)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title)
                                Text(item.line).font(.callout).foregroundStyle(.secondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 2)
                        .accessibilityElement(children: .combine)
                    }
                }
                Section {
                    Link(destination: PrivacyCopy.learnMoreURL) {
                        LabeledContent(PrivacyCopy.learnMore) {
                            Image(systemName: "arrow.up.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                        }
                        .foregroundStyle(.primary)
                        .contentShape(.rect)
                    }
                    .settingsRowLink()
                    .accessibilityIdentifier("privacy.learnMore")
                }
            }
            .formStyle(.grouped)
            .navigationTitle(PrivacyCopy.howItWorks)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}

#if os(macOS)
/// The Mac's "How it works", as Apple's own information sheets are: a symbol and the title
/// centred at the top, then each fact as a symbol, a bold line and its explanation, on the
/// sheet's own ground with no boxes or bands, and Done at the bottom right (Emil, 8 November
/// 2026: the grouped list with a title bar and a footer band "looks bad").
struct HowItWorksMac: View {
    let content: SecurityContent
    var done: () -> Void
    static let width: CGFloat = 460
    static let height: CGFloat = 630
    static let inset: CGFloat = 34
    @State private var linkHover = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    VStack(spacing: 10) {
                        Image(systemName: "lock.shield")
                            .font(.system(size: 34, weight: .regular))
                            .foregroundStyle(SettingsInk.icon)
                            .accessibilityHidden(true)
                        Text(PrivacyCopy.howItWorks)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(SettingsInk.text)
                            .accessibilityAddTraits(.isHeader)
                            .accessibilityIdentifier("privacy.howSheet.title")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 24)
                    .padding(.bottom, 20)

                    VStack(alignment: .leading, spacing: 14) {
                        ForEach(content.how, id: \.title) { item in
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: item.symbol)
                                    .font(.system(size: 16, weight: .regular))
                                    .foregroundStyle(SettingsInk.icon)
                                    .frame(width: 24, height: 17)
                                    .accessibilityHidden(true)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(item.title)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(SettingsInk.text)
                                    Text(item.line)
                                        .font(.system(size: 13))
                                        .foregroundStyle(SettingsInk.muted)
                                        .lineSpacing(1.5)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .accessibilityElement(children: .combine)
                            .accessibilityIdentifier("privacy.howSheet.\(item.symbol)")
                        }
                    }

                    Link(destination: PrivacyCopy.learnMoreURL) {
                        HStack(spacing: 4) {
                            Text(PrivacyCopy.learnMore)
                            Image(systemName: "arrow.up.right").font(.system(size: 10, weight: .semibold))
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(SettingsInk.text)
                        .underline(linkHover)
                        .padding(.vertical, 3)
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .onHover { linkHover = $0 }
                    .padding(.leading, 38)
                    .padding(.top, 18)
                    .accessibilityIdentifier("privacy.learnMore")
                }
                .padding(.horizontal, Self.inset)
                .padding(.bottom, 8)
            }
            .scrollBounceBehavior(.basedOnSize)

            HStack {
                Spacer()
                Button("Done", action: done)
                    .buttonStyle(.amberProminent)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("privacy.howSheet.done")
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 18)
        }
        .frame(width: Self.width, height: Self.height)
        .background(SettingsInk.ground)
    }
}
#endif

private struct RecoveryKeyItem: Identifiable {
    let key: String
    var id: String { key }
}

/// Face ID, Touch ID or the device passcode (`deviceOwnerAuthentication`).
enum DeviceOwner {
    @MainActor static func authenticate(reason: String) async -> Bool {
        #if DEBUG
        // UI tests run on a simulator with no passcode and no account (its key store is in memory):
        // nothing is asked there. Release builds always ask.
        if ProcessInfo.processInfo.arguments.contains("-uitest") { return true }
        // UI tests that need a real account and the Keychain (no -uitest) on a simulator, which
        // has no passcode to type.
        if ProcessInfo.processInfo.arguments.contains("-ownerConfirmed") { return true }
        #endif
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            // No passcode on this device: nothing to ask for.
            return (error as? LAError)?.code == .passcodeNotSet
        }
        return (try? await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason)) ?? false
    }

    enum Outcome { case confirmed, cancelled, failed }

    /// The same question, telling a Cancel from a failure, for buttons that should say when
    /// nothing happened.
    @MainActor static func confirm(reason: String) async -> Outcome {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-uitest") || ProcessInfo.processInfo.arguments.contains("-ownerConfirmed") { return .confirmed }
        #endif
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            return (error as? LAError)?.code == .passcodeNotSet ? .confirmed : .failed
        }
        do {
            return try await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) ? .confirmed : .failed
        } catch let e as LAError where [.userCancel, .appCancel, .systemCancel].contains(e.code) {
            return .cancelled
        } catch {
            return .failed
        }
    }
}

// MARK: Saving the recovery key

/// Print it, save it as a PDF, or copy it. Each one done counts as saved, on every device.
struct SaveRecoveryKeySheet: View {
    let key: String
    let saved: () async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var exporting = false
    @State private var done: String?
    @State private var pdf: Data?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(key)
                        .font(.system(.title3, design: .monospaced).weight(.semibold))
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .accessibilityIdentifier("recovery.key")
                } footer: {
                    Text(PrivacyCopy.pageGuidance)
                }
                Section {
                    Button("Print…", systemImage: "printer") { Task { if await RecoveryKeyPage.print(key) { await finished("Printed") } } }
                        .accessibilityIdentifier("recovery.print")
                    Button("Save as PDF…", systemImage: "doc") {
                        pdf = RecoveryKeyPage.pdf(key)
                        exporting = true
                    }
                        .accessibilityIdentifier("recovery.pdf")
                    Button("Copy", systemImage: "doc.on.doc") {
                        RecoveryKeyPage.copy(key)
                        Task { await finished("Copied") }
                    }
                    .accessibilityIdentifier("recovery.copy")
                } footer: {
                    if let done { Text(done) }
                }
            }
            .formStyle(.grouped)
            .navigationTitle("Save a recovery key")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .fileExporter(isPresented: $exporting, document: pdf.map(PDFFile.init(data:)), contentType: .pdf,
                          defaultFilename: PrivacyCopy.fileName) { result in
                if case .success = result { Task { await finished("Saved as a PDF") } }
            }
        }
        #if os(macOS)
        .frame(width: 440, height: 620)
        #endif
    }

    private func finished(_ what: String) async {
        done = what + "."
        await saved()
    }
}

/// The page that's printed or saved: the key and one line of guidance, black on white.
struct RecoveryKeyPage: View {
    let key: String
    /// US Letter, in points; fits on A4 too.
    static let size = CGSize(width: 612, height: 792)

    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Text(PrivacyCopy.pageTitle)
                .font(.system(size: 26, weight: .heavy))
            Text(key)
                .font(.system(size: 24, weight: .semibold, design: .monospaced))
                .padding(.vertical, 18)
                .padding(.horizontal, 20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(.black.opacity(0.3), lineWidth: 1))
            Text(PrivacyCopy.pageGuidance)
                .font(.system(size: 14))
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            Text(Date.now.formatted(date: .long, time: .omitted))
                .font(.system(size: 11))
                .foregroundStyle(.black.opacity(0.5))
        }
        .foregroundStyle(.black)
        .padding(64)
        .frame(width: Self.size.width, height: Self.size.height, alignment: .topLeading)
        .background(.white)
        .environment(\.colorScheme, .light)
    }

    @MainActor static func pdf(_ key: String) -> Data {
        let data = NSMutableData()
        let renderer = ImageRenderer(content: RecoveryKeyPage(key: key))
        renderer.render { size, draw in
            var box = CGRect(origin: .zero, size: size)
            guard let consumer = CGDataConsumer(data: data as CFMutableData),
                  let pdf = CGContext(consumer: consumer, mediaBox: &box, nil) else { return }
            pdf.beginPDFPage(nil)
            draw(pdf)
            pdf.endPDFPage()
            pdf.closePDF()
        }
        return data as Data
    }

    /// The print panel with the page. True when it was printed.
    @MainActor static func print(_ key: String) async -> Bool {
        let data = pdf(key)
        #if os(iOS)
        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo.printInfo()
        info.jobName = PrivacyCopy.fileName
        info.outputType = .grayscale
        controller.printInfo = info
        controller.printingItem = data
        return await withCheckedContinuation { done in
            controller.present(animated: true) { _, completed, _ in done.resume(returning: completed) }
        }
        #else
        guard let document = PDFDocument(data: data),
              let operation = document.printOperation(for: .shared, scalingMode: .pageScaleToFit, autoRotate: true) else { return false }
        operation.jobTitle = PrivacyCopy.fileName
        return operation.run()
        #endif
    }

    /// On the pasteboard, kept off other devices and marked as a secret for clipboard managers.
    @MainActor static func copy(_ key: String) {
        #if os(iOS)
        UIPasteboard.general.setItems([[UTType.plainText.identifier: key]], options: [.localOnly: true])
        #else
        let board = NSPasteboard.general
        board.clearContents()
        board.declareTypes([.string, NSPasteboard.PasteboardType("org.nspasteboard.ConcealedType")], owner: nil)
        board.setString(key, forType: .string)
        board.setString(key, forType: NSPasteboard.PasteboardType("org.nspasteboard.ConcealedType"))
        #endif
    }
}

struct PDFFile: FileDocument {
    static let readableContentTypes: [UTType] = [.pdf]
    let data: Data

    init(data: Data) { self.data = data }

    init(configuration: ReadConfiguration) throws {
        data = configuration.file.regularFileContents ?? Data()
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

/// Privacy signed out, or while this device finishes setting up: one line on what
/// signing in adds, every "How it works" line as a new account has them, and the website's longer
/// page, with the terms under them; then the notes password, if there is one.
struct SignedOutPrivacyPage: View {
    var signedIn = false
    let sync: SyncEngine?

    private var intro: some View {
        Text(signedIn ? PrivacyCopy.settingUpLine : PrivacyCopy.signedOutLine)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("privacy.signedOut")
    }

    var body: some View {
        SettingsPageForm {
            #if os(macOS)
            OpenSection { intro }
            #else
            Section { intro }
            #endif
            Section {
                ForEach(PrivacyCopy.signedOutHow, id: \.title) { item in
                    Label {
                        Text(item.title)
                        Text(item.line)
                    } icon: {
                        // One width, so each title starts at the same place.
                        Image(systemName: item.symbol).foregroundStyle(Color.muted).frame(width: 22)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("privacy.how.\(item.symbol)")
                }
                Link(destination: PrivacyCopy.learnMoreURL) { SettingsLinkRow(title: PrivacyCopy.learnMore, symbol: "safari") }
                    .settingsRowLink()
                    .accessibilityIdentifier("privacy.learnMore")
            } header: {
                Text(PrivacyCopy.howItWorks)
            } footer: {
                LegalLinksRow()
            }
            if NoteVault.shared.isSetUp { LockedNotesSection(sync: sync) }
            DiagnosticsSection()
        }
    }
}

#if os(macOS)
/// About Pinto Notes: the standard panel, with the trademark notes as its credits.
enum AboutCredits {
    static var credits: NSAttributedString {
        let centred = NSMutableParagraphStyle()
        centred.alignment = .center
        return NSAttributedString(string: HelpCopy.trademarks, attributes: [
            .font: NSFont.systemFont(ofSize: NSFont.smallSystemFontSize),
            .foregroundColor: NSColor.secondaryLabelColor,
            .paragraphStyle: centred,
        ])
    }

    @MainActor static func show() {
        NSApp.orderFrontStandardAboutPanel(options: [.credits: credits])
        NSApp.activate()
    }
}
#endif
