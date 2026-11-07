import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// What a paste should become.
enum PasteKind: Equatable { case image, richText, plain }

extension RichPaste {
    /// An image wins unless there's real text alongside it: browsers and apps put
    /// the image's address or an <img> tag next to the picture itself.
    static func kind(hasImage: Bool, text: String?, htmlIsOnlyImage: Bool) -> PasteKind {
        guard hasImage else { return .richText }
        let t = (text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if t.isEmpty || htmlIsOnlyImage || t.hasPrefix("http") && !t.contains(" ") || t.hasPrefix("file:") { return .image }
        return .richText
    }

    /// True when HTML is just an image (and wrappers), with no text of its own.
    static func htmlIsOnlyImage(_ html: String?) -> Bool {
        guard let html, html.range(of: "<img", options: .caseInsensitive) != nil else { return false }
        let text = html.replacingOccurrences(of: #"<[^>]*>"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: "&nbsp;", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return text.isEmpty
    }
}

/// Turns rich text on the pasteboard (copied from Apple Notes, a web page…) into markdown.
@MainActor
enum RichPaste {
    /// nil when the pasteboard holds plain text only, so the normal paste runs.
    static func markdownFromPasteboard() -> String? {
        guard let attributed = attributedFromPasteboard() else { return nil }
        let md = clean(RichTextToMarkdown.markdown(from: attributed, paragraphGaps: true))
        let plain = clean(attributed.string)
        return md == plain ? nil : md
    }

    static func clean(_ s: String) -> String {
        s.replacingOccurrences(of: "\u{FFFC}", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func attributedFromPasteboard() -> NSAttributedString? {
        #if os(iOS)
        let pb = UIPasteboard.general
        if let data = pb.data(forPasteboardType: "public.rtfd") ?? pb.data(forPasteboardType: "com.apple.flat-rtfd"),
           let a = try? NSAttributedString(data: data, options: [.documentType: NSAttributedString.DocumentType.rtfd], documentAttributes: nil) { return a }
        if let data = pb.data(forPasteboardType: "public.rtf"),
           let a = try? NSAttributedString(data: data, options: [.documentType: NSAttributedString.DocumentType.rtf], documentAttributes: nil) { return a }
        if let data = pb.data(forPasteboardType: "public.html").map(OfflineHTML.strip),
           let a = try? NSAttributedString(data: data, options: [.documentType: NSAttributedString.DocumentType.html, .characterEncoding: String.Encoding.utf8.rawValue], documentAttributes: nil) { return a }
        return nil
        #else
        let pb = NSPasteboard.general
        if let data = pb.data(forType: .rtfd) ?? pb.data(forType: NSPasteboard.PasteboardType("com.apple.flat-rtfd")),
           let a = NSAttributedString(rtfd: data, documentAttributes: nil) { return a }
        if let data = pb.data(forType: .rtf), let a = NSAttributedString(rtf: data, documentAttributes: nil) { return a }
        if let data = pb.data(forType: .html), let a = attributed(html: data) { return a }
        return nil
        #endif
    }

    /// HTML from the pasteboard. Stripping takes its charset tag and leaves UTF-8, so it has to be
    /// read as UTF-8: without saying so "It’s" came in as "Itâ€™s" (Emil, 7 November 2026).
    static func attributed(html data: Data) -> NSAttributedString? {
        try? NSAttributedString(data: quotesMarked(OfflineHTML.strip(data)),
                                options: [.documentType: NSAttributedString.DocumentType.html, .characterEncoding: String.Encoding.utf8.rawValue],
                                documentAttributes: nil)
    }

    /// An attributed string keeps a quote only as an indent, so it says "> " in words first.
    private static func quotesMarked(_ data: Data) -> Data {
        let html = String(decoding: data, as: UTF8.self)
        guard html.range(of: "<blockquote", options: .caseInsensitive) != nil,
              let quote = try? NSRegularExpression(pattern: "(<blockquote[^>]*>)(.*?)(</blockquote>)", options: [.caseInsensitive, .dotMatchesLineSeparators]),
              let para = try? NSRegularExpression(pattern: "<p(\\s[^>]*)?>", options: .caseInsensitive) else { return data }
        let out = NSMutableString(string: html)
        for match in quote.matches(in: html, range: NSRange(html.startIndex..., in: html)).reversed() {
            let inner = NSMutableString(string: (html as NSString).substring(with: match.range(at: 2)))
            let paragraphs = para.replaceMatches(in: inner, range: NSRange(location: 0, length: inner.length), withTemplate: "$0&gt; ")
            if paragraphs == 0 { inner.insert("&gt; ", at: 0) }
            out.replaceCharacters(in: match.range(at: 2), with: inner as String)
        }
        return Data((out as String).utf8)
    }

    /// What pasting this HTML puts in the note.
    static func markdown(html data: Data) -> String? {
        guard let attributed = attributed(html: data) else { return nil }
        return clean(RichTextToMarkdown.markdown(from: attributed, paragraphGaps: true))
    }
}
