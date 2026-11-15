import SwiftUI

#if os(iOS)
/// The Library button on the iPhone board's dock: the library the Mac keeps, synced to this
/// iPhone (LibrarySync), in a sheet. A tap puts an item on the board.
struct CanvasLibraryDockButton: View {
    let canvas: CanvasController
    var library: CanvasLibrary = .shared

    var body: some View {
        Button { canvas.showingLibrary = true } label: {
            CanvasWell(selected: canvas.showingLibrary) { Image(systemName: CanvasLibrarySheet.symbol) }
        }
        .buttonStyle(CanvasPressStyle())
        .accessibilityLabel(CanvasLibrarySheet.title)
        .accessibilityIdentifier("canvas.tool.library")
        .sheet(isPresented: Bindable(canvas).showingLibrary) {
            CanvasLibrarySheet(canvas: canvas, library: library)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
                // Solid, as the app's other sheets are: the glass let the board's dock read
                // through over the last row (round 12, library-sync-iphone).
                .presentationBackground(CanvasLibrarySheet.ground)
        }
    }
}

/// Your whiteboard library on iPhone: the same items as on the Mac, in the same groups ("Saved",
/// then each library file) and order, each as the board draws it with its name under it. A tap
/// adds it to the middle of the board, selected, and closes the sheet; a long press offers Rename
/// and Remove, which reach the Mac on its next sync.
struct CanvasLibrarySheet: View {
    let canvas: CanvasController
    var library: CanvasLibrary = .shared

    static let title = "Library"
    static let symbol = "books.vertical"
    static let emptyLine = "Shapes you save to the library on your Mac show here."
    static let columns = 4
    static let spacing: CGFloat = 12
    /// The sheet's ground: the app's sheets' own, opaque.
    static let ground = Color(Palette.sheetGround)

    @State private var query = ""
    @State private var renaming: CanvasLibraryItem?
    @State private var draft = ""

    private var searching: Bool { CanvasLibraryGrid.showsSearch(library.items.count) }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle(Self.title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { canvas.showingLibrary = false }
                            .accessibilityIdentifier("canvas.library.done")
                    }
                }
        }
        // Pictures for what has none yet (an item that just came from the Mac), drawn by the board.
        .task(id: library.items.map(\.id)) { await canvas.drawThumbnails(library) }
        .alert("Rename", isPresented: Binding(get: { renaming != nil }, set: { if !$0 { renaming = nil } })) {
            TextField("Name", text: $draft)
                .accessibilityIdentifier("canvas.library.rename")
            Button("Cancel", role: .cancel) { renaming = nil }
            Button("Rename") {
                if let item = renaming, draft != item.title { library.rename(item.id, to: draft) }
                renaming = nil
            }
        }
        .accessibilityIdentifier("canvas.library")
    }

    @ViewBuilder private var content: some View {
        if library.items.isEmpty {
            VStack(spacing: 10) {
                Image(systemName: Self.symbol)
                    .font(.system(size: 30))
                    .foregroundStyle(Color.muted)
                    .accessibilityHidden(true)
                Text(Self.emptyLine)
                    .font(.body)
                    .foregroundStyle(Color.muted)
                    .multilineTextAlignment(.center)
                    .accessibilityIdentifier("canvas.library.empty")
            }
            .padding(32)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if searching {
            grid.searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search")
        } else {
            grid
        }
    }

    private var grid: some View {
        let grid = CanvasLibraryGrid(library.items, query: searching ? query : "", columns: Self.columns)
        return ScrollView {
            if grid.groups.isEmpty {
                Text("No items match")
                    .foregroundStyle(Color.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                    .accessibilityIdentifier("canvas.library.noMatches")
            }
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(grid.groups) { group in
                    Text(group.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                        .padding(.top, 6)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityIdentifier("canvas.library.group")
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: Self.spacing), count: Self.columns), spacing: Self.spacing) {
                        ForEach(group.items) { tile($0) }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
    }

    private func tile(_ item: CanvasLibraryItem) -> some View {
        let shape = RoundedRectangle(cornerRadius: 12, style: .continuous)
        return Button { add(item) } label: {
            VStack(spacing: 4) {
                // Every tile the same square, whatever the shape inside.
                Color.clear
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        CanvasLibraryTilePicture(item: item, light: library.thumbnails[item.id], dark: library.darkThumbnails[item.id])
                            .padding(10)
                    }
                    .background(Color.primary.opacity(0.045), in: shape)
                Text(item.title)
                    .font(.caption)
                    .foregroundStyle(Color.muted)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
            .contentShape(.rect)
        }
        .buttonStyle(CanvasPressStyle())
        .contextMenu {
            Button("Add to Whiteboard", systemImage: "plus") { add(item) }
            Button("Rename\u{2026}", systemImage: "pencil") { draft = item.title; renaming = item }
            Divider()
            Button("Remove", systemImage: "trash", role: .destructive) { library.remove(item.id) }
        }
        .accessibilityLabel(item.title)
        .accessibilityHint("Adds it to the whiteboard")
        .accessibilityIdentifier("canvas.library.item")
    }

    private func add(_ item: CanvasLibraryItem) {
        canvas.showingLibrary = false
        canvas.insert(item)
    }
}

/// An item as the board draws it, in dark mode in the colours the canvas shows then, or its
/// outline until the board has drawn it (the iPhone's CanvasLibraryThumbnail).
struct CanvasLibraryTilePicture: View {
    let item: CanvasLibraryItem
    var light: PImage?
    var dark: PImage?
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if let image = scheme == .dark ? dark : light {
            Image(uiImage: image).resizable().interpolation(.high).scaledToFit()
        } else {
            CanvasSketchView(sketch: CanvasSketch(elements: item.elements), lineWidth: 1)
        }
    }
}
#endif
