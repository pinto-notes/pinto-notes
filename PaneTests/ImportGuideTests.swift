import Testing
@testable import Pane

/// The guided imports: which sources open a guide, and what the last page says.
@MainActor struct ImportGuideTests {
    @Test func keepOpensItsGuideAndNoOtherSheet() {
        #expect(ImportGuide.live(.keep)?.id == "keep")
        for kind in [ImportKind.evernote, .bear, .obsidian, .markdown] {
            #expect(ImportGuide.live(kind) == nil, "\(kind) still opens the plain sheet")
        }
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
}
