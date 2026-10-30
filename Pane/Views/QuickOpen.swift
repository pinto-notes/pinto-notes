#if os(macOS)
import SwiftData
import SwiftUI

/// Go to Note… (⌘O): a Spotlight-like panel over the notes window. Type part of a title and
/// Return opens it; the same field runs the app's commands (New Note, Pin, Move, Import, Connect
/// an AI, Settings) and, last, searches every note for what you typed. The arrows move the
/// highlight, Esc closes. ⌘K stays Add Link, as in Notes; ⌘O is Obsidian's quick switcher.
enum QuickOpen {
    /// A note as the panel lists it, read once when the panel opens.
    struct NoteItem: Identifiable, Equatable, Sendable {
        let id: UUID
        let title: String
        /// The folder it is in, shown beside the title.
        let folder: String?
        let date: Date
        let locked: Bool
    }

    /// What a command does. The notes window runs it with its own actions (`Actions`).
    enum Action: Hashable, Sendable {
        case newNote, newFolder, togglePin, move, importAppleNotes, importFrom(ImportKind), exportNotes, connectAI, settings
    }

    struct CommandItem: Identifiable, Equatable, Sendable {
        let action: Action
        let title: String
        let symbol: String
        /// The shortcut the menu gives it, as the menu writes it.
        let shortcut: String?
        /// Other words it answers to: "ai" and "chatgpt" find Connect an AI.
        let keywords: [String]
        var id: String { title }
    }

    enum Row: Identifiable, Equatable, Sendable {
        case note(NoteItem)
        case command(CommandItem)
        /// Search every note for the text.
        case search(String)

        var id: String {
            switch self {
            case .note(let n): "note.\(n.id)"
            case .command(let c): "command.\(c.id)"
            case .search: "search"
            }
        }
    }

    /// How many notes the panel lists at most.
    static let noteLimit = 8

    // MARK: Matching

    private static let options: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]

    /// How well `text` answers `query`, lower is better; nil when it doesn't. The whole title, then
    /// its start, then the start of a word in it, then anywhere in it, then every typed word
    /// somewhere in it.
    static func score(_ text: String, _ query: String) -> Int? {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return nil }
        if text.compare(q, options: options) == .orderedSame { return 0 }
        if let r = text.range(of: q, options: options.union(.anchored)), r.lowerBound == text.startIndex { return 1 }
        var from = text.startIndex
        var anywhere = false
        while let r = text.range(of: q, options: options, range: from..<text.endIndex) {
            anywhere = true
            if r.lowerBound == text.startIndex || !(text[text.index(before: r.lowerBound)].isLetter || text[text.index(before: r.lowerBound)].isNumber) { return 2 }
            from = text.index(after: r.lowerBound)
        }
        if anywhere { return 3 }
        let words = q.split(whereSeparator: \.isWhitespace)
        if words.count > 1, words.allSatisfy({ text.range(of: $0, options: options) != nil }) { return 4 }
        return nil
    }

    /// The notes for a query: by how well the title answers it (a folder whose name does comes
    /// after any title), then the most recently changed first. No query: the most recent notes.
    static func notes(_ all: [NoteItem], matching query: String, limit: Int = noteLimit) -> [NoteItem] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return Array(all.sorted { $0.date > $1.date }.prefix(limit)) }
        let scored: [(NoteItem, Int)] = all.compactMap { n in
            if let s = score(n.title, q) { return (n, s) }
            if let f = n.folder, score(f, q) != nil { return (n, 5) }
            return nil
        }
        return Array(scored.sorted { $0.1 != $1.1 ? $0.1 < $1.1 : $0.0.date > $1.0.date }.prefix(limit).map(\.0))
    }

    /// The commands that answer a query, best first: by their name, else by one of their words.
    static func commands(_ all: [CommandItem], matching query: String) -> [CommandItem] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        let scored: [(CommandItem, Int)] = all.enumerated().compactMap { i, c in
            let byTitle = score(c.title, q)
            let byWord = c.keywords.contains { $0.range(of: q, options: options.union(.anchored)) != nil } ? 2 : nil
            guard let s = [byTitle, byWord].compactMap({ $0 }).min(), s <= 3 else { return nil }
            return (c, s * 100 + i)
        }
        return scored.sorted { $0.1 < $1.1 }.map(\.0)
    }

    /// The commands there are now. Pin and Move need an open note.
    static func commands(openNote: Bool, pinned: Bool, importKinds: [ImportKind]) -> [CommandItem] {
        var out: [CommandItem] = [
            CommandItem(action: .newNote, title: "New Note", symbol: "square.and.pencil", shortcut: "⌘N", keywords: ["create", "add", "write"]),
            CommandItem(action: .newFolder, title: "New Folder", symbol: "folder.badge.plus", shortcut: "⇧⌘N", keywords: ["create", "add"]),
        ]
        if openNote {
            out.append(CommandItem(action: .togglePin, title: pinned ? "Unpin Note" : "Pin Note", symbol: pinned ? "pin.slash" : "pin", shortcut: nil, keywords: ["pin", "unpin", "top"]))
            out.append(CommandItem(action: .move, title: "Move Note…", symbol: "folder", shortcut: nil, keywords: ["folder", "file"]))
        }
        out.append(CommandItem(action: .importAppleNotes, title: "Import from Apple Notes…", symbol: "square.and.arrow.down", shortcut: nil, keywords: ["import", "bring", "apple"]))
        for kind in importKinds {
            out.append(CommandItem(action: .importFrom(kind), title: kind.menuTitle, symbol: "square.and.arrow.down", shortcut: nil, keywords: ["import", "bring", kind.sourceName.lowercased()]))
        }
        out.append(CommandItem(action: .exportNotes, title: "Export All Notes…", symbol: "square.and.arrow.up", shortcut: nil, keywords: ["export", "markdown", "backup", "zip", "download", "obsidian"]))
        out.append(CommandItem(action: .connectAI, title: "Connect an AI…", symbol: "sparkles", shortcut: nil, keywords: ["ai", "chatgpt", "claude", "codex", "connect"]))
        out.append(CommandItem(action: .settings, title: "Settings…", symbol: "gearshape", shortcut: "⌘,", keywords: ["preferences", "account", "options"]))
        return out
    }

    /// Every row, in the order shown: the notes and the commands (the commands first when one of
    /// them answers the query better than any title), then searching every note for the text.
    static func rows(notes all: [NoteItem], commands: [CommandItem], query: String) -> [Row] {
        let q = query.trimmingCharacters(in: .whitespaces)
        let found = notes(all, matching: q), runs = self.commands(commands, matching: q)
        let bestNote = found.first.flatMap { score($0.title, q) } ?? 9
        let bestCommand = runs.first.flatMap { c in [score(c.title, q), c.keywords.contains { $0.range(of: q, options: options.union(.anchored)) != nil } ? 2 : nil].compactMap { $0 }.min() } ?? 9
        let noteRows = found.map(Row.note), commandRows = runs.map(Row.command)
        var out = bestCommand < bestNote ? commandRows + noteRows : noteRows + commandRows
        if !q.isEmpty { out.append(.search(q)) }
        return out
    }

    /// Where an arrow key takes the highlight, stopping at the ends.
    static func step(_ by: Int, from index: Int, count: Int) -> Int {
        guard count > 0 else { return 0 }
        return min(max(index + by, 0), count - 1)
    }

    /// A note's date, written exactly as the notes list writes it (DateBucket.rowDate), so the
    /// panel and the list always say the same thing.
    static func dateText(_ note: NoteItem) -> String { DateBucket.rowDate(note.date) }

    // MARK: Running

    /// What the notes window does for each kind of row.
    struct Actions {
        var open: (UUID) -> Void
        var run: (Action) -> Void
        var search: (String) -> Void
    }

    static func choose(_ row: Row, with actions: Actions) {
        switch row {
        case .note(let n): actions.open(n.id)
        case .command(let c): actions.run(c.action)
        case .search(let q): actions.search(q)
        }
    }

    // MARK: Reading

    /// The live notes, read when the panel opens.
    @MainActor static func noteItems(in context: ModelContext) -> [NoteItem] {
        var fetch = FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil })
        fetch.propertiesToFetch = [\.summaryTitle, \.updatedAt, \.lockedBody]
        let notes = (try? context.fetch(fetch)) ?? []
        return notes.map { NoteItem(id: $0.id, title: $0.title, folder: $0.folder?.name, date: $0.updatedAt, locked: $0.isLocked) }
    }
}

extension Notification.Name {
    /// File › Go to Note… (⌘O): the notes window shows or hides the panel.
    static let paneQuickOpen = Notification.Name("pane.quickOpen")
    /// The open note's Move to… picker, from the panel.
    static let paneMoveNote = Notification.Name("pane.moveNote")
    // .paneSearchNotes (search every note for the text in `object`) is declared with the list's search.
}

/// The panel itself: a search line, then the rows. Solid card, the shared shadow, no animation
/// (it's opened all day; frequent things are instant).
struct QuickOpenPanel: View {
    let notes: [QuickOpen.NoteItem]
    let commands: [QuickOpen.CommandItem]
    let choose: (QuickOpen.Row) -> Void
    let close: () -> Void

    @State private var query: String
    @State private var highlighted = 0
    @FocusState private var focused: Bool

    /// `query`: snapshots start with text typed.
    init(notes: [QuickOpen.NoteItem], commands: [QuickOpen.CommandItem], choose: @escaping (QuickOpen.Row) -> Void, close: @escaping () -> Void,
         initialQuery: String = "") {
        self.notes = notes
        self.commands = commands
        self.choose = choose
        self.close = close
        _query = State(initialValue: initialQuery)
    }

    enum Metrics {
        static let width: CGFloat = 600
        static let field: CGFloat = 54
        static let row: CGFloat = 36
        static let header: CGFloat = 26
        static let maxList: CGFloat = 392
    }

    private var rows: [QuickOpen.Row] { QuickOpen.rows(notes: notes, commands: commands, query: query) }

    var body: some View {
        let rows = rows
        let shape = RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
        let index = min(highlighted, max(rows.count - 1, 0))
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(Color.muted)
                TextField("Go to a note, or type a command", text: $query)
                    .textFieldStyle(.plain)
                    .font(.system(size: 20))
                    .foregroundStyle(Color.ink)
                    .focused($focused)
                    .onSubmit { if rows.indices.contains(index) { choose(rows[index]) } }
                    .onKeyPress(.downArrow) { highlighted = QuickOpen.step(1, from: index, count: rows.count); return .handled }
                    .onKeyPress(.upArrow) { highlighted = QuickOpen.step(-1, from: index, count: rows.count); return .handled }
                    .accessibilityIdentifier("quickOpen.field")
                AppMark(size: 22)
            }
            .padding(.horizontal, 18)
            .frame(height: Metrics.field)
            if !rows.isEmpty {
                Rectangle().fill(Color.line).frame(height: 1)
                list(rows, index: index)
                Rectangle().fill(Color.line).frame(height: 1)
                hints
            }
        }
        .frame(width: Metrics.width)
        .background(Color.card, in: shape)
        .clipShape(shape)
        .raised(in: shape)
        .onAppear { focused = true }
        .onChange(of: query) { _, _ in highlighted = 0 }
        .onExitCommand { close() }
        .accessibilityIdentifier("quickOpen")
    }

    private func list(_ rows: [QuickOpen.Row], index: Int) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                        if let title = header(before: i, in: rows) {
                            Text(title)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color.muted)
                                .padding(.horizontal, 12)
                                .frame(height: Metrics.header, alignment: .bottomLeading)
                                .padding(.bottom, 2)
                        }
                        rowView(row, on: i == index)
                            .id(row.id)
                            .onTapGesture { choose(row) }
                            .onHover { if $0 { highlighted = i } }
                    }
                }
                .padding(6)
            }
            .scrollIndicators(.never)
            .frame(height: min(height(rows), Metrics.maxList))
            .onChange(of: index) { _, i in if rows.indices.contains(i) { proxy.scrollTo(rows[i].id) } }
        }
    }

    /// A section's name above its first row: Recent notes, Notes, Commands.
    private func header(before i: Int, in rows: [QuickOpen.Row]) -> String? {
        func kind(_ r: QuickOpen.Row) -> Int { switch r { case .note: 0; case .command: 1; case .search: 2 } }
        let k = kind(rows[i])
        guard k != 2, i == 0 || kind(rows[i - 1]) != k else { return nil }
        if k == 1 { return "Commands" }
        return query.trimmingCharacters(in: .whitespaces).isEmpty ? "Recent notes" : "Notes"
    }

    private func height(_ rows: [QuickOpen.Row]) -> CGFloat {
        let headers = rows.indices.filter { header(before: $0, in: rows) != nil }.count
        return CGFloat(rows.count) * Metrics.row + CGFloat(headers) * (Metrics.header + 2) + 12
    }

    @ViewBuilder private func rowView(_ row: QuickOpen.Row, on: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
        HStack(spacing: 10) {
            switch row {
            case .note(let n):
                icon(n.locked ? "lock" : "doc.text", on: on)
                highlightedTitle(n.title.isEmpty ? "New Note" : n.title)
                if let f = n.folder {
                    Text(f).foregroundStyle(Color.muted).lineLimit(1).layoutPriority(-1)
                }
                Spacer(minLength: 8)
                Text(QuickOpen.dateText(n)).foregroundStyle(Color.muted).monospacedDigit()
            case .command(let c):
                icon(c.symbol, on: on)
                highlightedTitle(c.title)
                Spacer(minLength: 8)
                if let s = c.shortcut { Text(s).foregroundStyle(Color.muted).monospacedDigit() }
            case .search(let q):
                icon("magnifyingglass", on: on)
                (Text("Search all notes for ") + Text("“\(q)”").foregroundStyle(Color.ink).fontWeight(.semibold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                Spacer(minLength: 8)
            }
            if on {
                Image(systemName: "return")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color.amberInk)
            }
        }
        .font(.system(size: 14))
        .padding(.horizontal, 10)
        .frame(height: Metrics.row)
        .background(on ? Color.amberSoft : .clear, in: shape)
        .contentShape(shape)
    }

    private func icon(_ symbol: String, on: Bool) -> some View {
        Image(systemName: symbol)
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(on ? Color.amberInk : Color.muted)
            .frame(width: 20)
    }

    /// The title with the typed text in semibold, so you see why it matched.
    private func highlightedTitle(_ title: String) -> some View {
        var text = AttributedString(title)
        let q = query.trimmingCharacters(in: .whitespaces)
        if !q.isEmpty, let r = title.range(of: q, options: [.caseInsensitive, .diacriticInsensitive]),
           let lower = AttributedString.Index(r.lowerBound, within: text), let upper = AttributedString.Index(r.upperBound, within: text) {
            text[lower..<upper].font = .system(size: 14, weight: .semibold)
        }
        return Text(text).foregroundStyle(Color.ink).lineLimit(1)
    }

    private var hints: some View {
        HStack(spacing: 14) {
            hint("↑↓", "choose")
            hint("↩", "open")
            hint("esc", "close")
            Spacer()
        }
        .font(.system(size: 11.5))
        .foregroundStyle(Color.muted)
        .padding(.horizontal, 16)
        .frame(height: 30)
    }

    private func hint(_ key: String, _ what: String) -> some View {
        HStack(spacing: 5) {
            Text(key)
                .font(.system(size: 10.5, weight: .semibold))
                .padding(.horizontal, 5)
                .frame(minWidth: 18, minHeight: 17)
                .background(Color.soft, in: RoundedRectangle(cornerRadius: 4, style: .continuous))
            Text(what)
        }
    }
}
#endif
