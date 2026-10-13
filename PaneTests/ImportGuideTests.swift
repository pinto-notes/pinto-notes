import SwiftData
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
}
