import SwiftData
import SwiftUI

/// What the app says while sync can't reach the server. Every line says the notes are safe before
/// anything else: Emil, 10 November 2026, on "Can't reach Pinto Notes" beside a spinner: "this
/// scares me away from working offline". Nothing shows while the server can be reached.
enum OfflineCopy {
    /// "Offline" with no network; "Sync paused" with a network that doesn't reach Pinto Notes.
    /// Never a failure as the first words.
    static func lead(_ reach: SyncEngine.Reach) -> String? {
        switch reach {
        case .online: nil
        case .offline: "Offline"
        case .unreachable: "Sync paused"
        }
    }

    /// The status line, longest first: the first that fits its row is the one shown, so a narrow
    /// sidebar never wraps it or cuts it with an ellipsis. The same words whether or not changes
    /// are waiting (how many is in the popover), so it doesn't change as you type.
    static func lines(_ reach: SyncEngine.Reach, device: String = InstallID.kind) -> [String] {
        guard let lead = lead(reach) else { return [] }
        // The last, for the narrowest sidebar, keeps the half that reassures: the cloud beside it
        // already says sync is away.
        return ["\(lead) \u{00B7} saved on this \(device)", "\(lead) \u{00B7} saved here", "Saved on this \(device)"]
    }

    static func line(_ reach: SyncEngine.Reach, device: String = InstallID.kind) -> String? { lines(reach, device: device).first }

    /// A cloud with a line through it, for both: nothing with an exclamation mark, which reads as
    /// an error to fix.
    static func symbol(_ reach: SyncEngine.Reach) -> String { "icloud.slash" }

    /// Whether the small spinner by your account turns. Only for a sync that is getting through: a
    /// try against a connection that's away isn't progress, and a spinner beside "can't reach" looked
    /// like trouble.
    static func spins(_ status: SyncEngine.Status, reach: SyncEngine.Reach) -> Bool { status == .syncing && reach == .online }

    // MARK: The popover the status opens

    static func title(_ reach: SyncEngine.Reach) -> String { reach == .unreachable ? "Sync is paused" : "You\u{2019}re offline" }

    /// You can keep writing, where it's saved, when it syncs, and when your AI sees it.
    static func explanation(_ reach: SyncEngine.Reach, device: String = InstallID.kind) -> String {
        reach == .unreachable
            ? "Pinto Notes can\u{2019}t be reached right now. Keep writing: everything is saved on this \(device) and syncs by itself when it\u{2019}s back. Your AI sees the changes after that."
            : "Keep writing: everything is saved on this \(device) and syncs by itself when you\u{2019}re back online. Your AI sees the changes after that."
    }

    /// How much is waiting to go up; nil with nothing waiting.
    static func waiting(_ count: Int) -> String? {
        switch count {
        case ..<1: nil
        case 1: "1 change is waiting to sync."
        default: "\(count) changes are waiting to sync."
        }
    }

    static let tryNow = "Try now"
    static let trying = "Trying\u{2026}"

    /// What Try now found.
    static func tried(_ reach: SyncEngine.Reach) -> String {
        switch reach {
        case .online: "Back online. Everything is synced."
        case .offline: "Still offline. It syncs by itself when you\u{2019}re back."
        case .unreachable: "Still can\u{2019}t reach Pinto Notes. It keeps trying by itself."
        }
    }

    /// For an action that needs the server, said where its button is. It says what's really wrong:
    /// with Wi-Fi on and only the server away, "You're offline" isn't true (round 17).
    static func needsNetwork(_ what: String, reach: SyncEngine.Reach = .offline) -> String {
        reach == .unreachable
            ? "Can\u{2019}t reach Pinto Notes. Try again to \(what) when it\u{2019}s back."
            : "You\u{2019}re offline. Connect to the internet to \(what)."
    }

    /// At the top of Settings while offline: one banner, in one voice.
    static func settings(_ reach: SyncEngine.Reach) -> String {
        reach == .unreachable
            ? "Sync is paused. Your notes work as usual and sync when Pinto Notes can be reached again."
            : "You\u{2019}re offline. Your notes work as usual and sync when you\u{2019}re back."
    }
}

extension EnvironmentValues {
    /// Whether the server can be reached, for the controls that need it (set by the app's root and
    /// by Settings, which is its own window on the Mac).
    @Entry var networkReach: SyncEngine.Reach = .online
    /// The app sits behind a setup card: its empty placeholders stay hidden so only the card speaks.
    @Entry var behindSetupCard = false
    /// The last button of an import: Show Imported Notes in the app, Continue during setup, where the
    /// flow goes on to the next card rather than to the notes (Emil, 2 November 2026).
    @Entry var importDoneTitle = "Show Imported Notes"
}

/// What the status reads and Try now runs: the sync engine, or a capture's stand-in.
@MainActor protocol OfflineSource: AnyObject {
    var reach: SyncEngine.Reach { get }
    /// A sync is running now.
    var isSyncing: Bool { get }
    /// One sync, now; over when it has got through or failed.
    func tryNow() async
}

extension SyncEngine: OfflineSource {
    var isSyncing: Bool { status == .syncing }
    func tryNow() async { await sync() }
}

/// The status line's words, the longest that fit the room on one line.
struct OfflineWords: View {
    let reach: SyncEngine.Reach
    var device = InstallID.kind

    var body: some View {
        ViewThatFits(in: .horizontal) {
            ForEach(OfflineCopy.lines(reach, device: device), id: \.self) { Text($0).lineLimit(1) }
        }
    }
}

#if os(iOS)
/// A calm line while sync can't reach the server: a small capsule over the iPhone's lists. No alert
/// and no spinner; editing goes on as usual and the line goes as soon as a sync gets through. (The
/// Mac says it in its sidebar's account row: `OfflineStatus`.)
struct OfflineLine: View {
    let sync: SyncEngine?

    var body: some View {
        if let sync, sync.reach != .online {
            Label { OfflineWords(reach: sync.reach) } icon: { Image(systemName: OfflineCopy.symbol(sync.reach)) }
                .font(.footnote)
                .foregroundStyle(Color.muted)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                // Solid, so list text scrolling behind never shows through.
                .background(Color(Palette.row), in: .capsule)
                .overlay(Capsule().strokeBorder(Color.line, lineWidth: 0.5))
                .shadow(color: .black.opacity(0.06), radius: 6, y: 2)
                .padding(.bottom, 6)
                .accessibilityElement(children: .combine)
                .accessibilityLabel(OfflineCopy.line(sync.reach) ?? "")
                .accessibilityIdentifier("sync.offline")
                .transition(.opacity)
        }
    }
}
#endif

#if os(macOS)
/// The status while it shows, and its popover: what Try now is doing and what it found. One per
/// sidebar; the account row draws from it (a second line under your name, and a cloud beside it:
/// of a row of its own over Templates and this, Emil's session picked this, 10 November 2026:
/// nothing in the foot moves, and it reads as the account's state, not a menu item).
@MainActor @Observable final class OfflineStatus {
    var showing = false
    private(set) var trying = false
    /// What the last Try now found, until the popover closes.
    private(set) var found: SyncEngine.Reach?
    @ObservationIgnored private var closing: Task<Void, Never>?

    /// Whether the status shows: while the server is away, and while its popover is still open on
    /// what Try now found (it stays to say "Back online" instead of vanishing under the pointer).
    func shows(_ reach: SyncEngine.Reach) -> Bool { reach != .online || showing }

    /// What the line and the popover speak of: where sync is, or was while the popover stays open.
    func spoken(_ reach: SyncEngine.Reach) -> SyncEngine.Reach { reach == .online ? (last ?? .offline) : reach }
    @ObservationIgnored private var last: SyncEngine.Reach?

    func noticed(_ reach: SyncEngine.Reach) { if reach != .online { last = reach } }

    func toggle() {
        showing.toggle()
        if !showing { closed() }
    }

    func closed() {
        closing?.cancel()
        found = nil
    }

    func tryNow(_ source: any OfflineSource, hold: Duration = .seconds(2)) async {
        guard !trying else { return }
        trying = true
        found = nil
        await source.tryNow()
        trying = false
        found = source.reach
        guard source.reach == .online else { return }
        // Back: said for a moment, then the popover goes with the line.
        closing?.cancel()
        closing = Task { [weak self] in
            try? await Task.sleep(for: hold)
            if !Task.isCancelled { self?.showing = false; self?.found = nil }
        }
    }
}

/// What the status opens: you can keep writing, where it's saved, when it syncs, and Try now.
struct OfflinePopover: View {
    let source: any OfflineSource
    let status: OfflineStatus
    @Query(filter: #Predicate<Note> { $0.dirty }) private var notes: [Note]
    @Query(filter: #Predicate<Folder> { $0.dirty }) private var folders: [Folder]
    @Query(filter: #Predicate<Attachment> { $0.dirty || !$0.uploaded }) private var files: [Attachment]

    static let width: CGFloat = 280

    var body: some View {
        let reach = status.spoken(source.reach)
        VStack(alignment: .leading, spacing: 8) {
            Text(OfflineCopy.title(reach)).font(.headline)
            Text(OfflineCopy.explanation(reach))
                .font(.callout)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if let waiting = OfflineCopy.waiting(notes.count + folders.count + files.count), source.reach != .online {
                Text(waiting).font(.callout).foregroundStyle(.secondary)
            }
            HStack(spacing: 10) {
                Button(status.trying ? OfflineCopy.trying : OfflineCopy.tryNow) {
                    Task { await status.tryNow(source) }
                }
                .disabled(status.trying)
                .accessibilityIdentifier("sync.offline.tryNow")
                if let found = status.found {
                    Text(OfflineCopy.tried(found))
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityIdentifier("sync.offline.found")
                }
            }
            .padding(.top, 4)
        }
        .padding(16)
        // No identifier on the whole: it would take the place of the button's and the result's own.
        .frame(width: Self.width, alignment: .leading)
    }
}

/// The cloud beside your name while sync is away, where the sync spinner turns while it syncs.
struct OfflineCloud: View {
    let reach: SyncEngine.Reach

    var body: some View {
        Image(systemName: OfflineCopy.symbol(reach))
            .font(.system(size: 12))
            .foregroundStyle(Color.muted)
            .accessibilityHidden(true)
    }
}

#if DEBUG
/// Captures and real-input checks: a status with no account behind it. `-sidebarOffline offline`
/// (or `unreachable`) in a demo run shows the foot as it is while sync is away; Try now takes a
/// moment and then finds it still away, or back with `-sidebarOfflineReturns`.
@MainActor @Observable final class OfflineStandIn: OfflineSource {
    var reach: SyncEngine.Reach
    var isSyncing = false
    var returns: Bool
    var takes: Duration

    init(_ reach: SyncEngine.Reach, returns: Bool = false, takes: Duration = .milliseconds(900)) {
        self.reach = reach
        self.returns = returns
        self.takes = takes
    }

    func tryNow() async {
        try? await Task.sleep(for: takes)
        if returns { reach = .online }
    }

    /// The run's stand-in, from its launch arguments; nil in any other run.
    static let launched: OfflineStandIn? = {
        let args = ProcessInfo.processInfo.arguments
        guard args.contains("-uitest"), args.contains("-demo"), let i = args.firstIndex(of: "-sidebarOffline"), args.indices.contains(i + 1) else { return nil }
        // The account row as it is with a name.
        ProfileStore.shared.showForPreview(name: "Emil Wagman", photo: nil)
        return OfflineStandIn(args[i + 1] == "unreachable" ? .unreachable : .offline, returns: args.contains("-sidebarOfflineReturns"))
    }()
}
#endif
#endif
