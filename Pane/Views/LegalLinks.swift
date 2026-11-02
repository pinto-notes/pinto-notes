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

    /// Links inside a sentence are underlined, so they read as links before the pointer finds
    /// them: colour alone didn't (Emil, 2 November 2026).
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
    var body: some View {
        #if os(macOS)
        // AppKit's label: the pointer turns to a hand over each link, which SwiftUI's Text
        // doesn't do for links inside a sentence (Emil, 2 November 2026).
        LinkLabel(text: Legal.consentSentence + AttributedString(" " + DiagnosticsCopy.signIn))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
            .accessibilityIdentifier("signin.legal")
        #else
        Text(Legal.consentSentence + AttributedString(" " + DiagnosticsCopy.signIn))
            .font(.footnote)
            .foregroundStyle(Color.muted)
            .tint(Color(PColor.paneAccent))
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
/// over a link and a link opens on the first click. Footnote size, muted, links in the accent and underlined.
struct LinkLabel: NSViewRepresentable {
    let text: AttributedString

    /// A read-only text view: it follows a link on the first click, even with the window in the
    /// background (a selectable label took one click to wake up first), and shows the hand.
    final class View: NSTextView {
        override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
        override var acceptsFirstResponder: Bool { false }
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
        view.linkTextAttributes = [.foregroundColor: PColor.paneAccent, .underlineStyle: NSUnderlineStyle.single.rawValue,
                                   .cursor: NSCursor.pointingHand]
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
        out.addAttributes([.font: NSFont.preferredFont(forTextStyle: .footnote),
                           .foregroundColor: Palette.muted,
                           .paragraphStyle: centred], range: all)
        out.enumerateAttribute(.link, in: all) { value, range, _ in
            guard value != nil else { return }
            out.addAttributes([.foregroundColor: PColor.paneAccent, .underlineStyle: NSUnderlineStyle.single.rawValue,
                               .cursor: NSCursor.pointingHand], range: range)
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
