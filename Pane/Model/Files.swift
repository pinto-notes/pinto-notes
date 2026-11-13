import Foundation
import SwiftData
import ImageIO
import UniformTypeIdentifiers

/// A file kept in Pane (PDF, spreadsheet, image…). Notes embed it with
/// `[name](pane-file:<id>)`, or it sits in a folder on its own, next to the folder's notes
/// (`folderID`). The bytes live in the app's container and, sealed with the account's key,
/// in Storage at `<user id>/<id>`.
@Model
final class Attachment {
    @Attribute(.unique) var id: UUID
    var filename: String
    /// A UTType identifier, e.g. "com.adobe.pdf".
    var contentType: String
    var size: Int64
    var createdAt: Date
    var deletedAt: Date?
    /// The bytes are in Storage.
    var uploaded: Bool = false
    /// Metadata changed here and not yet pushed.
    var dirty: Bool = true
    /// The folder it sits in on its own; nil for a file that only notes embed.
    var folderID: UUID?
    /// In Recently Deleted (a file in a folder). Deleted for good after 30 days.
    var trashedAt: Date?
    /// When its name, folder or state last changed; the list sorts files by it.
    var modifiedAt: Date?
    /// How many times its bytes were replaced (by the AI, or edited here); a new number means fetch them again.
    var contentVersion: Int = 0
    /// Its bytes were edited on this device and haven't gone up yet.
    var bytesEdited: Bool = false

    init(id: UUID = UUID(), filename: String, contentType: String, size: Int64) {
        self.id = id
        self.filename = filename
        self.contentType = contentType
        self.size = size
        createdAt = .now
    }

    var type: UTType { UTType(contentType) ?? .data }
    var isImage: Bool { type.conforms(to: .image) }
    var sizeText: String { ByteCountFormatter.string(fromByteCount: size, countStyle: .file) }
    var kindText: String { type.localizedDescription ?? (filename as NSString).pathExtension.uppercased() }
    var markdown: String { FileStore.markdown(id: id, filename: filename, image: isImage) }

    /// The date the list shows and sorts by.
    var listDate: Date { modifiedAt ?? createdAt }

    /// The icon for this kind of file, in the list and in a note.
    var symbol: String {
        let t = type
        if t.conforms(to: .pdf) { return "doc.richtext" }
        if t.conforms(to: .spreadsheet) || ["xlsx", "xls", "csv", "numbers"].contains(ext) { return "tablecells" }
        if t.conforms(to: .presentation) { return "rectangle.on.rectangle" }
        if t.conforms(to: .image) { return "photo" }
        if t.conforms(to: .audiovisualContent) { return "play.rectangle" }
        if t.conforms(to: .archive) { return "archivebox" }
        if t.conforms(to: .text) { return "doc.text" }
        return "doc"
    }

    private var ext: String { (filename as NSString).pathExtension.lowercased() }

    /// Marks a local change for sync.
    @MainActor func touch() {
        modifiedAt = .now
        dirty = true
        SyncSignal.changed()
    }
}

/// Where attachment bytes live on this device.
enum FileStore {
    static var root: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appending(path: ProcessInfo.processInfo.arguments.contains("-uitest") ? "Pane-test/Files" : "\(AppIdentity.dataFolder)/Files", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    static func url(for id: UUID, filename: String) -> URL {
        root.appending(path: id.uuidString, directoryHint: .isDirectory).appending(path: safe(filename))
    }

    static func exists(_ a: Attachment) -> Bool {
        FileManager.default.fileExists(atPath: url(for: a.id, filename: a.filename).path)
    }

    /// The local copy follows a rename (its name is part of its path here).
    static func rename(_ id: UUID, from old: String, to new: String) {
        let from = url(for: id, filename: old), to = url(for: id, filename: new)
        guard from != to, FileManager.default.fileExists(atPath: from.path) else { return }
        try? FileManager.default.removeItem(at: to)
        try? FileManager.default.moveItem(at: from, to: to)
    }

    /// Removes this device's copy of a file.
    static func remove(_ a: Attachment) {
        try? FileManager.default.removeItem(at: url(for: a.id, filename: a.filename).deletingLastPathComponent())
    }

    /// Copies a file into Pane and returns its record (not yet inserted).
    static func importFile(at source: URL) throws -> Attachment {
        let access = source.startAccessingSecurityScopedResource()
        defer { if access { source.stopAccessingSecurityScopedResource() } }
        let values = try? source.resourceValues(forKeys: [.contentTypeKey, .fileSizeKey, .nameKey])
        let name = values?.name ?? source.lastPathComponent
        let type = values?.contentType ?? UTType(filenameExtension: source.pathExtension) ?? .data
        let a = Attachment(filename: name, contentType: type.identifier, size: Int64(values?.fileSize ?? 0))
        let dest = url(for: a.id, filename: name)
        try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: source, to: dest)
        if a.size == 0 { a.size = Int64((try? Data(contentsOf: dest).count) ?? 0) }
        return a
    }

    /// Saves raw data (a pasted image, a dropped item without a file URL).
    static func importData(_ data: Data, filename: String, type: UTType) throws -> Attachment {
        let a = Attachment(filename: filename, contentType: type.identifier, size: Int64(data.count))
        let dest = url(for: a.id, filename: filename)
        try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: dest, options: .atomic)
        return a
    }

    static func markdown(id: UUID, filename: String, image: Bool) -> String {
        let label = filename.replacingOccurrences(of: "]", with: ")").replacingOccurrences(of: "[", with: "(")
        return "\(image ? "!" : "")[\(label)](pane-file:\(id.uuidString.lowercased()))"
    }

    private static func safe(_ name: String) -> String {
        let cleaned = name.replacingOccurrences(of: "/", with: "-").replacingOccurrences(of: ":", with: "-")
        return cleaned.isEmpty ? "file" : cleaned
    }
}

/// Image heights from their real proportions, for the width images show at.
/// A note that is an app, linked from another note on a line of its own, shows there as a live
/// widget instead of a link (see NotePage). Kept here, off the main actor, because embed heights are read while laying out.
enum NoteWidgets {
    nonisolated(unsafe) private static var apps: [UUID: CGFloat] = [:]
    #if os(iOS)
    static let standard: CGFloat = 300
    #else
    static let standard: CGFloat = 320
    #endif
    /// Wider than images and cards: an app uses the note's width.
    static let maxWidth: CGFloat = 920

    /// The widget's height for a note that is an app, nil for any other note.
    static func height(_ id: UUID) -> CGFloat? { apps[id] }
    static func isApp(_ id: UUID) -> Bool { apps[id] != nil }

    /// A page can ask for its widget height with <meta name="amber-widget-height" content="260">,
    /// from 160 to 600 points.
    static func update(_ id: UUID, html: String?, enabled: Bool = NoteApps.enabled) {
        guard enabled, let html else { apps[id] = nil; return }
        var h = standard
        if let r = html.range(of: #"<meta[^>]*name=["']amber-widget-height["'][^>]*content=["']?(\d+)"#, options: .regularExpression),
           let n = html[r].split(whereSeparator: { !$0.isNumber }).last.flatMap({ Double($0) }) {
            h = min(max(CGFloat(n), 160), 600)
        }
        apps[id] = h + WidgetMetrics.header
    }
}

enum WidgetMetrics {
    /// The widget's title bar, above the app.
    static let header: CGFloat = 40
}

/// How big a picture shows in its note, written after its name: `![Sunset.png|small](pane-file:…)`
/// (Emil, 11-01). Without one it fits the text's width.
enum ImageSize: String, CaseIterable {
    case small, fit, cover

    var title: String {
        switch self {
        case .small: "Small"
        case .fit: "Fit Width"
        case .cover: "Cover"
        }
    }
}

enum ImageSizes {
    nonisolated(unsafe) static var aspect: [UUID: CGFloat] = [:]
    /// Its own width in points (pixels at its resolution): a picture is never shown larger.
    nonisolated(unsafe) static var natural: [UUID: CGFloat] = [:]
    /// The text's width and the window's height, from the editor (EditorCore.setImageBox).
    nonisolated(unsafe) static var column: CGFloat = 520
    nonisolated(unsafe) static var viewHeight: CGFloat = 900
    /// Cards and note apps line up with this width.
    static let maxWidth: CGFloat = 520

    /// A picture's label split into its name and its size: "Sunset.png|small".
    static func label(_ raw: String) -> (name: String, size: ImageSize) {
        guard let bar = raw.lastIndex(of: "|"), let size = ImageSize(rawValue: String(raw[raw.index(after: bar)...]).lowercased()) else {
            return (raw, .fit)
        }
        return (String(raw[..<bar]), size)
    }

    /// The label for `name` at `size` (fit needs nothing written).
    static func label(_ name: String, size: ImageSize) -> String {
        size == .fit ? name : "\(name)|\(size.rawValue)"
    }

    /// The picture's size in the note: as wide as the text (never larger than itself) and at most
    /// 60% of the window's height; small is about a third; a cover is a banner across the text.
    static func size(for e: LineEmbed) -> CGSize {
        guard case .image(let id, let raw) = e.kind else { return .zero }
        let size = label(raw).size
        let column = max(column, 120)
        // Not on this device yet: its place is laid out at its size label with a camera photo's
        // shape (most pictures are), so it barely moves when it arrives. A cover is the same
        // banner either way. (It was a 220-point strip across the text, whatever its size.)
        let known = aspect[id].flatMap { $0 > 0 ? $0 : nil }
        let a = known ?? Self.guessedAspect
        let own = natural[id] ?? .infinity
        switch size {
        case .cover:
            return CGSize(width: column, height: min(max(column / 2.6, 120), viewHeight * 0.45))
        case .small:
            let w = min(column * 0.4, 260, own)
            return CGSize(width: w, height: min(w / a, 260))
        case .fit:
            var w = min(column, own)
            var h = w / a
            let cap = max(viewHeight * 0.6, 200)
            if h > cap { h = cap; w = h * a }
            return CGSize(width: w, height: max(h, 40))
        }
    }

    /// The shape a picture whose size isn't known yet is given: a camera photo's, 4:3.
    static let guessedAspect: CGFloat = 4 / 3

    static func height(for e: LineEmbed) -> CGFloat { size(for: e).height }

    /// Reads the image's pixel size once and remembers its aspect ratio and its own width.
    static func learn(_ id: UUID, url: URL) {
        guard aspect[id] == nil, let src = CGImageSourceCreateWithURL(url as CFURL, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
              let w = props[kCGImagePropertyPixelWidth] as? CGFloat, let h = props[kCGImagePropertyPixelHeight] as? CGFloat, h > 0 else { return }
        aspect[id] = w / h
        // A screenshot is 144 dpi: its pixels are half points. Most photos say 72.
        let dpi = (props[kCGImagePropertyDPIWidth] as? CGFloat).flatMap { $0 > 0 ? $0 : nil } ?? 72
        natural[id] = w * 72 / dpi
    }

    /// The picture line `line` with its size set to `size`.
    static func relabel(_ line: String, to size: ImageSize) -> String? {
        let ns = line as NSString
        guard let m = pictureLine.firstMatch(in: line, range: NSRange(location: 0, length: ns.length)) else { return nil }
        let name = label(ns.substring(with: m.range(at: 2))).name
        return ns.replacingCharacters(in: m.range(at: 2), with: label(name, size: size))
    }
    private static let pictureLine = try! NSRegularExpression(pattern: #"^([ \t]*!\[)([^\]]*)(\]\(pane-file:[0-9a-fA-F-]{36}\)[ \t]*)$"#)
}

/// A note's cover and icon (Emil, 13 November 2026: "number 1 is something we should clearly do").
/// The cover is a picture at Cover size (`![Lemons.jpg|cover](pane-file:…)`) on the first line after
/// the title: the editor draws it as a banner above the title. The icon is an emoji the title starts
/// with ("🍋 Lemon pasta"), drawn large. Both are plain Markdown, so an older app, the web and any AI
/// read them as a picture and a title.
enum NoteCover {
    /// Room between the banner and the title.
    static let gap: CGFloat = 22

    /// The cover among a note's embeds: the first, a picture at Cover size, with only the title before it.
    static func find(_ embeds: [LineEmbed], in ns: NSString) -> LineEmbed? {
        guard let e = embeds.first, case .image(_, let raw) = e.kind, ImageSizes.label(raw).size == .cover,
              e.range.location <= ns.length else { return nil }
        return lines(before: e.range.location, in: ns) == 1 ? e : nil
    }

    /// The cover line in a note's text, if it has one: the line and the picture's file.
    static func find(in text: String) -> (range: NSRange, id: UUID)? {
        let ns = text as NSString
        guard let e = find(LineEmbed.find(in: text).prefix(1).map { $0 }, in: ns), case .image(let id, _) = e.kind else { return nil }
        return (e.range, id)
    }

    /// The text with `line` as its cover: in place of the cover it had, or right after the title.
    /// `moving`: a picture line elsewhere in the note that becomes the cover, taken from its place.
    static func setting(_ line: String, in text: String, moving: NSRange? = nil) -> String {
        var text = text
        if let moving, NSMaxRange(moving) <= (text as NSString).length {
            let ns = text as NSString
            text = ns.replacingCharacters(in: ns.lineRange(for: moving), with: "")
        }
        let ns = text as NSString
        if let old = find(in: text) { return ns.replacingCharacters(in: old.range, with: line) }
        let title = MarkdownStyler.titleLocation(ns)
        guard title < ns.length else { return "New Note\n" + line + "\n" + text }
        let end = NSMaxRange(ns.lineRange(for: NSRange(location: title, length: 0)))
        let lead = end == ns.length && !text.hasSuffix("\n") ? "\n" : ""
        return ns.replacingCharacters(in: NSRange(location: end, length: 0), with: lead + line + "\n")
    }

    /// The text without its cover line.
    static func removing(from text: String) -> String {
        guard let old = find(in: text) else { return text }
        let ns = text as NSString
        return ns.replacingCharacters(in: ns.lineRange(for: old.range), with: "")
    }

    /// The cover line for a picture file.
    static func line(id: UUID, filename: String) -> String {
        FileStore.markdown(id: id, filename: ImageSizes.label(filename.replacingOccurrences(of: "|", with: "-"), size: .cover), image: true)
    }

    /// One edit from `old` to `new`: the part between what they share at each end. The selection
    /// stays on the same text.
    static func edit(from old: String, to new: String, selection: NSRange) -> TextEdit? {
        guard old != new else { return nil }
        let a = old as NSString, b = new as NSString
        var head = 0
        while head < a.length, head < b.length, a.character(at: head) == b.character(at: head) { head += 1 }
        var tail = 0
        while tail < a.length - head, tail < b.length - head, a.character(at: a.length - 1 - tail) == b.character(at: b.length - 1 - tail) { tail += 1 }
        let range = NSRange(location: head, length: a.length - head - tail)
        let replacement = b.substring(with: NSRange(location: head, length: b.length - head - tail))
        let delta = b.length - a.length
        let caret = selection.location >= NSMaxRange(range) ? selection.location + delta : min(selection.location, head)
        return TextEdit(range: range, replacement: replacement, caret: max(0, min(caret, b.length)))
    }

    /// How many non-blank lines come before `location`, counting no further than two.
    private static func lines(before location: Int, in ns: NSString) -> Int {
        var n = 0, i = 0, blank = true
        while i < location, i < ns.length {
            let c = ns.character(at: i)
            if c == 0x0A { if !blank { n += 1; if n > 1 { return n } }; blank = true }
            else if c != 0x20 && c != 0x09 && c != 0x0D { blank = false }
            i += 1
        }
        return blank ? n : n + 1
    }

    /// `icon` and a space in front of the title, the icon selected (to be swapped in the emoji panel).
    static func iconEdit(_ icon: String, in text: String) -> TextEdit {
        let at = MarkdownStyler.titleLocation(text as NSString)
        let length = (icon as NSString).length
        return TextEdit(range: NSRange(location: at, length: 0), replacement: icon + " ", caret: at, selection: NSRange(location: at, length: length))
    }

    /// The length (UTF-16) of the emoji a title starts with, and the space after it: the icon.
    static func iconLength(_ title: String) -> Int? {
        guard let first = title.first, isEmoji(first) else { return nil }
        let rest = title.dropFirst()
        guard rest.first == " " else { return rest.isEmpty ? first.utf16.count : nil }
        return first.utf16.count + 1
    }

    static func isEmoji(_ c: Character) -> Bool {
        guard let s = c.unicodeScalars.first else { return false }
        if s.properties.isEmojiPresentation { return true }
        return s.properties.isEmoji && c.unicodeScalars.count > 1 && s.value > 0xFF
    }
}

/// A single-line embed in a note: a file, an image, a link preview or a note's card.
///
/// Links and files alone on their line show compact, one line with the page's or file's name
/// (Emil, 11-01). As a card they show a picture and a line more, written so other Markdown apps
/// still read a link: a web address in angle brackets (`<https://…>`), a file with `!` before it,
/// a note as `![[Title]]` (Obsidian's embed). A link in a sentence is never either.
struct LineEmbed: Equatable {
    enum Kind: Equatable {
        case file(UUID, name: String)
        case image(UUID, name: String)
        case link(URL)
        /// A note that is an app: its live widget.
        case note(UUID, name: String)
        /// `![[Title]]`: a card for the note the title leads to.
        case wiki(String)
    }
    var kind: Kind
    /// The line, without its newline.
    var range: NSRange
    var index: Int
    /// Shown as a card (picture, title, a line more), not compact.
    var card = false

    private static let fileLine = try! NSRegularExpression(pattern: #"^[ \t]*(!?)\[([^\]]*)\]\(pane-file:([0-9a-fA-F-]{36})\)[ \t]*$"#)
    private static let linkLine = try! NSRegularExpression(pattern: #"^[ \t]*<?(https?://[^\s<>]+)>?[ \t]*$"#)
    private static let noteLine = try! NSRegularExpression(pattern: #"^[ \t]*\[([^\]]*)\]\(pane-note:([0-9a-fA-F-]{36})\)[ \t]*$"#)
    private static let wikiCardLine = try! NSRegularExpression(pattern: #"^[ \t]*!\[\[([^\]\n]+)\]\][ \t]*$"#)
    /// Names shown as pictures. Any other file written with `!` is a file's card.
    static let imageExtensions: Set<String> = ["png", "jpg", "jpeg", "gif", "heic", "heif", "webp", "tif", "tiff", "bmp"]

    static func isImageName(_ name: String) -> Bool {
        let ext = (ImageSizes.label(name).name as NSString).pathExtension.lowercased()
        return ext.isEmpty || imageExtensions.contains(ext)
    }

    static func find(in text: String) -> [LineEmbed] {
        let ns = text as NSString
        var out: [LineEmbed] = []
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byParagraphs, .substringNotRequired]) { _, r, _, _ in
            if let e = match(ns, line: r, index: out.count) { out.append(e) }
        }
        return out
    }

    /// The embed on one line, if it is one. Cheap for ordinary lines: only lines
    /// starting with `!`, `[`, `<` or `h` are tried against the patterns.
    static func match(_ ns: NSString, line r: NSRange, index: Int) -> LineEmbed? {
        var i = r.location
        while i < NSMaxRange(r), ns.character(at: i) == 0x20 || ns.character(at: i) == 0x09 { i += 1 }
        guard i < NSMaxRange(r) else { return nil }
        let first = ns.character(at: i)
        let text = ns as String
        if first == 0x21 || first == 0x5B { // ! [
            if let m = fileLine.firstMatch(in: text, range: r), let id = UUID(uuidString: ns.substring(with: m.range(at: 3))) {
                let name = ns.substring(with: m.range(at: 2))
                let bang = m.range(at: 1).length > 0
                if bang, isImageName(name) { return LineEmbed(kind: .image(id, name: name), range: r, index: index) }
                return LineEmbed(kind: .file(id, name: name), range: r, index: index, card: bang)
            }
            if first == 0x21, let m = wikiCardLine.firstMatch(in: text, range: r) {
                return LineEmbed(kind: .wiki(ns.substring(with: m.range(at: 1))), range: r, index: index, card: true)
            }
            // A link to a note that is an app is its widget; a link to any other note stays a link.
            if let m = noteLine.firstMatch(in: text, range: r), let id = UUID(uuidString: ns.substring(with: m.range(at: 2))), NoteWidgets.isApp(id) {
                return LineEmbed(kind: .note(id, name: ns.substring(with: m.range(at: 1))), range: r, index: index)
            }
        } else if first == 0x68 || first == 0x3C { // h <
            if let m = linkLine.firstMatch(in: text, range: r), let url = URL(string: ns.substring(with: m.range(at: 1))) {
                return LineEmbed(kind: .link(url), range: r, index: index, card: first == 0x3C)
            }
        }
        return nil
    }

    /// A compact link or file: one line.
    static let compactHeight: CGFloat = 34
    /// A card: a picture and up to three lines.
    static let cardHeight: CGFloat = 72

    var height: CGFloat {
        switch kind {
        case .file, .link, .wiki: card ? Self.cardHeight : Self.compactHeight
        case .image: ImageSizes.height(for: self)
        case .note(let id, _): NoteWidgets.height(id) ?? 58
        }
    }

    var key: String {
        let style = card ? "c" : ""
        return switch kind {
        case .file(let id, _): "f\(style)\(id)"
        case .image(let id, _): "f\(id)"
        case .link(let u): "l\(style)\(index)\(u.absoluteString)"
        case .note(let id, _): "n\(id)"
        case .wiki(let t): "w\(index)\(t)"
        }
    }
}
