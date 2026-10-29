import Foundation
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
    /// A note in Recently Deleted: shown, not changed (like Notes). Recover it to edit.
    var readOnly = false
    /// Read-only, but its checkboxes still tick (the iPhone's welcome note, ticked by hand while
    /// it's being written). Ticked items stay where they are.
    var ticksWhileReadOnly = false
    /// Room kept free under the note's last line for something laid over the bottom (iPhone
    /// tips), so the text can always scroll clear of it.
    var bottomReserve: CGFloat = 0
    /// Collaboration (prototype): other people's carets in a shared note, drawn over the text.
    var remoteCarets: [RemoteCaret] = []
    /// The file being shown in Quick Look.
    var previewURL: URL?
    /// Files being fetched from the server.
    var downloading: Set<UUID> = []
    /// Looks up a file by id (set by the note screen, which has the model context).
    @ObservationIgnored var resolveAttachment: (UUID) -> Attachment? = { _ in nil }
    /// Copies files into Pane (set by the note screen, which has the model context).
    @ObservationIgnored var addFiles: ([URL]) -> [Attachment] = { _ in [] }
    @ObservationIgnored var addData: (Data, String, UTType) -> Attachment? = { _, _, _ in nil }
    /// Opens the file picker (set by the note screen).
    @ObservationIgnored var attach: () -> Void = {}
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

    func perform(_ make: (String, NSRange) -> TextEdit?) {
        guard let t = target, !readOnly else { return }
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
        if keyboard { target?.focusEditor() }
    }

    func refreshFormat() {
        guard let t = target else { return }
        let now = FormatState.at(t.currentText, selection: t.currentSelection)
        if now != format { format = now }
    }

    /// One of the panel's controls, on the selection or the caret's line, as Notes does it.
    func apply(_ control: FormatControl) {
        guard let t = target, !readOnly else { return }
        let state = FormatState.at(t.currentText, selection: t.currentSelection)
        guard state.isEnabled(control) else { return }
        switch control {
        case .title, .heading, .subheading, .body:
            // Choosing the style the line has keeps it, as in Notes.
            guard !state.isOn(control) else { break }
            if state.monostyled { perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) } }
            perform { ListEditing.paragraph(in: $0, selection: $1, level: control.headingLevel!) }
        case .monostyled:
            perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) }
        case .bold, .italic, .underline, .strikethrough:
            perform { FormatState.toggle(control.inline!, in: $0, selection: $1) }
        case .bulleted, .dashed, .numbered, .quote:
            // A code block or a heading becomes body text first: a list item is body text.
            if state.monostyled { perform { ListEditing.toggleCodeBlock(in: $0, selection: $1) } }
            if ListEditing.touchesHeading(in: t.currentText, selection: t.currentSelection) {
                perform { ListEditing.paragraph(in: $0, selection: $1, level: 0) }
            }
            perform { ListEditing.toggleLineStyle(in: $0, selection: $1, control.lineStyle!) }
        case .indent, .outdent:
            perform { ListEditing.indentLines(in: $0, selection: $1, outdent: control == .outdent) }
        }
        refreshFormat()
    }

    /// An AI's edit landed on the open note: tint what it changed.
    func tintChanges(from previous: String) { target?.tintChanges(from: previous) }
    func clearTint() { target?.clearTint() }

    func bold() { perform { ListEditing.wrap(in: $0, selection: $1, with: "**") } }
    func italic() { perform { ListEditing.wrap(in: $0, selection: $1, with: "*") } }
    func underline() { perform { ListEditing.underline(in: $0, selection: $1) } }
    func strikethrough() { perform { ListEditing.wrap(in: $0, selection: $1, with: "~~") } }
    func code() { perform { ListEditing.wrap(in: $0, selection: $1, with: "`") } }
    func checklist() { perform { ListEditing.toggleChecklist(in: $0, selection: $1) } }
    func heading(_ level: Int) { perform { ListEditing.heading(in: $0, selection: $1, level: level) } }

    func bulletList() { perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .bulleted) } }
    func dashedList() { perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .dashed) } }
    func numberedList() { perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .numbered) } }
    func blockQuote() { perform { ListEditing.toggleLineStyle(in: $0, selection: $1, .quote) } }

    /// With lines selected that have tabs or pipes between words, turns them into a table;
    /// otherwise inserts an empty 2×2 table and puts the keyboard in its first cell.
    func insertTable() {
        guard let t = target, !readOnly else { return }
        if let edit = TableText.edit(in: t.currentText, selection: t.currentSelection) {
            t.apply(edit)
        } else {
            t.insertGrid()
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

    /// Scrolls the text to the line at `location` (a link to a heading).
    func reveal(_ location: Int) { target?.reveal(location) }

    /// A note that is an app, for its widget where another note links it (set by the note screen).
    @ObservationIgnored var resolveNoteModel: (UUID) -> Note? = { _ in nil }
    /// Opens a note by id (set by the note screen).
    @ObservationIgnored var openNote: (UUID) -> Void = { _ in }
    /// Which wiki links lead to a note, for the editor's colours (set by the note screen).
    var wiki: WikiScope?
    /// Follows a wiki link by its target, or offers to make the note (set by the note screen).
    @ObservationIgnored var openWiki: (String) -> Void = { _ in }

    // MARK: Typing a wiki link

    /// Note titles offered while a wiki link is typed after `[[`, best first.
    private(set) var wikiSuggestions: [String] = []
    /// The one Return takes (Mac).
    var wikiChoice = 0
    /// Titles for what's typed (set by the note screen).
    @ObservationIgnored var suggestTitles: (String) -> [String] = { _ in [] }
    /// Where the typed part of the link is.
    @ObservationIgnored private(set) var wikiQuery: NSRange?
    /// A link whose suggestions were put away (Escape): not offered again while typing it.
    @ObservationIgnored private var wikiDismissed: Int?

    /// The text or caret changed: offer titles when the caret is in an unfinished `[[link`.
    func typingChanged(text: String, selection: NSRange?) {
        // The panel follows the caret: bold on, Heading lit, as it moves.
        if formatPanelShown { refreshFormat() }
        guard let sel = selection, sel.length == 0, let q = WikiLinks.typingQuery(in: text, caret: sel.location) else {
            wikiDismissed = nil
            clearWikiSuggestions()
            return
        }
        guard q.location != wikiDismissed else { clearWikiSuggestions(); return }
        wikiQuery = q
        let titles = suggestTitles((text as NSString).substring(with: q))
        if titles != wikiSuggestions {
            wikiSuggestions = titles
            wikiChoice = 0
        }
    }

    /// Finishes the link being typed with `title`, and puts the caret after it.
    func completeWiki(_ title: String) {
        guard let q = wikiQuery else { return }
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
        if table?.grid != grid || table?.cell != cell { table = TableContext(grid: grid, cell: cell) }
        target?.gridFieldFocused()
    }

    /// The keyboard went back to the text, or out of table `grid`.
    func leftTable(_ grid: Int? = nil) {
        guard let t = table, grid == nil || t.grid == grid else { return }
        table = nil
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
        case nil: [[item(.addRowAbove), item(.addRowBelow), item(.addColumnBefore), item(.addColumnAfter)],
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
}

/// A short confirmation over the note of something just done to it.
struct EditorNotice: Equatable, Identifiable {
    var id = UUID()
    var text: String
    var canUndo = false
}

@MainActor
protocol EditorTarget: AnyObject {
    var currentText: String { get }
    var currentSelection: NSRange { get }
    func apply(_ edit: TextEdit)
    func focusEditor()
    /// Scrolls the line at `location` to the top, focus left as it is.
    func reveal(_ location: Int)
    func insertGrid()
    /// The keyboard leaves a table, to the line above or below it.
    func leaveGrid(_ index: Int, below: Bool)
    /// Tints the lines an AI just changed compared with `previous`, then fades them.
    func tintChanges(from previous: String)
    /// Clears that tint at once.
    func clearTint()
    /// Takes text that changed elsewhere (sync, a collaborator), replacing only what differs.
    func syncExternal(_ new: String)
    /// Places other people's carets now, in the same pass as a text change (collaboration).
    func showRemoteCarets(_ carets: [RemoteCaret])
    /// Removes table `index` as one undoable edit, the keyboard back in the text.
    func deleteGrid(_ index: Int)
    /// Undoes the last edit (the notice's Undo).
    func undoLastEdit()
    /// Puts the keyboard in a cell of table `index`.
    func focusGrid(_ index: Int, cell: GridCell)
    /// A table cell's field just took the keyboard (the iPhone gives it the table toolbar).
    func gridFieldFocused()
    /// Shows a handle's menu by its handle.
    func showTableMenu(_ menu: TableMenu)
    /// The Format panel came up or went (iPhone: it takes the keyboard's place).
    func formatPanelChanged(shown: Bool)
}

extension EditorTarget {
    func deleteGrid(_ index: Int) {}
    func undoLastEdit() {}
    func focusGrid(_ index: Int, cell: GridCell) {}
    func gridFieldFocused() {}
    func showTableMenu(_ menu: TableMenu) {}
    func formatPanelChanged(shown: Bool) {}
}

extension EditorTarget {
    func reveal(_ location: Int) {}
}
