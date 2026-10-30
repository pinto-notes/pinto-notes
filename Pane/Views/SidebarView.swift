import SwiftData
import SwiftUI

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
/// circle and your name. Clicking it opens Settings at its first page, as ⌘, does (owner,
/// 2026-10-29: not straight onto Profile). Your name, how you sign in and Sign Out… are on its
/// Profile page; signing out asks first, so a slip of the mouse here can never sign you out.
struct AccountButton: View {
    let backend: Backend
    /// Captures: a second line with the email, when it is a real one (the alternative look).
    var email: String?
    @State private var profile = ProfileStore.shared

    static let avatar: CGFloat = 28
    /// Inside its highlight: the photo starts as far in as a folder row's icon starts inside its pill.
    static let inset = Hover.sidebarReach().leading

    private var name: String { AccountName.shown(profile.name) }

    /// Settings on the notes window in front, at its first page: the same as ⌘,.
    static func open(_ route: SettingsRoute = .shared) { route.show() }

    var body: some View {
        Button {
            Self.open()
        } label: {
            HStack(spacing: 9) {
                AvatarView(photo: profile.shownPhoto, name: AccountName.isSet(profile.name) ? name : nil, size: Self.avatar)
                VStack(alignment: .leading, spacing: 1) {
                    Text(name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    if let email {
                        Text(email)
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, Self.inset)
            .frame(height: 42)
            .hoverHighlight(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .help("Settings")
        .accessibilityLabel("Settings")
        .accessibilityIdentifier("sidebar.account")
        .task(id: backend.state) { await profile.bind(backend) }
    }
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

    private var beside: some View {
        HStack {
            #if os(macOS)
            Text(title).foregroundStyle(selected ? AnyShapeStyle(.tint) : AnyShapeStyle(.primary))
            #else
            Text(title)
            #endif
            Spacer()
            #if os(macOS)
            // One column for every row's count and its ••• under the pointer, their right edges on
            // one line, and as far in from the selection's edge as the icon is on the left.
            trailing.frame(minWidth: SidebarStyle.trailingColumn, alignment: .trailing).padding(.trailing, SidebarStyle.trailingInset)
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
    #if os(macOS)
    static let iconFont = Font.system(size: 17, weight: .regular)
    /// The candidates' icon (DesignLook, DESIGN.md Icons): medium, and smaller and lighter than the
    /// name beside it, so the names lead.
    static let candidateIconFont = Font.system(size: 14, weight: .medium)
    /// The rows' icons' left edge from the sidebar's own: where the title's mark, the Folders
    /// heading and the account's photo start too, so they all share one line (owner, 2026-10-12:
    /// three edges a few points apart). Measured from the list as AppKit lays it out: the icon of
    /// a row sits 21 pt in, 7.5 pt further once any folder has sub-folders (the outline keeps a
    /// column for the arrows), and the section heading's text sits 15 pt in.
    static func edge(nested: Bool) -> CGFloat { nested ? 28.5 : 21 }
    static let headingInset: CGFloat = 15
    static let trailingColumn: CGFloat = 16
    static let trailingInset: CGFloat = 7
    /// Where the list puts a row's content in the sidebar's glass: 16 pt in from either side, the
    /// icon first; 9 pt further in once any folder has sub-folders (measured 2026-10-29, macOS 26;
    /// `AccountRowTests` measures it again from the list).
    static func rowContent(nested: Bool) -> (leading: CGFloat, trailing: CGFloat) { (nested ? 25 : 16, 16) }
    /// A top-level row's pill, from the sidebar's edges: its content, widened by `Hover.sidebarReach`.
    static func rowPill(nested: Bool) -> (leading: CGFloat, trailing: CGFloat) {
        let content = rowContent(nested: nested), reach = Hover.sidebarReach()
        return (content.leading - reach.leading, content.trailing - reach.trailing)
    }
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
            .foregroundStyle(SidebarStyle.icon)
            #endif
    }
}

extension View {
    /// One element per sidebar row, read as "Travel, 4 notes". Without it VoiceOver reads the
    /// folder symbol's own name ("Move") before the row's.
    func rowAccessibility(_ name: String, count: Int, files: Int = 0) -> some View {
        let notes = count == 1 ? "1 note" : "\(count) notes"
        return accessibilityElement(children: .ignore)
            .accessibilityLabel(name)
            .accessibilityValue(files == 0 ? notes : notes + (files == 1 ? ", 1 file" : ", \(files) files"))
    }
}

extension Notification.Name {
    /// Asks the sidebar to start a new folder (from the list's "⋯" menu).
    static let paneNewFolder = Notification.Name("pane.newFolder")
}

struct SidebarView: View {
    @Environment(\.modelContext) private var context
    @Binding var scope: Scope?
    let onNewNote: () -> Void
    /// A note found by the folders screen's search (iPhone): it opens in its folder.
    var onOpenNote: (UUID) -> Void = { _ in }

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
    @State private var newFolderParent: Folder??
    @State private var nameDraft = ""
    @State private var dropTarget: UUID?
    @State private var deletingFolder: Folder?
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
    @Environment(\.horizontalSizeClass) private var sizeClass
    #endif
    @Environment(SetupStore.self) private var setup: SetupStore?
    @Environment(\.dynamicTypeSize) private var templatesTypeSize
    @Environment(\.importActions) private var imports
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?

    /// All Notes and Recently Deleted, counted by the store (unsaved changes included), as the list
    /// shows them.
    static func counts(in context: ModelContext) -> (live: Int, trashed: Int) {
        let live = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? 0
        let trashed = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt != nil }))) ?? 0
        return (live, trashed)
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
    /// The title of the alert that asks for a folder's name.
    nonisolated static func nameAlertTitle(renaming: Bool, inside: Bool) -> String {
        renaming ? "Rename Folder" : inside ? "New Subfolder" : "New Folder"
    }

    /// Recently Deleted is listed only while it holds something, like Notes.
    nonisolated static func showsTrash(notes: Int, files: Int) -> Bool { notes + files > 0 }

    /// Where the list goes when Recently Deleted is open and has just emptied (nil: stay).
    nonisolated static func leavingEmptyTrash(_ scope: Scope?, showsTrash: Bool) -> Scope? {
        scope == .trash && !showsTrash ? .all : nil
    }

    /// Whether any folder has sub-folders: the list then keeps a column for their arrows.
    /// The folders' parents are read, not every folder's children (800 folders: 800 lists read
    /// for each update of the sidebar).
    private var nested: Bool { folders.contains { $0.parent.map { $0.deletedAt == nil } ?? false } }

    private var roots: [Folder] { folders.filter { $0.parent == nil || $0.parent?.deletedAt != nil } }

    var body: some View {
        #if DEBUG
        RenderProbe.count("SidebarView")
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
        .scrollContentBackground(.hidden)
        .background(Color(Palette.foldersGround).ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(spacing: 0) {
                if let card = sidebarCard, card != .mac, !editingFolders {
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
            // A little of the icon's brown inside the sidebar's glass, which stays vibrant.
            .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
        #endif
    }

    /// The folders as you pick one: a tap opens it.
    private func selectList(_ files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        List(selection: $scope) {
            Section {
                // "All Notes" only earns its row once there's more than one folder.
                if folders.count > 1 {
                    CountedRow(title: "All Notes", icon: "tray.full", trash: false, files: files.live, selection: $scope)
                        .tag(Scope.all)
                        .accessibilityIdentifier("sidebar.all")
                }
                ForEach(roots) { folder in
                    #if os(iOS)
                    FolderTree(folder: folder, files: files.byFolder, selection: $scope, dropTarget: dropTarget, targeted: folderTargeted, rename: startRename, newSub: startNewFolder, delete: deleteFolder, move: startMove, notesID: roots.first?.id)
                    #else
                    FolderTree(folder: folder, files: files.byFolder, selection: $scope, dropTarget: dropTarget, targeted: folderTargeted, rename: startRename, newSub: startNewFolder, delete: deleteFolder)
                    #endif
                }
                // Last in the same list, like Notes, and like Notes only while something is in it.
                CountedRow(title: "Recently Deleted", icon: "trash", trash: true, files: files.trashed, selection: $scope)
                    .tag(Scope.trash)
                    .accessibilityIdentifier("sidebar.trash")
            } header: {
                // On iPhone the screen's title says it (Emil, 29 October 2026).
                #if os(macOS)
                Text("Folders")
                    .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarStyle.headingInset)
                #endif
            }
            #if os(iOS)
            .listRowBackground(Color(Palette.row))
            #endif
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
    }

    /// The app's name above, the menus, drops and the toolbar.
    private func withChrome(_ content: some View, files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        content
        #if os(macOS)
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
        #endif
        .onAppear(perform: settleScope)
        .onChange(of: folders.map(\.id)) { _, _ in settleScope() }
        // Launch restores All Notes after this list first appears.
        .onChange(of: scope) { _, _ in settleScope() }
        // Right-click anywhere in the sidebar; a folder's own menu comes from its row.
        .contextMenu(forSelectionType: Scope.self) { items in
            if items.isEmpty || items.contains(.all) || items.contains(.trash) {
                Button("New Folder", systemImage: "folder.badge.plus") { startNewFolder(nil) }
            }
        }
        .dropDestination(for: PaneDragItem.self) { items, _ in
            // Dropping a folder on empty sidebar space moves it to the top level.
            var moved = false
            for item in items where item.kind == .folder {
                if let f = context.folder(item.id) { context.move(f, into: nil); moved = true }
            }
            return moved
        }
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
                        Button { showSettings = true } label: {
                            AvatarView(photo: ProfileStore.shared.shownPhoto, name: AccountName.isSet(ProfileStore.shared.name) ? name : nil, size: Self.avatar)
                                // The photo alone, no glass around it (Emil, 28 October 2026), still a finger's target.
                                .frame(width: 44, height: 44)
                                .contentShape(.circle)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Account, \(name). Opens Settings")
                        .accessibilityIdentifier("sidebar.settings")
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
            if sizeClass == .compact {
                SearchComposeBar(newNote: onNewNote, identifier: "sidebar.newNote")
            } else {
                // iPad: the notes' list beside this one has the search.
                ToolbarSpacer(.flexible, placement: .bottomBar)
                SearchComposeBar.Compose(newNote: onNewNote, identifier: "sidebar.newNote")
            }
            #else
            // Where the sidebar button was, at the sidebar's trailing edge: search every note.
            ToolbarSpacer(.flexible)
            ToolbarItem {
                Button("Search", systemImage: "magnifyingglass") {
                    NotificationCenter.default.post(name: .paneSearchNotes, object: nil)
                }
                .help("Search (⌘F)")
                .accessibilityIdentifier("sidebar.search")
            }
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

    /// The profile photo at the top right: big enough to tell whose it is, inside its 44 pt target.
    static let avatar: CGFloat = 38
    #endif

    /// The folders screen's search on iPhone; while it has words, the notes it finds in place of
    /// the folders. (On iPad the notes' list beside this one searches.)
    @ViewBuilder private func searchable(_ folders: some View) -> some View {
        #if os(iOS)
        if sizeClass == .compact {
            let query = search.trimmingCharacters(in: .whitespaces)
            Group {
                if query.isEmpty { folders } else { FolderSearchResults(query: query, open: onOpenNote) }
            }
            .searchable(text: $search, prompt: "Search")
            .searchToolbarBehavior(.automatic)
        } else {
            folders
        }
        #else
        folders
        #endif
    }

    /// The account at the foot, Settings, and the folder dialogs.
    private func withDialogs(_ content: some View) -> some View {
        content
        #if os(macOS)
        .safeAreaBar(edge: .bottom, spacing: 0) {
            if let backend, case .signedIn = backend.state {
                VStack(alignment: .leading, spacing: 4) {
                    if let card = sidebarCard {
                        // Its words start on the rows' icons' line, like the title and the account.
                        cardView(card)
                            .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarCardMetrics.padding)
                            .padding(.trailing, 10)
                            .padding(.bottom, 2)
                    }
                    OfflineLine(sync: sync)
                    // Its highlight where a folder row's pill is, the photo on the rows' icons' line.
                    AccountButton(backend: backend)
                        .padding(.leading, SidebarStyle.rowPill(nested: nested).leading)
                        .padding(.trailing, SidebarStyle.rowPill(nested: nested).trailing)
                }
                .padding(.bottom, 8)
                .animation(.easeOut(duration: 0.25), value: sync?.reach)
            }
        }
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { sidebarHeight = $0 }
        .onReceive(NotificationCenter.default.publisher(for: .paneNewFolder)) { _ in startNewFolder(nil) }
        #endif
        .sheet(isPresented: $showSettings) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
        #if os(iOS)
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

    /// The one card above the account: Connect your AI, then Templates (`SidebarCard.pick`).
    private var sidebarCard: SidebarCard? {
        guard let backend, case .signedIn = backend.state, let account = backend.userID else { return nil }
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
            case .connect: ConnectCard(onConnect: { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }, onClose: close)
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

    /// What a folder's long-press menu and its ••• in Edit offer, as in Notes: a row of Move and
    /// Delete, then Rename (and New Subfolder). Notes has no Move: it stays first. Pinto has no
    /// folder sharing, so no Share.
    nonisolated static func folderActions(isNotes: Bool) -> (row: [FolderAction], list: [FolderAction]) {
        isNotes ? ([], [.rename, .newSubfolder, .delete]) : ([.move, .delete], [.rename, .newSubfolder])
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
                if folders.count > 1 {
                    FixedFolderRow(title: "All Notes", icon: "tray.full").accessibilityIdentifier("sidebar.all")
                }
                ForEach(rows) { row in
                    if let folder = byID[row.id] {
                        Group {
                            if row.pinned {
                                FixedFolderRow(title: folder.name, icon: "folder").accessibilityIdentifier("folder.\(folder.name)")
                            } else {
                                EditFolderRow(folder: folder, depth: row.depth, isNotes: false, rename: startRename, newSub: startNewFolder, move: startMove, delete: deleteFolder)
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
        let settled = Scope.settled(scope, liveFolders: folders.map(\.id))
        if settled != scope { scope = settled }
    }

    /// A drag is over a folder's row, or has left it.
    private func folderTargeted(_ over: Bool, _ id: UUID) {
        withAnimation(.snappy(duration: 0.18)) { dropTarget = over ? id : (dropTarget == id ? nil : dropTarget) }
    }

    private func startRename(_ f: Folder) { nameDraft = f.name; renaming = f }
    private func startMove(_ f: Folder) { movingFolder = f }
    private func startNewFolder(_ parent: Folder?) { nameDraft = ""; newFolderParent = .some(parent) }

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

    /// Asks first when the folder holds notes, like Notes: they move to Recently Deleted.
    private func deleteFolder(_ f: Folder) {
        if f.liveNotes.isEmpty && f.liveChildren.isEmpty && context.files(in: f.id).isEmpty { performDelete(f) } else { deletingFolder = f }
    }

    private func performDelete(_ f: Folder) {
        if scope == .folder(f.id) { scope = .all }
        withAnimation(.snappy) { context.trash(f) }
    }
}

/// "All Notes" or "Recently Deleted" with its count, as the list counts its notes (LibraryNotes):
/// the row hears only when that count changes. It used to follow every note with a query and
/// count by asking the store, which read every note's row from disk, on each change.
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

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("CountedRow")
        #endif
        let selected = selection == (trash ? .trash : .all)
        let counts = library.libraryCounts(context: context)
        let count = trash ? counts.trashed : counts.live
        // Recently Deleted has no row while nothing is in it.
        if !trash || SidebarView.showsTrash(notes: count, files: files) {
            Label {
                SidebarRowText(title: title, selected: selected) {
                    Text(count + files, format: .number)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }
            } icon: {
                SidebarIcon(name: icon, selected: selected)
            }
            .sidebarRowLabel()
            .rowAccessibility(title, count: count, files: files)
            .hoverRow(title, reach: Hover.sidebarReach(), selected: selected)
            .quietSelection()
        }
    }
}

#if os(macOS)
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
                    return
                }
                v = x.superview
            }
        }
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
extension SidebarView: @MainActor Equatable {
    static func == (a: SidebarView, b: SidebarView) -> Bool { true }
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
    let dropTarget: UUID?
    let targeted: (Bool, UUID) -> Void
    let rename: (Folder) -> Void
    let newSub: (Folder) -> Void
    let delete: (Folder) -> Void
    /// iPhone: Move, from the folder's long-press menu.
    var move: (Folder) -> Void = { _ in }
    /// The first folder at the top level (Notes): it has no Move.
    var notesID: UUID?
    /// How many folders up: the row's content sits that many levels to the right.
    var depth = 0
    @State private var expanded = true

    var body: some View {
        #if DEBUG
        let _ = RenderProbe.count("FolderTree")
        #endif
        if folder.liveChildren.isEmpty {
            label
        } else {
            DisclosureGroup(isExpanded: $expanded) {
                ForEach(folder.liveChildren) { child in
                    FolderTree(folder: child, files: files, selection: $selection, dropTarget: dropTarget, targeted: targeted, rename: rename, newSub: newSub, delete: delete, move: move, notesID: notesID, depth: depth + 1)
                }
            } label: { label }
        }
    }

    private var label: some View {
        // Under the pointer the count gives way to ••• with the folder's menu.
        let selected = selection == .folder(folder.id)
        let listed = library.map { $0.listedCount(inFolder: folder.id, context: context) } ?? SidebarView.listedNotes(in: folder, context: context)
        return HoverRowReader(id: folder.name, reach: Hover.sidebarReach(depth: depth), selected: selected) { hovering in
            Label {
                SidebarRowText(title: folder.name, selected: selected) {
                    HoverSwap(on: hovering, help: "Folder options") {
                        if let listed {
                            Text(listed + (files[folder.id] ?? 0), format: .number)
                                .monospacedDigit()
                                .foregroundStyle(.secondary)
                        }
                    } items: { menuItems }
                }
            } icon: {
                SidebarIcon(name: dropTarget == folder.id ? "folder.fill" : "folder", selected: selected)
                    .contentTransition(.symbolEffect(.replace))
            }
            .sidebarRowLabel()
            .rowAccessibility(folder.name, count: listed ?? 0, files: files[folder.id] ?? 0)
        }
        .quietSelection()
        .tag(Scope.folder(folder.id))
        .accessibilityIdentifier("folder.\(folder.name)")
        .draggable(PaneDragItem(kind: .folder, id: folder.id)) {
            Label(folder.name, systemImage: "folder").padding(8).glassEffect(.regular, in: .capsule)
        }
        // Notes, folders and files from inside the app, and files and folders from Finder, Mail or
        // Safari: they land in this folder.
        .onDrop(of: [.paneItem, .fileURL], isTargeted: Binding(get: { dropTarget == folder.id }, set: { over in targeted(over, folder.id) })) { providers in
            DropLoader.load(providers) { items, urls in
                var moved = false
                for item in items {
                    switch item.kind {
                    case .note:
                        // A dragged multi-selection moves together.
                        for id in item.ids {
                            if let n = context.note(id) { context.move(n, to: folder); moved = true }
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
                if moved { withAnimation(.snappy) { expanded = true } }
            }
            return true
        }
        #if os(iOS)
        // Notes' menu: the folder's first notes above it, and Move, Delete and Rename.
        .contextMenu {
            FolderActionsMenu(folder: folder, isNotes: folder.id == notesID, rename: rename, newSub: newSub, move: move, delete: delete)
                .tint(.primary)
        } preview: {
            FolderPreview(folder: folder)
        }
        #else
        .contextMenu { menuItems }
        #endif
    }

    /// The folder's menu: a right-click, or its ••• under the pointer.
    @ViewBuilder private var menuItems: some View {
        Button("New Subfolder", systemImage: "folder.badge.plus") { newSub(folder) }
        Button("Rename", systemImage: "pencil") { rename(folder) }
        if folder.parent != nil {
            Button("Move to Top Level", systemImage: "arrow.up.to.line") { context.move(folder, into: nil) }
        }
        Divider()
        Button("Delete Folder…", systemImage: "trash", role: .destructive) { delete(folder) }
    }
}

/// An action on a folder in its menus.
enum FolderAction: String, CaseIterable, Identifiable {
    case move, delete, rename, newSubfolder

    var id: String { rawValue }

    var title: String {
        switch self {
        case .move: "Move"
        case .delete: "Delete"
        case .rename: "Rename"
        case .newSubfolder: "New Subfolder"
        }
    }

    var symbol: String {
        switch self {
        case .move: "folder"
        case .delete: "trash"
        case .rename: "pencil"
        case .newSubfolder: "folder.badge.plus"
        }
    }
}

#if os(iOS)
/// A folder's menu on iPhone, long-pressed or from its ••• in Edit: Move and Delete side by side
/// (Delete in red), then Rename, as in Notes (`SidebarView.folderActions`).
private struct FolderActionsMenu: View {
    let folder: Folder
    let isNotes: Bool
    let rename: (Folder) -> Void
    let newSub: (Folder) -> Void
    let move: (Folder) -> Void
    let delete: (Folder) -> Void

    var body: some View {
        let actions = SidebarView.folderActions(isNotes: isNotes)
        if !actions.row.isEmpty {
            ControlGroup {
                ForEach(actions.row) { button($0) }
            }
        }
        ForEach(actions.list) { button($0) }
    }

    private func button(_ action: FolderAction) -> some View {
        Button(action.title, systemImage: action.symbol, role: action == .delete ? .destructive : nil) {
            switch action {
            case .move: move(folder)
            case .delete: delete(folder)
            case .rename: rename(folder)
            case .newSubfolder: newSub(folder)
            }
        }
        .accessibilityIdentifier("folderMenu.\(action.rawValue)")
    }
}

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
    let rename: (Folder) -> Void
    let newSub: (Folder) -> Void
    let move: (Folder) -> Void
    let delete: (Folder) -> Void

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
                FolderActionsMenu(folder: folder, isNotes: isNotes, rename: rename, newSub: newSub, move: move, delete: delete)
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

/// Move, for a folder: the top level or any folder not inside it, each a level in under its own.
/// Where it is now is ticked.
private struct FolderMoveSheet: View {
    let folder: Folder
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let inside = SidebarView.subtree(of: folder)
        let rows = MoveToPicker.rows(context.allFolders()).filter { !inside.contains($0.id) }
        NavigationStack {
            List {
                Section {
                    choice("Top Level", symbol: "arrow.up.to.line", depth: 0, current: folder.parent == nil, id: "moveFolder.top") {
                        context.move(folder, into: nil)
                    }
                    ForEach(rows) { row in
                        choice(row.name, symbol: "folder", depth: row.depth, current: folder.parent?.id == row.id, id: "moveFolder.\(row.name)") {
                            if let target = context.folder(row.id) { context.move(folder, into: target) }
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

    private func choice(_ name: String, symbol: String, depth: Int, current: Bool, id: String, action: @escaping () -> Void) -> some View {
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
            .contentShape(.rect)
        }
        .disabled(current)
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
