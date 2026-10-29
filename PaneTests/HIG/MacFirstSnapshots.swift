import Supabase
import SwiftData
import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// iPhone, Mac first (28 October 2026): Settings' Connect an AI page and the folders, where the
/// Connect your AI card was, light and dark, with no AI connected. Offscreen; runs only when
/// AMBER_HIG_SHOTS is set, on a simulator:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:PaneTests/MacFirstSnapshots CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct MacFirstSnapshots {
    #if os(macOS)
    /// The Mac is unchanged: its card and its rows as before.
    @Test func theMacIsUnchanged() {
        #expect(SidebarCard.here(.connect) == .connect)
        #expect(ConnectHere.press(.claude, connected: false) == .start)
        #expect(FirstOpenContent.offersConnect(connected: false))
    }
    #else
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }
    static let client = SupabaseClient(supabaseURL: URL(string: "http://127.0.0.1:9")!, supabaseKey: "test")

    static func settings() -> some View {
        NavigationStack {
            Form { ConnectAISection(client: client, preview: []) }
                .formStyle(.grouped)
                .navigationTitle("Connect an AI")
                .navigationBarTitleDisplayMode(.inline)
        }
        .connectGuides(client: client)
    }

    static func shoot(_ view: some View, _ name: String, dark: Bool, scene: UIWindowScene, dir: URL, wait: Double = 1.4) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: scene.screen.bounds.size)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        window.rootViewController = UIHostingController(rootView: view.tint(Color(PColor.paneAccent)))
        window.isHidden = false
        try? await Task.sleep(for: .seconds(wait))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.rootViewController?.dismiss(animated: false)
        window.isHidden = true
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try #require(image.pngData()).write(to: dir.appending(path: "\(name).png"))
    }

    @Test(arguments: [false, true])
    func iPhone(dark: Bool) async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let mode = dark ? "dark" : "light"
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: true)
        ProfileStore.shared.showForPreview(name: "Sara Lindqvist", photo: nil)
        defer { ProfileStore.shared.showForPreview(name: nil, photo: nil) }
        try await Self.shoot(Self.settings(), "iphone-settings-ai-\(mode)", dark: dark, scene: scene, dir: dir)
        // No AI connected: where the Connect your AI card sat, at the foot of the folders.
        try await Self.shoot(OnboardingSnapshots.sidebar(connected: false, c), "iphone-folders-no-ai-\(mode)", dark: dark, scene: scene, dir: dir)
        // Claude's row, pressed: connect it on the Mac, and the Mac link.
        let sheet = Color(.systemGroupedBackground).ignoresSafeArea().sheet(isPresented: .constant(true)) { ConnectOnMacSheet(ai: .claude) }
        try await Self.shoot(sheet, "iphone-claude-on-mac-\(mode)", dark: dark, scene: scene, dir: dir, wait: 1.8)
    }
#endif
}
