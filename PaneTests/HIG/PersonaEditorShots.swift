#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Before and after pictures for the persona council's editor round (4 November 2026): Untick
/// All, text size, the empty note pane and Notion on the import list. (The links foot it also
/// drew went on 12 November 2026: what links here is in the note's ••• menu now.) The same
/// file draws the before on release/1.3 (with the after-only parts compiled out) and the after on
/// the branch. Real notes windows, titled and never shown; nothing touches the screen.
/// Runs only when PERSONA_SHOTS is set; PERSONA_SIDE names the side:
/// `TEST_RUNNER_PERSONA_SHOTS=/tmp/shots TEST_RUNNER_PERSONA_SIDE=after scripts/qa-test.sh PaneTests/PersonaEditorShots`
extension PersonaEditorShots {
    static var dir: URL? { ProcessInfo.processInfo.environment["PERSONA_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static var side: String { ProcessInfo.processInfo.environment["PERSONA_SIDE"] ?? "after" }
    static let modes: [(dark: Bool, name: String)] = [(false, "light"), (true, "dark")]

    static func url(_ slug: String, _ name: String) throws -> URL {
        let folder = try #require(dir).appending(path: slug, directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appending(path: "\(side)-\(name).png")
    }

    static func save(_ rep: NSBitmapImageRep, _ slug: String, _ name: String) throws {
        try #require(rep.representation(using: .png, properties: [:])).write(to: url(slug, name))
    }

    /// Keeps the defaults a shot changes and puts them back.
    static func keeping(_ keys: [String], _ body: () async throws -> Void) async throws {
        let d = UserDefaults.standard
        let kept = keys.map { d.object(forKey: $0) }
        defer { for (k, v) in zip(keys, kept) { if let v { d.set(v, forKey: k) } else { d.removeObject(forKey: k) } } }
        try await body()
    }

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
