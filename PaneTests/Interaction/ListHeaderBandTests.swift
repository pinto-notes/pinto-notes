#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The note list's date heading looks the same in every folder and never jumps. AppKit draws a
/// pinned heading at the list's top edge, and the first heading sits a little under that edge (the
/// list's top padding). The heading pinned after one point of scrolling, so a list a few points
/// down pulled "Today" up about ten points in one frame and put a band and a line under it. All
/// Notes, scrolled a few points to show the open note, looked like that and the folder beside it
/// didn't (Emil, 9 November 2026: "something strange is happening with the header band").
@MainActor @Suite(.serialized) struct ListHeaderBandTests {
    /// The rule: pinned only once the heading has reached the edge.
    @Test func theHeadingPinsOnlyOnceItReachesTheEdge() {
        #expect(!ListEdgeLine.pins(offset: -52, topInset: 52, headingTop: 10), "at the top")
        #expect(!ListEdgeLine.pins(offset: -50, topInset: 52, headingTop: 10), "2 pt down: the heading is still under the edge")
        #expect(!ListEdgeLine.pins(offset: -45, topInset: 52, headingTop: 10), "7 pt down")
        #expect(ListEdgeLine.pins(offset: -42, topInset: 52, headingTop: 10), "10 pt down: at the edge, pinned")
        #expect(ListEdgeLine.pins(offset: 200, topInset: 52, headingTop: 10))
        #expect(!ListEdgeLine.pins(offset: 0, topInset: 0, headingTop: 0), "no padding: the old rule")
        #expect(ListEdgeLine.pins(offset: 2, topInset: 0, headingTop: 0))
    }

    /// Where the first heading is drawn, measured from the list's top edge: in its place, or at
    /// the edge when pinned.
    static func headingFromEdge(_ list: NSTableView, _ scroll: NSScrollView) -> CGFloat {
        let edge = scroll.contentView.bounds.minY + scroll.contentInsets.top
        return list.floatsGroupRows && edge > 0 ? 0 : list.rect(ofRow: 0).minY - edge
    }

    /// The sidebar: the outline whose rows start with "Folders" (the leftmost one).
    static func sidebar(_ w: NSWindow) -> NSOutlineView? {
        var found: [NSOutlineView] = []
        func walk(_ v: NSView) {
            if let o = v as? NSOutlineView { found.append(o) }
            v.subviews.forEach(walk)
        }
        walk(w.contentView!)
        return found.min { $0.convert($0.bounds, to: nil).minX < $1.convert($1.bounds, to: nil).minX }
    }

    static func clickSidebar(_ w: NSWindow, row: Int) {
        guard let sidebar = sidebar(w) else { return }
        let r = sidebar.rect(ofRow: row)
        let p = sidebar.convert(NSPoint(x: r.midX, y: r.midY), to: nil)
        for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
            NSApp.postEvent(NSEvent.mouseEvent(with: type, location: p, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                                               windowNumber: w.windowNumber, context: nil, eventNumber: 0, clickCount: 1,
                                               pressure: type == .leftMouseDown ? 1 : 0)!, atStart: false)
        }
    }

    /// Emil's library: Notes (with Test inside) and Daily, four notes, "The loss of coding" open.
    static func window(height: CGFloat) async throws -> (NSWindow, () -> Void) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notesFolder = ctx.createFolder(named: "Notes")
        _ = ctx.createFolder(named: "Test", parent: notesFolder)
        let daily = ctx.createFolder(named: "Daily")
        let loss = ctx.createNote(in: .folder(notesFolder.id), body: "The loss of coding\n\nI never code by hand anymore. It's something I started")
        loss.updatedAt = .now.addingTimeInterval(-3600)
        let welcome = ctx.createNote(in: .folder(notesFolder.id), body: "Welcome\n\nThis is your notebook.")
        welcome.updatedAt = .now.addingTimeInterval(-3 * 86_400)
        for (i, t) in ["6 November 2026", "2 November 2026"].enumerated() {
            let n = ctx.createNote(in: .folder(daily.id), body: "\(t)\n\nRunning v2 needs real movement.")
            n.updatedAt = .now.addingTimeInterval(-Double(3 + i * 4) * 86_400)
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        d.set(try JSONEncoder().encode(Scope.folder(notesFolder.id)), forKey: "lastScope")
        d.set(loss.id.uuidString, forKey: "lastNote")
        let w = NoteOpenClickTests.ClickWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: height),
                                               styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = NSHostingController(rootView: RootView().modelContainer(c).environment(SetupStore()))
        w.setContentSize(CGSize(width: 1180, height: height))
        await MacWindowChromeTests.settle(w, 15)
        return (w, {
            w.close()
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        })
    }

    /// Scrolling down a point at a time from the top, the heading moves with the list until it
    /// reaches the edge and stays there: it never jumps up, and it pins only at the edge.
    @Test func theHeadingNeverJumpsAsTheListScrolls() async throws {
        let (w, done) = try await Self.window(height: 520)
        defer { done() }
        // All Notes: row 1 in the sidebar ("Folders" is row 0).
        Self.clickSidebar(w, row: 1)
        await MacWindowChromeTests.settle(w, 8)
        let list = try MacEmptyDetailTests.list(w)
        let scroll = try #require(list.enclosingScrollView)
        let top = -scroll.contentInsets.top
        let headingTop = list.rect(ofRow: 0).minY
        #expect(headingTop > 1, "the first heading sits under the edge (the list's top padding): \(headingTop)")
        var last = Self.headingFromEdge(list, scroll)
        var jumps: [String] = []
        for step in 1...24 {
            let y = top + CGFloat(step)
            scroll.contentView.scroll(to: NSPoint(x: scroll.contentView.bounds.minX, y: y))
            scroll.reflectScrolledClipView(scroll.contentView)
            await MacWindowChromeTests.settle(w, 1)
            let now = Self.headingFromEdge(list, scroll)
            if now < last - 1.5 { jumps.append("\(step) pt down: \(last) to \(now)") }
            if list.floatsGroupRows, CGFloat(step) < headingTop - 0.5 { jumps.append("\(step) pt down: pinned before the heading reached the edge") }
            last = now
        }
        #expect(jumps.isEmpty, "the heading jumped: \(jumps)")
    }

    /// Going between All Notes and a folder, back and forth: neither list pins its heading before
    /// the heading has reached the edge, so both show it the same way.
    @Test(arguments: [760.0, 460.0, 400.0]) func foldersShowTheSameHeading(height: Double) async throws {
        let (w, done) = try await Self.window(height: height)
        defer { done() }
        var odd: [String] = []
        for row in [1, 2, 1, 2] {
            Self.clickSidebar(w, row: row)
            await MacWindowChromeTests.settle(w, 8)
            let list = try MacEmptyDetailTests.list(w)
            let scroll = try #require(list.enclosingScrollView)
            let edge = scroll.contentView.bounds.minY + scroll.contentInsets.top
            if list.floatsGroupRows, edge < list.rect(ofRow: 0).minY - 0.5 {
                odd.append("\(row == 1 ? "All Notes" : "Notes"): pinned with the heading \(list.rect(ofRow: 0).minY - edge) pt under the edge")
            }
        }
        #expect(odd.isEmpty, "\(odd)")
    }

    /// Whether the list draws a floating (pinned) heading while its first heading is still under
    /// the edge, at rest.
    static func pinnedAtRest(_ w: NSWindow) -> String? {
        guard let list = MacWindowChromeTests.find(NSTableView.self, in: w.contentView!, where: { $0.numberOfRows > 0 && $0.style != .sourceList && $0.accessibilityLabel() != "Sidebar" }),
              let scroll = list.enclosingScrollView else { return nil }
        let edge = scroll.contentView.bounds.minY + scroll.contentInsets.top
        let floating = (0 ..< list.numberOfRows).contains { list.rowView(atRow: $0, makeIfNecessary: false)?.isFloating == true }
        return floating && edge < list.rect(ofRow: 0).minY - 0.5 ? "a pinned heading with the list \(edge) pt down" : nil
    }

    /// SwiftUI turns pinning on again when it updates a table: the next draw is plain anyway,
    /// with nothing to wait for (9 November 2026: the band showed for a frame or stayed).
    @Test func aTableToldToPinAtRestDrawsPlain() async throws {
        let (w, done) = try await Self.window(height: 520)
        defer { done() }
        Self.clickSidebar(w, row: 1)
        await MacWindowChromeTests.settle(w, 8)
        let list = try MacEmptyDetailTests.list(w)
        list.floatsGroupRows = true
        list.needsDisplay = true
        list.enclosingScrollView?.needsDisplay = true
        w.displayIfNeeded()
        #expect(Self.pinnedAtRest(w) == nil, "drawn pinned at rest")
        #expect(!list.floatsGroupRows)
    }

    /// Emil's clicks, quickly (Notes, Daily, Test, All Notes, Notes, Test, Daily, All Notes), with
    /// every frame looked at from the first after each click: none has a pinned heading at rest.
    @Test func quickFolderSwitchesNeverShowABand() async throws {
        let (w, done) = try await Self.window(height: 640)
        defer { done() }
        var odd: [String] = []
        // Sidebar rows: Folders 0, All Notes 1, Notes 2, Test 3, Daily 4.
        for (k, row) in [2, 4, 3, 1, 2, 3, 4, 1].enumerated() {
            Self.clickSidebar(w, row: row)
            let clock = ContinuousClock(), start = clock.now
            while clock.now - start < .milliseconds(k % 2 == 0 ? 900 : 1300) {
                try? await Task.sleep(for: .milliseconds(16))
                w.contentView?.layoutSubtreeIfNeeded()
                w.displayIfNeeded()
                if let s = Self.pinnedAtRest(w) { odd.append("click \(k + 1) (row \(row)), \(Int((clock.now - start) / .milliseconds(1))) ms: \(s)") }
            }
        }
        #expect(odd.isEmpty, "\(odd.prefix(8))")
    }
}
#endif
