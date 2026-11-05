import CoreGraphics
import Foundation

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
    @MainActor func play(from previous: String, to text: String, hold: Double = 2.6, untilCleared: Bool = false) {
        stop()
        ranges = Self.paragraphRanges(changedFrom: previous, to: text)
        removals = Self.removals(from: previous, to: text)
        guard !ranges.isEmpty || !removals.isEmpty else { return }
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
        guard strength > 0 || !drawn.isEmpty else { return }
        // Redraw while the lines are still known, so their old tint is painted over.
        strength = 0
        redraw(drawn)
        ranges = []
        removals = []
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
