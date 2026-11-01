import Foundation

/// The ways a link alone on its line can be written, and turning one into another (Emil, 11-01):
/// a link (`[Title](https://…)`, `[[Note]]`), compact (a bare address) or a card (`<https://…>`,
/// `![[Note]]`, `![name.pdf](pane-file:…)`).
enum LinkForms {
    enum Style: Equatable { case link, compact, card }

    /// What a line is now, and what it leads to.
    struct Line: Equatable {
        enum Target: Equatable {
            case web(URL, title: String?)
            case note(String)
            case file(UUID, name: String)
        }
        var target: Target
        var style: Style
        /// Spaces before it, kept when it's rewritten.
        var indent: String
    }

    private static let web = try! NSRegularExpression(pattern: #"^([ \t]*)(?:<(https?://[^\s<>]+)>|(https?://[^\s<>]+)|\[([^\]\n]*)\]\((https?://[^\s)]+)\))[ \t]*$"#)
    private static let wiki = try! NSRegularExpression(pattern: #"^([ \t]*)(!?)\[\[([^\]\n]+)\]\][ \t]*$"#)
    private static let file = try! NSRegularExpression(pattern: #"^([ \t]*)(!?)\[([^\]]*)\]\(pane-file:([0-9a-fA-F-]{36})\)[ \t]*$"#)

    static func parse(_ line: String) -> Line? {
        let ns = line as NSString
        let all = NSRange(location: 0, length: ns.length)
        func group(_ m: NSTextCheckingResult, _ i: Int) -> String? {
            m.range(at: i).location == NSNotFound ? nil : ns.substring(with: m.range(at: i))
        }
        if let m = web.firstMatch(in: line, range: all) {
            let indent = group(m, 1) ?? ""
            if let s = group(m, 2), let u = URL(string: s) { return Line(target: .web(u, title: nil), style: .card, indent: indent) }
            if let s = group(m, 3), let u = URL(string: s) { return Line(target: .web(u, title: nil), style: .compact, indent: indent) }
            if let s = group(m, 5), let u = URL(string: s) {
                let t = group(m, 4).flatMap { $0.isEmpty ? nil : $0 }
                return Line(target: .web(u, title: t), style: .link, indent: indent)
            }
        }
        if let m = wiki.firstMatch(in: line, range: all), let title = group(m, 3) {
            return Line(target: .note(title), style: group(m, 2) == "!" ? .card : .link, indent: group(m, 1) ?? "")
        }
        if let m = file.firstMatch(in: line, range: all), let name = group(m, 3),
           let id = group(m, 4).flatMap(UUID.init(uuidString:)), !(group(m, 2) == "!" && LineEmbed.isImageName(name)) {
            return Line(target: .file(id, name: name), style: group(m, 2) == "!" ? .card : .compact, indent: group(m, 1) ?? "")
        }
        return nil
    }

    /// The styles a line can be turned into (other than its own).
    static func choices(for line: Line) -> [Style] {
        let all: [Style] = switch line.target {
        case .web: [.link, .compact, .card]
        case .note: [.link, .card]
        case .file: [.compact, .card]
        }
        return all.filter { $0 != line.style }
    }

    /// The line written in `style`. `title` names a web page written as a link.
    static func write(_ line: Line, as style: Style, title: String? = nil) -> String {
        let body: String = switch line.target {
        case .web(let url, let known):
            switch style {
            case .link: "[\(escape(title ?? known ?? url.host() ?? url.absoluteString))](\(url.absoluteString))"
            case .compact: url.absoluteString
            case .card: "<\(url.absoluteString)>"
            }
        case .note(let t):
            style == .card ? "![[\(t)]]" : "[[\(t)]]"
        case .file(let id, let name):
            "\(style == .card ? "!" : "")[\(name)](pane-file:\(id.uuidString.lowercased()))"
        }
        return line.indent + body
    }

    private static func escape(_ s: String) -> String {
        s.replacingOccurrences(of: "[", with: "(").replacingOccurrences(of: "]", with: ")")
    }

    /// Menu titles, sentence case like the rest of the app's menus.
    static func title(_ style: Style) -> String {
        switch style {
        case .link: "Show as Link"
        case .compact: "Show Compact"
        case .card: "Show as Card"
        }
    }
}
