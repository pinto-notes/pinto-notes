import Foundation
#if os(macOS)
import AppKit
#endif
import Testing
@testable import Pane

/// Pasting from other apps: each fixture has the shape that app puts on the pasteboard.
@MainActor @Suite struct RichPasteSourcesTests {
    private func paste(_ html: String, _ name: String) -> String {
        let out = RichPaste.markdown(html: Data(html.utf8)) ?? "(nil)"
        print("PASTE \(name) >>>\n\(out)\n<<<")
        return out
    }

    /// Emil's own post, 7 November 2026: no charset tag, curly quotes.
    @Test func aWebPageKeepsItsQuotesAndParagraphs() {
        let md = paste("<p>I never code by hand anymore. It’s something I started at 11.</p><p>Don’t get me wrong, I’m not sad about it.</p><p>I still remember reading <em>Fluent Python</em>, a book.</p>", "web")
        #expect(!md.contains("â€"), "curly quotes survive")
        #expect(md.contains("It’s something"))
        #expect(md.contains("anymore. It’s something I started at 11.\n\nDon’t get me wrong"), "paragraphs stay apart")
        #expect(md.contains("*Fluent Python*"))
    }

    @Test func googleDocs() {
        let md = paste(#"<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><h1 dir="ltr" style="line-height:1.38;margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;font-family:Arial;font-weight:400;">Plan</span></h1><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:400;">Plain words and </span><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:700;">bold ones</span><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:400;"> here.</span></p><br /><ul style="margin-top:0;margin-bottom:0;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;font-family:Arial;font-weight:400;"><p dir="ltr" role="presentation"><span style="font-size:11pt;font-weight:400;">First</span></p></li><li dir="ltr" style="list-style-type:disc;font-size:11pt;font-weight:400;"><p dir="ltr" role="presentation"><span style="font-size:11pt;font-weight:400;">Second</span></p></li></ul></b>"#, "gdocs")
        #expect(md.contains("# Plan"))
        #expect(md.contains("Plain words and **bold ones** here."), "only what's bold is bold")
        #expect(md.contains("* First") || md.contains("- First"))
    }

    @Test func notion() {
        let md = paste(#"<meta charset='utf-8'><h1>Trip</h1><p>Some <strong>strong</strong> text with a <a href="https://example.com/a">link</a>.</p><ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol><pre><code>let x = 1</code></pre>"#, "notion")
        #expect(md.contains("# Trip"))
        #expect(md.contains("**strong**"))
        #expect(md.contains("[link](https://example.com/a)"))
        #expect(md.contains("1. First"))
        #expect(md.contains("```\nlet x = 1\n```"))
    }

    @Test func anAIChat() {
        let md = paste(#"<h3>Steps</h3><ol><li><p><strong>Open</strong> the file.</p></li><li><p>Run <code>make</code> now.</p></li></ol><p>Then:</p><pre><code class="language-bash">npm test\#nnpm run build\#n</code></pre><blockquote><p>Done.</p></blockquote>"#, "chat")
        #expect(md.contains("Steps"))
        #expect(md.contains("1. **Open** the file.\n2. Run"), "one list, no gaps between its items")
        #expect(md.contains("`make`"))
        #expect(md.contains("```\nnpm test\nnpm run build\n```"))
    }

    @Test func slack() {
        let md = paste(#"<meta charset='utf-8'><b data-stringify-type="bold">Heads up</b><span> it’s </span><i data-stringify-type="italic">late</i><br><a href="https://example.com/a" data-stringify-link="https://example.com/a">a link</a><br><ul data-stringify-type="unordered-list"><li>one</li><li>two</li></ul>"#, "slack")
        #expect(md.contains("**Heads up** it’s *late*"))
        #expect(md.contains("[a link](https://example.com/a)"))
    }

    @Test func wordAsHTML() {
        let md = paste(#"<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset=utf-8><style><!-- p.MsoNormal {margin:0cm; font-size:12pt; font-family:"Aptos",sans-serif;} --></style></head><body><!--StartFragment--><p class=MsoNormal>Word’s <b>bold</b> line<o:p></o:p></p><p class=MsoNormal><o:p>&nbsp;</o:p></p><p class=MsoListParagraph style='mso-list:l0 level1 lfo1'><![if !supportLists]><span>·<span>&nbsp;&nbsp;</span></span><![endif]>Item one<o:p></o:p></p><!--EndFragment--></body></html>"#, "word")
        #expect(md.contains("Word’s **bold** line"))
        #expect(!md.contains("<!--") && !md.contains("MsoNormal"), "no styles come through as text")
        #expect(!md.contains("```"), "an empty line is no code block")
    }

    @Test func vsCode() {
        let md = paste(#"<meta charset='utf-8'><div style="color: #d4d4d4;background-color: #1e1e1e;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"><div><span style="color: #569cd6;">let</span><span style="color: #d4d4d4;"> x = 1</span></div><div><span style="color: #d4d4d4;">print(x)</span></div></div>"#, "vscode")
        #expect(md.contains("let x = 1\nprint(x)"))
    }

    @Test func aPageWithItsOwnFonts() {
        let md = paste(#"<div style="font-family: Georgia; font-size: 19px; color: rgb(30,30,30)"><p style="font-size:19px">A long first paragraph of body text that goes on for a while, as they do.</p><p style="font-size:19px">Another paragraph, also long enough to be the body of this page’s text.</p><h2 style="font-size:28px; font-weight:700">A heading</h2><p style="font-size:19px">Closing words.</p></div>"#, "styled")
        #expect(md.contains("# A heading") || md.contains("## A heading"))
        #expect(md.contains("page’s text."))
        #expect(md.contains("as they do.\n\nAnother paragraph"))
    }

    @Test func aQuoteStaysAQuote() {
        let md = paste("<p>Before</p><blockquote><p>First line</p><p>Second line</p></blockquote><blockquote>Bare</blockquote><p>After</p>", "quote")
        #expect(md.contains("> First line"))
        #expect(md.contains("> Second line"))
        #expect(md.contains("> Bare"))
        #expect(md.contains("After") && !md.contains("> After"))
    }

    #if os(macOS)
    /// Word, Pages and TextEdit put RTF on the pasteboard, which wins over their HTML.
    @Test func rtfKeepsBoldAndParagraphs() throws {
        let rtf = #"{\rtf1\ansi\ansicpg1252{\fonttbl\f0 Helvetica;}\f0\fs24\sa240 A \b bold\b0  word.\par Next paragraph\'92s words.\par\sa0 Tight one\par Tight two\par}"#
        let text = try #require(NSAttributedString(rtf: Data(rtf.utf8), documentAttributes: nil))
        let md = RichPaste.clean(RichTextToMarkdown.markdown(from: text, paragraphGaps: true))
        print("PASTE rtf >>>\n\(md)\n<<<")
        #expect(md.contains("A **bold** word.\n\nNext paragraph’s words."))
        #expect(md.contains("Tight one\nTight two"))
    }
    #endif
}
