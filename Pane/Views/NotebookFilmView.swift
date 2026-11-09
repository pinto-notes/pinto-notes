import SwiftUI
#if os(macOS)
import AppKit
#else
import LinkPresentation
#endif

/// The notebook film (see NotebookFilmStore), shown the way the system shows a memory or a year in
/// review: full screen and dark whatever the appearance. An intro, the film once full screen, then
/// the film's last frame to share, with its looks, folder names on or off, and Share. On the Mac
/// it's a dark sheet with Save… beside Share.
///
/// The film plays live (FilmPlayback), drawn in the screen's own shape. The movie files are made in
/// the background from the intro on (NotebookFilmStore.makeMovies), so Share is ready by the end;
/// if it isn't, Share still works and opens the share sheet as soon as the movie is.
struct NotebookFilmView: View {
    @Bindable var store: NotebookFilmStore
    @State private var phase: Phase = .intro
    @State private var playback = FilmPlayback()
    /// The notebook at the end of the film, blurred behind the intro.
    @State private var poster: CGImage?
    /// The last frame of the film as it's shared, in the look chosen now.
    @State private var endFrame: CGImage?
    /// The share screen's header and controls come in just after the film settles into its card.
    @State private var controlsShown = false
    /// Share was pressed before the movie was ready: the share sheet opens when it is.
    @State private var shareWaiting = false
    #if os(iOS)
    @State private var sharing: SharedFile?
    #endif
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
            // The film steps back into its card: the full screen shrinks away as the card settles in.
            case .watching: watching.transition(.opacity.combined(with: .scale(scale: 0.9)))
            case .share: share.transition(.opacity.combined(with: .scale(scale: 1.06)))
            }
        }
        .environment(\.colorScheme, .dark)
        #if os(macOS)
        .frame(width: 440, height: 760)
        .alert("Couldn\u{2019}t save the film", isPresented: $saveFailed) { Button("OK", role: .cancel) {} }
        #else
        .sheet(item: $sharing) { file in
            ActivitySheet(url: file.url, title: "My first month", picture: endFrame)
                .presentationDetents([.medium, .large])
                .ignoresSafeArea()
        }
        #endif
        .task {
            guard let script = store.script else { return }
            // From the intro on, so Share is ready by the time the film ends.
            store.makeMovies()
            poster = await FilmPlayback.poster(script: script, labels: store.labels, width: 540)
            await refreshEnd()
            // Captures: `-filmAutoWatch` presses Watch after a moment on the intro, `-filmAutoShare`
            // presses Share a moment after the film ends.
            if store.forced, ProcessInfo.processInfo.arguments.contains("-filmAutoWatch") {
                try? await Task.sleep(for: .seconds(3))
                if phase == .intro { watch() }
            }
        }
        .onDisappear { playback.stop(); store.stopMaking() }
        .onChange(of: playback.finished) { _, done in if done && phase == .watching { toShare() } }
        .onChange(of: store.look) { lookChanged() }
        .onChange(of: store.folderNames) { lookChanged() }
        .onChange(of: store.movie) { _, movie in
            guard shareWaiting, let movie else { return }
            shareWaiting = false
            openShare(movie)
        }
        .accessibilityIdentifier("notebookFilm")
    }

    /// The screen's shape while watching, set when it's measured.
    @State private var screen: (canvas: FilmCanvas, pixels: Int)?

    private func watch() {
        store.makeMovies()
        controlsShown = false
        if let screen { playback.play(script: store.script!, labels: store.labels, canvas: screen.canvas, width: screen.pixels, loop: false) }
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.5)) { phase = .watching }
    }

    private func toShare() {
        playback.stop()
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.55)) { phase = .share }
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.45).delay(reduceMotion ? 0 : 0.4)) { controlsShown = true }
        if store.forced, ProcessInfo.processInfo.arguments.contains("-filmAutoShare") {
            Task { try? await Task.sleep(for: .seconds(2.5)); pressShare() }
        }
    }

    private func lookChanged() {
        store.makeMovies()
        Task { await refreshEnd() }
    }

    private func refreshEnd() async {
        guard let script = store.script else { return }
        let labels = store.labels
        let image = await FilmPlayback.lastFrame(script: script, labels: labels, width: Metrics.pixels)
        if labels.look == store.look, labels.folderNames == store.folderNames { endFrame = image }
    }

    private func pressShare() {
        if let movie = store.movie { openShare(movie) } else { shareWaiting = true; store.makeMovies() }
    }

    private func openShare(_ movie: URL) {
        #if os(iOS)
        sharing = SharedFile(url: movie)
        #else
        save()
        #endif
    }

    // MARK: Intro

    private var intro: some View {
        ZStack {
            if let poster {
                Image(decorative: poster, scale: 1)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .blur(radius: 3)
                    .opacity(0.5)
                    .overlay(LinearGradient(colors: [.black.opacity(0), .black.opacity(0.75), .black.opacity(0)], startPoint: .top, endPoint: .bottom))
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
                if let script = store.script { playback.play(script: script, labels: store.labels, canvas: canvas, width: pixels, loop: false) }
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
                    roundButton("play.fill", label: "Watch again", action: watch)
                        .accessibilityIdentifier("notebookFilm.watchAgain")
                }
            }
            .padding(.top, Metrics.top)
            .opacity(controlsShown ? 1 : 0)
            Spacer(minLength: 10)
            filmCard
            Spacer(minLength: 10)
            controls
                .opacity(controlsShown ? 1 : 0)
                .offset(y: controlsShown ? 0 : 20)
                .animation(reduceMotion ? nil : .smooth(duration: 0.45).delay(0.12), value: controlsShown)
        }
        .padding(.horizontal, Metrics.side)
        .padding(.bottom, Metrics.bottom)
    }

    private func roundButton(_ symbol: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .semibold))
                .frame(width: 36, height: 36)
        }
        .buttonStyle(.plain)
        .foregroundStyle(.white)
        .background(Circle().fill(.white.opacity(0.14)))
        .frame(minWidth: 44, minHeight: 44)
        .contentShape(Rectangle())
        .accessibilityLabel(label)
    }

    private var closeButton: some View {
        roundButton("xmark", label: "Close") { store.visible = false }
            .accessibilityIdentifier("notebookFilm.close")
    }

    /// The film as it will be shared, held on its last frame.
    private var filmCard: some View {
        Group {
            if let frame = endFrame ?? playback.frame {
                Image(decorative: frame, scale: 1)
                    .resizable()
                    .interpolation(.high)
            } else {
                Color.black
            }
        }
        .aspectRatio(CGFloat(FilmScript.width) / CGFloat(FilmScript.height), contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(.white.opacity(store.look == .night ? 0.14 : 0), lineWidth: 0.5))
        .contentShape(Rectangle())
        .onTapGesture(perform: watch)
        .accessibilityElement()
        .accessibilityLabel(Self.description(store.script?.stats))
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Plays it again")
    }

    private var controls: some View {
        VStack(spacing: 14) {
            Picker("Look", selection: $store.look) {
                ForEach(FilmLook.allCases, id: \.self) { look in
                    Text(look.name).tag(look)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("notebookFilm.look")
            Toggle("Folder names", isOn: $store.folderNames)
                .font(.body)
                .foregroundStyle(.white)
                .tint(.accentColor)
                .padding(.horizontal, 4)
                .accessibilityIdentifier("notebookFilm.folders")
            HStack(spacing: 10) {
                shareButton
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
            Text(store.folderNames ? "Folder names are in it. Note titles and text never are." : "Note titles, text and folder names aren\u{2019}t in it.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
                .multilineTextAlignment(.center)
        }
    }

    /// Always Share, never greyed out: if the movie is still being made, pressing it shows how far
    /// it is and opens the share sheet the moment it's ready.
    @ViewBuilder private var shareButton: some View {
        if let movie = store.movie, !shareWaiting {
            #if os(iOS)
            Button { openShare(movie) } label: { shareLabel(waiting: false) }
                .buttonStyle(.plain)
                .accessibilityIdentifier("notebookFilm.share")
            #else
            ShareLink(item: movie, preview: SharePreview("My first month", image: Image("MarkTight"))) { shareLabel(waiting: false) }
                .buttonStyle(.plain)
                .accessibilityIdentifier("notebookFilm.share")
            #endif
        } else {
            Button(action: pressShare) { shareLabel(waiting: shareWaiting) }
                .buttonStyle(.plain)
                .accessibilityIdentifier("notebookFilm.share")
        }
    }

    private func shareLabel(waiting: Bool) -> some View {
        HStack(spacing: 8) {
            if waiting {
                ProgressView(value: store.making ?? 0)
                    .progressViewStyle(.circular)
                    .controlSize(.small)
                    .tint(.black)
                Text("Preparing\u{2026} \(Int(((store.making ?? 0) * 100).rounded()))%")
                    .monospacedDigit()
            } else {
                Image(systemName: "square.and.arrow.up")
                Text("Share")
            }
        }
        .font(.body.weight(.semibold))
        .frame(maxWidth: .infinity, minHeight: 50)
        .foregroundStyle(.black)
        .background(Capsule().fill(.white))
        .contentShape(Capsule())
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
        panel.nameFieldStringValue = "Pinto Notes \u{2013} my first month.mp4"
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

    /// The film's last frame, as it's shared: what the share screen holds on.
    nonisolated static func lastFrame(script: FilmScript, labels: FilmRenderer.Labels, width: Int) async -> CGImage? {
        await Task.detached(priority: .userInitiated) {
            let renderer = FilmRenderer(script: script, labels: labels)
            guard let ctx = FilmRenderer.context(width: width, height: width * FilmScript.height / FilmScript.width) else { return nil }
            while renderer.frame < FilmScript.frameCount - 1 { renderer.skip() }
            renderer.drawNext(in: ctx)
            return ctx.makeImage()
        }.value
    }

    /// The notebook as the film leaves it, without its words: behind the intro.
    nonisolated static func poster(script: FilmScript, labels: FilmRenderer.Labels, width: Int) async -> CGImage? {
        await Task.detached(priority: .userInitiated) {
            let renderer = FilmRenderer(script: script, labels: labels, opening: false, words: false)
            guard let ctx = FilmRenderer.context(width: width, height: width * FilmScript.height / FilmScript.width) else { return nil }
            let last = FilmScript.frameCount - 1
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

/// Comes up a moment after the notes have drawn, not over a half-drawn window.
private struct NotebookFilmSheet: ViewModifier {
    @Bindable var store: NotebookFilmStore
    @State private var shown = false
    func body(content: Content) -> some View {
        let binding = Binding(get: { shown }, set: { shown = $0; if !$0 { store.visible = false } })
        #if os(iOS)
        content
            .fullScreenCover(isPresented: binding) { NotebookFilmView(store: store) }
            .task(id: store.visible) {
                guard store.visible else { shown = false; return }
                try? await Task.sleep(for: .seconds(1.5))
                if store.visible { shown = true }
            }
        #else
        content
            .sheet(isPresented: binding) { NotebookFilmView(store: store) }
            .task(id: store.visible) {
                guard store.visible else { shown = false; return }
                try? await Task.sleep(for: .seconds(1.5))
                if store.visible { shown = true }
            }
        #endif
    }
}

#if os(iOS)
/// The share sheet for the movie, opened from code (Share pressed before the movie was ready).
private struct SharedFile: Identifiable {
    let url: URL
    var id: URL { url }
}

private struct ActivitySheet: UIViewControllerRepresentable {
    let url: URL
    let title: String
    /// Shown at the top of the sheet instead of the movie's first frame.
    let picture: CGImage?
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [MovieItem(url: url, title: title, picture: picture)], applicationActivities: nil)
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

/// The movie for the share sheet, with its title and a picture of the finished notebook.
private final class MovieItem: NSObject, UIActivityItemSource {
    let url: URL, title: String, picture: CGImage?
    init(url: URL, title: String, picture: CGImage?) { self.url = url; self.title = title; self.picture = picture }
    func activityViewControllerPlaceholderItem(_ controller: UIActivityViewController) -> Any { url }
    func activityViewController(_ controller: UIActivityViewController, itemForActivityType type: UIActivity.ActivityType?) -> Any? { url }
    func activityViewControllerLinkMetadata(_ controller: UIActivityViewController) -> LPLinkMetadata? {
        let m = LPLinkMetadata()
        m.title = title
        m.originalURL = url
        if let picture { m.imageProvider = NSItemProvider(object: UIImage(cgImage: picture)) }
        return m
    }
}
#endif
