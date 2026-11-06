import SwiftUI

/// Collaboration (prototype): who's in the note, as the note's toolbar and header show it.

/// What an avatar in the toolbar can carry (the options being compared, see `BadgeOption`).
enum AvatarBadge: Equatable { case none, pencil, dot }

/// A, B or C: when the toolbar's avatars carry a badge.
enum BadgeOption: String, CaseIterable, Identifiable {
    /// A pencil only while that person types; it fades a moment after they stop.
    case a = "A"
    /// A pencil the whole time someone who can edit is in the note.
    case b = "B"
    /// A live dot while they're here, the pencil instead while they type.
    case c = "C"
    /// No badge. The Mac's toolbar: at its size the pencil was about 6 pixels on a 1x screen and
    /// read as a smudge, and the caret in the note already shows who is editing.
    case off = "off"
    var id: String { rawValue }

    func badge(typing: Bool, canEdit: Bool) -> AvatarBadge {
        switch self {
        case .a: typing ? .pencil : .none
        case .b: canEdit ? .pencil : .none
        case .c: typing ? .pencil : .dot
        case .off: .none
        }
    }

    /// The option in use (`-badgeOption A|B|C` while choosing; B, the recommendation, otherwise).
    static var current: BadgeOption {
        Capture.argument("-badgeOption").flatMap { BadgeOption(rawValue: $0.uppercased()) } ?? .b
    }
}

/// One person: a solid circle with their photo, or their initials on their colour, inside an
/// opaque ring in the toolbar's own colour, so overlapping avatars read as separate. A badge, when
/// there is one, is solid with the same ring, and sits inside the avatar's own bounds at the lower
/// right, so nothing clips it.
struct PersonAvatar: View {
    let name: String
    let color: Color
    var size: CGFloat = 28
    var photo: PImage? = nil
    var ring: Color = .avatarRing
    /// The initials' colour: white on the people colours; the warm ink on your own amber.
    var ink: Color = .white
    var badge: AvatarBadge = .none
    /// Not heard from for a while (their connection or yours is down): drawn in greys, still solid.
    var stale = false
    /// Keeps room for a badge whether or not one shows, so a stack never shifts when it appears.
    var roomForBadge = false
    /// Draws only the badge, in the same place (the stack puts every badge on its own top layer).
    var badgeOnly = false
    var pencilStyle: PencilStyle = .current
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// The ring's width: 2 pt at toolbar size, a clean cut between overlapping avatars.
    static func ringWidth(_ size: CGFloat) -> CGFloat { max(2, (size / 14).rounded()) }

    /// Where a badge goes: on the lower-right edge of its own circle along the 45° diagonal, its
    /// centre on the circle's edge so about half of it sits over the circle.
    struct Geometry {
        let outer: CGFloat, badge: CGFloat, center: CGPoint, frame: CGSize
        /// The badge's right edge: the next avatar in a stack starts here.
        var badgeRight: CGFloat { center.x + badge / 2 }
    }

    static func geometry(_ size: CGFloat) -> Geometry {
        let ring = ringWidth(size)
        let outer = size + ring * 2
        let badge = size * 0.36 + ring * 0.75 * 2
        let r = outer / 2, d = r, angle = 45.0 * .pi / 180
        let center = CGPoint(x: r + d * cos(angle), y: r + d * sin(angle))
        return Geometry(outer: outer, badge: badge, center: center,
                        frame: CGSize(width: max(outer, center.x + badge / 2), height: max(outer, center.y + badge / 2)))
    }

    var body: some View {
        let g = Self.geometry(size)
        let room = roomForBadge || badge != .none
        ZStack(alignment: .topLeading) {
            if !badgeOnly { circle }
            if badgeOnly || !roomForBadge { badgeView.position(g.center) }
        }
        .frame(width: room ? g.frame.width : g.outer, height: room ? g.frame.height : g.outer, alignment: .topLeading)
        .grayscale(stale ? 1 : 0)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.35), value: badge)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.35), value: stale)
        .accessibilityHidden(true)
    }

    private var circle: some View {
        Group {
            if let photo {
                Image(platform: photo).resizable().scaledToFill()
            } else {
                Text(AvatarView.initials(name))
                    .font(.system(size: size * 0.4, weight: .semibold))
                    .foregroundStyle(ink)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(color)
            }
        }
        .frame(width: size, height: size)
        .clipShape(.circle)
        .padding(Self.ringWidth(size))
        .background(ring, in: .circle)
    }

    @ViewBuilder
    private var badgeView: some View {
        let inner = size * 0.36
        switch badge {
        case .none:
            EmptyView()
        case .pencil:
            // A heavy glyph, about 60% of the badge, so it reads at real size. Sized by font, not
            // by resizing: a resized symbol ignores the weight and draws thin.
            Image(systemName: "pencil")
                .font(.system(size: inner * 0.66, weight: .heavy))
                .frame(width: inner * 0.6, height: inner * 0.6)
                .foregroundStyle(pencilStyle == .colour ? Color.white : color)
                .frame(width: inner, height: inner)
                .background(pencilStyle == .colour ? color : Color.white, in: .circle)
                .padding(Self.ringWidth(size) * 0.75)
                .background(ring, in: .circle)
                .transition(.opacity)
        case .dot:
            Circle().fill(Color.avatarLive)
                .frame(width: inner * 0.8, height: inner * 0.8)
                .padding(Self.ringWidth(size) * 0.75)
                .background(ring, in: .circle)
                .transition(.opacity)
        }
    }
}

/// The pencil badge's look: the person's colour with a white pencil, or white with the pencil in
/// their colour (`-pencilStyle white` while choosing).
enum PencilStyle: String, CaseIterable {
    case colour, white
    static var current: PencilStyle { Capture.argument("-pencilStyle").flatMap(PencilStyle.init(rawValue:)) ?? .colour }
}

/// Everyone else in the note, gently overlapping, at most three and then "+n".
struct PresenceAvatars: View {
    struct Person: Identifiable, Equatable {
        let id: UUID
        let name: String
        var photo: PImage? = nil
        var typing = false
        var canEdit = true
        /// Not heard from for a while (CollabSession.Peer.isStale).
        var stale = false
    }
    let people: [Person]
    var size: CGFloat = 28
    var option: BadgeOption = .current
    var pencilStyle: PencilStyle = .current
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        row(badges: false)
            // Every badge on a layer of its own above all the circles, so the next avatar never covers one.
            .overlay(alignment: .leading) { row(badges: true) }
        // One move per change: someone arriving or leaving fades, nothing scales or bounces.
        .animation(reduceMotion ? nil : .easeOut(duration: 0.25), value: people.map(\.id))
        // Flattened into one opaque picture before the toolbar's glass gets it. Without this the
        // glass blends each circle with what's behind it, the previous avatar included, so the
        // white cut between them showed a tint of the avatar underneath (seen zoomed at 3x;
        // compositingGroup wasn't enough).
        .drawingGroup()
    }

    private func row(badges: Bool) -> some View {
        let g = PersonAvatar.geometry(size)
        let shown = Array(people.prefix(3))
        return HStack(spacing: 0) {
            ForEach(Array(shown.enumerated()), id: \.element.id) { i, p in
                let badge = option.badge(typing: p.typing, canEdit: p.canEdit)
                PersonAvatar(name: p.name, color: CollabSession.color(for: p.id), size: size, photo: p.photo,
                             badge: badge, stale: p.stale, roomForBadge: true, badgeOnly: badges, pencilStyle: pencilStyle)
                    // The next avatar overlaps this one gently, or, when this one has a badge, starts
                    // where the badge ends, so a badge never sits on the next person.
                    .padding(.trailing, i < shown.count - 1 || people.count > 3
                             ? (badge == .none ? g.outer - size * 0.22 : g.badgeRight + 0.5) - g.frame.width : 0)
                    .transition(.opacity)
            }
            if people.count > 3 {
                Text("+\(people.count - 3)")
                    .font(.system(size: size * 0.36, weight: .semibold))
                    .foregroundStyle(Color.avatarMoreInk)
                    .frame(width: size, height: size)
                    .background(Color.avatarMore, in: .circle)
                    .padding(PersonAvatar.ringWidth(size))
                    .background(Color.avatarRing, in: .circle)
                    .frame(height: g.frame.height, alignment: .top)
                    .opacity(badges ? 0 : 1)
            }
        }
    }
}

extension Color {
    /// The ring around an avatar, and where avatars overlap the cut between them: opaque white in
    /// light mode; in dark mode the toolbar's own colour, measured on screen (#191919 on iPhone,
    /// #272524 on the Mac). The stack is flattened before the glass gets it (drawingGroup), so
    /// these land exactly as written.
    #if os(iOS)
    static let avatarRing = Color(Palette.pair(0xFFFFFF, 0x191919))
    #else
    static let avatarRing = Color(Palette.pair(0xFFFFFF, 0x272524))
    #endif
    /// The "+2" circle: solid and quiet. Neutral in the Mac's plain look.
    static let avatarMore = Color(Palette.warm(0xECE6DF, 0x3A3632, plain: (0xEBEBEB, 0x3A3A3A)))
    static let avatarMoreInk = Color(Palette.warm(0x5F4E3E, 0xD8CEC3, plain: (0x5C5C5C, 0xD9D9D9)))
    /// The pencil badge: the app's dark ink in light mode, its cream in dark, solid either way.
    static let avatarPencil = Color(Palette.warm(0x2A1D10, 0xEDE6DE, plain: (0x262626, 0xE5E5E5)))
    static let avatarPencilInk = Color(Palette.warm(0xFFFFFF, 0x2A1D10, plain: (0xFFFFFF, 0x262626)))
    /// "Here now": a solid green.
    static let avatarLive = Color(Palette.pair(0x2FA44F, 0x34B85A))
    /// Initials on your own amber avatar: solid dark brown, readable on both ambers.
    static let avatarOnAmber = Color(Palette.pair(0x2A1D10, 0x2A1D10))
}

/// The avatars of everyone else who has the note open. Tapping opens Share (the people are
/// listed there). With nobody else here it's the plain "people" button.
struct PresenceStack: View {
    let session: CollabSession
    var action: () -> Void

    private var here: [CollabSession.Peer] { session.peers.values.sorted { $0.name < $1.name } }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                // Can view: said once, beside the people, so a tap that types nothing isn't a mystery.
                if session.isViewOnly {
                    Text("View Only")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .accessibilityIdentifier("collab.viewOnly")
                }
                // On the Mac, beside the people. On the iPhone the bar has no room to spare: the words
                // pushed Undo along it and back (persona council r7e), so they sit under it (NoteDetailView).
                #if os(macOS)
                SharedSyncWords(session: session)
                #endif
                avatars
            }
        }
        .buttonStyle(.quietIcon)
        .accessibilityLabel(accessibilityText)
        .accessibilityIdentifier("collab.people")
    }

    @ViewBuilder private var avatars: some View {
            if here.isEmpty {
                Label("People", systemImage: "person.2")
            } else {
                // Redrawn twice a second, so a pencil fades a moment after someone stops typing, and
                // someone who isn't heard from any more goes grey.
                TimelineView(.periodic(from: .now, by: 0.5)) { t in
                    PresenceAvatars(people: here.map { p in
                        .init(id: p.id, name: p.name, photo: CollabStore.shared?.photos[p.id], typing: p.isTyping,
                              canEdit: session.members.first { $0.id == p.id }?.role != "viewer", stale: p.isStale(at: t.date))
                    }, option: Self.badges)
                }
                .padding(.horizontal, 2)
            }
    }

    static let badges = BadgeOption.current

    private var accessibilityText: String {
        let viewOnly = session.isViewOnly ? "View only. " : ""
        let sync = SharedSyncLine.at(.now, session: session).map { "\($0.text). " } ?? ""
        guard !here.isEmpty else { return viewOnly + sync + "People" }
        return viewOnly + sync + "In this note: " + here.map { $0.isStale() ? "\($0.name) (not connected)" : $0.name }.joined(separator: ", ")
    }
}

/// Your changes are on this device only for now (offline, the server not answering): said in
/// words, and "Synced" for a moment once they're up.
struct SharedSyncWords: View {
    let session: CollabSession

    var body: some View {
        if SharedSyncLine.ticking(session) {
            TimelineView(.periodic(from: .now, by: 0.5)) { t in
                if let line = SharedSyncLine.at(t.date, session: session) {
                    Text(line.text)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .fixedSize()
                        .accessibilityIdentifier("collab.sync")
                }
            }
        }
    }
}

/// What a shared note's bar says of syncing (persona council round 7, bug 18): nothing while your
/// changes go up as you type; "Not synced yet" once they've waited a few seconds with nothing
/// going up (offline, or the server not answering), so you know they're on this device only; then
/// "Synced" for a moment once they're up. The words Settings uses for the account's sync.
enum SharedSyncLine: Equatable {
    case notSynced, synced

    /// A wait this long, with nothing going up, shows.
    static let after: TimeInterval = 3
    /// "Synced" stays this long.
    static let syncedFor: TimeInterval = 2

    static func at(_ now: Date, waitingSince: Date?, sentAt: Date?, lastWait: TimeInterval) -> SharedSyncLine? {
        if let waitingSince { return now.timeIntervalSince(waitingSince) >= after ? .notSynced : nil }
        if let sentAt, lastWait >= after, now.timeIntervalSince(sentAt) < syncedFor { return .synced }
        return nil
    }

    @MainActor static func at(_ now: Date, session: CollabSession) -> SharedSyncLine? {
        at(now, waitingSince: session.waitingSince, sentAt: session.sentAt, lastWait: session.lastWait)
    }

    /// Whether the line can change as time passes (a wait growing long, "Synced" going).
    @MainActor static func ticking(_ session: CollabSession, now: Date = .now) -> Bool {
        session.waitingSince != nil || session.sentAt.map { now.timeIntervalSince($0) < syncedFor } == true
    }

    var text: String {
        switch self {
        case .notSynced: "Not synced yet"
        case .synced: "Synced"
        }
    }
}

/// You and someone else replaced the same words while apart: both are in the note, run together.
/// Which to keep, or both with a space between. Nothing's chosen for you, and nothing's lost.
struct SharedClashCard: View {
    let clash: OwnUndo.Clash
    /// The one other person in the note, when there's just one.
    let other: String?
    let keep: (String) -> Void
    let keepBoth: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("You and \(other ?? "someone else") both changed \u{201C}\(clash.replaced)\u{201D}")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            HStack(spacing: 8) {
                choice(clash.mine, id: "clash.mine")
                choice(clash.theirs, id: "clash.theirs")
                Button("Keep both", action: keepBoth)
                    .buttonStyle(.hoverLink)
                    .font(.footnote)
                    .foregroundStyle(Color.muted)
                    .fixedSize()
                    .accessibilityIdentifier("clash.both")
            }
        }
        .padding(10)
        .frame(maxWidth: 420, alignment: .leading)
        .background(Color.card, in: RoundedRectangle(cornerRadius: Radius.lg, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: Radius.lg, style: .continuous).strokeBorder(Color.secondary.opacity(0.25)))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("clash.card")
    }

    private func choice(_ words: String, id: String) -> some View {
        Button { keep(words) } label: { Text(words).lineLimit(1).truncationMode(.tail) }
            .buttonStyle(.secondary(.regular, wide: true))
            .accessibilityLabel("Keep \(words)")
            .accessibilityIdentifier(id)
    }
}
