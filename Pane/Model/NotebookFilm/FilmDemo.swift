import Foundation

/// A made-up month of real use: for the pilot, the tests and captures. Never shown as anyone's own.
/// Folders grow at their own pace, hubs gather links, and on some days ChatGPT writes a burst of
/// linked notes, the way a session with an AI does.
enum FilmDemo {
    /// `light` is the thinnest month the film is still offered for: two folders, a note most
    /// days, no AI.
    /// `heavy` is a big month: twelve folders, some with long names, and about three times the notes.
    /// `work` multiplies how often notes are written in: 8 with `heavy` is someone who lives in it.
    /// `daily` makes each day mostly about one folder, the way people work: on one thing one day
    /// and a lot on something else another.
    static func notebook(days: Int = 35, seed: UInt64 = 7, now: Date = Date(timeIntervalSince1970: 1_794_000_000), ai: String = "ChatGPT", light: Bool = false, heavy: Bool = false, person: Int = 0, work: Double = 1, daily: Bool = false) -> FilmInput {
        var rng = seed &* 0x2545_F491_4F6C_DD1D | 1
        func rand() -> Double {
            rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17
            return Double(rng >> 11) / Double(1 << 53)
        }
        func pick<T>(_ a: [T]) -> T { a[Int(rand() * Double(a.count)) % a.count] }

        // Three different people, to see that no two films are alike: a student whose AI joins in
        // the second week and who's away for a while, a founder with the AI from the first days,
        // and someone who writes alone and starts planning a trip half way through.
        let ai = person == 1 ? "Claude" : ai
        let aiFromDay = person == 1 ? 12 : person == 3 ? Int.max : 2
        let aiChance = person == 2 ? 0.8 : 0.5
        let away: Range<Int> = person == 1 ? 16..<22 : person == 3 ? 8..<13 : 0..<0
        let people: [[(String, Double, Int)]] = [
            [("Thesis", 0.4, 0), ("Lectures", 0.2, 0), ("Reading", 0.15, 3), ("Gym", 0.1, 9), ("Flat hunt", 0.15, 23)],
            [("Product", 0.3, 0), ("Ideas", 0.1, 0), ("Family", 0.1, 2), ("Investors", 0.15, 6), ("Hiring", 0.15, 11), ("Launch", 0.25, 19)],
            [("Journal", 0.3, 0), ("Recipes", 0.25, 0), ("Garden", 0.2, 1), ("Trip to Japan", 0.3, 15)],
        ]
        let folders: [(String, Double, Int)] = (1...3).contains(person) ? people[person - 1] : light ? [("Journal", 0.7, 0), ("Recipes", 0.3, 5)] : heavy ? [
            ("Work", 0.2, 0), ("Product research 2026", 0.14, 1), ("Thesis", 0.12, 2), ("Reading", 0.08, 1), ("Apartment hunt", 0.08, 6),
            ("Running", 0.06, 4), ("Recipes", 0.06, 8), ("Home", 0.07, 3), ("Lisbon trip", 0.05, 17), ("Quarterly planning", 0.06, 10),
            ("Ideas", 0.05, 2), ("Family", 0.03, 12),
        ] : [  // name, weight, first day
            ("Work", 0.27, 0), ("Thesis", 0.2, 2), ("Reading", 0.12, 1), ("Running", 0.09, 4),
            ("Recipes", 0.1, 8), ("Home", 0.12, 3), ("Lisbon trip", 0.1, 17),
        ]
        let cal = Calendar(identifier: .gregorian)
        let firstDay = cal.startOfDay(for: now.addingTimeInterval(-Double(days - 1) * 86_400))

        struct Draft { var id: UUID; var folder: String; var created: Date; var edits: [FilmEdit]; var links: [UUID] }
        var notes: [Draft] = []
        var degree: [UUID: Int] = [:]
        var idBits: UInt64 = seed << 32

        func newID() -> UUID {
            idBits += 1
            var b = idBits
            return withUnsafeBytes(of: &b) { raw in
                let x = Array(raw)
                return UUID(uuid: (x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 0x40, 0, 0x80, 0, 0, 0, 0, UInt8(seed & 0xFF)))
            }
        }
        /// A note in `folder`, by preference one with many links already.
        func hub(in folder: String) -> Int? {
            let c = notes.indices.filter { notes[$0].folder == folder }
            guard !c.isEmpty else { return nil }
            let w = c.map { Double(1 + (degree[notes[$0].id] ?? 0)) * 1.0 }
            var r = rand() * w.reduce(0, +)
            for (k, i) in c.enumerated() { r -= w[k]; if r <= 0 { return i } }
            return c.last
        }
        func add(_ folder: String, at: Date, ai: String?, linkTo: [Int]) -> Int {
            let id = newID()
            var links: [UUID] = []
            for j in linkTo where !links.contains(notes[j].id) {
                links.append(notes[j].id)
                degree[id, default: 0] += 1
                degree[notes[j].id, default: 0] += 1
            }
            notes.append(Draft(id: id, folder: folder, created: at, edits: [FilmEdit(at: at, ai: ai)], links: links))
            return notes.count - 1
        }

        for d in 0..<days {
            let day = firstDay.addingTimeInterval(Double(d) * 86_400)
            let weekday = cal.component(.weekday, from: day)
            let weekend = weekday == 1 || weekday == 7
            // Some days you don't open it at all.
            if rand() < (light ? 0.35 : weekend ? 0.35 : 0.12) { continue }
            if away.contains(d) { continue }
            let open = folders.filter { $0.2 <= d }
            func folderPick() -> String {
                var r = rand() * open.map(\.1).reduce(0, +)
                for f in open { r -= f.1; if r <= 0 { return f.0 } }
                return open[0].0
            }
            let today: String? = daily ? folderPick() : nil
            let newNotes = (light ? Int(rand() * 3.2) + (d < 2 ? 2 : 0) : Int(rand() * (weekend ? 3 : 5)) + (d < 3 ? 3 : 0)) * (heavy ? 3 : 1)
            for _ in 0..<newNotes {
                var f = ""
                if let today, rand() < 0.8 { f = today } else { f = folderPick() }
                let at = day.addingTimeInterval(8 * 3600 + rand() * 13 * 3600)
                var to: [Int] = []
                // Most notes link to nothing.
                if let h = hub(in: f), rand() < 0.12 { to.append(h) }
                if rand() < 0.03, let h = hub(in: pick(open).0) { to.append(h) }
                _ = add(f, at: at, ai: nil, linkTo: to)
            }
            // Coming back to what you wrote, recent notes most.
            let editCount = Int(rand() * (light ? 5 : weekend ? 10 : 26) * work) + (light ? 1 : 0)
            for _ in 0..<editCount where !notes.isEmpty {
                // Recent notes most, and the few you keep coming back to.
                var i = notes.count - 1 - Int(pow(rand(), 2.2) * Double(notes.count))
                if rand() < (work > 1 ? 0.3 : 0.45) {
                    let w = notes.map { work > 1 ? Double($0.edits.count) : Double($0.edits.count * $0.edits.count) }
                    var r = rand() * w.reduce(0, +)
                    for (k, x) in w.enumerated() { r -= x; if r <= 0 { i = k; break } }
                }
                if let today, rand() < 0.8 {
                    let mine = notes.indices.filter { notes[$0].folder == today }
                    if !mine.isEmpty { i = mine[mine.count - 1 - Int(pow(rand(), 2) * Double(mine.count)) % mine.count] }
                }
                let at = day.addingTimeInterval(8 * 3600 + rand() * 14 * 3600)
                if at > notes[i].created { notes[i].edits.append(FilmEdit(at: at, ai: nil)) }
            }
            // A session with the AI: a burst of linked notes in one folder, and edits to old ones.
            if !light && d >= aiFromDay && rand() < aiChance {
                let f = today ?? folderPick()
                var at = day.addingTimeInterval(19 * 3600 + rand() * 3 * 3600)
                let anchor = hub(in: f)
                var made: [Int] = []
                for _ in 0..<Int(rand() * 3) {
                    at += 60 + rand() * 240
                    var to: [Int] = []
                    if let anchor, rand() < 0.3 { to.append(anchor) }
                    made.append(add(f, at: at, ai: ai, linkTo: to))
                }
                for _ in 0..<Int(Double(3 + Int(rand() * 9)) * (1 + (work - 1) * 0.3)) {
                    var into = pick(open).0
                    if let today, rand() < 0.75 { into = today }
                    if let i = hub(in: into) {
                        at += 30 + rand() * 120
                        notes[i].edits.append(FilmEdit(at: at, ai: ai))
                    }
                }
            }
        }
        // Nothing after now: the month ends at this moment.
        notes.removeAll { $0.created > now }
        let kept = Set(notes.map(\.id))
        for i in notes.indices { notes[i].edits.removeAll { $0.at > now }; notes[i].links.removeAll { !kept.contains($0) } }
        for i in notes.indices { notes[i].edits.sort { $0.at < $1.at } }
        return FilmInput(notes: notes.map { FilmNote(id: $0.id, folder: $0.folder, created: $0.created, edits: $0.edits, links: $0.links) }, now: now)
    }

    /// A month the way a notebook is really used, for judging the film honestly: a new note about
    /// once a week, each one written in on up to every other day, and an edit is what the server
    /// keeps of that (a version or two for a day a note was worked in, never dozens).
    /// `dailyNote` adds someone's note for each day, written that day and seldom again.
    /// `imported` notes are brought in on the first day (most are seldom opened again), `removed`
    /// of the notes made along the way are thrown out some days later, and `habit` is one note
    /// written in every day (a tracker).
    static func real(days: Int = 35, seed: UInt64 = 7, now: Date = Date(timeIntervalSince1970: 1_794_000_000), notesPerWeek: Double = 1, dailyNote: Bool = false, ai: String? = "ChatGPT", imported: Int = 0, removed: Int = 0, habit: Bool = false, linked: Double = 0, evening: Bool = false) -> FilmInput {
        var rng = seed &* 0x2545_F491_4F6C_DD1D | 1
        func rand() -> Double {
            rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17
            return Double(rng >> 11) / Double(1 << 53)
        }
        let cal = Calendar(identifier: .gregorian)
        let firstDay = cal.startOfDay(for: now.addingTimeInterval(-Double(days - 1) * 86_400))
        let folders: [(String, Double)] = [("Work", 0.4), ("Ideas", 0.25), ("Home", 0.2), ("Reading", 0.15)]
        struct Draft { var id: UUID; var folder: String; var created: Date; var edits: [FilmEdit]; var standing: Bool; var imported = false; var habit = false; var removed: Date?; var links: [UUID] = [] }
        var notes: [Draft] = []
        var made: UInt64 = seed << 32
        func add(_ folder: String, at: Date, standing: Bool, imported: Bool = false) {
            made += 1
            var b = made
            let id = withUnsafeBytes(of: &b) { raw -> UUID in
                let x = Array(raw)
                return UUID(uuid: (x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 0x40, 0, 0x80, 1, 0, 0, 0, UInt8(seed & 0xFF)))
            }
            // (In a knowledge base a note often links to one that's there already, mostly in its own folder.)
            var links: [UUID] = []
            if linked > 0, rand() < linked {
                let near = notes.indices.filter { notes[$0].folder == folder }
                let pool = !near.isEmpty && rand() < 0.8 ? near : Array(notes.indices)
                if !pool.isEmpty { links.append(notes[pool[Int(rand() * Double(pool.count)) % pool.count]].id) }
            }
            notes.append(Draft(id: id, folder: folder, created: at, edits: [FilmEdit(at: at, ai: nil)], standing: standing, imported: imported, links: links))
        }
        func anyFolder() -> String {
            var r = rand()
            for x in folders { r -= x.1; if r <= 0 { return x.0 } }
            return folders[0].0
        }
        // What you bring with you, all at once on the first morning.
        for k in 0..<imported { add(anyFolder(), at: firstDay.addingTimeInterval(9 * 3600 + Double(k)), standing: true, imported: true) }
        if habit {
            add("Habits", at: firstDay.addingTimeInterval(9.5 * 3600), standing: false)
            notes[notes.count - 1].habit = true
        }
        // (You begin by writing a couple, unless you came with notes.)
        var owed = imported > 0 ? 0.6 : 2.0
        for d in 0..<days {
            let day = firstDay.addingTimeInterval(Double(d) * 86_400)
            let weekday = cal.component(.weekday, from: day)
            owed += notesPerWeek / 7
            // Some days you don't open it at all, weekends most.
            if d > 0, rand() < (weekday == 1 || weekday == 7 ? 0.5 : 0.1) { continue }
            let before = notes.count
            // What's there already: each standing note on up to every other day, a little less once it's old.
            for i in 0..<before where notes[i].removed.map({ $0 > day }) ?? true {
                // (A tracker is written in every day you're there; what you brought with you, seldom.)
                let chance = notes[i].habit ? 1 : notes[i].imported ? 0.07 : notes[i].standing ? (day.timeIntervalSince(notes[i].created) > 21 * 86_400 ? 0.3 : 0.45) : 0.03
                guard d > 0, rand() < chance else { continue }
                var at = day.addingTimeInterval(9 * 3600 + rand() * 9 * 3600)
                // (Someone who writes after work: most of it in the evening, late.)
                if evening, rand() < 0.65 { at = day.addingTimeInterval(20.5 * 3600 + rand() * 3.2 * 3600) }
                let versions = 1 + (rand() < 0.35 ? 1 : 0) + (rand() < 0.1 ? 1 : 0)
                // (Now and then your AI is the one writing in it.)
                let helped = ai != nil && d >= 4 && rand() < 0.22
                for v in 0..<versions {
                    notes[i].edits.append(FilmEdit(at: at, ai: helped && v == versions - 1 ? ai : nil))
                    at += 600 + rand() * 5400
                }
            }
            while owed + (rand() - 0.5) * 0.9 >= 1 {
                owed -= 1
                add(anyFolder(), at: day.addingTimeInterval(9 * 3600 + rand() * 11 * 3600), standing: true)
            }
            if dailyNote {
                let at = day.addingTimeInterval(8 * 3600 + rand() * 3 * 3600)
                add("Daily", at: at, standing: false)
                if rand() < 0.5 { notes[notes.count - 1].edits.append(FilmEdit(at: at.addingTimeInterval(4 * 3600 + rand() * 6 * 3600), ai: nil)) }
            }
        }
        notes.removeAll { $0.created > now }
        // Some of what was made along the way is thrown out a few days later.
        var mine = notes.indices.filter { !notes[$0].imported && !notes[$0].habit }
        for _ in 0..<min(removed, mine.count) {
            let i = mine.remove(at: Int(rand() * Double(mine.count)) % mine.count)
            let at = notes[i].created.addingTimeInterval((2 + rand() * 7) * 86_400)
            if at < now { notes[i].removed = at; notes[i].edits.removeAll { $0.at > at } }
        }
        for i in notes.indices { notes[i].edits.removeAll { $0.at > now }; notes[i].edits.sort { $0.at < $1.at } }
        return FilmInput(notes: notes.map { FilmNote(id: $0.id, folder: $0.folder, created: $0.created, edits: $0.edits, links: $0.links, removed: $0.removed, imported: $0.imported ? true : nil) }, now: now)
    }
}
