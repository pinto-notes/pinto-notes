#if os(macOS)
import AppKit
import SwiftUI
import Testing
@testable import Pane

/// The first-run flow moving between steps, filmed offscreen with the transition slowed down.
/// Emil's recording (1.2.23): Back from Connect your AI, then on again; the two steps showed at
/// once, and the Codex row stood still while the rest of its step slid in. Two causes: the steps
/// cross-faded over the same time, and the AI list found Claude and Codex only after it appeared,
/// so those rows were laid out again in the middle of the slide. Set ONBOARDING_FILM=<dir> to keep
/// the frames.
@MainActor @Suite(.serialized) struct OnboardingTransitionTests {
    static let size = CGSize(width: 900, height: 640)
    static let pace = 12.0

    /// One frame of the window, its right half (the step), as luminance at 1x.
    struct Frame {
        let width: Int, height: Int
        let lum: [Float]
        func at(_ x: Int, _ y: Int) -> Float { lum[y * width + x] }
    }

    @MainActor final class Stage {
        let window: NSWindow
        let host: NSHostingView<AnyView>
        let store = OnboardingStore(defaults: TestDefaults())
        var shots: [(ms: Int, frame: Frame)] = []
        let dir: URL?

        init(_ name: String) {
            dir = ProcessInfo.processInfo.environment["ONBOARDING_FILM"].map { URL(fileURLWithPath: $0).appending(path: name) }
            store.showForPreview(.bring)
            let flow = OnboardingFlow(store: store, backend: Backend(), preview: OnboardingFlow.Preview(brought: 35), finish: { _ in })
                .tint(Color(PColor.paneAccent))
                .environment(\.locale, Locale(identifier: "en_US"))
            window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: OnboardingTransitionTests.size.width, height: OnboardingTransitionTests.size.height),
                              styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: .darkAqua)
            host = NSHostingView(rootView: AnyView(flow))
            host.appearance = window.appearance
            host.frame = CGRect(origin: .zero, size: OnboardingTransitionTests.size)
            window.contentView = host
        }

        func grab(_ name: String) throws -> Frame {
            host.layoutSubtreeIfNeeded()
            let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: rep)
            if let dir {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "\(name).png"))
            }
            let cg = try #require(rep.cgImage)
            let w = Int(OnboardingTransitionTests.size.width) / 2, h = Int(OnboardingTransitionTests.size.height)
            var px = [UInt8](repeating: 0, count: w * h * 4)
            let ctx = try #require(CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                                             space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
            // The right half: the step's words and rows.
            ctx.draw(cg, in: CGRect(x: -w, y: 0, width: w * 2, height: h))
            var lum = [Float](repeating: 0, count: w * h)
            for i in 0..<(w * h) {
                lum[i] = (0.2126 * Float(px[i * 4]) + 0.7152 * Float(px[i * 4 + 1]) + 0.0722 * Float(px[i * 4 + 2])) / 255
            }
            return Frame(width: w, height: h, lum: lum)
        }

        /// Settled on `from`, then frames until well after the move to `to` has ended.
        func film(_ change: () -> Void) async throws -> (from: Frame, to: Frame) {
            try? await Task.sleep(for: .seconds(1))
            let from = try grab("0-from")
            OnboardingFlow.stepPace = OnboardingTransitionTests.pace
            defer { OnboardingFlow.stepPace = 1 }
            let start = Date.now
            change()
            let total = 0.4 * OnboardingTransitionTests.pace
            while Date.now.timeIntervalSince(start) < total {
                try? await Task.sleep(for: .milliseconds(40))
                let ms = Int(Date.now.timeIntervalSince(start) * 1000)
                shots.append((ms, try grab(String(format: "f-%05d", ms))))
            }
            try? await Task.sleep(for: .seconds(0.6))
            return (from, try grab("9-to"))
        }

        func close() { window.orderOut(nil); window.close() }
    }

    /// The panel's own colour, from a corner nothing is drawn in.
    static func background(_ f: Frame) -> Float { f.at(f.width - 4, f.height / 2) }

    /// Where `rest` is lit and `other` is not. By default the step: between the progress on top
    /// (it stays put) and the buttons at the foot.
    static func mask(_ rest: Frame, without other: Frame, bg: Float, rows: Range<Int>? = nil) -> [(Int, Int)] {
        var out: [(Int, Int)] = []
        for y in stride(from: rows?.lowerBound ?? 70, to: rows?.upperBound ?? rest.height - 110, by: 2) {
            for x in stride(from: 0, to: rest.width, by: 2) where rest.at(x, y) - bg > 0.35 && abs(other.at(x, y) - bg) < 0.05 {
                out.append((x, y))
            }
        }
        return out
    }

    /// How much of a step shows in `f` (0 gone, 1 fully there), with the step moved by `dx`.
    /// Leaves out the places where `other` (the step at rest) is lit.
    static func shown(_ f: Frame, step: Frame, mask: [(Int, Int)], bg: Float, dx: Int = 0, other: Frame? = nil) -> Float {
        var sum: Float = 0, n: Float = 0
        for (x, y) in mask {
            let fx = x + dx
            guard fx >= 0, fx < f.width else { continue }
            if let other, other.at(fx, y) - bg > 0.05 { continue }
            let full = step.at(x, y) - bg
            sum += min(max((f.at(fx, y) - bg) / full, 0), 1)
            n += 1
        }
        return n > 0 ? sum / n : 0
    }

    /// The buttons share a place, so their share of `f` is solved for: f = bg + a(from - bg) +
    /// b(to - bg), least squares over the pixels where the two differ.
    static func unmix(_ f: Frame, _ from: Frame, _ to: Frame, bg: Float, rows: Range<Int>) -> (Float, Float) {
        var aa: Float = 0, bb: Float = 0, ab: Float = 0, af: Float = 0, bf: Float = 0
        for y in rows {
            for x in 0..<f.width {
                let a = from.at(x, y) - bg, b = to.at(x, y) - bg
                guard max(a, b) > 0.1, abs(a - b) > 0.1 else { continue }
                let v = f.at(x, y) - bg
                aa += a * a; bb += b * b; ab += a * b; af += a * v; bf += b * v
            }
        }
        let det = aa * bb - ab * ab
        guard det > 0 else { return (0, 0) }
        return ((af * bb - bf * ab) / det, (bf * aa - af * ab) / det)
    }

    /// The incoming step: how much shows, and by how far it is moved, over the slide's range.
    static func incoming(_ f: Frame, step: Frame, mask: [(Int, Int)], bg: Float, other: Frame) -> (shown: Float, dx: Int) {
        (-30...30).map { dx in (shown(f, step: step, mask: mask, bg: bg, dx: dx, other: other), dx) }.max { $0.0 < $1.0 }!
    }

    static func check(_ stage: Stage, from: Frame, to: Frame) {
        let bg = background(to)
        let outMask = mask(from, without: to, bg: bg), inMask = mask(to, without: from, bg: bg)
        let foot = (to.height - 110)..<(to.height - 10)
        #expect(outMask.count > 200 && inMask.count > 200, "both steps have words to follow")
        var overlapped: [String] = []
        var torn: [String] = []
        for (ms, f) in stage.shots {
            let a = shown(f, step: from, mask: outMask, bg: bg)
            let b = incoming(f, step: to, mask: inMask, bg: bg, other: from)
            print("FILM \(ms)ms out \(String(format: "%.2f", a)) in \(String(format: "%.2f", b.shown)) dx \(b.dx)")
            // Never two readable layouts at once.
            if min(a, b.shown) > 0.3 { overlapped.append("\(ms)ms out \(a) in \(b.shown)") }
            // Nor two buttons (Continue and Skip for now) on top of each other.
            let (fa, fb) = unmix(f, from, to, bg: bg, rows: foot)
            print("FILM \(ms)ms buttons out \(String(format: "%.2f", fa)) in \(String(format: "%.2f", fb))")
            if min(fa, fb) > 0.3 { overlapped.append("\(ms)ms buttons out \(fa) in \(fb)") }
            // The incoming step moves as one: every band of it lit by the same shift.
            guard b.shown > 0.15, abs(b.dx) >= 6 else { continue }
            for band in stride(from: 0, to: to.height, by: 24) {
                let rows = inMask.filter { $0.1 >= band && $0.1 < band + 24 }
                guard rows.count > 15 else { continue }
                let own = incoming(f, step: to, mask: rows, bg: bg, other: from)
                if abs(own.dx - b.dx) > 3 { torn.append("\(ms)ms band y\(band): dx \(own.dx), step dx \(b.dx)") }
            }
        }
        #expect(overlapped.isEmpty, "the outgoing and incoming steps were readable together: \(overlapped)")
        #expect(torn.isEmpty, "part of the incoming step stood still: \(torn)")
        #expect(stage.shots.count >= 8, "enough frames filmed (\(stage.shots.count))")
    }

    @Test func onToConnectMovesAsOne() async throws {
        ConnectFinder.fixed = [.claude, .codex]
        defer { ConnectFinder.fixed = nil }
        let stage = Stage("forward")
        defer { stage.close() }
        let (from, to) = try await stage.film { _ = stage.store.advance(connected: false) }
        #expect(stage.store.step == .connect)
        Self.check(stage, from: from, to: to)
    }

    @Test func backToBringMovesAsOne() async throws {
        ConnectFinder.fixed = [.claude, .codex]
        defer { ConnectFinder.fixed = nil }
        let stage = Stage("back")
        stage.store.showForPreview(.connect)
        defer { stage.close() }
        let (from, to) = try await stage.film { stage.store.back() }
        #expect(stage.store.step == .bring)
        Self.check(stage, from: from, to: to)
    }

    /// The list of AIs is laid out from its first frame as it settles: nothing found after it
    /// appears moves its rows.
    @Test func connectListIsRightFromItsFirstFrame() throws {
        ConnectFinder.fixed = [.claude, .codex]
        defer { ConnectFinder.fixed = nil }
        _ = ConnectFinder.found()
        func render(_ v: some View) throws -> Data {
            let r = ImageRenderer(content: v.frame(width: 420).environment(\.colorScheme, .dark))
            r.scale = 1
            return try #require(r.nsImage?.tiffRepresentation)
        }
        let first = try render(ConnectChoices(client: CaptureScreen.client, guides: OnboardingFlow.guides, listsConnected: false, preview: []))
        let settled = try render(ConnectChoices(client: CaptureScreen.client, guides: OnboardingFlow.guides, listsConnected: false, preview: [], previewFound: [.claude, .codex]))
        #expect(first == settled)
    }
}
#endif
