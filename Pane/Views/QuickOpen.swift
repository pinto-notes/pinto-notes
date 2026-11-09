#if os(macOS)
import SwiftData
import SwiftUI

private extension Color {
    /// The third tone, a little fainter than muted: a folder or note named as a tag.
    static var faint: Color { Color.muted.opacity(0.72) }
}

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

    /// Where the accent goes, three to choose between (Emil, 9 November 2026: "everything just
    /// looks the same. there is no color"). The person's own accent, as the sidebar's selected
    /// folder has it; colour says what you can act on, what's a folder and what's chosen.
    /// - `a`: every command's icon and the folder glyph in the accent.
    /// - `b`: a, and the chosen row's icon and the typed text in the accent.
    /// - `c`: b, with each command's icon on a small accent-tinted tile, as Raycast has it.
    /// `defaults write <app id> quickOpenTint a|b|c` tries one (DEBUG builds); `none` is today's.
    enum Tint: String, CaseIterable { case none, a, b, c }
    #if DEBUG
    nonisolated(unsafe) static var tintOverride: Tint?
    static var tint: Tint { tintOverride ?? Tint(rawValue: UserDefaults.standard.string(forKey: "quickOpenTint") ?? "") ?? .none }
    #else
    static var tint: Tint { .none }
    #endif

    /// It drops in from just above, like the app's sheets but quicker, and goes at once (Emil,
    /// 9 November 2026: the 0.24 s spring and scale were "really slow"; a fade alone wasn't what the
    /// other sheets do; with nothing at all, "some transition would be good"). The field has the
    /// caret on the first frame, so typing straight away is never lost.
    static let openDuration: Double = 0.15
    static let dropDistance: CGFloat = 10
    static func motion(opening: Bool, reduceMotion: Bool) -> Animation {
        .easeOut(duration: opening && !reduceMotion ? openDuration : 0)
    }

    /// In: down from 10 pt above, growing solid as it comes. Out: gone at once. Reduce Motion: no
    /// movement either way.
    static func transition(reduceMotion: Bool) -> AnyTransition {
        reduceMotion ? .identity : .asymmetric(insertion: .offset(y: -dropDistance).combined(with: .opacity), removal: .identity)
    }

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
        /// The line under the title in the notes list: the first words after the title, markdown
        /// gone, or "No additional text". "Locked" for a locked note: never its text.
        var preview: String = NoteText.noPreview
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
        /// What it acts on, quiet beside the title: "[folder] Daily", "9 November 2026 · [folder] Daily".
        var detail: Detail?
        var id: String { title }
    }

    /// The thing a command acts on, written beside its title (Emil, 9 November 2026: "its just
    /// terribly unclear what exactly will each do"): words leading in (today's date), then the
    /// thing as a tag, a small glyph and its name ("[folder] Daily", "[doc] Q4 plan"), or plain
    /// words with no glyph ("Top level").
    struct Detail: Equatable, Sendable {
        var lead: String?
        var symbol: String?
        var name: String
        /// As VoiceOver reads it, and as the tests compare it: "in Daily" for a folder.
        var text: String { [lead, symbol == "folder" ? "in \(name)" : name].compactMap { $0 }.joined(separator: " ") }
    }

    /// What the commands act on, read from the window: the open note, the folder New Note puts a
    /// note in, and today's note.
    struct Targets: Equatable, Sendable {
        /// The open note's title ("New Note" while it has none); nil with no note open or the open
        /// one in Recently Deleted.
        var note: String?
        var pinned = false
        /// The folder New Note puts the note in, or the folder of the empty note it opens again.
        var newNoteFolder: String?
        /// Today's note's title, and the folder it is in or will be made in.
        var today: String?
        var todayFolder: String?
    }

    /// A section's label.
    struct Header: Equatable, Sendable {
        var title: String
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

    /// The commands there are now, with nothing known about the window but whether a note is open.
    static func commands(openNote: Bool, pinned: Bool, importKinds: [ImportKind]) -> [CommandItem] {
        commands(Targets(note: openNote ? "Note" : nil, pinned: pinned), importKinds: importKinds)
    }

    /// The commands there are now, each saying what it acts on. Pin and Move need an open note.
    static func commands(_ t: Targets, importKinds: [ImportKind]) -> [CommandItem] {
        let today: Detail? = t.today.map { day in
            t.todayFolder.map { Detail(lead: "\(day) \u{00B7}", symbol: "folder", name: $0) } ?? Detail(name: day)
        }
        var out: [CommandItem] = [
            CommandItem(action: .newNote, title: "New Note", symbol: "square.and.pencil", shortcut: "⌘N", keywords: ["create", "add", "write"],
                        detail: t.newNoteFolder.map { Detail(symbol: "folder", name: $0) }),
            CommandItem(action: .todaysNote, title: "Today\u{2019}s Note", symbol: "calendar", shortcut: "⌘T", keywords: ["daily", "today", "journal", "date"],
                        detail: today),
            // A top-level folder whatever is selected: the sidebar's New Folder (startNewFolder(nil)).
            CommandItem(action: .newFolder, title: "New Folder", symbol: "folder.badge.plus", shortcut: "⇧⌘N", keywords: ["create", "add"],
                        detail: Detail(name: "Top level")),
        ]
        if let note = t.note {
            let on = Detail(symbol: "doc.text", name: note)
            out.append(CommandItem(action: .togglePin, title: t.pinned ? "Unpin Note" : "Pin Note", symbol: t.pinned ? "pin.slash" : "pin", shortcut: nil,
                                   keywords: ["pin", "unpin", "top"], detail: on))
            out.append(CommandItem(action: .move, title: "Move Note…", symbol: "folder", shortcut: nil, keywords: ["folder", "file"], detail: on))
        }
        out.append(CommandItem(action: .importAppleNotes, title: "Import from Apple Notes…", symbol: "square.and.arrow.down", shortcut: nil,
                               keywords: ["import", "bring", "apple"]))
        for kind in importKinds {
            out.append(CommandItem(action: .importFrom(kind), title: kind.menuTitle, symbol: "square.and.arrow.down", shortcut: nil,
                                   keywords: ["import", "bring", kind.sourceName.lowercased()]))
        }
        out.append(CommandItem(action: .exportNotes, title: "Export All Notes…", symbol: "square.and.arrow.up", shortcut: nil, keywords: ["export", "markdown", "backup", "zip", "download"]))
        out.append(CommandItem(action: .connectAI, title: "Connect an AI…", symbol: "sparkles", shortcut: nil, keywords: ["ai", "chatgpt", "claude", "codex", "connect"]))
        out.append(CommandItem(action: .settings, title: "Settings…", symbol: "gearshape", shortcut: "⌘,", keywords: ["preferences", "account", "options"]))
        return out
    }

    /// What the commands would act on in a window showing `scope` with `selected` open, as
    /// RootView.newNote, ModelContext.openTodaysNote and the sidebar's New Folder do it. It only
    /// reads: no folder is made to name it.
    @MainActor static func targets(in context: ModelContext, scope: Scope?, selected: UUID?, now: Date = .now,
                        settings: TodaysNoteSettings = .load()) -> Targets {
        var t = Targets()
        let open = selected.flatMap { context.note($0) }
        if let open, open.trashedAt == nil, open.deletedAt == nil {
            t.note = open.title.isEmpty ? "New Note" : open.title
            t.pinned = open.isPinned
        }
        // New Note opens an untouched empty note again; otherwise it makes one in the folder shown,
        // or with All Notes (or Recently Deleted) in the first top-level folder.
        if scope != nil, RootView.reusesForNewNote(open), let f = open?.folder {
            t.newNoteFolder = f.name
        } else if case .folder(let id) = scope, let f = context.folder(id), f.deletedAt == nil {
            t.newNoteFolder = f.name
        } else {
            t.newNoteFolder = context.allFolders().filter { $0.parent == nil && !ModelContext.isSharedWithMe($0) }
                .min { $0.sortIndex < $1.sortIndex }?.name ?? "Notes"
        }
        let title = DailyNotes.title(for: now, as: settings.title)
        if let made = context.todaysNote(now: now, settings: settings) {
            t.today = made.title.isEmpty ? title : made.title
            t.todayFolder = made.folder?.name
        } else {
            t.today = title
            t.todayFolder = context.namedFolder(settings.folder)?.name ?? settings.folder
        }
        return t
    }

    /// The label over row `i`, or nil when it carries on the section above: Recent notes or Notes,
    /// Commands (one group, each command saying what it acts on: Emil, 9 November 2026, "it was
    /// better when all the commands were grouped together"), In note text.
    static func header(before i: Int, in rows: [Row], query: String) -> Header? {
        func kind(_ r: Row) -> Int { switch r { case .note: 0; case .command: 1; case .search: 2; case .text: 3 } }
        let k = kind(rows[i])
        guard k != 2, i == 0 || kind(rows[i - 1]) != k else { return nil }
        if k == 1 { return Header(title: "Commands") }
        if k == 3 { return Header(title: "In note text") }
        return Header(title: query.trimmingCharacters(in: .whitespaces).isEmpty ? "Recent notes" : "Notes")
    }

    /// Whether a command row shows what it acts on: whenever it acts on something outside the panel.
    static func showsDetail(_ c: CommandItem, query: String) -> Bool { c.detail != nil }

    /// Every row, in the order shown: the notes and the commands (the commands first when one of
    /// them answers the query better than any title), then the notes found by their text (none
    /// already listed by its title or folder), then searching every note for the text when that
    /// would find more notes than are listed (`listsMore`).
    static func rows(notes all: [NoteItem], commands: [CommandItem], query: String, textHits: [TextHit] = []) -> [Row] {
        let q = query.trimmingCharacters(in: .whitespaces)
        let found = notes(all, matching: q), runs = self.commands(commands, matching: q)
        let bestNote = found.first.flatMap { score($0.title, q) } ?? 9
        let bestCommand = runs.first.flatMap { c in [score(c.title, q), c.keywords.contains { $0.range(of: q, options: options.union(.anchored)) != nil } ? 2 : nil].compactMap { $0 }.min() } ?? 9
        let noteRows = found.map(Row.note), commandRows = runs.map(Row.command)
        var out = bestCommand < bestNote ? commandRows + noteRows : noteRows + commandRows
        if !q.isEmpty {
            let listed = Set(found.map(\.id))
            let byText = textHits.filter { !listed.contains($0.id) && score($0.title, q) == nil }.prefix(textLimit)
            out += byText.map(Row.text)
            if listsMore(all, query: q, shown: listed.union(byText.map(\.id)), textHits: textHits) { out.append(.search(q)) }
        }
        return out
    }

    /// Whether "Show all notes with" would find notes the panel doesn't list (Emil, 9 November
    /// 2026: one Welcome note, and the row still offered "all" of them). The list's search matches
    /// titles and note text; this counts notes, not lines. Titles are counted here, all of them;
    /// the text was read with a cap (`textLimit`), so a full read means there may be more. A
    /// query too short for the text to be read can match any note's text, so the row stays.
    static func listsMore(_ all: [NoteItem], query q: String, shown: Set<UUID>, textHits: [TextHit]) -> Bool {
        guard q.count >= textMinLength else { return true }
        if textHits.count >= textLimit { return true }
        if textHits.contains(where: { !shown.contains($0.id) }) { return true }
        return all.contains { !shown.contains($0.id) && score($0.title, q) != nil }
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
        fetch.propertiesToFetch = [\.summaryTitle, \.summaryPreview, \.updatedAt, \.lockedBody]
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
            fetch.propertiesToFetch = [\.summaryTitle, \.summaryPreview, \.updatedAt, \.lockedBody]
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
        NoteItem(id: n.id, title: n.title, folder: n.folder?.name, date: n.updatedAt, locked: n.isLocked,
                 preview: previewLine(locked: n.isLocked, preview: n.isLocked ? "" : n.preview))
    }

    /// What a note's second line says after its date: the list's own preview (kept as the note is
    /// saved, so nothing is read here), "Locked" for a locked note, as Notes has it.
    static func previewLine(locked: Bool, preview: String) -> String {
        if locked { return "Locked" }
        let p = preview.trimmingCharacters(in: .whitespacesAndNewlines)
        return p.isEmpty ? NoteText.noPreview : p
    }

    /// The first words a row shows after the title: none for an empty note (no "No additional
    /// text"), "Locked" for a locked one.
    static func shownPreview(_ n: NoteItem) -> String? {
        n.preview == NoteText.noPreview || n.preview.isEmpty ? nil : n.preview
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
    /// Bumped by ⌘K or ⌘O while the panel is open but the app has the keyboard: the field takes
    /// the cursor again.
    var focusRequest = 0
    /// Told when the field gains or loses the cursor, so ⌘K knows whether to close it or return.
    var focusChanged: (Bool) -> Void = { _ in }
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
    @Environment(\.colorSchemeContrast) private var contrast
    @Environment(\.colorScheme) private var scheme
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
        case .note(let n): [spoken(row), QuickOpen.shownPreview(n), n.folder].compactMap { $0 }.joined(separator: ", ")
        // Everything the row shows: the other lines and how many more were left out of VoiceOver.
        case .text(let t): ([spoken(row)] + t.others.map(\.text) + [t.more > 0 ? SearchLines.moreLine(t.more) : nil, t.folder]).compactMap { $0 }.joined(separator: ", ")
        case .command(let c): [spoken(row), c.detail?.text, c.shortcut].compactMap { $0 }.joined(separator: ", ")
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
    /// The row under the pointer: shown while the app has the keyboard, as the highlight isn't.
    @State private var hovered: Int?
    @State private var textHits: [QuickOpen.TextHit]
    @FocusState private var focused: Bool
    @State private var window = WeakWindow()

    /// `initialQuery`, `initialTextHits`: snapshots start with text typed and found.
    init(notes: [QuickOpen.NoteItem], commands: [QuickOpen.CommandItem], choose: @escaping (QuickOpen.Row) -> Void, close: @escaping () -> Void,
         searchText: (@Sendable (String) async -> [QuickOpen.TextHit])? = nil,
         initialQuery: String = "", initialTextHits: [QuickOpen.TextHit] = [],
         focusRequest: Int = 0, focusChanged: @escaping (Bool) -> Void = { _ in }) {
        self.focusRequest = focusRequest
        self.focusChanged = focusChanged
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
        /// Every row but a note found by its text: one line, notes and commands alike.
        static let row: CGFloat = 36
        /// A note found by its text: its title, and the line under it.
        static let textRow: CGFloat = 48
        /// Each further line under it: another line that holds the text, or "4 more in this note".
        static let textLine: CGFloat = 18
        static let header: CGFloat = 22
        /// A section's label, under the 14 pt titles.
        static let headerSize: CGFloat = 11
        /// What a command acts on, when it's words (today's date, "Top level").
        static let detailSize: CGFloat = 12
        /// A folder or note as a tag (`tag`): under the 13 pt first words, its glyph 2 pt under it.
        static let tagSize: CGFloat = 11.5
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

    /// Closes the panel, as Esc in the field, a chosen row, and ⌘K or ⌘O while it has the cursor
    /// do: the one way to close it while you're in the app.
    private var closeButton: some View {
        // Room around the glyph, as the sidebar's + has it: with none the hover fill hugged the
        // 13 pt × and didn't show (Emil, 9 November 2026: "this X has no hover state"). Muted, ink
        // under the pointer, beside the muted ⌘K.
        Button(action: close) {
            Image(systemName: "xmark")
                .font(.system(size: 12, weight: .semibold))
                .frame(width: 14, height: 14)
        }
        .buttonStyle(.quietIcon(padding: 5, lightens: true))
        .help("Close")
        .accessibilityLabel("Close Go to Note")
        .accessibilityIdentifier("quickOpen.close")
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
                    // Quieter while the app has the keyboard (Emil, 9 November 2026: click into a
                    // note to remember what to look for, and it stays).
                    .foregroundStyle(focused ? Color.ink : Color.muted)
                    .focused($focused)
                    .onSubmit { if rows.indices.contains(index) { jumpAndChoose(rows[index]) } }
                    // Held, the arrows repeat at the system's rate, as in any Mac list (Emil, 9 November
                    // 2026: "If I hold arrow down or up, logically it should move multiple times").
                    .onKeyPress(.downArrow, phases: [.down, .repeat]) { _ in
                        highlighted = QuickOpen.step(1, from: min(highlighted, max(rows.count - 1, 0)), count: rows.count); return .handled
                    }
                    .onKeyPress(.upArrow, phases: [.down, .repeat]) { _ in
                        highlighted = QuickOpen.step(-1, from: min(highlighted, max(rows.count - 1, 0)), count: rows.count); return .handled
                    }
                    .onKeyPress(.escape) { close(); return .handled }
                    .accessibilityLabel("Go to Note")
                    .accessibilityIdentifier("quickOpen.field")
                Self.shortcutKey
                closeButton
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
        // it appears in doesn't take it). A click in the app takes the cursor and leaves the panel
        // open, quieter (Emil, 9 November 2026: "I cant click into the app when it has search open,
        // without it closing search immediately"); ⌘K or a click in the field brings it back.
        .onAppear { focused = true; Task { @MainActor in focused = true } }
        .onChange(of: focused) { _, now in focusChanged(now) }
        .onChange(of: focusRequest) { focused = true }
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
        // A press on the panel isn't one on a list row under it; beside it, it is.
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { frame in
            guard let w = window.value else { return }
            RowPressSlop.cover = (w.windowNumber, frame, w.contentLayoutRect.maxY)
        }
        .onDisappear { RowPressSlop.cover = nil }
        #endif
        // One group with its own name; its field, rows and close button keep theirs.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("quickOpen")
    }

    private func list(_ rows: [QuickOpen.Row], index: Int) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.element.id) { i, row in
                        if let label = header(before: i, in: rows) {
                            // A small label over its rows, like the sidebar's and Spotlight's, well
                            // below the titles (Emil, 9 November 2026: they were the same size).
                            Text(label.title)
                                .font(.system(size: Metrics.headerSize, weight: .semibold))
                                .foregroundStyle(Color.muted)
                                .padding(.horizontal, 10)
                                .frame(height: Metrics.header, alignment: .bottomLeading)
                                .padding(.bottom, 2)
                                .accessibilityAddTraits(.isHeader)
                        }
                        rowView(row, on: focused ? i == index : i == hovered)
                            .id(row.id)
                            .onTapGesture { jumpAndChoose(row) }
                            // One row to VoiceOver, not its loose texts and symbols ("Text With A
                            // Magnifying Glass", round 18), and pressable.
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel(Self.rowLabel(row))
                            .accessibilityIdentifier("quickOpen.row")
                            .accessibilityAddTraits(i == index ? [.isButton, .isSelected] : .isButton)
                            .accessibilityAction { jumpAndChoose(row) }
                            .onHover { if $0 { highlighted = i; hovered = i } else if hovered == i { hovered = nil } }
                    }
                }
                .padding(6)
            }
            .scrollIndicators(.never)
            .frame(height: min(height(rows), Metrics.maxList))
            // At once, no easing: a held arrow scrolls with each step instead of piling up animations.
            .onChange(of: index) { _, i in
                guard rows.indices.contains(i) else { return }
                var now = Transaction()
                now.disablesAnimations = true
                withTransaction(now) { proxy.scrollTo(rows[i].id) }
            }
        }
    }

    /// A section's name above its first row: Recent notes, Notes, Commands, In note text.
    private func header(before i: Int, in rows: [QuickOpen.Row]) -> QuickOpen.Header? {
        QuickOpen.header(before: i, in: rows, query: query)
    }

    private func height(_ rows: [QuickOpen.Row]) -> CGFloat {
        let headers = rows.indices.filter { header(before: $0, in: rows) != nil }.count
        return rows.reduce(0) { $0 + Self.height(of: $1) } + CGFloat(headers) * (Metrics.header + 2) + 12
    }

    /// A row's height: a note found by its text grows a line for each further line it shows.
    static func height(of row: QuickOpen.Row) -> CGFloat {
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
                    // One line, as Raycast has it: an icon, the title in ink, the first words in grey,
                    // the folder on the right as a fainter, smaller tag. No date (Emil, 9 November
                    // 2026: two lines were "a bit too much... its all grey"; then the words and the
                    // folder looked "visually identical except for length and placement").
                    icon(n.locked ? "lock" : "doc.text", on: on, acts: false)
                    highlightedTitle(n.title.isEmpty ? "New Note" : n.title)
                        .lineLimit(1)
                        .layoutPriority(1)
                    if let words = QuickOpen.shownPreview(n) {
                        Text(words)
                            .font(.system(size: 13))
                            .foregroundStyle(Color.muted)
                            .lineLimit(1)
                            .truncationMode(.tail)
                            .accessibilityIdentifier("quickOpen.preview")
                    }
                    Spacer(minLength: 12)
                    if let f = n.folder {
                        Self.tag("folder", f, glyph: folderGlyph)
                            .fixedSize()
                            .accessibilityIdentifier("quickOpen.folder")
                    }
                case .sidebar:
                    // As the sidebar has it: an icon, the name in the accent when chosen, a figure at the end.
                    icon(n.locked ? "lock" : "doc.text", on: on, acts: false)
                    highlightedTitle(n.title.isEmpty ? "New Note" : n.title, ink: on ? Color(PColor.paneAccent) : Color.ink)
                    Spacer(minLength: 8)
                    Text(QuickOpen.dateText(n)).foregroundStyle(Color.muted).monospacedDigit()
                }
            case .text(let t):
                icon("text.magnifyingglass", on: on, acts: false)
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
                icon(c.symbol, on: on, acts: true)
                // The name and what it acts on share a baseline: "New Note [folder] Work" (Emil,
                // 9 November 2026: "I care that its 'create a new note in X folder'").
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                highlightedTitle(c.title)
                    .fixedSize()
                if let d = c.detail, QuickOpen.showsDetail(c, query: query) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        if let lead = d.lead {
                            Text(lead).font(.system(size: Metrics.detailSize)).foregroundStyle(Color.muted).fixedSize()
                        }
                        if let symbol = d.symbol {
                            Self.tag(symbol, d.name, glyph: symbol == "folder" ? folderGlyph : nil)
                        } else {
                            Text(d.name).font(.system(size: Metrics.detailSize)).foregroundStyle(Color.muted).lineLimit(1)
                        }
                    }
                    .accessibilityIdentifier("quickOpen.detail")
                }
                }
                Spacer(minLength: 8)
                if let s = c.shortcut { Text(s).foregroundStyle(Color.muted).monospacedDigit() }
            case .search(let q):
                // What it does: the list, filtered to every note that holds the text. The panel
                // shows only the first few (Emil, 11-03: "what is even Search all notes, aren't we
                // doing that").
                icon("list.bullet", on: on, acts: true)
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

    /// A folder (or note) as a quiet tag: a small, light glyph, then its name, in the faintest
    /// grey, the same on note rows and commands (Emil, 9 November 2026: the outline folder was as
    /// big and heavy as the text, and the note rows' folder had none, so it read as a folder in one
    /// place and not the other). The glyph is set inside the text, 2 pt under it, so it sits on the
    /// baseline and centres on the lower-case letters; a thin space keeps it close to the name.
    static func tag(_ symbol: String, _ name: String, glyph: Color? = nil) -> some View {
        (Text(Image(systemName: symbol)).font(.system(size: Metrics.tagSize - 2, weight: .light)).foregroundStyle(glyph ?? Color.faint)
            + Text("\u{2009}")
            + Text(name).font(.system(size: Metrics.tagSize)))
            .foregroundStyle(Color.faint)
            .lineLimit(1)
            .truncationMode(.tail)
    }

    /// The person's accent for glyphs; its deeper ink shade with Increase Contrast, as small text
    /// on white needs (the High contrast theme deepens both itself).
    private var accent: Color { contrast == .increased ? Color.amberInk : Color.paneAccent }
    /// A folder's glyph in a tag: the accent from A on, else the tag's own grey.
    private var folderGlyph: Color? { QuickOpen.tint == .none ? nil : accent }

    /// A row's icon. `acts`: a command (or the list's search), which the accent marks from A on;
    /// a note's icon stays grey until its row is chosen (B, C). C sits a command's icon on a tile.
    @ViewBuilder private func icon(_ symbol: String, on: Bool, acts: Bool) -> some View {
        let tint = QuickOpen.tint
        let lit = (acts && tint != .none) || (on && (tint == .b || tint == .c)) || (on && QuickOpen.look == .sidebar)
        let glyph = Image(systemName: symbol)
            .foregroundStyle(lit ? accent : Color.muted)
        if acts && tint == .c {
            glyph
                .font(.system(size: 12, weight: .medium))
                .frame(width: 24, height: 24)
                .background(accent.opacity(Self.tileFill(dark: scheme == .dark, increased: contrast == .increased)),
                            in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .frame(width: 24)
        } else {
            glyph
                .font(.system(size: 13, weight: .medium))
                .frame(width: QuickOpen.tint == .c ? 24 : 20)
        }
    }

    /// How much accent tints a command's tile (C): faint, a little more in the dark and with
    /// Increase Contrast, where a faint fill disappears.
    static func tileFill(dark: Bool, increased: Bool) -> Double { (dark ? 0.22 : 0.13) + (increased ? 0.1 : 0) }

    /// The title with the typed text in semibold, so you see why it matched.
    private func highlightedTitle(_ title: String, weight: Font.Weight = .regular, ink: Color = .ink) -> some View {
        var text = AttributedString(title)
        text.font = .system(size: 14, weight: weight)
        let q = query.trimmingCharacters(in: .whitespaces)
        if !q.isEmpty, let r = title.range(of: q, options: [.caseInsensitive, .diacriticInsensitive]),
           let lower = AttributedString.Index(r.lowerBound, within: text), let upper = AttributedString.Index(r.upperBound, within: text) {
            text[lower..<upper].font = .system(size: 14, weight: .semibold)
            if QuickOpen.tint == .b || QuickOpen.tint == .c { text[lower..<upper].foregroundColor = Color.amberInk }
        }
        return Text(text).foregroundStyle(ink).lineLimit(1)
    }

    /// The line that holds the text, the text itself in the ink's semibold and the rest muted.
    private func snippetText(_ s: QuickOpen.Snippet) -> some View {
        (Text(s.before) + Text(s.match).foregroundStyle(QuickOpen.tint == .b || QuickOpen.tint == .c ? Color.amberInk : Color.ink).fontWeight(.semibold) + Text(s.after))
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
    /// Whether a click (window coordinates, y up) is outside the panel (SwiftUI's global, y down).
    static func isOutside(_ point: CGPoint, of panel: CGRect, windowHeight: CGFloat) -> Bool {
        !panel.isEmpty && !panel.contains(CGPoint(x: point.x, y: windowHeight - point.y))
    }
}
#endif
