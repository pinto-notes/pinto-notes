#if os(macOS)
import Foundation
import SwiftData
import Testing
@testable import Pane

/// The pointer resting on a note's row gets its pictures ready; passing over it does nothing.
@MainActor @Suite(.serialized) struct NotePreloadTests {
    static func note(pictures: Int) throws -> (ModelContainer, Note, [URL]) {
        let c = try ModelContainer(for: Folder.self, Note.self, Pane.Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let folder = c.mainContext.createFolder(named: "Notes")
        var lines = ["Trip", ""], urls: [URL] = []
        for k in 0..<pictures {
            let a = try FileStore.importData(try NoteOpenTests.photo(CGFloat(k) / 4), filename: "IMG_\(k).jpg", type: .jpeg)
            c.mainContext.insert(a)
            lines.append(a.markdown)
            urls.append(FileStore.url(for: a.id, filename: a.filename))
        }
        let n = c.mainContext.createNote(in: .folder(folder.id), body: lines.joined(separator: "\n"))
        try c.mainContext.save()
        return (c, n, urls)
    }

    static func remove(_ urls: [URL]) { for u in urls { try? FileManager.default.removeItem(at: u.deletingLastPathComponent()) } }

    @Test func restingOnARowDecodesItsPicturesAtTheirShownSize() async throws {
        let (c, n, urls) = try Self.note(pictures: 2)
        defer { Self.remove(urls) }
        _ = c
        NotePreload.pointer(true, on: n)
        for _ in 0..<100 where urls.contains(where: { EmbedImages.cached($0) == nil }) { try? await Task.sleep(for: .milliseconds(20)) }
        for u in urls {
            let image = try #require(EmbedImages.cached(u), "the picture is ready before the note opens")
            #expect(max(image.width, image.height) <= EmbedImages.maxPixels, "decoded at the size a note shows it, not 4032 px")
        }
    }

    @Test func passingOverARowDoesNothing() async throws {
        let (c, n, urls) = try Self.note(pictures: 1)
        defer { Self.remove(urls) }
        _ = c
        let before = NotePreload.prepared
        NotePreload.pointer(true, on: n)
        try? await Task.sleep(for: .milliseconds(20))
        NotePreload.pointer(false, on: n)
        try? await Task.sleep(for: .milliseconds(200))
        #expect(NotePreload.prepared == before && EmbedImages.cached(urls[0]) == nil, "gone before the dwell: nothing got ready")
    }

    @Test func aLockedNoteIsNeverRead() async throws {
        let (c, n, urls) = try Self.note(pictures: 1)
        defer { Self.remove(urls) }
        _ = c
        n.lockedBody = "sealed"
        let before = NotePreload.prepared
        NotePreload.pointer(true, on: n)
        try? await Task.sleep(for: .milliseconds(250))
        #expect(NotePreload.prepared == before && EmbedImages.cached(urls[0]) == nil)
    }
}
#endif
