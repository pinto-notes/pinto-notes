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

    private func connection(_ name: String, oauthHost: String? = nil, connected: Double = 0, used: Double? = nil, revoked: Bool = false) throws -> Connection {
        let at = { (t: Double) in ISO8601DateFormatter().string(from: Date(timeIntervalSince1970: 1_790_000_000 + t)) }
        var row: [String: Any] = ["id": UUID().uuidString, "name": name, "kind": oauthHost == nil ? "token" : "oauth", "can_write": true, "created_at": at(connected)]
        if let used { row["last_used_at"] = at(used) }
        if let oauthHost { row["redirect_host"] = oauthHost }
        if revoked { row["revoked_at"] = at(used ?? connected) }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Connection.self, from: JSONSerialization.data(withJSONObject: row))
    }

    /// Which AI the sheet offers first when several are connected, and what "Use another AI" lists.
    @Test func theAIOfferedFirstIsTheOneUsedLastOrChosenHere() throws {
        let names = { (cs: [Connection], chosen: String?) in MakeAnApp.choices(cs, chosen: chosen).map(\.name) }
        #expect(names([], nil).isEmpty)
        #expect(try names([connection("Claude Code", used: 5, revoked: true)], nil).isEmpty, "a disconnected AI is not offered")
        let chatgpt = try connection("ChatGPT", oauthHost: "chatgpt.com", connected: 1, used: 10)
        let claude = try connection("Claude", oauthHost: "claude.ai", connected: 2, used: 20)
        let code = try connection("Claude Code", connected: 3, used: 30)
        #expect(chatgpt.mark == "ChatGPT" && claude.mark == "Claude", "the test's hosts are the ones the app vouches for")
        // One connected: it, and nothing to choose between.
        #expect(names([chatgpt], nil) == ["ChatGPT"])
        // Several: the one used most recently first, the rest after it in the same order.
        #expect(names([chatgpt, code], nil) == ["Claude Code", "ChatGPT"])
        #expect(names([code, chatgpt, claude], nil) == ["Claude Code", "Claude", "ChatGPT"])
        // One that has been used comes before one that never was, however lately that was connected.
        let fresh = try connection("Codex", connected: 99)
        #expect(names([fresh, chatgpt], nil) == ["ChatGPT", "Codex"])
        // None used yet: the one connected most recently.
        #expect(try names([connection("Codex", connected: 5), connection("Claude Code", connected: 9)], nil) == ["Claude Code", "Codex"])
        // The one chosen here last time comes first, while it is still connected.
        #expect(names([chatgpt, claude, code], "ChatGPT") == ["ChatGPT", "Claude Code", "Claude"])
        #expect(names([claude, code], "ChatGPT") == ["Claude Code", "Claude"], "a choice that is no longer connected is ignored")
        // Two connections of the same AI are one choice; a token nobody named is listed by its title.
        #expect(try names([code, connection("Claude Code", connected: 4, used: 40)], nil) == ["Claude Code"])
        #expect(try names([connection("My script", connected: 1)], nil) == ["My script"])
        // How the words reach each: a chat for ChatGPT and Claude, pasting for everything else.
        #expect(MakeAnApp.AI(name: "ChatGPT").isChat && MakeAnApp.AI(name: "Claude").isChat)
        #expect(!MakeAnApp.AI(name: "Claude Code").isChat && !MakeAnApp.AI(name: "Codex").isChat && !MakeAnApp.AI(name: "My script").isChat)
        // The chat opens with the whole prompt in its address, as Try It's link does.
        let url = MakeAnApp.chat("ChatGPT", prompt: "make my note \u{201C}A & B\u{201D} an app")
        #expect(url.host == "chatgpt.com" && URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first?.value == "make my note \u{201C}A & B\u{201D} an app")
        #expect(MakeAnApp.chat("Claude", prompt: "x").absoluteString == "https://claude.ai/new?q=x")
    }

    /// What the sheet says after the click is what each AI really does with a prompt that arrives
    /// by link (the lead's check in a browser, 2026-10-11): ChatGPT sends it, Claude waits for send
    /// under a caution note. It never claims one click for Claude.
    @Test func theWaitingLineSaysWhatEachAIReallyDoes() {
        #expect(MakeAppSheet.afterHandOver("ChatGPT").hasPrefix("ChatGPT has the message."))
        #expect(MakeAppSheet.afterHandOver("Claude").contains("Press send in Claude") && MakeAppSheet.afterHandOver("Claude").contains("caution note"))
        #expect(MakeAppSheet.afterHandOver("Codex").hasPrefix("Paste the words into Codex"))
        #expect(MakeAppSheet.patience == .seconds(180), "about three minutes before it says what to check")
    }

    /// New App asks the AI to make the note too, so nothing is made here before the app arrives.
    @Test func newAppAsksTheAIToMakeTheNoteAndItsApp() {
        let p = MakeAnApp.newAppPrompt("  a water tracker.  ")
        #expect(p.hasPrefix("In Pinto Notes, make me a new note that is an app: a water tracker. Call get_page_guide, make the note with create_note"))
        #expect(p.contains("create_app") && !p.contains(".."))
        #expect(MakeAnApp.examples.map(\.name) == ["Habit tracker", "Trip plan", "Workout log"])
        #expect(MakeAnApp.templatesPage.path() == "/templates")
        // The tip is a feature of its own, so its "shown" mark travels with the account.
        #expect(Feature(rawValue: "newApp") != nil && Feature.newApp.tip.id == "newApp")
    }

    @Test func theSketchFollowsWhatTheNoteHolds() {
        #expect(MakeAnApp.kind(for: Capture.budgetNote) == .budget)
        #expect(MakeAnApp.kind(for: Capture.habitNote()) == .tracker)
        #expect(MakeAnApp.kind(for: "People\n\n| Name | Role |\n|---|---|\n| Sara | Sales |") == .cards)
        #expect(MakeAnApp.kind(for: "Packing\n- [ ] a\n- [ ] b\n- [ ] c") == .checklist)
        #expect(MakeAnApp.kind(for: "Thoughts\n\nNothing to track.") == .plain)
    }

    /// No AI connected: the ways to connect one are in the sheet itself, one press each, not a
    /// button that opens Settings (newcomer audit #14). "Another AI" is left to Settings. (What the
    /// sheet then looks like is the "none" picture of `theSheetIsTheSizeOfWhatItSays`.)
    @Test func withoutAnAITheSheetOffersConnectingOneInPlace() {
        #expect(MakeAnApp.connectGuides == [.chatgpt, .claude])
        // The rest in one menu, whatever is installed: never "Another AI", never twice.
        #expect(MakeAnApp.moreGuides.contains(.claudeCode) && MakeAnApp.moreGuides.contains(.codex))
        #expect(!MakeAnApp.moreGuides.contains(.other) && !MakeAnApp.moreGuides.contains(.chatgpt))
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
            for state in ["none", "chatgpt", "claude", "both", "three", "code", "waiting", "waiting-claude", "late"] {
                for dark in [false, true] {
                    let host = try await host(state: state, sketch: sketch, dark: dark, note: tracker)
                    let size = host.fittingSize
                    #expect(size.width == 420)
                    // One step under a title and a line: short. Only the words to paste make it taller.
                    #expect(size.height < (["code": 420, "three": 450, "both": 310, "late": 400, "waiting": 320, "waiting-claude": 320, "claude": 320,
                                            // No AI yet: the ways to connect one, in place (newcomer audit #14).
                                            "none": 430][state] ?? 280) - (sketch ? 0 : 80), "\(state)\(sketch ? "" : ", no sketch") is \(size.height) pt tall")
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
        // New App, with and without an AI connected, light and dark.
        for state in ["chatgpt", "none", "both"] {
            for dark in [false, true] {
                MakeAppSheet.stateForPictures = state
                let host = NSHostingView(rootView: MakeAppSheet(newApp: ()).environment(\.controlActiveState, .key).fixedSize())
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                try await Task.sleep(for: .milliseconds(400))
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                #expect(host.fittingSize.width == 420 && host.fittingSize.height < (state == "none" ? 440 : 360), "new app \(state) is \(host.fittingSize.height) pt tall")
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                try #require(rep.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: dir).appending(path: "new-app-mac-\(state)-\(dark ? "dark" : "light").png"))
            }
        }
        for (name, note) in [("budget", ("October budget", Capture.budgetNote)), ("checklist", ("Packing", "Packing\n- [ ] a\n- [ ] b\n- [ ] c")), ("cards", ("People", "People\n\n| Name | Role |\n|---|---|\n| Sara | Sales |"))] {
            let host = try await host(state: "chatgpt", sketch: true, dark: false, note: note)
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            try #require(rep.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: dir).appending(path: "mac-make-app-v2-sketch-\(name)-light.png"))
        }
    }
}
#endif
