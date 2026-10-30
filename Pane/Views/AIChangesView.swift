import SwiftData
import SwiftUI

/// AI Changes: every change an AI made to your notes, newest first by day, each with what it
/// changed and Undo. The trust gate for letting an AI into your notes: you can see all of it and
/// take any of it back. On the Mac a sheet with the list beside the diff; on iPhone a list, then
/// the change.
struct AIChangesSheet: View {
    @State private var model: AIChangesModel
    @Environment(\.dismiss) private var dismiss
    /// After Open Note: whatever presented this closes too (Settings).
    var opened: () -> Void = {}

    init(store: AIChangesStore, history: NoteHistory, filter: String? = nil, connected: [String] = [], opened: @escaping () -> Void = {}) {
        _model = State(initialValue: AIChangesModel(store: store, history: history, filter: filter, connected: connected))
        self.opened = opened
    }

    init(model: AIChangesModel) {
        _model = State(initialValue: model)
    }

    var body: some View {
        content
            .task { await model.load() }
            .alert("Couldn\u{2019}t undo this change", isPresented: Binding(get: { model.undoError != nil }, set: { if !$0 { model.undoError = nil } })) {
                Button("OK") {}
            } message: { Text(model.undoError ?? "") }
            .alert("Restore the version from before this change?", isPresented: Binding(get: { model.conflict != nil }, set: { if !$0 { model.conflict = nil } })) {
                Button("Restore Anyway") { if let c = model.conflict { Task { await model.undo(c, anyway: true) } } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("You\u{2019}ve changed those lines since. Restoring puts the note back as it was before this change. Your later edits stay in version history.")
            }
    }

    @ViewBuilder
    private var content: some View {
        #if os(macOS)
        MacAIChanges(model: model, close: { dismiss() }, open: open)
        #else
        PhoneAIChanges(model: model, close: { dismiss() }, open: open)
        #endif
    }

    private func open(_ c: AIChange) {
        NoteOpener.shared.open(c.noteID)
        dismiss()
        opened()
    }
}

/// Shows AI Changes when something asks (View › AI Changes, an AI's receipt). Put on the notes window.
struct AIChangesPresenter: ViewModifier {
    @State private var center = AIChangesCenter.shared

    func body(content: Content) -> some View {
        content.sheet(isPresented: Binding(get: { center.request != nil }, set: { if !$0 { center.request = nil } })) {
            if let store = center.store, let history = NoteHistory.shared {
                AIChangesSheet(store: store, history: history, filter: center.request.flatMap { $0.isEmpty ? nil : $0 })
            }
        }
    }
}

// MARK: Pieces both platforms use

/// One change in the list: the AI's mark, the note, and what it did when.
struct AIChangeRow: View {
    let model: AIChangesModel
    let change: AIChange

    #if os(macOS)
    private let titleFont = Font.system(size: 13, weight: .medium)
    private let lineFont = Font.system(size: 11)
    private let markSize: CGFloat = 14
    #else
    private let titleFont = Font.body.weight(.medium)
    private let lineFont = Font.subheadline
    private let markSize: CGFloat = 18
    #endif

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VersionAuthorMark(author: .ai(change.ai), size: markSize)
                .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 2 }
            VStack(alignment: .leading, spacing: 2) {
                Text(model.title(change)).font(titleFont).lineLimit(1)
                Text(line).font(lineFont).foregroundStyle(.secondary).lineLimit(1).monospacedDigit()
            }
        }
        .padding(.vertical, 3)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("aiChanges.row")
        .task(id: change.id) { await model.summarize(change) }
    }

    private var line: String {
        var parts = [change.ai, VersionHistoryModel.time(change.at), model.summary(change)]
        if model.undone.contains(change.id) { parts.append("Undone") } else if change.trashed, change.kind != .deleted { parts.append("In Recently Deleted") }
        return parts.joined(separator: " \u{00B7} ")
    }
}

/// The selected change: its diff, or what it did for a change that isn't to the text.
struct AIChangeDetail: View {
    let model: AIChangesModel
    let change: AIChange

    var body: some View {
        Group {
            if change.changesText, let diff = model.diff {
                VersionTextView(text: diff.text, changed: diff.added, removed: diff.removed)
                    .accessibilityIdentifier("aiChanges.diff")
            } else if let failed = model.detailFailed {
                ContentUnavailableView("Can\u{2019}t show this change", systemImage: "exclamationmark.triangle", description: Text(failed))
            } else if change.changesText {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView(model.summary(change), systemImage: Self.symbol(change.kind),
                                       description: Text("\(change.ai) didn\u{2019}t change the note\u{2019}s text."))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.notePage)
    }

    static func symbol(_ kind: AIChange.Kind) -> String {
        switch kind {
        case .moved: "folder"
        case .deleted: "trash"
        case .restored: "arrow.uturn.backward"
        case .created: "square.and.pencil"
        case .edit, .restore: "pencil"
        }
    }

    /// "ChatGPT · Today at 14:02", over the diff.
    static func byline(_ c: AIChange) -> String { "\(c.ai) \u{00B7} \(AIChangesModel.when(c.at))" }
}

/// The filter: every AI, or one.
struct AIChangesFilter: View {
    let model: AIChangesModel

    var body: some View {
        Picker("Show", selection: Binding(get: { model.filter ?? "" }, set: { v in Task { await model.setFilter(v.isEmpty ? nil : v) } })) {
            Text("All AIs").tag("")
            ForEach(model.ais, id: \.self) { Text($0).tag($0) }
        }
        .accessibilityIdentifier("aiChanges.filter")
    }
}

/// Loading, offline and nothing yet, in place of the list.
struct AIChangesStatus: View {
    let model: AIChangesModel

    var body: some View {
        switch model.phase {
        case .loading:
            ProgressView("Loading changes\u{2026}").frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed(let message):
            ContentUnavailableView {
                Label("Can\u{2019}t load AI changes", systemImage: "wifi.slash")
            } description: {
                Text(message)
            } actions: {
                Button("Try Again") { Task { await model.load() } }
            }
        case .loaded:
            ContentUnavailableView("No AI changes yet", systemImage: "sparkle",
                                   description: Text(model.filter.map { "When \($0) edits your notes, every change shows here." }
                                                     ?? "When an AI edits your notes, every change shows here."))
                .accessibilityIdentifier("aiChanges.empty")
        }
    }
}

// MARK: Mac

#if os(macOS)
struct MacAIChanges: View {
    @Bindable var model: AIChangesModel
    let close: () -> Void
    let open: (AIChange) -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                sidebar.frame(width: 300)
                Rectangle().fill(Color.separatorLine).frame(width: 1)
                detail
            }
            Rectangle().fill(Color.separatorLine).frame(height: 1)
            bar
        }
        .frame(minWidth: 860, idealWidth: 940, minHeight: 540, idealHeight: 620)
    }

    private var hasChanges: Bool { model.phase == .loaded && !model.changes.isEmpty }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(AIChangeCopy.title).font(.system(size: 13, weight: .semibold))
                Spacer()
                AIChangesFilter(model: model).labelsHidden().fixedSize()
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 6)
            if hasChanges {
                List(selection: Binding(get: { model.selection }, set: { id in Task { await model.select(id) } })) {
                    ForEach(model.days) { day in
                        Section(day.title) {
                            ForEach(day.changes) { c in
                                AIChangeRow(model: model, change: c).tag(c.id).listRowSeparator(.hidden)
                            }
                        }
                        .listSectionSeparator(.hidden)
                    }
                    if model.hasMore {
                        ProgressView().controlSize(.small).frame(maxWidth: .infinity)
                            .task { await model.loadMore() }
                    }
                }
                .listStyle(.inset)
                .scrollContentBackground(.hidden)
                .accessibilityIdentifier("aiChanges.list")
            } else {
                AIChangesStatus(model: model).frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(Color(nsColor: .windowBackgroundColor))
    }

    @ViewBuilder
    private var detail: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let c = model.selected {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.title(c)).font(.system(size: 13, weight: .semibold)).lineLimit(1)
                    Text("\(AIChangeDetail.byline(c)) \u{00B7} \(model.summary(c))")
                        .font(.system(size: 11)).foregroundStyle(.secondary).lineLimit(1)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.notePage)
                Rectangle().fill(Color.separatorLine).frame(height: 1)
                AIChangeDetail(model: model, change: c)
            } else {
                Color.notePage
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var bar: some View {
        HStack(spacing: 8) {
            if model.undoing {
                ProgressView().controlSize(.small)
                Text("Undoing\u{2026}").font(.system(size: 13)).foregroundStyle(.secondary)
            } else if let c = model.selected, model.undone.contains(c.id) {
                Label("Undone", systemImage: "checkmark").font(.system(size: 13)).foregroundStyle(.secondary)
            }
            Spacer()
            Button("Done", action: close).keyboardShortcut(.cancelAction)
            if let c = model.selected {
                Button("Open Note") { open(c) }
                    .disabled(model.note(c) == nil)
                    .accessibilityIdentifier("aiChanges.open")
                Button("Undo This Change") { Task { await model.undo(c) } }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.amberProminent)
                    .disabled(!model.canUndo(c) || model.undoing || (c.changesText && model.diff == nil))
                    .accessibilityIdentifier("aiChanges.undo")
            }
        }
        .controlSize(.large)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(nsColor: .windowBackgroundColor))
    }
}

private extension Color {
    /// A separator drawn as a plain fill, so it reads the same in the sheet and in captures.
    static let separatorLine = Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? NSColor(white: 0.27, alpha: 1) : NSColor(white: 0.87, alpha: 1) })
}
#endif

// MARK: iPhone

#if os(iOS)
struct PhoneAIChanges: View {
    @Bindable var model: AIChangesModel
    let close: () -> Void
    let open: (AIChange) -> Void

    var body: some View {
        NavigationStack {
            Group {
                if model.phase == .loaded && !model.changes.isEmpty {
                    List {
                        ForEach(model.days) { day in
                            Section(day.title) {
                                ForEach(day.changes) { c in
                                    NavigationLink(value: c.id) { AIChangeRow(model: model, change: c) }
                                }
                            }
                        }
                        if model.hasMore {
                            ProgressView().frame(maxWidth: .infinity).task { await model.loadMore() }
                        }
                    }
                    .accessibilityIdentifier("aiChanges.list")
                } else {
                    AIChangesStatus(model: model)
                }
            }
            .navigationTitle(AIChangeCopy.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done", action: close) }
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        AIChangesFilter(model: model)
                    } label: {
                        Label("Filter", systemImage: model.filter == nil ? "line.3.horizontal.decrease" : "line.3.horizontal.decrease.circle.fill")
                    }
                    .tint(.primary)
                }
            }
            .navigationDestination(for: AIChange.ID.self) { id in
                PhoneAIChangeDetail(model: model, id: id, open: open)
            }
        }
    }
}

struct PhoneAIChangeDetail: View {
    let model: AIChangesModel
    let id: AIChange.ID
    let open: (AIChange) -> Void

    var body: some View {
        VStack(spacing: 0) {
            if let c = model.selected {
                HStack(spacing: 8) {
                    VersionAuthorMark(author: .ai(c.ai), size: 17)
                    Text(AIChangeDetail.byline(c)).font(.subheadline).foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                Text(model.undone.contains(c.id) ? "\(model.summary(c)) \u{00B7} Undone" : model.summary(c))
                    .font(.subheadline).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 2)
                    .padding(.bottom, 8)
                AIChangeDetail(model: model, change: c)
            }
        }
        .background(Color.notePage.ignoresSafeArea())
        .navigationTitle(model.selected.map(model.title) ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let c = model.selected, model.note(c) != nil {
                ToolbarItem(placement: .primaryAction) {
                    Button("Open Note") { open(c) }.accessibilityIdentifier("aiChanges.open")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            if let c = model.selected, model.canUndo(c) {
                Button("Undo This Change") { Task { await model.undo(c) } }
                    .buttonStyle(.amberProminent(.form, wide: true))
                    .amberBusy(model.undoing)
                    .disabled(model.undoing || (c.changesText && model.diff == nil))
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
                    .accessibilityIdentifier("aiChanges.undo")
            }
        }
        .task(id: id) { if model.selection != id || model.diff == nil { await model.select(id) } }
    }
}
#endif
