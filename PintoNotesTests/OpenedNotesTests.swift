import Foundation
import Testing
@testable import PintoNotes

/// Back and forward over the note (Mac, Emil 11-01): like a browser.
struct OpenedNotesTests {
    let a = UUID(), b = UUID(), c = UUID()

    @Test func backAndForward() {
        var h = OpenedNotes()
        h.opened(from: nil, to: a)
        #expect(!h.canGoBack && !h.canGoForward, "the first note has nowhere to go")
        h.opened(from: a, to: b)
        h.opened(from: b, to: c)
        #expect(h.back(from: c) == b)
        h.opened(from: c, to: b)
        #expect(h.canGoForward, "forward to the note you came back from")
        #expect(h.back(from: b) == a)
        h.opened(from: b, to: a)
        #expect(!h.canGoBack)
        #expect(h.forward(from: a) == b)
        h.opened(from: a, to: b)
        #expect(h.forward(from: b) == c)
        h.opened(from: b, to: c)
        #expect(!h.canGoForward && h.canGoBack)
    }

    @Test func openingANoteClearsForward() {
        var h = OpenedNotes()
        h.opened(from: nil, to: a)
        h.opened(from: a, to: b)
        _ = h.back(from: b)
        h.opened(from: b, to: a)
        h.opened(from: a, to: c)
        #expect(!h.canGoForward, "a note opened from the list starts a new path")
        #expect(h.back(from: c) == a)
    }

    @Test func deletedNotesAreSkipped() {
        var h = OpenedNotes()
        h.opened(from: a, to: b)
        h.opened(from: b, to: c)
        #expect(h.back(from: c, gone: { $0 == b }) == a, "a deleted note is passed over")
    }

    @Test func closingTheNoteKeepsTheHistory() {
        var h = OpenedNotes()
        h.opened(from: a, to: b)
        h.opened(from: b, to: nil)
        #expect(h.canGoBack)
    }
}
