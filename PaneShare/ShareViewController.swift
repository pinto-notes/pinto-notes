import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// "Save to Pinto Notes" from any app's share sheet (Apple Notes, Safari, Files…): a new note, or
/// added to the end of one you have.
final class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        let model = ShareModel(context: extensionContext)
        let host = UIHostingController(rootView: ShareSheet(model: model))
        host.view.backgroundColor = .clear
        addChild(host)
        host.view.frame = view.bounds
        host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(host.view)
        host.didMove(toParent: self)
        Task { await model.load() }
    }
}

@MainActor
@Observable
final class ShareModel {
    let context: NSExtensionContext?
    var markdown = ""
    var files: [URL] = []
    var loading = true
    var saved = false
    var error: String?
    /// The folders the app left for us, and the one this goes into (the last one used).
    var folders: [Inbox.FolderChoice] = Inbox.folders()
    var folder: UUID? = Inbox.lastFolder
    /// Add to: the notes the app left (newest first, never locked ones), and the one picked.
    /// Nil is a new note, as before (2026-11-04).
    var recents: [ChecklistShelf.Recent] = ChecklistShelf.recents()
    var note: UUID?
    var query = ""

    init(context: NSExtensionContext?) {
        self.context = context
        if let f = folder, !folders.contains(where: { $0.id == f }) { folder = nil }
        if folder == nil { folder = (folders.first { $0.name == "Notes" } ?? folders.first)?.id }
    }

    /// Files shared without text are kept in the folder as files; anything with text is a note.
    var asFiles: Bool { markdown.isEmpty && !files.isEmpty }

    var title: String { SharedItem.title(markdown: markdown, files: files) }

    /// The five newest notes, or with words typed, the notes whose titles have them.
    var offered: [ChecklistShelf.Recent] {
        let q = query.trimmingCharacters(in: .whitespaces)
        return Array((q.isEmpty ? recents : ChecklistShelf.search(q, in: recents)).prefix(q.isEmpty ? Self.recentCount : 8))
    }

    static let recentCount = 5

    /// The picked note's title, kept if a search hides its row.
    var noteTitle: String? { note.flatMap { id in recents.first { $0.id == id }?.title } }

    /// What Save says it did: saved, and when it goes in (persona council round 5: "Added to"
    /// said it was in the note, but it goes in the next time Pinto Notes opens).
    var doneLine: String { InboxCopy.done(note: noteTitle) }

    func load() async {
        let items = context?.inputItems as? [NSExtensionItem] ?? []
        let providers = items.flatMap { $0.attachments ?? [] }
        // Safari hands the page's title over beside the link.
        let pageTitle = items.lazy.compactMap { ($0.attributedTitle ?? $0.attributedContentText)?.string }.first { !$0.isEmpty }
        // The same conversion as the Mac's Apple Notes import (see SharedItem).
        let content = await SharedItem.read(providers, pageTitle: pageTitle, filesInto: FileManager.default.temporaryDirectory)
        markdown = content.markdown
        files = content.files
        loading = false
    }

    func save() {
        guard !saved else { return }
        do {
            try Inbox.add(markdown: markdown, files: files, folder: note == nil ? folder : nil, note: note)
            if note == nil { Inbox.lastFolder = folder }
            saved = true
            Task {
                try? await Task.sleep(for: .milliseconds(650))
                context?.completeRequest(returningItems: nil)
            }
        } catch {
            self.error = "Couldn't save. Open Pinto Notes once, then try again."
        }
    }

    func cancel() { context?.cancelRequest(withError: CocoaError(.userCancelled)) }
}

/// Laid out as the system's own share sheets are (Notes, Reminders): a navigation bar with Cancel
/// and Save, what you're saving, then where it goes as rows (Emil, 4 November 2026: the earlier
/// sheet, with every note listed inline under raw markdown, was "terribly confusing").
struct ShareSheet: View {
    @Bindable var model: ShareModel

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if model.loading {
                        ProgressView().frame(maxWidth: .infinity, minHeight: 80)
                    } else {
                        preview
                    }
                }
                if !model.loading {
                    Section {
                        if !model.recents.isEmpty {
                            NavigationLink {
                                AddToPicker(model: model)
                            } label: {
                                LabeledContent(ShareWords.addTo, value: model.noteTitle ?? ShareWords.newNote)
                            }
                            .accessibilityIdentifier("share.addTo")
                        }
                        if !model.folders.isEmpty && model.note == nil {
                            Picker("Folder", selection: $model.folder) {
                                ForEach(model.folders) { f in
                                    Text(f.name).tag(UUID?.some(f.id))
                                }
                            }
                            .accessibilityIdentifier("share.folder")
                        }
                    } footer: {
                        if model.saved {
                            Text(model.doneLine).accessibilityIdentifier("share.done")
                        } else if model.note != nil {
                            Text(InboxCopy.addToFooter).accessibilityIdentifier("share.addTo.footer")
                        } else if model.asFiles {
                            Text(model.files.count == 1 ? "Kept in the folder as a file." : "Kept in the folder as files.")
                        }
                    }
                }
                if let e = model.error {
                    Text(e).font(.footnote).foregroundStyle(.red).accessibilityIdentifier("share.error")
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: model.cancel)
                }
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 7) {
                        AppMark(size: 20)
                        Text("Pinto Notes").font(.headline)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.isHeader)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: model.save) {
                        if model.saved {
                            Text(ShareWords.saved)
                        } else {
                            Text(model.note == nil ? ShareWords.save : ShareWords.add)
                        }
                    }
                    .fontWeight(.semibold)
                    .disabled(!model.saved && (model.loading || (model.markdown.isEmpty && model.files.isEmpty)))
                    .accessibilityIdentifier("share.save")
                }
            }
        }
        .tint(Color("AccentColor"))
        .animation(.snappy(duration: 0.2), value: model.saved)
        .animation(.snappy(duration: 0.2), value: model.note)
    }

    /// What you're saving: its title and first lines as you'd read them, or its files.
    private var preview: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(model.title).font(.headline).lineLimit(2)
            if !model.markdown.isEmpty {
                let body = ReadableText.from(markdown: model.markdown)
                    .split(separator: "\n", omittingEmptySubsequences: true).dropFirst().prefix(4).joined(separator: "\n")
                if !body.isEmpty {
                    Text(body).font(.subheadline).foregroundStyle(.secondary).lineLimit(4)
                }
            }
            if !model.files.isEmpty {
                Label(model.files.count == 1 ? model.files[0].lastPathComponent : "\(model.files.count) files", systemImage: "paperclip")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

/// The share sheet's words. In Inbox.swift (InboxCopy), which the app's tests can read.
typealias ShareWords = InboxCopy

/// Add to, a page of its own: New note, then your newest notes, and a search over the rest by
/// title. Picking one goes back to the sheet.
struct AddToPicker: View {
    @Bindable var model: ShareModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            if model.query.trimmingCharacters(in: .whitespaces).isEmpty {
                Button { pick(nil) } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "square.and.pencil")
                            .frame(width: 22)
                            .foregroundStyle(Color("AccentColor"))
                        Text(ShareWords.newNote).foregroundStyle(.primary)
                        Spacer(minLength: 8)
                        tick(model.note == nil)
                    }
                    .contentShape(Rectangle())
                }
                .tint(.primary)
                .accessibilityIdentifier("share.note.new")
                .accessibilityAddTraits(model.note == nil ? .isSelected : [])
            }
            Section(model.query.isEmpty ? "Recent" : "") {
                ForEach(model.offered) { n in
                    Button { pick(n.id) } label: { NoteChoiceRow(note: n, picked: model.note == n.id) }
                        // A list's buttons take the accent colour, every line of them; these read as notes.
                        .tint(.primary)
                        .accessibilityIdentifier("share.note.\(n.title)")
                        .accessibilityAddTraits(model.note == n.id ? .isSelected : [])
                }
                if model.offered.isEmpty {
                    Text(ShareWords.noMatch(model.query)).foregroundStyle(.secondary)
                }
            }
        }
        .searchable(text: $model.query, placement: .navigationBarDrawer(displayMode: .always), prompt: ShareWords.search)
        .navigationTitle(ShareWords.addTo)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func pick(_ id: UUID?) {
        model.note = id
        dismiss()
    }

    @ViewBuilder
    private func tick(_ on: Bool) -> some View {
        if on { Image(systemName: "checkmark").fontWeight(.semibold).foregroundStyle(Color("AccentColor")) }
    }
}

/// A note to pick, as the notes list shows it (Emil, 4 November 2026: every title in the accent
/// colour "is a really bad choice", and titles alone said too little): the title in ink, then when
/// it was changed and its first line, then its folder. A tick on the picked one.
struct NoteChoiceRow: View {
    let note: ChecklistShelf.Recent
    let picked: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                Text(note.title.isEmpty ? ShareWords.newNote : note.title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(Self.when(note.updatedAt))
                    if let s = note.snippet { Text(s).lineLimit(1) }
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
                if let f = note.folder {
                    Label(f, systemImage: "folder")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .labelStyle(.titleAndIcon)
                }
            }
            Spacer(minLength: 8)
            if picked {
                Image(systemName: "checkmark").fontWeight(.semibold).foregroundStyle(Color("AccentColor"))
            }
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }

    /// As the notes list says it: the time today, Yesterday, else the date.
    static func when(_ d: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        if calendar.isDate(d, inSameDayAs: now) { return d.formatted(date: .omitted, time: .shortened) }
        if let y = calendar.date(byAdding: .day, value: -1, to: now), calendar.isDate(d, inSameDayAs: y) { return "Yesterday" }
        return d.formatted(.dateTime.day().month(.abbreviated))
    }
}
