import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// Connecting ChatGPT or Claude when the yes happens on the web page (29 October 2026): an account
    /// whose key the server keeps a copy of gets one screen and one button, and every line that used
    /// to say "allow it here" says to allow it on the page. Accounts without the copy keep the app's
    /// approval, word for word. Among the funnel tests: the guides record funnel steps.
    @MainActor @Suite struct ConnectBrowserTests {
        typealias Guide = ConnectAISection.Guide

        // MARK: Which sheet opens

        @Test func theBrowserSheetOpensOnlyWhenTheServerKeepsTheKey() {
            for compact in [false, true] {
                #expect(BrowserConnect.opensSheet(.chatgpt, onWeb: true, compact: compact))
                #expect(!BrowserConnect.opensSheet(.chatgpt, onWeb: false, compact: compact), "strict: the ChatGPT guide as before")
                #expect(!BrowserConnect.opensSheet(.claude, onWeb: false, compact: compact), "strict: Claude's row as before")
                for g in [Guide.claudeCode, .codex, .incredible, .other] {
                    #expect(!BrowserConnect.opensSheet(g, onWeb: true, compact: compact), "\(g) keeps its own way")
                }
            }
            #expect(BrowserConnect.opensSheet(.claude, onWeb: true, compact: false), "Claude on the Mac")
            #expect(!BrowserConnect.opensSheet(.claude, onWeb: true, compact: true), "Claude on iPhone still goes to the computer")
            #expect(BrowserConnect.offered(compact: false) == [.chatgpt, .claude])
            #expect(BrowserConnect.offered(compact: true) == [.chatgpt])
        }

        // MARK: What the sheet says

        @Test func theSheetNamesWhatIsSentAndToWhichCompany() {
            #expect(BrowserConnect.sharedLead(.chatgpt) == "Shared with OpenAI.")
            #expect(BrowserConnect.sharedLead(.claude) == "Shared with Anthropic.")
            #expect(BrowserConnect.shared(.chatgpt) == "The notes ChatGPT opens, with their text and files, are sent to OpenAI and handled under OpenAI\u{2019}s privacy policy. Nothing is shared until you choose Allow.")
            #expect(BrowserConnect.shared(.claude) == "The notes Claude opens, with their text and files, are sent to Anthropic and handled under Anthropic\u{2019}s privacy policy. Nothing is shared until you choose Allow.")
            #expect(BrowserConnect.button(.chatgpt) == "Open ChatGPT")
            #expect(BrowserConnect.button(.claude) == "Open Claude")
            for g in [Guide.chatgpt, .claude] {
                for listing in [nil, URL(string: "https://chatgpt.com/plugins/pinto-notes")] {
                    let line = BrowserConnect.line(g, listing: listing)
                    #expect(line.hasSuffix("sign in and choose Allow on the Pinto Notes page."), "\(line)")
                    for text in [line, BrowserConnect.shared(g), BrowserConnect.noticed] {
                        #expect(!text.contains("\u{2014}"), "no em dashes: \(text)")
                    }
                }
            }
        }

        /// One page whose button opens the AI's own connector page, and which waits once it's open.
        @Test func eachAIsPageOpensItsConnectorSetup() throws {
            let server = "https://mcp.example.com"
            let cases: [(Guide, URL?, URL, Bool)] = [
                (.chatgpt, nil, ChatGPTPlugin.plugins, true),
                (.chatgpt, URL(string: "https://chatgpt.com/plugins/pinto-notes")!, URL(string: "https://chatgpt.com/plugins/pinto-notes")!, false),
                (.claude, nil, WebConnectPlan.directoryListing, false),
            ]
            for (g, listing, expected, copies) in cases {
                var opened: [URL] = [], copied: [String] = []
                let run = ConnectGuideRun(ai: g, guide: .browser(g, listing: listing), server: server)
                run.open = { opened.append($0) }
                run.copy = { copied.append($0) }
                #expect(run.stage == .step(0) && !run.waits)
                run.primary()
                #expect(opened == [expected], "\(g)")
                #expect(copied == (copies ? [server] : []), "\(g): the address is copied only for a custom server")
                #expect(run.waits, "\(g) waits once its page is open")
                #expect(run.stage == .step(0), "one page")
                run.stop()
            }
        }

        /// The funnel: opened, started, waiting and connected once each, for the AI picked.
        @Test func theSheetSaysEachStepOnce() {
            for ai in ConnectAIKind.allCases { ConnectFunnel.closed(ai) }
            let steps = FunnelSteps()
            steps.watch {
                let route = ConnectGuideRoute()
                route.guideOpened(.chatgpt)
                route.guideSwitched(to: .claude)
                let r = ConnectGuideRun(ai: .claude, guide: .browser(.claude), server: "https://mcp.example.com")
                r.open = { _ in }
                r.copy = { _ in }
                r.primary()
                r.connected("Claude")
                route.guideClosed()
            }
            #expect(steps.events == [.connectStep(.chatgpt, .opened), .connectStep(.claude, .opened), .connectStep(.claude, .started),
                                     .connectStep(.claude, .waiting), .connectStep(.claude, .connected)])
        }

        /// Allowed on the web page: the server writes the connection and its "AI connected" notice,
        /// and the sheet turns Connected at once, with no approval on this device.
        @Test(arguments: [Guide.chatgpt, .claude])
        func theSheetHearsAWebApproval(_ ai: Guide) async throws {
            let center = ConnectCenter()
            let list = ConnectionList()
            let run = ConnectGuideRun(ai: ai, guide: .browser(ai), server: "https://mcp.example.com")
            run.center = center
            run.open = { _ in }
            run.copy = { _ in }
            run.primary()
            run.watch(list.supabase)
            try await Task.sleep(for: .milliseconds(300))
            #expect(run.stage == .step(0), "nothing connected yet")
            list.add(oauth: ai == .chatgpt ? "chatgpt.com" : "claude.ai", name: ai.title)
            center.connectionMayHaveAppeared()
            let start = ContinuousClock.now
            while run.stage != .connected, ContinuousClock.now - start < .seconds(2) { try await Task.sleep(for: .milliseconds(20)) }
            #expect(run.stage == .connected, "\(ai)")
            #expect(ContinuousClock.now - start < .milliseconds(800))
            run.stop()
        }

        // MARK: Allow on the page, or in the app

        @Test func approvingOnTheWebIsSaidWhereTheAppUsedToAsk() {
            #expect(BrowserConnect.allowStep(onWeb: true) == "Sign in on the Pinto Notes page that opens, then choose Allow.")
            #expect(WebConnectPlan.allowStep(onWeb: true) == BrowserConnect.allowStep(onWeb: true))
            #expect(WebConnectPlan.chatgpt(onWeb: true).steps.last == BrowserConnect.allowStep(onWeb: true))
            #expect(WebConnectPlan.claude(onWeb: true).steps.last == BrowserConnect.allowStep(onWeb: true))
            #expect(IncredibleConnect.steps(onWeb: true).contains(BrowserConnect.allowStep(onWeb: true)))
            #expect(ConnectCopy.allowInBrowser(onWeb: true) == "In your browser: sign in to Pinto Notes, then choose Allow.")
            #expect(ConnectCopy.opensBrowser(.codex, onWeb: true) == "Codex opens your browser to sign in. Then choose Allow there.")
            #expect(BrowserConnect.allowWhere(onWeb: true) == "Choose Allow on the Pinto Notes page.")
            let form = ConnectWebGuide.chatgpt(listing: nil, onWeb: true).steps[1].text
            #expect(form.hasSuffix("Choose Allow on the Pinto Notes page."), "\(form)")
            let plugin = ConnectWebGuide.chatgpt(listing: URL(string: "https://chatgpt.com/plugins/pinto-notes"), onWeb: true).steps[0].text
            #expect(plugin.hasSuffix("sign in and choose Allow on the Pinto Notes page."), "\(plugin)")
        }

        /// Accounts without the server's copy keep today's words.
        @Test func strictAccountsKeepTheAppsApprovalWords() {
            #if os(macOS)
            #expect(WebConnectPlan.allowStep(onWeb: false) == "Choose Open Pinto Notes on this Mac, or scan the code with your iPhone. Then choose Allow.")
            #expect(IncredibleConnect.allowStep(onWeb: false) == "Scan the code it shows with your iPhone (or open Pinto Notes on this Mac), then choose Allow.")
            #endif
            #expect(WebConnectPlan.chatgpt(onWeb: false).steps.last == WebConnectPlan.allowStep(onWeb: false))
            #expect(ConnectCopy.allowInBrowser(onWeb: false) == "In your browser: choose Open Pinto Notes, then Allow.")
            #expect(ConnectCopy.opensBrowser(.codex, onWeb: false) == "Codex opens your browser to sign in. Then allow it here.")
            #expect(BrowserConnect.allowWhere(onWeb: false) == "Choose Allow when Pinto Notes asks.")
            #expect(ConnectWebGuide.chatgpt(listing: nil, onWeb: false).steps[1].text.hasSuffix("then Create. Choose Allow when Pinto Notes asks."))
            #expect(ConnectWebGuide.chatgpt(listing: URL(string: "https://chatgpt.com/plugins/pinto-notes"), onWeb: false).steps[0].text.hasSuffix("then Allow here."))
        }
    }
}
