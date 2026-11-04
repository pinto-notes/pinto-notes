import Foundation
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// Ask an AI about a folder (persona council, 4 November 2026: Maya, Elena, the household): what
/// the menus offer for what's connected, the questions fit to the folder, the page each opens or
/// the text it copies, and the confirmation. The popover is driven offscreen on the Mac.
@MainActor @Suite(.serialized) struct AskAITests {
    static func oauth(_ host: String) -> Connection {
        Connection(id: UUID(), name: host, kind: "oauth", created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: host)
    }
    static func token(_ name: String, revoked: Bool = false) -> Connection {
        Connection(id: UUID(), name: name, kind: "token", created_at: .now, last_used_at: nil, revoked_at: revoked ? .now : nil, redirect_host: nil)
    }
    static let chatgpt = oauth("chatgpt.com")
    static let claude = oauth("claude.ai")

    @Test func theMenuOffersEachConnectedAIOnceAndNothingWithoutOne() {
        #expect(AskAI.targets([]).isEmpty, "hidden when no AI is connected")
        #expect(AskAI.targets([Self.token("Codex", revoked: true)]).isEmpty, "a disconnected AI isn't offered")
        // An app Pinto can't vouch for, or a bare access token, has no mark: not offered.
        #expect(AskAI.targets([Self.oauth("glama.ai"), Self.token("Access token")]).isEmpty)
        // Two ChatGPT accounts are one ChatGPT; the two whose page opens come first.
        let t = AskAI.targets([Self.token("Codex"), Self.chatgpt, Self.oauth("chatgpt.com"), Self.claude, Self.token("Claude Code")])
        #expect(t.map(\.ai) == ["ChatGPT", "Claude", "Claude Code", "Codex"])
        #expect(t.map(\.opensPage) == [true, true, false, false])
    }

    @Test func oneAIIsOneItemSeveralAreASubmenu() {
        let running = AskAI.Subject.folder("Running")
        let gpt = AskAI.Target(ai: "ChatGPT")
        #expect(AskAI.title(gpt, running) == "Ask ChatGPT About \u{201C}Running\u{201D}\u{2026}")
        #expect(AskAI.title(gpt, .all) == "Ask ChatGPT About Your Notes\u{2026}")
        #expect(AskAI.submenuTitle(running) == "Ask an AI About \u{201C}Running\u{201D}")
        #expect(AskAI.submenuItem(AskAI.Target(ai: "Claude Code")) == "Claude Code\u{2026}")
        #expect(AskAI.heading(gpt, running) == "Ask ChatGPT about \u{201C}Running\u{201D}")
    }

    @Test func theQuestionsAreFitToTheFolderAndNameIt() {
        let qs = AskAI.questions(.folder("Running"))
        #expect(qs.map(\.title) == ["Check my week against it", "Summarise this week", "Make a list from it"])
        for q in qs {
            #expect(q.prompt.hasPrefix("In Pinto Notes, read my folder \u{201C}Running\u{201D}"), "\(q.prompt)")
            #expect(!q.prompt.contains("\u{2014}"), "no em dashes")
        }
        #expect(AskAI.questions(.all).map(\.title) == ["Check my week", "Summarise this week", "Make a list from them"])
        #expect(AskAI.questions(.all).allSatisfy { $0.prompt.hasPrefix("In Pinto Notes,") })
        #expect(AskAI.own("  how far did I run?  ", .folder("Running")) == "In Pinto Notes, read my folder \u{201C}Running\u{201D}. how far did I run?")
        #expect(AskAI.own("   ", .folder("Running")) == nil, "nothing typed, nothing to ask")
    }

    @Test func chatGPTAndClaudeOpenWithItTypedInTheRestCopy() throws {
        let prompt = AskAI.questions(.folder("Running"))[1].prompt
        let gpt = try #require(AskAI.page(AskAI.Target(ai: "ChatGPT"), prompt: prompt))
        #expect(gpt.host == "chatgpt.com" && URLComponents(url: gpt, resolvingAgainstBaseURL: false)?.queryItems?.first?.value == prompt)
        let claude = try #require(AskAI.page(AskAI.Target(ai: "Claude"), prompt: prompt))
        #expect(claude.absoluteString.hasPrefix("https://claude.ai/new?q="))
        #expect(AskAI.page(AskAI.Target(ai: "Codex"), prompt: prompt) == nil)
        #expect(AskAI.done(AskAI.Target(ai: "ChatGPT")) == "Opened in ChatGPT")
        #expect(AskAI.done(AskAI.Target(ai: "Codex")) == "Copied. Paste it into Codex.")
        #expect(AskAI.how(AskAI.Target(ai: "Claude")) == "Opens Claude with it typed in. It\u{2019}s copied too.")
    }

    /// The list's ••• menu: about the folder, or every note; not in Recently Deleted or a tag.
    @Test func theListMenuAsksAboutItsFolder() {
        let id = UUID()
        let name: (UUID) -> String? = { $0 == id ? "Running" : nil }
        #expect(ListMoreMenu.askSubject(.folder(id), folderName: name) == .folder("Running"))
        #expect(ListMoreMenu.askSubject(.all, folderName: name) == .all)
        #expect(ListMoreMenu.askSubject(.trash, folderName: name) == nil)
        #expect(ListMoreMenu.askSubject(.tag("work"), folderName: name) == nil)
        #expect(ListMoreMenu.groups(connectNudge: false, asks: true) == [[.selectNotes], [.sortBy, .groupByDate], [.addFiles], [.askAI]])
        #expect(ListMoreMenu.groups(connectNudge: true, asks: true).suffix(2) == [[.askAI], [.connectAI]])
        #expect(!ListMoreMenu.groups(connectNudge: false).joined().contains(.askAI), "not offered when no AI is connected")
    }

    @Test func settingsListsKeepWhatIsOfferedCurrent() {
        let kept = ConnectedAIs.shared.connections
        defer { ConnectedAIs.shared.set(kept) }
        ConnectedAIs.shared.set([Self.chatgpt, Self.token("Codex", revoked: true)])
        #expect(ConnectedAIs.shared.targets.map(\.ai) == ["ChatGPT"])
        ConnectedAIs.shared.set([])
        #expect(ConnectedAIs.shared.targets.isEmpty)
    }

    #if os(macOS)
    /// Picking a question opens ChatGPT with it, copies it, says "Opened in ChatGPT" and closes.
    /// Pressed through accessibility, in a window far off the screen.
    @Test func pickingAQuestionOpensTheAIAndSaysSo() async throws {
        var opened: [URL] = [], copied: [String] = [], closed = 0
        let popover = AskAIPopover(target: AskAI.Target(ai: "ChatGPT"), subject: .folder("Running"),
                                   open: { opened.append($0) }, copy: { copied.append($0) }, close: { closed += 1 })
        let ax = OffscreenAX(popover, size: CGSize(width: AskAIPopover.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        for id in ["week", "summary", "list"] { #expect(ax.find("ask.question.\(id)") != nil, "\(id): \(ax.ids())") }
        #expect(ax.find("ask.own") != nil, "Write your own")
        #expect(ax.find("ask.done") == nil)
        let summary = try #require(ax.find("ask.question.summary"))
        #expect(summary.text.contains("Summarise this week"), "\(summary.text)")
        #expect(summary.press())
        await ax.settle()
        let prompt = AskAI.questions(.folder("Running"))[1].prompt
        #expect(copied == [prompt])
        #expect(opened == [AskAI.page(AskAI.Target(ai: "ChatGPT"), prompt: prompt)!])
        let done = try #require(ax.find("ask.done"), "Opened in ChatGPT shows: \(ax.ids())")
        #expect(done.text.contains("Opened in ChatGPT"), "\(done.text)")
        // A second press while it says so does nothing more.
        ax.find("ask.question.summary")?.press()
        try? await Task.sleep(for: AskAI.closesAfter(AskAI.Target(ai: "ChatGPT")))
        #expect(closed == 1, "then it closes")
        #expect(copied.count == 1)
    }

    /// Codex has no page to open: the question is copied, and the line says to paste it.
    @Test func codexGetsItCopied() async throws {
        var opened: [URL] = [], copied: [String] = []
        let ax = OffscreenAX(AskAIPopover(target: AskAI.Target(ai: "Codex"), subject: .all,
                                          open: { opened.append($0) }, copy: { copied.append($0) }),
                             size: CGSize(width: AskAIPopover.width, height: 320))
        defer { ax.close() }
        await ax.settle()
        #expect(try #require(ax.find("ask.question.week"), "\(ax.ids())").press())
        await ax.settle()
        #expect(opened.isEmpty)
        #expect(copied == [AskAI.questions(.all)[0].prompt])
        #expect(ax.find("ask.done")?.text.contains("Copied. Paste it into Codex.") == true)
    }
    #endif
}
