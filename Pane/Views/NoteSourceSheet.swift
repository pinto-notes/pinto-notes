import SwiftData
import SwiftUI
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// "Use this template" / "Use this note": what the link adds, where it goes, and one button.
/// Once added, a template shows the prompt that has your AI fill it in, with Copy.
struct NoteSourceSheet: View {
    let model: NoteSourceModel
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @State private var client: String?
    @State private var copied = false

    var body: some View {
        NavigationStack {
            content
                .navigationTitle(navigationTitle)
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        if case .added = model.phase {} else { Button("Cancel") { dismiss() }.accessibilityIdentifier("noteSource.cancel") }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        if case .added = model.phase { Button("Done") { dismiss() }.accessibilityIdentifier("noteSource.done") }
                    }
                }
        }
        #if os(macOS)
        .frame(width: 520, height: 620)
        #endif
        .task { if model.phase == .loading { await model.load(context: context) } }
        // Added: straight into the note (or app), where the first-open moment says the rest.
        .onChange(of: model.phase) { _, phase in
            if case .added(_, let note, _) = phase {
                NoteOpener.shared.open(note)
                dismiss()
            }
        }
        .alert("You already added this", isPresented: Binding(get: { model.duplicate != nil }, set: { if !$0 { model.duplicate = nil } })) {
            Button("Add another copy") { model.add(context: context, again: true) }
            Button("Open the one you have") {
                if let id = model.duplicate { NoteOpener.shared.open(id) }
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\u{201C}\(model.draft?.title ?? "This note")\u{201D} is already in your notes. Add another copy?")
        }
    }

    private var navigationTitle: String {
        model.link.kind == .template ? "Use this template" : "Use this note"
    }

    @ViewBuilder private var content: some View {
        switch model.phase {
        case .loading:
            ProgressView(model.link.kind == .template ? "Loading template…" : "Loading note…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let error):
            ContentUnavailableView {
                Label(error.title, systemImage: error == .offline ? "wifi.slash" : "exclamationmark.triangle")
            } description: {
                Text(error.message)
            } actions: {
                if error.canRetry {
                    Button("Try again") { Task { await model.load(context: context) } }
                        .accessibilityIdentifier("noteSource.retry")
                }
            }
            .accessibilityIdentifier("noteSource.failed")
        case .ready(let draft):
            ready(draft)
        case .added(let draft, let note, let folder):
            added(draft, note: note, folder: folder)
        }
    }

    // MARK: Ready to add

    private func ready(_ draft: NoteDraft) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(draft.title)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                if let d = draft.description, !d.isEmpty {
                    Text(d).font(.subheadline).foregroundStyle(Color.muted).fixedSize(horizontal: false, vertical: true)
                }
            }
            if let picture = FirstOpen.image(data: colorScheme == .dark ? draft.previewDark ?? draft.preview : draft.preview) {
                // An app: a picture of it, as it will open.
                picture.resizable().scaledToFit()
                    .clipShape(.rect(cornerRadius: 18, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .accessibilityLabel("Picture of the \(draft.title) app")
                    .accessibilityIdentifier("noteSource.preview")
            } else {
            // The note as it will look, read-only: checklists, headings, lists and tables.
            NotePreview(markdown: draft.body)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .frame(minHeight: 200)
                .background(Color.notePage, in: .rect(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(.separator, lineWidth: 0.5))
                .accessibilityLabel("Preview of \(draft.title)")
                .accessibilityIdentifier("noteSource.preview")
            }
            if draft.leftOut > 0 {
                Label(draft.leftOut == 1 ? "A photo or file in this note stays with its owner." : "\(draft.leftOut) photos and files in this note stay with their owner.",
                      systemImage: "photo.on.rectangle")
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
            }
            folderPicker(draft)
            Button { model.add(context: context) } label: {
                Text("Add to my notes").frame(maxWidth: .infinity)
            }
            .buttonStyle(.amberProminent(.regular, wide: true))
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier("noteSource.add")
        }
        .padding(20)
    }

    private func folderPicker(_ draft: NoteDraft) -> some View {
        let folders = context.allFolders().map { (id: $0.id, path: context.folderPath($0)) }.sorted { $0.path.localizedStandardCompare($1.path) == .orderedAscending }
        let suggested = context.suggestedFolder(for: draft)
        return Picker("Folder", selection: Binding(get: { model.folder ?? suggested }, set: { model.folder = $0 })) {
            if case .new(let name) = suggested {
                Text("\(name) (new folder)").tag(FolderChoice.new(name))
            }
            ForEach(folders, id: \.id) { f in
                Text(f.path).tag(FolderChoice.existing(f.id))
            }
        }
        .accessibilityIdentifier("noteSource.folder")
    }

    // MARK: Added

    private func added(_ draft: NoteDraft, note: UUID, folder: String) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    DrawnCheck().frame(width: 32, height: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Added to your notes").font(.headline).foregroundStyle(Color.ink)
                        Text("\u{201C}\(draft.title)\u{201D} is in \(folder).").font(.subheadline).foregroundStyle(Color.muted)
                    }
                }
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("noteSource.added")

                if !draft.instructions.isEmpty { instructions(draft.instructions) }

                Button {
                    NoteOpener.shared.open(note)
                    dismiss()
                } label: {
                    Text("Open note").frame(maxWidth: .infinity)
                }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .accessibilityIdentifier("noteSource.open")
            }
            .padding(20)
        }
    }

    /// Where the AI gets connected first: Settings on the Mac; iPhone connects none (Emil, 8 November 2026).
    static func connectLine(mac: Bool = ConnectHere.onMac) -> String {
        mac ? "Connect your AI in Settings, then paste this into it." : "Connect your AI on your Mac, or from ChatGPT or Claude, then paste this into it."
    }

    private func instructions(_ list: [NoteTemplate.Instruction]) -> some View {
        let current = list.first { $0.client == client } ?? list[0]
        return VStack(alignment: .leading, spacing: 10) {
            Text("Ask your AI to fill it in").font(.headline).foregroundStyle(Color.ink)
            Text(Self.connectLine()).font(.subheadline).foregroundStyle(Color.muted)
            if list.count > 1 {
                Picker("AI", selection: Binding(get: { current.client }, set: { client = $0; copied = false })) {
                    ForEach(list) { Text($0.name).tag($0.client) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityIdentifier("noteSource.client")
            }
            // The prompt to read; the note's markdown it carries (for an AI to create the note
            // where it's missing) is copied with it but not shown. Long prompts scroll.
            let shown = PromptText.shown(current.prompt)
            VStack(alignment: .leading, spacing: 8) {
                ScrollView {
                    Text(shown.text)
                        .font(.callout)
                        .foregroundStyle(Color.ink)
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                }
                .frame(maxHeight: 180)
                .fixedSize(horizontal: false, vertical: true)
                .background(Color.notePage, in: .rect(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(.separator, lineWidth: 0.5))
                .accessibilityIdentifier("noteSource.prompt")
                if shown.includesMarkdown {
                    Label("The note\u{2019}s markdown is included when you copy.", systemImage: "doc.plaintext")
                        .font(.footnote)
                        .foregroundStyle(Color.muted)
                }
            }
            Button { copy(current.prompt) } label: {
                Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                    .contentTransition(.symbolEffect(.replace))
                    .frame(minWidth: 88)
            }
            .buttonStyle(.secondary)
            .accessibilityIdentifier("noteSource.copy")
        }
    }

    private func copy(_ text: String) {
        #if os(iOS)
        UIPasteboard.general.string = text
        #else
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #endif
        withAnimation(.snappy(duration: 0.15)) { copied = true }
        Task {
            try? await Task.sleep(for: .seconds(2))
            withAnimation(.snappy(duration: 0.15)) { copied = false }
        }
    }
}

/// Shows the sheet for a template or copy link once the notes are open.
struct NoteSourceHandler: ViewModifier {
    @State private var center = NoteSourceCenter.shared
    @State private var model: NoteSourceModel?
    /// Optional: views hosted without an account (previews, tests) still get links.
    @Environment(Backend.self) private var backend: Backend?

    func body(content: Content) -> some View {
        content
            .onChange(of: center.pending, initial: true) { _, link in
                guard let link else { return }
                center.pending = nil
                model = NoteSourceModel(link: link, source: WebNoteSource(), ledger: NoteSourceLedger(account: backend?.userID))
            }
            .sheet(item: $model) { NoteSourceSheet(model: $0) }
    }
}

extension NoteSourceModel: Identifiable {
    nonisolated var id: ObjectIdentifier { ObjectIdentifier(self) }
}

extension View {
    func noteSourceHandler() -> some View { modifier(NoteSourceHandler()) }
}

// MARK: Prompt

/// A template's prompt as the sheet shows it: the words before the ```markdown block that carries
/// the note (copied in full, not shown).
nonisolated enum PromptText {
    static func shown(_ prompt: String) -> (text: String, includesMarkdown: Bool) {
        guard let r = prompt.range(of: "```markdown") else { return (prompt.trimmingCharacters(in: .whitespacesAndNewlines), false) }
        return (String(prompt[..<r.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines), true)
    }
}

// MARK: Preview

/// A note's markdown drawn the way the editor shows it at rest, tables included (the version
/// preview leaves tables to the editor's grid, so it can't be used here). Read-only.
struct NotePreview: View {
    let markdown: String
    /// The blocks to show, when not all of the note's (the template library leaves off the title).
    var given: [Block]? = nil
    /// Whole blocks only, as many as fit, in a window that doesn't scroll (the template library's
    /// stage): none cut through at the foot, no heading without the block under it, and tables at
    /// the window's width (council round 3: a line's tops showed at the foot, a heading ended the
    /// window, a table was cut at the right).
    var whole = false
    /// The small stage's type: 12 pt lines, closer together, so a short note shows whole there
    /// (council round 4: Weekly review showed four of its five questions).
    var compact = false

    enum Block: Equatable {
        case title(String)
        case heading(Int, String)
        case paragraph(String)
        case check(Bool, String, indent: Int)
        case bullet(dash: Bool, String, indent: Int)
        case numbered(String, String, indent: Int)
        case quote(String)
        case code(String)
        case table(header: [String], rows: [[String]])
        case gap
    }

    /// The note in blocks. Type lines for tables (<!-- pane-table: … -->) and other comments are left out.
    nonisolated static func blocks(_ markdown: String) -> [Block] {
        let lines = markdown.components(separatedBy: "\n")
        var out: [Block] = []
        var i = 0
        var titled = false
        func indent(_ l: String) -> Int { (l.prefix { $0 == " " || $0 == "\t" }.count + 1) / 2 }
        func match(_ l: String, _ p: String) -> [String]? {
            guard let r = try? NSRegularExpression(pattern: p), let m = r.firstMatch(in: l, range: NSRange(l.startIndex..., in: l)) else { return nil }
            return (1..<m.numberOfRanges).map { Range(m.range(at: $0), in: l).map { String(l[$0]) } ?? "" }
        }
        let isDelimiter = { (l: String) in l.trimmingCharacters(in: .whitespaces).hasPrefix("|") && l.contains("-") && l.allSatisfy { "|-: \t".contains($0) } }
        while i < lines.count {
            let line = lines[i]
            let t = line.trimmingCharacters(in: .whitespaces)
            defer { i += 1 }
            if t.isEmpty { if out.last != .gap, !out.isEmpty { out.append(.gap) }; continue }
            if t.hasPrefix("<!--"), t.hasSuffix("-->") { continue }
            if !titled { titled = true; out.append(.title(t.replacingOccurrences(of: #"^#+\s*"#, with: "", options: .regularExpression))); continue }
            if t.hasPrefix("```") || t.hasPrefix("~~~") {
                var code: [String] = []
                i += 1
                while i < lines.count, !lines[i].trimmingCharacters(in: .whitespaces).hasPrefix(String(t.prefix(3))) { code.append(lines[i]); i += 1 }
                out.append(.code(code.joined(separator: "\n")))
                continue
            }
            if t.hasPrefix("|"), i + 1 < lines.count, isDelimiter(lines[i + 1]) {
                let header = MarkdownTableCells.cells(t)
                var rows: [[String]] = []
                i += 2
                while i < lines.count, lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("|") {
                    let c = MarkdownTableCells.cells(lines[i])
                    rows.append(header.indices.map { $0 < c.count ? c[$0] : "" })
                    i += 1
                }
                i -= 1
                out.append(.table(header: header, rows: rows))
                continue
            }
            if let m = match(line, #"^(#{1,6})\s+(.*)$"#) { out.append(.heading(m[0].count, m[1])); continue }
            if let m = match(line, #"^\s*[-*+]\s+\[([ xX])\]\s+(.*)$"#) { out.append(.check(m[0] != " ", m[1], indent: indent(line))); continue }
            if let m = match(line, #"^\s*([-*+])\s+(.*)$"#) { out.append(.bullet(dash: m[0] == "-", m[1], indent: indent(line))); continue }
            if let m = match(line, #"^\s*(\d+[.)])\s+(.*)$"#) { out.append(.numbered(m[0], m[1], indent: indent(line))); continue }
            if let m = match(line, #"^>\s?(.*)$"#) { out.append(.quote(m[0])); continue }
            out.append(.paragraph(t))
        }
        while out.last == .gap { out.removeLast() }
        return out
    }

    var body: some View {
        if whole {
            WholeBlocks(spacing: compact ? 2 : 4) {
                ForEach(Array((given ?? Self.blocks(markdown)).enumerated()), id: \.offset) { _, block in
                    if case .table(let header, let rows) = block {
                        // A table is a block per row, so as many whole rows show as fit, and its
                        // header never shows without a row (council round 4: a cell cut mid-word).
                        tableRows(header: header, rows: rows)
                    } else {
                        view(block).layoutValue(key: WholeBlocks.Heading.self, value: block.leadsIn).layoutValue(key: WholeBlocks.Gap.self, value: block == .gap)
                    }
                }
            }
            .padding(.horizontal, compact ? 16 : 20)
            .padding(.vertical, compact ? 12 : 16)
            .font(compact ? .system(size: 12) : nil)
            .foregroundStyle(Color.ink)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(Array((given ?? Self.blocks(markdown)).enumerated()), id: \.offset) { _, block in
                        view(block)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
            }
            .foregroundStyle(Color.ink)
        }
    }

    private func inline(_ s: String) -> Text {
        let s = whole ? Self.unbroken(s) : s
        if let a = try? AttributedString(markdown: s, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)) { return Text(a) }
        return Text(s)
    }

    /// A day, a date or a weight in one piece: "Thu 1 Oct", "1 Oct" and "120 kg x 3" never break
    /// across lines (council round 4: "(Thu / 1 Oct)", "120 kg / x 3"), and "x" between numbers is "×".
    nonisolated static func unbroken(_ s: String) -> String {
        let nb = "\u{00A0}"
        var out = s.replacingOccurrences(of: #"(\S)\s+x\s+(\d)"#, with: "$1\(nb)×\(nb)$2", options: .regularExpression)
        out = out.replacingOccurrences(of: #"(\d)x(\d)"#, with: "$1×$2", options: .regularExpression)
        out = out.replacingOccurrences(of: #"(\d)\s+(kg|lb|km|min|kr|h)\b"#, with: "$1\(nb)$2", options: .regularExpression)
        let months = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December"
        out = out.replacingOccurrences(of: #"\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\b"#, with: "$1\(nb)$2", options: .regularExpression)
        out = out.replacingOccurrences(of: #"\b(\d{1,2})\s+("# + months + #")\b"#, with: "$1\(nb)$2", options: .regularExpression)
        return out
    }

    /// A paragraph's last two words kept together, so it never ends on one word alone on its last
    /// line (council round 6: Cornell's summary ended on "shortage.").
    /// A closing aside ("(Thu 1 Oct)", "(next week)") stays whole and with the word before it, so it
    /// never wraps alone (council round 7: Meeting notes' "(Thu 1 Oct)" on a line of its own).
    nonisolated static func lastWordsKept(_ s: String) -> String {
        if s.hasSuffix(")"), let open = s.range(of: " (", options: .backwards), s.distance(from: open.upperBound, to: s.endIndex) <= 16 {
            return String(s[..<open.lowerBound]) + "\u{00A0}(" + s[open.upperBound...].replacingOccurrences(of: " ", with: "\u{00A0}")
        }
        guard let last = s.range(of: " ", options: .backwards), s.distance(from: last.upperBound, to: s.endIndex) <= 14 else { return s }
        return s.replacingCharacters(in: last, with: "\u{00A0}")
    }

    /// A table cell as the preview shows it: a date as "26 Sep", as a tracker's date column shows
    /// it, and any short value in one piece.
    nonisolated static func shownCell(_ s: String) -> String {
        let t = s.trimmingCharacters(in: .whitespaces)
        if t.wholeMatch(of: /\d{4}-\d{2}-\d{2}/) != nil {
            let p = t.split(separator: "-").compactMap { Int($0) }
            let names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            if p.count == 3, (1...12).contains(p[1]) { return "\(p[2])\u{00A0}\(names[p[1] - 1])" }
        }
        let u = unbroken(t)
        return u.count <= 14 ? u.replacingOccurrences(of: " ", with: "\u{00A0}") : u
    }

    /// Each column's share of a table's width, from how much it holds: its header or its average
    /// cell, whichever is longer, kept between 4 and 60 characters' worth.
    nonisolated static func shares(header: [String], rows: [[String]]) -> [CGFloat] {
        let weights: [CGFloat] = header.indices.map { c in
            // Empty cells say nothing about how wide a column's words are (a plan with four days
            // still to fill gave "Dinner" less room than "Who cooks": council round 5).
            let cells = rows.compactMap { c < $0.count && !$0[c].trimmingCharacters(in: .whitespaces).isEmpty ? shownCell($0[c]).count : nil }
            let average = cells.isEmpty ? 0 : CGFloat(cells.reduce(0, +)) / CGFloat(cells.count)
            return min(60, max(4, CGFloat(header[c].count), average))
        }
        let sum = weights.reduce(0, +)
        return weights.map { sum > 0 ? $0 / sum : 1 / CGFloat(max(1, weights.count)) }
    }

    /// How wide each column must be so none of its words breaks: its longest word ("Workout",
    /// "120 kg × 3", "26 Sep": a value kept in one piece is one word), in the cell's type, and the
    /// cell's padding (council round 5: "Work-out", "Min-utes" and "26 / Sep" broke mid-word).
    nonisolated static func leastWidths(header: [String], rows: [[String]]) -> [CGFloat] {
        #if os(iOS)
        typealias Font = UIFont
        #else
        typealias Font = NSFont
        #endif
        let size = Font.preferredFont(forTextStyle: .footnote).pointSize
        let plain = Font.monospacedDigitSystemFont(ofSize: size, weight: .regular)
        let bold = Font.monospacedDigitSystemFont(ofSize: size, weight: .semibold)
        func widest(_ s: String, _ font: Font) -> CGFloat {
            shownCell(s).split(separator: " ").map { NSString(string: String($0)).size(withAttributes: [.font: font]).width }.max() ?? 0
        }
        return header.indices.map { c in
            let cells = rows.map { c < $0.count ? widest($0[c].replacingOccurrences(of: "**", with: ""), plain) : 0 }
            return (max(widest(header[c], bold), cells.max() ?? 0) + 16 + 2).rounded(.up)
        }
    }

    /// A table in the stage's window: its header row, then each row as a block of its own, all
    /// at the same column widths, joined with no space between, cells wrapped at a word.
    @ViewBuilder private func tableRows(header: [String], rows: [[String]]) -> some View {
        let shares = Self.shares(header: header, rows: rows)
        let least = Self.leastWidths(header: header, rows: rows)
        let need = least.reduce(0, +)
        let shown = rows.isEmpty ? [header.map { _ in "" }] : rows
        TableRowLayout(shares: shares, least: least) { ForEach(Array(header.enumerated()), id: \.offset) { wholeCell($0.element, header: true) } }
            .overlay(alignment: .top) { Rectangle().fill(.separator).frame(height: 0.5) }
            .overlay(alignment: .leading) { Rectangle().fill(.separator).frame(width: 0.5) }
            .modifier(RunsOffRight(need: need))
            .padding(.top, 4)
            .layoutValue(key: WholeBlocks.Heading.self, value: true)
        ForEach(Array(shown.enumerated()), id: \.offset) { _, row in
            TableRowLayout(shares: shares, least: least) { ForEach(Array(row.enumerated()), id: \.offset) { wholeCell($0.element, header: false) } }
                .overlay(alignment: .leading) { Rectangle().fill(.separator).frame(width: 0.5) }
                .modifier(RunsOffRight(need: need))
                .layoutValue(key: WholeBlocks.Joined.self, value: true)
        }
    }

    /// A table row wider than the window: cut at the window's edge, under a 16 pt fade into the
    /// window's ground, as Notes shows a table that scrolls sideways (council round 6).
    struct RunsOffRight: ViewModifier {
        let need: CGFloat
        static let fade: CGFloat = 16
        @Environment(\.colorScheme) private var scheme

        func body(content: Content) -> some View {
            let ground: Color = scheme == .dark ? .black : .white
            content
                .clipped()
                .overlay {
                    GeometryReader { g in
                        if need > g.size.width + 0.5 {
                            LinearGradient(colors: [ground.opacity(0), ground], startPoint: .leading, endPoint: .trailing)
                                .frame(width: Self.fade)
                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
                        }
                    }
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                }
        }
    }

    private func wholeCell(_ s: String, header: Bool) -> some View {
        inline(Self.shownCell(s).isEmpty ? " " : Self.shownCell(s))
            .font(header ? .footnote.weight(.semibold) : .footnote)
            .monospacedDigit()
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(header ? AnyShapeStyle(.quaternary.opacity(0.6)) : AnyShapeStyle(.clear))
            .overlay(alignment: .trailing) { Rectangle().fill(.separator).frame(width: 0.5) }
            .overlay(alignment: .bottom) { Rectangle().fill(.separator).frame(height: 0.5) }
    }

    @ViewBuilder private func view(_ block: Block) -> some View {
        switch block {
        case .title(let s):
            Text(s).font(.system(.title, weight: .heavy)).padding(.bottom, 6)
        case .heading(let level, let s):
            inline(s).font(level <= 1 ? .title2.bold() : level == 2 ? .title3.bold() : .headline).padding(.top, 6)
        case .paragraph(let s):
            inline(whole ? Self.lastWordsKept(s) : s).fixedSize(horizontal: false, vertical: true)
        case .check(let done, let s, let n):
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(done ? AnyShapeStyle(Color(PColor.paneAccent)) : AnyShapeStyle(.tertiary))
                    .imageScale(.large)
                inline(whole ? Self.lastWordsKept(s) : s).foregroundStyle(done ? Color.muted : Color.ink)
            }
            .padding(.leading, CGFloat(n) * 20)
        case .bullet(let dash, let s, let n):
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(dash ? "\u{2013}" : "\u{2022}").frame(width: 14)
                inline(whole ? Self.lastWordsKept(s) : s)
            }
            .padding(.leading, CGFloat(n) * 20)
        case .numbered(let marker, let s, let n):
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(marker).monospacedDigit()
                inline(s)
            }
            .padding(.leading, CGFloat(n) * 20)
        case .quote(let s):
            inline(s).foregroundStyle(Color.muted)
                .padding(.leading, 12)
                .overlay(alignment: .leading) { Rectangle().fill(Color(PColor.paneAccent)).frame(width: 3) }
        case .code(let s):
            Text(s).font(.callout.monospaced())
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(.quaternary.opacity(0.5), in: .rect(cornerRadius: 8))
        case .table(let header, let rows):
            let grid = Grid(alignment: .leading, horizontalSpacing: 0, verticalSpacing: 0) {
                GridRow { ForEach(Array(header.enumerated()), id: \.offset) { cell($0.element, header: true) } }
                // A tracker starts empty: one blank row shows it's a table to fill in.
                ForEach(Array((rows.isEmpty ? [header.map { _ in "" }] : rows).enumerated()), id: \.offset) { _, row in
                    GridRow { ForEach(Array(row.enumerated()), id: \.offset) { cell($0.element, header: false) } }
                }
            }
            .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(.separator, lineWidth: 0.5))
            .clipShape(.rect(cornerRadius: 6))
            Group {
                // In a window that doesn't scroll, the table takes the window's width and its
                // cells wrap; otherwise it scrolls sideways.
                if whole { grid } else { ScrollView(.horizontal, showsIndicators: false) { grid } }
            }
            .padding(.vertical, 4)
        case .gap:
            Color.clear.frame(height: 8)
        }
    }

    private func cell(_ s: String, header: Bool) -> some View {
        inline(s.isEmpty ? " " : s)
            .font(header ? .footnote.weight(.semibold) : .footnote)
            .monospacedDigit()
            .lineLimit(whole ? 3 : 2)
            .fixedSize(horizontal: false, vertical: whole)
            .frame(minWidth: 44, maxWidth: whole ? .infinity : 160, maxHeight: whole ? .infinity : nil, alignment: .topLeading)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(header ? AnyShapeStyle(.quaternary.opacity(0.6)) : AnyShapeStyle(.clear))
            .overlay(alignment: .trailing) { Rectangle().fill(.separator).frame(width: 0.5) }
            .overlay(alignment: .bottom) { Rectangle().fill(.separator).frame(height: 0.5) }
    }
}

extension NotePreview.Block {
    var isHeading: Bool { if case .heading = self { return true }; return false }
    /// A block that leads into the ones under it and never ends the stage alone: a heading, or a
    /// line that's all bold ("**Fruit and veg**" over its items).
    var leadsIn: Bool {
        if isHeading { return true }
        if case .paragraph(let s) = self { return s.count > 4 && s.hasPrefix("**") && s.hasSuffix("**") && !s.dropFirst(2).dropLast(2).contains("**") }
        return false
    }
}

/// A note's blocks top to bottom, as many whole ones as fit: a block that would be cut at the foot
/// goes, with everything after it, and so does a heading (and the space above it) left last
/// without the block under it. What goes is placed out of sight, below the window it's clipped to.
struct WholeBlocks: Layout {
    var spacing: CGFloat = 4

    struct Heading: LayoutValueKey { static let defaultValue = false }
    struct Gap: LayoutValueKey { static let defaultValue = false }
    /// Sits right under the block before it, with no space between (a table's rows).
    struct Joined: LayoutValueKey { static let defaultValue = false }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 320
        let height = proposal.height ?? subviews.reduce(0) { $0 + $1.sizeThatFits(.init(width: width, height: nil)).height + spacing }
        return CGSize(width: width, height: height)
    }

    /// How many of the blocks show, given their heights, in a window of `room` points: whole ones
    /// only, and never a heading or a gap last. A joined block has no space above it.
    static func shown(heights: [CGFloat], headings: [Bool], gaps: [Bool], joined: [Bool]? = nil, room: CGFloat, spacing: CGFloat) -> Int {
        var y: CGFloat = 0, count = 0
        for (i, h) in heights.enumerated() {
            let top = y - (i > 0 && joined?[i] == true ? spacing : 0)
            if top + h > room + 0.5 { break }
            y = top + h + spacing
            count += 1
        }
        while count > 0, headings[count - 1] || gaps[count - 1] { count -= 1 }
        // Not even one whole block fits (a heading over a tall table on a small stage): it all
        // shows and runs off the foot, rather than an empty window.
        return count == 0 ? heights.count : count
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let sizes = subviews.map { $0.sizeThatFits(.init(width: bounds.width, height: nil)) }
        let joined = subviews.map { $0[Joined.self] }
        let shown = Self.shown(heights: sizes.map(\.height), headings: subviews.map { $0[Heading.self] },
                               gaps: subviews.map { $0[Gap.self] }, joined: joined, room: bounds.height, spacing: spacing)
        var y = bounds.minY
        for (i, s) in subviews.enumerated() {
            let size = ProposedViewSize(width: bounds.width, height: sizes[i].height)
            if i < shown {
                if i > 0, joined[i] { y -= spacing }
                s.place(at: CGPoint(x: bounds.minX, y: y), proposal: size)
                y += sizes[i].height + spacing
            } else {
                s.place(at: CGPoint(x: bounds.minX, y: bounds.maxY + 10_000), proposal: size)
            }
        }
    }
}

/// A table row at set column shares of the width it's given, every cell as tall as the tallest,
/// so rows laid out apart still line up as one table.
struct TableRowLayout: Layout {
    let shares: [CGFloat]
    /// Each column's least width, so no word in it breaks (NotePreview.leastWidths).
    var least: [CGFloat] = []

    private func widths(_ total: CGFloat, _ count: Int) -> [CGFloat] {
        Self.widths(total: total, shares: (0..<count).map { $0 < shares.count ? shares[$0] : 0 },
                    least: (0..<count).map { $0 < least.count ? least[$0] : 0 })
    }

    /// The columns' widths in `total`: each its share, but never under its least width; what a
    /// narrow column needs comes from the others' room over their own least. When even the least
    /// widths don't fit, each keeps its least and the table runs off the right edge, as Notes
    /// scrolls a wide table (council round 6: scaled down, "Work-out", "Mi-n" and "26 / Sep" broke).
    nonisolated static func widths(total: CGFloat, shares: [CGFloat], least: [CGFloat]) -> [CGFloat] {
        let want = zip(shares, least).map { max(total * $0, $1) }
        let need = least.reduce(0, +)
        guard need < total else { return least.map { $0.rounded(.up) } }
        let over = want.reduce(0, +) - total
        guard over > 0 else { return want.map { $0.rounded(.down) } }
        let spare = zip(want, least).map { $0 - $1 }
        let spareSum = spare.reduce(0, +)
        return zip(want, spare).map { ($0 - (spareSum > 0 ? over * $1 / spareSum : 0)).rounded(.down) }
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 320
        let w = widths(width, subviews.count)
        let height = subviews.indices.map { subviews[$0].sizeThatFits(.init(width: w[$0], height: nil)).height }.max() ?? 0
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let w = widths(bounds.width, subviews.count)
        var x = bounds.minX
        for (i, s) in subviews.enumerated() {
            // The last cell takes what rounding left, so the row ends flush; a table wider than
            // the window keeps its least and runs off the right edge.
            let width = i == subviews.count - 1 ? max(w[i], bounds.maxX - x) : w[i]
            s.place(at: CGPoint(x: x, y: bounds.minY), proposal: .init(width: width, height: bounds.height))
            x += width
        }
    }
}

/// Splits a markdown table row into cells, keeping escaped pipes.
nonisolated enum MarkdownTableCells {
    static func cells(_ line: String) -> [String] {
        var s = line.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("|") { s.removeFirst() }
        if s.hasSuffix("|"), !s.hasSuffix("\\|") { s.removeLast() }
        var out: [String] = [], cur = ""
        var it = s.makeIterator()
        while let ch = it.next() {
            if ch == "\\" { if let n = it.next() { cur.append(n == "|" ? "|" : "\\"); if n != "|" { cur.append(n) } }; continue }
            if ch == "|" { out.append(cur.trimmingCharacters(in: .whitespaces)); cur = ""; continue }
            cur.append(ch)
        }
        out.append(cur.trimmingCharacters(in: .whitespaces))
        return out
    }
}

// MARK: Captures

/// `-uitest -captureScreen template | template-added | copy`: the sheet with a made-up template or
/// shared page, nothing fetched.
struct NoteSourceCapture: View {
    let name: String
    @Environment(\.modelContext) private var context
    @State private var model: NoteSourceModel?

    private struct Fixed: NoteSourceFetching {
        let draft: NoteDraft
        func draft(for link: NoteSourceLink) async throws -> NoteDraft { draft }
    }

    static let habitTracker = """
    Habit tracker

    One row a day. Ask your AI each evening to log it.

    ## Habits
    - [ ] Walk 30 minutes
    - [ ] Read 20 pages
    - [ ] No phone after 22:00

    ## Log
    <!-- pane-table: Date=date; Walk=choice Yes|No; Read=choice Yes|No; Phone=choice Yes|No; Note=text -->
    | Date | Walk | Read | Phone | Note |
    | --- | --- | --- | --- | --- |
    | 2026-09-29 | Yes | Yes | No | Late call |
    | 2026-09-30 | Yes | No | Yes |  |
    """

    var body: some View {
        Group {
            if let model { NoteSourceSheet(model: model) } else { Color.clear }
        }
        .task { model = await Self.model(name, context: context) }
    }

    /// The sheet's state for one capture: `template`, `template-added` or `copy`.
    /// `template` replaces the made-up habit tracker (the snapshot tests pass the site's real one).
    static func model(_ name: String, context: ModelContext, template: NoteTemplate? = nil) async -> NoteSourceModel {
        let copy = name == "copy"
        let link = NoteSourceLink(kind: copy ? .copy : .template, slug: copy ? "AbCdEfGhIjKlMnOpQrStUvWx" : "habit-tracker")
        var draft: NoteDraft
        if copy {
            draft = NoteDraft(link: link, title: "Lisbon", body: "Lisbon\n\nFour days of tiles, trams and pastries in May.\n\n## Plan\n- [ ] Tram 28 early, before the crowds\n- [ ] Day trip to Sintra\n- [x] Book flights\n\n## Food\n- Manteigaria: pastel de nata\n- Ramiro: seafood", leftOut: 2)
        } else if let template {
            draft = NoteDraft(template: template, link: NoteSourceLink(kind: .template, slug: template.slug))
        } else {
            draft = NoteDraft(link: link, title: "Habit tracker", body: habitTracker, leftOut: 0)
            draft.description = "Tick off your habits, and have your AI log each day as a row."
            draft.folder = "Habits"
            draft.instructions = [
                .init(client: "chatgpt", name: "ChatGPT", prompt: "In Pinto Notes, use the note \u{201C}Habit tracker\u{201D}. Ask me which habits I did today, then add today's row to its table with edit."),
                .init(client: "claude", name: "Claude", prompt: "In Pinto Notes, use the note \u{201C}Habit tracker\u{201D}. Ask me which habits I did today, then add today's row to its table with edit."),
                .init(client: "claude-code", name: "Claude Code", prompt: "Use the amber-notes MCP server. In the note \u{201C}Habit tracker\u{201D}, add today's row to its table with edit."),
            ]
        }
        let m = NoteSourceModel(link: link, source: Fixed(draft: draft), ledger: NoteSourceLedger(defaults: UserDefaults(suiteName: "capture.noteSources") ?? .standard, account: nil))
        await m.load(context: context)
        if name == "template-added" { m.add(context: context, again: true) }
        return m
    }
}
