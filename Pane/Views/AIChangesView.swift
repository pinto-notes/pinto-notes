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
                // The AIs connected now, so the empty list never offers to connect one that is
                // (council round 9: they weren't passed, and it always offered).
                AIChangesSheet(store: store, history: history, filter: center.request.flatMap { $0.isEmpty ? nil : $0 },
                               connected: ConnectedAIs.shared.connections.map(\.name))
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
    private let summaryFont = Font.system(size: 13)
    /// Who and when: 12 pt, read before choosing Undo (council round 4, 11-04: 11 was too small).
    private let lineFont = Font.system(size: 12)
    private let markSize: CGFloat = 14
    #else
    private let titleFont = Font.body.weight(.medium)
    private let summaryFont = Font.subheadline
    private let lineFont = Font.footnote
    private let markSize: CGFloat = 18
    #endif

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VersionAuthorMark(author: .ai(change.ai), size: markSize)
                .alignmentGuide(.firstTextBaseline) { $0[.bottom] - 2 }
            VStack(alignment: .leading, spacing: 2) {
                Text(model.title(change)).font(titleFont).lineLimit(1)
                // What it did, readable before you pick it (council round 3, 11-04: one 11 pt
                // line with the AI and the time cut it off); who and when under it, small.
                // Cut in the middle, so "and 2 more" stays when a long name fills the two lines
                // (council round 11).
                Text(model.summary(change)).font(summaryFont).lineLimit(2).truncationMode(.middle)
                    .fixedSize(horizontal: false, vertical: true)
                Text(line).font(lineFont).foregroundStyle(.secondary).lineLimit(1).monospacedDigit()
            }
        }
        .padding(.vertical, 3)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("aiChanges.row")
        .task(id: change.id) { await model.summarize(change) }
    }

    private var line: String {
        var parts = [change.ai, VersionHistoryModel.time(change.at)]
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
                VStack(alignment: .leading, spacing: 0) {
                    // What the two marks mean: a crossed-out line could pass for a done task
                    // (council round 14).
                    if !diff.added.isEmpty || !diff.removed.isEmpty {
                        AIChangeKey(added: !diff.added.isEmpty, removed: !diff.removed.isEmpty)
                            .padding(.horizontal, 20).padding(.top, 10)
                    }
                    VersionTextView(text: diff.text, changed: diff.added, removed: diff.removed)
                        .accessibilityIdentifier("aiChanges.diff")
                }
            } else if let failed = model.detailFailed {
                // With a way out: a failed load could only be left by picking another change
                // (council round 7).
                ContentUnavailableView {
                    Label("Can\u{2019}t show this change", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(failed)
                } actions: {
                    Button("Try Again") { Task { await model.select(change.id) } }
                        .tint(.primary)
                        .accessibilityIdentifier("aiChanges.detailRetry")
                }
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
        .tint(.primary)
        .accessibilityIdentifier("aiChanges.filter")
    }
}

/// Loading, offline and nothing yet, in place of the list.
struct AIChangesStatus: View {
    static let connectTitle = "Connect an AI\u{2026}"
    static func offersConnect(ais: [String]) -> Bool { ais.isEmpty }

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
            ContentUnavailableView {
                Label("No AI changes yet", systemImage: "sparkle")
            } description: {
                Text(model.filter.map { "When \($0) edits your notes, every change shows here." }
                     ?? "When an AI edits your notes, every change shows here.")
            } actions: {
                #if os(macOS)
                // With no AI connected, the way to connect one (council round 8: no next step).
                if AIChangesStatus.offersConnect(ais: model.ais) {
                    Button(AIChangesStatus.connectTitle) { SettingsRoute.shared.open(.ai) }
                        .accessibilityIdentifier("aiChanges.connect")
                }
                #endif
            }
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
                Rectangle().fill(Color.line).frame(width: 1)
                detail
            }
        }
        // A card like the app's others: one close × in the corner and the change's actions at the
        // top beside it, no bar of buttons along the bottom (Emil, 5 November 2026, on Version
        // History: "it doesn't look like a normal sheet like the other ones do").
        .overlay(alignment: .topTrailing) {
            CardCloseButton(size: 28, action: close)
                .accessibilityIdentifier("aiChanges.done")
                .padding(.top, 15).padding(.trailing, 16)
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
                                AIChangeRow(model: model, change: c)
                                    #if os(macOS)
                                    // The notes list's quiet grey, not an accent fill: in this sheet
                                    // only Open Note and the change's band are the accent (round 5).
                                    .hoverRow("aiChange", reach: Hover.noteRowReach, selected: model.selection == c.id)
                                    .quietSelection()
                                    #endif
                                    .tag(c.id).listRowSeparator(.hidden)
                            }
                        }
                        .listSectionSeparator(.hidden)
                    }
                    if model.olderFailed {
                        AIChangesOlderFailed(model: model).listRowSeparator(.hidden)
                    } else if model.hasMore {
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
        .background(Color.notePage) // one ground with the preview: grey beside black in the dark (round 4)
    }

    @ViewBuilder
    private var detail: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let c = model.selected {
                // What the AI did, in full before anyone chooses Undo: the summary on its own lines,
                // who and when under it (council, 11-04: one 11 pt line cut the action off).
                HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.title(c)).font(.system(size: 13, weight: .semibold)).lineLimit(1)
                    // Up to three lines (council round 8: two cut it off; round 11: a long rewritten
                    // paragraph filled the header above a preview that shows it anyway). The rest
                    // is in the preview, the tooltip and VoiceOver.
                    Text(model.summary(c))
                        .font(.system(size: 13))
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .help(model.summary(c))
                        .accessibilityIdentifier("aiChanges.summary")
                    Text(AIChangeDetail.byline(c))
                        .font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
                    status(c)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                actions(c).fixedSize()
                }
                .padding(.leading, 20)
                .padding(.trailing, 60)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.notePage)
                Rectangle().fill(Color.line).frame(height: 1)
                AIChangeDetail(model: model, change: c)
            } else {
                Color.notePage
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    /// Undoing, undone, or why it can't be undone: one quiet line under who and when
    /// (council round 11: the reason sat between Done and Undo).
    @ViewBuilder
    private func status(_ c: AIChange) -> some View {
        if model.undoing {
            HStack(spacing: 6) {
                ProgressView().controlSize(.small)
                Text("Undoing\u{2026}")
            }
            .font(.system(size: 12)).foregroundStyle(.secondary)
        } else if model.undone.contains(c.id) {
            Label("Undone", systemImage: "checkmark").font(.system(size: 12)).foregroundStyle(.secondary)
        } else if let why = model.undoReason(c) {
            Text(why).font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
                .accessibilityIdentifier("aiChanges.undoReason")
        }
    }

    private func actions(_ c: AIChange) -> some View {
        HStack(spacing: 8) {
            // Return opens the note; undoing is a click of its own, never a stray Return on a
            // sheet you're reading (council, 11-04).
            Button("Undo This Change") { Task { await model.undo(c) } }
                .disabled(!model.canUndo(c) || model.undoing || (c.changesText && model.diff == nil))
                .tint(.primary)
                .accessibilityHint(model.undoReason(c) ?? "")
                .accessibilityIdentifier("aiChanges.undo")
            Button("Open Note") { open(c) }
                .keyboardShortcut(.defaultAction)
                .buttonStyle(.amberProminent)
                .disabled(model.note(c) == nil)
                .accessibilityIdentifier("aiChanges.open")
        }
        .fixedSize()
    }
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
                        if model.olderFailed {
                            AIChangesOlderFailed(model: model)
                        } else if model.hasMore {
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

/// The end of the list when the next page didn't load: says so, with a way to try again.
struct AIChangesOlderFailed: View {
    let model: AIChangesModel
    static let message = "Couldn\u{2019}t load older changes."

    var body: some View {
        VStack(spacing: 6) {
            Text(Self.message).font(.footnote).foregroundStyle(.secondary)
            Button("Try Again") { model.retryOlder() }
                .controlSize(.small).tint(.primary)
                .accessibilityIdentifier("aiChanges.olderRetry")
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("aiChanges.olderFailed")
    }
}

/// "Added" and "Removed" over an AI change's preview, each beside the mark it means.
struct AIChangeKey: View {
    let added: Bool
    let removed: Bool
    static let addedName = "Added"
    static let removedName = "Removed"
    static func spoken(added: Bool, removed: Bool) -> String {
        let s = [added ? "added text is highlighted" : nil, removed ? "removed text is crossed out" : nil].compactMap { $0 }.joined(separator: ", ")
        return s.prefix(1).uppercased() + s.dropFirst()
    }

    var body: some View {
        HStack(spacing: 14) {
            if added {
                HStack(spacing: 5) {
                    RoundedRectangle(cornerRadius: 3).fill(Color.paneAccent.opacity(0.24)).frame(width: 16, height: 11)
                    Text(Self.addedName)
                }
            }
            if removed {
                HStack(spacing: 5) {
                    Text("abc").strikethrough().foregroundStyle(.secondary)
                        .padding(.horizontal, 2)
                        .background(Color(PColor.systemRed).opacity(0.14), in: .rect(cornerRadius: 3))
                        .accessibilityHidden(true)
                    Text(Self.removedName)
                }
            }
        }
        .font(.system(size: 12))
        .foregroundStyle(Color.muted)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Self.spoken(added: added, removed: removed))
        .accessibilityIdentifier("aiChanges.key")
    }
}
