import Foundation
import SwiftData
import Testing
@testable import Pane

extension NetworkFaults {
/// A file edited here while its bytes are going up: the newer bytes go up too, and the file isn't
/// marked as on the server with the older ones.
@MainActor @Suite(.sealedAccount) struct FileUploadEditTests {
    let context: ModelContext
    let engine: SyncEngine
    let container: ModelContainer
    private let tmp = FileManager.default.temporaryDirectory.appending(path: "upload-edit-\(UUID().uuidString)")

    init() throws {
        StubSupabase.reset()
        NetFault.config = .init()
        NetFault.resetLog()
        UserDefaults.standard.removeObject(forKey: "syncCursor.\(SealedAccount.user.uuidString)")
        container = try ModelContainer(for: Folder.self, Note.self, Attachment.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        context = container.mainContext
        engine = SyncEngine(backend: Backend(testClient: StubSupabase.client(), email: "qa@example.com", userID: SealedAccount.user), context: context)
    }

    @Test func anEditDuringTheUploadGoesUpToo() async throws {
        defer { try? FileManager.default.removeItem(at: tmp) }
        try FileManager.default.createDirectory(at: tmp, withIntermediateDirectories: true)
        let url = tmp.appending(path: "List.txt")
        try Data("version one".utf8).write(to: url)
        let folder = context.createFolder(named: "Lists")
        let file = try #require(context.addFiles([url], to: folder).first)
        defer { FileStore.remove(file) }
        // Saved again here while the first bytes are on their way.
        nonisolated(unsafe) let ctx = context
        nonisolated(unsafe) let edited = file
        let once = Once()
        StubSupabase.onRequest = { method, path in
            guard method == "POST" || method == "PUT", path.hasPrefix("/storage/v1/object/files/"), once.first() else { return }
            DispatchQueue.main.sync { MainActor.assumeIsolated { try? ctx.saveText(edited, "version two") } }
        }
        await engine.sync()
        StubSupabase.onRequest = nil
        await engine.sync()
        let path = SyncEngine.storagePath(user: SealedAccount.user, id: file.id)
        let stored = try #require(StubSupabase.objects[path])
        #expect(String(decoding: try Wire.sealer!.openFile(stored, id: file.id), as: UTF8.self) == "version two")
        #expect(file.uploaded && !file.dirty && !file.bytesEdited)
        let row = try #require(StubSupabase.rows("attachments").first { ($0["id"] as? String)?.lowercased() == file.id.uuidString.lowercased() })
        #expect(row["content_version"] as? Int == file.contentVersion)
        await engine.stop()
    }
}
}

private final class Once: @unchecked Sendable {
    private let lock = NSLock()
    private var done = false
    func first() -> Bool { lock.withLock { defer { done = true }; return !done } }
}
