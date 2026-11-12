import CoreGraphics
import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Lines named for App Store captures, tinted as if an AI had just changed them:
/// `-uitest -highlight "Saffron|Chorizo"` (their text, without the list marker).
enum ChangeHighlight {
    static let lines: Set<String> = {
        let args = ProcessInfo.processInfo.arguments
        guard args.contains("-uitest"), let i = args.firstIndex(of: "-highlight"), i + 1 < args.count else { return [] }
        return Set(args[i + 1].split(separator: "|").map { $0.trimmingCharacters(in: .whitespaces) })
    }()

    /// Whether this markdown line (a whole paragraph, marker included) is one of them.
    static func matches(_ paragraph: String) -> Bool {
        guard !lines.isEmpty else { return false }
        var text = paragraph.trimmingCharacters(in: .newlines)
        if let prefix = ListPrefix(line: text) { text = (text as NSString).substring(from: prefix.length) }
        return lines.contains(text.trimmingCharacters(in: .whitespaces))
    }
}

/// The lines an AI just changed in the open note, tinted amber behind the text: the tint
/// swells in, then either holds a moment and fades (an edit made in the note's app), or stays
/// until you start typing, undo or leave the note (an AI's edit, so it's still marked however long
/// you take to read it). One per editor; its layout fragments ask it whether their paragraph is
/// one of the changed ones.
final class ChangeTint: @unchecked Sendable {
    /// Whole paragraphs (UTF-16, newline included) of the editor's text, in order.
    private(set) var ranges: [NSRange] = []
    /// Where lines were taken out: the paragraph each gap sits above (or below, at the note's
    /// end), so the note marks a removal and not only the review (persona council r7).
    private(set) var removals: [Removal] = []

    struct Removal: Equatable {
        /// The paragraph next to the gap (UTF-16, newline included).
        var paragraph: NSRange
        /// The gap is under the paragraph: what was removed ended the note.
        var below: Bool
    }

    /// Everything that's drawn: the changed paragraphs and those next to a removal.
    private var drawn: [NSRange] { ranges + removals.map(\.paragraph) }
    /// 0 gone, 1 resting, a little over 1 while it arrives.
    private(set) var strength: CGFloat = 0
    /// Redraws these ranges (set by the text view).
    var redraw: ([NSRange]) -> Void = { _ in }
    private var run = 0

    /// The words that changed, as ranges of the editor's text: inside a rewritten line only what's
    /// new in it, a new line whole. A tick, or words only taken out, mark the line's words whole.
    private(set) var marks: [NSRange] = []
    /// The AI's own colour for the tint (ChatGPT green, Claude orange); nil for the app's accent.
    private(set) var color: PColor?
    /// Seconds since the marks started sweeping in, like a highlighter pulled across the words;
    /// nil once every one is drawn whole (and with Reduce Motion, from the start).
    private(set) var sweepElapsed: Double?

    /// The sweep: each paragraph's highlight is pulled across its words in `sweepDuration`, a
    /// paragraph a moment after the one above it, all done in about half a second.
    static let sweepDuration = 0.32
    // In reading order, one line after another (council r1: six lines at once looked like a progress bar).
    // Every line in within about half a second, 30 ms apart at most (council r3: a rewrite took 1.3 s).
    static func sweepStagger(_ count: Int) -> Double { count > 1 ? min(0.03, 0.2 / Double(count - 1)) : 0 }

    /// How far the sweep is through the changed paragraph starting at `offset`: 0 nothing yet,
    /// 1 drawn whole.
    func sweep(at offset: Int) -> CGFloat {
        guard let elapsed = sweepElapsed else { return 1 }
        if settled.contains(where: { NSLocationInRange(offset, $0) }) { return 1 }
        let order = ranges.filter { r in !settled.contains { NSLocationInRange(r.location, $0) } }.sorted { $0.location < $1.location }
        guard let k = order.firstIndex(where: { $0.location == offset }) else { return 1 }
        let t = (elapsed - Double(k) * Self.sweepStagger(order.count)) / Self.sweepDuration
        let p = min(1, max(0, t))
        return CGFloat(1 - pow(1 - p, 3))
    }

    /// Paragraphs already marked when a later edit lands: they stay drawn whole, only the new
    /// change sweeps in (council r3: Saffron's mark shrank and swept in again).
    private(set) var settled: [NSRange] = []
    /// Whether the mark has reached full strength once: until then a ticked box is in the AI's
    /// colour outright, so it doesn't start orange (council r3).
    private(set) var peaked = false
    /// How much of the AI's colour a ticked box takes.
    var tickBlend: CGFloat { peaked ? min(1, strength) : (strength > 0 ? 1 : 0) }

    /// The marked words in the paragraph `paragraph`, counted from its start.
    /// Most of the text is marked: drawn lighter.
    private(set) var heavy = false

    /// Marks of an earlier AI's edit still showing when another AI's lands, each in its own
    /// AI's colour (council r2: Claude's tick wiped ChatGPT's Saffron).
    private(set) var carried: [(range: NSRange, color: PColor?)] = []
    func carried(in paragraph: NSRange) -> [(NSRange, PColor?)] {
        carried.compactMap { m in
            let i = NSIntersectionRange(m.range, paragraph)
            return i.length > 0 ? (NSRange(location: i.location - paragraph.location, length: i.length), m.color) : nil
        }
    }

    /// `r` after the text changed by `e`: moved along, grown or shrunk when the change is inside
    /// it, nil when the change crosses its edge.
    static func moved(_ r: NSRange, through e: TextDiff.Edit) -> NSRange? {
        let delta = (e.replacement as NSString).length - e.range.length
        if NSMaxRange(e.range) <= r.location { return NSRange(location: r.location + delta, length: r.length) }
        if e.range.location >= NSMaxRange(r) { return r }
        guard e.range.location >= r.location, NSMaxRange(e.range) <= NSMaxRange(r) else { return nil }
        return NSRange(location: r.location, length: max(0, r.length + delta))
    }

    func marks(in paragraph: NSRange) -> [NSRange] {
        marks.compactMap { m in
            let i = NSIntersectionRange(m, paragraph)
            return i.length > 0 ? NSRange(location: i.location - paragraph.location, length: i.length) : nil
        }
    }

    /// A mark waiting for its text: the note screen hears of an AI's edit about when the editor
    /// takes it, and the mark must start in the same frame as the words, not a beat after.
    private var pending: (after: String, start: @MainActor () -> Void)?
    /// Whether the change is in view. Its rest starts only once it is, so a change below the
    /// fold is still marked when you get to it (council r1); after `waitsInView` it fades anyway.
    var inView: (@MainActor () -> Bool)?
    static let waitsInView: Double = 60

    /// The editor just took this text: start what was waiting for it, before it's drawn.
    @MainActor func textArrived(_ text: String) {
        guard let p = pending, p.after == text else { return }
        pending = nil
        p.start()
    }

    /// Runs `start` now if the editor holds `after`, else the moment it does.
    @MainActor func whenText(_ current: String, is after: String, _ start: @escaping @MainActor () -> Void) {
        pending = nil
        if current == after { start() } else { pending = (after, start) }
    }

    /// Where items were ticked from `old` to `new`: the start (UTF-16) of each such line in `new`.
    static func tickedLines(from old: String, to new: String) -> [Int] {
        let a = old.components(separatedBy: "\n"), b = new.components(separatedBy: "\n")
        let from = replaced(from: a, to: b)
        var out: [Int] = [], at = 0
        for (j, line) in b.enumerated() {
            if let i = from[j], a[i].replacingOccurrences(of: "[ ]", with: "[x]") == line, line.contains("[x]") { out.append(at) }
            at += (line as NSString).length + 1
        }
        return out
    }

    /// Plays the sweep again over what's marked (Show, after scrolling to a change off screen).
    @MainActor func replay(from previous: String, to text: String) {
        play(from: previous, to: text, color: color)
    }

    /// Reduce Motion: no sweep, the marks fade in and out.
    @MainActor static var reduceMotion: Bool {
        #if os(iOS)
        UIAccessibility.isReduceMotionEnabled
        #else
        NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        #endif
    }

    /// Offscreen Mac recordings stretch time, so slow frame grabs still catch every step.
    nonisolated(unsafe) static var slowMotion: Double = 1
    /// Captures: the tint and the receipt stay at rest until `Capture.clearAIMarks` is posted.
    nonisolated(unsafe) static var holdForCapture = false

    /// How strongly to tint the paragraph starting at `offset`: 0 for not at all.
    func strength(at offset: Int) -> CGFloat {
        guard strength > 0 else { return 0 }
        guard ranges.contains(where: { NSLocationInRange(offset, $0) }) else { return 0 }
        // An earlier change still marked steps back to about half as a new one sweeps in, so
        // the one that just landed reads as new (council r4).
        if settled.contains(where: { NSLocationInRange(offset, $0) }) {
            let p = sweepElapsed.map { min(1, $0 / Self.sweepDuration) } ?? 1
            return strength * (1 - 0.45 * CGFloat(p))
        }
        return strength
    }

    /// Items an AI ticked (where each line starts): the mark is a halo round the box, not a fill
    /// behind the struck-through words (council r1).
    private(set) var ticks: [Int] = []
    func ticked(at offset: Int) -> Bool { strength > 0 && ticks.contains(offset) }

    /// Whether any line is tinted right now.
    var isLit: Bool { strength > 0 && !drawn.isEmpty }

    /// Whether the paragraph starting at `offset` is one of the changed lines, tinted or not yet cleared.
    func covers(_ offset: Int) -> Bool { drawn.contains { NSLocationInRange(offset, $0) } }

    /// The removal next to the paragraph starting at `offset`, and how strongly to draw it.
    func removal(at offset: Int) -> (Removal, CGFloat)? {
        guard strength > 0, let r = removals.first(where: { NSLocationInRange(offset, $0.paragraph) }) else { return nil }
        return (r, strength)
    }

    /// Tints the paragraphs of `text` that `previous` didn't have, then fades them. `untilCleared`:
    /// the tint stays at rest until `stop()` instead of fading.
    @MainActor func play(from previous: String, to text: String, color: PColor? = nil, hold: Double = 2.6, untilCleared: Bool = false) {
        // The lit marks in `text`'s terms: already moved there (the editor followed the text), or
        // moved through the one edit from what they were marks of.
        var lit: (marks: [NSRange], carried: [(range: NSRange, color: PColor?)], drawn: [NSRange])?
        if strength > 0, let base = shown {
            if base == text {
                lit = (marks, carried, drawn)
            } else if let e = TextDiff.edit(from: base, to: text) {
                func m(_ r: NSRange) -> NSRange? { Self.moved(r, through: e) }
                lit = (marks.compactMap(m), carried.compactMap { c in m(c.range).map { ($0, c.color) } }, drawn.compactMap(m))
            }
        }
        // Another AI's edit right on top of this one: its marks stay, in its colour.
        var keep: [(range: NSRange, color: PColor?)] = []
        if let lit, color != self.color, text != madeFor {
            keep = lit.carried + lit.marks.map { ($0, self.color) }
        }
        // A later edit while this one is marked: what's marked stays as it is.
        // By line, found from the marked words too: a deletion next to a line can cross its edge
        // and lose the line's range, never its words (council r3: Saffron swept in again in 16).
        let ns = text as NSString
        func line(_ r: NSRange) -> NSRange { ns.paragraphRange(for: NSRange(location: min(r.location, ns.length), length: 0)) }
        let still = lit.map { $0.drawn + $0.marks.map(line) + $0.carried.map { line($0.range) } } ?? [], prior = lit == nil ? 0 : strength, wasPeaked = lit != nil && peaked
        stop()
        settled = still
        madeFor = text
        strength = prior
        peaked = wasPeaked
        self.color = color
        shown = text
        ticks = Self.tickedLines(from: previous, to: text)
        ranges = Self.paragraphRanges(changedFrom: previous, to: text)
        removals = Self.removals(from: previous, to: text)
        marks = Self.changedWords(from: previous, to: text)
        // Words an earlier AI's mark already holds stay in its colour, not this one's.
        if !keep.isEmpty { marks = marks.filter { m in !keep.contains { NSIntersectionRange($0.range, m).length > 0 } } }
        // Most of the note new: a lighter mark, so the page isn't one block of colour (council r2).
        heavy = Double(marks.reduce(0) { $0 + $1.length }) > Double((text as NSString).length) * 0.35
        carried = keep
        if !keep.isEmpty {
            let ns = text as NSString
            let held = keep.map { ns.paragraphRange(for: NSRange(location: min($0.range.location, ns.length), length: 0)) }
            ranges = Array(Set((ranges + held).map { [$0.location, $0.length] })).map { NSRange(location: $0[0], length: $0[1]) }.sorted { $0.location < $1.location }
        }
        guard !ranges.isEmpty || !removals.isEmpty else { return }
        if !Self.reduceMotion { startSweep() }
        // More to read, a longer rest: up to 3 s more for a rewrite (council r4).
        let read = Double(marks.reduce(0) { $0 + $1.length })
        light(hold: hold + min(3, max(0, read - 40) / 80), untilCleared: untilCleared)
    }

    /// Pulls the highlight across the changed words, about 60 redraws a second.
    @MainActor private func startSweep() {
        let mine = run, lit = ranges
        guard !lit.isEmpty else { return }
        let total = Self.sweepDuration + Self.sweepStagger(lit.count) * Double(lit.count - 1)
        sweepElapsed = 0
        let start = Date.now
        Task { @MainActor in
            while mine == run {
                let t = Date.now.timeIntervalSince(start) / Self.slowMotion
                sweepElapsed = t >= total ? nil : t
                redraw(lit)
                if t >= total { return }
                try? await Task.sleep(for: .seconds(1 / 60.0))
            }
        }
    }

    @MainActor private func light(hold: Double, untilCleared: Bool) {
        let mine = run, lit = drawn
        let easeOut: @Sendable (Double) -> Double = { 1 - pow(1 - $0, 3) }
        let easeInOut: @Sendable (Double) -> Double = { $0 < 0.5 ? 4 * $0 * $0 * $0 : 1 - pow(-2 * $0 + 2, 3) / 2 }
        Task { @MainActor in
            // A later edit on a lit mark: no second pop, the new words' sweep is their arrival.
            if strength == 0 {
                guard await animate(to: 1.5, over: 0.3, easeOut, run: mine, lit: lit) else { return }
            }
            peaked = true
            guard await animate(to: 1, over: 0.5, easeInOut, run: mine, lit: lit) else { return }
            if untilCleared { return }
            let waiting = Date.now
            while let seen = inView, !seen(), mine == run, Date.now.timeIntervalSince(waiting) < Self.waitsInView {
                try? await Task.sleep(for: .seconds(0.2))
            }
            // The rest in small steps, so captures can speed it up mid-way (slowMotion back to 1).
            var rested = 0.0, last = Date.now
            while rested < hold, mine == run {
                try? await Task.sleep(for: .seconds(0.05))
                // By the clock: a sleep in the background can run long.
                rested += Date.now.timeIntervalSince(last) / Self.slowMotion
                last = .now
            }
            while Self.holdForCapture, mine == run { try? await Task.sleep(for: .seconds(0.1)) }
            guard await animate(to: 0, over: 1.6, easeInOut, run: mine, lit: lit) else { return }
            ranges = []
            removals = []
            marks = []
        }
    }

    /// Moves the strength to `target` over `seconds` of wall-clock time, about 30 redraws a
    /// second (fewer if the main thread is busy; it never runs long). False once another run took over.
    @MainActor private func animate(to target: CGFloat, over seconds: Double, _ curve: @Sendable (Double) -> Double, run mine: Int, lit: [NSRange]) async -> Bool {
        let duration = seconds * Self.slowMotion
        let from = strength, start = Date.now
        while true {
            guard mine == run else { return false }
            let t = min(1, Date.now.timeIntervalSince(start) / duration)
            strength = from + (target - from) * CGFloat(curve(t))
            redraw(lit)
            if t >= 1 { return true }
            try? await Task.sleep(for: .seconds(1 / 30.0))
        }
    }

    /// The text the marks are ranges of, to follow your typing while they fade.
    private var shown: String?
    /// The text the current mark was made for: the same again is the same change re-marked,
    /// not a second AI's edit on top.
    private var madeFor: String?

    /// You typed: the marks move with the text and fade out in a third of a second, rather than
    /// cutting out (council r1). Anything else clears at once.
    @MainActor func typed(_ now: String) {
        guard follow(now) else { stop(); return }
        sweepElapsed = nil
        inView = nil
        guard !fading else { redraw(drawn); return }
        fading = true
        run += 1
        let mine = run, lit = drawn
        Task { @MainActor in
            defer { if mine == run { fading = false } }
            guard await animate(to: 0, over: 0.3, { 1 - pow(1 - $0, 2) }, run: mine, lit: lit) else { return }
            stop()
        }
    }
    private var fading = false

    /// The text changed from elsewhere (a sync, an AI's next edit): the marks move with it and
    /// carry on as they were, so a later edit's mark can build on them (council r3: Saffron's
    /// mark was wiped and swept in again). False when there's nothing lit to move.
    @MainActor @discardableResult func follow(_ now: String) -> Bool {
        guard strength > 0, !drawn.isEmpty, let base = shown else { return false }
        guard base != now else { return true }
        guard let e = TextDiff.edit(from: base, to: now) else { return false }
        func moved(_ r: NSRange) -> NSRange? { Self.moved(r, through: e) }
        redraw(drawn)
        ranges = ranges.compactMap(moved)
        marks = marks.compactMap(moved)
        removals = removals.compactMap { g in moved(g.paragraph).map { Removal(paragraph: $0, below: g.below) } }
        ticks = ticks.compactMap { moved(NSRange(location: $0, length: 1))?.location }
        carried = carried.compactMap { c in moved(c.range).map { ($0, c.color) } }
        settled = settled.compactMap(moved)
        shown = now
        return true
    }

    /// Clears at once (you started typing, or undid the edit).
    @MainActor func stop() {
        run += 1
        sweepElapsed = nil
        inView = nil
        fading = false
        settled = []
        peaked = false
        guard strength > 0 || !drawn.isEmpty else { return }
        // Redraw while the lines are still known, so their old tint is painted over.
        strength = 0
        redraw(drawn)
        ranges = []
        removals = []
        marks = []
        ticks = []
        carried = []
    }

    /// Line numbers (0-based) of `new` that are added or rewritten compared with `old`. A line
    /// that only moved isn't one, and neither is a blank line.
    static func changedLines(from old: String, to new: String) -> [Int] {
        let a = old.components(separatedBy: "\n"), b = new.components(separatedBy: "\n")
        var out: [Int] = []
        for change in b.difference(from: a).inferringMoves() {
            guard case .insert(let offset, let line, let movedFrom) = change, movedFrom == nil else { continue }
            if !line.trimmingCharacters(in: .whitespaces).isEmpty { out.append(offset) }
        }
        return out.sorted()
    }

    /// Where non-blank lines of `old` were taken out with nothing written in their place: each
    /// gap as the paragraph of `new` under it (or over it, when the note's end went). A rewrite
    /// is tinted, and a line that only moved is neither.
    /// Whether two lines have a word in common, list markers and checkboxes aside.
    static func shareAWord(_ x: String, _ y: String) -> Bool {
        func words(_ s: String) -> Set<String> {
            let bare = s.replacingOccurrences(of: #"^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?"#, with: "", options: .regularExpression)
            return Set(bare.lowercased().split { !$0.isLetter && !$0.isNumber }.map(String.init))
        }
        return !words(x).isDisjoint(with: words(y))
    }

    static func removals(from old: String, to new: String) -> [Removal] {
        let a = old.components(separatedBy: "\n"), b = new.components(separatedBy: "\n")
        let diff = b.difference(from: a).inferringMoves()
        let blank = { (s: String) in s.trimmingCharacters(in: .whitespaces).isEmpty }
        var removed = Set<Int>(), inserted = Set<Int>(), written = Set<Int>(), real = Set<Int>()
        for change in diff {
            switch change {
            case .remove(let o, let line, let moved):
                removed.insert(o)
                if moved == nil, !blank(line) { real.insert(o) }
            case .insert(let o, let line, _):
                inserted.insert(o)
                if !blank(line) { written.insert(o) }
            }
        }
        guard !real.isEmpty else { return [] }
        // Walk both texts together: the kept lines line up in order.
        var gaps = Set<Int>()
        var i = 0, j = 0
        while i < a.count || j < b.count {
            if i < a.count, removed.contains(i), j < b.count, inserted.contains(j), Self.shareAWord(a[i], b[j]) {
                // This line rewritten in place (a tick, a word changed): the two pair up.
                i += 1; j += 1
            } else if i < a.count, removed.contains(i) {
                // Nothing written at this spot: a removal, not a rewrite.
                // A line written there counts as this one rewritten only if they share a word
                // (council r3: Bread gone and Saffron added in its place showed no removal).
                func rewrite(_ k: Int) -> Bool { k >= 0 && k < b.count && written.contains(k) && Self.shareAWord(a[i], b[k]) }
                if real.contains(i), !rewrite(j), !rewrite(j - 1) { gaps.insert(j) }
                i += 1
            } else if j < b.count, inserted.contains(j) { j += 1 }
            else { i += 1; j += 1 }
        }
        var starts: [Int] = [], at = 0
        for (k, line) in b.enumerated() {
            starts.append(at)
            at += (line as NSString).length + (k < b.count - 1 ? 1 : 0)
        }
        func paragraph(_ k: Int) -> NSRange { NSRange(location: starts[k], length: (k + 1 < starts.count ? starts[k + 1] : at) - starts[k]) }
        var seen = Set<Int>()
        return gaps.sorted().compactMap { g in
            // Over the next line with text, not a blank one between paragraphs.
            if let k = (g..<b.count).first(where: { !blank(b[$0]) }) {
                return seen.insert(k).inserted ? Removal(paragraph: paragraph(k), below: false) : nil
            }
            // The end went: under the last line with text.
            guard let k = b.lastIndex(where: { !blank($0) }), seen.insert(-1 - k).inserted else { return nil }
            return Removal(paragraph: paragraph(k), below: true)
        }
    }

    /// Which line of `old` each rewritten line of `new` took the place of (new index to old), by
    /// walking the two texts together: a line taken out where one went in is the line it replaced.
    static func replaced(from a: [String], to b: [String]) -> [Int: Int] {
        let diff = b.difference(from: a).inferringMoves()
        var removed = Set<Int>(), inserted = Set<Int>()
        for change in diff {
            switch change {
            case .remove(let o, _, let moved): if moved == nil { removed.insert(o) }
            case .insert(let o, _, let moved): if moved == nil { inserted.insert(o) }
            }
        }
        var out: [Int: Int] = [:]
        var i = 0, j = 0
        while i < a.count || j < b.count {
            let r = i < a.count && removed.contains(i), n = j < b.count && inserted.contains(j)
            if r && n { out[j] = i; i += 1; j += 1 }
            else if r { i += 1 }
            else if n { j += 1 }
            else { i += 1; j += 1 }
        }
        return out
    }

    /// Words, runs of spaces, and runs of anything else, with their UTF-16 ranges.
    static func tokens(_ s: String) -> [(String, NSRange)] {
        let ns = s as NSString
        let re = try! NSRegularExpression(pattern: "[\\p{L}\\p{N}_'’]+|\\s+|[^\\p{L}\\p{N}\\s]+")
        return re.matches(in: s, range: NSRange(location: 0, length: ns.length)).map { (ns.substring(with: $0.range), $0.range) }
    }

    /// Inside a line rewritten from `old` to `new`, the ranges of `new` that are new: whole
    /// words, neighbours joined across a space, nothing past the list marker. Empty when the
    /// change is only the marker (a tick) or only words taken out; the whole line when none of
    /// its words were kept.
    static func newWords(from old: String, to new: String) -> [NSRange] {
        let a = tokens(old), b = tokens(new)
        let marker = ListPrefix(line: new).map(\.length) ?? 0
        var inserted = Set<Int>()
        for change in b.map(\.0).difference(from: a.map(\.0)) {
            if case .insert(let o, _, _) = change { inserted.insert(o) }
        }
        var out: [NSRange] = []
        var k = 0
        while k < b.count {
            guard inserted.contains(k) else { k += 1; continue }
            var end = k
            // Join across a single space or punctuation to the next new word.
            while end + 1 < b.count, inserted.contains(end + 1) || (end + 2 < b.count && inserted.contains(end + 2)
                    && b[end + 1].0.trimmingCharacters(in: .whitespaces).isEmpty) { end += 1 }
            var lo = b[k].1.location, hi = NSMaxRange(b[end].1)
            lo = max(lo, marker)
            // No spaces at either end, and no stray punctuation leading into the words.
            let ns = new as NSString
            let lead = CharacterSet.whitespaces.union(CharacterSet(charactersIn: ",.;:"))
            // A change only inside the list marker (a tick) leaves nothing here.
            guard hi > lo else { k = end + 1; continue }
            if ns.substring(with: NSRange(location: lo, length: hi - lo)).rangeOfCharacter(from: .alphanumerics) != nil {
                while lo < hi, lead.contains(UnicodeScalar(ns.character(at: lo)) ?? " ") { lo += 1 }
            }
            while lo < hi, CharacterSet.whitespaces.contains(UnicodeScalar(ns.character(at: lo)) ?? " ") { lo += 1 }
            while hi > lo, CharacterSet.whitespaces.contains(UnicodeScalar(ns.character(at: hi - 1)) ?? " ") { hi -= 1 }
            if hi > lo { out.append(NSRange(location: lo, length: hi - lo)) }
            k = end + 1
        }
        // Every word new: the line whole. Otherwise only the new words, so a sentence added to a
        // kept one leaves the kept words plain.
        let keptWord = b.indices.contains { !inserted.contains($0) && b[$0].1.location >= marker
            && b[$0].0.rangeOfCharacter(from: .alphanumerics) != nil }
        if !out.isEmpty, !keptWord { return [NSRange(location: marker, length: (new as NSString).length - marker)] }
        return out
    }

    /// The words to mark in `new`, as ranges of it: in a rewritten line what's new in it, a new
    /// line whole (from after its list marker), a tick or a line with words only taken out whole.
    static func changedWords(from old: String, to new: String) -> [NSRange] {
        let a = old.components(separatedBy: "\n"), b = new.components(separatedBy: "\n")
        let changed = Set(changedLines(from: old, to: new))
        let from = replaced(from: a, to: b)
        var out: [NSRange] = []
        var at = 0
        for (j, line) in b.enumerated() {
            let length = (line as NSString).length
            // A table is drawn as a grid over its lines: nothing of its text to mark.
            if changed.contains(j), !line.trimmingCharacters(in: .whitespaces).hasPrefix("|") {
                let marker = ListPrefix(line: line).map(\.length) ?? 0
                var words = from[j].map { newWords(from: a[$0], to: line) } ?? []
                if words.isEmpty { words = [NSRange(location: marker, length: length - marker)] }
                // A word's punctuation goes with it: no comma or full stop left out (council r3).
                let ns = line as NSString, stops = CharacterSet(charactersIn: ",.;:!?)\u{201D}\u{2019}\"'")
                words = words.map { w in
                    var end = NSMaxRange(w)
                    while end < ns.length, let u = Unicode.Scalar(ns.character(at: end)), stops.contains(u) { end += 1 }
                    // Only when the word with that punctuation is new (council r4: an old comma was marked).
                    let old = from[j].map { a[$0] } ?? ""
                    if end > NSMaxRange(w), old.contains(ns.substring(with: NSRange(location: w.location, length: end - w.location))) { return w }
                    return NSRange(location: w.location, length: end - w.location)
                }
                out += words.filter { $0.length > 0 }.map { NSRange(location: at + $0.location, length: $0.length) }
            }
            at += length + 1
        }
        return out
    }

    /// The paragraphs of `new` (as ranges in it, newline included) that `changedLines` finds.
    /// A table is drawn as one grid over its lines, so a change in any row tints the whole table.
    static func paragraphRanges(changedFrom old: String, to new: String) -> [NSRange] {
        var changed = Set(changedLines(from: old, to: new))
        guard !changed.isEmpty else { return [] }
        let lines = new.components(separatedBy: "\n")
        let isRow = { (i: Int) in lines.indices.contains(i) && lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("|") }
        for i in changed where isRow(i) {
            var a = i, b = i
            while isRow(a - 1) { a -= 1 }
            while isRow(b + 1) { b += 1 }
            changed.formUnion(a...b)
        }
        var out: [NSRange] = []
        var at = 0
        for (i, line) in lines.enumerated() {
            let length = (line as NSString).length + (i < lines.count - 1 ? 1 : 0)
            if changed.contains(i) { out.append(NSRange(location: at, length: length)) }
            at += length
        }
        return out
    }
}
