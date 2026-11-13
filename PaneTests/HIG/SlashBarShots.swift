import Foundation
import Testing
#if os(iOS)
import SwiftUI
import UIKit
#endif
@testable import Pane

/// The iPhone keyboard bar while a `/query` is typed: the commands in the tools' place, drawn
/// from the simulator's test host (nothing on the Mac's screen), light and dark. On the Mac the
/// suite checks what the controller offers (the bar and the list read the same commands).
/// `TEST_RUNNER_PANE_SLASH_SHOTS=/path xcodebuild test … -only-testing:PaneHIGTests/SlashBarShots`
@MainActor @Suite(.serialized) struct SlashBarShots {
    @Test func theControllerOffersAndTakesBackCommands() {
        let c = EditorController()
        c.typingChanged(text: "Plan\n/li", selection: NSRange(location: 8, length: 0))
        #expect(c.slashCommands.first == .link)
        #expect(c.slashQuery == NSRange(location: 5, length: 3))
        c.typingChanged(text: "Plan\n/li", selection: nil)
        #expect(c.slashCommands.isEmpty, "editing ended: the commands go")
        c.readOnly = true
        c.typingChanged(text: "Plan\n/", selection: NSRange(location: 6, length: 0))
        #expect(c.slashCommands.isEmpty, "nothing to offer in Recently Deleted")
    }

    #if os(iOS)
    @Test func barStates() async throws {
        // Without a folder the bar is still made, so the test checks it builds and shows commands.
        let dir = ProcessInfo.processInfo.environment["PANE_SLASH_SHOTS"].map { URL(fileURLWithPath: $0) }
        if let dir { try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true) }
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        for (name, text) in [("bar-open", "Plan\n/"), ("bar-lists", "Plan\n/li")] {
            let c = EditorController()
            c.typingChanged(text: text, selection: NSRange(location: (text as NSString).length, length: 0))
            #expect(!c.slashCommands.isEmpty)
            #expect(!c.slashCommands.contains(.attach), "the iPhone attaches from its paperclip")
            guard let dir else { continue }
            for dark in [false, true] {
                // The bar scrolls (a UIScrollView), which ImageRenderer can't draw: it's hosted in
                // a window of the simulator's test host and drawn from there.
                let size = CGSize(width: 402, height: 60)
                let host = UIHostingController(rootView: FormatBar(controller: c, dismiss: {}))
                // As FormatBarHost hosts it: no room kept for the status bar.
                host.safeAreaRegions = []
                host.overrideUserInterfaceStyle = dark ? .dark : .light
                host.view.backgroundColor = dark ? .black : UIColor(white: 0.82, alpha: 1)
                let window = scene.map { UIWindow(windowScene: $0) } ?? UIWindow()
                window.frame = CGRect(origin: .zero, size: size)
                window.overrideUserInterfaceStyle = host.overrideUserInterfaceStyle
                window.rootViewController = host
                window.isHidden = false
                defer { window.isHidden = true }
                host.view.frame = window.bounds
                host.view.layoutIfNeeded()
                try? await Task.sleep(for: .seconds(0.5))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 3
                let image = UIGraphicsImageRenderer(size: size, format: format).image { _ in
                    _ = host.view.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
                }
                try #require(image.pngData()).write(to: dir.appending(path: "slash-\(name)-\(dark ? "dark" : "light").png"))
            }
        }
    }
    #endif
}
