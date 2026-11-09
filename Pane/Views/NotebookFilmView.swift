import SwiftUI
#if os(macOS)
import AppKit
#endif

/// The notebook film (see NotebookFilmStore), shown the way the system shows a memory or a year in
/// review: full screen and dark whatever the appearance, the film playing, a close button, its
/// looks to pick from, and Share. On the Mac it's a dark sheet with Save… beside Share.
///
/// The film plays live (FilmPlayback), so it shows the moment the app opens and a new look shows
/// at once. Watching, it's drawn in the screen's own shape; to share, as a 4:5 film. The movie
/// file is made in the background while you watch (NotebookFilmStore.makeMovie), so Share is ready.
struct NotebookFilmView: View {
    @Bindable var store: NotebookFilmStore
    @State private var phase: Phase = .intro
    @State private var playback = FilmPlayback()
    /// The notebook at the end of the film, blurred behind the intro.
    @State private var poster: CGImage?
    @Namespace private var space
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    #if os(macOS)
    @State private var saveFailed = false
    #endif

    /// Like a year in review: an intro, the film once full screen, then the film to share.
    enum Phase { case intro, watching, share }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            switch phase {
            case .intro: intro.transition(.opacity)
            case .watching: watching.transition(.opacity)
            case .share: share.transition(.opacity)
            }
        }
        .environment(\.colorScheme, .dark)
        #if os(macOS)
        .frame(width: 440, height: 760)
        .alert("Couldn\u{2019}t save the film", isPresented: $saveFailed) { Button("OK", role: .cancel) {} }
        #endif
        .task {
            guard let script = store.script else { return }
            poster = await FilmPlayback.poster(script: script, labels: store.labels, width: 540)
            // Captures: `-filmAutoWatch` presses Watch after a moment on the intro.
            if store.forced, ProcessInfo.processInfo.arguments.contains("-filmAutoWatch") {
                try? await Task.sleep(for: .seconds(3))
                if phase == .intro { watch() }
            }
        }
        .onDisappear { playback.stop() }
        .onChange(of: playback.finished) { _, done in if done && phase == .watching { toShare() } }
        .onChange(of: store.look) { if phase == .share { play(loop: true); store.makeMovie() } }
        .onChange(of: store.folderNames) { if phase == .share { play(loop: true); store.makeMovie() } }
        .accessibilityIdentifier("notebookFilm")
    }

    private func play(loop: Bool, fromEnd: Bool = false, canvas: FilmCanvas = .shared, width: Int = Metrics.pixels) {
        guard let script = store.script else { return }
        playback.play(script: script, labels: store.labels, canvas: canvas, width: width, loop: loop, fromEnd: fromEnd)
    }

    /// The screen's shape while watching, set when it's measured.
    @State private var screen: (canvas: FilmCanvas, pixels: Int)?

    private func watch() {
        if store.movie == nil && store.making == nil { store.makeMovie() }
        if let screen { play(loop: false, canvas: screen.canvas, width: screen.pixels) } else { play(loop: false) }
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.5)) { phase = .watching }
    }

    private func toShare() {
        // Just watched: it holds on the finished notebook before it plays again.
        play(loop: true, fromEnd: true)
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.6)) { phase = .share }
    }

    // MARK: Intro

    private var intro: some View {
        ZStack {
            if let poster {
                Image(decorative: poster, scale: 1)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .blur(radius: 14)
                    .opacity(0.75)
                    .padding(.horizontal, -20)
                    .accessibilityHidden(true)
            }
            VStack(spacing: 0) {
                Spacer()
                AppMark(size: 64)
                Text("Your first month\nwith Pinto Notes")
                    .font(.system(size: 34, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white)
                    .padding(.top, 22)
                    .accessibilityAddTraits(.isHeader)
                Text("A short film of how your notes grew.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.top, 10)
                Spacer()
                Button(action: watch) {
                    Label("Watch", systemImage: "play.fill")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 50)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.black)
                .background(Capsule().fill(.white))
                .accessibilityIdentifier("notebookFilm.watch")
                Button("Not now") { store.visible = false }
                    .buttonStyle(.plain)
                    .font(.body.weight(.medium))
                    .foregroundStyle(.white.opacity(0.7))
                    .frame(minHeight: 44)
                    .padding(.top, 8)
                    .accessibilityIdentifier("notebookFilm.notNow")
            }
            .padding(.horizontal, Metrics.side + 8)
            .padding(.bottom, Metrics.bottom)
        }
    }

    // MARK: Watching

    private var watching: some View {
        GeometryReader { g in
            let insets = g.safeAreaInsets
            ZStack {
                if let frame = playback.frame {
                    Image(decorative: frame, scale: 1)
                        .resizable()
                        .interpolation(.high)
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .ignoresSafeArea()
                        .accessibilityLabel(Self.description(store.script?.stats))
                }
                VStack {
                    HStack {
                        Spacer()
                        closeButton
                    }
                    .padding(.top, Metrics.top)
                    Spacer()
                    // How far through, like a story, at the bottom.
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.22))
                        Capsule().fill(.white).frame(width: max(3, (g.size.width - Metrics.side * 2) * playback.progress))
                    }
                    .frame(height: 3)
                    .padding(.bottom, 14)
                    .accessibilityHidden(true)
                }
                .padding(.horizontal, Metrics.side)
            }
            .onAppear {
                // Drawn in the screen's own shape, clear of the close button and the bar.
                let canvas = FilmCanvas.fitting(width: g.size.width, height: g.size.height + insets.top + insets.bottom,
                                                top: insets.top + 52, bottom: insets.bottom + 24)
                let pixels = min(1206, Int(g.size.width * Metrics.displayScale))
                screen = (canvas, pixels)
                play(loop: false, canvas: canvas, width: pixels)
            }
        }
        .contentShape(Rectangle())
        // A tap goes to the end, as a story does.
        .onTapGesture { toShare() }
        .accessibilityAction(named: "Skip to the end") { toShare() }
    }

    // MARK: Share

    private var share: some View {
        VStack(spacing: 0) {
            ZStack {
                Text(NotebookFilmStore.title(store.script?.stats))
                    .font(.headline)
                    .foregroundStyle(.white)
                    .accessibilityAddTraits(.isHeader)
                HStack {
                    closeButton
                    Spacer()
                    Button(action: watch) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .background(Circle().fill(.white.opacity(0.14)))
                    .accessibilityLabel("Watch again")
                    .accessibilityIdentifier("notebookFilm.watchAgain")
                }
            }
            .padding(.top, Metrics.top)
            Spacer(minLength: 12)
            filmFrame
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(.white.opacity(store.look == .night ? 0.12 : 0), lineWidth: 0.5))
                .matchedGeometryEffect(id: "film", in: space)
            Spacer(minLength: 12)
            controls
        }
        .padding(.horizontal, Metrics.side)
        .padding(.bottom, Metrics.bottom)
    }

    private var closeButton: some View {
        Button { store.visible = false } label: {
            Image(systemName: "xmark")
                .font(.system(size: 15, weight: .semibold))
                .frame(width: 36, height: 36)
        }
        .buttonStyle(.plain)
        .foregroundStyle(.white)
        .background(Circle().fill(.white.opacity(0.14)))
        .accessibilityLabel("Close")
        .accessibilityIdentifier("notebookFilm.close")
    }

    private var filmFrame: some View {
        Group {
            if let frame = playback.frame {
                Image(decorative: frame, scale: 1)
                    .resizable()
                    .interpolation(.high)
            } else {
                Color.black
            }
        }
        .aspectRatio(CGFloat(FilmScript.width) / CGFloat(FilmScript.height), contentMode: .fit)
        .accessibilityElement()
        .accessibilityLabel(Self.description(store.script?.stats))
    }

    private var controls: some View {
        VStack(spacing: 14) {
            HStack(spacing: 8) {
                ForEach(FilmLook.allCases, id: \.self) { look in
                    chip(look.name, on: store.look == look) { store.look = look }
                        .accessibilityIdentifier("notebookFilm.look.\(look.rawValue)")
                }
                Spacer(minLength: 4)
                chip("Folders", symbol: store.folderNames ? "checkmark" : nil, on: store.folderNames) { store.folderNames.toggle() }
                    .accessibilityIdentifier("notebookFilm.folders")
            }
            HStack(spacing: 10) {
                if let script = store.script {
                    if let movie = store.movie {
                        ShareLink(item: movie, preview: SharePreview(NotebookFilmStore.title(script.stats), image: Image("MarkTight"))) {
                            Label("Share", systemImage: "square.and.arrow.up")
                                .font(.body.weight(.semibold))
                                .frame(maxWidth: .infinity, minHeight: 50)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.black)
                        .background(Capsule().fill(.white))
                        .accessibilityIdentifier("notebookFilm.share")
                    } else {
                        // Being made: says so, and how far, rather than a Share that stalls.
                        HStack(spacing: 8) {
                            ProgressView().controlSize(.small).tint(.black)
                            Text("Getting it ready\u{2026} \(Int(((store.making ?? 0) * 100).rounded()))%")
                                .font(.body.weight(.semibold))
                                .monospacedDigit()
                        }
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .foregroundStyle(.black.opacity(0.7))
                        .background(Capsule().fill(.white.opacity(0.8)))
                        .accessibilityIdentifier("notebookFilm.share")
                    }
                    #if os(macOS)
                    Button { save() } label: {
                        Text("Save\u{2026}")
                            .font(.body.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 50)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .background(Capsule().fill(.white.opacity(0.14)))
                    .disabled(store.movie == nil)
                    .accessibilityIdentifier("notebookFilm.save")
                    #endif
                }
            }
            Text("Note titles and text are never in it.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.5))
        }
    }

    private func chip(_ title: String, symbol: String? = nil, on: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let symbol { Image(systemName: symbol).font(.caption.weight(.bold)) }
                Text(title)
            }
            .font(.subheadline.weight(.medium))
            .padding(.horizontal, 14)
            .frame(height: 34)
            .foregroundStyle(on ? .black : .white)
            .background(Capsule().fill(on ? Color.white : Color.white.opacity(0.14)))
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    /// What the film shows, for VoiceOver.
    static func description(_ s: FilmStats?) -> String {
        guard let s else { return "A film of your notes growing." }
        var line = "A film of your notes growing over \(s.days) days, to \(s.notes) notes in their folders"
        if let ai = s.ai { line += ", lit up where you and \(ai) wrote" }
        return line + "."
    }

    #if os(macOS)
    private func save() {
        guard let movie = store.movie else { return }
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
        static let side: CGFloat = 20
        static let top: CGFloat = 16
        static let bottom: CGFloat = 18
        static let pixels = 800
        static let displayScale: CGFloat = 2
        #else
        static let side: CGFloat = 16
        static let top: CGFloat = 4
        static let bottom: CGFloat = 8
        static let pixels = 1080
        static let displayScale: CGFloat = 3
        #endif
    }
}

/// Plays the film live: frames drawn off the main thread at 30 a second, so it starts at once and
/// a new look starts over at once. Once through (`finished`), or looping with a pause at the end.
@MainActor
@Observable
final class FilmPlayback {
    private(set) var frame: CGImage?
    /// How far through, 0...1.
    private(set) var progress = 0.0
    /// A play-once run reached its end.
    private(set) var finished = false
    @ObservationIgnored private var task: Task<Void, Never>?

    func play(script: FilmScript, labels: FilmRenderer.Labels, canvas: FilmCanvas = .shared, width: Int, loop: Bool, fromEnd: Bool = false) {
        task?.cancel()
        finished = false
        progress = 0
        let height = Int((Double(width) * canvas.height / Double(FilmScript.width)).rounded())
        let total = Double(FilmScript.frameCount)
        task = Task.detached(priority: .userInitiated) { [weak self] in
            guard let ctx = FilmRenderer.context(width: width, height: height) else { return }
            let clock = ContinuousClock()
            if fromEnd {
                let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas)
                while renderer.frame < FilmScript.frameCount - 1 { renderer.skip() }
                renderer.drawNext(in: ctx)
                let image = ctx.makeImage()
                await MainActor.run { self?.frame = image; self?.progress = 1 }
                try? await Task.sleep(for: .seconds(4))
            }
            repeat {
                let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas)
                var next = clock.now
                while !renderer.isDone && !Task.isCancelled {
                    renderer.drawNext(in: ctx)
                    let image = ctx.makeImage()
                    let done = Double(renderer.frame) / total
                    await MainActor.run { self?.frame = image; self?.progress = done }
                    next += .milliseconds(33)
                    try? await clock.sleep(until: next)
                }
                if loop { try? await Task.sleep(for: .seconds(2.5)) }
            } while loop && !Task.isCancelled
            if !loop && !Task.isCancelled { await MainActor.run { self?.finished = true } }
        }
    }

    func stop() {
        task?.cancel()
        task = nil
    }

    /// The notebook as the film leaves it, before its last words come up.
    nonisolated static func poster(script: FilmScript, labels: FilmRenderer.Labels, width: Int) async -> CGImage? {
        await Task.detached(priority: .userInitiated) {
            let renderer = FilmRenderer(script: script, labels: labels)
            guard let ctx = FilmRenderer.context(width: width, height: width * FilmScript.height / FilmScript.width) else { return nil }
            let last = Int(FilmScript.growth * Double(FilmScript.fps))
            while renderer.frame < last { renderer.skip() }
            renderer.drawNext(in: ctx)
            return ctx.makeImage()
        }.value
    }
}

extension View {
    /// The notebook film over this view when the store says so: full screen on iPhone, a sheet on the Mac.
    func notebookFilmSheet(_ store: NotebookFilmStore) -> some View {
        modifier(NotebookFilmSheet(store: store))
    }
}

private struct NotebookFilmSheet: ViewModifier {
    @Bindable var store: NotebookFilmStore
    func body(content: Content) -> some View {
        #if os(iOS)
        content.fullScreenCover(isPresented: $store.visible) { NotebookFilmView(store: store) }
        #else
        content.sheet(isPresented: $store.visible) { NotebookFilmView(store: store) }
        #endif
    }
}
