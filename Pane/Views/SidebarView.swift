import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// What to call the signed-in person where the app shows who they are: the name on their profile.
/// Never an email address: with Sign in with Apple that can be a relay address
/// ("f7k6w27tsh@privaterelay.appleid.com"), which is nobody's name.
enum AccountName {
    static let fallback = "Your account"

    static func shown(_ profileName: String?) -> String {
        let name = profileName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        // A name that is an email address (typed in, or copied there by an older build) isn't shown either.
        return name.isEmpty || name.contains("@") ? fallback : name
    }

    /// Whether there is a name to draw initials from; without one the avatar shows a person.
    static func isSet(_ profileName: String?) -> Bool { shown(profileName) != fallback }
}

#if os(macOS)
/// The account at the foot of the sidebar, like the Mac App Store's: your photo (or initials) in a
/// circle and your name. Clicking it opens Settings at Account (Emil, 6 November 2026: the menu it
/// used to open said nothing Settings doesn't). It never opens Connect an AI.
struct AccountButton: View {
    let backend: Backend
    /// Captures: a second line with the email, when it is a real one (the alternative look).
    var email: String?
    /// While sync is away: the status is the second line under your name, with a cloud beside the
    /// name, and the whole row opens its popover (Settings is still at ⌘,).
    var offline: (source: any OfflineSource, status: OfflineStatus)?
    @State private var profile = ProfileStore.shared

    static let avatar: CGFloat = 28
    /// Inside its highlight: the photo starts as far in as a folder row's icon starts inside its pill.
    static let inset = Hover.sidebarReach().leading

    private var name: String { AccountName.shown(profile.name) }

    /// Settings at Account, whatever page was shown last: the button is you (Emil, 7 November 2026:
    /// it opened AI Connections). ⌘, still reopens the last page.
    static func open(_ route: SettingsRoute = .shared) { route.open(.account) }

    /// A click on the row: Settings at Account, or, while sync is away, what that means (the popover).
    func activate(_ route: SettingsRoute = .shared) {
        if let offline { offline.status.toggle() } else { Self.open(route) }
    }

    var body: some View {
        let away = offline.map { $0.status.spoken($0.source.reach) }
        return Button {
            activate()
        } label: {
            HStack(spacing: SidebarFoot.gap) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? name : nil, size: Self.avatar)
                VStack(alignment: .leading, spacing: 1) {
                    HStack(spacing: 6) {
                        Text(name)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .truncationMode(.tail)
                            #if DEBUG || QA
                            .footProbe("sidebar.account.name")
                            #endif
                        if let away {
                            // On your name's line, so the words under it have the row's whole width.
                            Spacer(minLength: 0)
                            OfflineCloud(reach: away)
                                #if DEBUG || QA
                                .footProbe("sidebar.offline.cloud")
                                #endif
                        }
                    }
                    if let away {
                        OfflineWords(reach: away)
                            .font(.system(size: 11))
                            .foregroundStyle(Color.muted)
                            #if DEBUG || QA
                            .footProbe("sidebar.offline.title")
                            #endif
                    } else if let email {
                        Text(email)
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                            .privateBlur(email)
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(height: Self.avatar)
            // A folder row's pill: the same fill, corners and reach (`Hover.sidebarReach`), so the
            // photo starts on the folder icons' line and the highlight lines up with theirs.
            .sidebarFootPill("sidebar.account")
        }
        .buttonStyle(.plain)
        .popover(isPresented: Binding(get: { offline?.status.showing ?? false }, set: { now in
            offline?.status.showing = now
            if !now { offline?.status.closed() }
        }), arrowEdge: .trailing) {
            if let offline { OfflinePopover(source: offline.source, status: offline.status) }
        }
        .onChange(of: offline?.source.reach, initial: true) { _, now in
            if let now { offline?.status.noticed(now) }
        }
        .help(away.map { OfflineCopy.title($0) } ?? "Account settings")
        .accessibilityLabel(away.flatMap { OfflineCopy.line($0) }.map { "\(name). \($0). More about this" } ?? "\(name), Settings")
        .accessibilityIdentifier("sidebar.account")
        .task(id: backend.state) { await profile.bind(backend) }
    }
}

/// Menu items that run a closure (your photo's menu in Settings).
@MainActor
enum AccountMenu {
    /// A menu item that runs a closure.
    final class Item: NSMenuItem {
        private let run: () -> Void

        init(_ title: String, symbol: String, key: String = "", run: @escaping () -> Void) {
            self.run = run
            super.init(title: title, action: #selector(fire), keyEquivalent: key)
            target = self
            image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)
            if !key.isEmpty { keyEquivalentModifierMask = .command }
        }

        required init(coder: NSCoder) { fatalError("not used") }

        @objc func fire() { run() }
    }
}

/// Where a native menu opens from: the NSView behind a SwiftUI row.
@MainActor final class MenuAnchor {
    weak var view: NSView?
}

struct MenuAnchorView: NSViewRepresentable {
    let anchor: MenuAnchor
    func makeNSView(context: Context) -> NSView {
        let v = NSView()
        anchor.view = v
        return v
    }
    func updateNSView(_ view: NSView, context: Context) { anchor.view = view }
}
#endif

#if os(macOS)
/// The app's name and mark at the top of the sidebar.
struct SidebarHeader: View {
    /// Where the mark starts: the rows' icons' left edge (`SidebarStyle.edge`).
    var leading = SidebarStyle.edge(nested: false)

    var body: some View {
        HStack(spacing: 8) {
            AppMark(size: 21)
            // The website's display type: heavy and tight.
            Text("Pinto Notes").font(.display(15)).tracking(Palette.tracking(15)).foregroundStyle(Color.ink)
            Spacer(minLength: 0)
        }
        .padding(.leading, leading)
        .padding(.top, 2)
        .padding(.bottom, 14)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}
#endif

/// A sidebar row's name and what trails it (its count). At the accessibility text sizes on iPhone
/// and iPad the count goes under the name and the icon steps aside, so the name has the row's
/// width and breaks between words instead of between letters.
struct SidebarRowText<Trailing: View>: View {
    let title: String
    /// On the Mac the selected row's name takes the accent (its fill is neutral), like Notes.
    var selected = false
    @ViewBuilder var trailing: Trailing
    @Environment(\.dynamicTypeSize) private var typeSize
    #if os(iOS)
    @Environment(\.stackedNotes) private var stacked
    #endif

    var body: some View {
        #if os(iOS)
        if typeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                trailing
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            beside
        }
        #else
        beside
        #endif
    }

    @ViewBuilder private var beside: some View {
        #if os(macOS)
        // At the standard size, the list's own font.
        if TextSize.interfaceScale > 1 {
            row.font(.system(size: TextSize.interface(13)))
        } else {
            row
        }
        #else
        row
        #endif
    }

    private var row: some View {
        HStack {
            #if os(macOS)
            Text(title).foregroundStyle(selected ? AnyShapeStyle(.tint) : AnyShapeStyle(.primary))
            #else
            // As columns, the Mac's: the selected folder's name in the accent on a grey pill.
            Text(title).foregroundStyle(!stacked && selected ? AnyShapeStyle(Color(PColor.paneAccent)) : AnyShapeStyle(.primary))
            #endif
            Spacer()
            #if os(macOS)
            // One column for every row's count and its ••• under the pointer, their right edges on
            // one line, and as far in from the selection's edge as the icon is on the left.
            trailing.frame(minWidth: SidebarStyle.trailingColumn * TextSize.interfaceScale, alignment: .trailing).padding(.trailing, SidebarStyle.trailingInset)
            #else
            trailing
            #endif
        }
    }
}

private struct SidebarRowLabel: ViewModifier {
    @Environment(\.dynamicTypeSize) private var typeSize

    func body(content: Content) -> some View {
        #if os(iOS)
        if typeSize.isAccessibilitySize {
            content.labelStyle(.titleOnly)
        } else {
            content
        }
        #else
        // Like Notes: 6 pt from the icon to the name (the system's sidebar leaves about 8).
        content.labelStyle(SidebarLabelStyle())
        #endif
    }
}

#if os(macOS)
private struct SidebarLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 6) {
            configuration.icon.frame(minWidth: 19)
            configuration.title
        }
    }
}
#endif

extension View {
    func sidebarRowLabel() -> some View { modifier(SidebarRowLabel()) }
}

enum SidebarStyle {
    /// iPhone: your photo at the top left of the folders. As big as the bar's round glass buttons,
    /// filling the same 44 pt target, so its edge sits as far from the screen's as theirs (Emil,
    /// 11 November 2026: a 38 pt photo in it sat 3 pt further in and looked smaller).
    static let phonePhoto: CGFloat = 44
    #if os(macOS)
    static var iconFont: Font { .system(size: TextSize.interface(17), weight: .regular) }
    /// The candidates' icon (DesignLook, DESIGN.md Icons): medium, and smaller and lighter than the
    /// name beside it, so the names lead.
    static let candidateIconFont = Font.system(size: 14, weight: .medium)
    /// The rows' icons' left edge from the sidebar's own: where the title's mark, the Folders
    /// heading and the account's photo start too, so they all share one line (owner, 2026-10-12:
    /// three edges a few points apart). Measured from the list as AppKit lays it out: the icon of
    /// a row sits 28.5 pt in, past the column the outline keeps for the arrows, and the section
    /// heading's text sits 15 pt in. The column is always there: every folder's row can open
    /// (`FolderTree.body`), so `nested` no longer moves anything (it was 21 pt without sub-folders,
    /// and everything shifted when the first came).
    static func edge(nested: Bool) -> CGFloat { 28.5 }
    static let headingInset: CGFloat = 15
    static let trailingColumn: CGFloat = 16
    static let trailingInset: CGFloat = 7
    /// New Folder's plus on the Folders heading: its target, and the room to its right that puts
    /// its centre on the middle of a count's last digit.
    static let plusTarget: CGFloat = 22
    static let plusTrailing: CGFloat = 19.5
    /// Where the list puts a row's content in the sidebar's glass: 16 pt in from either side, the
    /// icon first, 9 pt further in for the arrows' column (measured 2026-10-29, macOS 26;
    /// `AccountRowTests` measures it again from the list), which the list always keeps (see `edge`).
    static func rowContent(nested: Bool) -> (leading: CGFloat, trailing: CGFloat) { (16 + Hover.sidebarArrowRoom, 16) }
    /// A top-level row's pill, from the sidebar's edges: its content, widened by `Hover.sidebarReach`.
    static func rowPill(nested: Bool) -> (leading: CGFloat, trailing: CGFloat) {
        let content = rowContent(nested: nested), reach = Hover.sidebarReach()
        return (content.leading - reach.leading, content.trailing - reach.trailing)
    }
    /// A folder row's pill is 30.5 pt tall in a 32 pt row: a hairline between neighbours.
    static let pillGap: CGFloat = 1.5
    #else
    static let icon = TintShapeStyle.tint
    static let iconFont = Font.body
    #endif
}

/// A folder icon in the sidebar. Notes on the Mac draws them in the text colour, and in a
/// window that isn't in front they fade with their names; iOS tints them.
struct SidebarIcon: View {
    let name: String
    /// The selected row's icon takes the accent with its name.
    var selected = false
    #if os(macOS)
    @Environment(\.controlActiveState) private var active
    #else
    @Environment(\.stackedNotes) private var stacked
    #endif

    var body: some View {
        Image(systemName: name)
            #if os(macOS)
            .font(DesignLook.isCandidate ? SidebarStyle.candidateIconFont : SidebarStyle.iconFont)
            .foregroundStyle(selected ? AnyShapeStyle(.tint) : active == .inactive ? AnyShapeStyle(.tertiary)
                : DesignLook.isCandidate ? AnyShapeStyle(Color.muted) : AnyShapeStyle(.primary))
            .frame(minWidth: DesignLook.isCandidate ? 20 : nil)
            #else
            .font(SidebarStyle.iconFont)
            // As columns, the Mac's: grey icons, the selected folder's in the accent.
            .foregroundStyle(stacked ? AnyShapeStyle(SidebarStyle.icon) : selected ? AnyShapeStyle(Color(PColor.paneAccent)) : AnyShapeStyle(Color.muted))
            #endif
    }
}

/// What VoiceOver says for a sidebar row.
enum SidebarRowWords {
    static func spoken(_ name: String, count: Int, files: Int = 0) -> String {
        let notes = count == 1 ? "1 note" : "\(count) notes"
        return "\(name), " + (files == 0 ? notes : notes + (files == 1 ? ", 1 file" : ", \(files) files"))
    }
}

extension View {
    /// One element per sidebar row, read as "Travel, 4 notes". Without it VoiceOver reads the
    /// folder symbol's own name ("Move") before the row's.
    func rowAccessibility(_ name: String, count: Int, files: Int = 0) -> some View {
        // In the label: the Mac's outline dropped a value on these rows (round 17's accessibility dump).
        return accessibilityElement(children: .ignore)
            .accessibilityLabel(SidebarRowWords.spoken(name, count: count, files: files))
            // A label alone made an element of no known role (round 22's dump: AXUnknown).
            .accessibilityAddTraits(.isStaticText)
    }
}

extension Notification.Name {
    /// Asks the sidebar to start a new folder (from the list's "⋯" menu).
    static let paneNewFolder = Notification.Name("pane.newFolder")
    /// Delete these notes (a Set of ids), already asked about: the list does it and opens the neighbour.
    static let paneDeleteNotes = Notification.Name("pane.deleteNotes")
    /// A folder's Rename (its id in `object`), from outside its menus: the Mac opens its name in its row.
    static let paneRenameFolder = Notification.Name("pane.renameFolder")
    /// Delete Folder for the folder whose id is the object, as its menu does: asks first when it holds anything.
    static let paneDeleteFolder = Notification.Name("pane.deleteFolder")
}

struct SidebarView: View {
    #if os(macOS)
    #endif
    @Environment(\.behindSetupCard) private var behindSetupCard
    @Environment(\.modelContext) private var context
    @Environment(\.openWindow) private var openWindow
    @Binding var scope: Scope?
    let onNewNote: () -> Void
    /// A note found by the folders screen's search (iPhone): it opens in its folder.
    var onOpenNote: (UUID) -> Void = { _ in }
    /// New Note from a folder's menu: a note in that folder, open and ready to type.
    var onNewNoteIn: (UUID) -> Void = { _ in }

    @Query(filter: #Predicate<Folder> { $0.deletedAt == nil }, sort: \Folder.sortIndex) private var folders: [Folder]
    /// At most one file: this query is here so the sidebar updates whenever a file kept in a
    /// folder changes. The counts come from the store (`fileCounts`). What follows every note
    /// is in the two rows that count notes (`CountedRow`), not here: here it worked out every
    /// folder row five times for each save while you type (now once).
    @Query(SidebarView.anyFile) private var fileChanges: [Attachment]
    private static var anyFile: FetchDescriptor<Attachment> {
        var d = FetchDescriptor<Attachment>()
        d.fetchLimit = 1
        return d
    }

    /// The window's notes as the list keeps them (RootView): the counted rows and the folders' counts
    /// come from there. A sidebar on its own keeps its own.
    @Environment(LibraryNotes.self) private var windowLibrary: LibraryNotes?
    @State private var ownLibrary = LibraryNotes()
    @State private var renaming: Folder?
    /// Mac: the folder whose name is being typed in its row (a new one, or Rename).
    @State private var namingFolder: UUID?
    /// Mac: New Folder found the account at the server's folder limit.
    @State private var folderLimitReached = false
    @State private var newFolderParent: Folder??
    @State private var nameDraft = ""
    @State private var drops = FolderDropState()
    /// A folder dragged over the "Folders" heading: dropped there it goes to the top level.
    @State private var headingOver = false
    @State private var deletingFolder: Folder?
    /// Folders picked together with ⌘ or ⇧ (Mac), beside the one shown: Delete takes them all.
    @State private var picked: Set<UUID> = []
    /// The folder shown in place of All Notes while there's only one (see `Scope.settled`).
    @State private var standIn: UUID?
    /// Several picked folders waiting on Delete's question.
    @State private var deletingFolders: [Folder] = []
    @State private var showSettings = false
    /// The folder whose Move is open (iPhone): where it goes, picked in a sheet.
    @State private var movingFolder: Folder?
    /// The folders screen's Edit (iPhone): rows to reorder, each with its ••• menu.
    @State private var editingFolders = false
    /// A card at the foot was closed in this window (it's also kept per account, and on the server).
    @State private var cardsClosedHere: Set<SidebarCard> = []
    @State private var sidebarHeight: CGFloat = 0
    #if os(iOS)
    /// The folders screen's search: every note, as in Notes.
    @State private var search = ""
    /// One screen at a time (iPhone), or the folders as a column beside the list (iPad, iPhone Duo open).
    @Environment(\.stackedNotes) private var stacked
    @Environment(\.besideNote) private var besideNote
    #endif
    @Environment(SetupStore.self) private var setup: SetupStore?
    @Environment(\.dynamicTypeSize) private var templatesTypeSize
    @Environment(\.importActions) private var imports
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    /// The notebook film's card, while it's offered: above the others, in their place.
    @Environment(NotebookFilmStore.self) private var film: NotebookFilmStore?

    /// All Notes and Recently Deleted, counted by the store (unsaved changes included), as the list
    /// shows them.
    static func counts(in context: ModelContext) -> (live: Int, trashed: Int) {
        let live = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? 0
        let trashed = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt != nil }))) ?? 0
        return (live, trashed)
    }

    /// Whether "All Notes" gets its row: with more than one folder, or when a note is in none (an
    /// AI's note at the top of the notebook: with one folder it was in no list at all, round 15).
    static func showsAllNotes(folders: Int, context: ModelContext) -> Bool {
        if folders > 1 { return true }
        let loose = #Predicate<Note> { (n: Note) -> Bool in n.folder == nil && n.deletedAt == nil && n.trashedAt == nil }
        return ((try? context.fetchCount(FetchDescriptor<Note>(predicate: loose))) ?? 0) > 0
    }

    /// A folder's notes as its list counts them. In a window the list's notes count them
    /// (LibraryNotes.listedCount); this reads the folder's own notes.
    static func listedNotes(in folder: Folder, context: ModelContext) -> Int {
        folder.liveNotes.count
    }

    private var files: (live: Int, trashed: Int, byFolder: [UUID: Int]) {
        _ = fileChanges
        return Self.fileCounts(in: context)
    }

    /// Files kept in folders: how many are live and in Recently Deleted, and how many live ones each
    /// folder holds. Counted by the store; only when there are files are their folders looked up,
    /// so a library without folder files pays for two counts.
    static func fileCounts(in context: ModelContext) -> (live: Int, trashed: Int, byFolder: [UUID: Int]) {
        let liveFile = #Predicate<Attachment> { (f: Attachment) -> Bool in f.folderID != nil && f.deletedAt == nil && f.trashedAt == nil }
        let trashedFile = #Predicate<Attachment> { (f: Attachment) -> Bool in f.folderID != nil && f.deletedAt == nil && f.trashedAt != nil }
        let live = (try? context.fetchCount(FetchDescriptor<Attachment>(predicate: liveFile))) ?? 0
        let trashed = (try? context.fetchCount(FetchDescriptor<Attachment>(predicate: trashedFile))) ?? 0
        guard live > 0 else { return (0, trashed, [:]) }
        var d = FetchDescriptor<Attachment>(predicate: liveFile)
        d.propertiesToFetch = [\Attachment.folderID]
        var byFolder: [UUID: Int] = [:]
        let found: [Attachment] = (try? context.fetch(d)) ?? []
        for f in found { if let id = f.folderID { byFolder[id, default: 0] += 1 } }
        return (live, trashed, byFolder)
    }
    #if os(macOS)
    /// What the Mac sidebar's Search button opens: Go to Note… (QuickOpen).
    static let searchButtonOpens: Notification.Name = .paneQuickOpen
    static let searchButtonHelp = "Search notes and commands (\u{2318}K)"
    #endif

    /// The title of the alert that asks for a folder's name.
    nonisolated static func nameAlertTitle(renaming: Bool, inside: Bool) -> String {
        renaming ? "Rename Folder" : "New Folder"
    }

    /// Recently Deleted is listed only while it holds something, like Notes.
    nonisolated static func showsTrash(notes: Int, files: Int) -> Bool { notes + files > 0 }

    /// Where the list goes when Recently Deleted is open and has just emptied (nil: stay).
    nonisolated static func leavingEmptyTrash(_ scope: Scope?, showsTrash: Bool) -> Scope? {
        scope == .trash && !showsTrash ? .all : nil
    }

    /// Whether the list keeps a column for folders' arrows. On the Mac always: every folder's row
    /// can open (`FolderTree.body`), so the column is there from the first folder, and nothing
    /// moves when the first sub-folder comes (Emil, 9 November 2026: "the whole folder section
    /// shifts"). On iPhone, once any folder has sub-folders; the folders' parents are read, not every
    /// folder's children (800 folders: 800 lists read for each update of the sidebar).
    private var nested: Bool {
        #if os(macOS)
        true
        #else
        folders.contains { $0.parent.map { $0.deletedAt == nil } ?? false }
        #endif
    }

    private var roots: [Folder] { folders.filter { $0.parent == nil || $0.parent?.deletedAt != nil } }

    var body: some View {
        #if DEBUG || QA
        RenderProbe.count("SidebarView", context: context)
        #endif
        let files = self.files
        // In stages, in the same order: as one chain the body took the type checker about 8 s
        // (compile-time audit, 2026-10-13).
        return withDialogs(withChrome(searchable(folderList(files)), files: files))
            .environment(windowLibrary ?? ownLibrary)
    }

    /// The folders, All Notes and Recently Deleted.
    private func folderList(_ files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        #if os(iOS)
        Group {
            if editingFolders { editList } else { selectList(files) }
        }
        .listStyle(.sidebar)
        // As columns the selection is the Mac's grey pill, not the accent.
        .tint(stacked ? nil : Color(Palette.columnSelection))
        .scrollContentBackground(stacked ? .hidden : .automatic)
        .background { if stacked { Color(Palette.foldersGround).ignoresSafeArea() } }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(spacing: 0) {
                if let film, film.cardShown, !editingFolders {
                    FilmCard(store: film)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                } else if let card = sidebarCard, card != .mac, !editingFolders {
                    cardView(card)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                }
                OfflineLine(sync: sync)
            }
            .animation(.easeOut(duration: 0.25), value: sync?.reach)
        }
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { sidebarHeight = $0 }
        #else
        selectList(files)
            .listStyle(.sidebar)
            // A theme's sidebar is solid: the glass steps aside for its colour.
            .scrollContentBackground(ThemeStore.shared.look.colors == nil ? .automatic : .hidden)
            // A little of the icon's brown inside the sidebar's glass, which stays vibrant.
            .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
        #endif
    }

    /// Whether the folder list shows its "Folders" heading: only with a row under it.
    static func showsHeading(folders: Int, trashed: Int) -> Bool { folders > 0 || trashed > 0 }

    /// The folders as you pick one: a tap opens it.
    private func selectList(_ files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        // Behind a setup card the folders' own picks are ignored, as the notes list's are.
        let behind = behindSetupCard
        #if os(macOS)
        return List(selection: Binding(get: { Self.selection(scope: scope, picked: picked) }, set: { new in
            guard !behind else { return }
            // Dragging a folder keeps it shown, as in Notes: the list's own pick as the drag starts is ignored.
            guard Self.listPickCounts(during: NSApp.currentEvent?.type) else { return }
            let next = Self.picking(new, scope: scope)
            picked = next.picked
            if next.scope != scope { scope = next.scope }
        })) { selectRows(files) }
        #else
        // One row at a time, as before ⌘ and ⇧ picked several on the Mac. Back empties the list's
        // pick; with a set of picks that read as "⌘ on the last" and kept the folder, so a tap on
        // it changed nothing and nothing opened, until Edit and Done drew the list again with the
        // folder still picked (Emil, 11 November 2026: "I click edit, then click done, and that
        // moves me into the folder"). Here Back leaves nothing picked.
        return List(selection: Binding(get: { scope }, set: { new in if !behind { scope = new } })) { selectRows(files) }
        #endif
    }

    /// Whether the folders' list takes several picks at once (⌘ and ⇧): the Mac only.
    #if os(macOS)
    static let picksSeveral = true
    #else
    static let picksSeveral = false
    #endif

    /// The rows of the folders' list.
    @ViewBuilder
    private func selectRows(_ files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
            Section {
                // "All Notes" only earns its row once there's more than one folder, or a note in none.
                if Self.showsAllNotes(folders: folders.count, context: context) {
                    CountedRow(title: "All Notes", icon: "tray.full", trash: false, files: files.live, selection: $scope)
                        .tag(Scope.all)
                        .accessibilityIdentifier("sidebar.all")
                }
                #if os(macOS)
                // Notes, first, on its own: nothing goes above it, so the list offers no gap there.
                if let notes = roots.first {
                    FolderTree(folder: notes, files: files.byFolder, selection: $scope, naming: $namingFolder, drops: drops, targeted: folderTargeted, actions: folderMenuActions, notesID: notes.id, picked: picked)
                }
                ForEach(Array(roots.dropFirst())) { folder in
                    FolderTree(folder: folder, files: files.byFolder, selection: $scope, naming: $namingFolder, drops: drops, targeted: folderTargeted, actions: folderMenuActions, notesID: roots.first?.id, picked: picked)
                }
                // A folder dragged between two rows goes there, with the list's own line in the gap,
                // as in Notes and Finder (the row's middle still takes it in: its own onDrop). The
                // list counts from the folder after Notes.
                .onInsert(of: [.paneFolder]) { index, providers in
                    Self.insertFolders(providers, in: nil, at: index, among: Array(roots.dropFirst()), after: 1, context: context)
                }
                #else
                ForEach(roots) { folder in
                    FolderTree(folder: folder, files: files.byFolder, selection: $scope, naming: $namingFolder, drops: drops, targeted: folderTargeted, actions: folderMenuActions, notesID: roots.first?.id, picked: picked)
                }
                #endif
                // Last in the same list, like Notes, and like Notes only while something is in it.
                CountedRow(title: "Recently Deleted", icon: "trash", trash: true, files: files.trashed, selection: $scope)
                    .tag(Scope.trash)
                    .accessibilityIdentifier("sidebar.trash")
            } header: {
                // On iPhone the screen's title says it (Emil, 29 October 2026).
                #if os(macOS)
                // Only over rows: an empty list (signed out, behind the sign-in card) puts its
                // heading at the very top, under the window's buttons (Emil, 2 November 2026).
                if Self.showsHeading(folders: roots.count, trashed: files.trashed) {
                    HStack {
                        Text("Folders").foregroundStyle(Color.muted).accessibilityAddTraits(.isHeader)
                        Spacer()
                        // New Folder, where the folders are (it was a fourth toolbar button's place):
                        // a 22 pt target, centred over the counts' last digit (Emil, 7 November 2026).
                        Button("New Folder", systemImage: "plus") { startNewFolder(nil) }
                            .labelStyle(.iconOnly)
                            .font(.system(size: 12, weight: .medium))
                            .frame(width: SidebarStyle.plusTarget - 10, height: SidebarStyle.plusTarget - 10)
                            .buttonStyle(.quietIcon(padding: 5, lightens: true))
                            .padding(.trailing, SidebarStyle.plusTrailing)
                            .help("New Folder (\u{21E7}\u{2318}N)")
                            .accessibilityIdentifier("sidebar.newFolder")
                    }
                    // A list section's header is one element to VoiceOver whatever's asked of it
                    // ("Folders, New Folder", round 18): the button is an action on that heading.
                    .accessibilityAction(named: "New Folder") { startNewFolder(nil) }
                    .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarStyle.headingInset)
                    // The way out of a folder, as in Notes (its account heading): a folder dropped on
                    // the heading goes to the top level, last. It lights while a folder is over it.
                    .contentShape(.rect)
                    .background {
                        RoundedRectangle(cornerRadius: Hover.pillRadius, style: .continuous)
                            .fill(.tint.opacity(0.3))
                            .padding(.horizontal, -4)
                            .opacity(headingOver ? 1 : 0)
                            .animation(.easeOut(duration: 0.08), value: headingOver)
                    }
                    .onDrop(of: [.paneFolder], delegate: TopLevelDrop(over: $headingOver) { providers in
                        Self.moveToTopLevel(providers, context: context)
                    })
                    .accessibilityIdentifier("sidebar.foldersHeading")
                }
                #endif
            }
            #if os(iOS)
            // iPhone: the folders on a card, like Notes. iPad: the sidebar's own rows, so its
            // rounded selection shows (a card under it showed only a square focus ring).
            .listRowBackground(stacked ? Color(Palette.row) : nil)
            #endif
            // The library's #tags, once a note has one.
            SidebarTags(selection: $scope, nested: nested)
            #if os(iOS)
            // The Mac card docks right under the folders, where it reads as part of the list.
            if sidebarCard == .mac {
                Section {
                    cardView(.mac)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            #endif
    }

    /// The app's name above, the menus, drops and the toolbar.
    private func withChrome(_ content: some View, files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        content
        #if os(macOS)
        // ⌫ with folders picked deletes them (never Notes), asking first when they hold anything.
        .onDeleteCommand { deletePicked() }
        // Recently Deleted leaves the sidebar when its last note does; the list goes back to the notes.
        .background { EmptyTrashLeaver(scope: $scope, files: files.trashed) }
        // The app's name at the top, so it's never mistaken for Notes. (iOS shows it as the large title.)
        // A bar, not a plain inset: the folders scrolled under it showed through its words (and
        // through the account row at the foot, where a folder's name and the email ran together).
        // Soft edges, as Apple Notes: the list fades under the bars, with no line drawn across.
        // C and D: no brand mark in the chrome (DESIGN.md, Icons); the rows start under the window's buttons.
        .safeAreaBar(edge: .top, spacing: 0) {
            if DesignLook.calmList { Color.clear.frame(height: 4) } else { SidebarHeader(leading: SidebarStyle.edge(nested: nested)) }
        }
        .scrollEdgeEffectStyle(.soft, for: [.top, .bottom])
        #if os(macOS)
        .modifier(FollowsTextSize())
        #endif
        #endif
        .onAppear(perform: settleScope)
        // What Ask an AI offers in the folders' menus: loaded on sign-in, and again when a
        // connection may have come (the ai_connected notice). Signed out: nothing to ask.
        .task(id: AskLoad(state: backend?.state, news: ConnectCenter.shared.connectionNews)) {
            if case .signedIn = backend?.state { await ConnectedAIs.shared.refresh(backend?.client) } else if backend != nil { ConnectedAIs.shared.set([]) }
        }
        .onChange(of: folders.map(\.id)) { _, _ in settleScope() }
        // Launch restores All Notes after this list first appears.
        .onChange(of: scope) { _, _ in settleScope() }
        // An AI's loose note synced in: All Notes, where it shows.
        .onChange(of: looseNotes) { _, _ in settleScope() }
        // Right-click anywhere in the sidebar; a folder's own menu comes from its row.
        .contextMenu(forSelectionType: Scope.self) { items in
            if items.isEmpty || items.contains(.all) || items.contains(.trash) {
                Button("New Folder", systemImage: "folder.badge.plus") { startNewFolder(nil) }
            }
        }
        .onDrop(of: [.paneItem], delegate: MoveDropDelegate(types: [.paneItem]) { providers in
            // Dropping a folder on empty sidebar space moves it to the top level.
            Self.moveToTopLevel(providers, context: context)
            return true
        })
        #if os(iOS)
        .navigationTitle("Folders")
        #else
        .navigationTitle("Pinto Notes")
        #endif
        .toolbar {
            #if os(iOS)
            // Your photo at the top left; New Folder and Edit at the right, as Notes has them; below,
            // the same search and new note as in a folder's notes (Emil, 30 October 2026).
            if let backend, backend.client != nil || Self.capturesAccount {
                ToolbarItem(placement: .topBarLeading) {
                    // Signed in, your photo is the way into Settings (your account comes first there).
                    if Self.signedIn(backend) {
                        let name = AccountName.shown(ProfileStore.shared.name)
                        AccountPhotoButton(photo: ProfileStore.shared.shownPhoto, name: AccountName.isSet(ProfileStore.shared.name) ? name : nil, spoken: name) { showSettings = true }
                            .task(id: backend.state) { await ProfileStore.shared.bind(backend) }
                    } else {
                        Button("Settings", systemImage: "gearshape") { showSettings = true }
                            .tint(.primary)
                            .accessibilityIdentifier("sidebar.settings")
                    }
                }
                .sharedBackgroundVisibility(.hidden)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("New Folder", systemImage: "folder.badge.plus") { startNewFolder(nil) }
                    ForEach(ImportKind.listed) { kind in
                        Button(kind.title, systemImage: kind.symbol) { imports?.from(kind) }
                    }
                } label: {
                    Label("New Folder", systemImage: "folder.badge.plus")
                } primaryAction: { startNewFolder(nil) }
                // The floating buttons in the label colour, as in the note and the list.
                .tint(.primary)
                .accessibilityIdentifier("sidebar.newFolder")
            }
            ToolbarSpacer(.fixed, placement: .topBarTrailing)
            ToolbarItem(placement: .topBarTrailing) {
                // Edit in words; while editing, a checkmark (Done), as in Notes.
                Button {
                    withAnimation(.snappy(duration: 0.25)) { editingFolders.toggle() }
                } label: {
                    if editingFolders {
                        Label("Done", systemImage: "checkmark")
                    } else {
                        Text("Edit")
                    }
                }
                .tint(.primary)
                .accessibilityIdentifier(editingFolders ? "sidebar.done" : "sidebar.edit")
            }
            if stacked {
                SearchComposeBar(newNote: onNewNote, identifier: "sidebar.newNote", search: $search)
            }
            // iPad: the notes' list is always beside the folders, with Today and New Note at its
            // foot; a second pair here was the same two buttons twice, side by side.
            #else
            // Mac: the sidebar's three buttons at its trailing edge, together (Emil, 31 October
            // 2026), as plain glyphs with no glass capsule around them: macOS draws one round
            // enabled items, so it showed only once onboarding ended (Emil, 2 November 2026). Least used first, so Search, the most used, sits nearest the list, where its
            // field opens. With the sidebar hidden they stay beside the window's buttons.
            ToolbarSpacer(.flexible)
            // The sidebar's own button, shown or hidden, in the same place (Emil, 11-04: with only
            // the menu and keys it looked like it couldn't hide). A fourth button here sent Search
            // to the overflow menu, so New Folder is on the Folders heading (and File, ⇧⌘N).
            // Its own view reads the toggle, so a toggle doesn't work the folders out again.
            ToolbarItem { SidebarToggleButton().buttonStyle(.barIcon) }
            .sharedBackgroundVisibility(.hidden)
            // Today's note in one press (DailyNotes).
            ToolbarItem { TodayButton(identifier: "sidebar.today").buttonStyle(.barIcon) }
            .sharedBackgroundVisibility(.hidden)
            ToolbarItem {
                // The Spotlight-like panel, which finds notes by title and text and runs commands
                // (Emil, 2 November 2026; it opened the list's search field). ⌘F keeps that field.
                SidebarSearchButton(opens: Self.searchButtonOpens, help: Self.searchButtonHelp).buttonStyle(.barIcon)
            }
            .sharedBackgroundVisibility(.hidden)
            #endif
        }
    }

    #if os(iOS)
    /// UI tests and captures: `-uitest -captureAccount` shows the signed-in top bar (your photo)
    /// without an account to sign in to.
    static var capturesAccount: Bool {
        let args = ProcessInfo.processInfo.arguments
        return args.contains("-uitest") && args.contains("-captureAccount")
    }

    private static func signedIn(_ backend: Backend) -> Bool {
        if case .signedIn = backend.state { return true }
        return capturesAccount
    }

    #endif

    /// The folders screen's search on iPhone; while it has words, the notes it finds in place of
    /// the folders. (On iPad the notes' list beside this one searches.)
    @ViewBuilder private func searchable(_ folders: some View) -> some View {
        #if os(iOS)
        if stacked {
            let query = search.trimmingCharacters(in: .whitespaces)
            Group {
                if query.isEmpty { folders } else { FolderSearchResults(query: query, open: onOpenNote) }
            }
            .modifier(SystemSearch(text: $search, placement: .automatic, off: BarSearchField.drawn(besideNote: besideNote)))
        } else {
            folders
        }
        #else
        folders
        #endif
    }

    /// The account at the foot, Settings, and the folder dialogs.
    @ViewBuilder private func footed(_ content: some View) -> some View {
        #if os(macOS)
        // Under the folders, not a bar laid over them: macOS drew a bar's edge as a line whenever
        // the pointer was anywhere on the foot (Emil, 8 November 2026). The list ends above it and
        // fades out at its own bottom edge.
        VStack(spacing: 0) {
            content
            if let backend, case .signedIn = backend.state {
                VStack(alignment: .leading, spacing: 4) {
                    if let film, film.cardShown {
                        FilmCard(store: film)
                            .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarCardMetrics.padding)
                            .padding(.trailing, 10)
                            .padding(.bottom, 2)
                    } else if let card = sidebarCard {
                        // Its words start on the rows' icons' line, like the title and the account.
                        cardView(card)
                            .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarCardMetrics.padding)
                            .padding(.trailing, 10)
                            .padding(.bottom, 2)
                    }
                    // While sync is away the foot says so itself (`OfflineStatus`).
                    SidebarFoot(backend: backend, nested: nested, rows: true, imports: imports, sync: sync)
                }
                .padding(.top, 4)
                .padding(.bottom, 8)
                // The list's own ground under the foot too: outside the list it showed the window's
                // glass, a tinted band under a theme's solid sidebar (Emil, 8 November 2026).
                .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
            } else if let backend, let standIn = Self.offlineStandIn {
                // Real-input checks (`-uitest -demo -sidebarOffline offline`): the whole foot as it is
                // while sync is away, in a demo run, which has no account and no sync.
                SidebarFoot(backend: backend, nested: nested, rows: true, imports: imports, offline: standIn)
                    .padding(.top, 4)
                    .padding(.bottom, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
            } else if Self.demoRows {
                // Real-input checks (`-uitest -demo -sidebarRows`): the foot's rows in a demo run,
                // which has no account to show them under.
                SidebarStudyRows(imports: imports)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
            }
        }
        #else
        content
        #endif
    }

    #if os(macOS)
    private static var offlineStandIn: (any OfflineSource)? {
        #if DEBUG || QA
        OfflineStandIn.launched
        #else
        nil
        #endif
    }

    private static let demoRows: Bool = {
        let args = ProcessInfo.processInfo.arguments
        return args.contains("-uitest") && args.contains("-demo") && args.contains("-sidebarRows")
    }()
    #endif

    private func withDialogs(_ content: some View) -> some View {
        footed(content)
        #if os(macOS)
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { sidebarHeight = $0 }
        .onReceive(NotificationCenter.default.publisher(for: .paneNewFolder)) { _ in startNewFolder(nil) }
        .onReceive(NotificationCenter.default.publisher(for: .paneRenameFolder)) { n in
            if let id = n.object as? UUID, let f = context.folder(id), f.deletedAt == nil { startRename(f) }
        }
        .onReceive(NotificationCenter.default.publisher(for: .paneDeleteFolder)) { n in
            if let id = n.object as? UUID, let f = context.folder(id), f.deletedAt == nil { deleteFolder(f) }
        }
        .alert("No room for another folder", isPresented: $folderLimitReached) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(Self.folderLimitMessage)
        }
        #endif
        #if os(iOS)
        .sheet(isPresented: $showSettings) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
        .sheet(item: $movingFolder) { folder in
            FolderMoveSheet(folder: folder)
        }
        #endif
        .confirmationDialog("Delete \u{201C}\(deletingFolder?.name ?? "")\u{201D}?", isPresented: Binding(get: { deletingFolder != nil }, set: { if !$0 { deletingFolder = nil } }), titleVisibility: .visible) {
            Button("Delete Folder", role: .destructive) {
                if let f = deletingFolder { performDelete(f) }
                deletingFolder = nil
            }
        } message: {
            Text(deletingFolder.map { f in
                let c = Self.contents(of: f, files: { context.files(in: $0).count })
                return Self.deleteMessage(subfolders: c.subfolders, notes: c.notes, files: c.files)
            } ?? "")
        }
        .confirmationDialog(Self.deleteFoldersTitle(deletingFolders.count), isPresented: Binding(get: { !deletingFolders.isEmpty }, set: { if !$0 { deletingFolders = [] } }), titleVisibility: .visible) {
            Button("Delete Folders", role: .destructive) {
                deletingFolders.forEach(performDelete)
                deletingFolders = []
                picked = []
            }
        } message: {
            Text("Their notes and files move to Recently Deleted, where you can recover them for 30 days.")
        }
        .alert(Self.nameAlertTitle(renaming: renaming != nil, inside: (newFolderParent ?? nil) != nil), isPresented: Binding(
            get: { renaming != nil || newFolderParent != nil },
            set: { if !$0 { renaming = nil; newFolderParent = nil } }
        )) {
            TextField("Name", text: $nameDraft)
                .accessibilityIdentifier("folder.name")
                #if os(iOS)
                .submitLabel(.done)
                .onSubmit(commitName)
                #endif
            Button("Cancel", role: .cancel) {}
            Button(renaming == nil ? "Create" : "Save", action: commitName)
                // Nothing to create or save without a name (it used to close the alert and do nothing).
                .disabled(nameDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                // On iPhone the default button of an alert is filled system blue under the app's
                // amber label, which can't be read: Return on the keyboard saves instead.
                #if os(macOS)
                .keyboardShortcut(.defaultAction)
                #endif
        } message: {
            if renaming == nil { Text("Enter a name for this folder.") }
        }
    }

    /// On the Mac the rows above the account (Templates, Connect an AI, Import) do what the cards
    /// did, so the cards are gone there (Emil, 2 November 2026). iPhone has no rows: it keeps them.
    static var showsCards: Bool {
        #if os(macOS)
        false
        #else
        true
        #endif
    }

    /// The one card above the account: Connect your AI, then Templates (`SidebarCard.pick`).
    private var sidebarCard: SidebarCard? {
        guard Self.showsCards, let backend, case .signedIn = backend.state, let account = backend.userID else { return nil }
        return SidebarCard.here(SidebarCard.pick(account: account, progress: setup?.progress,
                                connectClosedHere: cardsClosedHere.contains(.connect) || SidebarCard.isClosedHere(.connect, account),
                                templatesClosedHere: cardsClosedHere.contains(.templates) || SidebarCard.isClosedHere(.templates, account),
                                sidebarHeight: sidebarHeight, largestText: templatesTypeSize.isAccessibilitySize,
                                hasHadMac: SidebarCard.hasHadMac(loaded: KeyDevices.shared.loaded, others: KeyDevices.shared.others),
                                macClosedHere: cardsClosedHere.contains(.mac) || SidebarCard.isClosedHere(.mac, account)))
    }

    @ViewBuilder private func cardView(_ card: SidebarCard) -> some View {
        let close = {
            if let account = backend?.userID { SidebarCard.closeHere(card, account) }
            withAnimation(.easeOut(duration: 0.2)) { _ = cardsClosedHere.insert(card) }
            if let mark = card.mark { Task { await setup?.mark(mark) } }
        }
        Group {
            switch card {
            case .mac: MacCard(onClose: close)
            case .connect:
                // The Mac's only (SidebarCard.here): iPhone and iPad connect no AI (8 November 2026).
                #if os(macOS)
                ConnectCard(onConnect: { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }, onClose: close)
                #else
                EmptyView()
                #endif
            case .templates: TemplatesCard(onClose: close)
            }
        }
        .transition(.opacity)
    }

    /// A row of the folders screen's Edit: a folder, how many levels in, and whether it stays put
    /// (the first folder at the top level: Notes, where new notes go).
    struct EditRow: Identifiable, Equatable {
        let id: UUID
        let parent: UUID?
        let depth: Int
        let pinned: Bool
    }

    /// The folders as Edit lists them: each under its parent, a level in, in the sidebar's order.
    static func editRows(_ roots: [Folder]) -> [EditRow] {
        var out: [EditRow] = []
        var seen: Set<UUID> = []
        func add(_ f: Folder, _ depth: Int) {
            guard seen.insert(f.id).inserted else { return }
            out.append(EditRow(id: f.id, parent: depth == 0 ? nil : f.parent?.id, depth: depth, pinned: depth == 0 && out.isEmpty))
            guard depth < 32 else { return }
            for child in f.liveChildren { add(child, depth + 1) }
        }
        for root in roots { add(root, 0) }
        return out
    }

    /// Where a row dragged by its handle lands: its folder, and its place among the folders beside
    /// it (without itself), for `ModelContext.reorder`. A folder keeps its parent when dragged
    /// (Move puts it inside another); it goes after the folders beside it that were above where it
    /// was dropped. Nil for the folder that stays put.
    nonisolated static func reorderTarget(_ rows: [EditRow], from: IndexSet, to: Int) -> (id: UUID, index: Int)? {
        guard from.count == 1, let i = from.first, rows.indices.contains(i), !rows[i].pinned else { return nil }
        let moved = rows[i]
        let above = rows.indices.filter { $0 != i && $0 < to && rows[$0].parent == moved.parent && rows[$0].depth == moved.depth }
        return (moved.id, above.count)
    }

    /// A folder's menu, the same on the Mac (right-click, or its •••) and on iPhone (long press, or
    /// its ••• in Edit), in groups split by lines, as Apple Notes groups it: on the Mac Open in New
    /// Window first (Emil, 2 November 2026); what to make in it, what to do with it, and Delete on
    /// its own at the end. Notes, the first folder, has no Move To: it stays first, where new notes
    /// go. Nor Delete, as in Notes: with every folder gone the sidebar had only Recently Deleted
    /// (Emil, 3 November 2026). Pinto has no folder sharing, so no Share.
    nonisolated static func folderMenu(isNotes: Bool, newWindow: Bool = FolderAction.opensWindows, reorders: Bool = FolderAction.opensWindows) -> [[FolderAction]] {
        (newWindow ? [[.openInNewWindow]] : [])
            + [[.newNote, .newFolder], isNotes ? [.rename, .duplicate] : [.rename, .duplicate, .move]]
            // Mac: the same as dragging a folder between two rows, without the drag (iPhone has
            // Edit's handles). Notes stays first, so it has neither.
            + (isNotes || !reorders ? [] : [[.moveUp, .moveDown]])
            + (isNotes ? [] : [[.delete]])
    }

    /// A place Move To lists for a folder: the top level, then every folder in the sidebar's
    /// order, each a level in under its own. The folder itself and the folders inside it can't
    /// take it; where it is now is ticked.
    struct MoveTarget: Identifiable, Equatable {
        /// Nil for the top level.
        let folder: UUID?
        let name: String
        let depth: Int
        let enabled: Bool
        let current: Bool
        var id: String { folder?.uuidString ?? "top" }
    }

    static func moveTargets(for folder: Folder, in folders: [Folder]) -> [MoveTarget] {
        let inside = subtree(of: folder)
        let top = MoveTarget(folder: nil, name: "Top Level", depth: 0, enabled: true, current: folder.parent == nil)
        return [top] + MoveToPicker.rows(folders).map {
            MoveTarget(folder: $0.id, name: $0.name, depth: $0.depth, enabled: !inside.contains($0.id), current: $0.id == folder.parent?.id)
        }
    }

    /// What the folder menus' items do here.
    private var folderMenuActions: FolderMenuActions {
        FolderMenuActions(
            openInNewWindow: { [openWindow] in NoteWindows.open(folder: $0.id, with: openWindow) },
            newNote: { onNewNoteIn($0.id) },
            newFolder: startNewFolder,
            rename: startRename,
            duplicate: { f in SidebarView.folderChange { _ = context.duplicate(f) } },
            moveSheet: startMove,
            move: { f, target in SidebarView.folderChange { context.move(f, into: target.flatMap { context.folder($0) }) } },
            nudge: { f, step in SidebarView.folderChange { context.nudge(f, by: step) } },
            delete: { f in
                // A picked folder's Delete Folder takes every picked folder, as in Finder.
                if !picked.isEmpty, Self.selection(scope: scope, picked: picked).contains(.folder(f.id)) { deletePicked() } else { deleteFolder(f) }
            })
    }

    /// The place among the folders in `parent` for a folder the list put at `index` between rows.
    /// The list counts the dragged folder where it still is, and `ModelContext.place` leaves it
    /// out: below its old place, one less.
    /// `after`: folders above the list's own rows at that level (Notes, at the top level).
    nonisolated static func placeIndex(of id: UUID, at index: Int, among siblings: [UUID], after: Int = 0) -> Int {
        guard let from = siblings.firstIndex(of: id), from < index else { return after + index }
        return after + index - 1
    }

    /// Folders dropped between two rows (`onInsert`): each goes into `parent` (nil: the top level)
    /// at that place. A level can change, as in Notes; Notes stays first and nothing goes inside
    /// itself (`ModelContext.place`).
    static func insertFolders(_ providers: [NSItemProvider], in parent: Folder?, at index: Int, among siblings: [Folder], after: Int = 0, context: ModelContext) {
        let ids = siblings.map(\.id)
        DropLoader.load(providers) { items, _ in
            for item in items where item.kind == .folder {
                guard let f = context.folder(item.id) else { continue }
                SidebarView.folderChange { context.place(f, in: parent, at: placeIndex(of: f.id, at: index, among: ids, after: after)) }
            }
        }
    }

    /// Folders dropped on the "Folders" heading (or on the sidebar outside its list): each goes to the
    /// top level, last (`ModelContext.move(_:into:)`). Notes in the drag stay where they are.
    static func moveToTopLevel(_ providers: [NSItemProvider], context: ModelContext) {
        DropLoader.load(providers) { items, _ in
            for item in items where item.kind == .folder {
                guard let f = context.folder(item.id), f.parent != nil else { continue }
                SidebarView.folderChange { context.move(f, into: nil) }
            }
        }
    }

    /// A change to the folder tree: a folder moved, placed, copied or deleted, or one opened by a
    /// drop. On the Mac it's instant, as opening and closing a folder is: the list's animated move
    /// left the old row drawn over the one that took its place ("Work" and "Ideas" in one row) until
    /// the window was redrawn. iPhone keeps the list's own animation.
    static func folderChange(_ body: () -> Void) {
        #if os(macOS)
        withTransaction(FolderTree.instant, body)
        #else
        withAnimation(.snappy, body)
        #endif
    }

    /// What's selected once `folder` closes: the folder itself when the selection was a folder
    /// inside it (it would be hidden), otherwise the same.
    static func selection(afterClosing folder: Folder, _ selection: Scope?) -> Scope? {
        guard case .folder(let id)? = selection, id != folder.id, SidebarView.subtree(of: folder).contains(id) else { return selection }
        return .folder(folder.id)
    }

    /// A folder and every folder inside it: the places Move can't put it.
    static func subtree(of folder: Folder) -> Set<UUID> {
        var out: Set<UUID> = [folder.id]
        var queue = folder.liveChildren
        while let f = queue.popLast() {
            guard out.insert(f.id).inserted else { continue }
            queue += f.liveChildren
        }
        return out
    }

    #if os(iOS)
    /// Edit, as in Notes: All Notes, Notes and Recently Deleted stay where they are, dimmed, with
    /// no count; every other folder has its ••• menu and a handle to drag it up or down among the
    /// folders beside it. Sub-folders sit a level in under theirs; Move puts a folder in another.
    private var editList: some View {
        let rows = Self.editRows(roots)
        let byID = Dictionary(folders.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        let trashed = Self.counts(in: context).trashed + files.trashed
        return List {
            Section {
                if Self.showsAllNotes(folders: folders.count, context: context) {
                    FixedFolderRow(title: "All Notes", icon: "tray.full").accessibilityIdentifier("sidebar.all")
                }
                ForEach(rows) { row in
                    if let folder = byID[row.id] {
                        Group {
                            if row.pinned {
                                FixedFolderRow(title: folder.name, icon: "folder").accessibilityIdentifier("folder.\(folder.name)")
                            } else {
                                EditFolderRow(folder: folder, depth: row.depth, isNotes: false, actions: folderMenuActions)
                            }
                        }
                        .moveDisabled(row.pinned)
                        .deleteDisabled(true)
                    }
                }
                .onMove { from, to in
                    guard let target = Self.reorderTarget(rows, from: from, to: to), let f = byID[target.id] else { return }
                    withAnimation(.snappy) { context.reorder(f, to: target.index) }
                }
                if trashed > 0 {
                    FixedFolderRow(title: "Recently Deleted", icon: "trash").accessibilityIdentifier("sidebar.trash")
                }
            }
            .listRowBackground(Color(Palette.row))
        }
        .environment(\.editMode, .constant(.active))
    }
    #endif

    /// Keeps the selection on something that exists (see `Scope.settled`).
    private func settleScope() {
        let settled = Scope.settled(scope, liveFolders: folders.map(\.id), loose: looseNotes, standIn: standIn)
        standIn = settled.standIn
        if settled.scope != scope { scope = settled.scope }
    }

    /// Whether a live note is in no folder.
    private var looseNotes: Bool { folders.count <= 1 && Self.showsAllNotes(folders: folders.count, context: context) }

    /// The mouse button is held: a drag still going, not a let-go.
    static var dragButtonDown: Bool { mouseIsDown }

    private static var mouseIsDown: Bool {
        #if os(macOS)
        NSEvent.pressedMouseButtons & 1 != 0
        #else
        true
        #endif
    }

    /// Said by a drop: no row is lit any more.
    static let everyRow = UUID()

    /// The row lit during a drag. A drop puts out every row: the list's "left this row" didn't
    /// always come, and Work stayed filled after a drop on Ideas (round 22).
    static func dropTarget(_ current: UUID?, over: Bool, id: UUID, dropped: Bool, buttonDown: Bool = true) -> UUID? {
        // With the button up the drag is over, whatever a row says now: a row said so after the
        // drop and stayed lit (round 24, the app's own Q4 planning).
        if dropped || !buttonDown { return nil }
        return over ? id : (current == id ? nil : current)
    }

    /// A drag is over a folder's row, or has left it.
    private func folderTargeted(_ over: Bool, _ id: UUID) {
        drops.id = Self.dropTarget(drops.id, over: over, id: id, dropped: id == Self.everyRow, buttonDown: Self.mouseIsDown)
    }

    /// Rename: on the Mac the name is typed in the folder's row, as in Notes; on iPhone in an alert.
    private func startRename(_ f: Folder) {
        #if os(macOS)
        NameKeyHold.start()
        namingFolder = f.id
        #else
        nameDraft = f.name; renaming = f
        #endif
    }
    private func startMove(_ f: Folder) { movingFolder = f }
    /// New Folder: on the Mac, as in Notes, a folder named "New Folder" is made at once in
    /// `parent`, selected, and its name is ready to type over in its row. On iPhone an alert asks.
    private func startNewFolder(_ parent: Folder?) {
        #if os(macOS)
        guard let f = context.createUntitledFolder(parent: parent) else { folderLimitReached = true; return }
        // Its name first, then its list: the field takes the keys before the list is built for
        // the new folder, and the keys typed meanwhile go into the name (NameKeyHold).
        NameKeyHold.start { scope = .folder(f.id) }
        namingFolder = f.id
        #else
        nameDraft = ""; newFolderParent = .some(parent)
        #endif
    }

    static var folderLimitMessage: String {
        "An account keeps up to \(Folder.serverLimit.formatted()) folders. Delete one to make room."
    }

    private func commitName() {
        let name = nameDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        defer { renaming = nil; newFolderParent = nil }
        guard !name.isEmpty else { return }
        if let f = renaming {
            f.name = name
            f.touch()
            try? context.save()
        } else if let parent = newFolderParent {
            let f = context.createFolder(named: name, parent: parent)
            scope = .folder(f.id)
        }
    }

    /// What a folder holds, sub-folders included: what deleting it moves to Recently Deleted.
    static func contents(of folder: Folder, files: (UUID) -> Int) -> (subfolders: Int, notes: Int, files: Int) {
        var result = (subfolders: 0, notes: folder.liveNotes.count, files: files(folder.id))
        var seen: Set<UUID> = [folder.id]
        var queue = folder.liveChildren
        while let f = queue.popLast() {
            guard seen.insert(f.id).inserted else { continue }
            result.subfolders += 1
            result.notes += f.liveNotes.count
            result.files += files(f.id)
            queue += f.liveChildren
        }
        return result
    }

    /// What happens, said plainly: the folder itself is gone for good; what was in it waits in
    /// Recently Deleted (2026-10-12: the old line read as if the folder could be recovered).
    static func deleteMessage(subfolders: Int, notes: Int, files: Int) -> String {
        func count(_ n: Int, _ one: String, _ many: String) -> String { n == 1 ? "1 \(one)" : "\(n) \(many)" }
        let gone = subfolders == 0 ? "The folder goes away." : "The folder and its \(count(subfolders, "subfolder", "subfolders")) go away."
        var held: [String] = []
        if notes > 0 { held.append(count(notes, "note", "notes")) }
        if files > 0 { held.append(count(files, "file", "files")) }
        guard !held.isEmpty else { return gone }
        let them = notes + files == 1 ? "it" : "them"
        let moves = notes + files == 1 ? "moves" : "move"
        let whose = subfolders == 0 ? "Its" : "Their"
        return "\(gone) \(whose) \(held.joined(separator: " and ")) \(moves) to Recently Deleted, where you can recover \(them) for 30 days."
    }

    /// "Delete 3 folders?"
    static func deleteFoldersTitle(_ count: Int) -> String { "Delete \(count) folders?" }

    /// What the sidebar list shows picked: the folder shown, and any picked beside it.
    static func selection(scope: Scope?, picked: Set<UUID>) -> Set<Scope> {
        Set(picked.map { Scope.folder($0) }).union(scope.map { [$0] } ?? [])
    }

    #if os(macOS)
    /// Whether a pick the list makes during this event counts. When a folder drag starts, the list
    /// (with its drop lines on) picks All Notes; the folder you drag stays shown instead, as in Notes.
    static func listPickCounts(during event: NSEvent.EventType?) -> Bool { event != .leftMouseDragged }
    #endif

    /// A new pick from the list: one row shows that row; several keep the one shown (if it's still
    /// among them) and pick the folders beside it; none (⌘ on the last) keeps what was shown.
    static func picking(_ new: Set<Scope>, scope: Scope?) -> (scope: Scope?, picked: Set<UUID>) {
        guard new.count > 1 else { return (new.first ?? scope, []) }
        let folders = Set(new.compactMap { s -> UUID? in if case .folder(let id) = s { return id } else { return nil } })
        let shown = scope.flatMap { new.contains($0) ? $0 : nil } ?? new.sorted { "\($0)" < "\($1)" }.first
        return (shown, folders)
    }

    /// Delete with several folders picked: all of them (never Notes), asking first when any holds
    /// something, in one question.
    private func deletePicked() {
        let all = Self.selection(scope: scope, picked: picked).compactMap { s -> Folder? in
            if case .folder(let id) = s, id != roots.first?.id, let f = context.folder(id), f.deletedAt == nil { return f }
            return nil
        }
        guard all.count > 1 else {
            if let f = all.first { deleteFolder(f) }
            return
        }
        if all.allSatisfy({ $0.liveNotes.isEmpty && $0.liveChildren.isEmpty && context.files(in: $0.id).isEmpty }) {
            all.forEach(performDelete)
            picked = []
        } else {
            deletingFolders = all
        }
    }

    /// Asks first when the folder holds notes, like Notes: they move to Recently Deleted.
    private func deleteFolder(_ f: Folder) {
        // Notes stays, as in Apple Notes (its menu has no Delete; this is for ⌫ and other ways in).
        guard f.id != roots.first?.id else { return }
        if f.liveNotes.isEmpty && f.liveChildren.isEmpty && context.files(in: f.id).isEmpty { performDelete(f) } else { deletingFolder = f }
    }

    private func performDelete(_ f: Folder) {
        if scope == .folder(f.id) { scope = .all }
        SidebarView.folderChange { context.trash(f) }
    }
}

/// "All Notes" or "Recently Deleted" with its count, as the list counts its notes (LibraryNotes):
/// the row hears only when that count changes. It used to follow every note with a query and
/// count by asking the store, which read every note's row from disk, on each change.
/// The folder a drag is over, read by the rows that show it. Given to rows as a value it never
/// reached them during a drag: the first row crossed stayed lit, and no other lit, through rounds
/// 21 to 24 (the log: the target moved on, no row was worked out again).
@MainActor @Observable final class FolderDropState {
    /// The row under a drag.
    var id: UUID? { didSet { if id != nil { landedLast = nil } } }
    /// The row a drop last landed in: only it fades slowly; a row the drag only passed goes at once.
    private(set) var landedLast: UUID?
    /// The row something has just landed in: lit a moment longer, then it fades.
    private(set) var landed: UUID?
    /// How many drops each row has taken: each one plays its icon's bounce.
    private(set) var landings: [UUID: Int] = [:]

    static let landedHold: Duration = .milliseconds(320)
    /// Reading what was dropped takes up to half a second after the lift. Long enough to carry the
    /// row over that wait, so it doesn't go dark and light again.
    static let liftHold: Duration = .milliseconds(800)
    private var holds = 0

    /// Something was dropped on this row and is still being read.
    func lifted(_ folder: UUID) { hold(folder, for: Self.liftHold) }

    func land(_ folder: UUID) {
        landings[folder, default: 0] += 1
        landedLast = folder
        hold(folder, for: Self.landedHold)
    }

    private func hold(_ folder: UUID, for time: Duration) {
        landed = folder
        holds += 1
        let this = holds
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: time)
            guard let self, self.holds == this else { return }
            self.landed = nil
        }
    }

    func lit(_ folder: UUID) -> Bool { id == folder || landed == folder }
}

/// The folder under a drag fills in the accent and lifts a little. When something lands it bounces
/// once (Emil, 7 November 2026: a drop went in with nothing to show for it).
private struct FolderDropIcon: View {
    let drops: FolderDropState
    let id: UUID
    let selected: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        let lit = drops.lit(id)
        DropOpenIcon(symbol: "folder", kind: .folder, open: lit, selected: selected || lit)
            .keyframeAnimator(initialValue: 1.0, trigger: drops.landings[id] ?? 0) { content, scale in
                content.scaleEffect(reduceMotion ? 1 : scale)
            } keyframes: { _ in
                SpringKeyframe(1.28, duration: 0.14, spring: .snappy)
                SpringKeyframe(1, duration: 0.3, spring: .bouncy)
            }
    }
}

/// A row's icon that opens while something is held over it (Emil, 7 November 2026): the folder drops
/// its front and shows a page, the trash lifts its lid. At rest it's the system's symbol, as every
/// other row has; the drawn one fades in only while it's needed.
private struct DropOpenIcon: View {
    let symbol: String
    let kind: Charm.Kind
    let open: Bool
    let selected: Bool

    var body: some View {
        ZStack {
            SidebarIcon(name: symbol, selected: selected).opacity(open ? 0 : 1)
            CharmIcon(kind: kind, pointSize: DesignLook.isCandidate ? 14 : 16, agape: open)
                .foregroundStyle(.tint)
                .opacity(open ? 1 : 0)
        }
        // Back to the symbol once it has shut.
        .animation(open ? .easeOut(duration: 0.08) : .easeOut(duration: 0.1).delay(0.14), value: open)
    }
}

/// The row under a drag, tinted, and for a moment after a drop lands in it.
private struct FolderDropFill: View {
    let drops: FolderDropState
    let id: UUID
    let reach: EdgeInsets
    var body: some View {
        let lit = drops.lit(id)
        RoundedRectangle(cornerRadius: Hover.pillRadius, style: .continuous)
            .fill(.tint.opacity(0.3))
            .padding(EdgeInsets(top: -reach.top, leading: -reach.leading, bottom: -reach.bottom, trailing: -reach.trailing))
            .opacity(lit ? 1 : 0)
            .animation(.easeOut(duration: lit ? 0.08 : drops.landedLast == id ? 0.3 : 0.06), value: lit)
    }
}

/// The "Folders" heading as a place to drop a folder: the top level. Only folders: a note can't
/// be outside a folder.
struct TopLevelDrop: DropDelegate {
    @Binding var over: Bool
    let land: ([NSItemProvider]) -> Void

    func validateDrop(info: DropInfo) -> Bool { info.hasItemsConforming(to: [.paneFolder]) }
    func dropEntered(info: DropInfo) { over = true }
    func dropExited(info: DropInfo) { over = false }
    func dropUpdated(info: DropInfo) -> DropProposal? { DropProposal(operation: .move) }
    func performDrop(info: DropInfo) -> Bool {
        over = false
        land(info.itemProviders(for: [.paneItem]))
        return true
    }
}

/// A folder's row as a place to drop. Its own delegate so that a note moves with a move's cursor
/// (round 24: the green + said copy), and a row lights as the drag enters and goes out as it leaves.
struct FolderDrop: DropDelegate {
    static let types: [UTType] = [.paneItem, .fileURL]
    let over: (Bool) -> Void
    let land: ([NSItemProvider]) -> Void

    /// Items of ours move; a file from outside is copied in.
    static func operation(ours: Bool) -> DropOperation { ours ? .move : .copy }

    func validateDrop(info: DropInfo) -> Bool { info.hasItemsConforming(to: Self.types) }
    func dropEntered(info: DropInfo) { over(true) }
    func dropExited(info: DropInfo) { over(false) }
    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: Self.operation(ours: info.hasItemsConforming(to: [.paneItem])))
    }
    func performDrop(info: DropInfo) -> Bool {
        land(info.itemProviders(for: Self.types))
        return true
    }
}

private struct CountedRow: View {
    @Environment(\.modelContext) private var context
    /// The window's notes as the list keeps them: the counts come from there, and the row hears
    /// when they change.
    @Environment(LibraryNotes.self) private var library
    let title: String
    let icon: String
    /// Recently Deleted's count, not All Notes'.
    let trash: Bool
    let files: Int
    /// The sidebar's selection, read here in the row: the sidebar itself isn't worked out again
    /// when it changes (it is an equatable view), and the row draws its own selection on the Mac.
    @Binding var selection: Scope?
    /// A note is held over Recently Deleted.
    @State private var noteOver = false

    private static var noteBeingDragged: Bool {
        #if os(macOS)
        NoteDragging.shared.active
        #else
        false
        #endif
    }

    var body: some View {
        #if DEBUG || QA
        let _ = RenderProbe.count("CountedRow")
        #endif
        let selected = selection == (trash ? .trash : .all)
        let counts = library.libraryCounts(context: context)
        let count = trash ? counts.trashed : counts.live
        // Recently Deleted has no row while nothing is in it, or a note being dragged has nowhere
        // to be thrown away.
        if !trash || SidebarView.showsTrash(notes: count, files: files) || Self.noteBeingDragged {
            Label {
                SidebarRowText(title: title, selected: selected) {
                    Text(count + files, format: .number)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }
            } icon: {
                #if os(macOS)
                if trash { TrashRowIcon(selected: selected, noteOver: noteOver) } else { SidebarIcon(name: icon, selected: selected) }
                #else
                SidebarIcon(name: icon, selected: selected)
                #endif
            }
            .sidebarRowLabel()
            .rowAccessibility(title, count: count, files: files)
            .background {
                let reach = Hover.sidebarReach()
                RoundedRectangle(cornerRadius: Hover.pillRadius, style: .continuous)
                    .fill(.tint.opacity(0.3))
                    .padding(EdgeInsets(top: -reach.top, leading: -reach.leading, bottom: -reach.bottom, trailing: -reach.trailing))
                    .opacity(noteOver ? 1 : 0)
                    .animation(.easeOut(duration: noteOver ? 0.08 : 0.06), value: noteOver)
            }
            .hoverRow(title, reach: Hover.sidebarReach(), selected: selected)
            .quietSelection()
            #if os(macOS)
            .modifier(TrashDrop(active: trash, over: $noteOver))
            #endif
        }
    }
}

/// What the pointer promises over a drop target: something already in the app moves, so no green
/// plus; a file from outside is copied in, and the plus is right.
func dropOperation(fromThisApp: Bool) -> DropOperation { fromThisApp ? .move : .copy }

/// A drop target that says "move" for things dragged inside the app.
private struct MoveDropDelegate: DropDelegate {
    let types: [UTType]
    var targeted: (Bool) -> Void = { _ in }
    let perform: ([NSItemProvider]) -> Bool

    func validateDrop(info: DropInfo) -> Bool { info.hasItemsConforming(to: types) }
    func dropEntered(info: DropInfo) { targeted(true) }
    func dropExited(info: DropInfo) { targeted(false) }
    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: dropOperation(fromThisApp: info.hasItemsConforming(to: [.paneItem])))
    }
    func performDrop(info: DropInfo) -> Bool {
        targeted(false)
        return perform(info.itemProviders(for: types))
    }
}

#if os(macOS)
/// Recently Deleted takes notes and files dragged onto it, as in Notes.
private struct TrashDrop: ViewModifier {
    @Environment(\.modelContext) private var context
    @Environment(\.undoManager) private var undoManager
    let active: Bool
    @Binding var over: Bool
    @State private var lid = TrashLidHold()

    func body(content: Content) -> some View {
        if active {
            content.onDrop(of: [.paneItem], delegate: TrashDropDelegate(context: context, undo: undoManager, over: $over, lid: lid))
        } else {
            content
        }
    }
}

/// A move, not a copy: no green plus on the pointer.
private struct TrashDropDelegate: DropDelegate {
    let context: ModelContext
    let undo: UndoManager?
    @Binding var over: Bool
    let lid: TrashLidHold

    func dropEntered(info: DropInfo) { lid.entered { over = $0 } }
    func dropExited(info: DropInfo) { lid.left(buttonDown: SidebarView.dragButtonDown) { over = $0 } }
    func dropUpdated(info: DropInfo) -> DropProposal? { DropProposal(operation: dropOperation(fromThisApp: true)) }
    func performDrop(info: DropInfo) -> Bool {
        lid.dropped { over = $0 }
        DropLoader.load(info.itemProviders(for: [.paneItem])) { [context, undo] items, _ in
            SidebarView.folderChange { context.trashDropped(items, undo: undo) }
        }
        return true
    }
}

/// Search in the sidebar's toolbar: its lens opens an eye and glances round when you press it.
private struct SidebarSearchButton: View {
    let opens: Notification.Name
    let help: String
    @State private var looks = 0

    var body: some View {
        Button {
            NotificationCenter.default.post(name: opens, object: nil)
            looks += 1
        } label: {
            Label { Text("Search") } icon: { CharmSymbol("magnifyingglass", cue: looks) }
        }
        .help(help)
        .accessibilityIdentifier("sidebar.search")
    }
}

/// Recently Deleted's icon: its trash swallows each note you delete, and someone inside looks round.
private struct TrashRowIcon: View {
    let selected: Bool
    var noteOver = false
    @State private var gulps = 0
    @Environment(\.controlActiveState) private var active

    var body: some View {
        Group {
            if Charm.on {
                Image(systemName: "trash").font(DesignLook.isCandidate ? SidebarStyle.candidateIconFont : SidebarStyle.iconFont).hidden()
                    .overlay { CharmIcon(kind: .trash, pointSize: DesignLook.isCandidate ? 14 : 16, cue: gulps, agape: noteOver) }
            } else {
                DropOpenIcon(symbol: "trash", kind: .trash, open: noteOver, selected: selected)
            }
        }
        .foregroundStyle(selected ? AnyShapeStyle(.tint) : active == .inactive ? AnyShapeStyle(.tertiary)
            : DesignLook.isCandidate ? AnyShapeStyle(Color.muted) : AnyShapeStyle(.primary))
        .frame(minWidth: DesignLook.isCandidate ? 20 : nil)
        .onReceive(NotificationCenter.default.publisher(for: .paneNoteTrashed)) { _ in gulps += 1 }
        .task {
            // The first note deleted brought this row: it answers that one too.
            if let last = Charm.lastTrashed, Date.now.timeIntervalSince(last) < 1 { gulps += 1 }
        }
    }
}

/// Recently Deleted was open and its last note left (recovered, or deleted for good): its row is
/// gone, so the list shows the notes again. A view of its own that reads the list's count of
/// Recently Deleted, so it follows the notes without the sidebar working out its rows again.
private struct EmptyTrashLeaver: View {
    @Environment(\.modelContext) private var context
    @Environment(LibraryNotes.self) private var library
    @Binding var scope: Scope?
    let files: Int

    var body: some View {
        let trashed = library.libraryCounts(context: context).trashed
        let shows = SidebarView.showsTrash(notes: trashed, files: files)
        Color.clear
            .onChange(of: shows, initial: true) { _, shows in
                if let next = SidebarView.leavingEmptyTrash(scope, showsTrash: shows) { scope = next }
            }
            .onChange(of: scope) { _, now in
                if let next = SidebarView.leavingEmptyTrash(now, showsTrash: shows) { scope = next }
            }
    }
}

/// The sidebar's selection drawn the app's way (a neutral fill under a tinted icon and name, see
/// `HoverRowReader`): this turns off the list's own, a solid bar of the accent colour with white
/// text. The row is still the list's selection, so the arrow keys, type-to-select and VoiceOver
/// work as before.
private struct QuietSelection: NSViewRepresentable {
    func makeNSView(context: Context) -> Probe { Probe() }
    func updateNSView(_ view: Probe, context: Context) { view.apply() }

    final class Probe: NSView {
        override func viewDidMoveToSuperview() {
            super.viewDidMoveToSuperview()
            apply()
        }

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            apply()
        }

        func apply() {
            var v = superview
            while let x = v {
                if let table = x as? NSTableView {
                    if table.selectionHighlightStyle != .none { table.selectionHighlightStyle = .none }
                    if let outline = table as? NSOutlineView { EmptyFolderArrow.hide(in: outline) }
                    return
                }
                v = x.superview
            }
        }
    }
}

/// Every folder row on the Mac is one that can open (`FolderTree.body`), so one with no folders
/// inside would show an arrow that opens nothing. This list draws no arrow for a row with nothing
/// under it, as Notes and Finder: the outline view's own way to hide one is a zero frame for it.
/// Only the sidebar's list, marked here; other lists keep theirs.
enum EmptyFolderArrow {
    nonisolated(unsafe) private static var mark: UInt8 = 0
    nonisolated(unsafe) private static var patched: Set<ObjectIdentifier> = []

    /// What the arrow's frame becomes: none for a row with nothing under it.
    static func frame(_ frame: NSRect, children: Int) -> NSRect { children == 0 ? .zero : frame }

    nonisolated(unsafe) private static let outlines = NSHashTable<NSOutlineView>.weakObjects()

    /// A folder got its first folder inside, or lost its last: the list keeps the row (it's the
    /// same kind of row), so it's asked again whether to draw the arrow.
    @MainActor static func refresh() {
        // Again a moment later: a move from a menu reaches the list only once the menu has closed
        // (Move To left Work with no arrow over its new folder, seen on the Air).
        for delay in [0.0, 0.25] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                for outline in outlines.allObjects {
                    for row in 0..<outline.numberOfRows {
                        if let item = outline.item(atRow: row) { outline.reloadItem(item, reloadChildren: false) }
                    }
                }
            }
        }
    }

    /// Whether `outline` is the sidebar's list.
    static func marks(_ outline: NSOutlineView) -> Bool { objc_getAssociatedObject(outline, &mark) as? Bool == true }

    @MainActor static func hide(in outline: NSOutlineView) {
        objc_setAssociatedObject(outline, &mark, true, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        outlines.add(outline)
        // The list's own class, not a key-value observing subclass made for one instance.
        var cls: AnyClass = object_getClass(outline)!
        while NSStringFromClass(cls).hasPrefix("NSKVONotifying_"), let up = class_getSuperclass(cls) { cls = up }
        GapDrop.install(on: outline)
        guard patched.insert(ObjectIdentifier(cls)).inserted else { return }
        let sel = #selector(NSOutlineView.frameOfOutlineCell(atRow:))
        guard let inherited = class_getInstanceMethod(cls, sel) else { return }
        typealias Frame = @convention(c) (NSOutlineView, Selector, Int) -> NSRect
        let original = unsafeBitCast(method_getImplementation(inherited), to: Frame.self)
        let block: @convention(block) (NSOutlineView, Int) -> NSRect = { view, row in
            let own = original(view, sel, row)
            guard objc_getAssociatedObject(view, &mark) as? Bool == true, let item = view.item(atRow: row) else { return own }
            return frame(own, children: view.numberOfChildren(ofItem: item))
        }
        let imp = imp_implementationWithBlock(block)
        // Its own method on the list's class, falling back to NSOutlineView's: never changes NSOutlineView itself.
        if !class_addMethod(cls, sel, imp, method_getTypeEncoding(inherited)) { method_setImplementation(inherited, imp) }
    }
}

/// Where a folder dropped between two rows goes, so it lands where the list's line shows it.
/// The outline view picks an outer level when the pointer is left of a folder's last folder
/// inside, and draws its line for that level at an indent that reads as the inner one (Emil,
/// 9 November 2026: "I hope this doesn't move it out of the folder"). Every folder row can open
/// (`FolderTree.body`), so the gap under one with nothing inside meant "into it". Here a gap is
/// always at the level of the row it follows: after a folder's last folder, inside that folder;
/// under an empty folder, beside it. The way out to the top level is the "Folders" heading or
/// Move To > Top Level.
enum GapDrop {
    /// The drop to use instead of (`item`, `index`), or nil to keep it. `kids` lists an item's
    /// rows (nil: the list's own top), `open` says whether its rows show.
    static func resolve<N>(_ item: N?, _ index: Int, kids: (N?) -> [N], parent: (N) -> N?, open: (N) -> Bool, same: (N, N) -> Bool) -> (item: N?, index: Int)? {
        guard index >= 0 else { return nil }
        let rows = kids(item)
        func after(_ n: N) -> (item: N?, index: Int)? {
            let up = parent(n)
            guard let at = kids(up).firstIndex(where: { same($0, n) }) else { return nil }
            return (up, at + 1)
        }
        // Into a folder with nothing inside: beside it.
        if let item, rows.isEmpty { return after(item) }
        guard index > 0, index - 1 < rows.count else { return nil }
        // The row the gap follows, as far in as it's shown.
        var above = rows[index - 1], deeper = false
        while open(above), let last = kids(above).last { above = last; deeper = true }
        return deeper ? after(above) : nil
    }

    nonisolated(unsafe) private static var patched: Set<ObjectIdentifier> = []

    @MainActor static func install(on outline: NSOutlineView) {
        guard let source = outline.dataSource, let cls = object_getClass(source), patched.insert(ObjectIdentifier(cls)).inserted else { return }
        let sel = NSSelectorFromString("outlineView:validateDrop:proposedItem:proposedChildIndex:")
        guard let method = class_getInstanceMethod(cls, sel) else { return }
        typealias Validate = @convention(c) (AnyObject, Selector, NSOutlineView, NSDraggingInfo, Any?, Int) -> UInt
        let original = unsafeBitCast(method_getImplementation(method), to: Validate.self)
        let block: @convention(block) (AnyObject, NSOutlineView, NSDraggingInfo, Any?, Int) -> UInt = { me, o, info, item, index in
            MainActor.assumeIsolated {
                guard EmptyFolderArrow.marks(o),
                      let moved = resolve(item, index,
                                          kids: { n in (0..<o.numberOfChildren(ofItem: n)).compactMap { o.child($0, ofItem: n) } },
                                          parent: { o.parent(forItem: $0) },
                                          open: { o.isItemExpanded($0) },
                                          same: { ($0 as AnyObject) === ($1 as AnyObject) })
                else { return original(me, sel, o, info, item, index) }
                o.setDropItem(moved.item, dropChildIndex: moved.index)
                return original(me, sel, o, info, moved.item, moved.index)
            }
        }
        method_setImplementation(method, imp_implementationWithBlock(block))
    }
}
#endif

extension View {
    /// On a sidebar row: the list stops drawing its own selection (the row draws it).
    func quietSelection() -> some View {
        #if os(macOS)
        background { QuietSelection().frame(width: 0, height: 0).accessibilityHidden(true) }
        #else
        self
        #endif
    }
}

/// Hiding or showing the sidebar hands the split view's columns over again, and a view that holds
/// an action can't be compared, so the folders were worked out again on every toggle: this view,
/// then every folder row. Nothing it is given changes what it shows: the selection reaches it
/// through its binding, the folders and counts through its queries, and the action is the same
/// action. So two of them are always equal.
extension SidebarView: @MainActor CustomEquatable {
    static func isEqual(_ a: SidebarView, _ b: SidebarView) -> Bool { true }
}

/// A folder row with its sub-folders; accepts dropped notes and folders. Not an equatable view:
/// skipping its updates kept the sidebar's selection from following some clicks on folder rows.
private struct FolderTree: View {
    @Environment(\.modelContext) private var context
    /// The window's notes as the list keeps them: the folder counts come from there.
    @Environment(LibraryNotes.self) private var library: LibraryNotes?
    let folder: Folder
    /// Live files per folder, counted once for the whole tree.
    let files: [UUID: Int]
    /// What the sidebar has selected, read here in the row (the sidebar isn't worked out again
    /// when it changes): the row draws its own selection on the Mac.
    @Binding var selection: Scope?
    /// The folder a drag is over, if any.
    let drops: FolderDropState
    let targeted: (Bool, UUID) -> Void
    @Environment(\.undoManager) private var undoManager
    /// What the folder's menu does.
    let actions: FolderMenuActions
    /// The first folder at the top level (Notes): it has no Move To.
    var notesID: UUID?
    /// How many folders up: the row's content sits that many levels to the right.
    var depth = 0
    /// Folders picked together with ⌘ or ⇧: they show picked too.
    var picked: Set<UUID> = []
    @State private var expanded = true
    /// Ask an AI about this folder: the AI picked in its menu, while the popover shows.
    @State private var asking: AskAI.Target?

    init(folder: Folder, files: [UUID: Int], selection: Binding<Scope?>, naming: Binding<UUID?>, drops: FolderDropState, targeted: @escaping (Bool, UUID) -> Void,
         actions: FolderMenuActions, notesID: UUID? = nil, depth: Int = 0, picked: Set<UUID> = []) {
        self.folder = folder
        self.files = files
        _selection = selection
        _naming = naming
        self.drops = drops
        self.targeted = targeted
        self.actions = actions
        self.notesID = notesID
        self.depth = depth
        self.picked = picked
    }

    /// Mac: the folder whose name is being typed in its row.
    @Binding var naming: UUID?

    var body: some View {
        #if DEBUG || QA
        let _ = RenderProbe.count("FolderTree")
        #endif
        Group {
            #if os(macOS)
            // Always a row that can open, even with no folders inside (its arrow hidden then, see
            // `QuietSelection`): turning a plain row into one that opens, or back, as a folder came
            // or went left the old row drawn over the one that took its place ("Work" and "Ideas"
            // in one row, seen on the Air on 9 November 2026).
            tree
            #else
            if folder.liveChildren.isEmpty {
                label
            } else {
                tree
            }
            #endif
        }
        #if os(macOS)
        // Its arrow shows once a folder is inside, and goes with the last one.
        .onChange(of: folder.liveChildren.isEmpty) { _, _ in EmptyFolderArrow.refresh() }
        #endif
        // A folder made inside this one shows its row, open for its name.
        .onChange(of: naming) { _, id in
            if let id, folder.liveChildren.contains(where: { $0.id == id }) { expanded = true }
        }
    }

    /// Opening and closing a folder. On the Mac it's instant: the list's slide drew the folders
    /// inside over the row below while it ran.
    private var opening: Binding<Bool> {
        #if os(macOS)
        Binding(get: { expanded }, set: { open in
            withTransaction(FolderTree.instant) {
                // A folder inside it was selected: the selection moves up to this folder, as in Notes
                // and Finder. Left on a hidden row, the list drew that row over the one below.
                if !open { selection = SidebarView.selection(afterClosing: folder, selection) }
                expanded = open
            }
        })
        #else
        $expanded
        #endif
    }

    /// No animation: what opening and closing a folder runs in on the Mac.
    static var instant: Transaction {
        var t = Transaction()
        t.disablesAnimations = true
        return t
    }

    private var tree: some View {
            DisclosureGroup(isExpanded: opening) {
                ForEach(folder.liveChildren) { child in
                    FolderTree(folder: child, files: files, selection: $selection, naming: $naming, drops: drops, targeted: targeted, actions: actions, notesID: notesID, depth: depth + 1, picked: picked)
                }
                #if os(macOS)
                // Between two of its folders: the dragged folder goes there, inside this one.
                .onInsert(of: [.paneFolder]) { index, providers in
                    SidebarView.insertFolders(providers, in: folder, at: index, among: folder.liveChildren, context: context)
                }
                #endif
            } label: { label }
    }

    private var label: some View {
        // Under the pointer the count gives way to ••• with the folder's menu.
        let selected = selection == .folder(folder.id) || picked.contains(folder.id)
        let listed = library.map { $0.listedCount(inFolder: folder.id, context: context) } ?? SidebarView.listedNotes(in: folder, context: context)
        return HoverRowReader(id: folder.name, reach: Hover.sidebarReach(depth: depth), selected: selected) { hovering in
            Label {
                #if os(macOS)
                if naming == folder.id {
                    InlineNameField(initial: folder.name,
                                    commit: { typed in
                                        context.finishNaming(folder, typed: typed)
                                        if naming == folder.id { naming = nil }
                                    },
                                    cancel: { if naming == folder.id { naming = nil } })
                        .padding(.trailing, SidebarStyle.trailingInset)
                } else {
                    rowText(selected: selected, hovering: hovering, listed: listed)
                }
                #else
                rowText(selected: selected, hovering: hovering, listed: listed)
                #endif
            } icon: {
                FolderDropIcon(drops: drops, id: folder.id, selected: selected)
            }
            .sidebarRowLabel()
            .rowAccessibility(folder.name, count: listed ?? 0, files: files[folder.id] ?? 0)
            .background { FolderDropFill(drops: drops, id: folder.id, reach: Hover.sidebarReach(depth: depth)) }
        }
        .quietSelection()
        .tag(Scope.folder(folder.id))
        .accessibilityIdentifier("folder.\(folder.name)")
        #if os(macOS)
        // The folder's Move Up and Move Down, without a drag.
        .accessibilityAction(named: FolderAction.moveUp.title) { if context.canNudge(folder, by: -1) { SidebarView.folderChange { context.nudge(folder, by: -1) } } }
        .accessibilityAction(named: FolderAction.moveDown.title) { if context.canNudge(folder, by: 1) { SidebarView.folderChange { context.nudge(folder, by: 1) } } }
        #endif
        .draggable(PaneDragItem(kind: .folder, id: folder.id)) {
            Label(folder.name, systemImage: "folder").padding(8).glassEffect(.regular, in: .capsule)
        }
        // Notes, folders and files from inside the app, and files and folders from Finder, Mail or
        // Safari: they land in this folder.
        .onDrop(of: FolderDrop.types, delegate: FolderDrop(over: { targeted($0, folder.id) }) { providers in
            drops.lifted(folder.id)
            let dropped = DropSpeed.start()
            DropLoader.load(providers) { items, urls in
                DropSpeed.step("loaded", since: dropped)
                defer { DropSpeed.step("moved", since: dropped); DispatchQueue.main.async { DropSpeed.step("next turn", since: dropped) } }
                var moved = false
                for item in items {
                    switch item.kind {
                    case .note:
                        // A dragged multi-selection moves together.
                        let notes = item.ids.compactMap { context.note($0) }
                        if !notes.isEmpty {
                            let back = context.move(notes, to: folder, undo: undoManager)
                            moved = true
                            NotificationCenter.default.post(name: .paneNotesMoved, object: "Moved to \(folder.name)", userInfo: ["undo": back])
                        }
                    case .folder:
                        if item.id != folder.id, let f = context.folder(item.id) { context.move(f, into: folder); moved = true }
                    case .file:
                        for id in item.ids {
                            if let f = context.attachment(id), f.folderID != nil { context.move(f, to: folder); moved = true }
                        }
                    }
                }
                if !urls.isEmpty, !context.importFiles(urls, into: .folder(folder.id)).isEmpty { moved = true }
                if moved {
                    drops.land(folder.id)
                    SidebarView.folderChange { expanded = true }
                }
            }
            // A drop doesn't always say the drag has left the row (round 21: its icon stayed filled).
            targeted(false, SidebarView.everyRow)
            // A row can say it's targeted after the drop has landed (round 22: Travel stayed lit).
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { targeted(false, SidebarView.everyRow) }
        })
        #if os(iOS)
        // The folder's first notes above its menu, as in Notes.
        .contextMenu {
            FolderActionsMenu(folder: folder, isNotes: folder.id == notesID, actions: actions, ask: { asking = $0 })
        } preview: {
            FolderPreview(folder: folder)
        }
        #else
        .contextMenu { macMenu }
        #endif
        .askAIPopover($asking, subject: .folder(folder.name), recent: AskAI.recent(folder), arrowEdge: .trailing)
    }

    /// The name, and its count (••• under the pointer).
    private func rowText(selected: Bool, hovering: Bool, listed: Int?) -> some View {
        SidebarRowText(title: folder.name, selected: selected) {
            HoverSwap(on: hovering, help: "Folder options") {
                if let listed {
                    Text(listed + (files[folder.id] ?? 0), format: .number)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }
            } items: { macMenu }
        }
    }

    /// The folder's menu on the Mac: a right-click, or its ••• under the pointer.
    private var macMenu: some View {
        FolderActionsMenu(folder: folder, isNotes: folder.id == notesID, actions: actions, ask: { asking = $0 })
    }
}

/// When the sidebar looks again at what's connected: on a sign-in or out, and on news of a connection.
private struct AskLoad: Equatable {
    let state: Backend.State?
    let news: Int
}

/// An action on a folder in its menus (`SidebarView.folderMenu`).
enum FolderAction: String, CaseIterable, Identifiable {
    case openInNewWindow, newNote, newFolder, rename, duplicate, move, moveUp, moveDown, delete

    var id: String { rawValue }

    /// A folder opens in a window of its own on the Mac (FolderWindowView), as in Apple Notes.
    nonisolated static var opensWindows: Bool {
        #if os(macOS)
        true
        #else
        false
        #endif
    }

    var title: String {
        switch self {
        case .openInNewWindow: NoteWindows.openFolderTitle
        case .newNote: "New Note"
        case .newFolder: "New Folder"
        case .rename: "Rename"
        case .duplicate: "Duplicate"
        case .move: "Move To"
        case .moveUp: "Move Up"
        case .moveDown: "Move Down"
        #if os(macOS)
        case .delete: "Delete Folder…"
        #else
        case .delete: "Delete Folder"
        #endif
        }
    }

    var symbol: String {
        switch self {
        case .openInNewWindow: NoteWindows.symbol
        case .newNote: "square.and.pencil"
        case .newFolder: "folder.badge.plus"
        case .rename: "pencil"
        case .duplicate: "plus.square.on.square"
        case .move: "folder"
        case .moveUp: "arrow.up"
        case .moveDown: "arrow.down"
        case .delete: "trash"
        }
    }
}

/// A folder row is worked out again when what it shows changes: its folder (its name and counts
/// it reads itself), the files, the selection, the drop. Not for the sidebar's actions, made new
/// on every pass but doing the same things: as inputs they worked every folder row out again with
/// each pass (180 rows against 72 for three saves).
extension FolderTree: @MainActor CustomEquatable {
    static func isEqual(_ a: FolderTree, _ b: FolderTree) -> Bool {
        a.folder.id == b.folder.id && a.files == b.files && a.selection == b.selection
            && a.notesID == b.notesID && a.depth == b.depth && a.picked == b.picked
    }
}

/// What a folder's menu items do, given by the sidebar.
struct FolderMenuActions {
    var openInNewWindow: (Folder) -> Void = { _ in }
    var newNote: (Folder) -> Void = { _ in }
    var newFolder: (Folder) -> Void = { _ in }
    var rename: (Folder) -> Void = { _ in }
    var duplicate: (Folder) -> Void = { _ in }
    /// iPhone: Move To opens a sheet of the folders.
    var moveSheet: (Folder) -> Void = { _ in }
    /// Mac: Move To's submenu moves it straight away (nil: the top level).
    var move: (Folder, UUID?) -> Void = { _, _ in }
    /// Mac: Move Up (-1) and Move Down (+1), one place among the folders beside it.
    var nudge: (Folder, Int) -> Void = { _, _ in }
    var delete: (Folder) -> Void = { _ in }
}

/// A folder's menu, the same items on both platforms (`SidebarView.folderMenu`): on the Mac Open
/// in New Window; New Note and New Folder; Rename, Duplicate and Move To; then Delete Folder. On the Mac Move To is a submenu
/// of the folders; on iPhone it opens them in a sheet. Its icons are drawn in the menu's own
/// colour, as Apple's menus draw them, not in the app's amber (the window's tint, set on the
/// whole app in PaneApp, would reach them); Delete is red on iPhone.
private struct FolderActionsMenu: View {
    @Environment(\.modelContext) private var context
    let folder: Folder
    let isNotes: Bool
    let actions: FolderMenuActions
    /// Ask an AI about the folder (its popover is the row's). Nil: not offered here.
    var ask: ((AskAI.Target) -> Void)? = nil

    var body: some View {
        let groups = SidebarView.folderMenu(isNotes: isNotes)
        // Ask an AI, in a group of its own before Delete (at the end for Notes, which has none).
        let askAt = groups.firstIndex(where: { $0.contains(.delete) }) ?? groups.count
        let targets = ask == nil ? [] : ConnectedAIs.shared.targets
        Group {
            ForEach(Array(groups.enumerated()), id: \.offset) { i, group in
                if i > 0 { Divider() }
                if i == askAt, let ask, !targets.isEmpty {
                    AskAIMenuItems(subject: .folder(folder.name), targets: targets, ask: ask)
                    Divider()
                }
                ForEach(group) { item($0) }
            }
            if askAt == groups.count, let ask, !targets.isEmpty {
                Divider()
                AskAIMenuItems(subject: .folder(folder.name), targets: targets, ask: ask)
            }
        }
        #if os(macOS)
        .tint(nil)
        #else
        .tint(.primary)
        #endif
    }

    @ViewBuilder private func item(_ action: FolderAction) -> some View {
        #if os(macOS)
        if action == .move {
            Menu(action.title, systemImage: action.symbol) {
                ForEach(SidebarView.moveTargets(for: folder, in: context.allFolders())) { t in
                    // A level in for each folder above it; ticked where the folder is now.
                    Toggle(String(repeating: "\u{2003}", count: t.depth) + t.name, isOn: Binding(get: { t.current }, set: { _ in
                        if !t.current { actions.move(folder, t.folder) }
                    }))
                    .disabled(!t.enabled)
                    .accessibilityIdentifier("moveFolder.\(t.name)")
                    if t.folder == nil { Divider() }
                }
            }
            .accessibilityIdentifier("folderMenu.move")
        } else {
            button(action)
        }
        #else
        button(action)
        #endif
    }

    private func button(_ action: FolderAction) -> some View {
        DestructiveMenuButton(action.title, systemImage: action.symbol, destructive: action == .delete) {
            switch action {
            case .openInNewWindow: actions.openInNewWindow(folder)
            case .newNote: actions.newNote(folder)
            case .newFolder: actions.newFolder(folder)
            case .rename: actions.rename(folder)
            case .duplicate: actions.duplicate(folder)
            case .move: actions.moveSheet(folder)
            case .moveUp: actions.nudge(folder, -1)
            case .moveDown: actions.nudge(folder, 1)
            case .delete: actions.delete(folder)
            }
        }
        // At either end of its folders there is nowhere to go.
        .disabled(action == .moveUp && !context.canNudge(folder, by: -1) || action == .moveDown && !context.canNudge(folder, by: 1))
        .accessibilityIdentifier("folderMenu.\(action.rawValue)")
    }
}

#if os(iOS)

/// All Notes, Notes and Recently Deleted while the folders screen is in Edit: dimmed, with no
/// count, and they do nothing, as in Notes.
private struct FixedFolderRow: View {
    let title: String
    let icon: String

    var body: some View {
        Label {
            Text(title)
        } icon: {
            Image(systemName: icon).font(SidebarStyle.iconFont)
        }
        .foregroundStyle(.tertiary)
        .sidebarRowLabel()
        .disabled(true)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityAddTraits(.isStaticText)
        .accessibilityValue("Can't be edited")
    }
}

/// A folder in Edit: a level in for each folder above it, its ••• menu at the right, before the
/// list's handle.
private struct EditFolderRow: View {
    let folder: Folder
    let depth: Int
    let isNotes: Bool
    let actions: FolderMenuActions

    var body: some View {
        HStack(spacing: 8) {
            Label {
                Text(folder.name).lineLimit(1)
            } icon: {
                SidebarIcon(name: "folder")
            }
            .sidebarRowLabel()
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier("folder.\(folder.name)")
            .padding(.leading, CGFloat(depth) * 22)
            Spacer(minLength: 8)
            Menu {
                FolderActionsMenu(folder: folder, isNotes: isNotes, actions: actions)
            } label: {
                // The app's accent, as the folder icons; the row keeps its height (the row is the target's height).
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
                    .foregroundStyle(Color(PColor.paneAccent))
                    .frame(width: 44)
                    .frame(maxHeight: .infinity)
                    .contentShape(.rect)
            }
            // Its items in the label colour, Delete in red, as in Notes.
            .tint(.primary)
            .accessibilityLabel("Folder options")
            .accessibilityIdentifier("folder.more.\(folder.name)")
        }
    }
}

/// The long-press preview of a folder, as in Notes: its first notes as cards, two by two, and
/// under them its name and how many notes it holds.
private struct FolderPreview: View {
    let folder: Folder

    static let width: CGFloat = 340

    var body: some View {
        let live = folder.liveNotes
        let first = live.sorted { $0.isPinned != $1.isPinned ? $0.isPinned : $0.updatedAt > $1.updatedAt }.prefix(4)
        VStack(alignment: .leading, spacing: 0) {
            if !first.isEmpty {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible())], spacing: 8) {
                    ForEach(Array(first)) { card($0) }
                }
                .padding([.horizontal, .top], 8)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(folder.name).font(.title3.weight(.semibold)).lineLimit(1)
                Text(live.count == 1 ? "1 note" : "\(live.count) notes").foregroundStyle(.secondary)
            }
            .padding(16)
        }
        .frame(width: Self.width, alignment: .leading)
        .background(Color(Palette.row))
    }

    private func card(_ note: Note) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(note.title).font(.subheadline.weight(.semibold)).lineLimit(2)
            if !note.isLocked, note.preview != NoteText.noPreview {
                Text(note.preview).font(.caption).foregroundStyle(.secondary).lineLimit(6)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, minHeight: 130, maxHeight: 130, alignment: .topLeading)
        .background(.fill.tertiary, in: .rect(cornerRadius: 10, style: .continuous))
    }
}

/// Move To, for a folder: the top level or any folder, each a level in under its own
/// (`SidebarView.moveTargets`). The folder itself and the folders inside it are dimmed; where it
/// is now is ticked.
private struct FolderMoveSheet: View {
    let folder: Folder
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let targets = SidebarView.moveTargets(for: folder, in: context.allFolders())
        NavigationStack {
            List {
                Section {
                    ForEach(targets) { t in
                        choice(t.name, symbol: t.folder == nil ? "arrow.up.to.line" : "folder", depth: t.depth, current: t.current, enabled: t.enabled,
                               id: t.folder == nil ? "moveFolder.top" : "moveFolder.\(t.name)") {
                            context.move(folder, into: t.folder.flatMap { context.folder($0) })
                        }
                    }
                }
                .listRowBackground(Color(Palette.row))
            }
            .scrollContentBackground(.hidden)
            .background(Color(Palette.foldersGround).ignoresSafeArea())
            .navigationTitle("Move \u{201C}\(folder.name)\u{201D}")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", role: .cancel) { dismiss() }
                        .accessibilityIdentifier("moveFolder.cancel")
                }
            }
        }
        // Cancel in the label colour, not amber.
        .tint(.primary)
        .presentationDetents([.medium, .large])
    }

    private func choice(_ name: String, symbol: String, depth: Int, current: Bool, enabled: Bool, id: String, action: @escaping () -> Void) -> some View {
        Button {
            withAnimation(.snappy) { action() }
            dismiss()
        } label: {
            HStack {
                Label { Text(name).foregroundStyle(.primary) } icon: { Image(systemName: symbol).foregroundStyle(Color(PColor.paneAccent)) }
                    .padding(.leading, CGFloat(depth) * 22)
                Spacer()
                if current { Image(systemName: "checkmark").font(.body.weight(.semibold)).foregroundStyle(.secondary) }
            }
            // The folder itself and the folders inside it: listed, so the tree reads whole, but dimmed.
            .opacity(enabled ? 1 : 0.35)
            .contentShape(.rect)
        }
        .disabled(current || !enabled)
        .accessibilityIdentifier(id)
    }
}

/// What the folders screen's search finds: every note whose text holds the words, newest first,
/// each with its folder under it, as in Notes. A tap opens the note in its folder.
private struct FolderSearchResults: View {
    @Environment(\.modelContext) private var context
    @Environment(LibraryNotes.self) private var library
    let query: String
    let open: (UUID) -> Void

    var body: some View {
        let live = library.entries(in: context).filter { !$0.deleted && !$0.trashed }
        let found = NoteListView.found(query, in: live, listedBy: .standard, context: context)
        List {
            Section {
                ForEach(found) { entry in
                    if let note = entry.note(in: context) {
                        Button { open(note.id) } label: {
                            NoteRow(note: note, query: query, showFolder: true)
                                .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        .listRowInsets(.horizontal, RowMetrics.sideInset)
                        .accessibilityIdentifier("folders.found")
                    }
                }
            }
            .listRowBackground(Color(Palette.row))
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Color(Palette.foldersGround).ignoresSafeArea())
        .overlay {
            if found.isEmpty { ContentUnavailableView.search(text: query) }
        }
    }
}
#endif

#if os(macOS)
/// Hide Sidebar / Show Sidebar, first beside the window's buttons.
struct SidebarToggleButton: View {
    @Environment(\.toggleSidebar) private var toggleSidebar

    var body: some View {
        if let toggleSidebar {
            Button(toggleSidebar.title, systemImage: "sidebar.left") { toggleSidebar() }
                .help(toggleSidebar.title + " (\u{2303}\u{2318}S)")
                .accessibilityIdentifier("sidebar.toggle")
        }
    }
}
#endif

extension Notification.Name {
    /// Notes went to a folder: the note's page says so (the object is what to say).
    static let paneNotesMoved = Notification.Name("pane.notesMoved")
}

#if os(iOS)
/// Your photo at the top left of the folders (iPhone): the way into Settings. The photo alone, no
/// glass around it (Emil, 28 October 2026).
struct AccountPhotoButton: View {
    let photo: PImage?
    let name: String?
    /// The name VoiceOver reads.
    let spoken: String
    let open: () -> Void

    static var photo: CGFloat { SidebarStyle.phonePhoto }

    var body: some View {
        Button(action: open) {
            AvatarView(photo: photo, name: name, size: Self.photo)
                .frame(width: Self.photo, height: Self.photo)
                .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Account, \(spoken). Opens Settings")
        .accessibilityIdentifier("sidebar.settings")
    }
}
#endif
