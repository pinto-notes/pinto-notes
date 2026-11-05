import Foundation

/// Search that forgives a typo (round 7 captures: "renovaton" found nothing in a library with a
/// "Kitchen renovation" note). Only when a search finds nothing as typed: then a note whose words
/// are each within a letter or two of what you typed is shown. Pure, so it's unit-tested
/// (TypoSearchTests); the list asks the store for candidates with `probes` first.
enum TypoSearch {
    /// How many letters a word may be off by: none for short words (they'd match everything),
    /// one from five letters, two from ten.
    static func allowed(_ word: String) -> Int {
        switch word.count {
        case ..<5: 0
        case ..<10: 1
        default: 2
        }
    }

    /// The query's words, folded as search folds them (case and accents).
    static func words(_ text: String) -> [String] {
        text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
    }

    /// Whether looking for close matches is worth it: some word long enough to forgive.
    static func applies(to query: String) -> Bool { words(query).contains { allowed($0) > 0 } }

    /// Pieces of the query's longest word that a close match must hold exactly: a word off by k
    /// letters still holds one of k + 1 pieces of it unchanged. The store finds the notes that
    /// hold a piece; `matches` then checks each of those few.
    static func probes(_ query: String) -> [String] {
        guard let word = words(query).max(by: { $0.count < $1.count }) else { return [] }
        let k = allowed(word)
        guard k > 0 else { return [] }
        let chars = Array(word), n = k + 1, size = chars.count / n
        return (0 ..< n).map { i in
            String(chars[i * size ..< (i == n - 1 ? chars.count : (i + 1) * size)])
        }.filter { $0.count >= 2 }
    }

    /// Every word of the query is in the text, exactly or within its allowance.
    static func matches(_ query: String, in text: String) -> Bool {
        let wanted = words(query)
        guard !wanted.isEmpty else { return false }
        let have = Set(words(text))
        return wanted.allSatisfy { w in
            let k = allowed(w)
            return have.contains { h in h.hasPrefix(w) || (k > 0 && abs(h.count - w.count) <= k && distance(w, h, limit: k) <= k) }
        }
    }

    /// Edit distance (insert, delete, replace), stopping early past `limit`.
    static func distance(_ a: String, _ b: String, limit: Int) -> Int {
        let a = Array(a), b = Array(b)
        if a.isEmpty { return b.count }
        if b.isEmpty { return a.count }
        var prev = Array(0 ... b.count), cur = [Int](repeating: 0, count: b.count + 1)
        for i in 1 ... a.count {
            cur[0] = i
            var best = cur[0]
            for j in 1 ... b.count {
                cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1))
                best = min(best, cur[j])
            }
            if best > limit { return best }
            swap(&prev, &cur)
        }
        return prev[b.count]
    }
}
