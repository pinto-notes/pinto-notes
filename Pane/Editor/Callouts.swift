import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Callouts: Obsidian's `> [!warning] Check the passport` (and what Notion callouts export to),
/// drawn as a soft tinted panel with a symbol and a bold title line. The note keeps the quote as
/// written, so sync, export and the AI tools see plain Markdown. The `> ` prefixes and `[!type]`
/// hide at rest and show dimmed on the caret's line, like other syntax.
enum Callouts {
    /// The six calm tints callouts come in.
    enum Tone: Equatable, Sendable {
        case blue, green, orange, red, purple, grey

        /// The symbol and title colour: the accent picker's audited shades where there is one
        /// (4.5:1 as text on the page in light and dark), and an orange made to match.
        var ink: PColor {
            switch self {
            case .blue: Self.inks[0]
            case .green: Self.inks[1]
            case .orange: Self.inks[2]
            case .red: Self.inks[3]
            case .purple: Self.inks[4]
            case .grey: Self.inks[5]
            }
        }

        private static let inks: [PColor] = [
            Palette.pair(0x0957AE, 0x74B7FF), Palette.pair(0x23653D, 0x6CC690), Palette.pair(0x9A4A00, 0xFFAD4D),
            Palette.pair(0xA72A25, 0xFF958D), Palette.pair(0x6841AF, 0xBCA4FF), Palette.pair(0x555555, 0xB2B2B2),
        ]

        /// The panel's hue: the system colour of the tone, brighter than the ink, so a light tint of
        /// it reads as blue or orange rather than grey or beige.
        var hue: UInt32 {
            switch self {
            case .blue: 0x0A84FF
            case .green: 0x30B158
            case .orange: 0xFF9500
            case .red: 0xFF3B30
            case .purple: 0xAF52DE
            case .grey: 0x8E8E93
            }
        }

        /// How much of the hue the panel takes over the page, light and dark. Solid, mixed by hand
        /// (no transparency); a little stronger on black, where a faint tint disappears.
        static let fillLight: CGFloat = 0.1
        static let fillDark: CGFloat = 0.17
    }

    /// Obsidian's callout types. Anything else reads as a note.
    enum Kind: String, CaseIterable, Sendable {
        case note, abstract, info, todo, tip, success, question, warning, failure, danger, bug, example, quote

        /// From the name written in `[!…]`, any case, with Obsidian's aliases.
        init(name: String) {
            switch name.lowercased() {
            case "abstract", "summary", "tldr": self = .abstract
            case "info": self = .info
            case "todo": self = .todo
            case "tip", "hint", "important": self = .tip
            case "success", "check", "done": self = .success
            case "question", "help", "faq": self = .question
            case "warning", "caution", "attention": self = .warning
            case "failure", "fail", "missing": self = .failure
            case "danger", "error": self = .danger
            case "bug": self = .bug
            case "example": self = .example
            case "quote", "cite": self = .quote
            default: self = .note
            }
        }

        var tone: Tone {
            switch self {
            case .note, .abstract, .info, .todo: .blue
            case .tip, .success: .green
            case .question, .warning: .orange
            case .failure, .danger, .bug: .red
            case .example: .purple
            case .quote: .grey
            }
        }

        /// Its name in the type menu.
        var title: String { rawValue.prefix(1).uppercased() + rawValue.dropFirst() }

        var symbol: String {
            switch self {
            case .note: "pencil"
            case .abstract: "list.bullet.clipboard.fill"
            case .info: "info.circle.fill"
            case .todo: "checklist"
            case .tip: "lightbulb.fill"
            case .success: "checkmark.circle.fill"
            case .question: "questionmark.circle.fill"
            case .warning: "exclamationmark.triangle.fill"
            case .failure: "xmark.circle.fill"
            case .danger: "bolt.fill"
            case .bug: "ladybug.fill"
            case .example: "list.bullet"
            case .quote: "quote.opening"
            }
        }
    }

    /// A callout's first line: `> [!type]` (`-` or `+` after it folds in Obsidian; drawn the same
    /// here), then an optional title.
    struct Header: Equatable {
        var kind: Kind
        /// The type as written ("warning", "FAQ").
        var name: String
        /// The title after the type, nil when there is none.
        var title: String?
        /// Everything before the title, from the line's start: `> [!warning] `.
        var prefixLength: Int

        /// What the title line says: the title, or the type's own name ("Note", "Summary").
        var shownTitle: String { title ?? Callouts.title(for: name) }
    }

    /// The type's name as a title when there's no title, as Obsidian shows it ("Summary"), with
    /// the two abbreviations written as people write them.
    static func title(for name: String) -> String {
        switch name.lowercased() {
        case "tldr": return "TL;DR"
        case "faq": return "FAQ"
        default:
            let lower = name.lowercased()
            return lower.prefix(1).uppercased() + lower.dropFirst()
        }
    }

    private static let headerRegex = try! NSRegularExpression(pattern: #"^[ \t]*>[ \t]?\[!([A-Za-z][\w-]*)\][+-]?[ \t]*(.*)$"#)
    private static let quoteRegex = try! NSRegularExpression(pattern: #"^[ \t]*>[ \t]?"#)

    static func header(_ line: String) -> Header? {
        let ns = line as NSString
        guard let m = headerRegex.firstMatch(in: line, range: NSRange(location: 0, length: ns.length)) else { return nil }
        let name = ns.substring(with: m.range(at: 1))
        let titleRange = m.range(at: 2)
        let raw = ns.substring(with: titleRange).trimmingCharacters(in: .whitespaces)
        return Header(kind: Kind(name: name), name: name, title: raw.isEmpty ? nil : raw, prefixLength: titleRange.location)
    }

    /// How long a quote line's `> ` is, or nil for a line that isn't one.
    static func quotePrefix(_ line: String) -> Int? {
        quoteRegex.firstMatch(in: line, range: NSRange(location: 0, length: (line as NSString).length))?.range.length
    }

    /// One line of a callout, for the styler.
    struct Line: Equatable {
        var kind: Kind
        /// Set on the callout's first line.
        var header: Header?
        var first: Bool
        var last: Bool
        /// The line's `> ` (or `> [!type] ` on the first line).
        var prefixLength: Int
    }

    /// The callout lines that start in `range`, keyed by where each line starts. A callout is a
    /// quote whose first line is a `[!type]` header; it runs while lines start with `>`. The scan
    /// reaches outside `range` to find where its quotes start and end.
    static func lines(in ns: NSString, range: NSRange) -> [Int: Line] {
        guard ns.length > 0, range.length > 0 || range.location < ns.length else { return [:] }
        func line(at i: Int) -> NSRange { ns.lineRange(for: NSRange(location: i, length: 0)) }
        func content(_ r: NSRange) -> String {
            var s = ns.substring(with: r)
            while s.hasSuffix("\n") || s.hasSuffix("\r") { s.removeLast() }
            return s
        }
        func isQuote(_ r: NSRange) -> Bool { quotePrefix(content(r)) != nil }
        // Back to the first line of the quote that `range` starts in.
        var start = line(at: min(range.location, ns.length - 1)).location
        while start > 0 {
            let prev = line(at: start - 1)
            guard isQuote(prev), isQuote(line(at: start)) else { break }
            start = prev.location
        }
        let end = NSMaxRange(range)
        var out: [Int: Line] = [:]
        var i = start
        while i < ns.length {
            let r = line(at: i)
            if r.location >= end, r.location > range.location { break }
            guard isQuote(r) else { i = NSMaxRange(r); continue }
            // A run of quote lines: a callout when its first line is a header.
            var run: [NSRange] = [r]
            var j = NSMaxRange(r)
            while j < ns.length {
                let next = line(at: j)
                guard isQuote(next) else { break }
                run.append(next)
                j = NSMaxRange(next)
            }
            if let h = header(content(r)) {
                for (n, l) in run.enumerated() {
                    let prefix = n == 0 ? h.prefixLength : quotePrefix(content(l)) ?? 0
                    out[l.location] = Line(kind: h.kind, header: n == 0 ? h : nil, first: n == 0, last: n == run.count - 1, prefixLength: prefix)
                }
            }
            i = j
        }
        return out
    }

    // MARK: Format › Callout

    /// The caret's line (or every selected line) in a note callout, or out of the callout it's in.
    /// An empty line becomes a callout with an empty line in it for the caret; lines that are
    /// already a quote get the header above them.
    /// The types the type menu offers, in its order. The rest (summary, to-do, failure) still
    /// show when written, as Obsidian has them; they're close enough to one of these not to crowd it.
    static let menuKinds: [Kind] = [.note, .info, .tip, .success, .question, .warning, .danger, .bug, .example, .quote]

    /// The callout's type changed to `kind`: its `[!type]` is rewritten, the title kept.
    /// `line`: where the callout's first line starts. Nil when that line isn't a callout's header.
    static func setKind(_ kind: Kind, in text: String, line: Int) -> TextEdit? {
        let ns = text as NSString
        guard line >= 0, line < ns.length else { return nil }
        var r = ns.lineRange(for: NSRange(location: line, length: 0))
        guard r.location == line else { return nil }
        if r.length > 0, ns.character(at: NSMaxRange(r) - 1) == 0x0A { r.length -= 1 }
        let content = ns.substring(with: r)
        guard let m = headerRegex.firstMatch(in: content, range: NSRange(location: 0, length: (content as NSString).length)) else { return nil }
        let name = m.range(at: 1)
        return TextEdit(range: NSRange(location: line + name.location, length: name.length), replacement: kind.rawValue, caret: -1)
    }

    /// The type a typed word names, for the `/` menu (`/warn` → Warning): the start of a menu
    /// type's name, or one of Obsidian's other names for a type. Nil for "callout" itself.
    static func kind(typed: String) -> Kind? {
        let q = typed.lowercased().trimmingCharacters(in: .whitespaces)
        guard q.count >= 2, !"callout".hasPrefix(q), !q.hasPrefix("callout") else { return nil }
        if let k = menuKinds.first(where: { $0.rawValue.hasPrefix(q) }) { return k }
        let k = Kind(name: q)
        return k == .note ? nil : k
    }

    static func toggle(in text: String, selection: NSRange, kind: Kind = .note) -> TextEdit {
        let ns = text as NSString
        let loc = min(max(0, selection.location), ns.length)
        let sel = NSRange(location: loc, length: min(max(0, selection.length), ns.length - loc))
        // Out of the callout the caret is in: the header line goes (its title stays, as a line of
        // its own), and every line loses its `> `.
        if ns.length > 0 {
            let found = lines(in: ns, range: NSRange(location: 0, length: ns.length))
            func line(at i: Int) -> NSRange { ns.lineRange(for: NSRange(location: i, length: 0)) }
            var head = line(at: loc).location
            if let here = found[head] {
                var isFirst = here.first
                while !isFirst, head > 0, let l = found[line(at: head - 1).location] {
                    head = line(at: head - 1).location
                    isFirst = l.first
                }
                var block: [NSRange] = []
                var at = head
                while at < ns.length, let l = found[at] {
                    let r = line(at: at)
                    block.append(r)
                    at = NSMaxRange(r)
                    if l.last { break }
                }
                func content(_ r: NSRange) -> String {
                    var s = ns.substring(with: r)
                    while s.hasSuffix("\n") { s.removeLast() }
                    return s
                }
                var kept = block.dropFirst().map { r -> String in
                    let s = content(r)
                    return (s as NSString).substring(from: quotePrefix(s) ?? 0)
                }
                let header = found[head]?.header
                if let title = header?.title { kept.insert(title, at: 0) }
                let whole = NSRange(location: head, length: NSMaxRange(block.last!) - head)
                var target = whole
                if ns.substring(with: whole).hasSuffix("\n") { target.length -= 1 }
                let replacement = kept.joined(separator: "\n")
                return TextEdit(range: target, replacement: replacement, caret: target.location + (replacement as NSString).length)
            }
        }

        let lineRange = ns.length == 0 ? NSRange(location: 0, length: 0) : ns.lineRange(for: sel)
        var content = lineRange
        if content.length > 0, ns.character(at: NSMaxRange(content) - 1) == 0x0A { content.length -= 1 }
        let written = ns.substring(with: content)
        if written.trimmingCharacters(in: .whitespaces).isEmpty {
            let body = "> [!\(kind.rawValue)]\n> "
            return TextEdit(range: content, replacement: body, caret: content.location + (body as NSString).length)
        }
        let quoted = written.components(separatedBy: "\n").map { l in quotePrefix(l) != nil ? l : (l.isEmpty ? ">" : "> " + l) }
        let body = "> [!\(kind.rawValue)]\n" + quoted.joined(separator: "\n")
        return TextEdit(range: content, replacement: body, caret: content.location + (body as NSString).length)
    }
}

/// What a callout line draws: its panel, and on the header line the symbol and, when the line has
/// no title of its own, the type's name.
struct CalloutLook: Equatable {
    var tone: Callouts.Tone
    var symbol: String?
    /// Drawn after the symbol when the header has no title written.
    var title: String?
}

extension MarkdownStyler {
    /// Room inside a callout's panel: from its sides to the text, and above and below the text.
    static var calloutPad: CGFloat { (EditorMetrics.body * 0.95).rounded() }
    static var calloutPadY: CGFloat { (EditorMetrics.body * 0.6).rounded() }
    /// The symbol's box on the title line, and the gap after it.
    static var calloutIcon: CGFloat { (EditorMetrics.body * 1.15).rounded() }
    static var calloutIconGap: CGFloat { (EditorMetrics.body * 0.45).rounded() }

    var calloutTitleFont: PFont { .systemFont(ofSize: bodySize, weight: .bold) }

    /// One line of a callout: its `> ` (and `[!type]`) hidden, or dimmed on the caret's line; the
    /// header's title bold in the callout's colour; the text inset in its panel.
    func styleCallout(_ c: Callouts.Line, lineRange: NSRange, enclosing: NSRange, storage: NSTextStorage, active: Bool) {
        let pad = Self.calloutPad
        let prefix = NSRange(location: lineRange.location, length: min(c.prefixLength, lineRange.length))
        let rest = NSRange(location: NSMaxRange(prefix), length: lineRange.length - prefix.length)
        let header = c.header
        let iconRoom = header != nil && !active ? Self.calloutIcon + Self.calloutIconGap : 0
        let lead = pad + iconRoom
        if active {
            storage.addAttributes([.foregroundColor: PColor.paneTertiary], range: prefix)
        } else if prefix.length > 0 {
            // Clear, in the body face (so a header with no title keeps a line's height and baseline
            // for the drawn title), kerned so the text starts inside the panel.
            let font = header != nil ? calloutTitleFont : bodyFont
            let natural = ns(storage).substring(with: prefix).size(withAttributes: [.font: font]).width
            storage.addAttributes([.font: font, .foregroundColor: PColor.clear,
                                   .kern: (lead - natural) / CGFloat(prefix.length)], range: prefix)
        }
        if header != nil, rest.length > 0 {
            storage.enumerateAttribute(.font, in: rest) { v, sub, _ in
                guard let f = v as? PFont, f.pointSize > 1 else { return }
                storage.addAttribute(.font, value: f.with(.paneBold), range: sub)
            }
            storage.enumerateAttribute(.link, in: rest) { link, sub, _ in
                if link == nil { storage.addAttribute(.foregroundColor, value: c.kind.tone.ink, range: sub) }
            }
        }
        let look = CalloutLook(tone: c.kind.tone,
                               symbol: header != nil && !active ? c.kind.symbol : nil,
                               title: header != nil && !active && header?.title == nil ? header?.shownTitle : nil)
        storage.addAttribute(.paneLine, value: LineDecoration(.callout(look, first: c.first, last: c.last)), range: enclosing)
        let p = (storage.attribute(.paragraphStyle, at: lineRange.location, effectiveRange: nil) as? NSParagraphStyle)?.mutableCopy() as? NSMutableParagraphStyle ?? baseParagraph()
        p.firstLineHeadIndent = active ? pad : 0
        p.headIndent = active ? pad : lead
        p.tailIndent = -pad
        p.paragraphSpacingBefore = c.first ? Self.calloutPadY : 0
        p.paragraphSpacing = c.last ? Self.calloutPadY : (c.first ? 2 : 0)
        storage.addAttribute(.paragraphStyle, value: p, range: enclosing)
    }

    private func ns(_ storage: NSTextStorage) -> NSString { storage.string as NSString }
}

extension DecoratedLayoutFragment {
    /// A callout header's icon, in this fragment's coordinates: a click opens the type menu.
    /// Nil on other lines, and while the header is being edited (its `[!type]` shows instead).
    func calloutIconRect() -> CGRect? {
        guard let d = decoration, case .callout(let look, let first, _) = d.kind, first, look.symbol != nil,
              let line = textLineFragments.first else { return nil }
        let font = PFont.systemFont(ofSize: EditorMetrics.body, weight: .bold)
        let mid = line.typographicBounds.minY + line.glyphOrigin.y - font.capHeight / 2
        let size = MarkdownStyler.calloutIcon
        return CGRect(x: -layoutFragmentFrame.minX + MarkdownStyler.calloutPad, y: mid - size / 2, width: size, height: size)
    }

    private var calloutColumnWidth: CGFloat {
        let w = textLayoutManager?.textContainer?.size.width ?? layoutFragmentFrame.width
        let pad = textLayoutManager?.textContainer?.lineFragmentPadding ?? 0
        return max(w - pad * 2, layoutFragmentFrame.width)
    }

    /// The panel's fill: the tone's hue mixed into the page, solid.
    static func calloutFill(_ tone: Callouts.Tone) -> CGColor {
        #if os(iOS)
        let page = PColor.panePage.resolvedColor(with: .current)
        let dark = UITraitCollection.current.userInterfaceStyle == .dark
        #else
        let page = PColor.panePage.usingColorSpace(.sRGB) ?? .white
        let dark = NSAppearance.currentDrawing().bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        #endif
        var (pr, pg, pb, pa) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        page.getRed(&pr, green: &pg, blue: &pb, alpha: &pa)
        let ir = CGFloat((tone.hue >> 16) & 0xFF) / 255, ig = CGFloat((tone.hue >> 8) & 0xFF) / 255, ib = CGFloat(tone.hue & 0xFF) / 255
        let t = dark ? Callouts.Tone.fillDark : Callouts.Tone.fillLight
        return PColor(red: pr + (ir - pr) * t, green: pg + (ig - pg) * t, blue: pb + (ib - pb) * t, alpha: 1).cgColor
    }

    /// A callout line's share of the panel, and the header's symbol and drawn title.
    func drawCallout(_ look: CalloutLook, first: Bool, last: Bool, at o: CGPoint, in ctx: CGContext) {
        let h = layoutFragmentFrame.height
        // Inner edges reach 1 pt into the next line so neighbouring lines join with no seam.
        let top: CGFloat = first ? 0 : -1
        // The note's last line gets no paragraph spacing from TextKit: the panel's bottom room is
        // drawn past it.
        let ends = (textElement as? NSTextParagraph)?.attributedString.string.hasSuffix("\n") ?? true
        let bottom: CGFloat = last ? (ends ? 0 : -MarkdownStyler.calloutPadY) : -1
        let rect = CGRect(x: o.x - layoutFragmentFrame.minX, y: o.y + top, width: calloutColumnWidth, height: h - top - bottom)
        let r: CGFloat = 10
        let path = CGMutablePath()
        let rt = first ? r : 0, rb = last ? r : 0
        path.move(to: CGPoint(x: rect.minX + rt, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - rt, y: rect.minY))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY), tangent2End: CGPoint(x: rect.maxX, y: rect.minY + rt), radius: rt)
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - rb))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY), tangent2End: CGPoint(x: rect.maxX - rb, y: rect.maxY), radius: rb)
        path.addLine(to: CGPoint(x: rect.minX + rb, y: rect.maxY))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY), tangent2End: CGPoint(x: rect.minX, y: rect.maxY - rb), radius: rb)
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + rt))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY), tangent2End: CGPoint(x: rect.minX + rt, y: rect.minY), radius: rt)
        path.closeSubpath()
        ctx.addPath(path)
        ctx.setFillColor(Self.calloutFill(look.tone))
        ctx.fillPath()

        guard look.symbol != nil || look.title != nil, let line = textLineFragments.first else { return }
        let font = PFont.systemFont(ofSize: EditorMetrics.body, weight: .bold)
        let baseline = line.typographicBounds.minY + line.glyphOrigin.y
        let mid = baseline - font.capHeight / 2
        let x = rect.minX + MarkdownStyler.calloutPad
        let inkColor = Self.resolved(look.tone.ink)
        if let symbol = look.symbol {
            Self.drawSymbol(symbol, color: inkColor, center: CGPoint(x: x + MarkdownStyler.calloutIcon / 2, y: o.y + mid), size: EditorMetrics.body * 0.95, in: ctx)
        }
        if let title = look.title {
            let text = NSAttributedString(string: title, attributes: [.font: font, .foregroundColor: inkColor])
            Self.draw(text, at: CGPoint(x: x + MarkdownStyler.calloutIcon + MarkdownStyler.calloutIconGap, y: o.y + baseline - font.ascender), in: ctx)
        }
    }

    /// A dynamic colour as it is in the appearance being drawn.
    static func resolved(_ c: PColor) -> PColor {
        #if os(iOS)
        c.resolvedColor(with: .current)
        #else
        PColor(cgColor: c.cgColor) ?? c
        #endif
    }

    /// An SF Symbol in one colour, centred on `center`.
    static func drawSymbol(_ name: String, color: PColor, center: CGPoint, size: CGFloat, in ctx: CGContext) {
        #if os(iOS)
        let config = UIImage.SymbolConfiguration(pointSize: size, weight: .semibold)
        guard let image = UIImage(systemName: name, withConfiguration: config)?.withTintColor(color, renderingMode: .alwaysOriginal) else { return }
        let s = image.size
        UIGraphicsPushContext(ctx)
        image.draw(in: CGRect(x: center.x - s.width / 2, y: center.y - s.height / 2, width: s.width, height: s.height))
        UIGraphicsPopContext()
        #else
        // Monochrome, as a template tinted by hand: a palette colour fills a symbol's cut-outs too
        // (the i of info.circle.fill).
        let config = NSImage.SymbolConfiguration(pointSize: size, weight: .semibold)
        guard let symbol = NSImage(systemSymbolName: name, accessibilityDescription: nil)?.withSymbolConfiguration(config) else { return }
        let s = symbol.size
        let image = NSImage(size: s, flipped: false) { r in
            symbol.draw(in: r)
            color.set()
            r.fill(using: .sourceAtop)
            return true
        }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
        image.draw(in: CGRect(x: center.x - s.width / 2, y: center.y - s.height / 2, width: s.width, height: s.height),
                   from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
        NSGraphicsContext.restoreGraphicsState()
        #endif
    }
}

#if os(macOS)
/// A row of a callout's type menu: the type and the callout it changes.
final class CalloutMenuItem: NSMenuItem {
    var kind: Callouts.Kind?
    var line = 0
}
#endif
