#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// An AI's edit in many everyday shapes, on the real note screen: a few frames of each (the
/// moment it lands, halfway through the writing, done). For judging the whole experience, not
/// one picture. `AMBER_QA_SHOTS=/path scripts/qa-test.sh PaneTests/AIEditScenarioPictures`.
@MainActor @Suite(.serialized) struct AIEditScenarioPictures {
    enum Mode { case live, openedLater, typeMidway }

    struct Scenario: CustomStringConvertible, Sendable {
        let id: String
        let before: String
        let after: String
        var by = "ChatGPT"
        var mode = Mode.live
        var description: String { id }
    }

    nonisolated static let paragraph = "Trip to Porto\n\nWe land on Tuesday at 14:20 and take the metro straight to the hotel near Ribeira, drop the bags, then walk along the river to the Dom Luís bridge before dinner at the place Sara recommended.\n\nPack light: one bag each."
    nonisolated static let groceries = "Groceries\n\n- [ ] Oat milk\n- [ ] Lemons\n- [ ] Eggs\n- [ ] Bread"
    nonisolated static let longNote: String = {
        var lines = ["Reading list", ""]
        for i in 1...30 { lines.append("- Book \(i): notes on why it's on the list") }
        return lines.joined(separator: "\n")
    }()
    nonisolated static let table = "Budget\n\n| Item | Cost |\n|---|---|\n| Flights | 240 |\n| Hotel | 380 |"

    nonisolated static let all: [Scenario] = [
        Scenario(id: "01-one-word-fix", before: paragraph, after: paragraph.replacingOccurrences(of: "Tuesday", with: "Wednesday")),
        Scenario(id: "02-add-a-todo", before: groceries, after: groceries + "\n- [ ] Saffron"),
        Scenario(id: "03-tick-an-item", before: groceries, after: groceries.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs")),
        Scenario(id: "04-delete-a-line", before: groceries, after: groceries.replacingOccurrences(of: "\n- [ ] Lemons", with: "")),
        Scenario(id: "05-new-section-in-middle", before: paragraph,
                 after: paragraph.replacingOccurrences(of: "\n\nPack light", with: "\n\n## Day 2\nSintra by train from Rossio, Pena Palace first, then lunch in the old town.\n\nPack light"), by: "Claude"),
        Scenario(id: "06-full-rewrite", before: AIChangeLookTests.before, after: AIChangeLookTests.after),
        Scenario(id: "07-below-the-fold", before: longNote, after: longNote + "\n- Book 31: added by ChatGPT"),
        Scenario(id: "08-table-row", before: table, after: table + "\n| Food | 150 |"),
        Scenario(id: "09-rename-title", before: groceries, after: groceries.replacingOccurrences(of: "Groceries", with: "Groceries for Saturday")),
        Scenario(id: "10-opened-later", before: AIChangeLookTests.before, after: AIChangeLookTests.after, mode: .openedLater),
        Scenario(id: "11-typing-while-it-writes", before: AIChangeLookTests.before, after: AIChangeLookTests.after, mode: .typeMidway),
    ]

    static func snap(_ view: NSView, _ name: String) {
        guard let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: rep)
        let dir = EditorHarness.shotsDirectory.appending(path: "scenarios")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try? rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: all) func scenario(_ s: Scenario) async throws {
        guard ProcessInfo.processInfo.environment["AMBER_QA_SHOTS"] != nil else { return }
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: s.before)
        if s.mode == .openedLater { AIEditTests.arrive(note, body: s.after, by: s.by) }
        let controller = EditorController()
        let window = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: 760, height: 560), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        let host = NSHostingView(rootView: NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c))
        let slow = 4.0
        ChangeTint.slowMotion = slow
        ChangeTint.holdForCapture = true
        defer { ChangeTint.slowMotion = 1; ChangeTint.holdForCapture = false; window.close() }
        if s.mode == .openedLater {
            window.contentView = host
            try? await Task.sleep(for: .milliseconds(60))
            Self.snap(host, "\(s.id)-a-lands")
        } else {
            window.contentView = host
            try? await Task.sleep(for: .seconds(1.2))
            Self.snap(host, "\(s.id)-0-before")
            AIEditTests.arrive(note, body: s.after, by: s.by)
            try? await Task.sleep(for: .milliseconds(60))
            Self.snap(host, "\(s.id)-a-lands")
        }
        let writing = ChangeTint.writeDuration(from: s.before, to: s.after) * slow
        let start = Date.now.addingTimeInterval(-0.06)
        try? await Task.sleep(for: .seconds(max(0, writing * 0.5 - Date.now.timeIntervalSince(start))))
        Self.snap(host, "\(s.id)-b-writing")
        if s.mode == .typeMidway, let view = controller.target as? PaneTextView {
            view.insertText("!", replacementRange: NSRange(location: (view.string as NSString).length, length: 0))
            try? await Task.sleep(for: .milliseconds(100))
            Self.snap(host, "\(s.id)-c-typed")
        }
        try? await Task.sleep(for: .seconds(max(0, writing + 0.6 * slow + 0.4 - Date.now.timeIntervalSince(start))))
        Self.snap(host, "\(s.id)-d-done")
        ChangeTint.holdForCapture = false
        // After the rest and the fade (2.6 s and 1.6 s, slowed), and the receipt's few seconds.
        try? await Task.sleep(for: .seconds((2.6 + 1.6) * slow + 0.5))
        Self.snap(host, "\(s.id)-e-after")
    }
}
#endif
