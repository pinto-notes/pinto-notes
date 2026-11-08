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

    /// The note list's ••• menu (iPhone only) never offers Connect an AI (Emil, 8 November 2026).
    @Test func listMenuNeverOffersConnect() throws {
        let menus = try String(contentsOf: try TestFiles.url("Views").appending(path: "NoteListMenus.swift"), encoding: .utf8)
        #expect(!menus.contains("connectAI"))
        let list = try String(contentsOf: try TestFiles.url("Views").appending(path: "NoteListView.swift"), encoding: .utf8)
        #expect(list.contains("ListMoreMenu.groups(asks:"))
        #expect(!list.contains("list.connectAI"))
    }

    /// The app's code as iPhone builds it: every line outside `#if os(macOS)` (and its `#else`
    /// inside `#if os(iOS)`), file by file.
    static func iPhoneLines() throws -> [(file: String, line: String)] {
        var out: [(String, String)] = []
        for folder in ["Views", "App", "Model", "Editor", "Sync"] {
            guard let dir = try? TestFiles.url(folder),
                  let files = FileManager.default.enumerator(at: dir, includingPropertiesForKeys: nil) else { continue }
            for case let url as URL in files where url.pathExtension == "swift" {
                // Each open #if: whether iPhone builds what's under it now (nil: not an os() test,
                // so both branches count).
                var stack: [Bool?] = []
                for raw in try String(contentsOf: url, encoding: .utf8).components(separatedBy: "\n") {
                    let t = raw.trimmingCharacters(in: .whitespaces)
                    if t.hasPrefix("#if ") {
                        stack.append(t.contains("os(macOS)") && !t.contains("||") ? false : t.contains("os(iOS)") && !t.contains("||") ? true : nil)
                    } else if t.hasPrefix("#elseif") {
                        if let last = stack.popLast() { stack.append(last == nil ? nil : !(last!)) }
                    } else if t.hasPrefix("#else") {
                        if let last = stack.popLast() { stack.append(last.map { !$0 }) }
                    } else if t.hasPrefix("#endif") {
                        _ = stack.popLast()
                    } else if stack.allSatisfy({ $0 != false }) {
                        out.append(("\(folder)/\(url.lastPathComponent)", raw))
                    }
                }
            }
        }
        return out
    }

    /// No iPhone path opens Connect an AI (Emil, 8 November 2026): nothing iPhone builds posts
    /// paneConnectAI, listens for it, or opens ConnectAISheet, the choices or the setup rows,
    /// outside the -uitest pictures (CaptureScreen) and their own definitions.
    @Test func noIPhonePathConnects() throws {
        let lines = try Self.iPhoneLines()
        #expect(lines.count > 10_000, "read the app's code: \(lines.count) lines")
        let allowed: Set<String> = ["App/PaneApp.swift"]
        for needle in ["post(name: .paneConnectAI", "publisher(for: .paneConnectAI)", "ConnectAISheet(client",
                       "AIAddRows(", "SettingsSubPageRow(page: .addAI"] {
            let hits = lines.filter { $0.line.contains(needle) && !allowed.contains($0.file) && !$0.line.trimmingCharacters(in: .whitespaces).hasPrefix("//") }
            #expect(hits.isEmpty, "\(needle): \(hits.map { "\($0.file): \($0.line)" })")
        }
        // ConnectChoices only where iPhone can't reach it: onboarding has no steps on iPhone, and
        // Make It an App says where to connect instead.
        let choices = lines.filter { $0.line.contains("ConnectChoices(client") && !allowed.contains($0.file) }.map(\.file)
        #expect(Set(choices).isSubset(of: ["Views/ConnectChoices.swift", "Views/ConnectAI.swift", "Views/OnboardingFlow.swift", "Views/MakeAnApp.swift"]), "\(choices)")
        #expect(Onboarding.steps(mac: false).isEmpty, "iPhone's first run has no Connect step")
        #expect(MakeAnApp.chooseLine(mac: false).isEmpty && MakeAnApp.chooseLine(mac: true) == " Choose yours to connect it.")
        let make = try String(contentsOf: try TestFiles.url("Views").appending(path: "MakeAnApp.swift"), encoding: .utf8)
        let phone = try #require(make.range(of: "} else if !ConnectHere.onMac {"))
        let picker = try #require(make.range(of: "ConnectChoices(client: client, guides: MakeAnApp.connectGuides"))
        #expect(phone.lowerBound < picker.lowerBound, "Make It an App's iPhone line comes before the choices")
        #expect(NoteSourceSheet.connectLine(mac: false) == "Connect your AI on your Mac, or from ChatGPT or Claude, then paste this into it.")
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
        #expect(ConnectOnMacWords.macDownload == OnboardingFlow.macDownload, "the same link")
        #endif
        #expect(ConnectOnMacWords.macDownload.absoluteString == "https://pintonotes.com/download")
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
