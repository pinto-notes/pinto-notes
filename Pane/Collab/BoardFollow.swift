import CoreGraphics
import Foundation

/// Following someone on a shared whiteboard (15 November 2026): FigJam's spotlight and observe,
/// made calm.
///
/// - When someone presents (Present), everyone else on the board sees "Sara is presenting ·
///   Follow" in a solid banner in her colour. Follow moves your view to the frame she shows, each
///   time she steps, and her laser's trail shows on your board. The banner then reads "Following
///   Sara · Stop following"; Stop following, Escape, or moving the board yourself ends it, and so
///   does her Done.
/// - Choosing a person from the avatars (Follow Sara) follows their view whatever they do: where
///   they scroll and zoom, until you stop or they leave.
/// - Whoever is followed sees how many follow (the Present bar: "Sara is following", "3 following").
///
/// It all travels in the sealed presence a board already sends, at most ten times a second and
/// with every beat: `present` (the frame on show, its step and the steps), `view` (what of the
/// board is in view, in its own coordinates), `laser` (the trail's points since the last beat) and
/// `follow` (whose view you follow). The app and the board in a browser (web/lib/board-follow.ts)
/// send and read the same fields, so a Mac, an iPhone and a browser follow one another.
enum BoardFollow {
    /// At most this many laser points wait for a beat (a beat goes out ten times a second, so
    /// this is far more than a hand draws between two).
    static let mostLaserPoints = 120

    /// The parts of someone's presence following reads: when one changes, the board is told.
    struct Look: Equatable {
        var presenting: BoardPresenting?
        var view: CGRect?
        var following: UUID?
    }

    /// A view as presence carries it (x, y, width, height), checked: finite, with a size.
    static func rect(_ v: [Double]?) -> CGRect? {
        guard let v, v.count == 4, v.allSatisfy(\.isFinite), v[2] > 0, v[3] > 0, v[2] < 1e7, v[3] < 1e7 else { return nil }
        return CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
    }

    /// Laser points as presence carries them, checked.
    static func points(_ v: [[Double]]?) -> [CGPoint] {
        (v ?? []).prefix(mostLaserPoints).compactMap { $0.count == 2 && $0.allSatisfy(\.isFinite) ? CGPoint(x: $0[0], y: $0[1]) : nil }
    }

    /// A view to the nearest point: a view that hasn't really moved isn't sent again.
    static func rounded(_ r: CGRect) -> CGRect {
        CGRect(x: r.minX.rounded(), y: r.minY.rounded(), width: r.width.rounded(), height: r.height.rounded())
    }

    /// What the banner over the board says, if anything.
    enum Banner: Equatable {
        /// "Sara is presenting · Follow".
        case presenting(BoardPerson)
        /// "Following Sara · Stop following".
        case following(BoardPerson)

        var person: BoardPerson {
            switch self {
            case .presenting(let p), .following(let p): p
            }
        }

        var line: String {
            switch self {
            case .presenting(let p): "\(p.name) is presenting"
            case .following(let p): "Following \(p.name)"
            }
        }

        var action: String {
            switch self {
            case .presenting: BoardFollow.follow
            case .following: BoardFollow.stop
            }
        }
    }

    static let follow = "Follow"
    static let stop = "Stop following"

    /// The banner: following someone, or someone else presenting while you aren't. Nothing while
    /// you present yourself.
    static func banner(people: [BoardPerson], following: UUID?, presentingHere: Bool) -> Banner? {
        if let f = following, let p = people.first(where: { $0.id == f }) { return .following(p) }
        guard !presentingHere, let p = presenter(in: people) else { return nil }
        return .presenting(p)
    }

    /// Who presents: the first of the others presenting who's still heard from (two at once is
    /// rare; every device picks the same one).
    static func presenter(in people: [BoardPerson]) -> BoardPerson? {
        people.filter { $0.presenting != nil && !$0.stale }.min { $0.id.uuidString < $1.id.uuidString }
    }

    /// The people following you, by name.
    static func followers(of me: UUID?, in people: [BoardPerson]) -> [BoardPerson] {
        guard let me else { return [] }
        return people.filter { $0.following == me && !$0.stale }.sorted { $0.name < $1.name }
    }

    /// The presenter's line about them: "Sara is following", "3 following".
    static func followersLine(_ followers: [BoardPerson]) -> String? {
        switch followers.count {
        case 0: nil
        case 1: "\(followers[0].name) is following"
        default: "\(followers.count) following"
        }
    }

    /// Where a follower's view goes for the person followed: the frame they present (or the whole
    /// board, when it has no frames), else what they see.
    static func target(for p: BoardPerson) -> Target? {
        if let shown = p.presenting { return shown.frame.map(Target.frame) ?? .wholeBoard }
        return p.view.map(Target.view)
    }

    /// Where a follower's board shows.
    enum Target: Equatable, Sendable {
        case frame(String)
        case wholeBoard
        case view(CGRect)

        var payload: [String: Any] {
            switch self {
            case .frame(let id): ["op": "follow", "frame": id]
            case .wholeBoard: ["op": "follow", "whole": true]
            case .view(let r): ["op": "follow", "view": [Double(r.minX), Double(r.minY), Double(r.width), Double(r.height)]]
            }
        }
    }
}

/// What someone presenting shows (Present): the frame on screen (nil: the whole board, which has no
/// frames), its step and how many there are.
struct BoardPresenting: Codable, Equatable, Sendable {
    var frame: String?
    /// The step shown, from 0.
    var i: Int
    /// The steps.
    var n: Int

    /// Checked as it arrives: a frame id the board could hold, a step within the steps.
    var checked: BoardPresenting? {
        if let frame, frame.isEmpty || frame.utf8.count > 200 { return nil }
        guard n >= 1, n <= 10_000, i >= 0, i < n else { return nil }
        return self
    }
}

/// What the page says of your view with your pointer, on a shared board: what you present, what of
/// the board you see, and your laser's points since it last said (nil: the laser is off).
struct BoardLook: Equatable {
    var presenting: BoardPresenting?
    var view: CGRect?
    var laser: [CGPoint]?
}

/// Someone else on a shared board, for following them.
struct BoardPerson: Equatable, Identifiable, Sendable {
    let id: UUID
    /// Their first name.
    var name: String
    /// Their colour on the board, "#RRGGBB": on white, and the same hue on a dark board.
    var color: String
    var dark: String
    var presenting: BoardPresenting?
    /// What of the board they see, in its own coordinates.
    var view: CGRect?
    /// Whose view they follow.
    var following: UUID?
    /// Not heard from for a while (CollabSession.Peer.isStale).
    var stale = false
}
