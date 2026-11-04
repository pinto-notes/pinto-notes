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
    /// The widget's kind (PaneWidgets/ChecklistWidget.swift), to redraw it when its lists change.
    static let checklistWidgetKind = "ChecklistWidget"

    /// Applies the ticks made on the Home Screen, then leaves the lists and recent notes as they
    /// now are. Returns the notes a tick changed.
    @discardableResult
    func syncChecklistShelf() -> [Note] {
        let changed = applyChecklistTicks()
        publishChecklistShelf()
        return changed
    }

    /// Writes each waiting tick into its note, as a tick in the editor would: ticked items sink
    /// below the open ones. A tick for a note that's gone, locked or deleted is dropped.
    @discardableResult
    func applyChecklistTicks() -> [Note] {
        let ticks = ChecklistShelf.ticks()
        guard !ticks.isEmpty else { return [] }
        var changed: [Note] = []
        for t in ticks {
            guard let n = note(t.note), n.deletedAt == nil, n.trashedAt == nil, !n.isLocked,
                  let body = Checklist.setting(t.done, index: t.index, text: t.text, in: n.body), body != n.body else { continue }
            n.body = body
            n.touch()
            if !changed.contains(where: { $0.id == n.id }) { changed.append(n) }
        }
        if !changed.isEmpty { try? save() }
        ChecklistShelf.clearTicks(ticks)
        return changed
    }

    /// Leaves the checklist notes (newest first, pinned ones marked) and the recent notes' titles.
    /// Locked, deleted and trashed notes never go there. Redraws the widget when its lists changed.
    func publishChecklistShelf() {
        guard ChecklistShelf.root != nil else { return }
        // "] " finds every note with a checklist item, ticked or not (and a few others, which
        // ChecklistShelf.list leaves out): one cheap test in the store, not a read of every note.
        let live = #Predicate<Note> { $0.deletedAt == nil && $0.trashedAt == nil && $0.lockedBody == nil }
        let checklist = #Predicate<Note> { $0.body.contains("] ") }
        var lists = FetchDescriptor<Note>(predicate: #Predicate { live.evaluate($0) && checklist.evaluate($0) },
                                          sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        lists.fetchLimit = ChecklistShelf.listLimit
        let shelf = ((try? fetch(lists)) ?? []).compactMap {
            ChecklistShelf.list(id: $0.id, title: $0.title, body: $0.body, updatedAt: $0.updatedAt, pinned: $0.isPinned)
        }
        var recent = FetchDescriptor<Note>(predicate: live, sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        recent.fetchLimit = ChecklistShelf.recentLimit
        ChecklistShelf.saveRecents(((try? fetch(recent)) ?? []).map { ChecklistShelf.Recent(id: $0.id, title: $0.title, updatedAt: $0.updatedAt) })
        if ChecklistShelf.saveLists(shelf) {
            #if canImport(WidgetKit) && os(iOS)
            WidgetCenter.shared.reloadTimelines(ofKind: Self.checklistWidgetKind)
            #endif
        }
    }
}
