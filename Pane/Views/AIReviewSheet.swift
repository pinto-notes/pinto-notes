import SwiftUI

/// iPhone's review of an AI's edit, as a normal sheet (Emil, 4 November 2026: the card in a sheet
/// "looks so terrible": an orange Done, a grey boxed part, beige buttons, "1 of 1" with Keep All
/// and Undo All for a single part). The title in the bar with a close button; each part on a plain
/// card, highlighted as the note highlights it; Undo and Keep as the system's buttons, Keep filled.
/// Where you are and Keep All / Undo All only when there's more than one part. Closing keeps what's
/// left, as Done did. AIReview has the rules; the Mac keeps AIReviewCard.
struct AIReviewSheet: View {
    @Binding var review: AIReview
    let undo: (Int) -> Void
    let undoAll: () -> Void
    let done: () -> Void
    /// Scroll the note to a part.
    var reveal: (Int) -> Void = { _ in }

    @Environment(\.dynamicTypeSize) private var typeSize
    private var many: Bool { review.parts.count > 1 }
    /// Body text at the person's text size, set in points so the Mac's tests see it scale too.
    private var size: CGFloat { AIReviewCard.body(typeSize) }

    var body: some View {
        #if os(iOS)
        NavigationStack {
            content
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .principal) { title }
                    ToolbarItem(placement: .topBarTrailing) { close }
                }
        }
        #else
        VStack(spacing: 0) {
            HStack(spacing: 8) { title; Spacer(minLength: 8); close }
                .padding(.horizontal, 16).padding(.vertical, 10)
            content
        }
        .background(Self.background)
        #endif
    }

    static var background: Color {
        #if os(iOS)
        Color(uiColor: .systemGroupedBackground)
        #else
        Color(nsColor: .windowBackgroundColor)
        #endif
    }

    /// Counted in lines, as the button in the note says it ("ChatGPT changed 5 lines"), not in
    /// parts, which only the review knows about.
    static func title(_ r: AIReview) -> String { r.title }

    private var title: some View {
        HStack(spacing: 7) {
            AIGlyph(ai: review.by, size: 17)
            Text(Self.title(review))
                .font(.system(size: size, weight: .semibold))
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("review.title")
        }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }

    private var close: some View {
        Button(role: .close, action: done)
            .tint(.primary)
        .accessibilityLabel("Close")
        .accessibilityIdentifier("review.done")
    }

    private var content: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ForEach(Array(review.parts.enumerated()), id: \.element.id) { i, part in
                        row(part, index: i).id(part.id)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            // Always in view: under the parts, the half-height sheet cut them off at its edge.
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if many && !review.undecided.isEmpty {
                    all.padding(.horizontal, 16).padding(.vertical, 10).background(Self.background)
                }
            }
            .onChange(of: review.focus) { _, f in
                guard review.parts.indices.contains(f) else { return }
                withAnimation(.smooth(duration: 0.2)) { proxy.scrollTo(review.parts[f].id, anchor: .center) }
                reveal(review.parts[f].id)
            }
        }
        .background(Self.background)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("review.card")
    }

    /// Keep All and Undo All, under the parts, when there are several.
    private var all: some View {
        HStack(spacing: 12) {
            Button("Undo All", action: undoAll)
                .accessibilityIdentifier("review.undoAll")
            Button("Keep All") { review.keepAll(); if review.isFinished { done() } }
                .accessibilityIdentifier("review.keepAll")
        }
        .buttonStyle(.secondary(.regular, wide: true))
        .frame(maxWidth: .infinity)
    }

    private func row(_ part: AIReview.Part, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if many {
                Text("\(index + 1) of \(review.parts.count)")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
                    .padding(.leading, 4)
                    .accessibilityIdentifier(index == 0 ? "review.position" : "review.position.\(index)")
            }
            VStack(alignment: .leading, spacing: 14) {
                lines(part)
                decision(part)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .onTapGesture { review.focus = index }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(many ? "Part \(index + 1) of \(review.parts.count)" : "The change")
            .accessibilityIdentifier("review.part.\(part.id)")
        }
    }

    /// What was there struck through in grey, then what the AI wrote, highlighted as in the note.
    /// Undone, it reads as the note does again.
    private func lines(_ part: AIReview.Part) -> some View {
        let undone = part.decision == .undone
        return VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(part.removed.enumerated()), id: \.offset) { i, line in
                AIReview.text(line, struck: !undone)
                    .foregroundStyle(undone ? Color.ink : Color.muted)
                    .accessibilityLabel(undone ? "Back: \(AIReview.shown(line))" : "Was: \(AIReview.shown(line))")
                    .accessibilityIdentifier("review.removed.\(part.id).\(i)")
            }
            // What it wrote, with the note's margin tick beside it: marked by shape too, not only
            // by colour (round 14 of the UI council).
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(part.added.enumerated()), id: \.offset) { i, line in
                    AIReview.text(line, struck: undone)
                        .foregroundStyle(undone ? Color.muted : Color.ink)
                        .padding(.horizontal, 4).padding(.vertical, 1)
                        .background(undone ? Color.clear : Color.amberSoft, in: .rect(cornerRadius: 5))
                        .padding(.horizontal, -4)
                        .accessibilityLabel(undone ? "Taken out: \(AIReview.shown(line))" : "\(review.who) wrote: \(AIReview.shown(line))")
                        .accessibilityIdentifier("review.added.\(part.id).\(i)")
                }
            }
            .padding(.leading, part.added.isEmpty || undone ? 0 : DecoratedLayoutFragment.tickGap + DecoratedLayoutFragment.tickWidth)
            .overlay(alignment: .leading) {
                if !part.added.isEmpty, !undone {
                    Capsule().fill(Color(PColor.paneAccent)).frame(width: DecoratedLayoutFragment.tickWidth)
                        .accessibilityHidden(true)
                }
            }
            if part.conflict {
                Label(AIReview.conflictLine, systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline)
                    .foregroundStyle(Color.ink)
                    .symbolRenderingMode(.multicolor)
                    .padding(.top, 4)
                    .accessibilityIdentifier("review.conflict.\(part.id)")
            }
        }
        .font(.system(size: size))
        .fixedSize(horizontal: false, vertical: true)
    }

    @ViewBuilder
    private func decision(_ part: AIReview.Part) -> some View {
        switch part.decision {
        case .kept:
            Label("Kept", systemImage: "checkmark")
                .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                .accessibilityIdentifier("review.kept.\(part.id)")
        case .undone:
            Label("Undone", systemImage: "arrow.uturn.backward")
                .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                .accessibilityIdentifier("review.undone.\(part.id)")
        case nil:
            HStack(spacing: 10) {
                // A part you changed since can't be undone: no Undo, only the reason above.
                if !part.conflict {
                    Button { undo(part.id) } label: {
                        Label("Undo", systemImage: "arrow.uturn.backward")
                    }
                    .buttonStyle(.secondary(.regular, wide: true))
                    .accessibilityIdentifier("review.undo.\(part.id)")
                }
                Button { review.keep(part.id); if review.isFinished { done() } } label: {
                    Label("Keep", systemImage: "checkmark")
                }
                .buttonStyle(.amberProminent(.regular, wide: true))
                .accessibilityIdentifier("review.keep.\(part.id)")
            }
            .labelStyle(.titleAndIcon)
        }
    }
}
