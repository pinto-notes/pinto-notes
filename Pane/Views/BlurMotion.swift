#if os(macOS)
import AppKit
#endif
import Combine
import QuartzCore
import SwiftUI

// The website's content entrance (web/app/site.css `.rise`: blur 9px, 12px lower, 98.5% size,
// transparent, into focus over 500 ms on cubic-bezier(0.2, 0.8, 0.2, 1)) for the few places one
// page replaces another: the welcome's sign-in, the first-run steps (`OnboardingFlow.StepMove`),
// the import guides' pages and the Allow sheet's states. One blur, the whole page at once: Emil
// chose it over a staggered entrance on 13 October 2026 ("when it's an app you're supposed to use
// all the time, you should not overdo it"). Opening notes, folders and the sidebar stay instant.
// With Reduce Motion the callers use a plain fade.

enum BlurMotion {
    /// The site's curve and time for the entrance; the page before leaves quickly, as the site's
    /// view transition does (160 ms, ease-in), a little blurred on its way out.
    static let enter = Animation.timingCurve(0.2, 0.8, 0.2, 1, duration: 0.5).delay(0.06)
    static let leave = Animation.timingCurve(0.4, 0, 1, 1, duration: 0.16)

    /// A page that replaces another: the new one rises into focus, the old one fades out.
    static var page: AnyTransition {
        .asymmetric(insertion: AnyTransition(Rise.page).animation(enter),
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

        static let page = Rise(blur: 9, lift: 12, scale: 0.985)

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

/// Recording the transitions without touching the input: `-uitest -blurDemo <spot>` shows a stage that presses through the real views on a timer. Views listen for cues
/// (`blurDemoCue`) only while a demo runs.
enum BlurDemo {
    static let cue = Notification.Name("BlurDemo.cue")

    static var spot: String? {
        ProcessInfo.processInfo.arguments.contains("-uitest") ? Capture.argument("-blurDemo") : nil
    }

    @MainActor static func send(_ name: String) {
        BlurFrames.shared?.mark(name)
        NotificationCenter.default.post(name: cue, object: name)
    }
}

/// The demo's frames: every display-link callback on the main thread from the first cue to the
/// last, and the 700 ms after each cue (the transition). Written to `<tmp>/blur-frames.txt` when
/// the demo ends: per cue, frames, longest gap and hitches (a gap over 1.5 refresh intervals),
/// then the whole run. Measures the main thread, as the release gate's frame numbers do.
@MainActor final class BlurFrames: NSObject {
    static var shared: BlurFrames?
    private var link: CADisplayLink?
    private var ticks: [CFTimeInterval] = []
    private var cues: [(String, CFTimeInterval)] = []
    private var refresh: CFTimeInterval = 1.0 / 60

    static func start(in view: Any?) {
        let p = BlurFrames()
        #if os(macOS)
        guard let view = view as? NSView ?? NSApp.windows.first(where: \.isVisible)?.contentView else { return }
        p.link = view.displayLink(target: p, selector: #selector(tick(_:)))
        #else
        p.link = CADisplayLink(target: p, selector: #selector(tick(_:)))
        p.link?.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
        #endif
        p.link?.add(to: .main, forMode: .common)
        shared = p
    }

    @objc private func tick(_ l: CADisplayLink) {
        refresh = max(1.0 / 240, l.targetTimestamp - l.timestamp)
        ticks.append(l.timestamp)
    }

    func mark(_ cue: String) { cues.append((cue, CACurrentMediaTime())) }

    private func line(_ name: String, from: CFTimeInterval, to: CFTimeInterval) -> String {
        let t = ticks.filter { $0 >= from && $0 <= to }
        let gaps = zip(t.dropFirst(), t).map { ($0 - $1) * 1000 }
        let hitches = gaps.filter { $0 > refresh * 1000 * 1.5 }
        return String(format: "%@ frames %d longest %.1f ms hitches %d (refresh %.1f ms)", name, gaps.count, gaps.max() ?? 0, hitches.count, refresh * 1000)
    }

    func finish() {
        link?.invalidate()
        var out = cues.enumerated().map { i, c in line("\(i + 1) \(c.0)", from: c.1, to: c.1 + 0.7) }
        if let first = cues.first?.1 { out.append(line("all", from: first, to: CACurrentMediaTime())) }
        let url = FileManager.default.temporaryDirectory.appending(path: "blur-frames.txt")
        try? (out.joined(separator: "\n") + "\n").write(to: url, atomically: true, encoding: .utf8)
        NSLog("BLURFRAMES %@", out.joined(separator: " | "))
        Self.shared = nil
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
        await pause(.seconds(Double(Capture.argument("-blurDemoWait") ?? "") ?? 2))
        BlurFrames.start(in: nil)
        defer { BlurFrames.shared?.finish() }
        switch spot {
        case "welcome":
            BlurDemo.send("signIn"); await pause()
            BlurDemo.send("welcome"); await pause()
            BlurDemo.send("signIn"); await pause()
        case "onboarding":
            for cue in ["next", "next", "next"] { BlurDemo.send(cue); await pause() }
            BlurFrames.shared?.mark("arrived")
            preview.note = TrialNote.body + "- [ ] Call mom\n"
            preview.arrived = true
            await pause()
            BlurDemo.send("back"); await pause()
        case "import":
            guard let guide = ImportGuide.live(.keep) else { return }
            var pages: [ImportGuidePage] = guide.steps.indices.map { .step($0) }
            pages.append(.drop(.empty))
            for p in pages { BlurFrames.shared?.mark("page"); page = p; await pause() }
            BlurFrames.shared?.mark("back"); page = guide.steps.isEmpty ? .intro : .step(guide.steps.count - 1); await pause()
            BlurFrames.shared?.mark("back"); page = .intro; await pause()
        default:
            BlurFrames.shared?.mark("sheet")
            consent = CaptureScreen.consentRequest ?? ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com", loopback: false, wants_write: true)
            await pause(.seconds(2))
            BlurDemo.send("working"); await pause(.milliseconds(900))
            BlurDemo.send("done"); await pause(.seconds(2))
            consent = nil
        }
    }
}
