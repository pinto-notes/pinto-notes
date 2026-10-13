import SwiftUI

/// Asked once of an account from before Pinto Notes kept copies of keys (KeyCopy), on a device
/// that has its key, before any copy is made: signing in can open your notes from now on, or your
/// key stays on your devices only (Advanced protection). Nothing is stored until one is chosen. Laid out like the share
/// ask: a short sheet on iPhone, a small one on the Mac.
struct KeyProtectionAsk: View {
    let crypto: AccountCrypto
    var devices: KeyDevices = .shared
    @State private var working = false
    @State private var problem: String?
    /// Strict was refused: nothing else can open the notes yet, so a recovery key is saved first.
    @State private var needsRecoveryKey = false
    @State private var saving: String?
    #if os(iOS)
    @State private var height: CGFloat = 520
    #endif

    private typealias Words = KeyCopyWords

    var body: some View {
        VStack(spacing: 18) {
            AppMark(size: 56)
            VStack(spacing: 8) {
                Text(Words.askTitle)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("keyAsk")
                Text(needsRecoveryKey ? Words.needsRecoveryKey : Words.askMessage)
                    .font(.subheadline)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("keyAsk.message")
            }
            if let problem {
                Text(problem)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("keyAsk.problem")
            }
            VStack(spacing: 10) {
                if needsRecoveryKey {
                    button(SignOutCopy.saveRecoveryKey, id: "keyAsk.saveRecovery", prominent: true) { await saveRecoveryKey() }
                    button("Back", id: "keyAsk.back") { needsRecoveryKey = false; problem = nil }
                } else {
                    button(Words.askContinue, id: "keyAsk.continue", prominent: true) { try await crypto.keepCopy() }
                    button(Words.askStrict, id: "keyAsk.strict") { try await keepOnDevices() }
                }
                // The two answers are the whole question. Only when one couldn't be sent (offline, the
                // server down) is there a way past it, so nobody is kept from their notes by a sheet.
                if problem != nil {
                    Button { crypto.askProtectionLater() } label: {
                        Text(Words.askNotNow)
                    }
                    .buttonStyle(.quiet)
                    .disabled(working)
                    .accessibilityIdentifier("keyAsk.later")
                }
            }
            .padding(.top, 4)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.top, 28)
        .padding(.bottom, 24)
        #if os(macOS)
        .frame(width: 400)
        #else
        .fixedSize(horizontal: false, vertical: true)
        .onGeometryChange(for: CGFloat.self, of: \.size.height) { height = $0 }
        .presentationDetents([.height(height)])
        .presentationDragIndicator(.hidden)
        #endif
        .interactiveDismissDisabled()
        .tint(Color(PColor.paneAccent))
        .sheet(item: Binding(get: { saving.map(SavedKey.init) }, set: { saving = $0?.key })) { item in
            SaveRecoveryKeySheet(key: item.key) { try? await crypto.markRecoveryKeySaved() }
                // Saved (printed, exported or copied): the choice that needed it goes through now.
                .onDisappear { if crypto.recoveryKeySaved { run { try await keepOnDevices() } } }
        }
    }

    private struct SavedKey: Identifiable {
        let key: String
        var id: String { key }
    }

    private func keepOnDevices() async throws {
        guard let device = devices.device else { throw KeyCopyError.offline }
        do {
            try await crypto.keepOnDevicesOnly(device: device)
        } catch KeyCopyError.needsRecoveryKey {
            needsRecoveryKey = true
        }
    }

    private func saveRecoveryKey() async {
        guard let key = crypto.recoveryKeyText else { return }
        switch await DeviceOwner.confirm(reason: PrivacyCopy.saveReason) {
        case .confirmed: saving = key
        case .cancelled: break
        case .failed: problem = PrivacyCopy.notConfirmed
        }
    }

    private func run(_ action: @escaping () async throws -> Void) {
        working = true
        problem = nil
        Task {
            do { try await action() } catch { problem = (error as? KeyCopyError).map(Words.error) ?? error.localizedDescription }
            working = false
        }
    }

    /// `prominent`: the primary button; the other answer is a secondary one.
    private func button(_ title: String, id: String, prominent: Bool = false, action: @escaping () async throws -> Void) -> some View {
        Group {
            if prominent {
                Button(title) { run(action) }.buttonStyle(.amberProminent(.form, wide: true))
            } else {
                Button(title) { run(action) }.buttonStyle(.secondary(.form, wide: true))
            }
        }
        .disabled(working)
        .accessibilityIdentifier(id)
    }
}
