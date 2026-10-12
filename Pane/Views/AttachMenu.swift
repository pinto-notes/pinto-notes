import PhotosUI
import SwiftData
import SwiftUI

extension WikiLinks {
    /// A link to the note titled `title` put where the selection is: the same `[[Title]]` link
    /// that typing `[[` makes. Selected words become what the link shows (`[[Title|words]]`).
    static func insertion(of title: String, in text: String, selection: NSRange) -> TextEdit {
        let ns = text as NSString
        let at = NSRange(location: min(selection.location, ns.length), length: min(selection.length, ns.length - min(selection.location, ns.length)))
        let words = ns.substring(with: at).trimmingCharacters(in: .whitespaces)
        let alias = words.isEmpty || words.contains("\n") || words.contains("]") || words.contains("|") || key(words) == key(title) ? nil : words
        let link = markdown(target: title, alias: alias)
        return TextEdit(range: at, replacement: link, caret: at.location + (link as NSString).length)
    }
}

extension EditorController {
    /// Puts a link to the note titled `title` at the caret (Attach › Link to a Note…).
    func insertWikiLink(_ title: String) {
        perform { WikiLinks.insertion(of: title, in: $0, selection: $1) }
    }
}

/// "Link to a Note…": the titles that typing `[[` offers, with a field to narrow them. A click or
/// Return puts the link at the caret; Esc closes.
struct NoteLinkPicker: View {
    /// The titles for what's typed, best first (the note screen passes the same source the editor uses).
    let titles: (String) -> [String]
    let pick: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var highlighted = 0
    @FocusState private var searching: Bool

    static let width: CGFloat = 280
    static let row: CGFloat = 28
    static let limit = 8

    /// The row Return takes: the highlighted one while it exists, else the first.
    static func choice(in titles: [String], highlighted: Int) -> String? {
        titles.indices.contains(highlighted) ? titles[highlighted] : titles.first
    }

    var body: some View {
        let shown = titles(query)
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Link to a note", text: $query)
                    .textFieldStyle(.plain)
                    .focused($searching)
                    .onSubmit { if let t = Self.choice(in: titles(query), highlighted: highlighted) { take(t) } }
                    #if os(macOS)
                    .onKeyPress(.downArrow) { highlighted = min(highlighted + 1, max(titles(query).count - 1, 0)); return .handled }
                    .onKeyPress(.upArrow) { highlighted = max(highlighted - 1, 0); return .handled }
                    #endif
                    .accessibilityIdentifier("noteLink.search")
            }
            .padding(.horizontal, 12)
            .frame(height: 40)
            Divider()
            if shown.isEmpty {
                Text(query.isEmpty ? "No other notes yet" : "No note with that title")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(shown.enumerated()), id: \.offset) { i, title in
                        Button { take(title) } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "note.text").foregroundStyle(.secondary).frame(width: 18)
                                Text(title).lineLimit(1).truncationMode(.tail)
                                Spacer(minLength: 0)
                            }
                            .font(.system(size: 13))
                            .padding(.horizontal, 8)
                            .frame(height: Self.row)
                            .hoverHighlight(RoundedRectangle(cornerRadius: 6, style: .continuous))
                            .background(i == highlighted ? AnyShapeStyle(.fill.tertiary) : AnyShapeStyle(.clear), in: .rect(cornerRadius: 6))
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("noteLink.row.\(i)")
                    }
                }
                .padding(5)
            }
        }
        .frame(width: Self.width)
        .onChange(of: query) { highlighted = 0 }
        .onAppear { searching = true }
        #if os(macOS)
        .onExitCommand { dismiss() }
        #endif
    }

    private func take(_ title: String) {
        pick(title)
        dismiss()
    }
}

/// A photo or video picked from the library, copied to a file the note can take in.
struct PickedMedia: Transferable {
    let url: URL

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(importedContentType: .item) { received in
            let folder = FileManager.default.temporaryDirectory.appending(path: "picked-\(UUID().uuidString)", directoryHint: .isDirectory)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let copy = folder.appending(path: received.file.lastPathComponent)
            try FileManager.default.copyItem(at: received.file, to: copy)
            return PickedMedia(url: copy)
        }
    }
}

/// "Choose Photo or Video…": the system's photo picker; what is picked goes in as files, in order.
struct PhotoAttach: ViewModifier {
    @Binding var isPresented: Bool
    let add: ([URL]) -> Void
    @State private var picked: [PhotosPickerItem] = []

    func body(content: Content) -> some View {
        content
            .photosPicker(isPresented: $isPresented, selection: $picked, maxSelectionCount: 20, matching: .any(of: [.images, .videos]))
            .onChange(of: picked) { _, items in
                guard !items.isEmpty else { return }
                picked = []
                Task {
                    var urls: [URL] = []
                    for item in items {
                        if let media = try? await item.loadTransferable(type: PickedMedia.self) { urls.append(media.url) }
                    }
                    add(urls)
                    for url in urls { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
                }
            }
    }
}
