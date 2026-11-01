import Foundation
import SwiftUI
import Testing
@testable import Pane

/// A table cell at rest shows its inline markdown drawn, the marks hidden (Emil, 1 November 2026).
@Suite struct CellTextTests {
    @Test func marksAreDrawnNotShown() {
        let a = CellText.attributed("**Bold** and *it* and ~~gone~~ and [site](https://example.com) and <u>under</u>")
        let text = String(a.characters)
        #expect(text == "Bold and it and gone and site and under", "no marks: \(text)")
        func run(_ word: String) -> AttributedSubstring { a[a.range(of: word)!] }
        #expect(run("Bold").inlinePresentationIntent?.contains(.stronglyEmphasized) == true)
        #expect(run("it").inlinePresentationIntent?.contains(.emphasized) == true)
        #expect(run("gone").inlinePresentationIntent?.contains(.strikethrough) == true)
        #expect(run("site").link == URL(string: "https://example.com"))
        #expect(run("under").underlineStyle == .single)
    }

    @Test func plainTextIsUntouched() {
        #expect(String(CellText.attributed("Sintra day trip").characters) == "Sintra day trip")
        #expect(String(CellText.attributed("2 < 3").characters) == "2 < 3")
    }
}
