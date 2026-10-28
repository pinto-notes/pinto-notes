import Supabase
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// The Allow sheet an AI's connect request opens: the AI and Pinto side by side, a short title,
/// grey text that says what is sent and to whom, and Don't Allow, Read Only and a filled Allow.
@MainActor @Suite struct AllowSheetTests {
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
    static let glama = ConnectRequest(id: UUID(), client_name: "glama", redirect_host: "glama.ai",
                                      redirect_uri: "https://glama.ai/oauth/callback", claimed_name: "glama", loopback: false, wants_write: true)
    static let claude = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude.ai",
                                       redirect_uri: "https://claude.ai/api/mcp/auth_callback", loopback: false, wants_write: true)

    @Test func anAllLowercaseNameReadsAsAName() {
        #expect(ConsentSheet.displayName("glama") == "Glama")
        #expect(ConsentSheet.displayName("claude code") == "Claude Code")
        #expect(ConsentSheet.displayName("ChatGPT") == "ChatGPT")
        #expect(ConsentSheet.displayName("iA Writer") == "iA Writer")
    }

    @Test func anUnknownAppGetsACalmCautionAndItsNameOnlyAsAClaim() {
        #expect(ConsentSheet.title(Self.glama) == "glama.ai wants to use your notes", "titled by where access goes")
        let line = ConsentSheet.detail(Self.glama)
        #expect(line.contains("It calls itself Glama."))
        #expect(line.contains("Only allow it if you just started connecting it yourself."))
        // A claimed name is never what the person is told to check against.
        let spoof = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude-login.example",
                                   redirect_uri: "https://claude-login.example/cb", claimed_name: "Claude", loopback: false, wants_write: true)
        #expect(ConsentSheet.title(spoof) == "claude-login.example wants to use your notes")
        #expect(!ConsentSheet.detail(spoof).contains("connecting Claude"))
        #expect(ConsentSheet.detail(Self.claude) == "The notes Claude opens, with their text and files, are sent to Anthropic and handled under Anthropic\u{2019}s privacy policy. Locked notes stay private.")
    }

    /// App Review (guidelines 5.1.1 and 5.1.2, 23 Oct 2026): before anything is shared, the sheet
    /// says what is sent and who gets it, by company for the AIs it can name.
    @Test func theSheetSaysWhatIsSentAndToWhom() {
        let chatgpt = ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com",
                                     redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect", loopback: false, wants_write: true)
        #expect(ConsentSheet.detail(chatgpt).contains("sent to OpenAI"))
        #expect(ConsentSheet.detail(Self.claude).contains("sent to Anthropic"))
        for r in [chatgpt, Self.claude, Self.glama] {
            #expect(ConsentSheet.detail(r).contains("with their text and files"), "what is sent")
        }
        // An app it can't name: the address it goes to, never a company it claims.
        #expect(ConsentSheet.detail(Self.glama).contains("are sent to glama.ai."))
        #expect(!ConsentSheet.detail(Self.glama).contains("Anthropic") && !ConsentSheet.detail(Self.glama).contains("OpenAI"))
        // The guide says it before a request exists.
        #expect(ConnectCopy.why.contains("OpenAI or Anthropic") && ConnectCopy.why.contains("Nothing is shared until you allow it."))
    }

    #if os(macOS)
    /// A key window offscreen, never shown and never activating the app.
    final class KeyWindow: NSWindow { override var canBecomeKey: Bool { true } }

    static func host(_ sheet: ConsentSheet, dark: Bool = false) async -> (NSWindow, NSHostingView<some View>) {
        let host = NSHostingView(rootView: sheet)
        let w = KeyWindow(contentRect: CGRect(x: -20000, y: -20000, width: 440, height: 700), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentView = host
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        w.setContentSize(host.fittingSize)
        w.setFrameOrigin(CGPoint(x: -20000, y: -20000))
        host.layoutSubtreeIfNeeded()
        // Allow arms a moment after the sheet shows.
        try? await Task.sleep(for: ConsentSheet.armDelay + .milliseconds(400))
        host.layoutSubtreeIfNeeded()
        w.displayIfNeeded()
        return (w, host)
    }

    /// The segmented controls under the view (SwiftUI's segmented picker is AppKit's).
    static func segments(_ view: NSView) -> [NSSegmentedControl] {
        (view as? NSSegmentedControl).map { [$0] } ?? view.subviews.flatMap(segments)
    }

    /// The amber pixels' box, in points: the one filled button.
    static func amberBox(_ host: NSView) throws -> (box: CGRect, filled: Double) {
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        let scale = CGFloat(rep.pixelsWide) / host.bounds.width
        var amber = 0
        var box = CGRect.null
        // The lower half only: Pinto's icon at the top is amber too.
        for y in rep.pixelsHigh / 2..<rep.pixelsHigh {
            for x in 0..<rep.pixelsWide {
                // Amber: strong red, middling green, little blue (the picture's colour space isn't the palette's).
                guard let c = rep.colorAt(x: x, y: y)?.usingColorSpace(.sRGB),
                      c.redComponent > 0.6, c.redComponent - c.blueComponent > 0.45, (0.3...0.6).contains(c.greenComponent) else { continue }
                amber += 1
                box = box.union(CGRect(x: x, y: y, width: 1, height: 1))
            }
        }
        let points = CGRect(x: box.minX / scale, y: box.minY / scale, width: box.width / scale, height: box.height / scale)
        return (points, Double(amber) / Double(box.width * box.height))
    }

    /// The choice is three buttons in a row, as the prototype Emil liked (28 Oct 2026): Don't Allow,
    /// Read Only, and one filled Allow on the right. No segmented control and no caption to read.
    @Test func theAccessChoiceIsAButtonRowWithOneFilledAllowOnTheRight() async throws {
        let (w, host) = await Self.host(ConsentSheet(client: Self.client, requestID: Self.glama.id, initial: .asking(Self.glama), finish: { _ in }))
        defer { w.close() }
        #expect(Self.segments(host).isEmpty, "no segmented control: Read Only is a button")
        let (box, filled) = try Self.amberBox(host)
        #expect(abs(box.height - 40) <= 1, "one bar 40 points tall: \(box.height)")
        #expect(box.width < host.bounds.width / 3, "a third of the row: \(box.width) of \(host.bounds.width)")
        #expect(box.minX > host.bounds.width / 2, "Allow sits on the right: \(box.minX)")
        #expect(filled > 0.8, "a filled bar, nothing else amber: \(filled)")
    }

    @Test func anAppThatAsksOnlyToReadGetsNoReadOnlyButton() async throws {
        let reader = ConnectRequest(id: UUID(), client_name: "glama", redirect_host: "glama.ai", redirect_uri: "https://glama.ai/oauth/callback",
                                    claimed_name: "glama", loopback: false, wants_write: false)
        let (w1, h1) = await Self.host(ConsentSheet(client: Self.client, requestID: Self.glama.id, initial: .asking(Self.glama), finish: { _ in }))
        let writerAllow = try Self.amberBox(h1).box
        w1.close()
        let (w, host) = await Self.host(ConsentSheet(client: Self.client, requestID: reader.id, initial: .asking(reader), finish: { _ in }))
        defer { w.close() }
        // Two buttons share the row, so Allow is wider than with three.
        let readerAllow = try Self.amberBox(host).box
        #expect(readerAllow.width > writerAllow.width * 1.2, "\(readerAllow) vs \(writerAllow)")
        #expect(ConsentSheet.accessLine(write: false) == "It can read notes, but not change them.")
    }

    /// A key press to the window, as the keyboard makes it (never a system-wide event).
    static func press(_ characters: String, code: UInt16, in w: NSWindow) {
        let e = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: w.windowNumber,
                                 context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code)!
        _ = w.performKeyEquivalent(with: e)
    }

    @Test func returnAllowsAfterTouchIDAndEscapeDoesNot() async throws {
        var confirmed: [String] = []
        var answered: [UUID] = []
        var sheet = ConsentSheet(client: Self.client, requestID: Self.glama.id, initial: .asking(Self.glama), finish: { _ in },
                                 answering: { answered.append($0) })
        sheet.canConfirm = { true }
        sheet.confirm = { confirmed.append($0); return false }
        let (w, _) = await Self.host(sheet)
        defer { w.close() }
        Self.press("\r", code: 36, in: w)
        try? await Task.sleep(for: .milliseconds(300))
        #expect(confirmed == ["glama.ai"], "Return is Allow, and Allow asks for Touch ID first")
        #expect(answered.isEmpty, "Touch ID said no: nothing is answered")
        Self.press("\u{1b}", code: 53, in: w)
        try? await Task.sleep(for: .milliseconds(300))
        #expect(answered == [Self.glama.id], "Escape is Don't Allow")
        #expect(confirmed.count == 1, "Don't Allow asks for nothing")
    }

    /// 13 October 2026: an answer that failed left the request held by this account, and the
    /// recovery key on the page, signed in to another account, was turned away. A sheet closed
    /// without an answer lets go of it.
    @Test func closingWithoutAnAnswerLetsGoOfTheRequest() async throws {
        var released: [UUID] = []
        var sheet = ConsentSheet(client: Self.client, requestID: Self.claude.id, initial: .failed("Something went wrong."), finish: { _ in })
        sheet.release = { _, id in released.append(id) }
        let (w, _) = await Self.host(sheet)
        #expect(released.isEmpty, "showing it lets go of nothing")
        w.contentView = nil
        w.close()
        for _ in 0..<20 where released.isEmpty { try? await Task.sleep(for: .milliseconds(50)) }
        #expect(released == [Self.claude.id])
    }

    @Test func releaseAsksTheServerToLetGo() async throws {
        final class Sent: @unchecked Sendable { var calls: [(String, String, [String: Any]?)] = [] }
        let sent = Sent()
        let id = UUID()
        try await ConnectAPI.release(id: id) { path, method, body in sent.calls.append((path, method, body)); return Data("{}".utf8) }
        #expect(sent.calls.count == 1)
        #expect(sent.calls.first?.0 == "/connect/release" && sent.calls.first?.1 == "POST")
        #expect(sent.calls.first?.2?["id"] as? String == id.uuidString.lowercased())
    }
    #endif
}
