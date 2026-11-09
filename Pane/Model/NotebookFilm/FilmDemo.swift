import Foundation

/// A made-up month of real use: for the pilot, the tests and captures. Never shown as anyone's own.
/// Folders grow at their own pace, hubs gather links, and on some days ChatGPT writes a burst of
/// linked notes, the way a session with an AI does.
enum FilmDemo {
    static func notebook(days: Int = 35, seed: UInt64 = 7, now: Date = Date(timeIntervalSince1970: 1_794_000_000), ai: String = "ChatGPT") -> FilmInput {
        var rng = seed &* 0x2545_F491_4F6C_DD1D | 1
        func rand() -> Double {
            rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17
            return Double(rng >> 11) / Double(1 << 53)
        }
        func pick<T>(_ a: [T]) -> T { a[Int(rand() * Double(a.count)) % a.count] }

        let folders: [(String, Double, Int)] = [  // name, weight, first day
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
            if rand() < (weekend ? 0.35 : 0.12) { continue }
            let open = folders.filter { $0.2 <= d }
            func folderPick() -> String {
                var r = rand() * open.map(\.1).reduce(0, +)
                for f in open { r -= f.1; if r <= 0 { return f.0 } }
                return open[0].0
            }
            let newNotes = Int(rand() * (weekend ? 3 : 5)) + (d < 3 ? 3 : 0)
            for _ in 0..<newNotes {
                let f = folderPick()
                let at = day.addingTimeInterval(8 * 3600 + rand() * 13 * 3600)
                var to: [Int] = []
                if let h = hub(in: f), rand() < 0.8 { to.append(h) }
                if let h = hub(in: f), rand() < 0.35 { to.append(h) }
                if rand() < 0.18, let h = hub(in: pick(open).0) { to.append(h) }
                _ = add(f, at: at, ai: nil, linkTo: to)
            }
            // Coming back to what you wrote, recent notes most.
            let editCount = Int(rand() * (weekend ? 6 : 14))
            for _ in 0..<editCount where !notes.isEmpty {
                let back = Int(pow(rand(), 2.2) * Double(notes.count))
                let i = notes.count - 1 - back
                let at = day.addingTimeInterval(8 * 3600 + rand() * 14 * 3600)
                if at > notes[i].created { notes[i].edits.append(FilmEdit(at: at, ai: nil)) }
            }
            // A session with the AI: a burst of linked notes in one folder, and edits to old ones.
            if d >= 2 && rand() < 0.3 {
                let f = folderPick()
                var at = day.addingTimeInterval(19 * 3600 + rand() * 3 * 3600)
                let anchor = hub(in: f)
                var made: [Int] = []
                for _ in 0..<(2 + Int(rand() * 5)) {
                    at += 60 + rand() * 240
                    var to = made.suffix(1).map { $0 }
                    if let anchor { to.append(anchor) }
                    made.append(add(f, at: at, ai: ai, linkTo: to))
                }
                for _ in 0..<(2 + Int(rand() * 6)) {
                    if let i = hub(in: pick(open).0) {
                        at += 30 + rand() * 120
                        notes[i].edits.append(FilmEdit(at: at, ai: ai))
                    }
                }
            }
        }
        for i in notes.indices { notes[i].edits.sort { $0.at < $1.at } }
        return FilmInput(notes: notes.map { FilmNote(id: $0.id, folder: $0.folder, created: $0.created, edits: $0.edits, links: $0.links) }, now: now)
    }
}
