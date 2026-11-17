import SwiftUI

/// The emojis a note's icon is picked from, by kind, food first: recipes are the first use (Emil,
/// 13 November 2026). Read from Unicode's own emoji blocks, so names come with them for search.
enum IconEmoji {
    struct Group: Identifiable {
        let title: String
        let symbol: String
        let emojis: [String]
        var id: String { title }
    }

    static let groups: [Group] = [
        Group(title: "Food and drink", symbol: "fork.knife", emojis: scalars(0x1F345...0x1F37F, 0x1F950...0x1F96F, 0x1F9C0...0x1F9CB, 0x1FAD0...0x1FADB)),
        Group(title: "Plants and animals", symbol: "leaf", emojis: scalars(0x1F330...0x1F344, 0x1F490...0x1F490, 0x1FAB4...0x1FABB, 0x1F400...0x1F43F, 0x1F980...0x1F9AE)),
        Group(title: "Things", symbol: "lightbulb", emojis: scalars(0x1F4A1...0x1F4FF, 0x1F50A...0x1F53D, 0x1F380...0x1F393, 0x1F3A0...0x1F3CA, 0x1F6CB...0x1F6D7, 0x1F9F0...0x1F9FF)),
        Group(title: "Travel and places", symbol: "airplane", emojis: scalars(0x1F680...0x1F6C5, 0x1F3D4...0x1F3F0, 0x1F30D...0x1F320)),
        Group(title: "Faces", symbol: "face.smiling", emojis: scalars(0x1F600...0x1F64F, 0x1F970...0x1F97A, 0x1F910...0x1F92F)),
        Group(title: "Symbols", symbol: "heart", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "✨", "⭐️", "🔥", "✅", "❗️", "❓", "💡", "📌"] + scalars(0x1F493...0x1F49F)),
    ]

    /// Every emoji with its name in lower case, for search ("curry and rice"): the kinds' first, in
    /// their order, then every other emoji, so a search finds one the kinds leave out (🛒 for "cart").
    static let named: [(emoji: String, name: String)] = (groups.flatMap(\.emojis) + scalars(0x1F300...0x1FAFF)).map { e in
        (e, ((e.unicodeScalars.first.flatMap { $0.properties.name } ?? "") + " " + (aliases[e] ?? "")).lowercased())
    }

    /// Everyday words Unicode's names miss (🛒 is a "shopping trolley").
    static let aliases: [String: String] = [
        "🛒": "cart groceries", "📝": "note", "✅": "done todo", "📅": "date", "🗓️": "calendar", "💼": "work job",
        "🏋️": "gym workout", "💪": "strong gym", "🧺": "groceries", "💰": "money", "💸": "money spend", "🏠": "home",
        "✈️": "travel flight", "🎁": "present", "📚": "reading", "🍽️": "dinner meal", "☕️": "coffee", "🍰": "dessert",
    ]

    /// The emojis whose name holds every word typed, in the order they're listed.
    static func search(_ query: String) -> [String] {
        let words = query.lowercased().split(whereSeparator: \.isWhitespace).map(String.init)
        guard !words.isEmpty else { return [] }
        var seen = Set<String>()
        return named.filter { item in words.allSatisfy { item.name.contains($0) } && seen.insert(item.emoji).inserted }.map(\.emoji)
    }

    /// The emojis of those ranges that draw as emoji on their own.
    private static func scalars(_ ranges: ClosedRange<UInt32>...) -> [String] {
        ranges.flatMap { $0 }.compactMap { Unicode.Scalar($0) }.filter { $0.properties.isEmojiPresentation }.map { String($0) }
    }
}

/// A note's icon picker, by the icon or the title: search, the kinds, and Remove when there's one.
/// It closes once one is picked (Apple's emoji panel stayed open, and typing went into the title).
struct IconPicker: View {
    let current: String?
    let pick: (String?) -> Void
    @State private var query = ""
    @State private var group = IconEmoji.groups[0].id
    @FocusState private var searching: Bool

    static let size = CGSize(width: 340, height: 380)

    var body: some View {
        let found = IconEmoji.search(query)
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                TextField("Search", text: $query)
                    .textFieldStyle(.roundedBorder)
                    .focused($searching)
                    .onSubmit { if let first = found.first { pick(first) } }
                    .accessibilityIdentifier("icon.search")
                if current != nil {
                    Button("Remove") { pick(nil) }
                        .accessibilityIdentifier("icon.remove")
                }
            }
            if query.isEmpty {
                Picker("Kind", selection: $group) {
                    ForEach(IconEmoji.groups) { g in Image(systemName: g.symbol).help(g.title).tag(g.id) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityIdentifier("icon.kind")
            }
            ScrollView {
                let emojis = query.isEmpty ? (IconEmoji.groups.first { $0.id == group }?.emojis ?? []) : found
                if emojis.isEmpty {
                    Text("No emoji for \u{201C}\(query)\u{201D}")
                        .foregroundStyle(Color.muted)
                        .padding(.top, 30)
                } else {
                    LazyVGrid(columns: Array(repeating: GridItem(.fixed(34), spacing: 4), count: 8), spacing: 4) {
                        ForEach(emojis, id: \.self) { e in
                            Button { pick(e) } label: { Text(e).font(.system(size: 24)).frame(width: 34, height: 34) }
                                .buttonStyle(IconCellStyle())
                                .accessibilityLabel(e.unicodeScalars.first?.properties.name?.capitalized ?? e)
                                .accessibilityIdentifier("icon.\(e)")
                        }
                    }
                }
            }
        }
        .padding(12)
        .frame(width: Self.size.width, height: Self.size.height)
        .onAppear { searching = true }
    }
}
