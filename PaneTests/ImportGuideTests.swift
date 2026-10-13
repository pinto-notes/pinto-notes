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
