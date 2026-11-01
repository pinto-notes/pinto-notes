#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import PintoNotes

/// Links alone on their line, in the real app (Emil, 11-01): compact by default, a card by
/// choice, and a link in a sentence stays a link. Window-server captures, so CI only.
@MainActor @Suite(.serialized) struct LinkCardShots {
    @Test(arguments: [false, true])
    func links(dark: Bool) async throws {
        guard let dir = WarmGreySnapshots.dir else { return }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let c = try AppSnapshotTests.container()
        let pdf = try FileStore.importData(DemoData.samplePDF(), filename: "Flight itinerary.pdf", type: .pdf)
        c.mainContext.insert(pdf)
        let body = """
        Links

        Compact, the default:

        https://www.apple.com/macbook-air/

        [[Groceries]]

        \(pdf.markdown)

        As cards:

        <https://www.apple.com/macbook-air/>

        ![[Groceries]]

        !\(pdf.markdown)

        A link in a sentence stays a link: see [Apple](https://www.apple.com) before we go.
        """
        let n = c.mainContext.createNote(in: .all, body: body)
        n.updatedAt = .now.addingTimeInterval(600)
        try c.mainContext.save()
        try await AppSnapshotTests.withLastNote(c, "Links") {
            let root = RootView().modelContainer(c).environment(SetupStore(progress: SetupProgress(imported: true)))
                .tint(Color(PColor.pintoNotesAccent))
                .environment(\.controlActiveState, .key)
            let w = AIEditSnapshots.window(root, size: CGSize(width: 1440, height: 900), dark: dark)
            defer { w.orderOut(nil); w.close() }
            // Room for the pages' titles and pictures to arrive.
            try? await Task.sleep(for: .seconds(9))
            try await WarmGreySnapshots.shoot(w, "links-\(dark ? "dark" : "light")", in: dir)
        }
    }
}
#endif
