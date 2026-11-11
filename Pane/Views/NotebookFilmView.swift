import SwiftUI
import AVFoundation
import ImageIO
import os
import SwiftData
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

    /// What's on screen. After play, the play slide stays until the film's first frame is up, and
    /// under the film until the film has faded in over it (`filmCovers`), so its sky goes into the
    /// film's sky. Before, the film came in over black, and on a busy phone the screen stayed black
    /// for over a second; and two pictures cross-fading over black dim in the middle (11-11).
    static func layers(_ phase: Phase, galaxy: Bool, filmUp: Bool, filmCovers: Bool = false) -> (slides: Bool, intro: Bool, stage: Bool) {
        let waiting = galaxy && phase == .watching && !filmUp
        let under = galaxy && phase == .watching && !filmCovers
        return (galaxy && (phase == .intro || waiting || under), !galaxy && phase == .intro, phase != .intro && !waiting)
    }

    /// The film has faded in over the play slide, which can go.
    @State private var filmCovers = false

    var body: some View {
        GeometryReader { g in
            ZStack {
                // Your notebook as the month left it, soft behind the intro. It's the film's own
                // first picture, so pressing Watch brings it into focus rather than cutting away.
                // (An overlay, so the picture's size never changes the layout.)
                // (Black under the share screen, whose controls are white: on the cream page it
                // comes in as the film settles into its card.)
                Self.cream
                    // (The galaxy plays on black: nothing pale flashes between the slides and the film.)
                    .overlay(Color.black.opacity(store.galaxy ? 1 : pale && !dawn ? (phase == .intro ? 0 : playback.landing) : 1))
                    .overlay {
                        // (Never behind the galaxy: it would show the finished notebook before its end.)
                        if let poster, backdrop, !store.galaxy {
                            Image(decorative: poster, scale: 1)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                // The town's first morning is shown as it is; the others soft and dimmed.
                                // (On the cream page faint, so the words in ink read over it.)
                                .blur(radius: phase == .intro && !dawn ? (pale ? 3 : 2) : 0)
                                .opacity(phase == .intro && !dawn ? (pale ? 0.38 : 0.8) : 1)
                                .accessibilityHidden(true)
                        }
                    }
                    .clipped()
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                let shown = Self.layers(phase, galaxy: store.galaxy, filmUp: playback.frame != nil, filmCovers: filmCovers)
                if shown.slides { slidesView.transition(.opacity) }
                if shown.intro { intro.transition(.opacity) }
                if shown.stage { stage(g).transition(.opacity) }
            }
            // (The film's first frame fades in over the play slide, not a cut; then the slide goes.)
            .animation(reduceMotion ? nil : .smooth(duration: 0.45), value: playback.frame != nil)
            .onChange(of: playback.frame != nil) { _, up in
                guard up, !filmCovers else { return }
                Task { try? await Task.sleep(for: .seconds(reduceMotion ? 0 : 0.6)); filmCovers = true }
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
            ActivitySheet(url: file.url, title: store.shareTitle, picture: endFrame)
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
            let args = store.arguments
            if store.forced, args.contains("-filmAutoCards") {
                // Captures: goes through the slides, one every few seconds, and on into the film.
                while slideList.isEmpty { try? await Task.sleep(for: .milliseconds(100)) }
                while phase == .intro {
                    while !slideDone { try? await Task.sleep(for: .milliseconds(100)) }
                    // (Held a moment once it has played, longer on play, so a capture sees it.)
                    try? await Task.sleep(for: .seconds(atPlay ? 3.5 : 1.5))
                    nextSlide()
                }
            } else if store.forced, args.contains("-filmAutoWatch") {
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
            setUpSlides(screen)
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
    /// A light look: what's laid over the film is in ink, not white.
    private var pale: Bool { !store.look.dark || dawn }
    static let cream = Color(red: 1, green: 0.957, blue: 0.902)
    /// The intro's picture of the notebook is still under everything (until the film first ends).
    @State private var backdrop = true
    /// The last frame in a look chosen on the share screen (the film itself shows until one is).
    @State private var chosen: (key: String, frame: CGImage)?

    private func measure(_ g: GeometryProxy) {
        let insets = g.safeAreaInsets
        screen = FilmPlayback.Screen(size: CGSize(width: g.size.width, height: g.size.height + insets.top + insets.bottom),
                                     top: insets.top + FilmRow.clear, bottom: insets.bottom + 24,
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
        if store.forced, store.arguments.contains("-filmAutoShare") {
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

    // MARK: The month before the film

    /// The intro and the slides (FilmSlides): each unfolds as it comes in, drawn live, then the film.
    @State private var slides: FilmSlides?
    @State private var slideList: [FilmSlides.Slide] = []
    @State private var slide = 0
    @State private var slideFrame: CGImage?
    /// Which slide `slideFrame` is of: the play button waits for its own slide to be drawn.
    @State private var slideShown = -1
    /// The slide on screen has played to its end: only then does Next show, and a tap goes on.
    @State private var slideDone = false
    /// The sky's two paper clouds, drawn once, floating under the slides on their own.
    @State private var clouds: [CGImage] = []
    @State private var slideTask: Task<Void, Never>?
    @Environment(\.modelContext) private var modelContext

    /// The slides for this month in the shape of this screen, with your notes' names read here, on
    /// this device, and only for notes that are still there and not locked. (The demo's notes have
    /// none: they keep made-up ones.)
    private func makeSlides(_ screen: FilmPlayback.Screen) -> FilmSlides? {
        guard let input = store.input, let script = store.script else { return nil }
        var names: [UUID: String]?
        if !store.forced {
            var found: [UUID: String] = [:]
            let most = input.notes.filter { $0.removed == nil }.sorted { $0.edits.count > $1.edits.count }.prefix(12)
            // (And the notes on the pile the slides open with: what you brought in, or your first note.)
            let brought = input.notes.filter { $0.imported == true }
            let pile = (brought.isEmpty ? input.notes : brought).sorted { $0.created < $1.created }.prefix(7)
            for n in Array(most) + Array(pile) where found[n.id] == nil {
                let id = n.id
                guard let note = try? modelContext.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.id == id })).first,
                      note.deletedAt == nil, note.trashedAt == nil, note.lockedBody == nil else { continue }
                let title = note.title.trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty { found[id] = title }
            }
            names = found
        }
        var title: (@Sendable (FilmNote) -> String?)?
        if let known = names { title = { note in known[note.id] } }
        var s = FilmSlides(input: input, script: script, mark: NotebookFilmStore.mark, title: title)
        s.you = FilmSlides.firstName(ProfileStore.shared.name)
        s.cloudsApart = true
        let u = 1080 / Double(screen.size.width)
        s.H = Double(screen.size.height) * u
        s.top = Double(screen.top) * u + 60
        // The mark on the close button's row.
        s.markMiddle = (Double(screen.top) - FilmRow.clear + FilmRow.middle) * u
        // (Room under the words for the Next button.)
        s.bottom = Double(screen.bottom) * u + 70 + 64 * u
        return s
    }

    private func setUpSlides(_ screen: FilmPlayback.Screen) {
        guard store.galaxy, phase == .intro, let made = makeSlides(screen) else { return }
        slides = made
        slideList = made.slides()
        // The clouds first, so the first slide never shows without them. (Two thirds of the
        // screen's pixels: soft paper loses nothing by it.)
        let scale = Double(screen.pixels) * 2 / 3 / made.W, k = min(slide, max(0, slideList.count - 1))
        Task {
            let drawn = await Task.detached(priority: .userInitiated) { FilmSlides.clouds.indices.compactMap { made.cloudImage($0, scale: scale) } }.value
            guard slides != nil else { return }
            clouds = drawn
            show(k, screen: screen)
        }
    }

    /// Plays slide `k` coming in: frames drawn off the main thread at 30 a second, then its last
    /// frame. With Reduce Motion, just the last frame. Every frame is full size, so nothing changes
    /// size between frames.
    private func show(_ k: Int, screen: FilmPlayback.Screen) {
        guard let slides, slideList.indices.contains(k) else { return }
        slide = k
        slideDone = false
        slideTask?.cancel()
        let list = slideList, length = list[k].length, still = reduceMotion
        let full = screen.pixels, moving = full
        slideTask = Task {
            if !still {
                let clock = ContinuousClock(), began = clock.now
                while !Task.isCancelled {
                    let t = (clock.now - began) / .seconds(1)
                    if t >= length { break }
                    let image = await Self.draw(slides, k, at: t, pixels: moving, list)
                    guard !Task.isCancelled else { return }
                    #if QA
                    Self.dump(image, k, t)
                    #endif
                    slideFrame = image
                    slideShown = k
                    try? await clock.sleep(until: began + .seconds((t * 30).rounded(.down) / 30 + 1.0 / 30))
                }
            }
            guard !Task.isCancelled else { return }
            await settle(k)
        }
    }

    /// Slide `k` as it ends, and Next.
    private func settle(_ k: Int) async {
        guard let slides, let screen else { return }
        let image = await Self.draw(slides, k, at: nil, pixels: screen.pixels, slideList)
        #if QA
        Self.dump(image, k, 99)
        #endif
        guard !Task.isCancelled, slide == k else { return }
        slideFrame = image; slideShown = k
        withAnimation(reduceMotion ? nil : .easeOut(duration: 0.35)) { slideDone = true }
    }

    #if QA
    /// Captures: `-filmDumpSlides` keeps every slide frame drawn, to look for faults frame by frame.
    private static func dump(_ image: CGImage?, _ k: Int, _ t: Double) {
        guard let image, ProcessInfo.processInfo.arguments.contains("-filmDumpSlides") else { return }
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("FilmSlideFrames")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent(String(format: "%d-%05.0f.png", k, t * 1000))
        guard let d = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil) else { return }
        CGImageDestinationAddImage(d, image, nil); CGImageDestinationFinalize(d)
    }
    #endif

    private nonisolated static func draw(_ slides: FilmSlides, _ k: Int, at t: Double?, pixels: Int, _ list: [FilmSlides.Slide]) async -> CGImage? {
        await Task.detached(priority: .userInitiated) { slides.image(k, at: t, pixels: pixels, slides: list) }.value
    }

    /// A tap while a slide is still coming in finishes it (so nothing is skipped by a quick tap,
    /// Emil, 11-11: "if we are too fast, people will not look through it"); once it has, goes on.
    private func nextSlide() {
        guard !slideDone, slideList.indices.contains(slide) else { return goOn() }
        slideTask?.cancel()
        let k = slide
        slideTask = Task { await settle(k) }
    }

    private func goOn() {
        guard let screen else { return }
        if slide + 1 < slideList.count { show(slide + 1, screen: screen) } else { slideTask?.cancel(); watch() }
    }

    private func previousSlide() {
        guard let screen, slide > 0 else { return }
        show(slide - 1, screen: screen)
    }


    /// On the last slide: the film's sky and its play button.
    private var atPlay: Bool { slideList.indices.contains(slide) && slideList[slide].name == "play" }

    private var filmSky: Color {
        let c = store.script.map { GalaxyScene.sky($0) } ?? 0x15133A
        return Color(red: Double(c >> 16 & 0xFF) / 255, green: Double(c >> 8 & 0xFF) / 255, blue: Double(c & 0xFF) / 255)
    }

    /// The sky's clouds, each slowly swaying on its own (`FilmSlides.float`), under every slide and
    /// never stopping between them; still with Reduce Motion. Moved by the system, not redrawn.
    @ViewBuilder private var floatingClouds: some View {
        if let slides, !clouds.isEmpty {
            GeometryReader { g in
                let u = slides.W / max(1, Double(g.size.width))
                TimelineView(.animation(minimumInterval: 1.0 / 30, paused: reduceMotion)) { time in
                    let clock = reduceMotion ? 0 : time.date.timeIntervalSinceReferenceDate
                    ZStack(alignment: .topLeading) {
                        ForEach(clouds.indices, id: \.self) { i in
                            let place = slides.cloudPlace(i, at: clock), side = FilmSlides.cloudSide(i) / u
                            Image(decorative: clouds[i], scale: 1)
                                .resizable()
                                .frame(width: side, height: side)
                                .rotationEffect(.radians(-place.turn))
                                .position(x: place.middle.x / u, y: Double(g.size.height) - place.middle.y / u)
                        }
                    }
                }
            }
            .transition(.opacity)
            .accessibilityHidden(true)
        }
    }

    private var slidesView: some View {
        let light = slideList.indices.contains(slide) ? slideList[slide].light : false
        let ink: Color = light ? Self.cream : Color(red: 0.118, green: 0.106, blue: 0.294)
        return ZStack {
            // Drawn in the screen's own shape, behind everything, so it never sizes the controls. (Under
            // the slides, the film's sky, the colour the card grows from.)
            filmSky
                .overlay { floatingClouds }
                .overlay {
                    if let slideFrame {
                        FrameLayer(image: slideFrame)
                            .accessibilityElement()
                            .accessibilityAddTraits(.isImage)
                            .accessibilityLabel(slideList.indices.contains(slide) ? slideList[slide].spoken : "")
                    }
                }
                .clipped()
                .ignoresSafeArea()
            // Tap anywhere to go on; the left third goes back. (Not on the play slide: there, play does.)
            GeometryReader { g in
                HStack(spacing: 0) {
                    Color.clear.contentShape(Rectangle()).frame(width: g.size.width / 3)
                        .onTapGesture { previousSlide() }
                    Color.clear.contentShape(Rectangle()).onTapGesture { if !atPlay { nextSlide() } }
                }
            }
            .ignoresSafeArea()
            .accessibilityHidden(true)
            VStack(spacing: 0) {
                // Where you are: a bar for each slide (the last is the film's, with its play button).
                HStack(spacing: 4) {
                    ForEach(0..<slideList.count, id: \.self) { k in
                        Capsule().fill(ink.opacity(k <= slide ? 0.9 : 0.25)).frame(height: 3)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .accessibilityHidden(true)
                HStack {
                    Spacer()
                    closeButton
                }
                .padding(.horizontal, 16)
                .padding(.top, 10)
                Spacer()
                if atPlay, slideShown == slide {
                    // The film waits for you: press play.
                    Button(action: watch) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundStyle(Color(red: 0.118, green: 0.106, blue: 0.294))
                            .offset(x: 3)
                            .frame(width: 88, height: 88)
                            .background(Self.cream, in: Circle())
                            .shadow(color: .black.opacity(0.35), radius: 10, y: 4)
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Play the film")
                    .accessibilityIdentifier("notebookFilm.play")
                    Spacer()
                    Spacer()
                }
                // One button: Next. Tapping anywhere goes on too, but nothing said so (Emil, 11-11:
                // "Why is there no forward button, or Next button"). Sharing waits for the end
                // screen, after the film, and shares the video.
                if let label = Self.slideButton(onPlaySlide: atPlay) {
                    Button(action: nextSlide) {
                        HStack(spacing: 6) {
                            Text(label)
                            Image(systemName: "chevron.right").font(.body.weight(.bold))
                        }
                            .font(.body.weight(.semibold))
                            .foregroundStyle(light ? Color(red: 0.118, green: 0.106, blue: 0.294) : Self.cream)
                            .padding(.horizontal, 30)
                            .frame(minHeight: 48)
                            .background(ink, in: Capsule())
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut(.defaultAction)
                    .accessibilityLabel("Next")
                    .accessibilityIdentifier("notebookFilm.next")
                    .padding(.bottom, 12)
                    // (Once the slide has played: see `nextSlide`.)
                    .opacity(slideDone ? 1 : 0)
                    .allowsHitTesting(slideDone)
                }
            }
            .opacity(phase == .intro ? 1 : 0)
        }
        // (Play was pressed and the film is on its way: nothing here to press, and its words go.)
        .allowsHitTesting(phase == .intro)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("notebookFilm.slides")
        // (VoiceOver: the slide reads itself; these move between them.)
        .accessibilityAction(named: "Next") { goOn() }
        .accessibilityAction(named: "Back") { previousSlide() }
    }

    private var intro: some View {
        ZStack {
            // A darker band behind the words (not over the town's morning sky).
            if !pale {
                LinearGradient(colors: [.black.opacity(0), .black.opacity(0.62), .black.opacity(0)], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                    .accessibilityHidden(true)
            }
            VStack(spacing: 0) {
                // Over the town the words sit in the sky, above the hills.
                Spacer().frame(maxHeight: dawn ? 56 : .infinity)
                AppMark(size: 44)
                Text("\(NotebookFilmStore.title(store.script?.stats))\nwith Pinto Notes")
                    .font(.system(size: 34, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(pale ? Self.ink : .white)
                    .padding(.top, 18)
                    .accessibilityAddTraits(.isHeader)
                Text(Self.teaser(store.script?.stats))
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(pale ? Self.ink.opacity(0.75) : .white.opacity(0.78))
                    .padding(.top, 10)
                Spacer()
                Button(action: watch) {
                    Label("Watch", systemImage: "play.fill")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 50)
                }
                .buttonStyle(.plain)
                // (On the cream page the button is the site's own: ink, with the page's colour on it.)
                .foregroundStyle(pale && !dawn ? Self.cream : .black)
                .background(Capsule().fill(pale && !dawn ? Self.ink : .white))
                .accessibilityIdentifier("notebookFilm.watch")
                Button("Not now") { store.visible = false }
                    .buttonStyle(.plain)
                    .font(.body.weight(.medium))
                    .foregroundStyle(pale && !dawn ? Self.ink.opacity(0.72) : .white.opacity(0.7))
                    .frame(minHeight: 44)
                    .padding(.top, 8)
                    .accessibilityIdentifier("notebookFilm.notNow")
                // It's offered once: say where it stays.
                if !store.rewatching {
                    Text("It stays in Settings, under Help.")
                        .font(.footnote)
                        .foregroundStyle(pale && !dawn ? Self.ink.opacity(0.7) : .white.opacity(0.74))
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
        .overlay(shape.strokeBorder(.white.opacity(0.16 * p), lineWidth: 1))
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
            .padding(.top, FilmRow.top)
            Spacer()
            // How far through, like a story, at the bottom.
            ZStack(alignment: .leading) {
                Capsule().fill((pale && !dawn ? Self.ink : .white).opacity(0.22))
                Capsule().fill(pale && !dawn ? Self.ink : .white).frame(width: max(3, (width - Metrics.side * 2) * playback.progress))
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
        ZStack {
            endBackdrop
                .opacity(controlsShown ? 1 : 0)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.5), value: controlsShown)
            endReveal
        }
    }

    // MARK: The end screen (Emil, 11-11: the old one was "a weak final screen"; of three
    // options he chose this one: what your notebook is, said big like the slides, over its card).

    /// The film's sky, a shade darker so its card stands out, with the slides' clouds still floating.
    private var endBackdrop: some View {
        filmSky
            .overlay(Color.black.opacity(0.32))
            .overlay { floatingClouds.opacity(0.75) }
            .ignoresSafeArea()
            .allowsHitTesting(false)
    }

    private var watchAgainButton: some View {
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
    }

    private var endTopRow: some View {
        HStack {
            watchAgainButton.opacity(controlsShown ? 1 : 0)
            Spacer()
            closeButton
        }
        .padding(.top, FilmRow.top)
    }

    /// Where the film lands: the card it settles into is laid out here.
    private var cardSlot: some View {
        Color.clear
            .aspectRatio(CGFloat(FilmScript.width) / CGFloat(FilmScript.height), contentMode: .fit)
            .background(GeometryReader { c in
                Color.clear.preference(key: CardRectKey.self, value: c.frame(in: .named("film")))
            })
            .shadow(color: .black.opacity(0.35), radius: 18, y: 8)
    }

    /// Look and folder names, folded into one button: they're for the video you send, not the screen.
    private var optionsMenu: some View {
        Menu {
            Picker("Look", selection: $store.look) {
                ForEach(FilmLook.offered, id: \.self) { look in Text(look.name).tag(look) }
            }
            Section("Note titles and text are never in the film.") {
                Toggle("Folder names", isOn: $store.folderNames)
            }
            #if os(macOS)
            Button(Self.saveVideo) { save() }.disabled(store.movie == nil)
            #endif
        } label: {
            Image(systemName: "slider.horizontal.3")
                .font(.system(size: 17, weight: .semibold))
                .frame(width: 50, height: 50)
                .background(Circle().fill(.white.opacity(0.14)))
                .contentShape(Circle())
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .foregroundStyle(.white)
        .menuIndicator(.hidden)
        .accessibilityLabel("Video options")
        .accessibilityIdentifier("notebookFilm.options")
    }

    private var endButtons: some View {
        HStack(spacing: 10) {
            shareButton
            optionsMenu
        }
    }

    private func rising<V: View>(_ v: V, delay: Double = 0.3) -> some View {
        v.opacity(controlsShown ? 1 : 0)
            .offset(y: controlsShown ? 0 : 24)
            .animation(reduceMotion ? nil : .smooth(duration: 0.45).delay(delay), value: controlsShown)
    }

    /// What the notebook's shape says about how you wrote (FilmForm).
    static func meaning(_ form: FilmForm) -> String {
        switch form {
        case .comet: "You wrote in bursts, with days away between them."
        case .nebula: "Most of your writing went into a few folders, a cloud for each."
        case .spiral: "You wrote across many folders, an arm for each."
        }
    }

    /// What your notebook turned out to be, said big like the slides, over its card.
    private var endReveal: some View {
        let form = store.script?.form ?? .nebula
        return VStack(alignment: .leading, spacing: 0) {
            endTopRow
            rising(VStack(alignment: .leading, spacing: 4) {
                Text("Your notebook is")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(Self.cream.opacity(0.85))
                Text(GalaxyScene.name(of: form))
                    .font(.system(size: 52, weight: .heavy))
                    .foregroundStyle(Self.cream)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(Self.meaning(form))
                    .font(.callout)
                    .foregroundStyle(Self.cream.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
            .padding(.horizontal, 8)
            .padding(.top, 10), delay: 0.15)
            Spacer(minLength: 14)
            cardSlot
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 28)
            Spacer(minLength: 18)
            rising(endButtons)
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

    /// Always Share, never greyed out: if the movie is still being made, pressing it shows how far
    /// it is and opens the share sheet the moment it's ready.
    @ViewBuilder private var shareButton: some View {
        if let movie = store.movie, !shareWaiting {
            #if os(iOS)
            Button { openShare(movie) } label: { shareLabel(waiting: false) }
                .buttonStyle(.plain)
                .accessibilityIdentifier("notebookFilm.share")
            #else
            ShareLink(item: movie, preview: SharePreview(store.shareTitle, image: Image("MarkTight"))) { shareLabel(waiting: false) }
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
                Text("Preparing video\u{2026} \(Int(((store.making ?? 0) * 100).rounded()))%")
                    .monospacedDigit()
            } else {
                Image(systemName: "square.and.arrow.up")
                Text(Self.shareVideo)
            }
        }
        .font(.body.weight(.semibold))
        .frame(maxWidth: .infinity, minHeight: 50)
        .foregroundStyle(.black)
        .background(Capsule().fill(.white))
        .contentShape(Capsule())
    }

    /// The slides' one button: Next, until the last, whose play button takes over. (Share is only
    /// on the end screen, after the film.)
    static func slideButton(onPlaySlide: Bool) -> String? { onPlaySlide ? nil : "Next" }

    /// What sharing shares is the film, and the buttons say so.
    static let shareVideo = "Share video", saveVideo = "Save video\u{2026}"

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
        panel.nameFieldStringValue = store.fileName
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
            var c = FilmCanvas.fitting(width: w, height: h, top: top * (1 - p), bottom: bottom * (1 - p))
            // The mark and key on the close button's row (as a card, where they always were: the
            // card is the shared film's own shape).
            guard p < 1 else { return c }
            let u = Double(FilmScript.width) / max(1, w)
            c.row = (top - FilmRow.clear + FilmRow.middle) * u * (1 - p) + 84 * p
            c.rowRight = max(0, FilmRow.closeClear * u - 64) * (1 - p)
            return c
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
    func skipToEnd() {
        skip.withLock { $0 = true }
        if let player, player.isPlaying { player.currentTime = max(player.currentTime, soundEnd) }
    }

    /// Its sound (FilmSound), started with the film's first frame. The ringer switch silences it, and
    /// it plays over whatever else is playing rather than stopping it. Never in test runs.
    @ObservationIgnored private var player: AVAudioPlayer?
    @ObservationIgnored private var soundEnd = 0.0
    private nonisolated static let muted = (ProcessInfo.processInfo.arguments.contains("-uitest") || ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil)
        && !ProcessInfo.processInfo.arguments.contains("-filmSound")

    private func startSound(_ wav: Data, at time: Double) {
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        #endif
        guard let p = try? AVAudioPlayer(data: wav) else { return }
        p.currentTime = time
        p.prepareToPlay()
        p.play()
        player = p
    }

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
        player?.stop()
        player = nil
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
            // The sound is made alongside, and comes in where the film has got to when it's ready.
            if labels.sound, labels.startsAtFirstNote, !Self.muted {
                let start = began
                Task.detached(priority: .userInitiated) { [weak self] in
                    let wav = FilmSound(script: script).wav()
                    guard !Task.isCancelled else { return }
                    let at = (clock.now - start) / .seconds(1)
                    await MainActor.run {
                        guard let self, !skip.withLock({ $0 }), at < script.growth else { return }
                        self.soundEnd = script.growth
                        self.startSound(wav, at: at)
                    }
                }
            }
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
        player?.stop()
        player = nil
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

/// A frame of the slides on a plain layer, its picture swapped with no animation, not a SwiftUI
/// image re-laid out 30 times a second. (Emil, 11-11: "shadows flashing white" in a screen
/// recording. The frames were right every time, and screenshots never showed it: the simulator's
/// recorder adds glows along soft edges now and then, so check a fault there with screenshots.)
struct FrameLayer {
    let image: CGImage
    fileprivate static func show(_ image: CGImage, on layer: CALayer) {
        CATransaction.begin(); CATransaction.setDisableActions(true)
        layer.contentsGravity = .resizeAspectFill
        layer.masksToBounds = true
        layer.contents = image
        CATransaction.commit()
    }
}
#if os(iOS)
extension FrameLayer: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView { let v = UIView(); v.isUserInteractionEnabled = false; return v }
    func updateUIView(_ v: UIView, context: Context) { Self.show(image, on: v.layer) }
}
#else
extension FrameLayer: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView { let v = NSView(); v.wantsLayer = true; return v }
    func updateNSView(_ v: NSView, context: Context) { if let l = v.layer { Self.show(image, on: l) } }
}
#endif

extension EnvironmentValues {
    /// Where the film's card is, for the film to grow out of it (iPhone): set at the app's root.
    @Entry var filmZoom: Namespace.ID?
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
    /// The film grows out of its card and goes back into it (Emil, 11-11: the sheet sliding up
    /// "I don't like").
    @Namespace private var zoom
    /// The appearance the app is in: the film opens in the look that matches.
    @Environment(\.colorScheme) private var scheme

    func body(content: Content) -> some View {
        let binding = Binding(get: { shown }, set: { shown = $0; if !$0 { store.visible = false } })
        let waiting = store.visible && !shown && !store.asked
        let touch = DragGesture(minimumDistance: 0).onChanged { _ in store.postpone() }
        #if os(iOS)
        content
            .simultaneousGesture(touch, including: waiting ? .all : .subviews)
            .environment(\.filmZoom, zoom)
            .fullScreenCover(isPresented: binding) {
                NotebookFilmView(store: store).navigationTransition(.zoom(sourceID: FilmCard.zoomID, in: zoom))
            }
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
        try? await Task.sleep(for: .seconds(store.asked ? 0.2 : 1.5))
        if ShareAsk.lastKeystroke > store.launched { store.postpone() }
        guard store.visible else { return }
        store.follow(dark: scheme == .dark)
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

/// The top row of the slides, the film and its share screen: the close button on the right, the
/// mark (and the film's key) on the left, in line with it. (Emil, 11-11: "isn't it weird that the X
/// is not at the very highest?" It sat on a row of its own, between the bar and the mark.)
enum FilmRow {
    /// The row's top, from the safe area's top: under the slides' bar (6 + 3 + 10), and in the
    /// same place while the film plays and on the share screen, so the button never moves.
    static let top: CGFloat = 19
    /// Its middle (the button is 44 tall), where the mark sits.
    static let middle: Double = Double(top) + 22
    /// What the film keeps clear at the top, under the safe area.
    static let clear: CGFloat = 52
    /// From the right edge, past the close button's circle and a gap.
    static let closeClear: Double = 70
}
