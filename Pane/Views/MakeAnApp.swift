import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// "Make it an app" (prototype; see NotePage): apps are made by the person's own AI, so this hands
/// their AI a ready prompt for this note, or, with no AI connected yet, leads to connecting one.
enum MakeAnApp {
    /// A note that would make a good app: a table, or a checklist of three items or more.
    static func looksLikeAnApp(_ body: String) -> Bool {
        let lines = body.components(separatedBy: "\n")
        return !NotePage.tables(in: lines).isEmpty || lines.filter { ListPrefix(line: $0)?.checkbox != nil }.count >= 3
    }

    /// What to ask for, from what the note holds, as the words after "an app: ". Nothing when the
    /// note holds neither a table nor a checklist.
    static func idea(for body: String) -> String? {
        let lines = body.components(separatedBy: "\n")
        if let t = NotePage.tables(in: lines).first {
            let names = t.columns.map { $0.name.lowercased() }
            if names.contains(where: { $0.contains("amount") || $0.contains("cost") || $0.contains("price") || $0 == "kr" }) {
                return "a budget with the total, spending by category, and a quick way to add an expense"
            }
            if names.contains("date") {
                return "a tracker with today's entry at the top, streaks, and a chart of the last weeks"
            }
            return "cards of this table that I can sort, filter and add to"
        }
        if lines.contains(where: { ListPrefix(line: $0)?.checkbox != nil }) {
            return "a checklist that shows what's left, groups the items, and lets me add and tick them"
        }
        return nil
    }

    static func prompt(title: String, body: String) -> String {
        "In Pinto Notes, make my note \u{201C}\(title)\u{201D} an app\(idea(for: body).map { ": \($0)" } ?? ""). Call get_page_guide, read the note, start the app with create_app, and keep what the note's table or checklist holds as the app's data."
    }

    // Notes the suggestion was shown on: once per note, never again.
    private static let shownKey = "makeAppChipShown"
    static func chipShown(_ id: UUID) -> Bool { (UserDefaults.standard.stringArray(forKey: shownKey) ?? []).contains(id.uuidString) }
    static func markChipShown(_ id: UUID) {
        var all = UserDefaults.standard.stringArray(forKey: shownKey) ?? []
        guard !all.contains(id.uuidString) else { return }
        all.append(id.uuidString)
        UserDefaults.standard.set(Array(all.suffix(500)), forKey: shownKey)
    }
}

/// The small suggestion on a note that looks like it could be an app. Shown once per note.
struct MakeAppChip: View {
    let open: () -> Void
    let dismiss: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Button(action: open) {
                Label("Make this an app", systemImage: NoteAppMark.symbol)
                    .font(.system(size: AIReceipt.text, weight: .semibold))
                    .foregroundStyle(Color.amberInk)
            }
            .buttonStyle(.hoverText)
            .accessibilityIdentifier("makeApp.chip")
            Divider().frame(height: 14)
            Button(action: dismiss) {
                // The glyph alone took no taps on iPhone (they went through to the note): the
                // target is the chip's whole end, as tall as the chip.
                Image(systemName: "xmark").font(.system(size: AIReceipt.text - 2, weight: .semibold)).foregroundStyle(Color.amberInk.opacity(0.7))
                    .frame(width: 30, height: AIReceipt.height)
                    .contentShape(.rect)
            }
            .buttonStyle(.hoverIcon(cornerRadius: 9))
            .accessibilityLabel("Not now")
            .accessibilityIdentifier("makeApp.chip.dismiss")
        }
        .padding(.leading, 14)
        .padding(.trailing, 4)
        .frame(height: AIReceipt.height)
        .background(Color.amberSoft, in: .capsule)
        .overlay(Capsule().strokeBorder(Color.amberInk.opacity(0.22), lineWidth: 0.5))
        .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.12), radius: 12, y: 6)
    }
}

/// Make It an App: what an app is, with a picture of one, and the one next step: the prompt to
/// give your AI, or connecting one first. A sheet the size of what it says, on the app's own
/// ground (as "How did you hear about Pinto Notes?" is).
struct MakeAppSheet: View {
    let title: String
    let body_: String
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.dismiss) private var dismiss
    @State private var connected: Bool?
    @State private var connecting = false
    @State private var copied = false
    @State private var height: CGFloat = 460

    /// Words first, or the picture first (compared side by side on 2026-10-11; `-makeAppLayout
    /// pictureFirst` in development builds shows the other).
    enum Layout: String { case stacked, pictureFirst }
    #if DEBUG || QA
    nonisolated(unsafe) static var layout: Layout = Capture.argument("-makeAppLayout").flatMap(Layout.init(rawValue:)) ?? .stacked
    /// Pictures of each state without an account (`-makeAppState connected | none`).
    nonisolated(unsafe) static var stateForPictures: Bool? = Capture.argument("-makeAppState").map { $0 == "connected" }
    #else
    static let layout: Layout = .stacked
    static let stateForPictures: Bool? = nil
    #endif

    private var prompt: String { MakeAnApp.prompt(title: title, body: body_) }

    var body: some View {
        content
            .padding(.horizontal, Metrics.padding)
            .padding(.top, Metrics.top)
            .padding(.bottom, Metrics.padding)
            .overlay(alignment: .topTrailing) { close.padding(Metrics.closeInset) }
            .background(Color(Palette.sheetGround))
            #if os(macOS)
            .frame(width: 420)
            #else
            .fixedSize(horizontal: false, vertical: true)
            .onGeometryChange(for: CGFloat.self, of: \.size.height) { height = $0 }
            .presentationDetents([.height(height)])
            .presentationDragIndicator(.hidden)
            #endif
            .tint(Color(PColor.paneAccent))
            .task { await check() }
            .sheet(isPresented: $connecting, onDismiss: { Task { await check() } }) {
                if let backend { SettingsView(backend: backend, sync: sync) }
            }
    }

    @ViewBuilder private var content: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            if Self.layout == .pictureFirst { picture.padding(.top, Metrics.closeSize + 10); words; step } else { words; picture; step }
        }
    }

    /// A real app in a note: the habit tracker's first card, as it looks in this appearance.
    private var picture: some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        return Image("MakeAppHabits").resizable().scaledToFit()
            .frame(maxWidth: .infinity).clipShape(shape)
            .overlay(shape.strokeBorder(Color.line, lineWidth: 1))
            .accessibilityLabel("A habit tracker app in a note")
    }

    private var words: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Make this note an app")
                .font(Metrics.title)
                .tracking(-0.3)
                .foregroundStyle(Color.ink)
                .accessibilityAddTraits(.isHeader)
                .padding(.trailing, Self.layout == .pictureFirst ? 0 : Metrics.closeSize + 8)
            Text("A note can be a small app, like this habit tracker. Your AI builds it from what the note holds, and the note stays yours to undo.")
                .font(Metrics.line)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// The one next step: the prompt to copy when an AI is connected, connecting one when none is.
    @ViewBuilder private var step: some View {
        switch connected {
        case true?:
            VStack(alignment: .leading, spacing: Metrics.stepGap) {
                Text(prompt)
                    .font(Metrics.prompt)
                    .foregroundStyle(Color.ink)
                    .textSelection(.enabled)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.amberSoft, in: .rect(cornerRadius: Metrics.radius, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                    .accessibilityIdentifier("makeApp.prompt")
                Button { copy() } label: {
                    Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc").frame(maxWidth: .infinity)
                }
                .buttonStyle(.amberProminent(height: Metrics.button, cornerRadius: Metrics.radius))
                .accessibilityIdentifier("makeApp.copy")
                Text("Paste it into your AI. The app shows up on this note.")
                    .font(Metrics.hint)
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        case false?:
            VStack(alignment: .leading, spacing: Metrics.stepGap) {
                Button { connecting = true } label: { Text("Connect an AI").frame(maxWidth: .infinity) }
                    .buttonStyle(.amberProminent(height: Metrics.button, cornerRadius: Metrics.radius))
                    .accessibilityIdentifier("makeApp.connect")
                Text("It takes about 2 minutes. Then come back here for the words to give it.")
                    .font(Metrics.hint)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .multilineTextAlignment(.center)
            }
        case nil:
            // Finding out whether an AI is connected: the button's own height, so nothing jumps.
            ProgressView().controlSize(.small).frame(maxWidth: .infinity).frame(height: Metrics.button)
        }
    }

    private var close: some View {
        Button { dismiss() } label: {
            Image(systemName: "xmark")
                .font(.system(size: Metrics.closeGlyph, weight: .semibold))
                .foregroundStyle(Color.muted)
                .frame(width: Metrics.closeSize, height: Metrics.closeSize)
                .background(Color(Palette.sheetGround).opacity(0.9), in: .circle)
                .overlay(Circle().strokeBorder(Color.line, lineWidth: 1))
                .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.cancelAction)
        .accessibilityLabel("Close")
        .accessibilityIdentifier("makeApp.close")
    }

    /// Mac: the system's sheet sizes. iPhone: the list's own type sizes.
    private enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 20, weight: .bold)
        static let line = Font.system(size: 13)
        static let prompt = Font.system(size: 13)
        static let hint = Font.system(size: 12)
        static let padding: CGFloat = 24
        static let top: CGFloat = 24
        static let gap: CGFloat = 16
        static let stepGap: CGFloat = 10
        static let radius: CGFloat = 10
        static let button: CGFloat = 34
        static let closeSize: CGFloat = 22
        static let closeGlyph: CGFloat = 9
        static let closeInset: CGFloat = 22
        #else
        static let title = Font.title2.weight(.bold)
        static let line = Font.subheadline
        static let prompt = Font.callout
        static let hint = Font.footnote
        static let padding: CGFloat = 24
        static let top: CGFloat = 24
        static let gap: CGFloat = 18
        static let stepGap: CGFloat = 12
        static let radius: CGFloat = 14
        static let button: CGFloat = 50
        static let closeSize: CGFloat = 30
        static let closeGlyph: CGFloat = 12
        static let closeInset: CGFloat = 20
        #endif
    }

    /// Whether any AI is connected to this account.
    private func check() async {
        if let known = Self.stateForPictures { connected = known; return }
        if ProcessInfo.processInfo.arguments.contains("-aiConnected") { connected = true; return }
        guard let client = backend?.client else { connected = false; return }
        let rows: [Connection] = (try? await client.from("mcp_tokens").select().execute().value) ?? []
        connected = rows.contains { $0.revoked_at == nil }
    }

    private func copy() {
        #if os(iOS)
        UIPasteboard.general.string = prompt
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(prompt, forType: .string)
        #endif
        withAnimation(.smooth) { copied = true }
    }
}

// MARK: App settings

/// App Info: what only Amber Notes can do for a note's app. An app's own settings are the app's
/// (it draws them, and keeps them in its data); this holds the internet (which addresses it may
/// reach, what it sent, the libraries it downloaded), Previous App and Remove App.
struct AppInfoSheet: View {
    let noteID: UUID
    let html: String
    var hasPrevious = false
    var previous: () -> Void = {}
    var remove: () -> Void = {}
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if let draft = NotePageStore.shared.drafts[noteID] {
                    Section {
                        Label("\(draft.by) is working on a new version", systemImage: "hammer")
                        Text("It didn't pass its checks yet, so this one keeps running. \(draft.problems)")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }
                internet
                Section {
                    if hasPrevious {
                        Button("Previous App") { previous(); dismiss() }
                            .accessibilityIdentifier("appInfo.previous")
                    }
                    Button("Remove App", role: .destructive) { remove(); dismiss() }
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("appInfo.remove")
                } footer: {
                    Text(hasPrevious ? "Removing the app keeps the note as it is. Previous App brings the one before back." : "Removing the app keeps the note as it is.")
                }
            }
            .formStyle(.grouped)
            .navigationTitle("App Info")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.accessibilityIdentifier("appInfo.done")
                }
            }
        }
        #if os(macOS)
        .frame(minWidth: 420, minHeight: 320)
        #endif
    }

    /// Which addresses the app may reach, and its last requests (keys hidden).
    @ViewBuilder
    private var internet: some View {
        let log = NotePageNetLog.shared
        let hosts = (log.approved[noteID] ?? []).sorted()
        let entries = Array((log.entries[noteID] ?? []).suffix(8).reversed())
        let libs = NotePageLibraries.downloaded(for: html)
        Section {
            if hosts.isEmpty && entries.isEmpty && libs.isEmpty {
                Text("This app hasn't used the internet.").foregroundStyle(.secondary)
            }
            ForEach(libs, id: \.self) { l in Label("Downloaded library: \(l)", systemImage: "shippingbox") }
            ForEach(hosts, id: \.self) { h in Label(h, systemImage: "checkmark.circle") }
            ForEach(entries) { e in
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text(e.method).font(.caption.monospaced().weight(.semibold))
                        Text(e.status.map(String.init) ?? e.error ?? "").font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text(e.at, style: .time).font(.caption).foregroundStyle(.secondary)
                    }
                    Text(e.url).font(.caption.monospaced()).lineLimit(3).textSelection(.enabled)
                    if e.carriesNoteText {
                        Label("Includes text from this note", systemImage: "text.quote").font(.caption.weight(.semibold)).foregroundStyle(Color.amberInk)
                    }
                }
            }
            if !hosts.isEmpty {
                Button("Forget Allowed Addresses", role: .destructive) { log.forget(noteID) }
            }
        } header: {
            Text("Internet")
        } footer: {
            Text("The app asks before it reaches a new address. Everything it sends is listed here.")
        }
    }

}

import Supabase

/// Settings › Apps in Notes: whether an AI may preview a note's app with the note's real data
/// (pages-ai-tooling's preview_app; profiles.app_previews_real). Off by default: previews use made-up
/// data shaped like the note. Hidden on a backend without the setting.
struct AppPreviewSection: View {
    let client: SupabaseClient
    @State private var on = false
    @State private var available = false
    @State private var saving = false

    private struct Row: Codable { var user_id: UUID?; var app_previews_real: Bool }

    var body: some View {
        Group {
            if available {
                Section {
                    Toggle("Let AIs preview apps with my notes", isOn: Binding(get: { on }, set: { v in on = v; Task { await save(v) } }))
                        .disabled(saving)
                        .accessibilityIdentifier("settings.appPreviewsReal")
                } header: {
                    Text("Apps in Notes")
                } footer: {
                    Text("When your AI checks an app it made, it sees a picture of it. With this off, the picture uses made-up data shaped like your note. With it on, it shows your note's real data, decrypted for that check only.")
                }
            }
        }
        .task { await load() }
    }

    private func load() async {
        guard let user = client.auth.currentUser?.id else { return }
        let rows: [Row]? = try? await client.from("profiles").select("app_previews_real").eq("user_id", value: user).execute().value
        guard let rows else { return }
        on = rows.first?.app_previews_real ?? false
        available = true
    }

    private func save(_ v: Bool) async {
        guard let user = client.auth.currentUser?.id else { return }
        saving = true
        defer { saving = false }
        do {
            try await client.from("profiles").upsert(Row(user_id: user, app_previews_real: v), onConflict: "user_id").execute()
        } catch {
            on = !v
        }
    }
}
