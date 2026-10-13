import Foundation
import SwiftData
import Testing
@testable import Pane

/// A library of 20,000 notes on disk, opened cold, as the app opens it at launch: what each piece of
/// work that reads the whole library costs on the main thread. In-memory stores (the other timing
/// tests) never fault a note in from SQLite, which is where large libraries spend their time.
///
/// The store is written once per test run (about 20 s), then each test opens it in a container of
/// its own, so nothing a test before it read is still in memory.
@MainActor @Suite(.serialized) struct LargeLibraryTests {
    static let count = 20_000

    /// The store's folder, made the first time a test asks for it: 800 folders three deep, every
    /// 20th note a sub-note, every 50th note with a wiki link, every note a few lines long.
    static let store: URL = {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("LargeLibraryTests-\(ProcessInfo.processInfo.processIdentifier)")
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent("library.store")
        let c = try! ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let ctx = ModelContext(c)
        ctx.autosaveEnabled = false
        var folders: [Folder] = []
        for i in 0..<800 {
            let f = Folder(name: "Folder \(i)", parent: i < 8 ? nil : folders[(i * 3) % min(i, 40)], sortIndex: Double(i))
            f.dirty = false
            f.serverVersion = 1
            ctx.insert(f)
            folders.append(f)
        }
        var last: Note?
        for i in 0..<count {
            let link = i % 50 == 7 ? "\nSee [[Note \(i - 7)]] for more.\n" : ""
            let n = Note(body: "Note \(i)\n\nSome text for note \(i), with **bold** and a list:\n- one\n- two\n\(link)\nA last line of ordinary text for note \(i).\n", folder: folders[i % folders.count])
            n.updatedAt = Date().addingTimeInterval(Double(-i * 600))
            n.isPinned = i % 97 == 0
            n.dirty = false
            n.serverVersion = 1
            if i % 20 == 19, let last { n.parentID = last.id }
            ctx.insert(n)
            last = n
            if i % 2000 == 1999 { try! ctx.save() }
        }
        try! ctx.save()
        return url
    }()

    /// The library opened afresh, as at launch.
    func open() throws -> ModelContainer {
        _ = Self.store
        WikiDirectory.invalidate()
        return try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: Self.store))
    }

    func ms(_ d: Duration) -> Double { Double(d.components.attoseconds) / 1e15 + Double(d.components.seconds) * 1000 }

    func perf(_ what: String, _ ms: Double) {
        print("PERF large library (\(Self.count) notes on disk): \(what) \(String(format: "%.0f", ms)) ms")
    }

    /// The list's first read: on the main thread it costs next to nothing (a large library is read
    /// on a context of its own), and the notes are all there once it's in.
    @Test(.timeLimit(.minutes(4))) func theListReadsTheLibrary() async throws {
        let c = try open()
        let clock = ContinuousClock()
        let notes = LibraryNotes()
        let start = clock.now
        var entries: [NoteEntry] = []
        let main = clock.measure { entries = notes.entries(in: c.mainContext) }
        perf("the list's first read, on the main thread", ms(main))
        while notes.isLoading, clock.now - start < .seconds(60) { try await Task.sleep(for: .milliseconds(5)) }
        perf("the list's first read, until the notes are in", ms(clock.now - start))
        entries = notes.entries(in: c.mainContext)
        #expect(entries.count == Self.count)
        #expect(main < .milliseconds(100), "the main thread doesn't read the library")
    }

    @Test(.timeLimit(.minutes(4))) func theSidebarCounts() throws {
        let c = try open()
        let clock = ContinuousClock()
        let t = clock.measure { _ = SidebarView.counts(in: c.mainContext) }
        perf("the sidebar's counts", ms(t))
    }

    @Test(.timeLimit(.minutes(4))) func wikiLinksOnOpeningANote() throws {
        let c = try open()
        let ctx = c.mainContext
        var first = FetchDescriptor<Note>(predicate: #Predicate { $0.parentID == nil }, sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        first.fetchLimit = 1
        let note = try #require(try ctx.fetch(first).first)
        let clock = ContinuousClock()
        let index = clock.measure { _ = WikiDirectory.scope(for: note, in: ctx) }
        perf("the wiki index, first", ms(index))
        let back = clock.measure { _ = ctx.backlinks(to: note) }
        perf("a note's backlinks", ms(back))
        let again = clock.measure { _ = WikiDirectory.scope(for: note, in: ctx); _ = ctx.backlinks(to: note) }
        perf("opening another note's links", ms(again))
    }

    @Test(.timeLimit(.minutes(4))) func savingOneNote() throws {
        let c = try open()
        let ctx = c.mainContext
        let list = LibraryNotes()
        _ = list.entries(in: ctx)
        var first = FetchDescriptor<Note>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        first.fetchLimit = 1
        let note = try #require(try ctx.fetch(first).first)
        _ = WikiDirectory.scope(for: note, in: ctx)
        let clock = ContinuousClock()
        var saves: [Double] = []
        for i in 0..<9 {
            let t = clock.measure {
                note.body += " \(i)"
                note.touch()
                try? ctx.save()
                _ = list.entries(in: ctx)
            }
            saves.append(ms(t))
        }
        perf("a save of one note (median)", PerfTiming.median(saves))
    }
}
