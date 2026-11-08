import SwiftUI
#if os(macOS)
import AppKit
#endif

/// Amber Notes' terms and privacy policy, on the share site.
enum Legal {
    static let terms = URL(string: "https://pintonotes.com/terms")!
    static let privacy = URL(string: "https://pintonotes.com/privacy")!

    /// "By continuing, you agree to the Terms of Service and Privacy Policy." with both names as links.
    static var consentSentence: AttributedString {
        var s = AttributedString("By continuing, you agree to the ")
        var t = AttributedString("Terms of Service"); t.link = terms
        var p = AttributedString("Privacy Policy"); p.link = privacy
        s += t; s += AttributedString(" and "); s += p; s += AttributedString(".")
        return underliningLinks(s)
    }

    /// The Mac's sign-in card: the same sentence, broken after "the" so the two names share the
    /// second line (council round 10: "Privacy Policy." sat alone on it).
    static var consentLines: AttributedString {
        var s = AttributedString("By continuing, you agree to the\n")
        var t = AttributedString("Terms of Service"); t.link = terms
        var p = AttributedString("Privacy Policy"); p.link = privacy
        s += t; s += AttributedString(" and "); s += p; s += AttributedString(".")
        return underliningLinks(s)
    }

    /// Links inside a sentence are underlined on iPhone, where there's no pointer to show them.
    /// On the Mac the label underlines a link while the pointer is on it (LinkLabel.View).
    static func underliningLinks(_ text: AttributedString) -> AttributedString {
        var text = text
        for run in text.runs where run.link != nil { text[run.range].underlineStyle = .single }
        return text
    }
}

extension Legal {
    /// "By continuing you agree to the Terms and Privacy Policy.", both names links: the short form
    /// under the welcome note.
    static var shortConsent: AttributedString {
        var s = AttributedString("By continuing you agree to the ")
        var t = AttributedString("Terms"); t.link = terms
        var p = AttributedString("Privacy Policy"); p.link = privacy
        s += t; s += AttributedString(" and "); s += p; s += AttributedString(".")
        return underliningLinks(s)
    }
}

/// The quiet lines under the sign-in form: the terms and privacy policy, with their two links, then
/// what the app reports about itself (DiagnosticsCopy). One paragraph for VoiceOver.
struct ConsentFooter: View {
    /// The small print's size on the Mac.
    static let size: CGFloat = 12
    /// The small print's column on the sign-in card, as measured on the Air (council round 9),
    /// 30 pt wider with the card since it went to 12 pt (round 14), so it stays four lines.
    static let column: CGFloat = 272
    /// What it sends, then what it never sends and how to stop it.
    static let diagnosticsLines = DiagnosticsCopy.signIn.replacingOccurrences(of: "counts. ", with: "counts.\n")
    var body: some View {
        #if os(macOS)
        // AppKit's label: the pointer turns to a hand over each link, which SwiftUI's Text
        // doesn't do for links inside a sentence (Emil, 2 November 2026).
        // Two short paragraphs, not one block of three lines (council round 6, 11-04): the
        // terms, then what the app sends about itself.
        // 12 pt: 10 pt footnote read as miniature (council round 7), 11 pt still small beside
        // the form (round 14).
        VStack(spacing: 6) {
            LinkLabel(text: Legal.consentLines)
                .frame(maxWidth: .infinity)
            // Its two sentences on their own lines: at 11 pt the line broke after "never your".
            Text(ConsentFooter.diagnosticsLines)
                .font(.system(size: ConsentFooter.size))
                .foregroundStyle(Color.muted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("signin.diagnostics")
        }
        .padding(.vertical, 4)
        .accessibilityIdentifier("signin.legal")
        #else
        Text(Legal.consentSentence + AttributedString(" " + DiagnosticsCopy.signIn))
            .font(.footnote)
            .foregroundStyle(Color.muted)
            .tint(Color(Palette.amberInk))
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4) // a taller tap area for the links
            .accessibilityIdentifier("signin.legal")
        #endif
    }
}

#if os(macOS)
/// A small centred paragraph with links in it, drawn by AppKit so the pointer becomes a hand
/// over a link and a link opens on the first click. Footnote size, muted, links in the accent, underlined under the pointer.
struct LinkLabel: NSViewRepresentable {
    let text: AttributedString
    var style: Style = .footer

    /// How the paragraph reads: the sign-in card's centred small print, or a line in Settings
    /// that starts at the left with its links in the text's own ink (Help's GitHub line).
    struct Style: Equatable {
        var alignment: NSTextAlignment
        var size: CGFloat
        var link: NSColor
        var linkWeight: NSFont.Weight
        @MainActor static let footer = Style(alignment: .center, size: ConsentFooter.size, link: Palette.amberInk, linkWeight: .regular)
        @MainActor static let settings = Style(alignment: .left, size: 12, link: .labelColor, linkWeight: .semibold)
    }

    /// A read-only text view: it follows a link on the first click, even with the window in the
    /// background (a selectable label took one click to wake up first), and shows the hand.
    /// A link is underlined while the pointer is on it, like the card's other links ("Forgot
    /// password?", HoverTextButtonStyle), not all the time (Emil, 11-03).
    final class View: NSTextView {
        override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

        // MARK: Keyboard: Tab reaches each link (council rounds 7 and 8: none took focus)

        /// Only with keyboard navigation on (System Settings › Keyboard), as for the card's buttons;
        /// a click never leaves the paragraph focused.
        override var acceptsFirstResponder: Bool { keyboardNavigation() }
        var keyboardNavigation: () -> Bool = { NSApp.isFullKeyboardAccessEnabled }
        override var canBecomeKeyView: Bool { acceptsFirstResponder }

        /// The links' ranges, in reading order.
        var links: [NSRange] {
            guard let storage = textStorage else { return [] }
            var out: [NSRange] = []
            storage.enumerateAttribute(.link, in: NSRange(location: 0, length: storage.length)) { v, r, _ in if v != nil { out.append(r) } }
            return out
        }
        /// The link the keyboard is on, while the paragraph has focus.
        private(set) var focused: Int?
        /// Opens a link; NSWorkspace in the app, a recorder in tests.
        var opener: (URL) -> Void = { NSWorkspace.shared.open($0) }

        override func becomeFirstResponder() -> Bool {
            guard super.becomeFirstResponder(), !links.isEmpty else { return false }
            let back = NSApp.currentEvent.map { $0.type == .keyDown && $0.modifierFlags.contains(.shift) } ?? false
            focus(back ? links.count - 1 : 0)
            return true
        }

        override func resignFirstResponder() -> Bool {
            focus(nil)
            return super.resignFirstResponder()
        }

        func focus(_ index: Int?) {
            focused = index
            noteFocusRingMaskChanged()
            needsDisplay = true
        }

        /// Tab to the next link, or on past the last; Shift-Tab back; Return or Space opens it.
        override func keyDown(with event: NSEvent) {
            guard let i = focused else { return super.keyDown(with: event) }
            switch event.keyCode {
            case 48 where event.modifierFlags.contains(.shift):
                if i > 0 { focus(i - 1) } else { window?.selectPreviousKeyView(self) }
            case 48:
                if i < links.count - 1 { focus(i + 1) } else { window?.selectNextKeyView(self) }
            case 36, 76, 49:
                openFocused()
            default:
                super.keyDown(with: event)
            }
        }

        func openFocused() {
            guard let i = focused, i < links.count, let storage = textStorage else { return }
            let value = storage.attribute(.link, at: links[i].location, effectiveRange: nil)
            if let url = (value as? URL) ?? (value as? String).flatMap(URL.init(string:)) { opener(url) }
        }

        /// The focused link's own rect, for the system's focus ring.
        func rect(ofLink index: Int) -> NSRect {
            guard index < links.count, let layout = layoutManager, let container = textContainer else { return .zero }
            let glyphs = layout.glyphRange(forCharacterRange: links[index], actualCharacterRange: nil)
            return layout.boundingRect(forGlyphRange: glyphs, in: container)
                .offsetBy(dx: textContainerOrigin.x, dy: textContainerOrigin.y).insetBy(dx: -2, dy: -1)
        }
        override var focusRingMaskBounds: NSRect { focused.map(rect(ofLink:)) ?? .zero }
        override func drawFocusRingMask() {
            guard let i = focused else { return }
            NSBezierPath(roundedRect: rect(ofLink: i), xRadius: 3, yRadius: 3).fill()
        }

        /// The link under the pointer, underlined.
        private(set) var hovered: NSRange?

        override func updateTrackingAreas() {
            super.updateTrackingAreas()
            trackingAreas.filter { $0.owner === self }.forEach(removeTrackingArea)
            addTrackingArea(NSTrackingArea(rect: bounds, options: [.mouseMoved, .mouseEnteredAndExited, .activeAlways, .inVisibleRect],
                                           owner: self))
        }

        override func mouseMoved(with event: NSEvent) {
            super.mouseMoved(with: event)
            hover(at: convert(event.locationInWindow, from: nil))
        }

        override func mouseExited(with event: NSEvent) {
            super.mouseExited(with: event)
            hover(at: nil)
        }

        /// The link at `point` (in the view), or none.
        func link(at point: NSPoint) -> NSRange? {
            guard let layout = layoutManager, let container = textContainer, let storage = textStorage, storage.length > 0 else { return nil }
            let inText = NSPoint(x: point.x - textContainerOrigin.x, y: point.y - textContainerOrigin.y)
            var fraction: CGFloat = 0
            let glyph = layout.glyphIndex(for: inText, in: container, fractionOfDistanceThroughGlyph: &fraction)
            // Only on the glyph itself, not anywhere on its line.
            guard layout.boundingRect(forGlyphRange: NSRange(location: glyph, length: 1), in: container).contains(inText) else { return nil }
            let index = layout.characterIndexForGlyph(at: glyph)
            var range = NSRange()
            guard storage.attribute(.link, at: index, effectiveRange: &range) != nil else { return nil }
            return range
        }

        func hover(at point: NSPoint?) {
            let now = point.flatMap(link(at:))
            guard now != hovered, let layout = layoutManager else { return }
            // In the text itself, then redrawn: a temporary attribute was set but never drawn, so
            // the underline didn't show (Emil, 8 November 2026: "these links dont get hover effects").
            _ = layout
            if let old = hovered { textStorage?.removeAttribute(.underlineStyle, range: old) }
            if let now { textStorage?.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: now) }
            hovered = now
            needsDisplay = true
        }
    }

    func makeNSView(context: Context) -> View {
        let view = View(usingTextLayoutManager: false)
        view.isEditable = false
        view.isSelectable = true
        view.drawsBackground = false
        view.textContainerInset = .zero
        view.textContainer?.lineFragmentPadding = 0
        view.textContainer?.widthTracksTextView = true
        view.isVerticallyResizable = false
        view.linkTextAttributes = [.foregroundColor: style.link, .cursor: NSCursor.pointingHand]
        return view
    }

    func updateNSView(_ view: View, context: Context) {
        let styled = Self.styled(text, style)
        if view.attributedString() != styled { view.textStorage?.setAttributedString(styled) }
    }

    func sizeThatFits(_ proposal: ProposedViewSize, nsView view: View, context: Context) -> CGSize? {
        let width = proposal.width ?? 360
        let height = Self.styled(text, style).boundingRect(with: CGSize(width: width, height: .greatestFiniteMagnitude),
                                                    options: [.usesLineFragmentOrigin, .usesFontLeading]).height
        return CGSize(width: width, height: ceil(height) + 2)
    }

    static func styled(_ text: AttributedString, _ style: Style = .footer) -> NSAttributedString {
        let out = NSMutableAttributedString(attributedString: NSAttributedString(text))
        let all = NSRange(location: 0, length: out.length)
        let centred = NSMutableParagraphStyle()
        centred.alignment = style.alignment
        out.addAttributes([.font: NSFont.systemFont(ofSize: style.size),
                           .foregroundColor: Palette.muted,
                           .paragraphStyle: centred], range: all)
        out.enumerateAttribute(.link, in: all) { value, range, _ in
            guard value != nil else { return }
            // The accent's darker ink: the bright accent read at 3.6:1 on the card (council round 3).
            out.addAttributes([.foregroundColor: style.link, .cursor: NSCursor.pointingHand,
                               .font: NSFont.systemFont(ofSize: style.size, weight: style.linkWeight)], range: range)
            // Underlined only under the pointer (View.hover).
            out.removeAttribute(.underlineStyle, range: range)
        }
        return out
    }
}
#endif

/// "Terms of Service · Privacy Policy" for Settings › General, under About.
struct LegalLinksRow: View {
    /// Help lines them up with the text above them (Emil, 8 November 2026: centred "looks weird").
    var alignment: Alignment = .center
    /// How tall each link's target is: a finger's height on iPhone.
    #if os(iOS)
    private static let target: CGFloat = 44
    #else
    private static let target: CGFloat = 24
    #endif

    var body: some View {
        HStack(spacing: 6) {
            Link("Terms of Service", destination: Legal.terms)
                .frame(minHeight: Self.target)
                .contentShape(.rect)
                .accessibilityIdentifier("settings.terms")
            Text("·").foregroundStyle(.tertiary).accessibilityHidden(true)
            Link("Privacy Policy", destination: Legal.privacy)
                .frame(minHeight: Self.target)
                .contentShape(.rect)
                .accessibilityIdentifier("settings.privacy")
        }
        .font(.footnote)
        .tint(Color(PColor.paneAccent))
        .buttonStyle(.hoverLink)
        #if os(iOS)
        .frame(maxWidth: .infinity, minHeight: 44, alignment: alignment)
        #else
        .frame(maxWidth: .infinity, minHeight: 24, alignment: alignment)
        #endif
    }
}
