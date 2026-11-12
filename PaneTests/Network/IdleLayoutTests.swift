#if os(macOS)
import AppKit
import ObjectiveC
import SwiftData
import SwiftUI
import Testing
@testable import Pane

extension NetworkFaults {
/// The notes window while nothing happens: nothing may be laid out again. The release gate's speed
/// run on 1.3 (f36719be, 11 November 2026) counted about 1,550 layouts in 20 s of idle at 2,000
/// notes and more (NSHostingView 1,490), against 0 for 1.2.33, and idle CPU went from 0.4% to 2.7%.
/// Idle there is 15 to 35 s after launch, while the backup poll still runs (it keeps going for 30 s
/// after realtime joins, since 5 November). Each poll that found nothing still wrote: the newest
/// folder or file again (the cursor's overlap brings it back every time), so the library saved and
/// the note list laid out its rows; the cursor and the key id to the defaults, which every
/// `@AppStorage` view hears; and the sync status twice, with the account row's spinner fading in
/// and out when the poll took over 0.7 s. Signed in, against the stub server, realtime down so the
/// poll runs, each request slowed so a poll takes about as long as one against staging. Counted as
/// the gate's probe counts.
@MainActor @Suite(.sealedAccount) struct IdleLayoutTests {
    @Test(.timeLimit(.minutes(2))) func backupPollsLayOutNothing() async throws {
        StubSupabase.reset()
        NetFault.config = .init()
        UserDefaults.standard.removeObject(forKey: "syncCursor.none")
        let saved = SyncEngine.fallbackPoll
        SyncEngine.fallbackPoll = (.seconds(1.5), .seconds(1.5), 300)
        defer { SyncEngine.fallbackPoll = saved; NetFault.config = .init() }

        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let notes = ctx.createFolder(named: "Notes")
        var first: Note?
        for i in 0..<200 {
            let n = ctx.createNote(in: .folder(notes.id), body: "Note \(i)\n\nSome text for note \(i)")
            n.updatedAt = Date(timeIntervalSinceNow: -Double(i) * 60)
            first = first ?? n
        }
        try ctx.save()
        let d = UserDefaults.standard
        let keep = (d.object(forKey: "lastNote"), d.object(forKey: "lastScope"))
        defer {
            if let v = keep.0 { d.set(v, forKey: "lastNote") } else { d.removeObject(forKey: "lastNote") }
            if let v = keep.1 { d.set(v, forKey: "lastScope") } else { d.removeObject(forKey: "lastScope") }
        }
        d.set(try JSONEncoder().encode(Scope.folder(notes.id)), forKey: "lastScope")
        if let first { d.set(first.id.uuidString, forKey: "lastNote") }

        let backend = Backend(testClient: StubSupabase.client(), email: "qa@example.com")
        let sync = SyncEngine(backend: backend, context: ctx)
        await sync.sync()
        // The socket can't join (as with -netOffline): the backup poll runs, every 1.5 s here.
        NetFault.config = .init(offline: true)
        await sync.start()
        NetFault.config = .init(delay: 0.15)
        #expect(!sync.realtimeUp)

        // Borderless, far off every screen, ordered in so the display cycle runs; never key.
        let w = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 1180, height: 760), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        let root = RootView()
            .environment(backend)
            .environment(sync)
            .environment(SetupStore(progress: SetupProgress(connected: true, dismissed: true)))
            .modelContainer(c)
        w.contentViewController = NSHostingController(rootView: root)
        w.setContentSize(CGSize(width: 1180, height: 760))
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        w.orderFrontRegardless()

        // Launch settles (the split view lays out once more about 7 s in, on a timer of its own),
        // then two seconds in a row with nothing laid out, then idle.
        try await Task.sleep(for: .seconds(9))
        LayoutCount.install(in: w)
        var quiet = 0
        for _ in 0..<20 where quiet < 2 {
            LayoutCount.start()
            try await Task.sleep(for: .seconds(1))
            quiet = LayoutCount.stop().isEmpty ? quiet + 1 : 0
        }
        let polls = { StubSupabase.requests.filter { $0.hasPrefix("GET /rest/v1/notes?") }.count }
        let before = polls()
        LayoutCount.start()
        try await Task.sleep(for: .seconds(6))
        let seen = LayoutCount.stop()
        let total = seen.values.reduce(0, +)
        let top = seen.sorted { $0.value > $1.value }.prefix(6).map { "\($0.key) \($0.value)" }
        print("PERF idle with the backup poll: \(polls() - before) polls, \(total) views laid out in 6 s: \(top)")
        #expect(polls() - before >= 2, "the backup poll ran while the window was idle")
        #expect(total == 0, "a backup poll that brings nothing lays out nothing: \(total) views laid out, \(top)")

        // A sync someone asked for still shows: the spinner is for it.
        var shown = false
        let asked = Task { await sync.sync() }
        for _ in 0..<40 where !shown {
            shown = sync.showsSyncing
            try? await Task.sleep(for: .milliseconds(20))
        }
        await asked.value
        #expect(shown, "a sync that isn't a backup poll shows as syncing")
        #expect(!sync.showsSyncing)

        w.orderOut(nil)
        w.close()
        await sync.stop()
    }
}
}

/// Layout passes by view class, counted by swizzling `layout` on each class in a window that has
/// its own, as the release gate's probe does (scripts/release-gate/GateProbe.swift). Counting is on
/// only between `start` and `stop`; the swizzles stay for the test process.
@MainActor enum LayoutCount {
    nonisolated(unsafe) private static var counts: [String: Int] = [:]
    nonisolated(unsafe) private static var on = false
    private static var hooked = Set<ObjectIdentifier>()

    static func install(in window: NSWindow) {
        func walk(_ v: NSView) { hook(type(of: v)); v.subviews.forEach(walk) }
        if let v = window.contentView { walk(v) }
        if let frame = window.contentView?.superview { walk(frame) }
    }

    static func start() { counts = [:]; on = true }
    static func stop() -> [String: Int] { on = false; return counts }

    private static func hook(_ cls: AnyClass) {
        let selector = #selector(NSView.layout)
        var owner: AnyClass? = cls
        while let c = owner, let sup = class_getSuperclass(c),
              let m = class_getInstanceMethod(c, selector), let sm = class_getInstanceMethod(sup, selector),
              method_getImplementation(m) == method_getImplementation(sm) {
            owner = sup
        }
        guard let target = owner, target != NSView.self, !hooked.contains(ObjectIdentifier(target)),
              let method = class_getInstanceMethod(target, selector) else { return }
        hooked.insert(ObjectIdentifier(target))
        typealias Layout = @convention(c) (AnyObject, Selector) -> Void
        let call = unsafeBitCast(method_getImplementation(method), to: Layout.self)
        let block: @convention(block) (AnyObject) -> Void = { obj in
            if on { counts[String(describing: type(of: obj)).components(separatedBy: "<").first ?? "?", default: 0] += 1 }
            call(obj, selector)
        }
        method_setImplementation(method, imp_implementationWithBlock(block))
    }
}
#endif
