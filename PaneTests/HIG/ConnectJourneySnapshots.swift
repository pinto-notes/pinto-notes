import CryptoKit
import Supabase
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// The connect journey screen by screen: iPhone at 375 points wide at the default and the largest
/// text size, and the Mac's sheet. Offscreen; runs only when AMBER_HIG_SHOTS is set. Mac:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/ConnectJourneySnapshots`; iPhone: the same
/// test on a simulator (`xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:PaneTests/ConnectJourneySnapshots CODE_SIGNING_ALLOWED=NO`).
@MainActor @Suite(.serialized) struct ConnectJourneySnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")

    static let pageKey = P256.KeyAgreement.PrivateKey().publicKey.x963Representation
    static let scan = ConnectScan(url: URL(string: "ambernotes://connect?request=5a0f6c1e-2b1d-4c36-9e0a-6b6f0c1a2b3c#s=AbCdEfGhIjKlMnOpQrSt_-&k=\(ConnectScan.base64url(Data(SHA256.hash(data: pageKey))))")!)!

    /// Claude in the computer's browser, the page's code scanned with the phone.
    static let scanned = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude.ai",
                                        redirect_uri: "https://claude.ai/api/mcp/auth_callback", claimed_name: nil,
                                        loopback: false, wants_write: true, asked: true, started_at: .now.addingTimeInterval(-20),
                                        started_from: "Safari on a Mac", state: "s1", iss: "https://mcp.ambernotes.app",
                                        scan: true, browser_key: pageKey.base64EncodedString())
    /// Signed in on the page for a notification instead: the number to compare.
    static let notified = ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com",
                                         redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect", claimed_name: nil,
                                         loopback: false, wants_write: true, asked: true, started_at: .now.addingTimeInterval(-20),
                                         started_from: "Chrome on Windows", state: "s1", iss: "https://mcp.ambernotes.app")
    /// An app Amber Notes can't name, by link on this device.
    static let unknown = ConnectRequest(id: UUID(), client_name: "notes-helper.example.com", redirect_host: "notes-helper.example.com",
                                        redirect_uri: "https://notes-helper.example.com/callback", claimed_name: "Notes Helper",
                                        loopback: false, wants_write: true)
    /// Claude in this Mac's own browser, by link: no number to compare.
    static let claudeHere = ConnectRequest(id: UUID(), client_name: "Claude", redirect_host: "claude.ai",
                                           redirect_uri: "https://claude.ai/api/mcp/auth_callback", claimed_name: nil,
                                           loopback: false, wants_write: true)
    static let match: ConnectMatch.Match = {
        let row = ConnectAskMatch(browser_key: Data(repeating: 4, count: 65).base64EncodedString(), match_commit: String(repeating: "a", count: 64))
        return ConnectMatch.Match(snapshot: ConnectMatch.Snapshot(row)!, row: row, number: "42")
    }()

    static func sheet(_ phase: ConsentSheet.Phase, match: ConnectMatch.Match? = nil) -> ConsentSheet {
        ConsentSheet(client: client, requestID: UUID(), initial: phase, finish: { _ in }, scan: scan, previewMatch: match)
    }

    static let sheets: [(String, ConsentSheet)] = [
        ("3-allow-scanned", sheet(.asking(scanned))),
        ("4-allow-claude-here", sheet(.asking(claudeHere))),
        ("5-allow-notification", sheet(.asking(notified), match: match)),
        ("6-allow-unknown-app", sheet(.asking(unknown))),
        ("7-connected", sheet(.handedOff("claude.ai"))),
    ]

    static func guide(connected: Bool = false) -> some View {
        NavigationStack {
            Form { ConnectChoices(client: client, listsConnected: false, preview: connected ? [Connection(id: UUID(), name: "Claude", kind: "oauth",
                       can_write: true, created_at: .now, last_used_at: nil, revoked_at: nil, redirect_host: "claude.ai")] : [], previewFound: []) }
                .formStyle(.grouped)
                .navigationTitle("Connect an AI")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
        }
    }

    #if os(iOS)
    static func settings() -> some View {
        NavigationStack {
            Form { ConnectAISection(client: client, preview: []) }
                .formStyle(.grouped)
                .navigationTitle("Settings")
                .navigationBarTitleDisplayMode(.inline)
        }
        .environment(ConnectGuideRoute())
    }

    static func shoot(_ view: some View, _ name: String, size: CGSize, type: DynamicTypeSize, dark: Bool, scene: UIWindowScene, dir: URL) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.dynamicTypeSize(type).tint(Color("AccentColor")))
        window.isHidden = false
        try? await Task.sleep(for: .seconds(1.6))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.rootViewController?.dismiss(animated: false)
        window.isHidden = true
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: [(DynamicTypeSize.large, false), (.large, true), (.accessibility5, false)])
    func iPhone(_ type: DynamicTypeSize, _ dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let t = (type == .large ? "default" : "largest") + (dark ? "-dark" : "")
        // The largest text gets a tall window, so the whole sheet shows: nothing may be cut short.
        let tall = CGSize(width: 375, height: type == .large ? 812 : 2000)
        let phone = CGSize(width: 375, height: 812)
        try await Self.shoot(Self.settings(), "iphone-1-settings-\(t)", size: phone, type: type, dark: dark, scene: scene, dir: dir)
        try await Self.shoot(ConnectAISheet(client: Self.client, preview: [], previewFound: [.claude]), "iphone-2a-guide-\(t)", size: phone, type: type, dark: dark, scene: scene, dir: dir)
        // The request arrived: step 2 is the one at hand.
        ConnectCenter.shared.pending = UUID()
        try await Self.shoot(Self.guide(), "iphone-2b-guide-waiting-\(t)", size: phone, type: type, dark: dark, scene: scene, dir: dir)
        ConnectCenter.shared.pending = nil
        try await Self.shoot(Self.guide(connected: true), "iphone-8-guide-connected-\(t)", size: phone, type: type, dark: dark, scene: scene, dir: dir)
        for (name, sheet) in Self.sheets {
            let view = Color(.systemGroupedBackground).ignoresSafeArea().sheet(isPresented: .constant(true)) { sheet.dynamicTypeSize(type) }
            try await Self.shoot(view, "iphone-\(name)-\(t)", size: tall, type: type, dark: dark, scene: scene, dir: dir)
        }
    }
    #endif

    #if os(macOS)
    /// The Mac's sheet, opened by the page's Open Amber Notes on this Mac.
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        let d = dark ? "dark" : "light"
        try await AppSnapshotTests.render(Self.guide().frame(width: 360, height: 520), name: "mac-2a-guide-\(d)", dark: dark, wait: 1.4)
        ConnectCenter.shared.pending = UUID()
        try await AppSnapshotTests.render(Self.guide().frame(width: 360, height: 520), name: "mac-2b-guide-waiting-\(d)", dark: dark, wait: 1.4)
        ConnectCenter.shared.pending = nil
        for (name, sheet) in Self.sheets {
            try await AppSnapshotTests.render(sheet, name: "mac-\(name)-\(d)", dark: dark, wait: 1.4)
        }
        try await AppSnapshotTests.render(Self.guide(connected: true).frame(width: 360, height: 520), name: "mac-8-guide-connected-\(d)", dark: dark, wait: 1.4)
    }

    /// The sheet as it's presented: over the real main window, attached under its title bar.
    /// Composited: a presented sheet window can't be drawn offscreen, so the real RootView (demo
    /// library) and the real sheet are each drawn offscreen and placed as macOS places a sheet,
    /// centred, its top under the title bar, with the system's sheet corners and shadow. The
    /// window's traffic lights are drawn in, since the offscreen window has no chrome.
    @Test(arguments: [false, true])
    func macPresented(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let d = dark ? "dark" : "light"
        let c = try AppSnapshotTests.container()
        let main = try await AppSnapshotTests.withLastNote(c, "Welcome to Pinto Notes") {
            try await Self.capture(RootView().modelContainer(c), size: CGSize(width: 1180, height: 760), dark: dark, wait: 0.8)
        }
        for (name, sheet) in Self.sheets where name != "7-connected" {
            let drawn = try await Self.capture(sheet, size: nil, dark: dark, wait: 1.4)
            let out = try Self.present(drawn, over: main, dark: dark)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try #require(out.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-presented-\(name)-\(d).png"))
        }
    }

    /// Draws `view` offscreen (borderless, at -20000, -20000, never shown) at `size`, or at its
    /// fitting size.
    static func capture(_ view: some View, size: CGSize?, dark: Bool, wait: Double) async throws -> NSBitmapImageRep {
        let host = NSHostingView(rootView: view)
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: 600, height: 900), styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.appearance = host.appearance
        window.contentView = host
        let fit = size ?? host.fittingSize
        host.frame = CGRect(origin: .zero, size: fit)
        window.setContentSize(fit)
        try? await Task.sleep(for: .seconds(wait))
        defer { window.close() }
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return rep
    }

    /// The title bar's height over the main window, where a sheet attaches.
    static let titleBar: CGFloat = 52

    static func present(_ sheet: NSBitmapImageRep, over main: NSBitmapImageRep, dark: Bool) throws -> NSBitmapImageRep {
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: main.pixelsWide, pixelsHigh: main.pixelsHigh, bitsPerSample: 8,
                                                samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = main.size
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: out))
        NSGraphicsContext.saveGraphicsState()
        defer { NSGraphicsContext.restoreGraphicsState() }
        NSGraphicsContext.current = ctx
        let W = main.size.width, H = main.size.height
        main.draw(in: CGRect(x: 0, y: 0, width: W, height: H))
        // The traffic lights, as the real window draws them.
        for (i, hex) in [0xFF5F57, 0xFEBC2E, 0x28C840].enumerated() {
            Palette.rgb(UInt32(hex)).setFill()
            NSBezierPath(ovalIn: CGRect(x: 20 + CGFloat(i) * 20, y: H - 20 - 12, width: 12, height: 12)).fill()
        }
        let sw = sheet.size.width, sh = sheet.size.height
        let frame = CGRect(x: ((W - sw) / 2).rounded(), y: H - Self.titleBar - sh, width: sw, height: sh)
        let shape = NSBezierPath(roundedRect: frame, xRadius: 16, yRadius: 16)
        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(dark ? 0.55 : 0.22)
        shadow.shadowBlurRadius = 34
        shadow.shadowOffset = CGSize(width: 0, height: -10)
        shadow.set()
        Palette.sheetGround.setFill()
        shape.fill()
        NSGraphicsContext.restoreGraphicsState()
        NSGraphicsContext.saveGraphicsState()
        shape.addClip()
        sheet.draw(in: frame)
        NSGraphicsContext.restoreGraphicsState()
        NSColor(white: dark ? 1 : 0, alpha: dark ? 0.12 : 0.10).setStroke()
        let edge = NSBezierPath(roundedRect: frame.insetBy(dx: 0.25, dy: 0.25), xRadius: 16, yRadius: 16)
        edge.lineWidth = 0.5
        edge.stroke()
        return out
    }
    #endif
}
