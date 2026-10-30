import SwiftData
import SwiftUI
import Supabase

/// Settings → Delete Account…: removes the account and everything in it, on the server and on
/// this device. The App Store requires it for apps where you can create an account.
struct DeleteAccountButton: View {
    let backend: Backend
    @Environment(\.networkReach) private var reach
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var asking = false
    @State private var working = false
    @State private var error: String?

    var body: some View {
        Button(role: .destructive) { asking = true } label: {
            HStack(spacing: 8) {
                Text(working ? "Deleting Account…" : "Delete Account…").foregroundStyle(.red)
                if working { ProgressView().controlSize(.small) }
            }
        }
        .disabled(working || reach != .online)
        .accessibilityIdentifier("settings.deleteAccount")
        .confirmationDialog("Delete your Pinto Notes account?", isPresented: $asking, titleVisibility: .visible) {
            Button("Delete Account and All Notes", role: .destructive) { Task { await delete() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Every note, folder, file, earlier version, AI connection and share link is deleted from the cloud and from this device, with the key that opens them. This can't be undone. To keep a copy, export your notes first.")
        }
        if reach != .online, !working {
            Text(OfflineCopy.needsNetwork("delete your account"))
                .foregroundStyle(.secondary)
                .font(.callout)
        }
        if let error {
            Label(error, systemImage: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
                .font(.callout)
        }
    }

    private func delete() async {
        working = true
        error = nil
        defer { working = false }
        do {
            let account = backend.userID
            try await backend.deleteAccount()
            // The key to notes that no longer exist: gone from this device and iCloud Keychain.
            // Signing out keeps it; deleting the account doesn't.
            if let account { AccountCrypto.shared.forgetKey(account: account) }
            context.wipeLocalLibrary()
            // The server removed this device's push token with the account; stop registering here.
            PushRegistration.shared.accountDeleted()
            // Reports that were waiting to be sent under the account's identifier are dropped.
            Telemetry.shared.accountDeleted()
            // The welcome that follows says the account is deleted.
            WelcomeFlow.Farewell.accountDeleted()
            await backend.signOut()
            dismiss()
        } catch FunctionsError.httpError(_, let data) where Backend.deletePausedMessage(data) != nil {
            self.error = Backend.deletePausedMessage(data)
        } catch {
            self.error = "Couldn't delete your account. Check your connection and try again."
        }
    }
}

extension Backend {
    /// Deletes the signed-in account on the server (files first, then the login; the rest cascades).
    func deleteAccount() async throws {
        guard let client else { throw URLError(.userAuthenticationRequired) }
        try await client.functions.invoke("account", options: FunctionInvokeOptions(method: .delete))
    }

    /// The server's refusal for 72 hours after a password reset (supabase/functions/account/pause.ts),
    /// in words, or nil for any other answer.
    nonisolated static func deletePausedMessage(_ data: Data) -> String? {
        struct Reply: Decodable { let hint: String?; let until: String? }
        guard let reply = try? JSONDecoder().decode(Reply.self, from: data), reply.hint == "paused_after_reset" else { return nil }
        let base = "Deleting your account is paused for 72 hours after a password reset, to protect your notes."
        guard let until = reply.until.flatMap(pauseDate) else { return base + " Try again in 3 days." }
        return base + " Try again on \(until.formatted(date: .long, time: .shortened))."
    }

    /// `2026-10-05T14:30:00.000Z` or `2026-10-05T14:30:00Z`.
    nonisolated static func pauseDate(_ text: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: text) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: text)
    }
}

extension ModelContext {
    /// Forgets every note, folder and file on this device (after the account is gone).
    @MainActor func wipeLocalLibrary(files: URL? = nil) {
        // One by one (a batch delete refuses rows that other rows still point at), and through
        // `erase` so it's SwiftData's delete, not Library's trash(folder) that moves to Recently Deleted.
        func erase<T: PersistentModel>(_ type: T.Type) {
            for m in (try? fetch(FetchDescriptor<T>())) ?? [] { delete(m) }
        }
        erase(Attachment.self)
        erase(Note.self)
        erase(Folder.self)
        try? save()
        try? FileManager.default.removeItem(at: files ?? FileStore.root)
        AIEditStore.shared.forgetAll()
        NotePageStore.shared.forgetAll()
        NotePageDataStore.shared.forgetAll()
    }
}

/// Exporting your notes, wherever it starts (Settings, File › Export All Notes…, Go to Note): the
/// zip is made, the save panel asks where it goes, then what was saved is said.
@MainActor @Observable final class NoteExporter {
    var working = false
    var made: NoteExport.Result?
    var saving = false
    /// What the export did, or why it didn't, once it's over.
    var message: String?
    var failed = false
    /// The export was saved without some files: what the alert says.
    var leftOut: (title: String, message: String)?

    func export(_ context: ModelContext, sync: SyncEngine?) async {
        guard !working else { return }
        working = true
        message = nil
        failed = false
        defer { working = false }
        DebouncedSave.flushAll()
        do {
            made = try await NoteExport.make(context, sharing: CollabStore.shared?.exportSharing() ?? .init(), fetch: { a in await sync?.download(a) ?? false })
            saving = true
        } catch {
            message = "Couldn't export your notes: \(error.localizedDescription)"
            failed = true
        }
    }

    func saved(_ result: Result<URL, Error>) {
        switch result {
        case .success:
            message = made.map(NoteExport.summary)
            leftOut = made.flatMap(NoteExport.leftOut)
        case .failure(let e as CocoaError) where e.code == .userCancelled: message = nil
        case .failure:
            message = "Couldn't save the export. Try again."
            failed = true
        }
        made = nil
    }
}

extension View {
    /// The save panel and the alert an export shows.
    func noteExportPanels(_ exporter: NoteExporter) -> some View {
        @Bindable var exporter = exporter
        return fileMover(isPresented: $exporter.saving, file: exporter.made?.zip) { exporter.saved($0) }
            // The panel moves the finished zip where you choose, and its button said "Move": it sounded
            // like the notes would leave the app (newcomer audit, 2026-10-12).
            .fileDialogConfirmationLabel("Export")
            // Said so it can't be missed: an export that isn't whole.
            .alert(exporter.leftOut?.title ?? "", isPresented: Binding(get: { exporter.leftOut != nil }, set: { if !$0 { exporter.leftOut = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(exporter.leftOut?.message ?? "")
            }
    }
}

/// Export Your Notes…: every note as a markdown file in your folders, with its files, in one zip
/// you save or share. Made here from this device's library; the server can't read your notes.
struct ExportNotesButton: View {
    /// Fetches the files that aren't on this device. Handed in, not read from the environment:
    /// the Mac's Settings window is a scene of its own with no sync engine in its environment,
    /// so there nothing was fetched and those files were left out of the export.
    let sync: SyncEngine?
    @Environment(\.modelContext) private var context
    @State private var exporter = NoteExporter()

    var body: some View {
        Button {
            Task { await exporter.export(context, sync: sync) }
        } label: {
            HStack(spacing: 8) {
                Text(exporter.working ? "Exporting Your Notes…" : "Export Your Notes…")
                if exporter.working { ProgressView().controlSize(.small) }
            }
        }
        .disabled(exporter.working)
        .accessibilityIdentifier("settings.exportNotes")
        .noteExportPanels(exporter)
        if let message = exporter.message {
            Text(message).font(.callout).foregroundStyle(.secondary)
        }
    }
}

#if os(macOS)
/// File › Export All Notes… and its row in Go to Note: the export runs from the notes window, which
/// says it's working, then what it saved, over its foot.
struct ExportAllNotes: ViewModifier {
    @Environment(\.modelContext) private var context
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @State private var exporter = NoteExporter()

    func body(content: Content) -> some View {
        content
            .onReceive(NotificationCenter.default.publisher(for: .paneExportNotes)) { _ in
                Task { await exporter.export(context, sync: sync) }
            }
            .noteExportPanels(exporter)
            .overlay(alignment: .bottom) {
                Group {
                    if exporter.working {
                        Toast(text: "Exporting your notes…", kind: .working)
                    } else if let message = exporter.message, !exporter.saving {
                        Toast(text: message, kind: exporter.failed ? .failed : .done)
                            .task(id: message) {
                                try? await Task.sleep(for: .seconds(6))
                                if exporter.message == message { exporter.message = nil }
                            }
                    }
                }
                .padding(.bottom, 18)
                .accessibilityIdentifier("export.toast")
            }
            .animation(.easeOut(duration: 0.25), value: exporter.working)
            .animation(.easeOut(duration: 0.25), value: exporter.message)
    }
}

extension Notification.Name {
    /// File › Export All Notes…: the notes window in front exports.
    static let paneExportNotes = Notification.Name("pane.exportNotes")
}
#endif
