import SwiftUI

/// Review an AI's edit part by part, in a card where the receipt was (AIReview has the rules).
/// The title and where you are ("Claude changed 3 parts · 1 of 3"), Keep All, Undo All and Done;
/// then each part in order, what was there struck through in grey above what the AI wrote, on the
/// tint the note's changed lines have, with Keep and Undo. ↑ and ↓ move between parts, Return keeps,
/// ⌫ undoes, Esc is Done (what's left is kept).
struct AIReviewCard: View {
    @Binding var review: AIReview
    /// Undo one part in the note; the view that owns the note does it (and says if it can't).
    let undo: (Int) -> Void
    let undoAll: () -> Void
    let done: () -> Void
    /// Scroll the note to a part.
    var reveal: (Int) -> Void = { _ in }
    /// iPhone: the card fills a sheet (medium and large), with 17 pt text and Keep and Undo full
    /// width at 44 pt under each part (persona council round 2: the phone only had a plain Undo).
    var inSheet = false
    @FocusState private var focused: Bool
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// The note text size (View › Make Text Bigger), which the Mac's card follows.
    #if os(macOS)
    @State private var noteText = UserDefaults.standard.double(forKey: TextSize.key)
    #else
    private let noteText: Double = 0
    #endif
    /// The text size: the sheet's follows the person's text size; the Mac card's the note's text
    /// size (UI council round 7: someone reading at 24 pt reviewed at 13).
    private var size: CGFloat { inSheet ? Self.body(typeSize) : Self.cardText(noteText) }

    /// The Mac card's text: the note's size (13, 15, 17, 20 or 24 pt); iPhone's card keeps 15.
    static func cardText(_ stored: Double) -> CGFloat {
        #if os(macOS)
        TextSize.size(stored: stored)
        #else
        text
        #endif
    }
    /// Wider and taller with bigger text, so lines stay about as long and more of a part shows;
    /// at most 1.6 times (24 pt), and the parts scroll beyond that.
    static func scale(_ size: CGFloat) -> CGFloat { min(max(size / text, 1), 1.6) }

    /// iOS's body text at each text size (17 pt at the default, Large), as the sheet sets it.
    static func body(_ t: DynamicTypeSize) -> CGFloat {
        switch t {
        case .xSmall: 14
        case .small: 15
        case .medium: 16
        case .large: 17
        case .xLarge: 19
        case .xxLarge: 21
        case .xxxLarge: 23
        case .accessibility1: 28
        case .accessibility2: 33
        case .accessibility3: 40
        case .accessibility4: 47
        case .accessibility5: 53
        @unknown default: 17
        }
    }

    #if os(macOS)
    static let width: CGFloat = 560
    static let text: CGFloat = 13
    #else
    static let width: CGFloat = 360
    static let text: CGFloat = 15
    #endif

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: Radius.lg, style: .continuous)
        VStack(spacing: 0) {
            header
            Color.line.frame(height: 1)
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(Array(review.parts.enumerated()), id: \.element.id) { i, part in
                            row(part, index: i).id(part.id)
                        }
                    }
                    .padding(10)
                }
                .frame(maxHeight: inSheet ? .infinity : 300 * Self.scale(size))
                .fixedSize(horizontal: false, vertical: !inSheet)
                .onChange(of: review.focus) { _, f in
                    guard review.parts.indices.contains(f) else { return }
                    if reduceMotion { proxy.scrollTo(review.parts[f].id, anchor: .center) }
                    else { withAnimation(.smooth(duration: 0.2)) { proxy.scrollTo(review.parts[f].id, anchor: .center) } }
                    reveal(review.parts[f].id)
                }
            }
            #if os(macOS)
            Color.line.frame(height: 1)
            Text(AIReview.keys)
                .font(.system(size: 11))
                .foregroundStyle(Color.muted)
                .frame(maxWidth: .infinity, minHeight: 26)
                .accessibilityHidden(true)
            #endif
        }
        .modifier(CardChrome(inSheet: inSheet, width: AIReviewCard.width * Self.scale(size), shape: shape))
        // The keys go to a stand-in behind the card, not the card itself: a focused card would
        // tell every button in it that it has focus, and each would draw its ring.
        .background { keys }
        .onAppear { focused = true }
        #if os(macOS)
        .onReceive(NotificationCenter.default.publisher(for: TextSize.didChange)) { _ in
            noteText = UserDefaults.standard.double(forKey: TextSize.key)
        }
        #endif
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("review.card")
    }

    private var keys: some View {
        Color.clear
            .focusable()
            .focused($focused)
            .focusEffectDisabled()
            .onKeyPress(.upArrow) { review.move(-1); return .handled }
            .onKeyPress(.downArrow) { review.move(1); return .handled }
            .onKeyPress(.return) { act(.kept); return .handled }
            .onKeyPress(.delete) { act(.undone); return .handled }
            .onKeyPress(.escape) { done(); return .handled }
            .accessibilityHidden(true)
    }

    private var header: some View {
        Group {
            if inSheet {
                // Two lines on a phone: what and Done, then where you are and the all-at-once actions.
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) { glyph; title; Spacer(minLength: 8); doneButton }
                    HStack(spacing: 16) { position; Spacer(minLength: 8); keepAll; undoAllButton }
                }
                .padding(.vertical, 10)
            } else {
                HStack(spacing: 8) { glyph; title; position; Spacer(minLength: 8); keepAll; undoAllButton; doneButton }
            }
        }
        .padding(.horizontal, 14)
        .frame(minHeight: 44)
    }

    private var glyph: some View { AIGlyph(ai: review.by, size: inSheet ? 17 : 14) }

    private var title: some View {
        Text(review.title)
            .font(.system(size: size, weight: .semibold))
            .foregroundStyle(Color.amberInk)
            // The sheet's title wraps at large text sizes; the card's stays on one line.
            .lineLimit(inSheet ? nil : 1)
            .fixedSize(horizontal: false, vertical: inSheet)
            .accessibilityIdentifier("review.title")
    }

    private var position: some View {
        Text(review.position)
            .font(.system(size: inSheet ? 15 : size))
            .foregroundStyle(Color.muted)
            .monospacedDigit()
            .accessibilityIdentifier("review.position")
    }

    private var keepAll: some View {
        Button("Keep All") { review.keepAll(); finishIfDone() }
            .buttonStyle(.hoverLink)
            .font(.system(size: size, weight: .medium))
            .foregroundStyle(Color.ink)
            .frame(minHeight: inSheet ? 44 : nil)
            .disabled(review.undecided.isEmpty)
            .accessibilityIdentifier("review.keepAll")
    }

    private var undoAllButton: some View {
        Button("Undo All", action: undoAll)
            .buttonStyle(.hoverLink)
            .font(.system(size: size, weight: .medium))
            .foregroundStyle(Color.ink)
            .frame(minHeight: inSheet ? 44 : nil)
            .disabled(review.undecided.isEmpty)
            .accessibilityIdentifier("review.undoAll")
    }

    private var doneButton: some View {
        Button("Done", action: done)
            .buttonStyle(.amberProminent(inSheet ? .regular : .compact))
            .accessibilityIdentifier("review.done")
    }

    private func row(_ part: AIReview.Part, index: Int) -> some View {
        let shape = RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
        let current = review.focus == index
        return VStack(alignment: .leading, spacing: 10) {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                // Undone, the part reads as it is in the note again: what was there back in ink,
                // and what the AI wrote struck through in grey (round 1 of the councils: an undone
                // part stayed all struck through, so it looked deleted).
                let undone = part.decision == .undone
                ForEach(Array(part.removed.enumerated()), id: \.offset) { i, line in
                    Text(AIReview.shown(line))
                        .strikethrough(!undone, color: Color.muted)
                        .foregroundStyle(undone ? Color.ink : Color.muted)
                        .accessibilityLabel(undone ? "Back: \(AIReview.shown(line))" : "Was: \(AIReview.shown(line))")
                        .accessibilityIdentifier("review.removed.\(part.id).\(i)")
                }
                ForEach(Array(part.added.enumerated()), id: \.offset) { i, line in
                    Text(AIReview.shown(line))
                        .foregroundStyle(undone ? Color.muted : Color.ink)
                        .strikethrough(undone, color: Color.muted)
                        .padding(.horizontal, 4)
                        .background(undone ? Color.clear : Color.amberSoft, in: .rect(cornerRadius: 3))
                        .padding(.horizontal, -4)
                        .accessibilityLabel(undone ? "Taken out: \(AIReview.shown(line))" : "\(review.who) wrote: \(AIReview.shown(line))")
                        .accessibilityIdentifier("review.added.\(part.id).\(i)")
                }
                if part.conflict {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange).accessibilityHidden(true)
                        Text(AIReview.conflictLine).foregroundStyle(Color.ink)
                    }
                    .font(.system(size: size - 1.5))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("review.conflict.\(part.id)")
                }
            }
            .font(.system(size: size))
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            if !inSheet { decision(part) }
        }
        if inSheet { decision(part) }
        }
        .padding(10)
        .background(current ? Hover.row : AnyShapeStyle(Color.clear), in: shape)
        .overlay(shape.strokeBorder(current ? Color.ink.opacity(0.35) : Color.line, lineWidth: current ? 1.5 : 1))
        .contentShape(shape)
        .onTapGesture { review.focus = index }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Part \(index + 1) of \(review.parts.count)")
        .accessibilityIdentifier("review.part.\(part.id)")
    }

    @ViewBuilder
    private func decision(_ part: AIReview.Part) -> some View {
        switch part.decision {
        case .kept:
            Label("Kept", systemImage: "checkmark").labelStyle(.titleAndIcon)
                .font(.system(size: size - 1, weight: .medium)).foregroundStyle(Color.muted)
                .accessibilityIdentifier("review.kept.\(part.id)")
        case .undone:
            Label("Undone", systemImage: "arrow.uturn.backward").labelStyle(.titleAndIcon)
                .font(.system(size: size - 1, weight: .medium)).foregroundStyle(Color.muted)
                .accessibilityIdentifier("review.undone.\(part.id)")
        case nil:
            HStack(spacing: inSheet ? 10 : 6) {
                Button { review.keep(part.id); finishIfDone() } label: { Label("Keep", systemImage: "checkmark") }
                    .buttonStyle(.secondary(inSheet ? .regular : .compact, wide: inSheet))
                    .frame(minHeight: inSheet ? 44 : nil)
                    .accessibilityIdentifier("review.keep.\(part.id)")
                // A part you changed since can't be undone: no Undo, only the reason under it
                // (round 1 of the councils: the card offered Undo beside "it can't be undone").
                if !part.conflict {
                    Button { undo(part.id) } label: { Label("Undo", systemImage: "arrow.uturn.backward") }
                        .buttonStyle(.secondary(inSheet ? .regular : .compact, wide: inSheet))
                        .frame(minHeight: inSheet ? 44 : nil)
                        .accessibilityIdentifier("review.undo.\(part.id)")
                }
            }
            .labelStyle(.titleAndIcon)
        }
    }

    /// Return and ⌫ act on the part the keys are on.
    private func act(_ d: AIReview.Decision) {
        guard review.parts.indices.contains(review.focus) else { return }
        let part = review.parts[review.focus]
        guard part.decision == nil else { review.move(1); return }
        if d == .kept { review.keep(part.id); finishIfDone() } else if !part.conflict { undo(part.id) }
    }

    private func finishIfDone() { if review.isFinished { done() } }
}

/// The floating card's look, or none in a sheet (the sheet is the card).
private struct CardChrome<S: InsettableShape>: ViewModifier {
    let inSheet: Bool
    let width: CGFloat
    let shape: S
    func body(content: Content) -> some View {
        if inSheet {
            content.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        } else {
            content
                // As wide as the text size asks, never wider than the note's column (a 520 pt
                // column, a 640 pt note window): Done, Keep and Undo stay inside (round 5).
                .frame(maxWidth: width)
                .background(Color.card, in: shape)
                .clipShape(shape)
                .raised(in: shape)
        }
    }
}

extension AIReview {
    /// A markdown line as the card shows it: list markers and checkboxes drawn, heading marks dropped.
    static func shown(_ line: String) -> String {
        let indent = line.prefix { $0 == " " || $0 == "\t" }
        var rest = line.dropFirst(indent.count)
        let lead = String(repeating: "  ", count: indent.count / 2)
        for (marker, glyph) in [("- [ ] ", "\u{25CB} "), ("- [x] ", "\u{2713} "), ("- [X] ", "\u{2713} "), ("* [ ] ", "\u{25CB} "), ("- ", "\u{2022} "), ("* ", "\u{2022} ")] where rest.hasPrefix(marker) {
            return lead + glyph + rest.dropFirst(marker.count)
        }
        if rest.hasPrefix("#") {
            rest = rest.drop { $0 == "#" }
            return lead + rest.trimmingCharacters(in: .whitespaces)
        }
        return line.isEmpty ? " " : line
    }
}
