import SwiftData
#if os(macOS)
import SwiftUI

/// Plain words in the templates library's Search: what's typed is
/// matched here, on this Mac, against each template's name, its lines and the words people say for
/// it (the catalog's `fits`, web/content/template-words.json). No network and no AI call. What was
/// typed then goes into what the AI is asked, and when no template matches, into a new note the
/// AI shapes. The matching and the asks are the ask-first direction's (leap/askfirst c5194053,
/// `AskFirst`), without its question, phrases and page.
nonisolated enum TemplateAsk {
    typealias Entry = TemplateCatalog.Entry

    // MARK: Matching

    /// Words that say nothing about which template: they're left out of the match.
    static let stop: Set<String> = [
        "a", "an", "the", "my", "our", "i", "we", "me", "to", "of", "for", "and", "or", "in", "on", "at", "with", "what", "how", "do", "does",
        "want", "need", "keep", "track", "tracking", "some", "it", "is", "are", "this", "that", "all", "new", "about", "when", "where", "which",
        "would", "like", "get", "have", "im", "id", "going", "every",
    ]

    /// What was typed, as plain lowercase words.
    static func tokens(_ s: String) -> [String] {
        s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil).lowercased()
            .replacingOccurrences(of: "\u{2019}", with: "").replacingOccurrences(of: "'", with: "")
            .components(separatedBy: CharacterSet.alphanumerics.inverted).filter { !$0.isEmpty }
    }

    /// How well a typed word matches one of a template's: the same word; the start of it (what's
    /// still being typed narrows by its start, from the first letter); or a longer form of it
    /// ("trips" for "trip"). A number matches only itself, and so does a typed word that is
    /// `whole`, one the templates know as it stands: "work" is work, never the start of "workout".
    static func strength(_ token: String, _ word: String, last: Bool, whole: Bool = false) -> Double {
        if token == word { return 1 }
        if token.allSatisfy(\.isNumber) { return 0 }
        if !whole, word.hasPrefix(token), token.count >= (last ? 1 : 3) { return token.count >= 3 ? 0.8 : 0.5 }
        if token.hasPrefix(word), word.count >= 4, token.count - word.count <= 3 { return 0.8 }
        return 0
    }

    /// A template as an answer to what was typed: why it fits, in a line, and how well.
    struct Answer: Identifiable, Equatable, Sendable {
        let entry: Entry
        let why: String
        let score: Double
        var id: String { entry.slug }
    }

    /// The templates that answer `query`, best first; in the catalog's order between equals.
    /// A name's word counts most, then the words people say for it, then its lines; answers that
    /// match far less well than the best are left out, and with nothing typed there are none.
    static func answers(_ query: String, in entries: [Entry]) -> [Answer] {
        let all = tokens(query)
        let typed = all.enumerated().filter { !stop.contains($0.element) }
        // Only stop words so far ("my", "a"): still typing, nothing to match yet.
        guard !typed.isEmpty else { return [] }
        let plain = " " + all.joined(separator: " ") + " "
        // Every word the templates know: one of them typed is that word, not the start of another.
        let known = Set(entries.flatMap { tokens($0.title) + ($0.fits ?? []).flatMap(\.words) })
        var out: [(Answer, Int)] = []
        for (index, e) in entries.enumerated() {
            let name = tokens(e.title)
            let lines = Set(tokens(e.tagline) + tokens(e.shownDescription)).filter { $0.count >= 4 }
            var total = 0.0, strong = false
            var whys: [String: Double] = [:]
            for (i, token) in typed {
                let last = i == all.count - 1, whole = known.contains(token)
                var best = name.map { strength(token, $0, last: last, whole: whole) * 6 }.max() ?? 0
                var why: String?
                for fit in e.fits ?? [] {
                    let s = (fit.words.filter { !$0.contains(" ") }.map { strength(token, $0, last: last, whole: whole) }.max() ?? 0) * 5 * (fit.weight ?? 1)
                    if s > best { best = s; why = fit.why }
                }
                if best > 0 { strong = true } else if token.count >= 4, lines.contains(where: { $0 == token || $0.hasPrefix(token) }) { best = 1 }
                total += best
                if let why { whys[why, default: 0] += best }
            }
            // Words that go together ("new york", "one on one"), whole.
            for fit in e.fits ?? [] {
                for phrase in fit.words where phrase.contains(" ") && plain.contains(" \(phrase) ") {
                    let s = 5 * (fit.weight ?? 1)
                    total += s
                    strong = true
                    whys[fit.why, default: 0] += s
                }
            }
            guard total > 0 else { continue }
            let why = whys.max { $0.value < $1.value }?.key ?? e.fits?.first?.why ?? e.tagline
            out.append((Answer(entry: e, why: why, score: strong ? total : total / 10), index))
        }
        let best = out.map(\.0.score).max() ?? 0
        return out.filter { $0.0.score >= best * 0.4 }
            .sorted { $0.0.score != $1.0.score ? $0.0.score > $1.0.score : $0.1 < $1.1 }
            .map(\.0)
    }

    // MARK: The ask

    /// What was typed, ready to go into a sentence: one line, no quotation marks of its own, no
    /// full stop, and no longer than fits a line.
    static func cleaned(_ s: String) -> String {
        var t = s.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
        for mark in ["\u{201C}", "\u{201D}", "\""] { t = t.replacingOccurrences(of: mark, with: "") }
        while let last = t.last, ".?!,;:".contains(last) { t.removeLast() }
        return String(t.prefix(60)).trimmingCharacters(in: .whitespaces)
    }

    /// The words a query adds to a template's ask: what was typed, unless it only names the
    /// template ("habits" for Habit tracker, "reading" for Reading list), which adds nothing.
    static func carried(_ query: String, for e: Entry) -> String {
        let clean = cleaned(query)
        guard !clean.isEmpty, e.tailor != nil else { return "" }
        let own = tokens(e.title)
        let adds = tokens(clean).filter { t in !stop.contains(t) && !own.contains { strength(t, $0, last: false) > 0 || strength($0, t, last: false) > 0 } }
        return adds.isEmpty ? "" : clean
    }

    /// What the AI is asked, in three parts so the person's words can be shown as theirs. With
    /// no words it's the template's own ask, as the shipped library sends it. With words:
    /// "In Pinto Notes, use my Workout log note. Set it up for “my running”. Ask what I train and
    /// how often, then set the log up for that." What's shown is what's sent, whole.
    struct Ask: Equatable, Sendable {
        let lead: String
        let words: String?
        let rest: String
        var text: String { lead + (words ?? "") + rest }
    }

    static func ask(_ e: Entry, words: String) -> Ask {
        let w = cleaned(words)
        guard !w.isEmpty, let tailor = e.tailor else { return Ask(lead: SetupCards.prompt(e.pick), words: nil, rest: "") }
        return Ask(lead: "In Pinto Notes, use my \(e.title) note. Set it up for \u{201C}", words: w, rest: "\u{201D}. \(tailor)")
    }

    // MARK: No template matches

    /// The results when nothing matches: what was typed, and that there's none for it yet.
    static func none(_ query: String) -> String { "No template for \u{201C}\(cleaned(query))\u{201D} yet." }
    /// Under it: the way on. With an AI that opens with the ask, it shapes the note with you.
    static func blankLine(_ ai: SetupCards.AI) -> String {
        ai.asks ? "Start a note and \(ai.name) shapes it with you." : "Start a note for it. Connect an AI and it can shape the note with you."
    }
    /// Under matches, the same way on, as one quiet row.
    static func blankRow(_ query: String) -> String { "A new note for \u{201C}\(cleaned(query))\u{201D}" }
    static func blankRowLine(_ ai: SetupCards.AI) -> String {
        ai.asks ? "None of these? Start one with \(ai.name)." : "None of these? Start an empty note."
    }
    static func blankButton(_ ai: SetupCards.AI, online: Bool = true) -> String { ai.asks && online ? "Make the note" : "Add the note" }
    static let blankMyself = "Just the empty note"
    static func blankCaption(_ ai: SetupCards.AI, folder: String, reach: SyncEngine.Reach = .online) -> (lead: String, folder: String, rest: String) {
        guard ai.asks else { return ("Adds an empty note to ", folder, ".") }
        return ("Adds an empty note to ", folder, reach == .online ? ", then opens \(ai.name)." : ". Ask \(ai.name) after it syncs.")
    }

    /// A new note's name from what was typed: their words, with a capital.
    static func blankTitle(_ query: String) -> String {
        let t = String(cleaned(query).prefix(60)).trimmingCharacters(in: .whitespaces)
        return t.prefix(1).uppercased() + t.dropFirst()
    }

    /// What the AI is asked about a new note made from the words.
    static func blankAsk(_ query: String) -> Ask {
        Ask(lead: "In Pinto Notes, use my new note \u{201C}", words: blankTitle(query),
            rest: "\u{201D}. Ask what I want to keep in it, then set it up with the headings, lists or table that fit.")
    }

    /// A new note named from the words, where New Note would put it; with an AI that opens with
    /// the ask, the ask goes on the clipboard and the AI opens with it (as Make does for a
    /// template; while sync is away it's only copied). Returns the note, to open.
    @MainActor static func makeBlank(_ query: String, with ai: SetupCards.AI, context: ModelContext, into: FolderChoice,
                                     reach: SyncEngine.Reach = .online, copy: (String) -> Void = ConnectClipboard.set, open: (URL) -> Void) -> UUID? {
        let title = blankTitle(query)
        guard !title.isEmpty else { return nil }
        let draft = NoteDraft(link: NoteSourceLink(kind: .template, slug: "blank"), title: title, body: title + "\n", leftOut: 0)
        let note = context.addNote(from: draft, to: into)
        SyncSignal.changed()
        if ai.asks {
            let prompt = blankAsk(query).text
            copy(prompt)
            if reach == .online, let page = TryIt.page(for: ai.name, prompt: prompt) { open(page) }
        }
        return note.id
    }
}
#endif
