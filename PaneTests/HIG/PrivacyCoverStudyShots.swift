#if os(macOS)
import AppKit
import QuartzCore
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The privacy mode study (PrivacyCoverStyle), 17 November 2026: the whole window at its default
/// size (1400 by 900) the moment a call starts, as it ships (the frosted cover) and as A (a banner,
/// privacy mode already on), B (the app frosted behind a card) and C (a skeleton behind the card),
/// light and dark, and a contact sheet of the eight. The real RootView over the demo library, in a
/// window that is never ordered in (far off screen), so nothing shows on the display. Runs only
/// when AMBER_HIG_SHOTS is set:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/PrivacyCoverStudyShots`.
@MainActor @Suite(.serialized) struct PrivacyCoverStudyShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let size = CGSize(width: 1400, height: 900)

    /// Says it's key and main without ever being made either: the toolbar draws active, not dimmed.
    final class KeyWindow: NSWindow {
        override var isKeyWindow: Bool { true }
        override var isMainWindow: Bool { true }
    }

    static let openNote = """
    Q4 offsite plan

    Two days at the lake house, 12 and 13 December. Twelve of us, leaving from the office at nine on Thursday.

    The point is to agree on three things for next year: what we stop doing, what we hire for, and which two projects get the whole team in spring.

    ## Before we go
    - [x] Book the house and the minibus
    - [ ] Send the agenda by Friday
    - [ ] Ask everyone for one page on what worked this year

    Food is on us. Sara is sorting a vegetarian menu, and there is a sauna if the weather holds.
    """

    /// The demo library (folders, notes with previews), and the open note.
    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let ctx = c.mainContext
        let work = try #require(ctx.allFolders().first { $0.name == "Work" })
        let n = ctx.createNote(in: .folder(work.id), body: Self.openNote)
        n.updatedAt = .now.addingTimeInterval(600)
        try ctx.save()
        return c
    }

    enum Variant: String, CaseIterable {
        case before, a, b, c
        var style: PrivacyCoverStyle {
            switch self {
            case .before: .current
            case .a: .banner
            case .b: .frosted
            case .c: .skeleton
            }
        }
        var label: String {
            switch self {
            case .before: "Before: the cover that ships"
            case .a: "A: banner, privacy mode on by itself"
            case .b: "B: frosted app with a card"
            case .c: "C: skeleton with a card"
            }
        }
    }

    @Test func window() async throws {
        guard let dir = Self.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try Self.library()
        defer { PrivacyCoverStyle.chosen = .current; PrivacyModeInteractionReset.reset() }
        var shots: [Variant: [Bool: NSBitmapImageRep]] = [:]
        try await AppSnapshotTests.withLastNote(c, "Q4 offsite plan") {
            for variant in Variant.allCases {
                for dark in [false, true] {
                    let rep = try await Self.shoot(variant, dark: dark, library: c)
                    let name = "privacy-\(variant.rawValue)-\(dark ? "dark" : "light")"
                    #expect(rep.pixelsWide == Int(Self.size.width * 2) && rep.pixelsHigh == Int(Self.size.height * 2), "\(name): \(rep.pixelsWide)x\(rep.pixelsHigh)")
                    try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "\(name).png"))
                    shots[variant, default: [:]][dark] = rep
                }
            }
        }
        let rows = Variant.allCases.map { v in [("\(v.label), light", shots[v]![false]!), ("\(v.label), dark", shots[v]![true]!)] }
        try ThemeShots.sheet("Privacy mode when a call starts: before, A, B and C", rows: rows, scale: 0.42)
            .write(to: dir.appending(path: "privacy-contact-sheet.png"))
    }

    static func shoot(_ variant: Variant, dark: Bool, library c: ModelContainer) async throws -> NSBitmapImageRep {
        PrivacyModeInteractionReset.reset()
        PrivacyCoverStyle.chosen = variant.style
        let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
            .privacyCover()
            .tint(Color(PColor.paneAccent))
        let w = KeyWindow(contentRect: CGRect(origin: CGPoint(x: -20000, y: -20000), size: Self.size),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        w.contentViewController = NSHostingController(rootView: root)
        w.setContentSize(Self.size)
        defer { w.close(); PrivacyMode.shared.callChanged(false) }
        await MacWindowChromeTests.settle(w, 20)
        // Offscreen the split view leaves the sidebar at 144 pt; the app opens it at 260.
        if let split = w.contentView.flatMap({ MacWindowChromeTests.find(NSSplitView.self, in: $0) }) {
            split.setPosition(260, ofDividerAt: 0)
        }
        await MacWindowChromeTests.settle(w, 10)
        try await Self.layInSidebar(w, library: c, dark: dark)
        w.makeFirstResponder(nil)
        // The call starts.
        PrivacyMode.shared.callChanged(true)
        await MacWindowChromeTests.settle(w, 15)
        let cols = PrivacyStudyColumns.shared
        print("PERF \(variant.rawValue) \(dark ? "dark" : "light") columns \(cols.sidebar) \(cols.list) \(cols.note) on \(PrivacyMode.shared.isOn) asking \(PrivacyMode.shared.asking) announcing \(PrivacyMode.shared.announcing)")
        return try Self.picture(w)
    }

    /// The sidebar's List draws no rows in a window that is never on screen, and its glass comes
    /// out white. The real SidebarView is drawn on its own (ThemeShots.host) on a flat stand-in for
    /// the glass, and laid into the split view's first column under everything else.
    static func layInSidebar(_ w: NSWindow, library c: ModelContainer, dark: Bool) async throws {
        let split = try #require(w.contentView.flatMap { MacWindowChromeTests.find(NSSplitView.self, in: $0) })
        let column = split.arrangedSubviews[0]
        let size = CGSize(width: column.frame.width, height: split.bounds.height)
        let panel = NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
            .environment(LibraryNotes())
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
            .environment(\.controlActiveState, .key)
            .padding(.top, 44)
            .frame(width: size.width - 16, height: size.height - 16, alignment: .top)
            .background(Color(Palette.sidebarWarmth))
            .background(DesignLookSnapshots.glass(dark))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .padding(8)
            .frame(width: size.width, height: size.height)
            .background(Color(Palette.listGround))
        let rep = try await ThemeShots.host(panel, size: size, dark: dark, wait: 1.5)
        if let dir { try rep.representation(using: .png, properties: [:])?.write(to: dir.appending(path: "debug-sidebar-\(dark ? "dark" : "light").png")) }
        let layer = CALayer()
        layer.contents = rep.cgImage
        layer.contentsGravity = .resize
        // Over the column's own (blank) drawing; the toolbar's buttons are in the title bar, above it.
        let inColumn = split.convert(CGRect(origin: .zero, size: size), to: column)
        layer.frame = inColumn
        column.wantsLayer = true
        column.layer?.addSublayer(layer)
        // The column's own glass draws plain white offscreen, over the picture: hidden, so B's
        // frost (taken when the call starts) and every shot show the sidebar.
        for glass in column.subviews where String(describing: type(of: glass)) == "NSGlassEffectView" { glass.isHidden = true }
        print("PERF sidebar column \(column.frame) layer \(inColumn) flipped \(column.isFlipped)")
    }

    /// The window as drawn, title bar and toolbar included, at 2x, with what render(in:) leaves
    /// out put back by hand: each blurred layer (privacy mode's previews and titles) is drawn,
    /// blurred by Core Image at its radius and laid back in its place, and the cover's material
    /// gets the blurred window behind it. Offscreen the sidebar's glass and the scroll views'
    /// soft edges come out white over everything, so they're hidden (MacEmptyDetailTests.picture).
    static func picture(_ w: NSWindow) throws -> NSBitmapImageRep {
        let frame = try #require(w.contentView?.superview)
        frame.wantsLayer = true
        let root = try #require(frame.layer)
        let whole = frame.bounds
        var hiddenViews: [NSView] = []
        var materials: [NSView] = []
        func walk(_ v: NSView) {
            let name = String(describing: type(of: v))
            if name == "NSHardPocketView" { return }
            if name == "BackdropView" {
                let r = v.convert(v.bounds, to: frame)
                // The cover's material spans the window: kept, and drawn below.
                if r.width > whole.width * 0.9 && r.height > whole.height * 0.8 { materials.append(v); return }
            }
            if !v.isHidden, ["BackdropView", "PortalView", "PocketMask", "LuminanceAdjustment", "_NSScrollViewContentBackgroundView"].contains(name) {
                v.isHidden = true
                hiddenViews.append(v)
            }
            v.subviews.forEach(walk)
        }
        walk(frame)
        let scale: CGFloat = 2
        var restore: [() -> Void] = []
        defer {
            restore.reversed().forEach { $0() }
            hiddenViews.forEach { $0.isHidden = false }
        }
        func shown(_ l: CALayer) -> Bool {
            var x: CALayer? = l
            while let c = x {
                if c.isHidden || c.opacity == 0 { return false }
                x = c.superlayer
            }
            return true
        }
        // Blurred layers, the last painted first.
        var blurred = 0
        var kinds: Set<String> = []
        for l in LayerSnapshot.paintOrder(root).reversed() where shown(l) {
            guard let filters = l.filters, !filters.isEmpty else { continue }
            for f in filters { kinds.insert(String(describing: f)) }
            let radius = filters.compactMap { f -> CGFloat? in
                let o = f as AnyObject
                // Only SwiftUI's blur and the material's; the soft edges' variable blur is left as it is.
                guard String(describing: o) == "gaussianBlur" else { return nil }
                return (o.value(forKey: "inputRadius") as? NSNumber).map { CGFloat(truncating: $0) }
            }.max() ?? 0
            guard radius > 0.5 else { continue }
            let r = l.convert(l.bounds, to: root)
            guard r.width > 1, r.height > 1, let behind = LayerSnapshot.behind(l, in: root, scale: scale, keep: true),
                  let soft = LayerSnapshot.blur(behind, radius: radius * scale),
                  let part = LayerSnapshot.crop(soft, to: r, in: root.bounds, scale: scale) else { continue }
            let (contents, gravity, kept) = (l.contents, l.contentsGravity, l.filters)
            let subs = l.sublayers ?? []
            let subsHidden = subs.map(\.isHidden)
            l.contents = part
            l.contentsGravity = .resize
            subs.forEach { $0.isHidden = true }
            l.filters = nil
            restore.append {
                l.contents = contents
                l.contentsGravity = gravity
                l.filters = kept
                zip(subs, subsHidden).forEach { $0.isHidden = $1 }
            }
            blurred += 1
        }
        // The cover's material: the window behind it, blurred as a thick material does.
        var drawnMaterials = 0
        for m in materials {
            guard let l = m.layer, let behind = LayerSnapshot.behind(l, in: root, scale: scale),
                  let soft = LayerSnapshot.blur(behind, radius: 30 * scale),
                  let part = LayerSnapshot.crop(soft, to: l.convert(l.bounds, to: root), in: root.bounds, scale: scale) else { continue }
            let (contents, gravity, filters) = (l.contents, l.contentsGravity, l.filters)
            l.contents = part
            l.contentsGravity = .resize
            l.filters = nil
            restore.append {
                l.contents = contents
                l.contentsGravity = gravity
                l.filters = filters
            }
            drawnMaterials += 1
        }
        print("PERF picture: \(blurred) blurred layers, \(drawnMaterials) of \(materials.count) materials, filters \(kinds.prefix(6))")
        let image = try #require(LayerSnapshot.draw(root, scale: scale))
        let rep = NSBitmapImageRep(cgImage: image)
        rep.size = whole.size
        return rep
    }
}
#endif
