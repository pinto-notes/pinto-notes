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

/// The study's rows at the foot of the sidebar, most used first: the templates, your AIs (the
/// sheet lists the connected ones and connects more), and importing more notes.
struct SidebarStudyRows: View {
    var imports: ImportActions?

    var body: some View {
        VStack(alignment: .leading, spacing: SidebarStyle.pillGap) {
            SidebarActionRow(title: SidebarAIWords.templates, symbol: "square.grid.2x2", id: "sidebar.templates") {
                NotificationCenter.default.post(name: .paneTemplates, object: nil)
            }
            SidebarActionRow(title: SidebarAIWords.connect, symbol: "sparkles", id: "sidebar.connectAI") {
                NotificationCenter.default.post(name: .paneConnectAI, object: nil)
            }
            SidebarActionRow(title: SidebarAIWords.importNotes, symbol: "square.and.arrow.down", id: "sidebar.import") {
                // The choice of where from, not Apple Notes' import straight away (Emil, 2 November 2026).
                NotificationCenter.default.post(name: .paneImportNotes, object: nil)
            }
        }
    }
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
        VStack(alignment: .leading, spacing: SidebarStyle.pillGap) {
            // What an AI last did, as the first row: in the foot itself, not a bar of its own over the
            // folders, whose edge showed a line on hover (Emil, 8 November 2026).
            if rows { SidebarAILine(); SidebarStudyRows(imports: imports) }
            AccountButton(backend: backend)
                // A little apart from the rows above: you, not another thing to do (Emil, 8 November 2026).
                .padding(.top, rows ? SidebarFoot.accountGap : 0)
        }
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
