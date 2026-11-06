import Foundation

/// Undo in a note you share: it undoes your own edits, never someone else's (as in Notes).
///
/// Each step is what you typed (or deleted) and where it is now. Everyone's edits move the steps:
/// text added or removed before a step shifts it; a step someone else changed (they typed inside
/// what you typed, or deleted it) can't be undone cleanly, so it's dropped rather than guessed.
/// Typing in a row is one step, as the system's undo groups it; Backspace at the end of what you
/// just typed takes from that step.
final class OwnUndo {
    struct Step: Equatable {
        /// Where your text is now (UTF-16).
        var at: NSRange
        /// What it replaced.
        var old: String
        /// What you put there.
        var new: String
        var time: Date
    }

    private(set) var undos: [Step] = []
    private(set) var redos: [Step] = []
    /// Typing within this long of the last keystroke joins its step.
    var groupWithin: TimeInterval = 1.5
    var now: () -> Date = { Date() }

    var canUndo: Bool { !undos.isEmpty }
    var canRedo: Bool { !redos.isEmpty }

    /// One of your edits, made to `before`.
    func record(_ edit: TextDiff.Edit, in before: String) {
        redos = []
        let new = edit.replacement
        let newLength = (new as NSString).length
        let t = now()
        if var last = undos.last, t.timeIntervalSince(last.time) < groupWithin {
            // More typing right after what you just typed (a new line starts a new step).
            if edit.range.length == 0, edit.range.location == NSMaxRange(last.at), !new.contains("\n"), !last.new.contains("\n") {
                last.at.length += newLength
                last.new += new
                last.time = t
                undos[undos.count - 1] = last
                return
            }
            // Backspace at the end of what you just typed takes from it.
            if newLength == 0, edit.range.length > 0, NSMaxRange(edit.range) == NSMaxRange(last.at), edit.range.location >= last.at.location {
                last.at.length -= edit.range.length
                last.new = (last.new as NSString).substring(to: last.at.length)
                last.time = t
                undos[undos.count - 1] = last
                if last.at.length == 0, last.old.isEmpty { undos.removeLast() }
                return
            }
        }
        let b = before as NSString
        let old = NSMaxRange(edit.range) <= b.length ? b.substring(with: edit.range) : ""
        move(&undos, through: edit)
        undos.append(Step(at: NSRange(location: edit.range.location, length: newLength), old: old, new: new, time: t))
    }

    /// You and someone else replaced the same words while apart. A merge keeps both, run together
    /// ("sandwichespizza"), so the note says so and asks which to keep (SharedClashCard).
    struct Clash: Equatable {
        /// What you both replaced, what you wrote, what they wrote, and the merged text as it stands.
        let replaced: String, mine: String, theirs: String, merged: String
    }

    /// `edit`, someone else's, is that: only new words (their taking out the old ones already
    /// happened here too), up against words you put in place of others. The text alone can't tell
    /// this from them typing on after your word, so a space first, a lone character or punctuation
    /// don't count: those read as adding, not as words run together.
    func clash(with edit: TextDiff.Edit) -> Clash? {
        guard edit.range.length == 0, (edit.replacement as NSString).length >= 2,
              let first = undos.lastIndex(where: { !$0.old.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !$0.new.isEmpty }) else { return nil }
        // What you wrote there: typing after a pause is a step of its own.
        var mine = undos[first].new, end = NSMaxRange(undos[first].at)
        for step in undos[(first + 1)...] where step.old.isEmpty && step.at.location == end {
            mine += step.new
            end = NSMaxRange(step.at)
        }
        let start = undos[first].at.location, at = edit.range.location
        guard at >= start, at <= end else { return nil }
        // A diff can start the insert a few letters in, where the two begin alike ("pastapizza").
        let merged = (mine as NSString).replacingCharacters(in: NSRange(location: at - start, length: 0), with: edit.replacement)
        let theirs: String
        if merged.hasPrefix(mine) { theirs = String(merged.dropFirst(mine.count)) }
        else if merged.hasSuffix(mine) { theirs = String(merged.dropLast(mine.count)) }
        else { return nil }
        guard let a = theirs.first, let z = theirs.last, a.isLetter || a.isNumber, z.isLetter || z.isNumber else { return nil }
        return Clash(replaced: undos[first].old, mine: mine, theirs: theirs, merged: merged)
    }

    /// Someone else's edit: your steps move with it, and a step it changed is dropped.
    func transform(through edit: TextDiff.Edit) {
        move(&undos, through: edit)
        move(&redos, through: edit)
    }

    /// The edit that undoes your last step in `text`, or nil when there's nothing of yours to undo.
    func undo(in text: String) -> TextDiff.Edit? {
        while let step = undos.popLast() {
            guard let edit = Self.reverse(step, in: text) else { continue }
            move(&undos, through: edit)
            move(&redos, through: edit)
            redos.append(Step(at: NSRange(location: step.at.location, length: (step.old as NSString).length), old: step.new, new: step.old, time: step.time))
            return edit
        }
        return nil
    }

    func redo(in text: String) -> TextDiff.Edit? {
        while let step = redos.popLast() {
            guard let edit = Self.reverse(step, in: text) else { continue }
            move(&undos, through: edit)
            move(&redos, through: edit)
            undos.append(Step(at: NSRange(location: step.at.location, length: (step.old as NSString).length), old: step.new, new: step.old, time: .distantPast))
            return edit
        }
        return nil
    }

    func clear() {
        undos = []
        redos = []
    }

    /// Puts back what a step replaced, if the text there is still what the step put there.
    private static func reverse(_ step: Step, in text: String) -> TextDiff.Edit? {
        let t = text as NSString
        guard NSMaxRange(step.at) <= t.length, t.substring(with: step.at) == step.new else { return nil }
        return TextDiff.Edit(range: step.at, replacement: step.old)
    }

    /// Moves steps through an edit: wholly before a step it shifts it (an insertion right at its
    /// start counts as before), wholly after leaves it, and one it touches goes.
    private func move(_ steps: inout [Step], through edit: TextDiff.Edit) {
        let delta = (edit.replacement as NSString).length - edit.range.length
        let start = edit.range.location, end = NSMaxRange(edit.range)
        steps = steps.compactMap { s in
            var s = s
            if end <= s.at.location {
                s.at.location += delta
                return s
            }
            return start >= NSMaxRange(s.at) ? s : nil
        }
    }
}
