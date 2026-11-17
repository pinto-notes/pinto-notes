#if os(macOS)
import AppKit
import Foundation
import SwiftData
import SwiftUI
import Testing
import WebKit
@testable import Pane

/// The BoardCommentsCanvasTests suite's declaration, and the helpers of it that tests in other test
/// targets use (a test target can't see another's code). Its tests are in PaneTests/BoardCommentsCanvasTests.swift.
@MainActor @Suite(.serialized) struct BoardCommentsCanvasTests {
    typealias Joined = CanvasNativeUITests.Joined

    /// A popover's view drawn on its own at 2x, at the size it takes.
    static func popover(_ view: some View, dark: Bool) async throws -> NSBitmapImageRep {
        let probe = NSHostingView(rootView: view.fixedSize())
        let size = probe.fittingSize
        let ax = OffscreenAX(view.frame(width: size.width, height: size.height, alignment: .top).background(Color(nsColor: .windowBackgroundColor)), size: size, dark: dark)
        defer { ax.close() }
        await ax.settle(600)
        let v = try #require(ax.window.contentView)
        let rep = try #require(v.bitmapImageRepForCachingDisplay(in: v.bounds))
        v.cacheDisplay(in: v.bounds, to: rep)
        return rep
    }
}
#endif
