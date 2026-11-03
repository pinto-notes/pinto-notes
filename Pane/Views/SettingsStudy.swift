#if os(macOS)
import AppKit
import SwiftUI

/// Design study, 3 November 2026: Settings on the Mac redesigned from scratch. Emil: "every
/// single settings page needs to be reworked... They just look unimpressive and unfinished." And
/// on the sidebar: "I for some reason don't love the coloring and look of the sidebar."
///
/// Three directions, drawn offscreen by `SettingsStudyShots` for him to pick from. Not wired into
/// the app: the card stays `SettingsCard` until one is picked. Structure he decided, in all three:
/// Account is a page (name, photo, email, Sign Out, sync, Sign in with Apple, export, delete), no
/// General page (Show in menu bar moves to Appearance, diagnostics to Help and feedback), and
/// Connect an AI always says in plain text what is sent and to whom.
///
/// - A, System Settings: one flat sidebar on the card's own ground, a hairline between it and the
///   page, Account first with your photo. Pages are grouped boxes of rows, controls on the right,
///   a summary box at the top.
/// - B, Plain page: no boxes at all. A text-first sidebar starting with Connect an AI, you at its
///   foot (the account row opens a menu, `AccountMenuStudy`). Pages read like a note: a title, one
///   line on the page's job, then rows divided by hairlines.
/// - C, Toolbar tabs: no sidebar. A smaller card with the pages as tabs across the top, as the
///   Mac's own apps' Settings (Mail, Safari) do. Each page opens with a summary card.
enum SettingsStudy: String, CaseIterable, Identifiable {
    case a, b, c
    var id: String { rawValue }

    var title: String {
        switch self {
        case .a: "A. System Settings"
        case .b: "B. Plain page"
        case .c: "C. Toolbar tabs"
        }
    }

    /// The card's size: A and B keep today's (Templates'), C is smaller since it has no sidebar.
    var size: CGSize {
        switch self {
        case .a, .b: CGSize(width: 1000, height: 680)
        case .c: CGSize(width: 760, height: 640)
        }
    }

    /// The pages in the list, in order. A and C keep Account first; B starts with what you do
    /// and keeps you at the foot, since the account row has its own menu.
    var order: [[Page]] {
        switch self {
        case .a: [[.account], [.ai, .appearance], [.security, .storage], [.help]]
        case .b: [[.ai, .appearance], [.security, .storage], [.help]]
        case .c: [[.account, .ai, .appearance, .security, .storage, .help]]
        }
    }

    enum Page: String, CaseIterable, Identifiable {
        case account, ai, appearance, security, storage, help
        var id: String { rawValue }

        var title: String {
            switch self {
            case .account: "Account"
            case .ai: "Connect an AI"
            case .appearance: "Appearance"
            case .security: "Security"
            case .storage: "Storage"
            case .help: "Help and feedback"
            }
        }

        /// C's tabs: short names that fit under an icon.
        var tab: String {
            switch self {
            case .ai: "AI"
            case .help: "Help"
            default: title
            }
        }

        var symbol: String {
            switch self {
            case .account: "person.crop.circle"
            case .ai: "sparkles"
            case .appearance: "circle.lefthalf.filled"
            case .security: "lock"
            case .storage: "externaldrive"
            case .help: "questionmark.circle"
            }
        }

        /// B's line under the title: the page's job, in one sentence.
        var job: String {
            switch self {
            case .account: "Who you are here, and how you sign in."
            case .ai: "Let your AI read and edit your notes when you ask."
            case .appearance: "How Pinto Notes looks on this Mac."
            case .security: "Who can open your notes."
            case .storage: "What your notes take up."
            case .help: "Answers, feedback and what's new."
            }
        }
    }
}

/// The study's few colours: plain white and pure black, one hairline, one fill for a selection
/// and one for a group. Nothing warm.
enum StudyInk {
    static func dynamic(_ light: NSColor, _ dark: NSColor) -> Color {
        Color(nsColor: NSColor(name: nil) { $0.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light })
    }

    /// The card: white, pure black in the dark.
    static let ground = dynamic(.white, .black)
    /// A group of rows (A), a summary card (C): a step off the ground.
    static let group = dynamic(NSColor(white: 0.965, alpha: 1), NSColor(white: 0.085, alpha: 1))
    /// The selected page in a list or tabs: the one selection look.
    static let selection = dynamic(NSColor(white: 0, alpha: 0.07), NSColor(white: 1, alpha: 0.13))
    static let hairline = dynamic(NSColor(white: 0, alpha: 0.09), NSColor(white: 1, alpha: 0.13))
    /// A button on a row: white, a step up from black in the dark.
    static let raised = dynamic(.white, NSColor(white: 0.16, alpha: 1))
    /// The card's own edge over the window.
    static let edge = dynamic(NSColor(white: 0, alpha: 0.12), NSColor(white: 1, alpha: 0.18))
    static let text = dynamic(NSColor(white: 0.1, alpha: 1), NSColor(white: 0.93, alpha: 1))
    static let muted = dynamic(NSColor(white: 0.42, alpha: 1), NSColor(white: 0.62, alpha: 1))
    static let icon = dynamic(NSColor(white: 0.32, alpha: 1), NSColor(white: 0.72, alpha: 1))
    /// A switch that is on: ink, never a second orange on the page.
    static let switchOn = dynamic(NSColor(white: 0.12, alpha: 1), NSColor(white: 0.62, alpha: 1))
}

/// Who the study shows.
struct StudyPerson {
    var name = "Sara Lind"
    var email = "sara@example.com"
    var photo: NSImage?
}

/// One connected AI, as the study shows it.
struct StudyAI: Identifiable {
    let name: String
    let maker: String
    let since: String
    let used: String
    var id: String { name }

    static let connected = [StudyAI(name: "ChatGPT", maker: "OpenAI", since: "Connected 3 Oct", used: "Used today"),
                            StudyAI(name: "Claude", maker: "Anthropic", since: "Connected 28 Oct", used: "Used an hour ago")]
    /// What can be added, in the order the setup card offers them.
    static let more: [(String, String)] = [("Grok", "xAI"), ("Codex", "OpenAI"), ("Gemini", "Google"), ("Another AI", "Cursor, VS Code or any app")]

    /// The line App Review asked for (1.2's rejection): what is sent and to whom, always in view.
    static func sent(_ ais: [StudyAI]) -> String {
        guard !ais.isEmpty else { return "The notes your AI opens are sent to the company that makes it, such as OpenAI or Anthropic. Nothing is shared until you allow it." }
        let parts = ais.map { "the notes \($0.name) opens go to \($0.maker)" }
        let joined = parts.count == 2 ? "\(parts[0]) and \(parts[1])" : parts.joined(separator: ", ")
        return joined.prefix(1).uppercased() + joined.dropFirst() + ". Nothing is shared until you allow it."
    }
}

// MARK: The card

/// The whole Settings card for one direction, opened at `page`.
struct SettingsStudyCard: View {
    let study: SettingsStudy
    @State var page: SettingsStudy.Page
    var person = StudyPerson()
    var ais = StudyAI.connected
    @State private var query = ""

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 22, style: .continuous)
        Group {
            switch study {
            case .a: sidebarCard
            case .b: sidebarCard
            case .c: tabsCard
            }
        }
        .frame(width: study.size.width, height: study == .c ? nil : study.size.height)
        .background(shape.fill(StudyInk.ground).shadow(color: .black.opacity(0.22), radius: 30, y: 18))
        .clipShape(shape)
        .overlay(shape.strokeBorder(StudyInk.edge, lineWidth: 0.5))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Settings")
    }

    // MARK: A and B: a sidebar on the card's own ground

    private var sidebarCard: some View {
        HStack(spacing: 0) {
            StudySidebar(study: study, page: $page, query: $query, person: person)
                .frame(width: study == .a ? 232 : 220)
                .frame(maxHeight: .infinity, alignment: .top)
            StudyInk.hairline.frame(width: 0.5)
            VStack(spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    if study == .a {
                        Text(page.title).font(.system(size: 20, weight: .bold)).foregroundStyle(StudyInk.text)
                    }
                    Spacer()
                }
                .frame(height: 30)
                .frame(maxWidth: StudyPage.column)
                .frame(maxWidth: .infinity)
                .overlay(alignment: .trailing) { CardCloseButton(size: 26) {}.padding(.trailing, 16) }
                .padding(.top, 16)
                ScrollView {
                    StudyPage(study: study, page: page, person: person, ais: ais)
                        .frame(maxWidth: StudyPage.column)
                        .frame(maxWidth: .infinity)
                        .padding(.top, study == .a ? 14 : 0)
                        .padding(.bottom, 28)
                }
                .scrollIndicators(.never)
            }
            .padding(.horizontal, 28)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }

    // MARK: C: tabs across the top

    private var tabsCard: some View {
        VStack(spacing: 0) {
            HStack(alignment: .center, spacing: 2) {
                ForEach(SettingsStudy.Page.allCases) { p in
                    StudyTab(page: p, selected: page == p, person: person) { page = p }
                }
                Spacer(minLength: 12)
                StudySearch(query: $query, width: 150)
                CardCloseButton(size: 26) {}.padding(.leading, 10)
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)
            StudyInk.hairline.frame(height: 0.5)
            // As tall as the page, like the Mac's own Settings windows: no empty half.
            StudyPage(study: study, page: page, person: person, ais: ais)
                .padding(.horizontal, 36)
                .padding(.top, 24)
                .padding(.bottom, 30)
        }
    }
}

/// C's tab: a monochrome icon over its short name; selected, the one soft fill and ink.
private struct StudyTab: View {
    let page: SettingsStudy.Page
    let selected: Bool
    let person: StudyPerson
    let pick: () -> Void

    var body: some View {
        Button(action: pick) {
            VStack(spacing: 4) {
                Group {
                    if page == .account {
                        AvatarView(photo: person.photo, name: person.name, size: 22)
                    } else {
                        Image(systemName: page.symbol).font(.system(size: 17, weight: .regular))
                            .foregroundStyle(selected ? StudyInk.text : StudyInk.icon)
                    }
                }
                .frame(height: 22)
                Text(page.tab).font(.system(size: 11, weight: selected ? .semibold : .regular))
                    .foregroundStyle(selected ? StudyInk.text : StudyInk.muted)
                    .lineLimit(1)
            }
            .frame(minWidth: 62)
            .padding(.horizontal, 6)
            .padding(.vertical, 6)
            .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(selected ? StudyInk.selection : .clear))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(page.title)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// Search on the same surface as the list: a hairline, no fill of its own.
private struct StudySearch: View {
    @Binding var query: String
    var width: CGFloat? = nil

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass").font(.system(size: 12)).foregroundStyle(StudyInk.muted)
            TextField("Search", text: $query, prompt: Text("Search").foregroundStyle(StudyInk.muted)).textFieldStyle(.plain)
                .focusEffectDisabled()
        }
        .font(.system(size: 13))
        .padding(.horizontal, 9)
        .frame(width: width, height: 28)
        .overlay(RoundedRectangle(cornerRadius: 7, style: .continuous).strokeBorder(StudyInk.hairline, lineWidth: 1))
    }
}

// MARK: The sidebar (A and B)

private struct StudySidebar: View {
    let study: SettingsStudy
    @Binding var page: SettingsStudy.Page
    @Binding var query: String
    let person: StudyPerson

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            StudySearch(query: $query).padding(.bottom, 14)
            ForEach(Array(study.order.enumerated()), id: \.offset) { i, group in
                if i > 0 { Color.clear.frame(height: 14) }
                VStack(spacing: 2) { ForEach(group) { row($0) } }
            }
            Spacer(minLength: 0)
            if study == .b { you }
        }
        .padding(.top, 18)
        .padding(.horizontal, 12)
        .padding(.bottom, 12)
    }

    private func row(_ p: SettingsStudy.Page) -> some View {
        let on = page == p
        return Button { page = p } label: {
            HStack(spacing: 9) {
                if study == .a {
                    Group {
                        if p == .account {
                            AvatarView(photo: person.photo, name: person.name, size: 20)
                        } else {
                            Image(systemName: p.symbol).font(.system(size: 13)).foregroundStyle(on ? StudyInk.text : StudyInk.icon)
                        }
                    }
                    .frame(width: 20)
                }
                Text(p.title)
                    .font(.system(size: study == .b ? 14 : 13, weight: on ? .semibold : .regular))
                    .foregroundStyle(StudyInk.text)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, study == .b ? 10 : 8)
            .frame(height: study == .b ? 32 : 30)
            .background(RoundedRectangle(cornerRadius: 7, style: .continuous).fill(on ? StudyInk.selection : .clear))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    /// B: you, at the foot, lower than every page. Opens Account.
    private var you: some View {
        let on = page == .account
        return Button { page = .account } label: {
            HStack(spacing: 9) {
                AvatarView(photo: person.photo, name: person.name, size: 28)
                VStack(alignment: .leading, spacing: 1) {
                    Text(person.name).font(.system(size: 13, weight: .semibold)).foregroundStyle(StudyInk.text)
                    Text("Account").font(.system(size: 11)).foregroundStyle(StudyInk.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(on ? StudyInk.selection : .clear))
            .contentShape(.rect)
            .hoverRow(reach: EdgeInsets())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(person.name), Account")
    }
}

// MARK: Pages

/// One page of the study, in its direction's form.
struct StudyPage: View {
    let study: SettingsStudy
    let page: SettingsStudy.Page
    let person: StudyPerson
    let ais: [StudyAI]

    /// A and B's content column.
    static let column: CGFloat = 600

    var body: some View {
        VStack(alignment: .leading, spacing: study == .b ? 26 : 20) {
            if study == .b {
                VStack(alignment: .leading, spacing: 4) {
                    Text(page.title).font(.system(size: 26, weight: .bold)).foregroundStyle(StudyInk.text)
                    Text(page.job).font(.system(size: 14)).foregroundStyle(StudyInk.muted)
                }
            }
            switch page {
            case .account: StudyAccount(study: study, person: person)
            case .ai: StudyConnect(study: study, ais: ais)
            case .appearance: StudyAppearance(study: study)
            default:
                Text("Not drawn in this study.").foregroundStyle(StudyInk.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A section: a short header, then its rows: in a box (A, C) or between hairlines (B).
struct StudySection<Content: View>: View {
    let study: SettingsStudy
    var header: String? = nil
    var footer: String? = nil
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            if let header {
                Text(header)
                    .font(.system(size: study == .b ? 13 : 12, weight: .semibold))
                    .foregroundStyle(study == .b ? StudyInk.text : StudyInk.muted)
                    .padding(.leading, study == .b ? 0 : 4)
            }
            if study == .b {
                VStack(spacing: 0) {
                    StudyInk.hairline.frame(height: 0.5)
                    _VariadicView.Tree(StudyDivided()) { content }
                    StudyInk.hairline.frame(height: 0.5)
                }
            } else {
                _VariadicView.Tree(StudyDivided(inset: 14)) { content }
                    .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(StudyInk.group))
            }
            if let footer {
                Text(footer).font(.system(size: 12)).foregroundStyle(StudyInk.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, study == .b ? 0 : 4)
            }
        }
    }
}

/// Rows with a hairline between each two.
private struct StudyDivided: _VariadicView_MultiViewRoot {
    var inset: CGFloat = 0

    func body(children: _VariadicView.Children) -> some View {
        VStack(spacing: 0) {
            ForEach(children) { child in
                child.padding(.horizontal, inset)
                if child.id != children.last?.id { StudyInk.hairline.frame(height: 0.5).padding(.leading, inset) }
            }
        }
    }
}

/// A row: its name (and a line under it), and its control on the right.
struct StudyRow<Trailing: View>: View {
    let title: String
    var detail: String? = nil
    var symbol: String? = nil
    var red = false
    @ViewBuilder var trailing: Trailing

    var body: some View {
        HStack(spacing: 10) {
            if let symbol {
                Image(systemName: symbol).font(.system(size: 14)).foregroundStyle(StudyInk.icon).frame(width: 20)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 13)).foregroundStyle(red ? Color.red : StudyInk.text)
                if let detail {
                    Text(detail).font(.system(size: 11.5)).foregroundStyle(StudyInk.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 12)
            trailing
        }
        .padding(.vertical, 10)
        .frame(minHeight: 44)
    }
}

extension StudyRow where Trailing == EmptyView {
    init(title: String, detail: String? = nil, symbol: String? = nil, red: Bool = false) {
        self.init(title: title, detail: detail, symbol: symbol, red: red) { EmptyView() }
    }
}

/// A row's button: the card's own ground with a hairline, so it reads on a grey box and on the
/// page alike; a light wash under the pointer.
struct StudyButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View { Face(configuration: configuration) }

    private struct Face: View {
        let configuration: Configuration
        @State private var hovering = false
        @Environment(\.hoverPreview) private var preview

        var body: some View {
            let shape = RoundedRectangle(cornerRadius: 7, style: .continuous)
            let on = hovering || preview.contains("*")
            configuration.label
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(StudyInk.text)
                .lineLimit(1)
                .padding(.horizontal, 11)
                .frame(height: 26)
                .background(shape.fill(StudyInk.raised))
                .overlay(shape.fill(Color.primary.opacity(configuration.isPressed ? 0.1 : on ? 0.05 : 0)))
                .overlay(shape.strokeBorder(StudyInk.edge, lineWidth: 0.5))
                .shadow(color: .black.opacity(0.06), radius: 0.5, y: 0.5)
                .contentShape(shape)
                .modifier(HoverTracking(hovering: $hovering))
        }
    }
}

/// A switch on the right of a row: ink when on. Drawn here, since an offscreen window is never
/// key and AppKit's own switch draws its inactive grey there.
struct StudySwitch: View {
    @State var on: Bool

    var body: some View {
        Button { withAnimation(.snappy(duration: 0.18)) { on.toggle() } } label: {
            Capsule()
                .fill(on ? StudyInk.switchOn : StudyInk.selection)
                .frame(width: 34, height: 20)
                .overlay(alignment: on ? .trailing : .leading) {
                    Circle().fill(Color.white).frame(width: 16, height: 16).padding(2)
                        .shadow(color: .black.opacity(0.18), radius: 1, y: 0.5)
                }
        }
        .buttonStyle(.tile(radius: 10))
        .accessibilityRepresentation { Toggle("", isOn: $on) }
    }
}

/// System, Light and Dark side by side (B), in the same ink as the rest.
struct StudySegments<T: Hashable>: View {
    let items: [(String, T)]
    @Binding var selection: T

    var body: some View {
        HStack(spacing: 2) {
            ForEach(items, id: \.1) { item in
                let on = selection == item.1
                Button { selection = item.1 } label: {
                    Text(item.0).font(.system(size: 12, weight: on ? .semibold : .regular))
                        .foregroundStyle(on ? StudyInk.text : StudyInk.muted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 22)
                        .background(RoundedRectangle(cornerRadius: 6, style: .continuous).fill(on ? StudyInk.raised : .clear)
                            .shadow(color: .black.opacity(on ? 0.1 : 0), radius: 1, y: 0.5))
                        .contentShape(.rect)
                }
                .buttonStyle(.tile(radius: 6))
            }
        }
        .padding(2)
        .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(StudyInk.selection))
    }
}

// MARK: Account

private struct StudyAccount: View {
    let study: SettingsStudy
    let person: StudyPerson
    @State private var name = "Sara Lind"

    var body: some View {
        switch study {
        case .a: a
        case .b: b
        case .c: c
        }
    }

    // A: a summary box like the top of System Settings' Apple Account, then boxes of rows.
    private var a: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 14) {
                AvatarView(photo: person.photo, name: person.name, size: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text(person.name).font(.system(size: 17, weight: .semibold)).foregroundStyle(StudyInk.text)
                    Text(person.email).font(.system(size: 13)).foregroundStyle(StudyInk.muted)
                    syncLine
                }
                Spacer()
                Button("Sign Out\u{2026}") {}.buttonStyle(StudyButton())
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(StudyInk.group))
            StudySection(study: study, header: "Profile", footer: "Shown in the app and on notes you share.") {
                nameRow
                photoRow
            }
            signInSection
            dataSection
        }
    }

    // B: you as the page's opening line, rows under hairlines, the two ways out at the end.
    private var b: some View {
        VStack(alignment: .leading, spacing: 26) {
            HStack(spacing: 16) {
                AvatarView(photo: person.photo, name: person.name, size: 64)
                VStack(alignment: .leading, spacing: 4) {
                    Text(person.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(StudyInk.text)
                    Text(person.email).font(.system(size: 13)).foregroundStyle(StudyInk.muted)
                    Menu("Edit photo") { Button("Choose Photo\u{2026}") {} }
                        .menuStyle(.button).buttonStyle(.hoverText).menuIndicator(.hidden).fixedSize()
                        .font(.system(size: 13, weight: .medium)).foregroundStyle(StudyInk.text)
                }
            }
            StudySection(study: study, header: "Profile", footer: "Your name is shown in the app and on notes you share.") {
                nameRow
            }
            signInSection
            dataSection
        }
    }

    // C: a summary card that is the page's focus, then one box of the rest.
    private var c: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 18) {
                AvatarView(photo: person.photo, name: person.name, size: 72)
                    .overlay(alignment: .bottomTrailing) {
                        Image(systemName: "camera.fill").font(.system(size: 10, weight: .semibold)).foregroundStyle(StudyInk.text)
                            .frame(width: 24, height: 24).background(Circle().fill(StudyInk.ground)).overlay(Circle().strokeBorder(StudyInk.hairline))
                    }
                VStack(alignment: .leading, spacing: 4) {
                    Text(person.name).font(.system(size: 20, weight: .bold)).foregroundStyle(StudyInk.text)
                    Text(person.email).font(.system(size: 13)).foregroundStyle(StudyInk.muted)
                    syncLine.padding(.top, 2)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    Button("Sync Now") {}.buttonStyle(StudyButton())
                    Button("Sign Out\u{2026}") {}.buttonStyle(.quiet)
                }
            }
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(StudyInk.group))
            StudySection(study: study) {
                nameRow
                StudyRow(title: "Sign in with Apple", detail: "Sign in on every device without a password.") {
                    Button("Continue with Apple") {}.buttonStyle(StudyButton())
                }
                StudyRow(title: "Export your notes", detail: "Every note as a Markdown file in its folder, with its files.") {
                    Button("Export\u{2026}") {}.buttonStyle(StudyButton())
                }
            }
            StudySection(study: study) {
                StudyRow(title: "Delete account", detail: "Deletes your account and every note in it. Export first.") {
                    Button {} label: { Text("Delete Account\u{2026}").foregroundStyle(.red) }.buttonStyle(StudyButton())
                }
            }
        }
    }

    private var syncLine: some View {
        HStack(spacing: 5) {
            Image(systemName: "checkmark.icloud").font(.system(size: 11))
            Text("Synced a minute ago")
        }
        .font(.system(size: 12))
        .foregroundStyle(StudyInk.muted)
    }

    private var nameRow: some View {
        StudyRow(title: "Name") {
            TextField("Name", text: $name).textFieldStyle(.plain).multilineTextAlignment(.trailing)
                .font(.system(size: 13)).foregroundStyle(StudyInk.text).frame(width: 220)
        }
    }

    private var photoRow: some View {
        StudyRow(title: "Photo") {
            HStack(spacing: 8) {
                Button("Remove") {}.buttonStyle(.quiet)
                Button("Choose\u{2026}") {}.buttonStyle(StudyButton())
            }
        }
    }

    private var signInSection: some View {
        StudySection(study: study, header: "Sign in and sync") {
            StudyRow(title: "Sync", detail: "Up to date. Your notes are the same on every device.") {
                Button("Sync Now") {}.buttonStyle(StudyButton())
            }
            StudyRow(title: "Sign in with Apple", detail: "Sign in on every device without a password.") {
                Button("Continue with Apple") {}.buttonStyle(StudyButton())
            }
            if study == .b {
                StudyRow(title: "Sign out of this Mac", detail: "Your notes stay in your account.") {
                    Button("Sign Out\u{2026}") {}.buttonStyle(StudyButton())
                }
            }
        }
    }

    private var dataSection: some View {
        StudySection(study: study, header: "Your notes") {
            StudyRow(title: "Export your notes", detail: "Every note as a Markdown file in its folder, with its files.") {
                Button("Export\u{2026}") {}.buttonStyle(StudyButton())
            }
            StudyRow(title: "Delete account", detail: "Deletes your account and every note in it.") {
                Button {} label: { Text("Delete Account\u{2026}").foregroundStyle(.red) }.buttonStyle(StudyButton())
            }
        }
    }
}

// MARK: Connect an AI

/// The AI's mark on a small tile in its brand ground (ChatGPT black, Claude's orange is the mark).
private struct StudyMark: View {
    let ai: String
    var size: CGFloat = 30

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
        Group {
            if ai == "Another AI" {
                Image(systemName: "plus").font(.system(size: size * 0.42, weight: .medium)).foregroundStyle(StudyInk.icon)
                    .frame(width: size, height: size)
                    .overlay(shape.strokeBorder(StudyInk.hairline, style: StrokeStyle(lineWidth: 1, dash: [3, 2])))
            } else {
                AITile(ai: ai, size: size)
            }
        }
    }
}

private struct StudyConnect: View {
    let study: SettingsStudy
    let ais: [StudyAI]

    var body: some View {
        switch study {
        case .a: a
        case .b: b
        case .c: c
        }
    }

    /// Never behind a disclosure: what is sent and to whom.
    private var sent: some View {
        Label {
            Text(StudyAI.sent(ais)).fixedSize(horizontal: false, vertical: true)
        } icon: {
            Image(systemName: "arrow.up.forward.circle")
        }
        .font(.system(size: 12.5))
        .foregroundStyle(StudyInk.muted)
        .accessibilityIdentifier("connect.sent")
    }

    // A: a summary box, your AIs as rows, every other AI as rows with Connect.
    private var a: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 12) {
                    HStack(spacing: -8) { ForEach(ais) { StudyMark(ai: $0.name, size: 34) } }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("ChatGPT and Claude can open your notes").font(.system(size: 15, weight: .semibold)).foregroundStyle(StudyInk.text)
                        Text("Only when you ask them to. Disconnect anytime.").font(.system(size: 12.5)).foregroundStyle(StudyInk.muted)
                    }
                }
                StudyInk.hairline.frame(height: 0.5)
                sent
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(StudyInk.group))
            StudySection(study: study, header: "Connected") {
                ForEach(ais) { ai in
                    HStack(spacing: 12) {
                    StudyMark(ai: ai.name, size: 26)
                    StudyRow(title: ai.name, detail: "\(ai.since). \(ai.used).") {
                        HStack(spacing: 6) {
                            Button("Changes") {}.buttonStyle(.quiet)
                            Button("Disconnect\u{2026}") {}.buttonStyle(StudyButton())
                        }
                    }
                    }
                }
            }
            StudySection(study: study, header: "Add an AI") {
                ForEach(StudyAI.more, id: \.0) { ai in
                    HStack(spacing: 12) {
                    StudyMark(ai: ai.0, size: 26)
                    StudyRow(title: ai.0, detail: ai.0 == "Another AI" ? ai.1 : "Made by \(ai.1)") {
                        Button("Connect\u{2026}") {}.buttonStyle(StudyButton())
                    }
                    }
                }
            }
        }
    }

    // B: the page's opening line is what is sent; your AIs, then the others as brand buttons.
    private var b: some View {
        VStack(alignment: .leading, spacing: 26) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "arrow.up.forward.circle").font(.system(size: 15)).foregroundStyle(StudyInk.icon)
                Text(StudyAI.sent(ais)).font(.system(size: 13.5)).foregroundStyle(StudyInk.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
            StudySection(study: study, header: "Your AIs") {
                ForEach(ais) { ai in
                    HStack(spacing: 12) {
                        AIGlyph(ai: ai.name, size: 20).frame(width: 26)
                        StudyRow(title: ai.name, detail: "\(ai.used). \(ai.since).") {
                            Menu {
                                Button("See Changes") {}
                                Button("Disconnect\u{2026}", role: .destructive) {}
                            } label: { Image(systemName: "ellipsis").font(.system(size: 13, weight: .semibold)) }
                                .menuStyle(.button).buttonStyle(.quietIcon(padding: 6)).menuIndicator(.hidden).fixedSize()
                                .foregroundStyle(StudyInk.icon)
                        }
                    }
                }
            }
            VStack(alignment: .leading, spacing: 10) {
                Text("Connect another").font(.system(size: 13, weight: .semibold)).foregroundStyle(StudyInk.text)
                HStack(spacing: 8) {
                    ForEach(StudyAI.more, id: \.0) { ai in
                        Button {} label: {
                            HStack(spacing: 7) {
                                if ai.0 == "Another AI" { Image(systemName: "plus") } else { AIGlyph(ai: ai.0, size: 15, monochrome: true) }
                                Text(ai.0)
                            }
                        }
                        .buttonStyle(StudyButton())
                    }
                }
                Text("Your AI can read and edit your notes when you ask. Disconnect anytime.")
                    .font(.system(size: 12)).foregroundStyle(StudyInk.muted)
            }
        }
    }

    // C: the summary card shows who has access, big; tiles to add one; the line under them.
    private var c: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 14) {
                    ForEach(ais) { ai in
                        HStack(spacing: 10) {
                            StudyMark(ai: ai.name, size: 38)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(ai.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(StudyInk.text)
                                Text(ai.used).font(.system(size: 12)).foregroundStyle(StudyInk.muted)
                            }
                        }
                        .padding(.trailing, 14)
                    }
                    Spacer()
                    Button("Manage") {}.buttonStyle(StudyButton())
                }
                sent
            }
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(StudyInk.group))
            VStack(alignment: .leading, spacing: 10) {
                Text("Add an AI").font(.system(size: 12, weight: .semibold)).foregroundStyle(StudyInk.muted).padding(.leading, 4)
                HStack(spacing: 10) {
                    ForEach(StudyAI.more, id: \.0) { ai in
                        Button {} label: {
                            VStack(spacing: 8) {
                                StudyMark(ai: ai.0, size: 36)
                                Text(ai.0).font(.system(size: 13, weight: .medium)).foregroundStyle(StudyInk.text)
                                Text(ai.0 == "Another AI" ? "Cursor, VS Code" : ai.1).font(.system(size: 11)).foregroundStyle(StudyInk.muted)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(StudyInk.hairline))
                            .contentShape(.rect)
                        }
                        .buttonStyle(.tile(radius: 12))
                    }
                }
            }
        }
    }
}

// MARK: Appearance

/// A picture of the notes window in a theme, light or dark: the sidebar, the list and a note.
struct StudyWindowPicture: View {
    let theme: Theme
    let dark: Bool
    var accent: Color? = nil

    var body: some View {
        let c = theme.preview
        func color(_ h: Theme.Hex) -> Color { let v = dark ? h.dark : h.light; return Color(Palette.pair(v, v)) }
        return GeometryReader { geo in
            let w = geo.size.width
            HStack(spacing: 0) {
                VStack(alignment: .leading, spacing: w * 0.025) {
                    ForEach(0..<4) { i in
                        HStack(spacing: w * 0.012) {
                            Circle().fill(i == 0 ? (accent ?? color(c.accent)) : color(c.muted)).frame(width: w * 0.022)
                            Capsule().fill(color(c.muted).opacity(0.7)).frame(width: w * 0.09, height: w * 0.014)
                        }
                    }
                }
                .padding(w * 0.03)
                .frame(width: w * 0.22, alignment: .topLeading)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(color(c.sidebar))
                VStack(alignment: .leading, spacing: w * 0.03) {
                    ForEach(0..<3) { i in
                        RoundedRectangle(cornerRadius: w * 0.01).fill(i == 0 ? color(c.selection) : .clear)
                            .frame(height: w * 0.07)
                            .overlay(alignment: .leading) {
                                VStack(alignment: .leading, spacing: w * 0.01) {
                                    Capsule().fill(color(c.ink)).frame(width: w * 0.12, height: w * 0.014)
                                    Capsule().fill(color(c.muted)).frame(width: w * 0.08, height: w * 0.01)
                                }
                                .padding(.leading, w * 0.015)
                            }
                    }
                }
                .padding(w * 0.02)
                .frame(width: w * 0.26)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(color(c.list))
                color(c.line).frame(width: 0.5)
                VStack(alignment: .leading, spacing: w * 0.02) {
                    Capsule().fill(color(c.ink)).frame(width: w * 0.2, height: w * 0.024)
                    ForEach(0..<2) { _ in Capsule().fill(color(c.muted)).frame(width: w * 0.36, height: w * 0.012) }
                    HStack(spacing: w * 0.012) {
                        RoundedRectangle(cornerRadius: 2).fill(accent ?? color(c.accent)).frame(width: w * 0.02, height: w * 0.02)
                        Capsule().fill(color(c.muted)).frame(width: w * 0.22, height: w * 0.012)
                    }
                    RoundedRectangle(cornerRadius: w * 0.01).fill(color(c.code)).frame(width: w * 0.4, height: w * 0.06)
                }
                .padding(w * 0.04)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(color(c.page))
            }
        }
    }
}

private struct StudyAppearance: View {
    let study: SettingsStudy
    @State private var mode = AppearanceModeStore.shared.mode
    @State private var theme = ThemeStore.shared.look.theme
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        switch study {
        case .a: a
        case .b: b
        case .c: c
        }
    }

    private var look: ThemeLook { ThemeLook(theme: theme, accent: ThemeStore.shared.look.accent) }

    /// A choice drawn as a picture with its name under it; the chosen one ringed. `orange`: the
    /// page's one orange control.
    private func picture(_ title: String, selected: Bool, orange: Bool, height: CGFloat, @ViewBuilder _ art: () -> some View, pick: @escaping () -> Void) -> some View {
        let shape = RoundedRectangle(cornerRadius: 8, style: .continuous)
        return Button(action: pick) {
            VStack(spacing: 6) {
                art()
                    .frame(height: height)
                    .clipShape(shape)
                    .overlay(shape.strokeBorder(StudyInk.hairline, lineWidth: 1))
                    .padding(3)
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(selected ? (orange ? Color(PColor.paneAccent) : StudyInk.text) : .clear, lineWidth: 2))
                Text(title).font(.system(size: 12, weight: selected ? .semibold : .regular))
                    .foregroundStyle(selected ? StudyInk.text : StudyInk.muted)
            }
            .contentShape(.rect)
        }
        .buttonStyle(.tile(radius: 10))
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func modePicture(_ m: AppearanceMode) -> some View {
        Group {
            switch m {
            case .light: StudyWindowPicture(theme: theme, dark: false)
            case .dark: StudyWindowPicture(theme: theme, dark: true)
            case .system:
                StudyWindowPicture(theme: theme, dark: false).overlay {
                    GeometryReader { geo in
                        StudyWindowPicture(theme: theme, dark: true).mask(alignment: .trailing) { Rectangle().frame(width: geo.size.width / 2) }
                    }
                }
            }
        }
    }

    private var modes: some View {
        HStack(spacing: 14) {
            ForEach(AppearanceMode.allCases) { m in
                picture(m.title, selected: mode == m, orange: true, height: 74, { modePicture(m) }) { mode = m }
            }
        }
    }

    private var themes: some View {
        HStack(spacing: 12) {
            ForEach(Theme.allCases) { t in
                picture(t.title, selected: theme == t, orange: false, height: 46, { StudyWindowPicture(theme: t, dark: false) }) { theme = t }
            }
        }
    }

    private var accentRow: some View {
        StudyRow(title: "Accent", detail: look.accent.spokenName) {
            HStack(spacing: 6) {
                ForEach(AccentChoice.allCases) { choice in
                    AccentDot(choice: choice, theme: theme, selected: look.accent == choice, style: .row) {}
                }
            }
        }
    }

    private var menuBarRow: some View {
        StudyRow(title: "Show in menu bar", detail: "Capture or find a note from the menu bar.") { StudySwitch(on: true) }
    }

    // A: System Settings' own Appearance: mode pictures in a box, then rows.
    private var a: some View {
        VStack(alignment: .leading, spacing: 20) {
            StudySection(study: study, header: "Mode") {
                modes.padding(.vertical, 14)
            }
            StudySection(study: study, header: "Theme", footer: "Set on each device.") {
                themes.padding(.vertical, 14)
                accentRow
            }
            StudySection(study: study, header: "Menu bar") {
                menuBarRow
            }
        }
    }

    // B: one big picture of the app as you've set it, the choices as plain rows under it.
    private var b: some View {
        VStack(alignment: .leading, spacing: 26) {
            StudyWindowPicture(theme: theme, dark: mode == .dark || (mode == .system && scheme == .dark))
                .frame(height: 190)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(StudyInk.hairline))
            StudySection(study: study, header: "Look", footer: "Set on each device.") {
                StudyRow(title: "Mode") {
                    StudySegments(items: AppearanceMode.allCases.map { ($0.title, $0) }, selection: $mode).frame(width: 220)
                }
                StudyRow(title: "Theme") {
                    Menu(theme.title) { ForEach(Theme.allCases) { t in Button(t.title) { theme = t } } }
                        .menuStyle(.button).buttonStyle(StudyButton()).fixedSize()
                }
                accentRow
            }
            StudySection(study: study, header: "Menu bar") {
                menuBarRow
            }
        }
    }

    // C: the summary is the choice itself: big mode pictures; themes as a strip; one box of rows.
    private var c: some View {
        VStack(alignment: .leading, spacing: 22) {
            HStack(spacing: 18) {
                ForEach(AppearanceMode.allCases) { m in
                    picture(m.title, selected: mode == m, orange: true, height: 110, { modePicture(m) }) { mode = m }
                }
            }
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(StudyInk.group))
            VStack(alignment: .leading, spacing: 10) {
                Text("Theme").font(.system(size: 12, weight: .semibold)).foregroundStyle(StudyInk.muted).padding(.leading, 4)
                themes
            }
            StudySection(study: study) {
                accentRow
                menuBarRow
            }
        }
    }
}

// MARK: The account menu

/// Emil, 3 November 2026: the account row at the foot of the notes window's sidebar could open a
/// menu, splitting you from Settings (as ChatGPT, Claude and Slack do). A native menu can't be
/// drawn offscreen, so this draws one as macOS draws its menus: you at the top, then Settings…
/// (⌘,), Account, Help and feedback, Sign Out.
struct AccountMenuStudy: View {
    var person = StudyPerson()
    /// The row drawn under the pointer, as a menu's highlight.
    var highlighted: String? = "Settings\u{2026}"

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                AvatarView(photo: person.photo, name: person.name, size: 32)
                VStack(alignment: .leading, spacing: 1) {
                    Text(person.name).font(.system(size: 13, weight: .semibold))
                    Text(person.email).font(.system(size: 12)).foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.top, 6)
            .padding(.bottom, 8)
            separator
            item("Settings\u{2026}", symbol: "gearshape", key: "\u{2318},")
            item("Account", symbol: "person.crop.circle")
            item("Help and feedback", symbol: "questionmark.circle")
            separator
            item("Sign Out\u{2026}", symbol: "rectangle.portrait.and.arrow.right")
        }
        .padding(5)
        .frame(width: 236)
        .background {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(StudyInk.dynamic(NSColor(white: 0.985, alpha: 1), NSColor(white: 0.13, alpha: 1)))
                .shadow(color: .black.opacity(0.18), radius: 14, y: 6)
        }
        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(StudyInk.edge, lineWidth: 0.5))
        .font(.system(size: 13))
        .foregroundStyle(StudyInk.text)
    }

    private var separator: some View {
        StudyInk.hairline.frame(height: 1).padding(.horizontal, 10).padding(.vertical, 5)
    }

    private func item(_ title: String, symbol: String, key: String? = nil) -> some View {
        let on = title == highlighted
        return HStack(spacing: 8) {
            Image(systemName: symbol).font(.system(size: 13)).frame(width: 18)
            Text(title)
            Spacer()
            if let key { Text(key).foregroundStyle(on ? AnyShapeStyle(Color.white.opacity(0.8)) : AnyShapeStyle(.secondary)) }
        }
        .foregroundStyle(on ? Color.white : StudyInk.text)
        .padding(.horizontal, 9)
        .frame(height: 24)
        // A menu's highlight is the system accent on macOS; the app's own here would be a second
        // orange, so it takes the neutral one menus use with a graphite accent.
        .background(RoundedRectangle(cornerRadius: 5, style: .continuous).fill(on ? Color(nsColor: NSColor(white: 0.45, alpha: 1)) : .clear))
    }
}
#endif
