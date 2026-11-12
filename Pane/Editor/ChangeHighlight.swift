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
    static func sweepStagger(_ count: Int) -> Double { count > 1 ? min(0.05, 0.22 / Double(count - 1)) : 0 }

    /// How far the sweep is through the changed paragraph starting at `offset`: 0 nothing yet,
    /// 1 drawn whole.
    func sweep(at offset: Int) -> CGFloat {
        guard let elapsed = sweepElapsed else { return 1 }
        let order = ranges.sorted { $0.location < $1.location }
        guard let k = order.firstIndex(where: { $0.location == offset }) else { return 1 }
        let t = (elapsed - Double(k) * Self.sweepStagger(order.count)) / Self.sweepDuration
        let p = min(1, max(0, t))
        return CGFloat(1 - pow(1 - p, 3))
    }

    /// The marked words in the paragraph `paragraph`, counted from its start.
    func marks(in paragraph: NSRange) -> [NSRange] {
        marks.compactMap { m in
            let i = NSIntersectionRange(m, paragraph)
            return i.length > 0 ? NSRange(location: i.location - paragraph.location, length: i.length) : nil
        }
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
        return ranges.contains { NSLocationInRange(offset, $0) } ? strength : 0
    }

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
        stop()
        self.color = color
        ranges = Self.paragraphRanges(changedFrom: previous, to: text)
        removals = Self.removals(from: previous, to: text)
        marks = Self.changedWords(from: previous, to: text)
        guard !ranges.isEmpty || !removals.isEmpty else { return }
        if !Self.reduceMotion { startSweep() }
        light(hold: hold, untilCleared: untilCleared)
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
            guard await animate(to: 1.5, over: 0.3, easeOut, run: mine, lit: lit),
                  await animate(to: 1, over: 0.5, easeInOut, run: mine, lit: lit) else { return }
            if untilCleared { return }
            try? await Task.sleep(for: .seconds(hold * Self.slowMotion))
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

    /// Clears at once (you started typing, or undid the edit).
    @MainActor func stop() {
        run += 1
        sweepElapsed = nil
        guard strength > 0 || !drawn.isEmpty else { return }
        // Redraw while the lines are still known, so their old tint is painted over.
        strength = 0
        redraw(drawn)
        ranges = []
        removals = []
        marks = []
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
            if i < a.count, removed.contains(i) {
                // Nothing written at this spot: a removal, not a rewrite.
                if real.contains(i), !written.contains(j), !(j > 0 && written.contains(j - 1)) { gaps.insert(j) }
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
    /// change is only the marker (a tick) or only words taken out; the whole line when most of
    /// it is new, which reads better than a patchwork.
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
            // No spaces at either end.
            let ns = new as NSString
            while lo < hi, CharacterSet.whitespaces.contains(UnicodeScalar(ns.character(at: lo)) ?? " ") { lo += 1 }
            while hi > lo, CharacterSet.whitespaces.contains(UnicodeScalar(ns.character(at: hi - 1)) ?? " ") { hi -= 1 }
            if hi > lo { out.append(NSRange(location: lo, length: hi - lo)) }
            k = end + 1
        }
        let visible = max(1, (new as NSString).length - marker)
        let marked = out.reduce(0) { $0 + $1.length }
        if Double(marked) / Double(visible) > 0.6 { return [NSRange(location: marker, length: (new as NSString).length - marker)] }
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
