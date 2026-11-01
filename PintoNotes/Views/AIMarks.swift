import SwiftUI

/// The app marks of the AIs people connect (from Simple Icons, as on the website; Incredible's
/// from its own brand files).
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
        case "Incredible": "AIGlyphIncredible"
        default: nil
        }
    }

    static func color(_ ai: String) -> Color {
        switch ai {
        case "Claude", "Claude Code": Color(red: 0.851, green: 0.467, blue: 0.341)
        case "Incredible": Color(red: 1, green: 0.435, blue: 0.129) // #FF6F21, Incredible's mark
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

/// "ChatGPT changed 5 lines", with Undo: shown on the open note when an AI's edit lands on it.
struct AIReceipt: View {
    let receipt: AIEdit.Receipt
    /// Smaller, for the navigation bar over a note's app.
    var compact = false
    /// See all changes: AI Changes, for every change this AI made. Only for an edit of the text.
    var seeAll: (() -> Void)? = nil
    let undo: () -> Void

    /// Rises in from the bottom edge; with Reduce Motion it only fades.
    static func slides(reduceMotion: Bool) -> Bool { !reduceMotion }

    static func transition(reduceMotion: Bool) -> AnyTransition {
        guard slides(reduceMotion: reduceMotion) else { return .opacity }
        return .asymmetric(insertion: .move(edge: .bottom).combined(with: .opacity).combined(with: .scale(scale: 0.96, anchor: .bottom)),
                           removal: .opacity.combined(with: .offset(y: 6)))
    }

    var body: some View {
        HStack(spacing: 8) {
            AIGlyph(ai: receipt.by, size: compact ? 12 : 14)
            Text(compact ? receipt.shortSummary : receipt.summary)
                .font(.system(size: compact ? 13 : Self.text, weight: .semibold))
                .lineLimit(1)
                .foregroundStyle(Color.amberInk)
            if receipt.kind != .heldBack {
            Divider().frame(height: 14)
            Button("Undo", action: undo)
                .buttonStyle(.hoverLink)
                .font(.system(size: compact ? 13 : Self.text, weight: .semibold))
                .foregroundStyle(Color.amberInk)
                .contentShape(.rect)
                .accessibilityHint("Puts the note back the way it was before \(receipt.by)'s edit")
            }
            if let seeAll, receipt.kind == .edit, !compact {
                Divider().frame(height: 14)
                Button("See all changes", action: seeAll)
                    .buttonStyle(.hoverLink)
                    .font(.system(size: Self.text, weight: .semibold))
                    .foregroundStyle(Color.amberInk)
                    .contentShape(.rect)
                    .accessibilityIdentifier("receipt.seeAll")
            }
        }
        .padding(.horizontal, compact ? 11 : 14)
        .frame(height: compact ? 32 : Self.height)
        .background(Color.amberSoft, in: .capsule)
        // A solid edge: the amber of the fill, a step deeper (nothing see-through).
        .overlay(Capsule().strokeBorder(Color(light: Color(red: 0.96, green: 0.86, blue: 0.70), dark: Color(red: 0.36, green: 0.27, blue: 0.12)), lineWidth: 1))
        .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.12), radius: 12, y: 6)
        .shadow(color: Color(red: 0.24, green: 0.12, blue: 0.02).opacity(0.08), radius: 2, y: 1)
        .accessibilityElement(children: .contain)
    }

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
