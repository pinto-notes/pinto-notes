import Supabase
import SwiftUI
import Testing
@testable import Pane
#if os(macOS)
import AppKit
#endif

/// The Allow sheet an AI's connect request opens, laid out as a Mac form: the AI and Pinto with
/// the title beside them, access as two cards, the facts as rows, Don't Allow and Allow bottom right.
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
        #expect(ConsentSheet.title(Self.glama) == "Connect glama.ai to your notes?", "titled by where access goes")
        let line = ConsentSheet.detail(Self.glama)
        #expect(line.contains("It calls itself Glama."))
        #expect(line.contains("Only allow it if you just started connecting it yourself."))
        // A claimed name is never what the person is told to check against.
        let spoof = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude-login.example",
                                   redirect_uri: "https://claude-login.example/cb", claimed_name: "Claude", loopback: false, wants_write: true)
        #expect(ConsentSheet.title(spoof) == "Connect claude-login.example to your notes?")
        #expect(!ConsentSheet.detail(spoof).contains("connecting Claude"))
        #expect(ConsentSheet.detail(Self.claude) == "Shared with Anthropic. The notes Claude opens, with their text and files, are sent to Anthropic and handled under Anthropic\u{2019}s privacy policy. Locked notes stay private. Claude can\u{2019}t open them.")
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
        // The footer only: Pinto's icon and the chosen card's outline are amber too.
        for y in (rep.pixelsHigh - Int(56 * scale))..<rep.pixelsHigh {
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

    /// Layout A (28 Oct 2026): a left-aligned form. Access is two cards, Read and edit chosen as
    /// the app asked; the one filled button, Allow, sits bottom right like every Mac sheet's.
    @Test func accessIsTwoCardsAndAllowSitsBottomRight() async throws {
        let (w, host) = await Self.host(ConsentSheet(client: Self.client, requestID: Self.glama.id, initial: .asking(Self.glama), finish: { _ in }))
        defer { w.close() }
        #expect(host.bounds.width == ConsentSheet.width)
        #expect(Self.segments(host).isEmpty, "no segmented control: the choice is two cards")
        #expect(ConsentSheet.accessOptions(Self.glama) == [true, false], "Read and edit, then Read only")
        #expect(ConsentSheet.detail(Self.glama).hasPrefix(ConsentSheet.unknownLead), "an app Pinto can't name: the warning first")
        #expect(ConsentSheet.detail(Self.claude).hasPrefix("Shared with Anthropic."), "a known AI: no warning")
        let (box, filled) = try Self.amberBox(host)
        #expect(box.maxX > host.bounds.width - 30 && box.minX > host.bounds.width * 0.7, "Allow sits on the right: \(box)")
        #expect(box.maxY > host.bounds.height - 60, "and at the bottom: \(box) in \(host.bounds)")
        #expect(filled > 0.75, "a filled button, nothing else amber down there: \(filled)")
    }

    @Test func anAppThatAsksOnlyToReadGetsOnlyTheReadOnlyCard() async throws {
        let reader = ConnectRequest(id: UUID(), client_name: "glama", redirect_host: "glama.ai", redirect_uri: "https://glama.ai/oauth/callback",
                                    claimed_name: "glama", loopback: false, wants_write: false)
        let (w, host) = await Self.host(ConsentSheet(client: Self.client, requestID: reader.id, initial: .asking(reader), finish: { _ in }))
        defer { w.close() }
        #expect(ConsentSheet.accessOptions(reader) == [false])
        #expect(try Self.amberBox(host).box.width > 40, "Allow still shows")
        #expect(ConsentSheet.accessLine(write: false) == "It can find and read notes, nothing more.")
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
