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
        for kind in [ImportKind.keep, .obsidian, .markdown] { #expect(ImportGuide.live(kind)?.id == kind.rawValue, "\(kind)") }
        #endif
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
