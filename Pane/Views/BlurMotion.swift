import Combine
import SwiftUI

// PROTOTYPE (proto/blur-transitions, 2026-10-13): the website's content entrance (web/app/site.css
// `.rise`: blur 9px, 12px lower, 98.5% size, transparent, into focus over 500 ms on
// cubic-bezier(0.2, 0.8, 0.2, 1)) as a SwiftUI transition, for a few page changes in the app.
// Off unless launched with `-blurTransitions YES` (or the default set), so it can't reach a
// release by accident. With Reduce Motion the callers keep their plain fade.

enum BlurMotion {
    static let key = "blurTransitions"

    /// The switch. A launch argument `-blurTransitions YES` lands in the arguments domain.
    static var on: Bool { UserDefaults.standard.bool(forKey: key) }

    /// The site's curve and time for the entrance; the page before leaves quickly, as the site's
    /// view transition does (160 ms, ease-in), a little blurred on its way out.
    static let enter = Animation.timingCurve(0.2, 0.8, 0.2, 1, duration: 0.5).delay(0.06)
    static let leave = Animation.timingCurve(0.4, 0, 1, 1, duration: 0.16)

    /// A page that replaces another: the new one rises into focus, the old one fades out.
    static var page: AnyTransition {
        .asymmetric(insertion: AnyTransition(Rise(blur: 9, lift: 12, scale: 0.985)).animation(enter),
                    removal: AnyTransition(Fade(blur: 4)).animation(leave))
    }

    /// A small thing that arrives (a confirmation line): the same entrance, shorter way to travel.
    static var arrival: AnyTransition {
        .asymmetric(insertion: AnyTransition(Rise(blur: 6, lift: 8, scale: 0.97)).animation(enter),
                    removal: AnyTransition(Fade(blur: 3)).animation(leave))
    }

    struct Rise: Transition {
        var blur: CGFloat
        var lift: CGFloat
        var scale: CGFloat

        func body(content: Content, phase: TransitionPhase) -> some View {
            let away = phase != .identity
            content
                .blur(radius: away ? blur : 0)
                .scaleEffect(away ? scale : 1)
                .offset(y: away ? lift : 0)
                .opacity(away ? 0 : 1)
        }
    }

    struct Fade: Transition {
        var blur: CGFloat

        func body(content: Content, phase: TransitionPhase) -> some View {
            content
                .blur(radius: phase == .identity ? 0 : blur)
                .opacity(phase == .identity ? 1 : 0)
        }
    }
}

/// Where one page replaces another. With the blur on, the old page and the new one share their
/// place while they cross; off, they stack for that moment as they always have (a one-child VStack).
struct BlurStage<Content: View>: View {
    var alignment: Alignment
    @ViewBuilder var content: Content

    var body: some View {
        if BlurMotion.on {
            ZStack(alignment: alignment) { content }
        } else {
            VStack(spacing: 0) { content }
        }
    }
}

/// Recording the prototype without touching the input: `-uitest -blurTransitions YES -blurDemo
/// <spot>` shows a stage that presses through the real views on a timer. Views listen for cues
/// (`blurDemoCue`) only while a demo runs.
enum BlurDemo {
    static let cue = Notification.Name("BlurDemo.cue")

    static var spot: String? {
        ProcessInfo.processInfo.arguments.contains("-uitest") ? Capture.argument("-blurDemo") : nil
    }

    static func send(_ name: String) {
        NotificationCenter.default.post(name: cue, object: name)
    }
}

extension View {
    /// Runs `act` with each cue a running demo sends. Nothing is listened for otherwise.
    @ViewBuilder func blurDemoCue(_ act: @escaping (String) -> Void) -> some View {
        if BlurDemo.spot != nil {
            onReceive(NotificationCenter.default.publisher(for: BlurDemo.cue)) { note in
                if let name = note.object as? String { act(name) }
            }
        } else {
            self
        }
    }
}

/// The demo's stage: the real views, pressed through on a timer.
///   `welcome`     the welcome, Get started, and Back
///   `onboarding`  name, Continue, Continue, Continue (an AI connected), its first edit arriving, Back
///   `import`      the Google Keep guide: intro, each step, the drop page, Back
///   `connect`     the Allow sheet: Allow, the wait, Connected
struct BlurDemoStage: View {
    let spot: String
    let backend: Backend
    @State private var onboarding = OnboardingStore(defaults: UserDefaults(suiteName: "blur-demo") ?? .standard)
    @State private var preview = OnboardingFlow.Preview(name: "Sara Lindqvist", connected: ["ChatGPT"], asked: "ChatGPT")
    @State private var page: ImportGuidePage = .intro
    @State private var consent: ConnectRequest?

    /// Time to read each state before the next press.
    static let hold: Duration = .milliseconds(1500)

    var body: some View {
        stage
            .onAppear { if spot == "onboarding" { onboarding.showForPreview(.name) } }
            .task { await run() }
    }

    @ViewBuilder private var stage: some View {
        switch spot {
        case "welcome":
            WelcomeFlow(backend: backend, stage: .welcome)
                #if os(macOS)
                .cardWindow()
                #endif
        case "onboarding":
            OnboardingFlow(store: onboarding, backend: backend, preview: preview, finish: { _ in })
                #if os(macOS)
                .cardWindow()
                #endif
        case "import":
            if let guide = ImportGuide.live(.keep) {
                ImportGuideSheet(guide: guide, page: page)
                    #if os(iOS)
                    .background(Color(Palette.sheetGround).ignoresSafeArea())
                    #endif
            }
        default:
            Color(Palette.listGround)
                .ignoresSafeArea()
                #if os(macOS)
                .frame(width: 720, height: 560)
                #endif
                .sheet(item: $consent) { r in
                    ConsentSheet(client: CaptureScreen.client, requestID: r.id, initial: .asking(r), finish: { _ in })
                }
        }
    }

    private func pause(_ d: Duration = hold) async { try? await Task.sleep(for: d) }

    private func run() async {
        await pause(.seconds(2))
        switch spot {
        case "welcome":
            BlurDemo.send("signIn"); await pause()
            BlurDemo.send("welcome"); await pause()
            BlurDemo.send("signIn"); await pause()
        case "onboarding":
            for cue in ["next", "next", "next"] { BlurDemo.send(cue); await pause() }
            preview.note = TrialNote.body + "- [ ] Call mom\n"
            preview.arrived = true
            await pause()
            BlurDemo.send("back"); await pause()
        case "import":
            guard let guide = ImportGuide.live(.keep) else { return }
            var pages: [ImportGuidePage] = guide.steps.indices.map { .step($0) }
            pages.append(.drop(.empty))
            for p in pages { page = p; await pause() }
            page = guide.steps.isEmpty ? .intro : .step(guide.steps.count - 1); await pause()
            page = .intro; await pause()
        default:
            consent = CaptureScreen.consentRequest ?? ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com", loopback: false, wants_write: true)
            await pause(.seconds(2))
            BlurDemo.send("working"); await pause(.milliseconds(900))
            BlurDemo.send("done"); await pause(.seconds(2))
            consent = nil
        }
    }
}
