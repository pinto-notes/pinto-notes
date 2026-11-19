#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// New App's way in to "make my own version of <link>": the person pastes a link to an app they
/// like in the one field, and their AI builds their own version of it (the MCP server's create
/// with original reads its public pages). Emil chose one field (design A) over a card of its own
/// or a switch. The sheet is read offscreen through accessibility; with PANE_SNAPSHOT_DIR (or
/// AMBER_HIG_SHOTS) set, each state is drawn offscreen, never on screen.
@MainActor
@Suite(.serialized) struct OwnVersionEntryTests {
    @Test func aLinkIsRecognisedOnlyWhenThatIsAllThatWasTyped() {
        #expect(MakeAnApp.link(in: "streaks.app") == "https://streaks.app")
        #expect(MakeAnApp.link(in: "  https://apps.apple.com/us/app/things-3/id904280696 \n") == "https://apps.apple.com/us/app/things-3/id904280696")
        #expect(MakeAnApp.link(in: "http://www.ynab.com/features") == "https://www.ynab.com/features")
        for idea in ["", "A habit tracker", "a tracker like streaks.app", "budget", "e.g.", "file.txt.", "notes.2", "mailto:a@b.com", "https://me:pw@streaks.app"] {
            #expect(MakeAnApp.link(in: idea) == nil, "\(idea)")
        }
    }

    /// The same words as the MCP server's own_version prompt (files_tools.ts ownVersionPrompt, and
    /// own_version.pglite.test.ts), so the AI gets one instruction whichever way the person starts.
    /// New App makes no note first, so the words ask for a new one; create's answer names it.
    @Test func theWordsAreTheServersOwnVersionPrompt() {
        #expect(MakeAnApp.ownVersionPrompt(link: " https://tally.example.com ") ==
            "In Pinto Notes, make my own version of the app at https://tally.example.com, as a new note named for what the app does. Start it with create (type \"app\", original \"https://tally.example.com\") and follow what its answer says, all the way to a tested app.")
        #expect(MakeAnApp.ownVersionPrompt(link: "https://tally.example.com", title: "New app") ==
            "In Pinto Notes, make my own version of the app at https://tally.example.com, as my note \"New app\". Start it with create (type \"app\", original \"https://tally.example.com\") and follow what its answer says, all the way to a tested app.")
        // It names only the file tools, like the other words handed over.
        let named = MakeAnApp.ownVersionPrompt(link: "https://streaks.app").matches(of: /\b[a-z]+(?:_[a-z]+)+\b/).map { String($0.output) }
        #expect(named.isEmpty, "\(named)")
        // The product never calls it cloning.
        for words in [MakeAnApp.ideaPlaceholder, MakeAnApp.ownVersionFound, MakeAnApp.ownVersionPrompt(link: "x.com")] {
            #expect(!words.lowercased().contains("clon"), "\(words)")
            #expect(!words.contains("\u{2014}"), "\(words)")
        }
    }

    /// The sheet itself: a link in the field shows the line that says it becomes your own version
    /// of that app, and the words handed over (shown for an AI without a chat, Claude Code) are
    /// the own-version words. An idea, or words that mention a link, get the normal New App words.
    @Test func aLinkGetsTheOwnVersionLineAndWordsAndAnIdeaDoesNot() async throws {
        defer { MakeAppSheet.stateForPictures = nil; MakeAppSheet.ideaForPictures = nil }
        MakeAppSheet.stateForPictures = "code"
        let env = ProcessInfo.processInfo.environment
        let dir = (env["PANE_SNAPSHOT_DIR"] ?? env["AMBER_HIG_SHOTS"]).map { URL(fileURLWithPath: $0) }
        let cases: [(typed: String, name: String, link: String?)] = [
            ("https://streaks.app", "link", "https://streaks.app"),
            ("streaks.app", "bare-link", "https://streaks.app"),
            ("A habit tracker like streaks.app", "words", nil),
            ("", "empty", nil),
        ]
        for c in cases {
            MakeAppSheet.ideaForPictures = c.typed
            let ax = OffscreenAX(MakeAppSheet(newApp: ()).environment(\.controlActiveState, .key), size: CGSize(width: 420, height: 640))
            defer { ax.close() }
            #expect(await ax.waiting(for: "newApp.idea") != nil, "the one field (\(c.name))")
            let words = await ax.waiting(for: "makeApp.prompt")
            if let link = c.link {
                #expect(await ax.waiting(for: "newApp.ownVersion") != nil, "the line shows for \(c.typed)")
                #expect(words?.text.contains(MakeAnApp.ownVersionPrompt(link: link)) == true, "\(words?.text ?? "no words")")
            } else {
                // Built already (the field and the words are there): the line would be by now.
                #expect(ax.find("newApp.ownVersion") == nil, "no line for \"\(c.typed)\"")
                #expect(words?.text.contains(MakeAnApp.newAppPrompt(c.typed)) == true, "\(words?.text ?? "no words")")
            }
        }
        // Pictures: the sheet with a link typed and ChatGPT connected, light and dark.
        guard let dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        MakeAppSheet.stateForPictures = "chatgpt"
        for (typed, name) in [("https://streaks.app", "link"), ("", "empty")] {
            for dark in [false, true] {
                MakeAppSheet.ideaForPictures = typed
                let host = NSHostingView(rootView: MakeAppSheet(newApp: ()).environment(\.controlActiveState, .key).fixedSize())
                host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                try await Task.sleep(for: .milliseconds(400))
                host.frame = CGRect(origin: .zero, size: host.fittingSize)
                host.layoutSubtreeIfNeeded()
                #expect(host.fittingSize.width == 420 && host.fittingSize.height < 380, "\(name) is \(host.fittingSize.height) pt tall")
                let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
                host.cacheDisplay(in: host.bounds, to: rep)
                try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "own-version-newapp-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
}
#endif
