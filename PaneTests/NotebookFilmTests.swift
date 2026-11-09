import CoreGraphics
import Foundation
import SwiftData
import Testing
@testable import Pane

/// The notebook film: offered only after a month of real use, made from the notes here and who
/// wrote them, the same every time, and once per device.
@MainActor @Suite(.serialized) struct NotebookFilmTests {
    static let cal: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()
    static let now = Date(timeIntervalSince1970: 1_794_000_000)

    // MARK: When it's offered

    @Test func aMonthOfRealUseIsReady() {
        let input = FilmDemo.notebook(days: 35, now: Self.now)
        let s = FilmStats(input, calendar: Self.cal)
        #expect(s.days == 35)
        #expect(s.activeDays >= FilmEligibility.minActiveDays)
        #expect(FilmEligibility.isReady(input, calendar: Self.cal))
    }

    @Test func aNotebookWithNoLinksIsReady() {
        // Most notes link to nothing: the film takes its shape from folders.
        var input = FilmDemo.notebook(days: 35, now: Self.now)
        for i in input.notes.indices { input.notes[i].links = [] }
        #expect(FilmEligibility.isReady(input, calendar: Self.cal))
        let r = FilmRenderer(script: FilmScript(input, calendar: Self.cal))
        let ctx = FilmRenderer.context()!
        while r.frame <= 260 { r.drawNext(in: ctx) }
        #expect(Self.litPixels(ctx, rows: 300..<1230) > 500, "it still draws a notebook")
    }

    @Test func folderNamesCanBeLeftOut() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        var off = FilmRenderer.Labels()
        off.folderNames = false
        func lit(_ labels: FilmRenderer.Labels) -> Int {
            let r = FilmRenderer(script: script, labels: labels)
            let ctx = FilmRenderer.context()!
            while r.frame <= 260 { r.drawNext(in: ctx) }
            return Self.litPixels(ctx, rows: 300..<1230)
        }
        #expect(lit(FilmRenderer.Labels()) > lit(off), "the names are drawn only when on")
    }

    @Test func notBeforeAMonth() {
        let input = FilmDemo.notebook(days: 20, now: Self.now)
        #expect(!FilmEligibility.isReady(input, calendar: Self.cal), "20 days isn't a month, however busy")
    }

    @Test func aMonthOldAccountYouBarelyUsedIsNotReady() {
        // Plenty of notes, a month old, but you wrote on only 3 days; the AI wrote the rest.
        var input = FilmDemo.notebook(days: 35, now: Self.now)
        let keep = Set((0..<3).map { Self.cal.startOfDay(for: Self.now.addingTimeInterval(-Double($0) * 86_400)) })
        for i in input.notes.indices {
            input.notes[i].edits = input.notes[i].edits.map { e in
                keep.contains(Self.cal.startOfDay(for: e.at)) || e.ai != nil ? e : FilmEdit(at: e.at, ai: "ChatGPT")
            }
        }
        #expect(FilmEligibility.activeDays(input, calendar: Self.cal) <= 3, "AI edits are not your days of use")
        #expect(!FilmEligibility.isReady(input, calendar: Self.cal))
    }

    // MARK: The film's time

    @Test func filmTimeRunsFromTheFirstNoteToNow() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(script.dayNumber(at: 0) == 1)
        #expect(script.date(at: FilmScript.growth) == Self.now)
        #expect(script.nodes.map(\.birth) == script.nodes.map(\.birth).sorted(), "notes appear in the order they were made")
        #expect(script.nodes.allSatisfy { $0.birth >= 0 && $0.birth <= FilmScript.growth })
        #expect(script.links.allSatisfy { $0.birth >= max(script.nodes[$0.a].birth, script.nodes[$0.b].birth) }, "a link shows once both ends are there")
    }

    @Test func busyDaysGetMoreOfTheFilmThanQuietOnes() {
        // Day 1: one note. Day 2: nothing. Day 3: twenty notes.
        let start = Self.cal.startOfDay(for: Self.now).addingTimeInterval(-2 * 86_400)
        var notes = [FilmNote(id: UUID(), folder: "", created: start.addingTimeInterval(3600), edits: [FilmEdit(at: start.addingTimeInterval(3600), ai: nil)], links: [])]
        for k in 0..<20 {
            let at = start.addingTimeInterval(2 * 86_400 + Double(k) * 600)
            notes.append(FilmNote(id: UUID(), folder: "", created: at, edits: [FilmEdit(at: at, ai: nil)], links: []))
        }
        let script = FilmScript(FilmInput(notes: notes, now: start.addingTimeInterval(3 * 86_400 - 1)), calendar: Self.cal)
        let day3 = FilmScript.growth - script.nodes[1].birth
        #expect(script.nodes[1].birth > 0)
        #expect(day3 > FilmScript.growth / 2, "the busy day has most of the film")
    }

    // MARK: Drawing

    @Test func theSameNotesAlwaysMakeTheSameFilm() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(Self.frameHashes(script, at: [40, 200, 380]) == Self.frameHashes(script, at: [40, 200, 380]))
    }

    @Test func itGrowsThenEndsOnItsCard() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let r = FilmRenderer(script: script)
        let ctx = FilmRenderer.context()!
        var lit: [Int] = []
        var bottom = 0
        while !r.isDone {
            let f = r.frame
            r.drawNext(in: ctx)
            if f == 15 || f == 150 || f == 260 { lit.append(Self.litPixels(ctx, rows: 300..<1230)) }
            if f == FilmScript.frameCount - 1 { bottom = Self.litPixels(ctx, rows: 40..<260) }
        }
        #expect(lit[0] > 0, "something shows from the start")
        #expect(lit[0] < lit[1] && lit[1] < lit[2], "the graph grows")
        #expect(bottom > 2000, "the end card's words are there")
    }

    // MARK: From the notes here

    @Test func editsKnowWhoWroteThem() {
        let id = UUID()
        let t = Self.now
        let e = FilmSource.edits([
            .init(note_id: id, at: t, source: "app", client: "Mac"),
            .init(note_id: id, at: t.addingTimeInterval(-60), source: "mcp", client: "ChatGPT"),
        ])
        #expect(e[id]?.map(\.ai) == ["ChatGPT", nil], "oldest first, and the AI by its name")
    }

    @Test func notesLinksAndFoldersComeFromTheLibrary() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let work = Folder(name: "Work")
        let sub = Folder(name: "Acme", parent: work)
        ctx.insert(work); ctx.insert(sub)
        let a = Note(body: "Plan\n[[Agenda]] and [[Nowhere]]", folder: sub)
        let b = Note(body: "Agenda\nthings", folder: work)
        let locked = Note(body: "Secret\n[[Plan]]")
        locked.lockedBody = "sealed"
        for n in [a, b, locked] { ctx.insert(n) }
        try ctx.save()
        let input = FilmSource.notes(ctx, edits: [:], now: .now.addingTimeInterval(60))
        #expect(input.notes.count == 2, "a locked note isn't in it")
        let plan = try #require(input.notes.first { $0.id == a.id })
        #expect(plan.folder == "Work", "notes gather by their top folder")
        #expect(plan.links == [b.id], "a link to no note is left out")
        #expect(plan.edits.count == 1, "a note with no history yet counts as written once")
    }

    // MARK: The launch

    final class FakeSource: FilmSource.Service, @unchecked Sendable {
        var rows: [FilmSource.Row] = []
        var reads = 0
        func rows(notes: [UUID]) async throws -> [FilmSource.Row] { reads += 1; return rows.filter { notes.contains($0.note_id) } }
    }

    /// A month of notes in a library, and the server's record of who wrote them.
    static func library(days: Int) throws -> (ModelContainer, FakeSource) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let demo = FilmDemo.notebook(days: days, now: .now)
        var folders: [String: Folder] = [:]
        var titles: [UUID: String] = [:]
        for (k, n) in demo.notes.enumerated() { titles[n.id] = "Note \(k)" }
        let source = FakeSource()
        for (k, n) in demo.notes.enumerated() {
            let f = folders[n.folder] ?? { let f = Folder(name: n.folder); ctx.insert(f); folders[n.folder] = f; return f }()
            let note = Note(body: "Note \(k)\n" + n.links.compactMap { titles[$0].map { "[[\($0)]]" } }.joined(separator: " "), folder: f)
            note.id = n.id
            note.createdAt = n.created
            ctx.insert(note)
            source.rows += n.edits.map { .init(note_id: n.id, at: $0.at, source: $0.ai == nil ? "app" : "mcp", client: $0.ai ?? "Mac") }
        }
        try ctx.save()
        return (c, source)
    }

    static func store(_ d: UserDefaults, account: UUID, source: FakeSource, folder: URL, launched: Date = .now) -> NotebookFilmStore {
        let s = NotebookFilmStore(defaults: d, launched: launched, arguments: [], folder: folder)
        s.attach(account: account, service: source)
        return s
    }

    static func tempFolder() -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("film-\(UUID().uuidString)", isDirectory: true)
    }

    @Test func oneLaunchGetsItReadyTheNextShowsItAsItOpensThenNeverAgain() async throws {
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast

        let first = Self.store(d, account: account, source: source, folder: folder)
        first.atLaunch(otherPrompt: false)
        #expect(!first.visible, "nothing ready yet")
        await first.prepare(context: c.mainContext)
        #expect(!first.visible, "getting it ready never shows it")
        #expect(FileManager.default.fileExists(atPath: first.preparedURL.path))

        let next = Self.store(d, account: account, source: source, folder: folder)
        next.atLaunch(otherPrompt: false)
        #expect(next.visible, "shown as the app opens")
        #expect(next.script?.stats.ai == "ChatGPT")
        #expect(!FileManager.default.fileExists(atPath: next.preparedURL.path))
        next.visible = false

        let after = Self.store(d, account: account, source: source, folder: folder)
        after.atLaunch(otherPrompt: false)
        await after.prepare(context: c.mainContext)
        #expect(!after.visible)
        #expect(!FileManager.default.fileExists(atPath: after.preparedURL.path), "once per device")
    }

    @Test func neverLaterInALaunchNorBesideAnotherPrompt() async throws {
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)

        let late = Self.store(d, account: account, source: source, folder: folder, launched: .now.addingTimeInterval(-30))
        late.atLaunch(otherPrompt: false)
        #expect(!late.visible, "half a minute in, the app is in use")

        let busy = Self.store(d, account: account, source: source, folder: folder)
        busy.atLaunch(otherPrompt: true)
        #expect(!busy.visible)

        let launched = Date.now
        let typing = Self.store(d, account: account, source: source, folder: folder, launched: launched)
        ShareAsk.lastKeystroke = launched.addingTimeInterval(0.5)
        typing.atLaunch(otherPrompt: false)
        ShareAsk.lastKeystroke = .distantPast
        #expect(!typing.visible, "never over a note being typed in")
        #expect(FileManager.default.fileExists(atPath: busy.preparedURL.path), "it waits for a launch that suits")
    }

    @Test func notGotReadyBeforeAMonth() async throws {
        let (young, source) = try Self.library(days: 14)
        let s = Self.store(TestDefaults(), account: UUID(), source: source, folder: Self.tempFolder())
        await s.prepare(context: young.mainContext)
        #expect(source.reads == 0, "two weeks of notes is known here, without the server")
        #expect(!FileManager.default.fileExists(atPath: s.preparedURL.path))
    }

    @Test func playingItSmallDrawsTheSameFilm() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let small = FilmRenderer(script: script)
        let ctx = FilmRenderer.context(width: 540, height: 675)!
        while small.frame <= 260 { small.drawNext(in: ctx) }
        #expect(Self.litPixels(ctx, rows: 150..<615) > 100, "scaled to the size it's played at")
    }

    @Test func everyLookDrawsIt() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        for look in FilmLook.allCases {
            var labels = FilmRenderer.Labels()
            labels.look = look
            let r = FilmRenderer(script: script, labels: labels)
            let ctx = FilmRenderer.context()!
            while r.frame <= 200 { r.drawNext(in: ctx) }
            let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
            let corner = Int(p[0]) + Int(p[1]) + Int(p[2])
            #expect(look.dark ? corner < 200 : corner > 600, "\(look) has its own background")
        }
    }

    // MARK: Helpers

    static func frameHashes(_ script: FilmScript, at frames: Set<Int>) -> [Int] {
        let r = FilmRenderer(script: script)
        let ctx = FilmRenderer.context()!
        var out: [Int] = []
        while !r.isDone && out.count < frames.count {
            let f = r.frame
            r.drawNext(in: ctx)
            if frames.contains(f) {
                let data = Data(bytes: ctx.data!, count: ctx.bytesPerRow * ctx.height)
                out.append(data.hashValue)
            }
        }
        return out
    }

    /// Pixels clearly lit in a band of rows (counted from the bottom, as the film draws).
    static func litPixels(_ ctx: CGContext, rows: Range<Int>) -> Int {
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        var n = 0
        for y in rows {
            // Bitmap rows run top down.
            let row = p + (ctx.height - 1 - y) * ctx.bytesPerRow
            for x in stride(from: 0, to: ctx.width, by: 2) where Int(row[x * 4]) + Int(row[x * 4 + 1]) + Int(row[x * 4 + 2]) > 180 { n += 1 }
        }
        return n
    }
}
