import SwiftData
import SwiftUI

/// A folder shown as a gallery of cards, each led by the note's cover or first picture, as View as
/// Gallery does in Apple Notes. A recipe folder becomes a wall of food (Emil, 13 November 2026:
/// Notion's recipe books win on the collection, a grid of photo cards, more than on any one page).
/// On the Mac it takes the list's and the note's place beside the sidebar; a card opens its note
/// there, with a way back. Each folder keeps its own choice (ListOrderStore.setGallery).
struct FolderGallery: View {
    let scope: Scope
    let library: LibraryNotes
    let open: (UUID) -> Void
    let newNote: () -> Void
    @Environment(\.modelContext) private var context
    @State private var orderStore = ListOrderStore.shared

    /// The narrowest a card gets; the columns are as many as fit.
    static let cardMin: CGFloat = 210
    static let cardMax: CGFloat = 300

    var body: some View {
        let notes = Self.notes(in: scope, library: library, context: context, order: orderStore.order(for: scope))
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(Self.title(of: scope, context: context))
                        .font(.system(size: 26, weight: .bold))
                        .accessibilityAddTraits(.isHeader)
                    Text(notes.count == 1 ? "1 note" : "\(notes.count) notes")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.muted)
                }
                if notes.isEmpty {
                    Text("No notes yet.")
                        .foregroundStyle(Color.muted)
                        .padding(.top, 20)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: Self.cardMin, maximum: Self.cardMax), spacing: 24, alignment: .top)],
                              alignment: .leading, spacing: 28) {
                        ForEach(notes, id: \.id) { note in
                            Button { open(note.id) } label: { GalleryCard(note: note) }
                                .buttonStyle(GalleryCardStyle())
                                .accessibilityIdentifier("gallery.\(note.title)")
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 36)
            .padding(.top, 18)
            .padding(.bottom, 40)
        }
        .background(Color.notePage.ignoresSafeArea())
        .toolbar {
            #if os(macOS)
            ToolbarSpacer(.flexible)
            ToolbarItem {
                HStack(spacing: 0) {
                    Menu {
                        Button("View as List", systemImage: "list.bullet") { orderStore.setGallery(false, for: scope) }
                            .accessibilityIdentifier("gallery.viewAsList")
                        Divider()
                        ListOrderMenu(store: orderStore, scope: scope)
                    } label: {
                        Label("More", systemImage: "ellipsis")
                    }
                    .menuIndicator(.hidden)
                    .tint(.primary)
                    .accessibilityLabel("Gallery Options")
                    .accessibilityIdentifier("gallery.more")
                    Button(action: newNote) { Label("New Note", systemImage: "square.and.pencil") }
                        .accessibilityIdentifier("gallery.newNote")
                }
                .labelStyle(.iconOnly)
            }
            #endif
        }
        .accessibilityIdentifier("gallery")
    }

    /// The folder's notes in the list's order, pinned ones first.
    static func notes(in scope: Scope, library: LibraryNotes, context: ModelContext, order: ListOrder) -> [Note] {
        let entries = NoteListView.scoped(library.entries(in: context, order: order), to: scope, context: context)
        let notes = entries.compactMap { $0.note(in: context) }.filter { $0.trashedAt == nil && $0.deletedAt == nil }
        return notes.filter(\.isPinned) + notes.filter { !$0.isPinned }
    }

    static func title(of scope: Scope, context: ModelContext) -> String {
        switch scope {
        case .all: "All Notes"
        case .trash: "Recently Deleted"
        case .folder(let id): context.folder(id)?.name ?? "Notes"
        case .tag(let name): "#" + name
        }
    }
}

/// One note in the gallery: its picture (or its first lines on paper), then its title and a line.
struct GalleryCard: View {
    let note: Note

    var body: some View {
        let picture = NoteRow.picture(of: note)
        VStack(alignment: .leading, spacing: 9) {
            Color.clear
                .aspectRatio(4 / 3, contentMode: .fit)
                .overlay {
                    if let picture {
                        GalleryPhoto(file: picture)
                    } else {
                        GalleryFace(note: note)
                    }
                }
                .clipShape(.rect(cornerRadius: 12, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(Color.ink.opacity(0.08), lineWidth: 0.5)
                }
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    if note.isPinned {
                        Image(systemName: "pin.fill").font(.system(size: 10)).foregroundStyle(Color.muted)
                    }
                    Text(note.isLocked ? "Locked note" : note.title)
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                }
                Text(note.isLocked ? " " : note.preview)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.muted)
                    .lineLimit(1)
            }
            .padding(.horizontal, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(.rect)
        .accessibilityElement(children: .combine)
    }
}

/// A note with no picture: its icon large, or its first lines, on a quiet tile.
struct GalleryFace: View {
    let note: Note

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color.ink.opacity(0.04)
            if note.isLocked {
                Image(systemName: "lock.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let n = NoteCover.iconLength(note.title) {
                Text((note.title as NSString).substring(to: n).trimmingCharacters(in: .whitespaces))
                    .font(.system(size: 54))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text(Self.firstLines(of: note.body))
                    .font(.system(size: 11))
                    .foregroundStyle(Color.ink.opacity(0.55))
                    .lineSpacing(2)
                    .padding(14)
            }
        }
    }
}

extension GalleryFace {
    /// The note's text under its title, a few lines, as it reads: no pictures, no Markdown marks.
    static func firstLines(of body: String, limit: Int = 9) -> String {
        body.split(separator: "\n", omittingEmptySubsequences: true).dropFirst()
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty && !$0.hasPrefix("![") && !$0.hasPrefix("<!--") }
            .prefix(limit)
            .map { line in
                var l = Substring(line)
                for mark in ["- [ ] ", "- [x] ", "- ", "* ", "### ", "## ", "# ", "> "] where l.hasPrefix(mark) { l = l.dropFirst(mark.count); break }
                return String(l)
            }
            .joined(separator: "\n")
    }
}

/// A card's photo, decoded at the size it's drawn: sharp, and light on memory.
private struct GalleryPhoto: View {
    let file: Attachment
    @Environment(\.displayScale) private var scale
    @State private var image: CGImage?

    var body: some View {
        ZStack {
            Color.ink.opacity(0.06)
            if let image {
                Image(decorative: image, scale: scale)
                    .resizable()
                    .scaledToFill()
                    .transition(.opacity)
            }
        }
        .accessibilityHidden(true)
        .task(id: file.id) {
            let url = FileStore.url(for: file.id, filename: file.filename), pixels = FolderGallery.cardMax * scale * 1.5
            image = await Task.detached(priority: .utility) { FileThumbnail.decode(url, pixels: pixels) }.value
        }
    }
}
