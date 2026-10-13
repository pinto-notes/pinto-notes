import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// The import a source opens: its guide where it has one, the plain import sheet otherwise.
/// Every place that starts an import (first run, the File menu, the import list, the iPhone's
/// menu, files shared into the app) comes through here, so a source never has two sheets.
struct ImportFlow: View {
    let kind: ImportKind
    var files: [URL] = []
    var onImported: ([UUID]) -> Void = { _ in }

    var body: some View {
        if let guide = ImportGuide.live(kind) {
            ImportGuideFlow(guide: guide, kind: kind, files: files, onImported: onImported)
        } else {
            ImportSheet(kind, files: files, onImported: onImported)
        }
    }
}

extension ImportGuide {
    /// The guide a source opens, once it has shipped (nil: the plain import sheet).
    static func live(_ kind: ImportKind) -> ImportGuide? {
        switch kind {
        #if os(iOS)
        case .keep: keepPhone
        #else
        case .keep: keep
        #endif
        default: nil
        }
    }
}

/// Runs a guide's pages: Back and Next, the links each step opens, the file picked or dropped,
/// the real import, and what came. Nothing at the source is changed.
struct ImportGuideFlow: View {
    let guide: ImportGuide
    let kind: ImportKind
    var files: [URL] = []
    var onImported: ([UUID]) -> Void = { _ in }

    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    enum Stage: Equatable { case intro, step(Int), drop, importing(done: Int, total: Int), success }

    @State private var stage: Stage = .intro
    /// Where Back goes: the pages walked through, in order.
    @State private var trail: [Stage] = []
    /// Steps whose link was opened.
    @State private var opened: Set<Int> = []
    @State private var sources: [ImportSource] = []
    @State private var inspecting = false
    @State private var picking = false
    @State private var targeted = false
    @State private var stopRequested = false
    @State private var summary: ImportSummary?

    private var importable: [ImportSource] { sources.filter { $0.problem == nil && $0.notes > 0 } }
    private var noteCount: Int { importable.reduce(0) { $0 + $1.notes } }

    var body: some View {
        ImportGuideSheet(guide: guide, page: page, opened: openedHere, found: found, brought: summary?.notes, broughtLine: broughtLine,
                         act: act, onDrop: { urls in
                             guard stage == .drop else { return false }
                             add(urls, replacing: true)
                             return true
                         }, onTargeted: { targeted = $0 })
            .presentationBackground(Color(Palette.sheetGround))
            .interactiveDismissDisabled(isImporting)
            .fileImporter(isPresented: $picking, allowedContentTypes: kind.contentTypes, allowsMultipleSelection: kind == .evernote) { result in
                if case .success(let urls) = result { add(urls, replacing: true) }
            }
            .fileDialogDefaultDirectory(FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first)
            .task {
                guard !files.isEmpty else { return }
                go(.drop)
                add(files, replacing: true)
            }
    }

    // MARK: What the sheet shows

    private var isImporting: Bool { if case .importing = stage { true } else { false } }

    private var page: ImportGuidePage {
        switch stage {
        case .intro: .intro
        case .step(let i): .step(i)
        case .importing(let done, let total): .importing(done: done, total: total)
        case .success: .success
        case .drop:
            if targeted { .drop(.hovering) }
            else if sources.isEmpty || inspecting { .drop(.empty) }
            else if importable.isEmpty { .drop(.wrong) }
            else { .drop(.found) }
        }
    }

    private var openedHere: Bool {
        if case .step(let i) = stage { opened.contains(i) } else { false }
    }

    private var found: (name: String, detail: String, button: String)? {
        guard !importable.isEmpty else { return nil }
        let notes = noteCount.formatted(.number.locale(Locale(identifier: "en_US")))
        let name = importable.count == 1 ? importable[0].name : "\(importable.count) files"
        return (name, noteCount == 1 ? "1 note" : "\(notes) notes", noteCount == 1 ? "Import 1 Note" : "Import \(notes) Notes")
    }

    /// Said instead of the guide's line when the import added nothing.
    private var broughtLine: String? {
        guard let summary, summary.notes == 0 else { return nil }
        return summary.alreadyImported > 0 ? "These notes came in an earlier import, so nothing was added twice."
            : "There were no notes in it to bring in."
    }

    // MARK: Presses

    private func act(_ action: ImportGuideSheet.Action) {
        switch action {
        case .close:
            if !isImporting { dismiss() }
        case .back:
            if !isImporting, let last = trail.popLast() { stage = last; targeted = false }
        case .primary:
            primary()
        case .quiet:
            quiet()
        }
    }

    private func primary() {
        switch stage {
        case .intro:
            if guide.steps.isEmpty { go(.drop); picking = true } else { go(.step(0)) }
        case .step(let i):
            let s = guide.steps[i]
            if s.action != nil, !opened.contains(i) { open(i) } else { next(after: i) }
        case .drop:
            if importable.isEmpty { picking = true } else { Task { await runImport() } }
        case .importing:
            break
        case .success:
            dismiss()
        }
    }

    private func quiet() {
        switch stage {
        case .intro:
            if !guide.skipTitle.isEmpty { go(.drop) }
        case .step(let i):
            if guide.steps[i].action != nil, !opened.contains(i) { next(after: i) } else if guide.steps[i].action != nil { open(i) }
        case .drop:
            // Found: choose another. Otherwise: show me how again.
            if !importable.isEmpty { picking = true } else if !guide.steps.isEmpty { go(.step(0)) }
        case .importing:
            stopRequested = true
        case .success:
            break
        }
    }

    private func go(_ next: Stage) {
        trail.append(stage)
        stage = next
    }

    private func next(after i: Int) {
        go(i + 1 < guide.steps.count ? .step(i + 1) : .drop)
    }

    private func open(_ i: Int) {
        opened.insert(i)
        if let link = guide.steps[i].link { openURL(link) }
    }

    // MARK: The import

    private func add(_ urls: [URL], replacing: Bool) {
        guard !urls.isEmpty else { return }
        if replacing { sources = [] }
        inspecting = true
        Task {
            let kind = kind
            let seen = await Task.detached { urls.map(kind.inspect) }.value
            sources += seen
            inspecting = false
        }
    }

    private func runImport() async {
        let chosen = importable
        guard !chosen.isEmpty else { return }
        stopRequested = false
        go(.importing(done: 0, total: noteCount))
        let result = await kind.run(chosen, into: .perSource, context: context,
                                    progress: { done, total in stage = .importing(done: done, total: total) },
                                    shouldStop: { stopRequested })
        summary = result
        trail = []
        stage = .success
        EvernoteInbox.clear()
        onImported(result.noteIDs)
    }
}
