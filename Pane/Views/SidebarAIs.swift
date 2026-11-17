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

    var body: some View {
        Button(action: action) {
            SidebarFootLabel {
                Text(title).foregroundStyle(Color.muted)
                    #if DEBUG || QA
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

/// Templates, a row at the foot of the sidebar for good (Emil, 12 November 2026: "maybe we
/// should keep templates there"). Connect an AI and Import notes are in Settings, said once by
/// the notice above (SetupNoticeCard).
struct SidebarStudyRows: View {
    var imports: ImportActions?

    var body: some View {
        let row = SidebarSetupRow.templates
        SidebarActionRow(title: row.title, symbol: row.symbol, id: row.id) {
            NotificationCenter.default.post(name: row.opens, object: nil)
        }
        // The gap between the rows and you, as it was with three of them.
        .padding(.bottom, SidebarStyle.pillGap)
    }
}

/// The notice a new account sees once, at the top of the foot: that Settings connects more AIs
/// (and imports notes, until it has). A quiet card in the sidebar's own grey, its words on the
/// rows' icons' line; Open Settings takes you to AI Connections, the × closes it, and either puts
/// it away for good, as two weeks after the first note do (SetupNotice).
struct SetupNoticeCard: View {
    /// The signed-in account. Nil (a demo run, captures without one): no notice.
    var account: UUID?
    /// When the account was made, as the server says.
    var accountCreated: Date?
    @Environment(SetupStore.self) private var setupStore: SetupStore?
    @Environment(OnboardingStore.self) private var onboarding: OnboardingStore?
    @Environment(\.modelContext) private var context
    @Environment(\.appearsActive) private var appearsActive
    @Environment(\.sidebarSetupDefaults) private var defaults
    @State private var line: String?

    typealias Metrics = SidebarCardMetrics
    static let id = "sidebar.notice"
    static let font = Font.system(size: 12)

    private var notice: SetupNotice? { account.map { SetupNotice(defaults: defaults, account: $0) } }

    /// What can change the answer: the server's marks, the first-run flow, the window coming forward.
    private struct Inputs: Equatable {
        var account: UUID?
        var progress: SetupProgress?
        var onboarding: Bool
        var active: Bool
    }

    var body: some View {
        // A stack, not a Group: with no notice it is still there, so the check below still runs.
        VStack(spacing: 0) {
            if let line { card(line).transition(.opacity) }
        }
        .onChange(of: Inputs(account: account, progress: setupStore?.progress, onboarding: onboarding?.active ?? false, active: appearsActive),
                  initial: true) { update() }
        .onReceive(NotificationCenter.default.publisher(for: Self.closed)) { _ in update() }
        #if DEBUG
        .onChange(of: line, initial: true) { if HoverProbe.enabled { FootProbe.notice = line } }
        #endif
    }

    private func card(_ line: String) -> some View {
        let shape = RoundedRectangle(cornerRadius: Metrics.radius, style: .continuous)
        return VStack(alignment: .leading, spacing: 6) {
            // At most four lines, never fixed to its full height: a fixed line asked for its
            // smallest size in a narrow sidebar sets the window's smallest height (see SidebarCardShell).
            Text(line)
                .font(Self.font)
                .foregroundStyle(Color.muted)
                .lineLimit(4)
                .accessibilityIdentifier("\(Self.id).text")
                #if DEBUG
                .footProbe("\(Self.id).text")
                #endif
            Button(action: openSettings) {
                HStack(spacing: 3) {
                    Text(SetupNoticeWords.open)
                    Image(systemName: "chevron.right").font(Metrics.arrow)
                }
                .font(Metrics.button)
                .foregroundStyle(Color.amberInk)
                .frame(minHeight: Metrics.buttonHeight)
            }
            .buttonStyle(.hoverText)
            .accessibilityHint("Opens Settings at \(SettingsNames.ai)")
            .accessibilityIdentifier("\(Self.id).open")
        }
        // The words start where the rows' icons do; the × keeps its corner.
        .padding(.leading, Hover.sidebarReach().leading)
        .padding(.trailing, Metrics.closeSize + Metrics.closeInset)
        .padding(.top, Metrics.padding)
        .padding(.bottom, Metrics.padding - 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(Palette.rowPillHover), in: shape)
        .overlay(alignment: .topTrailing) {
            Button(action: close) {
                Image(systemName: "xmark")
                    .font(.system(size: Metrics.closeGlyph, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: Metrics.closeSize, height: Metrics.closeSize)
                    .contentShape(.rect)
            }
            .buttonStyle(.quietIcon)
            .padding(Metrics.closeInset)
            .accessibilityLabel("Close")
            .accessibilityHint("Hides this for good")
            .accessibilityIdentifier("\(Self.id).close")
            .help("Close")
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier(Self.id)
        #if DEBUG
        .footProbe(Self.id)
        #endif
        // Its gap under it is its own: gone, it leaves no room behind.
        .padding(.bottom, SidebarFoot.accountGap)
    }

    private func update() {
        guard let notice else { line = nil; return }
        let facts = SetupNotice.facts(progress: setupStore?.progress, context: context, accountCreated: accountCreated, notice: notice)
        let now = notice.line(facts, onboarding: onboarding?.active ?? false)
        guard now != line else { return }
        withAnimation(.easeOut(duration: 0.2)) { line = now }
    }

    private func close() {
        guard let notice else { return }
        withAnimation(.easeOut(duration: 0.2)) { line = nil }
        Self.press(.close, notice)
    }

    private func openSettings() {
        guard let notice else { return }
        withAnimation(.easeOut(duration: 0.2)) { line = nil }
        Self.press(.open, notice)
    }

    enum Press { case open, close }

    /// What each button does: the notice goes for good (every window's card hears it), and Open
    /// Settings opens AI Connections.
    static func press(_ button: Press, _ notice: SetupNotice) {
        notice.close()
        NotificationCenter.default.post(name: closed, object: nil)
        if button == .open { SettingsRoute.shared.open(.ai) }
    }

    static let closed = Notification.Name("pane.setupNoticeClosed")
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
        // Each part above Templates brings its own gap under it, so a part with nothing to show
        // (no change this week, the notice gone) leaves no room behind (Emil, 12 November 2026).
        VStack(alignment: .leading, spacing: 0) {
            // The new account's notice first, then what an AI last did: in the foot itself, not a bar
            // of its own over the folders, whose edge showed a line on hover (Emil, 8 November 2026).
            if rows {
                SetupNoticeCard(account: backend.userID, accountCreated: backend.accountCreated)
                SidebarAILine()
                SidebarStudyRows(imports: imports)
            }
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
                .padding(.top, rows ? SidebarFoot.accountGap : 0)
        }
        .padding(.leading, pill.leading)
        // As far in on the right as on the left: the folder list keeps room on its right for the
        // scroll bar, the foot has none (Emil, 8 November 2026).
        .padding(.trailing, pill.leading)
        #if DEBUG || QA
        .footProbe("sidebar.foot")
        #endif
    }
}
#endif

#if DEBUG || QA
/// Tests: where the foot and its pills were laid out (in the sidebar's own space), while
/// `HoverProbe` is on. An offscreen window has no accessibility tree to read them from.
@MainActor
enum FootProbe {
    static var frames: [String: CGRect] = [:]
    /// What the new account's notice says, while it shows.
    static var notice: String?
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
        #if DEBUG || QA
        return pill.footProbe(id)
        #else
        return pill
        #endif
    }
}
