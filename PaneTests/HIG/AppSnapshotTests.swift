#if os(macOS)
import AppKit
import Supabase
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// Whole-app screenshots for the design pass: the real RootView (and other screens)
/// in an offscreen, titled window, drawn with cacheDisplay. Nothing touches the screen.
/// Runs only when AMBER_HIG_SHOTS is set: `AMBER_HIG_SHOTS=/path scripts/qa-test.sh PaneTests/AppSnapshotTests`.
extension AppSnapshotTests {
    @Test(arguments: [false, true])
    func root(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        let c = try Self.container()
        for (title, slug) in [("Welcome to Pinto Notes", "welcome"), ("Evening tracker", "tracker"), ("Lisbon", "lisbon"), ("Trip documents", "files")] {
            try await Self.withLastNote(c, title) {
                try await Self.shoot(RootView().modelContainer(c), name: "mac-root-\(slug)-\(dark ? "dark" : "light")", size: CGSize(width: 1180, height: 760), dark: dark)
            }
        }
        try await Self.withLastNote(c, "Welcome to Pinto Notes") {
            try await Self.shoot(RootView().modelContainer(c), name: "mac-root-narrow-\(dark ? "dark" : "light")", size: CGSize(width: 780, height: 600), dark: dark)
        }
    }

    @Test(arguments: [false, true])
    func screens(dark: Bool) async throws {
        guard Self.dir != nil else { return }
        let mode = dark ? "dark" : "light"
        let backend = Backend()
        let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")
        try await Self.render(Form { ConnectAISection(client: client) }.formStyle(.grouped).frame(width: 520, height: 520), name: "mac-connect-\(mode)", dark: dark, wait: 1.0)
        let r = ConnectRequest(id: UUID(), client_name: "ChatGPT", redirect_host: "chatgpt.com", loopback: false)
        try await Self.render(ConsentSheet(client: client, requestID: r.id, initial: .asking(r), finish: { _ in }), name: "mac-consent-\(mode)", dark: dark)
        try await Self.shoot(SignInView(backend: backend).fixedSize().containerBackground(for: .window) { Backdrop() }, name: "mac-signin-\(mode)", size: CGSize(width: 380, height: 470), dark: dark, toolbar: false)
        // The email-first steps: an existing account, a new email, a Sign in with Apple account, and Forgot password?.
        for (name, step) in [("existing", EmailSignInFlow.Step.signIn(fallback: false)), ("new", .create), ("fallback", .signIn(fallback: true)), ("apple", .apple),
                             ("forgot", .forgot(sending: false)), ("forgot-sent", .forgotSent)] {
            let flow = EmailSignInFlow(step: step, email: "you@example.com", password: step == .create ? "correct horse battery" : "")
            try await Self.shoot(SignInView(backend: backend, flow: flow).fixedSize().containerBackground(for: .window) { Backdrop() }, name: "mac-signin-\(name)-\(mode)", size: CGSize(width: 380, height: 520), dark: dark, toolbar: false)
        }
        // The code boxes part typed and full, and after a wrong code.
        for (name, code) in [("confirm-typed", "704"), ("confirm-full", "704494")] {
            try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: EmailSignInFlow(step: .confirm, email: "sara@example.com", code: code)),
                                 name: "mac-welcome-\(name)-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        }
        try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: EmailSignInFlow(step: .confirm, email: "sara@example.com"),
                                         error: "That code is wrong or has expired. Check the newest email from Pinto Notes, or press Resend code."),
                             name: "mac-welcome-confirm-wrong-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        // Email confirmation: Check your email, fresh and just after a code went out.
        for (name, sent) in [("confirm", nil), ("confirm-wait", Date.now)] as [(String, Date?)] {
            try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: EmailSignInFlow(step: .confirm, email: "sara@example.com", codeSentAt: sent)),
                                 name: "mac-welcome-\(name)-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        }
        try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: EmailSignInFlow(step: .create, email: "sara@example.com", password: "correct horse battery")),
                             name: "mac-welcome-signin-new-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        // Before the email is checked: neutral words.
        try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false)),
                             name: "mac-welcome-signin-start-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        // The heading once the email is known: an existing account.
        try await Self.shoot(WelcomeFlow(backend: backend, stage: .signIn(returning: false), flow: EmailSignInFlow(step: .signIn(fallback: false), email: "sara@example.com", password: "secret")),
                             name: "mac-welcome-signin-existing-\(mode)", size: WelcomeFlow.size, dark: dark, toolbar: false, card: true)
        // Link this Mac to open your notes: why, the QR code and the code to type.
        try await Self.shoot(AddDeviceCapture(name: "new-device").frame(width: 520, height: 760).containerBackground(for: .window) { Backdrop() },
                             name: "mac-new-device-\(mode)", size: CGSize(width: 520, height: 760), dark: dark, toolbar: false, card: true, wait: 2.0)
        try await Self.render(SettingsView(backend: backend, sync: nil), name: "mac-settings-\(mode)", dark: dark)
        backend.showSignedInForPreview(email: "you@example.com")
        try await Self.render(SettingsView(backend: backend, sync: nil), name: "mac-settings-signedin-\(mode)", dark: dark)
        // With a name and photo: the profile header in Settings and the account row in the sidebar.
        let face = try ProfileImage.prepare(try #require(NSImage(named: "MarkTight")?.tiffRepresentation))
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: NSImage(data: face))
        try await Self.render(SettingsView(backend: backend, sync: nil), name: "mac-settings-profile-\(mode)", dark: dark)
        try await Self.render(AccountButton(backend: backend).frame(width: 240).padding(10), name: "mac-account-row-\(mode)", dark: dark)
        ProfileStore.shared.showForPreview(name: nil, photo: nil)
        try await Self.render(AccountButton(backend: backend).frame(width: 240).padding(10), name: "mac-account-row-noname-\(mode)", dark: dark)
    }
}
#endif

#if os(macOS)
extension AppSnapshotTests {
    /// The sidebar header alone, magnified, to judge the mark's size and baseline against the name.
    @Test(arguments: [false, true])
    func sidebarHeader(dark: Bool) throws {
        guard let dir = Self.dir else { return }
        let host = NSHostingView(rootView: SidebarHeader().frame(width: 240).background(Color(nsColor: .windowBackgroundColor)))
        host.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
        host.frame = CGRect(origin: .zero, size: host.fittingSize)
        host.layoutSubtreeIfNeeded()
        let rep = try #require(host.bitmapImageRepForCachingDisplay(in: host.bounds))
        rep.size = host.bounds.size
        host.cacheDisplay(in: host.bounds, to: rep)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(rep.representation(using: .png, properties: [:])).write(to: dir.appending(path: "mac-sidebar-header-\(dark ? "dark" : "light").png"))
    }
}
#endif

#if os(macOS)
extension AppSnapshotTests {
    static func glassViews(in view: NSView) -> [NSView] {
        (String(describing: type(of: view)).contains("Glass") ? [view] : []) + view.subviews.flatMap { glassViews(in: $0) }
    }

    @Test(arguments: [false, true])
    func settingsTabs(dark: Bool) async throws {
        // A titled window ordered in, for the toolbar: CI only (PANE_SNAPSHOTS, set in ci.yml),
        // never on a developer's Mac. The pictures are attached to the results (the "snapshots" artifact).
        guard ProcessInfo.processInfo.environment["PANE_SNAPSHOTS"] == "1" else { return }
        let view = try await Self.settingsFixture()
        #expect(view.pages == [.account, .general, .ai, .appearance, .security, .storage, .help])
        for tab in view.pages {
            let window = Self.settingsWindow(view, tab: tab, dark: dark)
            window.orderFrontRegardless()
            try? await Task.sleep(for: .seconds(1.2))
            defer { window.orderOut(nil); window.close() }
            let frame = try #require(window.contentView?.superview)
            // The selected tab's glass capsule samples the screen behind it, which an offscreen
            // drawing doesn't have (it comes out as a white block); the selected tab still shows
            // by its label.
            for glass in Self.glassViews(in: frame) where glass.frame.width < frame.bounds.width {
                glass.alphaValue = 0
                glass.layer?.opacity = 0
            }
            frame.layoutSubtreeIfNeeded()
            frame.display()
            let rep = try #require(frame.bitmapImageRepForCachingDisplay(in: frame.bounds))
            frame.cacheDisplay(in: frame.bounds, to: rep)
            let png = try #require(rep.representation(using: .png, properties: [:]))
            Testing.Attachment.record(png, named: "mac-settings-\(tab.rawValue)-\(dark ? "dark" : "light").png")
            if let dir = Self.dir {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try png.write(to: dir.appending(path: "mac-settings-\(tab.rawValue)-\(dark ? "dark" : "light").png"))
            }
        }
        ProfileStore.shared.showForPreview(name: nil, photo: nil)
    }
}
#endif
