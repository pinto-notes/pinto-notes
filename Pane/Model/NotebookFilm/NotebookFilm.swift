import Foundation

/// The notebook film: your notes growing over your first weeks, drawn as a graph that lights up
/// where you and your AI wrote. This file holds what it's made from and when it may be offered;
/// FilmRenderer draws it and FilmVideo writes it to a movie.

/// One note as the film sees it: when it began, every edit with who made it, and the notes it links to.
struct FilmNote: Sendable, Hashable {
    var id: UUID
    /// Its top-level folder, "" when it has none. Notes in one folder gather together.
    var folder: String
    var created: Date
    /// Oldest first.
    var edits: [FilmEdit]
    var links: [UUID]
}

struct FilmEdit: Sendable, Hashable {
    var at: Date
    /// The AI's name ("ChatGPT"), nil when you made it.
    var ai: String?
}

struct FilmInput: Sendable {
    var notes: [FilmNote]
    var now: Date
}

/// The numbers the film ends on.
struct FilmStats: Equatable, Sendable {
    /// Days from your first note to now, counting both.
    var days: Int
    var notes: Int
    var links: Int
    /// Days in the last 30 you wrote something yourself.
    var activeDays: Int
    /// The AI that made most of the AI edits, if any did.
    var ai: String?
    /// Of all edits, how many an AI made, 0...1.
    var aiShare: Double

    init(_ input: FilmInput, calendar: Calendar = .current) {
        let notes = input.notes
        let first = notes.map(\.created).min() ?? input.now
        days = (calendar.dateComponents([.day], from: calendar.startOfDay(for: first), to: calendar.startOfDay(for: input.now)).day ?? 0) + 1
        self.notes = notes.count
        let ids = Set(notes.map(\.id))
        var pairs = Set<[UUID]>()
        for n in notes { for l in n.links where l != n.id && ids.contains(l) { pairs.insert([n.id, l].sorted { $0.uuidString < $1.uuidString }) } }
        links = pairs.count
        activeDays = FilmEligibility.activeDays(input, calendar: calendar)
        let edits = notes.flatMap(\.edits)
        var byAI: [String: Int] = [:]
        for e in edits { if let a = e.ai { byAI[a, default: 0] += 1 } }
        ai = byAI.max { $0.value == $1.value ? $0.key > $1.key : $0.value < $1.value }?.key
        aiShare = edits.isEmpty ? 0 : Double(byAI.values.reduce(0, +)) / Double(edits.count)
    }
}

/// When the film is offered: only to someone who has really used Pinto for about a month, so
/// nobody ever sees a thin, half-empty graph.
enum FilmEligibility {
    /// Your first note is at least this many days old.
    static let minDays = 28
    /// Days in the last 30 on which you wrote or edited something yourself (AI edits don't count).
    static let minActiveDays = 12
    static let minNotes = 20
    static let minLinks = 8

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
        return s.days >= minDays && s.activeDays >= minActiveDays && s.notes >= minNotes && s.links >= minLinks
    }
}

/// The film's shape: its size, length and when each thing in it happens, in seconds of film.
/// Quiet days pass quickly and busy days slowly, so the film spends its time where you did.
struct FilmScript: Sendable {
    static let width = 1080, height = 1350, fps = 30
    /// The notebook grows for this long, then holds while the end card comes up.
    static let growth = 9.0, outro = 3.6
    static var duration: Double { growth + outro }
    static var frameCount: Int { Int((duration * Double(fps)).rounded()) }

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
        let weights = activity.map { 0.3 + $0 / peak }
        let total = weights.reduce(0, +)
        var starts = [0.0]
        for w in weights { starts.append(starts.last! + w / total * Self.growth) }
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
            return min(Self.growth, starts[k] + (starts[k + 1] - starts[k]) * f)
        }
        for n in sorted {
            let f = folderIndex[n.folder] ?? { folderNames.append(n.folder); folderIndex[n.folder] = folderNames.count - 1; return folderNames.count - 1 }()
            index[n.id] = nodes.count
            let edits = n.edits.sorted { $0.at < $1.at }
            let firstEdit = edits.first
            let bornByAI = firstEdit.map { $0.ai != nil && abs($0.at.timeIntervalSince(n.created)) < 600 } ?? false
            nodes.append(Node(id: n.id, folder: f, birth: time(n.created), edits: edits.map { time($0.at) }, aiEdits: edits.map { $0.ai != nil }, bornByAI: bornByAI))
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

    /// The date shown at a film time.
    func date(at t: Double) -> Date {
        if t >= Self.growth { return end }
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
