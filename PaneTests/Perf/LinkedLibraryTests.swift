#if os(macOS)
import AppKit
import Foundation
import SwiftData
import Testing
@testable import Pane

/// A heavily linked library of 20,000 notes on disk, opened cold: a hub note that 2,000 notes link
/// to and that itself links to 300, every other note linking two more. What opening the hub's
/// foot costs on the main thread, what typing in it costs a keystroke and a save, and how long the
/// mentions search takes off the main thread.
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
            let mention = i % 400 == 1 ? "\nThe hub has it all.\n" : ""
            let n = Note(body: "Note \(i)\n\nSome text for note \(i), with **bold** and [[Note \((i * 7) % Self.count)]] and [[Note \((i * 11) % Self.count)]].\n\(toHub)\(mention)\nA last line.\n",
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

    /// Opening the hub: its foot (2,000 linking notes, 20 with their lines) costs next to nothing
    /// on the main thread once the link index is in; the mentions search runs off it.
    @Test(.timeLimit(.minutes(4))) func openingTheHubsFoot() async throws {
        let c = try await open()
        let ctx = c.mainContext
        let hub = try hub(ctx)
        let start = ContinuousClock.now
        _ = WikiDirectory.scope(for: hub, in: ctx)
        while WikiDirectory.linking(ctx) == nil, ContinuousClock.now - start < .seconds(60) { try await Task.sleep(for: .milliseconds(5)) }
        perf("the link index, read off the main thread", ms(ContinuousClock.now - start))
        let clock = ContinuousClock()
        var samples: [Double] = []
        var found: (notes: [LinkingNote], total: Int) = ([], 0)
        for _ in 0..<5 {
            samples.append(ms(clock.measure {
                let back = ctx.backlinkIDs(to: hub)
                found = ctx.linkingNotes(back, to: hub)
            }))
        }
        perf("the hub's Linked from, on the main thread (median)", PerfTiming.median(samples))
        #expect(found.total == Self.linkers)
        #expect(found.notes.count == NoteLinks.firstLinked && found.notes.allSatisfy { $0.lines.first?.text == "Back to the Hub for the rest." })
        #expect(PerfTiming.median(samples) < 100 * PerfBudget.slack, "opening a note linked from 2,000 doesn't hold the main thread")

        let names = Mentions.names(title: hub.title, frontMatter: nil)
        let id = hub.id
        let t = clock.now
        let mentions = await Task.detached { Mentions.search(names, excluding: id, container: c) }.value
        perf("the hub's unlinked mentions, off the main thread", ms(clock.now - t))
        #expect(mentions.notes.count == Self.count / 400)
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
        let links = NoteLinks()
        links.refresh(ctx.backlinkIDs(to: hub), note: hub, context: ctx)
        // The same note in the editor without the library's links or the foot, for comparison.
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
        perf("a keystroke in the same note, without links resolved or the foot (median)", PerfTiming.median(bareKeys))
        let h = await EditorHarness(hub.body, focus: true)
        defer { h.close() }
        h.view.setWiki(WikiDirectory.scope(for: hub, in: ctx))
        h.view.setFoot(links)
        _ = await h.until { links.height > 0 }
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
                // the link index, WikiDirectory.take) and its check after it, which looks again
                // only when the save could have changed what links here.
                hub.body = h.text
                hub.touch()
                try? ctx.save()
                _ = WikiDirectory.scope(for: hub, in: ctx)
                links.findMentions(hub, context: ctx, delay: .seconds(0.8), force: false)
            }))
        }
        await PerfTiming.quietMainQueue()
        // A title or folder changed somewhere: Linked from is looked for again.
        var refreshes: [Double] = []
        for _ in 0..<5 {
            refreshes.append(ms(clock.measure { links.refresh(ctx.backlinkIDs(to: hub), note: hub, context: ctx) }))
        }
        perf("Linked from looked for again (median)", PerfTiming.median(refreshes))
        perf("a keystroke in the hub (median)", PerfTiming.median(keys))
        perf("a save of the hub, with its foot (median)", PerfTiming.median(saves))
        #expect(links.linkedTotal == Self.linkers)
        #expect(h.text.contains("Everything links hereand more"))
        // The editor's own cost for a note of 300 links is the same with the foot under it.
        #expect(PerfTiming.median(keys) < PerfTiming.median(bareKeys) * 1.3 + 2, "the foot and the library's links add next to nothing to a keystroke")
        #expect(PerfTiming.median(keys) < 33 * PerfBudget.slack, "a keystroke within two frames in a Debug build")
        #expect(PerfTiming.median(saves) < 16 * PerfBudget.slack, "the save while typing does no more than before")
        #expect(PerfTiming.median(refreshes) < 50 * PerfBudget.slack)
    }
}
#endif
