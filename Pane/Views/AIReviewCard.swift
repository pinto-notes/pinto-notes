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
    @FocusState private var focused: Bool

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
                .frame(maxHeight: 300)
                .fixedSize(horizontal: false, vertical: true)
                .onChange(of: review.focus) { _, f in
                    guard review.parts.indices.contains(f) else { return }
                    withAnimation(.smooth(duration: 0.2)) { proxy.scrollTo(review.parts[f].id, anchor: .center) }
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
        .frame(width: Self.width)
        .background(Color.card, in: shape)
        .clipShape(shape)
        .raised(in: shape)
        // The keys go to a stand-in behind the card, not the card itself: a focused card would
        // tell every button in it that it has focus, and each would draw its ring.
        .background { keys }
        .onAppear { focused = true }
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
        HStack(spacing: 8) {
            AIGlyph(ai: review.by, size: 14)
            Text(review.title)
                .font(.system(size: Self.text, weight: .semibold))
                .foregroundStyle(Color.amberInk)
                .lineLimit(1)
                .accessibilityIdentifier("review.title")
            Text(review.position)
                .font(.system(size: Self.text))
                .foregroundStyle(Color.muted)
                .monospacedDigit()
                .accessibilityIdentifier("review.position")
            Spacer(minLength: 8)
            Button("Keep All") { review.keepAll(); finishIfDone() }
                .buttonStyle(.hoverLink)
                .font(.system(size: Self.text, weight: .medium))
                .foregroundStyle(Color.ink)
                .disabled(review.undecided.isEmpty)
                .accessibilityIdentifier("review.keepAll")
            Button("Undo All", action: undoAll)
                .buttonStyle(.hoverLink)
                .font(.system(size: Self.text, weight: .medium))
                .foregroundStyle(Color.ink)
                .disabled(review.undecided.isEmpty)
                .accessibilityIdentifier("review.undoAll")
            Button("Done", action: done)
                .buttonStyle(.amberProminent(.compact))
                .accessibilityIdentifier("review.done")
        }
        .padding(.horizontal, 14)
        .frame(minHeight: 44)
    }

    private func row(_ part: AIReview.Part, index: Int) -> some View {
        let shape = RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
        let current = review.focus == index
        return HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                ForEach(Array(part.removed.enumerated()), id: \.offset) { _, line in
                    Text(AIReview.shown(line))
                        .strikethrough(true, color: Color.muted)
                        .foregroundStyle(Color.muted)
                }
                ForEach(Array(part.added.enumerated()), id: \.offset) { _, line in
                    Text(AIReview.shown(line))
                        .foregroundStyle(part.decision == .undone ? Color.muted : Color.ink)
                        .strikethrough(part.decision == .undone, color: Color.muted)
                        .padding(.horizontal, 4)
                        .background(part.decision == .undone ? Color.clear : Color.amberSoft, in: .rect(cornerRadius: 3))
                        .padding(.horizontal, -4)
                }
                if part.conflict {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange).accessibilityHidden(true)
                        Text(AIReview.conflictLine).foregroundStyle(Color.ink)
                    }
                    .font(.system(size: Self.text - 1.5))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("review.conflict.\(part.id)")
                }
            }
            .font(.system(size: Self.text))
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            decision(part)
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
                .font(.system(size: Self.text - 1, weight: .medium)).foregroundStyle(Color.muted)
                .accessibilityIdentifier("review.kept.\(part.id)")
        case .undone:
            Label("Undone", systemImage: "arrow.uturn.backward").labelStyle(.titleAndIcon)
                .font(.system(size: Self.text - 1, weight: .medium)).foregroundStyle(Color.muted)
                .accessibilityIdentifier("review.undone.\(part.id)")
        case nil:
            HStack(spacing: 6) {
                Button { review.keep(part.id); finishIfDone() } label: { Label("Keep", systemImage: "checkmark") }
                    .buttonStyle(.secondary(.compact))
                    .accessibilityIdentifier("review.keep.\(part.id)")
                Button { undo(part.id) } label: { Label("Undo", systemImage: "arrow.uturn.backward") }
                    .buttonStyle(.secondary(.compact))
                    .accessibilityIdentifier("review.undo.\(part.id)")
            }
            .labelStyle(.titleAndIcon)
        }
    }

    /// Return and ⌫ act on the part the keys are on.
    private func act(_ d: AIReview.Decision) {
        guard review.parts.indices.contains(review.focus) else { return }
        let part = review.parts[review.focus]
        guard part.decision == nil else { review.move(1); return }
        if d == .kept { review.keep(part.id); finishIfDone() } else { undo(part.id) }
    }

    private func finishIfDone() { if review.isFinished { done() } }
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
