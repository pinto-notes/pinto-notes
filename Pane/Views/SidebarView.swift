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
/// circle and your name. Clicking it opens Settings at Account. Signing out lives there, last,
/// behind a confirmation, so a slip of the mouse here can never sign you out.
struct AccountButton: View {
    let backend: Backend
    /// Captures: a second line with the email, when it is a real one (the alternative look).
    var email: String?
    @State private var profile = ProfileStore.shared

    static let avatar: CGFloat = 28

    private var name: String { AccountName.shown(profile.name) }

    var body: some View {
        Button {
            SettingsRoute.shared.open(.account)
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
            .padding(.horizontal, 8)
            .frame(height: 42)
            .hoverHighlight(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .help("Account Settings")
        .accessibilityLabel("Account, \(name). Opens Settings")
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
    /// The rows' icons' left edge from the sidebar's own: where the title's mark, the Folders
    /// heading and the account's photo start too, so they all share one line (owner, 2026-10-12:
    /// three edges a few points apart). Measured from the list as AppKit lays it out: the icon of
    /// a row sits 21 pt in, 7.5 pt further once any folder has sub-folders (the outline keeps a
    /// column for the arrows), and the section heading's text sits 15 pt in.
    static func edge(nested: Bool) -> CGFloat { nested ? 28.5 : 21 }
    static let headingInset: CGFloat = 15
    static let trailingColumn: CGFloat = 16
    static let trailingInset: CGFloat = 7
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
            .font(SidebarStyle.iconFont)
            #if os(macOS)
            .foregroundStyle(selected ? AnyShapeStyle(.tint) : active == .inactive ? AnyShapeStyle(.tertiary) : AnyShapeStyle(.primary))
            #else
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
    /// A card at the foot was closed in this window (it's also kept per account, and on the server).
    @State private var cardsClosedHere: Set<SidebarCard> = []
    @State private var sidebarHeight: CGFloat = 0
    @Environment(SetupStore.self) private var setup: SetupStore?
    @Environment(\.dynamicTypeSize) private var templatesTypeSize
    @Environment(\.importActions) private var imports
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?

    /// All Notes and Recently Deleted, counted by the store (unsaved changes included), as the list
    /// shows them: a sub-note lives inside its parent and is no row of its own (NoteListView.nested).
    static func counts(in context: ModelContext) -> (live: Int, trashed: Int) {
        let live = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt == nil }))) ?? 0
        let trashed = (try? context.fetchCount(FetchDescriptor<Note>(predicate: #Predicate { $0.deletedAt == nil && $0.trashedAt != nil }))) ?? 0
        let nested = nestedSubNotes(in: context)
        return (live - nested.filter { $0.trashedAt == nil }.count, trashed - nested.filter { $0.trashedAt != nil }.count)
    }

    /// The sub-notes inside their parent, which the list doesn't count as rows. The folder said 2
    /// while its list said "1 note" (newcomer audit, 2026-10-12). Only notes with a parent are
    /// fetched: a library without sub-notes pays for one empty fetch.
    static func nestedSubNotes(in context: ModelContext) -> [Note] {
        context.nestedSubNotes()
    }

    /// A folder's notes as its list counts them: without the sub-notes inside a parent. In a window
    /// the list's notes count them (LibraryNotes.listedCount); this reads the folder's own notes.
    static func listedNotes(in folder: Folder, context: ModelContext) -> Int {
        let nested = Set(SubNoteIndex.nestedIDs(in: context))
        return folder.liveNotes.count { !nested.contains($0.id) }
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
        return withDialogs(withChrome(folderList(files), files: files))
            .environment(windowLibrary ?? ownLibrary)
    }

    /// The folders, All Notes and Recently Deleted.
    private func folderList(_ files: (live: Int, trashed: Int, byFolder: [UUID: Int])) -> some View {
        List(selection: $scope) {
            Section {
                // "All Notes" only earns its row once there's more than one folder.
                if folders.count > 1 {
                    CountedRow(title: "All Notes", icon: "tray.full", trash: false, files: files.live, selection: $scope)
                        .tag(Scope.all)
                        .accessibilityIdentifier("sidebar.all")
                }
                ForEach(roots) { folder in
                    FolderTree(folder: folder, files: files.byFolder, selection: $scope, dropTarget: dropTarget, targeted: folderTargeted, rename: startRename, newSub: startNewFolder, delete: deleteFolder)
                }
                // Last in the same list, like Notes, and like Notes only while something is in it.
                CountedRow(title: "Recently Deleted", icon: "trash", trash: true, files: files.trashed, selection: $scope)
                    .tag(Scope.trash)
                    .accessibilityIdentifier("sidebar.trash")
            } header: {
                Text("Folders")
                    #if os(macOS)
                    .padding(.leading, SidebarStyle.edge(nested: nested) - SidebarStyle.headingInset)
                    #endif
            }
            #if os(iOS)
            .listRowBackground(Color(Palette.row))
            #endif
        }
        .listStyle(.sidebar)
        #if os(iOS)
        .scrollContentBackground(.hidden)
        .background(Color(Palette.foldersGround).ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(spacing: 0) {
                if let card = sidebarCard {
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
        // A little of the icon's brown inside the sidebar's glass, which stays vibrant.
        .background(Color(Palette.sidebarWarmth).ignoresSafeArea())
        #endif
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
        .safeAreaBar(edge: .top, spacing: 0) { SidebarHeader(leading: SidebarStyle.edge(nested: nested)) }
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
        .navigationTitle("Pinto Notes")
        .toolbar {
            #if os(iOS)
            ToolbarItem(placement: .bottomBar) {
                Menu {
                    Button("New Folder", systemImage: "folder.badge.plus") { startNewFolder(nil) }
                    ForEach(ImportKind.listed) { kind in
                        Button(kind.title, systemImage: kind.symbol) { imports?.from(kind) }
                    }
                } label: {
                    Label("New Folder", systemImage: "folder.badge.plus")
                } primaryAction: { startNewFolder(nil) }
                .accessibilityIdentifier("sidebar.newFolder")
            }
            ToolbarSpacer(.flexible, placement: .bottomBar)
            ToolbarItem(placement: .bottomBar) {
                ComposeButton(newNote: onNewNote) { SwiftUI.Label("New Note", systemImage: "square.and.pencil") }
            }
            if let backend, backend.client != nil {
                ToolbarItem(placement: .primaryAction) {
                    // Signed in, your photo is the way into Settings (your account comes first there).
                    if case .signedIn = backend.state {
                        let name = AccountName.shown(ProfileStore.shared.name)
                        Button { showSettings = true } label: {
                            AvatarView(photo: ProfileStore.shared.shownPhoto, name: AccountName.isSet(ProfileStore.shared.name) ? name : nil, size: 30)
                        }
                        .accessibilityLabel("Account, \(name). Opens Settings")
                        .accessibilityIdentifier("sidebar.settings")
                        .task(id: backend.state) { await ProfileStore.shared.bind(backend) }
                    } else {
                        Button("Settings", systemImage: "gearshape") { showSettings = true }
                            .accessibilityIdentifier("sidebar.settings")
                    }
                }
            }
            #endif
        }
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
                    // The photo starts on the rows' icons' line (the button pads 8 inside its highlight).
                    AccountButton(backend: backend)
                        .padding(.leading, SidebarStyle.edge(nested: nested) - 8)
                        .padding(.trailing, 10)
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
        return SidebarCard.pick(account: account, progress: setup?.progress,
                                connectClosedHere: cardsClosedHere.contains(.connect) || SidebarCard.isClosedHere(.connect, account),
                                templatesClosedHere: cardsClosedHere.contains(.templates) || SidebarCard.isClosedHere(.templates, account),
                                sidebarHeight: sidebarHeight, largestText: templatesTypeSize.isAccessibilitySize)
    }

    @ViewBuilder private func cardView(_ card: SidebarCard) -> some View {
        let close = {
            if let account = backend?.userID { SidebarCard.closeHere(card, account) }
            withAnimation(.easeOut(duration: 0.2)) { _ = cardsClosedHere.insert(card) }
            Task { await setup?.mark(card.mark) }
        }
        Group {
            switch card {
            case .connect: ConnectCard(onConnect: { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }, onClose: close)
            case .templates: TemplatesCard(onClose: close)
            }
        }
        .transition(.opacity)
    }

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
                    FolderTree(folder: child, files: files, selection: $selection, dropTarget: dropTarget, targeted: targeted, rename: rename, newSub: newSub, delete: delete, depth: depth + 1)
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
        .contextMenu { menuItems }
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
