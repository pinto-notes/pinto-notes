import SwiftData
import SwiftUI
import TipKit
import UniformTypeIdentifiers

struct NoteListView: View {
    @Environment(\.modelContext) private var context
    #if os(macOS)
    @Environment(\.listSidebarHidden) private var listSidebarHidden
    #endif
    let scope: Scope
    /// Several notes can be selected (⌘-click, ⇧-click, ⌘A on the Mac; on iPhone, Select Notes in the ••• menu, Edit in Recently Deleted, or a two-finger swipe).
    @Binding var selection: Set<UUID>
    let onNewNote: () -> Void
    /// Set while the list shows its empty state, so the note pane beside it stays blank rather than
    /// saying "No note selected" under the list's own "No Notes" (council round 16).
    var showsEmpty: Binding<Bool> = .constant(false)
    /// Set while the list shows search results, so the note pane points at them.
    var showsResults: Binding<Bool> = .constant(false)
    #if os(iOS)
    @State private var editMode: EditMode = .inactive
    /// What Move (a long-press, Select Notes, Recently Deleted) is moving, while its sheet is up.
    @State private var moving: Set<UUID>?
    #endif
    /// Lock Note or Remove Lock from a note's long-press or right-click menu (ListLockFlow).
    @State private var lockRequest: ListLockRequest?
    @Environment(\.openWindow) private var openWindow
    @Environment(\.undoManager) private var undoManager
    #if os(macOS)
    #endif

    /// Every note, fetched again only when a save adds or deletes one (see LibraryNotes).
    @State private var ownLibrary = LibraryNotes()
    /// The window's (RootView), shared with the sidebar's folder counts; a list on its own keeps its own.
    @Environment(LibraryNotes.self) private var windowLibrary: LibraryNotes?
    private var library: LibraryNotes { windowLibrary ?? ownLibrary }
    /// "Sort By" and "Group By Date", as chosen on this device (grouping per folder).
    @State private var orderStore = ListOrderStore.shared
    /// The order the list is shown in. What a search finds keeps the list's own order, newest first.
    private var order: ListOrder { search.trimmingCharacters(in: .whitespaces).isEmpty ? orderStore.order(for: scope) : .standard }
    /// In the chosen order, as plain values: nothing here reads a note from the store.
    private var entries: [NoteEntry] { library.entries(in: context, order: orderStore.order) }
    /// Files kept in folders on their own, listed with the notes.
    @Query(filter: #Predicate<Attachment> { $0.folderID != nil && $0.deletedAt == nil }) private var folderFiles: [Attachment]
    /// How many notes and files the search shows; nil when not searching.
    @State private var searchResults: Int?
    @State private var search = ""
    /// The search field's text: a key typed there starts the clock for `search_speed`.
    private var typedSearch: Binding<String> {
        Binding(get: { search }, set: { new in
            if new != search { SearchSpeed.typed() }
            search = new
        })
    }
    #if os(macOS)
    /// The search field shows at the top of the list while searching: opened by the list's
    /// Search button or ⌘F, closed by the button again, Escape, or by leaving it empty.
    @State private var searching = false
    /// Counts the requests to put the keys in the field (each press of Search or ⌘F).
    @State private var searchFocus = 0
    #endif
    /// "Add Files to …": the picker, and a file being renamed.
    @State private var addingFiles = false
    /// Ask an AI about this list's folder (or every note): the AI picked in the ••• menu.
    @State private var asking: AskAI.Target?
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
    @State private var pendingShared: [Note]?
    @Environment(\.importActions) private var imports
    #if os(iOS)
    /// One screen at a time (iPhone) or a column beside the note (iPad, iPhone Duo open).
    @Environment(\.stackedNotes) private var stacked
    @Environment(\.besideNote) private var besideNote
    @Environment(OpenNotes.self) private var openNotes: OpenNotes?
    #else
    /// The Mac keeps its own list grounds (Palette's macOS `listGround`).
    private let stacked = true
    #endif
    @Environment(\.behindSetupCard) private var behindSetupCard
    @Environment(SetupStore.self) private var setup: SetupStore?
    @Environment(Backend.self) private var backend: Backend?
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @State private var connectCenter = ConnectCenter.shared
    /// How full the account is: a warning near 2 GB and at it.
    @State private var storage = StorageStore.shared
    @State private var showSettings = false
    /// The Share tip at the top of the list is due (iPhone).
    @State private var listTipDue = false

    private func scoped(from all: [NoteEntry]) -> [NoteEntry] { Self.scoped(all, to: scope, context: context) }

    /// The notes a scope lists, in the order they came in.
    static func scoped(_ all: [NoteEntry], to scope: Scope, context: ModelContext) -> [NoteEntry] {
        // A tag's notes: the store finds the few whose text has it.
        let tagged: Set<PersistentIdentifier> = if case .tag(let name) = scope { Tags.noteIDs(tagged: name, in: context) } else { [] }
        return all.filter { e in
            guard !e.deleted else { return false }
            switch scope {
            case .all: return !e.trashed
            case .trash: return e.trashed
            case .folder(let id): return !e.trashed && e.folderID == id
            case .tag: return !e.trashed && tagged.contains(e.pid)
            }
        }
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
            case .tag: return false
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
        withTopHits(DateBucket.sections(ordered: ListEntry.merged(notes: filtered, files: filteredFiles(from: scopedFiles), by: order), by: order)).flatMap(\.1)
    }

    /// "12 notes, 3 files", or just the notes when the folder has no files. In Recently Deleted
    /// the same line says how long things stay: "9 notes · Deleted after 30 days".
    private func countText(notes: Int, files: Int, capitalized: Bool) -> String {
        Self.countText(notes: notes, files: files, capitalized: capitalized, trash: scope == .trash)
    }

    /// The line under the title: "3 notes", "1 note"; nothing while searching or when there's
    /// nothing in the list.
    static func titleCount(notes: Int, files: Int, searching: Bool, trash: Bool) -> String? {
        guard !searching, notes + files > 0 else { return nil }
        return countText(notes: notes, files: files, capitalized: false, trash: trash)
    }

    /// The Mac's line under the folder's name: the results while searching, not the folder's
    /// whole count (council round 16: "12 notes" over one result).
    static func macCount(notes: Int, files: Int, results: Int?, trash: Bool) -> String {
        if let results { return results == 1 ? "1 result" : "\(results) results" }
        return countText(notes: notes, files: files, capitalized: false, trash: trash)
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

    /// While searching, a note whose whole title is the search goes first, under Top Hits.
    private func withTopHits(_ sections: [(String, [NoteEntry])]) -> [(String, [NoteEntry])] {
        guard !search.trimmingCharacters(in: .whitespaces).isEmpty else { return sections }
        return DateBucket.withTopHits(sections) { isTopHit($0) }
    }

    private func withTopHits(_ sections: [(String, [ListEntry])]) -> [(String, [ListEntry])] {
        guard !search.trimmingCharacters(in: .whitespaces).isEmpty else { return sections }
        return DateBucket.withTopHits(sections) { item in
            if case .note(let entry) = item { isTopHit(entry) } else { false }
        }
    }

    private func isTopHit(_ entry: NoteEntry) -> Bool {
        entry.note(in: context).map { DateBucket.isWholeTitle($0.title, query: search) } ?? false
    }

    /// The notes whose text holds `query`, newest first whatever order the list is in: only the
    /// few found are sorted.
    ///
    /// The store finds them (`localizedStandardContains`, as before): the list no longer holds every
    /// note's text, and reading it a note at a time cost a query per note.
    static func found(_ query: String, in base: [NoteEntry], listedBy order: ListOrder, context: ModelContext) -> [NoteEntry] {
        var matching = Set((try? context.fetchIdentifiers(FetchDescriptor<Note>(predicate: #Predicate { $0.body.localizedStandardContains(query) }))) ?? [])
        if !base.contains(where: { matching.contains($0.pid) }) { matching = closeMatches(query, context: context) }
        let found = base.filter { matching.contains($0.pid) }
        return order.sortsLike(.standard) ? found : found.sorted { $0.date > $1.date }
    }

    /// Nothing holds the query as typed: the notes whose words are within a letter or two of it
    /// (TypoSearch). The store finds the few that hold a piece of it, and only those are read.
    static func closeMatches(_ query: String, context: ModelContext, limit: Int = 300) -> Set<PersistentIdentifier> {
        guard TypoSearch.applies(to: query) else { return [] }
        var out = Set<PersistentIdentifier>()
        for piece in TypoSearch.probes(query) {
            var d = FetchDescriptor<Note>(predicate: #Predicate { $0.body.localizedStandardContains(piece) })
            d.fetchLimit = limit
            for n in (try? context.fetch(d)) ?? [] where TypoSearch.matches(query, in: n.body) { out.insert(n.persistentModelID) }
        }
        return out
    }

    private var title: String {
        switch scope {
        case .all: "All Notes"
        case .trash: "Recently Deleted"
        case .folder(let id): context.folder(id)?.name ?? "Notes"
        case .tag(let name): "#" + name
        }
    }

    var body: some View {
        #if DEBUG || QA
        RenderProbe.count("NoteListView", context: context)
        #endif
        // Worked out once per update and handed down: the list asks many times.
        // A tag's list too: a note's text decides whether it's in it.
        library.publishesEveryChange = !search.trimmingCharacters(in: .whitespaces).isEmpty || { if case .tag = scope { true } else { false } }()
        let all = entries
        let scopedNotes = scoped(from: all)
        let visible = filtered(from: scopedNotes, all: all)
        let files = scopedFiles
        let visibleFiles = filteredFiles(from: files)
        let results: Int? = search.isEmpty ? nil : visible.count + visibleFiles.count
        return list(scopedNotes, visible, files, visibleFiles)
            .onChange(of: results, initial: true) { _, now in searchResults = now }
            // What was typed is found and laid out by now; on screen after this pass (search_speed).
            .onChange(of: search) { _, now in if !now.isEmpty { DispatchQueue.main.async { SearchSpeed.shown() } } }
            #if os(iOS)
            .task { await watchListTip() }
            #endif
    }

    /// The folders by name, for the menus that move things. Asked for when a menu is, not
    /// each time the list is worked out: fetching and sorting every folder was part of every
    /// update of the list (every note opened), for menus nobody had asked for.
    private var foldersByName: [Folder] {
        #if DEBUG || QA
        RenderProbe.count("NoteListView.foldersByName")
        #endif
        return context.allFolders().sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    private func list(_ scopedNotes: [NoteEntry], _ visible: [NoteEntry], _ scopedFiles: [Attachment], _ visibleFiles: [Attachment]) -> some View {
        let noteSections = visibleFiles.isEmpty ? withTopHits(DateBucket.sections(ordered: visible, by: order)) : nil
        let mixedSections = visibleFiles.isEmpty ? nil : withTopHits(DateBucket.sections(ordered: ListEntry.merged(notes: visible, files: visibleFiles, by: order), by: order))
        let collapsed = self.collapsed
        // The rows above the first section (the asks below), for finding a note's row in the table.
        let leadingRows = (scope != .trash && search.isEmpty && connectCenter.waiting().first != nil ? 1 : 0)
            + (scope != .trash && search.isEmpty && (storage.usage.map { $0.level != .fine } ?? false) ? 1 : 0)
        #if os(macOS)
        // The list's own changes are told apart from code's in the click log (RowClickLog).
        // Behind a setup card a click on the card could still reach a row (SwiftUI hands it past
        // every layer, Emil, 2 November 2026): the list's own picks are ignored there.
        let behind = behindSetupCard
        let listSelection = Binding(get: { selection }, set: { new in
            guard !behind else { return }
            let kept = PressSelect.selection(from: selection, asking: new, byKey: NSApp.currentEvent?.type == .keyDown)
            RowClickLog.listSet(selection, kept); selection = kept
        })
        #else
        // Beside the note (iPad, iPhone Duo open) the list is told nothing is selected, so it draws
        // no highlight of its own (a cold grey, or dark ink on the accent); the rows draw the open
        // note in a warm grey (Palette.openNoteRow). Picking a row still opens it; selecting
        // several while editing keeps the list's own.
        let listSelection = besideNote && editMode != .active
            ? Binding(get: { Set<UUID>() }, set: { selection = $0 })
            : $selection
        #endif
        return List(selection: listSelection) {
            // An ask to connect an AI whose sheet was closed without an answer: always a way back.
            if scope != .trash, search.isEmpty, let ask = connectCenter.waiting().first {
                #if os(iOS)
                Section {
                    ConnectWaitingRow(ask: ask).selectionDisabled()
                }
                .listRowBackground(stacked ? Color(Palette.row) : nil)
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
                    .listRowBackground(stacked ? Color(Palette.row) : nil)
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
                                .contextMenu { menu(for: file, folders: foldersByName) }
                                .listRowBackground(stacked ? Color(besideNote && openNotes?.ids.contains(file.id) == true ? Palette.openNoteRow : Palette.row) : nil)
                                #else
                                .listRowSeparator(DesignLook.calmList ? .hidden : .automatic)
                                #endif
                        }
                    }
                }
            }

        }
        #if os(macOS)
        // Right-click acts on the whole selection when the row is part of it, like Notes. On
        // iPhone each row has its own long-press menu, with the note as its preview (noteRow).
        .contextMenu(forSelectionType: UUID.self) { ids in
            // Icons in the label colour, as in Notes, not the app's accent (Delete keeps its red).
            menu(for: ids, folders: foldersByName).tint(.primary)
        }
        #if DEBUG || QA
        .transaction { RenderProbe.noteListTransaction?(context, visible.map(\.id), $0) }
        #endif
        // Only the list animates an untouched note going away. The destination editor opens
        // in the selection's original transaction, without a fade or a layout interpolation.
        .animation(.easeOut(duration: 0.2), value: library.discardedEmptyNotes)
        // Another library (more than 200 notes come or gone in one save) is another list, built
        // new. Another folder is the same list with other rows: built new, a switch took about
        // 250 ms, 70 of them making the table again; SwiftUI now shows the other rows in about
        // 30 ms, even from a folder of 25 to All Notes with 2,000 (Emil, 13 November 2026). It
        // once took 3 to 4 s, before the list kept its notes as plain values (NoteEntry). A new
        // folder still starts at its top (ShowsSelectedRow). A search stays the same list: a new
        // one took the keys away from the search field.
        .modifier(ListLockFlow(request: $lockRequest))
        .modifier(ShowsSelectedRow(selected: selection.count == 1 ? selection.first : nil, scope: scope) { id in
            (noteSections.flatMap { ShowsSelectedRow.row(of: id, in: $0, collapsed: collapsed) }
                ?? mixedSections.flatMap { ShowsSelectedRow.row(of: id, in: $0, collapsed: collapsed) }).map { leadingRows + $0 }
        })
        .id(ListIdentity(scope: .all, library: library.wholesale))
        #if os(macOS)
        .modifier(OpensTopNote(scope: scope, top: visible.first?.id, lists: { id in visible.contains { $0.id == id } }, selection: $selection))
        #endif
        #endif
        #if os(iOS)
        // iPhone: grouped cards on a grey ground. As columns: the Mac's list, rows on white with a
        // grey pill for the selected note (Emil, 3 November 2026: the iPad "feels like a different app").
        .modifier(ColumnListStyle(cards: stacked))
        .tint(stacked ? nil : Color(Palette.columnSelection))
        .environment(\.editMode, $editMode)
        // The Duo upright shows the list alone while it picks notes, not the note they open.
        .onChange(of: editMode.isEditing) { _, on in openNotes?.editing = on }
        .sheet(isPresented: Binding(get: { moving != nil }, set: { if !$0 { moving = nil } })) {
            MoveNotesSheet(current: movingFrom) { f in
                if let ids = moving { withAnimation(.snappy) { move(ids, to: f) } }
                endEditing()
            }
        }
        .modifier(ListLockFlow(request: $lockRequest))
        // Offline: a quiet line over the bottom bar (the Mac says it in the sidebar).
        .safeAreaInset(edge: .bottom, spacing: 0) { OfflineLine(sync: sync).animation(.easeOut(duration: 0.25), value: sync?.reach) }
        #endif
        // Less warmth than the sidebar, more than the note.
        .scrollContentBackground(.hidden)
        .accessibilityLabel("Notes")
        .background(Color(stacked ? Palette.listGround : Palette.page).ignoresSafeArea())
        #if os(macOS)
        // Soft under the toolbar, as the sidebar and Notes: a list's own edge is hard, the window's
        // grey title bar with a line under it (Emil, 10-30, in Recently Deleted).
        .scrollEdgeEffectStyle(.soft, for: .top)
        .modifier(ListEdgeQuiet(list: ListIdentity(scope: scope, library: library.wholesale)))
        .modifier(FollowsTextSize())
        #endif
        .overlay {
            if visible.isEmpty && visibleFiles.isEmpty && !library.isLoading && !behindSetupCard { emptyState }
        }
        .onChange(of: visible.isEmpty && visibleFiles.isEmpty && !library.isLoading && !behindSetupCard, initial: true) { _, now in
            if showsEmpty.wrappedValue != now { showsEmpty.wrappedValue = now }
        }
        .onChange(of: !search.isEmpty, initial: true) { _, now in
            if showsResults.wrappedValue != now { showsResults.wrappedValue = now }
            if now { Usage.count(.searchUsed) }
        }
        #if os(iOS)
        .sheet(isPresented: $showSettings) {
            if let backend { SettingsView(backend: backend, sync: sync) }
        }
        #endif
        // On the Mac, Settings is a card over the notes window (RootView).
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
                    .strokeBorder(Color.paneAccent.opacity(0.7), style: StrokeStyle(lineWidth: 2, dash: [7, 5]))
                    .padding(8)
                    .transition(.opacity)
                    .allowsHitTesting(false)
            }
        }
        .dropDestination(for: URL.self) { urls, _ in
            let made = context.importFiles(urls, into: scope == .trash ? .all : scope)
            if let first = made.first { selection = [first] }
            return !made.isEmpty
        } isTargeted: { t in
            withAnimation(.easeOut(duration: 0.15)) { fileDropTargeted = t }
        }
        #if os(iOS)
        // iOS 26 Notes and Mail: a full search field in the bottom bar, beside compose. As a
        // column (iPad, iPhone Duo open) at the column's top instead, as iPad does by itself:
        // in the open Duo's narrow list the bar's field was squeezed to "S…" (WideLayoutTests).
        .modifier(SystemSearch(text: typedSearch, placement: stacked ? .automatic : .navigationBarDrawer(displayMode: .always),
                               off: BarSearchField.drawn(besideNote: besideNote)))
        #else
        .safeAreaInset(edge: .top, spacing: 0) {
            if !searching {
                // Level with More and New Note beside the sidebar. With the sidebar hidden the
                // window's buttons take that row, and a row of its own made the band too tall, so
                // it fades with the slide (Emil, 7 November 2026).
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(Color.ink).lineLimit(1)
                    Text(Self.macCount(notes: scopedNotes.count, files: scopedFiles.count, results: searchResults, trash: scope == .trash))
                        .font(.system(size: 11)).foregroundStyle(Color.muted).monospacedDigit()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 20)
                .padding(.trailing, Self.islandRoom)
                .padding(.top, 4)
                .padding(.bottom, 6)
                .opacity(behindSetupCard ? 0.35 : 1)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("list.folderName")
                .offset(y: Self.nameLift)
                .frame(height: 0, alignment: .top)
                .opacity(listSidebarHidden ? 0 : 1)
                .accessibilityHidden(listSidebarHidden)
                .animation(Self.nameFade(hidden: listSidebarHidden, reduceMotion: NSWorkspace.shared.accessibilityDisplayShouldReduceMotion), value: listSidebarHidden)
            }
            if searching {
                ListSearchField(text: typedSearch, focus: searchFocus) { searching = false }
                    .padding(.horizontal, 12)
                    .padding(.top, 6)
                    .padding(.bottom, 8)
                    .background(Color(stacked ? Palette.listGround : Palette.page))
            }
        }
        // "Show all notes with …" from Go to Note (⌘O) carries the text to search for.
        .onReceive(NotificationCenter.default.publisher(for: .paneDeleteNotes)) { n in
            if let ids = n.object as? Set<UUID> { performRemove(ids) }
        }
        .onReceive(NotificationCenter.default.publisher(for: .paneSearchNotes)) { n in
            if let text = n.object as? String { search = text }
            searching = true
            searchFocus += 1
        }
        // The sidebar's Search button: opens the field, or closes it when it's open.
        .onReceive(NotificationCenter.default.publisher(for: .paneToggleSearch)) { _ in
            if searching {
                search = ""
                searching = false
            } else {
                searching = true
                searchFocus += 1
            }
        }
        #endif
        .navigationTitle(title)
        #if os(iOS)
        // The folder's name centred between back and •••, with the count small under it (Emil,
        // 29 October 2026; it was a large title with the count as the list's first line).
        .navigationBarTitleDisplayMode(.inline)
        .navigationSubtitle(Self.titleCount(notes: scopedNotes.count, files: scopedFiles.count, searching: !search.isEmpty, trash: scope == .trash) ?? "")
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
        .sharedDeleteConfirmation($pendingShared) { notes in performRemove(Set(notes.map(\.id))) }
        .confirmationDialog(foreverTitle, isPresented: Binding(get: { pendingForever != nil }, set: { if !$0 { pendingForever = nil } }), titleVisibility: .visible) {
            Button("Delete Forever", role: .destructive) {
                if let ids = pendingForever { performRemove(ids) }
                pendingForever = nil
                #if os(iOS)
                endEditing()
                #endif
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
        }
        #endif
        // Opened from the search: the note goes to the first line that holds it.
        .modifier(SearchJump.OnSelect(selection: selection, search: search))
        .toolbar {
            #if os(iOS)
            // Back on the left, the title in the middle, ••• on the right; new note beside Search at
            // the bottom (Emil, 29 October 2026). Select Notes in ••• (or a two-finger swipe) starts
            // selecting, as in Notes; Recently Deleted has Edit instead of •••. While selecting, a
            // checkmark ends it, where ••• or Edit was.
            if editMode.isEditing {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done", systemImage: "checkmark") { endEditing() }
                        .labelStyle(.iconOnly)
                        .fontWeight(.semibold)
                        .tint(.primary)
                        .accessibilityIdentifier("list.done")
                }
            } else if scope == .trash {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { startSelecting() }
                        .tint(.primary)
                        .disabled(scopedNotes.isEmpty && scopedFiles.isEmpty)
                        .accessibilityIdentifier("list.edit")
                }
            } else {
                // The list's own menu, in Notes' order (ListMoreMenu).
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        ForEach(ListMoreMenu.groups(asks: askSubject != nil && !ConnectedAIs.shared.targets.isEmpty), id: \.self) { group in
                            Section {
                                ForEach(group, id: \.self) { moreItem($0, empty: scopedNotes.isEmpty && scopedFiles.isEmpty) }
                            }
                        }
                    } label: {
                        Label("More", systemImage: "ellipsis")
                    }
                    .tint(.primary)
                    .accessibilityIdentifier("list.more")
                    .askAIPopover($asking, subject: askSubject ?? .all, recent: askRecent)
                }
            }
            if editMode.isEditing {
                // Recently Deleted, as in Notes: Move All and Delete All with nothing selected,
                // Move and Delete once something is. Elsewhere Move and Delete act on the selection.
                let trash = scope == .trash
                let titles = trash ? TrashEditBar.titles(selected: selection.count) : ("Move", selection.isEmpty ? "Delete" : "Delete (\(selection.count))")
                let all = Set(scopedNotes.map(\.id)).union(scopedFiles.map(\.id))
                let targets = trash && selection.isEmpty ? all : selection
                ToolbarItem(placement: .bottomBar) {
                    Button(titles.0) { moving = targets }
                        .disabled(targets.isEmpty)
                        // Never amber: the label colour, and Delete in the system red, as in Notes.
                        .tint(.primary)
                        .accessibilityIdentifier("list.moveSelected")
                }
                ToolbarSpacer(.flexible, placement: .bottomBar)
                ToolbarItem(placement: .bottomBar) {
                    // Out of Recently Deleted is for good: it asks first (remove).
                    Button(titles.1, role: .destructive) {
                        remove(targets)
                        if !trash { endEditing() }
                    }
                    .disabled(targets.isEmpty)
                    .tint(.red)
                    .accessibilityIdentifier("list.deleteSelected")
                }
            } else {
                // Search and New Note, as on the folders screen (SearchComposeBar). Recently Deleted
                // holds no new notes: the note it made went elsewhere.
                SearchComposeBar(newNote: onNewNote, hidesCompose: scope == .trash, tip: true, search: $search)
            }
            #else
            // One layout with the sidebar shown or hidden: anything that changed with the sidebar
            // made the bar rebuild mid-slide, and its buttons faded in from the wrong place. One
            // item, so one island like the note's own: as a group of two items macOS drew them
            // sometimes apart and sometimes together (Emil, 6 November 2026).
            ToolbarSpacer(.flexible)
            ToolbarItem {
                HStack(spacing: 0) {
                    listMore
                    // Compose sits with the list it adds to, as on the iPhone (Emil, 10-29). Not in
                    // Recently Deleted, which holds no new notes, like Notes.
                    if scope != .trash {
                        ListCompose(selected: selection.count == 1 ? selection.first : nil, newNote: onNewNote)
                    }
                }
                .labelStyle(.iconOnly)
            }
            #endif
        }
    }

    #if os(macOS)
    private var listMore: some View {
        Menu {
            ListOrderMenu(store: orderStore, scope: scope)
            Divider()
            Button("New Folder", systemImage: "folder.badge.plus") { NotificationCenter.default.post(name: .paneNewFolder, object: nil) }
            Button(ListMoreMenu.addFilesTitle(folder: context.folderNameForFiles(scope)), systemImage: "doc.badge.plus") { addingFiles = true }
                .disabled(scope == .trash)
                .accessibilityIdentifier("list.addFile")
            Divider()
            // One item: the sources, with their icons, are in the choice it opens.
            Button("Import…", systemImage: "square.and.arrow.down") { choosingImport = true }
                .accessibilityIdentifier("list.import")
            // Ask an AI about this folder, or every note, when one is connected.
            askItems
        } label: {
            Label("More", systemImage: "ellipsis")
        }
        .menuIndicator(.hidden)
        .tint(.primary)
        // A toolbar menu's label is drawn as a picture, so VoiceOver had no name (council round 15).
        .accessibilityLabel("List Options")
        .accessibilityIdentifier("list.more")
        .askAIPopover($asking, subject: askSubject ?? .all, recent: askRecent)
    }
    #endif

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
                // The system's prominent header: large and bold, as in Notes. No indent of its own:
                // it lines up with the large title, not with the rows' text (28 October 2026).
                if stacked {
                    Text(section.0)
                        .foregroundStyle(Color.ink)
                        .listRowInsets(.leading, 0)
                } else {
                    // As columns, the Mac's heading: small, semibold and muted, over the rows.
                    Text(section.0)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.muted)
                        .textCase(nil)
                }
                #else
                // As in Notes, a title over its notes: bright and semibold, not a small grey label
                // (Emil, 7 November 2026). In a 40 pt row like Notes' (NoteListGeometryTests).
                Text(section.0)
                    .font(.system(size: TextSize.interface(15), weight: .semibold))
                    .foregroundStyle(Color.ink)
                    .textCase(nil)
                    .padding(.top, NoteListView.headingTop)
                    .padding(.bottom, NoteListView.headingBottom)
                #endif
            }
        }
        #if os(iOS)
        .headerProminence(stacked ? .increased : .standard)
        #else
        // No rule under a heading, in every look; spacing does the work (Emil, 6 November 2026).
        .listSectionSeparator(.hidden)
        #endif
    }

    /// Room above and below a date heading's text: a 40 pt row with its letters where Apple
    /// Notes' are (13.5 pt down, 17 in from the column's edge, matched by their pixels).
    static let headingTop: CGFloat = 6.5
    static let headingBottom: CGFloat = 6.5

    #if os(macOS)
    /// How far the folder's name rises into the bar beside the sidebar: its middle level with
    /// More and New Note's.
    static let nameLift: CGFloat = -46
    /// Gone before the slide reaches the window's buttons, back once the sidebar has landed: it
    /// passed under the buttons otherwise.
    static func nameFade(hidden: Bool, reduceMotion: Bool) -> Animation? {
        if reduceMotion { return nil }
        return hidden ? .easeOut(duration: 0.06) : .easeIn(duration: 0.12).delay(0.2)
    }
    /// What it leaves for More and New Note in the bar.
    static let islandRoom: CGFloat = 104
    #endif

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
            #if os(iOS)
            rowMenu(for: note)
            #else
            menu(for: note, folders: foldersByName)
            #endif
        }
        .equatable()
        // On the row as the list holds it, where the list's selection finds it.
        .tag(id)
        #if os(iOS)
        // Beside the note, the open one in a warm grey (the list draws no selection there). Out
        // here: a background inside the equatable row doesn't reach the list.
        .listRowBackground(besideNote ? Color(openNotes?.ids.contains(id) == true ? Palette.openNoteRow : Palette.row) : nil)
        // A little more room either side inside the card (Emil, 28 October 2026); the hairline
        // between rows starts with the text.
        .listRowInsets(.horizontal, RowMetrics.sideInset)
        #endif
        #if os(macOS)
        // C and D: no hairlines between rows.
        .listRowSeparator(DesignLook.calmList ? .hidden : .automatic)
        #endif
    }

    /// What Ask an AI is about here (ListMoreMenu.askSubject).
    private var askSubject: AskAI.Subject? {
        ListMoreMenu.askSubject(scope, folderName: { context.folder($0)?.name })
    }

    /// Something in this folder (or any note, in All Notes) changed this week: the week questions
    /// are offered (AskAI.questions). Worked out when the popover opens.
    private var askRecent: Bool {
        switch scope {
        case .folder(let id): context.folder(id).map { AskAI.recent($0) } ?? true
        default: AskAI.recent(in: context)
        }
    }

    /// The Mac ••• menu's Ask an AI, after a line, when an AI is connected.
    @ViewBuilder private var askItems: some View {
        if let askSubject, !ConnectedAIs.shared.targets.isEmpty {
            Divider()
            AskAIMenuItems(subject: askSubject, targets: ConnectedAIs.shared.targets) { asking = $0 }
        }
    }

    #if os(iOS)
    /// A note's long-press menu (NoteRowMenu): Share, Move and Delete in a row, then the rest.
    @ViewBuilder
    private func rowMenu(for note: Note) -> some View {
        let groups = NoteRowMenu.groups(locked: note.isLocked, trashed: note.trashedAt != nil, shared: note.isShared)
        ForEach(Array(groups.enumerated()), id: \.offset) { i, group in
            if i == 0 && note.trashedAt == nil {
                ControlGroup { ForEach(group, id: \.self) { rowItem($0, note) } }
            } else {
                Section { ForEach(group, id: \.self) { rowItem($0, note) } }
            }
        }
    }

    @ViewBuilder
    private func rowItem(_ item: NoteRowMenu.Item, _ note: Note) -> some View {
        switch item {
        case .share:
            ShareLink(item: note.body, preview: SharePreview(note.title)) { Label("Share", systemImage: "square.and.arrow.up") }
                .accessibilityIdentifier("row.share")
        case .move:
            Button("Move", systemImage: "folder") { moving = [note.id] }
                .accessibilityIdentifier("row.move")
        case .delete:
            DestructiveMenuButton("Delete", systemImage: "trash") { remove(note) }
                .accessibilityIdentifier("row.delete")
        case .pin:
            Button(note.isPinned ? "Unpin Note" : "Pin Note", systemImage: note.isPinned ? "pin.slash" : "pin") {
                withAnimation(.snappy) { context.togglePin(note) }
            }
            .accessibilityIdentifier("row.pin")
        case .lock:
            Button("Lock Note", systemImage: "lock") { lockRequest = ListLockRequest(note: note.id, removing: false) }
                .accessibilityIdentifier("row.lock")
        case .removeLock:
            Button("Remove Lock", systemImage: "lock.open") { lockRequest = ListLockRequest(note: note.id, removing: true) }
                .accessibilityIdentifier("row.removeLock")
        case .duplicate:
            Button("Duplicate Note", systemImage: "plus.square.on.square") {
                withAnimation(.snappy) { _ = context.createNote(in: note.folder.map { .folder($0.id) } ?? .all, body: note.body) }
            }
            .accessibilityIdentifier("row.duplicate")
        case .recover:
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(note) } }
                .accessibilityIdentifier("row.recover")
        case .openInNewWindow, .history:
            // The Mac's (NoteRowMenu.macGroups).
            EmptyView()
        }
    }

    /// One item of the list's ••• menu (ListMoreMenu).
    @ViewBuilder
    private func moreItem(_ item: ListMoreMenu.Item, empty: Bool) -> some View {
        switch item {
        case .selectNotes:
            Button("Select Notes", systemImage: "checkmark.circle") { startSelecting() }
                .disabled(empty)
                .accessibilityIdentifier("list.selectNotes")
        case .sortBy, .groupByDate:
            // ListOrderMenu holds both; it is placed once, for Sort By.
            if item == .sortBy { ListOrderMenu(store: orderStore, scope: scope) }
        case .addFiles:
            // Files kept in the folder on their own, beside its notes: PDFs to read, photos, spreadsheets.
            Button(ListMoreMenu.addFilesTitle(folder: context.folderNameForFiles(scope)), systemImage: "doc.badge.plus") { addingFiles = true }
                .accessibilityIdentifier("list.addFile")
        case .askAI:
            if let askSubject { AskAIMenuItems(subject: askSubject, targets: ConnectedAIs.shared.targets) { asking = $0 } }
        }
    }

    private func startSelecting() {
        withAnimation(.snappy(duration: 0.25)) {
            selection = []
            editMode = .active
        }
    }

    private func endEditing() {
        withAnimation(.snappy(duration: 0.25)) {
            editMode = .inactive
            selection = []
        }
    }

    /// The folder every note being moved is in, if they share one.
    private var movingFrom: UUID? {
        let folders = Set((moving ?? []).map { id in context.note(id)?.folder?.id ?? context.attachment(id)?.folderID })
        guard folders.count == 1, let only = folders.first,
              (moving ?? []).allSatisfy({ context.note($0)?.trashedAt == nil && context.attachment($0)?.trashedAt == nil }) else { return nil }
        return only
    }

    /// "Did you know" for what isn't a button here, as a row at the top of the list.
    private var listTip: some View {
        // One grouped card, like What's new: the tip is the row, on the row's own surface.
        Section { CompactTip(tip: ShareExtensionTip(), card: false).selectionDisabled() }
            .listRowBackground(stacked ? Color(Palette.row) : nil)
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

    /// ambernotes.app/open/connect-ai from an email: Settings, at AI. On iPhone that page lists what
    /// is connected and says where to connect one; it connects nothing itself.
    private func openConnectAI(_ place: AppPlace?) {
        guard place == .connectAI else { return }
        AppPlaceCenter.shared.pending = nil
        SettingsRoute.shared.open(.ai)
        #if os(iOS)
        showSettings = true
        #endif
    }

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
        } else if case .tag(let name) = scope {
            // The last note with the tag lost it (or went to Recently Deleted).
            ContentUnavailableView("No Notes", systemImage: "number", description: Text("No notes have #\(name)."))
        } else if Self.offersWaysToStart(scope: scope) {
            // Nothing in the whole library (a new account, or one whose first run didn't come):
            // the two ways to start, in place (newcomer audit #19), New Note the one in the accent.
            // Words only, like Notes (Emil, 11-03: no app icon on the empty states).
            ContentUnavailableView {
                Text("No Notes")
            } description: {
                Text(Self.emptyLine)
            } actions: {
                // Side by side, or one above the other when the column is too narrow for both
                // (Emil, 3 November 2026: Bring Your Notes ran past the column's edge).
                EmptyLibraryActions(onNewNote: onNewNote, imports: imports)
            }
        } else {
            // "No Notes", and the one way to start one here (council round 16: the note pane said
            // "No note selected" beside it, with its own New Note). The note pane stays blank.
            ContentUnavailableView {
                Text("No Notes")
            } actions: {
                Button("New Note", action: onNewNote)
                    .buttonStyle(.secondary)
                    .accessibilityIdentifier("list.empty.newNote")
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
        DestructiveMenuButton(note.trashedAt == nil ? "Delete" : "Delete Forever…", systemImage: "trash") { remove(note) }
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
                DestructiveMenuButton("Delete \(notes.count) Notes Forever…", systemImage: "trash") { remove(ids) }
            } else {
                Menu("Move \(notes.count) Notes to", systemImage: "folder") {
                    FolderMenuItems(folders: folders, current: nil) { f in withAnimation(.snappy) { _ = context.move(notes, to: f, undo: undoManager) } }
                }
                Divider()
                DestructiveMenuButton("Delete \(notes.count) Notes", systemImage: "trash") { remove(ids) }
            }
        }
    }

    /// A note's right-click menu and its ••• on the Mac (NoteRowMenu.macGroups), in groups.
    @ViewBuilder
    private func menu(for note: Note, folders: [Folder]) -> some View {
        let groups = NoteRowMenu.macGroups(locked: note.isLocked, trashed: note.trashedAt != nil, shared: note.isShared)
        ForEach(Array(groups.enumerated()), id: \.offset) { i, group in
            if i > 0 { Divider() }
            ForEach(group, id: \.self) { macItem($0, note, folders: folders) }
        }
    }

    @ViewBuilder
    private func macItem(_ item: NoteRowMenu.Item, _ note: Note, folders: [Folder]) -> some View {
        switch item {
        case .openInNewWindow:
            Button(NoteWindows.openNoteTitle, systemImage: NoteWindows.symbol) { NoteWindows.open(note: note.id, with: openWindow) }
                .accessibilityIdentifier("row.openInNewWindow")
        case .pin:
            Button(note.isPinned ? "Unpin Note" : "Pin Note", systemImage: note.isPinned ? "pin.slash" : "pin") {
                withAnimation(.snappy) { context.togglePin(note) }
            }
        case .lock:
            Button("Lock Note", systemImage: "lock") { lockRequest = ListLockRequest(note: note.id, removing: false) }
                .accessibilityIdentifier("row.lock")
        case .removeLock:
            Button("Remove Lock", systemImage: "lock.open") { lockRequest = ListLockRequest(note: note.id, removing: true) }
                .accessibilityIdentifier("row.removeLock")
        case .duplicate:
            Button("Duplicate Note", systemImage: "plus.square.on.square") {
                let copy = context.createNote(in: note.folder.map { .folder($0.id) } ?? .all, body: note.body)
                selection = [copy.id]
            }
        case .share:
            ShareLink(item: note.body, preview: SharePreview(note.title))
        case .move:
            Menu("Move to", systemImage: "folder") {
                FolderMenuItems(folders: folders, current: note.folder?.id) { f in withAnimation(.snappy) { _ = context.move([note], to: f, undo: undoManager) } }
            }
        case .history:
            // The note's own Version History: the note opens and shows it (AppPlaceCenter).
            Button(NoteMoreMenu.historyTitle, systemImage: "clock.arrow.circlepath") {
                selection = [note.id]
                AppPlaceCenter.shared.historyFor = note.id
            }
            .accessibilityIdentifier("row.history")
        case .recover:
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(note) } }
        case .delete:
            deleteButton(note)
        }
    }

    @ViewBuilder
    private func menu(for file: Attachment, folders: [Folder]) -> some View {
        if file.trashedAt != nil {
            Button("Recover", systemImage: "arrow.uturn.backward") { withAnimation(.snappy) { context.restore(file) } }
            DestructiveMenuButton("Delete Forever…", systemImage: "trash") { remove([file.id]) }
        } else {
            Button("Rename…", systemImage: "pencil") {
                fileNameDraft = FolderFileName.stem(file.filename)
                renamingFile = file
            }
            Menu("Move to", systemImage: "folder") {
                FolderMenuItems(folders: folders, current: file.folderID) { f in withAnimation(.snappy) { context.move(file, to: f) } }
            }
            if FileStore.exists(file) {
                ShareLink(item: FileStore.url(for: file.id, filename: file.filename))
                Button(FileOut.exportTitle, systemImage: FileOut.exportSymbol) { exportingFile = file }
            }
            Divider()
            DestructiveMenuButton("Delete", systemImage: "trash") { remove([file.id]) }
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
            DestructiveMenuButton("Delete \(count) Items Forever…", systemImage: "trash") { remove(ids) }
        } else {
            Menu("Move \(count) Items to", systemImage: "folder") {
                FolderMenuItems(folders: folders, current: nil) { f in withAnimation(.snappy) { move(ids, to: f) } }
            }
            Divider()
            DestructiveMenuButton("Delete \(count) Items", systemImage: "trash") { remove(ids) }
        }
    }

    /// Moves notes and files together.
    private func move(_ ids: Set<UUID>, to folder: Folder) {
        context.move(ids.compactMap { context.note($0) }, to: folder, undo: undoManager)
        for f in ids.compactMap({ context.attachment($0) }) where f.folderID != nil { context.move(f, to: folder) }
    }

    /// Dragging a selected note carries the whole selection; any other note goes alone (nil).
    private func dragOthers(for id: UUID) -> [UUID]? {
        guard selection.count > 1, selection.contains(id) else { return nil }
        return selection.filter { $0 != id }.sorted { $0.uuidString < $1.uuidString }
    }

    private func remove(_ note: Note) { remove([note.id]) }

    /// Deletes the notes and, if the open note was among them, selects its neighbour like Notes.
    /// Deleting from Recently Deleted can't be undone, so it asks first; anything else goes
    /// to Recently Deleted straight away, which is its own undo.
    private func remove(_ ids: Set<UUID>) {
        let forever = ids.compactMap { context.note($0) }.contains { $0.trashedAt != nil }
            || ids.compactMap { context.attachment($0) }.contains { $0.trashedAt != nil }
        if forever { pendingForever = ids }
        // A shared note asks first: people lose it, or it leaves your notes.
        else if SharedDelete.ask(ids.compactMap { context.note($0) }) != nil { pendingShared = ids.compactMap { context.note($0) } }
        else { performRemove(ids) }
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
        let rest = ordered.filter { !ids.contains($0.id) }
        let next: Set<UUID> = firstIndex.flatMap { i in rest.isEmpty ? nil : [rest[min(i, rest.count - 1)].id] } ?? []
        let choose = $selection
        // The row slides out; the next note opens at once, as in Notes. Inside the animation the
        // note side cross-faded too, and the next note showed a quarter of a second late (Emil,
        // 12 November 2026: "it feels like it takes a second before it gets deleted").
        if touchedSelection { withTransaction(Self.immediate) { selection = next } }
        withAnimation(.snappy(duration: 0.25)) {
            context.remove(notes, undo: undoManager, reopen: { back in selection = Set(back.map(\.id)) },
                           gone: touchedSelection ? { choose.wrappedValue = next } : nil)
            context.remove(files: files)
        }
    }

    /// A change shown on the next frame, with no animation.
    static var immediate: Transaction {
        var t = Transaction()
        t.disablesAnimations = true
        return t
    }
}

/// The list is the same list while it shows the same folder: the selection reaches it through its
/// binding, and the action is the same action. Hiding or showing the sidebar hands the split
/// view's columns over again, and without this the list was worked out again on every toggle.
#if os(macOS)
/// The list's New Note. While the note open is an untouched new one, New Note would only put the
/// cursor back in it (RootView.newNote), so it is off, and looks it: the pencil greyed, as a
/// disabled toolbar button is (Emil, 2 November 2026). A view of its own: it reads the open note's
/// text, and only it is worked out again as that note is written in.
struct ListCompose: View {
    let selected: UUID?
    let newNote: () -> Void
    @Environment(\.modelContext) private var context

    var body: some View {
        let off = Self.isOff(selected: selected, in: context)
        ComposeButton(newNote: newNote, off: off) {
            // The pencil pokes out top-right; ToolbarGlyph re-centres its ink.
            Label { Text("New Note") } icon: {
                ToolbarGlyph.image("square.and.pencil", shift: ToolbarGlyph.composeShift)
                    .foregroundStyle(Self.iconStyle(off: off))
            }
        }
        .disabled(off)
        .help(off ? "This note is new and empty" : "New Note (⌘N). Click and hold for New App.")
        .accessibilityLabel("New Note")
        .newAppTip()
        // The menu bar's quick capture is the other way to start a note.
        .paneTip(MenuBarTip(), arrowEdge: .top)
        .accessibilityIdentifier("list.newNote")
    }

    /// Off on an untouched new note: one that is empty and not in Recently Deleted.
    @MainActor static func isOff(selected: UUID?, in context: ModelContext) -> Bool {
        guard let selected, let note = context.note(selected) else { return false }
        return note.body.isEmpty && note.trashedAt == nil && note.deletedAt == nil
    }

    static func iconStyle(off: Bool) -> HierarchicalShapeStyle { off ? .tertiary : .primary }
}
#endif

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

    /// The folder (or tag) shown: another one starts at its top.
    var scope: Scope? = nil

    init(selected: UUID?, scope: Scope? = nil, row: @escaping (UUID) -> Int?) {
        self.selected = selected
        self.scope = scope
        self.row = row
    }

    /// This list's table, found once the list is in a window.
    @State private var finder = TableFinder.Probe()
    /// Counts the asks to show the selected row again.
    @State private var revealAsked = 0

    func body(content: Content) -> some View {
        content
            .background(TableFinder(probe: finder))
            .onAppear {
                let at = selected.flatMap(row)
                // A turn later: the rows are there by then. Only when the row is out of view: a
                // list centred on a row it already showed slid its first notes under the toolbar's
                // blur, a smudge at rest (round 15, two judges of the quiet.md comparison).
                DispatchQueue.main.async {
                    if let at, at >= Self.firstRows { finder.reveal(row: at) }
                }
            }
            // Another folder: the same table with other rows, shown as a new list was, from its
            // top, or at the open note's row when it's in this list too (All Notes).
            .onChange(of: scope) {
                finder.toTop()
                if let at = selected.flatMap(row), at >= Self.firstRows { finder.reveal(once: at) }
            }
            // A note opened from elsewhere (a link, search, the menu bar) whose row is off screen:
            // the list comes to it, as Notes' does. A row already in view stays where it is.
            .onChange(of: selected) { _, new in
                guard let at = new.flatMap(row) else { return }
                DispatchQueue.main.async { finder.reveal(row: at) }
            }
            // A version restored moves the note to the top of the list: the list goes with it
            // (round 20: the selected row was off screen after Restore This Version).
            .onReceive(NotificationCenter.default.publisher(for: .paneVersionRestored)) { n in
                guard let id = n.object as? UUID, id == selected else { return }
                // Once the list has its new order: `row` here is the one from before it.
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { revealAsked &+= 1 }
            }
            // A note that an edit, a restore or an Undo sent along the list: the list goes with it
            // (round 21 up; round 23 down: Undo of a move left Lisbon cut by the window's foot). Not
            // for a row that shifted because of another note: someone reading further down stays there.
            .onChange(of: selected.flatMap(row)) { old, new in
                guard let old, let new, abs(new - old) > 1 else { return }
                DispatchQueue.main.async { finder.reveal(row: new) }
            }
            .onChange(of: revealAsked) {
                guard let at = selected.flatMap(row) else { return }
                DispatchQueue.main.async { finder.reveal(row: at) }
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

            /// `reveal`, once the table has the row: the table takes another folder's rows when
            /// it next lays out, which can be a turn or two after the list's update.
            func reveal(once row: Int, turns: Int = 10) {
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    if let table = self.find(), row < table.numberOfRows { self.reveal(row: row) }
                    else if turns > 0 { self.reveal(once: row, turns: turns - 1) }
                }
            }

            /// Back to the list's top, its first row just under the toolbar.
            func toTop() {
                guard let table = find(), let scroll = table.enclosingScrollView else { return }
                let clip = scroll.contentView
                let top = -scroll.contentInsets.top
                guard clip.bounds.minY != top else { return }
                clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: top))
                scroll.reflectScrolledClipView(clip)
            }

            /// Centres `row` when any of it is out of view (under the toolbar or past the foot).
            func reveal(row: Int) {
                guard let table = find(), row < table.numberOfRows, let scroll = table.enclosingScrollView else { return }
                let clip = scroll.contentView.bounds
                let insets = scroll.contentInsets
                // The heading pinned at the top covers what's under it.
                let band = table.numberOfRows > 0 ? table.rect(ofRow: 0).height : 0
                let shown = CGRect(x: clip.minX, y: clip.minY + insets.top + band, width: clip.width, height: clip.height - insets.top - insets.bottom - band)
                if ShowsSelectedRow.needsReveal(table.rect(ofRow: row), shown: shown) { center(row: row) }
            }

            /// Centres `row` in what shows of the table, if it has that row. The list's top is at
            /// minus its top inset (under the toolbar): a list scrolled to 0 hid its first row and
            /// a half under the toolbar.
            func center(row: Int) {
                guard let table = find(), row < table.numberOfRows, let scroll = table.enclosingScrollView else { return }
                let clip = scroll.contentView
                let rect = table.rect(ofRow: row)
                let insets = scroll.contentInsets
                let top = -insets.top
                let bottom = max(top, table.bounds.height - clip.bounds.height + insets.bottom)
                let centred = min(max(top, rect.midY - (clip.bounds.height + insets.top - insets.bottom) / 2), bottom)
                // On a row's edge, so no half row shows under the heading pinned at the top.
                let near = max(0, table.row(at: NSPoint(x: 1, y: centred + insets.top + 1)) - 1)
                let rows = Array(near..<min(table.numberOfRows, near + 6))
                let frames = rows.map { table.rect(ofRow: $0) }
                // Every section starts with its heading, so row 0 is one: the pinned band's height.
                let band = table.numberOfRows > 0 ? table.rect(ofRow: 0).height : 0
                // SwiftUI's list doesn't answer the delegate's question, and asking for row views
                // would build them off screen; a heading has the height row 0 has (round 20: every
                // launch stopped with "Yesterday" under the pinned "Today", an empty group by the look of it).
                let headings = rows.indices.map { i in
                    (table.delegate?.tableView?(table, isGroupRow: rows[i]) ?? false) || abs(frames[i].height - band) < 1
                }
                let y = min(max(top, ShowsSelectedRow.snapped(centred, topInset: insets.top, rows: frames, headings: headings, band: band)), bottom)
                clip.scroll(to: NSPoint(x: clip.bounds.origin.x, y: y))
                scroll.reflectScrolledClipView(clip)
            }
        }
    }

    /// A scroll offset moved up to a row's edge: the first row under the pinned section heading
    /// starts right where the heading ends (council, 11-04: a centred row left half a row showing
    /// under "Today"). `rows` are consecutive rows' frames from just above the top edge, `headings`
    /// says which are section headings, `band` is the pinned heading's height. A heading at the
    /// top sits there whole.
    static func snapped(_ y: CGFloat, topInset: CGFloat, rows: [CGRect], headings: [Bool], band: CGFloat) -> CGFloat {
        let edge = y + topInset
        guard let i = rows.firstIndex(where: { $0.maxY > edge + 0.5 }) else { return y }
        if headings.indices.contains(i), headings[i] { return rows[i].minY - topInset }
        // The pinned heading covers the band under the edge: put a row's top at its foot.
        guard let j = rows.firstIndex(where: { $0.maxY > edge + band + 0.5 }) else { return y }
        if headings.indices.contains(j), headings[j] { return rows[j].minY - topInset }
        return rows[j].minY - band - topInset
    }

    /// Whether a row needs scrolling to: any part of it outside what shows.
    static func needsReveal(_ row: CGRect, shown: CGRect) -> Bool {
        row.minY < shown.minY - 0.5 || row.maxY > shown.maxY + 0.5
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
    /// Drives just the list's removal animation, separately from the editor's selection.
    private(set) var discardedEmptyNotes = 0

    func discardEmpty(_ note: Note, in context: ModelContext) {
        discardedEmptyNotes += 1
        context.purge(note)
    }

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
            // Only the list's own context, which saves on the main thread. A context made on
            // another thread can take a freed context's address and so match `object` (a test's
            // library written off the main thread crashed here).
            guard Thread.isMainThread else { return }
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

    /// Each folder's notes as its list shows them: the live ones.
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
        var counts: [UUID: Int] = [:]
        var live = 0, trashed = 0
        for e in sorted where !e.deleted {
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
#if os(macOS)
/// Rows are worked out again when the interface's size changes.
struct FollowsTextSize: ViewModifier {
    @AppStorage(TextSize.key) private var stored: Double = 0
    func body(content: Content) -> some View { content.id(TextSize.interfaceScale(stored: stored)) }
}
#endif

/// What follows the pointer when a note is dragged: its name on a solid chip. (The Mac's drag draws
/// this offscreen, where a glass capsule and a Label's text came out as a lone icon.)
struct NoteDragPreview: View {
    let title: String
    let symbol: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: symbol).font(.system(size: 12)).foregroundStyle(.secondary)
            Text(title).font(.system(size: 13, weight: .semibold)).lineLimit(1).foregroundStyle(.primary)
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .frame(maxWidth: 220, alignment: .leading)
        .fixedSize()
        .background(Color(Palette.page), in: .rect(cornerRadius: 9))
        .overlay { RoundedRectangle(cornerRadius: 9).strokeBorder(.secondary.opacity(0.35), lineWidth: 1) }
    }
}

enum RowMetrics {
    /// iPhone: the room either side of a row's text inside its card.
    static let sideInset: CGFloat = 20
    #if os(macOS)
    // Against Apple Notes on macOS 26 (owner, 2026-10-12: "a bit less overwhelming"): the second
    // line a size smaller than the title. The rows are Apple's, read through Accessibility in a
    // 237 pt column: 68 pt with a folder line (its lines centred 16, 34.5 and 52.5 pt down) and
    // 56 without (the title's line where Apple's is, 20 pt down); the text 34 pt in from the
    // row's edge. Apple's date line sits 2 pt closer to the title in a row without a folder line;
    // here it keeps the folder rows' gap (owner: "the note title and subtitle needs a bit of
    // spacing"). The list adds 4 pt above and below a row and 16 at its left
    // (NoteListGeometryTests).
    static var title: Font { .system(size: TextSize.interface(13), weight: .bold) }
    static var detail: Font { .system(size: TextSize.interface(12)) }
    /// C and D: the folder line, a size under the detail.
    static var folder: Font { .system(size: TextSize.interface(11)) }
    /// C and D: room the hairlines used to give, as air above and below each row.
    static var calmAir: CGFloat { DesignLook.calmList ? 3 : 0 }
    static let spacing: CGFloat = 3
    /// The title's start past the list's own 16 pt: 26 pt in from the row's edge, 16 inside the
    /// selected card. Apple Notes has 34; on the card that read as padded (Emil, 2 November 2026).
    /// The room in front of the title holds the row's status: a lock, the unread dot, shared or a
    /// pin (NoteRowStatus).
    static let leading: CGFloat = 10
    /// Room above and below a row's lines: less when it has a third line, its folder.
    static func top(folderLine: Bool) -> CGFloat { folderLine ? 4 : 7 }
    static func bottom(folderLine: Bool) -> CGFloat { folderLine ? 4 : 7 }
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
    #if os(iOS)
    @Environment(\.stackedNotes) private var stacked
    #endif
    @Environment(\.modelContext) private var context

    static func == (a: NoteListItem, b: NoteListItem) -> Bool {
        a.entry.pid == b.entry.pid && a.entry.same(as: b.entry) && a.query == b.query && a.showFolder == b.showFolder
            && a.datedByCreation == b.datedByCreation && a.dragWith == b.dragWith && (a.dragWith == nil || a.selectedCount == b.selectedCount)
            && a.quiet == b.quiet && a.top == b.top
    }

    var body: some View {
        #if DEBUG || QA
        let _ = RenderProbe.count("NoteListItem")
        #endif
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
                // Long-press: the note itself as a tall card, its menu under it (Apple Notes).
                // Its icons in the label colour, Delete in red, as in Notes (not the app's amber).
                .contextMenu { menu(note).tint(.primary) } preview: { NotePreviewCard(note: note) }
                // As columns on cards, a warm grey for the open note (the grouped list's own was a
                // cold blue-grey, edge to edge).
                .listRowBackground(stacked ? Color(Palette.row) : nil)
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
        // Every pinned note in the list is under its Pinned heading, which says so: no pin before the title.
        NoteRow(note: note, query: query, showFolder: showFolder, datedByCreation: datedByCreation, pinnedHeading: true)
            // The row's full width, so the ••• over it sits at the row's right edge, not at the end
            // of a short title (Emil, 2 November 2026). Before the drag, so the whole row drags.
            .frame(maxWidth: .infinity, alignment: .leading)
            #if os(macOS)
            // Empty space takes no press without a shape: only the words and the picture dragged
            // (Emil, 7 November 2026). Out to the card's edges, past the row's own insets.
            .contentShape(Rectangle().inset(by: -6))
            #endif
            .draggable(PaneDragItem(kind: .note, id: note.id, others: dragWith)) {
                NoteDragPreview(title: dragWith != nil ? "\(selectedCount) Notes" : note.title, symbol: dragWith != nil ? "doc.on.doc" : "note.text")
            }
            .swipeActions(edge: .leading) {
                if note.trashedAt == nil {
                    Button(note.isPinned ? "Unpin" : "Pin", systemImage: note.isPinned ? "pin.slash" : "pin", action: togglePin)
                        .tint(.orange)
                }
            }
            .swipeActions(edge: .trailing) {
                Button(note.trashedAt == nil ? "Delete" : "Delete Forever…", systemImage: "trash", role: .destructive, action: remove)
                    .destructiveTint()
            }
    }
}

struct NoteRow: View {
    let note: Note
    var query: String = ""
    var showFolder = false
    /// The list is sorted by date created: the row shows that date, as Apple Notes does.
    var datedByCreation = false
    /// The row sits under the list's Pinned heading, which says it's pinned: no pin before its
    /// title (NoteRowStatus). Search on the folders screen has no heading, so its pinned rows show one.
    var pinnedHeading = false

    /// The date the row shows: the one the list is sorted by, which is the date edited unless
    /// the list is sorted by date created.
    static func shownDate<Item: DatedListItem>(of item: Item, byCreation: Bool) -> Date { byCreation ? item.listCreated : item.listDate }

    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(SyncEngine.self) private var sync: SyncEngine?
    @Environment(\.sidebarStudy) private var study
    private var ink: Color { .ink }
    private var muted: Color { .muted }

    /// Whether the row has its third line, the note's folder.
    private var folderLine: Bool { showFolder && note.folder != nil }

    var body: some View {
        #if DEBUG || QA
        let _ = RenderProbe.count("NoteRow", context: note.modelContext)
        #endif
        let title = note.title
        // Shared by link, by this account (the share's tag verified): a small link, like Notes.
        let shared = sync?.liveShares[note.id] != nil && !note.isLocked && note.trashedAt == nil
        // At the accessibility text sizes the row stacks and wraps instead of truncating.
        let large = typeSize.isAccessibilitySize
        let calm = DesignLook.calmList && !large
        let detail = large ? AnyLayout(VStackLayout(alignment: .leading, spacing: 2)) : AnyLayout(HStackLayout(spacing: calm ? 5 : 8))
        let ai = AIEdit.isUnseen(note) ? note.aiEditor : nil
        // The room before the title: a lock, the unseen AI dot, shared or a pin, one at a time.
        let status = NoteRowStatus.of(note, aiUnseen: ai != nil, pinnedHeading: pinnedHeading)
        let app = NoteAppMark.has(note)
        let picture = Self.picture(of: note)
        let found = self.found
        return HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: RowMetrics.spacing) {
                HStack(spacing: 5) {
                    Text(title)
                        .font(RowMetrics.title)
                        .tracking(DesignLook.isCandidate ? -0.15 : 0)
                        .foregroundStyle(ink)
                        .lineLimit(large ? 3 : 1)
                    if app {
                        AppMarkView(size: RowMetrics.markSize)
                            .accessibilityIdentifier("note.app")
                    }
                    // The study (`SidebarStudy`): the AI that made or last changed the note, for good.
                    if study != nil, let made = note.aiEditor, made != AIGlyph.page {
                        AIGlyph(ai: made, size: 12)
                            .accessibilityLabel(SidebarAIWords.madeBy(made))
                            .accessibilityIdentifier("note.madeBy")
                    }
                }
                // The mark sits in the room before the title, on its line, as the lock does in
                // Apple Notes' list; every title still starts at the same place.
                .overlay(alignment: .leading) {
                    if let status {
                        NoteRowStatusMark(status: status)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                detail {
                    HStack(spacing: 4) {
                        if shared {
                            Image(systemName: "link")
                                .imageScale(.small)
                                .foregroundStyle(muted)
                                .accessibilityHidden(true)
                                .accessibilityIdentifier("note.shared")
                        }
                        Text(DateBucket.rowDate(Self.shownDate(of: note, byCreation: datedByCreation)))
                            .monospacedDigit()
                            .foregroundStyle(ink.opacity(0.85))
                    }
                    // Never wrapped or cut: the preview gives way first ("10:10 A / M" beside a
                    // picture, 11-01).
                    .lineLimit(1)
                    .fixedSize()
                    .accessibilityIdentifier("note.date")
                    // C and D: "date · preview", one quiet line under the title.
                    if calm { Text("·").foregroundStyle(muted).accessibilityHidden(true) }
                    if note.isLocked {
                        // Like Notes: the date and "Locked", nothing of the text. The lock is
                        // before the title (NoteRowStatus). VoiceOver hears it once, in the value.
                        Text("Locked")
                            .foregroundStyle(muted)
                            .lineLimit(1)
                            .accessibilityHidden(true)
                    } else if let first = found?.lines.first {
                        // Searching: the first line that holds the text, the text in bold.
                        SearchLines.text(first, rest: muted)
                            .lineLimit(large ? 2 : 1)
                    } else if let ai {
                        HStack(spacing: 4) {
                            AIGlyph(ai: ai, size: 11)
                            Text(AIEdit.listLine(note, by: ai))
                        }
                        .foregroundStyle(Color.amberInk)
                        .lineLimit(1)
                    } else {
                        Text(note.preview)
                            .foregroundStyle(muted)
                            .lineLimit(large ? 2 : 1)
                    }
                }
                .font(RowMetrics.detail)
                // Every line that holds it, up to three, then how many more (SearchLines).
                if let found, found.lines.count > 1 || found.more > 0 {
                    VStack(alignment: .leading, spacing: RowMetrics.spacing) {
                        ForEach(Array(found.lines.dropFirst().enumerated()), id: \.offset) { _, line in
                            SearchLines.text(line, rest: muted).lineLimit(large ? 2 : 1)
                        }
                        if found.more > 0 {
                            Text(SearchLines.moreLine(found.more))
                                .foregroundStyle(muted)
                                .accessibilityIdentifier("note.moreMatches")
                        }
                    }
                    .font(RowMetrics.detail)
                }
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
                    .foregroundStyle(muted)
                }
            }
            // The note's first picture at the row's end, as Notes shows it.
            if let picture {
                Spacer(minLength: 0)
                FileThumbnail(file: picture, side: RowMetrics.thumbnail, iconWhileLoading: false)
                    .accessibilityIdentifier("note.thumbnail")
            }
        }
        .padding(.top, RowMetrics.top(folderLine: folderLine) + RowMetrics.calmAir)
        .padding(.bottom, RowMetrics.bottom(folderLine: folderLine) + RowMetrics.calmAir)
        .padding(.leading, RowMetrics.leading)
        .accessibilityElement(children: .combine)
        // Shared once, whether with people (its mark, even while the AI dot has its place) or by a
        // link (the link by the date).
        .accessibilityValue([note.isPinned ? "Pinned" : nil, app ? "App" : nil, shared || (note.isShared && note.trashedAt == nil) ? "Shared" : nil, note.isLocked ? "Locked" : nil,
                             ai.map { AIEdit.listLine(note, by: $0) }].compactMap { $0 }.joined(separator: ", "))
        .accessibilityIdentifier("note.\(title)")
    }

    /// The note's first picture, when it's on this device: one on the server only shows once the
    /// note is opened and fetches it. None for a locked note.
    static func picture(of note: Note) -> Attachment? {
        guard !note.isLocked, let id = note.firstImageID, let file = note.modelContext?.attachment(id),
              file.deletedAt == nil, file.isImage, FileStore.exists(file) else { return nil }
        return file
    }

    /// With a search, the lines that hold it in place of the preview: up to three, then how many
    /// more. None for a locked note (its text is sealed), or when only the title holds it.
    private var found: SearchLines.Found? {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty, !note.isLocked else { return nil }
        return SearchLines.find(in: note.body, query: q, skipping: note.title, lead: SearchLines.rowLead)
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
                // Always the row's top right corner, on the title's line, whatever the row holds
                // (ListRow fills the row's width, so the ••• is at its edge, not after the text).
                .overlay(alignment: .topTrailing) {
                    HoverSwap(on: hovering, help: "Note options") { EmptyView() } items: { items() }
                        .padding(.top, top)
                }
                #endif
        }
    }
}

#if os(macOS)
extension Notification.Name {
    /// Opens the notes search at the top of the list (the list's Search button, ⌘F). From Go to
    /// Note (⌘O), `object` is the text to search for.
    static let paneSearchNotes = Notification.Name("pane.searchNotes")
    /// The Mac sidebar's Search button: open the list's search field, or close it if open.
    static let paneToggleSearch = Notification.Name("pane.toggleSearch")
}

/// The list's search field: the system's search field, so it looks and behaves like Mail's and
/// Notes'. Escape, or leaving it empty, closes it.
struct ListSearchField: NSViewRepresentable {
    @Binding var text: String
    /// A new value puts the keys in the field.
    let focus: Int
    let close: () -> Void

    func makeNSView(context: Context) -> NSSearchField {
        let field = NSSearchField()
        field.placeholderString = "Search"
        field.sendsSearchStringImmediately = true
        field.delegate = context.coordinator
        field.setAccessibilityIdentifier("list.search")
        // The system ring takes the app's amber accent; the field's own fill and caret show focus.
        field.focusRingType = .none
        return field
    }

    func updateNSView(_ field: NSSearchField, context: Context) {
        context.coordinator.parent = self
        if field.stringValue != text { field.stringValue = text }
        if context.coordinator.focused != focus {
            context.coordinator.focused = focus
            // A turn later: the field has only just been put in the window.
            DispatchQueue.main.async { field.window?.makeFirstResponder(field) }
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, NSSearchFieldDelegate {
        var parent: ListSearchField
        var focused: Int?
        init(_ parent: ListSearchField) { self.parent = parent }

        func controlTextDidChange(_ note: Notification) {
            guard let field = note.object as? NSSearchField else { return }
            parent.text = field.stringValue
        }

        /// Clicking elsewhere with nothing typed puts the field away; with a search it stays.
        func controlTextDidEndEditing(_ note: Notification) {
            guard let field = note.object as? NSSearchField, field.stringValue.isEmpty else { return }
            parent.close()
        }

        func control(_ control: NSControl, textView: NSTextView, doCommandBy selector: Selector) -> Bool {
            // Escape clears the search and closes the field in one press.
            guard selector == #selector(NSResponder.cancelOperation(_:)) else { return false }
            parent.text = ""
            parent.close()
            return true
        }
    }
}
#endif

/// The empty library's two ways to start: side by side, or one above the other when the column
/// is too narrow for both (Emil, 3 November 2026: Bring Your Notes ran past the column's edge).
struct EmptyLibraryActions: View {
    let onNewNote: () -> Void
    let imports: ImportActions?

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: 12) { buttons }
            VStack(spacing: 10) { buttons }
        }
    }

    @ViewBuilder
    private var buttons: some View {
        Button("New Note", action: onNewNote)
            .buttonStyle(.amberProminent)
            .fixedSize()
            .accessibilityIdentifier("empty.newNote")
        if let imports {
            // In the ink: one orange control on the screen. On the Mac it opens the choice of
            // sources, as Import notes in the sidebar does, not Apple Notes' import alone.
            Button(NoteListView.bringNotes) {
                #if os(macOS)
                NotificationCenter.default.post(name: .paneImportNotes, object: nil)
                #else
                imports.appleNotes()
                #endif
            }
            .tint(Color.ink)
            .fixedSize()
            .accessibilityIdentifier("empty.bringNotes")
        }
    }
}

#if os(iOS)
/// The notes list's style: grouped cards one screen at a time (iPhone), the Mac's plain list as a
/// column beside the note (iPad, iPhone Duo open).
private struct ColumnListStyle: ViewModifier {
    let cards: Bool
    func body(content: Content) -> some View {
        // The sidebar style for its rounded selection pill, the Mac's; no lines between rows.
        if cards { content.listStyle(.insetGrouped) } else { content.listStyle(.sidebar).listRowSeparator(.hidden) }
    }
}
#endif

/// A note opened from a search (the list's, or Go to Note) opens at the first line that holds it,
/// with the match flashed on the Mac, as Notes does (persona council round 2). The search hands
/// over the note and the words; the note screen takes them once its text is in.
@MainActor enum SearchJump {
    private(set) static var pending: (note: UUID, query: String)?

    /// The list hands over the search as a note is picked while it shows.
    struct OnSelect: ViewModifier {
        let selection: Set<UUID>
        let search: String
        func body(content: Content) -> some View {
            content.onChange(of: selection) { _, new in
                if new.count == 1 { SearchJump.set(new.first, query: search) }
            }
        }
    }

    static func set(_ note: UUID?, query: String) {
        let q = query.trimmingCharacters(in: .whitespaces)
        pending = note.flatMap { q.isEmpty ? nil : ($0, q) }
    }

    /// The words, once, for this note.
    static func take(_ note: UUID) -> String? {
        guard let p = pending, p.note == note else { return nil }
        pending = nil
        return p.query
    }

    /// The first match below the title line (case and accents aside), in the editor's units.
    /// Nil when only the title holds it: the note opens at the top as usual.
    nonisolated static func range(of query: String, in body: String) -> NSRange? {
        let ns = body as NSString
        let titleEnd = ns.range(of: "\n").location
        guard titleEnd != NSNotFound else { return nil }
        let r = ns.range(of: query, options: [.caseInsensitive, .diacriticInsensitive], range: NSRange(location: titleEnd, length: ns.length - titleEnd))
        return r.location == NSNotFound ? nil : r
    }
}

/// Search shows every match (persona council round 1, Elena: Obsidian listed 9 hits where Pinto
/// listed 1). A found note shows its lines that hold the text, up to three, the text itself in
/// bold, then how many more lines in the note hold it: "4 more in this note". Go to Note (⌘O)
/// and the list's search both show them. Pure, so it is unit-tested (SearchLinesTests).
enum SearchLines {
    /// One line that holds the text: before it, the text as written there, after it.
    struct Line: Equatable, Sendable {
        let before: String
        let match: String
        let after: String
        var text: String { before + match + after }
    }

    struct Found: Equatable, Sendable {
        /// The first lines that hold it, in the note's order.
        let lines: [Line]
        /// How many more lines hold it.
        let more: Int
        var total: Int { lines.count + more }
    }

    /// Lines shown per note.
    static let shown = 3

    static func moreLine(_ count: Int) -> String {
        count == 1 ? "1 more in this note" : "\(count.formatted()) more in this note"
    }

    private static let options: String.CompareOptions = [.caseInsensitive, .diacriticInsensitive]
    /// A list row shares its line with the date, so little comes before the text or it's cut off
    /// the end (persona council r7g: "for: word…" for a search of word733).
    static let rowLead = 10

    /// The lines of `body` that hold `query` (case and accents aside), each with its markup taken
    /// out and cut to show the text near its start; `skipping` leaves out a line that reads as the
    /// title (the row shows it already). Nil when no line holds it.
    static func find(in body: String, query: String, skipping title: String? = nil, limit: Int = shown,
                     lead: Int = 28, length: Int = 120) -> Found? {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return nil }
        var lines: [Line] = [], more = 0
        for raw in body.split(separator: "\n", omittingEmptySubsequences: true) {
            guard raw.range(of: q, options: options) != nil, let line = line(raw, q, lead: lead, length: length) else { continue }
            if let title, line.text.trimmingCharacters(in: .whitespaces) == title.trimmingCharacters(in: .whitespaces) { continue }
            if lines.count < limit { lines.append(line) } else { more += 1 }
        }
        return lines.isEmpty ? nil : Found(lines: lines, more: more)
    }

    /// One line, as the list shows text if the text is still in it that way, else as written.
    static func line(_ raw: Substring, _ q: String, lead: Int = 28, length: Int = 120) -> Line? {
        for candidate in [WikiLinks.plain(NoteText.stripMarkup(String(raw))), String(raw)] {
            let line = candidate.trimmingCharacters(in: .whitespaces)
            guard let r = line.range(of: q, options: options) else { continue }
            var before = line[..<r.lowerBound]
            var cut = false
            if before.count > lead {
                before = before.suffix(lead)
                // Start at a word, not inside one.
                if let space = before.firstIndex(where: \.isWhitespace), before.distance(from: before.startIndex, to: space) < lead / 2 {
                    before = before[before.index(after: space)...]
                }
                cut = true
            }
            let after = line[r.upperBound...].prefix(max(length - before.count - line[r].count, 0))
            return Line(before: (cut ? "\u{2026}" : "") + before, match: String(line[r]), after: String(after))
        }
        return nil
    }

    /// A line as a row shows it: the text in the ink's semibold, the rest in `rest`.
    static func text(_ l: Line, rest: Color) -> Text {
        Text(l.before).foregroundStyle(rest) + Text(l.match).foregroundStyle(Color.ink).fontWeight(.semibold) + Text(l.after).foregroundStyle(rest)
    }
}

#if os(macOS)
/// Another folder with nothing of it open: its top note opens, as in Notes (round 23: Ideas opened
/// on "No note selected"). A turn later, once the note that isn't here has closed.
private struct OpensTopNote: ViewModifier {
    let scope: Scope
    let top: UUID?
    /// Whether a note is in this folder's list.
    let lists: (UUID) -> Bool
    @Binding var selection: Set<UUID>

    func body(content: Content) -> some View {
        content.onChange(of: scope) { _, _ in
            // In the same update as the folder: the list and its top note show together. A turn
            // later, the note side was emptied first and built again for the top note, a frame
            // or two after the list (Emil, 12 November 2026: "switching between folders is not
            // fast enough"). A note still open that this list shows stays open, as before.
            if let top, !selection.contains(where: lists) { selection = [top] }
        }
    }
}
#endif

#if os(macOS)
/// macOS 27 draws a second, bright divider beside the note, and no setting turns it off. It's hidden
/// by the system's name: if that changes, it simply comes back. The divider still drags. The bar's
/// edge and the pinned date headings stay the system's, as in Notes (measured 7 November 2026): one
/// frosted band, a hairline under the bar and under the pinned heading, no change on hover.
struct ListEdgeQuiet: ViewModifier {
    /// Which list is showing: another folder is another list, a new table.
    var list: ListIdentity?

    func body(content: Content) -> some View {
        content.background { ListEdgeLine(list: list) }
    }
}

extension NSTableView {
    /// See `ListEdgeLine.installHooks`. Swapped with the originals, so the calls inside run them.
    @objc func pane_setFloatsGroupRows(_ on: Bool) {
        pane_setFloatsGroupRows(on && ListEdgeLine.mayPin(self))
    }

    @objc func pane_viewDidMoveToWindow() {
        pane_viewDidMoveToWindow()
        ListEdgeLine.pin(self)
    }

    @objc func pane_tile() {
        pane_tile()
        ListEdgeLine.pin(self)
    }
}

/// A view held without keeping it.
final class Weak<T: AnyObject> {
    weak var value: T?
    init(_ value: T) { self.value = value }
}

struct ListEdgeLine: NSViewRepresentable {
    /// Which list is showing (see `ListEdgeQuiet`).
    var list: ListIdentity?

    final class Probe: NSView {
        private var last = Date.distantPast
        /// The list last followed.
        var list: ListIdentity?

        /// Another list is showing: its table is new, and SwiftUI starts a table with its headings
        /// pinned, a band and a line under "Today" with nothing scrolled under it. The window's
        /// updates are looked at once a second at most, so a folder opened within that second kept
        /// the band until the next one (Emil, 9 November 2026: All Notes banded, the folder plain).
        /// The new table is followed as soon as it's there, before it's drawn.
        func listChanged() {
            for wait in [0.0, 0.05, 0.25] {
                DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
                    guard let self else { return }
                    self.last = .distantPast
                    self.hide()
                }
            }
        }
        private var watch: NSObjectProtocol?
        /// The tables being followed: each one's clip view and scroll watcher. The clip is kept
        /// (weakly) because a new table can take a gone one's address: it gets a watcher of its own.
        private var scrolls: [ObjectIdentifier: (clip: Weak<NSClipView>, watch: NSObjectProtocol)] = [:]

        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            if let watch { NotificationCenter.default.removeObserver(watch) }
            watch = nil
            guard window != nil else { return }
            watch = NotificationCenter.default.addObserver(forName: NSWindow.didUpdateNotification, object: window, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.hide() }
            }
        }

        private func hide() {
            guard Date.now.timeIntervalSince(last) > 1, let frame = window?.contentView?.superview, let root = frame.layer else { return }
            last = .now
            ListEdgeLine.hideLines(in: root)
            func walk(_ v: NSView) {
                if String(describing: type(of: v)) == "NSSplitDividerView", v.frame.width >= 1 { v.alphaValue = 0 }
                if let table = v as? NSTableView { follow(table) }
                v.subviews.forEach(walk)
            }
            walk(frame)
        }

        /// Follows a list's scrolling: its heading pins only once there is something under it.
        private func follow(_ table: NSTableView) {
            guard table.style != .sourceList, let scroll = table.enclosingScrollView else { return }
            let key = ObjectIdentifier(table)
            let clip = scroll.contentView
            if scrolls[key]?.clip.value !== clip {
                if let old = scrolls[key] { NotificationCenter.default.removeObserver(old.watch) }
                // Tables that are gone: their watchers go too.
                for (k, v) in scrolls where v.clip.value == nil { NotificationCenter.default.removeObserver(v.watch); scrolls[k] = nil }
                clip.postsBoundsChangedNotifications = true
                let watch = NotificationCenter.default.addObserver(forName: NSView.boundsDidChangeNotification, object: clip, queue: .main) { [weak table, weak scroll] _ in
                    MainActor.assumeIsolated {
                        guard let table, let scroll else { return }
                        ListEdgeLine.pin(table, in: scroll)
                    }
                }
                scrolls[key] = (Weak(clip), watch)
            }
            ListEdgeLine.pin(table, in: scroll)
        }

        deinit {
            MainActor.assumeIsolated { scrolls.values.forEach { NotificationCenter.default.removeObserver($0.watch) } }
        }
    }

    /// Whether a list scrolled to `offset` pins its heading. At the top the heading is a plain row:
    /// no band or line with nothing under them (Emil, 7 November 2026). `headingTop` is where the
    /// first heading sits in the list (the list's top padding): AppKit draws a pinned heading at
    /// the edge, so pinning before the heading got there pulled it up that far in one frame, with
    /// a band and a line. A list a few points down (All Notes revealing the open note) showed its
    /// "Today" jumped up and banded while the folder beside it didn't (Emil, 9 November 2026).
    static func pins(offset: CGFloat, topInset: CGFloat, headingTop: CGFloat = 0) -> Bool {
        let edge = offset + topInset
        return edge > 1 && edge >= headingTop - 0.5
    }

    /// Whether a table may pin its headings where its list is now: by the rule above for a list
    /// (not the sidebar's source list), always for anything else.
    static func mayPin(_ table: NSTableView) -> Bool {
        guard table.style != .sourceList, let scroll = table.enclosingScrollView else { return true }
        let headingTop = table.numberOfRows > 0 ? table.rect(ofRow: 0).minY : 0
        return pins(offset: scroll.contentView.bounds.minY, topInset: scroll.contentInsets.top, headingTop: headingTop)
    }

    /// A table's headings pinned or not, by where its list is scrolled.
    static func pin(_ table: NSTableView) {
        guard table.style != .sourceList, let scroll = table.enclosingScrollView else { return }
        pin(table, in: scroll)
    }

    /// SwiftUI builds a new table for each folder with its headings pinned, and turns pinning on
    /// again when it updates one. Turned off after the table showed, its first frames had "Today"
    /// up at the edge with a band and a line, and sometimes it stayed (Emil, 9 November 2026: "the
    /// header band is still switching"). So the rule is kept where it's decided: pinning asked for
    /// at rest is refused as it's set, and a table is set right as it joins its window and each
    /// time it lays out its rows, all before it draws. Done once for the app.
    static let installHooks: Void = {
        swap(#selector(setter: NSTableView.floatsGroupRows), #selector(NSTableView.pane_setFloatsGroupRows(_:)))
        swap(#selector(NSView.viewDidMoveToWindow), #selector(NSTableView.pane_viewDidMoveToWindow))
        swap(#selector(NSTableView.tile), #selector(NSTableView.pane_tile))
    }()

    /// Swaps NSTableView's `original` with `hooked`. A method NSTableView only inherits is first
    /// given to NSTableView itself, so the superclass's stays as it is.
    private static func swap(_ original: Selector, _ hooked: Selector) {
        let cls: AnyClass = NSTableView.self
        guard let mine = class_getInstanceMethod(cls, hooked), let theirs = class_getInstanceMethod(cls, original) else { return }
        if class_addMethod(cls, original, method_getImplementation(mine), method_getTypeEncoding(mine)) {
            class_replaceMethod(cls, hooked, method_getImplementation(theirs), method_getTypeEncoding(theirs))
        } else {
            method_exchangeImplementations(theirs, mine)
        }
    }

    private static func pin(_ table: NSTableView, in scroll: NSScrollView) {
        let headingTop = table.numberOfRows > 0 ? table.rect(ofRow: 0).minY : 0
        let on = pins(offset: scroll.contentView.bounds.minY, topInset: scroll.contentInsets.top, headingTop: headingTop)
        if table.floatsGroupRows != on { table.floatsGroupRows = on }
    }

    func makeNSView(context: Context) -> Probe {
        ListEdgeLine.installHooks
        let probe = Probe()
        probe.list = list
        return probe
    }

    func updateNSView(_ view: Probe, context: Context) {
        guard view.list != list else { return }
        view.list = list
        view.listChanged()
    }

    /// Hides the toolbar edge's separator and the split view's divider ground under `root`.
    static func hideLines(in root: CALayer) {
        func walk(_ l: CALayer) {
            if l.name == "DividerBackground", l.bounds.width >= 1 { l.isHidden = true }
            l.sublayers?.forEach(walk)
        }
        walk(root)
    }
}
#endif
