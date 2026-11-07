#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// Persona council, 4 November 2026 (W2, AI and privacy): the Allow sheet, the one-click Connect
/// popup, Privacy and security signed out, and the receipt for an AI's edit, light and dark, at a
/// fixed size. Drawn offscreen with cacheDisplay; the windows are never ordered in. This file runs
/// unchanged on release/1.3 for the before pictures (PersonaAIAfterShots has the new screens).
/// `TEST_RUNNER_PANE_PERSONA_SHOTS=/dir TEST_RUNNER_PANE_PERSONA_SIDE=before|after scripts/qa-test.sh PaneTests/PersonaAIShots`
@MainActor @Suite(.serialized) struct PersonaAIShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["PANE_PERSONA_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var side: String { ProcessInfo.processInfo.environment["PANE_PERSONA_SIDE"] ?? "after" }

    /// The view at `size`, top left, on an opaque ground.
    static func shoot(_ view: some View, size: CGSize, dark: Bool, ground: Color? = nil, wait: Double = 1.0) async throws -> NSBitmapImageRep {
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        let host = NSHostingView(rootView: view.frame(width: size.width, height: size.height, alignment: .top).background(ground ?? .clear).tint(Color(PColor.paneAccent)))
        host.appearance = w.appearance
        host.frame = CGRect(origin: .zero, size: size)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(wait))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        let out = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: rep.pixelsWide, pixelsHigh: rep.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        out.size = rep.size
        let saved = NSGraphicsContext.current
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
        defer { NSGraphicsContext.current = saved }
        (dark ? NSColor.black : NSColor.white).setFill()
        CGRect(origin: .zero, size: rep.size).fill()
        rep.draw(in: CGRect(origin: .zero, size: rep.size), from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: false, hints: nil)
        return out
    }

    static func save(_ rep: NSBitmapImageRep, _ slug: String, _ name: String, dark: Bool) throws {
        guard let dir else { return }
        let folder = dir.appending(path: slug)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: folder.appending(path: "\(side)-\(name)-\(dark ? "dark" : "light").png"))
    }

    static let chatgpt = ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com",
                                        redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect", loopback: false)

    @Test func allowSheetAndConnectPopup() async throws {
        guard Self.dir != nil else { return }
        for dark in [false, true] {
            for (r, name) in [(Self.chatgpt, "allow-chatgpt"), (AllowSheetTests.glama, "allow-unknown-app")] {
                let sheet = ConsentSheet(client: AllowSheetTests.client, requestID: r.id, initial: .asking(r), finish: { _ in })
                let rep = try await Self.shoot(sheet, size: CGSize(width: 440, height: 560), dark: dark, ground: Color(Palette.page), wait: 1.2)
                try Self.save(rep, "plain-scope-at-allow", name, dark: dark)
            }
            let popup = ConnectBrowserSheet(run: ConnectGuideRun(ai: .chatgpt, guide: .browser(.chatgpt)))
            let rep = try await Self.shoot(popup.fixedSize(), size: CGSize(width: 760, height: 440), dark: dark, ground: ConnectBrowserSheet.ground, wait: 1.2)
            try Self.save(rep, "plain-scope-at-allow", "connect-popup-chatgpt", dark: dark)
        }
    }

    @Test func privacySignedOut() async throws {
        guard Self.dir != nil else { return }
        for dark in [false, true] {
            let page = SettingsView(backend: Backend(), sync: nil).page(.security)
                .padding(20).frame(width: SettingsCard.pageWidth).background(SettingsInk.ground)
                .environment(\.settingsAsPage, true)
            let rep = try await Self.shoot(page, size: CGSize(width: SettingsCard.pageWidth, height: 1000), dark: dark, ground: SettingsInk.ground, wait: 1.2)
            try Self.save(rep, "locked-notes-hidden", "privacy-signed-out", dark: dark)
        }
    }

    /// The receipt as an AI's edit of the text leaves it (no Review on release/1.3).
    @Test func receipt() async throws {
        // After, PersonaAIAfterShots draws it with Review.
        guard Self.dir != nil, Self.side == "before" else { return }
        let r = AIEdit.Receipt(noteID: UUID(), by: "Claude", at: .now, previous: "a\nb\nc", after: "a\nB\nc\nd", lines: 5)
        for dark in [false, true] {
            let rep = try await Self.shoot(AIReceipt(receipt: r, seeAll: {}, undo: {}).padding(.top, 24), size: CGSize(width: 600, height: 90), dark: dark)
            try Self.save(rep, "review-ai-edit", "receipt", dark: dark)
        }
    }
}
#endif
