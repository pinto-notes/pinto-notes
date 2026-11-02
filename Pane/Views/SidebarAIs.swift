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
            Label {
                Text(title).foregroundStyle(Color.muted)
            } icon: {
                SidebarIcon(name: symbol)
            }
            .sidebarRowLabel()
            .frame(height: SidebarFoot.rowContentHeight)
            .sidebarFootPill(id)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(id)
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
                imports?.appleNotes()
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

    /// A folder row's content inside its 30.5 pt pill.
    static var rowContentHeight: CGFloat {
        let reach = Hover.sidebarReach()
        return 32 - SidebarStyle.pillGap - reach.top - reach.bottom
    }

    var body: some View {
        let pill = SidebarStyle.rowPill(nested: nested)
        VStack(alignment: .leading, spacing: SidebarStyle.pillGap) {
            if rows { SidebarStudyRows(imports: imports) }
            AccountButton(backend: backend)
        }
        .padding(.leading, pill.leading)
        .padding(.trailing, pill.trailing)
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
