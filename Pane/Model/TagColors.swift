import Foundation
import Observation
import Supabase
import SwiftUI

/// A tag's colour, as Finder's tags have them. Each tag starts with one picked from its name, so
/// it's the same on every device before anyone chooses; choosing one (the sidebar's right-click)
/// keeps it for the account.
enum TagColor: String, CaseIterable, Codable, Identifiable {
    case red, orange, yellow, green, blue, purple, pink, gray

    var id: String { rawValue }

    var title: String {
        switch self {
        case .red: "Red"
        case .orange: "Orange"
        case .yellow: "Yellow"
        case .green: "Green"
        case .blue: "Blue"
        case .purple: "Purple"
        case .pink: "Pink"
        case .gray: "Grey"
        }
    }

    /// The colour a tag has until one is chosen: one of the bright ones, from its name (FNV-1a,
    /// not `hashValue`, which changes with each launch).
    static func standard(for tag: String) -> TagColor {
        // A nested tag takes its outermost tag's colour: #work/clients is #work's.
        let root = tag.split(separator: "/").first.map(String.init) ?? tag
        var h: UInt64 = 0xcbf2_9ce4_8422_2325
        for b in root.lowercased().utf8 { h = (h ^ UInt64(b)) &* 0x100_0000_01b3 }
        let bright = allCases.filter { $0 != .gray }
        return bright[Int(h % UInt64(bright.count))]
    }

    /// The system colour: the sidebar's dot.
    var dot: PColor { Self.dots[self]! }
    private static let dots = Dictionary(uniqueKeysWithValues: allCases.map { ($0, $0.makeDot) })
    private var makeDot: PColor {
        switch self {
        case .red: Palette.pair(0xFF3B30, 0xFF453A)
        case .orange: Palette.pair(0xFF9500, 0xFF9F0A)
        case .yellow: Palette.pair(0xFFCC00, 0xFFD60A)
        case .green: Palette.pair(0x34C759, 0x30D158)
        case .blue: Palette.pair(0x007AFF, 0x0A84FF)
        case .purple: Palette.pair(0xAF52DE, 0xBF5AF2)
        case .pink: Palette.pair(0xFF2D55, 0xFF375F)
        case .gray: Palette.pair(0x8E8E93, 0x98989D)
        }
    }

    /// The label's fill in a note: a soft tint of the colour, solid so it reads the same over a
    /// highlight or a changed line.
    var fill: PColor { Self.fills[self]! }
    private static let fills = Dictionary(uniqueKeysWithValues: allCases.map { ($0, $0.makeFill) })
    private var makeFill: PColor {
        switch self {
        case .red: Palette.pair(0xFFE3E1, 0x3D1715)
        case .orange: Palette.pair(0xFFEBD6, 0x3D2610)
        case .yellow: Palette.pair(0xFFF2BF, 0x3A3110)
        case .green: Palette.pair(0xDDF5E3, 0x15331D)
        case .blue: Palette.pair(0xDCEBFF, 0x102A4A)
        case .purple: Palette.pair(0xF1E2FA, 0x2E1A3D)
        case .pink: Palette.pair(0xFFE0E8, 0x3D1522)
        case .gray: Palette.pair(0xECECEE, 0x2C2C2E)
        }
    }

    /// The label's text: dark enough on its fill to read (4.5:1 and more), light in the dark.
    var ink: PColor { Self.inks[self]! }
    private static let inks = Dictionary(uniqueKeysWithValues: allCases.map { ($0, $0.makeInk) })
    private var makeInk: PColor {
        switch self {
        case .red: Palette.pair(0xA8231C, 0xFF8A80)
        case .orange: Palette.pair(0x9A4700, 0xFFB866)
        case .yellow: Palette.pair(0x735600, 0xFFE066)
        case .green: Palette.pair(0x1C7233, 0x6EE08C)
        case .blue: Palette.pair(0x0A56BA, 0x7AB8FF)
        case .purple: Palette.pair(0x762DA1, 0xD59CF5)
        case .pink: Palette.pair(0xA81E46, 0xFF8FA8)
        case .gray: Palette.pair(0x505055, 0xC7C7CC)
        }
    }
}

/// The colours chosen for tags on this account. Shown at once from this device's copy, then the
/// server's. On the server they're one box in the account's profile (`profiles.tag_colors_ct`),
/// sealed with the account's key like the notes, so the tags' names never go there readable.
/// A choice made offline waits here and goes when the server can be reached; one made on another
/// device meanwhile is kept for every other tag.
@MainActor @Observable
final class TagColors {
    static let shared = TagColors()
    /// Posted when a colour changes: open notes draw their labels again.
    static let didChange = Notification.Name("pane.tagColors.didChange")

    /// Chosen colours, by the tag's name in lower case.
    private(set) var chosen: [String: TagColor] = [:] {
        didSet { Self.snapshot = chosen }
    }
    /// The same, for the editor's styling, which reads it off the main actor's checks.
    nonisolated(unsafe) private static var snapshot: [String: TagColor] = [:]

    /// The colour `tag` shows in, for the editor.
    nonisolated static func current(for tag: String) -> TagColor {
        lookup(tag, in: snapshot)
    }

    /// A chosen colour for the tag, else for the tag it's nested under, else its own.
    nonisolated static func lookup(_ tag: String, in map: [String: TagColor]) -> TagColor {
        var parts = tag.lowercased().split(separator: "/").map(String.init)
        while !parts.isEmpty {
            if let c = map[parts.joined(separator: "/")] { return c }
            parts.removeLast()
        }
        return .standard(for: tag)
    }

    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private var user: UUID?
    @ObservationIgnored private var client: SupabaseClient?
    /// Choices not yet on the server: a colour, or "" for back to the tag's own.
    @ObservationIgnored private var pending: [String: String] = [:]

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    /// The colour `tag` shows in.
    func color(for tag: String) -> TagColor {
        Self.lookup(tag, in: chosen)
    }

    /// Whether `tag` has a colour someone chose, not the one from its name.
    func isChosen(_ tag: String) -> Bool { chosen[tag.lowercased()] != nil }

    /// Gives `tag` a colour; nil goes back to the one from its name.
    func set(_ color: TagColor?, for tag: String) {
        let key = tag.lowercased()
        guard chosen[key] != color else { return }
        chosen[key] = color
        pending[key] = color?.rawValue ?? ""
        storeLocally()
        NotificationCenter.default.post(name: Self.didChange, object: nil)
        Task { await flush() }
    }

    // MARK: Account

    /// Shows the signed-in account's colours: this device's copy at once, then the server's.
    func bind(_ backend: Backend) async {
        guard case .signedIn = backend.state, let id = backend.userID, let client = backend.client else { return }
        if user != id {
            user = id
            chosen = Self.decode(defaults.string(forKey: key("chosen")))
            pending = (defaults.dictionary(forKey: key("pending")) as? [String: String]) ?? [:]
            NotificationCenter.default.post(name: Self.didChange, object: nil)
        }
        self.client = client
        await flush()
    }

    /// The account's colours as stored: chosen ones, as JSON, by lower-case name.
    nonisolated static func encode(_ map: [String: TagColor]) -> String {
        let plain = map.mapValues(\.rawValue)
        guard let data = try? JSONSerialization.data(withJSONObject: plain, options: [.sortedKeys]) else { return "{}" }
        return String(decoding: data, as: UTF8.self)
    }

    nonisolated static func decode(_ json: String?) -> [String: TagColor] {
        guard let json, let raw = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: String] else { return [:] }
        return raw.compactMapValues(TagColor.init(rawValue:))
    }

    /// The server's colours with this device's waiting choices over them.
    nonisolated static func merge(server: [String: TagColor], pending: [String: String]) -> [String: TagColor] {
        var out = server
        for (k, v) in pending {
            if let c = TagColor(rawValue: v) { out[k] = c } else { out[k] = nil }
        }
        return out
    }

    /// The box's context: what it is and whose, so it can't be passed off as a note's.
    nonisolated static func sealContext(_ user: UUID) -> String { "tagcolors:" + user.uuidString.lowercased() }

    private struct Row: Codable {
        var user_id: UUID?
        var tag_colors_ct: String?
    }

    /// Reads the server's colours, lays this device's waiting choices over them and, when there
    /// were any, writes the result back.
    private func flush() async {
        guard let client, let user, let sealer = E2EE.sealer, !sealer.isRetired else { return }
        let context = Self.sealContext(user)
        do {
            let rows: [Row] = try await client.from("profiles").select("tag_colors_ct").eq("user_id", value: user).execute().value
            guard self.user == user else { return }
            let server = rows.first?.tag_colors_ct.flatMap { sealer.open($0, context: context) }.map { Self.decode($0) } ?? [:]
            let sent = pending
            let merged = Self.merge(server: server, pending: sent)
            if !sent.isEmpty {
                guard let box = sealer.seal(Self.encode(merged), context: context) else { return }
                try await client.from("profiles").upsert(Row(user_id: user, tag_colors_ct: box), onConflict: "user_id").execute()
                guard self.user == user else { return }
                // Choices made while this was on its way go next time.
                for (k, v) in sent where pending[k] == v { pending[k] = nil }
            }
            let shown = Self.merge(server: merged, pending: pending)
            if shown != chosen {
                chosen = shown
                NotificationCenter.default.post(name: Self.didChange, object: nil)
            }
            storeLocally()
        } catch {
            // Offline or refused: the choices wait here (`pending`) for the next try.
        }
    }

    private func key(_ name: String) -> String { "tagColors.\(user?.uuidString.lowercased() ?? "none").\(name)" }

    private func storeLocally() {
        defaults.set(Self.encode(chosen), forKey: key("chosen"))
        defaults.set(pending, forKey: key("pending"))
    }
}

extension Color {
    init(tagColor: TagColor) { self.init(tagColor.dot) }
}

extension Tags {
    /// Whether the note's text has exactly `tag` (in any case), not only one nested under it.
    static func hasExactly(_ tag: String, in text: String) -> Bool {
        find(in: text).contains { $0.name.lowercased() == tag.lowercased() }
    }

    /// A name typed for a new tag, as it's written after the `#`: spaces become dashes ("Needs
    /// review" is `#Needs-review`), a leading `#` and characters a tag can't hold go. Nil when
    /// nothing usable is left (a tag needs a letter or `_`).
    static func typedName(_ typed: String) -> String? {
        var s = typed.trimmingCharacters(in: .whitespacesAndNewlines)
        while s.hasPrefix("#") { s.removeFirst() }
        let dashed = s.split(whereSeparator: \.isWhitespace).joined(separator: "-")
        let kept = dashed.unicodeScalars.filter { c in
            CharacterSet.letters.contains(c) || CharacterSet.decimalDigits.contains(c) || CharacterSet.nonBaseCharacters.contains(c) || c == "_" || c == "-" || c == "/"
        }
        var name = String(String.UnicodeScalarView(kept))
        while name.hasSuffix("/") || name.hasSuffix("-") { name.removeLast() }
        while name.hasPrefix("/") || name.hasPrefix("-") { name.removeFirst() }
        guard name.contains(where: { $0.isLetter || $0 == "_" }) else { return nil }
        return name
    }

    /// The note's text with `tag` added, as the tags picked from a note's menu are: on the line of
    /// tags under the title, made when there isn't one yet. Unchanged when it has the tag already.
    static func adding(_ tag: String, to text: String) -> String {
        guard !hasExactly(tag, in: text) else { return text }
        let ns = text as NSString
        let written = "#" + tag
        // An empty note: the tag is all there is.
        guard let title = titleLine(ns) else { return text + written }
        let afterTitle = NSMaxRange(title)
        if afterTitle < ns.length {
            let next = ns.lineRange(for: NSRange(location: afterTitle, length: 0))
            let content = contentRange(of: next, in: ns)
            if content.length > 0, isTagsOnly(ns.substring(with: content)) {
                return ns.replacingCharacters(in: NSRange(location: NSMaxRange(content), length: 0), with: " " + written)
            }
            return ns.replacingCharacters(in: NSRange(location: afterTitle, length: 0), with: written + "\n")
        }
        // The title is the last line.
        let ends = text.hasSuffix("\n") || text.hasSuffix("\r")
        return text + (ends ? "" : "\n") + written
    }

    /// The note's text without `tag` (exactly that one, in any case; tags nested under it stay),
    /// wherever it's written. A line left with nothing on it goes too.
    static func removing(_ tag: String, from text: String) -> String {
        let found = find(in: text).filter { $0.name.lowercased() == tag.lowercased() }
        guard !found.isEmpty else { return text }
        let ns = text as NSString
        var lines: [NSRange] = []
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, _, enclosing, _ in
            lines.append(enclosing)
        }
        var out = ""
        for line in lines {
            let hits = found.filter { NSLocationInRange($0.range.location, line) }
            guard !hits.isEmpty else { out += ns.substring(with: line); continue }
            var s = ns.substring(with: line) as NSString
            for hit in hits.reversed() {
                var r = NSRange(location: hit.range.location - line.location, length: hit.range.length)
                // One space beside it goes with it, so words don't end up two spaces apart.
                if r.location > 0, s.character(at: r.location - 1) == 0x20 {
                    r = NSRange(location: r.location - 1, length: r.length + 1)
                } else if NSMaxRange(r) < s.length, s.character(at: NSMaxRange(r)) == 0x20 {
                    r.length += 1
                }
                s = s.replacingCharacters(in: r, with: "") as NSString
            }
            // A line that had only tags on it goes, with its line break.
            if (s as String).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { continue }
            out += s as String
        }
        if !text.hasSuffix("\n"), out.hasSuffix("\n") { out.removeLast() }
        return out
    }

    /// The note's first line with anything on it: its title.
    private static func titleLine(_ ns: NSString) -> NSRange? {
        var found: NSRange?
        ns.enumerateSubstrings(in: NSRange(location: 0, length: ns.length), options: [.byLines, .substringNotRequired]) { _, line, enclosing, stop in
            if !ns.substring(with: line).trimmingCharacters(in: .whitespaces).isEmpty { found = enclosing; stop.pointee = true }
        }
        return found
    }

    /// A line without its line break.
    private static func contentRange(of line: NSRange, in ns: NSString) -> NSRange {
        var end = NSMaxRange(line)
        while end > line.location, let c = Unicode.Scalar(ns.character(at: end - 1)), CharacterSet.newlines.contains(c) { end -= 1 }
        return NSRange(location: line.location, length: end - line.location)
    }

    /// Whether a line holds tags and nothing else.
    static func isTagsOnly(_ line: String) -> Bool {
        let words = line.split(whereSeparator: \.isWhitespace)
        guard !words.isEmpty else { return false }
        return words.allSatisfy { w in
            let s = String(w)
            return find(in: s, blocks: false).first.map { $0.range == NSRange(location: 0, length: (s as NSString).length) } == true
        }
    }
}
