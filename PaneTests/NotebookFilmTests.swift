import CoreGraphics
import Foundation
import SwiftData
import Testing
import AVFoundation
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
        #expect(plan.subfolder == "Acme", "and the folder inside it comes along")
        #expect(input.notes.first { $0.id == b.id }?.subfolder == nil)
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

    @Test func oneLaunchGetsItReadyTheNextOffersItAsACardThenNeverAgain() async throws {
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast

        let first = Self.store(d, account: account, source: source, folder: folder)
        first.atLaunch(otherPrompt: false)
        #expect(!first.offered && !first.visible, "nothing ready yet")
        await first.prepare(context: c.mainContext)
        #expect(!first.offered && !first.visible, "getting it ready never offers it")
        #expect(FileManager.default.fileExists(atPath: first.preparedURL.path))

        // It never comes up by itself: its card is offered, and it opens when you tap it.
        let next = Self.store(d, account: account, source: source, folder: folder)
        next.atLaunch(otherPrompt: false)
        #expect(next.offered && !next.visible && next.cardShown, "a card, not a screen over the notes")
        #expect(next.offerLine?.hasPrefix("You ") == true)
        #expect(next.script?.stats.ai == "ChatGPT")
        next.open()
        #expect(next.visible && !next.offered && next.asked)
        // The card stays while the film is up, for it to grow out of and go back into (Emil, 11-11:
        // the sheet sliding up "I don't like"), and goes when it's closed.
        #expect(next.cardShown)
        next.didPresent()
        #expect(!FileManager.default.fileExists(atPath: next.preparedURL.path))
        next.visible = false
        #expect(!next.cardShown)

        let after = Self.store(d, account: account, source: source, folder: folder)
        after.atLaunch(otherPrompt: false)
        await after.prepare(context: c.mainContext)
        #expect(!after.offered && !after.visible)
        #expect(!FileManager.default.fileExists(atPath: after.preparedURL.path), "once per device")
    }

    @Test func openedFromItsCardNothingYouDoPutsItOff() async throws {
        // Touching or typing before it comes up only put it off when it came up by itself. Asked
        // for, it comes up.
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)

        let s = Self.store(d, account: account, source: source, folder: folder, launched: .now.addingTimeInterval(-600))
        s.atLaunch(otherPrompt: false)
        #expect(s.offered, "the card waits however long the app has been open")
        s.open()
        s.postpone()
        #expect(s.visible)
    }

    @Test func onceShownOrPutAwayItCanBeWatchedAgainFromHelp() async throws {
        // Closing its card isn't losing it: it's kept on this device and Help shows it again.
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)
        #expect(!NotebookFilmStore.canRewatch(account, in: folder), "not before it has been offered")

        let s = Self.store(d, account: account, source: source, folder: folder)
        s.atLaunch(otherPrompt: false)
        let notes = s.script?.stats.notes
        s.closeOffer()
        #expect(!s.offered && !s.visible && s.shown)
        #expect(NotebookFilmStore.canRewatch(account, in: folder))

        let later = Self.store(d, account: account, source: source, folder: folder, launched: .now.addingTimeInterval(-600))
        later.atLaunch(otherPrompt: false)
        #expect(!later.offered && !later.visible, "never offered again by itself")
        later.rewatch()
        #expect(later.visible && later.rewatching)
        #expect(later.script?.stats.notes == notes)
        #expect(!NotebookFilmStore.canRewatch(UUID(), in: folder), "another account's film isn't this one's")
    }

    @Test func neverBesideAnotherPrompt() async throws {
        let (c, source) = try Self.library(days: 35)
        let d = TestDefaults(), account = UUID(), folder = Self.tempFolder()
        ShareAsk.lastKeystroke = .distantPast
        await Self.store(d, account: account, source: source, folder: folder).prepare(context: c.mainContext)

        let busy = Self.store(d, account: account, source: source, folder: folder)
        busy.atLaunch(otherPrompt: true)
        #expect(!busy.offered && !busy.visible)
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
        #expect(FilmRenderer.Labels().topFolderCaption("Work", 22) == "You wrote most in Work \u{00B7} 22 notes")
        #expect(FilmRenderer.Labels().daysCaption(25) == "You wrote on 25 days", "a month of one or two folders gets a line of its own too")
        #expect(FilmRenderer.Labels().streakCaption(9) == "9 days in a row, your longest run")
        #expect(FilmRenderer.Labels().aiCaption("ChatGPT", 36) == "ChatGPT helped with 36 of them", "the AI always has a line of its own")
        #expect(FilmRenderer.Labels().streakCard(9) == "Your longest run: 9 days in a row", "the end card says something the film hasn't")
        // The longest run of days written on, counted from the notes.
        let d = Self.now
        func note(_ days: [Int]) -> FilmNote { FilmNote(id: UUID(), folder: "", created: d.addingTimeInterval(Double(-days.max()!) * 86_400), edits: days.map { FilmEdit(at: d.addingTimeInterval(Double(-$0) * 86_400), ai: nil) }, links: []) }
        #expect(FilmStats(FilmInput(notes: [note([9, 8, 7]), note([5]), note([3, 2, 1, 0])], now: d), calendar: Self.cal).streak == 4)
        // Folder names off: the busiest day, which gives nothing away.
        #expect(s.busiestDayEdits > 0)
        #expect(FilmRenderer.Labels().busiestDay("October 19", 23) == "Busiest day: October 19 \u{00B7} 23 edits")
        #expect(FilmRenderer.Labels().busiestCaption(33) == "Your busiest day \u{00B7} 33 edits", "first person, like the title")
        // And as the film passes that day it says so: the day has its own stretch of the film.
        let span = try! #require(script.span(ofDay: s.busiestDay!))
        #expect(span.start >= 0 && span.start + span.length <= script.growth + 0.001)
        #expect(span.length >= 0.95, "about a second at least, so its caption and the date agree")
    }

    @Test func aThinMonthMakesAShorterFilm() {
        // Never stretched over days when little happened; a full month gets the full length.
        let thin = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, light: true), calendar: Self.cal)
        let full = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(full.growth >= FilmScript.fullGrowth && full.growth < FilmScript.fullGrowth + 0.5)
        // And a notebook someone lives in gets longer still, so the work isn't a blur: up to the
        // longest, never past it.
        let many = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true), calendar: Self.cal)
        let livesInIt = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true, work: 8), calendar: Self.cal)
        let more = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true, work: 40), calendar: Self.cal)
        #expect(many.growth > full.growth + 1 && livesInIt.growth > many.growth + 1)
        #expect(livesInIt.growth > 12 && more.growth == FilmScript.longGrowth)
        #expect(more.nodes.allSatisfy { $0.birth <= more.growth && $0.edits.allSatisfy { $0 <= more.growth } })
        #expect(thin.growth < FilmScript.thinGrowth + 0.9 && thin.growth >= FilmScript.thinGrowth)
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

    @Test func aThinNotebookWaitsUntilItsWorthShowing() {
        // Offered to more people (Emil, 11-11): ten notes, written in on seven of the last 30 days,
        // twice or more yourself. Nine notes is not yet.
        #expect(FilmEligibility.minNotes == 10 && FilmEligibility.minActiveDays == 7 && FilmEligibility.minEdits == 2)
        let now = Self.now
        func ago(_ days: Double) -> Date { now.addingTimeInterval(-days * 86_400) }
        var few = (0..<9).map { k in FilmNote(id: UUID(), folder: "Notes", created: ago(35 - Double(k)), edits: [FilmEdit(at: ago(Double(k) + 1), ai: nil)], links: []) }
        #expect(!FilmEligibility.isReady(FilmInput(notes: few, now: now), calendar: Self.cal))
        few.append(FilmNote(id: UUID(), folder: "Notes", created: ago(20), edits: [FilmEdit(at: ago(12), ai: nil)], links: []))
        #expect(FilmEligibility.isReady(FilmInput(notes: few, now: now), calendar: Self.cal))
        // Ten notes written in on only six days: not yet.
        let sixDays = few.enumerated().map { k, n in var n = n; n.edits = [FilmEdit(at: ago(Double(k % 6) + 1), ai: nil)]; return n }
        #expect(!FilmEligibility.isReady(FilmInput(notes: sixDays, now: now), calendar: Self.cal))
        // The same person seven weeks in, with notes enough: ready, as their first 2 months.
        let later = FilmDemo.notebook(days: 52, now: Self.now)
        #expect(later.notes.count >= FilmEligibility.minNotes)
        #expect(FilmEligibility.isReady(later, calendar: Self.cal))
        let s = FilmStats(later, calendar: Self.cal)
        #expect(s.months == 2 && FilmRenderer.Labels().title(s) == "Your first 2 months")
        #expect(NotebookFilmStore.title(s) == "Your first 2 months" && HelpCopy.film(months: 2) == "Watch your first 2 months")
        // About a month is still "my first month".
        let month = FilmStats(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(month.months == 1 && FilmRenderer.Labels().title(month) == "Your first month" && HelpCopy.film(months: 1) == "Watch your first month")
        // Past three months the edit history is thinned: no first film then (the yearly one is next).
        #expect(!FilmEligibility.isReady(FilmDemo.notebook(days: 120, now: Self.now), calendar: Self.cal))
    }

    @Test func aMonthWithNoAIStillMakesAFilm() {
        // Two folders, a note most days, no AI: the end card leaves the AI out.
        let input = FilmDemo.notebook(days: 35, now: Self.now, light: true)
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

    @Test func aBigNotebookStillMakesATown() {
        // Twelve folders and a few hundred notes: the folders with most notes get a hill each,
        // the rest share one; every note has a house, inside the frame and above the words.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true), calendar: Self.cal)
        #expect(script.folders.count == 12 && script.nodes.count > 180)
        let town = TownScene(script: script, folderNames: true)
        #expect(town.hillCount == TownScene.maxHills)
        let frames = town.houseFrames(canvas: .shared)
        #expect(frames.count == script.nodes.count)
        #expect(frames.allSatisfy { $0.minX > -20 && $0.maxX < 1100 && $0.minY > 340 && $0.maxY < 1250 && $0.width > 8 })
        // And it draws the whole film.
        var labels = FilmRenderer.Labels()
        labels.look = .town
        let r = FilmRenderer(script: script, labels: labels)
        let ctx = FilmRenderer.context(width: 540, height: 675)!
        while r.frame < script.frameCount - 1 { r.skip() }
        r.drawNext(in: ctx)
        #expect(Self.litPixels(ctx, rows: 180..<470) > 500)
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

    @Test func theBusiestDayAndTheTopFolderNeverShareAMoment() {
        // Whenever the busiest day falls, the folder written in most has its own time: after it
        // when there's room before the end, otherwise before it.
        for seed in [UInt64(7), 11, 23, 42, 77] {
            let script = FilmScript(FilmDemo.notebook(days: 35, seed: seed, now: Self.now), calendar: Self.cal)
            // (With no room for it either side of that day, the film leaves it to the end card.)
            guard let top = script.topFolderMoment else { continue }
            #expect(top.until - top.from >= 1.2 && top.until <= script.growth, "seed \(seed)")
            guard let busy = script.busiestMoment else { continue }
            #expect(top.until <= busy.from || top.from >= busy.until, "seed \(seed)")
        }
    }

    @Test func theAILineCountsOnlyWhatTheFilmHasShown() {
        // Its number sits beside the running count of notes, so it's the count so far: it never
        // says "helped with 36" while the film is still on 27 notes.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let r = FilmRenderer(script: script, labels: .init())
        for step in 0...90 {
            let t = script.growth * Double(step) / 90
            #expect(r.helped(at: t) <= script.nodes.filter { $0.birth <= t }.count)
        }
        #expect(r.helped(at: 0.5) < script.stats.aiNotes)
        #expect(r.helped(at: script.growth) == script.stats.aiNotes, "and it ends on the month's number")
    }

    @Test func notesMadeTogetherStillArriveOneAfterAnother() {
        // A busy day's houses never all land in one frame.
        for input in [FilmDemo.notebook(days: 35, now: Self.now), FilmDemo.notebook(days: 35, now: Self.now, heavy: true)] {
            let script = FilmScript(input, calendar: Self.cal)
            for (a, b) in zip(script.nodes, script.nodes.dropFirst()) { #expect(b.birth > a.birth) }
            #expect(script.nodes.allSatisfy { n in n.birth <= script.growth && n.edits.allSatisfy { $0 >= n.birth } })
        }
    }

    @Test func theHologramHasALightForEveryNoteAndKeepsThemInThePicture() {
        // The constellation in depth: every note is a light, and when the month is over the
        // camera has drawn back far enough that all of them are in the frame, above the words.
        for input in [FilmDemo.notebook(days: 35, now: Self.now), FilmDemo.notebook(days: 35, now: Self.now, light: true), FilmDemo.notebook(days: 35, now: Self.now, heavy: true)] {
            let script = FilmScript(input, calendar: Self.cal)
            let holo = HoloScene(script: script, folderNames: true, look: .holo)
            let end = script.growth + FilmScript.outro - 0.1
            let lights = holo.lights(at: end)
            #expect(lights.count == script.nodes.count)
            #expect(lights.allSatisfy { $0.x > 20 && $0.x < 1060 && $0.y > 300 && $0.y < 1290 })
            #expect(holo.lights(at: 0.1).count == 1, "it starts with the first note")
            #expect(holo.systemCount == Set(script.nodes.map(\.folder)).count, "a system for each folder")
        }
        // On the day written most it goes in closer than it is when the month is over.
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        let holo = HoloScene(script: script, folderNames: true, look: .holo)
        if let busy = script.busiestMoment { #expect(holo.zoom(at: (busy.from + busy.until) / 2) > holo.zoom(at: script.growth + 2) * 1.15) }
        // And the same film every time: a frame is drawn from its time alone.
        var labels = FilmRenderer.Labels()
        labels.look = .holo
        func frame() -> Data {
            let r = FilmRenderer(script: script, labels: labels)
            for _ in 0..<200 { r.skip() }
            let c = FilmRenderer.context(width: 270, height: 338)!
            r.drawNext(in: c)
            return Data(bytes: c.data!, count: c.bytesPerRow * c.height)
        }
        #expect(frame() == frame())
    }

    @Test func aNewFilmOpensAsTheConstellation() {
        // Two looks are offered, light and dark, in Pinto's own colours; the rest are kept, not offered.
        #expect(FilmLook.offered == [.cream, .holoLeaf])
        #expect(FilmLook.cream.name == "Light" && FilmLook.holoLeaf.name == "Dark")
        #expect(!FilmLook.cream.dark && FilmLook.holoLeaf.dark)
        // It opens in the one the app is in.
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent("film-look-\(UUID().uuidString)")
        let s = NotebookFilmStore(defaults: UserDefaults(suiteName: "film-look-\(UUID().uuidString)")!, launched: Self.now, arguments: [], folder: folder)
        s.follow(dark: false)
        #expect(s.look == .cream)
        s.follow(dark: true)
        #expect(s.look == .holoLeaf)
    }

    @Test func theFilmTellsEachPersonsOwnMonth() {
        // What the film stops to tell comes from what the person did, so no two are alike: a
        // student whose AI joins in the second week and who's away for a while, a founder who
        // starts new folders along the way, someone who writes alone.
        let people = (1...3).map { FilmScript(FilmDemo.notebook(days: 35, now: Self.now, person: $0), calendar: Self.cal) }
        let kinds = people.map { $0.story.map(\.kind) }
        #expect(kinds[0].contains(.aiJoins) && kinds[0].contains(.quietReturn), "the student: the AI joins, and they come back after a break")
        #expect(kinds[1].contains(.folderBegins) && !kinds[1].contains(.aiJoins), "the founder: a folder begins; the AI was there from the start")
        #expect(!kinds[2].contains(.aiJoins) && people[2].stats.ai == nil, "writing alone: no AI in it at all")
        #expect(Set(kinds.map { "\($0)" }).count == 3, "three people, three different stories")
        #expect(Set(people.map(\.folders)).count == 3, "and their own folders")
        for script in people + [FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)] {
            #expect(script.story.count >= 2 && script.story.count <= 5)
            // In order, each with time to be read, none over another, all while the notebook grows.
            for b in script.story { #expect(b.until - b.from >= 1.2 && b.from >= 1.5 && b.until <= script.growth) }
            for (a, b) in zip(script.story, script.story.dropFirst()) { #expect(b.from >= a.until + 0.19) }
        }
        let l = FilmRenderer.Labels()
        #expect(l.folderBegins("Thesis") == "A new folder: Thesis" && l.aiJoins("Claude") == "Claude joins in")
        #expect(l.cameBack(14) == "One note you came back to 14 times" && l.quietReturn(6) == "Back after 6 quiet days")
        // The days away are counted from the days you wrote on.
        let d = Self.now
        func note(_ days: [Int]) -> FilmNote { FilmNote(id: UUID(), folder: "", created: d.addingTimeInterval(Double(-days.max()!) * 86_400), edits: days.map { FilmEdit(at: d.addingTimeInterval(Double(-$0) * 86_400), ai: nil) }, links: []) }
        let s = FilmStats(FilmInput(notes: [note([20, 19]), note([12, 11]), note([2])], now: d), calendar: Self.cal)
        #expect(s.quietDays == 8 && s.backOn == Self.cal.startOfDay(for: d.addingTimeInterval(-2 * 86_400)))
    }

    @Test func whatItsDrawnAsComesFromHowYouWrote() {
        // Never at random: a comet for bursts with days away, a nebula when a few folders hold
        // most of the writing, a spiral when it's spread over many.
        let d = Self.now
        /// A note a day, `daysAgo` back from now, in the folders given (one folder per day, in turn).
        func script(_ daysAgo: [Int], folders: [String], weight: [Int]? = nil) -> FilmScript {
            var notes: [FilmNote] = []
            for (k, ago) in daysAgo.enumerated() {
                let f = k % folders.count, at = d.addingTimeInterval(Double(-ago) * 86_400 - 3600)
                for _ in 0..<(weight?[f] ?? 1) { notes.append(FilmNote(id: UUID(), folder: folders[f], created: at, edits: [FilmEdit(at: at, ai: nil)], links: [])) }
            }
            return FilmScript(FilmInput(notes: notes, now: d), calendar: Self.cal)
        }
        let everyDay = Array(0..<30), six = ["Work", "Thesis", "Reading", "Home", "Running", "Recipes"]
        #expect(script(everyDay, folders: six).form == .spiral, "every day, across six folders")
        #expect(script(everyDay, folders: ["Work", "Thesis", "Reading"]).form == .nebula, "three folders are a few")
        #expect(script(everyDay, folders: six, weight: [9, 9, 9, 1, 1, 1]).form == .nebula, "six, but three hold nearly all of it")
        #expect(script(everyDay.filter { !(10..<16).contains($0) }, folders: six).form == .comet, "six days away")
        #expect(script(everyDay.filter { !(10..<14).contains($0) }, folders: six).form == .spiral, "four days away isn't a burst")
        #expect(script(Array(stride(from: 0, to: 30, by: 3)), folders: six).form == .comet, "more days away than writing")
        #expect(script(everyDay, folders: [""]).form == .comet, "no folders: there's only the month to draw")
        // The same notebook is always the same thing, and the three demo people aren't all alike.
        let people = (1...3).map { FilmScript(FilmDemo.notebook(days: 35, now: Self.now, person: $0), calendar: Self.cal) }
        #expect(people[0].form == .comet, "the student was away for a week")
        #expect(people[1].form != .comet, "the founder wrote all month")
        #expect(FilmScript(FilmDemo.notebook(days: 35, now: Self.now, person: 2), calendar: Self.cal).form == people[1].form)
        // How much work is in it: every time a note was written in, by anyone.
        let usual = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true), calendar: Self.cal)
        let livesInIt = FilmScript(FilmDemo.notebook(days: 35, now: Self.now, heavy: true, work: 8), calendar: Self.cal)
        #expect(usual.work == usual.nodes.map(\.edits.count).reduce(0, +))
        #expect(livesInIt.work > usual.work * 3)
    }

    @Test func theRealisticDemoIsAMonthAsNotebooksAreReallyUsed() {
        // A new note about once a week, each written in on up to every other day, and an edit is
        // what the server keeps of a day's work in a note: a version or a few, never dozens.
        let input = FilmDemo.real(days: 35, now: Self.now)
        #expect((5...9).contains(input.notes.count))
        let perDay = Dictionary(grouping: input.notes.flatMap(\.edits), by: { Self.cal.startOfDay(for: $0.at) }).mapValues(\.count)
        #expect((perDay.values.max() ?? 0) <= 12)
        for n in input.notes {
            let alive = Self.now.timeIntervalSince(n.created) / 86_400
            #expect(Double(n.edits.count) <= alive * 0.9 + 4, "about every other day, a version or two each time")
        }
        #expect(input.notes.allSatisfy { $0.edits.first?.at == $0.created && $0.edits.map(\.at) == $0.edits.map(\.at).sorted() })
        #expect(FilmDemo.real(days: 35, now: Self.now, dailyNote: true).notes.count > 25, "someone who keeps a note for each day")
        // At a note a week a month isn't notes enough for the film as the bar stands.
        #expect(!FilmEligibility.isReady(input, calendar: Self.cal))
        #expect(FilmScript(input, calendar: Self.cal).form == .nebula, "a few folders: a cloud for each")
    }

    @Test func aNotebookGrowsAndShrinksAndWhatWasBroughtInArrivesTogether() {
        // Someone who came with twenty notes, made about fifteen, threw twelve of those out again
        // and writes in a tracker every day.
        let input = FilmDemo.real(days: 35, now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true)
        let script = FilmScript(input, calendar: Self.cal)
        let gone = input.notes.filter { $0.removed != nil }.count
        #expect(gone >= 8 && script.stats.removed == gone)
        #expect(script.stats.notes == input.notes.count - gone, "what's been removed isn't counted")
        // Each one that leaves has been there long enough to be seen, and leaves while the film runs.
        for n in script.nodes { if let g = n.gone { #expect(g >= n.birth + 0.5 - 1e-9 && g <= script.growth) } }
        #expect(script.nodes.filter { $0.gone != nil }.count == gone)
        // What was brought in arrives together, in about a second, and day one isn't stretched for it.
        let brought = script.nodes.filter(\.imported)
        #expect(brought.count == 20 && (brought.map(\.birth).max() ?? 9) <= 1.3)
        #expect(script.nodes.filter { !$0.imported && $0.birth > 1.5 }.count >= 8, "the month's own notes come after")
        // The tracker is written in on every day they were there.
        let most = input.notes.max { $0.edits.count < $1.edits.count }
        #expect(most?.folder == "Habits" && (most?.edits.count ?? 0) >= 20)
        // A film saved before notes could be removed still opens.
        let old = try? JSONDecoder().decode(FilmNote.self, from: Data(#"{"id":"00000000-0000-4000-8000-000000000001","folder":"","created":0,"edits":[],"links":[]}"#.utf8))
        #expect(old != nil && old?.removed == nil && old?.imported == nil)
    }

    @Test func itsOnlyOfferedToSomeoneWhosWrittenInIt() {
        // Notes enough isn't use: forty notes brought in on eight days and never written in isn't
        // a month of Pinto, nor is writing in one of them once.
        let d = Self.now
        func at(_ daysAgo: Double) -> Date { d.addingTimeInterval(-daysAgo * 86_400) }
        func ready(_ notes: [FilmNote]) -> Bool { FilmEligibility.isReady(FilmInput(notes: notes, now: d), calendar: Self.cal) }
        func written(_ notes: [FilmNote]) -> Int { FilmStats(FilmInput(notes: notes, now: d), calendar: Self.cal).written }
        var notes = (0..<40).map { k in FilmNote(id: UUID(), folder: "Work", created: at(Double(k % 8) + 1), edits: [FilmEdit(at: at(Double(k % 8) + 1), ai: nil)], links: [], imported: true) }
        notes[0].created = at(30)
        #expect(written(notes) == 0 && !ready(notes))
        notes[1].edits.append(FilmEdit(at: at(0.5), ai: nil))
        #expect(written(notes) == 1 && !ready(notes))
        // What an AI wrote isn't your own use of it...
        var withAI = notes
        withAI[2].edits.append(FilmEdit(at: at(0.4), ai: "ChatGPT"))
        #expect(written(withAI) == 1 && !ready(withAI))
        // ...and twice yourself is.
        notes[2].edits.append(FilmEdit(at: at(0.4), ai: nil))
        #expect(written(notes) == FilmEligibility.minEdits && ready(notes))
        // A note you made here counts from its first words.
        #expect(written([FilmNote(id: UUID(), folder: "", created: at(3), edits: [FilmEdit(at: at(3), ai: nil)], links: [])]) == 1)
    }

    @Test func beforeTheFilmAnIntroAndTwoSlidesAboutYou() {
        // A month like Emil's: notes brought in, a tracker filled in every evening, mostly late.
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let script = FilmScript(mine, calendar: Self.cal)
        var slides = FilmSlides(input: mine, script: script, mark: nil)
        #expect(slides.slides().map(\.name) == ["start", "top-notes", "when", "play"])
        // It begins by welcoming you, by name when your profile has one (Emil, 11-11: "more welcoming
        // into Pinto Notes, acknowledging you"), and says where you started: the notes you brought.
        #expect(slides.slides()[0].spoken.hasPrefix("Hello. Your "))
        #expect(slides.slides()[0].spoken.contains(" with 20 notes."))
        var emil = slides
        emil.you = FilmSlides.firstName("  Emil Wagman ")
        #expect(emil.slides()[0].spoken.hasPrefix("Hi Emil. Your "))
        #expect(FilmSlides.firstName("") == nil && FilmSlides.firstName(nil) == nil)
        // It talks to you, all through (Emil, 11-11: "you", not "my", in all the text).
        #expect(slides.slides()[1].spoken.hasPrefix("Your top notes"))
        for slide in slides.slides() { #expect(!slide.spoken.contains("My ") && !slide.spoken.hasPrefix("I ") && !slide.spoken.contains(" I "), "\(slide.spoken)") }
        #expect(FilmSlides.cardLine(mine, script: script).hasPrefix("You brought 20 notes in on "))
        // Its date never breaks over two lines.
        #expect(FilmSlides.cardLine(mine, script: script).contains(/(January|February|March|April|May|June|July|August|September|October|November|December)\u{00A0}\d/))
        #expect(FilmSlides.story(mine, script: script).hasPrefix("From 20 notes brought in on "))
        // The top notes are the most written in, by name, none twice; a removed note isn't one.
        let ranked = slides.ranked
        #expect(ranked.count == 5 && Set(ranked.map(\.name)).count == 5)
        #expect(ranked.map(\.note.edits.count) == ranked.map(\.note.edits.count).sorted(by: >))
        #expect(ranked.allSatisfy { $0.note.removed == nil })
        // Written in mostly after 8 pm: a night owl, or an evening writer, never a morning one.
        #expect(["You're a night", "You're an evening"].contains(FilmSlides.kind(startingAt: slides.bestHours).0))
        #expect(FilmSlides.kind(startingAt: 6).1 == "bird" && FilmSlides.kind(startingAt: 22).1 == "owl")
        #expect(FilmSlides.hourName(0) == "midnight" && FilmSlides.hourName(21) == "9 pm" && FilmSlides.hourName(24) == "midnight")
        // A note that may not be named (locked, gone) is left off the list, not shown blank.
        let hidden = ranked[0].note.id
        let named = FilmSlides(input: mine, script: script, mark: nil) { n in n.id == hidden ? nil : "Note" }
        #expect(!named.ranked.contains { $0.note.id == hidden })
        // Drawn for a phone it's the phone's shape, so it fills the screen and never sizes the layout
        // around it (a picture that did pushed Next and Send off the bottom).
        slides.H = 2622.0 / 1206 * 1080
        #expect(slides.image(0, pixels: 1206).map { [$0.width, $0.height] } == [1206, 2622])
        #expect(slides.image(4, pixels: 1080) == nil)
        // With room left for the Next button under it, the picture stays over the words and under the mark.
        var phone = slides
        phone.bottom = 34 * 1080 / 402 + 70 + 64 * 1080 / 402
        #expect(phone.band.0 > phone.bottom + 480 && phone.band.1 < phone.H - phone.top - 70)
        // A month with no names to show gets no list: the film's sky and its play button.
        let quiet = FilmDemo.real(days: 30, now: Self.now, ai: nil)
        let qs = FilmScript(quiet, calendar: Self.cal)
        let few = FilmSlides(input: quiet, script: qs, mark: nil) { _ in nil }.slides().map(\.name)
        #expect(few.first == "start" && few.last == "play" && !few.contains("top-notes"))
        #expect(FilmSlides(input: quiet, script: qs, mark: nil).slides()[0].spoken.hasSuffix(" with your first note."))
        #expect(FilmSlides.cardLine(quiet, script: qs).hasPrefix("You wrote your first note on "))
    }

    @Test func theSlidesAreInTheFilmsSkyWithFloatingCloudsAndTheWallOfNamesAlwaysFits() throws {
        // Emil, 11-11: "the first slides could look better". The first is your notes by name.
        let width = 948.0, height = 800.0
        // A few: all of them, large, every row inside the page and the rows inside the space.
        let few = (1...20).map { "Note number \($0)" }
        let small = FilmSlides.wall(few, count: 20, width: width, height: height)
        #expect(small.rows.flatMap { $0 }.map(\.0) == few)
        func fits(_ w: (size: Double, rows: [[(String, Double)]])) -> Bool {
            let gap = w.size * 0.34
            return w.rows.allSatisfy { $0.map(\.1).reduce(0, +) + Double($0.count - 1) * gap <= width + 0.001 }
                && Double(w.rows.count) * (w.size * 1.75 + gap) - gap <= height
        }
        #expect(fits(small))
        // Hundreds, some without a name that may be shown: as many as fit, and the last slip counts
        // the rest, so the slips and the count add up to every note brought in.
        let many = (1...400).map { "A longer note title \($0)" }
        let big = FilmSlides.wall(many, count: 450, width: width, height: height)
        #expect(fits(big) && big.size < small.size)
        let slips = big.rows.flatMap { $0 }.map(\.0)
        let more = slips.last.flatMap { Int($0.dropFirst(2).prefix { $0.isNumber }) }
        #expect(slips.last?.hasSuffix(" more") == true && more.map { $0 + slips.count - 1 } == 450)
        // Every slide is set in the film's own night sky, the one its card is and the film opens on
        // (Emil, 11-11: "video is great", the slides' coloured paper wasn't).
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let script = FilmScript(mine, calendar: Self.cal)
        var slides = FilmSlides(input: mine, script: script, mark: nil)
        func patch(_ image: CGImage?) -> [Double] {
            // The top right, clear of the clouds and the mark; a patch, so a star doesn't count.
            guard let image, let patch = image.cropping(to: CGRect(x: image.width - 8, y: 2, width: 6, height: 6)) else { return [] }
            var px = [UInt8](repeating: 0, count: 4)
            let ctx = CGContext(data: &px, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
            ctx.interpolationQuality = .medium
            ctx.draw(patch, in: CGRect(x: 0, y: 0, width: 1, height: 1))
            return px.map(Double.init)
        }
        func apart(_ a: [Double], _ b: [Double]) -> Double { zip(a, b).map { abs($0 - $1) }.reduce(0, +) }
        let film = GalaxyScene.sky(script), filmRGB = [film >> 16 & 0xFF, film >> 8 & 0xFF, film & 0xFF].map(Double.init)
        let all = slides.slides()
        for k in all.indices {
            let seen = patch(slides.image(k, pixels: 200, slides: all))
            #expect(apart(Array(seen.prefix(3)), filmRGB) < 12, "\(all[k].name) is in the film's sky: \(seen)")
        }
        // In the app the sky and its clouds are under the slides, floating on their own: a slide
        // is then clear where the sky shows (only its grain), and each cloud is a picture of its own.
        slides.cloudsApart = true
        let clear = slides.slides()
        for k in clear.indices { #expect(patch(slides.image(k, pixels: 200, slides: clear))[3] < 40, "\(clear[k].name) leaves the sky to the app") }
        for i in FilmSlides.clouds.indices {
            let cloud = try #require(slides.cloudImage(i, scale: 0.2))
            #expect(abs(Double(cloud.width) - FilmSlides.cloudSide(i) * 0.2) <= 1)
            #expect(patch(cloud)[3] == 0, "cloud \(i)'s corner is clear")
            let middle = try #require(cloud.cropping(to: CGRect(x: cloud.width / 2 - 3, y: cloud.height / 2 - 3, width: 6, height: 6)))
            #expect(patch(middle)[3] == 255, "cloud \(i) is paper in its middle")
        }
        // They're always moving, really subtly (Emil, 11-11): a few points at most, a hint of a
        // turn, each on its own rhythm, and they never drift away.
        var moved = [0.0, 0.0]
        for step in 0..<600 {
            let clock = Double(step) * 0.1
            for i in FilmSlides.clouds.indices {
                let f = FilmSlides.float(i, at: clock)
                #expect(abs(f.x) <= 14 && abs(f.y) <= 11 && abs(f.turn) <= 0.006)
                moved[i] = max(moved[i], hypot(f.x - FilmSlides.float(i, at: 0).x, f.y - FilmSlides.float(i, at: 0).y))
            }
        }
        #expect(moved.allSatisfy { $0 > 8 })
        #expect(FilmSlides.float(0, at: 3) != FilmSlides.float(1, at: 3))
        let rest = slides.cloudPlace(0), later = slides.cloudPlace(0, at: 1000)
        #expect(hypot(rest.middle.x - later.middle.x, rest.middle.y - later.middle.y) <= 18)
        // One name too long for a row has a row to itself, cut to the page.
        let long = FilmSlides.wall([String(repeating: "Very long title ", count: 20)], count: 1, width: width, height: height)
        #expect(long.rows.count == 1 && fits(long))
    }

    @Test func theSlidesTakeTheirTimeAndTheTopNotesCountDown() throws {
        // Emil, 11-11: "this animates too fast, we need to make sure that things last", and the top
        // notes should "show up more one by one": a countdown from the fifth to yours, then its name.
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let slides = FilmSlides(input: mine, script: FilmScript(mine, calendar: Self.cal, bang: true), mark: nil)
        let all = slides.slides()
        let length = Dictionary(uniqueKeysWithValues: all.map { ($0.name, $0.length) })
        #expect(length["start"]! >= 3 && length["top-notes"]! >= 4 && length["when"]! >= 4, "\(length)")
        // Your top note is in gold: none of it until the others have come in, then all of it.
        let k = try #require(all.firstIndex { $0.name == "top-notes" })
        func gold(_ t: Double) throws -> Int {
            let image = try #require(slides.image(k, at: t, pixels: 270, slides: all))
            var px = [UInt8](repeating: 0, count: image.width * image.height * 4)
            let ctx = CGContext(data: &px, width: image.width, height: image.height, bitsPerComponent: 8, bytesPerRow: image.width * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
            ctx.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
            return stride(from: 0, to: px.count, by: 4).filter { px[$0] > 230 && px[$0 + 1] > 170 && px[$0 + 1] < 215 && px[$0 + 2] < 120 }.count
        }
        #expect(try gold(1.5) == 0, "the fifth to the second come first")
        #expect(try gold(length["top-notes"]! + 1) > 200)
    }

    @Test func aSlideFrameWithItsKeptPaperIsTheSameAsOneDrawnWhole() throws {
        // Every slide frame is full size, quick because the still paper is drawn once and kept (11-11);
        // a frame made that way must be the frame itself.
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let slides = FilmSlides(input: mine, script: FilmScript(mine, calendar: Self.cal, bang: true), mark: nil)
        let all = slides.slides(), px = 240, height = Int((Double(px) * slides.H / slides.W).rounded())
        func bytes(_ i: CGImage) -> [UInt8] {
            var b = [UInt8](repeating: 0, count: px * height * 4)
            let c = CGContext(data: &b, width: px, height: height, bitsPerComponent: 8, bytesPerRow: px * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
            c.draw(i, in: CGRect(x: 0, y: 0, width: px, height: height)); return b
        }
        // What's shown is a plain image with its pixels read out, not one still tied to its context.
        let frame = try #require(slides.image(0, at: 0.5, pixels: px, slides: all))
        #expect(frame.dataProvider?.data != nil && frame.width == px && frame.height == height)
        for k in all.indices {
            #expect(all[k].back != nil, "\(all[k].name) keeps its paper")
            for t in [0.05, 0.6, 5.0] {
                let kept = try #require(slides.image(k, at: t, pixels: px, slides: all))
                let whole = try #require(FilmRenderer.context(width: px, height: height))
                whole.scaleBy(x: Double(px) / slides.W, y: Double(px) / slides.W)
                all[k].back?(whole); all[k].draw(whole, t)
                let a = bytes(kept), b = bytes(try #require(whole.makeImage()))
                let off = zip(a, b).reduce(0) { $0 + abs(Int($1.0) - Int($1.1)) }
                #expect(Double(off) / Double(a.count) < 0.5, "\(all[k].name) at \(t): \(off)")
            }
        }
    }

    @Test func afterPlayThePlaySlideStaysUntilTheFilmsFirstFrameIsUp() {
        // Emil, 11-11: the film came in over black for over a second after play.
        let waiting = NotebookFilmView.layers(.watching, galaxy: true, filmUp: false)
        #expect(waiting.slides && !waiting.stage && !waiting.intro, "the play slide, never black")
        // The film fades in over the play slide, which stays under it till it's covered: two
        // pictures fading against each other over black would dim in the middle.
        let fading = NotebookFilmView.layers(.watching, galaxy: true, filmUp: true)
        #expect(fading.slides && fading.stage)
        let up = NotebookFilmView.layers(.watching, galaxy: true, filmUp: true, filmCovers: true)
        #expect(!up.slides && up.stage)
        let slides = NotebookFilmView.layers(.intro, galaxy: true, filmUp: false)
        #expect(slides.slides && !slides.stage && !slides.intro)
        // Watching again from the share screen: the film is already up.
        let again = NotebookFilmView.layers(.share, galaxy: true, filmUp: true, filmCovers: true)
        #expect(again.stage && !again.slides)
        // The other looks keep their intro, then the film.
        let other = NotebookFilmView.layers(.intro, galaxy: false, filmUp: false)
        #expect(other.intro && !other.slides && !other.stage)
        #expect(NotebookFilmView.layers(.watching, galaxy: false, filmUp: false).stage)
    }

    @Test func itsCardShowsYourOwnGalaxyOnTheFilmsSky() throws {
        // Emil, 11-11: the card that opens it was "a bit boring". It's the film's sky now, with your
        // galaxy as the month leaves it, its edge the card's own colour so there's no seam.
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let script = FilmScript(mine, calendar: Self.cal, bang: true)
        let image = try #require(GalaxyScene.poster(script, pixels: 120))
        #expect(image.width == 120 && image.height == 120)
        var px = [UInt8](repeating: 0, count: 120 * 120 * 4)
        let ctx = CGContext(data: &px, width: 120, height: 120, bitsPerComponent: 8, bytesPerRow: 480, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: 120, height: 120))
        let sky = GalaxyScene.sky(script)
        let want = [Int(sky >> 16 & 0xFF), Int(sky >> 8 & 0xFF), Int(sky & 0xFF)]
        let corner = px.prefix(3).map(Int.init)
        #expect(zip(corner, want).allSatisfy { abs($0 - $1) <= 12 }, "corner \(corner), sky \(want)")
        // Its whole left edge is the card's plain sky: on the card, a seam showed where the picture
        // began, its clouds a shade lighter than the sky beside them (Emil's screenshot, 11-11).
        let seam = (0..<120).map { y in (0..<3).map { abs(Int(px[y * 480 + $0]) - want[$0]) }.max()! }.max()!
        #expect(seam <= 3, "left edge off the sky by \(seam)")
        // It says what it is and how long: a month, or more (Emil, 11-11).
        #expect(NotebookFilmStore.cardTitle(script.stats) == "Your first month with Pinto Notes")
        let longer = FilmScript(FilmDemo.real(days: 92, now: Self.now), calendar: Self.cal)
        #expect(NotebookFilmStore.cardTitle(longer.stats) == "Your first 3 months with Pinto Notes")
        #expect(FilmCard.line == "Take a look back" && FilmCard.button == "Show")
        // ...and stars in it: plenty of pixels far brighter than the sky.
        let bright = stride(from: 0, to: px.count, by: 4).filter { Int(px[$0]) + Int(px[$0 + 1]) + Int(px[$0 + 2]) > 420 }.count
        #expect(bright > 40, "\(bright) bright pixels")
    }

    @Test func itOpensOnAnEmptySkyThenWhatYouBroughtArrivesAtOnce() {
        // Emil, 11-10: "keep it empty and then a big bang happens".
        let mine = FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true)
        let plain = FilmScript(mine, calendar: Self.cal)
        let bang = FilmScript(mine, calendar: Self.cal, bang: true)
        let lead = FilmScript.lead, hold = FilmScript.bangHold
        // Emil, 11-11: "maybe there should be multiple small big bangs". One for each folder of
        // what was brought in (and each subfolder big enough to show), the folder bringing most
        // first, all within the cascade.
        let groups = Set(bang.nodes.filter(\.imported).map { "\($0.folder)/\($0.sub)" })
        #expect(bang.bangs.count == groups.count && bang.bangs.count > 1)
        var total: [Int: Int] = [:]
        for b in bang.bangs { total[b.folder, default: 0] += b.count }
        var order: [Int] = []
        for b in bang.bangs where !order.contains(b.folder) { order.append(b.folder) }
        #expect(bang.bangAt == lead && order.map { total[$0]! } == order.map { total[$0]! }.sorted(by: >))
        #expect(zip(bang.bangs, bang.bangs.dropFirst()).allSatisfy { $1.at > $0.at + 0.1 }, "one after another, never together")
        let last = bang.bangs.last!.at
        #expect(last <= lead + FilmScript.cascade + 1e-9 && abs(bang.opening - (last + hold)) < 1e-9)
        #expect(abs(bang.growth - (plain.growth + bang.opening)) < 1e-9, "the month itself keeps its length")
        // Nothing in the sky before the first...
        #expect(bang.nodes.allSatisfy { $0.birth >= lead - 1e-9 })
        // ...then each folder's notes all within a third of a second of its own burst...
        for b in bang.bangs {
            let born = bang.nodes.filter { $0.imported && $0.folder == b.folder && $0.sub == b.sub }.map(\.birth)
            #expect(born.count == b.count && born.allSatisfy { $0 >= b.at - 1e-9 && $0 <= b.at + 0.3 + 1e-9 })
        }
        #expect(bang.nodes.filter(\.imported).count == 20 && bang.bangs.map(\.count).reduce(0, +) == 20)
        // ...and your own notes only once the last has settled.
        #expect(bang.nodes.filter { !$0.imported }.allSatisfy { $0.birth >= bang.opening - 1e-9 })
        // (Notes still arrive in order, whatever order they were made in.)
        #expect(zip(bang.nodes, bang.nodes.dropFirst()).allSatisfy { $0.birth <= $1.birth })
        // A big knowledge base still takes no longer to arrive: four folders, at most the cascade.
        let kb = FilmScript(FilmDemo.real(now: Self.now, notesPerWeek: 22, imported: 240, removed: 8, linked: 0.6), calendar: Self.cal, bang: true)
        #expect(kb.bangs.count >= 3 && kb.opening <= lead + FilmScript.cascade + hold + 1e-9)
        // A notebook with nothing brought in still opens on the empty sky, and has no burst.
        let own = FilmScript(FilmDemo.real(days: 30, now: Self.now, ai: nil), calendar: Self.cal, bang: true)
        #expect(own.bangAt == nil && own.opening == lead && own.nodes.first.map { abs($0.birth - lead) < 1e-9 } == true)
        // Slower than it was: even a thin month grows for nine seconds.
        #expect(FilmScript.thinGrowth >= 9 && plain.growth >= 9)
        // In the app it has its sound, and ends on what the notebook is, not "my first month".
        let store = NotebookFilmStore(defaults: UserDefaults(suiteName: "film-end-\(UUID().uuidString)")!, launched: Self.now, arguments: [],
                                      folder: FileManager.default.temporaryDirectory.appendingPathComponent("film-end-\(UUID().uuidString)"))
        let labels = store.labels(look: .town, folderNames: true)
        #expect(labels.sound && labels.endTitle?(plain.stats).hasPrefix("Your notebook is ") == true)
        // Its sound lasts as long as the film, and is never silent or clipped.
        let sound = FilmSound(script: bang).samples()
        #expect(abs(Double(sound.count / 2) / FilmSound.rate - (bang.growth + FilmScript.outro)) < 0.01)
        let peak = sound.map { abs($0) }.max() ?? 0
        #expect(peak > 0.5 && peak <= 0.9)
    }

    @Test func theGalaxysCameraGlidesAndKeepsEverythingInTheFrame() {
        // Emil, 11-11: "camera movement has always been a bit janky". The zoom was fitted afresh
        // each frame, so it jumped whenever a note landed further out or a folder began: by up to
        // a third in one frame. Now it follows a path that sees what's coming.
        let canvas = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
        let people = [FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true),
                      FilmDemo.real(now: Self.now, notesPerWeek: 22, imported: 240, removed: 8, linked: 0.6),
                      FilmDemo.notebook(days: 35, now: Self.now, heavy: true), FilmDemo.real(now: Self.now)]
        for input in people {
            let script = FilmScript(input, calendar: Self.cal, bang: true)
            for form in [FilmForm.spiral, .nebula] {
                let scene = GalaxyScene(script: script, names: true, seed: script.seed, form: form)
                let frames = Int((script.growth + FilmScript.outro) * Double(FilmScript.fps))
                let shots = (0..<frames).map { scene.shot(at: Double($0) / Double(FilmScript.fps), canvas: canvas) }
                let zoom = shots.map { log($0.zoom) }
                let step = zip(zoom.dropFirst(), zoom).map { abs($0 - $1) }.max() ?? 0
                let turn = (2..<frames).map { abs(zoom[$0] - 2 * zoom[$0 - 1] + zoom[$0 - 2]) }.max() ?? 0
                let slide = zip(shots.dropFirst(), shots).map { hypot($0.centre.x - $1.centre.x, $0.centre.y - $1.centre.y) * $0.zoom }.max() ?? 0
                #expect(step < 0.007, "\(form): never more than a little closer or further in a frame (\(step))")
                #expect(turn < 0.002, "\(form): it eases into a move and out of it, never lurches (\(turn))")
                #expect(slide < 4, "\(form): and never lurches sideways (\(slide))")
                // (Easing never costs what's in it: everything stays in the frame, give or take its margin.)
                #expect(shots.map(\.spill).max() ?? 0 < 30, "\(form): nothing leaves the frame")
            }
        }
    }

    @Test func aSpiralArmFormsOnlyWhereSoMuchIsGoingOnThatItBlends() {
        // Emil, 11-11: the arms behind the stars came too early. In an ordinary month (a few
        // notes a folder) they're loose stars; a busy folder gets its arm, and it comes in at half
        // width, never as a thin line.
        #expect(GalaxyScene.arm(notes: 3, edits: 33).appear == 0, "Ideas in a month: three notes")
        #expect(GalaxyScene.arm(notes: 6, edits: 28).appear == 0, "Reading: six")
        #expect(GalaxyScene.arm(notes: 1, edits: 40).appear == 0, "one tracker written in every day is one star, not an arm")
        let work = GalaxyScene.arm(notes: 10, edits: 46)
        #expect(work.appear == 1 && work.width >= 0.5 && work.width < 0.7, "the month's busiest folder: an arm, still narrow")
        #expect(GalaxyScene.arm(notes: 71, edits: 180) == (1, 1), "a folder of seventy notes: the whole arm")
        // It grows in step with what's added: one more edit never moves it in a jump. (A note
        // arriving is already eased in over half a second.)
        for notes in [4.0, 9.0, 20.0] {
            var last = GalaxyScene.arm(notes: notes, edits: 0)
            for k in 1...300 {
                let now = GalaxyScene.arm(notes: notes, edits: k)
                #expect(now.appear >= last.appear && now.appear - last.appear < 0.05 && now.width >= last.width)
                last = now
            }
        }
    }

    @Test func foldersInsideFoldersAreTheirOwnCloudsAndBurstOnTheirOwn() {
        // Emil, 11-11: "I also want sub folders".
        let kb = FilmScript(FilmDemo.real(now: Self.now, notesPerWeek: 22, imported: 240, removed: 8, linked: 0.6), calendar: Self.cal, bang: true)
        let names = Set(kb.subfolders.map { "\(kb.folders[$0.folder])/\($0.name)" })
        #expect(names == ["Work/Clients", "Work/Meetings", "Home/Recipes", "Reading/Books", "Reading/Articles"])
        // Each has a burst of its own, right after its folder's: never one from another folder between.
        for (k, b) in kb.bangs.enumerated() where b.sub >= 0 {
            #expect(kb.subfolders[b.sub].folder == b.folder && k > 0 && kb.bangs[k - 1].folder == b.folder)
        }
        #expect(kb.bangs.filter { $0.sub >= 0 }.count == names.count)
        // A subfolder of two or three notes is shown as part of its folder: a name for two stars was clutter.
        let month = FilmScript(FilmDemo.real(now: Self.now, notesPerWeek: 3.4, imported: 20, removed: 12, habit: true, evening: true), calendar: Self.cal, bang: true)
        for sub in month.subfolders.indices {
            #expect(month.nodes.filter { $0.sub == sub }.count >= FilmScript.subfolderLeast)
        }
        #expect(month.subfolders.count < 5)
        // In the nebula a subfolder's notes gather in a cloud of their own inside their folder's:
        // all of them nearer their middle than any other note of that folder is.
        let canvas = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
        let scene = GalaxyScene(script: kb, names: true, seed: kb.seed, form: .nebula)
        let at = scene.placed(at: kb.growth, canvas: canvas)
        for sub in kb.subfolders.indices {
            let mine = kb.nodes.indices.filter { kb.nodes[$0].sub == sub && kb.nodes[$0].gone == nil }
            let others = kb.nodes.indices.filter { kb.nodes[$0].folder == kb.subfolders[sub].folder && kb.nodes[$0].sub != sub && kb.nodes[$0].gone == nil }
            let mid = CGPoint(x: mine.map { at[$0].x }.reduce(0, +) / Double(mine.count), y: mine.map { at[$0].y }.reduce(0, +) / Double(mine.count))
            let reach = mine.map { hypot(at[$0].x - mid.x, at[$0].y - mid.y) }.max() ?? 0
            let nearest = others.map { hypot(at[$0].x - mid.x, at[$0].y - mid.y) }.min() ?? .infinity
            #expect(reach < nearest, "\(kb.subfolders[sub].name) is a cluster of its own")
        }
        // A film saved before subfolders still opens.
        let old = try? JSONDecoder().decode(FilmNote.self, from: Data(#"{"id":"00000000-0000-4000-8000-000000000001","folder":"Work","created":0,"edits":[],"links":[]}"#.utf8))
        #expect(old != nil && old?.subfolder == nil)
    }

    @Test func namesNeverLieOverOneAnotherHoweverManyFoldersThereAre() {
        // The stress lab, 11-11: forty folders round a phone's picture were a wall of slips, some
        // on others, and twenty folders brought in at once piled their names on the burst.
        let d = Self.now
        func note(_ k: Int, folder: String, daysAgo: Double, imported: Bool = false) -> FilmNote {
            let made = d.addingTimeInterval(-daysAgo * 86_400)
            return FilmNote(id: UUID(), folder: folder, created: made, edits: [FilmEdit(at: made, ai: nil), FilmEdit(at: made.addingTimeInterval(3600 * Double(1 + k % 5)), ai: nil)], links: [], imported: imported ? true : nil)
        }
        let forty = (0..<200).map { note($0, folder: "Folder \($0 % 40 + 1)", daysAgo: 34 - Double($0) * 0.17) }
        let brought = (0..<600).map { note($0, folder: ["Health", "Taxes", "Travel", "Car", "Recipes", "Garden", "Books", "Music", "Money", "Family", "Thesis", "Running", "Journal", "Ideas", "Clients", "Meetings", "Reading", "Home", "Work", "Notes"][$0 % 20], daysAgo: 400, imported: true) }
            + (0..<40).map { note($0, folder: "Work", daysAgo: 30 - Double($0) * 0.7) }
        let canvas = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
        for (what, notes) in [("forty folders", forty), ("twenty brought in at once", brought)] {
            let script = FilmScript(FilmInput(notes: notes, now: d), calendar: Self.cal, bang: true)
            var scene: GalaxyScene?
            var labels = FilmRenderer.Labels()
            labels.look = .town
            labels.scene = { s, names in let g = GalaxyScene(script: s, names: names, seed: s.seed); g.inspect = true; scene = g; return g }
            labels.startsAtFirstNote = true
            labels.openingTitle = false
            let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .brief)
            let ctx = FilmRenderer.context(width: 180, height: 390)!
            var frame = 0, most = 0
            while !renderer.isDone {
                if frame % 3 == 0 {
                    renderer.drawNext(in: ctx)
                    let shown = scene?.inspected.names.filter { $0.alpha > 0.5 } ?? []
                    most = max(most, shown.count)
                    for a in shown.indices { for b in shown.indices where b > a {
                        #expect(!shown[a].box.insetBy(dx: 2, dy: 2).intersects(shown[b].box.insetBy(dx: 2, dy: 2)), "\(what): \(shown[a].name) on \(shown[b].name) at frame \(frame)")
                    } }
                } else { renderer.skip() }
                frame += 1
            }
            #expect(most <= GalaxyScene.namesMost, "\(what): the largest folders are named, not every one (\(most))")
        }
    }

    @Test func aLongFolderNameIsCutShortNeverOffTheEdge() {
        // The stress lab, 11-11: "Most written in Product research 2026 and beyond · 63 notes"
        // ran off the end card. The name is cut short; the count always shows.
        let d = Self.now
        let long = "Product research 2026 and beyond, and everything after it"
        let notes = (0..<63).map { k -> FilmNote in
            // (Every third day, so the card's line is the folder, not a run of days.)
            let made = d.addingTimeInterval(-Double(34 - (k % 12) * 3) * 86_400)
            return FilmNote(id: UUID(), folder: k < 60 ? long : "Home", created: made, edits: [FilmEdit(at: made, ai: nil)], links: [])
        }
        let script = FilmScript(FilmInput(notes: notes, now: d), calendar: Self.cal, bang: true)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        labels.scene = { s, names in GalaxyScene(script: s, names: names, seed: s.seed) }
        labels.startsAtFirstNote = true
        labels.openingTitle = false
        let canvas = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
        let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .brief)
        let line = renderer.fitting(long, size: 38, weight: .semibold) { labels.topFolder($0, 60) }
        #expect(line.hasPrefix("Most written in Product research") && line.contains("\u{2026}") && line.hasSuffix("60 notes"), "\(line)")
        #expect(renderer.fitting("Work", size: 38, weight: .semibold) { labels.topFolder($0, 60) } == "Most written in Work \u{00B7} 60 notes")
        // And on the card itself, nothing written reaches the picture's edge.
        let ctx = FilmRenderer.context(width: 1080, height: Int(canvas.height))!
        while renderer.frame < script.frameCount - 1 { renderer.skip() }
        renderer.drawNext(in: ctx)
        let p = ctx.data!.assumingMemoryBound(to: UInt8.self)
        var ink = 0
        for y in (ctx.height - Int(canvas.bottom + 250))..<ctx.height { for x in 1046..<1080 {
            let k = y * ctx.bytesPerRow + x * 4
            if 0.0722 * Double(p[k]) + 0.7152 * Double(p[k + 1]) + 0.2126 * Double(p[k + 2]) > 200 { ink += 1 }
        } }
        #expect(ink == 0, "\(ink) bright pixels at the right edge")
    }

    @Test func theFolderWrittenInMostIsOneThatsStillThere() {
        // The stress lab, 11-11: a folder written in a lot and then thrown out was "most written
        // in", with "0 notes".
        let d = Self.now
        func note(_ folder: String, edits: Int, removed: Bool) -> FilmNote {
            let made = d.addingTimeInterval(-20 * 86_400)
            return FilmNote(id: UUID(), folder: folder, created: made, edits: (0..<edits).map { FilmEdit(at: made.addingTimeInterval(Double($0) * 3600), ai: nil) }, links: [], removed: removed ? d.addingTimeInterval(-86_400) : nil)
        }
        let stats = FilmStats(FilmInput(notes: [note("Apartment hunt", edits: 30, removed: true), note("Apartment hunt", edits: 20, removed: true), note("Work", edits: 2, removed: false)], now: d), calendar: Self.cal)
        #expect(stats.topFolder == "Work" && stats.topFolderNotes == 1)
        let gone = FilmStats(FilmInput(notes: [note("Apartment hunt", edits: 30, removed: true)], now: d), calendar: Self.cal)
        #expect(gone.topFolder == nil)
    }

    @Test func whatComesInAtTheVeryEndIsAllThereOnTheCard() {
        // The stress lab, 11-11: a folder begun in the film's last second kept its name half faded
        // on the card (and in the shared picture), and a note made then never quite came in.
        let d = Self.now
        var notes = (0..<30).map { k -> FilmNote in
            let made = d.addingTimeInterval(-Double(34 - k) * 86_400)
            return FilmNote(id: UUID(), folder: k % 2 == 0 ? "Work" : "Home", created: made, edits: [FilmEdit(at: made, ai: nil)], links: [])
        }
        notes.append(FilmNote(id: UUID(), folder: "Late", created: d.addingTimeInterval(-60), edits: [FilmEdit(at: d.addingTimeInterval(-60), ai: nil)], links: []))
        let script = FilmScript(FilmInput(notes: notes, now: d), calendar: Self.cal, bang: true)
        let canvas = FilmCanvas.fitting(width: 393, height: 852, top: 59, bottom: 34)
        for form in [FilmForm.comet, .spiral, .nebula] {
            let scene = GalaxyScene(script: script, names: true, seed: script.seed, form: form)
            scene.inspect = true
            var labels = FilmRenderer.Labels()
            labels.look = .town
            labels.scene = { _, _ in scene }
            labels.startsAtFirstNote = true
            labels.openingTitle = false
            let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .brief)
            while renderer.frame < script.frameCount - 1 { renderer.skip() }
            renderer.drawNext(in: FilmRenderer.context(width: 180, height: 390)!)
            let late = scene.inspected.names.first { $0.name == "Late" }
            #expect(late != nil && late!.alpha > 0.95, "\(form): its name is all there (\(late?.alpha ?? -1))")
        }
    }

    @Test func everyWordOfTheFilmTalksToYouAndSharingIsTheVideo() {
        // Emil, 11-11: "you", not "my", in all the text, the film you share included. And what
        // you share is the video, and the button says so.
        let store = Self.store(TestDefaults(), account: UUID(), source: FakeSource(), folder: Self.tempFolder())
        let l = store.labels(look: .town, folderNames: true)
        let s = FilmStats(FilmDemo.real(now: Self.now), calendar: Self.cal)
        let lines = [l.you, l.title(s), l.endTitle?(s) ?? "", l.busiestCaption(4), l.topFolderCaption("Work", 9), l.streakCard(5),
                     l.daysCaption(3), l.cameBack(7), l.streakCaption(5), store.shareTitle, store.fileName]
        for line in lines {
            let words = line.split { !$0.isLetter && $0 != "\u{2019}" && $0 != "'" }.map { $0.lowercased() }
            #expect(!words.contains { ["i", "my", "me", "mine", "i\u{2019}m", "i'm"].contains($0) }, "\(line)")
        }
        #expect(l.endTitle?(s).hasPrefix("Your notebook is ") == true && l.you == "Just you")
        #expect(NotebookFilmView.shareVideo == "Share video" && NotebookFilmView.saveVideo.hasPrefix("Save video"))
        // The slides before it have a Next button (and no Share: that's for after the film); the
        // last one's play button takes its place.
        #expect(NotebookFilmView.slideButton(onPlaySlide: false) == "Next")
        #expect(NotebookFilmView.slideButton(onPlaySlide: true) == nil)
    }

    @Test func theRunningCountSaysOneNoteNotOneNotes() {
        // The stress lab, 11-11: a film's first moments read "1 notes · 1 edits".
        #expect(FilmRenderer.Labels.notesAndEdits(1, 1) == "1 note \u{00B7} 1 edit")
        #expect(FilmRenderer.Labels.notesAndEdits(1, 4) == "1 note \u{00B7} 4 edits")
        #expect(FilmRenderer.Labels.notesAndEdits(36, 61) == "36 notes \u{00B7} 61 edits")
    }

    @Test func aColourMadeOnceIsTheColourAskedFor() {
        // (Colours are kept once made, at the 8 bits a channel the picture has: a big notebook
        // made a new one for every star on every frame.)
        for (r, g, b, a) in [(0.2, 0.4, 0.6, 0.5), (1.0, 0.0, 0.31, 1.0), (0.0, 0.0, 0.0, 0.0), (1.3, -0.2, 0.5, 0.99)] {
            let c = FilmRenderer.RGB(r, g, b).cg(a)
            let want = [r, g, b, a].map { min(1, max(0, $0)) }
            #expect(c === FilmRenderer.RGB(r, g, b).cg(a), "made once")
            #expect(zip(c.components ?? [], want).allSatisfy { abs($0 - $1) <= 0.5 / 255 + 1e-9 }, "\(c)")
            #expect(c.colorSpace?.name == CGColorSpace.sRGB)
        }
    }

    @Test func theSharedMovieCarriesTheSound() async throws {
        // The movie that's shared has the film's sound, as long as its picture.
        let quiet = FilmDemo.real(days: 30, now: Self.now, ai: nil)
        let script = FilmScript(quiet, calendar: Self.cal, bang: true)
        var labels = FilmRenderer.Labels()
        labels.look = .town
        labels.startsAtFirstNote = true
        labels.sound = true
        labels.scene = { script, names in GalaxyScene(script: script, names: names, seed: script.seed) }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("film-sound-\(UUID().uuidString).mp4")
        defer { try? FileManager.default.removeItem(at: url) }
        try await FilmVideo.write(FilmRenderer(script: script, labels: labels), to: url)
        let asset = AVURLAsset(url: url)
        let audio = try await asset.loadTracks(withMediaType: .audio), video = try await asset.loadTracks(withMediaType: .video)
        #expect(audio.count == 1 && video.count == 1)
        let length = try await asset.load(.duration).seconds
        #expect(abs(length - (script.growth + FilmScript.outro)) < 0.2)
        if let a = audio.first { #expect(try await a.load(.timeRange).duration.seconds > script.growth) }
    }

    @Test func theFilmBeginsAtTheFirstNote() {
        // Not at the midnight before it: there's never a frame of an empty month with "0 notes".
        let script = FilmScript(FilmDemo.notebook(days: 35, now: Self.now), calendar: Self.cal)
        #expect(script.nodes.first?.birth == 0)
        #expect(script.date(at: 0) == FilmDemo.notebook(days: 35, now: Self.now).notes.map(\.created).min())
        // And in the app the town starts with its first houses there, as the intro shows it.
        let town = TownScene(script: script, folderNames: true)
        // ...with one whole house: the first notes come one at a time, however close together they were made.
        #expect(script.nodes.filter { $0.birth <= town.appStart }.count == 1)
        #expect(script.nodes[1].birth >= 0.3 && script.nodes[2].birth >= script.nodes[1].birth + 0.2)
        #expect(script.nodes.map(\.birth) == script.nodes.map(\.birth).sorted())
        #expect(script.nodes.allSatisfy { n in n.edits.allSatisfy { $0 >= n.birth } }, "nothing is written in before it's there")
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
            #expect(look == .paper || look == .town || look == .cream ? corner > 600 : corner < 200, "\(look) has its own background")
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
