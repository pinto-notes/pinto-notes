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
    enum Mode { case live, openedLater, typeMidway, twoInARow, showClicked, realTime }

    struct Scenario: CustomStringConvertible, Sendable {
        let id: String
        let before: String
        let after: String
        var by = "ChatGPT"
        var mode = Mode.live
        /// Later edits, a second apart (slowed): the text after each and who made it.
        var then: [(String, String)] = []
        var width: CGFloat = 760
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
        Scenario(id: "11-typing-right-away", before: AIChangeLookTests.before, after: AIChangeLookTests.after, mode: .typeMidway),
        Scenario(id: "12-two-edits-in-a-row", before: groceries, after: groceries + "\n- [ ] Saffron", mode: .twoInARow),
        Scenario(id: "13-show-clicked", before: longNote, after: longNote + "\n- Book 31: added by ChatGPT", mode: .showClicked),
        Scenario(id: "14-real-time", before: groceries, after: groceries + "\n- [ ] Saffron", mode: .realTime),
        Scenario(id: "15-two-ais", before: groceries, after: groceries + "\n- [ ] Saffron",
                 then: [(groceries.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs") + "\n- [ ] Saffron", "Claude")]),
        Scenario(id: "16-three-in-a-row", before: groceries, after: groceries + "\n- [ ] Saffron",
                 then: [(groceries.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs") + "\n- [ ] Saffron", "ChatGPT"),
                        (groceries.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs").replacingOccurrences(of: "\n- [ ] Bread", with: "") + "\n- [ ] Saffron", "ChatGPT")]),
        Scenario(id: "17-gemini", before: paragraph, after: paragraph.replacingOccurrences(of: "Pack light: one bag each.", with: "Pack light: one bag each, and a rain jacket."), by: "Gemini"),
        Scenario(id: "18-delete-last-line", before: groceries, after: groceries.replacingOccurrences(of: "\n- [ ] Bread", with: "")),
        Scenario(id: "19-half-kept-sentence", before: paragraph,
                 after: paragraph.replacingOccurrences(of: "drop the bags, then walk along the river", with: "leave the bags at reception, then walk along the Douro")),
        Scenario(id: "20-narrow-window", before: paragraph, after: paragraph.replacingOccurrences(of: "Tuesday", with: "Wednesday"), width: 500),
        Scenario(id: "21-long-added-line", before: groceries, after: groceries + "\n- [ ] Smoked paprika from the market on Rua do Bonjardim"),
    ]

    /// Which looks to shoot: `AMBER_QA_LOOKS=light,dark` (both by default).
    nonisolated static let looks: [String] = {
        let v = ProcessInfo.processInfo.environment["AMBER_QA_LOOKS"] ?? "light,dark"
        return v.split(separator: ",").map(String.init)
    }()

    static func snap(_ view: NSView, _ name: String) {
        guard let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: rep)
        let dir = EditorHarness.shotsDirectory.appending(path: "scenarios")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try? rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: all, looks) func scenario(_ s: Scenario, look: String) async throws {
        guard ProcessInfo.processInfo.environment["AMBER_QA_SHOTS"] != nil else { return }
        let c = try AIChangesTests.container()
        let note = c.mainContext.createNote(in: .all, body: s.before)
        if s.mode == .openedLater { AIEditTests.arrive(note, body: s.after, by: s.by) }
        let controller = EditorController()
        let window = NSWindow(contentRect: NSRect(x: -20000, y: -20000, width: s.width, height: 560), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = NSAppearance(named: look == "dark" ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: NavigationStack { NoteDetailView(note: note, controller: controller, onNewNote: {}) }.modelContainer(c))
        let slow = s.mode == .realTime ? 1.0 : 4.0
        ChangeTint.slowMotion = slow
        ChangeTint.holdForCapture = s.mode != .realTime
        defer { ChangeTint.slowMotion = 1; ChangeTint.holdForCapture = false; window.close() }
        window.contentView = host
        let id = "\(look)-\(s.id)"
        // The note from its top, title and all.
        func top() { (controller.target as? PaneTextView)?.scroll(.zero) }
        if s.mode == .openedLater {
            try? await Task.sleep(for: .milliseconds(60))
            top()
        } else {
            try? await Task.sleep(for: .seconds(1.2))
            top()
            Self.snap(host, "\(id)-0-before")
            AIEditTests.arrive(note, body: s.after, by: s.by)
        }
        if s.mode == .realTime {
            // Real seconds after it lands, nothing held: how the whole thing plays.
            let start = Date.now
            for t in [0.1, 0.2, 0.3, 0.6, 1.5, 2.9, 3.5, 4.5, 5.5, 7.0] {
                let wait = t - Date.now.timeIntervalSince(start)
                if wait > 0 { try? await Task.sleep(for: .seconds(wait)) }
                Self.snap(host, "\(id)-t-\(String(format: "%04.1f", t))s")
            }
            return
        }
        // The edit is in the editor at once; the mark starts as it lands (0.15 s, slowed here).
        try? await Task.sleep(for: .seconds(0.15 * slow + 0.05))
        Self.snap(host, "\(id)-a-lands")
        try? await Task.sleep(for: .seconds(0.12 * slow))
        Self.snap(host, "\(id)-b-sweeping")
        if s.mode == .typeMidway, let view = controller.target as? PaneTextView {
            view.insertText("!", replacementRange: NSRange(location: (view.string as NSString).length, length: 0))
            try? await Task.sleep(for: .milliseconds(100))
            Self.snap(host, "\(id)-c-typed")
        }
        if s.mode == .twoInARow {
            try? await Task.sleep(for: .seconds(1.0 * slow))
            AIEditTests.arrive(note, body: s.after.replacingOccurrences(of: "- [ ] Eggs", with: "- [x] Eggs"), by: s.by)
            try? await Task.sleep(for: .seconds(0.15 * slow + 0.12 * slow))
            Self.snap(host, "\(id)-c-second")
        }
        for (n, (body, by)) in s.then.enumerated() {
            try? await Task.sleep(for: .seconds(1.0 * slow))
            AIEditTests.arrive(note, body: body, by: by)
            try? await Task.sleep(for: .seconds(0.15 * slow + 0.12 * slow))
            Self.snap(host, "\(id)-c\(n + 1)-next")
        }
        try? await Task.sleep(for: .seconds(1.0 * slow))
        Self.snap(host, "\(id)-d-resting")
        if s.mode == .showClicked {
            // What Show does: the change scrolled into view and marked again.
            controller.showChange(from: s.before)
            try? await Task.sleep(for: .seconds(0.2 * slow))
            Self.snap(host, "\(id)-d2-shown")
            try? await Task.sleep(for: .seconds(1.0 * slow))
            Self.snap(host, "\(id)-d3-rested")
        }
        ChangeTint.holdForCapture = false
        // After the rest and the fade (2.6 s and 1.6 s, slowed); the receipt stays a little longer.
        try? await Task.sleep(for: .seconds((2.6 + 1.6) * slow + 0.5))
        Self.snap(host, "\(id)-e-after")
    }
}
#endif
