import SwiftUI
import os
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
        GeometryReader { g in
            ZStack {
                // Your notebook as the month left it, soft behind the intro. It's the film's own
                // first picture, so pressing Watch brings it into focus rather than cutting away.
                // (An overlay, so the picture's size never changes the layout.)
                Color.black
                    .overlay {
                        if let poster, backdrop {
                            Image(decorative: poster, scale: 1)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                // The town's first morning is shown as it is; the others soft and dimmed.
                                .blur(radius: phase == .intro && !dawn ? 2 : 0)
                                .opacity(phase == .intro && !dawn ? 0.8 : 1)
                                .accessibilityHidden(true)
                        }
                    }
                    .clipped()
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                if phase == .intro {
                    intro.transition(.opacity)
                } else {
                    stage(g).transition(.opacity)
                }
            }
            .onAppear { measure(g) }
            .onChange(of: g.size) { measure(g) }
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
            await refreshEnd()
            // Captures: `-filmAutoWatch` presses Watch after a moment on the intro, `-filmAutoShare`
            // presses Share a moment after the film ends.
            let args = ProcessInfo.processInfo.arguments
            if store.forced, args.contains("-filmAutoWatch") {
                try? await Task.sleep(for: .seconds(3))
                if phase == .intro { watch() }
                // `-filmAutoClose` presses the close button part way through.
                if args.contains("-filmAutoClose") {
                    try? await Task.sleep(for: .seconds(5))
                    store.visible = false
                }
            } else if store.forced, args.contains("-filmAutoNotNow") {
                try? await Task.sleep(for: .seconds(3))
                store.visible = false
            }
        }
        .task(id: screen) {
            guard let script = store.script, let screen else { return }
            poster = await FilmPlayback.poster(script: script, labels: store.labels, canvas: screen.canvas(0, card: .zero), width: screen.pixels / 2)
            // The film itself is got ready under the intro, so Watch starts it at once.
            if phase == .intro { playback.prepare(script: script, labels: store.labels, screen: screen.sized(for: store.look)) }
        }
        .onDisappear { playback.stop(); store.stopMaking() }
        .onChange(of: playback.settling) { _, settling in if settling && phase == .watching { toShare() } }
        .onChange(of: store.look) { lookChanged() }
        .onChange(of: store.folderNames) { lookChanged() }
        .onChange(of: store.movie) { _, movie in
            guard shareWaiting, let movie else { return }
            shareWaiting = false
            openShare(movie)
        }
        .accessibilityIdentifier("notebookFilm")
    }

    /// The screen while watching: its whole size in points (safe areas included), what must stay
    /// clear at the top and bottom, and how many pixels wide the film is drawn.
    @State private var screen: FilmPlayback.Screen?
    /// Where the film sits on the share screen, measured from its layout.
    @State private var cardRect = CGRect.zero
    /// The Town opens on its first morning, a pale sky: the intro's words are in ink over it, as
    /// on Pinto's own pages; the other looks keep the dark intro.
    private var dawn: Bool { store.look == .town }
    /// The intro's picture of the notebook is still under everything (until the film first ends).
    @State private var backdrop = true
    /// The last frame in a look chosen on the share screen (the film itself shows until one is).
    @State private var chosen: (key: String, frame: CGImage)?

    private func measure(_ g: GeometryProxy) {
        let insets = g.safeAreaInsets
        screen = FilmPlayback.Screen(size: CGSize(width: g.size.width, height: g.size.height + insets.top + insets.bottom),
                                     top: insets.top + 52, bottom: insets.bottom + 24,
                                     pixels: min(1206, Int(g.size.width * Metrics.displayScale)))
    }

    private func watch() {
        guard let script = store.script, let screen else { return }
        store.makeMovies()
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.45)) {
            chosen = nil
            controlsShown = false
            phase = .watching
            playback.play(script: script, labels: store.labels, screen: screen.sized(for: store.look), settle: reduceMotion ? 0 : 0.6)
        }
    }

    /// The film has begun to settle into its card: the share screen comes in round it.
    private func toShare() {
        // The film has covered the intro's picture since it began; it's not needed again.
        backdrop = false
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.3)) { phase = .share }
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.45).delay(0.3)) { controlsShown = true }
        if store.forced, ProcessInfo.processInfo.arguments.contains("-filmAutoShare") {
            Task { try? await Task.sleep(for: .seconds(2.5)); pressShare() }
        }
    }

    private func lookChanged() {
        store.makeMovies()
        Task { await refreshEnd(show: true) }
    }

    private func refreshEnd(show: Bool = false) async {
        guard let script = store.script else { return }
        let labels = store.labels
        let image = await FilmPlayback.lastFrame(script: script, labels: labels, width: Metrics.pixels)
        guard labels.look == store.look, labels.folderNames == store.folderNames, let image else { return }
        endFrame = image
        if show, phase == .share {
            withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.25)) { chosen = ("\(labels.look.rawValue)-\(labels.folderNames)", image) }
        }
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
            // A darker band behind the words (not over the town's morning sky).
            if !dawn {
                LinearGradient(colors: [.black.opacity(0), .black.opacity(0.62), .black.opacity(0)], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                    .accessibilityHidden(true)
            }
            VStack(spacing: 0) {
                // Over the town the words sit in the sky, above the hills.
                Spacer().frame(maxHeight: dawn ? 56 : .infinity)
                AppMark(size: 44)
                Text("Your first month\nwith Pinto Notes")
                    .font(.system(size: 34, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(dawn ? Self.ink : .white)
                    .padding(.top, 18)
                    .accessibilityAddTraits(.isHeader)
                Text(Self.teaser(store.script?.stats))
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(dawn ? Self.ink.opacity(0.75) : .white.opacity(0.78))
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
                // It's offered once: say where it stays.
                if !store.rewatching {
                    Text("It stays in Settings, under Help.")
                        .font(.footnote)
                        .foregroundStyle(.white.opacity(0.74))
                        .padding(.top, 2)
                }
            }
            .padding(.horizontal, Metrics.side + 8)
            .padding(.bottom, Metrics.bottom)
        }
    }

    // MARK: The film, full screen and then in its card

    /// One film the whole way: it plays over the whole screen, and at its end the same picture
    /// settles into the card the share screen is laid out round. Nothing fades or cuts between.
    private func stage(_ g: GeometryProxy) -> some View {
        let insets = g.safeAreaInsets
        let full = CGRect(x: 0, y: -insets.top, width: g.size.width, height: g.size.height + insets.top + insets.bottom)
        let card = cardRect.isEmpty ? full : cardRect
        let p = CGFloat(playback.landing)
        let rect = CGRect(x: full.minX + (card.minX - full.minX) * p, y: full.minY + (card.minY - full.minY) * p,
                          width: full.width + (card.width - full.width) * p, height: full.height + (card.height - full.height) * p)
        return ZStack {
            shareChrome
                .allowsHitTesting(phase == .share)
            film(rect: rect, p: p)
            watchChrome(width: g.size.width)
                .allowsHitTesting(phase == .watching)
        }
        .coordinateSpace(name: "film")
        .onPreferenceChange(CardRectKey.self) { rect in
            cardRect = rect
            playback.card = rect.size
        }
        .onAppear {
            // From the intro: Watch was pressed before this was on screen.
            if playback.frame == nil, let script = store.script, let screen {
                playback.play(script: script, labels: store.labels, screen: screen.sized(for: store.look), settle: reduceMotion ? 0 : 0.6)
            }
        }
    }

    private func film(rect: CGRect, p: CGFloat) -> some View {
        let shape = RoundedRectangle(cornerRadius: 14 * p, style: .continuous)
        return ZStack {
            if phase == .share, let chosen {
                Image(decorative: chosen.frame, scale: 1).resizable().interpolation(.high)
                    .id(chosen.key)
                    .transition(.opacity)
            } else if let frame = playback.frame {
                Image(decorative: frame, scale: 1).resizable().interpolation(.high)
            } else {
                Color.clear
            }
        }
        .frame(width: rect.width, height: rect.height)
        .clipShape(shape)
        .overlay(shape.strokeBorder(.white.opacity(store.look == .night ? 0.14 * p : 0), lineWidth: 0.5))
        .contentShape(Rectangle())
        // Watching, a tap goes to the end, as a story does; on the share screen it plays again.
        .onTapGesture { if phase == .watching { playback.skipToEnd() } else { watch() } }
        .position(x: rect.midX, y: rect.midY)
        .accessibilityElement()
        .accessibilityLabel(Self.description(store.script?.stats))
        .accessibilityAddTraits(.isButton)
        .accessibilityAction(named: phase == .watching ? "Skip to the end" : "Watch again") {
            if phase == .watching { playback.skipToEnd() } else { watch() }
        }
    }

    private func watchChrome(width: CGFloat) -> some View {
        VStack {
            // The close button here is the share screen's own, in the same place, so only the bar goes.
            HStack {
                Spacer()
                closeButton.opacity(phase == .watching ? 1 : 0)
            }
            .padding(.top, Metrics.top)
            Spacer()
            // How far through, like a story, at the bottom.
            ZStack(alignment: .leading) {
                Capsule().fill(.white.opacity(0.22))
                Capsule().fill(.white).frame(width: max(3, (width - Metrics.side * 2) * playback.progress))
            }
            .frame(height: 3)
            .padding(.bottom, 14)
            .opacity(phase == .watching ? 1 : 0)
            .accessibilityHidden(true)
        }
        .padding(.horizontal, Metrics.side)
    }

    // MARK: Share

    /// The share screen round the film's card. It's laid out from the start (unseen) so the film
    /// knows where it will land.
    private var shareChrome: some View {
        VStack(spacing: 0) {
            // Close is where it was while the film played (it never moves under a thumb).
            HStack {
                Button(action: watch) {
                    Label("Watch again", systemImage: "play.fill")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 14)
                        .frame(height: 36)
                        .background(Capsule().fill(.white.opacity(0.14)))
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .foregroundStyle(.white)
                .accessibilityIdentifier("notebookFilm.watchAgain")
                .opacity(controlsShown ? 1 : 0)
                Spacer()
                closeButton
            }
            .padding(.top, Metrics.top)
            Spacer(minLength: 10)
            Color.clear
                .aspectRatio(CGFloat(FilmScript.width) / CGFloat(FilmScript.height), contentMode: .fit)
                .background(GeometryReader { c in
                    Color.clear.preference(key: CardRectKey.self, value: c.frame(in: .named("film")))
                })
            Spacer(minLength: 10)
            // They rise in already whole: a white button fading up from grey looks switched off.
            controls
                .opacity(controlsShown ? 1 : 0)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.12).delay(0.3), value: controlsShown)
                .offset(y: controlsShown ? 0 : 28)
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
        // Dark enough to show on a pale sky, with an edge that shows on a dark one.
        .background(Circle().fill(.black.opacity(0.42)).overlay(Circle().strokeBorder(.white.opacity(0.16), lineWidth: 1)))
        .frame(minWidth: 44, minHeight: 44)
        .contentShape(Rectangle())
        .accessibilityLabel(label)
    }

    private var closeButton: some View {
        roundButton("xmark", label: "Close") { store.visible = false }
            .accessibilityIdentifier("notebookFilm.close")
    }

    private var controls: some View {
        VStack(spacing: 14) {
            Picker("Look", selection: $store.look) {
                ForEach(FilmLook.offered, id: \.self) { look in
                    Text(look.name).tag(look)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("notebookFilm.look")
            Toggle(isOn: $store.folderNames) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Folder names")
                        .font(.body)
                        .foregroundStyle(.white)
                    // What the switch puts in the film, said where you choose it.
                    Text((store.folderNames ? "Shown in the film." : "Left out of the film.") + " Note titles and text are never in it.")
                        .font(.footnote)
                        .foregroundStyle(.white.opacity(0.68))
                        // Room for two lines either way, so the screen doesn't shift when it's switched.
                        .lineLimit(2, reservesSpace: true)
                }
            }
                .tint(Color(red: 0.957, green: 0.678, blue: 0.2))
                .padding(.horizontal, 16)
                .padding(.vertical, 9)
                .frame(minHeight: 48)
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(.white.opacity(0.1)))
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

    /// Pinto's ink, for words on a pale sky.
    static let ink = Color(red: 0.17, green: 0.12, blue: 0.11)

    /// Under the intro's title: what's yours in it. "68 notes in 6 folders. A short film of how they grew."
    static func teaser(_ s: FilmStats?) -> String {
        guard let s, s.notes > 0 else { return "A short film of how your notes grew." }
        let notes = s.notes == 1 ? "1 note" : "\(s.notes) notes"
        let folders = s.folders > 1 ? " in \(s.folders) folders" : ""
        return "\(notes)\(folders).\nA short film of how they grew."
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

/// Plays the film live, once: frames drawn off the main thread at 30 a second in the screen's own
/// shape, so it starts at once. At its end the last frame is drawn again and again as its shape
/// goes from the screen's to the card's (`landing` 0 to 1), which the view follows with its frame.
@MainActor
@Observable
final class FilmPlayback {
    struct Screen: Sendable, Equatable {
        /// The whole screen in points, and what must stay clear at its top and bottom.
        var size: CGSize
        var top: Double, bottom: Double
        /// How wide the film is drawn.
        var pixels: Int

        /// A scenic look is drawn at two thirds of the pixels: paper shapes lose nothing by it.
        func sized(for look: FilmLook) -> Screen {
            var s = self
            if look.scenic { s.pixels = max(540, pixels * 2 / 3) }
            return s
        }

        /// The film's shape `p` of the way from the screen to a card of `card` points.
        func canvas(_ p: Double, card: CGSize) -> FilmCanvas {
            let w = size.width + (card.width - size.width) * p, h = size.height + (card.height - size.height) * p
            return .fitting(width: w, height: h, top: top * (1 - p), bottom: bottom * (1 - p))
        }
    }

    private(set) var frame: CGImage?
    /// How far through the film, 0...1.
    private(set) var progress = 0.0
    /// 0 while it plays over the whole screen; to 1 as it settles into its card.
    private(set) var landing = 0.0
    /// The film is over and it has begun to settle.
    private(set) var settling = false
    /// The card it settles into, in points; the view keeps this current.
    var card = CGSize.zero
    @ObservationIgnored private var task: Task<Void, Never>?
    @ObservationIgnored private var skip = OSAllocatedUnfairLock(initialState: false)

    /// A tap while watching: straight to the end.
    func skipToEnd() { skip.withLock { $0 = true } }

    /// What `prepare` got ready: the film and its first frame, so Watch shows it at once.
    private final class Ready: @unchecked Sendable {
        let renderer: FilmRenderer, ctx: CGContext, first: CGImage?, key: String
        init(renderer: FilmRenderer, ctx: CGContext, first: CGImage?, key: String) { self.renderer = renderer; self.ctx = ctx; self.first = first; self.key = key }
    }
    @ObservationIgnored private var ready: Task<Ready?, Never>?
    @ObservationIgnored private var readyKey = ""

    private static func key(_ labels: FilmRenderer.Labels, _ screen: Screen) -> String {
        "\(labels.look.rawValue)-\(labels.folderNames)-\(screen.pixels)-\(screen.size.width)x\(screen.size.height)"
    }

    private nonisolated static func make(script: FilmScript, labels: FilmRenderer.Labels, screen: Screen, key: String) -> Ready? {
        let canvas = screen.canvas(0, card: .zero)
        // The intro has just shown where the month ended up: it picks up from that picture.
        let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .brief)
        guard let ctx = FilmRenderer.context(width: screen.pixels, height: pixelHeight(screen.pixels, canvas)) else { return nil }
        renderer.drawNext(in: ctx)
        return Ready(renderer: renderer, ctx: ctx, first: ctx.makeImage(), key: key)
    }

    /// While the intro is up: gets the film and its first frame ready, so pressing Watch never
    /// waits and the film never starts a beat late.
    func prepare(script: FilmScript, labels: FilmRenderer.Labels, screen: Screen) {
        let key = Self.key(labels, screen)
        guard key != readyKey else { return }
        readyKey = key
        ready = Task.detached(priority: .userInitiated) { Self.make(script: script, labels: labels, screen: screen, key: key) }
    }

    func play(script: FilmScript, labels: FilmRenderer.Labels, screen: Screen, settle: Double) {
        task?.cancel()
        settling = false
        progress = 0
        landing = 0
        let skip = OSAllocatedUnfairLock(initialState: false)
        self.skip = skip
        let width = screen.pixels
        let key = Self.key(labels, screen)
        let prepared = key == readyKey ? ready : nil
        ready = nil
        readyKey = ""
        task = Task.detached(priority: .userInitiated) { [weak self] in
            guard let made = await prepared?.value ?? Self.make(script: script, labels: labels, screen: screen, key: key) else { return }
            let renderer = made.renderer, ctx = made.ctx
            // Its first frame was drawn before the clock: the film starts when it's seen.
            let first = renderer.frame - 1
            await MainActor.run { self?.frame = made.first }
            let total = Double(script.frameCount - first)
            let clock = ContinuousClock()
            var began = clock.now
            while !renderer.isDone && !Task.isCancelled {
                if skip.withLock({ $0 }) { while renderer.frame < script.frameCount - 1 { renderer.skip() } }
                // It keeps the film's own time: a frame that took a little too long to draw is
                // followed by the frame that's due now. But if the phone stalls (more than a fifth
                // of a second), the film waits for it: it never jumps ahead.
                let step = FilmPlayback.advance(frame: renderer.frame, first: first, elapsed: (clock.now - began) / .seconds(1))
                began += .seconds(step.wait)
                let due = step.frame
                while renderer.frame < min(due, script.frameCount - 1) { renderer.skip() }
                renderer.drawNext(in: ctx)
                let image = ctx.makeImage()
                let done = Double(renderer.frame - first) / total
                await MainActor.run { self?.frame = image; self?.progress = done }
                try? await clock.sleep(until: began + .seconds(Double(renderer.frame - first) / Double(FilmScript.fps)))
            }
            guard !Task.isCancelled else { return }
            let card = await MainActor.run { () -> CGSize in
                self?.settling = true
                return self?.card ?? .zero
            }
            guard card.width > 0 else { return }
            let landingBegan = clock.now
            while !Task.isCancelled {
                let x = settle <= 0 ? 1 : min(1, (clock.now - landingBegan) / .seconds(settle))
                let p = x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2
                let canvas = screen.canvas(p, card: card)
                guard let c = FilmRenderer.context(width: width, height: Self.pixelHeight(width, canvas)) else { break }
                renderer.drawHeld(in: c, canvas: canvas)
                let image = c.makeImage()
                await MainActor.run { self?.frame = image; self?.landing = p }
                if x >= 1 { break }
                try? await clock.sleep(for: .milliseconds(10))
            }
        }
    }

    /// Which frame to draw next, `elapsed` seconds after the film began, when `frame` is the next
    /// one in order: the one that's due when it's a few frames behind; after a stall, the next
    /// one in order, with the time the film waits (its clock moves on by that much).
    nonisolated static func advance(frame: Int, first: Int, elapsed: Double) -> (frame: Int, wait: Double) {
        let due = first + Int(elapsed * Double(FilmScript.fps))
        guard due - frame > 6 else { return (max(frame, due), 0) }
        return (frame, Double(due - frame) / Double(FilmScript.fps))
    }

    private nonisolated static func pixelHeight(_ width: Int, _ canvas: FilmCanvas) -> Int {
        Int((Double(width) * canvas.height / Double(FilmScript.width)).rounded())
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
            while renderer.frame < script.frameCount - 1 { renderer.skip() }
            renderer.drawNext(in: ctx)
            return ctx.makeImage()
        }.value
    }

    /// The notebook as the film leaves it, in the screen's shape and without its words: behind the intro.
    nonisolated static func poster(script: FilmScript, labels: FilmRenderer.Labels, canvas: FilmCanvas, width: Int) async -> CGImage? {
        await Task.detached(priority: .userInitiated) {
            let renderer = FilmRenderer(script: script, labels: labels, canvas: canvas, opening: .none, words: false)
            guard let ctx = FilmRenderer.context(width: width, height: pixelHeight(width, canvas)) else { return nil }
            renderer.drawOpeningPicture(in: ctx)
            return ctx.makeImage()
        }.value
    }
}

private struct CardRectKey: PreferenceKey {
    static let defaultValue = CGRect.zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let next = nextValue()
        if !next.isEmpty { value = next }
    }
}

extension View {
    /// The notebook film over this view when the store says so: full screen on iPhone, a sheet on the Mac.
    func notebookFilmSheet(_ store: NotebookFilmStore) -> some View {
        modifier(NotebookFilmSheet(store: store))
    }
}

/// At launch it comes up a moment after the notes have drawn, not over a half-drawn window; and
/// if you touch or type anything in that moment, not at all on this launch (it's never dropped on
/// what you've started). Asked for from Help, it comes up as Settings closes.
private struct NotebookFilmSheet: ViewModifier {
    @Bindable var store: NotebookFilmStore
    @State private var shown = false

    func body(content: Content) -> some View {
        let binding = Binding(get: { shown }, set: { shown = $0; if !$0 { store.visible = false } })
        let waiting = store.visible && !shown && !store.rewatching
        let touch = DragGesture(minimumDistance: 0).onChanged { _ in store.postpone() }
        #if os(iOS)
        content
            .simultaneousGesture(touch, including: waiting ? .all : .subviews)
            .fullScreenCover(isPresented: binding) { NotebookFilmView(store: store) }
            .task(id: store.visible) { await present() }
        #else
        content
            .simultaneousGesture(touch, including: waiting ? .all : .subviews)
            .sheet(isPresented: binding) { NotebookFilmView(store: store) }
            .task(id: store.visible) { await present() }
        #endif
    }

    private func present() async {
        guard store.visible else { shown = false; return }
        try? await Task.sleep(for: .seconds(store.rewatching ? 0.5 : 1.5))
        if ShareAsk.lastKeystroke > store.launched { store.postpone() }
        guard store.visible else { return }
        shown = true
        store.didPresent()
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
        let c = UIActivityViewController(activityItems: [MovieItem(url: url, title: title, picture: picture)], applicationActivities: nil)
        // Dark like the screen under it.
        c.overrideUserInterfaceStyle = .dark
        // Not back into Pinto Notes itself (its own share extension would be offered first).
        if let id = Bundle.main.bundleIdentifier { c.excludedActivityTypes = [UIActivity.ActivityType("\(id).share")] }
        return c
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
