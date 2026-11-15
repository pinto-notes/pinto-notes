#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Three looks a Pinto look note can give the window (LookNote), drawn offscreen like ThemeShots:
/// colours over the theme, faces for text and headings, and a picture behind the page.
/// `TEST_RUNNER_PANE_LOOK_SHOTS=/path scripts/qa-test.sh PaneTests/LookShots`
@MainActor @Suite(.serialized) struct LookShots {
    struct Sample {
        let name: String
        let note: String
        let dark: Bool
        let picture: PImage?
    }

    /// A sunset over dunes, drawn here so nothing is read from the app's files.
    static func dunes(_ size: CGSize = CGSize(width: 1200, height: 900)) -> NSImage {
        NSImage(size: size, flipped: false) { r in
            NSGradient(colors: [NSColor(srgbRed: 0.98, green: 0.55, blue: 0.36, alpha: 1), NSColor(srgbRed: 0.55, green: 0.24, blue: 0.52, alpha: 1), NSColor(srgbRed: 0.12, green: 0.08, blue: 0.24, alpha: 1)])!
                .draw(in: r, angle: -90)
            NSColor(srgbRed: 1, green: 0.85, blue: 0.55, alpha: 0.9).setFill()
            NSBezierPath(ovalIn: CGRect(x: r.width * 0.62, y: r.height * 0.42, width: 220, height: 220)).fill()
            for (i, c) in [(0.30, 0.16), (0.22, 0.11), (0.13, 0.07)].enumerated() {
                let path = NSBezierPath()
                path.move(to: CGPoint(x: 0, y: 0))
                path.line(to: CGPoint(x: 0, y: r.height * c.0))
                path.curve(to: CGPoint(x: r.width, y: r.height * (c.0 + 0.04 * Double(i % 2 == 0 ? 1 : -1))),
                           controlPoint1: CGPoint(x: r.width * 0.3, y: r.height * (c.0 + 0.12)),
                           controlPoint2: CGPoint(x: r.width * 0.6, y: r.height * (c.0 - 0.08)))
                path.line(to: CGPoint(x: r.width, y: 0))
                path.close()
                NSColor(srgbRed: 0.2 + c.1, green: 0.08 + c.1 / 2, blue: 0.2, alpha: 1).setFill()
                path.fill()
            }
            return true
        }
    }

    /// Risograph-like dots in two inks on paper.
    static func riso(_ size: CGSize = CGSize(width: 1200, height: 900)) -> NSImage {
        NSImage(size: size, flipped: false) { r in
            NSColor(srgbRed: 0.98, green: 0.95, blue: 0.89, alpha: 1).setFill()
            r.fill()
            var rng = SystemRandomNumberGenerator()
            for _ in 0..<160 {
                let d = CGFloat.random(in: 18...90, using: &rng)
                (Bool.random(using: &rng) ? NSColor(srgbRed: 1, green: 0.28, blue: 0.53, alpha: 0.5) : NSColor(srgbRed: 0.1, green: 0.45, blue: 0.85, alpha: 0.45)).setFill()
                NSBezierPath(ovalIn: CGRect(x: .random(in: 0...r.width, using: &rng), y: .random(in: 0...r.height, using: &rng), width: d, height: d)).fill()
            }
            return true
        }
    }

    static let samples: [Sample] = [
        Sample(name: "Dusk: New York, a sunset picture", note: """
        Pinto look

        page: #FFF6EE / #1B1026
        sidebar: #F6E6DA / #140B1D
        list: #FBEFE6 / #180E22
        selected: #F1D3C4 / #3A2346
        text: #2A1830 / #F6E7F0
        secondary text: #6E5266 / #C7A9BE
        accent: #B23A6B / #FF9DBF
        font: New York
        heading font: New York
        text size: 15
        background: Dunes.jpg
        background fade: 72
        background blur: 6
        """, dark: true, picture: dunes()),
        Sample(name: "Terminal: green on black, mono", note: """
        Pinto look

        page: #000000
        sidebar: #050A05
        list: #020602
        selected: #0F2A12
        text: #39FF6A
        secondary text: #1FAE45
        lines: #0E3A16
        fills: #0A1F0D
        code: #061206
        accent: #7CFF9B
        font: mono
        heading font: mono
        """, dark: true, picture: nil),
        Sample(name: "Riso: paper, pink and blue ink, Avenir Next", note: """
        Pinto look

        page: #FBF3E4
        sidebar: #F2E4CC
        list: #F7ECD8
        selected: #FFD3E2
        text: #1F2A6B
        secondary text: #4B5794
        accent: #E8306E
        font: Avenir Next
        heading font: Avenir Next Heavy
        text size: 15
        background: Riso.png
        background fade: 82
        """, dark: false, picture: riso()),
    ]

    /// ThemeShots.shot without the page colour under the text: the look's picture shows through.
    static func shot(_ w: NSWindow) throws -> NSBitmapImageRep {
        let root = try #require(w.contentView)
        root.layoutSubtreeIfNeeded()
        let rep = try #require(root.bitmapImageRepForCachingDisplay(in: root.bounds))
        root.cacheDisplay(in: root.bounds, to: rep)
        guard let tv = MacWindowChromeTests.find(PaneTextView.self, in: root), let tlm = tv.textLayoutManager else { return rep }
        tlm.ensureLayout(for: tlm.documentRange)
        let ctx = try #require(NSGraphicsContext(bitmapImageRep: rep))
        let saved = NSGraphicsContext.current
        defer { NSGraphicsContext.current = saved }
        let visible = tv.visibleRect
        let inRoot = tv.convert(visible, to: root)
        let bottom = root.isFlipped ? root.bounds.height - inRoot.maxY : inRoot.minY
        let cg = ctx.cgContext
        cg.saveGState()
        cg.clip(to: CGRect(x: inRoot.minX, y: bottom, width: inRoot.width, height: inRoot.height))
        cg.translateBy(x: inRoot.minX, y: bottom + inRoot.height)
        cg.scaleBy(x: 1, y: -1)
        cg.translateBy(x: -visible.minX, y: -visible.minY)
        NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
        w.effectiveAppearance.performAsCurrentDrawingAppearance {
            let origin = tv.textContainerOrigin
            tlm.enumerateTextLayoutFragments(from: tlm.documentRange.location, options: [.ensuresLayout]) { f in
                let o = CGPoint(x: origin.x + f.layoutFragmentFrame.minX, y: origin.y + f.layoutFragmentFrame.minY)
                if o.y > visible.maxY { return false }
                f.draw(at: o, in: cg)
                return true
            }
        }
        cg.restoreGState()
        return rep
    }

    @Test func contactSheet() async throws {
        guard let dir = ProcessInfo.processInfo.environment["PANE_LOOK_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let kept = ThemeStore.shared.current
        defer {
            ThemeStore.shared.set(kept, persist: false)
            LookFaces.set(body: nil, heading: nil)
            TextSize.lookOverride = nil
            LookStore.shared.show(background: nil, fade: 0.8, blur: 0)
        }
        let c = try AppSnapshotTests.container()
        let travel = try c.mainContext.fetch(FetchDescriptor<Folder>()).first { $0.name == "Travel" } ?? c.mainContext.createFolder(named: "Travel")
        let n = c.mainContext.createNote(in: .folder(travel.id), body: ThemeShots.note)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        var rows: [[(String, NSBitmapImageRep)]] = []
        try await AppSnapshotTests.withLastNote(c, "Lisbon trip") {
            for sample in Self.samples {
                // The window is open first, as when an AI edits the note: the look arrives live.
                ThemeStore.shared.set(kept, persist: false)
                let w = ThemeShots.window(c, dark: sample.dark)
                defer { w.close() }
                await MacWindowChromeTests.settle(w, 20)
                let spec = LookSpec.parse(sample.note)
                #expect(spec.unread.isEmpty, "\(sample.name): \(spec.unread)")
                var look = kept
                look.custom = LookColors(values: spec.colors)
                ThemeStore.shared.set(look, persist: false)
                if LookFaces.set(body: spec.font.flatMap(LookFace.named), heading: spec.headingFont.flatMap(LookFace.named)) {
                    NotificationCenter.default.post(name: NoteFont.didChange, object: nil)
                }
                TextSize.lookOverride = spec.textSize
                NotificationCenter.default.post(name: TextSize.didChange, object: nil)
                LookStore.shared.show(background: spec.background == nil ? nil : sample.picture, fade: spec.fade ?? 0.8, blur: spec.blur ?? 0)
                await MacWindowChromeTests.settle(w, 20)
                w.makeFirstResponder(nil)
                await MacWindowChromeTests.settle(w, 6)
                let page = try ThemeShots.page(w, Self.shot(w))
                let sidebar = try await ThemeShots.host(NavigationStack { SidebarView(scope: .constant(.folder(travel.id)), onNewNote: {}) }
                    .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 220, height: page.size.height), dark: sample.dark)
                let list = try await ThemeShots.host(NavigationStack { NoteListView(scope: .folder(travel.id), selection: .constant([n.id]), onNewNote: {}) }
                    .modelContainer(c).tint(Color(PColor.paneAccent)).environment(\.controlActiveState, .key),
                    size: CGSize(width: 280, height: page.size.height), dark: sample.dark, wait: 2.5, layers: true)
                let whole = try ThemeShots.stitch([sidebar, list, page])
                rows.append([(sample.name, whole)])
                try #require(whole.representation(using: .png, properties: [:])).write(to: dir.appending(path: "look-\(rows.count).png"))
            }
        }
        try ThemeShots.sheet("Pinto look: three notes", rows: rows, scale: 0.7).write(to: dir.appending(path: "looks.png"))
    }
}
#endif
