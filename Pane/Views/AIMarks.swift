import SwiftUI

/// The app marks of the AIs people connect (from Simple Icons, as on the website).
struct AIGlyph: View {
    let ai: String
    var size: CGFloat = 16
    /// In a button: the mark takes the button's own label colour, so it reads on any fill.
    var monochrome = false

    /// App Store captures (`-uitest -storeSafe`) show no other company's marks, only a neutral sparkle.
    static let storeSafe = ProcessInfo.processInfo.arguments.contains("-uitest") && ProcessInfo.processInfo.arguments.contains("-storeSafe")

    var body: some View {
        if ai == Self.page {
            // An edit made on a note's page (NotePage): the page's own mark.
            Image(systemName: NoteAppMark.symbol).resizable().scaledToFit().frame(width: size * 0.85, height: size * 0.85)
                .frame(width: size, height: size)
                .foregroundStyle(Color.amberInk)
                .accessibilityHidden(true)
        } else if Self.storeSafe {
            Image(systemName: "sparkle").resizable().scaledToFit().frame(width: size * 0.85, height: size * 0.85)
                .frame(width: size, height: size)
                .foregroundStyle(.tint)
                .accessibilityHidden(true)
        } else if let asset = Self.asset(ai), monochrome {
            // No colour of its own: it takes the label colour around it.
            Image(asset).renderingMode(.template).resizable().scaledToFit().frame(width: size, height: size)
                .accessibilityHidden(true)
        } else if let asset = Self.asset(ai) {
            Image(asset).resizable().scaledToFit().frame(width: size, height: size)
                .foregroundStyle(Self.color(ai))
                .accessibilityHidden(true)
        } else {
            // Any other app: a plain glyph that fits any size (text would be cut short in a small tile).
            Image(systemName: "link").resizable().scaledToFit().frame(width: size * 0.8, height: size * 0.8)
                .frame(width: size, height: size)
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
        }
    }

    #if os(macOS)
    /// The mark for a Mac menu row, already in its colour: a menu draws a template image dark,
    /// whatever the menu's own colour, so it gets a finished picture (ChatGPT in the text colour,
    /// Claude in its orange).
    @MainActor static func menuImage(_ ai: String, dark: Bool) -> Image? {
        menuPicture(ai, dark: dark).map { Image(nsImage: $0) }
    }

    @MainActor static func menuPicture(_ ai: String, dark: Bool) -> NSImage? {
        guard asset(ai) != nil else { return nil }
        let renderer = ImageRenderer(content: AIGlyph(ai: ai, size: 16).environment(\.colorScheme, dark ? .dark : .light))
        renderer.scale = 2
        guard let image = renderer.nsImage else { return nil }
        image.isTemplate = false
        return image
    }
    #endif

    /// Who made an edit on a note's page.
    static let page = "App"

    static func asset(_ ai: String) -> String? {
        switch ai {
        case "ChatGPT", "Codex": "AIGlyphOpenAI"
        case "Claude", "Claude Code": "AIGlyphClaude"
        case "Gemini": "AIGlyphGemini"
        case "Grok": "AIGlyphGrok"
        case "Cursor": "AIGlyphCursor"
        case "VS Code": "AIGlyphVSCode"
        default: nil
        }
    }

    /// The AI's caret and name flag while its edit writes itself in: its brand colour, as on the
    /// welcome note (ChatGPT green, Claude orange); the app's amber for any other.
    static func caretColor(_ ai: String) -> PColor {
        switch ai {
        case "ChatGPT", "Codex": PColor(red: 0.063, green: 0.639, blue: 0.498, alpha: 1)
        case "Claude", "Claude Code": PColor(red: 0.851, green: 0.467, blue: 0.341, alpha: 1)
        case "Gemini": PColor(red: 0.259, green: 0.522, blue: 0.957, alpha: 1)
        default: Palette.amber
        }
    }

    static func color(_ ai: String) -> Color {
        switch ai {
        case "Claude", "Claude Code": Color(red: 0.851, green: 0.467, blue: 0.341)
        case "VS Code": Color(red: 0, green: 0.478, blue: 0.8) // #007ACC
        case "Gemini": Color(red: 0.259, green: 0.522, blue: 0.957) // #4285F4, Google blue
        default: .primary
        }
    }
}

/// The glyph on a small white tile with a hairline and a soft shadow, like the website's AI strip.
struct AITile: View {
    let ai: String
    var size: CGFloat = 30

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
        AIGlyph(ai: ai, size: size * 0.56)
            .frame(width: size, height: size)
            .background(Color.white, in: shape)
            .overlay(shape.strokeBorder(Color.black.opacity(0.08), lineWidth: 0.5))
            .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.10), radius: 3, y: 1.5)
            .environment(\.colorScheme, .light)
    }
}

/// iPhone: an AI's edit of a note's text is marked by the tint on the lines it changed and a plain
/// Undo button in the navigation bar, not the receipt pill (Emil, 29 October 2026: design effort
/// goes into the AI's marking, everything else is standard). The Mac keeps the pill, which now
/// stays as long as the tint does.
enum NoteAIUndo {
    static let identifier = "note.aiUndo"
    /// The button at the foot of the note that shows what an AI just changed (AIChangeButton).
    static let reviewIdentifier = "note.aiReview"
    /// The phone reviews in a sheet; the Mac in the card where the receipt was.
    #if os(iOS)
    static let reviewsInSheet = true
    #else
    static let reviewsInSheet = false
    #endif
    /// The same place's Undo of your own changes.
    static let yoursIdentifier = "note.undo"

    /// What the one Undo beside Share and More undoes (Emil, 29 October 2026): your last change
    /// since the note opened; before you've changed anything, an AI's edit; otherwise it isn't
    /// there. Never two.
    enum Button: Equatable {
        case yours(canRedo: Bool)
        case ai(AIEdit.Receipt)
    }

    static func button(canUndo: Bool, canRedo: Bool, receipt: AIEdit.Receipt?, showingPage: Bool, trashed: Bool) -> Button? {
        guard !trashed else { return nil }
        #if os(iOS)
        if canUndo, !showingPage { return .yours(canRedo: canRedo) }
        #endif
        if let receipt, inBar(receipt, showingPage: showingPage) { return .ai(receipt) }
        return nil
    }

    static func inBar(_ receipt: AIEdit.Receipt?, showingPage: Bool) -> Bool {
        #if os(iOS)
        !showingPage && receipt?.staysUntilEdited == true
        #else
        false
        #endif
    }
}

#if os(iOS)
/// iPhone: "ChatGPT changed 5 lines ›" at the foot of the open note while its change is marked.
/// One tap shows each part it changed, to keep or undo (the review sheet). Undo is in the bar.
struct AIChangeButton: View {
    let receipt: AIEdit.Receipt
    let show: () -> Void
    @ScaledMetric(relativeTo: .body) private var height: CGFloat = 48

    var body: some View {
        Button(action: show) {
            HStack(spacing: 10) {
                AIGlyph(ai: receipt.by, size: 16)
                Text(receipt.summary)
                    .font(.body.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 16)
            .frame(minHeight: height)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .foregroundStyle(.primary)
        .background(.regularMaterial, in: .capsule)
        .overlay(Capsule().strokeBorder(Color.line, lineWidth: 0.5))
        .shadow(color: .black.opacity(0.10), radius: 14, y: 6)
        .accessibilityLabel(receipt.summary)
        .accessibilityHint("Shows each part \(receipt.who) changed, to keep or undo it")
        .accessibilityIdentifier(NoteAIUndo.reviewIdentifier)
    }
}
#endif

/// "ChatGPT changed 5 lines", with Undo: shown on the open note when an AI's edit lands on it.
struct AIReceipt: View {
    let receipt: AIEdit.Receipt
    /// Smaller, for the navigation bar over a note's app.
    var compact = false
    /// See all changes: AI Changes, for every change this AI made. Only for an edit of the text.
    var seeAll: (() -> Void)? = nil
    /// Review: each changed part in turn, kept or undone on its own (AIReviewCard). Only for an
    /// edit of the text, not a note the AI wrote.
    var review: (() -> Void)? = nil
    /// The change is out of view: 1 below, -1 above. `show` scrolls to it.
    var placement = 0
    var show: (() -> Void)? = nil
    let undo: () -> Void

    /// Whether Review is offered for this receipt: an edit of the note's text, with the text from
    /// right after it to compare (AIReview).
    static func reviews(_ r: AIEdit.Receipt) -> Bool { r.kind == .edit && !r.created && r.after != nil }

    /// Rises in from the bottom edge; with Reduce Motion it only fades.
    static func slides(reduceMotion: Bool) -> Bool { !reduceMotion }

    static func transition(reduceMotion: Bool) -> AnyTransition {
        guard slides(reduceMotion: reduceMotion) else { return .opacity }
        return .asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity).combined(with: .scale(scale: 0.96, anchor: .bottom)),
                           removal: .opacity.combined(with: .offset(y: 6)))
    }

    /// Review isn't offered from the receipt (Emil, 12 November 2026: "I can see the changes"):
    /// the tint shows them, and Undo takes them all back.
    static let offersReview = false
    /// Seconds the receipt stays after it lands, a little past the tint's fade.
    static let stays: Double = 6

    /// A quiet glass capsule in the system's colours, like a Mac or iPhone notice: the AI's mark,
    /// what it did in the text colour, and Undo in bold (Emil, 12 November 2026: the amber
    /// capsule with amber words and three links was "super ugly").
    var body: some View {
        HStack(spacing: compact ? 7 : 9) {
            AIGlyph(ai: receipt.by, size: compact ? 12 : 14)
            Text(compact ? receipt.shortSummary : receipt.summary + (Self.age(receipt.at).map { " \u{00B7} \($0)" } ?? ""))
                .font(.system(size: compact ? 13 : Self.text, weight: .medium))
                .lineLimit(1)
                // Whole, never "ChatGPT changed 3 li…": the capsule grows instead (council round 5).
                .fixedSize(horizontal: true, vertical: false)
                .foregroundStyle(.primary)
                // A second edit's words replace the first's at once, never drawn over them (council r1).
                .contentTransition(.identity)
            if let show, placement != 0, !compact {
                Button(action: show) {
                    Label("Show", systemImage: placement > 0 ? "arrow.down" : "arrow.up")
                        .labelStyle(.titleAndIcon)
                }
                .buttonStyle(.hoverLink)
                .font(.system(size: Self.text, weight: .bold))
                .foregroundStyle(.primary)
                .padding(.leading, 4)
                .accessibilityLabel(placement > 0 ? "Show the change below" : "Show the change above")
                .accessibilityIdentifier("receipt.show")
            }
            if receipt.kind != .heldBack {
                // In the text colour, bolder than the words beside it: not the app's orange next to
                // ChatGPT's green tint (Emil, 12 November 2026).
                Button("Undo", action: undo)
                    .buttonStyle(.hoverLink)
                    .font(.system(size: compact ? 13 : Self.text, weight: .bold))
                    .foregroundStyle(.primary)
                    .padding(.leading, compact ? 2 : 4)
                    .contentShape(.rect)
                    .accessibilityHint("Puts the note back the way it was before \(receipt.who)'s edit")
            }
            if let review, Self.reviews(receipt), !compact {
                Button("Review", action: review)
                    .buttonStyle(.hoverLink)
                    .font(.system(size: Self.text, weight: .semibold))
                    .foregroundStyle(Color.paneAccent)
                    .contentShape(.rect)
                    .accessibilityHint("Goes through each part \(receipt.who) changed, to keep or undo it")
                    .accessibilityIdentifier("receipt.review")
            }
            if let seeAll, receipt.kind == .edit, !compact, review == nil, !Self.quiet {
                Button("See all changes", action: seeAll)
                    .buttonStyle(.hoverLink)
                    .font(.system(size: Self.text, weight: .semibold))
                    .foregroundStyle(Color.paneAccent)
                    .contentShape(.rect)
                    .accessibilityIdentifier("receipt.seeAll")
            }
        }
        .padding(.leading, compact ? 10 : 12)
        .padding(.trailing, compact ? 12 : 14)
        .frame(height: compact ? 30 : Self.height)
        // A solid fill: the material greyed the words and showed at the ends (council r1).
        // The shadow on the capsule alone, not on the words and buttons (it drew faint lines at
        // the ends, council r1).
        .background {
            // A soft lift as rings of faint capsules, each a little wider and lower: no edge
            // anywhere (council r2: layer shadow left stubs; r3: a blur drew as a grey band).
            ForEach(1...5, id: \.self) { i in
                Capsule().fill(Color.black.opacity(0.012))
                    .padding(-CGFloat(i)).offset(y: 1 + CGFloat(i) * 0.6)
            }
            Capsule().fill(Self.fill)
        }
        .overlay(Capsule().strokeBorder(Color.primary.opacity(0.10), lineWidth: 0.5))
        // A new edit's words, mark and width arrive in one step: no frame where the longer words
        // run over Undo (council r2).
        .animation(nil, value: receipt)
        .accessibilityElement(children: .contain)
    }

    /// How long ago, for an edit you only see later ("2 h ago"); nil for one that just happened.
    static func age(_ at: Date, now: Date = .now) -> String? {
        let s = now.timeIntervalSince(at)
        guard s >= 120 else { return nil }
        if s < 3600 { return "\(Int(s / 60)) min ago" }
        if s < 86400 { return "\(Int(s / 3600)) h ago" }
        let days = Int(s / 86400)
        return days == 1 ? "yesterday" : "\(days) days ago"
    }

    #if os(macOS)
    static let fill = Color(nsColor: NSColor(name: nil) { a in
        a.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.17, alpha: 1) : .white
    })
    #else
    static let fill = Color(uiColor: UIColor { t in t.userInterfaceStyle == .dark ? UIColor(white: 0.17, alpha: 1) : .white })
    #endif

    /// Just the summary and Undo: AI Changes is in the sidebar and the menu.
    static let quiet = true

    #if os(macOS)
    static let text: CGFloat = 12
    static let height: CGFloat = 30
    #else
    static let text: CGFloat = 15
    static let height: CGFloat = 40
    #endif
}

/// The mark of a note that is also an app (it has a page; see NotePage): after the title in the note
/// list and search results, and on Show App. PICKED: soft (A3), a soft grey
/// capsule with "App" in the secondary colour. The candidates it was chosen from (`-appMark`, debug):
///   A capsule: a solid amber capsule with the word "App" (our feature has no other noun);
///   B tile: SF Symbol app.fill in amber, at the title's cap height;
///   C sparkles: SF Symbol sparkles in amber, "made by your AI".
/// And A made quiet (Emil, 5 Oct: the amber capsule is too loud):
///   A1 word: "App" in the secondary text colour, small caps, no fill, like metadata;
///   A2 outline: a hairline capsule in the secondary colour, no fill;
///   A3 soft: a soft solid grey capsule (not amber) with secondary text.
enum NoteAppMark {
    enum Style: String, CaseIterable { case capsule, tile, sparkles, word, outline, soft }
    /// A3, soft, is the mark (Emil, 5 Oct). The others stay for comparison behind -appMark in
    /// development builds only.
    #if DEBUG || QA
    nonisolated(unsafe) static var style: Style = Capture.argument("-appMark").flatMap(Style.init(rawValue:)) ?? .soft
    #else
    static let style: Style = .soft
    #endif

    /// The symbol where a symbol is needed (Make It an App in More, the chip). It was "app.fill",
    /// which is a plain filled square: in a menu it read as a missing icon. A grid of four is the
    /// sign for apps people know, and is drawn in outline like the menu's other symbols.
    static var symbol: String { style == .sparkles ? "sparkles" : "square.grid.2x2" }

    @MainActor static func has(_ note: Note, in store: NotePageStore = .shared, enabled: Bool = NoteApps.enabled) -> Bool {
        enabled && !note.isLocked && store[note.id] != nil
    }
}

/// The mark itself, sized for the text it sits after.
struct AppMarkView: View {
    var size: CGFloat = 13
    var body: some View {
        switch NoteAppMark.style {
        case .capsule:
            Text("App")
                .font(.system(size: size * 0.78, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, size * 0.42)
                .frame(height: size * 1.15)
                .background(Color(Palette.amberButton), in: .capsule)
                .accessibilityLabel("App")
        case .tile:
            Image(systemName: "app.fill")
                .font(.system(size: size * 0.82, weight: .semibold))
                .foregroundStyle(Color(Palette.amberButton))
                .accessibilityLabel("App")
        case .sparkles:
            Image(systemName: "sparkles")
                .font(.system(size: size * 0.82, weight: .semibold))
                .foregroundStyle(Color(Palette.amberButton))
                .accessibilityLabel("App")
        case .word:
            Text("App")
                .font(.system(size: size * 0.92, weight: .medium).lowercaseSmallCaps())
                .foregroundStyle(Color.muted)
                .accessibilityLabel("App")
        case .outline:
            Text("App")
                .font(.system(size: size * 0.74, weight: .semibold))
                .foregroundStyle(Color.muted)
                .padding(.horizontal, size * 0.38)
                .frame(height: size * 1.12)
                .overlay(Capsule().strokeBorder(Color.muted, lineWidth: 1))
                .accessibilityLabel("App")
        case .soft:
            Text("App")
                .font(.system(size: size * 0.74, weight: .semibold))
                .foregroundStyle(Color.muted)
                .padding(.horizontal, size * 0.4)
                .frame(height: size * 1.12)
                .background(Color(light: Color(red: 0.925, green: 0.906, blue: 0.886), dark: Color(red: 0.2, green: 0.192, blue: 0.184)), in: .capsule)
                .accessibilityLabel("App")
        }
    }
}
