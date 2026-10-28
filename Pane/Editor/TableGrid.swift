import SwiftUI

/// A markdown table, edited as a grid of cells like Apple Notes.
/// The note keeps standard markdown; every change is written straight back.
/// A `<!-- pane-table: … -->` comment above the table gives columns a type.
struct GridTable: Equatable {
    var rows: [[String]]
    var range: NSRange
    var index: Int
    /// Column types from the comment; nil for a plain table.
    var types: [TypedTable.ColumnType]? = nil

    var columns: Int { rows.map(\.count).max() ?? 0 }

    func type(_ column: Int) -> TypedTable.ColumnType {
        guard let types, column < types.count else { return .text }
        return types[column]
    }

    /// All tables in the text (code blocks excluded), typed or plain.
    static func find(in text: String) -> [GridTable] {
        let ns = text as NSString
        var lines: [NSRange] = []
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byParagraphs, .substringNotRequired]) { _, r, _, _ in lines.append(r) }
        var out: [GridTable] = []
        var inCode = false
        var i = 0
        func isRow(_ k: Int) -> Bool { k < lines.count && ns.substring(with: lines[k]).trimmingCharacters(in: .whitespaces).hasPrefix("|") }
        func isDelimiter(_ k: Int) -> Bool {
            let t = ns.substring(with: lines[k]).trimmingCharacters(in: .whitespaces)
            return t.hasPrefix("|") && Self.isDelimiter(t)
        }
        while i < lines.count {
            let t = ns.substring(with: lines[i]).trimmingCharacters(in: .whitespaces)
            if t.hasPrefix("```") || t.hasPrefix("~~~") { inCode.toggle(); i += 1; continue }
            if inCode || !isRow(i) || !(i + 1 < lines.count && isDelimiter(i + 1)) { i += 1; continue }
            var j = i
            while isRow(j) { j += 1 }
            let body = (i..<j).map { ns.substring(with: lines[$0]) }
            let above = i > 0 ? ns.substring(with: lines[i - 1]).trimmingCharacters(in: .whitespaces) : ""
            let typed = above.hasPrefix("<!--") && above.hasSuffix("-->") && above.contains(TypedTable.marker)
            let start = typed ? lines[i - 1].location : lines[i].location
            let range = NSRange(location: start, length: NSMaxRange(lines[j - 1]) - start)
            var g = from(lines: body, range: range, index: out.count)
            if typed { g.types = TypedTable.parse(comment: above, table: body.map { $0.trimmingCharacters(in: .whitespaces) })?.columns.map(\.type) }
            if g.isLive { out.append(g) }
            i = j
        }
        return out
    }

    /// The most cells a table can have and still be shown as a live grid. Bigger tables
    /// (a pasted export, say) stay styled markdown: a grid of 100,000 cells overruns
    /// SwiftUI and takes the app down. NoteStructure applies the same rule, so both
    /// number tables the same way.
    static let maxLiveCells = 5000
    var isLive: Bool { rows.count * max(columns, 1) <= Self.maxLiveCells }

    /// The line under the header: only pipes, dashes, colons and spaces, with a dash.
    /// Long dashes count too: the keyboard's smart punctuation has turned a `---` into
    /// `—` in saved notes, and such a table must still open as a grid. It's written
    /// back as `---` (see `markdown`) the next time the table is edited.
    static func isDelimiter(_ line: String) -> Bool {
        line.contains { "-–—".contains($0) } && line.allSatisfy { "|-–—: \t".contains($0) }
    }

    /// `lines` are a table's own: the header, the delimiter, then the rows. Only the
    /// delimiter is left out, so a row of empty cells is still a row.
    static func from(lines: [String], range: NSRange, index: Int) -> GridTable {
        let body = lines.enumerated().filter { $0.offset != 1 || !isDelimiter($0.element) }.map(\.element)
        var rows = body.map { TypedTable.cells($0) }
        let width = max(rows.map(\.count).max() ?? 1, 1)
        rows = rows.map { $0 + Array(repeating: "", count: width - $0.count) }
        return GridTable(rows: rows.isEmpty ? [[""]] : rows, range: range, index: index)
    }

    var markdown: String {
        let width = max(columns, 1)
        func line(_ r: [String]) -> String {
            let cells = (r + Array(repeating: "", count: width - r.count)).map {
                $0.isEmpty ? " " : $0.replacingOccurrences(of: "|", with: "\\|").replacingOccurrences(of: "\n", with: " ")
            }
            return "| " + cells.joined(separator: " | ") + " |"
        }
        var out: [String] = []
        if (0..<width).contains(where: { type($0) != .text }) {
            let header = rows.first ?? []
            let specs = (0..<width).map { c in "\(c < header.count ? header[c] : "")=\(type(c).spec)" }
            out.append("<!-- \(TypedTable.marker) " + specs.joined(separator: "; ") + " -->")
        }
        out += [line(rows.first ?? []), "|" + Array(repeating: " --- ", count: width).joined(separator: "|") + "|"]
        out += rows.dropFirst().map(line)
        return out.joined(separator: "\n")
    }

    /// True when `other` is what this table reads back as from its own markdown.
    /// Markdown can't hold the space at the end of a cell, so the table that comes back
    /// from the note mid-typing can differ from the one on screen only by that.
    func reads(as other: GridTable) -> Bool {
        guard let back = GridTable.find(in: markdown).first else { return false }
        return back.rows == other.rows && back.types == other.types
    }

    /// A column of empty cells at `c`.
    mutating func insertColumn(at c: Int) {
        rows = rows.map { var r = $0; r.insert("", at: min(c, r.count)); return r }
        if var types { types.insert(.text, at: min(c, types.count)); self.types = types }
    }

    /// Removes column `c`; the last column stays.
    mutating func removeColumn(at c: Int) {
        guard columns > 1 else { return }
        rows = rows.map { var r = $0; if c < r.count { r.remove(at: c) }; return r }
        if var types, c < types.count { types.remove(at: c); self.types = types }
    }

    /// A new row, with today's date in the first date column.
    var blankRow: [String] {
        let width = max(columns, 1)
        let dateColumn = (0..<width).first { type($0) == .date }
        return (0..<width).map { $0 == dateColumn ? TypedTable.day(.now) : "" }
    }

    /// The typed view the chart reads.
    var typed: TypedTable {
        let width = max(columns, 1)
        let header = rows.first ?? []
        let cols = (0..<width).map { TypedTable.Column(name: $0 < header.count ? header[$0] : "", type: type($0)) }
        return TypedTable(columns: cols, rows: rows.dropFirst().map { $0 + Array(repeating: "", count: max(0, width - $0.count)) })
    }

    /// The cells' font: digits of one width, as the grid draws them. Measuring with the plain
    /// font came out narrower than the drawn text, and a tight table cut its dates ("2026-10-…").
    static var cellFont: PFont { PFont.monospacedDigitSystemFont(ofSize: EditorMetrics.body, weight: .regular) }

    /// Widths that fit each column's text, stretched to fill `available`. A table a little too
    /// wide gives up spare room around its text first (down to the cell's own insets), so a
    /// four-column log fits an iPhone instead of cutting its last column.
    func columnWidths(available: CGFloat) -> [CGFloat] {
        let width = max(columns, 1)
        let font = Self.cellFont
        let longest = (0..<width).map { c -> CGFloat in
            ceil(rows.map { c < $0.count ? ($0[c] as NSString).size(withAttributes: [.font: font]).width : 0 }.max() ?? 0)
        }
        // A column is 280 pt at most at the default text size, and more as the text grows, so a
        // date still fits its column at the largest sizes.
        let widest = max(280, 280 * EditorMetrics.body / 17)
        var natural = longest.map { min(max($0 + 24, 64), widest) }
        let total = natural.reduce(0, +)
        if total < available, total > 0 {
            natural = natural.map { $0 * available / total }
        } else if total > available {
            // The text plus the cells' 8-point insets either side.
            let tight = zip(longest, natural).map { min(max($0 + 16, 44), $1) }
            let least = tight.reduce(0, +)
            if least >= available { return tight }
            let give = (total - available) / (total - least)
            natural = zip(natural, tight).map { n, t in n - (n - t) * give }
        }
        return natural
    }
}

extension TypedTable.ColumnType {
    /// A choice whose first answer is "Yes": shown as a checkbox.
    var isYesNo: Bool {
        if case .choice(let o) = self { return o.first?.lowercased() == "yes" }
        return false
    }
}

/// Which edges of a scrolled table have more columns past them.
struct GridOverflow: Equatable {
    var leading = false
    var trailing = false

    init(leading: Bool = false, trailing: Bool = false) {
        self.leading = leading
        self.trailing = trailing
    }

    init(_ g: ScrollGeometry) {
        leading = g.contentOffset.x > 1
        trailing = g.contentOffset.x + g.containerSize.width < g.contentSize.width - 1
    }

    /// Opaque where the table shows, fading over the last `width` points of an edge with more.
    struct Fade: View {
        let overflow: GridOverflow
        static let width: CGFloat = 28

        var body: some View {
            HStack(spacing: 0) {
                if overflow.leading { LinearGradient(colors: [.clear, .black], startPoint: .leading, endPoint: .trailing).frame(width: Self.width) }
                Rectangle()
                if overflow.trailing { LinearGradient(colors: [.black, .clear], startPoint: .leading, endPoint: .trailing).frame(width: Self.width) }
            }
        }
    }
}

enum GridMetrics {
    /// 32 pt at the default text size, growing with the reader's text size on iPhone: at the
    /// largest sizes the rows kept their 32 pt and the text of one row was drawn over the next.
    static var row: CGFloat { max(32, ceil(EditorMetrics.body * 32 / 17)) }
    static let handle: CGFloat = 16
    static func height(_ t: GridTable) -> CGFloat { handle + CGFloat(t.rows.count) * row + 2 }
    #if os(iOS)
    /// A row or column handle's touch target: 44 points square (HIG), however small its grip.
    static let handleHit: CGFloat = 44
    /// Room above the table for the column handles' targets: they reach this far over the line
    /// above, so less of the header row is given up to them. Only the targets take taps there.
    static let reach: CGFloat = 14
    #else
    /// On the Mac a pointer is precise: the target is the grip and a little around it, so a click
    /// in the header next to a grip still places the caret.
    static let handleHit: CGFloat = 28
    static let reach: CGFloat = 0
    #endif
}

/// A whole row or a whole column of a table, as its handle picks it.
enum GridLine: Hashable {
    case row(Int)
    case column(Int)
}

/// What the table menus do to the row or column of a cell.
enum TableAction: Hashable, CaseIterable {
    case addRowAbove, addRowBelow, deleteRow, addColumnBefore, addColumnAfter, deleteColumn

    var title: String {
        switch self {
        case .addRowAbove: "Add Row Above"
        case .addRowBelow: "Add Row Below"
        case .deleteRow: "Delete Row"
        case .addColumnBefore: "Add Column Before"
        case .addColumnAfter: "Add Column After"
        case .deleteColumn: "Delete Column"
        }
    }

    var systemImage: String {
        switch self {
        case .addRowAbove: "arrow.up"
        case .addRowBelow: "arrow.down"
        case .addColumnBefore: "arrow.left"
        case .addColumnAfter: "arrow.right"
        case .deleteRow, .deleteColumn: "trash"
        }
    }

    var isDestructive: Bool { self == .deleteRow || self == .deleteColumn }

    static let row: [TableAction] = [.addRowAbove, .addRowBelow, .deleteRow]
    static let column: [TableAction] = [.addColumnBefore, .addColumnAfter, .deleteColumn]
}

extension GridTable {
    /// The last row and the last column stay: Delete Table removes the table.
    func allows(_ a: TableAction) -> Bool {
        switch a {
        case .deleteRow: rows.count > 1
        case .deleteColumn: columns > 1
        default: true
        }
    }

    /// Does `a` to the row or column of `cell`, and returns where the keyboard goes next: the same
    /// cell where it now is, or its neighbour when its row or column went.
    @discardableResult
    mutating func perform(_ a: TableAction, at cell: GridCell) -> GridCell {
        let r = min(max(cell.row, 0), rows.count - 1), c = min(max(cell.column, 0), max(columns - 1, 0))
        switch a {
        case .addRowAbove:
            // Never above the header: the new row goes under it.
            let at = max(r, 1)
            rows.insert(blankRow, at: at)
            return GridCell(row: at == r ? r + 1 : r, column: c)
        case .addRowBelow:
            rows.insert(blankRow, at: r + 1)
            return GridCell(row: r, column: c)
        case .deleteRow:
            guard rows.count > 1 else { return GridCell(row: r, column: c) }
            rows.remove(at: r)
            return GridCell(row: min(r, rows.count - 1), column: c)
        case .addColumnBefore:
            insertColumn(at: c)
            return GridCell(row: r, column: c + 1)
        case .addColumnAfter:
            insertColumn(at: c + 1)
            return GridCell(row: r, column: c)
        case .deleteColumn:
            guard columns > 1 else { return GridCell(row: r, column: c) }
            removeColumn(at: c)
            return GridCell(row: r, column: min(c, columns - 1))
        }
    }
}

/// Where the row and column handles of the cell with the keyboard are, and which one a tap picks.
/// Each target is `hit` points square (44 on iPhone), centred on its grip and kept inside the
/// table's own area. Two targets can overlap (a narrow first column puts its column handle near the
/// first row's handle): a tap there goes to the nearer grip, so neither ever takes the other's taps.
/// Points are in the table view's content space: the reach band at the top, the column handle
/// strip, then the rows; the row handle strip on the left.
struct GridHandles: Equatable {
    struct Grip: Equatable {
        var line: GridLine
        var center: CGPoint
        var hit: CGRect
    }

    var grips: [Grip] = []

    init(widths: [CGFloat], rows: Int, cell: GridCell?, rowHeight: CGFloat = GridMetrics.row,
         strip: CGFloat = GridMetrics.handle, reach: CGFloat = GridMetrics.reach, hit: CGFloat = GridMetrics.handleHit) {
        guard let cell, rows > 0, cell.row < rows, cell.column < widths.count else { return }
        let total = strip + widths.reduce(0, +)
        let bottom = reach + strip + CGFloat(rows) * rowHeight
        func target(_ center: CGPoint) -> CGRect {
            var r = CGRect(x: center.x - hit / 2, y: center.y - hit / 2, width: hit, height: hit)
            r.origin.x = min(max(r.minX, 0), max(total - hit, 0))
            r.origin.y = min(max(r.minY, 0), max(bottom - hit, 0))
            return r
        }
        let cx = strip + widths[..<cell.column].reduce(0, +) + widths[cell.column] / 2
        let column = CGPoint(x: cx, y: reach + strip / 2)
        let row = CGPoint(x: strip / 2, y: reach + strip + CGFloat(cell.row) * rowHeight + rowHeight / 2)
        grips = [Grip(line: .column(cell.column), center: column, hit: target(column)),
                 Grip(line: .row(cell.row), center: row, hit: target(row))]
    }

    /// The handle a tap at `p` picks: of the targets under it, the one whose grip is nearest.
    func line(at p: CGPoint) -> GridLine? {
        grips.filter { $0.hit.contains(p) }
            .min { hypot($0.center.x - p.x, $0.center.y - p.y) < hypot($1.center.x - p.x, $1.center.y - p.y) }?.line
    }
}

/// The handle targets of one table on screen, in the table view's own (host) coordinates: the
/// iPhone editor lets taps in the reach band above a table through to the text unless one lands
/// on a target, and anchors a handle's menu on it.
@MainActor
final class GridHitBox {
    static let space = "gridHost"
    var targets: [GridLine: CGRect] = [:]
}

/// A table's menu as shown: for a handle (`line`), or for the whole table from the toolbar.
struct TableMenu {
    struct Item {
        var title: String
        var systemImage: String
        var destructive = false
        var enabled = true
        var run: () -> Void
    }
    var grid: Int
    var line: GridLine?
    var sections: [[Item]]
    var items: [Item] { sections.flatMap { $0 } }
    func item(_ title: String) -> Item? { items.first { $0.title == title } }
}

/// A table menu's items, for a SwiftUI menu (the keyboard bar's and the Mac toolbar's Table button).
struct TableMenuItems: View {
    let menu: TableMenu

    var body: some View {
        ForEach(Array(menu.sections.enumerated()), id: \.offset) { _, section in
            Section {
                ForEach(section, id: \.title) { item in
                    Button(item.title, systemImage: item.systemImage, role: item.destructive ? .destructive : nil, action: item.run)
                        .disabled(!item.enabled)
                        .accessibilityIdentifier("table.menu.\(item.title)")
                }
            }
        }
    }
}

/// The table the keyboard is in, and the row or column picked by its handle.
struct TableContext: Equatable {
    var grid: Int
    var cell: GridCell
    var selected: GridLine?
}

/// Where the keyboard is inside a grid.
struct GridCell: Hashable {
    var row: Int
    var column: Int
}

struct TableGridView: View {
    let table: GridTable
    /// Writes the edited table back into the note.
    let commit: (GridTable) -> Void
    /// Set when the keyboard should come into the table: the caret arrowing in from the
    /// text, or a table just made (its first cell).
    var focusRequest: GridFocusRequest?
    /// The whole table is selected in the text (Delete next to it selects it first).
    var selected = false
    /// Arrowing out of the top (false) or bottom (true) row hands the keyboard back to the text.
    var exit: (Bool) -> Void = { _ in }

    @State private var draft: GridTable
    /// Edges with more columns past them (see GridOverflow).
    @State private var overflow = GridOverflow()
    @Environment(\.colorSchemeContrast) private var contrast
    @FocusState private var focus: GridCell?
    /// Set when the keyboard (not a click) moves between cells: the caret goes to
    /// the end of the cell's text instead of selecting all of it.
    @State private var caretToEnd = false
    /// The one cell showing a text field; nil when the table isn't being edited.
    @State private var editing: GridCell?
    /// Where the caret goes in that cell (nil: after its text).
    @State private var caretAt: Int?
    /// A cell whose field is being created and should take focus when it appears.
    @State private var pendingFocus: GridCell?
    /// The cell the keyboard is moving to, until it has arrived.
    @State private var wanted: GridCell?
    /// The cell keys act on: the one the keyboard is moving to, while it's on its way. Mid-move
    /// `focus` still names the old cell or is briefly nil (the old field going away), and a key
    /// pressed then would repeat the last move or be dropped.
    private var current: GridCell? { wanted ?? focus }

    /// The note's editor: the table menus, and which row or column is picked.
    var controller: EditorController?
    /// Where this table's handle targets are, for the editor (see GridHitBox).
    var box: GridHitBox?

    init(table: GridTable, focusRequest: GridFocusRequest? = nil, selected: Bool = false, controller: EditorController? = nil, box: GridHitBox? = nil,
         exit: @escaping (Bool) -> Void = { _ in }, commit: @escaping (GridTable) -> Void) {
        self.selected = selected
        self.table = table
        self.commit = commit
        self.focusRequest = focusRequest
        self.controller = controller
        self.box = box
        self.exit = exit
        _draft = State(initialValue: table)
    }

    /// The row or column picked by its handle in this table, while the keyboard is in it.
    private var picked: GridLine? {
        guard let t = controller?.table, t.grid == table.index, focus != nil || wanted != nil else { return nil }
        return t.selected
    }

    var body: some View {
        GeometryReader { geo in
            let available = geo.size.width - GridMetrics.handle
            let widths = draft.columnWidths(available: available)
            let total = widths.reduce(0, +)
            ScrollView(.horizontal) {
                content(widths: widths)
                    .frame(width: GridMetrics.handle + total, alignment: .leading)
            }
            .scrollDisabled(total <= available + 0.5)
            .scrollIndicators(total <= available + 0.5 ? .hidden : .automatic)
            // A table wider than the note fades at the edge that has more, so a cut column
            // reads as "scroll for more", not as clipped.
            .onScrollGeometryChange(for: GridOverflow.self) { GridOverflow($0) } action: { _, new in overflow = new }
            .mask { GridOverflow.Fade(overflow: overflow) }
        }
        .coordinateSpace(.named(GridHitBox.space))
        .onChange(of: table) { _, new in
            guard new != draft else { return }
            // A row or column the menus removed: the cell being edited may be gone.
            if let e = editing, e.row >= new.rows.count || e.column >= max(new.columns, 1) { editing = nil }
            // Our own edit coming back from the note keeps what's on screen: the note's
            // copy has lost the space just typed at the end of a cell, and taking it
            // would join the next word onto the last.
            let rows = draft.reads(as: new) ? draft.rows : new.rows
            draft = new
            draft.rows = rows
        }
        .onAppear {
            if let cell = focusRequest?.cell { DispatchQueue.main.async { go(cell) } }
        }
        .onChange(of: focusRequest) { _, r in if let r { DispatchQueue.main.async { go(r.cell) } } }
        .onChange(of: focus) { _, new in
            qaTrace("grid focus -> \(String(describing: new))")
            if new == nil {
                // The old cell's field going away can knock focus out before the new
                // one lands: put it back (`land` keeps asking if this is turned down too).
                // A real departure leaves `wanted` empty.
                if let w = wanted { DispatchQueue.main.async { if focus == nil, wanted == w { focus = w } } }
                // The keyboard really left the table (not on its way to another cell): its menus
                // no longer apply to it.
                let index = table.index
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { if focus == nil, wanted == nil { controller?.leftTable(index) } }
                // The last cell's field stays: it's plain-styled, so it reads as text.
                return
            }
            if new == wanted { wanted = nil }
            if let new, new != editing { editing = new }
            if let new { controller?.tableFocused(grid: table.index, cell: new) }
            guard caretToEnd else { return }
            caretToEnd = false
            let caret = caretAt
            #if os(macOS)
            // The field selects everything as it takes focus; put a caret at the end instead.
            // The field selects all once its editor is installed, a turn or two later.
            func place(_ tries: Int) {
                DispatchQueue.main.async {
                    let windows = [NSApp.keyWindow].compactMap { $0 } + NSApp.windows
                    guard let editor = windows.lazy.compactMap({ $0.firstResponder as? NSTextView }).first(where: { $0.isFieldEditor }) else {
                        if tries > 0 { place(tries - 1) }
                        return
                    }
                    let end = (editor.string as NSString).length
                    let at = min(caret ?? end, end)
                    if editor.selectedRange() != NSRange(location: at, length: 0) {
                        editor.setSelectedRange(NSRange(location: at, length: 0))
                    }
                    if tries > 0 { place(tries - 1) }
                }
            }
            place(3)
            #endif
        }
    }

    private func content(widths: [CGFloat]) -> some View {
        let handles = GridHandles(widths: widths, rows: draft.rows.count, cell: focus)
        return VStack(alignment: .leading, spacing: 0) {
            // Over the line above: only the column handle's target takes taps here (iPhone).
            Color.clear.frame(height: GridMetrics.reach)
            // The strip the column handle sits in.
            Color.clear.frame(height: GridMetrics.handle)
            HStack(alignment: .top, spacing: 0) {
                // The strip the row handles sit in.
                Color.clear.frame(width: GridMetrics.handle)
                grid(widths: widths)
                    .overlay(alignment: .topLeading) { pickedTint(widths: widths) }
            }
        }
        // Each handle is a small grip with a target as big as a fingertip around it. A tap
        // anywhere in a target picks the handle whose grip is nearest, so targets that overlap
        // never take each other's taps.
        .overlay(alignment: .topLeading) {
            ZStack(alignment: .topLeading) {
                ForEach(handles.grips, id: \.line) { g in
                    grip(g, handles: handles)
                }
            }
        }
        .coordinateSpace(.named(Self.contentSpace))
    }

    private static let contentSpace = "gridContent"

    private func grip(_ g: GridHandles.Grip, handles: GridHandles) -> some View {
        let horizontal = if case .column = g.line { true } else { false }
        let picked = self.picked == g.line
        let label = switch g.line {
        case .row(let r): rowHandleLabel(r)
        case .column(let c): columnHandleLabel(c)
        }
        return ZStack {
            Image(systemName: "ellipsis")
                .rotationEffect(.degrees(horizontal ? 0 : 90))
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(picked ? AnyShapeStyle(Color.white) : AnyShapeStyle(.secondary))
                .frame(width: horizontal ? 28 : 14, height: horizontal ? 14 : 24)
                .background(picked ? AnyShapeStyle(Color.accentColor) : AnyShapeStyle(.fill.secondary), in: .capsule)
                .hoverHighlight(Capsule())
                .position(x: g.center.x - g.hit.minX, y: g.center.y - g.hit.minY)
        }
        .frame(width: g.hit.width, height: g.hit.height)
        .contentShape(.rect)
        .onTapGesture(coordinateSpace: .named(Self.contentSpace)) { p in
            pick(handles.line(at: p) ?? g.line)
        }
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(GridHitBox.space)) } action: { box?.targets[g.line] = $0 }
        .onDisappear { box?.targets[g.line] = nil }
        .accessibilityElement()
        .accessibilityLabel(label)
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits(picked ? .isSelected : [])
        .accessibilityAction { pick(g.line) }
        .accessibilityIdentifier(horizontal ? "grid.handle.column" : "grid.handle.row")
        // Placed by padding, not offset: an offset moves the drawing but not the frame the
        // editor reads for the target (where it lets taps through, where the menu goes).
        .padding(.leading, g.hit.minX)
        .padding(.top, g.hit.minY)
    }

    /// A handle was tapped: its row or column is picked (tinted like selected text) and its menu shows.
    private func pick(_ line: GridLine) {
        guard let f = focus ?? wanted else { return }
        qaTrace("grid pick \(line) from \(f)")
        controller?.pickTableLine(line, grid: table.index, cell: f)
    }

    /// The picked row or column, tinted like selected text.
    @ViewBuilder
    private func pickedTint(widths: [CGFloat]) -> some View {
        switch picked {
        case .row(let r) where r < draft.rows.count:
            Rectangle().fill(Color.accentColor.opacity(0.16))
                .overlay(Rectangle().strokeBorder(Color.accentColor, lineWidth: 2))
                .frame(width: widths.reduce(0, +), height: GridMetrics.row)
                .offset(y: CGFloat(r) * GridMetrics.row)
                .allowsHitTesting(false)
        case .column(let c) where c < widths.count:
            Rectangle().fill(Color.accentColor.opacity(0.16))
                .overlay(Rectangle().strokeBorder(Color.accentColor, lineWidth: 2))
                .frame(width: widths[c], height: CGFloat(draft.rows.count) * GridMetrics.row)
                .offset(x: widths[..<c].reduce(0, +))
                .allowsHitTesting(false)
        default:
            EmptyView()
        }
    }

    private func grid(widths: [CGFloat]) -> some View {
        let cols = widths.count
        return VStack(spacing: 0) {
            ForEach(0..<draft.rows.count, id: \.self) { r in
                HStack(spacing: 0) {
                    ForEach(0..<cols, id: \.self) { c in
                        cell(r, c, cols: cols, width: widths[c])
                            .frame(width: widths[c], height: GridMetrics.row)
                            .overlay(alignment: .trailing) {
                                // D (reading page): rows only, no columns of lines.
                                if c < cols - 1 && !DesignLook.readingPage { Rectangle().fill(border).frame(width: 1) }
                            }
                            .accessibilityIdentifier("grid.\(r).\(c)")
                            // VoiceOver: which column you're in, then where in the table.
                            .accessibilityLabel(cellLabel(r, c))
                    }
                }
                // D: the header row on a soft fill.
                .background { if r == 0 && DesignLook.readingPage { Color.soft } }
                .overlay(alignment: .bottom) {
                    if r < draft.rows.count - 1 { Rectangle().fill(border.opacity(DesignLook.readingPage ? 0.6 : 1)).frame(height: 1) }
                }
            }
        }
        .modifier(ReadingCorners())
        .overlay(RoundedRectangle(cornerRadius: DesignLook.readingPage ? Radius.sm : 2, style: .continuous).strokeBorder(border.opacity(DesignLook.readingPage ? 0.6 : 1), lineWidth: 1))
        // Selected as a whole (about to be deleted): tinted like selected text.
        .overlay {
            if selected {
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.accentColor.opacity(0.12))
                    .strokeBorder(Color.accentColor, lineWidth: 2)
                    .allowsHitTesting(false)
            }
        }
        .onKeyPress(.upArrow) {
            guard let f = current else { return .ignored }
            if f.row == 0 { wanted = nil; exit(false) } else { go(GridCell(row: f.row - 1, column: f.column)) }
            return .handled
        }
        .onKeyPress(.downArrow) {
            qaTrace("grid down, focus \(String(describing: focus)) wanted \(String(describing: wanted))")
            guard let f = current else { return .ignored }
            if f.row == draft.rows.count - 1 { wanted = nil; exit(true) } else { go(GridCell(row: f.row + 1, column: f.column)) }
            return .handled
        }
        .onKeyPress(.escape) {
            guard current != nil else { return .ignored }
            wanted = nil
            exit(true)
            return .handled
        }
        .onKeyPress(.tab, phases: .down) { press in
            guard let f = current else { return .ignored }
            step(from: f, by: press.modifiers.contains(.shift) ? -1 : 1, cols: cols)
            return .handled
        }
    }

    private func columnHandleLabel(_ c: Int) -> String {
        Self.columnHandleLabel(header: draft.rows.first.flatMap { c < $0.count ? $0[c] : nil } ?? "", column: c)
    }

    static func columnHandleLabel(header: String, column: Int) -> String {
        "\(header.isEmpty ? "Column \(column + 1)" : "\(header) column") options"
    }

    private func rowHandleLabel(_ r: Int) -> String {
        Self.rowHandleLabel(row: r)
    }

    static func rowHandleLabel(row: Int) -> String {
        "Row \(row + 1) options"
    }

    private func cellLabel(_ r: Int, _ c: Int) -> String {
        let header = draft.rows.first.flatMap { c < $0.count ? $0[c] : nil } ?? ""
        let value = r < draft.rows.count && c < draft.rows[r].count ? draft.rows[r][c] : ""
        let place = r == 0 ? "Header, column \(c + 1)" : "\(header.isEmpty ? "Column \(c + 1)" : header), row \(r)"
        return value.isEmpty ? "\(place), empty" : "\(value), \(place)"
    }

    @ViewBuilder
    private func cell(_ r: Int, _ c: Int, cols: Int, width: CGFloat) -> some View {
        // A table is plain to look at and to type in, like one in Notes, whatever types its
        // hidden `pane-table` line gives the columns: that line is data for AI tools and
        // note apps. One exception: a Yes/No column keeps its tick, so a tracker you already
        // have is still ticked with a click.
        let type = r == 0 ? .text : draft.type(c)
        if type.isYesNo, case .choice(let options) = type {
            yesNoCell(r, c, options: options)
        } else if editing == GridCell(row: r, column: c) {
            TextField("", text: cellBinding(r, c))
                .textFieldStyle(.plain)
                .font(.system(size: EditorMetrics.body))
                .monospacedDigit()
                .padding(.horizontal, 8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .focused($focus, equals: GridCell(row: r, column: c))
                .onSubmit { move(from: GridCell(row: r, column: c), cols: cols) }
                // Focus once the field really exists (it's created for this edit).
                .onAppear {
                    qaTrace("grid field appears \(r),\(c) pending \(String(describing: pendingFocus))")
                    if pendingFocus == GridCell(row: r, column: c) {
                        pendingFocus = nil
                        focus = GridCell(row: r, column: c)
                    }
                }
        } else {
            // Only the cell being edited is a text field; the rest are plain text,
            // which keeps big tables quick to open. A click edits, caret where you clicked.
            let value = r < draft.rows.count && c < draft.rows[r].count ? draft.rows[r][c] : ""
            Text(value.isEmpty ? " " : value)
                .font(.system(size: EditorMetrics.body))
                .monospacedDigit()
                .lineLimit(1)
                .accessibilityAddTraits(.isButton)
                .padding(.horizontal, 8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .contentShape(.rect)
                #if os(macOS)
                // A click here puts a caret in the text, so the pointer says so, like Notes.
                .pointerStyle(.horizontalText)
                #endif
                .onTapGesture { p in
                    begin(GridCell(row: r, column: c), at: Self.caretIndex(in: value, x: p.x, width: width, trailing: false))
                }
        }
    }

    /// Which character a click at `x` (in the cell) lands before.
    static func caretIndex(in value: String, x: CGFloat, width: CGFloat, trailing: Bool) -> Int {
        let font = PFont.systemFont(ofSize: EditorMetrics.body)
        let ns = value as NSString
        let full = ns.size(withAttributes: [.font: font]).width
        let start: CGFloat = trailing ? width - 8 - full : 8
        let local = x - start
        guard local > 0 else { return 0 }
        var previous: CGFloat = 0
        for i in 1...max(ns.length, 1) where i <= ns.length {
            let w = ns.substring(to: i).size(withAttributes: [.font: font]).width
            if local < (previous + w) / 2 { return i - 1 }
            previous = w
        }
        return ns.length
    }

    /// Yes is a ticked circle, like a checklist; a tap flips it.
    private func yesNoCell(_ r: Int, _ c: Int, options: [String]) -> some View {
        let value = cellBinding(r, c)
        let yes = options.first ?? "Yes"
        let no = options.count > 1 ? options[1] : "No"
        let current = value.wrappedValue
        let isYes = current.caseInsensitiveCompare(yes) == .orderedSame
        let isNo = current.isEmpty || current.caseInsensitiveCompare(no) == .orderedSame
        return Button {
            value.wrappedValue = isYes ? no : yes
        } label: {
            Group {
                if isYes || isNo {
                    Image(systemName: isYes ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: EditorMetrics.checkSize * 0.8))
                        .foregroundStyle(isYes ? AnyShapeStyle(.tint) : AnyShapeStyle(.tertiary))
                } else {
                    Text(current)
                        .font(.system(size: EditorMetrics.body))
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .padding(.horizontal, 8)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .contextMenu {
            ForEach(options, id: \.self) { o in Button(o) { value.wrappedValue = o } }
            Divider()
            Button("Clear") { value.wrappedValue = "" }
        }
        .accessibilityLabel(current.isEmpty ? "Empty" : current)
    }

    /// Moves the keyboard to a cell, caret after its text, like Notes.
    private func go(_ cell: GridCell) {
        begin(cell, at: nil)
    }

    /// Turns a cell into a text field and gives it the keyboard.
    private func begin(_ cell: GridCell, at caret: Int?) {
        qaTrace("grid begin \(cell) editing \(String(describing: editing)) focus \(String(describing: focus))")
        wanted = cell
        caretAt = caret
        caretToEnd = true
        if editing == cell {
            focus = cell
        } else {
            // The field is created for this cell; it takes focus as it appears.
            pendingFocus = cell
            editing = cell
        }
        land(cell)
    }

    /// Keeps asking for the keyboard for `cell` until it has arrived, for up to about two
    /// seconds. One ask isn't enough: on a busy main thread it can come before the new field
    /// is in the window, AppKit turns it down, focus stays nil and nothing asks again, so the
    /// table silently loses the keyboard and the next arrow key goes nowhere.
    private func land(_ cell: GridCell, tries: Int = 100) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
            guard wanted == cell, focus != cell else { return }
            qaTrace("grid land \(cell), focus \(String(describing: focus)), \(tries) tries left")
            focus = cell
            if tries > 0 { land(cell, tries: tries - 1) }
        }
    }

    /// Grid lines get firmer with Increase Contrast.
    /// The cells' edges: grey, or in the candidates (DesignLook) the warm muted ink, so the grid
    /// sits in the page's warmth instead of on it.
    private var border: Color {
        DesignLook.isCandidate ? Color.muted.opacity(contrast == .increased ? 0.9 : 0.4) : Color.secondary.opacity(contrast == .increased ? 0.9 : 0.45)
    }

    private func cellBinding(_ r: Int, _ c: Int) -> Binding<String> {
        Binding(
            get: { r < draft.rows.count && c < draft.rows[r].count ? draft.rows[r][c] : "" },
            set: { value in
                guard r < draft.rows.count else { return }
                while draft.rows[r].count <= c { draft.rows[r].append("") }
                draft.rows[r][c] = value
                commit(draft)
            })
    }

    /// Cells you type into; a tick is skipped by Tab and Return.
    private func isText(_ r: Int, _ c: Int) -> Bool {
        r == 0 || !draft.type(c).isYesNo
    }

    /// Tab walks the text cells; past the last cell it adds a row.
    private func step(from f: GridCell, by delta: Int, cols: Int) {
        var flat = f.row * cols + f.column
        repeat {
            flat += delta
            if flat < 0 { return }
            if flat >= draft.rows.count * cols {
                draft.rows.append(draft.blankRow)
                commit(draft)
            }
        } while !isText(flat / cols, flat % cols) && (0..<cols).contains(where: { isText(flat / cols, $0) })
        go(GridCell(row: flat / cols, column: flat % cols))
    }

    /// Return moves down a row, adding one at the bottom.
    private func move(from f: GridCell, cols: Int) {
        if f.row == draft.rows.count - 1 {
            draft.rows.append(draft.blankRow)
            commit(draft)
        }
        go(GridCell(row: f.row + 1, column: f.column))
    }

}

/// Development traces for the QA harness; compiled out of real builds.
@inline(__always) func qaTrace(_ s: @autoclosure () -> String) {
    #if QA
    FileHandle.standardError.write(("TRACE " + s() + "\n").data(using: .utf8)!)
    #endif
}

/// D (the reading page): the table's outer corners rounded (sm), its header fill clipped to them.
/// Nothing is clipped in the other looks.
private struct ReadingCorners: ViewModifier {
    func body(content: Content) -> some View {
        if DesignLook.readingPage {
            content.clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
        } else {
            content
        }
    }
}

#if os(macOS)
/// A table menu item's action, as an AppKit menu item's target.
final class TableMenuAction: NSObject {
    let run: () -> Void
    init(_ run: @escaping () -> Void) { self.run = run }
    @objc func fire() { run() }
}
#endif
