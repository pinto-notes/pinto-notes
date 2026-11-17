import Foundation
import SwiftData
#if canImport(WidgetKit) && os(iOS)
import WidgetKit
#endif

/// The app's side of ChecklistShelf: it leaves its checklists and recent notes for the widget and
/// the share sheet, and writes the widget's ticks into their notes. Runs as the app becomes active
/// and as it leaves (PaneApp), so the Home Screen shows the lists as they were last seen here.
@MainActor
extension ModelContext {
    /// What the widget and the share sheet left: into their notes. Again once sharing is ready and
    /// as each shared note's document opens, so a capture for a shared note doesn't wait for the
    /// next time the app comes forward.
    func applyCaptures(library: SharedLibrary? = CollabStore.shared?.library) {
        if !Inbox.pending().isEmpty { drainInbox(library: library) }
        if !ChecklistShelf.ticks().isEmpty, !applyChecklistTicks(library: library).isEmpty { publishChecklistShelf() }
    }

    /// The widget's kind (PaneWidgets/ChecklistWidget.swift), to redraw it when its lists change.
    static let checklistWidgetKind = ChecklistWidgetContent.kind

    /// Applies the ticks made on the Home Screen, then leaves the lists and recent notes as they
    /// now are. Returns the notes a tick changed.
    @discardableResult
    func syncChecklistShelf(library: SharedLibrary? = CollabStore.shared?.library) -> [Note] {
        let changed = applyChecklistTicks(library: library)
        publishChecklistShelf()
        return changed
    }

    /// Writes each waiting tick into its note, as a tick in the editor would: ticked items sink
    /// below the open ones. A tick for a note that's gone, locked or deleted is dropped.
    @discardableResult
    func applyChecklistTicks(library: SharedLibrary? = CollabStore.shared?.library, notices: NoteNotices = .shared) -> [Note] {
        let ticks = ChecklistShelf.ticks()
        guard !ticks.isEmpty else { return [] }
        var changed: [Note] = []
        // Ticks for a shared note whose document isn't open yet wait for it, so none is lost.
        var waiting: Set<UUID> = []
        for t in ticks {
            guard let n = note(t.note), n.deletedAt == nil, n.trashedAt == nil, !n.isLocked else { continue }
            // A shared note's tick goes into its document (NoteWrites). Can view can't take it: the
            // note, which the tick opened, says so.
            let outcome = NoteWrites.change(n, library: library) { Checklist.setting(t.done, index: t.index, text: t.text, in: $0) ?? $0 }
            if outcome == .notReady { waiting.insert(t.id) }
            if outcome == .viewOnly { notices.post(NoteWrites.viewOnlyMessage, for: n.id) }
            if outcome == .changed, !changed.contains(where: { $0.id == n.id }) { changed.append(n) }
        }
        if !changed.isEmpty { try? save() }
        ChecklistShelf.clearTicks(ticks.filter { !waiting.contains($0.id) })
        return changed
    }

    /// Leaves the checklist notes (newest first, pinned ones marked) and the recent notes' titles.
    /// Locked, deleted and trashed notes never go there. Redraws the widget when its lists changed.
    func publishChecklistShelf() {
        guard ChecklistShelf.root != nil else { return }
        var lists = FetchDescriptor<Note>(predicate: ShelfNotes.withChecklist(), sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        lists.fetchLimit = ChecklistShelf.listLimit
        let found: [Note] = (try? fetch(lists)) ?? []
        let shelf = found.compactMap {
            ChecklistShelf.list(id: $0.id, title: $0.title, body: $0.body, updatedAt: $0.updatedAt, pinned: $0.isPinned)
        }
        var recent = FetchDescriptor<Note>(predicate: ShelfNotes.unlocked(), sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        recent.fetchLimit = ChecklistShelf.recentLimit
        let recents: [Note] = (try? fetch(recent)) ?? []
        ChecklistShelf.saveRecents(recents.map { ChecklistShelf.Recent(id: $0.id, title: $0.title, updatedAt: $0.updatedAt, folder: $0.folder?.name, snippet: ChecklistShelf.snippet(body: $0.body)) })
        // Previews for the widget's other notes: the newest, and any a widget asked for.
        let wanted = Set(ChecklistShelf.wanted())
        var shown = Array(recents.prefix(ChecklistShelf.previewLimit))
        shown += recents.dropFirst(ChecklistShelf.previewLimit).filter { wanted.contains($0.id) }
        let previews = shown.map {
            ChecklistShelf.preview(id: $0.id, title: $0.title, readable: ReadableText.from(markdown: $0.body), updatedAt: $0.updatedAt)
        }
        let previewsChanged = ChecklistShelf.savePreviews(previews)
        if ChecklistShelf.saveLists(shelf) || previewsChanged {
            #if canImport(WidgetKit) && os(iOS)
            WidgetCenter.shared.reloadTimelines(ofKind: Self.checklistWidgetKind)
            #endif
            // Siri's "Add to Groceries in Pinto Notes" knows the notes by these names.
            AmberShortcuts.updateAppShortcutParameters()
        }
    }
}

/// The notes the widget, the share sheet and the intents may show: not deleted, not in the
/// trash, not locked.
enum ShelfNotes {
    static func unlocked() -> Predicate<Note> {
        #Predicate<Note> { (n: Note) -> Bool in n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil }
    }

    /// The same, with a checklist item: "] " finds every one, ticked or not (and a few other
    /// notes, which ChecklistShelf.list leaves out). One cheap test in the store, not a read of
    /// every note.
    static func withChecklist() -> Predicate<Note> {
        #Predicate<Note> { (n: Note) -> Bool in
            n.deletedAt == nil && n.trashedAt == nil && n.lockedBody == nil && n.body.contains("] ")
        }
    }
}

extension ChecklistShelf {
    /// A note's first line after its title, as you'd read it (no markdown), at most 80 characters.
    static func snippet(body: String) -> String? {
        let lines = ReadableText.from(markdown: String(body.prefix(2000)))
            .split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard let line = lines.dropFirst().first else { return nil }
        return String(line.prefix(80))
    }
}
