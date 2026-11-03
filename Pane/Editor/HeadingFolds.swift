import CryptoKit
import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

extension NSAttributedString.Key {
    /// A line inside a collapsed section: TextKit leaves it out of layout (FoldingContentDelegate).
    static let paneFolded = NSAttributedString.Key("pane.folded")
    /// A heading whose disclosure chevron shows, drawn by `DecoratedLayoutFragment` (value: `HeadingFoldMark`).
    static let paneFoldMark = NSAttributedString.Key("pane.foldMark")
}

/// Collapsible sections, like Notes' (iOS 18, macOS 15) and Obsidian's heading folds. A `#`, `##`
/// or `###` heading can be collapsed, hiding everything under it up to the next heading of the
/// same or a higher level, or the note's end. Only the editor hides it: the note's text, and so
/// sync, export and the AI tools, keep every line. Which sections are collapsed is kept on this
/// device, per note (`FoldStore`).
enum HeadingFolds {
    struct Heading: Equatable {
        /// The heading's whole line, its line break included.
        var line: NSRange
        var level: Int
        var title: String
        /// What collapsing hides: the lines after the heading, to the next heading of the same or
        /// a higher level (or the note's end).
        var body: NSRange
        /// There is something under it to hide (not only blank lines).
        var foldable: Bool
        var location: Int { line.location }
        /// Where the caret ends the heading's text (before its line break).
        var textEnd: Int { NSMaxRange(line) - (line.length > 0 ? 1 : 0) }
    }

    /// The deepest heading that collapses (Title, Heading and Subheading in the Format menu).
    static let deepest = 3

    /// The heading on a line, if it is one: its level and title. `# Title`, up to three spaces
    /// before it, a space after the hashes and some text.
    static func parse(_ ns: NSString, line r: NSRange) -> (level: Int, title: String)? {
        var i = r.location
        let end = NSMaxRange(r)
        var spaces = 0
        while i < end, ns.character(at: i) == 0x20, spaces < 4 { i += 1; spaces += 1 }
        guard spaces < 4 else { return nil }
        var level = 0
        while i < end, ns.character(at: i) == 0x23 { i += 1; level += 1 }
        guard (1...6).contains(level), i < end else { return nil }
        let c = ns.character(at: i)
        guard c == 0x20 || c == 0x09 else { return nil }
        let title = ns.substring(with: NSRange(location: i, length: end - i)).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return nil }
        return (level, title)
    }

    /// The note's headings that collapse, in order. A `#` line in a fenced code block is code.
    /// Deeper headings (`####`) don't collapse but belong to the section above them.
    static func headings(in text: String, code: [NSRange]) -> [Heading] {
        let ns = text as NSString
        let len = ns.length
        guard len > 0, text.contains("#") else { return [] }
        var found: [(line: NSRange, level: Int, title: String)] = []
        var codeIndex = 0
        ns.enumerateSubstrings(in: NSRange(location: 0, length: len), options: [.byLines, .substringNotRequired]) { _, r, enclosing, _ in
            guard r.length > 1 else { return }
            while codeIndex < code.count, NSMaxRange(code[codeIndex]) <= r.location { codeIndex += 1 }
            if codeIndex < code.count, NSLocationInRange(r.location, code[codeIndex]) { return }
            guard let h = parse(ns, line: r) else { return }
            found.append((enclosing, h.level, h.title))
        }
        var out: [Heading] = []
        for (i, h) in found.enumerated() where h.level <= deepest {
            let start = NSMaxRange(h.line)
            var end = len
            for next in found[(i + 1)...] where next.level <= h.level { end = next.line.location; break }
            let body = NSRange(location: start, length: max(0, end - start))
            let foldable = body.length > 0 && ns.substring(with: body).contains { !$0.isWhitespace }
            out.append(Heading(line: h.line, level: h.level, title: h.title, body: body, foldable: foldable))
        }
        return out
    }

    /// What the collapsed headings hide, merged and in order. A heading inside a collapsed
    /// section is hidden with it.
    static func hidden(_ headings: [Heading], collapsed: Set<Int>) -> [NSRange] {
        var out: [NSRange] = []
        for h in headings where h.foldable && collapsed.contains(h.location) {
            if let last = out.last, NSMaxRange(last) >= h.body.location {
                out[out.count - 1] = NSUnionRange(last, h.body)
            } else {
                out.append(h.body)
            }
        }
        return out
    }

    /// Whether `location` is out of sight: inside a hidden range, or at the note's end after one.
    static func isHidden(_ location: Int, in hidden: [NSRange], length: Int) -> Bool {
        hidden.contains { NSLocationInRange(location, $0) || (location == length && NSMaxRange($0) == length && $0.location <= location && $0.length > 0) }
    }

    /// The hidden range a location is in.
    static func range(containing location: Int, in hidden: [NSRange], length: Int) -> NSRange? {
        hidden.first { NSLocationInRange(location, $0) || (location == length && NSMaxRange($0) == length && $0.location <= location && $0.length > 0) }
    }

    /// Where a caret that landed in a collapsed section goes: coming down from above, to the line
    /// after the section; otherwise to the end of its heading. Nil when it's in sight.
    static func caret(_ location: Int, previous: Int?, hidden: [NSRange], length: Int) -> Int? {
        guard let h = range(containing: location, in: hidden, length: length) else { return nil }
        if let previous, previous < h.location, NSMaxRange(h) < length { return NSMaxRange(h) }
        return max(0, h.location - 1)
    }

    /// Return at the end of a collapsed heading: a new line after the hidden section, as in Notes.
    /// It shows, though it's under the heading: a collapsed section keeps where it ended
    /// (`FoldState`) until it's opened.
    static func returnKey(in text: String, selection: NSRange, headings: [Heading], collapsed: Set<Int>) -> TextEdit? {
        guard selection.length == 0 else { return nil }
        let ns = text as NSString
        guard let h = headings.first(where: { $0.foldable && collapsed.contains($0.location) && $0.textEnd == selection.location }) else { return nil }
        let end = NSMaxRange(h.body)
        // At the note's end after a line break, the new line is the one the caret goes to.
        let caret = end < ns.length || (end > 0 && ns.character(at: end - 1) == 0x0A) ? end : end + 1
        return TextEdit(range: NSRange(location: end, length: 0), replacement: "\n", caret: caret)
    }

    /// Where a collapsed section ends after an edit: an edit at or after its end leaves it (a line
    /// added just after it stays in sight); one before it moves it.
    static func shiftEnd(_ end: Int, edited: NSRange, delta: Int) -> Int {
        if edited.location >= end { return end }
        let oldEnd = edited.location + edited.length - delta
        if oldEnd <= end { return end + delta }
        return NSMaxRange(edited)
    }

    /// The collapsed headings an edit of `range` reaches into: they open, so nothing changes out of
    /// sight. An edit that takes a heading and its whole section with it leaves the others be.
    static func opened(by range: NSRange, headings: [Heading], collapsed: Set<Int>) -> Set<Int> {
        var out = Set<Int>()
        for h in headings where h.foldable && collapsed.contains(h.location) {
            // From the heading's line break on: deleting that would pull the first hidden line up.
            let span = NSRange(location: h.textEnd, length: NSMaxRange(h.body) - h.textEnd)
            let reaches = NSIntersectionRange(range, span).length > 0 || (range.length == 0 && range.location > h.body.location && range.location < NSMaxRange(h.body))
            let takesAll = range.location <= h.location && NSMaxRange(range) >= NSMaxRange(h.body)
            if reaches && !takesAll { out.insert(h.location) }
        }
        return out
    }

    /// Collapsed headings' places after an edit: those after it move with it; one the edit
    /// replaced is gone.
    static func shift(_ locations: Set<Int>, edited: NSRange, delta: Int) -> Set<Int> {
        let oldEnd = edited.location + edited.length - delta
        var out = Set<Int>()
        for l in locations {
            if l >= oldEnd { out.insert(l + delta) } else if l < edited.location { out.insert(l) }
        }
        return out
    }

    /// A heading as kept on this device: its level, title and which of the same name it is,
    /// hashed, so a note's headings never sit readable in the app's settings (locked notes too).
    static func keys(for collapsed: Set<Int>, in headings: [Heading]) -> [String] {
        var seen: [String: Int] = [:]
        var out: [String] = []
        for h in headings {
            let name = "\(h.level) \(h.title)"
            let n = seen[name, default: 0]
            seen[name] = n + 1
            if collapsed.contains(h.location) { out.append(hash("\(name) \(n)")) }
        }
        return out
    }

    /// The headings kept collapsed, found in the text by their keys.
    static func locations(for keys: [String], in headings: [Heading]) -> Set<Int> {
        let wanted = Set(keys)
        var seen: [String: Int] = [:]
        var out = Set<Int>()
        for h in headings {
            let name = "\(h.level) \(h.title)"
            let n = seen[name, default: 0]
            seen[name] = n + 1
            if h.foldable, wanted.contains(hash("\(name) \(n)")) { out.insert(h.location) }
        }
        return out
    }

    static func hash(_ s: String) -> String {
        SHA256.hash(data: Data(s.utf8)).prefix(10).map { String(format: "%02x", $0) }.joined()
    }
}

/// Which sections of which note are collapsed, on this device only (Notes keeps it per device too).
enum FoldStore {
    nonisolated(unsafe) static var defaults: UserDefaults = .standard
    private static func key(_ note: UUID) -> String { "pane.folds.\(note.uuidString)" }

    static func load(_ note: UUID) -> [String] { defaults.stringArray(forKey: key(note)) ?? [] }

    static func save(_ keys: [String], for note: UUID) {
        if keys.isEmpty { defaults.removeObject(forKey: key(note)) } else { defaults.set(keys, forKey: key(note)) }
    }
}

/// How a heading's chevron draws: collapsed or open.
final class HeadingFoldMark: NSObject {
    let collapsed: Bool
    init(collapsed: Bool) { self.collapsed = collapsed }
    override func isEqual(_ object: Any?) -> Bool { (object as? HeadingFoldMark)?.collapsed == collapsed }
    override var hash: Int { collapsed ? 1 : 0 }

    /// The chevron's centre, left of the heading's text, in the margin.
    static let inset: CGFloat = 11
    /// How far a click or tap reaches around the chevron.
    static let hitWidth: CGFloat = 26
}

/// One editor's collapsed sections: the headings, what they hide, and the chevrons that show.
@MainActor
final class FoldState {
    /// The note whose collapsed sections are kept (nil: kept only while it's open).
    var noteID: UUID? {
        didSet {
            guard noteID != oldValue else { return }
            collapsed = []
            ends = [:]
            pendingKeys = noteID.map(FoldStore.load)
            savedKeys = pendingKeys ?? []
            dirty = true
        }
    }
    /// Mac: the heading under the pointer, by where its line starts; its chevron shows.
    var hovered: Int? { didSet { if hovered != oldValue { dirty = true } } }
    /// iPhone: a heading's chevron shows while the caret is on it (Notes shows it on a tap).
    var showsAtCaret = false

    private(set) var collapsed: Set<Int> = []
    /// Where each collapsed section ended when it was collapsed, moved by edits. A line added
    /// after it (Return at its heading) stays in sight, as in Notes, though it's under the heading.
    private var ends: [Int: Int] = [:]
    /// The headings; a collapsed one's body stops at its end.
    private(set) var headings: [HeadingFolds.Heading] = []
    private(set) var hidden: [NSRange] = []
    private var length = 0
    private var pendingKeys: [String]?
    private var savedKeys: [String] = []
    /// Something changed that the text's attributes don't show yet.
    private(set) var dirty = false

    func isHidden(_ location: Int) -> Bool { HeadingFolds.isHidden(location, in: hidden, length: length) }

    /// The heading whose line starts at `location`, if it collapses.
    func heading(at location: Int) -> HeadingFolds.Heading? { headings.first { $0.location == location && $0.foldable } }

    /// The text changed: collapsed headings and hidden lines move with it at once, before the
    /// restyle reads it again (a caret placed during the edit is checked against them).
    func noteEdit(_ edited: NSRange, delta: Int) {
        length += delta
        if let h = hovered, h >= edited.location { hovered = nil }
        guard !collapsed.isEmpty else { return }
        let moved = HeadingFolds.shift(collapsed, edited: edited, delta: delta)
        var newEnds: [Int: Int] = [:]
        for l in collapsed {
            guard let e = ends[l] else { continue }
            let to = l >= edited.location + edited.length - delta ? l + delta : l
            if moved.contains(to) { newEnds[to] = HeadingFolds.shiftEnd(e, edited: edited, delta: delta) }
        }
        collapsed = moved
        ends = newEnds
        let oldEnd = edited.location + edited.length - delta
        hidden = hidden.compactMap { r in
            if r.location >= oldEnd { return NSRange(location: r.location + delta, length: r.length) }
            if NSMaxRange(r) <= edited.location { return r }
            // An edit inside a hidden range opens it at the restyle; until then it covers the edit.
            let end = max(NSMaxRange(r) + delta, NSMaxRange(edited))
            return NSRange(location: min(r.location, edited.location), length: max(0, end - min(r.location, edited.location)))
        }
        dirty = true
    }

    func toggle(_ location: Int) {
        if collapsed.contains(location) {
            collapsed.remove(location)
            ends[location] = nil
        } else if let h = heading(at: location) {
            collapsed.insert(location)
            ends[location] = NSMaxRange(h.body)
        }
        dirty = true
    }

    func collapseAll() {
        collapsed = Set(headings.filter(\.foldable).map(\.location))
        ends = [:]
        dirty = true
    }

    func expandAll() {
        guard !collapsed.isEmpty else { return }
        collapsed = []
        ends = [:]
        dirty = true
    }

    /// Opens the sections `range` reaches into (an edit, a found word). True if any opened.
    @discardableResult
    func open(for range: NSRange) -> Bool {
        let opened = HeadingFolds.opened(by: range, headings: headings, collapsed: collapsed)
        guard !opened.isEmpty else { return false }
        collapsed.subtract(opened)
        for l in opened { ends[l] = nil }
        dirty = true
        return true
    }

    /// Opens every section around `range` when all of it is out of sight (find selected a word there).
    @discardableResult
    func reveal(_ range: NSRange) -> Bool {
        guard range.length > 0, let h = HeadingFolds.range(containing: range.location, in: hidden, length: length),
              NSMaxRange(range) <= NSMaxRange(h) else { return false }
        let around = headings.filter { collapsed.contains($0.location) && NSLocationInRange(range.location, $0.body) }
        guard !around.isEmpty else { return false }
        collapsed.subtract(around.map(\.location))
        for h in around { ends[h.location] = nil }
        dirty = true
        return true
    }

    /// Reads the text again: its headings, which stay collapsed, what they hide. Keeps the
    /// collapsed headings' keys on this device when they change (a collapsed heading renamed).
    func update(_ text: String, code: [NSRange]) {
        length = (text as NSString).length
        var found = HeadingFolds.headings(in: text, code: code)
        if let keys = pendingKeys {
            pendingKeys = nil
            collapsed = HeadingFolds.locations(for: keys, in: found)
        }
        let foldable = Set(found.filter(\.foldable).map(\.location))
        collapsed.formIntersection(foldable)
        for i in found.indices where collapsed.contains(found[i].location) {
            let h = found[i]
            let end = min(NSMaxRange(h.body), ends[h.location] ?? NSMaxRange(h.body))
            ends[h.location] = end
            found[i].body = NSRange(location: h.body.location, length: max(0, end - h.body.location))
            if found[i].body.length == 0 { collapsed.remove(h.location); ends[h.location] = nil }
        }
        ends = ends.filter { collapsed.contains($0.key) }
        headings = found
        hidden = HeadingFolds.hidden(headings, collapsed: collapsed)
        let keys = HeadingFolds.keys(for: collapsed, in: headings)
        if keys != savedKeys, let id = noteID {
            savedKeys = keys
            FoldStore.save(keys, for: id)
        }
    }

    /// Hides the collapsed sections and marks the headings whose chevron shows, changing only the
    /// attributes that differ from what the text has (styling clears them in what it restyles).
    /// Returns whether what's hidden changed.
    @discardableResult
    func apply(to storage: NSTextStorage, code: [NSRange], selection: NSRange?) -> Bool {
        update(storage.string, code: code)
        dirty = false
        let ns = storage.string as NSString
        let whole = NSRange(location: 0, length: ns.length)
        var want = IndexSet()
        for r in hidden { want.insert(integersIn: r.location..<NSMaxRange(r)) }
        var have = IndexSet()
        storage.enumerateAttribute(.paneFolded, in: whole) { v, r, _ in
            if v != nil { have.insert(integersIn: r.location..<NSMaxRange(r)) }
        }
        let caretLine: NSRange? = selection.flatMap { s in
            guard showsAtCaret, s.location != NSNotFound, s.location <= ns.length else { return nil }
            return ns.lineRange(for: NSRange(location: s.location, length: 0))
        }
        var marks: [Int: (NSRange, HeadingFoldMark)] = [:]
        for h in headings where h.foldable && !want.contains(h.location) {
            let isCollapsed = collapsed.contains(h.location)
            let shown = isCollapsed || hovered == h.location || caretLine.map { NSLocationInRange(h.location, $0) || $0.location == h.location } == true
            if shown { marks[h.location] = (h.line, HeadingFoldMark(collapsed: isCollapsed)) }
        }
        var stale: [NSRange] = []
        storage.enumerateAttribute(.paneFoldMark, in: whole) { v, r, _ in
            guard let m = v as? HeadingFoldMark else { return }
            if let w = marks[r.location], w.0 == r, w.1 == m { marks[r.location] = nil } else { stale.append(r) }
        }
        let remove = have.subtracting(want), add = want.subtracting(have)
        guard !remove.isEmpty || !add.isEmpty || !stale.isEmpty || !marks.isEmpty else { return false }
        storage.beginEditing()
        for r in remove.rangeView { storage.removeAttribute(.paneFolded, range: NSRange(location: r.lowerBound, length: r.count)) }
        for r in add.rangeView { storage.addAttribute(.paneFolded, value: true, range: NSRange(location: r.lowerBound, length: r.count)) }
        for r in stale { storage.removeAttribute(.paneFoldMark, range: r) }
        for (_, m) in marks where NSMaxRange(m.0) <= ns.length { storage.addAttribute(.paneFoldMark, value: m.1, range: m.0) }
        storage.endEditing()
        return !remove.isEmpty || !add.isEmpty
    }
}

/// Leaves the lines of collapsed sections out of layout: they take no room, draw nothing and
/// the caret can't land in them. TextKit 2's own way to hide paragraphs, on iPhone and Mac.
final class FoldingContentDelegate: NSObject, NSTextContentStorageDelegate {
    func textContentManager(_ textContentManager: NSTextContentManager, shouldEnumerate textElement: NSTextElement, options: NSTextContentManager.EnumerationOptions) -> Bool {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 0 else { return true }
        return p.attributedString.attribute(.paneFolded, at: 0, effectiveRange: nil) == nil
    }
}

extension DecoratedLayoutFragment {
    var foldMark: HeadingFoldMark? {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 0 else { return nil }
        return p.attributedString.attribute(.paneFoldMark, at: 0, effectiveRange: nil) as? HeadingFoldMark
    }

    /// The heading's own type (its first visible letter's), for the chevron's size and height.
    private var headingFont: PFont {
        if let p = textElement as? NSTextParagraph {
            var found: PFont?
            p.attributedString.enumerateAttribute(.font, in: NSRange(location: 0, length: p.attributedString.length)) { v, _, stop in
                if let f = v as? PFont, f.pointSize > 1 { found = f; stop.pointee = true }
            }
            if let found { return found }
        }
        return .systemFont(ofSize: EditorMetrics.body, weight: .bold)
    }

    /// The chevron's square, in this fragment's coordinates: in the margin left of the text, level
    /// with the middle of the heading's capitals.
    func foldChevronRect() -> CGRect? {
        guard foldMark != nil, let line = textLineFragments.first else { return nil }
        let font = headingFont
        let size = min(11, max(8, (font.capHeight * 0.62).rounded()))
        let mid = line.typographicBounds.minY + line.glyphOrigin.y - font.capHeight / 2
        let x = -layoutFragmentFrame.minX - HeadingFoldMark.inset
        return CGRect(x: x - size / 2, y: mid - size / 2, width: size, height: size)
    }

    /// Where a click or tap toggles the section: the chevron with room around it, the margin's
    /// width and the first line's height.
    func foldHitRect() -> CGRect? {
        guard let r = foldChevronRect(), let line = textLineFragments.first else { return nil }
        let b = line.typographicBounds
        return CGRect(x: r.midX - HeadingFoldMark.hitWidth / 2, y: min(b.minY, r.minY - 4), width: HeadingFoldMark.hitWidth, height: max(b.height, r.height + 8))
    }

    /// The "…" after a collapsed heading's text: what it hides is there. In this fragment's coordinates.
    func foldMoreRect() -> CGRect? {
        guard let m = foldMark, m.collapsed, let line = textLineFragments.last, let r = foldChevronRect() else { return nil }
        let end = line.typographicBounds.minX + line.typographicBounds.width
        let h = max(12, (headingFont.capHeight * 1.05).rounded())
        let w = (h * 1.7).rounded()
        let y = line.typographicBounds.minY + line.glyphOrigin.y - headingFont.capHeight / 2 - h / 2
        return CGRect(x: end + 8, y: textLineFragments.count == 1 ? r.midY - h / 2 : y, width: w, height: h)
    }

    var foldSurface: CGRect {
        guard let r = foldChevronRect() else { return .null }
        var s = r.insetBy(dx: -3, dy: -3)
        if let more = foldMoreRect() { s = s.union(more.insetBy(dx: -2, dy: -2)) }
        return s
    }

    func drawFold(at o: CGPoint, in ctx: CGContext) {
        guard let m = foldMark, let rect = foldChevronRect() else { return }
        let r = rect.offsetBy(dx: o.x, dy: o.y)
        ctx.saveGState()
        ctx.setStrokeColor(PColor.paneSecondary.cgColor)
        ctx.setLineWidth(max(1.5, r.width * 0.17))
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        let s = r.width
        if m.collapsed {
            // chevron.right
            ctx.move(to: CGPoint(x: r.minX + s * 0.34, y: r.minY + s * 0.12))
            ctx.addLine(to: CGPoint(x: r.minX + s * 0.70, y: r.midY))
            ctx.addLine(to: CGPoint(x: r.minX + s * 0.34, y: r.maxY - s * 0.12))
        } else {
            // chevron.down
            ctx.move(to: CGPoint(x: r.minX + s * 0.12, y: r.minY + s * 0.34))
            ctx.addLine(to: CGPoint(x: r.midX, y: r.minY + s * 0.70))
            ctx.addLine(to: CGPoint(x: r.maxX - s * 0.12, y: r.minY + s * 0.34))
        }
        ctx.strokePath()
        if let more = foldMoreRect()?.offsetBy(dx: o.x, dy: o.y) {
            ctx.addPath(CGPath(roundedRect: more, cornerWidth: more.height / 2, cornerHeight: more.height / 2, transform: nil))
            ctx.setFillColor(PColor.paneFill.cgColor)
            ctx.fillPath()
            ctx.setFillColor(PColor.paneSecondary.cgColor)
            let d = max(2, (more.height * 0.16).rounded())
            for i in -1...1 {
                let c = CGPoint(x: more.midX + CGFloat(i) * d * 2, y: more.midY)
                ctx.fillEllipse(in: CGRect(x: c.x - d / 2, y: c.y - d / 2, width: d, height: d))
            }
        }
        ctx.restoreGState()
    }
}

// MARK: The text views

extension PaneTextView {
    /// The collapsible heading drawn at `point` (text-container coordinates), with its fragment.
    /// `onlyShown`: only one whose chevron shows (iPhone: a tap reaches only a chevron you see).
    func foldHeading(at point: CGPoint, onlyShown: Bool = false) -> (location: Int, fragment: DecoratedLayoutFragment)? {
        guard let tlm = textLayoutManager, let tcm = tlm.textContentManager else { return nil }
        // A chevron that just showed or went left its line to be laid out again.
        if let r = tlm.textViewportLayoutController.viewportRange { tlm.ensureLayout(for: r) }
        guard let frag = tlm.textLayoutFragment(for: CGPoint(x: max(point.x, 0), y: point.y)) as? DecoratedLayoutFragment,
              let start = frag.textElement?.elementRange?.location else { return nil }
        let f = frag.layoutFragmentFrame
        guard point.y >= f.minY, point.y <= f.maxY else { return nil }
        let loc = tcm.offset(from: tcm.documentRange.location, to: start)
        guard core.folds.heading(at: loc) != nil, !onlyShown || frag.foldMark != nil else { return nil }
        return (loc, frag)
    }

    /// The heading whose chevron (or a collapsed one's "…") is at `point`, in text-container coordinates.
    func foldToggle(at point: CGPoint, onlyShown: Bool = false) -> Int? {
        guard let (loc, frag) = foldHeading(at: point, onlyShown: onlyShown) else { return nil }
        let f = frag.layoutFragmentFrame
        let p = CGPoint(x: point.x - f.minX, y: point.y - f.minY)
        // Measured as if the chevron showed: on the Mac it shows as the pointer arrives.
        let line = frag.textLineFragments.first
        let hit = frag.foldHitRect() ?? line.map { b in
            CGRect(x: -f.minX - HeadingFoldMark.inset - HeadingFoldMark.hitWidth / 2, y: b.typographicBounds.minY,
                   width: HeadingFoldMark.hitWidth, height: b.typographicBounds.height)
        }
        if hit?.contains(p) == true { return loc }
        if let more = frag.foldMoreRect(), more.insetBy(dx: -4, dy: -4).contains(p) { return loc }
        return nil
    }

    /// Collapses or opens a section, or all of them; a caret that would be hidden goes to the end of
    /// its heading.
    func changeFolds(_ change: (FoldState) -> Void) {
        #if os(iOS)
        let storage = textStorage
        let selection = isFirstResponder ? selectedRange : nil
        #else
        guard let storage = textStorage else { return }
        let selection = window?.firstResponder === self ? selectedRange() : nil
        #endif
        change(core.folds)
        core.applyFolds(storage, selection: selection)
        #if os(iOS)
        let sel = selectedRange
        #else
        let sel = selectedRange()
        #endif
        if core.folds.isHidden(sel.location) || (sel.length > 0 && core.folds.isHidden(NSMaxRange(sel) - 1)),
           let h = HeadingFolds.range(containing: core.folds.isHidden(sel.location) ? sel.location : NSMaxRange(sel) - 1, in: core.folds.hidden, length: storage.length) {
            let at = max(0, h.location - 1)
            #if os(iOS)
            selectedRange = NSRange(location: at, length: 0)
            #else
            setSelectedRange(NSRange(location: at, length: 0))
            #endif
        }
        #if os(macOS)
        DispatchQueue.main.async { [weak self] in self?.placeFoot() }
        #endif
    }

    func toggleFold(_ location: Int) { changeFolds { $0.toggle(location) } }
    func collapseAllSections() { changeFolds { $0.collapseAll() } }
    func expandAllSections() { changeFolds { $0.expandAll() } }

    /// Return at the end of a collapsed heading: a new line after its section, like Notes. True if handled.
    func foldReturn(_ selection: NSRange) -> Bool {
        let text = currentText
        core.folds.update(text, code: core.structure(of: text).code)
        guard let e = HeadingFolds.returnKey(in: text, selection: selection, headings: core.folds.headings, collapsed: core.folds.collapsed) else { return false }
        apply(e)
        return true
    }

    /// Find landed on a word in a collapsed section: the section opens.
    func revealFolds() {
        #if os(iOS)
        let sel = selectedRange
        #else
        let sel = selectedRange()
        #endif
        guard sel.length > 0, core.folds.isHidden(sel.location) else { return }
        changeFolds { $0.reveal(sel) }
    }

    #if os(macOS)
    /// The pointer over a heading shows its chevron, like Notes; over the chevron it's an arrow.
    /// Returns true when the pointer is on a chevron.
    func hoverFolds(at point: CGPoint) -> Bool {
        let over = foldHeading(at: point)?.location
        if over != core.folds.hovered {
            changeFolds { $0.hovered = over }
        }
        return foldToggle(at: point) != nil
    }

    /// An edit that reaches into a collapsed section opens it, so nothing changes out of sight.
    override func shouldChangeText(in range: NSRange, replacementString: String?) -> Bool {
        guard super.shouldChangeText(in: range, replacementString: replacementString) else { return false }
        core.folds.open(for: range)
        return true
    }

    override func mouseExited(with event: NSEvent) {
        super.mouseExited(with: event)
        if core.folds.hovered != nil { changeFolds { $0.hovered = nil } }
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if !trackingAreas.contains(where: { ($0.userInfo?["pane.folds"] as? Bool) == true }) {
            addTrackingArea(NSTrackingArea(rect: .zero, options: [.mouseEnteredAndExited, .mouseMoved, .activeInActiveApp, .inVisibleRect],
                                           owner: self, userInfo: ["pane.folds": true]))
        }
    }
    #endif
}
