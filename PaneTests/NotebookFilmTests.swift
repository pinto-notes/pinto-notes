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
        #expect(script.date(at: script.growth) == Self.now)
        #expect(script.nodes.map(\.birth) == script.nodes.map(\.birth).sorted(), "notes appear in the order they were made")
        #expect(script.nodes.allSatisfy { $0.birth >= 0 && $0.birth <= script.growth })
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
        let day3 = script.growth - script.nodes[1].birth
        #expect(script.nodes[1].birth > 0)
        #expect(day3 > script.growth / 2, "the busy day has most of the film")
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
            let g = f - FilmScript.preludeFrames
            if g == 15 || g == 150 || g == 260 { lit.append(Self.litPixels(ctx, rows: 300..<1230)) }
            if f == script.frameCount - 1 { bottom = Self.litPixels(ctx, rows: 40..<260) }
        }
        #expect(lit[0] > 0, "something shows from the start")
        // More notes as it goes. (How much is lit isn't the measure: that follows who's writing
        // and how close the camera is.)
        #expect(lit.allSatisfy { $0 > 0 }, "the notebook is on screen throughout")
        func born(by t: Double) -> Int { script.nodes.filter { $0.birth <= t }.count }
        #expect(born(by: 0.5) < born(by: 5) && born(by: 5) < born(by: 8.6))
        #expect(bottom > 2000, "the end card's words are there")
    }

    @Test func theFirstFrameSaysWhatItIs() {
        // A still of the start (what a feed shows before it plays) has the title, not a black frame.
        let r = FilmRenderer(script: FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal))
        let ctx = FilmRenderer.context()!
        r.drawNext(in: ctx)
        #expect(Self.litPixels(ctx, rows: 40..<300) > 2000)
        #expect(Self.litPixels(ctx, rows: 340..<1180) > 500, "and the notebook it grows into")
    }

    @Test func theEndKeepsItsLight() {
        // The last frame is the one people pause on: the notebook is no dimmer than as it grew.
        let r = FilmRenderer(script: FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal))
        let ctx = FilmRenderer.context()!
        var grown = 0, last = 0
        while !r.isDone {
            let f = r.frame
            r.drawNext(in: ctx)
            if f - FilmScript.preludeFrames == 260 { grown = Self.litPixels(ctx, rows: 300..<1230) }
            if f == r.script.frameCount - 1 { last = Self.litPixels(ctx, rows: 300..<1230) }
        }
        #expect(last >= grown)
    }

    @Test func theEndCardCountsTheNotesTheAIHelpedWith() {
        let a = UUID(), b = UUID(), c = UUID()
        let t = Self.now
        let input = FilmInput(notes: [
            FilmNote(id: a, folder: "", created: t, edits: [FilmEdit(at: t, ai: nil), FilmEdit(at: t, ai: "ChatGPT"), FilmEdit(at: t, ai: "ChatGPT")], links: []),
            FilmNote(id: b, folder: "", created: t, edits: [FilmEdit(at: t, ai: "ChatGPT")], links: []),
            FilmNote(id: c, folder: "", created: t, edits: [FilmEdit(at: t, ai: nil)], links: []),
        ], now: t)
        let s = FilmStats(input, calendar: Self.cal)
        #expect(s.aiNotes == 2)
        #expect(FilmRenderer.Labels().statAI("ChatGPT") == "notes with ChatGPT")
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
        next.didPresent()
        #expect(!FileManager.default.fileExists(atPath: next.preparedURL.path))
        next.visible = false

        let after = Self.store(d, account: account, source: source, folder: folder)
        after.atLaunch(otherPrompt: false)
        await after.prepare(context: c.mainContext)
        #expect(!after.visible)
        #expect(!FileManager.default.fileExists(atPath: after.preparedURL.path), "once per device")
    }

    @Test func touchingSomethingBeforeItComesUpLeavesItForTheNextLaunch() async throws {
        // It comes up a moment after the notes: if you've already started on something, it never
        // lands on top of that. Nothing is used up; the next launch offers it.
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)

        let busy = Self.store(d, account: account, source: source, folder: folder)
        busy.atLaunch(otherPrompt: false)
        #expect(busy.visible)
        busy.postpone()
        #expect(!busy.visible && !busy.shown)
        busy.atLaunch(otherPrompt: false)
        #expect(!busy.visible, "not again on this launch")

        let next = Self.store(d, account: account, source: source, folder: folder)
        next.atLaunch(otherPrompt: false)
        #expect(next.visible, "the next launch offers it")
    }

    @Test func onceShownItCanBeWatchedAgainFromHelp() async throws {
        // Not now, or closing it, isn't losing it: it's kept on this device and Help shows it again.
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)
        #expect(!NotebookFilmStore.canRewatch(account, in: folder), "not before it has been offered")

        let s = Self.store(d, account: account, source: source, folder: folder)
        s.atLaunch(otherPrompt: false)
        s.didPresent()
        s.visible = false
        #expect(NotebookFilmStore.canRewatch(account, in: folder))

        let later = Self.store(d, account: account, source: source, folder: folder, launched: .now.addingTimeInterval(-600))
        later.atLaunch(otherPrompt: false)
        #expect(!later.visible, "never offered again by itself")
        later.rewatch()
        #expect(later.visible && later.rewatching)
        #expect(later.script?.stats.notes == s.script?.stats.notes)
        #expect(!NotebookFilmStore.canRewatch(UUID(), in: folder), "another account's film isn't this one's")
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

    @Test func theOpeningIsGoneBeforeTheFirstDayBegins() {
        // It opens on the finished notebook, which draws back and is gone: the two never show at once.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let r = FilmRenderer(script: script)
        let ctx = FilmRenderer.context()!
        var first = 0, lastOfOpening = 0
        while r.frame <= FilmScript.preludeFrames {
            let f = r.frame
            r.drawNext(in: ctx)
            if f == 0 { first = Self.litPixels(ctx, rows: 400..<1180) }
            if f == FilmScript.preludeFrames - 1 { lastOfOpening = Self.litPixels(ctx, rows: 400..<1180) }
        }
        #expect(first > 1000, "the first frame is the whole notebook")
        #expect(lastOfOpening < first / 10, "nearly gone on the opening's last frame")
    }

    @Test func playedInTheAppItStartsAtTheFirstDay() {
        // The intro has already shown where the month ended up.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        // The intro has just shown the finished notebook: the film picks up from it, briefly, so
        // pressing Watch never cuts to an empty frame.
        let r = FilmRenderer(script: script, opening: .brief)
        #expect(r.frame > 0 && r.frame < FilmScript.preludeFrames)
        let ctx = FilmRenderer.context()!
        r.drawNext(in: ctx)
        #expect(Self.litPixels(ctx, rows: 400..<1180) > 1000, "its first frame is the notebook the intro showed")
        while r.frame <= FilmScript.preludeFrames { r.drawNext(in: ctx) }
        #expect(Self.litPixels(ctx, rows: 400..<1180) < 400, "then the first day: a few first notes")
    }

    @Test func itsLastFrameSettlesIntoTheSharedShape() {
        // Full screen it's drawn tall; at the end the same frame is drawn again in the 4:5 shape
        // it's shared in, and matches the film made for sharing.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let screen = FilmPlayback.Screen(size: CGSize(width: 402, height: 874), top: 114, bottom: 58, pixels: 540)
        let tall = screen.canvas(0, card: CGSize(width: 370, height: 462.5))
        #expect(abs(tall.height - 874.0 / 402 * 1080) < 0.01)
        let landed = screen.canvas(1, card: CGSize(width: 370, height: 462.5))
        #expect(landed == .shared)
        let r = FilmRenderer(script: script, canvas: tall, opening: .brief)
        while !r.isDone { r.skip() }
        let ctx = FilmRenderer.context(width: 540, height: 675)!
        r.drawHeld(in: ctx, canvas: landed)
        let shared = FilmRenderer(script: script)
        let want = FilmRenderer.context(width: 540, height: 675)!
        while shared.frame < script.frameCount - 1 { shared.skip() }
        shared.drawNext(in: want)
        let a = Self.litPixels(ctx, rows: 0..<675), b = Self.litPixels(want, rows: 0..<675)
        #expect(abs(a - b) < max(a, b) / 10, "the same picture, give or take the camera's last drift")
    }

    @Test func aNoteTurnsTheAIsColourOnceItHelps() {
        // Amber while only you have written in it, blue from the AI's first edit: no third colour.
        let t = Self.now
        func film(ai: Bool) -> CGContext {
            var notes: [FilmNote] = []
            for k in 0..<20 {
                let made = t.addingTimeInterval(Double(-30 + k) * 86_400)
                var edits = [FilmEdit(at: made, ai: nil)]
                if ai { edits.append(FilmEdit(at: made.addingTimeInterval(3600), ai: "ChatGPT")) }
                notes.append(FilmNote(id: UUID(), folder: "Work", created: made, edits: edits, links: []))
            }
            let r = FilmRenderer(script: FilmScript(FilmInput(notes: notes, now: t), calendar: Self.cal))
            let ctx = FilmRenderer.context()!
            while !r.isDone { r.drawNext(in: ctx) }
            return ctx
        }
        func blueOverRed(_ ctx: CGContext) -> Double {
            let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
            var red = 0, blue = 0
            // The notebook's part of the frame; BGRA.
            for y in 200..<900 { for x in stride(from: 0, to: ctx.width, by: 2) {
                let px = p + y * ctx.bytesPerRow + x * 4
                blue += Int(px[0]); red += Int(px[2])
            } }
            return Double(blue) / Double(max(1, red))
        }
        #expect(blueOverRed(film(ai: false)) < 0.7, "yours alone: amber")
        #expect(blueOverRed(film(ai: true)) > 1.2, "the AI helped with every one: blue")
    }

    @Test func theEndCardHasALineThatsOnlyYours() {
        let input = FilmDemo.notebook(days: 35, now: Self.now)
        let script = FilmScript(input, calendar: Self.cal)
        let s = script.stats
        #expect(s.topFolder == "Work")
        #expect(s.topFolderNotes == input.notes.filter { $0.folder == "Work" }.count)
        #expect(FilmRenderer.Labels().topFolder("Work", 27) == "Most written in Work \u{00B7} 27 notes")
        #expect(FilmRenderer.Labels().topFolderCaption("Work") == "I wrote most in Work", "said while it grows, with no count that isn't true yet")
        #expect(FilmRenderer.Labels().daysCaption(25) == "I wrote on 25 days", "a month of one or two folders gets a line of its own too")
        // Folder names off: the busiest day, which gives nothing away.
        #expect(s.busiestDayEdits > 0)
        #expect(FilmRenderer.Labels().busiestDay("October 19", 23) == "Busiest day: October 19 \u{00B7} 23 edits")
        #expect(FilmRenderer.Labels().busiestCaption(33) == "My busiest day \u{00B7} 33 edits", "first person, like the title")
        // And as the film passes that day it says so: the day has its own stretch of the film.
        let span = try! #require(script.span(ofDay: s.busiestDay!))
        #expect(span.start >= 0 && span.start + span.length <= script.growth + 0.001)
        #expect(span.length >= 0.95, "about a second at least, so its caption and the date agree")
    }

    @Test func aThinMonthMakesAShorterFilm() {
        // Never stretched over days when little happened; a full month gets the full length.
        let thin = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, light: true), calendar: Self.cal)
        let full = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(full.growth == FilmScript.fullGrowth)
        #expect(thin.growth < 6.5 && thin.growth >= FilmScript.thinGrowth)
        #expect(thin.frameCount < full.frameCount)
        #expect(thin.nodes.allSatisfy { $0.birth <= thin.growth })
        let r = FilmRenderer(script: thin)
        var frames = 0
        while !r.isDone { r.skip(); frames += 1 }
        #expect(frames == thin.frameCount)
    }

    @Test func theIntroSaysWhatsYoursInIt() {
        let input = FilmDemo.notebook(days: 35, now: Self.now)
        let s = FilmStats(input, calendar: Self.cal)
        #expect(s.folders == Set(input.notes.map(\.folder)).count && s.folders > 1)
        #expect(NotebookFilmView.teaser(s) == "\(s.notes) notes in \(s.folders) folders.\nA short film of how they grew.")
        #expect(NotebookFilmView.teaser(nil) == "A short film of how your notes grew.")
        #expect(FilmRenderer.Labels().subtitle(s) == "\(s.notes) notes in Pinto Notes")
        #expect(FilmRenderer.Labels().withAI("ChatGPT") == "With ChatGPT")
    }

    @Test func theThinnestMonthItsOfferedForStillMakesAFilm() {
        // Two folders, a note most days, no AI: still ready, and the end card leaves the AI out.
        let input = FilmDemo.notebook(days: 35, now: Self.now, light: true)
        #expect(FilmEligibility.isReady(input, calendar: Self.cal))
        let s = FilmStats(input, calendar: Self.cal)
        #expect(s.ai == nil && s.aiNotes == 0)
        #expect(s.edits == input.notes.map(\.edits.count).reduce(0, +), "with no AI the end card's third number is how often you wrote")
        let r = FilmRenderer(script: FilmScript(input, calendar: Self.cal))
        let ctx = FilmRenderer.context()!
        while !r.isDone { r.drawNext(in: ctx) }
        #expect(Self.litPixels(ctx, rows: 400..<1180) > 300)
    }

    // MARK: The town

    @Test func theTownIsBuiltFromTheNotebook() {
        // A house for every note, on its folder's hill: more notes, more town.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        func picture(at film: Int) -> Data {
            let r = FilmRenderer(script: script, labels: labels)
            let ctx = FilmRenderer.context(width: 540, height: 675)!
            while r.frame < film { r.skip() }
            r.drawNext(in: ctx)
            return Data(bytes: ctx.data!, count: ctx.bytesPerRow * ctx.height)
        }
        let early = FilmScript.preludeFrames + 30, late = FilmScript.preludeFrames + 240
        #expect(picture(at: early) != picture(at: late), "it changes as the month goes")
        #expect(picture(at: late) == picture(at: late), "the same notes always make the same town")
    }

    @Test func nightFallsOnTheTownAndTheWindowsComeOn() {
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        let r = FilmRenderer(script: script, labels: labels)
        let ctx = FilmRenderer.context(width: 540, height: 675)!
        func skyAndLights() -> (sky: Int, lit: Int) {
            let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
            // Top rows of the bitmap are the sky; BGRA.
            var sky = 0
            for x in stride(from: 0, to: ctx.width, by: 8) { let px = p + 6 * ctx.bytesPerRow + x * 4; sky += Int(px[0]) + Int(px[1]) + Int(px[2]) }
            return (sky / (ctx.width / 8), Self.litPixels(ctx, rows: 180..<470))
        }
        while r.frame < FilmScript.preludeFrames + 200 { r.skip() }
        r.drawNext(in: ctx)
        let day = skyAndLights()
        while r.frame < script.frameCount - 1 { r.skip() }
        r.drawNext(in: ctx)
        let night = skyAndLights()
        #expect(day.sky > 500 && night.sky < 200, "a pale sky by day, a dark one at the end")
        #expect(night.lit > 300, "windows lit where the work was")
    }

    @Test func theTownOpensByDayAndKeepsNightForTheEnd() {
        // Its first frame (what a feed shows before it plays) is the whole town at dusk; the lit
        // night town is the ending, not something already seen. Then the month runs backwards
        // to an empty hillside before it begins.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        let r = FilmRenderer(script: script, labels: labels)
        let ctx = FilmRenderer.context(width: 540, height: 675)!
        func sky() -> Int {
            let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
            var sum = 0
            for x in stride(from: 0, to: ctx.width, by: 8) { let px = p + 6 * ctx.bytesPerRow + x * 4; sum += Int(px[0]) + Int(px[1]) + Int(px[2]) }
            return sum / (ctx.width / 8)
        }
        r.drawNext(in: ctx)
        let first = Data(bytes: ctx.data!, count: ctx.bytesPerRow * ctx.height)
        #expect(sky() > 450, "a dusk sky, not night")
        while r.frame < FilmScript.preludeFrames { r.skip() }
        r.drawNext(in: ctx)
        #expect(sky() > 600, "then the first morning")
        #expect(Data(bytes: ctx.data!, count: ctx.bytesPerRow * ctx.height) != first)
        while r.frame < script.frameCount - 1 { r.skip() }
        r.drawNext(in: ctx)
        #expect(sky() < 200, "night at the end")
    }

    @Test func theTownsCameraStartsCloseGoesInForYourMomentsAndIsBackForTheNight() {
        // Close on the first houses of a small town; in on the folder you wrote most in near the
        // end; the whole town for the night, which is the frame that's kept.
        let thin = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, light: true), calendar: Self.cal)
        let small = TownScene(script: thin, folderNames: true)
        #expect(small.closeness(at: 0.3, canvas: .shared) > 1.4)
        #expect(small.closeness(at: 0.3, canvas: .shared) > small.closeness(at: thin.growth + 3, canvas: .shared))

        let full = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let town = TownScene(script: full, folderNames: true)
        let end = town.closeness(at: full.growth + FilmScript.outro, canvas: .shared)
        #expect(abs(end - 1) < 0.02, "a full town fills the stage: nothing is cropped at the end")
        let busiest = try! #require(full.span(ofDay: full.stats.busiestDay!))
        #expect(town.closeness(at: busiest.start + 0.6, canvas: .shared) > end + 0.2, "in on the day most was written")
        // Any frame from its time alone: asking twice, or out of order, gives the same answer.
        let once = town.closeness(at: 4, canvas: .shared)
        _ = town.closeness(at: 8, canvas: .shared)
        #expect(town.closeness(at: 4, canvas: .shared) == once)
    }

    @Test func theTownStandsTallerOnAPhonesScreen() {
        // More room above the ground on a tall screen: the hills use some of it, and the frame
        // it settles to is the shared one.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        let screen = FilmPlayback.Screen(size: CGSize(width: 402, height: 874), top: 114, bottom: 58, pixels: 1206)
        #expect(screen.sized(for: .town).pixels == 804 && screen.sized(for: .night).pixels == 1206)
        let tall = screen.canvas(0, card: CGSize(width: 370, height: 462.5))
        let r = FilmRenderer(script: script, labels: labels, canvas: tall, opening: .brief)
        while !r.isDone { r.skip() }
        let landed = FilmRenderer.context(width: 540, height: 675)!
        r.drawHeld(in: landed, canvas: .shared)
        let shared = FilmRenderer(script: script, labels: labels)
        let want = FilmRenderer.context(width: 540, height: 675)!
        while shared.frame < script.frameCount - 1 { shared.skip() }
        shared.drawNext(in: want)
        #expect(Data(bytes: landed.data!, count: landed.bytesPerRow * landed.height) == Data(bytes: want.data!, count: want.bytesPerRow * want.height), "it lands as the film that's shared")
    }

    @Test func theFilmBeginsAtTheFirstNote() {
        // Not at the midnight before it: there's never a frame of an empty month with "0 notes".
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(script.nodes.first?.birth == 0)
        #expect(script.date(at: 0) == FilmDemo.notebook(days: 35, now: Self.now).notes.map(\.created).min())
        // And in the app the town starts with its first houses there, as the intro shows it.
        let town = TownScene(script: script, folderNames: true)
        #expect(town.appStart > 0.3 && town.appStart <= 1.2)
        #expect(script.nodes.filter { $0.birth <= town.appStart }.count >= 3)
    }

    @Test func theFilmWaitsThroughAStallAndNeverJumpsAhead() {
        // On time: the next frame. A few frames late: the one that's due. A stall of seconds:
        // the next frame in order, and the film's clock moves on by what it waited.
        #expect(FilmPlayback.advance(frame: 10, first: 0, elapsed: 10.0 / 30).frame == 10)
        #expect(FilmPlayback.advance(frame: 10, first: 0, elapsed: 13.2 / 30).frame == 13)
        let stalled = FilmPlayback.advance(frame: 10, first: 0, elapsed: 6)
        #expect(stalled.frame == 10)
        #expect(abs(stalled.wait - Double(180 - 10) / 30) < 0.001)
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
            // Paper's page and the town's daytime sky are pale; the others are dark.
            #expect(look == .paper || look == .town ? corner > 600 : corner < 200, "\(look) has its own background")
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
