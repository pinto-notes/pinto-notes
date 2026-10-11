#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Make It an App (More, and the chip on a note that looks like one). Emil, using 1.2.4: the menu
/// item's icon was a blank square and the sheet was "pretty horrendous"; the first rebuild was "a
/// step up but still weird": it explained, showed someone else's app and handed out homework. Now
/// one click hands the words to the person's AI, and the sheet waits and closes itself when the app
/// is here. With PANE_SNAPSHOT_DIR (or the snapshot run's AMBER_HIG_SHOTS) set, each state is drawn
/// offscreen, light and dark, with and without the sketch.
@MainActor
@Suite(.serialized) struct MakeAppSheetTests {
    @Test func theMenuSymbolIsARealSymbolAndNotAPlainSquare() {
        #expect(NoteAppMark.symbol != "app.fill" && NoteAppMark.symbol != "app")
        #expect(NSImage(systemSymbolName: NoteAppMark.symbol, accessibilityDescription: nil) != nil, "\(NoteAppMark.symbol) exists on this system")
    }

    private func connection(_ name: String, oauthHost: String? = nil, used: Double, revoked: Bool = false) throws -> Connection {
        let at = { (t: Double) in ISO8601DateFormatter().string(from: Date(timeIntervalSince1970: 1_790_000_000 + t)) }
        var row: [String: Any] = ["id": UUID().uuidString, "name": name, "kind": oauthHost == nil ? "token" : "oauth", "can_write": true, "created_at": at(0), "last_used_at": at(used)]
        if let oauthHost { row["redirect_host"] = oauthHost }
        if revoked { row["revoked_at"] = at(used) }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Connection.self, from: JSONSerialization.data(withJSONObject: row))
    }

    /// Which way the words go depends on what is connected: a chat that opens with them for ChatGPT
    /// and Claude, the words to paste for Claude Code, Codex and anything else.
    @Test func theWaysToHandTheWordsOverFollowWhatIsConnected() throws {
        #expect(MakeAnApp.ways([]).isEmpty)
        #expect(try MakeAnApp.ways([connection("Claude Code", used: 5, revoked: true)]).isEmpty, "a disconnected AI is not a way")
        let chatgpt = try connection("ChatGPT", oauthHost: "chatgpt.com", used: 10), claude = try connection("Claude", oauthHost: "claude.ai", used: 20)
        #expect(chatgpt.mark == "ChatGPT" && claude.mark == "Claude", "the test's hosts are the ones the app vouches for")
        #expect(MakeAnApp.ways([chatgpt]) == .init(chats: ["ChatGPT"]))
        #expect(MakeAnApp.ways([chatgpt, claude]).chats == ["Claude", "ChatGPT"], "the one used last comes first")
        #expect(try MakeAnApp.ways([connection("Claude Code", used: 1)]) == .init(paste: "Claude Code"))
        #expect(try MakeAnApp.ways([connection("My script", used: 1)]) == .init(paste: "your AI"))
        #expect(try MakeAnApp.ways([chatgpt, connection("Codex", used: 30)]) == .init(chats: ["ChatGPT"], paste: "Codex"))
        // The chat opens with the whole prompt in its address, as Try It's link does.
        let url = MakeAnApp.chat("ChatGPT", prompt: "make my note \u{201C}A & B\u{201D} an app")
        #expect(url.host == "chatgpt.com" && URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first?.value == "make my note \u{201C}A & B\u{201D} an app")
        #expect(MakeAnApp.chat("Claude", prompt: "x").absoluteString == "https://claude.ai/new?q=x")
    }

    @Test func theSketchFollowsWhatTheNoteHolds() {
        #expect(MakeAnApp.kind(for: Capture.budgetNote) == .budget)
        #expect(MakeAnApp.kind(for: Capture.habitNote()) == .tracker)
        #expect(MakeAnApp.kind(for: "People\n\n| Name | Role |\n|---|---|\n| Sara | Sales |") == .cards)
        #expect(MakeAnApp.kind(for: "Packing\n- [ ] a\n- [ ] b\n- [ ] c") == .checklist)
        #expect(MakeAnApp.kind(for: "Thoughts\n\nNothing to track.") == .plain)
    }

    private func host(state: String, sketch: Bool, dark: Bool, note: (String, String)) async throws -> NSHostingView<some View> {
        MakeAppSheet.stateForPictures = state
        MakeAppSheet.sketch = sketch
        let host = NSHostingView(rootView: MakeAppSheet(noteID: UUID(), title: note.0, body_: note.1)
            .environment(\.controlActiveState, .key).fixedSize())
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        // The state arrives from the sheet's own task.
        try await Task.sleep(for: .milliseconds(400))
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        return host
    }

    @Test func theSheetIsTheSizeOfWhatItSays() async throws {
        defer { MakeAppSheet.stateForPictures = nil; MakeAppSheet.sketch = true }
        let env = ProcessInfo.processInfo.environment
        let dir = env["PANE_SNAPSHOT_DIR"] ?? env["AMBER_HIG_SHOTS"]
        let tracker = ("Evening tracker", Capture.habitNote())
        for sketch in [true, false] {
            for state in ["none", "chatgpt", "both", "code", "waiting"] {
                for dark in [false, true] {
                    let host = try await host(state: state, sketch: sketch, dark: dark, note: tracker)
                    let size = host.fittingSize
                    #expect(size.width == 420)
                    // One step under a title and a line: short. Only the words to paste make it taller.
                    #expect(size.height < (state == "code" ? 420 : state == "both" ? 350 : state == "waiting" ? 320 : 280) - (sketch ? 0 : 80), "\(state)\(sketch ? "" : ", no sketch") is \(size.height) pt tall")
                    guard let dir else { continue }
                    let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                    host.cacheDisplay(in: host.bounds, to: rep)
                    let png = try #require(rep.representation(using: .png, properties: [:]))
                    try png.write(to: URL(fileURLWithPath: dir).appending(path: "mac-make-app-v2-\(state)\(sketch ? "" : "-plain")-\(dark ? "dark" : "light").png"))
                }
            }
        }
        // The sketch for each kind of note, with that note's own title.
        guard let dir else { return }
        for (name, note) in [("budget", ("October budget", Capture.budgetNote)), ("checklist", ("Packing", "Packing\n- [ ] a\n- [ ] b\n- [ ] c")), ("cards", ("People", "People\n\n| Name | Role |\n|---|---|\n| Sara | Sales |"))] {
            let host = try await host(state: "chatgpt", sketch: true, dark: false, note: note)
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            try #require(rep.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: dir).appending(path: "mac-make-app-v2-sketch-\(name)-light.png"))
        }
    }
}
#endif
