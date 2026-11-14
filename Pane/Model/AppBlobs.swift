import Foundation

/// A note app's binary files on this device, each once, by its name (the keyed hash the server
/// uses too, note_app_blobs). A project names them (NotePageProject.blobs), so the apps and their
/// versions in note-pages.json stay small: ten versions of Doom are one WAD here.
///
/// Each file is kept as the app stores it (its bytes, raw DEFLATE), in a folder beside the library.
/// Files no page or version names any more are removed (`keep`).
final class AppBlobs: @unchecked Sendable {
    /// In memory under tests, as NotePageStore.shared keeps no file there.
    static let shared = AppBlobs(folder: ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil || ProcessInfo.processInfo.arguments.contains("-uitest") ? nil : defaultFolder)

    static var defaultFolder: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "\(AppIdentity.dataFolder)/app-files")
    }

    private let folder: URL?
    private let lock = NSLock()
    /// In memory, for tests (no folder).
    private var memory: [String: Data] = [:]

    init(folder: URL?) { self.folder = folder }

    static func validName(_ hash: String) -> Bool {
        hash.utf8.count == 64 && hash.utf8.allSatisfy { (48...57).contains($0) || (97...102).contains($0) }
    }

    private func url(_ hash: String) -> URL? { Self.validName(hash) ? folder?.appending(path: hash) : nil }

    func has(_ hash: String) -> Bool {
        guard Self.validName(hash) else { return false }
        if let u = url(hash) { return FileManager.default.fileExists(atPath: u.path) }
        return lock.withLock { memory[hash] != nil }
    }

    /// A file's packed bytes, or nil when this device doesn't have it.
    func packed(_ hash: String) -> Data? {
        guard Self.validName(hash) else { return nil }
        if let u = url(hash) { return try? Data(contentsOf: u, options: .mappedIfSafe) }
        return lock.withLock { memory[hash] }
    }

    func put(_ hash: String, packed: Data) {
        guard Self.validName(hash) else { return }
        if let u = url(hash) {
            if FileManager.default.fileExists(atPath: u.path) { return }
            try? FileManager.default.createDirectory(at: u.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? packed.write(to: u, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        } else {
            lock.withLock { memory[hash] = packed }
        }
    }

    /// Every file this device has.
    var all: Set<String> {
        if let folder {
            return Set(((try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []).filter(Self.validName))
        }
        return lock.withLock { Set(memory.keys) }
    }

    /// Removes the files not in `names`.
    func keep(_ names: Set<String>) {
        for hash in all.subtracting(names) {
            if let u = url(hash) { try? FileManager.default.removeItem(at: u) } else { _ = lock.withLock { memory.removeValue(forKey: hash) } }
        }
    }

    func forgetAll() {
        if let folder { try? FileManager.default.removeItem(at: folder) }
        lock.withLock { memory = [:] }
    }
}
