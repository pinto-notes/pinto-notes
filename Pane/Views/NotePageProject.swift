import Compression
import Foundation
import WebKit

/// A note's app as a small codebase (prototype; see NotePage): files by path, and for .jsx, .tsx and
/// .ts files the JavaScript the AI tooling compiled when it wrote them (the device never compiles).
/// Stored as the page's sealed text, the whole project per version:
///
///     {"amberApp": 1, "files": {"/index.html": "…", "/src/App.jsx": "…"}, "compiled": {"/src/App.jsx": "…"},
///      "binary": {"/doom.wasm": "…"}}
///
/// binary holds the files that aren't text (a .wasm, a game's data, a picture), each as base64 of its
/// bytes compressed with raw DEFLATE; they're served as they are, with their type (2026-11-14).
/// A binary file can instead be stored once, apart, and named here by its hash:
/// `"/doom1.wad": {"hash": "<64 hex>", "size": 4196020}` (AppBlobs on the device, note_app_blobs on
/// the server; 2026-11-15), so a version of the app doesn't copy it again. A file over `partBytes`
/// (a disk image, a dataset) is stored in parts of `partBytes`, named in order:
/// `"/disk.img": {"size": 62914560, "parts": [{"hash": "…", "size": 4194304}, …]}` (2026-11-16).
/// Anything else is a one-file app: its HTML is /index.html. Served at pinto-app:///<path> (and at
/// amber-app:, the name older apps use), with the document at pinto-app:///index.html so relative modules and links work.
struct NotePageProject: Equatable {
    var files: [String: String]
    var compiled: [String: String] = [:]
    /// Binary files as stored (packed); unpacked when the app asks for one.
    var binary: [String: String] = [:]
    /// Binary files stored apart, by name (AppBlobs).
    var blobs: [String: BlobRef] = [:]
    /// Binary files stored apart in parts, in order (AppBlobs, a name each).
    var parts: [String: [BlobRef]] = [:]

    struct BlobRef: Equatable, Hashable {
        var hash: String
        /// Its bytes, unpacked.
        var size: Int
    }

    /// The limits, as the server has them (app_project.ts, 2026-11-16): the app's text (its text files,
    /// what they compile to, and the names of its binary files) is synced and kept in each version
    /// whole, so it has 16 MB. A binary file is stored apart in parts and served part by part, so it
    /// can be as big as a file added to a note: 100 MB.
    static let maxFiles = 10_000
    static let maxBytes = 16 * 1024 * 1024
    /// One text file: as much as the whole app's text.
    static let maxFileBytes = maxBytes
    /// A binary file unpacked: past this it isn't served, so a small file can't unpack into a huge one.
    static let maxBinaryBytes = 100 * 1024 * 1024
    /// A binary file over this is stored in parts of this size (PART_BYTES on the server).
    static let partBytes = 4 * 1024 * 1024
    static let base = URL(string: "pinto-app:///index.html")!

    var index: String { files["/index.html"] ?? "" }

    static func isProject(_ stored: String) -> Bool {
        stored.utf8.first == UInt8(ascii: "{") && stored.contains("\"amberApp\"")
    }

    /// The project, or nil when it can't be one: not JSON, no /index.html, a bad path, or over the limits.
    static func parse(_ stored: String) -> NotePageProject? {
        guard isProject(stored) else { return NotePageProject(files: ["/index.html": stored]) }
        guard let o = try? JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [String: Any],
              let files = o["files"] as? [String: String] else { return nil }
        let compiled = o["compiled"] as? [String: String] ?? [:]
        var p = NotePageProject(files: files, compiled: compiled)
        for (path, v) in o["binary"] as? [String: Any] ?? [:] {
            if let packed = v as? String {
                p.binary[path] = packed
            } else if let ref = blobRef(v) {
                p.blobs[path] = ref
            } else if let o = v as? [String: Any], let size = o["size"] as? Int, let list = o["parts"] as? [Any] {
                let refs = list.compactMap(blobRef)
                guard !refs.isEmpty, refs.count == list.count, refs.reduce(0, { $0 + $1.size }) == size else { return nil }
                p.parts[path] = refs
            } else {
                return nil
            }
        }
        return p.problem == nil ? p : nil
    }

    private static func blobRef(_ v: Any) -> BlobRef? {
        guard let o = v as? [String: Any], let hash = o["hash"] as? String, let size = o["size"] as? Int else { return nil }
        return BlobRef(hash: hash, size: size)
    }

    /// The names of the files a stored project keeps apart, parts included: what has to be here (and on the server) for it to open.
    static func blobNames(in stored: String) -> Set<String> {
        guard isProject(stored), stored.contains("\"hash\""),
              let o = try? JSONSerialization.jsonObject(with: Data(stored.utf8)) as? [String: Any],
              let binary = o["binary"] as? [String: Any] else { return [] }
        return Set(binary.values.flatMap { v -> [String] in
            guard let o = v as? [String: Any] else { return [] }
            if let hash = o["hash"] as? String { return [hash] }
            return (o["parts"] as? [Any] ?? []).compactMap { ($0 as? [String: Any])?["hash"] as? String }
        })
    }

    /// Why this project can't be shown, or nil.
    var problem: String? {
        if files["/index.html"] == nil { return "The app has no /index.html." }
        if files.count + binary.count + blobs.count + parts.count > Self.maxFiles { return "The app has more than \(Self.maxFiles) files." }
        for (path, _) in binary {
            if !Self.validPath(path) { return "\(path) isn't a valid path." }
            if files[path] != nil { return "\(path) is both a text file and a binary one." }
        }
        for (path, ref) in blobs {
            if !Self.validPath(path) { return "\(path) isn't a valid path." }
            if files[path] != nil || binary[path] != nil { return "\(path) is in the app twice." }
            if !AppBlobs.validName(ref.hash) { return "\(path) has no valid name." }
            if ref.size > Self.maxBinaryBytes { return "\(path) is over \(Self.maxBinaryBytes / 1024 / 1024) MB." }
        }
        for (path, refs) in parts {
            if !Self.validPath(path) { return "\(path) isn't a valid path." }
            if files[path] != nil || binary[path] != nil || blobs[path] != nil { return "\(path) is in the app twice." }
            if refs.isEmpty || !refs.allSatisfy({ AppBlobs.validName($0.hash) && $0.size >= 0 }) { return "\(path) has no valid name." }
            if refs.reduce(0, { $0 + $1.size }) > Self.maxBinaryBytes { return "\(path) is over \(Self.maxBinaryBytes / 1024 / 1024) MB." }
        }
        for (path, text) in files {
            if !Self.validPath(path) { return "\(path) isn't a valid path." }
            if text.utf8.count > Self.maxFileBytes { return "\(path) is over \(Self.maxFileBytes / 1024 / 1024) MB." }
            if Self.compiles(path), compiled[path] == nil { return "\(path) wasn't compiled." }
        }
        // The text only: a binary file is stored apart (storingBlobs) before the app is kept, as on the server.
        let total = files.values.reduce(0) { $0 + $1.utf8.count } + compiled.values.reduce(0) { $0 + $1.utf8.count }
        if total > Self.maxBytes { return "The app's text is over \(Self.maxBytes / 1024 / 1024) MB." }
        return nil
    }

    static func validPath(_ p: String) -> Bool {
        p.hasPrefix("/") && !p.contains("..") && !p.contains("//") && p.count < 200
            && p.range(of: #"^[A-Za-z0-9._\-/]+$"#, options: .regularExpression) != nil
    }

    static func compiles(_ p: String) -> Bool { p.hasSuffix(".jsx") || p.hasSuffix(".tsx") || p.hasSuffix(".ts") }

    /// What's sealed as the page: a lone /index.html stays plain HTML, as the server writes it.
    var stored: String {
        if files.count == 1, files["/index.html"] != nil, compiled.isEmpty, binary.isEmpty, blobs.isEmpty, parts.isEmpty { return index }
        var o: [String: Any] = ["amberApp": 1, "files": files, "compiled": compiled]
        var all: [String: Any] = binary
        for (path, ref) in blobs { all[path] = ["hash": ref.hash, "size": ref.size] }
        for (path, refs) in parts {
            all[path] = ["size": refs.reduce(0) { $0 + $1.size }, "parts": refs.map { ["hash": $0.hash, "size": $0.size] }] as [String: Any]
        }
        if !all.isEmpty { o["binary"] = all }
        let data = (try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys, .withoutEscapingSlashes])) ?? Data()
        return String(data: data, encoding: .utf8) ?? ""
    }

    /// The project with each packed binary file stored once in `store`, by its name in this account,
    /// and named here instead; one over `partBytes` in parts of `partBytes`, as the server cuts it, so
    /// the same file has the same names wherever it was added. What's already named stays as it is.
    func storingBlobs(_ sealer: Sealer, in store: AppBlobs) -> NotePageProject {
        var p = self
        for (path, packed) in binary {
            guard let bytes = Data(base64Encoded: packed), let data = Self.unpack(packed) else { continue }
            p.binary[path] = nil
            if data.count <= Self.partBytes {
                let hash = sealer.blobName(data)
                store.put(hash, packed: bytes)
                p.blobs[path] = BlobRef(hash: hash, size: data.count)
                continue
            }
            p.parts[path] = stride(from: 0, to: data.count, by: Self.partBytes).map { at in
                let part = data.subdata(in: at..<min(data.count, at + Self.partBytes))
                let hash = sealer.blobName(part)
                if !store.has(hash) { store.put(hash, packed: Self.packData(part)) }
                return BlobRef(hash: hash, size: part.count)
            }
        }
        return p
    }

    /// A binary file as stored: its bytes, raw DEFLATE (the server's "deflate-raw"), base64.
    static func pack(_ data: Data) -> String {
        packData(data).base64EncodedString()
    }

    /// A binary file's bytes, raw DEFLATE.
    static func packData(_ data: Data) -> Data {
        (try? (data as NSData).compressed(using: .zlib)) as Data? ?? Data()
    }

    /// A stored binary file's bytes, or nil when it isn't one or unpacks past `max`.
    static func unpack(_ stored: String, max: Int = maxBinaryBytes) -> Data? {
        guard let packed = Data(base64Encoded: stored) else { return nil }
        return unpack(data: packed, max: max)
    }

    /// Packed bytes (raw DEFLATE) unpacked, or nil past `max`.
    static func unpack(data packed: Data, max: Int = maxBinaryBytes) -> Data? {
        if packed.isEmpty { return Data() }
        var at = 0
        do {
            let filter = try InputFilter<Data>(.decompress, using: .zlib) { (n: Int) -> Data? in
                let end = Swift.min(at + n, packed.count)
                defer { at = end }
                return at < end ? packed.subdata(in: at..<end) : nil
            }
            var out = Data()
            while let chunk = try filter.readData(ofLength: 1 << 20), !chunk.isEmpty {
                out.append(chunk)
                if out.count > max { return nil }
            }
            return out
        } catch { return nil }
    }

    /// Bytes that go in binary: not UTF-8, or a NUL in the first 8 KB (as the server decides).
    static func isBinary(_ data: Data) -> Bool {
        data.prefix(8192).contains(0) || String(data: data, encoding: .utf8) == nil
    }

    struct FolderError: LocalizedError {
        let errorDescription: String?
        init(_ message: String) { errorDescription = message }
    }

    /// A folder on disk as an app, the way a web project is laid out: index.html at its top, text
    /// files as text, everything else (a .wasm, a game's data, pictures) as binary files. Hidden
    /// files are left out. Throws with a sentence a person can act on.
    static func folder(_ url: URL) throws -> NotePageProject {
        let root = url.standardizedFileURL.resolvingSymlinksInPath()
        guard FileManager.default.fileExists(atPath: root.appending(path: "index.html").path) else {
            throw FolderError("\(root.lastPathComponent) has no index.html at its top.")
        }
        var p = NotePageProject(files: [:])
        let keys: Set<URLResourceKey> = [.isRegularFileKey, .fileSizeKey]
        guard let walk = FileManager.default.enumerator(at: root, includingPropertiesForKeys: Array(keys), options: [.skipsHiddenFiles, .skipsPackageDescendants]) else {
            throw FolderError("\(root.lastPathComponent) can't be read.")
        }
        for case let file as URL in walk {
            let values = try file.resourceValues(forKeys: keys)
            guard values.isRegularFile == true else { continue }
            if (values.fileSize ?? 0) > maxBinaryBytes { throw FolderError("\(file.lastPathComponent) is over \(maxBinaryBytes / 1024 / 1024) MB.") }
            let path = "/" + file.resolvingSymlinksInPath().path.dropFirst(root.path.count).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            guard validPath(path) else { throw FolderError("\(path) has a name an app can't use: letters, digits, \".\", \"_\" and \"-\" only.") }
            let data = try Data(contentsOf: file)
            if isBinary(data) { p.binary[path] = pack(data) } else { p.files[path] = String(decoding: data, as: UTF8.self) }
        }
        if let problem = p.problem { throw FolderError(problem) }
        return p
    }

    /// The one dropped item that is a web project's folder (index.html at its top), or nil.
    static func appFolder(in urls: [URL]) -> URL? {
        guard urls.count == 1, let url = urls.first, url.isFileURL,
              (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true,
              FileManager.default.fileExists(atPath: url.appending(path: "index.html").path) else { return nil }
        return url
    }

    /// The HTML of the app's page (for what it declares in <meta> tags).
    static func entryHTML(_ stored: String) -> String {
        guard isProject(stored) else { return stored }
        return parse(stored)?.index ?? ""
    }

    /// A file as served: what the tooling compiled for it when there is something (JavaScript for
    /// .jsx/.tsx/.ts and React .js, Tailwind's CSS), the text otherwise, and its type. An import without an extension finds the file the
    /// way bundlers do (.tsx, .ts, .jsx, .js, then index.*). A stylesheet imported from a module
    /// (`import "./index.css"`, compiled to "./index.css?import") is a module that adds it.
    func serve(_ path: String, query: String? = nil, blobs store: AppBlobs = .shared) -> (data: Data, type: String)? {
        guard let path = resolve(path) else { return nil }
        if binary[path] != nil || blobs[path] != nil || parts[path] != nil {
            guard let data = bytes(path, blobs: store) else { return nil }
            let type = Self.mime(path)
            return (data, type == "text/plain" && !path.hasSuffix(".txt") ? "application/octet-stream" : type)
        }
        if query == "import", path.hasSuffix(".css") {
            let js = "if (!document.querySelector('link[href=\"\(path)\"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '\(path)'; document.head.appendChild(l); }\n"
            return (Data(js.utf8), "text/javascript")
        }
        // Whatever the tooling compiled wins, any extension (TSX, JS in a React project, Tailwind CSS).
        guard let text = compiled[path] ?? (Self.compiles(path) ? nil : files[path]) else { return nil }
        return (Data(text.utf8), Self.mime(path))
    }

    /// A binary file's bytes: unpacked, or its parts unpacked in order. Nil when one isn't on this
    /// device yet or a part doesn't unpack to the size it's named with.
    func bytes(_ path: String, blobs store: AppBlobs = .shared) -> Data? {
        if let packed = binary[path] { return Self.unpack(packed) }
        if let ref = blobs[path] { return store.packed(ref.hash).flatMap { Self.unpack(data: $0) } }
        guard let refs = parts[path] else { return nil }
        var out = Data(capacity: refs.reduce(0) { $0 + $1.size })
        for ref in refs {
            guard let packed = store.packed(ref.hash), let part = Self.unpack(data: packed, max: ref.size), part.count == ref.size else { return nil }
            out.append(part)
        }
        return out
    }

    func resolve(_ path: String) -> String? {
        if files[path] != nil || binary[path] != nil || blobs[path] != nil || parts[path] != nil { return path }
        for ext in [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.jsx", "/index.js"] where files[path + ext] != nil {
            return path + ext
        }
        return nil
    }

    static func mime(_ path: String) -> String {
        switch (path as NSString).pathExtension.lowercased() {
        case "html": "text/html"
        case "css": "text/css"
        case "js", "mjs", "jsx", "tsx", "ts": "text/javascript"
        case "json": "application/json"
        case "svg": "image/svg+xml"
        case "md", "txt": "text/plain"
        case "wasm": "application/wasm"
        case "png": "image/png"
        case "jpg", "jpeg": "image/jpeg"
        case "gif": "image/gif"
        case "webp": "image/webp"
        case "avif": "image/avif"
        case "ico": "image/x-icon"
        case "mp3": "audio/mpeg"
        case "m4a": "audio/mp4"
        case "wav": "audio/wav"
        case "ogg": "audio/ogg"
        case "mp4": "video/mp4"
        case "webm": "video/webm"
        case "woff": "font/woff"
        case "woff2": "font/woff2"
        case "ttf": "font/ttf"
        case "otf": "font/otf"
        case "pdf": "application/pdf"
        case "zip": "application/zip"
        case "bin", "wad", "dat": "application/octet-stream"
        default: "text/plain"
        }
    }

    /// Whether a type is text, so it's served with its charset.
    static func isText(_ type: String) -> Bool {
        type.hasPrefix("text/") || type == "application/json" || type == "image/svg+xml"
    }

    /// Bare module names for the bundled libraries: <script type="importmap"> before the app's own.
    static let importMap: String = {
        var imports: [String: String] = [
            "preact": "amber-lib:///esm/preact.js",
            "preact/hooks": "amber-lib:///esm/preact-hooks.js",
            "preact/jsx-runtime": "amber-lib:///esm/preact-jsx-runtime.js",
            "htm": "amber-lib:///esm/htm.js",
            // Like a Vite project: "@/components/ui/button" is /src/components/ui/button.tsx.
            "@/": "pinto-app:///src/",
            // The names apps are told to use (2026-11-14), and the amber names older apps import.
            "pinto-router": "pinto-lib:///esm/amber-router.js",
            "pinto": "pinto-lib:///esm/amber.js",
            "pinto-ui": "pinto-lib:///amber-ui/index.js",
            "amber-router": "pinto-lib:///esm/amber-router.js",
            "amber": "pinto-lib:///esm/amber.js",
            "amber-ui": "pinto-lib:///amber-ui/index.js",
        ]
        // The other bundled libraries by their npm names, each its global as the default export.
        for lib in NotePageLibraries.bundled where !["preact", "preact-hooks", "htm", "router"].contains(lib.name) {
            imports[lib.package] = "amber-lib:///esm/\(lib.name).js"
        }
        // The app stack: React (preact/compat) and the libraries built on it, and Preact itself, so
        // there is one Preact for everything.
        for (name, file) in NotePageLibraries.stack?.map ?? [:] { imports[name] = "amber-lib:///stack/\(file)" }
        let json = (try? JSONSerialization.data(withJSONObject: ["imports": imports], options: [.sortedKeys])).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return #"<script type="importmap">"# + json.replacingOccurrences(of: "\\/", with: "/") + "</script>"
    }()
}

/// pinto-app:///<path> (and amber-app:): the app's own files, and nothing else.
final class AppScheme: NSObject, WKURLSchemeHandler {
    nonisolated(unsafe) var project = NotePageProject(files: [:])

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        guard let url = task.request.url, let (data, type) = project.serve(url.path.isEmpty ? "/index.html" : url.path, query: url.query) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                        headerFields: ["Content-Type": type + (NotePageProject.isText(type) ? "; charset=utf-8" : ""), "Content-Length": "\(data.count)", "Access-Control-Allow-Origin": "*"])!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}
}
