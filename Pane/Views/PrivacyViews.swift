import SwiftUI
#if os(macOS)
import AppKit
import CoreImage
#endif

// Privacy mode's own views (PrivacyMode): the cover that asks when your screen is shared, the
// eye in the toolbar while it's on, and its settings.

/// Put on every window that shows notes: the cover while it asks, and the watching itself.
struct PrivacyCover: ViewModifier {
    @State private var mode = PrivacyMode.shared
    @Environment(\.scenePhase) private var phase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let style = PrivacyCoverStyle.active
        content
            #if os(macOS)
            // The study's pictures on the Air: -PrivacyPretendCall YES starts a pretend call.
            .task {
                guard UserDefaults.standard.bool(forKey: "PrivacyPretendCall") else { return }
                try? await Task.sleep(for: .seconds(2))
                mode.callChanged(true)
            }
            #endif
            .overlay {
                if mode.asking {
                    Group {
                        switch style {
                        case .current: PrivacyCoverView(mode: mode)
                        case .frosted: PrivacyAskCard.Frosted(mode: mode)
                        case .skeleton: PrivacyAskCard.Skeleton(mode: mode)
                        // The banner never asks: it turns privacy mode on and says so (RootView).
                        case .banner: EmptyView()
                        }
                    }
                    .transition(.opacity)
                }
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: mode.asking)
            .task { mode.watchThisDevice() }
            // Control Centre's switch, set while the app was behind it.
            .onChange(of: phase, initial: true) { _, now in if now == .active { mode.takeUpControl() } }
    }
}

extension View {
    func privacyCover() -> some View { modifier(PrivacyCover()) }

    /// A note's preview, blurred while privacy mode is on (PreviewBlur).
    func previewBlur(revealsOnHover: Bool = true) -> some View {
        modifier(PrivacyPreviewBlur(revealsOnHover: revealsOnHover))
    }

    /// A note's title anywhere notes are listed (the list, the gallery, Go to Note, the menu bar,
    /// a folder's cards): on the Mac, blurred while privacy mode is on, unless it's the open note's
    /// or the list it's in shows its titles (ListTitleReveal). The iPhone's titles never are.
    func privacyTitleBlur(open: Bool = false) -> some View {
        modifier(PrivacyTitleBlur(open: open))
    }
}

/// `privacyTitleBlur()`.
struct PrivacyTitleBlur: ViewModifier {
    var open = false
    @State private var mode = PrivacyMode.shared
    @Environment(\.listTitleReveal) private var reveal
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let blurred = ListTitleReveal.blurs(privacyOn: mode.isOn, open: open, revealed: reveal?.shown ?? false)
        content
            .privacyBars(blurred)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: blurred)
    }
}

/// `previewBlur()`: PreviewBlur, on while privacy mode is.
struct PrivacyPreviewBlur: ViewModifier {
    var revealsOnHover = true
    @State private var mode = PrivacyMode.shared

    func body(content: Content) -> some View {
        content.modifier(PreviewBlur(on: mode.isOn, revealsOnHover: revealsOnHover))
    }
}

/// "Your screen is being shared. Hide your notes?" over the whole window, frosted (solid with
/// Reduce Transparency). While it shows, it is what hides the notes.
struct PrivacyCoverView: View {
    let mode: PrivacyMode
    @State private var remember = false
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        ZStack {
            Group {
                if reduceTransparency {
                    Color.notePage
                } else {
                    Rectangle().fill(.regularMaterial)
                }
            }
            .ignoresSafeArea()
            // Every click and tap lands on the cover, not on the notes under it.
            .contentShape(Rectangle())
            .onTapGesture {}
            .accessibilityHidden(true)
            card
        }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
        .accessibilityIdentifier("privacy.cover")
    }

    private var card: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 30, weight: .regular))
                .foregroundStyle(Color.amberInk)
                .accessibilityHidden(true)
            VStack(spacing: 4) {
                Text(mode.coverTitle)
                    .font(titleFont)
                    .multilineTextAlignment(.center)
                    .accessibilityAddTraits(.isHeader)
                Text(PrivacyWords.coverQuestion)
                    .foregroundStyle(.secondary)
            }
            rememberBox
            buttons
        }
        .padding(28)
        .frame(maxWidth: 380)
    }

    private var titleFont: Font {
        #if os(macOS)
        .system(size: 17, weight: .semibold)
        #else
        .title3.weight(.semibold)
        #endif
    }

    @ViewBuilder private var rememberBox: some View {
        #if os(macOS)
        Toggle(PrivacyWords.remember, isOn: $remember)
            .toggleStyle(.checkbox)
            .accessibilityIdentifier("privacy.remember")
        #else
        // iOS has no checkbox: a tick in a circle beside the words, as Notes' checklists.
        Button { remember.toggle() } label: {
            Label(PrivacyWords.remember, systemImage: remember ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(.primary)
        }
        .buttonStyle(.plain)
        .accessibilityValue(remember ? "On" : "Off")
        .accessibilityAddTraits(remember ? [.isSelected] : [])
        .accessibilityIdentifier("privacy.remember")
        #endif
    }

    @ViewBuilder private var buttons: some View {
        let show = Button(PrivacyWords.show) { mode.answer(hide: false, remember: remember) }
            .buttonStyle(.secondary)
            .accessibilityIdentifier("privacy.show")
        let hide = Button(PrivacyWords.hide) { mode.answer(hide: true, remember: remember) }
            .buttonStyle(.amberProminent)
            .keyboardShortcut(.defaultAction)
            .accessibilityIdentifier("privacy.hide")
        #if os(macOS)
        // The default on the right, as in a Mac alert.
        HStack(spacing: 10) { show; hide }
        #else
        VStack(spacing: 10) { hide.frame(maxWidth: .infinity); show.frame(maxWidth: .infinity) }
        #endif
    }
}

// MARK: The study (17 November 2026)

/// How privacy mode tells you it's there when a call starts or your screen is shared. A study:
/// Emil tried the frosted cover in a real call and it looked broken (an empty grey window with the
/// toolbar floating on it), and "Blur previews" didn't say what it would do. Only tests and
/// captures choose a style (PrivacyCoverStudyShots); the app ships `.current`.
enum PrivacyCoverStyle: String, Sendable, CaseIterable {
    /// The frosted cover over the whole window, asking (what ships).
    case current
    /// A: on by itself, and a slim line under the toolbar says so, with Turn Off.
    case banner
    /// B: the app frosted past reading behind a small card: Turn on privacy mode?
    case frosted
    /// C: the app's layout as grey bars, with the same card.
    case skeleton

    /// Set by the study's pictures and tests (not saved).
    @MainActor static var chosen: PrivacyCoverStyle {
        get { PrivacyStudy.shared.style }
        set { PrivacyStudy.shared.style = newValue }
    }

    @MainActor static var active: PrivacyCoverStyle { PrivacyStudy.shared.style }

    /// While privacy mode is on, the line under the toolbar says so, not the eye.
    var usesBanner: Bool { self != .current }
}

/// The study's choice, from the Privacy Study menu (this branch only): kept between launches.
@MainActor @Observable final class PrivacyStudy {
    static let shared = PrivacyStudy()
    static let key = "PrivacyStudyStyle"
    /// The unit tests' host shares the installed app's settings: it always starts from what ships.
    var style: PrivacyCoverStyle = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil ? .current
        : UserDefaults.standard.string(forKey: PrivacyStudy.key).flatMap(PrivacyCoverStyle.init(rawValue:)) ?? .current

    func choose(_ style: PrivacyCoverStyle) {
        self.style = style
        UserDefaults.standard.set(style.rawValue, forKey: Self.key)
    }
}

#if os(macOS)
/// The Privacy Study menu: A or B, and a pretend call to see it without one.
struct PrivacyStudyMenu: View {
    @State private var study = PrivacyStudy.shared
    @State private var mode = PrivacyMode.shared

    var body: some View {
        Picker("When a Call Starts", selection: Binding(get: { study.style }, set: { study.choose($0) })) {
            Text("A: Turn On and Say So").tag(PrivacyCoverStyle.banner)
            Text("B: Ask on a Card").tag(PrivacyCoverStyle.frosted)
            Text("As It Ships Today").tag(PrivacyCoverStyle.current)
        }
        .pickerStyle(.inline)
        Divider()
        Picker("Hidden Text", selection: Binding(get: { UserDefaults.standard.string(forKey: "PrivacyStudyText") ?? "blur" },
                                                  set: { UserDefaults.standard.set($0, forKey: "PrivacyStudyText") })) {
            Text("Blur").tag("blur")
            Text("Bars").tag("bars")
        }
        .pickerStyle(.inline)
        Divider()
        Toggle("Pretend I\u{2019}m in a Call", isOn: Binding(get: { mode.inCall }, set: { mode.callChanged($0) }))
    }
}
#endif

/// The study's words. "Privacy mode" says what it is; "previews" didn't.
enum PrivacyStudyWords {
    static let question = "Turn on privacy mode?"
    static let turnOn = "Turn On"
    static let notNow = "Not Now"
    static let turnOff = "Turn Off"
    static let on = "Privacy mode is on"
}

/// Where the window's columns are, for the study's skeleton and banner (global coordinates).
@MainActor @Observable final class PrivacyStudyColumns {
    static let shared = PrivacyStudyColumns()
    var sidebar: CGRect = .zero
    var list: CGRect = .zero
    var note: CGRect = .zero
}

extension View {
    /// Reports this column's frame to PrivacyStudyColumns (debug and QA builds only).
    @ViewBuilder func privacyStudyColumn(_ column: ReferenceWritableKeyPath<PrivacyStudyColumns, CGRect>) -> some View {
        #if DEBUG || QA
        onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { PrivacyStudyColumns.shared[keyPath: column] = $0 }
        #else
        self
        #endif
    }
}

/// B and C's card: you're in a call, turn on privacy mode? Not Now and Turn On, the default on
/// the right as in a Mac alert. Remember this moves to Settings.
struct PrivacyAskCard: View {
    let mode: PrivacyMode
    /// B's frost: the shapes of the columns show, no word can be read.
    static let frost: CGFloat = 16

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        VStack(spacing: 14) {
            Image(systemName: "eye.slash")
                .font(.system(size: 26, weight: .regular))
                .foregroundStyle(Color.amberInk)
                .accessibilityHidden(true)
            VStack(spacing: 4) {
                Text(mode.coverTitle)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .accessibilityAddTraits(.isHeader)
                Text(PrivacyStudyWords.question)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.muted)
            }
            .multilineTextAlignment(.center)
            HStack(spacing: 8) {
                Button(PrivacyStudyWords.notNow) { mode.answer(hide: false, remember: false) }
                    .buttonStyle(.secondary(.compact, wide: true))
                    .accessibilityIdentifier("privacy.notNow")
                Button(PrivacyStudyWords.turnOn) { mode.answer(hide: true, remember: false) }
                    .buttonStyle(.amberProminent(.compact, wide: true))
                    .keyboardShortcut(.defaultAction)
                    .accessibilityIdentifier("privacy.turnOn")
            }
            .padding(.top, 4)
        }
        .padding(.horizontal, 22)
        .padding(.top, 22)
        .padding(.bottom, 18)
        .frame(width: 292)
        .background(Color(Palette.card), in: shape)
        .overlay(shape.strokeBorder(Color.line, lineWidth: 0.5))
        .shadow(color: .black.opacity(0.16), radius: 28, y: 10)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
        .accessibilityIdentifier("privacy.card")
    }

    /// B: the window as it was a moment ago, frosted past reading (PrivacyFrost), a light wash
    /// over it, and the card. (SwiftUI's blur on the window's content lost the split view's safe
    /// area: the columns jumped up under the toolbar.)
    struct Frosted: View {
        let mode: PrivacyMode
        var body: some View {
            ZStack {
                // The system's own frost, drawn by the window server (a still blurred by hand
                // turned the sidebar's glass into a white slab in a real window, 17 November).
                Rectangle().fill(.ultraThinMaterial).ignoresSafeArea()
                    .accessibilityHidden(true)
                // A click outside the card doesn't trap you: privacy mode turns on and you carry on.
                Color(Palette.page).opacity(0.15)
                    .ignoresSafeArea()
                    .contentShape(Rectangle())
                    .onTapGesture { mode.answer(hide: true, remember: false) }
                    .accessibilityHidden(true)
                PrivacyAskCard(mode: mode)
            }
        }
    }

    /// C: the window's columns where they are, with grey bars for every line of text, and the card.
    struct Skeleton: View {
        let mode: PrivacyMode
        var body: some View {
            ZStack {
                GeometryReader { proxy in
                    PrivacySkeleton(origin: proxy.frame(in: .global).origin, columns: PrivacyStudyColumns.shared)
                }
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture {}
                .accessibilityHidden(true)
                PrivacyAskCard(mode: mode)
            }
        }
    }
}

#if os(macOS)
/// B's frost: a picture of what's behind it in the window, taken as it appears, blurred. A still
/// is enough: nothing behind it can be used or read until the card is answered.
struct PrivacyFrost: NSViewRepresentable {
    var radius: CGFloat

    func makeNSView(context: Context) -> FrostView { FrostView(radius: radius) }
    func updateNSView(_ view: FrostView, context: Context) {}

    final class FrostView: NSView {
        let radius: CGFloat
        init(radius: CGFloat) {
            self.radius = radius
            super.init(frame: .zero)
            wantsLayer = true
            layer?.contentsGravity = .resize
        }
        required init?(coder: NSCoder) { fatalError() }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            DispatchQueue.main.async { [weak self] in self?.freeze() }
        }

        /// Draws the window's content behind this view, blurs it and shows it.
        func freeze() {
            // The window's frame view: drawn the right way up (its layer isn't flipped).
            guard let rootLayer = window?.contentView?.superview?.layer, let mine = layer else { return }
            let scale = window?.backingScaleFactor ?? 2
            guard let behind = LayerSnapshot.behind(mine, in: rootLayer, scale: scale),
                  let blurred = LayerSnapshot.blur(behind, radius: radius * scale) else { return }
            let r = mine.convert(mine.bounds, to: rootLayer)
            mine.contents = LayerSnapshot.crop(blurred, to: r, in: rootLayer.bounds, scale: scale)
        }
    }
}

/// Pictures of a window's layers as Core Animation would show them, made by hand: what lies
/// behind a layer (the frost), a part blurred. render(in:) skips filters and backdrops.
@MainActor enum LayerSnapshot {
    /// Every layer under `root`, in the order they're painted (each before its sublayers).
    static func paintOrder(_ root: CALayer) -> [CALayer] {
        [root] + (root.sublayers ?? []).flatMap { paintOrder($0) }
    }

    /// `root` (a layer that isn't flipped) drawn with `layer` and everything painted after it hidden (`keep`: its own
    /// sublayers stay), at `scale`.
    static func behind(_ layer: CALayer, in root: CALayer, scale: CGFloat, keep: Bool = false) -> CGImage? {
        let order = paintOrder(root)
        guard let at = order.firstIndex(where: { $0 === layer }) else { return nil }
        var ancestors = Set<ObjectIdentifier>()
        var up = layer.superlayer
        while let l = up { ancestors.insert(ObjectIdentifier(l)); up = l.superlayer }
        let mine = keep ? Set(paintOrder(layer).map(ObjectIdentifier.init)) : []
        var hidden: [CALayer] = []
        for l in order[at...] where !ancestors.contains(ObjectIdentifier(l)) && !mine.contains(ObjectIdentifier(l)) && !l.isHidden {
            // Hiding a layer hides what's under it: its sublayers needn't be listed.
            if let s = l.superlayer, hidden.contains(where: { $0 === s }) { continue }
            l.isHidden = true
            hidden.append(l)
        }
        defer { hidden.forEach { $0.isHidden = false } }
        return draw(root, scale: scale)
    }

    static func draw(_ root: CALayer, scale: CGFloat) -> CGImage? {
        let size = root.bounds.size
        guard let ctx = CGContext(data: nil, width: Int(size.width * scale), height: Int(size.height * scale), bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.scaleBy(x: scale, y: scale)
        root.render(in: ctx)
        return ctx.makeImage()
    }

    static func blur(_ image: CGImage, radius: CGFloat) -> CGImage? {
        let input = CIImage(cgImage: image)
        let out = input.clampedToExtent().applyingGaussianBlur(sigma: radius).cropped(to: input.extent)
        return CIContext(options: nil).createCGImage(out, from: input.extent)
    }

    /// The part of a picture of `bounds` (drawn at `scale`) that `rect` covers.
    static func crop(_ image: CGImage, to rect: CGRect, in bounds: CGRect, scale: CGFloat, flipped: Bool = false) -> CGImage? {
        let top = flipped ? rect.minY : bounds.height - rect.maxY
        return image.cropping(to: CGRect(x: rect.minX * scale, y: top * scale, width: rect.width * scale, height: rect.height * scale).integral)
    }
}
#endif

/// The app's three columns drawn as a loading skeleton: the sidebar's folders, the list's rows (a
/// title and a preview each) and the note's title and paragraphs, all grey bars.
struct PrivacySkeleton: View {
    let origin: CGPoint
    let columns: PrivacyStudyColumns
    @Environment(\.colorScheme) private var scheme

    private var bar: Color { Color.primary.opacity(scheme == .dark ? 0.13 : 0.08) }
    private var titleBar: Color { Color.primary.opacity(scheme == .dark ? 0.2 : 0.13) }

    private func local(_ r: CGRect) -> CGRect { r.offsetBy(dx: -origin.x, dy: -origin.y) }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(Palette.page)
            let list = local(columns.list), note = local(columns.note), side = local(columns.sidebar)
            Color(Palette.listGround).frame(width: max(list.width, 0), height: max(list.height, 0)).offset(x: list.minX, y: list.minY)
            if side.width > 0 {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(scheme == .dark ? Color(white: 0.11) : Color(white: 0.93))
                    .frame(width: side.width - 16, height: side.height - 16)
                    .offset(x: side.minX + 8, y: side.minY + 8)
                sidebarRows.offset(x: side.minX + 24, y: side.minY + 70)
            }
            listRows(width: list.width - 40).offset(x: list.minX + 20, y: list.minY + 100)
            noteLines(width: min(note.width - 96, 680)).offset(x: note.minX + 48, y: note.minY + 92)
        }
    }

    private func pill(_ w: CGFloat, _ h: CGFloat, _ c: Color) -> some View {
        RoundedRectangle(cornerRadius: h / 2, style: .continuous).fill(c).frame(width: max(w, 0), height: h)
    }

    private var sidebarRows: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(Array([96.0, 70, 58, 84, 64, 110, 76].enumerated()), id: \.offset) { i, w in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 4).fill(bar).frame(width: 16, height: 14)
                    pill(w, 10, i == 0 ? titleBar : bar)
                }
                .padding(.top, i == 1 ? 18 : 0)
            }
        }
    }

    private func listRows(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 30) {
            ForEach(Array([0.62, 0.48, 0.7, 0.4, 0.55, 0.66, 0.45, 0.58, 0.5, 0.64].enumerated()), id: \.offset) { i, f in
                VStack(alignment: .leading, spacing: 9) {
                    pill(width * f, 11, titleBar)
                    pill(width * (0.78 + Double(i % 3) * 0.07), 9, bar)
                }
            }
        }
    }

    private func noteLines(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 13) {
            pill(width * 0.42, 22, titleBar).padding(.bottom, 18)
            ForEach(Array([[1.0, 0.96, 0.98, 0.6], [0.97, 1.0, 0.74], [0.3], [0.94, 0.99, 0.97, 0.88, 0.42], [1.0, 0.82]].enumerated()), id: \.offset) { i, para in
                VStack(alignment: .leading, spacing: 11) {
                    ForEach(Array(para.enumerated()), id: \.offset) { _, f in pill(width * f, 10, i == 2 ? titleBar : bar) }
                }
                .padding(.bottom, 14)
            }
        }
    }
}

/// The study's notice (A): privacy mode is on, in the sidebar's foot where its other cards sit, so
/// nothing lies over the note (Emil, 17 November 2026: "move this into the sidebar so it's not in
/// the way of my note"). The reason under it when a call or sharing turned it on; Turn Off beside.
struct PrivacySidebarCard: View {
    let mode: PrivacyMode
    @State private var hovering = false

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: SidebarCardMetrics.radius, style: .continuous)
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Image(systemName: "eye.slash")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.amberInk)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(PrivacyStudyWords.on)
                    .font(SidebarCardMetrics.title)
                    .foregroundStyle(Color.ink)
                if let reason = mode.announcementReason {
                    Text(reason)
                        .font(SidebarCardMetrics.line)
                        .foregroundStyle(Color.muted)
                }
                // Turn Off as the other sidebar cards say what they do: a line in the accent.
                Button(PrivacyStudyWords.turnOff) { mode.toggle() }
                    .buttonStyle(.plain)
                    .font(SidebarCardMetrics.button)
                    .foregroundStyle(Color.amberInk)
                    .opacity(hovering ? 0.75 : 1)
                    .frame(minHeight: SidebarCardMetrics.buttonHeight)
                    .contentShape(.rect)
                    .onHover { hovering = $0 }
                    .accessibilityIdentifier("privacy.sidebarTurnOff")
            }
            .lineLimit(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, SidebarCardMetrics.padding)
        .padding(.top, SidebarCardMetrics.padding)
        .padding(.bottom, SidebarCardMetrics.padding - 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(Palette.rowPillHover), in: shape)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("privacy.sidebarCard")
    }
}

/// The eye in the toolbar while privacy mode is on: it says so, and turns it off.
struct PrivacyEyeButton: View {
    @State private var mode = PrivacyMode.shared

    var body: some View {
        // The study's card in the sidebar says it instead (PrivacySidebarCard).
        if mode.isOn && !PrivacyCoverStyle.active.usesBanner {
            Button(PrivacyWords.turnOff, systemImage: "eye.slash") { mode.toggle() }
                .labelStyle(.iconOnly)
                .foregroundStyle(Color.amberInk)
                .help(PrivacyWords.help)
                .accessibilityIdentifier("privacy.eye")
        }
    }
}

/// Settings › Privacy › Privacy mode: on or off now, and what happens when your screen is shared.
struct PrivacyModeSection: View {
    @State private var mode = PrivacyMode.shared

    var body: some View {
        Section {
            Toggle(PrivacyWords.name, isOn: Binding(get: { mode.isOn }, set: { mode.setManual($0) }))
                .settingsSwitch()
                .accessibilityIdentifier("settings.privacyMode")
            #if os(macOS)
            // The Mac hears calls too (CallDetection), and each keeps its own answer.
            Picker(PrivacyWords.whenInCallTitle, selection: Binding(get: { mode.whenInCall }, set: { mode.whenInCall = $0 })) {
                ForEach(PrivacyMode.WhenShared.allCases) { Text($0.title).tag($0) }
            }
            .accessibilityIdentifier("settings.privacyWhenInCall")
            #endif
            Picker(Self.pickerTitle, selection: Binding(get: { mode.whenShared }, set: { mode.whenShared = $0 })) {
                ForEach(PrivacyMode.WhenShared.allCases) { Text($0.title).tag($0) }
            }
            .accessibilityIdentifier("settings.privacyWhenShared")
        } footer: {
            Text(Self.footer).foregroundStyle(.secondary)
        }
    }

    /// When sharing starts, on both (the Mac's calls have their own, above it).
    static var pickerTitle: String { PrivacyWords.whenSharedTitle }

    static var footer: String {
        #if os(macOS)
        "\(PrivacyWords.settingsFooter) \(PrivacyWords.whenSharedFooterMac) Calls count in Teams, Zoom, FaceTime, Slack and other meeting apps, and in browsers. You can also use View \u{203A} \(PrivacyWords.menuTitle) (\u{2303}\u{2318}P)."
        #else
        "\(PrivacyWords.settingsFooterPhone) \(PrivacyWords.whenSharedFooter) You can also add it to Control Centre."
        #endif
    }
}

// MARK: Titles in the Mac's list

/// The Mac's note list while privacy mode is on: its titles are blurred until you point anywhere
/// at the list, or move through it with the arrow keys while it has the keys (Emil, 13 November
/// 2026). They blur again a moment after the pointer leaves, so brushing past on the way to the
/// toolbar doesn't flicker. The open note's title always shows. One for each list.
@MainActor @Observable final class ListTitleReveal {
    /// How long the titles stay sharp after the pointer leaves (or the keys move on).
    static let delay: Duration = .milliseconds(300)

    /// The titles show now.
    private(set) var shown = false
    private var over = false
    private var navigating = false
    @ObservationIgnored private let delay: Duration
    @ObservationIgnored private var pending: Task<Void, Never>?

    init(delay: Duration = ListTitleReveal.delay) { self.delay = delay }

    /// The pointer came over the list, or left it.
    func pointer(_ inside: Bool) { over = inside; update() }
    /// An arrow key moved the selection while the list had the keys.
    func navigated() { navigating = true; update() }
    /// The list got or lost the keys; losing them ends moving through it.
    func focus(_ focused: Bool) { if !focused { navigating = false; update() } }

    private func update() {
        pending?.cancel()
        pending = nil
        if over || navigating {
            shown = true
        } else if shown {
            pending = Task { [weak self, delay] in
                try? await Task.sleep(for: delay)
                guard !Task.isCancelled else { return }
                self?.shown = false
            }
        }
    }

    /// Whether a row's title is blurred: on the Mac, with privacy mode on, unless it's the open
    /// note's or the list shows its titles. The iPhone's titles never are.
    nonisolated static func blurs(privacyOn: Bool, open: Bool, revealed: Bool) -> Bool {
        #if os(macOS)
        privacyOn && !open && !revealed
        #else
        false
        #endif
    }
}

extension EnvironmentValues {
    /// The list's title reveal (ListTitleReveal); nil outside a list, where titles blur while privacy mode is on.
    @Entry var listTitleReveal: ListTitleReveal? = nil
}

#if os(macOS)
/// Gives a list its title reveal: one hover region for the whole list, and its arrow keys.
struct RevealsTitles: ViewModifier {
    @State private var reveal = ListTitleReveal()
    @FocusState private var focused: Bool

    func body(content: Content) -> some View {
        content
            .environment(\.listTitleReveal, reveal)
            .onHover { reveal.pointer($0) }
            // Arrow keys move the list's selection; moving through the list shows its titles while
            // it keeps the keys. Ignored, so the list still moves.
            .onKeyPress(keys: [.upArrow, .downArrow, .pageUp, .pageDown, .home, .end], phases: .down) { _ in
                reveal.navigated()
                return .ignored
            }
            .focused($focused)
            .onChange(of: focused) { _, now in reveal.focus(now) }
    }
}
#endif
