import Foundation

/// The notebook film: your notes growing over your first weeks, drawn as a graph that lights up
/// where you and your AI wrote. This file holds what it's made from and when it may be offered;
/// FilmRenderer draws it and FilmVideo writes it to a movie.

/// One note as the film sees it: when it began, every edit with who made it, and the notes it links to.
struct FilmNote: Sendable, Hashable, Codable {
    var id: UUID
    /// Its top-level folder, "" when it has none. Notes in one folder gather together.
    var folder: String
    var created: Date
    /// Oldest first.
    var edits: [FilmEdit]
    var links: [UUID]
    /// When it was removed, if it was: a notebook grows and shrinks, and the film shows both.
    var removed: Date? = nil
    /// Brought in from somewhere else (it's older than your first day here): these arrive together.
    var imported: Bool? = nil
}

struct FilmEdit: Sendable, Hashable, Codable {
    var at: Date
    /// The AI's name ("ChatGPT"), nil when you made it.
    var ai: String?
}

struct FilmInput: Sendable, Codable {
    var notes: [FilmNote]
    var now: Date
}

/// The numbers the film ends on.
struct FilmStats: Equatable, Sendable {
    /// Days from your first note to now, counting both.
    var days: Int
    /// The notes that are there now (ones removed along the way aren't counted).
    var notes: Int
    /// Notes made and removed again.
    var removed: Int
    /// Folders with notes in them (notes in no folder aren't one).
    var folders: Int
    var links: Int
    /// Days in the last 30 you wrote something yourself.
    var activeDays: Int
    /// Days you wrote something yourself, since the first note.
    var writingDays: Int
    /// The most days running you wrote on.
    var streak: Int
    /// The AI that made most of the AI edits, if any did.
    var ai: String?
    /// Of all edits, how many an AI made, 0...1.
    var aiShare: Double
    /// Notes an AI wrote in at least once.
    var aiNotes: Int
    /// Every time you wrote in a note (the first time counts).
    var edits: Int
    /// The same, without what you brought in arriving: how much you've written here yourself.
    var written: Int
    /// The folder written in most (by edits), nil when that's notes in no folder.
    var topFolder: String?
    /// How many notes are in it.
    var topFolderNotes: Int
    /// The day with the most edits, and how many.
    var busiestDay: Date?
    var busiestDayEdits: Int
    /// The longest stretch of days you wrote nothing, and the day you were back (nil if none).
    var quietDays: Int
    var backOn: Date?
    /// How long the film covers, in months: 1 for about a month, 2 when it came later.
    var months: Int { max(1, Int((Double(days) / 30).rounded())) }
    /// "first month", "first 2 months": what the film is called, after "My" or "Your".
    var period: String { months == 1 ? "first month" : "first \(months) months" }

    init(_ input: FilmInput, calendar: Calendar = .current) {
        let notes = input.notes
        let first = notes.map(\.created).min() ?? input.now
        removed = notes.filter { $0.removed != nil }.count
        days = (calendar.dateComponents([.day], from: calendar.startOfDay(for: first), to: calendar.startOfDay(for: input.now)).day ?? 0) + 1
        self.notes = notes.count - removed
        folders = Set(notes.map(\.folder).filter { !$0.isEmpty }).count
        let ids = Set(notes.map(\.id))
        var pairs = Set<[UUID]>()
        for n in notes { for l in n.links where l != n.id && ids.contains(l) { pairs.insert([n.id, l].sorted { $0.uuidString < $1.uuidString }) } }
        links = pairs.count
        activeDays = FilmEligibility.activeDays(input, calendar: calendar)
        let written = Set(notes.flatMap { $0.edits.filter { $0.ai == nil }.map { calendar.startOfDay(for: $0.at) } })
        writingDays = written.count
        var best = 0
        for day in written where !written.contains(calendar.date(byAdding: .day, value: -1, to: day) ?? .distantPast) {
            var run = 1, next = calendar.date(byAdding: .day, value: 1, to: day)
            while let n = next, written.contains(n) { run += 1; next = calendar.date(byAdding: .day, value: 1, to: n) }
            best = max(best, run)
        }
        streak = best
        var quiet = 0, back: Date?
        let inOrder = written.sorted()
        for (a, b) in zip(inOrder, inOrder.dropFirst()) {
            let gap = (calendar.dateComponents([.day], from: a, to: b).day ?? 1) - 1
            if gap > quiet { quiet = gap; back = b }
        }
        quietDays = quiet
        backOn = back
        let edits = notes.flatMap(\.edits)
        var byAI: [String: Int] = [:]
        for e in edits { if let a = e.ai { byAI[a, default: 0] += 1 } }
        ai = byAI.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
        aiShare = edits.isEmpty ? 0 : Double(byAI.values.reduce(0, +)) / Double(edits.count)
        aiNotes = notes.filter { $0.edits.contains { $0.ai != nil } }.count
        self.edits = edits.filter { $0.ai == nil }.count
        self.written = notes.reduce(0) { $0 + $1.edits.dropFirst($1.imported == true ? 1 : 0).filter { $0.ai == nil }.count }
        var byFolder: [String: Int] = [:]
        for n in notes { byFolder[n.folder, default: 0] += max(1, n.edits.count) }
        let top = byFolder.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
        topFolder = top?.isEmpty == false ? top : nil
        topFolderNotes = notes.filter { $0.folder == top && $0.removed == nil }.count
        var byDay: [Date: Int] = [:]
        // (Notes you brought in arriving aren't a day's writing: the day you wrote most is one you wrote on.)
        for n in notes { for e in n.edits.dropFirst(n.imported == true ? 1 : 0) { byDay[calendar.startOfDay(for: e.at), default: 0] += 1 } }
        let busiest = byDay.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }
        busiestDay = busiest?.key
        busiestDayEdits = busiest?.value ?? 0
    }
}

/// When the film is offered: only to someone who has really used Pinto for about a month, and
/// only once there are notes enough for it to be worth showing anyone. A notebook that's still
/// thin after a month waits: the film comes when it's grown, and says how long that took ("My
/// first 2 months").
enum FilmEligibility {
    /// Your first note is at least this many days old.
    static let minDays = 28
    /// And no older than this. Past it the history of edits is thinned, so the film couldn't
    /// show how the notebook grew; the yearly one is the next.
    static let maxDays = 92
    /// Days in the last 30 on which you wrote or edited something yourself (AI edits don't count).
    static let minActiveDays = 12
    /// Links don't count: most notes link to nothing, and the film's shape comes from folders.
    /// (Thirty: with fewer the film is a few lights on an empty stage.)
    static let minNotes = 30
    /// Times you've written in a note yourself (what an AI wrote, and notes you brought in arriving,
    /// don't count): notes enough isn't use.
    static let minEdits = 40

    static func activeDays(_ input: FilmInput, calendar: Calendar = .current) -> Int {
        let since = calendar.date(byAdding: .day, value: -30, to: input.now) ?? input.now
        var days = Set<Date>()
        for n in input.notes {
            for e in n.edits where e.ai == nil && e.at > since && e.at <= input.now { days.insert(calendar.startOfDay(for: e.at)) }
        }
        return days.count
    }

    static func isReady(_ input: FilmInput, calendar: Calendar = .current) -> Bool {
        let s = FilmStats(input, calendar: calendar)
        return s.days >= minDays && s.days <= maxDays && s.activeDays >= minActiveDays && s.notes >= minNotes && s.written >= minEdits
    }
}

/// What the notebook is drawn as. It's chosen by how you wrote, never at random, so the picture
/// says something true about the person it belongs to.
enum FilmForm: String, Sendable, CaseIterable {
    /// You wrote in bursts with days away between them: a comet, whose tail is the month.
    case comet
    /// Most of your writing went into a few folders: a cloud for each.
    case nebula
    /// You wrote across many folders: a spiral with an arm for each.
    case spiral

    /// Away for this many days running (or more days away than writing) makes it a comet.
    static let awayDays = 5
    /// The three folders written in most hold at least this much of the writing: a nebula.
    static let deepShare = 0.8

    init(_ stats: FilmStats, writingByFolder: [Int]) {
        let named = writingByFolder.filter { $0 > 0 }.sorted(by: >)
        let all = named.reduce(0, +)
        if named.isEmpty || stats.quietDays >= Self.awayDays || stats.writingDays * 2 < stats.days {
            self = .comet
        } else if named.count <= 3 || Double(named.prefix(3).reduce(0, +)) >= Self.deepShare * Double(all) {
            self = .nebula
        } else {
            self = .spiral
        }
    }
}

/// The film's shape: its size, length and when each thing in it happens, in seconds of film.
/// Quiet days pass quickly and busy days slowly, so the film spends its time where you did.
struct FilmScript: Sendable {
    static let width = 1080, height = 1350, fps = 30
    /// The notebook grows for `growth` seconds, then holds while the end card comes up. A full
    /// month takes `fullGrowth`; a thin one is shorter (down to `thinGrowth`), so the film is
    /// never stretched over days when little happened. A notebook someone lives in gets longer
    /// still, up to `longGrowth`: with thousands of edits in nine seconds the work is a blur.
    /// Above this many notes the film leaves out the specks for each edit: the stars carry the work.
    static let speckLimit = 120
    static let fullGrowth = 14.0, thinGrowth = 9.0, longGrowth = 20.0, outro = 3.6
    /// With `bang`: the sky stays empty this long, then what you brought in arrives all at once,
    /// and your own notes follow once it has settled.
    static let lead = 1.6, bangHold = 1.5
    /// When what you brought in arrives (with `bang`, and only if you brought something).
    let bangAt: Double?
    /// How long the film is before the month itself starts: the empty sky and the arrival (0 without `bang`).
    let opening: Double
    /// How much there is in a full month's film, and in the longest one (notes and edits together).
    static let fullEvents = 400.0, longEvents = 3200.0
    let growth: Double
    /// How long before the end of the growth the folder written in most has its moment.
    static let topFolderMoment = 2.6
    /// It opens on a glimpse of where the month ended up, then goes back to the first day: the
    /// first frame, which is what a feed or a message shows before it plays, is the whole notebook.
    static let prelude = 2.4
    static var preludeFrames: Int { Int((prelude * Double(fps)).rounded()) }
    var duration: Double { Self.prelude + growth + Self.outro }
    var frameCount: Int { Int((duration * Double(Self.fps)).rounded()) }

    struct Node: Sendable {
        var id: UUID
        var folder: Int
        var birth: Double
        /// Film times of its edits, and whether an AI made each; oldest first.
        var edits: [Double]
        var aiEdits: [Bool]
        var bornByAI: Bool
        /// When it's removed, if it is.
        var gone: Double? = nil
        var imported = false
    }
    struct Link: Sendable { var a: Int; var b: Int; var birth: Double }

    /// Something that happened in the month, which the film stops to tell: when, and what to look at.
    struct Beat: Sendable, Equatable {
        enum Kind: Sendable, Equatable { case folderBegins, aiJoins, cameBack, busiestDay, quietReturn, topFolder }
        var kind: Kind
        var from: Double, until: Double
        var folder: Int?
        var node: Int?
        var count = 0
    }
    /// The month's own story, in order: what the film says and shows besides the notebook growing.
    /// Two people's are never the same, because it's made of what each of them did.
    private(set) var story: [Beat] = []

    /// Oldest first, so the notes alive at any moment are a prefix.
    let nodes: [Node]
    let links: [Link]
    let folders: [String]
    let start: Date, end: Date
    let stats: FilmStats
    /// Per day from `start`: where that day begins in film time, 0...growth; one more for the end.
    private let dayStarts: [Double]
    private let calendar: Calendar

    init(_ input: FilmInput, calendar: Calendar = .current, longest: Double = FilmScript.longGrowth, bang: Bool = false) {
        self.calendar = calendar
        stats = FilmStats(input, calendar: calendar)
        // By how much there is to show: every note and every time one was written in.
        let events = Double(input.notes.count + input.notes.map(\.edits.count).reduce(0, +))
        let fullness = min(1, max(0, (events - 100) / 300))
        // (Past a full month it lengthens by how many times over the notebook is: each doubling adds the same.)
        let over = min(1, max(0, log2(max(1, events / Self.fullEvents)) / log2(Self.longEvents / Self.fullEvents)))
        // (`span` is the month itself; with `bang` the empty sky and the arrival come before it.)
        let span = Self.thinGrowth + (Self.fullGrowth - Self.thinGrowth) * fullness * fullness * (3 - 2 * fullness)
            + (max(Self.fullGrowth, longest) - Self.fullGrowth) * over * over * (3 - 2 * over)
        let brings = input.notes.contains { $0.imported == true }
        let offset = bang ? Self.lead + (brings ? Self.bangHold : 0) : 0
        bangAt = bang && brings ? Self.lead : nil
        opening = offset
        let growth = span + offset
        self.growth = growth
        let sorted = input.notes.sorted { ($0.created, $0.id.uuidString) < ($1.created, $1.id.uuidString) }
        let firstDay = calendar.startOfDay(for: sorted.first?.created ?? input.now)
        start = firstDay
        end = input.now
        let dayCount = max(1, (calendar.dateComponents([.day], from: firstDay, to: calendar.startOfDay(for: input.now)).day ?? 0) + 1)

        // Busy days get more of the film.
        var activity = [Double](repeating: 0, count: dayCount)
        func day(_ d: Date) -> Int { min(dayCount - 1, max(0, calendar.dateComponents([.day], from: firstDay, to: calendar.startOfDay(for: d)).day ?? 0)) }
        for n in sorted {
            // (What was brought in isn't a day's work: the day it arrived gets no more of the film for it.)
            if n.imported != true { activity[day(n.created)] += 2 }
            for e in n.edits { activity[day(e.at)] += 1 }
        }
        let peak = max(1, activity.max() ?? 1)
        var weights = activity.map { 0.3 + $0 / peak }
        // The day you wrote most gets a real stretch of the film: it's the one the film stops to name.
        if let busiest = stats.busiestDay, dayCount > 3 {
            let k = day(busiest)
            let others = weights.reduce(0, +) - weights[k]
            // At least a good second of it, whatever the rest adds up to.
            weights[k] = max(weights[k] * 2, others / 5.5)
        }
        let total = weights.reduce(0, +)
        var starts = [0.0]
        for w in weights { starts.append(starts.last! + w / total * span) }
        // The film begins at the first note, not at the midnight before it.
        if let firstNote = input.notes.map(\.created).min() {
            let k = day(firstNote)
            let dayStart = calendar.date(byAdding: .day, value: k, to: firstDay)!
            let base = starts[k] + (starts[k + 1] - starts[k]) * min(1, max(0, firstNote.timeIntervalSince(dayStart) / 86_400))
            if base > 0, base < span * 0.5 { starts = starts.map { ($0 - base) * span / (span - base) } }
        }
        dayStarts = starts.map { $0 + offset }

        var folderNames: [String] = []
        var folderIndex: [String: Int] = [:]
        var index: [UUID: Int] = [:]
        var nodes: [Node] = []
        // A film time for a date, computed here because self isn't whole yet.
        func time(_ d: Date) -> Double {
            let k = day(d)
            let dayStart = calendar.date(byAdding: .day, value: k, to: firstDay)!
            let f = min(1, max(0, d.timeIntervalSince(dayStart) / 86_400))
            // (The first note is at exactly 0, whatever the arithmetic above leaves of it.)
            let at = min(span, max(0, starts[k] + (starts[k + 1] - starts[k]) * f))
            return (at < 1e-9 ? 0 : at) + offset
        }
        for n in sorted {
            let f = folderIndex[n.folder] ?? { folderNames.append(n.folder); folderIndex[n.folder] = folderNames.count - 1; return folderNames.count - 1 }()
            index[n.id] = nodes.count
            let edits = n.edits.sorted { $0.at < $1.at }
            let firstEdit = edits.first
            let bornByAI = firstEdit.map { $0.ai != nil && abs($0.at.timeIntervalSince(n.created)) < 600 } ?? false
            nodes.append(Node(id: n.id, folder: f, birth: time(n.created), edits: edits.map { time($0.at) }, aiEdits: edits.map { $0.ai != nil }, bornByAI: bornByAI,
                              gone: n.removed.map { time($0) }, imported: n.imported == true))
        }
        // The first notes come one at a time, even when they were made within minutes of each
        // other: the film starts with one, then the next. (Later ones keep their order.)
        // After those, a day's notes still arrive one after another, never all in one frame.
        let gaps = [0.34, 0.28, 0.24, 0.2, 0.16, 0.12]
        let apart = min(0.05, growth * 0.5 / Double(max(1, nodes.count)))
        // (What was brought in arrives together, in about a second, however much there is of it.)
        let brought = Double(max(1, nodes.filter(\.imported).count))
        // (With `bang`, all at once: within a third of a second, as the sky bursts.)
        if let at = bangAt {
            var j = 0.0
            for k in nodes.indices where nodes[k].imported {
                nodes[k].birth = at + 0.3 * j / brought
                if !nodes[k].edits.isEmpty { nodes[k].edits[0] = nodes[k].birth }
                j += 1
            }
        }
        for k in nodes.indices.dropFirst() {
            let least = nodes[k].imported && bangAt != nil ? nodes[k - 1].birth : nodes[k].imported ? nodes[k - 1].birth + min(0.06, 1.0 / brought) : k - 1 < gaps.count ? min(growth * 0.4, nodes[k - 1].birth + gaps[k - 1]) : min(growth - 0.05, nodes[k - 1].birth + apart)
            guard nodes[k].birth < least else { continue }
            nodes[k].birth = least
            nodes[k].edits = nodes[k].edits.map { max($0, least) }
        }
        // (Nothing leaves before it's been there long enough to be seen.)
        for k in nodes.indices { if let g = nodes[k].gone { nodes[k].gone = min(growth, max(g, nodes[k].birth + 0.5)) } }
        var seen = Set<[Int]>()
        var links: [Link] = []
        for n in sorted {
            guard let a = index[n.id] else { continue }
            for l in n.links {
                guard let b = index[l], b != a else { continue }
                let key = [min(a, b), max(a, b)]
                guard seen.insert(key).inserted else { continue }
                // A link shows once both ends are there.
                links.append(Link(a: key[0], b: key[1], birth: max(nodes[a].birth, nodes[b].birth) + 0.12))
            }
        }
        self.nodes = nodes
        self.links = links.sorted { $0.birth < $1.birth }
        folders = folderNames
        story = tell()
    }

    /// What this notebook is drawn as: by the days you were away and how your writing was spread
    /// over your folders (notes in no folder aren't one).
    var form: FilmForm {
        var writing = [Int](repeating: 0, count: folders.count)
        for n in nodes where !folders[n.folder].isEmpty { writing[n.folder] += max(1, n.edits.count) }
        return FilmForm(stats, writingByFolder: writing)
    }

    /// Every time a note was written in, by you or your AI: how much work is in the film.
    var work: Int { nodes.reduce(0) { $0 + $1.edits.count } }

    /// Picks what happened that's worth telling, most telling first, and gives each its own time.
    private func tell() -> [Beat] {
        // What's most the person's own comes first: things that happened, before things that are counted.
        var wanted: [Beat] = []
        // The AI's first time, when there was a time before it (an AI there from the first notes didn't join anything).
        let firstAI = nodes.indices.compactMap { i -> (Double, Int)? in
            let at = nodes[i].bornByAI ? nodes[i].birth : zip(nodes[i].edits, nodes[i].aiEdits).first { $0.1 }?.0
            return at.map { ($0, i) }
        }.min { $0.0 < $1.0 }
        if let (at, i) = firstAI, at - opening >= 0.1 * (growth - opening) { wanted.append(Beat(kind: .aiJoins, from: at, until: at + 1.4, node: i)) }
        // Away for a while, and back.
        if stats.quietDays >= 4, let day = stats.backOn, let s = span(ofDay: day) {
            wanted.append(Beat(kind: .quietReturn, from: s.start, until: s.start + 1.4, count: stats.quietDays))
        }
        // Folders that began along the way (not the one the month opened with), the largest first.
        var size = [Int](repeating: 0, count: folders.count)
        for n in nodes { size[n.folder] += 1 }
        let began = folders.indices.filter { !folders[$0].isEmpty && size[$0] >= 4 && $0 != nodes.first?.folder }
            .sorted { size[$0] > size[$1] }
            .compactMap { f in nodes.first { $0.folder == f }.map { (f, $0.birth) } }
            .filter { $0.1 >= opening + 1.2 }
        func begins(_ k: Int) { if k < began.count { wanted.append(Beat(kind: .folderBegins, from: began[k].1, until: began[k].1 + 1.4, folder: began[k].0, count: size[began[k].0])) } }
        begins(0)
        // The note you kept coming back to.
        if let i = nodes.indices.max(by: { nodes[$0].edits.count < nodes[$1].edits.count }), nodes[i].edits.count >= 6 {
            let at = nodes[i].edits[Int(0.7 * Double(nodes[i].edits.count - 1))]
            wanted.append(Beat(kind: .cameBack, from: at - 0.15, until: at + 1.3, node: i, count: nodes[i].edits.count))
        }
        if let b = busiestMoment { wanted.append(Beat(kind: .busiestDay, from: b.from, until: min(b.until, b.from + 1.5), count: stats.busiestDayEdits)) }
        if growth > 5, stats.folders >= 3, let m = topFolderMoment, let f = stats.topFolder.flatMap({ folders.firstIndex(of: $0) }) {
            wanted.append(Beat(kind: .topFolder, from: m.from, until: min(m.until, m.from + 1.6), folder: f, count: stats.topFolderNotes))
        }
        begins(1)
        // Each needs time to be read, after the film has said what a light is, and none over another.
        var told: [Beat] = []
        for var b in wanted where told.count < 5 {
            b.from = max(b.from, opening + 1.5)
            b.until = min(max(b.until, b.from + 1.3), growth - 0.25)
            for _ in 0..<2 {
                guard let clash = told.first(where: { b.from < $0.until + 0.2 && b.until > $0.from - 0.2 }) else { break }
                let later = clash.until + 0.2
                guard later - b.from <= 0.8 else { b.until = 0; break }
                b.until = min(growth - 0.25, b.until + later - b.from)
                b.from = later
            }
            guard b.until - b.from >= 1.2, !told.contains(where: { b.from < $0.until + 0.2 && b.until > $0.from - 0.2 }) else { continue }
            told.append(b)
        }
        return told.sorted { $0.from < $1.from }
    }

    /// When the film is on the day you wrote most (nil when that day passes under the title).
    var busiestMoment: (from: Double, until: Double)? {
        guard let day = stats.busiestDay, let s = span(ofDay: day), s.start >= opening + 0.55 else { return nil }
        return (s.start, s.start + min(2.4, max(1.2, s.length)))
    }

    /// When the folder written in most has its moment: near the end, but never over the day you
    /// wrote most (after it when there's room, otherwise before it). Nil when neither leaves it
    /// time enough to be read: then the end card says it instead.
    var topFolderMoment: (from: Double, until: Double)? {
        var from = growth - Self.topFolderMoment, until = growth - 0.25
        if let b = busiestMoment, b.from < until, b.until > from {
            if until - b.until >= 1.4 { from = b.until + 0.15 } else { until = b.from - 0.2; from = max(growth * 0.4, until - 2.2) }
        }
        return until - from >= 1.2 ? (from, until) : nil
    }

    /// When a day is on screen: where it begins in film time, and for how long.
    func span(ofDay day: Date) -> (start: Double, length: Double)? {
        guard let k = calendar.dateComponents([.day], from: start, to: calendar.startOfDay(for: day)).day, k >= 0, k + 1 < dayStarts.count else { return nil }
        return (dayStarts[k], dayStarts[k + 1] - dayStarts[k])
    }

    /// The date shown at a film time.
    func date(at t: Double) -> Date {
        if t >= growth { return end }
        // (Before the month, in the empty sky: the day it begins.)
        let t = max(t, opening)
        var k = 0
        while k + 1 < dayStarts.count - 1 && dayStarts[k + 1] <= t { k += 1 }
        let span = max(0.0001, dayStarts[k + 1] - dayStarts[k])
        let f = (t - dayStarts[k]) / span
        let dayStart = calendar.date(byAdding: .day, value: k, to: start)!
        return min(end, dayStart.addingTimeInterval(f * 86_400))
    }

    /// Which day of the notebook a film time shows, 1 for the first.
    func dayNumber(at t: Double) -> Int {
        (calendar.dateComponents([.day], from: start, to: calendar.startOfDay(for: date(at: t))).day ?? 0) + 1
    }
}
