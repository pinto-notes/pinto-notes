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
    var notes: Int
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
    /// The folder written in most (by edits), nil when that's notes in no folder.
    var topFolder: String?
    /// How many notes are in it.
    var topFolderNotes: Int
    /// The day with the most edits, and how many.
    var busiestDay: Date?
    var busiestDayEdits: Int

    init(_ input: FilmInput, calendar: Calendar = .current) {
        let notes = input.notes
        let first = notes.map(\.created).min() ?? input.now
        days = (calendar.dateComponents([.day], from: calendar.startOfDay(for: first), to: calendar.startOfDay(for: input.now)).day ?? 0) + 1
        self.notes = notes.count
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
        let edits = notes.flatMap(\.edits)
        var byAI: [String: Int] = [:]
        for e in edits { if let a = e.ai { byAI[a, default: 0] += 1 } }
        ai = byAI.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
        aiShare = edits.isEmpty ? 0 : Double(byAI.values.reduce(0, +)) / Double(edits.count)
        aiNotes = notes.filter { $0.edits.contains { $0.ai != nil } }.count
        self.edits = edits.filter { $0.ai == nil }.count
        var byFolder: [String: Int] = [:]
        for n in notes { byFolder[n.folder, default: 0] += max(1, n.edits.count) }
        let top = byFolder.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
        topFolder = top?.isEmpty == false ? top : nil
        topFolderNotes = notes.filter { $0.folder == top }.count
        var byDay: [Date: Int] = [:]
        for e in edits { byDay[calendar.startOfDay(for: e.at), default: 0] += 1 }
        let busiest = byDay.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }
        busiestDay = busiest?.key
        busiestDayEdits = busiest?.value ?? 0
    }
}

/// When the film is offered: only to someone who has really used Pinto for about a month, so
/// nobody ever sees a thin, half-empty graph.
enum FilmEligibility {
    /// Your first note is at least this many days old.
    static let minDays = 28
    /// Days in the last 30 on which you wrote or edited something yourself (AI edits don't count).
    static let minActiveDays = 12
    /// Links don't count: most notes link to nothing, and the film's shape comes from folders.
    static let minNotes = 20

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
        return s.days >= minDays && s.activeDays >= minActiveDays && s.notes >= minNotes
    }
}

/// The film's shape: its size, length and when each thing in it happens, in seconds of film.
/// Quiet days pass quickly and busy days slowly, so the film spends its time where you did.
struct FilmScript: Sendable {
    static let width = 1080, height = 1350, fps = 30
    /// The notebook grows for `growth` seconds, then holds while the end card comes up. A full
    /// month takes `fullGrowth`; a thin one is shorter (down to `thinGrowth`), so the film is
    /// never stretched over days when little happened.
    static let fullGrowth = 9.0, thinGrowth = 5.6, outro = 3.6
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
    }
    struct Link: Sendable { var a: Int; var b: Int; var birth: Double }

    /// Oldest first, so the notes alive at any moment are a prefix.
    let nodes: [Node]
    let links: [Link]
    let folders: [String]
    let start: Date, end: Date
    let stats: FilmStats
    /// Per day from `start`: where that day begins in film time, 0...growth; one more for the end.
    private let dayStarts: [Double]
    private let calendar: Calendar

    init(_ input: FilmInput, calendar: Calendar = .current) {
        self.calendar = calendar
        stats = FilmStats(input, calendar: calendar)
        // By how much there is to show: every note and every time one was written in.
        let events = Double(input.notes.count + input.notes.map(\.edits.count).reduce(0, +))
        let fullness = min(1, max(0, (events - 100) / 300))
        let growth = Self.thinGrowth + (Self.fullGrowth - Self.thinGrowth) * fullness * fullness * (3 - 2 * fullness)
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
            activity[day(n.created)] += 2
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
        for w in weights { starts.append(starts.last! + w / total * growth) }
        // The film begins at the first note, not at the midnight before it.
        if let firstNote = input.notes.map(\.created).min() {
            let k = day(firstNote)
            let dayStart = calendar.date(byAdding: .day, value: k, to: firstDay)!
            let base = starts[k] + (starts[k + 1] - starts[k]) * min(1, max(0, firstNote.timeIntervalSince(dayStart) / 86_400))
            if base > 0, base < growth * 0.5 { starts = starts.map { ($0 - base) * growth / (growth - base) } }
        }
        dayStarts = starts

        var folderNames: [String] = []
        var folderIndex: [String: Int] = [:]
        var index: [UUID: Int] = [:]
        var nodes: [Node] = []
        // A film time for a date, computed here because self isn't whole yet.
        func time(_ d: Date) -> Double {
            let k = day(d)
            let dayStart = calendar.date(byAdding: .day, value: k, to: firstDay)!
            let f = min(1, max(0, d.timeIntervalSince(dayStart) / 86_400))
            return min(growth, max(0, starts[k] + (starts[k + 1] - starts[k]) * f))
        }
        for n in sorted {
            let f = folderIndex[n.folder] ?? { folderNames.append(n.folder); folderIndex[n.folder] = folderNames.count - 1; return folderNames.count - 1 }()
            index[n.id] = nodes.count
            let edits = n.edits.sorted { $0.at < $1.at }
            let firstEdit = edits.first
            let bornByAI = firstEdit.map { $0.ai != nil && abs($0.at.timeIntervalSince(n.created)) < 600 } ?? false
            nodes.append(Node(id: n.id, folder: f, birth: time(n.created), edits: edits.map { time($0.at) }, aiEdits: edits.map { $0.ai != nil }, bornByAI: bornByAI))
        }
        // The first notes come one at a time, even when they were made within minutes of each
        // other: the film starts with one, then the next. (Later ones keep their order.)
        let gaps = [0.34, 0.28, 0.24, 0.2, 0.16, 0.12]
        for k in nodes.indices.dropFirst() {
            let least = min(growth * 0.4, nodes[k - 1].birth + (k - 1 < gaps.count ? gaps[k - 1] : 0))
            guard nodes[k].birth < least else { continue }
            nodes[k].birth = least
            nodes[k].edits = nodes[k].edits.map { max($0, least) }
        }
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
    }

    /// When the film is on the day you wrote most (nil when that day passes under the title).
    var busiestMoment: (from: Double, until: Double)? {
        guard let day = stats.busiestDay, let s = span(ofDay: day), s.start >= 0.55 else { return nil }
        return (s.start, s.start + min(2.4, max(1.2, s.length)))
    }

    /// When the folder written in most has its moment: near the end, but never over the day you
    /// wrote most (after it when there's room, otherwise before it).
    var topFolderMoment: (from: Double, until: Double) {
        var from = growth - Self.topFolderMoment, until = growth - 0.25
        if let b = busiestMoment, b.from < until, b.until > from {
            if until - b.until >= 1.4 { from = b.until + 0.15 } else { until = b.from - 0.2; from = max(growth * 0.4, until - 2.2) }
        }
        return (from, until)
    }

    /// When a day is on screen: where it begins in film time, and for how long.
    func span(ofDay day: Date) -> (start: Double, length: Double)? {
        guard let k = calendar.dateComponents([.day], from: start, to: calendar.startOfDay(for: day)).day, k >= 0, k + 1 < dayStarts.count else { return nil }
        return (dayStarts[k], dayStarts[k + 1] - dayStarts[k])
    }

    /// The date shown at a film time.
    func date(at t: Double) -> Date {
        if t >= growth { return end }
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
