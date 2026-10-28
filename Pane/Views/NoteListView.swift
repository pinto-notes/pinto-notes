import SwiftData
import SwiftUI
import TipKit
import UniformTypeIdentifiers

struct NoteListView: View {
    @Environment(\.modelContext) private var context
    let scope: Scope
    /// Several notes can be selected (⌘-click, ⇧-click, ⌘A on the Mac; Select on iPhone).
    @Binding var selection: Set<UUID>
    let onNewNote: () -> Void
    #if os(iOS)
    @State private var editMode: EditMode = .inactive
    #endif

    /// Every note, fetched again only when a save adds or deletes one (see LibraryNotes).
    @State private var ownLibrary = LibraryNotes()
    /// The window's (RootView), shared with the sidebar's folder counts; a list on its own keeps its own.
    @Environment(LibraryNotes.self) private var windowLibrary: LibraryNotes?
    private var library: LibraryNotes { windowLibrary ?? ownLibrary }
    /// "Sort By" and "Group By Date", as chosen on this device.
    @State private var orderStore = ListOrderStore.shared
    /// The order the list is shown in. What a search finds keeps the list's own order, newest first.
    private var order: ListOrder { search.trimmingCharacters(in: .whitespaces).isEmpty ? orderStore.order : .standard }
    /// In the chosen order, as plain values: nothing here reads a note from the store.
    private var entries: [NoteEntry] { library.entries(in: context, order: orderStore.order) }
    /// Files kept in folders on their own, listed with the notes.
    @Query(filter: #Predicate<Attachment> { $0.folderID != nil && $0.deletedAt == nil }) private var folderFiles: [Attachment]
    @State private var search = ""
    /// "Add File": the picker, and a file being renamed.
    @State private var addingFiles = false
    #if os(macOS)
    /// The Import choice, from the list's More menu.
    @State private var choosingImport = false
    #endif
    @State private var renamingFile: Attachment?
    /// Export… (Mac) or Save to Files (iPhone) from a file's menu.
    @State private var exportingFile: Attachment?
    @State private var fileNameDraft = ""
    @State private var fileDropTargeted = false
    @State private var collapsed: Set<String> = []
    /// Notes waiting for "Delete Forever" to be confirmed.
    @State private var pendingForever: Set<UUID>?
    @Environment(\.importActions) private var imports
    @Environment(SetupStore.self) private var setup: SetupStore?
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @State private var connectCenter = ConnectCenter.shared
    /// How full the account is: a warning near 2 GB and at it.
    @State private var storage = StorageStore.shared
    @State private var showSettings = false
    #if os(macOS)
    /// Settings shows on the notes window in front (SettingsRoute.presenting).
    @Environment(\.appearsActive) private var appearsActive
    #endif
    /// The Share tip at the top of the list is due (iPhone).
    @State private var listTipDue = false

    private func scoped(from all: [NoteEntry]) -> [NoteEntry] { Self.scoped(all, to: scope, context: context) }

    /// The notes a scope lists, in the order they came in.
    static func scoped(_ all: [NoteEntry], to scope: Scope, context: ModelContext) -> [NoteEntry] {
        let nested = Self.nested(in: all, context: context)
        return all.filter { e in
            guard !e.deleted else { return false }
            // Sub-notes live inside their parent, not in the list.
            if nested.contains(e.id) { return false }
            switch scope {
            case .all: return !e.trashed
            case .trash: return e.trashed
            case .folder(let id): return !e.trashed && e.folderID == id
            }
        }
    }

    /// The sub-notes still linked from their parent (`ModelContext.isNested`), for the whole
    /// list at once, from SubNoteIndex: asked of the store one sub-note at a time, a library with
    /// a few hundred sub-notes spent a fetch on each of them whenever the list was worked out,
    /// which is every time a note is opened. Without sub-notes nothing is looked up at all.
    static func nested(in all: [NoteEntry], context: ModelContext) -> Set<UUID> {
        guard all.contains(where: { $0.parentID != nil }) else { return [] }
        return Set(context.nestedSubNotes().map(\.id))
    }

    private var filtered: [NoteEntry] {
        let all = entries
        return filtered(from: scoped(from: all), all: all)
    }

    private var scopedFiles: [Attachment] {
        folderFiles.filter { f in
            switch scope {
            case .all: return f.trashedAt == nil
            case .trash: return f.trashedAt != nil
            case .folder(let id): return f.trashedAt == nil && f.folderID == id
            }
        }
    }

    /// Files by name, as notes are found by their text.
    private func filteredFiles(from scoped: [Attachment]) -> [Attachment] {
        let q = search.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return scoped }
        let base = scope == .trash ? scoped : folderFiles.filter { $0.trashedAt == nil }
        return base.filter { $0.filename.localizedStandardContains(q) }
    }

    /// What the list shows, in its order: notes and files together.
    private var orderedItems: [ListEntry] {
        DateBucket.sections(ordered: ListEntry.merged(notes: filtered, files: filteredFiles(from: scopedFiles), by: order), by: order).flatMap(\.1)
    }

    /// "12 notes, 3 files", or just the notes when the folder has no files. In Recently Deleted
    /// the same line says how long things stay: "9 notes · Deleted after 30 days".
    private func countText(notes: Int, files: Int, capitalized: Bool) -> String {
        Self.countText(notes: notes, files: files, capitalized: capitalized, trash: scope == .trash)
    }

    static func countText(notes: Int, files: Int, capitalized: Bool, trash: Bool) -> String {
        let n = notes == 1 ? "1 \(capitalized ? "Note" : "note")" : "\(notes) \(capitalized ? "Notes" : "notes")"
        var line = n
        if files > 0 {
            let f = files == 1 ? "1 \(capitalized ? "File" : "file")" : "\(files) \(capitalized ? "Files" : "files")"
            line = notes == 0 ? f : n + ", " + f
        }
        guard trash, notes + files > 0 else { return line }
        return line + " \u{00B7} Deleted after 30 days"
    }

    /// `all` is every note, in the list's order, shared with `scoped`. A search reads the notes' text.
    private func filtered(from scoped: [NoteEntry], all: [NoteEntry]) -> [NoteEntry] {
        let q = search.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return scoped }
        let base = scope == .trash ? scoped : all.filter { !$0.deleted && !$0.trashed }
        return Self.found(q, in: base, listedBy: orderStore.order, context: context)
    }

    /// The notes whose text holds `query`, newest first whatever order the list is in: only the
    /// few found are sorted.
    ///
    /// The store finds them (`localizedStandardContains`, as before): the list no longer holds every
    /// note's text, and reading it a note at a time cost a query per note.
    static func found(_ query: String, in base: [NoteEntry], listedBy order: ListOrder, context: ModelContext) -> [NoteEntry] {
        let matching = Set((try? context.fetchIdentifiers(FetchDescriptor<Note>(predicate: #Predicate { $0.body.localizedStandardContains(query) }))) ?? [])
        let found = base.filter { matching.contains($0.pid) }
        return order.sortsLike(.standard) ? found : found.sorted { $0.date > $1.date }
    }

    private var title: String {
        switch scope {
        case .all: "All Notes"
        case .trash: "Recently Deleted"
        case .folder(let id): context.folder(id)?.name ?? "Notes"
        }
    }

    var body: some View {
        #if DEBUG
        RenderProbe.count("NoteListView")
        #endif
        // Worked out once per update and handed down: the list asks many times.
        library.publishesEveryChange = !search.trimmingCharacters(in: .whitespaces).isEmpty
        let all = entries
        let scopedNotes = scoped(from: all)
        let visible = filtered(from: scopedNotes, all: all)
        let files = scopedFiles
        let visibleFiles = filteredFiles(from: files)
        return list(scopedNotes, visible, files, visibleFiles)
            #if os(iOS)
            .task { await watchListTip() }
            #endif
    }

    /// The folders by name, for the menus that move things. Asked for when a menu is, not
    /// each time the list is worked out: fetching and sorting every folder was part of every
    /// update of the list (every note opened), for menus nobody had asked for.
    private var foldersByName: [Folder] {
        #if DEBUG
        RenderProbe.count("NoteListView.foldersByName")
        #endif
        return context.allFolders().sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    private func list(_ scopedNotes: [NoteEntry], _ visible: [NoteEntry], _ scopedFiles: [Attachment], _ visibleFiles: [Attachment]) -> some View {
        let noteSections = visibleFiles.isEmpty ? DateBucket.sections(ordered: visible, by: order) : nil
        let mixedSections = visibleFiles.isEmpty ? nil : DateBucket.sections(ordered: ListEntry.merged(notes: visible, files: visibleFiles, by: order), by: order)
        let collapsed = self.collapsed
        // The rows above the first section (the asks below), for finding a note's row in the table.
        let leadingRows = (scope != .trash && search.isEmpty && connectCenter.waiting().first != nil ? 1 : 0)
            + (scope != .trash && search.isEmpty && (storage.usage.map { $0.level != .fine } ?? false) ? 1 : 0)
        #if os(macOS)
        // The list's own changes are told apart from code's in the click log (RowClickLog).
        let listSelection = Binding(get: { selection }, set: { new in RowClickLog.listSet(selection, new); selection = new })
        #else
        let listSelection = $selection
        #endif
        return List(selection: listSelection) {
            // An ask to connect an AI whose sheet was closed without an answer: always a way back.
            if scope != .trash, search.isEmpty, let ask = connectCenter.waiting().first {
                #if os(iOS)
                Section {
                    ConnectWaitingRow(ask: ask).selectionDisabled()
                }
                .listRowBackground(Color(Palette.row))
                #else
                ConnectWaitingRow(ask: ask)
                    .listRowInsets(EdgeInsets(top: 6, leading: 10, bottom: 10, trailing: 10))
                    .listRowSeparator(.hidden)
                    .selectionDisabled()
                #endif
            }
            if scope != .trash, search.isEmpty, let usage = storage.usage, usage.level != .fine {
                #if os(iOS)
                Section { StorageWarningRow(usage: usage, open: openStorage).selectionDisabled() }
                    .listRowBackground(Color(Palette.row))
                #else
                StorageWarningRow(usage: usage, open: openStorage)
                    .listRowInsets(EdgeInsets(top: 6, leading: 10, bottom: 10, trailing: 10))
                    .listRowSeparator(.hidden)
                    .selectionDisabled()
                #endif
            }
            #if os(iOS)
            if listTipDue && scope != .trash && search.isEmpty {
                listTip
            }
            #endif
            // Without files the notes go straight in, in the order they're kept in.
            if let noteSections {
                ForEach(noteSections, id: \.0) { section in
                    dateSection(section) { noteRow($0) }
                }
            } else if let mixedSections {
                ForEach(mixedSections, id: \.0) { section in
                    dateSection(section) { item in
                        switch item {
                        case .note(let entry):
                            noteRow(entry)
                        case .file(let file):
                            FileListRow(file: file, query: search, showFolder: scope == .all || !search.isEmpty, datedByCreation: order.showsCreationDates,
                                        remove: { remove([file.id]) })
                                .tag(file.id)
                                .hoverRow(file.filename, reach: Hover.noteRowReach, selected: Self.quiet(selection, file.id))
                                .quietSelection()
                                #if os(iOS)
                                .listRowBackground(Color(Palette.row))
                                #else
                                .listRowSeparator(DesignLook.calmList ? .hidden : .automatic)
                                #endif
                        }
                    }
                }
            }
            #if os(iOS)
            // The count, quietly at the end of the list, as in Notes.
            if !(visible.isEmpty && visibleFiles.isEmpty) && search.isEmpty {
                Section {} footer: {
                    Text(countText(notes: scopedNotes.count, files: scopedFiles.count, capitalized: true))
                        .font(.footnote)
                        .monospacedDigit()
                        .frame(maxWidth: .infinity)
                        .accessibilityIdentifier("list.count")
                }
            }
            #endif
        }
        // Right-click acts on the whole selection when the row is part of it, like Notes.
        .contextMenu(forSelectionType: UUID.self) { ids in
            menu(for: ids, folders: foldersByName)
        }
        #if os(macOS)
        // Another folder or another library is another list, built new. Kept as one list,
        // SwiftUI worked out the difference row by row and sized every row that came or went:
        // 3 to 4 s on the main thread going from a folder back to All Notes with 2,000. A search
        // stays the same list: a new one took the keys away from the search field.
        // A new list starts at its top: it shows the open note's row again.
        .modifier(ShowsSelectedRow(selected: selection.count == 1 ? selection.first : nil) { id in
            (noteSections.flatMap { ShowsSelectedRow.row(of: id, in: $0, collapsed: collapsed) }
                ?? mixedSections.flatMap { ShowsSelectedRow.row(of: id, in: $0, collapsed: collapsed) }).map { leadingRows + $0 }
        })
        .id(ListIdentity(scope: scope, library: library.wholesale))
        #endif
        #if os(iOS)
        .listStyle(.insetGrouped)
        .environment(\.editMode, $editMode)
        // Offline: a quiet line over the bottom bar (the Mac says it in the sidebar).
        .safeAreaInset(edge: .bottom, spacing: 0) { OfflineLine(sync: sync).animation(.easeOut(duration: 0.25), value: sync?.reach) }
        #endif
        // Less warmth than the sidebar, more than the note.
        .scrollContentBackground(.hidden)
        .background(Color(Palette.listGround).ignoresSafeArea())
        .overlay {
            if visible.isEmpty && visibleFiles.isEmpty && !library.isLoading { emptyState }
        }
        .sheet(isPresented: $showSettings) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
        #if os(macOS)
        // Settings is a sheet on this window, like WhatsApp's, when this is the window in front.
        .onChange(of: SettingsRoute.shared.presenting, initial: true) { takeSettings() }
        .onChange(of: appearsActive) { takeSettings() }
        #endif
        .onChange(of: AppPlaceCenter.shared.pending, initial: true) { _, place in openConnectAI(place) }
        // Captures: `-uitest -openSettings` shows Settings over the list.
        .task {
            guard ProcessInfo.processInfo.arguments.contains("-uitest"), ProcessInfo.processInfo.arguments.contains("-openSettings") else { return }
            try? await Task.sleep(for: .seconds(1))
            #if os(iOS)
            showSettings = true
            #else
            SettingsRoute.shared.show()
            #endif
        }
        .task {
            // How full the account is, now and every few minutes.
            while !Task.isCancelled {
                await storage.refresh(backend?.client)
                try? await Task.sleep(for: .seconds(300))
            }
        }
        .overlay {
            if fileDropTargeted {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(Color.accentColor.opacity(0.7), style: StrokeStyle(lineWidth: 2, dash: [7, 5]))
                    .padding(8)
                    .transition(.opacity)
                    .allowsHitTesting(false)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NoteDrop.nested)) { n in
            guard let parent = n.object as? UUID else { return }
            selection = NoteDrop.selection(afterNestingUnder: parent)
        }
        .dropDestination(for: URL.self) { urls, _ in
            let made = context.importFiles(urls, into: scope == .trash ? .all : scope)
            if let first = made.first { selection = [first] }
            return !made.isEmpty
        } isTargeted: { t in
            withAnimation(.easeOut(duration: 0.15)) { fileDropTargeted = t }
        }
        #if os(iOS)
        // iOS 26 Notes and Mail: a full search field in the bottom bar, beside compose.
        .searchable(text: $search, prompt: "Search")
        .searchToolbarBehavior(.automatic)
        #else
        .searchable(text: $search, placement: .toolbar, prompt: "Search")
        #endif
        .navigationTitle(title)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        // No count subtitle: on iOS 26 a subtitle makes the large title open collapsed when the list is pushed again.
        #endif
        #if os(macOS)
        .navigationSubtitle("")
        #endif
        #if os(macOS)
        .sheet(isPresented: $choosingImport) {
            ImportChoiceSheet { origin in
                choosingImport = false
                // The source's own sheet opens once this one has gone.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    switch origin {
                    case .appleNotes: imports?.appleNotes()
                    case .files(let kind): imports?.from(kind)
                    }
                }
            }
        }
        #endif
        .fileImporter(isPresented: $addingFiles, allowedContentTypes: FileKinds.contentTypes, allowsMultipleSelection: true) { result in
            guard case .success(let urls) = result else { return }
            let made = context.addFiles(urls, to: context.folderForFiles(scope))
            if let first = made.first { selection = [first.id] }
        }
        .fileExport(exportingFile, isPresented: Binding(get: { exportingFile != nil }, set: { if !$0 { exportingFile = nil } }))
        .alert("Rename File", isPresented: Binding(get: { renamingFile != nil }, set: { if !$0 { renamingFile = nil } })) {
            TextField("Name", text: $fileNameDraft)
            Button("Cancel", role: .cancel) {}
            Button("Rename") { if let f = renamingFile { context.rename(f, to: fileNameDraft) } }
        } message: {
            Text("The ending (.\(((renamingFile?.filename ?? "") as NSString).pathExtension)) stays.")
        }
        .confirmationDialog(foreverTitle, isPresented: Binding(get: { pendingForever != nil }, set: { if !$0 { pendingForever = nil } }), titleVisibility: .visible) {
            Button("Delete Forever", role: .destructive) {
                if let ids = pendingForever { performRemove(ids) }
                pendingForever = nil
            }
        } message: {
            Text("You can't undo this.")
        }
        #if os(macOS)
        // The Delete key (and Edit › Delete) on the focused list removes every selected note.
        .onDeleteCommand { if !selection.isEmpty { remove(selection) } }
        .onAppear {
            // A press on a row that moves a point or two is still a click (the sidebar's rows too).
            RowPressSlop.start()
            // What each click did, in the system log (RowClickLog).
            RowClickLog.start()
        }
        .onChange(of: selection) { old, new in
            RowClickLog.selection(old, new)
            // Notes that went inside another note aren't rows any more (see `withoutSubNotes`).
            let rows = NoteDrop.withoutSubNotes(new, in: context)
            if rows != new { selection = rows }
        }
        #endif
        .toolbar {
            #if os(iOS)
            // Select only when there is something to select.
            if editMode.isEditing || !(scopedNotes.isEmpty && scopedFiles.isEmpty) {
            ToolbarItem(placement: .primaryAction) {
                Button(editMode.isEditing ? "Done" : "Select") {
                    withAnimation(.snappy(duration: 0.25)) {
                        editMode = editMode.isEditing ? .inactive : .active
                        if !editMode.isEditing { selection = [] }
                    }
                }
                .fontWeight(editMode.isEditing ? .semibold : .regular)
                // The floating buttons in the label colour, as in the note (28 October 2026).
                .tint(.primary)
                .accessibilityIdentifier("list.select")
            }
            }
            if !editMode.isEditing {
                // The list's own menu, as in Notes: how it's sorted and grouped, and adding files
                // (it was an icon of a page with a plus beside Select, which read as New Note).
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        ListOrderMenu(store: orderStore)
                        if scope != .trash {
                            Divider()
                            // Files kept in the folder on their own: PDFs to read, photos, spreadsheets.
                            Button("Add Files…", systemImage: "doc.badge.plus") { addingFiles = true }
                                .accessibilityIdentifier("list.addFile")
                        }
                        Divider()
                        // Always here, not only in Settings.
                        Button("Connect an AI\u{2026}", systemImage: "sparkles") { NotificationCenter.default.post(name: .paneConnectAI, object: nil) }
                            .accessibilityIdentifier("list.connectAI")
                    } label: {
                        Label("More", systemImage: "ellipsis")
                    }
                    .tint(.primary)
                    .accessibilityIdentifier("list.more")
                }
            }
            if editMode.isEditing {
                ToolbarItem(placement: .bottomBar) {
                    Menu("Move") {
                        ForEach(foldersByName) { f in
                            Button(f.name) { moveSelection(to: f) }
                        }
                    }
                    .disabled(selection.isEmpty || scope == .trash)
                    .accessibilityIdentifier("list.moveSelected")
                }
                ToolbarSpacer(.flexible, placement: .bottomBar)
                ToolbarItem(placement: .bottomBar) {
                    Button(selection.isEmpty ? "Delete" : "Delete (\(selection.count))", role: .destructive) {
                        remove(selection)
                        withAnimation(.snappy(duration: 0.25)) { editMode = .inactive }
                    }
                    .disabled(selection.isEmpty)
                    .accessibilityIdentifier("list.deleteSelected")
                }
            } else {
                DefaultToolbarItem(kind: .search, placement: .bottomBar)
                // iPad moves search to the top of the column; compose then belongs at the trailing edge.
                if UIDevice.current.userInterfaceIdiom == .pad {
                    ToolbarSpacer(.flexible, placement: .bottomBar)
                } else {
                    ToolbarSpacer(.fixed, placement: .bottomBar)
                }
                ToolbarItem(placement: .bottomBar) {
                    ComposeButton(newNote: onNewNote) { SwiftUI.Label("New Note", systemImage: "square.and.pencil") }
                        .tint(.primary)
                        .newAppTip()
                        // Recently Deleted holds no new notes: the note it made went elsewhere.
                        .disabled(scope == .trash)
                        .accessibilityIdentifier("list.newNote")
                }
            }
            #else
            // Like Notes: the folder's name and count, then a "⋯" menu for the list.
            ToolbarItem(placement: .navigation) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(Color.ink).lineLimit(1)
                    Text(countText(notes: scopedNotes.count, files: scopedFiles.count, capitalized: false))
                        .font(.system(size: 11))
                        .foregroundStyle(Color.muted)
                        .monospacedDigit()
                }
                // As far from the ••• as the toolbar's groups are from each other; a long name
                // ends in "…" before it gets near the button.
                .padding(.leading, 6)
                .padding(.trailing, NoteListView.titleGap)
                .frame(maxWidth: NoteListView.titleWidth, alignment: .leading)
            }
            .sharedBackgroundVisibility(.hidden)
            ToolbarSpacer(.flexible)
            ToolbarItem {
                Menu {
                    ListOrderMenu(store: orderStore)
                    Divider()
                    Button("New Folder", systemImage: "folder.badge.plus") { NotificationCenter.default.post(name: .paneNewFolder, object: nil) }
                    Button("Add Files…", systemImage: "doc.badge.plus") { addingFiles = true }
                        .disabled(scope == .trash)
                        .accessibilityIdentifier("list.addFile")
                    Divider()
                    // One item: the sources, with their icons, are in the choice it opens.
                    Button("Import…", systemImage: "square.and.arrow.down") { choosingImport = true }
                        .accessibilityIdentifier("list.import")
                } label: {
                    Label("More", systemImage: "ellipsis")
                }
                .menuIndicator(.hidden)
                .tint(.primary)
                .accessibilityIdentifier("list.more")
            }
            #endif
        }
    }

    /// One date's notes (and files), collapsible, under its heading.
    private func dateSection<Item: Identifiable, Row: View>(_ section: (String, [Item]), @ViewBuilder row: @escaping (Item) -> Row) -> some View {
        Section(isExpanded: Binding(
            get: { !collapsed.contains(section.0) },
            set: { open in withAnimation(.snappy(duration: 0.22)) { if open { collapsed.remove(section.0) } else { collapsed.insert(section.0) } } }
        )) {
            ForEach(section.1) { row($0) }
        } header: {
            // A list sorted by title, or with grouping off, has no heading over its notes.
            if section.0 != DateBucket.unheaded {
                // One step lighter than the display type: bold, in the warm ink.
                #if os(iOS)
                // The system's prominent header: large and bold, as in Notes.
                Text(section.0)
                    .foregroundStyle(Color.ink)
                #else
                // One weight lighter than before, in a 40 pt row like Notes' (NoteListGeometryTests).
                // C and D: small, semibold and muted, a label over the rows rather than a title.
                Text(section.0)
                    .font(DesignLook.calmList ? .system(size: 12, weight: .semibold) : .title3.weight(.semibold))
                    .foregroundStyle(DesignLook.calmList ? Color.muted : Color.ink)
                    .textCase(nil)
                    .padding(.top, NoteListView.headingTop)
                    .padding(.bottom, NoteListView.headingBottom)
                #endif
            }
        }
        #if os(iOS)
        .headerProminence(.increased)
        #else
        // C and D: no rule under a heading; spacing does the work.
        .listSectionSeparator(DesignLook.calmList ? .hidden : .automatic)
        #endif
    }

    /// Room above and below a date heading's text: a 40 pt row with its letters where Apple
    /// Notes' are (13.5 pt down, 17 in from the column's edge, matched by their pixels).
    static let headingTop: CGFloat = 6.5
    static let headingBottom: CGFloat = 6.5

    /// The folder's name in the list's toolbar: the gap after it (the space between the toolbar's
    /// groups) and the most room it takes before it ends in "…".
    static let titleGap: CGFloat = 16
    static let titleWidth: CGFloat = 190

    /// Whether a row draws the quiet selection (the Mac only; iOS keeps the system's).
    static func quiet(_ selection: Set<UUID>, _ id: UUID) -> Bool {
        #if os(macOS)
        selection.contains(id)
        #else
        false
        #endif
    }

    /// SwiftUI works this out for every row of the list whenever the list changes, on screen or not:
    /// it reads only plain values, and the row is one equatable view, so a row whose values are
    /// the same isn't worked out again (with 20,000 notes, every row's hover and menu were, half
    /// a second for each change shown).
    private func noteRow(_ entry: NoteEntry) -> some View {
        let id = entry.id
        return NoteListItem(entry: entry, query: search, showFolder: scope == .all || !search.isEmpty, datedByCreation: order.showsCreationDates,
                            dragWith: dragOthers(for: id), selectedCount: selection.count, quiet: Self.quiet(selection, id),
                            top: RowMetrics.top(folderLine: (scope == .all || !search.isEmpty) && entry.folderID != nil) + RowMetrics.calmAir,
                            togglePin: { note in withAnimation(.snappy) { context.togglePin(note) } },
                            remove: { note in remove(note) }) { note in
            menu(for: note, folders: foldersByName)
        }
        .equatable()
        // On the row as the list holds it, where the list's selection finds it.
        .tag(id)
        #if os(macOS)
        // C and D: no hairlines between rows.
        .listRowSeparator(DesignLook.calmList ? .hidden : .automatic)
        #endif
    }

    #if os(iOS)
    /// "Did you know" for what isn't a button here, as a row at the top of the list.
    private var listTip: some View {
        // One grouped card, like What's new: the tip is the row, on the row's own surface.
        Section { CompactTip(tip: ShareExtensionTip(), card: false).selectionDisabled() }
            .listRowBackground(Color(Palette.row))
    }
    #endif

    #if os(iOS)
    /// Follows whether the list's tip is due, and records it as shown when it is.
    private func watchListTip() async {
        let tip = ShareExtensionTip()
        for await due in tip.shouldDisplayUpdates {
            listTipDue = due
            if due { TipLog.shown(tip.id) }
        }
    }
    #endif

    /// ambernotes.app/open/connect-ai from an email: Settings, at AI (Connect an AI).
    private func openConnectAI(_ place: AppPlace?) {
        guard place == .connectAI else { return }
        AppPlaceCenter.shared.pending = nil
        SettingsRoute.shared.open(.ai)
        #if os(iOS)
        showSettings = true
        #endif
    }

    #if os(macOS)
    private func takeSettings() {
        guard SettingsRoute.shared.presenting, appearsActive || NSApp.keyWindow == nil else { return }
        SettingsRoute.shared.presenting = false
        showSettings = true
    }
    #endif

    /// The storage warning opens Settings at Storage: what takes the room.
    private func openStorage() {
        SettingsRoute.shared.open(.storage)
        #if os(iOS)
        showSettings = true
        #endif
    }

    @ViewBuilder
    private var emptyState: some View {
        if !search.isEmpty {
            ContentUnavailableView.search(text: search)
        } else if scope == .trash {
            ContentUnavailableView("No Deleted Notes", systemImage: "trash", description: Text("Notes and files you delete stay here for 30 days."))
        } else if Self.offersWaysToStart(scope: scope) {
            // Nothing in the whole library (a new account, or one whose first run didn't come):
            // the two ways to start, in place (newcomer audit #19), New Note the one in the accent.
            ContentUnavailableView {
                Label { Text("No Notes") } icon: { AppMark(size: 56) }
            } description: {
                Text(Self.emptyLine)
            } actions: {
                Button("New Note", action: onNewNote)
                    .buttonStyle(.amberProminent)
                    .accessibilityIdentifier("empty.newNote")
                if let imports {
                    // In the ink: one orange control on the screen.
                    Button(Self.bringNotes, action: imports.appleNotes)
                        .tint(Color.ink)
                        .accessibilityIdentifier("empty.bringNotes")
                }
            }
        } else {
            // The leaf and "No Notes", like Notes: the compose button is the one way to start a note.
            ContentUnavailableView {
                Label { Text("No Notes") } icon: { AppMark(size: 56) }
            }
        }
    }

    /// Whether an empty list offers New Note and Bring Your Notes: only the whole library (a
    /// folder that's empty has the compose button).
    static func offersWaysToStart(scope: Scope) -> Bool { scope == .all }

    /// The empty library's line and its second button.
    static let emptyLine = "Write a note, or bring your notes from Apple Notes, Obsidian, Bear, Evernote or Google Keep."
    static let bringNotes = "Bring Your Notes\u{2026}"

    @ViewBuilder
    private func deleteButton(_ note: Note) -> some View {
        Button(note.trashedAt == nil ? "Delete" : "Delete Forever…", systemImage: "trash", role: .destructive) { remove(note) }
    }

    @ViewBuilder
    private func menu(for ids: Set<UUID>, folders: [Folder]) -> some View {
        let notes = ids.compactMap { context.note($0) }
        let files = ids.compactMap { context.attachment($0) }.filter { $0.folderID != nil && $0.deletedAt == nil }
        if !files.isEmpty {
            if notes.isEmpty && files.count == 1, let file = files.first {
                menu(for: file, folders: folders)
            } else {
                mixedMenu(ids: ids, notes: notes, files: files, folders: folders)
            }
        } else if notes.count == 1, let note = notes.first {
            menu(for: note, folders: folders)
        } else if notes.count > 1 {
            if notes.allSatisfy({ $0.trashedAt != nil }) {
                Button("Recover \(notes.count) Notes", systemImage: "arrow.uturn.backward") {
                    withAnimation(.snappy) { notes.forEach(context.restore) }
                }
                Button("Delete \(notes.count) Notes Forever…", systemImage: "trash", role: .destructive) { remove(ids) }
            } else {
                Menu("Move \(notes.count) Notes to", systemImage: "folder") {
                    ForEach(folders) { f in
                        Button(f.name) { withAnimation(.snappy) { context.move(notes, to: f) } }
                    }
                }
                Divider()
                Button("Delete \(notes.count) Notes", systemImage: "trash", role: .destructive) { remove(ids) }
            }
        }
    }

    @ViewBuilder
    private func menu(for note: Note, folders: [Folder]) -> some View {
        if note.trashedAt != nil {
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(note) } }
            deleteButton(note)
        } else {
            Button(note.isPinned ? "Unpin Note" : "Pin Note", systemImage: note.isPinned ? "pin.slash" : "pin") {
                withAnimation(.snappy) { context.togglePin(note) }
            }
            Menu("Move to", systemImage: "folder") {
                ForEach(folders) { f in
                    Button(f.name) { withAnimation(.snappy) { context.move(note, to: f) } }
                        .disabled(note.folder?.id == f.id)
                }
            }
            // A locked note's text isn't here to send or copy.
            if !note.isLocked {
                ShareLink(item: note.body, preview: SharePreview(note.title))
                Button("Duplicate", systemImage: "plus.square.on.square") {
                    let copy = context.createNote(in: note.folder.map { .folder($0.id) } ?? .all, body: note.body)
                    selection = [copy.id]
                }
            }
            Divider()
            deleteButton(note)
        }
    }

    @ViewBuilder
    private func menu(for file: Attachment, folders: [Folder]) -> some View {
        if file.trashedAt != nil {
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(file) } }
            Button("Delete Forever…", systemImage: "trash", role: .destructive) { remove([file.id]) }
        } else {
            Button("Rename…", systemImage: "pencil") {
                fileNameDraft = FolderFileName.stem(file.filename)
                renamingFile = file
            }
            Menu("Move to", systemImage: "folder") {
                ForEach(folders) { f in
                    Button(f.name) { withAnimation(.snappy) { context.move(file, to: f) } }
                        .disabled(file.folderID == f.id)
                }
            }
            if FileStore.exists(file) {
                ShareLink(item: FileStore.url(for: file.id, filename: file.filename))
                Button(FileOut.exportTitle, systemImage: FileOut.exportSymbol) { exportingFile = file }
            }
            Divider()
            Button("Delete", systemImage: "trash", role: .destructive) { remove([file.id]) }
        }
    }

    /// Several items, files among them.
    @ViewBuilder
    private func mixedMenu(ids: Set<UUID>, notes: [Note], files: [Attachment], folders: [Folder]) -> some View {
        let count = notes.count + files.count
        if notes.allSatisfy({ $0.trashedAt != nil }) && files.allSatisfy({ $0.trashedAt != nil }) {
            Button("Recover \(count) Items", systemImage: "arrow.uturn.backward") {
                withAnimation(.snappy) {
                    notes.forEach(context.restore)
                    files.forEach(context.restore)
                }
            }
            Button("Delete \(count) Items Forever…", systemImage: "trash", role: .destructive) { remove(ids) }
        } else {
            Menu("Move \(count) Items to", systemImage: "folder") {
                ForEach(folders) { f in
                    Button(f.name) { withAnimation(.snappy) { move(ids, to: f) } }
                }
            }
            Divider()
            Button("Delete \(count) Items", systemImage: "trash", role: .destructive) { remove(ids) }
        }
    }

    /// Moves notes and files together.
    private func move(_ ids: Set<UUID>, to folder: Folder) {
        context.move(ids.compactMap { context.note($0) }, to: folder)
        for f in ids.compactMap({ context.attachment($0) }) where f.folderID != nil { context.move(f, to: folder) }
    }

    /// Dragging a selected note carries the whole selection; any other note goes alone (nil).
    private func dragOthers(for id: UUID) -> [UUID]? {
        guard selection.count > 1, selection.contains(id) else { return nil }
        return selection.filter { $0 != id }.sorted { $0.uuidString < $1.uuidString }
    }

    private func moveSelection(to folder: Folder) {
        withAnimation(.snappy) { move(selection, to: folder) }
        #if os(iOS)
        withAnimation(.snappy(duration: 0.25)) { editMode = .inactive }
        #endif
        selection = []
    }

    private func remove(_ note: Note) { remove([note.id]) }

    /// Deletes the notes and, if the open note was among them, selects its neighbour like Notes.
    /// Deleting from Recently Deleted can't be undone, so it asks first; anything else goes
    /// to Recently Deleted straight away, which is its own undo.
    private func remove(_ ids: Set<UUID>) {
        let forever = ids.compactMap { context.note($0) }.contains { $0.trashedAt != nil }
            || ids.compactMap { context.attachment($0) }.contains { $0.trashedAt != nil }
        if forever { pendingForever = ids } else { performRemove(ids) }
    }

    private var foreverTitle: String {
        let notes = (pendingForever ?? []).compactMap { context.note($0) }
        let files = (pendingForever ?? []).compactMap { context.attachment($0) }
        if files.isEmpty {
            return notes.count == 1 ? "Delete \u{201C}\(notes[0].title)\u{201D} forever?" : "Delete \(notes.count) notes forever?"
        }
        if notes.isEmpty && files.count == 1 { return "Delete \u{201C}\(files[0].filename)\u{201D} forever?" }
        return "Delete \(notes.count + files.count) items forever?"
    }

    private func performRemove(_ ids: Set<UUID>) {
        let ordered = orderedItems
        let notes = ids.compactMap { context.note($0) }
        let files = ids.compactMap { context.attachment($0) }.filter { $0.folderID != nil }
        let touchedSelection = !selection.isDisjoint(with: ids)
        let firstIndex = ordered.firstIndex { ids.contains($0.id) }
        withAnimation(.snappy(duration: 0.25)) {
            context.remove(notes)
            context.remove(files: files)
            if touchedSelection {
                let rest = ordered.filter { !ids.contains($0.id) }
                if let i = firstIndex, !rest.isEmpty {
                    selection = [rest[min(i, rest.count - 1)].id]
                } else {
                    selection = []
                }
            }
        }
    }
}

/// The list is the same list while it shows the same folder: the selection reaches it through its
/// binding, and the action is the same action. Hiding or showing the sidebar hands the split
/// view's columns over again, and without this the list was worked out again on every toggle.
extension NoteListView: @MainActor Equatable {
    static func == (a: NoteListView, b: NoteListView) -> Bool { a.scope == b.scope }
}

/// What the list needs to know about a note to place it: plain values, read from the note once
/// and again only when the note changes.
struct NoteEntry: Identifiable, DatedListItem, Sendable {
    /// The note in the store. Its model is looked up when a row is shown (`note(in:)`): the list
    /// doesn't keep every note of the library in memory, and a context that holds fewer notes saves
    /// faster (SwiftData tells each note it holds of every save).
    let pid: PersistentIdentifier
    let id: UUID
    var date: Date
    var pinned: Bool
    var trashed: Bool
    var deleted: Bool
    var folderID: UUID?
    var parentID: UUID?
    var created: Date
    /// Read only for a list sorted by title (`titled`): it costs a look at the note's text.
    var title = ""

    init(_ note: Note) { self.init(note, titled: false) }

    /// The same values, read without Observation hearing of it: nothing that reads this entry
    /// depends on the note (see LibraryNotes).
    init(untracked note: Note, titled: Bool) {
        pid = note.persistentModelID
        id = note.getValue(forKey: \.id)
        created = note.getValue(forKey: \.createdAt)
        if titled { title = (note.hasChanges ? nil : note.getValue(forKey: \.summaryTitle)) ?? NoteText.head(of: note.getValue(forKey: \.body)).title }
        date = note.getValue(forKey: \.updatedAt)
        pinned = note.getValue(forKey: \.isPinned)
        trashed = note.getValue(forKey: \.trashedAt) != nil
        deleted = note.getValue(forKey: \.deletedAt) != nil
        folderID = note.getValue(forKey: \.folder).map { $0.getValue(forKey: \.id) }
        parentID = note.getValue(forKey: \.parentID)
    }

    /// The note's model in `context`, if it's still there.
    func note(in context: ModelContext) -> Note? {
        guard let n = context.model(for: pid) as? Note, n.modelContext != nil else { return nil }
        return n
    }

    /// Every value the same as `other`'s.
    func same(as other: NoteEntry) -> Bool {
        id == other.id && date == other.date && pinned == other.pinned && trashed == other.trashed && deleted == other.deleted
            && folderID == other.folderID && parentID == other.parentID && created == other.created && title == other.title
    }

    init(_ note: Note, titled: Bool) {
        pid = note.persistentModelID
        id = note.id
        created = note.createdAt
        if titled { title = note.title }
        date = note.updatedAt
        pinned = note.isPinned
        trashed = note.trashedAt != nil
        deleted = note.deletedAt != nil
        folderID = note.folder?.id
        parentID = note.parentID
    }

    var listDate: Date { date }
    var pinnedInList: Bool { pinned && !trashed }
    var listCreated: Date { created }
    var listTitle: String { title }

    /// Whether the list shows this note in the same place as `other`: same folder, pin and trash,
    /// and a date on the same day (the sections are days).
    func listsLike(_ other: NoteEntry) -> Bool {
        pinned == other.pinned && trashed == other.trashed && deleted == other.deleted && folderID == other.folderID
            && parentID == other.parentID && title == other.title && Calendar.current.isDate(date, inSameDayAs: other.date)
    }
}

/// A row of the list when files sit among the notes.
enum ListEntry: Identifiable, DatedListItem {
    case note(NoteEntry)
    case file(Attachment)

    var id: UUID {
        switch self {
        case .note(let e): e.id
        case .file(let f): f.id
        }
    }

    var listDate: Date {
        switch self {
        case .note(let e): e.date
        case .file(let f): f.listDate
        }
    }

    var pinnedInList: Bool {
        if case .note(let e) = self { return e.pinnedInList }
        return false
    }

    var listCreated: Date {
        switch self {
        case .note(let e): e.created
        case .file(let f): f.listCreated
        }
    }

    var listTitle: String {
        switch self {
        case .note(let e): e.title
        case .file(let f): f.listTitle
        }
    }

    /// Notes already in `order`, with files merged in where they fall in it: the notes keep their
    /// order, and only the few files are sorted.
    static func merged(notes: [NoteEntry], files: [Attachment], by order: ListOrder) -> [ListEntry] {
        let sortedFiles = files.sorted { order.before($0, $1) }
        var out: [ListEntry] = []
        out.reserveCapacity(notes.count + sortedFiles.count)
        var f = 0
        for n in notes {
            while f < sortedFiles.count, order.before(sortedFiles[f], n) {
                out.append(.file(sortedFiles[f]))
                f += 1
            }
            out.append(.note(n))
        }
        out += sortedFiles[f...].map(ListEntry.file)
        return out
    }

    /// Notes in order, newest first, with files merged in where their dates fall: the notes keep
    /// their order, and only the few files are sorted.
    static func merged(notes: [NoteEntry], files: [Attachment]) -> [(ListEntry, Date)] {
        let sortedFiles = files.map { ($0, $0.listDate) }.sorted { $0.1 > $1.1 }
        var out: [(ListEntry, Date)] = []
        out.reserveCapacity(notes.count + sortedFiles.count)
        var f = 0
        for n in notes {
            while f < sortedFiles.count, sortedFiles[f].1 > n.date {
                out.append((.file(sortedFiles[f].0), sortedFiles[f].1))
                f += 1
            }
            out.append((.note(n), n.date))
        }
        while f < sortedFiles.count {
            out.append((.file(sortedFiles[f].0), sortedFiles[f].1))
            f += 1
        }
        return out
    }
}

#if os(macOS)
/// A list built new (another folder, then back; a launch that reopens a note) starts scrolled to
/// its top, with the open note's row far off screen and nothing to show which note that is. When
/// the list appears it scrolls to that row, if it has one.
///
/// Only when the row is in this list and below its first rows, and by moving the table to the row
/// it worked out. SwiftUI's `scrollTo` finds a row by building the list's rows one by one from the
/// top until it meets it, all of them when the list doesn't have it: with 20,000 notes that was a
/// hang of seconds at every launch and every folder switch (release gate, 2026-10-13: four in five
/// hang samples at 20,000 notes). Moving the table builds only the rows that come on screen, as a
/// scroll by hand does.
struct ShowsSelectedRow: ViewModifier {
    let selected: UUID?
    /// The selected note's row in the table, counting section headings and the rows above them;
    /// nil when the list doesn't show it.
    let row: (UUID) -> Int?

    /// Rows always on screen when a list starts at its top, in any window the notes fit in.
    static let firstRows = 6

    init(selected: UUID?, row: @escaping (UUID) -> Int?) {
        self.selected = selected
        self.row = row
    }

    /// This list's table, found once the list is in a window.
    @State private var finder = TableFinder.Probe()

    func body(content: Content) -> some View {
        content
            .background(TableFinder(probe: finder))
            .onAppear {
                guard let selected, let at = row(selected), at >= Self.firstRows else { return }
                // A turn later: the rows are there by then.
                DispatchQueue.main.async { finder.center(row: at) }
            }
    }

    private struct TableFinder: NSViewRepresentable {
        let probe: Probe

        func makeNSView(context: Context) -> Probe { probe }
        func updateNSView(_ view: Probe, context: Context) {}

        final class Probe: NSView {
            private weak var table: NSTableView?

            /// The table whose scroll view covers this view: the list's, not the sidebar's.
            private func find() -> NSTableView? {
                if let table, table.window === window { return table }
                guard let window, let root = window.contentView else { return nil }
                let mine = convert(bounds, to: nil)
                let center = CGPoint(x: mine.midX, y: mine.midY)
                var found: NSTableView?
                func walk(_ v: NSView) {
                    if found != nil { return }
                    if let t = v as? NSTableView, let scroll = t.enclosingScrollView, scroll.convert(scroll.bounds, to: nil).contains(center) { found = t; return }
                    v.subviews.forEach(walk)
                }
                walk(root)
                table = found
                return found
            }

            /// Centres `row` in the table, if it has that row.
            func center(row: Int) {
                guard let table = find(), row < table.numberOfRows, let scroll = table.enclosingScrollView else { return }
                let clip = scroll.contentView
                let rect = table.rect(ofRow: row)
                let y = max(0, min(rect.midY - clip.bounds.height / 2, table.bounds.height - clip.bounds.height))
                clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: y))
                scroll.reflectScrolledClipView(clip)
            }
        }
    }

    /// Where `id` is among the rows of `sections`, each heading a row; nil when it isn't shown
    /// (not in the list, or in a section that is folded away).
    static func row<Item: Identifiable>(of id: UUID, in sections: [(String, [Item])], collapsed: Set<String>) -> Int? where Item.ID == UUID {
        var rows = 0
        for (name, items) in sections {
            rows += 1
            if collapsed.contains(name) {
                if items.contains(where: { $0.id == id }) { return nil }
                continue
            }
            if let i = items.firstIndex(where: { $0.id == id }) { return rows + i }
            rows += items.count
        }
        return nil
    }
}
#endif

/// What makes the note list a different list (see where it's used).
struct ListIdentity: Hashable {
    let scope: Scope
    let library: Int
}

/// Every note in the library, for the list, in the list's order (newest edit first unless another
/// was chosen: `ListOrder`).
///
/// The list used to read each note's date, folder, trash and parent from the store on every
/// update, sort them all and group them: about 100,000 reads to show one save with 20,000 notes
/// (close to a second). Here each note is read once into a `NoteEntry` and kept in order, and a
/// save says which notes it added, changed or deleted: only those are read again and moved. So
/// showing a change costs what changed, plus a pass over plain values. A change shows with its
/// save; a note's `touch()` saves on the next turn.
///
/// The notes aren't watched one by one (Observation): reading them inside the list's body made
/// the body depend on every note, and SwiftData tells every note it holds of a change after each
/// save, so 20,000 watches were read again and set up again several times a minute (release
/// gate, 2026-10-13: a hang of seconds while typing). Notes are read here without telling
/// Observation (`NoteEntry(untracked:)`).
@MainActor @Observable
final class LibraryNotes {
    /// Goes up with each change to the entries; reading it is what updates the list.
    private var generation = 0
    @ObservationIgnored private var sorted: [NoteEntry] = []
    @ObservationIgnored private weak var context: ModelContext?
    @ObservationIgnored private var container: ModelContainer?
    @ObservationIgnored private var observer: NSObjectProtocol?

    /// While a search is on, a note's text decides whether it is listed: every change counts.
    @ObservationIgnored var publishesEveryChange = false

    /// The order the entries are kept in. Only where a note goes counts here, not the headings.
    @ObservationIgnored private var order = ListOrder.standard

    func entries(in context: ModelContext, order: ListOrder = .standard) -> [NoteEntry] {
        if !order.sortsLike(self.order) {
            // Titles are read only for a list sorted by them: every note is read again once.
            let reads = (order.key == .title) != (self.order.key == .title)
            self.order = order
            if self.context === context { if reads { load() } else { sorted.sort(by: order.before) } }
        }
        if self.context !== context { start(context) }
        _ = generation
        return sorted
    }

    private func start(_ context: ModelContext) {
        self.context = context
        // The notes read here stay readable for as long as this list is around, also after
        // its window has closed with changes still waiting.
        container = context.container
        // A large library is read off the main thread: the window comes up at once, and the list
        // fills in when it's read (at 20,000 notes, most of a second on the main thread before).
        if ((try? context.fetchCount(FetchDescriptor<Note>())) ?? 0) > Self.readHere { loadElsewhere() } else { load() }
        if let observer { NotificationCenter.default.removeObserver(observer) }
        observer = NotificationCenter.default.addObserver(forName: ModelContext.didSave, object: context, queue: nil) { [weak self] n in
            func ids(_ key: ModelContext.NotificationKey) -> [PersistentIdentifier] { (n.userInfo?[key.rawValue] as? [PersistentIdentifier]) ?? [] }
            let inserted = ids(.insertedIdentifiers), deleted = ids(.deletedIdentifiers), updated = ids(.updatedIdentifiers)
            guard !inserted.isEmpty || !deleted.isEmpty || !updated.isEmpty else { return }
            MainActor.assumeIsolated { self?.take(inserted: inserted, deleted: deleted, updated: updated) }
        }
    }

    /// What a save added, changed and deleted for good. Many notes coming or going at once (an
    /// import, a first sync, another account) read every note again; otherwise only those notes
    /// are read again and placed.
    private func take(inserted: [PersistentIdentifier], deleted: [PersistentIdentifier], updated: [PersistentIdentifier]) {
        guard let context else { return }
        if isLoading {
            // Taken in once the library is read (it may have been read before this save).
            savedWhileLoading.inserted.formUnion(inserted + updated)
            savedWhileLoading.deleted.formUnion(deleted)
            return
        }
        guard inserted.count + deleted.count <= Self.wholesaleChange else {
            load()
            publish()
            return
        }
        var listChanged = false
        if !deleted.isEmpty {
            let gone = Set(deleted)
            let before = sorted.count
            sorted.removeAll { gone.contains($0.pid) }
            listChanged = sorted.count != before
        }
        let titled = order.key == .title
        let have = Set(sorted.map(\.id))
        var came: [NoteEntry] = []
        for id in inserted {
            guard let n = context.model(for: id) as? Note, n.modelContext != nil else { continue }
            let entry = NoteEntry(untracked: n, titled: titled)
            if have.contains(entry.id) { changed.insert(entry.id) } else { came.append(entry) }
        }
        if !came.isEmpty {
            place(came)
            listChanged = true
        }
        for id in updated {
            guard let n = context.model(for: id) as? Note else { continue }
            changed.insert(n.getValue(forKey: \.id))
        }
        if !changed.isEmpty { flush(alreadyChanged: listChanged) } else if listChanged { publish() }
    }

    /// Notes a save changed, read again before they're placed.
    @ObservationIgnored private var changed: Set<UUID> = []

    /// Libraries up to this many notes are read on the main thread, at once.
    static let readHere = 3_000
    /// The library is being read off the main thread: the list shows nothing yet, and no empty state.
    private(set) var isLoading = false
    @ObservationIgnored private var savedWhileLoading: (inserted: Set<PersistentIdentifier>, deleted: Set<PersistentIdentifier>) = ([], [])

    /// Every note, read on a context of its own, then sorted and shown as a new list.
    private func loadElsewhere() {
        guard let container else { return }
        isLoading = true
        savedWhileLoading = ([], [])
        let order = self.order
        Task.detached(priority: .userInitiated) { [weak self] in
            let read = ModelContext(container)
            let titled = order.key == .title
            // Sorted here too: the main thread only takes them.
            let entries = ((try? read.fetch(FetchDescriptor<Note>())) ?? []).map { NoteEntry(untracked: $0, titled: titled) }
                .sorted { LibraryNotes.precedes($0, $1, in: order) }
            await MainActor.run { self?.install(entries, order: order) }
        }
    }

    private func install(_ entries: [NoteEntry], order read: ListOrder) {
        guard isLoading, let context else { return }
        isLoading = false
        sorted = entries
        if !read.sortsLike(order) { (read.key == .title) == (order.key == .title) ? sorted.sort(by: precedes) : load() }
        // Saves while it was read: their notes are read again here, from the context that saved them.
        let saved = savedWhileLoading
        savedWhileLoading = ([], [])
        if !saved.deleted.isEmpty { sorted.removeAll { saved.deleted.contains($0.pid) } }
        let have = Dictionary(sorted.map { ($0.pid, $0.id) }, uniquingKeysWith: { first, _ in first })
        var came: [NoteEntry] = []
        for pid in saved.inserted {
            guard let n = context.model(for: pid) as? Note, n.modelContext != nil else { continue }
            if let id = have[pid] { changed.insert(id) } else { came.append(NoteEntry(untracked: n, titled: order.key == .title)) }
        }
        place(came)
        if !changed.isEmpty { flush(alreadyChanged: true) }
        // Shown as a new list: it scrolls to the open note's row as a list built new does.
        wholesale += 1
        publish()
    }

    /// Every note, read once and sorted.
    private func load() {
        guard let context else { return }
        changed = []
        let before = Set(sorted.map(\.id))
        let notes = (try? context.fetch(FetchDescriptor<Note>())) ?? []
        let titled = order.key == .title
        var entries = notes.map { NoteEntry(untracked: $0, titled: titled) }
        if order.key == .title, !sorted.isEmpty {
            // Titles are slow to compare, and the list was in order a moment ago: put back in that
            // order first, the sort has only the notes that came or changed to place.
            let was = Dictionary(sorted.enumerated().map { ($1.id, $0) }, uniquingKeysWith: { first, _ in first })
            entries.sort { (was[$0.id] ?? .max) < (was[$1.id] ?? .max) }
        }
        sorted = entries.sorted(by: precedes)
        // An import, a first sync or another account: hundreds of notes came or went at once.
        var differing = 0
        for e in sorted where !before.contains(e.id) { differing += 1 }
        differing += before.count - (sorted.count - differing)
        if differing > Self.wholesaleChange { wholesale += 1 }
    }

    /// The entries changed in a way the list shows: the list hears of it, and so do the folder
    /// rows whose counts it changed.
    private func publish() {
        generation += 1
        if counted { countFolders() }
    }

    /// Each folder's notes as its list shows them: live, and not a sub-note inside its parent.
    /// Counted from the entries in one pass whenever they change; each folder's row hears only of
    /// its own count, so the sidebar's 800 folder rows aren't worked out again for every change.
    func listedCount(inFolder id: UUID, context: ModelContext) -> Int? {
        if self.context !== context { start(context) }
        // While a large library is read the folders show no count yet.
        if isLoading { return nil }
        // Asked while views are worked out: only boxes nobody reads yet are filled in here.
        if !counted { countFolders() }
        let box = folderCounts[id] ?? { let b = FolderCount(); folderCounts[id] = b; return b }()
        return box.value
    }

    /// All Notes and Recently Deleted as the list shows them (SidebarView.counts), counted in the
    /// same pass: the sidebar's counted rows read these instead of asking the store, which counted
    /// by reading every note's row from disk, three times for every change.
    func libraryCounts(context: ModelContext) -> (live: Int, trashed: Int) {
        if self.context !== context { start(context) }
        // While a large library is read, the store counts (once or twice, at launch).
        if isLoading { return SidebarView.counts(in: context) }
        if !counted { countFolders() }
        return (totals.live, totals.trashed)
    }

    @Observable final class FolderCount { var value = 0 }
    @Observable final class Totals {
        var live = 0
        var trashed = 0
    }
    @ObservationIgnored private var folderCounts: [UUID: FolderCount] = [:]
    @ObservationIgnored private let totals = Totals()
    /// Counted once: from then on every change the list shows counts again.
    @ObservationIgnored private var counted = false

    private func countFolders() {
        guard let context else { return }
        let inside = Set(SubNoteIndex.nestedIDs(in: context))
        var counts: [UUID: Int] = [:]
        var live = 0, trashed = 0
        for e in sorted where !e.deleted && !inside.contains(e.id) {
            if e.trashed { trashed += 1; continue }
            live += 1
            if let folder = e.folderID { counts[folder, default: 0] += 1 }
        }
        if totals.live != live { totals.live = live }
        if totals.trashed != trashed { totals.trashed = trashed }
        for (id, n) in counts where folderCounts[id] == nil { folderCounts[id] = FolderCount() }
        for (id, box) in folderCounts {
            let n = counts[id] ?? 0
            if box.value != n { box.value = n }
        }
        counted = true
    }

    /// Goes up when so many notes came or went in one save that the list is shown as a new list.
    @ObservationIgnored private(set) var wholesale = 0
    static let wholesaleChange = 200

    /// Whether `a` is listed before `b`. The list's own order is two dates compared, nothing more.
    private func precedes(_ a: NoteEntry, _ b: NoteEntry) -> Bool { Self.precedes(a, b, in: order) }

    nonisolated static func precedes(_ a: NoteEntry, _ b: NoteEntry, in order: ListOrder) -> Bool {
        order.sortsLike(.standard) ? a.date > b.date : order.before(a, b)
    }

    /// Reads the notes a save changed again and puts them where they go. `alreadyChanged`: the
    /// same save added or dropped notes, so the list changes anyway.
    private func flush(alreadyChanged: Bool = false) {
        guard context != nil, !changed.isEmpty else {
            changed = []
            if alreadyChanged { publish() }
            return
        }
        let ids = changed
        changed = []
        let titled = order.key == .title
        // One note changed and stays where it is, in the same folder and day: a save of the
        // note being typed in. Nothing the list is made of changed (the row shows its own note),
        // so the list isn't worked out again. Built again, the list put that note's row in anew
        // on every save, on or off screen, and laid out twice the cells.
        guard let context else { return }
        if !alreadyChanged, ids.count == 1, let id = ids.first, let i = sorted.firstIndex(where: { $0.id == id }), let note = sorted[i].note(in: context) {
            let old = sorted[i], new = NoteEntry(untracked: note, titled: titled)
            let stays = (i == 0 || !precedes(new, sorted[i - 1])) && (i == sorted.count - 1 || !precedes(sorted[i + 1], new))
            if stays {
                sorted[i] = new
                if !new.listsLike(old) || publishesEveryChange { publish() }
                return
            }
        }
        // Notes whose list values are the same (a sync mark, text that changed in place) stay
        // where they are; the others are taken out and placed again.
        var moved: [NoteEntry] = []
        var dropped = false
        sorted.removeAll { e in
            guard ids.contains(e.id) else { return false }
            guard let note = e.note(in: context) else { dropped = true; return true }
            let new = NoteEntry(untracked: note, titled: titled)
            if new.same(as: e) { return false }
            moved.append(new)
            return true
        }
        place(moved)
        if alreadyChanged || publishesEveryChange || dropped || !moved.isEmpty { publish() }
    }

    /// Puts `entries` where they go in the order.
    private func place(_ entries: [NoteEntry]) {
        if entries.count > 64 {
            // A sync or an import changed many at once: one sort beats that many insertions.
            sorted = (sorted + entries).sorted(by: precedes)
        } else {
            for e in entries.sorted(by: precedes) {
                // Before the first entry that doesn't come before it.
                var low = 0, high = sorted.count
                while low < high {
                    let mid = (low + high) / 2
                    if precedes(sorted[mid], e) { low = mid + 1 } else { high = mid }
                }
                sorted.insert(e, at: low)
            }
        }
    }
}

/// Row type and spacing, matched to Apple Notes on each platform.
enum RowMetrics {
    #if os(macOS)
    // Against Apple Notes on macOS 26 (owner, 2026-10-12: "a bit less overwhelming"): the second
    // line a size smaller than the title. The rows are Apple's, read through Accessibility in a
    // 237 pt column: 68 pt with a folder line (its lines centred 16, 34.5 and 52.5 pt down) and
    // 56 without (the title's line where Apple's is, 20 pt down); the text 34 pt in from the
    // row's edge. Apple's date line sits 2 pt closer to the title in a row without a folder line;
    // here it keeps the folder rows' gap (owner: "the note title and subtitle needs a bit of
    // spacing"). The list adds 4 pt above and below a row and 16 at its left
    // (NoteListGeometryTests).
    static let title = Font.system(size: 13, weight: .bold)
    static let detail = Font.system(size: 12)
    /// C and D: the folder line, a size under the detail.
    static let folder = Font.system(size: 11)
    /// C and D: room the hairlines used to give, as air above and below each row.
    static var calmAir: CGFloat { DesignLook.calmList ? 3 : 0 }
    static let spacing: CGFloat = 3
    static let leading: CGFloat = 18
    /// Room above and below a row's lines: less when it has a third line, its folder.
    static func top(folderLine: Bool) -> CGFloat { folderLine ? 4 : 7 }
    static func bottom(folderLine: Bool) -> CGFloat { folderLine ? 4 : 7 }
    static let dotOffset: CGFloat = -12
    /// The app mark's size: about the title's cap height.
    static let markSize: CGFloat = 13
    /// A file's thumbnail on the trailing side, about the two lines' height.
    static let thumbnail: CGFloat = 32
    #else
    static let markSize: CGFloat = 16
    static let thumbnail: CGFloat = 42
    static let folder = Font.footnote
    static let calmAir: CGFloat = 0
    static let title = Font.headline
    static let detail = Font.subheadline
    static let spacing: CGFloat = 3
    static let leading: CGFloat = 0
    static func top(folderLine: Bool) -> CGFloat { 1 }
    static func bottom(folderLine: Bool) -> CGFloat { 1 }
    static let dotOffset: CGFloat = -12
    #endif
}

/// A note's row as the list holds it: the row, its hover and its menu. Equal values mean an
/// unchanged row. The note's model is looked up here, where the row is drawn: SwiftUI builds the
/// list's rows for every note whenever the list changes, and only the rows on screen draw.
private struct NoteListItem<Menu: View>: View, @MainActor Equatable {
    let entry: NoteEntry
    let query: String
    let showFolder: Bool
    let datedByCreation: Bool
    let dragWith: [UUID]?
    let selectedCount: Int
    /// Selected, drawn by the row (the Mac's quiet selection).
    let quiet: Bool
    /// The room above the title's line, where the ••• lines up.
    let top: CGFloat
    let togglePin: (Note) -> Void
    let remove: (Note) -> Void
    @ViewBuilder let menu: (Note) -> Menu
    @Environment(\.modelContext) private var context

    static func == (a: NoteListItem, b: NoteListItem) -> Bool {
        a.entry.pid == b.entry.pid && a.entry.same(as: b.entry) && a.query == b.query && a.showFolder == b.showFolder
            && a.datedByCreation == b.datedByCreation && a.dragWith == b.dragWith && (a.dragWith == nil || a.selectedCount == b.selectedCount)
            && a.quiet == b.quiet && a.top == b.top
    }

    var body: some View {
        if let note = entry.note(in: context) {
            // Its own equatable view: when one note changes, the others' rows (and their
            // drag and swipe setup) are left alone instead of rebuilt.
            ListRow(note: note, query: query, showFolder: showFolder, datedByCreation: datedByCreation,
                    dragWith: dragWith, selectedCount: selectedCount, togglePin: { togglePin(note) }, remove: { remove(note) })
                .equatable()
                #if os(macOS)
                // Under the pointer the row's ••• appears at its right, with the same menu as a
                // right-click, as on the sidebar's folders. The room for it is kept, so nothing moves.
                .padding(.trailing, Hover.menuTarget + 2)
                #endif
                // Outside the equatable row, so the list sees its background. On the Mac the row draws
                // its selection itself, a neutral fill like the sidebar's, not the list's amber bar.
                .modifier(NoteRowHover(note: note, selected: quiet, top: top, pointer: { [note] over in NotePreload.pointer(over, on: note) }) {
                    menu(note)
                })
                .quietSelection()
                #if os(iOS)
                .listRowBackground(Color(Palette.row))
                #endif
        }
    }
}

/// A note in the list with its drag and swipe actions. Equal inputs mean an unchanged row:
/// its note's own changes still reach NoteRow, which observes the note.
private struct ListRow: View, @MainActor Equatable {
    let note: Note
    let query: String
    let showFolder: Bool
    /// The list is sorted by date created: the row shows that date.
    let datedByCreation: Bool
    /// The rest of the selection, when this row is part of a multi-selection.
    let dragWith: [UUID]?
    let selectedCount: Int
    let togglePin: () -> Void
    let remove: () -> Void

    static func == (a: ListRow, b: ListRow) -> Bool {
        a.note === b.note && a.query == b.query && a.showFolder == b.showFolder && a.datedByCreation == b.datedByCreation
            && a.dragWith == b.dragWith && (a.dragWith == nil || a.selectedCount == b.selectedCount)
    }

    var body: some View {
        NoteRow(note: note, query: query, showFolder: showFolder, datedByCreation: datedByCreation)
            .draggable(PaneDragItem(kind: .note, id: note.id, others: dragWith)) {
                Label(dragWith != nil ? "\(selectedCount) Notes" : note.title, systemImage: dragWith != nil ? "doc.on.doc" : "note.text")
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .glassEffect(.regular, in: .capsule)
            }
            // Notes dropped on this row become its sub-notes. (After the drag source, as on
            // the sidebar's folders: inside it, the row was never offered a drop.)
            .modifier(SubNoteDropTarget(note: note))
            .swipeActions(edge: .leading) {
                if note.trashedAt == nil {
                    Button(note.isPinned ? "Unpin" : "Pin", systemImage: note.isPinned ? "pin.slash" : "pin", action: togglePin)
                        .tint(.orange)
                }
            }
            .swipeActions(edge: .trailing) {
                Button(note.trashedAt == nil ? "Delete" : "Delete Forever…", systemImage: "trash", role: .destructive, action: remove)
            }
    }
}

struct NoteRow: View {
    let note: Note
    var query: String = ""
    var showFolder = false
    /// The list is sorted by date created: the row shows that date, as Apple Notes does.
    var datedByCreation = false

    /// The date the row shows: the one the list is sorted by, which is the date edited unless
    /// the list is sorted by date created.
    static func shownDate<Item: DatedListItem>(of item: Item, byCreation: Bool) -> Date { byCreation ? item.listCreated : item.listDate }

    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(SyncEngine.self) private var sync: SyncEngine?

    /// Whether the row has its third line, the note's folder.
    private var folderLine: Bool { showFolder && note.folder != nil }

    var body: some View {
        let title = note.title
        // Shared by link, by this account (the share's tag verified): a small link, like Notes.
        let shared = sync?.liveShares[note.id] != nil && !note.isLocked && note.trashedAt == nil
        // At the accessibility text sizes the row stacks and wraps instead of truncating.
        let large = typeSize.isAccessibilitySize
        let calm = DesignLook.calmList && !large
        let detail = large ? AnyLayout(VStackLayout(alignment: .leading, spacing: 2)) : AnyLayout(HStackLayout(spacing: calm ? 5 : 8))
        let ai = AIEdit.isUnseen(note) ? note.aiEditor : nil
        let app = NoteAppMark.has(note)
        return VStack(alignment: .leading, spacing: RowMetrics.spacing) {
            HStack(spacing: 5) {
                Text(title)
                    .font(RowMetrics.title)
                    .tracking(DesignLook.isCandidate ? -0.15 : 0)
                    .foregroundStyle(Color.ink)
                    .lineLimit(large ? 3 : 1)
                if app {
                    AppMarkView(size: RowMetrics.markSize)
                        .accessibilityIdentifier("note.app")
                }
            }
            // An AI changed this note and you haven't opened it since, like Mail's unread dot.
            .overlay(alignment: .leading) {
                if ai != nil {
                    Circle().fill(.tint).frame(width: 8, height: 8)
                        .offset(x: RowMetrics.dotOffset)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            detail {
                HStack(spacing: 4) {
                    if shared {
                        Image(systemName: "link")
                            .imageScale(.small)
                            .foregroundStyle(Color.muted)
                            .accessibilityHidden(true)
                            .accessibilityIdentifier("note.shared")
                    }
                    Text(DateBucket.rowDate(Self.shownDate(of: note, byCreation: datedByCreation)))
                        .monospacedDigit()
                        .foregroundStyle(Color.ink.opacity(0.85))
                }
                // C and D: "date · preview", one quiet line under the title.
                if calm { Text("·").foregroundStyle(Color.muted).accessibilityHidden(true) }
                if note.isLocked {
                    // Like Notes: the title and a lock, nothing of the text.
                    Label("Locked", systemImage: "lock.fill")
                        .labelStyle(LockedRowLabel())
                        .foregroundStyle(Color.muted)
                        .lineLimit(1)
                } else if let ai {
                    HStack(spacing: 4) {
                        AIGlyph(ai: ai, size: 11)
                        Text(AIEdit.wroteIt(note) ? "Written by \(ai)" : "Edited by \(ai)")
                    }
                    .foregroundStyle(Color.amberInk)
                    .lineLimit(1)
                } else {
                    Text(snippet)
                        .foregroundStyle(Color.muted)
                        .lineLimit(large ? 2 : 1)
                }
            }
            .font(RowMetrics.detail)
            if folderLine, let f = note.folder {
                HStack(spacing: DesignLook.calmList ? 4 : 5) {
                    // The candidates draw it lighter and smaller than the name (DESIGN.md, Icons).
                    Image(systemName: "folder")
                        .imageScale(DesignLook.isCandidate ? .small : .medium)
                        .opacity(DesignLook.isCandidate ? 0.75 : 1)
                    Text(f.name)
                }
                // C and D: a size smaller again, a quiet tag under the row.
                .font(DesignLook.calmList ? RowMetrics.folder : RowMetrics.detail)
                .foregroundStyle(Color.muted)
            }
        }
        .padding(.top, RowMetrics.top(folderLine: folderLine) + RowMetrics.calmAir)
        .padding(.bottom, RowMetrics.bottom(folderLine: folderLine) + RowMetrics.calmAir)
        .padding(.leading, RowMetrics.leading)
        .accessibilityElement(children: .combine)
        .accessibilityValue([note.isPinned ? "Pinned" : nil, app ? "App" : nil, shared ? "Shared" : nil, note.isLocked ? "Locked" : nil, ai.map { "Edited by \($0)" }].compactMap { $0 }.joined(separator: ", "))
        .accessibilityIdentifier("note.\(title)")
    }

    /// The lock sits close to its word, like the list's other small glyphs.
    private struct LockedRowLabel: LabelStyle {
        func makeBody(configuration: Configuration) -> some View {
            HStack(spacing: 4) {
                configuration.icon.imageScale(.small)
                configuration.title
            }
        }
    }

    /// With a search, show the matching line instead of the preview.
    private var snippet: String {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return note.preview }
        for line in note.body.split(separator: "\n") where line.localizedStandardContains(q) {
            let clean = NoteText.stripMarkup(String(line))
            if !clean.isEmpty, clean != note.title { return clean }
        }
        return note.preview
    }
}

/// The note row's hover: the light fill, and on the Mac its ••• at the right edge.
private struct NoteRowHover<Items: View>: ViewModifier {
    /// Its title names the row (captures, tests), read here: only rows on screen are worked out.
    let note: Note
    let selected: Bool
    /// The room above the title's line, where the ••• lines up.
    let top: CGFloat
    let pointer: (Bool) -> Void
    @ViewBuilder let items: () -> Items

    func body(content: Content) -> some View {
        // The pill fills the row from edge to edge, as Apple Notes' does.
        HoverRowReader(id: note.title, reach: Hover.noteRowReach, selected: selected, card: DesignLook.calmList, pointer: pointer) { hovering in
            content
                #if os(macOS)
                // Always the top right corner, on the title's line, whatever the row holds.
                .overlay(alignment: .topTrailing) {
                    HoverSwap(on: hovering, help: "Note options") { EmptyView() } items: { items() }
                        .padding(.top, top)
                }
                #endif
        }
    }
}

