#if os(macOS)
import SwiftData
import SwiftUI

/// Go to Note… (⌘K or ⌘O): a Spotlight-like panel over the notes window. Type part of a title and
/// Return opens it; the same field runs the app's commands (New Note, Pin, Move, Import, Connect
/// an AI, Settings), finds notes by their text (the line that holds it shown under the title), and,
/// last, searches every note for what you typed. The sidebar's Search button opens it too. The arrows move the
/// highlight, Esc closes. ⌘K opens it as in Notion and Slack, except with text picked in a note,
/// where it stays Add Link as in Notes (`CommandK`); ⌘O is Obsidian's quick switcher.
enum QuickOpen {
    /// Three looks to choose between (Emil, 7 November 2026: it didn't feel like the same app). All
    /// three drop the amber, the shortcut chip and the keys' footer.
    /// `defaults write <app id> quickOpenLook quiet|list|sidebar` tries one; the one left goes after.
    enum Look: String { case quiet, list, sidebar }
    static var look: Look { Look(rawValue: UserDefaults.standard.string(forKey: "quickOpenLook") ?? "") ?? .list }

    /// It appears and goes at once, with no fade, no spring and no scale (Emil, 9 November 2026: the
    /// 0.24 s spring and scale were "really slow, makes it annoying to use", and then "I dont like the
    /// fade effect"). The field has the caret on the first frame.
    static let openDuration: Double = 0
    static func motion(opening: Bool, reduceMotion: Bool) -> Animation {
        .easeOut(duration: openDuration)
    }

    /// Nothing: no fade, nothing grows or moves, with Reduce Motion or not.
    static func transition(reduceMotion: Bool) -> AnyTransition { .identity }

    /// The shortcut the field shows on its right (Emil, 9 November 2026). ⌘O opens it too.
    static let shortcutHint = "\u{2318}K"

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
        case newNote, todaysNote, newFolder, togglePin, move, importAppleNotes, importFrom(ImportKind), exportNotes, connectAI, settings
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

    /// The line of a note that holds the text: before it, the text as written there, after it.
    typealias Snippet = SearchLines.Line

    /// A note found by its text (not its title), with the lines that hold it: the first, up to two
    /// more, and how many more past those (round 1 of the councils: every match, not one).
    struct TextHit: Identifiable, Equatable, Sendable {
        let id: UUID
        let title: String
        let folder: String?
        let date: Date
        let snippet: Snippet
        var others: [Snippet] = []
        var more = 0
    }

    enum Row: Identifiable, Equatable, Sendable {
        case note(NoteItem)
        case command(CommandItem)
        /// A note whose text holds the query.
        case text(TextHit)
        /// Search every note for the text.
        case search(String)

        var id: String {
            switch self {
            case .note(let n): "note.\(n.id)"
            case .command(let c): "command.\(c.id)"
            case .text(let t): "text.\(t.id)"
            case .search: "search"
            }
        }
    }

    /// How many notes the panel lists at most.
    static let noteLimit = 8
    /// How many notes found by their text it lists at most.
    static let textLimit = 8
    /// The last row: every note that holds the text, in the notes list.
    static let listAllTitle = "Show all notes with "
    /// The shortest query that searches the notes' text: one letter is in every note.
    static let textMinLength = 2
    /// How long typing rests before the text is searched.
    static let textDelay: Duration = .milliseconds(120)

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
    /// No query: every command, after the recent notes, so the panel suggests before you type
    /// (Emil, 11-03).
    static func commands(_ all: [CommandItem], matching query: String) -> [CommandItem] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return all }
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
            CommandItem(action: .todaysNote, title: "Today\u{2019}s Note", symbol: "calendar", shortcut: "⌘T", keywords: ["daily", "today", "journal", "date"]),
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
        out.append(CommandItem(action: .exportNotes, title: "Export All Notes…", symbol: "square.and.arrow.up", shortcut: nil, keywords: ["export", "markdown", "backup", "zip", "download"]))
        out.append(CommandItem(action: .connectAI, title: "Connect an AI…", symbol: "sparkles", shortcut: nil, keywords: ["ai", "chatgpt", "claude", "codex", "connect"]))
        out.append(CommandItem(action: .settings, title: "Settings…", symbol: "gearshape", shortcut: "⌘,", keywords: ["preferences", "account", "options"]))
        return out
    }

    /// Every row, in the order shown: the notes and the commands (the commands first when one of
    /// them answers the query better than any title), then the notes found by their text (none
    /// already listed by its title or folder), then searching every note for the text.
    static func rows(notes all: [NoteItem], commands: [CommandItem], query: String, textHits: [TextHit] = []) -> [Row] {
        let q = query.trimmingCharacters(in: .whitespaces)
        let found = notes(all, matching: q), runs = self.commands(commands, matching: q)
        let bestNote = found.first.flatMap { score($0.title, q) } ?? 9
        let bestCommand = runs.first.flatMap { c in [score(c.title, q), c.keywords.contains { $0.range(of: q, options: options.union(.anchored)) != nil } ? 2 : nil].compactMap { $0 }.min() } ?? 9
        let noteRows = found.map(Row.note), commandRows = runs.map(Row.command)
        var out = bestCommand < bestNote ? commandRows + noteRows : noteRows + commandRows
        if !q.isEmpty {
            let listed = Set(found.map(\.id))
            out += textHits.filter { !listed.contains($0.id) && score($0.title, q) == nil }.prefix(textLimit).map(Row.text)
            out.append(.search(q))
        }
        return out
    }

    // MARK: Text

    /// The line of `body` that holds `query` (case and accents aside), its markup taken out, cut
    /// to show the text near its start. Nil when no line holds it.
    static func snippet(in body: String, query: String, lead: Int = 28, length: Int = 120) -> Snippet? {
        SearchLines.find(in: body, query: query, limit: 1, lead: lead, length: length)?.lines.first
    }

    /// The notes whose text holds `query`, newest first, each with its line: read off the main
    /// thread from a context of its own, so typing stays instant. Locked notes are left out (their
    /// text is sealed; what's stored in the clear is the title), and so are notes whose title
    /// already answers the query.
    static func textHits(for query: String, in container: ModelContainer, limit: Int = textLimit) async -> [TextHit] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= textMinLength else { return [] }
        return await Task.detached(priority: .userInitiated) {
            let context = ModelContext(container)
            let holds = #Predicate<Note> { (n: Note) -> Bool in
                n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil && n.body.localizedStandardContains(q)
            }
            var fetch = FetchDescriptor<Note>(predicate: holds)
            fetch.sortBy = [SortDescriptor(\Note.updatedAt, order: .reverse)]
            // Some found ones are listed by their title already: room for them.
            fetch.fetchLimit = limit * 4
            var notes = (try? context.fetch(fetch)) ?? []
            // Nothing holds it as typed: the notes a letter or two off (TypoSearch), as the list does.
            var near = false
            if notes.isEmpty, TypoSearch.applies(to: q) {
                var seen = Set<UUID>()
                for piece in TypoSearch.probes(q) {
                    let holdsPiece = #Predicate<Note> { (n: Note) -> Bool in n.body.localizedStandardContains(piece) }
                    var d = FetchDescriptor<Note>(predicate: holdsPiece)
                    d.sortBy = [SortDescriptor(\Note.updatedAt, order: .reverse)]
                    d.fetchLimit = 300
                    for n in (try? context.fetch(d)) ?? [] where n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil
                        && !seen.contains(n.id) && TypoSearch.matches(q, in: n.body) {
                        seen.insert(n.id); notes.append(n)
                    }
                }
                notes.sort { $0.updatedAt > $1.updatedAt }
                near = true
            }
            var out: [TextHit] = []
            for n in notes {
                if out.count == limit || Task.isCancelled { break }
                guard !n.isLocked else { continue }
                let title = n.title
                let looked = !near ? q : (TypoSearch.closeWord(q, in: n.body) ?? q)
                guard score(title, q) == nil || near, let found = SearchLines.find(in: n.body, query: looked), let first = found.lines.first else { continue }
                out.append(TextHit(id: n.id, title: title, folder: n.folder?.name, date: n.updatedAt, snippet: first,
                                   others: Array(found.lines.dropFirst()), more: found.more))
            }
            return out
        }.value
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
        Usage.count(.goToNote)
        switch row {
        case .note(let n): actions.open(n.id)
        case .text(let t): actions.open(t.id)
        case .command(let c): actions.run(c.action)
        case .search(let q): actions.search(q)
        }
    }

    // MARK: Reading

    /// The live notes, read when the panel opens. `limit`: only the most recently changed, which is
    /// all the panel shows before you type, read in a few milliseconds so it's on screen at once.
    @MainActor static func noteItems(in context: ModelContext, limit: Int? = nil) -> [NoteItem] {
        var fetch = FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil })
        fetch.propertiesToFetch = [\.summaryTitle, \.updatedAt, \.lockedBody]
        if let limit {
            fetch.sortBy = [SortDescriptor(\Note.updatedAt, order: .reverse)]
            fetch.fetchLimit = limit
        }
        let notes = (try? context.fetch(fetch)) ?? []
        return notes.map(item)
    }

    /// How many notes the panel reads before it shows: the recent ones it lists, with room.
    static let firstRead = 40

    /// Every live note, read away from the main thread once the panel is up (2,000 notes took
    /// 164 ms on the main thread, before the panel could draw).
    static func allNoteItems(in container: ModelContainer) async -> [NoteItem] {
        await Task.detached(priority: .userInitiated) {
            let context = ModelContext(container)
            var fetch = FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil })
            fetch.propertiesToFetch = [\.summaryTitle, \.updatedAt, \.lockedBody]
            return ((try? context.fetch(fetch)) ?? []).map(item)
        }.value
    }

    /// The whole list with the first read on top: the main window's copy of a note wins, since it
    /// may hold a change not saved yet.
    static func merged(first: [NoteItem], all: [NoteItem]) -> [NoteItem] {
        let ids = Set(first.map(\.id))
        return first + all.filter { !ids.contains($0.id) }
    }

    private static func item(_ n: Note) -> NoteItem {
        NoteItem(id: n.id, title: n.title, folder: n.folder?.name, date: n.updatedAt, locked: n.isLocked)
    }
}

/// ⌘K: Add Link while text is picked in the note (or a table cell) you're typing in, as in Notes;
/// anywhere else it opens Go to Note, as in Notion and Slack (Emil, 9 November 2026). The Link menu
/// item keeps the key; chosen with the pointer it always adds a link.
enum CommandK {
    enum Route: Equatable { case link, goToNote }

    static func route(byKey: Bool, typingInNote: Bool, selection: NSRange?, readOnly: Bool) -> Route {
        guard byKey else { return .link }
        return typingInNote && !readOnly && (selection?.length ?? 0) > 0 ? .link : .goToNote
    }

    @MainActor static func route(_ editor: EditorController?, byKey: Bool) -> Route {
        guard let editor else { return byKey ? .goToNote : .link }
        return route(byKey: byKey, typingInNote: editor.isEditing || editor.cell != nil,
                     selection: editor.host?.currentSelection, readOnly: editor.readOnly)
    }
}

extension Notification.Name {
    /// File › Go to Note… (⌘O, and ⌘K outside picked text): the notes window shows or hides the panel.
    static let paneQuickOpen = Notification.Name("pane.quickOpen")
    /// The open note's Move to… picker, from the panel.
    static let paneMoveNote = Notification.Name("pane.moveNote")
    // .paneSearchNotes (search every note for the text in `object`) is declared with the list's search.
}

/// The panel itself: a search line, then the rows. Solid card, the shared shadow, no animation
/// (it's opened all day; frequent things are instant).
struct QuickOpenPanel: View {
    #if os(macOS)
    @State private var panelFrame = CGRect.zero
    @State private var clickWatch: Any?
    #endif
    let notes: [QuickOpen.NoteItem]
    let commands: [QuickOpen.CommandItem]
    let choose: (QuickOpen.Row) -> Void
    let close: () -> Void
    /// Finds notes by their text, off the main thread (`QuickOpen.textHits`). Nil: titles only.
    let searchText: (@Sendable (String) async -> [QuickOpen.TextHit])?

    #if DEBUG
    @Environment(\.modelContext) private var context
    #endif
    @State private var query: String
    /// The query the notes' text has been read for, so "nothing found" waits for the answer.
    @State private var readFor: String?

    /// What VoiceOver says for the highlighted row: the keyboard stays in the field while the
    /// arrows move, so it has to be told (council round 16: the list was silent).
    static func spoken(_ row: QuickOpen.Row, at index: Int, of count: Int) -> String {
        "\(spoken(row)), \(index + 1) of \(count)"
    }

    /// A row as VoiceOver reads it when you move onto it: what's on screen beside the name.
    static func rowLabel(_ row: QuickOpen.Row) -> String {
        switch row {
        case .note(let n): [spoken(row), n.folder, QuickOpen.dateText(n)].compactMap { $0 }.joined(separator: ", ")
        // Everything the row shows: the other lines and how many more were left out of VoiceOver.
        case .text(let t): ([spoken(row)] + t.others.map(\.text) + [t.more > 0 ? SearchLines.moreLine(t.more) : nil, t.folder]).compactMap { $0 }.joined(separator: ", ")
        case .command(let c): [spoken(row), c.shortcut].compactMap { $0 }.joined(separator: ", ")
        case .search: spoken(row)
        }
    }

    static func spoken(_ row: QuickOpen.Row) -> String {
        let name: String
        switch row {
        case .note(let n): name = n.title.isEmpty ? "New Note" : n.title
        case .command(let c): name = c.title
        case .text(let t): name = "\(t.title.isEmpty ? "New Note" : t.title): \(t.snippet.text)"
        case .search(let q): name = "\(QuickOpen.listAllTitle)\(q)"
        }
        return name
    }

    /// What the panel says when a search finds nothing; nil while there's something to show or
    /// the answer is still coming (council round 16: it just went blank).
    static func nothingFound(query: String, rows: Int, stillReading: Bool) -> String? {
        let t = query.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty, rows == 0, !stillReading else { return nil }
        return "No notes or commands match \u{201C}\(t)\u{201D}."
    }

    private var stillReading: Bool {
        searchText != nil && query.trimmingCharacters(in: .whitespaces).count >= QuickOpen.textMinLength && readFor != query
    }

    /// A note found by its text opens at the line (SearchJump).
    private func jumpAndChoose(_ row: QuickOpen.Row) {
        if case .text(let t) = row { SearchJump.set(t.id, query: query) }
        choose(row)
    }
    @State private var highlighted = 0
    @State private var textHits: [QuickOpen.TextHit]
    @FocusState private var focused: Bool
    @State private var window = WeakWindow()

    /// `initialQuery`, `initialTextHits`: snapshots start with text typed and found.
    init(notes: [QuickOpen.NoteItem], commands: [QuickOpen.CommandItem], choose: @escaping (QuickOpen.Row) -> Void, close: @escaping () -> Void,
         searchText: (@Sendable (String) async -> [QuickOpen.TextHit])? = nil,
         initialQuery: String = "", initialTextHits: [QuickOpen.TextHit] = []) {
        self.notes = notes
        self.commands = commands
        self.choose = choose
        self.close = close
        self.searchText = searchText
        _query = State(initialValue: initialQuery)
        _textHits = State(initialValue: initialTextHits)
    }

    enum Metrics {
        static let width: CGFloat = 600
        static let field: CGFloat = 48
        static let row: CGFloat = 36
        /// A note in the list look: its title, and when and where under it.
        static let listRow: CGFloat = 50
        /// A note found by its text: its title, and the line under it.
        static let textRow: CGFloat = 48
        /// Each further line under it: another line that holds the text, or "4 more in this note".
        static let textLine: CGFloat = 18
        static let header: CGFloat = 26
        static let maxList: CGFloat = 392
    }

    private var rows: [QuickOpen.Row] {
        Self.shown(QuickOpen.rows(notes: notes, commands: commands, query: query, textHits: textHits), stillReading: stillReading)
    }

    /// "Show all notes with" alone promises a list that may be empty (round 17: it stood in for
    /// saying nothing matched), so it waits for the notes' text; meanwhile the panel says it's
    /// looking (round 20: the row showed, then "No notes" replaced it a second later, and Return
    /// in between opened an empty list).
    static func shown(_ rows: [QuickOpen.Row], stillReading: Bool) -> [QuickOpen.Row] {
        if rows.count == 1, case .search = rows[0] { return [] }
        return rows
    }

    /// The shortcut, quiet on the field's right like a key on the keyboard: solid, no glass.
    static var shortcutKey: some View {
        Text(QuickOpen.shortcutHint)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color.muted)
            .padding(.horizontal, 7)
            .frame(height: 22)
            .background(Color.soft, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 6, style: .continuous).strokeBorder(Color.line, lineWidth: 1))
            .fixedSize()
            .accessibilityHidden(true)
            .accessibilityIdentifier("quickOpen.shortcut")
    }

    /// The line while the only thing left to come is what the notes' text holds.
    static func looking(query: String, rows: Int, stillReading: Bool) -> String? {
        rows == 0 && stillReading && !query.trimmingCharacters(in: .whitespaces).isEmpty ? "Searching your notes\u{2026}" : nil
    }

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("QuickOpenPanel", context: context)
        #endif
        let rows = rows
        let shape = RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
        let index = min(highlighted, max(rows.count - 1, 0))
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Color.muted)
                TextField("Go to a note, or type a command", text: $query)
                    .textFieldStyle(.plain)
                    .font(.system(size: 17))
                    .foregroundStyle(Color.ink)
                    .focused($focused)
                    .onSubmit { if rows.indices.contains(index) { jumpAndChoose(rows[index]) } }
                    .onKeyPress(.downArrow) { highlighted = QuickOpen.step(1, from: index, count: rows.count); return .handled }
                    .onKeyPress(.upArrow) { highlighted = QuickOpen.step(-1, from: index, count: rows.count); return .handled }
                    .onKeyPress(.escape) { close(); return .handled }
                    .accessibilityLabel("Go to Note")
                    .accessibilityIdentifier("quickOpen.field")
                Self.shortcutKey
            }
            .padding(.horizontal, 18)
            .frame(height: Metrics.field)
            if !rows.isEmpty {
                Rectangle().fill(Color.line).frame(height: 1)
                list(rows, index: index)
            } else if let nothing = Self.nothingFound(query: query, rows: rows.count, stillReading: stillReading) ?? Self.looking(query: query, rows: rows.count, stillReading: stillReading) {
                Rectangle().fill(Color.line).frame(height: 1)
                Text(nothing)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.muted)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 20)
                    .accessibilityIdentifier("quickOpen.nothing")
            }
        }
        .frame(width: Metrics.width)
        .background(Color.card, in: shape)
        .clipShape(shape)
        .raised(in: shape)
        // The cursor in the field from the moment it shows (a field asked for focus in the update
        // it appears in doesn't take it), and there's never a panel you aren't typing in: when
        // anything else takes the cursor, a click outside included, it closes (Emil, 11-03).
        .onAppear { focused = true; Task { @MainActor in focused = true } }
        // Only a key window's cursor moving counts: a window that can't take the cursor at all
        // (never shown, or offscreen) doesn't close the panel it never let you type in.
        .onChange(of: focused) { was, now in if was && !now && window.value?.isKeyWindow == true { close() } }
        .background(WindowFinder(found: window))
        .onChange(of: query) { _, q in
            highlighted = 0
            // While the store is read, the lines found so far that still hold the text stay.
            let t = q.trimmingCharacters(in: .whitespaces)
            textHits = t.isEmpty ? [] : textHits.filter { $0.snippet.text.range(of: t, options: [.caseInsensitive, .diacriticInsensitive]) != nil }
        }
        // The notes' text, once typing rests (each key cancels the read before it).
        .task(id: query) {
            guard let searchText, query.trimmingCharacters(in: .whitespaces).count >= QuickOpen.textMinLength else { return }
            try? await Task.sleep(for: QuickOpen.textDelay)
            guard !Task.isCancelled else { return }
            let q = query
            let found = await searchText(q)
            guard !Task.isCancelled, q == query else { return }
            textHits = found
            readFor = q
        }
        .onChange(of: rows.indices.contains(index) ? Self.spoken(rows[index], at: index, of: rows.count) : Self.nothingFound(query: query, rows: rows.count, stillReading: stillReading)) { _, said in
            if let said { AccessibilityNotification.Announcement(said).post() }
        }
        .onExitCommand { close() }
        #if os(macOS)
        // A click on nothing that takes focus left it open (Emil, 6 November 2026): any click
        // outside closes it, and still does what it would have.
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { panelFrame = $0 }
        .onAppear {
            clickWatch = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { event in
                guard let w = window.value, event.window === w,
                      QuickOpen.isOutside(event.locationInWindow, of: panelFrame, windowHeight: w.contentLayoutRect.maxY) else { return event }
                QuickOpen.closedByClick = .now
                close()
                return event
            }
        }
        .onDisappear { if let clickWatch { NSEvent.removeMonitor(clickWatch) }; clickWatch = nil }
        #endif
        // VoiceOver stays in the panel: what's behind it isn't reachable (round 20: AppKit's table
        // and text view stayed in the tree under the window's hidden split view).
        .accessibilityAddTraits(.isModal)
        .accessibilityIdentifier("quickOpen")
    }

    private func list(_ rows: [QuickOpen.Row], index: Int) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                        if let title = header(before: i, in: rows) {
                            Text(title)
                                .font(.system(size: QuickOpen.look == .list ? 15 : 12, weight: .semibold))
                                .foregroundStyle(QuickOpen.look == .list ? Color.ink : Color.muted)
                                .padding(.horizontal, 10)
                                .frame(height: Metrics.header, alignment: .bottomLeading)
                                .padding(.bottom, 2)
                        }
                        rowView(row, on: i == index)
                            .id(row.id)
                            .onTapGesture { jumpAndChoose(row) }
                            // One row to VoiceOver, not its loose texts and symbols ("Text With A
                            // Magnifying Glass", round 18), and pressable.
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel(Self.rowLabel(row))
                            .accessibilityIdentifier("quickOpen.row")
                            .accessibilityAddTraits(i == index ? [.isButton, .isSelected] : .isButton)
                            .accessibilityAction { jumpAndChoose(row) }
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

    /// A section's name above its first row: Recent notes, Notes, Commands, In note text.
    private func header(before i: Int, in rows: [QuickOpen.Row]) -> String? {
        func kind(_ r: QuickOpen.Row) -> Int { switch r { case .note: 0; case .command: 1; case .search: 2; case .text: 3 } }
        let k = kind(rows[i])
        guard k != 2, i == 0 || kind(rows[i - 1]) != k else { return nil }
        if k == 1 { return "Commands" }
        if k == 3 { return "In note text" }
        return query.trimmingCharacters(in: .whitespaces).isEmpty ? "Recent notes" : "Notes"
    }

    private func height(_ rows: [QuickOpen.Row]) -> CGFloat {
        let headers = rows.indices.filter { header(before: $0, in: rows) != nil }.count
        return rows.reduce(0) { $0 + Self.height(of: $1) } + CGFloat(headers) * (Metrics.header + 2) + 12
    }

    /// A row's height: a note found by its text grows a line for each further line it shows.
    static func height(of row: QuickOpen.Row) -> CGFloat {
        if case .note = row, QuickOpen.look == .list { return Metrics.listRow }
        guard case .text(let t) = row else { return Metrics.row }
        return Metrics.textRow + CGFloat(t.others.count + (t.more > 0 ? 1 : 0)) * Metrics.textLine
    }

    @ViewBuilder private func rowView(_ row: QuickOpen.Row, on: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
        HStack(spacing: 10) {
            switch row {
            case .note(let n):
                switch QuickOpen.look {
                case .quiet:
                    highlightedTitle(n.title.isEmpty ? "New Note" : n.title)
                    Spacer(minLength: 8)
                    if let f = n.folder { Text(f).foregroundStyle(Color.muted).lineLimit(1) }
                case .list:
                    // As the notes list has it: the title, then when and where.
                    VStack(alignment: .leading, spacing: 2) {
                        highlightedTitle(n.title.isEmpty ? "New Note" : n.title, weight: .semibold)
                        Text([QuickOpen.dateText(n), n.folder].compactMap(\.self).joined(separator: "  ·  "))
                            .font(.system(size: 12.5))
                            .foregroundStyle(Color.muted)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 8)
                case .sidebar:
                    // As the sidebar has it: an icon, the name in the accent when chosen, a figure at the end.
                    icon(n.locked ? "lock" : "doc.text", on: on)
                    highlightedTitle(n.title.isEmpty ? "New Note" : n.title, ink: on ? Color(PColor.paneAccent) : Color.ink)
                    Spacer(minLength: 8)
                    Text(QuickOpen.dateText(n)).foregroundStyle(Color.muted).monospacedDigit()
                }
            case .text(let t):
                icon("text.magnifyingglass", on: on)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 10) {
                        Text(t.title.isEmpty ? "New Note" : t.title).foregroundStyle(Color.ink).lineLimit(1)
                        if let f = t.folder {
                            Text(f).foregroundStyle(Color.muted).lineLimit(1).layoutPriority(-1)
                        }
                    }
                    snippetText(t.snippet)
                    ForEach(Array(t.others.enumerated()), id: \.offset) { _, line in snippetText(line) }
                    if t.more > 0 {
                        Text(SearchLines.moreLine(t.more))
                            .font(.system(size: 12))
                            .foregroundStyle(Color.muted)
                            .accessibilityIdentifier("quickOpen.more")
                    }
                }
                Spacer(minLength: 8)
                Text(DateBucket.rowDate(t.date)).foregroundStyle(Color.muted).monospacedDigit()
            case .command(let c):
                icon(c.symbol, on: on)
                highlightedTitle(c.title)
                Spacer(minLength: 8)
                if let s = c.shortcut { Text(s).foregroundStyle(Color.muted).monospacedDigit() }
            case .search(let q):
                // What it does: the list, filtered to every note that holds the text. The panel
                // shows only the first few (Emil, 11-03: "what is even Search all notes, aren't we
                // doing that").
                icon("list.bullet", on: on)
                (Text(QuickOpen.listAllTitle) + Text("“\(q)”").foregroundStyle(Color.ink).fontWeight(.semibold))
                    .foregroundStyle(Color.ink)
                    .lineLimit(1)
                Spacer(minLength: 8)
            }
        }
        .font(.system(size: 14))
        .padding(.horizontal, 10)
        .frame(height: Self.height(of: row))
        .background(on ? Color.soft : .clear, in: shape)
        .contentShape(shape)
    }

    private func icon(_ symbol: String, on: Bool) -> some View {
        Image(systemName: symbol)
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(on && QuickOpen.look == .sidebar ? Color(PColor.paneAccent) : Color.muted)
            .frame(width: 20)
    }

    /// The title with the typed text in semibold, so you see why it matched.
    private func highlightedTitle(_ title: String, weight: Font.Weight = .regular, ink: Color = .ink) -> some View {
        var text = AttributedString(title)
        text.font = .system(size: 14, weight: weight)
        let q = query.trimmingCharacters(in: .whitespaces)
        if !q.isEmpty, let r = title.range(of: q, options: [.caseInsensitive, .diacriticInsensitive]),
           let lower = AttributedString.Index(r.lowerBound, within: text), let upper = AttributedString.Index(r.upperBound, within: text) {
            text[lower..<upper].font = .system(size: 14, weight: .semibold)
        }
        return Text(text).foregroundStyle(ink).lineLimit(1)
    }

    /// The line that holds the text, the text itself in the ink's semibold and the rest muted.
    private func snippetText(_ s: QuickOpen.Snippet) -> some View {
        (Text(s.before) + Text(s.match).foregroundStyle(Color.ink).fontWeight(.semibold) + Text(s.after))
            .font(.system(size: 12.5))
            .foregroundStyle(Color.muted)
            .lineLimit(1)
            .truncationMode(.tail)
            .accessibilityLabel(s.text)
    }

}
/// The panel's window, read once it's in one, so losing the cursor can ask whether it was key.
@MainActor final class WeakWindow { weak var value: NSWindow? }

private struct WindowFinder: NSViewRepresentable {
    let found: WeakWindow
    final class Probe: NSView {
        var found: WeakWindow?
        override func viewDidMoveToWindow() { found?.value = window }
    }
    func makeNSView(context: Context) -> Probe { let v = Probe(); v.found = found; return v }
    func updateNSView(_ v: Probe, context: Context) { v.found = found; found.value = v.window }
}

#endif

#if os(macOS)
extension QuickOpen {
    /// When a click outside last closed the panel: that click on the Search button shouldn't open it again.
    nonisolated(unsafe) static var closedByClick: Date?

    /// Whether a click (window coordinates, y up) is outside the panel (SwiftUI's global, y down).
    static func isOutside(_ point: CGPoint, of panel: CGRect, windowHeight: CGFloat) -> Bool {
        !panel.isEmpty && !panel.contains(CGPoint(x: point.x, y: windowHeight - point.y))
    }
}
#endif
