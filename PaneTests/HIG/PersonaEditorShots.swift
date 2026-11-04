#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Before and after pictures for the persona council's editor round (4 November 2026): Untick
/// All, the links foot, text size, the empty note pane and Notion on the import list. The same
/// file draws the before on release/1.3 (with the after-only parts compiled out) and the after on
/// the branch. Real notes windows, titled and never shown; nothing touches the screen.
/// Runs only when PERSONA_SHOTS is set; PERSONA_SIDE names the side:
/// `TEST_RUNNER_PERSONA_SHOTS=/tmp/shots TEST_RUNNER_PERSONA_SIDE=after scripts/qa-test.sh PaneTests/PersonaEditorShots`
@MainActor @Suite(.serialized) struct PersonaEditorShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["PERSONA_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var side: String { ProcessInfo.processInfo.environment["PERSONA_SIDE"] ?? "after" }
    static let size = CGSize(width: 1180, height: 760)
    static let modes: [(dark: Bool, name: String)] = [(false, "light"), (true, "dark")]

    static func url(_ slug: String, _ name: String) throws -> URL {
        let folder = try #require(dir).appending(path: slug, directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appending(path: "\(side)-\(name).png")
    }

    static func save(_ rep: NSBitmapImageRep, _ slug: String, _ name: String) throws {
        try #require(rep.representation(using: .png, properties: [:])).write(to: url(slug, name))
    }

    /// The demo library, with Weekend plans and Packing list linking Lisbon (as `-demoLinks`
    /// makes them) and a short Sintra note that Weekend plans links and Lisbon mentions.
    static func library() throws -> ModelContainer {
        let c = try AppSnapshotTests.container()
        let context = c.mainContext
        let travel = try #require(context.allFolders().first { $0.name == "Travel" })
        let weekend = context.createNote(in: .folder(travel.id), body: "Weekend plans\n\n- [ ] Flights for [[Lisbon]] on Thursday\n- [ ] Ask Sara about [[Lisbon#Food|where to eat]]\n- [ ] Train to [[Sintra]] on Saturday")
        weekend.updatedAt = .now.addingTimeInterval(-2 * 3600)
        let packing = context.createNote(in: .folder(travel.id), body: "Packing list\n\nRain jacket and good shoes for **[[Lisbon]]**, the hills are real.")
        packing.updatedAt = .now.addingTimeInterval(-26 * 3600)
        let sintra = context.createNote(in: .folder(travel.id), body: "Sintra\n\nA day by train from Rossio. Pena Palace first, then the Moorish castle.")
        sintra.updatedAt = .now.addingTimeInterval(-30 * 3600)
        try context.save()
        WikiDirectory.invalidate()
        return c
    }

    /// The notes window over `c` with `note` open, drawn at 2x after `prepare`.
    static func window(_ c: ModelContainer, note: String, dark: Bool, _ body: (NSWindow) async throws -> Void) async throws {
        try await AppSnapshotTests.withLastNote(c, note) {
            let w = MacWindowChromeTests.window(c, size: size)
            w.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            defer { w.close() }
            await MacWindowChromeTests.settle(w, 16)
            // The list from its top (opened from below, it slides under the list's header off screen).
            try MacEmptyDetailTests.list(w).scrollRowToVisible(0)
            await MacWindowChromeTests.settle(w, 3)
            try await body(w)
        }
    }

    /// The notes list and the note, title bar included, at 2x. The sidebar's glass and the
    /// toolbar's glass buttons can't be drawn off screen (they come out white): the buttons'
    /// platters are hidden and the picture starts at the list.
    static func picture(_ w: NSWindow) throws -> NSBitmapImageRep {
        let frame = try #require(w.contentView?.superview)
        var hidden: [NSView] = []
        func hide(_ v: NSView) {
            if !v.isHidden, ["NSToolbarPlatterView", "NSGlassContainerView"].contains(String(describing: type(of: v))) { v.isHidden = true; hidden.append(v); return }
            v.subviews.forEach(hide)
        }
        hide(frame)
        defer { hidden.forEach { $0.isHidden = false } }
        let full = try MacEmptyDetailTests.picture(w)
        let table = try MacEmptyDetailTests.list(w)
        let left = table.convert(table.bounds, to: nil).minX
        let scale = CGFloat(full.pixelsWide) / frame.bounds.width
        let image = try #require(full.cgImage?.cropping(to: CGRect(x: (left * scale).rounded(), y: 0, width: CGFloat(full.pixelsWide) - (left * scale).rounded(), height: CGFloat(full.pixelsHigh))))
        return NSBitmapImageRep(cgImage: image)
    }

    static func editor(_ w: NSWindow) throws -> PaneTextView {
        try #require(w.contentView.flatMap { MacWindowChromeTests.find(PaneTextView.self, in: $0) })
    }

    /// Scrolls the note to its foot.
    static func scrollToEnd(_ w: NSWindow) async throws {
        let sv = try #require(try editor(w).enclosingScrollView)
        for _ in 0..<3 {
            let doc = try #require(sv.documentView)
            sv.contentView.scroll(to: NSPoint(x: 0, y: max(0, doc.frame.height - sv.contentView.bounds.height)))
            sv.reflectScrolledClipView(sv.contentView)
            await MacWindowChromeTests.settle(w, 4)
        }
    }

    /// Keeps the defaults a shot changes and puts them back.
    static func keeping(_ keys: [String], _ body: () async throws -> Void) async throws {
        let d = UserDefaults.standard
        let kept = keys.map { d.object(forKey: $0) }
        defer { for (k, v) in zip(keys, kept) { if let v { d.set(v, forKey: k) } else { d.removeObject(forKey: k) } } }
        try await body()
    }

    static let linkKeys = ["noteLinks.linkedShown", "noteLinks.mentionsShown", "noteLinks.footShown"]

    // MARK: - 1. Untick All (Maya)

    /// Groceries with three ticked items; after: Untick All from there, the notice with Undo.
    @Test func untickAll() async throws {
        guard Self.dir != nil else { return }
        let c = try Self.library()
        for m in Self.modes {
            try await Self.window(c, note: "Groceries", dark: m.dark) { w in
                let tv = try Self.editor(w)
                let at = NSMaxRange((tv.string as NSString).range(of: "Sourdough"))
                tv.setSelectedRange(NSRange(location: at, length: 0))
                await MacWindowChromeTests.settle(w, 3)
                #if !PERSONA_BEFORE
                let controller = try #require(tv.controller)
                controller.untickAll()
                await MacWindowChromeTests.settle(w, 6)
                #expect(!tv.string.contains("- [x]"))
                #endif
                try Self.save(try Self.picture(w), "untick-all", "groceries-\(m.name)")
            }
        }
    }

    // MARK: - 2. The links foot (Elena, Jonas)

    /// A short note (Sintra) and the end of a long one (Lisbon), as each opens; after: folded,
    /// then unfolded.
    @Test func linksFoot() async throws {
        guard Self.dir != nil else { return }
        let c = try Self.library()
        try await Self.keeping(Self.linkKeys) {
            var states: [(name: String, shown: Bool?)] = [("", nil)]
            #if !PERSONA_BEFORE
            states = [("-folded", false), ("-unfolded", true)]
            #endif
            for state in states {
                Self.linkKeys.forEach { UserDefaults.standard.removeObject(forKey: $0) }
                #if !PERSONA_BEFORE
                if let shown = state.shown { UserDefaults.standard.set(shown, forKey: NoteLinksSection.shownKey) }
                #endif
                for m in Self.modes {
                    try await Self.window(c, note: "Sintra", dark: m.dark) { w in
                        await MacWindowChromeTests.settle(w, 10)
                        try Self.save(try Self.picture(w), "links-foot", "short-note\(state.name)-\(m.name)")
                    }
                    try await Self.window(c, note: "Lisbon", dark: m.dark) { w in
                        await MacWindowChromeTests.settle(w, 10)
                        try await Self.scrollToEnd(w)
                        try Self.save(try Self.picture(w), "links-foot", "long-note-end\(state.name)-\(m.name)")
                    }
                }
            }
        }
    }

    // MARK: - 3. Text size (Ingrid)

    /// Lisbon (headings, a checklist, a table) at today's 13 pt; after: at each larger stop. And
    /// Settings › Appearance.
    @Test func textSize() async throws {
        guard Self.dir != nil else { return }
        let c = try Self.library()
        try await Self.keeping(["PintoTextSize"]) {
            UserDefaults.standard.removeObject(forKey: "PintoTextSize")
            try await Self.window(c, note: "Lisbon", dark: false) { w in
                try Self.save(try Self.picture(w), "text-size", "lisbon-13pt-light")
                #if !PERSONA_BEFORE
                for size in [15.0, 17, 20, 24] {
                    TextSize.set(size)
                    await MacWindowChromeTests.settle(w, 8)
                    try Self.save(try Self.picture(w), "text-size", "lisbon-\(Int(size))pt-light")
                }
                TextSize.actualSize()
                #endif
            }
            #if !PERSONA_BEFORE
            try await Self.window(c, note: "Lisbon", dark: true) { w in
                TextSize.set(17)
                await MacWindowChromeTests.settle(w, 8)
                try Self.save(try Self.picture(w), "text-size", "lisbon-17pt-dark")
                TextSize.actualSize()
            }
            #endif
            for m in Self.modes {
                let page = AppearanceSettingsPage().frame(width: 640, height: 860).background(Color(nsColor: .windowBackgroundColor))
                try await VersionHistorySnapshots.shoot(page, to: try Self.url("text-size", "settings-appearance-\(m.name)"),
                                                        size: CGSize(width: 640, height: 860), dark: m.dark)
            }
        }
    }

    // MARK: - 4. The empty note pane

    @Test func emptyNotePane() async throws {
        guard Self.dir != nil else { return }
        let c = try Self.library()
        for m in Self.modes {
            try await Self.window(c, note: "Groceries", dark: m.dark) { w in
                try await MacEmptyDetailTests.deselect(w)
                await MacWindowChromeTests.settle(w, 6)
                try Self.save(try Self.picture(w), "empty-detail", "no-note-selected-\(m.name)")
            }
        }
    }

    // MARK: - 5. Notion on the import list (Notion switchers)

    /// File › Import's list, the first-run card's import tiles, and (after) Notion's two pages.
    @Test func notionImport() async throws {
        guard Self.dir != nil else { return }
        let empty = try SetupCardsSnapshots.empty()
        // The order as on a Mac without any of these apps (installed ones go first).
        let installed = ImportKind.isInstalled
        ImportKind.isInstalled = { _ in false }
        defer { ImportKind.isInstalled = installed }
        for m in Self.modes {
            let list = ImportSourceList { _ in }.tint(Color(PColor.paneAccent)).background(Color(nsColor: .windowBackgroundColor))
            try await VersionHistorySnapshots.shoot(list, to: try Self.url("notion-import", "import-list-\(m.name)"), size: CGSize(width: 260, height: 320), dark: m.dark)

            let flow = SetupCardsFlow(store: OnboardingStore(defaults: TestDefaults()), backend: Backend(), preview: .init(card: .bring), finish: { _ in })
            // The card on the page alone: the notes window behind it has glass that can't be drawn off screen.
            let view = ZStack {
                Color(nsColor: .windowBackgroundColor)
                flow
            }
            .modelContainer(empty)
            try await VersionHistorySnapshots.shoot(view, to: try Self.url("notion-import", "first-run-card-\(m.name)"), size: CGSize(width: 620, height: 640), dark: m.dark)

            #if !PERSONA_BEFORE
            let guide = try #require(ImportGuide.live(.notion))
            for (name, page) in [("1-export", ImportGuidePage.step(0)), ("2-drop", .drop(.empty)), ("3-found", .drop(.found)), ("4-done", .success)] {
                try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: page, height: 560),
                                                        to: try Self.url("notion-import", "guide-\(name)-\(m.name)"), size: CGSize(width: 540, height: 560), dark: m.dark)
            }
            #endif
        }
    }
}
#endif
