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
    static let size: CGFloat = 11
    var body: some View {
        #if os(macOS)
        // AppKit's label: the pointer turns to a hand over each link, which SwiftUI's Text
        // doesn't do for links inside a sentence (Emil, 2 November 2026).
        // Two short paragraphs, not one block of three lines (council round 6, 11-04): the
        // terms, then what the app sends about itself.
        // 11 pt, the size of Apple's own sign-in small print; 10 pt footnote read as miniature
        // (council round 7).
        VStack(spacing: 6) {
            LinkLabel(text: Legal.consentSentence)
                .frame(maxWidth: .infinity)
            Text(DiagnosticsCopy.signIn)
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

    /// A read-only text view: it follows a link on the first click, even with the window in the
    /// background (a selectable label took one click to wake up first), and shows the hand.
    /// A link is underlined while the pointer is on it, like the card's other links ("Forgot
    /// password?", HoverTextButtonStyle), not all the time (Emil, 11-03).
    final class View: NSTextView {
        override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
        override var acceptsFirstResponder: Bool { false }

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
            if let old = hovered { layout.removeTemporaryAttribute(.underlineStyle, forCharacterRange: old) }
            if let now { layout.addTemporaryAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, forCharacterRange: now) }
            hovered = now
        }
    }

    func makeNSView(context: Context) -> View {
        let view = View()
        view.isEditable = false
        view.isSelectable = true
        view.drawsBackground = false
        view.textContainerInset = .zero
        view.textContainer?.lineFragmentPadding = 0
        view.textContainer?.widthTracksTextView = true
        view.isVerticallyResizable = false
        view.linkTextAttributes = [.foregroundColor: Palette.amberInk, .cursor: NSCursor.pointingHand]
        return view
    }

    func updateNSView(_ view: View, context: Context) {
        let styled = Self.styled(text)
        if view.attributedString() != styled { view.textStorage?.setAttributedString(styled) }
    }

    func sizeThatFits(_ proposal: ProposedViewSize, nsView view: View, context: Context) -> CGSize? {
        let width = proposal.width ?? 360
        let height = Self.styled(text).boundingRect(with: CGSize(width: width, height: .greatestFiniteMagnitude),
                                                    options: [.usesLineFragmentOrigin, .usesFontLeading]).height
        return CGSize(width: width, height: ceil(height) + 2)
    }

    static func styled(_ text: AttributedString) -> NSAttributedString {
        let out = NSMutableAttributedString(attributedString: NSAttributedString(text))
        let all = NSRange(location: 0, length: out.length)
        let centred = NSMutableParagraphStyle()
        centred.alignment = .center
        out.addAttributes([.font: NSFont.systemFont(ofSize: ConsentFooter.size),
                           .foregroundColor: Palette.muted,
                           .paragraphStyle: centred], range: all)
        out.enumerateAttribute(.link, in: all) { value, range, _ in
            guard value != nil else { return }
            // The accent's darker ink: the bright accent read at 3.6:1 on the card (council round 3).
            out.addAttributes([.foregroundColor: Palette.amberInk, .cursor: NSCursor.pointingHand], range: range)
            // Underlined only under the pointer (View.hover).
            out.removeAttribute(.underlineStyle, range: range)
        }
        return out
    }
}
#endif

/// "Terms of Service · Privacy Policy" for Settings › General, under About.
struct LegalLinksRow: View {
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
        .frame(maxWidth: .infinity, minHeight: 44)
        #else
        .frame(maxWidth: .infinity, minHeight: 24)
        #endif
    }
}
