#if os(macOS)
import AppKit
import SwiftData
import SwiftUI
import Testing
@testable import Pane

/// A note with a picture shows it at its row's end, as Apple Notes does (Emil, 31 October 2026);
/// a note without one shows nothing there.
@MainActor @Suite(.serialized) struct NoteRowThumbnailTests {
    /// A plain red picture, so it can be found in the list's pixels.
    static func redPicture() throws -> URL {
        let rep = try #require(NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 120, pixelsHigh: 120, bitsPerSample: 8, samplesPerPixel: 4,
                                                hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSColor(srgbRed: 1, green: 0, blue: 0, alpha: 1).setFill()
        NSRect(x: 0, y: 0, width: 120, height: 120).fill()
        NSGraphicsContext.restoreGraphicsState()
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("thumb-\(UUID().uuidString).png")
        try #require(rep.representation(using: .png, properties: [:])).write(to: url)
        return url
    }

    /// A library with a note that shows a red picture (on this device) and one without.
    static func library() throws -> (ModelContainer, picture: Pane.Attachment, cabin: Note, plain: Note, cleanUp: () -> Void) {
        let c = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let ctx = c.mainContext
        let source = try Self.redPicture()
        defer { try? FileManager.default.removeItem(at: source) }
        let picture = try FileStore.importFile(at: source)
        ctx.insert(picture)
        let plain = ctx.createNote(in: .all, body: "Groceries\nFor the weekend")
        let cabin = ctx.createNote(in: .all, body: "Cabin trip\nThe view from the porch\n![porch.png](pane-file:\(picture.id.uuidString))\n")
        try ctx.save()
        return (c, picture, cabin, plain, { FileStore.remove(picture) })
    }

    /// The picture a row shows: the note's first, while it's on this device and not deleted; none
    /// for a note without one or a locked note.
    @Test func theRowsPicture() throws {
        let (c, picture, cabin, plain, cleanUp) = try Self.library()
        defer { cleanUp() }
        #expect(NoteRow.picture(of: cabin)?.id == picture.id)
        #expect(NoteRow.picture(of: plain) == nil)
        // A picture that's gone, or not on this device yet: no thumbnail, not a broken one.
        picture.deletedAt = .now
        #expect(NoteRow.picture(of: cabin) == nil, "deleted")
        picture.deletedAt = nil
        let bytes = try Data(contentsOf: FileStore.url(for: picture.id, filename: picture.filename))
        FileStore.remove(picture)
        #expect(NoteRow.picture(of: cabin) == nil, "not on this device")
        try FileManager.default.createDirectory(at: FileStore.url(for: picture.id, filename: picture.filename).deletingLastPathComponent(), withIntermediateDirectories: true)
        try bytes.write(to: FileStore.url(for: picture.id, filename: picture.filename))
        #expect(NoteRow.picture(of: cabin)?.id == picture.id, "back")
        // Locked: its text is sealed, so nothing of it shows.
        cabin.lockedBody = "sealed"
        cabin.body = "Cabin trip"
        try c.mainContext.save()
        #expect(NoteRow.picture(of: cabin) == nil, "locked")
    }

    /// The row, drawn: the picture at the cabin's row's end, about the thumbnail's size, nothing in
    /// the other row's. The row by itself (a list's cells draw nothing in an offscreen window).
    @Test(arguments: [false, true]) func aNoteShowsItsFirstPicture(dark: Bool) async throws {
        let (c, _, cabin, plain, cleanUp) = try Self.library()
        defer { cleanUp() }
        let width: CGFloat = 300
        var found: [String: (count: Int, minX: CGFloat)] = [:]
        for (name, note) in [("plain", plain), ("cabin", cabin)] {
            let host = NSHostingView(rootView: NoteRow(note: note).frame(width: width).modelContainer(c))
            let window = NSWindow(contentRect: CGRect(x: -20000, y: -20000, width: width, height: 80), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)
            window.contentView = host
            defer { window.close() }
            // The thumbnail is made off the main thread: wait for it (the plain row the same time).
            for _ in 0..<20 {
                try await Task.sleep(for: .seconds(0.2))
                host.layoutSubtreeIfNeeded()
                found[name] = Self.red(in: host)
                if found[name]!.count > 0 { break }
            }
        }
        print("PERF thumbnail \(dark ? "dark" : "light"): red points \(found)")
        let side = RowMetrics.thumbnail
        let pic = try #require(found["cabin"])
        #expect(pic.count > Int(side * side * 0.6), "a whole thumbnail, not a sliver: \(pic.count) pt²")
        #expect(pic.minX > width - side - 4, "at the row's end: from \(pic.minX) of \(width)")
        #expect(found["plain"]?.count == 0, "nothing in a row without a picture")
    }

    /// Strongly red points (one per point, not pixel) in a view, and where the first starts.
    static func red(in view: NSView) -> (count: Int, minX: CGFloat) {
        guard let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return (0, .infinity) }
        view.cacheDisplay(in: view.bounds, to: rep)
        let scale = CGFloat(rep.pixelsWide) / view.bounds.width
        var count = 0, minX = CGFloat.infinity
        for y in 0..<Int(view.bounds.height) {
            for x in 0..<Int(view.bounds.width) {
                guard let c = rep.colorAt(x: Int(CGFloat(x) * scale), y: Int(CGFloat(y) * scale))?.usingColorSpace(.sRGB) else { continue }
                if c.redComponent > 0.75, c.greenComponent < 0.4, c.blueComponent < 0.4 { count += 1; minX = min(minX, CGFloat(x)) }
            }
        }
        return (count, minX)
    }
}
#endif
