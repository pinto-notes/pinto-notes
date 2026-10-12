import LocalAuthentication
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
    static let title = "Security"
    static let summary = "Encrypted on your devices. We can't read your notes. When you connect an AI, our server unlocks your notes for that AI's requests."
    /// With a copy of the key kept by Pinto Notes (KeyCopy): what's true then.
    static let summaryWithCopy = "Encrypted on your devices before they sync. Signing in opens your notes on a new device, because Pinto Notes keeps a locked copy of your key. When you connect an AI, our server unlocks your notes for that AI's requests."
    static func summary(serverCopy: Bool) -> String { serverCopy ? summaryWithCopy : summary }
    static let recoveryFooter = "A recovery key opens your notes on a new device when none of your other devices is at hand. If every device is gone and you saved no recovery key, your notes are lost. We can\u{2019}t open them either."
    static let recoveryFooterWithCopy = "A recovery key opens your notes without signing in. You don\u{2019}t need one while Pinto Notes keeps a copy of your key."
    static func recoveryFooter(serverCopy: Bool) -> String { serverCopy ? recoveryFooterWithCopy : recoveryFooter }
    static let pageTitle = "Pinto Notes recovery key"
    static let pageGuidance = "Keep this somewhere safe. With it, you can open your notes on a new device if you don't have your other devices."
    static let keyHeader = "Where your key is kept"
    static let keyFooter = "Without one of these, nobody can open your notes, including us. A connected AI can read them while it\u{2019}s connected."
    static let keyFooterWithCopy = "Any of these opens your notes. A connected AI can read them while it\u{2019}s connected."
    static func keyFooter(serverCopy: Bool) -> String { serverCopy ? keyFooterWithCopy : keyFooter }
    static let removeNote = " It can sign in again: to keep someone out, change your password."
    static var thisDevice: String { "This \(InstallID.kind)" }
    static var keptInKeychain: String { "Keeps your key in its Keychain, where iCloud Keychain can pick it up" }
    static var keptHere: String { "Keeps your key on this \(InstallID.kind) only" }
    static let keychainTitle = "iCloud Keychain"
    static let keychainDetail = "Brings your key to your other iPhone or Mac, if it\u{2019}s on for this Apple Account."
    static var safeTitle: String { "Safe if you lose this \(InstallID.kind)" }
    static func safeDetail(_ ways: Int) -> String {
        switch ways {
        case 1: "One other way can open your notes."
        case 2: "Two other ways can open your notes."
        case 3: "Three other ways can open your notes."
        default: "\(ways) other ways can open your notes."
        }
    }
    static let unconfirmedTitle = "Can\u{2019}t confirm a backup of your key"
    static let unconfirmedDetail = "Your key is backed up only if iCloud Keychain is on. Adding a device makes it safe."
    static let howToCheck = "How to check"
    #if os(macOS)
    static let howToCheckDetail = "System Settings \u{203A} [your name] \u{203A} iCloud \u{203A} Passwords & Keychain. Pinto Notes can\u{2019}t see that setting."
    #else
    static let howToCheckDetail = "Settings \u{203A} [your name] \u{203A} iCloud \u{203A} Passwords & Keychain. Pinto Notes can\u{2019}t see that setting."
    #endif
    static var onlyTitle: String { "Only this \(InstallID.kind) can open your notes" }
    static let onlyDetail = "If you lose it, your notes are lost. We can\u{2019}t open them either. Add another device to be safe."
    static let addDevice = "Add a device\u{2026}"
    static func removeTitle(_ name: String) -> String { "Remove \(name)?" }
    static let removeMessage = "It\u{2019}s signed out and its copy of your notes is erased the next time it\u{2019}s online. Notes on it that haven\u{2019}t synced are erased too. Anything it already showed could have been copied before that."
    static var removedTitle: String { "This \(InstallID.kind) was removed" }
    static let removedMessage = "Another of your devices removed it, so its copy of your notes was erased. To open them here again, sign in and add this device."
    static var notConfirmed: String { "This \(InstallID.kind) couldn\u{2019}t confirm it\u{2019}s you, so the recovery key stays hidden. Try again." }
    static var notSavedTitle: String { "Your key couldn\u{2019}t be saved on this \(InstallID.kind)" }
    static var notSavedMessage: String {
        "Your notes are open now, but this \(InstallID.kind) will ask for your key again the next time Pinto Notes opens. Save your recovery key first, in Settings \u{203A} Security, or keep another device at hand to add this one."
    }
    static let showReason = "Show your recovery key"
    static let saveReason = "Save your recovery key"
    static let fileName = "Pinto Notes Recovery Key"
    static let recoveryChangedTitle = "Your recovery key changed"
    static let recoveryChanged = "Your account started fresh on another device, so a recovery key you saved before no longer opens your notes. The new one is here."
    static let recoveryChangedAlert = "Your account started fresh on another device, so it has a new recovery key. If you keep one, the new one is in Settings › Security."
    static let exportFooter = "Every note as a Markdown file in its folder, with its files. Your notes are encrypted, so the export is made on this device."
}

#if os(iOS)
/// Settings › Security on iPhone, a page of its own.
struct PrivacySecurityView: View {
    let crypto: AccountCrypto
    var devices: KeyDevices = .shared
    var addDeviceServer: AddDeviceServer?

    var body: some View {
        Form { PrivacySecuritySection(crypto: crypto, devices: devices, addDeviceServer: addDeviceServer) }
            .formStyle(.grouped)
            .navigationTitle(PrivacyCopy.title)
            .navigationBarTitleDisplayMode(.inline)
    }
}
#endif

/// The encryption summary, where the key is kept (this device, iCloud Keychain, devices added,
/// and Add a device), and the recovery key, which is optional: shown behind Face ID or Touch ID
/// (or the device passcode), and saved by printing, as a PDF or by copying it.
struct PrivacySecuritySection: View {
    let crypto: AccountCrypto
    var devices: KeyDevices = .shared
    /// Adding a device talks to the server; nil in previews.
    var addDeviceServer: AddDeviceServer?
    /// The recovery key while it's shown.
    @State private var shown: String?
    @State private var saving: String?
    @State private var problem: String?
    @State private var adding = false
    @State private var removing: KeyDevice?
    @State private var showsHowToCheck = false
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

    var body: some View {
        Section {
            Text(PrivacyCopy.summary(serverCopy: crypto.serverCopy))
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("privacy.summary")
        }
        keySection
        if crypto.protection != nil || crypto.copiesOn { protectionSection }
        Section {
            LabeledContent("Recovery key") {
                Text(recoveryStatus)
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("privacy.recoveryStatus")
            }
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
            #if os(macOS)
            // Side by side on the Mac, so Security fits its window without scrolling.
            HStack(spacing: 10) {
                showOrHide
                saveButton
            }
            #else
            showOrHide
            saveButton
            #endif
            if let problem {
                Text(problem).font(.footnote).foregroundStyle(.red)
            }
        } footer: {
            // "Optional" only while something else is known to open the notes.
            Text((recoveryStatus == "Optional" ? "Optional. " : "") + PrivacyCopy.recoveryFooter(serverCopy: crypto.serverCopy))
        }
        .task {
            await crypto.recheck()
            await devices.refresh(crypto)
        }
        #if os(iOS)
        .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in shown = nil }
        #endif
        .onDisappear { shown = nil }
    }

    @ViewBuilder private var showOrHide: some View {
        if shown != nil {
            Button("Hide recovery key") { self.shown = nil }
                .accessibilityIdentifier("privacy.hideRecovery")
        } else {
            Button("Show recovery key") { Task { await reveal(reason: PrivacyCopy.showReason) { shown = $0 } } }
                .accessibilityIdentifier("privacy.showRecovery")
        }
    }

    /// The sheet hangs on its button: on a Section it isn't presented on iPhone.
    private var saveButton: some View {
        Button("Save a recovery key…") { Task { await reveal(reason: PrivacyCopy.saveReason) { saving = $0 } } }
            .accessibilityIdentifier("privacy.saveRecovery")
            .sheet(item: Binding(get: { saving.map(RecoveryKeyItem.init) }, set: { saving = $0?.key })) { item in
                SaveRecoveryKeySheet(key: item.key) { await markSaved() }
                    .onDisappear {
                        guard strictWhenSaved else { return }
                        strictWhenSaved = false
                        if crypto.recoveryKeySaved { Task { await change(to: .strict, confirmed: true) } }
                    }
            }
    }

    // MARK: Where your key is kept

    private var keySection: some View {
        Section {
            safety
            if crypto.serverCopy {
                keyRow(KeyCopyWords.copyTitle, KeyCopyWords.copyDetail, symbol: "person.badge.key", id: "privacy.serverCopy")
            }
            keyRow(PrivacyCopy.thisDevice, crypto.backedUp ? PrivacyCopy.keptInKeychain : PrivacyCopy.keptHere,
                   symbol: InstallID.platform == "macos" ? "laptopcomputer" : "iphone", id: "privacy.thisDevice")
            if crypto.backedUp || devices.others.contains(where: { $0.backedUp && !$0.removing && $0.isRecent() }) {
                keyRow(PrivacyCopy.keychainTitle, PrivacyCopy.keychainDetail, symbol: "icloud", id: "privacy.keychain")
            }
            ForEach(devices.others) { d in
                keyRow(d.name, d.detail(), symbol: d.symbol, id: "privacy.device") {
                    if d.canRemove {
                        // The question hangs on the button that asked it.
                        Button("Remove\u{2026}", role: .destructive) { removing = d }
                            .accessibilityIdentifier("privacy.removeDevice")
                            .confirmationDialog(PrivacyCopy.removeTitle(d.name),
                                                isPresented: Binding(get: { removing?.id == d.id }, set: { if !$0 { removing = nil } }),
                                                titleVisibility: .visible) {
                                Button("Remove", role: .destructive) { Task { await remove(d) } }
                                    .accessibilityIdentifier("privacy.confirmRemove")
                            } message: {
                                Text(PrivacyCopy.removeMessage + (crypto.serverCopy ? PrivacyCopy.removeNote : ""))
                            }
                    }
                }
            }
            // With a copy kept by Pinto Notes there's nothing to add: a new device signs in.
            if !crypto.serverCopy {
                // The sheet hangs on its button: on a Section it isn't presented.
                Button(PrivacyCopy.addDevice) { adding = true }
                    .accessibilityIdentifier("privacy.addDevice")
                    .disabled(reach != .online)
                    .sheet(isPresented: $adding) {
                        AddDeviceSheet(crypto: crypto, server: addDeviceServer)
                            .onDisappear { Task { await devices.refresh(crypto) } }
                    }
            }
        } header: {
            Text(PrivacyCopy.keyHeader)
        } footer: {
            Text(PrivacyCopy.keyFooter(serverCopy: crypto.serverCopy))
        }
    }

    // MARK: Advanced protection

    /// On: only the person's devices hold the key, as before Pinto Notes kept copies. Off: Pinto
    /// Notes keeps a copy, and signing in opens the notes on a new device. An account that hasn't
    /// chosen has no copy, so its switch is on. Either way is asked once more before it's done.
    private var protectionSection: some View {
        let strict = crypto.protection != .standard
        return Section {
            Toggle(isOn: Binding(get: { strict }, set: { turning = $0 ? .strict : .standard; asksTurn = true })) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(KeyCopyWords.strictTitle)
                    Text(KeyCopyWords.strictSubtitle)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
                // Off and held by a password reset: it can't be turned on yet, and the footer says from when.
                .disabled(changing || reach != .online || (!strict && (crypto.strictPausedUntil ?? .distantPast) > .now))
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
        } footer: {
            Text((strict ? KeyCopyWords.strictFooterOn : KeyCopyWords.strictFooterOff) + (strict ? "" : pausedNote.map { "\n\n" + $0 } ?? ""))
                .accessibilityIdentifier("privacy.strictFooter")
        }
    }

    /// `confirmed`: the device's owner was just asked (to show the recovery key), so isn't again.
    /// Under the switch while a password reset holds it: from when it can be turned on. Known from
    /// the key state before anyone tries, or from the server's refusal.
    private var pausedNote: String? {
        if let until = crypto.strictPausedUntil, until > .now { return KeyCopyWords.strictPaused(until: until) }
        return strictPausedNote
    }

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

    /// One line on top. Green only on evidence: another device seen lately, or a saved recovery
    /// key. A key that's only stored for iCloud Keychain gets a plain "can't confirm". A key on
    /// this device alone gets the warning.
    @ViewBuilder private var safety: some View {
        // Before the list has loaded, nothing is claimed either way.
        if devices.loaded || crypto.recoveryKeySaved || crypto.serverCopy {
            switch devices.safety(crypto) {
            case .safe(let n):
                keyRow(PrivacyCopy.safeTitle, crypto.serverCopy ? KeyCopyWords.safeBySignIn : PrivacyCopy.safeDetail(n),
                       symbol: "checkmark.circle.fill", tint: .green, id: "privacy.safe")
            case .unconfirmed:
                keyRow(PrivacyCopy.unconfirmedTitle, PrivacyCopy.unconfirmedDetail, symbol: "questionmark.circle", id: "privacy.unconfirmed")
                // Where to look, for those who want to: out of the way until asked for.
                if showsHowToCheck {
                    Text(PrivacyCopy.howToCheckDetail)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("privacy.howToCheckDetail")
                } else {
                    Button(PrivacyCopy.howToCheck) { showsHowToCheck = true }
                        .font(.footnote)
                        .accessibilityIdentifier("privacy.howToCheck")
                }
            case .onlyThisDevice:
                keyRow(PrivacyCopy.onlyTitle, PrivacyCopy.onlyDetail, symbol: "exclamationmark.circle.fill", tint: .orange, id: "privacy.onlyThisDevice")
            }
        }
    }

    /// "Optional" is only said while something else is known to open the notes.
    private var recoveryStatus: String {
        if crypto.recoveryKeySaved { return "Saved" }
        if case .safe = devices.safety(crypto) { return "Optional" }
        return "Not saved"
    }

    private func keyRow(_ title: String, _ detail: String, symbol: String, tint: Color = .secondary, id: String) -> some View {
        keyRow(title, detail, symbol: symbol, tint: tint, id: id) { EmptyView() }
    }

    private func keyRow(_ title: String, _ detail: String, symbol: String, tint: Color = .secondary, id: String,
                        @ViewBuilder trailing: () -> some View) -> some View {
        // At the largest text sizes the glyph sits above the words and the action below them.
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 6)) : AnyLayout(HStackLayout(spacing: 12))
        return layout {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(tint)
                .frame(minWidth: 28)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                Text(detail).font(.footnote).foregroundStyle(.secondary)
            }
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityElement(children: .combine)
            if !typeSize.isAccessibilitySize { Spacer(minLength: 8) }
            trailing()
        }
        // A container, so the button in it keeps its own identifier.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(id)
    }

    private func remove(_ d: KeyDevice) async {
        problem = nil
        guard await DeviceOwner.authenticate(reason: "remove \(d.name)") else { return }
        do { try await devices.remove(d, crypto: crypto) } catch { problem = error.localizedDescription }
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
