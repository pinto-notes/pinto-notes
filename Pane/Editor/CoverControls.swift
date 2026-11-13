import SwiftUI

/// Where a new cover comes from: the Photos library or a file.
enum CoverSource { case photos, file }

/// Add icon and Add cover, beside the title while the pointer is on it (Mac). Each appears only
/// while the note doesn't have one yet (Emil, 13 November 2026: "let's make it better").
struct TitleActions: View {
    let icon: Bool
    let cover: Bool
    let addIcon: () -> Void
    let pickCover: (CoverSource) -> Void

    var body: some View {
        HStack(spacing: 2) {
            if icon {
                Button(action: addIcon) { Label("Add Icon", systemImage: "face.smiling") }
                    .buttonStyle(TitleActionStyle())
                    .accessibilityIdentifier("title.addIcon")
            }
            if cover {
                Menu {
                    Button("Choose from Photos…", systemImage: "photo.on.rectangle") { pickCover(.photos) }
                    Button("Choose File…", systemImage: "folder") { pickCover(.file) }
                } label: {
                    Label("Add Cover", systemImage: "photo")
                }
                .menuStyle(.button)
                .buttonStyle(TitleActionStyle())
                .menuIndicator(.hidden)
                .fixedSize()
                .accessibilityIdentifier("title.addCover")
            }
        }
    }

    /// About how wide the row is, to tell whether it fits beside the title.
    static func width(icon: Bool, cover: Bool) -> CGFloat { (icon ? 92 : 0) + (cover ? 104 : 0) }
    static let height: CGFloat = 24
}

/// Change and Remove on the cover's banner, while the pointer is on it.
struct CoverButtons: View {
    let pickCover: (CoverSource) -> Void
    let remove: () -> Void

    var body: some View {
        HStack(spacing: 6) {
            Menu {
                Button("Choose from Photos…", systemImage: "photo.on.rectangle") { pickCover(.photos) }
                Button("Choose File…", systemImage: "folder") { pickCover(.file) }
            } label: {
                Text("Change Cover")
            }
            .menuStyle(.button)
            .buttonStyle(CoverButtonStyle())
            .menuIndicator(.hidden)
            .fixedSize()
            .accessibilityIdentifier("cover.change")
            Button("Remove", action: remove)
                .buttonStyle(CoverButtonStyle())
                .accessibilityIdentifier("cover.remove")
        }
        .padding(12)
    }
}

/// The cover's banner with its buttons showing under the pointer.
struct CoverHover<Content: View>: View {
    let content: Content
    let pickCover: (CoverSource) -> Void
    let remove: () -> Void
    @State private var over = false

    var body: some View {
        content
            .overlay(alignment: .bottomTrailing) {
                if over { CoverButtons(pickCover: pickCover, remove: remove).transition(.opacity) }
            }
            .onHover { over = $0 }
            .animation(.easeOut(duration: 0.15), value: over)
    }
}
