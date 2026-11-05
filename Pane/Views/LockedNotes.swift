import SwiftData
import SwiftUI

/// A locked note while it's locked, in place of the editor, as Notes shows it: a large, quiet
/// lock, "This note is locked.", the notes password, and Face ID or Touch ID where this device
/// has it. The field and the button are the sign-in card's (SignInView.field), so the app asks
/// for a password one way everywhere. After a wrong password the hint shows under the field, as
/// in Notes. Unlocking opens every locked note, and this note's text takes the page's place.
struct LockedNoteView: View {
    let note: Note
    @State private var password = ""
    @State private var problem: String?
    @State private var wrongTries = 0
    @State private var working = false
    @State private var focused = false
    #if os(iOS)
    /// The heading and the lock grow with the person's text size.
    @ScaledMetric(relativeTo: .title2) private var headingSize = Metrics.heading
    @ScaledMetric(relativeTo: .largeTitle) private var lockSize = Metrics.lock
    #else
    private let headingSize = Metrics.heading
    private let lockSize = Metrics.lock
    #endif
    private var vault: NoteVault { .shared }

    /// The page's measures: one display line (DESIGN.md, Type), the 4 pt grid, the form's sizes.
    enum Metrics {
        #if os(macOS)
        /// The column the words, the field and the buttons share.
        static let column: CGFloat = 280
        /// The lock's point size: large and light, as Notes draws it.
        static let lock: CGFloat = 56
        static let heading: CGFloat = 22
        static let words = Font.system(size: 13)
        #else
        static let column: CGFloat = 340
        static let lock: CGFloat = 60
        static let heading: CGFloat = 24
        static let words = Font.body
        #endif
        /// Light: the lock is the page's picture, not something to press. Its glyph is solid; only
        /// its colour is a lighter step of the muted text, on the page's own ground.
        static var lockInk: Color { Color.muted.opacity(0.4) }
        static let field = RoundedRectangle(cornerRadius: SignInView.Row.radius, style: .continuous)
    }

    /// Sealed with a password from before it was changed on another device.
    private var earlier: Bool { vault.needsEarlierPassword(note) }

    /// The words under the heading.
    static func explanation(earlier: Bool) -> String {
        earlier ? "It was locked with an earlier notes password. Enter that password to view it."
            : "Enter your notes password to view this note."
    }

    /// The Face ID, Touch ID or Optic ID glyph.
    static func biometrySymbol(_ name: String) -> String {
        switch name {
        case "Face ID": "faceid"
        case "Optic ID": "opticid"
        default: "touchid"
        }
    }

    var body: some View {
        container
            .task(id: note.id) {
                // A password set (or changed) on another device.
                await vault.refresh()
                // Just locked by hand: stay locked, and quiet, until you ask.
                if vault.takeLockedByHand() { return }
                if !earlier, !(await biometrics()) { focused = true }
            }
    }

    @ViewBuilder private var container: some View {
        #if os(macOS)
        page.frame(maxWidth: .infinity, maxHeight: .infinity)
        #else
        // Centred in the room the keyboard leaves, and scrolled when a large text size needs more.
        GeometryReader { room in
            ScrollView {
                page.frame(maxWidth: .infinity, minHeight: room.size.height)
            }
            .scrollBounceBehavior(.basedOnSize)
            .scrollDismissesKeyboard(.interactively)
        }
        #endif
    }

    private var page: some View {
        VStack(spacing: 0) {
            Image(systemName: "lock.fill")
                // It grows with the text size, but never past half as big again.
                .font(.system(size: min(lockSize, Metrics.lock * 1.5), weight: .regular))
                .foregroundStyle(Metrics.lockInk)
                .accessibilityHidden(true)
                .accessibilityIdentifier("lock.art")
            Text("This note is locked.")
                .font(.display(headingSize))
                .tracking(Palette.tracking(headingSize))
                .foregroundStyle(Color.ink)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("lock.heading")
                // Close under the lock, one group with it; the field starts the next.
                .padding(.top, 16)
            Text(Self.explanation(earlier: earlier))
                .font(Metrics.words)
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("lock.explanation")
                .padding(.top, 8)
            field
                .padding(.top, 24)
            if let problem {
                Text(problem)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("lock.problem")
                    .padding(.top, 8)
            }
            if wrongTries > 0, !earlier, let hint = vault.settings?.hint {
                Text("Hint: \(hint)")
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("lock.hint")
                    .padding(.top, 4)
            }
            Button(action: submit) { Text("View note") }
                .buttonStyle(.amberProminent(.form, wide: true))
                .amberBusy(working)
                .disabled(password.isEmpty || working)
                .accessibilityIdentifier("lock.view")
                .padding(.top, 12)
            if !earlier, let name = vault.biometryName {
                Button { Task { await biometrics() } } label: {
                    Label("Use \(name)", systemImage: Self.biometrySymbol(name))
                }
                .buttonStyle(.quiet)
                .accessibilityIdentifier("lock.biometrics")
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: Metrics.column)
        .padding(.horizontal, 24)
        .padding(.vertical, 32)
        .animation(.easeOut(duration: 0.15), value: wrongTries)
    }

    /// The sign-in card's field: its height, corners, border and padding, and the amber border
    /// while it's being typed in. The eye inside it shows the password.
    private var field: some View {
        PasswordField("Password", text: $password, id: "lock.password", focused: $focused)
            .onSubmit(submit)
            .textFieldStyle(.plain)
            #if os(iOS)
            .submitLabel(.go)
            #endif
            .font(.system(size: SignInView.Row.text))
            .padding(.leading, 12)
            .padding(.trailing, 6)
            .frame(height: SignInView.Row.height)
            .background(Color(Palette.field), in: Metrics.field)
            .overlay(Metrics.field.strokeBorder(focused ? Color(Palette.amber) : Color(Palette.fieldHairline), lineWidth: focused ? 2 : 1))
            .animation(.easeOut(duration: 0.12), value: focused)
    }

    @discardableResult
    private func biometrics() async -> Bool {
        guard vault.biometryName != nil, !vault.isUnlocked else { return false }
        return await vault.unlockWithBiometrics(reason: "Unlock your locked notes")
    }

    private func submit() {
        guard !password.isEmpty, !working else { return }
        working = true
        let typed = password
        Task { @MainActor in
            defer { working = false }
            do {
                if earlier { try await vault.openEarlier(note, password: typed) } else { try await vault.unlock(password: typed) }
                password = ""
                problem = nil
            } catch {
                wrongTries += 1
                password = ""
                let said = (error as? LocalizedError)?.errorDescription ?? "That password is incorrect."
                problem = said
                AccessibilityNotification.Announcement(said).post()
                focused = true
            }
        }
    }
}

/// The first time a note is locked: one notes password (with a hint) for every locked note.
struct NotesPasswordSetupSheet: View {
    let onDone: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var password = ""
    @State private var verify = ""
    @State private var hint = ""
    @State private var useBiometrics = NoteVault.shared.usesBiometrics
    @State private var working = false
    @State private var problem: String?
    private var vault: NoteVault { .shared }

    private var ready: Bool { !password.isEmpty && password == verify && !working }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    PasswordField("Password", text: $password, kind: .new, id: "setup.password")
                    PasswordField("Verify", text: $verify, kind: .new, id: "setup.verify")
                    TextField("Hint (recommended)", text: $hint)
                        .accessibilityIdentifier("setup.hint")
                } header: {
                    Text("Create a password for your locked notes")
                } footer: {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(LockedNotesCopy.setupLine)
                        Text("If you forget this password, your locked notes can't be recovered, not even by us.")
                            .fontWeight(.semibold)
                        Text("Locking a note also removes its earlier versions from version history.")
                    }
                    .foregroundStyle(Color.muted)
                }
                if let name = NoteVault.shared.keyStore.biometryName {
                    Section { Toggle("Use \(name)", isOn: $useBiometrics) }
                }
                if password != verify, !verify.isEmpty {
                    Section { Text("The passwords don't match.").foregroundStyle(.red) }
                } else if let problem {
                    Section { Text(problem).foregroundStyle(.red) }
                }
            }
            .formStyle(.grouped)
            .navigationTitle("Set Password")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if working { ProgressView().controlSize(.small) } else {
                        Button("Done", action: done).disabled(!ready).accessibilityIdentifier("setup.done")
                    }
                }
            }
        }
        #if os(macOS)
        .frame(width: 440, height: 420)
        #endif
    }

    private func done() {
        guard ready else { return }
        working = true
        Task { @MainActor in
            defer { working = false }
            do {
                vault.usesBiometrics = useBiometrics
                try await vault.setUp(password: password, hint: hint)
                dismiss()
                onDone()
            } catch {
                problem = (error as? LocalizedError)?.errorDescription ?? "Couldn't set the password. Try again."
            }
        }
    }
}

/// Asks for the notes password before something that needs it (locking a note, for one).
struct NotesPasswordPrompt: View {
    let message: String
    let onUnlocked: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var password = ""
    @State private var problem: String?
    @State private var wrongTries = 0
    @State private var working = false
    private var vault: NoteVault { .shared }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    PasswordField("Password", text: $password, id: "prompt.password")
                        .onSubmit(submit)
                } footer: {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(message)
                        if wrongTries > 0, let hint = vault.settings?.hint { Text("Hint: \(hint)") }
                    }
                    .foregroundStyle(Color.muted)
                }
                if let problem { Section { Text(problem).foregroundStyle(.red) } }
            }
            .formStyle(.grouped)
            .navigationTitle("Enter Password")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if working { ProgressView().controlSize(.small) } else {
                        Button("OK", action: submit).disabled(password.isEmpty).accessibilityIdentifier("prompt.ok")
                    }
                }
            }
        }
        #if os(macOS)
        .frame(width: 400, height: 240)
        #endif
        .task {
            await vault.refresh()
            if await vault.unlockWithBiometrics(reason: message) { finish() }
        }
    }

    private func submit() {
        guard !password.isEmpty, !working else { return }
        working = true
        let typed = password
        Task { @MainActor in
            defer { working = false }
            do {
                try await vault.unlock(password: typed)
                finish()
            } catch {
                wrongTries += 1
                password = ""
                problem = (error as? LocalizedError)?.errorDescription ?? "That password is incorrect."
            }
        }
    }

    private func finish() {
        dismiss()
        onUnlocked()
    }
}

/// Settings › Locked Notes › Change Password: every locked note is encrypted again.
struct ChangeNotesPasswordSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    let sync: SyncEngine?
    @State private var old = ""
    @State private var new = ""
    @State private var verify = ""
    @State private var hint = ""
    @State private var working = false
    @State private var problem: String?
    private var vault: NoteVault { .shared }

    private var ready: Bool { !old.isEmpty && !new.isEmpty && new == verify && !working }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    PasswordField("Old Password", text: $old, id: "change.old")
                } footer: {
                    if let hint = vault.settings?.hint { Text("Hint: \(hint)").foregroundStyle(Color.muted) }
                }
                Section {
                    PasswordField("New Password", text: $new, kind: .new, id: "change.new")
                    PasswordField("Verify", text: $verify, kind: .new, id: "change.verify")
                    TextField("Hint (recommended)", text: $hint)
                } footer: {
                    Text("Your locked notes are encrypted again with the new password, on all your devices, and their earlier versions are removed from version history. If you forget it, they can't be recovered, not even by us.")
                        .foregroundStyle(Color.muted)
                }
                if new != verify, !verify.isEmpty {
                    Section { Text("The new passwords don't match.").foregroundStyle(.red) }
                } else if let problem {
                    Section { Text(problem).foregroundStyle(.red) }
                }
            }
            .formStyle(.grouped)
            .navigationTitle("Change Password")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if working { ProgressView().controlSize(.small) } else {
                        Button("Done", action: done).disabled(!ready)
                    }
                }
            }
        }
        #if os(macOS)
        .frame(width: 440, height: 400)
        #endif
    }

    private func done() {
        guard ready else { return }
        working = true
        Task { @MainActor in
            defer { working = false }
            do {
                // The latest of every note first: the change fails if one moved on meanwhile.
                await sync?.sync()
                try await vault.changePassword(old: old, new: new, hint: hint, in: context)
                dismiss()
            } catch {
                problem = (error as? LocalizedError)?.errorDescription ?? "Couldn't change the password. Try again."
            }
        }
    }
}

/// What Settings › Security says about locked notes.
enum LockedNotesCopy {
    static let header = "Locked notes"
    static let footer = "Locked notes open with your notes password until the app goes to the background or a few minutes pass. \(aiLine) If you forget the password, locked notes can\u{2019}t be recovered."
    /// Setting up the password: what locking does, and what an AI sees, as Settings says it
    /// (persona council round 3: this said an AI sees the title, Settings and the server don't).
    static let setupLine = "One password locks all your notes, on all your devices. A locked note is encrypted on your device before it syncs, so nobody else can read it, not even us. Its title stays visible to you in your notes. \(aiLine)"
    /// What a connected AI sees of a locked note.
    static let aiLine = "An AI sees that a locked note exists, not its title or text. What an AI already read stays with that AI."
    /// Before any note is locked: what an AI sees of one, and where to lock one (PrivacyCopy.lockedLine).
    static let howTo = PrivacyCopy.lockedLine
}

/// Settings: the notes password, once there is one; before that, how to lock a note.
struct LockedNotesSection: View {
    let sync: SyncEngine?
    @State private var changing = false
    private var vault: NoteVault { .shared }

    /// What the section shows: the password's controls once there is one, before that how to lock a note.
    enum Shown { case controls, howTo }
    static func shown(setUp: Bool) -> Shown { setUp ? .controls : .howTo }

    var body: some View {
        if Self.shown(setUp: vault.isSetUp) == .controls {
            Section {
                Button("Change Password…") { changing = true }
                    .accessibilityIdentifier("settings.changeNotesPassword")
                if let name = vault.keyStore.biometryName {
                    Toggle("Use \(name)", isOn: Binding(get: { vault.usesBiometrics }, set: { vault.usesBiometrics = $0 }))
                        #if os(macOS)
                        // Settings' switches are in the brand's brown, as on General.
                        .tint(Color(Palette.switchOn))
                        #endif
                        .accessibilityIdentifier("settings.notesBiometrics")
                }
                if vault.isUnlocked {
                    Button("Lock Now") { vault.lockNowByHand() }
                        .accessibilityIdentifier("settings.lockNow")
                }
            } header: {
                Text(LockedNotesCopy.header)
            } footer: {
                Text(LockedNotesCopy.footer)
                    .foregroundStyle(Color.muted)
            }
            .sheet(isPresented: $changing) { ChangeNotesPasswordSheet(sync: sync) }
        } else {
            Section {
                LockedNotesHowTo()
            }
        }
    }
}

/// Before there's a notes password: a lock, "Locked notes", and what an AI sees of one.
struct LockedNotesHowTo: View {
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "lock.fill")
                #if os(iOS)
                .font(.title3).frame(minWidth: 31, minHeight: 31)
                #else
                .frame(width: 20)
                #endif
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(LockedNotesCopy.header)
                Text(LockedNotesCopy.howTo)
                    #if os(iOS)
                    .font(.subheadline)
                    #else
                    .font(.callout)
                    #endif
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("settings.lockedNotesHowTo")
    }
}

#if os(macOS)
/// The notes password on the Mac's Privacy and security page, once there is one: Change
/// Password…, Lock Now while notes are open, and Touch ID. How locking works is in How it works.
struct LockedNotesPassword: View {
    let sync: SyncEngine?
    @State private var changing = false
    private var vault: NoteVault { .shared }

    var body: some View {
        SettingsLine(title: "Notes password", detail: "Opens your locked notes.") {
            Image(systemName: "lock.doc").font(.system(size: 14)).foregroundStyle(SettingsInk.icon).frame(width: 28)
        } trailing: {
            HStack(spacing: 6) {
                if vault.isUnlocked {
                    Button("Lock Now") { vault.lockNowByHand() }
                        .buttonStyle(.hoverText).foregroundStyle(SettingsInk.muted)
                        .accessibilityIdentifier("settings.lockNow")
                }
                Button("Change\u{2026}") { changing = true }
                    .buttonStyle(.settings)
                    .accessibilityLabel("Change Notes Password")
                    .accessibilityIdentifier("settings.changeNotesPassword")
            }
        }
        .sheet(isPresented: $changing) { ChangeNotesPasswordSheet(sync: sync) }
        if let name = vault.keyStore.biometryName {
            SettingsLine(title: "Use \(name) for locked notes") {
                Toggle("Use \(name)", isOn: Binding(get: { vault.usesBiometrics }, set: { vault.usesBiometrics = $0 }))
                    .settingsSwitch()
                    .accessibilityIdentifier("settings.notesBiometrics")
            }
        }
    }
}
#endif
