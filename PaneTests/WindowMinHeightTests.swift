#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The notes window can be made as short as the window allows (contentMinSize 520), whatever
/// the sidebar holds. The window takes its smallest size from its content (windowResizability
/// .contentSize). In 1.2.9 the sidebar's card (#510) asked for 1059 pt with Connect your AI and
/// 737 with Templates, so the window couldn't be made shorter than the screen; 1.2.8 asked 199.
@MainActor @Suite(.serialized) struct WindowMinHeightTests {
    /// The notes window's content as a signed-in account sees it, with the sidebar's card.
    static func content(connected: Bool) throws -> (some View, ModelContainer) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let folder = c.mainContext.createFolder(named: "Notes")
        for i in 0..<12 { _ = c.mainContext.createNote(in: .folder(folder.id), body: "Note \(i)\n\ntext") }
        try c.mainContext.save()
        let backend = Backend(testClient: CaptureScreen.client, email: "sara@example.com", userID: UUID())
        let sync = SyncEngine(backend: backend, context: c.mainContext)
        let view = RootView()
            .environment(backend)
            .environment(sync)
            .environment(SetupStore(progress: SetupProgress(connected: connected, dismissed: true)))
            .modelContainer(c)
        return (view, c)
    }

    /// The smallest height the content takes when offered almost none.
    static func smallestHeight(_ view: some View) async -> CGFloat {
        let host = NSHostingController(rootView: view)
        let w = NSWindow(contentRect: NSRect(x: -30000, y: -30000, width: 1180, height: 900),
                         styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentViewController = host
        w.setContentSize(CGSize(width: 1180, height: 900))
        w.setFrameOrigin(CGPoint(x: -30000, y: -30000))
        defer { w.close() }
        // Laid out at a tall size first, so the sidebar's card has had room to appear.
        for _ in 0..<5 { w.contentView?.layoutSubtreeIfNeeded(); w.displayIfNeeded(); try? await Task.sleep(for: .milliseconds(100)) }
        return host.sizeThatFits(in: CGSize(width: 1180, height: 1)).height
    }

    @Test func theWindowCanBeMadeShortWithTheSidebarCard() async throws {
        for connected in [false, true] {
            let (view, c) = try Self.content(connected: connected)
            let h = await Self.smallestHeight(view)
            _ = c
            print("PERF window content min height (\(connected ? "no card" : "Connect card")): \(Int(h)) pt")
            #expect(h <= 520, "the content asks for \(Int(h)) pt; the window's own minimum is 520 (1.2.8: 199)")
        }
    }
}
#endif
