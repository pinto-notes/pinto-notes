#if os(macOS)
import AppKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// A heavily linked library of 20,000 notes on disk, opened cold: a hub note that 2,000 notes link
/// to and that itself links to 300, every other note linking two more. What the hub's Linked From
/// (its ••• menu) costs on the main thread as the menu is made, and what typing in it costs a
/// keystroke and a save.
@MainActor @Suite(.serialized) struct LinkedLibraryTests {
    nonisolated static let count = 20_000
    nonisolated static let linkers = 2_000

    nonisolated static let store = Task.detached(priority: .utility) { () -> URL in
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("LinkedLibraryTests-\(ProcessInfo.processInfo.processIdentifier)")
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent("library.store")
        let c = try! ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
        let ctx = ModelContext(c)
        ctx.autosaveEnabled = false
        var folders: [Folder] = []
        for i in 0..<200 {
            let f = Folder(name: "Folder \(i)", parent: i < 10 ? nil : folders[i % 10], sortIndex: Double(i))
            f.dirty = false
            ctx.insert(f)
            folders.append(f)
        }
        let hubLinks = (1...300).map { "- See [[Note \($0 * 13)]] for part \($0)" }.joined(separator: "\n")
        let hub = Note(body: "Hub\n\nEverything links here.\n\n\(hubLinks)\n", folder: folders[0])
        hub.dirty = false
        ctx.insert(hub)
        for i in 0..<Self.count {
            let toHub = i % (Self.count / Self.linkers) == 0 ? "\nBack to the [[Hub]] for the rest.\n" : ""
            let n = Note(body: "Note \(i)\n\nSome text for note \(i), with **bold** and [[Note \((i * 7) % Self.count)]] and [[Note \((i * 11) % Self.count)]].\n\(toHub)\nA last line.\n",
                         folder: folders[i % folders.count])
            n.updatedAt = Date().addingTimeInterval(Double(-i * 60))
            n.dirty = false
            ctx.insert(n)
            if i % 2000 == 1999 { try! ctx.save() }
        }
        try! ctx.save()
        return url
    }

    func open() async throws -> ModelContainer {
        let url = await Self.store.value
        WikiDirectory.invalidate()
        return try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(url: url))
    }

    func ms(_ d: Duration) -> Double { Double(d.components.attoseconds) / 1e15 + Double(d.components.seconds) * 1000 }

    func perf(_ what: String, _ ms: Double) {
        print("PERF linked library (\(Self.count) notes, hub linked from \(Self.linkers)): \(what) \(String(format: "%.1f", ms)) ms")
    }

    func hub(_ ctx: ModelContext) throws -> Note {
        try #require(try ctx.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.body.starts(with: "Hub\n") })).first)
    }

    /// The hub's Linked From (2,000 linking notes, the newest 50 listed) costs next to nothing on
    /// the main thread once the link index is in.
    @Test(.timeLimit(.minutes(4))) func theHubsLinkedFrom() async throws {
        let c = try await open()
        let ctx = c.mainContext
        let hub = try hub(ctx)
        let start = ContinuousClock.now
        _ = WikiDirectory.scope(for: hub, in: ctx)
        while WikiDirectory.linking(ctx) == nil, ContinuousClock.now - start < .seconds(60) { try await Task.sleep(for: .milliseconds(5)) }
        perf("the link index, read off the main thread", ms(ContinuousClock.now - start))
        let clock = ContinuousClock()
        var samples: [Double] = []
        var found: (notes: [Note], total: Int) = ([], 0)
        for _ in 0..<5 {
            samples.append(ms(clock.measure { found = LinkedFromMenu.notes(linkingTo: hub, in: ctx) }))
        }
        perf("the hub's Linked From, on the main thread (median)", PerfTiming.median(samples))
        #expect(found.total == Self.linkers)
        #expect(found.notes.count == LinkedFromMenu.shown && found.notes.allSatisfy { $0.body.contains("Back to the [[Hub]]") })
        #expect(PerfTiming.median(samples) < 100 * PerfBudget.slack, "a note linked from 2,000 doesn't hold the main thread")
    }

    /// Typing in the hub (300 links in it, 2,000 linking to it): a keystroke in the editor and the
    /// save after it, which keeps the link index note by note, stay within the editor's budget.
    @Test(.timeLimit(.minutes(4))) func typingInTheHub() async throws {
        let c = try await open()
        let ctx = c.mainContext
        let hub = try hub(ctx)
        let start = ContinuousClock.now
        _ = WikiDirectory.scope(for: hub, in: ctx)
        while WikiDirectory.linking(ctx) == nil, ContinuousClock.now - start < .seconds(60) { try await Task.sleep(for: .milliseconds(5)) }
        // The same note in the editor without the library's links, for comparison.
        let bare = await EditorHarness(hub.body, focus: true)
        await bare.select(NSMaxRange((bare.text as NSString).range(of: "Everything links here")))
        await PerfTiming.quietMainQueue()
        var bareKeys: [Double] = []
        for ch in "and more" {
            bareKeys.append(ms(ContinuousClock().measure {
                bare.view.insertText(String(ch), replacementRange: bare.view.selectedRange())
                bare.view.enclosingScrollView?.layoutSubtreeIfNeeded()
                bare.view.displayIfNeeded()
            }))
            await bare.settle(0.01)
        }
        bare.close()
        perf("a keystroke in the same note, without links resolved (median)", PerfTiming.median(bareKeys))
        let h = await EditorHarness(hub.body, focus: true)
        defer { h.close() }
        h.view.setWiki(WikiDirectory.scope(for: hub, in: ctx))
        await h.select(NSMaxRange((h.text as NSString).range(of: "Everything links here")))
        await PerfTiming.quietMainQueue()
        let clock = ContinuousClock()
        var keys: [Double] = []
        var saves: [Double] = []
        for ch in "and more" {
            keys.append(ms(clock.measure {
                h.view.insertText(String(ch), replacementRange: h.view.selectedRange())
                h.view.enclosingScrollView?.layoutSubtreeIfNeeded()
                h.view.displayIfNeeded()
            }))
            await h.settle(0.01)
            saves.append(ms(clock.measure {
                // What the note screen does as the editor writes the note: the save (which keeps
                // the link index, WikiDirectory.take) and the editor's link colours after it.
                hub.body = h.text
                hub.touch()
                try? ctx.save()
                _ = WikiDirectory.scope(for: hub, in: ctx)
            }))
        }
        perf("a keystroke in the hub (median)", PerfTiming.median(keys))
        perf("a save of the hub (median)", PerfTiming.median(saves))
        #expect(h.text.contains("Everything links hereand more"))
        // The editor's own cost for a note of 300 links is the same as without them resolved.
        #expect(PerfTiming.median(keys) < PerfTiming.median(bareKeys) * 1.3 + 2, "the library's links add next to nothing to a keystroke")
        #expect(PerfTiming.median(keys) < 33 * PerfBudget.slack, "a keystroke within two frames in a Debug build")
        #expect(PerfTiming.median(saves) < 16 * PerfBudget.slack, "the save while typing does no more than before")
    }
}
#endif
