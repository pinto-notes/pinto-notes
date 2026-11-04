import Foundation

/// Review an AI's edit part by part (persona council, 4 November 2026: Jonas, Maya, Marcus). The
/// receipt "Claude changed 5 lines · Undo" gains Review: each changed part of the note in order,
/// what was there struck through above what the AI wrote, with Keep and Undo for each, and Keep
/// All and Undo All.
///
/// The edit already happened, so nothing waits for approval: Keep leaves a part as it is, and Undo
/// puts that part alone back the way it was, leaving the others and anything you typed since. A
/// part you've changed since can't be undone without losing your typing: it says so and stays.
/// Pure, so it is unit-tested (AIReviewTests).
struct AIReview: Equatable {
    enum Decision: Equatable { case kept, undone }

    struct Part: Equatable, Identifiable {
        let id: Int
        /// The lines that were there, and the lines the AI wrote in their place (either can be empty).
        let removed: [String]
        let added: [String]
        /// Where its lines start in `expected` (0-based line number).
        var at: Int
        var decision: Decision?
        /// Undo was refused because you changed this part since.
        var conflict = false
    }

    /// A run of changed lines between two texts: `oldCount` lines at `oldStart` became `newCount` at `newStart`.
    struct Hunk: Equatable {
        var oldStart: Int, oldCount: Int, newStart: Int, newCount: Int
    }

    enum Failure: Error, Equatable, LocalizedError {
        /// You changed the part's lines (or right inside them) since the AI's edit.
        case changedSince
        var errorDescription: String? { AIReview.conflictLine }
    }

    let by: String
    let previous: String
    private(set) var parts: [Part]
    /// The note as the review leaves it, without anything you typed: the AI's text, less the parts undone.
    private(set) var expected: [String]
    /// The part the keys act on.
    var focus = 0

    init(by: String, previous: String, after: String) {
        self.by = by
        self.previous = previous
        let a = Self.lines(previous), b = Self.lines(after)
        expected = b
        parts = Self.hunks(from: a, to: b).enumerated().compactMap { i, h in
            let removed = Array(a[h.oldStart ..< h.oldStart + h.oldCount]), added = Array(b[h.newStart ..< h.newStart + h.newCount])
            // Only blank lines moved about: not a part to decide on (it stays as the AI left it).
            guard !(removed + added).allSatisfy({ $0.trimmingCharacters(in: .whitespaces).isEmpty }) else { return nil }
            return Part(id: i, removed: removed, added: added, at: h.newStart)
        }
        parts = parts.enumerated().map { i, p in Part(id: i, removed: p.removed, added: p.added, at: p.at) }
    }

    /// From a receipt: an edit of the note's text, not a note the AI wrote (Undo removes that one).
    init?(_ r: AIEdit.Receipt) {
        guard r.kind == .edit, !r.created, let after = r.after else { return nil }
        self.init(by: r.by, previous: r.previous, after: after)
        if parts.isEmpty { return nil }
    }

    static func lines(_ text: String) -> [String] { text.components(separatedBy: "\n") }

    /// The runs of lines that differ between `a` and `b`, in order (a line diff; a moved line is
    /// taken out where it was and put in where it went).
    static func hunks(from a: [String], to b: [String]) -> [Hunk] {
        let diff = b.difference(from: a)
        var removed = Set<Int>(), inserted = Set<Int>()
        for change in diff {
            switch change {
            case .remove(let offset, _, _): removed.insert(offset)
            case .insert(let offset, _, _): inserted.insert(offset)
            }
        }
        var out: [Hunk] = []
        var i = 0, j = 0
        while i < a.count || j < b.count {
            if i < a.count, j < b.count, !removed.contains(i), !inserted.contains(j) { i += 1; j += 1; continue }
            let si = i, sj = j
            while (i < a.count && removed.contains(i)) || (j < b.count && inserted.contains(j)) {
                while i < a.count, removed.contains(i) { i += 1 }
                while j < b.count, inserted.contains(j) { j += 1 }
            }
            // A valid difference leaves the rest lined up; guard against looping if it didn't.
            if i == si, j == sj { i += 1; j += 1; continue }
            out.append(Hunk(oldStart: si, oldCount: i - si, newStart: sj, newCount: j - sj))
        }
        return out
    }

    // MARK: What it says

    var undecided: [Part] { parts.filter { $0.decision == nil } }
    var isFinished: Bool { !parts.isEmpty && undecided.isEmpty }
    var kept: Int { parts.filter { $0.decision == .kept }.count }
    var undone: Int { parts.filter { $0.decision == .undone }.count }

    /// The bar's title: "Claude changed 3 parts".
    var title: String { "\(by) changed \(parts.count == 1 ? "1 part" : "\(parts.count) parts")" }
    /// "1 of 3", for the part the keys act on.
    var position: String { "\(min(focus, parts.count - 1) + 1) of \(parts.count)" }
    /// Parts you didn't decide on, that stay as the AI wrote them. A part whose Undo was refused
    /// isn't one: it stays as you changed it, and the card said so.
    var left: Int { parts.filter { $0.decision == nil && !$0.conflict }.count }

    /// At the end, for a moment where the receipt was: "Kept 2, undid 1". Done with parts not
    /// decided says so: "Undid 1 · 2 parts left as Claude wrote them" (round 1 of the councils:
    /// Done kept them without a word). A part you changed since counts as kept: it stays.
    var result: String {
        let k = parts.filter { $0.decision == .kept || ($0.decision == nil && $0.conflict) }.count, u = undone, n = left
        let decided: String? = switch (k, u) {
        case (0, 0): nil
        case (_, 0): "Kept \(k)"
        case (0, _): "Undid \(u)"
        default: "Kept \(k), undid \(u)"
        }
        guard n > 0 else { return decided ?? "Kept 0" }
        let rest = n == 1 ? "1 part left as \(by) wrote it" : "\(n) parts left as \(by) wrote them"
        return decided.map { "\($0) \u{00B7} \(rest)" } ?? rest
    }

    static let conflictLine = "You changed this part since, so it can\u{2019}t be undone without losing that. It stays."
    static let keys = "\u{2191}\u{2193} to move, Return to keep, \u{232B} to undo"

    // MARK: Deciding

    mutating func keep(_ id: Int) {
        guard let i = parts.firstIndex(where: { $0.id == id }), parts[i].decision == nil else { return }
        parts[i].decision = .kept
        parts[i].conflict = false
        moveOn(from: i)
    }

    /// Undoes one part in `body` (the note as it is now) and returns the new text. Your typing
    /// elsewhere stays; typing in or right inside the part refuses (`Failure.changedSince`).
    mutating func undo(_ id: Int, in body: String) throws -> String {
        guard let i = parts.firstIndex(where: { $0.id == id }), parts[i].decision == nil else { return body }
        let p = parts[i]
        let range = p.at ..< p.at + p.added.count
        let mine = Self.lines(body)
        var out: [String]
        if mine == expected {
            out = mine
            out.replaceSubrange(range, with: p.removed)
        } else {
            // Where the part is now, past what you typed above it; refused if your typing is in it
            // (or, for a part that only took lines out, right where they were).
            var shift = 0
            let (lo, hi) = (range.lowerBound, range.upperBound)
            for h in Self.hunks(from: expected, to: mine) {
                let (s, e) = (h.oldStart, h.oldStart + h.oldCount)
                let touches = range.isEmpty
                    ? (s < lo && lo < e) || (h.oldCount == 0 && s == lo)
                    : (s < hi && lo < e) || (h.oldCount == 0 && lo < s && s < hi)
                if touches {
                    parts[i].conflict = true
                    throw Failure.changedSince
                }
                if e <= lo { shift += h.newCount - h.oldCount }
            }
            let at = range.lowerBound + shift
            guard at >= 0, at + p.added.count <= mine.count, Array(mine[at ..< at + p.added.count]) == p.added else {
                parts[i].conflict = true
                throw Failure.changedSince
            }
            out = mine
            out.replaceSubrange(at ..< at + p.added.count, with: p.removed)
        }
        // The text without your typing, less this part; the parts below it move by the difference.
        expected.replaceSubrange(range, with: p.removed)
        let delta = p.removed.count - p.added.count
        for k in parts.indices where k > i { parts[k].at += delta }
        parts[i].decision = .undone
        parts[i].conflict = false
        moveOn(from: i)
        return out.joined(separator: "\n")
    }

    mutating func keepAll() {
        for i in parts.indices where parts[i].decision == nil {
            parts[i].decision = .kept
            parts[i].conflict = false
        }
    }

    /// Undoes every part not yet decided, last first. Returns the new text and how many parts
    /// couldn't be undone because you changed them since (those stay undecided).
    mutating func undoAll(in body: String) -> (text: String, refused: Int) {
        var text = body, refused = 0
        for p in undecided.reversed() {
            do { text = try undo(p.id, in: text) } catch { refused += 1 }
        }
        return (text, refused)
    }

    // MARK: In the note

    /// Undoes one part in the note itself, past any typing not saved yet. False when you changed
    /// the part since (it's marked, and the note is left alone).
    @MainActor @discardableResult
    mutating func undo(_ id: Int, on note: Note) -> Bool {
        DebouncedSave.flushAll()
        guard let text = try? undo(id, in: note.body) else { return false }
        Self.write(text, to: note)
        return true
    }

    /// Undoes every part left in the note; returns how many were refused.
    @MainActor @discardableResult
    mutating func undoAll(on note: Note) -> Int {
        DebouncedSave.flushAll()
        let (text, refused) = undoAll(in: note.body)
        Self.write(text, to: note)
        return refused
    }

    /// The note takes the text as any change of yours: saved, then synced.
    @MainActor private static func write(_ text: String, to note: Note) {
        guard text != note.body else { return }
        note.body = text
        note.touch()
    }

    /// The part the keys act on moves to the next undecided one after `i`, or before it.
    private mutating func moveOn(from i: Int) {
        if let next = parts.indices.first(where: { $0 > i && parts[$0].decision == nil }) ?? parts.indices.first(where: { parts[$0].decision == nil }) {
            focus = next
        }
    }

    mutating func move(_ by: Int) {
        guard !parts.isEmpty else { return }
        focus = min(max(0, focus + by), parts.count - 1)
    }

    /// Where the part starts in `body` (UTF-16 offset), to scroll the note to it; nil when it can't be found.
    func location(of id: Int, in body: String) -> Int? {
        guard let p = parts.first(where: { $0.id == id }) else { return nil }
        let mine = Self.lines(body)
        var line = p.at
        if mine != expected {
            for h in Self.hunks(from: expected, to: mine) where h.oldStart + h.oldCount <= p.at { line += h.newCount - h.oldCount }
        }
        guard line >= 0, line <= mine.count else { return nil }
        return mine.prefix(line).reduce(0) { $0 + ($1 as NSString).length + 1 }
    }
}
