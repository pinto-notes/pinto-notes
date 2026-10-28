import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Every step of the first-run flow, in the real views, light and dark: the Mac's card window,
/// and an iPhone at the default and the largest text size. Offscreen: nothing touches the screen. Runs only when
/// AMBER_HIG_SHOTS is set. Mac: `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh
/// PaneTests/OnboardingSnapshots`; iPhone: the same test on a simulator.
@MainActor @Suite(.serialized) struct OnboardingSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    struct Shot {
        let name: String
        let step: Onboarding.Step
        var preview = OnboardingFlow.Preview()
        /// Where the flow began: Bring when the name was known.
        var first: Onboarding.Step = .name
    }

    static let withCallMom = TrialNote.body + "- [ ] Call mom\n"

    static let shots: [Shot] = [
        Shot(name: "2-name-prefilled", step: .name, preview: .init(name: "Sara Lindqvist")),
        Shot(name: "2-name-empty", step: .name),
        Shot(name: "3-bring", step: .bring),
        Shot(name: "3-bring-after-import", step: .bring, preview: .init(brought: 35)),
        Shot(name: "3-bring-name-known", step: .bring, first: .bring),
        Shot(name: "4-connect", step: .connect),
        Shot(name: "4-connect-connected", step: .connect, preview: .init(connected: ["Claude Code"])),
        Shot(name: "5-try-it-chatgpt", step: .tryIt, preview: .init(connected: ["ChatGPT"])),
        Shot(name: "5-try-it-chatgpt-asked", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT")),
        Shot(name: "5-try-it-claude", step: .tryIt, preview: .init(connected: ["Claude"])),
        Shot(name: "5-try-it-claude-asked", step: .tryIt, preview: .init(connected: ["Claude"], asked: "Claude")),
        Shot(name: "5-try-it-both", step: .tryIt, preview: .init(connected: ["ChatGPT", "Claude"])),
        Shot(name: "5-try-it-claude-code", step: .tryIt, preview: .init(connected: ["Claude Code"])),
        Shot(name: "5-try-it-claude-code-copied", step: .tryIt, preview: .init(connected: ["Claude Code"], copied: true)),
        Shot(name: "5-try-it-it-worked", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT", note: withCallMom, arrived: true)),
        Shot(name: "5-try-it-nothing-yet", step: .tryIt, preview: .init(connected: ["ChatGPT"], asked: "ChatGPT", late: true)),
    ]

    /// The sign-in states newcomer audit 8, 23 and 24 were about.
    static var signInStates: [(String, EmailSignInFlow, SignInView.Way?)] {
        func flow(_ step: EmailSignInFlow.Step, password: String = "") -> EmailSignInFlow {
            var f = EmailSignInFlow()
            f.email = "sara.lindqvist@example.com"
            f.step = step
            f.password = password
            return f
        }
        return [
            ("signin-existing", flow(.signIn(fallback: false)), nil),
            ("signin-create-short", flow(.create, password: "123456789"), nil),
            ("signin-create-met", flow(.create, password: String(repeating: "p", count: 12)), nil),
            ("signin-google-busy", EmailSignInFlow(), .google),
        ]
    }

    static func flow(_ shot: Shot) -> some View {
        let store = OnboardingStore(defaults: TestDefaults())
        store.showForPreview(shot.step, first: shot.first)
        return OnboardingFlow(store: store, backend: Backend(), preview: shot.preview, finish: { _ in })
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func mac(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        for shot in Self.shots {
            try await WelcomeSnapshots.shoot(Self.flow(shot), name: "mac-\(shot.name)-\(dark ? "dark" : "light")", dark: dark)
        }
        let store = OnboardingStore(defaults: TestDefaults())
        try await WelcomeSnapshots.shoot(OnboardingWait(store: store), name: "mac-0-wait-\(dark ? "dark" : "light")", dark: dark)
    }
    #endif

    // MARK: Connecting Claude Code, Codex and another AI

    /// (name, guide): Having trouble?, opened from each AI's row (that AI's help first).
    static let terminalSheets: [(String, ConnectAISection.Guide?)] = [
        ("8-help-claude-code", .claudeCode),
        ("8-help-codex", .codex),
        ("8-help-another-ai", .other),
        ("8-help-all", nil),
    ]

    static func terminalSheet(_ guide: ConnectAISection.Guide?) -> some View {
        ConnectHelpSheet(topic: HelpTopic(guide: guide), client: CaptureScreen.client)
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func macTerminalSheets(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        for (name, guide) in Self.terminalSheets {
            try await AppSnapshotTests.render(Self.terminalSheet(guide), name: "mac-\(name)-\(dark ? "dark" : "light")", dark: dark, wait: 0.8)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhoneTerminalSheets() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for (name, guide) in Self.terminalSheets {
            for dark in [false, true] {
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                window.rootViewController = UIHostingController(rootView: Self.terminalSheet(guide))
                window.isHidden = false
                try? await Task.sleep(for: .seconds(0.9))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
    #endif

    // MARK: Connect an AI, the sheet (Settings and notes open the same view)

    static let twoConnected: [Connection] = [
        Connection(id: UUID(), name: "ChatGPT", kind: "oauth", can_write: true, created_at: .now.addingTimeInterval(-86_400 * 3),
                   last_used_at: .now.addingTimeInterval(-3_600), revoked_at: nil, redirect_host: "chatgpt.com"),
        Connection(id: UUID(), name: "Claude Code", kind: "token", can_write: false, created_at: .now.addingTimeInterval(-86_400),
                   last_used_at: nil, revoked_at: nil, redirect_host: nil),
    ]

    static let sheets: [(name: String, rows: [Connection])] = [
        ("7-connect-sheet-none", []), ("7-connect-sheet-two-connected", twoConnected),
    ]

    static func sheet(_ rows: [Connection]) -> some View {
        ConnectAISheet(client: CaptureScreen.client, preview: rows)
            .tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US"))
    }

    #if os(macOS)
    @Test(arguments: [false, true])
    func macConnectSheet(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        for s in Self.sheets {
            try await AppSnapshotTests.render(Self.sheet(s.rows), name: "mac-\(s.name)-\(mode)", dark: dark, wait: 0.8)
        }
        // Settings › AI: the same view as a section of the form.
        for (name, rows) in [("none", [Connection]()), ("two-connected", Self.twoConnected)] {
            let form = Form { ConnectAISection(client: CaptureScreen.client, preview: rows) }.formStyle(.grouped).frame(width: 520).fixedSize(horizontal: false, vertical: true)
                .tint(Color(PColor.paneAccent))
            try await AppSnapshotTests.render(form, name: "mac-7-connect-settings-\(name)-\(mode)", dark: dark, wait: 0.8)
        }
    }
    #endif

    /// The sidebar with the Templates card above the account row, and after it was closed.
    /// The sidebar with the card at its foot: `connected` false shows Connect your AI, true
    /// shows Templates.
    static func sidebar(connected: Bool, _ c: ModelContainer) -> some View {
        let backend = Backend()
        backend.showSignedInForPreview(email: "sara@example.com", account: UUID())
        return NavigationStack { SidebarView(scope: .constant(.all), onNewNote: {}) }
            .environment(backend)
            .environment(SetupStore(progress: SetupProgress(connected: connected, dismissed: true)))
            .modelContainer(c)
            .tint(Color(PColor.paneAccent))
    }

    #if os(macOS)
    /// On its own: in the window the sidebar's glass doesn't draw offscreen.
    @Test(arguments: [false, true])
    func templatesCard(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try AppSnapshotTests.container()
        ProfileStore.shared.showForPreview(name: "Sara Lindqvist", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let mode = dark ? "dark" : "light"
        for (name, connected) in [("6-sidebar-card-connect", false), ("6-sidebar-card-templates", true)] {
            try await AppSnapshotTests.render(Self.sidebar(connected: connected, c).frame(width: 250, height: 640), name: "mac-\(name)-\(mode)", dark: dark, wait: 1.0)
        }
        // Enlarged, to see the pictures.
        for (name, card) in [("connect", AnyView(ConnectCard(onConnect: {}, onClose: {}))), ("templates", AnyView(TemplatesCard(onClose: {})))] {
            let big = card.frame(width: 230).padding(10).tint(Color(PColor.paneAccent)).scaleEffect(2.5, anchor: .topLeading).frame(width: 625, height: 300, alignment: .topLeading)
            try await AppSnapshotTests.render(big, name: "mac-6-sidebar-card-\(name)-enlarged-\(mode)", dark: dark, wait: 0.8)
        }
    }
    #endif

    #if os(macOS)
    /// The cards at the sidebar's default width (230), at Notes' own (208), and wide (320), in
    /// the real sidebar.
    @Test(arguments: [false, true])
    func sidebarCardWidths(dark: Bool) async throws {
        guard AppSnapshotTests.dir != nil else { return }
        let c = try AppSnapshotTests.container()
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let mode = dark ? "dark" : "light"
        for width in [230, 208, 320] {
            for (name, connected) in [("connect", false), ("templates", true)] {
                try await AppSnapshotTests.render(Self.sidebar(connected: connected, c).frame(width: CGFloat(width), height: 640),
                                                  name: "mac-9-sidebar-\(name)-\(width)-\(mode)", dark: dark, wait: 1.0)
            }
        }
        // Under the pointer: the whole card answers, the close button too.
        for (name, connected) in [("connect", false), ("templates", true)] {
            try await AppSnapshotTests.render(Self.sidebar(connected: connected, c).environment(\.hoverPreview, ["*"]).frame(width: 230, height: 640),
                                              name: "mac-9-sidebar-\(name)-230-hover-\(mode)", dark: dark, wait: 1.0)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhoneConnectSheet() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for s in Self.sheets {
            for (label, type) in [("default", DynamicTypeSize.large), ("largest", .accessibility5)] {
                for dark in [false, true] {
                    let window = UIWindow(windowScene: scene)
                    window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                    window.overrideUserInterfaceStyle = dark ? .dark : .light
                    window.rootViewController = UIHostingController(rootView: Self.sheet(s.rows).dynamicTypeSize(type))
                    window.isHidden = false
                    try? await Task.sleep(for: .seconds(0.9))
                    let format = UIGraphicsImageRendererFormat()
                    format.scale = 3
                    let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                        window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                    }
                    window.isHidden = true
                    try #require(image.pngData()).write(to: dir.appending(path: "iphone-\(s.name)-\(label)-\(dark ? "dark" : "light").png"))
                }
            }
        }
    }

    /// The iPhone's folder list (the iPad's sidebar) with the Templates card at its foot.
    @Test func iPhoneTemplatesCard() async throws {
        guard let dir = Self.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        ProfileStore.shared.showForPreview(name: "Sara Lindqvist", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        // (At the accessibility text sizes the card stays away: the folders need the room.)
        for (connected, label, type) in [(false, "connect-default", DynamicTypeSize.large), (true, "templates-default", .large),
                                         (false, "connect-larger", .xxxLarge), (true, "templates-larger", .xxxLarge)] {
            for dark in [false, true] {
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                window.rootViewController = UIHostingController(rootView: Self.sidebar(connected: connected, c).dynamicTypeSize(type))
                window.isHidden = false
                try? await Task.sleep(for: .seconds(1.0))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-6-sidebar-card-\(label)-\(dark ? "dark" : "light").png"))
            }
        }
    }
    #endif

    #if os(iOS)
    /// The welcome (one button, audit 22) and the sign-in states, at the default text size.
    @Test func iPhoneWelcome() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let states: [(String, WelcomeFlow.Stage, EmailSignInFlow, SignInView.Way?)] = [("welcome", .welcome, EmailSignInFlow(), nil)]
            + Self.signInStates.map { ($0.0, .signIn(returning: false), $0.1, $0.2) }
        for (name, stage, flow, pressed) in states {
            for dark in [false, true] {
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                let view = WelcomeFlow(backend: Backend(), stage: stage, flow: flow, pressed: pressed)
                    .tint(Color(PColor.paneAccent))
                    .environment(\.locale, Locale(identifier: "en_US"))
                window.rootViewController = UIHostingController(rootView: view)
                window.isHidden = false
                try? await Task.sleep(for: .seconds(0.9))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
    #endif

    #if os(iOS)
    /// iPhone and iPad have no first-run steps (28 October 2026): the folders offer the Mac app
    /// to an account that has never had one, before the other cards.
    @Test func iPhoneMacCard() async throws {
        guard let dir = Self.dir else { return }
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        let devices = KeyDevices.shared
        KeyDevices.shared = KeyDevices()
        KeyDevices.shared.showForPreview(others: [])
        defer { KeyDevices.shared = devices }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        for (label, type) in [("default", DynamicTypeSize.large), ("larger", .xxxLarge)] {
            for dark in [false, true] {
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                window.rootViewController = UIHostingController(rootView: Self.sidebar(connected: false, c).dynamicTypeSize(type))
                window.isHidden = false
                try? await Task.sleep(for: .seconds(1.0))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-mac-card-\(label)-\(dark ? "dark" : "light").png"))
            }
        }
    }
    #endif
    #if os(iOS)
    static func shootPage(_ view: some View, _ name: String, dark: Bool, type: DynamicTypeSize = .large, scene: UIWindowScene, dir: URL) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.dynamicTypeSize(type).tint(Color(PColor.paneAccent))
            .environment(\.locale, Locale(identifier: "en_US")))
        window.isHidden = false
        try? await Task.sleep(for: .seconds(0.8))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.isHidden = true
        try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
    }

    /// The welcome's three looks (WelcomeStyle), each page at its resting step, light and dark; the
    /// largest text for the note card; and each page's demo step by step, to review the motion.
    @Test func iPhoneWelcomePages() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let letter: [WelcomeStyle: String] = [.card: "A", .device: "B", .scene: "C", .bold: "D"]
        for style in WelcomeStyle.allCases {
            for page in WelcomePage.allCases {
                for dark in [false, true] {
                    let view = WelcomePages(style: style, page: page, frozenStage: page.stages - 1, start: {}, haveAccount: {})
                    try await Self.shootPage(view, "welcome-\(letter[style]!)-\(page.rawValue + 1)-\(dark ? "dark" : "light")", dark: dark, scene: scene, dir: dir)
                }
            }
        }
        for style in [WelcomeStyle.card, .bold, .device] {
            for page in WelcomePage.allCases {
                let view = WelcomePages(style: style, page: page, frozenStage: page.stages - 1, start: {}, haveAccount: {})
                try await Self.shootPage(view, "welcome-\(letter[style]!)-\(page.rawValue + 1)-largest", dark: false, type: .accessibility3, scene: scene, dir: dir)
            }
        }
        // Motion, step by step: every page of A; D's first page as it types.
        for page in WelcomePage.allCases {
            for stage in 0..<page.stages {
                let view = WelcomePages(style: .card, page: page, frozenStage: stage, start: {}, haveAccount: {})
                try await Self.shootPage(view, "welcome-A-\(page.rawValue + 1)-step\(stage)", dark: false, scene: scene, dir: dir)
            }
        }
        for stage in 0..<WelcomePage.writes.stages {
            let view = WelcomePages(style: .device, page: .writes, frozenStage: stage, start: {}, haveAccount: {})
            try await Self.shootPage(view, "welcome-B-1-step\(stage)", dark: false, scene: scene, dir: dir)
        }
        for (i, (stage, typed)) in [(2, 0.0), (2, 0.35), (2, 0.7), (2, 1.0), (3, 1.0)].enumerated() {
            let view = WelcomePages(style: .bold, page: .writes, frozenStage: stage, typingProgress: typed, start: {}, haveAccount: {})
            try await Self.shootPage(view, "welcome-D-1-frame\(i)", dark: false, scene: scene, dir: dir)
        }
    }
    #endif
}
