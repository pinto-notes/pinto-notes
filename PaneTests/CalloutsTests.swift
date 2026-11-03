import Foundation
import Testing
#if os(iOS)
import UIKit
#else
import AppKit
#endif
@testable import Pane

/// Callouts (`> [!warning] Title`, as Obsidian writes them and Notion exports them) and
/// highlights (`==text==`): Obsidian notes imported into Pinto showed `[!note]` and `==` as text.
@Suite struct CalloutsTests {
    // MARK: Parsing

    @Test func typesAndAliasesFollowObsidian() {
        let cases: [(String, Callouts.Kind)] = [
            ("note", .note), ("abstract", .abstract), ("summary", .abstract), ("tldr", .abstract),
            ("info", .info), ("todo", .todo), ("tip", .tip), ("hint", .tip), ("important", .tip),
            ("success", .success), ("check", .success), ("done", .success),
            ("question", .question), ("help", .question), ("faq", .question),
            ("warning", .warning), ("caution", .warning), ("attention", .warning),
            ("failure", .failure), ("fail", .failure), ("missing", .failure),
            ("danger", .danger), ("error", .danger), ("bug", .bug), ("example", .example),
            ("quote", .quote), ("cite", .quote),
            // Any case (GitHub writes `[!NOTE]`); anything unknown is a note.
            ("WARNING", .warning), ("Tip", .tip), ("recipe", .note),
        ]
        for (name, kind) in cases { #expect(Callouts.Kind(name: name) == kind, "\(name)") }
    }

    @Test func aSmallCalmPalette() {
        #expect(Set(Callouts.Kind.allCases.map(\.tone)) == [.blue, .green, .orange, .red, .purple, .grey])
        #expect(Callouts.Kind.warning.tone == .orange && Callouts.Kind.danger.tone == .red && Callouts.Kind.quote.tone == .grey)
    }

    @Test func everySymbolExists() {
        for kind in Callouts.Kind.allCases {
            #if os(macOS)
            #expect(NSImage(systemSymbolName: kind.symbol, accessibilityDescription: nil) != nil, "\(kind.symbol)")
            #else
            #expect(UIImage(systemName: kind.symbol) != nil, "\(kind.symbol)")
            #endif
        }
    }

    @Test func headerTitleAndPrefix() throws {
        let h = try #require(Callouts.header("> [!warning] Check the passport"))
        #expect(h.kind == .warning && h.title == "Check the passport" && h.shownTitle == "Check the passport")
        #expect(h.prefixLength == ("> [!warning] " as NSString).length)
        // No title: the type's own name, as written.
        #expect(Callouts.header("> [!note]")?.shownTitle == "Note")
        #expect(Callouts.header(">[!SUMMARY]")?.shownTitle == "Summary")
        #expect(Callouts.header("> [!tldr]")?.shownTitle == "TL;DR")
        #expect(Callouts.header("> [!recipe]")?.shownTitle == "Recipe")
        // Foldable markers read the same.
        #expect(Callouts.header("> [!tip]- Hidden at first")?.title == "Hidden at first")
        #expect(Callouts.header("> [!tip]+")?.title == nil)
        // A plain quote, or a type not right after the `>`, is no callout.
        #expect(Callouts.header("> Just a quote") == nil)
        #expect(Callouts.header("> see [!note]") == nil)
        #expect(Callouts.header("[!note] no quote") == nil)
    }

    @Test func blocksRunWhileLinesStartWithAQuote() {
        let text = "Intro\n\n> [!info] Heads up\n> First\n>\n> Last\n\nAfter\n> plain quote\n"
        let ns = text as NSString
        let lines = Callouts.lines(in: ns, range: NSRange(location: 0, length: ns.length))
        let head = ns.range(of: "> [!info]").location
        #expect(lines.count == 4)
        #expect(lines[head]?.first == true && lines[head]?.header?.title == "Heads up")
        #expect(lines[ns.range(of: "> Last").location]?.last == true)
        #expect(lines[ns.range(of: "> plain quote").location] == nil)
        // A region inside the callout still knows where it starts.
        let middle = Callouts.lines(in: ns, range: ns.lineRange(for: ns.range(of: "> Last")))
        #expect(middle[head]?.first == true && middle[ns.range(of: "> Last").location]?.last == true)
        // `[!type]` further down a quote is text.
        let later = "> A quote\n> [!note] not a callout\n" as NSString
        #expect(Callouts.lines(in: later, range: NSRange(location: 0, length: later.length)).isEmpty)
    }

    // MARK: Styling

    @MainActor func styled(_ text: String, caret: Int? = nil) -> NSTextStorage {
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: caret.map { NSRange(location: $0, length: 0) } ?? NSRange(location: NSNotFound, length: 0))
        return storage
    }

    func callout(_ s: NSTextStorage, at i: Int) -> (CalloutLook, Bool, Bool)? {
        guard case .callout(let look, let first, let last) = (s.attribute(.paneLine, at: i, effectiveRange: nil) as? LineDecoration)?.kind else { return nil }
        return (look, first, last)
    }

    func color(_ s: NSTextStorage, _ i: Int) -> PColor? { s.attribute(.foregroundColor, at: i, effectiveRange: nil) as? PColor }

    @MainActor @Test func aPanelWithSymbolAndBoldTitle() throws {
        let text = "Trip\n\n> [!warning] Check the passport\n> It expires in March.\n"
        let ns = text as NSString
        let s = styled(text)
        let head = ns.range(of: "> [!warning]").location
        let (look, first, last) = try #require(callout(s, at: head))
        #expect(look.tone == .orange && look.symbol == "exclamationmark.triangle.fill" && look.title == nil)
        #expect(first && !last)
        // `> [!warning] ` is hidden; the title is bold, in the callout's colour.
        #expect(color(s, head) == PColor.clear && color(s, head + 5) == PColor.clear)
        let title = ns.range(of: "Check")
        let font = try #require(s.attribute(.font, at: title.location, effectiveRange: nil) as? PFont)
        #expect(font.fontDescriptor.symbolicTraits.contains(.paneBold))
        #expect(color(s, title.location) == Callouts.Tone.orange.ink)
        // The body: `> ` hidden, text in the label colour, the last line of the panel.
        let body = ns.range(of: "> It expires")
        #expect(color(s, body.location) == PColor.clear)
        #expect(color(s, body.location + 2) == PColor.paneLabel)
        let (_, bf, bl) = try #require(callout(s, at: body.location))
        #expect(!bf && bl)
        // Text starts inside the panel.
        let p = try #require(s.attribute(.paragraphStyle, at: body.location, effectiveRange: nil) as? NSParagraphStyle)
        #expect(p.headIndent == MarkdownStyler.calloutPad && p.tailIndent == -MarkdownStyler.calloutPad)
    }

    @MainActor @Test func noTitleDrawsTheTypesName() throws {
        let s = styled("Trip\n\n> [!tip]\n> Pack light.\n")
        let head = ("Trip\n\n> [!tip]" as NSString).range(of: "> [!tip]").location
        let (look, _, _) = try #require(callout(s, at: head))
        #expect(look.title == "Tip" && look.symbol == "lightbulb.fill" && look.tone == .green)
    }

    @MainActor @Test func theCaretsLineShowsItsSyntaxDimmed() throws {
        let text = "Trip\n\n> [!warning] Check the passport\n> It expires in March.\n"
        let ns = text as NSString
        let head = ns.range(of: "> [!warning]").location
        let s = styled(text, caret: head + 14)
        #expect(color(s, head) == PColor.paneTertiary && color(s, head + 4) == PColor.paneTertiary)
        // No symbol over the written type; the panel stays.
        let (look, _, _) = try #require(callout(s, at: head))
        #expect(look.symbol == nil && look.title == nil)
        // The other line keeps its `> ` hidden.
        #expect(color(s, ns.range(of: "> It expires").location) == PColor.clear)
    }

    @MainActor @Test func aPlainQuoteStaysAQuote() {
        let s = styled("Trip\n\n> Just a quote\n")
        #expect((s.attribute(.paneLine, at: 6, effectiveRange: nil) as? LineDecoration)?.kind == .quote)
    }

    @MainActor @Test func inCodeItIsCode() {
        let text = "Trip\n\n```\n> [!note] code\n```\n"
        let s = styled(text)
        let at = (text as NSString).range(of: "> [!note]").location
        guard case .code = (s.attribute(.paneLine, at: at, effectiveRange: nil) as? LineDecoration)?.kind else {
            Issue.record("not code"); return
        }
    }

    // MARK: Format › Callout

    func run(_ text: String, _ sel: NSRange) -> (String, Int) {
        let e = Callouts.toggle(in: text, selection: sel)
        return ((text as NSString).replacingCharacters(in: e.range, with: e.replacement), e.caret)
    }

    @Test func insertOnAnEmptyLine() {
        let (text, caret) = run("Trip\n\n", NSRange(location: 6, length: 0))
        #expect(text == "Trip\n\n> [!note]\n> ")
        #expect(caret == (text as NSString).length)
    }

    @Test func wrapsTheSelectedLines() {
        let src = "Trip\n\nPassport\nTickets\n\nEnd"
        let (text, _) = run(src, NSRange(location: 7, length: 10))
        #expect(text == "Trip\n\n> [!note]\n> Passport\n> Tickets\n\nEnd")
        // A quote already: the header goes above it.
        #expect(run("Trip\n\n> Passport", NSRange(location: 9, length: 0)).0 == "Trip\n\n> [!note]\n> Passport")
    }

    @Test func againTakesItOut() {
        #expect(run("Trip\n\n> [!note]\n> Passport\n> Tickets\n\nEnd", NSRange(location: 20, length: 0)).0 == "Trip\n\nPassport\nTickets\n\nEnd")
        // A title stays as a line of its own.
        #expect(run("Trip\n\n> [!warning] Check\n> Passport", NSRange(location: 8, length: 0)).0 == "Trip\n\nCheck\nPassport")
    }

    @Test func inTheFormatPanel() {
        #expect(FormatControl.rows.flatMap { $0 }.contains([.callout]))
        var s = FormatState.at("Trip\n\n> [!note]\n> Passport", selection: NSRange(location: 18, length: 0))
        #expect(s.isOn(.callout) && !s.isOn(.quote))
        s = FormatState.at("Trip\n\n> Passport", selection: NSRange(location: 9, length: 0))
        #expect(!s.isOn(.callout) && s.isOn(.quote))
        var code = FormatState()
        code.monostyled = true
        #expect(!code.isEnabled(.callout) && FormatState().isEnabled(.callout))
    }

    // MARK: The note keeps it as written

    @MainActor @Test func importAndExportKeepTheSyntax() {
        let body = "Trip\n\n> [!warning]- Check the passport\n> It expires ==in March==.\n\nPack ==light==."
        let parsed = MarkdownNote.parse("---\ntags: [travel]\n---\n" + body, fileName: "Trip")
        #expect(parsed.body == body)
        let file = NoteExport.fileText(body, created: .now, updated: .now, kept: nil, fileStem: "Trip")
        #expect(file.hasSuffix(body + "\n"))
        #expect(MarkdownNote.parse(file, fileName: "Trip").body == body)
    }
}

/// `==text==`: a highlighter behind the text, the marks hidden like bold's.
@Suite struct HighlightsTests {
    @Test func findsHighlights() {
        func inner(_ s: String) -> [String] { Highlights.spans(in: s).map { (s as NSString).substring(with: $0.inner) } }
        #expect(inner("Pack ==light== and ==early==.") == ["light", "early"])
        #expect(inner("==a==") == ["a"])
        // Not maths, not a setext underline, not spaced marks, not across lines.
        #expect(inner("a == b == c").isEmpty)
        #expect(inner("=====").isEmpty)
        #expect(inner("== spaced ==").isEmpty)
        #expect(inner("==one\ntwo==").isEmpty)
    }

    @MainActor @Test func styledWithTheMarksHidden() throws {
        let text = "Trip\n\nPack ==light== please"
        let ns = text as NSString
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        let mark = ns.range(of: "==")
        let word = ns.range(of: "light")
        #expect(storage.attribute(.paneHighlight, at: word.location, effectiveRange: nil) != nil)
        #expect(storage.attribute(.paneHighlight, at: mark.location, effectiveRange: nil) == nil)
        #expect(storage.attribute(.foregroundColor, at: mark.location, effectiveRange: nil) as? PColor == PColor.clear)
        #expect(storage.attribute(.foregroundColor, at: NSMaxRange(word), effectiveRange: nil) as? PColor == PColor.clear)
        // On the caret's line they show, dimmed.
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: word.location, length: 0))
        #expect(storage.attribute(.foregroundColor, at: mark.location, effectiveRange: nil) as? PColor == PColor.paneTertiary)
        #expect(storage.attribute(.paneHighlight, at: word.location, effectiveRange: nil) != nil)
    }

    @MainActor @Test func notInCode() {
        let text = "Trip\n\nRun `a ==b== c` now"
        let storage = NSTextStorage(string: text)
        _ = MarkdownStyler().apply(to: storage, active: NSRange(location: NSNotFound, length: 0))
        #expect(storage.attribute(.paneHighlight, at: (text as NSString).range(of: "b").location, effectiveRange: nil) == nil)
    }

    func run(_ text: String, _ sel: NSRange) -> (String, NSRange?) {
        let e = FormatState.toggle(.highlight, in: text, selection: sel)
        return ((text as NSString).replacingCharacters(in: e.range, with: e.replacement), e.selection)
    }

    @Test func toggleWrapsAndUnwraps() {
        // A selection is wrapped and stays selected on the same letters.
        let (on, kept) = run("Pack light now", NSRange(location: 5, length: 5))
        #expect(on == "Pack ==light== now" && kept == NSRange(location: 7, length: 5))
        // Again takes it off.
        #expect(run(on, kept!).0 == "Pack light now")
        // The caret in a word: the word.
        #expect(FormatState.toggle(.highlight, in: "Pack light", selection: NSRange(location: 7, length: 0)).replacement == "==light==")
        // The caret inside a highlight: off.
        #expect(run("Pack ==light== now", NSRange(location: 9, length: 0)).0 == "Pack light now")
    }

    @Test func theFormatPanelShowsItOn() {
        #expect(FormatState.at("Pack ==light== now", selection: NSRange(location: 9, length: 0)).isOn(.highlight))
        #expect(!FormatState.at("Pack light now", selection: NSRange(location: 7, length: 0)).isOn(.highlight))
        #expect(FormatControl.rows.first?.flatMap { $0 }.contains(.highlight) == true)
        #expect(FormatControl.highlight.symbol == "highlighter")
    }

    @Test func returnInsideTheClosingMarksStartsAfterThem() {
        let text = "Pack ==light=="
        let e = ListEditing.returnKey(in: text, selection: NSRange(location: 12, length: 0))
        #expect(e.map { (text as NSString).replacingCharacters(in: $0.range, with: $0.replacement) } == "Pack ==light==\n")
    }

    // MARK: Choosing a type (Emil, 3 November 2026: typing `[!warning]` "doesn't seem like great UX")

    @Test func theTypeMenuRewritesOnlyTheType() {
        let text = "Trip\n\n> [!note] Passport\n> It expires in March."
        let line = (text as NSString).range(of: "> [!note]").location
        let e = Callouts.setKind(.warning, in: text, line: line)
        #expect(e.map { (text as NSString).replacingCharacters(in: $0.range, with: $0.replacement) } == "Trip\n\n> [!warning] Passport\n> It expires in March.")
        // A line that isn't a callout's header: nothing.
        #expect(Callouts.setKind(.tip, in: text, line: (text as NSString).range(of: "> It").location) == nil)
        #expect(Callouts.setKind(.tip, in: text, line: 0) == nil)
        // Foldable markers and Obsidian's other names are rewritten too.
        let folded = "> [!FAQ]- Why\n> Because."
        #expect(Callouts.setKind(.tip, in: folded, line: 0).map { (folded as NSString).replacingCharacters(in: $0.range, with: $0.replacement) } == "> [!tip]- Why\n> Because.")
    }

    @Test func theMenuOffersTenTypesStartingWithNote() {
        #expect(Callouts.menuKinds.first == .note)
        #expect(Callouts.menuKinds.count == 10)
        #expect(Set(Callouts.menuKinds).count == 10)
        #expect(Callouts.Kind.warning.title == "Warning")
    }

    @Test func insertingACalloutOfAType() {
        let e = Callouts.toggle(in: "", selection: NSRange(location: 0, length: 0), kind: .warning)
        #expect(e.replacement == "> [!warning]\n> ")
    }

    @Test func aTypedWordNamesAType() {
        #expect(Callouts.kind(typed: "warn") == .warning)
        #expect(Callouts.kind(typed: "Tip") == .tip)
        #expect(Callouts.kind(typed: "error") == .danger, "Obsidian's other names")
        #expect(Callouts.kind(typed: "qu") == .question, "the menu's order decides a tie")
        #expect(Callouts.kind(typed: "callout") == nil)
        #expect(Callouts.kind(typed: "call") == nil)
        #expect(Callouts.kind(typed: "w") == nil, "one letter is too little")
        #expect(Callouts.kind(typed: "table") == nil)
        #expect(SlashCommands.matches("warning") == [.callout])
        #expect(SlashCommands.matches("danger").contains(.callout))
    }
}
