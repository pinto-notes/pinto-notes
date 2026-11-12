import SwiftUI

/// Design study (2026-10-30): what makes Pinto different, visible at a glance. Connect an AI,
/// Templates and Import above your profile, and the AI's mark on the notes it made. (A section of your AIs in the
/// sidebar was tried and dropped: Emil, 2026-10-30, "I don't like the AIs in sidebar at all".)
/// Off unless a capture turns it on.
struct SidebarStudy: Equatable {}

extension EnvironmentValues {
    @Entry var sidebarStudy: SidebarStudy?
    /// Connect an AI and Settings → AI as one design (2026-10-30): your AIs, then the rest to add.
    @Entry var connectStudy = false
}

enum SidebarAIWords {
    static let connect = "Connect an AI"
    static let templates = "Templates"
    static let importNotes = "Import notes"
    static func madeBy(_ ai: String) -> String { "Made by \(ai)" }
}

#if os(macOS)
/// A quiet row that does one thing: connect an AI, browse templates, import. Laid out like a
/// folder row: its icon and name on the folder rows' lines, a folder row's height, and the same
/// pill under the pointer (`sidebarFootPill`).
struct SidebarActionRow: View {
    let title: String
    let symbol: String
    let id: String
    var action: () -> Void = {}
    /// Hides the row for good: its right-click menu and its accessibility action (nil: neither).
    var remove: (() -> Void)? = nil

    var body: some View {
        Button(action: action) {
            SidebarFootLabel {
                Text(title).foregroundStyle(Color.muted)
                    #if DEBUG
                    .footProbe("\(id).title")
                    #endif
            } icon: {
                SidebarFootIcon(name: symbol)
            }
            .frame(height: SidebarFoot.rowContentHeight)
            .sidebarFootPill(id)
        }
        .buttonStyle(.plain)
        // The pill above is its hover: a second one here drew two fills (Emil, 3 November 2026).
        .accessibilityIdentifier(id)
        .contextMenu {
            if let remove { Button(SidebarSetupRow.removeTitle, systemImage: "minus.circle", action: remove) }
        }
        .accessibilityActions {
            if let remove { Button(SidebarSetupRow.removeTitle, action: remove) }
        }
    }
}

/// A foot row's icon, its ink centred top to bottom. A symbol sits as it would beside text, with
/// room of its own above or below: Import notes' tray sat low in its row (Emil, 8 November 2026).
/// Nudged by what theFootIconsAreCentredInTheirRows measures.
struct SidebarFootIcon: View {
    let name: String

    /// How far up, in points. Laid out (padding under it), not an offset, so it's measured as drawn.
    static let lift: [String: CGFloat] = ["square.and.arrow.down": 0.5]

    var body: some View {
        SidebarIcon(name: name).padding(.bottom, 2 * (Self.lift[name] ?? 0))
    }
}

/// A small spinner while a sync runs. Only for one that takes a moment: most syncs (each push while
/// you type) are over in a fraction of a second, and a spinner blinking on and off with every
/// keystroke would be noise. Once shown it stays long enough to be read, and fades in and out.
struct SyncSpinner: View {
    let syncing: Bool
    @State private var delay = SpinnerDelay()

    var body: some View {
        ProgressView()
            .controlSize(.small)
            .opacity(delay.shown ? 1 : 0)
            .animation(.easeOut(duration: 0.2), value: delay.shown)
            .accessibilityHidden(!delay.shown)
            .accessibilityLabel("Syncing")
            .help(delay.shown ? "Syncing" : "")
            .allowsHitTesting(false)
            .onChange(of: syncing, initial: true) { _, now in delay.set(now) }
    }
}

/// When a spinner for work shows: only once the work has run `wait`, then for at least `hold`
/// after it ends, so a quick one never blinks it on and off.
@MainActor @Observable final class SpinnerDelay {
    private(set) var shown = false
    private var pending: Task<Void, Never>?
    let wait: Duration
    let hold: Duration

    init(wait: Duration = .milliseconds(700), hold: Duration = .milliseconds(600)) {
        self.wait = wait
        self.hold = hold
    }

    func set(_ working: Bool) {
        pending?.cancel()
        if working, !shown {
            pending = Task { [wait] in
                try? await Task.sleep(for: wait)
                if !Task.isCancelled { self.shown = true }
            }
        } else if !working, shown {
            pending = Task { [hold] in
                try? await Task.sleep(for: hold)
                if !Task.isCancelled { self.shown = false }
            }
        }
    }
}

/// A foot row's icon, centred in the photo's column, then its words on your name's line.
struct SidebarFootLabel<Title: View, Icon: View>: View {
    @ViewBuilder let title: Title
    @ViewBuilder let icon: Icon

    var body: some View {
        HStack(spacing: SidebarFoot.gap) {
            icon.frame(width: SidebarFoot.iconColumn)
            title
        }
    }
}

/// The setup rows at the foot of the sidebar, most used first: the templates, your AIs (the
/// sheet lists the connected ones and connects more), and importing more notes. Each leaves once
/// its job is done or you remove it (SidebarSetup), and never comes back; with none left this
/// draws nothing and takes no room.
struct SidebarStudyRows: View {
    var imports: ImportActions?
    /// The signed-in account. Nil (a demo run's real-input checks, captures) shows every row.
    var account: UUID? = nil
    /// When the account was made, as the server says.
    var accountCreated: Date? = nil
    @Environment(SetupStore.self) private var setupStore: SetupStore?
    @Environment(\.modelContext) private var context
    @Environment(\.appearsActive) private var appearsActive
    @Environment(\.sidebarSetupDefaults) private var defaults
    /// The rows still here; nil until worked out (then none show for an account, so none blink).
    @State private var shown: [SidebarSetupRow]?

    private var setup: SidebarSetup? { account.map { SidebarSetup(defaults: defaults, account: $0) } }

    /// What can change the answer: the server's marks, the AI connections, the window coming forward.
    private struct Inputs: Equatable {
        var account: UUID?
        var progress: SetupProgress?
        var connected: [String]?
        var active: Bool
    }

    var body: some View {
        let rows = shown ?? (account == nil ? SidebarSetupRow.allCases : [])
        VStack(alignment: .leading, spacing: SidebarStyle.pillGap) {
            ForEach(rows, id: \.self) { row in
                SidebarActionRow(title: row.title, symbol: row.symbol, id: row.id, action: {
                    NotificationCenter.default.post(name: row.opens, object: nil)
                }, remove: setup.map { setup in { remove(row, setup) } })
                .transition(.opacity)
            }
        }
        // The gap under the rows is theirs, so with none left the account sits where they were.
        .padding(.bottom, rows.isEmpty ? 0 : SidebarStyle.pillGap)
        .preference(key: SidebarFootAbove.self, value: !rows.isEmpty)
        .onChange(of: Inputs(account: account, progress: setupStore?.progress, connected: ConnectedAIs.shared.knownNames, active: appearsActive),
                  initial: true) { update() }
    }

    private func update() {
        guard let setup else { shown = nil; return }
        let facts = SidebarSetup.facts(progress: setupStore?.progress, connected: ConnectedAIs.shared.knownNames,
                                       ledger: NoteSourceLedger(defaults: defaults, account: account), context: context,
                                       accountCreated: accountCreated, setup: setup)
        let now = setup.shown(facts)
        guard now != shown else { return }
        if shown == nil { shown = now } else { withAnimation(.easeOut(duration: 0.2)) { shown = now } }
    }

    private func remove(_ row: SidebarSetupRow, _ setup: SidebarSetup) {
        setup.remove(row)
        withAnimation(.easeOut(duration: 0.2)) { shown = (shown ?? []).filter { $0 != row } }
    }
}

/// Something is drawn above the account in the foot (the AI's last change, a setup row): only
/// then is the account set a little apart from it.
struct SidebarFootAbove: PreferenceKey {
    static let defaultValue = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}

/// The foot of the Mac sidebar: the study's rows (when on), then you. One view for the app and
/// its captures, so the two can't drift apart (2026-10-30 a capture's own copy of the foot kept
/// the padding from before the account row was lined up, and the shots showed it off again).
/// Every item's pill sits where a top-level folder row's does (`SidebarStyle.rowPill`), so the
/// icons, the photo and the names start on the folder rows' lines.
struct SidebarFoot: View {
    let backend: Backend
    /// Some folder has sub-folders: the list moves its rows right for the arrows' column.
    var nested = false
    var rows = false
    var imports: ImportActions?
    /// While it syncs, a small spinner at the account row's right end.
    var sync: SyncEngine? = nil
    /// What the offline status reads: sync, unless a capture stands in for it.
    var offline: (any OfflineSource)? = nil
    @State private var status = OfflineStatus()
    /// The AI's line or a setup row is drawn above the account.
    @State private var above = false

    /// The photo's column: each row's icon is centred in one as wide as the account's photo, and its
    /// words start where your name does, so the foot reads as one block (Emil, 8 November 2026:
    /// the rows "don't really align well" with the account under them).
    static var iconColumn: CGFloat { AccountButton.avatar }
    static let gap: CGFloat = 9
    /// A row's pill, its content and the hover's reach above and below.
    static var pillHeight: CGFloat { rowContentHeight + Hover.sidebarReach().top + Hover.sidebarReach().bottom }
    /// Between the rows and your account.
    static let accountGap: CGFloat = 8

    /// A folder row's content inside its 30.5 pt pill.
    static var rowContentHeight: CGFloat {
        let reach = Hover.sidebarReach()
        return 32 - SidebarStyle.pillGap - reach.top - reach.bottom
    }

    var body: some View {
        let pill = SidebarStyle.rowPill(nested: nested)
        let source: (any OfflineSource)? = offline ?? sync
        // The server is away (or the popover is still open on what Try now found).
        let away = source.map { status.shows($0.reach) } ?? false
        // Each part above the account brings its own gap under it, so a part with nothing to show
        // (no change this week, every setup row gone) leaves no room behind (Emil, 12 November 2026).
        VStack(alignment: .leading, spacing: 0) {
            // What an AI last did, as the first row: in the foot itself, not a bar of its own over the
            // folders, whose edge showed a line on hover (Emil, 8 November 2026).
            if rows { SidebarAILine(); SidebarStudyRows(imports: imports, account: backend.userID, accountCreated: backend.accountCreated) }
            // While sync is away the account row says so: a line under your name and a cloud beside it.
            AccountButton(backend: backend, offline: away ? source.map { ($0, status) } : nil)
                // Syncing, said quietly where your account is (Emil, 8 November 2026). Never while
                // the server is away: a try against a dead connection isn't progress.
                .overlay(alignment: .trailing) {
                    if !away {
                        SyncSpinner(syncing: OfflineCopy.spins(sync?.showsSyncing ?? false, reach: sync?.reach ?? .online))
                            .padding(.trailing, Hover.sidebarReach().trailing + 8)
                    }
                }
                // A little apart from the rows above: you, not another thing to do (Emil, 8 November 2026).
                .padding(.top, rows && above ? SidebarFoot.accountGap : 0)
        }
        .onPreferenceChange(SidebarFootAbove.self) { above = $0 }
        .padding(.leading, pill.leading)
        // As far in on the right as on the left: the folder list keeps room on its right for the
        // scroll bar, the foot has none (Emil, 8 November 2026).
        .padding(.trailing, pill.leading)
        #if DEBUG
        .footProbe("sidebar.foot")
        #endif
    }
}
#endif

#if DEBUG
/// Tests: where the foot and its pills were laid out (in the sidebar's own space), while
/// `HoverProbe` is on. An offscreen window has no accessibility tree to read them from.
@MainActor
enum FootProbe {
    static var frames: [String: CGRect] = [:]
}

extension View {
    func footProbe(_ id: String) -> some View {
        onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { frame in
            if HoverProbe.enabled { FootProbe.frames[id] = frame }
        }
    }
}
#endif

extension View {
    /// A sidebar foot item (Templates, Connect an AI, Import, the account) under the pointer: a
    /// folder row's pill, the same fill, corners and reach around the content (`HoverRowReader`
    /// with `Hover.sidebarReach`). The whole pill takes the pointer and the click.
    func sidebarFootPill(_ id: String) -> some View {
        let r = Hover.sidebarReach()
        let pill = padding(EdgeInsets(top: r.top, leading: r.leading, bottom: r.bottom, trailing: r.trailing))
            .hoverRow(id, reach: EdgeInsets())
        #if DEBUG
        return pill.footProbe(id)
        #else
        return pill
        #endif
    }
}
