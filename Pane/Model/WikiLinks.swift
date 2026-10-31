import Foundation
import SwiftData

/// Obsidian's wiki links, `[[Title]]`, `[[Folder/Title]]`, `[[Title|shown text]]` and
/// `[[Title#Heading]]`, kept in the note's markdown exactly as written and resolved by title when
/// they're shown or followed. The text stays readable, goes back to Obsidian unchanged, and an AI
/// links notes by writing the title it already knows. Links in code are left alone.
enum WikiLinks {
    struct Link: Equatable {
        /// The whole `[[…]]` (or `![[…]]` for an embed).
        var range: NSRange
        var embed: Bool
        /// The note part as written: "Projects/Kitchen remodel".
        var target: String
        var heading: String?
        var alias: String?
        /// Where `target` sits in the text.
        var targetRange: NSRange
        /// Where `#heading` sits, with its `#`.
        var headingRange: NSRange?
        /// Where the alias sits, after its `|`.
        var aliasRange: NSRange?

        /// The note's name, without the folders in front of it.
        var name: String { WikiLinks.name(of: target) }
        /// The folders written in front of the name ("Projects/Kitchen remodel" → ["Projects"]).
        var folders: [String] { WikiLinks.folders(of: target) }
    }

    private static let pattern = try! NSRegularExpression(pattern: #"(!?)\[\[([^\[\]\n]+?)\]\]"#)
    private static let inlineCode = try! NSRegularExpression(pattern: #"(`+)(?:(?!\1).)+?\1"#)

    /// Every wiki link in `text`, outside fenced code blocks and inline code.
    static func links(in text: String) -> [Link] {
        guard text.contains("[[") else { return [] }
        let ns = text as NSString
        var out: [Link] = []
        var fence: String?
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: .byLines) { s, line, _, _ in
            guard let s else { return }
            let trimmed = s.trimmingCharacters(in: .whitespaces)
            if let f = fence {
                if trimmed.hasPrefix(f) { fence = nil }
                return
            }
            if trimmed.hasPrefix("```") { fence = "```"; return }
            if trimmed.hasPrefix("~~~") { fence = "~~~"; return }
            guard s.contains("[[") else { return }
            let code = inlineCode.matches(in: text, range: line).map(\.range)
            for m in pattern.matches(in: text, range: line) {
                if code.contains(where: { NSLocationInRange(m.range.location, $0) }) { continue }
                if let link = parse(m, in: ns) { out.append(link) }
            }
        }
        return out
    }

    private static func parse(_ m: NSTextCheckingResult, in ns: NSString) -> Link? {
        let embed = m.range(at: 1).length > 0
        let inner = m.range(at: 2)
        let innerText = ns.substring(with: inner)
        var targetPart = NSRange(location: inner.location, length: inner.length)
        var aliasRange: NSRange?
        if let bar = innerText.firstIndex(of: "|") {
            let offset = innerText.utf16.distance(from: innerText.startIndex, to: bar)
            targetPart.length = offset
            aliasRange = NSRange(location: inner.location + offset + 1, length: inner.length - offset - 1)
        }
        let targetText = ns.substring(with: targetPart)
        var headingRange: NSRange?
        var nameRange = targetPart
        if let hash = targetText.firstIndex(of: "#") {
            let offset = targetText.utf16.distance(from: targetText.startIndex, to: hash)
            nameRange.length = offset
            headingRange = NSRange(location: targetPart.location + offset, length: targetPart.length - offset)
        }
        let target = ns.substring(with: nameRange).trimmingCharacters(in: .whitespaces)
        let heading = headingRange.map { ns.substring(with: $0).dropFirst().trimmingCharacters(in: .whitespaces) }
        let alias = aliasRange.map { ns.substring(with: $0).trimmingCharacters(in: .whitespaces) }
        // `[[#Heading]]` points inside this note; `[[ ]]` at nothing.
        guard !target.isEmpty else { return nil }
        return Link(range: m.range, embed: embed, target: target, heading: heading.flatMap { $0.isEmpty ? nil : $0 },
                    alias: alias.flatMap { $0.isEmpty ? nil : $0 }, targetRange: nameRange, headingRange: headingRange, aliasRange: aliasRange)
    }

    /// A link as markdown: `[[Title#Heading|shown]]`.
    static func markdown(target: String, heading: String? = nil, alias: String? = nil) -> String {
        var s = "[[" + target
        if let heading, !heading.isEmpty { s += "#" + heading }
        if let alias, !alias.isEmpty { s += "|" + alias }
        return s + "]]"
    }

    /// The last part of a link's target, without a `.md` ending.
    static func name(of target: String) -> String {
        let last = target.split(separator: "/", omittingEmptySubsequences: true).last.map(String.init) ?? target
        return stripExtension(last).trimmingCharacters(in: .whitespaces)
    }

    static func folders(of target: String) -> [String] {
        Array(target.split(separator: "/", omittingEmptySubsequences: true).dropLast().map { $0.trimmingCharacters(in: .whitespaces) })
    }

    static func stripExtension(_ s: String) -> String {
        let ext = (s as NSString).pathExtension.lowercased()
        return ["md", "markdown"].contains(ext) ? (s as NSString).deletingPathExtension : s
    }

    /// How titles are compared: case and spacing don't matter, nor markdown's backslash escapes
    /// (an imported title "a\_b" is the note "a_b").
    static func key(_ title: String) -> String {
        // Most titles escape nothing: no pattern to run then (the index keys every title on every save).
        let unescaped = title.contains("\\") ? title.replacingOccurrences(of: #"\\([!-/:-@\[-`{-~])"#, with: "$1", options: .regularExpression) : title
        return unescaped.split(whereSeparator: \.isWhitespace).joined(separator: " ").lowercased()
    }

    /// The text a link shows: its alias, else its name.
    static func display(_ link: Link) -> String { link.alias ?? link.name }

    /// `text` with every link that `pointsAt` picks retargeted to `newTitle`. Folders written in
    /// front of the name, the heading and the alias stay as they were.
    static func retarget(_ text: String, to newTitle: String, where pointsAt: (Link) -> Bool) -> String {
        let ns = text as NSString
        var out = text
        // From the end, so earlier ranges stay put.
        for link in links(in: text).reversed() where pointsAt(link) {
            let written = ns.substring(with: link.targetRange)
            let lead = written.prefix { $0 == " " }
            let prefix = link.folders.isEmpty ? "" : link.folders.joined(separator: "/") + "/"
            out = (out as NSString).replacingCharacters(in: link.targetRange, with: lead + prefix + newTitle)
        }
        return out
    }

    /// While a link is being typed: what's typed after `[[` up to the caret, when the caret is
    /// in an unfinished link on its line.
    static func typingQuery(in text: String, caret: Int) -> NSRange? {
        let ns = text as NSString
        guard caret >= 2, caret <= ns.length else { return nil }
        let line = ns.lineRange(for: NSRange(location: caret, length: 0))
        let start = max(line.location, caret - 80)
        let before = ns.substring(with: NSRange(location: start, length: caret - start))
        guard let open = before.range(of: "[[", options: .backwards) else { return nil }
        let typed = before[open.upperBound...]
        guard !typed.contains(where: { "[]|#\n".contains($0) }) else { return nil }
        let at = caret - typed.utf16.count
        return NSRange(location: at, length: caret - at)
    }

    /// A note's other names, from its front matter (`aliases:`, as Obsidian has them).
    static func aliases(inFrontMatter text: String?) -> [String] {
        guard let text, text.lowercased().contains("alias") else { return [] }
        let props = MarkdownNote.frontMatter(text.components(separatedBy: "\n"))
        var seen = Set<String>()
        return ((props["aliases"] ?? []) + (props["alias"] ?? []))
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && !$0.contains(where: { "[]|#\n".contains($0) }) && seen.insert(key($0)).inserted }
    }

    /// What a suggestion shows: a title, or for one of a note's aliases (`Title|Alias`, which is
    /// what it puts in the link) "Alias → Title".
    static func suggestionLabel(_ suggestion: String) -> String {
        guard let bar = suggestion.firstIndex(of: "|") else { return suggestion }
        return "\(suggestion[suggestion.index(after: bar)...]) \u{2192} \(suggestion[..<bar])"
    }

    /// Links read as plain text, for previews and summaries: `[[Page|Alias]]` → "Alias".
    static func plain(_ line: String) -> String {
        guard line.contains("[[") else { return line }
        var out = line
        for link in links(in: line).reversed() {
            out = (out as NSString).replacingCharacters(in: link.range, with: display(link))
        }
        return out
    }

    /// The heading in `body` a `#Heading` link names: where its line starts. Matched like titles
    /// (case and spacing aside), the first one wins.
    static func headingLocation(_ heading: String, in body: String) -> Int? {
        let want = key(heading)
        var location = 0
        for line in body.components(separatedBy: "\n") {
            if line.hasPrefix("#"), let m = line.range(of: #"^#{1,6}\s+"#, options: .regularExpression),
               key(String(line[m.upperBound...]).trimmingCharacters(in: CharacterSet(charactersIn: "# "))) == want {
                return location
            }
            location += (line as NSString).length + 1
        }
        return nil
    }
}

/// Links from a note's app to the person's notes and other apps: `<a href="pinto:Work/Acme">`,
/// `pinto:Acme#Agenda`, `pinto:Work/Habits.app`. What follows `pinto:` is what goes between
/// `[[` and `]]` in a note, and resolves the same way, by title. It can only ever name one of the
/// person's own notes: it is never an address, a file or a command.
enum AppLinks {
    static let scheme = "pinto"

    struct Link: Equatable {
        /// The note as written: "Work/Acme" (a `.app` ending names the note whose app it is).
        var target: String
        var heading: String?
    }

    /// The note an app's link names, or nil for anything that isn't a `pinto:` link to a note.
    static func parse(_ href: String) -> Link? {
        guard href.count <= 1000, href.lowercased().hasPrefix(scheme + ":") else { return nil }
        var rest = String(href.dropFirst(scheme.count + 1))
        while rest.hasPrefix("/") { rest.removeFirst() }
        rest = rest.removingPercentEncoding ?? rest
        // Only what a [[link]] could hold: no brackets, no new lines; an alias has no use here.
        guard !rest.contains(where: { $0 == "[" || $0 == "]" || $0.isNewline || $0.asciiValue.map { $0 < 0x20 } == true }) else { return nil }
        if let bar = rest.firstIndex(of: "|") { rest = String(rest[..<bar]) }
        guard let link = WikiLinks.links(in: "[[\(rest)]]").first else { return nil }
        var target = link.target
        while target.hasSuffix("/") { target.removeLast() }
        if target.lowercased().hasSuffix(".app") { target = String(target.dropLast(4)) }
        target = target.trimmingCharacters(in: .whitespaces)
        guard !target.isEmpty, WikiLinks.name(of: target).isEmpty == false else { return nil }
        return Link(target: target, heading: link.heading)
    }
}

/// Every note's title and folder, to resolve wiki links the way Obsidian does: by name, case
/// aside; folders written in front narrow it down; among notes with the same title the one
/// nearest the linking note wins (same folder, then the most folders in common, then the one
/// edited last).
struct WikiIndex {
    struct Entry: Equatable {
        var id: UUID
        var title: String
        /// Folder names from the top.
        var folders: [String]
        var updated: Date
        /// Its other names, from its front matter: `[[Alias]]` leads here too.
        var aliases: [String] = []
    }

    private(set) var entries: [Entry]
    private var byKey: [String: [Int]] = [:]
    private var byAlias: [String: [Int]] = [:]
    private var byID: [UUID: Int] = [:]

    init(_ entries: [Entry]) {
        self.entries = entries
        reindex()
    }

    private mutating func reindex() {
        byKey = [:]
        byAlias = [:]
        byID = [:]
        for (i, e) in entries.enumerated() {
            byKey[WikiLinks.key(e.title), default: []].append(i)
            for a in e.aliases { byAlias[WikiLinks.key(a), default: []].append(i) }
            byID[e.id] = i
        }
    }

    /// The title the index knows a note by.
    func title(of id: UUID) -> String? { byID[id].map { entries[$0].title } }
    /// When the note was last edited, as the index knows.
    func updated(of id: UUID) -> Date? { byID[id].map { entries[$0].updated } }

    /// Puts in one note's entry as it is now (nil: it isn't live any more). True when that changed
    /// a title, a folder or which notes there are; a newer date alone keeps the index as it was.
    mutating func take(_ entry: Entry?, id: UUID) -> Bool {
        let i = byID[id]
        switch (i, entry) {
        case (nil, nil):
            return false
        case (let i?, let entry?) where WikiLinks.key(entries[i].title) == WikiLinks.key(entry.title) && entries[i].folders == entry.folders
                                         && entries[i].aliases == entry.aliases:
            entries[i] = entry
            return false
        case (let i?, let entry?):
            entries[i] = entry
        case (let i?, nil):
            entries.remove(at: i)
        case (nil, let entry?):
            entries.append(entry)
        }
        reindex()
        return true
    }

    /// Notes with this title.
    func titled(_ title: String) -> [Entry] { (byKey[WikiLinks.key(title)] ?? []).map { entries[$0] } }

    /// Notes with this alias.
    func aliased(_ name: String) -> [Entry] { (byAlias[WikiLinks.key(name)] ?? []).map { entries[$0] } }

    /// The note a link's target points at, seen from a note in `from` (its folder names).
    func resolve(_ target: String, from: [String] = []) -> UUID? {
        // A title can have a slash in it ("Q1/Q2 plan").
        var hits = titled(WikiLinks.stripExtension(target.trimmingCharacters(in: .whitespaces)))
        let folders = WikiLinks.folders(of: target).map { $0.lowercased() }
        if hits.isEmpty {
            hits = titled(WikiLinks.name(of: target))
            // No note by that name: one of a note's aliases, as Obsidian resolves them.
            if hits.isEmpty { hits = aliased(WikiLinks.name(of: target)) }
            if !folders.isEmpty {
                let narrowed = hits.filter { $0.folders.map { $0.lowercased() }.ends(with: folders) }
                // Folders that don't match (the note was moved) don't lose the link.
                if !narrowed.isEmpty { hits = narrowed }
            }
        }
        guard hits.count > 1 else { return hits.first?.id }
        let here = from.map { $0.lowercased() }
        func shared(_ e: Entry) -> Int {
            let f = e.folders.map { $0.lowercased() }
            var n = 0
            while n < f.count, n < here.count, f[n] == here[n] { n += 1 }
            return n
        }
        return hits.max { a, b in
            let sa = a.folders.map { $0.lowercased() } == here, sb = b.folders.map { $0.lowercased() } == here
            if sa != sb { return !sa }
            if shared(a) != shared(b) { return shared(a) < shared(b) }
            return a.updated < b.updated
        }?.id
    }

    /// Same index with one note's title swapped (to resolve links as they were before a rename).
    func with(title: String, for id: UUID) -> WikiIndex {
        WikiIndex(entries.map { $0.id == id ? Entry(id: $0.id, title: title, folders: $0.folders, updated: $0.updated, aliases: $0.aliases) : $0 })
    }
}

private extension Array where Element: Equatable {
    func ends(with suffix: [Element]) -> Bool {
        suffix.count <= count && Array(self[(count - suffix.count)...]) == suffix
    }
}

/// The library's titles as a `WikiIndex`, built once and again after the store saves, so styling
/// a note on every keystroke doesn't fetch every note.
@MainActor
enum WikiDirectory {
    private static var cached: WikiIndex?
    /// The context the index was built from: only its saves change it.
    private static weak var cachedContext: ModelContext?
    private static var observer: NSObjectProtocol?
    /// Goes up each time a title or folder changes.
    private(set) static var generation = 0
    private static var lastSignature: [String] = []

    /// Where each note that links to others links, by its id: what "Linked from" is worked out
    /// from, instead of every note's text being searched each time a note opens.
    private static var outgoing: LinkGraph?
    private static weak var outgoingContext: ModelContext?
    /// Being read off the main thread (`prepare`), for this context.
    private static weak var reading: ModelContext?
    /// Notes saved while it was read: they're read again once it's in.
    private static var savedWhileReading: Set<UUID> = []
    /// Posted (object: the context) when the index and the links are in after being read.
    static let didRead = Notification.Name("WikiDirectory.didRead")

    private static func watchSaves() {
        guard observer == nil else { return }
        // As the save posts, so whoever reads the index after a save sees it.
        observer = NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: nil, queue: nil) { n in
            // The library's context saves on the main thread; others (TipKit keeps its own
            // store) can save on any, and aren't the library.
            guard Thread.isMainThread else { return }
            nonisolated(unsafe) let saved = n
            MainActor.assumeIsolated { WikiDirectory.take(saved) }
        }
    }

    /// The index if it's there; nil while it's being read (`prepare` has started it). A library of
    /// up to `readHere` notes is read here and now: quick enough, and its links show at once.
    static func ready(_ context: ModelContext) -> WikiIndex? {
        if let cached, cachedContext === context, outgoing != nil, outgoingContext === context { return cached }
        let live = #Predicate<Note> { $0.deletedAt == nil && $0.trashedAt == nil }
        if reading !== context, ((try? context.fetchCount(FetchDescriptor<Note>(predicate: live))) ?? 0) <= readHere {
            watchSaves()
            reading = context
            savedWhileReading = []
            // Whoever asked gets it now: nobody is told it was read (telling the open note made it
            // ask again, the same turn).
            install(read(using: context), announce: false)
            return cached
        }
        prepare(context)
        return nil
    }

    /// Libraries up to this many notes have their titles and links read on the main thread.
    static let readHere = 2_000

    /// Reads the titles and links of every note on a context of its own, off the main thread, and
    /// posts `didRead` when they're in. Opening a note at launch used to read every note's text on
    /// the main thread first (at 20,000 notes, most of a second, twice).
    static func prepare(_ context: ModelContext) {
        guard reading !== context else { return }
        watchSaves()
        reading = context
        savedWhileReading = []
        let container = context.container
        Task.detached(priority: .userInitiated) {
            let read = WikiDirectory.read(using: ModelContext(container))
            await MainActor.run { WikiDirectory.install(read) }
        }
    }

    private static func install(_ read: (entries: [WikiIndex.Entry], outgoing: LinkGraph, paths: [UUID: [String]]), announce: Bool = true) {
        guard let context = reading else { return }
        reading = nil
        if cached == nil || cachedContext !== context {
            cached = WikiIndex(read.entries)
            cachedContext = context
            lastSignature = []
            generation += 1
        }
        outgoing = read.outgoing
        outgoingContext = context
        folderPaths = read.paths
        // What was saved while it was read is read again from the context, which has it.
        let again = savedWhileReading
        savedWhileReading = []
        if !again.isEmpty, var index = cached {
            for id in again {
                let n = context.note(id)
                let live = n.map { $0.deletedAt == nil && $0.trashedAt == nil } ?? false
                let entry = live ? n.map { WikiIndex.Entry(id: $0.id, title: $0.title, folders: context.folderPath($0.folder), updated: $0.updatedAt, aliases: WikiLinks.aliases(inFrontMatter: $0.frontMatter)) } : nil
                if index.take(entry, id: id) { generation += 1 }
                outgoing?[id] = n.flatMap { OutgoingLinks(of: $0, folders: context.folderPath($0.folder)) }
            }
            cached = index
        }
        if announce { NotificationCenter.default.post(name: didRead, object: context) }
    }

    /// The titles and links of every live note, read on `context` (one of its own, off the main
    /// thread, for a large library).
    nonisolated static func read(using context: ModelContext) -> (entries: [WikiIndex.Entry], outgoing: LinkGraph, paths: [UUID: [String]]) {
        let folders = (try? context.fetch(FetchDescriptor<Folder>())) ?? []
        var byID: [UUID: (name: String, parent: UUID?)] = [:]
        for f in folders { byID[f.id] = (f.name, f.parent?.id) }
        var paths: [UUID: [String]] = [:]
        func path(_ id: UUID?) -> [String] {
            guard let id else { return [] }
            if let p = paths[id] { return p }
            // As ModelContext.folderPath: names from the top down, a loop read once.
            var parts: [String] = [], seen = Set<UUID>(), at: UUID? = id
            while let x = at, let f = byID[x], seen.insert(x).inserted { parts.insert(f.name, at: 0); at = f.parent }
            paths[id] = parts
            return parts
        }
        let notes = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? []
        var entries: [WikiIndex.Entry] = []
        entries.reserveCapacity(notes.count)
        var outgoing = LinkGraph()
        for n in notes {
            let folders = path(n.folder?.id)
            entries.append(WikiIndex.Entry(id: n.id, title: n.summaryTitle ?? NoteText.head(of: n.body).title, folders: folders, updated: n.updatedAt,
                                           aliases: WikiLinks.aliases(inFrontMatter: n.frontMatter)))
            if let links = OutgoingLinks(of: n, folders: folders) { outgoing[n.id] = links }
        }
        for f in folders { _ = path(f.id) }
        return (entries, outgoing, paths)
    }

    static func index(_ context: ModelContext) -> WikiIndex {
        if let cached { return cached }
        watchSaves()
        let notes = ((try? context.fetch(FetchDescriptor<Note>())) ?? []).filter { $0.deletedAt == nil && $0.trashedAt == nil }
        // Each folder's path worked out once, not once per note in it.
        var paths: [ObjectIdentifier: [String]] = [:]
        func path(_ folder: Folder?) -> [String] {
            guard let folder else { return [] }
            if let p = paths[ObjectIdentifier(folder)] { return p }
            let p: [String] = context.folderPath(folder)
            paths[ObjectIdentifier(folder)] = p
            return p
        }
        let index = WikiIndex(notes.map { WikiIndex.Entry(id: $0.id, title: $0.title, folders: path($0.folder), updated: $0.updatedAt, aliases: WikiLinks.aliases(inFrontMatter: $0.frontMatter)) })
        cached = index
        cachedContext = context
        // Most saves are typing: the editor recolours only when a title or folder changed.
        let signature = index.entries.map { "\($0.id)\u{1F}\(WikiLinks.key($0.title))\u{1F}\($0.folders.joined(separator: "/"))\u{1F}\($0.aliases.joined(separator: "|"))" }.sorted()
        if signature != lastSignature {
            lastSignature = signature
            generation += 1
        }
        return index
    }

    static func invalidate() {
        cached = nil
        outgoing = nil
        folderPaths = [:]
    }

    /// A save, taken into the index and the links note by note: most saves are a note being typed
    /// in, and with thousands of notes building the index again after each of them took most of
    /// the save's time. Folders changing or notes deleted for good build them again. Taking the
    /// same save twice is harmless.
    static func take(_ saved: Notification) {
        guard let context = saved.object as? ModelContext else { return }
        // A folder that only gained or lost notes (the store saves it with them) leaves every
        // path as it was: only a rename or a move of a folder makes the index read again.
        let changes = context.savedModels(saved).map { (notes: $0.notes, folders: movedOrRenamed($0.folders, in: context)) }
        if reading === context {
            if let changes, !changes.folders { savedWhileReading.formUnion(changes.notes.map(\.id)) } else { reading = nil; prepare(context) }
        }
        if outgoingContext === context, outgoing != nil {
            if let changes, !changes.folders {
                for n in changes.notes { outgoing?[n.id] = OutgoingLinks(of: n, folders: context.folderPath(n.folder)) }
            } else {
                outgoing = nil
            }
        }
        guard var index = cached, context === cachedContext else { return }
        guard let changes, !changes.folders else {
            cached = nil
            return
        }
        var changed = false
        for n in changes.notes {
            let live = n.deletedAt == nil && n.trashedAt == nil
            let entry = live ? WikiIndex.Entry(id: n.id, title: n.title, folders: context.folderPath(n.folder), updated: n.updatedAt, aliases: WikiLinks.aliases(inFrontMatter: n.frontMatter)) : nil
            if index.take(entry, id: n.id) { changed = true }
        }
        cached = index
        if changed { generation += 1 }
    }

    /// Each folder's path as the index last read it; empty when the index wasn't read here.
    private static var folderPaths: [UUID: [String]] = [:]

    /// Whether any of `folders` has another path than the index read (or the index can't tell).
    private static func movedOrRenamed(_ folders: [Folder], in context: ModelContext) -> Bool {
        guard !folders.isEmpty else { return false }
        guard !folderPaths.isEmpty, cachedContext === context || outgoingContext === context else { return true }
        var moved = false
        for f in folders {
            let path: [String] = context.folderPath(f)
            if let was = folderPaths[f.id], was != path { moved = true }
            folderPaths[f.id] = path
        }
        return moved
    }

    /// The notes that link to others, as last read: nil until they've been (see `didRead`).
    static func linking(_ context: ModelContext) -> LinkGraph? {
        outgoingContext === context ? outgoing : nil
    }

    /// Titles to offer after `[[`: those starting with what's typed, then those containing it,
    /// each edited last first. Every title once; never the note being written. A note's alias
    /// that matches (and its title doesn't) is offered as `Title|Alias`: the link it makes leads
    /// to the note and reads as the alias (shown "Alias → Title", `WikiLinks.suggestionLabel`).
    static func suggestions(_ typed: String, excluding id: UUID, in context: ModelContext, limit: Int = 5) -> [String] {
        let q = WikiLinks.key(typed)
        let entries = index(context).entries.filter { $0.id != id && !$0.title.isEmpty }.sorted { $0.updated > $1.updated }
        let starts = entries.filter { q.isEmpty || WikiLinks.key($0.title).hasPrefix(q) }
        let contains = q.isEmpty ? [] : entries.filter { e in let k = WikiLinks.key(e.title); return !k.hasPrefix(q) && k.contains(q) }
        func aliases(_ matches: (String) -> Bool) -> [String] {
            q.isEmpty ? [] : entries.flatMap { e in
                WikiLinks.key(e.title).contains(q) ? [] : e.aliases.filter { matches(WikiLinks.key($0)) }.map { "\(e.title)|\($0)" }
            }
        }
        let aliasStarts = aliases { $0.hasPrefix(q) }
        let aliasContains = aliases { !$0.hasPrefix(q) && $0.contains(q) }
        var seen = Set<String>()
        return (starts.map(\.title) + aliasStarts + contains.map(\.title) + aliasContains)
            .filter { seen.insert(WikiLinks.key($0)).inserted }.prefix(limit).map { $0 }
    }

    /// After `[[Note#`: the headings of the note `target` leads to from `note`, those starting
    /// with what's typed first, then those containing it, in the note's order. None for a locked
    /// note or a link that leads nowhere.
    static func headingSuggestions(_ typed: String, target: String, from note: Note, in context: ModelContext, limit: Int = 8) -> [String] {
        guard let linked = context.resolveWikiLink(target, from: note), !linked.isLocked else { return [] }
        return headingSuggestions(typed, in: linked.id == note.id ? note.body : linked.body, limit: limit)
    }

    static func headingSuggestions(_ typed: String, in body: String, limit: Int = 8) -> [String] {
        let q = WikiLinks.key(typed)
        var seen = Set<String>()
        let all = WikiLinks.headings(in: body).filter { seen.insert(WikiLinks.key($0)).inserted }
        let starts = all.filter { q.isEmpty || WikiLinks.key($0).hasPrefix(q) }
        let contains = q.isEmpty ? [] : all.filter { let k = WikiLinks.key($0); return !k.hasPrefix(q) && k.contains(q) }
        return Array((starts + contains).prefix(limit))
    }

    /// The index as the editor of `note` sees it. While the index is being read it's empty, and
    /// the note's links are coloured when it's in (`didRead`).
    static func scope(for note: Note, in context: ModelContext) -> WikiScope {
        guard let index = ready(context) else { return WikiScope(index: WikiIndex([]), from: [], generation: -1) }
        return WikiScope(index: index, from: context.folderPath(note.folder), generation: generation)
    }
}

@MainActor
extension ModelContext {
    /// Folder names from the top down to `folder`.
    func folderPath(_ folder: Folder?) -> [String] {
        var parts: [String] = []
        var f = folder
        var seen = Set<UUID>()
        while let x = f, seen.insert(x.id).inserted { parts.insert(x.name, at: 0); f = x.parent }
        return parts
    }

    /// The note a wiki link in `note` leads to, if there is one.
    func resolveWikiLink(_ target: String, from note: Note) -> Note? {
        WikiDirectory.index(self).resolve(target, from: folderPath(note.folder)).flatMap { self.note($0) }
    }

    /// The notes a save added or changed, and whether it changed folders; nil when it deleted
    /// something for good (those can't be looked at any more).
    func savedNotes(_ saved: Notification) -> (notes: [Note], folders: Bool)? {
        savedModels(saved).map { ($0.notes, !$0.folders.isEmpty) }
    }

    /// The notes and folders a save added or changed; nil when it deleted something for good.
    func savedModels(_ saved: Notification) -> (notes: [Note], folders: [Folder])? {
        func ids(_ key: ModelContext.NotificationKey) -> [PersistentIdentifier] { (saved.userInfo?[key.rawValue] as? [PersistentIdentifier]) ?? [] }
        guard ids(.deletedIdentifiers).isEmpty else { return nil }
        var notes: [Note] = []
        var folders: [Folder] = []
        for id in ids(.insertedIdentifiers) + ids(.updatedIdentifiers) {
            switch model(for: id) {
            case let n as Note: notes.append(n)
            case let f as Folder: folders.append(f)
            default: break
            }
        }
        return (notes, folders)
    }

    /// Notes that link to `note`, with a wiki link or a note link, newest first. Worked out from where
    /// each note links (WikiDirectory), not by searching every note's text, which the store did
    /// on opening a note and after every save. Empty while those are being read (`didRead`).
    func backlinks(to note: Note) -> [Note] {
        let ids = backlinkIDs(to: note)
        guard !ids.isEmpty else { return [] }
        let notes = (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { ids.contains($0.id) }))) ?? []
        return notes.filter { $0.deletedAt == nil && $0.trashedAt == nil && !$0.isLocked }.sorted { $0.updatedAt > $1.updatedAt }
    }

    /// The same, as ids, newest first by the index's dates: no note is read (a note linked from
    /// 2,000 others read all 2,000 to show twenty).
    func backlinkIDs(to note: Note) -> [UUID] {
        guard let index = WikiDirectory.ready(self), let linking = WikiDirectory.linking(self) else { return [] }
        let id = note.id
        // Only the notes with a link by this note's title, or a note link to it, can link here.
        var candidates = linking.linking(note: id)
        let key = WikiLinks.key(index.title(of: id) ?? note.title)
        if !key.isEmpty { candidates.formUnion(linking.linking(named: key)) }
        var found: [UUID] = []
        for other in candidates where other != id {
            guard let links = linking[other] else { continue }
            if links.noteLinks.contains(id) { found.append(other); continue }
            // Only a target named like this note can lead to it: the rest aren't resolved.
            for (i, k) in links.targetKeys.enumerated() where k.name == key || k.whole == key {
                if index.resolve(links.wikiTargets[i], from: links.folders) == id { found.append(other); break }
            }
        }
        // Locked, trashed and deleted notes have no links in the index.
        return found.sorted { (index.updated(of: $0) ?? .distantPast) > (index.updated(of: $1) ?? .distantPast) }
    }

    /// After `note` was renamed from `oldTitle`, points the wiki links that led to it under its
    /// old title at its new one, as Obsidian does when a file is renamed. Returns how many notes
    /// changed. Locked notes can't be read here and keep their links.
    @discardableResult
    func retargetWikiLinks(to note: Note, renamedFrom oldTitle: String) -> Int {
        let newTitle = note.title
        guard !oldTitle.isEmpty, !newTitle.isEmpty, WikiLinks.key(oldTitle) != WikiLinks.key(newTitle) else { return 0 }
        let before = WikiDirectory.index(self).with(title: oldTitle, for: note.id)
        let oldKey = WikiLinks.key(oldTitle)
        var changed = 0
        // Only the notes that link by that name are read, when it's known where notes link.
        let candidates: [Note]
        if let linking = WikiDirectory.linking(self) {
            let ids = Array(linking.linking(named: oldKey))
            candidates = ids.isEmpty ? [] : (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { ids.contains($0.id) }))) ?? []
        } else {
            candidates = (try? fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.body.contains("[[") }))) ?? []
        }
        for other in candidates where other.id != note.id && other.deletedAt == nil && !other.isLocked && other.body.contains("[[") {
            let from = folderPath(other.folder)
            let updated = WikiLinks.retarget(other.body, to: newTitle) { link in
                WikiLinks.key(link.name) == oldKey && before.resolve(link.target, from: from) == note.id
            }
            guard updated != other.body else { continue }
            other.body = updated
            other.dirty = true
            changed += 1
        }
        if changed > 0 {
            try? save()
            SyncSignal.changed()
        }
        return changed
    }
}

/// Where a note links: the targets of its wiki links as written and the notes its note links
/// name, with its folders (a wiki link is resolved from there). Nil for a note that links
/// nowhere, isn't live, or is locked (its text can't be read).
struct OutgoingLinks: Equatable, Sendable {
    var wikiTargets: [String]
    var noteLinks: Set<UUID>
    var folders: [String]
    /// The keys a link here can resolve by: each target's name, and the whole target (a title
    /// can have a slash in it).
    var names: Set<String>
    /// Each target's name key and whole key, in `wikiTargets`' order.
    var targetKeys: [TargetKey]
    struct TargetKey: Equatable, Sendable { var name: String; var whole: String }

    nonisolated(unsafe) private static let noteLink = /pane-note:([0-9a-fA-F-]{36})/

    init?(of note: Note, folders: [String]) {
        guard note.deletedAt == nil, note.trashedAt == nil, note.lockedBody == nil else { return nil }
        let body = note.body
        let wiki = body.contains("[[") ? WikiLinks.links(in: body).map(\.target) : []
        var ids = Set<UUID>()
        if body.contains("pane-note:") {
            for m in body.matches(of: Self.noteLink) { if let id = UUID(uuidString: String(m.1)) { ids.insert(id) } }
        }
        guard !wiki.isEmpty || !ids.isEmpty else { return nil }
        self.init(wikiTargets: wiki, noteLinks: ids, folders: folders)
    }

    init(wikiTargets: [String], noteLinks: Set<UUID>, folders: [String]) {
        self.wikiTargets = wikiTargets
        self.noteLinks = noteLinks
        self.folders = folders
        targetKeys = wikiTargets.map { t in
            TargetKey(name: WikiLinks.key(WikiLinks.name(of: t)), whole: WikiLinks.key(WikiLinks.stripExtension(t.trimmingCharacters(in: .whitespaces))))
        }
        names = Set(targetKeys.flatMap { [$0.name, $0.whole] })
    }
}

/// What the editor needs to colour wiki links: the library's titles, seen from the open note's
/// folder. Equal while neither changes, so the editor restyles only when they do.
struct WikiScope: Equatable {
    var index: WikiIndex
    var from: [String]
    var generation: Int

    func resolves(_ target: String) -> Bool { index.resolve(target, from: from) != nil }

    static func == (a: WikiScope, b: WikiScope) -> Bool { a.generation == b.generation && a.from == b.from }
}
