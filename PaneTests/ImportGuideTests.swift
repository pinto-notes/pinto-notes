import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// The guided imports: which sources open a guide, and what the last page says.
@MainActor struct ImportGuideTests {
    @Test func everySourceOpensItsGuide() {
        #if os(macOS)
        for kind in ImportKind.allCases { #expect(ImportGuide.live(kind)?.id == kind.rawValue, "\(kind)") }
        #else
        for kind in [ImportKind.keep, .obsidian, .notion, .markdown] { #expect(ImportGuide.live(kind)?.id == kind.rawValue, "\(kind)") }
        #endif
    }

    /// Persona council 11-04: Notion has its own row and the same two pages as Obsidian, an export
    /// step and the drop, and says what its databases become.
    @Test func notionHasItsOwnGuide() {
        let g = ImportGuide.notion
        #expect(g.name == "Notion" && g.origin == .files(.notion))
        #expect(g.steps.count == 1, "one step, then the drop, as Obsidian")
        #expect(g.steps[0].text.contains("Export all workspace content") && g.steps[0].text.contains("Markdown & CSV") && g.steps[0].text.contains("include subpages"))
        #expect(g.drop.choose == "Choose the .zip\u{2026}")
        #expect(g.success.line.contains("Each database is a note with a table"))
        #expect(ImportKind.notion.isMarkdown && ImportKind.notion.contentTypes.contains(.zip))
        #expect(ImportKind.notion.menuTitle == "Import from Notion\u{2026}")
        #expect(ImportOrigin.files(.notion).name == "Notion")
    }

    /// Persona council 11-04: Notion's found page said "Choose Another the .zip…". Every guide's
    /// other-file button names what it chooses.
    @Test func chooseAnotherNamesWhatItChooses() {
        for kind in ImportKind.allCases {
            guard let g = ImportGuide.live(kind) else { continue }
            let another = ImportGuideSheet.chooseAnother(g.drop.choose)
            #expect(!another.contains("Another the") && !another.contains("Other the") && another.hasPrefix("Choose "), "\(kind): \(another)")
        }
        #expect(ImportGuideSheet.chooseAnother("Choose the .zip\u{2026}") == "Choose Another File\u{2026}")
        #expect(ImportGuideSheet.chooseAnother("Choose Folder\u{2026}") == "Choose Another Folder\u{2026}")
        #expect(ImportGuideSheet.chooseAnother("Choose Files\u{2026}") == "Choose Other Files\u{2026}")
        #expect(ImportGuideSheet.chooseAnother("Choose File") == "Choose Another File")
        #expect(ImportGuideSheet.chooseAnother("Choose Folder or .zip\u{2026}") == "Choose Another Folder or .zip\u{2026}")
    }

    /// Persona council 11-04: before Import, Notion's page names the file, counts its pages and
    /// databases, and says what each becomes and what doesn't come over.
    @Test func notionSaysWhatComesBeforeImport() throws {
        var source = ImportSource(url: URL(fileURLWithPath: "/Users/leo/Downloads/8a1f2b3c_Export-5e6f7a8b.zip"), name: "Notion", notes: 214, bytes: 4_200_000)
        source.preview = ImportPreview(notes: 214, databases: 3, files: 40)
        let found = try #require(ImportGuideFlow.found([source], notes: 214, kind: .notion))
        #expect(found.name == "8a1f2b3c_Export-5e6f7a8b.zip" && found.button == "Import 214 Pages and 3 Databases")
        #expect(ImportGuideFlow.foundNote([source], kind: .notion) == "Pages become notes. Each database becomes a table. Views and formulas don't come over.")
        #expect(ImportGuideFlow.foundRows([source], kind: .notion).map { "\($0.count) \($0.becomes)" } == ["214 pages become notes", "3 databases become tables", "40 pictures and files come with the notes that use them"])
        source.preview = ImportPreview(notes: 1)
        #expect(ImportGuideFlow.found([source], notes: 1, kind: .notion)?.button == "Import 1 Page")
        #expect(ImportGuideFlow.foundNote([source], kind: .notion) == "Pages become notes, and subpages become folders.")
        #expect(ImportGuideFlow.found([source], notes: 1, kind: .keep)?.button == "Import 1 Note", "other sources count notes")
        #expect(ImportGuideFlow.foundNote([source], kind: .obsidian) == nil)
    }

    /// Persona council 11-04: Obsidian's page before Import lists what comes and what doesn't
    /// carry over (embedded notes become links, canvases stay), and the last page says it again.
    @Test func obsidianSaysWhatDoesntCarryOver() {
        var vault = ImportSource(url: URL(fileURLWithPath: "/Users/sara/Documents/Second brain"), name: "Second brain", notes: 1_126, bytes: 48_000_000)
        vault.preview = ImportPreview(notes: 1_126, embeds: 14, canvases: 3, files: 212)
        let rows = ImportGuideFlow.foundRows([vault], kind: .obsidian)
        #expect(rows.map { "\($0.count) \($0.becomes)" } == ["1,126 notes come with their folders", "212 pictures and files come with the notes that use them", "14 embedded notes become links", "3 canvases stay in Obsidian"])
        #expect(rows.map(\.left) == [false, false, true, true], "what doesn't carry over is marked")
        #expect(ImportGuideFlow.leftLine([vault], kind: .obsidian) == "Embedded notes are links. Canvases stayed in Obsidian.")
        vault.preview = ImportPreview(notes: 1_126)
        #expect(ImportGuideFlow.leftLine([vault], kind: .obsidian) == nil, "nothing left out, nothing said")
        #expect(ImportGuideFlow.foundRows([vault, vault], kind: .obsidian).isEmpty, "several picked: just their count")
    }

    /// The counts come from looking the vault over when it's picked: embedded notes (not pictures),
    /// canvases, and the other files, none of Obsidian's own settings.
    @Test func inspectingAVaultCountsWhatItHolds() throws {
        let fm = FileManager.default
        let vault = fm.temporaryDirectory.appending(path: "vault-\(UUID().uuidString)/Second brain")
        defer { try? fm.removeItem(at: vault.deletingLastPathComponent()) }
        func write(_ path: String, _ text: String) throws {
            let url = vault.appending(path: path)
            try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try text.write(to: url, atomically: true, encoding: .utf8)
        }
        try write("Daily/Monday.md", "Plans. ![[Recipe]] and ![[Recipe#Steps]] and ![[photo.png]]\n")
        try write("Recipe.md", "# Recipe\n")
        try write("photo.png", "png")
        try write("Board.canvas", "{}")
        try write(".obsidian/app.json", "{}")
        let p = try #require(ImportKind.obsidian.inspect(vault).preview)
        #expect(p == ImportPreview(notes: 2, embeds: 2, canvases: 1, files: 1))
    }

    /// The last button opens what the import brought, and says so.
    @Test func theLastButtonShowsTheImportedNotes() {
        #expect(EnvironmentValues().importDoneTitle == "Show Imported Notes")
    }

    @Test func takeoutOpensWithOnlyKeepTicked() {
        #expect(ImportGuide.keep.steps.first?.link?.absoluteString == "https://takeout.google.com/settings/takeout/custom/keep")
    }

    @Test func theLastPageCountsWhatCame() {
        #expect(ImportGuideSheet.successTitle(36, from: "Google Keep") == "36 notes from Google Keep are here")
        #expect(ImportGuideSheet.successTitle(1, from: "Google Keep") == "1 note from Google Keep is here")
        #expect(ImportGuideSheet.successTitle(1_489, from: "Evernote") == "1,489 notes from Evernote are here")
        #expect(ImportGuideSheet.successTitle(0, from: "Google Keep") == "Nothing new from Google Keep")
    }

    @Test func showMyNotesOpensTheFolderTheImportMade() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let top = Folder(name: "Google Keep"), label = Folder(name: "Home", parent: top)
        let note = Note(body: "# Shopping list", folder: label), loose = Note(body: "# Loose")
        [top, label].forEach { c.mainContext.insert($0) }
        [note, loose].forEach { c.mainContext.insert($0) }
        #expect(c.mainContext.importScope(of: note.id) == .folder(top.id), "the import's own folder, not its label's")
        #expect(c.mainContext.importScope(of: loose.id) == .all)
    }

    /// Air test 10-13: Show My Notes opened Obsidian's folder with a note from a folder inside it
    /// in the editor, a note the list didn't show.
    @Test func showMyNotesOpensANoteTheListShows() throws {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let vault = Folder(name: "Second brain"), daily = Folder(name: "Daily", parent: vault)
        let inner = Note(body: "# 2026-10-12", folder: daily), older = Note(body: "# Ideas", folder: vault), newer = Note(body: "# Weekly review", folder: vault)
        older.updatedAt = .now.addingTimeInterval(-3600)
        [vault, daily].forEach { c.mainContext.insert($0) }
        [inner, older, newer].forEach { c.mainContext.insert($0) }
        let landing = c.mainContext.importLanding(of: [inner.id, older.id, newer.id])
        #expect(landing.scope == .folder(vault.id) && landing.note == newer.id, "the vault, on its newest note there")
        let onlyInner = c.mainContext.importLanding(of: [inner.id])
        #expect(onlyInner.scope == .folder(daily.id) && onlyInner.note == inner.id, "nothing at the top: the note's own folder")
    }

    /// Air test 10-13: Obsidian's one page had no label over its title, unlike every other guide's.
    @Test func everyStepPageIsLabelled() {
        #expect(ImportGuideSheet.stepLabel(2, of: 3) == "Step 2 of 3")
        #expect(ImportGuide.obsidian(picture: nil).steps.count == 1)
        #expect(ImportGuideSheet.stepLabel(1, of: 1) == "One step")
    }

    #if os(macOS)
    /// Air test 10-13: Bear's "Pick Markdown" sat under its ring, over the picture's words, and the
    /// picture cut "Convert note links to HTML links" at its edge. A label goes beside its ring
    /// (rings ending left of 0.7), and the picture is cropped wide enough for the whole row.
    @Test func ringLabelsSitBesideTheirRing() throws {
        let url = try #require(ImportGuide.picture("guide-bear-export"))
        for kind in ImportKind.allCases {
            for step in ImportGuide.live(kind)?.steps ?? [] {
                guard case .picture(_, let rings) = step.art else { continue }
                for (ring, label) in rings where label != nil { #expect(ring.maxX < 0.7, "\(kind) \(label!)") }
            }
        }
        let size = try #require(NSImage(contentsOf: url)?.size)
        #expect(size.width / size.height > 4.5, "the whole checkbox row is in the picture")
    }
    #endif

    /// Air test 10-13: two Evernote notebooks were "Drag it here" and "This looks like the one".
    @Test func severalFilesAreThem() {
        #expect(ImportGuideSheet.foundLine(many: true) == "These look like the ones. Import them, or choose others.")
        #expect(ImportGuideSheet.foundLine(many: false) == "This looks like the one. Import it, or choose another.")
        #if os(macOS)
        #expect(ImportGuideSheet.dropHint(.empty, many: ImportGuide.evernote.drop.choose.contains("Files")) == "Drag them here from Finder")
        #expect(ImportGuideSheet.dropHint(.empty, many: ImportGuide.keep.drop.choose.contains("Files")) == "Drag it here from Finder")
        #endif
        #expect(GuideDrawing.evernoteNotebooks.last == "Work", "the menu opens under the last notebook, covering none")
    }

    /// Emil 10-13, option B: with Obsidian's vault found, Import opens on it, ready to import, and
    /// Back goes to the guide. Without one, the guide as for every other source.
    @Test func obsidianOpensOnTheFoundVault() throws {
        let json = Data(#"{"vaults":{"a":{"path":"/v/Old","ts":1700000000000},"b":{"path":"/v/Second brain","ts":1791856569000,"open":true},"c":{"path":"/v/Gone","ts":1800000000000}},"frame":"hidden"}"#.utf8)
        let vault = try #require(ObsidianVaults.latest(in: json, exists: { $0.path != "/v/Gone" }))
        #expect(vault.path == "/v/Second brain", "the open vault, of those still there")
        #expect(ObsidianVaults.latest(in: Data(#"{"vaults":{}}"#.utf8)) == nil)
        #expect(ObsidianVaults.latest(in: Data("not json".utf8)) == nil)

        let found = ImportGuideFlow.opening(vault: vault)
        #expect(found.stage == .drop && found.trail == [.intro])
        let none = ImportGuideFlow.opening(vault: nil)
        #expect(none.stage == .intro && none.trail.isEmpty)
        // Only Obsidian, and only when nothing was handed to the sheet.
        #expect(ImportGuideFlow(guide: .markdown, kind: .markdown, vault: vault).vault == nil)
        #expect(ImportGuideFlow(guide: .obsidian(picture: nil), kind: .obsidian, files: [vault], vault: vault).vault == nil)
        #expect(ImportGuideFlow(guide: .obsidian(picture: nil), kind: .obsidian, vault: vault).vault == vault)
    }

    /// The guides' import_step: each page as it shows (intro 1, steps, the drop page last), the
    /// "already have it" shortcut, and Obsidian's found vault, whose found page counts as its page.
    @Test func theGuideRecordsItsSteps() {
        #expect(ImportGuideFunnel.page(.intro, steps: 3) == 1)
        #expect(ImportGuideFunnel.page(.step(2), steps: 3) == 4)
        #expect(ImportGuideFunnel.page(.drop, steps: 3) == 5, "Keep's drop page is its fifth")
        #expect(ImportGuideFunnel.page(.drop, steps: 1) == 3)
        #expect(ImportGuideFunnel.page(.success, steps: 3) == nil)

        let steps = FunnelSteps()
        steps.watch {
            ImportGuideFunnel.opened(.keep, at: .intro, steps: 3, vaultFound: false)
            ImportGuideFunnel.moved(.keep, to: .step(0), steps: 3)
            ImportGuideFunnel.alreadyHaveFile(.keep)
            ImportGuideFunnel.moved(.keep, to: .importing(done: 0, total: 3), steps: 3)
        }
        #expect(steps.count(.importStep(.keep, .opened)) == 1)
        #expect(steps.count(.importStep(.keep, .guidePage, page: 1)) == 1)
        #expect(steps.count(.importStep(.keep, .guidePage, page: 2)) == 1)
        #expect(steps.count(.importStep(.keep, .alreadyHaveFile)) == 1)
        #expect(steps.events.count == 4, "importing isn't a page")

        let found = FunnelSteps()
        let opening = ImportGuideFlow.opening(vault: URL(fileURLWithPath: "/v/Second brain"))
        found.watch { ImportGuideFunnel.opened(.obsidian, at: opening.stage, steps: 1, vaultFound: true) }
        #expect(found.count(.importStep(.obsidian, .fileFoundAutomatically)) == 1)
        #expect(found.count(.importStep(.obsidian, .guidePage, page: 3)) == 1, "the found page is the drop page")
        #expect(found.count(.importStep(.obsidian, .guidePage, page: 1)) == 0)
    }

    @Test func theRealPicturesShipWithTheApp() {
        for name in ["guide-bear-export", "guide-obsidian-reveal", "guide-obsidian-files"] {
            #expect(ImportGuide.picture(name) != nil, "\(name).png is in the app")
        }
    }

    @Test func theGuideShowsKeepsOwnIcon() throws {
        // Intro, importing and success all draw ImportSourceIcon(origin: guide.origin).
        let name = try #require(ImportGuide.keep.origin.bundledIcon)
        #if os(macOS)
        #expect(ImportGuide.keep.origin.bundleIdentifier == nil, "no Keep app: the shipped icon, not a drawn tile")
        #expect(NSImage(named: name) != nil, "\(name) is in the app")
        #else
        #expect(UIImage(named: name) != nil, "\(name) is in the app")
        #endif
    }

    /// 560 tall where there is room; on a short window, the window less 80 and never within 40 of
    /// its bottom, which sits under the title bar and toolbar.
    @Test func theSheetFitsAShortWindow() {
        #expect(ImportSheetFit.height(window: 760, underBars: 708) == 560)
        #expect(ImportSheetFit.height(window: 640, underBars: 588) == 548, "the window, less 40 under the bars")
        #expect(ImportSheetFit.height(window: 600, underBars: 580) == 520, "the window, less 80")
        // The smallest notes window: 520 under the bars, a title bar and toolbar on top.
        let smallest = ImportSheetFit.height(window: 572, underBars: 520)
        #expect(smallest == 480)
        #expect(520 - smallest >= ImportSheetFit.margin)
    }

    #if os(macOS)
    /// A guide opened from a card is a sheet on a sheet: it fits the notes window, not the card's
    /// short window (which shrank every guide from the first run's cards to the 300 floor, its
    /// picture gone; Emil, 9 November 2026). Offscreen windows, closed at the end.
    @Test func aSheetOnACardFitsTheNotesWindow() async throws {
        func window(_ height: CGFloat) -> NSWindow {
            let w = NSWindow(contentRect: CGRect(x: -30000, y: -30000, width: 900, height: height),
                             styleMask: [.titled], backing: .buffered, defer: false)
            w.isReleasedWhenClosed = false
            return w
        }
        let notes = window(860)
        let card = window(380)
        let guide = window(560)
        notes.orderFrontRegardless()
        defer { notes.endSheet(card); card.endSheet(guide); guide.close(); card.close(); notes.close() }
        notes.beginSheet(card, completionHandler: nil)
        card.beginSheet(guide, completionHandler: nil)
        for _ in 0..<40 where guide.sheetParent == nil || card.sheetParent == nil { try await Task.sleep(for: .milliseconds(25)) }
        try #require(guide.sheetParent === card && card.sheetParent === notes, "the sheets didn't attach")
        #expect(ImportSheetFit.top(guide) === notes)
        #expect(ImportSheetFit.height(guide) == ImportSheetFit.height(notes))
        #expect(ImportSheetFit.height(guide) == ImportSheetFit.designed, "a tall notes window gives the guide its designed height")
        // What it was: measured against the card, the guide fell to the floor.
        #expect(ImportSheetFit.height(window: card.frame.height, underBars: card.contentLayoutRect.height) == 300)
    }

    /// Every Connect an AI page fits its sheet at the designed height, and a page with a picture
    /// shows it: the picture has room (it is the first thing a short sheet gives up).
    @Test func everyConnectPageFitsItsSheet() throws {
        for (name, run) in ConnectGuideSnapshots.pages() {
            for height: CGFloat in [560, 480] {
                let needs = Self.needs(ConnectWebGuideSheet(run: run, height: height).pages)
                #expect(needs <= height + 0.5, "\(name) at \(height) needs \(needs)")
            }
        }
    }

    /// On the smallest window the picture shrinks; the words keep their size and every page still
    /// fits: the content's own height at the shorter sheet is no more than the sheet.
    @Test func aShortSheetShrinksThePictureNotTheWords() throws {
        for guide in [ImportGuide.keep, .evernote, .bear(picture: nil), .obsidian(picture: nil), .markdown] {
            let pages: [ImportGuidePage] = [.intro] + guide.steps.indices.map { .step($0) } + [.drop(.empty), .drop(.found), .drop(.wrong), .importing(done: 3, total: 9), .success]
            for page in pages {
                for height: CGFloat in [560, 480, 440] {
                    let needs = Self.needs(ImportGuideSheet(guide: guide, page: page, height: height).pages)
                    #expect(needs <= height + 0.5, "\(guide.id) \(page) at \(height) needs \(needs)")
                }
            }
        }
        for page in [ImportNoticePage.notesDenied, .notesEmpty] {
            var short = page
            short.height = 440
            let needs = Self.needs(short.page)
            #expect(needs <= 440.5, "\(page.title) needs \(needs)")
        }
    }

    /// The height a page needs at the sheet's width: every spacer at its least.
    private static func needs(_ page: some View) -> CGFloat {
        let host = NSHostingView(rootView: page.frame(width: 540).fixedSize(horizontal: false, vertical: true))
        host.layoutSubtreeIfNeeded()
        return host.fittingSize.height
    }
    #endif
}
