import Foundation
import Testing
@testable import Pane

/// Mac first (Emil, 28 October 2026): on iPhone nothing outside Settings asks to connect an AI;
/// in Settings ChatGPT connects as before, and Claude, Codex and Another AI say to connect them on
/// the Mac and offer the Mac link. The Mac is unchanged. Each case runs for both, whatever this
/// test runs on (`mac:`), and once more for the device it runs on.
@MainActor @Suite struct ConnectOnMacTests {
    typealias Guide = ConnectAISection.Guide
    private let account = UUID()

    /// The card the folders show, as SidebarView asks for it.
    private func card(_ progress: SetupProgress, mac: Bool) -> SidebarCard? {
        SidebarCard.here(SidebarCard.pick(account: account, progress: progress, connectClosedHere: false, templatesClosedHere: false,
                                          sidebarHeight: 760, arguments: []), mac: mac)
    }

    /// New account, nothing connected, connected, imported: never Connect your AI on iPhone, and
    /// nothing new in its place (Templates only where it showed before).
    @Test(arguments: [
        SetupProgress(), SetupProgress(imported: true), SetupProgress(dismissed: true),
        SetupProgress(connected: true), SetupProgress(connectCardClosed: true),
        SetupProgress(connected: true, templatesClosed: true),
    ])
    func noConnectCardOnIPhone(progress: SetupProgress) {
        let iPhone = card(progress, mac: false)
        #expect(iPhone != .connect)
        #expect(iPhone == (progress.connected || progress.connectCardClosed ? card(progress, mac: true) : nil))
    }

    @Test func theMacStillHasItsCard() {
        #expect(card(SetupProgress(), mac: true) == .connect)
        #expect(card(SetupProgress(connected: true), mac: true) == .templates)
    }

    @Test func thisDevice() {
        #if os(macOS)
        #expect(ConnectHere.onMac && ConnectHere.nudges())
        #else
        #expect(!ConnectHere.onMac && !ConnectHere.nudges())
        #expect(SidebarCard.here(.connect) == nil)
        #expect(!FirstOpenContent.offersConnect(connected: false))
        #expect(ConnectHere.press(.claude, connected: false) == .onMac)
        #expect(ConnectHere.press(.chatgpt, connected: false) == .guide)
        #endif
    }

    /// The editor's template moment (FirstOpen): its Connect an AI link only on the Mac.
    @Test func editorOffersConnectOnlyOnTheMac() {
        #expect(!FirstOpenContent.offersConnect(connected: false, mac: false))
        #expect(!FirstOpenContent.offersConnect(connected: nil, mac: false))
        #expect(FirstOpenContent.offersConnect(connected: false, mac: true))
        #expect(!FirstOpenContent.offersConnect(connected: true, mac: true))
    }

    /// The note list's ••• menu (iPhone only, for the list and the empty list) asks before it
    /// offers Connect an AI.
    @Test func listMenuAsksFirst() throws {
        let source = try String(contentsOf: try TestFiles.url("Views").appending(path: "NoteListView.swift"), encoding: .utf8)
        let item = try #require(source.range(of: "\"list.connectAI\""))
        let before = source[..<item.lowerBound].suffix(400)
        #expect(before.contains("if ConnectHere.nudges() {"))
    }

    @Test func chatGPTIsUnchanged() {
        for mac in [false, true] {
            #expect(!ConnectHere.onMacOnly(.chatgpt, mac: mac))
            #expect(ConnectHere.press(.chatgpt, connected: false, mac: mac) == .guide)
            #expect(ConnectHere.press(.chatgpt, connected: true, mac: mac) == .guide)
        }
        #expect(Guide.chatgpt.line == "Chat with ChatGPT")
    }

    @Test func claudeCodexAndOthersAreConnectedOnTheMac() {
        for g in [Guide.claude, .codex, .other] {
            #expect(ConnectHere.onMacOnly(g, mac: false))
            #expect(ConnectHere.press(g, connected: false, mac: false) == .onMac, "\(g)")
            #expect(ConnectHere.press(g, connected: true, mac: false) == .nothing, "a connected one starts nothing")
            #expect(!ConnectHere.onMacOnly(g, mac: true))
        }
        // The Mac as before.
        #expect(ConnectHere.press(.claude, connected: false, mac: true) == .start)
        #expect(ConnectHere.press(.codex, connected: false, mac: true) == .start)
        #expect(ConnectHere.press(.other, connected: false, mac: true) == .guide)
        #expect(ConnectHere.press(.incredible, connected: false, mac: true) == .guide)
    }

    @Test func theClaudeRowOffersTheMacLink() {
        #expect(ConnectOnMacWords.line(.claude) == "Connect Claude on your Mac")
        #expect(ConnectOnMacWords.line(.codex) == "Connect Codex on your Mac")
        #expect(ConnectOnMacWords.line(.other) == "Connect another AI on your Mac")
        #expect(ConnectOnMacWords.send == "Send the Mac link to myself")
        #if os(iOS)
        #expect(ConnectOnMacWords.send == AppleNotesOnMacSheet.send, "the same words as the Mac card")
        #endif
        #expect(OnboardingFlow.macDownload.absoluteString == "https://pintonotes.com/download")
        for g in [Guide.claude, .codex, .other] {
            for w in [ConnectOnMacWords.line(g), ConnectOnMacWords.text(g), ConnectOnMacWords.noMac] {
                #expect(!w.contains("\u{2014}") && !w.contains("!") && !w.contains("MCP"), "\(w)")
            }
        }
    }

    @Test func helpOnIPhoneIsChatGPTsOnly() {
        let all: [Guide] = [.chatgpt, .claude, .claudeCode, .codex, .other]
        #expect(ConnectHere.helped(all, mac: false) == [.chatgpt])
        #expect(ConnectHere.helped(all, mac: true) == all)
    }
}
