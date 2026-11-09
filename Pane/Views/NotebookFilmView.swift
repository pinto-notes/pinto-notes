import AVFoundation
import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The notebook film's card (see NotebookFilmStore): the film playing on a loop, a line on what it
/// is, and Share first. iPhone's share sheet has Save Video; the Mac has Save… beside Share.
struct NotebookFilmView: View {
    let store: NotebookFilmStore
    #if os(macOS)
    @State private var saveFailed = false
    #endif

    var body: some View {
        VStack(spacing: 16) {
            if let movie = store.movie {
                LoopingVideo(url: movie)
                    .aspectRatio(CGFloat(FilmScript.width) / CGFloat(FilmScript.height), contentMode: .fit)
                    .frame(maxWidth: Metrics.film)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .accessibilityLabel(Self.description(store.stats))
            }
            VStack(spacing: 6) {
                Text(Self.title(store.stats))
                    .font(Metrics.title)
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                Text(Self.line(store.stats))
                    .font(Metrics.line)
                    .foregroundStyle(Color.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .multilineTextAlignment(.center)
            VStack(spacing: Metrics.buttonGap) {
                if let movie = store.movie {
                    ShareLink(item: movie, preview: SharePreview(Self.title(store.stats))) {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }
                    .buttonStyle(.amberProminent(.form, wide: true))
                    .accessibilityIdentifier("notebookFilm.share")
                    #if os(macOS)
                    Button("Save\u{2026}") { save(movie) }
                        .buttonStyle(.secondary(.form, wide: true))
                        .accessibilityIdentifier("notebookFilm.save")
                    #endif
                }
                Button("Close") { store.visible = false }
                    .buttonStyle(.quiet)
                    .accessibilityIdentifier("notebookFilm.close")
            }
        }
        .padding(24)
        #if os(macOS)
        .frame(width: 380)
        .alert("Couldn\u{2019}t save the film", isPresented: $saveFailed) { Button("OK", role: .cancel) {} }
        #endif
        .accessibilityIdentifier("notebookFilm")
    }

    static func line(_ s: FilmStats?) -> String {
        let who = s?.ai.map { "you and \($0)" } ?? "you"
        return "Every note \(who) wrote, as it grew. Titles and words stay private."
    }

    static func title(_ s: FilmStats?) -> String {
        guard let s else { return "Your notebook" }
        return s.days < 45 ? "Your first month of notes" : "\(s.days) days of notes"
    }

    /// What the film shows, for VoiceOver.
    static func description(_ s: FilmStats?) -> String {
        guard let s else { return "A film of your notes growing." }
        var line = "A film of your notes growing over \(s.days) days, to \(s.notes) notes and \(s.links) links"
        if let ai = s.ai { line += ", lit up where you and \(ai) wrote" }
        return line + "."
    }

    #if os(macOS)
    private func save(_ movie: URL) {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "Pinto Notes \u{2013} my notebook.mp4"
        panel.allowedContentTypes = [.mpeg4Movie]
        guard panel.runModal() == .OK, let to = panel.url else { return }
        do {
            try? FileManager.default.removeItem(at: to)
            try FileManager.default.copyItem(at: movie, to: to)
        } catch {
            saveFailed = true
        }
    }
    #endif

    private enum Metrics {
        #if os(macOS)
        static let title = Font.system(size: 15, weight: .semibold)
        static let line = Font.system(size: 13)
        static let film: CGFloat = 332
        static let buttonGap: CGFloat = 8
        #else
        static let title = Font.title3.weight(.semibold)
        static let line = Font.subheadline
        static let film: CGFloat = 340
        static let buttonGap: CGFloat = 10
        #endif
    }
}

/// A movie that plays on a loop with no sound and no controls.
private struct LoopingVideo: View {
    let url: URL
    @State private var player = AVQueuePlayer()
    @State private var looper: AVPlayerLooper?

    var body: some View {
        PlayerLayerView(player: player)
            .onAppear {
                player.isMuted = true
                looper = AVPlayerLooper(player: player, templateItem: AVPlayerItem(url: url))
                player.play()
            }
            .onDisappear { player.pause() }
    }
}

#if os(macOS)
private struct PlayerLayerView: NSViewRepresentable {
    let player: AVPlayer
    func makeNSView(context: Context) -> NSView {
        let v = NSView()
        v.wantsLayer = true
        let layer = AVPlayerLayer(player: player)
        layer.videoGravity = .resizeAspect
        layer.backgroundColor = NSColor.black.cgColor
        v.layer = layer
        return v
    }
    func updateNSView(_ nsView: NSView, context: Context) {}
}
#else
private struct PlayerLayerView: UIViewRepresentable {
    let player: AVPlayer
    final class LayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
    }
    func makeUIView(context: Context) -> LayerView {
        let v = LayerView()
        (v.layer as? AVPlayerLayer)?.player = player
        (v.layer as? AVPlayerLayer)?.videoGravity = .resizeAspect
        v.backgroundColor = .black
        return v
    }
    func updateUIView(_ uiView: LayerView, context: Context) {}
}
#endif

extension View {
    /// The notebook film's card over this view when the store says so.
    func notebookFilmSheet(_ store: NotebookFilmStore) -> some View {
        modifier(NotebookFilmSheet(store: store))
    }
}

private struct NotebookFilmSheet: ViewModifier {
    @Bindable var store: NotebookFilmStore
    func body(content: Content) -> some View {
        content.sheet(isPresented: $store.visible) {
            NotebookFilmView(store: store)
                #if os(iOS)
                .presentationDetents([.large])
                #endif
                .tint(Color(PColor.paneAccent))
        }
    }
}
