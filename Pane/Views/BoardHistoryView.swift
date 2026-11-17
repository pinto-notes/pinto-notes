import SwiftUI

/// A whiteboard's History (BoardHistoryModel): the versions by day beside the picked one drawn as
/// the board draws it, and Restore. The same card as a note's History (VersionHistoryView): one
/// close × in the corner, the action at the top.
struct BoardHistorySheet: View {
    @State private var model: BoardHistoryModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme

    init(model: BoardHistoryModel) {
        _model = State(initialValue: model)
    }

    static let title = "Version History"
    static let restoreTitle = "Restore This Version"
    static let emptyLine = "When you or an AI change this board, its earlier versions appear here. The last ten are kept."

    var body: some View {
        content
            .task { model.dark = scheme == .dark; await model.load() }
            // Drawn in the look the window has now.
            .onChange(of: scheme) { _, now in
                model.dark = now == .dark
                Task { await model.select(model.selection) }
            }
            // The two-device check and the picture runs press Restore as a note's History has it
            // pressed (VersionHistorySheet).
            .onReceive(NotificationCenter.default.publisher(for: CollabScript.history)) { n in
                guard n.object as? String == "restore" else { return }
                Task { if await model.restore() { dismiss() } }
            }
            #if os(macOS)
            .frame(minWidth: 820, idealWidth: 900, minHeight: 540, idealHeight: 600)
            #endif
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("boardHistory")
    }

    @ViewBuilder private var content: some View {
        #if os(macOS)
        HStack(spacing: 0) {
            sidebar.frame(width: 260).background(Color(nsColor: .windowBackgroundColor))
            Hairline(vertical: true)
            detail.background(Color.notePage)
        }
        .overlay(alignment: .topTrailing) {
            CardCloseButton(size: 28) { dismiss() }
                .accessibilityIdentifier("boardHistory.done")
                .padding(.top, 15).padding(.trailing, 16)
        }
        #else
        NavigationStack {
            VStack(spacing: 0) {
                preview.frame(height: 300)
                list
            }
            .navigationTitle(Self.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { restoreButton }
            }
        }
        #endif
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(Self.title).font(.system(size: 13, weight: .semibold))
            Text(model.title).font(.system(size: 11)).foregroundStyle(.secondary).lineLimit(1)
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            header
            list
        }
    }

    private var list: some View {
        List(selection: Binding(get: { model.selection }, set: { id in Task { await model.select(id) } })) {
            ForEach(model.days, id: \.title) { day in
                Section(day.title) {
                    ForEach(day.versions) { v in
                        row(v).tag(v.id)
                            .listRowSeparator(.hidden)
                            .accessibilityIdentifier("boardHistory.row.\(v.isCurrent ? "current" : String(v.id))")
                    }
                }
                .listSectionSeparator(.hidden)
            }
        }
        .listStyle(.inset)
        .scrollContentBackground(.hidden)
        .overlay {
            switch model.phase {
            case .loading: ProgressView()
            case .failed(let message):
                ContentUnavailableView {
                    Label("Can\u{2019}t load versions", systemImage: "wifi.slash")
                } description: { Text(message) } actions: {
                    Button("Try Again") { Task { await model.load() } }
                }
            case .loaded:
                if model.isEmpty {
                    ContentUnavailableView("No earlier versions", systemImage: "clock.arrow.circlepath", description: Text(Self.emptyLine))
                }
            }
        }
        .accessibilityIdentifier("boardHistory.list")
    }

    private func row(_ v: BoardVersion) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(v.isCurrent ? "Current version" : VersionHistoryModel.time(v.madeAt))
                .font(.system(size: 13, weight: .medium))
                .monospacedDigit()
            HStack(spacing: 5) {
                VersionAuthorMark(author: v.author, size: 12)
                Text(v.isCurrent ? "Now on the board" : v.author.name).lineLimit(1)
            }
            .font(.system(size: 11))
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 3)
        .accessibilityElement(children: .combine)
    }

    private var detail: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.selected.map(BoardHistoryModel.heading) ?? " ")
                        .font(.system(size: 13, weight: .semibold))
                        .accessibilityIdentifier("boardHistory.heading")
                    Text(model.selected?.isCurrent == true ? "The board as it is now" : model.selected.map { "By \($0.author.name)" } ?? " ")
                        .font(.system(size: 11)).foregroundStyle(.secondary)
                }
                Spacer(minLength: 8)
                if model.selected?.isCurrent == false { restoreButton.fixedSize() }
            }
            .padding(.leading, 20)
            .padding(.trailing, 60)
            .padding(.vertical, 12)
            preview
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    /// The version as the board draws it, on the board's own ground.
    private var preview: some View {
        ZStack {
            (scheme == .dark ? Color.black : Color.white)
            if let png = model.picture, let image = Self.image(png) {
                image.resizable().scaledToFit().padding(24)
                    .accessibilityLabel("The board at \(model.selected.map(BoardHistoryModel.heading) ?? "this version")")
                    .accessibilityIdentifier("boardHistory.picture")
            } else if model.emptyVersion {
                Text("Nothing was drawn yet").foregroundStyle(.secondary)
            } else if let failed = model.previewFailed {
                Text(failed).foregroundStyle(.secondary).multilineTextAlignment(.center).padding()
            } else if model.selection != nil {
                ProgressView()
            }
        }
        .clipShape(.rect(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.primary.opacity(0.08)))
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }

    static func image(_ png: Data) -> Image? {
        #if os(macOS)
        NSImage(data: png).map { Image(nsImage: $0) }
        #else
        UIImage(data: png).map { Image(uiImage: $0) }
        #endif
    }

    private var restoreButton: some View {
        Button(Self.restoreTitle) {
            Task { if await model.restore() { dismiss() } }
        }
        .keyboardShortcut(.defaultAction)
        .buttonStyle(.amberProminent)
        .disabled(model.selected == nil || model.selected?.isCurrent == true || model.picture == nil && !model.emptyVersion)
        .accessibilityIdentifier("boardHistory.restore")
    }
}
