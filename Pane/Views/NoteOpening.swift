import SwiftUI

/// What the note pane shows the moment a note is chosen, before the note's own view is built:
/// its title where the title will be, and a few soft lines for the text. Building a note's views
/// takes the main thread for tens of milliseconds, sometimes more; without this the old note
/// stayed on screen until the new one appeared, and a click looked lost (owner, 2026-10-12).
/// The lines only show after `delay`, so a quick open goes from the title straight to the text.
struct NoteOpening: View {
    let title: String
    let date: String

    /// Before this the pane is just the title: fast opens never show the lines.
    static let delay: Double = 0.08
    @State private var shown = false
    @State private var sweep = false
    #if DEBUG
    /// Tests: how many times a placeholder was drawn.
    nonisolated(unsafe) static var drawn = 0
    #endif

    var body: some View {
        #if DEBUG
        let _ = Self.drawn += 1
        #endif
        return VStack(alignment: .leading, spacing: 0) {
            Text(date)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color.muted)
                .frame(maxWidth: .infinity)
                .padding(.top, 14)
                .padding(.bottom, 13)
            Text(title)
                .font(Font(MarkdownStyler.titleFont))
                .foregroundStyle(Color.ink)
                .lineLimit(2)
                .padding(.horizontal, 25)
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array([0.92, 0.78, 0.86, 0.55].enumerated()), id: \.offset) { _, width in
                    GeometryReader { g in
                        Capsule().fill(Color.ink.opacity(0.08)).frame(width: g.size.width * width)
                    }
                    .frame(height: 9)
                }
            }
            .padding(.horizontal, 25)
            .padding(.top, 18)
            .mask {
                // A soft band of light passing over the lines, slowly.
                LinearGradient(stops: [.init(color: .black.opacity(0.55), location: 0), .init(color: .black, location: 0.5), .init(color: .black.opacity(0.55), location: 1)],
                               startPoint: .leading, endPoint: .trailing)
                    .scaleEffect(x: 3, anchor: sweep ? .leading : .trailing)
            }
            .opacity(shown ? 1 : 0)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color.notePage.ignoresSafeArea())
        .onAppear {
            withAnimation(.easeOut(duration: 0.2).delay(Self.delay)) { shown = true }
            withAnimation(.easeInOut(duration: 1.2).delay(Self.delay).repeatForever(autoreverses: true)) { sweep = true }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Opening \(title)")
        .accessibilityIdentifier("note.opening")
    }
}
