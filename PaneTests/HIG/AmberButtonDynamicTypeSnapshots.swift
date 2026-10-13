#if os(iOS)
import SwiftUI
import Testing
import UIKit
@testable import Pane

/// The amber button on iPhone follows the person's text size (found in renders, 2026-10-13: its
/// label stayed small at the largest sizes). A row grows with its title and a long title takes a
/// second line at the accessibility sizes instead of being cut. Pictures when AMBER_HIG_SHOTS is
/// set, on a simulator:
/// `TEST_RUNNER_AMBER_HIG_SHOTS=/path xcodebuild test -scheme Pane -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
/// -only-testing:PaneTests/AmberButtonDynamicTypeSnapshots CODE_SIGNING_ALLOWED=NO`.
@MainActor @Suite(.serialized) struct AmberButtonDynamicTypeSnapshots {
    static let row: CGFloat = 48

    static func buttons(_ size: DynamicTypeSize) -> some View {
        VStack(spacing: 14) {
            Button("Continue") {}.buttonStyle(.amberProminent(height: row, cornerRadius: 14))
            Button("Make it with ChatGPT") {}.buttonStyle(.amberProminent(height: row, cornerRadius: 14))
            Button("Add to my notes") {}.buttonStyle(.amberProminent)
        }
        .padding(20)
        .frame(width: 402)
        .background(Color(Palette.sheetGround))
        .dynamicTypeSize(size)
    }

    /// The height a view asks for at the phone's width.
    static func height(_ view: some View) -> CGFloat {
        UIHostingController(rootView: view).sizeThatFits(in: CGSize(width: 402, height: CGFloat.greatestFiniteMagnitude)).height
    }

    @Test func theButtonGrowsWithTheTextSize() {
        let row = { (size: DynamicTypeSize) in
            Self.height(Button("Make it with ChatGPT") {}.buttonStyle(.amberProminent(height: Self.row, cornerRadius: 14)).frame(width: 362).dynamicTypeSize(size))
        }
        // The default size keeps the row's own height.
        #expect(abs(row(.large) - Self.row) < 0.5)
        // The largest text sizes make it taller: a bigger title, and two lines where it doesn't fit.
        #expect(row(.xxxLarge) > Self.row)
        #expect(row(.accessibility5) > row(.xxxLarge))
        let capsule = { (size: DynamicTypeSize) in Self.height(Button("Add to my notes") {}.buttonStyle(.amberProminent).dynamicTypeSize(size)) }
        #expect(capsule(.accessibility5) > capsule(.large))
    }

    @Test func pictures() async throws {
        guard let dir = ProcessInfo.processInfo.environment["AMBER_HIG_SHOTS"].map({ URL(fileURLWithPath: $0) }) else { return }
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        for (name, size) in [("default", DynamicTypeSize.large), ("xxxlarge", .xxxLarge), ("accessibility5", .accessibility5)] {
            for dark in [false, true] {
                let view = Self.buttons(size)
                let window = UIWindow(windowScene: scene)
                window.frame = CGRect(origin: .zero, size: CGSize(width: 402, height: Self.height(view)))
                window.overrideUserInterfaceStyle = dark ? .dark : .light
                window.rootViewController = UIHostingController(rootView: view)
                window.isHidden = false
                try? await Task.sleep(for: .seconds(0.6))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
                    window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                window.isHidden = true
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                try #require(image.pngData()).write(to: dir.appending(path: "iphone-amber-button-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
}
#endif
