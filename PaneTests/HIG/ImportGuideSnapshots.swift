import SwiftUI
import Testing
@testable import Pane
#if os(iOS)
import UIKit
#endif

/// Every live guide page, to look at: on the Mac at the designed height and at the smallest
/// window's; on iPhone as a sheet over the app, with Evernote's and Bear's Mac-link pages.
/// Offscreen; runs only when AMBER_HIG_SHOTS is set. Mac:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path scripts/qa-test.sh "PaneTests/ImportGuideSnapshots"`; iPhone:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=…'
/// -only-testing:PaneTests/ImportGuideSnapshots CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct ImportGuideSnapshots {
    static var dir: URL? { ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map { URL(fileURLWithPath: $0) } }

    static func pages(_ guide: ImportGuide) -> [(String, ImportGuidePage)] {
        [("0-intro", .intro)] + guide.steps.indices.map { ("\($0 + 1)-step", .step($0)) }
            + [("7-drop", .drop(.empty)), ("8-found", .drop(.found)), ("9-success", .success)]
    }

    #if os(macOS)
    @Test func mac() async throws {
        guard let dir = Self.dir else { return }
        for kind in ImportKind.allCases {
            let guide = try #require(ImportGuide.live(kind))
            let pages = Self.pages(guide)
            for height: CGFloat in [560, 480] {
                for (name, page) in pages {
                    try await VersionHistorySnapshots.shoot(ImportGuideSheet(guide: guide, page: page, height: height),
                                                            to: dir.appending(path: "\(guide.id)/mac-\(Int(height))-\(name).png"),
                                                            size: CGSize(width: 540, height: height), dark: false)
                }
            }
        }
        for (name, page) in [("denied", ImportNoticePage.notesDenied), ("empty", .notesEmpty)] {
            var short = page
            short.height = 480
            try await VersionHistorySnapshots.shoot(short, to: dir.appending(path: "apple-notes/mac-480-\(name).png"),
                                                    size: CGSize(width: 540, height: 480), dark: true)
        }
    }
    #endif

    #if os(iOS)
    @Test func iPhone() async throws {
        guard let dir = Self.dir else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for dark in [false, true] {
            let mode = dark ? "dark" : "light"
            for kind in ImportKind.allCases {
                if let notice = ImportGuide.phoneHandoff(kind) {
                    try await Self.shoot(notice, to: dir.appending(path: "\(kind.rawValue)/iphone-\(mode)-0-mac-link.png"), dark: dark, scene: scene)
                }
                guard let guide = ImportGuide.live(kind) ?? ImportGuide.phoneFiles(kind) else { continue }
                let pages = ImportGuide.live(kind) == nil ? Self.pages(guide).filter { $0.0 >= "7" } : Self.pages(guide)
                for (name, page) in pages {
                    try await Self.shoot(ImportGuideSheet(guide: guide, page: page), to: dir.appending(path: "\(guide.id)/iphone-\(mode)-\(name).png"),
                                         dark: dark, scene: scene)
                }
            }
        }
    }

    /// As a sheet over the app, at an iPhone 17 Pro's size.
    static func shoot(_ page: some View, to url: URL, dark: Bool, scene: UIWindowScene) async throws {
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = dark ? .dark : .light
        let root = Color(Palette.listGround).ignoresSafeArea()
            .sheet(isPresented: .constant(true)) { page.presentationBackground(Color(Palette.sheetGround)) }
        window.rootViewController = UIHostingController(rootView: root)
        window.isHidden = false
        try? await Task.sleep(for: .seconds(1.4))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        window.rootViewController?.dismiss(animated: false)
        window.isHidden = true
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try #require(image.pngData()).write(to: url)
    }
    #endif
}
