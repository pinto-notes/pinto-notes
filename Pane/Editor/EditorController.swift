import Foundation
#if os(macOS)
import AppKit
#endif
import Observation
import os
import UniformTypeIdentifiers

/// Lets toolbars and menus drive whichever editor is on screen.
@MainActor
@Observable
final class EditorController {
    /// Set by the platform text view while it is on screen.
    @ObservationIgnored weak var target: (any EditorTarget)?
    var isEditing = false
    /// The note's title has scrolled up out of view: the breadcrumbs add it after the folder.
    var titleScrolledAway = false
    /// A note in Recently Deleted: shown, not changed (like Notes). Recover it to edit.
    var readOnly = false
    /// Typing, clicking or tapping into a note in Recently Deleted: the note screen asks to recover it.
    @ObservationIgnored var askToRecover: () -> Void = {}
    /// Shown, and nothing more: no caret, keyboard, selection, menu, link or tick (the iPhone's
    /// welcome note before sign-in; once it's handed over it's an ordinary note).
    var inert = false
    /// Room kept free under the note's last line for something laid over the bottom (iPhone
    /// tips), so the text can always scroll clear of it.
    var bottomReserve: CGFloat = 0
    /// Collaboration (prototype): other people's carets in a shared note, drawn over the text.
    var remoteCarets: [RemoteCaret] = []
    /// In a shared note, Undo takes back only your own edits.
    var ownUndo: OwnUndo?
    /// Ticked items sink below the open ones a moment after the tick, except in a shared note.
    /// The move rewrites the list, and two people's rewrites at once merge into doubled lines
    /// (CollabTwoPeopleTests.whyTicksStayPutInASharedNote). There a tick changes one character and
    /// the item stays where it is, as with Notes' Sort Checked Items set to Manually.
    var sortsTickedItems: Bool { ownUndo == nil }
    /// The file being shown in Quick Look.
    var previewURL: URL?
    /// Files being fetched from the server.
    var downloading: Set<UUID> = []
    /// Looks up a file by id (set by the note screen, which has the model context).
    @ObservationIgnored var resolveAttachment: (UUID) -> Attachment? = { _ in nil }
    /// Share as Picture, for the selection's menu.
    @ObservationIgnored var sharePicture: () -> Void = {}
    @ObservationIgnored var canSharePicture: () -> Bool = { false }
    /// Copies files into Pane (set by the note screen, which has the model context).
    @ObservationIgnored var addFiles: ([URL]) -> [Attachment] = { _ in [] }
    @ObservationIgnored var addData: (Data, String, UTType) -> Attachment? = { _, _, _ in nil }
    /// Opens the file picker (set by the note screen).
    @ObservationIgnored var attach: () -> Void = {}
    /// Asks what to put in: a photo, a file or a link (iPhone; set by the note screen).
    @ObservationIgnored var attachChoices: () -> Void = {}
    /// Fetches a file that isn't on this device yet.
    @ObservationIgnored var download: @MainActor (Attachment) async -> Bool = { _ in false }

    // MARK: A note's images, fetched when it opens

    /// Bumps when images of the open note arrive: the editor lays their lines out again (their
    /// sizes are known now) and the embeds draw them.
    private(set) var imagesArrived = 0
    /// Images already asked for while this note is open: each is tried once, like a tap. One
    /// that fails stays a placeholder until it's tapped or the note is opened again.
    @ObservationIgnored private var imagesTried: Set<UUID> = []
    @ObservationIgnored private var imagesFor: UUID?
    /// Whether a file's bytes are on this device (tests answer for themselves).
    @ObservationIgnored var isLocal: (Attachment) -> Bool = { FileStore.exists($0) }

    /// At most this many of a note's images are fetched on their own (one at a time), and none
    /// larger than this: the rest wait for a tap, as every image did before.
    nonisolated static let autoImageLimit = 40
    nonisolated static let autoImageMaxBytes: Int64 = 25 * 1024 * 1024

    /// The images a note's text shows (`![name](pane-file:<id>)`), in order, each once.
    nonisolated static func imageIDs(in body: String) -> [UUID] {
        var out: [UUID] = []
        for m in body.matches(of: /!\[[^\]\n]*\]\(pane-file:([0-9a-fA-F-]{36})\)/) {
            if let id = UUID(uuidString: String(m.1)), !out.contains(id) { out.append(id) }
        }
        return out
    }

    /// The open note's images that are on the server and not on this device: fetched, one after
    /// the other, so a note opened on another device shows its pictures without a tap on each. Only
    /// images this note's text shows; never one that's here already, one this device hasn't sent,
    /// or one asked for before while the note is open.
    func fetchMissingImages(note: UUID, body: String) async {
        if imagesFor != note { imagesFor = note; imagesTried = [] }
        let wanted = Self.imageIDs(in: body).compactMap { resolveAttachment($0) }
            .filter { $0.isImage && $0.uploaded && $0.deletedAt == nil && $0.size <= Self.autoImageMaxBytes && !imagesTried.contains($0.id) && !isLocal($0) }
            .prefix(Self.autoImageLimit)
        for a in wanted {
            guard !Task.isCancelled else { return }
            imagesTried.insert(a.id)
            // Each shows as it arrives.
            let ok = await download(a)
            Self.log.notice("note image: \(ok ? "fetched" : Task.isCancelled ? "left before it arrived" : "fetch failed", privacy: .public)")
            if ok {
                imagesArrived += 1
            } else if Task.isCancelled {
                // The note was left mid-request: not a try that failed.
                imagesTried.remove(a.id)
            }
        }
    }

    func openAttachment(_ id: UUID) {
        guard let a = resolveAttachment(id) else { Self.log.notice("open file: this device has no row for it"); return }
        let url = FileStore.url(for: a.id, filename: a.filename)
        if FileStore.exists(a) { Self.log.notice("open file: here already"); previewURL = url; return }
        Self.log.notice("open file: fetching (\(a.isImage ? "image" : "file", privacy: .public))")
        downloading.insert(id)
        Task {
            let ok = await download(a)
            downloading.remove(id)
            Self.log.notice("open file: \(ok ? "fetched" : "fetch failed", privacy: .public)")
            if ok { previewURL = url; if a.isImage { imagesArrived += 1 } }
        }
    }

    private nonisolated static let log = Logger(subsystem: "dev.emilwagman.pane", category: "files")

    /// Inserts embed lines for files at the caret, each on its own line.
    func insertFiles(_ files: [Attachment]) {
        guard !files.isEmpty else { return }
        insertLines(files.map(\.markdown))
    }

    /// The title a link to this note is written with; nil for a note that can't be linked from
    /// here (this note itself, a deleted one).
    @ObservationIgnored var noteLinkTitle: (UUID) -> String? = { _ in nil }

    /// Notes dropped into the text: a link to each where the caret is, the kind `[[` makes
    /// (`[[Title]]`). Nothing is moved. Returns whether anything was inserted.
    @discardableResult
    func insertNoteLinks(_ ids: [UUID]) -> Bool {
        let titles = ids.compactMap { noteLinkTitle($0) }
        guard !titles.isEmpty, target != nil else { return false }
        perform { text, sel in Self.noteLinksEdit(titles: titles, in: text, selection: sel) }
        return true
    }

    /// The edit that puts links to `titles` at the selection: side by side, with a space before
    /// when they would otherwise run into the word they were dropped after.
    nonisolated static func noteLinksEdit(titles: [String], in text: String, selection: NSRange) -> TextEdit? {
        let links = titles.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.map { WikiLinks.markdown(target: $0) }
        guard !links.isEmpty else { return nil }
        let ns = text as NSString
        let at = min(selection.location, ns.length)
        let range = NSRange(location: at, length: min(selection.length, ns.length - at))
        var lead = ""
        if at > 0, let before = ns.substring(with: NSRange(location: at - 1, length: 1)).unicodeScalars.first, !CharacterSet.whitespacesAndNewlines.contains(before) { lead = " " }
        let replacement = lead + links.joined(separator: " ")
        return TextEdit(range: range, replacement: replacement, caret: at + (replacement as NSString).length)
    }

    /// The notes a drag from inside the app carries (`PaneDragItem`), from the data on its pasteboard.
    nonisolated static func draggedNotes(_ data: [Data]) -> [UUID] {
        var seen: Set<UUID> = []
        return data.compactMap { try? JSONDecoder().decode(PaneDragItem.self, from: $0) }
            .filter { $0.kind == .note }.flatMap(\.ids).filter { seen.insert($0).inserted }
    }

    /// Inserts whole lines (embeds, links) at the caret, each on its own line.
    func insertLines(_ lines: [String]) {
        guard !lines.isEmpty else { return }
        perform { text, sel in
            let ns = text as NSString
            let line = ns.lineRange(for: NSRange(location: min(sel.location, ns.length), length: 0))
            let lineText = ns.substring(with: line).trimmingCharacters(in: .whitespacesAndNewlines)
            let block = lines.joined(separator: "\n")
            if lineText.isEmpty {
                let body = block + "\n"
                return TextEdit(range: NSRange(location: line.location, length: line.length), replacement: body + (NSMaxRange(line) < ns.length && !ns.substring(with: line).hasSuffix("\n") ? "\n" : ""), caret: line.location + (body as NSString).length)
            }
            let at = NSMaxRange(line)
            let lead = ns.substring(with: line).hasSuffix("\n") ? "" : "\n"
            let body = lead + block + "\n"
            return TextEdit(range: NSRange(location: at, length: 0), replacement: body, caret: at + (body as NSString).length)
        }
    }

    /// The table cell being edited, if one is: editing commands act on it instead of the note.
    @ObservationIgnored var cell: CellHost?
    /// What editing commands act on: the cell being edited, or the note.
    var host: TextHost? { cell ?? target }

    func perform(_ make: (String, NSRange) -> TextEdit?) {
        guard let t = host, !readOnly else { return }
        if let edit = make(t.currentText, t.currentSelection) { t.apply(edit) }
        if formatPanelShown { refreshFormat() }
    }

    // MARK: The Format panel (iPhone)

    /// The Format panel is up in the keyboard's place.
    private(set) var formatPanelShown = false
    /// What the panel shows as on, for the caret's line and the selection. Kept while it's up.
    private(set) var format = FormatState()

    func showFormatPanel() {
        guard target != nil, !readOnly else { return }
        formatPanelShown = true
        refreshFormat()
        target?.formatPanelChanged(shown: true)
    }

    /// The close button: the panel goes and the keyboard comes back. `keyboard: false` when
    /// editing ended anyway (the text was swiped away, another note opened).
    func closeFormatPanel(keyboard: Bool = true) {
        guard formatPanelShown else { return }
        formatPanelShown = false
        target?.formatPanelChanged(shown: false)
        // In a cell the cell keeps the keyboard; the note mustn't take it.
        if keyboard, cell == nil { target?.focusEditor() }
    }

    // MARK: The Table panel (iPhone)

    /// The table's panel is up in the keyboard's place: its rows and columns, like the Format panel.
    private(set) var tablePanelShown = false

    func showTablePanel() {
        guard table != nil, !readOnly else { return }
        if formatPanelShown { formatPanelShown = false; target?.formatPanelChanged(shown: false) }
        tablePanelShown = true
        target?.tablePanelChanged(shown: true)
    }

    func closeTablePanel() {
        // Always asks the editor: the panel can still be up after the flag went (a cell's focus
        // flickering as the panel comes in), and Close has to take it down then too.
        tablePanelShown = false
        target?.tablePanelChanged(shown: false)
    }

    /// One of the Table panel's actions; the panel goes, so you can type in what it made.
    func runTablePanel(_ item: TableMenu.Item) {
        closeTablePanel()
        item.run()
    }

    /// The Checklist button in a table: the cell's column becomes ticks, or plain text again.
    /// A markdown cell can't hold a checklist; a Yes/No column is one (its cells tick with a tap).
    func toggleTickColumn() {
        guard let t = target, let at = table, !readOnly else { return }
        let all = GridTable.find(in: t.currentText)
        guard at.grid < all.count else { return }
        var g = all[at.grid]
        let c = at.cell.column
        var types = (0..<g.columns).map { g.type($0) }
        types[c] = types[c].isYesNo ? .text : .choice(["Yes", "No"])
        g.types = types
        t.apply(TextEdit(range: all[at.grid].range, replacement: g.markdown, caret: -1))
        // The header stays text: the keyboard goes there, out of a cell that's now a tick.
        let next = GridCell(row: 0, column: c)
        table = TableContext(grid: at.grid, cell: next)
        t.focusGrid(at.grid, cell: next)
    }

    func refreshFormat() {
        guard let t = host else { return }
        var now = FormatState.at(t.currentText, selection: t.currentSelection)
        now.inCell = cell != nil
        if now != format { format = now }
    }

    /// The text the last inline format left, to tell a second press from typing on after it.
    private var inlineToggled: String?

    /// One of the panel's controls, on the selection or the caret's line, as Notes does it.
    func apply(_ control: FormatControl) {
        guard let t = host, !readOnly else { return }
        var state = FormatState.at(t.currentText, selection: t.currentSelection)
        state.inCell = cell != nil
        guard state.isEnabled(control) else { return }
        switch control {
        case .title, .heading, .subheading, .body:
            // Choosing the style the line has keeps it, as in Notes.
            guard !state.isOn(control) else { break }
            if state.monostyled { perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) } }
            perform { ListEditing.paragraph(in: $0, selection: $1, level: control.headingLevel!) }
        case .monostyled:
            perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) }
        case .bold, .italic, .underline, .strikethrough, .highlight:
            let again = inlineToggled == t.currentText
            perform { FormatState.toggle(control.inline!, in: $0, selection: $1, stepsPast: !again) }
            inlineToggled = again ? nil : t.currentText
        case .bulleted, .dashed, .numbered, .quote:
            // A code block or a heading becomes body text first: a list item is body text.
            if state.monostyled { perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) } }
            if ListEditing.touchesHeading(in: t.currentText, selection: t.currentSelection) {
                perform { ListEditing.paragraph(in: $0, selection: $1, level: 0) }
            }
            perform { ListEditing.toggleLineStyle(in: $0, selection: $1, control.lineStyle!) }
        case .indent, .outdent:
            perform { ListEditing.indentLines(in: $0, selection: $1, outdent: control == .outdent) }
        case .divider:
            perform { Dividers.insert(in: $0, selection: $1) }
        case .callout:
            if ListEditing.touchesHeading(in: t.currentText, selection: t.currentSelection) {
                perform { ListEditing.paragraph(in: $0, selection: $1, level: 0) }
            }
            perform { Callouts.toggle(in: $0, selection: $1) }
        }
        refreshFormat()
    }

    /// An AI's edit landed on the open note: tint what it changed.
    /// `untilCleared`: it stays until you type, undo or leave, instead of fading on its own.
    func tintChanges(from previous: String, untilCleared: Bool = false) { target?.tintChanges(from: previous, untilCleared: untilCleared) }
    /// Whether any line is tinted right now.
    var isTinted: Bool { target?.isTinted ?? false }
    func clearTint() { target?.clearTint() }
    /// A restored version of the open note (see `EditorTarget.takeRestored`).
    func takeRestored(_ text: String) { target?.takeRestored(text) }

    func bold() { perform { ListEditing.wrap(in: $0, selection: $1, with: "**") } }
    func italic() { perform { ListEditing.wrap(in: $0, selection: $1, with: "*") } }
    func underline() { perform { ListEditing.underline(in: $0, selection: $1) } }
    func strikethrough() { perform { ListEditing.wrap(in: $0, selection: $1, with: "~~") } }
    func code() { perform { ListEditing.wrap(in: $0, selection: $1, with: "`") } }
    /// Format › Highlight: `==text==` on the selection or the word under the caret, or off again.
    func highlight() { perform { FormatState.toggle(.highlight, in: $0, selection: $1) } }
    func checklist() {
        if cell != nil { toggleTickColumn(); return }
        perform { ListEditing.toggleChecklist(in: $0, selection: $1) }
    }

    // MARK: Untick All

    /// The words on Format › Untick All, the right-click and long-press menus, and Edit › Undo.
    static let untickAllTitle = "Untick All"
    static let untickListTitle = "Untick All in This List"
    static let sharePictureTitle = "Share as Picture…"

    /// The caret is in a checklist with something ticked: Format › Untick All is on.
    private(set) var canUntickAll = false

    /// Follows the caret (`typingChanged`), so the menu item enables as it moves.
    func updateUntick(text: String, selection: NSRange?) {
        let at = (selection ?? target?.currentSelection)?.location
        let can = cell == nil && !readOnly && at.map { ListEditing.tickedCount(in: text, at: $0) > 0 } == true
        if can != canUntickAll { canUntickAll = can }
    }

    /// Unticks every item in the checklist at `location` (the caret's, by default), as Notes'
    /// Uncheck All: one step of Undo ("Undo Untick All"), and a notice that says how many, with Undo.
    func untickAll(at location: Int? = nil) {
        guard let t = target, cell == nil, !readOnly else { return }
        let at = location ?? t.currentSelection.location
        guard let u = ListEditing.untickAll(in: t.currentText, at: at) else { return }
        t.applyStep(u.edit, named: Self.untickAllTitle)
        updateUntick(text: t.currentText, selection: t.currentSelection)
        notice = EditorNotice(text: Self.untickedNotice(u.count), canUndo: true)
    }

    static func untickedNotice(_ count: Int) -> String { count == 1 ? "Unticked 1 item" : "Unticked \(count) items" }
    func heading(_ level: Int) { guard cell == nil else { return }; perform { ListEditing.heading(in: $0, selection: $1, level: level) } }

    /// Format › Move Item Up / Down: the caret's line or item past its neighbour (`MoveItem`).
    func moveItem(up: Bool) { guard cell == nil else { return }; perform { MoveItem.move(in: $0, selection: $1, up: up) } }
    func bulletList() { guard cell == nil else { return }; perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .bulleted) } }
    func dashedList() { guard cell == nil else { return }; perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .dashed) } }
    func numberedList() { guard cell == nil else { return }; perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .numbered) } }
    func blockQuote() { guard cell == nil else { return }; perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .quote) } }

    /// With lines selected that have tabs or pipes between words, turns them into a table;
    /// otherwise inserts an empty 2×2 table and puts the keyboard in its first cell.
    func insertTable() {
        // No table in a table's cell.
        guard let t = target, !readOnly, cell == nil else { return }
        if let edit = TableText.edit(in: t.currentText, selection: t.currentSelection) {
            t.apply(edit)
        } else {
            t.insertGrid()
        }
    }

    /// Format › Divider: a line across the note, under the caret's line (Dividers).
    func insertDivider() {
        guard cell == nil else { return }
        if let t = host, FormatState.at(t.currentText, selection: t.currentSelection).monostyled { return }
        perform { Dividers.insert(in: $0, selection: $1) }
    }

    /// Format › Callout: the caret's lines in a note callout (`> [!note]`), or out of the one
    /// they're in (Callouts).
    func insertCallout(_ kind: Callouts.Kind = .note) {
        guard cell == nil else { return }
        if let t = host, FormatState.at(t.currentText, selection: t.currentSelection).monostyled { return }
        perform { Callouts.toggle(in: $0, selection: $1, kind: kind) }
    }

    /// The callout whose first line starts at `line` becomes `kind` (its icon's type menu).
    func setCalloutKind(_ kind: Callouts.Kind, line: Int) {
        perform { text, _ in Callouts.setKind(kind, in: text, line: line) }
    }

    /// Format › Date: today's date at the caret. The note stores `2026-11-03`; the editor shows a
    /// chip that says Today (NoteDates).
    func insertDate() {
        guard cell == nil else { return }
        perform { text, sel in NoteDates.insertToday(in: text, selection: sel) }
    }

    /// Picking another day for a date chip: the date's text becomes that day.
    func changeDate(at range: NSRange, to day: Date) {
        perform { text, _ in
            let ns = text as NSString
            guard NSMaxRange(range) <= ns.length, NoteDates.date(at: range.location, in: text)?.range == range else { return nil }
            let body = NoteDates.text(for: day)
            return TextEdit(range: range, replacement: body, caret: range.location + (body as NSString).length)
        }
    }

    func insertLink() {
        perform { text, sel in
            let selected = (text as NSString).substring(with: sel)
            let body = "[\(selected.isEmpty ? "link" : selected)](https://)"
            return TextEdit(range: sel, replacement: body, caret: sel.location + (body as NSString).length - 1)
        }
    }

    func focus() { target?.focusEditor() }

    /// View › Collapse All Sections and Expand All Sections, as in Notes (HeadingFolds).
    func collapseAllSections() { target?.collapseAllSections() }
    func expandAllSections() { target?.expandAllSections() }

    /// Scrolls the text to the line at `location` (a link to a heading).
    func reveal(_ location: Int) { target?.reveal(location) }
    /// Goes to a found match and shows it: scrolled into view, and on the Mac the find flash.
    func showFound(_ range: NSRange) { target?.reveal(range.location); target?.flashFound(range) }

    /// A note that is an app, for its widget where another note links it (set by the note screen).
    @ObservationIgnored var resolveNoteModel: (UUID) -> Note? = { _ in nil }
    /// Opens a note by id (set by the note screen).
    @ObservationIgnored var openNote: (UUID) -> Void = { _ in }
    /// Which wiki links lead to a note, for the editor's colours (set by the note screen).
    var wiki: WikiScope?
    /// Follows a wiki link by its target, or offers to make the note (set by the note screen).
    @ObservationIgnored var openWiki: (String) -> Void = { _ in }
    /// Shows the notes with a tag, by its name without the `#` (set by the notes window).
    @ObservationIgnored var openTag: (String) -> Void = { _ in }
    /// Tags offered while one is typed after `#`, for what's typed (set by the notes window).
    @ObservationIgnored var suggestTags: (String) -> [String] = { _ in [] }
    /// A note's first lines and folder, for its card (`![[Title]]`; set by the note screen).
    @ObservationIgnored var notePreview: (UUID) -> (preview: String, folder: String?)? = { _ in nil }

    // MARK: Typing a wiki link

    /// Note titles offered while a wiki link is typed after `[[`, best first.
    private(set) var wikiSuggestions: [String] = []
    /// The one Return takes (Mac).
    var wikiChoice = 0
    /// Titles for what's typed (set by the note screen).
    @ObservationIgnored var suggestTitles: (String) -> [String] = { _ in [] }
    /// After `[[Note#`: that note's headings for what's typed after the `#` (set by the note screen).
    @ObservationIgnored var suggestHeadings: (_ target: String, _ typed: String) -> [String] = { _, _ in [] }
    /// The suggestions are headings of a note, not titles.
    private(set) var wikiHeadings = false
    /// The suggestions are tags, for a `#tag` being typed (Tags.typingQuery).
    private(set) var wikiTags = false
    /// Where the typed part of the link is.
    @ObservationIgnored private(set) var wikiQuery: NSRange?
    /// A link whose suggestions were put away (Escape): not offered again while typing it.
    @ObservationIgnored private var wikiDismissed: Int?

    /// The text or caret changed: offer titles when the caret is in an unfinished `[[link`.
    func typingChanged(text: String, selection: NSRange?) {
        // The panel follows the caret: bold on, Heading lit, as it moves.
        if formatPanelShown { refreshFormat() }
        updateUntick(text: text, selection: selection)
        updateSlash(text: text, selection: selection)
        guard let sel = selection, sel.length == 0 else {
            wikiDismissed = nil
            clearWikiSuggestions()
            return
        }
        let q: NSRange
        let offered: () -> [String]
        var tags = false
        if let t = WikiLinks.typingQuery(in: text, caret: sel.location) {
            q = t
            offered = { self.suggestTitles((text as NSString).substring(with: t)) }
        } else if let h = WikiLinks.typingHeading(in: text, caret: sel.location) {
            q = h.query
            offered = { self.suggestHeadings(h.target, (text as NSString).substring(with: h.query)) }
        } else if let t = Tags.typingQuery(in: text, caret: sel.location) {
            q = t
            tags = true
            offered = { self.suggestTags((text as NSString).substring(with: t)) }
        } else {
            wikiDismissed = nil
            clearWikiSuggestions()
            return
        }
        guard q.location != wikiDismissed else { clearWikiSuggestions(); return }
        let headings = !tags && q.location > 0 && (text as NSString).character(at: q.location - 1) == 0x23
        wikiQuery = q
        let titles = offered()
        if titles != wikiSuggestions || headings != wikiHeadings || tags != wikiTags {
            wikiSuggestions = titles
            wikiHeadings = headings
            wikiTags = tags
            wikiChoice = 0
        }
    }

    /// Finishes the link being typed with `title`, and puts the caret after it. A tag is finished
    /// with a space after it, so the next word can follow.
    func completeWiki(_ title: String) {
        guard let q = wikiQuery else { return }
        if wikiTags {
            perform { text, _ in
                let ns = text as NSString
                guard NSMaxRange(q) <= ns.length else { return nil }
                let spaced = NSMaxRange(q) < ns.length && ns.character(at: NSMaxRange(q)) == 0x20
                return TextEdit(range: q, replacement: title + (spaced ? "" : " "), caret: q.location + (title as NSString).length + 1)
            }
            clearWikiSuggestions()
            return
        }
        perform { text, _ in
            let ns = text as NSString
            guard NSMaxRange(q) <= ns.length else { return nil }
            let closed = NSMaxRange(q) + 2 <= ns.length && ns.substring(with: NSRange(location: NSMaxRange(q), length: 2)) == "]]"
            return TextEdit(range: q, replacement: title + (closed ? "" : "]]"), caret: q.location + (title as NSString).length + 2)
        }
        clearWikiSuggestions()
    }

    func dismissWikiSuggestions() {
        wikiDismissed = wikiQuery?.location
        clearWikiSuggestions()
    }

    private func clearWikiSuggestions() {
        wikiQuery = nil
        if !wikiSuggestions.isEmpty { wikiSuggestions = [] }
        if wikiHeadings { wikiHeadings = false }
        if wikiTags { wikiTags = false }
    }

    // MARK: The / menu

    /// Commands offered while a `/query` is typed (SlashCommands), best first.
    private(set) var slashCommands: [SlashCommand] = []
    /// The one Return takes (Mac).
    var slashChoice = 0
    /// How many of the first rows are the recent ones, with nothing typed yet: a line goes under
    /// them, so you can see why the order changed (council round 13).
    private(set) var slashRecentCount = 0
    /// The callout type the `/query` names (`/warn`): the Callout row says "Warning Callout" and
    /// inserts one.
    private(set) var slashCalloutKind: Callouts.Kind?

    /// A row's name and symbol, with the callout's type when the query names one.
    func slashName(_ c: SlashCommand) -> String { c == .callout ? slashCalloutKind.map { "\($0.title) Callout" } ?? c.name : c.name }
    func slashSymbol(_ c: SlashCommand) -> String { c == .callout ? slashCalloutKind?.symbol ?? c.symbol : c.symbol }
    /// Where the `/query` is, slash included.
    @ObservationIgnored private(set) var slashQuery: NSRange?
    /// A slash whose menu was put away (Escape): not offered again while typing after it.
    @ObservationIgnored private var slashDismissed: Int?
    @ObservationIgnored private var slashAnnounceWait: Task<Void, Never>?

    private func updateSlash(text: String, selection: NSRange?) {
        guard let sel = selection, !readOnly, cell == nil, WikiLinks.typingQuery(in: text, caret: sel.location) == nil,
              let found = SlashCommands.active(in: text, selection: sel, recent: SlashRecents.commands) else {
            // Letters that match nothing close the menu; say so, or VoiceOver hears nothing.
            if !slashCommands.isEmpty, let sel = selection, SlashCommands.query(in: text, caret: sel.location) != nil {
                announce(Self.slashNoMatches)
            }
            slashDismissed = nil
            clearSlash()
            return
        }
        guard found.query.location != slashDismissed else { clearSlash(); return }
        slashQuery = found.query
        let typed = (text as NSString).substring(with: NSRange(location: found.query.location + 1, length: found.query.length - 1))
        let kind = Callouts.kind(typed: typed)
        if kind != slashCalloutKind { slashCalloutKind = kind }
        let recent = typed.isEmpty ? SlashRecents.commands.filter(found.commands.contains).count : 0
        if recent != slashRecentCount { slashRecentCount = recent }
        if found.commands != slashCommands {
            let opening = slashCommands.isEmpty
            slashCommands = found.commands
            slashChoice = 0
            if opening {
                announceSlashChoice(opening: true)
            } else {
                // Filtering: say the new first choice once the typing pauses, not at every letter.
                slashAnnounceWait?.cancel()
                slashAnnounceWait = Task { @MainActor [weak self] in
                    try? await Task.sleep(for: .milliseconds(150))
                    guard !Task.isCancelled else { return }
                    self?.announceSlashChoice(opening: false)
                }
            }
        }
    }

    /// Takes the `/query` out of the line and runs `command` there.
    func runSlash(_ command: SlashCommand) {
        guard let q = slashQuery else { return }
        // Read before the query goes: taking it out of the text closes the menu and forgets it.
        let kind = slashCalloutKind ?? .note
        perform { text, _ in
            guard NSMaxRange(q) <= (text as NSString).length, (text as NSString).character(at: q.location) == 0x2F else { return nil }
            return TextEdit(range: q, replacement: "", caret: q.location)
        }
        clearSlash()
        SlashRecents.used(command)
        switch command {
        case .title: apply(.title)
        case .heading: apply(.heading)
        case .subheading: apply(.subheading)
        case .body: apply(.body)
        case .checklist: checklist()
        case .bulleted: apply(.bulleted)
        case .dashed: apply(.dashed)
        case .numbered: apply(.numbered)
        case .quote: apply(.quote)
        case .callout: insertCallout(kind)
        case .highlight: highlight()
        case .codeBlock: apply(.monostyled)
        case .table: insertTable()
        case .divider: insertDivider()
        case .date: insertDate()
        case .link: insertLink()
        // The `[[` titles open where it was, so a note is picked by name as you type.
        case .noteLink: perform { _, sel in TextEdit(range: sel, replacement: "[[", caret: sel.location + 2) }
        case .attach: attach()
        }
    }

    /// Return or Tab on the Mac: the highlighted command.
    func runSlashChoice() {
        guard !slashCommands.isEmpty else { return }
        runSlash(slashCommands[min(max(slashChoice, 0), slashCommands.count - 1)])
    }

    /// ↑ and ↓ wrap at the ends, as a Mac menu's do (council round 13).
    func moveSlashChoice(by step: Int) {
        guard !slashCommands.isEmpty else { return }
        let n = slashCommands.count
        slashChoice = ((slashChoice + step) % n + n) % n
        announceSlashChoice(opening: false)
    }

    /// What VoiceOver says as the menu opens and its choice moves: "Checklist, 1 of 18, ⇧⌘L"
    /// (the caret stays in the text, so nothing else tells it; council round 13).
    nonisolated static func slashAnnouncement(_ name: String, at i: Int, of n: Int, shortcut: String?, opening: Bool) -> String {
        var parts = [name, "\(i + 1) of \(n)"]
        if let shortcut { parts.append(shortcut) }
        return (opening ? "\(slashMenuName). " : "") + parts.joined(separator: ", ")
    }

    /// The menu's one name, as the hint calls it ("Type / for formatting").
    nonisolated static let slashMenuName = "Formatting menu"
    nonisolated static let slashNoMatches = "No matches"

    private func announceSlashChoice(opening: Bool) {
        #if os(macOS)
        guard slashCommands.indices.contains(slashChoice) else { return }
        let c = slashCommands[slashChoice]
        announce(Self.slashAnnouncement(slashName(c), at: slashChoice, of: slashCommands.count, shortcut: c.shortcut, opening: opening))
        #endif
    }

    /// The last thing said to VoiceOver about the menu (tests read it).
    @ObservationIgnored private(set) var lastSlashAnnouncement: String?

    private func announce(_ text: String) {
        lastSlashAnnouncement = text
        #if os(macOS)
        NSAccessibility.post(element: NSApp.mainWindow ?? NSApp as Any, notification: .announcementRequested,
                             userInfo: [.announcement: text, .priority: NSAccessibilityPriorityLevel.high.rawValue])
        #endif
    }

    func dismissSlash() {
        slashDismissed = slashQuery?.location
        clearSlash()
    }

    private func clearSlash() {
        slashAnnounceWait?.cancel()
        if slashRecentCount != 0 { slashRecentCount = 0 }
        slashQuery = nil
        if slashCalloutKind != nil { slashCalloutKind = nil }
        if !slashCommands.isEmpty { slashCommands = [] }
    }
    // MARK: Tables

    /// The table the keyboard is in, and the row or column picked by its handle. Set as a cell
    /// takes the keyboard; cleared when the keyboard goes back to the text.
    private(set) var table: TableContext?
    /// The last handle menu asked for (tests read it and run its items).
    @ObservationIgnored var lastTableMenu: TableMenu?
    /// False in tests: menus are made and kept in `lastTableMenu`, never put on screen.
    @ObservationIgnored var presentsTableMenus = true
    /// What just happened, said for a moment over the note ("Table deleted"), with Undo.
    var notice: EditorNotice?

    /// A cell of a table took the keyboard.
    func tableFocused(grid: Int, cell: GridCell) {
        if table?.grid != grid || table?.cell != cell {
            // Another cell: a panel up for the last one goes, and the keyboard is back.
            if table != nil {
                if formatPanelShown { formatPanelShown = false; target?.formatPanelChanged(shown: false) }
                if tablePanelShown { tablePanelShown = false; target?.tablePanelChanged(shown: false) }
            }
            table = TableContext(grid: grid, cell: cell)
        }
        target?.gridFieldFocused()
    }

    /// The keyboard went back to the text, or out of table `grid`.
    func leftTable(_ grid: Int? = nil) {
        guard let t = table, grid == nil || t.grid == grid else { return }
        table = nil
        cell = nil
        if tablePanelShown { tablePanelShown = false; target?.tablePanelChanged(shown: false) }
    }

    /// A row or column handle was tapped: its row or column is picked and its menu shows.
    func pickTableLine(_ line: GridLine, grid: Int, cell: GridCell) {
        table = TableContext(grid: grid, cell: cell, selected: line)
        let menu = tableMenu(grid: grid, cell: cell, line: line)
        lastTableMenu = menu
        if presentsTableMenus { target?.showTableMenu(menu) }
    }

    /// The menu of a row or column handle (`line`), or the toolbar's table menu (nil), like Notes.
    func tableMenu(grid: Int, cell: GridCell, line: GridLine?) -> TableMenu {
        let g = target.flatMap { t in GridTable.find(in: t.currentText).first { $0.index == grid } }
        func item(_ a: TableAction) -> TableMenu.Item {
            TableMenu.Item(title: a.title, systemImage: a.systemImage, destructive: a.isDestructive, enabled: g?.allows(a) ?? false) { [weak self] in
                self?.performTable(a, grid: grid, cell: cell)
            }
        }
        let delete = TableMenu.Item(title: "Delete Table", systemImage: "trash", destructive: true) { [weak self] in self?.deleteTable(grid: grid) }
        let sections: [[TableMenu.Item]] = switch line {
        case .row: [[item(.addRowAbove), item(.addRowBelow)], [item(.deleteRow)]]
        case .column: [[item(.addColumnBefore), item(.addColumnAfter)], [item(.deleteColumn)]]
        // The Table button's: what you add most first, nearest the button (Row Below, Column After).
        case nil: [[item(.addRowBelow), item(.addRowAbove), item(.addColumnAfter), item(.addColumnBefore)],
                   [item(.deleteRow), item(.deleteColumn)], [delete]]
        }
        return TableMenu(grid: grid, line: line, sections: sections)
    }

    /// The toolbar's table menu, for the cell with the keyboard.
    var currentTableMenu: TableMenu? { table.map { tableMenu(grid: $0.grid, cell: $0.cell, line: nil) } }

    /// Adds or deletes the row or column of `cell` in table `grid`; the keyboard stays in the table.
    func performTable(_ a: TableAction, grid: Int, cell: GridCell) {
        guard let t = target, !readOnly else { return }
        let all = GridTable.find(in: t.currentText)
        guard grid < all.count else { return }
        var g = all[grid]
        guard g.allows(a) else { return }
        let next = g.perform(a, at: cell)
        t.apply(TextEdit(range: all[grid].range, replacement: g.markdown, caret: -1))
        table = TableContext(grid: grid, cell: next)
        t.focusGrid(grid, cell: next)
    }

    /// A table's add bar: a row at the bottom or a column at the end, keyboard in it.
    func addToTable(_ kind: GridAdd, grid: Int) {
        guard let t = target, let g = GridTable.find(in: t.currentText).first(where: { $0.index == grid }) else { return }
        performTable(kind.action, grid: grid, cell: kind.from(g))
    }

    /// Removes table `grid` from the note, keyboard back in the text where it was. It's one
    /// step of Undo, and a notice says so with an Undo button, like Notes (no question first).
    func deleteTable(grid: Int) {
        guard let t = target, !readOnly, GridTable.find(in: t.currentText).contains(where: { $0.index == grid }) else { return }
        table = nil
        t.deleteGrid(grid)
        notice = EditorNotice(text: "Table deleted", canUndo: true)
    }

    /// The notice's Undo.
    func undoNotice() {
        notice = nil
        target?.undoLastEdit()
    }

    // MARK: The note's Undo button

    /// What the open note's own Undo can reach. Its floor is the note as it opened: the stack
    /// starts empty then, and again when a sync, a restore or an AI's undo replaces the text.
    private(set) var canUndo = false
    private(set) var canRedo = false

    /// Set by the editor whenever its undo stack changes.
    func undoChanged(canUndo: Bool, canRedo: Bool) {
        if self.canUndo != canUndo { self.canUndo = canUndo }
        if self.canRedo != canRedo { self.canRedo = canRedo }
    }

    /// The top bar's Undo: one step, the keyboard left as it is.
    func undo() { target?.undoStep(redo: false) }
    /// Its long press: Redo.
    func redo() { target?.undoStep(redo: true) }
}

/// A short confirmation over the note of something just done to it.
struct EditorNotice: Equatable, Identifiable {
    var id = UUID()
    var text: String
    var canUndo = false
}

/// Text the editing commands act on: the note, or the table cell being edited.
@MainActor
protocol TextHost: AnyObject {
    var currentText: String { get }
    var currentSelection: NSRange { get }
    func apply(_ edit: TextEdit)
}

/// The table cell being edited, for the editing commands (bold, a link, the Format panel): its
/// text, its selection, and a way to change them (set by the table while a cell has the keyboard).
@MainActor
final class CellHost: TextHost {
    let grid: Int
    let cell: GridCell
    private let read: () -> String
    private let selected: () -> NSRange
    private let write: (TextEdit) -> Void
    init(grid: Int, cell: GridCell, read: @escaping () -> String, selected: @escaping () -> NSRange, write: @escaping (TextEdit) -> Void) {
        self.grid = grid
        self.cell = cell
        self.read = read
        self.selected = selected
        self.write = write
    }
    var currentText: String { read() }
    var currentSelection: NSRange { selected() }
    func apply(_ edit: TextEdit) { write(edit) }
}

@MainActor
protocol EditorTarget: TextHost {
    var currentText: String { get }
    var currentSelection: NSRange { get }
    func apply(_ edit: TextEdit)
    func focusEditor()
    /// Scrolls the line at `location` to the top, focus left as it is.
    func reveal(_ location: Int)
    /// Flashes a found match (the Mac's find indicator).
    func flashFound(_ range: NSRange)
    func insertGrid()
    /// The keyboard leaves a table, to the line above or below it.
    func leaveGrid(_ index: Int, below: Bool)
    /// Tints the lines an AI just changed compared with `previous`, then fades them (with
    /// `untilCleared`, keeps them tinted until `clearTint` or typing).
    func tintChanges(from previous: String, untilCleared: Bool)
    /// Whether any line is tinted right now.
    var isTinted: Bool { get }
    /// Clears that tint at once.
    func clearTint()
    /// Takes text that changed elsewhere (sync, a collaborator), replacing only what differs.
    func syncExternal(_ new: String)
    /// Takes a restored version even if it's text you typed earlier (which `syncExternal` takes
    /// for its own echo), clears the undo steps and the tint, and keeps the scroll in the text.
    func takeRestored(_ new: String)
    /// Places other people's carets now, in the same pass as a text change (collaboration).
    func showRemoteCarets(_ carets: [RemoteCaret])
    /// Makes `edit` as one step of Undo named `name` ("Undo Untick All"), the caret, scroll and
    /// keyboard left as they are.
    func applyStep(_ edit: TextEdit, named name: String)
    /// Removes table `index` as one undoable edit, the keyboard back in the text.
    func deleteGrid(_ index: Int)
    /// Undoes the last edit (the notice's Undo).
    func undoLastEdit()
    /// Undoes (or redoes) one step without moving the keyboard (the note's Undo button).
    func undoStep(redo: Bool)
    /// Puts the keyboard in a cell of table `index`.
    func focusGrid(_ index: Int, cell: GridCell)
    /// Collapses or opens every section (HeadingFolds).
    func collapseAllSections()
    func expandAllSections()
    /// A table cell's field just took the keyboard (the iPhone gives it the table toolbar).
    func gridFieldFocused()
    /// Shows a handle's menu by its handle.
    func showTableMenu(_ menu: TableMenu)
    /// The Format panel came up or went (iPhone: it takes the keyboard's place).
    func formatPanelChanged(shown: Bool)
    /// The Table panel came up or went (iPhone: it takes the cell's keyboard's place).
    func tablePanelChanged(shown: Bool)
}

extension EditorTarget {
    func applyStep(_ edit: TextEdit, named name: String) { apply(edit) }
    func tablePanelChanged(shown: Bool) {}
    func deleteGrid(_ index: Int) {}
    func undoLastEdit() {}
    func undoStep(redo: Bool) {}
    func focusGrid(_ index: Int, cell: GridCell) {}
    func gridFieldFocused() {}
    func showTableMenu(_ menu: TableMenu) {}
    func formatPanelChanged(shown: Bool) {}
    func takeRestored(_ new: String) { syncExternal(new) }
}

extension EditorTarget {
    func reveal(_ location: Int) {}
    func flashFound(_ range: NSRange) {}
    func collapseAllSections() {}
    func expandAllSections() {}
    /// Tints, then fades on its own.
    func tintChanges(from previous: String) { tintChanges(from: previous, untilCleared: false) }
}
