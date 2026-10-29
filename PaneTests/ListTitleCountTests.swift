import Foundation
import SwiftData
import SwiftUI
import Testing
#if os(iOS)
import UIKit
#endif
@testable import Pane

/// iPhone's list (Emil, 28 October 2026): the count moves from a footer under the last row to a
/// small line under the large title, and the date headers line up with the title, not the rows.
@MainActor @Suite struct ListTitleCountTests {
    @Test func theCountUnderTheTitle() {
        #expect(NoteListView.titleCount(notes: 3, files: 0, searching: false, trash: false) == "3 notes")
        #expect(NoteListView.titleCount(notes: 1, files: 0, searching: false, trash: false) == "1 note")
        #expect(NoteListView.titleCount(notes: 2, files: 1, searching: false, trash: false) == "2 notes, 1 file")
        // Empty: no line at all; the empty state says there's nothing here.
        #expect(NoteListView.titleCount(notes: 0, files: 0, searching: false, trash: false) == nil)
        #expect(NoteListView.titleCount(notes: 4, files: 0, searching: true, trash: false) == nil, "search results show no count")
    }

    #if os(iOS)
    /// The large title, the count and the first date header start at the same leading edge.
    @Test func headersLineUpWithTheTitle() async throws {
        let scene = try #require(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        Seed.ensureLibrary(c.mainContext, demo: false, welcome: false)
        for body in ["Groceries\n\nOat milk", "Books to read\n\nPiranesi"] { _ = c.mainContext.createNote(in: .all, body: body) }
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = UIHostingController(rootView: NavigationStack { NoteListView(scope: .all, selection: .constant([]), onNewNote: {}) }.modelContainer(c))
        window.isHidden = false
        defer { window.isHidden = true }
        try? await Task.sleep(for: .seconds(1.5))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let image = try #require(UIGraphicsImageRenderer(bounds: window.bounds, format: format).image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }.cgImage)
        let bands = Self.inkBands(image, from: 80, to: 260, leftOf: 220)
        // The title, the count line, then "Today".
        try #require(bands.count >= 3, "found \(bands)")
        let title = bands[0].left, count = bands[1].left, header = bands[2].left
        #expect(abs(count - title) <= 3, "count \(count) vs title \(title)")
        #expect(abs(header - title) <= 3, "header \(header) vs title \(title)")
    }

    /// Runs of rows with dark text in them, top to bottom, and where each starts on the left.
    static func inkBands(_ image: CGImage, from top: Int, to bottom: Int, leftOf maxX: Int) -> [(top: Int, left: Int)] {
        let w = image.width, h = image.height
        var data = [UInt8](repeating: 0, count: w * h * 4)
        let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        func dark(_ x: Int, _ y: Int) -> Bool {
            let i = (y * w + x) * 4
            return (Int(data[i]) + Int(data[i + 1]) + Int(data[i + 2])) / 3 < 150
        }
        var bands: [(top: Int, left: Int)] = []
        var inBand = false
        for y in top..<min(bottom, h) {
            let left = (0..<min(maxX, w)).first { dark($0, y) }
            if let left {
                if !inBand { bands.append((y, left)); inBand = true } else { bands[bands.count - 1].left = min(bands[bands.count - 1].left, left) }
            } else {
                inBand = false
            }
        }
        return bands
    }
    #endif
}
