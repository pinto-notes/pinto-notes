import SwiftUI
#if DEBUG && os(macOS)
import SwiftData
#endif
import os

/// A screen reader is running. Its user hears the note, not its markdown: the marks that show on
/// the caret's line stay hidden, or VoiceOver reads them out (first real VoiceOver pass, 6 November
/// 2026: "## The basics", "**markdown**", "[links](https://apple.com)").
@MainActor enum ScreenReader {
    /// Tests only.
    static var forced: Bool?
    static var isOn: Bool {
        if let forced { return forced }
        #if os(macOS)
        return NSWorkspace.shared.isVoiceOverEnabled
        #else
        return UIAccessibility.isVoiceOverRunning
        #endif
    }
}


/// Notes dropped into a note's text, in the system log ("drop"), so a real drag can be checked
/// without a picture of the screen.
enum TextDrop {
    nonisolated static let log = Logger(subsystem: "dev.emilwagman.pane", category: "drop")
}

/// The live-preview markdown editor. One instance per open note.
struct MarkdownEditor: View {
    /// The note's current body. Changes from elsewhere (sync, an AI) flow into the editor.
    let initialText: String
    let header: String
    let controller: EditorController
    var autofocus = false
    var identifier = "editor"
    var titleLine = true
    /// False for a shared note (collaboration prototype): its text arrives through the controller's
    /// target as it merges, never through `initialText`, which can be a render behind your typing.
    var followsInitialText = true
    /// iPhone: opens with the date in view (the welcome note, and the note it becomes). Other notes
    /// open at their title, the date just above the top (DateFold).
    var dateShown = false
    /// What sits under the note's last line and scrolls with it: the notes that link here.
    var foot: NoteLinks? = nil
    /// The note whose collapsed sections this device keeps (HeadingFolds); nil keeps them only while open.
    var foldsID: UUID? = nil
    let onChange: (String) -> Void

    var body: some View {
        PlatformEditor(initialText: initialText, header: header, controller: controller, autofocus: autofocus, identifier: identifier, titleLine: titleLine, followsInitialText: followsInitialText, dateShown: dateShown, foot: foot, foldsID: foldsID, onChange: onChange)
    }
}

/// How far under the last line the note's foot (its links) starts.
enum EditorFoot {
    static let gap: CGFloat = 36
}

/// Behaviour shared by the UIKit and AppKit text views.
@MainActor
final class EditorCore {
    var styler = MarkdownStyler()
    let layoutDelegate = DecoratingLayoutDelegate()
    /// Collapsed sections (HeadingFolds), and what leaves their lines out of layout.
    let folds = FoldState()
    let foldDelegate = FoldingContentDelegate()
    var onChange: (String) -> Void = { _ in }
    var applyingEdit = false
    /// Checklist lines ticked since the last sort. Each tick starts the wait again, so quick
    /// ticks settle once, together, and nothing moves under a pointer that's still ticking.
    private var pendingSort: DispatchWorkItem?
    private var ticked: [Int] = []
    /// Reorders sliding into place now.
    private(set) var slides: [ReorderSlide.Running] = []
    private var lastActiveLine: NSRange?
    /// Each table's handle targets, by its index (see GridHitBox).
    var gridBoxes: [Int: GridHitBox] = [:]
    /// Live views currently placed over the text.
    private(set) var embeds: [LineEmbed] = []
    private(set) var grids: [GridTable] = []
    /// Looks up a file so images can be sized (set by the text view).
    var resolveAttachment: (UUID) -> Attachment? = { _ in nil }
    /// Called after a restyle, so the view can place live views.
    var onCardsChanged: () -> Void = {}

    /// An empty 2×2 table after the caret's line; returns the edit and the table's index.
    func newGridEdit(text: String, selection: NSRange) -> (TextEdit, Int) {
        let ns = text as NSString
        let line = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: 0))
        let empty = ns.substring(with: line).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let at = empty ? line.location : NSMaxRange(line)
        var lead = empty || ns.substring(with: line).hasSuffix("\n") ? "" : "\n"
        // Straight under a line of text, markdown reads that line as part of the table: it was
        // drawn bold in the header's fill (Emil's table walkthrough, 1 November 2026). A blank
        // line keeps it text, here and in any other markdown app.
        if at > 0, !ns.substring(with: ns.lineRange(for: NSRange(location: at - 1, length: 0))).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lead += "\n"
        }
        let body = lead + "|  |  |\n| --- | --- |\n|  |  |\n"
        let index = GridTable.find(in: ns.substring(to: at)).count
        // The caret ends up after the table, so the table isn't shown as source.
        return (TextEdit(range: NSRange(location: at, length: empty ? line.length : 0), replacement: body + (empty ? "\n" : ""), caret: at + (body as NSString).length), index)
    }


    /// What a live view shows: when it's the same as last time, the view needn't be given again.
    enum CardContent: Equatable {
        case grid(GridTable, request: GridFocusRequest?, selected: Bool)
        /// `resolved`: its file is here (one can arrive by sync after the line that shows it).
        case embed(LineEmbed, controller: ObjectIdentifier?, resolved: Bool)
    }

    /// Every live view to place over the text: cards and embeds, keyed for reuse.
    func overlays(layout: NSTextLayoutManager?, origin: CGPoint, target: EditorTarget, storage: NSTextStorage, controller: EditorController?, selection: @escaping () -> NSRange?) -> [(key: String, frame: CGRect, view: AnyView, content: CardContent)] {
        guard let tlm = layout, let tcm = tlm.textContentManager, let container = tlm.textContainer else { return [] }
        let width = container.size.width - container.lineFragmentPadding * 2
        // How far the note is laid out for this pass: each card lays out only what lies between
        // the one before it and itself.
        var laidOut = tcm.documentRange.location
        func frame(at offset: Int, height: CGFloat, maxWidth: CGFloat = .infinity) -> CGRect? {
            guard let loc = tcm.location(tcm.documentRange.location, offsetBy: offset) else { return nil }
            // The lines above too: laid out on their own, they keep the text system's guess at
            // their height, and the card went where that guess put it (80 points high, over its
            // heading, when the window hadn't laid the note out yet).
            if loc.compare(laidOut) == .orderedDescending, let above = NSTextRange(location: laidOut, end: loc) {
                tlm.ensureLayout(for: above)
                laidOut = loc
            }
            tlm.ensureLayout(for: NSTextRange(location: loc))
            guard let frag = tlm.textLayoutFragment(for: loc), let line = frag.textLineFragments.first else { return nil }
            let y = frag.layoutFragmentFrame.minY + line.typographicBounds.minY + origin.y
            return CGRect(x: origin.x + container.lineFragmentPadding, y: y, width: min(width, maxWidth), height: height)
        }
        func resolved(_ e: LineEmbed) -> Bool {
            switch e.kind {
            case .file(let id, _), .image(let id, _): controller?.resolveAttachment(id) != nil
            case .link, .note, .wiki: true
            }
        }
        var out: [(String, CGRect, AnyView, CardContent)] = []
        for g in grids where !folds.isHidden(g.range.location) {
            // The row handles sit in the margin, so the grid lines up with the text.
            guard var f = frame(at: g.range.location, height: GridMetrics.height(g)) else { continue }
            f.origin.x -= GridMetrics.handle
            f.size.width += GridMetrics.handle
            // The handle targets' reach over the line above (iPhone; see GridMetrics.reach).
            f.origin.y -= GridMetrics.reach
            f.size.height += GridMetrics.reach
            // The add bars' strips, right of and below the table (GridMetrics.growRight, growBelow).
            f.size.width += GridMetrics.growRight
            f.size.height += GridMetrics.growBelow
            let request = gridFocus?.grid == g.index ? gridFocus : nil
            let isSelected = armedGrid == g.index
            let box = gridBoxes[g.index] ?? GridHitBox()
            gridBoxes[g.index] = box
            let view = TableGridView(table: g, focusRequest: request, selected: isSelected, controller: controller, box: box,
                                     exit: { [weak target] below in target?.leaveGrid(g.index, below: below) }) { edited in
                // Find the table again in the current text: earlier edits may have moved it.
                let now = GridTable.find(in: target.currentText)
                guard edited.index < now.count else { return }
                let edit = TextEdit(range: now[edited.index].range, replacement: edited.markdown, caret: -1)
                #if os(macOS)
                if let view = target as? PaneTextView { view.applyCellEdit(edit); return }
                #endif
                target.apply(edit)
            }
            out.append(("g\(g.index)", f, AnyView(view), .grid(g, request: request, selected: isSelected)))
        }
        for e in embeds where !folds.isHidden(e.range.location) {
            // Cards and pictures run the text's width, like the text (no max width, Emil 10-31).
            var maxW = CGFloat.infinity
            if case .note(let id, _) = e.kind, NoteWidgets.isApp(id) { maxW = NoteWidgets.maxWidth }
            // A picture has its own width (ImageSizes): the text's, or less.
            if case .image = e.kind { maxW = ImageSizes.size(for: e).width }
            guard let f = frame(at: e.range.location, height: e.height, maxWidth: maxW) else { continue }
            let remove = {
                let ns = target.currentText as NSString
                var r = ns.lineRange(for: e.range)
                if NSMaxRange(r) == ns.length, r.location > 0 { r = NSRange(location: r.location - 1, length: r.length + 1) }
                target.apply(TextEdit(range: r, replacement: "", caret: -1))
            }
            // Another style for the link on this line (LinkForms): the line written again.
            let original = NSMaxRange(e.range) <= (storage.string as NSString).length ? (storage.string as NSString).substring(with: e.range) : nil
            let rewrite = { (line: String) in
                // Only while the line is still what the view was made from.
                let ns = target.currentText as NSString
                guard NSMaxRange(e.range) <= ns.length, ns.substring(with: e.range) == original else { return }
                target.apply(TextEdit(range: e.range, replacement: line, caret: -1))
            }
            out.append((e.key, f, AnyView(EmbedView(embed: e, controller: controller, remove: remove, rewrite: rewrite)), .embed(e, controller: controller.map(ObjectIdentifier.init), resolved: resolved(e))))
        }
        return out
    }


    /// Restyles if the text changed or the caret moved to another line.
    /// `selection` is nil when you're not editing: then all syntax stays hidden.
    private var lastLinkEdit: NSRange?
    private static let writtenLink = try! NSRegularExpression(pattern: #"\[[^\]\n]*\]\([^)\n]*\)"#)

    /// The written link on `line` the caret is inside or the selection touches.
    static func linkBeingEdited(_ ns: NSString, line: NSRange, selection s: NSRange) -> NSRange? {
        writtenLink.matches(in: ns as String, range: line).lazy.map(\.range).first { r in
            s.length > 0 ? NSIntersectionRange(s, r).length > 0 : (s.location > r.location && s.location < NSMaxRange(r))
        }
    }

    func restyle(_ storage: NSTextStorage, selection caret: NSRange?, force: Bool) {
        let selection = ScreenReader.isOn ? nil : caret
        let ns = storage.string as NSString
        var line = NSRange(location: NSNotFound, length: 0)
        if let selection, ns.length > 0 {
            line = ns.lineRange(for: NSRange(location: min(selection.location, ns.length), length: min(selection.length, ns.length - min(selection.location, ns.length))))
        }
        // A date shows as written while the caret is inside it, so moving into or out of one
        // restyles its line too.
        let dateEdit = selection.flatMap { sel in
            line.location == NSNotFound ? nil : NoteDates.dates(in: storage.string, range: line).first { NoteDates.editing($0.range, selection: sel) }?.range
        }
        // Bold and the like show their markers only while the caret is in them: on a line with any,
        // each caret move may change that.
        let emphasisCaret = selection.flatMap { sel in
            line.location != NSNotFound && ns.substring(with: line).contains(where: { "*_~`".contains($0) }) ? sel : nil
        }
        // A written link's markup shows only with the caret inside it, the same way.
        let linkEdit = selection.flatMap { sel in line.location == NSNotFound ? nil : Self.linkBeingEdited(ns, line: line, selection: sel) }
        if !force, dirty == nil, !needsFull, !folds.dirty, line == lastActiveLine, dateEdit == lastDateEdit, emphasisCaret == lastEmphasisCaret, linkEdit == lastLinkEdit { return }
        lastDateEdit = dateEdit
        lastEmphasisCaret = emphasisCaret
        lastLinkEdit = linkEdit
        let previous = lastActiveLine
        lastActiveLine = line
        let structure = self.structure(of: storage.string)
        let fences = structure.fences
        var region = needsFull || alwaysFull || fences != lastFenceCount || structure.hasNestedFence ? nil : self.region(ns, structure: structure, previous: previous ?? line, active: line)
        lastFenceCount = fences
        needsFull = false
        dirty = nil
        if region == nil, ns.length > Self.progressiveThreshold {
            // A long note: style the top now and the rest a chunk at a time,
            // so it opens at once. The active line is styled with the top.
            region = chunk(ns, structure: structure, from: 0, including: line)
            unstyledFrom = NSMaxRange(region!)
            styling = storage
            scheduleChunk()
        } else if region == nil {
            unstyledFrom = Int.max
        }
        // Images need their size before their line is laid out.
        for e in structure.embeds where region.map({ NSLocationInRange(e.range.location, $0) }) ?? true {
            if case .image(let id, _) = e.kind, let a = resolveAttachment(id) { ImageSizes.learn(id, url: FileStore.url(for: a.id, filename: a.filename)) }
        }
        lastRegions.append(region.map { "\($0)" } ?? "full")
        if lastRegions.count > 6 { lastRegions.removeFirst() }
        let blocks = styler.apply(to: storage, active: selection ?? NSRange(location: NSNotFound, length: 0), region: region, structure: structure)
        folds.apply(to: storage, code: structure.code, selection: selection)
        publish(blocks)
    }

    /// Collapsed sections changed (a chevron, the pointer over a heading, a menu command): hides
    /// and shows their lines and places the live views again. Returns whether what's hidden changed.
    @discardableResult
    func applyFolds(_ storage: NSTextStorage, selection: NSRange?) -> Bool {
        let changed = folds.apply(to: storage, code: structure(of: storage.string).code, selection: selection)
        if changed { onCardsChanged() }
        return changed
    }

    /// Images of this note arrived (EditorController.imagesArrived): their sizes can be read now,
    /// so their lines are laid out again.
    private var imagesTick = 0
    func setImages(_ tick: Int, storage: NSTextStorage, selection: NSRange?) {
        guard imagesTick != tick else { return }
        imagesTick = tick
        needsFull = true
        restyle(storage, selection: selection, force: true)
    }

    /// The text's width or the window's height changed: pictures are sized again (ImageSizes).
    func setImageBox(width: CGFloat, height: CGFloat, storage: NSTextStorage, selection: NSRange?) {
        guard width > 0, height > 0, abs(ImageSizes.column - width) > 1 || abs(ImageSizes.viewHeight - height) > 1 else { return }
        ImageSizes.column = width
        ImageSizes.viewHeight = height
        guard structure(of: storage.string).embeds.contains(where: { if case .image = $0.kind { true } else { false } }) else { return }
        needsFull = true
        restyle(storage, selection: selection, force: true)
    }

    /// The library's titles changed (or the note moved): wiki links are coloured again.
    func setWiki(_ wiki: WikiScope?, storage: NSTextStorage, selection: NSRange?) {
        guard styler.wiki != wiki else { return }
        styler.wiki = wiki
        needsFull = true
        restyle(storage, selection: selection, force: true)
    }

    /// The date the caret was last inside (it shows as written).
    private var lastDateEdit: NSRange?
    private var lastEmphasisCaret: NSRange?

    /// The callout icon under a point of the text container: its rect there and where its line
    /// starts. A tap or click on it opens the callout's type menu.
    func calloutIcon(at point: CGPoint, layout tlm: NSTextLayoutManager?) -> (rect: CGRect, line: Int)? {
        guard let tlm, let tcm = tlm.textContentManager,
              let frag = tlm.textLayoutFragment(for: point) as? DecoratedLayoutFragment,
              let icon = frag.calloutIconRect(), let start = frag.textElement?.elementRange?.location else { return nil }
        let f = frag.layoutFragmentFrame
        let rect = icon.offsetBy(dx: f.minX, dy: f.minY)
        // A finger needs more room than a pointer.
        #if os(iOS)
        let slop: CGFloat = 12
        #else
        let slop: CGFloat = 4
        #endif
        guard rect.insetBy(dx: -slop, dy: -slop).contains(point) else { return nil }
        return (rect, tcm.offset(from: tcm.documentRange.location, to: start))
    }

    /// A new day: every date chip's label is worked out again (Today becomes Yesterday).
    func dayChanged(storage: NSTextStorage, selection: NSRange?) {
        needsFull = true
        restyle(storage, selection: selection, force: true)
    }

    private var dayObserver: NSObjectProtocol?
    /// Calls `restyle` when the calendar day changes (also on waking past midnight).
    func watchDays(_ restyle: @escaping @MainActor () -> Void) {
        guard dayObserver == nil else { return }
        dayObserver = NotificationCenter.default.addObserver(forName: .NSCalendarDayChanged, object: nil, queue: .main) { _ in
            MainActor.assumeIsolated { restyle() }
        }
    }

    /// The last few restyle regions, for tests that check incremental styling.
    private(set) var lastRegions: [String] = []

    /// Live views only for lines already styled (their space is reserved).
    private func publish(_ blocks: StyledBlocks) {
        embeds = blocks.embeds.filter { $0.range.location < unstyledFrom }
        grids = blocks.grids.filter { $0.range.location < unstyledFrom }
        onCardsChanged()
    }

    // MARK: Progressive styling

    /// Notes longer than this open with their top styled first.
    static let progressiveThreshold = 24_000
    private static let chunkSize = 16_000
    /// Everything from here on hasn't been styled yet (Int.max: all styled).
    private(set) var unstyledFrom = Int.max
    private weak var styling: NSTextStorage?
    private var chunkScheduled = false

    /// Whole lines from `from`, about one chunk long, never cutting a code block
    /// or table, and reaching at least to the end of `including`.
    private func chunk(_ ns: NSString, structure: NoteStructure, from: Int, including: NSRange) -> NSRange {
        var end = min(ns.length, from + Self.chunkSize)
        if including.location != NSNotFound { end = max(end, min(ns.length, NSMaxRange(including))) }
        end = end < ns.length ? NSMaxRange(ns.lineRange(for: NSRange(location: end, length: 0))) : ns.length
        var r = NSRange(location: from, length: end - from)
        let blocks = structure.code + structure.grids.map { ns.lineRange(for: $0.range) }
        var grew = true
        while grew {
            grew = false
            for b in blocks where NSIntersectionRange(b, r).length > 0 {
                let u = NSUnionRange(b, r)
                if u != r { r = u; grew = true }
            }
        }
        return r
    }

    private func scheduleChunk() {
        guard !chunkScheduled else { return }
        chunkScheduled = true
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.chunkScheduled = false
            self.styleNextChunk()
        }
    }

    private func styleNextChunk() {
        guard let storage = styling, unstyledFrom < storage.length else { unstyledFrom = Int.max; return }
        let ns = storage.string as NSString
        let structure = self.structure(of: storage.string)
        let r = chunk(ns, structure: structure, from: unstyledFrom, including: NSRange(location: NSNotFound, length: 0))
        let active = lastActiveLine.flatMap { $0.location == NSNotFound ? nil : $0 } ?? NSRange(location: NSNotFound, length: 0)
        let blocks = styler.apply(to: storage, active: active, region: r, structure: structure)
        folds.apply(to: storage, code: structure.code, selection: lastActiveLine.flatMap { $0.location == NSNotFound ? nil : NSRange(location: $0.location, length: 0) })
        unstyledFrom = NSMaxRange(r) >= ns.length ? Int.max : NSMaxRange(r)
        publish(blocks)
        if unstyledFrom != Int.max { scheduleChunk() }
    }

    // MARK: Incremental restyling

    /// Tests: restyle everything every time (to tell incremental bugs from others).
    var alwaysFull = false

    /// Characters changed since the last restyle, as the text storage reported them.
    private var dirty: NSRange?
    /// The next restyle covers the whole note (first show, big replacements).
    private var needsFull = true
    private var lastFenceCount = -1
    private var editObserver: NSObjectProtocol?

    /// Follows edits to the text so a restyle can cover just the lines that changed.
    func observe(_ storage: NSTextStorage) {
        if let editObserver { NotificationCenter.default.removeObserver(editObserver) }
        editObserver = NotificationCenter.default.addObserver(forName: NSTextStorage.didProcessEditingNotification, object: storage, queue: nil) { [weak self, weak storage] _ in
            guard let storage, storage.editedMask.contains(.editedCharacters) else { return }
            let edited = storage.editedRange, delta = storage.changeInLength
            MainActor.assumeIsolated { self?.noteEdit(edited, delta: delta) }
        }
    }

    func noteEdit(_ edited: NSRange, delta: Int) {
        version += 1
        folds.noteEdit(edited, delta: delta)
        func shift(_ r: NSRange) -> NSRange {
            // Ranges after the edit move with it; ranges it overlaps grow to cover it.
            let oldEnd = edited.location + edited.length - delta
            if r.location >= oldEnd { return NSRange(location: r.location + delta, length: r.length) }
            if NSMaxRange(r) <= edited.location { return r }
            return NSUnionRange(NSRange(location: r.location, length: max(0, r.length + delta)), edited)
        }
        dirty = dirty.map { NSUnionRange(shift($0), edited) } ?? edited
        if let l = lastActiveLine, l.location != NSNotFound { lastActiveLine = shift(l) }
        if unstyledFrom != Int.max, unstyledFrom > edited.location { unstyledFrom = max(edited.location, unstyledFrom + delta) }
        if edited.length > 20_000 || abs(delta) > 20_000 { needsFull = true }
    }

    /// Whole lines to restyle: the edit, the old and new active lines, the title
    /// if it's involved, grown until no code block or table is cut in two.
    /// Nil means the whole note.
    func region(_ ns: NSString, structure: NoteStructure, previous: NSRange, active: NSRange) -> NSRange? {
        let len = ns.length
        guard len > 0 else { return nil }
        func lines(_ r: NSRange) -> NSRange? {
            guard r.location != NSNotFound else { return nil }
            let loc = min(r.location, len)
            return ns.lineRange(for: NSRange(location: loc, length: min(r.length, len - loc)))
        }
        var parts = [dirty, previous, active].compactMap { $0 }.compactMap(lines)
        guard var r = parts.popLast() else { return nil }
        for p in parts { r = NSUnionRange(r, p) }
        // Markdown blocks run between blank lines (a paragraph's inline code, an HTML
        // block, a lazy quote line), and an edit can split or join lines: restyle the
        // whole run around the change, at most 100 lines each way.
        r = Self.blankLineRun(ns, around: r, maxLines: 100)
        // A typed-table comment or fence edited: everything may read differently.
        let touched = ns.substring(with: r)
        if touched.contains("<!--") || touched.contains("```") || touched.contains("~~~") { return nil }
        let title = MarkdownStyler.titleLocation(ns)
        if r.location <= title + 1 {
            // Near the title: the title (and the line after, which may become it) too.
            var end = title < len ? NSMaxRange(ns.lineRange(for: NSRange(location: title, length: 0))) : len
            if end < len { end = NSMaxRange(ns.lineRange(for: NSRange(location: end, length: 0))) }
            r = NSUnionRange(r, NSRange(location: 0, length: min(end, len)))
        }
        let blocks = structure.code + structure.grids.map { ns.lineRange(for: $0.range) }
        var grew = true
        while grew {
            grew = false
            for b in blocks where NSIntersectionRange(b, r).length > 0 || NSLocationInRange(r.location, b) {
                let u = NSUnionRange(b, r)
                if u != r { r = u; grew = true }
            }
        }
        // Past half the note, one full pass is simpler and no slower.
        return r.length > len / 2 ? nil : r
    }

    /// `r` grown to the blank lines (or note ends) around it, one extra line each
    /// way, at most `maxLines` lines further in either direction.
    static func blankLineRun(_ ns: NSString, around r: NSRange, maxLines: Int) -> NSRange {
        let len = ns.length
        func isBlank(_ line: NSRange) -> Bool {
            var i = line.location
            while i < NSMaxRange(line) {
                let c = ns.character(at: i)
                if c != 0x20 && c != 0x09 && c != 0x0A && c != 0x0D { return false }
                i += 1
            }
            return true
        }
        var start = r.location
        for n in 0...maxLines {
            guard start > 0 else { break }
            let prev = ns.lineRange(for: NSRange(location: start - 1, length: 0))
            start = prev.location
            if n > 0 && isBlank(prev) { break }
        }
        var end = NSMaxRange(r)
        for n in 0...maxLines {
            guard end < len else { break }
            let next = ns.lineRange(for: NSRange(location: end, length: 0))
            end = NSMaxRange(next)
            if n > 0 && isBlank(next) { break }
        }
        return NSRange(location: start, length: end - start)
    }

    /// Fenced-code markers in the note; when their count changes everything restyles.
    static func fenceCount(_ ns: NSString) -> Int {
        var n = 0
        var start = true
        var i = 0
        let len = ns.length
        while i < len {
            let c = ns.character(at: i)
            if start, c == 0x60 || c == 0x7E, i + 2 < len, ns.character(at: i + 1) == c, ns.character(at: i + 2) == c { n += 1 }
            start = c == 0x0A || (start && (c == 0x20 || c == 0x09))
            i += 1
        }
        return n
    }

    private var lastSelection: NSRange?
    /// Bumped on every edit, so the structure is scanned once per version of the text.
    private var version = 0
    private var structureCache: (version: Int, length: Int, structure: NoteStructure)?

    /// Code blocks, tables and embeds of the current text, scanned once per edit.
    func structure(of text: String) -> NoteStructure {
        let length = (text as NSString).length
        if let c = structureCache, c.version == version, c.length == length { return c.structure }
        let s = NoteStructure(text)
        structureCache = (version, length, s)
        return s
    }

    /// Tables and embeds, each a whole block the caret goes around.
    func blocks(in text: String) -> [EditorBlock] { structure(of: text).blocks }

    /// The type of what you're about to write on an empty line: the title's on the line that
    /// becomes the note's title (nothing but blank lines above it), body text on any other. Nil on
    /// a line with text, or in a code block, where the characters there set it.
    func emptyLineFont(_ text: String, at location: Int) -> PFont? {
        let ns = text as NSString
        guard location >= 0, location <= ns.length else { return nil }
        let line = ns.lineRange(for: NSRange(location: location, length: 0))
        let content = ns.substring(with: line).trimmingCharacters(in: .newlines)
        guard content.isEmpty else { return nil }
        if structure(of: text).code.contains(where: { NSLocationInRange(line.location, $0) }) { return nil }
        if styler.firstLineIsTitle, MarkdownStyler.titleLocation(ns) >= line.location { return MarkdownStyler.titleFont }
        return styler.bodyFont
    }

    /// What typing at `location` starts with: the line's own type on an empty line (see
    /// `emptyLineFont`), the body's otherwise (the styler restyles what you type).
    func typingAttributes(_ text: String, at location: Int) -> [NSAttributedString.Key: Any] {
        var a = styler.typingAttributes
        if let font = emptyLineFont(text, at: location), font == MarkdownStyler.titleFont {
            a[.font] = font
            a[.kern] = Palette.tracking(EditorMetrics.title)
        }
        return a
    }

    /// Where the caret should go instead, if it landed somewhere it can't be:
    /// inside a list marker, or inside a table's or embed's hidden markdown.
    /// `byKeyboard` is true when an arrow key moved it (then it enters a table
    /// like Notes); a click next to a block puts the caret after it.
    func caretFix(_ text: String, _ selection: NSRange, byKeyboard: Bool) -> CaretFix? {
        defer { lastSelection = selection }
        guard selection.length == 0 else { return nil }
        // Never in a collapsed section: past it going down, else at the end of its heading.
        if let to = HeadingFolds.caret(selection.location, previous: lastSelection?.location, hidden: folds.hidden, length: (text as NSString).length) {
            return .move(to)
        }
        if let b = blocks(in: text).first(where: { $0.contains(selection.location) }) {
            // Typing at the end of a block's last line: a table's separator row or an address
            // became a block under the caret. The caret stays where it's typing (persona r7: a
            // typed address split at "https://w", a typed table broke after "| -").
            if selection.location == NSMaxRange(b.range), let last = lastSelection, last.length == 0,
               last.location >= b.range.location, last.location < selection.location { return nil }
            let fromBelow = (lastSelection?.location ?? -1) > NSMaxRange(b.range)
            let fromAbove = lastSelection.map { $0.location < b.range.location } ?? false
            if byKeyboard, let g = b.grid, fromAbove || fromBelow {
                let rows = GridTable.find(in: text).first { $0.index == g }?.rows.count ?? 1
                return .enterGrid(g, GridCell(row: fromBelow ? rows - 1 : 0, column: 0))
            }
            // Clicks land after the block; the keyboard keeps its direction.
            if byKeyboard, fromBelow { return b.range.location > 0 ? .move(b.range.location - 1) : .newLineBefore(b.range.location) }
            let after = NSMaxRange(b.range)
            return after < (text as NSString).length ? .move(after + 1) : .newLineAfter(after)
        }
        return ListEditing.caretOutsideMarker(in: text, selection: selection, previous: lastSelection).map { .move($0) }
    }

    /// A grid cell the keyboard should move into: set when arrowing into a table, and for the
    /// first cell of a table just made. It stays until the keyboard leaves that table, so the
    /// grid gets it however many times its view is laid out before it shows (a one-shot flag
    /// was used up by the first of two layout passes, and the new table never got the keyboard).
    var gridFocus: GridFocusRequest?

    /// Delete next to a table or embed, like Notes: an embed goes at once; a table
    /// is selected first, and a second press removes it. Never merges a line into
    /// a block's markdown.
    func deleteNearBlock(_ text: String, _ sel: NSRange, forward: Bool) -> BlockDelete? {
        let all = blocks(in: text)
        func removal(_ b: EditorBlock) -> TextEdit { Self.removal(of: b.range, in: text) }
        guard sel.length == 0 else { return nil }
        let hit = forward ? all.first { $0.range.location > 0 && $0.range.location - 1 == sel.location }
                          : all.first { NSMaxRange($0.range) + 1 == sel.location }
        guard let b = hit else { armedGrid = nil; return nil }
        guard let g = b.grid else { return .delete(removal(b)) }
        if armedGrid == g, armedAt == sel { armedGrid = nil; return .delete(removal(b)) }
        armedGrid = g
        armedAt = sel
        return .arm(g)
    }

    /// The edit that removes a whole block (a table, an embed) and its line break.
    static func removal(of range: NSRange, in text: String) -> TextEdit {
        let ns = text as NSString
        var r = range
        if NSMaxRange(r) < ns.length { r.length += 1 } else if r.location > 0 { r.location -= 1; r.length += 1 }
        return TextEdit(range: r, replacement: "", caret: min(r.location, ns.length - r.length))
    }

    /// Where the caret can wait, outside table `range`, while the text takes the keyboard back to
    /// remove it: inside, the caret would be moved (and a line added) under the edit.
    static func caretOutside(_ range: NSRange, in text: String) -> Int {
        range.location > 0 ? range.location - 1 : min(NSMaxRange(range) + 1, (text as NSString).length)
    }

    /// A table marked for deletion by one press of Delete; the next press removes it.
    private(set) var armedGrid: Int?
    private var armedAt: NSRange?

    /// Any caret move or edit clears the mark. Returns true if there was one.
    @discardableResult
    func disarm(unless sel: NSRange) -> Bool {
        guard armedGrid != nil, sel != armedAt else { return false }
        armedGrid = nil
        armedAt = nil
        return true
    }

    /// Checkbox hit test: `point` is in text-container coordinates.
    /// The checklist circle on the line starting at `offset`, in text-container coordinates.
    func checkboxRect(line offset: Int, layout: NSTextLayoutManager?) -> CGRect? {
        guard let layout, let content = layout.textContentManager,
              let loc = content.location(content.documentRange.location, offsetBy: offset) else { return nil }
        layout.ensureLayout(for: NSTextRange(location: loc))
        guard let fragment = layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment,
              let d = fragment.decoration, case .checkbox = d.kind else { return nil }
        let f = fragment.layoutFragmentFrame
        return fragment.checkboxRect(d).offsetBy(dx: f.minX, dy: f.minY)
    }

    /// A quote line's bar and its first line's letters (top to foot), in text-container coordinates.
    func quoteBar(line offset: Int, layout: NSTextLayoutManager?) -> (bar: CGRect, text: ClosedRange<CGFloat>)? {
        guard let layout, let content = layout.textContentManager,
              let loc = content.location(content.documentRange.location, offsetBy: offset) else { return nil }
        layout.ensureLayout(for: NSTextRange(location: loc))
        guard let fragment = layout.textLayoutFragment(for: loc) as? DecoratedLayoutFragment,
              let d = fragment.decoration, case .quote = d.kind,
              let line = fragment.textLineFragments.first,
              let p = fragment.textElement as? NSTextParagraph, p.attributedString.length > 0,
              let font = p.attributedString.attribute(.font, at: 0, effectiveRange: nil) as? PFont else { return nil }
        let f = fragment.layoutFragmentFrame
        let baseline = f.minY + line.typographicBounds.minY + line.glyphOrigin.y
        return (fragment.quoteBarRect().offsetBy(dx: f.minX, dy: f.minY), (baseline - font.ascender)...(baseline - font.descender))
    }

    /// The checklist line whose circle is drawn at `point` (text-container coordinates; `viewY` is
    /// its height in the view). While rows slide, what's drawn there is a picture of a row, and
    /// that row is the one, wherever its text already is.
    func tickTarget(at point: CGPoint, viewY: CGFloat, layout: NSTextLayoutManager?) -> Int? {
        if let drawn = slides.lazy.compactMap({ $0.line(atY: viewY) }).first {
            guard let r = checkboxRect(line: drawn, layout: layout), abs(point.x - r.midX) < EditorMetrics.checkHitRadius else { return nil }
            return drawn
        }
        return checkboxLine(at: point, layout: layout)
    }

    /// Sorts the checklist around `line` once the ticks stop for `ListEditing.sortDelay`. Only if
    /// `text` is still as the tick left it: the lines are offsets into that text, and the sort isn't
    /// in Undo, so running it after an Undo, a move or an edit damaged the note (round 18: the next
    /// Undo left "- [ ] Rain jack- [ ] Chargers" and lost an item).
    func sortSoon(after line: Int, text: @escaping @MainActor () -> String, _ sort: @escaping @MainActor (Int) -> Void) {
        pendingSort?.cancel()
        if !ticked.contains(line) { ticked.append(line) }
        let seen = text()
        let work = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self else { return }
                let lines = self.ticked
                self.ticked = []
                self.pendingSort = nil
                guard text() == seen else { return }
                lines.forEach(sort)
            }
        }
        pendingSort = work
        DispatchQueue.main.asyncAfter(deadline: .now() + ListEditing.sortDelay, execute: work)
    }

    func slideStarted(_ slide: ReorderSlide.Running?) {
        slides.removeAll { $0.done }
        if let slide { slides.append(slide) }
    }

    /// Puts every sliding row where its text is, at once (a click or an edit while it slides).
    func endSlides() {
        slides.forEach { $0.stop() }
        slides = []
    }

    func checkboxLine(at point: CGPoint, layout: NSTextLayoutManager?) -> Int? {
        guard let layout, let fragment = layout.textLayoutFragment(for: point) as? DecoratedLayoutFragment,
              let d = fragment.decoration, case .checkbox = d.kind else { return nil }
        let x = point.x - fragment.layoutFragmentFrame.minX
        guard abs(x - d.markerX) < EditorMetrics.checkHitRadius else { return nil }
        guard let content = layout.textContentManager else { return nil }
        return content.offset(from: content.documentRange.location, to: fragment.rangeInElement.location)
    }
}

#if os(iOS)
import UIKit
import UniformTypeIdentifiers

private struct PlatformEditor: UIViewRepresentable {
    let initialText: String
    let header: String
    let controller: EditorController
    let autofocus: Bool
    let identifier: String
    let titleLine: Bool
    let followsInitialText: Bool
    let dateShown: Bool
    let foot: NoteLinks?
    let foldsID: UUID?
    let onChange: (String) -> Void

    func makeUIView(context: Context) -> PaneTextView {
        let view = PaneTextView(frame: .zero)
        view.core.styler.firstLineIsTitle = titleLine
        view.core.styler.wiki = controller.wiki
        view.dateShown = dateShown
        view.core.folds.noteID = foldsID
        view.configure(text: initialText, header: header)
        view.accessibilityIdentifier = identifier
        view.core.onChange = onChange
        controller.target = view
        view.controller = controller
        view.core.resolveAttachment = { [weak controller] id in controller?.resolveAttachment(id) }
        view.inputAccessoryView = FormatBarHost(controller: controller) { [weak view] in view?.resignFirstResponder() }
        view.setFoot(foot)
        if autofocus { DispatchQueue.main.async { view.becomeFirstResponder() } }
        return view
    }

    func updateUIView(_ view: PaneTextView, context: Context) {
        view.core.onChange = onChange
        view.setHeader(header)
        if followsInitialText { view.syncExternal(initialText) }
        if controller.target !== view { controller.target = view }
        view.setWiki(controller.wiki)
        view.setImages(controller.imagesArrived)
        // Recently Deleted: no keyboard, no caret.
        if view.isEditable == controller.readOnly { view.isEditable = !controller.readOnly }
        // The welcome: not even a selection, a menu or a link.
        if view.isSelectable == controller.inert { view.isSelectable = !controller.inert }
        // Read here so a change to it lays the text out again.
        _ = controller.bottomReserve
        view.showRemoteCarets(controller.remoteCarets)
        view.setFoot(foot)
        view.setNeedsLayout()
    }
}

/// Holds a table's view. Its top `GridMetrics.reach` points lie over the line above the table, and
/// its add bars' strips over the margin and the space below: a tap there is the table's only on a
/// handle's target or a bar, otherwise it goes to the text.
final class GridHolder: UIView {
    var box: GridHitBox?

    override func point(inside p: CGPoint, with event: UIEvent?) -> Bool {
        box?.takes(p, in: bounds.size) ?? bounds.contains(p)
    }
}

/// A handle's menu, opened from the handle as a pull-down menu, the same kind as the Table
/// button's. (An edit menu was tried first: by a handle at the edge of the screen it showed one
/// item at a time, and Delete was pages away.) An invisible button over the handle holds the
/// menu and opens it.
@MainActor
final class TableMenuPresenter {
    private weak var view: UIView?
    private let button = MenuButton(type: .custom)

    /// Says when its menu has closed.
    private final class MenuButton: UIButton {
        var closed: (() -> Void)?
        override func contextMenuInteraction(_ interaction: UIContextMenuInteraction, willEndFor configuration: UIContextMenuConfiguration,
                                             animator: (any UIContextMenuInteractionAnimating)?) {
            super.contextMenuInteraction(interaction, willEndFor: configuration, animator: animator)
            if let animator { animator.addCompletion { [weak self] in self?.closed?() } } else { closed?() }
        }
    }

    /// The menu closed (an item chosen or not).
    var closed: (() -> Void)? {
        get { button.closed }
        set { button.closed = newValue }
    }

    init(view: UIView) {
        self.view = view
        button.showsMenuAsPrimaryAction = true
        button.isUserInteractionEnabled = false
        button.isAccessibilityElement = false
        view.addSubview(button)
    }

    func present(_ menu: TableMenu, from rect: CGRect) {
        guard let view else { return }
        button.frame = rect
        view.bringSubviewToFront(button)
        button.menu = UIMenu(children: menu.sections.map { section in
            UIMenu(options: .displayInline, children: section.filter(\.enabled).map { item in
                UIAction(title: item.title, image: UIImage(systemName: item.systemImage), attributes: item.destructive ? .destructive : []) { _ in item.run() }
            })
        })
        // A turn later, once the button is where the handle is: opened at once, the menu came up
        // where the button was last time (by the row handle for a column's menu).
        DispatchQueue.main.async { [button] in button.performPrimaryAction() }
    }
}

/// A name flag with a little room around the text.
private final class PaddedLabel: UILabel {
    override var intrinsicContentSize: CGSize {
        let s = super.intrinsicContentSize
        return CGSize(width: s.width + 8, height: s.height + 2)
    }
    override func drawText(in rect: CGRect) { super.drawText(in: rect.insetBy(dx: 4, dy: 1)) }
}

final class PaneTextView: UITextView, UITextViewDelegate, EditorTarget, UIGestureRecognizerDelegate, UITextDropDelegate {
    let core = EditorCore()
    weak var controller: EditorController?
    private let headerLabel = UILabel()

    private var cardHosts: [String: UIHostingController<AnyView>] = [:]

    /// No writing tools over a note that can't be written in (Recently Deleted, the welcome note
    /// while it's being written): a tap selects or ticks there, and the bar came up with nothing
    /// to do (Emil, 29 October 2026).
    override var inputAccessoryView: UIView? {
        get { isEditable ? super.inputAccessoryView : nil }
        set { super.inputAccessoryView = newValue }
    }

    override var isEditable: Bool {
        didSet { if isEditable != oldValue, isFirstResponder { reloadInputViews() } }
    }

    func configure(text: String, header: String) {
        textLayoutManager?.delegate = core.layoutDelegate
        (textLayoutManager?.textContentManager as? NSTextContentStorage)?.delegate = core.foldDelegate
        core.folds.showsAtCaret = true
        delegate = self
        textDropDelegate = self
        // A text view only looks at drops of what it can paste: notes dragged from the list
        // (linked where they are dropped) are added to that.
        pasteConfiguration = UIPasteConfiguration(acceptableTypeIdentifiers: (pasteConfiguration?.acceptableTypeIdentifiers ?? []) + [UTType.paneItem.identifier])
        core.onCardsChanged = { [weak self] in self?.setNeedsLayout() }
        backgroundColor = .clear
        alwaysBounceVertical = true
        // No bar background behind Back, Share and More, however far the note is scrolled: the
        // buttons float on the page (Emil, 28 October 2026).
        topEdgeEffect.isHidden = true
        keyboardDismissMode = .interactive
        smartDashesType = .no
        smartQuotesType = .no
        linkTextAttributes = [:]
        typingAttributes = core.styler.typingAttributes
        self.text = text
        lastReported = text
        remember(text)
        // Undo's floor: the note as it opened.
        noteStack?.removeAllActions(); typing = nil; typedText = self.text
        observeUndo()
        if !watchingCells { watchingCells = true; watchCells() }
        core.observe(textStorage)
        core.restyle(textStorage, selection: nil, force: true)
        typingAttributes = core.typingAttributes(text, at: selectedRange.location)
        observeChangeHighlight()
        core.watchDays { [weak self] in
            guard let self else { return }
            self.core.dayChanged(storage: self.textStorage, selection: self.editingSelection)
        }

        // The welcome note's date line: small, regular, in the muted colour.
        headerLabel.font = .systemFont(ofSize: 13)
        headerLabel.textColor = Palette.muted
        headerLabel.textAlignment = .center
        headerLabel.accessibilityIdentifier = "editor.date"
        addSubview(headerLabel)
        setHeader(header)

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        tap.delegate = self
        addGestureRecognizer(tap)
        checkTap = tap
        accessibilityIdentifier = "editor"
        NotificationCenter.default.addObserver(self, selector: #selector(textSizeChanged), name: UIContentSizeCategory.didChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(textSizeChanged), name: UIAccessibility.boldTextStatusDidChangeNotification, object: nil)
    }

    func setHeader(_ s: String) {
        if headerLabel.text != s { headerLabel.text = s }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // The whole width, as on the Mac: no reading column (Emil, 31 October 2026).
        let side: CGFloat = 20
        let hasDate = !(headerLabel.text ?? "").isEmpty
        let foot = footHeight
        let inset = UIEdgeInsets(top: hasDate ? 44 : 14, left: side, bottom: 120 + (controller?.bottomReserve ?? 0) + (foot > 0 ? EditorFoot.gap + foot : 0), right: side)
        if textContainerInset != inset { textContainerInset = inset }
        headerLabel.frame = CGRect(x: 0, y: DateFold.labelTop, width: bounds.width, height: DateFold.labelHeight)
        foldDate(hasDate)
        // Pictures fit the text's width and at most 60% of the screen's height (ImageSizes).
        core.setImageBox(width: bounds.width - side * 2 - textContainer.lineFragmentPadding * 2, height: bounds.height,
                         storage: textStorage, selection: editingSelection)
        layoutCards()
        layoutRemoteCarets()
        placeFoot()
    }

    // MARK: The note's foot

    private var footHost: UIHostingController<NoteLinksSection>?
    private weak var footModel: NoteLinks?

    /// The foot's height, 0 when it shows nothing.
    var footHeight: CGFloat { (footModel?.height ?? 0) > 0.5 ? footModel!.height : 0 }
    /// Where the foot is (tests).
    var footFrame: CGRect? { footHost?.view.frame }

    func setFoot(_ model: NoteLinks?) {
        guard model !== footModel else { return }
        footHost?.view.removeFromSuperview()
        footHost = nil
        footModel = model
        if let model {
            let h = UIHostingController(rootView: NoteLinksSection(model: model))
            h.view.backgroundColor = .clear
            h.sizingOptions = []
            addSubview(h.view)
            footHost = h
            model.changed = { [weak self] in self?.setNeedsLayout() }
        }
        setNeedsLayout()
    }

    /// The foot's frame: lined up with the text, which starts the line fragment's padding inside
    /// the inset (the Mac's editor has no padding, the iPhone's does).
    static func footFrame(inset: UIEdgeInsets, padding: CGFloat, width: CGFloat, y: CGFloat, height: CGFloat) -> CGRect {
        CGRect(x: inset.left + padding, y: y, width: max(0, width - inset.left - inset.right - 2 * padding), height: height)
    }

    /// Under the last line, across the text's width.
    private func placeFoot() {
        guard let host = footHost, let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return }
        // Lazy TextKit 2 layout: see the Mac's placeFoot.
        if (footModel?.height ?? 0) > 0.5 { tlm.ensureLayout(for: tcm.documentRange) }
        let used = tlm.usageBoundsForTextContainer.maxY
        let frame = Self.footFrame(inset: textContainerInset, padding: textContainer.lineFragmentPadding, width: bounds.width,
                                   y: textContainerInset.top + used + EditorFoot.gap, height: max(footModel?.height ?? 0, 1))
        if host.view.frame != frame { host.view.frame = frame }
    }

    // MARK: Other people's carets (collaboration prototype)

    private var remoteCarets: [RemoteCaret] = []
    private var caretViews: [UUID: (bar: UIView, flag: UILabel, selection: [UIView])] = [:]

    /// `amount` of `color` over `ground`, as one opaque colour.
    static func mix(_ color: UIColor, into ground: UIColor, amount: CGFloat) -> UIColor {
        var (r1, g1, b1, a1): (CGFloat, CGFloat, CGFloat, CGFloat) = (0, 0, 0, 0)
        var (r2, g2, b2, a2): (CGFloat, CGFloat, CGFloat, CGFloat) = (0, 0, 0, 0)
        color.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        ground.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        return UIColor(red: r2 + (r1 - r2) * amount, green: g2 + (g1 - g2) * amount, blue: b2 + (b1 - b2) * amount, alpha: 1)
    }

    /// The welcome before sign-in never takes focus, so no keyboard or keyboard bar comes up.
    override var canBecomeFirstResponder: Bool {
        controller?.inert == true || puttingKeyboardAway ? false : super.canBecomeFirstResponder
    }
    /// Set while Hide keyboard puts a cell's keyboard away: UIKit hands a field's keyboard to its
    /// nearest ancestor that takes it, and that's this text view, so the keyboard stayed and the
    /// caret jumped to the end of the note (Emil's table walkthrough, 1 November 2026).
    private var puttingKeyboardAway = false

    func showRemoteCarets(_ carets: [RemoteCaret]) {
        guard carets != remoteCarets else { return }
        remoteCarets = carets
        layoutRemoteCarets()
    }

    /// Where a person's caret bar is drawn, if it is (tests).
    func remoteCaretFrame(_ id: UUID) -> CGRect? { caretViews[id].map(\.bar.frame) }

    /// A bar in the person's colour where their caret is, exactly the line's height, and a tint over
    /// what they've selected. Their first name sits on a small flag that never hides text it can
    /// avoid: above the line when the line above is empty (or there is none), below it otherwise.
    /// The flag shows while they type or just after their caret moves, then fades. Not
    /// hit-testable: you type and tap through them.
    private func layoutRemoteCarets() {
        let live = Set(remoteCarets.map(\.id))
        for (id, v) in caretViews where !live.contains(id) {
            v.bar.removeFromSuperview(); v.flag.removeFromSuperview(); v.selection.forEach { $0.removeFromSuperview() }
            caretViews[id] = nil
        }
        let ns = text as NSString
        let length = ns.length
        for c in remoteCarets {
            let color = UIColor(c.color)
            var v = caretViews[c.id] ?? {
                let bar = UIView(), flag = PaddedLabel()
                bar.isUserInteractionEnabled = false
                bar.layer.cornerRadius = 1
                flag.isUserInteractionEnabled = false
                flag.font = .systemFont(ofSize: RemoteCaret.flagFontSize, weight: .semibold)
                flag.textColor = .white
                flag.layer.cornerRadius = RemoteCaret.flagRadius
                flag.layer.masksToBounds = true
                addSubview(bar); addSubview(flag)
                return (bar, flag as UILabel, [])
            }()
            v.bar.backgroundColor = color
            v.flag.backgroundColor = color
            v.flag.text = c.name
            // A caret without a name (yours, on the welcome note) has no flag.
            v.flag.isHidden = c.name.isEmpty
            let loc = min(c.range.location, length), end = min(NSMaxRange(c.range), length)
            guard let pos = position(from: beginningOfDocument, offset: loc) else { continue }
            let rect = caretRect(for: pos)
            let size = CGSize(width: v.flag.intrinsicContentSize.width, height: RemoteCaret.flagHeight)
            // Above the caret, its bottom-left corner on the caret's top, as Notes and Figma do: it
            // labels the line the caret is on.
            let flagY = max(rect.minY - size.height, 0)
            // The caret and its flag jump to where the character is, in the same pass as the text
            // change: a caret is tied to a character, so it never glides.
            UIView.performWithoutAnimation {
                v.bar.frame = CGRect(x: rect.minX - 1, y: rect.minY, width: 2, height: rect.height)
                v.flag.frame = CGRect(x: min(rect.minX - 1, self.bounds.width - size.width - 4), y: flagY, width: size.width, height: size.height)
            }
            // Only the flag fades, a moment after they stop.
            let alpha: CGFloat = c.showsName ? 1 : 0
            if v.flag.alpha != alpha {
                UIView.animate(withDuration: alpha == 1 ? RemoteCaret.flagIn : RemoteCaret.flagOut) { v.flag.alpha = alpha }
            }
            v.selection.forEach { $0.removeFromSuperview() }
            v.selection = []
            if end > loc, let a = position(from: beginningOfDocument, offset: loc), let b = position(from: beginningOfDocument, offset: end),
               let range = textRange(from: a, to: b) {
                for r in selectionRects(for: range) where r.rect.width > 0 {
                    let tint = UIView(frame: r.rect)
                    // Solid, not see-through: the person's colour mixed into the page, behind the text.
                    tint.backgroundColor = Self.mix(color, into: Palette.page.resolvedColor(with: traitCollection), amount: 0.2)
                    tint.isUserInteractionEnabled = false
                    insertSubview(tint, at: 0)
                    v.selection.append(tint)
                }
            }
            caretViews[c.id] = v
        }
    }

    /// Keeps a short note scrollable by the date's height, and opens every note scrolled past it.
    private func foldDate(_ hasDate: Bool) {
        guard hasDate, bounds.height > 0 else { return }
        let fixed = adjustedContentInset.bottom - contentInset.bottom
        let extra = DateFold.bottomInset(viewHeight: bounds.height, contentHeight: contentSize.height,
                                         top: adjustedContentInset.top, bottom: fixed)
        if abs(contentInset.bottom - extra) > 0.5 { contentInset.bottom = extra }
        // A note that fits in the view has nowhere to scroll to past the fold. Typing in a new
        // sub-note left it further up all the same (the text view scrolled to the caret before
        // the room below was counted again), with its title under the "‹ Parent" link.
        let folded = DateFold.offset(top: adjustedContentInset.top)
        if extra > 0, !isTracking, !isDecelerating, contentOffset.y > folded + 0.5 {
            contentOffset = CGPoint(x: contentOffset.x, y: folded)
        }
        guard !DateFold.showOnOpen, !dateShown, !pulledDate, !isTracking, !isDecelerating else { return }
        // Until you scroll yourself, the date stays folded: on opening, and when the keyboard
        // comes up and the text view scrolls the caret into view (a new note's caret sits by the date).
        var target = DateFold.offset(top: adjustedContentInset.top)
        // Captures: `-uitest -scrollToText "Where to eat"` opens with that line near the top.
        if let text = DateFold.scrollToText, let tlm = textLayoutManager, let tcm = tlm.textContentManager {
            let r = (self.text as NSString).range(of: text)
            if r.location != NSNotFound, let loc = tcm.location(tcm.documentRange.location, offsetBy: r.location) {
                tlm.ensureLayout(for: tcm.documentRange)
                if let frag = tlm.textLayoutFragment(for: loc) {
                    let y = frag.layoutFragmentFrame.minY + textContainerInset.top - adjustedContentInset.top - 24
                    target = min(max(target, y), max(target, contentSize.height - bounds.height + adjustedContentInset.bottom))
                    contentOffset = CGPoint(x: contentOffset.x, y: target)
                    return
                }
            }
        }
        if contentOffset.y < target - 0.5 { contentOffset = CGPoint(x: contentOffset.x, y: target) }
    }

    /// You scrolled: from here on the date shows whenever you pull down.
    private var pulledDate = false
    /// Opens with the date in view, not folded away (MarkdownEditor.dateShown).
    var dateShown = false

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) { pulledDate = true }

    /// Places live views (cards, files, links) over their reserved lines.
    private func layoutCards() {
        let items = core.overlays(layout: textLayoutManager, origin: CGPoint(x: textContainerInset.left, y: textContainerInset.top),
                                  target: self, storage: textStorage, controller: controller) { [weak self] in self?.editingSelection }
        let live = Set(items.map(\.key))
        for (k, host) in cardHosts where !live.contains(k) {
            (gridHolders[k] ?? host.view).removeFromSuperview()
            cardHosts[k] = nil
            gridHolders[k] = nil
        }
        for item in items {
            let host = cardHosts[item.key] ?? {
                let h = UIHostingController(rootView: item.view)
                h.view.backgroundColor = .clear
                h.sizingOptions = []
                if case .grid(let g, _, _) = item.content {
                    // A table sits in a holder that lets taps through to the text above it, except
                    // on a handle's target (GridMetrics.reach).
                    let holder = GridHolder(frame: item.frame)
                    holder.box = core.gridBoxes[g.index]
                    h.view.frame = holder.bounds
                    h.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                    holder.addSubview(h.view)
                    addSubview(holder)
                    gridHolders[item.key] = holder
                } else {
                    addSubview(h.view)
                    h.view.frame = item.frame
                }
                cardHosts[item.key] = h
                return h
            }()
            host.rootView = item.view
            let placed: UIView = gridHolders[item.key] ?? host.view
            if case .grid(let g, _, _) = item.content { gridHolders[item.key]?.box = core.gridBoxes[g.index] }
            if placed.frame != item.frame {
                UIView.animate(withDuration: 0.22, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) { placed.frame = item.frame }
            }
        }
    }

    /// Tables' holders, by the same keys as their hosts.
    private var gridHolders: [String: GridHolder] = [:]

    // MARK: Table menus

    func deleteGrid(_ index: Int) {
        guard let g = GridTable.find(in: text).first(where: { $0.index == index }) else { return }
        core.gridFocus = nil
        let edit = EditorCore.removal(of: g.range, in: text)
        // Into the text first, so the edit goes through the text view's own undo.
        selectedRange = NSRange(location: EditorCore.caretOutside(g.range, in: text), length: 0)
        becomeFirstResponder()
        dropGrids(from: index)
        apply(edit)
        layoutCards()
    }

    /// Tables' views are kept by position: with one deleted, the next table took over its view,
    /// cell with the keyboard and all, and the keyboard jumped into it (Emil's table walkthrough,
    /// 1 November 2026). The views from `index` on are made anew.
    private func dropGrids(from index: Int) {
        for (k, host) in cardHosts {
            guard k.hasPrefix("g"), let i = Int(k.dropFirst()), i >= index else { continue }
            (gridHolders[k] ?? host.view).removeFromSuperview()
            cardHosts[k] = nil
            gridHolders[k] = nil
            core.gridBoxes[i] = nil
        }
    }

    func undoLastEdit() {
        if !isFirstResponder { becomeFirstResponder() }
        noteStack?.undo()
    }

    // MARK: Undo

    // The text view's own undo manager (one per note: each note gets a new text view) holds the
    // steps, so ⌘Z, shake, the three-finger swipe and the top bar's Undo all reach the same stack.

    func undoStep(redo: Bool) {
        guard let undo = noteStack else { return }
        if redo { if undo.canRedo { undo.redo() } } else if undo.canUndo { undo.undo() }
        reportUndo()
    }

    private func observeUndo() {
        for name: Notification.Name in [.NSUndoManagerDidCloseUndoGroup, .NSUndoManagerDidUndoChange, .NSUndoManagerDidRedoChange] {
            NotificationCenter.default.addObserver(self, selector: #selector(undoStackChanged(_:)), name: name, object: nil)
        }
        reportUndo()
    }

    @objc private func undoStackChanged(_ note: Notification) {
        guard (note.object as AnyObject?) === noteStack else { return }
        // An undo or redo that changed the text without the text view saying so is saved like
        // typing (on the Mac it wasn't: persona council r7, bug 18).
        if note.name != .NSUndoManagerDidCloseUndoGroup, text != lastReported, markedTextRange == nil { textDidChange() }
        reportUndo()
    }

    /// Tells the top bar what Undo and Redo can do now, and again a turn later, once a typing
    /// group the run loop closes has closed.
    private func reportUndo() {
        let report = { [weak self] in
            guard let self, let controller = self.controller, controller.target === self else { return }
            // A quick, quiet fade in and out.
            withAnimation(.easeOut(duration: 0.18)) { controller.undoChanged(canUndo: self.noteStack?.canUndo == true, canRedo: self.noteStack?.canRedo == true) }
        }
        report()
        DispatchQueue.main.async(execute: report)
    }

    func focusGrid(_ index: Int, cell: GridCell) {
        core.gridFocus = GridFocusRequest(grid: index, cell: cell)
        layoutCards()
        giveTableBar(tries: 20)
    }

    /// The table toolbar over the keyboard while a cell has it.
    private lazy var tableBar = FormatBarHost(controller: controller ?? EditorController(), inTable: true) { [weak self] in
        self?.puttingKeyboardAway = true
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        self?.puttingKeyboardAway = false
    }

    func gridFieldFocused() { giveTableBar(tries: 20) }

    /// The Table panel, in the cell's keyboard's place.
    private var tablePanel: FormatPanelHost?

    func tablePanelChanged(shown: Bool) {
        guard let controller else { return }
        if shown, tablePanel == nil { tablePanel = FormatPanelHost(controller: controller, table: true) }
        cellPanel(shown ? tablePanel : nil)
    }

    /// A panel is up in a cell's keyboard's place.
    private var cellPanelUp = false

    /// Puts `panel` in the place of the cell's keyboard (nil: the keyboard and the table bar back).
    /// The cell keeps its caret and selection meanwhile, as the note does under Format.
    private func cellPanel(_ panel: UIView?) {
        // The field the panel went on is the one it comes off, even if the cell's focus moved
        // for a moment meanwhile (the panel stayed up with Close doing nothing).
        let found = gridHolders.values.lazy.compactMap({ Self.firstResponder(in: $0) }).first
        if panel == nil, let old = panelField, old !== found {
            old.inputView = nil
            old.inputAccessoryView = tableBar
            old.reloadInputViews()
        }
        guard let field = found else { cellPanelUp = false; panelField = nil; return }
        cellPanelUp = panel != nil
        panelField = panel == nil ? nil : field
        field.inputView = panel
        // An empty bar over the panel: with none, the note's own bar showed there.
        field.inputAccessoryView = panel == nil ? tableBar : noBar
        field.reloadInputViews()
    }
    private weak var panelField: UITextField?
    private lazy var noBar = UIView(frame: .zero)

    /// The cell's field is made as it takes the keyboard, a turn or more after the table asks for
    /// it: the bar goes on it once it has the keyboard. A row or column added or deleted makes the
    /// field again for the same cell, so the editor asks again then (focusGrid).
    private func giveTableBar(tries: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            guard let self else { return }
            // Keeps looking for the whole second: the old cell's field can still have the keyboard
            // on the first looks, the new one after.
            if !self.cellPanelUp, let field = self.gridHolders.values.lazy.compactMap({ Self.firstResponder(in: $0) }).first,
               field.inputAccessoryView !== self.tableBar {
                field.inputAccessoryView = self.tableBar
                field.reloadInputViews()
            }
            if tries > 0 { self.giveTableBar(tries: tries - 1) }
        }
    }

    private static func firstResponder(in view: UIView) -> UITextField? {
        if let f = view as? UITextField, f.isFirstResponder { return f }
        for v in view.subviews { if let f = firstResponder(in: v) { return f } }
        return nil
    }

    private lazy var tableMenus: TableMenuPresenter = {
        let p = TableMenuPresenter(view: self)
        // With a handle's menu closed the cell's keyboard came back without the table bar (no
        // Table button, no Hide keyboard; Emil's table walkthrough, 1 November 2026): put it back.
        p.closed = { [weak self] in self?.giveTableBar(tries: 20) }
        return p
    }()

    func showTableMenu(_ menu: TableMenu) {
        guard let line = menu.line, let holder = gridHolders["g\(menu.grid)"], let r = core.gridBoxes[menu.grid]?.targets[line] else { return }
        tableMenus.present(menu, from: holder.convert(r, to: self))
    }

    func insertGrid() {
        let (edit, index) = core.newGridEdit(text: text, selection: selectedRange)
        core.gridFocus = GridFocusRequest(grid: index, cell: GridCell(row: 0, column: 0))
        apply(edit)
        resignFirstResponder()
    }


    // MARK: EditorTarget

    var currentText: String { text }
    var currentSelection: NSRange { selectedRange }

    /// Edits made with the keyboard down or in a table cell, close together: one step of Undo
    /// back to the text before the first of them.
    final class KeyboardDownStep {
        static let joinWithin: TimeInterval = 1.5
        let base: String
        var last = Date.now
        init(base: String) { self.base = base }
    }
    private var downStep: KeyboardDownStep?

    private func revert(to step: KeyboardDownStep) {
        downStep = nil
        guard let diff = TextDiff.edit(from: textStorage.string, to: step.base) else { return }
        apply(TextEdit(range: diff.range, replacement: diff.replacement, caret: -1))
        placeAfterUndo(at: diff.range.location + (diff.replacement as NSString).length)
    }

    func apply(_ edit: TextEdit) {
        // Only the caret moves (bold stepped out of): not a change, and no step of Undo.
        if edit.range.length == 0, edit.replacement.isEmpty {
            if edit.caret >= 0 { selectedRange = NSRange(location: min(edit.caret, textStorage.length), length: 0) }
            return
        }
        // The keyboard is somewhere else, in a table cell say. Through the text-input call
        // below, iOS then ran the new text past that keyboard's smart punctuation a moment
        // later: a table's `---` came out as `—` and it was a table no more. Straight into
        // the storage, as a change from elsewhere goes in, the text stays as given. Not a tick
        // or its sinking (`quietEdit`): a change from elsewhere clears the text view's undo
        // stack, so they go through the text-input call with the keyboard down too.
        guard isFirstResponder || quietEdit else {
            guard NSMaxRange(edit.range) <= textStorage.length else { return }
            let keep = selectedRange
            let old = (textStorage.string as NSString).substring(with: edit.range)
            textStorage.replaceCharacters(in: edit.range, with: edit.replacement)
            // Undo steps recorded against the old text would land in the wrong place now (the text
            // view drops its typing steps on a change like this anyway). This change is a step of
            // its own, so a tick with the keyboard down can be undone. (Not while that step is
            // being undone or redone: clearing the stack then hung the undo manager.)
            if let undo = noteStack {
                if undo.isUndoing || undo.isRedoing {
                    downStep = nil
                    let back = TextEdit(range: NSRange(location: edit.range.location, length: (edit.replacement as NSString).length), replacement: old, caret: -1)
                    undo.registerUndo(withTarget: stepTarget) { $0.view?.apply(back) }
                } else if let step = downStep, undo.canUndo, Date.now.timeIntervalSince(step.last) < KeyboardDownStep.joinWithin {
                    // More of the same run (typing in a table cell): the step already there takes
                    // it back too. One step per letter took back one letter, and the Undo button
                    // went with the last of them (persona council r7).
                    step.last = .now
                } else {
                    // The steps under it stay: this one puts back the exact text from before the
                    // run, so the ones before it line up with the text again. Clearing them left
                    // nothing to undo after a cell's typing was taken back (persona council r7).
                    let before = (textStorage.string as NSString).replacingCharacters(in: NSRange(location: edit.range.location, length: (edit.replacement as NSString).length), with: old)
                    let step = KeyboardDownStep(base: before)
                    downStep = step
                    typing = nil
                    undo.registerUndo(withTarget: stepTarget) { $0.view?.revert(to: step) }
                }
            }
            let caret = min(edit.caret, textStorage.length)
            if let kept = edit.selection, NSMaxRange(kept) <= textStorage.length { selectedRange = kept }
            else {
                selectedRange = caret >= 0 ? NSRange(location: caret, length: 0)
                    : TextDiff.map(keep, through: TextDiff.Edit(range: edit.range, replacement: edit.replacement))
            }
            writingStorage = true
            textDidChange()
            writingStorage = false
            return
        }
        guard let start = position(from: beginningOfDocument, offset: edit.range.location),
              let end = position(from: start, offset: edit.range.length),
              let range = textRange(from: start, to: end) else { return }
        core.applyingEdit = true
        // A tick's step of Undo (`asOneStep`) covers it: none of the text view's own.
        if quietEdit { noteStack?.disableUndoRegistration() }
        replace(range, withText: edit.replacement)
        if quietEdit { noteStack?.enableUndoRegistration() }
        core.applyingEdit = false
        if let keep = edit.selection, NSMaxRange(keep) <= (text as NSString).length { selectedRange = keep }
        else if edit.caret >= 0 { selectedRange = NSRange(location: min(edit.caret, (text as NSString).length), length: 0) }
        textDidChange()
    }

    func focusEditor() { becomeFirstResponder() }

    // MARK: The Format panel

    private var formatPanel: FormatPanelHost?
    /// The bar above the keyboard, put away while the panel is up.
    private var keyboardBar: UIView?

    /// The panel takes the keyboard's place, as in Notes: the text keeps the caret and the
    /// selection, and the bar above the keyboard goes while it's up. Closed, the keyboard is back.
    func formatPanelChanged(shown: Bool) {
        guard let controller else { return }
        // In a table cell the panel takes the cell's keyboard's place, not the note's.
        if controller.cell != nil || cellPanelUp {
            cellPanel(shown ? (formatPanel ?? { formatPanel = FormatPanelHost(controller: controller); return formatPanel! }()) : nil)
            return
        }
        if shown {
            if formatPanel == nil { formatPanel = FormatPanelHost(controller: controller) }
            if inputAccessoryView !== nil { keyboardBar = inputAccessoryView }
            inputAccessoryView = nil
            inputView = formatPanel
        } else {
            inputView = nil
            if let keyboardBar { inputAccessoryView = keyboardBar }
        }
        guard isFirstResponder else { if shown { becomeFirstResponder() }; return }
        let motion = FormatPanelMotion.now
        lastFormatMotion = motion
        switch motion {
        case .trade:
            // Swapped in place, UIKit cuts from one to the other (Emil, 30 October 2026: "it just
            // insta disappears"). Handed down and up again in one go, the system plays its own
            // keyboard move: the keyboard goes down on its curve as the panel comes up on the
            // same one, and back. The text keeps its caret and stays where it is meanwhile.
            holdOffset()
            swappingInput = true
            resignFirstResponder()
            DispatchQueue.main.async {
                self.becomeFirstResponder()
                self.swappingInput = false
            }
        case .crossFade:
            // Nothing slides. Opening, the panel fades in where the keyboard was (the keys are
            // drawn by the system, out of reach); closing, a picture of it fades out over the
            // keyboard as it comes back.
            let leaving = shown ? nil : formatPanel.flatMap { panel in
                panel.window.map { (panel.snapshotView(afterScreenUpdates: false), panel.convert(panel.bounds, to: $0), $0) }
            }
            if shown { formatPanel?.fadeInOnArrival(FormatPanelMotion.fadeDuration) }
            reloadInputViews()
            if let (snapshot, frame, window) = leaving, let snapshot {
                snapshot.frame = frame
                window.addSubview(snapshot)
                UIView.animate(withDuration: FormatPanelMotion.fadeDuration) { snapshot.alpha = 0 } completion: { _ in snapshot.removeFromSuperview() }
            }
        }
    }

    /// How the last open or close of the panel moved (tests).
    private(set) var lastFormatMotion: FormatPanelMotion?
    /// Between handing the keyboard down and taking it back for the panel: editing hasn't ended.
    private var swappingInput = false
    /// Where the text stays while the keyboard and the panel trade places: the room below changes
    /// twice, and the text view followed it, showing the folded date for a moment.
    private var heldOffset: CGPoint?

    private func holdOffset(for duration: TimeInterval = FormatPanelMotion.holdDuration) {
        let held = contentOffset
        heldOffset = held
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in if self?.heldOffset == held { self?.heldOffset = nil } }
    }

    override var contentOffset: CGPoint {
        didSet { if let heldOffset, contentOffset != heldOffset { contentOffset = heldOffset } }
    }

    /// UIKit scrolls the caret into view as the keyboard comes up and as you type. With the caret
    /// on the note's last line it showed the room under the text too (the foot, the space kept
    /// free at the bottom), so a short note slid its title under the bar while the line you were
    /// typing on was well clear of the keyboard (persona council r7, Sara's shared list). A caret
    /// already in view stays where it is.
    override func scrollRectToVisible(_ rect: CGRect, animated: Bool) {
        if Self.caretInView(selection: selectedRange, caret: selectedTextRange.map { caretRect(for: $0.end) },
                            visible: visibleTextArea) { return }
        super.scrollRectToVisible(rect, animated: animated)
    }

    /// The part of the view text can be read in now: under the bars, above the keyboard.
    var visibleTextArea: CGRect {
        bounds.inset(by: UIEdgeInsets(top: adjustedContentInset.top, left: 0, bottom: adjustedContentInset.bottom, right: 0))
    }

    /// Whether a caret (no selection) is wholly inside `visible`, a little air under it included.
    static func caretInView(selection: NSRange, caret: CGRect?, visible: CGRect) -> Bool {
        guard selection.length == 0, let caret, !caret.isNull, !caret.isInfinite, caret.height > 0 else { return false }
        return caret.minY >= visible.minY && caret.maxY + 8 <= visible.maxY
    }

    /// Whether the panel is in the keyboard's place now (tests).
    var showsFormatPanel: Bool { inputView is FormatPanelHost }

    /// Scrolls the line at `location` to the top (a link to a heading), the keyboard left as it is.
    func reveal(_ location: Int) {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: min(max(location, 0), (text as NSString).length)) else { return }
        tlm.ensureLayout(for: tcm.documentRange)
        guard let frag = tlm.textLayoutFragment(for: loc) else { return }
        pulledDate = true
        let top = -adjustedContentInset.top
        let y = frag.layoutFragmentFrame.minY + textContainerInset.top - adjustedContentInset.top - 8
        contentOffset = CGPoint(x: contentOffset.x, y: min(max(top, y), max(top, contentSize.height - bounds.height + adjustedContentInset.bottom)))
    }

    override func paste(_ sender: Any?) {
        let pb = UIPasteboard.general
        let html = pb.data(forPasteboardType: "public.html").flatMap { String(data: $0, encoding: .utf8) }
        if pb.hasImages, let image = pb.image, let png = image.pngData(),
           RichPaste.kind(hasImage: true, text: pb.string, htmlIsOnlyImage: RichPaste.htmlIsOnlyImage(html)) == .image {
            if let a = controller?.addData(png, "Image \(Date.now.formatted(.iso8601.year().month().day().time(includingFractionalSeconds: false))).png".replacingOccurrences(of: ":", with: "."), .png) {
                controller?.insertFiles([a])
            }
            return
        }
        if let md = RichPaste.markdownFromPasteboard() {
            let sel = selectedRange
            apply(TextEdit(range: sel, replacement: md, caret: sel.location + (md as NSString).length))
            return
        }
        super.paste(sender)
    }

    // MARK: Dropping files

    private func isFileDrop(_ session: UIDropSession) -> Bool {
        session.items.contains { item in
            let types = item.itemProvider.registeredTypeIdentifiers.compactMap(UTType.init)
            return !types.contains { $0.conforms(to: .plainText) || $0.conforms(to: .url) && !$0.conforms(to: .fileURL) }
        }
    }

    /// Notes dragged from the list (`PaneDragItem`).
    private func carriesNotes(_ session: UIDropSession) -> Bool {
        session.hasItemsConforming(toTypeIdentifiers: [UTType.paneItem.identifier])
    }

    func textDroppableView(_ view: UIView & UITextDroppable, proposalForDrop drop: UITextDropRequest) -> UITextDropProposal {
        let p = UITextDropProposal(operation: .copy)
        if carriesNotes(drop.dropSession) || isFileDrop(drop.dropSession) { p.dropAction = .insert }
        return p
    }

    /// Notes dropped at a place in the text: a link to each goes in there (see `insertNoteLinks`).
    @discardableResult
    func dropNotes(_ ids: [UUID], at position: UITextPosition) -> Bool {
        guard !ids.isEmpty else { return false }
        selectedTextRange = textRange(from: position, to: position)
        return controller?.insertNoteLinks(ids) ?? false
    }

    func textDroppableView(_ view: UIView & UITextDroppable, willPerformDrop drop: UITextDropRequest) {
        if carriesNotes(drop.dropSession) {
            let position = drop.dropPosition
            let providers = drop.dropSession.items.map(\.itemProvider).filter { $0.hasItemConformingToTypeIdentifier(UTType.paneItem.identifier) }
            Task { @MainActor in
                var data: [Data] = []
                for p in providers {
                    let d: Data? = await withCheckedContinuation { cont in
                        _ = p.loadDataRepresentation(forTypeIdentifier: UTType.paneItem.identifier) { d, _ in cont.resume(returning: d) }
                    }
                    if let d { data.append(d) }
                }
                self.dropNotes(EditorController.draggedNotes(data), at: position)
            }
            return
        }
        guard isFileDrop(drop.dropSession) else { return }
        let position = drop.dropPosition
        let providers = drop.dropSession.items.map(\.itemProvider)
        Task { @MainActor in
            var urls: [URL] = []
            for p in providers {
                guard let type = p.registeredTypeIdentifiers.first else { continue }
                let name = p.suggestedName
                let url: URL? = await withCheckedContinuation { cont in
                    _ = p.loadFileRepresentation(forTypeIdentifier: type) { src, _ in
                        guard let src else { cont.resume(returning: nil); return }
                        // The provided file is deleted after this returns: copy it out.
                        let dir = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
                        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                        let ext = src.pathExtension
                        let fname = name.map { ext.isEmpty || $0.hasSuffix(".\(ext)") ? $0 : "\($0).\(ext)" } ?? src.lastPathComponent
                        let dest = dir.appending(path: fname)
                        cont.resume(returning: (try? FileManager.default.copyItem(at: src, to: dest)) != nil ? dest : nil)
                    }
                }
                if let url { urls.append(url) }
            }
            guard !urls.isEmpty else { return }
            self.selectedTextRange = self.textRange(from: position, to: position)
            self.controller?.insertFiles(self.controller?.addFiles(urls) ?? [])
        }
    }

    // MARK: Delegate

    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        guard !core.applyingEdit else { return true }
        core.folds.open(for: range)
        if text == "\n", foldReturn(range) { return false }
        if text == "\n", let edit = ListEditing.returnKey(in: self.text, selection: range) {
            apply(edit); return false
        }
        if text == " ", let edit = ListEditing.spaceKey(in: self.text, selection: range) {
            apply(edit); return false
        }
        if text.isEmpty {
            // Backspace deletes the character before the caret; a selection deletes itself.
            let sel = selectedRange
            let forward = sel.length == 0 && range.location == sel.location
            if let d = core.deleteNearBlock(self.text, sel, forward: forward) {
                switch d {
                case .arm: layoutCards()
                case .delete(let e): apply(e)
                }
                return false
            }
        }
        // A date chip goes in one press, like an attachment.
        if text.isEmpty, range.length == 1, selectedRange.length == 0,
           let edit = NoteDates.delete(in: self.text, selection: selectedRange, forward: range.location == selectedRange.location, isChip: { [textStorage] r in textStorage.attribute(.paneDate, at: r.location, effectiveRange: nil) != nil }) {
            apply(edit); return false
        }
        if text.isEmpty, range.length == 1, selectedRange.length == 0,
           let edit = ListEditing.backspace(in: self.text, selection: NSRange(location: range.location + 1, length: 0)) {
            apply(edit); return false
        }
        return true
    }

    func textViewDidChange(_ textView: UITextView) { textDidChange() }

    private func textDidChange() {
        guard markedTextRange == nil else { return }
        takeWhatArrivedWhileComposing()
        recordTyping()
        core.layoutDelegate.tint.stop()
        // Rows still sliding would cover the new text.
        core.endSlides()
        core.restyle(textStorage, selection: editingSelection, force: true)
        typingAttributes = core.typingAttributes(text, at: selectedRange.location)
        recordOwnEdit()
        lastReported = text
        remember(text)
        core.onChange(text)
        controller?.typingChanged(text: text, selection: editingSelection)
        // A shared note's stack closes no undo groups, so nothing else tells the bar: typing
        // left Undo missing until someone else's edit came in (persona council r7f).
        if controller?.ownUndo != nil { reportUndo() }
    }

    /// The last body we reported or received, to tell outside edits from our own.
    var lastReported = ""
    /// Hashes of recent texts we reported, not yet all written to the note.
    private var reported: [Int] = []

    private func remember(_ s: String) {
        reported.append(s.hashValue)
        if reported.count > 64 { reported.removeFirst(reported.count - 64) }
    }

    /// Redraws just the lines an AI changed while their tint swells and fades.
    private func observeChangeHighlight() {
        core.layoutDelegate.tint.redraw = { [weak self] ranges in
            MainActor.assumeIsolated {
                // An attributes-only edit of those lines: TextKit lays them out and draws them
                // again, the same way styling does (invalidating layout alone leaves the Mac's
                // on-screen fragments as they were). It isn't a text change, so nothing is saved.
                guard let self else { return }
                let storage = self.textStorage
                let length = storage.length
                storage.beginEditing()
                for r in ranges where NSMaxRange(r) <= length { storage.edited(.editedAttributes, range: r, changeInLength: 0) }
                storage.endEditing()
                // Tables and cards sit over their lines: put them back where the lines now are.
                self.settleOverlays(after: ranges.map(NSMaxRange).max() ?? 0)
            }
        }
    }

    /// An AI's edit just landed: tint the lines it changed compared with `previous`.
    func tintChanges(from previous: String, untilCleared: Bool) {
        core.layoutDelegate.tint.play(from: previous, to: currentText, untilCleared: untilCleared)
    }

    var isTinted: Bool { core.layoutDelegate.tint.isLit }

    func clearTint() { core.layoutDelegate.tint.stop() }

    /// Opened from a search: the word found is marked for a moment, as on the Mac. Not the whole
    /// paragraph, and not in the tint that means an AI changed it (persona council r7g).
    func flashFound(_ range: NSRange) {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let start = tcm.location(tcm.documentRange.location, offsetBy: range.location),
              let end = tcm.location(start, offsetBy: range.length),
              let found = NSTextRange(location: start, end: end) else { return }
        tlm.ensureLayout(for: found)
        // Views over the word: this text view's own drawing doesn't take a rendering attribute's
        // background (the first try showed nothing, in the film).
        tlm.enumerateTextSegments(in: found, type: .standard, options: []) { _, frame, _, _ in
            let mark = UIView(frame: frame.offsetBy(dx: textContainerInset.left, dy: textContainerInset.top).insetBy(dx: -2, dy: 0))
            mark.backgroundColor = UIColor.systemYellow.withAlphaComponent(0.4)
            mark.layer.cornerRadius = 3
            mark.isUserInteractionEnabled = false
            mark.isAccessibilityElement = false
            addSubview(mark)
            UIView.animate(withDuration: 0.5, delay: 2.5, options: [.allowUserInteraction]) { mark.alpha = 0 } completion: { _ in mark.removeFromSuperview() }
            return true
        }
    }

    /// Lays the text out from the top to past `offset`, then places tables and cards again.
    private func settleOverlays(after offset: Int) {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return }
        let length = tcm.offset(from: tcm.documentRange.location, to: tcm.documentRange.endLocation)
        guard let end = tcm.location(tcm.documentRange.location, offsetBy: min(length, offset + 2000)),
              let range = NSTextRange(location: tcm.documentRange.location, end: end) else { return }
        tlm.ensureLayout(for: range)
        setNeedsLayout()
    }

    func syncExternal(_ new: String) {
        guard new != lastReported else { return }
        // The note still holds text we typed a moment ago (it's saved once typing
        // pauses): that's not a change from elsewhere.
        if reported.contains(new.hashValue) { return }
        syncDocument(new)
    }

    func syncDocument(_ new: String) {
        guard new != lastReported else { return }
        // Mid-composition (an input method, dictation) the text can't change under it:
        // the change is taken in when the composition ends (textDidChange).
        if markedTextRange != nil { arrivedWhileComposing = new; return }
        reported.removeAll()
        lastReported = new
        // Until what you type next is saved, the note still holds this: not a change again.
        remember(new)
        replaceText(with: new)
    }

    func takeRestored(_ new: String) {
        // Restoring is a choice: it wins over a composition, and over the text you typed before.
        arrivedWhileComposing = nil
        if markedTextRange != nil { unmarkText() }
        reported.removeAll()
        lastReported = new
        remember(new)
        replaceText(with: new)
        noteStack?.removeAllActions(); typing = nil; typedText = text
        clearTint()
        // A shorter version: back inside the text, not scrolled past its end.
        layoutIfNeeded()
        let bottom = max(-adjustedContentInset.top, contentSize.height + adjustedContentInset.bottom - bounds.height)
        if contentOffset.y > bottom { setContentOffset(CGPoint(x: contentOffset.x, y: bottom), animated: false) }
    }

    /// A change from elsewhere that arrived while you were composing.
    private var arrivedWhileComposing: String?

    /// The composition ended: put the change that arrived meanwhile under what you typed,
    /// or, if you both changed the same lines, keep yours (the other is in version history).
    private func takeWhatArrivedWhileComposing() {
        guard let arrived = arrivedWhileComposing else { return }
        arrivedWhileComposing = nil
        if let merged = TextDiff.merge(base: lastReported, mine: text, theirs: arrived) { replaceText(with: merged) }
    }

    private func replaceText(with new: String) {
        guard new != text, markedTextRange == nil, let edit = TextDiff.edit(from: text, to: new) else { return }
        core.layoutDelegate.tint.stop()
        // Only what changed is replaced, so your caret, selection and scroll stay put.
        let keep = selectedRange
        let offset = contentOffset
        textStorage.replaceCharacters(in: edit.range, with: edit.replacement)
        // Undo steps recorded against the old text would land in the wrong place now. In a shared
        // note your own steps move with the change instead (OwnUndo).
        if let own = controller?.ownUndo {
            if let clash = own.clash(with: edit) { controller?.clash = clash }
            own.transform(through: edit)
            controller?.clashStillStands(in: text)
        } else { noteStack?.removeAllActions(); typing = nil; typedText = text }
        reportUndo()
        selectedRange = TextDiff.map(keep, through: edit)
        core.restyle(textStorage, selection: editingSelection, force: true)
        settleOverlays(after: NSMaxRange(edit.range) + (edit.replacement as NSString).length)
        setContentOffset(offset, animated: false)
        // Not yours to undo as typing: the next run of typing starts from here.
        typing = nil; typedText = text; typedSelection = selectedRange
    }

    // MARK: Undo in a shared note: only your own edits (OwnUndo)

    private lazy var ownUndoManager = OwnUndoManager(view: self)
    /// The note's steps, or in a shared note only your own edits. Its own manager, not UIKit's:
    /// UIKit clears all of its manager's steps when the text changes without the keyboard (a
    /// table cell's typing), so the note's typing before it went (persona council r7). UIKit
    /// records no typing in a manager of the view's own, so the view records it (`recordTyping`).
    var noteStack: UndoManager? { controller?.ownUndo != nil ? ownUndoManager : noteUndoManager }
    private let noteUndoManager = UndoManager()
    /// A table cell's field asks this view for its undo manager (the cells are laid over the
    /// text, inside it). Its per-letter steps went on top of the note's, so the bar's Undo took
    /// back its last letter, not the cell's text, and then had nothing left (persona council r7,
    /// bug 4). While a cell has the keyboard they go here instead; the note's own step for that
    /// typing (KeyboardDownStep) stays on the note's stack.
    private let cellFieldUndo = UndoManager()
    private weak var editingCell: UITextField?
    private var watchingCells = false
    override var undoManager: UndoManager? {
        if let cell = editingCell, cell.isFirstResponder, !isFirstResponder { return cellFieldUndo }
        return noteStack
    }
    private func watchCells() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(cellBegan(_:)), name: UITextField.textDidBeginEditingNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(cellEnded(_:)), name: UITextField.textDidEndEditingNotification, object: nil)
    }
    /// The keyboard is coming up. With the caret clear of where it will be, the text stays where it
    /// is: as it came up, a short note slid its title half under the bar with the line you were on
    /// well above the keyboard (persona council r7, Sara's shared list, c9 v3).
    @objc func keyboardWillShow(_ note: Notification) {
        guard isFirstResponder, let end = note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect,
              let range = selectedTextRange else { return }
        let keyboard = convert(end, from: nil)
        let caret = caretRect(for: range.end)
        guard Self.keepsPlaceForKeyboard(caret: caret, keyboardTop: keyboard.minY, visibleTop: contentOffset.y + adjustedContentInset.top) else { return }
        let duration = (note.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double) ?? 0.25
        holdOffset(for: duration + 0.15)
    }

    /// Whether the caret is in view above the keyboard's top (both in the text view's coordinates).
    static func keepsPlaceForKeyboard(caret: CGRect, keyboardTop: CGFloat, visibleTop: CGFloat) -> Bool {
        guard !caret.isNull, !caret.isInfinite, caret.height > 0 else { return false }
        return caret.minY >= visibleTop && caret.maxY + 8 <= keyboardTop
    }

    /// After an Undo the keyboard goes where the text changed, as in Notes: the table cell it
    /// changed, or the note's text if a cell had it and the change was outside the table
    /// (persona council r7: the caret stayed in the lower cell when "Plan" left the header).
    func placeAfterUndo(at location: Int) {
        let text = textStorage.string
        guard location <= (text as NSString).length else { return }
        if let (grid, cell) = GridTable.cell(at: location, in: text) {
            guard editingCell != nil || !isFirstResponder else { return }
            core.gridFocus = GridFocusRequest(grid: grid, cell: cell)
            layoutCards()
        } else if let cell = editingCell, cell.isFirstResponder {
            becomeFirstResponder()
            selectedRange = NSRange(location: location, length: 0)
        }
    }

    @objc private func cellBegan(_ note: Notification) {
        guard let field = note.object as? UITextField, field.isDescendant(of: self) else { return }
        editingCell = field
    }
    @objc private func cellEnded(_ note: Notification) {
        guard let field = note.object as? UITextField, field === editingCell else { return }
        editingCell = nil
        cellFieldUndo.removeAllActions()
    }
    private var applyingOwnUndo = false

    /// Your edit, for undo, unless it's an undo itself.
    private func recordOwnEdit() {
        guard let own = controller?.ownUndo, !applyingOwnUndo, let e = TextDiff.edit(from: lastReported, to: text) else { return }
        own.record(e, in: lastReported)
    }

    /// Undo or Redo of your own last step, through the text system so it's saved and sent like typing.
    func ownUndoStep(redo: Bool) {
        guard let own = controller?.ownUndo, let e = redo ? own.redo(in: text) : own.undo(in: text),
              let start = position(from: beginningOfDocument, offset: e.range.location),
              let end = position(from: beginningOfDocument, offset: NSMaxRange(e.range)),
              let range = textRange(from: start, to: end) else { return }
        applyingOwnUndo = true
        defer { applyingOwnUndo = false }
        replace(range, withText: e.replacement)
        selectedRange = NSRange(location: e.range.location + (e.replacement as NSString).length, length: 0)
    }

    func textViewDidChangeSelection(_ textView: UITextView) {
        guard markedTextRange == nil else { return }
        revealFolds()
        if core.disarm(unless: selectedRange) { layoutCards() }
        if isFirstResponder, let fix = core.caretFix(text, selectedRange, byKeyboard: false) {
            resolve(fix)
            return
        }
        core.restyle(textStorage, selection: editingSelection, force: false)
        if selectedRange.length == 0, core.emptyLineFont(text, at: selectedRange.location) != nil {
            typingAttributes = core.typingAttributes(text, at: selectedRange.location)
        }
        controller?.typingChanged(text: text, selection: editingSelection)
    }

    /// On an empty line the caret is the height of what you're about to type: the title's on an
    /// empty title line, the body's on a new body line. UIKit sized it by the line break before it,
    /// with the line's spacing on some lines, so it jumped as the first letter went in: small, then
    /// big, in a new note; big, then small, on the line after the title (Emil, 30 October 2026).
    ///
    /// And where the letter will be drawn: TextKit counts an empty line's spacing in the line and
    /// put the caret at its top, 6⅔ pt above where a typed letter goes, under the spacing (on the
    /// line after the title, the caret dropped as you typed).
    override func caretRect(for position: UITextPosition) -> CGRect {
        var r = super.caretRect(for: position)
        let at = offset(from: beginningOfDocument, to: position)
        guard let font = core.emptyLineFont(text, at: at) else { return r }
        r.origin.y += spacingAbove(emptyLineAt: at)
        r.size.height = Self.caretHeight(font, scale: traitCollection.displayScale)
        return r
    }

    /// How much of the empty line at `location` is its spacing, drawn above a letter typed there.
    private func spacingAbove(emptyLineAt location: Int) -> CGFloat {
        guard location < textStorage.length, let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: location),
              let fragment = tlm.textLayoutFragment(for: loc),
              let line = fragment.textLineFragments.first,
              let font = textStorage.attribute(.font, at: location, effectiveRange: nil) as? UIFont else { return 0 }
        return max(0, line.typographicBounds.height - font.lineHeight)
    }

    /// The height UIKit gives the caret next to a letter in `font`: the line's height and a
    /// little, to the pixel (22 pt for 17 pt text, 42⅓ for the 34 pt title).
    static func caretHeight(_ font: UIFont, scale: CGFloat) -> CGFloat {
        let s = max(scale, 1)
        return ((font.lineHeight + 1.75) * s).rounded() / s
    }

    private var editingSelection: NSRange? { isFirstResponder || swappingInput ? selectedRange : nil }

    func setWiki(_ wiki: WikiScope?) { core.setWiki(wiki, storage: textStorage, selection: editingSelection) }
    func setImages(_ tick: Int) { core.setImages(tick, storage: textStorage, selection: editingSelection) }

    func textViewDidBeginEditing(_ textView: UITextView) {
        if swappingInput { return }
        controller?.isEditing = true
        // The keyboard is back in the text: no table is waiting for it any more.
        core.gridFocus = nil
        controller?.leftTable()
        // The active line's syntax shows a turn later. A tap that raises the keyboard puts the
        // caret where you tapped right after this returns, and restyling the text now threw that
        // away: the caret stayed at the end of the note (Emil, 30 October 2026).
        DispatchQueue.main.async { [weak self] in
            guard let self, self.isFirstResponder else { return }
            self.core.restyle(self.textStorage, selection: self.selectedRange, force: true)
        }
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        if swappingInput { return }
        // Swiped away or left: next time the keyboard comes, not the panel.
        controller?.closeFormatPanel(keyboard: false)
        controller?.isEditing = false
        controller?.typingChanged(text: text, selection: nil)
        core.restyle(textStorage, selection: nil, force: true)
    }

    func textView(_ textView: UITextView, primaryActionFor textItem: UITextItem, defaultAction: UIAction) -> UIAction? {
        guard case .link(let url) = textItem.content else { return defaultAction }
        switch LinkPolicy.action(for: url) {
        case .open(let url): return UIAction { _ in UIApplication.shared.open(url) }
        case .note(let id): return UIAction { [weak self] _ in self?.controller?.openNote(id) }
        case .wiki(let target): return UIAction { [weak self] _ in self?.controller?.openWiki(target) }
        case .tag(let name): return UIAction { [weak self] _ in self?.controller?.openTag(name) }
        case .nothing: return nil
        }
    }

    /// The menu over a long press or the caret: in a checklist with something ticked, Untick All
    /// in This List first, as Notes puts its list commands there.
    func textView(_ textView: UITextView, editMenuForTextIn range: NSRange, suggestedActions: [UIMenuElement]) -> UIMenu? {
        let extra = [untickAction(at: range.location), sharePictureAction(for: range)].compactMap { $0 }
        return extra.isEmpty ? nil : UIMenu(children: extra + suggestedActions)
    }

    /// "Share as Picture…" for text that's selected.
    func sharePictureAction(for range: NSRange) -> UIAction? {
        guard range.length > 0, controller?.canSharePicture() == true else { return nil }
        return UIAction(title: EditorController.sharePictureTitle, image: UIImage(systemName: "photo")) { [weak self] _ in
            self?.controller?.sharePicture()
        }
    }

    /// "Untick All in This List" for the checklist at `location`; nil when nothing in it is ticked.
    func untickAction(at location: Int) -> UIAction? {
        guard isEditable, controller?.readOnly != true, ListEditing.tickedCount(in: text, at: location) > 0 else { return nil }
        return UIAction(title: EditorController.untickListTitle, image: UIImage(systemName: "checklist.unchecked")) { [weak self] _ in
            self?.controller?.untickAll(at: location)
        }
    }

    func textView(_ textView: UITextView, menuConfigurationFor textItem: UITextItem, defaultMenu: UIMenu) -> UITextItem.MenuConfiguration? {
        // No "Open in…" for links the policy won't open.
        if case .link(let url) = textItem.content, LinkPolicy.action(for: url) == .nothing { return nil }
        return UITextItem.MenuConfiguration(menu: defaultMenu)
    }

    // MARK: Blocks

    private func resolve(_ fix: CaretFix) {
        switch fix {
        case .move(let at):
            selectedRange = NSRange(location: at, length: 0)
        case .newLineAfter(let at), .newLineBefore(let at):
            let after = { if case .newLineAfter = fix { true } else { false } }()
            // Only on the text it was worked out for: an Undo in between left `at` past the end.
            let before = text
            DispatchQueue.main.async { [weak self] in
                guard let self, self.text == before else { return }
                self.apply(TextEdit(range: NSRange(location: at, length: 0), replacement: "\n", caret: after ? at + 1 : at))
            }
        case .enterGrid(let grid, let cell):
            core.gridFocus = GridFocusRequest(grid: grid, cell: cell)
            layoutCards()
        }
    }

    func leaveGrid(_ index: Int, below: Bool) {
        core.gridFocus = nil
        guard let g = GridTable.find(in: text).first(where: { $0.index == index }) else { return }
        becomeFirstResponder()
        let len = (text as NSString).length
        if below {
            if NSMaxRange(g.range) < len { selectedRange = NSRange(location: NSMaxRange(g.range) + 1, length: 0) }
            else { apply(TextEdit(range: NSRange(location: len, length: 0), replacement: "\n", caret: len + 1)) }
        } else {
            if g.range.location > 0 { selectedRange = NSRange(location: g.range.location - 1, length: 0) }
            else { apply(TextEdit(range: NSRange(location: 0, length: 0), replacement: "\n", caret: 0)) }
        }
    }

    // MARK: Checkbox taps

    /// The checkbox tap. It only begins over a circle, and when it does it's the only tap:
    /// the text view's own taps would also move the caret there and raise the keyboard.
    private weak var checkTap: UITapGestureRecognizer?

    func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
        g !== checkTap && other !== checkTap
    }

    /// Text-interaction taps wait for the checkbox tap to fail, which it does at once
    /// anywhere but a circle, so ordinary taps aren't delayed.
    func gestureRecognizer(_ g: UIGestureRecognizer, shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool {
        g === checkTap && other !== checkTap && (other.view.map { $0 === self || $0.isDescendant(of: self) } ?? false)
    }

    override func gestureRecognizerShouldBegin(_ g: UIGestureRecognizer) -> Bool {
        if g is UITapGestureRecognizer, g.view === self, g.delegate === self { return takesTap(at: g.location(in: self)) }
        return super.gestureRecognizerShouldBegin(g)
    }

    /// Whether the checkbox tap takes a tap at `p`: on a circle; in Recently Deleted, any tap but
    /// one on a link, which asks to recover the note (tap(at:)), like Notes. A long press still
    /// selects there, to copy.
    func takesTap(at p: CGPoint) -> Bool {
        if foldToggle(at: CGPoint(x: p.x - textContainerInset.left, y: p.y - textContainerInset.top), onlyShown: true) != nil { return true }
        if controller?.readOnly == true { return !onLink(at: p) }
        if calloutIcon(atView: p) != nil { return true }
        return checkboxLine(for: p) != nil
    }

    /// Whether a point of this view is on a link's text.
    private func onLink(at p: CGPoint) -> Bool {
        guard let pos = closestPosition(to: p) else { return false }
        let i = offset(from: beginningOfDocument, to: pos)
        return i < textStorage.length && textStorage.attribute(.link, at: i, effectiveRange: nil) != nil
    }

    private func checkboxLine(for p: CGPoint) -> Int? {
        let point = CGPoint(x: p.x - textContainerInset.left, y: p.y - textContainerInset.top)
        return core.tickTarget(at: point, viewY: p.y, layout: textLayoutManager)
    }

    /// The reader changed their text size or Bold Text: restyle to match, like Notes.
    @objc private func textSizeChanged() {
        core.styler.bodySize = EditorMetrics.body
        typingAttributes = core.typingAttributes(text, at: selectedRange.location)
        core.restyle(textStorage, selection: editingSelection, force: true)
    }

    @objc private func handleTap(_ g: UITapGestureRecognizer) { tap(at: g.location(in: self)) }

    func tap(at point: CGPoint) {
        if let h = foldToggle(at: CGPoint(x: point.x - textContainerInset.left, y: point.y - textContainerInset.top), onlyShown: true) {
            toggleFold(h)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            return
        }
        if controller?.readOnly == true { controller?.askToRecover(); return }
        if let icon = calloutIcon(atView: point) {
            showCalloutTypes(line: icon.line, rect: icon.rect.offsetBy(dx: textContainerInset.left, dy: textContainerInset.top))
            return
        }
        tapCheckbox(at: point)
    }

    /// The callout icon under a point of this view.
    func calloutIcon(atView p: CGPoint) -> (rect: CGRect, line: Int)? {
        core.calloutIcon(at: CGPoint(x: p.x - textContainerInset.left, y: p.y - textContainerInset.top), layout: textLayoutManager)
    }

    /// The callout's types in a small popover over the icon, like a menu.
    func showCalloutTypes(line: Int, rect: CGRect) {
        let ns = text as NSString
        guard line < ns.length, var top = window?.rootViewController else { return }
        while let p = top.presentedViewController { top = p }
        let current = Callouts.header(ns.substring(with: ns.lineRange(for: NSRange(location: line, length: 0))).trimmingCharacters(in: .newlines))?.kind
        let picker = CalloutTypePicker(current: current) { [weak self] kind in
            self?.controller?.setCalloutKind(kind, line: line)
        }
        picker.popoverPresentationController?.sourceView = self
        picker.popoverPresentationController?.sourceRect = rect
        UISelectionFeedbackGenerator().selectionChanged()
        top.present(picker, animated: true)
    }

    /// Where a checkbox's circle is, in the view, for the line starting at `line` (tests).
    func checkboxCenter(line: Int) -> CGPoint? {
        core.checkboxRect(line: line, layout: textLayoutManager).map { CGPoint(x: $0.midX + textContainerInset.left, y: $0.midY + textContainerInset.top) }
    }

    /// A tap at `point`: on a checkbox's circle, in a note you can change, ticks it.
    func tapCheckbox(at point: CGPoint) {
        guard isEditable, let line = checkboxLine(for: point),
              let edit = ListEditing.toggleCheckbox(in: text, lineStart: line) else { return }
        // The row drawn under the finger, even while rows slide; then they stop where they're going.
        core.endSlides()
        // A tick is a tap on a control: the caret, the scroll position and the keyboard stay as they were.
        let keep = selectedRange
        let offset = contentOffset
        // The circle's place before the edit, while the line's layout is still current.
        let circle = core.checkboxRect(line: line, layout: textLayoutManager)
        asOneStep { apply(edit) }
        selectedRange = keep
        setContentOffset(offset, animated: false)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        if edit.replacement == "x", let r = circle {
            CheckPop.play(in: layer, rect: r.offsetBy(dx: textContainerInset.left, dy: textContainerInset.top),
                          completes: CheckPop.completesList(text, lineStart: line))
        }
        if controller?.sortsTickedItems != false { core.sortSoon(after: line, text: { [weak self] in self?.text ?? "" }) { [weak self] in self?.sortChecklist(around: $0) } }
    }

    /// Ticked items sink below the open ones, a moment after the tick, sliding into place.
    /// The caret stays with the text it was in, and nothing scrolls or takes focus.
    private func sortChecklist(around line: Int) {
        let sel = selectedRange
        guard let edit = ListEditing.sortChecklist(in: text, around: min(line, (text as NSString).length), caret: sel.location) else { return }
        let old = ReorderSlide.lines(of: edit.range, in: text as NSString)
        let frames = ReorderSlide.bands(old.map(\.1.location), layout: textLayoutManager,
                                        origin: CGPoint(x: textContainerInset.left, y: textContainerInset.top), width: bounds.width)
        let pictures = frames.compactMap { resizableSnapshotView(from: $0, afterScreenUpdates: false, withCapInsets: .zero) }
        let offset = contentOffset
        // Part of the tick's step of Undo: one Undo puts the item back unticked where it was.
        withoutUndo { apply(TextEdit(range: edit.range, replacement: edit.replacement, caret: -1)) }
        selectedRange = NSRange(location: edit.caret >= 0 ? edit.caret : sel.location, length: edit.caret >= 0 ? 0 : sel.length)
        setContentOffset(offset, animated: false)
        guard pictures.count == old.count, let first = frames.first, let last = frames.last else { return }
        let moves = ReorderSlide.moves(old: old.map(\.0), new: edit.replacement.components(separatedBy: "\n"))
        let starts = ReorderSlide.lines(of: NSRange(location: edit.range.location, length: (edit.replacement as NSString).length), in: text as NSString).map(\.1.location)
        let tops = ReorderSlide.targets(heights: frames.map(\.height), moves: moves)
        core.slideStarted(ReorderSlide.play(in: self, rows: Array(zip(pictures, frames)).map { ($0, $1) }, newTops: tops,
                                            lines: moves.map { starts[min($0, starts.count - 1)] }, cover: first.union(last), pageColor: .panePage))
    }

    // MARK: A tick and the sinking after it: one step of Undo

    /// Untick All (EditorController): one step of Undo, named for shake and the Edit menu, the
    /// caret, scroll and keyboard where they were.
    func applyStep(_ edit: TextEdit, named name: String) {
        core.endSlides()
        let keep = selectedRange
        let offset = contentOffset
        asOneStep { apply(edit) }
        if NSMaxRange(keep) <= (text as NSString).length { selectedRange = keep }
        setContentOffset(offset, animated: false)
        noteStack?.setActionName(name)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    func applyMove(_ edit: TextEdit, named name: String) {
        core.endSlides()
        asOneStep { apply(edit) }
        noteStack?.setActionName(name)
    }

    /// Makes `change` as one step of Undo that puts the whole text back as it was, so the sort that
    /// follows a tick (done `withoutUndo`) goes back with it, as in Notes. Steps below it stay.
    private func asOneStep(_ change: () -> Void) {
        let before = text ?? "", selection = selectedRange
        withoutUndo(change)
        registerStep(back: before, selection: selection)
        typing = nil; typedText = text
    }

    /// Typing close together (and Return, a list's own edits, a paste), one step of Undo back to
    /// the text before it, as UIKit groups typing. A pause, or any other step, starts the next.
    private final class TypingRun {
        static let joinWithin: TimeInterval = 1.5
        var last = Date.now
    }
    private var typing: TypingRun?
    /// Set while `apply` writes into the storage with the keyboard down (it has its own step).
    private var writingStorage = false
    /// The text as the last change left it: what a new run of typing goes back to.
    private var typedText = ""
    private var typedSelection = NSRange(location: 0, length: 0)

    private func recordTyping() {
        let now = text ?? ""
        defer { typedText = now; typedSelection = selectedRange }
        guard controller?.ownUndo == nil, !quietEdit, now != typedText, let undo = noteStack,
              !undo.isUndoing, !undo.isRedoing, undo.isUndoRegistrationEnabled else { return }
        // A change written straight into the storage (a table cell's typing) has its own step.
        guard !writingStorage else { return }
        // More of the same run: soon after, and where the last change left the caret (typing
        // somewhere else is a step of its own, as in UIKit).
        let at = TextDiff.edit(from: typedText, to: now).map { $0.range.location == typedSelection.location || NSMaxRange($0.range) == typedSelection.location } ?? false
        if let run = typing, at, undo.canUndo, Date.now.timeIntervalSince(run.last) < TypingRun.joinWithin {
            run.last = .now
            return
        }
        registerStep(back: typedText, selection: typedSelection)
        typing = TypingRun()
        downStep = nil
    }

    /// Set while a change goes in without a step of Undo of its own (`apply`).
    private var quietEdit = false

    private func withoutUndo(_ change: () -> Void) {
        let was = quietEdit
        quietEdit = true
        defer { quietEdit = was }
        change()
    }

    /// What a tick's step is registered with, apart from the text view's own steps.
    private final class StepTarget {
        weak var view: PaneTextView?
        init(_ view: PaneTextView) { self.view = view }
    }
    private lazy var stepTarget = StepTarget(self)

    private func registerStep(back to: String, selection: NSRange) {
        guard to != text else { return }
        noteStack?.registerUndo(withTarget: stepTarget) { target in
            guard let view = target.view else { return }
            let now = view.text ?? "", kept = view.selectedRange
            view.typing = nil
            view.core.endSlides()
            let e = TextDiff.edit(from: now, to: to)
            if let e { view.withoutUndo { view.apply(TextEdit(range: e.range, replacement: e.replacement, caret: -1)) } }
            if NSMaxRange(selection) <= (to as NSString).length { view.selectedRange = selection }
            if let e { view.placeAfterUndo(at: e.range.location + (e.replacement as NSString).length) }
            // Registered while undoing, this is the Redo.
            view.registerStep(back: now, selection: kept)
        }
    }

    // MARK: Hardware keyboard

    override var keyCommands: [UIKeyCommand]? {
        [
            UIKeyCommand(input: "\t", modifierFlags: [], action: #selector(indentLine)),
            UIKeyCommand(input: "\t", modifierFlags: .shift, action: #selector(outdentLine)),
        ]
    }

    @objc private func indentLine() {
        if let e = ListEditing.indent(in: text, selection: selectedRange, outdent: false) { apply(e) } else { insertText("\t") }
    }

    @objc private func outdentLine() {
        if let e = ListEditing.indent(in: text, selection: selectedRange, outdent: true) { apply(e) }
    }
}

/// The text view's undo in a shared note: Undo and Redo (Shake, the keyboard's, Command-Z) take
/// your own steps from OwnUndo; what UIKit registers itself is ignored.
final class OwnUndoManager: UndoManager {
    weak var view: PaneTextView?

    init(view: PaneTextView) {
        self.view = view
        super.init()
        disableUndoRegistration()
    }

    override var canUndo: Bool { view?.controller?.ownUndo?.canUndo ?? false }
    override var canRedo: Bool { view?.controller?.ownUndo?.canRedo ?? false }
    override func undo() { view?.ownUndoStep(redo: false) }
    override func redo() { view?.ownUndoStep(redo: true) }
    override var undoActionName: String { "" }
    override var redoActionName: String { "" }
}
#else
import AppKit
import UniformTypeIdentifiers

private struct PlatformEditor: NSViewRepresentable {
    let initialText: String
    let header: String
    let controller: EditorController
    let autofocus: Bool
    let identifier: String
    let titleLine: Bool
    let followsInitialText: Bool
    let dateShown: Bool
    let foot: NoteLinks?
    let foldsID: UUID?
    let onChange: (String) -> Void

    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NoteScrollView()
        scroll.drawsBackground = false
        scroll.hasVerticalScroller = true
        scroll.autohidesScrollers = true
        scroll.scrollerStyle = .overlay
        let view = PaneTextView(frame: .zero)
        #if DEBUG && os(macOS)
        view.renderContext = context.environment.modelContext
        #endif
        view.core.styler.firstLineIsTitle = titleLine
        view.core.styler.wiki = controller.wiki
        view.core.folds.noteID = foldsID
        view.configure(text: initialText, header: header)
        view.setAccessibilityIdentifier(identifier)
        view.core.onChange = onChange
        view.controller = controller
        view.core.resolveAttachment = { [weak controller] id in controller?.resolveAttachment(id) }
        controller.target = view
        scroll.documentView = view
        view.setFoot(foot)
        if autofocus { view.focusWhenShown() }
        // Format › Untick All for this note, not the one before (after this update, not in it).
        DispatchQueue.main.async { [weak controller, weak view] in
            guard let controller, let view, controller.target === view else { return }
            controller.updateUntick(text: view.string, selection: nil)
        }
        return scroll
    }

    func updateNSView(_ scroll: NSScrollView, context: Context) {
        guard let view = scroll.documentView as? PaneTextView else { return }
        view.core.onChange = onChange
        view.setHeader(header)
        if followsInitialText { view.syncExternal(initialText) }
        if controller.target !== view { controller.target = view }
        view.setWiki(controller.wiki)
        view.setImages(controller.imagesArrived)
        view.showRemoteCarets(controller.remoteCarets)
        // A shared note keeps its own undo (only your edits); the system's would undo everyone's.
        if view.allowsUndo != (controller.ownUndo == nil) { view.allowsUndo = controller.ownUndo == nil }
        // Recently Deleted and Can view: shown, selectable to copy, never changed.
        if view.isEditable == controller.readOnly { view.isEditable = !controller.readOnly }
        view.setFoot(foot)
    }
}

/// A table's view on the Mac. Its add bars' strips lie over the margin and the space below the
/// table: a click there is the table's only on a bar, otherwise it goes to the text.
final class GridHostingView: NSHostingView<AnyView> {
    var box: GridHitBox?
    /// The right-click menu for a cell: its row and column, as in Notes. Without it the click
    /// fell through to the text, which selected the whole table and offered only text items
    /// (council round 16).
    var cellMenu: ((GridHostingView, GridCell) -> NSMenu?)?

    override func menu(for event: NSEvent) -> NSMenu? {
        var p = convert(event.locationInWindow, from: nil)
        if !isFlipped { p.y = bounds.height - p.y }
        if let cell = box?.cell(at: p), let menu = cellMenu?(self, cell) { return menu }
        return super.menu(for: event)
    }

    override func rightMouseDown(with event: NSEvent) {
        if let menu = menu(for: event), menu.items.first?.representedObject is TableMenuAction {
            NSMenu.popUpContextMenu(menu, with: event, for: self)
        } else {
            super.rightMouseDown(with: event)
        }
    }

    override func hitTest(_ point: NSPoint) -> NSView? {
        var p = convert(point, from: superview)
        if !isFlipped { p.y = bounds.height - p.y }
        if let box, !box.takes(p, in: bounds.size) { return nil }
        return super.hitTest(point)
    }
}

/// The note's scroll view. Its tiling (a new size, the toolbar's inset arriving) is part of the
/// layout pass before a frame is drawn, so the note folds its date there (PaneTextView.foldDate).
/// ⌘F when the keys aren't in the note (just after the app opens they're with the list): finds in
/// the open note, as in Notes, or searches the notes when none is open. The app delegate calls it,
/// last in the chain, so a text view that has the keys still takes ⌘F first (council round 16:
/// ⌘F straight after launch did nothing).
@MainActor enum FindRouter {
    /// The note's own text view: the biggest one on show in the window.
    static func editor(in window: NSWindow?) -> PaneTextView? {
        guard let root = window?.contentView else { return nil }
        var found: [PaneTextView] = []
        func walk(_ v: NSView) {
            if let t = v as? PaneTextView, t.enclosingScrollView is NoteScrollView, !t.isHiddenOrHasHiddenAncestor { found.append(t) }
            v.subviews.forEach(walk)
        }
        walk(root)
        return found.max { $0.visibleRect.width * $0.visibleRect.height < $1.visibleRect.width * $1.visibleRect.height }
    }

    static func find(in window: NSWindow?, sender: Any?) {
        guard let window, let e = editor(in: window) else {
            NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
            return
        }
        window.makeFirstResponder(e)
        e.performFindPanelAction(sender)
    }
}

final class NoteScrollView: NSScrollView {
    override func tile() {
        super.tile()
        (documentView as? PaneTextView)?.foldDate()
    }

    /// The find bar opening or closing moves an untouched note's fold with it (findShift).
    override var isFindBarVisible: Bool {
        didSet {
            guard isFindBarVisible != oldValue, let text = documentView as? PaneTextView else { return }
            tile()
            text.refold()
        }
    }

    /// Scrolled by hand: the fold is the reader's now, and the inset no longer moves it.
    override func scrollWheel(with event: NSEvent) {
        (documentView as? PaneTextView)?.foldedAt = nil
        super.scrollWheel(with: event)
    }
}

final class PaneTextView: NSTextView, NSTextViewDelegate, EditorTarget {
    #if DEBUG
    weak var renderContext: ModelContext?
    #endif
    let core = EditorCore()
    weak var controller: EditorController?
    private let headerLabel = NSTextField(labelWithString: "")
    /// The date's top, and the text's top under it (or without a date). The date is centred above
    /// the title and out of view: a note opens at its title, and the date shows when you scroll up
    /// past it, as on the iPhone (DateFold; Emil, 31 October 2026).
    static let dateTop: CGFloat = 10
    static let textTop: CGFloat = 44
    static let bareTop: CGFloat = 16
    /// How far a note opens scrolled: the date out of view, the title where it is without one.
    static var fold: CGFloat { textTop - bareTop }
    /// The note has been drawn once: from then on the fold only follows the toolbar's inset.
    private var drawn = false
    /// Where the fold put the text, while nobody has scrolled it since (NoteScrollView).
    var foldedAt: CGFloat?
    private var hasDate: Bool { !headerLabel.stringValue.isEmpty }

    /// The text's margin on each side (the note's toolbar lines up with it). The text uses the
    /// window's whole width, as in Notes: no reading column (Emil, 31 October 2026: "remove it").
    static func textSide(width: CGFloat) -> CGFloat {
        DesignLook.readingPage ? 32 : 20
    }

    private var cardHosts: [String: NSHostingView<AnyView>] = [:]
    /// Every card gets a host, not only those in view: the whole note is going on paper.
    private var onPaperNow = false

    /// Runs `operation` on the note as paper shows it: the light look in dark mode too, no date,
    /// every table and picture there. SwiftUI's cards don't draw into a print context (a PDF had a
    /// hole where its table was), so for the run each is a picture of itself. All put back after.
    func onPaper(_ operation: NSPrintOperation) {
        let look = appearance, background = drawsBackground, date = headerLabel.isHidden
        appearance = NSAppearance(named: .aqua)
        drawsBackground = false
        headerLabel.isHidden = true
        onPaperNow = true
        layoutCards(animated: false)
        layoutSubtreeIfNeeded()
        // A turn for SwiftUI to take the light look and draw.
        RunLoop.main.run(until: Date().addingTimeInterval(0.25))
        let hosts = Array(cardHosts.values)
        let pictures = hosts.map { host -> NSImageView in
            let picture = NSImageView(frame: host.frame)
            picture.imageScaling = .scaleAxesIndependently
            if let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: rep)
                let image = NSImage(size: host.bounds.size)
                image.addRepresentation(rep)
                picture.image = image
            }
            host.isHidden = true
            addSubview(picture)
            return picture
        }
        defer {
            pictures.forEach { $0.removeFromSuperview() }
            hosts.forEach { $0.isHidden = false }
            onPaperNow = false
            headerLabel.isHidden = date
            appearance = look
            drawsBackground = background
            layoutCards(animated: false)
        }
        operation.run()
    }

    #if DEBUG
    var renderedCardKeys: Set<String> { Set(cardHosts.keys) }
    #endif
    private var cardLayoutQueued = false
    private var queuedCardAnimation = true

    /// Styling, selection and frame changes can all request overlays in the same turn.
    private func queueCardLayout(animated: Bool = true) {
        queuedCardAnimation = queuedCardAnimation && animated
        guard !cardLayoutQueued else { return }
        cardLayoutQueued = true
        DispatchQueue.main.async { [weak self] in
            guard let self, self.cardLayoutQueued else { return }
            self.layoutCards(animated: self.queuedCardAnimation)
        }
    }

    func configure(text: String, header: String) {
        textLayoutManager?.delegate = core.layoutDelegate
        (textLayoutManager?.textContentManager as? NSTextContentStorage)?.delegate = core.foldDelegate
        core.onCardsChanged = { [weak self] in self?.queueCardLayout() }
        drawsBackground = false
        isRichText = false
        allowsUndo = true
        watchUndo()
        isAutomaticQuoteSubstitutionEnabled = false
        isAutomaticDashSubstitutionEnabled = false
        isAutomaticTextReplacementEnabled = false
        isAutomaticLinkDetectionEnabled = false
        registerForDraggedTypes([.fileURL, Self.paneItemType])
        smartInsertDeleteEnabled = false
        usesFindBar = true
        isIncrementalSearchingEnabled = true
        linkTextAttributes = [.cursor: NSCursor.pointingHand]
        isVerticallyResizable = true
        isHorizontallyResizable = false
        autoresizingMask = [.width]
        textContainer?.widthTracksTextView = true
        textContainer?.lineFragmentPadding = 0
        typingAttributes = core.styler.typingAttributes
        drawn = false
        foldedAt = nil
        string = text
        lastReported = text
        remember(text)
        core.observe(textStorage!)
        observeChangeHighlight()
        core.watchDays { [weak self] in
            guard let self, let storage = self.textStorage else { return }
            self.core.dayChanged(storage: storage, selection: self.editingSelection)
        }
        core.styler.bodySize = EditorMetrics.body
        core.restyle(textStorage!, selection: nil, force: true)
        typingAttributes = core.typingAttributes(text, at: selectedRange().location)
        if textSizeObserver == nil {
            textSizeObserver = NotificationCenter.default.addObserver(forName: TextSize.didChange, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.textSizeChanged() }
            }
        }

        headerLabel.font = .systemFont(ofSize: 11, weight: .medium)
        headerLabel.textColor = .tertiaryLabelColor
        headerLabel.alignment = .center
        headerLabel.setAccessibilityIdentifier("editor.date")
        addSubview(headerLabel)
        setHeader(header)
        setAccessibilityIdentifier("editor")
        placeCaretFromLaunchArguments()
        // Assigning string sends a selection notification. Listen after the initial styling,
        // so that notification doesn't style the whole note a second time.
        delegate = self
    }

    private var textSizeObserver: NSObjectProtocol?

    /// View › Bigger or Smaller: every line restyled at the new size, the cards and foot moved to
    /// where the text now is. The caret and scroll stay where they were.
    func textSizeChanged() {
        guard let storage = textStorage else { return }
        core.styler.bodySize = EditorMetrics.body
        core.restyle(storage, selection: editingSelection, force: true)
        typingAttributes = core.typingAttributes(string, at: selectedRange().location)
        if let tlm = textLayoutManager { tlm.invalidateLayout(for: tlm.documentRange) }
        setInsets(width: frame.width)
        placeFoot()
        // Cards draw their text at the size they were given: forget it, so each table and card
        // gets its content again at the new size.
        cardContent.removeAll()
        queueCardLayout(animated: false)
        needsDisplay = true
    }

    /// Test runs can start editing at some text: `-uitest -caret "Manteigaria"`.
    private func placeCaretFromLaunchArguments() {
        let args = ProcessInfo.processInfo.arguments
        guard args.contains("-uitest"), let i = args.firstIndex(of: "-caret"), i + 1 < args.count else { return }
        let target = (string as NSString).range(of: args[i + 1])
        guard target.location != NSNotFound else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            guard let self else { return }
            self.window?.makeFirstResponder(self)
            self.setSelectedRange(NSRange(location: NSMaxRange(target), length: 0))
        }
    }

    func setHeader(_ s: String) {
        if headerLabel.stringValue != s { headerLabel.stringValue = s }
    }

    #if DEBUG || QA
    /// Tests: how far the note was scrolled under the toolbar, and how much of the date showed,
    /// when the window first drew it.
    private(set) var firstDrawn: (top: CGFloat, date: CGFloat)?
    #endif

    override func viewWillDraw() {
        // The last word before the first frame: whatever moved the text while the window was
        // being put together (the toolbar's inset arriving, the scroll view keeping its place),
        // the note is drawn folded.
        if !drawn, window != nil, (enclosingScrollView?.contentView.bounds.height ?? 0) > 0 {
            foldDate()
            drawn = true
        }
        super.viewWillDraw()
        #if DEBUG || QA
        if firstDrawn == nil, let scroll = enclosingScrollView {
            firstDrawn = (scroll.contentView.bounds.origin.y + scroll.contentInsets.top, headerLabel.alphaValue)
        }
        #endif
    }

    override func setFrameSize(_ newSize: NSSize) {
        // A new width (the sidebar hiding or coming back, the window resized) with the note still
        // at its fold: it stays there. The text view scrolled its first line to the top after the
        // width changed, so the note jumped up 16 pt (council rounds 8 and 9).
        let keepFold = newSize.width != frame.width && nearFold
        defer {
            if keepFold {
                // The text view's own scroll comes a pass or two after the width; catch it each time.
                for delay in [0.0, 0.15, 0.4] {
                    DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.returnToFold() }
                }
            }
        }
        // A short note still scrolls past its date: never shorter than the view plus the fold.
        var newSize = newSize
        if DesignLook.readingPage, hasDate, let scroll = enclosingScrollView {
            let view = scroll.contentView.bounds.height - scroll.contentInsets.top - scroll.contentInsets.bottom
            newSize.height = max(newSize.height, view + Self.fold)
        }
        super.setFrameSize(newSize)
        // Like Notes on the Mac: a slim margin and text that uses the full width. The date sits
        // centred above the title, folded out of view until you scroll up (see `fold`).
        setInsets(width: newSize.width)
        placeFoot()
        sizePictures()
        foldDate()
        // Straight to their new places: while the width changes (the sidebar sliding, the window
        // being resized) the cards follow the text instead of gliding after it.
        queueCardLayout(animated: false)
        DispatchQueue.main.async { [weak self] in self?.layoutRemoteCarets() }
    }

    /// Pictures fit the text's width and at most 60% of the window's height (ImageSizes).
    private func sizePictures() {
        guard let container = textContainer else { return }
        let width = frame.width - textContainerInset.width * 2 - container.lineFragmentPadding * 2
        let height = enclosingScrollView?.contentView.bounds.height ?? frame.height
        core.setImageBox(width: width, height: height, storage: textStorage!, selection: editingSelection)
    }

    private func setInsets(width: CGFloat) {
        // The foot's room goes under the text: the inset is the same above and below, so it's
        // half of it each side and the text is drawn that much higher (`textContainerOrigin`).
        if DesignLook.readingPage {
            let side = Self.textSide(width: width)
            let inset = NSSize(width: side, height: (headerLabel.stringValue.isEmpty ? Self.bareTop : Self.textTop) + footExtra / 2)
            if textContainerInset != inset { textContainerInset = inset }
            headerLabel.alignment = .center
            headerLabel.frame = NSRect(x: side, y: Self.dateTop, width: max(0, width - side * 2), height: 16)
        } else {
            let inset = NSSize(width: 20, height: (headerLabel.stringValue.isEmpty ? 14 : 44) + footExtra / 2)
            if textContainerInset != inset { textContainerInset = inset }
            headerLabel.alignment = .center
            headerLabel.frame = NSRect(x: 0, y: 14, width: width, height: 16)
        }
    }

    // MARK: The note's foot

    private var footHost: NSHostingView<NoteLinksSection>?
    private weak var footModel: NoteLinks?
    /// The room the foot takes under the text, its gap included.
    private var footExtra: CGFloat = 0
    /// Where the foot is (tests).
    var footFrame: CGRect? { footHost?.frame }

    override var textContainerOrigin: NSPoint {
        let o = super.textContainerOrigin
        return NSPoint(x: o.x, y: o.y - footExtra / 2)
    }

    func setFoot(_ model: NoteLinks?) {
        guard model !== footModel else { return }
        footHost?.removeFromSuperview()
        footHost = nil
        footModel = model
        if let model {
            let h = NSHostingView(rootView: NoteLinksSection(model: model))
            h.sizingOptions = []
            addSubview(h)
            footHost = h
            model.changed = { [weak self] in self?.footChanged() }
        }
        footChanged()
    }

    private func footChanged() {
        let h = footModel?.height ?? 0
        let extra = h > 0.5 ? EditorFoot.gap + h : 0
        if extra != footExtra {
            footExtra = extra
            setInsets(width: frame.width)
        }
        placeFoot()
    }

    /// Under the last line, across the text's width.
    func placeFoot() {
        guard let host = footHost, let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return }
        // TextKit 2 lays out lazily: until the whole note has been laid out, the used height is
        // only the first lines', and the foot sat under the title (Lisbon on the Air, 11-04). The
        // foot shows only for a note with links or mentions, so only those pay for the layout.
        if (footModel?.height ?? 0) > 0.5 { tlm.ensureLayout(for: tcm.documentRange) }
        let o = textContainerOrigin
        let used = tlm.usageBoundsForTextContainer.maxY
        let frame = NSRect(x: o.x, y: o.y + used + EditorFoot.gap, width: max(0, bounds.width - o.x * 2), height: max(footModel?.height ?? 0, 1))
        if host.frame != frame { host.frame = frame }
    }

    /// What each live view last showed, so one whose content is the same isn't given it again.
    private var cardContent: [String: EditorCore.CardContent] = [:]

    /// Places live views (cards, files, links) over their reserved lines. A view whose content is
    /// unchanged only moves: giving every card its view again, and animating each one, on every
    /// frame of a width change made a note of tables stall.
    func layoutCards(animated: Bool = true) {
        cardLayoutQueued = false
        queuedCardAnimation = true
        #if DEBUG
        RenderProbe.count("PaneTextView.layoutCards", context: renderContext)
        #endif
        guard let storage = textStorage else { return }
        let items = core.overlays(layout: textLayoutManager, origin: textContainerOrigin,
                                  target: self, storage: storage, controller: controller) { [weak self] in self?.editingSelection }
        let live = Set(items.map(\.key))
        for (k, host) in cardHosts where !live.contains(k) {
            host.removeFromSuperview()
            cardHosts[k] = nil
            cardContent[k] = nil
        }
        let viewport = onPaperNow ? bounds : (enclosingScrollView?.documentVisibleRect ?? visibleRect)
        for item in items {
            // Keep visited hosts alive, including a table being edited while scrolled away.
            // A new offscreen table needs a host only when it has a pending focus request.
            let wantsFocus: Bool
            if case .grid(_, let request, _) = item.content { wantsFocus = request != nil } else { wantsFocus = false }
            guard cardHosts[item.key] != nil || wantsFocus || item.frame.intersects(viewport) else { continue }
            let host = cardHosts[item.key] ?? {
                #if DEBUG
                RenderProbe.count("CardHost.created", context: renderContext)
                #endif
                let h: NSHostingView<AnyView>
                if case .grid(let g, _, _) = item.content {
                    let grid = GridHostingView(rootView: item.view)
                    grid.box = core.gridBoxes[g.index]
                    grid.cellMenu = { [weak self] host, cell in self?.tableCellMenu(host: host, cell: cell) }
                    h = grid
                } else {
                    h = NSHostingView(rootView: item.view)
                }
                h.sizingOptions = []
                h.frame = item.frame
                addSubview(h)
                cardHosts[item.key] = h
                return h
            }()
            // VoiceOver hears a table as one, with its size, rather than as loose cells (round 16).
            if case .grid(let g, _, _) = item.content, let grid = host as? GridHostingView {
                grid.setAccessibilityElement(true)
                grid.setAccessibilityRole(.group)
                grid.setAccessibilityRoleDescription("table")
                grid.setAccessibilityLabel(g.spokenSize)
            }
            if cardContent[item.key] != item.content {
                host.rootView = item.view
                cardContent[item.key] = item.content
            }
            if host.frame != item.frame {
                NSAnimationContext.runAnimationGroup { ctx in
                    // Zero duration also ends a glide still under way.
                    ctx.duration = animated ? 0.22 : 0
                    ctx.allowsImplicitAnimation = animated
                    host.animator().frame = item.frame
                }
            }
        }
    }

    func insertGrid() {
        let (edit, index) = core.newGridEdit(text: string, selection: selectedRange())
        core.gridFocus = GridFocusRequest(grid: index, cell: GridCell(row: 0, column: 0))
        apply(edit)
        layoutCards()
    }


    override var isFlipped: Bool { true }

    // MARK: EditorTarget

    var currentText: String { string }
    var currentSelection: NSRange { selectedRange() }

    /// Undo and Redo of the text view's own typing change the text without a text-did-change, so
    /// the note kept saving what was typed before it (persona council r7, bug 18): after any undo
    /// or redo of this view's steps, a text that changed goes the way typing does.
    private var watchingUndo = false
    private func watchUndo() {
        guard !watchingUndo else { return }
        watchingUndo = true
        for name: Notification.Name in [.NSUndoManagerDidUndoChange, .NSUndoManagerDidRedoChange] {
            NotificationCenter.default.addObserver(self, selector: #selector(undoneOrRedone(_:)), name: name, object: nil)
        }
    }

    @objc private func undoneOrRedone(_ note: Notification) {
        guard (note.object as AnyObject?) === undoManager, string != lastReported, !hasMarkedText() else { return }
        textDidChange(Notification(name: NSText.didChangeNotification, object: self))
    }

    func apply(_ edit: TextEdit) {
        // Only the caret moves (⌘B stepping out of bold): not a change, and no step of Undo.
        if edit.range.length == 0, edit.replacement.isEmpty {
            if edit.caret >= 0 { setSelectedRange(NSRange(location: min(edit.caret, (string as NSString).length), length: 0)) }
            return
        }
        guard shouldChangeText(in: edit.range, replacementString: edit.replacement) else { return }
        core.applyingEdit = true
        textStorage?.replaceCharacters(in: edit.range, with: edit.replacement)
        didChangeText()
        core.applyingEdit = false
        if let keep = edit.selection, NSMaxRange(keep) <= (string as NSString).length { setSelectedRange(keep) }
        else if edit.caret >= 0 { setSelectedRange(NSRange(location: min(edit.caret, (string as NSString).length), length: 0)) }
    }

    func focusEditor() { window?.makeFirstResponder(self) }

    /// The date fades as the note scrolls past it, so none of it shows under the toolbar.
    private func fadeDate() {
        guard let scroll = enclosingScrollView else { return }
        let past = scroll.contentView.bounds.origin.y + scroll.contentInsets.top
        // Past the title line: the breadcrumbs in the top bar add the note's title (Emil, 11-03).
        let away = past > Self.fold + Self.titleAway
        if let controller, controller.titleScrolledAway != away { controller.titleScrolledAway = away }
        guard DesignLook.readingPage else { return }
        let alpha = min(1, max(0, 1 - past / (Self.fold * 0.8)))
        if abs(headerLabel.alphaValue - alpha) > 0.01 { headerLabel.alphaValue = alpha }
    }
    /// How far past the fold the title has to scroll before it counts as out of view.
    static let titleAway: CGFloat = 40
    private var watchingScroll = false

    /// A new note's cursor, waiting for the note to be in its window.
    private var focusPending = false

    /// The cursor in this note as soon as it's in a window: a new note (⌘N, Today's note) is
    /// typed into straight away, as in Notes. The editor is made before SwiftUI puts it in the
    /// window, so asking at once, or a turn later, often found no window and the keyboard
    /// stayed in the list (council round 16: "Trip files" typed after ⌘N went nowhere).
    func focusWhenShown() {
        if let window { window.makeFirstResponder(self) } else { focusPending = true }
        DispatchQueue.main.async { [weak self] in
            guard let self, let window = self.window, window.firstResponder !== self else { return }
            self.focusPending = false
            window.makeFirstResponder(self)
        }
    }

    private var keyWatch: [NSObjectProtocol] = []
    /// The window went behind another: no caret shows, so neither does the hint at it.
    private var windowLostFocus = false

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        // The hint at the caret goes and comes with the window's focus, as the caret does.
        keyWatch.forEach(NotificationCenter.default.removeObserver)
        keyWatch = []
        if let window {
            for (name, lost) in [(NSWindow.didBecomeKeyNotification, false), (NSWindow.didResignKeyNotification, true)] {
                keyWatch.append(NotificationCenter.default.addObserver(forName: name, object: window, queue: nil) { [weak self] _ in
                    MainActor.assumeIsolated {
                        self?.windowLostFocus = lost
                        self?.layoutSlashHint()
                    }
                })
            }
        }
        if focusPending, let window {
            focusPending = false
            DispatchQueue.main.async { [weak self] in
                guard let self, self.window === window else { return }
                window.makeFirstResponder(self)
            }
        }
        foldDate()
        guard !watchingScroll, let clip = enclosingScrollView?.contentView else { return }
        watchingScroll = true
        clip.postsBoundsChangedNotifications = true
        NotificationCenter.default.addObserver(forName: NSView.boundsDidChangeNotification, object: clip, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.fadeDate()
                // Geometry can change during TextKit layout. Merge this with the queued frame
                // pass instead of creating a SwiftUI host reentrantly inside that layout.
                if let self, !self.core.grids.isEmpty || !self.core.embeds.isEmpty {
                    self.queueCardLayout(animated: false)
                }
            }
        }
    }

    /// Opens the note at its title, the date just above, out of view, before the note is first
    /// drawn: set wherever the window's layout reaches the note (its size, its window, the scroll
    /// view's tiling) and checked once more as it is about to draw (viewWillDraw). Once drawn,
    /// the fold only follows a change of the toolbar's inset, and only while nobody has scrolled.
    /// It was a scroll a turn after the note was laid out: each note was drawn once with its date,
    /// then jumped up, and clicking from note to note flickered (Emil, 11-02).
    /// At the fold or within one fold below it, nobody having scrolled since (scrollWheel clears
    /// `foldedAt`): where a width change's own scroll leaves an opened note. Further down is
    /// the reader's place (typing, a search hit), and stays.
    /// While the find bar is open, the fold is that much higher, so the title sits below the bar
    /// rather than under it: the bar lies over the top of the note, and Notes moves its note down
    /// for its bar (council round 15, a5-find-bar). A note scrolled by hand stays where it is.
    var findShift: CGFloat {
        guard let scroll = enclosingScrollView, scroll.isFindBarVisible, let bar = scroll.findBarView else { return 0 }
        return min(Self.fold, bar.frame.height)
    }

    private var nearFold: Bool {
        guard foldedAt != nil, let scroll = enclosingScrollView else { return false }
        let target = -scroll.contentInsets.top + Self.fold - findShift
        let y = scroll.contentView.bounds.origin.y
        return y >= target - 0.5 && y <= target + Self.fold + 0.5
    }

    /// Back to the fold after a width change, unless someone scrolled since.
    private func returnToFold() {
        guard nearFold, let scroll = enclosingScrollView else { return }
        let target = -scroll.contentInsets.top + Self.fold - findShift
        guard abs(scroll.contentView.bounds.origin.y - target) >= 0.5 else { return }
        scroll.contentView.scroll(to: NSPoint(x: scroll.contentView.bounds.origin.x, y: target))
        scroll.reflectScrolledClipView(scroll.contentView)
        foldedAt = target
    }

    /// The fold again after the find bar opens or closes, if nobody has scrolled since.
    func refold() {
        guard let scroll = enclosingScrollView, let at = foldedAt,
              DesignLook.readingPage, hasDate, !DateFold.showOnOpen else { return }
        let target = -scroll.contentInsets.top + Self.fold - findShift
        guard abs(scroll.contentView.bounds.origin.y - at) < 0.5, abs(at - target) >= 0.5 else { return }
        scroll.contentView.scroll(to: NSPoint(x: scroll.contentView.bounds.origin.x, y: target))
        scroll.reflectScrolledClipView(scroll.contentView)
        foldedAt = target
    }

    func foldDate() {
        guard DesignLook.readingPage, hasDate, !DateFold.showOnOpen, window != nil,
              let scroll = enclosingScrollView, scroll.contentView.bounds.height > 0 else { return }
        let clip = scroll.contentView
        let target = -scroll.contentInsets.top + Self.fold - findShift
        if abs(clip.bounds.origin.y - target) < 0.5 { foldedAt = clip.bounds.origin.y; return }
        // Once drawn, only a fold nobody has scrolled away from moves with the inset.
        if drawn { guard let at = foldedAt, abs(clip.bounds.origin.y - at) < 0.5 else { return } }
        // Room to scroll that far, for a short note (setFrameSize keeps it).
        let view = clip.bounds.height - scroll.contentInsets.top - scroll.contentInsets.bottom
        if frame.height < view + Self.fold { setFrameSize(NSSize(width: frame.width, height: view + Self.fold)) }
        clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: target))
        scroll.reflectScrolledClipView(clip)
        foldedAt = clip.bounds.origin.y
        fadeDate()
    }

    /// Scrolls the line at `location` to the top (a link to a heading), focus left as it is.
    func reveal(_ location: Int) {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager, let scroll = enclosingScrollView,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: min(max(location, 0), (string as NSString).length)) else { return }
        tlm.ensureLayout(for: tcm.documentRange)
        guard let frag = tlm.textLayoutFragment(for: loc) else { return }
        let clip = scroll.contentView
        let top = -scroll.contentInsets.top
        let y = frag.layoutFragmentFrame.minY + textContainerOrigin.y - scroll.contentInsets.top - 8
        let bottom = max(top, frame.height - clip.bounds.height + scroll.contentInsets.bottom)
        clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: min(max(top, y), bottom)))
        scroll.reflectScrolledClipView(clip)
    }

    func flashFound(_ range: NSRange) {
        guard NSMaxRange(range) <= (string as NSString).length else { return }
        showFindIndicator(for: range)
    }

    override func paste(_ sender: Any?) {
        let pb = NSPasteboard.general
        if let urls = pb.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL], !urls.isEmpty {
            controller?.insertFiles(controller?.addFiles(urls) ?? [])
            return
        }
        let imageData = pb.data(forType: .png) ?? pb.data(forType: NSPasteboard.PasteboardType("public.jpeg"))
            ?? pb.data(forType: .tiff).flatMap({ NSBitmapImageRep(data: $0)?.representation(using: .png, properties: [:]) })
        let html = pb.data(forType: .html).flatMap { String(data: $0, encoding: .utf8) }
        if let data = imageData, RichPaste.kind(hasImage: true, text: pb.string(forType: .string), htmlIsOnlyImage: RichPaste.htmlIsOnlyImage(html)) == .image {
            if let a = controller?.addData(data, "Image \(Date.now.formatted(.iso8601.year().month().day().time(includingFractionalSeconds: false))).png".replacingOccurrences(of: ":", with: "."), .png) {
                controller?.insertFiles([a])
            }
            return
        }
        if let md = RichPaste.markdownFromPasteboard() {
            let sel = selectedRange()
            apply(TextEdit(range: sel, replacement: md, caret: sel.location + (md as NSString).length))
            return
        }
        pasteAsPlainText(sender)
    }

    // MARK: Dropping files

    private func droppedFiles(_ info: NSDraggingInfo) -> [URL] {
        (info.draggingPasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL]) ?? []
    }

    // MARK: Dropping notes from the list

    static let paneItemType = NSPasteboard.PasteboardType(UTType.paneItem.identifier)

    private func carriesNotes(_ info: NSDraggingInfo) -> Bool {
        info.draggingPasteboard.availableType(from: [Self.paneItemType]) != nil
    }

    private func droppedNotes(_ info: NSDraggingInfo) -> [UUID] {
        EditorController.draggedNotes((info.draggingPasteboard.pasteboardItems ?? []).compactMap { $0.data(forType: Self.paneItemType) })
    }

    /// Notes dropped at a place in the text: a link to each goes in there (see `insertNoteLinks`).
    @discardableResult
    func dropNotes(_ ids: [UUID], at index: Int) -> Bool {
        guard !ids.isEmpty else { return false }
        setSelectedRange(NSRange(location: min(max(index, 0), (string as NSString).length), length: 0))
        return controller?.insertNoteLinks(ids) ?? false
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        // Copy, as the list's rows offer it: a link asked for here was a drop refused.
        if carriesNotes(sender) { return .copy }
        return droppedFiles(sender).isEmpty ? super.draggingEntered(sender) : .copy
    }

    override func draggingUpdated(_ sender: NSDraggingInfo) -> NSDragOperation {
        if carriesNotes(sender) {
            // Show where the link will land.
            let at = characterIndexForInsertion(at: convert(sender.draggingLocation, from: nil))
            setSelectedRange(NSRange(location: at, length: 0))
            return .copy
        }
        guard !droppedFiles(sender).isEmpty else { return super.draggingUpdated(sender) }
        // Show where the file will land.
        let at = characterIndexForInsertion(at: convert(sender.draggingLocation, from: nil))
        setSelectedRange(NSRange(location: at, length: 0))
        return .copy
    }

    override func prepareForDragOperation(_ sender: NSDraggingInfo) -> Bool {
        // A text view only prepares for what it can paste; notes from the list are taken below.
        carriesNotes(sender) || super.prepareForDragOperation(sender)
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        if carriesNotes(sender) {
            let at = characterIndexForInsertion(at: convert(sender.draggingLocation, from: nil))
            window?.makeFirstResponder(self)
            let ids = droppedNotes(sender)
            let done = dropNotes(ids, at: at)
            TextDrop.log.notice("text drop: \(ids.count) notes read, \(done ? "linked" : "nothing linked", privacy: .public)")
            return done
        }
        let urls = droppedFiles(sender)
        guard !urls.isEmpty else { return super.performDragOperation(sender) }
        let at = characterIndexForInsertion(at: convert(sender.draggingLocation, from: nil))
        setSelectedRange(NSRange(location: at, length: 0))
        controller?.insertFiles(controller?.addFiles(urls) ?? [])
        return true
    }

    // MARK: Delegate

    /// Links open only through LinkPolicy: web, mail, phone, or another note.
    func textView(_ textView: NSTextView, clickedOnLink link: Any, at charIndex: Int) -> Bool {
        switch LinkPolicy.action(for: link) {
        case .open(let url): NSWorkspace.shared.open(url)
        case .note(let id): controller?.openNote(id)
        case .wiki(let target): controller?.openWiki(target)
        case .tag(let name): controller?.openTag(name)
        case .nothing: NSSound.beep()
        }
        return true
    }

    func textView(_ textView: NSTextView, doCommandBy selector: Selector) -> Bool {
        if let c = controller, !c.wikiSuggestions.isEmpty {
            switch selector {
            case #selector(moveDown(_:)): c.wikiChoice = min(c.wikiChoice + 1, c.wikiSuggestions.count - 1); return true
            case #selector(moveUp(_:)): c.wikiChoice = max(c.wikiChoice - 1, 0); return true
            case #selector(insertNewline(_:)), #selector(insertTab(_:)):
                c.completeWiki(c.wikiSuggestions[min(c.wikiChoice, c.wikiSuggestions.count - 1)])
                layoutWikiSuggestions()
                return true
            case #selector(cancelOperation(_:)): c.dismissWikiSuggestions(); layoutWikiSuggestions(); return true
            default: break
            }
        }
        if let c = controller, !c.slashCommands.isEmpty {
            switch selector {
            case #selector(moveDown(_:)): c.moveSlashChoice(by: 1); return true
            case #selector(moveUp(_:)): c.moveSlashChoice(by: -1); return true
            case #selector(insertNewline(_:)), #selector(insertTab(_:)): c.runSlashChoice(); layoutSlashCommands(); return true
            case #selector(cancelOperation(_:)): c.dismissSlash(); layoutSlashCommands(); return true
            default: break
            }
        }
        switch selector {
        case #selector(insertNewline(_:)):
            // Undo goes back a line at a time: without this, ⌘Z took everything typed since the
            // caret last moved, a whole new note back to its empty title (persona council r7d, a
            // real Mac window). Return and the line after it are one step.
            breakUndoCoalescing()
            if foldReturn(selectedRange()) { return true }
            if let e = ListEditing.returnKey(in: string, selection: selectedRange()) { apply(e); return true }
        case #selector(deleteBackward(_:)), #selector(deleteForward(_:)):
            let forward = selector == #selector(deleteForward(_:))
            if let d = core.deleteNearBlock(string, selectedRange(), forward: forward) {
                switch d {
                case .arm: layoutCards()
                case .delete(let e): apply(e)
                }
                return true
            }
            // A date chip goes in one press, like an attachment.
            if let e = NoteDates.delete(in: string, selection: selectedRange(), forward: forward, isChip: { [weak self] r in self?.textStorage?.attribute(.paneDate, at: r.location, effectiveRange: nil) != nil }) { apply(e); return true }
            if !forward, let e = ListEditing.backspace(in: string, selection: selectedRange()) { apply(e); return true }
        case #selector(insertTab(_:)):
            if let e = ListEditing.indent(in: string, selection: selectedRange(), outdent: false) { apply(e); return true }
        case #selector(insertBacktab(_:)):
            if let e = ListEditing.indent(in: string, selection: selectedRange(), outdent: true) { apply(e); return true }
        default: break
        }
        return false
    }

    func textDidChange(_ notification: Notification) {
        guard !hasMarkedText() else { return }
        takeWhatArrivedWhileComposing()
        core.layoutDelegate.tint.stop()
        // Rows still sliding would cover the new text.
        core.endSlides()
        core.restyle(textStorage!, selection: editingSelection, force: true)
        typingAttributes = core.typingAttributes(string, at: selectedRange().location)
        recordOwnEdit()
        lastReported = string
        remember(string)
        core.onChange(string)
        controller?.typingChanged(text: string, selection: editingSelection)
        layoutWikiSuggestions()
        // A line more or less moves the foot even when the view keeps its height, once it's laid out.
        DispatchQueue.main.async { [weak self] in self?.placeFoot() }
    }

    /// The last body we reported or received, to tell outside edits from our own.
    var lastReported = ""
    /// Hashes of recent texts we reported, not yet all written to the note.
    private var reported: [Int] = []

    private func remember(_ s: String) {
        reported.append(s.hashValue)
        if reported.count > 64 { reported.removeFirst(reported.count - 64) }
    }

    /// Redraws just the lines an AI changed while their tint swells and fades.
    private func observeChangeHighlight() {
        core.layoutDelegate.tint.redraw = { [weak self] ranges in
            MainActor.assumeIsolated {
                // An attributes-only edit of those lines: TextKit lays them out and draws them
                // again, the same way styling does (invalidating layout alone leaves the Mac's
                // on-screen fragments as they were). It isn't a text change, so nothing is saved.
                guard let self, let storage = self.textStorage else { return }
                let length = storage.length
                storage.beginEditing()
                for r in ranges where NSMaxRange(r) <= length { storage.edited(.editedAttributes, range: r, changeInLength: 0) }
                storage.endEditing()
                // Tables and cards sit over their lines: put them back where the lines now are.
                self.settleOverlays(after: ranges.map(NSMaxRange).max() ?? 0)
            }
        }
    }

    /// An AI's edit just landed: tint the lines it changed compared with `previous`.
    func tintChanges(from previous: String, untilCleared: Bool) {
        core.layoutDelegate.tint.play(from: previous, to: currentText, untilCleared: untilCleared)
    }

    var isTinted: Bool { core.layoutDelegate.tint.isLit }

    func clearTint() { core.layoutDelegate.tint.stop() }

    /// Lays the text out from the top to past `offset`, then places tables and cards again.
    private func settleOverlays(after offset: Int) {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return }
        let length = tcm.offset(from: tcm.documentRange.location, to: tcm.documentRange.endLocation)
        guard let end = tcm.location(tcm.documentRange.location, offsetBy: min(length, offset + 2000)),
              let range = NSTextRange(location: tcm.documentRange.location, end: end) else { return }
        tlm.ensureLayout(for: range)
        layoutCards()
    }

    // MARK: Undo in a shared note: only your own edits (OwnUndo)

    private var applyingOwnUndo = false

    /// Your edit, for undo, unless it's an undo itself.
    private func recordOwnEdit() {
        guard let own = controller?.ownUndo, !applyingOwnUndo, let e = TextDiff.edit(from: lastReported, to: string) else { return }
        own.record(e, in: lastReported)
    }

    /// Edit › Undo reaches the text view first: in a shared note it undoes your own last step.
    @objc func undo(_ sender: Any?) {
        guard controller?.ownUndo != nil else { undoManager?.undo(); return }
        ownUndoStep(redo: false)
    }

    @objc func redo(_ sender: Any?) {
        guard controller?.ownUndo != nil else { undoManager?.redo(); return }
        ownUndoStep(redo: true)
    }

    /// Undo or Redo of your own last step, through the text system so it's saved and sent like typing.
    func ownUndoStep(redo: Bool) {
        guard let own = controller?.ownUndo, let e = redo ? own.redo(in: string) : own.undo(in: string),
              shouldChangeText(in: e.range, replacementString: e.replacement) else { return }
        applyingOwnUndo = true
        defer { applyingOwnUndo = false }
        textStorage?.replaceCharacters(in: e.range, with: e.replacement)
        didChangeText()
        setSelectedRange(NSRange(location: e.range.location + (e.replacement as NSString).length, length: 0))
    }

    override func validateUserInterfaceItem(_ item: NSValidatedUserInterfaceItem) -> Bool {
        if let own = controller?.ownUndo {
            if item.action == #selector(undo(_:)) { return own.canUndo && isEditable }
            if item.action == #selector(redo(_:)) { return own.canRedo && isEditable }
        } else if item.action == #selector(undo(_:)) || item.action == #selector(redo(_:)) {
            return (item.action == #selector(undo(_:)) ? undoManager?.canUndo : undoManager?.canRedo) ?? false
        }
        return super.validateUserInterfaceItem(item)
    }

    // MARK: Other people's carets

    private var remoteCarets: [RemoteCaret] = []
    private(set) var caretViews: [UUID: (bar: NSView, flag: NSTextField)] = [:]
    /// Their selections, in view coordinates, with the solid tint each is drawn in (behind the text).
    private(set) var remoteSelections: [(rects: [CGRect], color: NSColor)] = []

    /// `amount` of `color` over `ground`, as one opaque colour.
    static func mix(_ color: NSColor, into ground: NSColor, amount: CGFloat) -> NSColor {
        let a = color.usingColorSpace(.sRGB) ?? color, b = ground.usingColorSpace(.sRGB) ?? ground
        return NSColor(srgbRed: b.redComponent + (a.redComponent - b.redComponent) * amount,
                       green: b.greenComponent + (a.greenComponent - b.greenComponent) * amount,
                       blue: b.blueComponent + (a.blueComponent - b.blueComponent) * amount, alpha: 1)
    }

    func showRemoteCarets(_ carets: [RemoteCaret]) {
        guard carets != remoteCarets else { return }
        remoteCarets = carets
        layoutRemoteCarets()
    }

    /// Where a remote caret is drawn: a bar exactly the line's height at the character's left edge.
    func remoteCaretRect(at offset: Int) -> CGRect? {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return nil }
        let length = (string as NSString).length
        guard let loc = tcm.location(tcm.documentRange.location, offsetBy: min(max(offset, 0), length)) else { return nil }
        var caret: CGRect?
        tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .standard, options: []) { _, r, _, _ in caret = r; return false }
        return caret?.offsetBy(dx: textContainerOrigin.x, dy: textContainerOrigin.y)
    }

    /// The rectangles a range covers, line by line, in view coordinates.
    func remoteRangeRects(_ range: NSRange) -> [CGRect] {
        guard range.length > 0, let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return [] }
        let length = (string as NSString).length
        guard let a = tcm.location(tcm.documentRange.location, offsetBy: min(range.location, length)),
              let b = tcm.location(tcm.documentRange.location, offsetBy: min(NSMaxRange(range), length)),
              let r = NSTextRange(location: a, end: b) else { return [] }
        var rects: [CGRect] = []
        tlm.enumerateTextSegments(in: r, type: .selection, options: []) { _, rect, _, _ in
            if rect.width > 0 { rects.append(rect.offsetBy(dx: self.textContainerOrigin.x, dy: self.textContainerOrigin.y)) }
            return true
        }
        return rects
    }

    /// As on iPhone: a bar in the person's colour where their caret is, exactly the line's height,
    /// and a solid tint behind what they've selected. Their first name sits on a small flag just
    /// above the caret; it shows while they type or just after their caret moves, then fades.
    /// Clicks go through them to the text.
    func layoutRemoteCarets() {
        let live = Set(remoteCarets.map(\.id))
        for (id, v) in caretViews where !live.contains(id) {
            v.bar.removeFromSuperview(); v.flag.removeFromSuperview()
            caretViews[id] = nil
        }
        let ns = string as NSString
        let page: NSColor = Palette.page
        var selections: [(rects: [CGRect], color: NSColor)] = []
        for c in remoteCarets {
            let color = NSColor(c.color)
            let v = caretViews[c.id] ?? {
                let bar = PassThroughView()
                bar.wantsLayer = true
                bar.layer?.cornerRadius = 1
                let flag = PassThroughLabel(labelWithString: "")
                flag.font = .systemFont(ofSize: RemoteCaret.flagFontSize, weight: .semibold)
                flag.textColor = .white
                flag.wantsLayer = true
                flag.drawsBackground = true
                flag.isBordered = false
                flag.alignment = .center
                flag.layer?.cornerRadius = RemoteCaret.flagRadius
                flag.layer?.masksToBounds = true
                addSubview(bar); addSubview(flag)
                let made = (bar as NSView, flag as NSTextField)
                caretViews[c.id] = made
                return made
            }()
            v.bar.layer?.backgroundColor = color.cgColor
            v.flag.backgroundColor = color
            v.flag.stringValue = c.name
            let loc = min(c.range.location, ns.length)
            guard let rect = remoteCaretRect(at: loc) else { continue }
            let size = NSSize(width: v.flag.intrinsicContentSize.width + 8, height: RemoteCaret.flagHeight)
            // The caret jumps with its character, in the same pass as the text: it never glides.
            NSAnimationContext.runAnimationGroup { ctx in
                ctx.duration = 0
                ctx.allowsImplicitAnimation = false
                v.bar.frame = CGRect(x: rect.minX - 1, y: rect.minY, width: 2, height: rect.height)
                // Above the caret, its bottom-left corner on the caret's top, as Notes and Figma do: it
                // labels the line the caret is on.
                v.flag.frame = CGRect(x: min(rect.minX - 1, bounds.width - size.width - 4), y: max(rect.minY - size.height, 0),
                                      width: size.width, height: size.height)
            }
            // Only the flag fades, a moment after they stop.
            // Also while the pointer is over their caret.
            let alpha: CGFloat = c.showsName || hoveredCaret == c.id ? 1 : 0
            if v.flag.alphaValue != alpha {
                NSAnimationContext.runAnimationGroup { $0.duration = alpha == 1 ? RemoteCaret.flagIn : RemoteCaret.flagOut; v.flag.animator().alphaValue = alpha }
            }
            let rects = remoteRangeRects(NSRange(location: loc, length: max(0, min(NSMaxRange(c.range), ns.length) - loc)))
            if !rects.isEmpty {
                var tint = color
                effectiveAppearance.performAsCurrentDrawingAppearance { tint = Self.mix(color, into: page, amount: 0.2) }
                selections.append((rects, tint))
            }
        }
        let changed = selections.map(\.rects) != remoteSelections.map(\.rects)
        remoteSelections = selections
        if changed { needsDisplay = true }
    }

    /// The caret the pointer is over: its name shows while it's there. The pointer is followed by
    /// the folds' tracking area (HeadingFolds: mouseMoved, mouseExited).
    private(set) var hoveredCaret: UUID?

    /// Shows the name of the caret under `point` (a few points either side of the bar count).
    func hoverCaret(at point: CGPoint?) {
        let over = point.flatMap { p in caretViews.first { $0.value.bar.frame.insetBy(dx: -4, dy: 0).contains(p) }?.key }
        guard over != hoveredCaret else { return }
        hoveredCaret = over
        layoutRemoteCarets()
    }

    /// Other people's selections, solid, behind the text (your own selection draws over them).
    override func drawBackground(in rect: NSRect) {
        super.drawBackground(in: rect)
        for s in remoteSelections {
            s.color.setFill()
            for r in s.rects where r.intersects(rect) { r.fill() }
        }
    }

    func syncExternal(_ new: String) {
        guard new != lastReported else { return }
        // The note still holds text we typed a moment ago (it's saved once typing
        // pauses): that's not a change from elsewhere.
        if reported.contains(new.hashValue) { return }
        syncDocument(new)
    }

    func syncDocument(_ new: String) {
        guard new != lastReported else { return }
        // Mid-composition (a dead key, an input method) the text can't change under it:
        // the change is taken in when the composition ends (textDidChange).
        if hasMarkedText() { arrivedWhileComposing = new; return }
        reported.removeAll()
        lastReported = new
        // Until what you type next is saved, the note still holds this: not a change again.
        remember(new)
        replaceText(with: new)
    }

    func takeRestored(_ new: String) {
        // Restoring is a choice: it wins over a composition, and over the text you typed before.
        // (The scroll view keeps the scroll inside a shorter text by itself.)
        arrivedWhileComposing = nil
        if hasMarkedText() { unmarkText() }
        reported.removeAll()
        lastReported = new
        remember(new)
        replaceText(with: new)
        undoManager?.removeAllActions()
        clearTint()
    }

    /// A change from elsewhere that arrived while you were composing.
    private var arrivedWhileComposing: String?

    /// The composition ended: put the change that arrived meanwhile under what you typed,
    /// or, if you both changed the same lines, keep yours (the other is in version history).
    private func takeWhatArrivedWhileComposing() {
        guard let arrived = arrivedWhileComposing else { return }
        arrivedWhileComposing = nil
        if let merged = TextDiff.merge(base: lastReported, mine: string, theirs: arrived) { replaceText(with: merged) }
    }

    private func replaceText(with new: String) {
        guard new != string, !hasMarkedText(), let storage = textStorage,
              let edit = TextDiff.edit(from: string, to: new) else { return }
        core.layoutDelegate.tint.stop()
        // Only what changed is replaced, so your caret, selection and scroll stay put.
        let keep = selectedRange()
        storage.replaceCharacters(in: edit.range, with: edit.replacement)
        // Undo steps recorded against the old text would land in the wrong place now. In a shared
        // note your own steps move with the change instead (OwnUndo).
        if let own = controller?.ownUndo {
            if let clash = own.clash(with: edit) { controller?.clash = clash }
            own.transform(through: edit)
            controller?.clashStillStands(in: string)
        } else { undoManager?.removeAllActions() }
        setSelectedRange(TextDiff.map(keep, through: edit))
        core.restyle(storage, selection: editingSelection, force: true)
        // Tables and cards below the change moved: lay the text out down to them before placing them,
        // or they're placed by estimate (a new table row pushed the grid over its heading).
        settleOverlays(after: NSMaxRange(edit.range) + (edit.replacement as NSString).length)
        layoutRemoteCarets()
    }

    func textViewDidChangeSelection(_ notification: Notification) {
        guard !hasMarkedText(), let storage = textStorage else { return }
        revealFolds()
        if core.disarm(unless: selectedRange()) { layoutCards() }
        // VoiceOver moves the caret as it reads aloud. Moved again from here, it takes that for
        // you and stops, at the first checklist item (trace on the Air, 6 November 2026). What
        // you type still lands in the right place (insertText).
        if window?.firstResponder === self, inKeyDown || !ScreenReader.isOn,
           let fix = core.caretFix(string, selectedRange(), byKeyboard: inKeyDown) {
            resolve(fix)
            return
        }
        core.restyle(storage, selection: editingSelection, force: false)
        // On an empty line, the caret is the height of what you'll type there: the title's on the
        // title's line (Emil, 30 October 2026: a new note's caret was small, then big).
        if selectedRange().length == 0, core.emptyLineFont(string, at: selectedRange().location) != nil {
            typingAttributes = core.typingAttributes(string, at: selectedRange().location)
        }
        controller?.typingChanged(text: string, selection: editingSelection)
        layoutWikiSuggestions()
    }

    // MARK: Wiki link suggestions

    private var wikiHost: NSHostingView<WikiSuggestionList>?

    /// Shows the titles for the `[[link` being typed just under it, or takes them away.
    func layoutWikiSuggestions() {
        // The `/` menu, and its hint on an empty line, follow the same edits and caret moves.
        layoutSlashCommands()
        layoutSlashHint()
        guard let controller, let q = controller.wikiQuery, !controller.wikiSuggestions.isEmpty else {
            wikiHost?.removeFromSuperview()
            wikiHost = nil
            return
        }
        let host = wikiHost ?? {
            let h = NSHostingView(rootView: WikiSuggestionList(controller: controller))
            h.sizingOptions = []
            addSubview(h)
            wikiHost = h
            return h
        }()
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: max(q.location - 2, 0)) else { return }
        var caret: CGRect?
        tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .standard, options: []) { _, r, _, _ in caret = r; return false }
        // Under the line the link is on (its paragraph may wrap onto several).
        guard let caret, let frag = tlm.textLayoutFragment(for: loc) else { return }
        let inFrag = tcm.offset(from: frag.rangeInElement.location, to: loc)
        let lines = frag.textLineFragments
        let line = lines.first { NSLocationInRange(inFrag, $0.characterRange) } ?? lines.last
        let bottom = frag.layoutFragmentFrame.minY + (line?.typographicBounds.maxY ?? frag.layoutFragmentFrame.height) + textContainerOrigin.y
        let size = WikiSuggestionList.size(rows: controller.wikiSuggestions.count)
        let x = min(max(caret.minX + textContainerOrigin.x - 8, 0), max(bounds.width - size.width, 0))
        host.frame = CGRect(origin: CGPoint(x: x, y: bottom + 8), size: size)
    }

    // MARK: The / menu

    /// When a table cell's typing last went in (`applyCellEdit`).
    private var cellEditAt: Date?
    private weak var cellEditField: AnyObject?
    static let cellEditJoin: TimeInterval = 1.5

    private var slashHost: NSHostingView<SlashCommandList>?
    private var slashHint: NSTextField?

    /// "Type / for formatting", faint, on the empty line the caret is on (not the title's), as
    /// Notion says it on an empty block: the / menu was there to be found, unseen (council round 13).
    /// It stops once the menu has been used a few times (round 14).
    static let slashHintText = "Type / for formatting"
    /// An empty note says where its title goes (round 14).
    static let titleHintText = "Title"

    /// What the faint hint at the caret says, if anything: "Title" in an empty note, the / hint
    /// on an empty body line.
    func caretHint() -> String? {
        // Only while the caret is really there: with the app behind another, no caret, no hint.
        guard window?.firstResponder === self, !windowLostFocus, controller?.isEditing ?? false, isEditable, selectedRange().length == 0,
              controller?.slashCommands.isEmpty ?? true else { return nil }
        if string.isEmpty { return Self.titleHintText }
        // Only on the note's last line, where you go on writing: on every blank line it jumped
        // around as the arrow keys passed through them (Emil, 6 November 2026).
        guard Self.onLastLine(string, at: selectedRange().location), SlashRecents.uses < SlashRecents.learned,
              let font = core.emptyLineFont(string, at: selectedRange().location), font != MarkdownStyler.titleFont,
              !Self.followsTable(string, at: selectedRange().location) else { return nil }
        return Self.slashHintText
    }

    func showsSlashHint() -> Bool { caretHint() == Self.slashHintText }

    /// The caret is on the text's last line, and nothing comes after it.
    static func onLastLine(_ text: String, at location: Int) -> Bool { location >= (text as NSString).length }

    /// The line just above `location` is a table's: a hint there sat against the table's edge
    /// (persona council r7d).
    static func followsTable(_ text: String, at location: Int) -> Bool {
        let ns = text as NSString
        let start = ns.lineRange(for: NSRange(location: min(location, ns.length), length: 0)).location
        guard start > 0 else { return false }
        return ns.substring(with: ns.lineRange(for: NSRange(location: start - 1, length: 0))).trimmingCharacters(in: .whitespacesAndNewlines).hasPrefix("|")
    }
    private var slashHintRecheck = false

    func layoutSlashHint() {
        placeSlashHint()
        // The styler restyles the line just typed after the caret moves (its spacing changes), so
        // the caret's empty line shifts down a few points once this call has run: the hint sat
        // 4 pt into the text above (council, 11-05). Place it again once the edit has finished.
        guard !slashHintRecheck else { return }
        slashHintRecheck = true
        DispatchQueue.main.async { [weak self] in
            self?.slashHintRecheck = false
            self?.placeSlashHint()
        }
    }

    private func placeSlashHint() {
        guard let hint = caretHint(), let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: selectedRange().location) else {
            slashHint?.removeFromSuperview()
            slashHint = nil
            return
        }
        // Lines that just changed (Return ending a list restyles the item above) can still be laid
        // out where they were: the caret's line then overlaps the one above, and the hint sat on
        // "Shoes" (council round 16). Its own line and the one before, laid out first.
        let ns = string as NSString
        let at = selectedRange().location
        let from = ns.lineRange(for: NSRange(location: max(0, min(at, ns.length) - 1), length: 0)).location
        if let start = tcm.location(tcm.documentRange.location, offsetBy: max(0, ns.lineRange(for: NSRange(location: max(0, from - 1), length: 0)).location)),
           let range = NSTextRange(location: start, end: loc) {
            tlm.ensureLayout(for: range)
        }
        var caret: CGRect?
        tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .selection, options: [.rangeNotRequired]) { _, r, _, _ in caret = r; return false }
        guard let caret else { return }
        let label = slashHint ?? {
            let f = NSTextField(labelWithString: hint)
            // Muted, not tertiary: it's the one clue to the / menu, so it has to be read (4.5:1).
            f.textColor = PColor.paneSecondary
            f.isSelectable = false
            f.setAccessibilityElement(false)
            f.identifier = NSUserInterfaceItemIdentifier("editor.slashHint")
            addSubview(f)
            slashHint = f
            return f
        }()
        label.stringValue = hint
        label.font = hint == Self.titleHintText ? MarkdownStyler.titleFont : core.styler.bodyFont
        label.sizeToFit()
        let h = label.frame.height
        label.frame.origin = CGPoint(x: caret.minX + textContainerOrigin.x + 1,
                                     y: caret.midY + textContainerOrigin.y - h / 2)
        // A picture's or file's card can reach over the line after it: half a hint under a PDF
        // chip reads as a bug (council round 16). Tables' views have add bars that overlap by design.
        label.isHidden = Self.hintCovered(label.frame, by: cardHosts.values.filter { !($0 is GridHostingView) }.map(\.frame))
    }

    /// Whether a card lies over the hint.
    static func hintCovered(_ hint: CGRect, by cards: [CGRect]) -> Bool { cards.contains { $0.intersects(hint) } }

    /// Shows the commands for the `/query` being typed under its line (over it when there's no
    /// room below in the visible part of the note), or takes them away.
    func layoutSlashCommands() {
        guard let controller, let q = controller.slashQuery, !controller.slashCommands.isEmpty else {
            slashHost?.removeFromSuperview()
            slashHost = nil
            return
        }
        let host = slashHost ?? {
            let h = NSHostingView(rootView: SlashCommandList(controller: controller))
            h.sizingOptions = []
            addSubview(h)
            slashHost = h
            return h
        }()
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let loc = tcm.location(tcm.documentRange.location, offsetBy: q.location) else { return }
        // A slash on a new last line isn't laid out yet while the text changes: the list went
        // under the line above and covered the slash.
        tlm.ensureLayout(for: NSTextRange(location: loc))
        var caret: CGRect?
        tlm.enumerateTextSegments(in: NSTextRange(location: loc), type: .standard, options: []) { _, r, _, _ in caret = r; return false }
        guard let caret, let frag = tlm.textLayoutFragment(for: loc) else { return }
        let inFrag = tcm.offset(from: frag.rangeInElement.location, to: loc)
        let lines = frag.textLineFragments
        let line = lines.first { NSLocationInRange(inFrag, $0.characterRange) } ?? lines.last
        let top = frag.layoutFragmentFrame.minY + (line?.typographicBounds.minY ?? 0) + textContainerOrigin.y
        let bottom = frag.layoutFragmentFrame.minY + (line?.typographicBounds.maxY ?? frag.layoutFragmentFrame.height) + textContainerOrigin.y
        let size = SlashCommandList.size(rows: controller.slashCommands.count, recent: controller.slashRecentCount)
        let x = min(max(caret.minX + textContainerOrigin.x - 8, 0), max(bounds.width - size.width, 0))
        let visible = visibleRect
        // Under the line when it fits; else over it when that fits; else the side with more room.
        let roomBelow = visible.maxY - bottom - 4, roomAbove = top - 4 - visible.minY
        let below = size.height <= roomBelow || (size.height > roomAbove && roomBelow >= roomAbove)
        host.frame = CGRect(origin: CGPoint(x: x, y: below ? bottom + 4 : top - 4 - size.height), size: size)
        // Lines above can still move once the edit's styling is laid out (a checklist line grew
        // and the list sat over the slash): placed again once that has happened.
        if !slashRelayoutQueued {
            slashRelayoutQueued = true
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.layoutSlashCommands()
                self.slashRelayoutQueued = false
            }
        }
    }

    private var slashRelayoutQueued = false

    private var editingSelection: NSRange? { window?.firstResponder === self ? selectedRange() : nil }

    func setWiki(_ wiki: WikiScope?) { if let storage = textStorage { core.setWiki(wiki, storage: storage, selection: editingSelection) } }
    func setImages(_ tick: Int) { if let storage = textStorage { core.setImages(tick, storage: storage, selection: editingSelection) } }

    override func becomeFirstResponder() -> Bool {
        let ok = super.becomeFirstResponder()
        if ok, let storage = textStorage {
            controller?.isEditing = true
            // The keyboard is back in the text: no table is waiting for it any more.
            core.gridFocus = nil
            controller?.leftTable()
            core.restyle(storage, selection: selectedRange(), force: true)
            // The window counts the text as first responder only once this returns: the hints
            // ("Title" on a new note) are laid out then (council round 15: ⌘N showed none).
            DispatchQueue.main.async { [weak self] in self?.layoutWikiSuggestions() }
        }
        return ok
    }

    override func resignFirstResponder() -> Bool {
        let ok = super.resignFirstResponder()
        if ok, let storage = textStorage {
            controller?.isEditing = false
            core.restyle(storage, selection: nil, force: true)
            controller?.typingChanged(text: string, selection: nil)
            layoutWikiSuggestions()
        }
        return ok
    }

    // MARK: Blocks

    /// True while a key press is being handled, so caret moves know they came from the keyboard.
    private var inKeyDown = false

    /// "[ ]" and a space makes a checklist item (`ListEditing.spaceKey`).
    override func insertText(_ string: Any, replacementRange asked: NSRange) {
        var replacementRange = asked
        if ScreenReader.isOn, asked.location == NSNotFound || asked == selectedRange(),
           let fix = core.caretFix(self.string, selectedRange(), byKeyboard: false) {
            resolve(fix)
            replacementRange = NSRange(location: NSNotFound, length: 0)
        }
        if (string as? String) == " ", replacementRange.location == NSNotFound || replacementRange == selectedRange(), !hasMarkedText(), controller?.readOnly != true,
           let edit = ListEditing.spaceKey(in: self.string, selection: selectedRange) {
            apply(edit)
            return
        }
        super.insertText(string, replacementRange: replacementRange)
    }

    override func keyDown(with event: NSEvent) {
        // Recently Deleted: typing asks to recover the note first, like Notes. Moving around and
        // the ⌘ shortcuts (Copy, Select All) still work.
        if controller?.readOnly == true, Self.edits(event) {
            controller?.askToRecover()
            return
        }
        inKeyDown = true
        defer { inKeyDown = false }
        super.keyDown(with: event)
    }

    /// Whether a key press would change the text: anything but a ⌘ or ⌃ shortcut, a move or Escape.
    static func edits(_ event: NSEvent) -> Bool {
        if !event.modifierFlags.intersection([.command, .control]).isEmpty || event.keyCode == 53 { return false }
        let moves: [NSEvent.SpecialKey] = [.upArrow, .downArrow, .leftArrow, .rightArrow, .pageUp, .pageDown, .home, .end]
        if let key = event.specialKey, moves.contains(key) { return false }
        return !(event.characters ?? "").isEmpty
    }

    private func resolve(_ fix: CaretFix) {
        switch fix {
        case .move(let at):
            setSelectedRange(NSRange(location: at, length: 0))
        case .newLineAfter(let at), .newLineBefore(let at):
            let after = { if case .newLineAfter = fix { true } else { false } }()
            // Not while AppKit is still delivering this selection change, and only on the text it
            // was worked out for: an Undo in between left `at` past the end and crashed (persona r7).
            let before = string
            DispatchQueue.main.async { [weak self] in
                guard let self, self.string == before else { return }
                self.apply(TextEdit(range: NSRange(location: at, length: 0), replacement: "\n", caret: after ? at + 1 : at))
            }
        case .enterGrid(let grid, let cell):
            core.gridFocus = GridFocusRequest(grid: grid, cell: cell)
            layoutCards()
        }
    }

    /// The keyboard leaves a table: the caret goes to the line above or below it.
    func leaveGrid(_ index: Int, below: Bool) {
        core.gridFocus = nil
        guard let g = GridTable.find(in: string).first(where: { $0.index == index }) else { return }
        window?.makeFirstResponder(self)
        let len = (string as NSString).length
        if below {
            if NSMaxRange(g.range) < len { setSelectedRange(NSRange(location: NSMaxRange(g.range) + 1, length: 0)) }
            else { apply(TextEdit(range: NSRange(location: len, length: 0), replacement: "\n", caret: len + 1)) }
        } else {
            if g.range.location > 0 { setSelectedRange(NSRange(location: g.range.location - 1, length: 0)) }
            else { apply(TextEdit(range: NSRange(location: 0, length: 0), replacement: "\n", caret: 0)) }
        }
    }

    // MARK: Table menus

    func deleteGrid(_ index: Int) {
        guard let g = GridTable.find(in: string).first(where: { $0.index == index }) else { return }
        core.gridFocus = nil
        let edit = EditorCore.removal(of: g.range, in: string)
        setSelectedRange(NSRange(location: EditorCore.caretOutside(g.range, in: string), length: 0))
        window?.makeFirstResponder(self)
        // One step of Undo, whatever was typed just before.
        breakUndoCoalescing()
        dropGrids(from: index)
        apply(edit)
        breakUndoCoalescing()
        layoutCards()
    }

    /// Tables' views are kept by position: with one deleted, the next table took over its view,
    /// cell with the keyboard and all (Emil's table walkthrough, 1 November 2026). The views from
    /// `index` on are made anew.
    private func dropGrids(from index: Int) {
        for (k, host) in cardHosts {
            guard k.hasPrefix("g"), let i = Int(k.dropFirst()), i >= index else { continue }
            host.removeFromSuperview()
            cardHosts[k] = nil
            cardContent[k] = nil
            core.gridBoxes[i] = nil
        }
    }

    func undoLastEdit() {
        window?.makeFirstResponder(self)
        undoManager?.undo()
    }

    func focusGrid(_ index: Int, cell: GridCell) {
        core.gridFocus = GridFocusRequest(grid: index, cell: cell)
        layoutCards()
    }

    private static func copyToClipboard(_ text: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
    }

    /// A table cell's right-click menu: add or delete its row or column, or the table.
    func tableCellMenu(host: GridHostingView, cell: GridCell) -> NSMenu? {
        guard let controller, !controller.readOnly,
              let key = cardHosts.first(where: { $0.value === host })?.key, key.hasPrefix("g"), let grid = Int(key.dropFirst()) else { return nil }
        let table = controller.tableMenu(grid: grid, cell: cell, line: nil)
        let menu = NSMenu()
        menu.autoenablesItems = false
        // Table items only: AppKit otherwise adds AutoFill, which has nothing to fill in a cell.
        menu.allowsContextMenuPlugIns = false
        if #available(macOS 15.0, *) { menu.automaticallyInsertsWritingToolsItems = false }
        // What any text's menu starts with (round 21: only the table's own commands). A cell being
        // typed in has the text's own menu; this one is for the whole cell.
        let held = controller.cellText(grid: grid, cell: cell) ?? ""
        let clipboard: [(String, String, Bool, () -> Void)] = [
            ("Cut", "scissors", !held.isEmpty, { [weak controller] in
                Self.copyToClipboard(held)
                controller?.setCell("", grid: grid, cell: cell)
            }),
            ("Copy", "doc.on.doc", !held.isEmpty, { Self.copyToClipboard(held) }),
            ("Paste", "doc.on.clipboard", NSPasteboard.general.string(forType: .string) != nil, { [weak controller] in
                if let s = NSPasteboard.general.string(forType: .string) { controller?.setCell(s, grid: grid, cell: cell) }
            }),
        ]
        for (title, symbol, enabled, run) in clipboard {
            let item = NSMenuItem(title: title, action: #selector(TableMenuAction.fire), keyEquivalent: "")
            let action = TableMenuAction(run)
            item.target = action
            item.representedObject = action
            item.isEnabled = enabled
            item.image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)
            item.setAccessibilityIdentifier("table.menu.\(title)")
            menu.addItem(item)
        }
        menu.addItem(.separator())
        for (i, section) in table.sections.enumerated() {
            if i > 0 { menu.addItem(.separator()) }
            for entry in section {
                let item = NSMenuItem(title: entry.title, action: #selector(TableMenuAction.fire), keyEquivalent: "")
                let action = TableMenuAction(entry.run)
                item.target = action
                item.representedObject = action
                item.isEnabled = entry.enabled
                item.image = NSImage(systemSymbolName: entry.systemImage, accessibilityDescription: nil)
                item.setAccessibilityIdentifier("table.menu.\(entry.title)")
                menu.addItem(item)
            }
        }
        return menu
    }

    /// "Share as Picture…" for text that's selected.
    func sharePictureMenuItem() -> NSMenuItem? {
        guard selectedRange().length > 0, controller?.canSharePicture() == true else { return nil }
        let item = NSMenuItem(title: EditorController.sharePictureTitle, action: #selector(TableMenuAction.fire), keyEquivalent: "")
        let action = TableMenuAction { [weak self] in self?.controller?.sharePicture() }
        item.target = action
        item.representedObject = action
        item.image = NSImage(systemSymbolName: "photo", accessibilityDescription: nil)
        return item
    }

    /// Right-click on a line that is only a link: show it compact or as a card (Emil, 11-01).
    /// On a checklist with ticks (its circle or its text): Untick All in This List.
    override func menu(for event: NSEvent) -> NSMenu? {
        let menu = super.menu(for: event) ?? NSMenu()
        let point = convert(event.locationInWindow, from: nil)
        let index = characterIndexForInsertion(at: point)
        let ns = string as NSString
        guard index <= ns.length else { return menu }
        // On a circle, the circle's line: the click left of the text finds the line by its height.
        let inner = CGPoint(x: point.x - textContainerOrigin.x, y: point.y - textContainerOrigin.y)
        let listAt = core.tickTarget(at: inner, viewY: point.y, layout: textLayoutManager) ?? min(index, max(ns.length - 1, 0))
        if let item = untickMenuItem(at: listAt) {
            menu.insertItem(item, at: 0)
            menu.insertItem(.separator(), at: 1)
        }
        if let item = sharePictureMenuItem() {
            menu.insertItem(item, at: 0)
            menu.insertItem(.separator(), at: 1)
        }
        let line = ns.lineRange(for: NSRange(location: min(index, max(ns.length - 1, 0)), length: 0))
        var text = NSRange(location: line.location, length: line.length)
        while text.length > 0, [0x0A, 0x0D].contains(ns.character(at: NSMaxRange(text) - 1)) { text.length -= 1 }
        let choices = Self.linkStyles(for: ns.substring(with: text))
        guard !choices.isEmpty else { return menu }
        var at = 0
        for c in choices {
            let item = NSMenuItem(title: c.title, action: #selector(TableMenuAction.fire), keyEquivalent: "")
            let action = TableMenuAction { [weak self] in
                guard let self, NSMaxRange(text) <= (self.string as NSString).length else { return }
                self.apply(TextEdit(range: text, replacement: c.line, caret: -1))
            }
            item.target = action
            item.representedObject = action
            item.image = NSImage(systemSymbolName: Restyle.symbol(c.style), accessibilityDescription: nil)
            menu.insertItem(item, at: at)
            at += 1
        }
        menu.insertItem(.separator(), at: at)
        return menu
    }

    /// "Untick All in This List" for the checklist at `location`, when something in it is ticked
    /// and the note can be changed.
    func untickMenuItem(at location: Int) -> NSMenuItem? {
        guard controller?.readOnly != true, controller?.cell == nil, ListEditing.tickedCount(in: string, at: location) > 0 else { return nil }
        let item = NSMenuItem(title: EditorController.untickListTitle, action: #selector(TableMenuAction.fire), keyEquivalent: "")
        let action = TableMenuAction { [weak self] in self?.controller?.untickAll(at: location) }
        item.target = action
        item.representedObject = action
        item.image = NSImage(systemSymbolName: "checklist.unchecked", accessibilityDescription: nil)
        item.setAccessibilityIdentifier("editor.untickAll")
        return item
    }

    /// The other styles a link line can take, for the right-click menu: a written link offers
    /// compact and card (embeds have their own menus).
    nonisolated static func linkStyles(for line: String) -> [(title: String, style: LinkForms.Style, line: String)] {
        guard let parsed = LinkForms.parse(line), parsed.style == .link else { return [] }
        return LinkForms.choices(for: parsed).map { (LinkForms.title($0), $0, LinkForms.write(parsed, as: $0)) }
    }

    func showTableMenu(_ menu: TableMenu) {
        guard let host = cardHosts["g\(menu.grid)"] else { return }
        let r = menu.line.flatMap { core.gridBoxes[menu.grid]?.targets[$0] } ?? host.bounds
        let m = NSMenu()
        m.autoenablesItems = false
        for (i, section) in menu.sections.enumerated() {
            if i > 0 { m.addItem(.separator()) }
            for item in section {
                let mi = NSMenuItem(title: item.title, action: #selector(TableMenuAction.fire), keyEquivalent: "")
                let action = TableMenuAction(item.run)
                mi.target = action
                mi.representedObject = action
                mi.isEnabled = item.enabled
                m.addItem(mi)
            }
        }
        // Not inside the click that asked for it: the menu tracks the mouse until it closes.
        DispatchQueue.main.async {
            m.popUp(positioning: nil, at: NSPoint(x: r.minX, y: host.isFlipped ? r.maxY : host.bounds.height - r.maxY), in: host)
        }
    }

    // MARK: Checkbox clicks

    /// The table or card under a point of this view, if one is. Over one, the pointer is its
    /// to set: the text view also setting the I-beam on every move made the pointer flip
    /// between arrow and I-beam all the way across a table.
    func card(at p: CGPoint) -> String? {
        cardHosts.first { $0.value.frame.contains(p) }?.key
    }

    override func cursorUpdate(with event: NSEvent) {
        if card(at: convert(event.locationInWindow, from: nil)) != nil { return }
        super.cursorUpdate(with: event)
    }

    /// Over a checkbox the pointer is an arrow, not the text I-beam, like Notes.
    override func mouseMoved(with event: NSEvent) {
        let p = convert(event.locationInWindow, from: nil)
        // Over someone's caret, their name shows.
        if !caretViews.isEmpty || hoveredCaret != nil { hoverCaret(at: p) }
        if card(at: p) != nil { return }
        let point = CGPoint(x: p.x - textContainerOrigin.x, y: p.y - textContainerOrigin.y)
        // Over a heading its chevron shows; on the chevron the pointer is an arrow.
        if hoverFolds(at: point) {
            NSCursor.arrow.set()
            return
        }
        if core.tickTarget(at: point, viewY: p.y, layout: textLayoutManager) != nil {
            NSCursor.arrow.set()
            return
        }
        // A date chip is a button: a click picks another day. A callout's icon picks its type.
        if controller?.readOnly != true, dateChip(at: point) != nil || calloutIcon(at: point) != nil {
            NSCursor.pointingHand.set()
            return
        }
        super.mouseMoved(with: event)
    }

    override func mouseDown(with event: NSEvent) {
        let p = convert(event.locationInWindow, from: nil)
        let point = CGPoint(x: p.x - textContainerOrigin.x, y: p.y - textContainerOrigin.y)
        // A heading's chevron collapses or opens its section; the caret stays where it is.
        if event.clickCount == 1, let h = foldToggle(at: point) {
            toggleFold(h)
            return
        }
        // The row drawn under the pointer, even while rows slide; then they stop where they're going.
        let target = core.tickTarget(at: point, viewY: p.y, layout: textLayoutManager)
        core.endSlides()
        if controller?.readOnly == true {
            // Recently Deleted: a tick, or a click into the text, asks to recover the note first,
            // like Notes. A drag still selects, to copy; a link still opens.
            if target != nil { controller?.askToRecover(); return }
            super.mouseDown(with: event)
            if event.clickCount == 1, selectedRange().length == 0, !onLink(at: p) { controller?.askToRecover() }
            return
        }
        if let line = target, tick(line: line) { return }
        if event.clickCount == 1, let icon = calloutIcon(at: point) {
            showCalloutMenu(line: icon.line, rect: icon.rect.offsetBy(dx: textContainerOrigin.x, dy: textContainerOrigin.y))
            return
        }
        if event.clickCount == 1, let chip = dateChip(at: point) {
            showDatePicker(for: chip.range, rect: chip.rect.offsetBy(dx: textContainerOrigin.x, dy: textContainerOrigin.y))
            return
        }
        super.mouseDown(with: event)
    }

    /// Ticks or unticks the checklist item on the line starting at `line`, as a click on its circle
    /// does: one undo step, the caret where it was, the pop, and the sort a moment later. Also
    /// VoiceOver's press on the item's checkbox (ChecklistCheckbox). False if it isn't one.
    @discardableResult
    func tick(line: Int) -> Bool {
        guard controller?.readOnly != true, let edit = ListEditing.toggleCheckbox(in: string, lineStart: line) else { return false }
        // The circle's place before the edit: right after it, TextKit may not have placed the
        // line again yet, and the pop landed a row or two higher, over the heading.
        let circle = core.checkboxRect(line: line, layout: textLayoutManager)
        let others = CheckPop.otherLines(string, lineStart: line).compactMap { core.checkboxRect(line: $0, layout: textLayoutManager) }
        let keep = selectedRange()
        asOneStep { apply(edit) }
        setSelectedRange(keep)
        if edit.replacement == "x", let r = circle, let host = layer {
            let origin = textContainerOrigin
            let completes = CheckPop.completesList(string, lineStart: line)
            // In this view's light or dark, so the pop is the colour of the circle it lands on.
            effectiveAppearance.performAsCurrentDrawingAppearance {
                let rect = r.offsetBy(dx: origin.x, dy: origin.y)
                CheckPop.play(in: host, rect: rect, completes: completes)
                if completes {
                    CheckPop.wave(in: host, from: rect, circles: others.map { $0.offsetBy(dx: origin.x, dy: origin.y) })
                }
            }
        }
        if controller?.sortsTickedItems != false { core.sortSoon(after: line, text: { [weak self] in self?.string ?? "" }) { [weak self] in self?.sortChecklist(around: $0) } }
        NSAccessibility.post(element: self, notification: .valueChanged)
        let ns = string as NSString
        let said = ns.substring(with: ns.lineRange(for: NSRange(location: line, length: 0)))
        if let list = ListPrefix(line: said) {
            let words = (said as NSString).substring(from: min(list.length, (said as NSString).length)).trimmingCharacters(in: .whitespacesAndNewlines)
            controller?.announceTick((edit.replacement == "x" ? "Checked, " : "Unchecked, ") + words)
        }
        return true
    }

    // MARK: Checklists for VoiceOver

    /// The text's own children, then a checkbox for each checklist item drawn as one, as Notes
    /// gives them (council rounds 2 and 3, 11-04: the circles were drawn, the hidden "- [ ]" was
    /// all VoiceOver had). Each says its item, whether it's ticked, and ticks on a press.
    override func accessibilityChildren() -> [Any]? {
        // Tables are views laid over the text, which the text view doesn't list itself: without
        // them VoiceOver heard a table as empty lines (council round 15).
        let tables = cardHosts.filter { $0.key.hasPrefix("g") }.values.sorted { $0.frame.minY < $1.frame.minY }
        // The / and [[ lists are subviews too: VoiceOver couldn't reach their rows (round 22).
        let lists: [NSView] = [slashHost, wikiHost].compactMap { $0 }
        return (super.accessibilityChildren() ?? []) + checklistCheckboxes() + tables + lists
    }

    /// The checkboxes VoiceOver was last given, kept so the same item is the same element each
    /// time it asks: made anew on every call, a reader outside the app (VoiceOver, the round 15
    /// capture's dump) held elements that were already gone and read them as nothing.
    private var a11yBoxes: [String: ChecklistCheckbox] = [:]

    /// Checkboxes for the note's checklist items, in order (the first 300).
    func checklistCheckboxes() -> [ChecklistCheckbox] {
        let ns = string as NSString
        var found: [ChecklistCheckbox] = []
        var at = 0
        while at < ns.length, found.count < 300 {
            let range = ns.lineRange(for: NSRange(location: at, length: 0))
            let line = ns.substring(with: range)
            if let list = ListPrefix(line: line), let checked = list.checkbox,
               core.checkboxRect(line: range.location, layout: textLayoutManager) != nil {
                let item = (line as NSString).substring(from: min(list.length, (line as NSString).length))
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                let key = "\(range.location)|\(checked)|\(item)"
                found.append(a11yBoxes[key] ?? ChecklistCheckbox(view: self, line: range.location, label: item, checked: checked))
            }
            at = NSMaxRange(range)
        }
        a11yBoxes = Dictionary(found.map { ("\($0.line)|\($0.checked)|\($0.accessibilityLabel() ?? "")", $0) }, uniquingKeysWith: { a, _ in a })
        return found
    }

    /// Whether the line starting at `line` is drawn with a circle.
    func drawsCheckbox(line: Int) -> Bool { core.checkboxRect(line: line, layout: textLayoutManager) != nil }

    /// The circle of the checklist item on `line`, in screen coordinates.
    func checkboxScreenFrame(line: Int) -> CGRect {
        guard let r = core.checkboxRect(line: line, layout: textLayoutManager), let window else { return .zero }
        let inView = r.offsetBy(dx: textContainerOrigin.x, dy: textContainerOrigin.y)
        return window.convertToScreen(convert(inView, to: nil))
    }

    /// The date chip under a point of the text container: its rect there and its characters.
    func dateChip(at point: CGPoint) -> (rect: CGRect, range: NSRange)? {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager,
              let frag = tlm.textLayoutFragment(for: point) as? DecoratedLayoutFragment,
              let start = frag.textElement?.elementRange?.location else { return nil }
        let base = tcm.offset(from: tcm.documentRange.location, to: start)
        let f = frag.layoutFragmentFrame
        for c in frag.dateChips() {
            let rect = c.rect.offsetBy(dx: f.minX, dy: f.minY)
            if rect.insetBy(dx: -2, dy: -2).contains(point) {
                return (rect, NSRange(location: base + c.range.location, length: c.range.length))
            }
        }
        return nil
    }

    func calloutIcon(at point: CGPoint) -> (rect: CGRect, line: Int)? { core.calloutIcon(at: point, layout: textLayoutManager) }

    /// The callout's types, each with its icon in its colour; the current one ticked.
    func showCalloutMenu(line: Int, rect: CGRect) {
        let ns = string as NSString
        guard line < ns.length else { return }
        let current = Callouts.header(ns.substring(with: ns.lineRange(for: NSRange(location: line, length: 0))).trimmingCharacters(in: .newlines))?.kind
        let menu = NSMenu()
        for kind in Callouts.menuKinds {
            let item = CalloutMenuItem(title: kind.title, action: #selector(pickCalloutKind(_:)), keyEquivalent: "")
            item.target = self
            item.kind = kind
            item.line = line
            item.state = kind == current ? .on : .off
            let config = NSImage.SymbolConfiguration(pointSize: 13, weight: .semibold).applying(.init(paletteColors: [kind.tone.ink]))
            item.image = NSImage(systemSymbolName: kind.symbol, accessibilityDescription: nil)?.withSymbolConfiguration(config)
            menu.addItem(item)
        }
        menu.popUp(positioning: nil, at: CGPoint(x: rect.minX, y: rect.maxY + 4), in: self)
    }

    @objc private func pickCalloutKind(_ item: CalloutMenuItem) {
        guard let kind = item.kind else { return }
        controller?.setCalloutKind(kind, line: item.line)
    }

    private var datePopover: NSPopover?

    /// A calendar under the chip; picking a day changes the date and closes it.
    func showDatePicker(for range: NSRange, rect: CGRect) {
        guard let found = NoteDates.date(at: range.location, in: string), found.range == range,
              let day = NoteDates.date(found) else { return }
        datePopover?.close()
        let picker = DatePickerPopover(day: day) { [weak self] picked in
            guard let self else { return }
            self.controller?.changeDate(at: range, to: picked)
            self.datePopover?.close()
        }
        let pop = NSPopover()
        pop.behavior = .transient
        pop.contentViewController = picker
        pop.show(relativeTo: rect, of: self, preferredEdge: .maxY)
        datePopover = pop
    }

    /// Whether a point of this view is on a link's text.
    private func onLink(at p: CGPoint) -> Bool {
        let i = characterIndexForInsertion(at: p)
        guard let storage = textStorage, i < storage.length else { return false }
        return storage.attribute(.link, at: i, effectiveRange: nil) != nil
    }

    // MARK: A tick and the sinking after it: one step of Undo

    /// Untick All (EditorController): one step of Undo with its name in the Edit menu, the caret
    /// and the scroll where they were.
    func applyStep(_ edit: TextEdit, named name: String) {
        core.endSlides()
        let keep = selectedRange()
        asOneStep { apply(edit) }
        if NSMaxRange(keep) <= (string as NSString).length { setSelectedRange(keep) }
        undoManager?.setActionName(name)
    }


    func applyMove(_ edit: TextEdit, named name: String) {
        core.endSlides()
        asOneStep { apply(edit) }
        undoManager?.setActionName(name)
    }

    /// Makes `change` as one step of Undo that puts the whole text back as it was, so the sort that
    /// follows a tick (done `withoutUndo`) goes back with it, as in Notes. Steps below it stay.
    private func asOneStep(_ change: () -> Void) {
        let before = string, selection = selectedRange()
        // Typing after the tick is a step of its own, not more of the typing before it.
        breakUndoCoalescing()
        withoutUndo(change)
        registerStep(back: before, selection: selection)
    }

    /// Typing in a table cell, close together: one step of Undo back to the text before the first
    /// of it, as on the iPhone. ⌘Z took back one letter (persona council r7e, a real Mac window).
    func applyCellEdit(_ edit: TextEdit) {
        // A cell taking the keyboard commits what it already holds. That's no typing: counted as
        // some, the first real key joined it and left no step at all.
        guard (string as NSString).substring(with: edit.range) != edit.replacement else { return }
        let before = string, selection = selectedRange()
        let field = (window?.firstResponder as? NSTextView)?.delegate as AnyObject?
        let joins = field === cellEditField && (cellEditAt.map { Date.now.timeIntervalSince($0) < Self.cellEditJoin } ?? false)
        cellEditAt = .now
        cellEditField = field
        // The field has the key already: where its caret was before it, for Undo to go back to.
        let grew = (edit.replacement as NSString).length - edit.range.length
        let cell = CellField.selection(in: window).map { NSRange(location: max($0.location - grew, 0), length: 0) }
        withoutUndo { apply(edit) }
        if !joins {
            breakUndoCoalescing()
            registerStep(back: before, selection: selection, cell: cell)
        }
    }

    private func withoutUndo(_ change: () -> Void) {
        guard let undo = undoManager else { change(); return }
        undo.disableUndoRegistration()
        defer { undo.enableUndoRegistration() }
        change()
    }

    /// `cell`: a table cell's typing, and where the caret goes in its field.
    private func registerStep(back to: String, selection: NSRange, cell: NSRange? = nil) {
        guard to != string else { return }
        undoManager?.registerUndo(withTarget: self) { view in
            let now = view.string, kept = view.selectedRange()
            let keptCell = cell == nil ? nil : CellField.selection(in: view.window)
            let fieldWas = CellField.text(in: view.window)
            view.core.endSlides()
            view.breakUndoCoalescing()
            view.cellEditAt = nil // What's typed after an Undo is a new step.
            if let e = TextDiff.edit(from: now, to: to) {
                view.withoutUndo { view.apply(TextEdit(range: e.range, replacement: e.replacement, caret: -1)) }
            }
            if NSMaxRange(selection) <= (to as NSString).length { view.setSelectedRange(selection) }
            if let cell { CellField.select(cell, in: view.window, onceChangedFrom: fieldWas) }
            // Registered while undoing, this is the Redo.
            view.registerStep(back: now, selection: kept, cell: keptCell)
        }
    }

    /// Ticked items sink below the open ones, a moment after the tick, sliding into place.
    /// The caret stays with the text it was in, and nothing scrolls or takes focus.
    private func sortChecklist(around line: Int) {
        let sel = selectedRange()
        guard let edit = ListEditing.sortChecklist(in: string, around: min(line, (string as NSString).length), caret: sel.location) else { return }
        let old = ReorderSlide.lines(of: edit.range, in: string as NSString)
        let frames = ReorderSlide.bands(old.map(\.1.location), layout: textLayoutManager, origin: textContainerOrigin, width: bounds.width)
        let pictures = frames.compactMap { ReorderSlide.picture(of: $0, in: self) }
        // Part of the tick's step of Undo: one ⌘Z puts the item back unticked where it was.
        withoutUndo { apply(TextEdit(range: edit.range, replacement: edit.replacement, caret: -1)) }
        setSelectedRange(NSRange(location: edit.caret >= 0 ? edit.caret : sel.location, length: edit.caret >= 0 ? 0 : sel.length))
        guard pictures.count == old.count, let first = frames.first, let last = frames.last else { return }
        let moves = ReorderSlide.moves(old: old.map(\.0), new: edit.replacement.components(separatedBy: "\n"))
        let starts = ReorderSlide.lines(of: NSRange(location: edit.range.location, length: (edit.replacement as NSString).length), in: string as NSString).map(\.1.location)
        let tops = ReorderSlide.targets(heights: frames.map(\.height), moves: moves)
        core.slideStarted(ReorderSlide.play(in: self, rows: Array(zip(pictures, frames)).map { (image: $0, frame: $1) }, newTops: tops,
                                            lines: moves.map { starts[min($0, starts.count - 1)] }, cover: first.union(last), pageColor: .panePage))
    }
}

/// A caret's bar and name flag: drawn over the text, never in the way of a click.
private final class PassThroughView: NSView {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
}

private final class PassThroughLabel: NSTextField {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
    override class var cellClass: AnyClass? {
        get { CentredCell.self }
        set {}
    }
}

/// A name flag's text, centred top to bottom in the flag.
private final class CentredCell: NSTextFieldCell {
    override func drawingRect(forBounds rect: NSRect) -> NSRect {
        let r = super.drawingRect(forBounds: rect)
        let h = cellSize(forBounds: rect).height
        return NSRect(x: r.minX, y: rect.minY + (rect.height - h) / 2, width: r.width, height: h)
    }
}
#endif

#if os(macOS)
/// One checklist item as VoiceOver hears it: "Book flights, checkbox, ticked". A press ticks or
/// unticks it without moving the caret (PaneTextView.tick).
final class ChecklistCheckbox: NSAccessibilityElement {
    private weak var view: PaneTextView?
    let line: Int
    let checked: Bool

    init(view: PaneTextView, line: Int, label: String, checked: Bool) {
        self.view = view
        self.line = line
        self.checked = checked
        super.init()
        setAccessibilityRole(.checkBox)
        setAccessibilityLabel(label)
        setAccessibilityParent(view)
        setAccessibilityIdentifier("editor.checkbox")
    }

    override func accessibilityValue() -> Any? { NSNumber(value: checked ? 1 : 0) }
    override func accessibilityFrame() -> NSRect { view?.checkboxScreenFrame(line: line) ?? .zero }
    override func isAccessibilityEnabled() -> Bool { true }
    override func accessibilityPerformPress() -> Bool { view?.tick(line: line) ?? false }
}
#endif
