import Supabase
import SwiftUI

/// The type and spacing of a card at the top of the note list. Mac: 13 pt like the rows under
/// it. iPhone: the list's own type sizes.
enum ListCardMetrics {
    #if os(macOS)
    static let title = Font.system(size: 13, weight: .semibold)
    static let line = Font.system(size: 12)
    static let button = Font.system(size: 13)
    static let padding: CGFloat = 12
    static let gap: CGFloat = 10
    #else
    static let title = Font.headline
    static let line = Font.subheadline
    static let button = Font.body.weight(.semibold)
    static let padding: CGFloat = 0
    static let gap: CGFloat = 12
    #endif
}

/// A green circle with a check that draws itself in, stroke by stroke.
struct DrawnCheck: View {
    var animated = true
    @State private var drawn: CGFloat = 0

    var body: some View {
        ZStack {
            Circle().trim(from: 0, to: drawn).rotation(.degrees(-90))
                .stroke(Color.green, style: StrokeStyle(lineWidth: 2, lineCap: .round))
            CheckShape().trim(from: 0, to: max(0, drawn * 1.6 - 0.6))
                .stroke(Color.green, style: StrokeStyle(lineWidth: 2.4, lineCap: .round, lineJoin: .round))
                .padding(6)
        }
        .onAppear {
            if animated { withAnimation(.easeOut(duration: 0.7).delay(0.1)) { drawn = 1 } } else { drawn = 1 }
        }
        .accessibilityHidden(true)
    }

    private struct CheckShape: Shape {
        func path(in r: CGRect) -> Path {
            var p = Path()
            p.move(to: CGPoint(x: r.minX + r.width * 0.12, y: r.midY + r.height * 0.02))
            p.addLine(to: CGPoint(x: r.minX + r.width * 0.42, y: r.maxY - r.height * 0.18))
            p.addLine(to: CGPoint(x: r.maxX - r.width * 0.08, y: r.minY + r.height * 0.2))
            return p
        }
    }
}

/// A card at the top of the note list (What's new). Mac: the native control surface inside the
/// list's margins, lifted by a soft layered shadow (a tight contact shadow under a wide, faint
/// one). iPhone: nothing here; the card sits in its own grouped section, which draws the surface,
/// insets and radius.
struct ListCardSurface: ViewModifier {
    func body(content: Content) -> some View {
        #if os(macOS)
        content.background {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color(nsColor: .controlBackgroundColor))
                .shadow(color: .black.opacity(0.06), radius: 0.5, y: 0.5)
                .shadow(color: Color(Palette.warm(Palette.brown, Palette.brown, plain: (0x000000, 0x000000))).opacity(0.10), radius: 10, y: 4)
        }
        #else
        content
        #endif
    }
}

#if os(iOS)
/// iPhone: how to send a note from Apple Notes into Amber Notes.
struct ShareHowToSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    step(1, "Open a note in Notes", "The Notes app, with the note you want to bring.")
                    step(2, "Tap Share", "The share button at the top, or ⋯ then Send a Copy.")
                    step(3, "Choose Pinto Notes", "If it isn't in the row of apps, swipe to the end and tap More.")
                    step(4, "Tap Save", "The note appears in Pinto Notes, formatting and photos included.")
                } footer: {
                    Text("To bring everything at once, use Import from Apple Notes in Pinto Notes on your Mac. It syncs here a second later.")
                }
            }
            .navigationTitle("Share Notes One by One")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
        .roomySheet()
    }

    private func step(_ n: Int, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(n)")
                .font(.callout.weight(.semibold)).monospacedDigit()
                .foregroundStyle(.tint)
                .frame(width: 24, height: 24)
                .background(.tint.opacity(0.15), in: .circle)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold))
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }
}
#endif
