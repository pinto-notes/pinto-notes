import ImageIO
import SwiftData
import SwiftUI
import UniformTypeIdentifiers
#if os(iOS)
import PhotosUI
#else
import AppKit
#endif

/// What a note that is an app can ask the device for (see NotePage): a link opened, a file handed
/// to the share sheet, and photos or files the person picks. Each is something the person does
/// themselves in a system sheet; no permission is given to the app.
///
/// Apps could once also use Reminders, Calendar, notifications, the camera, contacts, location,
/// Maps, weather and the on-device model. Those were removed on 2026-10-11: the system gives each
/// of those permissions to Pinto Notes as a whole, so one app allowed meant every app in every note
/// allowed. An app that still calls one is answered "… aren't available in apps yet." by the
/// page's own bridge (NotePageSandbox.bootstrap); nothing of it reaches here.
@MainActor
enum NotePageDevice {
    struct Unavailable: LocalizedError {
        let errorDescription: String?
        init(_ s: String) { errorDescription = s }
    }

    static func handle(_ m: [String: Any], context: ModelContext) async throws -> [String: Any] {
        switch m["op"] as? String {
        case "openURL": return try openURL(m)
        case "share": return try await share(m)
        case "photos.pick": return try await pickPhotos(m, context: context)
        case "files.pick": return try await pickFiles(context: context)
        default: throw Unavailable("That isn't available in apps yet.")
        }
    }

    // MARK: A link

    private static func openURL(_ m: [String: Any]) throws -> [String: Any] {
        guard let s = m["url"] as? String, let url = URL(string: s), ["https", "http", "mailto", "tel"].contains(url.scheme?.lowercased() ?? "") else {
            throw NotePage.OpError("Only web, mail and phone links open.")
        }
        #if os(iOS)
        UIApplication.shared.open(url)
        #else
        NSWorkspace.shared.open(url)
        #endif
        return [:]
    }

    // MARK: Photos, files, the share sheet

    /// Keeps a picked image as a file of the note's account (encrypted with the rest), downscaled
    /// to 2048 px, and returns its reference with a small preview for the page.
    static func keepImage(_ data: Data, name: String, context: ModelContext) throws -> [String: Any] {
        guard let src = CGImageSourceCreateWithData(data as CFData, nil),
              let big = CGImageSourceCreateThumbnailAtIndex(src, 0, [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 2048, kCGImageSourceCreateThumbnailWithTransform: true] as CFDictionary),
              let small = CGImageSourceCreateThumbnailAtIndex(src, 0, [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 480, kCGImageSourceCreateThumbnailWithTransform: true] as CFDictionary)
        else { throw NotePage.OpError("That isn't an image.") }
        func jpeg(_ i: CGImage, _ q: Double) -> Data? {
            let out = NSMutableData()
            guard let dst = CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil) else { return nil }
            CGImageDestinationAddImage(dst, i, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
            return CGImageDestinationFinalize(dst) ? out as Data : nil
        }
        guard let full = jpeg(big, 0.85), let thumb = jpeg(small, 0.75) else { throw NotePage.OpError("That image couldn't be read.") }
        let a = try FileStore.importData(full, filename: (name as NSString).deletingPathExtension + ".jpg", type: .jpeg)
        context.insert(a)
        try? context.save()
        SyncSignal.changed()
        return ["$file": a.id.uuidString.lowercased(), "name": a.filename, "type": "image/jpeg", "size": a.size,
                "width": big.width, "height": big.height, "thumb": "data:image/jpeg;base64," + thumb.base64EncodedString()]
    }

    static func keepFile(_ url: URL, context: ModelContext) throws -> [String: Any] {
        let a = try FileStore.importFile(at: url)
        context.insert(a)
        try? context.save()
        SyncSignal.changed()
        return ["$file": a.id.uuidString.lowercased(), "name": a.filename, "type": a.type.preferredMIMEType ?? "application/octet-stream", "size": a.size]
    }

    /// amber.device.share({ name, type, text | base64 }): an export (CSV, JSON, a picture) through the
    /// share sheet on iPhone, or a Save panel on the Mac. Nothing leaves without the person choosing where.
    @MainActor
    static func share(_ m: [String: Any]) async throws -> [String: Any] {
        let name = ((m["name"] as? String) ?? "Export.txt").replacingOccurrences(of: "/", with: "-").prefix(120)
        let data: Data
        if let t = m["text"] as? String { data = Data(t.utf8) }
        else if let b = m["base64"] as? String, let d = Data(base64Encoded: b) { data = d }
        else { throw NotePage.OpError("Send { name, text } or { name, base64 }.") }
        guard data.count <= 50 * 1024 * 1024 else { throw NotePage.OpError("An export can be at most 50 MB.") }
        #if os(iOS)
        let dir = FileManager.default.temporaryDirectory.appending(path: "amber-export-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appending(path: String(name))
        try data.write(to: url)
        let shared: Bool = await withCheckedContinuation { c in
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sheet.completionWithItemsHandler = { _, done, _, _ in
                try? FileManager.default.removeItem(at: dir)
                c.resume(returning: done)
            }
            guard let top = try? top() else { c.resume(returning: false); return }
            sheet.popoverPresentationController?.sourceView = top.view
            sheet.popoverPresentationController?.sourceRect = CGRect(x: top.view.bounds.midX, y: top.view.bounds.maxY - 40, width: 1, height: 1)
            top.present(sheet, animated: true)
        }
        return ["shared": shared]
        #else
        let panel = NSSavePanel()
        panel.nameFieldStringValue = String(name)
        guard await panel.begin() == .OK, let url = panel.url else { return ["shared": false] }
        try data.write(to: url, options: .atomic)
        return ["shared": true]
        #endif
    }

    #if os(iOS)
    /// Carries a picker's result out of its callback.
    final class Box<T>: @unchecked Sendable {
        let value: T
        init(_ value: T) { self.value = value }
    }

    static func top() throws -> UIViewController {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        guard var vc = scenes.flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController else { throw Unavailable("Nothing to show it on.") }
        while let next = vc.presentedViewController { vc = next }
        return vc
    }

    private final class PhotoDelegate: NSObject, PHPickerViewControllerDelegate {
        var done: ([PHPickerResult]) -> Void = { _ in }
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            done(results)
        }
    }
    private static var photoDelegate: PhotoDelegate?

    private static func pickPhotos(_ m: [String: Any], context: ModelContext) async throws -> [String: Any] {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = min(max((m["limit"] as? Int) ?? 1, 1), 20)
        let picker = PHPickerViewController(configuration: config)
        let d = PhotoDelegate()
        photoDelegate = d
        picker.delegate = d
        let results: [PHPickerResult] = await withCheckedContinuation { (c: CheckedContinuation<Box<[PHPickerResult]>, Never>) in
            d.done = { c.resume(returning: Box($0)) }
            (try? top())?.present(picker, animated: true) ?? c.resume(returning: Box([]))
        }.value
        photoDelegate = nil
        var files: [[String: Any]] = []
        for r in results {
            let data: Data? = await withCheckedContinuation { c in
                r.itemProvider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, _ in c.resume(returning: data) }
            }
            if let data { files.append(try keepImage(data, name: r.itemProvider.suggestedName ?? "Photo", context: context)) }
        }
        return ["files": files]
    }

    private final class FileDelegate: NSObject, UIDocumentPickerDelegate {
        var done: ([URL]) -> Void = { _ in }
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { done(urls) }
        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { done([]) }
    }
    private static var fileDelegate: FileDelegate?

    private static func pickFiles(context: ModelContext) async throws -> [String: Any] {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.item], asCopy: true)
        let d = FileDelegate()
        fileDelegate = d
        picker.delegate = d
        let urls: [URL] = await withCheckedContinuation { c in
            d.done = { c.resume(returning: $0) }
            (try? top())?.present(picker, animated: true) ?? c.resume(returning: [])
        }
        fileDelegate = nil
        return ["files": try urls.map { try keepFile($0, context: context) }]
    }
    #else
    private static func open(_ types: [UTType], many: Bool) async -> [URL] {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = types
        panel.allowsMultipleSelection = many
        return await panel.begin() == .OK ? panel.urls : []
    }

    private static func pickPhotos(_ m: [String: Any], context: ModelContext) async throws -> [String: Any] {
        let urls = await open([.image], many: ((m["limit"] as? Int) ?? 1) > 1)
        return ["files": try urls.map { url in
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            return try keepImage(try Data(contentsOf: url), name: url.lastPathComponent, context: context)
        }]
    }

    private static func pickFiles(context: ModelContext) async throws -> [String: Any] {
        ["files": try await open([.item], many: true).map { try keepFile($0, context: context) }]
    }
    #endif
}
