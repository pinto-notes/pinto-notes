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

    /// Persona council 11-04: a Notion database's rows name their pages, `[[Dune]]`. At rest the
    /// cell reads "Dune" in the links' colour, and a click on the words (not beside them) opens it.
    @Test func wikiLinksReadAsLinks() {
        #expect(String(CellText.attributed("[[Dune]]").characters) == "Dune")
        #expect(String(CellText.attributed("See [[Books/Dune|the book]] and **[[Emma]]**").characters) == "See the book and Emma")
        let a = CellText.attributed("[[Dune]] first")
        #expect(a[a.range(of: "Dune")!].foregroundColor != nil && a[a.range(of: " first")!].foregroundColor == nil)
        #expect(CellText.wikiShown("![[photo.png]] [[Dune#Plot]]").text == "![[photo.png]] Dune", "an embed isn't a link")
        let font = PFont.systemFont(ofSize: EditorMetrics.body)
        let before = ("Read " as NSString).size(withAttributes: [.font: font]).width
        #expect(CellText.link(in: "Read [[Books/Dune]] now", at: before + 4, font: font) == "Books/Dune")
        #expect(CellText.link(in: "Read [[Books/Dune]] now", at: 2, font: font) == nil, "beside the link: edit the cell")
        #expect(CellText.link(in: "[[Dune#Plot]]", at: 3, font: font) == "Dune#Plot")
        #expect(CellText.link(in: "No links", at: 3, font: font) == nil)
    }
}
