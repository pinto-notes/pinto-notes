import Foundation
import SwiftData
import Observation
import CoreText
#if os(iOS)
import UIKit
#else
import AppKit
#endif

/// The "Pinto look" note: how the app looks, written as plain `key: value` lines that the person
/// or their AI edits (Emil, 15 November 2026, after T3 Code let its agent restyle the app: "we
/// should just do this too ... the more creative you can get the better"). Pinto follows the note
/// as soon as it's saved: colours for every surface, any font (one on the device, or a font file
/// kept with the note), the text size, a picture behind the page and the Dock icon. A line left
/// empty keeps what Settings says. No new tools or rules for the AI: it's a note like any other,
/// and it syncs like one. Behind Settings › Experimental › Custom look.
struct LookSpec: Equatable, Sendable {
    /// Colours by their name in `Theme.Colors` ("page", "ink"…).
    var colors: [String: Theme.Hex] = [:]
    var font: String?
    var headingFont: String?
    var textSize: CGFloat?
    /// A picture's name ("Dunes.jpg") or its id (from a `pane-file:` link), for the page's ground.
    var background: String?
    /// How much of the page colour lies over the background, 0 to 1.
    var fade: Double?
    /// The background's blur, in points.
    var blur: Double?
    /// A picture's name or id, for the Dock icon.
    var icon: String?
    /// Lines that look like settings Pinto doesn't know, or values it can't read, as written.
    var unread: [String] = []

    var isEmpty: Bool { colors.isEmpty && font == nil && headingFont == nil && textSize == nil && background == nil && icon == nil }

    static let title = "Pinto look"

    /// The words a line can start with, and the colour each sets.
    static let colorKeys: [(word: String, key: String)] = [
        ("page", "page"), ("sidebar", "sidebar"), ("list", "list"), ("selected", "selection"),
        ("text", "ink"), ("secondary text", "muted"), ("lines", "line"), ("fills", "soft"),
        ("cards", "card"), ("code", "code"), ("tables", "panel"), ("accent", "accent"),
    ]

    /// Reads the note's text. Headings, prose, pictures and empty values are passed over.
    static func parse(_ text: String) -> LookSpec {
        var spec = LookSpec()
        let colorWord = Dictionary(uniqueKeysWithValues: colorKeys.map { ($0.word, $0.key) })
        for raw in text.components(separatedBy: .newlines) {
            var line = raw.trimmingCharacters(in: .whitespaces)
            for bullet in ["- ", "* ", "+ "] where line.hasPrefix(bullet) { line.removeFirst(bullet.count) }
            guard !line.hasPrefix("#"), !line.hasPrefix("!["), let colon = line.firstIndex(of: ":") else { continue }
            let key = line[..<colon].lowercased().split(whereSeparator: \.isWhitespace).joined(separator: " ")
                .trimmingCharacters(in: CharacterSet(charactersIn: "*_`"))
            // Prose with a colon in it ("A colour is #RRGGBB, or two: …") isn't a setting.
            guard !key.isEmpty, key.count <= 20, key.split(separator: " ").count <= 3 else { continue }
            let value = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
            guard !value.isEmpty else { continue }
            if let c = colorWord[key] {
                if let hex = Self.color(value) { spec.colors[c] = hex } else { spec.unread.append(line) }
                continue
            }
            switch key {
            case "font", "text font": spec.font = Self.unquoted(value)
            case "heading font", "headings font", "title font": spec.headingFont = Self.unquoted(value)
            case "text size", "size":
                if let n = Self.number(value) { spec.textSize = min(max(n, 9), 48) } else { spec.unread.append(line) }
            case "background", "background picture":
                spec.background = Self.picture(value)
            case "background fade", "fade":
                if let n = Self.number(value) { spec.fade = min(max(n, 0), 100) / 100 } else { spec.unread.append(line) }
            case "background blur", "blur":
                if let n = Self.number(value) { spec.blur = min(max(n, 0), 60) } else { spec.unread.append(line) }
            case "icon", "app icon", "dock icon":
                spec.icon = Self.picture(value)
            default: continue
            }
        }
        if ["none", "off", "default"].contains(spec.background?.lowercased()) { spec.background = nil }
        if ["none", "off", "default"].contains(spec.icon?.lowercased()) { spec.icon = nil }
        return spec
    }

    /// `#RGB`, `#RRGGBB`, or two of them for light and dark ("#FFFFFF / #1C1C1E").
    static func color(_ value: String) -> Theme.Hex? {
        let parts = value.split(separator: "/").map { $0.trimmingCharacters(in: .whitespaces) }
        let read = parts.compactMap(Self.hex)
        guard read.count == parts.count else { return nil }
        switch read.count {
        case 1: return Theme.Hex(read[0], read[0])
        case 2: return Theme.Hex(read[0], read[1])
        default: return nil
        }
    }

    private static func hex(_ s: String) -> UInt32? {
        var h = s.split(whereSeparator: \.isWhitespace).first.map(String.init) ?? ""
        guard h.hasPrefix("#") else { return nil }
        h.removeFirst()
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        guard h.count == 6 else { return nil }
        return UInt32(h, radix: 16)
    }

    private static func number(_ s: String) -> Double? {
        Double(s.lowercased().replacingOccurrences(of: "pt", with: "").replacingOccurrences(of: "px", with: "")
            .replacingOccurrences(of: "%", with: "").trimmingCharacters(in: .whitespaces))
    }

    private static func unquoted(_ s: String) -> String {
        s.trimmingCharacters(in: CharacterSet(charactersIn: "\"'\u{201C}\u{201D}`").union(.whitespaces))
    }

    /// A picture's name, or its id when it's written as a link (`![Dunes.jpg](pane-file:…)`).
    private static func picture(_ s: String) -> String {
        if let r = s.range(of: #"pane-file:[0-9a-fA-F-]{36}"#, options: .regularExpression) {
            return String(s[r].dropFirst("pane-file:".count))
        }
        return unquoted(s)
    }

    /// What a new Pinto look note says: every setting, empty, with a line on how each is written.
    static let template = """
    Pinto look

    Ask your AI to change how Pinto looks, or edit this note yourself. Pinto follows each line as soon as the note is saved. A line left empty keeps what Settings says. Delete the note to go back to it all.

    ## Colours
    A colour is #RRGGBB, or two for light and dark mode, like #FFFFFF / #1C1C1E.

    page:
    sidebar:
    list:
    selected:
    text:
    secondary text:
    lines:
    fills:
    cards:
    code:
    tables:
    accent:

    ## Type
    A font is any font on this device, like New York or Avenir Next, or serif, rounded or mono, or a font file kept with this note, like Grotesk.otf. Text size is in points, on the Mac.

    font:
    heading font:
    text size:

    ## Pictures
    A picture is one in this note or kept with it, by its name, like Dunes.jpg. Fade is how much of the page colour lies over the background, from 0 to 100. Blur is from 0 to 60. The icon is the Mac's Dock icon.

    background:
    background fade:
    background blur:
    icon:
    """
}

/// Applies the Pinto look note while Custom look is on: reads it again after each save that could
/// have touched it, and sets the colours, faces, text size, page picture and Dock icon from it.
@MainActor @Observable
final class LookStore {
    static let shared = LookStore()

    /// The picture behind the note page, and how it's drawn.
    private(set) var background: PImage?
    private(set) var fade: Double = 0.8
    private(set) var blur: Double = 0
    /// What the note says now, for Settings and tests.
    private(set) var spec = LookSpec()

    @ObservationIgnored private weak var context: ModelContext?
    @ObservationIgnored private var observers: [NSObjectProtocol] = []
    @ObservationIgnored private var lastBody: String?
    @ObservationIgnored private var lastFiles: [String: Int] = [:]
    @ObservationIgnored private var pending = false
    @ObservationIgnored private var registered: Set<URL> = []
    @ObservationIgnored private var backgroundKey: String?
    @ObservationIgnored private var iconKey: String?

    static var isOn: Bool { Experiments.isOn(.look) }

    func start(_ context: ModelContext) {
        guard self.context !== context else { return }
        self.context = context
        observers.forEach(NotificationCenter.default.removeObserver)
        // Any context's save: sync pulls an AI's edit in its own.
        observers = [
            NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.refreshSoon() }
            },
            NotificationCenter.default.addObserver(forName: Experiments.didChange, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    if Self.isOn { self.makeNoteIfNone() }
                    self.lastBody = nil
                    self.refresh()
                }
            },
        ]
        refresh()
    }

    /// Several saves in a turn read the note once.
    private func refreshSoon() {
        guard !pending else { return }
        pending = true
        DispatchQueue.main.async { [weak self] in
            self?.pending = false
            self?.refresh()
        }
    }

    /// The live Pinto look note: the newest, when there are several.
    static func note(in context: ModelContext) -> Note? {
        let title = LookSpec.title
        let notes = (try? context.fetch(FetchDescriptor<Note>(predicate: #Predicate { $0.summaryTitle == title }))) ?? []
        return notes.filter { $0.trashedAt == nil && $0.deletedAt == nil && !$0.isLocked }.max { $0.updatedAt < $1.updatedAt }
    }

    /// Turning Custom look on makes the note, when the library has none, at the top of the notes.
    private func makeNoteIfNone() {
        guard let context, Self.note(in: context) == nil else { return }
        let n = context.createNote(in: .all, body: LookSpec.template)
        n.isPinned = true
    }

    func refresh() {
        guard let context else { return }
        guard Self.isOn, let note = Self.note(in: context) else {
            // Nothing to undo: most saves, with the switch off.
            if lastBody != nil || !spec.isEmpty || background != nil { apply(LookSpec(), note: nil) }
            return
        }
        let files = Self.files(of: note, in: context)
        let stamp = Dictionary(uniqueKeysWithValues: files.map { ($0.id.uuidString, $0.contentVersion + (FileStore.exists($0) ? 1_000_000 : 0)) })
        guard note.body != lastBody || stamp != lastFiles else { return }
        lastBody = note.body
        lastFiles = stamp
        apply(LookSpec.parse(note.body), note: note, files: files)
    }

    /// The files kept with the note: the ones it shows, and the ones in the folder with its name
    /// beside it (where the AI's tools put "Pinto look/Dunes.jpg").
    static func files(of note: Note, in context: ModelContext) -> [Attachment] {
        var ids = Self.linked(in: note.body)
        let parent = note.folder?.id
        let folders = ((try? context.fetch(FetchDescriptor<Folder>())) ?? []).filter {
            $0.deletedAt == nil && $0.parent?.id == parent && $0.name.caseInsensitiveCompare(LookSpec.title) == .orderedSame
        }
        for f in folders {
            let fid = f.id
            ids += ((try? context.fetch(FetchDescriptor<Attachment>(predicate: #Predicate { $0.folderID == fid }))) ?? []).map(\.id)
        }
        return ids.compactMap { context.attachment($0) }.filter { $0.deletedAt == nil && $0.trashedAt == nil }
    }

    /// Every file the text links to (`pane-file:<id>`), in order.
    static func linked(in text: String) -> [UUID] {
        let ns = text as NSString
        return linkPattern.matches(in: text, range: NSRange(location: 0, length: ns.length)).compactMap { UUID(uuidString: ns.substring(with: $0.range(at: 1))) }
    }
    private static let linkPattern = try! NSRegularExpression(pattern: #"pane-file:([0-9a-fA-F-]{36})"#)

    /// The file a value names: by id, or by name (case aside, with or without its extension).
    static func file(_ name: String?, in files: [Attachment]) -> Attachment? {
        guard let name else { return nil }
        if let id = UUID(uuidString: name), let f = files.first(where: { $0.id == id }) { return f }
        let lower = name.lowercased()
        return files.first { $0.filename.lowercased() == lower }
            ?? files.first { ($0.filename as NSString).deletingPathExtension.lowercased() == lower }
    }

    private func apply(_ spec: LookSpec, note: Note?, files: [Attachment] = []) {
        if note == nil { lastBody = nil; lastFiles = [:] }
        self.spec = spec

        // Colours.
        var look = ThemeStore.shared.current
        look.custom = spec.colors.isEmpty ? nil : LookColors(values: spec.colors)
        ThemeStore.shared.set(look, persist: false)

        // Faces: a font file kept with the note is registered for this run of the app first.
        func face(_ name: String?) -> LookFace? {
            guard let name else { return nil }
            if let f = Self.file(name, in: files), let family = register(f) { return LookFace(kind: .family(family)) }
            return LookFace.named(name)
        }
        if LookFaces.set(body: face(spec.font), heading: face(spec.headingFont)) {
            NotificationCenter.default.post(name: NoteFont.didChange, object: nil)
        }

        #if os(macOS)
        if TextSize.lookOverride != spec.textSize {
            TextSize.lookOverride = spec.textSize
            NotificationCenter.default.post(name: TextSize.didChange, object: nil)
        }
        #endif

        // Pictures, read again only when the one named or its bytes changed.
        let picture = Self.file(spec.background, in: files)
        let pictureKey = picture.map { "\($0.id)/\($0.contentVersion)/\(FileStore.exists($0))" }
        if pictureKey != backgroundKey {
            backgroundKey = pictureKey
            background = picture.flatMap(Self.image)
        }
        if fade != spec.fade ?? 0.8 { fade = spec.fade ?? 0.8 }
        if blur != spec.blur ?? 0 { blur = spec.blur ?? 0 }
        #if os(macOS)
        let icon = Self.file(spec.icon, in: files)
        let iconKey = icon.map { "\($0.id)/\($0.contentVersion)/\(FileStore.exists($0))" }
        if iconKey != self.iconKey, !PaneApp.isUnitTestHost {
            self.iconKey = iconKey
            // Nil puts the app's own icon back.
            NSApp.applicationIconImage = icon.flatMap(Self.image)
        }
        #endif
    }

    /// Pictures of a look (LookShots): its page picture without a note's file, which the test
    /// host would read from the app's own files.
    func show(background: PImage?, fade: Double, blur: Double) {
        self.background = background
        self.fade = fade
        self.blur = blur
    }

    /// A font file's family, registered with the system for this process.
    private func register(_ a: Attachment) -> String? {
        let ext = (a.filename as NSString).pathExtension.lowercased()
        guard ["otf", "ttf", "ttc", "woff", "woff2"].contains(ext) else { return nil }
        let url = FileStore.url(for: a.id, filename: a.filename)
        guard FileManager.default.fileExists(atPath: url.path),
              let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
              let family = descriptors.first.flatMap({ CTFontDescriptorCopyAttribute($0, kCTFontFamilyNameAttribute) as? String })
        else { return nil }
        if !registered.contains(url) {
            CTFontManagerRegisterFontURLs([url] as CFArray, .process, false, nil)
            registered.insert(url)
        }
        return family
    }

    private static func image(_ a: Attachment) -> PImage? {
        guard a.isImage else { return nil }
        let url = FileStore.url(for: a.id, filename: a.filename)
        #if os(iOS)
        return UIImage(contentsOfFile: url.path)
        #else
        return NSImage(contentsOf: url)
        #endif
    }
}
