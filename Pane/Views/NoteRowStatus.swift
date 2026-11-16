import SwiftUI

/// What a note's row shows in the room before its title, as Apple Notes does: a lock on a locked
/// note (drawn open while locked notes are open, as Notes draws it), the dot of an AI change you
/// haven't seen yet, and a pin where no Pinned heading says so already. A shared note's mark sits
/// after the title instead (`NoteRowSharedMark`): in the room before it, it was too tight (Emil,
/// 16 November 2026).
///
/// One at a time, in that order. A locked note's text, and so any AI change to it, is out of
/// sight, so its lock always shows. The dot is for now: it goes once the note is opened, and the
/// pin comes back. A note in Recently Deleted isn't pinned there.
enum NoteRowStatus: Hashable {
    case locked(open: Bool)
    case aiUnseen
    case pinned

    /// - unlocked: locked notes are open on this device (NoteVault.isUnlocked).
    /// - pinnedHeading: the row sits under the list's Pinned heading, which already says it.
    static func of(locked: Bool, unlocked: Bool, aiUnseen: Bool, pinned: Bool, trashed: Bool, pinnedHeading: Bool) -> NoteRowStatus? {
        if locked { return .locked(open: unlocked) }
        if aiUnseen { return .aiUnseen }
        guard !trashed else { return nil }
        if pinned, !pinnedHeading { return .pinned }
        return nil
    }

    /// The note's own. Only a locked note asks the vault, so the other rows aren't drawn again
    /// whenever locked notes are opened or locked.
    @MainActor static func of(_ note: Note, aiUnseen: Bool, pinnedHeading: Bool) -> NoteRowStatus? {
        let locked = note.isLocked
        return of(locked: locked, unlocked: locked && NoteVault.shared.isUnlocked, aiUnseen: aiUnseen,
                  pinned: note.isPinned, trashed: note.trashedAt != nil, pinnedHeading: pinnedHeading)
    }

    /// Whether the row shows the shared mark after its title: shared with people, and not in
    /// Recently Deleted. A locked note keeps its lock before the title and shows this too.
    @MainActor static func showsShared(_ note: Note) -> Bool { note.isShared && note.trashedAt == nil }

    /// Its SF Symbol, or nil for the dot.
    var symbol: String? {
        switch self {
        case .locked(let open): open ? "lock.open.fill" : "lock.fill"
        case .aiUnseen: nil
        case .pinned: "pin.fill"
        }
    }

    /// The shared mark's: Apple's for a shared item (Notes' own), the pair of the Collaborate…
    /// button's `person.crop.circle.badge.plus`.
    static let sharedSymbol = "person.crop.circle.badge.checkmark"

    /// For tests and captures.
    var name: String {
        switch self {
        case .locked(let open): open ? "unlocked" : "locked"
        case .aiUnseen: "aiUnseen"
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
/// VoiceOver hears the row's value ("Locked", "Pinned").
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
                // One weight for every mark (DESIGN.md, Icons): medium.
                Image(systemName: symbol)
                    .font(.system(size: size, weight: .medium))
                    .foregroundStyle(Color.muted)
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

/// A shared note's mark, after its title on the title's line, in the marks' colour and weight and
/// the lock's size. The title gives way to it: a long title is cut, the mark stays. Only for the
/// eye: VoiceOver hears "Shared" in the row's value. Privacy mode blurs the title, not this.
struct NoteRowSharedMark: View {
    #if os(iOS)
    /// With the title's text size: after the title there's room for it to grow.
    @ScaledMetric(relativeTo: .headline) private var size: CGFloat = RowMetrics.statusSize
    #else
    private var size: CGFloat { RowMetrics.statusSize }
    #endif

    var body: some View {
        Image(systemName: NoteRowStatus.sharedSymbol)
            .font(.system(size: size, weight: .medium))
            .foregroundStyle(Color.muted)
            .fixedSize()
            .layoutPriority(1)
            .accessibilityHidden(true)
            .accessibilityIdentifier("note.sharedMark")
    }
}
