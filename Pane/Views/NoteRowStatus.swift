import SwiftUI

/// What a note's row shows in the room before its title, as Apple Notes does: a lock on a locked
/// note (drawn open while locked notes are open, as Notes draws it), the dot of an AI change you
/// haven't seen yet, a shared note's mark, and a pin where no Pinned heading says so already.
///
/// One at a time, in that order. A locked note's text, and so any AI change to it, is out of
/// sight, so its lock always shows. The dot is for now: it goes once the note is opened, and the
/// shared mark or pin comes back. A note in Recently Deleted is neither shared nor pinned there.
enum NoteRowStatus: Hashable {
    case locked(open: Bool)
    case aiUnseen
    case shared
    case pinned

    /// - unlocked: locked notes are open on this device (NoteVault.isUnlocked).
    /// - pinnedHeading: the row sits under the list's Pinned heading, which already says it.
    static func of(locked: Bool, unlocked: Bool, aiUnseen: Bool, shared: Bool, pinned: Bool, trashed: Bool, pinnedHeading: Bool) -> NoteRowStatus? {
        if locked { return .locked(open: unlocked) }
        if aiUnseen { return .aiUnseen }
        guard !trashed else { return nil }
        if shared { return .shared }
        if pinned, !pinnedHeading { return .pinned }
        return nil
    }

    /// The note's own. Only a locked note asks the vault, so the other rows aren't drawn again
    /// whenever locked notes are opened or locked.
    @MainActor static func of(_ note: Note, aiUnseen: Bool, pinnedHeading: Bool) -> NoteRowStatus? {
        let locked = note.isLocked
        return of(locked: locked, unlocked: locked && NoteVault.shared.isUnlocked, aiUnseen: aiUnseen, shared: note.isShared,
                  pinned: note.isPinned, trashed: note.trashedAt != nil, pinnedHeading: pinnedHeading)
    }

    /// Its SF Symbol, or nil for the dot. Shared is Apple's mark for a shared item (Notes' own),
    /// the pair of the Collaborate… button's `person.crop.circle.badge.plus`.
    var symbol: String? {
        switch self {
        case .locked(let open): open ? "lock.open.fill" : "lock.fill"
        case .aiUnseen: nil
        case .shared: "person.crop.circle.badge.checkmark"
        case .pinned: "pin.fill"
        }
    }

    /// Its size against the lock's. Shared is a wider, busier glyph: a size under the others, it
    /// looks as big as they do and keeps clear of the title and the card's edge.
    var relativeSize: CGFloat { self == .shared ? 0.9 : 1 }
    /// How far right of its place it's drawn, against its size, so its ink sits in the room's
    /// middle: the shared mark's check hangs off its left.
    var nudge: CGFloat { self == .shared ? 0.1 : 0 }

    /// For tests and captures.
    var name: String {
        switch self {
        case .locked(let open): open ? "unlocked" : "locked"
        case .aiUnseen: "aiUnseen"
        case .shared: "shared"
        case .pinned: "pinned"
        }
    }
}

extension RowMetrics {
    #if os(macOS)
    /// The status mark's centre, from the title's start: the middle of the 16 pt before it on the
    /// selected card, where the AI dot has always been.
    static let statusCenter: CGFloat = -8
    /// The lock's size: about the title's cap height, as the lock in Apple Notes' list.
    static let statusSize: CGFloat = 10
    #else
    /// The middle of the 20 pt before the title inside the row's card.
    static let statusCenter: CGFloat = -10
    static let statusSize: CGFloat = 13
    /// How far the mark grows with the text size: as far as the room before the title holds,
    /// a point clear either side (NoteRowStatusTests).
    static let statusMaxScale: CGFloat = 1.1
    #endif
    /// The room the mark is drawn in, centred on `statusCenter`.
    static let statusWidth: CGFloat = 16
    /// The AI dot's size.
    static let dotSize: CGFloat = 8
}

/// A row's status, centred in the room before the title (`RowMetrics.statusCenter`), on the
/// title's line: put it in an overlay of that line, aligned to its leading edge. Only for the eye:
/// VoiceOver hears the row's value ("Locked", "Shared", "Pinned").
struct NoteRowStatusMark: View {
    let status: NoteRowStatus
    #if os(iOS)
    /// With the title's text size, up to `RowMetrics.statusMaxScale`.
    @ScaledMetric(relativeTo: .headline) private var textScale: CGFloat = 1
    private var size: CGFloat { RowMetrics.statusSize * min(textScale, RowMetrics.statusMaxScale) }
    #else
    private var size: CGFloat { RowMetrics.statusSize }
    #endif

    var body: some View {
        Group {
            if let symbol = status.symbol {
                // One weight for every mark (DESIGN.md, Icons): medium, which keeps the shared
                // mark's small check clear at this size.
                Image(systemName: symbol)
                    .font(.system(size: size * status.relativeSize, weight: .medium))
                    .foregroundStyle(Color.muted)
                    .offset(x: size * status.relativeSize * status.nudge)
            } else {
                // An AI changed this note and you haven't opened it since, like Mail's unread dot.
                Circle().fill(Color(PColor.paneAccent)).frame(width: RowMetrics.dotSize, height: RowMetrics.dotSize)
            }
        }
        .frame(width: RowMetrics.statusWidth)
        .offset(x: RowMetrics.statusCenter - RowMetrics.statusWidth / 2)
        .accessibilityHidden(true)
    }
}
