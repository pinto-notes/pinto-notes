import SwiftUI

/// How the Mac's notes window lays out its columns: an experiment with four options to live with
/// (Emil, 13 November 2026: the folders and the list take too much room for text notes too; "try
/// different ideas and see which ones win"). Settings › Experimental, on this device. Today's
/// layout until another is picked; a canvas folds the columns away in every option (CanvasFocus).
enum ColumnsLayout: String, CaseIterable, Identifiable {
    /// As before: folders, list and note, and the sidebar button's three steps.
    case today
    /// The same, with narrower folders and list.
    case narrow
    /// Typing in a text note folds both columns away; Esc or the sidebar button brings them back.
    case writingFocus
    /// No folders column: the list's title is a menu of the folders.
    case twoColumns

    var id: String { rawValue }

    /// Its UserDefaults key (also a `-experiment.layout narrow` launch argument for tests).
    static let key = "experiment.layout"

    /// The option picked on this device.
    static func current(_ defaults: UserDefaults = .standard) -> ColumnsLayout {
        defaults.string(forKey: key).flatMap(ColumnsLayout.init(rawValue:)) ?? .today
    }

    var title: String {
        switch self {
        case .today: "Today"
        case .narrow: "Narrow columns"
        case .writingFocus: "Writing focus"
        case .twoColumns: "Two columns"
        }
    }

    var detail: String {
        switch self {
        case .today: "Folders, notes and the note, as now."
        case .narrow: "The same three columns, narrower."
        case .writingFocus: "Typing in a note folds the folders and the list away. Press Esc to bring them back."
        case .twoColumns: "No folders column. The list's title is a menu that switches folders."
        }
    }

    /// The folders column: least, ideal and most width.
    var folderWidths: (min: CGFloat, ideal: CGFloat, max: CGFloat) {
        self == .narrow ? (200, 220, 320) : (240, 260, 360)
    }

    /// The list column: least, ideal and most width. Today's least is what the bar's buttons need
    /// beside the window's own with the sidebar hidden; narrower, the bar is tighter.
    var listWidths: (min: CGFloat, ideal: CGFloat, max: CGFloat) {
        self == .narrow ? (260, 280, 400) : (330, 330, 440)
    }

    /// The columns a window opens with.
    var opening: NavigationSplitViewVisibility { self == .twoColumns ? .doubleColumn : .all }

    #if os(macOS)
    /// The sidebar button's next step: Two columns has no folders column to show.
    func next(_ v: NavigationSplitViewVisibility) -> NavigationSplitViewVisibility {
        guard self == .twoColumns else { return SidebarToggle.next(v) }
        return v == .detailOnly ? .doubleColumn : .detailOnly
    }
    #endif
}

/// Writing focus (ColumnsLayout.writingFocus): the first keystroke in a text note folds the folders
/// and the list away, so the note has the window; reading and scrolling leave them. Esc, or the
/// sidebar button, brings them back, and they stay back for that note: typing on in it doesn't fold
/// them again until another note is opened (or you fold them yourself).
struct WritingFocus: Equatable {
    /// The columns to put back, while typing has folded them away.
    private(set) var before: NavigationSplitViewVisibility?
    /// The note whose typing folded the columns; it doesn't fold them twice.
    private(set) var spent: UUID?

    var isFocused: Bool { before != nil }

    /// A keystroke in `note`: the columns to show now, or nil to leave them.
    mutating func typed(in note: UUID?, visibility v: NavigationSplitViewVisibility) -> NavigationSplitViewVisibility? {
        guard let note, before == nil, spent != note, v != .detailOnly else { return nil }
        before = v
        spent = note
        return .detailOnly
    }

    /// Esc: the columns as they were, or nil when typing hadn't folded them.
    mutating func escape() -> NavigationSplitViewVisibility? {
        guard let b = before else { return nil }
        before = nil
        return b
    }

    /// Another note opened: its first keystroke may fold the columns again.
    mutating func opened(_ id: UUID?) { if id != spent { spent = nil } }

    /// You changed the columns yourself: nothing is put back later.
    mutating func userChanged() { before = nil }
}
