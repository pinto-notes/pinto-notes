#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import PintoNotes

/// Pictures in the real app (Emil, 11-01): fit the text's width, small, and a cover banner.
/// Window-server captures, so CI only.
@MainActor @Suite(.serialized) struct PictureShots {
    @Test(arguments: [false, true])
    func pictures(dark: Bool) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        let a = try FileStore.importData(DemoData.samplePNG(), filename: "Sunset.png", type: .png)
        let b = try FileStore.importData(DemoData.samplePNG(), filename: "Dusk.png", type: .png)
        let d = try FileStore.importData(DemoData.samplePNG(), filename: "Evening.png", type: .png)
        [a, b, d].forEach(c.mainContext.insert)
        func line(_ f: PintoNotes.Attachment, _ size: ImageSize) -> String {
            "![\(ImageSizes.label(f.filename, size: size))](pane-file:\(f.id.uuidString.lowercased()))"
        }
        let body = """
        Pictures

        A cover:

        \(line(a, .cover))

        Fit width, the default:

        \(line(b, .fit))

        Small:

        \(line(d, .small))

        Text after.
        """
        let n = c.mainContext.createNote(in: .all, body: body)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Pictures") {
            let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                .tint(Color(PColor.pintoNotesAccent))
                .environment(\.controlActiveState, .key)
            let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 1000), dark: dark)
            defer { w.orderOut(nil); w.close() }
            try? await Task.sleep(for: .seconds(3))
            try await WarmGreySnapshots.shoot(w, "pictures-\(dark ? "dark" : "light")", in: dir)
            let editor = try #require(w.contentView.flatMap { MacWindowChromeTests.find(PintoNotesTextView.self, in: $0) })
            if let clip = editor.enclosingScrollView?.contentView {
                clip.scroll(to: NSPoint(x: 0, y: clip.bounds.origin.y + 420))
                editor.enclosingScrollView?.reflectScrolledClipView(clip)
            }
            try? await Task.sleep(for: .seconds(1))
            try await WarmGreySnapshots.shoot(w, "pictures-scrolled-\(dark ? "dark" : "light")", in: dir)
        }
    }
}
#endif
