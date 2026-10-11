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

    /// What kind of app the note would make, from what it holds.
    enum Kind: Equatable { case budget, tracker, cards, checklist, plain }

    static func kind(for body: String) -> Kind {
        let lines = body.components(separatedBy: "\n")
        if let t = NotePage.tables(in: lines).first {
            let names = t.columns.map { $0.name.lowercased() }
            if names.contains(where: { $0.contains("amount") || $0.contains("cost") || $0.contains("price") || $0 == "kr" }) { return .budget }
            return names.contains("date") ? .tracker : .cards
        }
        return lines.contains(where: { ListPrefix(line: $0)?.checkbox != nil }) ? .checklist : .plain
    }

    /// What to ask for, as the words after "an app: ". Nothing when the note holds neither a table
    /// nor a checklist.
    static func idea(for body: String) -> String? {
        switch kind(for: body) {
        case .budget: "a budget with the total, spending by category, and a quick way to add an expense"
        case .tracker: "a tracker with today's entry at the top, streaks, and a chart of the last weeks"
        case .cards: "cards of this table that I can sort, filter and add to"
        case .checklist: "a checklist that shows what's left, groups the items, and lets me add and tick them"
        case .plain: nil
        }
    }

    /// The ways to hand the prompt to the AIs connected to this account: a chat that opens with
    /// the words in its box (ChatGPT, Claude), and, for anything else (Claude Code, Codex, another
    /// MCP client), the words to paste. Most recently used first.
    struct Ways: Equatable {
        var chats: [String] = []
        var paste: String?
        var isEmpty: Bool { chats.isEmpty && paste == nil }
    }

    static func ways(_ connections: [Connection]) -> Ways {
        var ways = Ways()
        let live = connections.filter { $0.revoked_at == nil }.sorted { ($0.last_used_at ?? $0.created_at) > ($1.last_used_at ?? $1.created_at) }
        for c in live {
            if let ai = c.mark, ["ChatGPT", "Claude"].contains(ai) { if !ways.chats.contains(ai) { ways.chats.append(ai) } } else if ways.paste == nil { ways.paste = c.mark ?? "your AI" }
        }
        return ways
    }

    /// The chat with the prompt typed in (WebConnectPlan.prefilled, the same link Try It uses).
    static func chat(_ ai: String, prompt: String) -> URL {
        WebConnectPlan.prefilled(ai == "ChatGPT" ? "https://chatgpt.com/" : "https://claude.ai/new", prompt)
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

/// Make It an App: one click hands the prompt to the person's AI, and the sheet then waits for the
/// app and closes itself when it is here (the note opens as the app). With no AI connected, one
/// button connects one and the sheet comes back ready. On the app's own ground, as tall as what
/// it says.
struct MakeAppSheet: View {
    let noteID: UUID
    let title: String
    let body_: String
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var ways: MakeAnApp.Ways?
    /// Handed to this AI (or pasted somewhere): waiting for the app.
    @State private var waitingFor: String?
    @State private var showWords = false
    @State private var connecting = false
    @State private var height: CGFloat = 320

    #if DEBUG || QA
    /// Pictures of each state without an account: `-makeAppState none | chatgpt | both | code | waiting`.
    nonisolated(unsafe) static var stateForPictures: String? = Capture.argument("-makeAppState")
    /// The small sketch of the note as an app, compared with and without (`-makeAppSketch NO`).
    nonisolated(unsafe) static var sketch = Capture.argument("-makeAppSketch") != "NO"
    #else
    static let stateForPictures: String? = nil
    static let sketch = true
    #endif

    private var prompt: String { MakeAnApp.prompt(title: title, body: body_) }

    var body: some View {
        VStack(alignment: .leading, spacing: Metrics.gap) {
            words
            if Self.sketch { MakeAppSketch(title: title, kind: MakeAnApp.kind(for: body_)) }
            step
        }
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
        // The app is here (made by the AI, arrived by sync): done. The note shows it.
        .onChange(of: NotePageStore.shared[noteID] != nil) { _, here in if here { dismiss() } }
        // While waiting, ask for changes every few seconds as well as hearing of them.
        .task(id: waitingFor) {
            guard waitingFor != nil else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(4))
                sync?.schedule()
            }
        }
        .sheet(isPresented: $connecting, onDismiss: { Task { await check() } }) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
    }

    private var words: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Make this note an app")
                .font(Metrics.title)
                .tracking(-0.3)
                .foregroundStyle(Color.ink)
                .accessibilityAddTraits(.isHeader)
                .padding(.trailing, Metrics.closeSize + 8)
            Text(ways?.isEmpty == true ? "An AI you connect builds it from what this note holds." : "Your AI builds it from what this note holds. You can undo it.")
                .font(Metrics.line)
                .foregroundStyle(Color.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// The one next step.
    @ViewBuilder private var step: some View {
        if let waitingFor {
            waiting(for: waitingFor)
        } else if let ways {
            if ways.isEmpty {
                Button { connecting = true } label: { Text("Connect an AI").frame(maxWidth: .infinity) }
                    .buttonStyle(.amberProminent(height: Metrics.button, cornerRadius: Metrics.radius))
                    .accessibilityIdentifier("makeApp.connect")
            } else {
                VStack(alignment: .leading, spacing: Metrics.stepGap) {
                    ForEach(Array(ways.chats.enumerated()), id: \.element) { i, ai in
                        if i == 0 {
                            Button { hand(to: ai) } label: { Text("Make it with \(ai)").frame(maxWidth: .infinity) }
                                .buttonStyle(.amberProminent(height: Metrics.button, cornerRadius: Metrics.radius))
                                .accessibilityIdentifier("makeApp.with.\(ai)")
                        } else {
                            Button { hand(to: ai) } label: { Text("Make it with \(ai)").frame(maxWidth: .infinity).frame(height: Metrics.button - 8) }
                                .buttonStyle(.bordered)
                                .accessibilityIdentifier("makeApp.with.\(ai)")
                        }
                    }
                    if let other = ways.paste {
                        if ways.chats.isEmpty || showWords {
                            wordsToPaste(for: other)
                        } else {
                            Button("Or copy the words for \(other)") { withAnimation(.smooth(duration: 0.2)) { showWords = true } }
                                .buttonStyle(.hoverLink)
                                .font(Metrics.hint)
                                .foregroundStyle(Color.muted)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .accessibilityIdentifier("makeApp.showWords")
                        }
                    }
                }
            }
        } else {
            // Finding out which AIs are connected: the button's own height, so nothing jumps.
            ProgressView().controlSize(.small).frame(maxWidth: .infinity).frame(height: Metrics.button)
        }
    }

    /// For an AI that has no chat to open (Claude Code, Codex, another MCP client): the words, and Copy.
    private func wordsToPaste(for ai: String) -> some View {
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
            Button { copy(); withAnimation(.smooth(duration: 0.25)) { waitingFor = ai } } label: {
                Label("Copy for \(ai)", systemImage: "doc.on.doc").frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent(height: Metrics.button, cornerRadius: Metrics.radius))
            .accessibilityIdentifier("makeApp.copy")
        }
    }

    /// Handed over: one calm line while the AI works. The sheet closes itself when the app is here.
    private func waiting(for ai: String) -> some View {
        let chat = ["ChatGPT", "Claude"].contains(ai)
        return VStack(spacing: 8) {
            HStack(spacing: 10) {
                ProgressView().controlSize(.small)
                Text("Waiting for \(ai) to build it…")
                    .font(Metrics.wait)
                    .foregroundStyle(Color.ink)
            }
            .frame(maxWidth: .infinity).frame(minHeight: Metrics.button)
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("makeApp.waiting")
            Text(chat ? "Send the message in \(ai). If its box is empty, paste: the words are copied." : "Paste the words into \(ai) and send them.")
                .font(Metrics.hint)
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
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
        static let wait = Font.system(size: 13, weight: .medium)
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
        static let wait = Font.body.weight(.medium)
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

    /// Which AIs are connected to this account.
    private func check() async {
        if let state = Self.stateForPictures {
            switch state {
            case "chatgpt": ways = .init(chats: ["ChatGPT"])
            case "both": ways = .init(chats: ["ChatGPT", "Claude"], paste: "Claude Code")
            case "code": ways = .init(paste: "Claude Code")
            case "waiting": ways = .init(chats: ["ChatGPT"]); waitingFor = "ChatGPT"
            default: ways = .init()
            }
            return
        }
        if ProcessInfo.processInfo.arguments.contains("-aiConnected") { ways = .init(chats: ["ChatGPT"]); return }
        guard let client = backend?.client else { ways = .init(); return }
        let rows: [Connection] = (try? await client.from("mcp_tokens").select().execute().value) ?? []
        ways = MakeAnApp.ways(rows)
    }

    /// One click: the AI opens with the words in its box, and the sheet waits for the app. The
    /// words are copied too: neither app documents the link, so pasting is the way if the box
    /// comes up empty.
    private func hand(to ai: String) {
        copy()
        // Captures and UI tests stay in the app.
        if !ProcessInfo.processInfo.arguments.contains("-uitest") { openURL(MakeAnApp.chat(ai, prompt: prompt)) }
        withAnimation(.smooth(duration: 0.25)) { waitingFor = ai }
    }

    private func copy() {
        #if os(iOS)
        UIPasteboard.general.string = prompt
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(prompt, forType: .string)
        #endif
    }
}

/// The note as an app, sketched: its own title over the shapes of the kind of app it would make
/// (a tracker's ring and week, a budget's total and bars, a checklist's progress and rows, a
/// table's cards). Shapes only: nobody else's app, and no numbers that aren't the person's.
struct MakeAppSketch: View {
    let title: String
    let kind: MakeAnApp.Kind

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text(title.isEmpty ? "Your note" : title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                AppMarkView(size: 12)
            }
            shapes
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.notePage, in: .rect(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
        .accessibilityElement()
        .accessibilityLabel("\(title) as an app, sketched")
    }

    private func bar(_ width: CGFloat, _ color: Color = Color.line, height: CGFloat = 8) -> some View {
        Capsule().fill(color).frame(width: width, height: height)
    }

    @ViewBuilder private var shapes: some View {
        switch kind {
        case .tracker:
            HStack(spacing: 14) {
                Circle().trim(from: 0, to: 0.7).stroke(Color.amberInk, style: .init(lineWidth: 6, lineCap: .round)).rotationEffect(.degrees(-90))
                    .background(Circle().stroke(Color.line, lineWidth: 6)).frame(width: 40, height: 40).padding(3)
                VStack(alignment: .leading, spacing: 8) {
                    bar(110, Color.ink.opacity(0.55))
                    HStack(spacing: 5) { ForEach(0..<7, id: \.self) { i in bar(18, i < 5 ? Color.amberInk : Color.line, height: 6) } }
                }
            }
        case .budget:
            VStack(alignment: .leading, spacing: 8) {
                bar(90, Color.ink.opacity(0.55), height: 12)
                ForEach([150.0, 96, 58], id: \.self) { w in HStack(spacing: 8) { bar(44); bar(w, Color.amberInk) } }
            }
        case .checklist:
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .leading) { bar(200); bar(120, Color.amberInk) }
                ForEach(0..<3, id: \.self) { i in
                    HStack(spacing: 8) {
                        Circle().strokeBorder(i == 0 ? Color.amberInk : Color.line, lineWidth: 1.5).background(Circle().fill(i == 0 ? Color.amberInk : .clear)).frame(width: 14, height: 14)
                        bar([120.0, 150, 90][i], Color.ink.opacity(i == 0 ? 0.25 : 0.5))
                    }
                }
            }
        case .cards, .plain:
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { i in
                    VStack(alignment: .leading, spacing: 6) { bar(50, Color.ink.opacity(0.55)); bar(70); bar([40.0, 56, 30][i], Color.amberInk) }
                        .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(Palette.sheetGround), in: .rect(cornerRadius: 8, style: .continuous))
                }
            }
        }
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
