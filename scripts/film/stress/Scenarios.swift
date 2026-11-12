import Foundation

// Notebooks to put the film through: the extremes by hand, then many more at random, each a
// different life (how long the account is, how someone writes, how much, in how many folders and
// folders inside them, what they brought, what their AI did, what they threw out).

struct Scenario {
    var name: String
    var input: FilmInput
}

struct Rand {
    var s: UInt64
    init(_ seed: UInt64) { s = seed &* 0x9E37_79B9_7F4A_7C15 | 1 }
    mutating func next() -> Double { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return Double(s >> 11) / Double(1 << 53) }
    mutating func int(_ r: ClosedRange<Int>) -> Int { r.lowerBound + Int(next() * Double(r.count)) % r.count }
    mutating func pick<T>(_ a: [T]) -> T { a[int(0...(a.count - 1))] }
    mutating func chance(_ p: Double) -> Bool { next() < p }
    /// Mostly small, now and then large: how notebooks are.
    mutating func skewed(_ lo: Double, _ hi: Double) -> Double { lo * pow(hi / lo, pow(next(), 2.2)) }
}

enum Names {
    static let plain = ["Work", "Home", "Ideas", "Reading", "Thesis", "Recipes", "Travel", "Health", "Journal", "Family", "Money", "Garden", "Music", "Running", "Clients", "Meetings", "Books", "Kids", "Car", "Taxes"]
    static let long = ["Product research 2026 and beyond", "Quarterly planning and strategy offsite", "Apartment hunt in Stockholm", "Things to read when I have time", "Lectures, seminars and office hours"]
    static let world = ["🏠 Home", "💼 Work", "Работа", "仕事", "عمل", "Café notes", "Ølbryggeri", "日記", "📚", "Ideas ✨"]
    static let inside = ["Clients", "Meetings", "Archive", "2025", "2026", "Drafts", "Done", "Someday", "Books", "Articles", "Podcasts", "People", "Q1", "Q2", "Old"]
}

enum Scenarios {
    static let now = Date(timeIntervalSince1970: 1_794_000_000)
    static let cal = Calendar(identifier: .gregorian)

    struct Life {
        var days = 35
        enum Pattern: String, CaseIterable { case steady, bursts, weekAway, weekends, oneDay, frontLoaded, backLoaded, daily, evenings }
        var pattern = Pattern.steady
        var own = 30
        var folders: [String] = ["Work", "Home"]
        var looseShare = 0.1
        /// For each folder, how many folders inside it.
        var insideCount = 0
        var imported = 0
        var importFolders = 0
        var editsPerNote = 3.0
        var tracker = false
        var ai = 0.2
        var aiName = "ChatGPT"
        var removed = 0.0
        var seed: UInt64 = 1
    }

    static func make(_ l: Life) -> FilmInput {
        var r = Rand(l.seed)
        let first = cal.startOfDay(for: now.addingTimeInterval(-Double(l.days - 1) * 86_400))
        var notes: [FilmNote] = []
        var made: UInt64 = l.seed << 24
        func id() -> UUID {
            made += 1
            var b = made
            return withUnsafeBytes(of: &b) { raw in
                let x = Array(raw)
                return UUID(uuid: (x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 0x40, 0, 0x80, 2, 0, 0, 0, 1))
            }
        }
        var insides: [String: [String]] = [:]
        for f in l.folders where l.insideCount > 0 {
            var names = Names.inside.shuffledBy(&r)
            if names.count > l.insideCount { names = Array(names.prefix(l.insideCount)) }
            while names.count < l.insideCount { names.append("Part \(names.count + 1)") }
            insides[f] = names
        }
        func folder(_ pool: [String]) -> (String, String?) {
            guard !pool.isEmpty, !r.chance(l.looseShare) else { return ("", nil) }
            // (Some folders are much busier than others.)
            let k = min(pool.count - 1, Int(Double(pool.count) * pow(r.next(), 1.8)))
            let f = pool[k]
            guard let list = insides[f], r.chance(0.6) else { return (f, nil) }
            return (f, list[min(list.count - 1, Int(Double(list.count) * pow(r.next(), 1.4)))])
        }
        /// The day (from the first) a note of the month is made on.
        func day() -> Int {
            switch l.pattern {
            case .steady, .evenings, .daily: return r.int(0...(l.days - 1))
            case .bursts:
                let centres = (0..<3).map { _ in Double(r.int(0...(l.days - 1))) }
                return min(l.days - 1, max(0, Int(r.pick(centres) + (r.next() - 0.5) * 4)))
            case .weekAway:
                var d = r.int(0...(l.days - 1)); let gone = l.days / 3
                while (gone..<(gone + 8)).contains(d) { d = r.int(0...(l.days - 1)) }
                return d
            case .weekends:
                var d = r.int(0...(l.days - 1))
                for _ in 0..<20 { let w = cal.component(.weekday, from: first.addingTimeInterval(Double(d) * 86_400)); if w == 1 || w == 7 { break }; d = r.int(0...(l.days - 1)) }
                return d
            case .oneDay: return l.days / 2
            case .frontLoaded: return min(l.days - 1, Int(Double(min(7, l.days)) * r.next()))
            case .backLoaded: return max(0, l.days - 1 - Int(Double(min(7, l.days)) * r.next()))
            }
        }
        func time(_ d: Int) -> Date {
            let h = l.pattern == .evenings ? 20 + r.next() * 3.5 : 8 + r.next() * 12
            return first.addingTimeInterval(Double(d) * 86_400 + h * 3600)
        }
        func edits(from: Date, count: Int) -> [FilmEdit] {
            var out = [FilmEdit(at: from, ai: r.chance(l.ai * 0.3) ? l.aiName : nil)]
            for _ in 0..<max(0, count - 1) {
                let at = from.addingTimeInterval(r.next() * max(60, now.timeIntervalSince(from)))
                out.append(FilmEdit(at: at, ai: r.chance(l.ai) ? l.aiName : nil))
            }
            return out.sorted { $0.at < $1.at }
        }
        // What was brought in, on the first morning (made long before).
        let importPool = l.importFolders > 0 ? Array((l.folders + Names.plain.filter { !l.folders.contains($0) }).prefix(l.importFolders)) : l.folders
        for _ in 0..<l.imported {
            let (f, sub) = folder(importPool)
            let old = first.addingTimeInterval(-Double(r.int(30...900)) * 86_400)
            var e = [FilmEdit(at: old, ai: nil)]
            if r.chance(0.1) { e += edits(from: time(r.int(0...(l.days - 1))), count: r.int(1...3)) }
            notes.append(FilmNote(id: id(), folder: f, created: old, edits: e.sorted { $0.at < $1.at }, links: [], imported: true, subfolder: sub))
        }
        if l.tracker {
            let at = time(0)
            var e = [FilmEdit(at: at, ai: nil)]
            for d in 1..<l.days { for _ in 0..<r.int(1...3) { e.append(FilmEdit(at: time(d), ai: nil)) } }
            notes.append(FilmNote(id: id(), folder: l.folders.first ?? "", created: at, edits: e.sorted { $0.at < $1.at }, links: []))
        }
        for k in 0..<l.own {
            let d = l.pattern == .daily ? (k * l.days / max(1, l.own)) : day()
            let at = time(d)
            let (f, sub) = l.pattern == .daily && r.chance(0.7) ? ("Daily", nil) : folder(l.folders)
            let count = max(1, Int(r.skewed(1, max(1.01, l.editsPerNote * 3))))
            var n = FilmNote(id: id(), folder: f, created: at, edits: edits(from: at, count: count), links: [], subfolder: sub)
            if r.chance(l.removed) {
                let gone = at.addingTimeInterval((0.2 + r.next() * 10) * 86_400)
                if gone < now { n.removed = gone; n.edits.removeAll { $0.at > gone } }
            }
            notes.append(n)
        }
        for i in notes.indices { notes[i].edits.removeAll { $0.at > now } ; if notes[i].edits.isEmpty { notes[i].edits = [FilmEdit(at: notes[i].created, ai: nil)] } }
        notes.removeAll { $0.created > now }
        return FilmInput(notes: notes, now: now)
    }

    /// The extremes, by hand.
    static var extremes: [Scenario] {
        var out: [Scenario] = []
        func add(_ name: String, _ change: (inout Life) -> Void) { var l = Life(); l.seed = UInt64(out.count + 1000); change(&l); out.append(Scenario(name: name, input: make(l))) }
        add("tiny: three notes, one folder") { $0.own = 3; $0.folders = ["Work"]; $0.looseShare = 0 }
        add("one note") { $0.own = 1; $0.folders = ["Work"]; $0.looseShare = 0 }
        add("no folders at all") { $0.own = 200; $0.folders = []; $0.looseShare = 1 }
        add("forty folders") { $0.own = 200; $0.folders = (1...40).map { "Folder \($0)" } }
        add("one folder, two thousand notes") { $0.own = 2000; $0.folders = ["Work"]; $0.looseShare = 0; $0.editsPerNote = 1.5 }
        add("brought two thousand across thirty folders") { $0.imported = 2000; $0.importFolders = 30; $0.own = 40; $0.folders = Array(Names.plain.prefix(10)) }
        add("brought in, wrote nothing") { $0.imported = 300; $0.own = 0; $0.folders = ["Work", "Home", "Ideas"] }
        add("a whole notebook on one day") { $0.pattern = .oneDay; $0.own = 150 }
        add("one folder, fifteen inside it") { $0.folders = ["Work"]; $0.insideCount = 15; $0.own = 160; $0.looseShare = 0; $0.imported = 100 }
        add("long names everywhere") { $0.folders = Names.long; $0.insideCount = 3; $0.own = 120; $0.imported = 60 }
        add("names from everywhere") { $0.folders = Names.world; $0.insideCount = 2; $0.own = 120 }
        add("threw nearly everything out") { $0.own = 80; $0.removed = 0.9 }
        add("only the AI writes") { $0.own = 60; $0.ai = 1 }
        add("a tracker over a year") { $0.days = 365; $0.own = 2; $0.tracker = true; $0.folders = ["Habits"] }
        add("a note a month for a year") { $0.days = 365; $0.own = 12; $0.pattern = .steady }
        add("a year, a lot") { $0.days = 365; $0.own = 1500; $0.folders = Array(Names.plain.prefix(12)); $0.insideCount = 2; $0.imported = 400 }
        add("everything in the first week") { $0.pattern = .frontLoaded; $0.own = 90 }
        add("everything in the last week") { $0.pattern = .backLoaded; $0.own = 90 }
        add("a note a day") { $0.pattern = .daily; $0.own = 35 }
        add("a month away in the middle") { $0.pattern = .weekAway; $0.days = 60; $0.own = 50 }
        add("written in hundreds of times") { $0.own = 25; $0.editsPerNote = 120 }
        add("brought one note") { $0.imported = 1; $0.own = 20 }
        add("brought into twelve tiny subfolders") { $0.imported = 36; $0.folders = ["Work"]; $0.insideCount = 12; $0.own = 10; $0.looseShare = 0 }
        return out
    }

    /// Many more, at random.
    static func random(_ n: Int, seed: UInt64) -> [Scenario] {
        var r = Rand(seed)
        return (0..<n).map { k in
            var l = Life()
            l.seed = seed &+ UInt64(k) &* 7919
            l.days = r.chance(0.7) ? r.int(28...45) : r.pick([60, 90, 180, 365])
            l.pattern = r.pick(Life.Pattern.allCases)
            l.own = Int(r.skewed(3, 1200))
            let nf = r.chance(0.08) ? 0 : Int(r.skewed(1, 30))
            var pool = Names.plain.shuffledBy(&r)
            if r.chance(0.2) { pool = Names.long + pool }
            if r.chance(0.15) { pool = Names.world + pool }
            while pool.count < nf { pool.append("Folder \(pool.count + 1)") }
            l.folders = Array(pool.prefix(nf))
            l.looseShare = r.chance(0.3) ? r.next() * 0.5 : 0.05
            l.insideCount = r.chance(0.45) ? Int(r.skewed(1, 8)) : 0
            l.imported = r.chance(0.45) ? Int(r.skewed(1, 2500)) : 0
            l.importFolders = r.chance(0.3) ? Int(r.skewed(1, 30)) : 0
            l.editsPerNote = r.skewed(1, 60)
            l.tracker = r.chance(0.15)
            l.ai = r.chance(0.3) ? 0 : r.next()
            l.aiName = r.pick(["ChatGPT", "Claude", "Gemini", "Copilot"])
            l.removed = r.chance(0.6) ? r.next() * 0.4 : 0
            let what = "\(l.pattern.rawValue), \(l.days)d, \(l.own) own, \(l.imported) brought, \(nf) folders" + (l.insideCount > 0 ? " ×\(l.insideCount) inside" : "")
            return Scenario(name: "random \(k): " + what, input: make(l))
        }
    }
}

extension Array {
    func shuffledBy(_ r: inout Rand) -> [Element] {
        var a = self
        for i in a.indices.reversed() where i > 0 { a.swapAt(i, r.int(0...i)) }
        return a
    }
}
