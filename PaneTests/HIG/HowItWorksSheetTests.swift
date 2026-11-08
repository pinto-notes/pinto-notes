#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The Mac's "How it works" sheet (Emil, 8 November 2026: the grouped list with a title bar and a
/// footer band "looks bad"): one ground from top to bottom, no title band or footer band, and
/// every fact's symbol in the same outline weight. Drawn far off screen, never ordered in.
/// Pictures: `TEST_RUNNER_PANE_HOW_SHOTS=/path scripts/qa-test.sh PaneTests/HowItWorksSheetTests`.
@MainActor @Suite(.serialized) struct HowItWorksSheetTests {
    private func draw(_ content: SecurityContent, dark: Bool) async throws -> (NSBitmapImageRep, NSHostingView<AnyView>) {
        let size = CGSize(width: HowItWorksMac.width, height: HowItWorksMac.height)
        let host = NSHostingView(rootView: AnyView(HowItWorksSheet(content: content).tint(Color(PColor.paneAccent))))
        let w = NSWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: size), styleMask: [.borderless], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        host.appearance = w.appearance
        host.frame = CGRect(origin: .zero, size: size)
        w.contentView = host
        defer { w.close() }
        try? await Task.sleep(for: .seconds(0.8))
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        host.cacheDisplay(in: host.bounds, to: rep)
        return (rep, host)
    }

    private func close(_ a: NSColor?, _ b: NSColor?) -> Bool {
        guard let a = a?.usingColorSpace(.deviceRGB), let b = b?.usingColorSpace(.deviceRGB) else { return false }
        return abs(a.redComponent - b.redComponent) + abs(a.greenComponent - b.greenComponent) + abs(a.blueComponent - b.blueComponent) < 0.03
    }

    @Test func oneGroundNoBandsOneSymbolWeight() async throws {
        // As Emil's account has it: Pinto Notes keeps a copy, an iPhone through iCloud Keychain.
        let crypto = await AddDeviceSnapshots.readyWithCopy()
        defer { crypto.signedOut() }
        let content = SecurityContent(crypto: crypto, devices: AddDeviceSnapshots.devices([SecurityPageSnapshots.mac, SecurityPageSnapshots.phone]),
                                      connections: SecurityPageSnapshots.ais)
        let dir = ProcessInfo.processInfo.environment["PANE_HOW_SHOTS"].map { URL(fileURLWithPath: $0) }
        for dark in [false, true] {
            let (rep, _) = try await draw(content, dark: dark)
            if let dir {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "how-it-works-\(dark ? "dark" : "light").png"))
            }
            // The title's corner, the middle's edge and the footer's corner are one ground: no bands.
            let s = CGFloat(rep.pixelsWide) / HowItWorksMac.width
            let top = rep.colorAt(x: Int(6 * s), y: Int(6 * s))
            let middle = rep.colorAt(x: Int(6 * s), y: rep.pixelsHigh / 2)
            let foot = rep.colorAt(x: Int(6 * s), y: rep.pixelsHigh - Int(6 * s))
            #expect(close(top, middle) && close(middle, foot), "the sheet has a band of another colour (\(dark ? "dark" : "light"))")
        }
        // One symbol weight: no filled symbol among the outline ones.
        for item in content.how { #expect(!item.symbol.hasSuffix(".fill"), "\(item.symbol)") }
    }
}
#endif
