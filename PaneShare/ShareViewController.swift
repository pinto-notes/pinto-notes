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
        let providers = (context?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
        // The same conversion as the Mac's Apple Notes import (see SharedItem).
        let content = await SharedItem.read(providers, filesInto: FileManager.default.temporaryDirectory)
        markdown = content.markdown
        files = content.files
        loading = false
    }

    func save() {
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

struct ShareSheet: View {
    @Bindable var model: ShareModel

    var body: some View {
        // Laid out like the system's own share sheets: the bar on top, the item below, filling the sheet.
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Button("Cancel", action: model.cancel)
                Spacer()
                HStack(spacing: 7) {
                    AppMark(size: 22)
                    Text("Pinto Notes").font(.headline)
                }
                .accessibilityElement(children: .combine)
                Spacer()
                Button(action: model.save) {
                    if model.saved {
                        Label(ShareWords.saved, systemImage: "checkmark").labelStyle(.titleAndIcon)
                    } else {
                        Text(model.note == nil ? ShareWords.save : ShareWords.add).fontWeight(.semibold)
                    }
                }
                .disabled(model.loading || model.saved || (model.markdown.isEmpty && model.files.isEmpty))
                .accessibilityIdentifier("share.save")
            }
            .frame(minHeight: 44)
            // The item, Add to and the folder scroll under the bar (the search field's keyboard
            // can cover the foot of the sheet).
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Group {
                        if model.loading {
                            ProgressView().frame(maxWidth: .infinity, minHeight: 80)
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(model.title).font(.title3.weight(.semibold)).lineLimit(2)
                                if !model.markdown.isEmpty {
                                    Text(model.markdown.split(separator: "\n").dropFirst().prefix(4).joined(separator: "\n"))
                                        .font(.callout).foregroundStyle(.secondary).lineLimit(4)
                                }
                                if !model.files.isEmpty {
                                    Label(model.files.count == 1 ? model.files[0].lastPathComponent : "\(model.files.count) files", systemImage: "paperclip")
                                        .font(.callout).foregroundStyle(.secondary)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .background(.background, in: .rect(cornerRadius: 14, style: .continuous))
                        }
                    }
                    if !model.loading && !model.recents.isEmpty {
                        AddToPicker(model: model)
                    }
                    if !model.loading && !model.folders.isEmpty && model.note == nil {
                        // Where it goes, as a row under the item, like Notes' own share sheet.
                        HStack {
                            Text("Folder")
                            Spacer()
                            Picker("Folder", selection: $model.folder) {
                                ForEach(model.folders) { f in
                                    Text(f.name).tag(UUID?.some(f.id))
                                }
                            }
                            .labelsHidden()
                            .accessibilityIdentifier("share.folder")
                        }
                        .padding(.leading, 14)
                        .padding(.vertical, 4)
                        .background(.background, in: .rect(cornerRadius: 14, style: .continuous))
                        if model.asFiles {
                            Text(model.files.count == 1 ? "Kept in the folder as a file." : "Kept in the folder as files.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 14)
                        }
                    }
                    if model.saved {
                        // Every save says where it went.
                        Text(model.doneLine)
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 14)
                            .accessibilityIdentifier("share.done")
                    }
                    if let e = model.error {
                        Text(e).font(.footnote).foregroundStyle(.red).accessibilityIdentifier("share.error")
                    }
                }
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .padding(.horizontal, 20)
        .padding(.top, 14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Color(uiColor: .systemGroupedBackground))
        .tint(Color("AccentColor"))
        .animation(.snappy(duration: 0.2), value: model.saved)
        .animation(.snappy(duration: 0.2), value: model.note)
    }
}

/// The share sheet's words. In Inbox.swift (InboxCopy), which the app's tests can read.
typealias ShareWords = InboxCopy

/// Add to: a new note (as before), or the end of a note you have, one of the five newest or one
/// found by its title. Rows of 44 pt, a tick on the picked one, as Settings' choices are drawn.
struct AddToPicker: View {
    @Bindable var model: ShareModel

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ShareWords.addTo)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .padding(.leading, 14)
            VStack(spacing: 0) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                    TextField(ShareWords.search, text: $model.query)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("share.search")
                }
                .frame(minHeight: 44)
                .padding(.horizontal, 14)
                Divider().padding(.leading, 14)
                if model.query.trimmingCharacters(in: .whitespaces).isEmpty {
                    row(ShareWords.newNote, systemImage: "square.and.pencil", picked: model.note == nil, id: "share.note.new") { model.note = nil }
                }
                ForEach(model.offered) { n in
                    Divider().padding(.leading, 46)
                    row(n.title.isEmpty ? ShareWords.newNote : n.title, systemImage: "doc.text", picked: model.note == n.id, id: "share.note.\(n.title)") {
                        model.note = n.id
                    }
                }
                if model.offered.isEmpty {
                    Text(ShareWords.noMatch(model.query))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .padding(.horizontal, 14)
                }
            }
            .background(.background, in: .rect(cornerRadius: 14, style: .continuous))
            // Before Save: when it goes in, and what happens if the note can't take it.
            if model.note != nil {
                Text(InboxCopy.addToFooter)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 14)
                    .accessibilityIdentifier("share.addTo.footer")
            }
        }
    }

    private func row(_ title: String, systemImage: String, picked: Bool, id: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .frame(width: 20)
                    .foregroundStyle(Color("AccentColor"))
                Text(title).foregroundStyle(.primary).lineLimit(1)
                Spacer(minLength: 8)
                if picked {
                    Image(systemName: "checkmark").fontWeight(.semibold).foregroundStyle(Color("AccentColor"))
                }
            }
            .frame(minHeight: 44)
            .padding(.horizontal, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        // A pointer on iPad lights the row it's over.
        .hoverEffect(.highlight)
        .accessibilityIdentifier(id)
        .accessibilityAddTraits(picked ? .isSelected : [])
    }
}
