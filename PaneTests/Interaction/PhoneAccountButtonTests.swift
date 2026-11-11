import Foundation
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone 1.3 (Emil, 11 November 2026): the photo at the top left of the folders sat further in
/// from its edge than the buttons on the right sit from theirs, and was a little smaller than them.
@MainActor @Suite struct PhoneAccountButtonTests {
    #if os(iOS)
    /// The photo is as big as the bar's round buttons, and as far from the left edge as they are
    /// from the right.
    @Test func thePhotoMatchesTheBarsButtons() async throws {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = .light
        // The folders' bar as SidebarView builds it: the photo with no glass, New Folder and Edit.
        window.rootViewController = UIHostingController(rootView: NavigationStack {
            List { Text("Notes") }
                .navigationTitle("Folders")
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        AccountPhotoButton(photo: nil, name: "Emil Wagman", spoken: "Emil Wagman") {}
                    }
                    .sharedBackgroundVisibility(.hidden)
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("New Folder", systemImage: "folder.badge.plus") {}.tint(.primary)
                    }
                    ToolbarSpacer(.fixed, placement: .topBarTrailing)
                    ToolbarItem(placement: .topBarTrailing) { Button("Edit") {}.tint(.primary) }
                }
        })
        window.isHidden = false
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))

        // The round glass button on the right: its frame in the window.
        let glass = PhoneFolderTapTests.views(UIView.self, in: window)
            .filter { NSStringFromClass(type(of: $0)).contains("GlassInteractionView") }
            .map { $0.convert($0.bounds, to: window) }
            .filter { $0.width > 0 && $0.minY < 140 }
        let right = try #require(glass.max { $0.maxX < $1.maxX }, "no glass buttons in the bar")
        let round = try #require(glass.filter { abs($0.width - $0.height) < 1 }.first, "no round glass button: \(glass)")

        // The photo: the app's amber circle with the initials, found by its colour.
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = try #require(UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }.cgImage)
        let photo = try #require(Self.amber(image, rows: (Int(right.minY) - 10)..<(Int(right.maxY) + 10)), "no photo in the bar")

        let rightGap = window.bounds.width - right.maxX
        #expect(abs(photo.minX - rightGap) <= 1, "photo \(photo.minX) pt from the left, buttons \(rightGap) pt from the right")
        #expect(abs(photo.width - round.width) <= 1.5, "photo \(photo.width) pt, the round button \(round.width) pt")
        #expect(abs(photo.midY - round.midY) <= 1, "photo centred at \(photo.midY), the buttons at \(round.midY)")
    }

    /// Where the amber pixels are, in the given rows (at 1 pt a pixel).
    static func amber(_ image: CGImage, rows: Range<Int>) -> CGRect? {
        let w = image.width, h = image.height
        var data = [UInt8](repeating: 0, count: w * h * 4)
        let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        var minX = Int.max, maxX = -1, minY = Int.max, maxY = -1
        for y in max(rows.lowerBound, 0)..<min(rows.upperBound, h) {
            for x in 0..<(w / 2) {
                let i = (y * w + x) * 4
                let r = Int(data[i]), b = Int(data[i + 2])
                if r - b > 80 {
                    minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                }
            }
        }
        guard maxX >= 0 else { return nil }
        return CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
    }
    #endif
}
