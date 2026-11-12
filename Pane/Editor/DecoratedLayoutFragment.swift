import Foundation
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// Draws a line's decoration (checkbox, bullet, quote bar, code or table panel)
/// behind its text. One markdown line is one TextKit paragraph.
final class DecoratedLayoutFragment: NSTextLayoutFragment {
    var decoration: LineDecoration? {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 0 else { return nil }
        return p.attributedString.attribute(.paneLine, at: 0, effectiveRange: nil) as? LineDecoration
    }

    private var containerWidth: CGFloat {
        let w = textLayoutManager?.textContainer?.size.width ?? layoutFragmentFrame.width
        let pad = textLayoutManager?.textContainer?.lineFragmentPadding ?? 0
        return max(w - pad * 2, layoutFragmentFrame.width)
    }

    /// 24% amber over the page (scaled by `strength` while a live tint comes and goes), as an
    /// opaque colour: neighbouring lines may overlap by a pixel, and a translucent fill would show
    /// that as a darker seam. The accent bar blends from the page to full amber the same way.
    /// How much amber the changed lines take over the page.
    nonisolated(unsafe) static var tintAmount: CGFloat = 0.24

    /// `color`: the AI's own, while its edit is marked (ChangeTint.color); else the app's accent.
    static var pageIsDark: Bool {
        #if os(iOS)
        let page = PColor.panePage.resolvedColor(with: .current)
        #else
        let page = PColor.panePage.usingColorSpace(.sRGB) ?? .white
        #endif
        var (r, g, b, a) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        page.getRed(&r, green: &g, blue: &b, alpha: &a)
        return (r * 0.299 + g * 0.587 + b * 0.114) < 0.5
    }

    private static func changeColors(_ strength: CGFloat, color: PColor? = nil) -> (tint: CGColor, bar: CGColor) {
        let base = color ?? PColor.paneAccent
        #if os(iOS)
        let page = PColor.panePage.resolvedColor(with: .current)
        let accent = base.resolvedColor(with: .current)
        #else
        let page = PColor.panePage.usingColorSpace(.sRGB) ?? .white
        let accent = base.usingColorSpace(.sRGB) ?? base
        #endif
        var (pr, pg, pb, pa) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        var (ar, ag, ab, aa) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        page.getRed(&pr, green: &pg, blue: &pb, alpha: &pa)
        accent.getRed(&ar, green: &ag, blue: &ab, alpha: &aa)
        func mix(_ t: CGFloat) -> CGColor { PColor(red: pr + (ar - pr) * t, green: pg + (ag - pg) * t, blue: pb + (ab - pb) * t, alpha: 1).cgColor }
        // On a dark page the same share of amber reads as mud brown: less of it there.
        let dark = (pr * 0.299 + pg * 0.587 + pb * 0.114) < 0.5
        // An AI's own colour (green, blue) is darker than amber and needs more to show; too little
        // and Claude's orange reads as a brown stain (council r1, r2).
        // Round 5 halved it and it nearly vanished on black (council r7): as strong as the table's tint.
        let onDark: CGFloat = color == nil ? 0.7 : 1.6
        return (mix(Self.tintAmount * (dark ? onDark : 1) * strength), mix(min(1, strength)))
    }

    /// `a` moved `t` of the way to `b` (both resolved for the current look).
    static func blend(_ a: PColor, _ b: PColor, _ t: CGFloat) -> CGColor {
        #if os(iOS)
        let x = a.resolvedColor(with: .current), y = b.resolvedColor(with: .current)
        #else
        let x = a.usingColorSpace(.sRGB) ?? a, y = b.usingColorSpace(.sRGB) ?? b
        #endif
        var (r1, g1, b1, a1) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        var (r2, g2, b2, a2) = (CGFloat(0), CGFloat(0), CGFloat(0), CGFloat(0))
        x.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        y.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        return PColor(red: r1 + (r2 - r1) * t, green: g1 + (g2 - g1) * t, blue: b1 + (b2 - b1) * t, alpha: 1).cgColor
    }

    /// Where this paragraph starts in the text, and the editor's tint for AI changes.
    private var tintAndOffset: (ChangeTint, Int)? {
        guard let tlm = textLayoutManager, let tint = (tlm.delegate as? DecoratingLayoutDelegate)?.tint, !tint.ranges.isEmpty || !tint.removals.isEmpty,
              let tcm = tlm.textContentManager, let start = textElement?.elementRange?.location else { return nil }
        return (tint, tcm.offset(from: tcm.documentRange.location, to: start))
    }

    /// In version history, a line that differs from the note as it is now (`.paneChanged`).
    private var markedChanged: Bool {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length > 0 else { return false }
        return p.attributedString.attribute(.paneChanged, at: 0, effectiveRange: nil) != nil
    }

    /// Changed by an AI connection just now, or different in version history: how strongly
    /// to tint it, 0 for not at all.
    private var highlight: CGFloat {
        if markedChanged { return 1 }
        if !ChangeHighlight.lines.isEmpty, let p = textElement as? NSTextParagraph {
            return ChangeHighlight.matches(p.attributedString.string) ? 1 : 0
        }
        guard let (tint, offset) = tintAndOffset else { return 0 }
        return tint.strength(at: offset)
    }

    /// Room for the tint while the line is one of the changed ones, even at zero, so the last
    /// frame of the fade paints over the band.
    private var highlighted: Bool {
        if markedChanged { return true }
        if !ChangeHighlight.lines.isEmpty { return highlight > 0 }
        guard let (tint, offset) = tintAndOffset else { return false }
        return tint.covers(offset)
    }

    override var renderingSurfaceBounds: CGRect {
        // A heading's chevron sits in the margin (HeadingFolds).
        var base = super.renderingSurfaceBounds.union(foldSurface)
        // The seam mark sits in the margin, like a heading's chevron.
        if let (gap, _) = removalMark { base = base.union(removalRect(gap, at: .zero).insetBy(dx: -2, dy: -2)) }
        guard decoration != nil || highlighted || hasDates else { return base }
        let left = -layoutFragmentFrame.minX
        let lead = highlighted ? Self.changeLead : 4
        return base.union(CGRect(x: left - lead, y: -14, width: containerWidth + lead + 4, height: layoutFragmentFrame.height + 28))
    }

    /// Vertical center of the first line's text, for markers.
    private var firstLineMidY: CGFloat {
        guard let line = textLineFragments.first else { return layoutFragmentFrame.height / 2 }
        let b = line.typographicBounds
        return b.minY + (b.height - EditorMetrics.lineSpacing) / 2
    }

    /// Where a checkbox centres: halfway up the capitals, on the text's own baseline,
    /// so the circle sits level with the words whatever the line spacing.
    private var checkMidY: CGFloat {
        guard let line = textLineFragments.first else { return firstLineMidY }
        let font = PFont.systemFont(ofSize: EditorMetrics.body)
        return line.typographicBounds.minY + line.glyphOrigin.y - font.capHeight / 2
    }

    /// Where a bullet or dash centres: halfway up the lowercase letters, measured from the
    /// text's own baseline (the line box's middle sits above them, by the descender).
    private var bulletMidY: CGFloat {
        guard let line = textLineFragments.first else { return firstLineMidY }
        let font = PFont.systemFont(ofSize: EditorMetrics.body)
        return line.typographicBounds.minY + line.glyphOrigin.y - font.xHeight / 2
    }

    /// The quote bar, in this fragment's coordinates: from the top of the first line's letters to
    /// the foot of the last line's, plus half the line spacing each side, so it's centred on the text
    /// (Emil, 4 November 2026: the bar ran the whole fragment, line spacing included, and sat high).
    func quoteBarRect() -> CGRect {
        let fallback = CGRect(x: 2, y: 1, width: 3, height: max(0, layoutFragmentFrame.height - 2))
        guard let first = textLineFragments.first, let last = textLineFragments.last,
              let p = textElement as? NSTextParagraph else { return fallback }
        // The text's own font: the largest in the paragraph. The first character is the hidden
        // "> ", in a tiny font, and the bar measured from it was a dot (council round 15).
        let whole = p.attributedString
        var font = PFont.systemFont(ofSize: EditorMetrics.body)
        var largest: CGFloat = 0
        whole.enumerateAttribute(.font, in: NSRange(location: 0, length: whole.length)) { value, _, _ in
            if let f = value as? PFont, f.pointSize > largest { largest = f.pointSize; font = f }
        }
        let top = first.typographicBounds.minY + first.glyphOrigin.y - font.ascender
        let bottom = last.typographicBounds.minY + last.glyphOrigin.y - font.descender
        guard bottom > top else { return fallback }
        let pad = EditorMetrics.lineSpacing / 2
        return CGRect(x: 2, y: top - pad, width: 3, height: bottom - top + pad * 2)
    }

    /// The checklist circle, in this fragment's coordinates.
    func checkboxRect(_ d: LineDecoration) -> CGRect {
        let size = EditorMetrics.checkSize
        return CGRect(x: d.markerX - size / 2, y: checkMidY - size / 2, width: size, height: size)
    }

    /// Notes' checklist circle: a light grey hairline ring, or a filled accent disc with a white tick.
    /// Draws text into the fragment's (flipped) context.
    static func draw(_ text: NSAttributedString, at point: CGPoint, in ctx: CGContext) {
        #if os(macOS)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: true)
        text.draw(at: point)
        NSGraphicsContext.restoreGraphicsState()
        #else
        UIGraphicsPushContext(ctx)
        text.draw(at: point)
        UIGraphicsPopContext()
        #endif
    }

    static func drawCheckbox(checked: Bool, in rect: CGRect, ctx: CGContext, fill: CGColor? = nil) {
        if checked {
            ctx.setFillColor(fill ?? PColor.paneAccent.cgColor)
            ctx.fillEllipse(in: rect)
            let s = rect.width
            // The tick of SF Symbols' checkmark.circle.fill: short arm, long arm, round caps.
            ctx.setStrokeColor(CheckTick.color.cgColor)
            ctx.setLineWidth(s * 0.1)
            ctx.setLineCap(.round)
            ctx.setLineJoin(.round)
            ctx.move(to: CGPoint(x: rect.minX + s * 0.29, y: rect.minY + s * 0.51))
            ctx.addLine(to: CGPoint(x: rect.minX + s * 0.44, y: rect.minY + s * 0.66))
            ctx.addLine(to: CGPoint(x: rect.minX + s * 0.715, y: rect.minY + s * 0.355))
            ctx.strokePath()
        } else {
            let w = EditorMetrics.checkStroke
            ctx.setStrokeColor((EditorMetrics.increasedContrast ? PColor.paneSecondary : PColor.paneCheckRing).cgColor)
            ctx.setLineWidth(w)
            ctx.strokeEllipse(in: rect.insetBy(dx: w / 2, dy: w / 2))
        }
    }

    /// How far a changed line's band starts before the text: the 3 pt bar, then 9 pt clear.
    static let changeLead: CGFloat = 12
    static let changeBar: CGFloat = 3
    /// The highlight's padding around the words, and its corners.
    // Two points each side: the spaces either side of a marked word stay clear (council r1).
    static let changePad = CGSize(width: 2, height: 1)
    /// The tick in the margin beside changed lines: 2 pt wide, 8 pt left of the text, as tall as
    /// the changed lines. So the change isn't marked by colour alone, and a long note can be
    /// scanned down its edge (round 14 of the UI council: the marker lost the old margin bar).
    static let tickWidth: CGFloat = 2
    static let tickGap: CGFloat = 8

    /// The tick for these runs, `textLeft` being where the text column starts; nil without runs.
    static func tick(for runs: [CGRect], textLeft: CGFloat) -> CGRect? {
        guard let top = runs.map(\.minY).min(), let bottom = runs.map(\.maxY).max() else { return nil }
        return CGRect(x: textLeft - tickGap - tickWidth, y: top, width: tickWidth, height: bottom - top)
    }
    static let changeRadius: CGFloat = 5

    /// One rounded run per laid-out line, around its words (trailing spaces and the newline left
    /// out), in the drawing context's coordinates.
    /// A removal an AI just made next to this paragraph, and how strongly to draw its mark.
    var removalMark: (ChangeTint.Removal, CGFloat)? {
        guard let (tint, offset) = tintAndOffset else { return nil }
        return tint.removal(at: offset)
    }

    /// Where lines were taken out: a short solid line in the AI's colour, in the seam above this
    /// paragraph (below it at the note's end), from where the text starts. It used to sit 11 pt
    /// up, which in a checklist is on the line above (Emil's scenarios, 12 November 2026).
    /// Council r1: it read as an underline of the line above, starting under the checkbox. Now it
    /// starts where the words do and sits halfway between the line above and this one's letters.
    func removalRect(_ gap: ChangeTint.Removal, at point: CGPoint) -> CGRect {
        let line = gap.below ? textLineFragments.last : textLineFragments.first
        // In the margin left of the line, out of the text column, so it can't read as an
        // underline of the words above (council r3, both judges).
        let left = point.x + (line?.typographicBounds.minX ?? 0)
        var width = Self.removalWidth
        var x = left - Self.removalGap - width
        // Left of a checklist's circles too: in their column it read as a cap or an underline
        // on the circle next to it (council r5).
        if let d = decoration, case .checkbox = d.kind { x = point.x + checkboxRect(d).minX - Self.removalGap - width }
        _ = width
        let y: CGFloat
        if gap.below || line == nil {
            // Under the last line's letters, a descender's depth down.
            let b = line?.typographicBounds ?? CGRect(x: 0, y: 0, width: 0, height: layoutFragmentFrame.height)
            y = point.y + b.maxY + 6
        } else if let line {
            // The line above's letters end a little over this fragment's top and this line's
            // capitals start below it: the top is the middle of the seam (council r2: 2 pt down
            // read as an overline, 3 pt up as an underline of the line above).
            y = point.y + line.typographicBounds.minY - 2
        } else { y = point.y }
        return CGRect(x: x, y: y - 1.25, width: width, height: 2.5)
    }

    static let removalWidth: CGFloat = 11
    static let removalGap: CGFloat = 5

    /// The runs as one shape: each line rounded, and the space between two lines of the
    /// paragraph filled where they overlap, so a wrapped paragraph reads as one block like a text
    /// selection, not a stack of separate pills (Emil, 12 November 2026).
    func changeShape(at point: CGPoint) -> CGPath { Self.shape(for: [changeRuns(at: point)]) }

    /// Each group's runs rounded, and the space between two lines of one group filled where they
    /// overlap, so a wrapped phrase reads as one block like a text selection.
    static func shape(for groups: [[CGRect]]) -> CGPath {
        let path = CGMutablePath()
        for runs in groups {
            for r in runs { path.addRoundedRect(in: r, cornerWidth: changeRadius, cornerHeight: changeRadius) }
            for (a, b) in zip(runs, runs.dropFirst()) {
                let left = max(a.minX, b.minX), right = min(a.maxX, b.maxX)
                guard right > left, b.minY > a.minY else { continue }
                path.addRect(CGRect(x: left, y: a.midY, width: right - left, height: b.midY - a.midY))
            }
        }
        return path
    }

    /// The groups of runs to tint: the AI's marked words, or the whole paragraph in version history
    /// and captures.
    func changeGroups(at point: CGPoint) -> [[CGRect]] {
        if markedChanged || !ChangeHighlight.lines.isEmpty { return [changeRuns(at: point)] }
        guard let (tint, offset) = tintAndOffset, let p = textElement as? NSTextParagraph else { return [] }
        return tint.marks(in: NSRange(location: offset, length: p.attributedString.length))
            .map { changeRuns(at: point, in: $0) }.filter { !$0.isEmpty }
    }

    /// The part of the runs the sweep has reached, in reading order: whole runs, then part of one.
    static func swept(_ groups: [[CGRect]], _ progress: CGFloat) -> [CGRect] {
        let runs = groups.flatMap { $0 }
        var left = runs.reduce(0) { $0 + $1.width } * progress
        var out: [CGRect] = []
        for r in runs {
            guard left > 0 else { break }
            var c = r.insetBy(dx: 0, dy: -2)
            c.size.width = min(r.width, left)
            out.append(c)
            left -= r.width
        }
        return out
    }

    func changeRuns(at point: CGPoint) -> [CGRect] {
        guard let p = textElement as? NSTextParagraph else { return [] }
        let first = ListPrefix(line: p.attributedString.string).map(\.length) ?? 0
        return changeRuns(at: point, in: NSRange(location: first, length: max(0, p.attributedString.length - first)))
    }

    /// The runs, one per laid-out line, around the words of `range` (counted from the paragraph's
    /// start): spaces at the ends and the newline left out, the list marker never in.
    func changeRuns(at point: CGPoint, in range: NSRange) -> [CGRect] {
        guard let p = textElement as? NSTextParagraph else { return [] }
        let whole = p.attributedString
        // The list marker ("- [ ] ") is drawn as the circle or bullet: the words start after it.
        let first = max(range.location, ListPrefix(line: whole.string).map(\.length) ?? 0)
        let last = min(NSMaxRange(range), whole.length)
        let text = whole.string as NSString
        return textLineFragments.compactMap { line in
            let lineRange = line.characterRange
            var from = max(lineRange.location, first)
            var end = min(lineRange.upperBound, last)
            while end > from, let c = UnicodeScalar(text.character(at: end - 1)),
                  CharacterSet.whitespacesAndNewlines.contains(c) { end -= 1 }
            while from < end, let c = UnicodeScalar(text.character(at: from)),
                  CharacterSet.whitespacesAndNewlines.contains(c) { from += 1 }
            guard end > from else { return nil }
            // The line's own letters' font, the largest on it: a heading's "# " or an italic's
            // "*" is hidden in a tiny font, and measured from it the highlight was a thin
            // underline (Emil, 12 November 2026).
            var font = PFont.systemFont(ofSize: EditorMetrics.body), largest: CGFloat = 0
            whole.enumerateAttribute(.font, in: NSRange(location: from, length: end - from)) { value, _, _ in
                if let f = value as? PFont, f.pointSize > largest { largest = f.pointSize; font = f }
            }
            // Hidden syntax ("# ", "*") at either end is not where the words start: the mark keeps
            // to the text's left edge (council r1: headings and italics started 8 pt early).
            func hidden(_ i: Int) -> Bool {
                let c = text.character(at: i)
                guard let u = UnicodeScalar(c), CharacterSet(charactersIn: "#*_~`= ").contains(u) else { return false }
                return ((whole.attribute(.font, at: i, effectiveRange: nil) as? PFont)?.pointSize ?? largest) < largest * 0.5
            }
            while from < end, hidden(from) { from += 1 }
            while end > from, hidden(end - 1) { end -= 1 }
            guard end > from else { return nil }
            // The paragraph's own indices, as for date chips: counted from the line's start, every
            // line past a wrap measured the first line's characters and got a sliver (persona r7).
            let startX = line.locationForCharacter(at: from).x
            let endX = line.locationForCharacter(at: end).x
            guard endX > startX else { return nil }
            let b = line.typographicBounds
            let baseline = b.minY + line.glyphOrigin.y
            return CGRect(x: point.x + b.minX + startX - Self.changePad.width,
                          y: point.y + baseline - font.ascender - Self.changePad.height,
                          width: endX - startX + Self.changePad.width * 2,
                          height: font.ascender - font.descender + Self.changePad.height * 2)
        }
    }

    /// How far the AI tint's sweep has reached across this paragraph (1 drawn whole).
    private var sweepProgress: CGFloat {
        guard !markedChanged, ChangeHighlight.lines.isEmpty, let (tint, offset) = tintAndOffset else { return 1 }
        return tint.sweep(at: offset)
    }

    /// Round an item an AI ticked: a disc a little larger than the box, in this fragment's drawing
    /// coordinates. Nil for any other line.
    func tickHalo(at point: CGPoint) -> CGRect? {
        guard !markedChanged, let (tint, offset) = tintAndOffset, tint.ticked(at: offset),
              let d = decoration, case .checkbox = d.kind else { return nil }
        let box = checkboxRect(d)
        return box.insetBy(dx: -Self.haloPad, dy: -Self.haloPad).offsetBy(dx: point.x, dy: point.y)
    }
    static let haloPad: CGFloat = 5

    /// The colour of the AI whose edit is marked, if known.
    private var markColor: PColor? { markedChanged ? nil : tintAndOffset?.0.color }

    /// The tick in the margin only for people who asked for more than colour (Differentiate
    /// Without Colour): the highlight alone marks the change (Emil, 12 November 2026: "why both
    /// lines and marker").
    static var showsTick: Bool {
        if let forced = tickOverride { return forced }
        #if os(iOS)
        return UIAccessibility.shouldDifferentiateWithoutColor
        #else
        return NSWorkspace.shared.accessibilityDisplayShouldDifferentiateWithoutColor
        #endif
    }
    /// Tests: the tick on or off whatever the setting.
    nonisolated(unsafe) static var tickOverride: Bool?

    override func draw(at point: CGPoint, in context: CGContext) {
        let strength = highlight
        if strength > 0 {
            // A marker-pen highlight behind the changed words, each line its own rounded run
            // (Emil, 4 November 2026: the full-width block with a bar "looks pretty cheap").
            // It hugs the text, starting a little before it, so a checklist circle stays clear.
            context.saveGState()
            let heavy = tintAndOffset?.0.heavy == true && !markedChanged
            let colors = Self.changeColors(strength * (heavy ? (Self.pageIsDark ? 0.6 : 0.75) : 1), color: markColor)
            // An earlier AI's marks, whole, each in its own colour.
            if !markedChanged, let (tint, offset) = tintAndOffset, let p = textElement as? NSTextParagraph {
                for (r, c) in tint.carried(in: NSRange(location: offset, length: p.attributedString.length)) {
                    let runs = changeRuns(at: point, in: r)
                    guard !runs.isEmpty else { continue }
                    context.setFillColor(Self.changeColors(strength, color: c).tint)
                    context.addPath(Self.shape(for: [runs]))
                    context.fillPath(using: .winding)
                }
            }
            let groups = tickHalo(at: point) == nil ? changeGroups(at: point) : []
            if let halo = tickHalo(at: point) {
                // A tick: a soft disc in the AI's colour round the box, which pops as yours does,
                // and the struck-through words stay plain (council r1).
                // The disc carries the AI's colour now the box keeps the app's (council r4): clear on a dark page too.
                context.setFillColor(Self.changeColors(strength * (Self.pageIsDark ? 1.0 : 0.6), color: markColor).tint)
                context.fillEllipse(in: halo)
            } else {
                let sweep = sweepProgress
                if sweep < 1 {
                    // The leading edge rounded like the mark's own ends (council r5: it was square).
                    let path = CGMutablePath()
                    for r in Self.swept(groups, sweep) {
                        let radius = min(r.height / 2, r.width / 2, 6)
                        path.addRoundedRect(in: r, cornerWidth: radius, cornerHeight: radius)
                    }
                    context.addPath(path)
                    context.clip()
                }
                if sweep > 0 {
                    context.setFillColor(colors.tint)
                    context.addPath(Self.shape(for: groups))
                    context.fillPath(using: .winding)
                }
            }
            let runs = groups.flatMap { $0 }
            if Self.showsTick, let tick = Self.tick(for: runs, textLeft: point.x - layoutFragmentFrame.minX) {
                context.setFillColor(colors.bar)
                context.addPath(CGPath(roundedRect: tick, cornerWidth: Self.tickWidth / 2, cornerHeight: Self.tickWidth / 2, transform: nil))
                context.fillPath()
            }
            context.restoreGState()
        }
        if let (gap, strength) = removalMark {
            context.saveGState()
            // Softer than the colour itself, like the highlights (council r5).
            context.setFillColor(Self.changeColors(strength * 0.7, color: markColor).bar)
            let r = removalRect(gap, at: point)
            context.addPath(CGPath(roundedRect: r, cornerWidth: 1, cornerHeight: 1, transform: nil))
            context.fillPath()
            context.restoreGState()
        }
        if let d = decoration {
            context.saveGState()
            drawDecoration(d, at: point, in: context)
            context.restoreGState()
        }
        if hasHighlights {
            context.saveGState()
            drawHighlights(at: point, in: context)
            context.restoreGState()
        }
        super.draw(at: point, in: context)
        if hasDates {
            context.saveGState()
            drawDates(at: point, in: context)
            context.restoreGState()
        }
        drawFold(at: point, in: context)
    }

    /// Whether the paragraph has a date chip (NoteDates).
    private var hasDates: Bool {
        guard let p = textElement as? NSTextParagraph, p.attributedString.length >= 10 else { return false }
        var found = false
        p.attributedString.enumerateAttribute(.paneDate, in: NSRange(location: 0, length: p.attributedString.length)) { v, _, stop in
            if v != nil { found = true; stop.pointee = true }
        }
        return found
    }

    /// The chips, in this fragment's coordinates, each with what it shows.
    func dateChipRects() -> [(CGRect, DateChip)] { dateChips().map { ($0.rect, $0.chip) } }

    /// The chips with their characters, counted from the paragraph's start.
    func dateChips() -> [(rect: CGRect, chip: DateChip, range: NSRange)] {
        guard let p = textElement as? NSTextParagraph else { return [] }
        let text = p.attributedString
        var out: [(rect: CGRect, chip: DateChip, range: NSRange)] = []
        text.enumerateAttribute(.paneDate, in: NSRange(location: 0, length: text.length)) { v, r, _ in
            guard let chip = v as? DateChip else { return }
            guard let line = textLineFragments.first(where: { NSLocationInRange(r.location, $0.characterRange) }) else { return }
            let x = line.typographicBounds.minX + line.locationForCharacter(at: r.location).x + DateChip.gap
            let baseline = line.typographicBounds.minY + line.glyphOrigin.y
            let f = PFont.systemFont(ofSize: chip.fontSize)
            let h = ceil(f.ascender - f.descender) + 2
            let mid = baseline - f.capHeight / 2
            out.append((CGRect(x: x, y: mid - h / 2, width: chip.chipWidth, height: h), chip, r))
        }
        return out
    }

    private func drawDates(at o: CGPoint, in ctx: CGContext) {
        for (rect, chip) in dateChipRects() {
            let r = rect.offsetBy(dx: o.x, dy: o.y)
            ctx.addPath(CGPath(roundedRect: r, cornerWidth: r.height * 0.3, cornerHeight: r.height * 0.3, transform: nil))
            ctx.setFillColor(chip.fill.cgColor)
            ctx.fillPath()
            let label = NSAttributedString(string: chip.label, attributes: [.font: chip.font, .foregroundColor: chip.ink])
            let size = label.size()
            Self.draw(label, at: CGPoint(x: r.minX + DateChip.padding, y: r.midY - size.height / 2), in: ctx)
        }
    }

    private func drawDecoration(_ d: LineDecoration, at o: CGPoint, in ctx: CGContext) {
        let h = layoutFragmentFrame.height
        switch d.kind {
        case .bullet:
            // Solid dots in the text colour, like Notes.
            let r = LineDecoration.bulletRadius
            let c = CGPoint(x: o.x + d.markerX, y: o.y + bulletMidY)
            ctx.setFillColor(PColor.paneLabel.cgColor)
            ctx.fillEllipse(in: CGRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2))

        case .dash:
            // Notes' dashed list: an en dash in the text colour, on the lowercase middle.
            let w = LineDecoration.dashWidth, t = max(1, EditorMetrics.body * 0.075)
            let c = CGPoint(x: o.x + d.markerX, y: o.y + bulletMidY)
            ctx.setFillColor(PColor.paneLabel.cgColor)
            ctx.fill(CGRect(x: c.x - w / 2, y: c.y - t / 2, width: w, height: t))

        case .checkbox(let checked):
            // An AI's tick: the box in the app's colour from the first frame, the AI's colour only
            // in the disc round it, so nothing changes colour as it fades (council r4, both).
            let fill: CGColor? = nil
            Self.drawCheckbox(checked: checked, in: checkboxRect(d).offsetBy(dx: o.x, dy: o.y), ctx: ctx, fill: fill)

        case .quote:
            let bar = quoteBarRect().offsetBy(dx: o.x, dy: o.y)
            ctx.setFillColor(PColor.paneAccent.withAlphaComponent(0.7).cgColor)
            ctx.addPath(CGPath(roundedRect: bar, cornerWidth: 1.5, cornerHeight: 1.5, transform: nil))
            ctx.fillPath()

        case .code(let first, let last, let label, let open):
            // A line that shows text at the block's edge gets the block's padding drawn past it.
            // An open edge's room is in the line's own spacing (MarkdownStyler.openEdge), not drawn past it.
            _ = open
            panel(ctx, o: o, h: h, first: first, last: last, fill: PColor.paneFill, radius: 10, stroke: nil, outside: 0)
            if let label {
                // The language, small and grey, floating in the block's top right corner, on the
                // block's colour so a long first line runs under it.
                let attrs: [NSAttributedString.Key: Any] = [.font: PFont.systemFont(ofSize: EditorMetrics.body * 0.82, weight: .medium),
                                                            .foregroundColor: PColor.paneSecondary]
                let text = NSAttributedString(string: label, attributes: attrs)
                let size = text.size()
                let at = CGPoint(x: o.x - layoutFragmentFrame.minX + containerWidth - MarkdownStyler.codePad - size.width, y: o.y + (h - size.height) / 2)
                ctx.setFillColor(PColor.paneFill.cgColor)
                ctx.fill(CGRect(x: at.x - 8, y: o.y, width: size.width + 8 + MarkdownStyler.codePad, height: h))
                Self.draw(text, at: at, in: ctx)
            }

        case .table(let header, let first, let last, let columns, let width):
            let w = min(width, containerWidth)
            if h < 3 {
                // Collapsed delimiter row: the header's bottom rule.
                ctx.setFillColor(PColor.paneSeparator.withAlphaComponent(0.6).cgColor)
                ctx.fill(CGRect(x: o.x, y: o.y, width: w, height: 1))
                break
            }
            let rect = CGRect(x: o.x, y: o.y, width: w, height: h)
            let path = roundedPath(rect, top: first ? 10 : 0, bottom: last ? 10 : 0)
            ctx.addPath(path)
            ctx.setFillColor((header ? PColor.paneFill : PColor.panePanel).cgColor)
            ctx.fillPath()
            ctx.setFillColor(PColor.paneSeparator.withAlphaComponent(0.35).cgColor)
            for x in columns where x < w {
                ctx.fill(CGRect(x: o.x + x, y: o.y + 6, width: 0.75, height: h - 12))
            }
            if !last && !header {
                ctx.fill(CGRect(x: o.x + 10, y: o.y + h - 0.5, width: w - 20, height: 0.5))
            }

        case .rule(let editing):
            // With the caret on it the dashes show, and the line starts after them instead of
            // running through them.
            let start = editing ? (textLineFragments.first.map { $0.typographicBounds.width } ?? 0) + 8 : 0
            ctx.setFillColor(PColor.paneSeparator.cgColor)
            // Level with the dashes, halfway up the lowercase letters, in both states: the line
            // box's middle sat above them, so the line ran higher than the "---" before it
            // (Emil, 8 November 2026).
            ctx.fill(CGRect(x: o.x + start, y: o.y + bulletMidY - 0.5, width: max(0, containerWidth - start), height: 1))

        case .callout(let look, let first, let last):
            drawCallout(look, first: first, last: last, at: o, in: ctx)
        }
    }

    /// A panel that joins with its neighbours: only the block's outer corners are round.
    /// How far a line's panel starts below its top and ends above its foot (negative: past it).
    /// Inner edges overlap by 1 pt: each line is its own layer, and two antialiased edges meeting
    /// at a fraction of a pixel left a light seam across the block. The overlap reaches down into
    /// the next line, never up: each line draws over the one before, and a panel reaching up
    /// painted over the foot of its letters ("greeting" read "greetina", council round 15).
    static func panelEdges(first: Bool, last: Bool, outside: CGFloat) -> (top: CGFloat, bottom: CGFloat) {
        (first ? 2 - outside : 0, last ? 2 - outside : -1)
    }

    private func panel(_ ctx: CGContext, o: CGPoint, h: CGFloat, first: Bool, last: Bool, fill: PColor, radius: CGFloat, stroke: PColor?, outside: CGFloat = 0) {
        let (top, bottom) = Self.panelEdges(first: first, last: last, outside: outside)
        // From the column's edge, not the paragraph's indent (a code line's padding).
        let rect = CGRect(x: o.x - layoutFragmentFrame.minX, y: o.y + top, width: containerWidth, height: h - top - bottom)
        ctx.addPath(roundedPath(rect, top: first ? radius : 0, bottom: last ? radius : 0))
        ctx.setFillColor(fill.cgColor)
        ctx.fillPath()
    }

    /// A rectangle with independent top and bottom corner radii.
    private func roundedPath(_ rect: CGRect, top rt: CGFloat, bottom rb: CGFloat) -> CGPath {
        let path = CGMutablePath()
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
        return path
    }
}

/// Hands out decorated fragments to TextKit.
final class DecoratingLayoutDelegate: NSObject, NSTextLayoutManagerDelegate {
    /// Lines an AI just changed, for the fragments to tint.
    let tint = ChangeTint()

    func textLayoutManager(_ textLayoutManager: NSTextLayoutManager, textLayoutFragmentFor location: any NSTextLocation, in textElement: NSTextElement) -> NSTextLayoutFragment {
        DecoratedLayoutFragment(textElement: textElement, range: textElement.elementRange)
    }
}
